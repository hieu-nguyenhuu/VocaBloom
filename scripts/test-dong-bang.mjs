/**
 * test-dong-bang.mjs — TDD cho RPC `dong_bang_lich()` / `mo_bang_lich()` (M33, design.m33.md).
 *
 * Chạy: npm run test:dongbang
 *
 * Cùng khuôn test-maintenance / test-nhat-ky: mỗi ca là 1 giao dịch
 *     begin; <dọn> <dựng> <gọi> <assert>; rollback;
 * ⇒ KHÔNG để lại dòng nào trong DB thật, và trạng thái đóng băng thật không bị đụng.
 *
 * Quy ước: đóng băng từ 10 ngày trước ⇒ F = hôm nay − 10 (ngày VN).
 */
import { chaySql } from './db-lib.mjs'

const HOM_NAY = "(now() at time zone 'Asia/Ho_Chi_Minh')::date"
const F = `(${HOM_NAY} - 10)`

const DON_SACH = `
  truncate vocab, topics cascade;
  insert into settings (key, value) values ('dong_bang_luc', 'null')
    on conflict (key) do update set value = 'null';`
const DONG_BANG_10_NGAY = "update settings set value = to_jsonb(now() - interval '10 days') where key = 'dong_bang_luc';"

/** 1 từ: hạn = biểu thức SQL (hoặc 'null'), ôn lần cuối = biểu thức SQL (hoặc 'null'). */
const tu = (ten, stage, han, onLuc = 'null') => `
  insert into vocab (word, meaning_vi, lang, secondary_word) values ('${ten}', 'x', 'zh', 'x');
  insert into word_state (vocab_id, stage, next_review_date, last_reviewed_at)
  select id, '${stage}', ${han}, ${onLuc} from vocab where word = '${ten}';`

const han = (ten) => `(select ws.next_review_date from word_state ws join vocab v on v.id = ws.vocab_id where v.word = '${ten}')`
const MOC = "(select value from settings where key = 'dong_bang_luc')"

const CAC_CA = [
  {
    ma: 'D1',
    ten: 'dong_bang_lich() khi đang bình thường ⇒ ghi mốc (khác null)',
    sql: 'select dong_bang_lich();',
    assert: `select ${MOC} <> 'null'::jsonb as pass, 'mốc=' || ${MOC}::text as chi_tiet`,
  },
  {
    ma: 'D1b',
    ten: 'dong_bang_lich() khi ĐÃ đóng băng ⇒ giữ nguyên mốc cũ (bấm 2 lần không đổi)',
    sql: `update settings set value = '"2020-01-01T00:00:00+00:00"' where key = 'dong_bang_luc';
          select dong_bang_lich();`,
    assert: `select ${MOC} = '"2020-01-01T00:00:00+00:00"'::jsonb as pass, 'mốc=' || ${MOC}::text as chi_tiet`,
  },
  {
    ma: 'D2',
    ten: 'mở băng sau 10 ngày: từ bị giữ (hạn F+2, chưa ôn) ⇒ hạn = hôm nay + 2',
    sql: `${DONG_BANG_10_NGAY} ${tu('a', 'stage2', `${F} + 2`)} select mo_bang_lich();`,
    assert: `select ${han('a')} = ${HOM_NAY} + 2 as pass, 'hạn a=' || ${han('a')} || ' (hôm nay ' || ${HOM_NAY} || ')' as chi_tiet`,
  },
  {
    ma: 'D3',
    ten: 'từ tồn đọng (hạn ≤ F) ⇒ KHÔNG dời',
    sql: `${DONG_BANG_10_NGAY} ${tu('b', 'stage1', `${F} - 3`)} ${tu('b2', 'stage1', F)} select mo_bang_lich();`,
    assert: `select ${han('b')} = ${F} - 3 and ${han('b2')} = ${F} as pass,
              'hạn b=' || ${han('b')} || ' · b2=' || ${han('b2')} as chi_tiet`,
  },
  {
    ma: 'D4',
    ten: 'từ ôn SAU mốc đóng băng (lên stage, hạn > F) ⇒ KHÔNG dời (Q6)',
    sql: `${DONG_BANG_10_NGAY} ${tu('c', 'stage3', `${F} + 5`, "now() - interval '2 days'")} select mo_bang_lich();`,
    assert: `select ${han('c')} = ${F} + 5 as pass, 'hạn c=' || ${han('c')} as chi_tiet`,
  },
  {
    ma: 'D5',
    ten: 'intensive bị giữ ⇒ dời (Q3); mastered / hàng đợi (hạn null) ⇒ không đổi',
    sql: `${DONG_BANG_10_NGAY} ${tu('d', 'intensive', `${F} + 1`)} ${tu('m', 'mastered', 'null')} ${tu('q', 'new', 'null')}
          select mo_bang_lich();`,
    assert: `select ${han('d')} = ${HOM_NAY} + 1 and ${han('m')} is null and ${han('q')} is null as pass,
              'd=' || ${han('d')} || ' · m=' || coalesce(${han('m')}::text, 'null') || ' · q=' || coalesce(${han('q')}::text, 'null') as chi_tiet`,
  },
  {
    ma: 'D6',
    ten: 'mở băng ⇒ mốc về null, trả {so_ngay: 10, so_tu_doi: 2}',
    sql: `${DONG_BANG_10_NGAY} ${tu('e1', 'stage1', `${F} + 1`)} ${tu('e2', 'stage2', `${F} + 4`)} ${tu('e3', 'new', `${F} - 1`)}
          create temp table kq as select mo_bang_lich() as r;`,
    assert: `select ${MOC} = 'null'::jsonb and (select r from kq) = '{"so_ngay": 10, "so_tu_doi": 2}'::jsonb as pass,
              'mốc=' || ${MOC}::text || ' · kq=' || (select r from kq)::text as chi_tiet`,
  },
  {
    ma: 'D7',
    ten: 'đóng băng rồi mở ngay trong ngày (N = 0) ⇒ không dời gì',
    sql: `select dong_bang_lich(); ${tu('f', 'stage2', `${HOM_NAY} + 3`)} create temp table kq as select mo_bang_lich() as r;`,
    assert: `select ${han('f')} = ${HOM_NAY} + 3 and ((select r from kq) ->> 'so_tu_doi')::int = 0 as pass,
              'hạn f=' || ${han('f')} || ' · kq=' || (select r from kq)::text as chi_tiet`,
  },
  {
    ma: 'D8',
    ten: 'mo_bang_lich() khi KHÔNG đóng băng ⇒ không đổi gì',
    sql: `${tu('g', 'stage2', `${HOM_NAY} + 3`)} create temp table kq as select mo_bang_lich() as r;`,
    assert: `select ${han('g')} = ${HOM_NAY} + 3 and ${MOC} = 'null'::jsonb as pass,
              'hạn g=' || ${han('g')} || ' · kq=' || (select r from kq)::text as chi_tiet`,
  },
]

console.log('\n── TDD dong_bang_lich() / mo_bang_lich() ──\n')

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
