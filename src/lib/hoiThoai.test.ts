import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { chiaDam, docHoiThoai } from './hoiThoai.ts'

const TEN_TU = { a1: '苹果', a2: '好吃', e1: 'teacher' }

describe('docHoiThoai', () => {
  // Hình dạng THẬT trong DB (topic_dialogues.content)
  const content = {
    lines: [
      { speaker: 'A', text_zh: '你今天吃苹果了吗？', pinyin: 'nǐ jīntiān chī píngguǒ le ma?', text_vi: 'Hôm nay bạn ăn táo chưa?', highlight_vocab_ids: ['a1'] },
      { speaker: 'B', text_zh: '吃了，很好吃。', pinyin: 'chī le, hěn hǎochī.', text_vi: 'Ăn rồi, ngon lắm.', highlight_vocab_ids: [] },
    ],
  }

  it('đọc đủ dòng, ánh xạ id → chữ của từ', () => {
    const d = docHoiThoai(content, TEN_TU)
    expect(d).toHaveLength(2)
    expect(d[0]).toEqual({
      speaker: 'A',
      text: '你今天吃苹果了吗？',
      pinyin: 'nǐ jīntiān chī píngguǒ le ma?',
      nghia: 'Hôm nay bạn ăn táo chưa?',
      tu_dam: ['苹果'],
    })
  })

  it('highlight_vocab_ids rỗng → không có từ đậm', () => {
    expect(docHoiThoai(content, TEN_TU)[1]!.tu_dam).toEqual([])
  })

  it('id không còn trong bảng vocab (từ đã xoá) → bỏ qua, không văng lỗi', () => {
    const c = { lines: [{ speaker: 'A', text_zh: 'x', pinyin: '', text_vi: '', highlight_vocab_ids: ['mat-tieu'] }] }
    expect(docHoiThoai(c, TEN_TU)[0]!.tu_dam).toEqual([])
  })

  it('topic tiếng Anh: pinyin rỗng vẫn đọc được', () => {
    const c = { lines: [{ speaker: 'A', text_zh: 'I want to be a teacher.', pinyin: '', text_vi: 'Tôi muốn làm giáo viên.', highlight_vocab_ids: ['e1'] }] }
    expect(docHoiThoai(c, TEN_TU)[0]!.pinyin).toBe('')
  })

  it('content hỏng / thiếu lines → mảng rỗng, không ném lỗi', () => {
    expect(docHoiThoai(null, TEN_TU)).toEqual([])
    expect(docHoiThoai({}, TEN_TU)).toEqual([])
    expect(docHoiThoai({ lines: 'x' }, TEN_TU)).toEqual([])
  })
})

describe('chiaDam', () => {
  it('bôi đậm đúng đoạn từ vựng', () => {
    expect(chiaDam('你今天吃苹果了吗？', ['苹果'])).toEqual([
      { text: '你今天吃', dam: false },
      { text: '苹果', dam: true },
      { text: '了吗？', dam: false },
    ])
  })

  it('từ xuất hiện 2 lần → bôi cả 2', () => {
    expect(chiaDam('苹果和苹果', ['苹果']).filter((p) => p.dam)).toHaveLength(2)
  })

  it('không có từ nào → trả nguyên câu', () => {
    expect(chiaDam('今天天气怎么样？', ['苹果'])).toEqual([{ text: '今天天气怎么样？', dam: false }])
  })

  it('danh sách từ rỗng → trả nguyên câu', () => {
    expect(chiaDam('abc', [])).toEqual([{ text: 'abc', dam: false }])
  })

  it('từ dài được ưu tiên, không bôi lồng nhau', () => {
    expect(chiaDam('好吃的东西', ['好吃', '吃'])).toEqual([
      { text: '好吃', dam: true },
      { text: '的东西', dam: false },
    ])
  })

  it('tiếng Anh: KHÔNG bôi giữa chữ (teach trong teacher)', () => {
    expect(chiaDam('I am a teacher.', ['teach'])).toEqual([{ text: 'I am a teacher.', dam: false }])
    expect(chiaDam('I am a teacher.', ['teacher'])).toEqual([
      { text: 'I am a ', dam: false },
      { text: 'teacher', dam: true },
      { text: '.', dam: false },
    ])
  })
})

describe('kỷ luật module', () => {
  it('hoiThoai.ts là module thuần — không import react/supabase/node', () => {
    const src = readFileSync(new URL('./hoiThoai.ts', import.meta.url), 'utf8')
    expect(src).not.toMatch(/from '(react|node:|@supabase)/)
    expect(src).not.toMatch(/\.\/supabase\.ts/)
  })
})
