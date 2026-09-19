# DESIGN.md — M6c: TTS Google + Storage

> ⚠️ Kiến trúc + kế hoạch của RIÊNG task này, ghi đè bản M6b (đã lưu ở `DESIGN.M6b.md`).
> KHÔNG nhầm với `UI_DESIGN.md` (đặc tả UI tổng thể cố định của toàn app).
>
> Ngày lập: 2026-09-18 · Trạng thái: **✅ HOÀN THÀNH 2026-09-19 — test 216/216, CDP 14/14**

---

## 0. Phạm vi (chốt ở Brainstorm 2026-09-18)

Lát cuối của M6. Sau lát này, `vocab.audio_url` mới có dữ liệu ⇒ 2 dạng bài **Audio Recognition**
và **Listen Fill** mới phát đúng file mp3 thay vì giọng máy của trình duyệt.

**Làm:**
- Migration `0009`: bucket Storage `audio` (công khai đọc) + policy ghi cho `authenticated`
  + **sửa dữ liệu `settings.tts_voice` đang sai** + 2 key mới.
- `src/lib/ttsCore.ts` — **thuần** (TDD): danh sách giọng, chọn giọng theo `lang`, đặt tên file,
  dựng body request, đọc kết quả, lọc từ cần gen.
- `src/lib/tts.ts` — I/O: gọi Google TTS → upload Storage → ghi `vocab.audio_url`.
- Màn Cài đặt: ô nhập **khoá Google TTS**, **2 ô chọn giọng** (Trung + Anh) mỗi ô kèm **nút nghe thử**,
  và nút **"Tạo audio còn thiếu (N từ)"**.
- Màn Import: sau khi import xong, **tự chạy gen audio ở nền** và hiện tiến độ.
- Sửa `SPECIFICATION.md` §9/§11 cho khớp thực tế Google (xem §1).

**KHÔNG làm:** audio cho câu ví dụ / collocation / hội thoại — schema chỉ có **1 cột**
`vocab.audio_url` cho từ đơn, những chỗ đó vẫn dùng Web Speech API. · Màn Từ vựng (còn stub) · M7.

**0 package mới** (dùng `fetch`, `atob`, `supabase.storage` sẵn có).

---

## 1. ⚠️ Phát hiện khi kiểm thật — tài liệu đang SAI

Gọi thật Google TTS bằng khoá trong `.env.local` (2026-09-18):

| Kiểm | Kết quả |
|---|---|
| CORS từ browser | ✅ preflight `OPTIONS` → **200**, `access-control-allow-origin: http://localhost:5199` ⇒ gọi thẳng từ browser được, không cần proxy |
| `en-US-Neural2-C` | ✅ 200, mp3 ~7 KB cho từ `teacher` |
| `cmn-CN-Neural2-C` | ❌ **400 — `Voice 'cmn-CN-Neural2-C' does not exist`** |

**Google KHÔNG có `cmn-CN-Neural2-*`.** Tiếng Trung chỉ có: `cmn-CN-Standard-A..D`,
`cmn-CN-Wavenet-A..D`, `cmn-CN-Chirp3-HD-*` (30 giọng).

Nghĩa là **`SPECIFICATION.md` §9/§11 sai**, `GIONG_TTS` trong `settings.ts` sai, và **giá trị đang nằm
trong DB (`tts_voice = "cmn-CN-Neural2-C"`) sẽ làm mọi lời gọi TTS trả 400**. M6c phải sửa cả ba.

→ Chốt dùng **`cmn-CN-Wavenet-A/B/C/D`** (A nữ · B nam · C nam · D nữ): tốt hơn Standard, tên ổn định,
và trùng chữ cái nên lựa chọn hiện tại của người dùng (`...-C`, giọng nam) được giữ nguyên.

---

## 2. 8 quyết định đã chốt với người dùng

| # | Nội dung | Ghi chú |
|---|---|---|
| Q1 | **Sinh audio TRONG APP** (phương án B) — khoá Google lưu ở bảng `settings`, nhập tại màn Cài đặt, y như khoá OpenRouter (MB-04) | Đúng SPEC §9 ("app tự gọi TTS sau khi import"). Khoá **không** đi qua `VITE_*` nên không bị nhúng vào `dist/` |
| Q2 | Nút **nghe thử gọi thẳng Google** (khoá đã có sẵn trong browser), 2 nút — 1 cho mỗi ô giọng | |
| Q3 | Bucket `audio` **công khai đọc**, ghi chỉ cho `authenticated` | mp3 phát âm không nhạy cảm; `audio_url` là URL tĩnh vĩnh viễn, không phải ký lại |
| Q4 | **2 ô chọn giọng riêng**: `tts_voice` (Trung) + `tts_voice_en` (Anh) | Người dùng yêu cầu rõ ở Brainstorm |
| Q5 | Tên file theo **hash của `word‖lang‖voice`** | 2 dòng "晴天" (2 topic) dùng chung 1 file ⇒ **chỉ tốn 1 lời gọi API** |
| Q6 | Giọng Trung: `cmn-CN-Wavenet-A/B/C/D` | Xem §1 |
| Q7 | Giọng Anh: `en-US-Neural2-C` (nữ, mặc định) · `-F` (nữ) · `-D` (nam) · `-J` (nam) | Cân giới tính, 4 lựa chọn cho gọn |
| Q8 | Đổi giọng **không** tự gen lại audio cũ; muốn làm lại thì bấm nút "Tạo audio còn thiếu" | Tránh đốt quota ngoài ý muốn |

**Tự quyết (ghi để soát):** nút **"Tạo audio còn thiếu (N từ)"** ở Cài đặt — SPEC §9 chỉ gen sau Import,
nhưng 9 từ hiện có đã nhập từ trước nên nếu không có lối chạy tay thì **vĩnh viễn không có audio**.

---

## 3. Kiến trúc

### 3.1 Migration `0009_tts_storage.sql` (idempotent)
```sql
-- 1) Bucket công khai đọc
insert into storage.buckets (id, name, public) values ('audio','audio',true)
on conflict (id) do update set public = true;

-- 2) Ghi/sửa/xoá chỉ cho authenticated; đọc thì public nên không cần policy select
drop policy if exists "audio_write" on storage.objects;
create policy "audio_write" on storage.objects for all to authenticated
  using (bucket_id = 'audio') with check (bucket_id = 'audio');

-- 3) SỬA DỮ LIỆU SAI: cmn-CN-Neural2-X không tồn tại (xem §1) → đổi sang Wavenet cùng chữ cái
update settings set value = replace(value::text, 'Neural2', 'Wavenet')::jsonb
 where key = 'tts_voice' and value::text like '%cmn-CN-Neural2%';

-- 4) 2 key mới
insert into settings (key, value) values
  ('google_tts_api_key', 'null'),
  ('tts_voice_en',       '"en-US-Neural2-C"')
on conflict (key) do nothing;
```
⚠️ **Rủi ro đã lường:** `storage.objects` thuộc `supabase_storage_admin`; nếu role chạy migration không
tạo được policy, T-task sẽ báo lỗi rõ và phương án dự phòng là tạo bucket + policy trên dashboard
Supabase (thao tác 1 lần, tôi sẽ hướng dẫn chứ không tự ý bỏ qua).

### 3.2 `src/lib/ttsCore.ts` — thuần, có test
```ts
export const GIONG_ZH = ['cmn-CN-Wavenet-A','cmn-CN-Wavenet-B','cmn-CN-Wavenet-C','cmn-CN-Wavenet-D']
export const GIONG_EN = ['en-US-Neural2-C','en-US-Neural2-F','en-US-Neural2-D','en-US-Neural2-J']

export function giongCua(lang, cd): { voice: string; languageCode: 'cmn-CN' | 'en-US' }
export function bamChuoi(s: string): string          // FNV-1a → 8 ký tự hex (thuần, không cần crypto async)
export function duongDanAudio(word, lang, voice): string   // `${lang}/${voice}/${bamChuoi(...)}.mp3`
export function bodyTTS(text, voice, languageCode): string  // speakingRate 0.9 như phatAm()
export function docKetQuaTTS(json): { base64: string } | { loi: string }
export function base64ThanhBytes(b64: string): Uint8Array
export function gomTuCanGen(rows, cd): { word, lang, ids: string[], duong_dan, voice }[]  // gộp trùng
```
`gomTuCanGen` là chỗ tiết kiệm tiền: gộp các dòng `vocab` cùng `(word, lang)` ⇒ gọi API 1 lần rồi ghi
`audio_url` cho **tất cả** id trong nhóm.

### 3.3 `src/lib/tts.ts` — I/O (giữ nguyên `phatAm`, thêm 3 hàm)
```ts
export async function layCauHinhTTS(): Promise<{ khoa: string; cd: CaiDat } | null>  // đọc bảng settings
export async function nghegiongThu(voice, languageCode, khoa): Promise<void>         // gọi Google → Audio(blob URL)
export async function genAudioChoTu(
  onTienDo: (xong: number, tong: number, loi: string[]) => void,
): Promise<{ xong: number; tong: number; loi: string[] }>
```
`genAudioChoTu` chạy **tuần tự** (không bắn song song để tránh chạm rate-limit và để tiến độ dễ đọc):
`vocab` (audio_url null) → `gomTuCanGen` → mỗi nhóm: gọi Google → `storage.upload(path, blob,
{ contentType: 'audio/mpeg', upsert: true })` → `getPublicUrl` → `update vocab set audio_url` cho cả nhóm.
Lỗi 1 từ **không dừng cả mẻ** — gom vào `loi[]` và báo cuối.

### 3.4 `settings.ts` — mở rộng
`CaiDat` thêm `google_tts_api_key: string | null` và `tts_voice_en: string`; `MAC_DINH.tts_voice`
đổi thành `cmn-CN-Wavenet-A`; `GIONG_TTS` tách thành `GIONG_ZH`/`GIONG_EN` (chuyển sang `ttsCore.ts`,
`settings.ts` chỉ giữ phần cấu hình).

### 3.5 UI
- **Cài đặt** (nhóm "AI & OpenRouter" giữ nguyên, nhóm "Học tập" mở rộng): hàng khoá Google TTS
  (che dạng `••••`, nút Lưu tường minh như MB-23/Q3) · 2 hàng giọng, mỗi hàng `select` + nút loa
  (dùng icon `loa` sẵn có) · 1 hàng nút "Tạo audio còn thiếu (N từ)" + thanh tiến độ chữ.
- **Import**: sau `ket_qua_ok`, tự gọi `genAudioChoTu` và hiện thêm dòng "Đang tạo audio… x/y" trong
  chính thẻ kết quả; xong thì đổi thành "Đã tạo audio cho N từ". Không chặn nút điều hướng.

---

## 4. Kế hoạch — 14 task (2–5 phút/task)

**Hạ tầng**
| # | Task |
|---|---|
| T1 | Viết `0009_tts_storage.sql`, chạy `npm run db:migrate`, **kiểm thật**: bucket `audio` tồn tại & `public=true`; `settings.tts_voice` đã thành `cmn-CN-Wavenet-C`; có 2 key mới |

**Thuần (RED → GREEN → REFACTOR)**
| # | Task | Ca kiểm |
|---|---|---|
| T2 | RED `ttsCore.test.ts` — `giongCua` · `bamChuoi` · `duongDanAudio` | zh→`tts_voice`+`cmn-CN`; en→`tts_voice_en`+`en-US`; cùng (word,lang,voice) ⇒ **cùng đường dẫn**, đổi giọng ⇒ đường dẫn khác |
| T3 | GREEN 3 hàm trên | |
| T4 | RED — `bodyTTS` · `docKetQuaTTS` · `base64ThanhBytes` | body đúng schema Google (`speakingRate 0.9`); JSON lỗi → `{loi}`; base64 → đúng số byte |
| T5 | GREEN | |
| T6 | RED + GREEN `gomTuCanGen` | **2 dòng "晴天" gộp 1 nhóm 2 id** (dữ liệu thật); bỏ từ đã có `audio_url`; nhóm theo cả `lang` |
| T7 | X-test: `ttsCore.ts` không import react/supabase/node |

**I/O + UI**
| # | Task |
|---|---|
| T8 | `settings.ts`: `CaiDat` +2 trường, `MAC_DINH` sửa giọng, cập nhật `docCaiDat` + test cũ |
| T9 | `tts.ts`: `layCauHinhTTS` · `nghegiongThu` · `genAudioChoTu` (tuần tự, gom lỗi) |
| T10 | `CaiDatPage`: hàng khoá Google TTS + 2 hàng giọng có nút nghe thử |
| T11 | `CaiDatPage`: nút "Tạo audio còn thiếu (N từ)" + dòng tiến độ + báo lỗi từng từ |
| T12 | `ImportPage`: tự gen sau `ket_qua_ok` + dòng tiến độ trong thẻ kết quả |

**Kiểm & dọn**
| # | Task |
|---|---|
| T13 | build · lint · test (195 + ~18) · **CDP thật**: bấm "Tạo audio còn thiếu" → đếm **9 dòng `vocab` có `audio_url`** nhưng **chỉ 8 lời gọi Google** (2 từ "晴天" dùng chung) · tải thử 1 URL công khai trả `audio/mpeg` · vào Player dạng `listen_fill`/`audio_recognition` xác nhận phát file mp3 (không rơi về Web Speech) · nghe thử giọng gọi đúng voice đang chọn · chụp màn Cài đặt PC/Mobile light+dark |
| T14 | Sửa `SPECIFICATION.md` §9/§11 (+ §2 dòng 20–21 bảng công nghệ) cho khớp thực tế · dọn process · memory-bank (MB-25) · soát checklist §5 |

---

## 5. Checklist tự soát ở Bước 4
- [ ] `GOOGLE_TTS_API_KEY` **không** xuất hiện dưới dạng `VITE_*` ở bất kỳ đâu; khoá chỉ đọc từ bảng
      `settings` lúc chạy (grep `dist/` để chắc chắn không lọt vào bundle).
- [ ] Không còn chuỗi `cmn-CN-Neural2` trong code, DB, lẫn `SPECIFICATION.md`.
- [ ] Gọi API đúng **1 lần / (word, lang, voice)** — 2 dòng "晴天" dùng chung file.
- [ ] Lỗi 1 từ không làm hỏng cả mẻ; báo rõ từ nào lỗi.
- [ ] `audio_url` ghi xong thì Player phát **mp3**, và `phatAm()` vẫn rơi về Web Speech khi thiếu.
- [ ] Bucket công khai đọc; ghi chỉ `authenticated` (kiểm bằng request không token phải bị từ chối).
- [ ] Không hex trong component; hàng mới ở Cài đặt dùng đúng pattern `HANG`/`NHAN`/`GIA_TRI` sẵn có.

---

## 6. PLAN chi tiết — code cụ thể từng task

### T1 · `supabase/migrations/0009_tts_storage.sql`
Nội dung như §3.1. Sau khi chạy `npm run db:migrate`, kiểm bằng script:
`storage/v1/bucket` phải có `audio` (`public: true`) · `settings?key=eq.tts_voice` phải là
`"cmn-CN-Wavenet-C"` · có `google_tts_api_key` + `tts_voice_en`.

### T2–T3 · `ttsCore.ts` — giọng · hash · đường dẫn
```ts
export const GIONG_ZH = ['cmn-CN-Wavenet-A', 'cmn-CN-Wavenet-B', 'cmn-CN-Wavenet-C', 'cmn-CN-Wavenet-D'] as const
export const GIONG_EN = ['en-US-Neural2-C', 'en-US-Neural2-F', 'en-US-Neural2-D', 'en-US-Neural2-J'] as const
export const NHAN_GIONG: Record<string, string> = { /* 'cmn-CN-Wavenet-A': 'Wavenet-A (nữ)' … */ }

export function giongCua(lang: 'zh' | 'en', cd: { tts_voice: string; tts_voice_en: string }) {
  return lang === 'zh'
    ? { voice: cd.tts_voice, languageCode: 'cmn-CN' as const }
    : { voice: cd.tts_voice_en, languageCode: 'en-US' as const }
}

/** FNV-1a 32-bit → 8 ký tự hex. Thuần + đồng bộ (Web Crypto là async, không dùng). */
export function bamChuoi(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}

export function duongDanAudio(word: string, lang: 'zh' | 'en', voice: string): string {
  return `${lang}/${voice}/${bamChuoi(`${word}\u0000${lang}\u0000${voice}`)}.mp3`
}
```
Ca kiểm: cùng bộ 3 ⇒ cùng đường dẫn · đổi giọng ⇒ khác · `giongCua` map đúng languageCode.

### T4–T5 · `ttsCore.ts` — body · đọc kết quả · base64
```ts
export function bodyTTS(text: string, voice: string, languageCode: string): string {
  return JSON.stringify({
    input: { text },
    voice: { languageCode, name: voice },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9 },  // 0.9 trùng tốc độ của phatAm()
  })
}

export function docKetQuaTTS(json: unknown): { base64: string } | { loi: string } {
  const o = json as { audioContent?: unknown; error?: { message?: unknown } }
  if (typeof o?.audioContent === 'string' && o.audioContent !== '') return { base64: o.audioContent }
  const m = o?.error?.message
  return { loi: typeof m === 'string' ? m : 'Google TTS trả dữ liệu lạ' }
}

export function base64ThanhBytes(b64: string): Uint8Array {
  const s = atob(b64)
  const u = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i)
  return u
}
```

### T6 · `gomTuCanGen` — chỗ tiết kiệm lời gọi API
```ts
export type DongVocab = { id: string; word: string; lang: 'zh' | 'en'; audio_url: string | null }
export type NhomGen = { word: string; lang: 'zh' | 'en'; voice: string; duong_dan: string; ids: string[] }

export function gomTuCanGen(rows: readonly DongVocab[], cd: {...}): NhomGen[] {
  const m = new Map<string, NhomGen>()
  for (const r of rows) {
    if (r.audio_url) continue
    const { voice } = giongCua(r.lang, cd)
    const khoa = `${r.word}\u0000${r.lang}`
    const cu = m.get(khoa)
    if (cu) cu.ids.push(r.id)
    else m.set(khoa, { word: r.word, lang: r.lang, voice, duong_dan: duongDanAudio(r.word, r.lang, voice), ids: [r.id] })
  }
  return [...m.values()]
}
```
Ca kiểm với **dữ liệu thật**: 9 dòng (2 dòng "晴天") ⇒ **8 nhóm**, nhóm "晴天" có **2 id**.

### T8 · `settings.ts`
`CaiDat` thêm `google_tts_api_key: string | null`, `tts_voice_en: string`; `MAC_DINH.tts_voice =
'cmn-CN-Wavenet-A'`, `tts_voice_en = 'en-US-Neural2-C'`; `docCaiDat` đọc 2 key mới; **xoá `GIONG_TTS`**
(thay bằng `GIONG_ZH`/`GIONG_EN` ở `ttsCore.ts`), sửa test cũ đang khẳng định `cmn-CN-Neural2-A`.

### T9 · `tts.ts`
```ts
const URL_TTS = 'https://texttospeech.googleapis.com/v1/text:synthesize'

export async function layCauHinhTTS(): Promise<{ khoa: string; cd: CaiDat } | null> {
  const { data } = await supabase.from('settings').select('key, value')
  const cd = docCaiDat((data ?? []) as { key: string; value: unknown }[])
  return cd.google_tts_api_key ? { khoa: cd.google_tts_api_key, cd } : null
}

async function goiGoogle(text, voice, languageCode, khoa): Promise<Uint8Array> {
  const r = await fetch(`${URL_TTS}?key=${encodeURIComponent(khoa)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: bodyTTS(text, voice, languageCode),
  })
  const kq = docKetQuaTTS(await r.json())
  if ('loi' in kq) throw new Error(kq.loi)
  return base64ThanhBytes(kq.base64)
}

export async function nghegiongThu(voice, languageCode, khoa) {
  const bytes = await goiGoogle(languageCode === 'cmn-CN' ? '你好，这是试听。' : 'Hello, this is a preview.', voice, languageCode, khoa)
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }))
  dangPhat?.pause(); window.speechSynthesis?.cancel()
  dangPhat = new Audio(url); await dangPhat.play()
  dangPhat.onended = () => URL.revokeObjectURL(url)
}

export async function genAudioChoTu(onTienDo?: (xong: number, tong: number) => void) {
  const c = await layCauHinhTTS()
  if (!c) return { xong: 0, tong: 0, loi: ['Chưa nhập khoá Google TTS ở màn Cài đặt'] }
  const { data } = await supabase.from('vocab').select('id, word, lang, audio_url').is('audio_url', null)
  const nhom = gomTuCanGen((data ?? []) as DongVocab[], c.cd)
  const loi: string[] = []
  let xong = 0
  for (const n of nhom) {                      // TUẦN TỰ: tránh rate-limit, tiến độ dễ đọc
    try {
      const bytes = await goiGoogle(n.word, n.voice, n.lang === 'zh' ? 'cmn-CN' : 'en-US', c.khoa)
      const up = await supabase.storage.from('audio')
        .upload(n.duong_dan, new Blob([bytes], { type: 'audio/mpeg' }), { contentType: 'audio/mpeg', upsert: true })
      if (up.error) throw up.error
      const url = supabase.storage.from('audio').getPublicUrl(n.duong_dan).data.publicUrl
      const { error } = await supabase.from('vocab').update({ audio_url: url }).in('id', n.ids)
      if (error) throw error
      xong += 1
    } catch (e) {
      loi.push(`${n.word}: ${e instanceof Error ? e.message : String(e)}`)   // 1 từ lỗi KHÔNG dừng cả mẻ
    }
    onTienDo?.(xong + loi.length, nhom.length)
  }
  return { xong, tong: nhom.length, loi }
}
```

### T10–T11 · `CaiDatPage`
- Hàng **khoá Google TTS**: `anKhoa()` + ô `type=password` + nút Lưu tường minh (pattern MB-23/Q3).
- 2 hàng giọng: `select` (nhãn `NHAN_GIONG`) + nút loa `aria-label="Nghe thử giọng Trung|Anh"`;
  bấm → `nghegiongThu`, lỗi hiện ở banner lỗi sẵn có.
- Hàng **"Tạo audio còn thiếu (N từ)"**: N đếm bằng query `vocab?audio_url=is.null`; khi chạy hiện
  `Đang tạo… x/y`, xong hiện `Đã tạo audio cho N từ` (+ danh sách từ lỗi nếu có).

### T12 · `ImportPage`
Trong nhánh `ket_qua_ok`, `useEffect` chạy 1 lần (ref guard — bài học StrictMode ở MB-20) gọi
`genAudioChoTu`, hiện thêm 1 dòng trong thẻ kết quả. Không chặn 2 nút điều hướng.

### T13–T14 · như §4.
