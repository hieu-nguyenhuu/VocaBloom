/**
 * Logic thuần cho NGỮ PHÁP CỦA CHỦ ĐỀ (M12b, bảng `topic_grammar`).
 * Không React, không Supabase.
 *
 * ⚠️ Đừng lẫn với ngữ pháp CỦA TỪ (`exercises.type = 'grammar'`): cái đó gắn với 1 vocab,
 * chạy trong session như một màn bài tập. Ngữ pháp chủ đề không gắn từ nào, không tính điểm,
 * chỉ hiện ở đầu/cuối lượt ôn theo chủ đề và ở màn Từ vựng.
 */

export type MucNguPhap = {
  content_target: string
  pinyin: string
  content_vi: string
  vi_du: string
  vi_du_pinyin: string
  vi_du_vi: string
}

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '')

/**
 * Chuẩn hoá các dòng `topic_grammar` đọc từ DB.
 *
 * Mọi cột trừ `content_target`/`content_vi` đều nullable, và dòng có thể do người dùng tự sửa
 * sau này ⇒ chịu được thiếu. Dòng KHÔNG có `content_target` bị loại hẳn: hiện thẻ trống
 * không giúp gì cho người học.
 */
export function docNguPhap(rows: unknown): MucNguPhap[] {
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => {
      const d = (r ?? {}) as Record<string, unknown>
      return {
        content_target: chuoi(d['content_target']).trim(),
        pinyin: chuoi(d['pinyin']),
        content_vi: chuoi(d['content_vi']),
        vi_du: chuoi(d['vi_du']),
        vi_du_pinyin: chuoi(d['vi_du_pinyin']),
        vi_du_vi: chuoi(d['vi_du_vi']),
      }
    })
    .filter((m) => m.content_target !== '')
}

/**
 * Đích đến sau khi xem xong ngữ pháp của một giai đoạn.
 *
 * Tách thành hàm thuần vì đây là chỗ DỄ SAI NHẤT của M12b: giai đoạn `dau` phải vào Player,
 * giai đoạn `cuoi` phải sang hội thoại rồi mới tới Tổng kết. Nhầm 1 nhánh là hoặc mất màn hội
 * thoại kết thúc (§4.5), hoặc lặp vô hạn giữa Player và màn ngữ pháp.
 */
export function noiTiepTheo(giaiDoan: 'dau' | 'cuoi', topicId: string): string {
  return giaiDoan === 'dau'
    ? `/on-tap?che_do=topic&topic=${topicId}`
    : `/on-tap/hoi-thoai?topic=${topicId}`
}
