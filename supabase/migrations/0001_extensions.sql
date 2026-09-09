-- 0001_extensions.sql — extension cần cho M1.
-- pg_cron: lịch chạy run_daily_maintenance() mỗi 18:00 UTC (= 01:00 GMT+7).
-- Idempotent nhờ "if not exists".

create extension if not exists pg_cron;
