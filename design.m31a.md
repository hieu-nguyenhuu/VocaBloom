# Plan M31a — Đọc hiểu chủ đề: DB · logic thuần · CLI · 2 màn mới · gỡ chế độ topic cũ · 1 chủ đề thử

> Thiết kế: [`design.m31.md`](design.m31.md) (✅ duyệt 2026-10-18). Plan này = phần **M31a** + **chủ đề thử** (cổng duyệt văn phong của M31b).
> Luật chung: diff patch cục bộ · logic không tầm thường ⇒ RED → GREEN → REFACTOR · KHÔNG `git add/commit`.

## Pha A — Database (TDD bằng script DB)

### T1 · RED — `check:schema` biết 2 bảng mới (2')
`scripts/check-schema.mjs`:
```js
  'nhat_ky_ngay',    // M14 — bảng thứ 12 (nhật ký học theo ngày, KHÔNG có FK tới vocab)
  'topic_readings',  // M31 — bảng thứ 13 (đề đọc hiểu của chủ đề)
  'doc_hieu_log',    // M31 — bảng thứ 14 (lịch sử làm đọc hiểu)
]
```
```js
  'idx_review_log_reviewed_at', 'idx_topic_dialogue_topic', 'idx_topic_grammar_topic',
  'idx_topic_readings_topic', 'idx_doc_hieu_log_luot', 'idx_doc_hieu_log_created',
]
```
Chạy `npm run check:schema` ⇒ **phải ĐỎ** (thiếu 2 bảng / 3 index / 2 policy).

### T2 · GREEN — migration `supabase/migrations/0018_doc_hieu.sql` (4')
```sql
-- 0018_doc_hieu.sql — ĐỌC HIỂU CHỦ ĐỀ (M31, design.m31.md §3).
-- Bảng thứ 13 `topic_readings` (đề) + thứ 14 `doc_hieu_log` (kết quả). KHÔNG tính điểm SRS:
-- không đụng word_state/review_log. Idempotent (MB-11). Mọi nơi đếm bảng: liệt kê TƯỜNG MINH.

create table if not exists topic_readings (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references topics(id) on delete cascade,
  thu_tu     int  not null default 0,
  kieu       text not null check (kieu in ('hoi_thoai', 'doan_van')),
  content    jsonb not null,            -- { lines[], highlight_vocab_ids[], questions[] }
  created_at timestamptz not null default now()
);
create index if not exists idx_topic_readings_topic on topic_readings (topic_id, thu_tu);

create table if not exists doc_hieu_log (
  id           uuid primary key default gen_random_uuid(),
  luot_id      uuid not null,           -- 1 lần vào màn Đọc hiểu = 1 lượt (client sinh)
  topic_id     uuid not null references topics(id) on delete cascade,
  reading_id   uuid not null references topic_readings(id) on delete cascade,
  so_cau       int  not null check (so_cau > 0),
  so_dung      int  not null,
  thoi_gian_ms int  check (thoi_gian_ms >= 0),
  created_at   timestamptz not null default now(),
  check (so_dung between 0 and so_cau)
);
create index if not exists idx_doc_hieu_log_luot    on doc_hieu_log (luot_id);
create index if not exists idx_doc_hieu_log_created on doc_hieu_log (created_at);

-- RLS lọc DÒNG, GRANT mở CỬA (MB-13/2) — đúng khuôn 0013.
alter table topic_readings enable row level security;
drop policy if exists "authenticated_full_access" on topic_readings;
create policy "authenticated_full_access" on topic_readings
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on table topic_readings to authenticated;

alter table doc_hieu_log enable row level security;
drop policy if exists "authenticated_full_access" on doc_hieu_log;
create policy "authenticated_full_access" on doc_hieu_log
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on table doc_hieu_log to authenticated;
```
`npm run db:migrate` **2 lần** (idempotent) → `npm run check:schema` **XANH**.

### T3 · RED — `test:nhatky` thêm 2 ca đọc hiểu (3')
`scripts/test-nhat-ky.mjs`, thêm hằng dựng + 2 ca vào cuối `CAC_CA`:
```js
/** M31 — 1 đề đọc hiểu + 1 dòng doc_hieu_log hôm nay (không cần vocab/review_log). */
const DUNG_DOC_HIEU = (ms) => `
  insert into topics (id, name) values ('00000000-0000-0000-0000-00000000aaa2'::uuid, 'ZZ doc') ;
  insert into topic_readings (id, topic_id, kieu, content)
    values ('00000000-0000-0000-0000-00000000ccc1'::uuid, '00000000-0000-0000-0000-00000000aaa2'::uuid, 'doan_van', '{}');
  insert into doc_hieu_log (luot_id, topic_id, reading_id, so_cau, so_dung, thoi_gian_ms)
    values (gen_random_uuid(), '00000000-0000-0000-0000-00000000aaa2'::uuid,
            '00000000-0000-0000-0000-00000000ccc1'::uuid, 3, 2, ${ms});`
```
```js
  {
    ma: 'N6',
    ten: 'M31 — ngày CHỈ đọc hiểu (0 review_log) vẫn ghi nhật ký với đúng số ms',
    sql: `${DUNG_DOC_HIEU(240000)}
          select chot_nhat_ky_ngay();`,
    assert: `select (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN}) = 240000 as pass,
              format('%s ms (phải 240000)', (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN})) as chi_tiet`,
  },
  {
    ma: 'N7',
    ten: 'M31 — ôn từ + đọc hiểu cùng ngày ⇒ CỘNG cả 2 nguồn',
    sql: `${DUNG_DU_LIEU(120000)}
          ${DUNG_DOC_HIEU(60000)}
          select chot_nhat_ky_ngay();`,
    assert: `select (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN}) = 180000 as pass,
              format('%s ms (phải 180000)', (select thoi_gian_ms from nhat_ky_ngay where ngay = ${NGAY_VN})) as chi_tiet`,
  },
```
(`DON_SACH` đã `truncate vocab, topics cascade` ⇒ cuốn luôn 2 bảng mới, vẫn rollback.) Chạy `npm run test:nhatky` ⇒ **N6, N7 ĐỎ**, N1–N5 xanh.

### T4 · GREEN — sửa `chot_nhat_ky_ngay()` TẠI CHỖ ở `0014_nhat_ky_ngay.sql` (2')
Thay khối `select … into v_ms`:
```sql
  -- M31: cộng cả thời gian ĐỌC HIỂU (doc_hieu_log) — ngày chỉ đọc hiểu vẫn là ngày có học.
  select coalesce((select sum(thoi_gian_ms) from review_log
                    where (reviewed_at at time zone 'Asia/Ho_Chi_Minh')::date = v_ngay), 0)
       + coalesce((select sum(thoi_gian_ms) from doc_hieu_log
                    where (created_at at time zone 'Asia/Ho_Chi_Minh')::date = v_ngay), 0)
    into v_ms;
```
(plpgsql phân giải bảng lúc CHẠY ⇒ 0014 tham chiếu bảng tạo ở 0018 vẫn hợp lệ.) `db:migrate` → `test:nhatky` **7/7** · `test:db` 9/9 (không vỡ cron).

## Pha B — Logic thuần `src/lib/docHieu.ts` (TDD, Vitest)

### T5 · RED — `src/lib/docHieu.test.ts` (5')
```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  chamDoan, docBaiDoc, dongGhiBaiDoc, kiemTraBaiDoc, lanGanNhat, thoiGianDoan, tongHopKetQua, xaoLuot,
  TRAN_DOC_MS, type BaiDoc,
} from './docHieu.ts'

const Q = (dap_an = 0) => ({
  hoi: '他去哪儿？', hoi_pinyin: 'Tā qù nǎr?', lua_chon: ['公司', '学校', '医院', '商店'],
  lua_chon_pinyin: ['gōngsī', 'xuéxiào', 'yīyuàn', 'shāngdiàn'], dap_an, giai_thich_vi: 'Câu 1: 去公司.',
})
const DONG = (id: string, kieu = 'doan_van', content: unknown = {
  lines: [{ text: '他今天去公司。', pinyin: 'Tā jīntiān qù gōngsī.', vi: 'Hôm nay anh ấy đến công ty.' }],
  highlight_vocab_ids: ['v1', 'v-da-xoa'], questions: [Q(0), Q(1)],
}) => ({ id, kieu, thu_tu: 1, content })

describe('docBaiDoc', () => {
  it('DH1 — đọc đúng 1 đoạn, tu_dam bỏ id đã xoá', () => {
    const [b] = docBaiDoc([DONG('r1')], { v1: '公司' })
    expect(b?.lines[0]?.text).toBe('他今天去公司。')
    expect(b?.tu_dam).toEqual(['公司'])
    expect(b?.questions).toHaveLength(2)
  })
  it('DH2 — câu hỏi hỏng (3 lựa chọn / trùng / dap_an ngoài 0–3) bị bỏ; đoạn hết câu thì bỏ cả đoạn', () => {
    const hong = { ...Q(), lua_chon: ['a', 'a', 'b', 'c'] }
    const ds = docBaiDoc([
      DONG('r1', 'doan_van', { lines: [{ text: 'x' }], questions: [hong, { ...Q(), dap_an: 4 }] }),
      DONG('r2', 'doan_van', { lines: [{ text: 'y' }], questions: [Q(), { ...Q(), lua_chon: ['1', '2', '3'] }] }),
    ], {})
    expect(ds.map((b) => b.id)).toEqual(['r2'])
    expect(ds[0]?.questions).toHaveLength(1)
  })
  it('DH3 — kieu lạ / content null / không phải mảng ⇒ không vỡ', () => {
    expect(docBaiDoc([DONG('r1', 'tho'), { id: 'r2', kieu: 'doan_van', content: null }], {})).toEqual([])
    expect(docBaiDoc(null, {})).toEqual([])
  })
})

describe('xaoLuot', () => {
  const ds = docBaiDoc([DONG('r1'), DONG('r2'), DONG('r3')], {})
  it('DH4 — sau xáo, dap_an vẫn trỏ ĐÚNG chữ cũ, pinyin đi kèm lựa chọn', () => {
    const kq = xaoLuot(ds, () => 0.1)
    for (const b of kq) for (const q of b.questions) {
      expect(q.lua_chon[q.dap_an]).toBe(q === b.questions[0] ? '公司' : '学校')
      expect(q.lua_chon_pinyin[q.lua_chon.indexOf('公司')]).toBe('gōngsī')
    }
  })
  it('DH5 — đủ đoạn, không mất/nhân đôi; rng cố định ⇒ tất định', () => {
    expect(xaoLuot(ds, () => 0.7).map((b) => b.id).sort()).toEqual(['r1', 'r2', 'r3'])
    expect(xaoLuot(ds, () => 0.3)).toEqual(xaoLuot(ds, () => 0.3))
  })
})

describe('chamDoan', () => {
  const qs = [Q(0), Q(2)]
  it('DH6 — chưa chọn đủ ⇒ null (nút Kiểm tra phải tắt)', () => {
    expect(chamDoan(qs, [0, null])).toBeNull()
    expect(chamDoan(qs, [0])).toBeNull()
  })
  it('DH7 — chấm đúng từng câu', () => {
    expect(chamDoan(qs, [0, 1])).toEqual({ so_dung: 1, dung: [true, false] })
  })
})

describe('thoiGianDoan · tongHopKetQua · lanGanNhat', () => {
  it('DH8 — kẹp trần 10 phút, không âm', () => {
    expect(thoiGianDoan(0, 30_000)).toBe(30_000)
    expect(thoiGianDoan(0, TRAN_DOC_MS * 3)).toBe(TRAN_DOC_MS)
    expect(thoiGianDoan(5000, 1000)).toBe(0)
  })
  it('DH9 — tổng hợp lượt: cộng câu/đúng, phút làm tròn LÊN, giữ thứ tự đoạn', () => {
    const kq = tongHopKetQua([
      { so_cau: 3, so_dung: 3, thoi_gian_ms: 50_000, kieu: 'hoi_thoai' },
      { so_cau: 2, so_dung: 1, thoi_gian_ms: null, kieu: 'doan_van' },
    ])
    expect(kq).toEqual({ so_cau: 5, so_dung: 4, phut: 1, doan: [
      { kieu: 'hoi_thoai', so_cau: 3, so_dung: 3 }, { kieu: 'doan_van', so_cau: 2, so_dung: 1 },
    ] })
    expect(tongHopKetQua([]).so_cau).toBe(0)
  })
  it('DH10 — lần gần nhất của mỗi chủ đề = lượt MỚI NHẤT, cộng mọi đoạn của lượt đó', () => {
    const kq = lanGanNhat([
      { topic_id: 't1', luot_id: 'cu', so_cau: 3, so_dung: 0, created_at: '2026-10-17T01:00:00Z' },
      { topic_id: 't1', luot_id: 'moi', so_cau: 3, so_dung: 2, created_at: '2026-10-18T01:00:00Z' },
      { topic_id: 't1', luot_id: 'moi', so_cau: 2, so_dung: 2, created_at: '2026-10-18T01:02:00Z' },
    ])
    expect(kq['t1']).toEqual({ so_cau: 5, so_dung: 4 })
    expect(kq['t2']).toBeUndefined()
  })
})

describe('kiemTraBaiDoc (cổng chung CLI + Import M31c)', () => {
  const doan = (over: Record<string, unknown> = {}) => ({
    kieu: 'doan_van', highlight_words: ['公司'],
    lines: [{ text: '他今天去公司。', pinyin: 'Tā jīntiān qù gōngsī.', vi: 'Anh ấy đến công ty.' }],
    questions: [Q(0), Q(1)], ...over,
  })
  const TU = ['公司', '学校']
  it('DH11 — 3 đoạn hợp lệ ⇒ 0 lỗi; báo từ chưa phủ', () => {
    const kq = kiemTraBaiDoc([doan(), doan(), doan()], TU, 'zh')
    expect(kq.loi).toEqual([])
    expect(kq.thieu_phu).toEqual(['学校'])
  })
  it('DH12 — < 3 đoạn · 1 câu hoặc 4 câu/đoạn ⇒ lỗi', () => {
    expect(kiemTraBaiDoc([doan(), doan()], TU, 'zh').loi.length).toBeGreaterThan(0)
    const kq = kiemTraBaiDoc([doan({ questions: [Q()] }), doan(), doan({ questions: [Q(), Q(), Q(), Q()] })], TU, 'zh')
    expect(kq.loi.map((l) => l.duong_dan)).toEqual(['readings[0].questions', 'readings[2].questions'])
  })
  it('DH13 — highlight không thuộc chủ đề / không có trong đoạn ⇒ lỗi', () => {
    const kq = kiemTraBaiDoc([doan({ highlight_words: ['医院'] }), doan({ highlight_words: ['学校'] }), doan()], TU, 'zh')
    expect(kq.loi.map((l) => l.duong_dan)).toEqual(['readings[0].highlight_words', 'readings[1].highlight_words'])
  })
  it('DH14 — zh thiếu pinyin · hội thoại thiếu speaker A/B · thiếu giải thích ⇒ lỗi; en không cần pinyin', () => {
    const thieuPy = doan({ lines: [{ text: '他今天去公司。', vi: 'x' }] })
    const hoiThoai = doan({ kieu: 'hoi_thoai' })
    const khongGt = doan({ questions: [Q(), { ...Q(), giai_thich_vi: '' }] })
    expect(kiemTraBaiDoc([thieuPy, hoiThoai, khongGt], TU, 'zh').loi).toHaveLength(3)
    const en = { kieu: 'doan_van', highlight_words: ['office'], lines: [{ text: 'He goes to the office.', vi: 'x' }],
      questions: [{ ...Q(), hoi_pinyin: '', lua_chon_pinyin: [] }, Q(1)] }
    expect(kiemTraBaiDoc([en, en, en], ['office'], 'en').loi).toEqual([])
  })
})

describe('dongGhiBaiDoc', () => {
  it('DH15 — đổi highlight_words → highlight_vocab_ids, thu_tu từ 1', () => {
    const [d] = dongGhiBaiDoc([{ kieu: 'doan_van', highlight_words: ['公司'], lines: [{ text: 'a', vi: 'b' }], questions: [Q()] }], 't1', { 公司: 'v1' })
    expect(d).toMatchObject({ topic_id: 't1', thu_tu: 1, kieu: 'doan_van', content: { highlight_vocab_ids: ['v1'] } })
    expect(JSON.stringify(d)).not.toContain('highlight_words')
  })
  it('DH16 — docHieu.ts thuần: không import react / supabase / node:', () => {
    expect(readFileSync('src/lib/docHieu.ts', 'utf8')).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})

// Kiểu dùng ở màn — giữ để TS bắt lệch khi đổi BaiDoc
export type _BaiDoc = BaiDoc
```
`npm test -- docHieu` ⇒ **ĐỎ** (module chưa có).

### T6 · GREEN — `src/lib/docHieu.ts` phần đọc/xáo/chấm (5')
```ts
/**
 * Logic thuần cho ĐỌC HIỂU CHỦ ĐỀ (M31, design.m31.md). Không React, không Supabase, không node:.
 * Đề sinh NGOÀI app (nguyên tắc bất biến số 1) ⇒ ở đây chỉ đọc, xáo, chấm, tổng hợp và validate.
 * KHÔNG tính điểm SRS: không đụng srs.ts / word_state.
 */
import { xaoTron } from './player.ts'

export type KieuDoan = 'hoi_thoai' | 'doan_van'
export type DongDoc = { speaker: string; text: string; pinyin: string; vi: string }
export type CauHoiDoc = {
  hoi: string
  hoi_pinyin: string
  lua_chon: string[]
  lua_chon_pinyin: string[]
  /** Chỉ số trong `lua_chon` (sau `xaoLuot` đã được ánh xạ lại). */
  dap_an: number
  giai_thich_vi: string
}
export type BaiDoc = { id: string; kieu: KieuDoan; lines: DongDoc[]; tu_dam: string[]; questions: CauHoiDoc[] }

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '')
const laKieu = (v: unknown): v is KieuDoan => v === 'hoi_thoai' || v === 'doan_van'
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const obj = (v: unknown): Record<string, unknown> => (v ?? {}) as Record<string, unknown>

/** 4 lựa chọn khác nhau, không rỗng, đáp án 0–3 — câu hỏng thì bỏ (không vỡ cả màn). */
function docCauHoi(q: unknown): CauHoiDoc | null {
  const d = obj(q)
  const lc = mang(d['lua_chon']).map((s) => chuoi(s).trim())
  const da = d['dap_an']
  if (chuoi(d['hoi']).trim() === '' || lc.length !== 4 || lc.includes('') || new Set(lc).size !== 4) return null
  if (typeof da !== 'number' || !Number.isInteger(da) || da < 0 || da > 3) return null
  const lp = mang(d['lua_chon_pinyin']).map(chuoi)
  return {
    hoi: chuoi(d['hoi']).trim(),
    hoi_pinyin: chuoi(d['hoi_pinyin']),
    lua_chon: lc,
    lua_chon_pinyin: lp.length === 4 ? lp : ['', '', '', ''],
    dap_an: da,
    giai_thich_vi: chuoi(d['giai_thich_vi']),
  }
}

/** Đọc `topic_readings` từ DB. Đoạn hỏng (0 dòng / 0 câu hợp lệ / kieu lạ) bị bỏ, các đoạn khác vẫn chạy. */
export function docBaiDoc(rows: unknown, tenTu: Record<string, string>): BaiDoc[] {
  const ra: BaiDoc[] = []
  for (const r of mang(rows)) {
    const d = obj(r)
    const id = d['id']
    const kieu = d['kieu']
    const c = obj(d['content'])
    if (typeof id !== 'string' || !laKieu(kieu)) continue
    const lines = mang(c['lines'])
      .map((l) => {
        const x = obj(l)
        return { speaker: chuoi(x['speaker']), text: chuoi(x['text']).trim(), pinyin: chuoi(x['pinyin']), vi: chuoi(x['vi']) }
      })
      .filter((l) => l.text !== '')
    const questions = mang(c['questions']).map(docCauHoi).filter((q): q is CauHoiDoc => q !== null)
    if (lines.length === 0 || questions.length === 0) continue
    // Từ có thể đã bị xoá khỏi `vocab` ⇒ lọc id không tra được (giống docHoiThoai)
    const tu_dam = mang(c['highlight_vocab_ids']).map((x) => tenTu[String(x)]).filter((w): w is string => Boolean(w))
    ra.push({ id, kieu, lines, tu_dam, questions })
  }
  return ra
}

/** Xáo thứ tự ĐOẠN + thứ tự 4 lựa chọn của từng câu; `dap_an` ánh xạ lại theo vị trí mới. */
export function xaoLuot(ds: readonly BaiDoc[], rng: () => number): BaiDoc[] {
  return xaoTron(ds, rng).map((b) => ({
    ...b,
    questions: b.questions.map((q) => {
      const thuTu = xaoTron([0, 1, 2, 3], rng)
      return {
        ...q,
        lua_chon: thuTu.map((k) => q.lua_chon[k] ?? ''),
        lua_chon_pinyin: thuTu.map((k) => q.lua_chon_pinyin[k] ?? ''),
        dap_an: thuTu.indexOf(q.dap_an),
      }
    }),
  }))
}

/** null = chưa chọn đủ mọi câu ⇒ chưa được Kiểm tra. */
export function chamDoan(
  qs: readonly CauHoiDoc[],
  daChon: readonly (number | null)[],
): { so_dung: number; dung: boolean[] } | null {
  if (daChon.length !== qs.length || daChon.some((x) => x === null)) return null
  const dung = qs.map((q, k) => daChon[k] === q.dap_an)
  return { so_dung: dung.filter(Boolean).length, dung }
}

/** Đọc 1 đoạn có thể lâu hơn 1 bài Player (trần 5') ⇒ trần riêng 10 phút. */
export const TRAN_DOC_MS = 10 * 60_000
export function thoiGianDoan(moc: number, now: number): number {
  return Math.max(0, Math.min(now - moc, TRAN_DOC_MS))
}
```

### T7 · GREEN — phần tổng hợp (3')
Nối vào `docHieu.ts`:
```ts
export type DongLogDoc = { so_cau: number; so_dung: number; thoi_gian_ms: number | null; kieu: KieuDoan | null }

/** Màn Kết quả: số liệu lấy từ `doc_hieu_log` của lượt (KHÔNG từ state client — cùng tinh thần §4.6). */
export function tongHopKetQua(rows: readonly DongLogDoc[]) {
  const ms = rows.reduce((s, r) => s + (r.thoi_gian_ms ?? 0), 0)
  return {
    so_cau: rows.reduce((s, r) => s + r.so_cau, 0),
    so_dung: rows.reduce((s, r) => s + r.so_dung, 0),
    phut: Math.ceil(ms / 60_000),
    doan: rows.map((r) => ({ kieu: r.kieu, so_cau: r.so_cau, so_dung: r.so_dung })),
  }
}

/** Màn Chọn chủ đề: "Lần gần nhất X/Y" = cộng mọi đoạn của lượt MỚI NHẤT mỗi chủ đề. */
export function lanGanNhat(
  rows: readonly { topic_id: string; luot_id: string; so_cau: number; so_dung: number; created_at: string }[],
): Record<string, { so_cau: number; so_dung: number }> {
  const moiNhat = new Map<string, { luot: string; luc: string }>()
  for (const r of rows) {
    const cu = moiNhat.get(r.topic_id)
    if (!cu || r.created_at > cu.luc) moiNhat.set(r.topic_id, { luot: r.luot_id, luc: r.created_at })
  }
  const ra: Record<string, { so_cau: number; so_dung: number }> = {}
  for (const r of rows) {
    if (moiNhat.get(r.topic_id)?.luot !== r.luot_id) continue
    const t = (ra[r.topic_id] ??= { so_cau: 0, so_dung: 0 })
    t.so_cau += r.so_cau
    t.so_dung += r.so_dung
  }
  return ra
}
```

### T8 · GREEN — validator + dựng dòng ghi (5')
Nối vào `docHieu.ts`:
```ts
export type LoiDoc = { duong_dan: string; thong_diep: string }

/**
 * Cổng validate đề đọc hiểu — DÙNG CHUNG CLI `bo-sung-doc-hieu` và Import (M31c). Chuẩn: design.m31.md §6.
 * `thieu_phu` = từ của chủ đề chưa xuất hiện trong đoạn nào (cảnh báo; M31b đòi bằng 0).
 */
export function kiemTraBaiDoc(readings: unknown, tuChuDe: readonly string[], lang: 'zh' | 'en'): { loi: LoiDoc[]; thieu_phu: string[] } {
  const loi: LoiDoc[] = []
  const bao = (duong_dan: string, thong_diep: string) => loi.push({ duong_dan, thong_diep })
  const ds = mang(readings)
  if (ds.length < 3) bao('readings', `cần ≥ 3 đoạn, đang có ${ds.length}`)
  const zh = lang === 'zh'
  const thuong = (s: string) => (zh ? s : s.toLowerCase())
  const toanVan: string[] = []

  ds.forEach((r, i) => {
    const p = `readings[${i}]`
    const d = obj(r)
    if (!laKieu(d['kieu'])) bao(`${p}.kieu`, 'phải là "hoi_thoai" hoặc "doan_van"')
    const lines = mang(d['lines']).map(obj)
    if (lines.length === 0) bao(`${p}.lines`, 'đoạn rỗng')
    lines.forEach((l, k) => {
      if (chuoi(l['text']).trim() === '') bao(`${p}.lines[${k}].text`, 'thiếu câu')
      if (chuoi(l['vi']).trim() === '') bao(`${p}.lines[${k}].vi`, 'thiếu nghĩa tiếng Việt')
      if (zh && chuoi(l['pinyin']).trim() === '') bao(`${p}.lines[${k}].pinyin`, 'thiếu pinyin')
      if (d['kieu'] === 'hoi_thoai' && l['speaker'] !== 'A' && l['speaker'] !== 'B') bao(`${p}.lines[${k}].speaker`, 'hội thoại cần speaker "A"/"B"')
    })
    const van = thuong(lines.map((l) => chuoi(l['text'])).join(' '))
    toanVan.push(van)

    const qs = mang(d['questions'])
    if (qs.length < 2 || qs.length > 3) bao(`${p}.questions`, `cần 2–3 câu hỏi, đang có ${qs.length}`)
    qs.forEach((q, k) => {
      const c = obj(q)
      const qp = `${p}.questions[${k}]`
      if (docCauHoi(q) === null) bao(qp, 'câu hỏi rỗng / không đủ 4 lựa chọn khác nhau / dap_an ngoài 0–3')
      if (chuoi(c['giai_thich_vi']).trim() === '') bao(`${qp}.giai_thich_vi`, 'thiếu giải thích')
      if (zh && (chuoi(c['hoi_pinyin']).trim() === '' || mang(c['lua_chon_pinyin']).filter((x) => chuoi(x).trim() !== '').length !== 4))
        bao(`${qp}.pinyin`, 'thiếu pinyin câu hỏi / lựa chọn')
    })

    const hl = mang(d['highlight_words']).map(chuoi)
    const ngoai = hl.filter((w) => !tuChuDe.includes(w))
    const vang = hl.filter((w) => tuChuDe.includes(w) && !van.includes(thuong(w)))
    if (ngoai.length > 0) bao(`${p}.highlight_words`, `không thuộc chủ đề: ${ngoai.join(', ')}`)
    else if (vang.length > 0) bao(`${p}.highlight_words`, `không có trong đoạn: ${vang.join(', ')}`)
  })

  const thieu_phu = tuChuDe.filter((w) => !toanVan.some((v) => v.includes(thuong(w))))
  return { loi, thieu_phu }
}

/** Đề đã validate → dòng INSERT `topic_readings` (đổi highlight_words → highlight_vocab_ids, như bẫy hội thoại §10.2). */
export function dongGhiBaiDoc(readings: readonly unknown[], topicId: string, idTheoChu: Record<string, string>) {
  return readings.map((r, i) => {
    const d = obj(r)
    return {
      topic_id: topicId,
      thu_tu: i + 1,
      kieu: d['kieu'],
      content: {
        lines: d['lines'],
        highlight_vocab_ids: mang(d['highlight_words']).map((w) => idTheoChu[chuoi(w)]).filter(Boolean),
        questions: d['questions'],
      },
    }
  })
}
```
`npm test -- docHieu` **16/16** → REFACTOR nếu cần → `npm test` toàn bộ xanh.

## Pha C — CLI nạp đề vào chủ đề đã có

### T9 · `scripts/bo-sung-doc-hieu.mjs` + script npm (5')
`package.json` thêm sau `bo-sung:song-ngu`: `"bo-sung:doc-hieu": "node scripts/bo-sung-doc-hieu.mjs",`
```js
/**
 * bo-sung-doc-hieu.mjs — M31: nạp đề ĐỌC HIỂU vào chủ đề ĐÃ CÓ trong DB.
 *
 * Chạy:  npm run bo-sung:doc-hieu -- <file.json ...> [--dry-run]
 * File: { "topic_name": "...", "readings": [ { kieu, lines[], highlight_words[], questions[] } ] }
 *
 * Đăng nhập + PostgREST (luật §9.6). CHỈ GET + POST `topic_readings` — không PATCH/DELETE.
 * Pha 1 kiểm TẤT CẢ file; lỗi ở bất kỳ file nào ⇒ không ghi gì. Chủ đề ĐÃ có đề ⇒ chặn (không nhân đôi).
 */
import { readFileSync } from 'node:fs'
import { SUPABASE_URL, ANON_KEY, dangNhap } from './db-lib.mjs'
import { dongGhiBaiDoc, kiemTraBaiDoc } from '../src/lib/docHieu.ts'

const args = process.argv.slice(2)
const chayThu = args.includes('--dry-run')
const dsFile = args.filter((a) => !a.startsWith('--'))
if (dsFile.length === 0) {
  console.error('❌  Thiếu file.\n    npm run bo-sung:doc-hieu -- <file.json ...> [--dry-run]')
  process.exit(1)
}
const token = await dangNhap()
if (!token) {
  console.error('❌  Đăng nhập thất bại. Kiểm tra EMAIL/PASSWORD trong .env.local (npm run check:auth).')
  process.exit(1)
}
const dau = { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
async function doc(duong) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${duong}`, { headers: dau })
  if (!res.ok) throw new Error(`GET ${duong.split('?')[0]} → HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

// ── Pha 1: kiểm tất cả, chưa ghi gì ──
const ke = []
let coLoi = false
for (const duongDan of dsFile) {
  try {
    const nd = JSON.parse(readFileSync(duongDan, 'utf8'))
    const ten = nd?.topic_name ?? ''
    const topics = await doc(`topics?select=id&name=eq.${encodeURIComponent(ten)}`)
    if (topics.length !== 1) throw new Error(`chủ đề "${ten}": tìm thấy ${topics.length} (cần đúng 1)`)
    const topicId = topics[0].id
    const tu = (await doc(`vocab_topics?select=vocab(id,word,lang)&topic_id=eq.${topicId}`)).map((r) => r.vocab)
    const daCo = await doc(`topic_readings?select=id&topic_id=eq.${topicId}`)
    if (daCo.length > 0) throw new Error(`chủ đề "${ten}" ĐÃ có ${daCo.length} đoạn — không nạp chồng`)
    const kq = kiemTraBaiDoc(nd.readings, tu.map((t) => t.word), tu[0]?.lang ?? 'zh')
    if (kq.loi.length > 0) {
      console.error(`❌  ${ten} — ${kq.loi.length} lỗi:`)
      for (const l of kq.loi) console.error(`    · ${l.duong_dan}: ${l.thong_diep}`)
      coLoi = true
      continue
    }
    const soCau = nd.readings.reduce((s, r) => s + r.questions.length, 0)
    console.log(`${kq.thieu_phu.length === 0 ? '✅' : '⚠️ '} ${ten}: ${nd.readings.length} đoạn · ${soCau} câu · phủ ${tu.length - kq.thieu_phu.length}/${tu.length} từ` +
      (kq.thieu_phu.length > 0 ? ` · CHƯA PHỦ: ${kq.thieu_phu.join(', ')}` : ''))
    ke.push({ ten, dong: dongGhiBaiDoc(nd.readings, topicId, Object.fromEntries(tu.map((t) => [t.word, t.id]))) })
  } catch (e) {
    console.error(`❌  ${duongDan}: ${e.message}`)
    coLoi = true
  }
}
if (coLoi) {
  console.error('\n❌  Có lỗi — KHÔNG ghi file nào.\n')
  process.exit(1)
}
if (chayThu) {
  console.log('\n✅ Chạy thử xong — KHÔNG ghi gì vào DB.\n')
  process.exit(0)
}

// ── Pha 2: mỗi chủ đề 1 POST (PostgREST bọc 1 transaction) ──
for (const { ten, dong } of ke) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/topic_readings`, {
    method: 'POST', headers: { ...dau, Prefer: 'return=minimal' }, body: JSON.stringify(dong),
  })
  if (!res.ok) {
    console.error(`❌  ${ten}: ghi thất bại HTTP ${res.status} — ${await res.text()}`)
    process.exit(1)
  }
  console.log(`✅ ĐÃ GHI ${ten}: +${dong.length} đoạn`)
}
```
Kiểm: `npm test -- anToanScript` xanh (script không có DELETE rộng).

## Pha D — Màn Đọc hiểu + Kết quả

### T10 · `noiTiepTheo` đổi đích (RED → GREEN, 3')
`src/lib/nguPhap.test.ts` — thay khối `describe('noiTiepTheo')`:
```ts
describe('noiTiepTheo', () => {
  it('N6 — xem xong ngữ pháp chủ đề → vào ĐỌC HIỂU (M31), không còn Player chế độ topic', () => {
    expect(noiTiepTheo('abc')).toBe('/on-tap/doc-hieu?topic=abc')
  })
  it('N8 — không bao giờ trỏ về chính màn ngữ pháp (chống lặp vô hạn)', () => {
    expect(noiTiepTheo('x')).not.toContain('/on-tap/ngu-phap')
  })
})
```
Chạy ⇒ ĐỎ. `src/lib/nguPhap.ts`:
```ts
/**
 * Đích đến sau khi xem xong ngữ pháp chủ đề. M31: ôn theo chủ đề = ĐỌC HIỂU (design.m31.md §2);
 * giai đoạn "cuối" (→ hội thoại kết thúc) đã bỏ cùng chế độ topic của Player.
 */
export function noiTiepTheo(topicId: string): string {
  return `/on-tap/doc-hieu?topic=${topicId}`
}
```
`NguPhapTopicPage.tsx`: xoá `giaiDoan` (dòng 26) và mọi chỗ dùng; `noiTiepTheo(topicId)` ×2; deps `[ds, topicId, navigate]`; nhãn nút
`nhanNut={cuoiCung ? 'Bắt đầu đọc' : 'Tiếp theo'}`; comment route đổi thành `/on-tap/ngu-phap?topic=X`.
`ChonChuDePage.tsx` dòng 90: `navigate(\`/on-tap/ngu-phap?topic=${c.id}\`)`.

### T11 · `src/features/player/DocHieuPage.tsx` — tải + trạng thái (5')
```tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import { BangLoi, KhungLoi, KhungRong } from '../../components/TrangThai.tsx'
import { phatAmThanh } from '../../lib/amThanh.ts'
import { chamDoan, docBaiDoc, thoiGianDoan, xaoLuot, type BaiDoc, type CauHoiDoc } from '../../lib/docHieu.ts'
import { chiaDam } from '../../lib/hoiThoai.ts'
import { supabase } from '../../lib/supabase.ts'
import { phatAm } from '../../lib/tts.ts'
import { useDungPhim } from './dungPhim.ts'

/**
 * ĐỌC HIỂU CHỦ ĐỀ (M31, design.m31.md §5.1 — KHÔNG có mockup, bố cục đã duyệt). Route riêng
 * `/on-tap/doc-hieu?topic=X`, KHÔNG nhét vào Player (bài học MB-26): lượt kết thúc khi hết danh sách đoạn.
 * Không tính điểm SRS. Mỗi đoạn Kiểm tra xong ghi NGAY 1 dòng `doc_hieu_log` (thoát giữa chừng vẫn còn).
 * Sau Kiểm tra ĐƯỢC lộ đáp án đúng (chấm 1 lần, khác luật "chọn lại đến khi đúng" M25 — có chủ ý).
 */
const O = 'flex w-full items-start gap-3 rounded-14 border px-4 py-3 text-left transition-colors'
const O_TRUNG_TINH = `${O} border-border-input bg-surface-raised text-content-primary`
const O_DANG_CHON = `${O} border-[1.5px] border-accent bg-accent-tint text-content-primary`
const O_DUNG = `${O} border-[1.5px] border-success bg-success-bg text-success-text`
const O_SAI = `${O} border-[1.5px] border-danger bg-danger-bg text-danger-text`
const NHAN = ['A', 'B', 'C', 'D'] as const

export default function DocHieuPage() {
  const navigate = useNavigate()
  const topicId = new URLSearchParams(location.search).get('topic')
  const [ten, setTen] = useState('')
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const [ds, setDs] = useState<BaiDoc[] | null>(null)
  const [loiTai, setLoiTai] = useState<string | null>(null)
  const [i, setI] = useState(0)
  const [daChon, setDaChon] = useState<(number | null)[]>([])
  const [ketQua, setKetQua] = useState<{ so_dung: number; dung: boolean[] } | null>(null)
  const [hienPhienAm, setHienPhienAm] = useState(false) // Q7: mặc định TẮT, như đề thi
  const [hienDich, setHienDich] = useState(false)
  const [loiGhi, setLoiGhi] = useState<string | null>(null)
  const luotId = useRef(crypto.randomUUID())
  const soDaGhi = useRef(0)
  const mocDoan = useRef(Date.now())
  const daCham = useRef(false)
  const thuLaiGhi = useRef<(() => void) | null>(null)

  async function nap() {
    if (!topicId) return navigate('/on-tap/chu-de', { replace: true })
    const [tRes, vRes, rRes] = await Promise.all([
      supabase.from('topics').select('name').eq('id', topicId).maybeSingle(),
      supabase.from('vocab_topics').select('vocab(id, word, lang)').eq('topic_id', topicId),
      supabase.from('topic_readings').select('id, kieu, thu_tu, content').eq('topic_id', topicId).order('thu_tu'),
    ])
    const e = tRes.error ?? vRes.error ?? rRes.error
    if (e) return setLoiTai(e.message)
    const tu = ((vRes.data ?? []) as unknown as { vocab: { id: string; word: string; lang: 'zh' | 'en' } | null }[])
      .map((r) => r.vocab)
      .filter((v): v is { id: string; word: string; lang: 'zh' | 'en' } => Boolean(v))
    setTen((tRes.data as { name?: string } | null)?.name ?? '')
    setLang(tu[0]?.lang ?? 'zh')
    const bai = xaoLuot(docBaiDoc(rRes.data, Object.fromEntries(tu.map((v) => [v.id, v.word]))), Math.random)
    setDs(bai)
    setDaChon(bai[0]?.questions.map(() => null) ?? [])
    mocDoan.current = Date.now()
  }

  useEffect(() => {
    void nap()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nạp 1 lần theo topic
  }, [topicId])
```

### T12 · `DocHieuPage.tsx` — Kiểm tra / đoạn tiếp / thoát (4')
Nối tiếp trong component:
```tsx
  const bai = ds?.[i]
  const cuoiCung = ds !== null && i + 1 >= ds.length

  function ghi(dong: object) {
    thuLaiGhi.current = () => ghi(dong)
    void supabase.from('doc_hieu_log').insert(dong).then(({ error }) => {
      if (error) return setLoiGhi(error.message)
      setLoiGhi(null)
      soDaGhi.current += 1
    })
  }

  function kiemTra() {
    if (!bai || !topicId || daCham.current) return
    const kq = chamDoan(bai.questions, daChon)
    if (!kq) return
    daCham.current = true // chặn bấm đôi ⇒ đúng 1 INSERT/đoạn
    setKetQua(kq)
    phatAmThanh(kq.so_dung === bai.questions.length ? 'dung' : 'sai')
    ghi({
      luot_id: luotId.current, topic_id: topicId, reading_id: bai.id,
      so_cau: bai.questions.length, so_dung: kq.so_dung, thoi_gian_ms: thoiGianDoan(mocDoan.current, Date.now()),
    })
  }

  function thoat() {
    // Ghi chưa xong (đang chờ mạng) vẫn tính là đã làm — màn Kết quả đọc lại từ DB
    const daLam = soDaGhi.current > 0 || daCham.current
    navigate(daLam && topicId ? `/on-tap/doc-hieu/ket-qua?luot=${luotId.current}&topic=${topicId}` : '/on-tap/chu-de', { replace: true })
  }

  function tiep() {
    if (!ds || !ketQua) return
    if (cuoiCung) return thoat()
    setI(i + 1)
    setDaChon(ds[i + 1]?.questions.map(() => null) ?? [])
    setKetQua(null)
    setHienDich(false)
    daCham.current = false
    mocDoan.current = Date.now()
    window.scrollTo({ top: 0 })
  }

  // M11/Q2 — Enter = hành động chính của màn
  useDungPhim((e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (ketQua) tiep()
    else kiemTra()
  })
```

### T13 · `DocHieuPage.tsx` — khối ĐOẠN (4')
Thêm component cùng file (trên `export default`):
```tsx
function KhoiDoan({ bai, lang, hienPhienAm, daCham, hienDich, onDich }: {
  bai: BaiDoc; lang: 'zh' | 'en'; hienPhienAm: boolean; daCham: boolean; hienDich: boolean; onDich: () => void
}) {
  // Từ chủ đề CHỈ tô đậm sau Kiểm tra (Q7) — trước đó đọc như đề thi thật
  const chu = (text: string) =>
    chiaDam(text, daCham ? bai.tu_dam : []).map((p, j) =>
      p.dam ? <b key={j} className="font-bold text-accent">{p.text}</b> : <span key={j}>{p.text}</span>,
    )
  const font = lang === 'zh' ? 'font-han' : 'font-body'
  return (
    <section className="rounded-20 border border-border-card bg-surface-card p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-12 font-semibold uppercase tracking-[0.04em] text-content-muted">
          {bai.kieu === 'hoi_thoai' ? 'Hội thoại' : 'Đoạn văn'}
        </span>
        <div className="flex items-center gap-3">
          {daCham && (
            <button type="button" onClick={onDich} aria-pressed={hienDich}
              className="rounded-pill border border-border-card px-3 py-1 text-12 font-semibold text-content-nav">
              {hienDich ? 'Ẩn bản dịch' : 'Hiện bản dịch'}
            </button>
          )}
          <button type="button" aria-label="Nghe cả đoạn" className="text-content-muted"
            onClick={() => phatAm(bai.lines.map((l) => l.text).join(lang === 'zh' ? '' : ' '), lang)}>
            <Icon ten="loa" size={18} />
          </button>
        </div>
      </div>

      {bai.kieu === 'hoi_thoai' ? (
        <div className="flex flex-col gap-2.5">
          {bai.lines.map((l, k) => (
            <div key={k} className={`max-w-[88%] border px-3.5 py-2.5 ${l.speaker !== 'B'
              ? 'self-start rounded-16 rounded-bl-[4px] border-border-card bg-surface-page'
              : 'self-end rounded-16 rounded-br-[4px] border-border-chat-b bg-surface-chat-b'}`}>
              <p lang={lang} className={`${font} text-16 leading-relaxed text-content-primary md:text-17`}>
                <span className="mr-1.5 font-body text-12 font-semibold text-content-muted">{l.speaker}</span>{chu(l.text)}
              </p>
              {hienPhienAm && l.pinyin && <div className="mt-0.5 text-12 text-content-muted">{l.pinyin}</div>}
              {hienDich && l.vi && <div className="mt-1 text-13 text-content-nav">{l.vi}</div>}
            </div>
          ))}
        </div>
      ) : hienPhienAm || hienDich ? (
        // Bật pinyin/dịch ⇒ mỗi câu 1 dòng để pinyin & bản dịch canh đúng câu
        <div className="flex flex-col gap-2.5">
          {bai.lines.map((l, k) => (
            <div key={k}>
              <p lang={lang} className={`${font} text-17 leading-relaxed text-content-primary md:text-18`}>{chu(l.text)}</p>
              {hienPhienAm && l.pinyin && <div className="text-12 text-content-muted">{l.pinyin}</div>}
              {hienDich && l.vi && <div className="mt-0.5 text-13 text-content-nav">{l.vi}</div>}
            </div>
          ))}
        </div>
      ) : (
        <p lang={lang} className={`${font} text-17 leading-[1.9] text-content-primary md:text-18`}>
          {bai.lines.map((l, k) => <span key={k}>{chu(l.text)}{lang === 'en' ? ' ' : ''}</span>)}
        </p>
      )}
    </section>
  )
}
```

### T14 · `DocHieuPage.tsx` — khối CÂU HỎI (4')
```tsx
function KhoiCauHoi({ q, so, lang, hienPhienAm, chon, dung, onChon }: {
  q: CauHoiDoc; so: number; lang: 'zh' | 'en'; hienPhienAm: boolean
  chon: number | null; dung: boolean | null; onChon: (k: number) => void
}) {
  const daCham = dung !== null
  const font = lang === 'zh' ? 'font-han' : 'font-body'
  const lop = (k: number) => {
    if (!daCham) return k === chon ? O_DANG_CHON : `${O_TRUNG_TINH} hover:border-accent`
    if (k === q.dap_an) return O_DUNG
    return k === chon ? O_SAI : `${O_TRUNG_TINH} opacity-60`
  }
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p lang={lang} className={`${font} text-16 font-semibold text-content-primary md:text-17`}>{so}. {q.hoi}</p>
        {hienPhienAm && q.hoi_pinyin && <div className="text-12 text-content-muted">{q.hoi_pinyin}</div>}
      </div>
      {q.lua_chon.map((x, k) => (
        <button key={k} type="button" disabled={daCham} onClick={() => onChon(k)} className={lop(k)}>
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-current text-12 font-semibold">{NHAN[k]}</span>
          <span>
            <span lang={lang} className={`${font} block text-15 md:text-16`}>{x}</span>
            {hienPhienAm && q.lua_chon_pinyin[k] && <span className="block text-12 text-content-muted">{q.lua_chon_pinyin[k]}</span>}
          </span>
        </button>
      ))}
      {daCham && q.giai_thich_vi && (
        <div className="rounded-12 bg-surface-sunken px-4 py-3 text-13 leading-normal text-content-nav">{q.giai_thich_vi}</div>
      )}
    </div>
  )
}
```

### T15 · `DocHieuPage.tsx` — render (5')
Cuối component `DocHieuPage`:
```tsx
  if (loiTai) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div className="w-full max-w-[480px]">
          <KhungLoi tieuDe="Chưa tải được bài đọc" loi={loiTai}
            onThuLai={() => { setLoiTai(null); void nap() }} phu={{ nhan: 'Chọn chủ đề khác', toi: '/on-tap/chu-de' }} />
        </div>
      </main>
    )
  }
  if (ds && ds.length === 0) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div className="w-full max-w-[480px]">
          <KhungRong tieuDe="Chủ đề này chưa có bài đọc hiểu" moTa="Bài đọc được nạp từ file đề — chọn chủ đề khác nhé."
            hanhDong={{ nhan: 'Chọn chủ đề khác', toi: '/on-tap/chu-de' }} />
        </div>
      </main>
    )
  }
  if (!bai || !ds) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div className="grid w-full max-w-[1040px] gap-5 md:grid-cols-[1.15fr_1fr]">
          <div className="h-[260px] animate-pulse rounded-20 bg-surface-sunken" />
          <div className="h-[260px] animate-pulse rounded-20 bg-surface-sunken" />
        </div>
      </main>
    )
  }

  const duChon = daChon.every((x) => x !== null)
  return (
    <main className="flex min-h-[100dvh] flex-col bg-surface-page">
      <header className="flex items-center justify-between gap-3 border-b border-border-card px-5 py-4 md:px-8 md:py-5">
        <div className="min-w-0">
          <div className="text-12 font-semibold uppercase tracking-[0.04em] text-content-muted">Đọc hiểu · {i + 1}/{ds.length}</div>
          <h1 className="truncate font-display text-17 font-bold text-content-primary md:text-19">{ten}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {lang === 'zh' && (
            <button type="button" onClick={() => setHienPhienAm((v) => !v)} aria-pressed={hienPhienAm} aria-label="Bật/tắt phiên âm"
              className={`rounded-10 border border-border-card px-2.5 py-1.5 font-han text-15 ${hienPhienAm ? 'text-accent' : 'text-content-nav'}`}>
              拼
            </button>
          )}
          <button type="button" aria-label="Thoát" onClick={thoat} className="text-content-nav">
            <Icon ten="dong" size={20} strokeWidth="2" />
          </button>
        </div>
      </header>

      <div className="flex justify-center gap-1.5 pt-4">
        {ds.map((_, k) => (
          <span key={k} className={`h-1.5 rounded-pill transition-all ${k === i ? 'w-5 bg-accent' : k < i ? 'w-1.5 bg-accent' : 'w-1.5 bg-border-card'}`} />
        ))}
      </div>

      <div className="flex flex-1 justify-center px-5 py-5 md:px-8 md:py-7">
        <div className="grid w-full max-w-[1040px] items-start gap-5 md:grid-cols-[1.15fr_1fr] md:gap-7">
          <div className="md:sticky md:top-6">
            <KhoiDoan bai={bai} lang={lang} hienPhienAm={hienPhienAm} daCham={ketQua !== null} hienDich={hienDich} onDich={() => setHienDich((v) => !v)} />
          </div>
          <div className="flex flex-col gap-6">
            {bai.questions.map((q, k) => (
              <KhoiCauHoi key={`${bai.id}-${k}`} q={q} so={k + 1} lang={lang} hienPhienAm={hienPhienAm} chon={daChon[k] ?? null}
                dung={ketQua ? (ketQua.dung[k] ?? false) : null}
                onChon={(x) => setDaChon((cu) => cu.map((v, j) => (j === k ? x : v)))} />
            ))}
            {loiGhi && <BangLoi loi={loiGhi} tienTo="Chưa lưu được kết quả" onThuLai={() => thuLaiGhi.current?.()} />}
            {ketQua ? (
              <button type="button" onClick={tiep} className="rounded-14 bg-accent py-4 text-15 font-semibold text-white md:text-16">
                {cuoiCung ? 'Xem kết quả' : 'Đoạn tiếp'}
              </button>
            ) : (
              <button type="button" onClick={kiemTra} disabled={!duChon}
                className="rounded-14 bg-accent py-4 text-15 font-semibold text-white disabled:opacity-40 md:text-16">
                Kiểm tra
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
```
`npm run build` + `npm run lint` xanh (sửa kiểu nếu TS strict báo).

### T16 · `src/features/player/KetQuaDocHieuPage.tsx` (5')
```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import { KhungLoi, KhungRong } from '../../components/TrangThai.tsx'
import { phatAmThanh } from '../../lib/amThanh.ts'
import { tongHopKetQua, type DongLogDoc, type KieuDoan } from '../../lib/docHieu.ts'
import { dinhDangNgayVN, homNayVN } from '../../lib/player.ts'
import { supabase } from '../../lib/supabase.ts'

/**
 * KẾT QUẢ ĐỌC HIỂU (M31, design.m31.md §5.2 — khuôn Tổng kết mockup 12, KHÔNG có mockup riêng).
 * Số liệu query `doc_hieu_log` theo `luot_id` (không lấy state client). Đây cũng là nơi CHỐT NHẬT KÝ
 * NGÀY cho lượt đọc hiểu (như Tổng kết, M14) — thời gian đọc vào streak/số phút.
 */
type KetQua = ReturnType<typeof tongHopKetQua>

export default function KetQuaDocHieuPage() {
  const tham = new URLSearchParams(location.search)
  const luot = tham.get('luot')
  const topicId = tham.get('topic')
  const [kq, setKq] = useState<KetQua | null>(null)
  const [ten, setTen] = useState('')
  const [loi, setLoi] = useState<string | null>(null)
  const daChot = useRef(false)
  const daPhatAm = useRef(false)

  useEffect(() => {
    if (daPhatAm.current) return
    daPhatAm.current = true
    phatAmThanh('hoan_thanh')
  }, [])
  // M14 — chốt nhật ký ngày, không chặn màn khi lỗi (cùng lý do TongKetPage)
  useEffect(() => {
    if (daChot.current) return
    daChot.current = true
    void supabase.rpc('chot_nhat_ky_ngay').then(({ error }) => {
      if (error) console.warn('Không chốt được nhật ký ngày:', error.message)
    })
  }, [])

  const nap = useCallback(async () => {
    if (!luot) return setKq(tongHopKetQua([]))
    const [lRes, tRes] = await Promise.all([
      supabase.from('doc_hieu_log').select('so_cau, so_dung, thoi_gian_ms, topic_readings(kieu)').eq('luot_id', luot).order('created_at'),
      topicId ? supabase.from('topics').select('name').eq('id', topicId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ])
    const e = lRes.error ?? tRes.error
    if (e) return setLoi(e.message)
    // supabase-js suy kiểu quan hệ thành mảng; thực tế là 1 object (FK n-1)
    const rows = (lRes.data ?? []) as unknown as (Omit<DongLogDoc, 'kieu'> & { topic_readings: { kieu: KieuDoan } | null })[]
    setTen((tRes.data as { name?: string } | null)?.name ?? '')
    setKq(tongHopKetQua(rows.map((r) => ({ ...r, kieu: r.topic_readings?.kieu ?? null }))))
  }, [luot, topicId])
  useEffect(() => { void nap() }, [nap])

  const khung = (noiDung: React.ReactNode) => (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6"><div className="w-full max-w-[480px]">{noiDung}</div></main>
  )
  if (loi) return khung(<KhungLoi tieuDe="Chưa tải được kết quả" loi={loi} onThuLai={() => { setLoi(null); void nap() }} phu={{ nhan: 'Về Dashboard', toi: '/' }} />)
  if (!kq) return khung(<div className="h-[320px] animate-pulse rounded-20 border border-border-card bg-surface-sunken" />)
  if (kq.doan.length === 0) return khung(<KhungRong tieuDe="Chưa có đoạn nào được chấm" hanhDong={{ nhan: 'Chọn chủ đề', toi: '/on-tap/chu-de' }} />)

  return (
    <main className="flex min-h-[100dvh] justify-center bg-surface-page px-5 py-10 md:px-10 md:py-12">
      <div className="flex w-full max-w-[560px] flex-col gap-5">
        <div className="text-center">
          <Icon ten="an-mung" size={46} className="mx-auto mb-3 block text-accent" />
          <h1 className="font-display text-26 font-bold text-content-primary">Hoàn thành đọc hiểu</h1>
          <div className="mt-1.5 text-14 text-content-muted">{ten} · {dinhDangNgayVN(homNayVN(new Date()))}</div>
        </div>

        <div className="flex gap-[14px]">
          <div className="flex-1 rounded-16 bg-accent-tint p-5 text-center">
            <div className="font-display text-28 font-bold text-accent-text">{kq.so_dung}/{kq.so_cau}</div>
            <div className="mt-1 text-12 font-semibold text-accent">Câu đúng</div>
          </div>
          <div className="flex-1 rounded-16 bg-border-card p-5 text-center">
            <div className="font-display text-28 font-bold text-content-primary">{kq.doan.length}</div>
            <div className="mt-1 text-12 font-semibold text-content-muted">Đoạn</div>
          </div>
          <div className="flex-1 rounded-16 bg-border-card p-5 text-center">
            <div className="font-display text-28 font-bold text-content-primary">{kq.phut}</div>
            <div className="mt-1 text-12 font-semibold text-content-muted">Phút</div>
          </div>
        </div>

        <div className="rounded-18 border border-border-card bg-surface-card px-[18px] py-2">
          {kq.doan.map((d, k) => (
            <div key={k} className={`flex items-center justify-between py-3 ${k < kq.doan.length - 1 ? 'border-b border-border-card' : ''}`}>
              <span className="text-15 text-content-primary">Đoạn {k + 1} · {d.kieu === 'hoi_thoai' ? 'Hội thoại' : 'Đoạn văn'}</span>
              <span className={`text-14 font-semibold ${d.so_dung === d.so_cau ? 'text-success-text' : 'text-content-muted'}`}>
                {d.so_dung}/{d.so_cau}{d.so_dung === d.so_cau ? ' ✓' : ''}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-1.5 flex flex-col gap-3">
          {topicId && (
            <Link to={`/on-tap/doc-hieu?topic=${topicId}`} replace className="rounded-14 bg-accent py-4 text-center text-16 font-semibold text-white">
              Làm lại chủ đề này
            </Link>
          )}
          <Link to="/on-tap/chu-de" className="rounded-14 bg-secondary-tint py-4 text-center text-15 font-semibold text-secondary">Chọn chủ đề khác</Link>
          <Link to="/" className="rounded-14 py-2.5 text-center text-14 font-semibold text-content-muted">Về Dashboard</Link>
        </div>
      </div>
    </main>
  )
}
```
(`React.ReactNode` ⇒ import `type ReactNode` từ 'react' nếu TS báo.)

### T17 · Route (2')
`src/App.tsx`: import `DocHieuPage`, `KetQuaDocHieuPage`; xoá import + route `HoiThoaiKetThucPage`; thêm:
```tsx
        <Route path="/on-tap/doc-hieu" element={<DocHieuPage />} />
        <Route path="/on-tap/doc-hieu/ket-qua" element={<KetQuaDocHieuPage />} />
```
Comment cây route: `/on-tap (+ ?che_do=retry), /on-tap/tong-ket, /on-tap/ngu-phap, /on-tap/doc-hieu(/ket-qua) — toàn màn hình`.

### T18 · Màn Chọn chủ đề — "N đoạn · Lần gần nhất X/Y" (4')
`ChonChuDePage.tsx` — `nap()` thêm 2 truy vấn vào `Promise.all`:
```ts
      supabase.from('topic_readings').select('topic_id'),
      supabase.from('doc_hieu_log').select('topic_id, luot_id, so_cau, so_dung, created_at'),
```
gộp lỗi `?? rRes.error ?? hRes.error`; state mới `const [doc, setDoc] = useState<{ so: Record<string, number>; gan: ReturnType<typeof lanGanNhat> }>({ so: {}, gan: {} })`:
```ts
    const so: Record<string, number> = {}
    for (const r of (rRes.data ?? []) as { topic_id: string }[]) so[r.topic_id] = (so[r.topic_id] ?? 0) + 1
    setDoc({ so, gan: lanGanNhat((hRes.data ?? []) as Parameters<typeof lanGanNhat>[0]) })
```
Nút card: `disabled={(doc.so[c.id] ?? 0) === 0}`; dòng dưới thanh màu thay bằng:
```tsx
              <div className="mt-2 text-12 font-semibold text-accent">
                {(doc.so[c.id] ?? 0) === 0
                  ? 'Chưa có bài đọc'
                  : `${doc.so[c.id]} đoạn đọc` + (doc.gan[c.id] ? ` · Lần gần nhất ${doc.gan[c.id]!.so_dung}/${doc.gan[c.id]!.so_cau}` : '')}
              </div>
```
Mô tả đầu trang: `Đọc hội thoại và đoạn văn dùng từ của chủ đề, trả lời câu hỏi như phần đọc HSK. Không ảnh hưởng điểm ôn hằng ngày.`
Comment đầu file: thêm dòng M31. (Thứ tự sắp xếp `tomTatChuDe` giữ nguyên — không đổi file `chuDe.ts`.)

### T19 · Dashboard cộng phút đọc hiểu hôm nay (3')
`DashboardPage.tsx`: thêm vào `Promise.all` (ngay sau truy vấn `review_log` hôm nay):
```ts
      // M31 — đọc hiểu hôm nay cũng là thời gian học (lượt đang dở chưa được chốt nhật ký)
      supabase.from('doc_hieu_log').select('created_at, thoi_gian_ms').gte('created_at', `${homNay}T00:00:00+07:00`),
```
gộp lỗi; đổi dòng `const logs = …` thành:
```ts
    const logs = [
      ...((logRes.data ?? []) as { reviewed_at: string; thoi_gian_ms: number | null }[]),
      ...((docRes.data ?? []) as { created_at: string; thoi_gian_ms: number | null }[]).map((r) => ({ reviewed_at: r.created_at, thoi_gian_ms: r.thoi_gian_ms })),
    ]
```
(`gopNhatKy` không đổi — đã có test M14.)

## Pha E — Gỡ chế độ topic cũ

### T20 · `PlayerPage.tsx` (5')
Xoá đúng các mảnh sau (diff cục bộ, KHÔNG viết lại file):
- import `gomSessionTopic`, `stageBaiTap`.
- dòng 98–99 (`topicId`); ref `dueTrongTopic` + `daPhucVuTopic` (132–139).
- `if (topicId) { … } else if (cheDoRetry)` ⇒ `if (cheDoRetry)` (xoá khối 182–201).
- `const phienAll = gomSession(dong)`.
- `if (topicId) { dangChoPhep = … } else if (cheDoRetry)` ⇒ `if (cheDoRetry)`.
- `const phienMo = phien.map((t) => moLaiNeuHetBai(t, coRecordPhien[t.vocab_id] ?? []))`; xoá spread `boQuaDaDat`; xoá dòng `daPhucVuTopic.current.add`.
- deps napSession `[cheDoRetry, taiBaiTap, taiVocabTuB]`.
- effect `khong_co_tu`: `navigate('/on-tap/tong-ket', { replace: true })`, deps `[tt.buoc, navigate]`, comment bỏ phần chủ đề.
- `traLoi`: xoá nhánh `if (topicId && !dueTrongTopic…)` (341–363), deps `[cheDoRetry]`.
- Docblock đầu file: bỏ nhắc chế độ topic; nếu `boBaiCua` vẫn dùng ở nhánh retry thì giữ import.

### T21 · Dọn `player.ts` + test + file chết (3')
- `player.ts`: xoá khối `// ── M7: ôn theo chủ đề` (`stageBaiTap`, `gomSessionTopic`); xoá tham số `boQuaDaDat` (khai báo, destructure, `daDatCua` ⇒ `tu.find(...)?.cycle_completed_exercises ?? []`) + câu comment `(trừ khi boQuaDaDat…)`. Import `StageOn` nếu không còn dùng ⇒ bỏ.
- `player.test.ts`: xoá import 2 hàm, `describe('stageBaiTap')`, `describe('gomSessionTopic')`, `describe('xepBai — boQuaDaDat …')`.
- Xoá `src/features/player/HoiThoaiKetThucPage.tsx` (hội thoại vẫn ở `features/vocab/HoiThoaiChuDe.tsx`; `hoiThoai.ts` vẫn được dùng ở đó + DocHieu — giữ).
- `grep -rn "che_do=topic\|hoi-thoai?\|giai_doan\|gomSessionTopic\|stageBaiTap\|boQuaDaDat" src scripts` ⇒ 0 dòng.
- `npm test` · `npm run build` · `npm run lint` xanh.

## Pha F — Tài liệu

### T22 · SPEC + UI_DESIGN (4')
- `SPECIFICATION.md` §4.5: bảng 2 chế độ — dòng "Ôn theo topic" ⇒ `Đọc hiểu kiểu HSK: ~5 đoạn (hội thoại + đoạn văn) dùng từ của topic, 2–3 câu trắc nghiệm/đoạn; KHÔNG tính điểm SRS; kết quả ở doc_hieu_log`; cột hội thoại ⇒ `KHÔNG (xem ở màn Từ vựng)`; thêm đoạn "M31 (2026-10-18)" tóm tắt luồng Ngữ pháp → Đọc hiểu → Kết quả + 2 bảng mới (đính chính: §2 nay 14 bảng). §13 bảng màn hình: dòng "Ôn tập theo topic".
- `UI_DESIGN.md` §8.3: thay nội dung bằng đặc tả màn Đọc hiểu + Kết quả (tóm tắt design.m31.md §5, ghi rõ "không có mockup, duyệt qua ảnh"); ghi chú lệch §6.2 có chủ ý (lộ đáp án sau Kiểm tra).

## Pha G — Chủ đề thử + kiểm chứng

### T23 · Soạn đề 1 chủ đề thử (cổng duyệt M31b)
- `node scripts/chup-chu-de.mjs > du-lieu-import/doc-hieu/chu-de-db.json` (chỉ đọc) → lấy chủ đề **đầu tiên của bộ HSK3 giao tiếp**.
- Soạn `du-lieu-import/doc-hieu/01.json`: 2 hội thoại (4–8 lượt) + 3 đoạn văn (60–120 chữ), mỗi đoạn 2–3 câu, phủ 100% từ, đúng chuẩn design.m31.md §6 + văn phong memory.
- `npm run bo-sung:doc-hieu -- du-lieu-import/doc-hieu/01.json --dry-run` ⇒ 0 lỗi, `thieu_phu` rỗng → chạy thật (ghi 5 dòng `topic_readings`).

### T24 · CDP thật (PC 1280 + Mobile 390 × Sáng/Tối)
Script ở scratchpad (Vite + Chrome headless, như M30). **Chặn** `*rpc/chot_nhat_ky_ngay*` bằng `Network.setBlockedURLs` (không để lượt kiểm thử tự cộng phút/streak vào nhật ký thật); sau cùng xoá `doc_hieu_log` **chỉ theo đúng `luot_id` script tạo** (luật DB 7).
Ca kiểm: chọn chủ đề → ngữ pháp → đọc hiểu (URL đúng) · 5 đoạn · pinyin mặc định tắt / bật được · Kiểm tra tắt tới khi chọn đủ · sau Kiểm tra: màu đúng/sai, giải thích, từ tô đậm, nút bản dịch · đúng 1 dòng log/đoạn (bấm Kiểm tra 2 lần) · X sau 1 đoạn ⇒ Kết quả 1 đoạn; X trước đoạn nào ⇒ Chọn chủ đề · Kết quả khớp DB · chủ đề chưa có đề ⇒ card mờ "Chưa có bài đọc" + vào thẳng URL ⇒ KhungRong · không cuộn ngang ở 390 · PC cột đoạn sticky. Chụp ảnh gửi duyệt bố cục.

### T25 · Tổng nghiệm thu + memory-bank
`npm test` · `npm run build` · `npm run lint` · `db:migrate` ×2 · `check:schema` · `test:nhatky` 7/7 · `test:db` · `test:player` (Player hằng ngày không vỡ) · `test:import`.
Cập nhật `activeContext.md`, `progress.md`, `decisionLog.md` (MB-53), `systemPatterns.md` (14 bảng, luật M31), `productContext.md` §4.3; tắt Vite/Chrome theo PID.
Nhắc người dùng `npm run deploy:firebase` sau khi họ tự commit.

---
**Sau M31a:** người dùng duyệt (1) ảnh bố cục, (2) văn phong + độ khó chủ đề thử ⇒ mở `design.m31b.md` (34 chủ đề còn lại) và `design.m31c.md` (import).
