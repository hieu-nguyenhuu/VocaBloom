/**
 * check-db.mjs — kiểm tra kết nối Supabase THẬT, không đoán.
 *
 * Chạy: npm run check:db
 *
 * Ở giai đoạn M0 schema còn trống (migration nằm ở M1), nên kết quả ĐÚNG mong đợi là:
 *   - /auth/v1/health  → HTTP 200
 *   - query bảng vocab → PGRST205 "Could not find the table"
 * PGRST205 nghĩa là key đã được chấp nhận và đã vào tới database — chỉ là chưa
 * có bảng. Nếu key sai thì sẽ là 401, khác hẳn.
 */
import { readFileSync } from 'node:fs'

function docEnv(duongDan) {
  const env = {}
  let noiDung
  try {
    noiDung = readFileSync(duongDan, 'utf8')
  } catch {
    return null
  }
  for (const dong of noiDung.split(/\r?\n/)) {
    const m = dong.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

const OK = '✅'
const LOI = '❌'
let hong = 0

function bao(dat, nhan, chiTiet) {
  if (!dat) hong += 1
  console.log(`${dat ? OK : LOI}  ${nhan}${chiTiet ? ` — ${chiTiet}` : ''}`)
}

const env = docEnv('.env.local')
if (!env) {
  console.error(`${LOI}  Không đọc được .env.local ở thư mục gốc dự án.`)
  process.exit(1)
}

const url = (env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const key = env.VITE_SUPABASE_ANON_KEY ?? ''

console.log('\n── Kiểm tra kết nối Supabase ──\n')

bao(url.length > 0, 'VITE_SUPABASE_URL có giá trị')
bao(key.length > 0, 'VITE_SUPABASE_ANON_KEY có giá trị')
if (hong > 0) {
  console.error('\nĐiền 2 giá trị này ở Supabase Dashboard → Project Settings → API.\n')
  process.exit(1)
}

// Ref trong URL phải khớp ref nhúng trong anon key — bắt lỗi ghép nhầm 2 project.
const refUrl = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? ''
let refKey = ''
try {
  refKey = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64').toString()).ref ?? ''
} catch {
  /* key không phải JWT — bỏ qua, phần gọi API bên dưới sẽ phát hiện nếu sai */
}
bao(
  refKey === '' || refUrl === refKey,
  'URL và anon key thuộc cùng một project',
  refKey === '' ? 'key không phải JWT, bỏ qua đối chiếu' : `ref=${refUrl}`,
)

try {
  const health = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key } })
  bao(health.ok, 'Auth service phản hồi', `HTTP ${health.status}`)

  const res = await fetch(`${url}/rest/v1/vocab?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const body = await res.json().catch(() => null)

  if (res.ok) {
    bao(true, 'Query bảng vocab thành công', `${Array.isArray(body) ? body.length : 0} dòng`)
  } else if (body?.code === 'PGRST205') {
    bao(true, 'REST API chấp nhận anon key', 'PGRST205 — schema trống, đúng như mong đợi ở M0')
  } else {
    bao(false, 'Query REST thất bại', `HTTP ${res.status} ${body?.message ?? ''}`)
  }
} catch (e) {
  bao(false, 'Không gọi được tới Supabase', e.message)
}

console.log(
  hong === 0
    ? '\n✅ Kết nối Supabase OK.\n'
    : `\n❌ Còn ${hong} mục chưa đạt.\n`,
)
process.exit(hong === 0 ? 0 : 1)
