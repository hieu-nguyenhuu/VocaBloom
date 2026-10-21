/**
 * ĐÓNG BĂNG LỊCH ÔN (M33, design.m33.md). Hàm thuần — không React, không Supabase.
 *
 * `dong_bang_luc` (bảng settings) = null ⇒ bình thường; chuỗi timestamp ⇒ đang đóng băng từ lúc đó.
 * Mô hình "chặn dòng chảy vào, giữ phần tồn đọng": khi đóng băng từ ngày F, từ đến hạn là từ có
 * `next_review_date ≤ F` (tồn đọng). Từ có hạn > F — gồm cả từ vừa lên stage trong lúc đóng băng —
 * tự ẩn cho tới khi mở băng. MỌI truy vấn "đến hạn" ở client phải dùng `ngayHieuLuc`, không dùng thẳng hôm nay.
 */
import { homNayVN } from './player.ts'

/** Ngày VN (yyyy-mm-dd) bắt đầu đóng băng; null nếu không đóng băng hoặc giá trị hỏng. */
export function ngayDongBang(dongBangLuc: string | null): string | null {
  if (!dongBangLuc) return null
  const t = new Date(dongBangLuc)
  return Number.isNaN(t.getTime()) ? null : homNayVN(t)
}

/** Ngày dùng để so `next_review_date ≤ ...` khi lấy từ đến hạn. */
export function ngayHieuLuc(homNay: string, dongBangLuc: string | null): string {
  const f = ngayDongBang(dongBangLuc)
  return f !== null && f < homNay ? f : homNay
}

/** Số ngày đã đóng băng tính theo ngày VN (= số ngày sẽ dời hạn khi mở băng). */
export function soNgayDongBang(homNay: string, dongBangLuc: string | null): number {
  const f = ngayDongBang(dongBangLuc)
  if (f === null) return 0
  const ms = Date.parse(`${homNay}T00:00:00Z`) - Date.parse(`${f}T00:00:00Z`)
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** "2026-10-21" → "21/10" (bỏ số 0 đầu, như `dinhDangNgayVN`). */
export function ngayThang(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d}/${m}`
}

/** Dòng ghi chú dưới công tắc "Ôn tập hằng ngày" ở Cài đặt. */
export function moTaDongBang(homNay: string, dongBangLuc: string | null): string {
  const f = ngayDongBang(dongBangLuc)
  if (f === null) return 'Tắt khi từ quá hạn dồn nhiều: chỉ còn từ tồn đọng, không thêm từ mới, không trừ điểm.'
  const n = soNgayDongBang(homNay, dongBangLuc)
  if (n === 0) return `Đang đóng băng từ hôm nay (${ngayThang(f)}). Bật lại trong hôm nay thì không dời hạn từ nào.`
  return `Đang đóng băng từ ${ngayThang(f)} (${n} ngày). Bật lại: từ bị giữ sẽ dời hạn thêm ${n} ngày.`
}
