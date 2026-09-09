# DESIGN.md — M2: Lõi Import (validate + transaction + CLI nạp dữ liệu)

> ⚠️ File này là **kiến trúc + kế hoạch của RIÊNG task M2**, ghi đè bản M1.
> Bản M1 được lưu tạm ở `DESIGN.M1.md` (chưa commit nên không lấy lại được bằng git);
> phần cốt lõi của nó đã nằm ở `memory-bank/decisionLog.md` MB-10→MB-13 và `systemPatterns.md` §9.
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-09 · Trạng thái: **DESIGN ĐÃ DUYỆT — kế hoạch 20 task bên dưới**

---

## 0. Phạm vi

**Trong phạm vi M2:**
1. `src/lib/importValidate.ts` — hàm **thuần**, validate 2 lớp (TDD bắt buộc).
2. `supabase/migrations/0007_import_topic.sql` — 1 transaction tất-cả-hoặc-không (TDD bắt buộc).
3. `scripts/import-file.mjs` + `npm run import:file <đường dẫn> [--dry-run]`.
4. Bộ test 2 phía: 10 ca Vitest + 6 ca SQL.

**NGOÀI phạm vi M2 (KHÔNG đụng):** mọi UI (màn 15 Chọn file / 16 Preview / màn Kết quả),
màn Đăng nhập, app shell (sidebar PC · tab Mobile), pipeline TTS (§9 — thuộc M6).

**Lý do cắt phạm vi này:** màn Đăng nhập và màn Kết quả Import đều **chưa có mockup** → theo
`CLAUDE.md` Bước 1 phải trình bày layout và chờ duyệt riêng. Làm phần lõi trước cho ra **dữ liệu
thật trong DB ngay**, đủ để M3/M4 có cái mà chạy, mà không chạm màn hình nào chưa chốt.

---

## 1. Quyết định đã chốt với người dùng (2026-09-09)

| Mã | Câu hỏi | **Chốt** | Hệ quả |
|---|---|---|---|
| **Q1** | Phạm vi M2 | **Lõi + CLI**, không UI | Không cần duyệt layout nào; UI Import để phiên sau |
| **Q2** | Validate bằng gì | **Tự viết TS**, port từ `validate_import.py` | 0 package. Một nguồn sự thật cho cả 2 lớp thay vì phải giữ `import-schema.json` đồng bộ với script chéo |
| **Q3** | Transaction §10.4 | **Hàm Postgres `import_topic()`** gọi qua `rpc()` | Atomic thật; tái dùng hạ tầng migration + khung test SQL của M1 |
| **Q4** | Import trùng topic | **Luôn tạo topic mới**, chỉ cảnh báo | Nhất quán tuyệt đối với DEC-21 (không merge, không ghi đè) |

**Giả định đã báo trước:** sau khi test xong sẽ **import thật 1 file mẫu và GIỮ LẠI** trong DB,
vì mục đích kéo M2 lên sớm chính là để có dữ liệu thật cho M3/M4.

---

## 2. Nền đã kiểm chứng (chạy thật trước khi lập kế hoạch)

| Sự thật | Bằng chứng |
|---|---|
| **Node v24.15.0 strip types native** — `.mjs` import thẳng `.ts` | chạy thử, ra `KET QUA: 5` |
| `package.json` có `"type": "module"` | không phát warning `MODULE_TYPELESS_PACKAGE_JSON` |
| ⇒ **CLI và UI dùng chung đúng 1 file logic**, không phải viết 2 bản | hệ quả của 2 dòng trên |
| Có sẵn 3 file mẫu hợp lệ + 1 validator Python 200 dòng để port | `import_csv_vocab/references/`, `scripts/validate_import.py` |
| Token cảnh báo `--color-warn-text` = `#946200` đã có từ M0 | `src/styles/tokens.css` (dùng cho UI ở phiên sau) |

---

## 3. Luồng dữ liệu

```
file .json
 → scripts/import-file.mjs
     ├─ đọc file
     ├─ validateImportFile()    ← src/lib/importValidate.ts  (DÙNG CHUNG với UI sau này)
     │     lớp 1 cấu trúc/kiểu · lớp 2 tham chiếu chéo temp_id
     ├─ query cảnh báo trùng (word đã có / topic cùng tên) — KHÔNG chặn
     ├─ in preview;  nếu --dry-run thì dừng ở đây
     └─ đăng nhập thật (EMAIL/PASSWORD) → supabase.rpc('import_topic', { du_lieu })
              → 0007: 1 transaction, tất cả-hoặc-không
```

**CLI đi đúng đường mà UI sẽ đi** — đăng nhập rồi gọi RPC qua PostgREST, chịu đủ RLS + GRANT.
KHÔNG đi cửa sau Management API (cửa sau chạy quyền `postgres`, bypass RLS ⇒ test được cũng vô nghĩa).

---

## 4. Hợp đồng `importValidate.ts` (hàm thuần — MB-05)

Không đọc file, không network, không import React/Supabase, **không ném exception**.

```ts
export type ViTri = { duong_dan: string; thong_diep: string }  // duong_dan: "vocab[3].meaning_vi"

export type KetQuaValidate = {
  hop_le: boolean
  loi: ViTri[]        // CHẶN import
  canh_bao: ViTri[]   // KHÔNG chặn
  tom_tat: { ten_topic: string; so_tu: number; so_bai_tap: number; so_dong_hoi_thoai: number }
}

export function validateImportFile(raw: unknown): KetQuaValidate
```

### Hằng số (port nguyên từ `validate_import.py`, giữ đúng tên field)

```ts
const KIEU_HOP_LE = [17 giá trị enum exercise_type]
const KIEU_KHONG_PAYLOAD = ['flashcard','matching','translate','listen_fill',
                            'make_sentence','trans_collocation']
const FIELD_PAYLOAD_BAT_BUOC: Record<string, string[]> = {
  grammar:            ['content_target','pinyin','content_vi'],
  selection:          ['distractors'],
  audio_recognition:  ['distractors'],
  fast_decision:      ['wrong_meaning'],
  select_on_describe: ['description','distractors'],
  select_sentence:    ['correct_sentence','wrong_sentences'],
  arrange_words:      ['tokens'],
  trans_sentence:     ['vietnamese_sentence'],
  complete_situation: ['situation_vi','given_sentence_zh','given_sentence_pinyin'],
  select_dialog:      ['dialog_a','dialog_b','blank_a_answer','blank_b_vocab_id','distractors'],
  fill_dialog:        ['dialog_a','dialog_b','blank_a_answer','blank_b_vocab_id'],
}
const DO_DAI_MANG: Record<string, [string, number]> = {
  selection: ['distractors', 3], audio_recognition: ['distractors', 3],
  select_on_describe: ['distractors', 3], select_dialog: ['distractors', 2],
  // select_sentence.wrong_sentences = 3 kiểm riêng
}
const FIELD_VOCAB_BAT_BUOC = ['temp_id','word','pinyin','meaning_vi','collocation',
  'collocation_pinyin','collocation_meaning_vi','example_sentence','example_meaning_vi','lang']
const DANG_KHUYEN_NGHI = ['grammar','selection','audio_recognition','fast_decision',
  'select_on_describe','select_sentence','arrange_words','trans_sentence','complete_situation']
```

### Lớp 1 — cấu trúc & kiểu
`topic.name` không rỗng · vocab đủ 10 field · `lang` ∈ `zh|en` · `temp_id` không trùng ·
`type` ∈ 17 enum · payload đủ field theo bảng · độ dài mảng đúng (`wrong_sentences` = 3 kiểm riêng).

### Lớp 2 — tham chiếu chéo (thứ JSON Schema KHÔNG làm được, §10.7 tự thừa nhận)
`exercises[].vocab_temp_id` · `payload.blank_b_vocab_id` · `dialogue.lines[].highlight_vocab_temp_ids`
đều phải khớp một `temp_id` có thật trong mảng `vocab` **cùng file**.

### Luật cứng
6 dạng `KIEU_KHONG_PAYLOAD` mà **có** record trong `exercises` ⇒ **LỖI, reject cả file**
(bám đúng `validate_import.py` dòng 123: *"app thật sẽ reject cả file"*).

### Chỉ cảnh báo, KHÔNG chặn
Một từ thiếu bài của 1+ dạng trong `DANG_KHUYEN_NGHI`.

### KHÔNG thuộc hàm này
Cảnh báo **trùng từ / trùng topic** cần truy vấn DB ⇒ tách sang bước riêng trong CLI (§10.3).

---

## 5. `import_topic(du_lieu jsonb)` — 7 bước trong 1 transaction

`language plpgsql`, **KHÔNG `security definer`** — chạy bằng quyền người gọi (`authenticated`, đã có
GRANT từ M1) nên **không tái tạo lỗ hổng RPC** đã gặp ở M1 (MB-13/3). Hàm plpgsql gọi qua RPC tự nó
là một transaction ⇒ raise exception ở bất kỳ bước nào là rollback sạch toàn bộ.

| Bước | Việc | Ghi chú |
|---|---|---|
| 1 | `insert topics` → `v_topic_id` | **Luôn tạo mới** (chốt Q4) |
| 2 | Lặp `vocab` → `insert vocab` → dựng map `temp_id → uuid` | map giữ trong biến `jsonb` |
| 3 | `insert word_state` cho **mỗi** từ | `stage='new'`, `next_review_date = NULL` — thiếu bước này cron không nhỏ giọt được |
| 4 | `insert vocab_topics` | nối n-n |
| 5 | Lặp `exercises` → dịch temp_id → uuid | **2 chỗ**: `vocab_temp_id` **và** `payload.blank_b_vocab_id` |
| 6 | `insert topic_dialogues` | đổi `highlight_vocab_temp_ids` → **`highlight_vocab_ids`** (uuid) |
| 7 | `return jsonb` | `{topic_id, so_tu, so_bai_tap, so_dong_hoi_thoai}` |

### ⚠️ 3 chỗ dễ sai nhất

**1. `blank_b_vocab_id` nằm LỒNG trong payload jsonb.** Quên dịch thì Player không tìm ra "từ B"
của Select/Fill Dialog (`systemPatterns.md` §7.2).

```sql
if pl ? 'blank_b_vocab_id' then
  pl := jsonb_set(pl, '{blank_b_vocab_id}', to_jsonb(map ->> (pl ->> 'blank_b_vocab_id')));
end if;
```

**2. Hội thoại ĐỔI TÊN FIELD.** File import dùng `highlight_vocab_temp_ids`, còn schema §2 quy định
cột `content` chứa `highlight_vocab_ids` (uuid thật). Phải vừa dịch giá trị vừa đổi tên khoá:

```sql
select jsonb_build_object('lines', coalesce(jsonb_agg(
    case when dong ? 'highlight_vocab_temp_ids'
      then jsonb_set(dong - 'highlight_vocab_temp_ids', '{highlight_vocab_ids}',
             (select coalesce(jsonb_agg(map ->> t), '[]'::jsonb)
                from jsonb_array_elements_text(dong -> 'highlight_vocab_temp_ids') t))
      else dong end
  ), '[]'::jsonb))
into v_noi_dung
from jsonb_array_elements(du_lieu -> 'dialogue' -> 'lines') dong;
```

**3. temp_id không map được phải BÁO RÕ, không được để `null` chui xuống.**
`(map ->> x)::uuid` khi `x` không có trong map sẽ ra `NULL` → insert vi phạm `not null` với thông báo
khó hiểu. Kiểm tường minh và `raise exception` bằng tiếng Việt để CLI in ra đúng chỗ sai:

```sql
if not (map ? (phan_tu ->> 'vocab_temp_id')) then
  raise exception 'exercises: vocab_temp_id "%" không có trong mảng vocab',
                  phan_tu ->> 'vocab_temp_id';
end if;
```

*(Lớp validate TS đã chặn trước rồi — đây là lưới an toàn thứ hai, vì hàm SQL cũng có thể bị gọi
thẳng từ nơi khác.)*

### Khung hàm

```sql
create or replace function import_topic(du_lieu jsonb) returns jsonb
language plpgsql as $fn$
declare
  v_topic_id uuid;  v_id uuid;  map jsonb := '{}'::jsonb;
  phan_tu jsonb;  pl jsonb;  v_noi_dung jsonb;
  so_tu int := 0;  so_bai int := 0;  so_dong int := 0;
begin
  ...
  return jsonb_build_object('topic_id', v_topic_id, 'so_tu', so_tu,
                            'so_bai_tap', so_bai, 'so_dong_hoi_thoai', so_dong);
end $fn$;
```

---

## 6. Chiến lược TDD hai phía

### 6.1 Vitest — `src/lib/importValidate.test.ts` (10 ca, chạy bằng `npm test`)

| # | Ca | Kỳ vọng |
|---|---|---|
| V1 | 3 file mẫu thật trong `import_csv_vocab/references/` | `hop_le = true`, `loi = []` |
| V2 | vocab thiếu `meaning_vi` | lỗi có `duong_dan = 'vocab[0].meaning_vi'` |
| V3 | `type` không thuộc 17 enum | 1 lỗi, chặn |
| V4 | `vocab_temp_id` trỏ temp_id không tồn tại | 1 lỗi, chặn |
| V5 | `selection.distractors` chỉ 2 phần tử (phải 3) | 1 lỗi, chặn |
| V6 | có record `flashcard` (dạng không-payload) | 1 lỗi, **reject cả file** |
| V7 | `payload.blank_b_vocab_id` không tồn tại | 1 lỗi, chặn |
| V8 | `highlight_vocab_temp_ids` chứa temp_id lạ | 1 lỗi, chặn |
| V9 | 2 vocab trùng `temp_id` | 1 lỗi, chặn |
| V10 | 1 từ thiếu bài của vài dạng khuyến nghị | `hop_le = true`, có `canh_bao` |

Fixture lỗi V2–V10 **sinh từ file mẫu thật rồi sửa 1 chỗ** (deep clone + mutate) — không chép tay
cả file, để khi file mẫu đổi thì test không lệch.

### 6.2 SQL — `scripts/test-import.mjs` (6 ca, `npm run test:import`)

Cùng khuôn `begin … rollback` như `test:db` của M1 ⇒ **không để lại dòng rác nào**.

| # | Ca | Kỳ vọng |
|---|---|---|
| I1 | Import file mẫu | đúng số dòng ở `topics`/`vocab`/`word_state`/`vocab_topics`/`exercises`/`topic_dialogues` |
| I2 | Sau import | **mọi** từ có `word_state` với `stage='new'` và `next_review_date IS NULL` |
| I3 | Bài `select_dialog` | `payload->>'blank_b_vocab_id'` là **uuid thật**, không còn `"v2"` |
| I4 | Hội thoại | `content` chứa `highlight_vocab_ids` (uuid), **không còn** `highlight_vocab_temp_ids` |
| I5 | `vocab_temp_id` sai giữa chừng | **raise exception → rollback sạch**, cả 6 bảng đều 0 dòng |
| I6 | Import 2 lần cùng file | **2 topic riêng**, số từ nhân đôi (DEC-21) |

**Thứ tự bắt buộc:** viết V1–V10 và I1–I6 chạy khi hàm/file chưa tồn tại → phải thấy **ĐỎ** trước,
rồi mới viết code cho **XANH** (`CLAUDE.md` Bước 3).

---

## 7. KẾ HOẠCH THỰC THI — 20 task

> Mỗi task 2–5 phút. Thứ tự không đảo: test đỏ trước → code xanh sau.

### Nhóm 1 · Test validate (🔴 RED) — T1–T3
- **T1** `src/lib/importValidate.test.ts`: ca V1 — đọc 3 file mẫu bằng `readFileSync`, gọi
  `validateImportFile`, kỳ vọng `hop_le === true`.
- **T2** Thêm V2–V10. Helper `sua(mau, hamSua)` = deep clone (`structuredClone`) rồi mutate 1 chỗ.
- **T3** `npm test` → xác nhận **ĐỎ** (module chưa tồn tại). Không sửa gì thêm.

### Nhóm 2 · `importValidate.ts` (🟢 GREEN) — T4–T8
- **T4** Khai kiểu `ViTri` / `KetQuaValidate` + 6 hằng số ở §4.
- **T5** Lớp 1 phần A: JSON là object · `topic.name` · vocab đủ field · `lang` · `temp_id` trùng.
- **T6** Lớp 1 phần B: `type` ∈ enum · luật 6 dạng không-payload · field payload · độ dài mảng.
- **T7** Lớp 2: `vocab_temp_id` · `blank_b_vocab_id` · `highlight_vocab_temp_ids`.
- **T8** Cảnh báo coverage + `tom_tat`; chạy `npm test` → **XANH 10/10**.

### Nhóm 3 · Test SQL (🔴 RED) — T9–T10
- **T9** `scripts/test-import.mjs` + npm script `test:import`, tái dùng `db-lib.mjs`; viết I1–I6.
- **T10** `npm run test:import` → xác nhận **ĐỎ** (`function import_topic does not exist`).

### Nhóm 4 · `0007_import_topic.sql` (🟢 GREEN) — T11–T14
- **T11** Bước 1–4: topics → vocab + map `temp_id→uuid` → `word_state` (NULL/new) → `vocab_topics`.
- **T12** Bước 5: exercises — dịch `vocab_temp_id` **và** `payload.blank_b_vocab_id`; `raise exception`
  tiếng Việt khi temp_id không map được.
- **T13** Bước 6–7: hội thoại (đổi tên khoá `highlight_vocab_temp_ids` → `highlight_vocab_ids`
  + dịch giá trị) và `return jsonb`.
- **T14** `npm run db:migrate` → `npm run test:import` → **XANH 6/6**.

### Nhóm 5 · CLI — T15–T18
- **T15** `scripts/import-file.mjs`: nhận `<đường dẫn> [--dry-run]`, đọc file, gọi
  `validateImportFile` từ `../src/lib/importValidate.ts`, in lỗi/cảnh báo theo `duong_dan`.
- **T16** Cảnh báo trùng (cần DB): query `vocab.word` trùng + `topics.name` trùng → in cảnh báo
  **không chặn** (§10.3).
- **T17** Đăng nhập thật rồi `POST /rest/v1/rpc/import_topic` với `Authorization: Bearer <token>`;
  in kết quả trả về. Thoát code ≠ 0 khi lỗi.
- **T18** Thêm npm script `import:file`; chạy `--dry-run` với file mẫu để nghiệm thu đường validate.

### Nhóm 6 · Nghiệm thu & ký ức — T19–T20
- **T19** Import **thật** 1 file mẫu (giữ lại trong DB); query đối chiếu 6 bảng; chạy trọn bộ
  `npm test` · `test:import` · `test:db` · `check:schema` · `build` · `lint`.
- **T20** Cập nhật `memory-bank/` (`activeContext` · `progress` · `decisionLog` MB-14) và dọn
  mọi tiến trình nền do phiên tạo.

---

## 8. Bằng chứng nghiệm thu M2 (thiếu dòng nào thì không được báo "xong")

| Lệnh | Kỳ vọng |
|---|---|
| `npm test` | Vitest **25/25** (15 token cũ + 10 ca validate mới) |
| `npm run test:import` | **6/6** ca I1–I6, DB sạch sau khi chạy |
| `npm run test:db` | vẫn **9/9** (M1 không bị hồi quy) |
| `npm run db:migrate` | 7/7 file xanh, chạy lại lần 2 vẫn xanh |
| `npm run check:schema` | vẫn 14/14 |
| `npm run import:file <file mẫu> --dry-run` | in preview + cảnh báo, **không ghi gì vào DB** |
| `npm run import:file <file mẫu>` | ghi thật; query xác nhận đủ 6 bảng và `word_state` đều NULL/new |
| `npm run build` · `npm run lint` | xanh |
