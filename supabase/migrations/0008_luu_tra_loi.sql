-- 0008_luu_tra_loi.sql — Ghi kết quả 1 câu trả lời của Player (M4a, DESIGN.md §2.4).
--
-- Mỗi câu trả lời cần ghi tới 3 bảng: word_state (cập nhật), review_log (thêm),
-- daily_retry_queue (thay thế). supabase-js không có transaction phía client, nên gói
-- trong 1 hàm plpgsql — cùng lý do với import_topic() (0007, Q3 MB-14). Lỗi giữa chừng
-- ⇒ rollback sạch, review_log không bao giờ lệch word_state.
--
-- Toàn bộ LUẬT tính điểm/lên stage nằm ở src/lib/srs.ts (xuLyTraLoi); hàm này chỉ GHI
-- đúng những gì client đã tính — không lặp luật ở SQL.
--
-- p_state  : word_state mới (null với Flashcard — không đổi state, DEC-11)
-- p_log    : 1 dòng review_log — luôn có, ghi stage_before/stage_after ở MỌI dòng (§4.6)
-- p_retry  : {reason, exercise_types} hoặc null. Luôn XOÁ hàng cũ của (từ, hôm nay) trước khi
--            ghi ⇒ mỗi từ tối đa 1 hàng retry/ngày, gọi lại nhiều lần vẫn đúng.
-- p_xoa_retry : chế độ ôn lại — bài cuối của từ đã xong ⇒ xoá hàng retry dù không ghi mới.
--
-- KHÔNG security definer (chạy quyền authenticated, chịu RLS). Ngày quy chiếu Asia/Ho_Chi_Minh,
-- KHÔNG dùng current_date (systemPatterns.md §9.3). Idempotent: create or replace.

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

  insert into review_log (vocab_id, exercise_type, is_correct, used_hint, points, stage_before, stage_after)
  values (
    v_id,
    (p_log ->> 'exercise_type')::exercise_type,
    (p_log ->> 'is_correct')::boolean,
    coalesce((p_log ->> 'used_hint')::boolean, false),
    coalesce((p_log ->> 'points')::int, 0),
    (p_log ->> 'stage_before')::word_stage,
    (p_log ->> 'stage_after')::word_stage
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
