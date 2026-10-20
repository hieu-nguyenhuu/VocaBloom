# M32 — Công tắc "Thêm từ mới hằng ngày" ở màn Cài đặt

> Task nhỏ (1 key settings + 1 điều kiện trong cron + 1 hàng UI) ⇒ Design + Plan gộp 1 file (như M30).
> Màn: Cài đặt (mockup 17), nhóm "Học tập". Biến thể nhỏ, tái dùng `CongTac` có sẵn — không phải màn mới.

## 1. Yêu cầu đã chốt (Brainstorm 2026-10-21)

| # | Câu hỏi | Chốt |
|---|---|---|
| Q1 | Công tắc làm gì | Chỉ khi BẬT, cron 01:00 mới nhỏ giọt từ mới (bước B4). Từ ĐÃ kích hoạt vẫn ôn bình thường, không bị ảnh hưởng |
| Q2 | Giá trị ban đầu | **Bật sẵn** — giữ hành vi hiện tại cho tới khi người dùng tự tắt |
| Q3 | Bật giữa ngày | Có hiệu lực từ **01:00 sáng mai** (chờ cron, không kích hoạt ngay) |
| Q4 | Cảnh báo "hàng đợi sắp cạn" khi TẮT | **Không gửi** (B5 bỏ qua) — không thêm từ thì hàng đợi không vơi |

## 2. Dữ liệu & cron
- Key mới `new_words_enabled` (jsonb boolean) trong bảng `settings`, seed `true` ở migration mới `0019_bat_tu_moi.sql` (`on conflict do nothing`, khuôn `0012`).
- `run_daily_maintenance()` sửa TẠI CHỖ ở `0005` (1 định nghĩa): đọc `bat_tu_moi` (thiếu key ⇒ `true`);
  B4 chỉ chạy khi `bat_tu_moi`; B5 thêm điều kiện `bat_tu_moi`. B1–B3 (phạt, reset cycle, dọn retry) KHÔNG đổi.

## 3. Giao diện (nhóm "Học tập", ngay trên stepper "Số từ mới/ngày")
```
Thêm từ mới hằng ngày                         [● công tắc]
Mỗi ngày lúc 01:00 thêm 8 từ từ hàng đợi. Thay đổi có hiệu lực từ 01:00 sáng mai.   ← 12px muted
   (tắt: "Đang tạm dừng — không thêm từ mới, từ đã học vẫn ôn bình thường.")
Số từ mới/ngày                                 −  8  +      ← mờ 50% khi tắt (vẫn chỉnh được)
```
0 màu mới, chỉ token Lớp 2 hiện có.

## 4. Plan (TDD cho logic, ~9 task)

### T1 · RED — `src/lib/settings.test.ts`
Ca "đủ 8 key" ⇒ "đủ 9 key": thêm `{ key: 'new_words_enabled', value: false }` vào input và `new_words_enabled: false` vào kết quả.
Thêm vào ca "sai kiểu": `expect(docCaiDat([{ key: 'new_words_enabled', value: 'false' }]).new_words_enabled).toBe(true)`.
Thêm ca: `it('mặc định BẬT thêm từ mới (giữ hành vi cũ — M32/Q2)', () => expect(MAC_DINH.new_words_enabled).toBe(true))`.
`npm test -- settings` ⇒ ĐỎ.

### T2 · GREEN — `src/lib/settings.ts`
```ts
  /** M32 — chỉ khi true cron 01:00 mới nhỏ giọt từ mới (B4); từ đã kích hoạt không bị ảnh hưởng. */
  new_words_enabled: boolean
```
`MAC_DINH.new_words_enabled: true`; trong `docCaiDat`: `const batTuMoi = m.get('new_words_enabled')` →
`new_words_enabled: typeof batTuMoi === 'boolean' ? batTuMoi : MAC_DINH.new_words_enabled`. Sửa docblock "7 key" → "9 key". ⇒ XANH.

### T3 · RED — `scripts/test-maintenance.mjs`
`DON_SACH` thêm: `insert into settings (key, value) values ('new_words_enabled', 'true') on conflict (key) do update set value = 'true';`
Hằng `TAT_TU_MOI = "update settings set value = 'false' where key = 'new_words_enabled';"`. Thêm 2 ca:
```js
  {
    ma: 'T10',
    ten: 'M32 — TẮT thêm từ mới: 12 từ hàng đợi → KHÔNG kích hoạt từ nào',
    seed: TAT_TU_MOI + hangDoi(12),
    goi: 1,
    assert: `select (select count(*) from word_state where next_review_date = ${HOM_NAY}) = 0 as pass,
                    'đã kích hoạt=' || (select count(*) from word_state where next_review_date = ${HOM_NAY}) as chi_tiet`,
  },
  {
    ma: 'T11',
    ten: 'M32 — TẮT thêm từ mới: hàng đợi 7 từ → KHÔNG gửi cảnh báo low_queue',
    seed: TAT_TU_MOI + hangDoi(7),
    goi: 1,
    assert: `select (select count(*) from notifications where type = 'low_queue') = 0 as pass,
                    'số notification=' || (select count(*) from notifications) as chi_tiet`,
  },
```
`npm run test:db` ⇒ T10, T11 ĐỎ; T1–T9 xanh (đang bật).
`scripts/check-schema.mjs` `KEY_SETTINGS` thêm `'new_words_enabled'` ⇒ `check:schema` ĐỎ (thiếu key).

### T4 · GREEN — DB
`supabase/migrations/0019_bat_tu_moi.sql`:
```sql
-- 0019_bat_tu_moi.sql — M32: công tắc "Thêm từ mới hằng ngày" (design.m32.md).
-- Chỉ khi true, run_daily_maintenance() mới nhỏ giọt từ mới (B4) và gửi cảnh báo hàng đợi cạn (B5).
-- Mặc định true = giữ hành vi cũ (M32/Q2). on conflict do nothing: chạy lại không ghi đè lựa chọn người dùng.
insert into settings (key, value) values ('new_words_enabled', 'true')
on conflict (key) do nothing;
```
`0005_maintenance.sql` (tại chỗ): thêm biến
`bat_tu_moi boolean := coalesce((select (value #>> '{}')::boolean from settings where key = 'new_words_enabled'), true);`
B4: `if bat_tu_moi and da_kich_hoat < so_tu_moi then` · B5: `if bat_tu_moi and bat_canh_bao and con_lai < …`
+ comment M32. `db:migrate` ×2 → `test:db` 11/11 · `check:schema` xanh.

### T5 · UI — `src/features/settings/CaiDatPage.tsx` (nhóm "Học tập", trước stepper)
```tsx
            <div className={HANG}>
              <span className={NHAN}>Thêm từ mới hằng ngày</span>
              <CongTac bat={cd.new_words_enabled} nhan="Thêm từ mới hằng ngày" onDoi={(v) => void ghi('new_words_enabled', v)} />
            </div>
            <p className="-mt-2 text-12 text-content-muted">
              {cd.new_words_enabled
                ? `Mỗi ngày lúc 01:00 thêm ${cd.new_words_per_day} từ từ hàng đợi. Thay đổi có hiệu lực từ 01:00 sáng mai.`
                : 'Đang tạm dừng — không thêm từ mới, từ đã học vẫn ôn bình thường.'}
            </p>
```
Hàng stepper "Số từ mới/ngày": `className={`${HANG} ${cd.new_words_enabled ? '' : 'opacity-50'}`}`. Build + lint.

### T6 · Tài liệu
SPECIFICATION §5 (B4/B5 + đoạn M32) · §11 thêm dòng `new_words_enabled` · UI_DESIGN §8.6 thêm công tắc.

### T7 · Kiểm chứng
`npm test` · build · lint · `db:migrate` ×2 · `check:schema` · `test:db` 11/11 · CDP local (PC + Mobile): bật/tắt công tắc ⇒ DB đổi đúng `true/false`
(jsonb boolean, KHÔNG phải chuỗi) ⇒ tải lại vẫn giữ ⇒ dòng ghi chú + stepper mờ đúng ⇒ **trả về giá trị ban đầu** khi xong.

### T8 · memory-bank + nhắc người dùng tự commit/push + `npm run deploy:firebase`.
