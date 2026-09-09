# Progress Log

> Cập nhật lần cuối: **2026-09-09**

## ✅ Đã xong

- [x] **Đặc tả nghiệp vụ** `SPECIFICATION.md` v1.0 — 23 quyết định DEC-01→DEC-23 đã chốt: schema 9 bảng, SRS engine, 17 dạng bài, session, cron, AI, TTS, import.
- [x] **Đặc tả thị giác** `UI_DESIGN.md` v2.0 — token 2 lớp, bảng màu 3-accent, typography, 9 pattern bài tập, đặc tả 8 nhóm màn PC + Mobile.
- [x] **Mockup HTML** — `VocaBloom_PCView.html` (18 màn × light/dark) + `VocaBloom_MobileView.html` (19 màn × light/dark).
- [x] **Bộ công cụ sinh dữ liệu import** `import_csv_vocab/` — SKILL.md + `import-schema.json` (Draft 2020-12) + `validate_import.py` + 3 file JSON mẫu.
- [x] **Hạ tầng agent** — `CLAUDE.md` (quy trình 4 bước), 5 skill trong `.claude/skills/`, 6 slash command trong `.claude/commands/`.
- [x] **Memory bank khởi tạo** (2026-08-23) — 5 file; `systemPatterns.md` viết lại từ đầu vì bản cũ là template dự án khác.

- [x] **M0 — Nền móng dự án & Hệ token** (2026-09-06). Chi tiết ngay dưới.
- [x] **M1 — Database** (2026-09-09). Chi tiết ngay dưới.
- [x] **M2a — Lõi Import** (2026-09-09). Chi tiết ngay dưới.
- [x] **M3 — SRS engine** (2026-09-09). Chi tiết ngay dưới.

### ✅ M0 — Nền móng dự án (XONG 2026-09-06)
- [x] Scaffold Vite 8 + React 19 + TS strict + Tailwind v4 + Vitest 5 + react-router — `npm run build` xanh.
- [x] `src/styles/tokens.css` — **4 tầng**: Lớp 1 raw hex → Lớp 2 semantic (3 nhánh light/dark)
      → Mastery Ring bất biến → `@theme inline` bắc cầu ra Tailwind.
- [x] `scripts/extract-colors.mjs` — trích màu tách 37 frame light / 37 frame dark, **không đoán**.
      Giải quyết được cặp `#B7AFC9`(light) / `#55566A`(dark) mà mắt thường suy luận ngược.
- [x] `src/styles/tokens.test.ts` — 15 assertion canh cổng kiến trúc token (TDD RED→GREEN).
- [x] 3 font qua CDN Google Fonts, 0 package. Thang radius 11 mức + font-size 20 mức theo mockup.
- [x] `src/lib/supabase.ts` (client singleton) + `npm run check:db` — ping Supabase thật ✅.
- [x] Trang swatch dev `/dev/tokens` — đã chụp đối chiếu light + dark.
- [x] Dọn: `.gitignore` đầy đủ, xoá file demo của template, sửa lỗi `#FFF8F0` trong memory-bank.

### ✅ M1 — Database (XONG 2026-09-09)
- [x] **Hạ tầng migration không cần CLI** — `scripts/db-lib.mjs` + `db-migrate.mjs` gửi SQL qua
      Supabase Management API bằng `fetch`. **0 package mới.** 6 file trong `supabase/migrations/`.
- [x] **Schema §2 đầy đủ** — 2 enum (6 + 17 nhãn) + **10 bảng** + **8 index**
      (7 của spec + `idx_review_log_reviewed_at` cho §4.6, chốt Q3).
- [x] **RLS Phương án A** — Supabase Auth 1 tài khoản (`disable_signup`), 10 policy
      `authenticated_full_access`, **không thêm cột `user_id`**, schema §2 giữ nguyên 100%.
- [x] **GRANT** — phát hiện khi nghiệm thu: bảng tạo qua Management API không có quyền mặc định.
      Chỉ cấp cho `authenticated`; `anon` không có quyền nào ⇒ bị chặn ngay tầng quyền.
- [x] **`run_daily_maintenance()`** — đủ 5 bước §5, quy chiếu `Asia/Ho_Chi_Minh`
      (không dùng `current_date`), đã `revoke` khỏi `public`/`anon`/`authenticated`.
- [x] **TDD 9/9** — `npm run test:db`, chạy ĐỬe trước khi có hàm rồi mới XANH,
      mọi ca trong `begin…rollback` nên DB không còn dòng rác nào.
- [x] **pg_cron** — job `daily-srs-maintenance` `0 18 * * *`, `active = true`.
- [x] **`npm run check:schema` 14/14** — gồm 2 phép thử RLS bằng HTTP thật.

### ✅ M2a — Lõi Import (XONG 2026-09-09) — phần UI hoãn sang M2b
- [x] `src/lib/importValidate.ts` — hàm **thuần**, validate 2 lớp (cấu trúc + tham chiếu chéo
      `temp_id`), port từ `validate_import.py`. **0 package** — không cài `ajv` (MB-14/Q2).
- [x] `supabase/migrations/0007_import_topic.sql` — 7 bước trong **1 transaction**
      tất-cả-hoặc-không (§10.4). Không `security definer` ⇒ không sinh lỗ hổng RPC.
- [x] `scripts/import-file.mjs` + `npm run import:file -- <file> [--dry-run]` — đăng nhập thật
      rồi gọi RPC qua PostgREST, đi ĐÚNG đường mà UI sẽ đi (chịu đủ RLS + GRANT).
- [x] **TDD 2 phía:** 12 ca Vitest (`npm test` 27/27) + 6 ca SQL (`npm run test:import` 6/6).
- [x] **Dữ liệu thật đã nạp:** 3 topic (Trái cây zh / Nghề nghiệp en / Thời tiết zh) · 8 từ ·
      74 bài tập · 3 hội thoại. Cả 8 từ ở hàng đợi (`next_review_date = NULL`, `stage = 'new'`).
- [x] Vá `tsconfig.test.json` thiếu `allowImportingTsExtensions` (build đỏ khi test import file `.ts`).

### M2b — UI Import (chưa làm, chờ chốt 2 layout)
- [ ] Màn Đăng nhập (**chưa có mockup** — hệ quả của MB-10, chặn mọi UI đọc DB).
- [ ] App shell: sidebar PC / thanh tab Mobile (có mockup, chưa code).
- [ ] Màn 15 Chọn file + màn 16 Preview (có mockup) — tái dùng `importValidate.ts` sẵn có.
- [ ] Màn Kết quả sau Import §10.4 (**chưa có mockup**).

### ✅ M3 — SRS engine (XONG 2026-09-09)
- [x] `src/lib/srs.ts` — **hàm thuần 100%**, không có lấy một dòng `import` nào.
- [x] Cộng điểm theo dạng bài (1/2/3/4) + giảm 50% làm tròn xuống khi dùng gợi ý.
- [x] Ngưỡng promote theo `cycle_points` (3/4 · 6/8 · 9/12), reset cycle khi sang vòng mới.
- [x] `gap_factor(health)` 3 mốc + `next_review_date` theo gap của **stage ĐÍCH** (không phải nguồn).
- [x] Bảng phạt `tinhPhat` (mastered miễn nhiễm) — có test X1 canh khớp với hàm SQL của M1.
- [x] Rẽ nhánh stage3 → mastered / intensive theo `MASTER_THRESHOLD = 30`, kiểm ở cả 2 thời điểm §3.3.
- [x] `gomSession` — thuần 1 stage, order `stage ASC, next_review_date ASC`, phần dư thành session riêng.
- [x] `xuLyFlashcard` Good/Hard/Again + luật §4.4 (dialog 2 từ: chỉ cộng điểm cho từ đang due).
- [x] **30 ca test** (`npm test` tổng 58/58), gồm 3 ca chống lệch X1/X2/X1c.
- [ ] *Ghi xuống DB và điều kiện OR của query dialog — thuộc M4, không phải M3.*

### M4 — Player UI (theo Exercise Shell + 9 pattern)
- [ ] Shell chung: ring + 3 nút tiện ích ghost + progress dots.
- [ ] Nhóm Stage 0 (6 dạng) → Stage 1 (4) → Stage 2 (4) → Stage 3 (3).
- [ ] Flashcard Good/Hard/Again + `daily_retry_queue`.
- [ ] Màn Tổng kết phiên (§4.6 — query `review_log` cả ngày).

### M5 — AI
- [ ] Chấm bài stage 3: batch 3 request/session, parse JSON có retry strip code-fence, nút "Chấm lại".
- [ ] Giải thích lazy + cache `exercises.ai_explanation`.

### M6 — TTS · Settings · Dashboard
- [ ] Pipeline Google TTS sau Import → Supabase Storage → `vocab.audio_url`; fallback Web Speech API.
- [ ] Màn Cài đặt (3 nhóm) đọc/ghi bảng `settings`.
- [ ] Dashboard + Khu vườn (2 nguồn màu khác nhau) + Mastery ring **(chặn bởi gate icon cây)**.
- [ ] Màn Thông báo + logic cảnh báo hàng đợi cạn.

### M7 — Ôn theo topic
- [ ] Chọn topic → session toàn topic → màn hội thoại kết thúc.

## 🚧 Đang chặn

| Hạng mục | Chặn bởi |
|---|---|
| Dashboard, ring Player, Quản lý từ vựng | 🔴 Bộ 6 icon cây chưa chốt (`activeContext.md` #1) |
| ~~`ai.ts`, `tts.ts`~~ | ✅ Đã gỡ chặn — chốt gọi thẳng từ frontend (MB-04) |
| ~~Kết nối Supabase~~ | ✅ Đã gỡ chặn 2026-09-06 — project khôi phục, `check:db` xanh |
| ~~RLS / migration bảo mật~~ | ✅ Đã gỡ chặn 2026-09-09 — chốt Phương án A (MB-10), đã triển khai xong |
| Màn chọn topic, màn kết quả Import, các empty/loading/error state | 🟡 Chưa có mockup, cần duyệt layout trước khi code (#4) |
