/**
 * db-lib.mjs — tiện ích dùng chung cho các script chạm database.
 *
 * Tách riêng để 3 script (db-migrate / check-schema / test-maintenance) cùng dùng
 * mà không script nào phải import file có hiệu ứng phụ (import db-migrate.mjs sẽ
 * chạy migration ngay lập tức — không phải thứ ta muốn khi chỉ cần hàm chaySql).
 */
import { readFileSync } from 'node:fs'

export function docEnv(duongDan = '.env.local') {
  const env = {}
  for (const dong of readFileSync(duongDan, 'utf8').split(/\r?\n/)) {
    const m = dong.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

const env = docEnv()

export const SUPABASE_URL = (env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
export const ANON_KEY = env.VITE_SUPABASE_ANON_KEY ?? ''
export const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? ''
const MGMT = env.SUPABASE_ACCESS_TOKEN ?? ''
export const EMAIL = env.EMAIL ?? ''
export const PASSWORD = env.PASSWORD ?? ''

if (!PROJECT_REF || !MGMT) {
  console.error('❌  Thiếu VITE_SUPABASE_URL hoặc SUPABASE_ACCESS_TOKEN trong .env.local')
  process.exit(1)
}

/** Chạy SQL tuỳ ý qua Management API. Trả { ok, status, rows, loi }. */
export async function chaySql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const body = await res.json().catch(() => null)
  return {
    ok: res.ok,
    status: res.status,
    rows: Array.isArray(body) ? body : [],
    loi: res.ok ? null : (body?.message ?? JSON.stringify(body)),
  }
}

/** Đăng nhập tài khoản duy nhất, trả access_token (dùng để thử RLS phía authenticated). */
export async function dangNhap() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const body = await res.json().catch(() => null)
  return res.ok ? (body?.access_token ?? null) : null
}
