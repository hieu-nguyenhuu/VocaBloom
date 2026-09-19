/**
 * Test cho importUi.ts — logic thuần của màn Import (M2b, DESIGN.md §2).
 * Câu chữ cảnh báo/lỗi được assert nguyên văn: đó là giao diện của hàm.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  dichLoiImport,
  dinhDangKB,
  docFileImport,
  dongCanhBao,
  giamTrangThai,
  timTuTrung,
  type TrangThaiImport,
} from './importUi.ts'

const MAU = readFileSync('import_csv_vocab/references/example-output.json', 'utf8')

describe('docFileImport', () => {
  it('file mẫu thật → hợp lệ, có tóm tắt, giữ du_lieu để gửi RPC', () => {
    const kq = docFileImport(MAU)
    expect(kq.hop_le).toBe(true)
    expect(kq.tom_tat.so_tu).toBeGreaterThan(0)
    expect(kq.du_lieu).toEqual(JSON.parse(MAU))
  })
  it('JSON hỏng → 1 lỗi tại (JSON), không ném exception', () => {
    const kq = docFileImport('{"topic": ')
    expect(kq.hop_le).toBe(false)
    expect(kq.loi[0]?.duong_dan).toBe('(JSON)')
  })
  it('JSON đúng cú pháp nhưng sai cấu trúc → lỗi của validator', () => {
    expect(docFileImport('[]').loi[0]?.duong_dan).toBe('(gốc)')
  })
})

describe('timTuTrung', () => {
  it('unique, giữ thứ tự file', () => {
    expect(timTuTrung(['苹果', '香蕉', '苹果', '梨'], ['梨', '苹果'])).toEqual(['苹果', '梨'])
  })
  it('không trùng → rỗng', () => {
    expect(timTuTrung(['a'], ['b'])).toEqual([])
  })
})

describe('dinhDangKB', () => {
  it('42 KB', () => {
    expect(dinhDangKB(43_008)).toBe('42 KB')
  })
  it('dưới 1 KB → 1 KB', () => {
    expect(dinhDangKB(300)).toBe('1 KB')
  })
  it('1.2 MB', () => {
    expect(dinhDangKB(1_258_291)).toBe('1.2 MB')
  })
})

describe('dongCanhBao', () => {
  it('trùng từ → nguyên văn mockup màn 16', () => {
    expect(
      dongCanhBao({ tuTrung: ['苹果', '香蕉'], topicTrung: 0, canhBaoValidator: [], khongKiemTraDuoc: false }),
    ).toEqual(['2 từ trùng với dữ liệu hiện có ("苹果", "香蕉") — vẫn sẽ được thêm mới, không ghi đè.'])
  })
  it('topic trùng + cảnh báo validator + mạng lỗi → mỗi thứ 1 dòng, đúng thứ tự', () => {
    const d = dongCanhBao({
      tuTrung: [],
      topicTrung: 1,
      canhBaoValidator: [{ duong_dan: 'vocab[0]', thong_diep: 'thiếu bài selection' }],
      khongKiemTraDuoc: true,
      tenTopic: 'Trái cây',
    })
    expect(d).toEqual([
      'Đã có topic tên "Trái cây" — sẽ tạo thêm topic mới, không gộp.',
      'vocab[0]: thiếu bài selection',
      'Không kiểm tra được từ trùng (mạng). Vẫn import được.',
    ])
  })
  it('không có gì → rỗng', () => {
    expect(dongCanhBao({ tuTrung: [], topicTrung: 0, canhBaoValidator: [], khongKiemTraDuoc: false })).toEqual([])
  })
})

describe('dichLoiImport', () => {
  it('lỗi từ raise exception (tiếng Việt) → giữ nguyên message', () => {
    expect(
      dichLoiImport({ message: 'exercises: vocab_temp_id "v9" không có trong mảng vocab', code: 'P0001' }),
    ).toBe('exercises: vocab_temp_id "v9" không có trong mảng vocab')
  })
  it('mạng → câu mạng', () => {
    expect(dichLoiImport({ message: 'TypeError: Failed to fetch' })).toBe(
      'Không kết nối được. Kiểm tra mạng rồi thử lại nhé.',
    )
  })
  it('rỗng → câu chung', () => {
    expect(dichLoiImport(null)).toBe('Có lỗi khi import. Thử lại sau nhé.')
  })
})

describe('giamTrangThai — reducer 5 trạng thái (DESIGN.md §2.1)', () => {
  const BAT_DAU: TrangThaiImport = { buoc: 'chon_file' }
  const FILE = { ten_file: 'a.json', kich_thuoc: 1000 }
  const chonOk = () => giamTrangThai(BAT_DAU, { loai: 'chon', ...FILE, ket_qua: docFileImport(MAU) })
  const RPC = { topic_id: 'x', so_tu: 1, so_bai_tap: 2, so_dong_hoi_thoai: 3 }

  it('chon file hợp lệ → preview, mang tóm tắt + cảnh báo validator dạng chuỗi + du_lieu', () => {
    const s = chonOk()
    expect(s.buoc).toBe('preview')
    if (s.buoc !== 'preview') return
    expect(s.ten_file).toBe('a.json')
    expect(s.tom_tat.so_tu).toBeGreaterThan(0)
    expect(s.du_lieu).toEqual(JSON.parse(MAU))
  })
  it('chon file lỗi → loi_file, giữ danh sách lỗi', () => {
    const s = giamTrangThai(BAT_DAU, { loai: 'chon', ...FILE, ket_qua: docFileImport('nope') })
    expect(s.buoc).toBe('loi_file')
    if (s.buoc === 'loi_file') expect(s.loi[0]?.duong_dan).toBe('(JSON)')
  })
  it('them_canh_bao ở preview → nối thêm dòng', () => {
    const s = giamTrangThai(chonOk(), { loai: 'them_canh_bao', dong: ['x', 'y'] })
    if (s.buoc === 'preview') expect(s.canh_bao.slice(-2)).toEqual(['x', 'y'])
    else throw new Error('phải còn ở preview')
  })
  it('huy / chon_file_khac → chon_file', () => {
    expect(giamTrangThai(chonOk(), { loai: 'huy' })).toEqual({ buoc: 'chon_file' })
    const loi = giamTrangThai(BAT_DAU, { loai: 'chon', ...FILE, ket_qua: docFileImport('nope') })
    expect(giamTrangThai(loi, { loai: 'chon_file_khac' })).toEqual({ buoc: 'chon_file' })
  })
  it('xac_nhan → dang_import → import_ok → ket_qua_ok mang số liệu RPC', () => {
    const dang = giamTrangThai(chonOk(), { loai: 'xac_nhan' })
    expect(dang.buoc).toBe('dang_import')
    const ok = giamTrangThai(dang, { loai: 'import_ok', ket_qua: RPC })
    expect(ok).toEqual({ buoc: 'ket_qua_ok', ten_topic: docFileImport(MAU).tom_tat.ten_topic, ket_qua: RPC })
  })
  it('import_loi → ket_qua_loi giữ du_lieu; thu_lai → dang_import lại với cùng du_lieu', () => {
    const dang = giamTrangThai(chonOk(), { loai: 'xac_nhan' })
    const loi = giamTrangThai(dang, { loai: 'import_loi', loi: 'boom' })
    expect(loi.buoc).toBe('ket_qua_loi')
    if (loi.buoc !== 'ket_qua_loi') return
    expect(loi.loi).toBe('boom')
    const lai = giamTrangThai(loi, { loai: 'thu_lai' })
    expect(lai.buoc).toBe('dang_import')
    if (lai.buoc === 'dang_import') expect(lai.du_lieu).toEqual(loi.du_lieu)
  })
  it('hành động sai bước → trả nguyên state (không đổi tham chiếu)', () => {
    expect(giamTrangThai(BAT_DAU, { loai: 'xac_nhan' })).toBe(BAT_DAU)
    const pv = chonOk()
    expect(giamTrangThai(pv, { loai: 'import_ok', ket_qua: RPC })).toBe(pv)
  })
})

describe('X-import — giữ tính thuần', () => {
  it('importUi.ts không import react / supabase / node:', () => {
    const src = readFileSync('src/lib/importUi.ts', 'utf8')
    expect(src).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
