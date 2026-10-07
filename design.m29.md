# M29 — Deploy VocaBloom lên Firebase Cloud Functions (dùng được từ mạng công ty)

> Trạng thái: **✅ DUYỆT 2026-10-07**. Plan: [`design.m29a.md`](design.m29a.md).

## 1. Bối cảnh & yêu cầu đã chốt (2026-10-07)

Mạng công ty chặn web ngoài: Vercel ✗, Firebase Hosting (`*.web.app`) ✗, **Firebase Functions ✓**.

| # | Câu hỏi | Người dùng chốt |
|---|---|---|
| Q1 | URL function vào được | **Cả 2** dạng; ưu tiên `https://<vùng>-<project>.cloudfunctions.net/<tên>`. Project ID: **`vocabloom-helios`** |
| Q2 | Domain ngoài từ mạng công ty | Google (fonts, TTS) **có lẽ** vào được · `supabase.co`, `openrouter.ai` **chắc chắn KHÔNG** |
| Q3 | Vercel | **Giữ nguyên** chạy song song |
| Q4 | Vùng | **`asia-southeast1`** (Singapore) |
| Q5 | Git | Làm **thẳng trên `main`** (không tạo nhánh) — với điều kiện bản Vercel không bị ảnh hưởng (xem §4) |

## 2. Kiến trúc

Một Cloud Function (Gen 2) tên **`vocabloom`** vừa phục vụ giao diện vừa chuyển tiếp API. Trình duyệt chỉ nói chuyện với **một domain**.

```
https://asia-southeast1-vocabloom-helios.cloudfunctions.net/vocabloom/...
  ├─ /sb/*   → https://<ref>.supabase.co/*                 (Auth, REST, RPC, Storage mp3)
  ├─ /or/*   → https://openrouter.ai/api/v1/*              (AI chấm + giải thích)
  ├─ /tts/*  → https://texttospeech.googleapis.com/*       (bảo hiểm — 1 dòng whitelist)
  └─ còn lại → file tĩnh trong functions/web/ ; không có file ⇒ index.html (SPA)
```

**Nguyên tắc:**
- **Function không giữ khoá bí mật nào.** Khoá OpenRouter và Google TTS vẫn đọc từ bảng `settings` ở trình duyệt rồi gửi kèm request như hiện nay; function chỉ chuyển tiếp. Anon key Supabase vốn là khoá công khai.
- **Không phải proxy mở.** Function chỉ chuyển tới đúng 3 gốc cố định; mọi đường khác chỉ trả file tĩnh.
- **Cùng origin ⇒ không có CORS.** Không cần cấu hình CORS ở đâu cả.
- **Database, RLS, cron, migration: KHÔNG đổi gì.** Supabase không biết có proxy.
- **Bản Vercel không đổi hành vi.** Mọi thay đổi phía client chỉ bật khi build bằng `--mode firebase`.

### 2.1 Đường dẫn gốc `/vocabloom/` — chạy được cả URL (a) lẫn (b)

- App build với `base: '/vocabloom/'` và `BrowserRouter basename="/vocabloom"`.
- Server **bỏ tiền tố `/vocabloom` nếu có** trước khi xử lý ⇒ cùng một bản build chạy được ở:
  - (a) `https://asia-southeast1-vocabloom-helios.cloudfunctions.net/vocabloom/`
  - (b) `https://vocabloom-<hash>-as.a.run.app/vocabloom/`
  (Không phụ thuộc việc Google có tự cắt tên function khỏi path hay không.)

### 2.2 Thay đổi phía client (chỉ hiệu lực khi `VITE_PROXY` có giá trị)

Biến mới duy nhất: **`VITE_PROXY=/vocabloom`** trong `.env.firebase` (không bí mật ⇒ được commit). Đây là nguồn sự thật duy nhất cho tiền tố.

| Chỗ | Bản Vercel (VITE_PROXY rỗng) | Bản Firebase |
|---|---|---|
| `vite.config.ts` `base` / `outDir` | `/` · `dist/` | `/vocabloom/` · `functions/web/` |
| `main.tsx` `basename` | không đặt | `/vocabloom` (lấy từ `import.meta.env.BASE_URL`) |
| `supabase.ts` `createClient(url)` | `VITE_SUPABASE_URL` | `location.origin + /vocabloom/sb` |
| `ai.ts` URL | `https://openrouter.ai/api/v1/...` | `/vocabloom/or/chat/completions` |
| `tts.ts` URL Google | `https://texttospeech.googleapis.com/...` | `/vocabloom/tts/v1/text:synthesize` |
| `phatAm()` phát `audio_url` | phát nguyên URL | URL `supabase.co` ⇒ đổi gốc sang `/vocabloom/sb` |
| `genAudioChoTu()` lưu `audio_url` | `getPublicUrl` | **vẫn lưu URL `supabase.co` GỐC** (không lưu URL proxy vào DB, nếu không bản Vercel hỏng) |

Các hàm đổi URL nằm ở file thuần mới `src/lib/proxy.ts` ⇒ **làm theo TDD**.

Font: giữ Google Fonts. Nếu bị chặn, `tokens.css` đã có `system-ui` dự phòng (chữ Hán rơi về font Trung có sẵn của Windows). Không tự host.

### 2.3 Phía server — thư mục `functions/` mới

```
functions/
  package.json      # deps: firebase-functions, firebase-admin (bắt buộc tối thiểu của Firebase)
  index.js          # onRequest({ region, memory 256MiB, timeout 120s, maxInstances 2 }, xuLy)
  proxyCore.js      # hàm THUẦN: phân loại đường dẫn, lọc header gửi/trả, chặn ../ — test bằng node:test
  proxyCore.test.js # node --test (có sẵn trong Node, không cài package test)
  .env              # SUPABASE_URL=https://<ref>.supabase.co (không bí mật)
  web/              # output build — .gitignore
firebase.json · .firebaserc   # ở gốc dự án
```

**Bẫy đã biết trước (đưa vào test):**
1. `fetch` của Node **tự giải nén** body ⇒ khi trả về phải **bỏ** `content-encoding` và `content-length`, nếu không trình duyệt sẽ giải nén lần nữa và hỏng.
2. Không chuyển tiếp `host`, `connection`, `cookie` và các header hop-by-hop; giữ `authorization`, `apikey`, `prefer`, `range`, `content-type`, `x-client-info`, `accept-profile`/`content-profile`, `x-upsert`.
3. Trả về phải giữ `content-range` (supabase-js đọc nó để `count: 'exact'`, ví dụ `demTuThieuAudio`).
4. Body gửi lên lấy từ `req.rawBody` (Firebase giữ sẵn), kể cả upload mp3 lên Storage.
5. Cache tĩnh: `assets/*` (tên có hash) ⇒ `max-age=1 năm, immutable`; `index.html` ⇒ `no-cache` (deploy bản mới là thấy ngay).
6. Đường dẫn tĩnh chứa `..` ⇒ 404 (không đọc ra ngoài `web/`).

### 2.4 Chạy & deploy

- `npm run build:firebase` = `tsc -b && vite build --mode firebase`
- `npm run deploy:firebase` = build + `firebase deploy --only functions:vocabloom`
- Firebase CLI cài **toàn cục** (`npm i -g firebase-tools`) — không thêm vào `package.json` của app.
- Không dùng `predeploy` trong `firebase.json` (biến `$RESOURCE_DIR` khác cú pháp giữa PowerShell và bash ⇒ dễ vỡ trên Windows).

## 3. Việc người dùng phải tự làm (hướng dẫn từng bước sẽ nằm trong Plan)

1. Firebase Console → project `vocabloom-helios` → **nâng gói Blaze** (Functions bắt buộc Blaze).
2. Google Cloud Console → Billing → **Budget & alerts**: đặt ngân sách ví dụ 1–2 USD/tháng, cảnh báo 50/90/100%.
   - Một người dùng ≈ vài nghìn request/tháng ≪ hạn mức miễn phí (2 triệu lượt gọi Functions/tháng).
   - Chi phí ẩn duy nhất đáng để ý: ảnh container ở Artifact Registry (~vài trăm MB). Khi CLI hỏi "cleanup policy" thì chọn giữ 1 ngày.
3. `npm i -g firebase-tools` → `firebase login` (đăng nhập tài khoản Google sở hữu project — cần trình duyệt, làm ở nhà).
4. Chạy `npm run deploy:firebase` (lần đầu CLI sẽ tự bật Cloud Build / Artifact Registry / Cloud Run API, mất ~3–5 phút).
5. Ở công ty: mở URL (a), đăng nhập, ôn thử 1 lượt, bấm "Giải thích" để kiểm AI.

## 4. Làm thẳng trên `main` — vì sao Vercel KHÔNG bị ảnh hưởng

Người dùng chốt (2026-10-07): không tạo nhánh `firebase`, sửa thẳng `main`, với điều kiện Vercel giữ nguyên. Điều kiện này đứng được vì:

| Rủi ro | Vì sao an toàn |
|---|---|
| Vercel đọc nhầm `.env.firebase` | Vercel chạy `vite build` ở mode `production` ⇒ Vite chỉ nạp `.env`, `.env.production` (và `.local`). `.env.firebase` chỉ nạp khi có `--mode firebase`. |
| `base`, `outDir`, `basename` đổi | Cả 3 tính từ `VITE_PROXY`. Biến rỗng ⇒ `/`, `dist/`, không basename — y hệt hiện nay. |
| URL Supabase/AI/TTS đổi | Hàm trong `proxy.ts` trả **nguyên URL gốc** khi `VITE_PROXY` rỗng — có test riêng cho nhánh này. |
| Thư mục `functions/` mới | Vercel chỉ cài `package.json` ở gốc và không coi `functions/` là serverless (Vercel dùng `api/`). `functions/web/` nằm trong `.gitignore` nên không bị đẩy lên. `tsc -b` và `vitest` chỉ quét `src/`. |

**Kiểm chứng bắt buộc** (thêm vào §5): `npm run build` thường ⇒ `dist/` **không chứa** chuỗi `/vocabloom`, `/sb/`, `/or/`; còn chứa `openrouter.ai` và `supabase.co` như cũ.

Claude không `git add`/`commit` — người dùng tự commit lên `main`. Vercel sẽ tự deploy lại bản build thường như mọi lần.

## 5. Kiểm chứng (trước khi báo xong)

1. `npm test` (kèm test `proxy.ts` mới) · `node --test functions/` · `npm run build` (bản Vercel) · `npm run build:firebase` · lint.
2. **Kiểm bản Vercel không đổi:** `dist/` build thường không chứa chuỗi `/vocabloom`.
3. Chạy local bằng Firebase Emulator (`firebase emulators:start --only functions`, không cần Java) + CDP:
   - đăng nhập, Dashboard có số liệu, phát 1 mp3, gọi AI 1 lần;
   - **0 request tới `supabase.co` / `openrouter.ai` từ trình duyệt** (mọi thứ đi qua `/vocabloom/`).
4. Deploy thật, chạy lại bước 3 trên URL (a) và (b).
5. Người dùng kiểm ở mạng công ty (bước cuối, Claude không làm thay được).

## 6. Ngoài phạm vi (YAGNI)

- Firebase Hosting, custom domain, tự host font, `minInstances` (cold start ~2–4 giây là chấp nhận được).
- Chuyển khoá AI/TTS sang server (Secret Manager). Hiện khoá đã nằm trong DB sau RLS, giữ nguyên MB-04.
- Proxy cho các script CLI trong `scripts/` (chạy ở nhà, gọi thẳng Supabase).
