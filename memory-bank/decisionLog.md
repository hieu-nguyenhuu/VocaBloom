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

### [2026-08-23] MB-05 — Logic SRS tách khỏi UI
- **Quyết định:** Toàn bộ SRS engine là hàm thuần trong `src/lib/srs.ts`, không import React/Supabase.
- **Lý do:** `CLAUDE.md` Bước 3 bắt buộc TDD RED→GREEN→REFACTOR cho logic tính điểm/lên stage/gap/phạt/session — logic dính UI hoặc network thì không viết test nhỏ chạy nhanh được.
- **Trạng thái:** ✅ Chốt làm chuẩn kiến trúc.
