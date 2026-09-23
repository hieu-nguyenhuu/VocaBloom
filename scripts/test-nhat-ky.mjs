/**
 * test-nhat-ky.mjs — TDD cho bảng `nhat_ky_ngay` + RPC `chot_nhat_ky_ngay()` (M14).
 *
 * Chạy: npm run test:nhatky
 *
 * Cùng khuôn với test-maintenance/test-import: mỗi ca là 1 giao dịch
 *     begin; <dọn> <dựng> <assert>; rollback;
 * nên KHÔNG để lại dòng rác nào trong DB thật.
 *
 * Ca N2 là lý do cả milestone này tồn tại: xoá sạch vocab thì review_log bị cascade cuốn theo,
 * nhưng nhật ký học PHẢI còn nguyên.
 */
import { chaySql } from './db-lib.mjs'

const NGAY_VN = `(now() at time zone 'Asia/Ho_Chi_Minh')::date`

/** Dựng 1 từ + 1 dòng review_log hôm nay với thoi_gian_ms cho trước. */
const DUNG_DU_LIEU = (ms) => `
  insert into topics (id, name) values ('00000000-0000-0000-0000-00000000aaa1'::uuid, 'ZZ test') ;
  insert into vocab (id, word, meaning_vi, lang)
    values ('00000000-0000-0000-0000-00000000bbb1'::uuid, 'ZZ', 'thử', 'zh');
  insert into word_state (vocab_id, stage, next_review_date)
    values ('00000000-0000-0000-0000-00000000bbb1'::uuid, 'new', null);
  insert into vocab_topics (vocab_id, topic_id)
    values ('00000000-0000-0000-0000-00000000bbb1'::uuid, '00000000-0000-0000-0000-00000000aaa1'::uuid);
  insert into review_log (vocab_id, exercise_type, is_correct, points, thoi_gian_ms)
    values ('00000000-0000-0000-0000-00000000bbb1'::uuid, 'selection', true, 1, ${ms});`

const DON_SACH = `delete from nhat_ky_ngay; truncate vocab, topics cascade;`

const CAC_CA = [
  {
    ma: 'N1',
    ten: 'chốt 2 lần trong cùng ngày → 1 dòng, KHÔNG nhân đôi số phút',
    sql: `${DUNG_DU_LIEU(120000)}
          select chot_nhat_ky_ngay();
          select chot_nhat_ky_ngay();`,
    assert: `select (select count(*) from nhat_ky_ngay) = 1
                and (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN}) = 120000 as pass,
              format('%s dòng, %s ms', (select count(*) from nhat_ky_ngay),
                     (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN})) as chi_tiet`,
  },
  {
    ma: 'N2',
    ten: '⭐ XOÁ SẠCH VOCAB → review_log về 0 nhưng nhật ký CÒN NGUYÊN (mục tiêu của M14)',
    sql: `${DUNG_DU_LIEU(180000)}
          select chot_nhat_ky_ngay();
          delete from vocab;`,
    assert: `select (select count(*) from review_log) = 0
                and (select count(*) from nhat_ky_ngay) = 1
                and (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN}) = 180000 as pass,
              format('review_log=%s · nhat_ky=%s dòng, %s ms',
                     (select count(*) from review_log), (select count(*) from nhat_ky_ngay),
                     (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN})) as chi_tiet`,
  },
  {
    ma: 'N3',
    ten: 'greatest: xoá từ giữa ngày rồi chốt lại KHÔNG hạ số phút đã lưu',
    sql: `${DUNG_DU_LIEU(300000)}
          select chot_nhat_ky_ngay();
          delete from vocab;
          select chot_nhat_ky_ngay();`,
    assert: `select (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN}) = 300000 as pass,
              format('còn %s ms (phải giữ 300000)',
                     (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN})) as chi_tiet`,
  },
  {
    ma: 'N4',
    ten: 'ngày có học nhưng thoi_gian_ms = NULL vẫn ghi dòng (để streak tính là ngày CÓ HỌC)',
    sql: `${DUNG_DU_LIEU('null')}
          select chot_nhat_ky_ngay();`,
    assert: `select (select count(*) from nhat_ky_ngay where ngay = ${NGAY_VN}) = 1
                and (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN}) = 0 as pass,
              format('%s dòng, %s ms', (select count(*) from nhat_ky_ngay),
                     (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN})) as chi_tiet`,
  },
  {
    ma: 'N5',
    ten: 'nhat_ky_ngay KHÔNG có khoá ngoại nào (điều kiện để sống sót qua cascade)',
    sql: `select 1;`,
    assert: `select (select count(*) from information_schema.table_constraints
                      where table_name = 'nhat_ky_ngay' and constraint_type = 'FOREIGN KEY') = 0 as pass,
              format('%s khoá ngoại', (select count(*) from information_schema.table_constraints
                      where table_name = 'nhat_ky_ngay' and constraint_type = 'FOREIGN KEY')) as chi_tiet`,
  },
]

console.log('\n── TDD nhat_ky_ngay + chot_nhat_ky_ngay() ──\n')

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
