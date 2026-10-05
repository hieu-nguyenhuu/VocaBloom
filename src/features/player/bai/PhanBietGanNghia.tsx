import { useEffect, useMemo, useRef, useState } from 'react'
import { phatAmThanh } from '../../../lib/amThanh.ts'
import { amKhiCham } from '../../../lib/amThanhCore.ts'
import { chamLuot, xaoTron, type PayloadGanNghia, type VocabDb } from '../../../lib/player.ts'
import { bangGanNghia, ngonNguPhu } from '../../../lib/songNgu.ts'
import { useDungPhim, soThuTuPhim } from '../dungPhim.ts'

/**
 * M26d — "Phân biệt từ gần nghĩa" (CHƯA CÓ MOCKUP — Design.m26.md §5, biến thể Pattern 1 + thẻ câu Pattern 7).
 * Đề: câu Trung có 1 chỗ `___` (+pinyin theo nút 拼). Câu ngôn ngữ phụ CHỈ hiện SAU khi đúng (D1 — câu Anh
 * thường chứa nguyên văn nghĩa Anh của đáp án, hiện sẵn thì bài thành dịch ngược).
 * Chọn sai: luật M25 (đỏ 800ms → mờ + khoá, chọn lại). Đúng: xanh 600ms → bảng so sánh 4 từ → "Tiếp tục".
 * Điểm theo LẦN ĐẦU (`chamLuot`); `onTraLoi` gọi ĐÚNG 1 lần, khi bấm Tiếp tục (D3: X lúc xem bảng ⇒ không ghi).
 * Gợi ý (DEC-19): ẩn dần 1 đáp án sai/lần, tối đa 2 — như Trắc nghiệm.
 */
type Props = {
  vocab: VocabDb
  payload: PayloadGanNghia
  hienPhienAm: boolean
  soGoiY: number
  onTraLoi: (dung: boolean, dung_goi_y: boolean) => void
}

// Kiểu ô CHÉP từ TracNghiem — 0 màu/token mới (D2)
const O = 'rounded-14 border transition-colors'
const O_TRUNG_TINH = `${O} border-border-input bg-surface-raised font-medium text-content-primary`
const O_SAI = `${O} border-[1.5px] border-danger bg-danger-bg font-semibold text-danger-text`
const O_DUNG = `${O} border-[1.5px] border-success bg-success-bg font-semibold text-success-text`

/** Tách câu tại `___` đầu tiên (validator import bảo đảm đúng 1 chỗ). */
function tachMotCho(s: string): [string, string] {
  const i = s.indexOf('___')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 3)]
}

export default function PhanBietGanNghia({ vocab, payload, hienPhienAm, soGoiY, onTraLoi }: Props) {
  // Xáo ĐÚNG 1 LẦN khi mount (bài học TracNghiem 20/09: Player tạo mảng mới mỗi render)
  const [luaChon] = useState(() => xaoTron([vocab.word, ...payload.distractors.map((d) => d.word)], Math.random))
  const pinyinCua = useMemo(
    () => new Map<string, string | null | undefined>([[vocab.word, vocab.pinyin], ...payload.distractors.map((d) => [d.word, d.pinyin] as const)]),
    [vocab.word, vocab.pinyin, payload.distractors],
  )
  const [daChon, setDaChon] = useState<string | null>(null)
  const [khoa, setKhoa] = useState<Set<string>>(() => new Set())
  const [xong, setXong] = useState(false)
  const anDi = useMemo(
    () => new Set(luaChon.filter((x) => x !== vocab.word).slice(0, Math.min(soGoiY, 2))),
    [luaChon, vocab.word, soGoiY],
  )

  // Callback qua ref + `daGui`: 1 màn chỉ gửi đúng 1 lần (MB-20, M11)
  const onTraLoiRef = useRef(onTraLoi)
  useEffect(() => {
    onTraLoiRef.current = onTraLoi
  }, [onTraLoi])
  const daSai = useRef<Partial<Record<'x', boolean>>>({})
  const ketQua = useRef<{ dung: boolean; goiY: boolean } | null>(null)
  const daGui = useRef(false)
  const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(hen.current), [])

  // Chấm trong HANDLER (không trong effect) ⇒ StrictMode không gọi đôi
  function chon(x: string) {
    if (xong || daChon !== null || khoa.has(x) || anDi.has(x)) return
    setDaChon(x)
    const dung = x === vocab.word
    const goiY = soGoiY > 0
    // M17 — phát âm CÙNG khoảnh khắc tô xanh/đỏ (test X5)
    phatAmThanh(amKhiCham(dung, goiY))
    const kq = chamLuot(daSai.current, { x: dung })
    daSai.current = kq.daSai
    if (kq.ghi) ketQua.current = { dung: kq.ghi.x, goiY }
    hen.current = setTimeout(() => {
      if (kq.ghi) return setXong(true)
      // M25 — sai: bỏ đỏ, ô vừa chọn mờ + khoá, chọn tiếp (không lộ đáp án đúng)
      setKhoa((k) => new Set(k).add(x))
      setDaChon(null)
    }, dung ? 600 : 800)
  }

  function tiepTuc() {
    if (!xong || daGui.current || !ketQua.current) return
    daGui.current = true
    onTraLoiRef.current(ketQua.current.dung, ketQua.current.goiY)
  }

  // M11/Q3: 1–4 chọn đáp án; Enter = "Tiếp tục" khi đang xem bảng
  useDungPhim((e) => {
    if (xong) {
      if (e.key !== 'Enter') return
      e.preventDefault()
      tiepTuc()
      return
    }
    if (daChon !== null) return
    const i = soThuTuPhim(e, luaChon.length)
    if (i === null) return
    const x = luaChon[i]
    if (!x || anDi.has(x) || khoa.has(x)) return
    e.preventDefault()
    chon(x)
  })

  function lop(x: string) {
    if (khoa.has(x)) return `${O_TRUNG_TINH} opacity-40`
    if (daChon === null) return `${O_TRUNG_TINH} hover:border-accent`
    if (x !== daChon) return O_TRUNG_TINH
    return x === vocab.word ? O_DUNG : O_SAI
  }

  const [truoc, sau] = tachMotCho(payload.sentence)
  const langPhu = ngonNguPhu(vocab.lang)

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-20 border border-border-card bg-surface-card px-7 py-8 text-center">
        <div className="text-13 text-content-muted">Chọn từ đúng cho chỗ trống</div>
        <div lang={vocab.lang} className="mt-3 font-han text-20 leading-relaxed text-content-primary">
          {truoc}
          {xong ? (
            <span className="font-semibold text-success-text">{vocab.word}</span>
          ) : (
            <span className="font-bold text-accent">___</span>
          )}
          {sau}
        </div>
        {hienPhienAm && payload.sentence_pinyin && (
          <div className="mt-2 text-12 text-content-muted">
            {xong && vocab.pinyin ? payload.sentence_pinyin.replace('___', vocab.pinyin) : payload.sentence_pinyin}
          </div>
        )}
        {xong && payload.sentence_secondary && (
          <div lang={langPhu} className="mt-3 text-14 italic text-content-muted">
            {payload.sentence_secondary}
          </div>
        )}
      </div>

      {!xong && (
        <div className="grid grid-cols-2 gap-[14px]">
          {luaChon.map((x) => (
            <button
              key={x}
              type="button"
              disabled={daChon !== null || khoa.has(x)}
              onClick={() => chon(x)}
              className={`${lop(x)} ${anDi.has(x) ? 'invisible' : ''} p-5 text-center font-han text-17`}
            >
              <span lang={vocab.lang}>{x}</span>
              {hienPhienAm && pinyinCua.get(x) && (
                <span className="mt-1 block font-body text-12 font-normal text-content-muted">{pinyinCua.get(x)}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {xong && (
        <>
          <div className="flex flex-col gap-1 rounded-16 border border-border-card bg-surface-sunken p-3">
            {bangGanNghia(vocab, payload, luaChon).map((r) => (
              <div key={r.word} className={`rounded-12 px-3 py-[10px] ${r.dung ? 'bg-success-bg' : ''}`}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  {r.dung && <span className="font-bold text-success-text">✓</span>}
                  <span
                    lang={vocab.lang}
                    className={`font-han text-17 font-semibold ${r.dung ? 'text-success-text' : 'text-content-primary'}`}
                  >
                    {r.word}
                  </span>
                  {r.pinyin && <span className="text-12 text-content-muted">{r.pinyin}</span>}
                  {r.secondary && (
                    <span lang={langPhu} className="text-13 text-content-nav">
                      {r.secondary}
                    </span>
                  )}
                </div>
                {r.note && <div className="mt-1 text-13 leading-normal text-content-muted">{r.note}</div>}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={tiepTuc}
            autoFocus
            className="rounded-14 bg-accent py-[17px] text-16 font-semibold text-white"
          >
            Tiếp tục
          </button>
        </>
      )}
    </div>
  )
}
