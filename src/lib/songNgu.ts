/**
 * songNgu.ts — từ vựng PHỤ (M26): Trung ↔ Anh. HÀM THUẦN, 0 import.
 * `secondary_word` ghi nhiều nghĩa ngăn bằng "; " — nghĩa ĐẦU là nghĩa chính (Design.m26.md §2.1).
 */
export type Lang = 'zh' | 'en'

/** Ngôn ngữ của từ phụ SUY RA từ từ chính — không lưu cột riêng. */
export function ngonNguPhu(lang: Lang): Lang {
  return lang === 'zh' ? 'en' : 'zh'
}

/** "review; revise" → ['review', 'revise']. null/rỗng → []. */
export function tachNghiaPhu(s: string | null | undefined): string[] {
  return (s ?? '').split(';').map((x) => x.trim()).filter(Boolean)
}

/** Hiển thị gọn trên thẻ: "review · revise". */
export function hienNghiaPhu(s: string | null | undefined): string {
  return tachNghiaPhu(s).join(' · ')
}

/** Nhãn chip ngôn ngữ phụ trên Flashcard. */
export function nhanNgonNguPhu(lang: Lang): 'EN' | '中' {
  return lang === 'zh' ? 'EN' : '中'
}

/**
 * M26c — nhãn cột phải màn Ghép cặp: nghĩa ĐẦU của từ phụ; thiếu ⇒ nghĩa Việt.
 * Nhãn trùng nhau trong cùng phiên (không phân biệt hoa/thường) ⇒ CHỈ các ô trùng thêm "(nghĩa Việt)" —
 * hiện sẵn nghĩa Việt cho mọi ô là lộ đáp án (Design.m26.md §4).
 */
export function nhanGhepCap(
  ds: readonly { id: string; meaning_vi: string; secondary_word: string | null }[],
): Record<string, string> {
  const goc = ds.map((t) => {
    const dau = tachNghiaPhu(t.secondary_word)[0]
    return { id: t.id, vi: t.meaning_vi, nhan: dau ?? t.meaning_vi, coPhu: dau !== undefined }
  })
  const dem = new Map<string, number>()
  for (const g of goc) dem.set(g.nhan.toLowerCase(), (dem.get(g.nhan.toLowerCase()) ?? 0) + 1)
  return Object.fromEntries(
    goc.map((g) => [g.id, g.coPhu && (dem.get(g.nhan.toLowerCase()) ?? 0) > 1 ? `${g.nhan} (${g.vi})` : g.nhan]),
  )
}

type TuDe = {
  lang: Lang
  meaning_vi: string
  secondary_word: string | null
  collocation_meaning_vi: string | null
  secondary_collocation: string | null
}

/** M26c — đề màn điền từ: có phần phụ ⇒ ra đề bằng NGÔN NGỮ PHỤ (dòng to) + nghĩa Việt (dòng nhỏ); thiếu ⇒ bản cũ. */
export function deDienTu(
  cheDo: 'translate' | 'trans_collocation',
  t: TuDe,
): { chinh: string; langChinh: Lang | 'vi'; nho: string } {
  if (cheDo === 'trans_collocation') {
    const vi = t.collocation_meaning_vi ?? t.meaning_vi
    const phu = t.secondary_collocation?.trim()
    return phu
      ? { chinh: phu, langChinh: ngonNguPhu(t.lang), nho: `${vi} · Nhập cụm từ` }
      : { chinh: vi, langChinh: 'vi', nho: 'Nhập cụm từ' }
  }
  const nhap = t.lang === 'zh' ? 'Nhập từ tiếng Trung' : 'Nhập từ tiếng Anh'
  const phu = hienNghiaPhu(t.secondary_word)
  return phu
    ? { chinh: phu, langChinh: ngonNguPhu(t.lang), nho: `${t.meaning_vi} · ${nhap}` }
    : { chinh: t.meaning_vi, langChinh: 'vi', nho: nhap }
}

/**
 * M26d — bảng so sánh màn "Phân biệt từ gần nghĩa" sau khi chọn đúng: 1 hàng/ô, THEO THỨ TỰ Ô ĐÃ HIỆN
 * (Design.m26.md §5). Hàng đáp án lấy pinyin/từ phụ của `vocab` + `answer_note_vi` (payload không lặp đáp án — DEC-22).
 */
export function bangGanNghia(
  v: { word: string; pinyin: string | null; secondary_word: string | null },
  p: {
    answer_note_vi?: string | null
    distractors: readonly { word: string; pinyin?: string | null; secondary?: string | null; note_vi?: string | null }[]
  },
  thuTu: readonly string[],
): { word: string; pinyin: string; secondary: string; note: string; dung: boolean }[] {
  const dong = new Map(
    p.distractors.map((d) => [
      d.word,
      { word: d.word, pinyin: d.pinyin ?? '', secondary: hienNghiaPhu(d.secondary), note: d.note_vi ?? '', dung: false },
    ]),
  )
  dong.set(v.word, {
    word: v.word, pinyin: v.pinyin ?? '', secondary: hienNghiaPhu(v.secondary_word), note: p.answer_note_vi ?? '', dung: true,
  })
  return thuTu.flatMap((w) => dong.get(w) ?? [])
}
