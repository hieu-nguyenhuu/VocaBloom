/**
 * Test cho boSungHoiThoai.ts — M23: thêm select_dialog/fill_dialog vào chủ đề ĐÃ CÓ trong DB.
 */
import { describe, expect, it } from 'vitest'
import { dichBaiBoSung, phuSongHoiThoai, type BaiHoiThoai, type TuChuDe } from './boSungHoiThoai.ts'

const TU: TuChuDe[] = [
  { id: 'id-a', word: '累' },
  { id: 'id-b', word: '休息' },
  { id: 'id-c', word: '检查' },
]

function bai(ghiDe: Record<string, unknown> = {}, payload: Record<string, unknown> = {}) {
  return {
    type: 'select_dialog',
    vocab_word: '累',
    ...ghiDe,
    payload: {
      dialog_a: '你看起来很___，怎么了？', dialog_a_pinyin: 'nǐ kàn qǐlái hěn ___, zěnme le?',
      dialog_b: '我想早点___。', dialog_b_pinyin: 'wǒ xiǎng zǎodiǎn ___.',
      blank_a_answer: '累', blank_b_word: '休息',
      distractors: [{ word: '西瓜', pinyin: 'xīguā' }, { word: '地铁', pinyin: 'dìtiě' }],
      ...payload,
    },
  }
}

const file = (...ds: unknown[]) => ({ topic_name: '3. Mệt mỏi', exercises: ds })

describe('dichBaiBoSung (M23)', () => {
  it('BS1 — dịch vocab_word/blank_b_word sang uuid, payload không còn blank_b_word', () => {
    const kq = dichBaiBoSung(file(bai()), TU, [])
    expect(kq.loi).toEqual([])
    expect(kq.dong).toHaveLength(1)
    const d = kq.dong[0]!
    expect(d.vocab_id).toBe('id-a')
    expect(d.type).toBe('select_dialog')
    expect(d.payload['blank_b_vocab_id']).toBe('id-b')
    expect('blank_b_word' in d.payload).toBe(false)
  })

  it('BS2 — từ không thuộc chủ đề ⇒ lỗi', () => {
    expect(dichBaiBoSung(file(bai({ vocab_word: '西瓜' })), TU, []).loi.length).toBeGreaterThan(0)
    expect(dichBaiBoSung(file(bai({}, { blank_b_word: '西瓜' })), TU, []).loi.length).toBeGreaterThan(0)
  })

  it('BS3 — A = B ⇒ lỗi', () => {
    expect(dichBaiBoSung(file(bai({}, { blank_b_word: '累' })), TU, []).loi.length).toBeGreaterThan(0)
  })

  it('BS4 — payload sai shape (distractors 1 phần tử) ⇒ lỗi từ kiemPayload', () => {
    const kq = dichBaiBoSung(file(bai({}, { distractors: [{ word: '西瓜', pinyin: 'xīguā' }] })), TU, [])
    expect(kq.loi.some((l) => l.duong_dan.endsWith('payload.distractors'))).toBe(true)
  })

  it('BS5 — câu có 2 chỗ trống ⇒ lỗi', () => {
    expect(dichBaiBoSung(file(bai({}, { dialog_a: '___很___' })), TU, []).loi.length).toBeGreaterThan(0)
  })

  it('BS6 — blank_a_answer ≠ vocab_word ⇒ lỗi', () => {
    expect(dichBaiBoSung(file(bai({}, { blank_a_answer: '检查' })), TU, []).loi.length).toBeGreaterThan(0)
  })

  it('BS7 — bài trùng với DB hoặc trùng trong file ⇒ bo_qua, không vào dong (chạy lại an toàn)', () => {
    const daCo: BaiHoiThoai[] = [{
      vocab_id: 'id-a', type: 'select_dialog',
      payload: { dialog_a: '你看起来很___，怎么了？', blank_b_vocab_id: 'id-b' },
    }]
    const kqDb = dichBaiBoSung(file(bai()), TU, daCo)
    expect(kqDb.dong).toEqual([])
    expect(kqDb.bo_qua).toHaveLength(1)
    const kqFile = dichBaiBoSung(file(bai(), bai()), TU, [])
    expect(kqFile.dong).toHaveLength(1)
    expect(kqFile.bo_qua).toHaveLength(1)
  })

  it('BS9 — từ trùng chữ trong chủ đề ⇒ lỗi (không biết trỏ id nào)', () => {
    const kq = dichBaiBoSung(file(bai()), [...TU, { id: 'id-a2', word: '累' }], [])
    expect(kq.loi.length).toBeGreaterThan(0)
  })
})

describe('phuSongHoiThoai (M23)', () => {
  it('BS8 — tính cả vai A lẫn vai B, liệt kê từ còn thiếu theo dạng', () => {
    const bt: BaiHoiThoai[] = [
      { vocab_id: 'id-a', type: 'select_dialog', payload: { blank_b_vocab_id: 'id-b' } },
      { vocab_id: 'id-c', type: 'fill_dialog', payload: { blank_b_vocab_id: 'id-a' } },
    ]
    expect(phuSongHoiThoai(TU, bt)).toEqual({ select_dialog: ['检查'], fill_dialog: ['休息'] })
  })
})
