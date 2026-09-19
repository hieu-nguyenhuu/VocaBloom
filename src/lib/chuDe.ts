import { THU_TU_STAGE } from './dashboard.ts'
import type { Stage } from './srs.ts'

/**
 * Logic thuần cho màn CHỌN CHỦ ĐỀ để ôn (M7). Không React, không Supabase.
 * Màn này KHÔNG có mockup — layout mượn card của mockup 13, đã được người dùng duyệt (M7/Q3).
 */

export type TomTatChuDe = {
  id: string
  ten: string
  mo_ta: string | null
  so_tu: number
  so_den_han: number
  /** 6 khúc theo thứ tự stage — vẽ thanh tiến trình nhiều màu (màu tượng trưng ring-0..5). */
  khuc: { stage: Stage; so: number }[]
}

export function tomTatChuDe(dv: {
  topics: readonly { id: string; name: string; description: string | null }[]
  lienKet: readonly { topic_id: string; vocab_id: string }[]
  trangThai: readonly { vocab_id: string; stage: string; next_review_date: string | null }[]
  homNay: string
}): TomTatChuDe[] {
  const { topics, lienKet, trangThai, homNay } = dv
  const tt = new Map(trangThai.map((r) => [r.vocab_id, r]))

  const ds = topics.map((t) => {
    const ids = lienKet.filter((l) => l.topic_id === t.id).map((l) => l.vocab_id)
    const trang = ids.map((id) => tt.get(id)).filter((x): x is NonNullable<typeof x> => Boolean(x))
    return {
      id: t.id,
      ten: t.name,
      mo_ta: t.description,
      so_tu: ids.length,
      // Từ mastered đã hết lịch ôn; từ next_review_date = null còn nằm trong hàng đợi từ mới
      so_den_han: trang.filter(
        (r) => r.stage !== 'mastered' && r.next_review_date !== null && r.next_review_date <= homNay,
      ).length,
      khuc: THU_TU_STAGE.map((stage) => ({
        stage: stage as Stage,
        so: trang.filter((r) => r.stage === stage).length,
      })),
    }
  })

  // Chủ đề có từ đến hạn nổi lên trước; còn lại theo tên để danh sách ổn định
  return ds.sort((a, b) => b.so_den_han - a.so_den_han || a.ten.localeCompare(b.ten, 'vi'))
}
