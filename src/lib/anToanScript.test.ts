/**
 * Cổng an toàn cho script chạm DATABASE THẬT (M15b).
 *
 * ⚠️ VÌ SAO CÓ FILE NÀY — sự cố ngày 2026-09-24:
 * Script kiểm thử CDP của tôi mở đầu bằng `DELETE /rest/v1/nhat_ky_ngay?ngay=gte.2000-01-01`
 * để "dọn cho sạch trước khi kiểm". Bảng đó đang chứa NHẬT KÝ HỌC THẬT của người dùng ⇒ xoá mất
 * dòng học của chính hôm đó (log Supabase ghi nhận 6 lần DELETE trong 2 phút).
 *
 * Tệ hơn: sau đó tôi đọc bảng, thấy 0 dòng, rồi kết luận "người dùng chưa vào màn Tổng kết" —
 * trong khi số 0 ấy là do chính mình vừa tạo ra. Log `edge_logs` chứng minh ngược lại: hàm
 * `chot_nhat_ky_ngay` đã chạy thành công 2 lần lúc 07:30 và 08:45.
 *
 * → Luật: script chạm DB thật mà KHÔNG chạy trong `begin … rollback` thì CẤM xoá theo phạm vi rộng.
 *   Muốn dọn thì chỉ được xoá đúng dòng do chính script tạo ra.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const THU_MUC = 'scripts'
const dsFile = readdirSync(THU_MUC).filter((f) => f.endsWith('.mjs'))

/** Xoá dữ liệu bằng SQL hoặc bằng PostgREST. */
const XOA = /\btruncate\b|\bdelete\s+from\b|method:\s*['"]DELETE['"]/i

describe('An toàn script chạm DB thật', () => {
  it('AT1 — thư mục scripts/ có file để kiểm (bảo vệ khỏi test rỗng xanh giả)', () => {
    expect(dsFile.length).toBeGreaterThan(5)
  })

  it('AT2 — script nào XOÁ dữ liệu thì BẮT BUỘC chạy trong begin … rollback', () => {
    const viPham: string[] = []
    for (const f of dsFile) {
      const src = readFileSync(`${THU_MUC}/${f}`, 'utf8')
      if (!XOA.test(src)) continue
      if (!/\brollback\b/i.test(src)) viPham.push(f)
    }
    expect(
      viPham,
      `Script xoá dữ liệu mà không có rollback: ${viPham.join(', ')}.\n` +
        'Hoặc bọc trong `begin … rollback`, hoặc chỉ xoá đúng dòng do chính script tạo ra.',
    ).toEqual([])
  })

  it('AT3 — cấm DELETE qua PostgREST theo phạm vi rộng (không rollback được)', () => {
    // PostgREST ghi thẳng, KHÔNG có transaction để rollback ⇒ xoá nhầm là mất vĩnh viễn.
    // Các bộ lọc kiểu `?ngay=gte.2000-01-01` hay `?id=neq.0` nhìn thì có điều kiện nhưng
    // thực chất quét sạch bảng — đúng thứ đã gây ra sự cố 2026-09-24.
    const viPham: string[] = []
    for (const f of dsFile) {
      const src = readFileSync(`${THU_MUC}/${f}`, 'utf8')
      if (!/method:\s*['"]DELETE['"]/i.test(src)) continue
      if (/gte\.(19|20)\d\d-|neq\.0|gt\.0\b/.test(src)) viPham.push(f)
    }
    expect(
      viPham,
      `Script dùng DELETE PostgREST với bộ lọc quét sạch bảng: ${viPham.join(', ')}`,
    ).toEqual([])
  })
})
