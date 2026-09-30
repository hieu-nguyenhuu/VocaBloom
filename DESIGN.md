# DESIGN.md — M20: Hội thoại chủ đề ở màn Từ vựng

> Kiến trúc + kế hoạch của RIÊNG task này (thay nội dung M19 đã xong, M19 đã ghi vào memory-bank MB-40).
> Ngày lập: 2026-09-30 · Trạng thái: **✅ DESIGN + PLAN ĐÃ DUYỆT · ĐÃ XONG 2026-09-30** (xem §F)
> Người dùng chốt: (1) mặc định ĐÓNG · (2) nghĩa ẩn + nút "Hiện nghĩa" · (3) thêm icon chat ·
> (4) **BỎ nút loa** — khối này không phát âm thanh gì.
> ⚠️ Mockup 13/14 (Từ vựng) **không có** khối hội thoại ⇒ layout dưới đây là ĐỀ XUẤT, ghép từ 2 pattern
> đã có: khối "Ngữ pháp chủ đề" (M12b) + bong bóng chat của mockup 11 (Hội thoại kết thúc).

## A. Yêu cầu

Ở màn Từ vựng, khi chọn 1 chủ đề: ngay DƯỚI khối "Ngữ pháp chủ đề" hiện khối **"Hội thoại chủ đề"**, gấp/mở được,
nhìn khác khối ngữ pháp để không nhầm.

## B. Dữ liệu (không đổi DB, không đổi logic)

- Bảng `topic_dialogues` (SPEC §2 nhóm 7): **1 chủ đề ↔ tối đa 1 hội thoại**, `content.lines[]` =
  `{speaker, text_zh, pinyin, text_vi, highlight_vocab_ids}`. Dữ liệu thật: 9–10 câu/chủ đề, vai A/B, câu ≤ 32 ký tự.
- **Dùng lại nguyên** `docHoiThoai` + `chiaDam` (`src/lib/hoiThoai.ts`, 13 ca test từ M7), không viết logic mới.
- Map `id → word` để bôi đậm lấy từ state `tu` **đã tải sẵn** của màn ⇒ chỉ thêm **1 truy vấn**
  `topic_dialogues.select('content').eq('topic_id', id).maybeSingle()`, chạy cùng lúc với truy vấn ngữ pháp.
- `lang` lấy từ từ đầu tiên của chủ đề (như `HoiThoaiKetThucPage`).

## C. Layout đề xuất — phân biệt với khối Ngữ pháp bằng 4 điểm

| | Ngữ pháp chủ đề (đang có) | **Hội thoại chủ đề (mới)** |
|---|---|---|
| Nền khối | `surface-sunken` (be lõm) | **`surface-card`** (trắng/nổi) + viền `border-card` |
| Cách gấp | Luôn mở khối, gấp **từng mục** (+/−) | Gấp/mở **cả khối** 1 lần, mặc định **ĐÓNG** |
| Đầu khối | Chữ in hoa nhỏ, xám | Icon **bong bóng chat** (tím) + "Hội thoại chủ đề" + "· N câu" + mũi tên xoay ▾/▴ |
| Nội dung | Thẻ trắng xếp dọc | **Bong bóng chat A trái / B phải** đúng kiểu mockup 11 (thu nhỏ cỡ chữ 15/12) |

Khi mở:
```
┌───────────────────────────────────────────────┐
│ 💬 Hội thoại chủ đề · 9 câu         [Hiện nghĩa] ▴ │
├───────────────────────────────────────────────┤
│ ╭──────────────────╮                           │
│ │ 你**迟到**了！      │  ← A: be nhạt (sunken)     │
│ │ nǐ chídào le      │                           │
│ ╰──────────────────╯                           │
│                    ╭──────────────────────╮    │
│                    │ 对不起，路上堵车        │ ← B: be đậm (chat-b) │
│                    ╰──────────────────────╯    │
└───────────────────────────────────────────────┘
```
- Từ vựng bôi **tím đậm** (`text-accent`) như mockup 11 (Color Lock: tím = highlight từ trong hội thoại).
- Nút "Hiện nghĩa / Ẩn nghĩa" (giống màn Hội thoại kết thúc). **KHÔNG có nút loa** (người dùng chốt).
- Nền khối là trắng nên bong bóng A đổi sang **be nhạt `surface-sunken`** (mockup 11 A = trắng trên nền trang,
  ở đây trắng-trên-trắng sẽ mất bong bóng); B giữ `surface-chat-b`. Vẫn đúng UI_DESIGN §8.3 "be nhạt/đậm, không hue mới".
- Khung bong bóng giới hạn `max-w-[640px]` cho thẳng với danh sách từ bên dưới.
- **Không có hội thoại** ⇒ không hiện khối (y như ngữ pháp). Chế độ **"Tất cả từ vựng"** ⇒ không có khối.
- Lỗi tải hội thoại ⇒ **ẩn khối im lặng** (khối phụ, giống cách ngữ pháp đang xử lý; không chặn danh sách từ).
- Đổi chủ đề ⇒ khối tự **đóng lại** và tắt "Hiện nghĩa".

## D. Phạm vi file

| File | Thay đổi |
|---|---|
| `src/components/icons.tsx` | +1 icon `chat` (tự vẽ, stroke 1.8 round — mockup không có) |
| `src/features/vocab/HoiThoaiChuDe.tsx` | **MỚI** — component trình bày khối (nhận `dong`, `lang`), tự giữ state mở/nghĩa |
| `src/features/vocab/TuVungPage.tsx` | +1 state, +1 truy vấn trong `napTu`, đặt component ngay dưới khối ngữ pháp |

0 package · 0 migration · 0 hàm logic mới (TDD không bắt buộc — task UI thuần, logic đã có test).
Kiểm chứng: `npm test` + build + lint + CDP chụp PC/Mobile × Sáng/Tối, đo đóng/mở, "Tất cả" không có khối.

## E. PLAN (4 task, mỗi task 2–5 phút)

### T1 — Icon `chat` (`src/components/icons.tsx`)
Thêm vào union `TenIcon` (sau `'ruby'`):
```ts
  // Từ vựng (M20) — 2 bong bóng chồng nhau = hội thoại A/B; mockup KHÔNG có, tự vẽ cùng nét
  | 'chat'
```
Thêm vào `PATH` (sau `ruby`):
```tsx
  chat: (
    <>
      <path d="M15 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1v3l3-3" />
      <path d="M11 10h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2.5L15 19h-4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" />
    </>
  ),
```

### T2 — Component mới `src/features/vocab/HoiThoaiChuDe.tsx`
```tsx
import { useState } from 'react'
import { Icon } from '../../components/icons.tsx'
import { chiaDam, type DongHoiThoai } from '../../lib/hoiThoai.ts'

/**
 * M20 — Hội thoại CỦA CHỦ ĐỀ ở màn Từ vựng (khối tra cứu, không tính điểm, không phát âm).
 * Mockup 13/14 không có khối này — layout duyệt ở DESIGN.md M20: bong bóng A/B mượn mockup 11, cố ý
 * khác khối "Ngữ pháp chủ đề" (nền nổi · gấp CẢ khối · mặc định ĐÓNG · icon chat).
 * Cha đặt `key={topicId}` ⇒ đổi chủ đề là khối tự đóng + tắt nghĩa, không cần effect.
 */
export default function HoiThoaiChuDe({ dong, lang }: { dong: DongHoiThoai[]; lang: 'zh' | 'en' }) {
  const [mo, setMo] = useState(false)
  const [hienNghia, setHienNghia] = useState(false)

  return (
    <section className="mb-4 max-w-[640px] rounded-14 border border-border-card bg-surface-card">
      <button
        type="button"
        aria-expanded={mo}
        onClick={() => setMo((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <Icon ten="chat" size={18} className="shrink-0 text-accent" />
        <span className="text-14 font-bold text-content-primary">Hội thoại chủ đề</span>
        <span className="text-12 text-content-muted">· {dong.length} câu</span>
        <Icon
          ten="back"
          size={16}
          strokeWidth={2}
          className={`ml-auto shrink-0 text-content-muted transition-transform ${mo ? 'rotate-90' : '-rotate-90'}`}
        />
      </button>
      {mo && (
        <div className="flex flex-col gap-2.5 border-t border-border-card px-4 py-4">
          <button
            type="button"
            onClick={() => setHienNghia((v) => !v)}
            aria-pressed={hienNghia}
            className="self-end rounded-pill border border-border-card px-3 py-1.5 text-12 font-semibold text-content-nav"
          >
            {hienNghia ? 'Ẩn nghĩa' : 'Hiện nghĩa'}
          </button>
          {dong.map((d, i) => {
            const trai = d.speaker !== 'B'
            return (
              <div
                key={i}
                className={`max-w-[82%] border px-3.5 py-2.5 ${
                  trai
                    ? 'self-start rounded-16 rounded-bl-[4px] border-border-card bg-surface-sunken'
                    : 'self-end rounded-16 rounded-br-[4px] border-border-chat-b bg-surface-chat-b'
                }`}
              >
                <p lang={lang} className="font-han text-15 text-content-primary">
                  {chiaDam(d.text, d.tu_dam).map((p, j) =>
                    p.dam ? <b key={j} className="font-bold text-accent">{p.text}</b> : <span key={j}>{p.text}</span>,
                  )}
                </p>
                {d.pinyin && <div className="mt-0.5 text-12 text-content-muted">{d.pinyin}</div>}
                {hienNghia && d.nghia && <div className="mt-1 text-13 text-content-nav">{d.nghia}</div>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
```
(`back` path `M15 18l-6-6 6-6` chỉ sang trái ⇒ `-rotate-90` = ▾ đóng, `rotate-90` = ▴ mở; không cần icon mới.)

### T3 — Nạp dữ liệu trong `TuVungPage.tsx`
- Import: `import { docHoiThoai } from '../../lib/hoiThoai.ts'` + `import HoiThoaiChuDe from './HoiThoaiChuDe.tsx'`.
- State ngay dưới `moNguPhap`:
```ts
  /** M20 — `topic_dialogues.content` THÔ; đổi sang dòng lúc render vì cần `tu` để tra chữ bôi đậm. */
  const [hoiThoai, setHoiThoai] = useState<unknown>(null)
```
- Trong `napTu`, thay khối `if (id === TAT_CA) … else { … }` bằng:
```ts
    if (id === TAT_CA) {
      setNguPhap([])
      setHoiThoai(null)
    } else {
      const [g, h] = await Promise.all([
        supabase.from('topic_grammar').select('*').eq('topic_id', id).order('thu_tu'),
        supabase.from('topic_dialogues').select('content').eq('topic_id', id).maybeSingle(),
      ])
      setNguPhap(docNguPhap(g.data))
      // M20 — lỗi/không có ⇒ `null` ⇒ khối ẩn im lặng (khối phụ, không chặn danh sách từ)
      setHoiThoai((h.data as { content?: unknown } | null)?.content ?? null)
    }
```

### T4 — Render trong `TuVungPage.tsx`
- Cạnh `dsHien`:
```ts
  const dongHoiThoai =
    laTatCa || !tu || hoiThoai === null ? [] : docHoiThoai(hoiThoai, Object.fromEntries(tu.map((t) => [t.id, t.word])))
```
- Ngay sau `)}` đóng khối ngữ pháp, trước ô tìm kiếm:
```tsx
              {/* M20 — Hội thoại CỦA CHỦ ĐỀ: gấp cả khối, mặc định đóng; không có thì KHÔNG hiện */}
              {dongHoiThoai.length > 0 && (
                <HoiThoaiChuDe key={topicId} dong={dongHoiThoai} lang={tu?.[0]?.lang ?? 'zh'} />
              )}
```

### T5 — Kiểm chứng (không ghi DB — chỉ ĐỌC, tuân §9.7)
1. `npm test` · `npm run build` · `npm run lint` xanh.
2. CDP (dev server + Chrome headless, đăng nhập thật, **chỉ thao tác đọc/bấm gấp mở**):
   - Chủ đề có hội thoại: khối hiện, `aria-expanded=false`, 0 bong bóng · bấm ⇒ số bong bóng = số dòng
     `topic_dialogues` đọc thẳng PostgREST · có ≥1 `<b>` tím · "Hiện nghĩa" hiện nghĩa · **0 nút "Nghe"**.
   - Khối hội thoại nằm SAU khối ngữ pháp trong DOM · đổi chủ đề ⇒ khối đóng lại.
   - `/tu-vung/tat-ca` ⇒ không có khối.
   - Chụp PC 1280 + Mobile 390 × Sáng/Tối để đối chiếu thị giác (bong bóng A tách khỏi nền trắng, dark 3 tầng).
3. Tắt dev server + Chrome, cập nhật memory-bank.

## F. Kết quả (2026-09-30)

- `npm test` **396/396** · build xanh · lint **0 lỗi** (9 cảnh báo — đúng bằng trước task) · **CDP 14/14** (PC 1280 +
  Mobile 390, Sáng/Tối, chỉ ĐỌC — 0 lệnh ghi DB).
- ⚠️ **Lệch plan duy nhất (T3):** plan gộp truy vấn hội thoại vào `Promise.all` với ngữ pháp. Đo thật bằng
  `Network.setBlockedURLs(['*topic_dialogues*'])` ⇒ **danh sách từ kẹt skeleton vĩnh viễn** — trái cam kết "khối phụ
  không chặn danh sách từ". Đã đổi sang tải **riêng, không await**, state gắn `{ id, content }` để phản hồi muộn của
  chủ đề cũ không hiện nhầm. Khối ngữ pháp trả về nguyên như cũ.
- ✅ **Lỗi CŨ M12b — đã vá theo yêu cầu người dùng:** cùng phép đo với `*topic_grammar*` từng làm danh sách từ kẹt
  skeleton (`napTu` `await` ngữ pháp TRƯỚC khi tải từ). Nay ngữ pháp cũng tải riêng, state `nguPhapCua { id, muc }`.
  Đo lại: **10 từ, 0 skeleton**, chỉ khối ngữ pháp ẩn · hồi quy M20 12/12 · chặn hội thoại 2/2.
- Ca "chủ đề không có hội thoại" không có dữ liệu thật (20/20 chủ đề đều có) ⇒ phủ bằng ca chặn request (lỗi và
  rỗng cùng đi về nhánh ẩn khối).
