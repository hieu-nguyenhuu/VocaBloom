import { boBaiCua, type DangBai, type Stage, type StageOn, type TrangThaiTu } from './srs.ts'

/**
 * Logic thuần của Player (M4a) — CHỈ import srs.ts. Không React, không Supabase, không đọc
 * đồng hồ hay Math.random bên trong (ngày và rng đều tiêm từ ngoài) để test được.
 * Component chỉ query / gọi rpc / phát âm rồi dispatch vào reducer ở cuối file.
 */

// ── Ngày giờ ────────────────────────────────────────────────────────────────

const TZ = 'Asia/Ho_Chi_Minh'

/** 'yyyy-mm-dd' theo giờ Việt Nam — cùng quy chiếu với cron (systemPatterns.md §9.3). */
export function homNayVN(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

/** "Thứ Năm, 17/9" — dùng ở header màn Tổng kết (mockup 12). */
export function dinhDangNgayVN(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const thu = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
  return `${THU[thu]}, ${d}/${m}`
}

// ── Kiểu dữ liệu đọc từ DB ──────────────────────────────────────────────────

/** Dòng bảng `vocab` (§2) — các cột Player cần. */
export type VocabDb = {
  id: string
  word: string
  pinyin: string | null
  meaning_vi: string
  collocation: string | null
  collocation_pinyin: string | null
  collocation_meaning_vi: string | null
  example_sentence: string | null
  example_meaning_vi: string | null
  lang: 'zh' | 'en'
  audio_url: string | null
}

// ── Xếp màn trong 1 session ─────────────────────────────────────────────────

export type BaiTapDb = { id: string; vocab_id: string; type: DangBai; payload: Record<string, unknown> }

export type PayloadGrammar = { content_target: string; pinyin?: string; content_vi: string }
export type PayloadTracNghiem = { distractors: string[] }
export type PayloadFastDecision = { wrong_meaning: string }

/** Từ + phiên âm trong payload (§6.5) — `pinyin` null với tiếng Anh. */
export type TuPinyin = { word: string; pinyin?: string | null }
export type Cau = { text: string; pinyin?: string | null }
export type PayloadMoTa = { description: string; distractors: TuPinyin[] }
export type PayloadChonCau = { correct_sentence: Cau; wrong_sentences: Cau[] }
/** ⚠️ token dùng khoá `text` (payload thật §6.3 #13), KHÁC `word` của distractors. */
export type PayloadSapXep = { tokens: Cau[] }
/** Stage 3 (§6.4): make_sentence không cần payload; 2 dạng còn lại có đề bài riêng. */
export type PayloadTuLuan = {
  vietnamese_sentence?: string
  situation_vi?: string
  given_sentence_zh?: string
  given_sentence_pinyin?: string
}
export type DangBaiAI = 'make_sentence' | 'trans_sentence' | 'complete_situation'
export type PayloadDialog = {
  dialog_a: string
  dialog_b: string
  dialog_a_pinyin?: string
  dialog_b_pinyin?: string
  blank_a_answer: string
  blank_b_vocab_id?: string | null
  distractors?: TuPinyin[]
}

export type Man =
  | { loai: 'flashcard'; vocab_id: string }
  | { loai: 'grammar'; vocab_id: string; payload: PayloadGrammar }
  | { loai: 'matching'; vocab_ids: string[]; la_bai_cuoi: Record<string, boolean> }
  | { loai: 'selection' | 'audio_recognition'; vocab_id: string; payload: PayloadTracNghiem; la_bai_cuoi_cua_tu: boolean }
  | { loai: 'fast_decision'; vocab_id: string; payload: PayloadFastDecision; la_bai_cuoi_cua_tu: boolean }
  // M4b — stage 1 & 2
  | { loai: 'translate' | 'listen_fill' | 'trans_collocation'; vocab_id: string; la_bai_cuoi_cua_tu: boolean }
  | { loai: 'select_on_describe'; vocab_id: string; payload: PayloadMoTa; la_bai_cuoi_cua_tu: boolean }
  | { loai: 'select_sentence'; vocab_id: string; payload: PayloadChonCau; la_bai_cuoi_cua_tu: boolean }
  | { loai: 'arrange_words'; vocab_id: string; payload: PayloadSapXep; la_bai_cuoi_cua_tu: boolean }
  /** Bài 2 TỪ (§4.4): 1 record dùng chung cho A và B; `la_bai_cuoi` chỉ chứa từ CÓ trong session. */
  | { loai: 'select_dialog' | 'fill_dialog'; vocab_a: string; vocab_b: string | null; payload: PayloadDialog; la_bai_cuoi: Record<string, boolean> }
  // M5 — stage 3 tự luận: màn NHẬP không chấm, chấm gom ở màn `cham_ai` (DEC-14: 3 request/session)
  | { loai: DangBaiAI; vocab_id: string; payload?: PayloadTuLuan }
  | { loai: 'cham_ai'; dang: DangBaiAI; vocab_ids: string[]; la_bai_cuoi: Record<string, boolean> }

/**
 * Dạng CẦN record trong `exercises` — thiếu record thì bỏ màn và báo `thieu`.
 * 6 dạng còn lại (flashcard, matching, translate, listen_fill, trans_collocation) Player đọc thẳng
 * từ `vocab` (DEC-22) nên luôn dựng được màn.
 */
export const CAN_RECORD: ReadonlySet<DangBai> = new Set([
  'grammar', 'selection', 'audio_recognition', 'fast_decision',
  'select_dialog', 'select_on_describe', 'fill_dialog', 'select_sentence', 'arrange_words',
])

/** Thứ tự màn đã chốt (Brainstorm M4a): theo DẠNG BÀI, xen kẽ từ — tốt cho trí nhớ hơn làm hết 1 từ. */
const THU_TU_MAN: readonly DangBai[] = [
  'flashcard', 'grammar', 'matching', 'selection', 'audio_recognition', 'fast_decision',
  'translate', 'select_dialog', 'listen_fill', 'select_on_describe',
  'fill_dialog', 'select_sentence', 'arrange_words', 'trans_collocation',
  'make_sentence', 'trans_sentence', 'complete_situation',
]

/**
 * Xếp mảng màn cho 1 session THUẦN 1 STAGE. Bỏ dạng đã nằm trong `cycle_completed_exercises`
 * (trừ khi `boQuaDaDat` — chế độ ôn theo chủ đề, M7)
 * (§4.2 — không làm lại bài đã đạt, kể cả sau reload). `dangChoPhep` dùng cho lượt retry.
 * `la_bai_cuoi_cua_tu` = không còn màn TÍNH ĐIỂM nào sau đó cho cùng từ (Matching cũng tính điểm).
 */
export function xepBai(dv: {
  tu: TrangThaiTu[]
  baiTap: BaiTapDb[]
  dangChoPhep?: DangBai[]
  /** Ôn theo chủ đề (M7) là LUYỆN TẬP, không phải chu kỳ SRS ⇒ dựng lại cả dạng đã đạt trong chu kỳ. */
  boQuaDaDat?: boolean
}): {
  man: Man[]
  thieu: { vocab_id: string; type: DangBai }[]
} {
  const { tu, baiTap, dangChoPhep, boQuaDaDat } = dv
  const stage = tu[0]?.stage ?? 'new'
  const tinhDiem = new Set(boBaiCua(stage))
  const choPhep = (d: DangBai) =>
    dangChoPhep ? dangChoPhep.includes(d) : d === 'flashcard' || d === 'grammar' || tinhDiem.has(d)
  const thieu: { vocab_id: string; type: DangBai }[] = []
  const man: Man[] = []
  const idsSession = new Set(tu.map((t) => t.vocab_id))
  const daDatCua = (id: string) =>
    boQuaDaDat ? [] : (tu.find((t) => t.vocab_id === id)?.cycle_completed_exercises ?? [])

  for (const dang of THU_TU_MAN) {
    if (!choPhep(dang)) continue
    if (dang === 'matching') {
      const ids = tu.filter((t) => !daDatCua(t.vocab_id).includes('matching')).map((t) => t.vocab_id)
      if (ids.length > 0) man.push({ loai: 'matching', vocab_ids: ids, la_bai_cuoi: {} })
      continue
    }
    if (dang === 'select_dialog' || dang === 'fill_dialog') {
      // Xếp theo RECORD: 1 record = 1 màn, dùng cho cả A (vocab_id) và B (payload.blank_b_vocab_id).
      // Nhờ vậy câu chỉ xuất hiện 1 lần dù A, B hay cả 2 cùng trong session (§4.4).
      const daPhucVu = new Set<string>()
      for (const b of baiTap) {
        if (b.type !== dang) continue
        const p = b.payload as PayloadDialog
        const vocab_b = (p.blank_b_vocab_id as string | undefined) ?? null
        const lienQuan = [b.vocab_id, vocab_b].filter((id): id is string => id !== null && idsSession.has(id))
        if (lienQuan.length === 0) continue
        // Bỏ màn nếu MỌI từ liên quan đều đã đạt dạng này trong chu kỳ
        const conPhaiLam = lienQuan.filter((id) => !daDatCua(id).includes(dang))
        if (conPhaiLam.length === 0) {
          for (const id of lienQuan) daPhucVu.add(id)
          continue
        }
        man.push({ loai: dang, vocab_a: b.vocab_id, vocab_b, payload: p, la_bai_cuoi: {} })
        for (const id of lienQuan) daPhucVu.add(id)
      }
      for (const t of tu) {
        if (daDatCua(t.vocab_id).includes(dang) || daPhucVu.has(t.vocab_id)) continue
        thieu.push({ vocab_id: t.vocab_id, type: dang })
      }
      continue
    }

    if (dang === 'make_sentence' || dang === 'trans_sentence' || dang === 'complete_situation') {
      const idsNhom: string[] = []
      for (const t of tu) {
        if (daDatCua(t.vocab_id).includes(dang)) continue
        // make_sentence không cần record (§6.4); 2 dạng còn lại thiếu record thì bỏ + báo
        const b = baiTap.find((x) => x.vocab_id === t.vocab_id && x.type === dang)
        if (!b && dang !== 'make_sentence') {
          thieu.push({ vocab_id: t.vocab_id, type: dang })
          continue
        }
        man.push({
          loai: dang,
          vocab_id: t.vocab_id,
          ...(b ? { payload: b.payload as PayloadTuLuan } : {}),
        })
        idsNhom.push(t.vocab_id)
      }
      // Chấm gom: 1 màn cho cả nhóm ⇒ đúng 1 request/dạng (DEC-14). Nhóm rỗng thì không chèn.
      if (idsNhom.length > 0) man.push({ loai: 'cham_ai', dang, vocab_ids: idsNhom, la_bai_cuoi: {} })
      continue
    }

    for (const t of tu) {
      if (tinhDiem.has(dang) && daDatCua(t.vocab_id).includes(dang)) continue
      if (dang === 'flashcard') {
        man.push({ loai: 'flashcard', vocab_id: t.vocab_id })
        continue
      }
      if (dang === 'translate' || dang === 'listen_fill' || dang === 'trans_collocation') {
        man.push({ loai: dang, vocab_id: t.vocab_id, la_bai_cuoi_cua_tu: false })
        continue
      }
      const b = baiTap.find((x) => x.vocab_id === t.vocab_id && x.type === dang)
      if (!b) {
        if (CAN_RECORD.has(dang)) thieu.push({ vocab_id: t.vocab_id, type: dang })
        continue
      }
      if (dang === 'grammar') {
        man.push({ loai: 'grammar', vocab_id: t.vocab_id, payload: b.payload as PayloadGrammar })
      } else if (dang === 'fast_decision') {
        man.push({ loai: 'fast_decision', vocab_id: t.vocab_id, payload: b.payload as PayloadFastDecision, la_bai_cuoi_cua_tu: false })
      } else if (dang === 'selection' || dang === 'audio_recognition') {
        man.push({ loai: dang, vocab_id: t.vocab_id, payload: b.payload as PayloadTracNghiem, la_bai_cuoi_cua_tu: false })
      } else if (dang === 'select_on_describe') {
        man.push({ loai: dang, vocab_id: t.vocab_id, payload: b.payload as PayloadMoTa, la_bai_cuoi_cua_tu: false })
      } else if (dang === 'select_sentence') {
        man.push({ loai: dang, vocab_id: t.vocab_id, payload: b.payload as PayloadChonCau, la_bai_cuoi_cua_tu: false })
      } else if (dang === 'arrange_words') {
        man.push({ loai: dang, vocab_id: t.vocab_id, payload: b.payload as PayloadSapXep, la_bai_cuoi_cua_tu: false })
      }
    }
  }

  // Duyệt ngược: màn tính điểm đầu tiên gặp của mỗi từ chính là màn cuối của từ đó.
  const daThay = new Set<string>()
  for (let i = man.length - 1; i >= 0; i--) {
    const m = man[i]!
    if (m.loai === 'matching') {
      for (const id of m.vocab_ids) {
        m.la_bai_cuoi[id] = !daThay.has(id)
        daThay.add(id)
      }
    } else if (m.loai === 'cham_ai') {
      for (const id of m.vocab_ids) {
        m.la_bai_cuoi[id] = !daThay.has(id)
        daThay.add(id)
      }
    } else if (m.loai === 'select_dialog' || m.loai === 'fill_dialog') {
      for (const id of [m.vocab_a, m.vocab_b]) {
        if (id === null || !idsSession.has(id)) continue // từ ngoài session: ôn thêm miễn phí, không tính điểm
        m.la_bai_cuoi[id] = !daThay.has(id)
        daThay.add(id)
      }
    } else if ('la_bai_cuoi_cua_tu' in m) {
      m.la_bai_cuoi_cua_tu = !daThay.has(m.vocab_id)
      daThay.add(m.vocab_id)
    }
  }
  return { man, thieu }
}

// ── Random có tiêm rng (để test) ────────────────────────────────────────────

/** Fisher–Yates, không đổi mảng gốc. */
export function xaoTron<T>(ds: readonly T[], rng: () => number): T[] {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Fast Decision (§6.1 #6): app random 50/50 giữa nghĩa đúng và `wrong_meaning` lúc runtime. */
export function chonNghiaFastDecision(dung: string, sai: string, rng: () => number): { hien: string; la_dung: boolean } {
  const la_dung = rng() < 0.5
  return { hien: la_dung ? dung : sai, la_dung }
}

/**
 * Luật chấm Matching (chốt M4a): mỗi từ đúng nếu lần chạm ĐẦU TIÊN tới nó là ghép đúng.
 * `luot` là lịch sử các lần ghép theo thứ tự; `dapAn[vocab_id] = meaning_vi`.
 */
export function chamMatching(
  luot: { trai: string; phai: string }[],
  dapAn: Record<string, string>,
): Record<string, boolean> {
  const kq: Record<string, boolean> = {}
  for (const l of luot) if (!(l.trai in kq)) kq[l.trai] = dapAn[l.trai] === l.phai
  return kq
}

// ── Mastery ring (DEC-12 §12.2) ─────────────────────────────────────────────

/** Mốc màu ring 0..5: 0–5 → 0, 6–11 → 1, 12–17 → 2, 18–23 → 3, 24–29 → 4, ≥30 → 5. */
export function mocRing(total_points: number): number {
  return total_points >= 30 ? 5 : Math.min(4, Math.max(0, Math.floor(total_points / 6)))
}

// ── M7: ôn theo chủ đề ──────────────────────────────────────────────────────

/**
 * Stage dùng để CHỌN BÀI. `mastered` không có bộ bài riêng (`boBaiCua` trả rỗng) nên khi ôn theo
 * chủ đề thì mượn bộ của `intensive` — chốt M7/Q1, nếu không thì 3/5 từ của "Trái cây" không ôn được.
 */
export function stageBaiTap(stage: Stage): StageOn {
  return stage === 'mastered' ? 'intensive' : stage
}

/**
 * Gom từ của 1 CHỦ ĐỀ thành session ≤5 từ, thuần 1 "stage hiệu dụng".
 * Khác `gomSession` (§4.1) ở 2 điểm CỐ Ý: không lọc `next_review_date` và không loại `mastered` —
 * ôn chủ đề là luyện tập toàn bộ chủ đề, không phải chu kỳ SRS hằng ngày.
 */
export function gomSessionTopic(dsTu: TrangThaiTu[], soTuMoiSession = 5): TrangThaiTu[][] {
  const thuTu: Record<StageOn, number> = { new: 0, stage1: 1, stage2: 2, stage3: 3, intensive: 4 }
  const daSap = dsTu
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const lech = (thuTu[stageBaiTap(a.t.stage)] ?? 0) - (thuTu[stageBaiTap(b.t.stage)] ?? 0)
      return lech !== 0 ? lech : a.i - b.i // ổn định: giữ thứ tự đầu vào trong cùng stage
    })
    .map((x) => x.t)

  const phien: TrangThaiTu[][] = []
  let hienTai: TrangThaiTu[] = []
  for (const t of daSap) {
    const doiStage = hienTai.length > 0 && stageBaiTap(hienTai[0]!.stage) !== stageBaiTap(t.stage)
    if (doiStage || hienTai.length === soTuMoiSession) {
      phien.push(hienTai)
      hienTai = []
    }
    hienTai.push(t)
  }
  if (hienTai.length > 0) phien.push(hienTai)
  return phien
}

// ── Tổng kết phiên (§4.6) — tổng hợp từ review_log CẢ NGÀY, không giữ state client ──

export type DongLogDb = {
  vocab_id: string
  points: number
  stage_before: Stage
  stage_after: Stage
  is_correct: boolean
}

export type TongKet = {
  diem: number
  so_tu_da_on: number
  so_len_stage: number
  mastered: string[]
  so_chua_dat: number
  chi_tiet: { vocab_id: string; stage_before: Stage; stage_after: Stage; len_stage: boolean }[]
}

/**
 * `stage_before` = dòng ĐẦU trong ngày, `stage_after` = dòng CUỐI — tương đương min/max của spec
 * vì không bao giờ tụt stage (DEC-09). `log` phải theo thứ tự `reviewed_at`.
 */
export function tongHopTongKet(log: DongLogDb[]): TongKet {
  const theoTu = new Map<string, { dau: Stage; cuoi: Stage }>()
  let diem = 0
  for (const d of log) {
    diem += d.points
    const c = theoTu.get(d.vocab_id)
    theoTu.set(d.vocab_id, { dau: c?.dau ?? d.stage_before, cuoi: d.stage_after })
  }
  const chi_tiet = [...theoTu].map(([vocab_id, s]) => ({
    vocab_id,
    stage_before: s.dau,
    stage_after: s.cuoi,
    len_stage: s.dau !== s.cuoi,
  }))
  return {
    diem,
    so_tu_da_on: chi_tiet.length,
    so_len_stage: chi_tiet.filter((c) => c.len_stage).length,
    mastered: chi_tiet.filter((c) => c.stage_after === 'mastered').map((c) => c.vocab_id),
    so_chua_dat: chi_tiet.filter((c) => !c.len_stage).length,
    chi_tiet,
  }
}

/**
 * "Còn N từ đang chờ bạn hôm nay" = từ due KHÔNG nằm trong hàng đợi retry. Từ dở dang giữa session
 * (có log nhưng chưa xong bộ bài) vẫn là "đang chờ" — nên KHÔNG lọc theo review_log.
 */
export function demConCho(due: string[], dangRetry: string[]): number {
  const s = new Set(dangRetry)
  return due.filter((v) => !s.has(v)).length
}

// ── State machine PlayerPage (§2.5) — component chỉ dispatch ────────────────

export type TrangThaiPlayer =
  | { buoc: 'dang_tai' }
  | { buoc: 'khong_co_tu' }
  | {
      buoc: 'dang_on'
      man: Man[]
      chi_so: number
      trang_thai: Record<string, TrangThaiTu>
      da_xong_tu: string[]
      dang_luu: boolean
      loi_luu: string | null
    }
  | { buoc: 'het_session'; da_xong_tu: string[] }
  | { buoc: 'thoat'; da_xong_tu: string[] }

export type HanhDongPlayer =
  | { loai: 'nap'; man: Man[]; trang_thai: Record<string, TrangThaiTu> }
  | { loai: 'khong_co_tu' }
  | { loai: 'bat_dau_luu' }
  | { loai: 'luu_ok'; trang_thai_moi?: TrangThaiTu; xong_tu?: string; khong_sang?: boolean }  // khong_sang: Matching ghi N lần, chỉ lần cuối sang màn
  | { loai: 'luu_loi'; thong_diep: string }
  | { loai: 'thu_lai' }
  | { loai: 'sang_man' }
  | { loai: 'hard_day_cuoi' }
  | { loai: 'thoat' }

type DangOn = Extract<TrangThaiPlayer, { buoc: 'dang_on' }>

function sangMan(s: DangOn): TrangThaiPlayer {
  const chi_so = s.chi_so + 1
  return chi_so >= s.man.length ? { buoc: 'het_session', da_xong_tu: s.da_xong_tu } : { ...s, chi_so }
}

/** Hành động không hợp bước hiện tại → trả nguyên state (cùng tham chiếu). */
export function giamPlayer(s: TrangThaiPlayer, h: HanhDongPlayer): TrangThaiPlayer {
  switch (h.loai) {
    case 'nap':
      if (h.man.length === 0) return { buoc: 'khong_co_tu' }
      return { buoc: 'dang_on', man: h.man, chi_so: 0, trang_thai: h.trang_thai, da_xong_tu: [], dang_luu: false, loi_luu: null }
    case 'khong_co_tu':
      return { buoc: 'khong_co_tu' }
    case 'thoat':
      return s.buoc === 'dang_on' ? { buoc: 'thoat', da_xong_tu: s.da_xong_tu } : s
  }
  if (s.buoc !== 'dang_on') return s
  switch (h.loai) {
    case 'bat_dau_luu':
      return { ...s, dang_luu: true, loi_luu: null }
    case 'luu_ok': {
      const trang_thai = h.trang_thai_moi ? { ...s.trang_thai, [h.trang_thai_moi.vocab_id]: h.trang_thai_moi } : s.trang_thai
      const da_xong_tu = h.xong_tu && !s.da_xong_tu.includes(h.xong_tu) ? [...s.da_xong_tu, h.xong_tu] : s.da_xong_tu
      const tiep = { ...s, trang_thai, da_xong_tu, dang_luu: false, loi_luu: null }
      return h.khong_sang ? tiep : sangMan(tiep)
    }
    case 'luu_loi':
      return { ...s, dang_luu: false, loi_luu: h.thong_diep }
    case 'thu_lai':
      return { ...s, dang_luu: true, loi_luu: null }
    case 'sang_man':
      return sangMan(s)
    case 'hard_day_cuoi': {
      const hienTai = s.man[s.chi_so]
      if (!hienTai) return s
      const man = [...s.man.slice(0, s.chi_so), ...s.man.slice(s.chi_so + 1), hienTai]
      return { ...s, man }
    }
  }
}

// ── Chấm các dạng M4b ───────────────────────────────────────────────────────

/** So khớp đáp án nhập tay (§6.3): trim 2 đầu; tiếng Anh không phân biệt hoa thường. */
export function soKhopDapAn(nhap: string, dung: string, lang: 'zh' | 'en'): boolean {
  const a = nhap.trim()
  const b = dung.trim()
  if (!a) return false
  return lang === 'en' ? a.toLowerCase() === b.toLowerCase() : a === b
}

/** Arrange Words (§6.3 #13): đúng khi thứ tự chip khớp mảng `tokens` GỐC (app chỉ shuffle lúc hiện). */
export function chamArrange(daChon: string[], tokens: Cau[]): boolean {
  return daChon.length === tokens.length && daChon.every((t, i) => t === tokens[i]?.text)
}

export type HangRetry = {
  reason: 'below_threshold' | 'flashcard_again'
  exercise_types: DangBai[] | null
}

/**
 * Lọc hàng retry theo dạng bài mà từ đó THỰC SỰ có record (chốt M4b/Q4).
 * DB có thể thiếu `select_dialog`/`fill_dialog` cho phần lớn từ; nếu vẫn ghi vào hàng đợi thì lượt
 * "Ôn lại" dựng 0 màn mà từ lại bị loại khỏi session thường ⇒ kẹt cả ngày. `srs.ts` không biết từ nào
 * có record nào nên việc lọc thuộc tầng gọi.
 */
export function locRetryTheoRecord(retry: HangRetry | null, dangCoRecord: DangBai[]): HangRetry | null {
  if (!retry || retry.exercise_types === null) return retry
  const co = new Set(dangCoRecord)
  const con = retry.exercise_types.filter((d) => !CAN_RECORD.has(d) || co.has(d))
  return con.length > 0 ? { ...retry, exercise_types: con } : null
}

/**
 * Dạng KHÔNG tính điểm nâng stage: flashcard (DEC-11) · grammar (chỉ để đọc) ·
 * 3 màn NHẬP tự luận (điểm ghi ở màn `cham_ai` đi kèm, không phải ở màn nhập).
 */
const KHONG_TINH_DIEM: ReadonlySet<Man['loai']> = new Set([
  'flashcard', 'grammar', 'make_sentence', 'trans_sentence', 'complete_situation',
])

/**
 * Session có bài TÍNH ĐIỂM nào không?
 *
 * Phát hiện khi kiểm thật M4b: flashcard/grammar không bao giờ vào `cycle_completed_exercises`
 * (chúng không tính điểm) nên `xepBai` luôn dựng lại chúng. Nếu từ đã làm hết bài tính điểm mà vẫn
 * due (chưa đủ ngưỡng, chưa có hàng retry), tầng gọi sẽ nạp đi nạp lại một session chỉ gồm
 * flashcard + grammar ⇒ lặp vô hạn. Tầng gọi phải bỏ qua session như vậy.
 */
export function coBaiTinhDiem(man: Man[]): boolean {
  return man.some((m) => !KHONG_TINH_DIEM.has(m.loai))
}
