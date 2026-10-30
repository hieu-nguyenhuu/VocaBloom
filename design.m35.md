# M35 — Loại bỏ dạng bài `fill_dialog` (Design)

> Trạng thái: ✅ XONG 2026-10-30 (DESIGN + PLAN đã duyệt; T1–T14 xong; commit + push + deploy Firebase theo lệnh người dùng).

## 1. Bối cảnh

- Người dùng: Fill Dialog 1 câu có nhiều cách điền hợp lý, nhưng chấm so khớp tuyệt đối ⇒ điền đúng nghĩa vẫn bị 0 điểm.
- Kiểm DB thật (chỉ đọc, 2026-10-30): `select_dialog` 380 · `fill_dialog` 379 bản ghi — **0 câu trùng** (2 bộ hội thoại soạn riêng
  ở M23, cùng khung payload; fill chỉ thiếu `distractors`). Không bảng nào có FK tới `exercises`.
- Ảnh hưởng hiện tại: 35 từ stage2 đều `cycle_points = 0`; 0/65 từ stage3/intensive có `total_points ≥ 36`; 0 từ đang mang
  `fill_dialog` trong `cycle_completed_exercises`; 0 dòng retry chứa `fill_dialog`; `review_log` có 70 dòng `fill_dialog` (lịch sử).

## 2. Quyết định đã chốt

| Mã | Chốt |
|---|---|
| Q1 | Bỏ `fill_dialog` khỏi bộ bài **stage2 VÀ intensive** (intensive dùng nguyên bộ stage2) |
| Q2 | Stage2/intensive: 4 dạng × 3 ⇒ **max 12, ngưỡng 9** ("được sai 1 bài" như cũ) |
| Q3 | Hệ quả: `MAX_TICH_LUY` stage2 27 → **24**, stage3/intensive 39 → **36**; **`MASTER_THRESHOLD` 39 → 36** (= 4+8+12+12) |
| Q4 | **Xoá hẳn** 379 bản ghi `fill_dialog` khỏi `exercises`, **sao lưu JSON trước** |
| Q5 | Import **không bắt buộc, vẫn nhận** file có `fill_dialog`: validator CẢNH BÁO (không chặn), RPC `import_topic` **bỏ qua** dạng này (không ghi DB) |
| Q6 | Skill `vocabCsv2Json` **ngừng sinh** `fill_dialog`; luật phủ sóng M23 chỉ còn `select_dialog` |
| Q7 | Giữ nguyên: enum DB `exercise_type` (gỡ giá trị enum ở Postgres rất phiền, không cần), 70 dòng `review_log` cũ (màn Lịch sử học vẫn hiện nhãn) |

## 3. Thiết kế kỹ thuật

### 3.1 Lõi SRS — `src/lib/srs.ts`
- `DANG_BAI_THEO_STAGE.stage2` / `.intensive` = `['select_sentence', 'near_synonym', 'arrange_words', 'trans_collocation']`.
- `MAX_CYCLE` stage2/intensive 15 → 12 · `NGUONG_CYCLE` 12 → 9 · `MAX_TICH_LUY` stage2 24, stage3/intensive 36 · `MASTER_THRESHOLD = 36`.
- `DangBai` GIỮ `'fill_dialog'` (log cũ + enum còn). Test X1b/X2/X3 hiện canh bất biến ⇒ sửa số kỳ vọng, chạy ĐỎ trước.
- `diemChoBai('stage2','fill_dialog')` ⇒ 0 (đã có nhánh "không thuộc bộ bài").

### 3.2 Player — `src/lib/player.ts`, `PlayerPage.tsx`, `bai/HoiThoai.tsx`
- Bỏ `fill_dialog` khỏi `Man`, `CAN_RECORD`, `THU_TU_MAN`, nhánh `xepBai`; query blank_b ở `PlayerPage:136` chỉ còn `select_dialog`.
- `HoiThoai.tsx` chỉ còn chế độ chọn chip ⇒ gỡ prop `cheDo` + nhánh ô gõ tay (component vẫn dùng cho select_dialog).
- Test âm thanh X2/X5 (`amThanhCore.test.ts`): cập nhật nếu đang liệt kê theo dạng.

### 3.3 Import
- `importValidate.ts`: `fill_dialog` vẫn hợp lệ về shape (không làm hỏng file cũ) + **cảnh báo** "N bài fill_dialog đã ngừng dùng — sẽ bỏ qua khi import".
- `0007_import_topic.sql` sửa **tại chỗ** (khuôn M32/M33): vòng insert exercises bỏ `type = 'fill_dialog'`. `db:migrate` 2 lần vẫn xanh.
  ⇒ chặn ở 1 nơi cho CẢ màn Import lẫn CLI `import-file.mjs`.
- `boSungHoiThoai.ts` + `scripts/bo-sung-hoi-thoai.mjs`: chỉ còn kiểm/bổ sung `select_dialog`.
- `scripts/chup-chu-de.mjs`, `scripts/test-import.mjs`: lọc còn `select_dialog`. `check-schema.mjs` GIỮ (enum DB không đổi).

### 3.4 Skill `vocabCsv2Json`
- `SKILL.md`, `references/payload-schemas.md`, `import-schema.json`, `example-output.json`, `validate_import.py`:
  bỏ hướng dẫn sinh `fill_dialog`; phủ sóng M23 chỉ yêu cầu `select_dialog`; Python validator gặp `fill_dialog` ⇒ cảnh báo.

### 3.5 Dữ liệu (chạy SAU khi code + test xanh)
1. Sao lưu: `du-lieu-import/sao-luu/fill_dialog-2026-10-30.json` (toàn bộ 379 dòng `exercises`, đủ cột).
2. Đối chiếu số dòng file = 379 ⇒ mới `delete from exercises where type = 'fill_dialog'`.
3. Kiểm sau: `fill_dialog` = 0 · `select_dialog` = 380 · `word_state` md5 trước = sau (không đụng tiến độ từ).

### 3.6 Tài liệu
- `SPECIFICATION.md` §3.1–3.3 (bảng ngưỡng, 39 → 36), §4.4 (phủ sóng), §6.3 (đánh dấu dạng 11 ngừng dùng từ M35), §12.2 nếu nhắc 39.
- `Ring.tsx` / `TokenSheet.tsx` chỉ đọc `MASTER_THRESHOLD` / ghi chú ⇒ cập nhật chú thích số.

## 4. Edge case

| Ca | Xử lý |
|---|---|
| Từ stage2 đang giữa vòng có `cycle_points ≥ 9` | Hiện 0 từ; nếu có, lần trả lời tính điểm kế tiếp sẽ lên stage3 — chấp nhận |
| Từ đã có `fill_dialog` trong `cycle_completed_exercises` | Hiện 0; nếu có thì vô hại (không thuộc bộ bài nữa, không cản "đã đạt hết bộ") |
| Hàng retry chứa `fill_dialog` | Hiện 0; Player lọc theo `dangKhaDung` ⇒ không sinh màn |
| Từ stage3/intensive có `total ≥ 36` | Hiện 0 ⇒ không ai lên mastered đột ngột |
| File import cũ có `fill_dialog` | Import được, cảnh báo, bài đó không vào DB |
| Màn Lịch sử học gặp log `fill_dialog` | Vẫn hiện nhãn cũ (không xoá log) |
| Bản Firebase | Sau deploy, index.html không còn kẹt (M34) |

## 5. Kiểm chứng dự kiến
`npm test` (ĐỎ trước ở srs/player/importValidate) · build · lint · `test:import` · `test:player` · `test:db` · `db:migrate` ×2 ·
CDP Player stage2 trên dữ liệu thật (không có màn gõ hội thoại, đủ 4 dạng) · SQL sau xoá.

## 6. PLAN (mỗi task 2–5 phút; logic = ĐỎ trước rồi mới sửa code)

### T1 — RED: `src/lib/srs.test.ts` (sửa số kỳ vọng + 1 ca mới)
- E1: `diemChoBai('intensive', 'fill_dialog', false)` → đổi thành `'select_sentence'` (vẫn 3).
- P3 "stage2 đủ 9/12": `tu({ stage: 'stage2', cycle_points: 6, total_points: 19 })` + `select_sentence` ⇒ `stage3`, `2026-09-16`.
- P3b "stage2 mới 8/12": `cycle_points: 5, total_points: 17` ⇒ vẫn `stage2`.
- H1: `stage2 total 24 → 1`, `stage3 total 36 → 1`; tên ca `4·12·24·36`.
- M1: `stage3, cycle 8, total 32` + `trans_sentence` ⇒ total 36, `mastered`.
- M1b: `stage3, cycle 8, total 31` ⇒ 35, `intensive` ("< 36").
- M2b: `intensive, cycle 6, total 33` + `'select_sentence'` ⇒ 36, `mastered`.
- M2c: `intensive, cycle 6, total 12` + `'select_sentence'` ⇒ `intensive`, `cycle_points 0` (ngưỡng 9/12).
- X1b: `expect(MASTER_THRESHOLD).toBe(36)` · N1: `expect(MAX_CYCLE.stage2).toBe(12)`.
- Ca mới:
```ts
  it('FD1 — M35: fill_dialog ngừng dùng ⇒ 0 điểm, không thuộc bộ bài stage2/intensive', () => {
    expect(diemChoBai('stage2', 'fill_dialog', false)).toBe(0)
    expect(diemChoBai('intensive', 'fill_dialog', false)).toBe(0)
    expect(boBaiCua('stage2')).toEqual(['select_sentence', 'near_synonym', 'arrange_words', 'trans_collocation'])
    expect(boBaiCua('intensive')).toEqual(boBaiCua('stage2'))
  })
```

### T2 — RED: `src/lib/player.test.ts` (CÓ record fill_dialog trong `baiTap` nhưng KHÔNG ra màn)
- Ca dòng 275 → tên `stage2 (M35): có record fill_dialog vẫn KHÔNG ra màn`, kỳ vọng
  `['flashcard', 'select_sentence', 'arrange_words', 'trans_collocation']`.
- NS1 → kỳ vọng `['flashcard', 'select_sentence', 'near_synonym', 'arrange_words', 'trans_collocation']`.
- `npx vitest run src/lib/srs.test.ts src/lib/player.test.ts` ⇒ phải ĐỎ.

### T3 — GREEN: `src/lib/srs.ts`
```ts
  stage2: ['select_sentence', 'near_synonym', 'arrange_words', 'trans_collocation'], // M35: bỏ fill_dialog
  intensive: ['select_sentence', 'near_synonym', 'arrange_words', 'trans_collocation'],
// NGUONG_CYCLE: stage2: 9, intensive: 9   (M35: 4 dạng × 3 = 12, vẫn "được sai 1 bài")
// MAX_CYCLE:    stage2: 12, intensive: 12
// MAX_TICH_LUY: stage2: 24, stage3: 36, intensive: 36
export const MASTER_THRESHOLD = 36 // M35: 4+8+12+12
```
Sửa comment dòng 54/78. `DangBai` GIỮ `'fill_dialog'` (log cũ + enum DB). Chạy lại 2 file test ⇒ XANH.

### T4 — Dọn Player (`player.ts`, `PlayerPage.tsx`, `bai/HoiThoai.tsx`)
- `player.ts`: `Man` → `{ loai: 'select_dialog'; … }`; bỏ `'fill_dialog'` khỏi `CAN_RECORD`, `THU_TU_MAN`; dòng 170
  `if (dang === 'select_dialog')`; dòng 265 `m.loai === 'select_dialog'`.
- `PlayerPage.tsx`: dòng 136 `.eq('type', 'select_dialog')`; dòng 358 `Extract<Man, { loai: 'select_dialog' }>`;
  dòng 537 `if (man.loai === 'select_dialog')`; bỏ prop `cheDo={man.loai}`.
- `HoiThoai.tsx`: bỏ prop `cheDo`, `dienA/dienB`, `oA/oB`, `O_NHAP`, nhánh `<input>`, `oGoiY`, rAF select; `laChon` luôn đúng ⇒ gỡ
  biến; `giaA/giaB` chỉ còn suy từ `chon`; doc-comment bỏ dòng Fill Dialog. Hành vi select_dialog KHÔNG đổi.
- `npx tsc -b` sạch + `npx vitest run src/lib/player.test.ts src/lib/amThanhCore.test.ts`.

### T5 — RED: `src/lib/importValidate.test.ts`
- S6: bỏ dòng `delete bai(d, 'fill_dialog')…`; map đối chiếu schema: bỏ `fill_dialog: 'payloadFillDialog'` (bài mẫu hết fill_dialog ở T10a).
- Ca mới (payload chỉnh cho khớp đủ luật shape hiện có khi chạy):
```ts
  it('FD2 — M35: file còn fill_dialog vẫn HỢP LỆ, cảnh báo ngừng dùng, không đếm vào số bài sẽ ghi', () => {
    const FD = { vocab_temp_id: 'v3', type: 'fill_dialog', payload: { dialog_a: '有___。', dialog_a_pinyin: null,
      dialog_b: '吃___。', dialog_b_pinyin: null, blank_a_answer: '橙子', blank_b_vocab_id: 'v4' } }
    const goc = validateImportFile(sua(() => {}))
    const kq = validateImportFile(sua((d) => { d.exercises.push(FD) }))
    expect(kq.hop_le).toBe(true)
    expect(kq.canh_bao.some((c) => c.thong_diep.includes('fill_dialog') && c.thong_diep.includes('ngừng'))).toBe(true)
    expect(kq.tom_tat.so_bai_tap).toBe(goc.tom_tat.so_bai_tap)
  })
```

### T6 — GREEN: `src/lib/importValidate.ts`
```ts
/** M35 — dạng ngừng dùng: vẫn nhận shape (file cũ), RPC import_topic bỏ qua, không đếm vào số bài sẽ ghi. */
const KIEU_NGUNG_DUNG = new Set(['fill_dialog'])
// trong nhánh Array.isArray(dsBai):
    tom_tat.so_bai_tap = dsBai.filter((b) => !(laObject(b) && KIEU_NGUNG_DUNG.has(String(b['type'])))).length
    const soNgung = dsBai.length - tom_tat.so_bai_tap
    if (soNgung > 0) canh_bao.push({ duong_dan: 'exercises',
      thong_diep: `${soNgung} bài fill_dialog đã ngừng dùng (M35) — sẽ bỏ qua khi import.` })
```
`npx vitest run src/lib/importValidate.test.ts src/lib/importUi.test.ts` ⇒ XANH.

### T7 — RED: `scripts/test-import.mjs` (chạy SAU T10a)
- I1: `exercises = 52` → `51`.
- Ca mới:
```js
  {
    ma: 'I11',
    ten: 'M35 — file còn fill_dialog: import OK nhưng KHÔNG ghi fill_dialog, so_bai_tap không đếm',
    sql: `create temp table kq on commit drop as select import_topic(${nhung(sua((d) => { d.exercises.push(FD_CU) }))}) as r;`,
    assert: `select (select count(*) from exercises where type = 'fill_dialog') = 0
                and (select (r ->> 'so_bai_tap')::int from kq) = 51 as pass,
              format('fill_dialog=%s so_bai_tap=%s', (select count(*) from exercises where type = 'fill_dialog'),
                     (select r ->> 'so_bai_tap' from kq)) as chi_tiet`,
  },
```
(`FD_CU` = hằng record fill_dialog cũ của bài mẫu, khai ở đầu file.) `npm run test:import` ⇒ I11 ĐỎ.

### T8 — GREEN: `supabase/migrations/0007_import_topic.sql` (sửa tại chỗ, đầu vòng B5)
```sql
  loop
    -- M35: fill_dialog ngừng dùng — file cũ vẫn import được, bài này không ghi
    if phan_tu ->> 'type' = 'fill_dialog' then continue; end if;
```
`npm run db:migrate` ×2 ⇒ xanh · `npm run test:import` ⇒ 11/11.

### T9 — Công cụ bổ sung hội thoại M23 chỉ còn select_dialog
- `boSungHoiThoai.ts`: `DangHoiThoai = 'select_dialog'`, `DANG = ['select_dialog']`, `phuSongHoiThoai` trả `{ select_dialog }`;
  lỗi type: `Chỉ nhận select_dialog (fill_dialog đã ngừng — M35)`.
- Test BS8 kỳ vọng `{ select_dialog: ['检查'] }` + ca BS10: file có `type: 'fill_dialog'` ⇒ `loi` khác rỗng (ĐỎ trước).
- `scripts/bo-sung-hoi-thoai.mjs`: `loc` chỉ `type=eq.select_dialog`; `inThieu` + 2 chỗ `du` chỉ xét `select_dialog`.

### T10 — Skill `vocabCsv2Json`
- **T10a** `references/example-output.json`: xoá record `fill_dialog` (dòng 663–674).
- `SKILL.md` dòng 59, 134, 136, 167, 291–308, 343: chỉ còn `select_dialog` + 1 dòng "`fill_dialog` ngừng dùng từ M35 — KHÔNG sinh".
- `references/payload-schemas.md`: §3.11 → "NGỪNG DÙNG (M35)"; dòng 38, 149, 275, 284 bỏ fill_dialog.
- `references/import-schema.json`: GIỮ `payloadFillDialog` (file cũ vẫn hợp lệ) + `description` "M35: ngừng dùng — app bỏ qua".
- `scripts/validate_import.py`: dòng 231 chỉ `("select_dialog",)`; gặp `fill_dialog` ⇒ cảnh báo "đã ngừng dùng (M35) — app sẽ bỏ qua".
  Chạy Python validator trên 3 file mẫu ⇒ 0 lỗi.

### T11 — Tài liệu & chú thích
- `SPECIFICATION.md`: §3.1 (`≥ 9/12`, `≥ 36`), §3.2 (dòng stage2 + `4+8+12+12 = 36`, intensive max 12 / ngưỡng 9), §3.3
  (`MASTER_THRESHOLD = 36` + ghi chú M35), §4.4 (phủ sóng chỉ `select_dialog`), §6.3 (dạng 11 gạch — ngừng dùng từ M35).
- `Ring.tsx` / `TokenSheet.tsx`: sửa chú thích số nếu còn ghi sai.

### T12 — Kiểm tổng
`npm test` · `npm run build` · `npm run lint` · `npm run test:db` · `npm run test:player` · `npm run check:schema`.

### T13 — Dữ liệu thật (chỉ sau T12 xanh)
Script scratchpad `xoa-fill-dialog.mjs` (dùng `chaySql`):
1. `select * from exercises where type = 'fill_dialog'` ⇒ ghi `du-lieu-import/sao-luu/fill_dialog-2026-10-30.json`; đọc lại, đếm = 379, lệch ⇒ DỪNG.
2. md5 `word_state` trước. 3. `delete from exercises where type = 'fill_dialog'`.
4. Kiểm: fill_dialog = 0 · select_dialog = 380 · md5 `word_state` sau = trước.

### T14 — Nghiệm thu CHỈ ĐỌC trên dữ liệu thật
Script scratchpad `nghiem-thu-m35.mjs`: tải từ stage2 + intensive và bài tập (đúng 2 query của `taiBaiTap`) ⇒ chạy `xepBai`
(import `src/lib/player.ts`) ⇒ 0 màn `fill_dialog`, chỉ còn flashcard/grammar + 4 dạng. Không ghi DB.

### T15 — Bàn giao
`memory-bank/` (MB-58) · dọn process · deploy/commit **chỉ khi người dùng cho phép**.
