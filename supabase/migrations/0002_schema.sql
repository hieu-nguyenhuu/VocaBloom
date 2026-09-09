-- 0002_schema.sql — SPECIFICATION.md §2: 2 enum + 10 bảng + 8 index.
--
-- Chép nguyên văn §2, chỉ áp 3 sửa đổi cơ học để IDEMPOTENT (DESIGN.md M1 · D-2):
--   1. create table/index  -> ... if not exists
--   2. create type         -> bọc trong khối bắt duplicate_object
--   3. seed settings tách sang 0004 (cần on conflict do nothing)
--
-- ⚠️ §2 đánh số "9 nhóm" nhưng thực tế là 10 BẢNG (nhóm 2 chứa cả vocab_topics).

-- ============================================================
-- ENUM
-- ============================================================
do $$ begin
  create type word_stage as enum ('new','stage1','stage2','stage3','intensive','mastered');
exception when duplicate_object then null; end $$;

do $$ begin
  create type exercise_type as enum (
    'flashcard','grammar','matching','selection','audio_recognition','fast_decision',
    'translate','select_dialog','listen_fill','select_on_describe',
    'fill_dialog','select_sentence','arrange_words','trans_collocation',
    'make_sentence','trans_sentence','complete_situation'
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- 1. TOPICS
-- ============================================================
create table if not exists topics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 2. VOCAB (+ quan hệ n-n vocab_topics)
-- ============================================================
create table if not exists vocab (
  id                     uuid primary key default gen_random_uuid(),
  word                   text not null,
  pinyin                 text,
  meaning_vi             text not null,
  collocation            text,
  collocation_pinyin     text,          -- DEC-13
  collocation_meaning_vi text,          -- DEC-13
  example_sentence       text,
  example_meaning_vi     text,
  lang                   text not null check (lang in ('zh','en')),
  audio_url              text,          -- cache TTS, null tới khi được gen (DEC-15)
  created_at             timestamptz not null default now()
);

create table if not exists vocab_topics (
  vocab_id uuid references vocab(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  primary key (vocab_id, topic_id)
);

-- ============================================================
-- 3. WORD_STATE — trạng thái SRS (lõi hệ thống)
-- ============================================================
create table if not exists word_state (
  vocab_id                  uuid primary key references vocab(id) on delete cascade,
  stage                     word_stage not null default 'new',
  next_review_date          date,                        -- NULL = hàng đợi chờ (DEC-16)
  added_at                  timestamptz not null default now(),
  cycle_points              int not null default 0,      -- DEC-05
  cycle_completed_exercises jsonb not null default '[]',  -- DEC-06
  total_points              int not null default 0,      -- DEC-04/18
  last_reviewed_at          timestamptz,
  consecutive_fails         int not null default 0,      -- dự phòng, KHÔNG dùng tụt stage (DEC-09)
  updated_at                timestamptz not null default now()
);

create index if not exists idx_word_state_due on word_state (stage, next_review_date);
create index if not exists idx_word_state_queue on word_state (next_review_date)
  where next_review_date is null;

-- ============================================================
-- 4. DAILY_RETRY_QUEUE (DEC-06)
-- ============================================================
create table if not exists daily_retry_queue (
  id             uuid primary key default gen_random_uuid(),
  vocab_id       uuid not null references vocab(id) on delete cascade,
  reason         text not null check (reason in ('below_threshold','flashcard_again')),
  exercise_types jsonb,          -- null = retry cả bộ; mảng = chỉ các bài chưa đạt
  queue_date     date not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_retry_queue_date on daily_retry_queue (queue_date);

-- ============================================================
-- 5. EXERCISES — 17 dạng bài, payload JSONB (DEC-22)
-- ============================================================
create table if not exists exercises (
  id             uuid primary key default gen_random_uuid(),
  vocab_id       uuid not null references vocab(id) on delete cascade,
  type           exercise_type not null,
  payload        jsonb not null default '{}',
  ai_explanation jsonb,          -- lazy-cache (DEC-23)
  created_at     timestamptz not null default now()
);

create index if not exists idx_exercises_vocab_type on exercises (vocab_id, type);
create index if not exists idx_exercises_blank_b on exercises using gin (payload)
  where type in ('select_dialog','fill_dialog');

-- ============================================================
-- 6. REVIEW_LOG (DEC-13, §4.6)
-- ============================================================
create table if not exists review_log (
  id            uuid primary key default gen_random_uuid(),
  vocab_id      uuid not null references vocab(id) on delete cascade,
  exercise_type exercise_type not null,
  is_correct    boolean not null,
  used_hint     boolean not null default false,   -- DEC-19
  points        int not null default 0,
  stage_before  word_stage,
  stage_after   word_stage,
  reviewed_at   timestamptz not null default now()
);

create index if not exists idx_review_log_daily on review_log (vocab_id, reviewed_at);

-- Q3 (chốt 2026-09-09) — index NGOÀI spec.
-- §4.6 query review_log theo CẢ NGÀY, không lọc theo từ; idx_review_log_daily có
-- cột dẫn đầu là vocab_id nên không dùng được cho query đó -> sẽ quét toàn bảng.
create index if not exists idx_review_log_reviewed_at on review_log (reviewed_at);

-- ============================================================
-- 7. TOPIC_DIALOGUES (DEC-20)
-- ============================================================
create table if not exists topic_dialogues (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references topics(id) on delete cascade,
  content    jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_topic_dialogue_topic on topic_dialogues (topic_id);

-- ============================================================
-- 8. NOTIFICATIONS (DEC-16)
-- ============================================================
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9. SETTINGS — key-value (DEC-17). Seed nằm ở 0004.
-- ============================================================
create table if not exists settings (
  key   text primary key,
  value jsonb not null
);
