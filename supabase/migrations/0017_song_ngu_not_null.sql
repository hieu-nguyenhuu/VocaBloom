-- 0017_song_ngu_not_null.sql — M26d: secondary_word BẮT BUỘC (Design.m26.md §2.1).
-- Idempotent (MB-11): SET NOT NULL chạy lại không lỗi.
-- Điều kiện đã kiểm 2026-10-05 (SQL chỉ đọc): 740/740 từ có secondary_word.
-- Còn dòng thiếu ⇒ báo lỗi tiếng Việt rõ ràng thay vì 23502 khó hiểu.
do $$
declare n int;
begin
  select count(*) into n from vocab where secondary_word is null or btrim(secondary_word) = '';
  if n > 0 then
    raise exception 'Còn % từ thiếu secondary_word — bổ sung trước khi chạy 0017', n;
  end if;
end $$;

alter table vocab alter column secondary_word set not null;
