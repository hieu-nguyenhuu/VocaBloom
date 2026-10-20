-- 0019_bat_tu_moi.sql — M32: công tắc "Thêm từ mới hằng ngày" (design.m32.md).
--
-- Chỉ khi true, run_daily_maintenance() (0005) mới nhỏ giọt từ mới (B4) và gửi cảnh báo
-- hàng đợi cạn (B5). Từ đã kích hoạt vẫn ôn bình thường. Mặc định true = giữ hành vi cũ (M32/Q2).
-- `on conflict do nothing`: chạy lại migration không ghi đè lựa chọn của người dùng.

insert into settings (key, value) values ('new_words_enabled', 'true')
on conflict (key) do nothing;
