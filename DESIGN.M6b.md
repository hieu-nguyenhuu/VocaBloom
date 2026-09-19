# DESIGN.md — M6b: Dashboard + Khu vườn

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản M6a (đã lưu ở `DESIGN.M6a.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-18 · Trạng thái: **✅ HOÀN THÀNH 2026-09-18 — test 195/195, CDP 20/20**

---

## 0. Phạm vi (chốt ở Brainstorm 2026-09-18)

**Làm:** màn Dashboard (mockup `01 · Dashboard` PC + Mobile) — thay `Stub` ở route `/`.
- `src/lib/dashboard.ts` — module **thuần** (TDD): lời chào theo giờ, ngày đầy đủ, tính streak,
  dải 7 ngày, gom số liệu khu vườn.
- `src/features/dashboard/DashboardPage.tsx` — header + streak + 2 thẻ + 2 CTA + Khu vườn +
  "Vừa ôn gần đây".
- Gắn **chuông Thông báo** vào header Dashboard trên Mobile (M6a mới chỉ có route ẩn `/thong-bao`).

**KHÔNG làm:** TTS (M6c) · màn "Ôn theo chủ đề" (M7 — nút vẫn hiện nhưng **vô hiệu hoá**) ·
màn Quản lý từ vựng (vẫn stub) · nút Đăng xuất (chưa có mockup).

**0 package mới.**

**Dữ liệu thật hôm nay (18/9) để đối chiếu khi kiểm:** 1 đến hạn + 4 quá hạn · streak 3 ngày
(16–18/9) · khu vườn: new 0, stage1 5, stage2 0, stage3 0, intensive 1, mastered 3 · 9 từ đã ôn.

---

## 1. Ba điểm người dùng chốt ở Brainstorm

1. **Tên hiển thị = "Helios"** → "Chào buổi sáng, Helios". Để **hằng số** `TEN_NGUOI_DUNG` trong
   `dashboard.ts` (một chỗ duy nhất, đổi dễ); KHÔNG thêm key DB, KHÔNG thêm ô nhập ở Cài đặt (YAGNI).
2. **Khu vườn hiện đủ 6 chip** kể cả stage đang 0 từ — để thấy toàn cảnh tiến trình.
3. **Dải 7 ngày hiện ở CẢ PC lẫn Mobile.** Mockup PC chỉ vẽ badge streak; đây là **yêu cầu mở rộng
   của người dùng** (ghi rõ để sau này không nhầm là tôi tự ý thêm). Là **7 ngày gần nhất**, ô cuối
   cùng = hôm nay.

Ngoài ra, các quyết định đã chốt từ Brainstorm M6 (người dùng "đồng ý với 5 đề xuất"):
- Streak = số ngày liên tiếp có bản ghi `review_log`, đếm lùi từ hôm nay; nếu hôm nay chưa ôn thì
  bắt đầu đếm từ hôm qua (chuỗi không bị coi là đứt giữa ngày).
- "Ôn theo chủ đề" render nhưng vô hiệu hoá tới M7.
- Khu vườn dùng **2 truy vấn tách bạch** (xem §3.2).

---

## 2. Số liệu trích từ mockup (màn `01 · Dashboard`)

### 2.1 Header
| Phần | Mockup PC / Mobile | Utility Lớp 2 |
|---|---|---|
| Lời chào | Baloo 28 / 22, 700, `#241B3A` | `font-display text-22 md:text-28 font-bold text-content-primary` |
| Ngày | 14 / 13, `#8B8593`, mt 6/4 — dạng "Thứ Năm, 16 tháng 7" | `mt-1 text-13 md:text-14 text-content-muted` |
| Badge streak (PC) | nền `#FCE4F1`, pill, padding `9px 18px`; icon lửa 16 `fill #E0449E`; chữ 13.5/700 `#A21467` | `inline-flex items-center gap-2 rounded-pill bg-award-bg px-[18px] py-2.5 text-13 font-bold text-award-text` |
| Chuông (Mobile) | icon 22 `#4A4458`; chấm chưa đọc 8px `#5B4FE8` + viền trắng 2px, góc trên phải | `relative` + chấm `absolute right-0.5 top-0.5 h-2 w-2 rounded-pill bg-accent ring-2 ring-surface-page` |

### 2.2 Dải 7 ngày (mockup Mobile; M6b dùng cho cả 2 breakpoint)
- Khung: nền `#FCE4F1`, r16, padding `14px 16px`. Hàng trên = badge streak (icon lửa + "Chuỗi N ngày"),
  hàng dưới = 7 ô `justify-between`.
- Ô 26×26 tròn:
  - **đã ôn** → nền `#E0449E` + dấu ✓ trắng 13 (`stroke-width 2.4`, path `M5 12l5 5L19 7`);
  - **hôm nay chưa ôn** → nền trắng + viền 2px `#E0449E` + icon lửa 12 fill `#E0449E`;
  - **quá khứ chưa ôn** → *(mockup không vẽ — tôi tự quyết)* nền trắng + viền 1px `#E0449E` `opacity-40`.
- Nhãn thứ (T2…CN): 10.5/600 `#A21467`; hôm nay in đậm 700.

### 2.3 Thân trang
| Phần | Mockup | Utility Lớp 2 |
|---|---|---|
| Thẻ "Đến hạn hôm nay" | nền `#EDEBFC` r16 p20/16; nhãn 13/12.5 `#5B4FE8` 600; số Baloo 36/30 700 | `flex-1 rounded-16 bg-accent-tint p-5` · `text-13 font-semibold text-accent` · `font-display text-30 md:text-36 font-bold text-content-primary` |
| Thẻ "Quá hạn" | nền `#FEF9C3`, nhãn `#946200` — **giọng bình thản, KHÔNG dùng đỏ** (`UI_DESIGN` §8.1 / DEC-08) | `bg-warn-bg` · `text-warn-text` |
| CTA chính | `#5B4FE8`, p16, r14, 15.5/600 — "Bắt đầu ôn tập · N từ" | `rounded-14 bg-accent py-4 text-15 font-semibold text-white` |
| CTA phụ | `#E3F4FD` / chữ `#0369A1` 14.5/600 — "Ôn theo chủ đề" | `bg-secondary-tint text-secondary` + **disabled** (`aria-disabled`, `opacity-60`, title "Sẽ có ở M7") |
| Card Khu vườn | nền `#FBFAF6`, viền `#F0ECE4`, r18, p22/18; tiêu đề 15/700; 6 chip `justify-between` | `rounded-18 border border-border-card bg-surface-card p-5` |
| Chip stage | tròn 42×42, nền tint theo stage `#FEE2E2 #FFEDD5 #FEF9C3 #ECFCCB #DCFCE7 #DCFCE7`; `IconCay` 20 màu ring tương ứng; số 11/600 `#4A4458` phía dưới | `h-[42px] w-[42px] rounded-pill` + `IconCay` |
| "Vừa ôn gần đây" | card riêng; ring 56 (PC, r=24, sw 4) / 52 (Mobile, r=22, sw 4); track `#F0ECE4`; **giữa ring là CHỮ HÁN** 11/10.5 Noto 600 `#4A4458` — khác ring của Player (vốn đặt icon cây) | `Ring` với prop `noiDung` |

**Điểm tôi tự quyết (ghi ra để soát ở Bước 4):**
- Kiểu ô "quá khứ chưa ôn" của dải 7 ngày (mockup không có trạng thái này).
- Trạng thái rỗng (chưa import từ nào): 2 thẻ vẫn hiện số 0, thay 2 CTA bằng dòng
  "Chưa có từ nào — hãy Import từ vựng" + nút tới `/import`.
- Skeleton khi đang tải (tái dùng pattern `animate-pulse bg-surface-sunken` của màn Cài đặt).

---

## 3. Kiến trúc

### 3.1 `src/lib/dashboard.ts` — thuần, có test (TDD)
```ts
export const TEN_NGUOI_DUNG = 'Helios'   // chốt M6b/Q1 — đổi tên ở đúng 1 chỗ này

export function loiChao(gio: number): string
// <11 → 'Chào buổi sáng' · <18 → 'Chào buổi chiều' · còn lại 'Chào buổi tối'

export function ngayDayDu(iso: string): string
// '2026-09-18' → 'Thứ Sáu, 18 tháng 9'  (tự map, không phụ thuộc locale máy)

export function tinhStreak(ngayCoLog: Set<string>, homNay: string): number
// đếm lùi; nếu hôm nay chưa có log thì bắt đầu từ hôm qua

export function dai7Ngay(ngayCoLog: Set<string>, homNay: string):
  { ngay: string; thu: string; daOn: boolean; laHomNay: boolean }[]
// đúng 7 phần tử, phần tử cuối = hôm nay

export function gomKhuVuon(rows: { stage: string }[]):
  { stage: StageCay; so: number }[]
// LUÔN đủ 6 phần tử theo thứ tự new→stage1→stage2→stage3→intensive→mastered
```
Ngày giờ: dùng lại `homNayVN()` và `dinhDangNgayVN()` đã có trong `src/lib/player.ts`.
`player.ts` **chưa có** hàm cộng/trừ ngày ⇒ `dashboard.ts` tự thêm `luiNgay(iso, n)` (thuần, có test).

### 3.2 Truy vấn — 4 query độc lập, chạy song song `Promise.all`
```ts
// 1) Đến hạn / quá hạn  (so với ngày VN hôm nay)
word_state: select next_review_date  where stage <> 'mastered' and next_review_date <= homNay
//    → đúng hạn = (= homNay) · quá hạn = (< homNay)

// 2) Khu vườn — ĐẾM theo stage; màu chip là màu TƯỢNG TRƯNG cho stage
word_state: select stage

// 3) Vừa ôn gần đây — ring vẽ theo total_points THẬT của từng từ
word_state: select vocab_id, total_points, stage, vocab(word)
            order by last_reviewed_at desc  limit 10

// 4) Streak + dải 7 ngày
review_log: select reviewed_at where reviewed_at >= (homNay - 30 ngày)
            → quy về ngày giờ VN rồi đưa vào Set<string>
```
⚠️ **Quy tắc `UI_DESIGN` §8.1 — 2 nguồn màu KHÔNG được trộn:** chip khu vườn tô theo **stage**
(ý nghĩa tượng trưng), còn ring "Vừa ôn gần đây" tô theo **`total_points` thật** (0–30 → `--ring-0..5`).
Vì vậy cố tình tách query (2) và (3) thay vì gộp làm một.

Lỗi bất kỳ query nào → card đỏ + nút "Thử lại" (tái dùng pattern của `CaiDatPage`).

### 3.3 `Ring` — thêm biến thể nội dung
`src/features/player/Ring.tsx` (M4a) hiện luôn vẽ `IconCay` ở giữa. Thêm prop tuỳ chọn
`noiDung?: ReactNode` để Dashboard truyền chữ Hán; không truyền thì giữ nguyên `IconCay`
⇒ Player **không đổi hành vi**.
Ring vẽ trong `viewBox 0 0 60` (r=26, sw=5) rồi co theo `size`, nên `size={56}`/`{52}` cho ra
r≈24/22.5 và sw≈4.7/4.3 — khớp số liệu mockup 01 trong sai số làm tròn, KHÔNG cần sửa hình học.

### 3.4 Icon bổ sung trong `src/components/icons.tsx`
- `streak` — ngọn lửa **fill** (cùng path với icon `an-mung` sẵn có, nhưng `fill="currentColor" stroke="none"`).
- `tick` — dấu ✓, path `M5 12l5 5L19 7`, `stroke-width 2.4`.

### 3.5 Route
`/` trong `src/App.tsx` đang trỏ `Stub` → đổi sang `DashboardPage` (vẫn nằm trong `AppShell`).

---

## 4. Kế hoạch — 14 task nhỏ (2–5 phút/task)

**Nhóm A — logic thuần, theo đúng RED → GREEN → REFACTOR**
| # | Task | Ca kiểm |
|---|---|---|
| T1 | RED: test `loiChao` + `ngayDayDu` + `TEN_NGUOI_DUNG` | 8h/14h/21h; '2026-09-18' → 'Thứ Sáu, 18 tháng 9' |
| T2 | GREEN: viết 3 hàm trên | |
| T3 | RED: test `tinhStreak` | liên tiếp tới hôm nay · hôm nay chưa ôn nhưng hôm qua có · đứt quãng ở giữa · rỗng → 0 · dữ liệu thật 16–18/9 → 3 |
| T4 | GREEN: `tinhStreak` | |
| T5 | RED: test `dai7Ngay` + `gomKhuVuon` | đúng 7 ô · ô cuối là hôm nay · cờ `daOn`/`laHomNay` · khu vườn luôn đủ 6 stage kể cả 0 · đúng thứ tự |
| T6 | GREEN: 2 hàm trên | |
| T7 | X-test: `dashboard.ts` không import react/supabase/node | |

**Nhóm B — UI**
| # | Task |
|---|---|
| T8 | `icons.tsx`: thêm `streak` (lửa fill) + `tick` |
| T9 | `Ring.tsx`: thêm prop `noiDung`; xác nhận Player không đổi (build + so ảnh cũ) |
| T10 | `DashboardPage`: header (lời chào / ngày / badge PC / chuông Mobile) + dải 7 ngày |
| T11 | 2 thẻ đến hạn–quá hạn + 2 CTA (CTA phụ vô hiệu hoá) + trạng thái rỗng |
| T12 | Card Khu vườn (6 chip) + "Vừa ôn gần đây" (ring chữ Hán) + skeleton khi tải |

**Nhóm C — kiểm chứng & dọn**
| # | Task |
|---|---|
| T13 | `npm run build` · lint · `npm test` (176 + ~20 ca mới) · **CDP thật**: đối chiếu số đến hạn/quá hạn/streak/khu vườn với PostgREST · chuông Mobile mở `/thong-bao` · CTA chính điều hướng `/on-tap` · CTA phụ KHÔNG điều hướng · chụp PC light+dark và Mobile, so với mockup |
| T14 | Dừng mọi process nền của phiên · cập nhật `memory-bank/` (MB-24) · soát checklist §5 |

---

## 5. Checklist tự soát ở Bước 4
- [ ] Không có hex trong component; chỉ dùng utility Lớp 2; class Tailwind viết nguyên chuỗi.
- [ ] **2 nguồn màu tách bạch**: chip khu vườn theo stage (tượng trưng) · ring "Vừa ôn" theo
      `total_points` thật — không gộp chung query (`UI_DESIGN` §8.1).
- [ ] Ring vẽ bằng `stroke-dasharray` đúng tỉ lệ `min(total_points, 30) / 30`; giữa ring là **chữ Hán**,
      không phải icon cây.
- [ ] Khu vườn đủ 6 chip kể cả stage 0 từ; dải 7 ngày đủ 7 ô ở **cả PC lẫn Mobile**.
- [ ] Thẻ "Quá hạn" dùng tint vàng, tuyệt đối không dùng đỏ (giọng nhẹ nhàng — DEC-08).
- [ ] CTA "Ôn theo chủ đề" vô hiệu hoá, bấm không điều hướng.
- [ ] `Ring` thêm prop nhưng Player giữ nguyên giao diện & hành vi.
- [ ] Số liệu trên màn khớp 100% với truy vấn PostgREST tại thời điểm kiểm.

---

## 6. PLAN chi tiết — code cụ thể từng task
> Trạng thái: **✅ ĐÃ THỰC THI XONG 2026-09-18.** Đã đối chiếu code thật trước khi viết plan:
> - `Icon` nhận `...rest` **sau cùng** ⇒ đổi được `fill`/`stroke`/`strokeWidth` từ ngoài. Path `an-mung`
>   **trùng nguyên văn** ngọn lửa của mockup 01 ⇒ **không cần thêm icon lửa**, chỉ thêm `tick`.
> - Tint khu vườn của mockup trùng khít token có sẵn: `#FEE2E2`=`danger-bg`, `#FFEDD5`=`tint-orange`,
>   `#FEF9C3`=`warn-bg`, `#ECFCCB`=`tint-lime`, `#DCFCE7`=`success-bg`; màu icon = `ring-0..5`.
> - `player.ts` có `homNayVN`, `mocRing`; `dinhDangNgayVN` cho ra "Thứ Năm, 17/9" — **khác** định dạng
>   Dashboard cần ("Thứ Năm, 16 tháng 7") ⇒ viết `ngayDayDu` riêng.
> - PC bố cục 2 cột `flex:1.4` / `flex:1`, gap 28; badge streak ở góc phải header.

### T1 · RED `src/lib/dashboard.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import {
  dai7Ngay, demDenHan, gioVN, gomKhuVuon, loiChao, luiNgay,
  ngayCoOn, ngayDayDu, TEN_NGUOI_DUNG, tinhStreak,
} from './dashboard.ts'

const tap = (...ngay: string[]) => new Set(ngay)

describe('lời chào & ngày', () => {
  it('chào theo khung giờ', () => {
    expect(loiChao(8)).toBe('Chào buổi sáng')
    expect(loiChao(10)).toBe('Chào buổi sáng')
    expect(loiChao(11)).toBe('Chào buổi chiều')
    expect(loiChao(14)).toBe('Chào buổi chiều')
    expect(loiChao(18)).toBe('Chào buổi tối')
    expect(loiChao(23)).toBe('Chào buổi tối')
  })
  it('gioVN lấy giờ Việt Nam bất kể múi giờ máy', () => {
    // 2026-09-18T01:30Z = 08:30 giờ VN
    expect(gioVN(new Date('2026-09-18T01:30:00Z'))).toBe(8)
    // 2026-09-18T17:00Z = 00:00 hôm sau giờ VN → phải là 0, KHÔNG phải 24
    expect(gioVN(new Date('2026-09-18T17:00:00Z'))).toBe(0)
  })
  it('ngày đầy đủ theo mockup 01', () => {
    expect(ngayDayDu('2026-07-16')).toBe('Thứ Năm, 16 tháng 7')
    expect(ngayDayDu('2026-09-18')).toBe('Thứ Sáu, 18 tháng 9')
  })
  it('tên người dùng cố định', () => expect(TEN_NGUOI_DUNG).toBe('Helios'))
  it('luiNgay qua mốc đầu tháng', () => {
    expect(luiNgay('2026-09-01', 1)).toBe('2026-08-31')
    expect(luiNgay('2026-01-01', 1)).toBe('2025-12-31')
    expect(luiNgay('2026-09-18', 0)).toBe('2026-09-18')
  })
})

describe('tinhStreak', () => {
  it('liên tiếp tới hôm nay', () =>
    expect(tinhStreak(tap('2026-09-16', '2026-09-17', '2026-09-18'), '2026-09-18')).toBe(3))
  it('hôm nay chưa ôn nhưng hôm qua có → chuỗi chưa đứt', () =>
    expect(tinhStreak(tap('2026-09-16', '2026-09-17'), '2026-09-18')).toBe(2))
  it('đứt quãng ở giữa → chỉ đếm đoạn gần nhất', () =>
    expect(tinhStreak(tap('2026-09-10', '2026-09-17', '2026-09-18'), '2026-09-18')).toBe(2))
  it('nghỉ 2 ngày → 0', () =>
    expect(tinhStreak(tap('2026-09-15', '2026-09-16'), '2026-09-18')).toBe(0))
  it('chưa ôn bao giờ → 0', () => expect(tinhStreak(tap(), '2026-09-18')).toBe(0))
})

describe('dai7Ngay', () => {
  const d = dai7Ngay(tap('2026-09-16', '2026-09-17', '2026-09-18'), '2026-09-18')
  it('đúng 7 ô, ô cuối là hôm nay', () => {
    expect(d).toHaveLength(7)
    expect(d[6]!.ngay).toBe('2026-09-18')
    expect(d[0]!.ngay).toBe('2026-09-12')
  })
  it('chỉ 1 ô laHomNay', () => expect(d.filter((o) => o.laHomNay)).toHaveLength(1))
  it('cờ daOn đúng', () => expect(d.map((o) => o.daOn)).toEqual([false, false, false, false, true, true, true]))
  it('nhãn thứ ngắn', () => expect(d.map((o) => o.thu)).toEqual(['T7', 'CN', 'T2', 'T3', 'T4', 'T5', 'T6']))
})

describe('gomKhuVuon', () => {
  it('luôn đủ 6 stage kể cả 0 từ, đúng thứ tự (chốt M6b/Q2)', () => {
    const v = gomKhuVuon([{ stage: 'stage1' }, { stage: 'stage1' }, { stage: 'mastered' }])
    expect(v.map((x) => x.stage)).toEqual(['new', 'stage1', 'stage2', 'stage3', 'intensive', 'mastered'])
    expect(v.map((x) => x.so)).toEqual([0, 2, 0, 0, 0, 1])
  })
  it('bỏ qua stage lạ, không ném lỗi', () =>
    expect(gomKhuVuon([{ stage: 'linh_tinh' }]).reduce((s, x) => s + x.so, 0)).toBe(0))
})

describe('demDenHan', () => {
  it('tách đúng hạn / quá hạn, bỏ qua NULL (hàng đợi từ mới)', () => {
    const r = demDenHan(
      [
        { next_review_date: '2026-09-18' },
        { next_review_date: '2026-09-15' },
        { next_review_date: '2026-09-17' },
        { next_review_date: null },
      ],
      '2026-09-18',
    )
    expect(r).toEqual({ dungHan: 1, quaHan: 2, tong: 3 })
  })
})

describe('ngayCoOn', () => {
  it('quy timestamptz về ngày GIỜ VIỆT NAM', () => {
    // 2026-09-17T17:30Z = 00:30 ngày 18/9 giờ VN → phải tính là ngày 18
    const s = ngayCoOn([{ reviewed_at: '2026-09-17T17:30:00Z' }, { reviewed_at: '2026-09-17T10:00:00Z' }])
    expect([...s].sort()).toEqual(['2026-09-17', '2026-09-18'])
  })
})
```
`npm test` → **RED** (chưa có file `dashboard.ts`).

### T2 · GREEN `src/lib/dashboard.ts`
```ts
import { homNayVN } from './player.ts'
import type { Stage } from './srs.ts'

/**
 * Logic thuần của Dashboard (M6b). Chỉ import player.ts/srs.ts — không React, không Supabase,
 * không tự đọc đồng hồ (Date tiêm từ ngoài) để test được.
 */

/** Tên hiển thị ở lời chào — chốt M6b/Q1. App 1 người dùng nên để hằng số, không thêm key DB. */
export const TEN_NGUOI_DUNG = 'Helios'

const TZ = 'Asia/Ho_Chi_Minh'
const THU_DAY = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const

/** Giờ 0–23 theo VN. `hourCycle: 'h23'` để nửa đêm ra 0 chứ không ra 24. */
export function gioVN(now: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(now),
  )
}

export function loiChao(gio: number): string {
  if (gio < 11) return 'Chào buổi sáng'
  if (gio < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

const tach = (iso: string) => iso.split('-').map(Number) as [number, number, number]
const thuCua = (iso: string) => {
  const [y, m, d] = tach(iso)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** "Thứ Năm, 16 tháng 7" — header mockup 01 (khác `dinhDangNgayVN` của màn Tổng kết). */
export function ngayDayDu(iso: string): string {
  const [, m, d] = tach(iso)
  return `${THU_DAY[thuCua(iso)]}, ${d} tháng ${m}`
}

/** Lùi `n` ngày trên lịch (UTC thuần, không dính DST vì VN không có DST). */
export function luiNgay(iso: string, n: number): string {
  const [y, m, d] = tach(iso)
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10)
}

/** Tập ngày (giờ VN) đã ôn, rút từ `review_log.reviewed_at`. */
export function ngayCoOn(rows: readonly { reviewed_at: string }[]): Set<string> {
  return new Set(rows.map((r) => homNayVN(new Date(r.reviewed_at))))
}

/**
 * Chuỗi ngày liên tiếp. Đếm lùi từ hôm nay; nếu hôm nay CHƯA ôn thì bắt đầu từ hôm qua —
 * chuỗi không bị coi là đứt chỉ vì trời mới sáng (chốt Brainstorm M6).
 */
export function tinhStreak(ngayCoLog: ReadonlySet<string>, homNay: string): number {
  let moc = ngayCoLog.has(homNay) ? homNay : luiNgay(homNay, 1)
  let n = 0
  while (ngayCoLog.has(moc)) {
    n += 1
    moc = luiNgay(moc, 1)
  }
  return n
}

export type ODai = { ngay: string; thu: string; daOn: boolean; laHomNay: boolean }

/** 7 ngày gần nhất, phần tử cuối = hôm nay (chốt M6b/Q3 — hiện ở CẢ PC lẫn Mobile). */
export function dai7Ngay(ngayCoLog: ReadonlySet<string>, homNay: string): ODai[] {
  return Array.from({ length: 7 }, (_, i) => {
    const ngay = luiNgay(homNay, 6 - i)
    return {
      ngay,
      thu: THU_NGAN[thuCua(ngay)]!,
      daOn: ngayCoLog.has(ngay),
      laHomNay: ngay === homNay,
    }
  })
}

export const THU_TU_STAGE = ['new', 'stage1', 'stage2', 'stage3', 'intensive', 'mastered'] as const

/** Đếm từ theo stage — LUÔN trả đủ 6 mục kể cả stage 0 từ (chốt M6b/Q2). */
export function gomKhuVuon(rows: readonly { stage: string }[]): { stage: Stage; so: number }[] {
  return THU_TU_STAGE.map((stage) => ({ stage, so: rows.filter((r) => r.stage === stage).length }))
}

/** Tách số từ đến hạn hôm nay / quá hạn. `next_review_date` NULL = hàng đợi từ mới, không tính. */
export function demDenHan(
  rows: readonly { next_review_date: string | null }[],
  homNay: string,
): { dungHan: number; quaHan: number; tong: number } {
  let dungHan = 0
  let quaHan = 0
  for (const r of rows) {
    if (!r.next_review_date) continue
    if (r.next_review_date < homNay) quaHan += 1
    else if (r.next_review_date === homNay) dungHan += 1
  }
  return { dungHan, quaHan, tong: dungHan + quaHan }
}
```
`npm test` → **GREEN**.

### T3 · REFACTOR + X-test (nối vào cuối `dashboard.test.ts`)
```ts
import { readFileSync } from 'node:fs'
it('dashboard.ts là module thuần — không import react/supabase/node', () => {
  const src = readFileSync(new URL('./dashboard.ts', import.meta.url), 'utf8')
  expect(src).not.toMatch(/from '(react|node:|@supabase)/)
  expect(src).not.toMatch(/\.\/supabase\.ts/)
})
```
(Đặt trong `describe('kỷ luật module')`, sao y pattern đã dùng ở `player.test.ts`/`settings.test.ts`.)

### T4 · `src/components/icons.tsx` — thêm `tick`
Chỉ 2 chỗ sửa (diff nhỏ, không viết lại file):
```ts
  | 'giai-thich'
+ | 'tick'          // ✓ trong ô ngày đã ôn của dải 7 ngày (mockup 01 Mobile)
```
```ts
  loa: ( … ),
+ tick: <path d="M5 12l5 5L19 7" />,
}
```
**Không thêm icon lửa** — dùng lại `an-mung` và ghi đè fill từ chỗ gọi:
```tsx
<Icon ten="an-mung" size={16} fill="currentColor" stroke="none" />
```

### T5 · `src/features/player/Ring.tsx` — thêm prop `noiDung`
```diff
-type Props = { total_points: number; stage: StageCay; size?: number }
+/** `noiDung`: Dashboard (mockup 01) đặt CHỮ HÁN giữa ring thay cho icon cây. Bỏ trống = icon cây. */
+type Props = { total_points: number; stage: StageCay; size?: number; noiDung?: ReactNode }

-export default function Ring({ total_points, stage, size = 60 }: Props) {
+export default function Ring({ total_points, stage, size = 60, noiDung }: Props) {
…
-        <IconCay stage={stage} size={size >= 60 ? 24 : 22} />
+        {noiDung ?? <IconCay stage={stage} size={size >= 60 ? 24 : 22} />}
```
+ `import type { ReactNode } from 'react'`. Player không truyền `noiDung` ⇒ **không đổi hành vi**.

### T6 · `src/features/dashboard/DashboardPage.tsx` — nạp dữ liệu (5 query song song)
```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Icon, IconCay, type StageCay } from '../../components/icons.tsx'
import {
  dai7Ngay, demDenHan, gioVN, gomKhuVuon, loiChao, luiNgay, ngayCoOn, ngayDayDu,
  TEN_NGUOI_DUNG, tinhStreak, type ODai,
} from '../../lib/dashboard.ts'
import { homNayVN } from '../../lib/player.ts'
import { supabase } from '../../lib/supabase.ts'
import Ring from '../player/Ring.tsx'
import KhungTrang from '../shell/KhungTrang.tsx'

/**
 * Dashboard (mockup 01 PC + Mobile). Tên "Helios" và dải 7 ngày hiện ở CẢ 2 breakpoint là
 * quyết định của người dùng ở Brainstorm M6b (mockup chỉ vẽ dải này ở Mobile).
 *
 * ⚠️ HAI NGUỒN MÀU TÁCH BẠCH (UI_DESIGN §8.1): chip "Khu vườn" tô theo STAGE (màu tượng trưng,
 * query `stage`), còn ring "Vừa ôn gần đây" tô theo `total_points` THẬT (query riêng) — không gộp.
 */
const TINT: Record<StageCay, string> = {
  new: 'bg-danger-bg text-ring-0',
  stage1: 'bg-tint-orange text-ring-1',
  stage2: 'bg-warn-bg text-ring-2',
  stage3: 'bg-tint-lime text-ring-3',
  intensive: 'bg-success-bg text-ring-4',
  mastered: 'bg-success-bg text-ring-5',
}
const THE_CARD = 'rounded-18 border border-border-card bg-surface-card p-[18px] md:p-[22px]'
const TIEU_DE = 'mb-3.5 text-15 font-bold text-content-primary md:mb-4'

type TuGanDay = { vocab_id: string; word: string; total_points: number; stage: StageCay }
type DuLieu = {
  homNay: string
  gio: number
  dungHan: number
  quaHan: number
  tong: number
  coTu: boolean
  streak: number
  dai: ODai[]
  vuon: { stage: StageCay; so: number }[]
  ganDay: TuGanDay[]
  chuaDoc: number
}

export default function DashboardPage() {
  const [dl, setDl] = useState<DuLieu | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    void nap()
  }, [])

  async function nap() {
    const now = new Date()
    const homNay = homNayVN(now)
    const [dueRes, vuonRes, ganDayRes, logRes, tbRes] = await Promise.all([
      supabase.from('word_state').select('next_review_date').neq('stage', 'mastered').lte('next_review_date', homNay),
      supabase.from('word_state').select('stage'),
      supabase
        .from('word_state')
        .select('vocab_id, total_points, stage, vocab(word)')
        .not('last_reviewed_at', 'is', null)
        .order('last_reviewed_at', { ascending: false })
        .limit(8),
      supabase.from('review_log').select('reviewed_at').gte('reviewed_at', `${luiNgay(homNay, 30)}T00:00:00+07:00`),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ])
    const e = dueRes.error ?? vuonRes.error ?? ganDayRes.error ?? logRes.error ?? tbRes.error
    if (e) return setLoi(e.message)

    // supabase-js suy kiểu quan hệ vocab(word) thành mảng; thực tế là 1 object (FK n-1)
    const gd = (ganDayRes.data ?? []) as unknown as (TuGanDay & { vocab: { word: string } | null })[]
    const { dungHan, quaHan, tong } = demDenHan(dueRes.data ?? [], homNay)
    const ngay = ngayCoOn((logRes.data ?? []) as { reviewed_at: string }[])
    setLoi(null)
    setDl({
      homNay,
      gio: gioVN(now),
      dungHan,
      quaHan,
      tong,
      coTu: (vuonRes.data ?? []).length > 0,
      streak: tinhStreak(ngay, homNay),
      dai: dai7Ngay(ngay, homNay),
      vuon: gomKhuVuon((vuonRes.data ?? []) as { stage: string }[]) as { stage: StageCay; so: number }[],
      ganDay: gd.map((t) => ({ ...t, word: t.vocab?.word ?? '?' })),
      chuaDoc: tbRes.count ?? 0,
    })
  }
```

### T7 · Header + dải 7 ngày + skeleton/lỗi
```tsx
  if (loi) {
    return (
      <KhungTrang>
        <div role="alert" className="flex items-center justify-between gap-3 rounded-14 border border-danger bg-danger-bg px-4 py-3 text-13 text-danger-text">
          <span>Không tải được Dashboard: {loi}</span>
          <button type="button" onClick={() => void nap()} className="shrink-0 rounded-10 bg-accent px-3 py-1.5 text-13 font-semibold text-white">
            Thử lại
          </button>
        </div>
      </KhungTrang>
    )
  }

  if (!dl) {
    return (
      <KhungTrang>
        <div className="flex flex-col gap-4">
          <div className="h-10 w-64 animate-pulse rounded-10 bg-surface-sunken" />
          <div className="h-[86px] animate-pulse rounded-16 bg-surface-sunken" />
          <div className="h-[110px] animate-pulse rounded-16 bg-surface-sunken" />
          <div className="h-[140px] animate-pulse rounded-18 bg-surface-sunken" />
        </div>
      </KhungTrang>
    )
  }

  return (
    <KhungTrang>
      <header className="mb-4 flex items-start justify-between gap-4 md:mb-7">
        <div>
          <h1 className="font-display text-22 font-bold text-content-primary md:text-28">
            {loiChao(dl.gio)}, {TEN_NGUOI_DUNG}
          </h1>
          <p className="mt-1 text-13 text-content-muted md:mt-1.5 md:text-14">{ngayDayDu(dl.homNay)}</p>
        </div>
        {/* PC: badge streak (mockup 01 PC) */}
        <span className="hidden items-center gap-2 rounded-pill bg-award-bg px-[18px] py-[9px] md:inline-flex">
          <Icon ten="an-mung" size={16} fill="currentColor" stroke="none" className="shrink-0 text-award-icon" />
          <span className="whitespace-nowrap text-13 font-bold text-award-text">Chuỗi {dl.streak} ngày liên tiếp</span>
        </span>
        {/* Mobile: chuông — lối vào Thông báo (M6a mới chỉ có route ẩn) */}
        <Link to="/thong-bao" aria-label="Thông báo" className="relative shrink-0 p-1 text-content-nav md:hidden">
          <Icon ten="thong-bao" size={22} />
          {dl.chuaDoc > 0 && (
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-pill bg-accent ring-2 ring-surface-page" />
          )}
        </Link>
      </header>

      <div className="mb-4 rounded-16 bg-award-bg px-4 py-3.5 md:mb-7">
        {/* Hàng badge chỉ ở Mobile — PC đã có badge ở header, không lặp lại */}
        <div className="mb-3 flex items-center gap-1.5 md:hidden">
          <Icon ten="an-mung" size={15} fill="currentColor" stroke="none" className="shrink-0 text-award-icon" />
          <span className="whitespace-nowrap text-12 font-bold text-award-text">Chuỗi {dl.streak} ngày liên tiếp</span>
        </div>
        <div className="flex justify-between">
          {dl.dai.map((o) => (
            <ONgay key={o.ngay} o={o} />
          ))}
        </div>
      </div>
```
```tsx
function ONgay({ o }: { o: ODai }) {
  const vien = o.daOn
    ? 'bg-award-icon'
    : o.laHomNay
      ? 'border-2 border-award-icon bg-surface-card'
      : 'border border-award-icon/40 bg-surface-card'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`flex h-[26px] w-[26px] items-center justify-center rounded-pill ${vien}`}>
        {o.daOn ? (
          <Icon ten="tick" size={13} strokeWidth={2.4} className="text-white" />
        ) : o.laHomNay ? (
          <Icon ten="an-mung" size={12} fill="currentColor" stroke="none" className="text-award-icon" />
        ) : null}
      </div>
      <span className={`text-10 text-award-text ${o.laHomNay ? 'font-bold' : 'font-semibold'}`}>{o.thu}</span>
    </div>
  )
}
```

### T8 · 2 thẻ đến hạn/quá hạn + 2 CTA + trạng thái rỗng
```tsx
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[1.4fr_1fr] md:items-start md:gap-7">
        <div className="flex flex-col gap-4 md:gap-5">
          <div className="flex gap-3 md:gap-4">
            <The nhan="Đến hạn hôm nay" so={dl.dungHan} nen="bg-accent-tint" mauNhan="text-accent" />
            <The nhan="Quá hạn" so={dl.quaHan} nen="bg-warn-bg" mauNhan="text-warn-text" />
          </div>
          {dl.coTu ? (
            <div className="flex flex-col gap-3 md:flex-row md:gap-3.5">
              <Link
                to="/on-tap"
                className="flex-1 rounded-14 bg-accent py-4 text-center text-15 font-semibold text-white"
              >
                {dl.tong > 0 ? `Bắt đầu ôn tập · ${dl.tong} từ` : 'Bắt đầu ôn tập'}
              </Link>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Sẽ có ở mốc M7"
                className="flex-1 cursor-not-allowed rounded-14 bg-secondary-tint py-4 text-14 font-semibold text-secondary opacity-60"
              >
                Ôn theo chủ đề
              </button>
            </div>
          ) : (
            <div className="rounded-14 border border-border-card bg-surface-card p-5 text-center">
              <p className="text-14 text-content-muted">Chưa có từ nào — hãy import bộ từ đầu tiên.</p>
              <Link to="/import" className="mt-3 inline-block rounded-10 bg-accent px-4 py-2.5 text-14 font-semibold text-white">
                Import từ vựng
              </Link>
            </div>
          )}
        </div>
```
```tsx
function The({ nhan, so, nen, mauNhan }: { nhan: string; so: number; nen: string; mauNhan: string }) {
  return (
    <div className={`flex-1 rounded-16 p-4 md:p-5 ${nen}`}>
      <div className={`text-12 font-semibold md:text-13 ${mauNhan}`}>{nhan}</div>
      <div className="mt-1.5 font-display text-30 font-bold text-content-primary md:mt-2 md:text-36">{so} từ</div>
    </div>
  )
}
```
**Tự quyết (ghi để soát):** khi `tong === 0`, CTA chính **vẫn bật** nhưng bỏ hậu tố số — Player còn
nạp từ mới từ hàng đợi nên "0 từ đến hạn" ≠ "không có gì để ôn".

### T9 · Khu vườn + Vừa ôn gần đây
```tsx
        <div className="flex flex-col gap-4 md:gap-5">
          <section className={THE_CARD}>
            <h2 className={TIEU_DE}>Khu vườn của bạn</h2>
            <div className="flex justify-between">
              {dl.vuon.map(({ stage, so }) => (
                <div key={stage} className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-[42px] w-[42px] items-center justify-center rounded-pill ${TINT[stage]}`}>
                    <IconCay stage={stage} size={20} />
                  </div>
                  <span className="text-11 font-semibold text-content-nav">{so}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={THE_CARD}>
            <h2 className={TIEU_DE}>Vừa ôn gần đây</h2>
            {dl.ganDay.length === 0 ? (
              <p className="text-13 text-content-muted">Chưa có từ nào được ôn.</p>
            ) : (
              <div className="flex flex-wrap gap-3.5">
                {dl.ganDay.map((t) => (
                  <Ring
                    key={t.vocab_id}
                    total_points={t.total_points}
                    stage={t.stage}
                    size={52}
                    noiDung={<span className="font-han text-10 font-semibold text-content-nav md:text-11">{t.word}</span>}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </KhungTrang>
  )
}
```
**Tự quyết:** ring dùng `size={52}` ở cả 2 breakpoint (mockup PC 56 / Mobile 52). `Ring` nhận size
bằng inline style nên muốn đổi theo breakpoint phải nhân đôi markup hoặc thêm JS đo màn hình —
chênh 4px không đáng đánh đổi (quy tắc ponytail).

### T10 · `src/App.tsx` — gắn route
```diff
+import DashboardPage from './features/dashboard/DashboardPage.tsx'
…
         <Route element={<AppShell />}>
+          <Route path="/" element={<DashboardPage />} />
           <Route path="/import" element={<ImportPage />} />
           <Route path="/cai-dat" element={<CaiDatPage />} />
-          {/* Route ẩn (không có trong MENU) — lối vào Thông báo trên Mobile tới khi Dashboard (M6b) gắn chuông */}
+          {/* Route ẩn (không có trong MENU) — Dashboard Mobile mở qua nút chuông ở header */}
           <Route path="/thong-bao" element={<TrangThongBao />} />
-          {MENU.filter((m) => !['/import', '/on-tap', '/cai-dat'].includes(m.path)).map((m) => (
+          {MENU.filter((m) => !['/', '/import', '/on-tap', '/cai-dat'].includes(m.path)).map((m) => (
```
Sau bước này chỉ còn **1 stub**: `/tu-vung`. Cập nhật luôn comment cây route ở đầu file.

### T11 · Chạy máy: `npm run build` · `npm run lint` · `npm test`
Kỳ vọng: **176 + ~21 = ~197 test xanh**, build không cảnh báo TypeScript.

### T12 · Kiểm thật bằng CDP (`scratchpad/cdp-m6b.mjs`)
Đăng nhập thật → lấy `access_token` → gọi PostgREST để có **số liệu chuẩn**, rồi so với DOM:
| Khẳng định | Cách kiểm |
|---|---|
| Lời chào + tên "Helios" | `body.innerText` chứa `Chào buổi …, Helios` |
| Ngày đúng định dạng | khớp regex `Thứ .+, \d+ tháng \d+` |
| Đến hạn / quá hạn | so với `word_state?stage=neq.mastered&next_review_date=lte.<homNay>` → kỳ vọng **1 / 4** |
| Streak | so với tập ngày rút từ `review_log` → kỳ vọng **3** |
| Dải 7 ngày | đếm **đúng 7** ô ở CẢ PC (1280) lẫn Mobile (390) |
| Khu vườn | **đúng 6** chip; dãy số khớp `word_state?select=stage` → kỳ vọng `0,5,0,0,1,3` |
| Ring "vừa ôn" | số ring = số từ có `last_reviewed_at`; `stroke-dashoffset` khớp `min(total,30)/30`; giữa ring là **chữ Hán** (không phải `<svg>` cây) |
| CTA chính | click → URL `/on-tap` |
| CTA phụ | `disabled === true`; click → URL **không đổi** |
| Chuông Mobile | có ở 390px, **không có** ở 1280px; click → `/thong-bao` |
| Không tràn ngang | `document.documentElement.scrollWidth <= 390` |
| Player không hỏng | mở `/on-tap`, ring vẫn hiện **icon cây** (`svg` bên trong ring) |
Chụp: `m6b-pc.png`, `m6b-pc-dark.png`, `m6b-mobile.png`, `m6b-mobile-dark.png` → đối chiếu mockup.

### T13 · Sửa sai lệch phát hiện ở T12 (nếu có), chạy lại T11 + T12.

### T14 · Bước 4: dọn process (dev server + Chrome headless của phiên) · cập nhật
`memory-bank/activeContext.md`, `progress.md`, `decisionLog.md` (**MB-24**: tên Helios là hằng số,
dải 7 ngày mở rộng sang PC theo yêu cầu người dùng, ring dùng 52px cả 2 breakpoint) · soát checklist §5.
