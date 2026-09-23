-- 0011_thoi_gian_hoc.sql — đo THỜI GIAN HỌC thật (M9/Q2, người dùng chọn phương án B).
--
-- Dòng cũ để NULL (không bịa số cho quá khứ); Dashboard chỉ cộng dòng có giá trị.
-- Client kẹp trần 5 phút/lượt trước khi gửi — để máy chạy rồi bỏ đi không được tính thành giờ học.
-- Hàm luu_tra_loi giữ NGUYÊN chữ ký của 0008, chỉ thêm 1 cột vào câu insert review_log.

alter table review_log add column if not exists thoi_gian_ms int;

create or replace function luu_tra_loi(
  p_state     jsonb,
  p_log       jsonb,
  p_retry     jsonb,
  p_xoa_retry boolean default false
) returns void
language plpgsql as $fn$
declare
  v_id   uuid := (p_log ->> 'vocab_id')::uuid;
  v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if v_id is null then
    raise exception 'luu_tra_loi: p_log.vocab_id bắt buộc phải có';
  end if;

  if p_state is not null then
    update word_state set
      stage                     = (p_state ->> 'stage')::word_stage,
      next_review_date          = (p_state ->> 'next_review_date')::date,
      cycle_points              = (p_state ->> 'cycle_points')::int,
      cycle_completed_exercises = coalesce(p_state -> 'cycle_completed_exercises', '[]'::jsonb),
      total_points              = (p_state ->> 'total_points')::int,
      last_reviewed_at          = now(),
      updated_at                = now()
    where vocab_id = v_id;
    if not found then
      raise exception 'luu_tra_loi: không có word_state cho vocab %', v_id;
    end if;
  end if;

  insert into review_log (vocab_id, exercise_type, is_correct, used_hint, points, stage_before, stage_after, thoi_gian_ms)
  values (
    v_id,
    (p_log ->> 'exercise_type')::exercise_type,
    (p_log ->> 'is_correct')::boolean,
    coalesce((p_log ->> 'used_hint')::boolean, false),
    coalesce((p_log ->> 'points')::int, 0),
    (p_log ->> 'stage_before')::word_stage,
    (p_log ->> 'stage_after')::word_stage,
    (p_log ->> 'thoi_gian_ms')::int      -- M9: null với dòng cũ / client không gửi
  );

  if p_xoa_retry or p_retry is not null then
    delete from daily_retry_queue where vocab_id = v_id and queue_date = v_ngay;
  end if;

  if p_retry is not null then
    insert into daily_retry_queue (vocab_id, reason, exercise_types, queue_date)
    values (v_id, p_retry ->> 'reason', p_retry -> 'exercise_types', v_ngay);
  end if;
end $fn$;

-- Chỉ người đã đăng nhập mới gọi được qua PostgREST (MB-13/3).
revoke execute on function luu_tra_loi(jsonb, jsonb, jsonb, boolean) from public, anon;
grant  execute on function luu_tra_loi(jsonb, jsonb, jsonb, boolean) to authenticated;
