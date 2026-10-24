// Cloud Functions đặt mtime mọi file = 1980 và index.html luôn dài bằng nhau (hash cùng độ dài) ⇒ ETag size+mtime
// không đổi qua các lần deploy ⇒ trình duyệt nhận 304 mãi, kẹt bundle cũ. Test chạy `xuLy` thật qua express.
// ĐỎ với bản cũ: ở máy local ETag size+mtime chính là ETag server phát ra ⇒ 304.
import assert from 'node:assert/strict'
import { existsSync, statSync } from 'node:fs'
import { get } from 'node:http'
import { after, before, test } from 'node:test'
import express from 'express'
import { xuLy } from './index.js'

const coBuild = existsSync(new URL('./web/index.html', import.meta.url))
let server
let goc

before(async () => {
  if (!coBuild) return
  const app = express()
  app.use(xuLy)
  await new Promise((ok) => { server = app.listen(0, ok) })
  goc = `http://127.0.0.1:${server.address().port}`
})
after(() => server?.close())

/** GET có điều kiện bằng node:http — `fetch` tự chèn `Cache-Control: no-cache` khi có If-None-Match nên không bao giờ thấy 304. */
function getCoDieuKien(duong, etag) {
  return new Promise((ok, loi) => {
    get(goc + duong, { headers: { 'if-none-match': etag } }, (r) => { r.resume(); ok(r.statusCode) }).on('error', loi)
  })
}

/** ETag kiểu size+mtime mà bản cũ phát ra — trên cloud nó trùng nhau ở MỌI lần deploy (mtime 1980, size bằng nhau). */
function etagTheoStat() {
  const st = statSync(new URL('./web/index.html', import.meta.url))
  return `W/"${st.size.toString(16)}-${st.mtime.getTime().toString(16)}"`
}

test('F10 index.html (cả đường SPA): ETag theo NỘI DUNG, không theo size+mtime ⇒ deploy mới luôn tới trình duyệt', { skip: !coBuild }, async () => {
  for (const duong of ['/', '/index.html', '/on-tap/doc-hieu']) {
    const r1 = await fetch(goc + duong)
    assert.equal(r1.status, 200, duong)
    assert.match(await r1.text(), /assets\/index-/, duong)
    assert.equal(r1.headers.get('last-modified'), null, `${duong} không được có Last-Modified (mtime 1980 vô nghĩa)`)
    // Trình duyệt kẹt cầm ETag size+mtime của bản cũ ⇒ phải nhận bản mới, không phải 304
    assert.equal(await getCoDieuKien(duong, etagTheoStat()), 200, `${duong} với ETag size+mtime phải 200`)
    // Nội dung không đổi ⇒ vẫn được 304 (khỏi tải lại vô ích)
    assert.equal(await getCoDieuKien(duong, r1.headers.get('etag')), 304, `${duong} với ETag nội dung phải 304`)
  }
})

test('F11 assets có hash vẫn giữ cache immutable', { skip: !coBuild }, async () => {
  const html = await (await fetch(`${goc}/`)).text()
  const js = /assets\/index-[^"]+\.js/.exec(html)?.[0]
  assert.ok(js)
  const r = await fetch(`${goc}/${js}`)
  assert.equal(r.status, 200)
  assert.equal(r.headers.get('cache-control'), 'public, max-age=31536000, immutable')
})
