/**
 * boSungHoiThoai.ts — M23: thêm select_dialog/fill_dialog vào chủ đề ĐÃ CÓ trong DB.
 *
 * HÀM THUẦN (MB-05): không đọc file, không network. CLI `scripts/bo-sung-hoi-thoai.mjs` lo phần DB.
 * File bổ sung dùng `word` thay `temp_id` (từ đã có trong DB): `vocab_word` = từ A, `payload.blank_b_word` = từ B.
 * Payload kiểm bằng CHÍNH luật của `importValidate.ts` — không có bộ kiểm thứ 2.
 */
import { kiemPayload, type ViTri } from './importValidate.ts'

export type DangHoiThoai = 'select_dialog' | 'fill_dialog'
export type TuChuDe = { id: string; word: string }
export type BaiHoiThoai = { vocab_id: string; type: string; payload: Record<string, unknown> }
export type DongMoi = { vocab_id: string; type: DangHoiThoai; payload: Record<string, unknown> }

const DANG: readonly DangHoiThoai[] = ['select_dialog', 'fill_dialog']

function laObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

const soChoTrong = (x: unknown) => (typeof x === 'string' ? x.split('___').length - 1 : 0)

/** Khoá nhận diện 1 bài: cùng dạng + cùng cặp A/B + cùng câu A ⇒ coi là trùng (chạy lại an toàn). */
const khoaBai = (type: string, idA: string, idB: unknown, dialogA: unknown) => `${type}|${idA}|${String(idB)}|${String(dialogA)}`

/** Từ còn THIẾU từng dạng — vai A (`vocab_id`) hay vai B (`blank_b_vocab_id`) đều tính là có. */
export function phuSongHoiThoai(tu: TuChuDe[], bai: BaiHoiThoai[]): Record<DangHoiThoai, string[]> {
  const co: Record<DangHoiThoai, Set<string>> = { select_dialog: new Set(), fill_dialog: new Set() }
  for (const b of bai) {
    if (b.type !== 'select_dialog' && b.type !== 'fill_dialog') continue
    co[b.type].add(b.vocab_id)
    const idB = b.payload['blank_b_vocab_id']
    if (typeof idB === 'string') co[b.type].add(idB)
  }
  return {
    select_dialog: tu.filter((t) => !co.select_dialog.has(t.id)).map((t) => t.word),
    fill_dialog: tu.filter((t) => !co.fill_dialog.has(t.id)).map((t) => t.word),
  }
}

/**
 * Dịch file bổ sung thành dòng `exercises` sẵn sàng INSERT. Không ném: mọi vấn đề trả trong `loi`
 * (CLI thấy `loi` khác rỗng thì KHÔNG ghi gì). Bài trùng với DB/trong file ⇒ `bo_qua`.
 */
export function dichBaiBoSung(
  file: unknown,
  tu: TuChuDe[],
  baiDaCo: BaiHoiThoai[],
): { dong: DongMoi[]; bo_qua: string[]; loi: ViTri[] } {
  const dong: DongMoi[] = []
  const bo_qua: string[] = []
  const loi: ViTri[] = []
  const bao = (duong_dan: string, thong_diep: string) => loi.push({ duong_dan, thong_diep })

  const idCua = new Map<string, string>()
  for (const t of tu) {
    if (idCua.has(t.word)) bao('(chủ đề)', `Từ '${t.word}' xuất hiện 2 lần trong chủ đề — không biết trỏ vào bản nào.`)
    idCua.set(t.word, t.id)
  }
  const idsChuDe = new Set(tu.map((t) => t.id))

  if (!laObject(file) || !Array.isArray(file['exercises'])) {
    bao('(gốc)', 'File phải là object có mảng `exercises`.')
    return { dong, bo_qua, loi }
  }

  const daThay = new Set(baiDaCo.map((b) => khoaBai(b.type, b.vocab_id, b.payload['blank_b_vocab_id'], b.payload['dialog_a'])))

  file['exercises'].forEach((bai, i) => {
    const g = `exercises[${i}]`
    if (!laObject(bai)) return bao(g, 'Phải là object.')
    const kieu = bai['type']
    if (typeof kieu !== 'string' || !(DANG as readonly string[]).includes(kieu)) {
      return bao(`${g}.type`, `Chỉ nhận select_dialog / fill_dialog, đang là ${JSON.stringify(kieu)}.`)
    }
    const wordA = bai['vocab_word']
    const idA = typeof wordA === 'string' ? idCua.get(wordA) : undefined
    if (!idA) return bao(`${g}.vocab_word`, `Từ ${JSON.stringify(wordA)} không thuộc chủ đề.`)
    const goc = bai['payload']
    if (!laObject(goc)) return bao(`${g}.payload`, 'Phải là object.')

    const { blank_b_word: wordB, ...conLai } = goc
    const idB = typeof wordB === 'string' ? idCua.get(wordB) : undefined
    if (!idB) return bao(`${g}.payload.blank_b_word`, `Từ ${JSON.stringify(wordB)} không thuộc chủ đề.`)
    const payload: Record<string, unknown> = { ...conLai, blank_b_vocab_id: idB }

    const loiBai = kiemPayload(kieu, payload, g, (gt) => {
      if (typeof gt !== 'string' || !idsChuDe.has(gt)) return 'Từ B không thuộc chủ đề.'
      return gt === idA ? 'Trỏ về chính từ A — bài 2 từ phải là 2 từ KHÁC nhau.' : null
    })
    // Quy ước chỗ trống (MB-29/Q5): mỗi câu ĐÚNG 1 `___`, chỗ trống A ở câu A, B ở câu B
    for (const truong of ['dialog_a', 'dialog_b'] as const) {
      if (soChoTrong(payload[truong]) !== 1) loiBai.push({ duong_dan: `${g}.payload.${truong}`, thong_diep: 'Phải có ĐÚNG 1 chỗ trống ___.' })
    }
    if (payload['blank_a_answer'] !== wordA) {
      loiBai.push({ duong_dan: `${g}.payload.blank_a_answer`, thong_diep: `Phải bằng từ A '${wordA}'.` })
    }
    if (loiBai.length > 0) return loi.push(...loiBai)

    const khoa = khoaBai(kieu, idA, idB, payload['dialog_a'])
    if (daThay.has(khoa)) return bo_qua.push(`${kieu} ${wordA}+${wordB}`)
    daThay.add(khoa)
    dong.push({ vocab_id: idA, type: kieu as DangHoiThoai, payload })
  })

  return { dong, bo_qua, loi }
}
