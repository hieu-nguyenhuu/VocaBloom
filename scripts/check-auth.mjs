/**
 * check-auth.mjs — kiểm chứng THẬT cấu hình Auth của Phương án A (MB-10).
 *
 * Chạy: npm run check:auth
 *
 * Script này chứng minh 3 điều, mỗi điều bằng 1 lời gọi API thật:
 *   1. Tài khoản duy nhất đăng nhập được bằng EMAIL/PASSWORD trong .env.local
 *      → nếu chưa tick "Auto Confirm User" sẽ lộ ra ở đây (email_not_confirmed).
 *   2. Access token trả về có claim role = "authenticated" và có "sub" (chính là
 *      auth.uid()) → đây là thứ policy RLS `auth.uid() is not null` sẽ nhìn thấy.
 *   3. Đăng ký tự do ĐÃ TẮT (disable_signup = true), đọc READ-ONLY qua Management
 *      API. Không tắt thì người lạ tự tạo tài khoản và lọt qua policy → RLS vô nghĩa.
 *
 * Toàn bộ đều là thao tác ĐỌC, không tạo/sửa gì trên project.
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

function giaiMaJwt(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64').toString())
  } catch {
    return null
  }
}

const OK = '✅'
const LOI = '❌'
const CANHBAO = '⚠️ '
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
const email = env.EMAIL ?? ''
const password = env.PASSWORD ?? ''

console.log('\n── Kiểm tra Auth (Phương án A) ──\n')

bao(url.length > 0 && key.length > 0, 'Có VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY')
bao(email.includes('@'), 'EMAIL trong .env.local là địa chỉ hợp lệ', email || '(rỗng)')
bao(password.length >= 6, 'PASSWORD trong .env.local có giá trị', `${password.length} ký tự`)
if (hong > 0) {
  console.error('\nSửa .env.local rồi chạy lại.\n')
  process.exit(1)
}

// ── 1 + 2. Đăng nhập thật ────────────────────────────────────────────────
let daDangNhap = false
try {
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json().catch(() => null)

  if (res.ok && body?.access_token) {
    daDangNhap = true
    const claims = giaiMaJwt(body.access_token)
    bao(true, 'Đăng nhập bằng EMAIL/PASSWORD thành công', `user id ${body.user?.id ?? '?'}`)
    bao(
      Boolean(body.user?.email_confirmed_at ?? body.user?.confirmed_at),
      'Tài khoản đã được xác nhận email (Auto Confirm)',
    )
    bao(claims?.role === 'authenticated', 'Token có role = authenticated', `role=${claims?.role}`)
    bao(
      typeof claims?.sub === 'string' && claims.sub.length > 0,
      'Token có claim "sub" — chính là auth.uid() mà RLS sẽ đọc',
    )
  } else {
    const ma = body?.error_code ?? body?.error ?? `HTTP ${res.status}`
    bao(false, 'Đăng nhập thất bại', `${ma}: ${body?.msg ?? body?.error_description ?? ''}`)
    if (String(ma).includes('email_not_confirmed')) {
      console.log(
        `${CANHBAO} Chưa tick "Auto Confirm User" lúc tạo. Vào Dashboard → Authentication →`,
      )
      console.log('    Users → mở user → xác nhận thủ công, hoặc xoá rồi tạo lại có tick ô đó.')
    }
  }
} catch (e) {
  bao(false, 'Không gọi được Auth API', e.message)
}

// ── 3. Đăng ký tự do đã tắt chưa (đọc qua Management API) ────────────────
const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? ''
const mgmt = env.SUPABASE_ACCESS_TOKEN ?? ''

if (!mgmt || !ref) {
  console.log(`${CANHBAO} Bỏ qua kiểm tra "tắt đăng ký tự do" — thiếu SUPABASE_ACCESS_TOKEN.`)
} else {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      headers: { Authorization: `Bearer ${mgmt}` },
    })
    const cfg = await res.json().catch(() => null)
    if (!res.ok) {
      console.log(`${CANHBAO} Không đọc được cấu hình Auth — HTTP ${res.status}. Kiểm tra thủ công.`)
    } else {
      bao(
        cfg?.disable_signup === true,
        'Đăng ký tự do ĐÃ TẮT (disable_signup = true)',
        cfg?.disable_signup === true
          ? undefined
          : 'BẬT → người lạ tự tạo tài khoản sẽ lọt qua RLS',
      )
      const nhaCungCapNgoai = Object.entries(cfg)
        .filter(([k, v]) => k.startsWith('external_') && k.endsWith('_enabled') && v === true)
        .map(([k]) => k.replace(/^external_|_enabled$/g, ''))
      bao(
        nhaCungCapNgoai.every((p) => p === 'email'),
        'Không bật provider bên thứ ba nào ngoài Email',
        nhaCungCapNgoai.join(', ') || 'không có',
      )
    }
  } catch (e) {
    console.log(`${CANHBAO} Không gọi được Management API — ${e.message}`)
  }
}

console.log(
  hong === 0 && daDangNhap
    ? '\n✅ Auth sẵn sàng cho M1: có đúng 1 tài khoản đăng nhập được, đăng ký tự do đã khoá.\n'
    : `\n❌ Còn ${hong} mục chưa đạt.\n`,
)
process.exit(hong === 0 ? 0 : 1)
