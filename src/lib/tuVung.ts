/**
 * Logic thuần của màn Quản lý từ vựng (M8). Không React, không Supabase.
 *
 * Chỉ 8 field cơ bản được sửa (`UI_DESIGN` §8.4) — payload 17 dạng bài KHÔNG sửa được ở đây,
 * muốn đổi bài tập thì import file mới.
 */

import type { Stage } from './srs.ts'

/** Nhãn tiếng Việt cho 6 stage — ẩn dụ cây (productContext §3.5). */
export const NHAN_STAGE: Record<Stage, string> = {
  new: 'Hạt giống',
  stage1: 'Mầm',
  stage2: 'Chồi',
  stage3: 'Lá',
  intensive: 'Hoa',
  mastered: 'Quả',
}

/** Lọc danh sách từ theo stage; `'tat-ca'` giữ nguyên. Từ chưa có `word_state` không khớp stage nào. */
export function locTheoStage<T extends { stage?: Stage }>(ds: readonly T[], stage: Stage | 'tat-ca'): T[] {
  return stage === 'tat-ca' ? [...ds] : ds.filter((t) => t.stage === stage)
}

export type DongTu = {
  id: string
  word: string
  pinyin: string | null
  meaning_vi: string
  lang: 'zh' | 'en'
  collocation: string | null
  collocation_pinyin: string | null
  collocation_meaning_vi: string | null
  example_sentence: string | null
  example_meaning_vi: string | null
  audio_url: string | null
  /** Ghép từ `word_state` khi hiển thị danh sách (M10) — không phải cột của bảng `vocab`. */
  stage?: Stage
}

export const FIELD_SUA = [
  'word',
  'pinyin',
  'meaning_vi',
  'collocation',
  'collocation_pinyin',
  'collocation_meaning_vi',
  'example_sentence',
  'example_meaning_vi',
] as const

export type FieldSua = (typeof FIELD_SUA)[number]

/** Bỏ dấu tiếng Việt lẫn dấu thanh pinyin, hạ chữ thường — dùng cho ô tìm kiếm. */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/** Lọc phía client (chỉ vài chục từ): khớp chữ / pinyin / nghĩa tiếng Việt. */
export function locTu(ds: readonly DongTu[], tuKhoa: string): DongTu[] {
  const k = boDau(tuKhoa.trim())
  if (k === '') return [...ds]
  return ds.filter((t) => [t.word, t.pinyin ?? '', t.meaning_vi].some((x) => boDau(x).includes(k)))
}

/** Nhãn ô đầu của form — DB đang có cả từ `zh` lẫn `en`. */
export function nhanTu(lang: 'zh' | 'en'): string {
  return lang === 'zh' ? 'Từ (Hán tự)' : 'Từ (tiếng Anh)'
}

export function kiemTraFormTu(f: Partial<DongTu>): string | null {
  if (!(f.word ?? '').trim()) return 'Chưa nhập từ'
  if (!(f.meaning_vi ?? '').trim()) return 'Chưa nhập nghĩa tiếng Việt'
  return null
}

/**
 * Đổi chữ ⇒ phải xoá `audio_url`: M6c đặt tên file theo `hash(word‖lang‖voice)` nên file cũ đọc
 * chữ CŨ; không xoá thì nút loa phát sai vĩnh viễn.
 */
export function canXoaAudio(cu: string, moi: string): boolean {
  return cu.trim() !== moi.trim()
}

/** Chỉ trả về field THỰC SỰ đổi (ô trống ⇒ `null`, không phải chuỗi rỗng). */
export function docThayDoi(cu: DongTu, moi: Partial<DongTu>): Partial<Record<FieldSua, string | null>> {
  const thay: Partial<Record<FieldSua, string | null>> = {}
  for (const k of FIELD_SUA) {
    if (!(k in moi)) continue
    const v = (moi[k] ?? '').trim()
    const goc = (cu[k] ?? '').trim()
    if (v === goc) continue
    // `word` và `meaning_vi` là NOT NULL trong schema §2 ⇒ không bao giờ ghi null cho 2 cột này
    thay[k] = v === '' && k !== 'word' && k !== 'meaning_vi' ? null : v
  }
  return thay
}
