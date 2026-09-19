# DESIGN.md — M6a: Màn Cài đặt + Thông báo

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản M5 (đã lưu ở `DESIGN.M5.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-18 · Trạng thái: **✅ HOÀN THÀNH 2026-09-18 — test 176/176, CDP 18/18, đã gỡ VITE_OPENROUTER_* (MB-23)**

---

## 0. Phạm vi (chốt ở Brainstorm 2026-09-18)

M6 được cắt 3 lát; **lát này là M6a**:

| Lát | Nội dung | Trạng thái |
|---|---|---|
| **M6a** | **Cài đặt** (mockup 17 PC / 18 Mobile) + **Thông báo** (18 PC / 19 Mobile) | ← task này |
| M6b | Dashboard + Khu vườn (mockup 01) | sau |
| M6c | TTS Google + Supabase Storage | sau |

**Làm:**
- `src/lib/settings.ts` — **thuần** (TDD): kiểu 5 key, ẩn khoá (`sk-••••3f2a`), kẹp stepper.
- `src/features/settings/CaiDatPage.tsx` — 3 nhóm, đọc/ghi bảng `settings`.
- `src/lib/thongBao.ts` — **thuần**: thời gian tương đối, đếm chưa đọc.
- `src/features/notifications/PanelThongBao.tsx` — panel PC (360px xổ cạnh sidebar) / sheet Mobile.
- Kích hoạt nút chuông ở `AppShell` (đang bất hoạt từ M4a) + chấm báo khi có tin chưa đọc.

**KHÔNG làm:** Dashboard (M6b) · TTS thật + nút nghe thử giọng (M6c) · nút Đăng xuất (chưa có mockup) ·
màn "lịch sử quyết định" (spec §11 nói không làm).

**0 package mới.**

**Dữ liệu thật:** `notifications` có **5 bản `low_queue` chưa đọc** (9–16/9) · `settings` 5 key
(`openrouter_api_key`/`model` = null) · hàng đợi từ mới = 0 (nên cảnh báo là đúng thực tế).

---

## 1. Số liệu mockup

### 1.1 Cài đặt (PC 17 · Mobile 18)
| Phần | Mockup PC / Mobile | Utility |
|---|---|---|
| Bố cục | PC: 2 cột `gap 32`, trái `flex 1.2` (AI + Học tập), phải `flex 1` (Thông báo), `max-w 960`; Mobile: 1 cột `gap 20` | `md:grid md:grid-cols-[1.2fr_1fr] md:gap-8` trong `KhungTrang rong={960}` |
| Nhãn nhóm | 12/700 `#8B8593` uppercase `letter-spacing .04em`, mb 12/10 | `text-12 font-bold uppercase tracking-[0.04em] text-content-muted` |
| Hàng cài đặt | `#FBFAF6` viền `#F0ECE4` r10, padding `14px 16px` (PC) / `12px 14px`; nhãn trái 14/13.5 `#4A4458`; giá trị phải 14/13.5 `#241B3A` 600 | `flex items-center justify-between rounded-10 border border-border-card bg-surface-card px-4 py-3.5` · `text-14 text-content-nav` · `text-14 font-semibold text-content-primary` |
| Stepper | 2 nút 28×28 (PC) / 26×26, r8, nền `#F0ECE4`, ký tự `−` `+` 700 `#4A4458`; số ở giữa 700 | `h-7 w-7 rounded-8 bg-border-card font-bold text-content-nav` |
| Toggle | track 36×20 r99, bật `#5B4FE8`, núm 16×16 trắng lệch phải 2px | `h-5 w-9 rounded-pill` + `bg-accent` / `bg-border-subtle`; núm `absolute top-0.5 h-4 w-4 rounded-pill bg-white transition-all` |
| Giá trị khoá | `sk-••••3f2a` | `settings.ts` → `anKhoa()` |

### 1.2 Thông báo (PC 18 · Mobile 19)
| Phần | Mockup | Utility |
|---|---|---|
| PC panel | `absolute; left:calc(100% + 12px); bottom:0; width:360px`, `#FFFFFF`, viền `#EFEAE0`, r16, shadow, padding 8 | `absolute bottom-0 left-[calc(100%+12px)] z-20 w-[360px] rounded-16 border border-border-card bg-surface-raised p-2 shadow-[0_20px_50px_-12px_rgba(36,27,58,0.28)]` |
| PC tiêu đề | "Thông báo" Baloo 15/700, padding `12px 12px 8px` | `px-3 pt-3 pb-2 font-display text-15 font-bold` |
| Mobile sheet | overlay `rgba(36,27,58,0.25)`; panel `78% max-w 300`, `max-h 420`, `margin 70px 16px 0 0`, r18 | `fixed inset-0 z-30 flex justify-end bg-black/25` + `mt-[70px] mr-4 max-h-[420px] w-[78%] max-w-[300px] rounded-18 bg-surface-raised` |
| Mục tin | `flex gap-12`, padding 12 (PC) / `14px 0`; viền trên (PC) / dưới (Mobile) `#F0ECE4` | `flex gap-3 border-t border-border-card p-3` |
| Icon ô | 34×34 (PC) / 36×36, r10; **chưa đọc** nền `#FEF9C3`; **đã đọc** nền `#F0ECE4` + cả dòng `opacity .6` | `h-[34px] w-[34px] rounded-10 bg-warn-bg` / `bg-border-card` |
| Nội dung | 13 (PC) / 13.5 `#241B3A` lh 1.4; thời gian 11/11.5 `#B7AFC9` mt 4 | `text-13 leading-snug text-content-primary` · `mt-1 text-11 text-content-subtle` |
| Chấm chưa đọc | 7×7 (PC) / 8×8 tròn `#5B4FE8`, `margin-top 4` | `mt-1 h-[7px] w-[7px] shrink-0 rounded-pill bg-accent` |
| Chuông sidebar | M4a đã dựng, đang bất hoạt | thêm chấm báo khi có tin chưa đọc: `absolute -top-0.5 -right-0.5 h-2 w-2 rounded-pill bg-accent` |

**Chưa có trong mockup (tự quyết, ghi để soát):**
1. Panel **rỗng** → dòng "Chưa có thông báo nào." 13 muted.
2. Nút **"Đánh dấu đã đọc tất cả"** — cần thiết vì đang có 5 tin chưa đọc mà mockup không có cách nào
   đọc chúng. Đặt góc phải tiêu đề, ghost 12 `text-accent`.
3. **Bấm 1 tin = đánh dấu đã đọc** (`is_read = true`) — mockup chỉ vẽ 2 trạng thái, không nói cách chuyển.
   Không điều hướng đi đâu vì `notifications` không có cột link.
4. **Lối vào trên Mobile**: mockup 19 mở sheet từ chuông ở header Dashboard — mà Dashboard thuộc M6b.
   Tạm thêm route ẩn `/thong-bao` (không nằm trong `MENU`) để dùng và kiểm thật; M6b sẽ gắn chuông thật.

---

## 2. Kiến trúc

### 2.1 `settings.ts` (thuần)
```ts
export type CaiDat = {
  openrouter_api_key: string | null; openrouter_model: string | null
  new_words_per_day: number; tts_voice: string; low_queue_alert_enabled: boolean
}
export const MAC_DINH: CaiDat                       // §11: null · null · 5 · cmn-CN-Neural2-A · true
export const GIONG_TTS = ['cmn-CN-Neural2-A', 'cmn-CN-Neural2-B', 'cmn-CN-Neural2-C', 'cmn-CN-Neural2-D'] as const
export function docCaiDat(rows: { key: string; value: unknown }[]): CaiDat   // thiếu/sai kiểu → mặc định
export function anKhoa(khoa: string | null): string        // 'sk-or-v1-abc…3f2a' → 'sk-••••3f2a'; null → 'Chưa nhập'
export function chinhSoTuMoi(hienTai: number, delta: number): number         // kẹp 1..50
```
⚠️ `settings.value` là **`jsonb`** → ghi đúng kiểu JSON (số, boolean, chuỗi), KHÔNG bọc chuỗi.

### 2.2 `thongBao.ts` (thuần)
```ts
export type TinDb = { id: string; type: string; message: string; is_read: boolean; created_at: string }
export function thoiGianTuongDoi(iso: string, bayGio: Date): string   // "vừa xong" / "2 giờ trước" / "5 ngày trước"
export function demChuaDoc(ds: TinDb[]): number
```

### 2.3 Ghi DB
- Cài đặt: `supabase.from('settings').upsert({ key, value })` — **ghi ngay khi đổi** (mockup không có
  nút Lưu), hiện "Đã lưu" thoáng 1.5s; lỗi → dòng đỏ + "Thử lại".
- Thông báo: `select … order by created_at desc limit 20`; đọc: `update({ is_read: true })` theo `id`
  hoặc `.in('id', [...])` cho "tất cả".

### 2.4 Nút chuông (AppShell)
`AppShell` query `count` tin chưa đọc khi mount. Bấm chuông → PC mở panel tuyệt đối cạnh sidebar;
Mobile điều hướng `/thong-bao` (tạm, xem §1.2/4). Đóng panel PC khi bấm ra ngoài hoặc Esc.

---

## 3. Kế hoạch — 14 task (2–5 phút/task)

**Thuần (TDD từng cặp)**
- T1/T2 · `docCaiDat` (đủ key · thiếu key → mặc định · sai kiểu → mặc định) + `anKhoa` (dài · ngắn · null)
  + `chinhSoTuMoi` (kẹp 1..50). 8 ca.
- T3/T4 · `thoiGianTuongDoi` (30 giây · 2 giờ · 5 ngày · 3 tuần) + `demChuaDoc`. 6 ca.
- T5 · X-test: 2 file không import react/supabase/node.

**UI**
- T6 · `CaiDatPage` khung + nhóm "AI & OpenRouter" (ô nhập khoá `type=password` + nút Xoá, ô nhập model).
- T7 · Nhóm "Học tập" (stepper, select giọng TTS) + nhóm "Thông báo" (toggle).
- T8 · Ghi DB khi đổi + trạng thái "Đã lưu"/lỗi; nạp giá trị hiện có khi mount.
- T9 · `PanelThongBao` — danh sách, 2 trạng thái, "Đánh dấu đã đọc tất cả", trạng thái rỗng.
- T10 · Nối `AppShell`: chuông + chấm báo, mở panel PC; route ẩn `/thong-bao` cho Mobile.
- T11 · `App.tsx` — `/cai-dat` thành màn thật (bỏ stub), thêm `/thong-bao`.

**Kiểm**
- T12 · build · lint · test (159 + ~14).
- T13 · CDP: đổi từng cài đặt → đối chiếu bảng `settings` qua PostgREST · **nhập khoá OpenRouter vào app**
  rồi chứng minh `ai.ts` dùng khoá từ `settings` (tạm đổi tên biến env) · mở panel, đánh dấu đã đọc 1 tin
  + tất cả → đối chiếu `is_read` · chụp PC light/dark + Mobile.
- T14 · Dọn process · memory-bank MB-23 · soát checklist §4.

---

## 4. Checklist soát ở Bước 4 — đã soát ✅
(Bổ sung sau khi kiểm thật: ô Model chuyển từ `onBlur` sang nút "Lưu" tường minh — chi tiết MB-23/Q3.)

- [ ] Không hex trong component; chỉ utility Lớp 2; class Tailwind nguyên chuỗi.
- [ ] `settings.value` là `jsonb` — ghi đúng kiểu, không bọc chuỗi.
- [ ] Khoá hiện dạng `sk-••••3f2a`; ô nhập `type="password"`; có nút Xoá.
- [ ] Đổi cài đặt ghi ngay + phản hồi thị giác; lỗi có "Thử lại".
- [ ] Chấm báo đúng số chưa đọc; bấm tin → `is_read = true`; rỗng có dòng thông báo.
- [ ] 4 điểm tự quyết (§1.2) ghi đủ vào memory-bank.
- [ ] Sau khi nhập khoá ở Cài đặt, app gọi AI được **mà không cần `VITE_OPENROUTER_*`**.

---

## 5. PLAN chi tiết — code cụ thể từng task

> Ghi chú schema: `settings(key text primary key, value jsonb not null)` ⇒ ghi bằng
> `supabase.from('settings').upsert({ key, value })` (khoá chính là `key`, không cần `onConflict`).
> `value` **không nullable** ⇒ khoá chưa nhập lưu `null` **kiểu JSON** (`'null'::jsonb`), hợp lệ.

### T1 · RED `src/lib/settings.test.ts`
```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { anKhoa, chinhSoTuMoi, docCaiDat, MAC_DINH } from './settings.ts'

describe('docCaiDat', () => {
  it('đủ 5 key → đọc đúng kiểu', () => {
    expect(docCaiDat([
      { key: 'openrouter_api_key', value: 'sk-abc' },
      { key: 'openrouter_model', value: 'a/b' },
      { key: 'new_words_per_day', value: 7 },
      { key: 'tts_voice', value: 'cmn-CN-Neural2-C' },
      { key: 'low_queue_alert_enabled', value: false },
    ])).toEqual({
      openrouter_api_key: 'sk-abc', openrouter_model: 'a/b',
      new_words_per_day: 7, tts_voice: 'cmn-CN-Neural2-C', low_queue_alert_enabled: false,
    })
  })
  it('thiếu key → lấy mặc định §11', () => {
    expect(docCaiDat([])).toEqual(MAC_DINH)
  })
  it('sai kiểu (số lưu thành chuỗi) → mặc định, không để "5" chui xuống cron', () => {
    expect(docCaiDat([{ key: 'new_words_per_day', value: '7' }]).new_words_per_day).toBe(5)
    expect(docCaiDat([{ key: 'low_queue_alert_enabled', value: 'true' }]).low_queue_alert_enabled).toBe(true)
  })
  it('key lạ → bỏ qua', () => {
    expect(docCaiDat([{ key: 'linh_tinh', value: 1 }])).toEqual(MAC_DINH)
  })
})

describe('anKhoa', () => {
  it('khoá dài → sk-••••4 ký tự cuối', () => { expect(anKhoa('sk-or-v1-abcdef3f2a')).toBe('sk-••••3f2a') })
  it('khoá ngắn (<4) → chỉ dấu chấm', () => { expect(anKhoa('abc')).toBe('sk-••••') })
  it('null/rỗng → "Chưa nhập"', () => {
    expect(anKhoa(null)).toBe('Chưa nhập')
    expect(anKhoa('')).toBe('Chưa nhập')
  })
})

describe('chinhSoTuMoi', () => {
  it('kẹp trong 1..50', () => {
    expect([chinhSoTuMoi(5, 1), chinhSoTuMoi(1, -1), chinhSoTuMoi(50, 1)]).toEqual([6, 1, 50])
  })
})

describe('X-settings', () => {
  it('settings.ts thuần', () => {
    expect(readFileSync('src/lib/settings.ts', 'utf8')).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
```

### T2 · GREEN `src/lib/settings.ts`
```ts
/**
 * Cấu hình app (SPECIFICATION §11, DEC-17) — 5 key key-value, single-user nên không cần bảng phức tạp.
 * THUẦN: không đọc DB ở đây; `CaiDatPage` truyền `rows` vào.
 * ⚠️ `settings.value` là jsonb ⇒ giá trị phải đúng KIỂU JSON (số/boolean), không phải chuỗi —
 * `run_daily_maintenance()` đọc `new_words_per_day` như số, lưu "5" là cron so sánh hỏng.
 */
export type CaiDat = {
  openrouter_api_key: string | null
  openrouter_model: string | null
  new_words_per_day: number
  tts_voice: string
  low_queue_alert_enabled: boolean
}

export const GIONG_TTS = [
  'cmn-CN-Neural2-A', 'cmn-CN-Neural2-B', 'cmn-CN-Neural2-C', 'cmn-CN-Neural2-D',
] as const

export const MAC_DINH: CaiDat = {
  openrouter_api_key: null,
  openrouter_model: null,
  new_words_per_day: 5,
  tts_voice: 'cmn-CN-Neural2-A',
  low_queue_alert_enabled: true,
}

export const MIN_TU_MOI = 1
export const MAX_TU_MOI = 50

export function docCaiDat(rows: { key: string; value: unknown }[]): CaiDat {
  const m = new Map(rows.map((r) => [r.key, r.value]))
  const chuoi = (k: string, md: string | null) => {
    const v = m.get(k)
    return typeof v === 'string' && v !== '' ? v : md
  }
  const so = m.get('new_words_per_day')
  const bat = m.get('low_queue_alert_enabled')
  return {
    openrouter_api_key: chuoi('openrouter_api_key', MAC_DINH.openrouter_api_key),
    openrouter_model: chuoi('openrouter_model', MAC_DINH.openrouter_model),
    new_words_per_day: typeof so === 'number' ? so : MAC_DINH.new_words_per_day,
    tts_voice: chuoi('tts_voice', MAC_DINH.tts_voice) ?? MAC_DINH.tts_voice,
    low_queue_alert_enabled: typeof bat === 'boolean' ? bat : MAC_DINH.low_queue_alert_enabled,
  }
}

/** Hiện khoá theo mockup 17: `sk-••••3f2a` — không bao giờ hiện đủ khoá trên màn hình. */
export function anKhoa(khoa: string | null): string {
  if (!khoa) return 'Chưa nhập'
  return khoa.length >= 4 ? `sk-••••${khoa.slice(-4)}` : 'sk-••••'
}

export function chinhSoTuMoi(hienTai: number, delta: number): number {
  return Math.min(MAX_TU_MOI, Math.max(MIN_TU_MOI, hienTai + delta))
}
```

### T3 · RED `src/lib/thongBao.test.ts`
```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { demChuaDoc, thoiGianTuongDoi } from './thongBao.ts'

const BAY_GIO = new Date('2026-09-18T10:00:00+07:00')
const truoc = (ms: number) => new Date(BAY_GIO.getTime() - ms).toISOString()

describe('thoiGianTuongDoi', () => {
  it('30 giây → "vừa xong"', () => { expect(thoiGianTuongDoi(truoc(30_000), BAY_GIO)).toBe('vừa xong') })
  it('2 giờ', () => { expect(thoiGianTuongDoi(truoc(2 * 3600_000), BAY_GIO)).toBe('2 giờ trước') })
  it('5 ngày', () => { expect(thoiGianTuongDoi(truoc(5 * 86400_000), BAY_GIO)).toBe('5 ngày trước') })
  it('3 tuần', () => { expect(thoiGianTuongDoi(truoc(21 * 86400_000), BAY_GIO)).toBe('3 tuần trước') })
  it('45 phút', () => { expect(thoiGianTuongDoi(truoc(45 * 60_000), BAY_GIO)).toBe('45 phút trước') })
})

describe('demChuaDoc', () => {
  it('đếm đúng', () => {
    expect(demChuaDoc([
      { id: '1', type: 'low_queue', message: 'a', is_read: false, created_at: truoc(0) },
      { id: '2', type: 'low_queue', message: 'b', is_read: true, created_at: truoc(0) },
    ])).toBe(1)
  })
})

describe('X-thongBao', () => {
  it('thongBao.ts thuần', () => {
    expect(readFileSync('src/lib/thongBao.ts', 'utf8')).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
```

### T4 · GREEN `src/lib/thongBao.ts`
```ts
/** Thông báo trong app (§5.2, DEC-16) — hiện tại chỉ có `type = 'low_queue'` do cron sinh. */
export type TinDb = {
  id: string; type: string; message: string; is_read: boolean; created_at: string
}

/** "2 giờ trước" theo mockup 18. `bayGio` truyền vào để test được (không đọc đồng hồ bên trong). */
export function thoiGianTuongDoi(iso: string, bayGio: Date): string {
  const giay = Math.max(0, Math.floor((bayGio.getTime() - new Date(iso).getTime()) / 1000))
  if (giay < 60) return 'vừa xong'
  const phut = Math.floor(giay / 60)
  if (phut < 60) return `${phut} phút trước`
  const gio = Math.floor(phut / 60)
  if (gio < 24) return `${gio} giờ trước`
  const ngay = Math.floor(gio / 24)
  if (ngay < 7) return `${ngay} ngày trước`
  const tuan = Math.floor(ngay / 7)
  if (tuan < 5) return `${tuan} tuần trước`
  return `${Math.floor(ngay / 30)} tháng trước`
}

export function demChuaDoc(ds: TinDb[]): number {
  return ds.filter((t) => !t.is_read).length
}
```

### T5 · `npm test` — 2 X-test xanh.

### T6 · `src/features/settings/CaiDatPage.tsx` — khung + nhóm AI
```tsx
/**
 * Màn Cài đặt (mockup 17 PC / 18 Mobile, SPECIFICATION §11). Ghi NGAY khi đổi — mockup không có nút Lưu.
 * Khoá OpenRouter lưu vào bảng `settings` ⇒ sau khi nhập ở đây, có thể XOÁ `VITE_OPENROUTER_*`
 * khỏi `.env.local` (ai.ts ưu tiên `settings`, MB-22/Q1).
 */
const HANG = 'flex items-center justify-between gap-3 rounded-10 border border-border-card bg-surface-card px-4 py-3'
const NHAN_NHOM = 'mb-3 text-12 font-bold uppercase tracking-[0.04em] text-content-muted'

export default function CaiDatPage() {
  const [cd, setCd] = useState<CaiDat | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [daLuu, setDaLuu] = useState(false)
  const [nhapKhoa, setNhapKhoa] = useState('')     // ô nhập tạm, không hiện khoá cũ
  useEffect(() => { void nap() }, [])

  async function nap() {
    const { data, error } = await supabase.from('settings').select('key, value')
    if (error) return setLoi(error.message)
    setCd(docCaiDat((data ?? []) as { key: string; value: unknown }[]))
  }
  async function ghi<K extends keyof CaiDat>(key: K, value: CaiDat[K]) {
    setCd((c) => (c ? { ...c, [key]: value } : c))
    const { error } = await supabase.from('settings').upsert({ key, value })
    if (error) return setLoi(error.message)
    setLoi(null); setDaLuu(true); setTimeout(() => setDaLuu(false), 1500)
  }
  // Nhóm AI: hàng "API key" → hiện anKhoa(cd.openrouter_api_key) + ô <input type="password"> + nút "Lưu"/"Xoá"
  //          hàng "Model chấm điểm" → <input> text, onBlur ghi
}
```

### T7 · Nhóm "Học tập" + "Thông báo"
```tsx
// Số từ mới/ngày — stepper theo mockup
<div className={HANG}>
  <span className="text-14 text-content-nav">Số từ mới/ngày</span>
  <div className="flex items-center gap-3">
    <button type="button" aria-label="Giảm" onClick={() => void ghi('new_words_per_day', chinhSoTuMoi(cd.new_words_per_day, -1))}
      className="h-7 w-7 rounded-8 bg-border-card font-bold text-content-nav">−</button>
    <span className="font-bold text-content-primary">{cd.new_words_per_day}</span>
    <button type="button" aria-label="Tăng" onClick={() => void ghi('new_words_per_day', chinhSoTuMoi(cd.new_words_per_day, 1))}
      className="h-7 w-7 rounded-8 bg-border-card font-bold text-content-nav">+</button>
  </div>
</div>

// Giọng đọc TTS — select native (0 package); nút nghe thử để M6c
<select value={cd.tts_voice} onChange={(e) => void ghi('tts_voice', e.target.value)}
  className="rounded-8 bg-transparent text-14 font-semibold text-content-primary">
  {GIONG_TTS.map((g) => <option key={g} value={g}>{g.replace('cmn-CN-Neural2-', 'Neural2-')}</option>)}
</select>

// Toggle cảnh báo — track 36×20 theo mockup
<button type="button" role="switch" aria-checked={cd.low_queue_alert_enabled}
  onClick={() => void ghi('low_queue_alert_enabled', !cd.low_queue_alert_enabled)}
  className={`relative h-5 w-9 rounded-pill transition-colors ${cd.low_queue_alert_enabled ? 'bg-accent' : 'bg-border-subtle'}`}>
  <span className={`absolute top-0.5 h-4 w-4 rounded-pill bg-white transition-all ${cd.low_queue_alert_enabled ? 'right-0.5' : 'left-0.5'}`} />
</button>
```

### T8 · Trạng thái lưu/lỗi + skeleton khi đang nạp
- `daLuu` → dòng "Đã lưu" 12 `text-success-text` cạnh tiêu đề nhóm, tự tắt 1.5s.
- `loi` → card `bg-danger-bg text-danger-text` + nút "Thử lại" gọi `nap()`.
- `cd === null` → 3 khối skeleton `animate-pulse` đúng shape.

### T9 · `src/features/notifications/PanelThongBao.tsx`
```tsx
/**
 * Panel Thông báo (mockup 18 PC — xổ cạnh sidebar; 19 Mobile — sheet phủ bên phải).
 * Tự quyết ngoài mockup (DESIGN §1.2): trạng thái rỗng · nút "Đánh dấu đã đọc tất cả" ·
 * bấm 1 tin = đánh dấu đã đọc (bảng notifications không có cột link nên không điều hướng).
 */
type Props = { dang: 'pc' | 'mobile'; onDong: () => void; onDoiSoChuaDoc?: (n: number) => void }
// tải: supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
// đọc 1: update({ is_read: true }).eq('id', id)  · đọc tất cả: .in('id', chuaDoc.map(t => t.id))
// icon: Icon 'canh-bao' 18 trong ô 34×34 rounded-10; chưa đọc bg-warn-bg text-warn-text, đã đọc bg-border-card text-content-muted
// mỗi mục: <button> cả dòng, className `flex w-full gap-3 border-t border-border-card p-3 text-left ${t.is_read ? 'opacity-60' : ''}`
```

### T10 · `AppShell` — chuông hoạt động
```tsx
const [soChuaDoc, setSoChuaDoc] = useState(0)
const [moPanel, setMoPanel] = useState(false)
useEffect(() => { void (async () => {
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false)
  setSoChuaDoc(count ?? 0)
})() }, [])
// nút chuông: bỏ aria-disabled/opacity-60 → onClick: PC setMoPanel(true) · Mobile navigate('/thong-bao')
// chấm báo: {soChuaDoc > 0 && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-pill bg-accent" />}
// panel PC: {moPanel && <PanelThongBao dang="pc" onDong={() => setMoPanel(false)} onDoiSoChuaDoc={setSoChuaDoc} />}
//   bọc trong div relative (mục chuông đã có `relative` từ mockup)
// Esc/bấm ra ngoài: onKeyDown Escape + overlay trong suốt `fixed inset-0` z-10 dưới panel
```

### T11 · `App.tsx`
```tsx
<Route path="/cai-dat" element={<CaiDatPage />} />
<Route path="/thong-bao" element={<TrangThongBao />} />   // route ẨN (không có trong MENU), tạm cho Mobile
{MENU.filter((m) => !['/import', '/on-tap', '/cai-dat'].includes(m.path)).map(...)}
```
`TrangThongBao` = wrapper mỏng render `<PanelThongBao dang="mobile" onDong={() => navigate(-1)} />`.

### T12 · `npm run build` · `npm run lint` · `npm test` (kỳ vọng ~173).

### T13 · Kiểm thật (CDP)
1. `/cai-dat`: đổi số từ mới 5 → 7 (stepper), đổi giọng TTS, tắt toggle cảnh báo, nhập model
   → đối chiếu `settings` qua PostgREST, **kiểm đúng KIỂU jsonb** (`7` là number, `false` là boolean).
2. Nhập **khoá OpenRouter thật** vào ô API key → hàng hiện `sk-••••xxxx`; đối chiếu DB.
3. **Chứng minh app dùng khoá từ `settings`**: tạm đổi `VITE_OPENROUTER_API_KEY` thành giá trị rác
   trong `.env.local`, khởi động lại dev server, gọi `giaiThichBai` trên 1 bài chưa cache → vẫn chạy
   (vì `settings` được ưu tiên). Trả biến env về như cũ sau khi kiểm.
4. Panel Thông báo: chấm báo hiện đúng 5 → bấm 1 tin → còn 4 (đối chiếu `is_read`) → "Đánh dấu đã đọc
   tất cả" → 0, chấm báo biến mất; reload vẫn 0.
5. Chụp `m6a-caidat.png` (PC light + dark), `m6a-thongbao-pc.png`, `m6a-caidat-mobile.png`,
   `m6a-thongbao-mobile.png`.

### T14 · Dọn process · cập nhật `activeContext`/`progress`/`decisionLog` (MB-23) · soát checklist §4.
