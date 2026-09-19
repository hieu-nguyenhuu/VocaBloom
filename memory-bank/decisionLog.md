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

### [2026-09-16] MB-16 — Màn Đăng nhập: layout Phương án A + 3 quyết định phạm vi
- **Bối cảnh:** hệ quả trực tiếp của MB-10 — màn này **không có trong 18/19 màn mockup**, phải
  đề xuất layout và được duyệt trước khi code (`CLAUDE.md` Bước 1).
- **Layout chốt — Phương án A:** card trắng (`surface-raised`, radius 20, padding 28, shadow)
  nổi trên nền kem (`surface-sidebar`), **tái dùng nguyên modal "Sửa từ vựng" màn 14** cho
  label + input, nút CTA tím của Dashboard/Player (radius 14, padding 17). Không icon ⇒ không
  chạm gate MB-03. Đã bác Phương án B (form phẳng trên nền trắng) vì PC màn rộng bị trống.
  Giá trị duy nhất tự quyết ngoài mockup: shadow card giảm `0.4 → 0.18` vì không có overlay tối.
- **3 quyết định phạm vi (người dùng chốt 2026-09-16):**
  1. **Không làm nút Đăng xuất** ở task này — chưa có trong mockup nào; sẽ đặt ở màn Cài đặt (M6)
     và trình layout riêng.
  2. **Sau đăng nhập về `/`** (hoặc `state.from`) dù Dashboard vẫn là stub M0 — chấp nhận tạm.
  3. **Không có checkbox "Ghi nhớ đăng nhập"**, không "Quên mật khẩu"/"Đăng ký" — supabase-js
     đã persist session vào localStorage; 1 tài khoản duy nhất (MB-10).
- **Kiến trúc:** logic tách thành `src/lib/auth.ts` **thuần** (0 `import`, có test X-auth canh)
  để TDD được: `kiemTraFormDangNhap` (validate client, tránh request vô ích) + `dichLoiDangNhap`
  (map lỗi Supabase → tiếng Việt, **cố ý không phân biệt sai email/sai mật khẩu**). Mọi câu chữ
  hiện cho người dùng nằm ở file này. `RequireAuth` là layout route bọc toàn bộ route khác,
  render `null` khi chưa biết session để không nhấp nháy.
- **Bằng chứng:** `npm test` 67/67 · build + lint xanh · Chrome headless CDP 9/9 kịch bản thật.
- **Trạng thái:** ✅ Đã áp dụng.

### [2026-09-16] MB-17 — App shell: 5 quyết định
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Chuyển PC ↔ Mobile **thuần CSS** (`hidden md:flex` / `md:hidden`, mốc 768px), không JS `matchMedia` | ponytail; mockup chỉ có 390 và 1280, mốc Tailwind mặc định đủ dùng |
| **Q2** | `/on-tap` **tạm nằm trong shell** cho tới khi có Player (M4) | Mockup Player (02–12) không có sidebar/tab bar, nhưng để stub ngoài shell thì người dùng bị kẹt không có nav. Người dùng chốt "để đến khi có Player" |
| **Q3** | Mục "Thông báo" ở đáy sidebar là **nút bất hoạt** (`aria-disabled`, `opacity-60`), không tạo route `/thong-bao` | Mockup PC là dropdown 360px xổ cạnh sidebar, Mobile là sheet phủ Dashboard — cả 2 thuộc M6; tạo route trang riêng là trái mockup PC |
| **Q4** | `KhungTrang` là **component** (prop `rong: 1000 \| 960`), không phải route-handle | Trang có bố cục riêng (Từ vựng 2 pane, màn 13) chỉ cần không dùng; không cần `useMatches` |
| **Q5** | Max-width content theo **mockup HTML: 1000 (Dashboard) / 960 (Import, Cài đặt)**, bỏ "~720px" của `UI_DESIGN.md` §8 | HTML thắng `UI_DESIGN.md` (thứ tự ưu tiên đã chốt) |

- **Header Mobile thuộc từng trang**, không thuộc shell — Dashboard (lời chào + chuông) và Cài đặt
  (chỉ tiêu đề) khác nhau hoàn toàn trong mockup.
- **Icon:** 6 path SVG trích nguyên văn, PC/Mobile dùng chung (đã đối chiếu bằng grep). Gói trong
  `components/icons.tsx` để sau này thêm icon tiện ích Player cùng chỗ. **Không có icon cây** (MB-03).
- **Bằng chứng:** build + lint + `npm test` 67/67 · CDP 12/12 · ảnh PC light/dark + Mobile light/dark.
- **Trạng thái:** ✅ Đã áp dụng.

### [2026-09-16] MB-18 — M2b UI Import: layout 3 trạng thái không có mockup + 4 quyết định
- **3 trạng thái không có mockup — đã duyệt:** (1) **validate lỗi** = card họ đỏ (pattern lỗi màn
  Đăng nhập) liệt kê `đường_dẫn — thông_điệp` tối đa 10 dòng, nút duy nhất "Chọn file khác";
  (2) **đang import** = nút disabled "Đang import…"; (3) **kết quả**: thành công = card tóm tắt
  "✓ Đã import {tên}" với **số liệu từ RPC** (không từ file) + "Import file khác" / "Xem từ vựng";
  thất bại = card đỏ + message RPC + "Không có gì được ghi (đã rollback)" + "Thử lại" (giữ file).
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Sau import thành công **ở lại trang** với card kết quả, không tự chuyển `/tu-vung` | Người dùng chốt; `/tu-vung` còn là stub |
| **Q2** | **TTS nền sau import → M6** | Cùng pipeline `tts.ts`; tách để M2b không phụ thuộc Google TTS |
| **Q3** | Mọi cảnh báo không chặn (trùng từ · trùng topic · validator · mạng lỗi khi query trùng) gộp **1 banner vàng** nhiều dòng | Mockup chỉ có 1 banner; thêm banner thứ 2 là bịa UI |
| **Q4** | Mất mạng lúc query trùng **vẫn cho preview + import**, chỉ thêm dòng cảnh báo | Kiểm trùng là tiện ích, không phải điều kiện (DEC-21) |
- **Kiến trúc:** reducer thuần `giamTrangThai` giữ toàn bộ chuyển trạng thái; component chỉ làm
  3 side-effect (đọc file, 2 query trùng song song, `rpc`). `importUi.ts` được phép import
  `importValidate.ts` (cũng thuần) — test X-import chỉ cấm react/supabase/node.
- **Mockup có điểm lạ:** icon file ở card trái (màn 16) chỉ là nửa trái cuốn sách, trông như hình
  chữ nhật hẹp. Đã code đúng nguyên văn (HTML thắng) và báo người dùng; nếu muốn đổi → dùng icon
  `tu-vung` đủ 2 nửa.
- **Bằng chứng:** `npm test` 89/89 · build + lint xanh · CDP 17/17 (có import thật, DB +1 topic).
- **Trạng thái:** ✅ Đã áp dụng.

### [2026-09-16] MB-19 — CHỐT bộ 6 icon giai đoạn cây: Phương án A — gỡ gate MB-03
- **Quyết định:** dùng **Phương án A "Một thân cây trên nền đất"** — 6 hình cùng đường đất
  `M5 20.5h14` + thân thẳng, lớn dần trái → phải (hạt nằm trên đất → mầm 2 lá → chồi búp →
  lá lớn có gân → hoa 4 cánh nhụy đặc → quả tròn có cuống lá). viewBox 24, stroke 1.8, round cap —
  cùng nét với 6 icon nav. Đóng gói `IconCay({ stage, size })` trong `src/components/icons.tsx`.
- **Cách chọn:** trình 3 phương án (A kể chuyện · B ụ đất tròn trịa · C ký hiệu gọn) trên 1 trang
  so sánh, mỗi bộ hiện ở đúng 3 ngữ cảnh thật (hàng Khu vườn 20px · tâm ring 56px · mũi tên Tổng kết)
  cả 2 theme. Artifact: https://claude.ai/artifact/DJMAvn4rEutw6XNJZsMwBh. Người dùng chọn A.
- **Hệ quả:** gate MB-03 **đã gỡ** — Dashboard, ring Player, Quản lý từ vựng, Tổng kết được code.
  SVG nháp trong 2 file HTML mockup và cảnh báo ở `CLAUDE.md` / `UI_DESIGN.md` §10.4 / comment đầu
  2 file HTML nay **lỗi thời** — là file người dùng sở hữu, chưa tự sửa; đã nhắc người dùng.
- **Trạng thái:** ✅ Đã áp dụng (build xanh).

### [2026-09-16] MB-20 — M4a Player: 6 quyết định + 3 phát hiện khi kiểm thật
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Cắt M4 thành **M4a** (lõi + stage 0 + Tổng kết) / **M4b** (stage 1–2) / M5 (stage 3 AI) | Dữ liệu thật lúc đó toàn stage `new` → M4a kiểm end-to-end được ngay |
| **Q2** | Thứ tự bài trong session **theo dạng bài, xen kẽ từ** (Flashcard×N → Grammar×N → Matching → Selection×N → Audio×N → Fast×N) | Tốt cho trí nhớ hơn làm hết 1 từ; Matching vốn chạy trên cả session |
| **Q3** | Ghi kết quả qua **RPC `luu_tra_loi` 1 transaction**; retry = xoá-rồi-ghi theo (từ, ngày); `p_state null` cho Flashcard | Nhất quán `import_topic`; `review_log` không bao giờ lệch `word_state` |
| **Q4** | Progress dots = **khối dạng bài** (≤6), không phải từng màn | Session 5 từ có ~26 màn → 26 chấm tràn mobile; mockup vẽ 5 chấm |
| **Q5** | Session thường loại từ **đang có hàng retry**; từ dở dang (có log, chưa xong bộ) vẫn được nạp lại và `xepBai` bỏ dạng đã đạt | DEC-06 không retry ngay; reload giữa chừng không làm lại bài đã đạt |
| **Q6** | "Còn N từ đang chờ" = due − đang retry | Từ dở dang vẫn là "đang chờ"; lọc theo log làm ẩn dòng nhắc |

**3 phát hiện khi kiểm thật (đều vá + có test):**
1. **Bug**: `FastDecision` gọi `onTraLoi` bên trong updater `setState(d => …)` → React StrictMode gọi
   updater 2 lần → 1 bài ghi **2 dòng review_log cách 9ms** và nhảy qua màn kế. Vá bằng ref chặn.
   **Luật rút ra:** không đặt side-effect trong updater của setState.
2. **Lỗ hổng spec (`srs.ts`, test R2d)**: từ đạt HẾT bộ bài mà `cycle_points` < ngưỡng (do gợi ý 0 điểm)
   → `cycle_completed_exercises` đầy, cycle chỉ reset khi lên stage (DEC-05) → không còn bài tính điểm
   nào cho lượt sau → **kẹt vĩnh viễn**. Chốt: **mở lại bộ bài (`daDat = []`), giữ `cycle_points` cộng
   dồn, retry CẢ BỘ (`exercise_types: null` — ngữ nghĩa có sẵn ở schema)**. Spec §4.2 chưa nói tới ca này.
3. Định nghĩa "Còn N từ" (Q6).

**Tự quyết ngoài mockup:** X thoát ở mọi màn; màn Audio Recognition (mockup không có) = nút loa 64px +
icon `loa` tự vẽ; sai → tô đỏ ô đã chọn, tự sang bài sau 1s; nút "Ôn lại N từ chưa đạt" ở Tổng kết;
gợi ý Selection = ẩn dần 2 đáp án sai, Audio = hiện chữ Hán.

**Bằng chứng:** `npm test` 116/116 · `test:player` 4/4 · build + lint xanh · CDP 2 lượt thật + retry
(không ghi đúp, lên stage1 với `next_review_date = +2`, lịch tự lành, retry 4 → 0).
**Trạng thái:** ✅ Đã áp dụng.

### [2026-09-17] MB-21 — M4b (stage 1+2): 4 quyết định + 2 bug phát hiện khi kiểm thật
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | **Bài 2 từ xếp theo RECORD, không theo từ**: mỗi record `select_dialog`/`fill_dialog` dựng đúng 1 màn; `la_bai_cuoi` chỉ chứa từ CÓ trong session | §4.4 — câu chỉ được xuất hiện 1 lần dù A, B hay cả 2 cùng due. Query 2 chiều (`vocab_id` + `payload->>blank_b_vocab_id`) rồi gộp loại trùng theo `exercises.id` |
| **Q2** | **`locRetryTheoRecord`** — lọc hàng retry theo dạng mà từ đó THỰC SỰ có record; rỗng thì không tạo hàng | DB thật thiếu `select_dialog`/`fill_dialog` cho 7/9 từ. Không lọc thì lượt "Ôn lại" dựng 0 màn mà từ lại bị loại khỏi session thường ⇒ kẹt cả ngày. `srs.ts` không biết từ nào có record nào nên việc lọc thuộc tầng gọi |
| **Q3** | Ô nhập chữ Hán = **1 `<input>` trong suốt phủ lên N ô hiển thị**, KHÔNG phải N `<input maxLength=1>` | IME tiếng Trung cần gõ nhiều ký tự latin trước khi ra chữ Hán; ô 1 ký tự chặn IME. Tiếng Anh dùng 1 ô dài (`doctor` = 6 ô rời trông rối) |
| **Q4** | `select_sentence` dùng lưới **1 cột** (khác 2×2 của pattern 1) | Đáp án là câu dài + pinyin, 2 cột bị vỡ chữ |

**2 bug thật phát hiện khi kiểm (đều vá + có test):**
1. **Session lặp vô hạn** (`coBaiTinhDiem`): flashcard/grammar không tính điểm nên không bao giờ vào
   `cycle_completed_exercises` ⇒ `xepBai` luôn dựng lại. Khi từ đã làm hết bài tính điểm mà vẫn due
   (chưa đủ ngưỡng, chưa có hàng retry), `napSession` nạp đi nạp lại session chỉ gồm flashcard +
   grammar — chạy thật ghi **109 dòng `flashcard` rác**. Vá: `napSession` duyệt các session và **bỏ
   qua session không còn bài tính điểm**; hết thì `khong_co_tu`.
2. **`arrange_words` đọc sai khoá payload**: token thật là `{text, pinyin}` nhưng code đọc `t.word`
   ⇒ chip **mất chữ Hán, chỉ còn pinyin**; `chamArrange` cũng so `undefined` nên luôn sai.
   Test ban đầu **xanh giả** vì fixture tự chế dùng `{word}`. Vá cả 3 nơi + đổi fixture theo payload
   thật. → **Luật rút ra: fixture test phải sao chép shape payload THẬT trong DB, không tự nghĩ ra.**

**Thao tác DB thủ công (được người dùng cho phép, câu 2 Brainstorm):** để kiểm `fill_dialog` (record
duy nhất thuộc 橙子) đã đưa 葡萄 + 橙子 lên `stage2` + due hôm nay, `cycle_points = 0`. Trước/sau đã
ghi ở `activeContext.md`; sau đó 2 từ được ôn THẬT và tự lên `stage3`.

**Bằng chứng:** `npm test` 136/136 · build + lint xanh · cả 8 dạng M4b có dòng trong `review_log` ngày
17/9 · `fill_dialog` ghi đúng 2 dòng cho 2 từ khác nhau.
**Trạng thái:** ✅ Đã áp dụng.

### [2026-09-18] MB-22 — M5 (AI chấm stage 3 + Giải thích): 5 quyết định + 2 bug khi kiểm thật
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Khoá OpenRouter đọc **`settings` trước → `VITE_OPENROUTER_API_KEY` sau**; model tương tự | Người dùng muốn để khoá ở file env cho nhanh. Thứ tự này giữ nguyên spec §11: khi M6 có màn Cài đặt, nhập khoá vào `settings` là app tự chuyển nguồn, không sửa code. ⚠️ **Ngoại lệ có thời hạn với `systemPatterns.md` §8 + MB-04** — Vite nhúng biến `VITE_*` vào bundle ⇒ **phải xoá trước khi deploy công khai** (đã ghi cảnh báo ở `env.d.ts`, `ai.ts`, `activeContext.md`) |
| **Q2** | Gom N câu cùng dạng → **1 màn `cham_ai`** gọi AI 1 lần | DEC-14 đòi 3 request/session; mockup 09 lại hiện phản hồi theo từng câu. Giải: nhập lần lượt (chưa chấm) → chấm gom → hiện lần lượt N thẻ |
| **Q3** | Nút "Giải thích (AI)" là **ghost thứ 4**, chỉ ở bài **CÓ record** `exercises` | 6 dạng không record (flashcard, matching, translate, listen_fill, make_sentence, trans_collocation) không có chỗ cache `ai_explanation` ⇒ bấm lại sẽ tốn call, trái DEC-23 |
| **Q4** | Bấm Giải thích **trước khi trả lời = tính như dùng gợi ý** (điểm ×50%) | Nếu không, xem đáp án mà vẫn full điểm — lỗ hổng điểm số |
| **Q5** | `verdict` lạ / thiếu field → quy về **`fail`**; id AI không trả → `thieu[]`, **không cộng điểm** + "Chấm lại" | §7.4; thà không cộng còn hơn cộng nhầm |

**2 bug thật phát hiện khi kiểm (đã vá):**
1. **Kẹt "Đang chấm bài…" vĩnh viễn**: vào màn `cham_ai` không có gì kích hoạt `chayChamAI` (chỉ có
   nút "Chấm lại" gọi). Vá bằng `useEffect` + ref chặn StrictMode gọi đôi (bài học MB-20/1).
2. **Lượt retry trộn stage**: `dangChoPhep` gộp `exercise_types` của MỌI hàng retry rồi áp cho session
   đầu tiên ⇒ dựng bài `make_sentence` (stage 3) cho từ `stage1`. Bằng chứng: log `postData` thật gửi
   lên OpenRouter có `exercise_type: make_sentence` với `w: teacher`. Vá: tính `dangChoPhep` **theo
   từng từ trong session** và luôn chặn trong `boBaiCua(stage)` của session đó.
   → **Luật rút ra: hàng đợi retry chứa từ ở nhiều stage; mọi phép gộp phải theo từng từ.**

**Bằng chứng kiểm thật (có gọi AI thật):** 12 dòng `review_log` `points = 4` (verdict good) ·
3 request/session xác nhận bằng `Network.requestWillBeSent` (POST; OPTIONS preflight không tính) ·
thiếu khoá → 0 request + thẻ lỗi giữ nguyên câu đã nhập · bài đã cache → **0 request** (DEC-23) ·
`npm test` 159/159 · build + lint xanh.
**Ghi nhận trung thực:** ca "bấm Giải thích lần 2 trên bài CHƯA cache" chưa kiểm được trọn vẹn — script
gọi lần 2 khi lần 1 chưa ghi xong cache (race của script). Nhánh đọc-cache đã được chứng minh riêng
bằng phép thử trên bài đã có cache.
**Trạng thái:** ✅ Đã áp dụng.

### [2026-09-18] MB-23 — M6a (Cài đặt + Thông báo): 5 quyết định + trả nợ khoá API
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | M6 cắt 3 lát: **M6a** (Cài đặt + Thông báo) → M6b (Dashboard) → M6c (TTS) | M6a nhỏ, có mockup đầy đủ, dữ liệu sẵn, và **gỡ được nợ khoá ngay**; TTS đụng hạ tầng mới nên đứng riêng |
| **Q2** | `docCaiDat` **chỉ nhận đúng kiểu**, sai kiểu rơi về mặc định (không ép kiểu ngầm) | `settings.value` là jsonb: lưu `"5"` thay vì `5` sẽ khiến `run_daily_maintenance()` so sánh số hỏng ⇒ cron ngừng nhỏ giọt từ mới |
| **Q3** | Khoá và model có **nút "Lưu" tường minh**, không lưu bằng `onBlur` | Người dùng khó đoán "phải bấm ra ngoài mới lưu"; `blur` cũng không đáng tin khi tự động hoá (kiểm thật M6a ghi null 2 lần liên tiếp) |
| **Q4** | Thông báo: bấm 1 tin = đánh dấu đã đọc, thêm nút **"Đánh dấu đã đọc tất cả"**, có trạng thái rỗng | Mockup vẽ 2 trạng thái đọc/chưa nhưng không có cách chuyển; đang tồn 5 tin chưa đọc |
| **Q5** | Lối vào Thông báo trên Mobile: **route ẩn `/thong-bao`** (không nằm trong `MENU`) | Mockup 19 mở sheet từ chuông ở header Dashboard — Dashboard thuộc M6b; route ẩn cho phép dùng và kiểm ngay mà không bịa UI trong tab bar |

**✅ Trả nợ kỹ thuật khoá API (MB-22/Q1):** nhập khoá + model vào màn Cài đặt → lưu bảng `settings` →
comment `VITE_OPENROUTER_*` trong `.env.local` (kèm ghi chú) → **kiểm thật**: `layCauHinhAI()` vẫn trả
khoá/model và `giaiThichBai()` gọi AI thành công **khi không còn biến env**. Khoá không còn bị Vite
nhúng vào `dist/assets/*.js`. File `.env.local.bak` (chứa khoá) đã xoá.

**Bằng chứng:** `npm test` 176/176 · build + lint xanh · CDP 18/18 (stepper/toggle/giọng ghi DB **đúng
kiểu jsonb** number/boolean · khoá hiện `sk-••••9538` · chuông có chấm báo 2 tin · đọc 1 tin 2 → 1 ·
đọc tất cả 1 → 0 · Mobile không tràn ngang).
**Trạng thái:** ✅ Đã áp dụng.

### [2026-09-18] MB-24 — M6b (Dashboard + Khu vườn): 6 quyết định
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Lời chào dùng tên cố định **"Helios"** — hằng số `TEN_NGUOI_DUNG` trong `dashboard.ts` | App 1 người dùng; thêm key DB + ô nhập ở Cài đặt chỉ để đổi 1 chuỗi là over-engineering (ponytail). Đổi tên = sửa đúng 1 dòng |
| **Q2** | Khu vườn hiện **đủ 6 chip** kể cả stage đang 0 từ | Người dùng chọn — thấy được toàn cảnh tiến trình, và chip trống cũng là thông tin |
| **Q3** | Dải 7 ngày hiện ở **CẢ PC lẫn Mobile** (mockup chỉ vẽ ở Mobile) | **Yêu cầu mở rộng của người dùng**, không phải tôi tự thêm. PC để `w-fit` cho dải khỏi kéo dài hết 1000px; hàng badge trong dải ẩn ở PC vì header đã có badge |
| **Q4** | Khi `tong === 0`, CTA chính **vẫn bật**, chỉ bỏ hậu tố số | Player còn nạp từ mới từ hàng đợi ⇒ "0 từ đến hạn" ≠ "không có gì để ôn"; khoá nút sẽ chặn oan |
| **Q5** | Ring "Vừa ôn gần đây" dùng `size={52}` ở **cả 2 breakpoint** (mockup PC 56 / Mobile 52) | `Ring` nhận size qua inline style; đổi theo breakpoint phải nhân đôi markup hoặc thêm JS đo màn hình — chênh 4px không đáng |
| **Q6** | `Ring` thêm prop tuỳ chọn `noiDung` thay vì viết component ring thứ hai | Dashboard cần **chữ Hán** giữa vòng, Player cần **icon cây**; 1 dòng `noiDung ?? <IconCay/>` giữ chung công thức `stroke-dasharray` và 6 mốc màu, không tách 2 nguồn sự thật |

**Ghi chú kỹ thuật (không phải quyết định, nhưng đáng nhớ):** mockup dùng đúng các tint đã có trong
`tokens.css` và path ngọn lửa trùng nguyên văn icon `an-mung` ⇒ M6b **không thêm token nào và chỉ thêm
1 icon (`tick`)**. Khi kiểm bằng CDP, chuỗi JS truyền qua `Runtime.evaluate` nằm trong template literal:
`\/` bị nuốt thành `/` làm hỏng regex ⇒ dùng `includes()` thay regex cho chắc.

**Bằng chứng:** `npm test` 195/195 · build + lint xanh (không phát sinh cảnh báo mới) · CDP **20/20**
đối chiếu thẳng PostgREST · ảnh PC/Mobile light + dark khớp mockup 01.
**Trạng thái:** ✅ Đã áp dụng.

### [2026-09-19] MB-25 — M6c (TTS Google + Storage): 8 quyết định + 1 lỗi tài liệu
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Sinh audio **trong app**, khoá Google lưu ở bảng `settings` (nhập tại Cài đặt) | Đúng SPEC §9; cùng mô hình với khoá OpenRouter (MB-04/MB-22). Không dùng `VITE_*` nên khoá không vào bundle |
| **Q2** | Nút nghe thử gọi **thẳng Google**, 1 nút cho mỗi ô giọng | Khoá đã có sẵn trong browser; mẫu thử ngắn nên chi phí không đáng kể |
| **Q3** | Bucket `audio` **công khai đọc**, ghi chỉ `authenticated` | mp3 phát âm không nhạy cảm; `audio_url` thành URL tĩnh vĩnh viễn, không phải ký lại |
| **Q4** | **2 ô chọn giọng riêng** `tts_voice` (zh) + `tts_voice_en` (en) | Người dùng yêu cầu; 2 ngôn ngữ dùng bộ giọng hoàn toàn khác nhau |
| **Q5** | Tên file theo **hash(word‖lang‖voice)** | 2 dòng "晴天" dùng chung 1 file ⇒ 9 dòng chỉ tốn **8** lời gọi API (đã kiểm thật) |
| **Q6** | Giọng Trung: `cmn-CN-Wavenet-A..D` | Xem lỗi tài liệu bên dưới; trùng chữ cái A..D nên lựa chọn cũ của người dùng được giữ |
| **Q7** | Giọng Anh: `en-US-Neural2-C/F/D/J` | Cân giới tính, 4 lựa chọn cho gọn |
| **Q8** | Đổi giọng **không** tự gen lại audio cũ | Tránh đốt quota ngoài ý muốn; muốn làm lại thì bấm nút thủ công |

**⚠️ LỖI TÀI LIỆU (quan trọng cho mọi phiên sau):** `SPECIFICATION.md` §9/§11 và `settings.ts` đều ghi
giọng `cmn-CN-Neural2-*` — **Google không có giọng này**. Kiểm thật 2026-09-18 trả
`Voice 'cmn-CN-Neural2-C' does not exist`. Giá trị sai này đã nằm sẵn trong DB từ M6a, nghĩa là nếu
code theo đúng tài liệu thì **mọi lời gọi TTS đều trả 400**. Bài học: giọng/model của dịch vụ ngoài
phải **gọi thật để xác minh** trước khi viết code, đừng tin danh sách chép trong tài liệu.

**Tự quyết:** thêm nút **"Tạo audio còn thiếu (N từ)"** ở Cài đặt — SPEC §9 chỉ gen sau Import, nhưng
9 từ nhập trước M6c sẽ vĩnh viễn không có audio nếu thiếu lối chạy tay này.

**Bằng chứng:** `npm test` 216/216 · build + lint xanh · CDP **14/14** (9/9 dòng có `audio_url` với
**8** lời gọi Google · URL công khai trả `audio/mpeg` 8256 byte · `phatAm()` ưu tiên mp3, thiếu thì
Web Speech · ghi Storage không token bị chặn) · grep `dist/` không có khoá Google.
**Trạng thái:** ✅ Đã áp dụng.

### [2026-09-19] MB-26 — M7 (Ôn theo chủ đề): 6 quyết định + 1 bug vòng lặp
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Từ `mastered` ôn bằng **bộ bài của `intensive`**, KHÔNG cộng điểm (`stageBaiTap`) | `boBaiCua('mastered')` rỗng; nếu bỏ qua thì "Trái cây" chỉ ôn được 2/5 từ |
| **Q2** | Chỉ từ **đang due** mới cộng điểm + dời lịch; từ chưa due **chỉ ghi `review_log` điểm 0** (`p_state: null`) | Nhất quán "ôn thêm miễn phí" §4.4. KHÔNG dùng `xuLyTraLoi(dang_due:false)` vì nhánh bài cuối của nó vẫn có thể dời lịch/đẩy retry |
| **Q3** | Màn chọn chủ đề mượn pattern card mockup 13 (tên + N từ + thanh 6 màu) + dòng "N từ đến hạn" | Màn này KHÔNG có mockup; người dùng duyệt layout ở Brainstorm |
| **Q4** | Hội thoại theo mockup (chữ + phiên âm), thêm nút **"Hiện nghĩa"** (mặc định tắt) + loa từng dòng | `text_vi` có sẵn nhưng mockup không vẽ ⇒ để người dùng tự bật |
| **Q5** | Hội thoại chỉ hiện khi làm HẾT lượt; "Xong" → Tổng kết | §4.5 |
| **Q6** | Nút **X** ở mọi màn Player → thẳng Tổng kết, ôn bao nhiêu tính bấy nhiêu, KHÔNG hiện hội thoại | Người dùng nhấn mạnh ở Brainstorm |

**🐞 Bug thật (chỉ kiểm thật mới lộ):** chế độ topic dùng `boQuaDaDat: true` nên KHÔNG còn gì lọc từ ra
khỏi session ⇒ `napSession` dựng lại **đúng session đó mãi mãi** — kiểm thật đếm được **26 lần cùng 1
màn và 82 dòng `review_log` rác**. Vá bằng ref `daPhucVuTopic` (mỗi từ được phục vụ đúng 1 lượt).
Bài học lặp lại lần thứ 3 trong dự án: **mọi chế độ Player mới phải tự trả lời câu hỏi "cái gì làm
session kết thúc?"** trước khi code.

**Ghi chú kỹ thuật:** PostgREST không có FK `vocab_topics ↔ word_state` (cùng trỏ `vocab`) ⇒ nhúng lồng
trả PGRST200, phải tách 2 truy vấn.

**Bằng chứng:** `npm test` 245/245 · build + lint xanh · CDP 3 kịch bản (14/16 · 8/9 · 5/5; cả 3 "FAIL"
đều là lỗi script: 2 do kiểm lúc màn chưa tải xong, 1 do bộ lái thô bấm "Bỏ qua" nên 0 điểm là đúng).
Số liệu chốt: mastered 10 dòng log **điểm 0** + `word_state` không đổi 1 byte · due `total_points`
12 → 18 · `daily_retry_queue` không tăng vì từ chưa due.
**Trạng thái:** ✅ Đã áp dụng.

### [2026-09-19] MB-27 — M8 (Quản lý từ vựng & chủ đề): 7 quyết định
| Mã | Nội dung chốt | Lý do |
|---|---|---|
| **Q1** | Thùng rác = **xoá hẳn từ khỏi DB**, xác nhận nêu rõ số bài tập + "toàn bộ lịch sử ôn" | Mọi bảng `on delete cascade`; kiểm thật: xoá 1 từ ⇒ exercises/review_log/word_state về 0 |
| **Q2** | **CHẶN** xoá từ đang là **vai B** của câu hội thoại thuộc từ khác | `payload->>'blank_b_vocab_id'` là chuỗi jsonb KHÔNG có FK ⇒ cascade không dọn, xoá để lại tham chiếu treo |
| **Q3** | Sửa `word` ⇒ `audio_url = null` | M6c đặt tên file theo `hash(word‖lang‖voice)`; không xoá thì loa đọc chữ CŨ vĩnh viễn |
| **Q4** | Form **đủ 8 field** §8.4 (mockup chỉ vẽ 5), nhãn ô đầu đổi theo `lang` | Thiếu 2 ô thì `collocation_pinyin`/`example_meaning_vi` vĩnh viễn không sửa được; DB có 2 từ tiếng Anh |
| **Q5** | Xoá chủ đề = xoá luôn từ trong đó, **không đụng chủ đề khác** | Người dùng chốt. Code phòng thủ cho trường hợp n-n (xem ghi chú) |
| **Q6** | Cho **đổi tên** chủ đề (nút Lưu tường minh) | Đang có 2 chủ đề trùng tên "Thời tiết" |
| **Q7** | Tìm kiếm **lọc client**, bỏ dấu, khớp chữ/pinyin/nghĩa | Vài chục từ, không cần query lại |

**Xác nhận giả định của người dùng (kiểm, không đoán):** RPC `import_topic` **luôn `insert into vocab`**
và luôn tạo topic mới ⇒ mỗi file import sinh bộ `vocab` riêng; DB thật 9 vocab / 9 liên kết / 0 từ
thuộc >1 chủ đề. Vì `vocab_topics` vẫn là n-n nên `xoa_chu_de` xử lý cả 2 nhánh (xoá hẳn / chỉ gỡ liên kết).

**Bằng chứng:** `npm test` 264/264 · build xanh · CDP **23/23** + **8/8** (đổi chữ ⇒ audio null · xoá
vai B bị chặn · xoá chủ đề tạm: vocab 11 → 9, chủ đề khác nguyên vẹn · cascade dọn sạch 3 bảng ·
form đúng 8 ô · tìm kiếm "qua chuoi" ra 香蕉).
**Trạng thái:** ✅ Đã áp dụng.
