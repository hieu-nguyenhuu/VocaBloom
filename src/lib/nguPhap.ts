/**
 * Logic thuần cho NGỮ PHÁP CỦA CHỦ ĐỀ (M12b, bảng `topic_grammar`).
 * Không React, không Supabase.
 *
 * ⚠️ Đừng lẫn với ngữ pháp CỦA TỪ (`exercises.type = 'grammar'`): cái đó gắn với 1 vocab,
 * chạy trong session như một màn bài tập. Ngữ pháp chủ đề không gắn từ nào, không tính điểm,
 * chỉ hiện ở đầu lượt ôn theo chủ đề (trước Đọc hiểu) và ở màn Từ vựng.
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
 * Đích đến sau khi xem xong ngữ pháp chủ đề. M31: ôn theo chủ đề = ĐỌC HIỂU (design.m31.md §2);
 * giai đoạn "cuối" (→ hội thoại kết thúc) đã bỏ cùng chế độ topic của Player.
 * Giữ thành hàm thuần có test: trỏ nhầm về chính màn ngữ pháp là lặp vô hạn.
 */
export function noiTiepTheo(topicId: string): string {
  return `/on-tap/doc-hieu?topic=${topicId}`
}
