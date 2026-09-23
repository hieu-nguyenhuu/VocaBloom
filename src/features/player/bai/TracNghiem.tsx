import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../../components/icons.tsx'
import { xaoTron, type VocabDb } from '../../../lib/player.ts'
import { useDungPhim, soThuTuPhim } from '../dungPhim.ts'
import { phatAm } from '../../../lib/tts.ts'

/**
 * Pattern 1 — trắc nghiệm 4 đáp án (mockup 02). 4 chế độ:
 *   selection · audio_recognition (stage 0, đáp án = nghĩa) · select_on_describe (stage 1, đáp án = TỪ)
 *   · select_sentence (stage 2, đáp án = CÂU, lưới 1 cột vì câu dài).
 * Feedback §6.2: chọn sai CHỈ tô ô vừa chọn, các ô còn lại trung tính (không lộ đáp án);
 * đúng → xanh rồi tự sang bài sau 600ms; sai → 1000ms (tự quyết).
 * Gợi ý (DEC-19, progressive): ẩn dần 1 đáp án sai/lần (tối đa 2); Audio thì hiện chữ Hán dưới loa.
 */
export type CheDoTracNghiem = 'selection' | 'audio_recognition' | 'select_on_describe' | 'select_sentence'

type Props = {
  vocab: VocabDb
  cheDo: CheDoTracNghiem
  /** Các lựa chọn CHƯA xáo; phần tử đầu phải là đáp án đúng. */
  luaChonGoc: string[]
  dapAn: string
  /** Bản đồ text → pinyin (select_sentence, select_on_describe) để hiện khi bật phiên âm. */
  pinyinCua?: Record<string, string | null | undefined>
  /** Đề bài riêng của chế độ mô tả. */
  moTa?: string
  hienPhienAm: boolean
  soGoiY: number
  onTraLoi: (dung: boolean, dung_goi_y: boolean) => void
}

const O = 'rounded-14 border transition-colors'
const O_TRUNG_TINH = `${O} border-border-input bg-surface-raised font-medium text-content-primary`
const O_SAI = `${O} border-[1.5px] border-danger bg-danger-bg font-semibold text-danger-text`
const O_DUNG = `${O} border-[1.5px] border-success bg-success-bg font-semibold text-success-text`

export default function TracNghiem({
  vocab, cheDo, luaChonGoc, dapAn, pinyinCua, moTa, hienPhienAm, soGoiY, onTraLoi,
}: Props) {
  // Xáo trộn ĐÚNG 1 LẦN khi màn xuất hiện (component được mount lại mỗi màn qua key=chi_so).
  // Bản cũ dùng useMemo theo `luaChonGoc` — mà Player tạo mảng đó MỚI ở mỗi render, nên mỗi lần
  // Player dispatch (bat_dau_luu/luu_ok) là 4 đáp án bị xáo lại: ô xanh đã chọn nhảy sang vị trí
  // ngẫu nhiên ngay trước khi sang màn mới (người dùng báo 20/09, đo được bằng MutationObserver).
  const [luaChon] = useState(() => xaoTron(luaChonGoc, Math.random))
  const [daChon, setDaChon] = useState<string | null>(null)
  const laCau = cheDo === 'select_sentence'
  const laChuHan = cheDo === 'select_on_describe' || laCau

  const anDi = useMemo(
    () => new Set(luaChon.filter((x) => x !== dapAn).slice(0, Math.min(soGoiY, 2))),
    [luaChon, dapAn, soGoiY],
  )

  useEffect(() => {
    if (cheDo === 'audio_recognition') phatAm(vocab.word, vocab.lang, vocab.audio_url)
  }, [cheDo, vocab.id, vocab.word, vocab.lang, vocab.audio_url])

  // ⚠️ KHÔNG để `onTraLoi` trong deps: nó là arrow function tạo MỚI mỗi lần Player render, mà Player
  // dispatch liên tục khi lưu (bat_dau_luu → luu_ok) ⇒ effect chạy lại ⇒ đặt thêm setTimeout ⇒ gọi
  // onTraLoi lần nữa ⇒ màn sau bị chấm hộ, dây chuyền (người dùng báo 20/09). Giữ callback trong ref
  // để luôn gọi bản mới nhất, và `daGui` đảm bảo 1 màn chỉ gửi đúng 1 lần (cùng bài học MB-20).
  const onTraLoiRef = useRef(onTraLoi)
  useEffect(() => {
    onTraLoiRef.current = onTraLoi
  }, [onTraLoi])

  // M11/Q3: phím 1–4 chọn đáp án thứ n (bỏ qua đáp án đang bị gợi ý ẩn)
  useDungPhim((e) => {
    if (daChon !== null) return
    const i = soThuTuPhim(e, luaChon.length)
    if (i === null) return
    const x = luaChon[i]
    if (!x || anDi.has(x)) return
    e.preventDefault()
    setDaChon(x)
  })

  const daGui = useRef(false)
  useEffect(() => {
    if (daChon === null || daGui.current) return
    daGui.current = true
    const dung = daChon === dapAn
    const t = setTimeout(() => onTraLoiRef.current(dung, soGoiY > 0), dung ? 600 : 1000)
    return () => clearTimeout(t)
  }, [daChon, dapAn, soGoiY])

  function lop(x: string) {
    if (daChon === null) return `${O_TRUNG_TINH} hover:border-accent`
    if (x !== daChon) return O_TRUNG_TINH
    return x === dapAn ? O_DUNG : O_SAI
  }

  const theHoi = () => {
    if (cheDo === 'audio_recognition') {
      return (
        <>
          <button
            type="button"
            onClick={() => phatAm(vocab.word, vocab.lang, vocab.audio_url)}
            aria-label="Nghe lại"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-pill bg-accent-tint text-accent"
          >
            <Icon ten="loa" size={28} />
          </button>
          {soGoiY > 0 && (
            <div lang={vocab.lang} className="mt-3 font-han text-24 font-semibold text-content-primary">
              {vocab.word}
            </div>
          )}
          <div className="mt-[10px] text-15 text-content-muted">Nghe và chọn nghĩa đúng</div>
        </>
      )
    }
    if (cheDo === 'select_on_describe') {
      return (
        <>
          <div className="text-15 leading-relaxed text-content-nav md:text-16">{moTa}</div>
          <div className="mt-[10px] text-15 text-content-muted">Chọn từ đúng</div>
        </>
      )
    }
    if (laCau) {
      return (
        <>
          <div lang={vocab.lang} className="font-han text-26 font-semibold text-content-primary">
            {vocab.word}
          </div>
          <div className="mt-[10px] text-15 text-content-muted">Câu nào dùng từ này đúng?</div>
        </>
      )
    }
    return (
      <>
        <div lang={vocab.lang} className="font-han text-44 font-semibold text-content-primary">
          {vocab.word}
        </div>
        <div className="mt-[10px] text-15 text-content-muted">
          {hienPhienAm && vocab.pinyin ? `${vocab.pinyin} · ` : ''}Chọn nghĩa đúng
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-20 border border-border-card bg-surface-card px-7 py-9 text-center">{theHoi()}</div>

      <div className={laCau ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-2 gap-[14px]'}>
        {luaChon.map((x) => (
          <button
            key={x}
            type="button"
            disabled={daChon !== null}
            onClick={() => setDaChon(x)}
            className={`${lop(x)} ${anDi.has(x) ? 'invisible' : ''} ${
              laCau ? 'px-4 py-3 text-left' : 'p-5 text-center'
            } ${laChuHan ? 'font-han text-17' : 'text-16'}`}
          >
            <span lang={laChuHan ? vocab.lang : undefined}>{x}</span>
            {hienPhienAm && pinyinCua?.[x] && (
              <span className="mt-1 block font-body text-12 font-normal text-content-muted">{pinyinCua[x]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
