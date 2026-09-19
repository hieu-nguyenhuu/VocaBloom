/// <reference types="vite/client" />

/**
 * CHỈ 2 biến này được phép mang prefix VITE_ — Vite ship thẳng mọi biến VITE_*
 * ra bundle browser. OPENROUTER_API_KEY / GOOGLE_TTS_API_KEY / SUPABASE_ACCESS_TOKEN
 * TUYỆT ĐỐI không được gắn prefix này (systemPatterns.md §8).
 *
 * Khoá OpenRouter đọc runtime từ bảng `settings`, không nhúng vào build (MB-04).
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string

  /**
   * ⚠️ NGOẠI LỆ TẠM THỜI (M5, 2026-09-17) — khoá OpenRouter đọc từ env cho tiện khi chạy local.
   * Vite NHÚNG mọi biến VITE_* vào dist/assets/*.js ⇒ ai mở URL cũng đọc được khoá, KỂ CẢ CHƯA
   * ĐĂNG NHẬP. TRƯỚC KHI DEPLOY CÔNG KHAI: xoá 2 biến này khỏi .env.local và nhập khoá ở màn
   * Cài đặt (M6) —  đọc bảng  TRƯỚC nên tự chuyển nguồn, không phải sửa code.
   */
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_OPENROUTER_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
