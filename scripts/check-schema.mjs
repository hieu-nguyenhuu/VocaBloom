/**
 * check-schema.mjs — nghiệm thu M1 bằng cách ĐỌC THẲNG trạng thái database thật.
 *
 * Chạy: npm run check:schema
 *
 * Không tin file migration "đã chạy xanh" là đủ — đối chiếu lại với pg_catalog /
 * information_schema, và thử RLS bằng 2 request HTTP thật (anon phải bị chặn,
 * authenticated phải đọc được).
 */
import { chaySql, SUPABASE_URL, ANON_KEY, dangNhap } from './db-lib.mjs'

const BANG = [
  'topics', 'vocab', 'vocab_topics', 'word_state', 'daily_retry_queue',
  'exercises', 'review_log', 'topic_dialogues', 'notifications', 'settings',
]

const INDEX = [
  'idx_word_state_due', 'idx_word_state_queue', 'idx_retry_queue_date',
  'idx_exercises_vocab_type', 'idx_exercises_blank_b', 'idx_review_log_daily',
  'idx_review_log_reviewed_at', 'idx_topic_dialogue_topic',
]

let hong = 0
function bao(dat, nhan, chiTiet) {
  if (!dat) hong += 1
  console.log(`${dat ? '✅' : '❌'}  ${nhan}${chiTiet ? ` — ${chiTiet}` : ''}`)
}

console.log('\n── Nghiệm thu schema M1 ──\n')

const { rows } = await chaySql(`
  select
    (select count(*) from information_schema.tables
      where table_schema = 'public' and table_name = any(array[${BANG.map((t) => `'${t}'`)}]))::int as so_bang,
    (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = any(array[${INDEX.map((i) => `'${i}'`)}]))::int as so_index,
    (select count(*) from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'word_stage')::int as nhan_word_stage,
    (select count(*) from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'exercise_type')::int as nhan_exercise_type,
    (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relrowsecurity
        and c.relname = any(array[${BANG.map((t) => `'${t}'`)}]))::int as so_bang_bat_rls,
    (select count(*) from pg_policies
      where schemaname = 'public' and policyname = 'authenticated_full_access')::int as so_policy,
    (select count(*) from settings)::int as so_settings,
    (select count(*) from cron.job where jobname = 'daily-srs-maintenance' and active)::int as so_cron,
    (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'run_daily_maintenance')::int as co_ham,
    (select has_function_privilege('anon', 'public.run_daily_maintenance()', 'execute')) as anon_goi_duoc_ham,
    (select bool_or(has_table_privilege('anon', 'public.' || quote_ident(t), 'select'))
       from unnest(array[${BANG.map((t) => `'${t}'`)}]) t) as anon_doc_duoc_bang,
    (select bool_and(has_table_privilege('authenticated', 'public.' || quote_ident(t), 'select'))
       from unnest(array[${BANG.map((t) => `'${t}'`)}]) t) as auth_doc_duoc_bang
`)

const r = rows[0] ?? {}
bao(r.so_bang === BANG.length, `Đủ ${BANG.length} bảng`, `thấy ${r.so_bang}`)
bao(r.so_index === INDEX.length, `Đủ ${INDEX.length} index`, `thấy ${r.so_index}`)
bao(r.nhan_word_stage === 6, 'Enum word_stage đủ 6 nhãn', `thấy ${r.nhan_word_stage}`)
bao(r.nhan_exercise_type === 17, 'Enum exercise_type đủ 17 nhãn', `thấy ${r.nhan_exercise_type}`)
bao(r.so_bang_bat_rls === BANG.length, `RLS bật trên cả ${BANG.length} bảng`, `thấy ${r.so_bang_bat_rls}`)
bao(r.so_policy === BANG.length, `Đủ ${BANG.length} policy authenticated_full_access`, `thấy ${r.so_policy}`)
bao(r.so_settings === 5, 'Seed settings đủ 5 key', `thấy ${r.so_settings}`)
bao(r.co_ham === 1, 'Hàm run_daily_maintenance() tồn tại')
bao(r.so_cron === 1, 'Cron job daily-srs-maintenance đang active')
bao(r.anon_goi_duoc_ham === false, 'anon KHÔNG gọi được hàm qua RPC (đã revoke)')
bao(r.anon_doc_duoc_bang === false, 'anon KHÔNG có quyền SELECT trên bất kỳ bảng nào')
bao(r.auth_doc_duoc_bang === true, 'authenticated CÓ quyền SELECT trên cả 10 bảng')

// ── 2 phép thử RLS bằng HTTP thật ────────────────────────────────────────
const anon = await fetch(`${SUPABASE_URL}/rest/v1/topics?select=id&limit=1`, {
  headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
})
const duLieuAnon = await anon.json().catch(() => null)
// anon bị chặn theo 1 trong 2 cách, cách nào cũng đạt:
//   - 401/403 + mã 42501: chặn ở tầng GRANT (mạnh hơn — anon không có quyền bảng)
//   - 200 nhưng 0 dòng:   chặn ở tầng RLS
const anonBiChan =
  (duLieuAnon?.code === '42501') ||
  (anon.status === 200 && Array.isArray(duLieuAnon) && duLieuAnon.length === 0)
bao(
  anonBiChan,
  'anon key bị chặn, không đọc được dữ liệu',
  duLieuAnon?.code === '42501'
    ? `HTTP ${anon.status} · 42501 permission denied (chặn ở tầng GRANT)`
    : `HTTP ${anon.status}, trả ${Array.isArray(duLieuAnon) ? `${duLieuAnon.length} dòng` : 'lỗi'}`,
)

const token = await dangNhap()
if (!token) {
  bao(false, 'Đăng nhập để thử RLS phía authenticated')
} else {
  const auth = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  })
  const duLieuAuth = await auth.json().catch(() => null)
  bao(
    auth.status === 200 && Array.isArray(duLieuAuth) && duLieuAuth.length === 5,
    'Tài khoản đã đăng nhập ĐỌC ĐƯỢC dữ liệu',
    `HTTP ${auth.status}, ${Array.isArray(duLieuAuth) ? duLieuAuth.length : '?'} dòng settings`,
  )
}

console.log(hong === 0 ? '\n✅ Schema M1 đạt toàn bộ tiêu chí.\n' : `\n❌ Còn ${hong} mục chưa đạt.\n`)
process.exit(hong === 0 ? 0 : 1)
