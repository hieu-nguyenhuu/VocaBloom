/**
 * test-ruby.mjs — TDD cho ví ruby + RPC va_ngay() (M15).
 *
 * Chạy: npm run test:ruby
 *
 * Khuôn `begin; <dọn> <dựng> <assert>; rollback;` như test-nhat-ky/test-import ⇒ không để lại
 * dòng rác nào trong DB thật.
 *
 * Ca R2 quan trọng nhất về mặt an toàn: thiếu ruby thì hàm phải RAISE và ROLLBACK SẠCH —
 * không được để lại dòng vá "nợ ruby".
 */
import { chaySql } from './db-lib.mjs'

const HOM_NAY = `(now() at time zone 'Asia/Ho_Chi_Minh')::date`
const DON_SACH = `delete from nhat_ky_ngay;`

/** Ghi 1 ngày nhật ký cách hôm nay `lui` ngày, với số PHÚT cho trước. */
const NGAY = (lui, phut) =>
  `insert into nhat_ky_ngay (ngay, thoi_gian_ms) values (${HOM_NAY} - ${lui}, ${phut} * 60000);`

/** Bắt lỗi của 1 lệnh vào bảng notifications để assert được NỘI DUNG lỗi.
 *  (Bài học I5: test bắt lỗi mà chỉ assert "không có gì xảy ra" có thể xanh vì lý do sai.) */
const BAT_LOI = (lenh) => `do $blk$ begin
    perform ${lenh};
  exception when others then
    insert into notifications (type, message) values ('test_loi', sqlerrm);
  end $blk$;`

const CAC_CA = [
  {
    ma: 'R1',
    ten: 'vá 1 ngày → trừ đúng 5 ruby, ghi dòng da_va = true',
    // 2 ngày × 30 phút = 6 + 6 = 12 ruby
    sql: `${NGAY(3, 30)} ${NGAY(2, 30)}
          select va_ngay((${HOM_NAY} - 1)::date);`,
    assert: `select ((vi_ruby()) ->> 'kiem')::int = 12
                and ((vi_ruby()) ->> 'tieu')::int = 5
                and ((vi_ruby()) ->> 'con')::int  = 7
                and (select count(*) from nhat_ky_ngay where da_va) = 1 as pass,
              format('kiem=%s tieu=%s con=%s, %s ngày đã vá',
                (vi_ruby()) ->> 'kiem', (vi_ruby()) ->> 'tieu', (vi_ruby()) ->> 'con',
                (select count(*) from nhat_ky_ngay where da_va)) as chi_tiet`,
  },
  {
    ma: 'R2',
    ten: '⭐ thiếu ruby → RAISE và ROLLBACK SẠCH (không để lại dòng vá nợ ruby)',
    // 20 phút = 4 ruby, thiếu 1 ruby so với mức 5
    sql: `${NGAY(3, 20)}
          ${BAT_LOI(`va_ngay((${HOM_NAY} - 1)::date)`)}`,
    assert: `select (select count(*) from nhat_ky_ngay where da_va) = 0
                and ((vi_ruby()) ->> 'con')::int = 4
                and (select count(*) from notifications
                      where type = 'test_loi' and message like '%Không đủ ruby%') = 1 as pass,
              coalesce((select message from notifications where type = 'test_loi'),
                       '(không bắt được lỗi nào)') as chi_tiet`,
  },
  {
    ma: 'R3',
    ten: 'vá ngày ĐÃ CÓ dữ liệu học → bị chặn',
    sql: `${NGAY(3, 60)} ${NGAY(1, 30)}
          ${BAT_LOI(`va_ngay((${HOM_NAY} - 1)::date)`)}`,
    assert: `select (select count(*) from nhat_ky_ngay where da_va) = 0
                and (select count(*) from notifications
                      where type = 'test_loi' and message like '%đã có dữ liệu học%') = 1 as pass,
              coalesce((select message from notifications where type = 'test_loi'),
                       '(không bắt được lỗi nào)') as chi_tiet`,
  },
  {
    ma: 'R4',
    ten: 'vá HÔM NAY và NGÀY MAI → đều bị chặn',
    sql: `${NGAY(3, 60)} ${NGAY(4, 60)}
          ${BAT_LOI(`va_ngay(${HOM_NAY})`)}
          ${BAT_LOI(`va_ngay((${HOM_NAY} + 1)::date)`)}`,
    assert: `select (select count(*) from nhat_ky_ngay where da_va) = 0
                and (select count(*) from notifications
                      where type = 'test_loi' and message like '%quá khứ%') = 2 as pass,
              format('%s lỗi bắt được: %s', (select count(*) from notifications where type = 'test_loi'),
                (select message from notifications where type = 'test_loi' limit 1)) as chi_tiet`,
  },
  {
    ma: 'R5',
    ten: 'TRẦN 12 ruby/ngày: học 3 tiếng vẫn chỉ 12 ruby, không phải 36',
    sql: `${NGAY(1, 180)}`,
    assert: `select ((vi_ruby()) ->> 'kiem')::int = 12 as pass,
              format('kiem = %s ruby (phải là 12)', (vi_ruby()) ->> 'kiem') as chi_tiet`,
  },
  {
    ma: 'R6',
    ten: 'ruby theo SỐ PHÚT HIỂN THỊ: 4 phút rưỡi hiện "5′" nên được 1 ruby',
    sql: `insert into nhat_ky_ngay (ngay, thoi_gian_ms) values (${HOM_NAY} - 1, 270000);`,
    assert: `select ((vi_ruby()) ->> 'kiem')::int = 1 as pass,
              format('kiem = %s ruby (phải là 1)', (vi_ruby()) ->> 'kiem') as chi_tiet`,
  },
]

console.log('\n── TDD vi_ruby() + va_ngay() ──\n')

let hong = 0
for (const ca of CAC_CA) {
  const sql = `begin;\n${DON_SACH}\n${ca.sql}\n${ca.assert};\nrollback;`
  const { ok, loi, rows } = await chaySql(sql)
  const dat = ok && rows[0]?.pass === true
  if (!dat) hong += 1
  const chiTiet = ok ? (rows[0]?.chi_tiet ?? '(không có kết quả)') : (loi ?? '').split('\n')[0]
  console.log(`${dat ? '✅' : '❌'}  ${ca.ma} — ${ca.ten}\n      → ${chiTiet}`)
}

console.log(
  hong === 0
    ? `\n✅ ${CAC_CA.length}/${CAC_CA.length} ca pass. DB sạch (mọi ca đều rollback).\n`
    : `\n❌ ${hong}/${CAC_CA.length} ca THẤT BẠI.\n`,
)
process.exit(hong === 0 ? 0 : 1)
