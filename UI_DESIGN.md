# VocaBloom — Đặc tả thiết kế (UI_DESIGN.md)

> **Phiên bản:** 2.0 · **Ngày:** 2026-07-17
> **Mục đích:** Tài liệu này ghi lại toàn bộ quyết định thiết kế đã thống nhất qua thảo luận, VÀ đối chiếu với 2 file thiết kế thật đã hoàn thành: `PcView.html` + `MobileView.html` (người dùng tự dựng, 36-38 khung màn hình mỗi file). **2 file HTML đó mới là nguồn màu/style chính thức cuối cùng** — tài liệu này diễn giải lại thành văn bản + bổ sung ghi chú kỹ thuật cho AI agent code app thật (xem §10).
> **Quan hệ với `SPECIFICATION.md`:** Tài liệu này chỉ nói về **thị giác/UI**. Mọi logic nghiệp vụ (SRS, điểm số, DB schema...) tham chiếu `SPECIFICATION.md`.

---

## 1. Tổng quan & định hướng thẩm mỹ

**Phong cách đã chốt: "Nhiệt đới" (Tropical)** — tươi vui, năng lượng cao, nền sáng, nhiều màu sắc sống động. 

**Ẩn dụ cốt lõi vẫn giữ nguyên:** hệ thống mastery dựa trên hành trình phát triển của cây (hạt giống → mầm → chồi → lá → hoa → quả), gắn trực tiếp với 6 stage trong DB (`SPECIFICATION.md` §12/DEC-12). Ẩn dụ này **không đổi theo phong cách thị giác** — chỉ đổi cách tô màu/font xung quanh nó.

---

## 2. Kiến trúc token — để đổi phong cách dễ dàng sau này

Mọi giá trị màu/font PHẢI đi qua 2 lớp, component code chỉ được dùng Lớp 2:

```css
/* LỚP 1 — giá trị thô, nơi DUY NHẤT cần sửa khi đổi phong cách toàn bộ app */
--raw-bg-page: #FFFFFF;
--raw-accent-interactive: #4F46E5;
/* ... (đầy đủ ở bảng §3) */

/* LỚP 2 — token ngữ nghĩa, component CHỈ dùng tên này */
--bg-page: var(--raw-bg-page);
--accent-interactive: var(--raw-accent-interactive);
```

**Ngoại lệ quan trọng — thang màu Mastery Ring KHÔNG thuộc kiến trúc 2 lớp này.** 6 mã màu (`#ef4444` → `#16a34a`, DEC-12) gắn trực tiếp với ý nghĩa dữ liệu thật (điểm số), phải **giữ cố định tuyệt đối** dù đổi phong cách thị giác thế nào — không được tham chiếu qua Lớp 1/2 ở trên.

---

## 3. Bảng màu — trích xuất từ `PcView.html`/`MobileView.html` (nguồn sự thật cuối cùng)

⚠️ **Bảng này THAY THẾ hoàn toàn bảng "Nhiệt đới + Chàm sâu" ở các phiên bản trước.** Người dùng tự thiết kế 2 file HTML tham chiếu (`PcView.html`, `MobileView.html`, mỗi file 18-19 màn × Light+Dark = 36-38 khung) — đây mới là nguồn màu chính thức. Đã verify: PC và Mobile dùng **chính xác cùng 1 bộ mã màu**, không lệch.

**Khác biệt lớn nhất so với bản khóa trước:** hệ màu thật dùng **3 accent riêng biệt theo vai trò** (không phải 1 màu "chàm sâu" duy nhất) — phong phú hơn, đúng tinh thần "nhiều màu hơn" người dùng từng yêu cầu.

| Vai trò | Light | Dark |
|---|---|---|
| Nền content chính | `#FFFFFF` | `#22252C` |
| Nền sidebar | `#FBFAF6` | `#17191E` |
| Nền khung app ngoài cùng | — | `#15171C` |
| Nền card (câu hỏi, Khu vườn...) | `#FBFAF6` | `#1E2128` |
| Viền card/sidebar | `#F0ECE4` | `#2A2D35` |
| Viền input/đáp án trung tính | `#E5E5E5` | *(xem file — chưa verify hết)* |
| Chữ chính | `#241B3A` | `#EDEEF0` |
| Chữ phụ/muted | `#8B8593` | `#9A9BA8` |
| Chữ nav inactive | `#4A4458` | `#C4C2CC` |
| **Accent chính — Tím** (nav active, CTA, progress dots, thẻ "đến hạn") | `#5B4FE8` (tint nền `#EDEBFC`, text đậm `#4338CA`) | `#8B80FF` (tint nền `#262148`) |
| **Accent phụ — Xanh dương** (CHỈ nút "Ôn theo chủ đề") | `#0369A1` (tint nền `#E3F4FD`) | *(xem file)* |
| **Accent trang trí — Hồng** (CHỈ streak/thành tích, KHÔNG dùng cho nút bấm) | icon `#E0449E`, text `#A21467`, nền `#FCE4F1` | icon `#F472B6`, text `#F9A8D4`, nền `#3A1830` |
| Feedback — sai | `#ef4444` (nền `#FEE2E2`, text `#B91C1C`) | *(ring không đổi 2 mode)* |
| Feedback — gợi ý / quá hạn tint | `#eab308` (nền `#FEF9C3`, text `#946200` light / `#F3D17A` dark trên nền `#3A330F`) | |
| Feedback — đúng / lên stage tint | `#4ade80`/`#16a34a` (nền `#DCFCE7`, text `#15803D`) | |
| Thang Mastery Ring đầy đủ (KHÔNG đổi theo mode) | `#ef4444 → #f97316 → #eab308 → #a3e635 → #4ade80 → #16a34a` | |

**Quy tắc bất biến (Color Consistency Lock) — cập nhật theo hệ 3-accent thật:**
- Tím `#5B4FE8`/`#8B80FF`: MỌI hành động chính (nút bấm, nav active, trạng thái chọn/focus, progress dots, highlight từ vựng trong hội thoại).
- Hồng: CHỈ streak/badge thành tích — không bao giờ trên phần tử có thể click.
- Xanh dương: CHỈ nút hành động phụ/thứ 2 (không lặp lại vai trò với tím).
- Ring ramp: chỉ dùng cho ngữ cảnh mastery/điểm số — không mượn cho mục đích trang trí khác.

**Với bất kỳ giá trị màu nào KHÔNG có trong bảng trên** (còn nhiều biến thể tint chưa liệt kê hết, đặc biệt phần dark mode của accent xanh dương): **coi 2 file HTML là nguồn sự thật, trích xuất trực tiếp** (`grep -oE '#[0-9A-Fa-f]{6}' file.html`) thay vì suy đoán — tránh lệch màu do chép tay.

---

## 4. Typography

| Vai trò | Font | Dùng cho |
|---|---|---|
| Display (tiêu đề lớn) | **Baloo 2** (weight 600-700) | Tên màn hình, số liệu lớn (Dashboard), tên topic |
| Body (tiếng Việt/Latin) | **Be Vietnam Pro** (weight 400-500) | Toàn bộ nội dung tiếng Việt — chọn vì hỗ trợ dấu tiếng Việt tốt hơn font ngoại quốc thông thường |
| Chữ Hán (functional — bắt buộc, không thương lượng) | **Noto Sans SC** (weight 600 cho từ vựng chính, 400 cho phụ) | Mọi nội dung học thật: flashcard, câu hỏi, đáp án — ưu tiên **độ rõ nét sư phạm** hơn thẩm mỹ |

**Đã cân nhắc và loại bỏ:** font khải thư (楷体) chuẩn không có bản miễn phí nhúng web được (chỉ tồn tại dạng font hệ thống độc quyền). Các font "viết tay Trung Quốc" trên Google Fonts (Ma Shan Zheng, Zhi Mang Xing...) đều là hành thư/thảo thư, KHÔNG phù hợp cho nội dung học cần nhận diện nét chính xác — không dùng cho bất kỳ nội dung chức năng nào.

**Nếu cần khoảnh khắc chữ Hán trang trí lớn (hiếm, không phải nội dung học):** cân nhắc riêng lúc code, không mặc định dùng font nào — quyết định "ZCOOL XiaoWei" từng đề xuất ở bản nháp "nhật ký" đã lỗi thời cùng với mood cũ, cần đánh giá lại độc lập nếu thực sự cần.

---

## 5. Responsive strategy

**2 file HTML thiết kế mẫu riêng biệt:** `PcView.html` và `MobileView.html` — KHÔNG dùng breakpoint fluid duy nhất, vì nhiều màn (đặc biệt Player) cần đổi hẳn bố cục, không chỉ co giãn kích thước.

Nguyên tắc chung khi chuyển PC ↔ Mobile (áp dụng cho từng màn ở §8):
- Mobile: 1 cột, full-width trong khung ~420px, điều hướng dạng thanh tab dưới cùng.
- PC: có thể dùng bố cục nhiều cột/master-detail; điều hướng dạng sidebar trái cố định; nội dung chính giới hạn độ rộng hợp lý (không kéo giãn hết màn hình rộng — giữ mật độ đọc dễ chịu).

---

## 6. Ngôn ngữ thiết kế bài tập — Exercise Shell + 9 pattern

### 6.1 Khung chung (Exercise Shell)

```
┌───────────────────────────────────┐
│ (ring % + icon cây)      ⌐ 💡 ⏭   │  ← KHÔNG hiện text context (VD "苹果 stage 2") — dư thừa
│                                     │
│         [Thẻ câu hỏi]              │
│                                     │
│         [Khu vực trả lời]          │  ← khác nhau theo pattern, xem §6.3
│                                     │
│         ● ● ○ ○ ○ (tiến độ)        │
└───────────────────────────────────┘
```

**Chi tiết ring:** hiển thị **MỌI dạng bài** (trừ Matching, Flashcard, Grammar — xem §6.2). Vẽ bằng SVG `stroke-dasharray` thể hiện đúng % (`min(total_points,30)/30`, DEC-12) — KHÔNG phải vòng tròn đặc/luôn đầy. Icon cây ở giữa đổi theo `stage`.

✅ **ĐÃ GIẢI QUYẾT (trước đây flag là "cần vẽ riêng"):** Bộ 6 icon cây (hạt giống→mầm→chồi→lá→hoa→quả) đã có sẵn dưới dạng SVG path tùy chỉnh trong `PcView.html`/`MobileView.html` (tìm trong khối "Khu vườn của bạn" ở màn Dashboard, hoặc trong ring ở đầu mỗi màn Player). **KHÔNG vẽ lại — trích xuất nguyên `<path>`/`<ellipse>`/`<circle>` từ file gốc**, biến thành component SVG dùng chung (VD `<GrowthStageIcon stage="sprout" />`). Toàn bộ icon trong app (nav sidebar, 3 nút tiện ích, 6 icon cây) đều theo phong cách vẽ tay nhất quán (viền `stroke-width:1.7-1.8`, `stroke-linecap:round`) — **không trộn lẫn với bất kỳ icon font nào** (Tabler, Lucide...) vì sẽ phá vỡ tính nhất quán nét vẽ.

**3 nút tiện ích (phiên âm/gợi ý/bỏ qua):** dạng "ghost" — chỉ icon nhỏ (16-18px) + label 10px, KHÔNG có nền/viền khung thẻ (để không bị nhầm với 4 đáp án). Đặt cùng hàng với ring, tách biệt không gian rõ ràng khỏi khu vực trả lời bên dưới.

**Nút Gợi ý:** bấm được **nhiều lần** (progressive reveal — VD Translate hiện thêm 1 ký tự mỗi lần bấm), KHÔNG phải toggle bật/tắt 1 lần.

**4 đáp án (khi có):** nền trắng thuần `#FFFFFF`, viền `1px solid #E5E5E5` — tương phản rõ với nền `#FFF8F0` của thẻ câu hỏi, khẳng định đây là vùng tương tác chính.

### 6.2 Hệ màu feedback — tái dùng thang Mastery Ring (không phát minh màu mới)

| Trạng thái | Màu | Ghi chú |
|---|---|---|
| Chọn sai | `#ef4444` (nền tint `#FEE2E2`, viền đậm, chữ `#B91C1C`) | **CHỈ tô ô vừa chọn sai** — các ô còn lại (kể cả đáp án đúng) giữ nguyên trung tính, không gợi ý |
| Gợi ý | `#eab308` | |
| Đúng | `#4ade80` | Auto-next sau ~0.6s nếu không có logic đặc biệt |

### 6.3 9 pattern tương tác (áp dụng shell ở §6.1, chỉ khác khu vực trả lời) — đã validate bằng mockup đủ cả 9

| # | Pattern | Dạng bài | Khu vực trả lời |
|---|---|---|---|
| 1 | Trắc nghiệm 4 đáp án | Selection, Audio Recognition, Select on Describe | Lưới 2×2 |
| 2 | Điền từ nhập tay | Translate, Listen Fill, Trans Collocation | Ô trống theo số ký tự + nút "Kiểm tra" |
| 3 | Sắp xếp từ | Arrange Words | 2 hàng: câu đang ghép (trên) + chip từ xáo trộn (dưới) |
| 6 | Chọn nhanh có đếm ngược | Fast Decision | Thanh đếm ngược 4s + 2 nút lớn Đúng/Sai |
| 7 | Hội thoại điền chỗ trống | Select Dialog, Fill Dialog | Khối 2 câu A/B có `___` + 4 chip đáp án (Select) hoặc ô nhập tay (Fill) |
| 8 | Tự luận AI chấm | Make Sentence, Trans Sentence, Complete Situation | Textarea lớn + nút "Nộp bài". **Ẩn hẳn nút Gợi ý.** Sau nộp: thẻ phản hồi AI |
| 9 | Nội dung đọc | Grammar | Không có khu vực trả lời, không hiện ring, chỉ nút "Tiếp theo" |

**Chi tiết layout từng pattern (đã validate bằng mockup):**

- **Pattern 2 (Điền từ):** số ô trống = đúng số ký tự Hán của đáp án, mỗi ô 1 chữ. Ô đang gõ (focus) có viền `2px solid #4F46E5`; ô chưa gõ chỉ có gạch chân `2px solid #DCD6CC`, không viền đầy đủ 4 cạnh — phân biệt rõ vị trí con trỏ hiện tại.
- **Pattern 3 (Sắp xếp từ):** hàng trên ("câu đang ghép") có nền `#FFF8F0`, các chip đã đưa vào tô tint chàm (`#EDE9FE` nền, `#4F46E5` viền, `#4338CA` chữ) để phân biệt với chip chưa chọn ở hàng dưới (nền trắng, viền `#E5E5E5` trung tính). Bấm 1 chip ở hàng dưới → chuyển lên hàng trên (đổi màu theo); bấm lại ở hàng trên → quay về hàng dưới.
- **Pattern 6 (Fast Decision):** thanh đếm ngược ngang phía trên câu hỏi, nền `#F0EAE3`, phần đã trôi qua tô `#eab308`, co ngắn dần trong 4s. 2 nút "Sai"/"Đúng" tô sẵn màu theo đúng Ý NGHĨA NHÃN (Sai = tint đỏ, Đúng = tint xanh) — đây là quy ước nút Có/Không thông thường, KHÔNG phải lộ đáp án trước, vì bản thân 2 lựa chọn này vốn có ý nghĩa cố định không đổi (khác 4 đáp án trắc nghiệm trung tính ở Pattern 1).
- **Pattern 7 (Hội thoại điền chỗ trống):** 2 khối câu A/B riêng biệt (không chung 1 khối), mỗi khối nền `#FFF8F0`, chỗ trống `___` tô màu `#4F46E5` đậm để dễ nhận ra giữa câu dài. Với Select Dialog: 4 chip đáp án bên dưới (nền trắng, viền trung tính), bấm để điền vào đúng chỗ trống tương ứng. Với Fill Dialog: thay 4 chip bằng 2 ô nhập tay đặt ngay tại vị trí `___`.
- **Pattern 8 (Tự luận AI chấm):** hàng icon tiện ích ở header CHỈ CÓ 2 icon (phiên âm + bỏ qua) — không có icon Gợi ý, khác biệt duy nhất so với shell chung. Textarea nền trắng, viền `1px solid #E5E5E5`, min-height ~50px, placeholder mời nhập ("Nhập câu của bạn..."). Nút "Nộp bài" nền chàm sâu đặc.
- **Pattern 9 (Grammar):** không có ring ở header (khác mọi pattern khác — vì không chấm điểm), chỉ có nút phiên âm nếu cần. Nội dung: câu tiếng đích (Noto Sans SC) + bản dịch tiếng Việt bên dưới (chữ phụ, nhỏ hơn). Chỉ 1 nút "Tiếp theo" duy nhất, không có khu vực trả lời nào khác.

**2 pattern phá vỡ shell — xử lý riêng:**

| Pattern | Dạng bài | Khác biệt |
|---|---|---|
| 4. Ghép cặp | Matching | Không có ring (vận hành trên 5 từ cùng lúc, không phải 1 từ/lần). Layout 2 cột × 5 nút. Ghép đúng → tint xanh `#DCFCE7`/viền `#4ade80` + disable |
| 5. Lật thẻ | Flashcard | Không có ring, không hint/skip. Nút Good/Hard/Again dùng đúng bộ đỏ/vàng/xanh feedback (§6.2) thay vì tạo màu mới |

---

## 7. Mastery Ring — chi tiết hiển thị

Kế thừa DEC-12, áp dụng token thị giác Nhiệt đới:

- **% viền** = `min(total_points, 30) / 30`, vẽ bằng SVG partial stroke, KHÔNG conic-gradient.
- **Icon giữa** = theo `stage` (6 icon cây, cần minh họa custom — xem §6.1).
- **6 mốc màu viền** (không đổi, xem §3): mỗi mốc ứng đúng 6 điểm `total_points`.
- Khi `total_points` bị phạt, viền **lùi màu tương ứng** — hành vi mong muốn.

---

## 8. Đặc tả 8 màn hình (PC + Mobile)

### Điều hướng toàn cục (áp dụng mọi màn)
- **Mobile:** thanh tab dưới cùng — 5 mục: Dashboard, Ôn tập (mở trực tiếp Player), Từ vựng, Import, Cài đặt. Thông báo truy cập qua icon chuông ở header.
- **PC:** sidebar trái cố định, cùng 5 mục + icon chuông thông báo ở cuối sidebar, nội dung chính giới hạn max-width ~720px căn giữa (không kéo full-width màn hình lớn).

### 8.1 Dashboard

**Nội dung** (đã validate bằng mockup): header chào + ngày + streak badge (coral tint) → 2 thẻ màu riêng biệt "đến hạn hôm nay" (tint chàm `#EDE9FE`) / "quá hạn" (tint vàng `#FEF9C3`, giọng điệu bình thản, KHÔNG dùng đỏ) → CTA chính "Bắt đầu ôn tập · N từ" (nền chàm sâu đặc) → CTA phụ "Ôn theo chủ đề" (tint ngọc lam) → khối "Khu vườn của bạn" gồm 2 tầng: hàng đếm 6 giai đoạn (icon trong chip màu tint theo ramp) + cụm ring cá nhân của từ vừa ôn gần đây.

⚠️ **Lưu ý quan trọng khi code:** màu ở hàng đếm 6 giai đoạn là **màu tượng trưng cho cả nhóm** (1 màu/stage cố định), KHÁC với màu ring cá nhân ở cụm bên dưới (phản ánh đúng `total_points` thật của từng từ, có thể lệch màu dù cùng stage). Đây là 2 nguồn dữ liệu khác nhau, đừng dùng chung 1 query.

- **Mobile:** 1 cột dọc đúng như mockup đã duyệt.
- **PC:** 2 cột — cột trái (rộng ~60%) chứa header/streak/2 thẻ due-overdue/CTA chính+phụ; cột phải (~40%) chứa khối "Khu vườn của bạn" đứng riêng, cao hơn để hiện được nhiều ring cá nhân hơn (8-10 thay vì 5).

### 8.2 Player — Ôn tập hằng ngày

Dùng đúng Exercise Shell + 9 pattern ở §6. Session gom theo stage (DEC-10), UI chuyển mượt giữa các bài trong cùng session (không cần chuyển trang, chỉ thay nội dung trong shell).

- **Mobile:** shell full-width trong khung ~420px như đã validate.
- **PC:** shell giữ nguyên độ rộng ~420-480px, **căn giữa màn hình**, KHÔNG kéo giãn full-width (tránh lưới 4 đáp án bị dàn quá mỏng, tránh textarea tự luận quá rộng khó đọc). Padding 2 bên lớn, có thể thêm khung viền mờ bao quanh toàn bộ khu vực Player để phân định với nền trang.

### 8.3 Player — Ôn tập theo topic + Hội thoại kết thúc

Giống 8.2 về phần bài tập. Sau khi hoàn thành toàn bộ từ trong topic, chuyển sang màn hội thoại (đã validate): không ring, dạng bong bóng chat A/B (khác biệt bằng sắc độ be nhạt/đậm, KHÔNG dùng thêm hue mới), từ vựng học được tô **chàm sâu + đậm nét** trong câu, nút "Xong" (nền chàm sâu đặc) kết thúc.

- **Mobile:** như mockup, full-width bong bóng chat.
- **PC:** khung hội thoại giới hạn max-width ~560px căn giữa (giống 1 khung chat app desktop, không kéo full ngang).

### 8.4 Quản lý từ vựng & topic

3 phần: danh sách topic (thẻ trắng ấm, mỗi thẻ có **thanh phân bố theo % số từ ở mỗi stage**, dùng đúng màu ramp — KHÔNG dùng 6 icon riêng lẻ vì có thể có hàng chục topic) → bấm vào 1 topic → danh sách từ (có thanh tìm kiếm, mỗi dòng: chữ Hán/pinyin/nghĩa + icon sửa/xóa) → form sửa **CHỈ các field cơ bản** (`word, pinyin, meaning_vi, collocation, collocation_pinyin, collocation_meaning_vi, example_sentence, example_meaning_vi`) — **KHÔNG sửa được nội dung 17 dạng bài tập** (payload), phải import lại file mới để cập nhật bài tập. Không có nút "Thêm từ mới" thủ công nổi bật (nguồn nhập liệu chính là Import).

- **Mobile:** 3 màn tách biệt, điều hướng bằng back arrow (topic list → word list → edit form dạng bottom sheet).
- **PC:** bố cục master-detail 2 cột — topic list bên trái (cố định, cuộn riêng), word list bên phải; form sửa mở dạng modal overlay giữa màn hình (không phải trang riêng).

### 8.5 Import

3 trạng thái (DEC-21): chọn file (khung kéo-thả nét đứt) → preview (thẻ tóm tắt topic/số từ/số bài tập/số câu hội thoại + banner cảnh báo vàng KHÔNG CHẶN nếu trùng từ, luôn cho thêm mới) → xác nhận/hủy.

- **Mobile:** 3 trạng thái là 3 màn tuần tự (tap để chuyển).
- **PC:** khung kéo-thả và preview có thể hiện **cạnh nhau trong cùng 1 màn** (2 cột, đã validate ở mockup) — file kéo vào bên trái, preview cập nhật realtime bên phải.

### 8.6 Cài đặt

3 nhóm: **AI/OpenRouter** (API key ẩn dạng `sk-••••3f2a`, chọn model) → **Học tập** (số từ mới/ngày dạng stepper +/-, giọng đọc TTS) → **Thông báo** (toggle bật/tắt cảnh báo hàng đợi cạn, dùng switch nền chàm sâu khi bật).

- **Mobile:** 1 cột, các nhóm xếp dọc như mockup.
- **PC:** 2 cột (nhóm AI + Học tập bên trái, Thông báo bên phải) hoặc giữ 1 cột nhưng rộng hơn với label/input canh 2 bên trái-phải rõ ràng hơn — ưu tiên rộng rãi hơn vì đây là màn ít ghé thăm, không cần tối ưu mật độ.

### 8.7 Thông báo

Danh sách, mỗi item: icon theo `type` + nội dung + thời gian + chấm chàm sâu nếu chưa đọc (đã đọc thì `opacity: 0.6`, không cần thêm màu).

- **Mobile:** trang riêng, full list.
- **PC:** panel dropdown nhỏ (~360px) xổ xuống từ icon chuông trên sidebar, không phải trang riêng — vì nội dung thường ngắn, không cần chiếm cả màn hình.

### 8.8 Tổng kết phiên ôn tập hằng ngày (màn mới phát hiện thiếu — bổ sung, đã sửa lần 2)

Xuất hiện **mỗi khi người dùng rời khỏi Player** (hết từ due trong lượt hiện tại, hoặc chủ động thoát giữa chừng), miễn đã hoàn thành ít nhất 1 từ. KHÔNG chờ tới khi hết cả ngày mới hiện — vì người dùng có thể chia việc ôn thành nhiều lượt rải rác trong ngày (xem logic đầy đủ ở `SPECIFICATION.md` §4.6). Số liệu hiển thị luôn là **cộng dồn cả ngày tính đến hiện tại** (query `review_log`), không phải chỉ riêng lượt vừa xong — nhờ vậy xem tổng kết bao nhiêu lần trong ngày cũng cho số đúng.

**Nội dung** (đã validate bằng mockup):
1. Header ăn mừng nhẹ nhàng (icon + câu chào, KHÔNG dùng ngôn ngữ thổi phồng).
2. 3 thẻ số liệu: tổng điểm hôm nay (tint chàm), số từ đã ôn (trung tính), số từ lên stage (tint xanh).
3. **Nếu có từ đạt Mastered hôm nay:** thẻ nổi bật riêng, nền **vàng/hổ phách** (`#FEF9C3`) — dùng làm màu "spotlight thành tích" (quy ước ngôi sao vàng), TÁCH BIỆT khỏi ý nghĩa dữ liệu nghiêm ngặt của thang ring. Icon quả bên trong vẫn giữ đúng `#16a34a` (mốc Mastered thật của ring) để không mất liên kết ngữ nghĩa.
4. Danh sách chi tiết từng từ: icon stage-trước → mũi tên → icon stage-sau (nếu có lên stage) hoặc chỉ icon hiện tại + nhãn "chưa đủ điểm" (nếu không lên). Icon tô màu theo đúng stage tương ứng (dùng lại logic tô màu "tổng hợp theo stage" ở §8.1, KHÔNG phải màu ring cá nhân theo `total_points`).
5. Dòng chữ nhẹ nhàng (không phải cảnh báo) cho số từ chưa đạt ngưỡng: "N từ chưa đủ điểm hôm nay sẽ tiếp tục vào ngày mai".
6. **2 biến thể CTA tùy trạng thái hàng đợi:**
   - **Đã hết từ due trong ngày:** chỉ 1 nút "Về Dashboard" (nền chàm sâu đặc).
   - **Còn từ due chưa ôn** (người dùng thoát giữa chừng): thêm dòng nhắc nhẹ phía trên nút, giọng thông tin chứ không thúc giục — "Còn N từ đang chờ bạn hôm nay" — kèm **2 nút**: "Ôn tiếp" (nền chàm sâu đặc, ưu tiên chính) và "Về Dashboard" (ghost, phụ).

- **Mobile:** full-width 1 cột như mockup.
- **PC:** thẻ giới hạn max-width ~480px căn giữa màn hình (giống cách trình bày màn Hội thoại §8.3) — đây là khoảnh khắc tập trung, không nên kéo giãn full-width.

---

## 9. Component chung (dùng trong các màn hành chính 8.4-8.7)

| Component | Spec |
|---|---|
| Input text | Nền `#FFF8F0`, viền `1px solid #F0EAE3`, radius 8px, padding 8-10px |
| Button chính | Nền `#4F46E5` đặc, chữ trắng, radius 10-12px |
| Button phụ | Nền tint nhạt của accent phụ (`#E6FAF7` ngọc lam), chữ đậm màu accent đó |
| Button ghost | Không nền/viền, chỉ icon+chữ màu `#8A8580` |
| Toggle switch | Track 36×20px, bật = nền `#4F46E5`, tắt = nền xám nhạt |
| Card | Nền `#FFF8F0`, viền `1px solid #F0EAE3`, radius 10-12px |
| Badge/tag | Radius pill (999px), padding 5-6px 10-12px, nền tint + chữ đậm cùng họ màu |

---

## 10. Ghi chú cho AI agent khi tham khảo `PcView.html`/`MobileView.html`

**Bối cảnh 2 file:** đây là **file thư viện tham chiếu (design gallery)**, không phải app thật — mỗi file chứa 36-38 khung màn hình cỡ cố định (VD `1280×800` cho PC) xếp cạnh nhau, mỗi khung có `data-screen-label="..."` để định danh (VD `"02 Player MCQ PC (Dark)"`). Có 1 file `support.js` ngoài (không đính kèm) chỉ phục vụ cuộn/điều hướng giữa các khung trong LÚC XEM file — không phải logic app thật, KHÔNG cần port sang app.

**1. Không copy nguyên khung "device frame" vào app thật.** Mỗi màn được bọc trong 1 `<div>` cỡ cố định + `border-radius:20px` + `box-shadow` để giả lập khung thiết bị khi xem gallery — đây là quy ước trình bày của FILE THAM KHẢO, không phải style thật của app. Chỉ lấy phần NỘI DUNG bên trong khung đó.

**2. Toàn bộ màu là inline `style="..."`, không có biến CSS (`--xxx`) hay class nào trong 2 file này.** Khi code app thật, PHẢI tự dựng lại theo kiến trúc token 2 lớp ở §2 (raw hex → semantic token) — không copy y nguyên inline style, sẽ không đổi được theme sau này. Dùng bảng §3 làm nguồn giá trị cho Lớp 1.

**3. Icon nav/tiện ích là SVG path vẽ tay, nhúng trực tiếp trong HTML — không phải icon font.** Trích xuất `<svg>...</svg>` gốc cho: 5 icon nav sidebar (Dashboard/Ôn tập/Từ vựng/Import/Cài đặt + chuông Thông báo), 3 icon tiện ích Player (phiên âm dùng ký tự "拼" thay vì icon mắt — giữ nguyên chi tiết này, không đổi sang eye-icon generic). Dùng làm bộ icon chuẩn cho các phần này.

⚠️ **RIÊNG bộ 6 icon giai đoạn cây (hạt giống→mầm→chồi→lá→hoa→quả) — CHƯA CHỐT, KHÔNG dùng thẳng làm bản chính thức.** Đây là bản nháp trong lúc thiết kế, người dùng muốn tìm bộ icon "trông thật mắt và đồng bộ" hơn. **AI agent PHẢI dừng lại và trao đổi với người dùng khi code tới phần này** (đề xuất phương án, xin xác nhận) — không tự ý implement theo SVG path hiện có trong file. *(Đã chèn comment cảnh báo này trực tiếp vào cả 2 file HTML, ngay tại khối "Khu vườn của bạn" — xem §10 mục 9.)*

**4. Cùng 1 icon "phiên âm" (拼) xuất hiện tĩnh trong file — không thấy được 2 trạng thái ẩn/hiện.** Vì đây là ảnh tĩnh, file KHÔNG thể hiện hành vi toggle thật (đổi màu/đổi icon khi bật/tắt). Cần tự quyết định trạng thái "đang bật" trông thế nào khi code (gợi ý: đổi màu chữ/icon sang accent tím khi đang hiện phiên âm) — đây là quyết định UI-state, không có trong file tham khảo.

**5. PC và Mobile dùng chung 100% giá trị màu** (đã verify bằng cách so khớp mã hex 2 file) — chỉ khác bố cục/kích thước, không phải khác bảng màu. Nếu thấy màu lệch giữa 2 file ở đâu đó chưa kiểm tra hết, đó là lỗi cần hỏi lại người dùng, không phải chủ ý.

**6. Dark mode dùng kiến trúc 3 tầng nền** (khung ngoài `#15171C` tối nhất → sidebar `#17191E` → nội dung chính `#22252C` sáng hơn 1 chút) — không phải 2 tầng phẳng (bg/card) như bản nháp UI_DESIGN.md trước đó. Giữ đúng 3 tầng này khi code, tạo chiều sâu thị giác rõ hơn.

**7. Đọc `SPECIFICATION.md` song song bắt buộc** — file HTML chỉ là lớp thị giác tĩnh, mọi hành vi động (validate, tính điểm, gọi API, cron...) tham chiếu `SPECIFICATION.md`. 2 file HTML đã bám khá sát đặc tả — VD màn "12 Session summary" trong file đã implement đúng logic §4.6 (3 thẻ số liệu, khối Mastered nổi bật riêng, danh sách stage trước→sau, câu nhắc nhẹ "sẽ tiếp tục ngày mai") — dùng làm mẫu chuẩn.

**8. Với bất kỳ giá trị cụ thể (hex, spacing, radius) không có trong bảng §3/component đã liệt kê ở tài liệu này:** LUÔN trích xuất trực tiếp từ 2 file HTML bằng script (`grep`/`python` parse `style="..."`) thay vì đoán hoặc suy diễn từ màu tương tự — đây là nguyên tắc quan trọng nhất, vì độ chính xác màu quyết định app có "giống bản thiết kế" hay không.

**9. 2 file HTML đã được chèn comment trực tiếp** (ở đầu file, ngay sau `<body>`, và tại khối "Khu vườn của bạn") — tóm tắt các điểm quan trọng ở trên để AI agent thấy ngay cả khi đọc thẳng file HTML mà không mở `UI_DESIGN.md`. Nếu tạo phiên bản HTML mới/chỉnh sửa file này, giữ lại các comment đó.

