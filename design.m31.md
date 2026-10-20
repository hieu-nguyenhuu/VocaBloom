# M31 — Ôn theo chủ đề = Đọc hiểu kiểu HSK (thay Player + Hội thoại kết thúc)

> Thiết kế tổng. Plan thi công tách file `design.m31a.md` / `m31b` / `m31c` SAU khi duyệt.
> Màn Đọc hiểu + màn Kết quả **KHÔNG có mockup** ⇒ bố cục ở §5 cần duyệt (sau thi công sẽ duyệt lại qua ảnh chụp, như M26d).

## 1. Yêu cầu đã chốt (Brainstorm 2026-10-18)

| # | Câu hỏi | Chốt |
|---|---|---|
| Q1 | Đề sinh ở đâu | **Ngoài app** (giống M23): AI sinh trước → CLI bổ sung cho 35 chủ đề đã có + mở rộng file import/skill. Giữ nguyên tắc bất biến số 1 |
| Q2 | Tính điểm SRS | **Không.** Không chạm `word_state`/`review_log`/`srs.ts`; bảng điểm 15/12/39 giữ nguyên |
| Q3 | Luồng | **Ngữ pháp đầu → Đọc hiểu → Kết quả.** Bỏ Player chế độ topic + màn Hội thoại kết thúc (hội thoại cũ vẫn xem ở màn Từ vựng) |
| Q4 | Cách trả lời | **Làm hết 2–3 câu của đoạn rồi bấm "Kiểm tra"** → đúng/sai + đáp án đúng + giải thích tiếng Việt → đoạn tiếp |
| Q5 | Số đoạn | **~5 đoạn/chủ đề** (2 hội thoại + 3 đoạn văn), phủ hết từ của chủ đề, ~13 câu; mỗi lượt làm hết; xáo thứ tự đoạn + thứ tự đáp án |
| Q6 | Dạng câu | **Trắc nghiệm 4 lựa chọn**, câu hỏi + đáp án bằng ngôn ngữ đích (HSK4 阅读 第三部分) |
| Q7 | Hỗ trợ | Nút 拼 (**mặc định TẮT**) · loa nghe cả đoạn · **sau Kiểm tra** mới mở được bản dịch Việt + từ chủ đề tô tím đậm |
| Q8 | Kết quả | **Màn Kết quả riêng + lưu lịch sử** (bảng mới); thời gian đọc cộng vào nhật ký ngày (streak/phút) |

## 2. Luồng & route

```
/on-tap/chu-de ──► /on-tap/ngu-phap?topic=X&giai_doan=dau   (giữ nguyên; chủ đề không có ngữ pháp ⇒ tự đi tiếp)
                     └─ noiTiepTheo('dau') ĐỔI ĐÍCH ──► /on-tap/doc-hieu?topic=X           (MỚI)
                                                         └─ hết đoạn / X ──► /on-tap/doc-hieu/ket-qua?luot=L&topic=X   (MỚI)
```

- **Route riêng**, KHÔNG nhét vào `PlayerPage`/`giamPlayer` (bài học MB-26/M12b: "cái gì làm session kết thúc?" ⇒ ở đây: hết danh sách đoạn).
- **X giữa chừng:** đã Kiểm tra ≥ 1 đoạn ⇒ màn Kết quả của lượt đó; chưa đoạn nào ⇒ về `/on-tap/chu-de`.
- **Gỡ bỏ (code chết sau M31):** nhánh `che_do=topic` trong `PlayerPage` (`dueTrongTopic`, `daPhucVuTopic`, `gomSessionTopic`, `stageBaiTap` mastered…), `HoiThoaiKetThucPage` + route `/on-tap/hoi-thoai`, `giai_doan=cuoi` của ngữ pháp. Bảng `topic_dialogues` + khối hội thoại ở màn Từ vựng **giữ nguyên**.
- Màn Chọn chủ đề: giữ card (mockup 13), dòng "N từ đến hạn" đổi thành **"5 đoạn · Lần gần nhất 11/13"** (chưa làm ⇒ "5 đoạn đọc"); chủ đề 0 đoạn ⇒ card mờ + "Chưa có bài đọc".

## 3. Dữ liệu (bảng thứ 13 + 14)

### 3.1 `topic_readings` — đề đọc hiểu (migration `0018_doc_hieu.sql`)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `topic_id` | uuid FK `topics` **on delete cascade** | |
| `thu_tu` | int | thứ tự gốc (app vẫn xáo) |
| `kieu` | text check in (`hoi_thoai`,`doan_van`) | |
| `content` | jsonb | xem dưới |

```jsonc
{
  "lines": [ { "speaker": "A", "text": "你这个周末有空吗？", "pinyin": "Nǐ zhège zhōumò yǒu kòng ma?", "vi": "Cuối tuần này bạn rảnh không?" } ],
  //        doan_van: KHÔNG có "speaker", mỗi phần tử = 1 câu (để pinyin/dịch canh đúng câu)
  "highlight_vocab_ids": ["uuid", "..."],          // từ của chủ đề có trong đoạn (tô đậm SAU Kiểm tra)
  "questions": [ {
    "hoi": "男的周末打算做什么？", "hoi_pinyin": "…",
    "lua_chon": ["去爬山", "在家休息", "去公司加班", "看电影"],
    "lua_chon_pinyin": ["…","…","…","…"],
    "dap_an": 0,                                  // chỉ số trong lua_chon GỐC
    "giai_thich_vi": "Câu thứ 2: 「我想去爬山」 ⇒ đi leo núi."
  } ]                                              // 2–3 câu
}
```
`pinyin`/`hoi_pinyin`/`lua_chon_pinyin` = null khi `lang = 'en'`. Đọc DB qua hàm thuần `docBaiDoc()` (bỏ đoạn hỏng thay vì vỡ màn, giống `docHoiThoai`).

### 3.2 `doc_hieu_log` — lịch sử làm bài
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `luot_id` | uuid | sinh `crypto.randomUUID()` lúc vào màn; màn Kết quả query theo cột này |
| `topic_id` | uuid FK cascade | |
| `reading_id` | uuid FK `topic_readings` cascade | |
| `so_cau` / `so_dung` | int | |
| `thoi_gian_ms` | int | từ lúc hiện đoạn → bấm Kiểm tra, dùng lại `tinhThoiGian` (có trần) |
| `created_at` | timestamptz | |

- **Ghi 1 dòng NGAY khi bấm Kiểm tra** (không gom state client đến cuối) ⇒ thoát app giữa chừng vẫn còn kết quả (cùng tinh thần §4.6).
- Cả 2 bảng: RLS + policy `authenticated_full_access` + `grant` (luật MB-13/2), idempotent, liệt kê tường minh trong `check:schema`.
- **`chot_nhat_ky_ngay()` sửa TẠI CHỖ ở `0014`** (1 định nghĩa duy nhất, MB Q7): cộng `review_log` + `doc_hieu_log` trong ngày VN. Dashboard (phút hôm nay) cũng cộng thêm `doc_hieu_log`. Ngày CHỈ đọc hiểu vẫn tính streak.
- Xoá chủ đề ⇒ cascade xoá đề + log; nhật ký ngày không giảm (`greatest`, M14).

## 4. Logic thuần (TDD, `src/lib/docHieu.ts`, 0 import ngoài `songNgu`/`hoiThoai` nếu cần)
| Hàm | Việc | Ca test chính |
|---|---|---|
| `docBaiDoc(rows, tuTheoId)` | jsonb → `BaiDoc[]`, bỏ đoạn hỏng | thiếu lines/questions; `dap_an` ngoài 0–3; lựa chọn trùng; 1 đoạn hỏng không kéo đổ đoạn khác |
| `xaoLuot(bai, rng)` | xáo thứ tự đoạn + thứ tự 4 lựa chọn, **ánh xạ lại `dap_an`** | đáp án vẫn trỏ đúng chữ sau xáo; rng cố định ⇒ tất định |
| `chamDoan(cauHoi, daChon)` | `{ so_dung, ket_qua[] }` | thiếu câu ⇒ không cho chấm; đúng/sai từng câu |
| `tongHopKetQua(logRows)` | tổng câu/đúng/thời gian + từng đoạn | log rỗng; nhiều đoạn |
| `kiemTraBaiDoc(json)` | validator dùng chung CLI + Import (M31c) | 2–3 câu/đoạn; 4 lựa chọn khác nhau; `dap_an` hợp lệ; đủ ≥ 3 đoạn; mọi `highlight` thuộc chủ đề |

## 5. Bố cục (KHÔNG có mockup — đề xuất, 0 màu mới, chỉ token Lớp 2)

### 5.1 Màn Đọc hiểu — Mobile (1 cột) / PC (2 cột)
```
Mobile ~420px                               PC (max-w ~1040, 2 cột Grid 1.15fr / 1fr)
┌──────────────────────────────┐            ┌──────────────────────────────────────────────────────┐
│ ĐỌC HIỂU · 2/5        拼  ✕  │ header      │ ĐỌC HIỂU · 2/5 · Tên chủ đề                  拼  ✕   │
│ Tên chủ đề                   │ (như ngữ    ├───────────────────────────┬──────────────────────────┤
│        ● ━ ● ○ ○             │  pháp chủ   │ ┌ Hội thoại ────── 🔊 ┐   │ 1. 男的周末打算做什么？   │
│ ┌ Hội thoại ─────────── 🔊 ┐ │  đề)        │ │ A: 你这个周末有空吗？ │   │ ┌ A 去爬山            ┐ │
│ │ A  你这个周末有空吗？     │ │             │ │ B: 有啊，我想去爬山… │   │ ┌ B 在家休息          ┐ │
│ │ B  有啊，我想去爬山……   │ │ surface-card│ │  (đoạn văn: đoạn chữ │   │ ┌ C 去公司加班        ┐ │
│ └──────────────────────────┘ │ bo 20       │ │   liền, 17–18px)     │   │ ┌ D 看电影            ┐ │
│ 1. 男的周末打算做什么？       │             │ └──────────────────────┘   │ 2. ……                    │
│ ┌ A 去爬山                ┐  │ 4 hàng full │  ← cột trái STICKY: đọc    │ [      Kiểm tra       ]  │
│ ┌ B 在家休息              ┐  │ width (đáp  │    lại khi cuộn câu hỏi    │                          │
│ ┌ C 去公司加班            ┐  │ án dài, ko  │                            │                          │
│ ┌ D 看电影                ┐  │ lưới 2×2)   │                            │                          │
│ 2. ……                        │             │                            │                          │
│ [         Kiểm tra         ] │ accent đặc  └───────────────────────────┴──────────────────────────┘
└──────────────────────────────┘
```
- **Đoạn hội thoại:** bong bóng A/B thu gọn từ màn Hội thoại kết thúc (sắc độ `surface-card` / `surface-chat-b`, không hue mới). **Đoạn văn:** 1 khối chữ liền `font-han` 17–18px, `leading-relaxed`; bật 拼 ⇒ mỗi câu thành 1 dòng + pinyin 12px muted bên dưới.
- **Ô lựa chọn:** kiểu ô Trắc nghiệm (nền trắng, viền trung tính), nhãn A–D tròn nhỏ; đang chọn = `accent-tint` + viền `accent`. Bật 拼 ⇒ pinyin dưới câu hỏi và từng lựa chọn.
- **Kiểm tra** chỉ bật khi đã chọn đủ mọi câu. Enter = Kiểm tra / Đoạn tiếp.
- **Sau Kiểm tra** (lệch §6.2 có chủ ý — đây là chấm 1 lần, không "chọn lại đến khi đúng", nên ĐƯỢC lộ đáp án): ô chọn đúng = success; ô chọn sai = error + ô đúng = success; dưới mỗi câu 1 khối giải thích `surface-sunken` 13px. Đoạn: từ chủ đề tô **tím đậm** (`chiaDam`), hiện nút "Hiện bản dịch" (dịch dưới từng câu/lượt). Nút đổi thành "Đoạn tiếp" / "Xem kết quả".
- Âm M17: Kiểm tra ⇒ đúng hết `dung`, còn lại `sai` (1 âm/đoạn).

### 5.2 Màn Kết quả đọc hiểu (khuôn Tổng kết mockup 12, max-w ~480–640)
```
            🎉  Hoàn thành đọc hiểu
            Tên chủ đề · 18/10/2026
 ┌ 11/13 ──────┐ ┌ 5 ─────┐ ┌ 12 phút ┐      3 ô: accent-tint · border-card · border-card
 │ Câu đúng    │ │ Đoạn   │ │ Thời gian│
 ┌─────────────────────────────────────┐
 │ Đoạn 1 · Hội thoại            3/3 ✓ │      đủ điểm: success-text · thiếu: content-muted (không đỏ)
 │ Đoạn 2 · Đoạn văn             2/3   │
 └─────────────────────────────────────┘
 [            Làm lại chủ đề này          ]   accent đặc
 [            Chọn chủ đề khác            ]   secondary-tint (hành động phụ = xanh dương)
              Về Dashboard                    ghost
```
Gọi `chot_nhat_ky_ngay` (ref guard) + âm `hoan_thanh`, như Tổng kết. Số liệu query `doc_hieu_log` theo `luot_id`, không lấy state client.

## 6. Sinh nội dung (M31b) — chuẩn soạn đề
- 35 chủ đề (15 HSK3 giao tiếp + 20 HSK4 giao tiếp) × 5 đoạn ≈ **175 đoạn / ~455 câu hỏi**. Builder đọc **snapshot DB** (`chup-chu-de.mjs`, có `vocab_id`) — không đọc file import gốc (MB-44 Q7).
- Mỗi đoạn dùng ~4–6 từ chủ đề; cả chủ đề phủ **100% từ** (validator đếm). Độ dài: HSK3 60–120 chữ · HSK4 100–180 chữ; hội thoại 4–8 lượt.
- Văn phong (memory "Văn phong câu hội thoại"): đúng level bộ từ, ít từ lạ, đời thường + công việc.
- Câu hỏi trả lời được **duy nhất** từ đoạn (không dựa kiến thức ngoài); 3 nhiễu hợp lý, cùng loại, khác nhau; có câu hỏi suy luận/ý chính, không chỉ dò chữ; giải thích trích câu căn cứ.
- CLI `npm run bo-sung:doc-hieu -- <file…> [--dry-run]`: đăng nhập + PostgREST (luật DB 6), kiểm TẤT CẢ file trước, chỉ INSERT `topic_readings`, chặn nếu chủ đề đã có đề (chạy lại không nhân đôi).
- **Cổng duyệt:** soạn **1 chủ đề thử** → bạn đọc duyệt văn phong + độ khó → mới soạn 34 chủ đề còn lại theo đợt.

## 7. Import cho chủ đề mới (M31c)
Khoá **`readings` BẮT BUỘC** ở gốc file (≥ 3 đoạn, dùng `vocab_temp_id` cho `highlight_vocab_temp_ids`, đổi tên khoá khi ghi DB — đúng bẫy hội thoại §10.2). Đổi CÙNG LÚC 3 cổng (TS `importValidate` · `import-schema.json` · `validate_import.py`) + `import_topic()` + skill `vocabCsv2Json` (SKILL.md, payload-schemas.md, file mẫu). File JSON cũ không import lại được nữa (như M26).

## 8. Edge case đã tính
| Tình huống | Xử lý |
|---|---|
| Chủ đề chưa có đề | `KhungRong` "Chủ đề này chưa có bài đọc hiểu" + nút về Chọn chủ đề (không rơi vào Player cũ) |
| Tải đề lỗi | `KhungLoi` + Thử lại (M19) |
| Ghi `doc_hieu_log` lỗi | Vẫn hiện đúng/sai tại chỗ; `BangLoi` + Thử lại ghi; không chặn sang đoạn tiếp |
| Bấm Kiểm tra 2 lần | khoá ngay sau lần đầu (ref), đúng 1 INSERT |
| Tải lại trang giữa lượt | lượt mới (luot_id mới); dòng log cũ vẫn là lịch sử, không lỗi |
| Đoạn hỏng trong DB | `docBaiDoc` bỏ đoạn đó, các đoạn khác chạy bình thường |
| Chủ đề tiếng Anh | ẩn 拼, chữ body font; không pinyin ở mọi khối |
| Đoạn dài trên mobile | cuộn cả trang; PC cột trái sticky |

## 9. Lộ trình
| Phần | Nội dung | Kiểm chứng |
|---|---|---|
| **M31a** | migration 0018 + sửa 0014 · `docHieu.ts` (TDD) · CLI bổ sung · 2 màn mới + đổi `noiTiepTheo` + card Chọn chủ đề · gỡ nhánh topic Player/Hội thoại kết thúc · Dashboard cộng phút · tài liệu SPEC §4.5 / UI_DESIGN §8.3 | `npm test` · build · lint · `db:migrate` ×2 · `check:schema` · `test:nhatky` (ca đọc hiểu, ĐỎ trước) · CDP PC/Mobile × Sáng/Tối với **1 chủ đề thử thật** · ảnh duyệt bố cục |
| **M31b** | soạn đề 1 chủ đề thử (duyệt) → 34 chủ đề theo đợt → CLI ghi | validator 35/35 · đếm SQL chỉ đọc: 35 chủ đề × ≥ 3 đoạn, phủ 100% từ |
| **M31c** | `readings` trong file import (3 cổng + RPC + skill) | `test:import` thêm ca · S11/SN9 · validate file mẫu |

Ngoài phạm vi (YAGNI): sinh đề bằng AI trong app, chấm điểm SRS từ đọc hiểu, đề luyện nghe, xem lại chi tiết các lượt cũ (chỉ hiện "lần gần nhất").
