/**
 * M29 — đổi URL khi app chạy sau Cloud Function `vocabloom` (build `--mode firebase`, design.m29.md §2.2).
 * `proxy` RỖNG (bản Vercel) ⇒ mọi hàm trả NGUYÊN URL gốc — bản Vercel không đổi hành vi.
 * File thuần, không đọc `import.meta.env`: nơi gọi tự truyền vào cho dễ test.
 */
export const GOC_OPENROUTER = 'https://openrouter.ai/api/v1'
export const GOC_TTS = 'https://texttospeech.googleapis.com'

const boCheo = (s: string) => s.replace(/\/+$/, '')

/** Gốc API: Vercel ⇒ `goc`; Firebase ⇒ `/vocabloom/<nhanh>` (cùng origin, không CORS). */
export function gocQuaProxy(proxy: string, nhanh: 'or' | 'tts', goc: string): string {
  return proxy ? `${proxy}/${nhanh}` : goc
}

/** supabase-js đòi URL tuyệt đối (`new URL`) ⇒ ghép với origin trang đang mở. */
export function urlClientSupabase(proxy: string, origin: string, supabaseUrl: string): string {
  return proxy ? `${origin}${proxy}/sb` : supabaseUrl
}

/** `audio_url` trong DB là URL supabase.co GỐC — chỉ đổi lúc PHÁT. */
export function audioQuaProxy(url: string, proxy: string, supabaseUrl: string): string {
  const goc = boCheo(supabaseUrl)
  return proxy && url.startsWith(`${goc}/`) ? `${proxy}/sb${url.slice(goc.length)}` : url
}

/** URL công khai trên Storage, ghép từ URL GỐC: client bản Firebase trỏ vào proxy nên không dùng `getPublicUrl`. */
export function urlCongKhai(supabaseUrl: string, bucket: string, duongDan: string): string {
  return `${boCheo(supabaseUrl)}/storage/v1/object/public/${bucket}/${duongDan}`
}
