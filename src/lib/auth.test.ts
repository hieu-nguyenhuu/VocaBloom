/**
 * Test cho auth.ts — logic Đăng nhập thuần (DESIGN.md §2).
 * Câu chữ hiện cho người dùng được assert nguyên văn: đây là "giao diện" của hàm.
 */
import { describe, expect, it } from 'vitest'
import { dichLoiDangNhap, kiemTraFormDangNhap } from './auth.ts'

describe('kiemTraFormDangNhap', () => {
  it('email rỗng → báo nhập email', () => {
    expect(kiemTraFormDangNhap('   ', 'abc')).toEqual({ ok: false, loi: 'Nhập email nhé.' })
  })
  it('email sai định dạng → báo định dạng', () => {
    expect(kiemTraFormDangNhap('abc', 'x')).toEqual({ ok: false, loi: 'Email chưa đúng định dạng.' })
  })
  it('mật khẩu rỗng → báo nhập mật khẩu', () => {
    expect(kiemTraFormDangNhap('a@b.co', '')).toEqual({ ok: false, loi: 'Nhập mật khẩu nhé.' })
  })
  it('hợp lệ (email có khoảng trắng thừa vẫn ok) → ok', () => {
    expect(kiemTraFormDangNhap(' a@b.co ', 'x')).toEqual({ ok: true })
  })
})

describe('dichLoiDangNhap', () => {
  it('sai thông tin → 1 câu chung, không lộ sai email hay mật khẩu', () => {
    expect(dichLoiDangNhap({ message: 'Invalid login credentials', status: 400 })).toBe(
      'Email hoặc mật khẩu chưa đúng. Thử lại nhé.',
    )
  })
  it('429 → báo đợi', () => {
    expect(dichLoiDangNhap({ message: 'Request rate limit reached', status: 429 })).toBe(
      'Thử quá nhiều lần rồi, đợi vài phút rồi thử lại nhé.',
    )
  })
  it('lỗi mạng → báo kiểm tra mạng', () => {
    expect(dichLoiDangNhap({ message: 'TypeError: Failed to fetch' })).toBe(
      'Không kết nối được. Kiểm tra mạng rồi thử lại nhé.',
    )
  })
  it('không rõ → câu chung', () => {
    expect(dichLoiDangNhap(null)).toBe('Có lỗi khi đăng nhập. Thử lại sau nhé.')
    expect(dichLoiDangNhap({ message: 'Something odd' })).toBe('Có lỗi khi đăng nhập. Thử lại sau nhé.')
  })
})

describe('X-auth — giữ tính thuần (như X1c của srs.ts)', () => {
  it('auth.ts không có dòng import nào', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync('src/lib/auth.ts', 'utf8')
    expect(src).not.toMatch(/^\s*import\s/m)
  })
})
