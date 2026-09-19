/**
 * Logic Đăng nhập thuần — 0 import React/Supabase (giống srs.ts) để test được.
 * UI chỉ gọi 2 hàm này; mọi câu chữ hiện cho người dùng nằm ở đây.
 */
export type KetQuaForm = { ok: true } | { ok: false; loi: string }

const MAU_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Validate phía client trước khi gọi mạng — tránh request vô ích. */
export function kiemTraFormDangNhap(email: string, matKhau: string): KetQuaForm {
  const e = email.trim()
  if (!e) return { ok: false, loi: 'Nhập email nhé.' }
  if (!MAU_EMAIL.test(e)) return { ok: false, loi: 'Email chưa đúng định dạng.' }
  if (!matKhau) return { ok: false, loi: 'Nhập mật khẩu nhé.' }
  return { ok: true }
}

/** Shape tối thiểu của AuthError (supabase-js) — không import type để giữ file thuần. */
export type LoiDangNhap =
  | { message?: string | undefined; status?: number | undefined }
  | null
  | undefined

/** Map lỗi Supabase Auth → câu tiếng Việt. Cố ý KHÔNG phân biệt sai email / sai mật khẩu. */
export function dichLoiDangNhap(loi: LoiDangNhap): string {
  const m = (loi?.message ?? '').toLowerCase()
  if (loi?.status === 429 || m.includes('rate limit'))
    return 'Thử quá nhiều lần rồi, đợi vài phút rồi thử lại nhé.'
  if (m.includes('invalid login credentials')) return 'Email hoặc mật khẩu chưa đúng. Thử lại nhé.'
  if (m.includes('fetch') || m.includes('network'))
    return 'Không kết nối được. Kiểm tra mạng rồi thử lại nhé.'
  return 'Có lỗi khi đăng nhập. Thử lại sau nhé.'
}
