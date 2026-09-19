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

export type ODai = { ngay: string; thu: string; daOn: boolean; laHomNay: boolean }

/** 7 ngày gần nhất, phần tử cuối = hôm nay (chốt M6b/Q3 — hiện ở CẢ PC lẫn Mobile). */
export function dai7Ngay(ngayCoLog: ReadonlySet<string>, homNay: string): ODai[] {
  return Array.from({ length: 7 }, (_, i) => {
    const ngay = luiNgay(homNay, 6 - i)
    return {
      ngay,
      thu: THU_NGAN[thuCua(ngay)]!,
      daOn: ngayCoLog.has(ngay),
      laHomNay: ngay === homNay,
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
