/**
 * TDD cho ĐÓNG BĂNG LỊCH ÔN (M33, design.m33.md). DB1–DB10.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { moTaDongBang, ngayDongBang, ngayHieuLuc, soNgayDongBang } from './dongBang.ts'

describe('ngayDongBang', () => {
  it('DB1 — null ⇒ null (không đóng băng)', () => {
    expect(ngayDongBang(null)).toBeNull()
  })
  it('DB2 — mốc 23:30 UTC = ngày VN hôm SAU (bẫy múi giờ)', () => {
    expect(ngayDongBang('2026-10-20T23:30:00Z')).toBe('2026-10-21')
    expect(ngayDongBang('2026-10-21T03:00:00+00:00')).toBe('2026-10-21')
  })
  it('DB3 — chuỗi hỏng ⇒ null (coi như không đóng băng, không vỡ màn)', () => {
    expect(ngayDongBang('linh tinh')).toBeNull()
  })
})

describe('ngayHieuLuc', () => {
  it('DB4 — không đóng băng ⇒ hôm nay', () => {
    expect(ngayHieuLuc('2026-10-24', null)).toBe('2026-10-24')
  })
  it('DB5 — đóng băng từ ngày F trước đó ⇒ F; đóng băng trong hôm nay ⇒ hôm nay', () => {
    expect(ngayHieuLuc('2026-10-24', '2026-10-21T03:00:00Z')).toBe('2026-10-21')
    expect(ngayHieuLuc('2026-10-21', '2026-10-21T03:00:00Z')).toBe('2026-10-21')
  })
})

describe('soNgayDongBang', () => {
  it('DB6 — số ngày VN giữa F và hôm nay; không đóng băng ⇒ 0', () => {
    expect(soNgayDongBang('2026-10-31', '2026-10-21T03:00:00Z')).toBe(10)
    expect(soNgayDongBang('2026-10-21', '2026-10-21T03:00:00Z')).toBe(0)
    expect(soNgayDongBang('2026-11-02', '2026-10-30T03:00:00Z')).toBe(3)
    expect(soNgayDongBang('2026-10-31', null)).toBe(0)
  })
  it('DB7 — dongBang.ts thuần: không import react / supabase / node:', () => {
    expect(readFileSync('src/lib/dongBang.ts', 'utf8')).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})

describe('moTaDongBang (dòng ghi chú ở Cài đặt)', () => {
  it('DB8 — không đóng băng ⇒ câu hướng dẫn khi nào nên tắt', () => {
    expect(moTaDongBang('2026-10-24', null)).toBe('Tắt khi từ quá hạn dồn nhiều: chỉ còn từ tồn đọng, không thêm từ mới, không trừ điểm.')
  })
  it('DB9 — đóng băng N ngày ⇒ nêu ngày F (dd/mm) và số ngày sẽ dời', () => {
    expect(moTaDongBang('2026-10-24', '2026-10-21T03:00:00Z')).toBe('Đang đóng băng từ 21/10 (3 ngày). Bật lại: từ bị giữ sẽ dời hạn thêm 3 ngày.')
  })
  it('DB10 — đóng băng trong hôm nay ⇒ bật lại không dời hạn', () => {
    expect(moTaDongBang('2026-10-21', '2026-10-21T03:00:00Z')).toBe('Đang đóng băng từ hôm nay (21/10). Bật lại trong hôm nay thì không dời hạn từ nào.')
  })
})
