-- 0005_maintenance.sql — run_daily_maintenance() (SPECIFICATION.md §5, 5 bước).
--
-- ⚠️ BẪY MÚI GIỜ: database chạy UTC, cron chạy 18:00 UTC = 01:00 SÁNG GMT+7 của
-- NGÀY HÔM SAU. Đúng thời điểm đó current_date (UTC) vẫn còn là ngày hôm trước
-- theo giờ VN. => CẤM dùng current_date trong hàm này, luôn quy chiếu Asia/Ho_Chi_Minh.
--
-- ⚠️ ĐÁNH ĐỔI ĐÃ BIẾT: từ được ôn trong khung 00:00–01:00 giờ VN (trước lúc cron
-- chạy) sẽ KHÔNG bị phạt cho ngày hôm trước, do chốt chống-phạt-chồng dựa trên
-- updated_at. Cửa sổ rất hiếm và lệch về phía KHOAN DUNG — đúng tinh thần sản phẩm.

create or replace function run_daily_maintenance() returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $fn$
declare
  hom_nay      date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;  -- ngày VN vừa bắt đầu
  ngay_vua_qua date := hom_nay - 1;                                    -- ngày VN vừa kết thúc
  so_tu_moi    int  := coalesce((select (value #>> '{}')::int
                                   from settings where key = 'new_words_per_day'), 5);
  bat_canh_bao boolean := coalesce((select (value #>> '{}')::boolean
                                   from settings where key = 'low_queue_alert_enabled'), true);
  da_kich_hoat int;
  con_lai      int;
begin
  -- B1. PHẠT ĐIỂM (§3.5 / DEC-08) — chỉ trừ total_points, TUYỆT ĐỐI không đụng stage (DEC-09).
  update word_state ws set
    total_points = greatest(ws.total_points - case ws.stage
        when 'new'       then 1
        when 'stage1'    then 2
        when 'stage2'    then 3
        when 'stage3'    then 4
        when 'intensive' then 5
        else 0
      end, 0),                                            -- sàn 0
    updated_at = now()
  where ws.next_review_date is not null
    and ws.next_review_date <= ngay_vua_qua               -- Q1: phạt MỖI ngày bỏ lỡ
    and ws.stage <> 'mastered'                            -- mastered miễn nhiễm
    and coalesce((ws.last_reviewed_at at time zone 'Asia/Ho_Chi_Minh')::date,
                 date '-infinity') <> ngay_vua_qua        -- đã ôn hôm qua thì tha
    and (ws.updated_at at time zone 'Asia/Ho_Chi_Minh')::date < hom_nay;  -- chống phạt chồng

  -- B2. RESET CYCLE (§3.7 / DEC-05) — từ đã ôn dở nhưng chưa đạt ngưỡng thì bắt đầu vòng mới.
  update word_state set
    cycle_points = 0,
    cycle_completed_exercises = '[]',
    updated_at = now()
  where next_review_date is not null
    and next_review_date <= ngay_vua_qua
    and cycle_points > 0;

  -- B3. DỌN HÀNG ĐỢI RETRY của ngày cũ (DEC-06).
  delete from daily_retry_queue where queue_date < hom_nay;

  -- B4. NHỎ GIỌT TỪ MỚI (§5.1 / DEC-16). Q2 đã chốt: due = hom_nay, không phải hom_nay+1.
  select count(*) into da_kich_hoat
    from word_state where stage = 'new' and next_review_date = hom_nay;

  if da_kich_hoat < so_tu_moi then
    update word_state set next_review_date = hom_nay, updated_at = now()
    where vocab_id in (
      select vocab_id from word_state
       where next_review_date is null and stage = 'new'
       order by added_at asc                              -- FIFO
       limit (so_tu_moi - da_kich_hoat)
    );
  end if;

  -- B5. CẢNH BÁO HÀNG ĐỢI CẠN (§5.2).
  select count(*) into con_lai
    from word_state where next_review_date is null and stage = 'new';

  if bat_canh_bao and con_lai < so_tu_moi * 3
     and not exists (select 1 from notifications
                      where type = 'low_queue' and is_read = false
                        and created_at > now() - interval '24 hours') then
    insert into notifications (type, message) values ('low_queue',
      format('⚠️ Hàng đợi từ mới sắp cạn — chỉ đủ dùng ~%s ngày. Hãy import thêm từ vựng.',
             floor(con_lai::numeric / greatest(so_tu_moi, 1))));
  end if;
end $fn$;

-- BẮT BUỘC: hàm khai SECURITY DEFINER (bypass RLS). Postgres mặc định cấp execute cho
-- public => bất kỳ ai cầm anon key đều gọi được qua POST /rest/v1/rpc/run_daily_maintenance
-- và ép chạy vòng phạt điểm bất cứ lúc nào. Thu hồi để chỉ postgres (pg_cron) gọi được.
revoke all on function run_daily_maintenance() from public;
revoke all on function run_daily_maintenance() from anon;
revoke all on function run_daily_maintenance() from authenticated;
