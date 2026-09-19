import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { tomTatChuDe } from './chuDe.ts'

const HOM_NAY = '2026-09-19'

// Dữ liệu thật rút gọn (19/09): 2 chủ đề TRÙNG TÊN "Thời tiết" ở 2 bản ghi khác nhau.
const topics = [
  { id: 't1', name: 'Trái cây', description: 'Hoa quả thường gặp' },
  { id: 't2', name: 'Thời tiết', description: 'Bộ 1' },
  { id: 't3', name: 'Thời tiết', description: null },
  { id: 't4', name: 'Rỗng', description: null },
]
const lienKet = [
  { topic_id: 't1', vocab_id: 'v1' },
  { topic_id: 't1', vocab_id: 'v2' },
  { topic_id: 't1', vocab_id: 'v3' },
  { topic_id: 't2', vocab_id: 'v4' },
  { topic_id: 't3', vocab_id: 'v5' },
]
const trangThai = [
  { vocab_id: 'v1', stage: 'mastered', next_review_date: null },
  { vocab_id: 'v2', stage: 'stage1', next_review_date: '2026-09-15' }, // quá hạn → due
  { vocab_id: 'v3', stage: 'intensive', next_review_date: '2026-09-30' }, // chưa tới hạn
  { vocab_id: 'v4', stage: 'stage1', next_review_date: '2026-09-19' }, // đúng hôm nay → due
  { vocab_id: 'v5', stage: 'new', next_review_date: null }, // hàng đợi từ mới
]
const kq = tomTatChuDe({ topics, lienKet, trangThai, homNay: HOM_NAY })
const lay = (id: string) => kq.find((x) => x.id === id)!

describe('tomTatChuDe', () => {
  it('đủ 4 chủ đề, kể cả chủ đề chưa có từ nào', () => {
    expect(kq).toHaveLength(4)
    expect(lay('t4').so_tu).toBe(0)
  })

  it('đếm đúng số từ mỗi chủ đề', () => {
    expect(lay('t1').so_tu).toBe(3)
    expect(lay('t2').so_tu).toBe(1)
  })

  it('so_den_han bỏ qua mastered và next_review_date = null', () => {
    expect(lay('t1').so_den_han).toBe(1) // chỉ v2; v1 mastered, v3 chưa tới hạn
    expect(lay('t2').so_den_han).toBe(1) // v4 đúng hôm nay
    expect(lay('t3').so_den_han).toBe(0) // v5 còn trong hàng đợi
  })

  it('thanh màu luôn đủ 6 khúc, đúng thứ tự stage', () => {
    expect(lay('t1').khuc.map((k) => k.stage)).toEqual(['new', 'stage1', 'stage2', 'stage3', 'intensive', 'mastered'])
    expect(lay('t1').khuc.map((k) => k.so)).toEqual([0, 1, 0, 0, 1, 1])
    expect(lay('t4').khuc.map((k) => k.so)).toEqual([0, 0, 0, 0, 0, 0])
  })

  it('sắp xếp: nhiều từ đến hạn trước, rồi theo tên', () => {
    expect(kq.map((x) => x.id).slice(0, 2).sort()).toEqual(['t1', 't2'])
    expect(kq.at(-1)!.so_den_han).toBe(0)
  })

  it('2 chủ đề trùng tên vẫn là 2 dòng riêng, giữ description để phân biệt', () => {
    const tt = kq.filter((x) => x.ten === 'Thời tiết')
    expect(tt).toHaveLength(2)
    expect(tt.map((x) => x.mo_ta)).toContain('Bộ 1')
    expect(tt.map((x) => x.mo_ta)).toContain(null)
    expect(new Set(tt.map((x) => x.id)).size).toBe(2)
  })
})

describe('kỷ luật module', () => {
  it('chuDe.ts là module thuần — không import react/supabase/node', () => {
    const src = readFileSync(new URL('./chuDe.ts', import.meta.url), 'utf8')
    expect(src).not.toMatch(/from '(react|node:|@supabase)/)
    expect(src).not.toMatch(/\.\/supabase\.ts/)
  })
})
