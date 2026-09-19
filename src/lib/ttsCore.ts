/**
 * Logic thuần của TTS (M6c). Không React, không Supabase, không fetch — `tts.ts` lo phần I/O.
 *
 * ⚠️ SỬA LỖI TÀI LIỆU (kiểm thật 2026-09-18): Google **không có** giọng `cmn-CN-Neural2-*`
 * (`SPECIFICATION.md` §9/§11 ghi sai). Tiếng Trung chỉ có Standard / Wavenet / Chirp3-HD ⇒ chốt
 * Wavenet A..D, trùng chữ cái nên lựa chọn cũ của người dùng (`-C`) được giữ nguyên.
 */

export const GIONG_ZH = [
  'cmn-CN-Wavenet-A',
  'cmn-CN-Wavenet-B',
  'cmn-CN-Wavenet-C',
  'cmn-CN-Wavenet-D',
] as const

export const GIONG_EN = [
  'en-US-Neural2-C',
  'en-US-Neural2-F',
  'en-US-Neural2-D',
  'en-US-Neural2-J',
] as const

/** Nhãn cho `select` ở màn Cài đặt — giới tính lấy từ `voices` API của Google. */
export const NHAN_GIONG: Record<string, string> = {
  'cmn-CN-Wavenet-A': 'Wavenet-A (nữ)',
  'cmn-CN-Wavenet-B': 'Wavenet-B (nam)',
  'cmn-CN-Wavenet-C': 'Wavenet-C (nam)',
  'cmn-CN-Wavenet-D': 'Wavenet-D (nữ)',
  'en-US-Neural2-C': 'Neural2-C (nữ)',
  'en-US-Neural2-F': 'Neural2-F (nữ)',
  'en-US-Neural2-D': 'Neural2-D (nam)',
  'en-US-Neural2-J': 'Neural2-J (nam)',
}

export type CauHinhGiong = { tts_voice: string; tts_voice_en: string }
export type MaNgonNgu = 'cmn-CN' | 'en-US'

export function giongCua(lang: 'zh' | 'en', cd: CauHinhGiong): { voice: string; languageCode: MaNgonNgu } {
  return lang === 'zh'
    ? { voice: cd.tts_voice, languageCode: 'cmn-CN' }
    : { voice: cd.tts_voice_en, languageCode: 'en-US' }
}

/** FNV-1a 32-bit → 8 ký tự hex. Thuần + ĐỒNG BỘ (Web Crypto là async nên không dùng được ở đây). */
export function bamChuoi(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

/**
 * Tên file gồm cả GIỌNG: đổi giọng thì ra file khác (không phát nhầm giọng cũ), còn 2 dòng `vocab`
 * cùng chữ (vd "晴天" ở 2 topic) thì dùng CHUNG 1 file ⇒ chỉ tốn 1 lời gọi API.
 */
export function duongDanAudio(word: string, lang: 'zh' | 'en', voice: string): string {
  return `${lang}/${voice}/${bamChuoi(`${word}\u0000${lang}\u0000${voice}`)}.mp3`
}

/** `speakingRate: 0.9` khớp tốc độ Web Speech ở `phatAm()` để 2 nguồn âm nghe đồng nhất. */
export function bodyTTS(text: string, voice: string, languageCode: MaNgonNgu): string {
  return JSON.stringify({
    input: { text },
    voice: { languageCode, name: voice },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9 },
  })
}

export function docKetQuaTTS(json: unknown): { base64: string } | { loi: string } {
  const o = json as { audioContent?: unknown; error?: { message?: unknown } } | null
  if (typeof o?.audioContent === 'string' && o.audioContent !== '') return { base64: o.audioContent }
  const m = o?.error?.message
  return { loi: typeof m === 'string' && m !== '' ? m : 'Google TTS trả dữ liệu lạ' }
}

export function base64ThanhBytes(b64: string): Uint8Array {
  const s = atob(b64)
  const u = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i)
  return u
}

export type DongVocab = { id: string; word: string; lang: 'zh' | 'en'; audio_url: string | null }
export type NhomGen = {
  word: string
  lang: 'zh' | 'en'
  voice: string
  languageCode: MaNgonNgu
  duong_dan: string
  ids: string[]
}

/**
 * Gom các dòng `vocab` chưa có audio theo (word, lang) — đây là chỗ tiết kiệm tiền: 2 dòng "晴天"
 * ở 2 topic chỉ gọi Google 1 lần rồi ghi `audio_url` cho CẢ HAI id.
 */
export function gomTuCanGen(rows: readonly DongVocab[], cd: CauHinhGiong): NhomGen[] {
  const m = new Map<string, NhomGen>()
  for (const r of rows) {
    if (r.audio_url) continue
    const khoa = `${r.word}\u0000${r.lang}`
    const cu = m.get(khoa)
    if (cu) {
      cu.ids.push(r.id)
      continue
    }
    const { voice, languageCode } = giongCua(r.lang, cd)
    m.set(khoa, {
      word: r.word,
      lang: r.lang,
      voice,
      languageCode,
      duong_dan: duongDanAudio(r.word, r.lang, voice),
      ids: [r.id],
    })
  }
  return [...m.values()]
}
