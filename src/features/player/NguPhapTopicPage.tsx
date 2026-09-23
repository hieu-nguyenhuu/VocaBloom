import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import { docNguPhap, noiTiepTheo, type MucNguPhap } from '../../lib/nguPhap.ts'
import { supabase } from '../../lib/supabase.ts'
import { phatAm } from '../../lib/tts.ts'
import { useDungPhim } from './dungPhim.ts'
import Grammar from './bai/Grammar.tsx'

/**
 * NGỮ PHÁP CỦA CHỦ ĐỀ (M12b, DESIGN.md §5.1) — `/on-tap/ngu-phap?topic=X&giai_doan=dau|cuoi`.
 *
 * Chủ ý kiến trúc: đây là ROUTE RIÊNG, KHÔNG nhét vào `PlayerPage`/reducer `giamPlayer`.
 * Mỗi lần thêm chế độ vào Player đều phải trả lời được "cái gì làm session kết thúc?" — đã trả giá
 * ở M7 (26 lần cùng 1 màn, 82 dòng log rác, MB-26). Route riêng thì câu hỏi đó không phát sinh.
 *
 * Chủ đề KHÔNG có mục ngữ pháp nào ⇒ tự chuyển tiếp ngay, luồng cũ giữ nguyên 100%.
 *
 * Thị giác: tái dùng nguyên component `Grammar` (mockup 10) — không có từ nào để in đậm nên
 * `tuDam` bỏ trống.
 */
export default function NguPhapTopicPage() {
  const navigate = useNavigate()
  const tham = new URLSearchParams(location.search)
  const topicId = tham.get('topic')
  const giaiDoan = tham.get('giai_doan') === 'cuoi' ? 'cuoi' : 'dau'

  const [ten, setTen] = useState('')
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const [ds, setDs] = useState<MucNguPhap[] | null>(null)
  const [i, setI] = useState(0)
  const [hienPhienAm, setHienPhienAm] = useState(true)

  useEffect(() => {
    void (async () => {
      if (!topicId) return navigate('/on-tap/tong-ket', { replace: true })
      const [tRes, gRes, vRes] = await Promise.all([
        supabase.from('topics').select('name').eq('id', topicId).maybeSingle(),
        supabase.from('topic_grammar').select('*').eq('topic_id', topicId).order('thu_tu'),
        supabase.from('vocab_topics').select('vocab(lang)').eq('topic_id', topicId).limit(1),
      ])
      setTen((tRes.data as { name?: string } | null)?.name ?? '')
      const tu = (vRes.data ?? []) as unknown as { vocab: { lang?: 'zh' | 'en' } | null }[]
      setLang(tu[0]?.vocab?.lang ?? 'zh')
      setDs(docNguPhap(gRes.data))
    })()
  }, [topicId, navigate])

  // Không có mục nào (hoặc lỗi đọc) → đi tiếp ngay, KHÔNG giữ người dùng ở màn trống.
  useEffect(() => {
    if (ds && ds.length === 0 && topicId) navigate(noiTiepTheo(giaiDoan, topicId), { replace: true })
  }, [ds, giaiDoan, topicId, navigate])

  function tiep() {
    if (!ds || !topicId) return
    if (i + 1 < ds.length) return setI(i + 1)
    navigate(noiTiepTheo(giaiDoan, topicId), { replace: true })
  }

  // M11/Q2 — Enter = hành động chính của màn
  useDungPhim((e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    tiep()
  })

  const muc = ds?.[i]
  if (!muc) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div
          className="w-full max-w-[600px] animate-pulse rounded-20 border border-border-card bg-surface-sunken"
          style={{ height: 180 }}
        />
      </main>
    )
  }

  const cuoiCung = i + 1 >= (ds?.length ?? 0)
  return (
    <main className="flex min-h-[100dvh] flex-col bg-surface-page">
      <header className="flex items-center justify-between gap-3 border-b border-border-card px-5 py-4 md:px-8 md:py-5">
        <div className="min-w-0">
          <div className="text-12 font-semibold uppercase tracking-[0.04em] text-content-muted">
            Ngữ pháp chủ đề
          </div>
          <h1 className="truncate font-display text-17 font-bold text-content-primary md:text-19">
            {ten}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {lang === 'zh' && (
            <button
              type="button"
              onClick={() => setHienPhienAm((v) => !v)}
              aria-pressed={hienPhienAm}
              aria-label="Bật/tắt phiên âm"
              className={`rounded-10 border border-border-card px-2.5 py-1.5 font-han text-15 ${
                hienPhienAm ? 'text-accent' : 'text-content-nav'
              }`}
            >
              拼
            </button>
          )}
          <button
            type="button"
            aria-label="Thoát"
            onClick={() => navigate('/on-tap/tong-ket', { replace: true })}
            className="text-content-nav"
          >
            <Icon ten="dong" size={20} strokeWidth="2" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 justify-center px-5 py-6 md:px-8 md:py-9">
        <div className="flex w-full max-w-[480px] flex-col gap-5">
          {(ds?.length ?? 0) > 1 && (
            <div className="flex justify-center gap-1.5">
              {ds?.map((_, k) => (
                <span
                  key={k}
                  className={`h-1.5 rounded-pill transition-all ${
                    k === i ? 'w-5 bg-accent' : 'w-1.5 bg-border-card'
                  }`}
                />
              ))}
            </div>
          )}

          <Grammar
            key={i}
            vocab={{ lang }}
            payload={{ content_target: muc.content_target, pinyin: muc.pinyin, content_vi: muc.content_vi }}
            hienPhienAm={hienPhienAm}
            onTiep={tiep}
            nhanNut={
              cuoiCung ? (giaiDoan === 'dau' ? 'Bắt đầu ôn' : 'Xem hội thoại') : 'Tiếp theo'
            }
          />

          {muc.vi_du && (
            <div className="rounded-16 border border-border-card bg-surface-sunken px-5 py-4">
              <div className="mb-2 text-12 font-semibold uppercase tracking-[0.04em] text-content-muted">
                Ví dụ
              </div>
              <div className="flex items-start gap-2">
                <p lang={lang} className="font-han text-17 text-content-primary">
                  {muc.vi_du}
                </p>
                <button
                  type="button"
                  aria-label="Nghe câu ví dụ"
                  onClick={() => phatAm(muc.vi_du, lang)}
                  className="mt-0.5 shrink-0 text-content-muted"
                >
                  <Icon ten="loa" size={16} />
                </button>
              </div>
              {hienPhienAm && muc.vi_du_pinyin && (
                <div className="mt-1 text-12 text-content-muted">{muc.vi_du_pinyin}</div>
              )}
              {muc.vi_du_vi && <div className="mt-1 text-13 text-content-nav">{muc.vi_du_vi}</div>}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
