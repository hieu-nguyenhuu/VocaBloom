# DESIGN.md — M7: Ôn theo chủ đề + Hội thoại kết thúc

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản M6c (đã lưu ở `DESIGN.M6c.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-19 · Trạng thái: **✅ HOÀN THÀNH 2026-09-19 — test 245/245, CDP 14/16 + 8/9 + 5/5**

---

## 0. Phạm vi (chốt ở Brainstorm 2026-09-19)

**Làm:**
- Màn **chọn chủ đề** `/on-tap/chu-de` (⚠️ **chưa có mockup** — layout đã được người dùng duyệt ở §2/Q3).
- **Chế độ topic của Player**: `/on-tap?che_do=topic&topic=<id>`, ôn **toàn bộ** từ trong chủ đề.
- Màn **hội thoại kết thúc** `/on-tap/hoi-thoai?topic=<id>` (mockup 11 PC + Mobile).
- Bật nút **"Ôn theo chủ đề"** ở Dashboard (đang vô hiệu hoá từ M6b).

**KHÔNG làm:** màn Quản lý từ vựng (stub cuối cùng còn lại) · sửa cơ chế SRS hằng ngày.

**0 package mới.**

**Dữ liệu thật (19/09/2026):**

| Chủ đề | Số từ | Stage | Hội thoại |
|---|---|---|---|
| Trái cây | 5 | **3 mastered**, 1 intensive, 1 stage1 | 9 dòng (5 dòng có highlight) |
| Nghề nghiệp (tiếng Anh) | 2 | stage1 ×2 | 7 dòng, **`pinyin` rỗng** |
| Thời tiết | 1 | stage1 | 7 dòng |
| Thời tiết *(trùng tên)* | 1 | stage1 | 7 dòng |

---

## 1. Số liệu mockup

### 1.1 Hội thoại kết thúc (mockup 11 PC / Mobile)
| Phần | PC / Mobile | Utility |
|---|---|---|
| Header | Baloo 22/19 700, canh giữa, viền dưới `#F0ECE4`, padding `32px 64px` / `22px 22px 12px` | `border-b border-border-card py-8 text-center font-display text-19 font-bold md:text-22` |
| Khung chat | max-width **720px**, gap 16/12, padding `36px 40px` / `18px 20px` | `mx-auto flex w-full max-w-[720px] flex-col gap-3 md:gap-4` |
| Bóng A (trái) | nền `#FBFAF6` viền `#F0ECE4`, r `18/18/18/4`, max-w 74%/78%, padding `16px 18px` / `12px 14px` | `self-start rounded-18 rounded-bl-[4px] border border-border-card bg-surface-card` |
| Bóng B (phải) | nền **`#EDE7DA`** viền **`#E3DCCB`**, r `18/18/4/18` | `self-end rounded-18 rounded-br-[4px]` + token mới (xem §3.5) |
| Câu | Noto Sans SC 17/16 `#241B3A`; **từ vựng in đậm `#5B4FE8`** | `font-han text-16 md:text-17` + `font-bold text-accent` |
| Phiên âm | 12/11.5 `#8B8593`, mt 5/4 | `mt-1 text-12 text-content-muted` |
| Nút Xong | `#5B4FE8`, p17/16, r14, 16/15.5 600, rộng bằng khung chat | `w-full rounded-14 bg-accent py-4 text-15 font-semibold text-white md:text-16` |

### 1.2 Card chủ đề (⚠️ không có mockup — mượn pattern mockup 13 Mobile "Quản lý từ vựng")
Card nền `#FBFAF6` viền `#F0ECE4` r16 p16 · tên 16/700 · "N từ" 12.5 `#8B8593` ·
**thanh 6 màu stage cao 8px bo `999px`**, mỗi khúc rộng theo tỉ lệ số từ ở stage đó (màu `ring-0..5`).
**Bổ sung so với mockup 13** (đã duyệt): dòng "N từ đến hạn hôm nay" và `description` để phân biệt
2 chủ đề trùng tên; bấm cả card = vào ôn.

---

## 2. Quyết định đã chốt với người dùng

| # | Nội dung | Ghi chú |
|---|---|---|
| Q1 | Từ **`mastered`** trong chủ đề: ôn bằng **bộ bài của `intensive`**, **KHÔNG cộng điểm** | `boBaiCua('mastered')` trả mảng rỗng ⇒ nếu bỏ qua thì "Trái cây" chỉ còn 2/5 từ, gần như vô nghĩa |
| Q2 | Chỉ **cộng điểm + dời lịch** cho từ **đang due hôm nay**; từ chưa due chấm đúng/sai tại chỗ nhưng không đụng điểm/lịch; **vẫn ghi `review_log` cho MỌI lượt** (điểm 0) | Nhất quán quy tắc "ôn thêm miễn phí" §4.4; streak + Tổng kết vẫn phản ánh đúng công sức |
| Q3 | Màn chọn chủ đề mượn pattern card mockup 13 + thanh 6 màu + dòng "N từ đến hạn" | Màn này KHÔNG có mockup — layout do người dùng duyệt ở Brainstorm |
| Q4 | Hội thoại hiện **chữ + phiên âm** đúng mockup, thêm **nút bật/tắt "Hiện nghĩa"** (mặc định tắt) + nút loa từng dòng | `text_vi` có sẵn trong DB nhưng mockup không vẽ ⇒ để người dùng tự bật |
| Q5 | Hội thoại chỉ hiện khi **làm hết** lượt ôn chủ đề. Bấm "Xong" → **Tổng kết** → Dashboard | |
| Q6 | **Nút X ở mọi màn Player** thoát thẳng sang **Tổng kết**, ôn được bao nhiêu tính điểm bấy nhiêu (không hiện hội thoại) | Người dùng nhấn mạnh ở Brainstorm; đúng hành vi sẵn có của `thoat` |

---

## 3. Kiến trúc

### 3.1 Hai chỗ trong code hiện tại CHẶN chế độ topic (phải mở đúng cách)
1. **`gomSession` bỏ từ `next_review_date = null` và từ `mastered`** (`srs.ts:178`) — nghĩa là mọi từ
   mastered lẫn từ chưa tới hạn đều bị loại. Chế độ topic cần **hàm gom riêng**, KHÔNG sửa `gomSession`
   (hàm đó đang phục vụ đúng cho luồng hằng ngày).
2. **`xepBai` bỏ dạng bài đã nằm trong `cycle_completed_exercises`** (`player.ts:134`) — với từ đã ôn
   xong bộ bài trong chu kỳ, số màn sẽ bằng 0. Ôn chủ đề là **luyện tập**, không phải chu kỳ SRS, nên
   cần cờ bỏ qua `daDat`.

### 3.2 `player.ts` — 2 hàm/cờ mới (thuần, TDD)
```ts
/** Stage dùng để CHỌN BÀI: mastered mượn bộ bài của intensive (chốt M7/Q1). */
export function stageBaiTap(stage: Stage): StageOn

/** Gom từ của 1 chủ đề thành session 5 từ, thuần 1 "stage hiệu dụng"; KHÔNG lọc theo lịch. */
export function gomSessionTopic(dsTu: TrangThaiTu[], soTuMoiSession = 5): TrangThaiTu[][]

// xepBai thêm tuỳ chọn:  { …, boQuaDaDat?: boolean }
```

### 3.3 `chuDe.ts` — module thuần mới (TDD)
```ts
export type TomTatChuDe = {
  id: string; ten: string; mo_ta: string | null
  so_tu: number; so_den_han: number
  khuc: { stage: StageCay; so: number }[]        // 6 khúc, giữ thứ tự, dùng vẽ thanh màu
}
export function tomTatChuDe(
  topics, vocabTopics, wordState, homNay: string,
): TomTatChuDe[]                                  // sắp xếp: nhiều từ đến hạn trước, rồi theo tên
```

### 3.4 `hoiThoai.ts` — module thuần mới (TDD)
```ts
export type DongHoiThoai = { speaker: string; text: string; pinyin: string; nghia: string; tu_dam: string[] }
export function docHoiThoai(content: unknown, tenTu: Record<string, string>): DongHoiThoai[]
export function chiaDam(text: string, tuDam: string[]): { text: string; dam: boolean }[]
```
`chiaDam` là chỗ dễ sai: phải bôi đậm **đúng chuỗi từ vựng** trong câu, không lồng nhau, không vỡ khi
từ xuất hiện nhiều lần hoặc không xuất hiện (`highlight_vocab_ids` có thể rỗng — dữ liệu thật có cả
2 kiểu). Từ tiếng Anh dùng ranh giới từ để không bôi đậm giữa chữ.

### 3.5 Ghi điểm ở chế độ topic (`PlayerPage`)
```
từ ĐANG due  → như hiện tại: xuLyTraLoi(dang_due: true) → p_state + p_log + p_retry
từ CHƯA due  → CHỈ ghi log:  p_state = null, p_log.points = 0, p_retry = null
```
Không dùng `xuLyTraLoi(dang_due:false)` cho từ chưa due, vì nhánh `la_bai_cuoi_cua_tu` vẫn có thể dời
`next_review_date` / đẩy vào `daily_retry_queue` khi `cycle_points` cũ đã đủ ngưỡng — đúng cho luồng
hằng ngày nhưng **sai** cho luyện tập theo chủ đề.

### 3.6 Token mới (2 màu bóng chat B của mockup 11)
`--raw-sand-100: #EDE7DA` / `--raw-sand-200: #E3DCCB` → `--vb-chat-b-bg` / `--vb-chat-b-border`
→ `bg-chat-b` / `border-chat-b`. Bản dark lấy theo `surface-raised`/`border-card` để không chói.

### 3.7 Route
```
/on-tap/chu-de                     ChonChuDePage   (trong AppShell)
/on-tap?che_do=topic&topic=<id>    PlayerPage      (toàn màn hình, ngoài shell)
/on-tap/hoi-thoai?topic=<id>       HoiThoaiKetThucPage (toàn màn hình)
```
Dashboard: nút "Ôn theo chủ đề" bỏ `disabled`, trỏ `/on-tap/chu-de`.

---

## 4. Kế hoạch — 15 task (2–5 phút/task)

**Thuần (RED → GREEN → REFACTOR)**
| # | Task | Ca kiểm |
|---|---|---|
| T1 | RED `player.test.ts` +: `stageBaiTap` · `gomSessionTopic` | mastered→intensive · gom **cả** từ `next_review_date = null` · thuần 1 stage hiệu dụng · cắt 5 từ/session · "Trái cây" (3 mastered + 1 intensive + 1 stage1) ⇒ 2 session |
| T2 | GREEN 2 hàm trên |
| T3 | RED + GREEN `xepBai({ boQuaDaDat: true })` | từ đã đạt hết bộ bài vẫn dựng đủ màn (hiện tại ra 0 màn) |
| T4 | RED `chuDe.test.ts` — `tomTatChuDe` | 6 khúc luôn đủ · đếm due bỏ qua `mastered` và `null` · 2 chủ đề trùng tên vẫn tách dòng · sắp xếp nhiều due trước |
| T5 | GREEN `chuDe.ts` + X-test module thuần |
| T6 | RED `hoiThoai.test.ts` — `docHoiThoai` · `chiaDam` | `pinyin` rỗng (topic tiếng Anh) · `highlight_vocab_ids` rỗng → không bôi đậm · từ xuất hiện 2 lần → bôi cả 2 · từ không có trong câu → trả nguyên câu · tiếng Anh không bôi giữa chữ (`teach` trong `teacher`) |
| T7 | GREEN `hoiThoai.ts` + X-test |

**UI + luồng**
| # | Task |
|---|---|
| T8 | `tokens.css`: 2 màu bóng chat B (light + dark) |
| T9 | `ChonChuDePage` — card + thanh 6 màu + "N từ đến hạn" + trạng thái rỗng |
| T10 | `HoiThoaiKetThucPage` — mockup 11, nút "Hiện nghĩa", nút loa từng dòng, nút Xong |
| T11 | `PlayerPage`: nhận `che_do=topic` — nạp từ theo `vocab_topics`, dùng `gomSessionTopic` + `boQuaDaDat`, **không** lọc theo log/retry hôm nay |
| T12 | `PlayerPage`: nhánh ghi cho từ chưa due (chỉ `p_log`), và khi hết bài → điều hướng sang hội thoại (X giữa chừng vẫn về Tổng kết) |
| T13 | `App.tsx` + Dashboard: 2 route mới, bật nút "Ôn theo chủ đề" |

**Kiểm & dọn**
| # | Task |
|---|---|
| T14 | build · lint · test (216 + ~22) · **CDP thật**: ôn "Trái cây" → xác nhận session gồm **cả từ mastered** · so `review_log` trước/sau: từ mastered có dòng log **points = 0** và `word_state` **không đổi** (`total_points`, `next_review_date`) · từ due có điểm > 0 · hết bài → hiện hội thoại, bôi đậm đúng từ · "Xong" → Tổng kết · bấm X giữa chừng → thẳng Tổng kết, không hiện hội thoại · chụp PC/Mobile light+dark |
| T15 | Dọn process · memory-bank (MB-26) · soát checklist §5 |

---

## 5. Checklist tự soát ở Bước 4
- [ ] **Không sửa `gomSession`** của luồng hằng ngày; chế độ topic dùng hàm gom riêng.
- [ ] Từ `mastered`/chưa due sau lượt ôn chủ đề: `word_state` **giữ nguyên 100%** (`total_points`,
      `cycle_points`, `stage`, `next_review_date`) — chỉ có thêm dòng `review_log` điểm 0.
- [ ] Không có dòng nào lọt vào `daily_retry_queue` do ôn chủ đề với từ chưa due.
- [ ] Từ đang due khi ôn chủ đề vẫn cộng điểm/dời lịch đúng như luồng hằng ngày.
- [ ] Hội thoại: `pinyin` rỗng thì ẩn hẳn dòng phiên âm; bôi đậm đúng từ, không lồng nhau.
- [ ] Nút X ở mọi màn → Tổng kết (ôn bao nhiêu tính bấy nhiêu), KHÔNG hiện hội thoại.
- [ ] Không hex trong component; 2 màu bóng chat đi qua token 4 tầng như mọi màu khác.
- [ ] Màn chọn chủ đề hiện đủ 4 chủ đề, 2 chủ đề trùng tên phân biệt được.

---

## 6. PLAN chi tiết — code cụ thể

### T1–T2 · `player.ts`
```ts
/** Stage dùng để CHỌN BÀI. mastered không có bộ bài riêng ⇒ mượn của intensive (M7/Q1). */
export function stageBaiTap(stage: Stage): StageOn {
  return stage === 'mastered' ? 'intensive' : stage
}

/**
 * Gom từ của 1 CHỦ ĐỀ thành session ≤5 từ, thuần 1 "stage hiệu dụng".
 * Khác `gomSession` (§4.1): KHÔNG lọc theo `next_review_date` và KHÔNG loại `mastered`,
 * vì ôn chủ đề là luyện tập toàn bộ chủ đề chứ không phải chu kỳ SRS.
 */
export function gomSessionTopic(dsTu: TrangThaiTu[], soTuMoiSession = 5): TrangThaiTu[][]
```
Sắp xếp: stage hiệu dụng thấp → cao, trong cùng stage giữ nguyên thứ tự đầu vào (ổn định).

### T3 · `xepBai` thêm `boQuaDaDat`
```diff
-export function xepBai(dv: { tu: TrangThaiTu[]; baiTap: BaiTapDb[]; dangChoPhep?: DangBai[] }) {
-  const { tu, baiTap, dangChoPhep } = dv
+export function xepBai(dv: { tu: TrangThaiTu[]; baiTap: BaiTapDb[]; dangChoPhep?: DangBai[]; boQuaDaDat?: boolean }) {
+  const { tu, baiTap, dangChoPhep, boQuaDaDat } = dv
-  const daDatCua = (id: string) => tu.find(...)?.cycle_completed_exercises ?? []
+  const daDatCua = (id: string) =>
+    boQuaDaDat ? [] : (tu.find(...)?.cycle_completed_exercises ?? [])
```
(4 chỗ dùng `cycle_completed_exercises` trong `xepBai` đều phải đi qua `daDatCua`.)

### T4–T5 · `chuDe.ts`
```ts
export function tomTatChuDe(dv: {
  topics: { id: string; name: string; description: string | null }[]
  lienKet: { topic_id: string; vocab_id: string }[]
  trangThai: { vocab_id: string; stage: string; next_review_date: string | null }[]
  homNay: string
}): TomTatChuDe[]
```
`so_den_han` = số từ `stage <> 'mastered'` và `next_review_date <= homNay`.
`khuc` luôn đủ 6 phần tử theo `THU_TU_STAGE` (dùng lại từ `dashboard.ts`).

### T6–T7 · `hoiThoai.ts`
```ts
export function docHoiThoai(content: unknown, tenTu: Record<string, string>): DongHoiThoai[]
// content.lines[] → { speaker, text: text_zh, pinyin, nghia: text_vi,
//                     tu_dam: highlight_vocab_ids.map(id => tenTu[id]).filter(Boolean) }

export function chiaDam(text: string, tuDam: string[]): { text: string; dam: boolean }[]
// Quét trái→phải, mỗi vị trí thử khớp từ DÀI NHẤT trước (tránh lồng nhau).
// Từ chỉ gồm chữ Latin phải khớp trọn tiếng (ranh giới \b) — "teach" KHÔNG bôi trong "teacher".
```

### T11–T12 · `PlayerPage` (diff chính)
```ts
const params = new URLSearchParams(location.search)
const cheDoRetry = params.get('che_do') === 'retry'
const topicId = params.get('che_do') === 'topic' ? params.get('topic') : null
const dueRef = useRef<Set<string>>(new Set())      // từ ĐANG due trong lượt topic
```
Trong `napSession`, nhánh `topicId`:
```ts
const { data } = await supabase
  .from('vocab_topics').select('vocab_id, word_state(*, vocab(*))').eq('topic_id', topicId)
dong = …                                            // KHÔNG lọc log/retry hôm nay
dueRef.current = new Set(dong.filter(t => t.stage !== 'mastered' && t.next_review_date && t.next_review_date <= homNay).map(t => t.vocab_id))
phienAll = gomSessionTopic(dong)
// mỗi phiên: dangChoPhep = boBaiCua(stageBaiTap(phien[0].stage)), boQuaDaDat: true
```
Trong `traLoi`, từ **chưa due**:
```ts
if (topicId && !dueRef.current.has(vocab_id)) {
  const p_log = { vocab_id, exercise_type: dang_bai, is_correct: dung, used_hint: dung_goi_y,
                  points: 0, stage_before: trang_thai.stage, stage_after: trang_thai.stage }
  return goiRpc({ p_state: null, p_log, p_retry: null, p_xoa_retry: false }, () => dispatch(...))
}
```
Hết bài ở chế độ topic → `navigate('/on-tap/hoi-thoai?topic=' + topicId)`; nút X (`thoat`) giữ nguyên
đường cũ về `/on-tap/tong-ket` (M7/Q6).
