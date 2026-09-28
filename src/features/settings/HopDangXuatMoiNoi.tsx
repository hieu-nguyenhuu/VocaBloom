import { useEffect, useRef, useState, type FormEvent } from 'react'
import { dichLoiXacMinh, kiemTraMatKhau } from '../../lib/auth.ts'
import { supabase } from '../../lib/supabase.ts'
import { batDauDangXuat } from '../auth/dangXuat.ts'

/**
 * M19/C2 — đăng xuất MỌI thiết bị, bắt nhập lại mật khẩu. Supabase không có API "kiểm tra mật khẩu"
 * ⇒ xác minh bằng signInWithPassword (sai thì phiên hiện tại KHÔNG bị ảnh hưởng), đúng thì
 * signOut({ scope: 'global' }) thu hồi mọi refresh token.
 * ⚠️ `global` KHÔNG giết access token đã cấp: máy khác còn dùng được tới khi token hết hạn —
 * project đang đặt `jwt_exp = 3600` (đọc 2026-09-28) ⇒ câu "chậm nhất 60 phút" phải khớp số này.
 * auth-js (GoTrueClient._signOut) luôn xoá phiên CỤC BỘ kể cả khi lỗi mạng ⇒ lỗi ở bước global
 * nghĩa là "máy này đã thoát, máy khác CHƯA" — báo thật qua `onXong('loi_thu_hoi')`.
 */
const PHUT_HET_HAN_PHIEN = 60

const LOP_INPUT =
  'rounded-8 border border-border-card bg-surface-card px-3 py-[9px] text-14 text-content-primary focus:border-accent focus:outline-none disabled:opacity-60'

type Props = { email: string; onDong: () => void; onXong: (kq: 'ok' | 'loi_thu_hoi') => void }

export default function HopDangXuatMoiNoi({ email, onDong, onXong }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const oNhap = useRef<HTMLInputElement>(null)
  const [matKhau, setMatKhau] = useState('')
  const [loi, setLoi] = useState<string | null>(null)
  const [dangChay, setDangChay] = useState(false)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  async function gui(e: FormEvent) {
    e.preventDefault()
    if (dangChay) return
    const kq = kiemTraMatKhau(matKhau)
    if (!kq.ok) {
      setLoi(kq.loi)
      oNhap.current?.focus()
      return
    }
    setLoi(null)
    setDangChay(true)
    const xacMinh = await supabase.auth.signInWithPassword({ email, password: matKhau })
    if (xacMinh.error) {
      setDangChay(false)
      setMatKhau('')
      setLoi(dichLoiXacMinh(xacMinh.error))
      // ô đang disabled trong lúc chạy ⇒ đợi frame sau (đã bật lại) mới focus được
      requestAnimationFrame(() => oNhap.current?.focus())
      return
    }
    batDauDangXuat() // chỉ bật SAU khi mật khẩu đúng — sai mật khẩu thì phiên còn nguyên
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    onXong(error ? 'loi_thu_hoi' : 'ok')
  }

  return (
    <dialog
      ref={ref}
      onClose={onDong}
      onCancel={(e) => dangChay && e.preventDefault()}
      onClick={(e) => e.target === ref.current && !dangChay && ref.current?.close()}
      className="m-auto w-[min(420px,calc(100vw-32px))] rounded-20 bg-surface-raised p-0 backdrop:bg-[rgb(36_27_58_/_0.35)]"
    >
      <form onSubmit={gui} noValidate className="flex flex-col gap-3 p-6">
        <h2 className="font-display text-18 font-bold text-content-primary">Đăng xuất khỏi mọi thiết bị</h2>
        <p className="text-14 text-content-nav">
          Mọi thiết bị đang đăng nhập, kể cả máy này, sẽ bị đăng xuất. Máy khác tự thoát chậm nhất sau
          khoảng {PHUT_HET_HAN_PHIEN} phút.
        </p>
        <label className="flex flex-col gap-1">
          <span className="text-12 font-semibold text-content-muted">Mật khẩu</span>
          <input
            ref={oNhap}
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            value={matKhau}
            disabled={dangChay}
            onChange={(e) => setMatKhau(e.target.value)}
            aria-invalid={loi ? true : undefined}
            className={LOP_INPUT}
          />
        </label>
        {loi && (
          <p role="alert" className="text-13 text-danger-text">
            {loi}
          </p>
        )}
        <div className="mt-2 flex gap-2.5">
          <button
            type="button"
            disabled={dangChay}
            onClick={() => ref.current?.close()}
            className="flex-1 rounded-12 bg-border-card py-3 text-14 font-semibold text-content-nav disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={dangChay}
            className="flex-1 rounded-12 bg-danger py-3 text-14 font-semibold text-white disabled:opacity-60"
          >
            {dangChay ? 'Đang đăng xuất…' : 'Đăng xuất tất cả'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
