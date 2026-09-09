# Decision Log

Ghi các quyết định có ảnh hưởng kiến trúc. DEC-01→DEC-23 đã chốt trước khi có memory bank — tóm tắt ở §A để tra nhanh; chi tiết đầy đủ nằm ở `SPECIFICATION.md`. Quyết định phát sinh từ 2026-08-23 trở đi ghi ở §B theo thứ tự thời gian.

---

## A. Quyết định nền tảng đã chốt (DEC-01 → DEC-23)

| Mã | Nội dung chốt | Lý do | Tham chiếu |
|---|---|---|---|
| DEC-04/18 | 2 tầng điểm: `cycle_points` (nâng stage) + `total_points` (cả đời) | "Đủ điểm lên stage" chưa chắc "nhớ thật" — cần chỉ số dài hạn để chỉnh gap | §3.2, §3.4 |
| DEC-05 | `cycle_points` reset mỗi vòng ôn mới; `total_points` không bao giờ reset | Tách ngắn hạn/dài hạn | §3.7 |
| DEC-06 | Bài chưa đạt → `daily_retry_queue`, chạy lượt riêng SAU, không retry ngay trong session | Retry ngay chỉ đo trí nhớ tạm thời | §4.2 |
| DEC-08 | Chỉ phạt khi **bỏ lỡ ngày ôn** (−1…−5 theo stage, sàn 0); trả lời sai KHÔNG phạt | Giữ động lực, không tạo áp lực | §3.5 |
| DEC-09 | **Không bao giờ tụt stage** (lapse tắt) | Tụt stage gây nản, đã có phạt điểm là đủ | §3.5 |
| DEC-10 | Session **thuần 1 stage**, ~5 từ (không ép cứng), order `stage ASC, next_review_date ASC` | Trộn stage làm loạn nhịp độ khó | §4.1 |
| DEC-11 | Flashcard Good/Hard/Again, **không tính điểm** nâng stage | Tự chấm không khách quan | §4.3 |
| DEC-12 | 6 stage ↔ 6 giai đoạn cây; ring % = `min(total_points,30)/30`, 6 mốc màu cố định | Ẩn dụ trực quan gắn thẳng dữ liệu | §12 |
| DEC-13 | Bổ sung `collocation_pinyin`, `collocation_meaning_vi`; `review_log` ghi `stage_before`/`stage_after` | Cần cho bài Trans Collocation + màn Tổng kết | §2 |
| DEC-14 | AI chấm stage 3: batch **3 request/session** (1/dạng bài, 5 câu/request) | Giảm số call, vẫn giữ prompt riêng theo dạng | §7 |
| DEC-15 | TTS gọi **1 lần/từ** sau Import → cache mp3 Storage; fallback Web Speech API | Không gọi TTS runtime, tiết kiệm & ổn định | §9 |
| DEC-16 | Từ mới vào DB với `next_review_date = NULL`, cron nhỏ giọt `new_words_per_day`; cảnh báo khi hàng đợi < 3 ngày dùng | Import cả trăm từ không được đổ hết vào 1 ngày | §5.1, §5.2 |
| DEC-17 | `settings` dạng key-value đơn giản (single-user), 5 key | Không cần bảng cấu hình phức tạp | §11 |
| DEC-19 | Dùng nút gợi ý → điểm bài đó ×50% (làm tròn xuống); 3 dạng AI-graded ẩn hẳn nút gợi ý | Vẫn cho gợi ý nhưng phản ánh đúng độ chắc | §3.6 |
| DEC-20 | `topic_dialogues` — 1 topic đúng 1 hội thoại, chỉ hiện ở chế độ ôn theo topic | Hội thoại là phần thưởng kết thúc topic | §4.5 |
| DEC-21 | Import JSON, **1 file / 1 topic**; trùng từ → **luôn thêm mới**, chỉ cảnh báo không chặn | Tránh merge/ghi đè gây mất dữ liệu ngoài ý muốn | §10 |
| DEC-22 | 17 dạng bài, payload JSONB; 6 dạng **không cần record** (Player đọc thẳng `vocab`) | Payload không lặp dữ liệu đã có → 1 nguồn sự thật | §6 |
| DEC-23 | Giải thích AI = lazy-generate + cache vào `exercises.ai_explanation` | Bấm lại không tốn thêm call | §8 |
| — | AI trong app **chỉ làm 2 việc**: chấm stage 3 + giải thích; toàn bộ nội dung bài tập gen NGOÀI app | Ổn định, rẻ, không phụ thuộc AI lúc học | §1.2 |
| — | Lịch ôn **tương đối** (`next_review_date`), tự lành khi trượt lịch | Không cần cron sửa lịch phức tạp | §1.2 |
| — | `VocaBloom_PCView.html` / `VocaBloom_MobileView.html` là **nguồn màu/style cuối cùng**, thắng `UI_DESIGN.md` và `taste.md` | File thật cụ thể hơn văn bản diễn giải | UI_DESIGN §3, §10 |

---

## B. Quyết định phát sinh

### [2026-08-23] MB-01 — Viết lại toàn bộ `systemPatterns.md`
- **Quyết định:** Xóa nội dung cũ, viết lại theo stack và design reference thật của VocaBloom.
- **Lý do:** Bản cũ là template sót lại của một dự án khác — ghi tech stack **Convex Cloud** (đúng phải là Supabase), tham chiếu file `PcView.html`/`MobileView.html` 8 màn không tồn tại, và mô tả các màn "Mục tiêu tiết kiệm / Thu nhập / Nợ vay" của app tài chính. Giữ lại sẽ khiến phiên sau code sai nền tảng.
- **Trạng thái:** ✅ Đã áp dụng.

### [2026-08-23] MB-02 — Tên file mockup thật khác tài liệu
- **Quyết định:** Mọi tham chiếu về sau dùng `VocaBloom_PCView.html` (18 màn) và `VocaBloom_MobileView.html` (19 màn). Không sửa `UI_DESIGN.md` (là tài liệu người dùng sở hữu) — chỉ ghi nhận sai lệch trong memory bank.
- **Lý do:** `UI_DESIGN.md` §3/§8/§10 còn dùng tên cũ và ghi "8 màn hình"; đi theo sẽ tìm nhầm file / bỏ sót màn.
- **Trạng thái:** ✅ Đã ghi nhận.

### [2026-08-23] MB-03 — Bộ 6 icon giai đoạn cây là GATE cứng
- **Quyết định:** Không code bất kỳ màn nào dùng icon cây (Dashboard, ring Player, Quản lý từ vựng) cho tới khi người dùng chốt bộ icon.
- **Lý do:** Cả `CLAUDE.md`, `UI_DESIGN.md` §10.4 và comment trong 2 file HTML đều đánh dấu SVG hiện tại là **bản nháp chưa chốt**.
- **Trạng thái:** 🔴 Đang chờ người dùng.

### [2026-08-23] MB-04 — Gọi AI/TTS THẲNG TỪ FRONTEND (chốt)
- **Quyết định:** `ai.ts` (OpenRouter) và `tts.ts` (Google Cloud TTS) gọi **trực tiếp từ browser**. KHÔNG dựng Supabase Edge Function làm proxy.
- **Nguồn khóa:** đọc từ bảng `settings` (key `openrouter_api_key`) đúng như spec §11 — người dùng tự nhập ở màn Cài đặt. KHÔNG nhúng khóa vào build.
- **Lý do:** app single-user tự host, chỉ chủ app truy cập; thêm tầng Edge Function là over-engineering (ponytail rung 1). Người dùng đã xác nhận 2026-08-23.
- **Hệ quả chấp nhận:** khóa nhìn thấy được trong DevTools/network của chính máy người dùng — đây là đánh đổi đã biết, không phải lỗi cần "sửa" về sau.
- **Vẫn giữ nguyên:** chỉ `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` được mang prefix `VITE_`. `OPENROUTER_API_KEY`, `GOOGLE_TTS_API_KEY`, `SUPABASE_ACCESS_TOKEN` trong `.env.local` **tuyệt đối không** gắn `VITE_` (chúng chỉ dùng cho script/CLI chạy local, không phải cho app).
- **Trạng thái:** ✅ Đã chốt.

### [2026-08-23] MB-06 — Auth & RLS (chưa chốt, chưa cần cho M0)
- **Bối cảnh:** MB-04 đã chốt gọi API từ frontend, nhưng câu hỏi Supabase Auth vẫn tách biệt: `.env.local` có `EMAIL`/`PASSWORD` (gợi ý 1 tài khoản), còn schema §2 không có cột `user_id` nào.
- **Đề xuất mặc định (sẽ hỏi lại trước khi viết migration M1):** bật Supabase Auth với đúng 1 tài khoản; RLS mọi bảng dạng `auth.uid() is not null` (không cần cột `user_id` vì single-user) — chặn được người lạ có `anon key` đọc/ghi dữ liệu, mà không phải sửa schema §2.
- **Trạng thái:** 🟡 Chờ xác nhận ở đầu M1.

### [2026-09-06] MB-07 — Tailwind v4 CSS-first + hệ token 4 tầng
- **Quyết định:** dùng **Tailwind v4**, khai token bằng `@theme inline` ngay trong
  `src/styles/tokens.css`. **KHÔNG có `tailwind.config.js`, KHÔNG có `postcss.config.js`.**
- **Cấu trúc 4 tầng:** A = `--raw-*` hex thô (nơi DUY NHẤT sửa khi đổi phong cách) → B = `--vb-*`
  ngữ nghĩa (3 nhánh light/dark) → C = `--ring-0..5` bất biến → D = `@theme inline` bắc cầu.
- **Bắt buộc `@theme inline`, không phải `@theme`:** `@theme` thường SAO CHÉP giá trị vào utility
  → màu bị đông cứng ở bản light, dark mode chết. Đã verify trong CSS build: cả 3 nhánh còn nguyên.
- **Đặt tên `--vb-` cho Lớp 2:** Tailwind v4 chiếm namespace `--color-*`, nếu Lớp 2 dùng cùng tên
  sẽ đụng nhau.
- **Thang radius/font-size đặt tên bằng SỐ** (`rounded-14`, `text-15`): mockup dùng 11 mức radius
  và 20 mức font-size, phần lớn KHÔNG có trong thang Tailwind mặc định. Đặt tên số = ánh xạ 1:1
  với mockup, không bịa ngữ nghĩa. (Chỉ MÀU mới bắt buộc đi qua 2 lớp — `UI_DESIGN.md` §2.)
- **Trạng thái:** ✅ Đã áp dụng, `npm run build` + `npm test` xanh.

### [2026-09-06] MB-08 — Dark mode 3 nhánh, chưa có nút toggle
- **Quyết định:** `tokens.css` viết đủ 3 nhánh — `:root` (light) · `@media (prefers-color-scheme:
  dark) :root:not([data-theme="light"])` · `:root[data-theme="dark"]`.
- **Mặc định chạy theo hệ điều hành, KHÔNG thêm UI nào** — mockup màn 17 (Cài đặt) không có nút
  đổi theme, tự thêm là bịa UI ngoài mockup.
- **Lý do vẫn viết sẵn nhánh 3:** sau này muốn nút toggle chỉ cần set `document.documentElement
  .dataset.theme`, không phải viết lại toàn bộ token. Test canh 2 nhánh dark luôn phủ đúng cùng
  một bộ token, không lệch.
- **Trạng thái:** ✅ Đã chốt. Nếu người dùng muốn nút toggle ở màn Cài đặt → phải duyệt layout riêng.

### [2026-09-06] MB-09 — Màu lấy bằng SCRIPT, cấm chép tay/suy đoán
- **Quyết định:** mọi giá trị màu vào `tokens.css` phải đến từ `node scripts/extract-colors.mjs`
  — script cắt 2 file HTML theo `data-screen-label`, tách 37 frame light / 37 frame dark rồi đếm riêng.
- **Lý do (bằng chứng thật):** cặp `#B7AFC9` / `#55566A` xuất hiện đúng 30 lần mỗi mã trên **cùng
  một selector**. Suy luận trực giác ("màu nhạt thì chắc dùng cho nền tối") cho kết quả **NGƯỢC**:
  thực tế `#B7AFC9` là LIGHT, `#55566A` là DARK. Script cũng lấp được 2 ô mà `UI_DESIGN.md` §3 bỏ
  trống: `border-input` dark = `#383C46`, `secondary` dark = `#7DD3FC`.
- **Phát sinh:** xác định được **6 mã vỏ gallery** phải cấm (xem `systemPatterns.md` §3), trong đó
  `#101116` và `#8B8F98` trước đó chưa ai biết là màu của trang trưng bày.
- **Trạng thái:** ✅ Đã áp dụng, `src/styles/tokens.test.ts` tự động chặn 6 mã đó.

### [2026-08-23] MB-05 — Logic SRS tách khỏi UI
- **Quyết định:** Toàn bộ SRS engine là hàm thuần trong `src/lib/srs.ts`, không import React/Supabase.
- **Lý do:** `CLAUDE.md` Bước 3 bắt buộc TDD RED→GREEN→REFACTOR cho logic tính điểm/lên stage/gap/phạt/session — logic dính UI hoặc network thì không viết test nhỏ chạy nhanh được.
- **Trạng thái:** ✅ Chốt làm chuẩn kiến trúc.

### [2026-09-09] MB-10 — Auth & RLS: chốt PHƯƠNG ÁN A (khép lại MB-06)
- **Quyết định:** bật Supabase Auth với **đúng 1 tài khoản** + **tắt đăng ký tự do**
  (`disable_signup = true`); mọi bảng bật RLS với 1 policy đồng dạng
  `for all to authenticated using (auth.uid() is not null)`.
  **KHÔNG thêm cột `user_id`** — schema `SPECIFICATION.md` §2 giữ nguyên 100%.
- **Lý do:** `anon key` bị Vite ship thẳng vào JS bundle; nếu deploy public mà không có RLS thì
  bất kỳ ai cũng đọc/sửa/`DELETE` toàn bộ DB qua PostgREST. Chi phí thêm rất nhỏ và cố định
  (1 policy × 10 bảng + 1 màn Đăng nhập), đổi lại không phải làm lại hạ tầng khi DB đã có dữ liệu.
- **Không phải over-engineering:** RLS là cơ chế **có sẵn** của Supabase, 0 package, 0 tầng mới —
  khác hẳn việc dựng Edge Function proxy đã bị bác ở MB-04.
- **Hệ quả kéo theo:** cần **màn Đăng nhập — KHÔNG có trong 18/19 màn mockup** → phải trình bày
  layout và chờ duyệt riêng trước khi code (theo `CLAUDE.md` Bước 1). Không làm màn "Quên mật khẩu"
  / "Đăng ký" (YAGNI + ngoài mockup); đổi mật khẩu làm thẳng trên Dashboard.
- **Biến `EMAIL` rác đã xử lý:** thay bằng email thật của chủ project (SMTP free tier của Supabase
  chỉ gửi được tới email thành viên tổ chức → dùng email khác sẽ không nhận được mail reset).
- **Trạng thái:** ✅ Đã triển khai & kiểm chứng (`npm run check:auth` 9/9, `check:schema` 14/14).

### [2026-09-09] MB-11 — Chạy migration bằng Management API, KHÔNG cài Supabase CLI
- **Quyết định:** `scripts/db-lib.mjs` + `scripts/db-migrate.mjs` gửi thẳng SQL tới
  `POST https://api.supabase.com/v1/projects/{ref}/database/query` bằng `fetch` có sẵn của Node.
- **Lý do (`ponytail`):** Supabase CLI là binary ~50MB, phải `supabase link`, phải nhập DB password
  riêng — trong khi `SUPABASE_ACCESS_TOKEN` sẵn có đã chạy được SQL tuỳ ý (đã probe HTTP 201).
- **Đánh đổi:** không có bảng lịch sử migration ⇒ **bù bằng luật: mọi file migration phải
  IDEMPOTENT** (`if not exists`, `drop policy if exists`, `on conflict do nothing`,
  `create or replace`, `cron.unschedule` trước `cron.schedule`). Đã chứng minh bằng cách chạy
  `npm run db:migrate` nhiều lần liên tiếp, lần nào cũng xanh.
- **Kiểm chứng phụ trước khi tin:** Management API **tôn trọng `begin … rollback`** (bảng probe
  không sót lại) — đây là điều kiện để `npm run test:db` dám `truncate` rồi seed trên DB thật.
- **Trạng thái:** ✅ Đã áp dụng.

### [2026-09-09] MB-12 — 4 quyết định nghiệp vụ khi hiện thực `run_daily_maintenance()`
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Từ quá hạn nhiều ngày bị **phạt MỖI ngày bỏ lỡ** (điều kiện `next_review_date <= ngay_vua_qua`) | Đúng nghĩa đen §3.5; sàn 0 đã chặn kịch bản tệ nhất; phương án "phạt 1 lần" đòi thêm cột → lệch schema §2 |
| **Q2** | Từ mới kích hoạt với `next_review_date = hôm_nay` (theo §5.1), **bỏ** cách hiểu "+1 ngày" của sơ đồ §3.1 | Spec tự mâu thuẫn. Cron chạy 01:00 sáng → mở app buổi sáng thấy từ mới ngay; chờ thêm 1 ngày không có lý do nghiệp vụ |
| **Q3** | Thêm index **ngoài spec** `idx_review_log_reviewed_at on review_log (reviewed_at)` | §4.6 query `review_log` theo CẢ NGÀY; index `(vocab_id, reviewed_at)` sai cột dẫn đầu → quét toàn bảng |
| **Q4** | `pg_cron` bật được bằng `create extension` qua Management API | Không cần người dùng bấm nút Dashboard |

- **Đánh đổi đã biết & chấp nhận:** chốt chống-phạt-chồng dựa trên `updated_at`, nên từ được ôn
  trong khung **00:00–01:00 giờ VN** (trước lúc cron chạy) sẽ không bị phạt cho ngày hôm trước.
  Cửa sổ rất hiếm và lệch về phía **khoan dung** — đúng tinh thần sản phẩm. Đã ghi chú trong
  `supabase/migrations/0005_maintenance.sql`.
- **Trạng thái:** ✅ Đã hiện thực, phủ bởi 9 ca TDD.

### [2026-09-09] MB-13 — 3 đính chính/lỗ hổng phát hiện khi làm M1
1. **10 bảng, không phải 9.** `SPECIFICATION.md` §2 đánh số 9 nhóm nhưng nhóm 2 chứa 2 bảng
   (`vocab` + `vocab_topics`). `systemPatterns.md` cũng đang ghi sai. **Đếm nhầm = bỏ sót
   `vocab_topics` khi bật RLS** ⇒ hở toàn bộ quan hệ từ vựng ↔ chủ đề. Đã sửa memory bank;
   mọi script/migration nay liệt kê tên bảng **tường minh**.
2. **RLS lọc DÒNG, GRANT mở CỬA.** Bảng tạo qua Management API **không** được cấp quyền mặc định
   cho `anon`/`authenticated` (chỉ `postgres` có). Bật RLS mà quên `grant` thì chính tài khoản của
   mình cũng nhận `403 · 42501 permission denied`. Đã bổ sung `grant` **chỉ cho `authenticated`**;
   `anon` không có quyền nào ⇒ bị chặn ngay tầng quyền, chặt hơn cả RLS.
3. **`SECURITY DEFINER` + PostgREST RPC = lỗ hổng.** Hàm `run_daily_maintenance()` bypass RLS, mà
   Postgres mặc định cấp `execute` cho `public` ⇒ ai có `anon key` cũng gọi được qua
   `POST /rest/v1/rpc/run_daily_maintenance` để ép chạy vòng phạt điểm. Đã `revoke` khỏi
   `public` / `anon` / `authenticated`; `check:schema` canh cổng bằng `has_function_privilege`.
- **Trạng thái:** ✅ Cả 3 đã xử lý và có assertion tự động canh.

### [2026-09-09] MB-14 — M2: 4 quyết định về Import
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Phạm vi M2 = **lõi + CLI**, KHÔNG UI | Màn Đăng nhập và màn Kết quả Import đều chưa có mockup. Làm lõi trước cho ra dữ liệu thật ngay để M3/M4 có cái chạy, mà không chạm màn nào chưa chốt |
| **Q2** | **Tự viết `importValidate.ts`**, không cài `ajv` | JSON Schema không kiểm được tham chiếu chéo `temp_id` (§10.7 tự thừa nhận) ⇒ cài `ajv` vẫn phải viết lớp 2, thành 2 nguồn sự thật phải giữ đồng bộ. Port từ `validate_import.py` cho 1 nguồn duy nhất, 0 package |
| **Q3** | **Hàm Postgres `import_topic()`** gọi qua `rpc()` | `supabase-js` không có transaction phía client; đây là cách duy nhất đạt đúng "tất cả-hoặc-không" (§10.4) |
| **Q4** | Import trùng topic → **luôn tạo topic mới**, chỉ cảnh báo | Nhất quán tuyệt đối với DEC-21 (không merge, không ghi đè). Spec chỉ nói về từ vựng trùng, không nói về topic |

**Phát hiện kỹ thuật quan trọng:** **Node v24 strip types native** ⇒ file `.mjs` import thẳng
được `.ts`. Nhờ đó CLI và UI (phiên sau) **dùng chung đúng một file logic validate**, không phải
viết 2 bản. Điều kiện: `package.json` có `"type": "module"` (đã có).

**Bẫy đã xử lý trong `0007_import_topic.sql`:**
1. `blank_b_vocab_id` nằm **lồng trong payload jsonb** — phải `jsonb_set` để dịch temp_id→uuid,
   quên là Player không tìm ra "từ B" của Select/Fill Dialog.
2. Hội thoại **đổi tên khoá**: file import dùng `highlight_vocab_temp_ids`, schema §2 dùng
   `highlight_vocab_ids` (uuid) — vừa dịch giá trị vừa đổi tên khoá.
3. temp_id không map được ⇒ `raise exception` tiếng Việt, không để `NULL` chui xuống.
4. Import **phải tự tạo `word_state`** (`stage='new'`, `next_review_date = NULL`) — spec §10 không
   nói, nhưng thiếu thì cron không bao giờ nhỏ giọt được từ mới.

**Bài học về test:** ca I5 (lỗi giữa chừng → rollback) ban đầu **xanh giả** vì exception handler
nuốt luôn lỗi "hàm không tồn tại". Đã siết lại: bắt `SQLERRM` vào bảng rồi assert nội dung thông
báo. → Test bắt lỗi mà chỉ assert "không có gì xảy ra" thì có thể xanh vì lý do sai.

**Trạng thái:** ✅ Đã hiện thực. `npm test` 27/27 · `npm run test:import` 6/6.

### [2026-09-09] MB-15 — M3: 4 quyết định lấp chỗ hổng của spec về SRS
| Mã | Vấn đề trong `SPECIFICATION.md` | **Chốt** |
|---|---|---|
| **Q1** | §3.2 **tự mâu thuẫn**: bảng liệt kê Matching + ghi `Max/vòng = 4`, nhưng dấu `*` nói Matching không tính điểm; §6.1 lại ghi Matching `+1` | **Matching CÓ tính điểm `+1`**, max vòng `new` = 4, ngưỡng 3/4 (được sai 1 bài). Nếu Matching không tính thì max = 3 mà ngưỡng cũng = 3 ⇒ buộc đúng 100%, trái tinh thần "không tạo áp lực" |
| **Q2** | §3.4 dùng `max_điểm_có_thể_đạt_tới_thời_điểm_promote` nhưng **không chỗ nào định nghĩa** | Mẫu số = max **cộng dồn** các stage đã qua: **4 / 12 / 24 / 36** |
| **Q3** | Không nói promote được xét lúc nào | **Sau khi từ làm xong bộ bài trong lượt** — khớp §4.2 (xong bộ bài mới biết thiếu bài nào để đẩy vào retry) |
| **Q4** | Stage `intensive` **không có dòng nào** trong bảng điểm §3.2 | Dùng nguyên luật stage2: bài stage2, `+3`/bài, ngưỡng 9/12. Khác duy nhất: không promote, chỉ chờ `total_points ≥ 30` |

**Giả định đã báo trước, không bị phản đối:** dùng gợi ý ở stage `new` được `1 × 50%` làm tròn
xuống = **0 điểm** nhưng bài vẫn tính **ĐÃ ĐẠT** (không retry) — retry câu đã trả lời đúng là vô
nghĩa; hình phạt nằm ở chỗ mất điểm nên khó chạm ngưỡng.

**Quyết định kiến trúc — gộp `xuLyTraLoi` thành 1 hàm điều phối** thay vì tách `chamBai` +
`ketThucLuot`: `stage_after` chỉ biết được SAU khi xét promote, tách đôi sẽ đẻ ra giao thức ngầm
("gọi A rồi vá kết quả vào dòng log của B") rất dễ sai ở tầng gọi. Các helper vẫn export riêng
(`diemChoBai` · `tinhHealth` · `gapFactor` · `tinhPhat` · `boBaiCua` · `diemGocCua` ·
`xuLyFlashcard` · `gomSession`) để test từng luật độc lập.

**2 test chống lệch — loại có giá trị nhất ở milestone này:**
- **X1:** đọc `0005_maintenance.sql`, regex bảng phạt, so khớp với hằng số `PHAT` trong `srs.ts`.
  Bảng phạt tồn tại **2 nơi** (SQL của M1 + TS của M3); sửa một nơi quên nơi kia thì không có gì
  báo lỗi, điểm cứ âm thầm sai.
- **X2:** `MAX_CYCLE[stage]` phải luôn `= số dạng bài × điểm mỗi bài`. Đây đúng là loại mâu thuẫn
  đã xảy ra ở §3.2 (vụ Matching) — giờ có test canh.
- **X1c:** đọc mã nguồn `srs.ts`, khẳng định không import React/Supabase/`node:` ⇒ giữ tính thuần.

**Trạng thái:** ✅ `npm test` 58/58 · `srs.ts` không có lấy một dòng `import`.
