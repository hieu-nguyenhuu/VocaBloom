# Plan M31b — Soạn đề đọc hiểu cho 34 chủ đề còn lại

> Thiết kế: [`design.m31.md`](design.m31.md) §6 (chuẩn soạn đề). Chủ đề thử 01 đã nạp ở M31a; người dùng ra lệnh "soạn nốt 34 chủ đề còn lại" (2026-10-18).
> Không đổi code app — chỉ dữ liệu.

## Chuẩn (giữ đúng như đề thử 01)
- Mỗi chủ đề 5 đoạn: **2 hội thoại** (4–8 lượt, speaker A/B) + **3 đoạn văn**; mỗi đoạn 2–3 câu trắc nghiệm 4 lựa chọn, ~13–14 câu/chủ đề.
- Độ dài đoạn văn: HSK3 60–120 chữ (chấp nhận ≤ ~130) · HSK4 100–180 chữ.
- Phủ **100%** từ của chủ đề (validator `thieu_phu` = rỗng); `highlight_words` = từ chủ đề có trong đoạn.
- Văn phong: đúng level bộ từ, ít từ lạ, đời thường + công việc (xưởng điện tử, trạm test); câu hỏi trả lời được duy nhất từ đoạn;
  3 nhiễu hợp lý, cùng loại; giải thích tiếng Việt trích câu căn cứ. Pinyin có biến điệu 一/不 như dữ liệu hiện có.
- Câu hỏi dùng ngôi thứ ba ("他/她/说话人"), không dùng từ vượt cấp (作者…).

## Quy trình
| Bước | Việc | Kiểm |
|---|---|---|
| 1 | Snapshot `du-lieu-import/doc-hieu/chu-de-db.json` (đã có) | — |
| 2 | Đợt A — 14 chủ đề HSK3 (`02.json`…`15.json`) | `kiem-01.mjs` từng file: 0 lỗi, 0 chưa phủ, độ dài |
| 3 | CLI `--dry-run` cả đợt → ghi thật | đếm SQL chỉ đọc |
| 4 | Đợt B — 20 chủ đề HSK4 (`h4-01.json`…`h4-20.json`) | như trên |
| 5 | Nghiệm thu: 35/35 chủ đề có ≥ 3 đoạn, mọi đoạn đọc được qua `docBaiDoc` | SQL + script chỉ đọc |
| 6 | memory-bank | — |
