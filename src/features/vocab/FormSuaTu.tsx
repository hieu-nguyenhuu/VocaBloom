import { useEffect, useRef, useState } from 'react'
import { docThayDoi, kiemTraFormTu, nhanTu, type DongTu, type FieldSua } from '../../lib/tuVung.ts'

/**
 * Form sửa từ (mockup 14 PC modal 480px) — `<dialog>` native, 0 package.
 * M9/Q5: LUÔN căn giữa cả PC lẫn Mobile (bỏ kiểu bottom-sheet của mockup 15 — người dùng yêu cầu,
 * vì sheet bị đẩy sát mép trên và cắt mất phần đầu trên màn 390px).
 * ĐỦ 8 field cơ bản (`UI_DESIGN` §8.4); mockup chỉ vẽ 5 ô nên 2 field sẽ không bao giờ sửa được.
 * KHÔNG sửa payload bài tập ở đây — muốn đổi bài tập phải import file mới.
 */
const NHAN = 'mb-1 block text-11 font-semibold text-content-muted'
const O = 'w-full rounded-8 border border-border-card bg-surface-card px-3 py-2.5 text-14 text-content-primary focus:border-accent focus:outline-none'
const NUT = 'flex-1 rounded-12 py-3 text-14 font-semibold'

type Props = { tu: DongTu; onDong: () => void; onLuu: (thay: Partial<Record<FieldSua, string | null>>, xoaAudio: boolean) => Promise<void> }

export default function FormSuaTu({ tu, onDong, onLuu }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<DongTu>(tu)
  const [loi, setLoi] = useState<string | null>(null)
  const [dangLuu, setDangLuu] = useState(false)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const dat = (k: FieldSua) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function luu() {
    const v = kiemTraFormTu(form)
    if (v) return setLoi(v)
    setDangLuu(true)
    const thay = docThayDoi(tu, form)
    await onLuu(thay, 'word' in thay)
    setDangLuu(false)
  }

  // Ô chứa chữ Hán dùng font Noto; từ tiếng Anh giữ font thân
  const O_HAN = tu.lang === 'zh' ? `${O} font-han` : O

  return (
    <dialog
      ref={ref}
      onClose={onDong}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto flex max-h-[85dvh] w-[min(480px,calc(100vw-32px))] flex-col rounded-20 bg-surface-raised p-0 backdrop:bg-[rgb(36_27_58_/_0.35)]"
    >
      <div className="flex min-h-0 flex-col gap-3 p-5 md:p-7">
        <h2 className="font-display text-18 font-bold text-content-primary md:text-19">Sửa từ vựng</h2>

        <div className="flex flex-col gap-2.5 overflow-y-auto">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={NHAN} htmlFor="f-word">{nhanTu(tu.lang)}</label>
              <input id="f-word" className={O_HAN} value={form.word} onChange={dat('word')} />
            </div>
            <div>
              <label className={NHAN} htmlFor="f-pinyin">Pinyin</label>
              <input id="f-pinyin" className={O} value={form.pinyin ?? ''} onChange={dat('pinyin')} />
            </div>
          </div>

          <div>
            <label className={NHAN} htmlFor="f-nghia">Nghĩa tiếng Việt</label>
            <input id="f-nghia" className={O} value={form.meaning_vi} onChange={dat('meaning_vi')} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={NHAN} htmlFor="f-col">Cụm từ đi kèm</label>
              <input id="f-col" className={O_HAN} value={form.collocation ?? ''} onChange={dat('collocation')} />
            </div>
            <div>
              <label className={NHAN} htmlFor="f-colp">Pinyin cụm từ</label>
              <input id="f-colp" className={O} value={form.collocation_pinyin ?? ''} onChange={dat('collocation_pinyin')} />
            </div>
          </div>

          <div>
            <label className={NHAN} htmlFor="f-colm">Nghĩa cụm từ</label>
            <input id="f-colm" className={O} value={form.collocation_meaning_vi ?? ''} onChange={dat('collocation_meaning_vi')} />
          </div>

          <div>
            <label className={NHAN} htmlFor="f-vd">Câu ví dụ</label>
            <input id="f-vd" className={O_HAN} value={form.example_sentence ?? ''} onChange={dat('example_sentence')} />
          </div>

          <div>
            <label className={NHAN} htmlFor="f-vdm">Nghĩa câu ví dụ</label>
            <input id="f-vdm" className={O} value={form.example_meaning_vi ?? ''} onChange={dat('example_meaning_vi')} />
          </div>

          <p className="text-12 text-content-muted">
            Nội dung 17 dạng bài tập không đổi theo — muốn cập nhật bài tập thì import file mới.
            {form.word.trim() !== tu.word.trim() && ' Đổi chữ sẽ xoá bản thu âm cũ để lần tạo audio sau đọc đúng chữ mới.'}
          </p>
        </div>

        {loi && <div role="alert" className="rounded-10 bg-danger-bg px-3 py-2 text-13 text-danger-text">{loi}</div>}

        <div className="mt-1 flex gap-2.5">
          <button type="button" onClick={() => ref.current?.close()} className={`${NUT} bg-border-card text-content-nav`}>
            Hủy
          </button>
          <button type="button" disabled={dangLuu} onClick={() => void luu()} className={`${NUT} bg-accent text-white disabled:opacity-60`}>
            {dangLuu ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
