// seed-kiem-thu.mjs — nạp bộ dữ liệu kiểm thử (M9/Q3) rồi đặt TẤT CẢ từ ĐẾN HẠN HÔM NAY.
//
// Chạy: npm run seed:test        (đọc EMAIL/PASSWORD/VITE_SUPABASE_* từ .env.local)
//
// Đi qua đăng nhập + PostgREST như mọi script chạm dữ liệu thật (systemPatterns §183),
// KHÔNG dùng Management API. Chạy lại nhiều lần được — mỗi lần tạo một chủ đề "Kiểm thử" MỚI
// (đúng hành vi import §10.3 "luôn thêm mới"); muốn dọn thì xoá chủ đề ở màn Từ vựng.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = Object.fromEntries(
  readFileSync(join(GOC, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((d) => d && !d.trimStart().startsWith('#') && d.includes('='))
    .map((d) => [d.slice(0, d.indexOf('=')).trim(), d.slice(d.indexOf('=') + 1).trim()]),
)
const SB = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
if (!SB || !ANON || !env.EMAIL || !env.PASSWORD) {
  console.error('❌ Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / EMAIL / PASSWORD trong .env.local')
  process.exit(1)
}

/** Từ nào thuộc stage nào — khớp `temp_id` trong du-lieu-kiem-thu/kiem-thu.json. */
const STAGE_THEO_TU = {
  n1: 'new', n2: 'new', n3: 'new',
  s1a: 'stage1', s1b: 'stage1', s1c: 'stage1',
  s2a: 'stage2', s2b: 'stage2', s2c: 'stage2',
  s3a: 'stage3', s3b: 'stage3', s3c: 'stage3',
  i1: 'intensive', i2: 'intensive',
}

const duLieu = JSON.parse(readFileSync(join(GOC, 'du-lieu-kiem-thu', 'kiem-thu.json'), 'utf8'))

const { access_token } = await (
  await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.EMAIL, password: env.PASSWORD }),
  })
).json()
if (!access_token) {
  console.error('❌ Đăng nhập thất bại — kiểm lại EMAIL/PASSWORD trong .env.local')
  process.exit(1)
}
const H = { apikey: ANON, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }
const rest = async (q, init) => {
  const r = await fetch(`${SB}/rest/v1/${q}`, { headers: H, ...init })
  const t = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`)
  return t ? JSON.parse(t) : null
}

// 1) Import qua đúng RPC mà màn Import dùng (1 transaction, temp_id → uuid)
const kq = await rest('rpc/import_topic', { method: 'POST', body: JSON.stringify({ du_lieu: duLieu }) })
console.log(`✅ Đã import: ${kq.so_tu} từ · ${kq.so_bai_tap} bài tập · ${kq.so_dong_hoi_thoai} câu hội thoại`)

// 2) Đặt stage + đến hạn HÔM NAY (giờ VN). Import để next_review_date = NULL (hàng đợi từ mới),
//    nếu không kéo về thì phải chờ cron nhỏ giọt nhiều ngày mới test được stage cao.
const homNay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

const dsTu = await rest(`vocab_topics?select=vocab_id,vocab(word)&topic_id=eq.${kq.topic_id}`)
const theoChu = Object.fromEntries(dsTu.map((r) => [r.vocab?.word, r.vocab_id]))
const chuTheoTempId = Object.fromEntries(duLieu.vocab.map((v) => [v.temp_id, v.word]))

let da = 0
for (const [tempId, stage] of Object.entries(STAGE_THEO_TU)) {
  const id = theoChu[chuTheoTempId[tempId]]
  if (!id) {
    console.warn(`⚠️  Không tìm thấy từ cho temp_id ${tempId}`)
    continue
  }
  await rest(`word_state?vocab_id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      stage,
      next_review_date: homNay,
      cycle_points: 0,
      cycle_completed_exercises: [],
    }),
  })
  da += 1
}
console.log(`✅ Đã đặt ${da} từ về đến hạn ${homNay}`)

// 3) Bảng đối chiếu
const sau = await rest(`word_state?select=stage,next_review_date,vocab_id&vocab_id=in.(${dsTu.map((r) => r.vocab_id).join(',')})`)
const dem = {}
for (const r of sau) {
  if (r.next_review_date === homNay) dem[r.stage] = (dem[r.stage] ?? 0) + 1
}
console.log('\nSố từ ĐẾN HẠN HÔM NAY theo stage (chủ đề vừa tạo):')
for (const s of ['new', 'stage1', 'stage2', 'stage3', 'intensive']) {
  console.log(`  ${s.padEnd(10)} ${dem[s] ?? 0}`)
}
const tongDue = await rest(`word_state?select=vocab_id&next_review_date=lte.${homNay}&stage=neq.mastered`)
console.log(`\nTổng số từ đến hạn trên toàn app: ${tongDue.length}`)
console.log('→ Mở /on-tap để chạy thử, hoặc /tu-vung để xoá chủ đề "Kiểm thử" khi không cần nữa.')
