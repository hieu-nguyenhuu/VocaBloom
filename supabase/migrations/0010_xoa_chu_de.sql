-- 0010_xoa_chu_de.sql — xoá chủ đề trong 1 transaction (M8, chốt MB-27/Q5).
--
-- Quy tắc AN TOÀN (chốt với người dùng): xoá chủ đề KHÔNG được ảnh hưởng chủ đề khác.
-- Thực tế dữ liệu: RPC import luôn tạo dòng `vocab` RIÊNG cho từng file nên mỗi từ chỉ thuộc 1
-- chủ đề. Nhưng `vocab_topics` là quan hệ n-n nên vẫn phải phòng thủ:
--   · từ CHỈ thuộc riêng chủ đề này        → xoá hẳn (cascade dọn word_state/exercises/review_log/…)
--   · từ còn thuộc chủ đề khác             → CHỈ gỡ liên kết, giữ nguyên từ
--
-- Ngoài ra `payload->>'blank_b_vocab_id'` là chuỗi jsonb KHÔNG có khoá ngoại ⇒ cascade không dọn
-- giúp. Nếu một từ sắp xoá đang là vai B của câu hội thoại thuộc từ KHÁC (ngoài danh sách xoá) thì
-- dừng cả thao tác, không để lại tham chiếu treo.

create or replace function xoa_chu_de(p_topic_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_xoa uuid[];
  v_go  uuid[];
begin
  select coalesce(array_agg(vt.vocab_id) filter (where d.so = 1), '{}'::uuid[]),
         coalesce(array_agg(vt.vocab_id) filter (where d.so > 1), '{}'::uuid[])
    into v_xoa, v_go
  from vocab_topics vt
  join lateral (select count(*) as so from vocab_topics x where x.vocab_id = vt.vocab_id) d on true
  where vt.topic_id = p_topic_id;

  if exists (
    select 1 from exercises e
    where e.payload ? 'blank_b_vocab_id'
      and (e.payload ->> 'blank_b_vocab_id')::uuid = any(v_xoa)
      and not (e.vocab_id = any(v_xoa))
  ) then
    raise exception 'Không xoá được: có từ trong chủ đề đang là vai B của câu hội thoại thuộc chủ đề khác';
  end if;

  delete from vocab where id = any(v_xoa);
  delete from vocab_topics where topic_id = p_topic_id and vocab_id = any(v_go);
  delete from topics where id = p_topic_id;

  return jsonb_build_object(
    'so_tu_xoa', coalesce(array_length(v_xoa, 1), 0),
    'so_tu_go',  coalesce(array_length(v_go, 1), 0)
  );
end $$;

-- Không `security definer`: RLS của người gọi vẫn được áp dụng (cùng khuôn với 0008).
revoke all on function xoa_chu_de(uuid) from public;
revoke all on function xoa_chu_de(uuid) from anon;
grant execute on function xoa_chu_de(uuid) to authenticated;
