import { useState } from 'react'
import type { VocabDb } from '../../../lib/player.ts'

/**
 * Pattern 5 — lật thẻ (mockup 06). Không ring, không hint/skip; Good/Hard/Again dùng bộ màu
 * feedback §6.2. Không tính điểm nâng stage (DEC-11) — 3 nút chỉ hiện sau khi đã lật.
 */
type Props = { vocab: VocabDb; hienPhienAm: boolean; onChon: (nut: 'good' | 'hard' | 'again') => void }

export default function Flashcard({ vocab, hienPhienAm, onChon }: Props) {
  const [lat, setLat] = useState(false)
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
            <div className="mt-5 text-13 text-content-subtle">Chạm để xem nghĩa</div>
          </>
        ) : (
          <>
            <div lang={vocab.lang} className="font-han text-36 font-semibold text-content-primary">
              {vocab.word}
            </div>
            <div className="mt-2 text-28 font-semibold text-content-primary">{vocab.meaning_vi}</div>
            {vocab.collocation && (
              <div className="mt-4 text-15 text-content-muted">
                <span lang={vocab.lang} className="font-han">
                  {vocab.collocation}
                </span>
                {vocab.collocation_meaning_vi ? ` · ${vocab.collocation_meaning_vi}` : ''}
              </div>
            )}
          </>
        )}
      </button>
      {lat && (
        <div className="flex gap-3">
          <button type="button" onClick={() => onChon('again')} className="flex-1 rounded-14 bg-danger-bg px-1.5 py-4 text-15 font-semibold text-danger-text">
            Again
          </button>
          <button type="button" onClick={() => onChon('hard')} className="flex-1 rounded-14 bg-warn-bg px-1.5 py-4 text-15 font-semibold text-warn-text">
            Hard
          </button>
          <button type="button" onClick={() => onChon('good')} className="flex-1 rounded-14 bg-success-bg px-1.5 py-4 text-15 font-semibold text-success-text">
            Good
          </button>
        </div>
      )}
    </div>
  )
}
