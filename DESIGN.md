# DESIGN.md — M18: Ghép cặp 2 cột bằng nhau + xáo thứ tự từ theo từng dạng bài

> Kiến trúc + kế hoạch của RIÊNG task này (thay nội dung M17 đã xong, M17 đã ghi vào memory-bank MB-38).
> Ngày lập: 2026-09-27 · Trạng thái: **✅ ĐÃ DUYỆT (Q1–Q3 theo đề xuất) · ĐÃ XONG 2026-09-28**

## 1. Hiện trạng (đã đọc code)

### 1a. Ghép cặp — vì sao 2 cột lệch nhau
`Matching.tsx` dựng **2 cột flex ĐỘC LẬP** trong `grid-cols-2`. Mỗi cột tự tính chiều cao theo ô của
chính nó ⇒ 1 nghĩa dài xuống 2 dòng làm **cột phải dài hơn cột trái**, các hàng lệch nhau dần xuống dưới.
Mockup 05 (PC + Mobile) chỉ vẽ nghĩa ngắn 1 dòng nên không lộ vấn đề này.

### 1b. Thứ tự từ — vì sao đoán được
`xepBai()` (`src/lib/player.ts`) duyệt **cùng một mảng `tu`** cho MỌI dạng ⇒ 5 từ a b c d e luôn ra
a b c d e ở flashcard, grammar, selection, audio, fast decision… Bài hội thoại cũng duyệt `baiTap`
theo đúng một thứ tự. `SPECIFICATION.md` §4 **không quy định** thứ tự từ trong 1 dạng (chỉ quy định
thứ tự chọn từ vào session và session thuần 1 stage) ⇒ xáo không trái đặc tả.

## 2. Giải pháp

### 2a. Ghép cặp — dùng CHUNG hàng cho 2 cột
Bỏ 2 cột flex, đặt **cả 10 ô vào 1 lưới duy nhất**, xếp theo cột:
```
grid grid-flow-col grid-cols-2  +  gridTemplateRows: repeat(N, auto)
```
- Hàng i của cột trái và hàng i của cột phải **cao bằng nhau** (= ô cao hơn trong 2 ô). Hàng nào có
  nghĩa dài thì cả hàng giãn ra, ô ngắn hơn **tự giãn theo** và chữ căn giữa theo chiều dọc.
  ⇒ 2 cột **luôn dài bằng nhau**, các hàng thẳng nhau.
- Khoảng cách giữ đúng mockup: ngang 16px, dọc 14px (PC). Padding, bo góc, màu giữ nguyên.
- `grid-flow-col` giữ **thứ tự DOM = cột trái rồi mới tới cột phải** ⇒ phím Tab vẫn đi hết cột trái
  trước, không nhảy qua lại.
- Chữ dài: thêm `break-words` + `min-w-0` để 1 từ tiếng Anh rất dài không làm tràn ô trên Mobile.

```
Trước                          Sau
┌──────┐ ┌──────┐              ┌──────┐ ┌──────┐
│ 苹果 │ │Bạn bè│              │ 苹果 │ │Bạn bè│
├──────┤ ├──────┤              ├──────┤ ├──────┤
│ 学习 │ │Máy   │              │      │ │Máy   │
├──────┤ │tính  │              │ 学习 │ │tính  │
│ 时间 │ │xách  │              │      │ │xách  │
├──────┤ │tay   │              ├──────┤ │tay   │
│ 朋友 │ ├──────┤              │ 时间 │ ├──────┤
└──────┘ │ ...  │              …  (hàng thẳng, 2 cột bằng nhau)
         └──────┘
```

### 2b. Xáo thứ tự từ riêng cho từng dạng
- `xepBai()` nhận thêm tham số **tuỳ chọn** `rng?: () => number` (đúng khuôn `xaoTron`, dễ test).
  Có `rng` ⇒ **mỗi dạng bài xáo 1 lần riêng**; không truyền ⇒ giữ thứ tự cũ ⇒ **toàn bộ test `xepBai`
  cũ không phải sửa**.
- `PlayerPage` truyền `rng: Math.random`.
- **Thứ tự DẠNG BÀI giữ nguyên** (flashcard → grammar → matching → selection → …) — đó là thứ tự đã
  chốt ở M4a (tập dễ trước, khó sau). Chỉ xáo thứ tự **từ** bên trong mỗi dạng.
- Áp cho: mọi dạng 1 từ, 2 dạng hội thoại (xáo các record), 3 dạng tự luận AI (thứ tự màn nhập; màn
  chấm gom vẫn đứng sau cùng nhóm). Ghép cặp vốn đã xáo 2 cột độc lập — không đổi.
- ⭐ **Chống lặp ở ranh giới:** nếu từ đầu tiên của dạng mới **trùng** từ của màn ngay trước (vd. hết
  selection bằng từ c, audio lại mở đầu bằng c) thì đẩy từ đó xuống cuối dạng. Tránh gặp 1 từ 2 màn
  liền nhau, vừa dễ đoán vừa nhàm.
- Không ảnh hưởng: tính điểm, `la_bai_cuoi_cua_tu` (vẫn tính bằng cách duyệt ngược SAU khi xếp), nút
  Hard của flashcard (đẩy về cuối session), retry, ôn theo chủ đề.
- Tải lại trang giữa chừng ⇒ session dựng lại với thứ tự xáo MỚI. Chấp nhận được: bài đã đạt vẫn bị
  bỏ qua nhờ `cycle_completed_exercises` như cũ.

## 3. Điểm cần bạn xác nhận
| Mã | Đề xuất | Phương án khác |
|---|---|---|
| **Q1** | Ghép cặp: **hàng thẳng nhau** — mỗi hàng cao theo ô dài nhất của hàng đó | Mỗi cột tự giãn khoảng cách để 2 cột bằng đáy, nhưng các hàng KHÔNG thẳng nhau (trông lộn xộn hơn) |
| **Q2** | Có **chống lặp ở ranh giới** giữa 2 dạng | Xáo thuần tuý, chấp nhận thỉnh thoảng 1 từ ra 2 màn liền nhau |
| **Q3** | **Giữ thứ tự dạng bài**, chỉ xáo từ | Xáo cả thứ tự dạng (phá thứ tự dễ → khó đã chốt ở M4a, không khuyến nghị) |

## 4. Kế hoạch (TDD cho phần logic)

| # | Việc | File |
|---|---|---|
| T1 | **RED**: 4 ca test mới cho `xepBai` có `rng` (xem dưới), chạy ⇒ đỏ | `src/lib/player.test.ts` |
| T2 | **GREEN**: thêm `rng?` + hàm `xaoChoDang` + `idCuoiCua` | `src/lib/player.ts` |
| T3 | Truyền `rng: Math.random` | `src/features/player/PlayerPage.tsx` |
| T4 | Ghép cặp: 1 lưới chung `grid-flow-col` | `src/features/player/bai/Matching.tsx` |
| T5 | Kiểm thật CDP bằng trang kiểm thử tạm, **không đăng nhập** (0 ghi DB): đo đáy 2 cột và đỉnh từng hàng khi có nghĩa dài; PC 1280 + Mobile 390; xoá file tạm sau khi đo | scratchpad |
| T6 | `npm test` + build + lint, cập nhật memory-bank, dọn tiến trình | — |

### Test mới (T1)
- **XR1** — 5 từ stage `new`, rng cố định: mỗi dạng vẫn chứa **đúng đủ 5 từ**, và thứ tự từ **không
  giống nhau ở mọi dạng**.
- **XR2** — không truyền `rng` ⇒ thứ tự y như cũ (a b c d e ở mọi dạng).
- **XR3** — 300 lần với rng có hạt giống (LCG): **không bao giờ** có 2 màn liền nhau cùng 1 từ ở ranh giới giữa 2 dạng.
- **XR4** — với rng: mỗi từ có **đúng 1** màn tính điểm mang cờ `la_bai_cuoi` = true (xáo không làm hỏng
  việc chốt điểm cuối).

### Code chính (T2)
```ts
// Trong xepBai, thay `for (const t of tu)` của từng dạng bằng:
const tuDang = rng ? xaoChoDang(tu, rng, idCuoiCua(man.at(-1))) : tu
// Hội thoại: `for (const b of baiTap)` → `rng ? xaoChoDang(baiTap, rng, idCuoiCua(man.at(-1))) : baiTap`

/** M18 — xáo từ cho 1 dạng; từ đầu trùng từ của màn ngay trước thì đẩy xuống cuối. */
function xaoChoDang<T extends { vocab_id: string }>(ds: readonly T[], rng: () => number, idTruoc: string | null): T[] {
  const kq = xaoTron(ds, rng)
  if (kq.length > 1 && kq[0]!.vocab_id === idTruoc) kq.push(kq.shift()!)
  return kq
}

/** Từ "cuối" của 1 màn — màn nhiều từ lấy từ cuối trong danh sách. */
function idCuoiCua(m: Man | undefined): string | null {
  if (!m) return null
  if ('vocab_id' in m) return m.vocab_id
  if ('vocab_ids' in m) return m.vocab_ids.at(-1) ?? null
  return m.vocab_a
}
```

### Code chính (T4)
```tsx
<div
  className="grid grid-flow-col grid-cols-2 gap-x-4 gap-y-[14px]"
  style={{ gridTemplateRows: `repeat(${dsTu.length}, auto)` }}
>
  {trai.map((v) => <button … className={`${…} flex min-w-0 items-center justify-center break-words font-han text-17`}>…)}
  {phai.map((v) => <button … className={`${…} flex min-w-0 items-center justify-center break-words text-15`}>…)}
</div>
```
