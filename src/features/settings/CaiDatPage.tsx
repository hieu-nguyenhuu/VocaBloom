import { useEffect, useState, type ReactNode } from 'react'
import { anKhoa, chinhGioiHanLuot, chinhSoTuMoi, docCaiDat, type CaiDat } from '../../lib/settings.ts'
import { supabase } from '../../lib/supabase.ts'
import { demTuThieuAudio, genAudioChoTu, nghegiongThu, type KetQuaGen } from '../../lib/tts.ts'
import { GIONG_EN, GIONG_ZH, NHAN_GIONG, type MaNgonNgu } from '../../lib/ttsCore.ts'
import { Icon } from '../../components/icons.tsx'
import KhungTrang from '../shell/KhungTrang.tsx'

/**
 * Màn Cài đặt (mockup 17 PC / 18 Mobile · SPECIFICATION §11). Ghi NGAY khi đổi — mockup không có
 * nút Lưu, chỉ hiện "Đã lưu" thoáng qua.
 *
 * Khoá OpenRouter nhập ở đây được lưu vào bảng `settings`; `ai.ts` ưu tiên `settings` hơn biến môi
 * trường (MB-22/Q1) ⇒ sau khi nhập, có thể XOÁ `VITE_OPENROUTER_*` khỏi `.env.local` để khoá không
 * còn bị Vite nhúng vào bundle.
 */
const HANG =
  'flex items-center justify-between gap-3 rounded-10 border border-border-card bg-surface-card px-4 py-3'
const NHAN = 'text-14 text-content-nav'
const GIA_TRI = 'text-14 font-semibold text-content-primary'
const NUT_NHO = 'h-7 w-7 rounded-8 bg-border-card text-15 font-bold text-content-nav'

function Nhom({ ten, children }: { ten: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-12 font-bold uppercase tracking-[0.04em] text-content-muted">{ten}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  )
}

function HangGiong({
  nhan,
  giaTri,
  dsGiong,
  dangNghe,
  onDoi,
  onNghe,
}: {
  nhan: string
  giaTri: string
  dsGiong: readonly string[]
  dangNghe: boolean
  onDoi: (v: string) => void
  onNghe: () => void
}) {
  return (
    <div className={HANG}>
      <span className={NHAN}>{nhan}</span>
      <div className="flex items-center gap-2">
        <select
          value={giaTri}
          onChange={(e) => onDoi(e.target.value)}
          aria-label={nhan}
          className="bg-transparent text-14 font-semibold text-content-primary focus:outline-none"
        >
          {dsGiong.map((g) => (
            <option key={g} value={g}>
              {NHAN_GIONG[g] ?? g}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onNghe}
          disabled={dangNghe}
          aria-label={`Nghe thử ${nhan}`}
          className="rounded-8 p-1.5 text-content-nav hover:bg-surface-sunken disabled:opacity-50"
        >
          <Icon ten="loa" size={18} />
        </button>
      </div>
    </div>
  )
}

export default function CaiDatPage() {
  const [cd, setCd] = useState<CaiDat | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [daLuu, setDaLuu] = useState(false)
  const [nhapKhoa, setNhapKhoa] = useState('')
  const [nhapModel, setNhapModel] = useState('')
  const [nhapKhoaTts, setNhapKhoaTts] = useState('')
  const [dangNghe, setDangNghe] = useState<'zh' | 'en' | null>(null)
  const [soThieu, setSoThieu] = useState(0)
  const [tienDo, setTienDo] = useState<{ da: number; tong: number } | null>(null)
  const [ketQuaGen, setKetQuaGen] = useState<KetQuaGen | null>(null)

  useEffect(() => {
    void nap()
    void demTuThieuAudio().then(setSoThieu)
  }, [])

  async function nap() {
    const { data, error } = await supabase.from('settings').select('key, value')
    if (error) {
      setLoi(error.message)
      return
    }
    const moi = docCaiDat((data ?? []) as { key: string; value: unknown }[])
    setCd(moi)
    setNhapModel(moi.openrouter_model ?? '')
    setLoi(null)
  }

  async function ghi<K extends keyof CaiDat>(key: K, value: CaiDat[K]) {
    setCd((c) => (c ? { ...c, [key]: value } : c))
    const { error } = await supabase.from('settings').upsert({ key, value })
    if (error) {
      setLoi(error.message)
      return
    }
    setLoi(null)
    setDaLuu(true)
    setTimeout(() => setDaLuu(false), 1500)
  }

  async function ngheThu(lang: 'zh' | 'en') {
    const khoa = cd?.google_tts_api_key
    if (!khoa) return setLoi('Chưa nhập khoá Google TTS')
    const voice = lang === 'zh' ? cd.tts_voice : cd.tts_voice_en
    const ma: MaNgonNgu = lang === 'zh' ? 'cmn-CN' : 'en-US'
    setDangNghe(lang)
    try {
      await nghegiongThu(voice, ma, khoa)
      setLoi(null)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e))
    } finally {
      setDangNghe(null)
    }
  }

  async function taoAudio() {
    setKetQuaGen(null)
    setTienDo({ da: 0, tong: soThieu })
    const kq = await genAudioChoTu((da, tong) => setTienDo({ da, tong }))
    setTienDo(null)
    setKetQuaGen(kq)
    setSoThieu(await demTuThieuAudio())
  }

  function luuModel(giaTri: string) {
    const v = giaTri.trim() || null
    if (v !== (cd?.openrouter_model ?? null)) void ghi('openrouter_model', v)
  }

  if (!cd) {
    return (
      <KhungTrang rong={960}>
        <h1 className="mb-6 font-display text-22 font-bold text-content-primary md:text-24">Cài đặt</h1>
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-10 bg-surface-sunken" />
          ))}
        </div>
      </KhungTrang>
    )
  }

  return (
    <KhungTrang rong={960}>
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="font-display text-22 font-bold text-content-primary md:text-24">Cài đặt</h1>
        {daLuu && <span className="text-12 font-semibold text-success-text">Đã lưu</span>}
      </div>

      {loi && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-14 border border-danger bg-danger-bg px-4 py-3 text-13 text-danger-text">
          <span>Không lưu được: {loi}</span>
          <button type="button" onClick={() => void nap()} className="shrink-0 rounded-10 bg-accent px-3 py-1.5 text-13 font-semibold text-white">
            Thử lại
          </button>
        </div>
      )}

      <div className="flex flex-col gap-7 md:grid md:grid-cols-[1.2fr_1fr] md:items-start md:gap-8">
        <div className="flex flex-col gap-7">
          <Nhom ten="AI & OpenRouter">
            <div className={HANG}>
              <span className={NHAN}>API key</span>
              <span className={GIA_TRI}>{anKhoa(cd.openrouter_api_key)}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={nhapKhoa}
                onChange={(e) => setNhapKhoa(e.target.value)}
                placeholder="Dán khoá OpenRouter mới…"
                aria-label="Khoá OpenRouter"
                className="min-w-0 flex-1 rounded-10 border border-border-card bg-surface-card px-4 py-3 text-14 text-content-primary focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                disabled={!nhapKhoa.trim()}
                onClick={() => {
                  void ghi('openrouter_api_key', nhapKhoa.trim())
                  setNhapKhoa('')
                }}
                className="rounded-10 bg-accent px-4 py-3 text-14 font-semibold text-white disabled:opacity-60"
              >
                Lưu
              </button>
              {cd.openrouter_api_key && (
                <button
                  type="button"
                  onClick={() => void ghi('openrouter_api_key', null)}
                  className="rounded-10 bg-border-card px-4 py-3 text-14 font-semibold text-content-nav"
                >
                  Xoá
                </button>
              )}
            </div>
            <div className={HANG}>
              <span className={NHAN}>Model chấm điểm</span>
              <span className={GIA_TRI}>{cd.openrouter_model ?? 'Chưa chọn'}</span>
            </div>
            <div className="flex gap-2">
              <input
                value={nhapModel}
                onChange={(e) => setNhapModel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && luuModel(e.currentTarget.value)}
                placeholder="vd: deepseek/deepseek-v4-flash-0731"
                aria-label="Model OpenRouter"
                className="min-w-0 flex-1 rounded-10 border border-border-card bg-surface-card px-4 py-3 text-14 text-content-primary focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                disabled={nhapModel.trim() === (cd.openrouter_model ?? '')}
                onClick={() => luuModel(nhapModel)}
                className="rounded-10 bg-accent px-4 py-3 text-14 font-semibold text-white disabled:opacity-60"
              >
                Lưu
              </button>
            </div>
          </Nhom>

          <Nhom ten="Học tập">
            <div className={HANG}>
              <span className={NHAN}>Số từ mới/ngày</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Giảm" onClick={() => void ghi('new_words_per_day', chinhSoTuMoi(cd.new_words_per_day, -1))} className={NUT_NHO}>
                  −
                </button>
                <span className="min-w-6 text-center font-bold text-content-primary">{cd.new_words_per_day}</span>
                <button type="button" aria-label="Tăng" onClick={() => void ghi('new_words_per_day', chinhSoTuMoi(cd.new_words_per_day, 1))} className={NUT_NHO}>
                  +
                </button>
              </div>
            </div>
            <div className={HANG}>
              <span className={NHAN}>Số từ tối đa mỗi lượt ôn</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Giảm số từ mỗi lượt" onClick={() => void ghi('max_tu_moi_luot', chinhGioiHanLuot(cd.max_tu_moi_luot, -1))} className={NUT_NHO}>
                  −
                </button>
                <span className="min-w-6 text-center font-bold text-content-primary">{cd.max_tu_moi_luot}</span>
                <button type="button" aria-label="Tăng số từ mỗi lượt" onClick={() => void ghi('max_tu_moi_luot', chinhGioiHanLuot(cd.max_tu_moi_luot, 1))} className={NUT_NHO}>
                  +
                </button>
              </div>
            </div>
            <div className={HANG}>
              <span className={NHAN}>Khoá Google TTS</span>
              <span className={GIA_TRI}>{anKhoa(cd.google_tts_api_key, 'AIza-')}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={nhapKhoaTts}
                onChange={(e) => setNhapKhoaTts(e.target.value)}
                placeholder="Dán khoá Google Cloud TTS…"
                aria-label="Khoá Google TTS"
                className="min-w-0 flex-1 rounded-10 border border-border-card bg-surface-card px-4 py-3 text-14 text-content-primary focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                disabled={!nhapKhoaTts.trim()}
                onClick={() => {
                  void ghi('google_tts_api_key', nhapKhoaTts.trim())
                  setNhapKhoaTts('')
                }}
                className="rounded-10 bg-accent px-4 py-3 text-14 font-semibold text-white disabled:opacity-60"
              >
                Lưu
              </button>
            </div>

            {/* 2 ô giọng riêng (chốt M6c/Q4): tiếng Trung và tiếng Anh dùng bộ giọng khác hẳn nhau */}
            <HangGiong
              nhan="Giọng đọc (Trung)"
              giaTri={cd.tts_voice}
              dsGiong={GIONG_ZH}
              dangNghe={dangNghe === 'zh'}
              onDoi={(v) => void ghi('tts_voice', v)}
              onNghe={() => void ngheThu('zh')}
            />
            <HangGiong
              nhan="Giọng đọc (Anh)"
              giaTri={cd.tts_voice_en}
              dsGiong={GIONG_EN}
              dangNghe={dangNghe === 'en'}
              onDoi={(v) => void ghi('tts_voice_en', v)}
              onNghe={() => void ngheThu('en')}
            />

            {/* SPEC §9 chỉ gen sau Import; nút này là lối chạy tay cho những từ đã nhập TRƯỚC M6c */}
            <button
              type="button"
              disabled={tienDo !== null || soThieu === 0}
              onClick={() => void taoAudio()}
              className="rounded-10 bg-secondary-tint px-4 py-3 text-14 font-semibold text-secondary disabled:opacity-60"
            >
              {tienDo
                ? `Đang tạo audio… ${tienDo.da}/${tienDo.tong}`
                : soThieu === 0
                  ? 'Mọi từ đều đã có audio'
                  : `Tạo audio còn thiếu (${soThieu} từ)`}
            </button>
            {ketQuaGen && (
              <div className="rounded-10 border border-border-card bg-surface-card px-4 py-3 text-13 text-content-nav">
                <div>Đã tạo audio cho {ketQuaGen.xong}/{ketQuaGen.tong} từ.</div>
                {ketQuaGen.loi.map((l) => (
                  <div key={l} className="mt-1 text-danger-text">
                    {l}
                  </div>
                ))}
              </div>
            )}
          </Nhom>
        </div>

        <Nhom ten="Thông báo">
          <div className={HANG}>
            <span className={NHAN}>Cảnh báo hàng đợi cạn</span>
            <button
              type="button"
              role="switch"
              aria-checked={cd.low_queue_alert_enabled}
              aria-label="Cảnh báo hàng đợi cạn"
              onClick={() => void ghi('low_queue_alert_enabled', !cd.low_queue_alert_enabled)}
              className={`relative h-5 w-9 shrink-0 rounded-pill transition-colors ${
                cd.low_queue_alert_enabled ? 'bg-accent' : 'bg-border-subtle'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-pill bg-white transition-all ${
                  cd.low_queue_alert_enabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </Nhom>
      </div>
    </KhungTrang>
  )
}
