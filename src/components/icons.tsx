import type { ReactElement, SVGProps } from 'react'

/**
 * 6 icon nav — SVG path trích NGUYÊN VĂN từ VocaBloom_PCView.html (sidebar màn 17),
 * PC và Mobile dùng chung path (UI_DESIGN.md §10.3). Không trộn icon font.
 * KHÔNG chứa icon giai đoạn cây (gate MB-03).
 */
export type TenIcon =
  | 'dashboard'
  | 'on-tap'
  | 'tu-vung'
  | 'import'
  | 'cai-dat'
  | 'thong-bao'
  // Màn Import (15/16 PC): khung kéo-thả dùng lại path `import` cỡ 48; 3 icon dưới trích riêng
  | 'file'
  | 'canh-bao'
  | 'back'
  // Player (M4a) — 5 icon trích mockup màn 02/06/12; `loa` tự vẽ cùng nét (mockup không có)
  | 'goi-y'
  | 'bo-qua'
  | 'dong'
  | 'mui-ten'
  | 'an-mung'
  | 'loa'
  | 'giai-thich'
  // Dashboard (M6b): ✓ trong ô ngày đã ôn của dải 7 ngày (mockup 01 Mobile)
  | 'tick'
  // Quản lý từ vựng (M8) — trích mockup 13 PC / 14 Mobile
  | 'sua'
  | 'xoa'
  | 'tim'

const PATH: Record<TenIcon, ReactElement> = {
  dashboard: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9h12v-9" />
    </>
  ),
  'on-tap': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l6 4-6 4Z" fill="currentColor" stroke="none" />
    </>
  ),
  'tu-vung': (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5Z" />
    </>
  ),
  import: (
    <>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  'cai-dat': (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>
  ),
  'thong-bao': (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  file: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5Z" />,
  'canh-bao': (
    <>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  'goi-y': (
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11.2c.6.5 1 1.2 1 2.1v.2h4v-.2c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
  ),
  'bo-qua': (
    <>
      <path d="M5 5l9 7-9 7V5Z" fill="currentColor" stroke="none" />
      <rect x="16" y="5" width="2.5" height="14" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  dong: <path d="M6 6l12 12M18 6L6 18" />,
  'mui-ten': <path d="M5 12h14M13 6l6 6-6 6" />,
  'an-mung': (
    <path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-1-2-1-2 2 1 3 3 3 5a5 5 0 0 1-10 0c0-6 4-7 5-12Z" />
  ),
  'giai-thich': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.6.2-1 .8-1 1.4v.2" />
      <path d="M12 17h.01" />
    </>
  ),
  loa: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  tick: <path d="M5 12l5 5L19 7" />,
  sua: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  xoa: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 6" />
    </>
  ),
  tim: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
}

/**
 * Bộ 6 icon giai đoạn cây — CHỐT 2026-09-16, Phương án A "Một thân cây trên nền đất" (MB-19).
 * Thay thế bản nháp trong 2 file HTML mockup; đây là bản chính thức, gate MB-03 đã gỡ.
 * Cùng đường đất `M5 20.5h14` + thân thẳng ở mọi hình để đọc ra "6 khoảnh khắc của 1 cái cây".
 * Màu: tô theo ngữ cảnh — hàng "Khu vườn" & Tổng kết dùng màu tượng trưng theo stage (ring-0..5),
 * ring Player dùng màu theo total_points thật (systemPatterns.md §7.5).
 */
export type StageCay = 'new' | 'stage1' | 'stage2' | 'stage3' | 'intensive' | 'mastered'

const DAT = <path d="M5 20.5h14" />

const CAY: Record<StageCay, ReactElement> = {
  new: (
    <>
      {DAT}
      <path d="M8 18c-.6-3.4 1.6-6.6 5.2-7.2 1 3.2-1.2 6.7-5.2 7.2Z" />
    </>
  ),
  stage1: (
    <>
      {DAT}
      <path d="M12 20.5v-7" />
      <path d="M12 13.5c0-2.6 1.8-4 4.2-4 0 2.6-1.8 4-4.2 4Z" />
      <path d="M12 16c0-2.2-1.5-3.4-3.6-3.4 0 2.2 1.5 3.4 3.6 3.4Z" />
    </>
  ),
  stage2: (
    <>
      {DAT}
      <path d="M12 20.5V11" />
      <path d="M12 4c2 1.8 3 4 3 5.6a3 3 0 0 1-6 0C9 8 10 5.8 12 4Z" />
      <path d="M12 15c-1.8 0-3.2-1-3.8-2.6 1.8-.2 3.3.8 3.8 2.6Z" />
    </>
  ),
  stage3: (
    <>
      {DAT}
      <path d="M12 20.5V8" />
      <path d="M12 8c0-3.8 3-6.2 6.5-6.2 0 3.8-2.7 6.4-6.5 6.2Z" />
      <path d="M12 8l3.5-3.5" />
      <path d="M12 13.5c-2.4 0-4.2-1.4-4.8-3.6 2.4-.2 4.3 1.2 4.8 3.6Z" />
    </>
  ),
  intensive: (
    <>
      {DAT}
      <path d="M12 20.5v-8" />
      <circle cx="12" cy="8" r="1.7" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="4.6" rx="1.6" ry="2" />
      <ellipse cx="12" cy="11.4" rx="1.6" ry="2" />
      <ellipse cx="8.6" cy="8" rx="2" ry="1.6" />
      <ellipse cx="15.4" cy="8" rx="2" ry="1.6" />
      <path d="M12 16c-2 0-3.5-1.1-4-3 2-.2 3.6 1 4 3Z" />
    </>
  ),
  mastered: (
    <>
      {DAT}
      <path d="M12 20.5v-2" />
      <circle cx="12" cy="12.5" r="6" />
      <path d="M12 6.5V4.5" />
      <path d="M12 5.5c1.2-2 3-2.6 4.6-2.2-.4 1.8-2.4 2.8-4.6 2.2Z" />
    </>
  ),
}

type IconCayProps = { stage: StageCay; size?: number } & SVGProps<SVGSVGElement>

export function IconCay({ stage, size = 20, ...rest }: IconCayProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {CAY[stage]}
    </svg>
  )
}

type IconProps = { ten: TenIcon; size?: number } & SVGProps<SVGSVGElement>

export function Icon({ ten, size = 19, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATH[ten]}
    </svg>
  )
}
