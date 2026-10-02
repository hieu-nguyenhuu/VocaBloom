/**
 * chup-chu-de.mjs — M23: CHỤP (chỉ đọc) mọi chủ đề trong DB: từ + nghĩa + câu ví dụ + bài hội thoại sẵn có.
 *
 * Chạy:  node scripts/chup-chu-de.mjs > du-lieu-import/bo-sung-hoi-thoai/chu-de-db.json
 * Builder `dung_bo_sung.py` đọc file này (DB là nguồn sự thật — tên chủ đề trong DB có thể khác file import gốc).
 * Đi qua đăng nhập + PostgREST (luật §9.6). CHỈ GET.
 */
import { SUPABASE_URL, ANON_KEY, dangNhap } from './db-lib.mjs'

const token = await dangNhap()
if (!token) {
  console.error('❌  Đăng nhập thất bại.')
  process.exit(1)
}
const dau = { apikey: ANON_KEY, Authorization: `Bearer ${token}` }
async function doc(duong) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${duong}`, { headers: dau })
  if (!res.ok) throw new Error(`GET ${duong.split('?')[0]} → HTTP ${res.status}`)
  return res.json()
}

const topics = await doc('topics?select=id,name,created_at&order=created_at,name')
const ra = []
for (const t of topics) {
  const tu = (await doc(`vocab_topics?select=vocab(id,word,meaning_vi,example_sentence)&topic_id=eq.${t.id}`)).map((r) => r.vocab)
  const ids = tu.map((v) => v.id).join(',')
  const loc = 'select=id,vocab_id,type,payload&type=in.(select_dialog,fill_dialog)'
  const [a, b] = await Promise.all([
    doc(`exercises?${loc}&vocab_id=in.(${ids})`),
    doc(`exercises?${loc}&payload->>blank_b_vocab_id=in.(${ids})`),
  ])
  const word = Object.fromEntries(tu.map((v) => [v.id, v.word]))
  const cap = [...new Map([...a, ...b].map((x) => [x.id, x])).values()].map((x) => ({
    type: x.type, a: word[x.vocab_id] ?? '?', b: word[x.payload.blank_b_vocab_id] ?? '?', dialog_a: x.payload.dialog_a, dialog_b: x.payload.dialog_b,
  }))
  ra.push({ name: t.name, words: tu.map((v) => ({ word: v.word, nghia: v.meaning_vi, vi_du: v.example_sentence })), cap })
}
process.stdout.write(JSON.stringify(ra, null, 1) + '\n')
