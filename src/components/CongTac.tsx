/**
 * Công tắc bật/tắt (switch) — tách nguyên văn từ hàng "Cảnh báo hàng đợi cạn" của màn Cài đặt (M6a)
 * để dùng lại ở nhóm "Âm thanh" (M17) thay vì chép markup 8 lần. Giao diện KHÔNG đổi.
 *
 * Màu bật là TÍM vì đây là phần tử bấm được (UI_DESIGN §63 cấm hồng trên nút).
 */
type Props = {
  bat: boolean
  onDoi: (bat: boolean) => void
  nhan: string
  /** Khoá lại (VD: công tắc tổng âm thanh đang tắt) — giá trị vẫn giữ nguyên, chỉ không bấm được. */
  khoa?: boolean
}

export default function CongTac({ bat, onDoi, nhan, khoa = false }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={bat}
      aria-label={nhan}
      disabled={khoa}
      onClick={() => onDoi(!bat)}
      className={`relative h-5 w-9 shrink-0 rounded-pill transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        bat ? 'bg-accent' : 'bg-border-subtle'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-pill bg-white transition-all ${
          bat ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  )
}
