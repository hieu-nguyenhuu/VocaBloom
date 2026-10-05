/**
 * bo-sung-song-ngu.mjs — M26b: ghi phần SONG NGỮ vào chủ đề ĐÃ CÓ (Design.m26.md §10).
 * Chạy:  npm run bo-sung:song-ngu -- <file.json ...> [--dry-run]
 * Đăng nhập + PostgREST (luật §9.6). CHỈ GET / PATCH theo id=eq / POST exercises. KHÔNG DELETE, KHÔNG đụng word_state.
 * Bài near_synonym đã nạp mà khác file (sửa pinyin…) ⇒ PATCH đúng dòng đó theo id.
 * Pha 1 kiểm TẤT CẢ file; có lỗi ⇒ không ghi gì. Pha 2 ghi rồi ĐỌC LẠI: lần lập kế hoạch thứ 2 phải ra 0 thay đổi.
 */
import { readFileSync } from 'node:fs'
import { SUPABASE_URL, ANON_KEY, dangNhap } from './db-lib.mjs'
import { COT_PHU, lapKeHoach } from '../src/lib/boSungSongNgu.ts'

const args = process.argv.slice(2)
const chayThu = args.includes('--dry-run')
const dsFile = args.filter((a) => !a.startsWith('--'))
if (dsFile.length === 0) { console.error('❌  Thiếu file.\n    npm run bo-sung:song-ngu -- <file.json ...> [--dry-run]'); process.exit(1) }
const token = await dangNhap()
if (!token) { console.error('❌  Đăng nhập thất bại (npm run check:auth).'); process.exit(1) }
const dau = { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

async function goi(method, duong, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${duong}`, {
    method, headers: { ...dau, ...(method === 'GET' ? {} : { Prefer: 'return=minimal' }) }, body: body && JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${method} ${duong.split('?')[0]} → HTTP ${res.status}: ${await res.text()}`)
  return method === 'GET' ? res.json() : null
}
async function napChuDe(ten) {
  const ts = await goi('GET', `topics?select=id&name=eq.${encodeURIComponent(ten)}`)
  if (ts.length !== 1) throw new Error(`Chủ đề "${ten}": tìm thấy ${ts.length} (cần đúng 1).`)
  const tu = (await goi('GET', `vocab_topics?select=vocab(id,word,${COT_PHU.join(',')})&topic_id=eq.${ts[0].id}`)).map((r) => r.vocab)
  const ids = tu.map((t) => t.id).join(',')
  const [moTa, gn, ht] = await Promise.all([
    goi('GET', `exercises?select=id,vocab_id,payload&type=eq.select_on_describe&vocab_id=in.(${ids})`),
    goi('GET', `exercises?select=id,vocab_id,payload&type=eq.near_synonym&vocab_id=in.(${ids})`),
    goi('GET', `topic_dialogues?select=id,content&topic_id=eq.${ts[0].id}`),
  ])
  return { tu, moTa, ganNghiaCo: gn, hoiThoai: ht[0] ?? null }
}
const dem = (k) => `vocab ${k.vocab.length} · mô tả ${k.moTa.length} · gần nghĩa +${k.ganNghia.length}` +
  (k.ganNghiaSua.length ? ` · sửa gần nghĩa ${k.ganNghiaSua.length}` : '') + ` · hội thoại ${k.hoiThoai ? 1 : 0}`

// ── Pha 1 ──
const ke = []; let coLoi = false
for (const f of dsFile) {
  try {
    const file = JSON.parse(readFileSync(f, 'utf8'))
    const k = lapKeHoach(file, await napChuDe(file.topic_name))
    if (k.loi.length) { coLoi = true; console.error(`❌  ${file.topic_name} — ${k.loi.length} lỗi:`); k.loi.forEach((l) => console.error(`    · ${l.duong_dan}: ${l.thong_diep}`)); continue }
    console.log(`🔎 ${file.topic_name}: ${dem(k)}`); ke.push({ file, k })
  } catch (e) { coLoi = true; console.error(`❌  ${f}: ${e.message}`) }
}
if (coLoi) { console.error('\n❌  Có lỗi — KHÔNG ghi file nào.\n'); process.exit(1) }
if (chayThu) { console.log('\n✅ Chạy thử xong — KHÔNG ghi gì vào DB.\n'); process.exit(0) }

// ── Pha 2: ghi theo id, rồi lập kế hoạch LẠI — phải 0 thay đổi ──
for (const { file, k } of ke) {
  for (const v of k.vocab) await goi('PATCH', `vocab?id=eq.${v.id}`, v.thay)
  for (const m of k.moTa) await goi('PATCH', `exercises?id=eq.${m.id}`, { payload: m.payload })
  if (k.ganNghia.length) await goi('POST', 'exercises', k.ganNghia)          // 1 POST = 1 transaction
  for (const g of k.ganNghiaSua) await goi('PATCH', `exercises?id=eq.${g.id}`, { payload: g.payload })
  if (k.hoiThoai) await goi('PATCH', `topic_dialogues?id=eq.${k.hoiThoai.id}`, { content: k.hoiThoai.content })
  const lai = lapKeHoach(file, await napChuDe(file.topic_name))
  const sach = !lai.loi.length && !lai.vocab.length && !lai.moTa.length && !lai.ganNghia.length && !lai.ganNghiaSua.length && !lai.hoiThoai
  console.log(`${sach ? '✅' : '❌'} ĐÃ GHI ${file.topic_name}: ${dem(k)}${sach ? ' · đọc lại: 0 thay đổi còn lại' : ` · CÒN: ${dem(lai)}`}`)
  if (!sach) process.exit(1)
}
