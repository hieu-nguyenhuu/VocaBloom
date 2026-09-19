/**
 * srs.ts — toàn bộ luật SRS của VocaBloom (SPECIFICATION.md §3 + §4).
 *
 * HÀM THUẦN (MB-05): không import React, không import Supabase, không đọc file,
 * không gọi mạng, không đọc đồng hồ hệ thống (ngày luôn truyền vào). Đây là điều
 * kiện để TDD được phần logic dễ sai nhất của app.
 *
 * Hàm ở đây KHÔNG tự ghi DB — chúng trả về "những thay đổi cần áp dụng", việc ghi
 * xuống Supabase là của M4.
 */

export type Stage = 'new' | 'stage1' | 'stage2' | 'stage3' | 'intensive' | 'mastered'

/** Mọi stage còn phải ôn — 'mastered' là trạng thái DỪNG nên tách riêng. */
export type StageOn = Exclude<Stage, 'mastered'>

export type DangBai =
  | 'flashcard' | 'grammar' | 'matching' | 'selection' | 'audio_recognition' | 'fast_decision'
  | 'translate' | 'select_dialog' | 'listen_fill' | 'select_on_describe'
  | 'fill_dialog' | 'select_sentence' | 'arrange_words' | 'trans_collocation'
  | 'make_sentence' | 'trans_sentence' | 'complete_situation'

export type TrangThaiTu = {
  vocab_id: string
  stage: Stage
  next_review_date: string | null          // 'yyyy-mm-dd'; null = hàng đợi chờ hoặc đã mastered
  cycle_points: number
  cycle_completed_exercises: DangBai[]
  total_points: number
  last_reviewed_at: string | null
}

export type DongReviewLog = {
  vocab_id: string
  exercise_type: DangBai
  is_correct: boolean
  used_hint: boolean
  points: number
  stage_before: Stage
  stage_after: Stage                        // §4.6 — ghi ở MỌI dòng, bằng nhau nếu không promote
}

export type KetQuaTraLoi = {
  trang_thai_moi: TrangThaiTu
  dong_review_log: DongReviewLog
  vao_retry_queue: { reason: 'below_threshold' | 'flashcard_again'; exercise_types: DangBai[] | null } | null  // null = retry cả bộ
}

// ── Hằng số nghiệp vụ — GOM ĐÚNG 1 CHỖ (systemPatterns.md §6) ──────────────

export const MASTER_THRESHOLD = 30

/** Điểm mỗi bài ĐÚNG. Q4: intensive dùng nguyên luật stage2. */
const DIEM_MOI_BAI: Record<StageOn, number> = {
  new: 1, stage1: 2, stage2: 3, stage3: 4, intensive: 3,
}

/** Ngưỡng cycle_points để hoàn thành 1 vòng. */
const NGUONG_CYCLE: Record<StageOn, number> = {
  new: 3, stage1: 6, stage2: 9, stage3: 9, intensive: 9,
}

/**
 * Điểm tối đa của riêng 1 vòng. Q1: Matching TÍNH điểm nên new = 4, không phải 3.
 * Phải luôn bằng (số dạng bài của stage) × (điểm mỗi bài) — ca X2 canh bất biến này,
 * vì lệch bảng này chính là loại mâu thuẫn đã xảy ra ở §3.2 (vụ Matching).
 * M4 cũng dùng để hiển thị tiến độ vòng ("3/4 điểm").
 */
export const MAX_CYCLE: Record<StageOn, number> = {
  new: 4, stage1: 8, stage2: 12, stage3: 12, intensive: 12,
}

/** Q2: mẫu số của health = max điểm CỘNG DỒN các stage đã đi qua (4 · 12 · 24 · 36). */
const MAX_TICH_LUY: Record<StageOn, number> = {
  new: 4, stage1: 12, stage2: 24, stage3: 36, intensive: 36,
}

/**
 * ⚠️ Gap gắn với stage ĐÍCH, KHÔNG phải stage nguồn (đọc thẳng sơ đồ §3.1):
 * lên stage1 → +2 ngày, lên stage2 → +4, lên stage3 → +7. Hiểu nhầm là lệch cả lịch ôn.
 */
const GAP_VAO_STAGE: Record<StageOn, number> = {
  new: 1, stage1: 2, stage2: 4, stage3: 7, intensive: 7,
}

/**
 * Phạt khi BỎ LỠ NGÀY ôn (§3.5). Trả lời sai KHÔNG phạt (DEC-08).
 * ⚠️ Bảng này TỒN TẠI 2 NƠI: ở đây và trong supabase/migrations/0005_maintenance.sql.
 *    Test X1 (srs.test.ts) đọc file SQL và so khớp để 2 nơi không bao giờ lệch nhau.
 */
export const PHAT: Record<Stage, number> = {
  new: 1, stage1: 2, stage2: 3, stage3: 4, intensive: 5, mastered: 0,
}

/** Bài TÍNH ĐIỂM của từng stage (§3.2 + §6). flashcard/grammar không có mặt ⇒ luôn 0 điểm. */
const DANG_BAI_THEO_STAGE: Record<StageOn, readonly DangBai[]> = {
  new: ['matching', 'selection', 'audio_recognition', 'fast_decision'],
  stage1: ['translate', 'select_dialog', 'listen_fill', 'select_on_describe'],
  stage2: ['fill_dialog', 'select_sentence', 'arrange_words', 'trans_collocation'],
  stage3: ['make_sentence', 'trans_sentence', 'complete_situation'],
  intensive: ['fill_dialog', 'select_sentence', 'arrange_words', 'trans_collocation'],
}

const STAGE_KE_TIEP: Record<'new' | 'stage1' | 'stage2', Stage> = {
  new: 'stage1', stage1: 'stage2', stage2: 'stage3',
}

function laStageOn(s: Stage): s is StageOn {
  return s !== 'mastered'
}

/** Cộng ngày cho chuỗi 'yyyy-mm-dd'. Dùng UTC để không dính lệch múi giờ máy chạy. */
function congNgay(ngay: string, soNgay: number): string {
  const phan = ngay.split('-').map(Number)
  const [y, m, d] = [phan[0] ?? 1970, phan[1] ?? 1, phan[2] ?? 1]
  return new Date(Date.UTC(y, m - 1, d) + soNgay * 86_400_000).toISOString().slice(0, 10)
}

// ── Helper thuần — export riêng để test từng luật độc lập ──────────────────

/** Điểm 1 bài ĐÚNG. Bài không thuộc stage hiện tại (kể cả flashcard/grammar) → 0. */
export function diemChoBai(stage: Stage, dang_bai: DangBai, dung_goi_y: boolean): number {
  if (!laStageOn(stage)) return 0
  if (!DANG_BAI_THEO_STAGE[stage].includes(dang_bai)) return 0
  const goc = DIEM_MOI_BAI[stage]
  return dung_goi_y ? Math.floor(goc / 2) : goc   // DEC-19: giảm 50%, LÀM TRÒN XUỐNG
}

/** health = total_points / max điểm CỘNG DỒN tới stage hiện tại (§3.4, chốt Q2). */
export function tinhHealth(trang_thai: TrangThaiTu): number {
  if (!laStageOn(trang_thai.stage)) return 1
  return trang_thai.total_points / MAX_TICH_LUY[trang_thai.stage]
}

/** Biên thuộc về mốc CAO hơn: 0.8 → 100%, 0.5 → 70%. */
export function gapFactor(health: number): 1 | 0.7 | 0.5 {
  if (health >= 0.8) return 1
  if (health >= 0.5) return 0.7
  return 0.5
}

/** Phạt khi bỏ lỡ NGÀY ôn (§3.5). mastered miễn nhiễm. */
export function tinhPhat(stage: Stage): number {
  return PHAT[stage]
}

/** Flashcard Good/Hard/Again (§4.3) — không bao giờ ảnh hưởng điểm nâng stage. */
export function xuLyFlashcard(nut: 'good' | 'hard' | 'again'): {
  day_cuoi_session: boolean
  vao_retry: boolean
} {
  return {
    day_cuoi_session: nut === 'hard',
    vao_retry: nut === 'again',
  }
}

/** Bộ bài tính điểm của 1 stage — M4 dùng để build session và hiện tiến độ. */
export function boBaiCua(stage: Stage): readonly DangBai[] {
  return laStageOn(stage) ? DANG_BAI_THEO_STAGE[stage] : []
}

/** Điểm mỗi bài đúng của 1 stage (chưa trừ gợi ý). */
export function diemGocCua(stage: Stage): number {
  return laStageOn(stage) ? DIEM_MOI_BAI[stage] : 0
}

const THU_TU_STAGE: Record<StageOn, number> = {
  new: 0, stage1: 1, stage2: 2, stage3: 3, intensive: 4,
}

/**
 * Gom từ due thành các session THUẦN 1 STAGE (§4.1, DEC-10).
 * Nhận sẵn mảng từ due — phần query DB là việc của tầng gọi.
 * "5 từ" là lý tưởng, KHÔNG ép cứng: phần dư của mỗi stage vẫn thành session riêng.
 */
export function gomSession(dsTu: TrangThaiTu[], soTuMoiSession = 5): TrangThaiTu[][] {
  const conOn = dsTu.filter(
    (t): t is TrangThaiTu & { stage: StageOn } =>
      t.next_review_date !== null && laStageOn(t.stage),
  )

  // sort ổn định: stage thấp trước, trong cùng stage thì quá hạn lâu nhất trước
  const daSap = [...conOn].sort((a, b) => {
    const lech = THU_TU_STAGE[a.stage] - THU_TU_STAGE[b.stage]
    return lech !== 0 ? lech : (a.next_review_date ?? '').localeCompare(b.next_review_date ?? '')
  })

  const phien: TrangThaiTu[][] = []
  let hienTai: TrangThaiTu[] = []
  for (const t of daSap) {
    const doiStage = hienTai.length > 0 && hienTai[0]?.stage !== t.stage
    if (doiStage || hienTai.length === soTuMoiSession) {
      phien.push(hienTai)
      hienTai = []
    }
    hienTai.push(t)
  }
  if (hienTai.length > 0) phien.push(hienTai)
  return phien
}

/**
 * Xử lý 1 lần trả lời — hàm điều phối duy nhất mà tầng UI/DB cần gọi.
 *
 * Gộp "chấm bài" và "xét lên stage" vào cùng 1 hàm là CHỦ Ý: `stage_after` chỉ biết
 * được SAU khi xét promote, tách đôi sẽ đẻ ra một giao thức ngầm ("gọi A rồi vá kết
 * quả vào dòng log của B") rất dễ làm sai ở tầng gọi.
 */
export function xuLyTraLoi(dv: {
  trang_thai: TrangThaiTu
  dang_bai: DangBai
  dung: boolean
  dung_goi_y: boolean
  dang_due: boolean
  la_bai_cuoi_cua_tu: boolean
  hom_nay: string
}): KetQuaTraLoi {
  const { trang_thai, dang_bai, dung, dung_goi_y, dang_due, la_bai_cuoi_cua_tu, hom_nay } = dv
  const stage_before = trang_thai.stage

  // §4.4 — Select/Fill Dialog ôn 2 từ cùng lúc, nhưng CHỈ từ đang due mới được tính
  // điểm và tính chu kỳ. Từ kia vẫn chấm đúng/sai tại chỗ ("ôn thêm miễn phí").
  const tinhChoTuNay = dang_due
  const diem = dung && tinhChoTuNay ? diemChoBai(stage_before, dang_bai, dung_goi_y) : 0

  let cycle_points = trang_thai.cycle_points + diem
  let total_points = trang_thai.total_points + diem
  let daDat = [...trang_thai.cycle_completed_exercises]

  // Chỉ bài ĐÚNG và thuộc bộ bài của stage mới được ghi nhận đã đạt (§4.2).
  // Dùng gợi ý được 0 điểm nhưng VẪN tính là đạt — retry câu đã trả lời đúng là vô nghĩa.
  const thuocBoBai = laStageOn(stage_before) && DANG_BAI_THEO_STAGE[stage_before].includes(dang_bai)
  if (dung && tinhChoTuNay && thuocBoBai && !daDat.includes(dang_bai)) {
    daDat = [...daDat, dang_bai]
  }

  let stage_after: Stage = stage_before
  let next_review_date = trang_thai.next_review_date
  let vao_retry_queue: KetQuaTraLoi['vao_retry_queue'] = null

  // Chốt Q3: chỉ xét lên stage khi từ đã làm xong bộ bài của nó trong lượt này.
  if (la_bai_cuoi_cua_tu && laStageOn(stage_before)) {
    const heSo = gapFactor(total_points / MAX_TICH_LUY[stage_before])

    if (cycle_points >= NGUONG_CYCLE[stage_before]) {
      if (stage_before === 'stage3' || stage_before === 'intensive') {
        // §3.3 — kiểm mastered sau vòng stage3 đầu tiên VÀ sau mỗi vòng intensive
        if (total_points >= MASTER_THRESHOLD) {
          stage_after = 'mastered'
          next_review_date = null              // DỪNG: hết lịch ôn, miễn nhiễm phạt
        } else {
          stage_after = 'intensive'
          next_review_date = congNgay(hom_nay, Math.round(GAP_VAO_STAGE.intensive * heSo))
        }
      } else {
        stage_after = STAGE_KE_TIEP[stage_before]
        // ⚠️ gap lấy theo stage ĐÍCH, không phải stage nguồn (§3.1)
        const gapDich = laStageOn(stage_after) ? GAP_VAO_STAGE[stage_after] : 0
        next_review_date = congNgay(hom_nay, Math.round(gapDich * heSo))
      }

      // DEC-05 — sang vòng mới thì reset cycle; total_points KHÔNG BAO GIỜ reset
      cycle_points = 0
      daDat = []
    } else {
      // Chưa đạt ngưỡng: KHÔNG dời lịch (từ vẫn due, "lịch tự lành" §1.2),
      // chỉ dồn các bài CHƯA đạt vào hàng đợi ôn lại trong ngày (DEC-06).
      // Đạt HẾT bộ bài mà vẫn thiếu điểm (do gợi ý): nếu giữ daDat đầy thì không còn bài tính điểm
      // nào cho lượt sau → từ KẸT vĩnh viễn (cycle chỉ reset khi lên stage). Mở lại bộ bài, giữ
      // cycle_points cộng dồn, retry CẢ BỘ (exercise_types null — ngữ nghĩa có sẵn ở schema §2).
      // Phát hiện khi kiểm thật M4a 2026-09-16 (test R2d).
      const chuaDat = DANG_BAI_THEO_STAGE[stage_before].filter((x) => !daDat.includes(x))
      if (chuaDat.length === 0) {
        daDat = []
        vao_retry_queue = { reason: 'below_threshold', exercise_types: null }
      } else {
        vao_retry_queue = { reason: 'below_threshold', exercise_types: chuaDat }
      }
    }
  }

  return {
    trang_thai_moi: {
      ...trang_thai,
      stage: stage_after,
      next_review_date,
      cycle_points,
      cycle_completed_exercises: daDat,
      total_points,
      last_reviewed_at: hom_nay,
    },
    dong_review_log: {
      vocab_id: trang_thai.vocab_id,
      exercise_type: dang_bai,
      is_correct: dung,
      used_hint: dung_goi_y,
      points: diem,
      stage_before,
      stage_after,      // §4.6 — ghi ở MỌI dòng, bằng stage_before nếu không promote
    },
    vao_retry_queue,
  }
}
