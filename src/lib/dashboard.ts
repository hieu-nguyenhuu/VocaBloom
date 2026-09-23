import { homNayVN } from './player.ts'
import type { Stage } from './srs.ts'

/**
 * Logic thuần của Dashboard (M6b). Chỉ import player.ts/srs.ts — không React, không Supabase,
 * không tự đọc đồng hồ (Date tiêm từ ngoài) để test được.
 */

/** Tên hiển thị ở lời chào — chốt M6b/Q1. App 1 người dùng nên để hằng số, không thêm key DB. */
export const TEN_NGUOI_DUNG = 'Helios'

const TZ = 'Asia/Ho_Chi_Minh'
const THU_DAY = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const

/** Giờ 0–23 theo VN. `hourCycle: 'h23'` để nửa đêm ra 0 chứ không ra 24. */
export function gioVN(now: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(now),
  )
}

export function loiChao(gio: number): string {
  if (gio < 11) return 'Chào buổi sáng'
  if (gio < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

const tach = (iso: string) => iso.split('-').map(Number) as [number, number, number]

function thuCua(iso: string): number {
  const [y, m, d] = tach(iso)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** "Thứ Năm, 16 tháng 7" — header mockup 01 (KHÁC `dinhDangNgayVN` của màn Tổng kết). */
export function ngayDayDu(iso: string): string {
  const [, m, d] = tach(iso)
  return `${THU_DAY[thuCua(iso)]}, ${d} tháng ${m}`
}

/** Lùi `n` ngày trên lịch (UTC thuần — VN không có DST nên không lệch). */
export function luiNgay(iso: string, n: number): string {
  const [y, m, d] = tach(iso)
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10)
}

/** Tập ngày (giờ VN) đã ôn, rút từ `review_log.reviewed_at`. */
export function ngayCoOn(rows: readonly { reviewed_at: string }[]): Set<string> {
  return new Set(rows.map((r) => homNayVN(new Date(r.reviewed_at))))
}

/**
 * Chuỗi ngày liên tiếp. Đếm lùi từ hôm nay; nếu hôm nay CHƯA ôn thì bắt đầu từ hôm qua —
 * chuỗi không bị coi là đứt chỉ vì trời mới sáng (chốt Brainstorm M6).
 */
export function tinhStreak(ngayCoLog: ReadonlySet<string>, homNay: string): number {
  let moc = ngayCoLog.has(homNay) ? homNay : luiNgay(homNay, 1)
  let n = 0
  while (ngayCoLog.has(moc)) {
    n += 1
    moc = luiNgay(moc, 1)
  }
  return n
}

export type ODai = {
  ngay: string
  thu: string
  /** "18/9" — M9/Q1: có số ngày thì mới thấy rõ đây là 7 ngày GẦN NHẤT, không phải tuần cố định. */
  ngayThang: string
  daOn: boolean
  laHomNay: boolean
  /** Số phút học trong ngày (0 nếu không học hoặc dòng log cũ chưa đo). */
  phut: number
}

/**
 * Cộng thời gian học theo ngày GIỜ VN. Dòng `review_log` cũ có `thoi_gian_ms = null` (trước M9)
 * ⇒ BỎ QUA, không bịa số cho quá khứ. Làm tròn LÊN để phiên ngắn không hiện "0 phút".
 */
export function gomPhutMoiNgay(
  rows: readonly { reviewed_at: string; thoi_gian_ms: number | null }[],
): Map<string, number> {
  const ms = new Map<string, number>()
  for (const r of rows) {
    if (typeof r.thoi_gian_ms !== 'number' || r.thoi_gian_ms <= 0) continue
    const ngay = homNayVN(new Date(r.reviewed_at))
    ms.set(ngay, (ms.get(ngay) ?? 0) + r.thoi_gian_ms)
  }
  return new Map([...ms].map(([ngay, tong]) => [ngay, Math.ceil(tong / 60_000)]))
}

export type DongNhatKy = { ngay: string; thoi_gian_ms: number | null }

/**
 * M14 — gộp NHẬT KÝ NGÀY (bảng `nhat_ky_ngay`) với `review_log` của RIÊNG HÔM NAY.
 *
 * Vì sao phải có hàm này thay vì đọc thẳng `review_log` như trước:
 *   · `review_log.vocab_id` có `on delete cascade` ⇒ xoá từ là mất lịch sử học. Nhật ký không có
 *     khoá ngoại nào nên sống sót ⇒ QUÁ KHỨ phải đọc từ nhật ký.
 *   · Nhưng nhật ký chỉ được chốt khi kết thúc lượt, nên phiên ĐANG học dở chưa có trong đó
 *     ⇒ HÔM NAY hợp thêm từ `review_log` để streak nhảy lên ngay.
 *
 * Hôm nay có ở cả 2 nguồn thì lấy giá trị LỚN HƠN, KHÔNG cộng dồn: nhật ký đã bao gồm các lượt
 * trước trong ngày, cộng thêm là đếm trùng.
 *
 * Ngày có học nhưng mọi dòng `thoi_gian_ms = null` (dữ liệu trước M9) vẫn vào `ngayCoHoc` —
 * streak đếm theo SỰ TỒN TẠI của ngày, không theo số phút > 0.
 */
export function gopNhatKy(
  nhatKy: readonly DongNhatKy[],
  logHomNay: readonly { reviewed_at: string; thoi_gian_ms: number | null }[],
  homNay: string,
): { ngayCoHoc: Set<string>; phutMoiNgay: Map<string, number> } {
  const ngayCoHoc = new Set<string>()
  const phutMoiNgay = new Map<string, number>()

  for (const d of nhatKy) {
    ngayCoHoc.add(d.ngay)
    const phut = Math.ceil((d.thoi_gian_ms ?? 0) / 60_000)
    if (phut > 0) phutMoiNgay.set(d.ngay, phut)
  }

  // Chỉ lấy dòng CỦA HÔM NAY: quá khứ đã có nhật ký, và review_log quá khứ có thể đã bị xoá.
  const cuaHomNay = logHomNay.filter((r) => homNayVN(new Date(r.reviewed_at)) === homNay)
  if (cuaHomNay.length > 0) {
    ngayCoHoc.add(homNay)
    const phut = gomPhutMoiNgay(cuaHomNay).get(homNay) ?? 0
    const daCo = phutMoiNgay.get(homNay) ?? 0
    if (Math.max(phut, daCo) > 0) phutMoiNgay.set(homNay, Math.max(phut, daCo))
  }

  return { ngayCoHoc, phutMoiNgay }
}

/** 7 ngày gần nhất, phần tử cuối = hôm nay (chốt M6b/Q3 — hiện ở CẢ PC lẫn Mobile). */
export function dai7Ngay(
  ngayCoLog: ReadonlySet<string>,
  homNay: string,
  phutMoiNgay: ReadonlyMap<string, number> = new Map(),
): ODai[] {
  return Array.from({ length: 7 }, (_, i) => {
    const ngay = luiNgay(homNay, 6 - i)
    const [, m, d] = tach(ngay)
    return {
      ngay,
      thu: THU_NGAN[thuCua(ngay)]!,
      ngayThang: `${d}/${m}`,
      daOn: ngayCoLog.has(ngay),
      laHomNay: ngay === homNay,
      phut: phutMoiNgay.get(ngay) ?? 0,
    }
  })
}

export const THU_TU_STAGE = ['new', 'stage1', 'stage2', 'stage3', 'intensive', 'mastered'] as const

/** Đếm từ theo stage — LUÔN trả đủ 6 mục kể cả stage 0 từ (chốt M6b/Q2). */
export function gomKhuVuon(rows: readonly { stage: string }[]): { stage: Stage; so: number }[] {
  return THU_TU_STAGE.map((stage) => ({ stage, so: rows.filter((r) => r.stage === stage).length }))
}

/** Tách số từ đến hạn hôm nay / quá hạn. `next_review_date` NULL = hàng đợi từ mới, không tính. */
export function demDenHan(
  rows: readonly { next_review_date: string | null }[],
  homNay: string,
): { dungHan: number; quaHan: number; tong: number } {
  let dungHan = 0
  let quaHan = 0
  for (const r of rows) {
    if (!r.next_review_date) continue
    if (r.next_review_date < homNay) quaHan += 1
    else if (r.next_review_date === homNay) dungHan += 1
  }
  return { dungHan, quaHan, tong: dungHan + quaHan }
}
