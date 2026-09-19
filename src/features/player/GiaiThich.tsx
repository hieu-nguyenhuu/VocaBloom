import { useEffect, useRef } from 'react'
import type { GiaiThich as NoiDungGiaiThich } from '../../lib/aiCore.ts'

/**
 * Panel "Giải thích (AI)" (§8, DEC-23) — KHÔNG có trong mockup, layout theo DESIGN.md §3 đã duyệt.
 * Dùng `<dialog>` native (ponytail: 0 package) — có sẵn backdrop, Esc để đóng, focus trap.
 * Nội dung lazy + cache ở `ai.ts`: bấm lại KHÔNG gọi lại AI.
 */
type Props = {
  mo: boolean
  dangTai: boolean
  noiDung: NoiDungGiaiThich | null
  loi: string | null
  lang: 'zh' | 'en'
  onDong: () => void
  onThuLai: () => void
}

const NHAN = 'text-12 font-semibold uppercase tracking-[0.04em] text-content-muted'

export default function GiaiThich({ mo, dangTai, noiDung, loi, lang, onDong, onThuLai }: Props) {
  const hop = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = hop.current
    if (!el) return
    if (mo && !el.open) el.showModal()
    if (!mo && el.open) el.close()
  }, [mo])

  const muc = (nhan: string, giaTri: string | undefined, chuHan = false) =>
    giaTri ? (
      <div>
        <div className={NHAN}>{nhan}</div>
        <div
          {...(chuHan ? { lang } : {})}
          className={`mt-1 text-15 leading-normal text-content-primary ${chuHan ? 'font-han' : ''}`}
        >
          {giaTri}
        </div>
      </div>
    ) : null

  return (
    <dialog
      ref={hop}
      onClose={onDong}
      aria-label="Giải thích của AI"
      className="m-auto w-[min(520px,calc(100vw-32px))] rounded-20 bg-surface-raised p-7 text-content-primary backdrop:bg-black/35"
    >
      <h2 className="font-display text-20 font-bold text-content-primary">Giải thích</h2>

      {dangTai && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-15 text-content-muted">Đang hỏi AI…</p>
          <div className="h-24 animate-pulse rounded-14 bg-surface-sunken" />
        </div>
      )}

      {!dangTai && loi && (
        <div className="mt-4 flex flex-col gap-3">
          <p role="alert" className="rounded-14 bg-danger-bg px-4 py-3 text-13 text-danger-text">
            {loi}
          </p>
          <button
            type="button"
            onClick={onThuLai}
            className="self-start rounded-10 bg-accent px-4 py-2 text-13 font-semibold text-white"
          >
            Thử lại
          </button>
        </div>
      )}

      {!dangTai && !loi && noiDung && (
        <div className="mt-4 flex flex-col gap-4">
          {muc('Dịch câu hỏi', noiDung.question_translation_vi)}
          {lang === 'zh' && muc('Phiên âm đáp án', noiDung.answer_pinyin)}
          {muc('Nghĩa đáp án', noiDung.answer_meaning_vi)}
          {muc('Vì sao đúng', noiDung.explanation_vi)}
        </div>
      )}

      <button
        type="button"
        onClick={onDong}
        className="mt-6 w-full rounded-14 bg-border-card py-3 text-15 font-semibold text-content-nav"
      >
        Đóng
      </button>
    </dialog>
  )
}
