import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { tomTatChuDe, type TomTatChuDe } from '../../lib/chuDe.ts'
import { lanGanNhat } from '../../lib/docHieu.ts'
import { homNayVN } from '../../lib/player.ts'
import { supabase } from '../../lib/supabase.ts'
import { KhungLoi, KhungRong } from '../../components/TrangThai.tsx'
import KhungTrang from '../shell/KhungTrang.tsx'

/**
 * Màn chọn chủ đề để ôn (M7). ⚠️ KHÔNG có mockup — layout mượn card của mockup 13 "Quản lý từ vựng"
 * (tên + N từ + thanh 6 màu stage), bổ sung dòng "N từ đến hạn"; người dùng đã duyệt ở Brainstorm.
 *
 * Màu thanh = màu theo stage (ring-0..5), giống chip Khu vườn ở Dashboard (UI_DESIGN §8.1).
 *
 * M31: ôn theo chủ đề = ĐỌC HIỂU ⇒ dòng "N từ đến hạn" thay bằng "N đoạn đọc · Lần gần nhất X/Y";
 * chủ đề chưa có đề thì khoá card (design.m31.md §2).
 */
const MAU_STAGE = ['bg-ring-0', 'bg-ring-1', 'bg-ring-2', 'bg-ring-3', 'bg-ring-4', 'bg-ring-5'] as const

export default function ChonChuDePage() {
  const [ds, setDs] = useState<TomTatChuDe[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [doc, setDoc] = useState<{ so: Record<string, number>; gan: ReturnType<typeof lanGanNhat> }>({ so: {}, gan: {} })
  const navigate = useNavigate()

  useEffect(() => {
    void nap()
  }, [])

  async function nap() {
    const [tRes, lRes, wRes, rRes, hRes] = await Promise.all([
      supabase.from('topics').select('id, name, description'),
      supabase.from('vocab_topics').select('topic_id, vocab_id'),
      supabase.from('word_state').select('vocab_id, stage, next_review_date'),
      supabase.from('topic_readings').select('topic_id'),
      supabase.from('doc_hieu_log').select('topic_id, luot_id, so_cau, so_dung, created_at'),
    ])
    const e = tRes.error ?? lRes.error ?? wRes.error ?? rRes.error ?? hRes.error
    if (e) return setLoi(e.message)
    setLoi(null)
    const so: Record<string, number> = {}
    for (const r of (rRes.data ?? []) as { topic_id: string }[]) so[r.topic_id] = (so[r.topic_id] ?? 0) + 1
    setDoc({ so, gan: lanGanNhat((hRes.data ?? []) as Parameters<typeof lanGanNhat>[0]) })
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
        <KhungLoi
          tieuDe="Chưa tải được danh sách chủ đề"
          loi={loi}
          onThuLai={() => {
            setLoi(null)
            void nap()
          }}
          phu={{ nhan: 'Về Dashboard', toi: '/' }}
        />
      </KhungTrang>
    )
  }

  return (
    <KhungTrang rong={960}>
      <h1 className="mb-1.5 font-display text-22 font-bold text-content-primary md:text-28">Ôn theo chủ đề</h1>
      <p className="mb-6 text-13 text-content-muted md:text-14">
        Đọc hội thoại và đoạn văn dùng từ của chủ đề, trả lời câu hỏi như phần đọc HSK. Không ảnh
        hưởng điểm ôn hằng ngày.
      </p>

      {!ds ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-16 bg-surface-sunken" />
          ))}
        </div>
      ) : ds.length === 0 ? (
        <KhungRong
          tieuDe="Chưa có chủ đề nào"
          moTa="Import bộ từ đầu tiên để bắt đầu gieo hạt nhé."
          hanhDong={{ nhan: 'Đi tới Import', toi: '/import' }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {ds.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={(doc.so[c.id] ?? 0) === 0}
              // M12b: vào màn ngữ pháp chủ đề TRƯỚC; chủ đề không có mục nào thì màn đó
              // tự chuyển tiếp thẳng sang Đọc hiểu (M31).
              onClick={() => navigate(`/on-tap/ngu-phap?topic=${c.id}`)}
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
                {(doc.so[c.id] ?? 0) === 0
                  ? 'Chưa có bài đọc'
                  : `${doc.so[c.id]} đoạn đọc` +
                    (doc.gan[c.id] ? ` · Lần gần nhất ${doc.gan[c.id]!.so_dung}/${doc.gan[c.id]!.so_cau}` : '')}
              </div>
            </button>
          ))}
        </div>
      )}
    </KhungTrang>
  )
}
