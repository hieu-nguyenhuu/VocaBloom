/**
 * Test cho srs.ts — SPECIFICATION.md §3 (SRS engine) + §4 (session).
 *
 * Toàn bộ là hàm thuần nên test chạy trong mili-giây, không cần DB, không cần dọn dữ liệu.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  MASTER_THRESHOLD, MAX_CYCLE, PHAT, boBaiCua, diemChoBai, diemGocCua, gapFactor, gomSession,
  tinhHealth, tinhPhat, xuLyFlashcard, xuLyTraLoi,
  type DangBai, type Stage, type TrangThaiTu,
} from './srs.ts'

const HOM_NAY = '2026-09-09'

function tu(ghiDe: Partial<TrangThaiTu> = {}): TrangThaiTu {
  return {
    vocab_id: 'v1',
    stage: 'new',
    next_review_date: HOM_NAY,
    cycle_points: 0,
    cycle_completed_exercises: [],
    total_points: 0,
    last_reviewed_at: null,
    ...ghiDe,
  }
}

function traLoi(trang_thai: TrangThaiTu, dang_bai: DangBai, ghiDe: {
  dung?: boolean; dung_goi_y?: boolean; dang_due?: boolean; la_bai_cuoi_cua_tu?: boolean
} = {}) {
  return xuLyTraLoi({
    trang_thai, dang_bai,
    dung: ghiDe.dung ?? true,
    dung_goi_y: ghiDe.dung_goi_y ?? false,
    dang_due: ghiDe.dang_due ?? true,
    la_bai_cuoi_cua_tu: ghiDe.la_bai_cuoi_cua_tu ?? false,
    hom_nay: HOM_NAY,
  })
}

describe('Điểm mỗi bài (§3.2)', () => {
  it('E1 — đúng +1/+2/+3/+4 theo stage', () => {
    expect(diemChoBai('new', 'selection', false)).toBe(1)
    expect(diemChoBai('stage1', 'translate', false)).toBe(2)
    expect(diemChoBai('stage2', 'arrange_words', false)).toBe(3)
    expect(diemChoBai('stage3', 'make_sentence', false)).toBe(4)
    expect(diemChoBai('intensive', 'fill_dialog', false)).toBe(3) // Q4: dùng luật stage2
  })

  it('E2 — Matching CÓ tính điểm (chốt Q1), Flashcard và Grammar thì không', () => {
    expect(diemChoBai('new', 'matching', false)).toBe(1)
    expect(diemChoBai('new', 'flashcard', false)).toBe(0)
    expect(diemChoBai('new', 'grammar', false)).toBe(0)
  })

  it('E3 — dùng gợi ý giảm 50%, LÀM TRÒN XUỐNG (DEC-19)', () => {
    expect(diemChoBai('new', 'selection', true)).toBe(0)      // 1 -> 0
    expect(diemChoBai('stage1', 'translate', true)).toBe(1)   // 2 -> 1
    expect(diemChoBai('stage2', 'arrange_words', true)).toBe(1) // 3 -> 1
    expect(diemChoBai('stage3', 'make_sentence', true)).toBe(2) // 4 -> 2
  })

  it('E4 — bài không thuộc stage hiện tại thì 0 điểm', () => {
    expect(diemChoBai('new', 'make_sentence', false)).toBe(0)
    expect(diemChoBai('stage3', 'selection', false)).toBe(0)
  })
})

describe('Ngưỡng nâng stage (§3.2) + gap của stage ĐÍCH (§3.1)', () => {
  it('P1 — new đủ 3/4 → stage1, gap 2 ngày, reset cycle', () => {
    // total 3 + 1 = 4/4 => health 1.0 => gap_factor 100% => đúng 2 ngày.
    // (Trường hợp health thấp làm gap co lại đã có ca H4 phủ riêng.)
    const kq = traLoi(tu({ cycle_points: 2, total_points: 3 }), 'fast_decision',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.stage).toBe('stage1')
    expect(kq.trang_thai_moi.cycle_points).toBe(0)
    expect(kq.trang_thai_moi.cycle_completed_exercises).toEqual([])
    expect(kq.trang_thai_moi.next_review_date).toBe('2026-09-11') // +2 × 100%
    expect(kq.dong_review_log.stage_before).toBe('new')
    expect(kq.dong_review_log.stage_after).toBe('stage1')
  })

  it('P2 — stage1 đủ 6/8 → stage2, gap 4 ngày', () => {
    const kq = traLoi(tu({ stage: 'stage1', cycle_points: 4, total_points: 10 }), 'listen_fill',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.stage).toBe('stage2')
    expect(kq.trang_thai_moi.next_review_date).toBe('2026-09-13') // +4 × 100%
  })

  it('P3 — stage2 đủ 9/12 → stage3, gap 7 ngày', () => {
    const kq = traLoi(tu({ stage: 'stage2', cycle_points: 6, total_points: 22 }), 'select_sentence',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.stage).toBe('stage3')
    expect(kq.trang_thai_moi.next_review_date).toBe('2026-09-16') // +7 × 100%
  })

  it('P4 — chưa đủ ngưỡng thì KHÔNG lên stage', () => {
    const kq = traLoi(tu({ cycle_points: 0 }), 'selection', { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.stage).toBe('new')
    expect(kq.trang_thai_moi.cycle_points).toBe(1)
  })
})

describe('Health & gap_factor (§3.4)', () => {
  it('H1 — health = total_points / max tích luỹ (4·12·24·36, chốt Q2)', () => {
    expect(tinhHealth(tu({ stage: 'new', total_points: 4 }))).toBeCloseTo(1)
    expect(tinhHealth(tu({ stage: 'stage1', total_points: 6 }))).toBeCloseTo(0.5)
    expect(tinhHealth(tu({ stage: 'stage2', total_points: 12 }))).toBeCloseTo(0.5)
    expect(tinhHealth(tu({ stage: 'stage3', total_points: 18 }))).toBeCloseTo(0.5)
  })

  it('H2 — 3 mốc gap_factor', () => {
    expect(gapFactor(0.9)).toBe(1)
    expect(gapFactor(0.65)).toBe(0.7)
    expect(gapFactor(0.2)).toBe(0.5)
  })

  it('H3 — BIÊN chính xác: 0.8 và 0.5 thuộc về mốc CAO hơn', () => {
    expect(gapFactor(0.8)).toBe(1)
    expect(gapFactor(0.799999)).toBe(0.7)
    expect(gapFactor(0.5)).toBe(0.7)
    expect(gapFactor(0.499999)).toBe(0.5)
  })

  it('H4 — health thấp thì gap bị rút ngắn thật sự', () => {
    // stage1 -> stage2: gap gốc 4. total 3/12 = 0.25 -> 50% -> round(2) = 2 ngày.
    const kq = traLoi(tu({ stage: 'stage1', cycle_points: 4, total_points: 3 }), 'listen_fill',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.next_review_date).toBe('2026-09-11')
  })
})

describe('Không phạt khi sai, không bao giờ tụt stage (DEC-08/09)', () => {
  it('K1 — sai 5 lần liên tiếp: stage giữ nguyên, total_points không giảm', () => {
    let t = tu({ stage: 'stage2', cycle_points: 3, total_points: 15 })
    for (let i = 0; i < 5; i += 1) {
      t = traLoi(t, 'arrange_words', { dung: false, la_bai_cuoi_cua_tu: true }).trang_thai_moi
    }
    expect(t.stage).toBe('stage2')
    expect(t.total_points).toBe(15)
    expect(t.cycle_points).toBe(3)
  })
})

describe('Chưa đạt ngưỡng (§4.2)', () => {
  it('R1 — next_review_date GIỮ NGUYÊN, không được dời', () => {
    const kq = traLoi(tu({ cycle_points: 1 }), 'selection', { dung: false, la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.next_review_date).toBe(HOM_NAY)
  })

  it('R2 — vào retry queue đúng các bài CHƯA đạt', () => {
    const kq = traLoi(
      tu({ cycle_points: 1, cycle_completed_exercises: ['matching'] }),
      'selection',
      { dung: false, la_bai_cuoi_cua_tu: true },
    )
    expect(kq.vao_retry_queue?.reason).toBe('below_threshold')
    expect(kq.vao_retry_queue?.exercise_types.sort())
      .toEqual(['audio_recognition', 'fast_decision', 'selection'])
  })

  it('R2b — bài ĐÚNG mới được ghi vào cycle_completed_exercises', () => {
    const dung = traLoi(tu(), 'selection', { dung: true })
    expect(dung.trang_thai_moi.cycle_completed_exercises).toEqual(['selection'])
    const sai = traLoi(tu(), 'selection', { dung: false })
    expect(sai.trang_thai_moi.cycle_completed_exercises).toEqual([])
  })

  it('R2c — dùng gợi ý được 0 điểm nhưng VẪN tính là đã đạt (không retry)', () => {
    const kq = traLoi(tu(), 'selection', { dung: true, dung_goi_y: true })
    expect(kq.dong_review_log.points).toBe(0)
    expect(kq.trang_thai_moi.cycle_completed_exercises).toEqual(['selection'])
  })
})

describe('Rẽ nhánh cuối: mastered / intensive (§3.3)', () => {
  it('M1 — xong vòng stage3 với total ≥ 30 → mastered, DỪNG lịch ôn', () => {
    const kq = traLoi(tu({ stage: 'stage3', cycle_points: 8, total_points: 27 }), 'trans_sentence',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.total_points).toBe(31)
    expect(kq.trang_thai_moi.stage).toBe('mastered')
    expect(kq.trang_thai_moi.next_review_date).toBeNull()
    expect(kq.dong_review_log.stage_after).toBe('mastered')
  })

  it('M2 — xong vòng stage3 nhưng total < 30 → intensive, gap 7 ngày', () => {
    const kq = traLoi(tu({ stage: 'stage3', cycle_points: 8, total_points: 10 }), 'trans_sentence',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.stage).toBe('intensive')
    expect(kq.trang_thai_moi.next_review_date).not.toBeNull()
  })

  it('M2b — intensive đủ 30 điểm → mastered', () => {
    const kq = traLoi(tu({ stage: 'intensive', cycle_points: 8, total_points: 28 }), 'fill_dialog',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.total_points).toBe(31)
    expect(kq.trang_thai_moi.stage).toBe('mastered')
  })

  it('M2c — intensive chưa đủ 30 → ở lại intensive, KHÔNG tụt stage', () => {
    const kq = traLoi(tu({ stage: 'intensive', cycle_points: 8, total_points: 12 }), 'fill_dialog',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.stage).toBe('intensive')
    expect(kq.trang_thai_moi.cycle_points).toBe(0) // vòng mới
  })
})

describe('Flashcard Good/Hard/Again (§4.3, DEC-11)', () => {
  it('F1 — 3 nút cho 3 hành vi khác nhau', () => {
    expect(xuLyFlashcard('good')).toEqual({ day_cuoi_session: false, vao_retry: false })
    expect(xuLyFlashcard('hard')).toEqual({ day_cuoi_session: true, vao_retry: false })
    expect(xuLyFlashcard('again')).toEqual({ day_cuoi_session: false, vao_retry: true })
  })

  it('F1b — flashcard không bao giờ cộng điểm nâng stage', () => {
    const kq = traLoi(tu({ cycle_points: 2 }), 'flashcard', { la_bai_cuoi_cua_tu: true })
    expect(kq.dong_review_log.points).toBe(0)
    expect(kq.trang_thai_moi.stage).toBe('new') // 2 điểm < ngưỡng 3
  })
})

describe('Select/Fill Dialog ôn 2 từ (§4.4)', () => {
  it('D1 — chỉ cộng điểm cho từ ĐANG due; từ kia chấm đúng nhưng 0 điểm', () => {
    const due = traLoi(tu({ stage: 'stage1' }), 'select_dialog', { dang_due: true })
    expect(due.dong_review_log.points).toBe(2)
    expect(due.trang_thai_moi.cycle_points).toBe(2)

    const khongDue = traLoi(tu({ stage: 'stage1' }), 'select_dialog', { dang_due: false })
    expect(khongDue.dong_review_log.points).toBe(0)
    expect(khongDue.trang_thai_moi.cycle_points).toBe(0)
    expect(khongDue.trang_thai_moi.total_points).toBe(0)
  })
})

describe('Gom session (§4.1, DEC-10)', () => {
  it('S1 — thuần 1 stage, order stage ASC + next_review_date ASC, phần dư thành session riêng', () => {
    const ds: TrangThaiTu[] = [
      tu({ vocab_id: 'b1', stage: 'stage1', next_review_date: '2026-09-08' }),
      tu({ vocab_id: 'a1', stage: 'new', next_review_date: '2026-09-05' }),
      tu({ vocab_id: 'a2', stage: 'new', next_review_date: '2026-09-01' }),
      tu({ vocab_id: 'a3', stage: 'new', next_review_date: '2026-09-07' }),
      tu({ vocab_id: 'a4', stage: 'new', next_review_date: '2026-09-08' }),
      tu({ vocab_id: 'a5', stage: 'new', next_review_date: '2026-09-09' }),
      tu({ vocab_id: 'a6', stage: 'new', next_review_date: '2026-09-09' }),
      tu({ vocab_id: 'b2', stage: 'stage1', next_review_date: '2026-09-09' }),
    ]
    const phien = gomSession(ds, 5)

    // stage new trước, trong đó quá hạn lâu nhất trước
    expect(phien[0]?.map((t) => t.vocab_id)).toEqual(['a2', 'a1', 'a3', 'a4', 'a5'])
    // phần dư của stage new KHÔNG bị trộn với stage1
    expect(phien[1]?.map((t) => t.vocab_id)).toEqual(['a6'])
    expect(phien[2]?.map((t) => t.vocab_id)).toEqual(['b1', 'b2'])
    for (const p of phien) expect(new Set(p.map((t) => t.stage)).size).toBe(1)
  })

  it('S1b — bỏ qua từ chưa kích hoạt (next_review_date = null) và từ đã mastered', () => {
    const ds: TrangThaiTu[] = [
      tu({ vocab_id: 'cho', next_review_date: null }),
      tu({ vocab_id: 'xong', stage: 'mastered', next_review_date: null }),
      tu({ vocab_id: 'due', next_review_date: '2026-09-09' }),
    ]
    expect(gomSession(ds, 5).flat().map((t) => t.vocab_id)).toEqual(['due'])
  })
})

describe('Chống lệch giữa TypeScript và SQL', () => {
  it('X1 — bảng PHAT phải khớp y hệt bảng phạt trong 0005_maintenance.sql', () => {
    const sql = readFileSync('supabase/migrations/0005_maintenance.sql', 'utf8')
    const khoiCase = sql.slice(sql.indexOf('case ws.stage'), sql.indexOf('end, 0)'))

    const tuSql: Record<string, number> = {}
    for (const m of khoiCase.matchAll(/when '(\w+)'\s+then\s+(\d+)/g)) {
      tuSql[m[1] as string] = Number(m[2])
    }
    // 'mastered' đi theo nhánh `else 0` trong SQL nên không xuất hiện ở regex
    tuSql['mastered'] = 0

    for (const [stage, diem] of Object.entries(PHAT)) {
      expect(tuSql[stage], `stage '${stage}' lệch giữa srs.ts và 0005_maintenance.sql`).toBe(diem)
    }
    expect(tinhPhat('intensive')).toBe(5)
    expect(tinhPhat('mastered')).toBe(0) // mastered miễn nhiễm phạt
  })

  it('X2 — MAX_CYCLE phải = số dạng bài × điểm mỗi bài (bất biến chống lệch bảng)', () => {
    const cacStage = ['new', 'stage1', 'stage2', 'stage3', 'intensive'] as const
    for (const st of cacStage) {
      expect(MAX_CYCLE[st], `MAX_CYCLE['${st}'] lệch với bộ bài`)
        .toBe(boBaiCua(st).length * diemGocCua(st))
    }
    // Hệ quả trực tiếp của chốt Q1: Matching tính điểm ⇒ stage new có 4 bài, max 4.
    expect(boBaiCua('new')).toContain('matching')
    expect(MAX_CYCLE.new).toBe(4)
    // Ngưỡng luôn phải nhỏ hơn max, nếu bằng thì bắt buộc đúng 100% mới lên stage.
    for (const st of cacStage) expect(MAX_CYCLE[st]).toBeGreaterThan(0)
  })

  it('X1b — MASTER_THRESHOLD đúng 30 (§3.3)', () => {
    expect(MASTER_THRESHOLD).toBe(30)
  })

  it('X1c — srs.ts là hàm THUẦN: không import React/Supabase/node:', () => {
    const nguon = readFileSync('src/lib/srs.ts', 'utf8')
    for (const cam of ['react', '@supabase', 'node:', './supabase']) {
      expect(nguon.includes(`from '${cam}`), `srs.ts không được import '${cam}'`).toBe(false)
    }
  })
})

describe('review_log ghi đủ stage_before/stage_after ở MỌI dòng (§4.6)', () => {
  it('L1 — không promote thì 2 giá trị bằng nhau', () => {
    const kq = traLoi(tu({ stage: 'stage2' }), 'arrange_words')
    expect(kq.dong_review_log.stage_before).toBe<Stage>('stage2')
    expect(kq.dong_review_log.stage_after).toBe<Stage>('stage2')
    expect(kq.dong_review_log.used_hint).toBe(false)
    expect(kq.dong_review_log.vocab_id).toBe('v1')
  })
})
