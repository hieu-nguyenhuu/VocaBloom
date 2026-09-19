import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  boDau,
  canXoaAudio,
  docThayDoi,
  kiemTraFormTu,
  locTu,
  nhanTu,
  type DongTu,
} from './tuVung.ts'

const tu = (p: Partial<DongTu>): DongTu => ({
  id: 'x', word: '苹果', pinyin: 'píngguǒ', meaning_vi: 'quả táo', lang: 'zh',
  collocation: null, collocation_pinyin: null, collocation_meaning_vi: null,
  example_sentence: null, example_meaning_vi: null, audio_url: null, ...p,
})
const DS = [
  tu({ id: '1', word: '苹果', pinyin: 'píngguǒ', meaning_vi: 'quả táo' }),
  tu({ id: '2', word: '香蕉', pinyin: 'xiāngjiāo', meaning_vi: 'quả chuối' }),
  tu({ id: '3', word: 'teacher', pinyin: null, meaning_vi: 'giáo viên', lang: 'en' }),
]

describe('boDau', () => {
  it('bỏ dấu tiếng Việt và hạ chữ thường', () => {
    expect(boDau('Quả Táo')).toBe('qua tao')
    expect(boDau('Đường')).toBe('duong')
  })

  it('bỏ dấu thanh của pinyin', () => {
    expect(boDau('píngguǒ')).toBe('pingguo')
  })
})

describe('locTu', () => {
  it('từ khoá rỗng → nguyên danh sách', () => {
    expect(locTu(DS, '   ')).toHaveLength(3)
  })

  it('gõ không dấu vẫn tìm ra nghĩa tiếng Việt', () => {
    expect(locTu(DS, 'qua tao').map((t) => t.id)).toEqual(['1'])
  })

  it('gõ pinyin không dấu, không phân biệt hoa thường', () => {
    expect(locTu(DS, 'PINGGUO').map((t) => t.id)).toEqual(['1'])
  })

  it('tìm theo chữ Hán', () => {
    expect(locTu(DS, '香蕉').map((t) => t.id)).toEqual(['2'])
  })

  it('từ tiếng Anh (pinyin null) không làm vỡ bộ lọc', () => {
    expect(locTu(DS, 'teach').map((t) => t.id)).toEqual(['3'])
    expect(locTu(DS, 'giao vien').map((t) => t.id)).toEqual(['3'])
  })

  it('không khớp → rỗng', () => {
    expect(locTu(DS, 'zzz')).toEqual([])
  })
})

describe('nhanTu', () => {
  it('nhãn đổi theo ngôn ngữ (đang có 2 từ tiếng Anh trong DB)', () => {
    expect(nhanTu('zh')).toBe('Từ (Hán tự)')
    expect(nhanTu('en')).toBe('Từ (tiếng Anh)')
  })
})

describe('kiemTraFormTu', () => {
  it('hợp lệ → null', () => {
    expect(kiemTraFormTu({ word: '苹果', meaning_vi: 'quả táo' })).toBeNull()
  })

  it('thiếu từ hoặc nghĩa → báo lỗi', () => {
    expect(kiemTraFormTu({ word: '  ', meaning_vi: 'quả táo' })).toBe('Chưa nhập từ')
    expect(kiemTraFormTu({ word: '苹果', meaning_vi: '' })).toBe('Chưa nhập nghĩa tiếng Việt')
  })
})

describe('canXoaAudio', () => {
  it('đổi chữ → phải xoá audio_url (file cũ đọc chữ CŨ — M6c đặt tên theo hash(word))', () => {
    expect(canXoaAudio('苹果', '蘋果')).toBe(true)
  })

  it('không đổi (kể cả thừa khoảng trắng) → giữ nguyên audio', () => {
    expect(canXoaAudio('苹果', '苹果')).toBe(false)
    expect(canXoaAudio('苹果', ' 苹果 ')).toBe(false)
  })
})

describe('docThayDoi', () => {
  const cu = tu({ pinyin: 'píngguǒ', collocation: '一个苹果' })

  it('chỉ trả field THỰC SỰ đổi', () => {
    expect(docThayDoi(cu, { ...cu, pinyin: 'ping guo' })).toEqual({ pinyin: 'ping guo' })
  })

  it('không đổi gì → object rỗng (không gửi request thừa)', () => {
    expect(docThayDoi(cu, { ...cu })).toEqual({})
  })

  it('ô trống → ghi null, KHÔNG ghi chuỗi rỗng', () => {
    expect(docThayDoi(cu, { ...cu, collocation: '' })).toEqual({ collocation: null })
  })

  it('bỏ khoảng trắng thừa trước khi so sánh và lưu', () => {
    expect(docThayDoi(cu, { ...cu, meaning_vi: '  quả táo  ' })).toEqual({})
    expect(docThayDoi(cu, { ...cu, meaning_vi: ' trái táo ' })).toEqual({ meaning_vi: 'trái táo' })
  })

  it('KHÔNG đụng tới field ngoài 8 field cơ bản', () => {
    expect(docThayDoi(cu, { ...cu, id: 'khac', lang: 'en' })).toEqual({})
  })
})

describe('kỷ luật module', () => {
  it('tuVung.ts là module thuần — không import react/supabase/node', () => {
    const src = readFileSync(new URL('./tuVung.ts', import.meta.url), 'utf8')
    expect(src).not.toMatch(/from '(react|node:|@supabase)/)
    expect(src).not.toMatch(/\.\/supabase\.ts/)
  })
})
