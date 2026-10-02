/**
 * bo-sung-hoi-thoai.mjs — M23: thêm select_dialog/fill_dialog vào chủ đề ĐÃ CÓ trong DB.
 *
 * Chạy:  npm run bo-sung:hoi-thoai -- <file.json ...> [--dry-run]
 *
 * Đi qua đăng nhập + PostgREST (chịu RLS + GRANT — luật §9.6), giống import:file.
 * CHỈ GET + POST bảng `exercises`: không PATCH/DELETE, không đụng word_state/vocab ⇒ tiến độ học giữ nguyên.
 * Pha 1 kiểm TẤT CẢ file trước; có lỗi ở bất kỳ file nào ⇒ không ghi gì. Pha 2 mỗi chủ đề 1 POST = 1 transaction.
 */
import { readFileSync } from 'node:fs'
import { SUPABASE_URL, ANON_KEY, dangNhap } from './db-lib.mjs'
import { dichBaiBoSung, phuSongHoiThoai } from '../src/lib/boSungHoiThoai.ts'

const args = process.argv.slice(2)
const chayThu = args.includes('--dry-run')
const dsFile = args.filter((a) => !a.startsWith('--'))

if (dsFile.length === 0) {
  console.error('❌  Thiếu file.\n    npm run bo-sung:hoi-thoai -- <file.json ...> [--dry-run]')
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

/** Từ của chủ đề + mọi bài hội thoại dính tới các từ đó (vai A HOẶC vai B, gộp theo id như PlayerPage). */
async function napChuDe(ten) {
  const topics = await doc(`topics?select=id&name=eq.${encodeURIComponent(ten)}`)
  if (topics.length !== 1) throw new Error(`Chủ đề "${ten}": tìm thấy ${topics.length} (cần đúng 1).`)
  const tu = (await doc(`vocab_topics?select=vocab(id,word)&topic_id=eq.${topics[0].id}`)).map((r) => r.vocab)
  const ids = tu.map((t) => t.id).join(',')
  const loc = 'select=id,vocab_id,type,payload&type=in.(select_dialog,fill_dialog)'
  const [vaiA, vaiB] = await Promise.all([
    doc(`exercises?${loc}&vocab_id=in.(${ids})`),
    doc(`exercises?${loc}&payload->>blank_b_vocab_id=in.(${ids})`),
  ])
  const bai = [...new Map([...vaiA, ...vaiB].map((b) => [b.id, b])).values()]
  return { tu, bai }
}

const inThieu = (p) => `thiếu SD [${p.select_dialog.join(', ')}] · thiếu FD [${p.fill_dialog.join(', ')}]`

// ── Pha 1: kiểm tất cả, chưa ghi gì ──────────────────────────────────────
const ke = []
let coLoi = false
for (const duongDan of dsFile) {
  let noiDung
  try {
    noiDung = JSON.parse(readFileSync(duongDan, 'utf8'))
  } catch (e) {
    console.error(`❌  ${duongDan}: không đọc/parse được — ${e.message}`)
    coLoi = true
    continue
  }
  const ten = noiDung?.topic_name ?? ''
  let cd
  try {
    cd = await napChuDe(ten)
  } catch (e) {
    console.error(`❌  ${duongDan}: ${e.message}`)
    coLoi = true
    continue
  }
  const kq = dichBaiBoSung(noiDung, cd.tu, cd.bai)
  if (kq.loi.length > 0) {
    console.error(`❌  ${ten} — ${kq.loi.length} lỗi:`)
    for (const l of kq.loi) console.error(`    · ${l.duong_dan}: ${l.thong_diep}`)
    coLoi = true
    continue
  }
  const sau = phuSongHoiThoai(cd.tu, [...cd.bai, ...kq.dong])
  const du = sau.select_dialog.length === 0 && sau.fill_dialog.length === 0
  console.log(`${du ? '✅' : '⚠️ '} ${ten}: ${cd.tu.length} từ · có sẵn ${cd.bai.length} bài · +${kq.dong.length} mới · bỏ qua ${kq.bo_qua.length}` +
    (du ? ' · phủ sóng đủ' : ` · ${inThieu(sau)}`))
  ke.push({ ten, dong: kq.dong })
}

if (coLoi) {
  console.error('\n❌  Có lỗi — KHÔNG ghi file nào.\n')
  process.exit(1)
}
if (chayThu) {
  console.log('\n✅ Chạy thử xong — KHÔNG ghi gì vào DB.\n')
  process.exit(0)
}

// ── Pha 2: ghi, mỗi chủ đề 1 POST (PostgREST bọc 1 transaction) ─────────
for (const { ten, dong } of ke) {
  if (dong.length > 0) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/exercises`, {
      method: 'POST',
      headers: { ...dau, Prefer: 'return=minimal' },
      body: JSON.stringify(dong),
    })
    if (!res.ok) {
      console.error(`❌  ${ten}: ghi thất bại HTTP ${res.status} — ${await res.text()} (chủ đề này không ghi dòng nào).`)
      process.exit(1)
    }
  }
  const cd = await napChuDe(ten)
  const that = phuSongHoiThoai(cd.tu, cd.bai)
  const du = that.select_dialog.length === 0 && that.fill_dialog.length === 0
  console.log(`${du ? '✅' : '⚠️ '} ĐÃ GHI ${ten}: +${dong.length} · DB nay ${cd.bai.length} bài hội thoại` + (du ? ' · phủ sóng đủ' : ` · ${inThieu(that)}`))
}
console.log('')
