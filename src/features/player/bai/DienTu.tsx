import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../../components/icons.tsx'
import { soKhopDapAn, type VocabDb } from '../../../lib/player.ts'
import { phatAm } from '../../../lib/tts.ts'

/**
 * Pattern 2 — điền từ nhập tay (mockup 03): Translate · Listen Fill · Trans Collocation.
 *
 * ⚠️ Ô ký tự KHÔNG phải N `<input maxLength={1}>`: IME tiếng Trung cần gõ nhiều ký tự latin trước khi
 * ra chữ Hán, ô 1 ký tự sẽ chặn IME. Dùng 1 `<input>` thật trong suốt phủ lên, bên dưới render N ô
 * hiển thị từng ký tự đã gõ. Tiếng Anh dùng 1 ô nhập dài (doctor = 6 ô rời trông rối).
 *
 * Gợi ý (DEC-19, progressive §6.1): mỗi lần bấm lộ thêm 1 ký tự, không bao giờ lộ ký tự cuối.
 */
type Props = {
  vocab: VocabDb
  cheDo: 'translate' | 'listen_fill' | 'trans_collocation'
  hienPhienAm: boolean
  soGoiY: number
  onTraLoi: (dung: boolean, dung_goi_y: boolean) => void
}

const O = 'flex items-center justify-center font-han text-26 md:text-28 h-[56px] w-[52px] md:h-[62px] md:w-[58px]'

export default function DienTu({ vocab, cheDo, hienPhienAm, soGoiY, onTraLoi }: Props) {
  const dapAn = (cheDo === 'trans_collocation' ? vocab.collocation : vocab.word) ?? ''
  const [giaTri, setGiaTri] = useState('')
  const [kq, setKq] = useState<boolean | null>(null)
  const oNhap = useRef<HTMLInputElement>(null)

  // Gợi ý: lộ dần ký tự đầu (giữ lại ít nhất 1 ký tự cuối để người học tự nhớ)
  useEffect(() => {
    if (soGoiY > 0) setGiaTri(dapAn.slice(0, Math.min(soGoiY, Math.max(dapAn.length - 1, 0))))
  }, [soGoiY, dapAn])

  useEffect(() => {
    if (cheDo === 'listen_fill') phatAm(vocab.word, vocab.lang, vocab.audio_url)
  }, [cheDo, vocab.id, vocab.word, vocab.lang, vocab.audio_url])

  function kiemTra() {
    if (kq !== null || !giaTri.trim()) return
    const dung = soKhopDapAn(giaTri, dapAn, vocab.lang)
    setKq(dung)
    setTimeout(() => onTraLoi(dung, soGoiY > 0), dung ? 600 : 1000)
  }

  const de =
    cheDo === 'trans_collocation'
      ? { chinh: vocab.collocation_meaning_vi ?? vocab.meaning_vi, phu: 'Nhập cụm từ' }
      : { chinh: vocab.meaning_vi, phu: vocab.lang === 'zh' ? 'Nhập từ tiếng Trung' : 'Nhập từ tiếng Anh' }

  const vienKq = kq === null ? 'border-accent' : kq ? 'border-success' : 'border-danger'
  const chuKq = kq === null ? 'text-content-primary' : kq ? 'text-success-text' : 'text-danger-text'

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-20 border border-border-card bg-surface-card px-7 py-9 text-center">
        {cheDo === 'listen_fill' ? (
          <button
            type="button"
            onClick={() => phatAm(vocab.word, vocab.lang, vocab.audio_url)}
            aria-label="Nghe lại"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-pill bg-accent-tint text-accent"
          >
            <Icon ten="loa" size={28} />
          </button>
        ) : (
          <div className="text-26 font-semibold text-content-primary">{de.chinh}</div>
        )}
        <div className="mt-[10px] text-15 text-content-muted">
          {cheDo === 'listen_fill' ? 'Nghe và gõ lại từ' : de.phu}
          {hienPhienAm && cheDo === 'trans_collocation' && vocab.collocation_pinyin
            ? ` · ${vocab.collocation_pinyin}`
            : ''}
        </div>
      </div>

      {vocab.lang === 'zh' ? (
        <button type="button" onClick={() => oNhap.current?.focus()} className="relative flex justify-center gap-4">
          {Array.from({ length: Math.max(dapAn.length, 1) }, (_, i) => {
            const ch = giaTri[i]
            return (
              <span
                key={i}
                className={
                  ch
                    ? `${O} rounded-10 border-2 md:rounded-12 ${vienKq} ${chuKq}`
                    : `${O} border-b-2 border-border-input text-content-faint`
                }
              >
                {ch ?? '?'}
              </span>
            )
          })}
          <input
            ref={oNhap}
            lang={vocab.lang}
            value={giaTri}
            onChange={(e) => setGiaTri(e.target.value.slice(0, dapAn.length))}
            onKeyDown={(e) => e.key === 'Enter' && kiemTra()}
            disabled={kq !== null}
            autoFocus
            aria-label="Nhập đáp án"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </button>
      ) : (
        <input
          ref={oNhap}
          value={giaTri}
          onChange={(e) => setGiaTri(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && kiemTra()}
          disabled={kq !== null}
          autoFocus
          aria-label="Nhập đáp án"
          className={`mx-auto w-full max-w-[320px] rounded-12 border-2 bg-surface-raised px-4 py-3 text-center text-20 focus:outline-none ${vienKq} ${chuKq}`}
        />
      )}

      <button
        type="button"
        onClick={kiemTra}
        disabled={kq !== null || !giaTri.trim()}
        className="rounded-14 bg-accent py-[17px] text-16 font-semibold text-white disabled:opacity-60"
      >
        Kiểm tra
      </button>
    </div>
  )
}
