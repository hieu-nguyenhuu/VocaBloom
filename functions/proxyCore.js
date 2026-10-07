// M29 — phần THUẦN của Cloud Function `vocabloom` (design.m29.md §2.3). Không I/O ⇒ test bằng node:test.

/** Chỉ 3 gốc này được chuyển tiếp — function KHÔNG phải proxy mở. */
const GOC_CO_DINH = { or: 'https://openrouter.ai/api/v1', tts: 'https://texttospeech.googleapis.com' }

/** Bỏ tiền tố `/vocabloom` nếu có ⇒ chạy được ở cả cloudfunctions.net/vocabloom/ lẫn run.app/vocabloom/ (§2.1). */
export function boTienTo(url) {
  const r = url.replace(/^\/vocabloom(?=[/?]|$)/, '')
  return r.startsWith('/') ? r : `/${r}`
}

/** @returns {{loai:'proxy',dich:string}|{loai:'tinh',file:string}|{loai:'khong'}|{loai:'thieu_cau_hinh'}} */
export function phanLoai(url, gocSupabase) {
  const m = /^\/(sb|or|tts)(?=[/?]|$)(.*)$/.exec(url)
  if (m) {
    const goc = m[1] === 'sb' ? gocSupabase.replace(/\/+$/, '') : GOC_CO_DINH[m[1]]
    return goc ? { loai: 'proxy', dich: goc + m[2] } : { loai: 'thieu_cau_hinh' }
  }
  let duong
  try {
    duong = decodeURIComponent(url.split('?')[0])
  } catch {
    return { loai: 'khong' }
  }
  if (duong.split('/').includes('..')) return { loai: 'khong' }
  return { loai: 'tinh', file: duong === '/' ? 'index.html' : duong.slice(1) }
}

const BO_GUI = new Set([
  'host', 'connection', 'keep-alive', 'content-length', 'transfer-encoding', 'te', 'trailer', 'upgrade',
  'proxy-authorization', 'proxy-connection', 'accept-encoding', 'cookie', 'forwarded', 'traceparent',
])
const BO_TIEN_TO_GUI = ['x-forwarded-', 'x-cloud-', 'x-appengine-', 'function-']

/** Header từ trình duyệt → máy đích. `accept-encoding` bỏ để fetch Node tự thương lượng nén. */
export function headerGui(h) {
  const ra = {}
  for (const [k, v] of Object.entries(h)) {
    const t = k.toLowerCase()
    if (v === undefined || BO_GUI.has(t) || BO_TIEN_TO_GUI.some((p) => t.startsWith(p))) continue
    ra[t] = Array.isArray(v) ? v.join(', ') : v
  }
  return ra
}

const BO_TRA = new Set([
  'content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive',
  'set-cookie', 'alt-svc', 'nel', 'report-to',
])

/** Header máy đích → trình duyệt. fetch Node ĐÃ giải nén body ⇒ giữ content-encoding là trình duyệt giải nén lần 2 và hỏng. */
export function headerTra(headers) {
  const ra = {}
  for (const [k, v] of headers) if (!BO_TRA.has(k)) ra[k] = v
  return ra
}

/** File trong assets/ có hash trong tên ⇒ cache vĩnh viễn; index.html phải luôn hỏi lại để thấy bản deploy mới. */
export function cacheTinh(file) {
  return file.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
}
