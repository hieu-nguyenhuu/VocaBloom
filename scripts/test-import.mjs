/**
 * test-import.mjs — TDD cho hàm SQL import_topic() (SPECIFICATION.md §10).
 *
 * Chạy: npm run test:import
 *
 * Cùng khuôn với test-maintenance.mjs của M1: mỗi ca là 1 giao dịch
 *     begin; <truncate> <import> <assert>; rollback;
 * nên KHÔNG để lại dòng rác nào trong DB thật.
 */
import { readFileSync } from 'node:fs'
import { chaySql } from './db-lib.mjs'

const MAU = '.claude/skills/vocabCsv2Json/references/example-output.json'
const gocJson = JSON.parse(readFileSync(MAU, 'utf8'))

/** Nhúng object JS vào SQL bằng dollar-quoting để khỏi phải escape dấu nháy. */
function nhung(obj) {
  return `$vb$${JSON.stringify(obj)}$vb$::jsonb`
}

function sua(hamSua) {
  const d = structuredClone(gocJson)
  hamSua(d)
  return d
}

const DON_SACH = `truncate vocab, topics, notifications, review_log,
  daily_retry_queue, word_state, exercises, vocab_topics, topic_dialogues,
  topic_grammar cascade;`

/** M12 — 2 mục ngữ pháp CỦA CHỦ ĐỀ, gắn vào file mẫu để kiểm bước B6b. */
const NGU_PHAP = [
  {
    content_target: 'một…cũng không…',
    pinyin: 'yī … yě/dōu + bù/méi …',
    content_vi: 'Nhấn mạnh phủ định tuyệt đối.',
    vi_du: null, vi_du_pinyin: null, vi_du_vi: null,
  },
  {
    content_target: 'V + 着 + V',
    pinyin: 'V + zhe + V',
    content_vi: 'Hành động đang tiếp diễn thì xảy ra việc khác.',
    vi_du: null, vi_du_pinyin: null, vi_du_vi: null,
  },
]

const CAC_CA = [
  {
    ma: 'I1',
    ten: 'import file mẫu → đúng số dòng ở cả 6 bảng',
    sql: `select import_topic(${nhung(gocJson)});`,
    assert: `select (select count(*) from topics) = 1
                and (select count(*) from vocab) = 5
                and (select count(*) from word_state) = 5
                and (select count(*) from vocab_topics) = 5
                and (select count(*) from exercises) = 47
                and (select count(*) from topic_dialogues) = 1 as pass,
              format('topics=%s vocab=%s word_state=%s vocab_topics=%s exercises=%s dialogue=%s',
                (select count(*) from topics), (select count(*) from vocab),
                (select count(*) from word_state), (select count(*) from vocab_topics),
                (select count(*) from exercises), (select count(*) from topic_dialogues)) as chi_tiet`,
  },
  {
    ma: 'I2',
    ten: 'mọi từ đều có word_state stage=new và next_review_date IS NULL',
    sql: `select import_topic(${nhung(gocJson)});`,
    assert: `select (select count(*) from word_state
                      where stage = 'new' and next_review_date is null) = 5 as pass,
              format('%s/%s dòng đạt', (select count(*) from word_state
                      where stage = 'new' and next_review_date is null),
                     (select count(*) from word_state)) as chi_tiet`,
  },
  {
    ma: 'I3',
    ten: 'blank_b_vocab_id trong payload đã đổi thành UUID thật, không còn temp_id',
    sql: `select import_topic(${nhung(gocJson)});`,
    assert: `select (select count(*) from exercises e
                      where e.type in ('select_dialog','fill_dialog')
                        and (e.payload ->> 'blank_b_vocab_id') in (select id::text from vocab))
                  = (select count(*) from exercises
                      where type in ('select_dialog','fill_dialog'))
                and (select count(*) from exercises
                      where type in ('select_dialog','fill_dialog')) > 0 as pass,
              coalesce((select string_agg(payload ->> 'blank_b_vocab_id', ' · ')
                          from exercises where type in ('select_dialog','fill_dialog')),
                       '(không có bài dialog)') as chi_tiet`,
  },
  {
    ma: 'I4',
    ten: 'hội thoại đổi khoá highlight_vocab_temp_ids → highlight_vocab_ids (uuid)',
    sql: `select import_topic(${nhung(gocJson)});`,
    assert: `select (select content::text not like '%temp_id%' from topic_dialogues)
                and (select content::text like '%highlight_vocab_ids%' from topic_dialogues) as pass,
              (select left(content::text, 90) from topic_dialogues) as chi_tiet`,
  },
  {
    ma: 'I5',
    ten: 'vocab_temp_id sai giữa chừng → raise exception, ROLLBACK sạch 0 dòng',
    // Bắt luôn SQLERRM vào notifications: nếu chỉ "nuốt" lỗi thì ca này sẽ xanh giả
    // ngay cả khi hàm chưa tồn tại. Có assert nội dung lỗi thì test mới có nghĩa.
    sql: `do $blk$ begin
            perform import_topic(${nhung(sua((d) => { d.exercises[0].vocab_temp_id = 'v999' }))});
          exception when others then
            insert into notifications (type, message) values ('test_loi', sqlerrm);
          end $blk$;`,
    assert: `select (select count(*) from topics) = 0
                and (select count(*) from vocab) = 0
                and (select count(*) from word_state) = 0
                and (select count(*) from exercises) = 0
                and (select count(*) from topic_dialogues) = 0
                and (select count(*) from notifications
                      where type = 'test_loi' and message like '%vocab_temp_id%') = 1 as pass,
              coalesce((select message from notifications where type = 'test_loi'),
                       '(không bắt được lỗi nào)') as chi_tiet`,
  },
  {
    ma: 'I6',
    ten: 'import 2 lần cùng file → 2 topic riêng, từ vựng nhân đôi (DEC-21)',
    sql: `select import_topic(${nhung(gocJson)}); select import_topic(${nhung(gocJson)});`,
    assert: `select (select count(*) from topics) = 2
                and (select count(*) from vocab) = 10
                and (select count(distinct id) from topics) = 2 as pass,
              format('topics=%s vocab=%s', (select count(*) from topics),
                     (select count(*) from vocab)) as chi_tiet`,
  },
  {
    ma: 'I7',
    ten: 'M12 — grammar chủ đề ghi đúng số dòng, đúng thứ tự, trả về so_ngu_phap',
    sql: `create temp table kq_i7 as
          select import_topic(${nhung(sua((d) => { d.grammar = NGU_PHAP }))}) as r;`,
    assert: `select (select count(*) from topic_grammar) = 2
                and (select (r ->> 'so_ngu_phap')::int from kq_i7) = 2
                and (select content_target from topic_grammar where thu_tu = 1) = 'một…cũng không…'
                and (select content_target from topic_grammar where thu_tu = 2) = 'V + 着 + V'
                and (select count(*) from topic_grammar g
                      join topics t on t.id = g.topic_id) = 2 as pass,
              format('dong=%s so_ngu_phap=%s thu_tu=%s',
                (select count(*) from topic_grammar),
                (select r ->> 'so_ngu_phap' from kq_i7),
                (select string_agg(thu_tu::text, ',' order by thu_tu) from topic_grammar)) as chi_tiet`,
  },
  {
    ma: 'I8',
    ten: 'M12 — file KHÔNG có khoá grammar vẫn import bình thường, 0 dòng ngữ pháp',
    sql: `select import_topic(${nhung(gocJson)});`,
    assert: `select (select count(*) from topic_grammar) = 0
                and (select count(*) from topics) = 1 as pass,
              format('topic_grammar=%s topics=%s',
                (select count(*) from topic_grammar), (select count(*) from topics)) as chi_tiet`,
  },
  {
    ma: 'I9',
    ten: 'M12 — xoá topic thì ngữ pháp bị cascade dọn sạch',
    sql: `select import_topic(${nhung(sua((d) => { d.grammar = NGU_PHAP }))});
          delete from topics;`,
    assert: `select (select count(*) from topic_grammar) = 0 as pass,
              format('còn %s dòng topic_grammar', (select count(*) from topic_grammar)) as chi_tiet`,
  },
]

console.log('\n── TDD import_topic() ──\n')

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
