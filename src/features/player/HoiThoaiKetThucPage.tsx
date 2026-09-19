import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import { chiaDam, docHoiThoai, type DongHoiThoai } from '../../lib/hoiThoai.ts'
import { supabase } from '../../lib/supabase.ts'
import { phatAm } from '../../lib/tts.ts'

/**
 * Hội thoại kết thúc lượt ôn theo chủ đề (M7, mockup 11 PC + Mobile).
 * Chỉ tới đây khi ĐÃ LÀM HẾT lượt ôn; bấm X giữa chừng thì Player đi thẳng Tổng kết (M7/Q5–Q6).
 *
 * Mockup chỉ vẽ chữ + phiên âm; nút "Hiện nghĩa" là phần thêm đã duyệt (M7/Q4) vì DB có `text_vi`.
 * Câu chưa có file mp3 (chỉ từ đơn mới có `audio_url`) nên nút loa dùng Web Speech.
 */
export default function HoiThoaiKetThucPage() {
  const [ten, setTen] = useState('')
  const [dong, setDong] = useState<DongHoiThoai[] | null>(null)
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const [hienNghia, setHienNghia] = useState(false)
  const navigate = useNavigate()
  const topicId = new URLSearchParams(location.search).get('topic')

  useEffect(() => {
    void (async () => {
      if (!topicId) return navigate('/on-tap/tong-ket', { replace: true })
      const [tRes, dRes, vRes] = await Promise.all([
        supabase.from('topics').select('name').eq('id', topicId).maybeSingle(),
        supabase.from('topic_dialogues').select('content').eq('topic_id', topicId).maybeSingle(),
        supabase.from('vocab_topics').select('vocab(id, word, lang)').eq('topic_id', topicId),
      ])
      const tu = ((vRes.data ?? []) as unknown as { vocab: { id: string; word: string; lang: 'zh' | 'en' } | null }[])
        .map((r) => r.vocab)
        .filter((v): v is { id: string; word: string; lang: 'zh' | 'en' } => Boolean(v))
      setTen((tRes.data as { name?: string } | null)?.name ?? '')
      setLang(tu[0]?.lang ?? 'zh')
      setDong(docHoiThoai((dRes.data as { content?: unknown } | null)?.content, Object.fromEntries(tu.map((v) => [v.id, v.word]))))
    })()
  }, [topicId, navigate])

  // Hội thoại rỗng (chủ đề chưa có `topic_dialogues`) → không giữ người dùng ở màn trống
  useEffect(() => {
    if (dong && dong.length === 0) navigate('/on-tap/tong-ket', { replace: true })
  }, [dong, navigate])

  return (
    <main className="flex min-h-[100dvh] flex-col bg-surface-page">
      <header className="border-b border-border-card px-6 py-5 text-center md:py-8">
        <h1 className="font-display text-19 font-bold text-content-primary md:text-22">
          Hội thoại: {ten}
        </h1>
      </header>

      <div className="flex flex-1 justify-center overflow-y-auto px-5 py-5 md:px-10 md:py-9">
        <div className="flex w-full max-w-[720px] flex-col gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => setHienNghia((v) => !v)}
            aria-pressed={hienNghia}
            className="self-end rounded-pill border border-border-card px-3 py-1.5 text-12 font-semibold text-content-nav"
          >
            {hienNghia ? 'Ẩn nghĩa' : 'Hiện nghĩa'}
          </button>

          {(dong ?? []).map((d, i) => {
            const trai = d.speaker !== 'B'
            return (
              <div
                key={i}
                className={`max-w-[78%] border px-3.5 py-3 md:max-w-[74%] md:px-[18px] md:py-4 ${
                  trai
                    ? 'self-start rounded-16 rounded-bl-[4px] border-border-card bg-surface-card md:rounded-18 md:rounded-bl-[4px]'
                    : 'self-end rounded-16 rounded-br-[4px] border-border-chat-b bg-surface-chat-b md:rounded-18 md:rounded-br-[4px]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <p lang={lang} className="font-han text-16 text-content-primary md:text-17">
                    {chiaDam(d.text, d.tu_dam).map((p, j) =>
                      p.dam ? (
                        <b key={j} className="font-bold text-accent">
                          {p.text}
                        </b>
                      ) : (
                        <span key={j}>{p.text}</span>
                      ),
                    )}
                  </p>
                  <button
                    type="button"
                    aria-label="Nghe câu này"
                    onClick={() => phatAm(d.text, lang)}
                    className="mt-0.5 shrink-0 text-content-muted"
                  >
                    <Icon ten="loa" size={16} />
                  </button>
                </div>
                {d.pinyin && <div className="mt-1 text-12 text-content-muted">{d.pinyin}</div>}
                {hienNghia && d.nghia && (
                  <div className="mt-1 text-13 text-content-nav">{d.nghia}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-center px-5 pb-6 md:pb-9">
        <button
          type="button"
          onClick={() => navigate('/on-tap/tong-ket', { replace: true })}
          className="w-full max-w-[720px] rounded-14 bg-accent py-4 text-15 font-semibold text-white md:text-16"
        >
          Xong
        </button>
      </div>
    </main>
  )
}
