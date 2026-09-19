/**
 * test-player.mjs — TDD cho hàm SQL luu_tra_loi() (M4a, DESIGN.md §2.4).
 *
 * Chạy: npm run test:player
 *
 * Cùng khuôn với test-import.mjs: mỗi ca là 1 giao dịch `begin; <seed> <gọi hàm> <assert>; rollback;`
 * nên KHÔNG để lại dòng rác. Không truncate — seed 1 từ tạm rồi chỉ assert trên từ đó.
 */
import { chaySql } from './db-lib.mjs'

const V = '00000000-0000-4000-8000-00000000a4a1' // uuid cố định của từ tạm

/** Nhúng object JS vào SQL bằng dollar-quoting để khỏi escape dấu nháy. */
const nhung = (obj) => (obj === null ? 'null' : `$vb$${JSON.stringify(obj)}$vb$::jsonb`)

const SEED = `
  insert into vocab (id, word, meaning_vi, lang) values ('${V}', '测试', 'kiểm thử', 'zh');
  insert into word_state (vocab_id, stage, next_review_date, cycle_points, cycle_completed_exercises, total_points)
    values ('${V}', 'new', (now() at time zone 'Asia/Ho_Chi_Minh')::date, 0, '[]', 0);
`
const STATE = {
  vocab_id: V, stage: 'new', next_review_date: '2026-09-16', cycle_points: 1,
  cycle_completed_exercises: ['selection'], total_points: 1, last_reviewed_at: '2026-09-16',
}
const LOG = { vocab_id: V, exercise_type: 'selection', is_correct: true, used_hint: false, points: 1, stage_before: 'new', stage_after: 'new' }
const RETRY = { reason: 'below_threshold', exercise_types: ['fast_decision'] }
const goi = (state, log, retry, xoa = false) =>
  `select luu_tra_loi(${nhung(state)}, ${nhung(log)}, ${nhung(retry)}, ${xoa});`

const CAC_CA = [
  {
    ma: 'P1',
    ten: 'ghi state + 1 dòng review_log trong 1 lần gọi',
    sql: goi(STATE, LOG, null),
    assert: `select (select cycle_points from word_state where vocab_id='${V}') = 1
                and (select cycle_completed_exercises from word_state where vocab_id='${V}') = '["selection"]'::jsonb
                and (select last_reviewed_at is not null from word_state where vocab_id='${V}')
                and (select count(*) from review_log where vocab_id='${V}' and points = 1 and stage_after = 'new') = 1 as pass,
              format('cycle=%s log=%s', (select cycle_points from word_state where vocab_id='${V}'),
                     (select count(*) from review_log where vocab_id='${V}')) as chi_tiet`,
  },
  {
    ma: 'P2',
    ten: 'gọi 2 lần có retry → đúng 1 hàng retry hôm nay (hàng sau thay hàng trước)',
    sql: goi(STATE, LOG, RETRY) + goi(STATE, LOG, { reason: 'flashcard_again', exercise_types: null }),
    assert: `select (select count(*) from daily_retry_queue where vocab_id='${V}') = 1
                and (select reason from daily_retry_queue where vocab_id='${V}') = 'flashcard_again'
                and (select queue_date from daily_retry_queue where vocab_id='${V}') = (now() at time zone 'Asia/Ho_Chi_Minh')::date as pass,
              format('retry=%s reason=%s', (select count(*) from daily_retry_queue where vocab_id='${V}'),
                     (select reason from daily_retry_queue where vocab_id='${V}')) as chi_tiet`,
  },
  {
    ma: 'P3',
    ten: 'p_xoa_retry=true, p_retry=null → xoá hàng retry của từ, không ghi mới',
    sql: goi(STATE, LOG, RETRY) + goi(STATE, LOG, null, true),
    assert: `select (select count(*) from daily_retry_queue where vocab_id='${V}') = 0
                and (select count(*) from review_log where vocab_id='${V}') = 2 as pass,
              format('retry=%s log=%s', (select count(*) from daily_retry_queue where vocab_id='${V}'),
                     (select count(*) from review_log where vocab_id='${V}')) as chi_tiet`,
  },
  {
    ma: 'P4',
    ten: 'p_state=null (Flashcard) → word_state KHÔNG đổi, chỉ +1 log',
    sql: goi(null, { ...LOG, exercise_type: 'flashcard', points: 0 }, null),
    assert: `select (select cycle_points from word_state where vocab_id='${V}') = 0
                and (select last_reviewed_at is null from word_state where vocab_id='${V}')
                and (select count(*) from review_log where vocab_id='${V}' and exercise_type='flashcard') = 1 as pass,
              format('cycle=%s log=%s', (select cycle_points from word_state where vocab_id='${V}'),
                     (select count(*) from review_log where vocab_id='${V}')) as chi_tiet`,
  },
]

console.log('\n── TDD luu_tra_loi() ──\n')

let hong = 0
for (const ca of CAC_CA) {
  const sql = `begin;\n${SEED}\n${ca.sql}\n${ca.assert};\nrollback;`
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
