import { validateImportFile, type KetQuaValidate, type ViTri } from './importValidate.ts'

/**
 * Logic thuần cho màn Import (M2b). Không React, không Supabase — component chỉ dispatch.
 * Validator (`importValidate.ts`) và RPC `import_topic` tái dùng nguyên, không lặp luật ở đây.
 */

export type KetQuaDoc = KetQuaValidate & { du_lieu: unknown }

/** File JSON lớn hơn mức này bị từ chối ngay, không đọc. */
export const GIOI_HAN_BYTES = 5 * 1024 * 1024

const TOM_TAT_RONG = { ten_topic: '', so_tu: 0, so_bai_tap: 0, so_dong_hoi_thoai: 0 }

/** Parse JSON rồi validate; lỗi cú pháp được gộp vào cùng dạng `loi[]` để UI hiển thị 1 kiểu. */
export function docFileImport(text: string): KetQuaDoc {
  let du_lieu: unknown
  try {
    du_lieu = JSON.parse(text)
  } catch (e) {
    const loi: ViTri[] = [
      { duong_dan: '(JSON)', thong_diep: `Không đọc được JSON: ${(e as Error).message}` },
    ]
    return { hop_le: false, loi, canh_bao: [], tom_tat: { ...TOM_TAT_RONG }, du_lieu: null }
  }
  return { ...validateImportFile(du_lieu), du_lieu }
}

/** Từ trong file đã có trong DB — unique, giữ thứ tự xuất hiện trong file. */
export function timTuTrung(tuFile: string[], tuDb: string[]): string[] {
  const db = new Set(tuDb)
  return [...new Set(tuFile.filter((w) => db.has(w)))]
}

export function dinhDangKB(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

type DauVaoCanhBao = {
  tuTrung: string[]
  topicTrung: number
  canhBaoValidator: ViTri[]
  khongKiemTraDuoc: boolean
  tenTopic?: string | undefined
}

/** Gộp mọi cảnh báo KHÔNG CHẶN (DEC-21, Q4 MB-14) thành các dòng cho 1 banner vàng. */
export function dongCanhBao(a: DauVaoCanhBao): string[] {
  const d: string[] = []
  if (a.tuTrung.length > 0) {
    const ds = a.tuTrung.map((w) => `"${w}"`).join(', ')
    d.push(
      `${a.tuTrung.length} từ trùng với dữ liệu hiện có (${ds}) — vẫn sẽ được thêm mới, không ghi đè.`,
    )
  }
  if (a.topicTrung > 0) {
    d.push(`Đã có topic tên "${a.tenTopic ?? ''}" — sẽ tạo thêm topic mới, không gộp.`)
  }
  for (const c of a.canhBaoValidator) d.push(`${c.duong_dan}: ${c.thong_diep}`)
  if (a.khongKiemTraDuoc) d.push('Không kiểm tra được từ trùng (mạng). Vẫn import được.')
  return d
}

/** Shape tối thiểu của PostgrestError / lỗi mạng — không import type để giữ file thuần. */
export type LoiImport = { message?: string | undefined; code?: string | undefined } | null | undefined

/**
 * `raise exception` trong `import_topic()` đã là tiếng Việt và chỉ đúng dòng gây lỗi (§10.4)
 * → giữ nguyên. Chỉ dịch lỗi mạng và lỗi rỗng.
 */
export function dichLoiImport(err: LoiImport): string {
  const m = err?.message ?? ''
  if (/fetch|network/i.test(m)) return 'Không kết nối được. Kiểm tra mạng rồi thử lại nhé.'
  if (m.trim()) return m
  return 'Có lỗi khi import. Thử lại sau nhé.'
}

// ── State machine màn Import (DESIGN.md §2.1) ─────────────────────────────

export type TomTat = KetQuaValidate['tom_tat']
export type KetQuaRpc = { topic_id: string; so_tu: number; so_bai_tap: number; so_dong_hoi_thoai: number }

type FileDaChon = { ten_file: string; kich_thuoc: number }
type FileHopLe = FileDaChon & { du_lieu: unknown; tom_tat: TomTat; canh_bao: string[] }

export type TrangThaiImport =
  | { buoc: 'chon_file' }
  | ({ buoc: 'loi_file'; loi: ViTri[] } & FileDaChon)
  | ({ buoc: 'preview' } & FileHopLe)
  | ({ buoc: 'dang_import' } & FileHopLe)
  | { buoc: 'ket_qua_ok'; ten_topic: string; ket_qua: KetQuaRpc }
  | ({ buoc: 'ket_qua_loi'; loi: string } & FileHopLe)

export type HanhDong =
  | ({ loai: 'chon'; ket_qua: KetQuaDoc } & FileDaChon)
  | { loai: 'them_canh_bao'; dong: string[] }
  | { loai: 'xac_nhan' }
  | { loai: 'huy' }
  | { loai: 'chon_file_khac' }
  | { loai: 'import_ok'; ket_qua: KetQuaRpc }
  | { loai: 'import_loi'; loi: string }
  | { loai: 'thu_lai' }

const CHON_FILE: TrangThaiImport = { buoc: 'chon_file' }

/** Hành động không hợp với bước hiện tại → trả nguyên state (cùng tham chiếu). */
export function giamTrangThai(s: TrangThaiImport, h: HanhDong): TrangThaiImport {
  switch (h.loai) {
    case 'chon': {
      const { ten_file, kich_thuoc, ket_qua } = h
      if (!ket_qua.hop_le) return { buoc: 'loi_file', ten_file, kich_thuoc, loi: ket_qua.loi }
      return {
        buoc: 'preview',
        ten_file,
        kich_thuoc,
        du_lieu: ket_qua.du_lieu,
        tom_tat: ket_qua.tom_tat,
        canh_bao: ket_qua.canh_bao.map((c) => `${c.duong_dan}: ${c.thong_diep}`),
      }
    }
    case 'them_canh_bao':
      return s.buoc === 'preview' ? { ...s, canh_bao: [...s.canh_bao, ...h.dong] } : s
    case 'huy':
    case 'chon_file_khac':
      return s.buoc === 'chon_file' ? s : CHON_FILE
    case 'xac_nhan':
      return s.buoc === 'preview' ? { ...s, buoc: 'dang_import' } : s
    case 'import_ok':
      return s.buoc === 'dang_import'
        ? { buoc: 'ket_qua_ok', ten_topic: s.tom_tat.ten_topic, ket_qua: h.ket_qua }
        : s
    case 'import_loi':
      return s.buoc === 'dang_import' ? { ...s, buoc: 'ket_qua_loi', loi: h.loi } : s
    case 'thu_lai': {
      if (s.buoc !== 'ket_qua_loi') return s
      const { loi: _bo, ...conLai } = s
      return { ...conLai, buoc: 'dang_import' }
    }
  }
}
