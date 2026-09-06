---
name: vocab-csv-to-import
description: Chuyển 1 file CSV danh sách từ vựng (3 cột "vocab", "meaning", "topic" — đã gom sẵn theo topic) thành các file JSON sẵn sàng import vào app VocaBloom, đúng 100% schema (topics/vocab/exercises/dialogue) cho toàn bộ 17 dạng bài tập. LUÔN dùng skill này khi người dùng đưa file CSV từ vựng và yêu cầu tạo dữ liệu bài tập, sinh nội dung ôn tập, hoặc chuẩn bị file để import vào VocaBloom — kể cả khi họ không nhắc từ "skill" hay "import". Xử lý được danh sách lớn (200-300+ dòng, nhiều topic) bằng cách tự động tách theo cột topic thành nhiều file JSON riêng biệt. Luôn đọc references/payload-schemas.md trước khi sinh bất kỳ field nào — sai tên field sẽ khiến UI của app không hiển thị được dữ liệu.
---

# Vocab CSV → VocaBloom Import JSON

Chuyển đổi 1 file CSV từ vựng thô thành bộ file JSON hoàn chỉnh, đúng schema, sẵn sàng import vào app VocaBloom (spaced-repetition, 17 dạng bài tập).

## Bước 0 — Đọc tài liệu tham chiếu TRƯỚC KHI làm bất cứ gì

**Bắt buộc đọc `references/payload-schemas.md` trước** — đây là nguồn sự thật cho tên field của cả 17 dạng bài. Đừng gen field theo trí nhớ hay suy đoán; tên field sai (kể cả chỉ khác 1 ký tự, khác hoa/thường) khiến app hiển thị trống mà không báo lỗi.

## Bước 1 — Đọc & rà soát CSV input

- File CSV có header, đúng **3 cột**: `vocab`, `meaning`, `topic` (không phân biệt hoa/thường tên cột).
- Với mỗi dòng:
  - `vocab` = từ vựng gốc → sẽ thành field `word`. LUÔN có giá trị.
  - `topic` = tên chủ đề, do người dùng tự gom sẵn. LUÔN có giá trị — **tin tưởng hoàn toàn**, KHÔNG tự ý gom lại hay đổi tên.
  - `meaning`: NẾU có nội dung → dùng thẳng làm `meaning_vi` (KHÔNG tự sinh lại, tin tưởng dữ liệu người dùng cung cấp). NẾU rỗng → tự sinh nghĩa tiếng Việt phù hợp.
- Bỏ qua dòng trống hoàn toàn (không có `vocab`).
- Xác định `lang` cho từng từ: nếu `word` chứa ký tự Hán (CJK) → `"zh"`; nếu toàn ký tự Latin → `"en"`. Với `lang="en"`, để `pinyin` là `null` (không bắt buộc điền).

## Bước 2 — Nhóm dòng CSV theo cột `topic` (1 topic = 1 file JSON)

Vì CSV đã có sẵn cột `topic` do người dùng tự gom, **KHÔNG cần tự suy luận nhóm ngữ nghĩa** — chỉ cần `GROUP BY topic` theo đúng giá trị trong cột đó. Mỗi giá trị `topic` duy nhất → 1 file JSON riêng.

**2 ngoại lệ cần xử lý:**

1. **Topic quá lớn (>12 từ):** vẫn giữ đúng tên topic, nhưng chia thành nhiều file để session/hội thoại không quá dài — đặt tên file `{topic-slug}-p1.json`, `{topic-slug}-p2.json`... mỗi phần ~5-8 từ. Tên `topic.name` BÊN TRONG mỗi file JSON vẫn giữ nguyên tên gốc (không thêm "phần 1/2" vào `name`, chỉ khác ở tên FILE).
2. **Topic chỉ có 1-2 từ:** vẫn xử lý bình thường — `select_dialog`/`fill_dialog` có thể không tạo được nếu không đủ 2 từ liên quan trong CÙNG topic (không được ghép từ 2 topic khác nhau lại với nhau). `dialogue` vẫn cố viết đủ 7-10 câu dù vốn từ ít (dùng thêm ngữ cảnh chung quanh chủ đề, miễn câu hội thoại tự nhiên và có sử dụng từ vựng đó).

Với CSV 200-300 dòng đã gom sẵn topic → số lượng file phụ thuộc số topic khác nhau trong CSV (cộng thêm các topic bị chia nhỏ do >12 từ). Xử lý tuần tự từng topic một, không cố nhồi tất cả vào 1 lần trả lời.

## Bước 3 — Với mỗi topic, sinh đủ 4 phần theo đúng khung (xem `references/payload-schemas.md` mục 4)

### 3.1 `topic`
`{ "name": "...", "description": "1 câu mô tả ngắn" }`

### 3.2 `vocab`
Với mỗi từ trong nhóm: gán `temp_id` tuần tự `"v1"`, `"v2"`... rồi điền đủ field theo **mục 0** của `payload-schemas.md`. Chú ý:
- `collocation`, `example_sentence` phải TỰ NHIÊN, đúng ngữ pháp, thực sự dùng được (không phải câu máy móc).
- Với `lang="zh"`: mọi câu tiếng Trung đều PHẢI có phiên âm pinyin đi kèm (có dấu thanh, VD `píngguǒ` không viết `pingguo`).

### 3.3 `exercises`
Với **mỗi từ vựng**, sinh đủ **9 dạng bài bắt buộc** (đọc kỹ field name ở mục 3 của `payload-schemas.md`, KHÔNG được thiếu field, KHÔNG được thêm field thừa):

```
grammar, selection, audio_recognition, fast_decision,
select_on_describe, select_sentence, arrange_words,
trans_sentence, complete_situation
```

6 dạng KHÔNG được tạo record (đọc mục 2 của `payload-schemas.md`): `flashcard, matching, translate, listen_fill, make_sentence, trans_collocation`.

2 dạng tùy chọn theo CẶP từ (không bắt buộc mọi từ có): `select_dialog`, `fill_dialog` — chỉ tạo khi tìm được 2 từ trong cùng topic ghép tự nhiên vào 1 tình huống hội thoại ngắn. Cố gắng tạo ít nhất 1 cặp/topic nếu khả thi, nhưng KHÔNG ép nếu không tự nhiên.

**Nguyên tắc chất lượng nội dung:**
- `distractors` (đáp án nhiễu) phải hợp lý — cùng phạm trù với đáp án đúng, không quá dễ đoán loại trừ, cũng không đánh lừa phi lý.
- `wrong_sentences` (câu sai) phải sai vì lý do NGỮ PHÁP/CÁCH DÙNG TỪ cụ thể (lượng từ sai, thứ tự từ sai, động từ không hợp với danh từ...), không phải câu đúng bị đổi vài chữ vô nghĩa.
- Mọi câu tiếng Trung xuất hiện trong payload đều cần trường `pinyin` đi kèm đúng tên field quy định (xem chi tiết từng dạng — tên field pinyin khác nhau theo từng type, VD `dialog_a_pinyin`, không phải `pinyin_a`).

### 3.4 `dialogue`
7–10 câu hội thoại (xen kẽ speaker A/B), dùng CÀNG NHIỀU từ trong topic càng tốt, đánh dấu đúng `highlight_vocab_temp_ids` cho câu nào chứa từ vựng nào (câu đệm không chứa từ thì để mảng rỗng `[]`).

## Bước 4 — Ghép file & đặt tên

- Tên file: `import-{số thứ tự 2 chữ số}-{topic-slug}.json`, VD `import-01-trai-cay.json`, `import-02-dong-vat.json`.
- Mỗi file JSON độc lập hoàn toàn (temp_id chỉ có ý nghĩa TRONG phạm vi 1 file, reset lại `"v1"` ở file kế tiếp).
- Lưu file bằng UTF-8, giữ nguyên dấu tiếng Việt và chữ Hán (không escape thành `\uXXXX`).

## Bước 5 — BẮT BUỘC validate trước khi giao file (2 lớp)

**Lớp 1 — JSON Schema chính thức** (`references/import-schema.json`, chuẩn Draft 2020-12): kiểm tra cấu trúc/kiểu dữ liệu/field bắt buộc theo từng `exercise.type`. Chạy bằng công cụ chuẩn, VD Python:

```bash
python3 -c "
import json, jsonschema
schema = json.load(open('references/import-schema.json', encoding='utf-8'))
data = json.load(open('import-01-trai-cay.json', encoding='utf-8'))
jsonschema.validate(data, schema)
print('OK')
"
```
(hoặc dùng `ajv-cli` nếu môi trường là Node.js: `ajv validate -s references/import-schema.json -d import-01-trai-cay.json --spec=draft2020`)

**Lớp 2 — script Python** (`scripts/validate_import.py`) — kiểm tra thêm phần JSON Schema KHÔNG làm được: đối chiếu `temp_id` có tồn tại chéo giữa `vocab`/`exercises`/`dialogue` hay không.

```bash
python3 scripts/validate_import.py import-01-trai-cay.json import-02-dong-vat.json ...
```

- Nếu có `❌ LỖI` ở BẤT KỲ lớp nào → sửa lại theo đúng thông báo, chạy lại cả 2 lớp cho tới khi sạch lỗi.
- `⚠️ cảnh báo` (chỉ từ lớp 2) không bắt buộc phải sửa (VD thiếu 1 dạng bài ở 1 từ nào đó vẫn import được), nhưng nên rà lại nếu số lượng cảnh báo nhiều bất thường.
- Nếu môi trường không chạy được Python/Node, tự đối chiếu thủ công theo checklist ở mục 5 của `references/payload-schemas.md`.

## Bước 6 — Báo cáo kết quả

Sau khi xong, tóm tắt cho người dùng: số topic/file đã tạo, tổng số từ vựng, kết quả validate (sạch lỗi hay còn cảnh báo gì), và danh sách file để họ tải về/import.

---

## Tài liệu đi kèm

- `references/payload-schemas.md` — **đọc bắt buộc trước khi sinh dữ liệu**, chứa đặc tả field chính xác cho cả 17 dạng bài + checklist tự kiểm tra.
- `references/import-schema.json` — **JSON Schema chính thức (Draft 2020-12)**, validate cấu trúc/kiểu dữ liệu tự động bằng công cụ chuẩn (ajv/jsonschema). Đã kiểm thử: bắt đúng lỗi thiếu field, sai enum, sai độ dài mảng, field thừa, vi phạm điều kiện `lang=zh → pinyin bắt buộc`.
- `references/example-output.json` — file mẫu HOÀN CHỈNH (3-5 từ tiếng Trung chủ đề "Trái cây"), có cả `select_dialog` lẫn `fill_dialog`, dùng làm ví dụ đối chiếu khi không chắc cấu trúc.
- `references/example-output-english-topic.json` — ví dụ topic `lang="en"` (chủ đề "Nghề nghiệp"), minh họa cách để `pinyin`=null và cách dùng field `text_zh`/`given_sentence_zh` cho nội dung tiếng Anh.
- `references/example-output-single-word-topic.json` — ví dụ topic chỉ có 1 từ (chủ đề "Thời tiết"), minh họa trường hợp không tạo được `select_dialog`/`fill_dialog`.
- `scripts/validate_import.py` — script Python kiểm tra tự động JSON syntax + tên field + tham chiếu `temp_id` + số lượng phần tử bắt buộc trong mảng (bổ sung cho JSON Schema — kiểm tra phần tham chiếu chéo mà schema không làm được).
