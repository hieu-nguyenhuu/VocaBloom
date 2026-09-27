/**
 * Âm thanh phản hồi (M17) — phần THUẦN: danh mục âm + đọc/ghi cài đặt + chọn âm.
 * Không React, không Supabase, không Web Audio (phần phát nằm ở `amThanh.ts`).
 *
 * 7 âm người dùng đã nghe thử và duyệt tại https://claude.ai/artifact/KjhHGwwJW3NVknLcT9AmdB.
 * Đã BỎ theo yêu cầu: "Lên giai đoạn" (làm phần đúng/sai quá phức tạp), "Thành thạo" và
 * "Nhận ruby" (màn Tổng kết chỉ cần 1 âm).
 *
 * Luật đơn giản đã chốt (M17/Q7): TẮT ÂM NÀO THÌ ÂM ĐÓ IM — không có âm thay thế, không có luật ngầm.
 */

export type MaAm = 'dung' | 'sai' | 'dung_goi_y' | 'hoan_thanh' | 'va_ngay' | 'ghep_cap' | 'lat_the'
export type NhomAm = 'tra_loi' | 'tong_ket' | 'phan_thuong' | 'tuong_tac'

export type MoTaAm = {
  ma: MaAm
  ten: string
  nhom: NhomAm
  /** Bật hay tắt khi người dùng chưa từng chỉnh. */
  macDinh: boolean
  /** Độ dài âm (ms) — test X1 dùng để canh âm dứt trước khi chuyển màn. */
  daiMs: number
}

export const DS_AM: readonly MoTaAm[] = [
  { ma: 'dung', ten: 'Trả lời đúng', nhom: 'tra_loi', macDinh: true, daiMs: 300 },
  { ma: 'sai', ten: 'Trả lời sai', nhom: 'tra_loi', macDinh: true, daiMs: 360 },
  { ma: 'dung_goi_y', ten: 'Đúng nhưng đã dùng gợi ý', nhom: 'tra_loi', macDinh: true, daiMs: 220 },
  { ma: 'hoan_thanh', ten: 'Hoàn thành lượt ôn', nhom: 'tong_ket', macDinh: true, daiMs: 900 },
  { ma: 'va_ngay', ten: 'Vá ngày bằng ruby', nhom: 'phan_thuong', macDinh: true, daiMs: 370 },
  { ma: 'ghep_cap', ten: 'Ghép đúng 1 cặp', nhom: 'tuong_tac', macDinh: true, daiMs: 60 },
  // Mặc định TẮT: ngay sau khi lật thẻ, người học thường muốn nghe phát âm của từ
  { ma: 'lat_the', ten: 'Lật flashcard', nhom: 'tuong_tac', macDinh: false, daiMs: 160 },
]

export const TEN_NHOM: Record<NhomAm, string> = {
  tra_loi: 'Khi trả lời',
  tong_ket: 'Màn Tổng kết',
  phan_thuong: 'Phần thưởng',
  tuong_tac: 'Tương tác nhỏ',
}

/** Khoá localStorage — lưu THEO TỪNG THIẾT BỊ (M17/Q5), giống lựa chọn giao diện (M16). */
export const KHOA_LUU_AM = 'vb-am-thanh'
export const AM_LUONG_MAC_DINH = 60

/**
 * Khoảng chờ trước khi màn bài tập chuyển màn (ms). Chép từ `setTimeout(..., dung ? 600 : 1000)`
 * trong TracNghiem / DienTu / SapXep / HoiThoai — test X2 canh 2 nơi khớp nhau.
 */
export const KHOANG_CHO_DUNG_MS = 600
export const KHOANG_CHO_SAI_MS = 1000

export type CaiDatAmThanh = {
  /** Công tắc tổng. Tắt thì mọi âm im, nhưng `tung` vẫn giữ nguyên để bật lại là như cũ. */
  bat: boolean
  /** 0–100. */
  amLuong: number
  tung: Record<MaAm, boolean>
}

export function macDinhAmThanh(): CaiDatAmThanh {
  return {
    bat: true,
    amLuong: AM_LUONG_MAC_DINH,
    tung: Object.fromEntries(DS_AM.map((a) => [a.ma, a.macDinh])) as Record<MaAm, boolean>,
  }
}

function laObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

/**
 * Đọc cài đặt từ chuỗi localStorage. Mọi thứ lạ đều rơi về mặc định, KHÔNG ném.
 * Âm thiếu (vd. danh mục thêm âm mới sau này) ⇒ tự điền giá trị mặc định của âm đó.
 */
export function docCaiDatAmThanh(raw: string | null): CaiDatAmThanh {
  const md = macDinhAmThanh()
  if (!raw) return md

  let goc: unknown
  try {
    goc = JSON.parse(raw)
  } catch {
    return md
  }
  if (!laObject(goc)) return md

  const amLuong =
    typeof goc['amLuong'] === 'number' && Number.isFinite(goc['amLuong'])
      ? Math.min(100, Math.max(0, Math.round(goc['amLuong'])))
      : md.amLuong

  const tungGoc = laObject(goc['tung']) ? goc['tung'] : {}
  const tung = { ...md.tung }
  for (const a of DS_AM) {
    const v = tungGoc[a.ma]
    if (typeof v === 'boolean') tung[a.ma] = v
  }

  return { bat: typeof goc['bat'] === 'boolean' ? goc['bat'] : md.bat, amLuong, tung }
}

export function ghiCaiDatAmThanh(cd: CaiDatAmThanh): string {
  return JSON.stringify(cd)
}

/** Âm cho 1 lần chấm bài. Sai thì không phân biệt có dùng gợi ý hay không. */
export function amKhiCham(dung: boolean, goiY: boolean): MaAm {
  if (!dung) return 'sai'
  return goiY ? 'dung_goi_y' : 'dung'
}

/** Âm này có được phát không. Luật M17/Q7: tắt âm nào thì đúng âm đó im. */
export function duocPhat(ma: MaAm, cd: CaiDatAmThanh): boolean {
  return cd.bat && cd.amLuong > 0 && cd.tung[ma] === true
}
