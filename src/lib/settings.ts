/**
 * Cấu hình app — 7 key dạng key-value (SPECIFICATION §11, DEC-17 + 2 key TTS thêm ở M6c). Single-user nên không cần bảng
 * cấu hình phức tạp. File này THUẦN: không đọc DB, `CaiDatPage` truyền `rows` vào.
 *
 * ⚠️ `settings.value` là **jsonb** ⇒ phải ghi đúng KIỂU JSON (số, boolean, chuỗi). Nếu lưu `"5"`
 * thay vì `5`, hàm SQL `run_daily_maintenance()` so sánh số sẽ hỏng và cron ngừng nhỏ giọt từ mới.
 * Vì vậy `docCaiDat` chỉ nhận đúng kiểu, sai kiểu thì rơi về mặc định thay vì ép kiểu ngầm.
 */

export type CaiDat = {
  openrouter_api_key: string | null
  openrouter_model: string | null
  google_tts_api_key: string | null
  new_words_per_day: number
  /** Số từ tối đa mỗi LƯỢT ôn (M11/Q1) — khác `new_words_per_day` (số từ MỚI kích hoạt/ngày). */
  max_tu_moi_luot: number
  tts_voice: string
  tts_voice_en: string
  low_queue_alert_enabled: boolean
}

// Danh sách giọng nằm ở `ttsCore.ts` (GIONG_ZH / GIONG_EN) — Google KHÔNG có `cmn-CN-Neural2-*`,
// xem ghi chú ở đầu file đó.

export const MAC_DINH: CaiDat = {
  openrouter_api_key: null,
  openrouter_model: null,
  google_tts_api_key: null,
  new_words_per_day: 5,
  max_tu_moi_luot: 10,
  tts_voice: 'cmn-CN-Wavenet-A',
  tts_voice_en: 'en-US-Neural2-C',
  low_queue_alert_enabled: true,
}

export const MIN_TU_MOI = 1
export const MAX_TU_MOI = 50
export const MIN_LUOT = 2
export const MAX_LUOT = 20

/** Kẹp số từ mỗi lượt trong 2..20 (người dùng chốt 20/09) — ngoài dải này thì lượt ôn mất ý nghĩa. */
export function chinhGioiHanLuot(hienTai: number, delta: number): number {
  return Math.min(MAX_LUOT, Math.max(MIN_LUOT, hienTai + delta))
}

export function docCaiDat(rows: { key: string; value: unknown }[]): CaiDat {
  const m = new Map(rows.map((r) => [r.key, r.value]))
  const chuoi = (k: string): string | null => {
    const v = m.get(k)
    return typeof v === 'string' && v !== '' ? v : null
  }
  const so = m.get('new_words_per_day')
  const gioiHan = m.get('max_tu_moi_luot')
  const bat = m.get('low_queue_alert_enabled')
  return {
    openrouter_api_key: chuoi('openrouter_api_key') ?? MAC_DINH.openrouter_api_key,
    openrouter_model: chuoi('openrouter_model') ?? MAC_DINH.openrouter_model,
    google_tts_api_key: chuoi('google_tts_api_key') ?? MAC_DINH.google_tts_api_key,
    new_words_per_day: typeof so === 'number' ? so : MAC_DINH.new_words_per_day,
    max_tu_moi_luot: typeof gioiHan === 'number' ? gioiHan : MAC_DINH.max_tu_moi_luot,
    tts_voice: chuoi('tts_voice') ?? MAC_DINH.tts_voice,
    tts_voice_en: chuoi('tts_voice_en') ?? MAC_DINH.tts_voice_en,
    low_queue_alert_enabled: typeof bat === 'boolean' ? bat : MAC_DINH.low_queue_alert_enabled,
  }
}

/**
 * Hiện khoá theo mockup 17: `sk-••••3f2a` — không bao giờ hiện đủ khoá lên màn hình.
 * `tienTo` để dùng lại cho khoá Google (`AIza-••••…`) mà không hiện nhầm tiền tố OpenRouter.
 */
export function anKhoa(khoa: string | null, tienTo = 'sk-'): string {
  if (!khoa) return 'Chưa nhập'
  return khoa.length >= 4 ? `${tienTo}••••${khoa.slice(-4)}` : `${tienTo}••••`
}

export function chinhSoTuMoi(hienTai: number, delta: number): number {
  return Math.min(MAX_TU_MOI, Math.max(MIN_TU_MOI, hienTai + delta))
}
