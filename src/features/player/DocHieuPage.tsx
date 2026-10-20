import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import { BangLoi, KhungLoi, KhungRong } from '../../components/TrangThai.tsx'
import { phatAmThanh } from '../../lib/amThanh.ts'
import { chamDoan, docBaiDoc, thoiGianDoan, xaoLuot, type BaiDoc, type CauHoiDoc } from '../../lib/docHieu.ts'
import { chiaDam } from '../../lib/hoiThoai.ts'
import { supabase } from '../../lib/supabase.ts'
import { phatAm } from '../../lib/tts.ts'
import { useDungPhim } from './dungPhim.ts'

/**
 * ĐỌC HIỂU CHỦ ĐỀ (M31, design.m31.md §5.1 — KHÔNG có mockup, bố cục đã duyệt). Route riêng
 * `/on-tap/doc-hieu?topic=X`, KHÔNG nhét vào Player (bài học MB-26): lượt kết thúc khi hết danh sách đoạn.
 * Không tính điểm SRS. Mỗi đoạn Kiểm tra xong ghi NGAY 1 dòng `doc_hieu_log` (thoát giữa chừng vẫn còn).
 * Sau Kiểm tra ĐƯỢC lộ đáp án đúng (chấm 1 lần, khác luật "chọn lại đến khi đúng" M25 — có chủ ý).
 */
const O = 'flex w-full items-start gap-3 rounded-14 border px-4 py-3 text-left transition-colors'
const O_TRUNG_TINH = `${O} border-border-input bg-surface-raised text-content-primary`
const O_DANG_CHON = `${O} border-[1.5px] border-accent bg-accent-tint text-content-primary`
const O_DUNG = `${O} border-[1.5px] border-success bg-success-bg text-success-text`
const O_SAI = `${O} border-[1.5px] border-danger bg-danger-bg text-danger-text`
const NHAN = ['A', 'B', 'C', 'D'] as const

type Lang = 'zh' | 'en'

function KhoiDoan({
  bai,
  lang,
  hienPhienAm,
  daCham,
  hienDich,
  onDich,
}: {
  bai: BaiDoc
  lang: Lang
  hienPhienAm: boolean
  daCham: boolean
  hienDich: boolean
  onDich: () => void
}) {
  // Từ chủ đề CHỈ tô đậm sau Kiểm tra (Q7) — trước đó đọc như đề thi thật
  const chu = (text: string) =>
    chiaDam(text, daCham ? bai.tu_dam : []).map((p, j) =>
      p.dam ? (
        <b key={j} className="font-bold text-accent">
          {p.text}
        </b>
      ) : (
        <span key={j}>{p.text}</span>
      ),
    )
  const font = lang === 'zh' ? 'font-han' : 'font-body'

  return (
    <section className="rounded-20 border border-border-card bg-surface-card p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-12 font-semibold uppercase tracking-[0.04em] text-content-muted">
          {bai.kieu === 'hoi_thoai' ? 'Hội thoại' : 'Đoạn văn'}
        </span>
        <div className="flex items-center gap-3">
          {daCham && (
            <button
              type="button"
              onClick={onDich}
              aria-pressed={hienDich}
              className="rounded-pill border border-border-card px-3 py-1 text-12 font-semibold text-content-nav"
            >
              {hienDich ? 'Ẩn bản dịch' : 'Hiện bản dịch'}
            </button>
          )}
          <button
            type="button"
            aria-label="Nghe cả đoạn"
            className="text-content-muted"
            onClick={() => phatAm(bai.lines.map((l) => l.text).join(lang === 'zh' ? '' : ' '), lang)}
          >
            <Icon ten="loa" size={18} />
          </button>
        </div>
      </div>

      {bai.kieu === 'hoi_thoai' ? (
        <div className="flex flex-col gap-2.5">
          {bai.lines.map((l, k) => (
            <div
              key={k}
              className={`max-w-[88%] border px-3.5 py-2.5 ${
                l.speaker !== 'B'
                  ? 'self-start rounded-16 rounded-bl-[4px] border-border-card bg-surface-page'
                  : 'self-end rounded-16 rounded-br-[4px] border-border-chat-b bg-surface-chat-b'
              }`}
            >
              <p lang={lang} className={`${font} text-16 leading-relaxed text-content-primary md:text-17`}>
                <span className="mr-1.5 font-body text-12 font-semibold text-content-muted">{l.speaker}</span>
                {chu(l.text)}
              </p>
              {hienPhienAm && l.pinyin && <div className="mt-0.5 text-12 text-content-muted">{l.pinyin}</div>}
              {hienDich && l.vi && <div className="mt-1 text-13 text-content-nav">{l.vi}</div>}
            </div>
          ))}
        </div>
      ) : hienPhienAm || hienDich ? (
        // Bật pinyin/dịch ⇒ mỗi câu 1 dòng để pinyin & bản dịch canh đúng câu
        <div className="flex flex-col gap-2.5">
          {bai.lines.map((l, k) => (
            <div key={k}>
              <p lang={lang} className={`${font} text-17 leading-relaxed text-content-primary md:text-18`}>
                {chu(l.text)}
              </p>
              {hienPhienAm && l.pinyin && <div className="text-12 text-content-muted">{l.pinyin}</div>}
              {hienDich && l.vi && <div className="mt-0.5 text-13 text-content-nav">{l.vi}</div>}
            </div>
          ))}
        </div>
      ) : (
        <p lang={lang} className={`${font} text-17 leading-[1.9] text-content-primary md:text-18`}>
          {bai.lines.map((l, k) => (
            <span key={k}>
              {chu(l.text)}
              {lang === 'en' ? ' ' : ''}
            </span>
          ))}
        </p>
      )}
    </section>
  )
}

function KhoiCauHoi({
  q,
  so,
  lang,
  hienPhienAm,
  chon,
  dung,
  onChon,
}: {
  q: CauHoiDoc
  so: number
  lang: Lang
  hienPhienAm: boolean
  chon: number | null
  /** null = chưa Kiểm tra */
  dung: boolean | null
  onChon: (k: number) => void
}) {
  const daCham = dung !== null
  const font = lang === 'zh' ? 'font-han' : 'font-body'
  const lop = (k: number) => {
    if (!daCham) return k === chon ? O_DANG_CHON : `${O_TRUNG_TINH} hover:border-accent`
    if (k === q.dap_an) return O_DUNG
    return k === chon ? O_SAI : `${O_TRUNG_TINH} opacity-60`
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p lang={lang} className={`${font} text-16 font-semibold text-content-primary md:text-17`}>
          {so}. {q.hoi}
        </p>
        {hienPhienAm && q.hoi_pinyin && <div className="text-12 text-content-muted">{q.hoi_pinyin}</div>}
      </div>
      {q.lua_chon.map((x, k) => (
        <button key={k} type="button" disabled={daCham} onClick={() => onChon(k)} className={lop(k)}>
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-current text-12 font-semibold">
            {NHAN[k]}
          </span>
          <span>
            <span lang={lang} className={`${font} block text-15 md:text-16`}>
              {x}
            </span>
            {hienPhienAm && q.lua_chon_pinyin[k] && (
              <span className="block text-12 text-content-muted">{q.lua_chon_pinyin[k]}</span>
            )}
          </span>
        </button>
      ))}
      {daCham && q.giai_thich_vi && (
        <div className="rounded-12 bg-surface-sunken px-4 py-3 text-13 leading-normal text-content-nav">{q.giai_thich_vi}</div>
      )}
    </div>
  )
}

export default function DocHieuPage() {
  const navigate = useNavigate()
  const topicId = new URLSearchParams(location.search).get('topic')
  const [ten, setTen] = useState('')
  const [lang, setLang] = useState<Lang>('zh')
  const [ds, setDs] = useState<BaiDoc[] | null>(null)
  const [loiTai, setLoiTai] = useState<string | null>(null)
  const [i, setI] = useState(0)
  const [daChon, setDaChon] = useState<(number | null)[]>([])
  const [ketQua, setKetQua] = useState<{ so_dung: number; dung: boolean[] } | null>(null)
  const [hienPhienAm, setHienPhienAm] = useState(false) // Q7: mặc định TẮT, như đề thi
  const [hienDich, setHienDich] = useState(false)
  const [loiGhi, setLoiGhi] = useState<string | null>(null)
  // 1 lần vào màn = 1 lượt; khởi tạo lười để không sinh UUID thừa mỗi lần render
  const [luotId] = useState(() => crypto.randomUUID())
  const soDaGhi = useRef(0)
  const mocDoan = useRef(Date.now())
  const daCham = useRef(false)
  const thuLaiGhi = useRef<(() => void) | null>(null)

  const nap = useCallback(async () => {
    if (!topicId) return navigate('/on-tap/chu-de', { replace: true })
    const [tRes, vRes, rRes] = await Promise.all([
      supabase.from('topics').select('name').eq('id', topicId).maybeSingle(),
      supabase.from('vocab_topics').select('vocab(id, word, lang)').eq('topic_id', topicId),
      supabase.from('topic_readings').select('id, kieu, thu_tu, content').eq('topic_id', topicId).order('thu_tu'),
    ])
    const e = tRes.error ?? vRes.error ?? rRes.error
    if (e) return setLoiTai(e.message)
    // supabase-js suy kiểu quan hệ vocab(...) thành mảng; thực tế là 1 object (FK n-1)
    const tu = ((vRes.data ?? []) as unknown as { vocab: { id: string; word: string; lang: Lang } | null }[])
      .map((r) => r.vocab)
      .filter((v): v is { id: string; word: string; lang: Lang } => Boolean(v))
    setTen((tRes.data as { name?: string } | null)?.name ?? '')
    setLang(tu[0]?.lang ?? 'zh')
    const bai = xaoLuot(docBaiDoc(rRes.data, Object.fromEntries(tu.map((v) => [v.id, v.word]))), Math.random)
    setDs(bai)
    setDaChon(bai[0]?.questions.map(() => null) ?? [])
    mocDoan.current = Date.now()
  }, [topicId, navigate])

  useEffect(() => {
    void nap()
  }, [nap])

  const bai = ds?.[i]
  const cuoiCung = ds !== null && i + 1 >= ds.length

  function ghi(dong: object) {
    thuLaiGhi.current = () => ghi(dong)
    void supabase
      .from('doc_hieu_log')
      .insert(dong)
      .then(({ error }) => {
        if (error) return setLoiGhi(error.message)
        setLoiGhi(null)
        soDaGhi.current += 1
      })
  }

  function kiemTra() {
    if (!bai || !topicId || daCham.current) return
    const kq = chamDoan(bai.questions, daChon)
    if (!kq) return
    daCham.current = true // chặn bấm đôi ⇒ đúng 1 INSERT/đoạn
    setKetQua(kq)
    phatAmThanh(kq.so_dung === bai.questions.length ? 'dung' : 'sai')
    ghi({
      luot_id: luotId,
      topic_id: topicId,
      reading_id: bai.id,
      so_cau: bai.questions.length,
      so_dung: kq.so_dung,
      thoi_gian_ms: thoiGianDoan(mocDoan.current, Date.now()),
    })
  }

  function thoat() {
    // Ghi chưa xong (đang chờ mạng) vẫn tính là đã làm — màn Kết quả đọc lại từ DB
    const daLam = soDaGhi.current > 0 || daCham.current
    navigate(
      daLam && topicId ? `/on-tap/doc-hieu/ket-qua?luot=${luotId}&topic=${topicId}` : '/on-tap/chu-de',
      { replace: true },
    )
  }

  function tiep() {
    if (!ds || !ketQua) return
    if (cuoiCung) return thoat()
    setI(i + 1)
    setDaChon(ds[i + 1]?.questions.map(() => null) ?? [])
    setKetQua(null)
    setHienDich(false)
    setLoiGhi(null)
    daCham.current = false
    mocDoan.current = Date.now()
    window.scrollTo({ top: 0 })
  }

  // M11/Q2 — Enter = hành động chính của màn
  useDungPhim((e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (ketQua) tiep()
    else kiemTra()
  })

  if (loiTai) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div className="w-full max-w-[480px]">
          <KhungLoi
            tieuDe="Chưa tải được bài đọc"
            loi={loiTai}
            onThuLai={() => {
              setLoiTai(null)
              void nap()
            }}
            phu={{ nhan: 'Chọn chủ đề khác', toi: '/on-tap/chu-de' }}
          />
        </div>
      </main>
    )
  }
  if (ds && ds.length === 0) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div className="w-full max-w-[480px]">
          <KhungRong
            tieuDe="Chủ đề này chưa có bài đọc hiểu"
            moTa="Bài đọc được nạp từ file đề — chọn chủ đề khác nhé."
            hanhDong={{ nhan: 'Chọn chủ đề khác', toi: '/on-tap/chu-de' }}
          />
        </div>
      </main>
    )
  }
  if (!bai || !ds) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div className="grid w-full max-w-[1040px] gap-5 md:grid-cols-[1.15fr_1fr]">
          <div className="h-[260px] animate-pulse rounded-20 bg-surface-sunken" />
          <div className="h-[260px] animate-pulse rounded-20 bg-surface-sunken" />
        </div>
      </main>
    )
  }

  const duChon = daChon.every((x) => x !== null)
  return (
    <main className="flex min-h-[100dvh] flex-col bg-surface-page">
      <header className="flex items-center justify-between gap-3 border-b border-border-card px-5 py-4 md:px-8 md:py-5">
        <div className="min-w-0">
          <div className="text-12 font-semibold uppercase tracking-[0.04em] text-content-muted">
            Đọc hiểu · {i + 1}/{ds.length}
          </div>
          <h1 className="truncate font-display text-17 font-bold text-content-primary md:text-19">{ten}</h1>
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
          <button type="button" aria-label="Thoát" onClick={thoat} className="text-content-nav">
            <Icon ten="dong" size={20} strokeWidth="2" />
          </button>
        </div>
      </header>

      <div className="flex justify-center gap-1.5 pt-4">
        {ds.map((_, k) => (
          <span
            key={k}
            className={`h-1.5 rounded-pill transition-all ${
              k === i ? 'w-5 bg-accent' : k < i ? 'w-1.5 bg-accent' : 'w-1.5 bg-border-card'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 justify-center px-5 py-5 md:px-8 md:py-7">
        <div className="grid w-full max-w-[1040px] items-start gap-5 md:grid-cols-[1.15fr_1fr] md:gap-7">
          {/* PC: cột đoạn đứng yên khi cuộn câu hỏi, để đọc lại được */}
          <div className="md:sticky md:top-6">
            <KhoiDoan
              bai={bai}
              lang={lang}
              hienPhienAm={hienPhienAm}
              daCham={ketQua !== null}
              hienDich={hienDich}
              onDich={() => setHienDich((v) => !v)}
            />
          </div>
          <div className="flex flex-col gap-6">
            {bai.questions.map((q, k) => (
              <KhoiCauHoi
                key={`${bai.id}-${k}`}
                q={q}
                so={k + 1}
                lang={lang}
                hienPhienAm={hienPhienAm}
                chon={daChon[k] ?? null}
                dung={ketQua ? (ketQua.dung[k] ?? false) : null}
                onChon={(x) => setDaChon((cu) => cu.map((v, j) => (j === k ? x : v)))}
              />
            ))}
            {loiGhi && <BangLoi loi={loiGhi} tienTo="Chưa lưu được kết quả" onThuLai={() => thuLaiGhi.current?.()} />}
            {ketQua ? (
              <button type="button" onClick={tiep} className="rounded-14 bg-accent py-4 text-15 font-semibold text-white md:text-16">
                {cuoiCung ? 'Xem kết quả' : 'Đoạn tiếp'}
              </button>
            ) : (
              <button
                type="button"
                onClick={kiemTra}
                disabled={!duChon}
                className="rounded-14 bg-accent py-4 text-15 font-semibold text-white disabled:opacity-40 md:text-16"
              >
                Kiểm tra
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
