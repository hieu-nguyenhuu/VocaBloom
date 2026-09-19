/**
 * Test cho thongBao.ts — định dạng thời gian tương đối theo mockup 18 ("2 giờ trước", "5 ngày trước").
 * `bayGio` luôn truyền vào để test không phụ thuộc đồng hồ hệ thống.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { demChuaDoc, thoiGianTuongDoi } from './thongBao.ts'

const BAY_GIO = new Date('2026-09-18T10:00:00+07:00')
const truoc = (ms: number) => new Date(BAY_GIO.getTime() - ms).toISOString()

describe('thoiGianTuongDoi', () => {
  it('30 giây → "vừa xong"', () => {
    expect(thoiGianTuongDoi(truoc(30_000), BAY_GIO)).toBe('vừa xong')
  })
  it('45 phút', () => {
    expect(thoiGianTuongDoi(truoc(45 * 60_000), BAY_GIO)).toBe('45 phút trước')
  })
  it('2 giờ (nguyên văn mockup)', () => {
    expect(thoiGianTuongDoi(truoc(2 * 3600_000), BAY_GIO)).toBe('2 giờ trước')
  })
  it('5 ngày (nguyên văn mockup)', () => {
    expect(thoiGianTuongDoi(truoc(5 * 86400_000), BAY_GIO)).toBe('5 ngày trước')
  })
  it('3 tuần', () => {
    expect(thoiGianTuongDoi(truoc(21 * 86400_000), BAY_GIO)).toBe('3 tuần trước')
  })
})

describe('demChuaDoc', () => {
  it('chỉ đếm tin chưa đọc', () => {
    expect(
      demChuaDoc([
        { id: '1', type: 'low_queue', message: 'a', is_read: false, created_at: truoc(0) },
        { id: '2', type: 'low_queue', message: 'b', is_read: true, created_at: truoc(0) },
        { id: '3', type: 'low_queue', message: 'c', is_read: false, created_at: truoc(0) },
      ]),
    ).toBe(2)
  })
  it('rỗng → 0', () => {
    expect(demChuaDoc([])).toBe(0)
  })
})

describe('X-thongBao — giữ tính thuần', () => {
  it('thongBao.ts không import react / supabase / node:', () => {
    expect(readFileSync('src/lib/thongBao.ts', 'utf8')).not.toMatch(/from ['"](react|@supabase|node:)/)
  })
})
