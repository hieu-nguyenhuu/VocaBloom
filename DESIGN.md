# DESIGN.md — M8: Quản lý từ vựng & chủ đề

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản M7 (đã lưu ở `DESIGN.M7.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-19 · Trạng thái: **✅ HOÀN THÀNH 2026-09-19 — test 264/264, CDP 23/23 + 8/8**

---

## 0. Phạm vi

Màn **cuối cùng** còn là stub (`/tu-vung`). Sau task này app không còn màn giả nào.

**Làm:** danh sách chủ đề + danh sách từ + tìm kiếm · sửa **8 field cơ bản** · xoá từ · xoá chủ đề ·
đổi tên/mô tả chủ đề.

**KHÔNG làm:** sửa payload 17 dạng bài (phải import file mới — `UI_DESIGN` §8.4) · thêm từ thủ công
(nguồn nhập chính là Import) · gộp 2 chủ đề trùng tên.

**0 package mới.** 1 migration mới (`0010`) cho RPC xoá chủ đề.

---

## 1. Xác nhận 2 giả định của người dùng (đã kiểm, không suy đoán)

| Giả định | Kết luận | Bằng chứng |
|---|---|---|
| "Từ thuộc nhiều chủ đề thì có nhiều record trong DB" | ✅ ĐÚNG với dữ liệu do Import sinh ra | `0007_import_topic.sql` **luôn `insert into vocab`**, không tái dùng dòng cũ; DB thật: 9 vocab / 9 liên kết / **0 từ thuộc >1 chủ đề**; "晴天" là **2 dòng vocab độc lập** |
| "Xoá chủ đề không ảnh hưởng chủ đề khác" | ✅ ĐÚNG, nhưng phải code phòng thủ | `vocab_topics` vẫn là **n-n** ⇒ kỹ thuật vẫn có thể 1 từ nối nhiều chủ đề. Quy tắc: **chỉ xoá hẳn từ nào CHỈ thuộc riêng chủ đề này**, từ còn thuộc chủ đề khác thì **chỉ gỡ liên kết** |

---

## 2. Quyết định đã chốt

| # | Nội dung | Ghi chú |
|---|---|---|
| Q1 | Thùng rác = **xoá hẳn từ khỏi DB**, có hộp xác nhận nêu rõ số bài tập + lịch sử sẽ mất | Mọi bảng `on delete cascade` (word_state, exercises, review_log, vocab_topics, daily_retry_queue) |
| Q2 | **CHẶN xoá** nếu từ đang là **vai B** của câu hội thoại thuộc từ khác; báo rõ từ nào đang dùng | `payload->>'blank_b_vocab_id'` là chuỗi jsonb **không có FK** ⇒ cascade không dọn, xoá sẽ để tham chiếu treo |
| Q3 | Sửa `word` ⇒ **xoá `audio_url`** (đặt null) để lần TTS sau gen lại | M6c đặt tên file theo `hash(word‖lang‖voice)`; không xoá thì nút loa đọc chữ CŨ mãi |
| Q4 | Form sửa **đủ 8 field** (`UI_DESIGN` §8.4), nhãn ô đầu đổi theo `lang` | Mockup chỉ vẽ 5 ô — bản minh hoạ rút gọn; thiếu 2 ô thì 2 field vĩnh viễn không sửa được |
| Q5 | Xoá chủ đề = **xoá luôn từ trong chủ đề**, nhưng không đụng chủ đề khác (xem §1) | Người dùng chốt |
| Q6 | Cho **đổi tên + mô tả** chủ đề | Đang có 2 chủ đề trùng tên "Thời tiết" |
| Q7 | Tìm kiếm **lọc phía client**, bỏ dấu, không phân biệt hoa thường, khớp chữ/pinyin/nghĩa | 9 từ, không cần query lại |

---

## 3. Số liệu mockup

### 3.1 PC 13 — master-detail
| Phần | Số liệu |
|---|---|
| Tiêu đề trang | Baloo 24, padding `26px 32px 16px`, dưới có `border-top` toàn khối |
| Cột chủ đề | rộng **300px**, viền phải `#F0ECE4`, padding 20, gap 10 |
| Card chủ đề | r14 p14; **đang chọn**: nền `#EDEBFC`, viền `1.5px #5B4FE8`, tên `#4338CA`, số từ `#5B4FE8`; thường: nền `#FBFAF6` viền `#F0ECE4` |
| Thanh 6 màu | cao **6px** (Dashboard/M7 dùng 8px), bo `999px` |
| Cột từ | padding `24px 32px`; tên chủ đề Baloo 18; ô tìm kiếm r10 `9px 14px` max-w 320; danh sách max-w **640px** |
| Dòng từ | `padding 14px 0`, viền dưới `#F0ECE4`; chữ Noto 17/600 + pinyin 12.5 `#8B8593` (ml 8) + nghĩa 13 `#4A4458` (mt 2); 2 icon 17px gap 14 — sửa `#8B8593`, xoá **`#ef4444`** |

### 3.2 PC 14 — modal sửa
Overlay `rgba(36,27,58,.35)`; hộp **480px**, nền trắng (`surface-raised`), r20, p28, gap 14;
tiêu đề Baloo 19; nhãn 11.5/600 `#8B8593` mb 4; ô nhập nền `#FBFAF6` viền `#F0ECE4` r8 `9px 12px`;
2 hàng 2 cột (`word`+`pinyin`, `collocation`+`collocation_meaning_vi`); nút Hủy `#F0ECE4`/`#4A4458`
và Lưu `#5B4FE8`, p13 r12 14.5/600.

### 3.3 Mobile 13/14/15
13 = danh sách chủ đề (card r16 p16, thanh 8px) · 14 = header back-arrow 20px + tên chủ đề Baloo 19,
ô tìm kiếm, dòng từ `padding 12px 0` · 15 = **bottom sheet** r`24 24 0 0`, p `20px 22px 26px`,
max-h 78%, có thanh kéo 36×4 `#E5E5E5`, vùng cuộn max-h 400.

---

## 4. Kiến trúc

### 4.1 `src/lib/tuVung.ts` — thuần (TDD)
```ts
export type DongTu = {
  id: string; word: string; pinyin: string | null; meaning_vi: string; lang: 'zh' | 'en'
  collocation: string | null; collocation_pinyin: string | null; collocation_meaning_vi: string | null
  example_sentence: string | null; example_meaning_vi: string | null
}

export function boDau(s: string): string                     // "quả táo" → "qua tao"
export function locTu(ds: DongTu[], tuKhoa: string): DongTu[] // khớp word | pinyin | meaning_vi
export function nhanTu(lang: 'zh' | 'en'): string             // "Từ (Hán tự)" | "Từ (tiếng Anh)"
export function kiemTraFormTu(f: Partial<DongTu>): string | null   // word/meaning_vi bắt buộc
export function canXoaAudio(cu: string, moi: string): boolean      // word đổi ⇒ audio_url = null
export function docThayDoi(cu: DongTu, moi: DongTu): Partial<DongTu>  // chỉ gửi field THỰC SỰ đổi
```

### 4.2 Truy vấn
- Danh sách chủ đề: **dùng lại `tomTatChuDe`** của M7 (`chuDe.ts`) — đúng dữ liệu cần (tên, mô tả,
  số từ, 6 khúc màu); chỉ khác chỗ hiển thị (thanh 6px, có trạng thái "đang chọn").
- Danh sách từ: `vocab_topics?topic_id=eq.X` → `vocab?id=in.(...)` (2 truy vấn — **không** có FK
  trực tiếp giữa `vocab_topics` và `word_state`, bài học M7).
- Sửa: `update vocab set … where id = …` (+ `audio_url: null` khi `word` đổi).
- Đổi tên chủ đề: `update topics set name, description`.

### 4.3 Xoá từ (Q1 + Q2)
```ts
// 1) Kiểm tra vai B TRƯỚC khi xoá
exercises?select=vocab_id,type&payload->>blank_b_vocab_id=eq.<id>
// → nếu có bản ghi mà `vocab_id` KHÁC từ đang xoá ⇒ CHẶN, hiện tên các từ đang dùng
// 2) Không vướng → delete from vocab where id = … (cascade dọn 5 bảng còn lại)
```

### 4.4 Xoá chủ đề — migration `0010_xoa_chu_de.sql` (RPC, 1 transaction)
```sql
create or replace function xoa_chu_de(p_topic_id uuid)
returns jsonb language plpgsql as $$
declare v_xoa uuid[]; v_go uuid[]; v_ket jsonb;
begin
  -- Từ CHỈ thuộc riêng chủ đề này → xoá hẳn; từ còn thuộc chủ đề khác → chỉ gỡ liên kết (§1)
  select coalesce(array_agg(vt.vocab_id) filter (where d.so = 1), '{}'),
         coalesce(array_agg(vt.vocab_id) filter (where d.so > 1), '{}')
    into v_xoa, v_go
  from vocab_topics vt
  join lateral (select count(*) so from vocab_topics x where x.vocab_id = vt.vocab_id) d on true
  where vt.topic_id = p_topic_id;

  -- Chặn nếu một từ sắp xoá đang là vai B của câu hội thoại THUỘC TỪ KHÁC ngoài danh sách xoá
  if exists (
    select 1 from exercises e
    where (e.payload ->> 'blank_b_vocab_id')::uuid = any(v_xoa)
      and not (e.vocab_id = any(v_xoa))
  ) then
    raise exception 'Có từ đang được dùng làm vai B ở câu hội thoại của chủ đề khác';
  end if;

  delete from vocab where id = any(v_xoa);                     -- cascade dọn 5 bảng
  delete from vocab_topics where topic_id = p_topic_id and vocab_id = any(v_go);
  delete from topics where id = p_topic_id;
  return jsonb_build_object('so_tu_xoa', array_length(v_xoa, 1), 'so_tu_go', array_length(v_go, 1));
end $$;
revoke all on function xoa_chu_de(uuid) from public, anon;
grant execute on function xoa_chu_de(uuid) to authenticated;
```

### 4.5 Route & bố cục
```
/tu-vung             PC: 2 cột (chưa chọn chủ đề → cột phải hiện lời nhắc) · Mobile: danh sách chủ đề
/tu-vung/:topicId    PC: 2 cột, card tương ứng sáng lên · Mobile: danh sách từ (header back-arrow)
```
Một component `TuVungPage` lo cả 2 route, chuyển bố cục bằng CSS `md:` (không JS đo màn hình —
đúng systemPatterns §5). Form sửa: `<dialog>` native — PC căn giữa, Mobile trượt từ đáy (chỉ khác
class, tái dùng pattern modal 14 đã dùng ở màn Đăng nhập/Giải thích).

Hộp xác nhận xoá cũng dùng `<dialog>`; nút xoá đỏ `bg-danger`, nêu rõ số bài tập + "toàn bộ lịch sử ôn".

---

## 5. Kế hoạch — 15 task (2–5 phút/task)

**Thuần (RED → GREEN → REFACTOR)**
| # | Task | Ca kiểm |
|---|---|---|
| T1 | RED `tuVung.test.ts` — `boDau` · `locTu` | "tao" khớp "quả táo"; "PING" khớp "píngguǒ"; khớp cả chữ Hán; từ khoá rỗng → trả nguyên danh sách; không khớp → rỗng |
| T2 | GREEN |
| T3 | RED + GREEN — `nhanTu` · `kiemTraFormTu` · `canXoaAudio` · `docThayDoi` | `zh`/`en` ra nhãn khác nhau; `word` rỗng → lỗi; `meaning_vi` rỗng → lỗi; chỉ đổi pinyin ⇒ `docThayDoi` trả đúng 1 khoá; đổi `word` ⇒ `canXoaAudio` true |
| T4 | X-test: `tuVung.ts` không import react/supabase/node |

**Hạ tầng**
| # | Task |
|---|---|
| T5 | `0010_xoa_chu_de.sql` + `npm run db:migrate`; kiểm quyền: `anon` KHÔNG gọi được RPC |

**UI**
| # | Task |
|---|---|
| T6 | `TuVungPage` khung: PC 2 cột / Mobile 1 cột, cột chủ đề (tái dùng `tomTatChuDe`, thanh 6px, trạng thái đang chọn) |
| T7 | Cột từ: tiêu đề + ô tìm kiếm + danh sách dòng từ (chữ/pinyin/nghĩa + 2 icon), trạng thái rỗng |
| T8 | Mobile: header back-arrow, điều hướng `/tu-vung` ↔ `/tu-vung/:topicId` |
| T9 | `FormSuaTu` — `<dialog>`, **8 ô**, nhãn theo `lang`, dòng nhắc "bài tập không đổi theo", nút Hủy/Lưu |
| T10 | Lưu: chỉ gửi field đổi; `word` đổi ⇒ `audio_url = null`; báo lỗi + "Thử lại" |
| T11 | Xoá từ: kiểm vai B → chặn kèm tên từ đang dùng; nếu sạch thì `<dialog>` xác nhận rồi xoá |
| T12 | Đổi tên/mô tả chủ đề + nút xoá chủ đề (xác nhận nêu rõ số từ sẽ mất) |

**Kiểm & dọn**
| # | Task |
|---|---|
| T13 | build · lint · test (245 + ~18) · **CDP thật**: sửa pinyin 1 từ → DB đổi đúng 1 cột · sửa `word` → `audio_url` về null · tìm kiếm không dấu lọc đúng · **xoá từ vai B bị CHẶN** · xoá 1 từ thường → `review_log`/`exercises` của nó biến mất theo cascade · đổi tên chủ đề · xoá 1 chủ đề thử (tạo trước bằng import file tạm) → từ của chủ đề khác **còn nguyên** · chụp PC/Mobile light+dark |
| T14 | Sửa sai lệch phát hiện ở T13, chạy lại |
| T15 | Dọn process · memory-bank (MB-27) · soát checklist §6 |

---

## 6. Checklist tự soát ở Bước 4
- [ ] Xoá chủ đề: từ thuộc chủ đề khác **còn nguyên** (kiểm bằng số dòng `vocab` trước/sau).
- [ ] Xoá từ đang là **vai B** bị chặn, KHÔNG để lại `blank_b_vocab_id` treo trong `exercises`.
- [ ] Sửa `word` ⇒ `audio_url` về `null` (nếu không, nút loa đọc chữ cũ vĩnh viễn).
- [ ] Form có **đủ 8 field**; nhãn ô đầu đúng theo `lang` (2 từ tiếng Anh phải hiện "Từ (tiếng Anh)").
- [ ] Không có nút "Thêm từ mới" (`UI_DESIGN` §8.4 — nguồn nhập là Import).
- [ ] Không sửa được payload bài tập ở bất kỳ đâu trong màn này.
- [ ] Mọi thao tác phá huỷ đều qua `<dialog>` xác nhận, nêu rõ hậu quả bằng số cụ thể.
- [ ] RPC `xoa_chu_de` không cấp quyền cho `anon`/`public`.
- [ ] Không hex trong component; chuyển bố cục PC/Mobile bằng CSS `md:`, không JS.

---

## 7. PLAN chi tiết — code cụ thể

### T1–T4 · `src/lib/tuVung.ts`
```ts
export const FIELD_SUA = ['word','pinyin','meaning_vi','collocation','collocation_pinyin',
  'collocation_meaning_vi','example_sentence','example_meaning_vi'] as const   // 8 field §8.4

export function boDau(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}
export function locTu(ds: DongTu[], tuKhoa: string): DongTu[] {
  const k = boDau(tuKhoa.trim()); if (!k) return [...ds]
  return ds.filter((t) => [t.word, t.pinyin ?? '', t.meaning_vi].some((x) => boDau(x).includes(k)))
}
export function nhanTu(lang: 'zh' | 'en'): string { return lang === 'zh' ? 'Từ (Hán tự)' : 'Từ (tiếng Anh)' }
export function kiemTraFormTu(f: Partial<DongTu>): string | null   // word rỗng → 'Chưa nhập từ'; meaning_vi rỗng → 'Chưa nhập nghĩa tiếng Việt'
export function canXoaAudio(cu: string, moi: string): boolean { return cu.trim() !== moi.trim() }
export function docThayDoi(cu: DongTu, moi: Partial<DongTu>): Partial<DongTu>  // chỉ field THỰC SỰ khác; '' → null
```

### T5 · `0010_xoa_chu_de.sql` — như §4.4 (RPC + revoke anon).

### T6–T12 · `src/features/vocab/TuVungPage.tsx` (+ `FormSuaTu.tsx`, `HopXacNhan.tsx`)
- `TuVungPage` dùng `useParams()` lấy `topicId`; PC luôn hiện 2 cột (`hidden md:flex` cho cột trái
  khi ở route con trên Mobile), Mobile hiện 1 trong 2 theo route.
- Xoá từ:
```ts
const { data } = await supabase.from('exercises').select('vocab_id, type, vocab(word)')
  .eq('payload->>blank_b_vocab_id', id)
const vuong = (data ?? []).filter((e) => e.vocab_id !== id)
if (vuong.length > 0) return setChan(`Từ này đang là vai B trong câu hội thoại của: ${ten.join(', ')}`)
await supabase.from('vocab').delete().eq('id', id)
```
- Lưu sửa: `const thay = docThayDoi(cu, moi); if (canXoaAudio(cu.word, moi.word)) thay.audio_url = null`
- Xoá chủ đề: `supabase.rpc('xoa_chu_de', { p_topic_id })` → hiện `{so_tu_xoa, so_tu_go}`.
- Đổi tên: `update topics set name, description` — ô nhập + nút Lưu tường minh (bài học MB-23/Q3).

### T13–T15 · như §5.
