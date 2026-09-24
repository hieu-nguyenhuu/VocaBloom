/**
 * Test cho lichSu.ts — ruby tích luỹ + lưới lịch tháng (M15).
 *
 * Ca đáng giá nhất là X-ruby: công thức ruby BẮT BUỘC tồn tại ở 2 nơi (SQL tính tổng vì màn Lịch sử
 * lazy-load nên client không có đủ dữ liệu; TS hiện ruby từng ngày mà không cần gọi server).
 * Cùng một sự thật ở 2 nơi là thứ đã đẻ ra bug ở dự án này ⇒ phải có test đọc cả 2 rồi so khớp.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  canTroVa,
  luoiThang,
  PHUT_MOI_RUBY,
  RUBY_DE_VA,
  rubyCuaNgay,
  tenThang,
  thangTruoc,
  TRAN_RUBY_NGAY,
  type ONgayLich,
} from './lichSu.ts'

describe('rubyCuaNgay', () => {
  it('R1 — chưa đủ 5 phút thì chưa có ruby', () => {
    expect(rubyCuaNgay(0)).toBe(0)
    expect(rubyCuaNgay(4)).toBe(0)
  })

  it('R2 — mỗi 5 phút được 1 ruby, phần lẻ không tính', () => {
    expect(rubyCuaNgay(5)).toBe(1)
    expect(rubyCuaNgay(9)).toBe(1)
    expect(rubyCuaNgay(10)).toBe(2)
    expect(rubyCuaNgay(27)).toBe(5)
  })

  it('R3 — TRẦN 12 ruby/ngày: 60 phút chạm trần, 180 phút vẫn là 12', () => {
    expect(rubyCuaNgay(60)).toBe(12)
    expect(rubyCuaNgay(180)).toBe(12)
  })

  it('R4 — đầu vào rác không làm vỡ', () => {
    expect(rubyCuaNgay(-5)).toBe(0)
    expect(rubyCuaNgay(Number.NaN)).toBe(0)
  })
})

describe('luoiThang', () => {
  const ngay = (d: string, ms: number, da_va = false) => ({ ngay: d, thoi_gian_ms: ms, da_va })
  const oCua = (luoi: ONgayLich[], d: string) => luoi.find((o) => o.ngay === d)

  it('L1 — ô đệm đầu tháng để THỨ 2 luôn ở cột đầu', () => {
    // 1/9/2026 là thứ Ba ⇒ đúng 1 ô đệm trước nó
    const luoi = luoiThang('2026-09', [], '2026-09-24')
    expect(luoi[0]?.ngay).toBeNull()
    expect(luoi[1]?.ngay).toBe('2026-09-01')
    expect(luoi.filter((o) => o.ngay === null).length).toBe(1)
  })

  it('L2 — đủ số ngày của tháng 30 và 31 ngày', () => {
    expect(luoiThang('2026-09', [], '2026-09-24').filter((o) => o.ngay).length).toBe(30)
    expect(luoiThang('2026-10', [], '2026-10-24').filter((o) => o.ngay).length).toBe(31)
  })

  it('L3 — tháng 2 năm thường có 28 ngày', () => {
    expect(luoiThang('2026-02', [], '2026-03-01').filter((o) => o.ngay).length).toBe(28)
  })

  it('L4 — ngày sau hôm nay là tương lai, hôm nay được đánh dấu', () => {
    const luoi = luoiThang('2026-09', [], '2026-09-24')
    expect(oCua(luoi, '2026-09-24')?.laHomNay).toBe(true)
    expect(oCua(luoi, '2026-09-25')?.laTuongLai).toBe(true)
    expect(oCua(luoi, '2026-09-23')?.laTuongLai).toBe(false)
  })

  it('L5 — ngày có học ra đúng số phút; ngày đã vá giữ daVa và 0 phút', () => {
    const luoi = luoiThang(
      '2026-09',
      [ngay('2026-09-10', 1_620_000), ngay('2026-09-11', 0, true)],
      '2026-09-24',
    )
    expect(oCua(luoi, '2026-09-10')?.phut).toBe(27)
    expect(oCua(luoi, '2026-09-10')?.daVa).toBe(false)
    expect(oCua(luoi, '2026-09-11')?.daVa).toBe(true)
    expect(oCua(luoi, '2026-09-11')?.phut).toBe(0)
    expect(oCua(luoi, '2026-09-12')?.phut).toBe(0)
  })
})

describe('canTroVa', () => {
  const o = (p: Partial<ONgayLich> = {}): ONgayLich => ({
    ngay: '2026-09-10', soNgay: 10, phut: 0, daVa: false, laHomNay: false, laTuongLai: false, ...p,
  })

  it('C1 — ô đệm không vá được', () => {
    expect(canTroVa(o({ ngay: null }), 100)).not.toBeNull()
  })

  it('C2 — hôm nay và ngày tương lai đều không vá được', () => {
    expect(canTroVa(o({ laHomNay: true }), 100)).toBe('Chỉ vá được ngày trong quá khứ')
    expect(canTroVa(o({ laTuongLai: true }), 100)).toBe('Chỉ vá được ngày trong quá khứ')
  })

  it('C3 — ngày đã học hoặc đã vá thì không cần vá nữa', () => {
    expect(canTroVa(o({ phut: 12 }), 100)).toContain('đã học')
    expect(canTroVa(o({ daVa: true }), 100)).toContain('đã được vá')
  })

  it('C4 — thiếu ruby thì nêu rõ còn bao nhiêu', () => {
    expect(canTroVa(o(), 4)).toBe('Cần 5 ruby, bạn còn 4')
  })

  it('C5 — đủ điều kiện thì trả null', () => {
    expect(canTroVa(o(), 5)).toBeNull()
  })
})

describe('tenThang / thangTruoc', () => {
  it('T1 — nhãn tháng và lùi tháng, có nhảy năm', () => {
    expect(tenThang('2026-09')).toBe('Tháng 9/2026')
    expect(thangTruoc('2026-09')).toBe('2026-08')
    expect(thangTruoc('2026-01')).toBe('2025-12')
  })
})

describe('X-ruby — chống lệch giữa SQL và TypeScript', () => {
  it('X1 — hằng số trong lichSu.ts khớp công thức trong 0015_ruby_va_ngay.sql', () => {
    const sql = readFileSync('supabase/migrations/0015_ruby_va_ngay.sql', 'utf8')
    // least(floor(ceil(thoi_gian_ms / 60000.0) / 5), 12)
    expect(sql).toContain(`/ ${PHUT_MOI_RUBY}), ${TRAN_RUBY_NGAY})`)
    // 5 * count(*) filter (where da_va)
    expect(sql).toContain(`${RUBY_DE_VA} * count(*) filter (where da_va)`)
  })

  it('X2 — lichSu.ts giữ tính thuần: không import react / supabase / node:', () => {
    const src = readFileSync('src/lib/lichSu.ts', 'utf8')
    expect(src).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
