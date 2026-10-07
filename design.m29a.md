# M29a — Plan thi công: Deploy lên Firebase Cloud Functions

> Thiết kế: [`design.m29.md`](design.m29.md) (✅ duyệt 2026-10-07). Trạng thái Plan: **✅ DUYỆT 2026-10-07 · T1–T11 + T13 XONG cùng ngày** · T12 (nghiệm thu ở công ty) chờ người dùng.
> **Kết quả deploy:** Gen 2, Node 22. URL (a) `https://asia-southeast1-vocabloom-helios.cloudfunctions.net/vocabloom/` · URL (b) `https://vocabloom-1004632816026.asia-southeast1.run.app/vocabloom/` (Cloud Run dạng tất định, CLI không in ra). Cleanup policy Artifact Registry 1 ngày đã đặt (`--force`).
> **Phát hiện khi deploy:** (1) lần chạy CDP ĐẦU TIÊN ngay sau khi tạo function: loạt 401 trang HTML của Google ("Your client does not have permission") — không lặp lại ở 3 lần sau ⇒ quyền `allUsers` chưa kịp lan sau lần TẠO function; deploy cập nhật về sau không đổi IAM. (2) `%2e%2e` bị Google front-end chuẩn hoá + 302 trước khi tới function ⇒ L8 đi theo chuyển hướng, đích cuối 404.
> Làm thẳng trên `main`. Claude không `git add`/`commit`.
> Phiên bản đã tra npm (2026-10-07): `firebase-functions` 7.4.0 · `firebase-admin` 14.5.0 · `firebase-tools` 15.32.1. Node local là v24.15; runtime trên cloud là Node 22.

## Tổng quan 13 task

| # | Task | Ai làm | Loại |
|---|---|---|---|
| T1 | RED — test `src/lib/proxy.ts` (P1–P8) | Claude | TDD |
| T2 | GREEN — `src/lib/proxy.ts` | Claude | TDD |
| T3 | `env.d.ts` · `.env.firebase` · `vite.config.ts` · `main.tsx` | Claude | cấu hình |
| T4 | Nối `supabase.ts` · `ai.ts` · `tts.ts` vào `proxy.ts` | Claude | nối dây |
| T5 | Build 2 chế độ + **kiểm bản Vercel không đổi** | Claude | kiểm chứng |
| T6 | RED — `functions/package.json` + `proxyCore.test.js` (F1–F9) | Claude | TDD |
| T7 | GREEN — `functions/proxyCore.js` | Claude | TDD |
| T8 | `functions/index.js` · `firebase.json` · `.firebaserc` · `.env.vocabloom-helios` · `.gitignore` · script npm | Claude | khung |
| T9 | Chạy local bằng harness Express + CDP (đường dẫn kiểu a và b) | Claude | kiểm chứng |
| T10 | **Nâng Blaze · ngân sách · cài CLI · `firebase login`** | **Người dùng** | thủ công |
| T11 | Deploy + CDP trên URL thật (a) và (b) | Claude | deploy |
| T12 | **Kiểm từ mạng công ty** | **Người dùng** | nghiệm thu |
| T13 | `readme.md` (mục Deploy) · memory-bank · dọn tiến trình | Claude | tài liệu |

---

## T1 — RED: `src/lib/proxy.test.ts`

```ts
import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { audioQuaProxy, GOC_OPENROUTER, gocQuaProxy, urlClientSupabase, urlCongKhai } from './proxy.ts'

const SB = 'https://abc.supabase.co'
const MP3 = `${SB}/storage/v1/object/public/audio/zh/cmn-CN-Wavenet-A/k3j9.mp3`

describe('proxy.ts — M29 (design.m29.md §2.2)', () => {
  it('P1 bản Vercel (proxy rỗng) ⇒ gốc API giữ nguyên', () => {
    expect(gocQuaProxy('', 'or', GOC_OPENROUTER)).toBe('https://openrouter.ai/api/v1')
  })
  it('P2 bản Firebase ⇒ gốc API là đường dẫn cùng origin', () => {
    expect(gocQuaProxy('/vocabloom', 'or', GOC_OPENROUTER)).toBe('/vocabloom/or')
    expect(gocQuaProxy('/vocabloom', 'tts', 'x')).toBe('/vocabloom/tts')
  })
  it('P3 client Supabase bản Vercel dùng URL thật', () => {
    expect(urlClientSupabase('', 'https://h.example', SB)).toBe(SB)
  })
  it('P4 client Supabase bản Firebase là URL tuyệt đối tới /vocabloom/sb (supabase-js cần URL tuyệt đối)', () => {
    expect(urlClientSupabase('/vocabloom', 'https://h.example', SB)).toBe('https://h.example/vocabloom/sb')
  })
  it('P5 phát mp3 bản Vercel ⇒ URL nguyên vẹn', () => {
    expect(audioQuaProxy(MP3, '', SB)).toBe(MP3)
  })
  it('P6 phát mp3 bản Firebase ⇒ đổi gốc supabase.co sang /vocabloom/sb', () => {
    expect(audioQuaProxy(MP3, '/vocabloom', SB)).toBe('/vocabloom/sb/storage/v1/object/public/audio/zh/cmn-CN-Wavenet-A/k3j9.mp3')
    expect(audioQuaProxy(MP3, '/vocabloom', `${SB}/`)).toBe('/vocabloom/sb/storage/v1/object/public/audio/zh/cmn-CN-Wavenet-A/k3j9.mp3')
  })
  it('P7 URL không thuộc Supabase của app ⇒ không đụng', () => {
    const la = 'https://khac.supabase.co/storage/v1/object/public/audio/a.mp3'
    expect(audioQuaProxy(la, '/vocabloom', SB)).toBe(la)
    expect(audioQuaProxy(`${SB}x/a.mp3`, '/vocabloom', SB)).toBe(`${SB}x/a.mp3`)
  })
  it('P8 urlCongKhai khớp đúng getPublicUrl của supabase-js (DB luôn lưu URL GỐC)', () => {
    const that = createClient(SB, 'k', { auth: { persistSession: false } })
      .storage.from('audio').getPublicUrl('zh/cmn-CN-Wavenet-A/k3j9.mp3').data.publicUrl
    expect(urlCongKhai(SB, 'audio', 'zh/cmn-CN-Wavenet-A/k3j9.mp3')).toBe(that)
  })
})
```

Chạy `npx vitest run src/lib/proxy.test.ts`. **Kỳ vọng ĐỎ** vì chưa có module `./proxy.ts`.

## T2 — GREEN: `src/lib/proxy.ts`

```ts
/**
 * M29 — đổi URL khi app chạy sau Cloud Function `vocabloom` (build `--mode firebase`, design.m29.md §2.2).
 * `proxy` RỖNG (bản Vercel) ⇒ mọi hàm trả NGUYÊN URL gốc — bản Vercel không đổi hành vi.
 * File thuần, không đọc `import.meta.env`: nơi gọi tự truyền vào cho dễ test.
 */
export const GOC_OPENROUTER = 'https://openrouter.ai/api/v1'
export const GOC_TTS = 'https://texttospeech.googleapis.com'

const boCheo = (s: string) => s.replace(/\/+$/, '')

/** Gốc API: Vercel ⇒ `goc`; Firebase ⇒ `/vocabloom/<nhanh>` (cùng origin, không CORS). */
export function gocQuaProxy(proxy: string, nhanh: 'or' | 'tts', goc: string): string {
  return proxy ? `${proxy}/${nhanh}` : goc
}

/** supabase-js đòi URL tuyệt đối (`new URL`) ⇒ ghép với origin trang đang mở. */
export function urlClientSupabase(proxy: string, origin: string, supabaseUrl: string): string {
  return proxy ? `${origin}${proxy}/sb` : supabaseUrl
}

/** `audio_url` trong DB là URL supabase.co GỐC — chỉ đổi lúc PHÁT. */
export function audioQuaProxy(url: string, proxy: string, supabaseUrl: string): string {
  const goc = boCheo(supabaseUrl)
  return proxy && url.startsWith(`${goc}/`) ? `${proxy}/sb${url.slice(goc.length)}` : url
}

/** URL công khai trên Storage, ghép từ URL GỐC: client bản Firebase trỏ vào proxy nên không dùng `getPublicUrl`. */
export function urlCongKhai(supabaseUrl: string, bucket: string, duongDan: string): string {
  return `${boCheo(supabaseUrl)}/storage/v1/object/public/${bucket}/${duongDan}`
}
```

Chạy lại test: **8/8 XANH**. Sau đó chạy `npm test` toàn bộ.

## T3 — Cấu hình build

**`src/env.d.ts`**: thêm vào `ImportMetaEnv`, ngay sau `VITE_SUPABASE_ANON_KEY`:
```ts
  /** M29 — chỉ có ở `.env.firebase` (`/vocabloom`). Rỗng ⇒ bản Vercel, mọi URL giữ nguyên. Không bí mật. */
  readonly VITE_PROXY?: string
```

**`.env.firebase`** (file mới ở gốc; được commit vì `.gitignore` chỉ chặn đúng `.env` và `.env.local`):
```
# M29 — chỉ nạp khi `vite build --mode firebase` (design.m29.md). KHÔNG bí mật.
# URL/anon key Supabase vẫn lấy từ .env.local như mọi chế độ khác.
VITE_PROXY=/vocabloom
```

**`vite.config.ts`**: thay toàn bộ phần `export default` (file chỉ 12 dòng):
```ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // M29: VITE_PROXY chỉ có ở `.env.firebase` ⇒ bản Vercel vẫn base `/` + outDir `dist/` (design.m29.md §4)
  const proxy = loadEnv(mode, process.cwd(), 'VITE_')['VITE_PROXY'] ?? ''
  return {
    base: proxy ? `${proxy}/` : '/',
    build: { outDir: proxy ? 'functions/web' : 'dist' },
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }
})
```

**`src/main.tsx`**:
```tsx
    <BrowserRouter basename={import.meta.env.BASE_URL}>
```
Ghi chú: `BASE_URL` là `/` ở bản Vercel (giống mặc định) và `/vocabloom/` ở bản Firebase. react-router tự xử lý dấu `/` cuối.

## T4 — Nối dây 3 file I/O

**`src/lib/supabase.ts`**:
```ts
import { urlClientSupabase } from './proxy.ts'
// ...
// M29: bản Firebase trỏ client vào proxy cùng origin; `globalThis.location` vắng khi file bị import trong test Node.
export const supabase = createClient(
  urlClientSupabase(import.meta.env.VITE_PROXY ?? '', globalThis.location?.origin ?? '', url),
  anonKey,
)
```

**`src/lib/ai.ts`**: dòng 19.
```ts
import { GOC_OPENROUTER, gocQuaProxy } from './proxy.ts'
const URL_AI = `${gocQuaProxy(import.meta.env.VITE_PROXY ?? '', 'or', GOC_OPENROUTER)}/chat/completions`
```

**`src/lib/tts.ts`**: 3 chỗ.
```ts
import { audioQuaProxy, GOC_TTS, gocQuaProxy, urlCongKhai } from './proxy.ts'
const PROXY = import.meta.env.VITE_PROXY ?? ''
// phatAm():
    dangPhat = new Audio(audioQuaProxy(audio_url, PROXY, import.meta.env.VITE_SUPABASE_URL))
// hằng URL_TTS:
const URL_TTS = `${gocQuaProxy(PROXY, 'tts', GOC_TTS)}/v1/text:synthesize`
// genAudioChoTu(): thay dòng getPublicUrl
      const url = urlCongKhai(import.meta.env.VITE_SUPABASE_URL, BUCKET, n.duong_dan)
```

Chạy `npm test`, `npx tsc -b`, `npm run lint`.

## T5 — Kiểm bản Vercel KHÔNG đổi

```bash
npm run build                                   # bản Vercel → dist/
grep -l "/vocabloom" dist -r || echo "OK: dist không có /vocabloom"
grep -c "openrouter.ai/api/v1" dist/assets/*.js # phải ≥ 1
grep -o 'href="/favicon.svg"' dist/index.html   # base vẫn là /
npx vite build --mode firebase                  # bản Firebase → functions/web/
grep -o 'src="/vocabloom/assets/[^"]*"' functions/web/index.html   # base đúng
grep -o 'href="/vocabloom/favicon.svg"' functions/web/index.html   # Vite tự gắn base cho favicon
```

Nếu favicon trong bản Firebase không được gắn `/vocabloom/` thì sửa `index.html` thành `href="%BASE_URL%favicon.svg"` (Vite tự thay `%BASE_URL%`) và chạy lại.

## T6 — RED: `functions/`

**`functions/package.json`**:
```json
{
  "name": "vocabloom-functions",
  "private": true,
  "type": "module",
  "main": "index.js",
  "engines": { "node": "22" },
  "scripts": { "test": "node --test" },
  "dependencies": {
    "firebase-admin": "^14.5.0",
    "firebase-functions": "^7.4.0"
  }
}
```

**`functions/proxyCore.test.js`**:
```js
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { boTienTo, cacheTinh, headerGui, headerTra, phanLoai } from './proxyCore.js'

const SB = 'https://abc.supabase.co'

test('F1 bỏ tiền tố /vocabloom ⇒ cùng bản build chạy ở cả URL (a) và (b)', () => {
  assert.equal(boTienTo('/vocabloom/sb/rest/v1/x?a=1'), '/sb/rest/v1/x?a=1')
  assert.equal(boTienTo('/vocabloom'), '/')
  assert.equal(boTienTo('/vocabloom?x=1'), '/?x=1')
  assert.equal(boTienTo('/assets/a.js'), '/assets/a.js')
  assert.equal(boTienTo('/vocabloomx/a'), '/vocabloomx/a')
})

test('F2 /sb/* → Supabase, giữ nguyên query', () => {
  assert.deepEqual(phanLoai('/sb/rest/v1/vocab?select=id&lang=eq.zh', SB), {
    loai: 'proxy', dich: `${SB}/rest/v1/vocab?select=id&lang=eq.zh`,
  })
  assert.deepEqual(phanLoai('/sb/rest/v1/x', `${SB}/`), { loai: 'proxy', dich: `${SB}/rest/v1/x` })
})

test('F3 /or/* → OpenRouter, /tts/* → Google TTS', () => {
  assert.equal(phanLoai('/or/chat/completions', SB).dich, 'https://openrouter.ai/api/v1/chat/completions')
  assert.equal(phanLoai('/tts/v1/text:synthesize?key=K', SB).dich, 'https://texttospeech.googleapis.com/v1/text:synthesize?key=K')
})

test('F4 mọi đường khác là file tĩnh (không phải proxy mở)', () => {
  assert.deepEqual(phanLoai('/', SB), { loai: 'tinh', file: 'index.html' })
  assert.deepEqual(phanLoai('/tu-vung', SB), { loai: 'tinh', file: 'tu-vung' })
  assert.deepEqual(phanLoai('/assets/a.js?v=1', SB), { loai: 'tinh', file: 'assets/a.js' })
  assert.deepEqual(phanLoai('/sbx/a', SB), { loai: 'tinh', file: 'sbx/a' })
  assert.deepEqual(phanLoai('/https://evil.com', SB), { loai: 'tinh', file: 'https://evil.com' })
})

test('F5 chặn thoát khỏi web/ và đường dẫn hỏng', () => {
  for (const u of ['/../index.js', '/%2e%2e/index.js', '/a/%2E%2E/b', '/assets/../../x', '/%E0%A4%A'])
    assert.deepEqual(phanLoai(u, SB), { loai: 'khong' }, u)
})

test('F6 thiếu SUPABASE_URL ⇒ báo thiếu cấu hình, không chuyển tiếp vào hư không', () => {
  assert.deepEqual(phanLoai('/sb/rest/v1/x', ''), { loai: 'thieu_cau_hinh' })
})

test('F7 header gửi đi: giữ header API, bỏ hop-by-hop/cookie/nén/dấu vết hạ tầng', () => {
  const ra = headerGui({
    host: 'x.cloudfunctions.net', connection: 'keep-alive', 'content-length': '12', 'accept-encoding': 'br',
    cookie: 'a=1', forwarded: 'for=1', 'x-forwarded-for': '1.2.3.4', 'x-cloud-trace-context': 't', traceparent: 'p',
    authorization: 'Bearer T', apikey: 'K', prefer: 'count=exact', range: '0-9', 'content-type': 'application/json',
    'x-client-info': 'supabase-js', 'x-upsert': 'true', 'x-supabase-api-version': '2024-01-01', accept: ['a', 'b'],
  })
  assert.deepEqual(ra, {
    authorization: 'Bearer T', apikey: 'K', prefer: 'count=exact', range: '0-9', 'content-type': 'application/json',
    'x-client-info': 'supabase-js', 'x-upsert': 'true', 'x-supabase-api-version': '2024-01-01', accept: 'a, b',
  })
})

test('F8 header trả về: bỏ content-encoding/length (fetch Node đã tự giải nén), giữ content-range', () => {
  const ra = headerTra(new Headers({
    'content-encoding': 'gzip', 'content-length': '10', 'transfer-encoding': 'chunked', 'set-cookie': '__cf_bm=1',
    'alt-svc': 'h3=":443"', nel: '{}', 'report-to': '{}',
    'content-type': 'application/json', 'content-range': '0-9/740', etag: 'W/"1"', 'cache-control': 'max-age=3600',
  }))
  assert.deepEqual(ra, {
    'content-type': 'application/json', 'content-range': '0-9/740', etag: 'W/"1"', 'cache-control': 'max-age=3600',
  })
})

test('F9 cache tĩnh: assets có hash ⇒ 1 năm immutable; còn lại ⇒ no-cache', () => {
  assert.equal(cacheTinh('assets/index-Ab12.js'), 'public, max-age=31536000, immutable')
  assert.equal(cacheTinh('index.html'), 'no-cache')
  assert.equal(cacheTinh('favicon.svg'), 'no-cache')
})
```

Chạy `cd functions && npm install && npm test`. **Kỳ vọng ĐỎ** vì chưa có `proxyCore.js`.

## T7 — GREEN: `functions/proxyCore.js`

```js
// M29 — phần THUẦN của Cloud Function `vocabloom` (design.m29.md §2.3). Không I/O ⇒ test bằng node:test.

/** Chỉ 3 gốc này được chuyển tiếp — function KHÔNG phải proxy mở. */
const GOC_CO_DINH = { or: 'https://openrouter.ai/api/v1', tts: 'https://texttospeech.googleapis.com' }

/** Bỏ tiền tố `/vocabloom` nếu có ⇒ chạy được ở cả cloudfunctions.net/vocabloom/ lẫn run.app/vocabloom/ (§2.1). */
export function boTienTo(url) {
  const r = url.replace(/^\/vocabloom(?=[/?]|$)/, '')
  return r.startsWith('/') ? r : `/${r}`
}

/** @returns {{loai:'proxy',dich:string}|{loai:'tinh',file:string}|{loai:'khong'}|{loai:'thieu_cau_hinh'}} */
export function phanLoai(url, gocSupabase) {
  const m = /^\/(sb|or|tts)(?=[/?]|$)(.*)$/.exec(url)
  if (m) {
    const goc = m[1] === 'sb' ? gocSupabase.replace(/\/+$/, '') : GOC_CO_DINH[m[1]]
    return goc ? { loai: 'proxy', dich: goc + m[2] } : { loai: 'thieu_cau_hinh' }
  }
  let duong
  try {
    duong = decodeURIComponent(url.split('?')[0])
  } catch {
    return { loai: 'khong' }
  }
  if (duong.split('/').includes('..')) return { loai: 'khong' }
  return { loai: 'tinh', file: duong === '/' ? 'index.html' : duong.slice(1) }
}

const BO_GUI = new Set([
  'host', 'connection', 'keep-alive', 'content-length', 'transfer-encoding', 'te', 'trailer', 'upgrade',
  'proxy-authorization', 'proxy-connection', 'accept-encoding', 'cookie', 'forwarded', 'traceparent',
])
const BO_TIEN_TO_GUI = ['x-forwarded-', 'x-cloud-', 'x-appengine-', 'function-']

/** Header từ trình duyệt → máy đích. `accept-encoding` bỏ để fetch Node tự thương lượng nén. */
export function headerGui(h) {
  const ra = {}
  for (const [k, v] of Object.entries(h)) {
    const t = k.toLowerCase()
    if (v === undefined || BO_GUI.has(t) || BO_TIEN_TO_GUI.some((p) => t.startsWith(p))) continue
    ra[t] = Array.isArray(v) ? v.join(', ') : v
  }
  return ra
}

const BO_TRA = new Set([
  'content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive',
  'set-cookie', 'alt-svc', 'nel', 'report-to',
])

/** Header máy đích → trình duyệt. fetch Node ĐÃ giải nén body ⇒ giữ content-encoding là trình duyệt giải nén lần 2 và hỏng. */
export function headerTra(headers) {
  const ra = {}
  for (const [k, v] of headers) if (!BO_TRA.has(k)) ra[k] = v
  return ra
}

/** File trong assets/ có hash trong tên ⇒ cache vĩnh viễn; index.html phải luôn hỏi lại để thấy bản deploy mới. */
export function cacheTinh(file) {
  return file.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
}
```

Chạy `npm test` trong `functions/`: **9/9 XANH**.

## T8 — Khung Cloud Function + cấu hình Firebase

**`functions/index.js`**:
```js
// M29 — Cloud Function `vocabloom`: phục vụ giao diện (web/) + chuyển tiếp /sb /or /tts (design.m29.md §2).
// Function KHÔNG giữ khoá bí mật nào — khoá AI/TTS do trình duyệt gửi kèm như khi chạy trên Vercel.
import { statSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { onRequest } from 'firebase-functions/v2/https'
import { boTienTo, cacheTinh, headerGui, headerTra, phanLoai } from './proxyCore.js'

const WEB = resolve(fileURLToPath(new URL('./web', import.meta.url)))
// Nạp từ functions/.env.vocabloom-helios lúc deploy (không bí mật — URL này vốn đã nằm trong bundle).
const GOC_SUPABASE = process.env.SUPABASE_URL ?? ''

/** Tách riêng khỏi `onRequest` để harness local (T9) gọi thẳng được. */
export async function xuLy(req, res) {
  const p = phanLoai(boTienTo(req.url), GOC_SUPABASE)
  if (p.loai === 'proxy') return chuyenTiep(req, res, p.dich)
  if (p.loai === 'thieu_cau_hinh') return res.status(500).json({ message: 'Function thiếu SUPABASE_URL (.env.vocabloom-helios)' })
  if (p.loai === 'khong') return res.status(404).end()
  return traTinh(res, p.file)
}

async function chuyenTiep(req, res, dich) {
  try {
    const coBody = req.method !== 'GET' && req.method !== 'HEAD'
    const r = await fetch(dich, {
      method: req.method,
      headers: headerGui(req.headers),
      body: coBody ? req.rawBody : undefined,
      redirect: 'manual',
    })
    res.status(r.status)
    for (const [k, v] of Object.entries(headerTra(r.headers))) res.setHeader(k, v)
    res.end(Buffer.from(await r.arrayBuffer()))
  } catch (e) {
    res.status(502).json({ message: `Proxy không tới được máy đích: ${e instanceof Error ? e.message : e}` })
  }
}

function traTinh(res, file) {
  const duong = resolve(WEB, file)
  if (!duong.startsWith(WEB + sep)) return res.status(404).end()
  if (statSync(duong, { throwIfNoEntry: false })?.isFile()) {
    res.setHeader('Cache-Control', cacheTinh(file))
    return res.sendFile(duong)
  }
  // Thiếu file JS/CSS/ảnh ⇒ 404 thật (trả HTML thay sẽ ra lỗi MIME khó hiểu); đường của router ⇒ index.html (SPA)
  if (extname(file)) return res.status(404).end()
  res.setHeader('Cache-Control', 'no-cache')
  return res.sendFile(join(WEB, 'index.html'))
}

export const vocabloom = onRequest(
  { region: 'asia-southeast1', memory: '256MiB', timeoutSeconds: 120, maxInstances: 2, concurrency: 80, invoker: 'public' },
  xuLy,
)
```

**`functions/.env.vocabloom-helios`**: lấy `<ref>` từ `VITE_SUPABASE_URL` trong `.env.local`. Tên file không bị `.gitignore` chặn nên được commit, và Firebase tự nạp file này theo project ID.
```
# M29 — URL gốc Supabase cho Cloud Function `vocabloom`. KHÔNG bí mật.
SUPABASE_URL=https://<ref>.supabase.co
```

**`firebase.json`** (gốc dự án):
```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log", "*.local", "*.test.js"]
    }
  ]
}
```

**`.firebaserc`**:
```json
{ "projects": { "default": "vocabloom-helios" } }
```

**`.gitignore`**: thêm vào cuối khối "Dependency & build output".
```
functions/web/
.firebase/
```

**`package.json`** gốc: thêm 3 script.
```json
    "build:firebase": "tsc -b && vite build --mode firebase",
    "test:functions": "npm --prefix functions test",
    "deploy:firebase": "npm run build:firebase && firebase deploy --only functions:vocabloom",
```

Kiểm: `npm run build:firebase` · `npm run test:functions` · `npm run lint`. Nếu oxlint báo `functions/` thì xem lại cấu hình, không tắt luật bừa.

## T9 — Chạy local + CDP (trước khi đụng tới cloud)

Không dùng Firebase Emulator. Emulator đặt function dưới `/vocabloom-helios/asia-southeast1/vocabloom/`, còn asset lại tham chiếu `/vocabloom/assets/...`, nên đường dẫn lệch so với URL thật.

Thay vào đó dùng harness ở scratchpad (không commit), dùng `express` đã có sẵn trong `functions/node_modules`:
```js
// chay-local.mjs — mô phỏng 2 dạng URL thật
import express from '<gốc>/functions/node_modules/express/index.js'
process.env.SUPABASE_URL = '<đọc từ functions/.env.vocabloom-helios>'
const { xuLy } = await import('<gốc>/functions/index.js')
const raw = [express.raw({ type: () => true, limit: '20mb' }), (req, _res, next) => { req.rawBody = req.body; next() }]
const a = express(); a.use('/vocabloom', ...raw, xuLy); a.listen(8081)  // (a) Google cắt tên function khỏi path
const b = express(); b.use(...raw, xuLy); b.listen(8082)                // (b) run.app — function tự bỏ tiền tố
```

Script CDP (Chrome headless, cổng 9333, mẫu cũ ở scratchpad) chạy trên `http://localhost:8081/vocabloom/` và `http://localhost:8082/vocabloom/`:

| # | Ca kiểm | Đạt khi |
|---|---|---|
| L1 | Mở trang | Màn Đăng nhập hiện, CSS/JS tải 200 |
| L2 | Đăng nhập bằng `EMAIL`/`PASSWORD` trong `.env.local` | Vào Dashboard, số "đến hạn" khớp DB |
| L3 | F5 tại `/vocabloom/tu-vung` | Vẫn ra màn Từ vựng (SPA fallback) |
| L4 | Đếm có `count` (`head: true`) | Số từ thiếu audio ở màn Cài đặt khớp DB (kiểm `content-range`) |
| L5 | Phát âm 1 từ có `audio_url` | `<audio>.src` chứa `/vocabloom/sb/storage/`, tải 200 `audio/mpeg` |
| L6 | AI: trong trang, gọi `/vocabloom/or/chat/completions` với khoá trong `settings`, prompt "ping", `max_tokens: 5` | 200 + có `choices` |
| L7 | Bộ đếm request (CDP `Network`) | **0 request** tới `supabase.co` / `openrouter.ai` / `texttospeech` từ trình duyệt |
| L8 | `/vocabloom/assets/khong-co.js` và `/vocabloom/%2e%2e/index.js` | Cả hai 404 |

Chỉ đọc, ngoại trừ L2 (tạo phiên đăng nhập). Không ghi dữ liệu học.

## T10 — Người dùng tự làm (hướng dẫn từng bước)

**A. Nâng gói Blaze** (Cloud Functions bắt buộc)
1. Mở https://console.firebase.google.com → chọn project **vocabloom-helios**.
2. Góc trái dưới, nút gói hiện tại (**Spark**) → **Upgrade** → chọn **Blaze**.
3. Chọn hoặc tạo **Cloud Billing account**, nhập thẻ Visa/Mastercard → **Purchase/Continue**.

**B. Đặt cảnh báo ngân sách** (để yên tâm; ngân sách chỉ CẢNH BÁO, không tự ngắt)
1. Mở https://console.cloud.google.com/billing → chọn billing account vừa liên kết.
2. **Budgets & alerts** → **Create budget**.
3. Scope: Projects = `vocabloom-helios` → Amount: **Specified amount = 2 USD**.
4. Ngưỡng **50% / 90% / 100%**, tích gửi email cho Billing admins → **Finish**.

Ước lượng: một người dùng khoảng vài nghìn request/tháng, so với hạn mức miễn phí 2 triệu lượt gọi, 400.000 GB-giây và 5 GB ra ngoài mỗi tháng ⇒ gần như **0 USD**. Khoản lặt vặt duy nhất là ảnh container ở Artifact Registry. Bước C.4 sẽ đặt chính sách tự xoá ảnh cũ.

**C. Cài Firebase CLI và đăng nhập** (làm ở máy nhà, cần trình duyệt)
```powershell
npm i -g firebase-tools
firebase --version          # ≥ 15.x
firebase login              # trình duyệt mở → chọn đúng tài khoản Google sở hữu project
firebase projects:list      # phải thấy vocabloom-helios
firebase functions:artifacts:setpolicy --location asia-southeast1 --days 1   # tự xoá ảnh container cũ (chạy sau lần deploy đầu nếu báo chưa có repo)
```
Xong thì báo Claude "đã login" để chuyển sang T11.

## T11 — Deploy + kiểm trên cloud (Claude chạy)

```powershell
npm run deploy:firebase
```
Lần đầu CLI có thể mất 3–5 phút để tự bật Cloud Functions / Cloud Build / Artifact Registry / Cloud Run / Eventarc API.
- Nếu CLI hỏi tương tác (bật API, cleanup policy) mà terminal của Claude không trả lời được, Claude sẽ dừng và nhờ người dùng chạy đúng lệnh đó một lần trong terminal của họ.

Sau khi deploy:
1. Lấy URL (b) từ output của CLI.
2. Chạy lại bộ CDP L1–L8 trên:
   - (a) `https://asia-southeast1-vocabloom-helios.cloudfunctions.net/vocabloom/`
   - (b) `https://vocabloom-<hash>-as.a.run.app/vocabloom/`
3. ⚠️ Rủi ro đã biết: nếu URL (a) **không** trỏ được vào function Gen 2 thì đổi sang Gen 1. Cách đổi: `import { https, region } from 'firebase-functions/v1'` → `region('asia-southeast1').runWith({ memory: '256MB', timeoutSeconds: 120, maxInstances: 2 }).https.onRequest(xuLy)`. Gen 1 chỉ có URL dạng (a). Phải xoá function Gen 2 trước khi deploy lại (`firebase functions:delete vocabloom --region asia-southeast1`).

## T12 — Người dùng nghiệm thu ở công ty

1. Mở `https://asia-southeast1-vocabloom-helios.cloudfunctions.net/vocabloom/`.
2. Đăng nhập. Domain mới nên phiên đăng nhập tách biệt với bản Vercel, chỉ cần đăng nhập 1 lần.
3. Ôn 1 lượt: nghe phát âm, bấm **Giải thích** ở 1 câu để kiểm AI.
4. Nếu có lỗi: bấm F12 → tab **Network**, chụp dòng đỏ (URL + status) gửi Claude. Hoặc thử URL (b).

**Cập nhật về sau:** mỗi khi có tính năng mới trên `main`:
- Push như cũ, Vercel tự deploy.
- Chạy thêm `npm run deploy:firebase` cho bản Firebase.
- Gỡ bản Firebase: `firebase functions:delete vocabloom --region asia-southeast1`.

## T13 — Tài liệu & dọn dẹp

- `readme.md`: thêm mục ngắn "Deploy Firebase (mạng công ty)" gồm 3 lệnh, link `design.m29a.md` T10–T12.
- `memory-bank/`:
  - `systemPatterns.md` §1: stack có thêm Cloud Function proxy, `VITE_PROXY`.
  - `decisionLog.md`: MB-51.
  - `activeContext.md` và `progress.md`: M29.
  - `DESIGN.md`: cập nhật trạng thái.
- Dừng harness `:8081/:8082` và Chrome headless `:9333`. Xoá file tạm ở scratchpad.

## Tiêu chí hoàn thành

`npm test` (kèm P1–P8) · `npm run test:functions` (F1–F9) · `npm run build` (Vercel, không chứa `/vocabloom`) · `npm run build:firebase` · lint · CDP local 2×8 · CDP cloud 2×8 (hoặc chỉ (a) nếu phải đổi sang Gen 1) · người dùng xác nhận chạy được ở công ty.
