import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { deDienTu, hienNghiaPhu, ngonNguPhu, nhanGhepCap, nhanNgonNguPhu, tachNghiaPhu } from './songNgu.ts'

describe('songNgu (M26)', () => {
  it('SL1 — ngôn ngữ phụ suy ra từ ngôn ngữ chính', () => {
    expect(ngonNguPhu('zh')).toBe('en')
    expect(ngonNguPhu('en')).toBe('zh')
  })
  it('SL2 — tách nhiều nghĩa theo dấu ";", bỏ khoảng trắng và mục rỗng', () => {
    expect(tachNghiaPhu('review; revise')).toEqual(['review', 'revise'])
    expect(tachNghiaPhu(' test ;; check ')).toEqual(['test', 'check'])
    expect(tachNghiaPhu(null)).toEqual([])
    expect(tachNghiaPhu('')).toEqual([])
  })
  it('SL3 — hiển thị gọn bằng " · "', () => {
    expect(hienNghiaPhu('review; revise')).toBe('review · revise')
    expect(hienNghiaPhu(null)).toBe('')
  })
  it('SL4 — nhãn chip: từ chính zh ⇒ EN, từ chính en ⇒ 中', () => {
    expect(nhanNgonNguPhu('zh')).toBe('EN')
    expect(nhanNgonNguPhu('en')).toBe('中')
  })
  it('SL5 — giữ tính thuần: không import gì', () => {
    expect(readFileSync('src/lib/songNgu.ts', 'utf8')).not.toMatch(/^import /m)
  })
})

describe('nhanGhepCap (M26c)', () => {
  const tu = (id: string, vi: string, sw: string | null) => ({ id, meaning_vi: vi, secondary_word: sw })
  it('NG1 — nhãn = nghĩa ĐẦU của từ phụ', () => {
    expect(nhanGhepCap([tu('a', 'ôn tập', 'review; revise')])).toEqual({ a: 'review' })
  })
  it('NG2 — thiếu từ phụ ⇒ nghĩa Việt', () => {
    expect(nhanGhepCap([tu('a', 'ôn tập', null), tu('b', 'kiểm thử', '  ')])).toEqual({ a: 'ôn tập', b: 'kiểm thử' })
  })
  it('NG3 — trùng nhãn Anh ⇒ CHỈ ô trùng thêm (nghĩa Việt)', () => {
    expect(nhanGhepCap([tu('a', 'kiểm thử', 'test; check'), tu('b', 'đo kiểm', 'test; inspect'), tu('c', 'ôn tập', 'review')]))
      .toEqual({ a: 'test (kiểm thử)', b: 'test (đo kiểm)', c: 'review' })
  })
  it('NG4 — so trùng không phân biệt hoa/thường', () => {
    expect(nhanGhepCap([tu('a', 'x', 'Test'), tu('b', 'y', 'test')])).toEqual({ a: 'Test (x)', b: 'test (y)' })
  })
  it('NG5 — trùng cả Anh lẫn Việt ⇒ 2 nhãn giống hệt (Ghép cặp chấp nhận cả 2 vì so theo nhãn)', () => {
    const n = nhanGhepCap([tu('a', 'kiểm tra', 'check'), tu('b', 'kiểm tra', 'check')])
    expect(n['a']).toBe(n['b'])
  })
})

describe('deDienTu (M26c)', () => {
  const v = {
    lang: 'zh' as const, meaning_vi: 'ôn tập', secondary_word: 'review; revise',
    collocation_meaning_vi: 'ôn bài khoá', secondary_collocation: 'review the lesson',
  }
  it('DT1 — translate có từ phụ: đề tiếng Anh, dòng nhỏ nghĩa Việt', () => {
    expect(deDienTu('translate', v)).toEqual({ chinh: 'review · revise', langChinh: 'en', nho: 'ôn tập · Nhập từ tiếng Trung' })
  })
  it('DT2 — translate thiếu từ phụ ⇒ bản cũ', () => {
    expect(deDienTu('translate', { ...v, secondary_word: null })).toEqual({ chinh: 'ôn tập', langChinh: 'vi', nho: 'Nhập từ tiếng Trung' })
  })
  it('DT3 — trans_collocation có cụm phụ', () => {
    expect(deDienTu('trans_collocation', v)).toEqual({ chinh: 'review the lesson', langChinh: 'en', nho: 'ôn bài khoá · Nhập cụm từ' })
  })
  it('DT4 — trans_collocation thiếu cụm phụ ⇒ bản cũ; thiếu nghĩa cụm ⇒ nghĩa từ', () => {
    expect(deDienTu('trans_collocation', { ...v, secondary_collocation: null, collocation_meaning_vi: null }))
      .toEqual({ chinh: 'ôn tập', langChinh: 'vi', nho: 'Nhập cụm từ' })
  })
})
