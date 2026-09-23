// keo-den-han.mjs — kéo N từ CHƯA đến hạn về "đến hạn hôm nay" để có thêm từ ôn thử ngay.
//
// Chạy: npm run due:today -- 10        (mặc định 10)
//
// Chỉ đổi `next_review_date`, KHÔNG đụng điểm/stage/bài đã đạt. Ưu tiên:
//   · từ chưa có review_log hôm nay (để Player nhận ngay, DEC-06)
//   · trộn đều các stage (round-robin) để lượt ôn có đủ dạng bài
// Đi qua đăng nhập + PostgREST (systemPatterns §183), không dùng Management API.
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
const soCan = Math.max(1, Number(process.argv[2] ?? 10) || 10)

const { access_token } = await (
  await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.EMAIL, password: env.PASSWORD }),
  })
).json()
if (!access_token) {
  console.error('❌ Đăng nhập thất bại — kiểm EMAIL/PASSWORD trong .env.local')
  process.exit(1)
}
const H = { apikey: ANON, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }
const rest = async (q, init) => {
  const r = await fetch(`${SB}/rest/v1/${q}`, { headers: H, ...init })
  const t = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`)
  return t ? JSON.parse(t) : null
}

const homNay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

const ws = await rest('word_state?select=vocab_id,stage,next_review_date,vocab(word)')
const daOnHomNay = new Set(
  (await rest(`review_log?select=vocab_id&reviewed_at=gte.${homNay}T00:00:00%2B07:00`)).map((r) => r.vocab_id),
)
const ungVien = ws.filter(
  (w) => w.stage !== 'mastered' && (!w.next_review_date || w.next_review_date > homNay) && !daOnHomNay.has(w.vocab_id),
)
if (ungVien.length === 0) {
  console.log('Không còn từ nào chưa đến hạn để kéo. Chạy `npm run seed:test` nếu muốn thêm từ mới.')
  process.exit(0)
}

// Round-robin theo stage để lượt ôn có đủ dạng bài
const theoStage = new Map()
for (const w of ungVien) (theoStage.get(w.stage) ?? theoStage.set(w.stage, []).get(w.stage)).push(w)
const chon = []
while (chon.length < soCan && [...theoStage.values()].some((d) => d.length > 0)) {
  for (const ds of theoStage.values()) {
    if (chon.length >= soCan) break
    const w = ds.shift()
    if (w) chon.push(w)
  }
}

for (const w of chon) {
  await rest(`word_state?vocab_id=eq.${w.vocab_id}`, { method: 'PATCH', body: JSON.stringify({ next_review_date: homNay }) })
}

const dem = {}
for (const w of chon) dem[w.stage] = (dem[w.stage] ?? 0) + 1
console.log(`✅ Đã kéo ${chon.length} từ về đến hạn ${homNay}: ${chon.map((w) => `${w.vocab?.word}(${w.stage})`).join(' ')}`)
console.log('   theo stage:', JSON.stringify(dem))
const tongDue = await rest(`word_state?select=vocab_id&next_review_date=lte.${homNay}&stage=neq.mastered`)
console.log(`   Tổng số từ đến hạn trên toàn app: ${tongDue.length}`)
