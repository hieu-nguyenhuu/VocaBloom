---
name: vocabCsv2Json
description: Chuyển 1 file CSV danh sách từ vựng (3 cột "TuVung", "Nghia", "Topic" — các khối topic ngăn nhau bằng dòng trống, dòng ngữ pháp đánh dấu "ngữ pháp" ở cột Nghia) thành các file JSON sẵn sàng import vào app VocaBloom, đúng 100% schema (topics/vocab/exercises/dialogue) cho toàn bộ 17 dạng bài tập. LUÔN dùng skill này khi người dùng đưa file CSV từ vựng và yêu cầu tạo dữ liệu bài tập, sinh nội dung ôn tập, hoặc chuẩn bị file để import vào VocaBloom — kể cả khi họ không nhắc từ "skill" hay "import". Xử lý được danh sách lớn (200-300+ dòng, nhiều topic) bằng cách tự động tách theo cột topic thành nhiều file JSON riêng biệt. Có 2 chế độ: MẶC ĐỊNH chỉ sinh và trả về file JSON; thêm cờ --import thì sau khi sinh sẽ tự nạp thẳng vào database Supabase qua connector rồi trả về kết quả kiểm chứng. Luôn đọc references/payload-schemas.md trước khi sinh bất kỳ field nào — sai tên field sẽ khiến UI của app không hiển thị được dữ liệu.
---

# Vocab CSV → VocaBloom Import JSON

Chuyển đổi 1 file CSV từ vựng thô thành bộ file JSON hoàn chỉnh, đúng schema, sẵn sàng import vào app VocaBloom (spaced-repetition, 17 dạng bài tập).

## 2 chế độ chạy

| Cách gọi | Làm gì |
|---|---|
| *(mặc định)* | Sinh file JSON, validate, **trả file cho người dùng**. KHÔNG đụng database. |
| `--import` | Làm hết như trên, rồi **tự nạp vào Supabase** qua connector và trả **báo cáo kiểm chứng** (xem Bước 7). |

Không chắc người dùng muốn gì ⇒ mặc định là chế độ 1, và hỏi 1 câu ở cuối: "Có muốn tôi import
luôn vào database không?".

---

## Bước 0 — Đọc tài liệu tham chiếu TRƯỚC KHI làm bất cứ gì

**Bắt buộc đọc `references/payload-schemas.md` trước** — đây là nguồn sự thật cho tên field của cả 17 dạng bài. Đừng gen field theo trí nhớ hay suy đoán; tên field sai (kể cả chỉ khác 1 ký tự, khác hoa/thường) khiến app hiển thị trống mà không báo lỗi.

## Bước 1 — Đọc & rà soát CSV input

File CSV có header, đúng **3 cột**: `TuVung`, `Nghia`, `Topic` (vẫn chấp nhận tên cũ
`vocab` / `meaning` / `topic`; không phân biệt hoa/thường).

**Cách đọc — KHÁC với bản trước, đọc kỹ:**

| Quy ước | Chi tiết |
|---|---|
| **Dòng trống = hết 1 khối** | Các dòng liên tiếp cho tới dòng trống kế tiếp thuộc CÙNG 1 topic. Đây là ranh giới topic, KHÔNG phải rác để bỏ qua. |
| **Tên topic chỉ ghi ở dòng ĐẦU khối** | Các dòng sau trong cùng khối để trống cột `Topic` — vẫn thuộc topic đó. |
| **Khối không có tên** | Cột `Topic` trống ở cả khối ⇒ **tự đặt tên theo nội dung** các từ trong khối (VD "Sức khoẻ & thời tiết"). Nêu rõ tên tự đặt ở báo cáo cuối để người dùng đổi lại nếu muốn. |
| **Dòng NGỮ PHÁP** | Cột `Nghia` ghi đúng chữ `ngữ pháp` ⇒ dòng đó là **ngữ pháp CỦA CHỦ ĐỀ**: đưa vào mảng `grammar` ở gốc file (xem Bước 3.4). **KHÔNG tạo `vocab`, KHÔNG tạo `exercises` cho dòng này.** Thường nằm ở 1–2 dòng cuối khối, và **có thể không có**. |
| **`Nghia` có nội dung khác** | Dùng **nguyên văn** làm `meaning_vi` — đây là nghĩa đặc biệt người dùng muốn ôn, KHÔNG tự sinh lại. |
| **`Nghia` trống** | Tự sinh nghĩa tiếng Việt phù hợp. |

- `TuVung` = từ vựng gốc → field `word`.
- Xác định `lang` cho từng từ: `word` chứa ký tự Hán (CJK) → `"zh"`; toàn ký tự Latin → `"en"`. Với `lang="en"`, để `pinyin` là `null`.

⚠️ **Dòng nghi là ngữ pháp nhưng THIẾU nhãn:** một số mẫu ngữ pháp có thể bị bỏ quên nhãn `ngữ pháp`
ở cột `Nghia` (dấu hiệu: chứa `V +`, `…`, `/`, hoặc nằm ở dòng cuối khối, VD `越来越`).
**Vẫn xử lý như từ vựng bình thường** — nhưng **phải liệt kê chúng ở báo cáo cuối** để người dùng
xác nhận. Không tự ý quyết định thay người dùng theo cả 2 hướng.

## Bước 2 — Tách khối theo DÒNG TRỐNG (1 khối = 1 topic = 1 file JSON)

Người dùng đã tự gom sẵn, **KHÔNG tự suy luận nhóm ngữ nghĩa** — chỉ cắt theo dòng trống và lấy
tên ở dòng đầu khối (Bước 1). Mỗi khối → 1 file JSON riêng.

**ngoại lệ cần xử lý:**
**Topic chỉ có 1-2 từ:** vẫn xử lý bình thường — `select_dialog`/`fill_dialog` có thể không tạo được nếu không đủ 2 từ liên quan trong CÙNG topic (không được ghép từ 2 topic khác nhau lại với nhau). `dialogue` vẫn cố viết đủ 7-10 câu dù vốn từ ít (dùng thêm ngữ cảnh chung quanh chủ đề, miễn câu hội thoại tự nhiên và có sử dụng từ vựng đó).

Với CSV 200-300 dòng đã gom sẵn topic → số lượng file phụ thuộc số topic khác nhau trong CSVCSV. Xử lý tuần tự từng topic một, không cố nhồi tất cả vào 1 lần trả lời.

## Bước 3 — Với mỗi topic, sinh đủ 5 phần theo đúng khung (xem `references/payload-schemas.md` mục 4 + 4b)

### 3.1 `topic`
`{ "name": "...", "description": "1 câu mô tả ngắn" }`

### 3.2 `vocab`
Với mỗi từ trong nhóm: gán `temp_id` tuần tự `"v1"`, `"v2"`... rồi điền đủ field theo **mục 0** của `payload-schemas.md`. Chú ý:
- `collocation`, `example_sentence` phải TỰ NHIÊN, đúng ngữ pháp, thực sự dùng được (không phải câu máy móc).
- Với `lang="zh"`: mọi câu tiếng Trung đều PHẢI có phiên âm pinyin đi kèm (có dấu thanh, VD `píngguǒ` không viết `pingguo`).

### 3.3 `exercises`
Với **mỗi từ vựng**, sinh đủ **8 dạng bài bắt buộc** (đọc kỹ field name ở mục 3 của `payload-schemas.md`, KHÔNG được thiếu field, KHÔNG được thêm field thừa):

```
selection, audio_recognition, fast_decision,
select_on_describe, select_sentence, arrange_words,
trans_sentence, complete_situation
```

### ⚠️ `grammar` (ngữ pháp CỦA TỪ) — dạng CÓ ĐIỀU KIỆN, KHÔNG nằm trong 8 dạng bắt buộc

Bản trước của skill này liệt kê `grammar` vào nhóm bắt buộc, khiến **từ nào cũng có một thẻ ngữ
pháp** — kể cả `猫`, `水`, `书` vốn chẳng có gì để nói. Người học phải bấm qua một thẻ vô nghĩa ở
mọi từ. Từ M12, quy tắc là:

> **Chỉ tạo record `grammar` khi từ đó có điểm NGƯỜI HỌC DỄ DÙNG SAI.**
> Không nghĩ ra được lỗi cụ thể người học sẽ mắc ⇒ **không tạo**.

**NÊN gắn** khi từ rơi vào một trong các nhóm sau:

| Nhóm | Ví dụ | Điều cần nói |
|---|---|---|
| Lượng từ riêng | `裤子` (条), `衬衫` (件) | Dùng nhầm `个` là lỗi phổ biến nhất |
| Ly hợp từ | `散步`, `见面`, `帮忙` | Tân ngữ chen vào giữa: `见了一次面`, không nói `见面他` |
| Bắt buộc đi với giới từ / bổ ngữ | `告诉` (ai + nội dung), `V + 得/不 + bổ ngữ` | Thiếu thành phần là câu sai |
| Vị trí trạng ngữ khác tiếng Việt | `一直`, `总是`, `其实` | Tiếng Việt đặt cuối câu, tiếng Trung đặt trước động từ |
| Cặp dễ nhầm lẫn nhau | `疼` / `病`, `容易` / `简单` | Phân biệt phạm vi dùng |
| Từ đa nghĩa đổi cách dùng | `搬` (nhà / đồ vật) | Cùng chữ, khác kết cấu |

**KHÔNG gắn** với: danh từ cụ thể thông thường (`脚`, `树`, `蛋糕`), tính từ thông thường
(`甜`, `胖`), từ mà phần cần nói đã nằm sẵn ở `collocation` hoặc `example_sentence`.

**Tự kiểm:** nếu ≥ 50% số từ trong 1 file có `grammar` thì gần như chắc chắn đang gắn tràn lan —
rà lại và cắt bớt. Mức hợp lý thường là **2–4 từ trong 10**.

6 dạng KHÔNG được tạo record (đọc mục 2 của `payload-schemas.md`): `flashcard, matching, translate, listen_fill, make_sentence, trans_collocation`.

2 dạng tùy chọn theo CẶP từ (không bắt buộc mọi từ có): `select_dialog`, `fill_dialog` — chỉ tạo khi tìm được 2 từ trong cùng topic ghép tự nhiên vào 1 tình huống hội thoại ngắn. Cố gắng tạo ít nhất 1 cặp/topic nếu khả thi, nhưng KHÔNG ép nếu không tự nhiên.

**Nguyên tắc chất lượng nội dung:**
- `distractors` (đáp án nhiễu) phải hợp lý — cùng phạm trù với đáp án đúng, không quá dễ đoán loại trừ, cũng không đánh lừa phi lý.
- `wrong_sentences` (câu sai) phải sai vì lý do NGỮ PHÁP/CÁCH DÙNG TỪ cụ thể (lượng từ sai, thứ tự từ sai, động từ không hợp với danh từ...), không phải câu đúng bị đổi vài chữ vô nghĩa.
- Mọi câu tiếng Trung xuất hiện trong payload đều cần trường `pinyin` đi kèm đúng tên field quy định (xem chi tiết từng dạng — tên field pinyin khác nhau theo từng type, VD `dialog_a_pinyin`, không phải `pinyin_a`).

### 3.4 `grammar` — NGỮ PHÁP CỦA CHỦ ĐỀ (mảng ở gốc file, TUỲ CHỌN)

Các dòng CSV có cột `Nghia` = `ngữ pháp` (Bước 1) → mỗi dòng thành 1 mục trong mảng `grammar` ở
**gốc file**, ngang hàng `dialogue`. Đọc mục **4b** của `payload-schemas.md` để biết chính xác field.

- `content_target` = chép nguyên văn mẫu ngữ pháp từ cột `TuVung` (VD `V + 着 + V`).
- `content_vi` = tự viết giải thích cách dùng bằng tiếng Việt, **nêu rõ lỗi hay gặp**, 2–3 câu.
- `pinyin` = phiên âm mẫu (null nếu topic `lang="en"`); nên kèm `vi_du` + `vi_du_pinyin` + `vi_du_vi`.
- Khối CSV **không có dòng ngữ pháp nào ⇒ BỎ HẲN khoá `grammar`** khỏi file JSON (không để mảng rỗng).

### 3.5 `dialogue`
7–10 câu hội thoại (xen kẽ speaker A/B), dùng CÀNG NHIỀU từ trong topic càng tốt, đánh dấu đúng `highlight_vocab_temp_ids` cho câu nào chứa từ vựng nào (câu đệm không chứa từ thì để mảng rỗng `[]`).

### 3.6 Ràng buộc từ `SPECIFICATION.md` phải tuân thủ (dễ quên nhất)

| # | Ràng buộc | Hậu quả nếu sai |
|---|---|---|
| 1 | **File JSON KHÔNG chứa audio** (§10.6). App tự gọi Google TTS sau khi import. Không bịa field `audio_url` | Field lạ ⇒ schema từ chối (`additionalProperties: false`) |
| 2 | **`temp_id` chỉ có nghĩa TRONG 1 file** (§10.2). File kế tiếp reset lại `v1` | Trộn temp_id giữa 2 file ⇒ nối sai từ |
| 3 | **`select_dialog`/`fill_dialog` cần ĐÚNG 2 từ khác nhau** (§4.4): 1 record duy nhất, từ B trỏ bằng `blank_b_vocab_id`. **KHÔNG được trỏ về chính từ A** | Validator app chặn cứng (M13) |
| 4 | **Mỗi câu đúng 1 chỗ trống `___`** (MB-29/Q5) | Vỡ layout màn hội thoại — bug thật ở M9 |
| 5 | **`lang='zh'` ⇒ `pinyin` và `collocation_pinyin` BẮT BUỘC có nội dung thật**, không được `null` (§6.5) | Validator app chặn cứng (M13) |
| 6 | **`lang='en'` ⇒ các field phiên âm để `null` nhưng KEY vẫn phải có mặt** | Thiếu key ⇒ chặn |
| 7 | **Giữ nguyên tên field `text_zh` / `given_sentence_zh` kể cả topic tiếng Anh** | Đổi tên ⇒ app không đọc được |
| 8 | **`dialogue.lines`: 7–10 câu, `speaker` chỉ `A` hoặc `B`, mọi câu phải có `text_zh` không rỗng** | Chặn cứng (M13) |
| 9 | **Không tạo 2 bài CÙNG dạng cho CÙNG 1 từ** | Player dựng 2 màn trùng (validator cảnh báo) |
| 10 | **6 dạng KHÔNG được có record** (`flashcard, matching, translate, listen_fill, make_sentence, trans_collocation`) — Player đọc thẳng từ `vocab` (DEC-22) | Chặn cứng, reject cả file |

⚠️ **Validator của app đã được siết ngang JSON Schema (M13).** Trước đây file sai shape vẫn import
được rồi hỏng ở Player; nay `distractors` là mảng chuỗi thay vì `{word,pinyin}`, `tokens` dùng khoá
`word` thay vì `text`, `word: ""`… đều **bị chặn ngay khi import**. Sinh sai = phải sửa rồi làm lại,
nên đọc kỹ `references/payload-schemas.md` ngay từ đầu vẫn rẻ hơn.

---

## Bước 4 — Ghép file & đặt tên

- Tên file: `import-{số thứ tự 2 chữ số}-{topic-slug}.json`, VD `import-01-trai-cay.json`, `import-02-dong-vat.json`.
- Mỗi file JSON độc lập hoàn toàn (temp_id chỉ có ý nghĩa TRONG phạm vi 1 file, reset lại `"v1"` ở file kế tiếp).
- Lưu file bằng UTF-8, giữ nguyên dấu tiếng Việt và chữ Hán (không escape thành `\uXXXX`).

## Bước 5 — BẮT BUỘC validate trước khi giao file (2 lớp)

**Lớp 1 — JSON Schema chính thức** (`references/import-schema.json`, chuẩn Draft 2020-12): kiểm tra cấu trúc/kiểu dữ liệu/field bắt buộc theo từng `exercise.type`. Chạy bằng công cụ chuẩn, VD Python:

```bash
python3 -c "
import json, jsonschema
schema = json.load(open('.claude/skills/vocabCsv2Json/references/import-schema.json', encoding='utf-8'))
data = json.load(open('import-01-trai-cay.json', encoding='utf-8'))
jsonschema.validate(data, schema)
print('OK')
"
```
(hoặc dùng `ajv-cli` nếu môi trường là Node.js: `ajv validate -s .claude/skills/vocabCsv2Json/references/import-schema.json -d import-01-trai-cay.json --spec=draft2020`)

**Lớp 2 — script Python** (`scripts/validate_import.py`) — kiểm tra thêm phần JSON Schema KHÔNG làm được: đối chiếu `temp_id` có tồn tại chéo giữa `vocab`/`exercises`/`dialogue` hay không.

```bash
python3 .claude/skills/vocabCsv2Json/scripts/validate_import.py import-01-trai-cay.json import-02-dong-vat.json ...
```

- Nếu có `❌ LỖI` ở BẤT KỲ lớp nào → sửa lại theo đúng thông báo, chạy lại cả 2 lớp cho tới khi sạch lỗi.
- `⚠️ cảnh báo` (chỉ từ lớp 2) không bắt buộc phải sửa (VD thiếu 1 dạng bài ở 1 từ nào đó vẫn import được), nhưng nên rà lại nếu số lượng cảnh báo nhiều bất thường.
- Nếu môi trường không chạy được Python/Node, tự đối chiếu thủ công theo checklist ở mục 5 của `references/payload-schemas.md`.

## Bước 6 — Báo cáo kết quả

Sau khi xong, tóm tắt cho người dùng: số topic/file đã tạo, tổng số từ vựng, kết quả validate (sạch lỗi hay còn cảnh báo gì), và danh sách file để họ tải về/import.

**3 mục BẮT BUỘC phải có trong báo cáo (M12):**

1. **Tên topic tự đặt** — liệt kê những khối CSV không có tên và tên bạn đã đặt, để người dùng đổi lại.
2. **Ngữ pháp của TỪ** — `đã gắn grammar cho X/Y từ`, kèm **lý do từng từ** (VD `裤子 — lượng từ 条`).
   Không liệt kê được lý do cụ thể nghĩa là không nên gắn.
3. **Dòng nghi là ngữ pháp nhưng thiếu nhãn** — liệt kê để người dùng xác nhận (Bước 1).

---

## Bước 7 — Chế độ `--import`: nạp thẳng vào Supabase qua connector

> Chỉ chạy bước này khi người dùng gọi kèm `--import` (hoặc nói rõ "import luôn vào database").
> **Bắt buộc phải qua Bước 5 sạch lỗi trước** — không bao giờ import file chưa validate.

### 7.1 Một file = một transaction, gọi đúng RPC của app

App nạp dữ liệu bằng **RPC `import_topic(du_lieu jsonb)`** — 1 transaction tất-cả-hoặc-không
(SPECIFICATION.md §10.4). Skill này phải đi **đúng cửa đó**, tuyệt đối KHÔNG `insert` tay vào
`topics`/`vocab`/`exercises`: hàm RPC còn làm 4 việc mà insert tay sẽ bỏ sót và hỏng dữ liệu:

1. Dịch `temp_id → uuid` thật cho `exercises`.
2. Dịch `blank_b_vocab_id` **lồng trong payload jsonb** (quên là Player không tìm ra "từ B").
3. Đổi tên khoá `highlight_vocab_temp_ids` → `highlight_vocab_ids` cho hội thoại.
4. Tạo `word_state` (`stage='new'`, `next_review_date = NULL`) — thiếu thì cron không bao giờ
   nhỏ giọt được từ mới, từ nằm chết trong DB.

Gọi qua connector Supabase, **mỗi file một lệnh**:

```sql
select import_topic($vb$<DÁN NGUYÊN JSON CỦA FILE VÀO ĐÂY>$vb$::jsonb);
```

- **Dùng dollar-quoting `$vb$…$vb$`** để khỏi phải escape dấu nháy trong nội dung tiếng Việt/tiếng Trung.
- Kết quả trả về là 1 object: `{topic_id, so_tu, so_bai_tap, so_dong_hoi_thoai, so_ngu_phap}`.
  **Lấy số liệu báo cáo TỪ ĐÂY**, không đếm lại từ file — con số của RPC mới là thứ thật sự vào DB.
- File lỗi giữa chừng ⇒ Postgres rollback đúng file đó; **các file khác không bị ảnh hưởng**.
  Cứ chạy tiếp file kế tiếp, cuối cùng liệt kê file nào ✓ file nào ✗.

### 7.2 Kiểm chứng SAU khi import (bắt buộc, đừng tin lời hàm)

Chạy đúng 1 truy vấn cho cả mẻ, thay `(...)` bằng danh sách `topic_id` vừa nhận được:

```sql
select t.name,
       (select count(*) from vocab_topics vt where vt.topic_id = t.id)                      as so_tu,
       (select count(*) from vocab_topics vt join word_state w on w.vocab_id = vt.vocab_id
         where vt.topic_id = t.id)                                                          as co_word_state,
       (select count(*) from vocab_topics vt join exercises e on e.vocab_id = vt.vocab_id
         where vt.topic_id = t.id)                                                          as so_bai_tap,
       (select count(*) from vocab_topics vt join exercises e on e.vocab_id = vt.vocab_id
         where vt.topic_id = t.id and e.type = 'grammar')                                   as ngu_phap_tu,
       (select count(*) from topic_grammar g where g.topic_id = t.id)                       as ngu_phap_chu_de,
       (select count(*) from topic_dialogues d where d.topic_id = t.id)                     as hoi_thoai
from topics t where t.id in (...)
order by t.name;
```

**4 điều kiện phải đúng, nêu rõ trong báo cáo:**

| Kiểm | Đạt khi | Sai nghĩa là |
|---|---|---|
| `co_word_state = so_tu` | mọi từ đều có hàng SRS | thiếu ⇒ cron không kích hoạt được từ đó, từ nằm chết |
| `so_bai_tap` khớp số RPC trả về | — | lệch ⇒ có bài rơi mất |
| `ngu_phap_tu / so_tu` **≤ ~30%** | đúng tinh thần Bước 3.3 | cao hơn ⇒ đang gắn ngữ pháp tràn lan, phải rà lại |
| `ngu_phap_chu_de` = số dòng `ngữ pháp` trong CSV | — | lệch ⇒ đọc sai khối CSV |

Thêm 1 truy vấn xác nhận `temp_id` đã được dịch hết (không còn chuỗi `v1`, `v2`… sót lại):

```sql
select count(*) as con_sot_temp_id
from exercises e
where e.type in ('select_dialog','fill_dialog')
  and (e.payload ->> 'blank_b_vocab_id') not in (select id::text from vocab);
```
Phải bằng **0**.

### 7.3 Ba điều PHẢI nói thật trong báo cáo

1. **Connector chạy quyền quản trị, BỎ QUA RLS.** Import được qua connector **không** chứng minh
   app (đăng nhập bằng tài khoản thường, đi qua PostgREST) cũng ghi được. Nếu cần chứng minh
   đường của app thì phải import bằng màn Import trong app, không phải bằng skill này.
2. **Trùng từ / trùng tên chủ đề KHÔNG bị chặn** — DEC-21 chốt "luôn thêm mới, không merge, không
   ghi đè". Chạy skill 2 lần trên cùng CSV sẽ ra **2 bộ chủ đề trùng tên**. Nói trước cho người dùng
   biết, và nếu thấy trong DB đã có chủ đề cùng tên thì **hỏi lại** trước khi import.
3. **Muốn xoá làm lại** thì dùng RPC `xoa_chu_de(p_topic_id)` (nó xử lý đúng cả từ thuộc nhiều chủ
   đề và chặn khi từ đang là "vai B" của chủ đề khác), KHÔNG `delete from topics` tay.

### 7.4 Mẫu báo cáo cuối

```
Đã import 6/6 file · 68 từ · 542 bài tập · 6 mục ngữ pháp chủ đề · 6 hội thoại

| Chủ đề            | Từ | word_state | Bài tập | NP từ | NP chủ đề | Hội thoại |
|-------------------|----|-----------|---------|-------|-----------|-----------|
| Học tập & giải trí| 10 | 10 ✓      | 80      | 3     | 1         | 1         |
...
✓ temp_id đã dịch hết (0 bản ghi treo)
✓ Tỉ lệ ngữ pháp của từ: 18/68 = 26% (trong ngưỡng hợp lý)
⚠️ Lưu ý: import qua connector chạy quyền quản trị, bỏ qua RLS.
```
---

## Tài liệu đi kèm

- `references/payload-schemas.md` — **đọc bắt buộc trước khi sinh dữ liệu**, chứa đặc tả field chính xác cho cả 17 dạng bài + checklist tự kiểm tra.
- `references/import-schema.json` — **JSON Schema chính thức (Draft 2020-12)**, validate cấu trúc/kiểu dữ liệu tự động bằng công cụ chuẩn (ajv/jsonschema). Đã kiểm thử: bắt đúng lỗi thiếu field, sai enum, sai độ dài mảng, field thừa, vi phạm điều kiện `lang=zh → pinyin bắt buộc`.
- `references/example-output.json` — file mẫu HOÀN CHỈNH (3-5 từ tiếng Trung chủ đề "Trái cây"), có cả `select_dialog` lẫn `fill_dialog`, dùng làm ví dụ đối chiếu khi không chắc cấu trúc.
- `references/example-output-english-topic.json` — ví dụ topic `lang="en"` (chủ đề "Nghề nghiệp"), minh họa cách để `pinyin`=null và cách dùng field `text_zh`/`given_sentence_zh` cho nội dung tiếng Anh.
- `references/example-output-single-word-topic.json` — ví dụ topic chỉ có 1 từ (chủ đề "Thời tiết"), minh họa trường hợp không tạo được `select_dialog`/`fill_dialog`.
- `scripts/validate_import.py` — script Python kiểm tra tự động JSON syntax + tên field + tham chiếu `temp_id` + số lượng phần tử bắt buộc trong mảng (bổ sung cho JSON Schema — kiểm tra phần tham chiếu chéo mà schema không làm được).
