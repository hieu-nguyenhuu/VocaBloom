# DESIGN.md — M2b: UI Import (Chọn file → Preview → Import → Kết quả)

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản App shell (đã lưu ở `DESIGN.Shell.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-16 · Trạng thái: **✅ HOÀN THÀNH 2026-09-16 — 13/13 task, test 89/89, CDP 17/17 (có import thật)**

---

## 0. Phạm vi

**Làm:**
- `src/lib/importUi.ts` + test — logic thuần (0 `import`): parse JSON + gộp lỗi, tìm từ trùng,
  định dạng KB, dịch lỗi import, **reducer** 5 trạng thái.
- `src/features/import/ImportPage.tsx` — route `/import`, PC 2 cột / Mobile 2 màn theo state.
- `src/components/icons.tsx` — thêm 3 icon trích mockup: `upload` (48, khung kéo-thả), `file`
  (34, card file), `canh-bao` (19, banner vàng), `back` (20, header Mobile Preview).

**KHÔNG làm (đã chốt 2026-09-16):** TTS nền sau import (→ M6, cùng pipeline `tts.ts`); tự chuyển
sang `/tu-vung` sau khi xong (ở lại, có nút); sửa validator hay RPC (đã có test, tái dùng nguyên).

**0 package mới.** `<input type=file>` + `onDrop` native, `file.text()`, `supabase.rpc`.

---

## 1. Số liệu trích từ mockup (`15/16 Import PC`, `16/17 Import Mobile`)

| Phần | Mockup | Utility (Lớp 2) |
|---|---|---|
| Tiêu đề | Baloo 2 700 24 (PC) / 22 (Mobile), mb 24 | `font-display text-22 md:text-24 font-bold text-content-primary mb-6` |
| Khung kéo-thả | `2px dashed #C9C1E8` r20 (PC) / r18, nền `#FBFAF6`, gap 18, icon upload 48 tím, "Kéo thả file JSON vào đây" 17/600, "1 file = 1 topic" 13.5 muted, "hoặc" 13 `#B7AFC9`, nút tím 15/600 p14×28 r12 | `border-2 border-dashed border-border-dashed bg-surface-card rounded-20 flex flex-col items-center justify-center gap-[18px] min-h-[420px]`; text `text-17 font-semibold` / `text-13 text-content-muted` / `text-13 text-content-subtle`; nút `bg-accent text-white text-15 font-semibold px-7 py-[14px] rounded-12` |
| Khung kéo-thả khi đang kéo | (không có) | `border-accent bg-accent-tint` — tự quyết |
| Card file (Preview) | cùng khung dashed r18 p32 gap12, icon file 34 tím, tên file 15/600, "Đã tải lên · 42 KB" 13 muted | như trên, `p-8 gap-3` |
| 2 cột PC | `gap:32px`, trái `flex:1`, phải `flex:1.4` | `md:grid md:grid-cols-[1fr_1.4fr] md:gap-8` |
| Card tóm tắt | nền `#FBFAF6` viền `#F0ECE4` r16 p22; tên topic 18/700 mb12; 3 dòng 14.5 `#4A4458` gap 7 | `bg-surface-card border border-border-card rounded-16 p-[22px]`; `text-18 font-bold`; `text-14 text-content-nav flex flex-col gap-[7px]` |
| Banner vàng | nền `#FEF9C3` viền `#EAB308` r14 p16 gap10; icon tam giác 19 `#946200`; chữ 13.5 `#946200` lh1.5 | `bg-warn-bg border border-warn rounded-14 p-4 flex gap-[10px] items-start text-13 text-warn-text leading-normal` |
| Nút Hủy | nền `#F0ECE4` (dark `#2A2D35`) chữ `#4A4458` 15/600 p15 r12 | `bg-border-card text-content-nav` (light `#F0ECE4` = `--raw-cream-border`, dark `#2A2D35` = `--raw-d-border` — **khớp cả 2 nhánh**) `text-15 font-semibold py-[15px] rounded-12 flex-1` |
| Nút Xác nhận | tím 15/600 p15 r12 | `bg-accent text-white … flex-1 disabled:opacity-60` |
| Mobile Preview header | back 20 `#241B3A` sw2 + "Xem trước" Baloo 19 | `flex items-center gap-[14px]`; icon `back` `text-content-primary` |

**Trạng thái chưa có mockup — đã duyệt:**
- **Validate lỗi:** card `bg-danger-bg border border-danger rounded-14 p-4 text-13 text-danger-text`; tiêu đề
  "File chưa hợp lệ · N lỗi" 600; `<ul>` tối đa 10 dòng `đường_dẫn — thông_điệp` (font-mono cho đường dẫn),
  dòng cuối "…và N lỗi khác". Nút duy nhất [Chọn file khác] (kiểu Hủy).
- **Đang import:** nút Xác nhận `disabled` + "Đang import…".
- **Thành công:** card tóm tắt, tiêu đề "Đã import **{tên}**" có dấu ✓ `text-success`; 3 dòng số liệu **từ RPC**;
  dòng muted "Từ mới nằm ở hàng đợi, cron sẽ nhỏ giọt mỗi ngày." Nút [Import file khác] (Hủy) + [Xem từ vựng] (primary, `Link` → `/tu-vung`).
- **Thất bại:** card đỏ như validate lỗi: "Import thất bại" + message + "Không có gì được ghi (đã rollback)." Nút [Thử lại] (primary, giữ file) + [Chọn file khác].
- **Cảnh báo không chặn** (trùng từ · trùng topic · `canh_bao[]` validator) gộp 1 banner vàng, mỗi mục 1 dòng.
- **Không kiểm tra được trùng** (mạng lỗi lúc query) → thêm dòng vào banner: "Không kiểm tra được từ trùng (mạng). Vẫn import được."

---

## 2. Kiến trúc

### 2.1 State machine (reducer thuần trong `importUi.ts`)

```
chon_file ──(chon: file ok)──► preview ──(xac_nhan)──► dang_import ──(ok)──► ket_qua_ok
    ▲             │(file lỗi)      │(huy)                     │(loi)
    │             ▼                ▼                          ▼
    │        loi_file          chon_file                 ket_qua_loi ──(thu_lai)──► dang_import
    └─────(chon_file_khac)─────────┴───────────────────────────┘
```

```ts
export type TrangThaiImport =
  | { buoc: 'chon_file' }
  | { buoc: 'loi_file'; ten_file: string; kich_thuoc: number; loi: ViTri[] }
  | { buoc: 'preview'; ten_file: string; kich_thuoc: number; du_lieu: unknown; tom_tat: TomTat; canh_bao: string[] }
  | { buoc: 'dang_import'; ten_file: string; kich_thuoc: number; du_lieu: unknown; tom_tat: TomTat; canh_bao: string[] }
  | { buoc: 'ket_qua_ok'; ten_topic: string; ket_qua: KetQuaRpc }
  | { buoc: 'ket_qua_loi'; ten_file: string; kich_thuoc: number; du_lieu: unknown; tom_tat: TomTat; canh_bao: string[]; loi: string }

export type HanhDong =
  | { loai: 'chon'; ten_file: string; kich_thuoc: number; ket_qua: KetQuaDoc }
  | { loai: 'them_canh_bao'; dong: string[] }      // sau khi query trùng xong
  | { loai: 'xac_nhan' } | { loai: 'huy' } | { loai: 'chon_file_khac' }
  | { loai: 'import_ok'; ket_qua: KetQuaRpc } | { loai: 'import_loi'; loi: string } | { loai: 'thu_lai' }
```

`ViTri`/`TomTat` copy shape từ `importValidate.ts` (không import để giữ 0 `import`? — **KHÔNG**: `importUi.ts`
được phép `import type` từ `importValidate.ts` và gọi `validateImportFile` — cả hai đều thuần, không React/Supabase.
Test X-import canh: không import `react` / `@supabase` / `node:`.)

### 2.2 Hàm thuần

```ts
export function docFileImport(text: string): KetQuaDoc            // JSON.parse → validateImportFile; lỗi cú pháp → loi[{duong_dan:'(JSON)', thong_diep}]
export function timTuTrung(tuFile: string[], tuDb: string[]): string[]   // unique, giữ thứ tự file
export function dinhDangKB(bytes: number): string                  // 42 KB / 1.2 MB
export function dichLoiImport(err: { message?: string; code?: string } | null | undefined): string
export function dongCanhBao(a: { tuTrung: string[]; topicTrung: number; canhBaoValidator: ViTri[]; khongKiemTraDuoc: boolean }): string[]
export function giamTrangThai(s: TrangThaiImport, h: HanhDong): TrangThaiImport
export const GIOI_HAN_BYTES = 5 * 1024 * 1024
```

Câu chữ cảnh báo (nguyên văn theo mockup): `2 từ trùng với dữ liệu hiện có ("苹果", "香蕉") — vẫn sẽ được thêm mới, không ghi đè.`
Topic trùng: `Đã có topic tên "Trái cây" — sẽ tạo thêm topic mới, không gộp.`
Lỗi import: PostgREST trả `{ message, code }` → hiện `message` nếu có (đã là tiếng Việt từ `raise exception`),
mạng → "Không kết nối được. Kiểm tra mạng rồi thử lại nhé.", còn lại → "Có lỗi khi import. Thử lại sau nhé."

### 2.3 Component `ImportPage`

```
<KhungTrang rong={960}>
  <h1>Import từ vựng</h1>            (Mobile ở bước preview+: header back "Xem trước")
  PC: grid 2 cột — trái: KhungFile (kéo-thả | card file) · phải: theo buoc
  Mobile: buoc==='chon_file' → chỉ khung kéo-thả; còn lại → chỉ cột phải (card file thu gọn 1 dòng ở trên)
```
Side-effects ở component: đọc file (`file.text()`), query trùng (2 query song song `Promise.all`), gọi `rpc`.
Reducer quyết định UI; component chỉ dispatch.

---

## 3. Kế hoạch — 12 task (2–5 phút/task)

### T1 · RED — `src/lib/importUi.test.ts` cho `docFileImport` + `timTuTrung` + `dinhDangKB`
```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dinhDangKB, docFileImport, timTuTrung } from './importUi.ts'

const MAU = readFileSync('import_csv_vocab/references/example-output.json', 'utf8')

describe('docFileImport', () => {
  it('file mẫu thật → hợp lệ, có tóm tắt', () => {
    const kq = docFileImport(MAU)
    expect(kq.hop_le).toBe(true)
    expect(kq.tom_tat.so_tu).toBeGreaterThan(0)
  })
  it('JSON hỏng → 1 lỗi tại (JSON), không ném exception', () => {
    const kq = docFileImport('{"topic": ')
    expect(kq.hop_le).toBe(false)
    expect(kq.loi[0]?.duong_dan).toBe('(JSON)')
  })
  it('JSON đúng cú pháp nhưng sai cấu trúc → lỗi của validator', () => {
    expect(docFileImport('[]').loi[0]?.duong_dan).toBe('(gốc)')
  })
})
describe('timTuTrung', () => {
  it('unique, giữ thứ tự file', () => {
    expect(timTuTrung(['苹果', '香蕉', '苹果', '梨'], ['梨', '苹果'])).toEqual(['苹果', '梨'])
  })
  it('không trùng → rỗng', () => { expect(timTuTrung(['a'], ['b'])).toEqual([]) })
})
describe('dinhDangKB', () => {
  it('42 KB', () => { expect(dinhDangKB(43_008)).toBe('42 KB') })
  it('dưới 1 KB → 1 KB', () => { expect(dinhDangKB(300)).toBe('1 KB') })
  it('1.2 MB', () => { expect(dinhDangKB(1_258_291)).toBe('1.2 MB') })
})
```
Chạy → ĐỎ (module chưa có).

### T2 · GREEN — `src/lib/importUi.ts` phần 1
```ts
import { validateImportFile, type KetQuaValidate, type ViTri } from './importValidate.ts'

/**
 * Logic thuần cho màn Import (M2b). Không React, không Supabase — component chỉ dispatch.
 * Validator (`importValidate.ts`) và RPC `import_topic` tái dùng nguyên, không lặp luật ở đây.
 */
export type KetQuaDoc = KetQuaValidate & { du_lieu: unknown }
export const GIOI_HAN_BYTES = 5 * 1024 * 1024

export function docFileImport(text: string): KetQuaDoc {
  let du_lieu: unknown
  try {
    du_lieu = JSON.parse(text)
  } catch (e) {
    const loi: ViTri[] = [{ duong_dan: '(JSON)', thong_diep: `Không đọc được JSON: ${(e as Error).message}` }]
    return { hop_le: false, loi, canh_bao: [], tom_tat: { ten_topic: '', so_tu: 0, so_bai_tap: 0, so_dong_hoi_thoai: 0 }, du_lieu: null }
  }
  return { ...validateImportFile(du_lieu), du_lieu }
}

export function timTuTrung(tuFile: string[], tuDb: string[]): string[] {
  const db = new Set(tuDb)
  return [...new Set(tuFile.filter((w) => db.has(w)))]
}

export function dinhDangKB(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
```
→ XANH 8 ca.

### T3 · RED — test `dongCanhBao` + `dichLoiImport`
```ts
describe('dongCanhBao', () => {
  it('trùng từ → nguyên văn mockup', () => {
    expect(dongCanhBao({ tuTrung: ['苹果', '香蕉'], topicTrung: 0, canhBaoValidator: [], khongKiemTraDuoc: false }))
      .toEqual(['2 từ trùng với dữ liệu hiện có ("苹果", "香蕉") — vẫn sẽ được thêm mới, không ghi đè.'])
  })
  it('topic trùng + cảnh báo validator + mạng lỗi → mỗi thứ 1 dòng, đúng thứ tự', () => {
    const d = dongCanhBao({ tuTrung: [], topicTrung: 1, canhBaoValidator: [{ duong_dan: 'vocab[0]', thong_diep: 'thiếu bài selection' }], khongKiemTraDuoc: true, tenTopic: 'Trái cây' })
    expect(d).toEqual([
      'Đã có topic tên "Trái cây" — sẽ tạo thêm topic mới, không gộp.',
      'vocab[0]: thiếu bài selection',
      'Không kiểm tra được từ trùng (mạng). Vẫn import được.',
    ])
  })
  it('không có gì → rỗng', () => {
    expect(dongCanhBao({ tuTrung: [], topicTrung: 0, canhBaoValidator: [], khongKiemTraDuoc: false })).toEqual([])
  })
})
describe('dichLoiImport', () => {
  it('lỗi từ raise exception (tiếng Việt) → giữ nguyên message', () => {
    expect(dichLoiImport({ message: 'exercises: vocab_temp_id "v9" không có trong mảng vocab', code: 'P0001' }))
      .toBe('exercises: vocab_temp_id "v9" không có trong mảng vocab')
  })
  it('mạng → câu mạng', () => { expect(dichLoiImport({ message: 'TypeError: Failed to fetch' })).toBe('Không kết nối được. Kiểm tra mạng rồi thử lại nhé.') })
  it('rỗng → câu chung', () => { expect(dichLoiImport(null)).toBe('Có lỗi khi import. Thử lại sau nhé.') })
})
```

### T4 · GREEN — `dongCanhBao` + `dichLoiImport`
```ts
export function dongCanhBao(a: { tuTrung: string[]; topicTrung: number; canhBaoValidator: ViTri[]; khongKiemTraDuoc: boolean; tenTopic?: string }): string[] {
  const d: string[] = []
  if (a.tuTrung.length > 0) {
    const ds = a.tuTrung.map((w) => `"${w}"`).join(', ')
    d.push(`${a.tuTrung.length} từ trùng với dữ liệu hiện có (${ds}) — vẫn sẽ được thêm mới, không ghi đè.`)
  }
  if (a.topicTrung > 0) d.push(`Đã có topic tên "${a.tenTopic ?? ''}" — sẽ tạo thêm topic mới, không gộp.`)
  for (const c of a.canhBaoValidator) d.push(`${c.duong_dan}: ${c.thong_diep}`)
  if (a.khongKiemTraDuoc) d.push('Không kiểm tra được từ trùng (mạng). Vẫn import được.')
  return d
}

export type LoiImport = { message?: string | undefined; code?: string | undefined } | null | undefined
export function dichLoiImport(err: LoiImport): string {
  const m = err?.message ?? ''
  if (/fetch|network/i.test(m)) return 'Không kết nối được. Kiểm tra mạng rồi thử lại nhé.'
  if (m.trim()) return m
  return 'Có lỗi khi import. Thử lại sau nhé.'
}
```

### T5 · RED — test reducer `giamTrangThai` (6 ca: chon ok → preview · chon lỗi → loi_file · huy → chon_file · xac_nhan → dang_import · import_ok → ket_qua_ok mang `ket_qua` RPC · import_loi → ket_qua_loi rồi thu_lai → dang_import giữ `du_lieu`; + hành động sai bước bị bỏ qua, trả nguyên state)

### T6 · GREEN — reducer (theo §2.1) + test **X-import** đọc mã nguồn `importUi.ts`, khẳng định không import `react`/`@supabase`/`node:`.

### T7 · Icon — thêm vào `icons.tsx`: `upload` (= path icon Import, chỉ khác size/stroke 1.6 → truyền prop `strokeWidth`), `file` (`M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5Z`), `canh-bao` (`M12 9v4M12 17h.01` + tam giác), `back` (`M15 18l-6-6 6-6`).

### T8 · `ImportPage.tsx` — khung + bước Chọn file (kéo-thả, input ẩn, giới hạn 5 MB, nhiều file → lấy file đầu + cảnh báo)

### T9 · `ImportPage.tsx` — bước Preview: card file, card tóm tắt, banner vàng; side-effect query trùng
```ts
const [vocab, topic] = await Promise.all([
  supabase.from('vocab').select('word').in('word', dsTu),
  supabase.from('topics').select('id').eq('name', tom_tat.ten_topic),
])
// lỗi bất kỳ → khongKiemTraDuoc = true
```

### T10 · `ImportPage.tsx` — Xác nhận → `supabase.rpc('import_topic', { du_lieu })` → ok / loi; card kết quả; nút Thử lại / Import file khác / Xem từ vựng. Mobile header back.

### T11 · Nối `App.tsx` (`/import` → `<ImportPage/>`, bỏ stub mục này) · build · lint · test (kỳ vọng 67 + ~20).

### T12 · Kiểm thật CDP: kéo file mẫu qua `DataTransfer` (hoặc set input `files` qua `DOM.setFileInputFiles`) → preview đúng số liệu file mẫu · banner trùng (3 file mẫu **đã import trước đó** ⇒ chắc chắn có từ trùng + topic trùng) · **Xác nhận import thật** file `example-output-single-word-topic.json` (nhỏ nhất) → card thành công, đối chiếu số liệu với DB qua PostgREST · file hỏng → card đỏ · chụp PC light/dark + Mobile 2 bước · tắt process. Sau đó **ghi nhận topic vừa import** vào memory-bank (DB có thêm 1 topic).

### T13 · memory-bank: `activeContext` (M2b ✅, DB đổi số liệu, việc kế tiếp), `progress`, `decisionLog` (MB-18).

---

## 4. Checklist soát ở Bước 4
- [x] Không hex; 4 icon mới trích nguyên văn; không icon cây.
- [x] Validator + RPC tái dùng nguyên, không lặp luật.
- [x] Reducer thuần có test; component chỉ dispatch.
- [x] Trùng từ/topic = cảnh báo không chặn (DEC-21, Q4 MB-14).
- [x] Số liệu card thành công lấy từ RPC, không từ file.
- [x] Edge: JSON hỏng · >5 MB · nhiều file · mạng lỗi khi query trùng · mạng lỗi khi import (Thử lại giữ file) · bấm đúp.
- [x] TTS chưa gọi (M6). Sau thành công ở lại trang.
