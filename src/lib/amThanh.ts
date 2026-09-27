/**
 * Âm thanh phản hồi (M17) — phần PHÁT bằng Web Audio API. Phần thuần nằm ở `amThanhCore.ts`.
 *
 * Công thức tổng hợp (nốt, dạng sóng, đường bao) CHÉP NGUYÊN từ trang nghe thử người dùng đã duyệt:
 * https://claude.ai/artifact/KjhHGwwJW3NVknLcT9AmdB — 0 file âm thanh, 0 package (`ponytail`).
 *
 * ⚠️ 3 điều bất biến:
 *  1. KÊNH RIÊNG, không đụng `phatAm()` của tts.ts. `phatAm()` tự cắt tiếng đọc cũ khi đọc từ mới;
 *     âm phản hồi đi đường Web Audio nên không cắt tiếng đọc và không bị nó cắt (M17/Q4).
 *  2. MỌI LỖI NUỐT IM LẶNG. Không để 1 tiếng "ting" làm hỏng bài đang làm (M17/Q10).
 *  3. Âm chỉ phát sau khi người dùng đã chạm vào trang (luật trình duyệt). Âm phản hồi luôn bắt
 *     nguồn từ một cú bấm/phím nên `AudioContext` được mở đúng lúc; các màn điều hướng sau đó
 *     (Tổng kết) dùng lại `AudioContext` đã mở.
 */
import {
  docCaiDatAmThanh,
  duocPhat,
  ghiCaiDatAmThanh,
  KHOA_LUU_AM,
  type CaiDatAmThanh,
  type MaAm,
} from './amThanhCore.ts'

let ctx: AudioContext | null = null
let master: GainNode | null = null

/** Mở (hoặc dùng lại) `AudioContext` dùng chung và đặt âm lượng. `null` nếu trình duyệt không hỗ trợ. */
function moNguCanh(amLuong: number): { c: AudioContext; ra: GainNode } | null {
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  if (!master) return null
  master.gain.value = amLuong / 100
  return { c: ctx, ra: master }
}

/** localStorage có thể ném ở chế độ ẩn danh ⇒ rơi về mặc định. */
export function docCaiDatDaLuu(): CaiDatAmThanh {
  try {
    return docCaiDatAmThanh(localStorage.getItem(KHOA_LUU_AM))
  } catch {
    return docCaiDatAmThanh(null)
  }
}

export function luuCaiDatAmThanh(cd: CaiDatAmThanh): void {
  try {
    localStorage.setItem(KHOA_LUU_AM, ghiCaiDatAmThanh(cd))
  } catch {
    // Bị chặn ghi ⇒ vẫn áp cho phiên hiện tại, chỉ là không nhớ được sang lần tải sau.
  }
}

// ── Nguyên liệu tổng hợp ────────────────────────────────────────────────────

type TuyChonNot = { kieu?: OscillatorType; to?: number; len?: number; dich?: number; loc?: number }

/** 1 nốt với đường bao: lên nhanh, tắt dần theo hàm mũ (nghe tự nhiên, không bị "tách"). */
function not(
  c: AudioContext,
  ra: AudioNode,
  tan: number,
  batDau: number,
  dai: number,
  { kieu = 'sine', to = 0.22, len = 0.008, dich = 0, loc }: TuyChonNot = {},
): void {
  const t0 = c.currentTime + batDau
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = kieu
  o.frequency.setValueAtTime(tan, t0)
  if (dich) o.frequency.exponentialRampToValueAtTime(tan * dich, t0 + dai)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(to, t0 + len)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dai)
  let dau: AudioNode = o
  if (loc) {
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = loc
    o.connect(f)
    dau = f
  }
  dau.connect(g).connect(ra)
  o.start(t0)
  o.stop(t0 + dai + 0.05)
}

/** Tiếng gió ngắn: nhiễu trắng qua bộ lọc dải quét lên. */
function gio(c: AudioContext, ra: AudioNode, dai: number, to: number): void {
  const t0 = c.currentTime
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dai), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = 0.9
  f.frequency.setValueAtTime(500, t0)
  f.frequency.exponentialRampToValueAtTime(2400, t0 + dai)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(to, t0 + dai * 0.3)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dai)
  src.connect(f).connect(g).connect(ra)
  src.start(t0)
  src.stop(t0 + dai + 0.02)
}

// Tần số (Hz)
const Mi5 = 659.25
const Si5 = 987.77
const Re4d = 311.13 // Rê#4
const La3d = 233.08 // La#3
const Fa4 = 349.23
const La4 = 440
const Do5 = 523.25
const Mi6 = 1318.51
const La6 = 1760

/** Công thức 7 âm — `Record` bắt buộc đủ mọi `MaAm`, thiếu âm nào TypeScript báo lỗi ngay. */
const CONG_THUC: Record<MaAm, (c: AudioContext, ra: AudioNode) => void> = {
  // 2 nốt đi lên · 300ms
  dung: (c, ra) => {
    not(c, ra, Mi5, 0, 0.16, { to: 0.2 })
    not(c, ra, Si5, 0.08, 0.22, { to: 0.18 })
    not(c, ra, Si5 * 2, 0.08, 0.18, { to: 0.03 })
  },
  // 2 nốt trầm đi xuống, lọc bớt âm chói — sai KHÔNG bị trừ điểm (DEC-08) nên âm phải mềm · 360ms
  sai: (c, ra) => {
    not(c, ra, Re4d, 0, 0.18, { kieu: 'triangle', to: 0.2, loc: 1200 })
    not(c, ra, La3d, 0.1, 0.26, { kieu: 'triangle', to: 0.2, loc: 1200 })
  },
  // 1 nốt, nhẹ hơn âm đúng · 220ms
  dung_goi_y: (c, ra) => not(c, ra, Mi5, 0, 0.22, { to: 0.16 }),
  // Hợp âm rải ngân dần · 900ms
  hoan_thanh: (c, ra) => {
    ;[Fa4, La4, Do5, Mi5].forEach((t, i) => not(c, ra, t, i * 0.04, 0.85, { to: 0.08, len: 0.03 }))
  },
  // Tiếng "cộp" trầm như đặt viên đá, rồi ngân · 370ms
  va_ngay: (c, ra) => {
    not(c, ra, 196, 0, 0.09, { to: 0.25, dich: 0.5 })
    not(c, ra, Mi6, 0.07, 0.3, { to: 0.1 })
  },
  // Tiếng "tách" rất ngắn — 1 màn Matching có nhiều cặp nên phải gần như không nghe ra · 60ms
  ghep_cap: (c, ra) => not(c, ra, La6, 0, 0.06, { to: 0.09, len: 0.003 }),
  // Tiếng gió nhẹ · 160ms
  lat_the: (c, ra) => gio(c, ra, 0.16, 0.1),
}

/** Phát 1 âm, TÔN TRỌNG cài đặt (công tắc tổng, công tắc từng âm, âm lượng). */
export function phatAmThanh(ma: MaAm): void {
  try {
    const cd = docCaiDatDaLuu()
    if (!duocPhat(ma, cd)) return
    const nc = moNguCanh(cd.amLuong)
    if (nc) CONG_THUC[ma](nc.c, nc.ra)
  } catch {
    // M17/Q10 — im lặng
  }
}

/**
 * Nghe thử ở màn Cài đặt: BỎ QUA công tắc (để nghe rồi mới quyết định bật — M17/Q11),
 * nhưng dùng âm lượng đang chọn trên thanh trượt.
 */
export function ngheThuAmThanh(ma: MaAm, amLuong: number): void {
  try {
    const nc = moNguCanh(amLuong)
    if (nc) CONG_THUC[ma](nc.c, nc.ra)
  } catch {
    // im lặng
  }
}
