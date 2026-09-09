/**
 * extract-colors.mjs — trích màu từ 2 file mockup, TÁCH RIÊNG frame light vs dark.
 *
 * Vì sao cần script này: grep hex thẳng cả file chỉ cho ra tần suất tổng, không
 * biết mã nào thuộc light mode, mã nào thuộc dark. Có những cặp (ví dụ
 * #55566A / #B7AFC9) xuất hiện cùng số lần trên cùng selector — không thể suy
 * đoán mã nào của mode nào. Script cắt file theo data-screen-label, phân nhóm
 * bằng hậu tố "(Dark)", rồi đếm riêng từng nhóm.
 *
 * Chạy: node scripts/extract-colors.mjs
 */
import { readFileSync } from 'node:fs'

const FILES = ['VocaBloom_PCView.html', 'VocaBloom_MobileView.html']
const MARKER = 'data-screen-label="'

/** Cắt 1 file HTML thành các frame theo data-screen-label. */
function splitFrames(html) {
  const frames = []
  let idx = html.indexOf(MARKER)
  while (idx !== -1) {
    const labelEnd = html.indexOf('"', idx + MARKER.length)
    const label = html.slice(idx + MARKER.length, labelEnd)
    const next = html.indexOf(MARKER, labelEnd)
    const body = html.slice(labelEnd, next === -1 ? html.length : next)
    // Bỏ frame giả "..." (placeholder trong file)
    if (label !== '...') frames.push({ label, body })
    idx = next
  }
  return frames
}

/**
 * Tìm tên thuộc tính CSS đứng trước 1 mã hex.
 * Xử lý được cả dạng rút gọn: `border:1px solid #EFEAE0` → "border".
 */
function propBefore(text, hexIndex) {
  const from = Math.max(0, hexIndex - 80)
  const chunk = text.slice(from, hexIndex)
  const cut = Math.max(chunk.lastIndexOf(';'), chunk.lastIndexOf('"'), chunk.lastIndexOf('{'))
  const decl = chunk.slice(cut + 1)
  const colon = decl.indexOf(':')
  return colon === -1 ? '?' : decl.slice(0, colon).trim()
}

/** Gom hex + thuộc tính trong 1 đoạn HTML. */
function collect(body, bucket) {
  const re = /#[0-9A-Fa-f]{6}\b/g
  let m
  while ((m = re.exec(body)) !== null) {
    const hex = m[0].toUpperCase()
    const prop = propBefore(body, m.index)
    if (!bucket.has(hex)) bucket.set(hex, { count: 0, props: new Map() })
    const entry = bucket.get(hex)
    entry.count += 1
    entry.props.set(prop, (entry.props.get(prop) ?? 0) + 1)
  }
}

const light = new Map()
const dark = new Map()
let nLight = 0
let nDark = 0

for (const file of FILES) {
  for (const frame of splitFrames(readFileSync(file, 'utf8'))) {
    const isDark = frame.label.includes('(Dark)')
    collect(frame.body, isDark ? dark : light)
    if (isDark) nDark += 1
    else nLight += 1
  }
}

const topProps = (entry) =>
  [...entry.props.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([p, c]) => `${p}(${c})`)
    .join(' ')

function report(title, hexes) {
  console.log(`\n${'='.repeat(78)}\n${title}  —  ${hexes.length} mã\n${'='.repeat(78)}`)
  console.log('HEX        L     D    | thuộc tính hay gặp')
  console.log('-'.repeat(78))
  for (const hex of hexes) {
    const l = light.get(hex)
    const d = dark.get(hex)
    const props = topProps(l ?? d)
    console.log(
      `${hex}  ${String(l?.count ?? 0).padStart(4)}  ${String(d?.count ?? 0).padStart(4)}    | ${props}`,
    )
  }
}

const all = [...new Set([...light.keys(), ...dark.keys()])]
const byCount = (a, b) =>
  (light.get(b)?.count ?? 0) + (dark.get(b)?.count ?? 0) -
  ((light.get(a)?.count ?? 0) + (dark.get(a)?.count ?? 0))

console.log(`Đã quét ${nLight} frame LIGHT + ${nDark} frame DARK (tổng ${nLight + nDark})`)

report(
  'NHÓM 1 — CHỈ XUẤT HIỆN Ở LIGHT  (ứng viên token bản light)',
  all.filter((h) => light.has(h) && !dark.has(h)).sort(byCount),
)
report(
  'NHÓM 2 — CHỈ XUẤT HIỆN Ở DARK  (ứng viên token bản dark)',
  all.filter((h) => !light.has(h) && dark.has(h)).sort(byCount),
)
report(
  'NHÓM 3 — CẢ HAI MODE  (màu bất biến, HOẶC vỏ gallery)',
  all.filter((h) => light.has(h) && dark.has(h)).sort(byCount),
)

console.log(
  `\n⚠ Ở NHÓM 3, mã có L≈${nLight} và D≈${nDark} là VỎ GALLERY (1 lần/khung), không phải màu app.`,
)
