import { useCallback, useEffect, useState } from 'react'

/**
 * Trang nghiệm thu hệ token — CÔNG CỤ DEV, KHÔNG PHẢI UI SẢN PHẨM.
 *
 * M0 chưa dựng màn hình nào nên không có cách nào nhìn thấy token đúng hay sai.
 * Trang này bày toàn bộ token ra cạnh nhau để đối chiếu bằng mắt với 2 file
 * mockup. Sẽ bị xoá/thay khi màn thật xuất hiện từ M1.
 *
 * Lưu ý: mọi class Tailwind ở đây phải là CHUỖI NGUYÊN VẸN trong mã nguồn —
 * Tailwind quét text để sinh CSS, ghép chuỗi động (`bg-${x}`) sẽ không ra class.
 */

type Nhom = { ten: string; ghiChu?: string; classes: readonly string[] }

const MAU: readonly Nhom[] = [
  {
    ten: 'Bề mặt',
    ghiChu: 'Dark mode = 3 tầng nền: app → sidebar → page',
    classes: [
      'bg-surface-app',
      'bg-surface-page',
      'bg-surface-sidebar',
      'bg-surface-card',
      'bg-surface-raised',
      'bg-surface-sunken',
    ],
  },
  {
    ten: 'Viền',
    classes: [
      'bg-border-card',
      'bg-border-subtle',
      'bg-border-divider',
      'bg-border-input',
      'bg-border-dot',
      'bg-border-dashed',
    ],
  },
  {
    ten: 'Chữ',
    classes: [
      'bg-content-primary',
      'bg-content-nav',
      'bg-content-muted',
      'bg-content-subtle',
      'bg-content-faint',
    ],
  },
  {
    ten: 'Accent chính — TÍM',
    ghiChu: 'Mọi hành động chính: nút, nav active, focus, progress dot',
    classes: ['bg-accent', 'bg-accent-text', 'bg-accent-tint'],
  },
  {
    ten: 'Accent phụ — XANH DƯƠNG',
    ghiChu: 'CHỈ nút "Ôn theo chủ đề"',
    classes: ['bg-secondary', 'bg-secondary-tint'],
  },
  {
    ten: 'Trang trí — HỒNG',
    ghiChu: 'CHỈ streak/thành tích — cấm đặt trên phần tử click được',
    classes: ['bg-award-icon', 'bg-award-text', 'bg-award-bg'],
  },
  {
    ten: 'Feedback',
    ghiChu: 'Quá hạn dùng tint vàng, không dùng đỏ',
    classes: [
      'bg-danger',
      'bg-danger-bg',
      'bg-danger-text',
      'bg-warn',
      'bg-warn-bg',
      'bg-warn-text',
      'bg-success',
      'bg-success-bg',
      'bg-success-text',
      'bg-success-strong',
      'bg-tint-orange',
      'bg-tint-lime',
    ],
  },
  {
    ten: 'TẦNG C — Mastery Ring (BẤT BIẾN, không đổi theo mode)',
    ghiChu: 'ring % = min(total_points, 30) / 30 — DEC-12',
    classes: ['bg-ring-0', 'bg-ring-1', 'bg-ring-2', 'bg-ring-3', 'bg-ring-4', 'bg-ring-5'],
  },
]

const RADIUS = [
  'rounded-8',
  'rounded-9',
  'rounded-10',
  'rounded-12',
  'rounded-14',
  'rounded-16',
  'rounded-18',
  'rounded-20',
  'rounded-24',
  'rounded-36',
  'rounded-pill',
] as const

const CO_CHU = [
  'text-10',
  'text-11',
  'text-12',
  'text-13',
  'text-14',
  'text-15',
  'text-16',
  'text-17',
  'text-18',
  'text-19',
  'text-20',
  'text-22',
  'text-24',
  'text-26',
  'text-28',
  'text-30',
  'text-36',
  'text-40',
  'text-44',
  'text-52',
] as const

type Theme = 'light' | 'dark' | 'he-thong'

/** rgb(91, 79, 232) → #5B4FE8 */
function sangHex(rgb: string): string {
  const so = rgb.match(/\d+/g)
  if (!so || so.length < 3) return rgb
  return `#${so
    .slice(0, 3)
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`
}

export default function TokenSheet() {
  const [theme, setTheme] = useState<Theme>('he-thong')
  const [hex, setHex] = useState<Record<string, string>>({})

  useEffect(() => {
    const el = document.documentElement
    if (theme === 'he-thong') delete el.dataset['theme']
    else el.dataset['theme'] = theme
  }, [theme])

  // Đọc màu ĐÃ TÍNH của từng ô — nếu dark mode hỏng, số hex ở đây sẽ không đổi
  // khi bấm Tối, phát hiện ngay lỗi `@theme` thiếu `inline`.
  const doMau = useCallback(() => {
    const ket: Record<string, string> = {}
    for (const node of document.querySelectorAll<HTMLElement>('[data-token]')) {
      const ten = node.dataset['token']
      if (ten) ket[ten] = sangHex(getComputedStyle(node).backgroundColor)
    }
    setHex(ket)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(doMau)
    return () => cancelAnimationFrame(id)
  }, [doMau, theme])

  return (
    <main className="min-h-[100dvh] bg-surface-page px-6 py-8">
      <div className="mx-auto flex max-w-[980px] flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-28 font-bold text-content-primary">
              VocaBloom · Bảng token
            </h1>
            <p className="text-13 text-content-muted">
              Công cụ dev để nghiệm thu M0 — không phải màn hình sản phẩm.
            </p>
          </div>
          <div className="flex gap-2">
            {(['light', 'dark', 'he-thong'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={
                  theme === t
                    ? 'rounded-10 bg-accent px-3 py-2 text-13 font-medium text-white'
                    : 'rounded-10 border border-border-card bg-surface-card px-3 py-2 text-13 text-content-nav'
                }
              >
                {t === 'light' ? 'Sáng' : t === 'dark' ? 'Tối' : 'Theo hệ thống'}
              </button>
            ))}
          </div>
        </header>

        {MAU.map((nhom) => (
          <section key={nhom.ten} className="flex flex-col gap-3">
            <div>
              <h2 className="font-display text-19 font-semibold text-content-primary">
                {nhom.ten}
              </h2>
              {nhom.ghiChu ? <p className="text-12 text-content-muted">{nhom.ghiChu}</p> : null}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3">
              {nhom.classes.map((cls) => (
                <div
                  key={cls}
                  className="overflow-hidden rounded-12 border border-border-card bg-surface-card"
                >
                  <div data-token={cls} className={`h-16 w-full ${cls}`} />
                  <div className="flex flex-col gap-0.5 px-3 py-2">
                    <span className="text-12 text-content-primary">{cls}</span>
                    <span className="text-11 text-content-muted">{hex[cls] ?? '…'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-19 font-semibold text-content-primary">3 font</h2>
          <div className="flex flex-col gap-3 rounded-14 border border-border-card bg-surface-card p-5">
            <p className="font-display text-28 font-bold text-content-primary">
              Baloo 2 — Khu vườn của bạn
            </p>
            <p className="font-body text-16 text-content-primary">
              Be Vietnam Pro — Ôn tập hằng ngày, đủ dấu tiếng Việt: ầ ẫ ợ ỹ đ
            </p>
            <p lang="zh" className="font-han text-28 font-semibold text-content-primary">
              Noto Sans SC — 学习中文词汇
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-19 font-semibold text-content-primary">
            Thang bo góc — 11 mức
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            {RADIUS.map((r) => (
              <div key={r} className="flex flex-col items-center gap-1">
                <div className={`h-16 w-16 bg-accent-tint ${r} border border-accent`} />
                <span className="text-11 text-content-muted">{r.replace('rounded-', '')}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-19 font-semibold text-content-primary">
            Thang cỡ chữ — 20 mức
          </h2>
          <div className="flex flex-col gap-1 rounded-14 border border-border-card bg-surface-card p-5">
            {CO_CHU.map((t) => (
              <div key={t} className="flex items-baseline gap-3">
                <span className="w-16 shrink-0 text-11 text-content-muted">
                  {t.replace('text-', '')}px
                </span>
                <span className={`text-content-primary ${t}`}>Ôn tập hằng ngày · 学习</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
