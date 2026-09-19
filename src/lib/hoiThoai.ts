/**
 * Logic thuần cho màn HỘI THOẠI KẾT THÚC của chế độ ôn theo chủ đề (M7, mockup 11).
 * Không React, không Supabase.
 */

export type DongHoiThoai = {
  speaker: string
  text: string
  pinyin: string
  nghia: string
  /** Chữ của các từ vựng cần bôi đậm trong câu (đã đổi từ `highlight_vocab_ids`). */
  tu_dam: string[]
}

type DongThô = {
  speaker?: unknown
  text_zh?: unknown
  pinyin?: unknown
  text_vi?: unknown
  highlight_vocab_ids?: unknown
}

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '')

/**
 * Đọc `topic_dialogues.content`. Dữ liệu thật có cả dòng `highlight_vocab_ids` rỗng lẫn có dữ liệu,
 * và topic tiếng Anh có `pinyin` rỗng ⇒ mọi trường đều phải chịu được thiếu.
 */
export function docHoiThoai(content: unknown, tenTu: Record<string, string>): DongHoiThoai[] {
  const lines = (content as { lines?: unknown } | null)?.lines
  if (!Array.isArray(lines)) return []
  return lines.map((l) => {
    const d = l as DongThô
    const ids = Array.isArray(d.highlight_vocab_ids) ? d.highlight_vocab_ids : []
    return {
      speaker: chuoi(d.speaker),
      text: chuoi(d.text_zh),
      pinyin: chuoi(d.pinyin),
      nghia: chuoi(d.text_vi),
      // Từ có thể đã bị xoá khỏi `vocab` ⇒ lọc bỏ id không tra được
      tu_dam: ids.map((id) => tenTu[String(id)]).filter((w): w is string => Boolean(w)),
    }
  })
}

const LATIN = /^[A-Za-z]+$/
const laChu = (c: string | undefined) => c !== undefined && /[A-Za-z]/.test(c)

/**
 * Cắt câu thành các đoạn đậm/thường để bôi đậm từ vựng (mockup 11 in đậm màu accent).
 * Quét trái→phải, ưu tiên từ DÀI NHẤT để không bôi lồng nhau ("好吃" thắng "吃").
 * Từ thuần Latin phải khớp trọn tiếng — "teach" KHÔNG được bôi trong "teacher".
 */
export function chiaDam(text: string, tuDam: readonly string[]): { text: string; dam: boolean }[] {
  const ds = [...new Set(tuDam.filter(Boolean))].sort((a, b) => b.length - a.length)
  if (ds.length === 0 || text === '') return [{ text, dam: false }]

  const phan: { text: string; dam: boolean }[] = []
  let dem = ''
  let i = 0
  while (i < text.length) {
    const khop = ds.find((w) => {
      if (!text.startsWith(w, i)) return false
      if (!LATIN.test(w)) return true
      return !laChu(text[i - 1]) && !laChu(text[i + w.length]) // ranh giới tiếng
    })
    if (khop) {
      if (dem !== '') {
        phan.push({ text: dem, dam: false })
        dem = ''
      }
      phan.push({ text: khop, dam: true })
      i += khop.length
    } else {
      dem += text[i]
      i += 1
    }
  }
  if (dem !== '') phan.push({ text: dem, dam: false })
  return phan
}
