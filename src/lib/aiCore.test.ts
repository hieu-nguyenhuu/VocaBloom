/**
 * Test cho aiCore.ts — logic AI thuần (M5, DESIGN.md §4.1).
 * Không gọi mạng: mọi thứ ở đây là dựng prompt/body và đọc response dạng chuỗi.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  bodyCham,
  deBaiCua,
  docGiaiThich,
  docJsonAI,
  docKetQuaCham,
  dungTuVerdict,
  promptCham,
  promptGiaiThich,
  taoItemCham,
} from './aiCore.ts'

describe('docJsonAI', () => {
  it('JSON thuần', () => {
    expect(docJsonAI('{"a":1}')).toEqual({ a: 1 })
  })
  it('bọc ```json … ``` → strip rồi parse lại 1 lần (§7.4)', () => {
    expect(docJsonAI('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })
  it('bọc ``` không có nhãn', () => {
    expect(docJsonAI('```\n{"a":1}\n```')).toEqual({ a: 1 })
  })
  it('có chữ thừa quanh JSON → null (không đoán mò)', () => {
    expect(docJsonAI('Đây nhé: {"a":1} xong')).toBeNull()
  })
  it('rác → null, không ném', () => {
    expect(docJsonAI('xin chào')).toBeNull()
  })
})

describe('dungTuVerdict', () => {
  it('good/acceptable → true; fail → false (§7.3)', () => {
    expect([dungTuVerdict('good'), dungTuVerdict('acceptable'), dungTuVerdict('fail')]).toEqual([
      true,
      true,
      false,
    ])
  })
})

describe('docKetQuaCham', () => {
  const mau = (ids: string[]) =>
    JSON.stringify({
      results: ids.map((id) => ({
        vocab_id: id, verdict: 'good', used_vocab_correctly: true,
        is_translation_request: false, feedback_vi: 'Tốt', improved_sentence: null,
      })),
    })

  it('đủ id → ok hết, thieu rỗng', () => {
    const kq = docKetQuaCham(mau(['a', 'b']), ['a', 'b'])
    expect(kq.ok.map((x) => x.vocab_id)).toEqual(['a', 'b'])
    expect(kq.thieu).toEqual([])
  })
  it('thiếu 1 id → vào danh sách thieu (§7.4: từ đó không cộng điểm)', () => {
    expect(docKetQuaCham(mau(['a']), ['a', 'b']).thieu).toEqual(['b'])
  })
  it('JSON hỏng → thiếu TẤT CẢ', () => {
    expect(docKetQuaCham('rác', ['a', 'b']).thieu).toEqual(['a', 'b'])
  })
  it('verdict lạ / thiếu field → coi là fail, không ném', () => {
    const kq = docKetQuaCham(JSON.stringify({ results: [{ vocab_id: 'a', verdict: 'tuyệt vời' }] }), ['a'])
    expect(kq.ok[0]).toEqual({
      vocab_id: 'a', verdict: 'fail', used_vocab_correctly: false,
      is_translation_request: false, feedback_vi: '', improved_sentence: null, secondary_feedback: null,
    })
  })
  it('id lạ ngoài danh sách hoặc trùng lặp → bỏ qua', () => {
    const kq = docKetQuaCham(mau(['a', 'a', 'zzz']), ['a'])
    expect(kq.ok).toHaveLength(1)
    expect(kq.thieu).toEqual([])
  })
})

describe('promptCham / bodyCham', () => {
  it('prompt có đủ 3 mức verdict + luật câu tiếng Việt trong ngoặc (§7.3)', () => {
    const p = promptCham('make_sentence')
    for (const k of ['good', 'acceptable', 'fail', 'is_translation_request', 'JSON']) {
      expect(p).toContain(k)
    }
  })
  it('prompt khác nhau theo dạng bài', () => {
    expect(promptCham('trans_sentence')).not.toBe(promptCham('complete_situation'))
  })
  it('bodyCham: đúng model, 2 message, user content chứa exercise_type + đủ items (§7.2)', () => {
    const b = bodyCham({
      dang: 'make_sentence',
      target_lang: 'zh',
      model: 'm/x',
      items: [{ vocab_id: 'a', word: '苹果', meaning_vi: 'quả táo', user_answer: '我吃苹果。' }],
    })
    expect(b.model).toBe('m/x')
    expect(b.messages).toHaveLength(2)
    expect(b.messages[0]?.role).toBe('system')
    const u = JSON.parse(b.messages[1]?.content ?? '{}') as {
      exercise_type: string
      target_lang: string
      items: { user_answer: string }[]
    }
    expect(u.exercise_type).toBe('make_sentence')
    expect(u.target_lang).toBe('zh')
    expect(u.items[0]?.user_answer).toBe('我吃苹果。')
  })
})

describe('docGiaiThich', () => {
  it('đủ 4 trường §8', () => {
    const g = docGiaiThich(
      JSON.stringify({
        question_translation_vi: 'a',
        answer_pinyin: 'b',
        answer_meaning_vi: 'c',
        explanation_vi: 'd',
      }),
    )
    expect(g).toEqual({
      question_translation_vi: 'a',
      answer_pinyin: 'b',
      answer_meaning_vi: 'c',
      explanation_vi: 'd',
    })
  })
  it('thiếu explanation_vi → null (không hiện panel rỗng)', () => {
    expect(docGiaiThich(JSON.stringify({ question_translation_vi: 'a' }))).toBeNull()
  })
  it('rác → null', () => {
    expect(docGiaiThich('hmm')).toBeNull()
  })
})

describe('X-ai — giữ tính thuần', () => {
  it('aiCore.ts không import react / supabase / node:', () => {
    const src = readFileSync('src/lib/aiCore.ts', 'utf8')
    expect(src).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})

describe('promptGiaiThich — bám đáp án (M11/#3)', () => {
  const p = promptGiaiThich('select_sentence')

  it('nói rõ trường nào là đáp án đúng', () => {
    expect(p).toContain('dap_an')
    expect(p.toLowerCase()).toContain('đáp án đúng'.toLowerCase())
  })

  it('cấm AI tự chọn đáp án khác', () => {
    expect(p).toMatch(/không tự chọn đáp án khác/i)
  })

  it('vẫn yêu cầu JSON thuần và giới hạn 3 câu', () => {
    expect(p).toContain('CHỈ trả JSON thuần')
    expect(p).toContain('tối đa 3 câu')
  })
})

describe('M26c — song ngữ + đề bài', () => {
  const mot = (extra: object) => JSON.stringify({ results: [{ vocab_id: 'a', verdict: 'good', feedback_vi: 'Tốt', ...extra }] })
  it('AI1 — secondary_feedback là chuỗi ⇒ giữ; verdict không bị ảnh hưởng', () => {
    const kq = docKetQuaCham(mot({ secondary_feedback: 'Câu Anh thiếu mạo từ "the".' }), ['a'])
    expect(kq.ok[0]?.secondary_feedback).toBe('Câu Anh thiếu mạo từ "the".')
    expect(kq.ok[0]?.verdict).toBe('good')
  })
  it('AI2 — thiếu / rỗng / sai kiểu ⇒ null, không làm hỏng kết quả chấm', () => {
    for (const extra of [{}, { secondary_feedback: '  ' }, { secondary_feedback: 42 }]) {
      const kq = docKetQuaCham(mot(extra), ['a'])
      expect(kq.ok[0]?.secondary_feedback).toBeNull()
      expect(kq.thieu).toEqual([])
    }
  })
  it('AI3 — prompt make_sentence: verdict CHỈ theo câu chính + luật secondary_feedback; dạng khác không có', () => {
    const p = promptCham('make_sentence')
    expect(p).toContain('secondary_feedback')
    expect(p).toContain('CHỈ dựa vào "user_answer"')
    expect(promptCham('trans_sentence')).not.toContain('secondary_feedback')
  })
  it('AI4 — prompt trans_sentence / complete_situation nhắc trường "de_bai"', () => {
    expect(promptCham('trans_sentence')).toContain('"de_bai"')
    expect(promptCham('complete_situation')).toContain('"de_bai"')
  })
  it('AI5 — deBaiCua: lấy đúng đề theo dạng, make_sentence không có đề', () => {
    expect(deBaiCua('trans_sentence', { vietnamese_sentence: ' Tôi ôn bài. ' })).toBe('Tôi ôn bài.')
    expect(deBaiCua('complete_situation', { situation_vi: 'Sếp hỏi tiến độ.', given_sentence_zh: '进度怎么样？' }))
      .toBe('Sếp hỏi tiến độ. 进度怎么样？')
    expect(deBaiCua('complete_situation', { situation_vi: 'Sếp hỏi.' })).toBe('Sếp hỏi.')
    expect(deBaiCua('make_sentence', { vietnamese_sentence: 'x' })).toBeUndefined()
    expect(deBaiCua('trans_sentence', undefined)).toBeUndefined()
  })
  it('AI6 — taoItemCham: câu phụ trống ⇒ KHÔNG có khoá phụ; có ⇒ trim + kèm secondary_word', () => {
    const goc = { vocab_id: 'a', word: '复习', meaning_vi: 'ôn tập', secondary_word: 'review', user_answer: '我复习。' }
    expect(taoItemCham({ ...goc, secondary_sentence: '   ' })).toEqual({ vocab_id: 'a', word: '复习', meaning_vi: 'ôn tập', user_answer: '我复习。' })
    expect(taoItemCham({ ...goc, secondary_sentence: ' I review. ', de_bai: 'Đề' })).toEqual({
      vocab_id: 'a', word: '复习', meaning_vi: 'ôn tập', user_answer: '我复习。',
      de_bai: 'Đề', secondary_word: 'review', secondary_sentence: 'I review.',
    })
  })
  it('AI7 — promptGiaiThich biết dùng secondary_word làm cầu nối', () => {
    expect(promptGiaiThich('translate')).toContain('secondary_word')
  })
})
