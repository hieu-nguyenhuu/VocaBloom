import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon, IconCay } from './icons.tsx'
import { dichLoiTai } from '../lib/loi.ts'

/**
 * M19 — 3 trạng thái dùng chung (DESIGN.md §B2, KHÔNG có mockup; layout đã duyệt).
 * - KhungRong: chưa có dữ liệu. Icon mặc định = hạt giống (ẩn dụ cây: chưa gieo gì).
 * - KhungLoi: tải LẦN ĐẦU thất bại, chưa có gì để hiện ⇒ Thử lại (+ lối thoát tuỳ màn).
 * - BangLoi: lỗi THAO TÁC khi màn đã có dữ liệu ⇒ banner 1 dòng, giữ nguyên màu đỏ cũ (Q1).
 * `gon`: bản gọn không viền, đặt trong cột hẹp / panel.
 * Câu lỗi luôn đi qua `dichLoiTai` ⇒ không bao giờ lộ "Failed to fetch" tiếng Anh.
 */
type HanhDong = { nhan: string; toi: string }

const NUT_CHINH = 'rounded-12 bg-accent px-5 py-2.5 text-14 font-semibold text-white'
const NUT_PHU = 'rounded-12 bg-border-card px-5 py-2.5 text-14 font-semibold text-content-nav'

function Khung({ gon, children }: { gon?: boolean | undefined; children: ReactNode }) {
  return (
    <div
      className={`flex w-full flex-col items-center gap-2 text-center ${
        gon ? 'px-3 py-6' : 'rounded-20 border border-border-card bg-surface-card px-6 py-10'
      }`}
    >
      {children}
    </div>
  )
}

export function KhungRong({
  icon = <IconCay stage="new" size={26} />,
  tieuDe,
  moTa,
  hanhDong,
  gon,
}: {
  icon?: ReactNode
  tieuDe: string
  moTa?: string | undefined
  hanhDong?: HanhDong | undefined
  gon?: boolean | undefined
}) {
  return (
    <Khung gon={gon}>
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-pill bg-accent-tint text-accent">{icon}</div>
      <p className="font-display text-17 font-bold text-content-primary">{tieuDe}</p>
      {moTa && <p className="max-w-[340px] text-13 text-content-muted md:text-14">{moTa}</p>}
      {hanhDong && (
        <Link to={hanhDong.toi} className={`mt-2 ${NUT_CHINH}`}>
          {hanhDong.nhan}
        </Link>
      )}
    </Khung>
  )
}

export function KhungLoi({
  tieuDe,
  loi,
  onThuLai,
  phu,
  gon,
}: {
  tieuDe: string
  loi: unknown
  onThuLai: () => void
  phu?: HanhDong | undefined
  gon?: boolean | undefined
}) {
  return (
    <div role="alert" className="w-full">
      <Khung gon={gon}>
        <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-pill bg-danger-bg text-danger-text">
          <Icon ten="canh-bao" size={26} />
        </div>
        <p className="font-display text-17 font-bold text-content-primary">{tieuDe}</p>
        <p className="max-w-[340px] text-13 text-content-muted md:text-14">{dichLoiTai(loi)}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <button type="button" onClick={onThuLai} className={NUT_CHINH}>
            Thử lại
          </button>
          {phu && (
            <Link to={phu.toi} className={NUT_PHU}>
              {phu.nhan}
            </Link>
          )}
        </div>
      </Khung>
    </div>
  )
}

export function BangLoi({
  loi,
  tienTo,
  onThuLai,
  onDong,
  className = '',
}: {
  loi: unknown
  tienTo?: string | undefined
  onThuLai?: (() => void) | undefined
  onDong?: (() => void) | undefined
  className?: string
}) {
  const cau = dichLoiTai(loi)
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 rounded-14 border border-danger bg-danger-bg px-4 py-3 text-13 text-danger-text ${className}`}
    >
      <span>{tienTo ? `${tienTo}: ${cau}` : cau}</span>
      <div className="flex shrink-0 items-center gap-3">
        {onThuLai && (
          <button type="button" onClick={onThuLai} className="rounded-10 bg-accent px-3 py-1.5 text-13 font-semibold text-white">
            Thử lại
          </button>
        )}
        {onDong && (
          <button type="button" onClick={onDong} className="font-semibold">
            Đóng
          </button>
        )}
      </div>
    </div>
  )
}
