import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { dichLoiDangNhap, kiemTraFormDangNhap } from '../../lib/auth.ts'
import { supabase } from '../../lib/supabase.ts'

/**
 * Màn Đăng nhập — KHÔNG có mockup, layout Phương án A đã duyệt (DESIGN.md §1):
 * tái dùng modal "Sửa từ vựng" (màn 14) làm card, nút CTA của Dashboard/Player.
 * Chỉ 1 tài khoản (MB-10) ⇒ không có Đăng ký / Quên mật khẩu / Đăng xuất ở đây.
 */

const LOP_INPUT =
  'rounded-8 border border-border-card bg-surface-card px-3 py-[9px] text-14 text-content-primary focus:border-accent focus:outline-none'

export default function DangNhap() {
  const [email, setEmail] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [loi, setLoi] = useState<string | null>(null)
  const [dangGui, setDangGui] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const ve = (location.state as { from?: string } | null)?.from ?? '/'

  // Đã có session mà vẫn vào /dang-nhap → về thẳng app
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true })
    })
  }, [navigate])

  async function guiForm(e: FormEvent) {
    e.preventDefault()
    const kq = kiemTraFormDangNhap(email, matKhau)
    if (!kq.ok) {
      setLoi(kq.loi)
      return
    }
    setLoi(null)
    setDangGui(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: matKhau,
    })
    setDangGui(false)
    if (error) {
      setLoi(dichLoiDangNhap(error))
      return
    }
    navigate(ve, { replace: true })
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface-sidebar px-4 py-10">
      <form
        onSubmit={guiForm}
        noValidate
        className="flex w-full max-w-[480px] flex-col gap-4 rounded-20 bg-surface-raised p-7 shadow-[0_24px_60px_-12px_rgba(36,27,58,0.18)]"
      >
        <div className="text-center">
          <h1 className="font-display text-28 font-bold text-content-primary">VocaBloom</h1>
          <p className="mt-1 text-15 text-content-muted">Đăng nhập để tiếp tục ôn tập</p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-12 font-semibold text-content-muted">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={LOP_INPUT}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-12 font-semibold text-content-muted">Mật khẩu</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            className={LOP_INPUT}
          />
        </label>

        {loi && (
          <p role="alert" className="rounded-10 bg-danger-bg px-3 py-2 text-13 text-danger-text">
            {loi}
          </p>
        )}

        <button
          type="submit"
          disabled={dangGui}
          className="mt-2 rounded-14 bg-accent py-[17px] text-16 font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {dangGui ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  )
}
