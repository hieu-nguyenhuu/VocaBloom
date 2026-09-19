import {
  bodyCham,
  docGiaiThich,
  docKetQuaCham,
  promptGiaiThich,
  type DangBaiAI,
  type GiaiThich,
  type ItemCham,
  type KetQuaCham,
} from './aiCore.ts'
import { supabase } from './supabase.ts'

/**
 * Tầng I/O của AI (M5). Gọi OpenRouter THẲNG TỪ BROWSER (MB-04 — không dựng Edge Function proxy).
 * Mọi prompt và luật đọc response nằm ở `aiCore.ts` (thuần, có test); file này chỉ lo mạng + cache.
 *
 * AI trong app chỉ làm 2 việc: chấm bài tự luận stage 3 (§7) và giải thích khi bấm nút (§8).
 */
const URL_AI = 'https://openrouter.ai/api/v1/chat/completions'

export const THIEU_KHOA =
  'Chưa có khoá OpenRouter. Thêm VITE_OPENROUTER_API_KEY và VITE_OPENROUTER_MODEL vào .env.local rồi khởi động lại dev server.'

/**
 * Khoá & model: ưu tiên bảng `settings` (§11, MB-04) → dự phòng biến môi trường.
 *
 * ⚠️ TẠM THỜI (M5): đọc từ env cho tiện khi chạy local. Vite NHÚNG mọi biến `VITE_*` vào
 * `dist/assets/*.js` ⇒ ai mở URL cũng đọc được khoá, kể cả chưa đăng nhập.
 * TRƯỚC KHI DEPLOY CÔNG KHAI: xoá 2 biến `VITE_OPENROUTER_*` và nhập khoá ở màn Cài đặt (M6) —
 * nhờ thứ tự ưu tiên này, app tự chuyển sang nguồn an toàn mà không phải sửa code.
 */
export async function layCauHinhAI(): Promise<{ khoa: string; model: string } | null> {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['openrouter_api_key', 'openrouter_model'])
  const tu = Object.fromEntries(
    (data ?? []).map((r) => [r['key'] as string, (r['value'] as string | null) ?? '']),
  )
  const khoa = tu['openrouter_api_key'] || import.meta.env.VITE_OPENROUTER_API_KEY || ''
  const model = tu['openrouter_model'] || import.meta.env.VITE_OPENROUTER_MODEL || ''
  return khoa && model ? { khoa, model } : null
}

async function goiAI(body: object, khoa: string): Promise<string | { loi: string }> {
  try {
    const res = await fetch(URL_AI, {
      method: 'POST',
      headers: { Authorization: `Bearer ${khoa}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      if (res.status === 401) return { loi: 'Khoá OpenRouter không hợp lệ.' }
      if (res.status === 429) return { loi: 'OpenRouter báo quá nhiều yêu cầu, thử lại sau ít phút.' }
      const t = await res.text().catch(() => '')
      return { loi: `OpenRouter lỗi ${res.status}: ${t.slice(0, 140)}` }
    }
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return j.choices?.[0]?.message?.content ?? ''
  } catch {
    return { loi: 'Không kết nối được OpenRouter. Kiểm tra mạng rồi thử lại nhé.' }
  }
}

/** §7.1 — 1 request cho CẢ nhóm câu trả lời cùng dạng (DEC-14: 3 request/session stage 3). */
export async function chamBaiTuLuan(dv: {
  dang: DangBaiAI
  target_lang: 'zh' | 'en'
  items: ItemCham[]
}): Promise<{ ok: KetQuaCham[]; thieu: string[] } | { loi: string }> {
  const cau = await layCauHinhAI()
  if (!cau) return { loi: THIEU_KHOA }
  const kq = await goiAI(bodyCham({ ...dv, model: cau.model }), cau.khoa)
  if (typeof kq !== 'string') return kq
  return docKetQuaCham(
    kq,
    dv.items.map((i) => i.vocab_id),
  )
}

/**
 * §8 / DEC-23 — lazy-generate + cache vào `exercises.ai_explanation`.
 * Bấm lại (bất kỳ lúc nào) đọc thẳng DB, KHÔNG gọi lại AI.
 */
export async function giaiThichBai(
  exercise_id: string,
  dv: { dang: string; ngu_canh: object },
): Promise<GiaiThich | { loi: string }> {
  const { data } = await supabase
    .from('exercises')
    .select('ai_explanation')
    .eq('id', exercise_id)
    .maybeSingle()
  const cache = data?.['ai_explanation'] as GiaiThich | null | undefined
  if (cache?.explanation_vi) return cache

  const cau = await layCauHinhAI()
  if (!cau) return { loi: THIEU_KHOA }
  const kq = await goiAI(
    {
      model: cau.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: promptGiaiThich(dv.dang) },
        { role: 'user', content: JSON.stringify(dv.ngu_canh) },
      ],
    },
    cau.khoa,
  )
  if (typeof kq !== 'string') return kq
  const g = docGiaiThich(kq)
  if (!g) return { loi: 'AI trả về dữ liệu không đọc được. Thử lại nhé.' }
  await supabase.from('exercises').update({ ai_explanation: g }).eq('id', exercise_id)
  return g
}
