# DESIGN.md — M4b: Player Stage 1 + 2 (8 dạng bài, pattern 1/2/3/7)

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản M4a (đã lưu ở `DESIGN.M4a.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-17 · Trạng thái: **✅ HOÀN THÀNH 2026-09-17 — 18/18 task, test 136/136, cả 8 dạng chạy thật (MB-21)**

---

## 0. Phạm vi (đã chốt ở Brainstorm 2026-09-17)

**Làm — 8 dạng còn thiếu của stage 1 & 2:**

| Pattern | Dạng bài | Component |
|---|---|---|
| **2** (mới) điền tay | `translate` · `listen_fill` · `trans_collocation` | `DienTu.tsx` |
| **7** (mới) hội thoại | `select_dialog` · `fill_dialog` | `HoiThoai.tsx` |
| **3** (mới) sắp xếp | `arrange_words` | `SapXep.tsx` |
| **1** (có sẵn) trắc nghiệm | `select_on_describe` · `select_sentence` | mở rộng `TracNghiem.tsx` |

Kèm: mở rộng `xepBai`/`Man`, luật **bài 2 từ** (§4.4) trong `player.ts` + `PlayerPage`, lọc hàng retry
theo dạng có record, test, kiểm thật.

**KHÔNG làm:** 3 dạng AI stage 3 (M5) · Google TTS gen (M6) · ôn theo topic (M7) · Dashboard.
**0 package mới.**

**Dữ liệu thật hôm nay (17/9):** 7 từ `stage1` + 1 từ `new` due. Payload sẵn: `select_on_describe` 9 ·
`select_sentence` 9 · `arrange_words` 9 · `select_dialog` 1 · `fill_dialog` 1. `translate`/`listen_fill`/
`trans_collocation` không cần record (đọc thẳng `vocab`; cụm từ có đủ 9/9).

---

## 1. Số liệu mockup (PC 03 · 04 · 08; Mobile nhỏ hơn 1 nấc)

### 1.1 Pattern 2 — điền từ (màn 03, `max-w 560`)
| Phần | Mockup PC / Mobile | Utility |
|---|---|---|
| Thẻ hỏi | `#FBFAF6` viền `#F0ECE4` r20 `36px 28px`; đề 26/600; dòng phụ 15 muted mt10 | `rounded-20 border border-border-card bg-surface-card px-7 py-9 text-center` · `text-26 font-semibold` · `mt-[10px] text-15 text-content-muted` |
| Ô ký tự | 58×62 / 52×56, chữ Noto 28/26; **đang gõ**: viền `2px #5B4FE8` r12/10; **chưa gõ**: chỉ `border-bottom 2px #DCD6CC`, chữ `#C7C1B6` ("?") | `h-[56px] w-[52px] md:h-[62px] md:w-[58px] font-han text-26 md:text-28` · gõ rồi `rounded-10 md:rounded-12 border-2 border-accent` · chưa `border-b-2 border-border-input text-content-faint` |
| Hàng ô | `justify-center gap:16` | `flex justify-center gap-4` |
| Nút | "Kiểm tra" tím 16/600 p17 r14 | `rounded-14 bg-accent py-[17px] text-16 font-semibold text-white` |

### 1.2 Pattern 3 — sắp xếp (màn 04, `max-w 640`)
- Dòng đề: "Sắp xếp thành câu: **{nghĩa tiếng Việt}**" 15.5 `text-content-nav` center.
- Khay ghép: `#FBFAF6` viền `#F0ECE4` r16 p18 `min-h 64`, `flex-wrap gap-[10px]`.
- Chip **đã chọn**: `#EDEBFC` viền `1.5 #5B4FE8` chữ `#4338CA` 600 r10 `10px 18px` Noto 18.
- Chip **chưa chọn** (hàng dưới, `justify-center`): `#FFFFFF` viền `#E5E5E5` chữ `#241B3A`.
- Nút "Kiểm tra" như pattern 2.

### 1.3 Pattern 7 — hội thoại (màn 08, `max-w 680`)
- 2 khối A/B: PC `flex gap-4` (2 cột), Mobile xếp dọc `gap-3`. Mỗi khối `#FBFAF6` viền `#F0ECE4` r16 p20/16.
- Nhãn "A"/"B" 13/700 muted mb8; câu Noto 19/18; `___` tô `#5B4FE8` 700; pinyin 12.5 muted mt8.
- **Select Dialog:** 4 chip dưới `gap-3 flex-wrap justify-center`, `#FFFFFF` viền `#E5E5E5` r10 `12px 20px` Noto 17.
  Chip = `blank_a_answer` + `word` của từ B + 2 `distractors`. Bấm chip → điền vào **chỗ trống đang chờ**
  (A trước, xong tới B).
- **Fill Dialog (không có mockup riêng — `UI_DESIGN` §6.3):** thay 4 chip bằng **2 ô nhập tay ngay tại `___`**
  (dùng lại ô ký tự của pattern 2, cỡ nhỏ hơn: `h-[46px] w-[42px]`), + nút "Kiểm tra".

### 1.4 Pattern 1 — mở rộng `TracNghiem`
- `select_on_describe`: thẻ hỏi = `description` (15.5 `text-content-nav`, không phải chữ Hán) + dòng phụ
  "Chọn từ đúng"; 4 đáp án là **từ** (Noto 17) thay vì nghĩa. Đáp án đúng = `vocab.word`.
- `select_sentence`: thẻ hỏi = "Câu nào đúng?" ; 4 đáp án là **câu** (Noto 17, wrap, `text-left`,
  pinyin 12.5 muted bên dưới khi bật phiên âm) — lưới **1 cột** vì câu dài.

---

## 2. Kiến trúc

### 2.1 Mở rộng `Man` (player.ts)
```ts
| { loai: 'translate' | 'listen_fill' | 'trans_collocation'; vocab_id: string; la_bai_cuoi_cua_tu: boolean }
| { loai: 'select_on_describe'; vocab_id: string; payload: { description: string; distractors: TuPinyin[] }; la_bai_cuoi_cua_tu: boolean }
| { loai: 'select_sentence'; vocab_id: string; payload: { correct_sentence: Cau; wrong_sentences: Cau[] }; la_bai_cuoi_cua_tu: boolean }
| { loai: 'arrange_words'; vocab_id: string; payload: { tokens: TuPinyin[] }; la_bai_cuoi_cua_tu: boolean }
| { loai: 'select_dialog' | 'fill_dialog'; vocab_a: string; vocab_b: string | null; payload: PayloadDialog
    la_bai_cuoi: Record<string, boolean> }   // bài 2 từ — như matching, `la_bai_cuoi` theo TỪNG từ
```
`THU_TU_MAN` nối thêm đúng thứ tự stage: `translate → select_dialog → listen_fill → select_on_describe`
(stage1), `fill_dialog → select_sentence → arrange_words → trans_collocation` (stage2/intensive).

### 2.2 Bài 2 từ (§4.4) — luật mới trong `xepBai`
- Record `select_dialog`/`fill_dialog` gắn `vocab_id` = A, `payload.blank_b_vocab_id` = B.
- Query đã lấy theo `vocab_id IN (session)`; **bổ sung** query thứ 2 `payload->>blank_b_vocab_id IN (session)`
  rồi gộp **loại trùng theo `exercises.id`** → câu chỉ xuất hiện 1 lần dù A, B hay cả 2 cùng trong session.
- `xepBai` dựng **1 màn** cho mỗi record; `la_bai_cuoi[id]` chỉ đặt cho từ **có trong session**.
- Chấm: 2 chỗ trống chấm độc lập; với mỗi từ **trong session** gọi `xuLyTraLoi` riêng với `dang_due: true`.
  Từ **không** trong session: không gọi, không ghi log ("ôn thêm miễn phí").
- `cycle_completed_exercises` ghi `select_dialog`/`fill_dialog` cho từng từ đã chấm đúng.

### 2.3 Lọc hàng retry theo dạng CÓ RECORD (chốt Q4)
`srs.ts` giữ nguyên (không biết từ nào có record nào). Trong `PlayerPage.traLoi`, trước khi gọi RPC:
```ts
const retry = locRetryTheoRecord(kq.vao_retry_queue, dangCoRecord[vocab_id])  // player.ts, thuần
```
- `exercise_types === null` (retry cả bộ) → giữ nguyên.
- Lọc bỏ dạng **cần record mà từ không có** (`select_dialog`, `fill_dialog`, `select_on_describe`,
  `select_sentence`, `arrange_words`, `grammar`, `selection`, `audio_recognition`, `fast_decision`).
- Sau lọc rỗng → trả `null` (không tạo hàng retry) ⇒ từ vẫn nằm trong session thường, không kẹt.
- `dangCoRecord` = map `vocab_id → DangBai[]` dựng từ chính query `exercises` đã tải (0 query thêm).

### 2.4 Chấm từng dạng
| Dạng | Đáp án đúng | So khớp |
|---|---|---|
| `translate` · `listen_fill` | `vocab.word` | `trim()`, phân biệt hoa/thường với `en` → so `toLowerCase()` |
| `trans_collocation` | `vocab.collocation` | như trên |
| `fill_dialog` | A: `payload.blank_a_answer` · B: `vocab_b.word` | như trên |
| `select_dialog` | chip đúng cho từng chỗ trống | so chuỗi |
| `arrange_words` | thứ tự `payload.tokens` gốc | so mảng text; hiển thị đã `xaoTron` |
| `select_on_describe` | `vocab.word` | so chuỗi |
| `select_sentence` | `payload.correct_sentence.text` | so chuỗi |

**Gợi ý (DEC-19):** pattern 2 = lộ thêm 1 ký tự mỗi lần bấm (progressive, `UI_DESIGN` §6.1);
pattern 3 = đưa đúng 1 chip tiếp theo vào khay; pattern 7 Select = ẩn 1 chip sai; Fill = lộ 1 ký tự ô A;
pattern 1 = ẩn dần đáp án sai (đã có).

### 2.5 Gõ chữ Hán + IME (chốt Q3)
Ô ký tự **không** phải N `<input maxLength=1>` (IME cần gõ nhiều ký tự latin trước khi ra chữ Hán).
Dùng **1 `<input>` thật trong suốt phủ lên** (`absolute inset-0 opacity-0`), bên dưới render N ô hiển thị
`giaTri[i]`; ô đang gõ = ô thứ `giaTri.length`. `lang='zh'` → N ô; `lang='en'` → **1 ô nhập dài** (`doctor`
6 chữ cái, 6 ô rời trông rối).

---

## 3. Kế hoạch — 18 task (2–5 phút/task)

**Lớp thuần (TDD từng cặp)**
- T1/T2 · `xepBai` mở rộng: thứ tự stage1 (`translate → select_dialog → listen_fill → select_on_describe`),
  stage2, bài 2 từ dựng 1 màn, `la_bai_cuoi` chỉ cho từ trong session, dạng không cần record vẫn dựng màn khi
  thiếu bản ghi. 6 ca.
- T3/T4 · `soKhopDapAn(nhap, dung, lang)` (trim, `en` không phân biệt hoa thường) + `chamArrange(daChon, tokens)`
  + `locRetryTheoRecord`. 7 ca.
- T5 · Test X-player giữ nguyên (chỉ import `srs.ts`).

**UI**
- T6 · `DienTu.tsx` — ô ký tự + input phủ (IME), nhánh `en` 1 ô, gợi ý lộ ký tự, nút Kiểm tra, feedback đúng/sai.
- T7 · `SapXep.tsx` — 2 hàng chip, bấm qua lại, gợi ý đưa chip đúng, Kiểm tra.
- T8 · `HoiThoai.tsx` — 2 khối A/B, `___` tím, nhánh Select (4 chip) / Fill (2 ô nhập), chấm 2 chỗ độc lập.
- T9 · `TracNghiem.tsx` mở rộng 2 chế độ mới (`select_on_describe` 2×2 từ, `select_sentence` 1 cột câu).
- T10 · `PlayerPage` — nối 4 component, query OR `blank_b_vocab_id`, `traLoiDialog` (2 từ), `locRetryTheoRecord`,
  `MAX` theo màn (560/640/680).

**Kiểm**
- T11 · `npm run build` · `lint` · `npm test` (116 + ~13).
- T12 · CDP **stage1 thật** (7 từ due): chạy hết session, 1 câu sai, 1 lần gợi ý pattern 2, đối chiếu
  `review_log`/`word_state`; chụp PC+Mobile 3 pattern mới.
- T13 · CDP **stage2 thật**: sau khi có từ lên stage2, **kéo `next_review_date` của các từ đó về hôm nay**
  (thao tác DB duy nhất, ghi rõ trước/sau), chạy tiếp session stage2 → kiểm `arrange_words`, `select_sentence`,
  `trans_collocation`, `fill_dialog`.
- T14 · Kiểm bài 2 từ: xác nhận `select_dialog` của 苹果 chỉ hiện **1 lần** dù cả A và B cùng due; log ghi
  đúng 2 dòng (nếu cả 2 due) hoặc 1 dòng.
- T15 · Kiểm `locRetryTheoRecord`: từ thiếu `select_dialog` không tạo hàng retry chứa dạng đó.
- T16 · Dọn process · T17 · memory-bank (MB-21) · T18 · soát checklist §4.

---

## 4. Checklist soát ở Bước 4 — đã soát ✅
(Bổ sung sau khi kiểm thật: `coBaiTinhDiem` chặn session lặp vô hạn; `arrange_words` dùng khoá
`text` của payload thật — chi tiết MB-21.)

- [ ] Không hex trong component; chỉ utility Lớp 2; class Tailwind nguyên chuỗi.
- [ ] Bài 2 từ: 1 màn duy nhất, chỉ cộng điểm cho từ due (§4.4), `la_bai_cuoi` đúng từng từ.
- [ ] Hàng retry không bao giờ chứa dạng mà từ đó không có record.
- [ ] Pattern 2 gõ được bằng IME (1 input thật); `en` dùng 1 ô dài.
- [ ] Gợi ý đúng tinh thần progressive; điểm ×50% làm tròn xuống (DEC-19 — `srs.ts` lo).
- [ ] Sai → chỉ tô ô/chip vừa chọn, không lộ đáp án đúng.
- [ ] Luật SRS vẫn chỉ nằm ở `srs.ts`; `player.ts` thuần, chỉ import `srs.ts`.

---

## 5. PLAN chi tiết — code cụ thể từng task

### T1 · RED — `xepBai` mở rộng (thêm vào `player.test.ts`)
```ts
const BO1 = (ids: string[]) => ids.flatMap((v) => [
  bai(v, 'select_dialog', { dialog_a: 'a___', dialog_b: 'b___', blank_a_answer: 'X', blank_b_vocab_id: 'b' }),
  bai(v, 'select_on_describe', { description: 'mô tả', distractors: [{ word: 'x' }, { word: 'y' }, { word: 'z' }] }),
])
describe('xepBai — stage 1 & 2', () => {
  it('stage1: thứ tự translate → select_dialog → listen_fill → select_on_describe', () => {
    const { man } = xepBai({ tu: [tu('a', 'stage1')], baiTap: BO1(['a']) })
    expect(man.map((m) => m.loai)).toEqual(['flashcard', 'translate', 'select_dialog', 'listen_fill', 'select_on_describe'])
  })
  it('translate / listen_fill / trans_collocation KHÔNG cần record — vẫn dựng màn, không vào `thieu`', () => {
    const { man, thieu } = xepBai({ tu: [tu('a', 'stage1')], baiTap: [] })
    expect(man.map((m) => m.loai)).toEqual(['flashcard', 'translate', 'listen_fill'])
    expect(thieu).toEqual([{ vocab_id: 'a', type: 'select_dialog' }, { vocab_id: 'a', type: 'select_on_describe' }])
  })
  it('stage2: fill_dialog → select_sentence → arrange_words → trans_collocation', () => {
    const bt = [bai('a', 'fill_dialog', { blank_a_answer: 'X', blank_b_vocab_id: 'b' }),
                bai('a', 'select_sentence', { correct_sentence: { text: 'c' }, wrong_sentences: [] }),
                bai('a', 'arrange_words', { tokens: [{ text: 'x' }] })]
    const { man } = xepBai({ tu: [tu('a', 'stage2')], baiTap: bt })
    expect(man.map((m) => m.loai)).toEqual(['flashcard', 'fill_dialog', 'select_sentence', 'arrange_words', 'trans_collocation'])
  })
  it('bài 2 từ: 1 record dùng cho cả A và B trong session → đúng 1 màn, la_bai_cuoi cho cả 2', () => {
    const bt = [bai('a', 'select_dialog', { blank_a_answer: 'X', blank_b_vocab_id: 'b' })]
    const { man } = xepBai({ tu: [tu('a', 'stage1'), tu('b', 'stage1')], baiTap: bt })
    const d = man.find((m) => m.loai === 'select_dialog')
    expect(d && d.loai === 'select_dialog' ? [d.vocab_a, d.vocab_b] : null).toEqual(['a', 'b'])
    expect(d && d.loai === 'select_dialog' ? d.la_bai_cuoi : null).toEqual({ a: false, b: false })  // còn listen_fill sau
  })
  it('bài 2 từ: B KHÔNG trong session → la_bai_cuoi chỉ có A', () => {
    const bt = [bai('a', 'select_dialog', { blank_a_answer: 'X', blank_b_vocab_id: 'zzz' })]
    const { man } = xepBai({ tu: [tu('a', 'stage1')], baiTap: bt })
    const d = man.find((m) => m.loai === 'select_dialog')
    expect(d && d.loai === 'select_dialog' ? Object.keys(d.la_bai_cuoi) : null).toEqual(['a'])
  })
  it('record select_dialog gắn B (A không due) vẫn dựng màn cho B', () => {
    const bt = [{ ...bai('x', 'select_dialog', { blank_a_answer: 'X', blank_b_vocab_id: 'a' }) }]
    const { man } = xepBai({ tu: [tu('a', 'stage1')], baiTap: bt })
    const d = man.find((m) => m.loai === 'select_dialog')
    expect(d && d.loai === 'select_dialog' ? [d.vocab_a, d.vocab_b] : null).toEqual(['x', 'a'])
  })
})
```

### T2 · GREEN — `player.ts`
```ts
export type TuPinyin = { word: string; pinyin?: string | null }
export type Cau = { text: string; pinyin?: string | null }
export type PayloadDialog = {
  dialog_a: string; dialog_b: string; dialog_a_pinyin?: string; dialog_b_pinyin?: string
  blank_a_answer: string; blank_b_vocab_id?: string | null; distractors?: TuPinyin[]
}
// Man += 5 biến thể (xem DESIGN §2.1). KHONG_CAN_RECORD = {flashcard, translate, listen_fill, trans_collocation}
const THU_TU_MAN: readonly DangBai[] = [
  'flashcard', 'grammar', 'matching', 'selection', 'audio_recognition', 'fast_decision',
  'translate', 'select_dialog', 'listen_fill', 'select_on_describe',
  'fill_dialog', 'select_sentence', 'arrange_words', 'trans_collocation',
]
```
Trong vòng lặp `xepBai`:
- `translate | listen_fill | trans_collocation` → dựng màn không cần `baiTap`.
- `select_dialog | fill_dialog` → **xử lý theo record**, không theo từ: lọc `baiTap.filter(b => b.type === dang)`
  rồi giữ record có `b.vocab_id ∈ session` **hoặc** `payload.blank_b_vocab_id ∈ session`; mỗi record 1 màn
  `{ vocab_a: b.vocab_id, vocab_b: payload.blank_b_vocab_id ?? null, payload, la_bai_cuoi: {} }`.
  Từ trong session mà **không** thuộc record nào → `thieu.push({vocab_id, type: dang})`.
- Duyệt ngược đánh `la_bai_cuoi`: nhánh dialog xử lý như `matching` nhưng **chỉ cho từ có trong session**
  (`idsTrongSession.has(id)`), tức nhận thêm tham số tập id.

### T3 · RED — `soKhopDapAn` · `chamArrange` · `locRetryTheoRecord`
```ts
describe('soKhopDapAn', () => {
  it('trim 2 đầu', () => { expect(soKhopDapAn('  苹果 ', '苹果', 'zh')).toBe(true) })
  it('zh: sai 1 ký tự là sai', () => { expect(soKhopDapAn('苹菓', '苹果', 'zh')).toBe(false) })
  it('en: không phân biệt hoa thường', () => { expect(soKhopDapAn('Doctor', 'doctor', 'en')).toBe(true) })
  it('rỗng → sai', () => { expect(soKhopDapAn('', '苹果', 'zh')).toBe(false) })
})
describe('chamArrange', () => {
  it('đúng thứ tự gốc', () => { expect(chamArrange(['我', '吃'], [{ word: '我' }, { word: '吃' }])).toBe(true) })
  it('sai thứ tự', () => { expect(chamArrange(['吃', '我'], [{ word: '我' }, { word: '吃' }])).toBe(false) })
  it('thiếu chip', () => { expect(chamArrange(['我'], [{ word: '我' }, { word: '吃' }])).toBe(false) })
})
describe('locRetryTheoRecord', () => {
  const co: DangBai[] = ['select_on_describe']
  it('bỏ dạng cần record mà từ không có', () => {
    expect(locRetryTheoRecord({ reason: 'below_threshold', exercise_types: ['select_dialog', 'select_on_describe'] }, co))
      .toEqual({ reason: 'below_threshold', exercise_types: ['select_on_describe'] })
  })
  it('giữ dạng KHÔNG cần record dù không có bản ghi', () => {
    expect(locRetryTheoRecord({ reason: 'below_threshold', exercise_types: ['translate', 'listen_fill'] }, [])
      ?.exercise_types).toEqual(['translate', 'listen_fill'])
  })
  it('sau lọc rỗng → null (không tạo hàng retry)', () => {
    expect(locRetryTheoRecord({ reason: 'below_threshold', exercise_types: ['select_dialog'] }, [])).toBeNull()
  })
  it('exercise_types null (cả bộ) → giữ nguyên; đầu vào null → null', () => {
    const caBo = { reason: 'flashcard_again' as const, exercise_types: null }
    expect(locRetryTheoRecord(caBo, [])).toBe(caBo)
    expect(locRetryTheoRecord(null, [])).toBeNull()
  })
})
```

### T4 · GREEN
```ts
/** So khớp đáp án nhập tay (§6.3): trim 2 đầu; tiếng Anh không phân biệt hoa thường. */
export function soKhopDapAn(nhap: string, dung: string, lang: 'zh' | 'en'): boolean {
  const a = nhap.trim(), b = dung.trim()
  if (!a) return false
  return lang === 'en' ? a.toLowerCase() === b.toLowerCase() : a === b
}

/** Arrange Words: đúng khi thứ tự chip khớp mảng tokens GỐC (§6.3 #13). */
export function chamArrange(daChon: string[], tokens: TuPinyin[]): boolean {
  return daChon.length === tokens.length && daChon.every((t, i) => t === tokens[i]?.word)
}

const CAN_RECORD_SET: ReadonlySet<DangBai> = CAN_RECORD  // dùng lại tập đã có, +5 dạng mới

/**
 * Lọc hàng retry theo dạng bài mà từ đó THỰC SỰ có record (chốt M4b/Q4): DB có thể thiếu
 * select_dialog/fill_dialog cho phần lớn từ → nếu vẫn ghi vào hàng đợi thì lượt "Ôn lại" dựng 0 màn
 * mà từ lại bị loại khỏi session thường ⇒ kẹt cả ngày.
 */
export function locRetryTheoRecord(
  retry: { reason: 'below_threshold' | 'flashcard_again'; exercise_types: DangBai[] | null } | null,
  dangCoRecord: DangBai[],
) {
  if (!retry || retry.exercise_types === null) return retry
  const co = new Set(dangCoRecord)
  const con = retry.exercise_types.filter((d) => !CAN_RECORD_SET.has(d) || co.has(d))
  return con.length > 0 ? { ...retry, exercise_types: con } : null
}
```

### T5 · Chạy `npm test` — X-player vẫn xanh (chỉ import `./srs.ts`).

### T6 · `src/features/player/bai/DienTu.tsx`
```tsx
/**
 * Pattern 2 — điền từ nhập tay (mockup 03): Translate · Listen Fill · Trans Collocation, và dùng lại
 * cho 2 ô của Fill Dialog. Ô ký tự KHÔNG phải N input maxLength=1 (IME tiếng Trung cần gõ nhiều ký tự
 * latin trước khi ra chữ Hán) → 1 input thật trong suốt phủ lên, dưới render N ô hiển thị.
 * `en` dùng 1 ô nhập dài (doctor = 6 ô rời trông rối). Gợi ý: lộ thêm 1 ký tự mỗi lần bấm (§6.1).
 */
type Props = { vocab: VocabDb; cheDo: 'translate' | 'listen_fill' | 'trans_collocation'; hienPhienAm: boolean; soGoiY: number; onTraLoi: (dung: boolean, dung_goi_y: boolean) => void }
const dapAn = cheDo === 'trans_collocation' ? (vocab.collocation ?? '') : vocab.word
const [giaTri, setGiaTri] = useState('')
const [kq, setKq] = useState<null | boolean>(null)
useEffect(() => { if (soGoiY > 0) setGiaTri(dapAn.slice(0, Math.min(soGoiY, dapAn.length - 1))) }, [soGoiY])
function kiemTra() {
  const dung = soKhopDapAn(giaTri, dapAn, vocab.lang)
  setKq(dung)
  setTimeout(() => onTraLoi(dung, soGoiY > 0), dung ? 600 : 1000)
}
// Thẻ hỏi theo chế độ: translate → meaning_vi 26/600 + "Nhập từ tiếng Trung/Anh";
//   listen_fill → nút loa 64 + "Nghe và gõ lại"; trans_collocation → collocation_meaning_vi + "Nhập cụm từ".
// zh: <div className="relative flex justify-center gap-4"> N ô + <input className="absolute inset-0 opacity-0" …/>
//     ô i: giaTri[i] ? 'rounded-10 md:rounded-12 border-2 border-accent' : 'border-b-2 border-border-input'
//     (khi kq !== null → viền/chữ success|danger)
// en: 1 <input> dài (rounded-12 border-2 px-4 py-3 text-20 text-center)
// nút "Kiểm tra" disabled khi giaTri rỗng
```

### T7 · `src/features/player/bai/SapXep.tsx`
```tsx
/** Pattern 3 — sắp xếp từ (mockup 04). Chip hàng dưới (chưa chọn) ↔ khay trên (đã chọn); bấm để chuyển. */
const xao = useMemo(() => xaoTron(payload.tokens, Math.random), [payload.tokens])
const [khay, setKhay] = useState<TuPinyin[]>([])      // giữ object để hiện pinyin
const conLai = xao.filter((t) => !khay.includes(t))
// gợi ý: đưa token đúng tiếp theo (payload.tokens[khay.length]) từ conLai vào khay
function kiemTra() { const dung = chamArrange(khay.map((t) => t.word), payload.tokens); … như DienTu }
// Đề: "Sắp xếp thành câu: <b>{vocab.example_meaning_vi ?? vocab.meaning_vi}</b>"
// Khay: rounded-16 border border-border-card bg-surface-card p-[18px] min-h-16 flex flex-wrap gap-[10px]
// Chip đã chọn: rounded-10 border-[1.5px] border-accent bg-accent-tint px-[18px] py-[10px] font-han text-18 font-semibold text-accent-text
// Chip chưa chọn: rounded-10 border border-border-input bg-surface-raised … text-content-primary
```

### T8 · `src/features/player/bai/HoiThoai.tsx`
```tsx
/**
 * Pattern 7 — hội thoại điền chỗ trống (mockup 08). 1 record = 2 chỗ trống = 2 TỪ (§4.4).
 * Select Dialog: 4 chip (đáp án A + từ B + 2 distractors, đã xáo). Fill Dialog: 2 ô nhập tay tại chỗ trống.
 * Chấm 2 chỗ độc lập; tầng gọi quyết định từ nào được tính điểm (chỉ từ đang due).
 */
type Props = { cheDo: 'select_dialog' | 'fill_dialog'; payload: PayloadDialog; tuB: VocabDb | null
  hienPhienAm: boolean; soGoiY: number; onTraLoi: (kq: { a: boolean; b: boolean }, dung_goi_y: boolean) => void }
const dapAnA = payload.blank_a_answer, dapAnB = tuB?.word ?? ''
const [dienA, setDienA] = useState(''), [dienB, setDienB] = useState('')
// Select: chip = xaoTron([dapAnA, dapAnB, ...distractors.map(d => d.word)]) — bấm → điền ô trống đang chờ (A trước)
//   ẩn 1 chip sai khi bấm gợi ý
// Fill: 2 ô ký tự nhỏ (h-[46px] w-[42px]) + nút "Kiểm tra"; gợi ý lộ 1 ký tự ô A
// Câu: tách dialog_a theo '___' → <span className="font-bold text-accent">___ | giá trị đã điền</span>
// Đủ 2 chỗ (Select tự chấm; Fill bấm Kiểm tra) → onTraLoi({ a: soKhopDapAn(dienA, dapAnA, lang), b: … })
```

### T9 · `TracNghiem.tsx` mở rộng
- `cheDo` thêm `'select_on_describe' | 'select_sentence'`; props thêm `payloadMoi`.
- `select_on_describe`: `luaChon = xaoTron([vocab.word, ...distractors.map(d => d.word)])`, thẻ hỏi =
  `description` (`text-15 text-content-nav`, không `font-han`), ô đáp án `font-han text-17`.
- `select_sentence`: `luaChon = xaoTron([correct.text, ...wrong.map(w => w.text)])`, lưới **1 cột**
  (`grid-cols-1`), ô `text-left font-han text-17` + pinyin 12.5 muted khi bật phiên âm.
- Đáp án đúng truyền vào qua prop `dapAn: string` thay vì luôn là `meaning_vi`.

### T10 · `PlayerPage`
```ts
// query: lấy thêm record dialog gắn theo vai B
const [btChinh, btB] = await Promise.all([
  supabase.from('exercises').select('id, vocab_id, type, payload').in('vocab_id', ids).in('type', [...boBaiCua(stage), 'grammar']),
  supabase.from('exercises').select('id, vocab_id, type, payload').in('type', ['select_dialog', 'fill_dialog'])
    .in('payload->>blank_b_vocab_id', ids),
])
const baiTap = [...new Map([...(btChinh.data ?? []), ...(btB.data ?? [])].map((b) => [b.id, b])).values()]
// map dạng có record để lọc retry
const dangCoRecord: Record<string, DangBai[]> = {} // vocab_id → types (tính cả vai B của dialog)
// traLoi(): p_retry = locRetryTheoRecord(kq.vao_retry_queue, dangCoRecord[vocab_id] ?? [])
// traLoiDialog(m, kq): với mỗi id ∈ Object.keys(m.la_bai_cuoi) gọi traLoi(id, m.loai, kq[id === m.vocab_a ? 'a' : 'b'], …, khong_sang = chưa phải từ cuối)
// MAX theo màn: translate|listen_fill|trans_collocation 560 · arrange_words 640 · dialog 680 · select_sentence 600
// vocab của từ B có thể KHÔNG trong session → tải riêng vào `vocab` state (1 query `in('id', idsB)`)
```

### T11 · `npm run build` · `npm run lint` · `npm test` (kỳ vọng 116 + ~13 = ~129).

### T12 · CDP stage1 thật (7 từ due hôm nay)
Kịch bản: chạy hết session stage1 — Translate (1 lần bấm gợi ý → lộ ký tự), Select Dialog (nếu có),
Listen Fill, Select on Describe (1 câu cố ý sai) → Tổng kết. Đối chiếu `review_log` (số dòng = số bài,
`used_hint` đúng), `word_state` (lên stage2 với gap +4×hệ số), `daily_retry_queue`.
Chụp: `m4b-dientu.png`, `m4b-hoithoai.png`, `m4b-mobile-dientu.png` (PC light + Mobile).

### T13 · CDP stage2 thật
Sau T12, các từ lên `stage2` có `next_review_date` tương lai → **kéo về hôm nay** bằng PostgREST
(đăng nhập như app), **ghi rõ trước/sau**; chạy session stage2: Fill Dialog · Select Sentence ·
Arrange Words · Trans Collocation. Chụp `m4b-sapxep.png`, `m4b-selectsentence.png`, dark 1 màn.

### T14 · Kiểm bài 2 từ
Với 苹果 (có `select_dialog`, từ B = 香蕉): xác nhận câu chỉ hiện **1 lần** trong session dù cả 2 due;
`review_log` ghi **2 dòng** `select_dialog` (2 từ đều due) — hoặc 1 dòng nếu chỉ 1 từ due.

### T15 · Kiểm `locRetryTheoRecord` trên DB thật
Ép 1 từ thiếu `select_dialog` xuống ngưỡng (dùng gợi ý) → xác nhận hàng retry của nó **không** chứa
`select_dialog`, và lượt "Ôn lại" dựng được màn.

### T16 · Dọn process (dev server + Chrome headless).
### T17 · memory-bank: `activeContext` (M4b ✅, trạng thái DB mới), `progress`, `decisionLog` MB-21
(bài 2 từ, lọc retry theo record, IME input, `en` 1 ô, thứ tự màn stage1/2).
### T18 · Soát checklist §4.
