import { useEffect, useMemo, useState } from 'react'
import { chamArrange, xaoTron, type PayloadSapXep, type VocabDb } from '../../../lib/player.ts'

/**
 * Pattern 3 — sắp xếp từ (mockup 04). Hàng dưới = chip chưa chọn (trung tính), khay trên = chip đã
 * chọn (tint tím). Bấm chip dưới → lên khay; bấm chip trên → trả về dưới. Đáp án đúng là thứ tự
 * `payload.tokens` GỐC; app chỉ xáo lúc hiển thị (§6.3 #13).
 * Gợi ý (DEC-19): mỗi lần bấm đưa đúng 1 chip tiếp theo vào khay.
 */
type Props = {
  vocab: VocabDb
  payload: PayloadSapXep
  hienPhienAm: boolean
  soGoiY: number
  onTraLoi: (dung: boolean, dung_goi_y: boolean) => void
}

const CHIP = 'rounded-10 px-[18px] py-[10px] font-han text-18 transition-colors'
const CHIP_CHUA = `${CHIP} border border-border-input bg-surface-raised text-content-primary`
const CHIP_DA = `${CHIP} border-[1.5px] border-accent bg-accent-tint font-semibold text-accent-text`

export default function SapXep({ vocab, payload, hienPhienAm, soGoiY, onTraLoi }: Props) {
  const xao = useMemo(() => xaoTron(payload.tokens, Math.random), [payload.tokens])
  const [khay, setKhay] = useState<number[]>([]) // chỉ số trong `xao`
  const [kq, setKq] = useState<boolean | null>(null)

  // Gợi ý: đưa chip đúng tiếp theo (theo thứ tự tokens gốc) vào khay
  useEffect(() => {
    if (soGoiY === 0) return
    setKhay((cu) => {
      if (cu.length >= payload.tokens.length) return cu
      const canTiep = payload.tokens[cu.length]?.text
      const i = xao.findIndex((t, idx) => t.text === canTiep && !cu.includes(idx))
      return i === -1 ? cu : [...cu, i]
    })
  }, [soGoiY, payload.tokens, xao])

  function kiemTra() {
    if (kq !== null || khay.length === 0) return
    const dung = chamArrange(khay.map((i) => xao[i]!.text), payload.tokens)
    setKq(dung)
    setTimeout(() => onTraLoi(dung, soGoiY > 0), dung ? 600 : 1000)
  }

  const vienKhay = kq === null ? 'border-border-card' : kq ? 'border-success' : 'border-danger'

  return (
    <div className="flex flex-col gap-[22px]">
      <p className="text-center text-15 text-content-nav">
        Sắp xếp thành câu: <b>{vocab.example_meaning_vi ?? vocab.meaning_vi}</b>
      </p>

      <div className={`flex min-h-16 flex-wrap content-start gap-[10px] rounded-16 border bg-surface-card p-[18px] ${vienKhay}`}>
        {khay.map((i) => (
          <button key={i} type="button" disabled={kq !== null} onClick={() => setKhay((c) => c.filter((x) => x !== i))} className={CHIP_DA}>
            {xao[i]!.text}
            {hienPhienAm && xao[i]!.pinyin && (
              <span className="ml-1.5 font-body text-11 font-normal opacity-70">{xao[i]!.pinyin}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-[10px]">
        {xao.map((t, i) =>
          khay.includes(i) ? null : (
            <button key={i} type="button" disabled={kq !== null} onClick={() => setKhay((c) => [...c, i])} className={CHIP_CHUA}>
              {t.text}
              {hienPhienAm && t.pinyin && (
                <span className="ml-1.5 font-body text-11 text-content-muted">{t.pinyin}</span>
              )}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={kiemTra}
        disabled={kq !== null || khay.length === 0}
        className="rounded-14 bg-accent py-[17px] text-16 font-semibold text-white disabled:opacity-60"
      >
        Kiểm tra
      </button>
    </div>
  )
}
