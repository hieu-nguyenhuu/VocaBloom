# Active Context

> Cập nhật lần cuối: **2026-09-09** (kết thúc M3)

## Trạng thái hiện tại

**M0 (Nền móng & Hệ token) — ✅ XONG 2026-09-06.**
**M1 (Database) — ✅ XONG 2026-09-09.**
**M2a (Lõi Import: validate + transaction + CLI) — ✅ XONG 2026-09-09.**
**M3 (SRS engine — hàm thuần) — ✅ XONG 2026-09-09.**

⚡ **DB ĐÃ CÓ DỮ LIỆU THẬT** — 3 topic · 8 từ · 74 bài tập · 3 hội thoại. Cả 8 từ nằm ở
hàng đợi (`next_review_date = NULL`, `stage = 'new'`) đợi cron nhỏ giọt. M3/M4 có cái để chạy.

Database Supabase đã dựng đầy đủ và **có kiểm chứng tự động**: 10 bảng + 2 enum + 8 index,
RLS + GRANT khoá chặt, `run_daily_maintenance()` phủ 9 ca TDD, cron `pg_cron` đang chạy.

### Bằng chứng nghiệm thu (đều đã chạy thật)
| Lệnh | Kết quả |
|---|---|
| `npm run db:migrate` | ✅ **7/7** file SQL xanh — **chạy lại nhiều lần vẫn xanh** (idempotent) |
| `npm run check:schema` | ✅ **14/14** — gồm 2 phép thử RLS bằng HTTP thật |
| `npm run test:db` | ✅ **9/9** ca cron T1–T9 · DB sạch sau khi chạy |
| `npm run test:import` | ✅ **6/6** ca import I1–I6 · không đụng dữ liệu thật (mọi ca `begin…rollback`) |
| `npm test` (Vitest) | ✅ **58/58** — 15 token + 13 `importValidate` + 30 `srs` |
| `npm run check:auth` | ✅ 9/9 — 1 tài khoản, đã confirm, `disable_signup = true` |
| `npm run import:file` | ✅ đã nạp thật 3 file mẫu; `--dry-run` không ghi gì; file hỏng → exit 1 |
| `npm run build` · `npm run lint` | ✅ xanh |

### Hạ tầng đã có (chi tiết ở `systemPatterns.md` §9)
- `supabase/migrations/0001…0007.sql` — extension · schema · RLS+GRANT · seed · cron fn · cron ·
  **`import_topic()`**.
- `scripts/`: `db-lib.mjs` (dùng chung) · `db-migrate.mjs` · `check-schema.mjs` ·
  `test-maintenance.mjs` · `test-import.mjs` · `import-file.mjs` · `check-auth.mjs`.
- `src/lib/importValidate.ts` — hàm thuần, **dùng chung cho cả CLI lẫn UI** (M2b sẽ tái dùng
  nguyên, không viết lại).
- `src/lib/srs.ts` — **toàn bộ luật SRS**, hàm thuần 100% (0 dòng `import`). M4 chỉ việc gọi
  `xuLyTraLoi(...)` rồi **ghi** 3 thứ trả về xuống DB: `word_state`, `review_log`, `daily_retry_queue`.
- **0 package mới** trong cả M1 lẫn M2a.

## Việc kế tiếp — M4 (Player UI) là việc lớn duy nhất còn lại trước khi app chạy được

Sau M3, **toàn bộ logic lõi đã xong và có test**: SRS engine, import, cron, schema. Thứ còn
thiếu hoàn toàn là **phần nhìn thấy được** — hiện `App.tsx` vẫn chỉ là stub của M0.

**3 việc chặn nhau theo thứ tự:**
1. **Màn Đăng nhập** — RLS đã khoá từ M1, không có nó thì UI không đọc được dòng dữ liệu nào.
   **Chưa có mockup** ⇒ phải trình bày layout và chờ duyệt.
2. **App shell** (sidebar PC / thanh tab Mobile) — có mockup, chưa code.
3. **M4 Player** — tầng ghi DB (gọi `xuLyTraLoi` rồi persist) + 9 pattern bài tập + màn Tổng kết.
   ⚠️ Ring trong Player **bị chặn bởi gate 6 icon cây** (câu hỏi mở #2).

Hoặc làm **M2b (UI Import)** trước nếu muốn một màn nhỏ hơn để dựng và kiểm app shell.

## ⚠️ Câu hỏi mở — CẦN NGƯỜI DÙNG TRẢ LỜI

1. **🔴 Màn Đăng nhập chưa có mockup.** Hệ quả trực tiếp của MB-10. Không có nó thì app không đọc
   được DB nữa. Phải trình bày layout đề xuất (tái dùng token + pattern card sẵn có) và **chờ duyệt**
   trước khi code. Không làm màn "Quên mật khẩu"/"Đăng ký".
2. **🔴 Bộ 6 icon giai đoạn cây chưa chốt.** SVG trong 2 file HTML mới là bản nháp. Chặn mọi task
   chạm Dashboard / ring Player / Quản lý từ vựng. Không ảnh hưởng M2.
3. **🟡 Màn hình chưa có mockup khác:** màn chọn topic để "Ôn theo chủ đề", màn kết quả sau Import
   (§10.4), các trạng thái rỗng/loading/lỗi. Phải trình bày & chờ duyệt trước khi tự dựng layout.
   **Màn kết quả Import chặn trực tiếp M2.**
4. **🟡 Skill `vocab-csv-to-import` nằm ở `import_csv_vocab/`** (gốc repo), không ở `.claude/skills/`
   → Claude Code không tự nạp được. Có chuyển vào không?

## Ghi chú kỹ thuật cần nhớ cho phiên sau

### Frontend (từ M0)
- **Component CHỈ dùng utility Tailwind** (`bg-accent`, `text-content-muted`). Cấm hex, cấm
  `var(--raw-*)`, cấm `bg-[#5B4FE8]`. `tokens.test.ts` canh một phần luật này.
- **Class Tailwind phải là chuỗi nguyên vẹn trong mã nguồn** — ghép động (`bg-${x}`) không sinh CSS.
- **Thang radius/font-size đặt tên bằng SỐ** (`rounded-14`, `text-15`), không phải `rounded-xl`.
- `scripts/extract-colors.mjs` chạy lại được bất cứ lúc nào để đối chiếu màu với mockup.

### Database (từ M1) — 4 luật đầy đủ ở `systemPatterns.md` §9
- Mọi migration **phải idempotent** (không có bảng lịch sử migration).
- **RLS lọc DÒNG, GRANT mở CỬA** — bật RLS mà quên `grant` thì chính mình cũng bị `403 · 42501`.
- **CẤM `current_date`** trong hàm SQL có yếu tố ngày — DB chạy UTC, cron 18:00 UTC = 01:00 GMT+7
  **ngày hôm sau**. Luôn dùng `(now() at time zone 'Asia/Ho_Chi_Minh')::date`.
- Hàm `security definer` **phải `revoke`** khỏi `public`/`anon`/`authenticated`.

### Thói quen công cụ
- Lệnh Bash quá dài bị cắt giữa chừng → ghi file lớn theo **nhiều khối `cat >>`** nhỏ.
- Python in tiếng Việt ra stdout Windows lỗi `cp1252` — vô hại, file vẫn ghi đúng UTF-8.

## Sai lệch tài liệu đã phát hiện (ghi nhận, không tự sửa file gốc của người dùng)

- `UI_DESIGN.md` gọi mockup là `PcView.html`/`MobileView.html`; **tên thật** là
  `VocaBloom_PCView.html` / `VocaBloom_MobileView.html`.
- `UI_DESIGN.md` §8 ghi "8 màn hình"; **số thật**: PC 18 màn, Mobile 19 màn.
- `SPECIFICATION.md` §2 đánh số 9 nhóm nhưng thực tế là **10 bảng** (MB-13).
- `SPECIFICATION.md` **tự mâu thuẫn**: §3.1 nói từ mới due "+1 ngày", §5.1 nói due "hôm nay"
  → đã chốt theo §5.1 (MB-12/Q2).
- `systemPatterns.md` từng ghi card bài tập `#FFF8F0` — mã không tồn tại, đã sửa `#FFFFFF`.

## Blockers

Không có blocker kỹ thuật. Nút thắt kế tiếp là **quyết định UI**: màn Đăng nhập (#1) và màn kết
quả Import (#3) đều chưa có mockup, cả hai đều đứng chắn trước M2.
