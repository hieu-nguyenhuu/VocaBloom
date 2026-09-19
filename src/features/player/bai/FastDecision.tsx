import { useEffect, useMemo, useRef, useState } from 'react'
import { chonNghiaFastDecision, type PayloadFastDecision, type VocabDb } from '../../../lib/player.ts'

/**
 * Pattern 6 — chọn nhanh có đếm ngược 4s (mockup 07). App random 50/50 lúc runtime (§6.1 #6).
 * Thanh đếm co dần bằng CSS transition (0 JS mỗi frame); hết giờ = sai. Không có gợi ý.
 * 2 nút tô sẵn màu theo ý nghĩa nhãn (Sai đỏ / Đúng xanh) — không phải lộ đáp án (§6.3).
 *
 * Component được mount lại mỗi màn (key = chi_so) nên không cần reset state trong effect.
 * ⚠️ Trả lời đúng 1 lần duy nhất được chốt bằng REF, không đặt side-effect trong updater của
 * setState — React (StrictMode) gọi updater 2 lần → từng ghi 2 dòng review_log (bug kiểm thật M4a).
 */
const GIOI_HAN_MS = 4000

type Props = {
  vocab: VocabDb
  payload: PayloadFastDecision
  hienPhienAm: boolean
  onTraLoi: (dung: boolean, dung_goi_y: boolean) => void
}

export default function FastDecision({ vocab, payload, hienPhienAm, onTraLoi }: Props) {
  const { hien, la_dung } = useMemo(
    () => chonNghiaFastDecision(vocab.meaning_vi, payload.wrong_meaning, Math.random),
    [vocab.meaning_vi, payload.wrong_meaning],
  )
  const [chay, setChay] = useState(false)
  const [daTraLoi, setDaTraLoi] = useState(false)
  const daTraLoiRef = useRef(false)
  const onTraLoiRef = useRef(onTraLoi)
  useEffect(() => {
    onTraLoiRef.current = onTraLoi
  }, [onTraLoi])

  function chot(dung: boolean) {
    if (daTraLoiRef.current) return
    daTraLoiRef.current = true
    setDaTraLoi(true)
    onTraLoiRef.current(dung, false)
  }

  useEffect(() => {
    const raf = requestAnimationFrame(() => setChay(true))
    const t = setTimeout(() => chot(false), GIOI_HAN_MS)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy 1 lần mỗi lần mount
  }, [])

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="h-[10px] overflow-hidden rounded-pill bg-border-card">
        <div
          className="h-full bg-warn transition-[width] ease-linear"
          style={{ width: chay ? '0%' : '100%', transitionDuration: `${GIOI_HAN_MS}ms` }}
        />
      </div>
      <div className="rounded-20 border border-border-card bg-surface-card px-7 py-10 text-center">
        <div lang={vocab.lang} className="font-han text-40 font-semibold text-content-primary">
          {vocab.word}
        </div>
        {hienPhienAm && vocab.pinyin && <div className="mt-2 text-14 text-content-muted">{vocab.pinyin}</div>}
        <div className="mt-[14px] text-17 text-content-nav">
          = <b>{hien}</b> ?
        </div>
      </div>
      <div className="flex gap-[14px]">
        <button
          type="button"
          disabled={daTraLoi}
          onClick={() => chot(false === la_dung)}
          className="flex-1 rounded-16 bg-danger-bg p-6 text-18 font-bold text-danger-text disabled:opacity-60"
        >
          Sai
        </button>
        <button
          type="button"
          disabled={daTraLoi}
          onClick={() => chot(true === la_dung)}
          className="flex-1 rounded-16 bg-success-bg p-6 text-18 font-bold text-success-text disabled:opacity-60"
        >
          Đúng
        </button>
      </div>
    </div>
  )
}
