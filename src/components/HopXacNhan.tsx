import { useEffect, useRef } from 'react'

/**
 * Hộp xác nhận cho thao tác PHÁ HUỶ (xoá từ / xoá chủ đề / xoá thông báo đã đọc). `<dialog>` native.
 * M9/Q5: LUÔN căn giữa màn hình (`m-auto`) — người dùng yêu cầu, cố ý lệch mockup 15 (bottom sheet).
 * Luôn nêu hậu quả bằng SỐ CỤ THỂ — xoá là không hoàn tác được (cascade dọn cả lịch sử ôn).
 */
type Props = {
  tieuDe: string
  noiDung: string
  nhanXacNhan?: string
  dangChay?: boolean
  onDong: () => void
  onXacNhan: () => void
}

export default function HopXacNhan({ tieuDe, noiDung, nhanXacNhan = 'Xoá', dangChay, onDong, onXacNhan }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onDong}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(420px,calc(100vw-32px))] rounded-20 bg-surface-raised p-0 backdrop:bg-[rgb(36_27_58_/_0.35)]"
    >
      <div className="flex flex-col gap-3 p-6">
        <h2 className="font-display text-18 font-bold text-content-primary">{tieuDe}</h2>
        <p className="text-14 text-content-nav">{noiDung}</p>
        <div className="mt-2 flex gap-2.5">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="flex-1 rounded-12 bg-border-card py-3 text-14 font-semibold text-content-nav"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={dangChay}
            onClick={onXacNhan}
            className="flex-1 rounded-12 bg-danger py-3 text-14 font-semibold text-white disabled:opacity-60"
          >
            {dangChay ? 'Đang xoá…' : nhanXacNhan}
          </button>
        </div>
      </div>
    </dialog>
  )
}
