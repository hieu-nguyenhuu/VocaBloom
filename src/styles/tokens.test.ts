/**
 * Test canh cổng cho hệ token (tokens.css).
 *
 * Đây KHÔNG phải test giao diện — nó canh các luật kiến trúc ở DESIGN.md §2
 * mà mắt thường rất dễ bỏ sót khi file token phình to:
 *   1. Đủ 4 tầng, đúng thứ tự.
 *   2. Không lọt màu "vỏ gallery" (màu của trang trưng bày mockup, không phải màu app).
 *   3. Lớp 2 không được viết hex trực tiếp — phải trỏ về Lớp 1.
 *   4. Mọi token Lớp 2 đều được bắc cầu ra Tailwind, không sót cái nào.
 *   5. Hai nhánh dark (theo hệ điều hành / ép thủ công) phải phủ đúng cùng một bộ token.
 *   6. 6 màu Mastery Ring giữ nguyên giá trị tuyệt đối (DEC-12).
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Chuẩn hoá nháy đơn → nháy kép: CSS coi '...' và "..." là một, test không được
// bắt bẻ kiểu nháy (nếu không, đổi Prettier config là test đỏ oan).
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8').replace(/'/g, '"')

/** Cắt 1 tầng ra khỏi file theo marker "=== TẦNG X". */
function tier(letter: string): string {
  const start = css.indexOf(`=== TẦNG ${letter}`)
  expect(start, `Thiếu marker TẦNG ${letter}`).toBeGreaterThan(-1)
  const next = css.indexOf('=== TẦNG ', start + 1)
  return css.slice(start, next === -1 ? css.length : next)
}

/** Lấy tên các custom property được ĐỊNH NGHĨA trong 1 đoạn css. */
function definedVars(scope: string, prefix: string): Set<string> {
  return new Set(
    [...scope.matchAll(new RegExp(`(${prefix}[a-z0-9-]+)\\s*:`, 'g'))].map((m) => m[1] as string),
  )
}

const HEX = /#[0-9A-Fa-f]{3,8}\b/g

describe('tokens.css — cấu trúc 4 tầng', () => {
  it('có đủ 4 tầng theo đúng thứ tự A → B → C → D', () => {
    const order = ['=== TẦNG A', '=== TẦNG B', '=== TẦNG C', '=== TẦNG D'].map((m) =>
      css.indexOf(m),
    )
    expect(order.every((i) => i > -1)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('nạp Tailwind ở dòng đầu tiên', () => {
    expect(css.trimStart().startsWith('@import')).toBe(true)
  })
})

describe('DANH SÁCH ĐEN — màu vỏ gallery không được lọt vào token', () => {
  // Bằng chứng: scripts/extract-colors.mjs — các mã này xuất hiện đúng 1 lần/khung
  // trưng bày (37 light + 37 dark) hoặc thuộc phần nền/chú thích của trang gallery.
  const BANNED = ['#8B7FA8', '#EFEAE0', '#F3F0E9', '#E6E0D2', '#101116', '#8B8F98']

  for (const hex of BANNED) {
    it(`không chứa ${hex}`, () => {
      expect(css.toUpperCase()).not.toContain(hex)
    })
  }
})

describe('TẦNG B — Lớp 2 chỉ trỏ về Lớp 1, không tự viết hex', () => {
  it('không có mã hex nào trong Lớp 2', () => {
    expect(tier('B').match(HEX)).toBeNull()
  })

  it('mọi token --vb-* đều nhận giá trị từ var(--raw-*)', () => {
    const decls = [...tier('B').matchAll(/(--vb-[a-z0-9-]+)\s*:\s*([^;]+);/g)]
    expect(decls.length).toBeGreaterThan(30)
    const sai = decls.filter(([, , value]) => !(value as string).includes('var(--raw-'))
    expect(sai.map(([, name]) => name)).toEqual([])
  })
})

describe('Dark mode — 3 nhánh', () => {
  const b = tier('B')

  it('có nhánh light, nhánh theo hệ điều hành, và nhánh ép thủ công', () => {
    expect(b).toContain('prefers-color-scheme: dark')
    expect(b).toContain(':root:not([data-theme="light"])')
    expect(b).toContain(':root[data-theme="dark"]')
  })

  it('2 nhánh dark phủ đúng cùng một bộ token', () => {
    // lastIndexOf: 2 selector này còn được nhắc trong comment mô tả ở đầu tầng,
    // indexOf sẽ bắt trúng comment và cắt nhầm đoạn.
    const mediaStart = b.lastIndexOf('@media')
    const manualStart = b.lastIndexOf(':root[data-theme="dark"]')
    const auto = definedVars(b.slice(mediaStart, manualStart), '--vb-')
    const manual = definedVars(b.slice(manualStart), '--vb-')
    expect([...auto].filter((v) => !manual.has(v))).toEqual([])
    expect([...manual].filter((v) => !auto.has(v))).toEqual([])
  })

  it('M16 — CẢ 3 nhánh khai color-scheme, đúng sáng/tối tương ứng', () => {
    // Thiếu color-scheme thì phần tử GỐC của trình duyệt (popup <select> chọn giọng, thanh cuộn)
    // không biết trang đang tối ⇒ ép Tối trên OS Sáng sẽ bật popup nền trắng giữa trang tối.
    // Lỗi này tiềm ẩn từ M0, chỉ lộ ra khi M16 cho phép ép theme ngược với OS.
    const mediaStart = b.lastIndexOf('@media')
    const manualStart = b.lastIndexOf(':root[data-theme="dark"]')
    const sang = b.slice(0, mediaStart)
    const toiTheoOS = b.slice(mediaStart, manualStart)
    const toiEp = b.slice(manualStart)
    expect(sang).toMatch(/color-scheme:\s*light/)
    expect(toiTheoOS).toMatch(/color-scheme:\s*dark/)
    expect(toiEp).toMatch(/color-scheme:\s*dark/)
  })
})

describe('TẦNG C — Mastery Ring bất biến (DEC-12)', () => {
  const RING = ['#ef4444', '#f97316', '#eab308', '#a3e635', '#4ade80', '#16a34a']

  it('đủ 6 mã, đúng thứ tự, KHÔNG đi qua var()', () => {
    const decls = [...tier('C').matchAll(/--ring-([0-5])\s*:\s*([^;]+);/g)]
    expect(decls.map(([, i]) => i)).toEqual(['0', '1', '2', '3', '4', '5'])
    expect(decls.map(([, , v]) => (v as string).trim().toLowerCase())).toEqual(RING)
  })
})

describe('TẦNG D — bắc cầu ra Tailwind', () => {
  it('dùng @theme inline (không phải @theme thường — nếu không dark mode sẽ chết)', () => {
    expect(tier('D')).toContain('@theme inline')
  })

  it('mọi token Lớp 2 đều được phơi ra utility, không sót cái nào', () => {
    const lop2 = definedVars(tier('B').slice(0, tier('B').indexOf('@media')), '--vb-')
    const buoc = tier('D')
    const chuaBac = [...lop2].filter((v) => !buoc.includes(`var(${v})`))
    expect(chuaBac).toEqual([])
  })
})
