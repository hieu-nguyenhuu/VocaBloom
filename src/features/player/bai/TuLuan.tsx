import { useState } from 'react'
import type { DangBaiAI, PayloadTuLuan, VocabDb } from '../../../lib/player.ts'

/**
 * Pattern 8 — tự luận AI chấm, phần NHẬP (mockup 09 nửa trên).
 * Nút Gợi ý ẩn HOÀN TOÀN ở 3 dạng này (§6.4) — `PlayerPage` không truyền `goiY`.
 * "Nộp bài" chỉ lưu câu vào bộ đệm rồi sang màn kế; việc chấm gom về màn `cham_ai`
 * để cả session chỉ tốn 3 request (DEC-14).
 */
type Props = {
  vocab: VocabDb
  cheDo: DangBaiAI
  payload?: PayloadTuLuan | undefined
  hienPhienAm: boolean
  onNop: (cau: string) => void
}

export default function TuLuan({ vocab, cheDo, payload, hienPhienAm, onNop }: Props) {
  const [cau, setCau] = useState('')
  const tenNgonNgu = vocab.lang === 'zh' ? 'tiếng Trung' : 'tiếng Anh'

  const de = () => {
    if (cheDo === 'trans_sentence') {
      return (
        <>
          Dịch sang {tenNgonNgu}: <b>{payload?.vietnamese_sentence}</b>
        </>
      )
    }
    if (cheDo === 'complete_situation') {
      return (
        <>
          {payload?.situation_vi}
          {payload?.given_sentence_zh && (
            <>
              <span lang={vocab.lang} className="mt-2 block font-han text-17 text-content-primary">
                {payload.given_sentence_zh}
              </span>
              {hienPhienAm && payload.given_sentence_pinyin && (
                <span className="mt-1 block text-12 text-content-muted">
                  {payload.given_sentence_pinyin}
                </span>
              )}
            </>
          )}
          <span className="mt-2 block">
            Viết tiếp 1-3 câu có dùng{' '}
            <b lang={vocab.lang} className="font-han">
              {vocab.word}
            </b>
          </span>
        </>
      )
    }
    return (
      <>
        Đặt câu với từ:{' '}
        <b lang={vocab.lang} className="font-han">
          {vocab.word}
        </b>{' '}
        ({vocab.meaning_vi})
      </>
    )
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="rounded-16 border border-border-card bg-surface-card p-[18px] text-center text-15 text-content-nav">
        {de()}
      </div>

      <textarea
        value={cau}
        onChange={(e) => setCau(e.target.value)}
        // M11/Q2: Enter = gửi bài; Shift+Enter = xuống dòng. Bỏ qua khi đang chọn chữ IME.
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
          e.preventDefault()
          if (cau.trim()) onNop(cau)
        }}
        lang={vocab.lang}
        autoFocus
        placeholder="Nhập câu của bạn… (Enter để gửi, Shift+Enter xuống dòng)"
        aria-label="Câu trả lời"
        className="min-h-[60px] rounded-14 border border-border-input bg-surface-sunken p-[18px] font-han text-17 text-content-nav focus:border-accent focus:outline-none"
      />

      <button
        type="button"
        onClick={() => onNop(cau)}
        disabled={!cau.trim()}
        className="rounded-14 bg-accent py-[17px] text-16 font-semibold text-white disabled:opacity-60"
      >
        Nộp bài
      </button>
    </div>
  )
}
