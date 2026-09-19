import { useMemo, useState } from 'react'
import { soKhopDapAn, xaoTron, type PayloadDialog, type VocabDb } from '../../../lib/player.ts'

/**
 * Pattern 7 — hội thoại điền chỗ trống (mockup 08). 1 record = 2 chỗ trống = 2 TỪ (§4.4):
 * chỗ A dùng `payload.blank_a_answer`, chỗ B dùng `word` của từ B (`payload.blank_b_vocab_id`).
 * Chấm 2 chỗ ĐỘC LẬP rồi trả về `{ a, b }`; tầng gọi quyết định từ nào được tính điểm (chỉ từ đang due).
 *
 * Select Dialog: 4 chip (đáp án A + từ B + 2 distractors, đã xáo), bấm điền vào chỗ đang chờ (A trước).
 * Fill Dialog: 2 ô nhập tay ngay tại chỗ trống (UI_DESIGN §6.3) + nút "Kiểm tra".
 * Gợi ý: Select ẩn 1 chip sai; Fill lộ đáp án chỗ A.
 */
type Props = {
  cheDo: 'select_dialog' | 'fill_dialog'
  payload: PayloadDialog
  tuB: VocabDb | null
  lang: 'zh' | 'en'
  hienPhienAm: boolean
  soGoiY: number
  onTraLoi: (kq: { a: boolean; b: boolean }, dung_goi_y: boolean) => void
}

const KHOI = 'flex-1 rounded-16 border border-border-card bg-surface-card p-4 md:p-5'
const CHIP = 'rounded-10 border border-border-input bg-surface-raised px-5 py-3 font-han text-17 text-content-primary'
const O_NHAP = 'mx-1 h-[46px] w-[42px] rounded-10 border-2 border-accent bg-surface-raised text-center font-han text-20 text-content-primary focus:outline-none'

export default function HoiThoai({ cheDo, payload, tuB, lang, hienPhienAm, soGoiY, onTraLoi }: Props) {
  const dapAnA = payload.blank_a_answer
  const dapAnB = tuB?.word ?? ''
  const [dienA, setDienA] = useState('')
  const [dienB, setDienB] = useState('')
  const [kq, setKq] = useState<{ a: boolean; b: boolean } | null>(null)

  const chip = useMemo(
    () => xaoTron([dapAnA, dapAnB, ...(payload.distractors ?? []).map((d) => d.word)].filter(Boolean), Math.random),
    [dapAnA, dapAnB, payload.distractors],
  )
  const anDi = useMemo(
    () => new Set(chip.filter((c) => c !== dapAnA && c !== dapAnB).slice(0, Math.min(soGoiY, 2))),
    [chip, dapAnA, dapAnB, soGoiY],
  )
  const goiYFill = soGoiY > 0 ? dapAnA : ''

  function chot(a: string, b: string) {
    const ket = { a: soKhopDapAn(a, dapAnA, lang), b: dapAnB ? soKhopDapAn(b, dapAnB, lang) : false }
    setKq(ket)
    setTimeout(() => onTraLoi(ket, soGoiY > 0), ket.a && ket.b ? 600 : 1000)
  }

  function bamChip(c: string) {
    if (kq) return
    if (!dienA) {
      setDienA(c)
      if (!dapAnB) chot(c, '')
      return
    }
    if (!dienB) {
      setDienB(c)
      chot(dienA, c)
    }
  }

  function oTrong(gia_tri: string, dat: (v: string) => void, dapAn: string) {
    if (cheDo === 'select_dialog') {
      const mau = !gia_tri
        ? 'text-accent'
        : kq === null
          ? 'text-accent-text'
          : soKhopDapAn(gia_tri, dapAn, lang)
            ? 'text-success-text'
            : 'text-danger-text'
      return <span className={`font-bold ${mau}`}>{gia_tri || '___'}</span>
    }
    return (
      <input
        value={gia_tri}
        onChange={(e) => dat(e.target.value)}
        disabled={kq !== null}
        lang={lang}
        aria-label="Điền vào chỗ trống"
        className={`${O_NHAP} ${kq === null ? '' : soKhopDapAn(gia_tri, dapAn, lang) ? 'border-success' : 'border-danger'}`}
      />
    )
  }

  function cau(text: string, gia_tri: string, dat: (v: string) => void, dapAn: string) {
    const [truoc, sau] = text.split('___')
    return (
      <span lang={lang} className="font-han text-18 text-content-primary md:text-19">
        {truoc}
        {oTrong(gia_tri, dat, dapAn)}
        {sau}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <div className={KHOI}>
          <div className="mb-2 text-13 font-bold text-content-muted">A</div>
          {cau(payload.dialog_a, dienA || goiYFill, setDienA, dapAnA)}
          {hienPhienAm && payload.dialog_a_pinyin && (
            <div className="mt-2 text-12 text-content-muted">{payload.dialog_a_pinyin}</div>
          )}
        </div>
        <div className={KHOI}>
          <div className="mb-2 text-13 font-bold text-content-muted">B</div>
          {cau(payload.dialog_b, dienB, setDienB, dapAnB)}
          {hienPhienAm && payload.dialog_b_pinyin && (
            <div className="mt-2 text-12 text-content-muted">{payload.dialog_b_pinyin}</div>
          )}
        </div>
      </div>

      {cheDo === 'select_dialog' ? (
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          {chip.map((c) => (
            <button
              key={c}
              type="button"
              disabled={kq !== null || dienB !== '' || anDi.has(c)}
              onClick={() => bamChip(c)}
              className={`${CHIP} ${anDi.has(c) ? 'invisible' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => kq === null && chot(dienA || goiYFill, dienB)}
          disabled={kq !== null || (!dienA && !goiYFill) || (Boolean(dapAnB) && !dienB)}
          className="rounded-14 bg-accent py-[17px] text-16 font-semibold text-white disabled:opacity-60"
        >
          Kiểm tra
        </button>
      )}
    </div>
  )
}
