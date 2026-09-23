import type { ReactNode } from 'react'
import { Icon } from '../../components/icons.tsx'

/**
 * Exercise Shell (UI_DESIGN.md §6.1, mockup 02/07): header = [ring | tiêu đề] + 3 nút ghost
 * (phiên âm / gợi ý / bỏ qua) + X thoát; thân căn giữa theo max-width từng màn; progress dots.
 * Player là màn TOÀN MÀN HÌNH, không nằm trong AppShell (mockup không có nav).
 * Tự quyết ngoài mockup: X thoát có ở MỌI màn (mockup chỉ vẽ ở Flashcard) — §4.6 cho thoát giữa chừng.
 */
const MAX = {
  520: 'max-w-[520px]',
  560: 'max-w-[560px]',
  600: 'max-w-[600px]',
  620: 'max-w-[620px]',
  640: 'max-w-[640px]',
  680: 'max-w-[680px]',
} as const

export type Ghost = {
  phienAm: boolean
  toggle: () => void
  goiY?: (() => void) | undefined
  boQua?: (() => void) | undefined
  /** Nút thứ 4 (M5, §8) — chỉ truyền khi bài CÓ record để cache được ai_explanation. */
  giaiThich?: (() => void) | undefined
}

type Props = {
  header?: ReactNode
  ghost?: Ghost | undefined
  thoat: () => void
  rong: keyof typeof MAX
  dots?: { tong: number; hienTai: number } | undefined
  vienHeader?: boolean
  /** Số từ trong session hiện tại — lộ ra `data-so-tu-phien` để kiểm thử tự động đọc được (M11). */
  soTuPhien?: number | undefined
  children: ReactNode
}

const NUT_GHOST = 'flex flex-col items-center gap-1 text-10 font-medium'

export default function ExerciseShell({ header, ghost, thoat, rong, dots, vienHeader = true, soTuPhien, children }: Props) {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-surface-page" data-so-tu-phien={soTuPhien}>
      <header
        className={`flex items-center justify-between px-[22px] pt-[22px] pb-2 md:px-16 md:py-9 ${
          vienHeader ? 'border-b border-border-card' : ''
        }`}
      >
        <div>{header}</div>
        <div className="flex items-center gap-4 md:gap-[22px]">
          {ghost && (
            <>
              <button
                type="button"
                onClick={ghost.toggle}
                className={`${NUT_GHOST} ${ghost.phienAm ? 'text-accent' : 'text-content-muted'}`}
                aria-pressed={ghost.phienAm}
              >
                <span className="font-han text-16 font-semibold leading-none">拼</span>
                <span>Phiên âm</span>
              </button>
              {ghost.goiY && (
                <button type="button" onClick={ghost.goiY} className={`${NUT_GHOST} text-content-muted`}>
                  <Icon ten="goi-y" size={19} />
                  <span>Gợi ý</span>
                </button>
              )}
              {ghost.giaiThich && (
                <button type="button" onClick={ghost.giaiThich} className={`${NUT_GHOST} text-content-muted`}>
                  <Icon ten="giai-thich" size={19} />
                  <span>Giải thích</span>
                </button>
              )}
              {ghost.boQua && (
                <button type="button" onClick={ghost.boQua} className={`${NUT_GHOST} text-content-muted`}>
                  <Icon ten="bo-qua" size={19} />
                  <span>Bỏ qua</span>
                </button>
              )}
            </>
          )}
          <button type="button" onClick={thoat} aria-label="Thoát" className="ml-1 text-content-muted">
            <Icon ten="dong" size={20} strokeWidth="2" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-6 md:p-10">
        <div className={`w-full ${MAX[rong]}`}>{children}</div>
      </div>

      {dots && (
        <div className="flex justify-center gap-[9px] pb-9">
          {Array.from({ length: dots.tong }, (_, i) => (
            <span
              key={i}
              className={`h-[9px] w-[9px] rounded-pill ${
                i <= dots.hienTai ? 'bg-accent' : 'border-[1.5px] border-border-dot'
              }`}
            />
          ))}
        </div>
      )}
    </main>
  )
}
