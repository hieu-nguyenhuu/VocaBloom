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
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
