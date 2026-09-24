/**
 * Test cho giaoDien.ts — chọn giao diện Sáng / Tối / Hệ thống (M16).
 *
 * Ca đáng giá nhất là X-giaodien: script inline trong `index.html` chạy TRƯỚC khi JS của app tải
 * (để không nháy màu), nên KHÔNG import được giaoDien.ts ⇒ buộc phải lặp lại tên khoá và phép ánh xạ.
 * Cùng một sự thật ở 2 nơi. Đổi tên khoá ở một nơi mà quên nơi kia thì lựa chọn của người dùng
 * âm thầm mất mỗi lần tải lại trang — không có gì báo lỗi.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { docCheDo, KHOA_LUU, thuocTinhTheme } from './giaoDien.ts'

describe('docCheDo', () => {
  it('G1 — 3 giá trị hợp lệ đọc đúng', () => {
    expect(docCheDo('sang')).toBe('sang')
    expect(docCheDo('toi')).toBe('toi')
    expect(docCheDo('he_thong')).toBe('he_thong')
  })

  it('G2 — chưa từng chọn (null) ⇒ theo hệ thống', () => {
    expect(docCheDo(null)).toBe('he_thong')
  })

  it('G3 — giá trị rác ⇒ theo hệ thống, không ném', () => {
    for (const rac of ['', 'dark', 'light', 'SANG', ' toi ', 'undefined']) {
      expect(docCheDo(rac), JSON.stringify(rac)).toBe('he_thong')
    }
  })
})

describe('thuocTinhTheme', () => {
  it('G4 — Sáng ⇒ "light" (chặn nhánh tối-theo-OS), Tối ⇒ "dark" (nhánh ép thủ công)', () => {
    expect(thuocTinhTheme('sang')).toBe('light')
    expect(thuocTinhTheme('toi')).toBe('dark')
  })

  it('G5 — Hệ thống ⇒ null nghĩa là GỠ thuộc tính để CSS tự theo OS', () => {
    expect(thuocTinhTheme('he_thong')).toBeNull()
  })
})

describe('X-giaodien — chống lệch giữa index.html và giaoDien.ts', () => {
  const html = readFileSync('index.html', 'utf8')

  it('X1 — script inline dùng ĐÚNG tên khoá localStorage', () => {
    expect(html).toContain(`'${KHOA_LUU}'`)
  })

  it('X2 — script inline ánh xạ khớp thuocTinhTheme', () => {
    // Dạng trong index.html: if (c === 'sang') ... = 'light'
    expect(html).toMatch(new RegExp(`'sang'\\)[^\\n]*'${thuocTinhTheme('sang')}'`))
    expect(html).toMatch(new RegExp(`'toi'\\)[^\\n]*'${thuocTinhTheme('toi')}'`))
  })

  it('X3 — script inline bọc try/catch (localStorage có thể ném ở chế độ ẩn danh)', () => {
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''
    expect(script).toContain(KHOA_LUU)
    expect(script).toMatch(/try\s*\{/)
    expect(script).toMatch(/catch/)
  })

  it('X4 — giaoDien.ts giữ tính thuần: không import react / supabase / node:', () => {
    const src = readFileSync('src/lib/giaoDien.ts', 'utf8')
    expect(src).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
