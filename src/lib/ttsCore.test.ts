import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  base64ThanhBytes,
  bamChuoi,
  bodyTTS,
  docKetQuaTTS,
  duongDanAudio,
  GIONG_EN,
  GIONG_ZH,
  giongCua,
  gomTuCanGen,
  NHAN_GIONG,
  type DongVocab,
} from './ttsCore.ts'

const CD = { tts_voice: 'cmn-CN-Wavenet-C', tts_voice_en: 'en-US-Neural2-C' }

describe('danh sách giọng', () => {
  it('KHÔNG còn giọng cmn-CN-Neural2 (Google không có — kiểm thật 2026-09-18)', () => {
    expect([...GIONG_ZH, ...GIONG_EN].some((g) => g.includes('cmn-CN-Neural2'))).toBe(false)
  })

  it('4 giọng Trung là Wavenet A..D, 4 giọng Anh là Neural2', () => {
    expect(GIONG_ZH).toEqual(['cmn-CN-Wavenet-A', 'cmn-CN-Wavenet-B', 'cmn-CN-Wavenet-C', 'cmn-CN-Wavenet-D'])
    expect(GIONG_EN.every((g) => g.startsWith('en-US-Neural2-'))).toBe(true)
  })

  it('mọi giọng đều có nhãn hiển thị', () => {
    for (const g of [...GIONG_ZH, ...GIONG_EN]) expect(NHAN_GIONG[g]).toBeTruthy()
  })
})

describe('giongCua', () => {
  it('zh dùng tts_voice + languageCode cmn-CN', () => {
    expect(giongCua('zh', CD)).toEqual({ voice: 'cmn-CN-Wavenet-C', languageCode: 'cmn-CN' })
  })

  it('en dùng tts_voice_en + languageCode en-US', () => {
    expect(giongCua('en', CD)).toEqual({ voice: 'en-US-Neural2-C', languageCode: 'en-US' })
  })
})

describe('bamChuoi & duongDanAudio', () => {
  it('hash ổn định, 8 ký tự hex', () => {
    expect(bamChuoi('苹果')).toMatch(/^[0-9a-f]{8}$/)
    expect(bamChuoi('苹果')).toBe(bamChuoi('苹果'))
    expect(bamChuoi('苹果')).not.toBe(bamChuoi('香蕉'))
  })

  it('cùng (word, lang, voice) → CÙNG đường dẫn (2 dòng 晴天 dùng chung 1 file)', () => {
    expect(duongDanAudio('晴天', 'zh', 'cmn-CN-Wavenet-C')).toBe(duongDanAudio('晴天', 'zh', 'cmn-CN-Wavenet-C'))
  })

  it('đổi giọng → đường dẫn khác (không phát nhầm giọng cũ)', () => {
    expect(duongDanAudio('晴天', 'zh', 'cmn-CN-Wavenet-C')).not.toBe(duongDanAudio('晴天', 'zh', 'cmn-CN-Wavenet-A'))
  })

  it('đường dẫn dạng lang/voice/hash.mp3', () => {
    expect(duongDanAudio('teacher', 'en', 'en-US-Neural2-C')).toMatch(/^en\/en-US-Neural2-C\/[0-9a-f]{8}\.mp3$/)
  })
})

describe('bodyTTS', () => {
  it('đúng schema Google, speakingRate 0.9 trùng phatAm()', () => {
    expect(JSON.parse(bodyTTS('苹果', 'cmn-CN-Wavenet-C', 'cmn-CN'))).toEqual({
      input: { text: '苹果' },
      voice: { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-C' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9 },
    })
  })
})

describe('docKetQuaTTS', () => {
  it('lấy được audioContent', () => {
    expect(docKetQuaTTS({ audioContent: 'QUJD' })).toEqual({ base64: 'QUJD' })
  })

  it('đọc đúng thông điệp lỗi của Google', () => {
    const j = { error: { code: 400, message: "Voice 'cmn-CN-Neural2-C' does not exist.", status: 'INVALID_ARGUMENT' } }
    expect(docKetQuaTTS(j)).toEqual({ loi: "Voice 'cmn-CN-Neural2-C' does not exist." })
  })

  it('audioContent rỗng / JSON lạ → lỗi, không trả base64 rỗng', () => {
    expect(docKetQuaTTS({ audioContent: '' })).toEqual({ loi: 'Google TTS trả dữ liệu lạ' })
    expect(docKetQuaTTS(null)).toEqual({ loi: 'Google TTS trả dữ liệu lạ' })
  })
})

describe('base64ThanhBytes', () => {
  it('giải mã đúng byte', () => {
    expect([...base64ThanhBytes('QUJD')]).toEqual([65, 66, 67])
  })

  it('giữ nguyên byte nhị phân > 127 (mp3 không bị hỏng)', () => {
    expect([...base64ThanhBytes('//4A')]).toEqual([255, 254, 0])
  })
})

describe('gomTuCanGen', () => {
  // Dữ liệu thật của DB (2026-09-19): 9 dòng vocab, trong đó "晴天" xuất hiện 2 lần ở 2 topic.
  const THAT: DongVocab[] = [
    { id: 'i1', word: '苹果', lang: 'zh', audio_url: null },
    { id: 'i2', word: '香蕉', lang: 'zh', audio_url: null },
    { id: 'i3', word: '橙子', lang: 'zh', audio_url: null },
    { id: 'i4', word: '葡萄', lang: 'zh', audio_url: null },
    { id: 'i5', word: '西瓜', lang: 'zh', audio_url: null },
    { id: 'i6', word: 'teacher', lang: 'en', audio_url: null },
    { id: 'i7', word: 'doctor', lang: 'en', audio_url: null },
    { id: 'i8', word: '晴天', lang: 'zh', audio_url: null },
    { id: 'i9', word: '晴天', lang: 'zh', audio_url: null },
  ]

  it('9 dòng → 8 nhóm; nhóm 晴天 gộp 2 id (chỉ tốn 1 lời gọi API)', () => {
    const n = gomTuCanGen(THAT, CD)
    expect(n).toHaveLength(8)
    expect(n.find((x) => x.word === '晴天')!.ids).toEqual(['i8', 'i9'])
  })

  it('bỏ qua từ đã có audio_url', () => {
    const n = gomTuCanGen([{ id: 'a', word: '苹果', lang: 'zh', audio_url: 'https://x/y.mp3' }], CD)
    expect(n).toEqual([])
  })

  it('cùng chữ nhưng KHÁC lang thì tách nhóm (giọng khác nhau)', () => {
    const n = gomTuCanGen(
      [
        { id: 'a', word: 'ok', lang: 'zh', audio_url: null },
        { id: 'b', word: 'ok', lang: 'en', audio_url: null },
      ],
      CD,
    )
    expect(n).toHaveLength(2)
    expect(n.map((x) => x.voice)).toEqual(['cmn-CN-Wavenet-C', 'en-US-Neural2-C'])
  })

  it('mỗi nhóm mang sẵn đường dẫn đích', () => {
    const n = gomTuCanGen([{ id: 'a', word: 'teacher', lang: 'en', audio_url: null }], CD)
    expect(n[0]!.duong_dan).toBe(duongDanAudio('teacher', 'en', 'en-US-Neural2-C'))
  })
})

describe('kỷ luật module', () => {
  it('ttsCore.ts là module thuần — không import react/supabase/node', () => {
    const src = readFileSync(new URL('./ttsCore.ts', import.meta.url), 'utf8')
    expect(src).not.toMatch(/from '(react|node:|@supabase)/)
    expect(src).not.toMatch(/\.\/supabase\.ts/)
  })
})
