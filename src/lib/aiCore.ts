/**
 * Logic AI THUẦN (M5) — không fetch, không Supabase, không React; `ai.ts` lo phần I/O.
 * Toàn bộ prompt và luật đọc response nằm ở đây để test được (CLAUDE.md Bước 3).
 *
 * AI trong app chỉ làm đúng 2 việc (productContext §3): chấm bài tự luận stage 3 (§7) và
 * giải thích khi người dùng bấm nút (§8). TUYỆT ĐỐI không gen nội dung bài tập runtime.
 */

export type Verdict = 'good' | 'acceptable' | 'fail'

const VERDICT_HOP_LE: ReadonlySet<string> = new Set(['good', 'acceptable', 'fail'])

/**
 * §7.4: parse JSON; hỏng → strip code-fence rồi parse LẠI ĐÚNG 1 LẦN; vẫn hỏng → null.
 * Cố ý KHÔNG dò tìm JSON lẫn trong văn xuôi — thà báo lỗi để người dùng "Chấm lại" còn hơn đoán sai.
 */
export function docJsonAI(text: string): unknown | null {
  const thu = (s: string): unknown | undefined => {
    try {
      return JSON.parse(s) as unknown
    } catch {
      return undefined
    }
  }
  const lan1 = thu(text.trim())
  if (lan1 !== undefined) return lan1
  const daStrip = text
    .trim()
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/\s*```$/, '')
  const lan2 = thu(daStrip)
  return lan2 === undefined ? null : lan2
}

/** §7.3: `good` và `acceptable` đều FULL điểm; chỉ `fail` mới 0 điểm. */
export function dungTuVerdict(v: Verdict): boolean {
  return v !== 'fail'
}

export { VERDICT_HOP_LE }

// ── Đọc kết quả chấm (§7.2) ────────────────────────────────────────────────

export type KetQuaCham = {
  vocab_id: string
  verdict: Verdict
  used_vocab_correctly: boolean
  is_translation_request: boolean
  feedback_vi: string
  improved_sentence: string | null
}

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '')
const bool = (v: unknown): boolean => v === true

/**
 * Chuẩn hoá response §7.2 về shape chắc chắn. Mọi giá trị lạ đều quy về an toàn:
 * verdict không thuộc 3 nhãn → `fail` (không cộng điểm nhầm).
 * `thieu` = id mà AI không trả về → tầng gọi KHÔNG ghi điểm cho từ đó và hiện nút "Chấm lại" (§7.4).
 */
export function docKetQuaCham(text: string, ids: string[]): { ok: KetQuaCham[]; thieu: string[] } {
  const raw = docJsonAI(text) as { results?: unknown } | null
  const ds = Array.isArray(raw?.results) ? (raw.results as unknown[]) : []
  const ok: KetQuaCham[] = []
  for (const r of ds) {
    if (typeof r !== 'object' || r === null) continue
    const o = r as Record<string, unknown>
    const id = chuoi(o['vocab_id'])
    if (!id || !ids.includes(id) || ok.some((x) => x.vocab_id === id)) continue
    const v = chuoi(o['verdict'])
    ok.push({
      vocab_id: id,
      verdict: (VERDICT_HOP_LE.has(v) ? v : 'fail') as Verdict,
      used_vocab_correctly: bool(o['used_vocab_correctly']),
      is_translation_request: bool(o['is_translation_request']),
      feedback_vi: chuoi(o['feedback_vi']),
      improved_sentence: chuoi(o['improved_sentence']) || null,
    })
  }
  return { ok, thieu: ids.filter((id) => !ok.some((x) => x.vocab_id === id)) }
}

// ── Prompt chấm bài (§7.3) ─────────────────────────────────────────────────

export type DangBaiAI = 'make_sentence' | 'trans_sentence' | 'complete_situation'

const LUAT_CHUNG = `Bạn là giáo viên chấm bài viết của người Việt đang học ngoại ngữ.
Chấm theo 3 mức:
- "good": đúng ngữ pháp và tự nhiên.
- "acceptable": dùng đúng từ vựng nhưng còn gượng — BẮT BUỘC kèm "improved_sentence".
- "fail": sai ngữ pháp nặng, không dùng từ vựng cần luyện, hoặc bỏ trống.
Nếu câu trả lời là tiếng Việt đặt trong ngoặc đơn (...) thì luôn "fail",
"is_translation_request" = true và "improved_sentence" là bản dịch sang ngôn ngữ đích.
"feedback_vi" viết bằng tiếng Việt, tối đa 2 câu, giọng nhẹ nhàng khích lệ.
CHỈ trả JSON thuần đúng schema sau, KHÔNG markdown, KHÔNG giải thích thêm:
{"results":[{"vocab_id":"...","verdict":"good|acceptable|fail","used_vocab_correctly":true,"is_translation_request":false,"feedback_vi":"...","improved_sentence":null}]}`

const MO_TA_DANG: Record<DangBaiAI, string> = {
  make_sentence: 'Người học tự đặt câu chứa từ vựng cho trước.',
  trans_sentence:
    'Người học dịch câu tiếng Việt cho trước sang ngôn ngữ đích; câu dịch phải chứa từ vựng cần luyện.',
  complete_situation:
    'Người học viết 1-3 câu hoàn thành tình huống cho trước; bài viết phải chứa từ vựng cần luyện.',
}

export function promptCham(dang: DangBaiAI): string {
  return `${MO_TA_DANG[dang]}\n\n${LUAT_CHUNG}`
}

export type ItemCham = {
  vocab_id: string
  word: string
  meaning_vi: string
  user_answer: string
  de_bai?: string
}

export type BodyAI = {
  model: string
  temperature: number
  messages: { role: 'system' | 'user'; content: string }[]
}

/** §7.1 — 1 request/dạng bài, mỗi request gói toàn bộ câu trả lời của session (DEC-14). */
export function bodyCham(dv: {
  dang: DangBaiAI
  target_lang: 'zh' | 'en'
  model: string
  items: ItemCham[]
}): BodyAI {
  return {
    model: dv.model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: promptCham(dv.dang) },
      {
        role: 'user',
        content: JSON.stringify({
          exercise_type: dv.dang,
          target_lang: dv.target_lang,
          items: dv.items,
        }),
      },
    ],
  }
}

// ── Giải thích theo yêu cầu (§8, DEC-23) ───────────────────────────────────

export type GiaiThich = {
  question_translation_vi: string
  answer_pinyin: string
  answer_meaning_vi: string
  explanation_vi: string
}

export function promptGiaiThich(dang: string): string {
  return `Người học đang làm bài dạng "${dang}" trong app học từ vựng.
Giải thích ngắn gọn bằng tiếng Việt vì sao đáp án đúng, tối đa 3 câu.
CHỈ trả JSON thuần, KHÔNG markdown:
{"question_translation_vi":"...","answer_pinyin":"...","answer_meaning_vi":"...","explanation_vi":"..."}
Nếu ngôn ngữ đích là tiếng Anh thì để "answer_pinyin" là chuỗi rỗng.`
}

/** Thiếu `explanation_vi` ⇒ null: thà báo lỗi + "Thử lại" còn hơn mở panel rỗng. */
export function docGiaiThich(text: string): GiaiThich | null {
  const o = docJsonAI(text) as Record<string, unknown> | null
  if (!o || !chuoi(o['explanation_vi'])) return null
  return {
    question_translation_vi: chuoi(o['question_translation_vi']),
    answer_pinyin: chuoi(o['answer_pinyin']),
    answer_meaning_vi: chuoi(o['answer_meaning_vi']),
    explanation_vi: chuoi(o['explanation_vi']),
  }
}
