import { useState } from 'react'
import { DS_CHE_DO, docCheDo, KHOA_LUU, thuocTinhTheme, type CheDo } from '../../lib/giaoDien.ts'

/**
 * Chọn giao diện Sáng / Tối / Hệ thống (M16) — điều khiển 3 nút liền nhau.
 *
 * ⚠️ Kiểu điều khiển MỚI, chưa có trong mockup nào; layout đã duyệt ở DESIGN.md §5.
 *
 * Dựng bằng `<input type="radio">` GỐC (ẩn bằng `sr-only`) bọc trong `<label>`, KHÔNG tự dựng nút +
 * role="radio": trình duyệt cho sẵn điều hướng bằng phím mũi tên, Tab chỉ dừng 1 lần ở cả nhóm,
 * và trình đọc màn hình hiểu đúng — không phải viết thêm dòng JS nào (`ponytail`).
 *
 * Màu: nút đang chọn nền TÍM vì là phần tử bấm được — UI_DESIGN §63 cấm hồng trên nút.
 *
 * Đổi là áp NGAY, không cần bấm Lưu: thấy kết quả tức thì và đổi lại được ngay, không có gì "lỡ tay"
 * (khác các ô khoá API — M6a/Q3).
 */

/** localStorage có thể ném ở chế độ ẩn danh / khi bị chặn ⇒ rơi về Hệ thống (M16/Q5). */
function docDaLuu(): CheDo {
  try {
    return docCheDo(localStorage.getItem(KHOA_LUU))
  } catch {
    return 'he_thong'
  }
}

function apDung(cheDo: CheDo): void {
  const t = thuocTinhTheme(cheDo)
  // null ⇒ GỠ thuộc tính để nhánh @media của tokens.css tự theo hệ điều hành
  if (t) document.documentElement.dataset.theme = t
  else delete document.documentElement.dataset.theme

  try {
    // Hệ thống = "chưa từng chọn" ⇒ xoá khoá cho gọn, script trong index.html hiểu y hệt
    if (cheDo === 'he_thong') localStorage.removeItem(KHOA_LUU)
    else localStorage.setItem(KHOA_LUU, cheDo)
  } catch {
    // Bị chặn ghi ⇒ vẫn áp cho phiên hiện tại, chỉ là không nhớ được sang lần tải sau.
  }
}

export default function ChonGiaoDien() {
  const [cheDo, setCheDo] = useState<CheDo>(docDaLuu)

  function chon(moi: CheDo) {
    setCheDo(moi)
    apDung(moi)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Giao diện"
      className="flex shrink-0 rounded-10 bg-surface-sunken p-1"
    >
      {DS_CHE_DO.map((o) => {
        const dangChon = cheDo === o.gia_tri
        return (
          <label
            key={o.gia_tri}
            className={`cursor-pointer rounded-8 px-3 py-1.5 text-13 font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
              dangChon ? 'bg-accent text-white' : 'text-content-nav hover:text-content-primary'
            }`}
          >
            <input
              type="radio"
              name="giao-dien"
              value={o.gia_tri}
              checked={dangChon}
              onChange={() => chon(o.gia_tri)}
              className="sr-only"
            />
            {o.nhan}
          </label>
        )
      })}
    </div>
  )
}
