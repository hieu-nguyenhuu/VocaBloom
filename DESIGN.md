# DESIGN.md — M17: Âm thanh phản hồi + cài đặt âm thanh riêng

> Kiến trúc + kế hoạch của RIÊNG task này.
> Ngày lập: 2026-09-27 · Sửa lần 3 theo phản hồi người dùng · Trạng thái: **CHỜ DUYỆT**
>
> ℹ️ Ghi đè bản M16 — nội dung M16 đã lưu đầy đủ ở `decisionLog.md` MB-37.
> Âm thanh đã được nghe thử và chọn tại: https://claude.ai/artifact/KjhHGwwJW3NVknLcT9AmdB

---

## 1. Yêu cầu (người dùng chốt 2026-09-27)

1. Làm các âm nhóm *Nên có* + *Tuỳ chọn* trên trang nghe thử, **TRỪ 3 âm người dùng bỏ**:
   - *Lên giai đoạn* — làm phần đúng/sai quá phức tạp;
   - *Thành thạo* và *Nhận ruby* — màn Tổng kết **chỉ cần 1 âm** báo hiệu là đủ.
2. Âm đúng/sai phát **đúng lúc thấy màu xanh/đỏ**.
3. Màn Cài đặt có **nhóm "Âm thanh" riêng**, bật/tắt **từng âm**.
4. **KHÔNG** có nhạc nền ở Dashboard.

## 2. Danh mục 7 âm

| Mã | Tên | Nhóm | Mặc định | Dài | Phát ở đâu |
|---|---|---|---|---|---|
| `dung` | Trả lời đúng | Khi trả lời | Bật | 300ms | Lúc chấm, cùng lúc tô xanh |
| `sai` | Trả lời sai | Khi trả lời | Bật | 360ms | Lúc chấm, cùng lúc tô đỏ |
| `dung_goi_y` | Đúng nhưng đã dùng gợi ý | Khi trả lời | Bật | 220ms | Lúc chấm |
| `hoan_thanh` | Hoàn thành lượt ôn | Màn Tổng kết | Bật | 900ms | Khi màn Tổng kết hiện ra — **âm duy nhất của màn này** |
| `va_ngay` | Vá ngày bằng ruby | Phần thưởng | Bật | 370ms | Màn Lịch sử, sau khi vá thành công |
| `ghep_cap` | Ghép đúng 1 cặp | Tương tác nhỏ | Bật | 60ms | Mỗi cặp đúng ở Matching |
| `lat_the` | Lật flashcard | Tương tác nhỏ | **Tắt** | 160ms | Lúc lật thẻ |

Công thức tổng hợp (nốt, dạng sóng, đường bao) **chép nguyên từ trang nghe thử** đã duyệt.

## 3. Quyết định

| Mã | Nội dung | Lý do |
|---|---|---|
| **Q1** | ⭐ Âm đúng/sai phát **NGAY TẠI dòng code chấm bài** trong mỗi màn bài tập, **KHÔNG** trong `traLoi` của Player | Người dùng chốt. Xem §4 |
| **Q2** | **Bỏ âm "Lên giai đoạn"** | Người dùng chốt. Nhờ vậy âm đúng/sai không cần biết gì về điểm SRS |
| **Q3** | Tổng hợp bằng **Web Audio API**, 0 file âm thanh, 0 package | Đã nghe và duyệt trên trang thử |
| **Q4** | **Kênh riêng**, không đụng `phatAm()` | `phatAm()` tự cắt tiếng đọc cũ khi đọc từ mới. Âm phản hồi đi đường riêng nên không cắt tiếng đọc và không bị nó cắt |
| **Q5** | Lưu **localStorage** theo từng thiết bị, khoá `vb-am-thanh` | Giống M16/Q1 |
| **Q6** | Công tắc tổng + âm lượng + công tắc **từng âm**. Tắt công tắc tổng thì công tắc con **giữ nguyên giá trị**, chỉ mờ đi | Người dùng yêu cầu bật/tắt từng âm |
| **Q7** | ⭐ **Tắt âm nào thì âm đó im — không có âm thay thế** | Mỗi công tắc điều khiển đúng một âm, không có luật ngầm. Bản trước đề xuất "lùi về âm cơ bản" — bỏ, vì người dùng muốn đơn giản |
| **Q8** | Màn Tổng kết phát **đúng 1 âm** `hoan_thanh`. Bỏ `thanh_thao` và `nhan_ruby` | Người dùng chốt. Hệ quả tốt: màn Tổng kết **không cần** đọc thêm số ruby trước/sau, không cần dò từ thành thạo, không cần hàm phát nối tiếp |
| **Q9** | Âm **không bao giờ là tín hiệu duy nhất** | Màu xanh/đỏ giữ nguyên — người dùng có thể đang tắt tiếng |
| **Q10** | Mọi lỗi âm thanh **nuốt im lặng** (`try/catch`) | Không để 1 tiếng "ting" làm hỏng bài đang làm |
| **Q11** | Nút **nghe thử** cạnh từng công tắc, **vẫn phát được khi âm đó đang tắt** | Nghe rồi mới quyết định bật. Tái dùng pattern nút loa của hàng chọn giọng (M6c) |

## 4. ⭐ Vì sao phát ngay tại dòng chấm bài (Q1)

Các màn bài tập **chấm NGAY** khi bạn chọn, nhưng **chờ rồi mới báo** cho Player:

```ts
// TracNghiem.tsx:83 — y hệt ở DienTu, SapXep, HoiThoai
const dung = daChon === dapAn                              // ← chấm + tô xanh/đỏ NGAY
setTimeout(() => onTraLoi(dung, ...), dung ? 600 : 1000)  // ← báo Player SAU 600/1000ms
```

Nếu gắn âm ở `traLoi` của Player, âm sẽ phát **đúng lúc chuyển màn** và đè lên tiếng phát âm của từ
kế tiếp. Nên âm phát **ngay dòng đầu**:

```ts
const dung = daChon === dapAn
phatAmThanh(amKhiCham(dung, soGoiY > 0))                   // ← MỚI: cùng khoảnh khắc với màu
setTimeout(() => onTraLoi(dung, ...), dung ? 600 : 1000)
```

Vì đã bỏ âm "Lên giai đoạn", màn bài tập **tự đủ thông tin** (đúng/sai + có dùng gợi ý không) —
**không cần callback mới lên Player, không đụng `PlayerPage`, không đụng SRS**.

## 5. Gắn âm vào từng màn

| Màn | Âm | Thời điểm |
|---|---|---|
| `TracNghiem` (Selection, Audio, Mô tả, Chọn câu) | `dung` / `sai` / `dung_goi_y` | Lúc chọn đáp án |
| `DienTu` (Translate, Listen Fill, Trans Collocation) | như trên | Lúc bấm Kiểm tra |
| `SapXep` | như trên | Lúc bấm Kiểm tra |
| `HoiThoai` (2 chỗ trống) | đúng cả 2 ⇒ `dung` / `dung_goi_y`; có chỗ sai ⇒ `sai` | Lúc bấm Kiểm tra / chọn đủ 2 chip |
| `FastDecision` | như trên; **hết 4 giây ⇒ `sai`** | Lúc chọn / hết giờ |
| `Matching` | cặp đúng ⇒ `ghep_cap`; cặp sai ⇒ `sai` | Lúc nối từng cặp |
| `ChamAI` (stage 3) | theo verdict của thẻ phản hồi | Lúc thẻ phản hồi hiện ra |
| `Flashcard` | `lat_the` | Lúc lật (Good / Hard / Again **không** có âm) |
| `TongKetPage` | `hoan_thanh` (Q8) | Khi màn hiện ra, 1 lần (ref guard chống StrictMode gọi đôi — MB-20/1) |
| `LichSuPage` | `va_ngay` | Sau khi RPC `va_ngay` thành công |

**Mở khoá âm thanh của trình duyệt:** âm chỉ phát sau khi người dùng chạm vào trang. Âm phản hồi luôn
bắt nguồn từ một cú bấm/phím nên luôn phát được. Màn Tổng kết là điều hướng trong cùng trang nên dùng lại
`AudioContext` đã mở; **tải lại trang ngay ở Tổng kết** thì sẽ không có tiếng — im lặng, chấp nhận được.

## 6. UI — nhóm "Âm thanh" ở màn Cài đặt (**cần bạn duyệt**)

Mockup 17/18 không có nhóm này. Ghép từ **đúng các mảnh đã có** trên màn Cài đặt:

```
ÂM THANH
┌──────────────────────────────────────────────────┐
│ Âm thanh                                   [●━━] │  ← công tắc tổng (dùng lại switch "Cảnh báo")
├──────────────────────────────────────────────────┤
│ Âm lượng           ━━━━━━━━●━━━━━━━  60%         │  ← <input type="range"> gốc, accent tím — MỚI
└──────────────────────────────────────────────────┘
  Khi trả lời
┌──────────────────────────────────────────────────┐
│ Trả lời đúng                       🔊   [●━━]    │  ← nút loa = pattern nghe thử giọng (M6c)
│ Trả lời sai                        🔊   [●━━]    │
│ Đúng nhưng đã dùng gợi ý           🔊   [●━━]    │
└──────────────────────────────────────────────────┘
  Màn Tổng kết · Phần thưởng · Tương tác nhỏ      (cùng khuôn — tổng 7 hàng)
```

- Mỗi hàng dùng khung `HANG` sẵn có. Switch của hàng "Cảnh báo hàng đợi" được **tách thành component
  `CongTac`** để dùng lại 8 lần (1 tổng + 7 âm) thay vì chép markup 8 lần.
- Thanh trượt âm lượng là **thành phần mới duy nhất** — dùng `<input type="range">` gốc với `accent-color` tím.
- Màu: nút, công tắc, thanh trượt đều **tím** (phần tử bấm được — UI_DESIGN §63). Không thêm token mới.
- Đổi là áp ngay, không cần bấm Lưu (cùng lý do M16).

## 7. Kiến trúc module

| File | Loại | Nội dung |
|---|---|---|
| `src/lib/amThanhCore.ts` | **Thuần** | Danh mục 7 âm (mã, tên, nhóm, mặc định, độ dài) · `docCaiDatAmThanh(raw)` · `amKhiCham(dung, goiY)` · `duocPhat(ma, caiDat)` |
| `src/lib/amThanh.ts` | Web Audio | `AudioContext` dùng chung · công thức 7 âm · `phatAmThanh(ma)` (tôn trọng cài đặt) · `ngheThu(ma)` (bỏ qua công tắc) · lỗi nuốt im lặng |
| `src/components/CongTac.tsx` | UI | Switch tách ra từ hàng "Cảnh báo" |
| `src/features/settings/CaiDatAmThanh.tsx` | UI | Nhóm "Âm thanh" |

## 8. PLAN — 9 task

| # | Nội dung | Loại |
|---|---|---|
| T1 | RED+GREEN `docCaiDatAmThanh` — chưa có ⇒ mặc định · JSON hỏng ⇒ mặc định · thiếu âm ⇒ tự điền mặc định · âm lượng ngoài 0–100 ⇒ kẹp · `lat_the` mặc định tắt | TDD |
| T2 | RED+GREEN `amKhiCham` + `duocPhat` — công tắc tổng tắt ⇒ không âm nào được phát · tắt 1 âm ⇒ đúng âm đó im, **không có âm thay thế** | TDD |
| T3 | **Test chống lệch**: `dung`, `dung_goi_y` ngắn hơn 600ms, `sai` ngắn hơn 1000ms; **và** đọc 4 file màn bài tập khẳng định vẫn chờ đúng `600 : 1000` — ai đổi khoảng chờ mà quên âm thanh thì test đỏ | TDD |
| T4 | `amThanh.ts` — chép công thức từ trang nghe thử | Code |
| T5 | Tách `CongTac.tsx`, dùng lại ở hàng "Cảnh báo" (giao diện không đổi) | Refactor |
| T6 | `CaiDatAmThanh.tsx` + gắn vào màn Cài đặt | UI |
| T7 | Gắn âm vào 8 màn bài tập + `TongKetPage` + `LichSuPage` | Code |
| T8 | build · lint · `npm test` | Kiểm |
| T9 | **Kiểm thật CDP**, đo bằng số chứ không bằng tai: bọc `AudioContext` để **đếm và ghi thời điểm từng âm** ⇒ trả lời đúng ⇒ đúng 1 âm, phát **cùng lúc** ô chuyển xanh và **trước** khi chuyển màn · trả lời sai ⇒ `sai` · tắt âm `dung` ⇒ 0 âm · tắt công tắc tổng ⇒ 0 âm dù âm con đang bật · tải lại trang giữ nguyên cài đặt · Flashcard mặc định không có tiếng · vào Tổng kết ⇒ **đúng 1 âm** | Kiểm thật |

## 9. Tiêu chí nghiệm thu

- [ ] Trả lời xong nghe **đúng 1 âm**, cùng khoảnh khắc thấy màu xanh/đỏ.
- [ ] Âm phản hồi **không đè** tiếng phát âm của từ kế tiếp.
- [ ] Bật/tắt từng âm có hiệu lực ngay, tải lại trang vẫn giữ. Tắt âm nào thì đúng âm đó im.
- [ ] Công tắc tổng tắt ⇒ im hoàn toàn; bật lại ⇒ các âm con trở về đúng trạng thái trước đó.
- [ ] Không có nhạc nền ở bất kỳ đâu.
- [ ] `npm test` · build · lint 0 lỗi.

## 10. Ngoài phạm vi

- Âm "Lên giai đoạn", "Thành thạo", "Nhận ruby" (người dùng bỏ).
- Nhạc nền (người dùng chốt không làm).
- Đồng bộ cài đặt âm thanh giữa các thiết bị.
- Âm cho Good / Hard / Again của Flashcard, âm cho nút bấm thông thường.
