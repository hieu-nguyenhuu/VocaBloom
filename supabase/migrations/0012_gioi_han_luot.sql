-- 0012_gioi_han_luot.sql — giới hạn số từ mỗi LƯỢT ôn (M11/Q1).
--
-- Trước đây Player tự nạp session kế tiếp cho tới khi hết từ due ⇒ mỗi lần bấm "Bắt đầu ôn tập"
-- là ôn sạch mọi từ. Nay dừng lại sau `max_tu_moi_luot` từ; bấm lại thì ôn tiếp phần còn lại.
-- `on conflict do nothing` để chạy lại không ghi đè lựa chọn người dùng.

insert into settings (key, value) values ('max_tu_moi_luot', '10')
on conflict (key) do nothing;
