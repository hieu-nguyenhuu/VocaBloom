# DESIGN.md — M3: SRS engine (hàm thuần, TDD bắt buộc)

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task M3, ghi đè bản M2 (đã lưu ở `DESIGN.M2.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-09 · Trạng thái: **DESIGN ĐÃ DUYỆT — kế hoạch 18 task bên dưới**

---

## 0. Phạm vi

**Làm:** `src/lib/srs.ts` + `src/lib/srs.test.ts` — toàn bộ luật SRS dưới dạng **hàm thuần**.

**KHÔNG làm:** ghi `word_state`/`review_log`/`daily_retry_queue` xuống Supabase (M4), Player UI,
màn Tổng kết phiên, gọi AI chấm stage 3 (M5).

**Vì sao tách sạch khỏi DB (MB-05):** đây là phần logic dễ sai nhất của cả app (điểm, ngưỡng,
gap co giãn, phạt, rẽ nhánh mastered). Hàm thuần ⇒ test chạy mili-giây, không cần mạng, không cần
dọn dữ liệu ⇒ mới TDD nổi theo `CLAUDE.md` Bước 3.

---

## 1. Quyết định đã chốt với người dùng (2026-09-09)

| Mã | Vấn đề trong spec | **Chốt** |
|---|---|---|
| **Q1** | §3.2 tự mâu thuẫn: bảng liệt kê Matching + ghi `Max/vòng = 4`, nhưng dấu `*` nói Matching không tính điểm; §6.1 lại ghi Matching `+1` | **Matching CÓ tính điểm `+1`**, max vòng stage `new` = **4**, ngưỡng 3/4 (được sai 1 bài). Dấu `*` coi như viết nhầm — chỉ Flashcard và Grammar không tính điểm |
| **Q2** | §3.4 dùng `max_điểm_có_thể_đạt_tới_thời_điểm_promote` nhưng **không chỗ nào định nghĩa** | **Cộng dồn các stage đã qua: 4 / 12 / 24 / 36** |
| **Q3** | Không nói rõ promote được xét lúc nào | **Sau khi từ làm xong bộ bài trong lượt** — khớp §4.2 (xong bộ bài mới biết thiếu bài nào để đẩy vào retry) |
| **Q4** | Stage `intensive` không có dòng nào trong bảng điểm §3.2 | **Dùng nguyên luật stage2**: bài dạng stage2, `+3`/bài, ngưỡng 9/12. Khác duy nhất: không promote, chỉ chờ `total_points ≥ 30` |

**Giả định đã báo trước (chưa bị phản đối):**
- Gợi ý ở stage `new`: `1 × 50%` làm tròn xuống = **0 điểm**, nhưng bài vẫn tính **ĐÃ ĐẠT**
  (không đưa vào retry). Retry một câu đã trả lời đúng là vô nghĩa; hình phạt nằm ở chỗ mất điểm
  nên khó chạm ngưỡng.
- Intensive cũng nhân `gap_factor` như các stage khác.
- `gomSession` nhận sẵn mảng từ due; phần query DB thuộc M4.

---

## 2. Hằng số — gom đúng 1 chỗ, không rải rác

```ts
export const MASTER_THRESHOLD = 30

const DIEM_MOI_BAI  = { new: 1, stage1: 2, stage2: 3, stage3: 4, intensive: 3 }
const NGUONG_CYCLE  = { new: 3, stage1: 6, stage2: 9, stage3: 9, intensive: 9 }
const MAX_CYCLE     = { new: 4, stage1: 8, stage2: 12, stage3: 12, intensive: 12 }
const MAX_TICH_LUY  = { new: 4, stage1: 12, stage2: 24, stage3: 36, intensive: 36 }
const GAP_VAO_STAGE = { new: 1, stage1: 2, stage2: 4, stage3: 7, intensive: 7 }
const PHAT          = { new: 1, stage1: 2, stage2: 3, stage3: 4, intensive: 5, mastered: 0 }
```

> ⚠️ **`GAP_VAO_STAGE` gắn với stage ĐÍCH, không phải stage nguồn.** Đọc thẳng sơ đồ §3.1:
> lên `stage1` thì `+2 × gap_factor`, lên `stage2` thì `+4 ×`, lên `stage3` thì `+7 ×`.
> Hiểu nhầm thành stage nguồn là lệch toàn bộ lịch ôn của app.

Bài tính điểm theo stage (§3.2 + §6):

```ts
const DANG_BAI_THEO_STAGE = {
  new:       ['matching', 'selection', 'audio_recognition', 'fast_decision'],
  stage1:    ['translate', 'select_dialog', 'listen_fill', 'select_on_describe'],
  stage2:    ['fill_dialog', 'select_sentence', 'arrange_words', 'trans_collocation'],
  stage3:    ['make_sentence', 'trans_sentence', 'complete_situation'],
  intensive: ['fill_dialog', 'select_sentence', 'arrange_words', 'trans_collocation'],
}
// flashcard + grammar KHÔNG nằm trong bảng này ⇒ luôn 0 điểm (DEC-11).
```

---

## 3. API

```ts
export type Stage = 'new' | 'stage1' | 'stage2' | 'stage3' | 'intensive' | 'mastered'

export type TrangThaiTu = {
  vocab_id: string
  stage: Stage
  next_review_date: string | null          // ISO yyyy-mm-dd, null = hàng đợi chờ
  cycle_points: number
  cycle_completed_exercises: string[]
  total_points: number
  last_reviewed_at: string | null
}

export function xuLyTraLoi(dv: {
  trang_thai: TrangThaiTu
  dang_bai: DangBai
  dung: boolean
  dung_goi_y: boolean
  dang_due: boolean            // §4.4 — Select/Fill Dialog chỉ cộng điểm cho từ ĐANG due
  la_bai_cuoi_cua_tu: boolean  // Q3 — chỉ xét promote khi đã làm xong bộ bài
  hom_nay: string
}): {
  trang_thai_moi: TrangThaiTu
  dong_review_log: DongReviewLog          // stage_before/stage_after ở MỌI dòng (§4.6)
  vao_retry_queue: { reason: string; exercise_types: string[] } | null
}
```

**Vì sao gộp thành 1 hàm điều phối:** `stage_after` chỉ biết được SAU khi xét promote. Nếu tách
đôi (`chamBai` + `ketThucLuot`) thì M4 phải nhớ "gọi A rồi vá kết quả vào dòng log của B" — một
giao thức ngầm rất dễ làm sai. Các helper vẫn export riêng để test từng luật độc lập:

```ts
export function diemChoBai(stage, dang_bai, dung_goi_y): number
export function tinhHealth(trang_thai): number
export function gapFactor(health: number): 1 | 0.7 | 0.5
export function tinhPhat(stage): number
export function xuLyFlashcard(nut: 'good' | 'hard' | 'again'): { day_cuoi_session; vao_retry }
export function gomSession(dsTu: TrangThaiTu[], soTuMoiSession?: number): TrangThaiTu[][]
```

---

## 4. 6 luật dễ sai đã khoá sẵn

1. **Trả lời SAI KHÔNG phạt** (DEC-08) — chỉ không cộng điểm. Phạt chỉ đến từ cron bỏ lỡ NGÀY ôn,
   và việc đó đã nằm ở `run_daily_maintenance()` (M1), không lặp lại trong `srs.ts`.
2. **KHÔNG BAO GIỜ tụt stage** (DEC-09), kể cả sai liên tiếp. `consecutive_fails` chỉ để dự phòng.
3. **Chưa đạt ngưỡng ⇒ `next_review_date` GIỮ NGUYÊN**, tuyệt đối không dời. Từ vẫn due, lịch
   "tự lành" theo §1.2. Chỉ khi promote mới cộng gap.
4. **Chỉ bài ĐẠT mới ghi vào `cycle_completed_exercises`** — retry chỉ chạy bài chưa đạt (§4.2).
5. **Promote ⇒ reset `cycle_points = 0` và `cycle_completed_exercises = []`** (DEC-05);
   `total_points` KHÔNG BAO GIỜ reset, chỉ cộng hoặc bị cron trừ.
6. **Mastered kiểm ở đúng 2 thời điểm** (§3.3): xong vòng `stage3` lần đầu, và sau mỗi vòng
   `intensive`. `mastered` là trạng thái DỪNG — miễn nhiễm phạt, không còn lịch ôn.

---

## 5. Bộ test Vitest — 21 ca

| Nhóm | Ca | Nội dung |
|---|---|---|
| Điểm | E1–E4 | +1/+2/+3/+4 theo stage · gợi ý giảm 50% làm tròn xuống · flashcard & grammar = 0 · bài không thuộc stage hiện tại = 0 |
| Ngưỡng | P1–P4 | new 3/4 · stage1 6/8 · stage2 9/12 → promote, reset cycle, cộng gap đúng của **stage đích** |
| Health & gap | H1–H4 | `health ≥ 0.8 → 100%` · `0.5 ≤ h < 0.8 → 70%` · `h < 0.5 → 50%` · **biên chính xác tại 0.8 và 0.5** |
| Không tụt stage | K1 | sai 5 lần liên tiếp: `stage` không đổi, `total_points` không giảm |
| Chưa đạt | R1–R2 | `next_review_date` giữ nguyên · `vao_retry_queue` chứa **đúng các bài chưa đạt** |
| Rẽ nhánh cuối | M1–M2 | xong stage3 với `total ≥ 30` → `mastered`; `< 30` → `intensive`; intensive đủ 30 → `mastered` |
| Flashcard | F1 | Good không requeue · Hard đẩy cuối session · Again vào retry `flashcard_again` |
| Dialog 2 từ | D1 | §4.4 — chỉ cộng điểm cho từ `dang_due`, từ kia chấm đúng/sai nhưng 0 điểm |
| Session | S1 | thuần 1 stage · order `stage ASC, next_review_date ASC` · phần dư thành session riêng |
| **Chống lệch TS↔SQL** | X1 | **Đọc `0005_maintenance.sql`, trích bảng phạt bằng regex, so khớp với hằng số `PHAT`** |

> Ca **X1** là loại test đáng giá nhất ở đây: bảng phạt tồn tại **2 nơi** (hàm SQL của M1 và hằng
> số TS của M3). Sửa một nơi quên nơi kia sẽ không có gì báo lỗi — X1 làm chuyện đó phát nổ ngay.

---

## 6. KẾ HOẠCH THỰC THI — 18 task

> Mỗi task 2–5 phút. Thứ tự không đảo: kiểu & hằng số → test ĐỎ → code XANH → refactor.

### Nhóm 1 · Kiểu & hằng số — T1–T2
- **T1** `src/lib/srs.ts`: khai `Stage`, `DangBai`, `TrangThaiTu`, `DongReviewLog`, `KetQuaTraLoi`.
  Chưa viết thân hàm nào.
- **T2** 6 bảng hằng số ở §2 + `DANG_BAI_THEO_STAGE` + `MASTER_THRESHOLD`.

### Nhóm 2 · Test (🔴 RED) — T3–T7
- **T3** `src/lib/srs.test.ts`: helper `tu(...)` dựng `TrangThaiTu` mẫu; ca **E1–E4** (điểm & gợi ý).
- **T4** Ca **P1–P4** (ngưỡng promote, reset cycle, gap của stage đích).
- **T5** Ca **H1–H4** (health & `gap_factor`, chú ý **biên đúng 0.8 và 0.5**).
- **T6** Ca **K1 · R1–R2 · M1–M2 · F1 · D1 · S1**.
- **T7** Ca **X1** (đọc `0005_maintenance.sql`, regex bảng phạt, so với `PHAT`).
  Chạy `npm test` → xác nhận **ĐỎ**. Không sửa gì thêm.

### Nhóm 3 · Helper thuần (🟢 GREEN) — T8–T11
- **T8** `diemChoBai` — tra `DANG_BAI_THEO_STAGE`; bài không thuộc stage hiện tại → 0;
  `dung_goi_y` → `Math.floor(diem / 2)`.
- **T9** `tinhHealth` (`total_points / MAX_TICH_LUY[stage]`) + `gapFactor` (3 mốc, dùng `>=`).
- **T10** `tinhPhat` + `xuLyFlashcard`.
- **T11** `gomSession` — lọc từ due, sort `stage ASC, next_review_date ASC`, cắt nhóm thuần 1 stage,
  mỗi nhóm ≤ 5 từ, phần dư thành session riêng.

### Nhóm 4 · `xuLyTraLoi` (🟢 GREEN) — T12–T15
- **T12** Cộng điểm: `cycle_points` + `total_points` (chỉ khi `dang_due`); ghi
  `cycle_completed_exercises` khi ĐẠT; dựng `dong_review_log` với
  `stage_before = stage_after = stage hiện tại`.
- **T13** Khi `la_bai_cuoi_cua_tu`: so `cycle_points` với `NGUONG_CYCLE`. Đạt → promote sang stage
  kế, reset cycle, `next_review_date = hom_nay + round(GAP_VAO_STAGE[đích] × gapFactor)`,
  cập nhật `stage_after`.
- **T14** Rẽ nhánh cuối: xong vòng `stage3` → `total_points ≥ 30` ? `mastered` : `intensive`;
  vòng `intensive` đạt ngưỡng → kiểm lại mốc 30. `mastered` = DỪNG, `next_review_date = null`.
- **T15** Chưa đạt ngưỡng → **giữ nguyên `next_review_date`** + `vao_retry_queue` với đúng các
  dạng bài chưa nằm trong `cycle_completed_exercises`.

### Nhóm 5 · Nghiệm thu & ký ức — T16–T18
- **T16** `npm test` → **XANH 48/48** (15 token + 12 import + 21 srs). Refactor cho gọn, chạy lại.
- **T17** Chạy trọn bộ: `build` · `lint` · `test:db` · `test:import` · `check:schema` — chứng minh
  M3 không gây hồi quy cho M1/M2.
- **T18** Cập nhật `memory-bank/` (`activeContext` · `progress` · `decisionLog` MB-15) và dọn mọi
  tiến trình nền do phiên tạo.

---

## 7. Bằng chứng nghiệm thu M3

| Lệnh | Kỳ vọng |
|---|---|
| `npm test` | **48/48** — trong đó 21 ca `srs.test.ts`, gồm ca X1 chống lệch TS↔SQL |
| `npm run build` · `npm run lint` | xanh |
| `npm run test:db` · `npm run test:import` · `npm run check:schema` | vẫn 9/9 · 6/6 · 14/14 (không hồi quy) |
| Rà thủ công `srs.ts` | 0 lần import React/Supabase/`node:` — chứng minh vẫn là hàm thuần |
