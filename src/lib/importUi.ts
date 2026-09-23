import { validateImportFile, type KetQuaValidate, type ViTri } from './importValidate.ts'

/**
 * Logic thuần cho màn Import (M2b). Không React, không Supabase — component chỉ dispatch.
 * Validator (`importValidate.ts`) và RPC `import_topic` tái dùng nguyên, không lặp luật ở đây.
 */

export type KetQuaDoc = KetQuaValidate & { du_lieu: unknown }

/** File JSON lớn hơn mức này bị từ chối ngay, không đọc. */
export const GIOI_HAN_BYTES = 5 * 1024 * 1024

const TOM_TAT_RONG = { ten_topic: '', so_tu: 0, so_bai_tap: 0, so_dong_hoi_thoai: 0, so_ngu_phap: 0 }

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

// ── State machine màn Import — NHIỀU FILE (M12/Q4, DESIGN.md §5.3) ────────
//
// M2b chỉ mô hình hoá ĐÚNG 1 file. M12 tổng quát hoá thành DANH SÁCH file (N=1 là
// trường hợp riêng). Mỗi file có trạng thái độc lập: 1 file hỏng KHÔNG kéo đổ file khác —
// mỗi file là 1 transaction riêng ở phía DB (RPC `import_topic`).

export type TomTat = KetQuaValidate['tom_tat']
export type KetQuaRpc = {
  topic_id: string
  so_tu: number
  so_bai_tap: number
  so_dong_hoi_thoai: number
  /** M12 — số mục ngữ pháp chủ đề đã ghi; RPC cũ chưa có field này nên có thể undefined. */
  so_ngu_phap?: number
}

type HoSoFile = { du_lieu: unknown; tom_tat: TomTat; canh_bao: string[] }

export type TrangThaiFile =
  | { tt: 'loi'; loi: ViTri[] }
  | ({ tt: 'san_sang' | 'dang_import' } & HoSoFile)
  | ({ tt: 'that_bai'; loi: string } & HoSoFile)
  | { tt: 'xong'; tom_tat: TomTat; ket_qua: KetQuaRpc }

export type MucFile = { ten_file: string; kich_thuoc: number } & TrangThaiFile

export type TrangThaiImport =
  | { buoc: 'chon_file' }
  | { buoc: 'preview'; ds: MucFile[] }
  | { buoc: 'dang_import'; ds: MucFile[] }
  | { buoc: 'ket_qua'; ds: MucFile[] }

export type HanhDong =
  | { loai: 'chon'; ds: { ten_file: string; kich_thuoc: number; ket_qua: KetQuaDoc }[] }
  | { loai: 'them_canh_bao'; ten_file: string; dong: string[] }
  | { loai: 'bo_file'; ten_file: string }
  | { loai: 'xac_nhan' }
  | { loai: 'file_ok'; ten_file: string; ket_qua: KetQuaRpc }
  | { loai: 'file_loi'; ten_file: string; loi: string }
  | { loai: 'xong_het' }
  | { loai: 'chon_file_khac' }
  | { loai: 'thu_lai' }

const CHON_FILE: TrangThaiImport = { buoc: 'chon_file' }

/** Đếm số file đang ở một trạng thái. */
export function demTrangThai(ds: readonly MucFile[], tt: TrangThaiFile['tt']): number {
  return ds.filter((m) => m.tt === tt).length
}

/** Cộng dồn số liệu THẬT của các file đã import xong (lấy từ RPC, không lấy từ file — MB-18). */
export function tongKetMe(ds: readonly MucFile[]): {
  so_file_ok: number
  so_file_loi: number
  so_tu: number
  so_bai_tap: number
  so_dong_hoi_thoai: number
  so_ngu_phap: number
} {
  const kq = { so_file_ok: 0, so_file_loi: 0, so_tu: 0, so_bai_tap: 0, so_dong_hoi_thoai: 0, so_ngu_phap: 0 }
  for (const m of ds) {
    if (m.tt === 'xong') {
      kq.so_file_ok += 1
      kq.so_tu += m.ket_qua.so_tu
      kq.so_bai_tap += m.ket_qua.so_bai_tap
      kq.so_dong_hoi_thoai += m.ket_qua.so_dong_hoi_thoai
      kq.so_ngu_phap += m.ket_qua.so_ngu_phap ?? 0
    } else if (m.tt === 'loi' || m.tt === 'that_bai') {
      kq.so_file_loi += 1
    }
  }
  return kq
}

function hoSo(ket_qua: KetQuaDoc): HoSoFile {
  return {
    du_lieu: ket_qua.du_lieu,
    tom_tat: ket_qua.tom_tat,
    canh_bao: ket_qua.canh_bao.map((c) => `${c.duong_dan}: ${c.thong_diep}`),
  }
}

/** Đổi đúng 1 file theo tên; trả nguyên mảng nếu không đụng gì (giữ tham chiếu cũ). */
function suaFile(ds: MucFile[], ten_file: string, doi: (m: MucFile) => MucFile | null): MucFile[] {
  let thayDoi = false
  const moi = ds.map((m) => {
    if (m.ten_file !== ten_file) return m
    const kq = doi(m)
    if (kq === null || kq === m) return m
    thayDoi = true
    return kq
  })
  return thayDoi ? moi : ds
}

/** Hành động không hợp với bước hiện tại → trả nguyên state (cùng tham chiếu). */
export function giamTrangThai(s: TrangThaiImport, h: HanhDong): TrangThaiImport {
  switch (h.loai) {
    case 'chon': {
      if (h.ds.length === 0) return s
      const ds: MucFile[] = h.ds.map(({ ten_file, kich_thuoc, ket_qua }) =>
        ket_qua.hop_le
          ? { ten_file, kich_thuoc, tt: 'san_sang', ...hoSo(ket_qua) }
          : { ten_file, kich_thuoc, tt: 'loi', loi: ket_qua.loi },
      )
      return { buoc: 'preview', ds }
    }

    case 'them_canh_bao': {
      if (s.buoc !== 'preview') return s
      const ds = suaFile(s.ds, h.ten_file, (m) =>
        m.tt === 'san_sang' ? { ...m, canh_bao: [...m.canh_bao, ...h.dong] } : null,
      )
      return ds === s.ds ? s : { ...s, ds }
    }

    case 'bo_file': {
      if (s.buoc !== 'preview') return s
      const ds = s.ds.filter((m) => m.ten_file !== h.ten_file)
      if (ds.length === s.ds.length) return s
      return ds.length === 0 ? CHON_FILE : { ...s, ds }
    }

    case 'xac_nhan': {
      if (s.buoc !== 'preview' || demTrangThai(s.ds, 'san_sang') === 0) return s
      // File lỗi giữ nguyên trạng thái `loi` — chúng bị bỏ qua, không chặn cả mẻ (Q4).
      return {
        buoc: 'dang_import',
        ds: s.ds.map((m) => (m.tt === 'san_sang' ? { ...m, tt: 'dang_import' } : m)),
      }
    }

    case 'file_ok': {
      if (s.buoc !== 'dang_import') return s
      const ds = suaFile(s.ds, h.ten_file, (m) =>
        m.tt === 'dang_import'
          ? { ten_file: m.ten_file, kich_thuoc: m.kich_thuoc, tt: 'xong', tom_tat: m.tom_tat, ket_qua: h.ket_qua }
          : null,
      )
      return ds === s.ds ? s : { ...s, ds }
    }

    case 'file_loi': {
      if (s.buoc !== 'dang_import') return s
      const ds = suaFile(s.ds, h.ten_file, (m) =>
        m.tt === 'dang_import' ? { ...m, tt: 'that_bai', loi: h.loi } : null,
      )
      return ds === s.ds ? s : { ...s, ds }
    }

    case 'xong_het':
      return s.buoc === 'dang_import' ? { buoc: 'ket_qua', ds: s.ds } : s

    case 'thu_lai': {
      if (s.buoc !== 'ket_qua' || demTrangThai(s.ds, 'that_bai') === 0) return s
      return {
        buoc: 'dang_import',
        ds: s.ds.map((m) => {
          if (m.tt !== 'that_bai') return m
          const { loi: _bo, ...conLai } = m
          return { ...conLai, tt: 'dang_import' }
        }),
      }
    }

    case 'chon_file_khac':
      return s.buoc === 'chon_file' ? s : CHON_FILE
  }
}
