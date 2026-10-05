import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { lapKeHoach, type ChuDeDb } from './boSungSongNgu.ts'

const NS = (sentence = '上线前，我们要先___这个软件。') => ({
  sentence, sentence_pinyin: 'Shàngxiàn qián, wǒmen yào xiān ___ zhège ruǎnjiàn.',
  sentence_secondary: 'Before release, we need to test this software first.', answer_note_vi: 'kiểm thử phần mềm',
  distractors: [
    { word: '检测', pinyin: 'jiǎncè', secondary: 'inspect', note_vi: 'đo kiểm thông số' },
    { word: '考试', pinyin: 'kǎoshì', secondary: 'exam', note_vi: 'thi cử' },
    { word: '试验', pinyin: 'shìyàn', secondary: 'experiment', note_vi: 'làm thử' },
  ],
})
const TU = (word: string, extra: Record<string, unknown> = {}) => ({
  word, secondary_word: 'test; testing', secondary_phonetic: '/test/', secondary_collocation: 'run a test',
  secondary_example: 'We test every board.', secondary_note: null,
  description: 'The process of checking whether something works as required.', near_synonym: NS(), ...extra,
})
const CD = (): ChuDeDb => ({
  tu: [{ id: 'u1', word: '测试', secondary_word: null, secondary_phonetic: null, secondary_collocation: null, secondary_example: null, secondary_note: null }],
  moTa: [{ id: 'e1', vocab_id: 'u1', payload: { description: 'Mô tả tiếng Việt cũ', distractors: [{ word: 'a', pinyin: 'a' }] } }],
  ganNghiaCo: [],
  hoiThoai: { id: 'd1', content: { lines: [
    { speaker: 'A', text_zh: '你好', pinyin: 'nǐ hǎo', text_vi: 'chào', highlight_vocab_ids: ['u1'] },
    { speaker: 'B', text_zh: '好', pinyin: 'hǎo', text_vi: 'ừ', highlight_vocab_ids: [] },
  ] } },
})
const FILE = (over: Record<string, unknown> = {}) => ({ topic_name: 'X', vocab: [TU('测试')], dialogue_secondary: ['Hello', 'OK'], ...over })

describe('lapKeHoach (M26b)', () => {
  it('BN1 — file hợp lệ: đủ 4 loại thay đổi, đúng id, giữ distractors cũ + mọi khoá hội thoại cũ', () => {
    const k = lapKeHoach(FILE(), CD())
    expect(k.loi).toEqual([])
    expect(k.vocab).toEqual([{ id: 'u1', thay: { secondary_word: 'test; testing', secondary_phonetic: '/test/',
      secondary_collocation: 'run a test', secondary_example: 'We test every board.' } }])
    expect(k.moTa).toEqual([{ id: 'e1', payload: { description: 'The process of checking whether something works as required.',
      distractors: [{ word: 'a', pinyin: 'a' }] } }])
    expect(k.ganNghia).toEqual([{ vocab_id: 'u1', type: 'near_synonym', payload: NS() }])
    expect(k.hoiThoai?.content.lines[0]).toEqual({ speaker: 'A', text_zh: '你好', pinyin: 'nǐ hǎo', text_vi: 'chào',
      highlight_vocab_ids: ['u1'], text_secondary: 'Hello' })
  })
  it('BN2 — thiếu từ của chủ đề / thừa từ lạ / 1 từ khai 2 lần ⇒ lỗi', () => {
    expect(lapKeHoach(FILE({ vocab: [] }), CD()).loi.length).toBeGreaterThan(0)
    expect(lapKeHoach(FILE({ vocab: [TU('测试'), TU('苹果')] }), CD()).loi.length).toBeGreaterThan(0)
    expect(lapKeHoach(FILE({ vocab: [TU('测试'), TU('测试')] }), CD()).loi.length).toBeGreaterThan(0)
  })
  it('BN3 — secondary_word rỗng / phonetic sai kiểu / thiếu KEY note ⇒ lỗi', () => {
    expect(lapKeHoach(FILE({ vocab: [TU('测试', { secondary_word: ' ' })] }), CD()).loi.length).toBeGreaterThan(0)
    expect(lapKeHoach(FILE({ vocab: [TU('测试', { secondary_phonetic: 5 })] }), CD()).loi.length).toBeGreaterThan(0)
    const { secondary_note: _, ...thieu } = TU('测试')
    expect(lapKeHoach(FILE({ vocab: [thieu] }), CD()).loi.length).toBeGreaterThan(0)
  })
  it('BN4 — near_synonym sai (2 chỗ trống / nhiễu trùng chính từ / câu chứa sẵn đáp án) ⇒ lỗi', () => {
    expect(lapKeHoach(FILE({ vocab: [TU('测试', { near_synonym: NS('___和___') })] }), CD()).loi.length).toBeGreaterThan(0)
    const trung = NS(); trung.distractors[0]!.word = '测试'
    expect(lapKeHoach(FILE({ vocab: [TU('测试', { near_synonym: trung })] }), CD()).loi.length).toBeGreaterThan(0)
    expect(lapKeHoach(FILE({ vocab: [TU('测试', { near_synonym: NS('测试以前要先___。') })] }), CD()).loi.length).toBeGreaterThan(0)
  })
  it('BN5 — định nghĩa tiếng Anh chứa nghĩa phụ (lộ đáp án) ⇒ lỗi; chỉ khớp TRỌN từ', () => {
    expect(lapKeHoach(FILE({ vocab: [TU('测试', { description: 'A test of a product.' })] }), CD()).loi.length).toBeGreaterThan(0)
    expect(lapKeHoach(FILE({ vocab: [TU('测试', { description: 'Checking a product (not "testimony").' })] }), CD()).loi).toEqual([])
  })
  it('BN6 — số câu phụ hội thoại ≠ số dòng trong DB ⇒ lỗi', () => {
    expect(lapKeHoach(FILE({ dialogue_secondary: ['Hello'] }), CD()).loi.length).toBeGreaterThan(0)
  })
  it('BN7 — IDEMPOTENT: DB đã đủ đúng như file ⇒ 0 thay đổi', () => {
    const cd = CD()
    const t = TU('测试')
    Object.assign(cd.tu[0]!, { secondary_word: t.secondary_word, secondary_phonetic: t.secondary_phonetic,
      secondary_collocation: t.secondary_collocation, secondary_example: t.secondary_example, secondary_note: null })
    cd.moTa[0]!.payload['description'] = t.description
    cd.ganNghiaCo = [{ id: 'n1', vocab_id: 'u1', payload: NS() }]
    cd.hoiThoai!.content.lines.forEach((l, i) => { l['text_secondary'] = ['Hello', 'OK'][i] })
    const k = lapKeHoach(FILE(), cd)
    expect([k.loi, k.vocab, k.moTa, k.ganNghia, k.ganNghiaSua, k.hoiThoai]).toEqual([[], [], [], [], [], null])
  })
  it('BN8 — từ đã có near_synonym trong DB ⇒ KHÔNG thêm bài thứ 2', () => {
    const cd = CD(); cd.ganNghiaCo = [{ id: 'n1', vocab_id: 'u1', payload: NS() }]
    expect(lapKeHoach(FILE(), cd).ganNghia).toEqual([])
  })
  it('BN9 — chủ đề không có hội thoại mà file có câu phụ ⇒ lỗi; cả 2 đều không có ⇒ hợp lệ', () => {
    const cd = CD(); cd.hoiThoai = null
    expect(lapKeHoach(FILE(), cd).loi.length).toBeGreaterThan(0)
    expect(lapKeHoach(FILE({ dialogue_secondary: [] }), cd).loi).toEqual([])
  })
  it('BN11 — bài near_synonym ĐÃ CÓ mà khác file (vd sửa pinyin) ⇒ PATCH theo id; khác thứ tự khoá thì KHÔNG coi là khác', () => {
    const cu = { ...NS(), sentence_pinyin: 'pinyin cũ sai' }
    const cd = CD(); cd.ganNghiaCo = [{ id: 'n1', vocab_id: 'u1', payload: cu }]
    const k = lapKeHoach(FILE(), cd)
    expect(k.ganNghia).toEqual([])
    expect(k.ganNghiaSua).toEqual([{ id: 'n1', payload: NS() }])
    const daoKhoa = Object.fromEntries(Object.entries(NS()).reverse())
    const cd2 = CD(); cd2.ganNghiaCo = [{ id: 'n1', vocab_id: 'u1', payload: daoKhoa }]
    expect(lapKeHoach(FILE(), cd2).ganNghiaSua).toEqual([])
  })
  it('BN10 — giữ tính thuần: chỉ import lib thuần', () => {
    const src = readFileSync('src/lib/boSungSongNgu.ts', 'utf8')
    expect(src).not.toMatch(/react|supabase|node:/)
  })
})
