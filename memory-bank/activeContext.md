# Active Context

> Cập nhật lần cuối: **2026-09-06** (kết thúc M0)

## Trạng thái hiện tại

**M0 (Nền móng dự án & Hệ token) — ✅ HOÀN THÀNH.**

Repo đã chạy được: Vite 8 + React 19 + TypeScript strict + Tailwind v4 + Vitest 5 + react-router,
hệ token 4 tầng dựng xong từ màu trích thật, và đã ping thành công Supabase thật.

### Bằng chứng nghiệm thu (đều đã chạy, không phải "về logic thì đúng")
| Lệnh | Kết quả |
|---|---|
| `npm run build` | ✅ xanh — 76 module, CSS 20.63 kB, JS 234.99 kB |
| `npm test` | ✅ 15/15 pass (test canh cổng token) |
| `npm run check:db` | ✅ auth HTTP 200 + REST nhận anon key |
| `/dev/tokens` | ✅ đã chụp cả light lẫn dark, đối chiếu khớp mockup |

### Supabase — đã thông hoàn toàn (2026-09-06)
- Project `myjdweopndizbhexqufo` · region `ap-southeast-1` · status `ACTIVE_HEALTHY`.
- **Bối cảnh:** đầu phiên project ở trạng thái bị pause/thu hồi (DNS trả `Non-existent domain`,
  access token 401). Người dùng đã khôi phục project và tạo lại access token trong phiên.
- `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN` đều hợp lệ.
- Query `vocab` trả `PGRST205` — **đúng như mong đợi**, schema trống vì migration nằm ở M1.

## Việc kế tiếp — M1 (Database)

1. **Chốt Auth & RLS trước khi viết migration** (xem MB-06 + câu hỏi mở #2 bên dưới).
2. Migration toàn bộ SQL `SPECIFICATION.md` §2 — 9 bảng + 2 enum + index.
3. `run_daily_maintenance()` (§5, 5 bước) + đăng ký `pg_cron` 18:00 UTC.

Sau M1 là M2 (Import) — làm sớm vì không có dữ liệu thì không test được gì khác.

## ⚠️ Câu hỏi mở — CẦN NGƯỜI DÙNG TRẢ LỜI

1. **🔴 Bộ 6 icon giai đoạn cây chưa chốt.** SVG trong 2 file HTML mới là bản nháp; người dùng
   muốn bộ icon "thật mắt và đồng bộ" hơn. Chặn mọi task chạm Dashboard / ring Player / Quản lý
   từ vựng. **M0 không bị ảnh hưởng** (không render icon nào).
2. **🟡 Auth & RLS — chặn M1.** Đề xuất mặc định: bật Supabase Auth 1 tài khoản + RLS
   `auth.uid() is not null` trên mọi bảng (không thêm cột `user_id` vì single-user). Xem MB-06.
3. **🟡 Biến `EMAIL` trong `.env.local` chỉ có 1 ký tự** — gần như chắc chắn là giá trị rác.
   Liên quan trực tiếp câu 2, cần làm rõ khi chốt Auth.
4. **🟡 Màn hình chưa có mockup:** màn chọn topic để "Ôn theo chủ đề", màn kết quả sau Import
   (§10.4), trạng thái rỗng/loading/lỗi. Phải trình bày & chờ duyệt trước khi tự dựng layout.
5. **🟡 Skill `vocab-csv-to-import` nằm ở `import_csv_vocab/`** (gốc repo), không ở
   `.claude/skills/` → Claude Code không tự nạp được. Có chuyển vào không?

## Ghi chú kỹ thuật cần nhớ cho phiên sau

- **Component CHỈ dùng utility Tailwind** (`bg-accent`, `text-content-muted`). Cấm hex, cấm
  `var(--raw-*)`, cấm `bg-[#5B4FE8]`. Test `tokens.test.ts` canh một phần luật này.
- **Class Tailwind phải là chuỗi nguyên vẹn trong mã nguồn** — ghép động (`bg-${x}`) sẽ không
  sinh ra CSS. Trong `TokenSheet.tsx` đã phải liệt kê class dạng mảng chuỗi vì lý do này.
- **Thang radius/font-size đặt tên bằng SỐ** (`rounded-14`, `text-15`), không phải `rounded-xl`
  — vì mockup dùng 11 mức radius và 20 mức font-size, phần lớn không có trong thang Tailwind.
- `scripts/extract-colors.mjs` chạy lại được bất cứ lúc nào để đối chiếu màu với mockup.

## Sai lệch tài liệu đã phát hiện (ghi nhận, không tự sửa file gốc của người dùng)

- `UI_DESIGN.md` gọi mockup là `PcView.html` / `MobileView.html`; **tên thật** là
  `VocaBloom_PCView.html` / `VocaBloom_MobileView.html`.
- `UI_DESIGN.md` ghi "8 màn hình" ở §8; **số thật**: PC 18 màn, Mobile 19 màn.
- `systemPatterns.md` từng ghi card bài tập là `#FFF8F0` — **mã không tồn tại**, đã sửa thành
  `#FFFFFF` (2026-09-06).

## Blockers

Không có blocker cho việc tiếp tục. M1 cần trả lời câu hỏi #2 (Auth/RLS) trước khi viết migration.
