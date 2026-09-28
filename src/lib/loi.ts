/**
 * M19 — dịch lỗi TẢI/GHI dữ liệu sang câu tiếng Việt. Hàm thuần, 0 import.
 * CHỈ dịch các mẫu kỹ thuật đã biết; còn lại trả NGUYÊN VĂN vì `raise exception` trong SQL
 * (`va_ngay`, `xoa_chu_de`, `import_topic`) đã là tiếng Việt và đúng nguyên nhân (như `dichLoiImport`).
 * Nhận `unknown`: state các màn đang giữ `error.message` (chuỗi) ⇒ nhận diện theo CẢ message lẫn code.
 */
export const LOI_MANG = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.'
export const LOI_HET_PHIEN = 'Phiên đăng nhập đã hết hạn. Tải lại trang để đăng nhập lại nhé.'
export const LOI_QUYEN = 'Tài khoản không có quyền với dữ liệu này.'
export const LOI_CHUNG = 'Đã có lỗi không rõ nguyên nhân. Thử lại nhé.'

type LoiTho = { message?: unknown; code?: unknown; status?: unknown }

export function dichLoiTai(loi: unknown): string {
  const o: LoiTho =
    typeof loi === 'string' ? { message: loi } : typeof loi === 'object' && loi !== null ? (loi as LoiTho) : {}
  const msg = typeof o.message === 'string' ? o.message.trim() : ''
  const m = msg.toLowerCase()
  if (['failed to fetch', 'networkerror', 'load failed', 'fetch failed'].some((k) => m.includes(k))) return LOI_MANG
  if (o.code === 'PGRST301' || o.status === 401 || m.includes('jwt expired')) return LOI_HET_PHIEN
  if (o.code === '42501' || o.status === 403 || m.includes('permission denied')) return LOI_QUYEN
  return msg || LOI_CHUNG
}
