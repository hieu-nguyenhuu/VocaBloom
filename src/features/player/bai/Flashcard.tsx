import { useEffect, useState } from 'react'
import type { VocabDb } from '../../../lib/player.ts'

/**
 * Pattern 5 — lật thẻ (mockup 06). Không ring, không hint/skip; Good/Hard/Again dùng bộ màu
 * feedback §6.2. Không tính điểm nâng stage (DEC-11) — 3 nút chỉ hiện sau khi đã lật.
 *
 * M10 (người dùng báo 19/09): Space để lật, phím 1/2/3 chọn Again/Hard/Good, mặt sau thêm câu ví dụ.
 * Phím tắt đăng ký NGAY TRONG component để tự gỡ khi rời màn, và bỏ qua khi con trỏ đang ở ô nhập
 * hoặc đang gõ IME.
 */
type Props = { vocab: VocabDb; hienPhienAm: boolean; onChon: (nut: 'good' | 'hard' | 'again') => void }

const PHIM_NUT = { 1: 'again', 2: 'hard', 3: 'good' } as const

export default function Flashcard({ vocab, hienPhienAm, onChon }: Props) {
  const [lat, setLat] = useState(false)

  useEffect(() => {
    const xuLy = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (e.isComposing || el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA') return
      if (!lat && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault()
        setLat(true)
        return
      }
      if (lat && (e.key === '1' || e.key === '2' || e.key === '3')) {
        e.preventDefault()
        onChon(PHIM_NUT[e.key])
      }
    }
    window.addEventListener('keydown', xuLy)
    return () => window.removeEventListener('keydown', xuLy)
  }, [lat, onChon])
  return (
    <div className="flex flex-col gap-7">
      <button
        type="button"
        onClick={() => setLat(true)}
        className="rounded-24 border border-border-card bg-surface-card px-7 py-14 text-center"
      >
        {!lat ? (
          <>
            <div lang={vocab.lang} className="font-han text-52 font-semibold text-content-primary">
              {vocab.word}
            </div>
            {hienPhienAm && vocab.pinyin && <div className="mt-3 text-15 text-content-muted">{vocab.pinyin}</div>}
            <div className="mt-5 text-13 text-content-subtle">Chạm hoặc bấm Space để xem nghĩa</div>
          </>
        ) : (
          <>
            <div lang={vocab.lang} className="font-han text-36 font-semibold text-content-primary">
              {vocab.word}
            </div>
            <div className="mt-2 text-28 font-semibold text-content-primary">{vocab.meaning_vi}</div>
            {hienPhienAm && vocab.pinyin && (
              <div className="mt-1 text-14 text-content-muted">{vocab.pinyin}</div>
            )}
            {vocab.collocation && (
              <div className="mt-4 text-15 text-content-muted">
                <span lang={vocab.lang} className="font-han">
                  {vocab.collocation}
                </span>
                {vocab.collocation_meaning_vi ? ` · ${vocab.collocation_meaning_vi}` : ''}
              </div>
            )}
            {vocab.example_sentence && (
              <div className="mt-4 border-t border-border-card pt-4">
                <div lang={vocab.lang} className="font-han text-17 text-content-primary">
                  {vocab.example_sentence}
                </div>
                {vocab.example_meaning_vi && (
                  <div className="mt-1 text-14 text-content-muted">{vocab.example_meaning_vi}</div>
                )}
              </div>
            )}
          </>
        )}
      </button>
      {lat && (
        <div className="flex gap-3">
          <button type="button" onClick={() => onChon('again')} className="flex-1 rounded-14 bg-danger-bg px-1.5 py-4 text-15 font-semibold text-danger-text">
            Again <span className="opacity-60">1</span>
          </button>
          <button type="button" onClick={() => onChon('hard')} className="flex-1 rounded-14 bg-warn-bg px-1.5 py-4 text-15 font-semibold text-warn-text">
            Hard <span className="opacity-60">2</span>
          </button>
          <button type="button" onClick={() => onChon('good')} className="flex-1 rounded-14 bg-success-bg px-1.5 py-4 text-15 font-semibold text-success-text">
            Good <span className="opacity-60">3</span>
          </button>
        </div>
      )}
    </div>
  )
}
