# DESIGN.md — chỉ mục task hiện tại: M26 (Từ vựng phụ song ngữ Trung ↔ Anh)

> Từ M26, thiết kế và Plan được tách thành file riêng theo milestone (người dùng yêu cầu 2026-10-03).
> M25 (task trước) đã xong và ghi vào memory-bank MB-46.

| File | Nội dung | Trạng thái |
|---|---|---|
| [`Design.m26.md`](Design.m26.md) | Thiết kế TỔNG M26: yêu cầu đã chốt, dữ liệu, bảng điểm 39, 6 thay đổi Player, layout màn gần nghĩa / Flashcard / hội thoại, lộ trình M26a–d | ✅ Đã duyệt 2026-10-03 |
| [`design.m26a.md`](design.m26a.md) | Plan thi công M26a — 16 task có code cụ thể | ✅ Xong 2026-10-03 (MB-47) |
| [`design.m26b.md`](design.m26b.md) | Plan M26b — bổ sung dữ liệu song ngữ 678 từ + 40 hội thoại (11 task, 4 đợt) | ✅ Đóng 2026-10-05 (T11) |
| [`design.m26c.md`](design.m26c.md) | Plan M26c — 4 dạng Trung–Anh không payload + vá `de_bai` chấm AI (10 task) | ✅ Xong 2026-10-05 (MB-48) |
| [`design.m26d.md`](design.m26d.md) | Plan M26d — màn "Phân biệt từ gần nghĩa" + bảng điểm 15/12/39 + `secondary_word NOT NULL` (10 task) | ✅ Xong 2026-10-05 (MB-49) — ảnh bố cục ✅ duyệt |
| [`design.m27.md`](design.m27.md) | **M27** — Bộ "HSK3 giao tiếp" mới (15 chủ đề ~300 từ, có hư từ), thay bộ H3 cũ, học trước H4. Huỷ Đợt 3 M26b | ✅ XONG 2026-10-05 (M27d đã chạy) |
| [`design.m27a.md`](design.m27a.md) | Plan M27a — danh sách từ CSV (cổng duyệt) + builder `dung_h3.py` có test (13 task) | ✅ Xong 2026-10-05 — danh sách từ ✅ duyệt |
| [`design.m27b.md`](design.m27b.md) | Plan M27b — soạn chủ đề thử 01 đủ chuẩn → build → 3 cổng → duyệt văn phong (7 task) | ✅ Xong 2026-10-05 — văn phong ✅ duyệt |
| [`design.m28.md`](design.m28.md) | **M28** — Select Dialog: gỡ từ đã điền khỏi câu, chip ẩn/hiện lại, chấm khi bấm "Kiểm tra" | ✅ Duyệt 2026-10-05 |
| [`design.m28a.md`](design.m28a.md) | Plan M28a — 9 task: hàm thuần `dienChip/goO/oGoLui` (TDD) · `HoiThoai.tsx` · tài liệu · CDP | ✅ Xong 2026-10-05 (MB-50) — CDP 58/58 |
| [`design.m27c.md`](design.m27c.md) | Plan M27c — soạn 14 chủ đề 02–15 theo chuẩn chủ đề 01, 2 đợt, validate 15/15 | ✅ Xong 2026-10-05 — 15/15 sạch · M27d đã chạy |
