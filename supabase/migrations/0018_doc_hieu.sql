-- 0018_doc_hieu.sql — ĐỌC HIỂU CHỦ ĐỀ (M31, design.m31.md §3).
--
-- Bảng thứ 13 `topic_readings` (đề đọc hiểu: hội thoại / đoạn văn + 2–3 câu trắc nghiệm) và
-- bảng thứ 14 `doc_hieu_log` (kết quả từng đoạn). KHÔNG tính điểm SRS: không đụng word_state /
-- review_log. Đề sinh NGOÀI app rồi nạp qua CLI `bo-sung:doc-hieu` (nguyên tắc bất biến số 1).
--
-- ⚠️ Mọi nơi đếm bảng phải cập nhật (14 bảng) và luôn liệt kê tên bảng TƯỜNG MINH (MB-13).
-- Idempotent (MB-11): không có bảng lịch sử migration, file này chạy lại mỗi lần.

create table if not exists topic_readings (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references topics(id) on delete cascade,
  thu_tu     int  not null default 0,
  kieu       text not null check (kieu in ('hoi_thoai', 'doan_van')),
  content    jsonb not null,            -- { lines[], highlight_vocab_ids[], questions[] }
  created_at timestamptz not null default now()
);
create index if not exists idx_topic_readings_topic on topic_readings (topic_id, thu_tu);

create table if not exists doc_hieu_log (
  id           uuid primary key default gen_random_uuid(),
  luot_id      uuid not null,           -- 1 lần vào màn Đọc hiểu = 1 lượt (client sinh)
  topic_id     uuid not null references topics(id) on delete cascade,
  reading_id   uuid not null references topic_readings(id) on delete cascade,
  so_cau       int  not null check (so_cau > 0),
  so_dung      int  not null,
  thoi_gian_ms int  check (thoi_gian_ms >= 0),
  created_at   timestamptz not null default now(),
  check (so_dung between 0 and so_cau)
);
create index if not exists idx_doc_hieu_log_luot    on doc_hieu_log (luot_id);
create index if not exists idx_doc_hieu_log_created on doc_hieu_log (created_at);

-- RLS + GRANT theo đúng khuôn 0013. MB-13/2: RLS lọc DÒNG, GRANT mở CỬA.
alter table topic_readings enable row level security;
drop policy if exists "authenticated_full_access" on topic_readings;
create policy "authenticated_full_access" on topic_readings
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
grant select, insert, update, delete on table topic_readings to authenticated;

alter table doc_hieu_log enable row level security;
drop policy if exists "authenticated_full_access" on doc_hieu_log;
create policy "authenticated_full_access" on doc_hieu_log
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
grant select, insert, update, delete on table doc_hieu_log to authenticated;
