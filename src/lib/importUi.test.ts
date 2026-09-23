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
  tongKetMe,
  type MucFile,
  type TrangThaiImport,
} from './importUi.ts'

const MAU = readFileSync('.claude/skills/vocabCsv2Json/references/example-output.json', 'utf8')

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

describe('giamTrangThai — reducer NHIỀU FILE (M12/Q4, DESIGN.md §5.3)', () => {
  const BAT_DAU: TrangThaiImport = { buoc: 'chon_file' }
  const RPC = { topic_id: 'x', so_tu: 1, so_bai_tap: 2, so_dong_hoi_thoai: 3, so_ngu_phap: 2 }

  /** File hợp lệ đọc từ file mẫu THẬT; file hỏng dùng JSON sai cú pháp. */
  function chon(...ten: string[]) {
    return giamTrangThai(BAT_DAU, {
      loai: 'chon',
      ds: ten.map((t) => ({
        ten_file: t,
        kich_thuoc: 1000,
        ket_qua: docFileImport(t.startsWith('hong') ? 'nope' : MAU),
      })),
    })
  }
  function ds(s: TrangThaiImport): MucFile[] {
    if (s.buoc === 'chon_file') throw new Error(`đang ở ${s.buoc}, không có danh sách file`)
    return s.ds
  }

  it('R1 — chọn 1 file hợp lệ → preview, mang tóm tắt + du_lieu (N=1 là trường hợp riêng)', () => {
    const s = chon('a.json')
    expect(s.buoc).toBe('preview')
    const m = ds(s)[0]!
    expect(m.ten_file).toBe('a.json')
    expect(m.tt).toBe('san_sang')
    if (m.tt !== 'san_sang') return
    expect(m.tom_tat.so_tu).toBeGreaterThan(0)
    expect(m.du_lieu).toEqual(JSON.parse(MAU))
  })

  it('R2 — chọn 3 file trong đó 1 hỏng → 2 san_sang + 1 loi, KHÔNG chặn cả mẻ', () => {
    const s = chon('a.json', 'hong.json', 'b.json')
    expect(s.buoc).toBe('preview')
    expect(ds(s).map((m) => m.tt)).toEqual(['san_sang', 'loi', 'san_sang'])
    const hong = ds(s)[1]!
    if (hong.tt === 'loi') expect(hong.loi[0]?.duong_dan).toBe('(JSON)')
  })

  it('R3 — them_canh_bao chỉ đụng ĐÚNG file được nêu tên', () => {
    const s = giamTrangThai(chon('a.json', 'b.json'), {
      loai: 'them_canh_bao', ten_file: 'b.json', dong: ['x', 'y'],
    })
    const [a, b] = ds(s) as [MucFile, MucFile]
    if (a.tt !== 'san_sang' || b.tt !== 'san_sang') throw new Error('cả 2 phải còn san_sang')
    expect(b.canh_bao.slice(-2)).toEqual(['x', 'y'])
    expect(a.canh_bao).not.toContain('x')
  })

  it('R4 — bo_file xoá đúng 1 dòng; bỏ hết → quay về chon_file', () => {
    const s = giamTrangThai(chon('a.json', 'b.json'), { loai: 'bo_file', ten_file: 'a.json' })
    expect(ds(s).map((m) => m.ten_file)).toEqual(['b.json'])
    expect(giamTrangThai(s, { loai: 'bo_file', ten_file: 'b.json' })).toEqual({ buoc: 'chon_file' })
  })

  it('R5 — xac_nhan chỉ chuyển file san_sang; file lỗi giữ nguyên để bị bỏ qua (Q4)', () => {
    const s = giamTrangThai(chon('a.json', 'hong.json'), { loai: 'xac_nhan' })
    expect(s.buoc).toBe('dang_import')
    expect(ds(s).map((m) => m.tt)).toEqual(['dang_import', 'loi'])
  })

  it('R6 — file_loi giữa mẻ KHÔNG ảnh hưởng file khác; xong_het → ket_qua', () => {
    const dang = giamTrangThai(chon('a.json', 'b.json'), { loai: 'xac_nhan' })
    const sauLoi = giamTrangThai(dang, { loai: 'file_loi', ten_file: 'a.json', loi: 'boom' })
    const sauOk = giamTrangThai(sauLoi, { loai: 'file_ok', ten_file: 'b.json', ket_qua: RPC })
    expect(ds(sauOk).map((m) => m.tt)).toEqual(['that_bai', 'xong'])
    const het = giamTrangThai(sauOk, { loai: 'xong_het' })
    expect(het.buoc).toBe('ket_qua')
    expect(tongKetMe(ds(het))).toEqual({
      so_file_ok: 1, so_file_loi: 1, so_tu: 1, so_bai_tap: 2, so_dong_hoi_thoai: 3, so_ngu_phap: 2,
    })
  })

  it('R7 — thu_lai chỉ đưa file that_bai quay lại, file xong giữ nguyên', () => {
    const dang = giamTrangThai(chon('a.json', 'b.json'), { loai: 'xac_nhan' })
    const s1 = giamTrangThai(dang, { loai: 'file_loi', ten_file: 'a.json', loi: 'boom' })
    const s2 = giamTrangThai(s1, { loai: 'file_ok', ten_file: 'b.json', ket_qua: RPC })
    const lai = giamTrangThai(giamTrangThai(s2, { loai: 'xong_het' }), { loai: 'thu_lai' })
    expect(lai.buoc).toBe('dang_import')
    expect(ds(lai).map((m) => m.tt)).toEqual(['dang_import', 'xong'])
    const a = ds(lai)[0]!
    if (a.tt === 'dang_import') expect(a.du_lieu).toEqual(JSON.parse(MAU))
  })

  it('R8 — tongKetMe cộng dồn số liệu RPC của nhiều file, bỏ qua so_ngu_phap thiếu', () => {
    const dang = giamTrangThai(chon('a.json', 'b.json'), { loai: 'xac_nhan' })
    const s1 = giamTrangThai(dang, { loai: 'file_ok', ten_file: 'a.json', ket_qua: RPC })
    const { so_ngu_phap: _bo, ...rpcCu } = RPC // RPC bản cũ chưa trả so_ngu_phap
    const s2 = giamTrangThai(s1, { loai: 'file_ok', ten_file: 'b.json', ket_qua: rpcCu })
    expect(tongKetMe(ds(s2))).toMatchObject({ so_file_ok: 2, so_tu: 2, so_ngu_phap: 2 })
  })

  it('R9 — chon_file_khac → chon_file; hành động sai bước trả NGUYÊN tham chiếu', () => {
    expect(giamTrangThai(chon('a.json'), { loai: 'chon_file_khac' })).toEqual({ buoc: 'chon_file' })
    expect(giamTrangThai(BAT_DAU, { loai: 'xac_nhan' })).toBe(BAT_DAU)
    const pv = chon('a.json')
    expect(giamTrangThai(pv, { loai: 'file_ok', ten_file: 'a.json', ket_qua: RPC })).toBe(pv)
    expect(giamTrangThai(pv, { loai: 'bo_file', ten_file: 'khong-co.json' })).toBe(pv)
  })

  it('R10 — xac_nhan khi mọi file đều lỗi → không đổi state', () => {
    const chiLoi = chon('hong.json')
    expect(giamTrangThai(chiLoi, { loai: 'xac_nhan' })).toBe(chiLoi)
  })
})

describe('X-import — giữ tính thuần', () => {
  it('importUi.ts không import react / supabase / node:', () => {
    const src = readFileSync('src/lib/importUi.ts', 'utf8')
    expect(src).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
