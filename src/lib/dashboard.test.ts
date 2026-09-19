import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  dai7Ngay,
  demDenHan,
  gioVN,
  gomKhuVuon,
  loiChao,
  luiNgay,
  ngayCoOn,
  ngayDayDu,
  TEN_NGUOI_DUNG,
  tinhStreak,
} from './dashboard.ts'

const tap = (...ngay: string[]) => new Set(ngay)

describe('lời chào & ngày', () => {
  it('chào theo khung giờ', () => {
    expect(loiChao(8)).toBe('Chào buổi sáng')
    expect(loiChao(10)).toBe('Chào buổi sáng')
    expect(loiChao(11)).toBe('Chào buổi chiều')
    expect(loiChao(14)).toBe('Chào buổi chiều')
    expect(loiChao(18)).toBe('Chào buổi tối')
    expect(loiChao(23)).toBe('Chào buổi tối')
  })

  it('gioVN lấy giờ Việt Nam bất kể múi giờ máy', () => {
    // 01:30Z = 08:30 giờ VN
    expect(gioVN(new Date('2026-09-18T01:30:00Z'))).toBe(8)
    // 17:00Z = 00:00 hôm sau giờ VN → phải là 0, KHÔNG phải 24
    expect(gioVN(new Date('2026-09-18T17:00:00Z'))).toBe(0)
  })

  it('ngày đầy đủ theo mockup 01', () => {
    expect(ngayDayDu('2026-07-16')).toBe('Thứ Năm, 16 tháng 7')
    expect(ngayDayDu('2026-09-18')).toBe('Thứ Sáu, 18 tháng 9')
  })

  it('tên người dùng cố định (chốt M6b/Q1)', () => {
    expect(TEN_NGUOI_DUNG).toBe('Helios')
  })

  it('luiNgay qua mốc đầu tháng / đầu năm', () => {
    expect(luiNgay('2026-09-01', 1)).toBe('2026-08-31')
    expect(luiNgay('2026-01-01', 1)).toBe('2025-12-31')
    expect(luiNgay('2026-09-18', 0)).toBe('2026-09-18')
    expect(luiNgay('2026-09-18', 30)).toBe('2026-08-19')
  })
})

describe('tinhStreak', () => {
  it('liên tiếp tới hôm nay', () => {
    expect(tinhStreak(tap('2026-09-16', '2026-09-17', '2026-09-18'), '2026-09-18')).toBe(3)
  })

  it('hôm nay chưa ôn nhưng hôm qua có → chuỗi chưa đứt', () => {
    expect(tinhStreak(tap('2026-09-16', '2026-09-17'), '2026-09-18')).toBe(2)
  })

  it('đứt quãng ở giữa → chỉ đếm đoạn gần nhất', () => {
    expect(tinhStreak(tap('2026-09-10', '2026-09-17', '2026-09-18'), '2026-09-18')).toBe(2)
  })

  it('nghỉ 2 ngày → 0', () => {
    expect(tinhStreak(tap('2026-09-15', '2026-09-16'), '2026-09-18')).toBe(0)
  })

  it('chưa ôn bao giờ → 0', () => {
    expect(tinhStreak(tap(), '2026-09-18')).toBe(0)
  })
})

describe('dai7Ngay', () => {
  const d = dai7Ngay(tap('2026-09-16', '2026-09-17', '2026-09-18'), '2026-09-18')

  it('đúng 7 ô, ô cuối là hôm nay', () => {
    expect(d).toHaveLength(7)
    expect(d[6]!.ngay).toBe('2026-09-18')
    expect(d[0]!.ngay).toBe('2026-09-12')
  })

  it('chỉ 1 ô laHomNay', () => {
    expect(d.filter((o) => o.laHomNay)).toHaveLength(1)
  })

  it('cờ daOn đúng', () => {
    expect(d.map((o) => o.daOn)).toEqual([false, false, false, false, true, true, true])
  })

  it('nhãn thứ ngắn', () => {
    expect(d.map((o) => o.thu)).toEqual(['T7', 'CN', 'T2', 'T3', 'T4', 'T5', 'T6'])
  })
})

describe('gomKhuVuon', () => {
  it('luôn đủ 6 stage kể cả 0 từ, đúng thứ tự (chốt M6b/Q2)', () => {
    const v = gomKhuVuon([{ stage: 'stage1' }, { stage: 'stage1' }, { stage: 'mastered' }])
    expect(v.map((x) => x.stage)).toEqual(['new', 'stage1', 'stage2', 'stage3', 'intensive', 'mastered'])
    expect(v.map((x) => x.so)).toEqual([0, 2, 0, 0, 0, 1])
  })

  it('bỏ qua stage lạ, không ném lỗi', () => {
    expect(gomKhuVuon([{ stage: 'linh_tinh' }]).reduce((s, x) => s + x.so, 0)).toBe(0)
  })
})

describe('demDenHan', () => {
  it('tách đúng hạn / quá hạn, bỏ qua NULL (hàng đợi từ mới)', () => {
    const r = demDenHan(
      [
        { next_review_date: '2026-09-18' },
        { next_review_date: '2026-09-15' },
        { next_review_date: '2026-09-17' },
        { next_review_date: null },
      ],
      '2026-09-18',
    )
    expect(r).toEqual({ dungHan: 1, quaHan: 2, tong: 3 })
  })
})

describe('ngayCoOn', () => {
  it('quy timestamptz về ngày GIỜ VIỆT NAM', () => {
    // 2026-09-17T17:30Z = 00:30 ngày 18/9 giờ VN → phải tính là ngày 18
    const s = ngayCoOn([{ reviewed_at: '2026-09-17T17:30:00Z' }, { reviewed_at: '2026-09-17T10:00:00Z' }])
    expect([...s].sort()).toEqual(['2026-09-17', '2026-09-18'])
  })
})

describe('kỷ luật module', () => {
  it('dashboard.ts là module thuần — không import react/supabase/node', () => {
    const src = readFileSync(new URL('./dashboard.ts', import.meta.url), 'utf8')
    expect(src).not.toMatch(/from '(react|node:|@supabase)/)
    expect(src).not.toMatch(/\.\/supabase\.ts/)
  })
})
