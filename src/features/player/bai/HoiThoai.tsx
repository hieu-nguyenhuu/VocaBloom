import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { phatAmThanh } from '../../../lib/amThanh.ts'
import { amKhiCham } from '../../../lib/amThanhCore.ts'
import { chamLuot, oGoiY, soKhopDapAn, tachChoTrong, xaoTron, type PayloadDialog, type VocabDb } from '../../../lib/player.ts'
import { useDungPhim, soThuTuPhim } from '../dungPhim.ts'

/**
 * Pattern 7 — hội thoại điền chỗ trống (mockup 08). 1 record = 2 chỗ trống = 2 TỪ (§4.4):
 * chỗ A dùng `payload.blank_a_answer`, chỗ B dùng `word` của từ B (`payload.blank_b_vocab_id`).
 * Chấm 2 chỗ ĐỘC LẬP rồi trả về `{ a, b }`; tầng gọi quyết định từ nào được tính điểm (chỉ từ đang due).
 *
 * Select Dialog: 4 chip (đáp án A + từ B + 2 distractors, đã xáo), bấm điền vào chỗ đang chờ (A trước).
 * Fill Dialog: 2 ô nhập tay ngay tại chỗ trống (UI_DESIGN §6.3) + nút "Kiểm tra".
 * Gợi ý: Select ẩn 1 chip sai; Fill lộ đáp án chỗ A.
 *
 * M25: sai → đỏ 800ms rồi ô ĐÚNG giữ xanh + khoá, chỉ ô SAI làm lại đến khi đúng (hoặc Bỏ qua). Select:
 * chip vừa chọn sai mờ + khoá, TRỪ KHI nó là đáp án của ô kia. Điểm từng ô theo LẦN ĐẦU (`chamLuot`).
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
  // M11/#5: lộ LẦN LƯỢT các ô CHƯA điền (A rồi B). Lỗi cũ chỉ lộ ô A nên ô B không bao giờ được gợi ý.
  const oDuocGoiY = oGoiY(soGoiY, dienA, dienB, Boolean(dapAnB))
  const goiYFill = oDuocGoiY.includes('a') ? dapAnA : ''
  const goiYFillB = oDuocGoiY.includes('b') ? dapAnB : ''

  const coB = Boolean(dapAnB)
  const dayDu = Boolean(dienA) && (!coB || Boolean(dienB))
  // M25 — ô đã đúng (giữ xanh + khoá) · chip đã chọn sai (mờ + khoá) · ô nào từng sai (điểm theo lần đầu)
  const [dungRoi, setDungRoi] = useState({ a: false, b: false })
  const [khoa, setKhoa] = useState<Set<string>>(() => new Set())
  const daSai = useRef<Partial<Record<string, boolean>>>({})
  const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const oA = useRef<HTMLInputElement>(null)
  const oB = useRef<HTMLInputElement>(null)
  useEffect(() => () => clearTimeout(hen.current), [])

  function chot(a: string, b: string) {
    // Chỉ chấm ô THỰC CÓ — thiếu từ B mà chấm `b: false` cố định thì màn kẹt vĩnh viễn (M25)
    const ket: Record<string, boolean> = { a: soKhopDapAn(a, dapAnA, lang), ...(coB ? { b: soKhopDapAn(b, dapAnB, lang) } : {}) }
    const dungHet = Object.values(ket).every(Boolean)
    const goiY = soGoiY > 0
    setKq({ a: ket.a ?? false, b: ket.b ?? false })
    // M17 — phát âm CÙNG khoảnh khắc tô xanh/đỏ, KHÔNG đợi tới lúc chuyển màn (DESIGN §4)
    // Đúng MỌI chỗ mới là đúng — cùng điều kiện với khoảng chờ ngay dưới để âm và nhịp chuyển màn khớp nhau
    phatAmThanh(amKhiCham(dungHet, goiY))
    const cham = chamLuot(daSai.current, ket)
    daSai.current = cham.daSai
    hen.current = setTimeout(() => {
      if (cham.ghi) return onTraLoi({ a: cham.ghi.a ?? false, b: cham.ghi.b ?? false }, goiY)
      // M25 — ô đúng giữ + khoá; ô sai làm lại. Chip sai mờ + khoá TRỪ KHI là đáp án của ô kia.
      setDungRoi({ a: ket.a ?? false, b: ket.b ?? false })
      if (cheDo === 'select_dialog') {
        setKhoa((k) => {
          const m = new Set(k)
          for (const [o, c] of [['a', a], ['b', b]] as const) if (!ket[o] && c && c !== dapAnA && c !== dapAnB) m.add(c)
          return m
        })
        if (!ket.a) setDienA('')
        if (coB && !ket.b) setDienB('')
      }
      setKq(null)
      // Fill: GIỮ chữ đã gõ ở ô sai + bôi đen (ô bị disabled lúc chấm ⇒ đợi 1 frame mới select được)
      if (cheDo === 'fill_dialog') requestAnimationFrame(() => (ket.a ? oB : oA).current?.select())
    }, dungHet ? 600 : 800)
  }

  // M11/Q2-Q3: Enter = Kiểm tra (chế độ điền) · phím 1–4 = chọn chip thứ n (chế độ chọn)
  useDungPhim((e) => {
    if (kq !== null) return
    if (cheDo === 'fill_dialog') {
      if (e.key !== 'Enter') return
      e.preventDefault()
      const a = dienA || goiYFill
      const b = dienB || goiYFillB
      if (a && (!dapAnB || b)) chot(a, b)
      return
    }
    const i = soThuTuPhim(e, chip.length)
    if (i === null) return
    const c = chip[i]
    if (!c || anDi.has(c) || khoa.has(c) || dayDu) return
    e.preventDefault()
    bamChip(c)
  }, true)

  /** Điền ô trống đầu tiên (A trước); đủ mọi ô thực có thì chấm. Sau 1 lần sai, ô đúng vẫn giữ (M25). */
  function bamChip(c: string) {
    if (kq || khoa.has(c)) return
    if (!dienA) {
      setDienA(c)
      if (!coB || dienB) chot(c, dienB)
      return
    }
    if (coB && !dienB) {
      setDienB(c)
      chot(dienA, c)
    }
  }

  function oTrong(gia_tri: string, dat: (v: string) => void, dapAn: string, o: 'a' | 'b', ref: RefObject<HTMLInputElement | null>) {
    if (cheDo === 'select_dialog') {
      const mau = !gia_tri
        ? 'text-accent'
        : kq === null
          ? dungRoi[o]
            ? 'text-success-text'
            : 'text-accent-text'
          : soKhopDapAn(gia_tri, dapAn, lang)
            ? 'text-success-text'
            : 'text-danger-text'
      return <span className={`font-bold ${mau}`}>{gia_tri || '___'}</span>
    }
    const vien = kq === null ? (dungRoi[o] ? 'border-success' : '') : soKhopDapAn(gia_tri, dapAn, lang) ? 'border-success' : 'border-danger'
    return (
      <input
        ref={ref}
        value={gia_tri}
        onChange={(e) => dat(e.target.value)}
        disabled={kq !== null || dungRoi[o]}
        lang={lang}
        aria-label="Điền vào chỗ trống"
        className={`${O_NHAP} ${vien}`}
      />
    )
  }

  function cau(text: string, gia_tri: string, dat: (v: string) => void, dapAn: string, o: 'a' | 'b', ref: RefObject<HTMLInputElement | null>) {
    // Dữ liệu chuẩn: mỗi câu đúng 1 dấu `___`. `tachChoTrong` chịu được cả câu 0 hoặc nhiều dấu
    // mà không nuốt mất chữ (bản cũ split rồi lấy 2 phần đầu ⇒ ô trống nhảy lung tung).
    const { truoc, sau } = tachChoTrong(text)
    return (
      <span lang={lang} className="font-han text-18 text-content-primary md:text-19">
        {truoc}
        {sau !== null && oTrong(gia_tri, dat, dapAn, o, ref)}
        {sau}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <div className={KHOI}>
          <div className="mb-2 text-13 font-bold text-content-muted">A</div>
          {cau(payload.dialog_a, dienA || goiYFill, setDienA, dapAnA, 'a', oA)}
          {hienPhienAm && payload.dialog_a_pinyin && (
            <div className="mt-2 text-12 text-content-muted">{payload.dialog_a_pinyin}</div>
          )}
        </div>
        <div className={KHOI}>
          <div className="mb-2 text-13 font-bold text-content-muted">B</div>
          {cau(payload.dialog_b, dienB || goiYFillB, setDienB, dapAnB, 'b', oB)}
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
              disabled={kq !== null || dayDu || anDi.has(c) || khoa.has(c)}
              onClick={() => bamChip(c)}
              className={`${CHIP} ${anDi.has(c) ? 'invisible' : ''} ${khoa.has(c) ? 'opacity-40' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => kq === null && chot(dienA || goiYFill, dienB || goiYFillB)}
          disabled={kq !== null || (!dienA && !goiYFill) || (Boolean(dapAnB) && !dienB && !goiYFillB)}
          className="rounded-14 bg-accent py-[17px] text-16 font-semibold text-white disabled:opacity-60"
        >
          Kiểm tra
        </button>
      )}
    </div>
  )
}
