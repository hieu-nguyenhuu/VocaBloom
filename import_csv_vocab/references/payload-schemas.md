# Payload Schema Reference — VocaBloom Import (17 dạng bài + bảng vocab)

> Tài liệu này là **nguồn sự thật duy nhất** cho tên field. Sai tên field = UI không render được (không báo lỗi rõ ràng, chỉ hiển thị trống). Đọc kỹ trước khi sinh bất kỳ record `exercises` nào.
>
> **Có bản hình thức, máy-đọc-được:** `references/import-schema.json` (JSON Schema Draft 2020-12) biểu diễn chính xác mọi quy tắc dưới đây dưới dạng validate-được tự động — dùng file đó để kiểm tra chương trình, dùng tài liệu NÀY để đọc hiểu ý nghĩa từng field khi sinh nội dung.
>
> Quy ước: mọi tên field dưới đây phải chép **CHÍNH XÁC TỪNG KÝ TỰ** (đúng chữ hoa/thường, đúng dấu gạch dưới `_`), không được đổi tên, không được thêm/bớt field ngoài những gì liệt kê.

---

## 0. Bảng `vocab` (mỗi từ trong mảng `vocab` của file JSON)

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `temp_id` | string | ✅ | Định danh tạm trong phạm vi 1 file, dùng để nối `exercises`/`dialogue` tới đúng từ này. Quy ước: `"v1"`, `"v2"`, ... theo thứ tự xuất hiện trong file. |
| `word` | string | ✅ | Từ vựng gốc (chữ Hán nếu `lang="zh"`, chữ Latin nếu `lang="en"`). |
| `pinyin` | string \| null | ✅ (key luôn phải có mặt) | Phiên âm pinyin có dấu thanh nếu `lang="zh"` (BẮT BUỘC có nội dung thật, không được null). Nếu `lang="en"`, key vẫn phải có mặt trong object nhưng giá trị để `null`. |
| `meaning_vi` | string | ✅ | Nghĩa tiếng Việt. Lấy từ cột `meaning` của CSV nếu có nội dung; nếu CSV để trống, AI tự sinh. |
| `collocation` | string | ✅ | Cụm từ thường đi kèm (VD lượng từ + danh từ với tiếng Trung: `一个苹果`). |
| `collocation_pinyin` | string \| null | ✅ (key luôn phải có mặt) | Phiên âm của `collocation`. BẮT BUỘC có nội dung thật nếu `lang="zh"`; nếu `lang="en"` key vẫn phải có mặt, giá trị để `null`. |
| `collocation_meaning_vi` | string | ✅ | Nghĩa tiếng Việt của `collocation`. |
| `example_sentence` | string | ✅ | 1 câu ví dụ tự nhiên chứa `word`. |
| `example_meaning_vi` | string | ✅ | Nghĩa tiếng Việt của `example_sentence`. |
| `lang` | string | ✅ | Chỉ nhận `"zh"` hoặc `"en"`. |

---

## 1. Danh sách 17 `exercise.type` — enum hợp lệ (chép chính xác, chữ thường, dấu gạch dưới)

```
flashcard, grammar, matching, selection, audio_recognition, fast_decision,
translate, select_dialog, listen_fill, select_on_describe,
fill_dialog, select_sentence, arrange_words, trans_collocation,
make_sentence, trans_sentence, complete_situation
```

Bất kỳ giá trị nào khác 17 chuỗi trên (kể cả viết hoa, số ít/nhiều khác, dấu cách thay vì `_`) đều bị Import validator từ chối.

⚠️ **Lưu ý quan trọng:** đây là danh sách 17 dạng bài của TOÀN BỘ app, nhưng field `exercises[].type` trong FILE IMPORT chỉ được chấp nhận **11/17 giá trị** (xem mục 3) — 6 giá trị ở mục 2 (`flashcard, matching, translate, listen_fill, make_sentence, trans_collocation`) tuyệt đối KHÔNG được xuất hiện trong mảng `exercises`, Import validator của app **chặn cứng (reject enum)** nếu gặp, không phải chỉ cảnh báo.

---

## 2. Nhóm 6 dạng KHÔNG cần tạo record trong `exercises`

Player đọc thẳng từ bảng `vocab`, không cần payload. **KHÔNG tạo object nào trong mảng `exercises` cho các type này:**

| type | Vì sao không cần |
|---|---|
| `flashcard` | Đọc `word`, `pinyin`, `meaning_vi`, `collocation`, `example_sentence` trực tiếp từ `vocab` |
| `matching` | Đọc `word` + `meaning_vi` của 5 từ trong session |
| `translate` | Câu hỏi = `meaning_vi`, đáp án = `word` |
| `listen_fill` | Đáp án = `word`, phiên âm = `pinyin` |
| `make_sentence` | Câu hỏi = `word` + `meaning_vi` |
| `trans_collocation` | Đáp án = `collocation`, nghĩa = `collocation_meaning_vi`, phiên âm = `collocation_pinyin` |

---

## 3. Nhóm 11 dạng CẦN payload — chi tiết field-by-field

Mỗi mục dưới đây = 1 object cần thêm vào mảng `exercises`, dạng:
```json
{ "vocab_temp_id": "v1", "type": "<type>", "payload": { ... } }
```

### 3.1 `grammar`

| Field trong `payload` | Kiểu | Ghi chú |
|---|---|---|
| `content_target` | string | Nội dung ngữ pháp bằng ngôn ngữ đích (Trung/Anh theo `lang`). Giải thích cách dùng từ (VD lượng từ đi kèm). |
| `pinyin` | string \| null | **Key BẮT BUỘC luôn có mặt** (khác các field pinyin khác vốn optional theo ngữ cảnh — field này validator đòi hỏi key tồn tại). Có nội dung thật nếu `lang="zh"`; để `null` (không được bỏ hẳn key) nếu `lang="en"`. |
| `content_vi` | string | Giải thích bằng tiếng Việt. |

### 3.2 `selection`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `distractors` | array[string] | Đúng **3 phần tử**, mỗi phần tử là 1 nghĩa tiếng Việt SAI, hợp lý (cùng phạm trù với từ đúng, tránh nghĩa quá khác biệt dễ đoán). |

*Đáp án đúng = `vocab.meaning_vi`, KHÔNG lặp lại trong payload.*

### 3.3 `audio_recognition`

Cấu trúc **giống hệt** `selection`:
```json
{ "distractors": ["nghĩa sai 1", "nghĩa sai 2", "nghĩa sai 3"] }
```
*Có thể tái dùng cùng bộ `distractors` với `selection` của cùng từ để tiết kiệm công sinh.*

### 3.4 `fast_decision`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `wrong_meaning` | string | Đúng **1** nghĩa tiếng Việt sai. App tự random 50/50 lúc hiển thị. |

### 3.5 `select_on_describe`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `description` | string | Đoạn mô tả TIẾNG VIỆT, dài hơn `meaning_vi`, gợi mở đặc điểm để người học đoán ra từ (không được nêu thẳng nghĩa). |
| `distractors` | array[object] | Đúng **3 phần tử**, mỗi phần tử `{ "word": "...", "pinyin": "..." }` — LÀ TỪ VỰNG (không phải nghĩa), vì đáp án của dạng này là từ. |

*Đáp án đúng = `vocab.word` + `vocab.pinyin`.*

### 3.6 `select_sentence`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `correct_sentence` | object | `{ "text": "câu đúng chứa từ vựng", "pinyin": "..." }` |
| `wrong_sentences` | array[object] | Đúng **3 phần tử**, mỗi phần tử `{ "text": "...", "pinyin": "..." }`. Câu sai phải sai NGỮ PHÁP hoặc dùng từ SAI CÁCH (lượng từ sai, thứ tự từ sai, động từ không hợp) — không phải câu đúng về nghĩa nhưng chỉ khác chữ. |

### 3.7 `arrange_words`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `tokens` | array[object] | Mỗi phần tử `{ "text": "...", "pinyin": "..." }`, xếp THEO ĐÚNG THỨ TỰ câu hoàn chỉnh (app tự xáo trộn khi hiển thị, không cần xáo trộn sẵn trong payload). Mỗi token nên là 1 từ hoặc 1 cụm từ có nghĩa (không tách rời từng chữ Hán đơn lẻ nếu chúng tạo thành 1 từ, VD `每天` là 1 token, không tách `每`+`天`). |

### 3.8 `trans_sentence`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `vietnamese_sentence` | string | 1 câu tiếng Việt hoàn chỉnh, khi dịch sang ngôn ngữ đích sẽ tự nhiên chứa từ vựng đang ôn. |

### 3.9 `complete_situation`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `situation_vi` | string | 1-2 câu MIÊU TẢ TÌNH HUỐNG bằng tiếng Việt (địa điểm, nhân vật, hoàn cảnh). |
| `given_sentence_zh` | string | 1 câu mở đầu bằng ngôn ngữ đích, để người học tiếp nối. |
| `given_sentence_pinyin` | string \| null | **Key BẮT BUỘC luôn có mặt.** Phiên âm của `given_sentence_zh` nếu `lang="zh"`; để `null` (không bỏ hẳn key) nếu `lang="en"`. |

### 3.10 `select_dialog` — CẦN 2 TỪ VỰNG, gắn vào từ "chính"

Chỉ tạo khi tìm được **2 từ vựng trong cùng topic ghép tự nhiên vào 1 đoạn hội thoại ngắn**. Không bắt buộc mọi từ đều có bài này.

| Field | Kiểu | Ghi chú |
|---|---|---|
| `dialog_a` | string | Câu A, chỗ trống viết là `___` (3 dấu gạch dưới liền nhau). |
| `dialog_a_pinyin` | string | Phiên âm cả câu A (giữ nguyên `___` ở đúng vị trí). |
| `dialog_b` | string | Câu B, cũng có `___`. |
| `dialog_b_pinyin` | string | Phiên âm cả câu B. |
| `blank_a_answer` | string | Đáp án đúng cho chỗ trống câu A = `word` của chính từ đang tạo record này (temp_id ở `vocab_temp_id`). |
| `blank_b_vocab_id` | string | `temp_id` của từ vựng thứ 2 (điền vào chỗ trống câu B). |
| `distractors` | array[object] | Đúng **2 phần tử**, mỗi phần tử `{ "word": "...", "pinyin": "..." }`, là từ KHÔNG liên quan chủ đề (để không gây nhầm lẫn với 2 đáp án đúng). |

Record này được tạo với `vocab_temp_id` = từ A (từ "chính").

### 3.11 `fill_dialog` — giống `select_dialog` nhưng KHÔNG có đáp án chọn (nhập tay)

Field giống hệt `select_dialog` NHƯNG **bỏ hẳn field `distractors`**:

```json
{
  "dialog_a": "...", "dialog_a_pinyin": "...",
  "dialog_b": "...", "dialog_b_pinyin": "...",
  "blank_a_answer": "...",
  "blank_b_vocab_id": "..."
}
```

---

## 4. Cấu trúc file JSON hoàn chỉnh (khung ngoài cùng)

```json
{
  "topic": { "name": "...", "description": "..." },
  "vocab": [ /* mảng object theo mục 0 */ ],
  "exercises": [ /* mảng object theo mục 3 */ ],
  "dialogue": {
    "lines": [
      {
        "speaker": "A" | "B",
        "text_zh": "...",
        "pinyin": "...",
        "text_vi": "...",
        "highlight_vocab_temp_ids": ["v1", "v3"]
      }
    ]
  }
}
```

- `dialogue` (cả object) về mặt schema thật của app là **tùy chọn** (có thể vắng mặt hoặc `null`) — nhưng quy trình skill này LUÔN sinh đủ `dialogue` cho mọi topic (xem Bước 3.4 ở `SKILL.md`), không tự ý bỏ qua.
- `dialogue.lines`: 7–10 câu, xen kẽ A/B, dùng CÀNG NHIỀU từ vựng trong topic CÀNG TỐT (không bắt buộc mọi câu đều có `highlight_vocab_temp_ids` — câu đệm không chứa từ vựng thì để mảng rỗng `[]`).
- Trường `pinyin` trong `dialogue.lines` áp dụng cho cả câu, khác với field `pinyin` trong `arrange_words.tokens` (theo từng từ).

> ⚠️ **Lưu ý khi topic có `lang="en"`:** tên field `text_zh` (trong `dialogue.lines`) và `given_sentence_zh` (trong `complete_situation`, mục 3.9) VẪN GIỮ NGUYÊN tên gọi này dù nội dung là tiếng Anh — đây là tên field cố định của schema, KHÔNG đổi thành `text_en` hay tương tự. Chỉ cần điền câu tiếng Anh vào đúng field đó; để `pinyin`/`given_sentence_pinyin` tương ứng là chuỗi rỗng `""` hoặc `null`.

---

## 5. Checklist tự kiểm tra trước khi giao file (bắt buộc rà lại)

- [ ] File là JSON hợp lệ (không thiếu dấu phẩy/ngoặc).
- [ ] Mọi `exercise.type` trong mảng `exercises` thuộc đúng **11 giá trị ở mục 3** (KHÔNG phải 17 — 6 giá trị ở mục 2 tuyệt đối không được xuất hiện ở đây).
- [ ] Mọi `vocab_temp_id` trong `exercises` khớp với 1 `temp_id` có thật trong mảng `vocab` CÙNG file.
- [ ] Mọi `blank_b_vocab_id` (trong `select_dialog`/`fill_dialog`) khớp với 1 `temp_id` có thật.
- [ ] Mọi `highlight_vocab_temp_ids` trong `dialogue.lines` khớp với `temp_id` có thật.
- [ ] Không có field nào ngoài danh sách đã liệt kê ở mục 0 và mục 3 (không tự thêm field thừa như `id`, `difficulty`, `answer`...).
- [ ] Mọi field phiên âm (`pinyin`, `collocation_pinyin` ở mục 0; `pinyin` trong `grammar`; `given_sentence_pinyin` trong `complete_situation`) đều có KEY xuất hiện trong object dù `lang="en"` (giá trị `null`, KHÔNG bỏ hẳn key).
- [ ] `distractors` đúng số lượng bắt buộc: `selection`/`audio_recognition`=3, `select_on_describe`=3, `select_sentence`.wrong_sentences=3, `select_dialog`.distractors=2.
- [ ] Mỗi từ vựng có đủ 9 dạng bài bắt buộc (không tính `select_dialog`/`fill_dialog` — 2 dạng này tùy chọn theo cặp): `grammar, selection, audio_recognition, fast_decision, select_on_describe, select_sentence, arrange_words, trans_sentence, complete_situation`.
