# Active Context

> Cập nhật lần cuối: **2026-09-23** (kết thúc M14 — tách nhật ký học khỏi từ vựng)

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
2. **🟡 Màn hình chưa có mockup khác:** màn chọn topic để "Ôn theo chủ đề", các trạng thái
   rỗng/loading/lỗi của Dashboard/Từ vựng, **nút Đăng xuất** (dự kiến đặt ở màn Cài đặt M6).
   Phải trình bày & chờ duyệt trước khi tự dựng layout. (Màn kết quả Import đã duyệt & xong.)
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
