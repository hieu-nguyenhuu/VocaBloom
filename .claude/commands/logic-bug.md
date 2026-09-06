---
description: Xử lý lỗi logic nặng, sửa bằng diff patch cục bộ
allowed-tools: Read, Edit, Grep, Bash(npm test:*)
argument-hint: [mô tả lỗi]
---

Tập trung vào các file xử lý logic, hàm xử lý dữ liệu, và file cấu hình backend/API liên quan đến: $ARGUMENTS

Áp dụng quy tắc nén token nghiêm ngặt từ skill `token-discipline`. Suy luận sâu để tìm lỗi thuật toán, async/await, hoặc sai lệch luồng dữ liệu.

QUAN TRỌNG: chỉ sửa bằng diff patch cục bộ, KHÔNG viết lại toàn bộ file.