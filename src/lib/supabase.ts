import { createClient } from '@supabase/supabase-js'
import { urlClientSupabase } from './proxy.ts'

/**
 * Client Supabase DUY NHẤT của app (systemPatterns.md §2).
 * Không tạo client thứ hai ở bất kỳ đâu — nhiều instance sẽ tranh nhau phiên
 * đăng nhập lưu trong localStorage.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong .env.local.\n' +
      'Lấy 2 giá trị này ở Supabase Dashboard → Project Settings → API.',
  )
}

// M29: bản Firebase trỏ client vào proxy cùng origin; `globalThis.location` vắng khi file bị import trong test Node.
export const supabase = createClient(
  urlClientSupabase(import.meta.env.VITE_PROXY ?? '', globalThis.location?.origin ?? '', url),
  anonKey,
)
