import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Icon, IconCay } from '../../components/icons.tsx'
import {
  demConCho,
  dinhDangNgayVN,
  homNayVN,
  tongHopTongKet,
  type DongLogDb,
  type TongKet,
} from '../../lib/player.ts'
import { supabase } from '../../lib/supabase.ts'

/**
 * Tổng kết phiên ôn tập (mockup 12, SPECIFICATION §4.6, UI_DESIGN §8.8). Route /on-tap/tong-ket, ngoài shell.
 * Số liệu là CỘNG DỒN CẢ NGÀY — query review_log, KHÔNG dùng state client (§4.6). Xem bao nhiêu lần
 * trong ngày cũng đúng. Icon stage tô màu TƯỢNG TRƯNG theo stage (ring-N), không theo total_points.
 * Tự quyết (DESIGN §4): thêm nút "Ôn lại N từ chưa đạt" khi hàng đợi retry hôm nay có hàng.
 *
 * M14: đây cũng là nơi CHỐT NHẬT KÝ NGÀY — mọi đường kết thúc lượt (hết bài, bấm X, xong hội
 * thoại chủ đề) đều dẫn về màn này. RPC `chot_nhat_ky_ngay` ghi số phút vào bảng `nhat_ky_ngay`
 * (không có khoá ngoại) để xoá từ vựng về sau không làm mất streak.
 */
const MAU_STAGE = {
  new: 'text-ring-0', stage1: 'text-ring-1', stage2: 'text-ring-2', stage3: 'text-ring-3', intensive: 'text-ring-4', mastered: 'text-ring-5',
} as const

type DuLieu = { tk: TongKet; tu: Record<string, string>; conCho: number; soRetry: number; homNay: string }

export default function TongKetPage() {
  const [dl, setDl] = useState<DuLieu | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  // Ref guard: StrictMode gọi effect 2 lần (bài học MB-20/1). RPC vốn idempotent (tính lại cả
  // ngày rồi upsert) nên gọi đôi không sai số liệu, nhưng không có lý do gì để gọi thừa.
  const daChot = useRef(false)

  // M14 — chốt nhật ký ngày. CỐ Ý tách khỏi effect nạp dữ liệu và KHÔNG chặn màn khi lỗi:
  // người vừa học xong không đáng bị chặn bởi một thao tác thống kê chạy nền.
  useEffect(() => {
    if (daChot.current) return
    daChot.current = true
    void supabase.rpc('chot_nhat_ky_ngay').then(({ error }) => {
      if (error) console.warn('Không chốt được nhật ký ngày:', error.message)
    })
  }, [])

  useEffect(() => {
    const homNay = homNayVN(new Date())
    void (async () => {
      const [logRes, dueRes, retryRes] = await Promise.all([
        supabase
          .from('review_log')
          .select('vocab_id, points, stage_before, stage_after, is_correct, vocab(word)')
          .gte('reviewed_at', `${homNay}T00:00:00+07:00`)
          .order('reviewed_at'),
        supabase.from('word_state').select('vocab_id').lte('next_review_date', homNay).neq('stage', 'mastered'),
        supabase.from('daily_retry_queue').select('vocab_id').eq('queue_date', homNay),
      ])
      const e = logRes.error ?? dueRes.error ?? retryRes.error
      if (e) return setLoi(e.message)
      // supabase-js suy kiểu quan hệ vocab(word) thành mảng; thực tế là 1 object (FK n-1)
      const rows = (logRes.data ?? []) as unknown as (DongLogDb & { vocab: { word: string } | null })[]
      const tu = Object.fromEntries(rows.map((r) => [r.vocab_id, r.vocab?.word ?? '?']))
      const tk = tongHopTongKet(rows)
      const retryIds = [...new Set((retryRes.data ?? []).map((r) => r.vocab_id as string))]
      const due = (dueRes.data ?? []).map((r) => r.vocab_id as string)
      setDl({ tk, tu, conCho: demConCho(due, retryIds), soRetry: retryIds.length, homNay })
    })()
  }, [])

  if (loi) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div role="alert" className="rounded-14 border border-danger bg-danger-bg p-4 text-13 text-danger-text">Không tải được tổng kết: {loi}</div>
      </main>
    )
  }
  if (!dl) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-surface-page p-6">
        <div className="w-full max-w-[640px] animate-pulse rounded-20 border border-border-card bg-surface-sunken" style={{ height: 320 }} />
      </main>
    )
  }

  const { tk, tu, conCho, soRetry, homNay } = dl
  const hetDue = conCho === 0

  return (
    <main className="flex min-h-[100dvh] justify-center bg-surface-page px-5 py-10 md:px-10 md:py-12">
      <div className="flex w-full max-w-[640px] flex-col gap-5">
        <div className="text-center">
          <Icon ten="an-mung" size={46} className="mx-auto mb-3 block text-accent" />
          <h1 className="font-display text-26 font-bold text-content-primary">
            {tk.so_tu_da_on > 0 ? 'Làm tốt lắm!' : 'Hôm nay chưa ôn từ nào'}
          </h1>
          <div className="mt-1.5 text-14 text-content-muted">Tổng kết hôm nay · {dinhDangNgayVN(homNay)}</div>
        </div>

        <div className="flex gap-[14px]">
          <div className="flex-1 rounded-16 bg-accent-tint p-5 text-center">
            <div className="font-display text-28 font-bold text-accent-text">+{tk.diem}</div>
            <div className="mt-1 text-12 font-semibold text-accent">Điểm hôm nay</div>
          </div>
          <div className="flex-1 rounded-16 bg-border-card p-5 text-center">
            <div className="font-display text-28 font-bold text-content-primary">{tk.so_tu_da_on}</div>
            <div className="mt-1 text-12 font-semibold text-content-muted">Từ đã ôn</div>
          </div>
          <div className="flex-1 rounded-16 bg-success-bg p-5 text-center">
            <div className="font-display text-28 font-bold text-success-text">{tk.so_len_stage}</div>
            <div className="mt-1 text-12 font-semibold text-success-text">Lên stage</div>
          </div>
        </div>

        {tk.mastered.map((id) => (
          <div key={id} className="flex items-center gap-[14px] rounded-18 border-[1.5px] border-warn bg-warn-bg p-5">
            <IconCay stage="mastered" size={34} className="shrink-0 text-ring-5" />
            <div>
              <div className="text-12 font-bold uppercase tracking-[0.04em] text-warn-text">Thành tích mới</div>
              <div className="mt-0.5 text-15 font-semibold text-content-primary">
                「<span lang="zh" className="font-han">{tu[id]}</span>」 đã đạt Mastered hôm nay
              </div>
            </div>
          </div>
        ))}

        {tk.chi_tiet.length > 0 && (
          <div className="rounded-18 border border-border-card bg-surface-card px-[18px] py-2">
            {tk.chi_tiet.map((c, i) => (
              <div
                key={c.vocab_id}
                className={`flex items-center justify-between py-3 ${i < tk.chi_tiet.length - 1 ? 'border-b border-border-card' : ''}`}
              >
                <span lang="zh" className="font-han text-16 text-content-primary">{tu[c.vocab_id]}</span>
                {c.len_stage ? (
                  <div className="flex items-center gap-[9px]">
                    <IconCay stage={c.stage_before} size={17} className={MAU_STAGE[c.stage_before]} />
                    <Icon ten="mui-ten" size={13} strokeWidth="2" className="text-content-muted" />
                    <IconCay stage={c.stage_after} size={17} className={MAU_STAGE[c.stage_after]} />
                  </div>
                ) : (
                  <span className="text-13 font-medium text-content-subtle">chưa đủ điểm</span>
                )}
              </div>
            ))}
          </div>
        )}

        {tk.so_chua_dat > 0 && (
          <p className="text-center text-13 leading-normal text-content-muted">
            {tk.so_chua_dat} từ chưa đủ điểm hôm nay sẽ tiếp tục ôn vào ngày mai.
          </p>
        )}

        <div className="mt-1.5 flex flex-col gap-3">
          {!hetDue && <div className="text-center text-13 text-content-muted">Còn {conCho} từ đang chờ bạn hôm nay</div>}
          {!hetDue && (
            <Link to="/on-tap" className="rounded-14 bg-accent py-4 text-center text-16 font-semibold text-white">
              Ôn tiếp
            </Link>
          )}
          {soRetry > 0 && (
            <Link to="/on-tap?che_do=retry" className="rounded-14 bg-secondary-tint py-4 text-center text-15 font-semibold text-secondary">
              Ôn lại {soRetry} từ chưa đạt
            </Link>
          )}
          <Link
            to="/"
            className={
              hetDue && soRetry === 0
                ? 'rounded-14 bg-accent py-4 text-center text-16 font-semibold text-white'
                : 'rounded-14 py-2.5 text-center text-14 font-semibold text-content-muted'
            }
          >
            Về Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
