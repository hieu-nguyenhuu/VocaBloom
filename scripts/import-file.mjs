/**
 * import-file.mjs — nạp 1 file JSON vào Supabase (SPECIFICATION.md §10).
 *
 * Chạy:  npm run import:file -- <đường dẫn.json> [--dry-run]
 *
 * Đi ĐÚNG đường mà UI sẽ đi ở phiên sau: đăng nhập thật rồi gọi RPC qua PostgREST,
 * chịu đủ RLS + GRANT. KHÔNG dùng Management API (cửa đó chạy quyền postgres, bypass
 * RLS -> chạy được cũng không chứng minh app sẽ chạy được).
 *
 * Logic validate dùng CHUNG với UI: import thẳng file .ts (Node 24 strip types native).
 */
import { readFileSync } from 'node:fs'
import { SUPABASE_URL, ANON_KEY, dangNhap } from './db-lib.mjs'
import { validateImportFile } from '../src/lib/importValidate.ts'

const args = process.argv.slice(2)
const chayThu = args.includes('--dry-run')
const duongDan = args.find((a) => !a.startsWith('--'))

if (!duongDan) {
  console.error('❌  Thiếu đường dẫn file.\n    npm run import:file -- <file.json> [--dry-run]')
  process.exit(1)
}

let noiDung
try {
  noiDung = JSON.parse(readFileSync(duongDan, 'utf8'))
} catch (e) {
  console.error(`❌  Không đọc/parse được ${duongDan}: ${e.message}`)
  process.exit(1)
}

console.log(`\n── Import ${duongDan}${chayThu ? '  (CHẠY THỬ — không ghi DB)' : ''} ──\n`)

// ── 1. Validate (hàm thuần, không chạm DB) ───────────────────────────────
const kq = validateImportFile(noiDung)
const t = kq.tom_tat
console.log(`Topic: ${t.ten_topic}`)
console.log(`  ${t.so_tu} từ vựng · ${t.so_bai_tap} bài tập · ${t.so_dong_hoi_thoai} dòng hội thoại\n`)

if (kq.loi.length > 0) {
  console.error(`❌  ${kq.loi.length} LỖI — không import:`)
  for (const l of kq.loi) console.error(`    · ${l.duong_dan}: ${l.thong_diep}`)
  process.exit(1)
}
console.log('✅  Validate: hợp lệ.')

for (const c of kq.canh_bao) console.log(`⚠️   ${c.duong_dan}: ${c.thong_diep}`)

// ── 2. Cảnh báo trùng — CẢNH BÁO, KHÔNG CHẶN (§10.3, DEC-21) ─────────────
const token = await dangNhap()
if (!token) {
  console.error('❌  Đăng nhập thất bại. Kiểm tra EMAIL/PASSWORD trong .env.local (npm run check:auth).')
  process.exit(1)
}

const dau = { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

async function truyVan(duongDanRest) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${duongDanRest}`, { headers: dau })
  return res.ok ? await res.json() : []
}

const dsTu = (noiDung.vocab ?? []).map((v) => v.word).filter(Boolean)
if (dsTu.length > 0) {
  const trong = dsTu.map((w) => `"${w.replace(/"/g, '\\"')}"`).join(',')
  const tuTrung = await truyVan(`vocab?select=word&word=in.(${encodeURIComponent(trong)})`)
  if (tuTrung.length > 0) {
    const ds = [...new Set(tuTrung.map((r) => r.word))]
    console.log(`⚠️   ${ds.length} từ đã có trong DB (${ds.join(', ')}) — vẫn thêm mới, không ghi đè (DEC-21).`)
  }
}

const tenTopic = noiDung.topic?.name ?? ''
const topicTrung = await truyVan(`topics?select=id&name=eq.${encodeURIComponent(tenTopic)}`)
if (topicTrung.length > 0) {
  console.log(`⚠️   Đã có ${topicTrung.length} topic tên "${tenTopic}" — sẽ tạo thêm topic mới (chốt Q4).`)
}

if (chayThu) {
  console.log('\n✅ Chạy thử xong — KHÔNG ghi gì vào DB.\n')
  process.exit(0)
}

// ── 3. Import thật: 1 transaction phía Postgres ──────────────────────────
const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/import_topic`, {
  method: 'POST',
  headers: dau,
  body: JSON.stringify({ du_lieu: noiDung }),
})
const body = await res.json().catch(() => null)

if (!res.ok) {
  console.error(`\n❌  Import thất bại — HTTP ${res.status}: ${body?.message ?? JSON.stringify(body)}`)
  console.error('    Không có dữ liệu nào được ghi (transaction đã rollback).\n')
  process.exit(1)
}

console.log('\n✅ Import thành công:')
console.log(`   topic_id = ${body?.topic_id}`)
console.log(`   ${body?.so_tu} từ · ${body?.so_bai_tap} bài tập · ${body?.so_dong_hoi_thoai} dòng hội thoại`)
console.log('   Từ mới nằm ở hàng đợi (next_review_date = NULL), cron sẽ nhỏ giọt theo new_words_per_day.\n')
