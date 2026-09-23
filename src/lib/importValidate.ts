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
  tom_tat: {
    ten_topic: string
    so_tu: number
    so_bai_tap: number
    so_dong_hoi_thoai: number
    /** M12 — số mục ngữ pháp CỦA CHỦ ĐỀ (khoá `grammar`), khác hẳn exercise_type 'grammar'. */
    so_ngu_phap: number
  }
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

/**
 * Luật cho TỪNG field của payload (M13) — 1 nguồn sự thật thay cho 2 bảng rời trước đây.
 *
 * ⚠️ Vì sao phải kiểm tới SHAPE chứ không chỉ "key có mặt": `import-schema.json` kiểm rất chặt
 * nhưng nó chạy NGOÀI app (trong skill, cần cài ajv). Nút Import của app chỉ chạy file này.
 * Đo thật 2026-09-23: 13/13 file dị dạng lọt qua bản cũ — đúng lớp lỗi đã gây ra MB-21
 * (`arrange_words` đọc khoá `text` nhưng payload ghi `word` ⇒ chip mất chữ Hán, chấm luôn sai).
 *
 *   'chuoi'            — chuỗi KHÔNG rỗng
 *   'chuoi_hoac_null'  — KEY bắt buộc có mặt, giá trị chuỗi hoặc null (dùng cho phiên âm, §6.5)
 *   'temp_id'          — chuỗi không rỗng, phải khớp temp_id có thật (kiểm ở lớp 2)
 *   ['mang_chuoi', n]  — mảng đúng n chuỗi không rỗng
 *   ['mang_tu', n]     — mảng đúng n object { word, pinyin }
 *   ['mang_cau', n]    — mảng đúng n object { text, pinyin }; n = 0 nghĩa là "ít nhất 2"
 *   'cau'              — 1 object { text, pinyin }
 */
type LuatField = 'chuoi' | 'chuoi_hoac_null' | 'temp_id' | 'cau' | [string, number]

const LUAT_PAYLOAD: Record<string, Record<string, LuatField>> = {
  grammar: { content_target: 'chuoi', pinyin: 'chuoi_hoac_null', content_vi: 'chuoi' },
  selection: { distractors: ['mang_chuoi', 3] },
  audio_recognition: { distractors: ['mang_chuoi', 3] },
  fast_decision: { wrong_meaning: 'chuoi' },
  select_on_describe: { description: 'chuoi', distractors: ['mang_tu', 3] },
  select_sentence: { correct_sentence: 'cau', wrong_sentences: ['mang_cau', 3] },
  arrange_words: { tokens: ['mang_cau', 0] },
  trans_sentence: { vietnamese_sentence: 'chuoi' },
  complete_situation: {
    situation_vi: 'chuoi',
    given_sentence_zh: 'chuoi',
    given_sentence_pinyin: 'chuoi_hoac_null',
  },
  select_dialog: {
    dialog_a: 'chuoi', dialog_a_pinyin: 'chuoi_hoac_null',
    dialog_b: 'chuoi', dialog_b_pinyin: 'chuoi_hoac_null',
    blank_a_answer: 'chuoi', blank_b_vocab_id: 'temp_id', distractors: ['mang_tu', 2],
  },
  fill_dialog: {
    dialog_a: 'chuoi', dialog_a_pinyin: 'chuoi_hoac_null',
    dialog_b: 'chuoi', dialog_b_pinyin: 'chuoi_hoac_null',
    blank_a_answer: 'chuoi', blank_b_vocab_id: 'temp_id',
  },
}

const FIELD_VOCAB_BAT_BUOC = [
  'temp_id', 'word', 'pinyin', 'meaning_vi', 'collocation', 'collocation_pinyin',
  'collocation_meaning_vi', 'example_sentence', 'example_meaning_vi', 'lang',
] as const

/** Phải là chuỗi KHÔNG rỗng (M13). */
const FIELD_VOCAB_CHUOI = [
  'temp_id', 'word', 'meaning_vi', 'collocation',
  'collocation_meaning_vi', 'example_sentence', 'example_meaning_vi',
] as const

/** Phiên âm: chuỗi hoặc null; lang=zh thì bắt buộc có nội dung (§6.5). */
const FIELD_VOCAB_PHIEN_AM = ['pinyin', 'collocation_pinyin'] as const

/**
 * 8 dạng nên có đủ cho mỗi từ — thiếu chỉ CẢNH BÁO, không chặn (§10.5).
 *
 * M12/Q1: `grammar` (ngữ pháp CỦA TỪ) đã được BỎ khỏi danh sách này — nó là dạng CÓ ĐIỀU KIỆN,
 * chỉ gắn cho từ thực sự có điểm dễ dùng sai. Bắt mọi từ phải có `grammar` chính là nguyên nhân
 * khiến "từ nào cũng có ngữ pháp" (DESIGN.md §2).
 */
const DANG_KHUYEN_NGHI = [
  'selection', 'audio_recognition', 'fast_decision', 'select_on_describe',
  'select_sentence', 'arrange_words', 'trans_sentence', 'complete_situation',
] as const

function laObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function laChuoiKhongRong(x: unknown): x is string {
  return typeof x === 'string' && x.trim() !== ''
}

/**
 * Cặp "nội dung + phiên âm" (§6.5): `{ word, pinyin }` cho từ, `{ text, pinyin }` cho câu.
 * KEY `pinyin` phải có mặt (null hợp lệ khi lang = en); dùng SAI khoá chính là bug MB-21.
 */
function laCap(x: unknown, khoa: 'word' | 'text'): boolean {
  if (!laObject(x)) return false
  if (!laChuoiKhongRong(x[khoa])) return false
  if (!('pinyin' in x)) return false
  const p = x['pinyin']
  return p === null || typeof p === 'string'
}

export function validateImportFile(raw: unknown): KetQuaValidate {
  const loi: ViTri[] = []
  const canh_bao: ViTri[] = []
  const tom_tat = { ten_topic: '', so_tu: 0, so_bai_tap: 0, so_dong_hoi_thoai: 0, so_ngu_phap: 0 }
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

      // M13 — kiểm GIÁ TRỊ, không chỉ kiểm key có mặt. `word: ''` hay `word: 123` từng lọt hết.
      for (const field of FIELD_VOCAB_CHUOI) {
        if (field in tu && !laChuoiKhongRong(tu[field])) {
          bao(`vocab[${i}].${field}`, 'Phải là chuỗi không rỗng.')
        }
      }
      for (const field of FIELD_VOCAB_PHIEN_AM) {
        if (!(field in tu)) continue
        const gt = tu[field]
        if (gt !== null && typeof gt !== 'string') {
          bao(`vocab[${i}].${field}`, 'Phải là chuỗi hoặc null.')
        } else if (lang === 'zh' && !laChuoiKhongRong(gt)) {
          // §6.5 + JSON Schema: lang=zh thì phiên âm BẮT BUỘC có nội dung thật
          bao(`vocab[${i}].${field}`, 'Từ tiếng Trung bắt buộc có phiên âm (không được null/rỗng).')
        }
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
  const daThayCap = new Set<string>() // `${temp_id}|${type}` — bắt bài trùng dạng cho cùng 1 từ

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

      // Payload: kiểm ĐỦ FIELD + ĐÚNG SHAPE theo §6 (M13 — xem ghi chú ở LUAT_PAYLOAD)
      const payload = bai['payload']
      const luatCua = LUAT_PAYLOAD[kieu] ?? {}
      const coLuat = Object.keys(luatCua).length > 0
      if (coLuat && !laObject(payload)) {
        bao(`${g}.payload`, `Dạng '${kieu}' cần payload là object.`)
        return
      }
      if (!laObject(payload)) return

      for (const [field, luat] of Object.entries(luatCua)) {
        const duong = `${g}.payload.${field}`
        if (!(field in payload)) {
          bao(duong, `Dạng '${kieu}' thiếu field này.`)
          continue
        }
        const gt = payload[field]

        if (luat === 'chuoi') {
          if (!laChuoiKhongRong(gt)) bao(duong, 'Phải là chuỗi không rỗng.')
          continue
        }
        if (luat === 'chuoi_hoac_null') {
          // Phiên âm: KEY luôn phải có; null hợp lệ khi lang = en (§6.5)
          if (gt !== null && typeof gt !== 'string') bao(duong, 'Phải là chuỗi hoặc null.')
          continue
        }
        if (luat === 'temp_id') {
          if (!laChuoiKhongRong(gt) || !tempIdCoThat.has(gt)) {
            bao(duong, `Không có temp_id ${JSON.stringify(gt)} nào trong mảng vocab.`)
          } else if (gt === bai['vocab_temp_id']) {
            // Bài 2 TỪ (§4.4) mà cả 2 chỗ trống trỏ về cùng 1 từ ⇒ Player ghi log 2 lần cho 1 từ
            bao(duong, 'Trỏ về chính từ của bài này — bài 2 từ phải là 2 từ KHÁC nhau.')
          }
          continue
        }
        if (luat === 'cau') {
          if (!laCap(gt, 'text')) bao(duong, 'Phải là object { text, pinyin } (key pinyin luôn có mặt).')
          continue
        }

        // Còn lại là mảng: ['mang_chuoi' | 'mang_tu' | 'mang_cau', số phần tử]
        const [kieuMang, soLuong] = luat
        if (!Array.isArray(gt)) {
          bao(duong, 'Phải là mảng.')
          continue
        }
        if (soLuong > 0 && gt.length !== soLuong) {
          bao(duong, `Phải có đúng ${soLuong} phần tử, đang có ${gt.length}.`)
        } else if (soLuong === 0 && gt.length < 2) {
          bao(duong, `Phải có ít nhất 2 phần tử, đang có ${gt.length}.`)
        }
        gt.forEach((pt, k) => {
          if (kieuMang === 'mang_chuoi') {
            if (!laChuoiKhongRong(pt)) bao(`${duong}[${k}]`, 'Phải là chuỗi không rỗng.')
          } else if (kieuMang === 'mang_tu') {
            if (!laCap(pt, 'word')) bao(`${duong}[${k}]`, 'Phải là object { word, pinyin } — KHÔNG phải chuỗi.')
          } else if (kieuMang === 'mang_cau') {
            if (!laCap(pt, 'text')) bao(`${duong}[${k}]`, 'Phải là object { text, pinyin } — chú ý khoá là `text`, không phải `word`.')
          }
        })
      }

      // Cảnh báo: 2 bài CÙNG dạng cho CÙNG 1 từ ⇒ Player dựng 2 màn trùng nhau
      if (laChuoiKhongRong(vTempId)) {
        const khoa = `${vTempId}|${kieu}`
        if (daThayCap.has(khoa)) {
          canh_bao.push({
            duong_dan: g,
            thong_diep: `Trùng: từ '${vTempId}' đã có một bài '${kieu}' khác trong file này.`,
          })
        }
        daThayCap.add(khoa)
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
      // M13: có khoá `dialogue` mà 0 dòng thì RPC bỏ qua, người dùng tưởng đã nhập hội thoại
      if (dsDong.length === 0) {
        bao('dialogue.lines', 'Mảng rỗng — bỏ hẳn khoá `dialogue` nếu chủ đề không có hội thoại.')
      }
      dsDong.forEach((dong, i) => {
        if (!laObject(dong)) {
          bao(`dialogue.lines[${i}]`, 'Phải là object.')
          return
        }
        // M13 — nội dung câu là thứ Player hiển thị; thiếu thì màn hội thoại ra dòng trống
        if (!laChuoiKhongRong(dong['text_zh'])) {
          bao(`dialogue.lines[${i}].text_zh`, 'Phải là chuỗi không rỗng (giữ tên field này kể cả topic tiếng Anh).')
        }
        if (dong['speaker'] !== 'A' && dong['speaker'] !== 'B') {
          bao(`dialogue.lines[${i}].speaker`, `Chỉ nhận 'A' hoặc 'B', đang là ${JSON.stringify(dong['speaker'])}.`)
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

  // ── grammar: ngữ pháp CỦA CHỦ ĐỀ (M12) ───────────────────────────────
  // Thực thể riêng, không gắn vocab nào ⇒ không có lớp 2 (temp_id). Khoá TUỲ CHỌN.
  const dsNguPhap = raw['grammar']
  if (dsNguPhap !== undefined && dsNguPhap !== null) {
    if (!Array.isArray(dsNguPhap)) {
      bao('grammar', 'Nếu có grammar thì phải là mảng các mục ngữ pháp của chủ đề.')
    } else {
      tom_tat.so_ngu_phap = dsNguPhap.length
      dsNguPhap.forEach((muc, i) => {
        if (!laObject(muc)) {
          bao(`grammar[${i}]`, 'Phải là object.')
          return
        }
        if (!laChuoiKhongRong(muc['content_target'])) {
          bao(`grammar[${i}].content_target`, 'Thiếu hoặc rỗng — nội dung ngữ pháp bằng ngôn ngữ đích.')
        }
        if (!laChuoiKhongRong(muc['content_vi'])) {
          bao(`grammar[${i}].content_vi`, 'Thiếu hoặc rỗng — giải thích tiếng Việt.')
        }
        // Cùng quy ước với payload `grammar` của từ: KEY phải tồn tại, giá trị null khi lang = en.
        if (!('pinyin' in muc)) {
          bao(`grammar[${i}].pinyin`, 'Thiếu key (dùng null nếu lang = en).')
        }
        // Chỉ nhắc phiên âm khi mục NÀY có pinyin (tức topic tiếng Trung). Topic tiếng Anh
        // để pinyin = null thì câu ví dụ cũng không có phiên âm — nhắc là nhắc nhầm.
        if (
          laChuoiKhongRong(muc['pinyin']) &&
          laChuoiKhongRong(muc['vi_du']) &&
          !laChuoiKhongRong(muc['vi_du_pinyin'])
        ) {
          canh_bao.push({
            duong_dan: `grammar[${i}].vi_du_pinyin`,
            thong_diep: 'Có câu ví dụ nhưng thiếu phiên âm.',
          })
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
