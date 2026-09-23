/**
 * Test cho nguPhap.ts — ngữ pháp CỦA CHỦ ĐỀ (M12b).
 * Fixture sao chép shape THẬT của bảng `topic_grammar` (migration 0013), không tự nghĩ ra
 * (bài học MB-21: fixture tự chế dùng sai tên khoá làm test xanh giả).
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { docNguPhap, noiTiepTheo } from './nguPhap.ts'

const DONG_THAT = {
  id: '11111111-1111-1111-1111-111111111111',
  topic_id: '22222222-2222-2222-2222-222222222222',
  thu_tu: 1,
  content_target: 'V + 着 + V',
  pinyin: 'V + zhe + V',
  content_vi: 'Hành động đang tiếp diễn thì xảy ra việc khác.',
  vi_du: '他笑着说。',
  vi_du_pinyin: 'Tā xiàozhe shuō.',
  vi_du_vi: 'Anh ấy vừa cười vừa nói.',
  created_at: '2026-09-22T00:00:00Z',
}

describe('docNguPhap', () => {
  it('N1 — dòng đầy đủ giữ nguyên mọi trường', () => {
    const [m] = docNguPhap([DONG_THAT])
    expect(m).toEqual({
      content_target: 'V + 着 + V',
      pinyin: 'V + zhe + V',
      content_vi: 'Hành động đang tiếp diễn thì xảy ra việc khác.',
      vi_du: '他笑着说。',
      vi_du_pinyin: 'Tā xiàozhe shuō.',
      vi_du_vi: 'Anh ấy vừa cười vừa nói.',
    })
  })

  it('N2 — cột nullable (topic tiếng Anh) về chuỗi rỗng, không phải null', () => {
    const [m] = docNguPhap([
      { ...DONG_THAT, pinyin: null, vi_du: null, vi_du_pinyin: null, vi_du_vi: null },
    ])
    expect(m?.pinyin).toBe('')
    expect(m?.vi_du).toBe('')
    expect(m?.content_target).toBe('V + 着 + V')
  })

  it('N3 — dòng thiếu content_target bị LOẠI (thẻ trống không giúp gì)', () => {
    expect(docNguPhap([{ ...DONG_THAT, content_target: '   ' }, DONG_THAT])).toHaveLength(1)
  })

  it('N4 — đầu vào rác không ném exception', () => {
    for (const rac of [null, undefined, 42, 'chuỗi', {}]) {
      expect(docNguPhap(rac), String(rac)).toEqual([])
    }
    expect(docNguPhap([null, undefined])).toEqual([])
  })

  it('N5 — giữ nguyên thứ tự DB trả về (đã order by thu_tu)', () => {
    const ds = docNguPhap([DONG_THAT, { ...DONG_THAT, thu_tu: 2, content_target: '又…又…' }])
    expect(ds.map((m) => m.content_target)).toEqual(['V + 着 + V', '又…又…'])
  })
})

describe('noiTiepTheo', () => {
  it('N6 — giai đoạn ĐẦU → vào Player chế độ topic', () => {
    expect(noiTiepTheo('dau', 'abc')).toBe('/on-tap?che_do=topic&topic=abc')
  })

  it('N7 — giai đoạn CUỐI → sang HỘI THOẠI, không nhảy thẳng Tổng kết (§4.5)', () => {
    expect(noiTiepTheo('cuoi', 'abc')).toBe('/on-tap/hoi-thoai?topic=abc')
  })

  it('N8 — 2 giai đoạn KHÔNG bao giờ trỏ về nhau (chống lặp vô hạn)', () => {
    expect(noiTiepTheo('dau', 'x')).not.toContain('/on-tap/ngu-phap')
    expect(noiTiepTheo('cuoi', 'x')).not.toContain('/on-tap/ngu-phap')
  })
})

describe('X-nguphap — giữ tính thuần', () => {
  it('N9 — nguPhap.ts không import react / supabase / node:', () => {
    const src = readFileSync('src/lib/nguPhap.ts', 'utf8')
    expect(src).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
