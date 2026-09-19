/**
 * Test cho aiCore.ts — logic AI thuần (M5, DESIGN.md §4.1).
 * Không gọi mạng: mọi thứ ở đây là dựng prompt/body và đọc response dạng chuỗi.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  bodyCham,
  docGiaiThich,
  docJsonAI,
  docKetQuaCham,
  dungTuVerdict,
  promptCham,
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
      is_translation_request: false, feedback_vi: '', improved_sentence: null,
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
