# DESIGN.md — M4a: Lõi Player + Stage 0 + Tổng kết phiên

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản M2b (đã lưu ở `DESIGN.M2b.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-16 · Trạng thái: **✅ HOÀN THÀNH 2026-09-16 — 22/22 task, test 116/116, test:player 4/4, CDP 2 lượt thật + retry (MB-20)**

---

## 0. Phạm vi (đã chốt ở Brainstorm 2026-09-16)

**Làm (M4a):**
- `src/lib/player.ts` + test — THUẦN: ngày VN, xếp thứ tự bài trong session, đánh dấu bài cuối của từ,
  luật chấm Matching, random Fast Decision (nhận rng), shuffle (nhận rng), tổng hợp Tổng kết, đếm "còn chờ".
- `supabase/migrations/0008_luu_tra_loi.sql` + `scripts/test-player.mjs` — RPC ghi 1 transaction.
- `src/lib/tts.ts` (tối thiểu) — `phatAm(text, lang, audio_url)`: `audio_url` → `<audio>`, không → Web Speech.
- `src/features/player/` — `PlayerPage` (route `/on-tap`, NGOÀI AppShell), `ExerciseShell`, `Ring`,
  5 màn bài: `Flashcard` · `Grammar` · `Matching` · `TracNghiem` (Selection + Audio Recognition) ·
  `FastDecision`; `TongKetPage` (route `/on-tap/tong-ket`, ngoài shell).
- `icons.tsx` — thêm `goi-y` (bóng đèn) · `bo-qua` · `dong` (X) · `mui-ten` · `an-mung` (trích mockup) · `loa` (tự vẽ).

**KHÔNG làm:** 8 dạng stage 1–2 (M4b) · 3 dạng AI (M5) · Google TTS gen (M6) · ôn theo topic (M7) ·
Dashboard. `/on-tap` ra khỏi `AppShell` (đúng mockup Player không có nav).

**Quyết định đã chốt:** thứ tự bài **theo dạng bài, xen kẽ từ** · ghi DB qua **RPC 1 transaction** ·
2 màn không có mockup ("không có từ due", "đang tải") tái dùng card + giọng nhẹ nhàng.

---

## 1. Số liệu mockup (PC `02 05 06 07 10 12`; Mobile cùng giá trị, nhỏ hơn 1 nấc)

### 1.1 Exercise Shell (màn 02, 07)
| Phần | Mockup PC / Mobile | Utility |
|---|---|---|
| Khung | PC: shell căn giữa, nội dung `max-width 600` (MCQ) / 560 (Fast) / 520 (Flashcard) / 620 (Matching) / 640 (Grammar); Mobile full-width 390 | `mx-auto w-full max-w-[600px]` (prop theo màn) |
| Header | `padding 36px 64px` / `22px 22px 8px`, `border-bottom #F0ECE4` (Grammar/Flashcard: không viền), `space-between` | `flex items-center justify-between border-b border-border-card px-[22px] pt-[22px] pb-2 md:px-16 md:py-9` |
| Ring | 60px (PC) / 56 (Mobile), track `#F0ECE4` sw 5, tiến độ màu ring-N, `r=26`, `dasharray 163.4`, `rotate(-90)`, icon giữa 24/22 | `Ring` SVG; icon = `IconCay` màu = màu ring |
| 3 nút ghost | gap 22/16; mỗi nút cột dọc gap 4/3, `#8B8593`, icon 19/17, nhãn 10.5/9.5 500; "拼" Noto Sans SC 16/15 600 | `flex flex-col items-center gap-1 text-content-muted` · đang bật phiên âm → `text-accent` (tự quyết theo `UI_DESIGN.md` §10.4) |
| Thẻ câu hỏi | `#FBFAF6` viền `#F0ECE4` r20 `padding 36px 28px` center; từ Noto Sans SC 600 **44px**; dòng phụ 15 muted mt 10 | `rounded-20 border border-border-card bg-surface-card px-7 py-9 text-center` · `font-han text-44 font-semibold` |
| 4 đáp án | grid 2×2 gap 14; ô `#FFFFFF` viền `#E5E5E5` r14 p20 16.5/500; **sai**: `#FEE2E2` viền 1.5 `#ef4444` chữ `#B91C1C` 600; **đúng**: `#DCFCE7` viền `#4ade80` chữ `#15803D` | `rounded-14 border border-border-input bg-surface-raised p-5 text-16 font-medium` · sai `bg-danger-bg border-danger text-danger-text font-semibold` · đúng `bg-success-bg border-success text-success-text` |
| Progress dots | `padding 0 0 36px`, gap 9, chấm 9px: đã xong/hiện tại `#5B4FE8`; chưa `border 1.5 #DCD3EA` | `bg-accent` / `border-[1.5px] border-border-dot` |
| Nút thoát | màn 06: X 20px `#8B8593` sw 2 góc phải header | `dong` icon — **tự quyết: có ở MỌI màn** (mockup MCQ không vẽ, nhưng §4.6 cho thoát giữa chừng) |

### 1.2 Từng màn
- **Matching (05):** header = tiêu đề "Ghép cặp" Baloo 22 + "3/5 đã ghép" 14/600 muted; 2 cột `max-w 620` gap 16, cột gap 14; ô r14 p18: chữ Hán 17 Noto / nghĩa 15.5; **đang chọn** `#EDEBFC` viền 1.5 `#5B4FE8` chữ `#4338CA` 600; **đã ghép** `#DCFCE7` viền 1.5 `#4ade80` chữ `#15803D` 600 `opacity .7` + disable; sai → tô đỏ ô vừa chọn 600ms rồi trả về trung tính. Không ring, không dots.
- **Flashcard (06):** header tiêu đề "Flashcard" + X; thẻ r24 `padding 56 28`, từ **52px**, pinyin 15 mt12, "Chạm để xem nghĩa" 13 `#B7AFC9` mt20 → chạm lật: hiện nghĩa (+ cụm từ) ; 3 nút gap 12 r14 p16: Again `#FEE2E2/#B91C1C` · Hard `#FEF9C3/#946200` · Good `#DCFCE7/#15803D` 15/600. Không ring.
- **Fast Decision (07):** header ring + **chỉ 2 ghost** (Phiên âm, Bỏ qua); thanh đếm `h 10` r99 nền `#F0ECE4`, phần trôi `#eab308` co dần 4s (CSS `transition width linear 4s`); thẻ từ 40px + "= **nghĩa** ?" 17; 2 nút r16 p24 18/700: Sai `#FEE2E2/#B91C1C` · Đúng `#DCFCE7/#15803D`; hết giờ = sai.
- **Grammar (10):** header chỉ "拼" bên phải, không viền; thẻ `max-w 640` r20 `padding 36 30`: câu Noto 23 lh1.6 (cho phép `<b>` — payload là text thuần → render `content_target` với từ vựng in đậm bằng tách chuỗi), dịch 15 muted mt16; nút "Tiếp theo" tím 16/600 p17 r14. Không ring, không ghi DB.
- **Audio Recognition (KHÔNG có mockup — biến thể pattern 1):** thẻ câu hỏi thay chữ Hán bằng **nút loa 64px** tròn `bg-accent-tint text-accent` (icon `loa` 28, tự vẽ cùng nét) + dòng phụ "Nghe và chọn nghĩa đúng"; bấm phát lại; tự phát 1 lần khi vào bài. Gợi ý = hiện chữ Hán nhỏ dưới loa.
- **Tổng kết (12):** `max-w 640` gap 20 `padding 48 40`; header icon `an-mung` 46 tím + "Làm tốt lắm!" Baloo 26 + "Tổng kết hôm nay · Thứ Năm, 16/7" 14.5 muted; 3 thẻ gap 14 r16 p20: `+46` `#EDEBFC/#4338CA` "Điểm hôm nay" 12.5 `#5B4FE8` · `18` `#F0ECE4/#241B3A` "Từ đã ôn" muted · `7` `#DCFCE7/#15803D` "Lên stage"; **thẻ Mastered** `#FEF9C3` viền 1.5 `#EAB308` r18 p20 gap14: `IconCay mastered` 34 `#16a34a` + "THÀNH TÍCH MỚI" 12.5/700 `#946200` uppercase + "「苹果」 đã đạt Mastered hôm nay" 15.5/600; **danh sách** card `#FBFAF6` r18 `padding 8 18`, dòng p12 viền dưới: từ Noto 16 · phải: `IconCay before` 17 → `mui-ten` 13 muted → `IconCay after` 17 (màu tượng trưng theo stage) hoặc "chưa đủ điểm" 13 `#B7AFC9`; dòng "N từ chưa đủ điểm hôm nay sẽ tiếp tục ôn vào ngày mai." 13.5 muted center; CTA: (còn chờ) "Còn N từ đang chờ bạn hôm nay" + [Ôn tiếp] tím p16 r14 + [Về Dashboard] ghost muted 14.5; (hết) chỉ [Về Dashboard] tím. **Thêm (tự quyết):** nếu retry queue hôm nay có hàng → nút phụ "Ôn lại N từ chưa đạt" (kiểu Ôn theo chủ đề: `bg-secondary-tint text-secondary`).
- **Không có từ due / Đang tải (không có mockup — đã duyệt):** card `KhungTrang`-style giữa màn: "Hôm nay không có từ nào cần ôn 🎉"-không emoji → "Hôm nay không có từ nào cần ôn." + dòng muted "Từ mới sẽ được thêm mỗi sáng." + [Về Dashboard]. Đang tải: thẻ câu hỏi skeleton `bg-surface-sunken animate-pulse` đúng shape.

---

## 2. Kiến trúc

### 2.1 Luồng dữ liệu `PlayerPage`
```
mount → homNayVN() → SELECT word_state.*, vocab(*) WHERE next_review_date <= hôm_nay AND stage <> 'mastered'
      → gomSession(ds) → session đầu (≤5 từ, thuần stage)
      → SELECT exercises WHERE vocab_id IN (session) AND type IN boBaiCua(stage) ∪ {grammar}
      → xepBai({tu, baiTap, daDat}) → mảng MÀN  (player.ts, thuần)
      → mỗi câu trả lời: xuLyTraLoi(...) → rpc('luu_tra_loi', {...}) → cập nhật trang_thai cục bộ → màn kế
      → hết màn: còn session khác? → tải session kế (cùng luồng) : → /on-tap/tong-ket
      → bấm X: → /on-tap/tong-ket (nếu chưa xong từ nào → về / luôn)
?che_do=retry → SELECT daily_retry_queue WHERE queue_date = hôm_nay → xepBai(chỉ exercise_types trong hàng, không Flashcard/Grammar)
```

### 2.2 Kiểu màn (`player.ts`)
```ts
export type Man =
  | { loai: 'flashcard'; vocab_id: string }
  | { loai: 'grammar'; vocab_id: string; payload: { content_target: string; pinyin?: string; content_vi: string } }
  | { loai: 'matching'; vocab_ids: string[]; la_bai_cuoi: Record<string, boolean> }   // 1 màn cho cả session
  | { loai: 'selection' | 'audio_recognition'; vocab_id: string; payload: { distractors: string[] }; la_bai_cuoi_cua_tu: boolean }
  | { loai: 'fast_decision'; vocab_id: string; payload: { wrong_meaning: string }; la_bai_cuoi_cua_tu: boolean }
```
Thứ tự: `flashcard×N → grammar×N → matching → selection×N → audio_recognition×N → fast_decision×N`
(chỉ dạng CÓ trong `boBaiCua(stage)`; bỏ dạng đã nằm trong `cycle_completed_exercises` của từ; dạng cần
record mà không có record → bỏ + đếm vào `thieu[]`). `la_bai_cuoi_cua_tu` = không còn màn tính điểm nào
sau đó cho cùng `vocab_id` (Matching TÍNH điểm nên cũng được xét).

### 2.3 Hàm thuần `player.ts`
```ts
export function homNayVN(now: Date): string                       // 'yyyy-mm-dd' theo Asia/Ho_Chi_Minh (Intl, không lib)
export function xepBai(dv: { tu: TrangThaiTu[]; baiTap: BaiTapDb[]; dangChoPhep?: DangBai[] }): { man: Man[]; thieu: { vocab_id: string; type: DangBai }[] }
export function xaoTron<T>(ds: T[], rng: () => number): T[]        // Fisher–Yates, rng tiêm vào để test
export function chonNghiaFastDecision(dung: string, sai: string, rng: () => number): { hien: string; la_dung: boolean }
export function chamMatching(luot: { trai: string; phai: string }[], dapAn: Record<string, string>): Record<string, boolean>  // đúng nếu lần chạm ĐẦU TIÊN tới từ đó là đúng
export function tongHopTongKet(log: DongLogDb[], ws: Pick<TrangThaiTu,'vocab_id'|'stage'>[]): TongKet
export function demConCho(due: string[], daOnHomNay: string[]): number
export function dinhDangNgayVN(iso: string): string                 // "Thứ Năm, 16/7"
```
`TongKet = { diem: number; so_tu_da_on: number; so_len_stage: number; mastered: string[]; chi_tiet: { vocab_id; stage_before; stage_after; len_stage: boolean }[]; so_chua_dat: number }`
— `stage_before` = của dòng log ĐẦU tiên trong ngày, `stage_after` = của dòng CUỐI (spec §4.6 dùng min/max theo thứ tự stage, tương đương vì không bao giờ tụt stage DEC-09).

### 2.4 RPC `luu_tra_loi` (migration 0008, idempotent)
```sql
create or replace function luu_tra_loi(
  p_state jsonb,          -- null với Flashcard (không đổi word_state)
  p_log   jsonb,          -- 1 dòng review_log (luôn có)
  p_retry jsonb,          -- {reason, exercise_types} hoặc null
  p_xoa_retry boolean default false   -- chế độ retry: xoá hàng cũ của từ trong ngày trước khi ghi
) returns void language plpgsql as $fn$
declare v_id uuid := (p_log ->> 'vocab_id')::uuid;
        v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if p_state is not null then
    update word_state set stage = (p_state->>'stage')::word_stage,
      next_review_date = (p_state->>'next_review_date')::date,
      cycle_points = (p_state->>'cycle_points')::int,
      cycle_completed_exercises = coalesce(p_state->'cycle_completed_exercises','[]'::jsonb),
      total_points = (p_state->>'total_points')::int,
      last_reviewed_at = now(), updated_at = now()
    where vocab_id = v_id;
  end if;
  insert into review_log (vocab_id, exercise_type, is_correct, used_hint, points, stage_before, stage_after)
  values (v_id, (p_log->>'exercise_type')::exercise_type, (p_log->>'is_correct')::boolean,
          coalesce((p_log->>'used_hint')::boolean,false), coalesce((p_log->>'points')::int,0),
          (p_log->>'stage_before')::word_stage, (p_log->>'stage_after')::word_stage);
  if p_xoa_retry or p_retry is not null then
    delete from daily_retry_queue where vocab_id = v_id and queue_date = v_ngay;
  end if;
  if p_retry is not null then
    insert into daily_retry_queue (vocab_id, reason, exercise_types, queue_date)
    values (v_id, p_retry->>'reason', p_retry->'exercise_types', v_ngay);
  end if;
end $fn$;
revoke execute on function luu_tra_loi(jsonb,jsonb,jsonb,boolean) from public, anon;
grant execute on function luu_tra_loi(jsonb,jsonb,jsonb,boolean) to authenticated;
```
Không `security definer` → chịu RLS như app. **Luật §9.3:** không `current_date`. Test SQL `scripts/test-player.mjs`
(`begin…rollback`): P1 ghi state+log · P2 retry thay thế hàng cũ · P3 `p_xoa_retry` xoá không ghi mới · P4 state null chỉ ghi log.

### 2.5 State máy `PlayerPage` (useReducer, thuần trong `player.ts`)
```
dang_tai → (khong_co_tu | dang_on{man[], chi_so, trang_thai: Record<vocab_id, TrangThaiTu>, daXongTu: Set})
dang_on --tra_loi--> dang_luu → (ok → chi_so+1 | loi_luu{thong_diep}) --thu_lai--> dang_luu
dang_on --hard(flashcard)--> đẩy màn về cuối · --thoat--> tong_ket
hết man → còn session? tải tiếp : tong_ket
```
Side-effect duy nhất ở component: query, `rpc`, `phatAm`, timer Fast Decision.

### 2.6 Chấm & ghi theo màn
| Màn | `dung` | Ghi |
|---|---|---|
| Selection / Audio | chọn = `meaning_vi`; gợi ý (loại 1 sai/lần, tối đa 2) → `dung_goi_y` | `xuLyTraLoi` + RPC(state, log, retry) |
| Fast Decision | (chọn Đúng) == `la_dung`; hết giờ → sai; không gợi ý | như trên |
| Matching | `chamMatching` sau khi ghép đủ → N lần `xuLyTraLoi` + N RPC tuần tự | `dang_bai='matching'` |
| Flashcard | Good/Hard/Again → không điểm | RPC(null, log points 0, retry nếu Again) |
| Grammar | — | không ghi |
| Bỏ qua | `dung=false` | như Selection |
`dang_due = true` với mọi từ trong session (M4a chưa có dialog 2 từ).

---

## 3. Kế hoạch — 22 task (2–5 phút/task)

**Lớp thuần (TDD RED→GREEN từng cặp)**
- T1/T2 · `homNayVN`, `dinhDangNgayVN` (Intl `Asia/Ho_Chi_Minh`; ca: 2026-09-16T17:30Z → 17/9).
- T3/T4 · `xepBai` — 5 ca: thứ tự dạng bài xen kẽ từ · bỏ dạng đã đạt · thiếu record → `thieu` · `la_bai_cuoi_cua_tu` đúng từ · `dangChoPhep` (retry) lọc.
- T5/T6 · `xaoTron` (rng tiêm) · `chonNghiaFastDecision` (rng<0.5 → nghĩa đúng) · `chamMatching` (lần đầu sai → từ đó false dù sau ghép đúng).
- T7/T8 · `tongHopTongKet` (điểm cộng dồn, từ đã ôn = distinct vocab, lên stage = before≠after, mastered, chưa đạt = có log mà không lên stage) · `demConCho`.
- T9/T10 · reducer `giamPlayer` — 6 ca (tra_loi → dang_luu → ok tăng chỉ số · loi_luu/thu_lai · hard đẩy cuối · hết màn → `het_session` · thoat).
- T11 · Test X-player: `player.ts` chỉ import từ `./srs.ts`.

**DB**
- T12 · `0008_luu_tra_loi.sql` (§2.4) + `npm run db:migrate` (chạy 2 lần vẫn xanh).
- T13 · `scripts/test-player.mjs` P1–P4 + script `test:player` trong `package.json`; chạy ĐỎ trước khi migrate (hàm chưa có) rồi XANH.

**UI**
- T14 · `icons.tsx` +6 icon (`goi-y` `bo-qua` `dong` `mui-ten` `an-mung` trích mockup; `loa` tự vẽ).
- T15 · `Ring.tsx` (props `total_points`, `stage`, `size`) + `ExerciseShell.tsx` (header ring/tiêu đề + ghost + X, khung `max-w`, dots).
- T16 · `tts.ts` `phatAm` (audio_url → `<audio>`; không → `speechSynthesis`, `zh-CN`/`en-US`, huỷ phát trước).
- T17 · `TracNghiem.tsx` (Selection + Audio: 4 ô, feedback, gợi ý loại dần, auto-next 600/1000ms).
- T18 · `FastDecision.tsx` (thanh 4s CSS transition, 2 nút, timeout).
- T19 · `Matching.tsx` (xáo 2 cột, chọn trái/phải, tô màu, đếm "k/N đã ghép", xong → chấm).
- T20 · `Flashcard.tsx` + `Grammar.tsx`.
- T21 · `PlayerPage.tsx` (tải, reducer, RPC, chuyển session, retry mode, lỗi lưu, không có từ, đang tải) + `TongKetPage.tsx` + `App.tsx` (2 route ngoài shell; bỏ `/on-tap` khỏi stub).
- T22 · build · lint · test · **kiểm thật CDP** trên 8 từ due thật: chạy hết 1 session `new` (5 từ), đối chiếu `review_log`/`word_state`/`daily_retry_queue` qua PostgREST; Flashcard Again → retry; Fast Decision timeout; thoát giữa chừng → Tổng kết "Còn N từ"; chụp PC/Mobile light/dark; tắt process; memory-bank (MB-20).

⚠️ T22 **ghi dữ liệu ôn tập thật** vào DB (điểm, stage có thể lên `stage1`). Đây là mục đích của app — nhưng nếu bạn muốn giữ DB "sạch" để tự ôn lần đầu, nói tôi dừng ở kiểm 1–2 bài rồi rollback bằng tay.

---

## 4. Điểm tự quyết ngoài mockup (soát ở Bước 4) — đã soát ✅
7. Progress dots = khối dạng bài (≤6), không phải từng màn (26 chấm tràn mobile).
8. Phát hiện khi kiểm thật → vá: bug updater StrictMode ghi đúp; lỗ hổng spec "đạt hết bộ mà thiếu điểm"
   (R2d, srs.ts); "Còn N từ" = due − retry. Chi tiết MB-20.

1. Nút X thoát ở mọi header Player (mockup chỉ vẽ ở Flashcard).
2. Màn Audio Recognition: nút loa 64px trong thẻ câu hỏi; icon `loa` tự vẽ cùng nét.
3. Sai → tô đỏ ô đã chọn, tự sang bài sau 1000ms (đúng: 600ms). Không lộ đáp án đúng.
4. Nút "Ôn lại N từ chưa đạt" ở Tổng kết (spec có retry nhưng mockup không vẽ CTA).
5. Gợi ý ở Selection = loại dần đáp án sai (tối đa 2 lần); ở Audio = hiện chữ Hán.
6. Reload giữa session: Flashcard/Grammar chạy lại (không ghi DB), bài tính điểm đã đạt được bỏ qua.

---

## 5. PLAN chi tiết — code cụ thể từng task

### T1 · RED `src/lib/player.test.ts` — ngày VN
```ts
import { describe, expect, it } from 'vitest'
import { dinhDangNgayVN, homNayVN } from './player.ts'
describe('homNayVN', () => {
  it('17:30Z ngày 16/9 = 00:30 ngày 17/9 giờ VN', () => {
    expect(homNayVN(new Date('2026-09-16T17:30:00Z'))).toBe('2026-09-17')
  })
  it('16:30Z vẫn là 16/9', () => { expect(homNayVN(new Date('2026-09-16T16:30:00Z'))).toBe('2026-09-16') })
})
describe('dinhDangNgayVN', () => {
  it('2026-09-17 → "Thứ Năm, 17/9"', () => { expect(dinhDangNgayVN('2026-09-17')).toBe('Thứ Năm, 17/9') })
  it('Chủ nhật', () => { expect(dinhDangNgayVN('2026-09-20')).toBe('Chủ Nhật, 20/9') })
})
```
### T2 · GREEN
```ts
import { boBaiCua, type DangBai, type Stage, type TrangThaiTu } from './srs.ts'
/** Player logic THUẦN — chỉ import srs.ts. Component chỉ query/rpc/phát âm rồi dispatch. */
const TZ = 'Asia/Ho_Chi_Minh'
export function homNayVN(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
export function dinhDangNgayVN(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const thu = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
  return `${THU[thu]}, ${d}/${m}`
}
```

### T3 · RED — `xepBai` (5 ca)
```ts
const tu = (id: string, stage: Stage = 'new', daDat: DangBai[] = []): TrangThaiTu => ({
  vocab_id: id, stage, next_review_date: '2026-09-10', cycle_points: 0, cycle_completed_exercises: daDat, total_points: 0, last_reviewed_at: null,
})
const bai = (vocab_id: string, type: DangBai, payload: object = {}) => ({ id: `${vocab_id}-${type}`, vocab_id, type, payload })
const BO = (ids: string[]) => ids.flatMap((v) => [bai(v,'grammar',{content_target:'x',content_vi:'y'}), bai(v,'selection',{distractors:['a','b','c']}), bai(v,'audio_recognition',{distractors:['a','b','c']}), bai(v,'fast_decision',{wrong_meaning:'z'})])
describe('xepBai', () => {
  it('thứ tự theo dạng bài, xen kẽ từ; matching là 1 màn', () => {
    const { man } = xepBai({ tu: [tu('a'), tu('b')], baiTap: BO(['a','b']) })
    expect(man.map((m) => m.loai)).toEqual(['flashcard','flashcard','grammar','grammar','matching','selection','selection','audio_recognition','audio_recognition','fast_decision','fast_decision'])
  })
  it('bỏ dạng đã đạt trong cycle_completed_exercises', () => {
    const { man } = xepBai({ tu: [tu('a','new',['selection','matching'])], baiTap: BO(['a']) })
    expect(man.some((m) => m.loai === 'selection' || m.loai === 'matching')).toBe(false)
  })
  it('thiếu record → bỏ + báo', () => {
    const { man, thieu } = xepBai({ tu: [tu('a')], baiTap: BO(['a']).filter((b) => b.type !== 'fast_decision') })
    expect(thieu).toEqual([{ vocab_id: 'a', type: 'fast_decision' }])
    expect(man.some((m) => m.loai === 'fast_decision')).toBe(false)
  })
  it('la_bai_cuoi_cua_tu chỉ đúng ở màn tính điểm cuối của từ', () => {
    const { man } = xepBai({ tu: [tu('a')], baiTap: BO(['a']) })
    const diem = man.filter((m) => 'la_bai_cuoi_cua_tu' in m) as { la_bai_cuoi_cua_tu: boolean }[]
    expect(diem.map((m) => m.la_bai_cuoi_cua_tu)).toEqual([false, false, true])
  })
  it('retry: chỉ dạng cho phép, không flashcard/grammar', () => {
    const { man } = xepBai({ tu: [tu('a')], baiTap: BO(['a']), dangChoPhep: ['fast_decision'] })
    expect(man.map((m) => m.loai)).toEqual(['fast_decision'])
  })
})
```
### T4 · GREEN
```ts
export type BaiTapDb = { id: string; vocab_id: string; type: DangBai; payload: Record<string, unknown> }
export type Man =
  | { loai: 'flashcard'; vocab_id: string }
  | { loai: 'grammar'; vocab_id: string; payload: { content_target: string; pinyin?: string; content_vi: string } }
  | { loai: 'matching'; vocab_ids: string[]; la_bai_cuoi: Record<string, boolean> }
  | { loai: 'selection' | 'audio_recognition'; vocab_id: string; payload: { distractors: string[] }; la_bai_cuoi_cua_tu: boolean }
  | { loai: 'fast_decision'; vocab_id: string; payload: { wrong_meaning: string }; la_bai_cuoi_cua_tu: boolean }
const CAN_RECORD: ReadonlySet<DangBai> = new Set(['grammar','selection','audio_recognition','fast_decision'])
const THU_TU_MAN: readonly DangBai[] = ['flashcard','grammar','matching','selection','audio_recognition','fast_decision']

export function xepBai(dv: { tu: TrangThaiTu[]; baiTap: BaiTapDb[]; dangChoPhep?: DangBai[] }) {
  const { tu, baiTap, dangChoPhep } = dv
  const stage = tu[0]?.stage ?? 'new'
  const tinhDiem = new Set(boBaiCua(stage))
  const choPhep = (d: DangBai) => (dangChoPhep ? dangChoPhep.includes(d) : d === 'flashcard' || d === 'grammar' || tinhDiem.has(d))
  const thieu: { vocab_id: string; type: DangBai }[] = []
  const man: Man[] = []
  for (const dang of THU_TU_MAN) {
    if (!choPhep(dang)) continue
    if (dang === 'matching') {
      const ids = tu.filter((t) => !t.cycle_completed_exercises.includes('matching')).map((t) => t.vocab_id)
      if (ids.length > 0) man.push({ loai: 'matching', vocab_ids: ids, la_bai_cuoi: {} })
      continue
    }
    for (const t of tu) {
      if (tinhDiem.has(dang) && t.cycle_completed_exercises.includes(dang)) continue
      if (dang === 'flashcard') { man.push({ loai: 'flashcard', vocab_id: t.vocab_id }); continue }
      const b = baiTap.find((x) => x.vocab_id === t.vocab_id && x.type === dang)
      if (!b) { if (CAN_RECORD.has(dang)) thieu.push({ vocab_id: t.vocab_id, type: dang }); continue }
      if (dang === 'grammar') man.push({ loai: 'grammar', vocab_id: t.vocab_id, payload: b.payload as never })
      else if (dang === 'fast_decision') man.push({ loai: 'fast_decision', vocab_id: t.vocab_id, payload: b.payload as never, la_bai_cuoi_cua_tu: false })
      else man.push({ loai: dang, vocab_id: t.vocab_id, payload: b.payload as never, la_bai_cuoi_cua_tu: false })
    }
  }
  const daThay = new Set<string>()          // duyệt ngược: màn tính điểm cuối của từng từ
  for (let i = man.length - 1; i >= 0; i--) {
    const m = man[i]!
    if (m.loai === 'matching') { for (const id of m.vocab_ids) { m.la_bai_cuoi[id] = !daThay.has(id); daThay.add(id) } }
    else if ('la_bai_cuoi_cua_tu' in m) { m.la_bai_cuoi_cua_tu = !daThay.has(m.vocab_id); daThay.add(m.vocab_id) }
  }
  return { man, thieu }
}
```

### T5 · RED — `xaoTron` · `chonNghiaFastDecision` · `chamMatching`
```ts
const rngCoDinh = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]! }
it('xaoTron không đổi phần tử', () => { expect([...xaoTron([1,2,3,4], rngCoDinh(0.1,0.9,0.5))].sort()).toEqual([1,2,3,4]) })
it('rng<0.5 → hiện nghĩa đúng', () => { expect(chonNghiaFastDecision('táo','lê', () => 0.2)).toEqual({ hien: 'táo', la_dung: true }) })
it('rng>=0.5 → hiện nghĩa sai', () => { expect(chonNghiaFastDecision('táo','lê', () => 0.7)).toEqual({ hien: 'lê', la_dung: false }) })
it('chamMatching: lần chạm đầu sai → từ đó sai dù sau ghép đúng', () => {
  expect(chamMatching([{ trai: 'a', phai: 'B' }, { trai: 'a', phai: 'A' }, { trai: 'b', phai: 'B' }], { a: 'A', b: 'B' })).toEqual({ a: false, b: true })
})
```
### T6 · GREEN
```ts
export function xaoTron<T>(ds: T[], rng: () => number): T[] {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!] }
  return a
}
export function chonNghiaFastDecision(dung: string, sai: string, rng: () => number) {
  const la_dung = rng() < 0.5
  return { hien: la_dung ? dung : sai, la_dung }
}
/** Mỗi từ đúng nếu lần chạm ĐẦU TIÊN tới nó là ghép đúng. */
export function chamMatching(luot: { trai: string; phai: string }[], dapAn: Record<string, string>): Record<string, boolean> {
  const kq: Record<string, boolean> = {}
  for (const l of luot) if (!(l.trai in kq)) kq[l.trai] = dapAn[l.trai] === l.phai
  return kq
}
```

### T7 · RED — `tongHopTongKet` · `demConCho`
```ts
const log = (vocab_id: string, points: number, b: Stage, a: Stage) => ({ vocab_id, points, stage_before: b, stage_after: a, is_correct: points > 0 })
it('tổng hợp cả ngày', () => {
  const kq = tongHopTongKet([log('a',1,'new','new'), log('a',1,'new','stage1'), log('b',0,'new','new'), log('c',4,'stage3','mastered')])
  expect(kq).toEqual({ diem: 6, so_tu_da_on: 3, so_len_stage: 2, mastered: ['c'], so_chua_dat: 1,
    chi_tiet: [{ vocab_id: 'a', stage_before: 'new', stage_after: 'stage1', len_stage: true }, { vocab_id: 'b', stage_before: 'new', stage_after: 'new', len_stage: false }, { vocab_id: 'c', stage_before: 'stage3', stage_after: 'mastered', len_stage: true }] })
})
it('demConCho = due chưa có log hôm nay', () => { expect(demConCho(['a','b','c'], ['b'])).toBe(2) })
```
### T8 · GREEN
```ts
export type DongLogDb = { vocab_id: string; points: number; stage_before: Stage; stage_after: Stage; is_correct: boolean }
export type TongKet = { diem: number; so_tu_da_on: number; so_len_stage: number; mastered: string[]; so_chua_dat: number; chi_tiet: { vocab_id: string; stage_before: Stage; stage_after: Stage; len_stage: boolean }[] }
export function tongHopTongKet(log: DongLogDb[]): TongKet {
  const theoTu = new Map<string, { dau: Stage; cuoi: Stage }>()
  let diem = 0
  for (const d of log) { diem += d.points; const c = theoTu.get(d.vocab_id); theoTu.set(d.vocab_id, { dau: c?.dau ?? d.stage_before, cuoi: d.stage_after }) }
  const chi_tiet = [...theoTu].map(([vocab_id, s]) => ({ vocab_id, stage_before: s.dau, stage_after: s.cuoi, len_stage: s.dau !== s.cuoi }))
  return { diem, so_tu_da_on: chi_tiet.length, so_len_stage: chi_tiet.filter((c) => c.len_stage).length,
    mastered: chi_tiet.filter((c) => c.stage_after === 'mastered').map((c) => c.vocab_id), so_chua_dat: chi_tiet.filter((c) => !c.len_stage).length, chi_tiet }
}
export function demConCho(due: string[], daOnHomNay: string[]): number { const s = new Set(daOnHomNay); return due.filter((v) => !s.has(v)).length }
```

### T9 · RED — reducer `giamPlayer` (6 ca) · T10 · GREEN
```ts
export type TrangThaiPlayer =
  | { buoc: 'dang_tai' } | { buoc: 'khong_co_tu' }
  | { buoc: 'dang_on'; man: Man[]; chi_so: number; trang_thai: Record<string, TrangThaiTu>; da_xong_tu: string[]; dang_luu: boolean; loi_luu: string | null }
  | { buoc: 'het_session'; da_xong_tu: string[] } | { buoc: 'thoat'; da_xong_tu: string[] }
export type HanhDongPlayer =
  | { loai: 'nap'; man: Man[]; trang_thai: Record<string, TrangThaiTu> } | { loai: 'khong_co_tu' }
  | { loai: 'bat_dau_luu' } | { loai: 'luu_ok'; trang_thai_moi?: TrangThaiTu; xong_tu?: string } | { loai: 'luu_loi'; thong_diep: string } | { loai: 'thu_lai' }
  | { loai: 'sang_man' } | { loai: 'hard_day_cuoi' } | { loai: 'thoat' }
```
Luật: `nap` (man rỗng → `khong_co_tu`) · `bat_dau_luu` set `dang_luu` · `luu_ok` cập nhật `trang_thai[vocab]`, thêm `xong_tu`, rồi sang màn · `sang_man` chi_so+1, vượt cuối → `het_session` · `hard_day_cuoi` đẩy `man[chi_so]` về cuối (chi_so giữ nguyên) · `luu_loi` giữ chi_so, `loi_luu` · `thu_lai` xoá lỗi, set `dang_luu` · `thoat` → `thoat`. Hành động sai bước → trả nguyên state.
Ca test: nap→dang_on chi_so 0 · nap rỗng→khong_co_tu · luu_ok cập nhật state + xong_tu + chi_so 1 · luu_ok ở màn cuối→het_session · hard_day_cuoi đẩy cuối · luu_loi giữ chi_so rồi thu_lai xoá lỗi · sai bước trả cùng tham chiếu.

### T11 · Test X-player: `src/lib/player.ts` chỉ có `import … from './srs.ts'`; không `react`/`@supabase`/`node:`.

### T12 · `supabase/migrations/0008_luu_tra_loi.sql` — SQL §2.4 nguyên văn + comment đầu (idempotent: `create or replace`). `npm run db:migrate` ×2 xanh.
### T13 · `scripts/test-player.mjs` (mẫu `test-import.mjs`, mỗi ca `begin … rollback` qua `chaySql`, seed 1 vocab + word_state tạm):
P1 `luu_tra_loi(state, log, null, false)` → `cycle_points` đổi & +1 log · P2 gọi 2 lần có retry → đúng 1 hàng retry (hàng sau thay hàng trước) · P3 `p_xoa_retry=true, p_retry=null` → 0 hàng · P4 `p_state=null` → word_state không đổi, log +1. Thêm `"test:player"` vào `package.json`. Chạy TRƯỚC migrate phải ĐỎ với message chứa `luu_tra_loi`.

### T14 · `icons.tsx` thêm vào `TenIcon` + `PATH`
```tsx
'goi-y': <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11.2c.6.5 1 1.2 1 2.1v.2h4v-.2c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />,
'bo-qua': (<><path d="M5 5l9 7-9 7V5Z" fill="currentColor" stroke="none" /><rect x="16" y="5" width="2.5" height="14" rx="1" fill="currentColor" stroke="none" /></>),
dong: <path d="M6 6l12 12M18 6L6 18" />,
'mui-ten': <path d="M5 12h14M13 6l6 6-6 6" />,
'an-mung': <path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-1-2-1-2 2 1 3 3 3 5a5 5 0 0 1-10 0c0-6 4-7 5-12Z" />,
loa: (<><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></>),  // tự vẽ cùng nét
```

### T15 · `Ring.tsx` + `ExerciseShell.tsx`
```tsx
// Ring.tsx — DEC-12: % = min(total,30)/30, 6 mốc màu cố định, SVG dasharray (KHÔNG conic)
const MAU = ['text-ring-0','text-ring-1','text-ring-2','text-ring-3','text-ring-4','text-ring-5'] as const
export function mocRing(total: number) { return total >= 30 ? 5 : Math.min(4, Math.floor(total / 6)) }
export default function Ring({ total_points, stage, size = 60 }: { total_points: number; stage: StageCay; size?: number }) {
  const r = 26, C = 2 * Math.PI * r, pct = Math.min(total_points, 30) / 30
  return (
    <div className={`relative ${MAU[mocRing(total_points)]}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="5" className="stroke-border-card" />
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="5" strokeLinecap="round" stroke="currentColor" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 30 30)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center"><IconCay stage={stage} size={size >= 60 ? 24 : 22} /></div>
    </div>
  )
}
```
`ExerciseShell` props: `{ header: ReactNode; ghost?: { phienAm: boolean; toggle: () => void; goiY?: () => void; boQua?: () => void }; thoat: () => void; rong: 520|560|600|620|640; dots?: { tong: number; hienTai: number }; vienHeader?: boolean; children }`.
Header `flex items-center justify-between px-[22px] pt-[22px] pb-2 md:px-16 md:py-9` (+ `border-b border-border-card` nếu `vienHeader`); phải: ghost (`flex flex-col items-center gap-1 text-content-muted`, đang bật phiên âm → `text-accent`) + X (`Icon dong 20`). Thân `flex-1 flex items-center justify-center px-5 py-6 md:p-10` → `w-full max-w-[…]`. Dots `pb-9 flex justify-center gap-[9px]`: `i <= hienTai` → `bg-accent`, còn lại `border-[1.5px] border-border-dot`. Khung ngoài `main.flex.min-h-[100dvh].flex-col.bg-surface-page`; PC không thêm khung viền (mockup không vẽ).

### T16 · `src/lib/tts.ts`
```ts
/** M4a: phát âm 1 từ — audio_url (Google TTS, M6) nếu có; không thì Web Speech API. */
let dangPhat: HTMLAudioElement | null = null
export function phatAm(text: string, lang: 'zh' | 'en', audio_url?: string | null): void {
  dangPhat?.pause(); window.speechSynthesis?.cancel()
  if (audio_url) { dangPhat = new Audio(audio_url); void dangPhat.play().catch(() => {}); return }
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'zh' ? 'zh-CN' : 'en-US'; u.rate = 0.9
  window.speechSynthesis.speak(u)
}
```

### T17 · `TracNghiem.tsx` (Selection + Audio Recognition)
Props `{ vocab, payload, cheDo, hienPhienAm, soGoiY, onTraLoi(dung, dung_goi_y) }`. `luaChon = useMemo(() => xaoTron([meaning_vi, ...distractors], Math.random), [vocab.id])`; gợi ý lần k → k đáp án sai `invisible`, `dung_goi_y = soGoiY > 0`. Chọn → khoá; đúng → ô xanh + `setTimeout(onTraLoi(true), 600)`; sai → CHỈ ô đó đỏ + `setTimeout(onTraLoi(false), 1000)`. `audio_recognition`: thẻ = nút loa 64 `rounded-pill bg-accent-tint text-accent` + "Nghe và chọn nghĩa đúng"; `useEffect(() => phatAm(...), [vocab.id])`; gợi ý → hiện `word` 24px. `selection`: `word` 44 `font-han` + `{pinyin} · Chọn nghĩa đúng` (ẩn pinyin khi tắt).

### T18 · `FastDecision.tsx`
`{ hien, la_dung } = useMemo(() => chonNghiaFastDecision(meaning_vi, wrong_meaning, Math.random), [vocab.id])`; thanh `h-[10px] rounded-pill bg-border-card overflow-hidden > div.h-full.bg-warn` width 100%→0% qua `transition-[width] duration-[4000ms] ease-linear` (kích hoạt sau mount bằng `requestAnimationFrame`); `useEffect` timer 4000ms → `traLoi(false)`; bấm → `traLoi((chon === 'dung') === la_dung)`; clear timer khi trả lời/unmount. Không gợi ý.

### T19 · `Matching.tsx`
`{ dsTu: VocabDb[], onXong(kq) }`. State `trai = xaoTron(ids)`, `phai = xaoTron(ids)` (hiện `meaning_vi`), `chonTrai`, `daGhep: Set`, `luot[]`, `saiTam`. Chạm trái → tint tím; chạm phải khi có `chonTrai` → push lượt; đúng → 2 ô xanh mờ + disable; sai → ô phải đỏ 600ms rồi bỏ chọn. Header "k/N đã ghép". Đủ N → `onXong(chamMatching(luot, dapAn))`.

### T20 · `Flashcard.tsx` (lật bằng `useState`; mặt sau: nghĩa 28 + cụm từ 15 muted; 3 nút chỉ hiện sau khi lật) · `Grammar.tsx` (in đậm `word` trong `content_target` bằng `split(word)`; nút "Tiếp theo").

### T21 · `PlayerPage.tsx` + `TongKetPage.tsx` + `App.tsx`
```tsx
const [tt, dispatch] = useReducer(giamPlayer, { buoc: 'dang_tai' })
const retry = new URLSearchParams(location.search).get('che_do') === 'retry'
async function napSession() {
  const homNay = homNayVN(new Date())
  // thường: word_state (+vocab) due; retry: daily_retry_queue hôm nay (+word_state, +vocab), choPhep = exercise_types ∪
  const phien = gomSession(tu)[0]; if (!phien) return dispatch({ loai: 'khong_co_tu' })
  const { data: bt } = await supabase.from('exercises').select('id, vocab_id, type, payload').in('vocab_id', ids).in('type', [...boBaiCua(stage), 'grammar'])
  dispatch({ loai: 'nap', man: xepBai({ tu: phien, baiTap: bt ?? [], dangChoPhep }).man, trang_thai })
}
async function traLoi(vocab_id, dang_bai, dung, dung_goi_y, la_bai_cuoi) {
  const kq = xuLyTraLoi({ trang_thai: tt.trang_thai[vocab_id], dang_bai, dung, dung_goi_y, dang_due: true, la_bai_cuoi_cua_tu: la_bai_cuoi, hom_nay: homNayVN(new Date()) })
  dispatch({ loai: 'bat_dau_luu' })
  const { error } = await supabase.rpc('luu_tra_loi', { p_state: kq.trang_thai_moi, p_log: kq.dong_review_log, p_retry: kq.vao_retry_queue, p_xoa_retry: retry && la_bai_cuoi })
  if (error) return dispatch({ loai: 'luu_loi', thong_diep: error.message })
  dispatch({ loai: 'luu_ok', trang_thai_moi: kq.trang_thai_moi, ...(la_bai_cuoi ? { xong_tu: vocab_id } : {}) })
}
// Flashcard: Good → rpc(null, log points 0) · Hard → hard_day_cuoi (không ghi) · Again → rpc(null, log, {reason:'flashcard_again', exercise_types:null})
// Matching: onXong → tuần tự traLoi cho từng từ (dang_bai 'matching', la_bai_cuoi = man.la_bai_cuoi[id])
// het_session → còn session due khác? napSession() : navigate('/on-tap/tong-ket') · thoat → da_xong_tu.length ? tong-ket : '/'
```
`TongKetPage`: `review_log` từ `homNay + 'T00:00:00+07:00'` join `vocab(word)`; due `word_state` (còn chờ = `demConCho`); `daily_retry_queue` hôm nay → render §1.2; [Ôn tiếp] `/on-tap` · [Ôn lại N từ] `/on-tap?che_do=retry` · [Về Dashboard] `/`.
`App.tsx`: 2 route `/on-tap`, `/on-tap/tong-ket` **trong `RequireAuth`, ngoài `AppShell`**; lọc `/on-tap` khỏi stub.

### T22 · Nghiệm thu
`build` · `lint` · `npm test` (89 + ~25) · `npm run test:player` 4/4 · CDP: đăng nhập → `/on-tap` → chạy hết 1 session (Again 1 từ ở Flashcard · Selection 1 sai + 1 gợi ý · Fast 1 timeout) → Tổng kết đúng số liệu · đối chiếu PostgREST (`review_log` = số bài, `word_state`, `daily_retry_queue`) · reload giữa session không lặp bài đã đạt · chụp PC light/dark + Mobile · dọn process · memory-bank MB-20.
