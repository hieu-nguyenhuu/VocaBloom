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
    loai: 'proxy',
    dich: `${SB}/rest/v1/vocab?select=id&lang=eq.zh`,
  })
  assert.deepEqual(phanLoai('/sb/rest/v1/x', `${SB}/`), { loai: 'proxy', dich: `${SB}/rest/v1/x` })
})

test('F3 /or/* → OpenRouter, /tts/* → Google TTS', () => {
  assert.equal(phanLoai('/or/chat/completions', SB).dich, 'https://openrouter.ai/api/v1/chat/completions')
  assert.equal(
    phanLoai('/tts/v1/text:synthesize?key=K', SB).dich,
    'https://texttospeech.googleapis.com/v1/text:synthesize?key=K',
  )
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
  const ra = headerTra(
    new Headers({
      'content-encoding': 'gzip', 'content-length': '10', 'transfer-encoding': 'chunked', 'set-cookie': '__cf_bm=1',
      'alt-svc': 'h3=":443"', nel: '{}', 'report-to': '{}',
      'content-type': 'application/json', 'content-range': '0-9/740', etag: 'W/"1"', 'cache-control': 'max-age=3600',
    }),
  )
  assert.deepEqual(ra, {
    'content-type': 'application/json', 'content-range': '0-9/740', etag: 'W/"1"', 'cache-control': 'max-age=3600',
  })
})

test('F9 cache tĩnh: assets có hash ⇒ 1 năm immutable; còn lại ⇒ no-cache', () => {
  assert.equal(cacheTinh('assets/index-Ab12.js'), 'public, max-age=31536000, immutable')
  assert.equal(cacheTinh('index.html'), 'no-cache')
  assert.equal(cacheTinh('favicon.svg'), 'no-cache')
})
