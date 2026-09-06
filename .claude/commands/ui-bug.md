---
description: Xử lý lỗi hiển thị/layout, áp dụng chuẩn thẩm mỹ của dự án
allowed-tools: Read, Edit, Grep, Glob
argument-hint: [mô tả lỗi hoặc vị trí component]
---

Lỗi hiển thị cần xử lý: $ARGUMENTS

Nếu người dùng đính kèm ảnh chụp màn hình, xem kỹ ảnh trước để xác định chính xác vùng bị vỡ layout/responsive trước khi đọc code.

Phạm vi tập trung: CHỈ các file CSS/Tailwind class và cấu trúc JSX của component bị lỗi — không cần đọc logic xử lý dữ liệu không liên quan.

Áp dụng nghiêm ngặt các quy tắc thẩm mỹ đã thiết lập cho dự án skills `taste.md` (bo góc mềm mại, khoảng cách nhất quán, dark mode tương thích, responsive cho cả PC và điện thoại — theo đúng phong cách Apple/Stripe/Linear đã thống nhất).

Sửa triệt để tận gốc nguyên nhân (VD: sai breakpoint, thiếu flex-wrap, conflict giữa các class Tailwind) — không chỉ vá tạm bằng cách thêm !important hoặc inline style chắp vá.