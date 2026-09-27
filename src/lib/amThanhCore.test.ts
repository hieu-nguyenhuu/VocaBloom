/**
 * Test cho amThanhCore.ts — âm thanh phản hồi + cài đặt âm thanh (M17).
 *
 * Ca đáng giá nhất là X2: âm đúng/sai phát NGAY lúc chấm, còn màn bài tập chờ 600/1000ms rồi mới
 * chuyển màn. Âm phải dứt trước khi chuyển, nếu không sẽ đè lên tiếng phát âm của từ kế tiếp.
 * Khoảng chờ nằm ở 4 file màn bài tập, độ dài âm nằm ở đây ⇒ cùng một ràng buộc ở 2 nơi ⇒ test canh.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AM_LUONG_MAC_DINH,
  amKhiCham,
  DS_AM,
  docCaiDatAmThanh,
  duocPhat,
  ghiCaiDatAmThanh,
  KHOANG_CHO_DUNG_MS,
  KHOANG_CHO_SAI_MS,
  macDinhAmThanh,
} from './amThanhCore.ts'

describe('docCaiDatAmThanh', () => {
  it('D1 — chưa từng lưu ⇒ mặc định: bật, 60%, mọi âm bật TRỪ lật thẻ', () => {
    const cd = docCaiDatAmThanh(null)
    expect(cd.bat).toBe(true)
    expect(cd.amLuong).toBe(AM_LUONG_MAC_DINH)
    expect(cd.tung.dung).toBe(true)
    expect(cd.tung.hoan_thanh).toBe(true)
    expect(cd.tung.lat_the).toBe(false)
  })

  it('D2 — JSON hỏng hoặc không phải object ⇒ mặc định, không ném', () => {
    for (const rac of ['{hỏng', '42', '"chuỗi"', '[]', 'null', '']) {
      expect(docCaiDatAmThanh(rac), rac).toEqual(macDinhAmThanh())
    }
  })

  it('D3 — thiếu 1 âm ⇒ tự điền mặc định; âm lạ không có trong danh mục ⇒ bỏ qua', () => {
    const cd = docCaiDatAmThanh(JSON.stringify({ bat: true, amLuong: 50, tung: { sai: false, am_la: true } }))
    expect(cd.tung.sai).toBe(false)
    expect(cd.tung.dung).toBe(true)
    expect(cd.tung.lat_the).toBe(false)
    expect('am_la' in cd.tung).toBe(false)
  })

  it('D4 — âm lượng ngoài 0–100 bị kẹp; không phải số ⇒ mặc định', () => {
    expect(docCaiDatAmThanh(JSON.stringify({ amLuong: 150 })).amLuong).toBe(100)
    expect(docCaiDatAmThanh(JSON.stringify({ amLuong: -20 })).amLuong).toBe(0)
    expect(docCaiDatAmThanh(JSON.stringify({ amLuong: '80' })).amLuong).toBe(AM_LUONG_MAC_DINH)
    expect(docCaiDatAmThanh(JSON.stringify({ amLuong: 42.7 })).amLuong).toBe(43)
  })

  it('D5 — công tắc tổng không phải boolean ⇒ bật', () => {
    expect(docCaiDatAmThanh(JSON.stringify({ bat: 'false' })).bat).toBe(true)
    expect(docCaiDatAmThanh(JSON.stringify({ bat: false })).bat).toBe(false)
  })

  it('D6 — ghi rồi đọc lại giữ nguyên', () => {
    const cd = { ...macDinhAmThanh(), bat: false, amLuong: 25 }
    cd.tung.dung_goi_y = false
    expect(docCaiDatAmThanh(ghiCaiDatAmThanh(cd))).toEqual(cd)
  })
})

describe('amKhiCham', () => {
  it('K1 — sai ⇒ sai; đúng ⇒ đúng; đúng có dùng gợi ý ⇒ dung_goi_y', () => {
    expect(amKhiCham(false, false)).toBe('sai')
    expect(amKhiCham(false, true)).toBe('sai')
    expect(amKhiCham(true, false)).toBe('dung')
    expect(amKhiCham(true, true)).toBe('dung_goi_y')
  })
})

describe('duocPhat', () => {
  it('P1 — công tắc tổng tắt ⇒ không âm nào được phát, dù âm con đang bật', () => {
    const cd = { ...macDinhAmThanh(), bat: false }
    for (const a of DS_AM) expect(duocPhat(a.ma, cd), a.ma).toBe(false)
  })

  it('P2 — tắt 1 âm ⇒ ĐÚNG âm đó im, các âm khác vẫn phát (không có âm thay thế)', () => {
    const cd = macDinhAmThanh()
    cd.tung.dung_goi_y = false
    expect(duocPhat('dung_goi_y', cd)).toBe(false)
    expect(duocPhat('dung', cd)).toBe(true)
    expect(duocPhat('sai', cd)).toBe(true)
  })

  it('P3 — âm lượng 0 ⇒ không phát (khỏi dựng nút âm thanh vô ích)', () => {
    expect(duocPhat('dung', { ...macDinhAmThanh(), amLuong: 0 })).toBe(false)
  })

  it('P4 — lật thẻ mặc định KHÔNG phát', () => {
    expect(duocPhat('lat_the', macDinhAmThanh())).toBe(false)
  })
})

describe('X-amthanh — chống lệch', () => {
  it('X1 — âm phát lúc chấm phải dứt trước khoảng chờ chuyển màn', () => {
    const dai = Object.fromEntries(DS_AM.map((a) => [a.ma, a.daiMs]))
    expect(dai.dung).toBeLessThan(KHOANG_CHO_DUNG_MS)
    expect(dai.dung_goi_y).toBeLessThan(KHOANG_CHO_DUNG_MS)
    expect(dai.sai).toBeLessThan(KHOANG_CHO_SAI_MS)
  })

  it('X2 — 4 màn bài tập vẫn chờ ĐÚNG khoảng mà âm thanh được thiết kế theo', () => {
    // Ai đổi khoảng chờ 600/1000 ở màn bài tập mà quên ở đây thì âm có thể đè lên tiếng phát âm.
    const mau = new RegExp(`\\?\\s*${KHOANG_CHO_DUNG_MS}\\s*:\\s*${KHOANG_CHO_SAI_MS}\\b`)
    for (const f of ['TracNghiem', 'DienTu', 'SapXep', 'HoiThoai']) {
      const src = readFileSync(`src/features/player/bai/${f}.tsx`, 'utf8')
      expect(src, `${f}.tsx không còn chờ ${KHOANG_CHO_DUNG_MS} : ${KHOANG_CHO_SAI_MS}`).toMatch(mau)
    }
  })

  it('X5 — cả 8 màn bài tập đều có gắn âm (ai xoá nhầm khi sửa màn thì test đỏ)', () => {
    const ds = ['TracNghiem', 'DienTu', 'SapXep', 'HoiThoai', 'FastDecision', 'Matching', 'ChamAI', 'Flashcard']
    const thieu = ds.filter(
      (f) => !readFileSync(`src/features/player/bai/${f}.tsx`, 'utf8').includes('phatAmThanh('),
    )
    expect(thieu, `Màn thiếu âm: ${thieu.join(', ')}`).toEqual([])
  })

  it('X3 — danh mục có đúng 7 âm, mã không trùng', () => {
    expect(DS_AM.length).toBe(7)
    expect(new Set(DS_AM.map((a) => a.ma)).size).toBe(7)
  })

  it('X4 — amThanhCore.ts giữ tính thuần: không import react / supabase / node:', () => {
    const src = readFileSync('src/lib/amThanhCore.ts', 'utf8')
    expect(src).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
