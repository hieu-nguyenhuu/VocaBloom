import { useState } from 'react'
import CongTac from '../../components/CongTac.tsx'
import { Icon } from '../../components/icons.tsx'
import { luuCaiDatAmThanh, docCaiDatDaLuu, ngheThuAmThanh } from '../../lib/amThanh.ts'
import { DS_AM, TEN_NHOM, type CaiDatAmThanh, type MaAm, type NhomAm } from '../../lib/amThanhCore.ts'
import { HANG, NHAN } from './kieu.ts'

/**
 * Nhóm "Âm thanh" ở màn Cài đặt (M17) — mockup 17/18 KHÔNG có nhóm này; layout đã duyệt ở DESIGN §6.
 * Ghép từ đúng các mảnh đã có: khung `HANG`, công tắc của hàng "Cảnh báo", nút loa của hàng chọn giọng.
 * Thành phần mới duy nhất: thanh trượt âm lượng (`<input type="range">` gốc).
 *
 * Lưu localStorage theo từng thiết bị (M17/Q5). Đổi là áp ngay, không cần bấm Lưu.
 * `phatAmThanh()` đọc lại localStorage mỗi lần phát ⇒ không cần context/store chung nào cả.
 */
const THU_TU_NHOM: readonly NhomAm[] = ['tra_loi', 'tong_ket', 'phan_thuong', 'tuong_tac']

export default function CaiDatAmThanh() {
  const [cd, setCd] = useState<CaiDatAmThanh>(docCaiDatDaLuu)

  function doi(moi: CaiDatAmThanh) {
    setCd(moi)
    luuCaiDatAmThanh(moi)
  }

  function batTung(ma: MaAm, bat: boolean) {
    doi({ ...cd, tung: { ...cd.tung, [ma]: bat } })
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className={HANG}>
        <span className={NHAN}>Âm thanh</span>
        <CongTac bat={cd.bat} nhan="Bật âm thanh" onDoi={(bat) => doi({ ...cd, bat })} />
      </div>

      <div className={HANG}>
        <label htmlFor="am-luong" className={NHAN}>
          Âm lượng
        </label>
        <div className="flex items-center gap-3">
          <input
            id="am-luong"
            type="range"
            min={0}
            max={100}
            step={5}
            value={cd.amLuong}
            disabled={!cd.bat}
            onChange={(e) => doi({ ...cd, amLuong: Number(e.target.value) })}
            // Nhả tay thì phát thử 1 âm ở mức vừa chọn — nghe ngay chứ không phải đoán
            onPointerUp={() => ngheThuAmThanh('dung', cd.amLuong)}
            onKeyUp={() => ngheThuAmThanh('dung', cd.amLuong)}
            className="w-28 accent-accent disabled:opacity-50 md:w-36"
          />
          <span className="w-9 text-right text-14 font-semibold text-content-primary tabular-nums">
            {cd.amLuong}%
          </span>
        </div>
      </div>

      {THU_TU_NHOM.map((nhom) => (
        <div key={nhom} className="mt-2 flex flex-col gap-2.5">
          <h3 className="text-12 font-semibold text-content-muted">{TEN_NHOM[nhom]}</h3>
          {DS_AM.filter((a) => a.nhom === nhom).map((a) => (
            <div key={a.ma} className={`${HANG} ${cd.bat ? '' : 'opacity-60'}`}>
              <span className={NHAN}>{a.ten}</span>
              <div className="flex items-center gap-2">
                {/* Nghe thử BỎ QUA công tắc — để nghe rồi mới quyết định bật (M17/Q11) */}
                <button
                  type="button"
                  onClick={() => ngheThuAmThanh(a.ma, cd.amLuong || 60)}
                  aria-label={`Nghe thử: ${a.ten}`}
                  className="rounded-8 p-1.5 text-content-nav hover:bg-surface-sunken"
                >
                  <Icon ten="loa" size={18} />
                </button>
                <CongTac
                  bat={cd.tung[a.ma]}
                  nhan={a.ten}
                  khoa={!cd.bat}
                  onDoi={(bat) => batTung(a.ma, bat)}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
