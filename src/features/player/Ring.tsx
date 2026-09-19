import type { ReactNode } from 'react'
import { IconCay, type StageCay } from '../../components/icons.tsx'
import { mocRing } from '../../lib/player.ts'

/**
 * Mastery ring (DEC-12, UI_DESIGN.md §7): % viền = min(total_points, 30) / 30, vẽ bằng SVG
 * stroke-dasharray — KHÔNG conic-gradient, KHÔNG vòng luôn đầy. 6 mốc màu ring-0..5 cố định,
 * không đi qua token light/dark. Icon giữa = giai đoạn cây theo `stage`.
 * Số liệu mockup 02: 60px (PC) / 56 (Mobile), r=26 trong viewBox 60, track sw 5, icon 24/22.
 */
const MAU = ['text-ring-0', 'text-ring-1', 'text-ring-2', 'text-ring-3', 'text-ring-4', 'text-ring-5'] as const

/** `noiDung`: Dashboard (mockup 01) đặt CHỮ HÁN giữa ring thay cho icon cây. Bỏ trống = icon cây. */
type Props = { total_points: number; stage: StageCay; size?: number; noiDung?: ReactNode }

export default function Ring({ total_points, stage, size = 60, noiDung }: Props) {
  const r = 26
  const chuVi = 2 * Math.PI * r
  const pct = Math.min(total_points, 30) / 30
  return (
    <div className={`relative ${MAU[mocRing(total_points)]}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="5" className="stroke-border-card" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={chuVi}
          strokeDashoffset={chuVi * (1 - pct)}
          transform="rotate(-90 30 30)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {noiDung ?? <IconCay stage={stage} size={size >= 60 ? 24 : 22} />}
      </div>
    </div>
  )
}
