# DESIGN.md — M24: Nâng ngưỡng Mastered 30 → 36

> Kiến trúc của RIÊNG task này (thay nội dung M23 đã xong, M23 đã ghi vào memory-bank MB-44).
> Ngày lập: 2026-10-02 · Trạng thái: **✅ DESIGN + PLAN ĐÃ DUYỆT · ĐÃ XONG 2026-10-02** (MB-45)

## 1. Yêu cầu (người dùng chốt 2026-10-02)
- `MASTER_THRESHOLD` = **36** = đúng điểm tối đa cả lộ trình (4 + 8 + 12 + 12, SPEC §3.2).
- Đúng trọn vẹn (không gợi ý, không bỏ ngày) ⇒ xong stage3 đủ 36 ⇒ **lên thẳng Mastered**. Hụt dù 1 điểm ⇒ **Nở hoa**
  (intensive), mỗi vòng +9–12 ⇒ thường 1 vòng là đủ 36.
- **Từ đang học dở giữ nguyên** (không bù điểm, không ghi DB): ~40 từ stage2/stage3 thiếu điểm do dữ liệu cũ thiếu bài hội
  thoại (trước M23) sẽ ôn thêm 1 vòng Nở hoa. Riêng 复习 (26đ ở stage3) vẫn có thể lên thẳng (26 + 12 = 38).

## 2. Kiểm tra tiền đề (DB thật, chỉ đọc 2026-10-02)
- 678/678 từ có đủ 8 dạng cần record (gồm `trans_sentence`, `complete_situation`) + đủ SD/FD (M23) ⇒ từ mới đi đúng hết
  đạt đúng 36.
- 0 từ đang ở intensive/mastered ⇒ đổi ngưỡng không làm từ nào "tụt" khỏi mastered.
- Cron SQL (`run_daily_maintenance`) KHÔNG dùng ngưỡng 30 ⇒ không cần migration.

## 3. Thay đổi
| Nơi | Đổi |
|---|---|
| `src/lib/srs.ts` | `MASTER_THRESHOLD = 36` (nhánh rẽ mastered/intensive dùng sẵn hằng này) |
| `src/features/player/Ring.tsx` | % viền = `min(total_points, MASTER_THRESHOLD) / MASTER_THRESHOLD` — **import hằng từ `srs.ts`** để vòng đầy đúng lúc Mastered, không còn số 30 viết tay |
| Comment | `Ring.tsx`, `tokens.css`, `TokenSheet.tsx` |
| Tài liệu | SPEC §3.1 sơ đồ (2 chỗ "≥ 30"), §3.3, §12.2 · UI_DESIGN §6 dòng 111, §7 dòng 163 |
| Không đổi | `MAX_TICH_LUY`/gap/health · phạt · G1 (1 dạng tính điểm 1 lần/vòng) · luật retry |

Hệ quả hiển thị: vòng của từ stage3 26đ từ 87% → 72%; 100% chỉ khi Mastered.

---

# PLAN M24

**T1 RED — `src/lib/srs.test.ts`** (describe "Rẽ nhánh cuối"):
```ts
  it('M1 — xong vòng stage3 với total ≥ 36 → mastered, DỪNG lịch ôn', () => {
    const kq = traLoi(tu({ stage: 'stage3', cycle_points: 8, total_points: 33 }), 'trans_sentence',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.total_points).toBe(37)
    expect(kq.trang_thai_moi.stage).toBe('mastered')
    expect(kq.trang_thai_moi.next_review_date).toBeNull()
    expect(kq.dong_review_log.stage_after).toBe('mastered')
  })

  it('M1b — M24: xong stage3 với 31 điểm (< 36) → intensive, KHÔNG mastered như ngưỡng cũ 30', () => {
    const kq = traLoi(tu({ stage: 'stage3', cycle_points: 8, total_points: 27 }), 'trans_sentence',
      { la_bai_cuoi_cua_tu: true })
    expect(kq.trang_thai_moi.total_points).toBe(31)
    expect(kq.trang_thai_moi.stage).toBe('intensive')
  })
```
M2 đổi tiêu đề "< 36". M2b: `total_points: 33` + 3 = **36** (biên đúng ngưỡng) → mastered. M2c tiêu đề "chưa đủ 36".
X1b: `expect(MASTER_THRESHOLD).toBe(36)` · tiêu đề "đúng 36". Chạy ⇒ phải ĐỎ (M1b, M2b, X1b).

**T2 GREEN — `src/lib/srs.ts`**:
```ts
/** M24 (2026-10-01→02): = điểm tối đa cả lộ trình 4+8+12+12 — đúng trọn vẹn ⇒ lên thẳng mastered, hụt ⇒ intensive. */
export const MASTER_THRESHOLD = 36
```

**T3 — `src/features/player/Ring.tsx`**:
```tsx
import { MASTER_THRESHOLD } from '../../lib/srs.ts'
…
 * Mastery ring (DEC-12 sửa bởi MB-43/MB-45, UI_DESIGN.md §7): % viền = min(total_points, MASTER_THRESHOLD) / MASTER_THRESHOLD
…
  const pct = Math.min(total_points, MASTER_THRESHOLD) / MASTER_THRESHOLD
```

**T4 — comment**: `tokens.css` dòng ring + `TokenSheet.tsx:85` → `min(total_points, 36) / 36 (MASTER_THRESHOLD, MB-45)`.

**T5 — tài liệu**: SPEC §3.1 (2 chỗ `≥ 30` → `≥ 36`), §3.3 (`MASTER_THRESHOLD = 36 (= 100% của 36)` + ghi chú "Sửa
2026-10-02 (MB-45)"), §12.2 công thức `/36`; UI_DESIGN dòng 111 + 163.

**T6 — kiểm**: `npm test` · build · lint · CDP Dashboard (chỉ đọc): % ring của 8 từ gần đây = `min(total,36)/36`, 0 lệnh ghi.
Dọn dev server + Chrome.

**T7 — memory-bank**: MB-45, activeContext, progress, systemPatterns (dòng ring), §A decisionLog nếu có dòng DEC-12/ngưỡng 30.
