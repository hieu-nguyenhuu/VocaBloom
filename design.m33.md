# M33 — Đóng băng lịch ôn (thay công tắc M32)

> Design + Plan gộp. Thay hẳn công tắc "Thêm từ mới hằng ngày" (M32) bằng công tắc **"Ôn tập hằng ngày"** (bật = bình thường, tắt = đóng băng).
> Mục đích (người dùng nêu): xử lý khi **từ quá hạn dồn quá nhiều** — chặn dòng từ mới đến hạn để học dứt điểm phần tồn đọng.

## 1. Yêu cầu đã chốt (Brainstorm 2026-10-21)

| # | Câu hỏi | Chốt |
|---|---|---|
| Q1 | Mô hình | **Chặn dòng chảy vào, giữ phần tồn đọng.** Tắt vào ngày F: từ có hạn **≤ F** (quá hạn + đến hạn ngày F) vẫn hiện, ôn/chấm/lên stage bình thường; từ có hạn **> F** bị giữ lại; không thêm từ mới |
| Q2 | Khi bật lại (ngày U) | **Dời lịch** các từ bị giữ thêm N = U − F ngày ("dừng đồng hồ"), không dồn cục |
| Q3 | Phạm vi | Mọi từ đang có lịch: new, stage1–3, intensive (mastered vốn không có lịch) |
| Q4 | Công tắc M32 | **Thay** bằng 1 công tắc duy nhất; đóng băng bao gồm luôn việc không thêm từ mới |
| Q5 | Streak | Tính **bình thường** (ôn tồn đọng / đọc hiểu vẫn là ngày học) |
| Q6 | Từ tồn đọng ôn trong lúc đóng băng, được lên stage | Hạn mới (> F) ⇒ **giữ lại tới khi bật**; bật lại thì hiện theo đúng hạn đã tính từ ngày ôn, **không dời thêm** |
| Q7 | Phạt điểm khi đóng băng | **Không trừ**: cron bỏ bước phạt (B1) + reset vòng (B2), cùng nhỏ giọt từ mới (B4) + cảnh báo cạn (B5). B3 (dọn hàng retry ngày cũ) giữ |

**Mặc định (nêu ở Brainstorm, chưa ai phản đối):** bật lại ⇒ từ hiện **ngay**, không chờ 01:00 · Dashboard khi đóng băng hiện trạng thái + lối bật lại.

## 2. Ví dụ (dữ liệu thật hôm nay)
Tồn đọng 54 từ (45 quá hạn + 9 hôm nay) · 46 từ hạn sắp tới · 640 từ hàng đợi.
Tắt hôm nay ⇒ mục ôn chỉ có 54 từ, giảm dần khi ôn (từ lên stage biến khỏi mục ôn; từ chưa đạt ngưỡng vẫn còn đó, ngày sau ôn tiếp).
Bật lại sau 10 ngày ⇒ 46 từ bị giữ dời hạn +10 ngày (từ hạn 23/10 thành 2/11), từ đã ôn trong lúc đóng băng hiện theo hạn của chúng.

## 3. Dữ liệu & cơ chế
- Key settings **`dong_bang_luc`** (jsonb): `null` = bình thường; chuỗi timestamptz ISO = đang đóng băng từ lúc đó. F = ngày VN của timestamp.
  1 key duy nhất (không cần cờ riêng). Key M32 `new_words_enabled` **xoá** (dọn `0019` tại chỗ — xem T4).
- **"Ngày hiệu lực"** cho mọi truy vấn đến hạn: `ngayHieuLuc = đóng băng ? min(hôm nay, F) : hôm nay`.
  Đến hạn = `next_review_date ≤ ngayHieuLuc`. Vì mọi từ bị giữ và mọi từ vừa lên stage đều có hạn > F ⇒ tự động ẩn, không cần cột mới.
- **RPC `dong_bang_lich()`**: nếu đang `null` ⇒ ghi `now()` (gọi lại không đổi mốc).
- **RPC `mo_bang_lich()`** (1 transaction): N = hôm nay − F (ngày VN); nếu N > 0:
  `next_review_date += N` cho từ `stage <> 'mastered'`, `next_review_date > F`, **chưa ôn sau mốc đóng băng** (`last_reviewed_at is null or last_reviewed_at <= dong_bang_luc`) ⇒ Q6;
  rồi ghi `dong_bang_luc = null`. Trả về `{ so_ngay, so_tu_doi }`.
  Cả hai RPC KHÔNG `security definer` (chạy quyền `authenticated`, RLS như mọi bảng) ⇒ không cần revoke anon (anon vốn không có quyền).
- **Cron** `run_daily_maintenance()` (sửa tại chỗ `0005`): đọc `dang_dong_bang := dong_bang_luc is not null`; nếu đóng băng ⇒ bỏ B1, B2, B4, B5; B3 vẫn chạy.
  Gỡ điều kiện `bat_tu_moi` của M32.

## 4. Giao diện
**Cài đặt › Học tập** — thay hàng M32 bằng:
```
Ôn tập hằng ngày                                   [● công tắc]
(bật) Tắt khi từ quá hạn dồn nhiều: chỉ còn từ tồn đọng, không thêm từ mới, không trừ điểm.
(tắt) Đang đóng băng từ 21/10 (3 ngày). Bật lại: từ bị giữ sẽ dời hạn thêm 3 ngày.
Số từ mới/ngày   − 5 +        ← mờ 50% khi đóng băng (giữ như M32)
```
Bấm công tắc gọi RPC tương ứng (không `upsert` trực tiếp như các key khác), khoá nút trong lúc chờ; lỗi ⇒ `BangLoi` như cũ.

**Dashboard** (biến thể nhỏ, KHÔNG có mockup — 0 màu mới): khi đóng băng, ngay trên 2 thẻ đến hạn/quá hạn thêm 1 dải
`surface-sunken` bo 14, chữ 13px: "Lịch ôn đang đóng băng từ 21/10 — chỉ còn từ tồn đọng." + link "Mở lại" → `/cai-dat`.
Thẻ "đến hạn hôm nay" / "quá hạn" và nút "Bắt đầu ôn tập · N từ" đếm theo ngày hiệu lực (54 từ trong ví dụ).

## 5. Chỗ phải đổi sang ngày hiệu lực (đã rà toàn bộ `next_review_date` trong `src/`)
| File | Hiện tại | Đổi |
|---|---|---|
| `DashboardPage.tsx` | `.lte('next_review_date', homNay)` + `demDenHan(rows, homNay)` | `lte(ngayHieuLuc)`; `demDenHan` giữ `homNay` thật để tách "hôm nay / quá hạn" |
| `PlayerPage.tsx` (lượt thường) | `.lte('next_review_date', homNay)` | `lte(ngayHieuLuc)` (lượt retry không đổi — chỉ chứa từ tồn đọng) |
| `TongKetPage.tsx` | `lte(homNay)` đếm "còn N từ đang chờ" | `lte(ngayHieuLuc)` |
| `chuDe.ts` (`so_den_han`, Từ vựng) | `<= homNay` | **Thi công: KHÔNG đổi** — `so_den_han` không còn hiện ở màn nào (từ M31), chỉ dùng sắp thứ tự chủ đề |
Đọc `dong_bang_luc` cùng lúc với `settings` sẵn có (Player đã đọc `settings`; Dashboard/TổngKết/TừVựng thêm 1 truy vấn nhỏ).

## 6. Edge case
| Tình huống | Xử lý |
|---|---|
| Tắt rồi bật ngay trong ngày (N = 0) | Không dời gì, chỉ xoá mốc |
| Bấm tắt 2 lần / mạng chậm | `dong_bang_lich` giữ mốc cũ nếu đã đóng băng; nút khoá khi đang gọi |
| Ôn tồn đọng nhưng chưa đạt ngưỡng | Hạn giữ ≤ F ⇒ vẫn trong mục ôn các ngày sau (DEC-06: không lặp trong cùng ngày) |
| Từ đang trong `daily_retry_queue` | Chỉ có từ tồn đọng ⇒ lượt retry chạy bình thường |
| Đóng băng qua đêm | Cron chỉ dọn hàng retry ngày cũ; không phạt, không reset vòng, không thêm từ, không cảnh báo |
| Ngày bật lại | Từ mới của ngày đó chờ cron 01:00 hôm sau (cron đêm trước đã bỏ B4) |
| Trạng thái hiện tại khi deploy | Công tắc M32 đang TẮT ⇒ **Q8: đóng băng ngay từ lúc chạy migration** — `0019` ghi `dong_bang_luc = now()` NẾU `new_words_enabled = false` (rồi mới xoá key M32); chạy lại migration không đổi mốc |
| Đọc hiểu theo chủ đề | Không thuộc SRS ⇒ không ảnh hưởng |

## 7. Plan (TDD)
- **T1 RED/GREEN** `src/lib/dongBang.ts` (thuần): `ngayHieuLuc(homNay, dongBangLuc)`, `ngayDongBang(dongBangLuc)` (ngày VN), `soNgayDongBang(homNay, dongBangLuc)`;
  test: null ⇒ hôm nay; mốc hôm nay ⇒ hôm nay; mốc 3 ngày trước ⇒ F; mốc 23:30 UTC = ngày VN hôm sau (bẫy múi giờ).
- **T2** `settings.ts`: bỏ `new_words_enabled`, thêm `dong_bang_luc: string | null` (chỉ nhận chuỗi); sửa `settings.test.ts` (ĐỎ trước).
- **T3 RED** `scripts/test-maintenance.mjs`: thay T10/T11 bằng — T10 đóng băng: từ stage2 quá hạn KHÔNG bị trừ, cycle KHÔNG reset, 12 từ hàng đợi KHÔNG kích hoạt, KHÔNG cảnh báo;
  file mới `scripts/test-dong-bang.mjs` (+ `npm run test:dongbang`, begin…rollback): D1 `dong_bang_lich` ghi mốc, gọi lại giữ mốc · D2 mở băng sau 10 ngày: từ hạn F+2 → U+2 ·
  D3 từ tồn đọng (≤ F) không đổi · D4 từ ôn sau mốc (hạn > F) không dời · D5 mastered không đổi · D6 mốc về null · D7 N = 0 không dời.
- **T4 GREEN** migration: `0019_bat_tu_moi.sql` → đổi tên `0019_dong_bang.sql` (delete key `new_words_enabled`, seed `dong_bang_luc` = null, 2 hàm RPC + grant authenticated) ·
  `0005` thay `bat_tu_moi` bằng `dang_dong_bang` · `check:schema` đổi tên key. `db:migrate` ×2, `test:db`, `test:dongbang` xanh.
- **T5** UI Cài đặt (công tắc gọi RPC) · **T6** Dashboard (dải trạng thái + ngày hiệu lực) · **T7** Player / Tổng kết / chuDe (ngày hiệu lực).
- **T8** tài liệu: SPEC §5 (bỏ đoạn M32, thêm M33) §11 · UI_DESIGN §8.1 §8.6.
- **T9** kiểm chứng: `npm test` · build · lint · CDP local (tắt ⇒ Dashboard/Player chỉ đếm tồn đọng; bật ⇒ hạn đã dời) — chạy trên DB thật nên **chụp lại `word_state` trước và trả nguyên trạng** sau khi kiểm.
- **T10** memory-bank · commit + push + `deploy:firebase` — **Q9: người dùng cho phép agent tự làm cho M33**.
