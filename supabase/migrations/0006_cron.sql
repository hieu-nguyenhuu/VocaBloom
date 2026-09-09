-- 0006_cron.sql — lịch chạy run_daily_maintenance() (SPECIFICATION.md §5).
--
-- '0 18 * * *' = 18:00 UTC = 01:00 sáng GMT+7. Hàm tự quy chiếu Asia/Ho_Chi_Minh
-- nên không phụ thuộc timezone của database (đang là UTC).
--
-- Idempotent: gỡ job cũ (nếu có) trước khi đăng ký lại.

do $$ begin
  perform cron.unschedule('daily-srs-maintenance')
   where exists (select 1 from cron.job where jobname = 'daily-srs-maintenance');
end $$;

select cron.schedule(
  'daily-srs-maintenance',
  '0 18 * * *',
  $$ select run_daily_maintenance(); $$
);
