# DESIGN.md — M1: Database (schema + RLS + cron maintenance)

> ⚠️ File này là **kiến trúc + kế hoạch của RIÊNG task M1**, ghi đè bản M0
> (bản M0 vẫn lấy lại được: `git checkout b42550d -- DESIGN.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-09 · Trạng thái: **DESIGN ĐÃ DUYỆT (2026-09-09) — CHỜ DUYỆT PLAN**

---

## 0. Phạm vi

**Trong phạm vi M1:**
1. Migration schema §2 — 2 enum + **10 bảng** (xem đính chính §6) + 8 index.
2. RLS theo Phương án A đã chốt (Supabase Auth 1 tài khoản).
3. Seed 5 dòng `settings`.
4. `run_daily_maintenance()` (§5, 5 bước) + đăng ký `pg_cron` 18:00 UTC.
5. Cơ chế **chạy** migration + bộ **kiểm chứng** tự động.

**NGOÀI phạm vi M1 (không đụng tới):** mọi UI kể cả màn Đăng nhập, `srs.ts`, Import,
Storage bucket audio (để M6 làm cùng TTS), `ai.ts`.

---

## 1. Nền đã kiểm chứng (chạy thật, không phải giả định)

| Sự thật | Bằng chứng |
|---|---|
| Postgres **17.6**, schema `public` trống 0 bảng | Management API query |
| `pg_cron` **có sẵn** nhưng **chưa cài** | `pg_available_extensions`=1, `pg_extension`=0 |
| **DB timezone = `UTC`** | `current_setting('TimeZone')` |
| Management API `POST /v1/projects/{ref}/database/query` chạy được SQL tuỳ ý | HTTP 201 |
| Auth: 1 user `936692ac…`, đã confirm, `disable_signup=true` | `npm run check:auth` ✅ 9/9 |

---

## 2. Quyết định kiến trúc

### D-1 · Chạy migration bằng script Node thuần, KHÔNG cài Supabase CLI

**Chọn:** `scripts/db-migrate.mjs` — đọc lần lượt `supabase/migrations/*.sql` theo thứ tự tên,
POST từng file lên Management API bằng `fetch` có sẵn của Node.

**Loại bỏ:** cài `supabase` CLI làm devDependency (binary ~50MB, phải `supabase link`, phải nhập
DB password riêng). Theo `ponytail`: stack hiện có (`fetch` + `SUPABASE_ACCESS_TOKEN` đã chứng minh
hoạt động) giải quyết trọn vẹn → không thêm package.

**Đánh đổi chấp nhận:** không có bảng lịch sử migration kiểu CLI. Bù lại bằng **D-2** — chạy lại
toàn bộ bao nhiêu lần cũng không hỏng.

### D-2 · Mọi migration phải idempotent (chạy lại được vô hạn lần)

| Đối tượng | Cách viết |
|---|---|
| enum | `do $$ begin create type … ; exception when duplicate_object then null; end $$;` |
| bảng / index | `create table if not exists` · `create index if not exists` |
| policy | `drop policy if exists` rồi `create policy` |
| function | `create or replace function` |
| seed settings | `insert … on conflict (key) do nothing` — **không ghi đè khoá API user đã nhập** |
| cron job | `cron.unschedule` nếu đã tồn tại → `cron.schedule` |

### D-3 · Bố cục file

```
/supabase/migrations
  0001_extensions.sql   -- pg_cron
  0002_schema.sql       -- 2 enum + 10 bảng + 8 index  (§2 nguyên văn)
  0003_rls.sql          -- enable RLS + 10 policy
  0004_seed_settings.sql
  0005_maintenance.sql  -- run_daily_maintenance()
  0006_cron.sql         -- đăng ký lịch 18:00 UTC
/scripts
  db-migrate.mjs        -- npm run db:migrate
  check-schema.mjs      -- npm run check:schema   (nghiệm thu)
  test-maintenance.mjs  -- npm run test:db        (TDD cho hàm cron)
```

---

## 3. Thiết kế RLS

Mọi bảng bật RLS + **đúng 1 policy đồng dạng**, KHÔNG thêm cột `user_id` (schema §2 giữ nguyên 100%):

```sql
alter table <t> enable row level security;
drop policy if exists "authenticated_full_access" on <t>;
create policy "authenticated_full_access" on <t>
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
```

- `to authenticated` ⇒ role `anon` **không có policy nào** ⇒ RLS từ chối sạch. Người lạ cầm
  `anon key` không đọc / ghi / xoá được gì.
- `run_daily_maintenance()` khai **`security definer` + `set search_path = public, pg_catalog`**.
  pg_cron chạy dưới role `postgres` (vốn bypass RLS), khai rõ để không phụ thuộc ngầm định.

---

## 4. `run_daily_maintenance()` — 3 cái bẫy phải xử lý

### 🪤 Bẫy 1 (nghiêm trọng) — `current_date` sẽ SAI NGÀY

DB chạy `UTC`, cron chạy **18:00 UTC = 01:00 sáng GMT+7 của ngày hôm sau**. Ngay tại thời điểm đó
`current_date` (UTC) vẫn còn là **ngày hôm trước** theo giờ Việt Nam.

→ **Cấm dùng `current_date` trong hàm.** Khai biến rõ ràng ngay đầu hàm:

```sql
hom_nay      date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;  -- ngày VN vừa bắt đầu
ngay_vua_qua date := hom_nay - 1;                                    -- ngày VN vừa kết thúc
```

Ánh xạ 5 bước §5 vào đúng mốc:

| Bước §5 | Mốc dùng | Vì sao |
|---|---|---|
| 1. Phạt điểm | `ngay_vua_qua` | phạt cho ngày **vừa kết thúc**, không phải ngày mới mở |
| 2. Reset cycle | `ngay_vua_qua` | cùng lý do |
| 3. Dọn `daily_retry_queue` | xoá `queue_date < hom_nay` | hàng đợi ngày cũ hết hiệu lực |
| 4. Kích hoạt từ mới | `hom_nay` | từ mới để ôn **trong ngày mới** |
| 5. Cảnh báo hàng đợi | — | chỉ đếm |

### 🪤 Bẫy 2 — đọc `new_words_per_day` từ JSONB

`settings.value` kiểu `jsonb`. Ép thẳng `::text::int` sẽ vấp chuỗi `"5"` có dấu nháy → lỗi.
Phải dùng `(value #>> '{}')::int`, bọc `coalesce(…, 5)` phòng khi key bị xoá.

### 🪤 Bẫy 3 — bảng phạt phải khớp enum, `mastered` miễn nhiễm

`case stage` liệt kê đủ 6 nhánh (`new` −1 · `stage1` −2 · `stage2` −3 · `stage3` −4 ·
`intensive` −5 · `mastered` **0**), kết quả bọc `greatest(total_points - phat, 0)` (sàn 0, §3.5).
**Tuyệt đối không đụng cột `stage`** (DEC-09 — không bao giờ tụt stage).

---

## 5. Chiến lược TDD cho hàm cron (bắt buộc — đây là "logic không tầm thường")

`npm run test:db` gửi **một chuỗi SQL duy nhất** dạng:

```
begin;
  <seed dữ liệu giả>
  <gọi run_daily_maintenance()>
  <select … so sánh kỳ vọng, trả cột pass boolean>
rollback;
```

`rollback` cuối cùng ⇒ **test không để lại một dòng rác nào** trong DB thật.

Bộ ca kiểm thử tối thiểu:

| # | Ca | Kỳ vọng |
|---|---|---|
| T1 | từ `stage2` due hôm qua, không ôn | `total_points` bị trừ **3** |
| T2 | từ `stage2` due hôm qua, **đã ôn** hôm qua | **không** bị trừ |
| T3 | từ `mastered` due hôm qua, không ôn | điểm **không đổi** (miễn nhiễm) |
| T4 | từ `new`, `total_points = 0`, bị phạt | vẫn `= 0`, **không âm** (sàn 0) |
| T5 | từ bị phạt bất kể bao nhiêu | `stage` **không đổi** (DEC-09) |
| T6 | 12 từ hàng đợi `next_review_date IS NULL`, `new_words_per_day = 5` | đúng **5** từ được set `next_review_date = hom_nay`, chọn **FIFO** theo `added_at` |
| T7 | hàng đợi còn 7 từ (< 5×3) | tạo đúng **1** notification `low_queue` |
| T8 | chạy hàm **2 lần liên tiếp** | không phạt chồng, không kích hoạt vượt hạn mức |
| T9 | `daily_retry_queue` có dòng `queue_date` hôm qua | bị xoá |

**Thứ tự bắt buộc (`CLAUDE.md` Bước 3):** viết T1–T9 và chạy khi hàm **chưa tồn tại** → phải thấy
ĐỎ trước (chứng minh test có ý nghĩa), rồi mới viết `0005_maintenance.sql` cho chuyển XANH.

---

## 6. Quyết định đã chốt với người dùng (2026-09-09)

| Mã | Câu hỏi | **Chốt** | Hệ quả kỹ thuật |
|---|---|---|---|
| **Q1** | Từ quá hạn nhiều ngày bị phạt mấy lần? | **Phạt mỗi ngày bỏ lỡ** | Điều kiện phạt dùng `next_review_date <= ngay_vua_qua` (không phải `=`). **Giữ nguyên schema §2**, không thêm cột. Sàn 0 chặn kịch bản tệ nhất. |
| **Q2** | Ngày due của từ mới khi cron kích hoạt | **Theo §5.1 — `hom_nay`** | Bỏ cách hiểu "+1 ngày" ở sơ đồ §3.1. Mở app buổi sáng là thấy từ mới ngay. |
| **Q3** | Thêm index ngoài spec cho §4.6? | **Có** | Thêm `idx_review_log_reviewed_at on review_log (reviewed_at)` → tổng **8 index** (7 của spec + 1). |
| **Q4** | Cách bật `pg_cron` | Thử bằng SQL trước | Nếu Management API chặn → **dừng, nhờ người dùng bật ở Dashboard**, không lẳng lặng bỏ qua cron. |

### 🔎 Đính chính phát sinh khi rà spec: **10 bảng, không phải 9**

`SPECIFICATION.md` §2 đánh số 9 nhóm, nhưng nhóm 2 chứa **2 bảng** (`vocab` + bảng n-n
`vocab_topics`). Tổng thực tế:

```
topics · vocab · vocab_topics · word_state · daily_retry_queue
exercises · review_log · topic_dialogues · notifications · settings   → 10 bảng
```

`memory-bank/systemPatterns.md` §6 cũng đang ghi "9 bảng". **Quan trọng với M1:** nếu bật RLS theo
con số 9 thì `vocab_topics` sẽ bị bỏ sót ⇒ người lạ cầm `anon key` đọc/xoá được toàn bộ quan hệ
từ-vựng ↔ chủ đề. Mọi chỗ trong M1 dùng **danh sách tên bảng tường minh**, không đếm theo trí nhớ.

### 🔓 Lỗ hổng thứ hai đã lường: `SECURITY DEFINER` + PostgREST RPC

Hàm `run_daily_maintenance()` khai `security definer` (chạy quyền chủ sở hữu, bypass RLS). Postgres
mặc định cấp `execute` cho `public` ⇒ **bất kỳ ai cầm `anon key` đều gọi được qua
`POST /rest/v1/rpc/run_daily_maintenance`** và ép chạy vòng phạt điểm bất cứ lúc nào.

→ Bắt buộc trong `0005`:
`revoke all on function run_daily_maintenance() from public, anon, authenticated;`
Chỉ role `postgres` (pg_cron) gọi được.

---

## 7. KẾ HOẠCH THỰC THI — 17 task

> Mỗi task 2–5 phút. Code cụ thể, không pseudocode. Thứ tự **không được đảo**: hạ tầng → schema →
> RLS → seed → TDD hàm cron → cron → nghiệm thu.

### Nhóm 1 · Hạ tầng chạy migration (T1–T3)

**T1 — `scripts/db-migrate.mjs`**
Đọc `.env.local` (tái dùng hàm `docEnv` đã có ở `check-db.mjs`), liệt kê `supabase/migrations/*.sql`
sort theo tên, POST tuần tự. Dừng ngay ở file đầu tiên lỗi (không chạy tiếp file sau).

```js
const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)[1]
for (const ten of files) {
  const sql = readFileSync(`supabase/migrations/${ten}`, 'utf8')
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${mgmt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) { console.error(`❌ ${ten} — HTTP ${res.status}: ${body?.message ?? ''}`); process.exit(1) }
  console.log(`✅ ${ten}`)
}
```

**T2 — thêm 3 script vào `package.json`** (patch cục bộ, không viết lại file):
`"db:migrate"` · `"check:schema"` · `"test:db"`.

**T3 — `supabase/migrations/0001_extensions.sql`** rồi chạy `npm run db:migrate`:

```sql
create extension if not exists pg_cron;
```

**Cổng kiểm tra:** query `select count(*) from pg_extension where extname='pg_cron'` phải trả `1`.
Nếu API từ chối (thiếu quyền) → **DỪNG, báo người dùng bật tay ở Dashboard** (Q4).

---

### Nhóm 2 · Schema (T4–T6)

**T4 — `0002_schema.sql`.** Chép **nguyên văn** SQL `SPECIFICATION.md` §2 (2 enum + 10 bảng +
7 index), áp 3 sửa đổi cơ học:
1. `create table` → `create table if not exists`; `create index` → `create index if not exists`.
2. 2 enum bọc trong khối bắt lỗi trùng:
   ```sql
   do $$ begin create type word_stage as enum (...);
   exception when duplicate_object then null; end $$;
   ```
3. Bỏ khối `insert into settings` ra khỏi file này (chuyển sang `0004`, vì cần `on conflict`).

**T5 — thêm index của Q3** vào cuối `0002`:
```sql
create index if not exists idx_review_log_reviewed_at on review_log (reviewed_at);
```

**T6 — chạy `npm run db:migrate`.** Cổng: `information_schema.tables` đếm đúng **10** bảng.

---

### Nhóm 3 · RLS (T7–T8)

**T7 — `0003_rls.sql`.** Danh sách bảng viết **tường minh** (chống bẫy "9 vs 10 bảng"):

```sql
do $$
declare t text;
begin
  foreach t in array array[
    'topics','vocab','vocab_topics','word_state','daily_retry_queue',
    'exercises','review_log','topic_dialogues','notifications','settings'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "authenticated_full_access" on %I', t);
    execute format($p$create policy "authenticated_full_access" on %I
      for all to authenticated
      using (auth.uid() is not null) with check (auth.uid() is not null)$p$, t);
  end loop;
end $$;
```

**T8 — `scripts/check-schema.mjs` + chạy.** 7 nhóm assertion:
10 bảng · 2 enum (đủ 6 + 17 nhãn) · 8 index · `relrowsecurity = true` cả 10 bảng ·
10 policy đúng tên · cron job đã đăng ký · 5 dòng `settings`.
Kèm **2 phép thử RLS bằng HTTP thật**: gọi `/rest/v1/topics` bằng **anon key trần** → phải bị từ
chối; gọi bằng **access token đăng nhập** → phải `200`.

---

### Nhóm 4 · Seed (T9)

**T9 — `0004_seed_settings.sql`** (`on conflict do nothing` để không đè khoá API user đã nhập):

```sql
insert into settings (key, value) values
  ('openrouter_api_key', 'null'), ('openrouter_model', 'null'),
  ('new_words_per_day', '5'), ('tts_voice', '"cmn-CN-Neural2-A"'),
  ('low_queue_alert_enabled', 'true')
on conflict (key) do nothing;
```

---

### Nhóm 5 · TDD hàm cron — RED → GREEN → REFACTOR (T10–T12)

**T10 (🔴 RED) — `scripts/test-maintenance.mjs` với T1–T9 (§5), chạy khi hàm CHƯA tồn tại.**
Bắt buộc thấy ĐỎ trước (`function run_daily_maintenance() does not exist`) — đó là bằng chứng test
có ý nghĩa. Mỗi ca là 1 chuỗi `begin; … rollback;` độc lập, seed bằng `gen_random_uuid()`.

**T11 (🟢 GREEN) — `0005_maintenance.sql`:**

```sql
create or replace function run_daily_maintenance() returns void
language plpgsql security definer set search_path = public, pg_catalog as $fn$
declare
  hom_nay      date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  ngay_vua_qua date := hom_nay - 1;
  so_tu_moi    int  := coalesce((select (value #>> '{}')::int
                                 from settings where key = 'new_words_per_day'), 5);
  bat_canh_bao boolean := coalesce((select (value #>> '{}')::boolean
                                 from settings where key = 'low_queue_alert_enabled'), true);
  da_kich_hoat int; con_lai int;
begin
  -- B1. Phạt (§3.5/DEC-08) — chỉ trừ total_points, TUYỆT ĐỐI không đụng stage (DEC-09)
  update word_state ws set
    total_points = greatest(ws.total_points - case ws.stage
        when 'new' then 1 when 'stage1' then 2 when 'stage2' then 3
        when 'stage3' then 4 when 'intensive' then 5 else 0 end, 0),
    updated_at = now()
  where ws.next_review_date is not null
    and ws.next_review_date <= ngay_vua_qua              -- Q1: phạt mỗi ngày bỏ lỡ
    and ws.stage <> 'mastered'                            -- miễn nhiễm
    and coalesce((ws.last_reviewed_at at time zone 'Asia/Ho_Chi_Minh')::date,
                 date '-infinity') <> ngay_vua_qua        -- đã ôn hôm qua thì tha
    and (ws.updated_at at time zone 'Asia/Ho_Chi_Minh')::date < hom_nay;  -- chống phạt chồng (T8)

  -- B2. Reset cycle (§3.7/DEC-05)
  update word_state set cycle_points = 0, cycle_completed_exercises = '[]', updated_at = now()
  where next_review_date is not null and next_review_date <= ngay_vua_qua and cycle_points > 0;

  -- B3. Dọn hàng đợi retry của ngày cũ
  delete from daily_retry_queue where queue_date < hom_nay;

  -- B4. Nhỏ giọt từ mới (§5.1, Q2 = hom_nay), FIFO theo added_at
  select count(*) into da_kich_hoat from word_state
   where stage = 'new' and next_review_date = hom_nay;
  if da_kich_hoat < so_tu_moi then
    update word_state set next_review_date = hom_nay, updated_at = now()
    where vocab_id in (select vocab_id from word_state
                        where next_review_date is null and stage = 'new'
                        order by added_at asc limit (so_tu_moi - da_kich_hoat));
  end if;

  -- B5. Cảnh báo hàng đợi cạn (§5.2)
  select count(*) into con_lai from word_state
   where next_review_date is null and stage = 'new';
  if bat_canh_bao and con_lai < so_tu_moi * 3
     and not exists (select 1 from notifications
                      where type = 'low_queue' and is_read = false
                        and created_at > now() - interval '24 hours') then
    insert into notifications (type, message) values ('low_queue',
      format('⚠️ Hàng đợi từ mới sắp cạn — chỉ đủ dùng ~%s ngày. Hãy import thêm từ vựng.',
             floor(con_lai::numeric / greatest(so_tu_moi, 1))));
  end if;
end $fn$;

-- BẮT BUỘC: chặn gọi hàm SECURITY DEFINER qua PostgREST RPC bằng anon key (§6)
revoke all on function run_daily_maintenance() from public, anon, authenticated;
```

**T12 (♻️ REFACTOR) — chạy lại `npm run test:db`, phải 9/9 xanh.** Ghi chú vào file SQL đánh đổi
đã biết: từ được ôn trong khung **00:00–01:00 giờ VN** (trước lúc cron chạy) sẽ **không bị phạt**
cho ngày hôm trước — cửa sổ hiếm, và lệch về phía **khoan dung**, đúng tinh thần sản phẩm.

---

### Nhóm 6 · Đăng ký cron (T13–T14)

**T13 — `0006_cron.sql`** (idempotent: gỡ job cũ trước khi đăng ký):

```sql
do $$ begin
  perform cron.unschedule('daily-srs-maintenance')
   where exists (select 1 from cron.job where jobname = 'daily-srs-maintenance');
end $$;
select cron.schedule('daily-srs-maintenance', '0 18 * * *', $$ select run_daily_maintenance(); $$);
```

**T14 — chạy migrate + kiểm tra `cron.job`** có đúng 1 dòng, `schedule = '0 18 * * *'`, `active`.

---

### Nhóm 7 · Nghiệm thu & ký ức (T15–T17)

**T15 — chạy `npm run db:migrate` LẦN 2** → phải xanh y hệt (bằng chứng idempotent, D-2).
**T16 — chạy trọn bộ:** `check:schema` · `test:db` · `check:auth` · `build` · `test`.
**T17 — cập nhật `memory-bank/`:** `activeContext.md` (M1 xong, gỡ câu hỏi mở #2/#3),
`progress.md` (tick M1), `decisionLog.md` (**MB-10** Phương án A + Q1–Q4 + đính chính "10 bảng"),
`systemPatterns.md` §6 (sửa "9 bảng" → 10). Dọn mọi tiến trình nền do phiên tạo.

---

## 8. Bằng chứng nghiệm thu M1 (thiếu bất kỳ dòng nào thì không được báo "xong")

| Lệnh | Kỳ vọng |
|---|---|
| `npm run db:migrate` | 6/6 file SQL xanh, **chạy lại lần 2 vẫn xanh** (chứng minh idempotent) |
| `npm run check:schema` | 10 bảng ✅ · 2 enum ✅ · 8 index ✅ · **RLS bật đủ 10 bảng** ✅ · 10 policy ✅ · cron job đã đăng ký ✅ · 5 dòng settings ✅ · **anon bị chặn / authenticated đọc được** ✅ |
| `npm run test:db` | **9/9 ca T1–T9 pass**, DB sạch sau khi chạy (nhờ rollback) |
| Kiểm tra RLS thật | REST bằng **anon key trần** → phải BỊ TỪ CHỐI; REST bằng **access token đã đăng nhập** → phải ĐỌC ĐƯỢC |
| `npm run build` + `npm test` | vẫn xanh (M1 không đụng frontend — đây là lưới an toàn) |
