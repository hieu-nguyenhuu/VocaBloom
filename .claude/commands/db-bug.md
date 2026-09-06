---
description: Xử lý lỗi cơ sở dữ liệu, đối chiếu trực tiếp với Supabase thay vì đoán mò
allowed-tools: Read, Edit, Bash(node:*), Bash(npx supabase:*)
argument-hint: [mô tả lỗi]
---

Lỗi cần xử lý: $ARGUMENTS

Kích hoạt quy tắc từ skill `db-diagnostics`
BƯỚC BẮT BUỘC ĐẦU TIÊN — không được đoán cấu trúc dữ liệu:
1. Viết một script ngắn (Node hoặc dùng Supabase CLI) để cào cấu trúc bảng thực tế (schema, kiểu dữ liệu, constraints) từ Supabase về một file JSON local (VD: `.tmp/db-schema-snapshot.json`)
2. Nếu nghi ngờ dữ liệu cụ thể (không chỉ schema) đang sai, cào thêm một vài dòng dữ liệu mẫu liên quan để đối chiếu
3. Đọc file JSON vừa tạo và SO SÁNH với những gì code đang giả định (tên cột, kiểu dữ liệu, quan hệ giữa các bảng)

Chỉ sau khi có bằng chứng cụ thể từ schema/data thật, mới bắt đầu sửa code. Không sửa dựa trên phỏng đoán về cấu trúc DB.

Sửa bằng diff patch cục bộ, không viết lại toàn bộ file/migration.

Sau khi xong, xóa file snapshot tạm trong `.tmp/` nếu không còn cần dùng.