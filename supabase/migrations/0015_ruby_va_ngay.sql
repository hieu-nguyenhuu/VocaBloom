-- 0015_ruby_va_ngay.sql — Ruby tích luỹ + vá ngày bỏ lỡ (M15, DESIGN.md §4).
--
-- Luật: mỗi 5 phút học trong ngày = 1 ruby, TRẦN 12 ruby/ngày (= 60 phút).
--       5 ruby vá được 1 ngày quá khứ đã bỏ lỡ ⇒ ngày đó nối lại chuỗi streak.
--
-- ⭐ SỐ DƯ RUBY KHÔNG ĐƯỢC LƯU Ở ĐÂU CẢ (Q5) — nó là số DẪN XUẤT:
--       số dư = Σ ruby mỗi ngày − 5 × số ngày da_va
--    Lưu số dư thành một con số riêng nghĩa là cùng một sự thật nằm ở 2 nơi; dự án đã trả giá
--    đúng kiểu đó với bảng phạt (tồn tại ở cả srs.ts lẫn 0005_maintenance.sql, phải dựng test X1
--    để canh). Số dẫn xuất thì về mặt toán học KHÔNG THỂ lệch.
--
-- ⚠️ Công thức ruby lặp lại ở `src/lib/lichSu.ts` (để hiện ruby từng ngày mà không cần gọi server).
--    Có test chống lệch đọc chính file này rồi so khớp hằng số — đừng sửa 1 nơi mà quên nơi kia.
--
-- Idempotent (MB-11): file chạy lại mỗi lần migrate.

alter table nhat_ky_ngay add column if not exists da_va boolean not null default false;

-- ============================================================
-- vi_ruby() — số dư ví, tính từ TOÀN BỘ nhật ký
-- ============================================================
-- Vì sao phải ở SERVER chứ không cộng ở client (Q6): màn Lịch sử lazy-load theo tháng nên client
-- chỉ giữ vài tháng đang xem, KHÔNG BAO GIỜ có đủ dữ liệu để cộng đúng.
--
-- `ceil(ms/60000)` = số phút HIỂN THỊ (Dashboard cũng làm tròn lên như vậy). Cố ý không tính từ ms
-- thô: nếu không, người dùng thấy "5′" trên màn hình mà được 0 ruby — mâu thuẫn ngay trước mắt.
create or replace function vi_ruby() returns jsonb
language sql stable as $fn$
  with r as (
    select least(floor(ceil(thoi_gian_ms / 60000.0) / 5), 12) as ruby, da_va
    from nhat_ky_ngay
  )
  select jsonb_build_object(
    'kiem', coalesce(sum(ruby), 0)::bigint,
    'tieu', (5 * count(*) filter (where da_va))::bigint,
    'con',  (coalesce(sum(ruby), 0) - 5 * count(*) filter (where da_va))::bigint
  ) from r;
$fn$;

-- ============================================================
-- va_ngay(p_ngay) — tiêu 5 ruby để vá 1 ngày quá khứ
-- ============================================================
-- KHÔNG nhận số ruby từ client: server tự tính, tự kiểm, tự chặn. Ẩn nút ở UI là tiện lợi,
-- không phải bảo vệ.
--
-- Ngày quy chiếu Asia/Ho_Chi_Minh, CẤM current_date (systemPatterns.md §9.3 — DB chạy UTC).
create or replace function va_ngay(p_ngay date) returns jsonb
language plpgsql as $fn$
declare
  v_hom_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_con     bigint;
begin
  if p_ngay is null then
    raise exception 'va_ngay: thiếu tham số ngày';
  end if;

  if p_ngay >= v_hom_nay then
    raise exception 'Chỉ vá được ngày trong quá khứ';
  end if;

  -- CHÈN TRƯỚC, KIỂM SỐ DƯ SAU. Cả hàm là 1 transaction nên thiếu ruby sẽ rollback sạch.
  -- Thứ tự này khử luôn kẽ hở "đọc số dư rồi mới ghi": 2 lời gọi song song không thể cùng
  -- tiêu một số ruby, vì sau khi chèn thì phép tính số dư đã bao gồm chính dòng vừa chèn.
  insert into nhat_ky_ngay (ngay, thoi_gian_ms, da_va) values (p_ngay, 0, true)
  on conflict (ngay) do nothing;

  if not found then
    raise exception 'Ngày % đã có dữ liệu học rồi, không cần vá', p_ngay;
  end if;

  select ((vi_ruby()) ->> 'con')::bigint into v_con;
  if v_con < 0 then
    raise exception 'Không đủ ruby: cần 5 ruby để vá 1 ngày';
  end if;

  return jsonb_build_object('ngay', p_ngay, 'ruby_con_lai', v_con);
end $fn$;

-- Chỉ người đã đăng nhập mới gọi được qua PostgREST (MB-13/3).
revoke execute on function vi_ruby()     from public, anon;
revoke execute on function va_ngay(date) from public, anon;
grant  execute on function vi_ruby()     to authenticated;
grant  execute on function va_ngay(date) to authenticated;
