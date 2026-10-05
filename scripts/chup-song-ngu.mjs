/**
 * chup-song-ngu.mjs — M26b: CHỤP (chỉ đọc) mọi chủ đề: từ + cụm + câu + mô tả cũ + hội thoại — để SOẠN nguồn song ngữ.
 * Chạy:  node scripts/chup-song-ngu.mjs > du-lieu-import/song-ngu/chu-de-db.json
 * Đăng nhập + PostgREST (luật §9.6). CHỈ GET.
 */
import { SUPABASE_URL, ANON_KEY, dangNhap } from './db-lib.mjs'

const token = await dangNhap()
if (!token) { console.error('❌  Đăng nhập thất bại.'); process.exit(1) }
const dau = { apikey: ANON_KEY, Authorization: `Bearer ${token}` }
async function doc(duong) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${duong}`, { headers: dau })
  if (!res.ok) throw new Error(`GET ${duong.split('?')[0]} → HTTP ${res.status}`)
  return res.json()
}
const COT = 'id,word,pinyin,meaning_vi,collocation,collocation_meaning_vi,example_sentence,example_meaning_vi,secondary_word'
const ra = []
for (const t of await doc('topics?select=id,name,created_at&order=created_at,name')) {
  const tu = (await doc(`vocab_topics?select=vocab(${COT})&topic_id=eq.${t.id}`)).map((r) => r.vocab)
  const moTa = await doc(`exercises?select=vocab_id,payload&type=eq.select_on_describe&vocab_id=in.(${tu.map((v) => v.id).join(',')})`)
  const desc = Object.fromEntries(moTa.map((m) => [m.vocab_id, m.payload.description]))
  const [ht] = await doc(`topic_dialogues?select=content&topic_id=eq.${t.id}`)
  ra.push({
    name: t.name,
    words: tu.map(({ id, ...v }) => ({ ...v, mo_ta_cu: desc[id] ?? null })),
    dialogue: (ht?.content?.lines ?? []).map((l) => ({ speaker: l.speaker, text_zh: l.text_zh, text_vi: l.text_vi })),
  })
}
process.stdout.write(JSON.stringify(ra, null, 1) + '\n')
