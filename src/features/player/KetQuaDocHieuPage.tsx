import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import { KhungLoi, KhungRong } from '../../components/TrangThai.tsx'
import { phatAmThanh } from '../../lib/amThanh.ts'
import { tongHopKetQua, type DongLogDoc, type KieuDoan } from '../../lib/docHieu.ts'
import { dinhDangNgayVN, homNayVN } from '../../lib/player.ts'
import { supabase } from '../../lib/supabase.ts'

/**
 * KẾT QUẢ ĐỌC HIỂU (M31, design.m31.md §5.2 — khuôn Tổng kết mockup 12, KHÔNG có mockup riêng).
 * Route `/on-tap/doc-hieu/ket-qua?luot=L&topic=X`. Số liệu query `doc_hieu_log` theo `luot_id`
 * (không lấy state client). Đây cũng là nơi CHỐT NHẬT KÝ NGÀY cho lượt đọc hiểu (như Tổng kết, M14)
 * ⇒ thời gian đọc vào streak/số phút.
 */
type KetQua = ReturnType<typeof tongHopKetQua>

function Khung({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
      <div className="w-full max-w-[480px]">{children}</div>
    </main>
  )
}

export default function KetQuaDocHieuPage() {
  const tham = new URLSearchParams(location.search)
  const luot = tham.get('luot')
  const topicId = tham.get('topic')
  const [kq, setKq] = useState<KetQua | null>(null)
  const [ten, setTen] = useState('')
  const [loi, setLoi] = useState<string | null>(null)
  // Ref guard: StrictMode gọi effect 2 lần (MB-20/1)
  const daChot = useRef(false)
  const daPhatAm = useRef(false)

  useEffect(() => {
    if (daPhatAm.current) return
    daPhatAm.current = true
    phatAmThanh('hoan_thanh')
  }, [])

  // M14 — chốt nhật ký ngày; KHÔNG chặn màn khi lỗi (cùng lý do TongKetPage)
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
      supabase
        .from('doc_hieu_log')
        .select('so_cau, so_dung, thoi_gian_ms, topic_readings(kieu)')
        .eq('luot_id', luot)
        .order('created_at'),
      topicId
        ? supabase.from('topics').select('name').eq('id', topicId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])
    const e = lRes.error ?? tRes.error
    if (e) return setLoi(e.message)
    // supabase-js suy kiểu quan hệ thành mảng; thực tế là 1 object (FK n-1)
    const rows = (lRes.data ?? []) as unknown as (Omit<DongLogDoc, 'kieu'> & {
      topic_readings: { kieu: KieuDoan } | null
    })[]
    setTen((tRes.data as { name?: string } | null)?.name ?? '')
    setKq(tongHopKetQua(rows.map((r) => ({ ...r, kieu: r.topic_readings?.kieu ?? null }))))
  }, [luot, topicId])

  useEffect(() => {
    void nap()
  }, [nap])

  if (loi) {
    return (
      <Khung>
        <KhungLoi
          tieuDe="Chưa tải được kết quả"
          loi={loi}
          onThuLai={() => {
            setLoi(null)
            void nap()
          }}
          phu={{ nhan: 'Về Dashboard', toi: '/' }}
        />
      </Khung>
    )
  }
  if (!kq) {
    return (
      <Khung>
        <div className="h-[320px] animate-pulse rounded-20 border border-border-card bg-surface-sunken" />
      </Khung>
    )
  }
  if (kq.doan.length === 0) {
    return (
      <Khung>
        <KhungRong tieuDe="Chưa có đoạn nào được chấm" hanhDong={{ nhan: 'Chọn chủ đề', toi: '/on-tap/chu-de' }} />
      </Khung>
    )
  }

  return (
    <main className="flex min-h-[100dvh] justify-center bg-surface-page px-5 py-10 md:px-10 md:py-12">
      <div className="flex w-full max-w-[560px] flex-col gap-5">
        <div className="text-center">
          <Icon ten="an-mung" size={46} className="mx-auto mb-3 block text-accent" />
          <h1 className="font-display text-26 font-bold text-content-primary">Hoàn thành đọc hiểu</h1>
          <div className="mt-1.5 text-14 text-content-muted">
            {ten ? `${ten} · ` : ''}
            {dinhDangNgayVN(homNayVN(new Date()))}
          </div>
        </div>

        <div className="flex gap-[14px]">
          <div className="flex-1 rounded-16 bg-accent-tint p-5 text-center">
            <div className="font-display text-28 font-bold text-accent-text">
              {kq.so_dung}/{kq.so_cau}
            </div>
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
          {kq.doan.map((d, k) => {
            const du = d.so_dung === d.so_cau
            return (
              <div
                key={k}
                className={`flex items-center justify-between py-3 ${k < kq.doan.length - 1 ? 'border-b border-border-card' : ''}`}
              >
                <span className="text-15 text-content-primary">
                  Đoạn {k + 1} · {d.kieu === 'hoi_thoai' ? 'Hội thoại' : 'Đoạn văn'}
                </span>
                {/* Thiếu điểm dùng màu trung tính, không đỏ — giọng điệu nhẹ nhàng của app */}
                <span className={`text-14 font-semibold ${du ? 'text-success-text' : 'text-content-muted'}`}>
                  {d.so_dung}/{d.so_cau}
                  {du ? ' ✓' : ''}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-1.5 flex flex-col gap-3">
          {topicId && (
            <Link
              to={`/on-tap/doc-hieu?topic=${topicId}`}
              replace
              className="rounded-14 bg-accent py-4 text-center text-16 font-semibold text-white"
            >
              Làm lại chủ đề này
            </Link>
          )}
          <Link to="/on-tap/chu-de" className="rounded-14 bg-secondary-tint py-4 text-center text-15 font-semibold text-secondary">
            Chọn chủ đề khác
          </Link>
          <Link to="/" className="rounded-14 py-2.5 text-center text-14 font-semibold text-content-muted">
            Về Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
