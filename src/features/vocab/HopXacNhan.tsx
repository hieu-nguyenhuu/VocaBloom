import { useEffect, useRef } from 'react'

/**
 * Hộp xác nhận cho thao tác PHÁ HUỶ (xoá từ / xoá chủ đề). `<dialog>` native, 0 package.
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
      className="w-full max-w-[420px] rounded-16 bg-surface-raised p-0 backdrop:bg-[rgb(36_27_58_/_0.35)]"
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
