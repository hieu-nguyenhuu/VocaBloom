/**
 * Test cho importValidate.ts — SPECIFICATION.md §10.5 + §6.
 *
 * Fixture lỗi KHÔNG chép tay: luôn deep-clone file mẫu thật rồi sửa đúng 1 chỗ.
 * Nhờ vậy khi file mẫu đổi thì test không lệch khỏi thực tế.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateImportFile } from './importValidate.ts'

const THU_MUC = 'import_csv_vocab/references'
const TEN_FILE = [
  'example-output.json',
  'example-output-english-topic.json',
  'example-output-single-word-topic.json',
] as const

function doc(ten: string): unknown {
  return JSON.parse(readFileSync(`${THU_MUC}/${ten}`, 'utf8'))
}

/** Deep-clone file mẫu đầy đủ nhất rồi cho phép sửa 1 chỗ. */
function sua(hamSua: (d: any) => void): unknown {
  const d = structuredClone(doc('example-output.json')) as any
  hamSua(d)
  return d
}

/** Gom mọi đường dẫn lỗi thành 1 chuỗi để assert cho gọn. */
function duongDanLoi(kq: { loi: { duong_dan: string }[] }): string {
  return kq.loi.map((l) => l.duong_dan).join(' | ')
}

describe('validateImportFile', () => {
  it('V1 — 3 file mẫu thật đều hợp lệ, không lỗi', () => {
    for (const ten of TEN_FILE) {
      const kq = validateImportFile(doc(ten))
      expect(kq.loi, `${ten}: ${JSON.stringify(kq.loi)}`).toEqual([])
      expect(kq.hop_le, ten).toBe(true)
    }
  })

  it('V1b — tóm tắt đếm đúng số lượng', () => {
    const kq = validateImportFile(doc('example-output.json'))
    expect(kq.tom_tat).toEqual({
      ten_topic: 'Trái cây',
      so_tu: 5,
      so_bai_tap: 47,
      so_dong_hoi_thoai: 9,
    })
  })

  it('V2 — vocab thiếu meaning_vi thì chặn, báo đúng đường dẫn', () => {
    const kq = validateImportFile(sua((d) => { delete d.vocab[0].meaning_vi }))
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('vocab[0].meaning_vi')
  })

  it('V3 — exercise.type không thuộc 17 enum thì chặn', () => {
    const kq = validateImportFile(sua((d) => { d.exercises[0].type = 'khong_ton_tai' }))
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('exercises[0].type')
  })

  it('V4 — vocab_temp_id trỏ tới temp_id không tồn tại thì chặn', () => {
    const kq = validateImportFile(sua((d) => { d.exercises[0].vocab_temp_id = 'v999' }))
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('exercises[0].vocab_temp_id')
  })

  it('V5 — selection.distractors phải đúng 3 phần tử', () => {
    const kq = validateImportFile(sua((d) => {
      const i = d.exercises.findIndex((e: any) => e.type === 'selection')
      d.exercises[i].payload.distractors = ['chỉ có', 'hai cái']
    }))
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('.payload.distractors')
  })

  it('V6 — dạng không cần payload mà có record thì REJECT cả file', () => {
    const kq = validateImportFile(sua((d) => {
      d.exercises.push({ vocab_temp_id: 'v1', type: 'flashcard', payload: {} })
    }))
    expect(kq.hop_le).toBe(false)
    expect(kq.loi.some((l) => l.thong_diep.includes('flashcard'))).toBe(true)
  })

  it('V7 — payload.blank_b_vocab_id không tồn tại thì chặn', () => {
    const kq = validateImportFile(sua((d) => {
      const i = d.exercises.findIndex((e: any) => e.type === 'select_dialog')
      d.exercises[i].payload.blank_b_vocab_id = 'v999'
    }))
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('.payload.blank_b_vocab_id')
  })

  it('V8 — highlight_vocab_temp_ids chứa temp_id lạ thì chặn', () => {
    const kq = validateImportFile(sua((d) => {
      d.dialogue.lines[0].highlight_vocab_temp_ids = ['v999']
    }))
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('dialogue.lines[0].highlight_vocab_temp_ids')
  })

  it('V9 — temp_id trùng nhau trong mảng vocab thì chặn', () => {
    const kq = validateImportFile(sua((d) => { d.vocab[1].temp_id = d.vocab[0].temp_id }))
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('vocab[1].temp_id')
  })

  it('V10 — từ thiếu bài của dạng khuyến nghị chỉ CẢNH BÁO, không chặn', () => {
    const kq = validateImportFile(sua((d) => {
      d.exercises = d.exercises.filter((e: any) => e.vocab_temp_id !== 'v1')
    }))
    expect(kq.hop_le).toBe(true)
    expect(kq.loi).toEqual([])
    expect(kq.canh_bao.length).toBeGreaterThan(0)
    expect(kq.canh_bao.some((c) => c.duong_dan.includes('v1'))).toBe(true)
  })

  it('V11 — đầu vào không phải object thì chặn, không ném exception', () => {
    for (const rac of [null, 42, 'chuỗi', []]) {
      const kq = validateImportFile(rac)
      expect(kq.hop_le, String(rac)).toBe(false)
      expect(kq.loi.length).toBeGreaterThan(0)
    }
  })
})
