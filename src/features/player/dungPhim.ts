import { useEffect, useRef } from 'react'

/**
 * Phím tắt dùng chung cho các màn Player (M11/Q2-Q3).
 *
 * Quy ước toàn app:
 *   · Enter        = hành động chính của màn (Kiểm tra / Tiếp theo / Gửi bài)
 *   · Shift+Enter  = xuống dòng (chỉ có nghĩa trong ô tự luận)
 *   · Space        = CHỈ dùng ở Flashcard (các màn khác giữ Space để cuộn trang)
 *   · 1–4          = chọn đáp án / chip thứ n
 *
 * Tên có tiền tố `use` vì đây LÀ một custom hook (gọi `useRef`/`useEffect`). Quy tắc
 * `react-hooks/rules-of-hooks` chỉ nhận diện hook qua tên — đặt tên tiếng Việt thuần khiến lint
 * báo lỗi "không phải component cũng không phải hook". Phần còn lại của API giữ tiếng Việt.
 *
 * Luôn bỏ qua khi đang gõ IME (`isComposing`) — Enter lúc đó là để CHỐT CHỮ, không phải nộp bài.
 * Mặc định cũng bỏ qua khi con trỏ nằm trong ô nhập: ô nhập tự lo phím Enter của nó
 * (`batTrongONhap = true` để nhận cả trong ô, dùng cho màn có ô nhập mà Enter = Kiểm tra).
 */
export function useDungPhim(xuLy: (e: KeyboardEvent) => void, batTrongONhap = false): void {
  const ref = useRef(xuLy)
  useEffect(() => {
    ref.current = xuLy
  }, [xuLy])

  useEffect(() => {
    const nghe = (e: KeyboardEvent) => {
      if (e.isComposing) return
      const el = e.target as HTMLElement | null
      const trongO = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable === true
      if (trongO && !batTrongONhap) return
      ref.current(e)
    }
    window.addEventListener('keydown', nghe)
    return () => window.removeEventListener('keydown', nghe)
  }, [batTrongONhap])
}

/** Phím 1–4 → chỉ số 0–3; trả `null` nếu không phải phím số hợp lệ. */
export function soThuTuPhim(e: KeyboardEvent, soLuaChon: number): number | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null
  const i = Number(e.key) - 1
  return Number.isInteger(i) && i >= 0 && i < soLuaChon ? i : null
}
