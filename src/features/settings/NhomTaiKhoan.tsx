import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import HopXacNhan from '../../components/HopXacNhan.tsx'
import { supabase } from '../../lib/supabase.ts'
import { batDauDangXuat } from '../auth/dangXuat.ts'
import HopDangXuatMoiNoi from './HopDangXuatMoiNoi.tsx'
import { GIA_TRI, HANG, NHAN } from './kieu.ts'

/**
 * M19 — nhóm "Tài khoản" (KHÔNG có mockup; layout duyệt ở DESIGN.md §C0).
 * Email đọc từ phiên CỤC BỘ (getSession, 0 request). Điều hướng về /dang-nhap TƯỜNG MINH, không
 * kèm `from` ⇒ đăng nhập lại vào Dashboard chứ không quay về Cài đặt.
 * (react-router 8: `navigate` vẫn chạy dù RequireAuth đã gỡ màn này lúc nhận SIGNED_OUT.)
 * ⚠️ Phải `batDauDangXuat()` TRƯỚC signOut, nếu không `<Navigate>` của RequireAuth ghi đè state
 * `thongBao` (xem `auth/dangXuat.ts`).
 */
export default function NhomTaiKhoan() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)
  const [hoi, setHoi] = useState<'may_nay' | 'moi_noi' | null>(null)
  const [dangChay, setDangChay] = useState(false)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null))
  }, [])

  function veDangNhap(thongBao: string, loaiThongBao: 'tin' | 'loi' = 'tin') {
    navigate('/dang-nhap', { replace: true, state: { thongBao, loaiThongBao } })
  }

  async function dangXuatMayNay() {
    setDangChay(true)
    // `local` TƯỜNG MINH — mặc định supabase-js là `global` (đá luôn điện thoại). Lỗi mạng vẫn xoá
    // phiên cục bộ (GoTrueClient._signOut) ⇒ không cần xét `error`.
    batDauDangXuat()
    await supabase.auth.signOut({ scope: 'local' })
    veDangNhap('Đã đăng xuất khỏi thiết bị này.')
  }

  return (
    <>
      <div className={HANG}>
        <span className={NHAN}>Đang đăng nhập</span>
        <span className={`${GIA_TRI} min-w-0 truncate`}>{email ?? '—'}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setHoi('may_nay')}
          className="rounded-10 border border-border-card bg-surface-card px-4 py-2.5 text-14 font-semibold text-content-primary hover:bg-surface-sunken"
        >
          Đăng xuất
        </button>
        {email && (
          <button
            type="button"
            onClick={() => setHoi('moi_noi')}
            className="text-13 font-semibold text-content-muted hover:text-content-primary"
          >
            Đăng xuất khỏi mọi thiết bị ›
          </button>
        )}
      </div>

      {hoi === 'may_nay' && (
        <HopXacNhan
          tieuDe="Đăng xuất khỏi thiết bị này?"
          noiDung="Giao diện và âm thanh đã chọn trên máy này vẫn được giữ. Các thiết bị khác không bị ảnh hưởng."
          nhanXacNhan="Đăng xuất"
          nhanDangChay="Đang đăng xuất…"
          dangChay={dangChay}
          onDong={() => setHoi(null)}
          onXacNhan={() => void dangXuatMayNay()}
        />
      )}
      {hoi === 'moi_noi' && email && (
        <HopDangXuatMoiNoi
          email={email}
          onDong={() => setHoi(null)}
          onXong={(kq) =>
            kq === 'ok'
              ? veDangNhap('Đã đăng xuất khỏi mọi thiết bị.')
              : veDangNhap(
                  'Đã đăng xuất máy này nhưng CHƯA đăng xuất được các thiết bị khác (lỗi mạng). Đăng nhập lại rồi thử lại nhé.',
                  'loi',
                )
          }
        />
      )}
    </>
  )
}
