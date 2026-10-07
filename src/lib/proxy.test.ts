import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { audioQuaProxy, GOC_OPENROUTER, gocQuaProxy, urlClientSupabase, urlCongKhai } from './proxy.ts'

const SB = 'https://abc.supabase.co'
const MP3 = `${SB}/storage/v1/object/public/audio/zh/cmn-CN-Wavenet-A/k3j9.mp3`
const MP3_PROXY = '/vocabloom/sb/storage/v1/object/public/audio/zh/cmn-CN-Wavenet-A/k3j9.mp3'

describe('proxy.ts — M29 (design.m29.md §2.2)', () => {
  it('P1 bản Vercel (proxy rỗng) ⇒ gốc API giữ nguyên', () => {
    expect(gocQuaProxy('', 'or', GOC_OPENROUTER)).toBe('https://openrouter.ai/api/v1')
  })
  it('P2 bản Firebase ⇒ gốc API là đường dẫn cùng origin', () => {
    expect(gocQuaProxy('/vocabloom', 'or', GOC_OPENROUTER)).toBe('/vocabloom/or')
    expect(gocQuaProxy('/vocabloom', 'tts', 'x')).toBe('/vocabloom/tts')
  })
  it('P3 client Supabase bản Vercel dùng URL thật', () => {
    expect(urlClientSupabase('', 'https://h.example', SB)).toBe(SB)
  })
  it('P4 client Supabase bản Firebase là URL tuyệt đối tới /vocabloom/sb (supabase-js cần URL tuyệt đối)', () => {
    expect(urlClientSupabase('/vocabloom', 'https://h.example', SB)).toBe('https://h.example/vocabloom/sb')
  })
  it('P5 phát mp3 bản Vercel ⇒ URL nguyên vẹn', () => {
    expect(audioQuaProxy(MP3, '', SB)).toBe(MP3)
  })
  it('P6 phát mp3 bản Firebase ⇒ đổi gốc supabase.co sang /vocabloom/sb', () => {
    expect(audioQuaProxy(MP3, '/vocabloom', SB)).toBe(MP3_PROXY)
    expect(audioQuaProxy(MP3, '/vocabloom', `${SB}/`)).toBe(MP3_PROXY)
  })
  it('P7 URL không thuộc Supabase của app ⇒ không đụng', () => {
    const la = 'https://khac.supabase.co/storage/v1/object/public/audio/a.mp3'
    expect(audioQuaProxy(la, '/vocabloom', SB)).toBe(la)
    expect(audioQuaProxy(`${SB}x/a.mp3`, '/vocabloom', SB)).toBe(`${SB}x/a.mp3`)
  })
  it('P8 urlCongKhai khớp đúng getPublicUrl của supabase-js (DB luôn lưu URL GỐC)', () => {
    const that = createClient(SB, 'k', { auth: { persistSession: false } })
      .storage.from('audio')
      .getPublicUrl('zh/cmn-CN-Wavenet-A/k3j9.mp3').data.publicUrl
    expect(urlCongKhai(SB, 'audio', 'zh/cmn-CN-Wavenet-A/k3j9.mp3')).toBe(that)
  })
})
