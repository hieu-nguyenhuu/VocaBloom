# Active Context

> Cập nhật lần cuối: **2026-10-07** (**M29 XONG** — deploy bản Firebase cho mạng công ty; chờ nghiệm thu)

## Trạng thái hiện tại

**M0 (Nền móng & Hệ token) — ✅ XONG 2026-09-06.**
**M1 (Database) — ✅ XONG 2026-09-09.**
**M2a (Lõi Import: validate + transaction + CLI) — ✅ XONG 2026-09-09.**
**M3 (SRS engine — hàm thuần) — ✅ XONG 2026-09-09.**
**Auth UI (Màn Đăng nhập + `RequireAuth`) — ✅ XONG 2026-09-16.** App đã đọc được DB qua UI.
**App shell (sidebar PC / tab bar Mobile) — ✅ XONG 2026-09-16.** Khung điều hướng đã có.
**M2b (UI Import) — ✅ XONG 2026-09-16.** `/import` là màn thật đầu tiên.
**Icon cây — ✅ CHỐT 2026-09-16 (MB-19).**
**M4a (Lõi Player + Stage 0 + Tổng kết) — ✅ XONG 2026-09-16.**
**M4b (Player stage 1 + 2 — 8 dạng còn lại) — ✅ XONG 2026-09-17.**
**M5 (AI chấm stage 3 + Giải thích) — ✅ XONG 2026-09-18.** App ôn được **ĐỦ 17/17 dạng bài**;
vòng đời SRS đã chạy trọn vẹn tới `mastered` trên dữ liệu thật.
**M6a (Cài đặt + Thông báo) — ✅ XONG 2026-09-18.** ⚠️ **Nợ kỹ thuật khoá API đã TRẢ XONG** —
`.env.local` không còn `VITE_OPENROUTER_*`, khoá nằm trong bảng `settings`.
**M6b (Dashboard + Khu vườn) — ✅ XONG 2026-09-18.** Route `/` là màn thật; **chỉ còn 1 stub: `/tu-vung`**.
**M6c (TTS Google + Storage) — ✅ XONG 2026-09-19.** `vocab.audio_url` **9/9 từ**; M6 xong trọn.
**M7 (Ôn theo chủ đề + Hội thoại kết thúc) — ✅ XONG 2026-09-19.**
**M8 (Quản lý từ vựng & chủ đề) — ✅ XONG 2026-09-19.** **KHÔNG còn màn stub nào trong app.**
**M9 (Tinh chỉnh + bộ dữ liệu kiểm thử) — ✅ XONG 2026-09-19.**
**M10 (Sửa 8 lỗi Player + màn "Tất cả từ vựng") — ✅ XONG 2026-09-19.**
**M11 (Bug trắc nghiệm + phím tắt + giới hạn từ/lượt) — ✅ XONG 2026-09-20.**
**M12a (Ngữ pháp 2 tầng: DB + Import + skill · import nhiều file) — ✅ XONG 2026-09-22.**
**M12b (Ngữ pháp chủ đề ở Player + màn Từ vựng) — ✅ XONG 2026-09-23.**
**M13 (Audit chuỗi Import + siết validator app) — ✅ XONG 2026-09-23.**
**M14 (Tách nhật ký học khỏi từ vựng) — ✅ XONG 2026-09-23.**
**M15 (Lịch sử học + ruby vá chuỗi) — ✅ XONG 2026-09-24.**
**M16 (Chọn giao diện Sáng / Tối / Hệ thống) — ✅ XONG 2026-09-24.**
**M17 (Âm thanh phản hồi + cài đặt âm thanh) — ✅ XONG 2026-09-27.**
**M18 (Ghép cặp 2 cột bằng nhau + xáo thứ tự từ theo dạng) — ✅ XONG 2026-09-28.**
**M19 (Pinyin mặt sau Flashcard + trạng thái rỗng/loading/lỗi + Đăng xuất 2 mức) — ✅ XONG 2026-09-28.**
**M20 (Hội thoại chủ đề ở màn Từ vựng) — ✅ XONG 2026-09-30.**
**M21 (Sửa từ kẹt "đến hạn nhưng Player không có bài") — ✅ XONG 2026-09-30.**
**M22 (Màu Mastery ring theo stage) — ✅ XONG 2026-10-01.**
**M23 (Bổ sung bài hội thoại cho mọi từ) — ✅ XONG 2026-10-01.**
**M24 (Ngưỡng Mastered 30 → 36) — ✅ XONG 2026-10-02.**
**M25 (Chọn sai thì chọn lại đến khi đúng / Bỏ qua) — ✅ XONG 2026-10-02.**
**M26a (Nền dữ liệu song ngữ Trung ↔ Anh) — ✅ XONG 2026-10-03.**
**M27 (Bộ HSK3 giao tiếp mới) — ✅ XONG 2026-10-05.**
**M26b (Bổ sung dữ liệu song ngữ) — ✅ ĐÓNG 2026-10-05 (T11).**
**M26c (4 dạng Trung–Anh không payload + vá `de_bai`) — ✅ XONG 2026-10-05 (MB-48).**
**M26d (màn Phân biệt từ gần nghĩa + điểm 15/12/39 + NOT NULL) — ✅ XONG 2026-10-05 (MB-49)** · ảnh bố cục ✅ duyệt ⇒ **M26 ĐÓNG**.
**M28 (Select Dialog: gỡ từ đã điền + chấm khi bấm "Kiểm tra") — ✅ XONG 2026-10-05 (MB-50).**
**M29 (Deploy Firebase Cloud Function cho mạng công ty) — ✅ XONG 2026-10-07 (MB-51)** · ⏳ người dùng nghiệm thu ở công ty (T12).
**Tiếp theo:** chưa có milestone mới — chờ người dùng ra lệnh. Việc treo: xem các màn M26c/M26d trong Player thật khi có từ
lên stage1–3 (hiện 740 từ ở `new`) · kiểm mặt sau Flashcard trên dữ liệu thật · `npm run seed:test` vẫn hỏng (thư mục
`du-lieu-kiem-thu/` không còn) · ca "Đăng xuất mọi thiết bị" thành công chưa kiểm.

### ✅ M29 vừa xong (2026-10-07) — MB-51 · Design `design.m29.md` · Plan `design.m29a.md`
- URL: (a) https://asia-southeast1-vocabloom-helios.cloudfunctions.net/vocabloom/ · (b) https://vocabloom-1004632816026.asia-southeast1.run.app/vocabloom/
- Project Firebase `vocabloom-helios` (gói Blaze, ngân sách cảnh báo 2 USD — người dùng đã đặt). CLI 15.32.1 đã login `nguyenhuuhieu9alv@gmail.com` trên máy này.
- File mới: `src/lib/proxy.ts`(+test) · `.env.firebase` · `functions/{index.js,proxyCore.js,proxyCore.test.js,package.json,.env.vocabloom-helios}` · `firebase.json` · `.firebaserc`. Sửa: `vite.config.ts` · `main.tsx` · `env.d.ts` · `supabase.ts` · `ai.ts` · `tts.ts` · `.gitignore` · `package.json` (3 script) · `readme.md` §VIII.
- **Mỗi khi có tính năng mới trên `main`: nhớ nhắc người dùng `npm run deploy:firebase`** (Vercel tự deploy, Firebase thì không).
- Script kiểm dùng lại: scratchpad phiên 2026-10-07 `chay-local.mjs` (harness Express :8081 kiểu a / :8082 kiểu b) + `cdp-m29.mjs <BASE> <tên>` (L1–L8).
- Treo: người dùng thử ở mạng công ty (Google Fonts/TTS có thể bị chặn — fonts rơi về `system-ui`, TTS đã có proxy `/tts`).

### ✅ M28 vừa xong (2026-10-05) — MB-50 · Design `design.m28.md` · Plan `design.m28a.md`
- Lỗi người dùng báo: chọn chip ở Select Dialog không gỡ/chọn lại được (đủ ô là tự chấm ngay).
- `player.ts` +`ChipTrongO` · `dienChip` · `goO` · `oGoLui` (DC1–DC5 ĐỎ trước). `HoiThoai.tsx`: chip theo chỉ số, chip đang dùng
  `invisible` giữ chỗ, từ trong câu là nút gỡ (`accent-tint`), nút "Kiểm tra" chung 2 chế độ, Enter/Backspace/1–4.
- Vá kèm: Select bấm Gợi ý không còn in đáp án A vào câu (chỉ ẩn chip sai).
- Kiểm chứng: `npm test` 479/479 · build · lint exit 0 · CDP trang tạm 58/58 (4 khung × 14 ca + gợi ý + 0 request supabase.co).
  Trang tạm `tam-m28.*` đã xoá; ảnh ở scratchpad phiên `m28-*.png`.
- Chưa xem trong Player thật (0 từ stage1 đến hạn).

### 2026-10-05 — Kích hoạt tay 8 từ đầu hàng đợi (người dùng yêu cầu)
- PATCH `word_state.next_review_date = 2026-10-05` cho 8 từ FIFO `added_at` (chủ đề H3 "3. Chào hỏi & giới thiệu bản thân"):
  个子 · 聪明 · 热情 · 认真 · 爱好 · 城市 · 北方 · 年轻. Vẫn `stage='new'`, 0 điểm. = đúng việc cron B4 làm (`new_words_per_day` = 8).
- Đọc lại 8/8 · tổng đến hạn 8. Cron 01:00 VN 06/10 sẽ kích hoạt tiếp 8 từ (B4 đếm theo ngày mới).
- Lưu ý: cả 20 từ chủ đề 01 có CÙNG `added_at` (import 1 transaction) ⇒ thứ tự trong nhóm do Postgres trả, cron cũng vậy.
- Script: scratchpad phiên `den-han-8.mjs` (bẫy: `{ headers, ...init }` để `init.headers` đè mất `apikey` ⇒ 401; phải spread init TRƯỚC).

### ✅ M26d vừa xong (2026-10-05) — MB-49 · Plan `design.m26d.md`
- Chốt: **D1** câu Anh CHỈ hiện SAU khi đúng (DB cho thấy câu Anh hay chứa nguyên văn nghĩa Anh của đáp án) · **D2** không mockup,
  duyệt qua ảnh · **D3** X lúc xem bảng ⇒ không ghi log.
- `srs.ts`: +`near_synonym` stage2/intensive, `MAX_CYCLE` 15, `NGUONG` 12, `MAX_TICH_LUY` 4/12/27/39, `MASTER_THRESHOLD` **39**.
  Test mới: P3b · X1b (= tổng MAX_CYCLE) · X3 (mẫu số health = cộng dồn — đã chứng minh đỏ khi chỉ sửa MAX_CYCLE) · N1.
- `player.ts`: `PayloadGanNghia`, `Man`, `CAN_RECORD`, `THU_TU_MAN`, nhánh `xepBai` (NS1–3). `bangGanNghia` ở **`songNgu.ts`** (GN1–2) —
  lần đầu đặt ở `player.ts` bị test X-player chặn (chỉ được import `srs.ts`) ⇒ chuyển chứ không nới cổng.
- Màn `PhanBietGanNghia.tsx` (+X2/X5) · `case 'near_synonym'` ở `PlayerPage` (gợi ý · bỏ qua · giải thích AI).
  Sau khi đúng, pinyin câu cũng điền pinyin đáp án thay `___` (phát hiện khi xem ảnh).
- DB: `0017_song_ngu_not_null.sql` (chặn trước nếu còn dòng thiếu) · `check:schema` thêm mục NOT NULL (ĐỎ trước) · 3 script test
  thêm `secondary_word` vào insert. `kiemTraFormTu` bắt buộc từ phụ, `docThayDoi` không ghi null cho cột này.
- Kiểm chứng: `npm test` **474/474** · build · lint 0 lỗi · `db:migrate` ×2 · `check:schema` xanh · `test:db` 9 · `test:player` 4 ·
  `test:nhatky` 5 · `test:import` 10 · `test:ruby` 6 (rollback) · CDP trang tạm **17/17** (payload thật 测试/顺便, 0 request
  supabase.co) · dữ liệu thật chỉ đọc **5/5** (chủ đề 46: 5 khối stage2 đúng thứ tự, 5 màn near_synonym, mỗi từ 5 dạng khả dụng).
- Bẫy script: `innerText` của phần tử `visibility:hidden` là RỖNG ⇒ ca "gợi ý không ẩn đáp án" xanh giả; dùng `textContent`.
- Ảnh bố cục: scratchpad phiên 2026-10-05 `m26d-*.png` (PC/Mobile × Sáng/Tối, trước/sau).
- Chưa kiểm trong Player thật — chưa có từ stage2 (740 từ đang `new`); sớm nhất ~2 vòng ôn sau khi cron kích hoạt.

### ✅ M26c vừa xong (2026-10-05) — MB-48 · Plan `design.m26c.md`
- `songNgu.ts` +`nhanGhepCap` (NG1–5) · +`deDienTu` (DT1–4). `aiCore.ts` +`deBaiCua` · +`taoItemCham` · `KetQuaCham.secondary_feedback`
  · `LUAT_SONG_NGU` (chỉ make_sentence) · prompt trans/complete nhắc `"de_bai"` · `promptGiaiThich` nhắc `secondary_word` (AI1–7).
- UI: Ghép cặp cột phải tiếng Anh (trùng nhãn ⇒ kèm nghĩa Việt) · Dịch từ/cụm ra đề tiếng Anh + nghĩa Việt · Đặt câu thêm ô
  câu Anh tuỳ chọn (Enter ô Trung ⇒ nhảy ô Anh, Enter ô Anh ⇒ nộp) + thẻ đề `复习 (ôn tập · review)` · ChamAI hiện câu Anh + khối
  nhận xét TRUNG TÍNH. Mọi màn: thiếu dữ liệu phụ ⇒ y hệt bản cũ.
- ⭐ **Lỗi cũ M5 đã vá (C2):** `ItemCham.de_bai` khai báo từ M5 nhưng CHƯA TỪNG được gán ⇒ AI chấm trans_sentence/complete_situation
  không thấy đề. Nay `PlayerPage` lưu `deBaiTuLuan` lúc nộp. Kiểm thật: dịch lệch đề ⇒ `fail`, phản hồi trích đúng đề.
- Kiểm chứng:
  - `npm test` **464/464** (16 ca mới, đều ĐỎ trước) · build xanh · lint 0 lỗi (9 cảnh báo cũ).
  - CDP trang tạm **22/22** (PC + Mobile 390 × Sáng/Tối, 0 request Supabase). Trang tạm đã xoá.
  - AI thật **5/5** (model `deepseek/deepseek-v4.1-flash`): câu Anh sai ⇒ verdict vẫn `good` + có `secondary_feedback`; không câu Anh ⇒
    không có khoá; dịch lệch đề ⇒ `fail`.
- ⚠️ Bẫy script CDP: lọc request bằng `'supabase'` bắt nhầm module `/src/lib/supabase.ts` của Vite ⇒ phải lọc `'supabase.co'`.
- ⚠️ Script Python thay chuỗi tiếng Việt trong `aiCore.ts` KHÔNG khớp (dù chuỗi trông giống hệt) ⇒ dùng công cụ Edit cho file có
  nhiều tiếng Việt có dấu. (Matching/DienTu thì Python khớp bình thường.)
- Chưa kiểm trong Player thật (không có từ stage1–3 đến hạn) — các màn đã kiểm qua component + test.

> ⚠️ Git sạch lúc mở phiên 2026-10-03 (M22–M25 đã commit: `17b3687`, `bb9468d`). **M26a CHƯA commit** (người dùng tự commit).
> `npm run seed:test` vẫn hỏng từ trước — chưa sửa.

### ✅ M27 — Bộ "HSK3 giao tiếp" MỚI (thay 20 bộ H3 cũ, học TRƯỚC H4) — 2026-10-05
- **Thiết kế `design.m27.md` (✅ duyệt) · Plan `design.m27a.md` (✅ duyệt, thi công xong).**
- Người dùng chốt:
  - 15 chủ đề × ~20 từ.
  - Hư từ: liên từ/phó từ/giới từ có nghĩa Anh rõ thì VÀO SRS; trợ từ thuần (了着过 的得地 吧呢吗) và cả 把/被 (không có nghĩa Anh) thì vào **ngữ pháp chủ đề** 2–3 điểm/chủ đề.
  - **KHÔNG lấy HSK 2.0 cấp 1–2** (虽然/但是/因为/所以 là HSK2 ⇒ loại; 才/跟 là HSK3 ⇒ giữ).
  - Loại mọi từ trùng H4.
  - Sau import: dời `added_at` của H4 ra sau bộ H3 mới.
- Thứ tự ở M27d CHỈ khi người dùng ra lệnh: **xoá 20 chủ đề H3 cũ → import 15 mới → dời added_at H4 (chỉ khi 438 từ H4 vẫn `next_review_date IS NULL`)**.
  - Lý do xoá trước: tránh 163 từ H3 cũ còn trong hàng đợi được kích hoạt trước bộ mới.
- **M26b Đợt 3 HUỶ** (bộ H3 cũ sẽ bị xoá).
- Thư mục `du-lieu-import/hsk3-giao-tiep/`:
  - CSV 4 cột, **15 chủ đề · 302 từ · 73 hư từ**, 0 lỗi / 0 cảnh báo.
  - `tham-chieu/hsk12.txt` (danh sách loại), `tham-chieu/hu-tu.txt` (đếm; dòng "Bổ sung" = hư từ HSK 3.0 / lửng lơ cấp độ).
  - `nguon/dung_h3.py` + `test_dung_h3.py` (12 test K1–K7, B1–B5) + `test-fixture/99.txt`.
- Builder là lớp ghép mỏng: `hsk.doc_nguon`/`hsk.dung` (16 dạng H4) + `sn.dung_tu` (5 trường phụ + near_synonym).
  - Nguồn H4 thêm khoá IPA/COL/EX/NOTE/NS/NSEN/OK/ND trong khối W; `S:` = định nghĩa TIẾNG ANH; dòng DL = `câu | Việt | Anh`.
  - secondary_word lấy từ cột TuPhu.
  - Luật `不 了` ⇒ `了{liǎo}` áp cho MỌI câu (`ep_bu_liao`).
  - ⚠️ Python `re` không nhận look-behind dài thay đổi ⇒ dùng nhóm bắt.
- Fixture qua đủ 3 cổng: ajv `valid` · Python 0 lỗi · `import:file --dry-run` hợp lệ.
- 157/302 từ mới trùng bộ H3 CŨ trong DB (bình thường, sẽ xoá bộ cũ); 0 trùng H4.
- ✅ Cổng 1: danh sách từ ĐÃ DUYỆT 2026-10-05 (giữ cả 92 từ `*` ngoài HSK 2.0 cấp 3).
- **M27b (plan `design.m27b.md` ✅):** `nguon/01.txt` soạn xong.
  - Kết quả: 20 từ · 206 bài · G 6 · NOTE 6 · 10+10 cặp hội thoại (mỗi từ có mặt ở cả 2 dạng, bạn cặp khác nhau) · hội thoại 10 câu dùng 16 từ.
  - 3 cổng validate sạch; `import-01-*.json` CHƯA import.
  - Rà pinyin bắt thêm 1 lỗi builder: token nhiễu `S:` / `DD:` có ép âm `{}` bị lọt vào `word`; validator không bắt được.
  - Đã vá ở `dung_chu_de` (bóc `{…}` bằng `hsk.chu_cua`); test **B6** đỏ trước rồi xanh ⇒ 13/13.
  - Bẫy mới: tên riêng giữa câu (小 王{Wáng}, 汉字{Hànzì}, 广东{Guǎngdōng}, 韩国{Hánguó}, 华为{Huáwéi}, 阿明{Āmíng}) · câu sai cố ý cũng ép âm cho đúng (过{guò}).
  - ✅ **Cổng 2: văn phong chủ đề 01 ĐÃ DUYỆT 2026-10-05** ⇒ chuẩn cho 02–15.
- **M27c (plan `design.m27c.md` ✅) — XONG CẢ 2 ĐỢT 2026-10-05.**
  - 01–08 = 162 từ; 3 cổng validate sạch 8/8.
  - Builder 15/15 test. Thêm B7: bảng đọc riêng H3 nạp vào `hsk.MAC_DINH_DON` / `hsk.EP_TU` (脏 zāng, 照片 zhàopiàn). Thêm B8: khoá `NSLAP: <lý do>` cho câu NS buộc lộ đáp án (越…越…).
  - Phải sửa 1 dòng `song-ngu/dung_song_ngu.py` (`if w in cau and not r.get('NSLAP')`); kiểm lại bo-sung-60 md5 không đổi.
  - Script rà pinyin dùng lại: scratchpad `ra_pinyin.py NN` (in pinyin V/SS/CS/SE/FI/NS/DL/NP + "LỌT ÉP ÂM").
  - Bẫy pinyin mới:
    - Phát âm: 脏 zāng (pypinyin ra zàng) · 照片 zhàopiàn · 过去 danh từ = 过去{guòqù}, kể cả trong S/ND · 小{Xiǎo} 王{Wáng} giữa câu · 怪不得{guàibude} · 谈谈{tántan} · 问问{wènwen}.
    - Bổ ngữ: 起不来 / 搬不动 / 放不下 / 看不出 / 测不过 → ép cả cụm hoặc 不{bu}. `不 了 ，` = "không nữa" → 了{le} (tránh luật 不了→liǎo).
    - Tên riêng: 德国{Déguó} · 台湾{Táiwān} · 华为{Huáwéi} · 河内 工业{Gōngyè} 大学{Dàxué}.
  - Builder chặn đúng nhiều lần DESC lộ nghĩa phụ ("place", "next", "to", "worried") ⇒ khi viết S tiếng Anh phải tránh mọi từ trong TuPhu, kể cả "to", "so", "but", "for".
  - **Đợt 2 (09–15) XONG.** Tổng 15 file `du-lieu-import/hsk3-giao-tiep/import-01…15-*.json`:
    - 302 từ · 3100 bài: 8 dạng/từ × 302, near_synonym 302, select_dialog 152, fill_dialog 152, grammar 78.
    - 31 điểm ngữ pháp chủ đề · 150 câu hội thoại · "LỌT ÉP ÂM" rỗng cả 15.
    - 3 cổng: ajv 15/15 · `validate_import.py` 15/15 · `import:file --dry-run` 15/15.
    - Dry-run cảnh báo "từ đã có trong DB" là ĐÚNG (H3 cũ chưa xoá).
    - Builder 15/15 (B7 thêm 电子邮件 = diànzǐyóujiàn, đã kiểm ngược: bỏ ép thì ra diànzi) · `npm test` 448/448.
  - Bẫy đợt 2:
    - Phát âm: 剩下{shèngxia} · 尝尝 / 逛逛 / 走走 thanh nhẹ · 消息 xiāoxi.
    - Bổ ngữ: 联系不{bu}上 · 打印不{bu}出来 · 买不起 / 扣不上 / 闻不到.
    - Số thứ tự: 第三 dì-sān.
- **M27d XONG 2026-10-05** (lệnh "chạy m27d" → người dùng xem danh sách → gõ "xóa"):
  - **Sao lưu trước khi xoá:** `du-lieu-import/hsk3-giao-tiep/sao-luu-h3-cu-2026-10-05.json` (1,4 MB). Gồm 20 topics, 240 vocab, word_state, 742 review_log, 2231 exercises, hội thoại, ngữ pháp.
  - **Xoá:** gọi RPC `xoa_chu_de` cho đúng 20 id `3. %` → 240 từ xoá, 0 từ gỡ.
    - Mất 76 từ đang học và toàn bộ 742 dòng `review_log` (thống kê theo từ về 0).
    - Streak/phút học vẫn còn ở `nhat_ky_ngay` (11 ngày).
  - **Import 15 file** (01→15): `added_at` H3 mới 10:05:05→10:05:27 UTC.
  - **Dời H4:** `added_at = max(H3 mới) + 1 phút + (added_at − min H4)`, có điều kiện an toàn 438 từ / 0 đang học ngay trong câu UPDATE. Thứ tự nội bộ H4 giữ nguyên như lúc import 09-30.
  - **Verify:**
    - DB còn 35 topics · 740 vocab · 740 word_state · 0 mồ côi · 0 vai B treo.
    - H3: 15 chủ đề · 302 từ · 3100 bài · 302 near_synonym · 31 ngữ pháp · 15 hội thoại.
    - H4: 438 từ · 4462 bài.
    - 0 từ thiếu `secondary_word` ⇒ điều kiện M26d đã đủ.
    - 302 từ đầu hàng đợi FIFO đều là H3.
  - Hiện **0 từ đang học**: cron sẽ kích hoạt dần theo FIFO, bắt đầu từ chủ đề 01. Audio TTS của 302 từ mới vẫn còn tồn (app tự gọi như H4).
  - **Tiếp theo:** ~~M26 T11 + đóng M26b~~ ✅ → **M26c** → M26d.

### ✅ M26 T11 — Kiểm chứng tổng, M26b ĐÓNG (2026-10-05)
- Đích đối chiếu đổi theo M27: **740 từ / 35 chủ đề** (không còn 678/40). CLI chỉ chạy lại 20 file H4 (H3 mới vào qua import).
- SQL chỉ đọc (scratchpad `t11_sql.mjs`):
  - 740/740 có `secondary_word` + `collocation` + `example`.
  - 740 `near_synonym`, đúng 1 bài/từ.
  - 0/740 mô tả `select_on_describe` còn ký tự riêng của tiếng Việt.
  - 35/35 chủ đề có hội thoại · 350/350 dòng có `text_secondary` · 0 vocab mồ côi · 0 thiếu `word_state`.
  - 3 từ `secondary_phonetic = null` là CỐ Ý, vì là cụm nhiều từ: 顺便 · 打包 · 属.
  - 180 từ có `secondary_note`.
- Mốc md5 `word_state` mới (sau M27d): `295f3018…` (740 dòng, 740 `new`, max updated_at 2026-10-05 10:05:27 UTC). Mốc cũ `0319e619…` hết hiệu lực.
- CLI `bo-sung:song-ngu --dry-run` 20/20 file H4 ⇒ **0 thay đổi** cả 20.
- `npm test` 448/448 · build xanh · lint 0 lỗi (9 cảnh báo cũ).
- CDP chỉ đọc 7/7 (PC 1280 + Mobile 390, 0 lệnh ghi): chủ đề 46 có 24 từ · tìm "test" ra 测试/重测 khớp DB · hội thoại 16 dòng Anh · form sửa có khối "Từ vựng phụ", giá trị khớp DB, Esc đóng không lưu · Mobile không tràn.
- ⚠️ **Mặt sau Flashcard CHƯA xem được trên dữ liệu thật.** Chế độ chủ đề cố ý không có Flashcard (`dangChoPhep = boBaiCua(...)` chỉ gồm dạng tính điểm), còn ôn hằng ngày đang 0 từ đến hạn. Component đã kiểm ở M26a (CDP 53/53 với fixture). Xem lại khi cron kích hoạt từ mới.

### 🚧 M26 — Từ vựng phụ song ngữ (Trung ↔ Anh) — đang làm, 4 milestone
- **Thiết kế tổng: `Design.m26.md`** (đã duyệt) · Plan từng milestone: `design.m26a.md` (xong) · `design.m26b/c/d.md` (viết khi
  tới lượt). `DESIGN.md` nay chỉ là trang chỉ mục (người dùng yêu cầu tách file 2026-10-03).
- Người dùng chốt: mục tiêu (b) **chủ động dùng được tiếng Anh** · từ phụ là THUỘC TÍNH của `vocab` (không SRS riêng) ·
  5 cột `secondary_word/phonetic/collocation/example/note` (**không audio**) · thay 5 dạng sang Trung–Anh giữ điểm
  (matching · translate Anh→Trung kèm nghĩa Việt · select_on_describe định nghĩa tiếng Anh · trans_collocation Anh→Trung ·
  make_sentence song ngữ — điểm theo câu Trung, câu Anh tuỳ chọn) · **GIỮ `select_sentence`** · `near_synonym` là dạng MỚI
  tính điểm ở stage2/intensive ⇒ max 15, ngưỡng **12/15**, `MASTER_THRESHOLD` **39** (bật ở M26d) · hội thoại mỗi dòng có
  câu Anh LUÔN hiện · CSV 4 cột `TuVung, TuPhu, Nghia, Topic` (TuPhu trống ⇒ skill tự sinh).
- Thứ tự: **M26a ✅ → M26b ✅ (đóng 2026-10-05) → M26c ✅ (2026-10-05) → M26d ✅ (2026-10-05) ⇒ M26 ĐÓNG** (điều kiện M26d nay là 740/740 có `near_synonym` — ĐÃ ĐỦ).
- Kiểm DB 03/10: 53 từ học dở đều ở đầu vòng, retry rỗng ⇒ **không xoá từ nào**; đổi 36→39 chỉ đổi kết cục của 复习 (max 38).

### 🚧 M26b đang làm (2026-10-03) — Plan `design.m26b.md`
- Công cụ: `boSungSongNgu.ts` (thuần, BN1–BN10) · `scripts/chup-song-ngu.mjs` (snapshot chỉ đọc → `du-lieu-import/song-ngu/chu-de-db.json`)
  · builder `du-lieu-import/song-ngu/dung_song_ngu.py [NN]` đọc `nguon/NN.txt` · CLI `npm run bo-sung:song-ngu -- <file…> [--dry-run]`
  (PATCH theo id + POST near_synonym, đọc lại phải 0 thay đổi). `kiemNhieuGanNghia` export từ `importValidate.ts` (dùng chung).
- Người dùng duyệt văn phong đợt thử 46 + chốt **IPA Anh-Mỹ** (memory `english-pronunciation-american`). Đã ghi 46 vào DB.
- ⚠️ Cú pháp ép âm `字{pinyin}` KHÔNG được có dấu cách trong ngoặc (tach_token cắt theo dấu cách ⇒ văng exception) — tách token.
- ⚠️ Builder văng lỗi từng để lại JSON CŨ ⇒ dry-run chạy nhầm file cũ. Đã vá: builder xoá `bo-sung-NN-*.json` trước khi dựng.
- Đáp án nhiễu đứng 1 mình phải ép âm đủ thanh (个{gè}, 过去{guòqù}); 一 trước ___ phải ép (一{yì}) như M23.
- **Tiến độ:** 46 + Đợt 1 (41–45, 47–50) + **Đợt 2 (51–60, 213 từ) ĐÃ GHI 2026-10-05** — **438/678 từ (20/20 chủ đề H4)**.
  Còn Đợt 3 (H3 01–20, 240 từ) rồi T11 (kiểm tra toàn bộ).
- md5 `word_state` dùng câu cố định: `select md5(string_agg(w::text,'|' order by w::text)) from word_state w` — mốc Đợt 2
  `0319e619…` (678 dòng, max updated_at 2026-10-04 18:00 UTC) trước = sau khi ghi. (Mốc `2483a4bb…` của Đợt 1 là câu khác.)
- Builder có luật tự động mới: `了` ngay sau `不` ⇒ `了{liǎo}` (上不了网). CLI có thêm `ganNghiaSua` (PATCH near_synonym
  đã có theo id khi payload khác) — dùng để VÁ 4 câu pinyin sai đã ghi ở Đợt 1: 修改 (得 děi) · 排除 (重装 chóngzhuāng) ·
  信号/电路板 (不了 bù liǎo); dry-run lại 41–50 = 0 thay đổi.
- Bẫy pinyin Đợt 2: tên riêng giữa câu bị viết thường (西湖{Xīhú}, 故宫{Gùgōng}, 湖南人, 微信{Wēixìn}) · 早点儿{zǎodiǎnr}
  (không ép ra "zǎodiǎn'ér") · 吐{tù} (nôn) · 大夫{dàifu} · 一{yī} 号 (ngày) · 数{shǔ} · 女朋友{nǚpéngyou} · 过去{guòqù}.
- Bẫy pinyin gặp thêm ở Đợt 1: `一个一个` / `一步一步` bị builder hiểu là V一V ⇒ 一 thứ 2 thành thanh nhẹ — viết
  `一 个 一{yí} 个`; distractor thanh nhẹ cần ép (回来{huílái}, 网吧{wǎngbā}, 力气{lìqi}, 位置{wèizhì}, 部分{bùfèn},
  照片{zhàopiàn}, 长{zhǎng} khi muốn đối chiếu cùng âm với 涨); 量 động từ = 量{liáng}; 行 (dòng) = 行{háng}; 英文{Yīngwén}.
- Builder chặn thật 2 lần ở Đợt 1: DESC lộ nghĩa phụ (方案 'proposal') và câu NS chứa sẵn đáp án (插座 chứa 插).

### M26a vừa xong (2026-10-03) — MB-47
- Migration **`0016_song_ngu.sql`**: 5 cột `secondary_*` **nullable** + enum `near_synonym` (18 nhãn). `0007` sửa tại chỗ ghi 5 cột.
- `src/lib/songNgu.ts` (thuần, 5 test): `ngonNguPhu` · `tachNghiaPhu` · `hienNghiaPhu` · `nhanNgonNguPhu`.
- **3 cổng validate đổi cùng lúc** (TS app · JSON Schema · Python): 5 field vocab (word/collocation/example không rỗng;
  phonetic/note key bắt buộc, được null) · `near_synonym` (đúng 1 `___`, 3 nhiễu `{word,pinyin,secondary,note_vi}` khác nhau
  và ≠ từ đang ôn) · `text_secondary` mọi dòng hội thoại. Test SN1–SN9 (+S11). ⚠️ JSON Schema KHÔNG chặn được "nhiễu trùng
  chính từ" (đối chiếu chéo) — chỉ TS + Python chặn, đúng giới hạn đã ghi trong schema.
- UI: Flashcard mặt sau (chip `EN`/`中` + từ phụ + IPA, cụm, câu, ghi chú) · hội thoại 2 màn (câu phụ dưới pinyin) · form
  sửa từ +5 ô "Từ vựng phụ" · tìm kiếm khớp từ phụ. Mọi phần phụ **ẩn khi null** — 678 từ cũ chưa có dữ liệu.
- Skill: CSV 4 cột · 9 dạng bắt buộc (+`near_synonym`) · `description` = định nghĩa tiếng Anh · `text_secondary`. 3 file mẫu
  đã bổ sung (diff lớn chỉ do định dạng — đã kiểm phần cũ giống hệt 100%).
- ⚠️ **File JSON cũ trong `du-lieu-import/**` KHÔNG import lại được nữa** (thiếu field mới) — dữ liệu cũ đi đường CLI M26b.
- ⭐ **Bài học kiểm thử:** sau khi file mẫu có `near_synonym`, mọi ca "phải chặn" đều **xanh giả** (cả file đã bị chặn sẵn vì
  dạng chưa hợp lệ). Đã chứng minh 6 luật bằng **phá-luật-từng-cái** (mutation) — mỗi lần phá đúng 1 ca đỏ. Áp lại khuôn
  này khi RED bị "nhiễm" bởi một lỗi chung.
- CDP lần 1 đỏ vì trang nạp lần đầu chậm (Vite biên dịch) — chạy lại 53/53; chờ 1500ms đôi khi chưa đủ ở lượt đầu.
- Ghi nhận: `word_state` đổi lúc 20:53 VN (53 → 61 từ đang học) là phiên học của người dùng + cron, TRƯỚC khi M26a thi công.

### M25 vừa xong (2026-10-02) — MB-46
- 4 màn `TracNghiem` · `DienTu` · `SapXep` · `HoiThoai`: sai ⇒ đỏ **800ms** ⇒ chọn lại đến khi đúng (hoặc Bỏ qua). Trắc
  nghiệm: ô sai mờ + khoá · điền: giữ chữ + bôi đen · sắp xếp: giữ khay · hội thoại: ô đúng giữ xanh + khoá, chip sai khoá
  TRỪ KHI là đáp án ô kia. **Không đổi:** Fast Decision, AI chấm, Ghép cặp (vốn đã vậy), Flashcard (Hard vốn đã xuống cuối
  phiên — `hard_day_cuoi`; Again vẫn vào hàng Ôn lại).
- ⭐ **Điểm theo LẦN ĐẦU** qua hàm thuần `chamLuot` (`player.ts`, test C1–C5). Component chỉ gọi `onTraLoi` **1 lần khi đúng**,
  với `dung = !daSai` ⇒ `srs.ts` / `PlayerPage.traLoi` / RPC / retry **không sửa dòng nào**.
- ⚠️ Hội thoại **thiếu từ B**: chỉ chấm ô thực có (code cũ trả `b: false` cố định ⇒ áp "đến khi đúng" là kẹt vĩnh viễn).
- `KHOANG_CHO_SAI_MS` 1000 → **800** (nay = thời gian giữ đỏ, không phải chờ chuyển màn); X2 canh `? 600 : 800`.
- Chấm chuyển từ `useEffect` sang **handler** ở `TracNghiem` (khỏi double khi StrictMode / đổi `soGoiY`); mọi màn có
  `clearTimeout` khi unmount.
- Hệ quả đã báo người dùng: bấm X sau 1 lần sai ⇒ bài đó KHÔNG ghi log (như chưa làm) · `thoi_gian_ms` gồm thời gian làm lại.

### M24 vừa xong (2026-10-02) — MB-45
- `MASTER_THRESHOLD = 36` (= 4+8+12+12): đúng trọn vẹn ⇒ stage3 lên thẳng mastered; hụt (gợi ý / bỏ ngày) ⇒ intensive.
  Người dùng chọn 36 thay cho đề xuất 42.
- `Ring.tsx` import `MASTER_THRESHOLD` từ `srs.ts` ⇒ % = total/36, đầy đúng lúc mastered. SPEC §3.1/§3.3/§12.2 + UI_DESIGN sửa.
- ~40 từ stage2/stage3 học dở thiếu điểm do dữ liệu cũ (trước M23) ⇒ GIỮ NGUYÊN, sẽ ôn thêm 1 vòng Nở hoa (người dùng chọn).
  Riêng 复习 (26đ, stage3) vẫn có thể lên thẳng (26 + 12 = 38).

### M23 vừa xong (2026-10-01) — MB-44: mỗi từ có đủ select_dialog + fill_dialog
- **DB nay: 353 SD + 353 FD** (trước 40 + 40) · **678/678 từ** đủ cả 2 dạng · 650 từ ở đúng 1 bài/dạng, 28 từ (chủ đề lẻ)
  ở 2 bài · 0 `blank_b` treo · 0 A=B · 0 cặp khác chủ đề · `word_state` md5 KHÔNG đổi (chỉ INSERT `exercises`).
- **Skill `vocabCsv2Json` luật mới** (SKILL.md Bước 3 + payload-schemas §3.10 + checklist + SQL §7.2): mỗi từ ≥ 1 SD và
  ≥ 1 FD (vai A/B), ⌈N/2⌉ bản ghi/dạng, vai A 1 lần/dạng, bạn cặp 2 dạng khác nhau. `validate_import.py` + builder HSK4
  CẢNH BÁO phủ sóng.
- **G1 `srs.ts`:** dạng đã có trong `cycle_completed_exercises` làm lại ⇒ 0 điểm (SPEC §3.2 bổ sung). **G2 `xepBai`:**
  bỏ màn hội thoại nếu mọi từ liên quan đã có màn cùng dạng trong phiên. Test R2g · K5 · K6.
- **Công cụ bổ sung (dùng lại được):** `npm run bo-sung:hoi-thoai -- <file…> [--dry-run]` (`scripts/bo-sung-hoi-thoai.mjs`,
  logic thuần `src/lib/boSungHoiThoai.ts`, validator dùng chung `kiemPayload` export từ `importValidate.ts`) ·
  `node scripts/chup-chu-de.mjs > du-lieu-import/bo-sung-hoi-thoai/chu-de-db.json` (snapshot DB) · builder
  `du-lieu-import/bo-sung-hoi-thoai/dung_bo_sung.py [NN]` đọc `nguon/NN.txt` (01–20 nhóm "3.", 41–60 HSK4).
- ⭐ **Bẫy pinyin đã gặp khi soạn 626 câu** (builder đã ép/chặn): `一 ___` (biến điệu theo đáp án — builder CHẶN, phải
  ép `一{yí}`/`一{yì}`) · 空 kòng (有空) · 只 zhī (一只) · 了 liǎo (穿不了) · 还 huán (还你钱) · 过 guò (没过 = không qua) ·
  好玩儿 hǎowánr · 奶奶 nǎinai · 妻子/男朋友 thanh nhẹ · tên riêng viết hoa (小王/西安/云南/美国/杭州…). 2 dòng đợt 1 đã
  nạp sai `一` được VÁ theo id (PATCH đúng 1 dòng/câu).
- Người dùng chốt văn phong (memory `dialog-exercise-style`): đúng level bộ từ, ít từ lạ, đời thường + công việc; câu gõ
  có từ gần nghĩa cũng điền được ⇒ GIỮ NGUYÊN.


### M22 vừa xong (2026-10-01) — MB-43
- `Ring.tsx`: màu viền = màu **stage** (bảng `Record<StageCay, …>`), độ đầy vẫn `min(total_points,30)/30`. Áp cả
  Dashboard "Vừa ôn gần đây" lẫn ring Player. `mocRing` + test đã XOÁ. SPEC §12.2 + UI_DESIGN đã sửa theo.
- Lý do: 6 màu ring trùng 6 màu level ⇒ 复习 (stage3 · 26đ) ra màu intensive, người dùng tưởng lệch level.
- Người dùng hỏi "đúng hết thì bỏ qua Nở hoa?" — ĐÚNG theo §3.1/3.3 (36 max ≥ 30 ⇒ stage3 lên thẳng mastered;
  intensive là vòng ôn bù). Giữ nguyên; muốn bắt buộc qua intensive thì là task SRS riêng.
- ⭐ **Âm phản hồi im trên iPhone = chế độ im lặng**, không phải bug: Web Audio (âm đúng/sai) câm theo công tắc
  im lặng, `<audio>` (đọc từ) thì không — phát đọc từ xong âm đúng/sai mới kêu. Người dùng đã xác nhận. Nếu sau
  này muốn kêu cả khi im lặng: `navigator.audioSession.type = 'playback'` (Safari ≥16.4).
- CDP: 5199 vẫn bị tiến trình khác chiếm ⇒ dùng cổng 5288; `rpc/vi_ruby` là RPC ĐỌC, loại khỏi bộ đếm lệnh ghi.

### M21 vừa xong (2026-09-30) — MB-42: từ kẹt "đến hạn nhưng không có bài"
- `player.ts` +`dangKhaDung(stage, dangCoRecord)` (dạng tính điểm THỰC dựng được màn; `trans_sentence`/`complete_situation`
  cũng cần record dù ngoài `CAN_RECORD`) + `moLaiNeuHetBai(tu, dangCo)` (đạt hết dạng thực có ⇒ `daDat = []` trong bộ nhớ).
- `srs.ts` `xuLyTraLoi` +tham số TUỲ CHỌN `dang_kha_dung` ⇒ `chuaDat` chỉ xét dạng thực có; rỗng ⇒ nhánh R2d (mở lại + retry cả bộ).
- `PlayerPage.napSession` áp `moLaiNeuHetBai` trước `xepBai` (trừ topic) và dispatch bản đã mở; `traLoi` truyền `dang_kha_dung`.
  **Lúc nạp không ghi DB** — DB đổi khi trả lời bài đầu tiên.
- Kiểm thật chỉ đọc: `/on-tap` ra Flashcard 复习, `data-so-tu-phien = 1`, 4 chấm (flashcard + 3 bài stage2), 0 lệnh ghi
  (chỉ `rpc/vi_ruby` đọc); `word_state` 复习 không đổi. ⚠️ Cổng 5199 đang bị tiến trình KHÁC chiếm — dev dùng cổng khác.

#### Chẩn đoán gốc (giữ để tra)
- Từ kẹt: **复习** stage2, `cycle_points 7 < 9`, đã đạt đủ 3 dạng CÓ record (`select_sentence`·`arrange_words`·
  `trans_collocation` — bài cuối dùng gợi ý nên chỉ +1), **không có record `fill_dialog`**, không có hàng retry.
- Chuỗi lỗi: `srs.ts` tính `chuaDat = ['fill_dialog']` (≠ rỗng ⇒ KHÔNG mở lại bộ bài theo R2d) → `locRetryTheoRecord`
  lọc mất vì từ không có record ⇒ `null` ⇒ không ghi retry → lần sau `xepBai` chỉ còn flashcard → `coBaiTinhDiem`
  false → `khong_co_tu`. Dashboard không lọc theo bài khả dụng nên vẫn đếm 1. **Kẹt VĨNH VIỄN** + bị cron phạt mỗi ngày.
- Phạm vi: **200/240 từ** không có `select_dialog`/`fill_dialog` ⇒ ở stage1/2/intensive điểm tối đa = đúng ngưỡng,
  dùng gợi ý 1 lần là kẹt. Hiện 5 từ stage1 + 20 từ stage2/intensive nằm trong vùng nguy cơ; mới 1 từ kẹt thật.
- R2d (M4a) chỉ phủ ca "đạt HẾT bộ bài lý thuyết", không phủ ca "đạt hết bài THỰC CÓ" — `srs.ts` không biết record.

### Bộ từ "HSK4 giao tiếp" (2026-09-30) — ĐÃ IMPORT 20/20 vào DB
- `du-lieu-import/hsk4-giao-tiep/hsk4-giao-tiep.csv` — **20 chủ đề · 438 từ · 40 ngữ pháp chủ đề**, soạn riêng cho
  người dùng (Test Engineer xưởng điện tử; phỏng vấn Embedded/EE/Test). Ưu tiên văn cảnh hơn danh sách HSK4.
  0 trùng giữa các chủ đề · 0 trùng 232 từ zh trong DB (đọc 30/09). Import muộn hơn thì đối chiếu DB lại.
- **JSON:** `import-01…20-*.json` cùng thư mục — **3.609 bài · 65 ngữ pháp CỦA TỪ (15%) · 40 bài 2 từ · 200 câu
  hội thoại**. 3 lớp validate **20/20**: ajv (schema) · `validate_import.py` · `npm run import:file -- --dry-run`
  (validator app, 0 cảnh báo trùng DB). 0 mô tả lộ đáp án.
- ⭐ **Cách sinh (giữ trong repo để sửa sau):** `nguon/NN.txt` (nguồn gọn: câu Trung TÁCH TỪ + nghĩa, cú pháp ghi ở
  đầu `nguon/dung.py`) → `PYTHONIOENCODING=utf-8 python du-lieu-import/hsk4-giao-tiep/nguon/dung.py [NN]` dựng JSON.
  **Pinyin sinh bằng pypinyin** + bảng ép `EP_TU` + luật tự viết: biến điệu 不/一 (KHÔNG biến điệu 3-3), A不A/V一V
  thanh nhẹ, 一 thứ tự (第一/周一/一号/一楼) giữ yī, tên riêng viết hoa. Builder in **báo cáo đa âm** để rà tay; ép
  từng token bằng `字{pinyin}`. Builder chặn: lệch thứ tự/số từ so với CSV, câu E thiếu từ, ___ ≠ 1, NP lệch CSV.
- ⚠️ **Bẫy pypinyin đã gặp:** 大夫→dàfū (đúng dàifu), 电子→diànzi, 肚子→dǔzi, 调休/重测/长 sai âm, thanh nhẹ bị đọc
  nặng (合同, 任务, 早上, 眼睛…), `tone_sandhi=True` biến điệu cả 3-3. Tất cả đã ép trong `EP_TU`.
- **Đã import 30/09** bằng `npm run import:file` (qua RLS), theo thứ tự người dùng chọn: **05–14 (công việc) →
  15–20 (đời sống) → 01–04 (tìm việc/phỏng vấn) cuối** ⇒ cron FIFO `order by added_at` sẽ kích hoạt đúng thứ tự đó.
  Kiểm chứng SQL (chỉ đọc): 20 chủ đề · word_state 438/438 (đều `new`, chờ) · bài tập khớp từng file · NP chủ đề 40 ·
  hội thoại 20 · 0 `blank_b_vocab_id` treo.
- **DB nay: 40 chủ đề · 678 từ · hàng đợi 638** (~200 từ H3 cũ đứng TRƯỚC vì added_at sớm hơn). ~128 ngày nếu 5 từ/ngày.
- ⚠️ **438 từ chưa có audio** (CLI không tự sinh TTS) — người dùng cần bấm "Tạo audio còn thiếu" ở Cài đặt.

### M20 vừa xong (2026-09-30) — MB-41
- Màn Từ vựng: khối **"Hội thoại chủ đề"** ngay DƯỚI khối "Ngữ pháp chủ đề", TRƯỚC ô tìm kiếm. Component
  `src/features/vocab/HoiThoaiChuDe.tsx`; dùng lại `docHoiThoai`/`chiaDam` (M7), 0 logic mới.
- Cố ý khác khối ngữ pháp: nền `surface-card` · gấp **CẢ khối** (mặc định ĐÓNG) · icon mới **`chat`** (tím) + "· N câu"
  + mũi tên (`back` xoay ±90°) · bong bóng A trái (`surface-sunken`) / B phải (`surface-chat-b`) · từ vựng tím đậm ·
  nút "Hiện nghĩa". **KHÔNG có nút loa** — người dùng chốt, đừng thêm lại.
- `key={topicId}` ⇒ đổi chủ đề tự đóng khối. Chế độ "Tất cả" / không có hội thoại / tải lỗi ⇒ không có khối.
- ⭐ **Khối PHỤ phải tải riêng, KHÔNG await trong đường tải chính** — đo thật: request hội thoại hỏng trong
  `Promise.all` ⇒ danh sách từ kẹt skeleton vĩnh viễn. State gắn `{ id, content }` chống phản hồi muộn của chủ đề cũ.
- ✅ **Lỗi CŨ M12b cũng đã vá (người dùng cho phép):** chặn `*topic_grammar*` từng làm danh sách từ kẹt skeleton
  (`napTu` `await` ngữ pháp TRƯỚC khi tải từ). Nay ngữ pháp cùng khuôn với hội thoại: state `nguPhapCua { id, muc }`,
  `nguPhap` là giá trị DẪN XUẤT lúc render. Đo lại: 0 từ + 3 skeleton → **10 từ, 0 skeleton**, chỉ khối ngữ pháp ẩn.

### Nạp dữ liệu CSV H3 (2026-09-29) — skill `vocabCsv2Json --import`
- **DB nay: 20 chủ đề · 240 từ.** Mẻ mới 17 chủ đề "3. …" · 205 từ · **1.723 bài** · 49 ngữ pháp CỦA TỪ (24%) ·
  23 ngữ pháp CHỦ ĐỀ · 17 hội thoại. Kiểm chứng SQL: word_state 205/205, 0 temp_id sót, 34/34 bài 2 từ cùng chủ đề.
- File JSON ở `du-lieu-import/csv-h3/import-01…17-*.json`. ⚠️ Cùng thư mục có 3 file CŨ `import-0X-topic-a/b/c.json`
  (23/09, của phiên trước) — KHÔNG thuộc mẻ này, đừng import lại (sẽ ra chủ đề trùng).
- **Import bằng `npm run import:file`** (đăng nhập + RPC `import_topic`, chịu RLS — luật §9.6), KHÔNG dán JSON qua
  connector như skill gợi ý (connector bỏ qua RLS + phải dán ~900KB). ⇒ **CLI không tự sinh TTS**: 205/240 từ
  `audio_url = null`, Player dùng Web Speech — bấm "Tạo audio còn thiếu" ở Cài đặt.
- Hàng đợi 205 từ, `new_words_per_day = 5` ⇒ ~41 ngày mới kích hoạt hết.
- 8 từ lặp giữa các khối CSV (迟到, 照顾, 习惯, 环境, 鼻子, 头发, 像, 经过) ⇒ mỗi chủ đề 1 bản ghi riêng (DEC-21).
- ⭐ **Cách sinh dữ liệu lớn đã hiệu quả:** soạn dạng gọn (câu tách token `chữ:pinyin`) + script dựng JSON, và
  **đối chiếu pinyin với `pypinyin`** (có sẵn trên máy) chỉ báo lệch âm/thanh thật (bỏ qua thanh nhẹ, 一/不, biến
  điệu 3-3, 儿). Bắt được 2 câu "sai cố ý" lại có thể hiểu đúng (长 cháng/zhǎng) và 1 mô tả lộ đáp án. Script ở
  scratchpad phiên này (không lưu repo). Lớp 1 validate chạy bằng `npx -y ajv-cli@5 --spec=draft2020` (máy không có
  `jsonschema`).

### M19 vừa xong (2026-09-28) — MB-40
- **Flashcard:** mặt sau LUÔN hiện pinyin; nút 拼 chỉ điều khiển mặt trước.
- **`src/components/TrangThai.tsx`** — `KhungRong` (icon hạt giống + CTA) · `KhungLoi` (tải lần đầu hỏng: Thử lại +
  lối thoát) · `BangLoi` (lỗi thao tác, banner đỏ cũ). Prop `gon` cho cột hẹp/panel. **Mọi màn dữ liệu mới về sau dùng
  3 component này**, đừng tự vẽ banner đỏ + `error.message` trần.
- **`src/lib/loi.ts` `dichLoiTai(unknown)`** — chỉ dịch mạng / hết phiên / 42501; lỗi `raise exception` tiếng Việt
  trả NGUYÊN VĂN. Nhận cả chuỗi vì state các màn đang giữ `error.message`.
- **4 lỗi thật đã vá:** Cài đặt & Từ vựng kẹt skeleton vĩnh viễn khi tải lần đầu lỗi · Lịch sử hiện "0 ruby" giả lúc
  đang tải · Tổng kết lỗi = ngõ cụt. Từ vựng nay tách `loiChuDe`/`loiTu` (tải) khỏi `loi` (thao tác).
- **Đăng xuất** (nhóm "Tài khoản" cuối màn Cài đặt, hiện email): máy này = `signOut({ scope: 'local' })` TƯỜNG MINH
  (mặc định supabase-js là `global`!) · mọi thiết bị = nhập lại mật khẩu → `signInWithPassword` xác minh → `global`.
  Máy khác thoát **chậm nhất 60′** (`jwt_exp = 3600` — `global` chỉ thu hồi refresh token). Đổi `jwt_exp` ⇒ sửa
  `PHUT_HET_HAN_PHIEN` trong `HopDangXuatMoiNoi.tsx`.
- ⭐ **Bẫy react-router 8 (đã đo):** location đổi trong `startTransition` ⇒ sau `signOut`, `<Navigate>` của `RequireAuth`
  render với location CŨ và **ghi đè** `navigate(..., { state })` của mình. Chữa bằng cờ `auth/dangXuat.ts`
  (`batDauDangXuat()` TRƯỚC signOut; `RequireAuth` thấy cờ ⇒ `null`; `DangNhap` hạ cờ khi mount). Ai thêm lối
  đăng xuất mới phải bật cờ này.
- ⚠️ **CHƯA kiểm** ca "Đăng xuất mọi thiết bị" THÀNH CÔNG (sẽ đá phiên thật trên máy khác) — chờ người dùng.
- ⭐ **Cách kiểm thử trạng thái không đụng DB:** lỗi = `Network.setBlockedURLs(['*/rest/v1/*'])` (đếm được 0 lệnh ghi);
  rỗng = `Fetch.enable` + `fulfillRequest` body `[]` CHỈ cho GET/HEAD; skeleton = `Fetch` hoãn `continueRequest` 3s.
  Khi đếm request trong CDP nhớ loại preflight `OPTIONS` (lần đầu tôi báo FAIL oan vì đếm cả nó).

### M18 vừa xong (2026-09-28) — MB-39
- **Ghép cặp:** 2 cột nay là **1 lưới chung** `grid-flow-col` + `gridTemplateRows: repeat(N, auto)` ⇒
  hàng i của 2 cột cao bằng nhau ⇒ 2 cột luôn bằng đáy, hàng thẳng. Thứ tự DOM vẫn trái rồi phải
  (Tab không nhảy). `min-w-0 break-words` chữa luôn lỗi cũ: từ tiếng Anh dài tràn ô trên Mobile.
- **Xáo từ:** `xepBai()` có tham số tuỳ chọn `rng` — có thì MỖI DẠNG xáo thứ tự từ riêng; không truyền thì
  giữ thứ tự cũ (test cũ khỏi sửa). `PlayerPage` truyền `Math.random`. **Thứ tự DẠNG giữ nguyên.**
- Chống lặp ranh giới: từ đầu dạng mới trùng từ của màn ngay trước ⇒ đẩy xuống cuối. Màn nhiều từ
  (ghép cặp, chấm AI) không tính "từ cuối" (`idCuoiCua` trả `null`).

### M17 vừa xong (2026-09-27) — MB-38
- **7 âm, tổng hợp bằng Web Audio** (0 file âm thanh, 0 package): `dung` · `sai` · `dung_goi_y` ·
  `hoan_thanh` · `va_ngay` · `ghep_cap` · `lat_the` (mặc định TẮT). **KHÔNG nhạc nền, KHÔNG âm lên giai
  đoạn, KHÔNG âm nhận ruby** — người dùng đã chốt bỏ.
- ⭐ **Âm đúng/sai phát NGAY Ở DÒNG CHẤM trong từng màn bài tập**, KHÔNG ở `PlayerPage.traLoi`
  (hàm đó chạy lúc CHUYỂN màn, trễ 600/1000ms, và đè lên tiếng đọc từ kế tiếp). Test X2 canh khoảng
  chờ `? 600 : 1000`, X5 canh cả 8 màn đều có `phatAmThanh(`.
- Tổng kết phát **đúng 1 âm** (`hoan_thanh`, ref guard chống StrictMode).
- Cài đặt: nhóm **"Âm thanh"** ở cột phải màn Cài đặt: công tắc tổng + thanh trượt âm lượng + công
  tắc từng âm + nút nghe thử (nghe thử **bỏ qua** công tắc). **localStorage** khoá `vb-am-thanh`,
  theo thiết bị. Tắt âm nào thì âm đó im, **không có âm thay thế**.
- Refactor nhỏ: công tắc tách thành `src/components/CongTac.tsx`; hằng số lớp kiểu của màn Cài đặt
  chuyển sang `src/features/settings/kieu.ts`.
- ⭐ **Cách kiểm thử âm không đụng DB:** trang kiểm thử tạm (HTML + tsx ở gốc) gắn thẳng các màn bài
  tập, **không đăng nhập** ⇒ RLS chặn mọi lệnh ghi; bọc `createOscillator`/`createBufferSource` để
  đếm và ghi thời điểm từng âm. Đo xong phải xoá 2 file tạm.

### M16 vừa xong (2026-09-24)
- Nhóm **"Giao diện"** ở đầu màn Cài đặt, 3 nút Sáng / Tối / Hệ thống. Lưu **localStorage** theo từng
  thiết bị, khoá `vb-giao-dien`. **KHÔNG** qua bảng `settings`.
- ⚠️ `index.html` có **script inline lặp lại** khoá + phép ánh xạ của `giaoDien.ts` (phải chạy trước
  khi app tải để không nháy). Có test `X-giaodien` canh — sửa 1 nơi phải sửa cả nơi kia.
- Đã sửa lỗi tiềm ẩn từ M0: thêm **`color-scheme`** vào cả 3 nhánh `tokens.css`.
- ⚠️ **Bài học công cụ:** script chèn qua `Page.addScriptToEvaluateOnNewDocument` chạy lúc
  `document.documentElement` còn **`null`** ⇒ muốn `MutationObserver` thì phải quan sát `document`.
- ⚠️ **Giới hạn có từ trước (không thuộc M16):** chặn localStorage thì Supabase **không giữ được phiên
  đăng nhập** ⇒ người dùng không vào được app. Theme thì vẫn không làm vỡ gì.

### 🔴 Sự cố 2026-09-24 — xoá nhầm dữ liệu thật (MB-36), ĐÃ khôi phục
- Script CDP của M15 `DELETE`-sạch bảng `nhat_ky_ngay` (6 lần trong 2 phút) ⇒ mất dòng học 24/9.
- **Khôi phục được** nhờ `chot_nhat_ky_ngay()` tính lại cả ngày từ `review_log` (M14/Q4) — nếu
  hồi đó chọn "cộng delta" thì mất vĩnh viễn.
- ⚠️ Tôi còn kết luận sai từ chính dữ liệu mình vừa phá ("chưa vào Tổng kết lần nào"). `edge_logs`
  chứng minh ngược lại: `chot_nhat_ky_ngay` → 200 lúc 07:30 và 08:45.
- Đã thêm **luật §9.7** + **cổng test `anToanScript.test.ts`** (AT1–AT3), đã chứng minh test biết đỏ.
- **Nhớ:** muốn biết tính năng có chạy không thì xem `edge_logs`, đừng suy từ bảng mình vừa đụng.

### M15 vừa xong (2026-09-24)
- Luật ruby: **5 phút = 1 ruby, trần 12 ruby/ngày**; **5 ruby vá 1 ngày** quá khứ (không vá hôm nay).
- ⭐ **Số dư ruby KHÔNG lưu ở đâu cả** — dẫn xuất từ `nhat_ky_ngay`: `Σ ruby mỗi ngày − 5 × số ngày
  da_va`. Đừng "tối ưu" bằng cách thêm cột số dư: đó là đưa cùng một sự thật về 2 nơi.
- ⭐ **Tổng ruby do SERVER tính** (`vi_ruby()`) vì màn Lịch sử lazy-load ⇒ client không bao giờ đủ
  dữ liệu để cộng đúng. Ruby TỪNG NGÀY thì client tự tính (`lichSu.ts`) cho khỏi gọi server mỗi ô.
- `va_ngay()`: **CHÈN trước, KIỂM số dư sau** — cả hàm 1 transaction nên thiếu ruby là rollback;
  thứ tự này khử kẽ hở "đọc số dư rồi mới ghi".
- Route ẩn **`/lich-su`** (không có trong `MENU`), vào từ nút "Xem tất cả" cạnh dải 7 ngày.
- ⚠️ **Màu:** ví ruby + ô ngày dùng token hồng `award-*`; **nút phải dùng tím** — `UI_DESIGN.md` §63
  cấm hồng trên phần tử bấm được.
- ⚠️ **Bài học kiểm thử:** DB có người dùng THẬT đang học (70 dòng `review_log` hôm nay) ⇒ script
  CDP **đừng assert số tuyệt đối** cho streak. Lần chạy đầu đỏ 2 ca chỉ vì tôi giả định "hôm nay
  chưa học"; đã đổi sang assert tương đối (`streakSau === streakTruoc + 3`).

### M14 vừa xong (2026-09-23)
- ⚠️ **ĐÃ MẤT DỮ LIỆU THẬT:** xoá chủ đề cũ ⇒ `review_log` về 0 dòng, streak về 0, mất lịch sử
  16–21/09. `review_log.vocab_id` có `on delete cascade` mà Dashboard tính streak/phút từ đó.
  **Không khôi phục được** — backfill chỉ chép được cái đang còn.
- Bảng thứ **12** `nhat_ky_ngay` (`ngay` + `thoi_gian_ms`), **CỐ Ý không có khoá ngoại nào** —
  đó là toàn bộ lý do nó tồn tại. Có test **N5** canh: ai thêm FK vào là test đỏ.
- RPC `chot_nhat_ky_ngay()` gọi ở màn **Tổng kết**, **tính lại cả ngày rồi upsert** (+ `greatest`)
  chứ không cộng delta ⇒ gọi nhiều lần vẫn đúng, lượt sau tự vá lượt trước bị mất.
- Dashboard: quá khứ đọc `nhat_ky_ngay`, **hôm nay hợp thêm** `review_log` để phiên đang dở vẫn
  lên streak ngay. `tinhStreak`/`dai7Ngay` không đổi dòng nào.
- ⚠️ **PostgREST từ chối `DELETE` không có điều kiện lọc** (an toàn mặc định) — script dọn phải
  thêm filter kiểu `?ngay=gte.2000-01-01`.
- ⚠️ **Luật rút ra:** trước khi cho 1 bảng gánh 2 vai, hỏi 2 vai đó có CÙNG VÒNG ĐỜI không.
  `review_log` vừa là sổ chi tiết theo từ (chết theo từ là đúng) vừa là nhật ký học theo ngày
  (không được chết theo từ) — gộp chung nên cascade của vai này giết vai kia.

### M13 vừa xong (2026-09-23) — audit trước khi sinh dữ liệu lớn
- **Phát hiện nặng:** `import-schema.json` kiểm rất chặt nhưng chỉ chạy NGOÀI app; nút Import của app
  chạy `importValidate.ts` vốn chỉ kiểm "key có mặt" ⇒ **18/19 file dị dạng LỌT**, gồm đúng nguyên văn
  bug MB-21 (`tokens` dùng khoá `word` thay vì `text`) và `lang=zh` mà `pinyin = null`.
- Đã siết `importValidate.ts` lên đúng bằng JSON Schema: 1 bảng `LUAT_PAYLOAD` mô tả SHAPE từng field
  (thay 2 bảng rời), kiểm giá trị vocab, kiểm `dialogue`, chặn `blank_b` trỏ về chính từ A.
- **Test S11 chống lệch:** đọc `import-schema.json`, xoá từng field bắt buộc và đòi validator TS phải
  báo lỗi ⇒ schema đổi mà validator quên theo là `npm test` đỏ ngay.
- ⚠️ **Luật rút ra:** khi có 2 cổng validate cho cùng một dữ liệu, cổng nào NGƯỜI DÙNG THẬT SỰ đi qua
  mới là cổng có giá trị. Cổng chặt mà tuỳ chọn (cần cài ajv) không bảo vệ được gì.

### M12b vừa xong (2026-09-23)
- **Luồng ôn theo chủ đề nay có 5 chặng:** chọn chủ đề → `/on-tap/ngu-phap?...&giai_doan=dau`
  → Player (`che_do=topic`) → `...&giai_doan=cuoi` → `/on-tap/hoi-thoai` → Tổng kết.
  Chủ đề KHÔNG có mục ngữ pháp ⇒ route tự chuyển tiếp ngay, luồng cũ nguyên vẹn 100%.
- **Cố ý dựng ROUTE RIÊNG, không nhét vào `PlayerPage`/reducer** — mỗi lần thêm chế độ vào Player
  đều phải trả lời "cái gì làm session kết thúc?" và đã trả giá ở M7 (MB-26). Route riêng thì
  câu hỏi đó không phát sinh.
- `src/lib/nguPhap.ts` (9 ca test): `docNguPhap` · `noiTiepTheo`. Hàm `noiTiepTheo` tách riêng vì
  đây là chỗ dễ sai nhất: nhầm nhánh `cuoi` là **mất màn hội thoại kết thúc** (§4.5).
- ⚠️ **Bẫy đã né trong `Grammar.tsx`:** bản cũ `content_target.split(vocab.word)`. Ngữ pháp chủ đề
  không có từ nào để in đậm, mà `split('')` **cắt vụn từng ký tự** ⇒ phải chặn bằng `tuDam ? ... : [...]`.
- ⚠️ **Mẫu lỗi script lặp lần thứ 4:** `innerText` trả về chữ **ĐÃ bị CSS `text-transform: uppercase`
  biến đổi** ⇒ so khớp "Ngữ pháp chủ đề" trượt, 2 mục báo đỏ oan. Script CDP so khớp chuỗi UI phải
  dùng regex `/.../i`, đừng so khớp phân biệt hoa/thường.
- Màn Từ vựng: khối **"Ngữ pháp chủ đề (N)"** gấp/mở, đặt trên ô tìm kiếm; không có ngữ pháp thì
  KHÔNG hiện khối (không tạo trạng thái rỗng thừa). Chế độ "Tất cả từ vựng" không có khối này.

### M12a vừa xong (2026-09-22)
- **2 loại ngữ pháp, đừng lẫn:** `exercises.type='grammar'` = ngữ pháp **CỦA TỪ** (gắn 1 vocab, dạng
  CÓ ĐIỀU KIỆN) · bảng mới `topic_grammar` = ngữ pháp **CỦA CHỦ ĐỀ** (không gắn từ nào, không tính điểm).
- **Nguyên nhân "từ nào cũng có ngữ pháp" nằm ở SKILL, không ở app** — `SKILL.md` Bước 3.3 bắt "9 dạng
  bắt buộc" trong đó có `grammar`. Nay còn **8 dạng bắt buộc**; `grammar` có bảng tiêu chí riêng.
  ⚠️ **Dữ liệu CŨ trong DB không đổi**: vẫn 16 `grammar` / 49 từ. Muốn giảm phải import lại file mới.
- Bảng thứ **11** `topic_grammar` (migration `0013`) — từ nay mọi chỗ đếm bảng là **11**.
- `import_topic()` sửa **tại chỗ ở `0007`** (không copy sang file mới) + trả thêm `so_ngu_phap`.
- Màn Import nhận **nhiều file**, mỗi file 1 transaction; reducer `importUi` nay là **danh sách file**.
- ⚠️ **Gate đỏ âm thầm 3 milestone**: `check:schema` assert `settings === 5` key trong khi M6a/M6c/M11
  đã thêm 3 key ⇒ 2/14 mục đỏ từ M6c mà không ai chạy lại. Đã sửa sang **liệt kê 8 key tường minh**.
  → **Luật rút ra: assertion chốt cứng một CON SỐ sẽ mục ruỗng khi dữ liệu lớn lên — assert theo DANH SÁCH TÊN.**
- ⚠️ `import-schema.json` có `additionalProperties: false` — thêm khoá mới vào file import mà quên sửa
  schema thì chính schema từ chối file.
- CSV mới của người dùng: `du-lieu-kiem-thu/tu-vung-moi.csv` — **6 khối, 68 từ, 6 mục ngữ pháp**,
  3 khối CHƯA CÓ TÊN (khối 4/5/6). `越来越` (cuối khối 5) là ca "nghi ngữ pháp nhưng thiếu nhãn".
- **Tác dụng phụ của lần kiểm thật (đã kiểm, cần biết):** import 2 file mẫu → TTS nền tự chạy cho
  MỌI từ thiếu audio (không chỉ từ vừa import) ⇒ `vocab.audio_url` nay **46/49**. (Không đo số liệu
  TRƯỚC lần kiểm nên không biết đã bù thêm bao nhiêu từ; lúc chạy, thanh tiến độ hiện 17 từ thiếu
  audio và bị cắt giữa chừng khi tôi đóng Chrome ⇒ 3 từ còn lại vẫn thiếu, bấm "Tạo audio còn thiếu"
  ở màn Cài đặt là xong.)
  2 topic kiểm thử đã xoá sạch, DB về đúng nguyên trạng (topics 5 · vocab 49 · topic_grammar 0).

### Chỉnh tay DB 2026-09-20
- `npm run due:today -- N` (script mới `scripts/keo-den-han.mjs`): kéo N từ chưa đến hạn về hôm nay,
  round-robin theo stage, **bỏ qua từ đã có log hôm nay** (Player sẽ không nhận — DEC-06). Lần chạy
  20/09 kéo được 5 từ (doctor, teacher, 晴天, 西瓜 → stage2; 橙子 → intensive); tổng due = 10.

### Rà soát lại giới hạn từ/lượt (2026-09-20, người dùng báo "vẫn load hết")
- Thêm `data-so-tu-phien` lên `<main>` của `ExerciseShell` — script kiểm đọc được số từ trong session
  mà không phải chơi hết lượt. Kết quả: giới hạn 2 → session **2 từ** (giới hạn 10 → 3 từ).
- End-to-end với bộ lái trên từ stage `new`: ôn đúng **2 từ** → **tự sang Tổng kết** → còn 20 từ due.
  ⇒ Code hiện tại ĐÚNG. Hiện tượng người dùng thấy nhiều khả năng là **bản trước khi vá "đếm tại
  nguồn"** (M11) — nhắc người dùng tải lại trang / khởi động lại `npm run dev`.
- Lần này seed thêm 1 chủ đề "Kiểm thử" (đã ôn 2 từ). Hiện có **3 chủ đề cùng tên "Kiểm thử"** trong DB
  — KHÔNG tự xoá (xoá từ = mất review_log hôm nay ⇒ lệch streak/điểm); để người dùng dọn ở màn Từ vựng.
- ⚠️ **Mẫu lỗi phải nhớ**: để callback (`onTraLoi`…) trong deps của `useEffect` có `setTimeout` là
  **đặt bom hẹn giờ** — callback tạo mới mỗi render ⇒ effect chạy lại ⇒ thêm timer ⇒ trả lời hộ dây
  chuyền. Đã vá `TracNghiem`; `FastDecision` vốn đã dùng ref từ M4a.
- ⚠️ **Mẫu lỗi thứ 2**: reducer `luu_ok` của bài cuối vừa cộng `da_xong_tu` vừa chuyển `het_session`
  trong CÙNG một dispatch ⇒ **không bao giờ** quan sát được qua state ở `dang_on`. Mọi bộ đếm "đã
  hoàn thành bao nhiêu từ" phải đếm **tại nguồn** (trong `traLoi`), không suy từ state.
- `dungPhim.ts` gom phím tắt; quy ước Enter/Shift+Enter/Space/1–4 ghi ở đầu file đó.
  ⚠️ **Hook tên là `useDungPhim`** (đổi 2026-09-23) — `react-hooks/rules-of-hooks` nhận diện hook
  QUA TÊN, đặt tên tiếng Việt thuần (`dungPhim`) làm lint báo **3 lỗi đỏ suốt từ M11**. Mọi hook
  tự viết về sau bắt buộc có tiền tố `use`; phần còn lại của API vẫn đặt tên tiếng Việt.
  (Tên FILE giữ nguyên `dungPhim.ts`.)
- `max_tu_moi_luot` mặc định 10 — Player dừng lượt khi đủ số từ, bấm "Bắt đầu ôn tập" để ôn tiếp.
- ⚠️ Bộ lái CDP cũ hỏng khi đổi nhãn UI: "Chạm để xem nghĩa" → "Chạm hoặc bấm Space", nút "Good" →
  "Good 3". Script kiểm nên khớp **bắt đầu bằng**/chứa chuỗi, đừng so khớp tuyệt đối.

### M10 vừa xong (2026-09-19)
- Flashcard: Player **quên truyền `ghost`** nên mất nút 拼; thêm phím tắt Space/1/2/3 (đăng ký trong
  component để tự gỡ, bỏ qua khi con trỏ ở ô nhập hoặc đang gõ IME); mặt sau thêm pinyin + câu ví dụ.
- **IME tiếng Trung**: `slice()` chạy ngay lúc đang gõ làm mất chữ Hán đã nhập. Nay chỉ cắt sau khi
  `compositionend`. Vá thêm: Enter khi `isComposing` không còn bị tính là nộp bài.
- **Lỗi dữ liệu của chính tôi ở M9**: `kiem-thu.json` dồn 2 chỗ trống vào câu B, trong khi quy ước
  (xác minh trên dữ liệu gốc) là **1 chỗ trống mỗi câu**. Đã sửa + thêm `tachChoTrong` phòng vệ.
- Màn Từ vựng có chế độ **"Tất cả từ vựng"** + lọc theo stage + chip stage mỗi dòng.
- Kiểm 300 dòng `review_log`: luồng ôn hằng ngày **vốn đã lọc đúng dạng bài theo stage**; 10 dòng
  "lệch" đều thuộc ôn theo chủ đề (đúng thiết kế MB-26).
- ⚠️ Bài học lặp lại lần 2: selector `.font-han` trần trong script CDP **bắt trúng nút 拼 ở header** —
  phải bám vào thẻ nội dung (`.rounded-24 .font-han`).

### M9 vừa xong (2026-09-19)
- `review_log.thoi_gian_ms` (migration `0011`) — đo thật, **trần 5 phút/lượt**, **chia đều** khi 1 màn
  ghi nhiều dòng log. Dòng cũ để `null`, Dashboard bỏ qua khi cộng.
- Dải 7 ngày: thêm **số ngày + "Hôm nay" + số phút**; vấn đề cũ chỉ là nhãn thứ gây hiểu nhầm, logic
  "7 ngày gần nhất, hôm nay ở cuối" vốn đã đúng từ M6b.
- Mọi `<dialog>` căn giữa (`m-auto` + `max-h-85dvh` + cuộn trong). `HopXacNhan` nay ở `src/components/`.
- **Bộ dữ liệu kiểm thử**: `npm run seed:test` tạo chủ đề "Kiểm thử" 14 từ đủ 5 stage, đến hạn hôm nay.
  Chạy lại nhiều lần được (mỗi lần 1 chủ đề mới); dọn bằng cách xoá chủ đề ở màn Từ vựng.
  ⚠️ Lần kiểm thật 19/09 đã ôn hết phần `new`/`stage1` của bộ này (25 dòng log) — muốn test lại từ đầu
  thì chạy `npm run seed:test` lần nữa.

### M8 vừa xong (2026-09-19)
- Xác nhận 2 giả định của người dùng bằng cả code lẫn DB: RPC import **luôn `insert into vocab`**
  (không tái dùng dòng cũ) ⇒ mỗi từ chỉ thuộc 1 chủ đề; "晴天" là 2 dòng vocab độc lập.
  Nhưng `vocab_topics` vẫn là n-n nên RPC `xoa_chu_de` **phòng thủ**: chỉ xoá hẳn từ CHỈ thuộc riêng
  chủ đề đó, từ còn thuộc chủ đề khác thì chỉ gỡ liên kết.
- `payload->>'blank_b_vocab_id'` KHÔNG có khoá ngoại ⇒ xoá từ vai B sẽ để tham chiếu treo. Cả UI lẫn
  RPC đều chặn trước; kiểm thật: xoá 香蕉 bị chặn vì đang là vai B trong câu của 苹果.
- Sửa `word` ⇒ ghi `audio_url = null` (M6c đặt tên file theo `hash(word‖lang‖voice)`).
- Ô tìm kiếm và ô tên chủ đề dùng **state suy dẫn theo route** thay vì `setState` trong `useEffect`
  (ít cảnh báo lint hơn và không nhấp nháy khi đổi chủ đề).

### M7 vừa xong (2026-09-19)
- 2 chỗ trong code CHẶN chế độ topic, đã mở đúng cách: `gomSession` loại từ `next_review_date = null`
  và `mastered` (4/5 từ "Trái cây" bị loại) ⇒ viết `gomSessionTopic` RIÊNG, không sửa hàm cũ;
  `xepBai` bỏ dạng đã có trong `cycle_completed_exercises` ⇒ thêm cờ `boQuaDaDat`.
- **Cạm bẫy đã né:** `xuLyTraLoi` có sẵn `dang_due` trông như dùng ngay được cho từ chưa due, nhưng
  nhánh `la_bai_cuoi_cua_tu` vẫn có thể dời `next_review_date` / đẩy vào `daily_retry_queue` nếu
  `cycle_points` cũ đã đủ ngưỡng. Chế độ topic vì vậy ghi **log-only** (`p_state: null`) cho từ chưa due.
- **PostgREST:** KHÔNG có FK trực tiếp `vocab_topics ↔ word_state` (cả hai chỉ trỏ sang `vocab`) ⇒
  nhúng lồng nhau trả PGRST200, phải tách 2 truy vấn.
- **Bug thật đã vá (MB-26):** thiếu bộ lọc "từ đã phục vụ trong lượt" ⇒ `napSession` dựng lại đúng
  session đó mãi mãi. Hậu quả trên DB thật: **~82 dòng `review_log` rác ngày 19/09** cho 西瓜 và
  `total_points` 西瓜 6 → 14 (không xoá, chỉ ghi nhận để sau này đọc số liệu ngày 19/09 biết lý do).
- Dữ liệu đổi do kiểm thật: teacher/doctor `total_points` 12 → 18; một số từ "Trái cây" có thêm dòng
  log điểm 0 (đúng thiết kế).

### M6c vừa xong (2026-09-19)
- ⚠️ **Tài liệu sai đã sửa:** Google KHÔNG có `cmn-CN-Neural2-*` — kiểm thật trả
  `Voice 'cmn-CN-Neural2-C' does not exist`. Nếu không phát hiện sớm thì MỌI lời gọi TTS đều 400.
  Đã sửa `SPECIFICATION.md` §2/§9/§11, `settings.ts`, và **dữ liệu `settings.tts_voice` trong DB**
  (migration `0009` tự đổi `Neural2`→`Wavenet`, giữ nguyên chữ cái nên lựa chọn cũ không mất).
  Tiếng Trung: `cmn-CN-Wavenet-A..D`; tiếng Anh: `en-US-Neural2-C/F/D/J`.
- CORS: Google cho phép gọi **thẳng từ browser** (preflight 200) ⇒ không cần proxy/Edge Function.
- Bucket `audio`: công khai ĐỌC, ghi chỉ `authenticated` — đã kiểm cả 3 chiều (ghi có token 200 ·
  đọc không token 200 · ghi không token bị chặn).
- Tên file `{lang}/{voice}/{hash(word‖lang‖voice)}.mp3` ⇒ **9 dòng vocab nhưng chỉ 8 lời gọi API**
  (2 dòng "晴天" ở 2 topic dùng chung file); đổi giọng ra file khác nên không phát nhầm giọng cũ.
- Khoá Google nằm ở bảng `settings` (nhập tại Cài đặt), **không có biến `VITE_` nào** — đã grep `dist/`
  xác nhận khoá không lọt vào bundle.

### M6b vừa xong (2026-09-18)
- `src/lib/dashboard.ts` — **thuần** (19 ca test): `gioVN` (dùng `hourCycle: 'h23'` để nửa đêm ra **0**,
  không phải 24) · `loiChao` · `ngayDayDu` ("Thứ Sáu, 18 tháng 9" — KHÁC `dinhDangNgayVN` của Tổng kết)
  · `luiNgay` · `tinhStreak` (hôm nay chưa ôn thì đếm từ hôm qua) · `dai7Ngay` · `gomKhuVuon` (luôn đủ
  6 stage) · `demDenHan` · `ngayCoOn` (quy `timestamptz` về ngày **giờ VN**).
- `src/features/dashboard/DashboardPage.tsx` — 5 query song song; **2 nguồn màu tách bạch**: chip khu
  vườn theo stage (tượng trưng) ≠ ring "Vừa ôn" theo `total_points` thật.
- `Ring` thêm prop tuỳ chọn `noiDung` (Dashboard đặt chữ Hán); Player không truyền ⇒ giữ icon cây.
- `icons.tsx` +1 icon `tick`. **Không thêm icon lửa** — `an-mung` trùng nguyên văn path mockup, chỉ cần
  ghi đè `fill`/`stroke` từ chỗ gọi (`Icon` trải `...rest` sau cùng).
- Không thêm token nào: tint khu vườn của mockup trùng khít `danger-bg`/`tint-orange`/`warn-bg`/
  `tint-lime`/`success-bg`, màu icon = `ring-0..5`.
- **Kiểm thật CDP 20/20**, số liệu đối chiếu thẳng PostgREST: đến hạn 1 · quá hạn 4 · streak 3 ·
  khu vườn `[0,5,0,0,1,3]` · 8 ring · `stroke-dashoffset` khớp công thức `min(total,30)/30`.
- **2 lần "FAIL" đầu là lỗi script, không phải lỗi app** (ghi lại để lần sau không đi nhầm đường):
  selector bắt trúng sidebar thay vì thẻ số; và màn đầu Player là **Flashcard — mockup 06 cố tình
  KHÔNG có ring**, nên phải render `Ring` rời (import module app qua Vite dev) để kiểm, cũng nhờ vậy
  mà không ghi thêm dòng `review_log` rác vào DB thật.

### M6a vừa xong (2026-09-18)
- `src/lib/settings.ts` (9 ca test) — `docCaiDat` **chỉ nhận đúng kiểu, sai kiểu rơi về mặc định**
  (jsonb: `"5"` khác `5`, lưu sai là cron nhỏ giọt hỏng) · `anKhoa` (`sk-••••3f2a`) · `chinhSoTuMoi` kẹp 1..50.
- `src/lib/thongBao.ts` (8 ca test) — `thoiGianTuongDoi` · `demChuaDoc`.
- `src/features/settings/CaiDatPage.tsx` — 3 nhóm mockup 17/18, **ghi ngay khi đổi** + "Đã lưu";
  khoá và model có **nút Lưu tường minh** (onBlur không đáng tin — xem MB-23).
- `src/features/notifications/PanelThongBao.tsx` — panel PC xổ cạnh sidebar / sheet Mobile;
  `TrangThongBao` cho route ẩn `/thong-bao`.
- `AppShell`: nút chuông **đã hoạt động** (bỏ trạng thái bất hoạt của M4a) + chấm báo theo số tin chưa đọc.
- Kiểm thật CDP **18/18** + phép thử riêng: gỡ `VITE_OPENROUTER_*` khỏi env → app **vẫn gọi AI thật
  thành công** nhờ đọc `settings`.

### M5 vừa xong (2026-09-18)
- `src/lib/aiCore.ts` — **thuần** (18 ca test): `docJsonAI` (strip code-fence retry §7.4) ·
  `docKetQuaCham` (verdict lạ → `fail`, id thiếu → `thieu[]`) · `promptCham`/`bodyCham` (§7.2–7.3) ·
  `promptGiaiThich`/`docGiaiThich` (§8).
- `src/lib/ai.ts` — I/O: gọi OpenRouter thẳng từ browser (MB-04); khoá đọc **`settings` trước, env sau**;
  `giaiThichBai` đọc cache `exercises.ai_explanation` trước khi gọi.
- 3 màn mới: `TuLuan` (nhập, ẩn hẳn Gợi ý §6.4) · `ChamAI` (3 màu thẻ theo verdict + "Chấm lại") ·
  `GiaiThich` (`<dialog>` native, nút ghost thứ 4).
- `xepBai` chèn màn `cham_ai` sau mỗi nhóm nhập cùng dạng ⇒ **đúng 3 request/session** (DEC-14).
- **Kiểm thật có gọi AI:** 12 dòng `review_log` `points = 4` (verdict good) · thiếu khoá → **0 request**
  + thẻ lỗi giữ nguyên câu · bài có cache → **0 request** (DEC-23).
- **2 bug thật đã vá** (MB-22): thiếu trigger chấm → kẹt "Đang chấm bài…" vĩnh viễn;
  lượt retry gộp dạng của mọi từ ⇒ dựng bài stage 3 cho từ stage 1.

### M4b vừa xong (2026-09-17)
- `src/lib/player.ts` — `Man` +5 biến thể; `THU_TU_MAN` đủ 14 dạng; **bài 2 từ** (`select_dialog`/
  `fill_dialog`) xếp theo RECORD nên 1 câu chỉ hiện 1 lần dù A, B hay cả 2 cùng due (§4.4);
  `soKhopDapAn` · `chamArrange` · `locRetryTheoRecord` · `coBaiTinhDiem`. **46 ca test**.
- 3 component mới: `DienTu` (pattern 2 — **1 input trong suốt phủ N ô, IME gõ được**; `en` 1 ô dài) ·
  `SapXep` (pattern 3) · `HoiThoai` (pattern 7, Select 4 chip / Fill 2 ô). `TracNghiem` +2 chế độ
  (`select_on_describe`, `select_sentence` 1 cột).
- `PlayerPage`: query bài tập **2 chiều** (theo `vocab_id` và theo `payload->>blank_b_vocab_id`), gộp
  loại trùng theo `exercises.id`; `dialogXong` ghi log cho từng từ due; lọc hàng retry theo record.
- Kiểm thật: **cả 8 dạng đều đã chạy trên dữ liệu thật** (`review_log` 17/9 có đủ translate ·
  listen_fill · trans_collocation · select_dialog · fill_dialog · select_on_describe ·
  select_sentence · arrange_words). `fill_dialog` ghi đúng **2 dòng cho 2 từ** (橙子 + 葡萄).
- **2 bug thật phát hiện khi kiểm** (đã vá, xem MB-21): session lặp vô hạn flashcard/grammar;
  `arrange_words` đọc sai khoá payload (`word` thay vì `text`) làm chip mất chữ Hán.

### M4a vừa xong (2026-09-16)
- `src/lib/player.ts` — thuần (chỉ import `srs.ts`): `homNayVN` · `xepBai` (thứ tự theo dạng bài xen kẽ
  từ, bỏ dạng đã đạt, `la_bai_cuoi_cua_tu`) · `chamMatching` · `chonNghiaFastDecision`/`xaoTron` (rng
  tiêm) · `tongHopTongKet` · `demConCho` (= due − đang retry) · `mocRing` · reducer `giamPlayer`. 26 ca test.
- `supabase/migrations/0008_luu_tra_loi.sql` — RPC ghi 1 transaction (state | log | retry thay thế theo
  (từ, ngày) | `p_xoa_retry`), `npm run test:player` 4/4.
- `src/features/player/` — `ExerciseShell` (ring + 3 ghost + X, dots = **khối dạng bài**, ≤6) · `Ring` ·
  5 màn bài (`TracNghiem` gộp Selection+Audio, `FastDecision`, `Matching`, `Flashcard`, `Grammar`) ·
  `PlayerPage` (`/on-tap`, `?che_do=retry`) · `TongKetPage` (`/on-tap/tong-ket`) — **2 route ngoài AppShell**.
- `src/lib/tts.ts` — `phatAm`: `audio_url` → `<audio>`, không có → Web Speech (`zh-CN`/`en-US`).
- **Kiểm thật CDP 2 lượt** trên 8 từ due thật + lượt retry: 16/18 (2 ca đỏ chỉ vì hết từ due). `npm test` **116/116**.
- **3 phát hiện khi kiểm thật** (đều đã vá, ghi MB-20): (1) bug side-effect trong updater setState →
  StrictMode ghi đúp review_log; (2) lỗ hổng spec: đạt hết bộ bài mà thiếu điểm (do gợi ý) → từ kẹt vĩnh
  viễn → chốt "mở lại bộ bài + retry cả bộ"; (3) "Còn N từ" = due − retry, không lọc theo log.
- **Chưa kiểm thật được vì hết dữ liệu:** nhánh "Còn N từ đang chờ" trên Tổng kết (đã có unit test);
  Matching sai → tô đỏ (script ghép sai 1 lần nhưng không chụp). Kiểm lại khi cron kích hoạt từ mới.

### M2b vừa xong (2026-09-16)
- `src/lib/importUi.ts` — thuần (được `import` từ `importValidate.ts`, cấm react/supabase/node):
  `docFileImport` (JSON hỏng → lỗi `(JSON)`, không ném) · `timTuTrung` · `dinhDangKB` ·
  `dongCanhBao` (câu chữ nguyên văn mockup) · `dichLoiImport` (giữ nguyên message tiếng Việt từ
  `raise exception`) · **reducer `giamTrangThai`** 6 bước (`chon_file → loi_file | preview →
  dang_import → ket_qua_ok | ket_qua_loi → thu_lai`). 22 ca test.
- `src/features/import/ImportPage.tsx` — component chỉ đọc file / query trùng / gọi
  `supabase.rpc('import_topic')` rồi dispatch. `DOM.setFileInputFiles` (CDP) nạp file được.
- Kiểm thật CDP **17/17** gồm 1 import thật. `npm test` **89/89**.
- **Chưa làm:** TTS nền sau import (M6). Icon file ở card trái = nửa trái cuốn sách — **đúng nguyên
  văn mockup màn 16** nhưng trông giống hình chữ nhật hẹp; đã báo người dùng, chờ quyết.

### App shell vừa xong (2026-09-16)
- `src/components/icons.tsx` — 6 icon nav (`<Icon ten size/>`), path trích nguyên văn mockup.
  **Chỉ 6 icon này**, không có icon cây.
- `src/features/shell/menu.ts` — `MENU` 5 mục: 1 nguồn cho sidebar, tab bar, stub và route.
- `src/features/shell/AppShell.tsx` — layout route; `hidden md:flex` sidebar 220px sticky /
  `md:hidden` tab bar sticky đáy + safe-area. **Không JS matchMedia.** Nút "Thông báo" ở đáy
  sidebar là **nút bất hoạt** (`aria-disabled`, `opacity-60`) — panel dựng ở M6.
- `src/features/shell/KhungTrang.tsx` — khung nội dung chuẩn, prop `rong: 1000 | 960` (max-width
  theo mockup; Dashboard 1000, Import/Cài đặt 960). **Từ vựng (2 pane) sẽ KHÔNG dùng** — tự bố cục.
- **Header Mobile thuộc từng trang**, không thuộc shell (Dashboard: lời chào + chuông; Cài đặt: tiêu đề).
- `/on-tap` và `/on-tap/tong-ket` **đã ở ngoài `AppShell`** (M4a).
- Kiểm thật CDP **12/12** (sidebar/tab bar ẩn hiện đúng breakpoint, active đúng 1 mục, Dashboard
  không sáng khi ở trang khác, bấm Thông báo không đổi route, mobile không tràn ngang).

### Auth UI vừa xong (2026-09-16)
- `src/lib/auth.ts` — hàm thuần (0 `import`): `kiemTraFormDangNhap` + `dichLoiDangNhap`; 9 ca test.
- `src/features/auth/RequireAuth.tsx` — bọc mọi route trừ `/dang-nhap`; 3 trạng thái
  `dang_kiem | co | khong`, render `null` khi chưa biết session (không nhấp nháy).
- `src/features/auth/DangNhap.tsx` — layout Phương án A (MB-16), chỉ utility Lớp 2, không icon.
- Đã kiểm thật bằng Chrome headless + CDP: **9/9** kịch bản (redirect + `state.from`, validate
  0 request, sai mật khẩu → câu chung, đúng → về trang cũ, reload giữ session, đã đăng nhập vào
  `/dang-nhap` → về `/`). `npm test` **67/67**, build + lint xanh.
- **Chưa có nút Đăng xuất** (chốt để M6 màn Cài đặt). Muốn đăng xuất khi dev: xoá key `sb-*`
  trong localStorage.

⚡ **DB ĐÃ ÔN THẬT 3 NGÀY (16–18/9)** — 4 topic · 9 từ · 83 bài tập · 4 hội thoại.
Sau M5: **3 từ MASTERED** (苹果 31 · 葡萄 32 · 香蕉 31 điểm, `next_review_date = NULL` — DỪNG ôn) ·
橙子 `intensive` (29 điểm, due 24/9) · 5 từ `stage1`. `exercises.ai_explanation` đã cache 2 bản.
⚠️ **Thao tác DB thủ công khi kiểm thật** (người dùng cho phép): 17/9 đưa 葡萄 + 橙子 lên `stage2`
due hôm nay (kiểm `fill_dialog`); 17/9 kéo `next_review_date` của 4 từ stage3 về hôm nay (kiểm M5);
17/9 reset `cycle_completed_exercises` của 西瓜 về `[]`. Mọi lần sau đó app tự tính lại — không còn
chênh lệch cần sửa.

Database Supabase đã dựng đầy đủ và **có kiểm chứng tự động**: 10 bảng + 2 enum + 8 index,
RLS + GRANT khoá chặt, `run_daily_maintenance()` phủ 9 ca TDD, cron `pg_cron` đang chạy.

### Bằng chứng nghiệm thu (đều đã chạy thật)
| Lệnh | Kết quả |
|---|---|
| `npm run db:migrate` | ✅ **7/7** file SQL xanh — **chạy lại nhiều lần vẫn xanh** (idempotent) |
| `npm run check:schema` | ✅ **14/14** — gồm 2 phép thử RLS bằng HTTP thật |
| `npm run test:db` | ✅ **9/9** ca cron T1–T9 · DB sạch sau khi chạy |
| `npm run test:import` | ✅ **6/6** ca import I1–I6 · không đụng dữ liệu thật (mọi ca `begin…rollback`) |
| `npm test` (Vitest) | ✅ **176/176** — 15 token + 13 `importValidate` + 32 `srs` + 9 `auth` + 22 `importUi` + 51 `player` + 18 `aiCore` + 9 `settings` + 8 `thongBao` |
| `npm run test:player` | ✅ **4/4** ca RPC `luu_tra_loi` P1–P4, `begin…rollback` |
| `npm run check:auth` | ✅ 9/9 — 1 tài khoản, đã confirm, `disable_signup = true` |
| `npm run import:file` | ✅ đã nạp thật 3 file mẫu; `--dry-run` không ghi gì; file hỏng → exit 1 |
| `npm run build` · `npm run lint` | ✅ xanh |

### Hạ tầng đã có (chi tiết ở `systemPatterns.md` §9)
- `supabase/migrations/0001…0008.sql` — extension · schema · RLS+GRANT · seed · cron fn · cron ·
  **`import_topic()`** · **`luu_tra_loi()`**.
- `scripts/`: `db-lib.mjs` (dùng chung) · `db-migrate.mjs` · `check-schema.mjs` ·
  `test-maintenance.mjs` · `test-import.mjs` · `import-file.mjs` · `check-auth.mjs`.
- `src/lib/importValidate.ts` — hàm thuần, **dùng chung cho cả CLI lẫn UI** (M2b sẽ tái dùng
  nguyên, không viết lại).
- `src/lib/srs.ts` — **toàn bộ luật SRS**, hàm thuần 100% (0 dòng `import`). M4 chỉ việc gọi
  `xuLyTraLoi(...)` rồi **ghi** 3 thứ trả về xuống DB: `word_state`, `review_log`, `daily_retry_queue`.
- **0 package mới** trong cả M1 lẫn M2a.

## Việc kế tiếp — M4 (Player UI) là việc lớn duy nhất còn lại trước khi app chạy được

**Toàn bộ logic lõi đã xong và có test**: SRS engine, import, cron, schema, player. Về UI đã có: Đăng
nhập, App shell, Import, **Player stage 0 + Tổng kết**. Còn stub: Dashboard, Từ vựng, Cài đặt.

**Việc chặn nhau theo thứ tự:**
1. ~~Màn Đăng nhập~~ ✅ xong 2026-09-16.
2. ~~App shell~~ ✅ xong 2026-09-16.
3. ~~M2b UI Import~~ ✅ xong 2026-09-16.
4. ~~M4a~~ ✅ xong 2026-09-16.
5. ~~M4b~~ ✅ xong 2026-09-17.
6. ~~M5~~ ✅ xong 2026-09-18. **Toàn bộ 17 dạng bài đã chạy được.**
7. ~~M6a (Cài đặt + Thông báo)~~ ✅ xong 2026-09-18.
8. **M6b — Dashboard + Khu vườn** (mockup 01): streak (công thức tự chốt: ngày liên tiếp có
   `review_log`, tính lùi từ hôm nay/hôm qua) · 2 thẻ due/quá hạn · CTA chính + "Ôn theo chủ đề"
   (**hiện nhưng vô hiệu hoá** tới M7) · Khu vườn 2 tầng (**2 query khác nhau**: hàng đếm dùng màu
   tượng trưng theo stage, cụm ring dùng `total_points` thật) · gắn **chuông Mobile** vào header
   Dashboard (M6a mới có route ẩn `/thong-bao`).
9. **M6c — TTS Google**: cần tạo bucket Supabase Storage + `GOOGLE_TTS_API_KEY`; gọi 1 lần/từ sau
   Import → `vocab.audio_url` (hiện **0/9 từ có audio**, Player đang dùng Web Speech fallback).
   Kèm nút nghe thử giọng ở màn Cài đặt (M6a chưa làm).
8. **M7 — Ôn theo topic** (session toàn topic + màn hội thoại kết thúc).

✅ **NỢ KỸ THUẬT KHOÁ API — ĐÃ TRẢ (2026-09-18).** Khoá + model nằm trong bảng `settings` (nhập ở màn
Cài đặt); `.env.local` đã comment `VITE_OPENROUTER_*` kèm ghi chú. Đã kiểm thật: không có 2 biến đó,
app vẫn gọi AI thành công. **Đừng đặt lại 2 biến `VITE_` này** — Vite nhúng thẳng vào bundle.
(`OPENROUTER_API_KEY` không prefix vẫn giữ cho script CLI — không vào bundle.)

## ⚠️ Câu hỏi mở — CẦN NGƯỜI DÙNG TRẢ LỜI

1. ~~🔴 Bộ 6 icon giai đoạn cây~~ ✅ **ĐÃ CHỐT 2026-09-16 (MB-19, Phương án A)** — `IconCay` trong
   `icons.tsx`. Gate gỡ. Còn việc nhỏ cho người dùng: cập nhật cảnh báo lỗi thời ở `CLAUDE.md`,
   `UI_DESIGN.md` §10.4 và comment đầu 2 file HTML (file người dùng sở hữu).
2. ~~🟡 Màn hình chưa có mockup khác~~ ✅ **ĐÃ XONG** — chọn topic (M7), trạng thái rỗng/loading/lỗi +
   nút Đăng xuất (M19, layout duyệt ở DESIGN.md M19). Màn mới chưa có mockup về sau vẫn phải trình bày & chờ duyệt.
3. ~~🟡 Skill `vocab-csv-to-import` nằm ở `import_csv_vocab/`~~ ✅ **ĐÃ CHUYỂN 2026-09-23** sang
   `.claude/skills/vocabCsv2Json/` — Claude Code tự nạp được (đã xác nhận tên camelCase vẫn hợp lệ).
   Skill có 2 chế độ: mặc định chỉ sinh JSON · `--import` thì nạp thẳng qua connector Supabase.
   ⚠️ 3 file mẫu của skill đang là **fixture của test** (`importValidate.test.ts`, `importUi.test.ts`,
   `scripts/test-import.mjs`) — đổi nội dung chúng là test đỏ, đó là CHỦ Ý (fixture phải khớp dữ liệu thật).

## Ghi chú kỹ thuật cần nhớ cho phiên sau

### Frontend (từ M0)
- **Component CHỈ dùng utility Tailwind** (`bg-accent`, `text-content-muted`). Cấm hex, cấm
  `var(--raw-*)`, cấm `bg-[#5B4FE8]`. `tokens.test.ts` canh một phần luật này.
- **Class Tailwind phải là chuỗi nguyên vẹn trong mã nguồn** — ghép động (`bg-${x}`) không sinh CSS.
- **Thang radius/font-size đặt tên bằng SỐ** (`rounded-14`, `text-15`), không phải `rounded-xl`.
- `scripts/extract-colors.mjs` chạy lại được bất cứ lúc nào để đối chiếu màu với mockup.

### Database (từ M1) — 4 luật đầy đủ ở `systemPatterns.md` §9
- Mọi migration **phải idempotent** (không có bảng lịch sử migration).
- **RLS lọc DÒNG, GRANT mở CỬA** — bật RLS mà quên `grant` thì chính mình cũng bị `403 · 42501`.
- **CẤM `current_date`** trong hàm SQL có yếu tố ngày — DB chạy UTC, cron 18:00 UTC = 01:00 GMT+7
  **ngày hôm sau**. Luôn dùng `(now() at time zone 'Asia/Ho_Chi_Minh')::date`.
- Hàm `security definer` **phải `revoke`** khỏi `public`/`anon`/`authenticated`.

### Thói quen công cụ
- Lệnh Bash quá dài bị cắt giữa chừng → ghi file lớn theo **nhiều khối `cat >>`** nhỏ.
- Python in tiếng Việt ra stdout Windows lỗi `cp1252` — vô hại, file vẫn ghi đúng UTF-8.
- **Kiểm UI thật không cần package:** Chrome tại `C:/Program Files/Google/Chrome/Application/
  chrome.exe` + `--headless=new --remote-debugging-port=9333`, Node 24 có sẵn `WebSocket` → nói
  chuyện CDP trực tiếp (`Page.navigate`, `Runtime.evaluate`, `Page.captureScreenshot`,
  `Emulation.setEmulatedMedia` để ép light/dark). Script mẫu đã dùng cho màn Đăng nhập nằm ở
  scratchpad phiên 2026-09-16 (không commit) — viết lại tương tự khi cần.
  ⚠️ Chrome headless **theo theme OS** (máy đang dark) → muốn chụp light phải ép
  `prefers-color-scheme: light` tường minh.
- Set giá trị input React qua CDP phải gọi setter gốc `HTMLInputElement.prototype.value` rồi
  dispatch `input` — gán `.value` trực tiếp React không thấy.
- `exactOptionalPropertyTypes`: type shape nhận object từ thư viện phải viết `status?: number |
  undefined` tường minh, nếu không `AuthError` (có `status: number | undefined`) không gán vào được.

## Sai lệch tài liệu đã phát hiện (ghi nhận, không tự sửa file gốc của người dùng)

- `UI_DESIGN.md` gọi mockup là `PcView.html`/`MobileView.html`; **tên thật** là
  `VocaBloom_PCView.html` / `VocaBloom_MobileView.html`.
- `UI_DESIGN.md` §8 ghi "8 màn hình"; **số thật**: PC 18 màn, Mobile 19 màn.
- `SPECIFICATION.md` §2 đánh số 9 nhóm nhưng thực tế là **10 bảng** (MB-13).
- `SPECIFICATION.md` **tự mâu thuẫn**: §3.1 nói từ mới due "+1 ngày", §5.1 nói due "hôm nay"
  → đã chốt theo §5.1 (MB-12/Q2).
- `systemPatterns.md` từng ghi card bài tập `#FFF8F0` — mã không tồn tại, đã sửa `#FFFFFF`.

## Blockers

Không có blocker. Gate icon cây đã gỡ 2026-09-16.
