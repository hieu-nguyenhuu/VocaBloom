import { useState } from 'react'
import { Icon } from '../../components/icons.tsx'
import { chiaDam, type DongHoiThoai } from '../../lib/hoiThoai.ts'

/**
 * M20 — Hội thoại CỦA CHỦ ĐỀ ở màn Từ vựng (khối tra cứu, không tính điểm, không phát âm).
 * Mockup 13/14 không có khối này — layout duyệt ở DESIGN.md M20: bong bóng A/B mượn mockup 11, cố ý
 * khác khối "Ngữ pháp chủ đề" (nền nổi · gấp CẢ khối · mặc định ĐÓNG · icon chat).
 * Nền khối trắng ⇒ bong bóng A dùng be nhạt `surface-sunken` (trắng-trên-trắng sẽ mất bong bóng).
 * Cha đặt `key={topicId}` ⇒ đổi chủ đề là khối tự đóng + tắt nghĩa, không cần effect.
 */
export default function HoiThoaiChuDe({ dong, lang }: { dong: DongHoiThoai[]; lang: 'zh' | 'en' }) {
  const [mo, setMo] = useState(false)
  const [hienNghia, setHienNghia] = useState(false)

  return (
    <section className="mb-4 max-w-[640px] rounded-14 border border-border-card bg-surface-card">
      <button
        type="button"
        aria-expanded={mo}
        onClick={() => setMo((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <Icon ten="chat" size={18} className="shrink-0 text-accent" />
        <span className="text-14 font-bold text-content-primary">Hội thoại chủ đề</span>
        <span className="text-12 text-content-muted">· {dong.length} câu</span>
        <Icon
          ten="back"
          size={16}
          strokeWidth={2}
          className={`ml-auto shrink-0 text-content-muted transition-transform ${mo ? 'rotate-90' : '-rotate-90'}`}
        />
      </button>
      {mo && (
        <div className="flex flex-col gap-2.5 border-t border-border-card px-4 py-4">
          <button
            type="button"
            onClick={() => setHienNghia((v) => !v)}
            aria-pressed={hienNghia}
            className="self-end rounded-pill border border-border-card px-3 py-1.5 text-12 font-semibold text-content-nav"
          >
            {hienNghia ? 'Ẩn nghĩa' : 'Hiện nghĩa'}
          </button>
          {dong.map((d, i) => {
            const trai = d.speaker !== 'B'
            return (
              <div
                key={i}
                className={`max-w-[82%] border px-3.5 py-2.5 ${
                  trai
                    ? 'self-start rounded-16 rounded-bl-[4px] border-border-card bg-surface-sunken'
                    : 'self-end rounded-16 rounded-br-[4px] border-border-chat-b bg-surface-chat-b'
                }`}
              >
                <p lang={lang} className="font-han text-15 text-content-primary">
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
                {d.pinyin && <div className="mt-0.5 text-12 text-content-muted">{d.pinyin}</div>}
                {hienNghia && d.nghia && <div className="mt-1 text-13 text-content-nav">{d.nghia}</div>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
