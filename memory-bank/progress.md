# Progress Log

> Cập nhật lần cuối: **2026-09-06**

## ✅ Đã xong

- [x] **Đặc tả nghiệp vụ** `SPECIFICATION.md` v1.0 — 23 quyết định DEC-01→DEC-23 đã chốt: schema 9 bảng, SRS engine, 17 dạng bài, session, cron, AI, TTS, import.
- [x] **Đặc tả thị giác** `UI_DESIGN.md` v2.0 — token 2 lớp, bảng màu 3-accent, typography, 9 pattern bài tập, đặc tả 8 nhóm màn PC + Mobile.
- [x] **Mockup HTML** — `VocaBloom_PCView.html` (18 màn × light/dark) + `VocaBloom_MobileView.html` (19 màn × light/dark).
- [x] **Bộ công cụ sinh dữ liệu import** `import_csv_vocab/` — SKILL.md + `import-schema.json` (Draft 2020-12) + `validate_import.py` + 3 file JSON mẫu.
- [x] **Hạ tầng agent** — `CLAUDE.md` (quy trình 4 bước), 5 skill trong `.claude/skills/`, 6 slash command trong `.claude/commands/`.
- [x] **Memory bank khởi tạo** (2026-08-23) — 5 file; `systemPatterns.md` viết lại từ đầu vì bản cũ là template dự án khác.

- [x] **M0 — Nền móng dự án & Hệ token** (2026-09-06). Chi tiết ngay dưới.

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

### M1 — Database
- [ ] Migration toàn bộ SQL §2 (9 bảng + 2 enum + index).
- [ ] Chốt & áp RLS / phân quyền (phụ thuộc câu hỏi mở #3 ở `activeContext.md`).
- [ ] `run_daily_maintenance()` (§5, 5 bước) + đăng ký `pg_cron` 18:00 UTC.

### M2 — Import (làm sớm: không có dữ liệu thì không test được gì)
- [ ] `importValidate.ts` — checklist §10.5 + tham chiếu chéo `temp_id` (TDD).
- [ ] Luồng UI 3 trạng thái: chọn file → preview (cảnh báo trùng không chặn) → import 1 transaction → kết quả.
- [ ] Map `temp_id → uuid` đúng thứ tự insert (vocab trước).

### M3 — SRS engine (hàm thuần, bắt buộc TDD)
- [ ] Cộng điểm theo dạng bài + giảm 50% khi dùng gợi ý.
- [ ] Ngưỡng promote theo `cycle_points`, reset cycle.
- [ ] `gap_factor(health)` + tính `next_review_date`.
- [ ] Phạt khi bỏ lỡ ngày ôn (sàn 0, mastered miễn nhiễm, không tụt stage).
- [ ] Rẽ nhánh stage3 → mastered / intensive theo `MASTER_THRESHOLD = 30`.
- [ ] Session builder (thuần 1 stage, order stage/next_review_date, OR điều kiện dialog).

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
| RLS / migration bảo mật | 🟡 Chưa chốt có Supabase Auth hay không (#2, MB-06) |
| Màn chọn topic, màn kết quả Import, các empty/loading/error state | 🟡 Chưa có mockup, cần duyệt layout trước khi code (#4) |
