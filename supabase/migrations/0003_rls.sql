-- 0003_rls.sql — RLS theo Phương án A (chốt 2026-09-09, MB-10).
--
-- App single-user: KHÔNG thêm cột user_id, schema §2 giữ nguyên 100%.
-- Mọi bảng dùng đúng 1 policy đồng dạng cho role "authenticated".
--
-- Vì policy chỉ cấp cho "authenticated", role "anon" không có policy nào
-- => RLS từ chối sạch. Người lạ cầm anon key không đọc/ghi/xoá được gì.
--
-- ⚠️ Danh sách bảng viết TƯỜNG MINH, không đếm theo trí nhớ: SPECIFICATION.md §2
--    đánh số 9 nhóm nhưng có 10 BẢNG. Bỏ sót vocab_topics = hở toàn bộ quan hệ
--    từ vựng <-> chủ đề cho anon key.

do $$
declare t text;
begin
  foreach t in array array[
    'topics','vocab','vocab_topics','word_state','daily_retry_queue',
    'exercises','review_log','topic_dialogues','notifications','settings'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "authenticated_full_access" on %I', t);
    execute format($p$
      create policy "authenticated_full_access" on %I
        for all to authenticated
        using (auth.uid() is not null)
        with check (auth.uid() is not null)
    $p$, t);
  end loop;
end $$;

-- ============================================================
-- GRANT — phát hiện khi nghiệm thu 2026-09-09
-- ============================================================
-- RLS lọc DÒNG, nhưng GRANT mới là thứ mở CỬA. Bảng tạo qua Management API không
-- được cấp quyền mặc định cho anon/authenticated (chỉ postgres có), nên nếu chỉ bật
-- RLS thì chính tài khoản của mình cũng nhận 403 "permission denied for table".
--
-- Chủ ý: CHỈ cấp cho "authenticated". Role "anon" KHÔNG được cấp gì
-- => người lạ cầm anon key bị chặn ngay ở tầng quyền, còn chặt hơn cả RLS.

grant usage on schema public to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'topics','vocab','vocab_topics','word_state','daily_retry_queue',
    'exercises','review_log','topic_dialogues','notifications','settings'
  ] loop
    execute format('grant select, insert, update, delete on table %I to authenticated', t);
  end loop;
end $$;
