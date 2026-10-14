import { useEffect, useMemo, useRef, useState } from 'react'
import { phatAmThanh } from '../../../lib/amThanh.ts'
import { amKhiCham } from '../../../lib/amThanhCore.ts'
import { useDungPhim } from '../dungPhim.ts'
import { chamArrange, chamLuot, xaoTron, type PayloadSapXep, type VocabDb } from '../../../lib/player.ts'

/**
 * Pattern 3 — sắp xếp từ (mockup 04). Hàng dưới = chip chưa chọn (trung tính), khay trên = chip đã
 * chọn (tint tím). Bấm chip dưới → lên khay; bấm chip trên → trả về dưới. M30: hàng dưới KHÔNG BAO GIỜ
 * gỡ chip khỏi DOM — chip đã lên khay thành ô xám giữ chỗ, nên không chip nào nhảy vị trí. Đáp án đúng là thứ tự
 * `payload.tokens` GỐC; app chỉ xáo lúc hiển thị (§6.3 #13).
 * Gợi ý (DEC-19): mỗi lần bấm đưa đúng 1 chip tiếp theo vào khay.
 * M25: sai → viền khay đỏ 800ms rồi GIỮ chip trong khay để gỡ/xếp lại đến khi đúng (hoặc Bỏ qua).
 * Điểm theo LẦN ĐẦU (`chamLuot`) ⇒ `onTraLoi` chỉ gọi 1 lần, khi đã đúng.
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
// M30 — chip đã lên khay vẫn GIỮ CHỖ ở hàng dưới (cùng viền 1px như CHIP_CHUA ⇒ không đổi bề rộng)
const CHIP_GIU_CHO = `${CHIP} border border-border-input bg-surface-sunken text-content-muted opacity-50 cursor-default`

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

  // M11/Q2: Enter = Kiểm tra
  useDungPhim((e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    kiemTra()
  })

  const daSai = useRef<Partial<Record<'x', boolean>>>({})
  const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(hen.current), [])

  function kiemTra() {
    if (kq !== null || khay.length === 0) return
    const dung = chamArrange(khay.map((i) => xao[i]!.text), payload.tokens)
    const goiY = soGoiY > 0
    setKq(dung)
    // M17 — phát âm CÙNG khoảnh khắc tô xanh/đỏ, KHÔNG đợi tới lúc chuyển màn (DESIGN §4)
    phatAmThanh(amKhiCham(dung, goiY))
    const cham = chamLuot(daSai.current, { x: dung })
    daSai.current = cham.daSai
    hen.current = setTimeout(() => {
      if (cham.ghi) return onTraLoi(cham.ghi.x, goiY)
      setKq(null) // M25 — bỏ đỏ, khay giữ nguyên, chip bật lại để gỡ/xếp lại
    }, dung ? 600 : 800)
  }

  const vienKhay = kq === null ? 'border-border-card' : kq ? 'border-success' : 'border-danger'

  return (
    <div className="flex flex-col gap-[22px]">
      <p className="text-center text-15 text-content-nav">
        Sắp xếp thành câu: <b>{vocab.example_meaning_vi ?? vocab.meaning_vi}</b>
      </p>

      <div className={`grid rounded-16 border bg-surface-card p-[18px] ${vienKhay}`}>
        {/* M30 — bản ma VÔ HÌNH của cả câu, chồng cùng ô grid: khay cao sẵn bằng câu hoàn chỉnh ngay từ đầu
            ⇒ chọn/gỡ chip không làm khay cao lên và đẩy hàng dưới xuống */}
        <div aria-hidden className="invisible col-start-1 row-start-1 flex flex-wrap content-start gap-[10px]">
          {payload.tokens.map((t, i) => (
            <span key={i} className={CHIP_DA}>
              {t.text}
              {hienPhienAm && t.pinyin && <span className="ml-1.5 font-body text-11 font-normal">{t.pinyin}</span>}
            </span>
          ))}
        </div>
        <div className="col-start-1 row-start-1 flex flex-wrap content-start gap-[10px]">
          {khay.map((i) => (
            <button key={i} type="button" disabled={kq !== null} onClick={() => setKhay((c) => c.filter((x) => x !== i))} className={CHIP_DA}>
              {xao[i]!.text}
              {hienPhienAm && xao[i]!.pinyin && (
                <span className="ml-1.5 font-body text-11 font-normal opacity-70">{xao[i]!.pinyin}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-[10px]">
        {xao.map((t, i) => {
          const daChon = khay.includes(i)
          return (
            <button key={i} type="button" disabled={kq !== null || daChon} tabIndex={daChon ? -1 : undefined}
              onClick={() => setKhay((c) => [...c, i])} className={daChon ? CHIP_GIU_CHO : CHIP_CHUA}>
              {t.text}
              {hienPhienAm && t.pinyin && (
                <span className="ml-1.5 font-body text-11 text-content-muted">{t.pinyin}</span>
              )}
            </button>
          )
        })}
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
