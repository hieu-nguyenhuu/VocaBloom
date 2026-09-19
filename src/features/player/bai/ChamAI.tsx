import type { KetQuaCham, Verdict } from '../../../lib/aiCore.ts'
import type { VocabDb } from '../../../lib/player.ts'

/**
 * Pattern 8 — phần PHẢN HỒI (mockup 09 nửa dưới). Màn này ứng với 1 lần gọi AI cho cả nhóm câu
 * cùng dạng (DEC-14). Vào màn → "Đang chấm…" → hiện lần lượt từng thẻ, mỗi thẻ 1 nút "Tiếp theo".
 * Lỗi mạng / parse fail / AI thiếu `vocab_id` (§7.4) → thẻ lỗi nhẹ + "Chấm lại", câu đã nhập giữ nguyên.
 */
type MucCham = { vocab: VocabDb; cau: string; kq?: KetQuaCham | undefined }

type Props = {
  trangThai: 'dang_cham' | 'xong' | 'loi'
  loi?: string | undefined
  ds: MucCham[]
  chiSo: number
  onTiep: () => void
  onChamLai: () => void
}

const KIEU: Record<Verdict, { nhan: string; vien: string; nen: string; badge: string; chu: string }> = {
  good: { nhan: 'Tốt lắm', vien: 'border-success', nen: 'bg-success-bg', badge: 'bg-success', chu: 'text-success-text' },
  acceptable: { nhan: 'Tạm được', vien: 'border-warn', nen: 'bg-warn-bg', badge: 'bg-warn', chu: 'text-warn-text' },
  fail: { nhan: 'Chưa đạt', vien: 'border-danger', nen: 'bg-danger-bg', badge: 'bg-danger', chu: 'text-danger-text' },
}

const NUT = 'rounded-14 py-[17px] text-16 font-semibold'

export default function ChamAI({ trangThai, loi, ds, chiSo, onTiep, onChamLai }: Props) {
  if (trangThai === 'dang_cham') {
    return (
      <div className="flex flex-col gap-[18px]">
        <p className="text-center text-15 text-content-muted">Đang chấm bài…</p>
        <div className="h-[120px] animate-pulse rounded-16 border border-border-card bg-surface-sunken" />
      </div>
    )
  }

  if (trangThai === 'loi') {
    return (
      <div className="flex flex-col gap-[18px]">
        <div role="alert" className="rounded-16 border border-danger bg-danger-bg p-[18px] text-14 leading-normal text-danger-text">
          <div className="mb-1 font-semibold">Chưa chấm được bài</div>
          <div>{loi}</div>
          <div className="mt-1 opacity-80">Câu bạn đã nhập vẫn được giữ nguyên.</div>
        </div>
        <button type="button" onClick={onChamLai} className={`${NUT} bg-accent text-white`}>
          Chấm lại
        </button>
      </div>
    )
  }

  const muc = ds[chiSo]
  if (!muc) return null
  const kq = muc.kq
  const k = kq ? KIEU[kq.verdict] : null

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="rounded-16 border border-border-card bg-surface-card p-[18px] text-center text-15 text-content-nav">
        <b lang={muc.vocab.lang} className="font-han">
          {muc.vocab.word}
        </b>{' '}
        ({muc.vocab.meaning_vi})
      </div>

      <div
        lang={muc.vocab.lang}
        className="min-h-[60px] rounded-14 border border-border-input bg-surface-sunken p-[18px] font-han text-17 text-content-nav"
      >
        {muc.cau || <span className="font-body text-15 text-content-subtle">(bỏ qua)</span>}
      </div>

      {k && kq ? (
        <div className={`rounded-16 border p-[18px] ${k.vien} ${k.nen}`}>
          <span className={`inline-block rounded-pill px-3 py-1 text-12 font-bold text-white ${k.badge}`}>
            {k.nhan}
          </span>
          <div className={`mt-[10px] text-14 leading-normal ${k.chu}`}>{kq.feedback_vi}</div>
          {kq.improved_sentence && (
            <div className={`mt-[10px] text-14 italic opacity-90 ${k.chu}`}>
              Gợi ý: “{kq.improved_sentence}”
            </div>
          )}
        </div>
      ) : (
        <div role="alert" className="rounded-16 border border-danger bg-danger-bg p-[18px] text-14 text-danger-text">
          AI không trả kết quả cho từ này — chưa cộng điểm. Bấm "Chấm lại" để thử lần nữa.
        </div>
      )}

      <div className="flex gap-3">
        {!kq && (
          <button type="button" onClick={onChamLai} className={`${NUT} flex-1 bg-border-card text-content-nav`}>
            Chấm lại
          </button>
        )}
        <button type="button" onClick={onTiep} className={`${NUT} flex-1 bg-accent text-white`}>
          Tiếp theo
        </button>
      </div>
    </div>
  )
}
