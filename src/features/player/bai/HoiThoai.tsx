import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { phatAmThanh } from '../../../lib/amThanh.ts'
import { amKhiCham } from '../../../lib/amThanhCore.ts'
import {
  chamLuot,
  dienChip,
  goO,
  oGoiY,
  oGoLui,
  soKhopDapAn,
  tachChoTrong,
  xaoTron,
  type ChipTrongO,
  type PayloadDialog,
  type VocabDb,
} from '../../../lib/player.ts'
import { useDungPhim, soThuTuPhim } from '../dungPhim.ts'

/**
 * Pattern 7 — hội thoại điền chỗ trống (mockup 08). 1 record = 2 chỗ trống = 2 TỪ (§4.4):
 * chỗ A dùng `payload.blank_a_answer`, chỗ B dùng `word` của từ B (`payload.blank_b_vocab_id`).
 * Chấm 2 chỗ ĐỘC LẬP rồi trả về `{ a, b }`; tầng gọi quyết định từ nào được tính điểm (chỉ từ đang due).
 *
 * Select Dialog: 4 chip (đáp án A + từ B + 2 distractors, đã xáo), bấm điền vào chỗ đang chờ (A trước).
 * M28: chip đã điền ẩn (giữ chỗ) khỏi khu chọn; bấm từ trong câu (hoặc Backspace, B rồi A) để gỡ về khu chọn.
 * Chỉ chấm khi bấm "Kiểm tra" / Enter — điền/gỡ trước đó KHÔNG tính là sai.
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
  // M28 — Select giữ CHỈ SỐ chip trong mỗi ô; chữ hiển thị suy ra từ `chip`
  const laChon = cheDo === 'select_dialog'
  const [chon, setChon] = useState<ChipTrongO>({ a: null, b: null })
  const giaA = laChon ? (chon.a === null ? '' : (chip[chon.a] ?? '')) : dienA
  const giaB = laChon ? (chon.b === null ? '' : (chip[chon.b] ?? '')) : dienB

  // M11/#5: lộ LẦN LƯỢT các ô CHƯA điền (A rồi B). Lỗi cũ chỉ lộ ô A nên ô B không bao giờ được gợi ý.
  // M28: chỉ Fill mới lộ chữ vào câu — Select gợi ý = ẩn chip sai (chữ lộ sẽ trông như từ đã điền).
  const oDuocGoiY = laChon ? [] : oGoiY(soGoiY, giaA, giaB, Boolean(dapAnB))
  const goiYFill = oDuocGoiY.includes('a') ? dapAnA : ''
  const goiYFillB = oDuocGoiY.includes('b') ? dapAnB : ''

  const coB = Boolean(dapAnB)
  const nopA = giaA || goiYFill
  const nopB = giaB || goiYFillB
  const du = Boolean(nopA) && (!coB || Boolean(nopB))
  // M25 — ô đã đúng (giữ xanh + khoá) · chip đã chọn sai (mờ + khoá) · ô nào từng sai (điểm theo lần đầu)
  const [dungRoi, setDungRoi] = useState({ a: false, b: false })
  const [khoa, setKhoa] = useState<Set<number>>(() => new Set())
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
    const dang = chon
    hen.current = setTimeout(() => {
      if (cham.ghi) return onTraLoi({ a: cham.ghi.a ?? false, b: cham.ghi.b ?? false }, goiY)
      // M25 — ô đúng giữ + khoá; ô sai làm lại. Chip sai mờ + khoá TRỪ KHI là đáp án của ô kia.
      setDungRoi({ a: ket.a ?? false, b: ket.b ?? false })
      if (cheDo === 'select_dialog') {
        setKhoa((k) => {
          const m = new Set(k)
          for (const o of ['a', 'b'] as const) {
            const i = dang[o]
            const c = i === null ? '' : (chip[i] ?? '')
            if (!ket[o] && i !== null && c !== dapAnA && c !== dapAnB) m.add(i)
          }
          return m
        })
        // Ô sai trống lại ⇒ chip của nó tự hiện lại ở khu chọn (mờ nếu vừa bị khoá)
        setChon((x) => ({ a: ket.a ? x.a : null, b: coB && !ket.b ? null : x.b }))
      }
      setKq(null)
      // Fill: GIỮ chữ đã gõ ở ô sai + bôi đen (ô bị disabled lúc chấm ⇒ đợi 1 frame mới select được)
      if (cheDo === 'fill_dialog') requestAnimationFrame(() => (ket.a ? oB : oA).current?.select())
    }, dungHet ? 600 : 800)
  }

  // M11/Q2-Q3 + M28: Enter = Kiểm tra (cả 2 chế độ) · chế độ chọn: 1–4 = chip thứ n, Backspace = gỡ ô B rồi A
  useDungPhim((e) => {
    if (kq !== null) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (du) chot(nopA, nopB)
      return
    }
    if (!laChon) return
    if (e.key === 'Backspace') {
      const k = oGoLui(chon, dungRoi)
      if (k) {
        e.preventDefault()
        goTu(k)
      }
      return
    }
    const i = soThuTuPhim(e, chip.length)
    if (i === null) return
    const c = chip[i]
    if (!c || anDi.has(c) || khoa.has(i) || chon.a === i || chon.b === i) return
    e.preventDefault()
    bamChip(i)
  }, true)

  /** M28 — điền chip vào ô trống đầu tiên (A trước); KHÔNG tự chấm, chờ "Kiểm tra". Ô đúng từ lần trước vẫn giữ (M25). */
  function bamChip(i: number) {
    if (kq || khoa.has(i)) return
    setChon((x) => dienChip(x, i, coB))
  }

  /** M28 — gỡ từ khỏi ô, chip quay lại khu chọn. Ô đã chấm đúng bị khoá. */
  function goTu(k: 'a' | 'b') {
    if (kq) return
    setChon((x) => goO(x, k, dungRoi))
  }

  function oTrong(gia_tri: string, dat: (v: string) => void, dapAn: string, o: 'a' | 'b', ref: RefObject<HTMLInputElement | null>) {
    if (cheDo === 'select_dialog') {
      if (!gia_tri) return <span className="font-bold text-accent">___</span>
      const mau =
        kq === null
          ? dungRoi[o]
            ? 'text-success-text'
            : 'text-accent-text'
          : soKhopDapAn(gia_tri, dapAn, lang)
            ? 'text-success-text'
            : 'text-danger-text'
      // M28 — từ đã điền là NÚT gỡ (nền tím nhạt báo hiệu bấm được); ô đã đúng / đang chấm thì thành chữ thường
      const goDuoc = kq === null && !dungRoi[o]
      return (
        <button
          type="button"
          onClick={() => goTu(o)}
          disabled={!goDuoc}
          aria-label={`Gỡ ${gia_tri} khỏi câu`}
          className={`mx-0.5 rounded-8 px-1.5 font-bold transition-opacity ${mau} ${goDuoc ? 'cursor-pointer bg-accent-tint hover:opacity-75' : ''}`}
        >
          {gia_tri}
        </button>
      )
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
          {cau(payload.dialog_a, nopA, setDienA, dapAnA, 'a', oA)}
          {hienPhienAm && payload.dialog_a_pinyin && (
            <div className="mt-2 text-12 text-content-muted">{payload.dialog_a_pinyin}</div>
          )}
        </div>
        <div className={KHOI}>
          <div className="mb-2 text-13 font-bold text-content-muted">B</div>
          {cau(payload.dialog_b, nopB, setDienB, dapAnB, 'b', oB)}
          {hienPhienAm && payload.dialog_b_pinyin && (
            <div className="mt-2 text-12 text-content-muted">{payload.dialog_b_pinyin}</div>
          )}
        </div>
      </div>

      {laChon && (
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          {chip.map((c, i) => {
            // M28 — chip đang nằm trong câu: ẩn nhưng GIỮ CHỖ ⇒ hàng không nhảy, phím 1–4 vẫn khớp
            const dangDung = chon.a === i || chon.b === i
            return (
              <button
                key={i}
                type="button"
                disabled={kq !== null || du || anDi.has(c) || khoa.has(i) || dangDung}
                onClick={() => bamChip(i)}
                className={`${CHIP} ${anDi.has(c) || dangDung ? 'invisible' : ''} ${khoa.has(i) ? 'opacity-40' : ''}`}
              >
                {c}
              </button>
            )
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => kq === null && du && chot(nopA, nopB)}
        disabled={kq !== null || !du}
        className="rounded-14 bg-accent py-[17px] text-16 font-semibold text-white disabled:opacity-60"
      >
        Kiểm tra
      </button>
    </div>
  )
}
