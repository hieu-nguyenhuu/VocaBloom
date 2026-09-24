/**
 * Chọn giao diện Sáng / Tối / Hệ thống (M16). Hàm THUẦN — không React, không Supabase, không DOM.
 *
 * Phần CSS đã có sẵn từ M0 (MB-08): `tokens.css` viết đủ 3 nhánh — sáng (`:root`), tối theo hệ điều
 * hành (`@media … :root:not([data-theme="light"])`), tối ép thủ công (`:root[data-theme="dark"]`).
 * Module này chỉ quyết định GIÁ TRỊ của thuộc tính `data-theme` trên `<html>`.
 *
 * ⚠️ `index.html` có script inline LẶP LẠI khoá `KHOA_LUU` và phép ánh xạ bên dưới — nó phải chạy
 * trước khi JS của app tải để trang không nháy màu, nên không import được file này. Có test chống
 * lệch `X-giaodien` canh 2 nơi khớp nhau: đừng sửa một nơi mà quên nơi kia.
 */

export type CheDo = 'sang' | 'toi' | 'he_thong'

/** Khoá localStorage — lưu THEO TỪNG THIẾT BỊ (M16/Q1), không đồng bộ qua DB. */
export const KHOA_LUU = 'vb-giao-dien'

export const DS_CHE_DO: readonly { gia_tri: CheDo; nhan: string }[] = [
  { gia_tri: 'sang', nhan: 'Sáng' },
  { gia_tri: 'toi', nhan: 'Tối' },
  { gia_tri: 'he_thong', nhan: 'Hệ thống' },
]

/**
 * Đọc giá trị thô từ localStorage. Chưa từng chọn, hoặc giá trị lạ ⇒ theo hệ thống (M16/Q5).
 * So khớp CHÍNH XÁC, không trim/lowercase: giá trị hợp lệ chỉ do chính app ghi ra.
 */
export function docCheDo(raw: string | null): CheDo {
  return raw === 'sang' || raw === 'toi' ? raw : 'he_thong'
}

/**
 * Giá trị gán cho `document.documentElement.dataset.theme`.
 * `null` nghĩa là GỠ thuộc tính — khi đó nhánh `@media (prefers-color-scheme: dark)` của CSS tự
 * theo hệ điều hành, kể cả khi OS đổi giữa chừng, mà không cần JS lắng nghe gì.
 */
export function thuocTinhTheme(cheDo: CheDo): 'light' | 'dark' | null {
  if (cheDo === 'sang') return 'light'
  if (cheDo === 'toi') return 'dark'
  return null
}
