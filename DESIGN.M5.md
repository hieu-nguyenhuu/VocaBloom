# DESIGN.md — M5: AI chấm bài stage 3 + Giải thích (AI)

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản M4b (đã lưu ở `DESIGN.M4b.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-17 · Trạng thái: **✅ HOÀN THÀNH 2026-09-18 — test 159/159, AI chấm thật 12 dòng +4đ, 3 từ mastered (MB-22)**

---

## 0. Phạm vi (chốt ở Brainstorm 2026-09-17)

**Làm:**
- `src/lib/aiCore.ts` — **thuần** (TDD): system prompt theo dạng bài, dựng request body, parse JSON
  (+ strip code-fence retry), map `verdict → điểm`, gộp lỗi thiếu `vocab_id`.
- `src/lib/ai.ts` — I/O: đọc khoá/model, `chamBaiTuLuan()`, `giaiThichBai()` (lazy + cache).
- 3 dạng stage 3 (pattern 8): `make_sentence` · `trans_sentence` · `complete_situation`.
- **Nút "Giải thích (AI)"** (§8, DEC-23) — lazy-generate + cache `exercises.ai_explanation`.

**KHÔNG làm:** màn Cài đặt (M6) · TTS · Dashboard · ôn theo topic.
**0 package mới** (dùng `fetch` sẵn có).

**Dữ liệu thật:** 4 từ `stage3` (苹果 香蕉 葡萄 橙子, due 22–24/9) · payload `trans_sentence` 9 ·
`complete_situation` 9 · `make_sentence` không cần record.

---

## 1. Khoá & model (chốt Q1–Q2)

**Tạm thời đọc từ `.env.local`; sau này nhập ở màn Cài đặt (M6).** `ai.ts` đọc theo thứ tự:

```ts
settings.openrouter_api_key  →  import.meta.env.VITE_OPENROUTER_API_KEY
settings.openrouter_model    →  import.meta.env.VITE_OPENROUTER_MODEL
```
Nhờ thứ tự này, khi M6 xong và bạn nhập khoá ở Cài đặt thì app **tự chuyển sang nguồn an toàn**,
không phải sửa code.

Thêm vào `.env.local` (giữ nguyên `OPENROUTER_API_KEY` cũ cho script CLI):
```
VITE_OPENROUTER_API_KEY=<khoá của bạn>
VITE_OPENROUTER_MODEL=deepseek/deepseek-v4-flash-0731
```

> ⚠️ **Ngoại lệ có thời hạn, ghi rõ để không quên:** `systemPatterns.md` §8 + MB-04 cấm gắn `VITE_`
> cho khoá OpenRouter vì Vite nhúng thẳng mọi biến `VITE_*` vào `dist/assets/*.js` — ai mở URL cũng
> tải được, kể cả chưa đăng nhập. Chấp nhận **chỉ khi chạy local**; **trước khi deploy công khai phải
> xoá 2 biến này** và nhập khoá ở màn Cài đặt. `src/env.d.ts` + memory-bank sẽ ghi cảnh báo này.

Không có khoá → UI báo: "Chưa có khoá OpenRouter. Thêm `VITE_OPENROUTER_API_KEY` vào `.env.local`
rồi khởi động lại dev server." (không gọi mạng, không tính fail).

---

## 2. Luồng chấm — gom 5 câu/dạng, 1 request (chốt Q3, DEC-14)

```
Session stage3 (≤5 từ) → xepBai chèn xen kẽ:
  [nhập make_sentence ×N]      → [MÀN CHẤM make_sentence]
  [nhập trans_sentence ×N]     → [MÀN CHẤM trans_sentence]
  [nhập complete_situation ×N] → [MÀN CHẤM complete_situation]
⇒ đúng 3 request/session
```
- **Màn nhập** (mockup 09 phần trên): thẻ đề + textarea + nút "Nộp bài" → lưu vào bộ đệm
  `dapAnTuLuan[vocab_id]`, sang màn kế, **chưa gọi AI, chưa ghi DB**.
- **Màn chấm** (`loai: 'cham_ai'`): vào màn → "Đang chấm…" → 1 request cho cả N câu → ghi DB cho từng
  từ (`xuLyTraLoi` với `dung = verdict !== 'fail'`) → hiện **lần lượt** N thẻ phản hồi (mockup 09 phần
  dưới), mỗi thẻ 1 nút "Tiếp theo"; hết N thẻ → sang màn kế.
- **"Bỏ qua"** (§6.4): `fail` ngay, **không gọi AI** — ghi đệm `{ bo_qua: true }`.
- **Lỗi/parse fail/thiếu `vocab_id`** (§7.4): thẻ lỗi nhẹ + nút **"Chấm lại"**; câu đã nhập **giữ
  nguyên** trong đệm; từ đó **không cộng điểm** cho tới khi chấm lại thành công.
- Nút **Gợi ý ẩn hoàn toàn** ở 3 dạng này (§6.4).

**Điểm:** `good`/`acceptable` → `dung = true` (srs.ts cho +4, hoặc ×50% nếu đã dùng Giải thích);
`fail` → `dung = false`.

---

## 3. Nút "Giải thích (AI)" (§8) — KHÔNG có mockup, cần duyệt

**Chỗ đặt:** nút ghost **thứ 4** trong header `ExerciseShell` (cạnh Phiên âm / Gợi ý / Bỏ qua), icon
`giai-thich` (dấu hỏi trong khung tròn, tự vẽ cùng nét 1.8). Chỉ hiện khi **có record `exercises`**
và stage ≥ 1.

**Panel:** `<dialog>` native (ponytail — 0 package), card `bg-surface-raised rounded-20 p-7`
`max-w-[520px]`, 4 mục theo schema §8:

| Nhãn | Trường |
|---|---|
| Dịch câu hỏi | `question_translation_vi` |
| Phiên âm đáp án | `answer_pinyin` (ẩn nếu `lang = 'en'`) |
| Nghĩa đáp án | `answer_meaning_vi` |
| Vì sao đúng | `explanation_vi` |

Trạng thái: "Đang hỏi AI…" (skeleton) → nội dung → nút "Đóng". Lỗi → dòng đỏ + "Thử lại".

**3 quyết định kèm theo:**
1. **Chỉ hiện ở bài CÓ record** — 6 dạng không có record (`flashcard`, `matching`, `translate`,
   `listen_fill`, `make_sentence`, `trans_collocation`) **không có chỗ cache** `ai_explanation`
   (cột nằm ở bảng `exercises`). Gọi lại mỗi lần sẽ trái DEC-23 ("bấm lại không tốn thêm call").
   Với các dạng đó nội dung giải thích cũng ít giá trị (nghĩa + pinyin đã có sẵn trong `vocab`).
2. **Bấm Giải thích TRƯỚC khi trả lời = tính như dùng gợi ý** (`soGoiY + 1` ⇒ điểm ×50%, DEC-19) —
   nếu không sẽ thành lỗ hổng: xem đáp án mà vẫn full điểm. Bấm SAU khi đã trả lời: không ảnh hưởng.
3. **Hạn chế đã biết:** nếu mở panel trong lúc auto-next đang đếm (600–1000 ms sau khi chọn), màn sẽ
   chuyển và panel đóng theo. Khuyên bấm trước khi trả lời, hoặc ở màn phản hồi AI (không auto-next).

---

## 4. Kiến trúc

### 4.1 `aiCore.ts` (thuần — 0 import ngoài `./srs.ts`, TDD)
```ts
export type Verdict = 'good' | 'acceptable' | 'fail'
export type KetQuaCham = {
  vocab_id: string; verdict: Verdict; used_vocab_correctly: boolean
  is_translation_request: boolean; feedback_vi: string; improved_sentence: string | null
}

export function promptCham(dang: DangBaiAI): string                  // system prompt §7.3 theo dạng
export function bodyCham(dv: { dang; target_lang; items; model }): object   // §7.2
export function docJsonAI(text: string): unknown | null              // parse; fail → strip ```json → parse lại 1 lần
export function docKetQuaCham(text: string, ids: string[]): { ok: KetQuaCham[]; thieu: string[] }
export function dungTuVerdict(v: Verdict): boolean                   // good|acceptable → true
export function promptGiaiThich(dang: DangBai): string
export function docGiaiThich(text: string): GiaiThich | null
```

### 4.2 `ai.ts` (I/O — fetch + supabase)
```ts
export async function layCauHinhAI(): Promise<{ khoa: string; model: string } | null>
export async function chamBaiTuLuan(dv): Promise<{ ok: KetQuaCham[]; thieu: string[] } | { loi: string }>
export async function giaiThichBai(exercise_id, dv): Promise<GiaiThich | { loi: string }>
   // đọc exercises.ai_explanation trước; null → gọi AI → UPDATE cache → trả về
```
Gọi `POST https://openrouter.ai/api/v1/chat/completions`, header `Authorization: Bearer <khoa>`,
body `{ model, messages: [system, user], temperature: 0.2 }`. Lỗi mạng/401/429 → trả `{ loi }` tiếng Việt.

### 4.3 `Man` mới (player.ts)
```ts
| { loai: 'make_sentence' | 'trans_sentence' | 'complete_situation'; vocab_id: string; payload?: PayloadTuLuan }
| { loai: 'cham_ai'; dang: DangBaiAI; vocab_ids: string[]; la_bai_cuoi: Record<string, boolean> }
```
`THU_TU_MAN` nối: `make_sentence → cham_ai(make) → trans_sentence → cham_ai(trans) → complete_situation → cham_ai(complete)`.
`xepBai` chèn màn `cham_ai` ngay sau nhóm nhập cùng dạng (bỏ nếu nhóm rỗng); `la_bai_cuoi` gắn ở
màn `cham_ai` (nơi ghi điểm), không ở màn nhập.

### 4.4 Số liệu mockup 09 (`max-w 640`)
| Phần | Mockup | Utility |
|---|---|---|
| Thẻ đề | `#FBFAF6` viền `#F0ECE4` r16 p18 center; 15 `#4A4458`; từ in đậm Noto | `rounded-16 border border-border-card bg-surface-card p-[18px] text-center text-15 text-content-nav` |
| Ô nhập | `#F5F3EC` viền `#E5E5E5` r14 p18, Noto 17, `min-h 60` | `rounded-14 border border-border-input bg-surface-sunken p-[18px] font-han text-17 min-h-[60px]` |
| Thẻ phản hồi **good** | nền `#DCFCE7` viền `#4ade80` r16 p18; badge `#4ade80` chữ trắng 12/700 pill `4px 12px`; chữ 14.5 `#15803D`; gợi ý 14 `#166534` in nghiêng | `rounded-16 border border-success bg-success-bg p-[18px]` · badge `rounded-pill bg-success px-3 py-1 text-12 font-bold text-white` · `text-14 text-success-text` · `italic opacity-90` |
| Thẻ **acceptable** | (suy ra) vàng | `border-warn bg-warn-bg` · badge `bg-warn` · `text-warn-text` — nhãn "Tạm được" |
| Thẻ **fail** | (suy ra) đỏ | `border-danger bg-danger-bg` · badge `bg-danger` · `text-danger-text` — nhãn "Chưa đạt" |
| Nút | "Tiếp theo" tím p17 r14 | `rounded-14 bg-accent py-[17px] text-16 font-semibold text-white` |
| Header | ring + **CHỈ 2 ghost** (Phiên âm, Bỏ qua) + X | ẩn Gợi ý (§6.4); thêm Giải thích nếu có record |

Nhãn badge: `good` → "Tốt lắm" (nguyên văn mockup) · `acceptable` → "Tạm được" · `fail` → "Chưa đạt".

---

## 5. Kế hoạch — 16 task (2–5 phút/task)

**Thuần (TDD từng cặp)**
- T1/T2 · `docJsonAI` (JSON thuần · bọc ```json · rác → null) + `dungTuVerdict`. 5 ca.
- T3/T4 · `docKetQuaCham` (đủ id · thiếu id → `thieu[]` · sai shape · verdict lạ → fail). 4 ca.
- T5/T6 · `bodyCham` + `promptCham` (đúng `exercise_type`, đủ `items`, có luật `(...)` tiếng Việt → fail) + `docGiaiThich`. 5 ca.
- T7/T8 · `xepBai` chèn `cham_ai` (3 ca: đủ 3 dạng · nhóm rỗng không chèn · `la_bai_cuoi` ở màn chấm).
- T9 · X-test: `aiCore.ts` không import react/supabase/node.

**I/O + UI**
- T10 · `ai.ts` — `layCauHinhAI` (settings → env), `chamBaiTuLuan`, `giaiThichBai` (cache).
- T11 · `icons.tsx` +1 icon `giai-thich`; `env.d.ts` + `.env.local` 2 biến mới (kèm comment cảnh báo).
- T12 · `TuLuan.tsx` (màn nhập: thẻ đề theo 3 dạng, textarea, "Nộp bài").
- T13 · `ChamAI.tsx` (màn chấm: đang chấm → thẻ phản hồi lần lượt → lỗi + "Chấm lại").
- T14 · `GiaiThich.tsx` (`<dialog>` native) + nút ghost thứ 4 trong `ExerciseShell`.
- T15 · `PlayerPage` — đệm câu trả lời, gọi `chamBaiTuLuan`, ghi DB từng từ, nối 2 màn mới + nút Giải thích.

**Kiểm**
- T16 · build · lint · test (136 + ~20) · **kiểm thật**: kéo `next_review_date` của 4 từ stage3 về hôm
  nay (ghi trước/sau) → chạy session stage3 → **gọi AI thật 3 request** → đối chiếu `review_log`
  (điểm 4/0 đúng verdict) · bấm Giải thích 1 bài → `exercises.ai_explanation` có dữ liệu → bấm lại
  **không** gọi AI (đếm request) · chụp PC light/dark + Mobile · dọn process · memory-bank MB-22.

---

## 6. Checklist soát ở Bước 4 — đã soát ✅
(Bổ sung sau khi kiểm thật: thiếu trigger chấm → kẹt màn; lượt retry trộn stage — chi tiết MB-22.)

- [ ] Đúng 3 request/session stage3 (DEC-14) — đếm bằng log mạng khi kiểm thật.
- [ ] Parse fail → strip code-fence retry 1 lần → vẫn fail thì **không cộng điểm** + "Chấm lại", giữ câu đã nhập (§7.4).
- [ ] "Bỏ qua" = fail ngay, KHÔNG gọi AI. Gợi ý ẩn hoàn toàn ở 3 dạng.
- [ ] Giải thích: lazy + cache, bấm lại không gọi AI (DEC-23); chỉ hiện ở bài có record; bấm trước khi trả lời = tính gợi ý.
- [ ] Khoá đọc `settings` trước, `env` sau; thiếu khoá → báo rõ, không gọi mạng.
- [ ] Không hex trong component; luật SRS vẫn chỉ ở `srs.ts`; `aiCore.ts` thuần.
- [ ] Ghi cảnh báo "phải gỡ `VITE_OPENROUTER_*` trước khi deploy" vào `env.d.ts` + memory-bank.

---

## 7. PLAN chi tiết — code cụ thể từng task

### T1 · RED `src/lib/aiCore.test.ts` — `docJsonAI` + `dungTuVerdict`
```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { docJsonAI, dungTuVerdict } from './aiCore.ts'

describe('docJsonAI', () => {
  it('JSON thuần', () => { expect(docJsonAI('{"a":1}')).toEqual({ a: 1 }) })
  it('bọc ```json … ``` → strip rồi parse (§7.4)', () => {
    expect(docJsonAI('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })
  it('bọc ``` không có nhãn', () => { expect(docJsonAI('```\n{"a":1}\n```')).toEqual({ a: 1 }) })
  it('có chữ thừa quanh JSON → null (không đoán mò)', () => { expect(docJsonAI('Đây nhé: {"a":1} xong')).toBeNull() })
  it('rác → null, không ném', () => { expect(docJsonAI('xin chào')).toBeNull() })
})
describe('dungTuVerdict', () => {
  it('good/acceptable → true; fail → false (§7.3)', () => {
    expect([dungTuVerdict('good'), dungTuVerdict('acceptable'), dungTuVerdict('fail')]).toEqual([true, true, false])
  })
})
```

### T2 · GREEN `src/lib/aiCore.ts` (phần 1)
```ts
/**
 * Logic AI THUẦN — không fetch, không Supabase, không React. `ai.ts` lo phần I/O.
 * Toàn bộ prompt + luật parse nằm ở đây để test được (CLAUDE.md Bước 3).
 */
export type Verdict = 'good' | 'acceptable' | 'fail'
const VERDICT: ReadonlySet<string> = new Set(['good', 'acceptable', 'fail'])

/** §7.4: parse JSON; fail → strip code-fence rồi parse LẠI ĐÚNG 1 LẦN; vẫn fail → null. */
export function docJsonAI(text: string): unknown | null {
  const thu = (s: string) => { try { return JSON.parse(s) as unknown } catch { return undefined } }
  const lan1 = thu(text.trim())
  if (lan1 !== undefined) return lan1
  const daStrip = text.trim().replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '')
  const lan2 = thu(daStrip)
  return lan2 === undefined ? null : lan2
}

/** §7.3: good + acceptable đều FULL điểm; chỉ fail mới 0 điểm. */
export function dungTuVerdict(v: Verdict): boolean { return v !== 'fail' }
```

### T3 · RED — `docKetQuaCham`
```ts
const mau = (ids: string[]) => JSON.stringify({ results: ids.map((id) => ({
  vocab_id: id, verdict: 'good', used_vocab_correctly: true, is_translation_request: false,
  feedback_vi: 'Tốt', improved_sentence: null })) })
describe('docKetQuaCham', () => {
  it('đủ id → ok hết, thieu rỗng', () => {
    const kq = docKetQuaCham(mau(['a', 'b']), ['a', 'b'])
    expect(kq.ok.map((x) => x.vocab_id)).toEqual(['a', 'b'])
    expect(kq.thieu).toEqual([])
  })
  it('thiếu 1 id → vào `thieu` (§7.4 không cộng điểm cho từ đó)', () => {
    const kq = docKetQuaCham(mau(['a']), ['a', 'b'])
    expect(kq.thieu).toEqual(['b'])
  })
  it('JSON hỏng → thiếu TẤT CẢ', () => {
    expect(docKetQuaCham('rác', ['a', 'b']).thieu).toEqual(['a', 'b'])
  })
  it('verdict lạ / thiếu field → coi là fail, feedback rỗng', () => {
    const kq = docKetQuaCham(JSON.stringify({ results: [{ vocab_id: 'a', verdict: 'tuyệt vời' }] }), ['a'])
    expect(kq.ok[0]).toEqual({ vocab_id: 'a', verdict: 'fail', used_vocab_correctly: false,
      is_translation_request: false, feedback_vi: '', improved_sentence: null })
  })
})
```

### T4 · GREEN
```ts
export type KetQuaCham = {
  vocab_id: string; verdict: Verdict; used_vocab_correctly: boolean
  is_translation_request: boolean; feedback_vi: string; improved_sentence: string | null
}

const chuoi = (v: unknown) => (typeof v === 'string' ? v : '')
const bool = (v: unknown) => v === true

/** Chuẩn hoá response §7.2; id nào AI không trả → `thieu` (tầng gọi sẽ không cộng điểm, §7.4). */
export function docKetQuaCham(text: string, ids: string[]): { ok: KetQuaCham[]; thieu: string[] } {
  const raw = docJsonAI(text) as { results?: unknown[] } | null
  const ds = Array.isArray(raw?.results) ? raw.results : []
  const ok: KetQuaCham[] = []
  for (const r of ds) {
    const o = r as Record<string, unknown>
    const id = chuoi(o['vocab_id'])
    if (!id || !ids.includes(id) || ok.some((x) => x.vocab_id === id)) continue
    const v = chuoi(o['verdict'])
    ok.push({
      vocab_id: id,
      verdict: (VERDICT.has(v) ? v : 'fail') as Verdict,
      used_vocab_correctly: bool(o['used_vocab_correctly']),
      is_translation_request: bool(o['is_translation_request']),
      feedback_vi: chuoi(o['feedback_vi']),
      improved_sentence: chuoi(o['improved_sentence']) || null,
    })
  }
  return { ok, thieu: ids.filter((id) => !ok.some((x) => x.vocab_id === id)) }
}
```

### T5 · RED — `promptCham` · `bodyCham` · `docGiaiThich`
```ts
describe('promptCham / bodyCham', () => {
  it('prompt có đủ 3 mức verdict + luật câu tiếng Việt trong ngoặc (§7.3)', () => {
    const p = promptCham('make_sentence')
    for (const k of ['good', 'acceptable', 'fail', 'is_translation_request', 'JSON']) expect(p).toContain(k)
  })
  it('prompt khác nhau theo dạng bài', () => {
    expect(promptCham('trans_sentence')).not.toBe(promptCham('complete_situation'))
  })
  it('bodyCham: đúng model, 2 message, user content chứa exercise_type + đủ items', () => {
    const b = bodyCham({ dang: 'make_sentence', target_lang: 'zh', model: 'm/x', items: [
      { vocab_id: 'a', word: '苹果', meaning_vi: 'quả táo', user_answer: '我吃苹果。' }] }) as any
    expect(b.model).toBe('m/x')
    expect(b.messages).toHaveLength(2)
    const u = JSON.parse(b.messages[1].content)
    expect(u.exercise_type).toBe('make_sentence')
    expect(u.target_lang).toBe('zh')
    expect(u.items[0].user_answer).toBe('我吃苹果。')
  })
})
describe('docGiaiThich', () => {
  it('đủ 4 trường §8', () => {
    const g = docGiaiThich(JSON.stringify({ question_translation_vi: 'a', answer_pinyin: 'b', answer_meaning_vi: 'c', explanation_vi: 'd' }))
    expect(g).toEqual({ question_translation_vi: 'a', answer_pinyin: 'b', answer_meaning_vi: 'c', explanation_vi: 'd' })
  })
  it('thiếu explanation_vi → null (không hiện panel rỗng)', () => {
    expect(docGiaiThich(JSON.stringify({ question_translation_vi: 'a' }))).toBeNull()
  })
  it('rác → null', () => { expect(docGiaiThich('hmm')).toBeNull() })
})
```

### T6 · GREEN
```ts
export type DangBaiAI = 'make_sentence' | 'trans_sentence' | 'complete_situation'

const LUAT_CHUNG = `Bạn là giáo viên chấm bài viết của người Việt học ngoại ngữ.
Chấm theo 3 mức:
- "good": đúng ngữ pháp và tự nhiên.
- "acceptable": dùng đúng từ vựng nhưng còn gượng — BẮT BUỘC có "improved_sentence".
- "fail": sai ngữ pháp nặng, không dùng từ vựng cần luyện, hoặc bỏ trống.
Nếu câu trả lời là tiếng Việt đặt trong ngoặc đơn (...) thì luôn "fail",
"is_translation_request" = true và "improved_sentence" là bản dịch sang ngôn ngữ đích.
"feedback_vi" viết bằng tiếng Việt, tối đa 2 câu, giọng nhẹ nhàng khích lệ.
CHỈ trả JSON thuần đúng schema, KHÔNG markdown, KHÔNG giải thích thêm:
{"results":[{"vocab_id":"...","verdict":"good|acceptable|fail","used_vocab_correctly":true,
"is_translation_request":false,"feedback_vi":"...","improved_sentence":null}]}`

const RIENG: Record<DangBaiAI, string> = {
  make_sentence: 'Người học tự đặt câu chứa từ vựng cho trước.',
  trans_sentence: 'Người học dịch câu tiếng Việt cho trước sang ngôn ngữ đích, câu dịch phải chứa từ vựng.',
  complete_situation: 'Người học viết 1-3 câu hoàn thành tình huống cho trước, phải chứa từ vựng.',
}

export function promptCham(dang: DangBaiAI): string { return `${RIENG[dang]}\n\n${LUAT_CHUNG}` }

export type ItemCham = { vocab_id: string; word: string; meaning_vi: string; user_answer: string; de_bai?: string }

export function bodyCham(dv: { dang: DangBaiAI; target_lang: 'zh' | 'en'; model: string; items: ItemCham[] }) {
  return {
    model: dv.model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: promptCham(dv.dang) },
      { role: 'user', content: JSON.stringify({ exercise_type: dv.dang, target_lang: dv.target_lang, items: dv.items }) },
    ],
  }
}

export type GiaiThich = { question_translation_vi: string; answer_pinyin: string; answer_meaning_vi: string; explanation_vi: string }

export function promptGiaiThich(dang: string): string {
  return `Người học đang làm bài dạng "${dang}" trong app học từ vựng.
Giải thích ngắn gọn bằng tiếng Việt vì sao đáp án đúng.
CHỈ trả JSON thuần: {"question_translation_vi":"...","answer_pinyin":"...","answer_meaning_vi":"...","explanation_vi":"..."}
Nếu ngôn ngữ đích là tiếng Anh, để "answer_pinyin" là chuỗi rỗng.`
}

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
```

### T7 · RED — `xepBai` chèn `cham_ai`
```ts
describe('xepBai — stage 3 (M5)', () => {
  const bt3 = (id: string) => [
    bai(id, 'trans_sentence', { vietnamese_sentence: 'Tôi ăn táo.' }),
    bai(id, 'complete_situation', { situation_vi: 'Ở chợ', given_sentence_zh: '你好', given_sentence_pinyin: 'nǐ hǎo' }),
  ]
  it('3 dạng nhập, mỗi nhóm theo sau đúng 1 màn cham_ai', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage3'), tu('b', 'stage3')], baiTap: [...bt3('a'), ...bt3('b')] })
    expect(man.map((m) => m.loai)).toEqual([
      'flashcard', 'flashcard',
      'make_sentence', 'make_sentence', 'cham_ai',
      'trans_sentence', 'trans_sentence', 'cham_ai',
      'complete_situation', 'complete_situation', 'cham_ai',
    ])
  })
  it('nhóm rỗng (thiếu record) → KHÔNG chèn cham_ai thừa', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage3')], baiTap: [] })   // chỉ make_sentence (không cần record)
    expect(man.map((m) => m.loai)).toEqual(['flashcard', 'make_sentence', 'cham_ai'])
  })
  it('la_bai_cuoi nằm ở màn cham_ai, không ở màn nhập', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage3')], baiTap: bt3('a') })
    const cuoi = man.filter((m) => m.loai === 'cham_ai')
    expect(cuoi).toHaveLength(3)
    const c3 = cuoi[2]
    expect(c3 && c3.loai === 'cham_ai' ? c3.la_bai_cuoi : null).toEqual({ a: true })
    const c1 = cuoi[0]
    expect(c1 && c1.loai === 'cham_ai' ? c1.la_bai_cuoi : null).toEqual({ a: false })
  })
})
```

### T8 · GREEN — `player.ts`
```ts
export type PayloadTuLuan = { vietnamese_sentence?: string; situation_vi?: string; given_sentence_zh?: string; given_sentence_pinyin?: string }
// Man +=
//   { loai: 'make_sentence'|'trans_sentence'|'complete_situation'; vocab_id; payload?: PayloadTuLuan }
//   { loai: 'cham_ai'; dang: DangBaiAI; vocab_ids: string[]; la_bai_cuoi: Record<string, boolean> }
const DANG_AI: readonly DangBaiAI[] = ['make_sentence', 'trans_sentence', 'complete_situation']
// THU_TU_MAN += 'make_sentence', 'trans_sentence', 'complete_situation'
// Trong vòng lặp: sau khi đẩy xong nhóm màn nhập của 1 dạng AI, nếu nhóm có ≥1 màn thì push
//   { loai: 'cham_ai', dang, vocab_ids: <ids vừa đẩy>, la_bai_cuoi: {} }
// Duyệt ngược: nhánh 'cham_ai' xử lý như 'matching' (đặt la_bai_cuoi cho từng id trong vocab_ids);
//   màn nhập tự luận KHÔNG tham gia đánh dấu.
// `coBaiTinhDiem`: 'cham_ai' là bài tính điểm; màn nhập tự luận KHÔNG (để tránh session chỉ có nhập).
```

### T9 · X-test `aiCore.ts`: mọi `import` đều không thuộc `react|@supabase|node:`.

### T10 · `src/lib/ai.ts`
```ts
import { docGiaiThich, docKetQuaCham, bodyCham, promptGiaiThich, type DangBaiAI, type GiaiThich, type ItemCham, type KetQuaCham } from './aiCore.ts'
import { supabase } from './supabase.ts'

const URL_AI = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * Khoá & model: ưu tiên bảng `settings` (§11, MB-04) → dự phòng biến môi trường (M5/Q1 — TẠM THỜI).
 * ⚠️ VITE_* bị nhúng vào bundle; phải gỡ trước khi deploy công khai (xem env.d.ts).
 */
export async function layCauHinhAI(): Promise<{ khoa: string; model: string } | null> {
  const { data } = await supabase.from('settings').select('key, value').in('key', ['openrouter_api_key', 'openrouter_model'])
  const tu = Object.fromEntries((data ?? []).map((r) => [r.key as string, r.value as string | null]))
  const khoa = tu['openrouter_api_key'] || import.meta.env.VITE_OPENROUTER_API_KEY || ''
  const model = tu['openrouter_model'] || import.meta.env.VITE_OPENROUTER_MODEL || ''
  return khoa && model ? { khoa, model } : null
}

async function goiAI(body: object, khoa: string): Promise<string | { loi: string }> {
  try {
    const res = await fetch(URL_AI, { method: 'POST',
      headers: { Authorization: `Bearer ${khoa}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      if (res.status === 401) return { loi: 'Khoá OpenRouter không hợp lệ.' }
      if (res.status === 429) return { loi: 'OpenRouter báo quá nhiều yêu cầu, thử lại sau ít phút.' }
      return { loi: `OpenRouter lỗi ${res.status}: ${t.slice(0, 120)}` }
    }
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return j.choices?.[0]?.message?.content ?? ''
  } catch {
    return { loi: 'Không kết nối được OpenRouter. Kiểm tra mạng rồi thử lại nhé.' }
  }
}

export const THIEU_KHOA = 'Chưa có khoá OpenRouter. Thêm VITE_OPENROUTER_API_KEY và VITE_OPENROUTER_MODEL vào .env.local rồi khởi động lại dev server.'

export async function chamBaiTuLuan(dv: { dang: DangBaiAI; target_lang: 'zh' | 'en'; items: ItemCham[] }):
  Promise<{ ok: KetQuaCham[]; thieu: string[] } | { loi: string }> {
  const cau = await layCauHinhAI()
  if (!cau) return { loi: THIEU_KHOA }
  const kq = await goiAI(bodyCham({ ...dv, model: cau.model }), cau.khoa)
  if (typeof kq !== 'string') return kq
  return docKetQuaCham(kq, dv.items.map((i) => i.vocab_id))
}

/** DEC-23: lazy + cache vào `exercises.ai_explanation`; bấm lại KHÔNG gọi AI. */
export async function giaiThichBai(exercise_id: string, dv: { dang: string; ngu_canh: object }):
  Promise<GiaiThich | { loi: string }> {
  const { data } = await supabase.from('exercises').select('ai_explanation').eq('id', exercise_id).maybeSingle()
  const cache = data?.ai_explanation as GiaiThich | null | undefined
  if (cache?.explanation_vi) return cache
  const cau = await layCauHinhAI()
  if (!cau) return { loi: THIEU_KHOA }
  const kq = await goiAI({ model: cau.model, temperature: 0.2, messages: [
    { role: 'system', content: promptGiaiThich(dv.dang) },
    { role: 'user', content: JSON.stringify(dv.ngu_canh) }] }, cau.khoa)
  if (typeof kq !== 'string') return kq
  const g = docGiaiThich(kq)
  if (!g) return { loi: 'AI trả về dữ liệu không đọc được. Thử lại nhé.' }
  await supabase.from('exercises').update({ ai_explanation: g }).eq('id', exercise_id)
  return g
}
```

### T11 · `icons.tsx` + `env.d.ts` + `.env.local`
```tsx
'giai-thich': (<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.6.2-1 .8-1 1.4v.2" /><path d="M12 17h.01" /></>),
```
```ts
// env.d.ts — thêm, kèm cảnh báo
/**
 * ⚠️ TẠM THỜI (M5/Q1): khoá OpenRouter đọc từ env cho tiện khi chạy local. Vite NHÚNG mọi biến
 * VITE_* vào dist/assets/*.js ⇒ ai mở URL cũng đọc được, kể cả chưa đăng nhập.
 * TRƯỚC KHI DEPLOY CÔNG KHAI: xoá 2 biến này, nhập khoá ở màn Cài đặt (M6) — app đọc `settings` trước.
 */
readonly VITE_OPENROUTER_API_KEY?: string
readonly VITE_OPENROUTER_MODEL?: string
```
`.env.local`: thêm 2 dòng (giữ `OPENROUTER_API_KEY` cũ cho script CLI).

### T12 · `src/features/player/bai/TuLuan.tsx`
```tsx
/** Pattern 8 — tự luận AI chấm (mockup 09, phần nhập). Ẩn HOÀN TOÀN nút Gợi ý (§6.4). */
type Props = { vocab: VocabDb; cheDo: DangBaiAI; payload?: PayloadTuLuan; hienPhienAm: boolean; onNop: (cau: string) => void }
// Đề theo dạng:
//   make_sentence      → "Đặt câu với từ: <b>{word}</b> ({meaning_vi})"
//   trans_sentence     → "Dịch sang tiếng Trung/Anh: <b>{vietnamese_sentence}</b>"
//   complete_situation → "{situation_vi}" + câu cho trước {given_sentence_zh} (+pinyin nếu bật)
// <textarea> rounded-14 border border-border-input bg-surface-sunken p-[18px] font-han text-17 min-h-[60px]
// nút "Nộp bài" tím, disabled khi rỗng
```

### T13 · `src/features/player/bai/ChamAI.tsx`
```tsx
/**
 * Màn chấm (mockup 09, phần thẻ phản hồi). Vào màn → gọi AI 1 lần cho CẢ nhóm (DEC-14: 3 request/session)
 * → ghi DB → hiện lần lượt từng thẻ. Lỗi/thiếu vocab_id (§7.4) → thẻ lỗi + "Chấm lại", giữ câu đã nhập.
 */
type Props = { trangThai: 'dang_cham' | 'xong' | 'loi'; loi?: string; ds: { vocab: VocabDb; cau: string; kq?: KetQuaCham }[]
  chiSo: number; onTiep: () => void; onChamLai: () => void }
const NHAN: Record<Verdict, { nhan: string; vien: string; nen: string; badge: string; chu: string }> = {
  good:       { nhan: 'Tốt lắm',  vien: 'border-success', nen: 'bg-success-bg', badge: 'bg-success', chu: 'text-success-text' },
  acceptable: { nhan: 'Tạm được', vien: 'border-warn',    nen: 'bg-warn-bg',    badge: 'bg-warn',    chu: 'text-warn-text' },
  fail:       { nhan: 'Chưa đạt', vien: 'border-danger',  nen: 'bg-danger-bg',  badge: 'bg-danger',  chu: 'text-danger-text' },
}
// Thẻ: câu người học (ô xám) → badge + feedback_vi → "Gợi ý: …" (improved_sentence, italic) → nút "Tiếp theo"
// dang_cham: skeleton + "Đang chấm bài…"; loi: card đỏ + [Chấm lại]
```

### T14 · `GiaiThich.tsx` + nút ghost thứ 4
```tsx
/** §8 / DEC-23 — panel giải thích, <dialog> native (0 package). Lazy + cache ở ai.ts. */
type Props = { moTa: boolean; dangTai: boolean; noiDung: GiaiThich | null; loi: string | null; lang: 'zh' | 'en'; onDong: () => void; onThuLai: () => void }
// <dialog ref onClose> + backdrop; card rounded-20 bg-surface-raised p-7 max-w-[520px]
// 4 mục nhãn 12/600 uppercase muted + nội dung 15; ẩn "Phiên âm đáp án" khi lang==='en'
```
`ExerciseShell`: `Ghost` thêm `giaiThich?: () => void` → nút thứ 4 (icon `giai-thich`, nhãn "Giải thích").

### T15 · `PlayerPage`
```ts
const dapAnTuLuan = useRef<Record<string, string>>({})     // vocab_id → câu đã nhập (đệm, chưa ghi DB)
const ketQuaAI = useRef<Record<string, KetQuaCham>>({})
const [chamTt, setChamTt] = useState<{ b: 'dang_cham' | 'xong' | 'loi'; loi?: string; chiSo: number }>(…)

// màn nhập: onNop(cau) → dapAnTuLuan.current[vocab_id] = cau; dispatch({ loai: 'sang_man' })
// "Bỏ qua" ở màn nhập → dapAnTuLuan.current[id] = '' (fail, KHÔNG gọi AI)
async function chayChamAI(m: Extract<Man, { loai: 'cham_ai' }>) {
  setChamTt({ b: 'dang_cham', chiSo: 0 })
  const items = m.vocab_ids.map((id) => ({ vocab_id: id, word: vocab[id]!.word, meaning_vi: vocab[id]!.meaning_vi,
    user_answer: dapAnTuLuan.current[id] ?? '' }))
  const kq = await chamBaiTuLuan({ dang: m.dang, target_lang: vocab[m.vocab_ids[0]!]!.lang, items })
  if ('loi' in kq) return setChamTt({ b: 'loi', loi: kq.loi, chiSo: 0 })
  for (const r of kq.ok) ketQuaAI.current[r.vocab_id] = r
  // ghi DB tuần tự; từ nằm trong `thieu` → KHÔNG ghi (§7.4)
  for (let i = 0; i < m.vocab_ids.length; i++) {
    const id = m.vocab_ids[i]!
    const r = ketQuaAI.current[id]
    if (!r) continue
    const ok = await traLoi(id, m.dang, dungTuVerdict(r.verdict), soGoiYCua(id), m.la_bai_cuoi[id] ?? false, true)
    if (!ok) return
  }
  setChamTt({ b: 'xong', chiSo: 0 })
}
// "Tiếp theo" trong ChamAI: chiSo+1; hết ds → dispatch({ loai: 'sang_man' })
// Giải thích: state { moTa, dangTai, noiDung, loi }; mở → nếu chưa trả lời thì setSoGoiY(k+1) (DEC-19)
//   → giaiThichBai(exercise_id, { dang, ngu_canh: { cau_hoi, dap_an, word, meaning_vi } })
// exercise_id: xepBai cần mang thêm `exercise_id` cho các màn CÓ record → thêm field vào Man (T8).
```

### T16 · Nghiệm thu
1. `npm run build` · `npm run lint` · `npm test` (kỳ vọng ~156).
2. Kéo `next_review_date` của 4 từ `stage3` về hôm nay bằng PostgREST (ghi TRƯỚC/SAU).
3. CDP: chạy session stage3 — nhập 3 dạng (1 câu cố ý bỏ trống để test `fail`), đếm **đúng 3 request**
   tới `openrouter.ai` (bắt qua `Network.requestWillBeSent`), đối chiếu `review_log`
   (verdict good/acceptable → `points = 4`; fail → 0).
4. Bấm **Giải thích** ở 1 bài có record → panel hiện 4 mục → `exercises.ai_explanation` có dữ liệu →
   đóng, bấm lại → **0 request mới** (đếm lại).
5. Chụp `m5-tuluan.png`, `m5-phanhoi.png`, `m5-giaithich.png`, mobile + dark.
6. Dọn process · memory-bank MB-22 · soát checklist §6.
