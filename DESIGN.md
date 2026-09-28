# DESIGN.md — M19: Pinyin mặt sau Flashcard · Trạng thái rỗng/loading/lỗi · Nút Đăng xuất

> Kiến trúc + kế hoạch của RIÊNG task này (thay nội dung M18 đã xong, M18 đã ghi vào memory-bank MB-39).
> Ngày lập: 2026-09-28 · Trạng thái: **✅ DESIGN + PLAN ĐÃ DUYỆT · ĐÃ XONG 2026-09-28** (xem §H)
> ⚠️ Phần B và C **không có mockup** (mockup chỉ có "15 Import trống") ⇒ layout dưới đây là ĐỀ XUẤT,
> dựng từ token + pattern có sẵn (`KhungThongBao` của Player, card `rounded-20 border-border-card`).

---

## A. Flashcard — mặt sau LUÔN hiện phiên âm

**Hiện trạng:** `src/features/player/bai/Flashcard.tsx:67` — mặt sau cũng bọc `hienPhienAm && vocab.pinyin`.

**Thay đổi:** mặt sau chỉ còn điều kiện `vocab.pinyin` (từ tiếng Anh không có pinyin ⇒ vẫn không hiện gì).
Mặt trước giữ nguyên: nút 拼 vẫn bật/tắt phiên âm như cũ.

- Không đổi `ExerciseShell`, không đổi state `hienPhienAm` của Player ⇒ các màn bài khác không bị ảnh hưởng.
- Task UI thuần (không logic) ⇒ không bắt buộc TDD; kiểm bằng CDP: tắt 拼 → lật thẻ → pinyin vẫn hiện.

---

## B. Trạng thái rỗng / loading / lỗi

### B1. Hiện trạng (đã rà từng màn)

| Màn | Loading | Rỗng | Lỗi | Vấn đề thật |
|---|---|---|---|---|
| Dashboard | ✅ khối xám | 1 dòng chữ ở Khu vườn | banner đỏ + Thử lại | lộ `error.message` tiếng Anh ("Failed to fetch") |
| Chọn chủ đề | ✅ | 1 dòng chữ, không có nút đi Import | banner đỏ + Thử lại | như trên |
| Từ vựng | ✅ | 1 dòng chữ | banner đỏ + "Đóng" | 🔴 **Lỗi tải lần đầu ⇒ khung xám nhấp nháy MÃI** cạnh banner, không có Thử lại |
| Cài đặt | ✅ | — | banner chỉ nằm TRONG nhánh đã có dữ liệu | 🔴 **Lỗi tải lần đầu ⇒ kẹt skeleton VĨNH VIỄN**, không thấy lỗi |
| Lịch sử | ❌ **không có** | — | banner đỏ, không Thử lại | 🔴 **Đang tải hiện "0 ruby" + lịch trống** ⇒ trông như mất dữ liệu |
| Tổng kết | ✅ | — | khung đỏ | 🔴 **Ngõ cụt**: không Thử lại, không nút thoát (route ngoài AppShell, không có menu) |
| Panel Thông báo | ✅ | 1 dòng chữ | chữ đỏ, không Thử lại | nhẹ |
| Player | ✅ | ✅ `KhungThongBao` | ✅ Thử lại + Về Dashboard | **Không đụng** — đã đúng |
| Import · Ngữ pháp chủ đề · Hội thoại kết thúc | có mockup / tự chuyển tiếp | | | **Không đụng** |

### B2. Hệ thống dùng chung (file mới `src/components/TrangThai.tsx`, 3 component trình bày thuần)

**`KhungRong`**: `{ icon, tieuDe, moTa?, hanhDong? }`
```
┌──────────────────────────────────────┐   card rounded-20, border-border-card,
│              ( 🌱 )                   │   bg-surface-card, căn giữa, py-10
│        Khu vườn còn trống            │   icon trong vòng tròn 56px bg-accent-tint
│  Import bộ từ đầu tiên để bắt đầu    │   tiêu đề font-display 17–18 bold
│  gieo hạt nhé.                       │   mô tả text-13/14 content-muted
│        [ Đi tới Import ]             │   CTA tím (Link, không phải nút giả)
└──────────────────────────────────────┘
```
Icon: **`IconCay stage="new"` (hạt giống)** cho mọi chỗ "chưa có từ/chủ đề", đúng ẩn dụ cây; Thông báo dùng
icon chuông `thong-bao` có sẵn. **Không vẽ icon mới.** Có biến thể `gon` (compact, py-6, không viền) để đặt
trong cột hẹp (cột chủ đề Từ vựng, panel Thông báo).

**`KhungLoi`**: `{ tieuDe, loi, onThuLai, phu? }`. Dùng khi **tải lần đầu thất bại, chưa có gì để hiện**.
```
┌──────────────────────────────────────┐   card giống KhungRong
│              ( ⚠ )                    │   icon `canh-bao` trong vòng tròn bg-danger-bg / text-danger-text (Q1: ĐỎ)
│      Chưa tải được chủ đề            │
│  Không kết nối được máy chủ. Kiểm    │   câu đã "dịch" (B3)
│  tra mạng rồi thử lại nhé.           │
│   [ Thử lại ]   [ Về Dashboard ]     │   Thử lại = tím · nút phụ (tuỳ màn) = NUT_PHU
└──────────────────────────────────────┘
```

**`BangLoi`**: `{ loi, onDong?, onThuLai? }`. Banner 1 dòng cho lỗi **thao tác** khi màn ĐÃ có dữ liệu
(lưu cài đặt, xoá từ, vá ngày…). Giữ vị trí + **giữ nguyên màu đỏ** của banner hiện tại
(`border-danger bg-danger-bg text-danger-text`), chỉ đổi sang component chung.

**Skeleton:** giữ `animate-pulse bg-surface-sunken` như hiện tại (không đổi các màn đang ổn). Chỉ **thêm** cho
Lịch sử: 1 pill ruby xám + 1 card tháng có lưới 7×5 ô xám, đúng hình lưới lịch thật.

### B3. Hàm thuần `dichLoiTai(e)` ở `src/lib/loi.ts` (TDD)

Chỉ dịch **các mẫu kỹ thuật đã biết**; **mọi thông điệp khác trả NGUYÊN VĂN** vì `raise exception` trong SQL
(`va_ngay`, `xoa_chu_de`, `import_topic`) đã là tiếng Việt, đúng nguyên nhân (cùng tinh thần `dichLoiImport`).

| Mẫu nhận diện | Câu hiện ra |
|---|---|
| `Failed to fetch` · `NetworkError` · `Load failed` · `fetch failed` | Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé. |
| `JWT expired` · code `PGRST301` · status 401 | Phiên đăng nhập đã hết hạn. Tải lại trang để đăng nhập lại nhé. |
| code `42501` · status 403 | Tài khoản không có quyền với dữ liệu này. |
| rỗng / không phải chuỗi | Đã có lỗi không rõ nguyên nhân. Thử lại nhé. |
| còn lại | nguyên văn |

Nhận vào `unknown` (Error, PostgrestError `{message, code}`, chuỗi) ⇒ không ném. Dự kiến ~7 ca test.

### B4. Áp dụng theo màn

| Màn | Thay đổi |
|---|---|
| Dashboard | Lỗi → `KhungLoi`. Khu vườn khi 0 từ → `KhungRong gon` + CTA "Đi tới Import". Phần còn lại giữ nguyên. |
| Chọn chủ đề | Lỗi → `KhungLoi` (+ "Về Dashboard"). Rỗng → `KhungRong` + CTA Import. |
| Từ vựng | 🔴 Tách 2 loại lỗi: **lỗi tải** (chưa có `chuDe`) → `KhungLoi` + Thử lại thay cho skeleton kẹt; **lỗi thao tác** → `BangLoi` như cũ. Cột chủ đề rỗng → `KhungRong gon` + CTA Import. Danh sách từ rỗng: giữ chữ, riêng "không tìm thấy" thêm nút "Xoá tìm kiếm". |
| Cài đặt | 🔴 Lỗi tải lần đầu → `KhungLoi` (hết kẹt skeleton). Lỗi lưu → `BangLoi`. |
| Lịch sử | 🔴 Thêm skeleton khi chưa có `vi` + tháng đầu. Lỗi tải → `KhungLoi`; lỗi vá ngày → `BangLoi`. |
| Tổng kết | 🔴 Lỗi → `KhungLoi` + "Thử lại" (nạp lại số liệu) + "Về Dashboard". RPC `chot_nhat_ky_ngay` không gọi lại (đã idempotent, nhưng không cần). |
| Panel Thông báo | Lỗi → `BangLoi` có Thử lại; rỗng → `KhungRong gon` icon chuông. |

**Nguyên tắc "không ảnh hưởng chức năng sẵn có":** chỉ thay **nhánh render** rỗng/loading/lỗi; KHÔNG sửa
query, reducer, luồng điều hướng, hay nhánh có dữ liệu. Thử lại gọi lại đúng hàm `nap()` sẵn có của màn.

---

## C. Đăng xuất: 2 mức (Q2)

### C0. Vị trí & giao diện
Màn **Cài đặt**, nhóm mới **"Tài khoản"** ở CUỐI cột phải (sau "Thông báo") ⇒ PC lẫn Mobile đều tới được.
Không đặt vào sidebar/header (tránh bấm nhầm, giữ đúng mockup).
```
TÀI KHOẢN
Đang đăng nhập            nguyenhuu…@gmail.com   ← Q3: CÓ hiện email (đọc từ session local, 0 request)
[ Đăng xuất ]                                    ← nút viền trung tính, KHÔNG tím (không phải hành động chính)
Đăng xuất khỏi mọi thiết bị ›                    ← link chữ nhỏ, content-muted
```

### C1. Đăng xuất thiết bị này
Bấm → `HopXacNhan` sẵn có: *"Đăng xuất khỏi thiết bị này? Giao diện & âm thanh đã chọn trên máy này vẫn được
giữ."* → `supabase.auth.signOut({ scope: 'local' })` → `navigate('/dang-nhap', { replace: true, state:
{ thongBao: 'Đã đăng xuất khỏi thiết bị này.' } })`.

1. ⭐ **`scope: 'local'` tường minh**: mặc định supabase-js là `global` ⇒ đăng xuất trên PC sẽ **đá luôn điện thoại**.
2. Điều hướng **không kèm `state.from`** ⇒ đăng nhập lại vào **Dashboard**, không quay về Cài đặt.
3. Mất mạng: đã đọc mã `@supabase/auth-js` đang cài (`GoTrueClient._signOut`), khi lỗi mạng nó **VẪN xoá phiên
   cục bộ** rồi mới trả `error` ⇒ với `local` luôn điều hướng về `/dang-nhap`, bỏ qua `error`.
4. Khoá `vb-giao-dien`, `vb-am-thanh` (localStorage theo thiết bị) **giữ nguyên**; chỉ phiên `sb-*` bị xoá.
5. `HopXacNhan` thêm prop **tuỳ chọn** `nhanDangChay` (mặc định `'Đang xoá…'` như cũ ⇒ 3 chỗ đang dùng không
   đổi); ở đây truyền `'Đang đăng xuất…'`. Nút khoá trong lúc chạy (đã có sẵn qua `dangChay`).

### C2. Đăng xuất mọi thiết bị: yêu cầu nhập mật khẩu (MỚI theo Q2)
Supabase **không có API "kiểm tra mật khẩu"** ⇒ xác minh bằng `signInWithPassword({ email của phiên hiện tại,
mật khẩu vừa nhập })`. Đúng ⇒ `signOut({ scope: 'global' })` thu hồi **mọi refresh token** của tài khoản.

**Hộp `HopDangXuatMoiNoi`** (`<dialog>` native, cùng khung/kiểu `HopXacNhan`, file mới `features/settings/`):
```
┌ Đăng xuất khỏi mọi thiết bị ─────────────┐
│ Mọi thiết bị đang đăng nhập, kể cả máy   │
│ này, sẽ bị đăng xuất. Máy khác tự thoát  │
│ chậm nhất sau khoảng 60 phút.            │
│ Mật khẩu  [••••••••            ]         │   type=password, autocomplete=current-password,
│ (lỗi đỏ hiện ngay dưới ô)                │   autoFocus; Enter = gửi (form submit)
│ [ Hủy ]          [ Đăng xuất tất cả ]    │   nút xác nhận bg-danger như HopXacNhan
└──────────────────────────────────────────┘
```
**Vì sao "chậm nhất 60 phút":** đã đọc cấu hình Auth của project (READ-ONLY, Management API): `jwt_exp = 3600`.
`global` chỉ thu hồi *refresh token*; access token đã cấp cho máy khác vẫn hợp lệ tới khi hết hạn, lúc đó
supabase-js làm mới thất bại ⇒ phát `SIGNED_OUT` ⇒ `RequireAuth` tự về màn đăng nhập. **Phải nói thật con số
này trên UI**, không hứa "ngay lập tức".

**Hàm thuần mới ở `src/lib/auth.ts` (TDD):**
- `kiemTraMatKhau(mk)`: rỗng ⇒ `'Nhập mật khẩu nhé.'` (**0 request**).
- `dichLoiXacMinh(loi)`: `invalid login credentials` ⇒ **`'Mật khẩu chưa đúng. Thử lại nhé.'`** (email đã biết nên
  nói thẳng "mật khẩu", khác `dichLoiDangNhap` cố ý mập mờ) · 429 / rate limit ⇒ câu đợi vài phút · mạng ⇒ câu
  kiểm tra mạng · còn lại ⇒ câu chung. **Không sửa `dichLoiDangNhap`**.

**Edge case:**
1. Sai mật khẩu ⇒ hộp **vẫn mở**, xoá ô, focus lại, hiện lỗi. Phiên hiện tại **không bị ảnh hưởng** (đăng nhập
   sai không đụng session đang có).
2. Đúng mật khẩu nhưng bước `global` lỗi mạng ⇒ theo mã auth-js, máy này **vẫn mất phiên** mà máy khác **chưa** bị
   thu hồi ⇒ về `/dang-nhap` với `thongBao` **nói rõ**: *"Đã đăng xuất máy này nhưng CHƯA đăng xuất được các thiết
   bị khác (lỗi mạng). Đăng nhập lại rồi thử lại nhé."* Không báo thành công giả.
3. Không đọc được email từ phiên (hiếm) ⇒ ẩn link "mọi thiết bị".
4. Khoá nút + ô nhập khi đang chạy (chống gửi 2 lần ⇒ dính rate limit đăng nhập).
5. Thành công ⇒ `thongBao: 'Đã đăng xuất khỏi mọi thiết bị.'`.

### C3. Màn Đăng nhập: thay đổi nhỏ duy nhất
Đọc thêm `location.state.thongBao` (nếu có) ⇒ 1 dòng thông báo phía trên form (nền `surface-sunken`, chữ
`content-nav`; riêng ca lỗi C2/2 dùng kiểu đỏ `danger`). Không đổi logic đăng nhập, `from`, hay redirect sẵn có.

---

## D. Ngoài phạm vi (không làm)
- Player, Import, Ngữ pháp chủ đề, Hội thoại kết thúc (đã ổn / có mockup).
- Đổi skeleton các màn đang đúng hình. Đổi màu banner lỗi (Q1: giữ đỏ).
- Đổi mật khẩu, xem danh sách thiết bị đang đăng nhập (Supabase client không cung cấp).
- Nút Đăng xuất ở sidebar/header. Màn "hồ sơ tài khoản".

## E. Kiểm chứng dự kiến
`npm test` (+ ca `loi.test.ts`) · `npm run build` · `npm run lint` · CDP PC 1280 + Mobile 390, light + dark:
chặn mạng bằng `Network.setBlockedURLs` (chặn request Supabase ⇒ **0 lệnh ghi DB**, tuân §9.7) để thấy
`KhungLoi` ở 6 màn; bấm Thử lại sau khi gỡ chặn ⇒ dữ liệu hiện lại; Flashcard tắt 拼 vẫn thấy pinyin mặt sau;
Đăng xuất → về `/dang-nhap`, localStorage theme/âm còn nguyên, đăng nhập lại vào `/`.

**Đăng xuất mọi thiết bị:** CDP tự kiểm được ca **sai mật khẩu** (hộp vẫn mở, phiên còn) và ca **ô trống**
(0 request). Ca **thành công** sẽ thu hồi phiên THẬT trên điện thoại/máy khác của bạn ⇒ tôi **không tự chạy**;
sẽ hỏi bạn trước (hoặc bạn tự bấm thử 1 lần).

## F. Đã chốt (2026-09-28)
- **Q1:** màu lỗi **giữ ĐỎ** (`danger-*`) cho cả `KhungLoi` lẫn `BangLoi`.
- **Q2:** "Đăng xuất" = **chỉ thiết bị này**; **thêm** "Đăng xuất khỏi mọi thiết bị" có **nhập mật khẩu** (§C2).
- **Q3:** **có** hiện email cạnh nút Đăng xuất.

---

## G. KẾ HOẠCH (Bước 2): 17 task, mỗi task 2–5 phút

> Trạng thái DESIGN: **✅ ĐÃ DUYỆT 2026-09-28**. Plan: **✅ ĐÃ DUYỆT, ĐÃ THỰC THI** (lệch plan: §H).
> Quy ước: chỉ **diff patch** tại chỗ; thứ tự task = thứ tự thực hiện. Sau mỗi nhóm chạy `npm test` / `npm run build`.

### Nhóm 1: Flashcard (UI thuần)

**T1** · `src/features/player/bai/Flashcard.tsx:67`: bỏ `hienPhienAm &&` ở MẶT SAU (mặt trước dòng 58 giữ nguyên):
```tsx
{vocab.pinyin && <div className="mt-1 text-14 text-content-muted">{vocab.pinyin}</div>}
```
Cập nhật comment đầu file thêm dòng: `M19: mặt sau LUÔN hiện pinyin; nút 拼 chỉ điều khiển mặt trước.`

### Nhóm 2: Hàm thuần (TDD RED → GREEN)

**T2 RED** · file mới `src/lib/loi.test.ts`. Chạy `npx vitest run src/lib/loi.test.ts` ⇒ phải ĐỎ (chưa có `loi.ts`).
```ts
import { describe, expect, it } from 'vitest'
import { dichLoiTai, LOI_CHUNG, LOI_HET_PHIEN, LOI_MANG, LOI_QUYEN } from './loi.ts'

describe('dichLoiTai', () => {
  it('L1 mất mạng — thông điệp của Chrome / Firefox / Safari / Node', () => {
    for (const m of ['TypeError: Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed', 'fetch failed'])
      expect(dichLoiTai({ message: m })).toBe(LOI_MANG)
  })
  it('L2 nhận cả Error thật lẫn chuỗi trần (state các màn đang lưu error.message)', () => {
    expect(dichLoiTai(new TypeError('Failed to fetch'))).toBe(LOI_MANG)
    expect(dichLoiTai('Failed to fetch')).toBe(LOI_MANG)
  })
  it('L3 hết phiên — JWT expired / PGRST301 / 401', () => {
    expect(dichLoiTai('JWT expired')).toBe(LOI_HET_PHIEN)
    expect(dichLoiTai({ message: 'x', code: 'PGRST301' })).toBe(LOI_HET_PHIEN)
    expect(dichLoiTai({ message: 'Unauthorized', status: 401 })).toBe(LOI_HET_PHIEN)
  })
  it('L4 không có quyền — 42501 (cả khi chỉ còn message)', () => {
    expect(dichLoiTai({ message: 'x', code: '42501' })).toBe(LOI_QUYEN)
    expect(dichLoiTai('permission denied for table topics')).toBe(LOI_QUYEN)
  })
  it('L5 lỗi tiếng Việt từ raise exception → giữ NGUYÊN VĂN', () => {
    const m = 'Không đủ ruby để vá ngày này'
    expect(dichLoiTai({ message: m, code: 'P0001' })).toBe(m)
  })
  it('L6 rỗng / null / kiểu lạ → câu chung, KHÔNG ném', () => {
    for (const x of [null, undefined, '', {}, { message: '   ' }, 42]) expect(dichLoiTai(x)).toBe(LOI_CHUNG)
  })
})
```

**T3 GREEN** · file mới `src/lib/loi.ts` (0 import) ⇒ chạy lại T2 phải XANH:
```ts
/**
 * M19 — dịch lỗi TẢI/GHI dữ liệu sang câu tiếng Việt. Hàm thuần, 0 import.
 * CHỈ dịch các mẫu kỹ thuật đã biết; còn lại trả NGUYÊN VĂN vì `raise exception` trong SQL
 * (`va_ngay`, `xoa_chu_de`, `import_topic`) đã là tiếng Việt và đúng nguyên nhân (như `dichLoiImport`).
 * Nhận `unknown`: state các màn đang giữ `error.message` (chuỗi) ⇒ nhận diện theo CẢ message lẫn code.
 */
export const LOI_MANG = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.'
export const LOI_HET_PHIEN = 'Phiên đăng nhập đã hết hạn. Tải lại trang để đăng nhập lại nhé.'
export const LOI_QUYEN = 'Tài khoản không có quyền với dữ liệu này.'
export const LOI_CHUNG = 'Đã có lỗi không rõ nguyên nhân. Thử lại nhé.'

type LoiTho = { message?: unknown; code?: unknown; status?: unknown }

export function dichLoiTai(loi: unknown): string {
  const o: LoiTho = typeof loi === 'string' ? { message: loi } : typeof loi === 'object' && loi !== null ? (loi as LoiTho) : {}
  const msg = typeof o.message === 'string' ? o.message.trim() : ''
  const m = msg.toLowerCase()
  if (['failed to fetch', 'networkerror', 'load failed', 'fetch failed'].some((k) => m.includes(k))) return LOI_MANG
  if (o.code === 'PGRST301' || o.status === 401 || m.includes('jwt expired')) return LOI_HET_PHIEN
  if (o.code === '42501' || o.status === 403 || m.includes('permission denied')) return LOI_QUYEN
  return msg || LOI_CHUNG
}
```

**T4 RED** · thêm vào cuối `src/lib/auth.test.ts` (sửa dòng import thành `import { dichLoiDangNhap, dichLoiXacMinh, kiemTraFormDangNhap, kiemTraMatKhau } from './auth.ts'`) ⇒ ĐỎ:
```ts
describe('kiemTraMatKhau (M19 — đăng xuất mọi thiết bị)', () => {
  it('rỗng → báo nhập, không gọi mạng', () => {
    expect(kiemTraMatKhau('')).toEqual({ ok: false, loi: 'Nhập mật khẩu nhé.' })
  })
  it('KHÔNG trim — mật khẩu được phép chứa khoảng trắng', () => {
    expect(kiemTraMatKhau(' ')).toEqual({ ok: true })
  })
})

describe('dichLoiXacMinh', () => {
  it('sai → nói thẳng "mật khẩu" (email đã biết, khác dichLoiDangNhap)', () => {
    expect(dichLoiXacMinh({ message: 'Invalid login credentials', status: 400 })).toBe('Mật khẩu chưa đúng. Thử lại nhé.')
  })
  it('429 → báo đợi (dùng chung câu của đăng nhập)', () => {
    expect(dichLoiXacMinh({ message: 'Request rate limit reached', status: 429 })).toBe('Thử quá nhiều lần rồi, đợi vài phút rồi thử lại nhé.')
  })
  it('mất mạng → báo kiểm tra mạng', () => {
    expect(dichLoiXacMinh({ message: 'Failed to fetch' })).toBe('Không kết nối được. Kiểm tra mạng rồi thử lại nhé.')
  })
  it('lạ / null → câu chung', () => {
    expect(dichLoiXacMinh({ message: 'boom', status: 500 })).toBe('Chưa xác minh được mật khẩu. Thử lại sau nhé.')
    expect(dichLoiXacMinh(null)).toBe('Chưa xác minh được mật khẩu. Thử lại sau nhé.')
  })
})
```

**T5 GREEN** · thêm vào cuối `src/lib/auth.ts` (**không sửa** 2 hàm cũ) ⇒ XANH:
```ts
/** M19 — ô mật khẩu khi đăng xuất mọi thiết bị. Không trim: mật khẩu có thể chứa khoảng trắng. */
export function kiemTraMatKhau(matKhau: string): KetQuaForm {
  return matKhau ? { ok: true } : { ok: false, loi: 'Nhập mật khẩu nhé.' }
}

/** M19 — lỗi khi XÁC MINH mật khẩu: email đã biết (lấy từ phiên) nên được nói thẳng "mật khẩu". */
export function dichLoiXacMinh(loi: LoiDangNhap): string {
  const m = (loi?.message ?? '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'Mật khẩu chưa đúng. Thử lại nhé.'
  if (loi?.status === 429 || m.includes('rate limit') || m.includes('fetch') || m.includes('network'))
    return dichLoiDangNhap(loi)
  return 'Chưa xác minh được mật khẩu. Thử lại sau nhé.'
}
```

### Nhóm 3: Component dùng chung

**T6** · file mới `src/components/TrangThai.tsx`:
```tsx
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon, IconCay } from './icons.tsx'
import { dichLoiTai } from '../lib/loi.ts'

/**
 * M19 — 3 trạng thái dùng chung (DESIGN.md §B2, KHÔNG có mockup; layout đã duyệt).
 * - KhungRong: chưa có dữ liệu. Icon mặc định = hạt giống (ẩn dụ cây: chưa gieo gì).
 * - KhungLoi: tải LẦN ĐẦU thất bại, chưa có gì để hiện ⇒ Thử lại (+ lối thoát tuỳ màn).
 * - BangLoi: lỗi THAO TÁC khi màn đã có dữ liệu ⇒ banner 1 dòng, giữ nguyên màu đỏ cũ (Q1).
 * `gon`: bản gọn không viền, đặt trong cột hẹp / panel.
 * Câu lỗi luôn đi qua `dichLoiTai` ⇒ không bao giờ lộ "Failed to fetch" tiếng Anh.
 */
type HanhDong = { nhan: string; toi: string }

const NUT_CHINH = 'rounded-12 bg-accent px-5 py-2.5 text-14 font-semibold text-white'
const NUT_PHU = 'rounded-12 bg-border-card px-5 py-2.5 text-14 font-semibold text-content-nav'

function Khung({ gon, children }: { gon?: boolean | undefined; children: ReactNode }) {
  return (
    <div
      className={`flex w-full flex-col items-center gap-2 text-center ${
        gon ? 'px-3 py-6' : 'rounded-20 border border-border-card bg-surface-card px-6 py-10'
      }`}
    >
      {children}
    </div>
  )
}

export function KhungRong({
  icon = <IconCay stage="new" size={26} />,
  tieuDe,
  moTa,
  hanhDong,
  gon,
}: {
  icon?: ReactNode
  tieuDe: string
  moTa?: string | undefined
  hanhDong?: HanhDong | undefined
  gon?: boolean | undefined
}) {
  return (
    <Khung gon={gon}>
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-pill bg-accent-tint text-accent">{icon}</div>
      <p className="font-display text-17 font-bold text-content-primary">{tieuDe}</p>
      {moTa && <p className="max-w-[340px] text-13 text-content-muted md:text-14">{moTa}</p>}
      {hanhDong && (
        <Link to={hanhDong.toi} className={`mt-2 ${NUT_CHINH}`}>
          {hanhDong.nhan}
        </Link>
      )}
    </Khung>
  )
}

export function KhungLoi({
  tieuDe,
  loi,
  onThuLai,
  phu,
  gon,
}: {
  tieuDe: string
  loi: unknown
  onThuLai: () => void
  phu?: HanhDong | undefined
  gon?: boolean | undefined
}) {
  return (
    <div role="alert" className="w-full">
      <Khung gon={gon}>
        <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-pill bg-danger-bg text-danger-text">
          <Icon ten="canh-bao" size={26} />
        </div>
        <p className="font-display text-17 font-bold text-content-primary">{tieuDe}</p>
        <p className="max-w-[340px] text-13 text-content-muted md:text-14">{dichLoiTai(loi)}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <button type="button" onClick={onThuLai} className={NUT_CHINH}>
            Thử lại
          </button>
          {phu && (
            <Link to={phu.toi} className={NUT_PHU}>
              {phu.nhan}
            </Link>
          )}
        </div>
      </Khung>
    </div>
  )
}

export function BangLoi({
  loi,
  tienTo,
  onThuLai,
  onDong,
  className = '',
}: {
  loi: unknown
  tienTo?: string | undefined
  onThuLai?: (() => void) | undefined
  onDong?: (() => void) | undefined
  className?: string
}) {
  const cau = dichLoiTai(loi)
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 rounded-14 border border-danger bg-danger-bg px-4 py-3 text-13 text-danger-text ${className}`}
    >
      <span>{tienTo ? `${tienTo}: ${cau}` : cau}</span>
      <div className="flex shrink-0 items-center gap-3">
        {onThuLai && (
          <button type="button" onClick={onThuLai} className="rounded-10 bg-accent px-3 py-1.5 text-13 font-semibold text-white">
            Thử lại
          </button>
        )}
        {onDong && (
          <button type="button" onClick={onDong} className="font-semibold">
            Đóng
          </button>
        )}
      </div>
    </div>
  )
}
```
**T7** · `src/components/HopXacNhan.tsx`: thêm prop tuỳ chọn, mặc định giữ hành vi cũ:
```tsx
  nhanDangChay?: string            // trong type Props
export default function HopXacNhan({ tieuDe, noiDung, nhanXacNhan = 'Xoá', nhanDangChay = 'Đang xoá…', dangChay, onDong, onXacNhan }: Props) {
            {dangChay ? nhanDangChay : nhanXacNhan}
```
⇒ `npm run build` xanh (3 nơi đang gọi không đổi).

### Nhóm 4: Áp dụng theo màn (CHỈ nhánh rỗng/loading/lỗi; mọi "Thử lại" = `setLoi(null)` rồi gọi lại `nap()` sẵn có ⇒ skeleton hiện lại làm phản hồi)

**T8 Dashboard** · `DashboardPage.tsx`: import `{ KhungLoi, KhungRong } from '../../components/TrangThai.tsx'`.
- Thay khối `if (loi) { … }` (dòng 166–183) bằng:
```tsx
  if (loi) {
    return (
      <KhungTrang>
        <KhungLoi tieuDe="Chưa tải được Dashboard" loi={loi} onThuLai={() => { setLoi(null); void nap() }} />
      </KhungTrang>
    )
  }
```
- Thay nhánh `: ( <div className="rounded-14 border … Chưa có từ nào … Import từ vựng</Link></div> )` (sau `dl.coTu ?`) bằng:
```tsx
          ) : (
            <KhungRong
              tieuDe="Khu vườn còn trống"
              moTa="Import bộ từ đầu tiên để bắt đầu gieo hạt nhé."
              hanhDong={{ nhan: 'Đi tới Import', toi: '/import' }}
            />
          )}
```

**T9 Chọn chủ đề** · `ChonChuDePage.tsx`: import `KhungLoi, KhungRong`.
- Khối `<div role="alert" …>…</div>` trong `if (loi)` → `<KhungLoi tieuDe="Chưa tải được danh sách chủ đề" loi={loi} onThuLai={() => { setLoi(null); void nap() }} phu={{ nhan: 'Về Dashboard', toi: '/' }} />`.
- `<p …>Chưa có chủ đề nào — hãy import bộ từ đầu tiên.</p>` → `<KhungRong tieuDe="Chưa có chủ đề nào" moTa="Import bộ từ đầu tiên để bắt đầu gieo hạt nhé." hanhDong={{ nhan: 'Đi tới Import', toi: '/import' }} />`.

**T10 Cài đặt** · `CaiDatPage.tsx`: import `KhungLoi, BangLoi`.
- Trong `if (!cd)`: thay khối skeleton bằng `{loi ? <KhungLoi tieuDe="Chưa tải được cài đặt" loi={loi} onThuLai={() => { setLoi(null); void nap() }} /> : ( …skeleton cũ… )}` ⇒ **hết kẹt skeleton vĩnh viễn**.
- Banner `{loi && (<div role="alert" …>Không lưu được: {loi} … Thử lại …</div>)}` → `{loi && <BangLoi tienTo="Không lưu được" loi={loi} onThuLai={() => void nap()} className="mb-4" />}`.

**T11 Lịch sử** · `LichSuPage.tsx`: import `KhungLoi, BangLoi`.
- Thêm trước `const rubyCon`:
```tsx
  /** M19 — thử lại ĐÚNG phần còn thiếu (ví + các tháng chưa tải được). */
  function napLai() {
    setLoi(null)
    if (!vi) void napVi()
    for (const t of thangs) if (!duLieu[t]) void napThang(t)
  }
  // Lỗi khi CHƯA có ví hoặc tháng đầu ⇒ không có gì đáng tin để hiện (tránh "0 ruby" giả)
  const loiTai = loi !== null && (vi === null || !duLieu[thangs[0]!])
```
- Ngay trước `return (` chính:
```tsx
  if (loiTai) {
    return (
      <KhungTrang rong={960}>
        <h1 className="mb-5 font-display text-22 font-bold text-content-primary md:text-24">Lịch sử học</h1>
        <KhungLoi tieuDe="Chưa tải được lịch sử học" loi={loi} onThuLai={napLai} phu={{ nhan: 'Về Dashboard', toi: '/' }} />
      </KhungTrang>
    )
  }
```
- Ví ruby: bọc `{vi ? ( …pill cũ… ) : <div className="h-8 w-24 animate-pulse rounded-pill bg-surface-sunken" />}`.
- Banner `{loi && (<div role="alert" …>{loi}</div>)}` → `{loi && <BangLoi loi={loi} onDong={() => setLoi(null)} onThuLai={thangs.some((t) => !duLieu[t]) ? napLai : undefined} className="mb-4" />}` (lỗi `va_ngay` tiếng Việt vẫn hiện nguyên văn).
- Lưới tháng: thay `{luoi.map(…)}` bằng `{duLieu[thang] ? luoi.map(…cũ…) : Array.from({ length: 35 }, (_, i) => (<div key={i} className="flex flex-col items-center gap-1 py-1"><span className="h-[26px] w-[26px] animate-pulse rounded-pill bg-surface-sunken" /><span className="h-2.5 w-3 animate-pulse rounded-8 bg-surface-sunken" /></div>))}` (hàng tiêu đề T2…CN giữ nguyên).

**T12 Tổng kết** · `TongKetPage.tsx`: import `useCallback` + `KhungLoi`.
- Đổi effect nạp số liệu (IIFE) thành hàm gọi lại được, **thân hàm giữ nguyên từng dòng**:
```tsx
  const nap = useCallback(async () => {
    const homNay = homNayVN(new Date())
    const [logRes, dueRes, retryRes] = await Promise.all([ …y nguyên… ])
    … y nguyên … setDl({ tk, tu, conCho: demConCho(due, retryIds), soRetry: retryIds.length, homNay })
  }, [])

  useEffect(() => {
    void nap()
  }, [nap])
```
- `if (loi)`: thay `<div role="alert" …>Không tải được tổng kết: {loi}</div>` bằng `<div className="w-full max-w-[480px]"><KhungLoi tieuDe="Chưa tải được tổng kết" loi={loi} onThuLai={() => { setLoi(null); void nap() }} phu={{ nhan: 'Về Dashboard', toi: '/' }} /></div>`.
- **Không đụng** 2 effect `chot_nhat_ky_ngay` + âm `hoan_thanh` (Thử lại KHÔNG gọi lại RPC, KHÔNG phát lại âm).

**T13 Từ vựng** · `TuVungPage.tsx`: import `KhungLoi, KhungRong, BangLoi`. Tách **lỗi tải** khỏi **lỗi thao tác**:
- Thêm state: `const [loiChuDe, setLoiChuDe] = useState<string | null>(null)` và `const [loiTu, setLoiTu] = useState<string | null>(null)`.
- `napChuDe`: `if (e) return setLoi(e.message)` → `if (e) return setLoiChuDe(e.message)`; thêm `setLoiChuDe(null)` trước `setChuDe(`.
- `napTu`: thêm `setLoiTu(null)` cạnh `setTu(null)` đầu hàm; 3 chỗ `setLoi(lk.error…/vRes.error…/wRes.error…)` → `setLoiTu(…)`. Các `setLoi` trong `luuSua/hoiXoaTu/chay/doiTen` **giữ nguyên**.
- Banner thao tác → `{loi && <BangLoi loi={loi} onDong={() => setLoi(null)} className="mx-[22px] mb-3 md:mx-8" />}`.
- Cột chủ đề: `!chuDe ? [skeleton]` → `!chuDe ? (loiChuDe ? <KhungLoi gon tieuDe="Chưa tải được chủ đề" loi={loiChuDe} onThuLai={() => { setLoiChuDe(null); void napChuDe() }} /> : [skeleton cũ])`; `<p>Chưa có chủ đề nào…</p>` → `<KhungRong gon tieuDe="Chưa có chủ đề nào" moTa="Import bộ từ đầu tiên để bắt đầu gieo hạt nhé." hanhDong={{ nhan: 'Đi tới Import', toi: '/import' }} />`.
- Danh sách từ: `!tu ? ([skeleton])` → `!tu ? (loiTu ? <KhungLoi gon tieuDe="Chưa tải được từ vựng" loi={loiTu} onThuLai={() => { if (topicId) void napTu(topicId) }} /> : [skeleton cũ])`; ca "Không tìm thấy từ nào khớp." thêm nút:
```tsx
<div className="flex items-center gap-3">
  <p className="text-14 text-content-muted">Không tìm thấy từ nào khớp.</p>
  <button type="button" onClick={() => { setTuKhoa(''); setLocStage(TAT_CA) }} className="text-13 font-semibold text-accent">Bỏ lọc</button>
</div>
```

**T14 Panel Thông báo** · `PanelThongBao.tsx`: import `BangLoi, KhungRong`.
- `{loi && (<p role="alert" …>Không tải được thông báo: {loi}</p>)}` → `{loi && <BangLoi loi={loi} onThuLai={() => { setLoi(null); void nap() }} className="m-3" />}`.
- `{!loi && ds?.length === 0 && <p …>Chưa có thông báo nào.</p>}` → `{!loi && ds?.length === 0 && <KhungRong gon icon={<Icon ten="thong-bao" size={24} />} tieuDe="Chưa có thông báo nào" moTa="Khi hàng đợi từ mới sắp cạn, VocaBloom sẽ nhắc bạn ở đây." />}`.

### Nhóm 5: Đăng xuất

**T15** · file mới `src/features/settings/HopDangXuatMoiNoi.tsx`:
```tsx
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { dichLoiXacMinh, kiemTraMatKhau } from '../../lib/auth.ts'
import { supabase } from '../../lib/supabase.ts'

/**
 * M19/C2 — đăng xuất MỌI thiết bị, bắt nhập lại mật khẩu. Supabase không có API "kiểm tra mật khẩu"
 * ⇒ xác minh bằng signInWithPassword (sai thì phiên hiện tại KHÔNG bị ảnh hưởng), đúng thì
 * signOut({ scope: 'global' }) thu hồi mọi refresh token.
 * ⚠️ `global` KHÔNG giết access token đã cấp: máy khác còn dùng được tới khi token hết hạn —
 * project đang đặt `jwt_exp = 3600` (đọc 2026-09-28) ⇒ câu "chậm nhất 60 phút" phải khớp số này.
 * auth-js (GoTrueClient._signOut) luôn xoá phiên CỤC BỘ kể cả khi lỗi mạng ⇒ lỗi ở bước global
 * nghĩa là "máy này đã thoát, máy khác CHƯA" — báo thật qua `onXong('loi_thu_hoi')`.
 */
const PHUT_HET_HAN_PHIEN = 60

const LOP_INPUT =
  'rounded-8 border border-border-card bg-surface-card px-3 py-[9px] text-14 text-content-primary focus:border-accent focus:outline-none disabled:opacity-60'

type Props = { email: string; onDong: () => void; onXong: (kq: 'ok' | 'loi_thu_hoi') => void }

export default function HopDangXuatMoiNoi({ email, onDong, onXong }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const oNhap = useRef<HTMLInputElement>(null)
  const [matKhau, setMatKhau] = useState('')
  const [loi, setLoi] = useState<string | null>(null)
  const [dangChay, setDangChay] = useState(false)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  async function gui(e: FormEvent) {
    e.preventDefault()
    if (dangChay) return
    const kq = kiemTraMatKhau(matKhau)
    if (!kq.ok) {
      setLoi(kq.loi)
      oNhap.current?.focus()
      return
    }
    setLoi(null)
    setDangChay(true)
    const xacMinh = await supabase.auth.signInWithPassword({ email, password: matKhau })
    if (xacMinh.error) {
      setDangChay(false)
      setMatKhau('')
      setLoi(dichLoiXacMinh(xacMinh.error))
      // ô đang disabled trong lúc chạy ⇒ đợi frame sau (đã bật lại) mới focus được
      requestAnimationFrame(() => oNhap.current?.focus())
      return
    }
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    onXong(error ? 'loi_thu_hoi' : 'ok')
  }

  return (
    <dialog
      ref={ref}
      onClose={onDong}
      onCancel={(e) => dangChay && e.preventDefault()}
      onClick={(e) => e.target === ref.current && !dangChay && ref.current?.close()}
      className="m-auto w-[min(420px,calc(100vw-32px))] rounded-20 bg-surface-raised p-0 backdrop:bg-[rgb(36_27_58_/_0.35)]"
    >
      <form onSubmit={gui} noValidate className="flex flex-col gap-3 p-6">
        <h2 className="font-display text-18 font-bold text-content-primary">Đăng xuất khỏi mọi thiết bị</h2>
        <p className="text-14 text-content-nav">
          Mọi thiết bị đang đăng nhập, kể cả máy này, sẽ bị đăng xuất. Máy khác tự thoát chậm nhất sau
          khoảng {PHUT_HET_HAN_PHIEN} phút.
        </p>
        <label className="flex flex-col gap-1">
          <span className="text-12 font-semibold text-content-muted">Mật khẩu</span>
          <input
            ref={oNhap}
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            value={matKhau}
            disabled={dangChay}
            onChange={(e) => setMatKhau(e.target.value)}
            aria-invalid={loi ? true : undefined}
            className={LOP_INPUT}
          />
        </label>
        {loi && (
          <p role="alert" className="text-13 text-danger-text">
            {loi}
          </p>
        )}
        <div className="mt-2 flex gap-2.5">
          <button
            type="button"
            disabled={dangChay}
            onClick={() => ref.current?.close()}
            className="flex-1 rounded-12 bg-border-card py-3 text-14 font-semibold text-content-nav disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={dangChay}
            className="flex-1 rounded-12 bg-danger py-3 text-14 font-semibold text-white disabled:opacity-60"
          >
            {dangChay ? 'Đang đăng xuất…' : 'Đăng xuất tất cả'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
```

**T16** · file mới `src/features/settings/NhomTaiKhoan.tsx` + gắn vào `CaiDatPage.tsx` (sau `<Nhom ten="Thông báo">…</Nhom>`, cùng cột phải):
```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import HopXacNhan from '../../components/HopXacNhan.tsx'
import { supabase } from '../../lib/supabase.ts'
import HopDangXuatMoiNoi from './HopDangXuatMoiNoi.tsx'
import { GIA_TRI, HANG, NHAN } from './kieu.ts'

/**
 * M19 — nhóm "Tài khoản" (KHÔNG có mockup; layout duyệt ở DESIGN.md §C0).
 * Email đọc từ phiên CỤC BỘ (getSession, 0 request). Điều hướng về /dang-nhap TƯỜNG MINH, không
 * kèm `from` ⇒ đăng nhập lại vào Dashboard chứ không quay về Cài đặt.
 * (react-router 8: `navigate` vẫn chạy dù RequireAuth đã gỡ màn này lúc nhận SIGNED_OUT.)
 */
export default function NhomTaiKhoan() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)
  const [hoi, setHoi] = useState<'may_nay' | 'moi_noi' | null>(null)
  const [dangChay, setDangChay] = useState(false)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null))
  }, [])

  function veDangNhap(thongBao: string, loaiThongBao: 'tin' | 'loi' = 'tin') {
    navigate('/dang-nhap', { replace: true, state: { thongBao, loaiThongBao } })
  }

  async function dangXuatMayNay() {
    setDangChay(true)
    // `local` TƯỜNG MINH — mặc định supabase-js là `global` (đá luôn điện thoại). Lỗi mạng vẫn xoá
    // phiên cục bộ (GoTrueClient._signOut) ⇒ không cần xét `error`.
    await supabase.auth.signOut({ scope: 'local' })
    veDangNhap('Đã đăng xuất khỏi thiết bị này.')
  }

  return (
    <>
      <div className={HANG}>
        <span className={NHAN}>Đang đăng nhập</span>
        <span className={`${GIA_TRI} min-w-0 truncate`}>{email ?? '—'}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setHoi('may_nay')}
          className="rounded-10 border border-border-card bg-surface-card px-4 py-2.5 text-14 font-semibold text-content-primary hover:bg-surface-sunken"
        >
          Đăng xuất
        </button>
        {email && (
          <button
            type="button"
            onClick={() => setHoi('moi_noi')}
            className="text-13 font-semibold text-content-muted hover:text-content-primary"
          >
            Đăng xuất khỏi mọi thiết bị ›
          </button>
        )}
      </div>

      {hoi === 'may_nay' && (
        <HopXacNhan
          tieuDe="Đăng xuất khỏi thiết bị này?"
          noiDung="Giao diện và âm thanh đã chọn trên máy này vẫn được giữ. Các thiết bị khác không bị ảnh hưởng."
          nhanXacNhan="Đăng xuất"
          nhanDangChay="Đang đăng xuất…"
          dangChay={dangChay}
          onDong={() => setHoi(null)}
          onXacNhan={() => void dangXuatMayNay()}
        />
      )}
      {hoi === 'moi_noi' && email && (
        <HopDangXuatMoiNoi
          email={email}
          onDong={() => setHoi(null)}
          onXong={(kq) =>
            kq === 'ok'
              ? veDangNhap('Đã đăng xuất khỏi mọi thiết bị.')
              : veDangNhap(
                  'Đã đăng xuất máy này nhưng CHƯA đăng xuất được các thiết bị khác (lỗi mạng). Đăng nhập lại rồi thử lại nhé.',
                  'loi',
                )
          }
        />
      )}
    </>
  )
}
```
Trong `CaiDatPage.tsx`: `import NhomTaiKhoan from './NhomTaiKhoan.tsx'` và
```tsx
        <Nhom ten="Tài khoản">
          <NhomTaiKhoan />
        </Nhom>
```

**T17** · `src/features/auth/DangNhap.tsx`: thay dòng `const ve = …` bằng
```tsx
  const st = location.state as { from?: string; thongBao?: string; loaiThongBao?: 'tin' | 'loi' } | null
  const ve = st?.from ?? '/'
```
và chèn ngay sau khối tiêu đề `VocaBloom / Đăng nhập để tiếp tục ôn tập`:
```tsx
        {st?.thongBao && (
          <p
            role="status"
            className={`rounded-10 px-3 py-2.5 text-13 ${
              st.loaiThongBao === 'loi' ? 'border border-danger bg-danger-bg text-danger-text' : 'bg-surface-sunken text-content-nav'
            }`}
          >
            {st.thongBao}
          </p>
        )}
```
Sửa comment đầu file: "Đăng xuất nằm ở màn Cài đặt (M19); màn này chỉ hiện thông báo sau khi đăng xuất."

### Nhóm 6: Kiểm chứng (Bước 3 cuối) + ký ức (Bước 4)

**T18** · `npm test` (≥ 384 + 6 + 6 ca) · `npm run build` · `npm run lint` (0 lỗi mới).
**T19** · CDP (Chrome headless + `npm run dev`), PC 1280 + Mobile 390, light + dark, script ở scratchpad:
1. Đăng nhập qua UI bằng `EMAIL/PASSWORD` của `.env.local`.
2. **Lỗi:** `Network.setBlockedURLs(['*/rest/v1/*'])` ⇒ vào `/`, `/on-tap/chu-de`, `/tu-vung`, `/cai-dat`, `/lich-su`,
   `/on-tap/tong-ket` ⇒ đủ 6 `KhungLoi`, không chuỗi "Failed to fetch" nào trên trang. Gỡ chặn → Thử lại ⇒ dữ liệu
   hiện. Chặn toàn bộ REST ⇒ **0 lệnh ghi DB** (kể cả `chot_nhat_ky_ngay`) — đúng luật §9.7.
3. **Rỗng:** `Fetch.enable` chặn GET `rest/v1/topics|word_state|vocab_topics|notifications` trả `[]` (chỉ CHẶN ĐỌC,
   không ghi) ⇒ `KhungRong` ở Dashboard, Chọn chủ đề, Từ vựng, panel Thông báo.
4. **Skeleton Lịch sử:** trì hoãn phản hồi `vi_ruby` ⇒ thấy khối xám thay vì "0 ruby".
5. **Flashcard:** trang kiểm thử tạm (không đăng nhập, như M17) gắn `Flashcard` với `hienPhienAm={false}` ⇒ mặt trước
   không pinyin, lật ⇒ mặt sau CÓ pinyin. Xoá 2 file tạm sau khi đo.
6. **Đăng xuất máy này:** → `/dang-nhap` + dòng thông báo; `localStorage` còn `vb-giao-dien`/`vb-am-thanh`, mất `sb-*`;
   đăng nhập lại ⇒ vào `/`. (Chỉ đụng phiên của Chrome headless.)
7. **Mọi thiết bị:** ô trống ⇒ lỗi + **0 request auth**; mật khẩu sai ⇒ "Mật khẩu chưa đúng", hộp còn mở, phiên còn.
   **Ca thành công KHÔNG tự chạy** (sẽ đá phiên thật trên máy khác của bạn), hỏi bạn trước.
**T20** · Bước 4: tự review theo DESIGN.md · cập nhật `activeContext.md`, `progress.md` (sửa luôn dòng "Cập nhật lần
cuối" đang sai), `decisionLog.md` (MB-40), `systemPatterns.md` (§7: pattern `TrangThai` + `dichLoiTai`; luật
scope đăng xuất) · tắt dev server + Chrome headless.

---

## H. Kết quả thực thi (2026-09-28)

**Lệch plan, 1 điểm, phát hiện khi kiểm thật:** đăng xuất máy này về `/dang-nhap` nhưng **mất dòng thông báo** và
đăng nhập lại quay về `/cai-dat`. Đo bằng CDP (bọc `history.replaceState`): `replaceState(thongBao)` của màn Cài
đặt chạy TRƯỚC, rồi `<Navigate state={{from:'/cai-dat'}}>` của `RequireAuth` **ghi đè 2 lần**. Nguyên nhân:
react-router 8 đổi location trong `startTransition` ⇒ `setTt('khong')` (ưu tiên cao hơn) render trước với location cũ.
⇒ Thêm `src/features/auth/dangXuat.ts`: cờ "đăng xuất chủ động", bật ngay TRƯỚC `signOut` (cả `local` lẫn `global`,
riêng `global` chỉ bật SAU khi mật khẩu đúng); `RequireAuth` thấy cờ thì `return null`; `DangNhap` hạ cờ khi mount.
Phiên hết hạn tự nhiên (cờ tắt) giữ nguyên hành vi cũ: đã kiểm hồi quy (`from=/tu-vung` → đăng nhập lại về `/tu-vung`).
Sửa được ở lần 1.

**Bằng chứng:** `npm test` **396/396** (+12: `loi.test.ts` 6, `auth.test.ts` +6; đã chứng minh L1/L2 đỏ khi phá code) ·
`npm run build` xanh · lint **0 lỗi**, 9 cảnh báo (8 có từ trước + 1 mới `TongKetPage` cùng kiểu `useEffect(() => { void
nap() }, [nap])` mà `LichSuPage`/`PanelThongBao` đã có) · **CDP 36/36 + 2/2 hồi quy**, trong lúc chặn REST
**0 lệnh ghi DB**.

**Chưa kiểm:** ca "Đăng xuất mọi thiết bị" **thành công** (sẽ đá phiên thật trên máy khác), chờ người dùng tự bấm
hoặc cho phép.
