import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { tomTatChuDe, type TomTatChuDe } from '../../lib/chuDe.ts'
import { homNayVN } from '../../lib/player.ts'
import { supabase } from '../../lib/supabase.ts'
import KhungTrang from '../shell/KhungTrang.tsx'

/**
 * Màn chọn chủ đề để ôn (M7). ⚠️ KHÔNG có mockup — layout mượn card của mockup 13 "Quản lý từ vựng"
 * (tên + N từ + thanh 6 màu stage), bổ sung dòng "N từ đến hạn"; người dùng đã duyệt ở Brainstorm.
 *
 * Màu thanh = màu TƯỢNG TRƯNG theo stage (ring-0..5), giống chip Khu vườn ở Dashboard — KHÔNG phải
 * màu theo `total_points` (UI_DESIGN §8.1).
 */
const MAU_STAGE = ['bg-ring-0', 'bg-ring-1', 'bg-ring-2', 'bg-ring-3', 'bg-ring-4', 'bg-ring-5'] as const

export default function ChonChuDePage() {
  const [ds, setDs] = useState<TomTatChuDe[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    void nap()
  }, [])

  async function nap() {
    const [tRes, lRes, wRes] = await Promise.all([
      supabase.from('topics').select('id, name, description'),
      supabase.from('vocab_topics').select('topic_id, vocab_id'),
      supabase.from('word_state').select('vocab_id, stage, next_review_date'),
    ])
    const e = tRes.error ?? lRes.error ?? wRes.error
    if (e) return setLoi(e.message)
    setLoi(null)
    setDs(
      tomTatChuDe({
        topics: (tRes.data ?? []) as { id: string; name: string; description: string | null }[],
        lienKet: (lRes.data ?? []) as { topic_id: string; vocab_id: string }[],
        trangThai: (wRes.data ?? []) as { vocab_id: string; stage: string; next_review_date: string | null }[],
        homNay: homNayVN(new Date()),
      }),
    )
  }

  if (loi) {
    return (
      <KhungTrang rong={960}>
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-14 border border-danger bg-danger-bg px-4 py-3 text-13 text-danger-text"
        >
          <span>Không tải được danh sách chủ đề: {loi}</span>
          <button
            type="button"
            onClick={() => void nap()}
            className="shrink-0 rounded-10 bg-accent px-3 py-1.5 text-13 font-semibold text-white"
          >
            Thử lại
          </button>
        </div>
      </KhungTrang>
    )
  }

  return (
    <KhungTrang rong={960}>
      <h1 className="mb-1.5 font-display text-22 font-bold text-content-primary md:text-28">Ôn theo chủ đề</h1>
      <p className="mb-6 text-13 text-content-muted md:text-14">
        Ôn toàn bộ từ trong một chủ đề, kết thúc bằng đoạn hội thoại. Chỉ từ đang đến hạn mới được
        cộng điểm.
      </p>

      {!ds ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-16 bg-surface-sunken" />
          ))}
        </div>
      ) : ds.length === 0 ? (
        <p className="text-14 text-content-muted">Chưa có chủ đề nào — hãy import bộ từ đầu tiên.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {ds.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={c.so_tu === 0}
              // M12b: vào màn ngữ pháp chủ đề TRƯỚC; chủ đề không có mục nào thì màn đó
              // tự chuyển tiếp thẳng vào Player, luồng cũ không đổi.
              onClick={() => navigate(`/on-tap/ngu-phap?topic=${c.id}&giai_doan=dau`)}
              className="rounded-16 border border-border-card bg-surface-card p-4 text-left disabled:opacity-60"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-16 font-bold text-content-primary">{c.ten}</span>
                <span className="shrink-0 text-12 text-content-muted">{c.so_tu} từ</span>
              </div>
              {c.mo_ta && <div className="mt-0.5 text-12 text-content-muted">{c.mo_ta}</div>}
              <div className="mt-2.5 flex h-2 overflow-hidden rounded-pill bg-surface-sunken">
                {c.khuc.map((k, i) =>
                  k.so === 0 ? null : (
                    <div
                      key={k.stage}
                      className={MAU_STAGE[i]}
                      style={{ width: `${(k.so / Math.max(1, c.so_tu)) * 100}%` }}
                    />
                  ),
                )}
              </div>
              <div className="mt-2 text-12 font-semibold text-accent">
                {c.so_den_han > 0 ? `${c.so_den_han} từ đến hạn hôm nay` : 'Không có từ đến hạn — ôn lại cho nhớ'}
              </div>
            </button>
          ))}
        </div>
      )}
    </KhungTrang>
  )
}
