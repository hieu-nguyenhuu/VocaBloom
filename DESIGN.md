# DESIGN.md — M0: Nền móng dự án & Hệ token 2 lớp

> ⚠️ File này là **kiến trúc + kế hoạch của RIÊNG task M0**, sẽ bị ghi đè khi sang task khác.
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-06 · Trạng thái: **CHỜ DUYỆT PLAN**

---

## 0. Bối cảnh & phạm vi

M0 là milestone đầu tiên (`memory-bank/progress.md`). Repo hiện **chưa có 1 dòng code app nào** —
không `package.json`, không `src/`. M0 dựng nền móng để M1 (DB) và M2 (Import) có chỗ đứng.

### Đầu ra của M0
1. Dự án Vite + React + TS strict + Tailwind v4 chạy được, `npm run build` xanh.
2. `src/styles/tokens.css` — hệ token 2 lớp đầy đủ, có dark mode 3 tầng nền.
3. Trang swatch `/dev/tokens` để nghiệm thu token bằng mắt.
4. `src/lib/supabase.ts` + `npm run check:db` ping Supabase thật.

### NGOÀI phạm vi M0 (không làm)
- Không dựng sidebar PC / tab bar Mobile thật → để M1+.
- Không dựng bất kỳ màn nào trong 18 màn PC / 19 màn Mobile.
- **Không đụng bộ 6 icon giai đoạn cây** (gate 🔴 MB-03 vẫn còn hiệu lực).
- Không viết migration SQL, không chốt RLS (→ M1, phụ thuộc MB-06).
- Không cài thư viện icon, không cài UI kit, không cài state manager.

---

## 1. Quyết định kiến trúc (đã chốt với người dùng 2026-09-06)

| # | Quyết định | Lý do |
|---|---|---|
| M0-D1 | **Tailwind v4 CSS-first** (`@theme` trong CSS), không dùng `tailwind.config.js` | Lớp 1 + Lớp 2 nằm chung 1 file `tokens.css`; bớt 2 file cấu hình (`tailwind.config.js`, `postcss.config.js`) — đúng ponytail |
| M0-D2 | **Dark mode 3 nhánh**: `:root` (light) + `@media prefers-color-scheme` + `[data-theme="dark"]` | Mặc định theo hệ điều hành, không thêm UI nào (mockup màn 17 không có nút theme). Sau này muốn nút toggle chỉ cần set 1 thuộc tính trên `<html>`, không phải viết lại token |
| M0-D3 | **Thang radius & font-size dựng lại theo mockup**, đặt tên bằng SỐ (`rounded-14`, `text-15`) | Mockup dùng 11 mức radius và 20 mức font-size, phần lớn không có trong thang Tailwind mặc định. Đặt tên số = ánh xạ 1:1 với mockup, không bịa ngữ nghĩa |
| M0-D4 | **Chỉ MÀU mới đi qua 2 lớp**; radius/font-size dùng thẳng `@theme` | `UI_DESIGN.md` §2 chỉ bắt buộc 2 lớp cho màu/font. Radius không đổi khi đổi phong cách màu |
| M0-D5 | Font nạp qua **thẻ `<link>` Google Fonts**, copy y nguyên từ mockup | 0 package. Google tự cắt subset `unicode-range` nên Noto Sans SC không tải hết vài MB |
| M0-D6 | Cài **Vitest** ngay ở M0 | M2 (`importValidate`) và M3 (`srs.ts`) bắt buộc TDD; có sẵn `npm test` làm bằng chứng xanh cho mọi milestone sau |
| M0-D7 | Cài **react-router** ngay | Người dùng chọn. M0 chỉ tạo 5 route stub rỗng, không dựng layout |
| M0-D8 | Scaffold qua **thư mục tạm** rồi copy vào repo | `npm create vite` trong thư mục đã có file sẽ hỏi tương tác "Remove existing files?" — nguy hiểm. Scaffold ra chỗ trống rồi copy là an toàn tuyệt đối |

### Dependency gatekeeping (bắt buộc bởi `systemPatterns.md` §1)
Đúng **6 nhóm package**, mỗi cái 1 dòng lý do:

| Package | Lý do không thể thiếu |
|---|---|
| `react` + `react-dom` | Stack đã chốt `SPECIFICATION.md` §1.1 |
| `vite` + `@vitejs/plugin-react` | Build tool đã chốt |
| `typescript` | Bắt buộc strict theo `systemPatterns.md` §8 |
| `tailwindcss` + `@tailwindcss/vite` | Styling đã chốt; plugin Vite là cách cài chính thức của v4 |
| `react-router` | 5 mục điều hướng, người dùng chọn cài ở M0 |
| `@supabase/supabase-js` | Backend đã chốt |
| `vitest` | TDD bắt buộc ở Bước 3 `CLAUDE.md` |

**Không cài:** icon library (icon là SVG trích tay), CSS-in-JS, state manager, form library, date library (dùng `Intl` native), uuid (dùng `crypto.randomUUID()`).

---

## 2. Kiến trúc hệ token — 4 tầng trong 1 file

```
src/styles/tokens.css
│
├─ TẦNG A · LỚP 1 — --raw-*
│    Hex thô, tách 2 bộ: raw light + raw dark.
│    ⇒ NƠI DUY NHẤT phải sửa khi đổi toàn bộ phong cách app.
│
├─ TẦNG B · LỚP 2 — --vb-*  (token ngữ nghĩa)
│    :root                              → gán bộ light
│    @media (prefers-color-scheme:dark)
│      :root:not([data-theme="light"])  → ghi đè bộ dark
│    :root[data-theme="dark"]           → ghi đè bộ dark (ép thủ công)
│
├─ TẦNG C · RING — --ring-0..--ring-5
│    6 mã Mastery Ring. KHÔNG qua Lớp 1/2. KHÔNG đổi giữa light/dark.
│    (UI_DESIGN.md §2 "Ngoại lệ tuyệt đối" + DEC-12)
│
└─ TẦNG D · @theme inline
     Phơi --vb-* thành utility Tailwind: bg-*, text-*, border-*
     + thang --radius-*, --text-*, --font-*
```

### Vì sao phải là `@theme inline` chứ không phải `@theme`
`@theme` thường **sao chép giá trị** vào utility → dark mode sẽ không đổi màu.
`@theme inline` giữ nguyên `var(--vb-...)` trong utility → khi Tầng B đổi biến, màu đổi theo. Bắt buộc.

### Quy tắc đặt tên tránh xung đột
Tailwind v4 dùng namespace `--color-*` cho chính nó. Nếu Lớp 2 cũng đặt `--color-*` sẽ đụng nhau.
→ Lớp 2 dùng tiền tố riêng **`--vb-`**, Tầng D mới bắc cầu sang `--color-*`.

```css
/* TẦNG A */ --raw-purple-500: #5B4FE8;
/* TẦNG B */ --vb-accent: var(--raw-purple-500);
/* TẦNG D */ @theme inline { --color-accent: var(--vb-accent); }
/* Dùng   */ <button class="bg-accent">
```

### 🚫 Luật bất di bất dịch
- Component **chỉ được** dùng utility Tailwind (`bg-accent`, `text-content-muted`).
- Component **cấm** viết hex, cấm `var(--raw-*)`, cấm `bg-[#5B4FE8]`.
- Ngoại lệ duy nhất: 6 màu ring, dùng qua `--ring-0..5`.

---

## 3. Danh mục token màu (Lớp 2)

Giá trị lấy từ `UI_DESIGN.md` §3 (đã verify) + kết quả script T6. Ô ghi `⟨T6⟩` = chưa verify chắc, script sẽ điền.

### 3.1 Bề mặt & viền
| Token | Light | Dark |
|---|---|---|
| `--vb-surface-app` | `#FFFFFF` | `#15171C` |
| `--vb-surface-page` | `#FFFFFF` | `#22252C` |
| `--vb-surface-sidebar` | `#FBFAF6` | `#17191E` |
| `--vb-surface-card` | `#FBFAF6` | `#1E2128` |
| `--vb-surface-raised` | `#FFFFFF` | `⟨T6⟩` (`#23262C`?) |
| `--vb-border-card` | `#F0ECE4` | `#2A2D35` |
| `--vb-border-input` | `#E5E5E5` | `⟨T6⟩` |
| `--vb-border-dashed` | `#C9C1E8` | `#4A4470` |
| `--vb-border-dot` | `#DCD3EA` | `#3A3E4A` |

**Dark = 3 tầng nền** `#15171C` → `#17191E` → `#22252C` (`systemPatterns.md` §4), không phải 2 tầng phẳng.

### 3.2 Chữ
| Token | Light | Dark |
|---|---|---|
| `--vb-content-primary` | `#241B3A` | `#EDEEF0` |
| `--vb-content-muted` | `#8B8593` | `#9A9BA8` |
| `--vb-content-nav` | `#4A4458` | `#C4C2CC` |
| `--vb-content-subtle` | `⟨T6⟩` `#55566A`? | `⟨T6⟩` `#B7AFC9`? |

> ⚠️ Cặp `#55566A` / `#B7AFC9` xuất hiện đúng 30 lần mỗi mã, **cùng selector** → chắc chắn là cặp light/dark của một vai trò, nhưng **chưa xác định được mã nào thuộc mode nào**. T6 sẽ trả lời bằng cách tách frame, KHÔNG đoán.

### 3.3 Accent (Color Consistency Lock — `UI_DESIGN.md` §3)
| Token | Light | Dark | Chỉ được dùng cho |
|---|---|---|---|
| `--vb-accent` | `#5B4FE8` | `#8B80FF` | **MỌI** hành động chính: nút, nav active, focus, progress dot, highlight từ trong hội thoại |
| `--vb-accent-tint` | `#EDEBFC` | `#262148` | nền nhạt của accent |
| `--vb-accent-text` | `#4338CA` | `#C7BFFF` | chữ đậm trên tint |
| `--vb-secondary` | `#0369A1` | `⟨T6⟩` | **CHỈ** nút "Ôn theo chủ đề" |
| `--vb-secondary-tint` | `#E3F4FD` | `#12303D` | nền nút phụ |
| `--vb-award-icon` | `#E0449E` | `#F472B6` | **CHỈ** streak/badge — **cấm** đặt trên phần tử click được |
| `--vb-award-text` | `#A21467` | `#F9A8D4` | như trên |
| `--vb-award-bg` | `#FCE4F1` | `#3A1830` | như trên |

### 3.4 Feedback
| Token | Light | Dark |
|---|---|---|
| `--vb-danger` / `-bg` / `-text` | `#EF4444` / `#FEE2E2` / `#B91C1C` | `#EF4444` / `#3B1F1F` / `#FCA5A5` |
| `--vb-warn` / `-bg` / `-text` | `#EAB308` / `#FEF9C3` / `#946200` | `#EAB308` / `#3A330F` / `#F3D17A` |
| `--vb-success` / `-bg` / `-text` | `#4ADE80` / `#DCFCE7` / `#15803D` | `#4ADE80` / `#113322` / `#86EFAC` |

Quá hạn dùng **tint vàng**, không dùng đỏ (`productContext.md` §2 — giữ giọng điệu nhẹ nhàng).

### 3.5 TẦNG C — Mastery Ring (BẤT BIẾN)
```
--ring-0:#ef4444  --ring-1:#f97316  --ring-2:#eab308
--ring-3:#a3e635  --ring-4:#4ade80  --ring-5:#16a34a
```
Không qua Lớp 1/2. Không đổi theo light/dark. Chỉ dùng cho ngữ cảnh mastery/điểm số.

### 3.6 🚫 DANH SÁCH ĐEN — 4 mã VỎ GALLERY, cấm vào `tokens.css`
| Mã | Bằng chứng đếm được | Thực chất là |
|---|---|---|
| `#8B7FA8` | đúng **74** lần, luôn `color:` (74 = 36 khung PC + 38 khung Mobile) | nhãn `01 · Dashboard` của trang gallery |
| `#EFEAE0` | đúng **37** lần, luôn `border:1px solid` (37 = 18 màn PC + 19 màn Mobile, bản light) | viền khung 1280×800 |
| `#F3F0E9` | 2 lần, `background` ngoài cùng | nền trang gallery |
| `#E6E0D2` | 2 lần, `border-bottom` header | viền header gallery |

Test T10 sẽ **tự động chặn** 4 mã này.

---

## 4. Thang radius / font-size / font-family (M0-D3)

### Radius — 11 mức trích từ mockup
`8 · 9 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 36 · 99(pill)`
→ utility: `rounded-8` … `rounded-36`, `rounded-pill`

Tần suất thật: `10px`(124) `14px`(104) `12px`(58) `16px`(56) `20px`(50) `36px`(38) `18px`(34) `8px`(32) `99px`(30)

**Gợi ý dùng** (tham chiếu, không phải luật): input/ô đáp án → `10`; card → `14`; panel lớn → `20`; nút tròn/pill → `pill`.

### Font-size — 20 mức
`10 11 12 13 14 15 16 17 18 19 20 22 24 26 28 30 36 40 44 52`
→ utility: `text-10` … `text-52`
Tần suất cao nhất: `14px`(136) `12px`(116) `15px`(82) `16px`(80) `17px`(54)

### Font-family
| Token | Font | Dùng cho |
|---|---|---|
| `--font-display` | `'Baloo 2'` 600/700 | tiêu đề, số liệu lớn, tên topic |
| `--font-body` | `'Be Vietnam Pro'` 400/500/600/700 | mặc định toàn app, mọi chữ tiếng Việt |
| `--font-han` | `'Noto Sans SC'` 400/600 | **mọi** nội dung chữ Hán — ưu tiên rõ nét sư phạm |

Tần suất trong mockup: Noto Sans SC (202) > Baloo 2 (94) > Be Vietnam Pro (78).

---

## 5. Cấu trúc file sau M0

```
VocaBloomn/
├── index.html                  ← link Google Fonts, lang="vi"
├── package.json
├── vite.config.ts              ← plugin react + tailwind + cấu hình vitest
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── .gitignore                  ← BỔ SUNG node_modules, dist, .vite
├── scripts/
│   ├── extract-colors.mjs      ← T6, chạy 1 lần, tách frame light/dark
│   └── check-db.mjs            ← ping Supabase thật
└── src/
    ├── main.tsx
    ├── App.tsx                 ← router
    ├── env.d.ts                ← khai kiểu ImportMetaEnv
    ├── styles/
    │   └── tokens.css          ← ⭐ 4 tầng, trái tim của M0
    ├── lib/
    │   └── supabase.ts         ← client singleton + validate env
    ├── features/               ← (rỗng, dựng dần từ M1)
    ├── components/             ← (rỗng)
    └── dev/
        └── TokenSheet.tsx      ← trang swatch /dev/tokens
```

---

## 6. KẾ HOẠCH THỰC THI — 17 task

Mỗi task 2–5 phút. Task có ⚙️ = phải chạy lệnh kiểm tra ngay sau khi sửa (`agentic-guard`).

### Nhóm 1 · Scaffold (T1–T5)

**T1 — Scaffold Vite vào thư mục tạm rồi copy vào repo** ⚙️
```bash
TMP="$SCRATCH/vbscaffold"
npm create vite@latest "$TMP" -- --template react-ts
cp -r "$TMP"/{src,index.html,vite.config.ts,tsconfig*.json,eslint.config.js} .
cp "$TMP/package.json" .
rm -rf "$TMP"
```
Lý do dùng thư mục tạm: `npm create vite` trong thư mục đã có file sẽ hỏi tương tác → treo. (M0-D8)
*Kiểm tra:* `ls package.json src/main.tsx` có kết quả.

**T2 — Cài 6 dependency** ⚙️
```bash
npm i react-router @supabase/supabase-js
npm i -D tailwindcss @tailwindcss/vite vitest
```
*Kiểm tra:* `npm ls --depth=0` không báo `UNMET`.

**T3 — `vite.config.ts`: thêm plugin Tailwind + khối test** (diff patch)
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```
Nếu TS báo lỗi thuộc tính `test` → đổi import sang `vitest/config`.
*Kiểm tra:* `npx tsc --noEmit`.

**T4 — `tsconfig.app.json` bật strict tối đa + `.gitignore`** (diff patch)
```jsonc
"strict": true,
"noUncheckedIndexedAccess": true,
"noImplicitOverride": true,
"exactOptionalPropertyTypes": true
```
`.gitignore` hiện chỉ có 2 dòng → thêm:
```
node_modules/
dist/
.vite/
coverage/
```
*Kiểm tra:* `git status` không thấy `node_modules`.

**T5 — `index.html`: font + ngôn ngữ + tiêu đề** (diff patch)
```html
<html lang="vi">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Be+Vietnam+Pro:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;600&display=swap" rel="stylesheet">
<title>VocaBloom</title>
```
Copy nguyên chuỗi từ mockup, **chỉ thêm** `preconnect` tới `fonts.gstatic.com` (mockup thiếu → font tải chậm hơn 1 nhịp).

---

### Nhóm 2 · Hệ token (T6–T10) — phần lõi của M0

**T6 — Script trích màu tách light/dark** ⚙️
`scripts/extract-colors.mjs`: cắt 2 file HTML theo `data-screen-label`, phân nhóm bằng hậu tố `(Dark)`, gom hex kèm thuộc tính CSS, in ra 3 nhóm: **chỉ-light** / **chỉ-dark** / **cả hai**.
→ Trả lời dứt điểm các ô `⟨T6⟩` ở §3, đặc biệt cặp `#55566A` / `#B7AFC9`.
**KHÔNG đoán** — chỉ điền `tokens.css` theo output script.
*Kiểm tra:* `node scripts/extract-colors.mjs` in ra bảng đọc được.

**T7 — `tokens.css` TẦNG A (Lớp 1)**
Khai `--raw-*` cho 2 bộ light/dark theo §3 + output T6. Kèm comment `/* NƠI DUY NHẤT sửa khi đổi phong cách */`.

**T8 — `tokens.css` TẦNG B (Lớp 2 + 3 nhánh dark)**
```css
:root { --vb-surface-page: var(--raw-white); /* ... */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --vb-surface-page: var(--raw-ink-800); }
}
:root[data-theme="dark"] { --vb-surface-page: var(--raw-ink-800); }
```
Dùng CSS nesting native — Tailwind v4 hỗ trợ sẵn, **không cần** cài `postcss-nesting`.

**T9 — `tokens.css` TẦNG C + TẦNG D**
```css
:root { --ring-0:#ef4444; /* … --ring-5:#16a34a */ }

@theme inline {
  --color-accent: var(--vb-accent);
  /* … toàn bộ --vb-* */
  --font-display: 'Baloo 2', system-ui, sans-serif;
  --font-body: 'Be Vietnam Pro', system-ui, sans-serif;
  --font-han: 'Noto Sans SC', system-ui, sans-serif;
  --radius-8:8px; /* … */ --radius-pill:99px;
  --text-10:10px; /* … */ --text-52:52px;
}
```
Thêm `@custom-variant dark` 2 nhánh cho các trường hợp hiếm token không phủ hết.
*Lưu ý:* `@import "tailwindcss";` phải nằm **dòng đầu tiên** file.

**T10 — Test canh cổng token (RED → GREEN)** ⚙️
`src/styles/tokens.test.ts` — đọc `tokens.css` dạng text, assert:
1. Có đủ tên token bắt buộc (`--vb-accent`, `--vb-surface-page`, `--ring-0`…`--ring-5`…).
2. **Không chứa** 4 mã vỏ gallery `#8B7FA8` `#EFEAE0` `#F3F0E9` `#E6E0D2`.
3. Có đủ 3 nhánh dark mode.
4. Không có block nào dùng `--raw-*` bên ngoài TẦNG A.

RED: viết test trước khi hoàn thiện §3.2 → phải THẤT BẠI. GREEN: điền nốt token → PASS.
*Kiểm tra:* `npm test`.

---

### Nhóm 3 · App shell tối thiểu (T11–T13)

**T11 — Router 5 stub + `/dev/tokens`**
`App.tsx`: `/` `/on-tap` `/tu-vung` `/import` `/cai-dat` → mỗi route là 1 `<div>` ghi tên màn + "(dựng ở M1+)".
**Không** dựng sidebar/tab bar, **không** vẽ icon → tránh chạm gate icon cây.

**T12 — Trang swatch `src/dev/TokenSheet.tsx`**
Render: lưới ô màu (mỗi ô = màu + tên token + hex đang áp dụng) · 3 font mẫu (`Khu vườn của bạn` / `Ôn tập hằng ngày` / `学习中文词汇`) · dải 11 radius · thang 20 font-size · 6 ô ring.
Có 3 nút ép theme: **Sáng / Tối / Theo hệ thống** (chỉ set `document.documentElement.dataset.theme`) — đây là **công cụ dev, không phải UI sản phẩm**, sẽ bị xóa/thay ở M1+.

**T13 — Build & nghiệm thu bằng mắt** ⚙️
`npm run build` → xanh. `npm run dev` → mở `/dev/tokens`, đối chiếu light/dark với mockup.

---

### Nhóm 4 · Supabase (T14–T15)

**T14 — `src/lib/supabase.ts` + `src/env.d.ts`**
```ts
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY trong .env.local')
export const supabase = createClient(url, key)
```
Client **singleton duy nhất** (`systemPatterns.md` §2). `env.d.ts` khai kiểu để TS strict không kêu.

**T15 — `scripts/check-db.mjs` + `npm run check:db`** ⚙️
Đọc `.env.local`, gọi `/auth/v1/health` và thử query 1 bảng, in kết quả có dấu ✅/❌.
Kỳ vọng **hiện tại**: auth `200` + `PGRST205` (schema trống, migration ở M1) → coi là **PASS**.

---

### Nhóm 5 · Đồng bộ ký ức & dọn dẹp (T16–T17)

**T16 — Sửa 2 lỗi đã phát hiện trong `memory-bank/systemPatterns.md`**
1. §4 ghi card bài tập là `#FFF8F0` — **mã này không tồn tại** trong cả 2 file HTML (đã grep toàn bộ). Màn 02 thật dùng `#FFFFFF` + `#FBFAF6`. → Sửa lại.
2. Bổ sung mục **"4 mã vỏ gallery cấm dùng"** kèm bằng chứng đếm được, để phiên sau không trích nhầm.

**T17 — Cập nhật `activeContext.md` + `progress.md` + dọn process**
- `progress.md`: tick toàn bộ M0.
- `activeContext.md`: gỡ blocker Supabase (đã ping thật thành công 2026-09-06, project `myjdweopndizbhexqufo` @ `ap-southeast-1`, status `ACTIVE_HEALTHY`); ghi 3 câu hỏi còn treo cho M1 (icon cây · Auth/RLS · biến `EMAIL` chỉ 1 ký tự).
- `decisionLog.md`: thêm **MB-07** (Tailwind v4 CSS-first + token 4 tầng) và **MB-08** (dark mode 3 nhánh, chưa có nút toggle).
- Tắt sạch dev server / process nền do phiên này tạo.

---

## 7. Tiêu chí nghiệm thu M0 (bằng chứng, không nói suông)

| # | Bằng chứng | Lệnh |
|---|---|---|
| 1 | Build xanh | `npm run build` |
| 2 | Test xanh (gồm test canh cổng token) | `npm test` |
| 3 | Type-check sạch, strict tối đa | `npx tsc --noEmit` |
| 4 | Trang swatch hiển thị đúng cả light lẫn dark | mở `/dev/tokens` |
| 5 | Kết nối Supabase thật | `npm run check:db` |

**Chưa đủ 5 mục thì chưa được báo "xong".**

---

## 8. Rủi ro đã lường trước

| Rủi ro | Xử lý |
|---|---|
| `npm create vite` hỏi tương tác vì thư mục không rỗng | M0-D8 — scaffold ra thư mục tạm rồi copy (T1) |
| `@theme` (không `inline`) làm dark mode chết vì giá trị bị copy cứng | T9 dùng đúng `@theme inline`; T12 trang swatch phát hiện ngay bằng mắt |
| Đoán sai mã light/dark của cặp `#55566A`/`#B7AFC9` | T6 tách frame lấy số liệu thật, cấm đoán |
| Lỡ tay đưa màu vỏ gallery vào token | T10 test tự động chặn 4 mã |
| Tailwind v4 API khác v3, làm sai cú pháp | Sau T9 chạy `npm run build`; sai 3 lần liên tiếp → DỪNG, báo người dùng (`agentic-guard`) |
| Lỡ chạm gate icon cây | M0 không render icon nào; T11 stub rỗng, T12 chỉ có ô màu/chữ |

---

## 9. Cổng phê duyệt

Kế hoạch 17 task ở trên chờ người dùng gõ **"DUYỆT PLAN"** mới được sang Bước 3 (thực thi).
