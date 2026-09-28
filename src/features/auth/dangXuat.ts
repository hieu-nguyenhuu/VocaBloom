/**
 * M19 — cờ "đang CHỦ ĐỘNG đăng xuất" (bấm nút ở màn Cài đặt).
 *
 * Vì sao cần: signOut phát SIGNED_OUT ⇒ `RequireAuth` render lại. react-router 8 đổi location trong
 * `startTransition` (ưu tiên thấp) nên RequireAuth render TRƯỚC với location CŨ và `<Navigate>` của
 * nó (state `{ from: '/cai-dat' }`) GHI ĐÈ lên điều hướng kèm `thongBao` của màn Cài đặt — đã đo
 * bằng CDP: replaceState(thongBao) rồi replaceState(from) ×2. Khi cờ bật, RequireAuth nhường quyền
 * điều hướng cho màn Cài đặt. Màn Đăng nhập hạ cờ lúc mount.
 * Phiên hết hạn tự nhiên (cờ tắt) ⇒ RequireAuth vẫn tự về /dang-nhap kèm `from` như cũ.
 */
let chuDong = false

export const batDauDangXuat = () => {
  chuDong = true
}
export const xongDangXuat = () => {
  chuDong = false
}
export const dangDangXuatChuDong = () => chuDong
