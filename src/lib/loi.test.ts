/**
 * Test cho loi.ts — dịch lỗi tải/ghi dữ liệu (M19, DESIGN.md §B3).
 * Câu chữ hiện cho người dùng là "giao diện" của hàm nên assert qua hằng số xuất ra.
 */
import { describe, expect, it } from 'vitest'
import { dichLoiTai, LOI_CHUNG, LOI_HET_PHIEN, LOI_MANG, LOI_QUYEN } from './loi.ts'

describe('dichLoiTai', () => {
  it('L1 mất mạng — thông điệp của Chrome / Firefox / Safari / Node', () => {
    for (const m of ['TypeError: Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed', 'fetch failed'])
      expect(dichLoiTai({ message: m })).toBe(LOI_MANG)
  })
  it('L2 nhận cả Error thật lẫn chuỗi trần (state các màn đang lưu error.message)', () => {
    expect(dichLoiTai(new TypeError('Failed to fetch'))).toBe(LOI_MANG)
    expect(dichLoiTai('Failed to fetch')).toBe(LOI_MANG)
  })
  it('L3 hết phiên — JWT expired / PGRST301 / 401', () => {
    expect(dichLoiTai('JWT expired')).toBe(LOI_HET_PHIEN)
    expect(dichLoiTai({ message: 'x', code: 'PGRST301' })).toBe(LOI_HET_PHIEN)
    expect(dichLoiTai({ message: 'Unauthorized', status: 401 })).toBe(LOI_HET_PHIEN)
  })
  it('L4 không có quyền — 42501 (cả khi chỉ còn message)', () => {
    expect(dichLoiTai({ message: 'x', code: '42501' })).toBe(LOI_QUYEN)
    expect(dichLoiTai('permission denied for table topics')).toBe(LOI_QUYEN)
  })
  it('L5 lỗi tiếng Việt từ raise exception → giữ NGUYÊN VĂN', () => {
    const m = 'Không đủ ruby để vá ngày này'
    expect(dichLoiTai({ message: m, code: 'P0001' })).toBe(m)
  })
  it('L6 rỗng / null / kiểu lạ → câu chung, KHÔNG ném', () => {
    for (const x of [null, undefined, '', {}, { message: '   ' }, 42]) expect(dichLoiTai(x)).toBe(LOI_CHUNG)
  })
})
