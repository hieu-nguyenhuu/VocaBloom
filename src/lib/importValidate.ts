/**
 * importValidate.ts — validate file JSON import (SPECIFICATION.md §10.5 + §6).
 *
 * HÀM THUẦN (MB-05): không đọc file, không network, không import React/Supabase,
 * KHÔNG ném exception — mọi vấn đề đều trả về trong kết quả. Nhờ vậy dùng chung
 * được cho cả CLI (Node) lẫn UI Import (browser) mà vẫn test nhanh bằng Vitest.
 *
 * Hai lớp kiểm tra:
 *   Lớp 1 — cấu trúc & kiểu dữ liệu (thứ JSON Schema §10.7 làm được).
 *   Lớp 2 — tham chiếu chéo temp_id (thứ JSON Schema KHÔNG làm được, §10.7 tự thừa nhận).
 */

export type ViTri = { duong_dan: string; thong_diep: string }

export type KetQuaValidate = {
  hop_le: boolean
  loi: ViTri[]
  canh_bao: ViTri[]
  tom_tat: { ten_topic: string; so_tu: number; so_bai_tap: number; so_dong_hoi_thoai: number }
}

const KIEU_HOP_LE = [
  'flashcard', 'grammar', 'matching', 'selection', 'audio_recognition', 'fast_decision',
  'translate', 'select_dialog', 'listen_fill', 'select_on_describe',
  'fill_dialog', 'select_sentence', 'arrange_words', 'trans_collocation',
  'make_sentence', 'trans_sentence', 'complete_situation',
] as const

/** 6 dạng Player đọc thẳng từ vocab — CÓ record trong exercises là sai (DEC-22). */
const KIEU_KHONG_PAYLOAD = new Set([
  'flashcard', 'matching', 'translate', 'listen_fill', 'make_sentence', 'trans_collocation',
])

const FIELD_PAYLOAD_BAT_BUOC: Record<string, string[]> = {
  grammar: ['content_target', 'pinyin', 'content_vi'],
  selection: ['distractors'],
  audio_recognition: ['distractors'],
  fast_decision: ['wrong_meaning'],
  select_on_describe: ['description', 'distractors'],
  select_sentence: ['correct_sentence', 'wrong_sentences'],
  arrange_words: ['tokens'],
  trans_sentence: ['vietnamese_sentence'],
  complete_situation: ['situation_vi', 'given_sentence_zh', 'given_sentence_pinyin'],
  select_dialog: ['dialog_a', 'dialog_b', 'blank_a_answer', 'blank_b_vocab_id', 'distractors'],
  fill_dialog: ['dialog_a', 'dialog_b', 'blank_a_answer', 'blank_b_vocab_id'],
}

/** type -> [tên field mảng, độ dài bắt buộc] */
const DO_DAI_MANG: Record<string, [string, number]> = {
  selection: ['distractors', 3],
  audio_recognition: ['distractors', 3],
  select_on_describe: ['distractors', 3],
  select_dialog: ['distractors', 2],
  select_sentence: ['wrong_sentences', 3],
}

const FIELD_VOCAB_BAT_BUOC = [
  'temp_id', 'word', 'pinyin', 'meaning_vi', 'collocation', 'collocation_pinyin',
  'collocation_meaning_vi', 'example_sentence', 'example_meaning_vi', 'lang',
] as const

/** 9 dạng nên có đủ cho mỗi từ — thiếu chỉ CẢNH BÁO, không chặn (§10.5). */
const DANG_KHUYEN_NGHI = [
  'grammar', 'selection', 'audio_recognition', 'fast_decision', 'select_on_describe',
  'select_sentence', 'arrange_words', 'trans_sentence', 'complete_situation',
] as const

function laObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function laChuoiKhongRong(x: unknown): x is string {
  return typeof x === 'string' && x.trim() !== ''
}

export function validateImportFile(raw: unknown): KetQuaValidate {
  const loi: ViTri[] = []
  const canh_bao: ViTri[] = []
  const tom_tat = { ten_topic: '', so_tu: 0, so_bai_tap: 0, so_dong_hoi_thoai: 0 }
  const bao = (duong_dan: string, thong_diep: string) => loi.push({ duong_dan, thong_diep })

  if (!laObject(raw)) {
    bao('(gốc)', 'File phải là một object JSON, không phải mảng hay giá trị đơn.')
    return { hop_le: false, loi, canh_bao, tom_tat }
  }

  // ── topic ────────────────────────────────────────────────────────────
  const topic = raw['topic']
  if (!laObject(topic) || !laChuoiKhongRong(topic['name'])) {
    bao('topic.name', 'Thiếu hoặc rỗng — mỗi file import phải có đúng 1 topic có tên.')
  } else {
    tom_tat.ten_topic = topic['name']
  }

  // ── vocab (lớp 1) + dựng tập temp_id cho lớp 2 ───────────────────────
  const dsVocab = raw['vocab']
  const tempIdCoThat = new Set<string>()

  if (!Array.isArray(dsVocab) || dsVocab.length === 0) {
    bao('vocab', 'Thiếu mảng vocab hoặc mảng rỗng.')
  } else {
    tom_tat.so_tu = dsVocab.length
    dsVocab.forEach((tu, i) => {
      if (!laObject(tu)) {
        bao(`vocab[${i}]`, 'Phải là object.')
        return
      }
      for (const field of FIELD_VOCAB_BAT_BUOC) {
        if (!(field in tu)) bao(`vocab[${i}].${field}`, 'Thiếu field bắt buộc.')
      }
      const lang = tu['lang']
      if (lang !== 'zh' && lang !== 'en') {
        bao(`vocab[${i}].lang`, `Chỉ nhận 'zh' hoặc 'en', đang là ${JSON.stringify(lang)}.`)
      }
      const tempId = tu['temp_id']
      if (!laChuoiKhongRong(tempId)) {
        bao(`vocab[${i}].temp_id`, 'Thiếu hoặc rỗng — cần để nối exercises/dialogue (§10.2).')
      } else if (tempIdCoThat.has(tempId)) {
        bao(`vocab[${i}].temp_id`, `Trùng với một vocab khác trong cùng file: '${tempId}'.`)
      } else {
        tempIdCoThat.add(tempId)
      }
    })
  }

  // ── exercises (lớp 1 + lớp 2) ────────────────────────────────────────
  const dsBai = raw['exercises']
  const daCoBai = new Map<string, Set<string>>() // temp_id -> tập type đã có

  if (dsBai !== undefined && !Array.isArray(dsBai)) {
    bao('exercises', 'Nếu có thì phải là mảng.')
  } else if (Array.isArray(dsBai)) {
    tom_tat.so_bai_tap = dsBai.length
    dsBai.forEach((bai, i) => {
      const g = `exercises[${i}]`
      if (!laObject(bai)) {
        bao(g, 'Phải là object.')
        return
      }

      const kieu = bai['type']
      const kieuHopLe = typeof kieu === 'string' && (KIEU_HOP_LE as readonly string[]).includes(kieu)
      if (!kieuHopLe) {
        bao(`${g}.type`, `Không thuộc 17 dạng hợp lệ: ${JSON.stringify(kieu)}.`)
      } else if (KIEU_KHONG_PAYLOAD.has(kieu)) {
        bao(g, `Dạng '${kieu}' KHÔNG được có record trong exercises — Player đọc thẳng từ vocab (DEC-22).`)
      }

      // Lớp 2: vocab_temp_id phải tồn tại trong CÙNG file
      const vTempId = bai['vocab_temp_id']
      if (!laChuoiKhongRong(vTempId)) {
        bao(`${g}.vocab_temp_id`, 'Thiếu hoặc rỗng.')
      } else if (!tempIdCoThat.has(vTempId)) {
        bao(`${g}.vocab_temp_id`, `Không có temp_id '${vTempId}' nào trong mảng vocab.`)
      } else if (kieuHopLe) {
        if (!daCoBai.has(vTempId)) daCoBai.set(vTempId, new Set())
        daCoBai.get(vTempId)?.add(kieu)
      }

      if (!kieuHopLe || KIEU_KHONG_PAYLOAD.has(kieu)) return

      // Payload: đủ field theo §6
      const payload = bai['payload']
      const canField = FIELD_PAYLOAD_BAT_BUOC[kieu] ?? []
      if (canField.length > 0 && !laObject(payload)) {
        bao(`${g}.payload`, `Dạng '${kieu}' cần payload là object.`)
        return
      }
      if (!laObject(payload)) return

      for (const field of canField) {
        if (!(field in payload)) bao(`${g}.payload.${field}`, `Dạng '${kieu}' thiếu field này.`)
      }

      // Payload: độ dài mảng cố định
      const luat = DO_DAI_MANG[kieu]
      if (luat) {
        const [tenField, doDai] = luat
        const gt = payload[tenField]
        if (Array.isArray(gt) && gt.length !== doDai) {
          bao(`${g}.payload.${tenField}`, `Phải có đúng ${doDai} phần tử, đang có ${gt.length}.`)
        }
      }

      // Lớp 2: blank_b_vocab_id lồng trong payload
      if ('blank_b_vocab_id' in payload) {
        const bId = payload['blank_b_vocab_id']
        if (!laChuoiKhongRong(bId) || !tempIdCoThat.has(bId)) {
          bao(`${g}.payload.blank_b_vocab_id`,
            `Không có temp_id ${JSON.stringify(bId)} nào trong mảng vocab.`)
        }
      }
    })
  }

  // ── dialogue (lớp 2) ─────────────────────────────────────────────────
  const hoiThoai = raw['dialogue']
  if (hoiThoai !== undefined && hoiThoai !== null) {
    if (!laObject(hoiThoai) || !Array.isArray(hoiThoai['lines'])) {
      bao('dialogue.lines', 'Nếu có dialogue thì phải có mảng lines.')
    } else {
      const dsDong = hoiThoai['lines']
      tom_tat.so_dong_hoi_thoai = dsDong.length
      dsDong.forEach((dong, i) => {
        if (!laObject(dong)) {
          bao(`dialogue.lines[${i}]`, 'Phải là object.')
          return
        }
        const ds = dong['highlight_vocab_temp_ids']
        if (ds === undefined) return
        if (!Array.isArray(ds)) {
          bao(`dialogue.lines[${i}].highlight_vocab_temp_ids`, 'Phải là mảng.')
          return
        }
        for (const id of ds) {
          if (!laChuoiKhongRong(id) || !tempIdCoThat.has(id)) {
            bao(`dialogue.lines[${i}].highlight_vocab_temp_ids`,
              `Không có temp_id ${JSON.stringify(id)} nào trong mảng vocab.`)
          }
        }
      })
    }
  }

  // ── Cảnh báo (KHÔNG chặn): từ thiếu bài của dạng khuyến nghị ─────────
  if (Array.isArray(dsVocab)) {
    for (const tu of dsVocab) {
      if (!laObject(tu)) continue
      const tempId = tu['temp_id']
      if (!laChuoiKhongRong(tempId)) continue
      const daCo = daCoBai.get(tempId) ?? new Set<string>()
      const thieu = DANG_KHUYEN_NGHI.filter((d) => !daCo.has(d))
      if (thieu.length > 0) {
        canh_bao.push({
          duong_dan: `vocab[${tempId}]`,
          thong_diep: `Chưa có bài của ${thieu.length} dạng: ${thieu.join(', ')}.`,
        })
      }
    }
  }

  return { hop_le: loi.length === 0, loi, canh_bao, tom_tat }
}
