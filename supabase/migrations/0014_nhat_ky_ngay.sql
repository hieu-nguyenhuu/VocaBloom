-- 0014_nhat_ky_ngay.sql — Tách NHẬT KÝ HỌC khỏi từ vựng (M14, DESIGN.md §4).
--
-- VẤN ĐỀ: review_log.vocab_id khai `on delete cascade` (0002 §115), mà streak / số phút học /
-- dải 7 ngày ở Dashboard đều tính TỪ review_log. Xoá 1 từ là xoá luôn lịch sử học của từ đó;
-- xoá 1 chủ đề là mất cả cụm. Đã xảy ra thật: 2026-09-23 review_log về 0 dòng, streak về 0.
--
-- NGUYÊN NHÂN SÂU XA: review_log gánh 2 vai có vòng đời khác nhau — "sổ chi tiết theo từ"
-- (Tổng kết phiên cần, §4.6) và "nhật ký học theo ngày" (streak cần). Cascade của vai đầu
-- giết luôn vai sau. Migration này tách vai thứ hai ra bảng riêng.
--
-- ⚠️ BẢNG THỨ 12 của dự án. Mọi nơi đếm bảng phải cập nhật, liệt kê tên TƯỜNG MINH (MB-13).
-- ⚠️ KHÔNG khai khoá ngoại nào — đó là TOÀN BỘ điểm mấu chốt: không FK thì cascade không với tới.
--
-- Idempotent (MB-11): không có bảng lịch sử migration, file này chạy lại mỗi lần.

create table if not exists nhat_ky_ngay (
  ngay         date primary key,                 -- ngày theo giờ VN
  -- bigint, KHÔNG int: int tràn ở ~24 ngày học liên tục nếu tính bằng mili-giây
  thoi_gian_ms bigint not null default 0,
  updated_at   timestamptz not null default now()
);

-- RLS + GRANT theo đúng khuôn các bảng cũ (0003_rls.sql).
-- MB-13/2: RLS lọc DÒNG, GRANT mở CỬA — bật RLS mà quên grant thì chính mình nhận 403 · 42501.
alter table nhat_ky_ngay enable row level security;

drop policy if exists "authenticated_full_access" on nhat_ky_ngay;
create policy "authenticated_full_access" on nhat_ky_ngay
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant select, insert, update, delete on table nhat_ky_ngay to authenticated;

-- ============================================================
-- RPC — chốt nhật ký của NGÀY HÔM NAY
-- ============================================================
-- Gọi khi kết thúc lượt ôn (màn Tổng kết).
--
-- CỐ Ý tính lại TOÀN BỘ ngày từ review_log rồi ghi đè, KHÔNG cộng thêm delta (DESIGN §3):
--   · ôn nhiều lượt/ngày ⇒ gọi nhiều lần vẫn ra tổng đúng, không nhân đôi;
--   · lượt trước bị mất (đóng tab giữa chừng) ⇒ lượt sau TỰ VÁ LẠI, vì tính từ review_log
--     chứ không tính từ những gì đã ghi.
--
-- `greatest(...)`: xoá từ giữa ngày làm review_log co lại; không được để số phút đã ghi tụt xuống.
--
-- Ngày quy chiếu Asia/Ho_Chi_Minh, CẤM current_date (systemPatterns.md §9.3 — DB chạy UTC).
create or replace function chot_nhat_ky_ngay() returns bigint
language plpgsql as $fn$
declare
  v_ngay date   := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_ms   bigint;
begin
  select coalesce(sum(thoi_gian_ms), 0) into v_ms
  from review_log
  where (reviewed_at at time zone 'Asia/Ho_Chi_Minh')::date = v_ngay;

  -- Ghi dòng kể cả khi v_ms = 0: ngày CÓ vào Player nhưng mọi dòng log thiếu thoi_gian_ms
  -- (dòng cũ trước M9 để null) vẫn phải tính là NGÀY CÓ HỌC cho streak.
  insert into nhat_ky_ngay (ngay, thoi_gian_ms) values (v_ngay, v_ms)
  on conflict (ngay) do update
    set thoi_gian_ms = greatest(excluded.thoi_gian_ms, nhat_ky_ngay.thoi_gian_ms),
        updated_at   = now();

  return (select thoi_gian_ms from nhat_ky_ngay where ngay = v_ngay);
end $fn$;

revoke execute on function chot_nhat_ky_ngay() from public, anon;
grant  execute on function chot_nhat_ky_ngay() to authenticated;

-- ============================================================
-- Backfill — chép lịch sử ĐANG CÒN trong review_log sang nhật ký
-- ============================================================
-- `greatest` ⇒ chạy lại nhiều lần vẫn đúng và không bao giờ hạ số đã có.
-- Lưu ý: chỉ chép được cái đang còn. Lịch sử đã bị cascade xoá thì KHÔNG khôi phục được.
insert into nhat_ky_ngay (ngay, thoi_gian_ms)
select (reviewed_at at time zone 'Asia/Ho_Chi_Minh')::date, coalesce(sum(thoi_gian_ms), 0)
from review_log
group by 1
on conflict (ngay) do update
  set thoi_gian_ms = greatest(excluded.thoi_gian_ms, nhat_ky_ngay.thoi_gian_ms);
