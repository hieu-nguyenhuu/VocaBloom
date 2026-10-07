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

/** Tách riêng khỏi `onRequest` để harness local gọi thẳng được. */
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
