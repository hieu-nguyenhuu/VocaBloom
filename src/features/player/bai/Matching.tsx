import { useMemo, useState } from 'react'
import { chamMatching, xaoTron, type VocabDb } from '../../../lib/player.ts'

/**
 * Pattern 4 — ghép cặp (mockup 05): 2 cột × N, vận hành trên cả session nên KHÔNG có ring/dots.
 * Chọn trái (tint tím) → chọn phải; đúng → cả 2 ô xanh mờ + khoá; sai → ô phải đỏ 600ms rồi bỏ chọn.
 * Điểm: mỗi từ đúng nếu lần chạm ĐẦU TIÊN tới nó là đúng (chamMatching, thuần).
 */
type Props = { dsTu: VocabDb[]; onXong: (kq: Record<string, boolean>) => void }

const O = 'rounded-14 border p-[18px] text-center transition-colors'
const O_TRUNG_TINH = `${O} border-border-input bg-surface-raised text-content-primary`
const O_CHON = `${O} border-[1.5px] border-accent bg-accent-tint font-semibold text-accent-text`
const O_XONG = `${O} border-[1.5px] border-success bg-success-bg font-semibold text-success-text opacity-70`
const O_SAI = `${O} border-[1.5px] border-danger bg-danger-bg font-semibold text-danger-text`

export default function Matching({ dsTu, onXong }: Props) {
  const trai = useMemo(() => xaoTron(dsTu, Math.random), [dsTu])
  const phai = useMemo(() => xaoTron(dsTu, Math.random), [dsTu])
  const dapAn = useMemo(() => Object.fromEntries(dsTu.map((v) => [v.id, v.meaning_vi])), [dsTu])

  const [chonTrai, setChonTrai] = useState<string | null>(null)
  const [daGhep, setDaGhep] = useState<Set<string>>(new Set())
  const [luot, setLuot] = useState<{ trai: string; phai: string }[]>([])
  const [saiTam, setSaiTam] = useState<string | null>(null)

  function chamPhai(v: VocabDb) {
    if (!chonTrai || daGhep.has(v.id) || saiTam) return
    const luotMoi = [...luot, { trai: chonTrai, phai: v.meaning_vi }]
    setLuot(luotMoi)
    if (dapAn[chonTrai] === v.meaning_vi) {
      const moi = new Set(daGhep).add(chonTrai)
      setDaGhep(moi)
      setChonTrai(null)
      if (moi.size === dsTu.length) onXong(chamMatching(luotMoi, dapAn))
    } else {
      setSaiTam(v.id)
      setTimeout(() => {
        setSaiTam(null)
        setChonTrai(null)
      }, 600)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-22 font-bold text-content-primary">Ghép cặp</h1>
        <span className="text-14 font-semibold text-content-muted">
          {daGhep.size}/{dsTu.length} đã ghép
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-[14px]">
          {trai.map((v) => (
            <button
              key={v.id}
              type="button"
              lang={v.lang}
              disabled={daGhep.has(v.id)}
              onClick={() => setChonTrai(v.id)}
              className={`${daGhep.has(v.id) ? O_XONG : chonTrai === v.id ? O_CHON : O_TRUNG_TINH} font-han text-17`}
            >
              {v.word}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-[14px]">
          {phai.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={daGhep.has(v.id)}
              onClick={() => chamPhai(v)}
              className={`${daGhep.has(v.id) ? O_XONG : saiTam === v.id ? O_SAI : O_TRUNG_TINH} text-15`}
            >
              {v.meaning_vi}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
