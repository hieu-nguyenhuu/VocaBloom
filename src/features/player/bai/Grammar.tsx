import type { PayloadGrammar, VocabDb } from '../../../lib/player.ts'
import { useDungPhim } from '../dungPhim.ts'

/**
 * Pattern 9 — nội dung đọc (mockup 10): không ring, không chấm, không ghi DB.
 * Từ vựng trong câu được in đậm bằng cách tách chuỗi theo `vocab.word`.
 *
 * M12b: dùng chung cho cả ngữ pháp CỦA CHỦ ĐỀ (`topic_grammar`) — ở đó không có từ nào để in đậm,
 * nên `tuDam` để trống. `nhanNut` cho phép đổi nhãn CTA ("Bắt đầu ôn" / "Xem hội thoại").
 */
type Props = {
  vocab: Pick<VocabDb, 'lang'>
  payload: PayloadGrammar
  hienPhienAm: boolean
  onTiep: () => void
  /** Chuỗi cần in đậm trong `content_target`; bỏ trống = không in đậm gì. */
  tuDam?: string | undefined
  nhanNut?: string
}

export default function Grammar({ vocab, payload, hienPhienAm, onTiep, tuDam, nhanNut }: Props) {
  // M11/Q2: Enter = hành động chính của màn
  useDungPhim((e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    onTiep()
  })

  // `split('')` cắt vụn từng ký tự ⇒ phải chặn trường hợp không có từ cần in đậm.
  const phan = tuDam ? payload.content_target.split(tuDam) : [payload.content_target]
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="rounded-20 border border-border-card bg-surface-card px-[30px] py-9">
        <div lang={vocab.lang} className="font-han text-24 leading-relaxed text-content-primary">
          {phan.map((doan, i) => (
            <span key={i}>
              {doan}
              {i < phan.length - 1 && <b>{tuDam}</b>}
            </span>
          ))}
        </div>
        {hienPhienAm && payload.pinyin && (
          <div className="mt-2 text-14 text-content-muted">{payload.pinyin}</div>
        )}
        <div className="mt-4 text-15 leading-relaxed text-content-muted">{payload.content_vi}</div>
      </div>
      <button
        type="button"
        onClick={onTiep}
        className="rounded-14 bg-accent py-[17px] text-16 font-semibold text-white"
      >
        {nhanNut ?? 'Tiếp theo'}
      </button>
    </div>
  )
}
