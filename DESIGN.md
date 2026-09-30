# DESIGN.md — M21: Từ kẹt "đến hạn nhưng không có bài" (复习)

> Kiến trúc của RIÊNG task này (thay nội dung M20 đã xong, M20 đã ghi vào memory-bank MB-41).
> Ngày lập: 2026-09-30 · Trạng thái: **✅ DESIGN + PLAN ĐÃ DUYỆT · ĐÃ XONG 2026-09-30** (MB-42)
> Người dùng chốt: phương án **(a)** — Player tự gỡ kẹt, KHÔNG sửa tay DB.

## A. Nguyên nhân (đã đo trên DB thật, chỉ đọc)

复习 · `stage2` · due 30/09 · `cycle_points 7 < 9` · `cycle_completed_exercises = [select_sentence, arrange_words,
trans_collocation]` · **không có record `fill_dialog`** · `daily_retry_queue` rỗng.

1. `srs.ts` `xuLyTraLoi` (bài cuối, chưa đủ ngưỡng): `chuaDat = ['fill_dialog']` ≠ rỗng ⇒ KHÔNG vào nhánh R2d
   "mở lại bộ bài" ⇒ `daDat` giữ nguyên 3 dạng.
2. `PlayerPage` `locRetryTheoRecord` lọc `fill_dialog` (từ không có record) ⇒ `null` ⇒ không ghi hàng retry.
3. Lần sau `xepBai` bỏ 3 dạng đã đạt ⇒ chỉ còn flashcard ⇒ `coBaiTinhDiem = false` ⇒ `khong_co_tu`.
4. Dashboard chỉ đếm theo `next_review_date` ⇒ vẫn hiện 1. Từ **kẹt vĩnh viễn** + bị cron phạt mỗi ngày.

Phạm vi: **200/240 từ** không có `select_dialog`/`fill_dialog` (bài hội thoại dùng chung 2 từ) ⇒ stage1/2/intensive
có điểm tối đa **bằng đúng ngưỡng** — dùng gợi ý 1 lần là kẹt. Các dạng 1-từ khác (8 dạng) đủ 100% record.

**Gốc rễ:** R2d (M4a) hỏi "đã đạt hết bộ bài LÝ THUYẾT chưa?", đúng ra phải hỏi "đã đạt hết bài THỰC CÓ chưa?".
`srs.ts` thuần nên không biết từ có record nào — tầng gọi phải truyền vào.

## B. Thiết kế — 2 lớp, cùng 1 định nghĩa "dạng khả dụng"

### B1. Hàm thuần mới `dangKhaDung(stage, dangCoRecord)` — `src/lib/player.ts`
Dạng tính điểm của stage mà từ **thực sự dựng được màn**: dạng không cần record (đọc từ `vocab`) luôn có;
dạng cần record chỉ có khi có record. `trans_sentence`/`complete_situation` cũng tính là cần record
(khớp đúng `xepBai` dòng 188 — hiện nằm ngoài `CAN_RECORD` nhưng `xepBai` vẫn bỏ màn khi thiếu).

### B2. Phòng lỗi — `srs.ts` `xuLyTraLoi` nhận tham số TUỲ CHỌN `dang_kha_dung?: readonly DangBai[]`
- `chuaDat` chỉ xét các dạng trong `dang_kha_dung` (không truyền ⇒ hành vi cũ, ~32 test cũ khỏi sửa).
- `chuaDat` rỗng ⇒ đi đúng nhánh R2d có sẵn: `daDat = []` + retry **cả bộ** (`exercise_types: null`).
- ⇒ Từ thiếu điểm vào `daily_retry_queue`, ôn lại ở **lượt riêng SAU** (giữ đúng DEC-06), không lặp ngay.
- `srs.ts` vẫn 0 dòng `import` (test X1c canh) — chỉ nhận thêm 1 mảng.
- `PlayerPage` truyền `dangKhaDung(stage, dangCoRecord.current[vocab_id] ?? [])`.

### B3. Gỡ kẹt (phương án a) — hàm thuần `moLaiNeuHetBai(tu, dangCo)` — `src/lib/player.ts`
- Từ ở stage ôn, **mọi dạng khả dụng đều đã nằm trong `cycle_completed_exercises`** ⇒ trả bản sao với
  `cycle_completed_exercises = []` (giữ nguyên `cycle_points`). Ngược lại trả nguyên từ.
- `napSession` áp cho từng từ của phiên **trước `xepBai`** (luồng hằng ngày + retry; topic đã `boQuaDaDat` nên bỏ qua),
  và dispatch chính bản đã mở lại ⇒ lần trả lời đầu tiên tự ghi `daDat` mới xuống DB. **0 lệnh ghi DB lúc tải.**
- Đây là lưới an toàn cho dữ liệu ĐÃ kẹt (复习) và mọi đường kẹt chưa biết; B2 chặn đường kẹt đã biết.

### Không làm (YAGNI)
- Không đổi ngưỡng/điểm tối đa theo số bài khả dụng (đổi luật SPEC §3.2 — cần quyết riêng).
- Không đổi cách Dashboard đếm (sau B2+B3, từ due luôn có bài ⇒ 2 bên khớp).
- Không sinh thêm record hội thoại cho 200 từ (việc của dữ liệu import, không phải app).

## C. Edge case đã xét
| Ca | Kết quả |
|---|---|
| Thiếu `fill_dialog`, sai `arrange_words` ở bài cuối | `chuaDat = [arrange_words]` ⇒ retry đúng dạng đó (như cũ) |
| Đủ record, dùng gợi ý, đạt hết | nhánh R2d cũ, không đổi |
| Từ là **vai B** của bài hội thoại | `dungMapRecord` đã tính record qua `blank_b_vocab_id` ⇒ vẫn khả dụng |
| Từ `new` (matching luôn có) · `stage3` · `intensive` | dùng chung 1 định nghĩa, không nhánh riêng |
| Kẹt + đang có hàng retry | luồng retry cũng áp B3 ⇒ không dựng 0 màn |
| Mở lại xong mà người dùng thoát ngay | DB chưa đổi ⇒ lần sau B3 lại mở lại, không mất gì |

## D. Kiểm chứng dự kiến
- TDD: `dangKhaDung` · `moLaiNeuHetBai` · `xuLyTraLoi` ca **R2e** (thiếu `fill_dialog` + gợi ý ⇒ mở lại + retry cả bộ)
  — RED trước, rồi GREEN. Fixture theo shape THẬT của 复习.
- `npm test` · `npm run build` · `npm run lint`.
- Kiểm thật: bấm "Bắt đầu ôn tập" ⇒ 复习 hiện đủ 3 bài stage2 (đo bằng `data-so-tu-phien` + đếm màn, **không trả lời**
  để không ghi DB thay người dùng).

## E. PLAN — 8 task (mỗi task 2–5 phút)

### T1 · RED — `src/lib/srs.test.ts` (chèn ngay sau ca R2d, dòng 182)
```ts
  it('R2e — thiếu record fill_dialog: đạt hết bài THỰC CÓ mà thiếu điểm → mở lại + retry CẢ BỘ (复习 30/09)', () => {
    const kq = xuLyTraLoi({
      trang_thai: tu({ stage: 'stage2', cycle_points: 6, cycle_completed_exercises: ['select_sentence', 'arrange_words'] }),
      dang_bai: 'trans_collocation', dung: true, dung_goi_y: true, dang_due: true, la_bai_cuoi_cua_tu: true,
      hom_nay: HOM_NAY, dang_kha_dung: ['select_sentence', 'arrange_words', 'trans_collocation'],
    })
    expect(kq.trang_thai_moi.cycle_points).toBe(7)
    expect(kq.trang_thai_moi.stage).toBe('stage2')
    expect(kq.trang_thai_moi.cycle_completed_exercises).toEqual([])
    expect(kq.vao_retry_queue).toEqual({ reason: 'below_threshold', exercise_types: null })
  })

  it('R2f — có dang_kha_dung mà còn bài THỰC CÓ chưa đạt → retry đúng dạng đó, bỏ dạng không có bài', () => {
    const kq = xuLyTraLoi({
      trang_thai: tu({ stage: 'stage2', cycle_points: 3, cycle_completed_exercises: ['select_sentence'] }),
      dang_bai: 'trans_collocation', dung: true, dung_goi_y: false, dang_due: true, la_bai_cuoi_cua_tu: true,
      hom_nay: HOM_NAY, dang_kha_dung: ['select_sentence', 'arrange_words', 'trans_collocation'],
    })
    expect(kq.trang_thai_moi.cycle_completed_exercises).toEqual(['select_sentence', 'trans_collocation'])
    expect(kq.vao_retry_queue).toEqual({ reason: 'below_threshold', exercise_types: ['arrange_words'] })
  })
```
Chạy `npx vitest run src/lib/srs.test.ts` ⇒ **R2e + R2f phải ĐỎ** (hiện `chuaDat` còn `fill_dialog`).

### T2 · GREEN — `src/lib/srs.ts`
- Chữ ký `xuLyTraLoi` thêm (sau `hom_nay: string`):
  ```ts
    /** M21 — dạng của stage mà từ THỰC SỰ có bài (tầng gọi tính từ record). Không truyền ⇒ cả bộ lý thuyết. */
    dang_kha_dung?: readonly DangBai[]
  ```
- Destructure thêm `dang_kha_dung`. Dòng 273:
  ```ts
      const chuaDat = DANG_BAI_THEO_STAGE[stage_before].filter(
        (x) => !daDat.includes(x) && (!dang_kha_dung || dang_kha_dung.includes(x)),
      )
  ```
- Thêm 1 dòng vào comment R2d: `// M21: chỉ xét dạng THỰC CÓ bài — thiếu record fill_dialog thì "hết bộ" không bao giờ đúng (复习).`

Chạy lại ⇒ `srs.test.ts` xanh toàn bộ (R2d cũ vẫn xanh vì không truyền tham số).

### T3 · RED — `src/lib/player.test.ts`
Thêm `dangKhaDung, moLaiNeuHetBai` vào import từ `./player.ts`; cuối file:
```ts
describe('dangKhaDung + moLaiNeuHetBai (M21 — từ kẹt vì thiếu record hội thoại)', () => {
  const phucTap: TrangThaiTu = {
    vocab_id: 'fx', stage: 'stage2', next_review_date: '2026-09-30', cycle_points: 7,
    cycle_completed_exercises: ['select_sentence', 'arrange_words', 'trans_collocation'],
    total_points: 17, last_reviewed_at: '2026-09-30',
  }
  const co: DangBai[] = ['selection', 'audio_recognition', 'fast_decision', 'select_on_describe',
    'select_sentence', 'arrange_words', 'trans_sentence', 'complete_situation']
  const baiTap = co.map((type, i) => ({ id: `b${i}`, vocab_id: 'fx', type, payload: {} }))

  it('K1 — dạng không cần record luôn có; dạng cần record chỉ có khi có record', () => {
    expect(dangKhaDung('stage2', [])).toEqual(['trans_collocation'])
    expect(dangKhaDung('stage2', co)).toEqual(['select_sentence', 'arrange_words', 'trans_collocation'])
    expect(dangKhaDung('stage3', ['trans_sentence'])).toEqual(['make_sentence', 'trans_sentence'])
    expect(dangKhaDung('mastered', co)).toEqual([])
  })
  it('K2 — đạt hết bài THỰC CÓ ⇒ mở lại bộ bài, giữ cycle_points + field khác', () => {
    const kq = moLaiNeuHetBai({ ...phucTap, vocab: { word: '复习' } }, co)
    expect(kq.cycle_completed_exercises).toEqual([])
    expect(kq.cycle_points).toBe(7)
    expect(kq.vocab).toEqual({ word: '复习' })
  })
  it('K3 — còn bài thực có chưa đạt / mastered / chưa đạt gì ⇒ trả NGUYÊN object', () => {
    const conBai = { ...phucTap, cycle_completed_exercises: ['select_sentence'] as DangBai[] }
    expect(moLaiNeuHetBai(conBai, co)).toBe(conBai)
    const master = { ...phucTap, stage: 'mastered' as const }
    expect(moLaiNeuHetBai(master, co)).toBe(master)
    const rong = { ...phucTap, cycle_completed_exercises: [] as DangBai[] }
    expect(moLaiNeuHetBai(rong, co)).toBe(rong)
  })
  it('K4 — tái hiện lỗi: từ kẹt chỉ ra flashcard; mở lại thì có bài tính điểm', () => {
    expect(coBaiTinhDiem(xepBai({ tu: [phucTap], baiTap }).man)).toBe(false)
    expect(coBaiTinhDiem(xepBai({ tu: [moLaiNeuHetBai(phucTap, co)], baiTap }).man)).toBe(true)
  })
})
```
Chạy `npx vitest run src/lib/player.test.ts` ⇒ **ĐỎ** (2 hàm chưa tồn tại).

### T4 · GREEN — `src/lib/player.ts` (ngay sau `locRetryTheoRecord`)
```ts
/** `xepBai` bỏ màn tự luận khi thiếu record (trừ make_sentence) dù 2 dạng này nằm ngoài CAN_RECORD. */
const CAN_RECORD_TU_LUAN: ReadonlySet<DangBai> = new Set(['trans_sentence', 'complete_situation'])

/**
 * M21 — dạng TÍNH ĐIỂM của stage mà từ THỰC SỰ dựng được màn. 200/240 từ không có record
 * select_dialog/fill_dialog (bài hội thoại dùng chung 2 từ) ⇒ bộ bài lý thuyết ≠ bộ bài thực có.
 */
export function dangKhaDung(stage: Stage, dangCoRecord: readonly DangBai[]): DangBai[] {
  const co = new Set(dangCoRecord)
  return boBaiCua(stage).filter((d) => co.has(d) || (!CAN_RECORD.has(d) && !CAN_RECORD_TU_LUAN.has(d)))
}

/**
 * M21 — lưới an toàn: từ đã đạt HẾT dạng thực có mà vẫn due (chưa đủ ngưỡng) thì `xepBai` chỉ còn
 * flashcard ⇒ Player báo "không có từ" trong khi Dashboard đếm 1 (复习, 30/09). Mở lại bộ bài,
 * giữ nguyên cycle_points. Chỉ đổi bản trong bộ nhớ — DB cập nhật khi trả lời bài đầu tiên.
 */
export function moLaiNeuHetBai<T extends TrangThaiTu>(tu: T, dangCoRecord: readonly DangBai[]): T {
  const kd = dangKhaDung(tu.stage, dangCoRecord)
  if (kd.length === 0 || tu.cycle_completed_exercises.length === 0) return tu
  return kd.every((d) => tu.cycle_completed_exercises.includes(d)) ? { ...tu, cycle_completed_exercises: [] } : tu
}
```
Chạy lại ⇒ `player.test.ts` xanh.

### T5 · Nối dây — `src/features/player/PlayerPage.tsx`
- Import thêm `dangKhaDung, moLaiNeuHetBai` từ `../../lib/player.ts`.
- `napSession`, ngay sau khối `const baiTapPhien = ...` (dòng ~255):
  ```ts
        // M21 — từ đã đạt hết dạng THỰC CÓ mà vẫn due ⇒ mở lại bộ bài (topic đã boQuaDaDat nên bỏ qua)
        const coRecordPhien = dungMapRecord(baiTapPhien)
        const phienMo = topicId ? phien : phien.map((t) => moLaiNeuHetBai(t, coRecordPhien[t.vocab_id] ?? []))
  ```
  rồi đổi `xepBai({ tu: phienMo, ... })` · `dangCoRecord.current = coRecordPhien` ·
  `trang_thai: Object.fromEntries(phienMo.map((t) => [t.vocab_id, t]))`.
- `traLoi` (dòng 356) thêm vào đối số `xuLyTraLoi`:
  `dang_kha_dung: dangKhaDung(trang_thai.stage, dangCoRecord.current[vocab_id] ?? [])`.

### T6 · Kiểm tĩnh
`npm test` · `npm run build` · `npm run lint` — xanh, không thêm lỗi lint mới.

### T7 · Kiểm thật CHỈ ĐỌC (0 lệnh ghi DB)
`npm run dev` nền + Chrome headless CDP, đăng nhập, mở `/on-tap`: khẳng định KHÔNG có màn "không có từ",
`data-so-tu-phien = 1`, màn đầu là Flashcard 复习. **Không bấm trả lời** (tránh ghi `review_log` thay người dùng);
đếm request `POST /rpc/luu_tra_loi` = 0. Xong tắt Chrome + dev server.

### T8 · Ký ức
`activeContext.md` + `progress.md` (M21) + `decisionLog.md` MB-42 + `systemPatterns.md` §7 thêm pattern
"bộ bài lý thuyết ≠ bộ bài thực có". Cập nhật trạng thái DESIGN.md.
