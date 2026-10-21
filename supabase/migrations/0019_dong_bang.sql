-- 0019_dong_bang.sql — M33: ĐÓNG BĂNG LỊCH ÔN (design.m33.md). Thay công tắc M32 "Thêm từ mới hằng ngày".
--
-- settings.dong_bang_luc (jsonb): null = bình thường · chuỗi timestamptz = đang đóng băng từ lúc đó (F = ngày VN).
-- Mô hình "chặn dòng chảy vào, giữ phần tồn đọng": khi đóng băng, từ đến hạn = next_review_date ≤ F (client tính
-- bằng `ngayHieuLuc`); cron bỏ B1 phạt · B2 reset vòng · B4 nhỏ giọt · B5 cảnh báo (0005). Mở băng dời hạn từ bị giữ.
--
-- Idempotent (MB-11): file chạy lại mỗi lần migrate.

-- Q8: công tắc M32 đang TẮT ⇒ bắt đầu ở trạng thái ĐÓNG BĂNG từ lúc chạy migration.
-- `on conflict do nothing` ⇒ chạy lại không đổi mốc / không ghi đè lựa chọn người dùng.
insert into settings (key, value)
select 'dong_bang_luc',
       case when exists (select 1 from settings where key = 'new_words_enabled' and value = 'false'::jsonb)
            then to_jsonb(now()) else 'null'::jsonb end
on conflict (key) do nothing;

-- Key M32 không còn dùng (đã đổi sang đóng băng) — xoá SAU khi đã đọc nó ở trên.
delete from settings where key = 'new_words_enabled';

-- Bắt đầu đóng băng. Đã đóng băng thì GIỮ mốc cũ (bấm 2 lần không đổi ngày F).
create or replace function dong_bang_lich() returns jsonb
language plpgsql as $fn$
begin
  insert into settings (key, value) values ('dong_bang_luc', to_jsonb(now()))
  on conflict (key) do update
    set value = case when settings.value = 'null'::jsonb then to_jsonb(now()) else settings.value end;
  return (select value from settings where key = 'dong_bang_luc');
end $fn$;

-- Mở băng: dời hạn các từ bị giữ thêm N = hôm nay − F ngày ("dừng đồng hồ"), rồi xoá mốc. 1 transaction.
-- Chỉ dời từ: còn lịch (≠ mastered), hạn > F (không phải tồn đọng), và CHƯA ôn sau mốc đóng băng
-- (từ tồn đọng ôn trong lúc đóng băng đã có hạn mới tính từ ngày ôn ⇒ giữ nguyên, M33/Q6).
create or replace function mo_bang_lich() returns jsonb
language plpgsql as $fn$
declare
  v_luc timestamptz;
  v_f   date;
  v_n   int := 0;
  v_so  int := 0;
begin
  select (value #>> '{}')::timestamptz into v_luc from settings where key = 'dong_bang_luc';
  if v_luc is null then
    return jsonb_build_object('so_ngay', 0, 'so_tu_doi', 0);
  end if;

  v_f := (v_luc at time zone 'Asia/Ho_Chi_Minh')::date;
  v_n := greatest(((now() at time zone 'Asia/Ho_Chi_Minh')::date - v_f), 0);   -- CẤM current_date (luật DB 3)

  if v_n > 0 then
    update word_state set next_review_date = next_review_date + v_n, updated_at = now()
    where stage <> 'mastered'
      and next_review_date > v_f
      and (last_reviewed_at is null or last_reviewed_at <= v_luc);
    get diagnostics v_so = row_count;
  end if;

  update settings set value = 'null'::jsonb where key = 'dong_bang_luc';
  return jsonb_build_object('so_ngay', v_n, 'so_tu_doi', v_so);
end $fn$;

-- Không security definer ⇒ chạy quyền authenticated, chịu RLS như mọi bảng. Chỉ authenticated được gọi.
revoke execute on function dong_bang_lich() from public, anon;
revoke execute on function mo_bang_lich()   from public, anon;
grant  execute on function dong_bang_lich() to authenticated;
grant  execute on function mo_bang_lich()   to authenticated;
