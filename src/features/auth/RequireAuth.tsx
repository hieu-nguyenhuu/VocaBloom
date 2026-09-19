import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { supabase } from '../../lib/supabase.ts'

type TrangThai = 'dang_kiem' | 'co' | 'khong'

/**
 * Cổng bảo vệ mọi route đọc DB (RLS từ M1 chặn toàn bộ nếu chưa đăng nhập — MB-10).
 * Lúc chưa biết có session hay không thì render null để không nhấp nháy về màn login.
 * Session hết hạn / refresh thất bại → supabase-js phát SIGNED_OUT → tự về /dang-nhap.
 */
export default function RequireAuth() {
  const [tt, setTt] = useState<TrangThai>('dang_kiem')
  const location = useLocation()

  useEffect(() => {
    let song = true
    supabase.auth.getSession().then(({ data }) => {
      if (song) setTt(data.session ? 'co' : 'khong')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_suKien, session) => {
      setTt(session ? 'co' : 'khong')
    })
    return () => {
      song = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (tt === 'dang_kiem') return null
  if (tt === 'khong') {
    return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
