import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Icon, IconCay, type StageCay } from '../../components/icons.tsx'
import { tomTatChuDe, type TomTatChuDe } from '../../lib/chuDe.ts'
import { homNayVN } from '../../lib/player.ts'
import { docNguPhap, type MucNguPhap } from '../../lib/nguPhap.ts'
import { supabase } from '../../lib/supabase.ts'
import { locTheoStage, locTu, NHAN_STAGE, type DongTu, type FieldSua } from '../../lib/tuVung.ts'
import { THU_TU_STAGE } from '../../lib/dashboard.ts'
import type { Stage } from '../../lib/srs.ts'
import FormSuaTu from './FormSuaTu.tsx'
import HopXacNhan from '../../components/HopXacNhan.tsx'

/**
 * Quản lý từ vựng & chủ đề (M8) — mockup 13/14 PC, 13/14/15 Mobile.
 * PC: master-detail 2 cột. Mobile: 2 màn tách biệt theo route, chuyển bố cục bằng CSS `md:`.
 *
 * KHÔNG có nút "Thêm từ mới" (UI_DESIGN §8.4 — nguồn nhập liệu chính là Import) và KHÔNG sửa được
 * payload 17 dạng bài tập.
 */
const MAU_STAGE = ['bg-ring-0', 'bg-ring-1', 'bg-ring-2', 'bg-ring-3', 'bg-ring-4', 'bg-ring-5'] as const
const CHU_STAGE: Record<Stage, string> = {
  new: 'text-ring-0', stage1: 'text-ring-1', stage2: 'text-ring-2',
  stage3: 'text-ring-3', intensive: 'text-ring-4', mastered: 'text-ring-5',
}
const TAT_CA = 'tat-ca'
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
  const [locStage, setLocStage] = useState<Stage | 'tat-ca'>(TAT_CA)
  /** M12b — ngữ pháp CỦA CHỦ ĐỀ (bảng `topic_grammar`); chế độ "tất cả" không có. */
  const [nguPhap, setNguPhap] = useState<MucNguPhap[]>([])
  const [moNguPhap, setMoNguPhap] = useState<number | null>(null)
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
    setMoNguPhap(null)
    // M12b — ngữ pháp chủ đề chỉ có nghĩa khi đang xem 1 chủ đề cụ thể
    if (id === TAT_CA) setNguPhap([])
    else {
      const g = await supabase.from('topic_grammar').select('*').eq('topic_id', id).order('thu_tu')
      setNguPhap(docNguPhap(g.data))
    }
    // Chế độ "tất cả": lấy toàn bộ vocab; ngược lại lọc theo liên kết của chủ đề.
    // 2 truy vấn vì PostgREST không có FK trực tiếp vocab_topics ↔ vocab (bài học M7).
    let cauTruy = supabase.from('vocab').select('*').order('word')
    if (id !== TAT_CA) {
      const lk = await supabase.from('vocab_topics').select('vocab_id').eq('topic_id', id)
      if (lk.error) return setLoi(lk.error.message)
      const ids = (lk.data ?? []).map((r) => r.vocab_id as string)
      if (ids.length === 0) return setTu([])
      cauTruy = cauTruy.in('id', ids)
    }
    const [vRes, wRes] = await Promise.all([
      cauTruy,
      supabase.from('word_state').select('vocab_id, stage'),
    ])
    if (vRes.error) return setLoi(vRes.error.message)
    if (wRes.error) return setLoi(wRes.error.message)
    const stageCua = new Map((wRes.data ?? []).map((r) => [r.vocab_id as string, r.stage as Stage]))
    // `exactOptionalPropertyTypes`: chỉ gắn khoá `stage` khi THỰC SỰ có, không gán undefined
    setTu(
      ((vRes.data ?? []) as DongTu[]).map((t) => {
        const st = stageCua.get(t.id)
        return st ? { ...t, stage: st } : t
      }),
    )
  }, [])

  useEffect(() => {
    void napChuDe()
  }, [napChuDe])

  useEffect(() => {
    if (topicId) void napTu(topicId)
    else setTu(null)
  }, [topicId, napTu])

  const laTatCa = topicId === TAT_CA
  const hienTai = chuDe?.find((c) => c.id === topicId) ?? null
  const tongTu = chuDe?.reduce((a, c) => a + c.so_tu, 0) ?? 0
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

  const dsHien = locTheoStage(locTu(tu ?? [], tuKhoa), locStage)
  const demStage = (s: Stage) => (tu ?? []).filter((t) => t.stage === s).length

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
          {chuDe && (
            <Link
              to={`/tu-vung/${TAT_CA}`}
              className={`rounded-14 p-3.5 ${laTatCa ? 'border-[1.5px] border-accent bg-accent-tint' : 'border border-border-card bg-surface-card'}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-15 font-bold ${laTatCa ? 'text-accent-text' : 'text-content-primary'}`}>
                  Tất cả từ vựng
                </span>
                <span className={`shrink-0 text-12 ${laTatCa ? 'text-accent' : 'text-content-muted'}`}>{tongTu} từ</span>
              </div>
            </Link>
          )}
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
          {!hienTai && !laTatCa ? (
            <p className="text-14 text-content-muted">Chọn một chủ đề để xem danh sách từ.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-3">
                <Link to="/tu-vung" aria-label="Quay lại danh sách chủ đề" className="text-content-primary md:hidden">
                  <Icon ten="back" size={20} strokeWidth={2} />
                </Link>
                <h2 className="font-display text-19 font-bold text-content-primary md:text-18">
                  {laTatCa ? 'Tất cả từ vựng' : (hienTai?.ten ?? '')}
                </h2>
              </div>

              {!laTatCa && (
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
                  disabled={nhapTen.trim() === hienTai?.ten || !nhapTen.trim()}
                  onClick={() => void doiTen()}
                  className="rounded-10 bg-accent px-3 py-2 text-13 font-semibold text-white disabled:opacity-60"
                >
                  Đổi tên
                </button>
                <button
                  type="button"
                  onClick={() => hienTai && setXacNhan({ loai: 'xoa-chu-de', soTu: hienTai.so_tu })}
                  className="rounded-10 border border-danger px-3 py-2 text-13 font-semibold text-danger-text"
                >
                  Xoá chủ đề
                </button>
              </div>
              )}

              {/* M12b — Ngữ pháp CỦA CHỦ ĐỀ: khối tra cứu, không có thì KHÔNG hiện gì */}
              {nguPhap.length > 0 && (
                <section className="mb-4 rounded-14 border border-border-card bg-surface-sunken p-4">
                  <h3 className="mb-2.5 text-12 font-bold uppercase tracking-[0.04em] text-content-muted">
                    Ngữ pháp chủ đề ({nguPhap.length})
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {nguPhap.map((g, k) => {
                      const mo = moNguPhap === k
                      return (
                        <li key={k} className="rounded-12 border border-border-card bg-surface-card">
                          <button
                            type="button"
                            aria-expanded={mo}
                            onClick={() => setMoNguPhap(mo ? null : k)}
                            className="flex w-full items-start justify-between gap-3 px-3.5 py-2.5 text-left"
                          >
                            <span className="min-w-0">
                              <span className="block font-han text-15 font-semibold text-content-primary">
                                {g.content_target}
                              </span>
                              {g.pinyin && (
                                <span className="mt-0.5 block text-12 text-content-muted">{g.pinyin}</span>
                              )}
                            </span>
                            <span className="shrink-0 text-13 text-content-muted">{mo ? '−' : '+'}</span>
                          </button>
                          {mo && (
                            <div className="border-t border-border-card px-3.5 py-2.5">
                              <p className="text-13 leading-relaxed text-content-nav">{g.content_vi}</p>
                              {g.vi_du && (
                                <div className="mt-2">
                                  <p className="font-han text-14 text-content-primary">{g.vi_du}</p>
                                  {g.vi_du_pinyin && (
                                    <p className="mt-0.5 text-12 text-content-muted">{g.vi_du_pinyin}</p>
                                  )}
                                  {g.vi_du_vi && (
                                    <p className="mt-0.5 text-12 text-content-nav">{g.vi_du_vi}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )}

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

              {/* M10: lọc theo stage — dùng cho CẢ chế độ xem theo chủ đề lẫn "tất cả" */}
              <div className="mb-4 flex flex-wrap gap-2">
                {([TAT_CA, ...THU_TU_STAGE] as const).map((st) => {
                  const chon = locStage === st
                  const so = st === TAT_CA ? (tu ?? []).length : demStage(st as Stage)
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setLocStage(st as Stage | 'tat-ca')}
                      className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-12 font-semibold ${
                        chon ? 'bg-accent text-white' : 'border border-border-card bg-surface-card text-content-nav'
                      }`}
                    >
                      {st !== TAT_CA && (
                        <IconCay stage={st as StageCay} size={14} className={chon ? 'text-white' : CHU_STAGE[st as Stage]} />
                      )}
                      <span>{st === TAT_CA ? 'Tất cả' : NHAN_STAGE[st as Stage]}</span>
                      <span className={chon ? 'text-white/70' : 'text-content-muted'}>{so}</span>
                    </button>
                  )
                })}
              </div>

              <div className="max-w-[640px]">
                {!tu ? (
                  [0, 1, 2].map((i) => <div key={i} className="mb-2 h-14 animate-pulse rounded-10 bg-surface-sunken" />)
                ) : dsHien.length === 0 ? (
                  <p className="text-14 text-content-muted">
                    {tu.length === 0
                      ? laTatCa
                        ? 'Chưa có từ vựng nào.'
                        : 'Chủ đề này chưa có từ nào.'
                      : 'Không tìm thấy từ nào khớp.'}
                  </p>
                ) : (
                  dsHien.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 border-b border-border-card py-3 md:py-3.5">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span lang={t.lang} className="font-han text-17 font-semibold text-content-primary">{t.word}</span>
                          {t.pinyin && <span className="text-12 text-content-muted">{t.pinyin}</span>}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-13 text-content-nav">
                          <span>{t.meaning_vi}</span>
                          {t.stage && (
                            <span className="inline-flex items-center gap-1 rounded-pill bg-surface-sunken px-2 py-0.5 text-11 font-semibold text-content-muted">
                              <IconCay stage={t.stage as StageCay} size={12} className={CHU_STAGE[t.stage]} />
                              {NHAN_STAGE[t.stage]}
                            </span>
                          )}
                        </div>
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
