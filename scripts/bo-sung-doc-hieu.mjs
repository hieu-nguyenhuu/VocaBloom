/**
 * bo-sung-doc-hieu.mjs — M31: nạp đề ĐỌC HIỂU vào chủ đề ĐÃ CÓ trong DB.
 *
 * Chạy:  npm run bo-sung:doc-hieu -- <file.json ...> [--dry-run]
 * File:  { "topic_name": "...", "readings": [ { kieu, lines[], highlight_words[], questions[] } ] }
 *
 * Đăng nhập + PostgREST (luật §9.6). CHỈ GET + POST `topic_readings` — không PATCH/DELETE.
 * Pha 1 kiểm TẤT CẢ file; lỗi ở bất kỳ file nào ⇒ không ghi gì. Chủ đề ĐÃ có đề ⇒ chặn (không nhân đôi).
 */
import { readFileSync } from 'node:fs'
import { SUPABASE_URL, ANON_KEY, dangNhap } from './db-lib.mjs'
import { dongGhiBaiDoc, kiemTraBaiDoc } from '../src/lib/docHieu.ts'

const args = process.argv.slice(2)
const chayThu = args.includes('--dry-run')
const dsFile = args.filter((a) => !a.startsWith('--'))

if (dsFile.length === 0) {
  console.error('❌  Thiếu file.\n    npm run bo-sung:doc-hieu -- <file.json ...> [--dry-run]')
  process.exit(1)
}

const token = await dangNhap()
if (!token) {
  console.error('❌  Đăng nhập thất bại. Kiểm tra EMAIL/PASSWORD trong .env.local (npm run check:auth).')
  process.exit(1)
}
const dau = { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

async function doc(duong) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${duong}`, { headers: dau })
  if (!res.ok) throw new Error(`GET ${duong.split('?')[0]} → HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

// ── Pha 1: kiểm tất cả, chưa ghi gì ──────────────────────────────────────
const ke = []
let coLoi = false
for (const duongDan of dsFile) {
  try {
    const nd = JSON.parse(readFileSync(duongDan, 'utf8'))
    const ten = nd?.topic_name ?? ''
    const topics = await doc(`topics?select=id&name=eq.${encodeURIComponent(ten)}`)
    if (topics.length !== 1) throw new Error(`chủ đề "${ten}": tìm thấy ${topics.length} (cần đúng 1)`)
    const topicId = topics[0].id
    const tu = (await doc(`vocab_topics?select=vocab(id,word,lang)&topic_id=eq.${topicId}`)).map((r) => r.vocab)
    const daCo = await doc(`topic_readings?select=id&topic_id=eq.${topicId}`)
    if (daCo.length > 0) throw new Error(`chủ đề "${ten}" ĐÃ có ${daCo.length} đoạn — không nạp chồng`)

    const kq = kiemTraBaiDoc(nd.readings, tu.map((t) => t.word), tu[0]?.lang ?? 'zh')
    if (kq.loi.length > 0) {
      console.error(`❌  ${ten} — ${kq.loi.length} lỗi:`)
      for (const l of kq.loi) console.error(`    · ${l.duong_dan}: ${l.thong_diep}`)
      coLoi = true
      continue
    }
    const soCau = nd.readings.reduce((s, r) => s + r.questions.length, 0)
    const phu = tu.length - kq.thieu_phu.length
    console.log(
      `${kq.thieu_phu.length === 0 ? '✅' : '⚠️ '} ${ten}: ${nd.readings.length} đoạn · ${soCau} câu · phủ ${phu}/${tu.length} từ` +
        (kq.thieu_phu.length > 0 ? ` · CHƯA PHỦ: ${kq.thieu_phu.join(', ')}` : ''),
    )
    ke.push({ ten, dong: dongGhiBaiDoc(nd.readings, topicId, Object.fromEntries(tu.map((t) => [t.word, t.id]))) })
  } catch (e) {
    console.error(`❌  ${duongDan}: ${e.message}`)
    coLoi = true
  }
}

if (coLoi) {
  console.error('\n❌  Có lỗi — KHÔNG ghi file nào.\n')
  process.exit(1)
}
if (chayThu) {
  console.log('\n✅ Chạy thử xong — KHÔNG ghi gì vào DB.\n')
  process.exit(0)
}

// ── Pha 2: mỗi chủ đề 1 POST (PostgREST bọc 1 transaction) ─────────────
for (const { ten, dong } of ke) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/topic_readings`, {
    method: 'POST',
    headers: { ...dau, Prefer: 'return=minimal' },
    body: JSON.stringify(dong),
  })
  if (!res.ok) {
    console.error(`❌  ${ten}: ghi thất bại HTTP ${res.status} — ${await res.text()} (chủ đề này không ghi dòng nào).`)
    process.exit(1)
  }
  console.log(`✅ ĐÃ GHI ${ten}: +${dong.length} đoạn`)
}
console.log('')
