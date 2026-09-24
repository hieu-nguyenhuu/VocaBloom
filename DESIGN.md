# DESIGN.md — M15: Lịch sử học + Ruby vá chuỗi

> Kiến trúc + kế hoạch của RIÊNG task này.
>
> Ngày lập: 2026-09-23 · Trạng thái: **CHỜ DUYỆT DESIGN**
>
> ℹ️ Các bản `DESIGN.*.md` cũ đã được người dùng xoá ở commit `completed` (65f0d1b) — file này lập mới,
> không ghi đè gì.

---

## 1. Yêu cầu

1. Xem lại **toàn bộ** chuỗi streak: ngày nào học bao nhiêu phút.
2. **Lazy load theo tháng** — không tải hết lịch sử một lần.
3. **Ruby tích luỹ**: mỗi 5 phút học trong ngày = 1 ruby (10p = 2, 15p = 3…).
4. **5 ruby vá được 1 ngày** quên học, để nối lại chuỗi streak.

## 2. Quyết định đã chốt ở Brainstorm

| Mã | Nội dung | Ghi chú |
|---|---|---|
| **Q1** | **Trần 12 ruby/ngày** (= 60 phút). Học thêm vẫn tính streak nhưng không thêm ruby | Người dùng chốt |
| **Q2** | Vá được **mọi ngày QUÁ KHỨ**; **không** vá hôm nay | Người dùng chốt — hôm nay vẫn còn cơ hội học thật |
| **Q3** | Lối vào: nút **"Xem tất cả"** cạnh dải 7 ngày ở Dashboard → route ẩn **`/lich-su`** | Cùng cách đã làm với `/thong-bao` (MB-23/Q5), không thêm mục vào tab bar 5 mục |
| **Q4** | Mỗi tháng hiển thị bằng **lưới lịch 7 cột** | Người dùng chốt |

## 3. Quyết định kỹ thuật mới trong thiết kế này

| Mã | Nội dung | Lý do |
|---|---|---|
| **Q5** | ⭐ **Ruby là số DẪN XUẤT, không lưu số dư ở đâu cả.** Số dư = `Σ ruby kiếm mỗi ngày − 5 × số ngày đã vá` | Dự án đã trả giá khi cùng một sự thật nằm ở 2 nơi (bảng phạt TS ↔ SQL, test X1). Số dư lưu riêng sẽ lệch ngay lần đầu có bug; số dẫn xuất thì **không thể lệch** |
| **Q6** | ⭐ **Tổng ruby tính ở SERVER** bằng RPC, không cộng ở client | Hệ quả trực tiếp của lazy load: client chỉ có vài tháng đang xem, **không bao giờ có đủ dữ liệu** để cộng đúng. Cộng ở client = số dư sai ngay khi cuộn |
| **Q7** | Ngày đã vá lưu bằng **cột `da_va boolean`** trên chính `nhat_ky_ngay`, `thoi_gian_ms = 0` | Không cần bảng thứ 13. Streak vốn đếm theo SỰ TỒN TẠI của dòng ⇒ ngày vá tự nối chuỗi, không phải sửa `tinhStreak` |
| **Q8** | Ruby tính từ **SỐ PHÚT HIỂN THỊ** (`ceil(ms/60000)`), không từ ms thô | Dashboard hiển thị phút bằng `Math.ceil`. Nếu ruby tính từ ms thô thì người dùng thấy "5′" mà được 0 ruby — mâu thuẫn ngay trước mắt. Khớp con số đang hiện là quan trọng hơn vài giây sai số |
| **Q9** | Ngày đã vá **hiện KHÁC** ngày học thật trên cả lưới lịch lẫn dải 7 ngày | Không đánh lừa chính người dùng. Chuỗi "liền" nhờ vá thì phải nhìn ra được |
| **Q10** | Nút **"Tải tháng trước"** thay vì cuộn vô hạn | `ponytail`: không cần `IntersectionObserver`, kiểm thử bằng CDP dễ, và người dùng chủ động |
| **Q11** | Vá là thao tác **không hoàn tác**, phải qua `HopXacNhan` nêu rõ số ruby sẽ tiêu | Đúng luật M8: mọi thao tác phá huỷ/tiêu tài nguyên đều nêu hậu quả bằng SỐ CỤ THỂ |

## 4. Mô hình dữ liệu

### 4.1 Sửa `nhat_ky_ngay` (migration `0015`)

```sql
alter table nhat_ky_ngay add column if not exists da_va boolean not null default false;
```

Không thêm bảng mới. Một ngày giờ có 3 trạng thái:

| Trạng thái | Dòng trong bảng | Ý nghĩa |
|---|---|---|
| Có học | có, `thoi_gian_ms > 0`, `da_va = false` | Học thật |
| Có vào Player nhưng chưa đo được phút | có, `thoi_gian_ms = 0`, `da_va = false` | Vẫn tính streak (dữ liệu trước M9) |
| **Đã vá** | có, `thoi_gian_ms = 0`, **`da_va = true`** | Nối chuỗi bằng ruby |

### 4.2 Công thức ruby (1 nguồn sự thật, lặp lại y hệt ở SQL và TS)

```
ruby_cua_ngay = min( floor( ceil(thoi_gian_ms / 60000) / 5 ), 12 )      -- Q1, Q8
ruby_kiem     = Σ ruby_cua_ngay  trên MỌI ngày
ruby_tieu     = 5 × số ngày có da_va = true
ruby_con_lai  = ruby_kiem − ruby_tieu
```

⚠️ Công thức này tồn tại ở **2 nơi** (SQL cho tổng, TS cho hiển thị từng ngày) — đúng loại tình huống
đã đẻ ra bug ở dự án này. **Bắt buộc có test chống lệch** đọc cả 2 nơi rồi so khớp (mẫu X1/X2, S11).

### 4.3 RPC `vi_ruby()` — trả số dư (migration `0015`)

```sql
create or replace function vi_ruby() returns jsonb
language sql stable as $fn$
  select jsonb_build_object(
    'kiem', coalesce(sum(least(floor(ceil(thoi_gian_ms / 60000.0) / 5), 12)), 0),
    'tieu', 5 * count(*) filter (where da_va),
    'con',  coalesce(sum(least(floor(ceil(thoi_gian_ms / 60000.0) / 5), 12)), 0)
            - 5 * count(*) filter (where da_va)
  )::jsonb from nhat_ky_ngay;
$fn$;
```

### 4.4 RPC `va_ngay(p_ngay date)` — thao tác tiêu ruby

**Không nhận số ruby từ client.** Server tự tính, tự kiểm, tự chặn.

```sql
create or replace function va_ngay(p_ngay date) returns jsonb
language plpgsql as $fn$
declare
  v_hom_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;   -- CẤM current_date (§9.3)
  v_con     bigint;
begin
  if p_ngay >= v_hom_nay then
    raise exception 'Chỉ vá được ngày trong quá khứ';                 -- Q2
  end if;

  -- Chèn TRƯỚC rồi kiểm số dư SAU: cả hàm là 1 transaction nên thiếu ruby sẽ rollback.
  -- Cách này khử luôn kẽ hở "đọc số dư rồi mới ghi" (2 lời gọi song song cùng tiêu 1 số ruby).
  insert into nhat_ky_ngay (ngay, thoi_gian_ms, da_va)
  values (p_ngay, 0, true)
  on conflict (ngay) do nothing;

  if not found then
    raise exception 'Ngày % đã có dữ liệu học rồi, không cần vá', p_ngay;
  end if;

  select ((vi_ruby()) ->> 'con')::bigint into v_con;
  if v_con < 0 then
    raise exception 'Không đủ ruby: cần 5 ruby để vá 1 ngày';
  end if;

  return jsonb_build_object('ngay', p_ngay, 'ruby_con_lai', v_con);
end $fn$;
```

Cả 2 hàm `revoke ... from public, anon` + `grant to authenticated` (MB-13/3).

## 5. Tầng thuần — `src/lib/lichSu.ts` (mới)

```ts
export const PHUT_MOI_RUBY = 5
export const TRAN_RUBY_NGAY = 12          // Q1
export const RUBY_DE_VA = 5

/** Ruby của 1 ngày theo SỐ PHÚT HIỂN THỊ (Q8). */
export function rubyCuaNgay(phut: number): number

/** 1 ô trong lưới lịch; `ngay = null` là ô đệm đầu/cuối tháng. */
export type ONgayLich = {
  ngay: string | null
  soNgay: number
  phut: number
  daVa: boolean
  laHomNay: boolean
  laTuongLai: boolean
}

/** Dựng lưới 7 cột cho 1 tháng, chèn ô đệm để thứ 2 luôn ở cột đầu. */
export function luoiThang(thang: string, duLieu: DongNhatKy[], homNay: string): ONgayLich[]

/** Vì sao KHÔNG vá được ngày này — trả `null` nếu vá được. Dùng để UI hiện đúng câu. */
export function canTroVa(o: ONgayLich, rubyCon: number): string | null

/** "Tháng 8/2026" + lùi tháng cho nút "Tải tháng trước". */
export function tenThang(thang: string): string
export function thangTruoc(thang: string): string
```

`luoiThang` là chỗ dễ sai nhất (ô đệm, tháng 28/29/30/31 ngày, ngày tương lai) ⇒ phải có test riêng.

## 6. UI — **màn mới, chưa có mockup, cần bạn duyệt**

### 6.1 Màn `/lich-su` (route ẩn, ngoài `MENU`, trong `AppShell`)

```
┌───────────────────────────────────────────┐
│ ← Lịch sử học                    ◆ 23 ruby│   ← ví ruby, màu HỒNG (không bấm được)
├───────────────────────────────────────────┤
│  Chuỗi hiện tại: 5 ngày                   │
│  Cần 5 ruby để vá 1 ngày đã bỏ lỡ         │
├───────────────────────────────────────────┤
│  Tháng 9 / 2026                           │
│   T2  T3  T4  T5  T6  T7  CN              │
│            1   2   3   4   5              │
│    6   7   8   9  10  11  12              │
│   …                                        │
│   ●=học thật  ◇=đã vá  ○=bỏ lỡ  ·=tương lai│
├───────────────────────────────────────────┤
│        [ Tải tháng 8/2026 ]               │   ← nút TÍM (hành động)
└───────────────────────────────────────────┘
```

- **Ô ngày** tái dùng nguyên ngôn ngữ thị giác của `ONgay` (dải 7 ngày Dashboard): tròn `rounded-pill`,
  nền `bg-award-icon` khi có học, viền `border-award-icon/40` khi không — **chỉ mở rộng thêm trạng
  thái "đã vá"**: nền rỗng + viền nét đứt + icon ruby nhỏ.
- Số phút hiện ngay dưới ô, đúng như dải 7 ngày (`text-10`).
- Bấm 1 ô **quá khứ không học** → mở `HopXacNhan`: *"Vá ngày 12/9? Việc này tiêu 5 ruby và không
  hoàn lại được. Sau khi vá bạn còn 18 ruby."* (Q11)
- Không đủ ruby / ngày tương lai / ngày đã có học ⇒ ô **không bấm được**, `canTroVa` cho câu giải thích.

### 6.2 Dashboard — 2 thay đổi nhỏ

- Cạnh dải 7 ngày thêm nút **"Xem tất cả"** (ghost, chữ tím — **không** dùng hồng, xem §6.3).
- Thêm ví ruby cạnh badge streak.
- Dải 7 ngày: ngày đã vá hiện khác ngày học thật (Q9) ⇒ `ODai` thêm `daVa`, `dai7Ngay` nhận thêm
  tập ngày đã vá (tham số **tuỳ chọn** để 31 ca test hiện có không phải sửa).

### 6.3 ⚠️ Ràng buộc màu phải tuân thủ

`UI_DESIGN.md` §63: **"Hồng: CHỈ streak/badge thành tích — không bao giờ trên phần tử có thể click."**

⇒ Ví ruby, ô ngày, số phút: **hồng** (`award-icon` / `award-text`).
⇒ Nút "Xem tất cả", nút "Tải tháng trước", nút xác nhận vá: **tím** (`bg-accent`).

### 6.4 Icon mới

Cần **1 icon `ruby`** — chưa có trong 2 file mockup. Vẽ theo đúng quy ước bộ icon hiện có:
`viewBox 24`, `stroke-width 1.7–1.8`, `stroke-linecap: round`, hình viên đá 6 cạnh (đỉnh cắt vát +
2 cạnh xiên chụm xuống mũi nhọn). Thêm vào `src/components/icons.tsx` cùng chỗ 8 icon hiện có.

> Đây là icon thứ 2 tôi tự thêm (sau `tick` ở M6b). Nếu bạn muốn xem trước hình rồi mới chốt như
> lần bộ icon cây (MB-19), nói một tiếng — tôi dựng trang so sánh vài phương án.

## 7. PLAN chi tiết — 12 task

> Mỗi task 2–5 phút. Logic không tầm thường đi theo RED → GREEN → REFACTOR.

### T1 · `supabase/migrations/0015_ruby_va_ngay.sql` (file MỚI)

```sql
alter table nhat_ky_ngay add column if not exists da_va boolean not null default false;

-- Ví ruby. `stable` vì chỉ đọc. Công thức lặp lại ở lichSu.ts ⇒ có test chống lệch T6.
create or replace function vi_ruby() returns jsonb
language sql stable as $fn$
  with r as (
    select least(floor(ceil(thoi_gian_ms / 60000.0) / 5), 12) as ruby, da_va
    from nhat_ky_ngay
  )
  select jsonb_build_object(
    'kiem', coalesce(sum(ruby), 0),
    'tieu', 5 * count(*) filter (where da_va),
    'con',  coalesce(sum(ruby), 0) - 5 * count(*) filter (where da_va)
  ) from r;
$fn$;

create or replace function va_ngay(p_ngay date) returns jsonb
language plpgsql as $fn$
declare
  v_hom_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;  -- CẤM current_date (§9.3)
  v_con     bigint;
begin
  if p_ngay >= v_hom_nay then
    raise exception 'Chỉ vá được ngày trong quá khứ';
  end if;

  -- Chèn TRƯỚC, kiểm số dư SAU: cả hàm là 1 transaction nên thiếu ruby sẽ rollback.
  -- Khử luôn kẽ hở "đọc số dư rồi mới ghi" của 2 lời gọi song song.
  insert into nhat_ky_ngay (ngay, thoi_gian_ms, da_va) values (p_ngay, 0, true)
  on conflict (ngay) do nothing;
  if not found then
    raise exception 'Ngày % đã có dữ liệu học rồi, không cần vá', p_ngay;
  end if;

  select ((vi_ruby()) ->> 'con')::bigint into v_con;
  if v_con < 0 then
    raise exception 'Không đủ ruby: cần 5 ruby để vá 1 ngày';
  end if;

  return jsonb_build_object('ngay', p_ngay, 'ruby_con_lai', v_con);
end $fn$;

revoke execute on function vi_ruby()        from public, anon;
revoke execute on function va_ngay(date)    from public, anon;
grant  execute on function vi_ruby()        to authenticated;
grant  execute on function va_ngay(date)    to authenticated;
```

### T2 · Chạy & nghiệm thu schema
`npm run db:migrate` (2 lần, xác nhận idempotent) → `npm run check:schema` vẫn **12 bảng** xanh
(task này KHÔNG thêm bảng).

### T3 · RED+GREEN `rubyCuaNgay` — `src/lib/lichSu.ts` (file MỚI)

```ts
export const PHUT_MOI_RUBY = 5
export const TRAN_RUBY_NGAY = 12   // Q1 — 60 phút là chạm trần
export const RUBY_DE_VA = 5

/** Ruby của 1 ngày, tính theo SỐ PHÚT HIỂN THỊ (Q8) chứ không theo ms thô. */
export function rubyCuaNgay(phut: number): number {
  if (!Number.isFinite(phut) || phut <= 0) return 0
  return Math.min(Math.floor(phut / PHUT_MOI_RUBY), TRAN_RUBY_NGAY)
}
```
**6 ca:** 0′→0 · 4′→0 · 5′→1 · 9′→1 · 60′→12 · **180′→12 (chạm trần, không phải 36)**.

### T4 · RED+GREEN `luoiThang` — chỗ dễ sai nhất

```ts
export type ONgayLich = {
  ngay: string | null      // null = ô đệm để thứ 2 luôn ở cột đầu
  soNgay: number
  phut: number
  daVa: boolean
  laHomNay: boolean
  laTuongLai: boolean
}

export function luoiThang(
  thang: string,                                   // 'YYYY-MM'
  duLieu: readonly { ngay: string; thoi_gian_ms: number | null; da_va: boolean }[],
  homNay: string,
): ONgayLich[]
```
Quy ước: cột đầu là **T2** ⇒ số ô đệm = `(thuCuaNgay1 + 6) % 7`.
**5 ca:** ô đệm đầu tháng đúng số lượng · tháng 30 và 31 ngày · **tháng 2 (28 ngày)** ·
ngày > hôm nay có `laTuongLai = true` · ngày `da_va` giữ `daVa = true` và `phut = 0`.

### T5 · RED+GREEN `canTroVa`

```ts
/** Vì sao KHÔNG vá được; trả `null` nghĩa là vá được. Câu chữ hiện thẳng lên UI. */
export function canTroVa(o: ONgayLich, rubyCon: number): string | null {
  if (o.ngay === null) return 'Ô trống'
  if (o.laTuongLai || o.laHomNay) return 'Chỉ vá được ngày trong quá khứ'
  if (o.daVa) return 'Ngày này đã được vá rồi'
  if (o.phut > 0) return 'Ngày này bạn đã học, không cần vá'
  if (rubyCon < RUBY_DE_VA) return `Cần ${RUBY_DE_VA} ruby, bạn còn ${rubyCon}`
  return null
}
```
**5 ca:** ô đệm · ngày tương lai · hôm nay · ngày đã có học · thiếu ruby · vá được → `null`.

### T6 · Test CHỐNG LỆCH (mẫu X1) — `lichSu.test.ts`

```ts
it('X-ruby — hằng số trong lichSu.ts khớp công thức trong 0015_ruby_va_ngay.sql', () => {
  const sql = readFileSync('supabase/migrations/0015_ruby_va_ngay.sql', 'utf8')
  expect(sql).toContain(`/ ${PHUT_MOI_RUBY})`)        // chia 5 phút
  expect(sql).toContain(`, ${TRAN_RUBY_NGAY})`)       // least(..., 12)
  expect(sql).toContain(`${RUBY_DE_VA} * count(*)`)   // tiêu 5 ruby/ngày vá
})
```
Đây là thứ giữ cho SQL và TS không trôi khỏi nhau — đúng mẫu đã cứu dự án ở X1/X2/S11.

### T7 · `scripts/test-ruby.mjs` + `npm run test:ruby`

Khuôn `begin … rollback` như `test-nhat-ky.mjs`. **5 ca:**

| Mã | Nội dung |
|---|---|
| R1 | 2 ngày × 30′ = 12 ruby → vá 1 ngày → `con` = 7, bảng có dòng `da_va = true` |
| R2 | chỉ 4 ruby → `va_ngay` **raise** + **rollback sạch** (không còn dòng vá nào) |
| R3 | vá ngày ĐÃ có học ⇒ chặn, đúng thông điệp |
| R4 | vá **hôm nay** và **ngày mai** ⇒ đều chặn |
| R5 | 1 ngày học 3 tiếng ⇒ `kiem` = **12**, không phải 36 (trần Q1) |

### T8 · Icon `ruby` — `src/components/icons.tsx`
Thêm `'ruby'` vào `TenIcon` và `PATH`. Hình viên đá 6 cạnh, cùng nét với 21 icon hiện có
(`viewBox 24`, `stroke-width` kế thừa, `stroke-linecap: round`):

```tsx
ruby: (
  <>
    <path d="M8 4h8l3 5-7 11-7-11z" />
    <path d="M5 9h14M9.5 9L12 20M14.5 9L12 20M8 4l1.5 5M16 4l-1.5 5" />
  </>
),
```

### T9 · `src/features/lichsu/LichSuPage.tsx` + route `/lich-su`

- State: `thangs: string[]` (mới nhất trước), `duLieu: Map<thang, dòng[]>`, `vi: {kiem,tieu,con}`, `dangVa: ONgayLich | null`.
- Mount: tải tháng hiện tại + `supabase.rpc('vi_ruby')`.
- Nút **"Tải tháng 8/2026"** → `thangTruoc()` rồi query đúng 1 tháng:
  `.from('nhat_ky_ngay').select('ngay, thoi_gian_ms, da_va').gte('ngay', dau).lte('ngay', cuoi)`
- Bấm ô: `canTroVa` ≠ null ⇒ không làm gì (ô để `disabled`); = null ⇒ mở `HopXacNhan`:
  `tieuDe="Vá ngày 12/9?"`, `noiDung="Việc này tiêu 5 ruby và không hoàn lại được. Sau khi vá bạn còn 18 ruby."`, `nhanXacNhan="Vá ngày này"`.
- Xác nhận → `rpc('va_ngay', { p_ngay })` → nạp lại tháng đó + ví ruby. Lỗi ⇒ hiện nguyên văn
  message từ `raise exception` (đã là tiếng Việt, cùng cách `dichLoiImport` làm).
- Route đặt **trong `AppShell`**, KHÔNG thêm vào `MENU` (route ẩn, như `/thong-bao`).

### T10 · Dashboard — 3 sửa nhỏ
1. Query thêm `rpc('vi_ruby')` vào `Promise.all` sẵn có.
2. Ví ruby cạnh badge streak (hồng, không bấm được) + nút **"Xem tất cả"** (ghost chữ tím) cạnh dải 7 ngày.
3. `dai7Ngay(ngayCoLog, homNay, phutMoiNgay, ngayDaVa = new Set())` — **tham số thứ 4 TUỲ CHỌN**
   để 31 ca test hiện có không phải sửa; `ODai` thêm `daVa`. `ONgay` vẽ ngày vá bằng viền nét đứt
   + icon `ruby` thay cho dấu ✓ (Q9).

### T11 · Cổng kiểm
`npm run build` · `npm run lint` (phải giữ **0 lỗi**) · `npm test` · `npm run test:ruby`.

### T12 · Kiểm thật CDP
Seed vài ngày nhật ký → mở `/lich-su`: lưới tháng đúng · "Tải tháng trước" nạp **thêm đúng 1 tháng** ·
**vá 1 ngày giữa chuỗi → streak ở Dashboard nối liền, ví ruby giảm đúng 5** · ngày thiếu ruby thì ô
không bấm được · gọi thẳng `rpc('va_ngay')` khi thiếu ruby vẫn **bị server chặn**. Dọn sạch sau khi kiểm.
## 8. Tiêu chí nghiệm thu

- [ ] Học 27 phút trong ngày → **5 ruby**; học 3 tiếng → **12 ruby** (chạm trần, Q1).
- [ ] `/lich-su` hiện đúng lưới tháng hiện tại; bấm "Tải tháng trước" nạp thêm **1 tháng**, không nạp cả năm.
- [ ] Vá 1 ngày giữa chuỗi → **streak nối liền**, ví ruby giảm đúng **5**.
- [ ] Không đủ ruby → không vá được, và **server chặn** kể cả khi gọi thẳng RPC (không chỉ ẩn nút).
- [ ] Vá hôm nay / ngày tương lai / ngày đã có học đều bị chặn.
- [ ] Ngày đã vá **nhìn khác** ngày học thật ở cả lưới lịch lẫn dải 7 ngày.
- [ ] `npm test` xanh · `test:ruby` xanh · build + lint 0 lỗi · `check:schema` 12 bảng xanh.

## 9. Ngoài phạm vi

- Không có bảng xếp hạng, không có ruby từ nguồn khác (chỉ từ thời gian học).
- Không hoàn tác vá (Q11).
- Không sửa `tinhStreak` — ngày vá tự vào chuỗi nhờ có dòng trong `nhat_ky_ngay` (Q7).

## 10. Việc ngoài lề phát hiện khi khảo sát

`npm run seed:test` **đang hỏng**: `scripts/seed-kiem-thu.mjs:35` đọc `du-lieu-kiem-thu/kiem-thu.json`,
file này đã bị xoá ở commit `delete samples` (322c981). Không thuộc task M15 — báo để bạn quyết định
xoá luôn script hay khôi phục file mẫu.
