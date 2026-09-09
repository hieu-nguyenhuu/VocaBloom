/**
 * test-maintenance.mjs — TDD cho run_daily_maintenance() (SPECIFICATION.md §5).
 *
 * Chạy: npm run test:db
 *
 * Mỗi ca là MỘT giao dịch độc lập:
 *     begin; <dọn sạch> <seed> select run_daily_maintenance(); <assert>; rollback;
 * "rollback" ở cuối => test KHÔNG để lại một dòng rác nào trong DB thật.
 * (Đã kiểm chứng Management API tôn trọng begin/rollback trước khi viết file này.)
 *
 * Vì hàm đọc số liệu TOÀN CỤC (đếm hàng đợi, đếm notification), mỗi ca phải
 * truncate sạch trước khi seed thì kết quả mới tất định — an toàn nhờ rollback.
 */
import { chaySql } from './db-lib.mjs'

const HOM_NAY = "(now() at time zone 'Asia/Ho_Chi_Minh')::date"
const HOM_QUA = `(${HOM_NAY} - 1)`

const DON_SACH = `
  truncate vocab, topics, notifications, review_log,
           daily_retry_queue, word_state, exercises, vocab_topics, topic_dialogues cascade;
  update settings set value = '5'    where key = 'new_words_per_day';
  update settings set value = 'true' where key = 'low_queue_alert_enabled';
`

/** Seed 1 từ + word_state. updated_at lùi 2 ngày để không dính chốt chống-phạt-chồng. */
function motTu({ ten, stage, due, diem, onLuc = 'null', cycle = 0 }) {
  return `
    insert into vocab (word, meaning_vi, lang) values ('${ten}', 'x', 'zh');
    insert into word_state (vocab_id, stage, next_review_date, total_points,
                            cycle_points, last_reviewed_at, updated_at)
    select id, '${stage}', ${due}, ${diem}, ${cycle}, ${onLuc}, now() - interval '2 days'
      from vocab where word = '${ten}';
  `
}

/** Seed n từ trong hàng đợi chờ (next_review_date NULL), added_at so le để kiểm FIFO. */
function hangDoi(n) {
  return `
    insert into vocab (word, meaning_vi, lang)
    select 'q' || i, 'x', 'zh' from generate_series(1, ${n}) i;
    insert into word_state (vocab_id, stage, next_review_date, added_at, updated_at)
    select v.id, 'new', null,
           now() - (${n} - (substring(v.word from 2))::int) * interval '1 hour',
           now() - interval '2 days'
      from vocab v where v.word ~ '^q[0-9]+$';
  `
}

const GOI_HAM = 'select run_daily_maintenance();'

const CAC_CA = [
  {
    ma: 'T1',
    ten: 'stage2 due hôm qua, không ôn → total_points bị trừ 3',
    seed: motTu({ ten: 'w1', stage: 'stage2', due: HOM_QUA, diem: 10 }),
    goi: 1,
    assert: `select (select total_points from word_state) = 7 as pass,
                    'total_points=' || (select total_points from word_state) as chi_tiet`,
  },
  {
    ma: 'T2',
    ten: 'stage2 due hôm qua nhưng ĐÃ ôn hôm qua → không bị trừ',
    seed: motTu({
      ten: 'w1', stage: 'stage2', due: HOM_QUA, diem: 10,
      onLuc: `((${HOM_QUA})::timestamp + time '15:00') at time zone 'Asia/Ho_Chi_Minh'`,
    }),
    goi: 1,
    assert: `select (select total_points from word_state) = 10 as pass,
                    'total_points=' || (select total_points from word_state) as chi_tiet`,
  },
  {
    ma: 'T3',
    ten: 'mastered due hôm qua, không ôn → MIỄN NHIỄM, điểm không đổi',
    seed: motTu({ ten: 'w1', stage: 'mastered', due: HOM_QUA, diem: 40 }),
    goi: 1,
    assert: `select (select total_points from word_state) = 40 as pass,
                    'total_points=' || (select total_points from word_state) as chi_tiet`,
  },
  {
    ma: 'T4',
    ten: 'new có 0 điểm bị phạt → vẫn 0, KHÔNG âm (sàn 0)',
    seed: motTu({ ten: 'w1', stage: 'new', due: HOM_QUA, diem: 0 }),
    goi: 1,
    assert: `select (select total_points from word_state) = 0 as pass,
                    'total_points=' || (select total_points from word_state) as chi_tiet`,
  },
  {
    ma: 'T5',
    ten: 'bị phạt nhưng stage KHÔNG đổi (DEC-09, không bao giờ tụt stage)',
    seed: motTu({ ten: 'w1', stage: 'stage3', due: HOM_QUA, diem: 100 }),
    goi: 1,
    assert: `select (select stage from word_state) = 'stage3'
                and (select total_points from word_state) = 96 as pass,
                    'stage=' || (select stage from word_state)
                 || ' points=' || (select total_points from word_state) as chi_tiet`,
  },
  {
    ma: 'T6',
    ten: '12 từ hàng đợi, hạn mức 5 → kích hoạt ĐÚNG 5 từ, FIFO theo added_at',
    seed: hangDoi(12),
    goi: 1,
    assert: `select (select count(*) from word_state where next_review_date = ${HOM_NAY}) = 5
                and (select string_agg(v.word, ',' order by v.word)
                       from word_state ws join vocab v on v.id = ws.vocab_id
                      where ws.next_review_date = ${HOM_NAY}) = 'q1,q2,q3,q4,q5' as pass,
                    'đã kích hoạt: ' || coalesce((select string_agg(v.word, ',' order by v.word)
                       from word_state ws join vocab v on v.id = ws.vocab_id
                      where ws.next_review_date = ${HOM_NAY}), '(không có)') as chi_tiet`,
  },
  {
    ma: 'T7',
    ten: 'hàng đợi 7 từ (< 5×3) → tạo ĐÚNG 1 notification low_queue',
    seed: hangDoi(7),
    goi: 1,
    assert: `select (select count(*) from notifications where type = 'low_queue') = 1 as pass,
                    'số notification=' || (select count(*) from notifications) as chi_tiet`,
  },
  {
    ma: 'T8',
    ten: 'chạy 2 lần liên tiếp → KHÔNG phạt chồng, KHÔNG kích hoạt vượt hạn mức',
    seed: motTu({ ten: 'w1', stage: 'stage2', due: HOM_QUA, diem: 10 }) + hangDoi(12),
    goi: 2,
    assert: `select (select total_points from word_state ws join vocab v on v.id = ws.vocab_id
                      where v.word = 'w1') = 7
                and (select count(*) from word_state where next_review_date = ${HOM_NAY}) = 5 as pass,
                    'w1 points=' || (select total_points from word_state ws
                       join vocab v on v.id = ws.vocab_id where v.word = 'w1')
                 || ' · đã kích hoạt=' || (select count(*) from word_state
                      where next_review_date = ${HOM_NAY}) as chi_tiet`,
  },
  {
    ma: 'T9',
    ten: 'daily_retry_queue: dòng hôm qua bị xoá, dòng hôm nay giữ lại',
    seed: `
      insert into vocab (word, meaning_vi, lang) values ('w1', 'x', 'zh');
      insert into daily_retry_queue (vocab_id, reason, queue_date)
      select id, 'below_threshold', ${HOM_QUA} from vocab where word = 'w1';
      insert into daily_retry_queue (vocab_id, reason, queue_date)
      select id, 'flashcard_again', ${HOM_NAY} from vocab where word = 'w1';
    `,
    goi: 1,
    assert: `select (select count(*) from daily_retry_queue) = 1
                and (select queue_date from daily_retry_queue) = ${HOM_NAY} as pass,
                    'còn lại ' || (select count(*) from daily_retry_queue) || ' dòng' as chi_tiet`,
  },
]

console.log('\n── TDD run_daily_maintenance() ──\n')

let hong = 0
for (const ca of CAC_CA) {
  const sql = `begin;\n${DON_SACH}\n${ca.seed}\n${GOI_HAM.repeat(ca.goi)}\n${ca.assert};\nrollback;`
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
