import { useRef, useState, type KeyboardEvent } from 'react'
import type { DangBaiAI, PayloadTuLuan, VocabDb } from '../../../lib/player.ts'
import { ngonNguPhu, tachNghiaPhu } from '../../../lib/songNgu.ts'

/**
 * Pattern 8 — tự luận AI chấm, phần NHẬP (mockup 09 nửa trên).
 * Nút Gợi ý ẩn HOÀN TOÀN ở 3 dạng này (§6.4) — `PlayerPage` không truyền `goiY`.
 * "Nộp bài" chỉ lưu câu vào bộ đệm rồi sang màn kế; việc chấm gom về màn `cham_ai`
 * để cả session chỉ tốn 3 request (DEC-14).
 *
 * M26c — `make_sentence` song ngữ: thêm ô câu NGÔN NGỮ PHỤ tuỳ chọn (điểm chỉ theo câu chính).
 * Enter ở ô chính ⇒ nhảy xuống ô phụ; Enter ở ô phụ ⇒ nộp (C1). Từ thiếu từ phụ ⇒ màn y hệt bản cũ.
 */
type Props = {
  vocab: VocabDb
  cheDo: DangBaiAI
  payload?: PayloadTuLuan | undefined
  hienPhienAm: boolean
  onNop: (cau: string, cauPhu: string) => void
}

/** M11/Q2: Enter = hành động chính; Shift+Enter = xuống dòng; bỏ qua khi đang chọn chữ IME. */
const laEnter = (e: KeyboardEvent) => e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing

const O_NHAP = 'rounded-14 border border-border-input bg-surface-sunken p-[18px] text-content-nav focus:border-accent focus:outline-none'

export default function TuLuan({ vocab, cheDo, payload, hienPhienAm, onNop }: Props) {
  const [cau, setCau] = useState('')
  const [cauPhu, setCauPhu] = useState('')
  const oChinh = useRef<HTMLTextAreaElement>(null)
  const oPhu = useRef<HTMLTextAreaElement>(null)
  const tenNgonNgu = vocab.lang === 'zh' ? 'tiếng Trung' : 'tiếng Anh'
  const langPhu = ngonNguPhu(vocab.lang)
  const tenNnPhu = langPhu === 'en' ? 'tiếng Anh' : 'tiếng Trung'
  const nghiaPhu = tachNghiaPhu(vocab.secondary_word)[0] // C3
  const coOPhu = cheDo === 'make_sentence' && nghiaPhu !== undefined
  const nop = () => {
    if (cau.trim()) onNop(cau, coOPhu ? cauPhu : '')
  }

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
        ({vocab.meaning_vi}
        {nghiaPhu && (
          <>
            {' · '}
            <span lang={langPhu}>{nghiaPhu}</span>
          </>
        )}
        )
      </>
    )
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="rounded-16 border border-border-card bg-surface-card p-[18px] text-center text-15 text-content-nav">
        {de()}
      </div>

      <textarea
        ref={oChinh}
        value={cau}
        onChange={(e) => setCau(e.target.value)}
        onKeyDown={(e) => {
          if (!laEnter(e)) return
          e.preventDefault()
          if (!cau.trim()) return
          if (coOPhu) oPhu.current?.focus()
          else nop()
        }}
        lang={vocab.lang}
        autoFocus
        placeholder={
          coOPhu
            ? `Câu ${tenNgonNgu}… (Enter để sang câu ${tenNnPhu})`
            : 'Nhập câu của bạn… (Enter để gửi, Shift+Enter xuống dòng)'
        }
        aria-label="Câu trả lời"
        className={`min-h-[60px] font-han text-17 ${O_NHAP}`}
      />

      {coOPhu && (
        <textarea
          ref={oPhu}
          value={cauPhu}
          onChange={(e) => setCauPhu(e.target.value)}
          onKeyDown={(e) => {
            if (!laEnter(e)) return
            e.preventDefault()
            if (cau.trim()) nop()
            else oChinh.current?.focus()
          }}
          lang={langPhu}
          placeholder={`Câu ${tenNnPhu} (tuỳ chọn) — Enter để nộp`}
          aria-label={`Câu ${tenNnPhu} (tuỳ chọn)`}
          className={`min-h-[52px] text-15 ${O_NHAP}`}
        />
      )}

      <button
        type="button"
        onClick={nop}
        disabled={!cau.trim()}
        className="rounded-14 bg-accent py-[17px] text-16 font-semibold text-white disabled:opacity-60"
      >
        Nộp bài
      </button>
    </div>
  )
}
