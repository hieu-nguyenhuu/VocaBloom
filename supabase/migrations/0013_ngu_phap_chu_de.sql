-- 0013_ngu_phap_chu_de.sql — Ngữ pháp CỦA CHỦ ĐỀ (M12, DESIGN.md §4.1).
--
-- Phân biệt với ngữ pháp CỦA TỪ (exercise_type = 'grammar', gắn với 1 vocab):
-- ngữ pháp chủ đề KHÔNG thuộc từ nào, không tính điểm, không vào SRS. Vì `exercises`
-- bắt buộc có vocab_id nên nhét vào đó sẽ phải bịa một vocab_id giả => tách bảng riêng.
--
-- ⚠️ Đây là BẢNG THỨ 11 của dự án (trước M12 là 10 — xem MB-13). Mọi nơi đếm bảng phải
-- cập nhật và luôn liệt kê tên bảng TƯỜNG MINH, không đếm theo trí nhớ.
--
-- Idempotent (MB-11): không có bảng lịch sử migration, file này chạy lại mỗi lần.

create table if not exists topic_grammar (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid not null references topics(id) on delete cascade,
  thu_tu         int  not null default 0,
  content_target text not null,          -- "一…也/都 + 不/没 …"
  pinyin         text,                   -- null khi lang = en
  content_vi     text not null,
  vi_du          text,                   -- câu ví dụ (tuỳ chọn)
  vi_du_pinyin   text,
  vi_du_vi       text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_topic_grammar_topic on topic_grammar (topic_id, thu_tu);

-- RLS + GRANT theo đúng khuôn 10 bảng cũ (0003_rls.sql).
-- MB-13/2: RLS lọc DÒNG, GRANT mở CỬA. Bảng tạo qua Management API không có quyền mặc
-- định cho authenticated — bật RLS mà quên grant thì chính mình nhận 403 · 42501.
alter table topic_grammar enable row level security;

drop policy if exists "authenticated_full_access" on topic_grammar;
create policy "authenticated_full_access" on topic_grammar
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant select, insert, update, delete on table topic_grammar to authenticated;
