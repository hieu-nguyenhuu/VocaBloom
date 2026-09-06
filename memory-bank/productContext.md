# Product Context — VocaBloom

> Nguồn sự thật: `SPECIFICATION.md` (nghiệp vụ) + `UI_DESIGN.md` (thị giác) + 2 file HTML mockup.
> File này chỉ TÓM TẮT để nạp bối cảnh nhanh — khi code logic/UI phải mở file gốc, không code theo trí nhớ từ file này.

## 1. Sản phẩm là gì

**VocaBloom** — web app ôn từ vựng **Trung (zh) / Anh (en)** cá nhân, **single-user** (chỉ 1 người dùng là chủ app), áp dụng **spaced repetition (SRS)**.

**Mục tiêu khác biệt:** xây **active vocabulary** (chủ động nhớ & dùng được từ), KHÔNG dừng ở nhận diện thụ động kiểu Anki flashcard. Vì vậy có tới **17 dạng bài tập** leo thang độ khó từ nhận diện → tự luận AI chấm.

## 2. Vấn đề cốt lõi đang giải

| Vấn đề | Cách VocaBloom giải |
|---|---|
| Học flashcard chỉ nhận ra từ, không dùng được | 17 dạng bài chia 4 stage, stage cao bắt tự đặt câu / dịch / hoàn thành tình huống |
| Tự chấm flashcard không khách quan | Flashcard KHÔNG tính điểm nâng stage (§4.3); điểm chỉ đến từ bài có đáp án khách quan hoặc AI chấm |
| App SRS thường phạt nặng, gây áp lực bỏ cuộc | Trả lời sai KHÔNG phạt (chỉ không cộng điểm); chỉ phạt khi bỏ lỡ NGÀY ôn; KHÔNG BAO GIỜ tụt stage (DEC-08/09); giọng điệu UI luôn nhẹ nhàng, quá hạn dùng tint vàng chứ không đỏ |
| Lịch ôn tính cứng → trượt 1 hôm là vỡ lịch | Lịch **tương đối** (`next_review_date`), tự "lành" khi người dùng trượt lịch (§1.2) |
| "Đủ điểm lên stage" chưa chắc là "nhớ thật" | 2 tầng điểm: `cycle_points` (nâng stage) + `total_points` (cả đời) → gap co giãn theo health (§3.4) |
| Gọi AI gen bài tập runtime → chậm, tốn tiền, không ổn định | AI gen bài **BÊN NGOÀI app**, nạp qua màn Import; trong app AI chỉ làm 2 việc (xem §3) |

## 3. Nguyên tắc sản phẩm BẤT BIẾN (vi phạm = sai kiến trúc)

1. **AI trong app CHỈ làm 2 việc:** (a) chấm bài tự luận stage 3, (b) giải thích khi người dùng bấm nút (lazy + cache vào `exercises.ai_explanation`). TUYỆT ĐỐI không gen nội dung bài tập runtime.
2. **Payload bài tập không lặp dữ liệu đã có ở `vocab`** — 6/17 dạng thậm chí không cần record trong `exercises`, Player đọc thẳng từ `vocab`.
3. **Lịch ôn là tương đối**, không tính cứng từ ngày thêm từ.
4. **Điểm 2 tầng:** `cycle_points` reset mỗi vòng; `total_points` không bao giờ reset (chỉ cộng/trừ) — quyết định Mastered + màu mastery ring.
5. **Ẩn dụ cây xuyên suốt:** 6 stage = 6 giai đoạn cây (hạt giống → mầm → chồi → lá → hoa → quả). Ẩn dụ này không đổi dù đổi phong cách thị giác.

## 4. Luồng người dùng chính

### 4.1 Nạp dữ liệu (tiền đề của mọi thứ)
```
CSV từ vựng → (skill vocab-csv-to-import, chạy NGOÀI app) → file JSON 1 topic/file
→ màn Import: chọn file → validate → preview (cảnh báo trùng KHÔNG chặn) → import 1 transaction
→ background: gọi Google TTS cho từ mới, cache mp3 vào Supabase Storage
```
Từ mới vào DB với `next_review_date = NULL` (hàng đợi chờ), cron nhỏ giọt `new_words_per_day` từ/ngày.

### 4.2 Ôn hằng ngày (luồng xương sống)
```
Dashboard (thấy N từ due) → CTA "Bắt đầu ôn tập"
→ Player: session THUẦN 1 stage, ~5 từ, chạy các dạng bài của stage đó
→ Thoát Player (hết bài hoặc chủ động thoát) → màn Tổng kết phiên
→ Từ chưa đạt ngưỡng → vào daily_retry_queue, ôn lại ở lượt riêng SAU trong ngày
```
Có thể chia nhiều lượt rải rác trong ngày; số liệu tổng kết luôn query `review_log` của cả ngày (không giữ state client).

### 4.3 Ôn theo topic (tách biệt hoàn toàn)
Chọn 1 topic → ôn toàn bộ từ trong topic → kết thúc bằng **màn hội thoại** của topic (chỉ chế độ này mới có hội thoại).

### 4.4 Phụ trợ
Quản lý từ vựng/topic (sửa field cơ bản, KHÔNG sửa được payload bài tập) · Cài đặt (OpenRouter key/model, số từ mới/ngày, giọng TTS, toggle cảnh báo) · Thông báo (cảnh báo hàng đợi từ mới sắp cạn).

## 5. Danh sách màn hình (8 nhóm chức năng)

| # | Màn hình | Mockup PC | Mockup Mobile |
|---|---|---|---|
| 1 | Dashboard | 01 | 01 |
| 2 | Player — ôn hằng ngày (9 pattern bài tập) | 02–10 | 02–10 |
| 3 | Player — ôn theo topic + hội thoại kết thúc | 11 | 11 |
| 4 | Tổng kết phiên ôn tập | 12 | 12 |
| 5 | Quản lý từ vựng & topic | 13–14 | 13–15 |
| 6 | Import | 15–16 | 16–17 |
| 7 | Cài đặt | 17 | 18 |
| 8 | Thông báo | 18 (dropdown panel) | 19 (trang riêng) |

## 6. Ngoài phạm vi (YAGNI — không làm nếu không được yêu cầu lại)

- Đa người dùng, đăng ký/đăng nhập nhiều tài khoản, chia sẻ bộ từ.
- Gen bài tập bằng AI trong app; thêm từ vựng thủ công (nguồn nhập chính là Import).
- Sửa payload 17 dạng bài trong app (muốn đổi → import file mới).
- Tụt stage khi trả lời sai (lapse), màn "lịch sử quyết định", app mobile native.
