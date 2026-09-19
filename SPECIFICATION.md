# VocaBloom — Đặc tả kỹ thuật (Technical Specification)

> **Phiên bản:** 1.0 · **Ngày:** 2026-07-15
> **Nguồn:** Tổng hợp từ `planDiscuss.md` + `progress.md` (23 quyết định DEC-01 → DEC-23, tất cả đã 🟢 chốt)
> **Mục đích:** Tài liệu này là **base implementation-ready** — tổ chức lại toàn bộ quyết định theo cấu trúc hệ thống (không theo trình tự thời gian bàn luận) để dùng trực tiếp khi code.

---

## 1. Tổng quan

**VocaBloom** là web app ôn từ vựng Anh/Trung cá nhân (single-user), áp dụng spaced repetition (SRS) hướng tới xây dựng **active vocabulary** (khả năng chủ động nhớ và dùng từ, không chỉ nhận diện thụ động).

### 1.1 Tech stack

| Thành phần | Công nghệ |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend/DB | Supabase (Postgres + Storage + pg_cron) |
| AI chấm điểm & giải thích | OpenRouter (model + API key do người dùng tự cấu hình) |
| TTS | Google Cloud TTS (`cmn-CN-Wavenet-*` cho tiếng Trung, `en-US-Neural2-*` cho tiếng Anh) |
| Fallback audio | Web Speech API |

### 1.2 Nguyên tắc thiết kế cốt lõi (áp dụng xuyên suốt)

1. **AI trong app CHỈ làm 2 việc:** (a) chấm điểm bài tự luận stage 3, (b) giải thích theo yêu cầu (nút bấm, lazy). **KHÔNG** gen dữ liệu bài tập trong app — toàn bộ 17 dạng bài + hội thoại được AI gen **bên ngoài** app, đưa vào qua màn Import.
2. **Payload không lặp dữ liệu đã có ở `vocab`** — chỉ chứa phần AI phải sáng tạo mới (đáp án nhiễu, câu do AI soạn...). Tránh 2 nguồn sự thật xung đột.
3. **Mô hình lịch ôn là tương đối** (`next_review_date`), không phải tính cứng từ ngày thêm từ — tự "lành" khi người dùng trượt lịch, không cần cron can thiệp phức tạp.
4. **Điểm chia làm 2 tầng:** `cycle_points` (theo từng vòng ôn của 1 stage, reset liên tục) và `total_points` (cộng dồn cả đời, quyết định Mastered + độ tin cậy của gap).

---

## 2. Mô hình dữ liệu (Database Schema)

```sql
-- ============================================================
-- 1. TOPICS
-- ============================================================
create table topics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 2. VOCAB
-- ============================================================
create table vocab (
  id                    uuid primary key default gen_random_uuid(),
  word                  text not null,
  pinyin                text,
  meaning_vi            text not null,
  collocation           text,
  collocation_pinyin    text,           -- DEC-13 bổ sung
  collocation_meaning_vi text,          -- DEC-13 bổ sung
  example_sentence      text,
  example_meaning_vi    text,
  lang                  text not null check (lang in ('zh','en')),
  audio_url             text,           -- cache TTS, null cho tới khi được gen (DEC-15)
  created_at            timestamptz not null default now()
);

-- Quan hệ nhiều-nhiều
create table vocab_topics (
  vocab_id  uuid references vocab(id) on delete cascade,
  topic_id  uuid references topics(id) on delete cascade,
  primary key (vocab_id, topic_id)
);

-- ============================================================
-- 3. WORD_STATE — trạng thái SRS (lõi hệ thống)
-- ============================================================
create type word_stage as enum ('new','stage1','stage2','stage3','intensive','mastered');

create table word_state (
  vocab_id                   uuid primary key references vocab(id) on delete cascade,

  stage                      word_stage not null default 'new',
  next_review_date           date,              -- NULL = chưa kích hoạt (hàng đợi từ mới, DEC-16)
  added_at                   timestamptz not null default now(),

  cycle_points               int not null default 0,     -- điểm chu kỳ hiện tại (DEC-05)
  cycle_completed_exercises  jsonb not null default '[]', -- bài đã đạt trong chu kỳ (DEC-06)
  total_points               int not null default 0,     -- điểm cả đời (DEC-04/18), quyết định Mastered

  last_reviewed_at           timestamptz,
  consecutive_fails          int not null default 0,     -- dự phòng, KHÔNG dùng để tụt stage (DEC-09)

  updated_at                 timestamptz not null default now()
);

create index idx_word_state_due on word_state (stage, next_review_date);
create index idx_word_state_queue on word_state (next_review_date) where next_review_date is null;

-- ============================================================
-- 4. DAILY_RETRY_QUEUE — hàng đợi "ôn lại trong ngày" (DEC-06)
-- ============================================================
create table daily_retry_queue (
  id              uuid primary key default gen_random_uuid(),
  vocab_id        uuid not null references vocab(id) on delete cascade,
  reason          text not null check (reason in ('below_threshold','flashcard_again')),
  exercise_types  jsonb,          -- null = retry cả bộ (Flashcard); mảng = chỉ các bài chưa đạt
  queue_date      date not null,
  created_at      timestamptz not null default now()
);

create index idx_retry_queue_date on daily_retry_queue (queue_date);

-- ============================================================
-- 5. EXERCISES — 17 dạng bài, payload JSONB (DEC-22)
-- ============================================================
create type exercise_type as enum (
  'flashcard','grammar','matching','selection','audio_recognition','fast_decision',   -- stage 0
  'translate','select_dialog','listen_fill','select_on_describe',                      -- stage 1
  'fill_dialog','select_sentence','arrange_words','trans_collocation',                 -- stage 2
  'make_sentence','trans_sentence','complete_situation'                                -- stage 3
);

create table exercises (
  id              uuid primary key default gen_random_uuid(),
  vocab_id        uuid not null references vocab(id) on delete cascade,
  type            exercise_type not null,
  payload         jsonb not null default '{}',
  ai_explanation  jsonb,          -- lazy-cache, DEC-23, null cho tới khi được bấm "Giải thích"
  created_at      timestamptz not null default now()
);

create index idx_exercises_vocab_type on exercises (vocab_id, type);
-- Index riêng cho query Select Dialog / Fill Dialog (từ B tham chiếu qua payload)
create index idx_exercises_blank_b on exercises using gin (payload) where type in ('select_dialog','fill_dialog');

-- ============================================================
-- 6. REVIEW_LOG — lịch sử ôn tập, phục vụ Dashboard + Tổng kết phiên (DEC-13, §4.6)
-- ============================================================
create table review_log (
  id            uuid primary key default gen_random_uuid(),
  vocab_id      uuid not null references vocab(id) on delete cascade,
  exercise_type exercise_type not null,
  is_correct    boolean not null,
  used_hint     boolean not null default false,   -- DEC-19
  points        int not null default 0,
  stage_before  word_stage,                       -- §4.6: stage của từ TRƯỚC lần trả lời này
  stage_after   word_stage,                       -- §4.6: stage của từ SAU lần trả lời này (khác stage_before nếu vừa promote)
  reviewed_at   timestamptz not null default now()
);

create index idx_review_log_daily on review_log (vocab_id, reviewed_at);

-- ============================================================
-- 7. TOPIC_DIALOGUES — hội thoại theo topic (DEC-20)
-- ============================================================
create table topic_dialogues (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references topics(id) on delete cascade,
  content     jsonb not null,     -- { lines: [{speaker, text_zh, pinyin, text_vi, highlight_vocab_ids}] }
  created_at  timestamptz not null default now()
);

create unique index idx_topic_dialogue_topic on topic_dialogues (topic_id);

-- ============================================================
-- 8. NOTIFICATIONS — cảnh báo hàng đợi cạn (DEC-16)
-- ============================================================
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,          -- 'low_queue', mở rộng sau
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 9. SETTINGS — key-value đơn giản (single-user, DEC-17)
-- ============================================================
create table settings (
  key    text primary key,
  value  jsonb not null
);

-- Seed mặc định
insert into settings (key, value) values
  ('openrouter_api_key', 'null'),
  ('openrouter_model', 'null'),
  ('google_tts_api_key', 'null'),
  ('new_words_per_day', '5'),
  ('tts_voice', '"cmn-CN-Wavenet-A"'),
  ('tts_voice_en', '"en-US-Neural2-C"'),
  ('low_queue_alert_enabled', 'true');
```

---

## 3. Logic nghiệp vụ lõi — SRS Engine

### 3.1 State machine

```
Add từ vựng (import) ──► next_review_date = NULL (hàng đợi chờ kích hoạt)
        │
        │  [cron: nhỏ giọt theo new_words_per_day — §5.1]
        ▼
   stage = new, next_review_date = ngày kích hoạt + 1
        │  cycle_points ≥ 3/4
        ▼
   stage = stage1, next_review_date += 2 × gap_factor(health)
        │  cycle_points ≥ 6/8
        ▼
   stage = stage2, next_review_date += 4 × gap_factor(health)
        │  cycle_points ≥ 9/12
        ▼
   stage = stage3, next_review_date += 7 × gap_factor(health)
        │  (làm bài AI-graded, cộng total_points)
        ▼
   total_points ≥ 30 ? ──YES──► stage = mastered (DỪNG, miễn nhiễm phạt)
        │ NO
        ▼
   stage = intensive (bài dạng stage2, gap 7 ngày/lần, cộng total_points)
        │  lặp lại tới khi total_points ≥ 30
        ▼
   stage = mastered
```

### 3.2 Ngưỡng điểm nâng stage (`cycle_points`)

| Stage | Bài tính điểm | Max/vòng | Ngưỡng nâng | Điểm/bài |
|---|---|---|---|---|
| new (0) | Matching*, Selection, Audio Recognition, Fast Decision (*Matching/Flashcard/Grammar KHÔNG tính điểm) | 4 | **≥ 3** | +1 |
| stage1 | Translate, Select Dialog, Listen Fill, Select on Describe | 8 | **≥ 6** | +2 |
| stage2 | Fill Dialog, Select Sentence, Arrange Words, Trans Collocation | 12 | **≥ 9** | +3 |
| stage3 | Make Sentence, Trans Sentence, Complete Situation | 12 | *(không nâng stage, rẽ nhánh — xem §3.3)* | +4 |

Tổng max lý thuyết cả đời: `4 + 8 + 12 + 12 = 36`.

### 3.3 Mastered threshold (`total_points`)

```
MASTER_THRESHOLD = 30   (≈ 83% của 36)
```

Kiểm tra tại 2 thời điểm: (a) ngay sau khi hoàn thành bài stage3 lần đầu, (b) sau mỗi lần ôn ở Intensive.

### 3.4 Gap co giãn theo "health" (DEC-18)

Khi promote lên stage kế, KHÔNG dùng gap cố định — nhân thêm hệ số theo độ tin cậy trí nhớ:

```
health = total_points / max_điểm_có_thể_đạt_tới_thời_điểm_promote
gap_factor(health):
    health ≥ 0.8        → 100%
    0.5 ≤ health < 0.8   → 70%
    health < 0.5         → 50%

next_review_date = hôm_nay + round(gap_cố_định × gap_factor)
```

*Lý do:* một từ liên tục bị phạt (total_points thấp) vẫn có thể đủ `cycle_points` để promote hôm nay, nhưng chưa chắc đã "nhớ thật" — gap ngắn hơn buộc ôn lại sớm hơn để kiểm chứng.

### 3.5 Cơ chế phạt khi bỏ lỡ ngày ôn (DEC-08)

Áp dụng khi từ đang due mà KHÔNG được mở ra ôn trong ngày đó (kiểm tra qua cron — §5). Trả lời SAI khi đang ôn thì KHÔNG phạt (chỉ không cộng điểm).

| Stage lúc bỏ lỡ | Điểm phạt (trừ `total_points`, sàn 0) |
|---|---|
| new | −1 |
| stage1 | −2 |
| stage2 | −3 |
| stage3 | −4 |
| intensive | −5 |
| mastered | 0 (miễn nhiễm) |

**Không tụt stage** dù bị phạt bao nhiêu (DEC-09 — lapse tắt mặc định).

### 3.6 Giảm điểm khi dùng gợi ý (DEC-19)

Bất kỳ bài nào dùng nút gợi ý (Ctrl) → điểm bài đó **giảm 50%** (làm tròn xuống), áp dụng cho cả `cycle_points` lẫn `total_points`. *(Không áp dụng cho 3 dạng AI-graded — nút gợi ý bị ẩn hoàn toàn ở đó, xem §6.4.)*

### 3.7 Reset `cycle_points` (DEC-05)

`cycle_points` và `cycle_completed_exercises` reset về `0`/`[]` mỗi khi bắt đầu 1 vòng ôn mới của cùng stage (kể cả retry sau khi trượt ngày trước). `total_points` KHÔNG BAO GIỜ reset — chỉ cộng/trừ.

---

## 4. Session & Luồng ôn tập

### 4.1 Gom session (DEC-10)

- Session **thuần 1 stage** — không trộn bài các stage khác nhau.
- "5 từ" là số lý tưởng, KHÔNG ép cứng — phần dư cuối mỗi stage vẫn chạy thành session riêng.
- Thứ tự ưu tiên: `ORDER BY stage ASC, next_review_date ASC` (stage thấp trước; trong cùng stage, quá hạn lâu nhất trước).

### 4.2 Ôn lại trong ngày (DEC-06)

Khi ôn chưa đạt ngưỡng nâng stage:
- Chỉ retry các bài **CHƯA đạt** trong chu kỳ (đọc từ `cycle_completed_exercises`), không lặp lại bài đã đúng.
- **KHÔNG retry ngay lập tức** trong cùng session — dồn vào `daily_retry_queue`, chạy ở lượt riêng SAU KHI đã hoàn thành các session khác trong ngày (giảm rủi ro "nhớ tạm thời").

### 4.3 Flashcard — Good / Hard / Again (DEC-11)

Flashcard KHÔNG tính điểm nâng stage (tự chấm, không khách quan).

| Nút | Hành vi |
|---|---|
| Good | Không cộng điểm, không requeue |
| Hard | Đẩy về **cuối session hiện tại** |
| Again | Coi như SAI → đẩy vào `daily_retry_queue` (reason='flashcard_again') |

### 4.4 Select Dialog / Fill Dialog — ôn 2 từ cùng lúc, không lặp bài

Mỗi câu chỉ có **1 record duy nhất** trong `exercises`, gắn với từ "chính" (A); từ B tham chiếu qua `payload->>'blank_b_vocab_id'`.

**Query build session (mở rộng điều kiện OR):**
```sql
where type = 'select_dialog'
  and (vocab_id in (:session_words) or payload->>'blank_b_vocab_id' in (:session_words))
```
→ Dù A, B, hay cả 2 cùng nằm trong session, câu hỏi chỉ xuất hiện đúng 1 lần.

**Quy tắc điểm:** CHỈ cộng `cycle_points`/`total_points` cho từ đang thực sự due hôm nay. Từ kia (nếu chưa due) vẫn được điền + chấm đúng/sai tại chỗ, nhưng không ảnh hưởng điểm/chu kỳ của nó ("ôn thêm miễn phí").

### 4.5 Chế độ ôn — 2 loại (tách biệt hoàn toàn)

| Chế độ | Nguồn từ | Hiển thị hội thoại (`topic_dialogues`) |
|---|---|---|
| Ôn hằng ngày | Từ due hôm nay, không phân biệt topic | KHÔNG |
| Ôn theo topic | Chọn 1 topic, ôn toàn bộ từ trong topic đó | CÓ — sau khi hoàn thành lượt ôn |

### 4.6 Tổng kết phiên ôn tập hằng ngày (bổ sung — lỗ hổng đã phát hiện, đã sửa lần 2)

⚠️ Trước bản này, logic tính điểm/lên stage/đánh dấu ôn lại (§3) tồn tại nhưng KHÔNG có nơi nào định nghĩa thời điểm tổng hợp lại cho người dùng xem. Bản đầu tiên dùng "tích lũy client-side, hiện 1 lần cuối ngày" — nhưng vỡ nếu người dùng chia nhỏ việc ôn thành nhiều lượt trong ngày (dữ liệu tạm mất khi thoát app giữa chừng). Sửa lại như sau:

**Thời điểm hiển thị — MỖI KHI người dùng thoát Player (không chờ hết cả ngày):**
```
Hiển thị tổng kết khi:
  người dùng rời khỏi Player (hết từ due trong lượt hiện tại, HOẶC chủ động thoát giữa chừng)
  VÀ đã hoàn thành ít nhất 1 từ trong lượt vừa rồi
```
→ Ôn nhiều lượt rải rác trong ngày → thấy tổng kết sau MỖI lượt, không phải chỉ 1 lần duy nhất.

**Nguồn dữ liệu — query `review_log`, KHÔNG dùng state tạm phía client (tránh mất dữ liệu khi thoát app giữa chừng):**
```
Khi cần hiển thị tổng kết:
  SELECT * FROM review_log WHERE reviewed_at::date = CURRENT_DATE
  → tổng điểm/số từ/số từ lên stage = CỘNG DỒN CẢ NGÀY tính đến thời điểm hiện tại,
    không phải chỉ riêng lượt vừa rồi
```
→ Dù thoát app bao nhiêu lần trong ngày, số liệu luôn đúng và đầy đủ vì lấy thẳng từ DB.

**Bổ sung schema** — `review_log` đã có sẵn `stage_before`/`stage_after` (xem §2, bảng 6) để biết từ nào lên stage hôm nay (`word_state` chỉ lưu stage hiện tại, không lưu lịch sử). Ghi 2 cột này ở MỌI dòng review_log (không chỉ dòng gây promote) — 2 giá trị bằng nhau nếu lần trả lời đó không làm đổi stage. Truy vấn "từ nào lên stage hôm nay": `GROUP BY vocab_id WHERE reviewed_at::date=hôm_nay HAVING MIN(stage_before) != MAX(stage_after)`.

**Nội dung cần hiển thị (chi tiết UI ở `UI_DESIGN.md` §8.8):**
- Tổng điểm kiếm được **trong ngày tính đến giờ** (không phải chỉ lượt vừa rồi).
- Số từ đã ôn / số từ đã lên stage trong ngày.
- Danh sách từ đạt **Mastered hôm nay** — làm nổi bật riêng (milestone quan trọng).
- Với từ chưa đạt ngưỡng: "sẽ tiếp tục ôn vào ngày mai" — giọng điệu nhẹ nhàng, không cảnh báo (DEC-08).
- **Nếu vẫn còn từ due chưa ôn trong ngày** (người dùng thoát giữa chừng): thêm 1 dòng nhắc nhẹ "còn N từ đang chờ bạn hôm nay" — KHÔNG phải cảnh báo, chỉ thông tin, và CTA khi đó nên có thêm lựa chọn "Ôn tiếp" bên cạnh "Về Dashboard".


---

## 5. Cron Job (pg_cron, 01:00 GMT+7 = 18:00 UTC mỗi ngày)

```sql
select cron.schedule(
  'daily-srs-maintenance',
  '0 18 * * *',
  $$ select run_daily_maintenance(); $$
);
```

**`run_daily_maintenance()` thực hiện theo thứ tự:**

1. **Phạt điểm (§3.5):** quét từ due hôm nay có `last_reviewed_at::date != hôm_nay` → trừ `total_points` theo bảng phạt, sàn 0.
2. **Reset cycle (§3.7):** với từ đã ôn nhưng chưa đạt ngưỡng → reset `cycle_points=0`, `cycle_completed_exercises='[]'`.
3. **Dọn hàng đợi:** xóa `daily_retry_queue` các dòng `queue_date < hôm_nay`.
4. **Kích hoạt từ mới (nhỏ giọt, §5.1):** đưa thêm từ từ hàng đợi (`next_review_date IS NULL`) vào learning theo `settings.new_words_per_day`.
5. **Cảnh báo hàng đợi cạn (§5.2):** kiểm tra và tạo notification nếu cần.

### 5.1 Kích hoạt từ mới (DEC-16)

```
đã_kích_hoạt_hôm_nay = COUNT(stage='new' AND next_review_date=hôm_nay)
NẾU đã_kích_hoạt_hôm_nay < settings.new_words_per_day:
    lấy thêm từ (next_review_date IS NULL), ORDER BY added_at ASC (FIFO)
    SET next_review_date = hôm_nay
    cho tới khi đủ hạn mức hoặc hết hàng đợi
```

### 5.2 Cảnh báo hàng đợi cạn

```
hàng_đợi_còn_lại = COUNT(next_review_date IS NULL AND stage='new')
NẾU hàng_đợi_còn_lại < new_words_per_day × 3 AND settings.low_queue_alert_enabled = true:
    NẾU chưa có notification type='low_queue' chưa đọc trong 24h qua:
        INSERT notification: "⚠️ Hàng đợi từ mới sắp cạn — chỉ đủ dùng ~X ngày. Hãy import thêm từ vựng."
```

---

## 6. Đặc tả 17 dạng bài tập (Exercise Types)

> Nguyên tắc chung: payload chỉ chứa dữ liệu KHÔNG suy ra được từ `vocab`. Nhiều dạng **không cần record** trong `exercises` — Player đọc thẳng từ `vocab`.

### 6.1 Nhóm Stage 0 (new)

| # | Dạng bài | Payload | Điểm | Đáp án đúng |
|---|---|---|---|---|
| 1 | **Flashcard** | *(không cần record)* | 0 (không tính nâng stage) | — |
| 2 | **Grammar** | `{content_target, pinyin?, content_vi}` | 0 | — (chỉ tham khảo) |
| 3 | **Matching** | *(không cần record)* | +1/từ | `vocab.meaning_vi` |
| 4 | **Selection** | `{distractors: [3 nghĩa sai]}` | +1 | `vocab.meaning_vi` |
| 5 | **Audio Recognition** | `{distractors: [3 nghĩa sai]}` | +1 | `vocab.meaning_vi`, audio=`vocab.audio_url` |
| 6 | **Fast Decision** | `{wrong_meaning: "1 nghĩa sai"}` | +1 | App random 50/50 giữa `vocab.meaning_vi` và `wrong_meaning` lúc runtime |

**Flashcard — Good/Hard/Again:** xem §4.3.

### 6.2 Nhóm Stage 1

| # | Dạng bài | Payload | Điểm | Đáp án đúng |
|---|---|---|---|---|
| 7 | **Translate** | *(không cần record)* | +2 | `vocab.word` (gợi ý ký tự từ `word`) |
| 8 | **Select Dialog** | `{dialog_a, dialog_a_pinyin, dialog_b, dialog_b_pinyin, blank_a_answer, blank_b_vocab_id, distractors: [{word, pinyin} ×2]}` | +2/từ due | Xem §4.4 |
| 9 | **Listen Fill** | *(không cần record)* | +2 | `vocab.word`, audio=`vocab.audio_url` |
| 10 | **Select on Describe** | `{description, distractors: [{word, pinyin} ×3]}` | +2 | `vocab.word` |

### 6.3 Nhóm Stage 2

| # | Dạng bài | Payload | Điểm | Đáp án đúng |
|---|---|---|---|---|
| 11 | **Fill Dialog** | `{dialog_a, dialog_a_pinyin, dialog_b, dialog_b_pinyin, blank_a_answer, blank_b_vocab_id}` (giống Select Dialog, bỏ distractors) | +3/từ due | Nhập tay, so khớp sau khi trim khoảng trắng, KHÔNG cho sai ký tự |
| 12 | **Select Sentence** | `{correct_sentence: {text, pinyin}, wrong_sentences: [{text, pinyin} ×3]}` | +3 | `correct_sentence` |
| 13 | **Arrange Words** | `{tokens: [{text, pinyin} ...]}` (đúng thứ tự gốc) | +3 | Thứ tự mảng gốc; app shuffle khi hiển thị |
| 14 | **Trans Collocation** | *(không cần record — dùng `vocab.collocation`/`collocation_pinyin`/`collocation_meaning_vi`)* | +3 | `vocab.collocation` |

### 6.4 Nhóm Stage 3 (AI-graded)

| # | Dạng bài | Input | Payload | Điểm |
|---|---|---|---|---|
| 15 | **Make Sentence** | Người dùng tự đặt câu chứa từ vựng (hoặc viết ý định bằng `(...)` tiếng Việt nếu chưa đặt được) | *(không cần record — câu hỏi = `vocab.word` + `vocab.meaning_vi` có sẵn)* | good/acceptable=+4, fail=0 |
| 16 | **Trans Sentence** | Dịch câu tiếng Việt cho trước sang ngôn ngữ đích, chứa từ vựng | `{vietnamese_sentence: "câu nguồn tiếng Việt do AI-gen-ngoài soạn"}` | như trên |
| 17 | **Complete Situation** | Viết 1-3 câu hoàn thành tình huống mô tả, chứa từ vựng | `{situation_vi: "1-2 câu mô tả tình huống", given_sentence_zh: "câu tiếng Trung cho trước", given_sentence_pinyin: "..."}` | như trên |

Xem §7 cho chi tiết luồng AI chấm.

**Cả 3 dạng:** nút gợi ý (Ctrl) **ẨN HOÀN TOÀN**. Nút bỏ qua = tính `fail` ngay, KHÔNG gọi AI.

### 6.5 Bảng tổng hợp phiên âm cần bổ sung trong payload

Chỉ 5 dạng bài có nội dung câu/từ do AI-gen-ngoài soạn **hoàn toàn mới** (không suy ra từ `vocab.pinyin`) cần trường `pinyin` riêng trong payload: **Select Dialog, Select on Describe, Fill Dialog, Select Sentence, Arrange Words** (chi tiết field đã liệt kê ở bảng trên). Arrange Words đặc biệt: pinyin đi theo **từng token**, không phải cả câu.

---

## 7. Tích hợp AI — Chấm điểm Stage 3 (DEC-14)

### 7.1 Luồng gọi

Batch theo dạng bài — mỗi session stage3 (5 từ) sinh đúng **3 request** (1/dạng bài, mỗi request chứa 5 câu trả lời).

### 7.2 Request/Response schema

```json
// Request (user content, gửi kèm system prompt cố định)
{
  "exercise_type": "make_sentence",
  "target_lang": "zh",
  "items": [
    { "vocab_id": "uuid-1", "word": "苹果", "meaning_vi": "quả táo", "user_answer": "我昨天吃了一个苹果。" }
  ]
}

// Response bắt buộc từ AI
{
  "results": [
    {
      "vocab_id": "uuid-1",
      "verdict": "good | acceptable | fail",
      "used_vocab_correctly": true,
      "is_translation_request": false,
      "feedback_vi": "...",
      "improved_sentence": null
    }
  ]
}
```

### 7.3 System prompt — quy tắc chấm

- `good`: đúng ngữ pháp + tự nhiên → full điểm, không cần `improved_sentence`.
- `acceptable`: dùng đúng từ nhưng còn gượng → full điểm, PHẢI có `improved_sentence`.
- `fail`: sai/bỏ trống → 0 điểm.
- Nếu câu trả lời là tiếng Việt trong `(...)` → luôn `fail`, `is_translation_request=true`, `improved_sentence` = bản dịch sang ngôn ngữ đích.
- Bắt buộc trả JSON thuần, không markdown.

### 7.4 Xử lý lỗi

Parse JSON fail → thử strip code-fence + parse lại 1 lần → nếu vẫn lỗi hoặc thiếu `vocab_id` nào → không cộng điểm cho từ đó, hiển thị lỗi nhẹ + nút "Chấm lại" (giữ nguyên câu trả lời đã nhập).

---

## 8. Tích hợp AI — Giải thích theo yêu cầu (DEC-23)

**Cơ chế lazy-generate + cache** — ngoại lệ có chủ đích duy nhất khác (ngoài §7) cho phép AI chạy runtime trong app.

- Nút "Giải thích (AI)" hiện ở **mọi bài từ stage 1 trở đi**.
- Bấm lần đầu → `exercises.ai_explanation IS NULL` → gọi OpenRouter → lưu kết quả vào cột này → hiển thị.
- Bấm lại (bất kỳ lúc nào) → đọc thẳng từ DB, KHÔNG gọi lại AI.

**Schema kết quả:**
```json
{
  "question_translation_vi": "...",
  "answer_pinyin": "...",
  "answer_meaning_vi": "...",
  "explanation_vi": "giải thích vì sao đáp án này đúng"
}
```

Prompt tùy biến theo `exercise.type`, output luôn theo schema trên.

---

## 9. TTS (DEC-15)

- **Provider:** Google Cloud TTS.
  ⚠️ **Sửa 2026-09-19 (M6c):** bản trước ghi `cmn-CN-Neural2-*` là **SAI** — kiểm thật thì Google trả
  `Voice 'cmn-CN-Neural2-C' does not exist`. Tiếng Trung chỉ có `cmn-CN-Standard-*`,
  `cmn-CN-Wavenet-*`, `cmn-CN-Chirp3-HD-*`. Chốt dùng **`cmn-CN-Wavenet-A..D`** cho `zh` và
  **`en-US-Neural2-C/F/D/J`** cho `en` (2 ô chọn giọng riêng ở Settings).
- **Chiến lược cache:** gọi TTS đúng **1 lần/từ**, ngay sau khi Import xong (batch toàn bộ từ chưa có `audio_url`) → lưu file mp3 vào Supabase Storage → ghi `vocab.audio_url`. Runtime chỉ phát file tĩnh.
- **Fallback:** Web Speech API khi `audio_url` chưa sẵn sàng.
- **Chọn giọng:** cấu hình ở Settings (§11), nghe thử trước khi chọn (nút loa cạnh mỗi ô giọng).
- **Đặt tên file:** `{lang}/{voice}/{hash(word‖lang‖voice)}.mp3` trong bucket `audio` (công khai đọc,
  ghi chỉ cho `authenticated`). Nhờ vậy 2 dòng `vocab` cùng chữ (cùng từ ở 2 topic) **dùng chung 1 file
  và chỉ tốn 1 lời gọi API**; đổi giọng thì ra file khác nên không phát nhầm giọng cũ.
- **Chạy lại:** ngoài luồng tự chạy sau Import, Settings có nút **"Tạo audio còn thiếu (N từ)"** cho
  những từ đã nhập trước khi có pipeline. Đổi giọng KHÔNG tự gen lại audio cũ (tránh đốt quota).

---

## 10. Import (DEC-21)

### 10.1 Format: JSON, 1 file / 1 topic

```json
{
  "topic": { "name": "Trái cây", "description": "..." },
  "vocab": [
    {
      "temp_id": "v1",
      "word": "苹果", "pinyin": "píngguǒ", "meaning_vi": "quả táo",
      "collocation": "一个苹果", "collocation_pinyin": "yí ge píngguǒ", "collocation_meaning_vi": "một quả táo",
      "example_sentence": "我每天吃一个苹果。", "example_meaning_vi": "Mỗi ngày tôi ăn một quả táo.",
      "lang": "zh"
    }
  ],
  "exercises": [
    { "vocab_temp_id": "v1", "type": "selection", "payload": { "distractors": ["quả chuối", "quả cam", "quả lê"] } }
  ],
  "dialogue": {
    "lines": [
      { "speaker": "A", "text_zh": "你今天吃苹果了吗？", "pinyin": "...", "text_vi": "...", "highlight_vocab_temp_ids": ["v1"] }
    ]
  }
}
```

### 10.2 Cơ chế `temp_id`

UUID thật chỉ sinh sau khi insert vào Supabase — AI-gen-ngoài không biết trước. Dùng `temp_id` (chuỗi tùy ý, duy nhất trong file) để nối `exercises`/`dialogue` với đúng `vocab` trong CÙNG file.

**Thứ tự insert (đảm bảo không bao giờ nhầm sang vocab cũ):**
1. Insert `vocab` trước → nhận UUID thật → map `temp_id → uuid`.
2. Insert `exercises`/`dialogue`, dùng UUID vừa map (KHÔNG tra cứu theo `word` để tìm bản ghi cũ).

### 10.3 Xử lý trùng từ vựng

**LUÔN THÊM MỚI** — không hỏi xác nhận, không merge/ghi đè. Màn Preview hiển thị cảnh báo KHÔNG CHẶN nếu `word` trùng với vocab đã có trong DB.

### 10.4 Luồng UI

```
Chọn file .json
   → Validate (checklist §10.5)
   → Preview (tóm tắt + cảnh báo trùng)
   → Import (1 transaction, tất cả-hoặc-không)
   → Kết quả (lỗi chỉ đúng field/dòng gây lỗi)
   → [background] Gọi TTS cho từ mới (§9)
```

### 10.5 Validate checklist

- [ ] JSON đúng cú pháp; `topic.name` không rỗng.
- [ ] Mỗi vocab có đủ `word`, `meaning_vi`, `lang`.
- [ ] Mọi `exercise.type` thuộc đúng 17 giá trị enum.
- [ ] Mọi `*_temp_id` dùng trong exercises/dialogue khớp với `temp_id` có thật trong mảng `vocab` CÙNG file.
- [ ] Payload đúng shape bắt buộc theo §6.
- [ ] Cảnh báo (không chặn) nếu 1 từ thiếu bài của 1+ dạng.

### 10.6 Audio

File JSON KHÔNG chứa audio. App tự gọi TTS SAU KHI import xong (§9).

### 10.7 JSON Schema chính thức (validate tự động)

Ngoài checklist thủ công ở §10.5, có **1 file JSON Schema hình thức** (chuẩn Draft 2020-12) định nghĩa chính xác cấu trúc/kiểu dữ liệu của file import — dùng để validate tự động bằng công cụ chuẩn (`ajv` cho JS/TS, `jsonschema` cho Python) thay vì chỉ dựa vào đọc bảng mô tả.

**File:** `import-schema.json` (đính kèm cùng bộ tài liệu này / trong skill `vocab-csv-to-import/references/`).

**Bao phủ:**
- Toàn bộ field bắt buộc của `topic`, `vocab[]`, `dialogue.lines[]`.
- Payload có điều kiện theo `exercise.type` (dùng `allOf` + `if/then`) cho cả 11 dạng bài cần payload — sai field, thiếu field, thừa field, sai độ dài mảng (`distractors` phải đúng 3, `select_dialog.distractors` phải đúng 2...) đều bị chặn.
- Ràng buộc có điều kiện: nếu `vocab.lang = "zh"` thì `pinyin` và `collocation_pinyin` bắt buộc phải là string (không được `null`).

**Giới hạn (quan trọng — cần biết trước khi dùng):** JSON Schema thuần túy **không thể** kiểm tra tham chiếu chéo giữa các mảng (VD `exercises[].vocab_temp_id` có thực sự tồn tại trong `vocab[]` hay không — vì đây là ràng buộc "giá trị phải khớp với 1 phần tử khác trong document", ngoài khả năng biểu diễn của JSON Schema tiêu chuẩn). Việc này vẫn cần script riêng (xem `scripts/validate_import.py` trong skill) đảm nhiệm.

→ **Dùng kết hợp cả 2 lớp:** JSON Schema (cấu trúc/kiểu dữ liệu, chạy được bằng công cụ chuẩn của bất kỳ ngôn ngữ nào) + script validate (tham chiếu chéo temp_id, đặc thù nghiệp vụ app). Đã kiểm thử: schema bắt đúng lỗi thiếu field, sai enum, sai độ dài mảng, field thừa, và vi phạm điều kiện `lang=zh → pinyin bắt buộc`.

---

## 11. Settings (DEC-17)

| Key | Mô tả | Mặc định |
|---|---|---|
| `openrouter_api_key` | API key OpenRouter (dùng chung cho §7 và §8) | — (bắt buộc nhập) |
| `openrouter_model` | Model chấm điểm/giải thích | — (chọn từ danh sách) |
| `new_words_per_day` | Số từ mới kích hoạt/ngày (DEC-16) | 5 |
| `google_tts_api_key` | API key Google Cloud TTS (thêm ở M6c) | — (bắt buộc nhập) |
| `tts_voice` | Giọng TTS tiếng Trung | `cmn-CN-Wavenet-A` |
| `tts_voice_en` | Giọng TTS tiếng Anh (thêm ở M6c) | `en-US-Neural2-C` |
| `low_queue_alert_enabled` | Bật/tắt cảnh báo hàng đợi cạn | true |

*Không có màn "lịch sử quyết định" — giữ Settings gọn nhẹ.*

---

## 12. Mastery Points & Vòng tròn tiến độ (DEC-12)

### 12.1 Hình ảnh trung tâm — 6 hình = 6 stage (1:1)

```
🌱 Hạt giống = new   🌿 Mầm = stage1   🌾 Chồi = stage2
🍃 Ra lá = stage3    🌸 Nở hoa = intensive   🍎 Kết quả = mastered
```

### 12.2 Viền (mastery ring)

```
% viền = min(total_points, 30) / 30    -- CHỈ dùng total_points, không dùng cycle_points
```

| `total_points` | % viền | Màu | Mã màu |
|---|---|---|---|
| 0–5 | 0–19% | Đỏ | `#ef4444` |
| 6–11 | 20–39% | Cam | `#f97316` |
| 12–17 | 40–59% | Vàng | `#eab308` |
| 18–23 | 60–79% | Vàng chanh | `#a3e635` |
| 24–29 | 80–99% | Xanh lá nhạt | `#4ade80` |
| 30 (Mastered) | 100% | Xanh lá đậm | `#16a34a` |

Nếu `total_points` bị phạt (§3.5), viền **lùi màu tương ứng** — hành vi mong muốn, phản ánh đúng thực tế đang quên dần.

---

## 13. Danh sách màn hình (Screens)

| Màn hình | Chức năng chính |
|---|---|
| Dashboard | Tổng quan tiến độ, số từ due hôm nay, vòng tròn tiến độ tổng |
| Ôn tập hằng ngày (Player) | Chạy session theo §4.1–4.4, 17 dạng bài §6 |
| Ôn tập theo topic (Player) | Giống trên nhưng theo 1 topic, có hội thoại kết thúc (§4.5) |
| **Tổng kết phiên ôn tập hằng ngày** | Hiển thị 1 lần sau khi hết due+retry trong ngày — điểm/lên stage/từ Mastered (§4.6) |
| Quản lý từ vựng — Topic | Sửa/xóa từ, topic |
| Import | Luồng §10 |
| Cài đặt | §11 |
| Thông báo | Danh sách `notifications`, đánh dấu đã đọc |

---

## 14. Ghi chú triển khai (thứ tự đề xuất)

1. **Migration DB** — toàn bộ SQL ở §2.
2. **SQL functions** — `run_daily_maintenance()` (§5) + đăng ký `pg_cron`.
3. **Import validator + luồng Import** (§10) — cần trước vì không có dữ liệu thì không test được gì khác.
4. **File mẫu JSON** (1 topic ví dụ đủ 17 dạng bài) — dùng làm chuẩn yêu cầu AI-gen-ngoài (việc tiếp theo sau tài liệu này).
5. **SRS engine** (§3) — hàm tính promote/demote/gap/phạt, tách riêng khỏi UI để dễ test.
6. **Player UI** — từng nhóm dạng bài theo §6, bắt đầu từ Stage 0 (đơn giản nhất).
7. **AI integration** (§7, §8) — sau khi Player cơ bản chạy được.
8. **TTS pipeline** (§9), **Settings** (§11), **Dashboard/vòng tròn tiến độ** (§12).

---

