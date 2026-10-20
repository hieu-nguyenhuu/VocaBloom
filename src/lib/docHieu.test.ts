/**
 * TDD cho ĐỌC HIỂU CHỦ ĐỀ (M31, design.m31a.md Pha B). DH1–DH16.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  chamDoan,
  docBaiDoc,
  dongGhiBaiDoc,
  kiemTraBaiDoc,
  lanGanNhat,
  thoiGianDoan,
  tongHopKetQua,
  xaoLuot,
  TRAN_DOC_MS,
} from './docHieu.ts'

const Q = (dap_an = 0) => ({
  hoi: '他去哪儿？',
  hoi_pinyin: 'Tā qù nǎr?',
  lua_chon: ['公司', '学校', '医院', '商店'],
  lua_chon_pinyin: ['gōngsī', 'xuéxiào', 'yīyuàn', 'shāngdiàn'],
  dap_an,
  giai_thich_vi: 'Câu 1: 去公司.',
})
const DONG = (
  id: string,
  kieu = 'doan_van',
  content: unknown = {
    lines: [{ text: '他今天去公司。', pinyin: 'Tā jīntiān qù gōngsī.', vi: 'Hôm nay anh ấy đến công ty.' }],
    highlight_vocab_ids: ['v1', 'v-da-xoa'],
    questions: [Q(0), Q(1)],
  },
) => ({ id, kieu, thu_tu: 1, content })

describe('docBaiDoc', () => {
  it('DH1 — đọc đúng 1 đoạn, tu_dam bỏ id đã xoá', () => {
    const [b] = docBaiDoc([DONG('r1')], { v1: '公司' })
    expect(b?.lines[0]?.text).toBe('他今天去公司。')
    expect(b?.tu_dam).toEqual(['公司'])
    expect(b?.questions).toHaveLength(2)
  })

  it('DH2 — câu hỏi hỏng (trùng lựa chọn / dap_an ngoài 0–3 / 3 lựa chọn) bị bỏ; đoạn hết câu thì bỏ cả đoạn', () => {
    const hong = { ...Q(), lua_chon: ['a', 'a', 'b', 'c'] }
    const ds = docBaiDoc(
      [
        DONG('r1', 'doan_van', { lines: [{ text: 'x' }], questions: [hong, { ...Q(), dap_an: 4 }] }),
        DONG('r2', 'doan_van', { lines: [{ text: 'y' }], questions: [Q(), { ...Q(), lua_chon: ['1', '2', '3'] }] }),
      ],
      {},
    )
    expect(ds.map((b) => b.id)).toEqual(['r2'])
    expect(ds[0]?.questions).toHaveLength(1)
  })

  it('DH3 — kieu lạ / content null / không phải mảng ⇒ không vỡ', () => {
    expect(docBaiDoc([DONG('r1', 'tho'), { id: 'r2', kieu: 'doan_van', content: null }], {})).toEqual([])
    expect(docBaiDoc(null, {})).toEqual([])
  })
})

describe('xaoLuot', () => {
  const ds = docBaiDoc([DONG('r1'), DONG('r2'), DONG('r3')], {})

  it('DH4 — sau xáo, dap_an vẫn trỏ ĐÚNG chữ cũ, pinyin đi kèm lựa chọn', () => {
    const kq = xaoLuot(ds, () => 0.1)
    for (const b of kq) {
      b.questions.forEach((q, k) => {
        expect(q.lua_chon[q.dap_an]).toBe(k === 0 ? '公司' : '学校')
        expect(q.lua_chon_pinyin[q.lua_chon.indexOf('公司')]).toBe('gōngsī')
      })
    }
  })

  it('DH5 — đủ đoạn, không mất/nhân đôi; rng cố định ⇒ tất định', () => {
    expect(xaoLuot(ds, () => 0.7).map((b) => b.id).sort()).toEqual(['r1', 'r2', 'r3'])
    expect(xaoLuot(ds, () => 0.3)).toEqual(xaoLuot(ds, () => 0.3))
  })
})

describe('chamDoan', () => {
  const qs = docBaiDoc([DONG('r', 'doan_van', { lines: [{ text: 'x' }], questions: [Q(0), Q(2)] })], {})[0]!.questions

  it('DH6 — chưa chọn đủ ⇒ null (nút Kiểm tra phải tắt)', () => {
    expect(chamDoan(qs, [0, null])).toBeNull()
    expect(chamDoan(qs, [0])).toBeNull()
  })

  it('DH7 — chấm đúng từng câu', () => {
    expect(chamDoan(qs, [0, 1])).toEqual({ so_dung: 1, dung: [true, false] })
  })
})

describe('thoiGianDoan · tongHopKetQua · lanGanNhat', () => {
  it('DH8 — kẹp trần 10 phút, không âm', () => {
    expect(thoiGianDoan(0, 30_000)).toBe(30_000)
    expect(thoiGianDoan(0, TRAN_DOC_MS * 3)).toBe(TRAN_DOC_MS)
    expect(thoiGianDoan(5000, 1000)).toBe(0)
  })

  it('DH9 — tổng hợp lượt: cộng câu/đúng, phút làm tròn LÊN, giữ thứ tự đoạn', () => {
    const kq = tongHopKetQua([
      { so_cau: 3, so_dung: 3, thoi_gian_ms: 50_000, kieu: 'hoi_thoai' },
      { so_cau: 2, so_dung: 1, thoi_gian_ms: null, kieu: 'doan_van' },
    ])
    expect(kq).toEqual({
      so_cau: 5,
      so_dung: 4,
      phut: 1,
      doan: [
        { kieu: 'hoi_thoai', so_cau: 3, so_dung: 3 },
        { kieu: 'doan_van', so_cau: 2, so_dung: 1 },
      ],
    })
    expect(tongHopKetQua([]).so_cau).toBe(0)
  })

  it('DH10 — lần gần nhất của mỗi chủ đề = lượt MỚI NHẤT, cộng mọi đoạn của lượt đó', () => {
    const kq = lanGanNhat([
      { topic_id: 't1', luot_id: 'cu', so_cau: 3, so_dung: 0, created_at: '2026-10-17T01:00:00Z' },
      { topic_id: 't1', luot_id: 'moi', so_cau: 3, so_dung: 2, created_at: '2026-10-18T01:00:00Z' },
      { topic_id: 't1', luot_id: 'moi', so_cau: 2, so_dung: 2, created_at: '2026-10-18T01:02:00Z' },
    ])
    expect(kq['t1']).toEqual({ so_cau: 5, so_dung: 4 })
    expect(kq['t2']).toBeUndefined()
  })
})

describe('kiemTraBaiDoc (cổng chung CLI + Import M31c)', () => {
  const doan = (over: Record<string, unknown> = {}) => ({
    kieu: 'doan_van',
    highlight_words: ['公司'],
    lines: [{ text: '他今天去公司。', pinyin: 'Tā jīntiān qù gōngsī.', vi: 'Anh ấy đến công ty.' }],
    questions: [Q(0), Q(1)],
    ...over,
  })
  const TU = ['公司', '学校']

  it('DH11 — 3 đoạn hợp lệ ⇒ 0 lỗi; báo từ chưa phủ', () => {
    const kq = kiemTraBaiDoc([doan(), doan(), doan()], TU, 'zh')
    expect(kq.loi).toEqual([])
    expect(kq.thieu_phu).toEqual(['学校'])
  })

  it('DH12 — < 3 đoạn · 1 câu hoặc 4 câu/đoạn ⇒ lỗi', () => {
    expect(kiemTraBaiDoc([doan(), doan()], TU, 'zh').loi.length).toBeGreaterThan(0)
    const kq = kiemTraBaiDoc([doan({ questions: [Q()] }), doan(), doan({ questions: [Q(), Q(), Q(), Q()] })], TU, 'zh')
    expect(kq.loi.map((l) => l.duong_dan)).toEqual(['readings[0].questions', 'readings[2].questions'])
  })

  it('DH13 — highlight không thuộc chủ đề / không có trong đoạn ⇒ lỗi', () => {
    const kq = kiemTraBaiDoc([doan({ highlight_words: ['医院'] }), doan({ highlight_words: ['学校'] }), doan()], TU, 'zh')
    expect(kq.loi.map((l) => l.duong_dan)).toEqual(['readings[0].highlight_words', 'readings[1].highlight_words'])
  })

  it('DH14 — zh thiếu pinyin · hội thoại thiếu speaker A/B · thiếu giải thích ⇒ lỗi; en không cần pinyin', () => {
    const thieuPy = doan({ lines: [{ text: '他今天去公司。', vi: 'x' }] })
    const hoiThoai = doan({ kieu: 'hoi_thoai' })
    const khongGt = doan({ questions: [Q(), { ...Q(), giai_thich_vi: '' }] })
    expect(kiemTraBaiDoc([thieuPy, hoiThoai, khongGt], TU, 'zh').loi).toHaveLength(3)
    const en = {
      kieu: 'doan_van',
      highlight_words: ['office'],
      lines: [{ text: 'He goes to the Office.', vi: 'x' }],
      questions: [{ ...Q(), hoi_pinyin: '', lua_chon_pinyin: [] }, Q(1)],
    }
    expect(kiemTraBaiDoc([en, en, en], ['office'], 'en').loi).toEqual([])
  })
})

describe('dongGhiBaiDoc', () => {
  it('DH15 — đổi highlight_words → highlight_vocab_ids, thu_tu từ 1', () => {
    const [d] = dongGhiBaiDoc(
      [{ kieu: 'doan_van', highlight_words: ['公司'], lines: [{ text: 'a', vi: 'b' }], questions: [Q()] }],
      't1',
      { 公司: 'v1' },
    )
    expect(d).toMatchObject({ topic_id: 't1', thu_tu: 1, kieu: 'doan_van', content: { highlight_vocab_ids: ['v1'] } })
    expect(JSON.stringify(d)).not.toContain('highlight_words')
  })

  it('DH16 — docHieu.ts thuần: không import react / supabase / node:', () => {
    expect(readFileSync('src/lib/docHieu.ts', 'utf8')).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
