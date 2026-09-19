# DESIGN.md — App Shell (sidebar PC / thanh tab Mobile)

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản Đăng nhập (đã lưu ở `DESIGN.Auth.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-16 · Trạng thái: **✅ HOÀN THÀNH 2026-09-16 — 8/8 task, build/lint/test xanh, CDP 12/12**

---

## 0. Phạm vi

**Làm:**
- `src/components/icons.tsx` — 6 icon nav (5 mục + chuông), path trích nguyên văn từ mockup.
- `src/features/shell/menu.ts` — 5 mục nav, **1 nguồn** cho cả sidebar lẫn tab bar.
- `src/features/shell/AppShell.tsx` — layout route: sidebar (≥768px) | Outlet | tab bar (<768px).
- `src/features/shell/KhungTrang.tsx` — khung nội dung chuẩn (padding + max-width) cho trang hành chính.
- Nối `App.tsx`; sửa `Stub` dùng `KhungTrang`, bỏ dải link tự chế của M0.

**KHÔNG làm (đã chốt 2026-09-16):**
- Panel Thông báo (PC dropdown 360px / Mobile sheet) và chấm "chưa đọc" → M6. Mục "Thông báo" ở đáy
  sidebar chỉ là **nút bất hoạt** (`aria-disabled`, mờ nhẹ).
- `/on-tap` **vẫn nằm trong shell** cho tới khi có Player (M4) — dù mockup Player không có nav.
- Header Mobile (lời chào + chuông ở Dashboard, tiêu đề ở Cài đặt) là của **từng trang**, không thuộc shell.
- Không icon cây. 0 package mới. Không JS `matchMedia` — chuyển PC/Mobile bằng `md:` của Tailwind.

---

## 1. Số liệu trích từ mockup (nguồn: `01 Dashboard PC`, `17 Cai dat PC`, `01 Dashboard` Mobile)

| Phần | Mockup | Utility (chỉ Lớp 2) |
|---|---|---|
| Sidebar | 220px, nền `#FBFAF6`/dark `#17191E`, viền phải `#F0ECE4`/`#2A2D35`, padding `24px 0` | `hidden md:flex w-[220px] shrink-0 flex-col bg-surface-sidebar border-r border-border-card py-6 sticky top-0 h-[100dvh]` |
| Brand | Baloo 2 700 20px, padding `0 24 28` | `px-6 pb-7 font-display text-20 font-bold text-content-primary` |
| Danh sách | gap 4, padding `0 12` | `flex flex-col gap-1 px-3` |
| Item PC | gap 11, padding `10 14`, radius 10, icon 19, chữ 14 | `flex items-center gap-[11px] rounded-10 px-[14px] py-[10px] text-14` |
| Active PC | nền `#EDEBFC` chữ `#5B4FE8` 600 | `bg-accent-tint text-accent font-semibold` |
| Inactive PC | `#4A4458` 500 | `text-content-nav font-medium` |
| Thông báo | mục 6, `margin-top:auto`, padding `0 12` | `mt-auto px-3` + item như trên, thêm `opacity-60 cursor-default` |
| Content PC | `flex:1; overflow-y:auto; padding 40px 44px` | `flex-1 min-w-0 md:px-11 md:py-10` (trong `KhungTrang`) |
| Max-width | Dashboard 1000 · Import/Cài đặt 960 · Từ vựng tự bố cục | prop `rong: 1000 \| 960`; Từ vựng không dùng `KhungTrang` |
| Tab bar | `space-around`, padding `10px 8px 14px`, viền trên `#F0ECE4`, nền trắng | `md:hidden flex justify-around border-t border-border-card bg-surface-page px-2 pt-[10px] pb-[14px]` + `pb-[calc(14px+env(safe-area-inset-bottom))]` |
| Item Mobile | cột dọc, gap 3, icon 21, chữ 10 | `flex flex-col items-center gap-[3px] text-10` |
| Active Mobile | `#5B4FE8` 600 | `text-accent font-semibold` |
| Inactive Mobile | `#B7AFC9` 500 | `text-content-subtle font-medium` |
| Content Mobile | scroll `padding 0 22px 20px` | `px-[22px] pb-5` (trong `KhungTrang`) |

Icon: `stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"`,
riêng icon Ôn tập có tam giác `fill="currentColor" stroke="none"`. Path dùng chung PC/Mobile (đã đối chiếu).

**Điểm tự quyết (ghi để soát):** (a) breakpoint 768px (`md`) — mockup chỉ có 390 và 1280, chọn mốc
Tailwind mặc định; (b) tab bar `position: sticky; bottom: 0` + safe-area; (c) nút Thông báo bất hoạt
mờ `opacity-60` — mockup không có trạng thái này.

---

## 2. Kiến trúc

```
App
 └ /dang-nhap → DangNhap
 └ RequireAuth
    └ AppShell (layout: <aside sidebar md+> <div flex-1><Outlet/></div> <nav tabbar <md>)
       ├ /         Stub(KhungTrang rong=1000)
       ├ /on-tap   Stub  (tạm trong shell tới M4)
       ├ /tu-vung  Stub
       ├ /import   Stub(960)
       ├ /cai-dat  Stub(960)
       ├ /dev/tokens TokenSheet
       └ *         Stub
```

- `menu.ts`: `[{ path, ten, icon }]` — `Stub` cũng đọc từ đây (bỏ mảng `MAN_HINH` trùng lặp trong `App.tsx`).
- `NavLink` (react-router, có sẵn): `className={({ isActive }) => ...}`; Dashboard dùng `end` để `/`
  không sáng khi ở trang khác. Chuỗi class phải **nguyên vẹn** (không ghép động).
- Bố cục ngoài: `div.flex.min-h-[100dvh]` → sidebar sticky + content; Mobile: content + tab bar sticky đáy.
- `KhungTrang` là **component**, không phải route-handle: trang nào không dùng thì tự bố cục (Từ vựng M6).

---

## 3. Kế hoạch — 8 task (mỗi task 2–5 phút). Toàn bộ là UI thuần → không có TDD, nhưng build/lint/test phải xanh và kiểm thật bằng Chrome.

### T1 · `src/components/icons.tsx`
```tsx
import type { SVGProps } from 'react'

/**
 * 6 icon nav — SVG path trích NGUYÊN VĂN từ VocaBloom_PCView.html (sidebar màn 17),
 * PC và Mobile dùng chung path (UI_DESIGN.md §10.3). Không trộn icon font.
 * KHÔNG chứa icon giai đoạn cây (gate MB-03).
 */
export type TenIcon = 'dashboard' | 'on-tap' | 'tu-vung' | 'import' | 'cai-dat' | 'thong-bao'

const PATH: Record<TenIcon, JSX.Element> = {
  dashboard: (<><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /></>),
  'on-tap': (<><circle cx="12" cy="12" r="9" /><path d="M10 8l6 4-6 4Z" fill="currentColor" stroke="none" /></>),
  'tu-vung': (<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5Z" /></>),
  import: (<><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>),
  'cai-dat': (<><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></>),
  'thong-bao': (<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
}

export function Icon({ ten, size = 19, ...rest }: { ten: TenIcon; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {PATH[ten]}
    </svg>
  )
}
```
(`JSX.Element` → nếu TS 6 không có global `JSX`, dùng `ReactElement` từ `react`.)

### T2 · `src/features/shell/menu.ts`
```ts
import type { TenIcon } from '../../components/icons.tsx'

/** 5 mục điều hướng — 1 nguồn cho sidebar PC, tab bar Mobile và stub. Thứ tự theo mockup. */
export const MENU = [
  { path: '/', ten: 'Dashboard', icon: 'dashboard', moc: 'M6' },
  { path: '/on-tap', ten: 'Ôn tập', icon: 'on-tap', moc: 'M4' },
  { path: '/tu-vung', ten: 'Từ vựng', icon: 'tu-vung', moc: 'M6' },
  { path: '/import', ten: 'Import', icon: 'import', moc: 'M2b' },
  { path: '/cai-dat', ten: 'Cài đặt', icon: 'cai-dat', moc: 'M6' },
] as const satisfies readonly { path: string; ten: string; icon: TenIcon; moc: string }[]
```

### T3 · `src/features/shell/KhungTrang.tsx`
```tsx
import type { ReactNode } from 'react'

/**
 * Khung nội dung chuẩn cho trang hành chính: PC padding 40/44 + max-width theo mockup
 * (Dashboard 1000, Import/Cài đặt 960); Mobile padding 0 22 20. Trang có bố cục riêng
 * (Từ vựng 2 pane, màn 13) KHÔNG dùng component này.
 */
const RONG = { 1000: 'max-w-[1000px]', 960: 'max-w-[960px]' } as const

export default function KhungTrang({ rong = 1000, children }: { rong?: keyof typeof RONG; children: ReactNode }) {
  return (
    <div className="px-[22px] pb-5 pt-6 md:px-11 md:py-10">
      <div className={`mx-auto ${RONG[rong]}`}>{children}</div>
    </div>
  )
}
```

### T4 · `src/features/shell/AppShell.tsx`
```tsx
import { NavLink, Outlet } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import { MENU } from './menu.ts'

/**
 * App shell theo systemPatterns.md §5: sidebar trái 220px (≥768px) / thanh tab dưới (<768px).
 * Chuyển bố cục bằng CSS (`md:`), không JS. Header Mobile thuộc từng trang, không ở đây.
 * Mục "Thông báo" là nút bất hoạt — panel dropdown/sheet dựng ở M6.
 */
const ITEM_PC = 'flex items-center gap-[11px] rounded-10 px-[14px] py-[10px] text-14'
const ITEM_MOBILE = 'flex flex-col items-center gap-[3px] text-10'

export default function AppShell() {
  return (
    <div className="flex min-h-[100dvh] bg-surface-page">
      <aside className="sticky top-0 hidden h-[100dvh] w-[220px] shrink-0 flex-col border-r border-border-card bg-surface-sidebar py-6 md:flex">
        <div className="px-6 pb-7 font-display text-20 font-bold text-content-primary">VocaBloom</div>
        <nav className="flex flex-col gap-1 px-3">
          {MENU.map((m) => (
            <NavLink key={m.path} to={m.path} end={m.path === '/'}
              className={({ isActive }) =>
                isActive ? `${ITEM_PC} bg-accent-tint font-semibold text-accent` : `${ITEM_PC} font-medium text-content-nav hover:bg-surface-sunken`}>
              <Icon ten={m.icon} size={19} /><span>{m.ten}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3">
          <button type="button" aria-disabled="true" title="Sẽ dựng ở M6"
            className={`${ITEM_PC} w-full cursor-default font-medium text-content-nav opacity-60`}>
            <Icon ten="thong-bao" size={19} /><span>Thông báo</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1"><Outlet /></div>
        <nav className="sticky bottom-0 flex justify-around border-t border-border-card bg-surface-page px-2 pt-[10px] pb-[calc(14px+env(safe-area-inset-bottom))] md:hidden">
          {MENU.map((m) => (
            <NavLink key={m.path} to={m.path} end={m.path === '/'}
              className={({ isActive }) =>
                isActive ? `${ITEM_MOBILE} font-semibold text-accent` : `${ITEM_MOBILE} font-medium text-content-subtle`}>
              <Icon ten={m.icon} size={21} /><span>{m.ten}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
```

### T5 · `App.tsx` — nối shell, dọn stub (diff cục bộ)
- Xoá mảng `MAN_HINH` → import `MENU`.
- `Stub` bỏ `<main min-h…>` + dải `<nav>` link; dùng `<KhungTrang rong={…}>`; giữ tiêu đề + đoạn mô tả; giữ link "Bảng token" (dev).
- Routes:
```tsx
<Route path="/dang-nhap" element={<DangNhap />} />
<Route element={<RequireAuth />}>
  <Route element={<AppShell />}>
    {MENU.map((m) => <Route key={m.path} path={m.path} element={<Stub ten={m.ten} moc={m.moc} />} />)}
    <Route path="/dev/tokens" element={<TokenSheet />} />
    <Route path="*" element={<Stub ten="Không tìm thấy trang" moc="—" />} />
  </Route>
</Route>
```
- Cập nhật comment đầu file (bỏ câu "M0 KHÔNG vẽ icon nào" → "icon nav trích từ mockup; icon cây vẫn gate").

### T6 · `npm run build` · `npm run lint` · `npm test` (67/67 giữ nguyên)

### T7 · Kiểm thật Chrome headless + CDP (script scratchpad, đăng nhập bằng `.env.local`)
- PC 1280: sidebar hiện, tab bar ẩn; vào `/cai-dat` → đúng 1 item active (`Cài đặt`), `/` chỉ sáng khi ở `/`.
- Mobile 390: sidebar ẩn, tab bar hiện, active đúng; content không tràn ngang.
- Nút Thông báo bấm không đổi route.
- Chụp PC light + dark, Mobile light. Tắt dev server + Chrome sau khi xong.

### T8 · Cập nhật memory-bank
`activeContext.md` (App shell ✅, việc kế tiếp: M2b UI Import hoặc M4), `progress.md`, `decisionLog.md`
(MB-17: shell CSS-only, `/on-tap` tạm trong shell, Thông báo bất hoạt, `KhungTrang` là component không phải route-handle,
max-width theo mockup 1000/960 thay vì 720 của `UI_DESIGN.md`).

---

## 4. Checklist soát ở Bước 4
- [x] Không hex trong component; 6 icon path khớp nguyên văn mockup; không icon cây.
- [x] Class Tailwind là chuỗi nguyên vẹn (không `bg-${x}`).
- [x] `NavLink` Dashboard có `end`; `/on-tap` trong shell (tạm).
- [x] Sidebar sticky, content cuộn riêng; tab bar sticky đáy + safe-area.
- [x] Nút Thông báo bất hoạt, không route mới.
- [x] Dark mode theo token; PC/Mobile chỉ khác bố cục.
