# DESIGN.md — M16: Chọn giao diện Sáng / Tối / Hệ thống

> Kiến trúc + kế hoạch của RIÊNG task này.
> Ngày lập: 2026-09-24 · Trạng thái: **CHỜ DUYỆT**
>
> ℹ️ Ghi đè bản M15 — nội dung M15 đã lưu đầy đủ ở `decisionLog.md` MB-35.

---

## 1. Yêu cầu

Màn Cài đặt có lựa chọn giao diện tường minh: **Sáng / Tối / Hệ thống**.

## 2. Phần CSS đã có sẵn từ M0 — KHÔNG phải viết lại

MB-08 (2026-09-06) đã viết `tokens.css` đủ **3 nhánh** chính vì lường trước ngày này:

| Nhánh | Selector | Khi nào khớp |
|---|---|---|
| 1 · Sáng | `:root` | mặc định |
| 2 · Tối theo hệ điều hành | `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` | OS tối **và** không ép sáng |
| 3 · Tối ép thủ công | `:root[data-theme="dark"]` | ép tối |

`tokens.test.ts` đã canh 2 nhánh tối phủ đúng cùng bộ token. ⇒ Task này chỉ cần **đặt hoặc gỡ
thuộc tính `data-theme` trên `<html>`**:

| Lựa chọn | `data-theme` |
|---|---|
| Sáng | `"light"` (chặn nhánh 2 dù OS đang tối) |
| Tối | `"dark"` (kích hoạt nhánh 3) |
| Hệ thống | **gỡ bỏ** ⇒ nhánh 2 tự theo OS, kể cả khi OS đổi giữa chừng — không cần JS lắng nghe |

## 3. Quyết định

| Mã | Nội dung | Ghi chú |
|---|---|---|
| **Q1** | Lưu ở **`localStorage`**, theo từng thiết bị | Người dùng chốt. Máy bàn sáng, điện thoại tối — độc lập |
| **Q2** | Điều khiển dạng **3 nút liền nhau** (segmented) | Người dùng chốt. **Kiểu điều khiển MỚI**, chưa có trong mockup nào — xem §5 |
| **Q3** | Áp theme bằng **script inline trong `index.html`**, chạy TRƯỚC khi trang vẽ | Nếu để React áp sau khi mount thì mỗi lần tải trang sẽ **nháy trắng rồi mới tối**. Đây là lý do chính để chọn localStorage thay vì DB |
| **Q4** | ⭐ Bổ sung **`color-scheme`** vào cả 3 nhánh của `tokens.css` | **Lỗi tiềm ẩn phát hiện khi khảo sát** — xem §4 |
| **Q5** | Giá trị localStorage lạ / không đọc được ⇒ rơi về **Hệ thống** | `localStorage` có thể ném lỗi (trình duyệt ẩn danh, chặn cookie) ⇒ bọc `try/catch`, đừng để cả app trắng trang vì 1 cài đặt giao diện |
| **Q6** | Có **test chống lệch** giữa script inline và `giaoDien.ts` | Xem §6 — lần thứ 5 dự án dùng mẫu này |

## 4. ⭐ Lỗi tiềm ẩn: chưa khai `color-scheme`

Grep toàn bộ `src/styles/*.css` và `index.html`: **không có `color-scheme` ở đâu cả.**

Hệ quả: các phần tử **gốc của trình duyệt** không biết trang đang sáng hay tối, nên tự vẽ theo mặc định:
- popup của `<select>` chọn giọng đọc ở màn Cài đặt (M6c),
- thanh cuộn, ô nhập, checkbox gốc.

**Hiện chưa lộ** vì theme luôn khớp OS. Nhưng ngay khi **ép Tối trên máy đang để Sáng**, popup chọn giọng
sẽ bật ra **nền trắng giữa trang tối**. Tính năng này sẽ làm lỗi đó lộ ra, nên phải sửa cùng lúc:

```css
:root                                      { color-scheme: light; }   /* nhánh 1 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light'])          { color-scheme: dark; }    /* nhánh 2 */
}
:root[data-theme='dark']                   { color-scheme: dark; }    /* nhánh 3 */
```

## 5. UI — điều khiển MỚI, cần bạn duyệt

Thêm 1 hàng vào nhóm **đầu tiên** của màn Cài đặt, theo đúng khung `HANG` sẵn có:

```
┌──────────────────────────────────────────────────┐
│ Giao diện             ┌──────┬──────┬──────────┐ │
│                       │ Sáng │ Tối  │ Hệ thống │ │
│                       └──────┴──────┴──────────┘ │
└──────────────────────────────────────────────────┘
```

- Khung ngoài: `rounded-10 bg-surface-sunken p-1`.
- Nút đang chọn: **nền tím `bg-accent` + chữ trắng** — tím vì đây là phần tử bấm được
  (UI_DESIGN §63 cấm hồng trên nút; Color Consistency Lock: tím = mọi hành động chính).
- Nút chưa chọn: nền trong, chữ `text-content-nav`.
- **Chỉ dùng token Lớp 2 đã có** — không thêm token màu mới.
- Accessibility: `role="radiogroup"` + mỗi nút `role="radio"` + `aria-checked`.
- **Đổi là áp ngay**, không cần bấm "Lưu" — khác các ô khoá API (M6a/Q3), vì đổi theme thấy kết quả
  tức thì và đổi lại được ngay, không có gì để "lỡ tay".

## 6. Thiết kế kỹ thuật

### 6.1 `src/lib/giaoDien.ts` — hàm thuần (TDD)

```ts
export type CheDo = 'sang' | 'toi' | 'he_thong'
export const KHOA_LUU = 'vb-giao-dien'

/** Đọc giá trị thô từ localStorage; rác / null ⇒ 'he_thong' (Q5). */
export function docCheDo(raw: string | null): CheDo

/** Giá trị gán cho `data-theme`; `null` nghĩa là GỠ thuộc tính (để CSS theo OS). */
export function thuocTinhTheme(cheDo: CheDo): 'light' | 'dark' | null
```

### 6.2 `index.html` — script inline trước khi vẽ (Q3)

```html
<script>
  // M16 — áp theme TRƯỚC khi trang vẽ để không nháy. Logic phải khớp src/lib/giaoDien.ts
  // (có test chống lệch). try/catch vì localStorage có thể ném lỗi ở chế độ ẩn danh.
  try {
    var c = localStorage.getItem('vb-giao-dien')
    if (c === 'sang') document.documentElement.dataset.theme = 'light'
    else if (c === 'toi') document.documentElement.dataset.theme = 'dark'
  } catch (e) {}
</script>
```

### 6.3 Test chống lệch (Q6)

Script inline **buộc phải** lặp lại khoá `vb-giao-dien` và phép ánh xạ `sang→light`, `toi→dark` — nó chạy
trước khi JS của app tải nên không import được `giaoDien.ts`. Cùng một sự thật ở 2 nơi ⇒ test đọc
`index.html` rồi so khớp với `KHOA_LUU` và `thuocTinhTheme`. Đổi khoá ở một nơi mà quên nơi kia thì theme
đã chọn **âm thầm mất** mỗi lần tải lại trang — đúng loại lỗi không ai để ý cho tới khi bị hỏi.

## 7. PLAN — 7 task

| # | Nội dung | Loại |
|---|---|---|
| T1 | RED+GREEN `giaoDien.ts` — 5 ca: đọc 3 giá trị hợp lệ · rác/`null` ⇒ `he_thong` · `thuocTinhTheme` đủ 3 nhánh | TDD |
| T2 | Test chống lệch: đọc `index.html`, khẳng định chứa `KHOA_LUU` và đúng cặp `'sang'→'light'`, `'toi'→'dark'` | TDD |
| T3 | `tokens.css`: thêm `color-scheme` vào 3 nhánh + 1 ca trong `tokens.test.ts` canh cả 3 nhánh đều có | TDD |
| T4 | `index.html`: script inline trước khi vẽ | Diff patch |
| T5 | `CaiDatPage.tsx`: hàng "Giao diện" + 3 nút segmented, đổi là ghi localStorage + áp ngay | UI |
| T6 | build · lint · `npm test` | Kiểm |
| T7 | **Kiểm thật CDP**, ép OS **sáng** rồi: chọn Tối ⇒ `data-theme="dark"` + nền đổi màu · **tải lại trang ⇒ vẫn tối, không nháy** · chọn Hệ thống ⇒ gỡ thuộc tính · ép OS tối + chọn Sáng ⇒ vẫn sáng · `color-scheme` của `<html>` khớp theme · localStorage bị chặn ⇒ app vẫn chạy | Kiểm thật |

## 8. Tiêu chí nghiệm thu

- [ ] Chọn Sáng / Tối có hiệu lực **ngay**, ngược với OS vẫn đúng.
- [ ] Chọn Hệ thống ⇒ đi theo OS, **kể cả khi OS đổi** mà không tải lại trang.
- [ ] Tải lại trang giữ nguyên lựa chọn và **không nháy màu**.
- [ ] Ép Tối trên OS Sáng ⇒ popup `<select>` chọn giọng cũng tối (nhờ `color-scheme`).
- [ ] `localStorage` bị chặn ⇒ app không vỡ, rơi về Hệ thống.
- [ ] `npm test` · build · lint 0 lỗi.

## 9. Ngoài phạm vi

- Không đồng bộ lựa chọn giữa các thiết bị (Q1 đã chốt theo từng thiết bị).
- Không thêm theme thứ 3 (chỉ Sáng / Tối).
