import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  dai7Ngay,
  demDenHan,
  gioVN,
  gomKhuVuon,
  gopNhatKy,
  loiChao,
  luiNgay,
  ngayCoOn,
  gomPhutMoiNgay,
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

// ── M9: thời gian học + nhãn ngày ───────────────────────────────────────────
describe('gomPhutMoiNgay', () => {
  it('cộng theo ngày GIỜ VN, bỏ qua dòng cũ chưa đo (null)', () => {
    const m = gomPhutMoiNgay([
      { reviewed_at: '2026-09-18T03:00:00Z', thoi_gian_ms: 60_000 },
      { reviewed_at: '2026-09-18T03:05:00Z', thoi_gian_ms: 90_000 },
      { reviewed_at: '2026-09-18T03:06:00Z', thoi_gian_ms: null },
      { reviewed_at: '2026-09-17T17:30:00Z', thoi_gian_ms: 120_000 }, // = 00:30 ngày 18 giờ VN
    ])
    expect(m.get('2026-09-18')).toBe(5) // 60 + 90 + 120 = 270 giây = 4,5 phút → làm tròn LÊN 5
  })

  it('làm tròn LÊN, học ít hơn 1 phút vẫn hiện 1 phút', () => {
    expect(gomPhutMoiNgay([{ reviewed_at: '2026-09-18T03:00:00Z', thoi_gian_ms: 8_000 }]).get('2026-09-18')).toBe(1)
  })

  it('không có dòng nào đo được → không có khoá', () => {
    expect(gomPhutMoiNgay([{ reviewed_at: '2026-09-18T03:00:00Z', thoi_gian_ms: null }]).size).toBe(0)
  })
})

describe('dai7Ngay — nhãn ngày & phút (M9/Q1)', () => {
  const phut = new Map([['2026-09-18', 12]])
  const d = dai7Ngay(new Set(['2026-09-18']), '2026-09-19', phut)

  it('mỗi ô có số ngày dạng d/m', () => {
    expect(d.map((o) => o.ngayThang)).toEqual(['13/9', '14/9', '15/9', '16/9', '17/9', '18/9', '19/9'])
  })

  it('gắn đúng số phút vào đúng ngày, ngày không học = 0', () => {
    expect(d[5]!.phut).toBe(12)
    expect(d[6]!.phut).toBe(0)
  })

  it('vẫn giữ đúng 7 ô và hôm nay ở cuối', () => {
    expect(d).toHaveLength(7)
    expect(d[6]!.laHomNay).toBe(true)
  })
})

/**
 * M14 — gộp NHẬT KÝ NGÀY (bảng `nhat_ky_ngay`, không có FK) với log hôm nay.
 *
 * Vì sao cần gộp: nhật ký chỉ được chốt khi kết thúc lượt, nên phiên ĐANG học dở chưa có trong đó.
 * Không gộp thì vừa ôn xong streak vẫn đứng yên cho tới lúc bấm hết bài.
 */
describe('gopNhatKy (M14)', () => {
  const HOM_NAY = '2026-09-23'
  const log = (ngay: string, ms: number | null) => ({ reviewed_at: `${ngay}T10:00:00+07:00`, thoi_gian_ms: ms })

  it('K1 — chỉ có nhật ký, không có log hôm nay', () => {
    const kq = gopNhatKy(
      [{ ngay: '2026-09-21', thoi_gian_ms: 120_000 }, { ngay: '2026-09-22', thoi_gian_ms: 60_000 }],
      [],
      HOM_NAY,
    )
    expect([...kq.ngayCoHoc].sort()).toEqual(['2026-09-21', '2026-09-22'])
    expect(kq.phutMoiNgay.get('2026-09-21')).toBe(2)
  })

  it('K2 — chỉ có log hôm nay (chưa chốt nhật ký) vẫn tính là ngày CÓ HỌC', () => {
    const kq = gopNhatKy([], [log(HOM_NAY, 90_000)], HOM_NAY)
    expect(kq.ngayCoHoc.has(HOM_NAY)).toBe(true)
    expect(kq.phutMoiNgay.get(HOM_NAY)).toBe(2)
  })

  it('K3 — hôm nay có ở CẢ HAI thì lấy giá trị LỚN HƠN (không cộng dồn)', () => {
    // Nhật ký đã chốt 5 phút ở lượt 1; lượt 2 đang dở mới có 2 phút trong review_log.
    // Cộng dồn sẽ thành 7 — SAI, vì nhật ký vốn đã bao gồm cả lượt 1.
    const kq = gopNhatKy([{ ngay: HOM_NAY, thoi_gian_ms: 300_000 }], [log(HOM_NAY, 120_000)], HOM_NAY)
    expect(kq.phutMoiNgay.get(HOM_NAY)).toBe(5)
  })

  it('K4 — ngày CÓ HỌC nhưng mọi dòng thoi_gian_ms = null vẫn vào streak', () => {
    const kq = gopNhatKy([{ ngay: '2026-09-20', thoi_gian_ms: 0 }], [log(HOM_NAY, null)], HOM_NAY)
    expect(kq.ngayCoHoc.has('2026-09-20')).toBe(true)
    expect(kq.ngayCoHoc.has(HOM_NAY)).toBe(true)
    expect(tinhStreak(kq.ngayCoHoc, HOM_NAY)).toBe(1)
  })

  it('K5 — log của ngày KHÁC hôm nay bị bỏ qua (nhật ký mới là nguồn cho quá khứ)', () => {
    // Đây chính là điểm chống mất dữ liệu: quá khứ đọc từ nhật ký, không đọc từ review_log
    // (review_log có thể đã bị cascade xoá khi người dùng xoá từ).
    const kq = gopNhatKy([], [log('2026-09-19', 600_000)], HOM_NAY)
    expect(kq.ngayCoHoc.has('2026-09-19')).toBe(false)
  })

  it('K6 — rỗng hoàn toàn → không ném, streak 0', () => {
    const kq = gopNhatKy([], [], HOM_NAY)
    expect(kq.ngayCoHoc.size).toBe(0)
    expect(tinhStreak(kq.ngayCoHoc, HOM_NAY)).toBe(0)
  })
})
