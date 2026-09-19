import type { ReactNode } from 'react'

/**
 * Khung nội dung chuẩn cho trang hành chính: PC padding 40/44 + max-width theo mockup
 * (Dashboard 1000, Import/Cài đặt 960); Mobile padding 0 22 20. Trang có bố cục riêng
 * (Từ vựng 2 pane, màn 13) KHÔNG dùng component này.
 */
const RONG = { 1000: 'max-w-[1000px]', 960: 'max-w-[960px]' } as const

type Props = { rong?: keyof typeof RONG; children: ReactNode }

export default function KhungTrang({ rong = 1000, children }: Props) {
  return (
    <div className="px-[22px] pt-6 pb-5 md:px-11 md:py-10">
      <div className={`mx-auto ${RONG[rong]}`}>{children}</div>
    </div>
  )
}
