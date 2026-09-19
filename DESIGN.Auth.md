# DESIGN.md — Màn Đăng nhập (Auth UI + RequireAuth)

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản M3 (đã lưu ở `DESIGN.M3.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-16 · Trạng thái: **✅ HOÀN THÀNH 2026-09-16 — 10/10 task, test 67/67, CDP 9/9**

---

## 0. Phạm vi

**Làm:**
- `src/lib/auth.ts` — 2 hàm **thuần** (TDD): validate form phía client + dịch lỗi Supabase sang tiếng Việt.
- `src/features/auth/DangNhap.tsx` — màn Đăng nhập (route `/dang-nhap`).
- `src/features/auth/RequireAuth.tsx` — cổng bảo vệ mọi route khác (đọc session + lắng nghe thay đổi).
- Nối vào `App.tsx`.

**KHÔNG làm (đã chốt):** nút Đăng xuất (để M6 màn Cài đặt), "Quên mật khẩu", "Đăng ký", checkbox
"Ghi nhớ" (supabase-js đã persist session vào localStorage), App shell (task kế tiếp).
Sau đăng nhập về `/` — chấp nhận thấy stub M0 tạm thời.

**0 package mới.** `<form>` native + `autocomplete` → trình duyệt tự nhớ mật khẩu, Enter = submit.

---

## 1. Layout đã duyệt — Phương án A (tái dùng modal "Sửa từ vựng" màn 14)

Không có mockup riêng. Mọi giá trị lấy từ pattern có sẵn trong `VocaBloom_PCView.html`:

| Phần | Nguồn mockup | Utility (chỉ Lớp 2, cấm hex) |
|---|---|---|
| Nền trang | tone sidebar `#FBFAF6` / dark `#17191E` | `min-h-[100dvh] bg-surface-sidebar` |
| Card | modal màn 14: trắng, radius 20, padding 28, shadow | `w-full max-w-[480px] bg-surface-raised rounded-20 p-7 shadow-[0_24px_60px_-12px_rgba(36,27,58,0.18)]` |
| Brand | sidebar "VocaBloom" Baloo 2 700 | `font-display text-28 font-bold text-content-primary` |
| Dòng phụ | text 15 muted | `text-15 text-content-muted` |
| Label | màn 14: 11.5px 600 xám (thang không có 11.5 → 12) | `text-12 font-semibold text-content-muted` |
| Input | màn 14: `#FBFAF6` + viền `#F0ECE4` radius 8, padding 9/12 | `bg-surface-card border border-border-card rounded-8 px-3 py-[9px] text-14 text-content-primary focus:border-accent focus:outline-none` |
| Nút chính | "Kiểm tra"/"Bắt đầu ôn tập": tím, 600, padding 17, radius 14 | `bg-accent text-white font-semibold text-16 rounded-14 py-[17px] disabled:opacity-60` |
| Lỗi | ring ramp đỏ (feedback sai) | `bg-danger-bg text-danger-text rounded-10 px-3 py-2 text-13` |

- Card căn giữa cả 2 chiều; mobile: gutter `px-4`, card full-width.
- Dark mode tự đổi theo token. **Không icon** → không chạm gate 6 icon cây.
- Shadow modal của mockup là `rgba(36,27,58,0.4)`; trên nền trang (không có overlay tối) giảm còn
  `0.18` cho đỡ nặng — đây là giá trị duy nhất tự quyết, ghi lại để soát.

---

## 2. Luồng kỹ thuật

```
main.tsx → App
  /dang-nhap  → <DangNhap/>       (đã có session → <Navigate to="/"/>)
  /*          → <RequireAuth>      (chưa biết session → render null; không session → Navigate /dang-nhap, state.from)
                  … các route stub cũ …
```

- `RequireAuth`: `supabase.auth.getSession()` lúc mount + `onAuthStateChange` → state
  `'dang_kiem' | 'co' | 'khong'`. `SIGNED_OUT` (kể cả refresh token thất bại) → về `/dang-nhap`.
- `DangNhap`: submit → `kiemTraFormDangNhap` (lỗi → hiện, không gọi mạng) → `signInWithPassword`
  → lỗi → `dichLoiDangNhap` → hiện; thành công → `navigate(state.from ?? '/', { replace: true })`.
- Đang gửi: nút `disabled` + "Đang đăng nhập…"; giữ nguyên giá trị đã nhập khi lỗi.

**Hàm thuần (`src/lib/auth.ts`, 0 import React/Supabase — lỗi nhận dạng qua shape `{message, status}`):**

```ts
export type KetQuaForm = { ok: true } | { ok: false; loi: string }
export function kiemTraFormDangNhap(email: string, matKhau: string): KetQuaForm
export function dichLoiDangNhap(loi: { message?: string; status?: number } | null | undefined): string
```

Bảng dịch lỗi (giọng nhẹ nhàng, không đổ lỗi):
| Điều kiện | Câu hiện |
|---|---|
| `status === 429` hoặc message chứa `rate limit` | Thử quá nhiều lần rồi, đợi vài phút rồi thử lại nhé. |
| message chứa `Invalid login credentials` | Email hoặc mật khẩu chưa đúng. Thử lại nhé. |
| message chứa `fetch` / `network` / `Failed to` | Không kết nối được. Kiểm tra mạng rồi thử lại nhé. |
| còn lại | Có lỗi khi đăng nhập. Thử lại sau nhé. |

Validate form: email trim rỗng → "Nhập email nhé."; không khớp `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` →
"Email chưa đúng định dạng."; mật khẩu rỗng → "Nhập mật khẩu nhé."

---

## 3. Kế hoạch — 10 task (mỗi task 2–5 phút)

### T1 · RED — test validate form (`src/lib/auth.test.ts`)
```ts
import { describe, expect, it } from 'vitest'
import { dichLoiDangNhap, kiemTraFormDangNhap } from './auth.ts'

describe('kiemTraFormDangNhap', () => {
  it('email rỗng → báo nhập email', () => {
    expect(kiemTraFormDangNhap('   ', 'abc')).toEqual({ ok: false, loi: 'Nhập email nhé.' })
  })
  it('email sai định dạng → báo định dạng', () => {
    expect(kiemTraFormDangNhap('abc', 'x')).toEqual({ ok: false, loi: 'Email chưa đúng định dạng.' })
  })
  it('mật khẩu rỗng → báo nhập mật khẩu', () => {
    expect(kiemTraFormDangNhap('a@b.co', '')).toEqual({ ok: false, loi: 'Nhập mật khẩu nhé.' })
  })
  it('hợp lệ → ok', () => {
    expect(kiemTraFormDangNhap(' a@b.co ', 'x')).toEqual({ ok: true })
  })
})
```
Chạy `npm test` → phải ĐỎ (module chưa tồn tại).

### T2 · GREEN — `src/lib/auth.ts` phần validate
```ts
/**
 * Logic Đăng nhập thuần — 0 import React/Supabase (giống srs.ts) để test được.
 * UI chỉ gọi 2 hàm này; mọi câu chữ hiện cho người dùng nằm ở đây.
 */
export type KetQuaForm = { ok: true } | { ok: false; loi: string }

const MAU_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function kiemTraFormDangNhap(email: string, matKhau: string): KetQuaForm {
  const e = email.trim()
  if (!e) return { ok: false, loi: 'Nhập email nhé.' }
  if (!MAU_EMAIL.test(e)) return { ok: false, loi: 'Email chưa đúng định dạng.' }
  if (!matKhau) return { ok: false, loi: 'Nhập mật khẩu nhé.' }
  return { ok: true }
}
```
`npm test` → XANH 4 ca.

### T3 · RED — test dịch lỗi (thêm vào `auth.test.ts`)
```ts
describe('dichLoiDangNhap', () => {
  it('sai thông tin → 1 câu chung, không lộ sai email hay mật khẩu', () => {
    expect(dichLoiDangNhap({ message: 'Invalid login credentials', status: 400 }))
      .toBe('Email hoặc mật khẩu chưa đúng. Thử lại nhé.')
  })
  it('429 → báo đợi', () => {
    expect(dichLoiDangNhap({ message: 'Request rate limit reached', status: 429 }))
      .toBe('Thử quá nhiều lần rồi, đợi vài phút rồi thử lại nhé.')
  })
  it('lỗi mạng → báo kiểm tra mạng', () => {
    expect(dichLoiDangNhap({ message: 'TypeError: Failed to fetch' }))
      .toBe('Không kết nối được. Kiểm tra mạng rồi thử lại nhé.')
  })
  it('không rõ → câu chung', () => {
    expect(dichLoiDangNhap(null)).toBe('Có lỗi khi đăng nhập. Thử lại sau nhé.')
    expect(dichLoiDangNhap({ message: 'Something odd' })).toBe('Có lỗi khi đăng nhập. Thử lại sau nhé.')
  })
})
```
`npm test` → ĐỎ (hàm chưa có).

### T4 · GREEN — `dichLoiDangNhap` (nối vào `auth.ts`)
```ts
export type LoiDangNhap = { message?: string; status?: number } | null | undefined

/** Map lỗi Supabase Auth → câu tiếng Việt. Cố ý KHÔNG phân biệt sai email / sai mật khẩu. */
export function dichLoiDangNhap(loi: LoiDangNhap): string {
  const m = (loi?.message ?? '').toLowerCase()
  if (loi?.status === 429 || m.includes('rate limit'))
    return 'Thử quá nhiều lần rồi, đợi vài phút rồi thử lại nhé.'
  if (m.includes('invalid login credentials')) return 'Email hoặc mật khẩu chưa đúng. Thử lại nhé.'
  if (m.includes('fetch') || m.includes('network')) return 'Không kết nối được. Kiểm tra mạng rồi thử lại nhé.'
  return 'Có lỗi khi đăng nhập. Thử lại sau nhé.'
}
```
`npm test` → XANH 8 ca. REFACTOR: thêm test **X-auth** kiểu X1c — đọc mã nguồn `auth.ts`, assert không có dòng `import` nào (giữ tính thuần).

### T5 · `src/features/auth/RequireAuth.tsx`
```tsx
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { supabase } from '../../lib/supabase.ts'

type TrangThai = 'dang_kiem' | 'co' | 'khong'

/**
 * Cổng bảo vệ mọi route đọc DB (RLS từ M1 chặn toàn bộ nếu chưa đăng nhập — MB-10).
 * Lúc chưa biết có session hay không thì render null để không nhấp nháy về màn login.
 */
export default function RequireAuth() {
  const [tt, setTt] = useState<TrangThai>('dang_kiem')
  const location = useLocation()

  useEffect(() => {
    let song = true
    supabase.auth.getSession().then(({ data }) => {
      if (song) setTt(data.session ? 'co' : 'khong')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_su_kien, session) => {
      setTt(session ? 'co' : 'khong')
    })
    return () => {
      song = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (tt === 'dang_kiem') return null
  if (tt === 'khong') return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />
  return <Outlet />
}
```

### T6 · `src/features/auth/DangNhap.tsx` — khung + form (UI thuần)
```tsx
import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { dichLoiDangNhap, kiemTraFormDangNhap } from '../../lib/auth.ts'
import { supabase } from '../../lib/supabase.ts'

/**
 * Màn Đăng nhập — KHÔNG có mockup, layout Phương án A đã duyệt (DESIGN.md §1):
 * tái dùng modal "Sửa từ vựng" (màn 14) làm card, nút CTA của Dashboard/Player.
 * Chỉ 1 tài khoản (MB-10) ⇒ không có Đăng ký / Quên mật khẩu.
 */
export default function DangNhap() {
  const [email, setEmail] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [loi, setLoi] = useState<string | null>(null)
  const [dangGui, setDangGui] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const ve = (location.state as { from?: string } | null)?.from ?? '/'

  // Đã có session mà vẫn vào /dang-nhap → về thẳng app
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true })
    })
  }, [navigate])

  async function guiForm(e: FormEvent) {
    e.preventDefault()
    const kq = kiemTraFormDangNhap(email, matKhau)
    if (!kq.ok) return setLoi(kq.loi)
    setLoi(null)
    setDangGui(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: matKhau })
    setDangGui(false)
    if (error) return setLoi(dichLoiDangNhap(error))
    navigate(ve, { replace: true })
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface-sidebar px-4 py-10">
      <form
        onSubmit={guiForm}
        noValidate
        className="flex w-full max-w-[480px] flex-col gap-4 rounded-20 bg-surface-raised p-7 shadow-[0_24px_60px_-12px_rgba(36,27,58,0.18)]"
      >
        <div className="text-center">
          <h1 className="font-display text-28 font-bold text-content-primary">VocaBloom</h1>
          <p className="mt-1 text-15 text-content-muted">Đăng nhập để tiếp tục ôn tập</p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-12 font-semibold text-content-muted">Email</span>
          <input
            type="email" name="email" autoComplete="email" inputMode="email" autoFocus
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded-8 border border-border-card bg-surface-card px-3 py-[9px] text-14 text-content-primary focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-12 font-semibold text-content-muted">Mật khẩu</span>
          <input
            type="password" name="password" autoComplete="current-password"
            value={matKhau} onChange={(e) => setMatKhau(e.target.value)}
            className="rounded-8 border border-border-card bg-surface-card px-3 py-[9px] text-14 text-content-primary focus:border-accent focus:outline-none"
          />
        </label>

        {loi && (
          <p role="alert" className="rounded-10 bg-danger-bg px-3 py-2 text-13 text-danger-text">
            {loi}
          </p>
        )}

        <button
          type="submit" disabled={dangGui}
          className="mt-2 rounded-14 bg-accent py-[17px] text-16 font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {dangGui ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  )
}
```

### T7 · Nối route trong `App.tsx` (diff cục bộ)
```tsx
// import thêm
import DangNhap from './features/auth/DangNhap.tsx'
import RequireAuth from './features/auth/RequireAuth.tsx'

// Routes mới
<Routes>
  <Route path="/dang-nhap" element={<DangNhap />} />
  <Route element={<RequireAuth />}>
    {MAN_HINH.map((m) => (
      <Route key={m.path} path={m.path} element={<Stub ten={m.ten} moc={m.moc} />} />
    ))}
    <Route path="/dev/tokens" element={<TokenSheet />} />
    <Route path="*" element={<Stub ten="Không tìm thấy trang" moc="—" />} />
  </Route>
</Routes>
```
Cập nhật comment đầu file: thêm 1 dòng "Auth: mọi route trừ `/dang-nhap` bọc trong `RequireAuth` (MB-10)".

### T8 · Build + lint + test
`npm run build` · `npm run lint` · `npm test` → cả 3 xanh (test kỳ vọng 58 + 9 = 67).

### T9 · Kiểm chứng thật bằng trình duyệt (`npm run dev` + Chrome headless/CDP)
- Vào `/` khi chưa đăng nhập → bị đẩy về `/dang-nhap` (state.from = `/`).
- Submit rỗng → lỗi validate, **không** có request mạng.
- Sai mật khẩu → câu chung; đúng (EMAIL/PASSWORD trong `.env.local`) → về `/`, reload vẫn giữ session.
- Chụp light + dark để đối chiếu token. Tắt dev server + Chrome sau khi xong.

### T10 · Cập nhật memory-bank
`activeContext.md` (đóng câu hỏi mở #1, việc kế tiếp = App shell), `progress.md` (mục Auth UI ✅, M2b còn 3 mục),
`decisionLog.md` (MB-16: layout Phương án A + 3 quyết định đã chốt: không Đăng xuất, về `/`, không "Ghi nhớ").

---

## 4. Edge cases đã thống nhất ở Bước 1 (soát lại ở Bước 4)

- [x] Rỗng / email sai định dạng → báo ngay, 0 request.
- [x] `Invalid login credentials` → 1 câu chung, không lộ sai email hay mật khẩu.
- [x] 429 → báo đợi; lỗi mạng → báo kiểm tra mạng.
- [x] Đang gửi → nút disabled, chặn bấm đúp; lỗi thì giữ nguyên giá trị đã nhập.
- [x] Chưa biết session → render null (không nhấp nháy). Session hết hạn → tự về `/dang-nhap`.
- [x] Đã đăng nhập vào `/dang-nhap` → về `/`. Đăng nhập xong → về `state.from`.
- [x] Không hex trong component; không icon; dark mode theo token.
