# Active Context

> Cập nhật lần cuối: **2026-08-23**

## Trạng thái hiện tại

Dự án đang ở **Ngày 0 — mới có tài liệu, chưa có 1 dòng code app nào.**

Repo hiện chỉ chứa: tài liệu đặc tả (`SPECIFICATION.md`, `UI_DESIGN.md`), 2 file mockup HTML, bộ skill `.claude/`, skill sinh dữ liệu import `import_csv_vocab/`, và `memory-bank/` vừa khởi tạo. **Chưa có `package.json`, chưa scaffold Vite/React/Tailwind, chưa có project Supabase nào được migrate.**

## Trọng tâm phiên hiện tại

- [x] Đọc toàn bộ `.claude/skills/` + toàn bộ tài liệu repo.
- [x] Khởi tạo 5 file `memory-bank/` (productContext, systemPatterns, activeContext, progress, decisionLog).
- [ ] Chờ người dùng chốt các câu hỏi mở bên dưới trước khi bước vào Bước 1 (Brainstorm) của milestone đầu tiên.

## Việc kế tiếp (đề xuất, theo `SPECIFICATION.md` §14)

1. Scaffold Vite + React + TS + Tailwind, dựng `tokens.css` 2 lớp từ bảng màu thật.
2. Migration DB — toàn bộ SQL §2.
3. `run_daily_maintenance()` + đăng ký `pg_cron`.
4. Import validator + luồng Import (phải có trước, không có dữ liệu thì không test được gì khác).
5. SRS engine (hàm thuần, TDD).

## ⚠️ Câu hỏi mở — CẦN NGƯỜI DÙNG TRẢ LỜI

1. **🔴 Bộ 6 icon giai đoạn cây chưa chốt.** SVG trong 2 file HTML mới là bản nháp; người dùng muốn bộ icon "thật mắt và đồng bộ" hơn. Chặn mọi task chạm Dashboard / ring Player / Quản lý từ vựng.
2. ~~API key gọi từ đâu?~~ ✅ **ĐÃ CHỐT 2026-08-23: gọi thẳng từ frontend**, không dựng Edge Function proxy. Key đọc từ bảng `settings` (xem MB-04).
3. **🟡 Auth & RLS** (chưa chốt, chỉ cần trước khi viết migration M1). `.env.local` có `EMAIL`/`PASSWORD` → có vẻ định dùng Supabase Auth 1 tài khoản. Đề xuất mặc định: bật Auth 1 tài khoản + RLS `auth.uid() is not null` trên mọi bảng (không cần thêm cột `user_id`). Xem MB-06.
4. **🟡 Màn hình chưa có mockup.** 2 file HTML không có: màn chọn topic để "Ôn theo chủ đề", màn kết quả sau Import (§10.4 bước "Kết quả"), trạng thái rỗng/loading/lỗi của các màn. Theo `CLAUDE.md`, phải trình bày & chờ xác nhận trước khi tự dựng layout mới.
5. **🟡 Skill `vocab-csv-to-import` nằm ở `import_csv_vocab/` (gốc repo), không ở `.claude/skills/`** → Claude Code không tự nạp được. Có muốn chuyển vào `.claude/skills/vocab-csv-to-import/` để gọi được không?
6. **🟢 `support.js`** được 2 file HTML tham chiếu nhưng không có trong repo — xác nhận không cần (chỉ phục vụ cuộn gallery).

## Sai lệch tài liệu đã phát hiện (đã ghi nhận, không tự sửa file gốc)

- `UI_DESIGN.md` gọi mockup là `PcView.html` / `MobileView.html`; **tên thật** là `VocaBloom_PCView.html` / `VocaBloom_MobileView.html`.
- `UI_DESIGN.md` ghi "8 màn hình" ở §8 và "36-38 khung" ở §3; **số thật**: PC 18 màn (36 khung), Mobile 19 màn (38 khung).
- `memory-bank/systemPatterns.md` bản cũ là template của dự án khác (Convex Cloud, "Mục tiêu tiết kiệm") → **đã viết lại toàn bộ**.

## Blockers

Không có blocker cho **M0 (scaffold + hệ token)** — sẵn sàng bắt đầu. Còn chờ: câu 1 (icon cây) chặn các màn có ring; câu 3 (Auth/RLS) chặn migration M1; câu 4 chặn các màn chưa có mockup.
