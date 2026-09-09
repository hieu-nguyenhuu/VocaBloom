/**
 * db-migrate.mjs — chạy toàn bộ supabase/migrations/*.sql lên Supabase.
 *
 * Chạy: npm run db:migrate
 *
 * KHÔNG dùng Supabase CLI (DESIGN.md M1 · D-1): gửi thẳng SQL qua Management API
 * bằng fetch có sẵn của Node → 0 package mới.
 *
 * Mọi file migration phải IDEMPOTENT (D-2) — chạy lại bao nhiêu lần cũng xanh.
 * Không có bảng lịch sử migration; tính idempotent chính là thứ thay thế nó.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { chaySql, PROJECT_REF } from './db-lib.mjs'

const thuMuc = 'supabase/migrations'
const files = readdirSync(thuMuc).filter((f) => f.endsWith('.sql')).sort()

if (files.length === 0) {
  console.error(`❌  Không có file .sql nào trong ${thuMuc}`)
  process.exit(1)
}

console.log(`\n── Chạy ${files.length} migration lên project ${PROJECT_REF} ──\n`)

for (const ten of files) {
  const sql = readFileSync(`${thuMuc}/${ten}`, 'utf8')
  const { ok, status, loi } = await chaySql(sql)
  if (!ok) {
    console.error(`❌  ${ten} — HTTP ${status}: ${loi}`)
    console.error('\nDừng lại, KHÔNG chạy các file sau.\n')
    process.exit(1)
  }
  console.log(`✅  ${ten}`)
}

console.log('\n✅ Toàn bộ migration đã chạy xong.\n')
