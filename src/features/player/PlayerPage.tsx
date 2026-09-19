import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  coBaiTinhDiem,
  giamPlayer,
  gomSessionTopic,
  homNayVN,
  locRetryTheoRecord,
  stageBaiTap,
  xepBai,
  type BaiTapDb,
  type HangRetry,
  type Man,
  type VocabDb,
} from '../../lib/player.ts'
import {
  boBaiCua,
  gomSession,
  xuLyFlashcard,
  xuLyTraLoi,
  type DangBai,
  type TrangThaiTu,
} from '../../lib/srs.ts'
import { chamBaiTuLuan, giaiThichBai } from '../../lib/ai.ts'
import { dungTuVerdict, type GiaiThich as NoiDungGiaiThich, type KetQuaCham } from '../../lib/aiCore.ts'
import { supabase } from '../../lib/supabase.ts'
import ExerciseShell, { type Ghost } from './ExerciseShell.tsx'
import Ring from './Ring.tsx'
import GiaiThichPanel from './GiaiThich.tsx'
import ChamAI from './bai/ChamAI.tsx'
import DienTu from './bai/DienTu.tsx'
import FastDecision from './bai/FastDecision.tsx'
import Flashcard from './bai/Flashcard.tsx'
import Grammar from './bai/Grammar.tsx'
import HoiThoai from './bai/HoiThoai.tsx'
import Matching from './bai/Matching.tsx'
import SapXep from './bai/SapXep.tsx'
import TracNghiem, { type CheDoTracNghiem } from './bai/TracNghiem.tsx'
import TuLuan from './bai/TuLuan.tsx'

/**
 * Player — ôn hằng ngày (M4a: stage 0 · M4b: stage 1-2). Route /on-tap, NGOÀI AppShell (mockup không có nav).
 * Toàn bộ chuyển trạng thái nằm ở reducer thuần `giamPlayer`; component chỉ làm 3 side-effect:
 * query session, gọi rpc `luu_tra_loi`, phát âm. Luật SRS: `xuLyTraLoi` (srs.ts) — không lặp ở đây.
 *
 * Luồng session (DESIGN.md §2.1): từ due → gomSession → session đầu → xepBai → trả lời từng màn
 * → hết → còn từ due CHƯA ôn hôm nay? nạp tiếp : Tổng kết. Từ đã ôn hôm nay (có review_log) chỉ
 * quay lại ở lượt retry riêng (?che_do=retry) — đúng DEC-06 "không retry ngay trong session".
 */

type DongWordState = TrangThaiTu & { vocab: VocabDb }

/** vocab_id → dạng bài có record (tính cả vai B của bài hội thoại) — dùng lọc hàng retry (M4b/Q4). */
function dungMapRecord(baiTap: BaiTapDb[]): Record<string, DangBai[]> {
  const co: Record<string, DangBai[]> = {}
  const them = (id: string, t: DangBai) => {
    co[id] = [...(co[id] ?? []), t]
  }
  for (const b of baiTap) {
    them(b.vocab_id, b.type)
    const idB = (b.payload as { blank_b_vocab_id?: string | null })['blank_b_vocab_id']
    if (idB) them(idB, b.type)
  }
  return co
}

function sangTrangThaiTu(r: Record<string, unknown>): TrangThaiTu {
  return {
    vocab_id: r['vocab_id'] as string,
    stage: r['stage'] as TrangThaiTu['stage'],
    next_review_date: (r['next_review_date'] as string | null) ?? null,
    cycle_points: r['cycle_points'] as number,
    cycle_completed_exercises: (r['cycle_completed_exercises'] as DangBai[]) ?? [],
    total_points: r['total_points'] as number,
    last_reviewed_at: (r['last_reviewed_at'] as string | null) ?? null,
  }
}

export default function PlayerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const thamSo = new URLSearchParams(location.search)
  const cheDoRetry = thamSo.get('che_do') === 'retry'
  /** Ôn theo chủ đề (M7): ôn TOÀN BỘ từ của topic, chỉ từ đang due mới được tính điểm. */
  const topicId = thamSo.get('che_do') === 'topic' ? thamSo.get('topic') : null

  const [tt, dispatch] = useReducer(giamPlayer, { buoc: 'dang_tai' })
  const [vocab, setVocab] = useState<Record<string, VocabDb>>({})
  const vocabRef = useRef(vocab)
  vocabRef.current = vocab
  const [hienPhienAm, setHienPhienAm] = useState(true)
  const [soGoiY, setSoGoiY] = useState(0)
  const [loiTai, setLoiTai] = useState<string | null>(null)
  /** vocab_id → dạng bài THỰC SỰ có record (tính cả vai B của bài hội thoại) — dùng lọc hàng retry. */
  const dangCoRecord = useRef<Record<string, DangBai[]>>({})
  /** `${vocab_id}|${type}` → exercises.id — cần để cache `ai_explanation` (§8). */
  const idRecord = useRef<Record<string, string>>({})
  const ttRef = useRef(tt)
  ttRef.current = tt
  const thuLaiRef = useRef<(() => Promise<unknown>) | null>(null)
  const daOnGiDo = useRef(false) // đã hoàn thành ≥1 từ trong lượt này → thoát/hết thì về Tổng kết
  // M5 — tự luận: câu trả lời gom vào đệm, chỉ chấm ở màn `cham_ai` (DEC-14: 3 request/session)
  const dapAnTuLuan = useRef<Record<string, string>>({})
  const [chamTt, setChamTt] = useState<{ b: 'dang_cham' | 'xong' | 'loi'; loi?: string; chiSo: number }>({ b: 'dang_cham', chiSo: 0 })
  const ketQuaAI = useRef<Record<string, KetQuaCham>>({})
  /** Chế độ topic: các từ ĐANG due hôm nay — chỉ những từ này mới được cộng điểm/dời lịch (M7/Q2). */
  const dueTrongTopic = useRef<Set<string>>(new Set())
  /**
   * Chế độ topic: từ đã được phục vụ trong LƯỢT này. Bắt buộc phải có — `boQuaDaDat` khiến không còn
   * gì lọc từ ra khỏi session, nên nếu thiếu thì `napSession` dựng lại đúng session đó mãi mãi
   * (bug kiểm thật M7: 26 lần cùng một màn, 82 dòng review_log rác).
   */
  const daPhucVuTopic = useRef<Set<string>>(new Set())
  const [giaiThich, setGiaiThich] = useState<{ mo: boolean; dangTai: boolean; noiDung: NoiDungGiaiThich | null; loi: string | null }>({ mo: false, dangTai: false, noiDung: null, loi: null })

  /** Tải mọi bài tập của các từ due, gồm cả record hội thoại trỏ tới chúng qua vai B (§4.4). */
  const taiBaiTap = useCallback(async (ids: string[]): Promise<BaiTapDb[]> => {
    const [btChinh, btVaiB] = await Promise.all([
      supabase.from('exercises').select('id, vocab_id, type, payload').in('vocab_id', ids),
      supabase.from('exercises').select('id, vocab_id, type, payload').in('type', ['select_dialog', 'fill_dialog']).in('payload->>blank_b_vocab_id', ids),
    ])
    if (btChinh.error) throw btChinh.error
    if (btVaiB.error) throw btVaiB.error
    // Gộp LOẠI TRÙNG theo exercises.id ⇒ câu hội thoại chỉ xuất hiện 1 lần dù A, B hay cả 2 cùng due
    return [...new Map([...(btChinh.data ?? []), ...(btVaiB.data ?? [])].map((b) => [b.id as string, b])).values()] as BaiTapDb[]
  }, [])

  /** Từ B của bài hội thoại có thể KHÔNG nằm trong session → vẫn cần `word` để hiển thị & chấm. */
  const taiVocabTuB = useCallback(async (baiTap: BaiTapDb[], idsPhien: Set<string>) => {
    const idsB = baiTap
      .map((b) => (b.payload as { blank_b_vocab_id?: string | null })['blank_b_vocab_id'])
      .filter((id): id is string => Boolean(id) && !idsPhien.has(id as string))
    if (idsB.length === 0) return
    const { data } = await supabase.from('vocab').select('*').in('id', idsB)
    if (data) setVocab((cu) => ({ ...cu, ...Object.fromEntries((data as VocabDb[]).map((v) => [v.id, v])) }))
  }, [])

  // ── Nạp session ────────────────────────────────────────────────────────────
  const napSession = useCallback(async () => {
    const homNay = homNayVN(new Date())
    try {
      // Từ đã có log hôm nay → không đưa lại vào session thường (DEC-06); từ có hàng retry → chỉ lượt retry
      const [logRes, retryRes] = await Promise.all([
        supabase.from('review_log').select('vocab_id').gte('reviewed_at', `${homNay}T00:00:00+07:00`),
        supabase.from('daily_retry_queue').select('vocab_id, exercise_types').eq('queue_date', homNay),
      ])
      if (logRes.error) throw logRes.error
      if (retryRes.error) throw retryRes.error
      const coRetry = new Set((retryRes.data ?? []).map((r) => r.vocab_id as string))

      let dong: DongWordState[]
      /** Chỉ dùng ở chế độ retry: vocab_id → dạng cần ôn lại (null = cả bộ của stage đó). */
      const retryTheoTu = new Map<string, DangBai[] | null>()
      if (topicId) {
        // Ôn chủ đề: lấy TOÀN BỘ từ của topic — không lọc theo lịch, không loại mastered, và cũng
        // không loại từ đã ôn hôm nay (đây là luyện tập, không phải chu kỳ SRS hằng ngày).
        // 2 truy vấn: PostgREST KHÔNG có FK trực tiếp vocab_topics ↔ word_state (cả hai chỉ trỏ
        // sang vocab), nhúng lồng nhau sẽ lỗi PGRST200 — đã kiểm thật.
        const ltRes = await supabase.from('vocab_topics').select('vocab_id').eq('topic_id', topicId)
        if (ltRes.error) throw ltRes.error
        const idsTopic = (ltRes.data ?? []).map((r) => r.vocab_id as string)
        if (idsTopic.length === 0) return dispatch({ loai: 'khong_co_tu' })
        const { data, error } = await supabase.from('word_state').select('*, vocab(*)').in('vocab_id', idsTopic)
        if (error) throw error
        dong = (data ?? [])
          .map((r) => ({ ...sangTrangThaiTu(r), vocab: r.vocab as VocabDb }))
          .filter((t) => !daPhucVuTopic.current.has(t.vocab_id)) // mỗi từ đúng 1 lượt (xem ghi chú ở ref)
        if (dong.length === 0) return dispatch({ loai: 'khong_co_tu' })
        dueTrongTopic.current = new Set(
          dong
            .filter((t) => t.stage !== 'mastered' && t.next_review_date !== null && t.next_review_date <= homNay)
            .map((t) => t.vocab_id),
        )
      } else if (cheDoRetry) {
        if (coRetry.size === 0) return dispatch({ loai: 'khong_co_tu' })
        const { data, error } = await supabase.from('word_state').select('*, vocab(*)').in('vocab_id', [...coRetry])
        if (error) throw error
        dong = (data ?? []).map((r) => ({ ...sangTrangThaiTu(r), vocab: r.vocab as VocabDb }))
        // Dạng cho phép tính theo TỪNG TỪ, không gộp chung: hàng đợi chứa từ ở nhiều stage khác nhau,
        // gộp lại sẽ dựng bài của stage này cho từ của stage kia (bug phát hiện khi kiểm thật M5).
        for (const r of retryRes.data ?? []) {
          retryTheoTu.set(r.vocab_id as string, r.exercise_types as DangBai[] | null)
        }
      } else {
        const { data, error } = await supabase
          .from('word_state')
          .select('*, vocab(*)')
          .lte('next_review_date', homNay)
          .neq('stage', 'mastered')
          .order('next_review_date')
        if (error) throw error
        dong = (data ?? [])
          .map((r) => ({ ...sangTrangThaiTu(r), vocab: r.vocab as VocabDb }))
          .filter((t) => !coRetry.has(t.vocab_id))
      }

      const phienAll = topicId ? gomSessionTopic(dong) : gomSession(dong)
      if (phienAll.length === 0) return dispatch({ loai: 'khong_co_tu' })

      // Duyệt từng session cho tới khi gặp session CÒN bài tính điểm. Session chỉ còn
      // flashcard/grammar (từ đã làm hết bài tính điểm nhưng chưa đủ ngưỡng) phải bỏ qua, nếu không
      // sẽ nạp đi nạp lại vô hạn — bug phát hiện khi kiểm thật M4b.
      const idsTatCa = dong.map((t) => t.vocab_id)
      const baiTapTatCa = await taiBaiTap(idsTatCa)
      for (const phien of phienAll) {
        const stage = phien[0]!.stage
        // Session thuần 1 stage ⇒ chỉ lấy dạng của CÁC TỪ TRONG PHIÊN, và luôn chặn trong bộ bài
        // của stage đó (hàng đợi null = ôn lại cả bộ).
        let dangChoPhep: DangBai[] | undefined
        if (topicId) {
          // mastered không có bộ bài riêng ⇒ mượn của intensive (M7/Q1)
          dangChoPhep = [...boBaiCua(stageBaiTap(stage))]
        } else if (cheDoRetry) {
          const boStage = new Set<DangBai>(boBaiCua(stage))
          const tap = new Set<DangBai>()
          let caBo = false
          for (const t of phien) {
            const ds = retryTheoTu.get(t.vocab_id)
            if (ds === null || ds === undefined) caBo = true
            else for (const d of ds) if (boStage.has(d)) tap.add(d)
          }
          dangChoPhep = caBo ? [...boStage] : [...tap]
          if (dangChoPhep.length === 0) continue // hàng đợi chỉ còn dạng không thuộc stage này
        }
        const idsPhien = new Set(phien.map((t) => t.vocab_id))
        const baiTapPhien = baiTapTatCa.filter((b) => {
          const idB = (b.payload as { blank_b_vocab_id?: string | null })['blank_b_vocab_id']
          return idsPhien.has(b.vocab_id) || (idB ? idsPhien.has(idB) : false)
        })
        const { man } = xepBai({
          tu: phien,
          baiTap: baiTapPhien,
          ...(dangChoPhep ? { dangChoPhep } : {}),
          // Ôn chủ đề: dựng lại cả dạng đã đạt trong chu kỳ, nếu không thì từ mastered ra 0 màn
          ...(topicId ? { boQuaDaDat: true } : {}),
        })
        if (!coBaiTinhDiem(man)) continue

        dangCoRecord.current = dungMapRecord(baiTapPhien)
        idRecord.current = Object.fromEntries(baiTapPhien.map((b) => [`${b.vocab_id}|${b.type}`, b.id]))
        setVocab((cu) => ({ ...cu, ...Object.fromEntries(dong.map((t) => [t.vocab_id, t.vocab])) }))
        await taiVocabTuB(baiTapPhien, idsPhien)
        setSoGoiY(0)
        if (topicId) for (const t of phien) daPhucVuTopic.current.add(t.vocab_id)
        dispatch({ loai: 'nap', man, trang_thai: Object.fromEntries(phien.map((t) => [t.vocab_id, t])) })
        return
      }
      return dispatch({ loai: 'khong_co_tu' })
    } catch (e) {
      setLoiTai((e as Error).message || 'Không tải được bài ôn. Kiểm tra mạng rồi thử lại nhé.')
    }
  }, [cheDoRetry, topicId, taiBaiTap, taiVocabTuB])

  useEffect(() => {
    void napSession()
  }, [napSession])

  // Hết session → còn từ due chưa ôn thì nạp tiếp, không thì Tổng kết
  useEffect(() => {
    if (tt.buoc === 'het_session') void napSession()
    if (tt.buoc === 'thoat') navigate(tt.da_xong_tu.length > 0 ? '/on-tap/tong-ket' : '/', { replace: true })
  }, [tt, napSession, navigate])
  useEffect(() => {
    if (tt.buoc !== 'khong_co_tu' || !daOnGiDo.current) return
    // Làm HẾT lượt ôn chủ đề → hội thoại kết thúc (§4.5). Bấm X giữa chừng đi đường `thoat` ở trên,
    // tức là về thẳng Tổng kết và KHÔNG hiện hội thoại (M7/Q6).
    navigate(topicId ? `/on-tap/hoi-thoai?topic=${topicId}` : '/on-tap/tong-ket', { replace: true })
  }, [tt.buoc, navigate, topicId])
  useEffect(() => {
    if (tt.buoc === 'dang_on' && tt.da_xong_tu.length > 0) daOnGiDo.current = true
  }, [tt])

  // ── Ghi kết quả ────────────────────────────────────────────────────────────
  /** Gọi RPC 1 transaction; trả về true nếu ghi được. Lỗi → banner + "Thử lại" gọi lại đúng lời gọi này. */
  async function goiRpc(args: { p_state: TrangThaiTu | null; p_log: object; p_retry: object | null; p_xoa_retry: boolean }, sau: () => void): Promise<boolean> {
    dispatch({ loai: 'bat_dau_luu' })
    thuLaiRef.current = () => goiRpc(args, sau)
    const { error } = await supabase.rpc('luu_tra_loi', args)
    if (error) {
      dispatch({ loai: 'luu_loi', thong_diep: error.message })
      return false
    }
    sau()
    return true
  }

  const traLoi = useCallback(
    (vocab_id: string, dang_bai: DangBai, dung: boolean, dung_goi_y: boolean, la_bai_cuoi: boolean, khong_sang = false): Promise<boolean> => {
      const s = ttRef.current
      if (s.buoc !== 'dang_on') return Promise.resolve(false)
      const trang_thai = s.trang_thai[vocab_id]
      if (!trang_thai) return Promise.resolve(false)
      // Ôn chủ đề, từ CHƯA due: chỉ ghi review_log (điểm 0), KHÔNG đụng word_state/retry (M7/Q2).
      // Cố ý không dùng `xuLyTraLoi(dang_due:false)` — nhánh "bài cuối" của nó vẫn có thể dời
      // next_review_date / đẩy vào daily_retry_queue khi cycle_points cũ đã đủ ngưỡng.
      if (topicId && !dueTrongTopic.current.has(vocab_id)) {
        const p_log = {
          vocab_id,
          exercise_type: dang_bai,
          is_correct: dung,
          used_hint: dung_goi_y,
          points: 0,
          stage_before: trang_thai.stage,
          stage_after: trang_thai.stage,
        }
        setSoGoiY(0)
        return goiRpc({ p_state: null, p_log, p_retry: null, p_xoa_retry: false }, () =>
          dispatch({ loai: 'luu_ok', trang_thai_moi: trang_thai, ...(la_bai_cuoi ? { xong_tu: vocab_id } : {}), khong_sang }),
        )
      }

      const kq = xuLyTraLoi({ trang_thai, dang_bai, dung, dung_goi_y, dang_due: true, la_bai_cuoi_cua_tu: la_bai_cuoi, hom_nay: homNayVN(new Date()) })
      setSoGoiY(0)
      // Lọc dạng mà từ này KHÔNG có record, tránh hàng retry dựng 0 màn (M4b/Q4)
      const p_retry = locRetryTheoRecord(kq.vao_retry_queue as HangRetry | null, dangCoRecord.current[vocab_id] ?? [])
      return goiRpc(
        { p_state: kq.trang_thai_moi, p_log: kq.dong_review_log, p_retry, p_xoa_retry: cheDoRetry && la_bai_cuoi },
        () => dispatch({ loai: 'luu_ok', trang_thai_moi: kq.trang_thai_moi, ...(la_bai_cuoi ? { xong_tu: vocab_id } : {}), khong_sang }),
      )
    },
    [cheDoRetry, topicId],
  )

  function flashcard(vocab_id: string, nut: 'good' | 'hard' | 'again') {
    const s = ttRef.current
    if (s.buoc !== 'dang_on') return
    const { day_cuoi_session, vao_retry } = xuLyFlashcard(nut)
    if (day_cuoi_session) return dispatch({ loai: 'hard_day_cuoi' })
    const st = s.trang_thai[vocab_id]!
    const p_log = { vocab_id, exercise_type: 'flashcard', is_correct: !vao_retry, used_hint: false, points: 0, stage_before: st.stage, stage_after: st.stage }
    void goiRpc(
      { p_state: null, p_log, p_retry: vao_retry ? { reason: 'flashcard_again', exercise_types: null } : null, p_xoa_retry: false },
      () => dispatch({ loai: 'luu_ok' }),
    )
  }

  /** Matching ghi N từ tuần tự; lỗi ở từ i → "Thử lại" tiếp tục từ đúng từ i. */
  async function matchingXong(m: Extract<Man, { loai: 'matching' }>, kq: Record<string, boolean>, batDau = 0) {
    const ids = m.vocab_ids
    for (let i = batDau; i < ids.length; i++) {
      const id = ids[i]!
      const ok = await traLoi(id, 'matching', kq[id] ?? false, false, m.la_bai_cuoi[id] ?? false, i < ids.length - 1)
      if (!ok) {
        thuLaiRef.current = () => matchingXong(m, kq, i)
        return
      }
    }
  }

  /** Bài 2 từ: chấm 2 chỗ trống độc lập, chỉ ghi cho từ CÓ trong session (§4.4). */
  async function dialogXong(m: Extract<Man, { loai: 'select_dialog' | 'fill_dialog' }>, kq: { a: boolean; b: boolean }, batDau = 0) {
    const ids = Object.keys(m.la_bai_cuoi)
    for (let i = batDau; i < ids.length; i++) {
      const id = ids[i]!
      const dung = id === m.vocab_a ? kq.a : kq.b
      const ok = await traLoi(id, m.loai, dung, soGoiY > 0, m.la_bai_cuoi[id] ?? false, i < ids.length - 1)
      if (!ok) {
        thuLaiRef.current = () => dialogXong(m, kq, i)
        return
      }
    }
    if (ids.length === 0) dispatch({ loai: 'sang_man' })
  }

  /** Vào màn `cham_ai`: 1 request cho CẢ nhóm (§7.1) → ghi DB từng từ → hiện lần lượt phản hồi. */
  const chayChamAI = useCallback(
    async (m: Extract<Man, { loai: 'cham_ai' }>) => {
      setChamTt({ b: 'dang_cham', chiSo: 0 })
      const dau = vocabRef.current[m.vocab_ids[0] ?? '']
      if (!dau) return
      const items = m.vocab_ids.map((id) => ({
        vocab_id: id,
        word: vocabRef.current[id]?.word ?? '',
        meaning_vi: vocabRef.current[id]?.meaning_vi ?? '',
        user_answer: dapAnTuLuan.current[id] ?? '',
      }))
      const kq = await chamBaiTuLuan({ dang: m.dang, target_lang: dau.lang, items })
      if ('loi' in kq) {
        setChamTt({ b: 'loi', loi: kq.loi, chiSo: 0 })
        return
      }
      for (const r of kq.ok) ketQuaAI.current[r.vocab_id] = r
      // Từ nằm trong `thieu` → KHÔNG ghi điểm (§7.4), thẻ phản hồi sẽ mời "Chấm lại"
      for (let i = 0; i < m.vocab_ids.length; i++) {
        const id = m.vocab_ids[i]!
        const r = ketQuaAI.current[id]
        if (!r) continue
        const ok = await traLoi(id, m.dang, dungTuVerdict(r.verdict), false, m.la_bai_cuoi[id] ?? false, true)
        if (!ok) return
      }
      setChamTt({ b: 'xong', chiSo: 0 })
    },
    [traLoi],
  )

  /** §8 — mở panel giải thích; bấm TRƯỚC khi trả lời tính như dùng gợi ý (DESIGN §3, DEC-19). */
  const moGiaiThich = useCallback(
    async (exercise_id: string, dang: string, ngu_canh: object, tinhNhuGoiY: boolean) => {
      if (tinhNhuGoiY) setSoGoiY((k) => k + 1)
      setGiaiThich({ mo: true, dangTai: true, noiDung: null, loi: null })
      const kq = await giaiThichBai(exercise_id, { dang, ngu_canh })
      setGiaiThich(
        'loi' in kq
          ? { mo: true, dangTai: false, noiDung: null, loi: kq.loi }
          : { mo: true, dangTai: false, noiDung: kq, loi: null },
      )
    },
    [],
  )

  // Vào màn `cham_ai` thì tự gọi AI đúng 1 lần cho màn đó (ref chặn StrictMode gọi đôi — MB-20/1)
  const daChamMan = useRef<number | null>(null)
  useEffect(() => {
    if (tt.buoc !== 'dang_on') return
    const m = tt.man[tt.chi_so]
    if (!m || m.loai !== 'cham_ai') return
    if (daChamMan.current === tt.chi_so) return
    daChamMan.current = tt.chi_so
    void chayChamAI(m)
  }, [tt, chayChamAI])

  const thoat = () => dispatch({ loai: 'thoat' })

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loiTai) {
    return (
      <KhungThongBao tieuDe="Không tải được bài ôn" mota={loiTai}>
        <button type="button" onClick={() => { setLoiTai(null); void napSession() }} className={NUT_CHINH}>Thử lại</button>
        <Link to="/" className={NUT_PHU}>Về Dashboard</Link>
      </KhungThongBao>
    )
  }
  if (tt.buoc === 'dang_tai' || tt.buoc === 'het_session' || tt.buoc === 'thoat') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div className="w-full max-w-[600px] animate-pulse rounded-20 border border-border-card bg-surface-sunken" style={{ height: 180 }} />
      </main>
    )
  }
  if (tt.buoc === 'khong_co_tu') {
    return (
      <KhungThongBao
        tieuDe={cheDoRetry ? 'Không còn từ nào cần ôn lại.' : 'Hôm nay không có từ nào cần ôn.'}
        mota={cheDoRetry ? 'Mọi từ trong hàng đợi ôn lại đã xong.' : 'Từ mới sẽ được thêm mỗi sáng. Hẹn gặp lại bạn ngày mai.'}
      >
        <Link to="/" className={NUT_CHINH}>Về Dashboard</Link>
      </KhungThongBao>
    )
  }

  const panelGiaiThich = (
    <GiaiThichPanel
      mo={giaiThich.mo}
      dangTai={giaiThich.dangTai}
      noiDung={giaiThich.noiDung}
      loi={giaiThich.loi}
      lang={vocab[Object.keys(vocab)[0] ?? '']?.lang ?? 'zh'}
      onDong={() => setGiaiThich((g) => ({ ...g, mo: false }))}
      onThuLai={() => setGiaiThich((g) => ({ ...g, dangTai: true, loi: null }))}
    />
  )

  const man = tt.man[tt.chi_so]!
  const khoi = [...new Set(tt.man.map((m) => m.loai))]
  const dots = { tong: khoi.length, hienTai: khoi.indexOf(man.loai) }
  const ghostChung = { phienAm: hienPhienAm, toggle: () => setHienPhienAm((v) => !v) }

  /**
   * Nút "Giải thích (AI)" chỉ có ở bài CÓ record `exercises` — 6 dạng không record không có chỗ
   * cache `ai_explanation` nên sẽ tốn call mỗi lần bấm, trái DEC-23 (DESIGN §3).
   */
  function nutGiaiThich(vocab_id: string, dang: DangBai, daTraLoi: boolean, nguCanh: object) {
    const id = idRecord.current[`${vocab_id}|${dang}`]
    if (!id) return undefined
    return () => void moGiaiThich(id, dang, nguCanh, !daTraLoi)
  }
  const bannerLoi = (
    <>
      {tt.loi_luu && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-14 border border-danger bg-danger-bg px-4 py-3 text-13 text-danger-text">
          <span>Chưa lưu được: {tt.loi_luu}</span>
          <button type="button" onClick={() => { dispatch({ loai: 'thu_lai' }); void thuLaiRef.current?.() }} className="shrink-0 rounded-10 bg-accent px-3 py-1.5 text-13 font-semibold text-white">Thử lại</button>
        </div>
      )}
      {panelGiaiThich}
    </>
  )

  const v = 'vocab_id' in man ? vocab[man.vocab_id] : undefined
  const st = 'vocab_id' in man ? tt.trang_thai[man.vocab_id] : undefined

  if (man.loai === 'cham_ai') {
    const ds = man.vocab_ids.map((id) => ({
      vocab: vocab[id]!,
      cau: dapAnTuLuan.current[id] ?? '',
      kq: ketQuaAI.current[id],
    }))
    const stChinh = tt.trang_thai[man.vocab_ids[0] ?? '']
    return (
      <ExerciseShell
        header={stChinh ? <Ring total_points={stChinh.total_points} stage={stChinh.stage} size={60} /> : null}
        thoat={thoat}
        rong={640}
        dots={dots}
      >
        {bannerLoi}
        <ChamAI
          trangThai={chamTt.b}
          {...(chamTt.loi ? { loi: chamTt.loi } : {})}
          ds={ds}
          chiSo={chamTt.chiSo}
          onTiep={() => {
            if (chamTt.chiSo + 1 >= ds.length) dispatch({ loai: 'sang_man' })
            else setChamTt((c) => ({ ...c, chiSo: c.chiSo + 1 }))
          }}
          onChamLai={() => { daChamMan.current = null; void chayChamAI(man) }}
        />
      </ExerciseShell>
    )
  }

  if (man.loai === 'select_dialog' || man.loai === 'fill_dialog') {
    const tuChinh = vocab[man.vocab_a] ?? (man.vocab_b ? vocab[man.vocab_b] : undefined)
    const stChinh = tt.trang_thai[man.vocab_a] ?? (man.vocab_b ? tt.trang_thai[man.vocab_b] : undefined)
    if (!tuChinh) return null
    const ghost: Ghost = {
      ...ghostChung,
      goiY: () => setSoGoiY((k) => k + 1),
      giaiThich: nutGiaiThich(man.vocab_a, man.loai, false, {
        cau_hoi: `${man.payload.dialog_a} / ${man.payload.dialog_b}`,
        dap_an: man.payload.blank_a_answer,
        word: tuChinh.word,
        meaning_vi: tuChinh.meaning_vi,
      }),
    }
    return (
      <ExerciseShell
        header={stChinh ? <Ring total_points={stChinh.total_points} stage={stChinh.stage} size={60} /> : null}
        ghost={ghost}
        thoat={thoat}
        rong={680}
        dots={dots}
      >
        {bannerLoi}
        <HoiThoai
          key={tt.chi_so}
          cheDo={man.loai}
          payload={man.payload}
          tuB={man.vocab_b ? (vocab[man.vocab_b] ?? null) : null}
          lang={tuChinh.lang}
          hienPhienAm={hienPhienAm}
          soGoiY={soGoiY}
          onTraLoi={(kq) => void dialogXong(man, kq)}
        />
      </ExerciseShell>
    )
  }

  if (man.loai === 'matching') {
    return (
      <ExerciseShell thoat={thoat} rong={620} dots={dots} vienHeader={false}>
        {bannerLoi}
        <Matching key={tt.chi_so} dsTu={man.vocab_ids.map((id) => vocab[id]!)} onXong={(kq) => void matchingXong(man, kq)} />
      </ExerciseShell>
    )
  }
  if (!v || !st) return null

  const ring = <Ring total_points={st.total_points} stage={st.stage} size={60} />
  const tieuDe = (t: string) => <h1 className="font-display text-22 font-bold text-content-primary">{t}</h1>

  switch (man.loai) {
    case 'flashcard':
      return (
        <ExerciseShell header={tieuDe('Flashcard')} thoat={thoat} rong={520} dots={dots} vienHeader={false}>
          {bannerLoi}
          <Flashcard key={`${tt.chi_so}-${v.id}`} vocab={v} hienPhienAm={hienPhienAm} onChon={(nut) => flashcard(v.id, nut)} />
        </ExerciseShell>
      )
    case 'grammar':
      return (
        <ExerciseShell ghost={ghostChung} thoat={thoat} rong={640} dots={dots} vienHeader={false}>
          <Grammar key={tt.chi_so} vocab={v} payload={man.payload} hienPhienAm={hienPhienAm} onTiep={() => dispatch({ loai: 'sang_man' })} />
        </ExerciseShell>
      )
    case 'selection':
    case 'audio_recognition':
    case 'select_on_describe':
    case 'select_sentence': {
      const tn = duLieuTracNghiem(man, v)
      const ghost: Ghost = {
        ...ghostChung,
        goiY: () => setSoGoiY((k) => k + 1),
        boQua: () => void traLoi(v.id, man.loai, false, false, man.la_bai_cuoi_cua_tu),
        giaiThich: nutGiaiThich(v.id, man.loai, false, { cau_hoi: tn.moTa ?? v.word, dap_an: tn.dapAn, word: v.word, meaning_vi: v.meaning_vi }),
      }
      return (
        <ExerciseShell header={ring} ghost={ghost} thoat={thoat} rong={600} dots={dots}>
          {bannerLoi}
          <TracNghiem
            key={tt.chi_so}
            vocab={v}
            cheDo={man.loai as CheDoTracNghiem}
            luaChonGoc={tn.luaChonGoc}
            dapAn={tn.dapAn}
            {...(tn.pinyinCua ? { pinyinCua: tn.pinyinCua } : {})}
            {...(tn.moTa ? { moTa: tn.moTa } : {})}
            hienPhienAm={hienPhienAm}
            soGoiY={soGoiY}
            onTraLoi={(dung, goiY) => void traLoi(v.id, man.loai, dung, goiY, man.la_bai_cuoi_cua_tu)}
          />
        </ExerciseShell>
      )
    }
    case 'translate':
    case 'listen_fill':
    case 'trans_collocation': {
      const ghost: Ghost = { ...ghostChung, goiY: () => setSoGoiY((k) => k + 1), boQua: () => void traLoi(v.id, man.loai, false, false, man.la_bai_cuoi_cua_tu) }
      return (
        <ExerciseShell header={ring} ghost={ghost} thoat={thoat} rong={560} dots={dots}>
          {bannerLoi}
          <DienTu key={tt.chi_so} vocab={v} cheDo={man.loai} hienPhienAm={hienPhienAm} soGoiY={soGoiY}
            onTraLoi={(dung, goiY) => void traLoi(v.id, man.loai, dung, goiY, man.la_bai_cuoi_cua_tu)} />
        </ExerciseShell>
      )
    }
    case 'make_sentence':
    case 'trans_sentence':
    case 'complete_situation': {
      // §6.4: 3 dạng này ẨN HẲN nút Gợi ý; "Bỏ qua" = fail ngay, KHÔNG gọi AI
      const ghost: Ghost = {
        ...ghostChung,
        boQua: () => {
          dapAnTuLuan.current[v.id] = ''
          dispatch({ loai: 'sang_man' })
        },
      }
      return (
        <ExerciseShell header={ring} ghost={ghost} thoat={thoat} rong={640} dots={dots}>
          {bannerLoi}
          <TuLuan
            key={tt.chi_so}
            vocab={v}
            cheDo={man.loai}
            {...(man.payload ? { payload: man.payload } : {})}
            hienPhienAm={hienPhienAm}
            onNop={(cau) => {
              dapAnTuLuan.current[v.id] = cau
              dispatch({ loai: 'sang_man' })
            }}
          />
        </ExerciseShell>
      )
    }
    case 'arrange_words': {
      const ghost: Ghost = {
        ...ghostChung,
        goiY: () => setSoGoiY((k) => k + 1),
        boQua: () => void traLoi(v.id, 'arrange_words', false, false, man.la_bai_cuoi_cua_tu),
        giaiThich: nutGiaiThich(v.id, 'arrange_words', false, {
          cau_hoi: man.payload.tokens.map((t) => t.text).join(' '),
          dap_an: man.payload.tokens.map((t) => t.text).join(''),
          word: v.word,
          meaning_vi: v.meaning_vi,
        }),
      }
      return (
        <ExerciseShell header={ring} ghost={ghost} thoat={thoat} rong={640} dots={dots}>
          {bannerLoi}
          <SapXep key={tt.chi_so} vocab={v} payload={man.payload} hienPhienAm={hienPhienAm} soGoiY={soGoiY}
            onTraLoi={(dung, goiY) => void traLoi(v.id, 'arrange_words', dung, goiY, man.la_bai_cuoi_cua_tu)} />
        </ExerciseShell>
      )
    }
    case 'fast_decision': {
      const ghost: Ghost = { ...ghostChung, boQua: () => void traLoi(v.id, 'fast_decision', false, false, man.la_bai_cuoi_cua_tu) }
      return (
        <ExerciseShell header={ring} ghost={ghost} thoat={thoat} rong={560} dots={dots}>
          {bannerLoi}
          <FastDecision key={tt.chi_so} vocab={v} payload={man.payload} hienPhienAm={hienPhienAm}
            onTraLoi={(dung) => void traLoi(v.id, 'fast_decision', dung, false, man.la_bai_cuoi_cua_tu)} />
        </ExerciseShell>
      )
    }
  }
}

/** Chuẩn hoá dữ liệu 4 chế độ trắc nghiệm về cùng một shape cho `TracNghiem`. */
function duLieuTracNghiem(
  man: Extract<Man, { loai: 'selection' | 'audio_recognition' | 'select_on_describe' | 'select_sentence' }>,
  v: VocabDb,
): { luaChonGoc: string[]; dapAn: string; pinyinCua?: Record<string, string | null | undefined>; moTa?: string } {
  if (man.loai === 'select_on_describe') {
    return {
      luaChonGoc: [v.word, ...man.payload.distractors.map((d) => d.word)],
      dapAn: v.word,
      pinyinCua: Object.fromEntries([
        [v.word, v.pinyin],
        ...man.payload.distractors.map((d) => [d.word, d.pinyin] as const),
      ]),
      moTa: man.payload.description,
    }
  }
  if (man.loai === 'select_sentence') {
    const { correct_sentence, wrong_sentences } = man.payload
    return {
      luaChonGoc: [correct_sentence.text, ...wrong_sentences.map((c) => c.text)],
      dapAn: correct_sentence.text,
      pinyinCua: Object.fromEntries([
        [correct_sentence.text, correct_sentence.pinyin],
        ...wrong_sentences.map((c) => [c.text, c.pinyin] as const),
      ]),
    }
  }
  return { luaChonGoc: [v.meaning_vi, ...man.payload.distractors], dapAn: v.meaning_vi }
}

// ── Màn thông báo dùng chung (không có mockup — DESIGN §1.2 đã duyệt) ─────────
const NUT_CHINH = 'rounded-14 bg-accent px-6 py-4 text-center text-16 font-semibold text-white'
const NUT_PHU = 'rounded-14 bg-border-card px-6 py-4 text-center text-15 font-semibold text-content-nav'

function KhungThongBao({ tieuDe, mota, children }: { tieuDe: string; mota: string; children: ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page px-5 py-10">
      <div className="flex w-full max-w-[480px] flex-col gap-4 rounded-20 border border-border-card bg-surface-card px-7 py-9 text-center">
        <h1 className="font-display text-24 font-bold text-content-primary">{tieuDe}</h1>
        <p className="text-15 text-content-muted">{mota}</p>
        <div className="mt-2 flex flex-col gap-3">{children}</div>
      </div>
    </main>
  )
}

