# Progress Log

> Cập nhật lần cuối: **2026-09-16**

## ✅ Đã xong

- [x] **Đặc tả nghiệp vụ** `SPECIFICATION.md` v1.0 — 23 quyết định DEC-01→DEC-23 đã chốt: schema 9 bảng, SRS engine, 17 dạng bài, session, cron, AI, TTS, import.
- [x] **Đặc tả thị giác** `UI_DESIGN.md` v2.0 — token 2 lớp, bảng màu 3-accent, typography, 9 pattern bài tập, đặc tả 8 nhóm màn PC + Mobile.
- [x] **Mockup HTML** — `VocaBloom_PCView.html` (18 màn × light/dark) + `VocaBloom_MobileView.html` (19 màn × light/dark).
- [x] **Bộ công cụ sinh dữ liệu import** `import_csv_vocab/` — SKILL.md + `import-schema.json` (Draft 2020-12) + `validate_import.py` + 3 file JSON mẫu.
- [x] **Hạ tầng agent** — `CLAUDE.md` (quy trình 4 bước), 5 skill trong `.claude/skills/`, 6 slash command trong `.claude/commands/`.
- [x] **Memory bank khởi tạo** (2026-08-23) — 5 file; `systemPatterns.md` viết lại từ đầu vì bản cũ là template dự án khác.

- [x] **M0 — Nền móng dự án & Hệ token** (2026-09-06). Chi tiết ngay dưới.
- [x] **M1 — Database** (2026-09-09). Chi tiết ngay dưới.
- [x] **M2a — Lõi Import** (2026-09-09). Chi tiết ngay dưới.
- [x] **M3 — SRS engine** (2026-09-09). Chi tiết ngay dưới.
- [x] **Auth UI — Màn Đăng nhập + RequireAuth** (2026-09-16). Chi tiết ở mục M2b.
- [x] **App shell — sidebar PC / tab bar Mobile** (2026-09-16). Chi tiết ở mục M2b.
- [x] **M2b — UI Import** (2026-09-16). Chi tiết ngay dưới.
- [x] **Icon cây chốt Phương án A** (2026-09-16, MB-19).
- [x] **M4a — Lõi Player + Stage 0 + Tổng kết** (2026-09-16). Chi tiết ngay dưới.
- [x] **M4b — Player stage 1 + 2** (2026-09-17). Chi tiết ngay dưới.
- [x] **M5 — AI chấm stage 3 + Giải thích** (2026-09-18). Chi tiết ngay dưới. **Đủ 17/17 dạng bài.**
- [x] **M6a — Cài đặt + Thông báo** (2026-09-18). Chi tiết ngay dưới. **Đã trả nợ khoá trong bundle.**
- [x] **M6b — Dashboard + Khu vườn** (2026-09-18). Chi tiết ngay dưới. **Chỉ còn 1 màn stub: Từ vựng.**
- [x] **M6c — TTS Google + Storage** (2026-09-19). Chi tiết ngay dưới. **M6 XONG TRỌN.**
- [x] **M7 — Ôn theo chủ đề + Hội thoại kết thúc** (2026-09-19). Chi tiết ngay dưới.
- [x] **M8 — Quản lý từ vựng & chủ đề** (2026-09-19). Chi tiết ngay dưới. **KHÔNG còn màn stub nào.**

### ✅ M8 — Quản lý từ vựng & chủ đề (XONG 2026-09-19)
- [x] `tuVung.ts` (19 ca TDD) — `boDau` · `locTu` (khớp chữ/pinyin/nghĩa, bỏ dấu) · `nhanTu` ·
      `kiemTraFormTu` · `canXoaAudio` · `docThayDoi` (chỉ gửi field thực sự đổi, ô trống → null).
- [x] Migration `0010_xoa_chu_de.sql` — RPC 1 transaction: từ CHỈ thuộc chủ đề này → xoá hẳn; từ còn
      thuộc chủ đề khác → chỉ gỡ liên kết; chặn nếu đụng vai B của chủ đề khác. Không cấp quyền `anon`.
- [x] `TuVungPage` — PC master-detail 2 cột (mockup 13), Mobile 2 màn theo route, đổi bố cục bằng CSS.
- [x] `FormSuaTu` (`<dialog>` native) — **đủ 8 field** §8.4, nhãn theo `lang`, cảnh báo khi đổi chữ.
- [x] `HopXacNhan` — mọi thao tác phá huỷ đều nêu hậu quả bằng SỐ CỤ THỂ.
- [x] Đổi tên chủ đề · xoá chủ đề · xoá từ (chặn khi từ là vai B) · tìm kiếm không dấu.
- [x] **Kiểm thật CDP 23/23 + 8/8**: sửa pinyin ghi đúng 1 cột · đổi chữ ⇒ `audio_url` **về null** ·
      xoá từ vai B **bị chặn** (香蕉 đang dùng trong câu của 苹果) · xoá chủ đề tạm 2 từ (vocab 11 → 9,
      chủ đề khác nguyên vẹn) · xoá 1 từ ⇒ cascade dọn **exercises + review_log + word_state** về 0.
- [x] `npm test` 264/264.

### ✅ M0 — Nền móng dự án (XONG 2026-09-06)
- [x] Scaffold Vite 8 + React 19 + TS strict + Tailwind v4 + Vitest 5 + react-router — `npm run build` xanh.
- [x] `src/styles/tokens.css` — **4 tầng**: Lớp 1 raw hex → Lớp 2 semantic (3 nhánh light/dark)
      → Mastery Ring bất biến → `@theme inline` bắc cầu ra Tailwind.
- [x] `scripts/extract-colors.mjs` — trích màu tách 37 frame light / 37 frame dark, **không đoán**.
      Giải quyết được cặp `#B7AFC9`(light) / `#55566A`(dark) mà mắt thường suy luận ngược.
- [x] `src/styles/tokens.test.ts` — 15 assertion canh cổng kiến trúc token (TDD RED→GREEN).
- [x] 3 font qua CDN Google Fonts, 0 package. Thang radius 11 mức + font-size 20 mức theo mockup.
- [x] `src/lib/supabase.ts` (client singleton) + `npm run check:db` — ping Supabase thật ✅.
- [x] Trang swatch dev `/dev/tokens` — đã chụp đối chiếu light + dark.
- [x] Dọn: `.gitignore` đầy đủ, xoá file demo của template, sửa lỗi `#FFF8F0` trong memory-bank.

### ✅ M1 — Database (XONG 2026-09-09)
- [x] **Hạ tầng migration không cần CLI** — `scripts/db-lib.mjs` + `db-migrate.mjs` gửi SQL qua
      Supabase Management API bằng `fetch`. **0 package mới.** 6 file trong `supabase/migrations/`.
- [x] **Schema §2 đầy đủ** — 2 enum (6 + 17 nhãn) + **10 bảng** + **8 index**
      (7 của spec + `idx_review_log_reviewed_at` cho §4.6, chốt Q3).
- [x] **RLS Phương án A** — Supabase Auth 1 tài khoản (`disable_signup`), 10 policy
      `authenticated_full_access`, **không thêm cột `user_id`**, schema §2 giữ nguyên 100%.
- [x] **GRANT** — phát hiện khi nghiệm thu: bảng tạo qua Management API không có quyền mặc định.
      Chỉ cấp cho `authenticated`; `anon` không có quyền nào ⇒ bị chặn ngay tầng quyền.
- [x] **`run_daily_maintenance()`** — đủ 5 bước §5, quy chiếu `Asia/Ho_Chi_Minh`
      (không dùng `current_date`), đã `revoke` khỏi `public`/`anon`/`authenticated`.
- [x] **TDD 9/9** — `npm run test:db`, chạy ĐỬe trước khi có hàm rồi mới XANH,
      mọi ca trong `begin…rollback` nên DB không còn dòng rác nào.
- [x] **pg_cron** — job `daily-srs-maintenance` `0 18 * * *`, `active = true`.
- [x] **`npm run check:schema` 14/14** — gồm 2 phép thử RLS bằng HTTP thật.

### ✅ M2a — Lõi Import (XONG 2026-09-09) — phần UI hoãn sang M2b
- [x] `src/lib/importValidate.ts` — hàm **thuần**, validate 2 lớp (cấu trúc + tham chiếu chéo
      `temp_id`), port từ `validate_import.py`. **0 package** — không cài `ajv` (MB-14/Q2).
- [x] `supabase/migrations/0007_import_topic.sql` — 7 bước trong **1 transaction**
      tất-cả-hoặc-không (§10.4). Không `security definer` ⇒ không sinh lỗ hổng RPC.
- [x] `scripts/import-file.mjs` + `npm run import:file -- <file> [--dry-run]` — đăng nhập thật
      rồi gọi RPC qua PostgREST, đi ĐÚNG đường mà UI sẽ đi (chịu đủ RLS + GRANT).
- [x] **TDD 2 phía:** 12 ca Vitest (`npm test` 27/27) + 6 ca SQL (`npm run test:import` 6/6).
- [x] **Dữ liệu thật đã nạp:** 3 topic (Trái cây zh / Nghề nghiệp en / Thời tiết zh) · 8 từ ·
      74 bài tập · 3 hội thoại. Cả 8 từ ở hàng đợi (`next_review_date = NULL`, `stage = 'new'`).
- [x] Vá `tsconfig.test.json` thiếu `allowImportingTsExtensions` (build đỏ khi test import file `.ts`).

### ✅ M2b — UI Import (XONG 2026-09-16)
- [x] **Màn Đăng nhập** (2026-09-16) — layout Phương án A đã duyệt (MB-16). `src/lib/auth.ts`
      hàm thuần 9 ca test · `RequireAuth` bọc mọi route trừ `/dang-nhap` · kiểm thật Chrome
      headless 9/9 kịch bản · `npm test` 67/67 · 0 package. Chưa có Đăng xuất (để M6).
- [x] **App shell** (2026-09-16) — `AppShell` + `KhungTrang` + `menu.ts` + 6 icon nav trích mockup.
      CSS-only (`md:`), 0 package, CDP 12/12. Thông báo = nút bất hoạt (M6); `/on-tap` tạm trong shell (M4).
- [x] `src/lib/importUi.ts` — reducer 6 bước + 5 hàm thuần, **22 ca TDD** (`npm test` 89/89).
- [x] `src/features/import/ImportPage.tsx` — màn 15/16 PC + 16/17 Mobile; 3 trạng thái không có
      mockup (lỗi file / đang import / kết quả) theo layout đã duyệt (MB-18). Kéo-thả native, 0 package.
- [x] Kiểm thật CDP **17/17** — gồm **1 import thật** (topic "Thời tiết" 1 từ) đối chiếu DB qua PostgREST.
- [ ] TTS nền sau import → M6.

### ✅ M3 — SRS engine (XONG 2026-09-09)
- [x] `src/lib/srs.ts` — **hàm thuần 100%**, không có lấy một dòng `import` nào.
- [x] Cộng điểm theo dạng bài (1/2/3/4) + giảm 50% làm tròn xuống khi dùng gợi ý.
- [x] Ngưỡng promote theo `cycle_points` (3/4 · 6/8 · 9/12), reset cycle khi sang vòng mới.
- [x] `gap_factor(health)` 3 mốc + `next_review_date` theo gap của **stage ĐÍCH** (không phải nguồn).
- [x] Bảng phạt `tinhPhat` (mastered miễn nhiễm) — có test X1 canh khớp với hàm SQL của M1.
- [x] Rẽ nhánh stage3 → mastered / intensive theo `MASTER_THRESHOLD = 30`, kiểm ở cả 2 thời điểm §3.3.
- [x] `gomSession` — thuần 1 stage, order `stage ASC, next_review_date ASC`, phần dư thành session riêng.
- [x] `xuLyFlashcard` Good/Hard/Again + luật §4.4 (dialog 2 từ: chỉ cộng điểm cho từ đang due).
- [x] **30 ca test** (`npm test` tổng 58/58), gồm 3 ca chống lệch X1/X2/X1c.
- [ ] *Ghi xuống DB và điều kiện OR của query dialog — thuộc M4, không phải M3.*

### ✅ M4a — Lõi Player + Stage 0 + Tổng kết (XONG 2026-09-16)
- [x] `src/lib/player.ts` thuần, **26 ca TDD** (xếp bài, chấm Matching, random tiêm rng, tổng kết, reducer).
- [x] RPC `luu_tra_loi` (0008) 1 transaction — `npm run test:player` 4/4.
- [x] Exercise Shell (ring `IconCay` + ghost + X + dots theo khối) + Flashcard · Grammar · Matching ·
      Selection · Audio Recognition (Web Speech fallback) · Fast Decision (4s).
- [x] `PlayerPage` (`/on-tap`, ngoài shell) + lượt retry `?che_do=retry` + `TongKetPage` (query `review_log` cả ngày).
- [x] Kiểm thật CDP trên 8 từ due thật, 2 lượt + retry: không ghi đúp, lên stage đúng gap, lịch tự lành, retry 4 → 0.
- [x] Vá 3 phát hiện khi kiểm thật (MB-20), gồm 1 lỗ hổng spec ở `srs.ts` (test R2d).

### ✅ M4b — Player stage 1 + 2 (XONG 2026-09-17)
- [x] Pattern 2 `DienTu` — 1 input trong suốt phủ N ô ký tự (IME tiếng Trung gõ được), `en` 1 ô dài,
      gợi ý lộ dần ký tự; dùng cho Translate · Listen Fill · Trans Collocation.
- [x] Pattern 7 `HoiThoai` — bài **2 từ** (§4.4): xếp theo RECORD, 1 câu chỉ hiện 1 lần; Select 4 chip /
      Fill 2 ô nhập; chấm 2 chỗ độc lập, ghi log riêng cho từng từ due.
- [x] Pattern 3 `SapXep` + Pattern 1 mở rộng (`select_on_describe`, `select_sentence` lưới 1 cột).
- [x] `locRetryTheoRecord` — hàng retry không bao giờ chứa dạng mà từ đó không có record (M4b/Q4).
- [x] `coBaiTinhDiem` — chặn session lặp vô hạn flashcard/grammar (bug phát hiện khi kiểm thật).
- [x] **Cả 8 dạng đã chạy thật**; `npm test` 136/136; build + lint xanh.

### ✅ M5 — AI chấm stage 3 + Giải thích (XONG 2026-09-18)
- [x] `src/lib/aiCore.ts` thuần — **18 ca TDD** (parse có strip code-fence, chuẩn hoá verdict, prompt, body).
- [x] `src/lib/ai.ts` — OpenRouter từ browser; khoá `settings` → env; lỗi 401/429/mạng dịch sang tiếng Việt.
- [x] Pattern 8: `TuLuan` (ẩn hẳn Gợi ý, "Bỏ qua" = fail không gọi AI) · `ChamAI` (badge 3 màu + "Chấm lại").
- [x] Gom N câu/dạng → **đúng 3 request/session** (DEC-14), xác nhận bằng log mạng khi kiểm thật.
- [x] Nút "Giải thích (AI)" + `<dialog>` native, lazy + cache `exercises.ai_explanation` (DEC-23).
- [x] **Kiểm thật có gọi AI:** 12 dòng `points = 4`; 3 từ lên **mastered**, 1 từ `intensive`.
- [x] Vá 2 bug phát hiện khi kiểm (MB-22).

### ✅ M6a — Cài đặt + Thông báo (XONG 2026-09-18)
- [x] `settings.ts` (9 ca TDD) — đọc 5 key §11, **sai kiểu jsonb → rơi về mặc định**, che khoá, kẹp stepper.
- [x] `thongBao.ts` (8 ca TDD) — thời gian tương đối, đếm chưa đọc.
- [x] `CaiDatPage` — 3 nhóm mockup 17/18, ghi ngay khi đổi, nút Lưu tường minh cho khoá + model.
- [x] `PanelThongBao` — panel PC / sheet Mobile, đọc 1 tin & đọc tất cả, trạng thái rỗng.
- [x] Chuông sidebar hoạt động + chấm báo; route ẩn `/thong-bao` cho Mobile.
- [x] **Trả nợ khoá**: nhập khoá ở app → gỡ `VITE_OPENROUTER_*` khỏi `.env.local` → kiểm thật app vẫn gọi AI được.
- [x] Kiểm thật CDP 18/18 · `npm test` 176/176.

### ✅ M6b — Dashboard + Khu vườn (XONG 2026-09-18)
- [x] `dashboard.ts` (19 ca TDD) — `loiChao`/`gioVN` (nửa đêm ra **0 chứ không phải 24**) · `ngayDayDu`
      ("Thứ Sáu, 18 tháng 9") · `luiNgay` · `tinhStreak` · `dai7Ngay` · `gomKhuVuon` · `demDenHan` ·
      `ngayCoOn` (quy `timestamptz` về ngày **giờ VN**, không phải giờ máy).
- [x] Header chào + ngày + **streak**; tên cố định **"Helios"** (hằng số, không thêm key DB).
- [x] Dải 7 ngày hiện ở **CẢ PC lẫn Mobile** (mockup chỉ vẽ ở Mobile — người dùng yêu cầu mở rộng).
- [x] 2 thẻ "Đến hạn hôm nay" / "Quá hạn" + CTA chính; "Ôn theo chủ đề" **vô hiệu hoá** tới M7.
- [x] Khu vườn 6 chip (kể cả stage 0 từ) — **2 query tách bạch**: đếm theo stage ≠ ring theo `total_points`.
- [x] "Vừa ôn gần đây": `Ring` thêm prop `noiDung` để đặt **chữ Hán** giữa vòng (Player giữ icon cây).
- [x] Chuông Thông báo ở header Dashboard Mobile; route `/` thay `Stub`.
- [x] Kiểm thật CDP **20/20** (số liệu đối chiếu thẳng PostgREST) · `npm test` **195/195**.

### ✅ M6c — TTS Google + Storage (XONG 2026-09-19)
- [x] **Phát hiện tài liệu SAI:** Google KHÔNG có `cmn-CN-Neural2-*` (kiểm thật → `Voice ... does not
      exist`). Đã sửa `SPECIFICATION.md` §2/§9/§11 + code + **dữ liệu trong DB** sang
      `cmn-CN-Wavenet-*`; tiếng Anh dùng `en-US-Neural2-*`.
- [x] Migration `0009`: bucket `audio` (công khai đọc, ghi chỉ `authenticated`) + sửa `tts_voice` sai
      + 2 key mới (`google_tts_api_key`, `tts_voice_en`).
- [x] `ttsCore.ts` (20 ca TDD) — danh sách giọng, `giongCua`, `bamChuoi`/`duongDanAudio`, `bodyTTS`,
      `docKetQuaTTS`, `base64ThanhBytes`, `gomTuCanGen`.
- [x] `tts.ts` — `layCauHinhTTS` (đọc `settings`, KHÔNG dùng `VITE_*`), `nghegiongThu`,
      `demTuThieuAudio`, `genAudioChoTu` (tuần tự, lỗi 1 từ không dừng cả mẻ).
- [x] Cài đặt: ô khoá Google TTS + **2 ô giọng riêng** (Trung/Anh) mỗi ô có nút nghe thử
      + nút "Tạo audio còn thiếu (N từ)".
- [x] Import: tự sinh audio ở nền sau khi import xong (ref guard chống StrictMode gọi đôi).
- [x] **Kiểm thật CDP 14/14**: 9/9 dòng `vocab` có `audio_url` nhưng **chỉ 8 lời gọi Google**
      (2 dòng "晴天" dùng chung file) · URL công khai tải được `audio/mpeg` 8256 byte ·
      `phatAm()` có mp3 thì phát mp3, thiếu thì rơi về Web Speech · `npm test` 216/216.

### M5 — AI
- [ ] Chấm bài stage 3: batch 3 request/session, parse JSON có retry strip code-fence, nút "Chấm lại".
- [ ] Giải thích lazy + cache `exercises.ai_explanation`.

### M6 — TTS · Settings · Dashboard
- [x] ~~Màn Cài đặt (3 nhóm) đọc/ghi bảng `settings`~~ (M6a).
- [x] ~~Màn Thông báo + chuông~~ (M6a). Logic cảnh báo hàng đợi cạn do cron sinh, đã có sẵn.
- [x] ~~Dashboard + Khu vườn (2 nguồn màu khác nhau) + Mastery ring~~ (M6b).
- [x] ~~Pipeline Google TTS → Storage → `vocab.audio_url` + nút nghe thử~~ (M6c — **9/9 từ đã có audio**).

### ✅ M7 — Ôn theo chủ đề + Hội thoại kết thúc (XONG 2026-09-19)
- [x] `player.ts` +2 hàm thuần: `stageBaiTap` (mastered mượn bộ bài intensive) · `gomSessionTopic`
      (gom TOÀN BỘ từ của chủ đề, không lọc lịch, không loại mastered); `xepBai` thêm cờ `boQuaDaDat`.
- [x] `chuDe.ts` (7 ca TDD) — `tomTatChuDe`: đếm từ, số đến hạn, 6 khúc thanh màu.
- [x] `hoiThoai.ts` (13 ca TDD) — `docHoiThoai` · `chiaDam` (ưu tiên từ dài, ranh giới từ cho tiếng Anh).
- [x] `ChonChuDePage` (`/on-tap/chu-de`) — card mượn pattern mockup 13, KHÔNG có mockup riêng (M7/Q3).
- [x] `HoiThoaiKetThucPage` (`/on-tap/hoi-thoai`) — mockup 11, nút "Hiện nghĩa" + loa từng dòng.
- [x] `PlayerPage` chế độ `?che_do=topic&topic=<id>`; Dashboard bật nút "Ôn theo chủ đề".
- [x] **Cam kết M7/Q2 đã kiểm thật:** từ mastered được ôn (10 dòng log, **mọi dòng points = 0**) nhưng
      `word_state` **giữ nguyên 100%**; từ đang due vẫn cộng điểm (`total_points` 12 → 18); KHÔNG dòng
      nào lọt vào `daily_retry_queue`.
- [x] **1 bug thật đã vá:** chế độ topic nạp lại mãi cùng 1 session (26 lần 1 màn, 82 dòng log rác) —
      xem MB-26.
- [x] `npm test` 245/245 · CDP 3 kịch bản: 14/16 + 8/9 + 5/5 (3 "FAIL" đều là lỗi script kiểm, đã
      xác minh lại từng cái).

## 🚧 Đang chặn

| Hạng mục | Chặn bởi |
|---|---|
| ~~Dashboard, ring Player, Quản lý từ vựng~~ | ✅ Đã gỡ chặn 2026-09-16 — chốt icon cây Phương án A (MB-19) |
| Kiểm thật Player tiếp | 🟡 Hết từ due ngày 16/9 — đợi cron 01:00 kích hoạt/đến hạn |
| ~~`ai.ts`, `tts.ts`~~ | ✅ Đã gỡ chặn — chốt gọi thẳng từ frontend (MB-04) |
| ~~Kết nối Supabase~~ | ✅ Đã gỡ chặn 2026-09-06 — project khôi phục, `check:db` xanh |
| ~~RLS / migration bảo mật~~ | ✅ Đã gỡ chặn 2026-09-09 — chốt Phương án A (MB-10), đã triển khai xong |
| ~~Mọi UI đọc DB~~ | ✅ Đã gỡ chặn 2026-09-16 — màn Đăng nhập + `RequireAuth` xong |
| Màn chọn topic, nút Đăng xuất, các empty/loading/error state | 🟡 Chưa có mockup, cần duyệt layout trước khi code |
