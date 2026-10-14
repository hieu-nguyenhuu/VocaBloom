# M30 — Sắp xếp câu: chip hàng dưới đứng yên, chip đã chọn bôi xám giữ chỗ

> Task nhỏ (1 file UI) ⇒ Design + Plan gộp 1 file. Màn: Player Pattern 3 (mockup 04), `src/features/player/bai/SapXep.tsx`.

## 1. Lỗi người dùng báo

Bấm 1 chip ở hàng dưới thì các chip còn lại dồn và nhảy chỗ, nên rất khó nhìn và dễ chọn sai.

**Gốc:** [SapXep.tsx:90](src/features/player/bai/SapXep.tsx#L90) `khay.includes(i) ? null : …` gỡ hẳn chip khỏi DOM. Hàng dưới là
`flex-wrap justify-center`, nên mất 1 chip là cả hàng dồn lại, căn giữa lại, có khi đổi dòng. Gỡ chip trên xuống thì chip mọc lại
và cả hàng nhảy thêm lần nữa.

## 2. Hành vi mới (đã chốt theo yêu cầu)

| # | Hành vi |
|---|---|
| H1 | Hàng dưới LUÔN render đủ `xao.length` chip, đúng thứ tự xáo ban đầu ⇒ không chip nào đổi vị trí trong suốt bài |
| H2 | Chip đã đưa lên khay ⇒ ở hàng dưới thành **ô giữ chỗ bôi xám**: cùng kích thước (giữ chữ + pinyin để không đổi bề rộng), nền `surface-sunken`, chữ `content-muted`, mờ 50%, `disabled`, không nhận Tab |
| H3 | Bấm chip trên khay để gỡ ⇒ ô xám tương ứng sáng lại **đúng chỗ cũ** (đã đúng sẵn vì khay lưu chỉ số trong `xao`) |
| H4 | Khay trên giữ nguyên như cũ: thứ tự theo lượt chọn, gỡ 1 chip thì câu khép lại (đó là câu đang ghép, không phải chỗ người dùng nhắm để bấm) |
| H5 | Từ trùng chữ (2 token giống hệt) vẫn đúng vì theo chỉ số, không theo chữ. Gợi ý, chấm, M25 sai giữ khay: không đổi |

**Lệch mockup có chủ ý:** mockup 04 ẩn chip đã chọn khỏi hàng dưới. Bản này cố ý giữ ô xám theo yêu cầu người dùng, cùng hướng với M28
(Select Dialog: chip đang dùng giữ chỗ). Token đều đã có sẵn (`surface-sunken`, `content-muted`, `border-input`), **0 màu mới**.

Không đổi logic chấm ⇒ không có hàm thuần mới ⇒ không bắt buộc TDD (CLAUDE.md B3: task UI thuần). Kiểm bằng CDP đo toạ độ.

### 2b. Phát sinh lúc kiểm CDP (đã làm): khay trên cao dần đẩy cả hàng dưới xuống

Sau T1–T2, chip dưới đứng yên với nhau, nhưng **cả hàng vẫn tụt xuống**: khay `min-h-16` = 64px, thêm chip đầu ⇒ 87px, thêm
1 dòng chip ⇒ +59px. Đo trên Mobile 390 có pinyin: y hàng dưới 193 → 216 → 275, nên tay vẫn bấm trượt.
**Sửa (CSS thuần):** khay thành `grid`, chồng 1 **bản ma `invisible` của cả câu** (thứ tự `payload.tokens`, kiểu `CHIP_DA`, có
pinyin khi bật) cùng ô với lớp chip thật ⇒ khay cao sẵn bằng câu hoàn chỉnh ngay từ đầu. Đánh đổi: lúc mới vào bài, khay có
khoảng trống bằng chiều cao câu. Ca xếp ngược thứ tự (câu sai có thể xuống dòng khác) cũng đã đo: vị trí không đổi.

## 2c. Kết quả
`npm test` 487/487 · build xanh · lint exit 0 (0 cảnh báo mới) · CDP trang tạm **73/73** (PC 1280 + Mobile 390 × Sáng/Tối ×
pinyin bật/tắt; 9 ca mỗi cấu hình + 0 request supabase.co). Trang tạm `tam-m30.*` đã xoá.

## 3. Plan

**T1 — `SapXep.tsx`: thêm style giữ chỗ** (sau dòng `CHIP_DA`):
```tsx
// M30 — chip đã lên khay vẫn GIỮ CHỖ ở hàng dưới (cùng viền 1px như CHIP_CHUA ⇒ không đổi bề rộng)
const CHIP_GIU_CHO = `${CHIP} border border-border-input bg-surface-sunken text-content-muted opacity-50 cursor-default`
```

**T2 — `SapXep.tsx`: hàng dưới luôn render đủ chip**, thay khối `xao.map(...)`:
```tsx
{xao.map((t, i) => {
  const daChon = khay.includes(i)
  return (
    <button key={i} type="button" disabled={kq !== null || daChon} tabIndex={daChon ? -1 : undefined}
      onClick={() => setKhay((c) => [...c, i])} className={daChon ? CHIP_GIU_CHO : CHIP_CHUA}>
      {t.text}
      {hienPhienAm && t.pinyin && (
        <span className="ml-1.5 font-body text-11 text-content-muted">{t.pinyin}</span>
      )}
    </button>
  )
})}
```
Kèm sửa comment đầu file (dòng 8–9) cho đúng hành vi mới.

**T3 — Kiểm chứng:** `npm test` · `npm run build` · `npm run lint`. CDP trên trang tạm (không đăng nhập, 0 request supabase.co),
PC 1280 + Mobile 390 × Sáng/Tối: (a) toạ độ mọi chip hàng dưới TRƯỚC = SAU khi chọn 1, 2, hết chip; (b) ô đã chọn `disabled` + xám;
(c) gỡ chip trên ⇒ chip dưới sáng lại đúng toạ độ cũ; (d) chọn đủ đúng thứ tự ⇒ Kiểm tra xanh. Chụp ảnh để bạn xem. Xoá trang tạm.

**T4 — Tài liệu:** UI_DESIGN §6 Pattern 3 (thêm câu ô giữ chỗ) · memory-bank (`activeContext`, `progress`, `decisionLog` MB-52) · `DESIGN.md` thêm dòng M30.

**T5 — Theo lệnh người dùng:** `git commit` (chỉ các file của M30 + memory-bank), rồi `npm run deploy:firebase`, rồi mở URL cloud kiểm tải được.
`git push` thì hỏi lại (người dùng nói "commit github", nên sẽ xác nhận trước khi đẩy lên remote).
