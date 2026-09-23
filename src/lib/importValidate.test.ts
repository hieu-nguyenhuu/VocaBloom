/**
 * Test cho importValidate.ts — SPECIFICATION.md §10.5 + §6.
 *
 * Fixture lỗi KHÔNG chép tay: luôn deep-clone file mẫu thật rồi sửa đúng 1 chỗ.
 * Nhờ vậy khi file mẫu đổi thì test không lệch khỏi thực tế.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateImportFile } from './importValidate.ts'

const THU_MUC = '.claude/skills/vocabCsv2Json/references'
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
      so_ngu_phap: 0,
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

/**
 * M12 — ngữ pháp CỦA CHỦ ĐỀ (DESIGN.md §4.2): khoá `grammar` ngang hàng `dialogue`, TUỲ CHỌN.
 * Khác hẳn ngữ pháp CỦA TỪ (`exercises[].type = 'grammar'`, gắn với 1 vocab).
 */
describe('validateImportFile — ngữ pháp chủ đề (M12)', () => {
  const MUC_DU = {
    content_target: '一…也/都 + 不/没 …',
    pinyin: 'yī … yě/dōu + bù/méi …',
    content_vi: 'Nhấn mạnh phủ định tuyệt đối: một … cũng không …',
  }

  it('G1 — file KHÔNG có khoá grammar vẫn hợp lệ, so_ngu_phap = 0', () => {
    const kq = validateImportFile(doc('example-output.json'))
    expect(kq.hop_le).toBe(true)
    expect(kq.tom_tat.so_ngu_phap).toBe(0)
  })

  it('G2 — grammar không phải mảng thì chặn', () => {
    const kq = validateImportFile(sua((d) => { d.grammar = { content_target: 'x' } }))
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('grammar')
  })

  it('G3 — thiếu content_target hoặc content_vi rỗng thì chặn, báo đúng đường dẫn', () => {
    const kq = validateImportFile(sua((d) => {
      d.grammar = [{ pinyin: null, content_vi: '  ' }]
    }))
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('grammar[0].content_target')
    expect(duongDanLoi(kq)).toContain('grammar[0].content_vi')
  })

  it('G4 — thiếu hẳn key pinyin thì chặn; để null thì hợp lệ', () => {
    const { pinyin: _bo, ...thieuPinyin } = MUC_DU
    const xau = validateImportFile(sua((d) => { d.grammar = [thieuPinyin] }))
    expect(xau.hop_le).toBe(false)
    expect(duongDanLoi(xau)).toContain('grammar[0].pinyin')

    const tot = validateImportFile(sua((d) => { d.grammar = [{ ...MUC_DU, pinyin: null }] }))
    expect(tot.loi).toEqual([])
  })

  it('G5 — 2 mục hợp lệ thì đếm vào tóm tắt', () => {
    const kq = validateImportFile(sua((d) => {
      d.grammar = [MUC_DU, { ...MUC_DU, content_target: 'V + 着 + V' }]
    }))
    expect(kq.loi).toEqual([])
    expect(kq.tom_tat.so_ngu_phap).toBe(2)
  })

  it('G6 — có ví dụ mà thiếu phiên âm thì CẢNH BÁO, không chặn', () => {
    const kq = validateImportFile(sua((d) => {
      d.grammar = [{ ...MUC_DU, vi_du: '我一个人也不认识。', vi_du_vi: 'Tôi không quen ai cả.' }]
    }))
    expect(kq.hop_le).toBe(true)
    expect(kq.canh_bao.some((c) => c.duong_dan === 'grammar[0].vi_du_pinyin')).toBe(true)
  })

  it('G7 — grammar KHÔNG còn nằm trong danh sách dạng bài khuyến nghị của TỪ (Q1)', () => {
    // Từ nào cũng bắt có `grammar` chính là nguyên nhân "từ nào cũng có ngữ pháp" (DESIGN §2).
    const kq = validateImportFile(sua((d) => {
      d.exercises = d.exercises.filter((b: { type: string }) => b.type !== 'grammar')
    }))
    expect(kq.canh_bao.some((c) => c.thong_diep.includes('grammar'))).toBe(false)
  })
})

/**
 * M13 — SIẾT VALIDATOR CỦA APP lên ngang `import-schema.json`.
 *
 * Bối cảnh (audit 2026-09-23): JSON Schema kiểm rất chặt (shape từng phần tử, minLength,
 * điều kiện lang=zh ⇒ pinyin), NHƯNG schema đó chỉ chạy NGOÀI app, trong skill, và cần cài
 * ajv/jsonschema. Nút Import của app dùng `importValidate.ts` — vốn chỉ kiểm KEY CÓ MẶT.
 * Đo thật: 13/13 file dị dạng đều lọt. Đây đúng là lớp lỗi đã gây ra MB-21
 * (`arrange_words` đọc `text` nhưng payload ghi `word` ⇒ chip mất chữ Hán).
 */
describe('validateImportFile — siết shape (M13)', () => {
  const sua1 = (ham: (d: any) => void) => validateImportFile(sua(ham))
  const bai = (d: any, loai: string) => d.exercises.find((x: any) => x.type === loai)

  it('S1 — vocab: word/meaning_vi rỗng hoặc sai kiểu thì CHẶN', () => {
    expect(sua1((d) => { d.vocab[0].word = '' }).hop_le).toBe(false)
    expect(sua1((d) => { d.vocab[0].meaning_vi = '   ' }).hop_le).toBe(false)
    expect(sua1((d) => { d.vocab[0].word = 123 }).hop_le).toBe(false)
  })

  it('S2 — vocab lang=zh: pinyin / collocation_pinyin KHÔNG được null', () => {
    expect(sua1((d) => { d.vocab[0].pinyin = null }).hop_le).toBe(false)
    expect(sua1((d) => { d.vocab[0].collocation_pinyin = null }).hop_le).toBe(false)
  })

  it('S2b — vocab lang=en: pinyin null là HỢP LỆ (không được chặn nhầm)', () => {
    const kq = validateImportFile(doc('example-output-english-topic.json'))
    expect(kq.loi).toEqual([])
  })

  it('S3 — distractors của select_on_describe phải là {word,pinyin}, không phải chuỗi', () => {
    expect(sua1((d) => { bai(d, 'select_on_describe').payload.distractors = ['a', 'b', 'c'] }).hop_le).toBe(false)
  })

  it('S4 — tokens của arrange_words phải dùng khoá `text` (đúng bug MB-21)', () => {
    const kq = sua1((d) => {
      const b = bai(d, 'arrange_words')
      b.payload.tokens = b.payload.tokens.map((t: any) => ({ word: t.text, pinyin: t.pinyin }))
    })
    expect(kq.hop_le).toBe(false)
    expect(duongDanLoi(kq)).toContain('tokens')
  })

  it('S5 — select_sentence: correct_sentence/wrong_sentences phải là {text,pinyin}', () => {
    expect(sua1((d) => { bai(d, 'select_sentence').payload.correct_sentence = 'xin chào' }).hop_le).toBe(false)
    expect(sua1((d) => { bai(d, 'select_sentence').payload.wrong_sentences = ['a', 'b', 'c'] }).hop_le).toBe(false)
  })

  it('S6 — select_dialog: distractors phải là {word,pinyin} và ĐÒI key *_pinyin', () => {
    expect(sua1((d) => { bai(d, 'select_dialog').payload.distractors = ['a', 'b'] }).hop_le).toBe(false)
    expect(sua1((d) => { delete bai(d, 'select_dialog').payload.dialog_a_pinyin }).hop_le).toBe(false)
    expect(sua1((d) => { delete bai(d, 'fill_dialog').payload.dialog_b_pinyin }).hop_le).toBe(false)
  })

  it('S7 — chuỗi rỗng trong payload thì CHẶN', () => {
    expect(sua1((d) => { bai(d, 'grammar').payload.content_vi = '' }).hop_le).toBe(false)
    expect(sua1((d) => { bai(d, 'trans_sentence').payload.vietnamese_sentence = '  ' }).hop_le).toBe(false)
    expect(sua1((d) => { bai(d, 'arrange_words').payload.tokens = [] }).hop_le).toBe(false)
  })

  it('S8 — dialogue: dòng thiếu text_zh / speaker lạ / lines rỗng', () => {
    expect(sua1((d) => { delete d.dialogue.lines[0].text_zh }).hop_le).toBe(false)
    expect(sua1((d) => { d.dialogue.lines[0].speaker = 'C' }).hop_le).toBe(false)
    expect(sua1((d) => { d.dialogue.lines = [] }).hop_le).toBe(false)
  })

  it('S9 — blank_b_vocab_id trỏ về CHÍNH từ A thì chặn (bài 2 từ phải là 2 từ khác nhau)', () => {
    const kq = sua1((d) => {
      const b = bai(d, 'select_dialog')
      b.payload.blank_b_vocab_id = b.vocab_temp_id
    })
    expect(kq.hop_le).toBe(false)
  })

  it('S10 — 2 bài CÙNG dạng cho CÙNG 1 từ → cảnh báo (Player sẽ dựng 2 màn trùng)', () => {
    const kq = sua1((d) => { d.exercises.push(JSON.parse(JSON.stringify(bai(d, 'selection')))) })
    expect(kq.canh_bao.some((c) => /trùng/i.test(c.thong_diep))).toBe(true)
  })

  it('S11 — CHỐNG LỆCH: field bắt buộc của TS phải phủ đúng field bắt buộc của JSON Schema', () => {
    const schema = JSON.parse(readFileSync(`${THU_MUC}/import-schema.json`, 'utf8'))
    const ten: Record<string, string> = {
      grammar: 'payloadGrammar', selection: 'payloadDistractorsOnly',
      audio_recognition: 'payloadDistractorsOnly', fast_decision: 'payloadFastDecision',
      select_on_describe: 'payloadSelectOnDescribe', select_sentence: 'payloadSelectSentence',
      arrange_words: 'payloadArrangeWords', trans_sentence: 'payloadTransSentence',
      complete_situation: 'payloadCompleteSituation', select_dialog: 'payloadSelectDialog',
      fill_dialog: 'payloadFillDialog',
    }
    for (const [loai, def] of Object.entries(ten)) {
      const canCo: string[] = schema.$defs[def].required ?? []
      // Thiếu 1 field ⇒ validator TS phải báo lỗi, đúng bằng chứng "phủ được"
      for (const f of canCo) {
        const kq = sua1((d) => { delete bai(d, loai)?.payload?.[f] })
        expect(kq.hop_le, `${loai}.${f} bị xoá mà validator vẫn cho qua`).toBe(false)
      }
    }
  })
})
