/**
 * boSungSongNgu.ts — M26b: bổ sung từ vựng PHỤ cho chủ đề ĐÃ CÓ trong DB (Design.m26.md §10).
 *
 * HÀM THUẦN (MB-05): không đọc file, không network. CLI `scripts/bo-sung-song-ngu.mjs` lo phần DB.
 * File bổ sung dùng `word` (từ đã có trong DB) thay `temp_id`. Payload near_synonym kiểm bằng CHÍNH luật của
 * `importValidate.ts` — không có bộ kiểm thứ 2. Chỉ trả về field THỰC SỰ khác DB ⇒ chạy lại = 0 thay đổi (idempotent).
 * Bài near_synonym ĐÃ CÓ mà khác file (vd sửa pinyin sau khi nạp) ⇒ `ganNghiaSua` (PATCH theo id), so sánh không phụ
 * thuộc thứ tự khoá vì jsonb của Postgres tự sắp lại khoá.
 */
import { kiemNhieuGanNghia, kiemPayload, type ViTri } from './importValidate.ts'
import { tachNghiaPhu } from './songNgu.ts'

export const COT_PHU = [
  'secondary_word', 'secondary_phonetic', 'secondary_collocation', 'secondary_example', 'secondary_note',
] as const
type CotPhu = (typeof COT_PHU)[number]
/** 3 cột bắt buộc có chữ; 2 cột còn lại KEY bắt buộc nhưng được null — cùng luật với file import (M26a). */
const COT_BAT_BUOC: readonly CotPhu[] = ['secondary_word', 'secondary_collocation', 'secondary_example']

export type TuDb = { id: string; word: string } & Record<CotPhu, string | null>
export type MoTaDb = { id: string; vocab_id: string; payload: Record<string, unknown> }
export type DongHoiThoaiDb = Record<string, unknown>
export type HoiThoaiDb = { id: string; content: { lines: DongHoiThoaiDb[] } }
export type GanNghiaDb = { id: string; vocab_id: string; payload: Record<string, unknown> }
export type ChuDeDb = { tu: TuDb[]; moTa: MoTaDb[]; ganNghiaCo: GanNghiaDb[]; hoiThoai: HoiThoaiDb | null }
export type KeHoach = {
  vocab: { id: string; thay: Partial<Record<CotPhu, string | null>> }[]
  moTa: { id: string; payload: Record<string, unknown> }[]
  ganNghia: { vocab_id: string; type: 'near_synonym'; payload: Record<string, unknown> }[]
  ganNghiaSua: { id: string; payload: Record<string, unknown> }[]
  hoiThoai: HoiThoaiDb | null
  loi: ViTri[]
}

const laObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const coChu = (x: unknown): x is string => typeof x === 'string' && x.trim() !== ''
/** So sánh sâu, KHÔNG phụ thuộc thứ tự khoá object (jsonb tự sắp lại khoá khi lưu). */
function giongNhau(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => giongNhau(x, b[i]))
  }
  if (laObject(a) && laObject(b)) {
    const ka = Object.keys(a)
    return ka.length === Object.keys(b).length && ka.every((key) => key in b && giongNhau(a[key], b[key]))
  }
  return a === b
}
const thoat = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** "review; revise" có xuất hiện TRỌN từ trong câu không (không khớp "test" trong "testimony"). */
function chuaNghiaPhu(cau: string, nghiaPhu: string): boolean {
  return tachNghiaPhu(nghiaPhu).some((w) => new RegExp(`(^|[^\\p{L}])${thoat(w)}($|[^\\p{L}])`, 'iu').test(cau))
}

export function lapKeHoach(file: unknown, cd: ChuDeDb): KeHoach {
  const k: KeHoach = { vocab: [], moTa: [], ganNghia: [], ganNghiaSua: [], hoiThoai: null, loi: [] }
  const bao = (duong_dan: string, thong_diep: string) => k.loi.push({ duong_dan, thong_diep })
  if (!laObject(file) || !Array.isArray(file['vocab'])) {
    bao('(gốc)', 'File phải là object có mảng `vocab`.')
    return k
  }

  const tuDb = new Map(cd.tu.map((t) => [t.word, t]))
  const daKhai = new Set<string>()
  file['vocab'].forEach((v, i) => {
    const g = `vocab[${i}]`
    if (!laObject(v)) return bao(g, 'Phải là object.')
    const word = v['word']
    const t = typeof word === 'string' ? tuDb.get(word) : undefined
    if (!t) return bao(`${g}.word`, `Từ ${JSON.stringify(word)} không thuộc chủ đề.`)
    if (daKhai.has(t.word)) return bao(`${g}.word`, `Từ '${t.word}' khai 2 lần.`)
    daKhai.add(t.word)

    // 1) 5 cột phụ — chỉ ghi field khác DB
    const thay: Partial<Record<CotPhu, string | null>> = {}
    for (const c of COT_PHU) {
      if (!(c in v)) { bao(`${g}.${c}`, 'Thiếu KEY (dùng null nếu không có).'); continue }
      const gt = v[c]
      if (COT_BAT_BUOC.includes(c) ? !coChu(gt) : gt !== null && typeof gt !== 'string') {
        bao(`${g}.${c}`, COT_BAT_BUOC.includes(c) ? 'Phải là chuỗi không rỗng.' : 'Phải là chuỗi hoặc null.')
        continue
      }
      const moi = typeof gt === 'string' && gt.trim() === '' ? null : (gt as string | null)
      if (moi !== t[c]) thay[c] = moi
    }
    if (Object.keys(thay).length > 0) k.vocab.push({ id: t.id, thay })

    // 2) Định nghĩa tiếng Anh cho select_on_describe — không được lộ nghĩa phụ
    const moTa = cd.moTa.find((m) => m.vocab_id === t.id)
    const desc = v['description']
    if (!coChu(desc)) bao(`${g}.description`, 'Phải là chuỗi không rỗng.')
    else if (coChu(v['secondary_word']) && chuaNghiaPhu(desc, v['secondary_word'])) bao(`${g}.description`, 'Lộ đáp án: chứa nghĩa phụ.')
    else if (desc.includes(t.word)) bao(`${g}.description`, 'Lộ đáp án: chứa chính từ đang ôn.')
    else if (!moTa) bao(g, 'Từ không có bài select_on_describe trong DB.')
    else if (moTa.payload['description'] !== desc) k.moTa.push({ id: moTa.id, payload: { ...moTa.payload, description: desc } })

    // 3) near_synonym — 1 bài/từ, kiểm bằng luật của importValidate
    const pl = v['near_synonym']
    const loiNs = [...kiemPayload('near_synonym', pl, `${g}.near_synonym`, () => null), ...kiemNhieuGanNghia(pl, t.word, `${g}.near_synonym`)]
    if (laObject(pl) && typeof pl['sentence'] === 'string' && pl['sentence'].includes(t.word)) {
      loiNs.push({ duong_dan: `${g}.near_synonym.sentence`, thong_diep: 'Câu chứa sẵn đáp án.' })
    }
    if (loiNs.length > 0) k.loi.push(...loiNs)
    else if (laObject(pl)) {
      const co = cd.ganNghiaCo.find((g) => g.vocab_id === t.id)
      if (!co) k.ganNghia.push({ vocab_id: t.id, type: 'near_synonym', payload: pl })
      else if (!giongNhau(co.payload, pl)) k.ganNghiaSua.push({ id: co.id, payload: pl })
    }
  })
  for (const t of cd.tu) if (!daKhai.has(t.word)) bao('vocab', `Thiếu từ '${t.word}' của chủ đề.`)

  // 4) Câu phụ hội thoại — đúng số dòng DB, giữ mọi khoá cũ
  const phu = Array.isArray(file['dialogue_secondary']) ? file['dialogue_secondary'] : []
  const lines = cd.hoiThoai?.content.lines ?? []
  if (phu.length !== lines.length) {
    bao('dialogue_secondary', `Phải có đúng ${lines.length} câu (khớp số dòng hội thoại trong DB), đang có ${phu.length}.`)
  } else if (phu.some((c) => !coChu(c))) {
    bao('dialogue_secondary', 'Mọi câu phải là chuỗi không rỗng.')
  } else if (cd.hoiThoai && lines.some((l, i) => l['text_secondary'] !== phu[i])) {
    k.hoiThoai = { id: cd.hoiThoai.id, content: { ...cd.hoiThoai.content, lines: lines.map((l, i) => ({ ...l, text_secondary: phu[i] })) } }
  }
  return k
}
