/**
 * Test cho player.ts — logic thuần của Player (M4a, DESIGN.md §2).
 * Mọi hàm nhận rng/ngày từ ngoài để test được; không đọc đồng hồ hay Math.random bên trong.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  chamMatching,
  chonNghiaFastDecision,
  demConCho,
  dinhDangNgayVN,
  giamPlayer,
  chamArrange,
  coBaiTinhDiem,
  homNayVN,
  locRetryTheoRecord,
  mocRing,
  soKhopDapAn,
  tongHopTongKet,
  xaoTron,
  xepBai,
  type Man,
  type TrangThaiPlayer,
  gomSessionTopic,
  stageBaiTap,
  gioiHanNhap,
  tachChoTrong,
  catTheoGioiHan,
  oGoiY,
} from './player.ts'
import { boBaiCua, gomSession, type DangBai, type Stage, type TrangThaiTu } from './srs.ts'

describe('homNayVN', () => {
  it('17:30Z ngày 16/9 = 00:30 ngày 17/9 giờ VN', () => {
    expect(homNayVN(new Date('2026-09-16T17:30:00Z'))).toBe('2026-09-17')
  })
  it('16:30Z vẫn là 16/9', () => {
    expect(homNayVN(new Date('2026-09-16T16:30:00Z'))).toBe('2026-09-16')
  })
})

describe('dinhDangNgayVN', () => {
  it('2026-09-17 → "Thứ Năm, 17/9"', () => {
    expect(dinhDangNgayVN('2026-09-17')).toBe('Thứ Năm, 17/9')
  })
  it('Chủ nhật', () => {
    expect(dinhDangNgayVN('2026-09-20')).toBe('Chủ Nhật, 20/9')
  })
})

// ── Fixture dùng chung ──────────────────────────────────────────────────────
const tu = (id: string, stage: Stage = 'new', daDat: DangBai[] = []): TrangThaiTu => ({
  vocab_id: id,
  stage,
  next_review_date: '2026-09-10',
  cycle_points: 0,
  cycle_completed_exercises: daDat,
  total_points: 0,
  last_reviewed_at: null,
})
const bai = (vocab_id: string, type: DangBai, payload: Record<string, unknown> = {}) => ({
  id: `${vocab_id}-${type}`,
  vocab_id,
  type,
  payload,
})
const BO = (ids: string[]) =>
  ids.flatMap((v) => [
    bai(v, 'grammar', { content_target: 'x', content_vi: 'y' }),
    bai(v, 'selection', { distractors: ['a', 'b', 'c'] }),
    bai(v, 'audio_recognition', { distractors: ['a', 'b', 'c'] }),
    bai(v, 'fast_decision', { wrong_meaning: 'z' }),
  ])

describe('xepBai', () => {
  it('thứ tự theo dạng bài, xen kẽ từ; matching là 1 màn', () => {
    const { man } = xepBai({ tu: [tu('a'), tu('b')], baiTap: BO(['a', 'b']) })
    expect(man.map((m) => m.loai)).toEqual([
      'flashcard', 'flashcard', 'grammar', 'grammar', 'matching',
      'selection', 'selection', 'audio_recognition', 'audio_recognition', 'fast_decision', 'fast_decision',
    ])
    const ids = man.filter((m) => m.loai !== 'matching').map((m) => (m as { vocab_id: string }).vocab_id)
    expect(ids).toEqual(['a', 'b', 'a', 'b', 'a', 'b', 'a', 'b', 'a', 'b'])
  })
  it('bỏ dạng đã đạt trong cycle_completed_exercises', () => {
    const { man } = xepBai({ tu: [tu('a', 'new', ['selection', 'matching'])], baiTap: BO(['a']) })
    expect(man.some((m) => m.loai === 'selection' || m.loai === 'matching')).toBe(false)
  })
  it('thiếu record → bỏ + báo', () => {
    const { man, thieu } = xepBai({
      tu: [tu('a')],
      baiTap: BO(['a']).filter((b) => b.type !== 'fast_decision'),
    })
    expect(thieu).toEqual([{ vocab_id: 'a', type: 'fast_decision' }])
    expect(man.some((m) => m.loai === 'fast_decision')).toBe(false)
  })
  it('la_bai_cuoi_cua_tu chỉ đúng ở màn tính điểm cuối của từ; matching ghi theo từng từ', () => {
    const { man } = xepBai({ tu: [tu('a')], baiTap: BO(['a']) })
    const diem = man.filter((m): m is Extract<Man, { la_bai_cuoi_cua_tu: boolean }> => 'la_bai_cuoi_cua_tu' in m)
    expect(diem.map((m) => m.la_bai_cuoi_cua_tu)).toEqual([false, false, true])
    const mt = man.find((m) => m.loai === 'matching')
    expect(mt && mt.loai === 'matching' ? mt.la_bai_cuoi : null).toEqual({ a: false })
  })
  it('retry: chỉ dạng cho phép, không flashcard/grammar; bài duy nhất là bài cuối', () => {
    const { man } = xepBai({ tu: [tu('a')], baiTap: BO(['a']), dangChoPhep: ['fast_decision'] })
    expect(man.map((m) => m.loai)).toEqual(['fast_decision'])
    expect((man[0] as { la_bai_cuoi_cua_tu: boolean }).la_bai_cuoi_cua_tu).toBe(true)
  })
})

describe('xaoTron / chonNghiaFastDecision / chamMatching', () => {
  const rngCoDinh = (...v: number[]) => {
    let i = 0
    return () => v[i++ % v.length]!
  }
  it('xaoTron không đổi phần tử, không đổi mảng gốc', () => {
    const goc = [1, 2, 3, 4]
    expect([...xaoTron(goc, rngCoDinh(0.1, 0.9, 0.5))].sort()).toEqual([1, 2, 3, 4])
    expect(goc).toEqual([1, 2, 3, 4])
  })
  it('rng<0.5 → hiện nghĩa đúng', () => {
    expect(chonNghiaFastDecision('táo', 'lê', () => 0.2)).toEqual({ hien: 'táo', la_dung: true })
  })
  it('rng>=0.5 → hiện nghĩa sai', () => {
    expect(chonNghiaFastDecision('táo', 'lê', () => 0.7)).toEqual({ hien: 'lê', la_dung: false })
  })
  it('chamMatching: lần chạm đầu sai → từ đó sai dù sau ghép đúng; từ kia đúng', () => {
    expect(
      chamMatching(
        [{ trai: 'a', phai: 'B' }, { trai: 'a', phai: 'A' }, { trai: 'b', phai: 'B' }],
        { a: 'A', b: 'B' },
      ),
    ).toEqual({ a: false, b: true })
  })
})

describe('tongHopTongKet / demConCho', () => {
  const log = (vocab_id: string, points: number, b: Stage, a: Stage) => ({
    vocab_id, points, stage_before: b, stage_after: a, is_correct: points > 0,
  })
  it('tổng hợp cả ngày: điểm cộng dồn, từ distinct, lên stage = before≠after, mastered, chưa đạt', () => {
    const kq = tongHopTongKet([
      log('a', 1, 'new', 'new'), log('a', 1, 'new', 'stage1'), log('b', 0, 'new', 'new'), log('c', 4, 'stage3', 'mastered'),
    ])
    expect(kq).toEqual({
      diem: 6, so_tu_da_on: 3, so_len_stage: 2, mastered: ['c'], so_chua_dat: 1,
      chi_tiet: [
        { vocab_id: 'a', stage_before: 'new', stage_after: 'stage1', len_stage: true },
        { vocab_id: 'b', stage_before: 'new', stage_after: 'new', len_stage: false },
        { vocab_id: 'c', stage_before: 'stage3', stage_after: 'mastered', len_stage: true },
      ],
    })
  })
  it('log rỗng → toàn 0', () => {
    expect(tongHopTongKet([]).so_tu_da_on).toBe(0)
  })
  it('demConCho = due không nằm trong retry (từ dở dang vẫn là đang chờ)', () => {
    expect(demConCho(['a', 'b', 'c'], ['b'])).toBe(2)
  })
})

describe('giamPlayer — reducer (DESIGN.md §2.5)', () => {
  const BAT_DAU: TrangThaiPlayer = { buoc: 'dang_tai' }
  const nap = () => {
    const { man } = xepBai({ tu: [tu('a'), tu('b')], baiTap: BO(['a', 'b']) })
    return giamPlayer(BAT_DAU, { loai: 'nap', man, trang_thai: { a: tu('a'), b: tu('b') } })
  }
  it('nap → dang_on, chi_so 0', () => {
    const s = nap()
    expect(s.buoc).toBe('dang_on')
    if (s.buoc === 'dang_on') expect(s.chi_so).toBe(0)
  })
  it('nap rỗng → khong_co_tu', () => {
    expect(giamPlayer(BAT_DAU, { loai: 'nap', man: [], trang_thai: {} })).toEqual({ buoc: 'khong_co_tu' })
  })
  it('bat_dau_luu → dang_luu; luu_ok cập nhật trạng thái từ + xong_tu + sang màn', () => {
    const s1 = giamPlayer(nap(), { loai: 'bat_dau_luu' })
    if (s1.buoc !== 'dang_on') throw new Error()
    expect(s1.dang_luu).toBe(true)
    const moi = { ...tu('a'), cycle_points: 1 }
    const s2 = giamPlayer(s1, { loai: 'luu_ok', trang_thai_moi: moi, xong_tu: 'a' })
    if (s2.buoc !== 'dang_on') throw new Error()
    expect(s2.dang_luu).toBe(false)
    expect(s2.chi_so).toBe(1)
    expect(s2.trang_thai['a']?.cycle_points).toBe(1)
    expect(s2.da_xong_tu).toEqual(['a'])
  })
  it('sang_man ở màn cuối → het_session mang da_xong_tu', () => {
    let s = nap()
    if (s.buoc !== 'dang_on') throw new Error()
    const n = s.man.length
    for (let i = 0; i < n - 1; i++) s = giamPlayer(s, { loai: 'sang_man' })
    expect(s.buoc).toBe('dang_on')
    s = giamPlayer(s, { loai: 'sang_man' })
    expect(s).toEqual({ buoc: 'het_session', da_xong_tu: [] })
  })
  it('hard_day_cuoi đẩy màn hiện tại về cuối, chi_so giữ nguyên', () => {
    const s0 = nap()
    if (s0.buoc !== 'dang_on') throw new Error()
    const dau = s0.man[0]
    const s = giamPlayer(s0, { loai: 'hard_day_cuoi' })
    if (s.buoc !== 'dang_on') throw new Error()
    expect(s.chi_so).toBe(0)
    expect(s.man.at(-1)).toBe(dau)
    expect(s.man.length).toBe(s0.man.length)
  })
  it('luu_loi giữ chi_so + thông điệp; thu_lai xoá lỗi và đặt dang_luu', () => {
    const s1 = giamPlayer(giamPlayer(nap(), { loai: 'bat_dau_luu' }), { loai: 'luu_loi', thong_diep: 'mất mạng' })
    if (s1.buoc !== 'dang_on') throw new Error()
    expect(s1.loi_luu).toBe('mất mạng')
    expect(s1.dang_luu).toBe(false)
    expect(s1.chi_so).toBe(0)
    const s2 = giamPlayer(s1, { loai: 'thu_lai' })
    if (s2.buoc !== 'dang_on') throw new Error()
    expect(s2.loi_luu).toBeNull()
    expect(s2.dang_luu).toBe(true)
  })
  it('luu_ok khong_sang → cập nhật nhưng giữ chi_so (Matching ghi nhiều lần)', () => {
    const s = giamPlayer(giamPlayer(nap(), { loai: 'bat_dau_luu' }), { loai: 'luu_ok', xong_tu: 'a', khong_sang: true })
    if (s.buoc !== 'dang_on') throw new Error()
    expect(s.chi_so).toBe(0)
    expect(s.da_xong_tu).toEqual(['a'])
  })
  it('thoat → thoat mang da_xong_tu; hành động sai bước trả nguyên tham chiếu', () => {
    const s = nap()
    expect(giamPlayer(s, { loai: 'thoat' })).toEqual({ buoc: 'thoat', da_xong_tu: [] })
    expect(giamPlayer(BAT_DAU, { loai: 'sang_man' })).toBe(BAT_DAU)
    expect(giamPlayer(BAT_DAU, { loai: 'luu_ok' })).toBe(BAT_DAU)
  })
})

describe('X-player — giữ tính thuần', () => {
  it('player.ts chỉ import từ ./srs.ts', () => {
    const src = readFileSync('src/lib/player.ts', 'utf8')
    const imports = [...src.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1])
    expect(imports).toEqual(['./srs.ts'])
  })
})

describe('mocRing — 6 mốc màu DEC-12', () => {
  it('biên các mốc', () => {
    expect([0, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 99].map(mocRing)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
  })
})

// ── M4b: stage 1 & 2 ────────────────────────────────────────────────────────
const dialog = (vocab_id: string, b: string | null, type: DangBai = 'select_dialog') =>
  bai(vocab_id, type, {
    dialog_a: 'A ___ ?', dialog_b: 'B ___ .', blank_a_answer: 'X',
    ...(b ? { blank_b_vocab_id: b } : {}),
    distractors: [{ word: 'p' }, { word: 'q' }],
  })

describe('xepBai — stage 1 & 2 (M4b)', () => {
  it('stage1: thứ tự translate → select_dialog → listen_fill → select_on_describe', () => {
    const bt = [
      dialog('a', 'b'),
      bai('a', 'select_on_describe', { description: 'mô tả', distractors: [{ word: 'x' }] }),
    ]
    const { man } = xepBai({ tu: [tu('a', 'stage1')], baiTap: bt })
    expect(man.map((m) => m.loai)).toEqual([
      'flashcard', 'translate', 'select_dialog', 'listen_fill', 'select_on_describe',
    ])
  })

  it('translate / listen_fill / trans_collocation KHÔNG cần record — vẫn dựng màn, không vào `thieu`', () => {
    const { man, thieu } = xepBai({ tu: [tu('a', 'stage1')], baiTap: [] })
    expect(man.map((m) => m.loai)).toEqual(['flashcard', 'translate', 'listen_fill'])
    expect(thieu).toEqual([
      { vocab_id: 'a', type: 'grammar' },
      { vocab_id: 'a', type: 'select_dialog' },
      { vocab_id: 'a', type: 'select_on_describe' },
    ])
  })

  it('stage2: fill_dialog → select_sentence → arrange_words → trans_collocation', () => {
    const bt = [
      dialog('a', 'b', 'fill_dialog'),
      bai('a', 'select_sentence', { correct_sentence: { text: 'c' }, wrong_sentences: [] }),
      bai('a', 'arrange_words', { tokens: [{ text: 'x', pinyin: 'x' }] }),
    ]
    const { man } = xepBai({ tu: [tu('a', 'stage2')], baiTap: bt })
    expect(man.map((m) => m.loai)).toEqual([
      'flashcard', 'fill_dialog', 'select_sentence', 'arrange_words', 'trans_collocation',
    ])
  })

  it('bài 2 từ: 1 record dùng cho cả A và B trong session → đúng 1 màn, la_bai_cuoi có cả 2', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage1'), tu('b', 'stage1')], baiTap: [dialog('a', 'b')] })
    const d = man.filter((m) => m.loai === 'select_dialog')
    expect(d).toHaveLength(1)
    const m0 = d[0]
    if (!m0 || m0.loai !== 'select_dialog') throw new Error('thiếu màn dialog')
    expect([m0.vocab_a, m0.vocab_b]).toEqual(['a', 'b'])
    // còn listen_fill sau nó nên chưa phải bài cuối của từ nào
    expect(m0.la_bai_cuoi).toEqual({ a: false, b: false })
  })

  it('bài 2 từ: B KHÔNG trong session → la_bai_cuoi chỉ có A', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage1')], baiTap: [dialog('a', 'zzz')] })
    const m0 = man.find((m) => m.loai === 'select_dialog')
    if (!m0 || m0.loai !== 'select_dialog') throw new Error('thiếu màn dialog')
    expect(Object.keys(m0.la_bai_cuoi)).toEqual(['a'])
    expect(m0.vocab_b).toBe('zzz')
  })

  it('record gắn vai B (A không due) vẫn dựng màn cho B, không báo thiếu', () => {
    const { man, thieu } = xepBai({ tu: [tu('a', 'stage1')], baiTap: [dialog('x', 'a')] })
    const m0 = man.find((m) => m.loai === 'select_dialog')
    if (!m0 || m0.loai !== 'select_dialog') throw new Error('thiếu màn dialog')
    expect([m0.vocab_a, m0.vocab_b]).toEqual(['x', 'a'])
    expect(m0.la_bai_cuoi).toEqual({ a: false })
    expect(thieu.some((t) => t.type === 'select_dialog')).toBe(false)
  })
})

describe('soKhopDapAn / chamArrange / locRetryTheoRecord (M4b)', () => {
  it('trim 2 đầu', () => {
    expect(soKhopDapAn('  苹果 ', '苹果', 'zh')).toBe(true)
  })
  it('zh: sai 1 ký tự là sai, phân biệt chữ', () => {
    expect(soKhopDapAn('苹菓', '苹果', 'zh')).toBe(false)
  })
  it('en: không phân biệt hoa thường', () => {
    expect(soKhopDapAn('Doctor', 'doctor', 'en')).toBe(true)
  })
  it('rỗng → sai', () => {
    expect(soKhopDapAn('   ', '苹果', 'zh')).toBe(false)
  })

  it('chamArrange: đúng thứ tự gốc', () => {
    expect(chamArrange(['我', '吃'], [{ text: '我' }, { text: '吃' }])).toBe(true)
  })
  it('chamArrange: sai thứ tự / thiếu chip', () => {
    expect(chamArrange(['吃', '我'], [{ text: '我' }, { text: '吃' }])).toBe(false)
    expect(chamArrange(['我'], [{ text: '我' }, { text: '吃' }])).toBe(false)
  })

  it('locRetryTheoRecord: bỏ dạng cần record mà từ không có', () => {
    expect(
      locRetryTheoRecord(
        { reason: 'below_threshold', exercise_types: ['select_dialog', 'select_on_describe'] },
        ['select_on_describe'],
      ),
    ).toEqual({ reason: 'below_threshold', exercise_types: ['select_on_describe'] })
  })
  it('locRetryTheoRecord: giữ dạng KHÔNG cần record dù không có bản ghi', () => {
    expect(
      locRetryTheoRecord({ reason: 'below_threshold', exercise_types: ['translate', 'listen_fill'] }, [])
        ?.exercise_types,
    ).toEqual(['translate', 'listen_fill'])
  })
  it('locRetryTheoRecord: sau lọc rỗng → null (không tạo hàng retry)', () => {
    expect(locRetryTheoRecord({ reason: 'below_threshold', exercise_types: ['select_dialog'] }, [])).toBeNull()
  })
  it('locRetryTheoRecord: exercise_types null (cả bộ) giữ nguyên; đầu vào null → null', () => {
    const caBo = { reason: 'flashcard_again' as const, exercise_types: null }
    expect(locRetryTheoRecord(caBo, [])).toBe(caBo)
    expect(locRetryTheoRecord(null, [])).toBeNull()
  })
})

describe('coBaiTinhDiem — chặn session lặp vô hạn (phát hiện khi kiểm thật M4b)', () => {
  it('chỉ còn flashcard/grammar → false (không nạp session nữa)', () => {
    const { man } = xepBai({
      tu: [tu('a', 'new', ['matching', 'selection', 'audio_recognition', 'fast_decision'])],
      baiTap: BO(['a']),
    })
    expect(man.map((m) => m.loai)).toEqual(['flashcard', 'grammar'])
    expect(coBaiTinhDiem(man)).toBe(false)
  })
  it('còn ít nhất 1 bài tính điểm → true', () => {
    const { man } = xepBai({ tu: [tu('a', 'new', ['matching'])], baiTap: BO(['a']) })
    expect(coBaiTinhDiem(man)).toBe(true)
  })
  it('bài 2 từ cũng tính là bài tính điểm', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage1', ['translate', 'listen_fill', 'select_on_describe'])], baiTap: [dialog('a', 'b')] })
    expect(man.map((m) => m.loai)).toEqual(['flashcard', 'select_dialog'])
    expect(coBaiTinhDiem(man)).toBe(true)
  })
  it('mảng rỗng → false', () => { expect(coBaiTinhDiem([])).toBe(false) })
})

// ── M5: stage 3 (tự luận AI chấm) ───────────────────────────────────────────
describe('xepBai — stage 3 (M5)', () => {
  const bt3 = (id: string) => [
    bai(id, 'trans_sentence', { vietnamese_sentence: 'Tôi ăn táo.' }),
    bai(id, 'complete_situation', {
      situation_vi: 'Ở chợ', given_sentence_zh: '你好', given_sentence_pinyin: 'nǐ hǎo',
    }),
  ]

  it('3 dạng nhập, mỗi nhóm theo sau đúng 1 màn cham_ai', () => {
    const { man } = xepBai({
      tu: [tu('a', 'stage3'), tu('b', 'stage3')],
      baiTap: [...bt3('a'), ...bt3('b')],
    })
    expect(man.map((m) => m.loai)).toEqual([
      'flashcard', 'flashcard',
      'make_sentence', 'make_sentence', 'cham_ai',
      'trans_sentence', 'trans_sentence', 'cham_ai',
      'complete_situation', 'complete_situation', 'cham_ai',
    ])
  })

  it('nhóm rỗng (thiếu record) → KHÔNG chèn cham_ai thừa', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage3')], baiTap: [] })
    expect(man.map((m) => m.loai)).toEqual(['flashcard', 'make_sentence', 'cham_ai'])
  })

  it('la_bai_cuoi nằm ở màn cham_ai (nơi ghi điểm), không ở màn nhập', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage3')], baiTap: bt3('a') })
    const cham = man.filter((m) => m.loai === 'cham_ai')
    expect(cham).toHaveLength(3)
    const dau = cham[0]
    const cuoi = cham[2]
    expect(dau && dau.loai === 'cham_ai' ? dau.la_bai_cuoi : null).toEqual({ a: false })
    expect(cuoi && cuoi.loai === 'cham_ai' ? cuoi.la_bai_cuoi : null).toEqual({ a: true })
  })

  it('màn cham_ai là bài TÍNH ĐIỂM (session không bị bỏ qua)', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage3')], baiTap: [] })
    expect(coBaiTinhDiem(man)).toBe(true)
  })

  it('bỏ dạng đã đạt trong chu kỳ', () => {
    const { man } = xepBai({
      tu: [tu('a', 'stage3', ['make_sentence', 'trans_sentence'])],
      baiTap: bt3('a'),
    })
    expect(man.map((m) => m.loai)).toEqual(['flashcard', 'complete_situation', 'cham_ai'])
  })
})

// ── M7: ôn theo chủ đề ──────────────────────────────────────────────────────
describe('stageBaiTap', () => {
  it('mastered mượn bộ bài của intensive (M7/Q1)', () => {
    expect(stageBaiTap('mastered')).toBe('intensive')
    expect(boBaiCua(stageBaiTap('mastered'))).toHaveLength(4)
  })

  it('stage khác giữ nguyên', () => {
    for (const s of ['new', 'stage1', 'stage2', 'stage3', 'intensive'] as const) {
      expect(stageBaiTap(s)).toBe(s)
    }
  })
})

describe('gomSessionTopic', () => {
  /** Chủ đề "Trái cây" thật (19/09): 3 mastered + 1 intensive + 1 stage1. */
  const traiCay = [
    { ...tu('m1', 'mastered'), next_review_date: null },
    { ...tu('m2', 'mastered'), next_review_date: null },
    { ...tu('m3', 'mastered'), next_review_date: null },
    tu('i1', 'intensive'),
    tu('s1', 'stage1'),
  ]

  it('GIỮ từ mastered và từ next_review_date = null (khác hẳn gomSession hằng ngày)', () => {
    const p = gomSessionTopic(traiCay)
    expect(p.flat()).toHaveLength(5)
  })

  it('so sánh trực tiếp: gomSession bỏ 3 từ mastered, gomSessionTopic giữ đủ 5', () => {
    expect(gomSession(traiCay).flat().map((t) => t.vocab_id)).toEqual(['s1', 'i1'])
    expect(gomSessionTopic(traiCay).flat()).toHaveLength(5)
  })

  it('mỗi session thuần 1 stage hiệu dụng — mastered gom chung với intensive', () => {
    const p = gomSessionTopic(traiCay)
    for (const phien of p) {
      const set = new Set(phien.map((t) => stageBaiTap(t.stage)))
      expect(set.size).toBe(1)
    }
    // stage1 (1 từ) + [3 mastered & 1 intensive → cùng nhóm intensive] ⇒ 2 session
    expect(p).toHaveLength(2)
  })

  it('stage thấp ôn trước', () => {
    expect(gomSessionTopic(traiCay)[0]!.every((t) => t.stage === 'stage1')).toBe(true)
  })

  it('cắt 5 từ mỗi session', () => {
    const p = gomSessionTopic(Array.from({ length: 12 }, (_, i) => tu(`x${i}`, 'stage1')))
    expect(p.map((x) => x.length)).toEqual([5, 5, 2])
  })

  it('chủ đề rỗng → không session nào', () => {
    expect(gomSessionTopic([])).toEqual([])
  })
})

describe('xepBai — boQuaDaDat (ôn chủ đề là luyện tập, không phải chu kỳ SRS)', () => {
  const daXong = [tu('a', 'stage1', ['translate', 'select_dialog', 'listen_fill', 'select_on_describe'])]
  const baiTap = [bai('a', 'translate'), bai('a', 'listen_fill')]

  it('mặc định: từ đã đạt hết bộ bài → không dựng được màn tính điểm', () => {
    const { man } = xepBai({ tu: daXong, baiTap })
    expect(man.filter((m) => m.loai === 'translate' || m.loai === 'listen_fill')).toHaveLength(0)
  })

  it('boQuaDaDat: vẫn dựng đủ màn để luyện lại', () => {
    const { man } = xepBai({ tu: daXong, baiTap, boQuaDaDat: true })
    expect(man.filter((m) => m.loai === 'translate' || m.loai === 'listen_fill')).toHaveLength(2)
  })
})

// ── M10: tách chỗ trống trong câu hội thoại ─────────────────────────────────
describe('tachChoTrong', () => {
  it('quy ước chuẩn: đúng 1 dấu ___ giữa câu', () => {
    expect(tachChoTrong('你今天吃___了吗？')).toEqual({ truoc: '你今天吃', sau: '了吗？' })
  })

  it('dấu ở đầu hoặc cuối câu vẫn đúng', () => {
    expect(tachChoTrong('___很好吃。')).toEqual({ truoc: '', sau: '很好吃。' })
    expect(tachChoTrong('我想买___')).toEqual({ truoc: '我想买', sau: '' })
  })

  it('câu KHÔNG có chỗ trống → sau = null (không chèn ô, chỉ là ngữ cảnh)', () => {
    expect(tachChoTrong('周末你和谁去看电影？')).toEqual({ truoc: '周末你和谁去看电影？', sau: null })
  })

  it('câu có 2 dấu (dữ liệu lệch quy ước) → chèn ở dấu ĐẦU, phần sau giữ NGUYÊN VĂN', () => {
    // Bản cũ dùng split() rồi lấy 2 phần đầu ⇒ nuốt mất đuôi câu, ô trống nhảy lung tung
    expect(tachChoTrong('我和我的___去，他也叫我们的___一起去。')).toEqual({
      truoc: '我和我的',
      sau: '去，他也叫我们的___一起去。',
    })
  })
})

describe('gioiHanNhap (IME tiếng Trung)', () => {
  it('đang gõ IME → KHÔNG cắt, giữ nguyên chữ đã có', () => {
    expect(gioiHanNhap('一杯kafei', 4, true)).toBe('一杯kafei')
  })

  it('gõ xong → cắt về đúng độ dài đáp án', () => {
    expect(gioiHanNhap('一杯咖啡馆', 4, false)).toBe('一杯咖啡')
  })

  it('đếm theo KÝ TỰ hiển thị, không phải mã UTF-16', () => {
    // emoji 4 byte: .length = 2 nhưng chỉ là 1 ký tự
    expect(gioiHanNhap('👍👍👍', 2, false)).toBe('👍👍')
  })

  it('chuỗi ngắn hơn giới hạn → giữ nguyên', () => {
    expect(gioiHanNhap('一杯', 4, false)).toBe('一杯')
  })
})

// ── M11 ─────────────────────────────────────────────────────────────────────
describe('oGoiY (gợi ý lần lượt các ô CHƯA điền)', () => {
  it('chưa điền ô nào: bấm lần 1 lộ ô A, lần 2 lộ thêm ô B', () => {
    expect(oGoiY(1, '', '', true)).toEqual(['a'])
    expect(oGoiY(2, '', '', true)).toEqual(['a', 'b'])
  })

  it('ô A đã điền → gợi ý nhảy thẳng sang ô B (lỗi cũ: mãi chỉ lộ ô A)', () => {
    expect(oGoiY(1, '朋友', '', true)).toEqual(['b'])
  })

  it('cả 2 ô đã điền → không lộ gì', () => {
    expect(oGoiY(2, '朋友', '老师', true)).toEqual([])
  })

  it('bài chỉ có 1 ô (không có từ B) → chỉ lộ ô A', () => {
    expect(oGoiY(3, '', '', false)).toEqual(['a'])
  })

  it('chưa bấm gợi ý → không lộ gì', () => {
    expect(oGoiY(0, '', '', true)).toEqual([])
  })
})

describe('catTheoGioiHan (giới hạn số từ mỗi lượt)', () => {
  const phien = ['a', 'b', 'c', 'd', 'e']

  it('còn chỗ → cắt vừa đủ phần còn lại', () => {
    expect(catTheoGioiHan(phien, 8, 10)).toEqual(['a', 'b'])
  })

  it('chưa ôn từ nào → lấy trọn session nếu giới hạn đủ rộng', () => {
    expect(catTheoGioiHan(phien, 0, 10)).toEqual(phien)
  })

  it('đã đạt giới hạn → rỗng (dừng lượt, sang Tổng kết)', () => {
    expect(catTheoGioiHan(phien, 10, 10)).toEqual([])
    expect(catTheoGioiHan(phien, 12, 10)).toEqual([])
  })
})
