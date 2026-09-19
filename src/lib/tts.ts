import { docCaiDat, type CaiDat } from './settings.ts'
import { supabase } from './supabase.ts'
import {
  base64ThanhBytes,
  bodyTTS,
  docKetQuaTTS,
  gomTuCanGen,
  type DongVocab,
  type MaNgonNgu,
} from './ttsCore.ts'

/**
 * Phát âm 1 từ (M4a — phần tối thiểu của tts.ts; M6 bổ sung gen Google TTS + cache Storage).
 * Ưu tiên `audio_url` đã cache (DEC-15); chưa có thì Web Speech API (systemPatterns.md §1).
 * Luôn huỷ âm đang phát trước — bấm loa liên tiếp không chồng tiếng.
 */
let dangPhat: HTMLAudioElement | null = null

export function phatAm(text: string, lang: 'zh' | 'en', audio_url?: string | null): void {
  dangPhat?.pause()
  dangPhat = null
  window.speechSynthesis?.cancel()

  if (audio_url) {
    dangPhat = new Audio(audio_url)
    void dangPhat.play().catch(() => {
      /* autoplay bị chặn → người dùng bấm loa để phát lại */
    })
    return
  }
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

// ── M6c: sinh audio bằng Google TTS rồi cache vào Supabase Storage (§9, DEC-15) ──────────────
// Khoá đọc RUNTIME từ bảng `settings` (MB-04) — KHÔNG bao giờ đặt `VITE_GOOGLE_TTS_*`, vì Vite
// sẽ nhúng thẳng vào `dist/assets/*.js`. Kiểm thật 2026-09-18: Google cho phép CORS từ browser.

const URL_TTS = 'https://texttospeech.googleapis.com/v1/text:synthesize'
const BUCKET = 'audio'

export async function layCauHinhTTS(): Promise<{ khoa: string; cd: CaiDat } | null> {
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) return null
  const cd = docCaiDat((data ?? []) as { key: string; value: unknown }[])
  return cd.google_tts_api_key ? { khoa: cd.google_tts_api_key, cd } : null
}

async function goiGoogle(text: string, voice: string, languageCode: MaNgonNgu, khoa: string): Promise<Uint8Array> {
  const r = await fetch(`${URL_TTS}?key=${encodeURIComponent(khoa)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bodyTTS(text, voice, languageCode),
  })
  const kq = docKetQuaTTS(await r.json())
  if ('loi' in kq) throw new Error(kq.loi)
  return base64ThanhBytes(kq.base64)
}

/** Nghe thử giọng ở màn Cài đặt (§9 "nghe thử trước khi chọn"). Phát blob, không lưu Storage. */
export async function nghegiongThu(voice: string, languageCode: MaNgonNgu, khoa: string): Promise<void> {
  const bytes = await goiGoogle(
    languageCode === 'cmn-CN' ? '你好，这是试听。' : 'Hello, this is a voice preview.',
    voice,
    languageCode,
    khoa,
  )
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'audio/mpeg' }))
  dangPhat?.pause()
  window.speechSynthesis?.cancel()
  dangPhat = new Audio(url)
  dangPhat.onended = () => URL.revokeObjectURL(url)
  await dangPhat.play()
}

export async function demTuThieuAudio(): Promise<number> {
  const { count } = await supabase.from('vocab').select('id', { count: 'exact', head: true }).is('audio_url', null)
  return count ?? 0
}

export type KetQuaGen = { xong: number; tong: number; loi: string[] }

/**
 * Sinh audio cho mọi từ chưa có `audio_url`. Chạy TUẦN TỰ: tránh chạm rate-limit và để tiến độ
 * đọc được. Lỗi 1 từ KHÔNG dừng cả mẻ — gom vào `loi[]` rồi báo ở cuối.
 */
export async function genAudioChoTu(onTienDo?: (da: number, tong: number) => void): Promise<KetQuaGen> {
  const c = await layCauHinhTTS()
  if (!c) return { xong: 0, tong: 0, loi: ['Chưa nhập khoá Google TTS ở màn Cài đặt'] }

  const { data, error } = await supabase.from('vocab').select('id, word, lang, audio_url').is('audio_url', null)
  if (error) return { xong: 0, tong: 0, loi: [error.message] }

  const nhom = gomTuCanGen((data ?? []) as DongVocab[], c.cd)
  const loi: string[] = []
  let xong = 0
  onTienDo?.(0, nhom.length)

  for (const n of nhom) {
    try {
      const bytes = await goiGoogle(n.word, n.voice, n.languageCode, c.khoa)
      const up = await supabase.storage
        .from(BUCKET)
        .upload(n.duong_dan, new Blob([bytes as BlobPart], { type: 'audio/mpeg' }), {
          contentType: 'audio/mpeg',
          upsert: true,
        })
      if (up.error) throw up.error
      const url = supabase.storage.from(BUCKET).getPublicUrl(n.duong_dan).data.publicUrl
      const { error: e2 } = await supabase.from('vocab').update({ audio_url: url }).in('id', n.ids)
      if (e2) throw e2
      xong += 1
    } catch (e) {
      loi.push(`${n.word}: ${e instanceof Error ? e.message : String(e)}`)
    }
    onTienDo?.(xong + loi.length, nhom.length)
  }
  return { xong, tong: nhom.length, loi }
}
