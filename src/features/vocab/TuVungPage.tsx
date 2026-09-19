import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import { tomTatChuDe, type TomTatChuDe } from '../../lib/chuDe.ts'
import { homNayVN } from '../../lib/player.ts'
import { supabase } from '../../lib/supabase.ts'
import { locTu, type DongTu, type FieldSua } from '../../lib/tuVung.ts'
import FormSuaTu from './FormSuaTu.tsx'
import HopXacNhan from './HopXacNhan.tsx'

/**
 * Quản lý từ vựng & chủ đề (M8) — mockup 13/14 PC, 13/14/15 Mobile.
 * PC: master-detail 2 cột. Mobile: 2 màn tách biệt theo route, chuyển bố cục bằng CSS `md:`.
 *
 * KHÔNG có nút "Thêm từ mới" (UI_DESIGN §8.4 — nguồn nhập liệu chính là Import) và KHÔNG sửa được
 * payload 17 dạng bài tập.
 */
const MAU_STAGE = ['bg-ring-0', 'bg-ring-1', 'bg-ring-2', 'bg-ring-3', 'bg-ring-4', 'bg-ring-5'] as const
const O_TIM = 'flex items-center gap-2 rounded-10 border border-border-card bg-surface-card px-3.5 py-2.5'

type XacNhan =
  | { loai: 'xoa-tu'; tu: DongTu; soBai: number }
  | { loai: 'xoa-chu-de'; soTu: number }

export default function TuVungPage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const [chuDe, setChuDe] = useState<TomTatChuDe[] | null>(null)
  const [tu, setTu] = useState<DongTu[] | null>(null)
  // Ô tìm kiếm + ô tên chủ đề gắn theo route: đổi chủ đề là tự trả về giá trị mới, không cần effect
  // (React khuyến nghị "adjusting state when props change" thay vì setState trong useEffect).
  const [oTim, setOTim] = useState({ id: '', val: '' })
  const [oTen, setOTen] = useState({ id: '', val: '' })
  const [loi, setLoi] = useState<string | null>(null)
  const [dangSua, setDangSua] = useState<DongTu | null>(null)
  const [xacNhan, setXacNhan] = useState<XacNhan | null>(null)
  const [dangChay, setDangChay] = useState(false)

  const napChuDe = useCallback(async () => {
    const [tRes, lRes, wRes] = await Promise.all([
      supabase.from('topics').select('id, name, description'),
      supabase.from('vocab_topics').select('topic_id, vocab_id'),
      supabase.from('word_state').select('vocab_id, stage, next_review_date'),
    ])
    const e = tRes.error ?? lRes.error ?? wRes.error
    if (e) return setLoi(e.message)
    setChuDe(
      tomTatChuDe({
        topics: (tRes.data ?? []) as { id: string; name: string; description: string | null }[],
        lienKet: (lRes.data ?? []) as { topic_id: string; vocab_id: string }[],
        trangThai: (wRes.data ?? []) as { vocab_id: string; stage: string; next_review_date: string | null }[],
        homNay: homNayVN(new Date()),
      }),
    )
  }, [])

  const napTu = useCallback(async (id: string) => {
    setTu(null)
    const lk = await supabase.from('vocab_topics').select('vocab_id').eq('topic_id', id)
    if (lk.error) return setLoi(lk.error.message)
    const ids = (lk.data ?? []).map((r) => r.vocab_id as string)
    if (ids.length === 0) return setTu([])
    // 2 truy vấn: PostgREST không có FK trực tiếp vocab_topics ↔ vocab để nhúng lồng (bài học M7)
    const { data, error } = await supabase.from('vocab').select('*').in('id', ids).order('word')
    if (error) return setLoi(error.message)
    setTu((data ?? []) as DongTu[])
  }, [])

  useEffect(() => {
    void napChuDe()
  }, [napChuDe])

  useEffect(() => {
    if (topicId) void napTu(topicId)
    else setTu(null)
  }, [topicId, napTu])

  const hienTai = chuDe?.find((c) => c.id === topicId) ?? null
  const khoa = topicId ?? ''
  const tuKhoa = oTim.id === khoa ? oTim.val : ''
  const nhapTen = oTen.id === khoa ? oTen.val : (hienTai?.ten ?? '')
  const setTuKhoa = (v: string) => setOTim({ id: khoa, val: v })
  const setNhapTen = (v: string) => setOTen({ id: khoa, val: v })

  async function luuSua(thay: Partial<Record<FieldSua, string | null>>, xoaAudio: boolean) {
    if (!dangSua) return
    if (Object.keys(thay).length === 0) return setDangSua(null)
    const { error } = await supabase
      .from('vocab')
      .update(xoaAudio ? { ...thay, audio_url: null } : thay)
      .eq('id', dangSua.id)
    if (error) return setLoi(error.message)
    setLoi(null)
    setDangSua(null)
    if (topicId) void napTu(topicId)
  }

  /** Xoá từ: chặn nếu từ đang là VAI B của câu hội thoại thuộc từ khác (payload không có FK). */
  async function hoiXoaTu(t: DongTu) {
    const [vaiB, bai] = await Promise.all([
      supabase.from('exercises').select('vocab_id, vocab(word)').eq('payload->>blank_b_vocab_id', t.id),
      supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('vocab_id', t.id),
    ])
    if (vaiB.error) return setLoi(vaiB.error.message)
    const vuong = ((vaiB.data ?? []) as unknown as { vocab_id: string; vocab: { word: string } | null }[])
      .filter((e) => e.vocab_id !== t.id)
      .map((e) => e.vocab?.word ?? '?')
    if (vuong.length > 0) {
      return setLoi(
        `Không xoá được "${t.word}": từ này đang là vai B trong câu hội thoại của ${[...new Set(vuong)].join(', ')}. Hãy import lại chủ đề nếu muốn đổi.`,
      )
    }
    setLoi(null)
    setXacNhan({ loai: 'xoa-tu', tu: t, soBai: bai.count ?? 0 })
  }

  async function chay() {
    if (!xacNhan) return
    setDangChay(true)
    if (xacNhan.loai === 'xoa-tu') {
      const { error } = await supabase.from('vocab').delete().eq('id', xacNhan.tu.id)
      setDangChay(false)
      setXacNhan(null)
      if (error) return setLoi(error.message)
      if (topicId) void napTu(topicId)
      void napChuDe()
      return
    }
    const { error } = await supabase.rpc('xoa_chu_de', { p_topic_id: topicId })
    setDangChay(false)
    setXacNhan(null)
    if (error) return setLoi(error.message)
    void napChuDe()
    navigate('/tu-vung', { replace: true })
  }

  async function doiTen() {
    if (!topicId || !nhapTen.trim()) return
    const { error } = await supabase.from('topics').update({ name: nhapTen.trim() }).eq('id', topicId)
    if (error) return setLoi(error.message)
    setLoi(null)
    void napChuDe()
  }

  const dsHien = locTu(tu ?? [], tuKhoa)

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="px-[22px] pt-5 pb-3 md:px-8 md:pt-6 md:pb-4">
        <h1 className="font-display text-22 font-bold text-content-primary md:text-24">Từ vựng</h1>
      </div>

      {loi && (
        <div role="alert" className="mx-[22px] mb-3 flex items-start justify-between gap-3 rounded-14 border border-danger bg-danger-bg px-4 py-3 text-13 text-danger-text md:mx-8">
          <span>{loi}</span>
          <button type="button" onClick={() => setLoi(null)} className="shrink-0 font-semibold">
            Đóng
          </button>
        </div>
      )}

      <div className="flex flex-1 border-t border-border-card">
        {/* Cột chủ đề — Mobile ẩn khi đã vào 1 chủ đề */}
        <div className={`${topicId ? 'hidden md:flex' : 'flex'} w-full flex-col gap-2.5 overflow-y-auto p-[22px] md:w-[300px] md:shrink-0 md:border-r md:border-border-card md:p-5`}>
          {!chuDe
            ? [0, 1, 2].map((i) => <div key={i} className="h-[70px] animate-pulse rounded-14 bg-surface-sunken" />)
            : chuDe.length === 0
              ? <p className="text-14 text-content-muted">Chưa có chủ đề nào — hãy import bộ từ đầu tiên.</p>
              : chuDe.map((c) => {
                  const chon = c.id === topicId
                  return (
                    <Link
                      key={c.id}
                      to={`/tu-vung/${c.id}`}
                      className={`rounded-14 p-3.5 ${chon ? 'border-[1.5px] border-accent bg-accent-tint' : 'border border-border-card bg-surface-card'}`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-15 font-bold ${chon ? 'text-accent-text' : 'text-content-primary'}`}>{c.ten}</span>
                        <span className={`shrink-0 text-12 ${chon ? 'text-accent' : 'text-content-muted'}`}>{c.so_tu} từ</span>
                      </div>
                      <div className="mt-2 flex h-1.5 overflow-hidden rounded-pill bg-surface-sunken">
                        {c.khuc.map((k, i) =>
                          k.so === 0 ? null : (
                            <div key={k.stage} className={MAU_STAGE[i]} style={{ width: `${(k.so / Math.max(1, c.so_tu)) * 100}%` }} />
                          ),
                        )}
                      </div>
                    </Link>
                  )
                })}
        </div>

        {/* Cột từ */}
        <div className={`${topicId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col overflow-y-auto p-[22px] md:p-8`}>
          {!hienTai ? (
            <p className="text-14 text-content-muted">Chọn một chủ đề để xem danh sách từ.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-3">
                <Link to="/tu-vung" aria-label="Quay lại danh sách chủ đề" className="text-content-primary md:hidden">
                  <Icon ten="back" size={20} strokeWidth={2} />
                </Link>
                <h2 className="font-display text-19 font-bold text-content-primary md:text-18">{hienTai.ten}</h2>
              </div>

              <div className="mb-4 flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1 md:max-w-[280px]">
                  <label className="mb-1 block text-11 font-semibold text-content-muted" htmlFor="o-ten">
                    Tên chủ đề
                  </label>
                  <input
                    id="o-ten"
                    value={nhapTen}
                    onChange={(e) => setNhapTen(e.target.value)}
                    aria-label="Tên chủ đề"
                    className="w-full rounded-10 border border-border-card bg-surface-card px-3.5 py-2 text-13 text-content-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={nhapTen.trim() === hienTai.ten || !nhapTen.trim()}
                  onClick={() => void doiTen()}
                  className="rounded-10 bg-accent px-3 py-2 text-13 font-semibold text-white disabled:opacity-60"
                >
                  Đổi tên
                </button>
                <button
                  type="button"
                  onClick={() => setXacNhan({ loai: 'xoa-chu-de', soTu: hienTai.so_tu })}
                  className="rounded-10 border border-danger px-3 py-2 text-13 font-semibold text-danger-text"
                >
                  Xoá chủ đề
                </button>
              </div>

              <div className={`${O_TIM} mb-4 max-w-[320px]`}>
                <Icon ten="tim" size={15} strokeWidth={2} className="shrink-0 text-content-muted" />
                <input
                  value={tuKhoa}
                  onChange={(e) => setTuKhoa(e.target.value)}
                  placeholder="Tìm từ vựng..."
                  aria-label="Tìm từ vựng"
                  className="min-w-0 flex-1 bg-transparent text-13 text-content-primary placeholder:text-content-muted focus:outline-none"
                />
              </div>

              <div className="max-w-[640px]">
                {!tu ? (
                  [0, 1, 2].map((i) => <div key={i} className="mb-2 h-14 animate-pulse rounded-10 bg-surface-sunken" />)
                ) : dsHien.length === 0 ? (
                  <p className="text-14 text-content-muted">
                    {tu.length === 0 ? 'Chủ đề này chưa có từ nào.' : 'Không tìm thấy từ nào khớp.'}
                  </p>
                ) : (
                  dsHien.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 border-b border-border-card py-3 md:py-3.5">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span lang={t.lang} className="font-han text-17 font-semibold text-content-primary">{t.word}</span>
                          {t.pinyin && <span className="text-12 text-content-muted">{t.pinyin}</span>}
                        </div>
                        <div className="mt-0.5 text-13 text-content-nav">{t.meaning_vi}</div>
                      </div>
                      <div className="flex shrink-0 gap-3.5">
                        <button type="button" aria-label={`Sửa ${t.word}`} onClick={() => setDangSua(t)} className="text-content-muted">
                          <Icon ten="sua" size={17} />
                        </button>
                        <button type="button" aria-label={`Xoá ${t.word}`} onClick={() => void hoiXoaTu(t)} className="text-danger">
                          <Icon ten="xoa" size={17} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {dangSua && <FormSuaTu tu={dangSua} onDong={() => setDangSua(null)} onLuu={luuSua} />}
      {xacNhan && (
        <HopXacNhan
          tieuDe={xacNhan.loai === 'xoa-tu' ? `Xoá từ "${xacNhan.tu.word}"?` : `Xoá chủ đề "${hienTai?.ten}"?`}
          noiDung={
            xacNhan.loai === 'xoa-tu'
              ? `Sẽ xoá vĩnh viễn từ này cùng ${xacNhan.soBai} bài tập và toàn bộ lịch sử ôn của nó. Không hoàn tác được.`
              : `Sẽ xoá chủ đề cùng ${xacNhan.soTu} từ trong đó (kèm bài tập và lịch sử ôn). Từ nào còn thuộc chủ đề khác sẽ được giữ lại. Không hoàn tác được.`
          }
          dangChay={dangChay}
          onDong={() => setXacNhan(null)}
          onXacNhan={() => void chay()}
        />
      )}
    </div>
  )
}
