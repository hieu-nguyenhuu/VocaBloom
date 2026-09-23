# System Patterns — VocaBloom

> ⚠️ File này đã được VIẾT LẠI TOÀN BỘ ngày 2026-08-23. Bản cũ là template sót lại của một dự án khác
> (nói về Convex Cloud, "Mục tiêu tiết kiệm", `PcView.html` 8 màn) — KHÔNG áp dụng cho VocaBloom.

## 1. Tech stack (chốt theo `SPECIFICATION.md` §1.1)

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Frontend | **React 19 + Vite 8** | ✅ Đã scaffold 2026-09-06 (M0). TS strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` |
| Styling | **Tailwind CSS v4** (CSS-first) | ✅ `src/styles/tokens.css` 4 tầng. KHÔNG có `tailwind.config.js` — token khai bằng `@theme inline` ngay trong CSS (MB-07) |
| Test | **Vitest 5** | `npm test`. Test chạy trong Node → tách `tsconfig.test.json`, app giữ thuần browser |
| Backend/DB | **Supabase** (Postgres + Storage + pg_cron) | KHÔNG phải Convex |
| AI chấm bài + giải thích | **OpenRouter** | Model + API key do người dùng cấu hình ở màn Cài đặt (lưu bảng `settings`) |
| TTS | **Google Cloud TTS** giọng `cmn-CN-Neural2-*` | Gọi 1 lần/từ sau Import, cache mp3 vào Supabase Storage |
| Fallback audio | **Web Speech API** | Dùng khi `vocab.audio_url` chưa sẵn sàng |

**Dependency gatekeeping (`ponytail`):** trước khi `npm install` bất cứ gì, phải xác nhận stack trên + HTML5/CSS3 native không giải quyết được, và nêu lý do 1 dòng. Ưu tiên `<dialog>`, `<input>` native, CSS Grid, `Intl`, `crypto.randomUUID()` hơn package ngoài.

## 2. Cấu trúc thư mục dự kiến (dựng dần, không tạo trước khi cần)

```
/src
  /components         # UI thuần trình bày
  /features           # Nhóm theo màn: dashboard, player, vocab, import, settings, notifications
  /lib
    srs.ts            # SRS engine — hàm thuần, KHÔNG import React/Supabase (để test được)
    supabase.ts       # Khởi tạo client duy nhất
    ai.ts             # OpenRouter: chấm bài §7 + giải thích §8
    tts.ts            # Google TTS + upload Storage
    importValidate.ts # Validate file JSON import §10.5
  /styles/tokens.css  # Lớp 1 (raw hex) + Lớp 2 (semantic token)
/supabase
  /migrations         # SQL §2 của SPECIFICATION.md
  /functions          # run_daily_maintenance() + pg_cron
```

**Quy tắc tách lớp quan trọng nhất:** toàn bộ logic SRS (promote, gap_factor, phạt, cộng điểm, build session, chấm đúng/sai) nằm ở hàm **thuần** trong `/src/lib` — không dính React state, không dính network. Đây là điều kiện để chạy TDD theo `CLAUDE.md` Bước 3.

## 3. Nguồn thiết kế UI — TÊN FILE THẬT (đừng dùng tên trong tài liệu cũ)

| File thật trong repo | Nội dung |
|---|---|
| `VocaBloom_PCView.html` | **18 màn** PC (`01`–`18`), mỗi màn có thêm bản `(Dark)` → 36 khung |
| `VocaBloom_MobileView.html` | **19 màn** Mobile (`01`–`19`), mỗi màn có bản `(Dark)` → 38 khung |
| `UI_DESIGN.md` | Diễn giải token/màu/typography + đặc tả từng màn PC & Mobile |

⚠️ `UI_DESIGN.md` gọi 2 file này bằng tên cũ `PcView.html`/`MobileView.html` và có chỗ ghi "8 màn hình" — **tên và số màn thật là bảng trên**. Định danh màn bằng `data-screen-label="..."`; hậu tố `(Dark)` = bản dark mode của ĐÚNG màn đó, không phải màn mới.

**Thứ tự ưu tiên khi mâu thuẫn:** `VocaBloom_*View.html` **>** `UI_DESIGN.md` **>** `.claude/skills/taste/SKILL.md`.

**Bắt buộc:** giá trị cụ thể (hex, spacing, radius) không có trong `UI_DESIGN.md` §3/§9 → **trích thẳng từ file HTML** (grep hex / parse thuộc tính style), KHÔNG suy đoán từ màu gần giống.

> ⚠️ **Đính chính 2026-09-06:** bảng màu bản cũ ghi card bài tập là `#FFF8F0` — **mã này KHÔNG tồn tại**
> trong cả 2 file HTML (đã grep toàn bộ). Card bài tập màn 02 thật dùng `#FFFFFF` + `#FBFAF6`.

### 🚫 6 mã màu VỎ GALLERY — cấm đưa vào token
Đây là màu của **trang trưng bày mockup**, không phải màu app. Bằng chứng đếm được
(`node scripts/extract-colors.mjs`, đã tách 37 frame light / 37 frame dark):

| Mã | Bằng chứng | Thực chất |
|---|---|---|
| `#8B7FA8` | đúng 37 light + 37 dark, luôn `color:` | nhãn `01 · Dashboard` trên mỗi khung |
| `#EFEAE0` | 38 lần `border:1px solid`, 0 lần ở dark | viền khung 1280×800 (1 lần còn lại là panel thật → dùng `--vb-border-card`) |
| `#F3F0E9` | 2 lần, `background` ngoài cùng | nền trang gallery |
| `#E6E0D2` | 2 lần, `border-bottom` header | viền header gallery |
| `#101116` | 2 lần, `background` | dải nền bọc khu vực dark |
| `#8B8F98` | 2 lần, `color` | dòng chú thích "Cùng 18 màn, chỉ khác..." |

`src/styles/tokens.test.ts` tự động chặn 6 mã này — không cần nhớ thủ công.

**Lưu ý khi đọc 2 file HTML:**
- Khung `1280×800` + `box-shadow` bọc ngoài mỗi màn = vỏ gallery, **không copy vào app**.
- Toàn bộ màu là **inline style**, không có biến CSS → phải tự dựng lại theo token 2 lớp (§4).
- File tham chiếu `./support.js` — chỉ phục vụ cuộn gallery lúc xem, **không có trong repo và không cần port**.
- Đọc comment ở đầu mỗi file HTML trước khi code (5 cảnh báo tóm tắt).

## 4. Kiến trúc token 2 lớp (bắt buộc, `UI_DESIGN.md` §2)

Lớp 1 = giá trị hex thô (nơi DUY NHẤT sửa khi đổi phong cách). Lớp 2 = token ngữ nghĩa; **component chỉ được dùng Lớp 2**.

**Ngoại lệ tuyệt đối:** 6 mã màu Mastery Ring (`#ef4444` `#f97316` `#eab308` `#a3e635` `#4ade80` `#16a34a`) gắn với ý nghĩa DỮ LIỆU thật → giữ cố định, KHÔNG đi qua token, KHÔNG đổi giữa light/dark.

### Bảng màu lõi
| Vai trò | Light | Dark |
|---|---|---|
| Nền content | `#FFFFFF` | `#22252C` |
| Nền sidebar | `#FBFAF6` | `#17191E` |
| Nền khung app ngoài | — | `#15171C` |
| Nền card | `#FBFAF6` · `#FFFFFF` (card bài tập) | `#1E2128` |
| Viền card | `#F0ECE4` | `#2A2D35` |
| Viền input/đáp án trung tính | `#E5E5E5` | *(trích từ file)* |
| Chữ chính / phụ | `#241B3A` / `#8B8593` | `#EDEEF0` / `#9A9BA8` |
| **Accent chính — Tím** | `#5B4FE8` (tint `#EDEBFC`, text `#4338CA`) | `#8B80FF` (tint `#262148`) |
| **Accent phụ — Xanh dương** | `#0369A1` (tint `#E3F4FD`) | *(trích từ file)* |
| **Accent trang trí — Hồng** | icon `#E0449E`, text `#A21467`, nền `#FCE4F1` | `#F472B6` / `#F9A8D4` / `#3A1830` |
| Feedback sai / gợi ý / đúng | `#ef4444` · `#eab308` · `#4ade80` (tái dùng ring ramp) | như light |

**Color Consistency Lock:** Tím = MỌI hành động chính (nút, nav active, focus, progress dot, highlight từ vựng trong hội thoại). Hồng = CHỈ streak/badge thành tích, không bao giờ đặt trên phần tử click được. Xanh dương = CHỈ hành động phụ ("Ôn theo chủ đề"). Ring ramp = CHỈ ngữ cảnh mastery/điểm số.

**Dark mode = 3 tầng nền** (`#15171C` → `#17191E` → `#22252C`), không phải 2 tầng phẳng bg/card.

### Typography
| Vai trò | Font |
|---|---|
| Display (tiêu đề, số liệu lớn) | **Baloo 2** 600–700 |
| Body tiếng Việt/Latin | **Be Vietnam Pro** 400–500 |
| Chữ Hán (mọi nội dung học) | **Noto Sans SC** 600 (từ chính) / 400 (phụ) — ưu tiên rõ nét sư phạm, KHÔNG dùng font thư pháp |

### Icon
Toàn app dùng **SVG path vẽ tay trích từ 2 file HTML** (`stroke-width` 1.7–1.8, `stroke-linecap:round`). **Không trộn icon font** (Lucide/Tabler/Phosphor). Icon phiên âm giữ nguyên ký tự **"拼"**, không đổi sang eye-icon generic. Trạng thái "đang bật phiên âm" chưa có trong mockup → tự quyết khi code (gợi ý: đổi sang accent tím).

> ✅ **Bộ 6 icon giai đoạn cây ĐÃ CHỐT 2026-09-16 (MB-19)** — dùng `IconCay({ stage, size })` trong `src/components/icons.tsx`, KHÔNG dùng SVG nháp trong 2 file HTML (đã lỗi thời). Gate MB-03 gỡ.

## 5. Responsive

**2 mockup riêng biệt, không phải 1 layout fluid** — nhiều màn (nhất là Player) đổi hẳn bố cục:
- **Mobile:** 1 cột, khung ~420px, **thanh tab dưới** 5 mục (Dashboard / Ôn tập / Từ vựng / Import / Cài đặt), chuông thông báo ở header.
- **PC:** **sidebar trái cố định** cùng 5 mục + chuông ở cuối sidebar; content max-width ~720px căn giữa (không kéo full-width).
- **Player ở PC:** shell giữ ~420–480px **căn giữa**, KHÔNG giãn full-width. Hội thoại max-width ~560px; Tổng kết phiên ~480px.
- Dùng `min-h-[100dvh]`, KHÔNG dùng `h-screen` / `100vh`. Chia cột bằng CSS Grid, không tính phần trăm bằng flex.

## 6. Mô hình dữ liệu (**12 bảng** — SQL đầy đủ ở `SPECIFICATION.md` §2)

> ⚠️ **Đính chính 2026-09-23 (M14):** thêm bảng thứ **12** `nhat_ky_ngay` (nhật ký học theo ngày,
> migration `0014`) — KHÔNG có trong `SPECIFICATION.md` §2.
>
> ⚠️ **Đính chính 2026-09-22 (M12):** thêm bảng thứ **11** `topic_grammar` (ngữ pháp CỦA CHỦ ĐỀ,
> migration `0013`) — KHÔNG có trong `SPECIFICATION.md` §2.
>
> ⚠️ **Đính chính 2026-09-09:** `SPECIFICATION.md` §2 đánh số **9 nhóm** nhưng nhóm 2 chứa
> **2 bảng** (`vocab` + `vocab_topics`) → tổng lúc đó là **10 bảng**. Bản cũ của file này ghi "9 bảng".
> Đếm nhầm = bỏ sót `vocab_topics` khi bật RLS ⇒ hở toàn bộ quan hệ từ vựng ↔ chủ đề.
> Mọi script/migration phải liệt kê tên bảng **tường minh**, không đếm theo trí nhớ.

`topics` · `vocab` · `vocab_topics` (n-n) · `word_state` (lõi SRS, PK = `vocab_id`) · `daily_retry_queue` · `exercises` (payload JSONB + `ai_explanation` lazy-cache) · `review_log` (có `stage_before`/`stage_after`, ghi ở MỌI dòng) · `topic_dialogues` (1 topic = 1 hội thoại) · `notifications` · `settings` (key-value) · **`topic_grammar`** (M12 — ngữ pháp của chủ đề, 1 topic ↔ 0…n mục, `on delete cascade`).

⚠️ **`nhat_ky_ngay` CỐ Ý KHÔNG CÓ KHOÁ NGOẠI NÀO (M14).** Đó không phải thiếu sót — đó là toàn bộ
lý do bảng tồn tại. `review_log.vocab_id` có `on delete cascade`, nên xoá từ vựng là xoá luôn lịch
sử học; streak/số phút phải nằm ở nơi cascade không với tới. **Đừng "sửa" bằng cách thêm FK.**

**2 loại ngữ pháp — đừng lẫn (M12):** `exercises.type = 'grammar'` là ngữ pháp **CỦA TỪ** (gắn 1 vocab,
dạng CÓ ĐIỀU KIỆN — chỉ gắn khi từ dễ dùng sai); bảng `topic_grammar` là ngữ pháp **CỦA CHỦ ĐỀ**
(không gắn từ nào, không tính điểm, không vào SRS).

Enum: `word_stage` = new / stage1 / stage2 / stage3 / intensive / mastered · `exercise_type` = 17 giá trị.

**Hằng số nghiệp vụ (gom 1 chỗ, không rải rác):** `MASTER_THRESHOLD = 30`; ngưỡng cycle 3/4 · 6/8 · 9/12; điểm mỗi bài 1 · 2 · 3 · 4; gap gốc 1 · 2 · 4 · 7 ngày; `gap_factor` 100% / 70% / 50% theo health; phạt −1…−5 theo stage (mastered miễn nhiễm); dùng gợi ý → điểm ×50% làm tròn xuống.

## 7. Pattern nghiệp vụ dễ làm sai (ghi lại để khỏi vấp)

1. **Session thuần 1 stage**, order `stage ASC, next_review_date ASC`. "5 từ" là lý tưởng, không ép cứng.
2. **Select/Fill Dialog dùng chung 1 record cho 2 từ** — từ B tham chiếu qua `payload->>'blank_b_vocab_id'`. Query session phải OR cả 2 điều kiện để câu chỉ xuất hiện đúng 1 lần. CHỈ cộng điểm cho từ đang due.
3. **Retry KHÔNG chạy ngay trong session** — dồn vào `daily_retry_queue`, chạy lượt riêng sau. Chỉ retry bài CHƯA đạt (đọc `cycle_completed_exercises`).
4. **Tổng kết phiên query `review_log` cả ngày**, tuyệt đối không tích lũy state phía client (mất dữ liệu khi thoát app giữa chừng).
5. **Dashboard "Khu vườn"**: hàng đếm 6 giai đoạn dùng màu tượng trưng theo stage; cụm ring cá nhân dùng màu theo `total_points` thật → **2 query khác nhau**, đừng dùng chung.
6. **Ring** vẽ bằng SVG `stroke-dasharray` đúng tỉ lệ `min(total_points,30)/30` — KHÔNG conic-gradient, KHÔNG vòng luôn đầy. Grammar / Flashcard / Matching KHÔNG có ring.
7. **Chọn sai chỉ tô ô vừa chọn** (đỏ); các ô còn lại giữ trung tính — không lộ đáp án đúng.
8. **Import theo thứ tự:** insert `vocab` trước → map `temp_id → uuid` → mới insert `exercises`/`dialogue`. KHÔNG tra cứu theo `word` (sẽ dính bản ghi cũ). Trùng từ = **luôn thêm mới**, chỉ cảnh báo không chặn.
9. **AI response** parse JSON thuần; fail → strip code-fence parse lại 1 lần → vẫn fail thì không cộng điểm cho từ đó, hiện nút "Chấm lại" và GIỮ NGUYÊN câu đã nhập.
10. **Trạng thái rỗng / loading / lỗi là bắt buộc** cho mọi view có dữ liệu (skeleton đúng shape layout, không spinner chung chung).

## 8. Chuẩn code & an toàn

- **Diff patch cục bộ**, cấm viết lại file lớn (`token-discipline`).
- **TypeScript strict**, không dùng `any` để né mô hình hóa kiểu.
- **Validate ở biên tin cậy**: file import, form sửa từ, response AI — validate trước khi ghi DB.
- **RLS / constraint không được bỏ qua** để tiết kiệm dòng code.
- **AI/TTS gọi thẳng từ browser** (MB-04) — không proxy qua Edge Function. Khóa OpenRouter đọc runtime từ bảng `settings`, không nhúng vào build.
- **Bí mật:** chỉ `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` được phép lộ ra client. `OPENROUTER_API_KEY`, `GOOGLE_TTS_API_KEY`, `SUPABASE_ACCESS_TOKEN` **KHÔNG BAO GIỜ** gắn prefix `VITE_` (Vite ship thẳng ra browser). `.env.local` đã nằm trong `.gitignore` — giữ nguyên.
- **Git:** agent TUYỆT ĐỐI không `git add` / `commit` / `push`. Trước khi báo xong phải có bằng chứng build/test xanh.
- **Dọn process:** kết thúc task phải tắt mọi tiến trình nền do phiên tạo (dev server, Chrome headless, script node).

## 9. Database — công cụ & luật bất biến (từ M1, 2026-09-09)

| Lệnh | Tác dụng |
|---|---|
| `npm run db:migrate` | Chạy `supabase/migrations/*.sql` qua Supabase **Management API** (không dùng CLI) |
| `npm run check:schema` | Nghiệm thu 14 mục: bảng/enum/index/RLS/policy/GRANT/cron + 2 phép thử RLS bằng HTTP thật |
| `npm run test:db` | 9 ca TDD cho `run_daily_maintenance()`, chạy trong `begin…rollback` |
| `npm run check:auth` | Kiểm chứng tài khoản duy nhất + `disable_signup` |
| `npm run test:import` | 6 ca TDD cho `import_topic()`, cũng chạy trong `begin…rollback` |
| `npm run import:file -- <file> [--dry-run]` | Nạp 1 file JSON thật; đăng nhập rồi gọi RPC như app |

**4 luật không được phá:**
1. **Mọi migration phải idempotent** — không có bảng lịch sử migration; tính idempotent là thứ thay thế nó.
2. **RLS lọc DÒNG, GRANT mở CỬA** — bảng tạo qua Management API **không** tự có quyền cho
   `anon`/`authenticated`. Bật RLS mà quên `grant` thì chính mình cũng nhận `403 42501`.
   Chủ ý hiện tại: chỉ cấp cho `authenticated`, `anon` **không có quyền nào**.
3. **CẤM `current_date` trong mọi hàm SQL có yếu tố ngày** — DB chạy **UTC**, cron chạy 18:00 UTC
   = 01:00 sáng GMT+7 **ngày hôm sau**. Luôn dùng `(now() at time zone 'Asia/Ho_Chi_Minh')::date`.
4. **Hàm `security definer` phải `revoke` khỏi `public`/`anon`/`authenticated`** — nếu không, ai có
   `anon key` cũng gọi được qua `POST /rest/v1/rpc/<tên hàm>`.
5. **Script Node import thẳng file `.ts` được** (Node v24 strip types native + `"type": "module"`).
   ⇒ Logic dùng chung giữa CLI và UI chỉ viết **một bản** ở `src/lib/`. Lưu ý: `tsconfig.test.json`
   phải có `allowImportingTsExtensions` thì `npm run build` mới không đỏ.
6. **Script chạm dữ liệu thật phải đi qua đăng nhập + PostgREST**, KHÔNG dùng Management API.
   Cửa Management chạy quyền `postgres` (bypass RLS) ⇒ chạy được cũng không chứng minh app sẽ
   chạy được. Chỉ dùng Management API cho migration và test.

## 10. Import — 3 bẫy đã trả giá (từ M2a, 2026-09-09) + mở rộng M12

**M12 (2026-09-22):** file import thêm khoá **tuỳ chọn** `grammar` ở gốc (ngang hàng `dialogue`) →
bảng `topic_grammar`. Màn Import nhận **nhiều file 1 lúc**, **mỗi file 1 transaction riêng**:
1 file hỏng KHÔNG kéo đổ các file còn lại. `import_topic()` trả thêm `so_ngu_phap`.
⚠️ `import-schema.json` có `additionalProperties: false` ⇒ thêm khoá mới vào file import mà quên
sửa schema thì chính schema sẽ từ chối file.


1. **`blank_b_vocab_id` nằm LỒNG trong payload jsonb.** Khi đổi `temp_id → uuid` phải `jsonb_set`
   vào trong payload, không chỉ đổi `vocab_temp_id` ở ngoài. Quên = Player không tìm ra "từ B"
   của Select/Fill Dialog (xem §7.2).
2. **Hội thoại ĐỔI TÊN KHOÁ:** file import dùng `highlight_vocab_temp_ids`, cột `content` trong
   DB dùng `highlight_vocab_ids` (uuid). Phải vừa dịch giá trị vừa đổi tên khoá.
3. **Import phải tự tạo `word_state`** (`stage='new'`, `next_review_date = NULL`). Spec §10 không
   nói, nhưng thiếu thì cron không bao giờ nhỏ giọt được từ mới.

**Bài học về test:** ca kiểm "lỗi giữa chừng → rollback sạch" từng **xanh giả** vì exception
handler nuốt luôn lỗi "hàm chưa tồn tại". Test bắt lỗi phải assert **nội dung thông báo lỗi**,
không chỉ assert "không có gì xảy ra".

## 11. SRS engine — luật bất biến (từ M3, 2026-09-09)

`src/lib/srs.ts` là **hàm thuần 100%** — 0 dòng `import`. Không đọc đồng hồ hệ thống (ngày luôn
truyền vào), không tự ghi DB — trả về "thay đổi cần áp dụng", tầng gọi (M4) mới persist.

**API duy nhất M4 cần gọi:** `xuLyTraLoi({...})` → `{ trang_thai_moi, dong_review_log,
vao_retry_queue }`. Cố tình gộp chấm bài + xét promote vào 1 hàm vì `stage_after` chỉ biết được
sau khi xét promote — tách đôi sẽ đẻ ra giao thức ngầm dễ sai.

**4 điểm cực dễ viết sai:**
1. **`GAP_VAO_STAGE` gắn với stage ĐÍCH, không phải stage nguồn** (§3.1): lên stage1 → +2 ngày,
   lên stage2 → +4, lên stage3 → +7. Hiểu nhầm là lệch toàn bộ lịch ôn của app.
2. **Chưa đạt ngưỡng ⇒ `next_review_date` GIỮ NGUYÊN**, tuyệt đối không dời. Từ vẫn due,
   lịch "tự lành" (§1.2). Chỉ khi promote mới cộng gap.
3. **Sai KHÔNG phạt** (DEC-08) và **không bao giờ tụt stage** (DEC-09). Phạt chỉ đến từ cron
   bỏ lỡ NGÀY ôn — logic đó nằm ở `0005_maintenance.sql`, KHÔNG lặp lại trong `srs.ts`.
4. **Chỉ bài ĐẠT mới ghi vào `cycle_completed_exercises`** — retry chỉ chạy bài chưa đạt (§4.2).
   Dùng gợi ý được 0 điểm nhưng VẪN tính là đạt.

**Mẫu test đáng nhân rộng — test chống lệch:** khi một bảng hằng số tồn tại ở 2 nơi, viết test
đọc cả 2 nơi rồi so khớp. Đã có 3 ca: **X1** (bảng phạt TS ↔ `0005_maintenance.sql`),
**X2** (`MAX_CYCLE` = số dạng bài × điểm mỗi bài — đúng loại mâu thuẫn đã xảy ra ở §3.2),
**X1c** (đọc mã nguồn `srs.ts` khẳng định không import React/Supabase/`node:`).
