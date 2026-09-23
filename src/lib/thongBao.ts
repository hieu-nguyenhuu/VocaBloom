/**
 * Thông báo trong app (§5.2, DEC-16). Hiện chỉ có `type = 'low_queue'` do cron
 * `run_daily_maintenance()` sinh khi hàng đợi từ mới sắp cạn. THUẦN: không đọc DB ở đây.
 */
export type TinDb = {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

/** "2 giờ trước" theo mockup 18. `bayGio` truyền vào để test được, không đọc đồng hồ bên trong. */
export function thoiGianTuongDoi(iso: string, bayGio: Date): string {
  const giay = Math.max(0, Math.floor((bayGio.getTime() - new Date(iso).getTime()) / 1000))
  if (giay < 60) return 'vừa xong'
  const phut = Math.floor(giay / 60)
  if (phut < 60) return `${phut} phút trước`
  const gio = Math.floor(phut / 60)
  if (gio < 24) return `${gio} giờ trước`
  const ngay = Math.floor(gio / 24)
  if (ngay < 7) return `${ngay} ngày trước`
  const tuan = Math.floor(ngay / 7)
  if (tuan < 5) return `${tuan} tuần trước`
  return `${Math.floor(ngay / 30)} tháng trước`
}

export function demChuaDoc(ds: TinDb[]): number {
  return ds.filter((t) => !t.is_read).length
}

/** Số tin ĐÃ đọc — dùng cho nút "Xoá đã đọc (N)" (M9). */
export function demDaDoc(rows: readonly { is_read: boolean }[]): number {
  return rows.filter((r) => r.is_read).length
}
