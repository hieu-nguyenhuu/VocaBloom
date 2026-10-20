/**
 * Logic thuần cho ĐỌC HIỂU CHỦ ĐỀ (M31, design.m31.md). Không React, không Supabase, không node:.
 * Đề sinh NGOÀI app (nguyên tắc bất biến số 1) ⇒ ở đây chỉ đọc, xáo, chấm, tổng hợp và validate.
 * KHÔNG tính điểm SRS: không đụng srs.ts / word_state.
 */
import { xaoTron } from './player.ts'

export type KieuDoan = 'hoi_thoai' | 'doan_van'
export type DongDoc = { speaker: string; text: string; pinyin: string; vi: string }
export type CauHoiDoc = {
  hoi: string
  hoi_pinyin: string
  lua_chon: string[]
  lua_chon_pinyin: string[]
  /** Chỉ số trong `lua_chon` (sau `xaoLuot` đã được ánh xạ lại). */
  dap_an: number
  giai_thich_vi: string
}
export type BaiDoc = { id: string; kieu: KieuDoan; lines: DongDoc[]; tu_dam: string[]; questions: CauHoiDoc[] }

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '')
const laKieu = (v: unknown): v is KieuDoan => v === 'hoi_thoai' || v === 'doan_van'
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const obj = (v: unknown): Record<string, unknown> => (v ?? {}) as Record<string, unknown>

/** 4 lựa chọn khác nhau, không rỗng, đáp án 0–3 — câu hỏng thì bỏ (không vỡ cả màn). */
function docCauHoi(q: unknown): CauHoiDoc | null {
  const d = obj(q)
  const lc = mang(d['lua_chon']).map((s) => chuoi(s).trim())
  const da = d['dap_an']
  if (chuoi(d['hoi']).trim() === '' || lc.length !== 4 || lc.includes('') || new Set(lc).size !== 4) return null
  if (typeof da !== 'number' || !Number.isInteger(da) || da < 0 || da > 3) return null
  const lp = mang(d['lua_chon_pinyin']).map(chuoi)
  return {
    hoi: chuoi(d['hoi']).trim(),
    hoi_pinyin: chuoi(d['hoi_pinyin']),
    lua_chon: lc,
    lua_chon_pinyin: lp.length === 4 ? lp : ['', '', '', ''],
    dap_an: da,
    giai_thich_vi: chuoi(d['giai_thich_vi']),
  }
}

/** Đọc `topic_readings` từ DB. Đoạn hỏng (0 dòng / 0 câu hợp lệ / kieu lạ) bị bỏ, các đoạn khác vẫn chạy. */
export function docBaiDoc(rows: unknown, tenTu: Record<string, string>): BaiDoc[] {
  const ra: BaiDoc[] = []
  for (const r of mang(rows)) {
    const d = obj(r)
    const id = d['id']
    const kieu = d['kieu']
    const c = obj(d['content'])
    if (typeof id !== 'string' || !laKieu(kieu)) continue
    const lines = mang(c['lines'])
      .map((l) => {
        const x = obj(l)
        return { speaker: chuoi(x['speaker']), text: chuoi(x['text']).trim(), pinyin: chuoi(x['pinyin']), vi: chuoi(x['vi']) }
      })
      .filter((l) => l.text !== '')
    const questions = mang(c['questions'])
      .map(docCauHoi)
      .filter((q): q is CauHoiDoc => q !== null)
    if (lines.length === 0 || questions.length === 0) continue
    // Từ có thể đã bị xoá khỏi `vocab` ⇒ lọc id không tra được (giống docHoiThoai)
    const tu_dam = mang(c['highlight_vocab_ids'])
      .map((x) => tenTu[String(x)])
      .filter((w): w is string => Boolean(w))
    ra.push({ id, kieu, lines, tu_dam, questions })
  }
  return ra
}

/** Xáo thứ tự ĐOẠN + thứ tự 4 lựa chọn của từng câu; `dap_an` ánh xạ lại theo vị trí mới. */
export function xaoLuot(ds: readonly BaiDoc[], rng: () => number): BaiDoc[] {
  return xaoTron(ds, rng).map((b) => ({
    ...b,
    questions: b.questions.map((q) => {
      const thuTu = xaoTron([0, 1, 2, 3], rng)
      return {
        ...q,
        lua_chon: thuTu.map((k) => q.lua_chon[k] ?? ''),
        lua_chon_pinyin: thuTu.map((k) => q.lua_chon_pinyin[k] ?? ''),
        dap_an: thuTu.indexOf(q.dap_an),
      }
    }),
  }))
}

/** null = chưa chọn đủ mọi câu ⇒ chưa được Kiểm tra. */
export function chamDoan(
  qs: readonly CauHoiDoc[],
  daChon: readonly (number | null)[],
): { so_dung: number; dung: boolean[] } | null {
  if (daChon.length !== qs.length || daChon.some((x) => x === null)) return null
  const dung = qs.map((q, k) => daChon[k] === q.dap_an)
  return { so_dung: dung.filter(Boolean).length, dung }
}

/** Đọc 1 đoạn có thể lâu hơn 1 bài Player (trần 5') ⇒ trần riêng 10 phút. */
export const TRAN_DOC_MS = 10 * 60_000
export function thoiGianDoan(moc: number, now: number): number {
  return Math.max(0, Math.min(now - moc, TRAN_DOC_MS))
}

// ── Tổng hợp ────────────────────────────────────────────────────────────────

export type DongLogDoc = { so_cau: number; so_dung: number; thoi_gian_ms: number | null; kieu: KieuDoan | null }

/** Màn Kết quả: số liệu lấy từ `doc_hieu_log` của lượt (KHÔNG từ state client — cùng tinh thần §4.6). */
export function tongHopKetQua(rows: readonly DongLogDoc[]) {
  const ms = rows.reduce((s, r) => s + (r.thoi_gian_ms ?? 0), 0)
  return {
    so_cau: rows.reduce((s, r) => s + r.so_cau, 0),
    so_dung: rows.reduce((s, r) => s + r.so_dung, 0),
    phut: Math.ceil(ms / 60_000),
    doan: rows.map((r) => ({ kieu: r.kieu, so_cau: r.so_cau, so_dung: r.so_dung })),
  }
}

/** Màn Chọn chủ đề: "Lần gần nhất X/Y" = cộng mọi đoạn của lượt MỚI NHẤT mỗi chủ đề. */
export function lanGanNhat(
  rows: readonly { topic_id: string; luot_id: string; so_cau: number; so_dung: number; created_at: string }[],
): Record<string, { so_cau: number; so_dung: number }> {
  const moiNhat = new Map<string, { luot: string; luc: string }>()
  for (const r of rows) {
    const cu = moiNhat.get(r.topic_id)
    if (!cu || r.created_at > cu.luc) moiNhat.set(r.topic_id, { luot: r.luot_id, luc: r.created_at })
  }
  const ra: Record<string, { so_cau: number; so_dung: number }> = {}
  for (const r of rows) {
    if (moiNhat.get(r.topic_id)?.luot !== r.luot_id) continue
    const t = (ra[r.topic_id] ??= { so_cau: 0, so_dung: 0 })
    t.so_cau += r.so_cau
    t.so_dung += r.so_dung
  }
  return ra
}

// ── Validate đề (dùng chung CLI + Import) ──────────────────────────────────

export type LoiDoc = { duong_dan: string; thong_diep: string }

/**
 * Cổng validate đề đọc hiểu — DÙNG CHUNG CLI `bo-sung-doc-hieu` và Import (M31c). Chuẩn: design.m31.md §6.
 * `thieu_phu` = từ của chủ đề chưa xuất hiện trong đoạn nào (cảnh báo; M31b đòi bằng 0).
 */
export function kiemTraBaiDoc(
  readings: unknown,
  tuChuDe: readonly string[],
  lang: 'zh' | 'en',
): { loi: LoiDoc[]; thieu_phu: string[] } {
  const loi: LoiDoc[] = []
  const bao = (duong_dan: string, thong_diep: string) => loi.push({ duong_dan, thong_diep })
  const ds = mang(readings)
  if (ds.length < 3) bao('readings', `cần ≥ 3 đoạn, đang có ${ds.length}`)
  const zh = lang === 'zh'
  // Tiếng Anh: so khớp không phân biệt hoa/thường ("Office" vẫn phủ từ "office")
  const thuong = (s: string) => (zh ? s : s.toLowerCase())
  const toanVan: string[] = []

  ds.forEach((r, i) => {
    const p = `readings[${i}]`
    const d = obj(r)
    if (!laKieu(d['kieu'])) bao(`${p}.kieu`, 'phải là "hoi_thoai" hoặc "doan_van"')
    const lines = mang(d['lines']).map(obj)
    if (lines.length === 0) bao(`${p}.lines`, 'đoạn rỗng')
    lines.forEach((l, k) => {
      if (chuoi(l['text']).trim() === '') bao(`${p}.lines[${k}].text`, 'thiếu câu')
      if (chuoi(l['vi']).trim() === '') bao(`${p}.lines[${k}].vi`, 'thiếu nghĩa tiếng Việt')
      if (zh && chuoi(l['pinyin']).trim() === '') bao(`${p}.lines[${k}].pinyin`, 'thiếu pinyin')
      if (d['kieu'] === 'hoi_thoai' && l['speaker'] !== 'A' && l['speaker'] !== 'B')
        bao(`${p}.lines[${k}].speaker`, 'hội thoại cần speaker "A"/"B"')
    })
    const van = thuong(lines.map((l) => chuoi(l['text'])).join(' '))
    toanVan.push(van)

    const qs = mang(d['questions'])
    if (qs.length < 2 || qs.length > 3) bao(`${p}.questions`, `cần 2–3 câu hỏi, đang có ${qs.length}`)
    qs.forEach((q, k) => {
      const c = obj(q)
      const qp = `${p}.questions[${k}]`
      if (docCauHoi(q) === null) bao(qp, 'câu hỏi rỗng / không đủ 4 lựa chọn khác nhau / dap_an ngoài 0–3')
      if (chuoi(c['giai_thich_vi']).trim() === '') bao(`${qp}.giai_thich_vi`, 'thiếu giải thích')
      if (
        zh &&
        (chuoi(c['hoi_pinyin']).trim() === '' ||
          mang(c['lua_chon_pinyin']).filter((x) => chuoi(x).trim() !== '').length !== 4)
      )
        bao(`${qp}.pinyin`, 'thiếu pinyin câu hỏi / lựa chọn')
    })

    const hl = mang(d['highlight_words']).map(chuoi)
    const ngoai = hl.filter((w) => !tuChuDe.includes(w))
    const vang = hl.filter((w) => tuChuDe.includes(w) && !van.includes(thuong(w)))
    if (ngoai.length > 0) bao(`${p}.highlight_words`, `không thuộc chủ đề: ${ngoai.join(', ')}`)
    else if (vang.length > 0) bao(`${p}.highlight_words`, `không có trong đoạn: ${vang.join(', ')}`)
  })

  const thieu_phu = tuChuDe.filter((w) => !toanVan.some((v) => v.includes(thuong(w))))
  return { loi, thieu_phu }
}

/** Đề đã validate → dòng INSERT `topic_readings` (đổi highlight_words → highlight_vocab_ids, như bẫy hội thoại §10.2). */
export function dongGhiBaiDoc(readings: readonly unknown[], topicId: string, idTheoChu: Record<string, string>) {
  return readings.map((r, i) => {
    const d = obj(r)
    return {
      topic_id: topicId,
      thu_tu: i + 1,
      kieu: d['kieu'],
      content: {
        lines: d['lines'],
        highlight_vocab_ids: mang(d['highlight_words'])
          .map((w) => idTheoChu[chuoi(w)])
          .filter(Boolean),
        questions: d['questions'],
      },
    }
  })
}
