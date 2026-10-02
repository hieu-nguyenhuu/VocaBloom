# DESIGN.md — M25: Chọn sai thì chọn lại đến khi đúng (hoặc Bỏ qua)

> Kiến trúc của RIÊNG task này (thay nội dung M24 đã xong, M24 đã ghi vào memory-bank MB-45).
> Ngày lập: 2026-10-02 · Trạng thái: **✅ DESIGN + PLAN ĐÃ DUYỆT · ĐÃ XONG 2026-10-02** (MB-46)

## 1. Yêu cầu (người dùng chốt 2026-10-02)
| Mã | Chốt |
|---|---|
| Q1 | **Lần trả lời ĐẦU quyết định điểm** — giống Ghép cặp hiện nay. Sai lần đầu ⇒ 0 điểm, bài CHƯA đạt ⇒ vẫn vào hàng "Ôn lại" lượt sau (SPEC §4.2 không đổi). Các lần chọn lại chỉ để luyện, không cộng điểm |
| Q2 | Flashcard: **Hard** xuống cuối phiên (ĐÃ CÓ — `hard_day_cuoi`, SPEC §4.3) · **Again** giữ nguyên ⇒ hàng "Ôn lại" |
| Q3 | Trắc nghiệm: ô chọn sai **đỏ 0,8s → về trung tính, mờ + khoá** (không bấm lại được, không lộ đáp án đúng) |
| Q4 | **Fast Decision giữ nguyên** (sai/hết giờ ⇒ tự sang câu) — 2 nút thì chọn lại vô nghĩa |

## 2. Phạm vi theo dạng bài
| Dạng | Hiện nay | Sau M25 |
|---|---|---|
| Trắc nghiệm (selection · audio_recognition · select_on_describe · select_sentence) — `TracNghiem` | sai ⇒ đỏ 1s ⇒ sang câu | sai ⇒ đỏ 0,8s ⇒ ô đó mờ + khoá ⇒ chọn tiếp. Phím 1–4 bỏ qua ô đã khoá |
| Điền từ (translate · listen_fill · trans_collocation) — `DienTu` | sai ⇒ đỏ 1s ⇒ sang câu | sai ⇒ đỏ 0,8s ⇒ ô nhập về viền tím, **giữ chữ đã gõ + bôi đen toàn bộ** (gõ đè luôn được, hoặc sửa từng ký tự) |
| Sắp xếp (arrange_words) — `SapXep` | sai ⇒ viền khay đỏ 1s ⇒ sang câu | sai ⇒ đỏ 0,8s ⇒ **giữ chip trong khay**, bỏ viền đỏ, bấm chip để gỡ/xếp lại |
| Hội thoại (select_dialog · fill_dialog) — `HoiThoai` | chấm 2 ô ⇒ sang câu | **ô ĐÚNG giữ nguyên + khoá**, chỉ ô SAI bị xoá đỏ để làm lại. Select: chip vừa chọn sai mờ + khoá **trừ khi nó là đáp án của ô kia**. Fill: ô sai giữ chữ, bôi đen |
| Ghép cặp | đã chọn lại đến khi đúng | **Không đổi** (đã đúng yêu cầu) |
| Fast Decision · Flashcard · Ngữ pháp · Tự luận AI (make_sentence/trans_sentence/complete_situation) | — | **Không đổi** (AI chấm gom 1 request/nhóm, không có "chọn lại") |

Đúng ⇒ xanh 600ms ⇒ sang câu (như cũ). Nút **Bỏ qua** ⇒ ghi sai, sang câu (như cũ, dùng được cả giữa chừng).

## 3. Kiến trúc — ghi DB MỘT lần, lúc kết thúc màn
- Component tự giữ cờ `daSai` theo từng ô (ref). Chỉ gọi `onTraLoi` **khi đúng** (sau 600ms) với
  `dung = !daSai` ⇒ PlayerPage/`traLoi`/`srs.ts`/RPC **không sửa 1 dòng**; luật điểm, promote, retry giữ nguyên.
- Logic chấm tách thành **hàm thuần** trong `src/lib/player.ts` (TDD):
  `chamLuot(daSai: Record<K,boolean>, ket: Record<K,boolean>) → { xong, ghi: Record<K,boolean> | null, daSai }`
  — `xong` khi mọi ô đúng; `ghi` = kết quả LẦN ĐẦU từng ô (`!daSai`); bài 1 ô dùng khoá `x`, hội thoại dùng `a`/`b`.
- ⚠️ **Hội thoại thiếu từ B** (`tuB = null`): hiện code trả `b: false` cố định ⇒ nếu áp "đến khi đúng" sẽ **kẹt vĩnh viễn**.
  Chỉ đưa vào `chamLuot` các ô thực có (không có B ⇒ chỉ khoá `a`).
- Hằng `KHOANG_CHO_SAI_MS = 1000` (`amThanhCore.ts`) đổi nghĩa thành **thời gian giữ màu đỏ trước khi cho chọn lại = 800**
  (âm `sai` dài 360ms < 800 ⇒ test X1 vẫn đúng). Test X2 cập nhật mẫu `? 600 : 800`.

## 4. Hệ quả đã lường trước
- `thoi_gian_ms` nay gồm cả thời gian làm lại ⇒ số phút học sát thực tế hơn (vẫn trần 5 phút/lượt).
- Bấm **X** khi đang làm lại sau 1 lần sai ⇒ bài đó **không được ghi** (như bài chưa làm) ⇒ lượt sau gặp lại. Trước đây
  lần sai được ghi ngay. Không mất điểm nào (sai vốn 0 điểm), chỉ không có dòng log sai.
- Dùng **Gợi ý / Giải thích sau khi đã sai** ⇒ vẫn 0 điểm (lần đầu đã sai) — không mở lỗ hổng điểm.
- Âm: mỗi lần sai kêu `sai`; đúng sau khi sai kêu `dung` (có gợi ý thì `dung_goi_y`) như hiện nay.

## 5. Không đổi
`srs.ts` · `PlayerPage.traLoi` · RPC `luu_tra_loi` · `daily_retry_queue` · Flashcard (Hard/Again) · Fast Decision ·
Matching · AI chấm · DB/migration. Không thêm token màu (dùng `opacity` cho ô mờ). 0 package.

## 6. Kiểm chứng dự kiến
- TDD `chamLuot` (RED trước): đúng ngay · sai rồi đúng ⇒ ghi false · 2 ô A đúng B sai ⇒ chưa xong, A giữ true · thiếu B.
- `npm test` · `npm run build` · `npm run lint`.
- CDP trên **trang kiểm thử tạm, không đăng nhập** (0 lệnh ghi DB, luật §9.7) gắn thẳng 4 màn: chọn sai ⇒ đỏ ⇒ sau 0,8s
  mờ/khoá, `onTraLoi` CHƯA gọi · chọn đúng ⇒ `onTraLoi(false)` đúng 1 lần · đúng ngay ⇒ `onTraLoi(true)`. Xong xoá file tạm.

---

# PLAN — M25 (8 task, mỗi task 2–5 phút)

## T1 · RED — test `chamLuot` (`src/lib/player.test.ts`)
Thêm `chamLuot` vào khối `import { … } from './player.ts'` đầu file, rồi thêm khối cuối file:
```ts
describe('chamLuot — chọn lại đến khi đúng, LẦN ĐẦU quyết định điểm (M25)', () => {
  it('C1 đúng ngay ⇒ xong, ghi true', () => {
    expect(chamLuot({}, { x: true })).toEqual({ xong: true, ghi: { x: true }, daSai: { x: false } })
  })
  it('C2 sai ⇒ chưa xong, chưa ghi, nhớ đã sai', () => {
    expect(chamLuot({}, { x: false })).toEqual({ xong: false, ghi: null, daSai: { x: true } })
  })
  it('C3 sai rồi đúng ⇒ ghi false (giống Ghép cặp)', () => {
    const l1 = chamLuot({}, { x: false })
    expect(chamLuot(l1.daSai, { x: true })).toEqual({ xong: true, ghi: { x: false }, daSai: { x: true } })
  })
  it('C4 hội thoại: A đúng B sai ⇒ chưa xong; sửa B ⇒ ghi { a: true, b: false }', () => {
    const l1 = chamLuot({}, { a: true, b: false })
    expect(l1.xong).toBe(false)
    expect(chamLuot(l1.daSai, { a: true, b: true }).ghi).toEqual({ a: true, b: false })
  })
  it('C5 thiếu từ B ⇒ chỉ chấm ô a, đúng là xong (không kẹt vĩnh viễn)', () => {
    expect(chamLuot({}, { a: true })).toEqual({ xong: true, ghi: { a: true }, daSai: { a: false } })
  })
})
```
Chạy `npx vitest run src/lib/player.test.ts` ⇒ **phải ĐỎ** (`chamLuot` chưa có).

## T2 · GREEN — `chamLuot` (`src/lib/player.ts`, chèn trước khối `// ── M10`)
```ts
// ── M25: chọn sai thì chọn lại đến khi đúng ─────────────────────────────────

/**
 * M25 — chấm 1 lượt thử của màn "chọn lại đến khi đúng". Điểm theo LẦN ĐẦU từng ô (cùng luật Ghép cặp):
 * `ghi` chỉ có khi MỌI ô đã đúng, mỗi ô = chưa từng sai. Chỉ truyền các ô THỰC CÓ — hội thoại thiếu
 * từ B mà truyền `b: false` cố định thì màn không bao giờ xong.
 */
export function chamLuot<K extends string>(
  daSai: Partial<Record<K, boolean>>,
  ket: Record<K, boolean>,
): { xong: boolean; ghi: Record<K, boolean> | null; daSai: Record<K, boolean> } {
  const khoa = Object.keys(ket) as K[]
  const moi = Object.fromEntries(khoa.map((k) => [k, Boolean(daSai[k]) || !ket[k]])) as Record<K, boolean>
  const xong = khoa.every((k) => ket[k])
  const ghi = xong ? (Object.fromEntries(khoa.map((k) => [k, !moi[k]])) as Record<K, boolean>) : null
  return { xong, ghi, daSai: moi }
}
```
Chạy lại ⇒ C1–C5 XANH.

## T3 · RED — hằng khoảng đỏ (`src/lib/amThanhCore.ts`)
```ts
/**
 * Khoảng chờ của màn bài tập (ms), chép từ `setTimeout(..., dung ? 600 : 800)` trong TracNghiem / DienTu /
 * SapXep / HoiThoai — test X2 canh 2 nơi khớp nhau. Đúng ⇒ chờ rồi chuyển màn. Sai ⇒ giữ màu đỏ rồi
 * cho chọn lại (M25; trước đây 1000ms rồi chuyển màn).
 */
export const KHOANG_CHO_DUNG_MS = 600
export const KHOANG_CHO_SAI_MS = 800
```
Chạy `npx vitest run src/lib/amThanhCore.test.ts` ⇒ **X2 phải ĐỎ** ở cả 4 màn (còn `600 : 1000`). X1 vẫn xanh (âm `sai` 360ms < 800).

## T4 · `TracNghiem.tsx` — ô sai đỏ 0,8s rồi mờ + khoá
- Import thêm `chamLuot`. Thay effect `daGui`/`setTimeout` bằng handler (không side-effect trong effect ⇒ khỏi lo StrictMode):
```ts
const [khoa, setKhoa] = useState<Set<string>>(() => new Set())
const daSai = useRef<Partial<Record<'x', boolean>>>({})
const daGui = useRef(false)
const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
useEffect(() => () => clearTimeout(hen.current), [])

function chon(x: string) {
  if (daChon !== null || daGui.current || khoa.has(x) || anDi.has(x)) return
  setDaChon(x)
  const dung = x === dapAn
  const goiY = soGoiY > 0
  // M17 — phát âm CÙNG khoảnh khắc tô xanh/đỏ
  phatAmThanh(amKhiCham(dung, goiY))
  const kq = chamLuot(daSai.current, { x: dung })
  daSai.current = kq.daSai
  if (kq.ghi) daGui.current = true
  hen.current = setTimeout(() => {
    if (kq.ghi) return onTraLoiRef.current(kq.ghi.x, goiY)
    // M25 — sai: bỏ đỏ, ô vừa chọn mờ + khoá, chọn tiếp (không lộ đáp án đúng)
    setKhoa((k) => new Set(k).add(x))
    setDaChon(null)
  }, dung ? 600 : 800)
}
```
- Phím tắt: `if (!x || anDi.has(x) || khoa.has(x)) return; e.preventDefault(); chon(x)`.
- `lop(x)`: dòng đầu thêm `if (khoa.has(x)) return \`${O_TRUNG_TINH} opacity-40\``.
- Nút: `disabled={daChon !== null || khoa.has(x)}` · `onClick={() => chon(x)}`. Sửa comment đầu file ("sai → 1000ms").

## T5 · `DienTu.tsx` — giữ chữ, bôi đen, gõ lại
```ts
const daSai = useRef<Partial<Record<'x', boolean>>>({})
const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
useEffect(() => () => clearTimeout(hen.current), [])

function kiemTra() {
  if (kq !== null || !giaTri.trim()) return
  const dung = soKhopDapAn(giaTri, dapAn, vocab.lang)
  const goiY = soGoiY > 0
  setKq(dung)
  phatAmThanh(amKhiCham(dung, goiY))
  const cham = chamLuot(daSai.current, { x: dung })
  daSai.current = cham.daSai
  hen.current = setTimeout(() => {
    if (cham.ghi) return onTraLoi(cham.ghi.x, goiY)
    // M25 — bỏ đỏ, GIỮ chữ đã gõ + bôi đen: gõ đè luôn hoặc sửa từng ký tự
    setKq(null)
    requestAnimationFrame(() => oNhap.current?.select())
  }, dung ? 600 : 800)
}
```
(`select()` kèm focus; ô bị `disabled` khi `kq !== null` nên đợi 1 frame sau khi bật lại.)

## T6 · `SapXep.tsx` — giữ chip trong khay
Cùng khuôn T5 (`daSai` + `hen` + cleanup); nhánh sai chỉ `setKq(null)` — khay giữ nguyên, chip bật lại để gỡ/xếp lại.

## T7 · `HoiThoai.tsx` — ô đúng giữ + khoá, ô sai làm lại
- State mới: `dungRoi` `{ a: boolean; b: boolean }` (mặc định false) · `khoa: Set<string>` · ref `daSai`, `hen` (+ cleanup), `oA`/`oB` ·
  `coB = Boolean(dapAnB)` · `dayDu = Boolean(dienA) && (!coB || Boolean(dienB))`.
- `chot(a, b)`:
```ts
function chot(a: string, b: string) {
  // Chỉ chấm ô THỰC CÓ — thiếu từ B mà chấm `b: false` cố định là kẹt vĩnh viễn (M25)
  const ket: Record<string, boolean> = { a: soKhopDapAn(a, dapAnA, lang), ...(coB ? { b: soKhopDapAn(b, dapAnB, lang) } : {}) }
  const dungHet = Object.values(ket).every(Boolean)
  const goiY = soGoiY > 0
  setKq({ a: ket.a ?? false, b: ket.b ?? false })
  phatAmThanh(amKhiCham(dungHet, goiY))
  const cham = chamLuot(daSai.current, ket)
  daSai.current = cham.daSai
  hen.current = setTimeout(() => {
    if (cham.ghi) return onTraLoi({ a: cham.ghi.a ?? false, b: cham.ghi.b ?? false }, goiY)
    // M25 — ô đúng giữ + khoá; ô sai làm lại. Chip sai mờ + khoá TRỪ KHI là đáp án của ô kia.
    setDungRoi({ a: ket.a ?? false, b: ket.b ?? false })
    if (cheDo === 'select_dialog') {
      setKhoa((k) => {
        const m = new Set(k)
        for (const [o, c] of [['a', a], ['b', b]] as const) if (!ket[o] && c && c !== dapAnA && c !== dapAnB) m.add(c)
        return m
      })
      if (!ket.a) setDienA('')
      if (coB && !ket.b) setDienB('')
    }
    setKq(null)
    if (cheDo === 'fill_dialog') requestAnimationFrame(() => (ket.a ? oB : oA).current?.select())
  }, dungHet ? 600 : 800)
}
```
- `bamChip(c)`: `if (kq || khoa.has(c)) return` · ô A trống ⇒ `setDienA(c); if (!coB || dienB) chot(c, dienB)` · còn lại B trống ⇒
  `setDienB(c); chot(dienA, c)`.
- Chip: `disabled={kq !== null || dayDu || anDi.has(c) || khoa.has(c)}` + `opacity-40` khi `khoa.has(c)`. Phím 1–4: thay
  `dienB !== ''` bằng `dayDu || khoa.has(c)`.
- `oTrong(…, o: 'a' | 'b')`: ô đã `dungRoi[o]` ⇒ chữ/viền **xanh** + input `disabled`; input fill gắn `ref` `oA`/`oB`.
- Sửa comment đầu file.

## T8 · GREEN + kiểm chứng
1. `npx vitest run src/lib/amThanhCore.test.ts` ⇒ X2 xanh lại (4 màn đều `? 600 : 800`).
2. `npm test` · `npm run build` · `npm run lint` — xanh, không thêm cảnh báo mới.
3. CDP trên **trang kiểm thử tạm** (`kiem-m25.html` + `.tsx` ở gốc, KHÔNG đăng nhập ⇒ 0 lệnh ghi DB, §9.7), gắn thẳng 4 màn,
   `onTraLoi` ghi lại mọi lời gọi. Mỗi màn: (a) sai ⇒ đỏ, sau 0,8s hết đỏ, `onTraLoi` **0 lần**; (b) đúng sau đó ⇒ **1 lần**
   với `false`; (c) đúng ngay ⇒ 1 lần với `true`. Riêng: trắc nghiệm ô sai `disabled` + mờ · DienTu giữ chữ + được chọn ·
   hội thoại A đúng B sai ⇒ A giữ xanh/khoá · hội thoại thiếu B ⇒ chọn đúng A là xong.
   Xong **xoá 2 file tạm**, tắt Chrome + dev server.
4. Cập nhật SPEC §6.2 (feedback sai) + UI_DESIGN mục feedback · memory-bank (MB-46).
