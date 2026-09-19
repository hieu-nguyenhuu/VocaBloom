/**
 * Test cho settings.ts — 5 key cấu hình (SPECIFICATION §11, DEC-17).
 * Ca quan trọng nhất: `value` là jsonb, sai kiểu phải rơi về mặc định — nếu "5" (chuỗi) chui xuống
 * `run_daily_maintenance()` thì cron nhỏ giọt từ mới so sánh hỏng.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { anKhoa, chinhSoTuMoi, docCaiDat, MAC_DINH } from './settings.ts'

describe('docCaiDat', () => {
  it('đủ 7 key → đọc đúng kiểu', () => {
    expect(
      docCaiDat([
        { key: 'openrouter_api_key', value: 'sk-abc' },
        { key: 'openrouter_model', value: 'a/b' },
        { key: 'google_tts_api_key', value: 'AIza-xyz' },
        { key: 'new_words_per_day', value: 7 },
        { key: 'tts_voice', value: 'cmn-CN-Wavenet-C' },
        { key: 'tts_voice_en', value: 'en-US-Neural2-D' },
        { key: 'low_queue_alert_enabled', value: false },
      ]),
    ).toEqual({
      openrouter_api_key: 'sk-abc',
      openrouter_model: 'a/b',
      google_tts_api_key: 'AIza-xyz',
      new_words_per_day: 7,
      tts_voice: 'cmn-CN-Wavenet-C',
      tts_voice_en: 'en-US-Neural2-D',
      low_queue_alert_enabled: false,
    })
  })

  it('giọng mặc định KHÔNG phải cmn-CN-Neural2 (Google không có giọng đó)', () => {
    expect(MAC_DINH.tts_voice).toBe('cmn-CN-Wavenet-A')
    expect(MAC_DINH.tts_voice_en).toBe('en-US-Neural2-C')
  })
  it('thiếu key → lấy mặc định §11', () => {
    expect(docCaiDat([])).toEqual(MAC_DINH)
  })
  it('sai kiểu (số/boolean lưu thành chuỗi) → mặc định', () => {
    expect(docCaiDat([{ key: 'new_words_per_day', value: '7' }]).new_words_per_day).toBe(5)
    expect(docCaiDat([{ key: 'low_queue_alert_enabled', value: 'true' }]).low_queue_alert_enabled).toBe(true)
  })
  it('key lạ → bỏ qua', () => {
    expect(docCaiDat([{ key: 'linh_tinh', value: 1 }])).toEqual(MAC_DINH)
  })
})

describe('anKhoa', () => {
  it('khoá dài → sk-•••• + 4 ký tự cuối (mockup 17)', () => {
    expect(anKhoa('sk-or-v1-abcdef3f2a')).toBe('sk-••••3f2a')
  })
  it('khoá ngắn (<4) → chỉ dấu chấm', () => {
    expect(anKhoa('abc')).toBe('sk-••••')
  })
  it('null / rỗng → "Chưa nhập"', () => {
    expect(anKhoa(null)).toBe('Chưa nhập')
    expect(anKhoa('')).toBe('Chưa nhập')
  })
})

describe('chinhSoTuMoi', () => {
  it('kẹp trong 1..50', () => {
    expect([chinhSoTuMoi(5, 1), chinhSoTuMoi(1, -1), chinhSoTuMoi(50, 1)]).toEqual([6, 1, 50])
  })
})

describe('X-settings — giữ tính thuần', () => {
  it('settings.ts không import react / supabase / node:', () => {
    expect(readFileSync('src/lib/settings.ts', 'utf8')).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
