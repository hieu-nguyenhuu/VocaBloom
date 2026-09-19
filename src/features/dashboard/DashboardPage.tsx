import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Icon, IconCay, type StageCay } from '../../components/icons.tsx'
import {
  dai7Ngay,
  demDenHan,
  gioVN,
  gomKhuVuon,
  loiChao,
  luiNgay,
  ngayCoOn,
  ngayDayDu,
  TEN_NGUOI_DUNG,
  tinhStreak,
  type ODai,
} from '../../lib/dashboard.ts'
import { homNayVN } from '../../lib/player.ts'
import { supabase } from '../../lib/supabase.ts'
import Ring from '../player/Ring.tsx'
import KhungTrang from '../shell/KhungTrang.tsx'

/**
 * Dashboard (mockup 01 PC + Mobile). Tên "Helios" và dải 7 ngày hiện ở CẢ 2 breakpoint là
 * quyết định của người dùng ở Brainstorm M6b (mockup chỉ vẽ dải này ở Mobile).
 *
 * ⚠️ HAI NGUỒN MÀU TÁCH BẠCH (UI_DESIGN §8.1): chip "Khu vườn" tô theo STAGE (màu tượng trưng,
 * query `stage`), còn ring "Vừa ôn gần đây" tô theo `total_points` THẬT (query riêng) — không gộp.
 */
const TINT: Record<StageCay, string> = {
  new: 'bg-danger-bg text-ring-0',
  stage1: 'bg-tint-orange text-ring-1',
  stage2: 'bg-warn-bg text-ring-2',
  stage3: 'bg-tint-lime text-ring-3',
  intensive: 'bg-success-bg text-ring-4',
  mastered: 'bg-success-bg text-ring-5',
}
const THE_CARD = 'rounded-18 border border-border-card bg-surface-card p-[18px] md:p-[22px]'
const TIEU_DE = 'mb-3.5 text-15 font-bold text-content-primary md:mb-4'

type TuGanDay = { vocab_id: string; word: string; total_points: number; stage: StageCay }
type DuLieu = {
  homNay: string
  gio: number
  dungHan: number
  quaHan: number
  tong: number
  coTu: boolean
  streak: number
  dai: ODai[]
  vuon: { stage: StageCay; so: number }[]
  ganDay: TuGanDay[]
  chuaDoc: number
}

function The({ nhan, so, nen, mauNhan }: { nhan: string; so: number; nen: string; mauNhan: string }) {
  return (
    <div className={`flex-1 rounded-16 p-4 md:p-5 ${nen}`}>
      <div className={`text-12 font-semibold md:text-13 ${mauNhan}`}>{nhan}</div>
      <div className="mt-1.5 font-display text-30 font-bold text-content-primary md:mt-2 md:text-36">
        {so} từ
      </div>
    </div>
  )
}

function ONgay({ o }: { o: ODai }) {
  const vien = o.daOn
    ? 'bg-award-icon'
    : o.laHomNay
      ? 'border-2 border-award-icon bg-surface-card'
      : 'border border-award-icon/40 bg-surface-card'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`flex h-[26px] w-[26px] items-center justify-center rounded-pill ${vien}`}>
        {o.daOn ? (
          <Icon ten="tick" size={13} strokeWidth={2.4} className="text-white" />
        ) : o.laHomNay ? (
          <Icon ten="an-mung" size={12} fill="currentColor" stroke="none" className="text-award-icon" />
        ) : null}
      </div>
      <span className={`text-10 text-award-text ${o.laHomNay ? 'font-bold' : 'font-semibold'}`}>
        {o.thu}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const [dl, setDl] = useState<DuLieu | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    void nap()
  }, [])

  async function nap() {
    const now = new Date()
    const homNay = homNayVN(now)
    const [dueRes, vuonRes, ganDayRes, logRes, tbRes] = await Promise.all([
      supabase
        .from('word_state')
        .select('next_review_date')
        .neq('stage', 'mastered')
        .lte('next_review_date', homNay),
      supabase.from('word_state').select('stage'),
      supabase
        .from('word_state')
        .select('vocab_id, total_points, stage, vocab(word)')
        .not('last_reviewed_at', 'is', null)
        .order('last_reviewed_at', { ascending: false })
        .limit(8),
      supabase
        .from('review_log')
        .select('reviewed_at')
        .gte('reviewed_at', `${luiNgay(homNay, 30)}T00:00:00+07:00`),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ])
    const e = dueRes.error ?? vuonRes.error ?? ganDayRes.error ?? logRes.error ?? tbRes.error
    if (e) return setLoi(e.message)

    // supabase-js suy kiểu quan hệ vocab(word) thành mảng; thực tế là 1 object (FK n-1)
    const gd = (ganDayRes.data ?? []) as unknown as (TuGanDay & { vocab: { word: string } | null })[]
    const { dungHan, quaHan, tong } = demDenHan(dueRes.data ?? [], homNay)
    const ngay = ngayCoOn((logRes.data ?? []) as { reviewed_at: string }[])
    setLoi(null)
    setDl({
      homNay,
      gio: gioVN(now),
      dungHan,
      quaHan,
      tong,
      coTu: (vuonRes.data ?? []).length > 0,
      streak: tinhStreak(ngay, homNay),
      dai: dai7Ngay(ngay, homNay),
      vuon: gomKhuVuon((vuonRes.data ?? []) as { stage: string }[]) as { stage: StageCay; so: number }[],
      ganDay: gd.map((t) => ({ ...t, word: t.vocab?.word ?? '?' })),
      chuaDoc: tbRes.count ?? 0,
    })
  }

  if (loi) {
    return (
      <KhungTrang>
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-14 border border-danger bg-danger-bg px-4 py-3 text-13 text-danger-text"
        >
          <span>Không tải được Dashboard: {loi}</span>
          <button
            type="button"
            onClick={() => void nap()}
            className="shrink-0 rounded-10 bg-accent px-3 py-1.5 text-13 font-semibold text-white"
          >
            Thử lại
          </button>
        </div>
      </KhungTrang>
    )
  }

  if (!dl) {
    return (
      <KhungTrang>
        <div className="flex flex-col gap-4">
          <div className="h-10 w-64 animate-pulse rounded-10 bg-surface-sunken" />
          <div className="h-[86px] animate-pulse rounded-16 bg-surface-sunken" />
          <div className="h-[110px] animate-pulse rounded-16 bg-surface-sunken" />
          <div className="h-[140px] animate-pulse rounded-18 bg-surface-sunken" />
        </div>
      </KhungTrang>
    )
  }

  return (
    <KhungTrang>
      <header className="mb-4 flex items-start justify-between gap-4 md:mb-7">
        <div>
          <h1 className="font-display text-22 font-bold text-content-primary md:text-28">
            {loiChao(dl.gio)}, {TEN_NGUOI_DUNG}
          </h1>
          <p className="mt-1 text-13 text-content-muted md:mt-1.5 md:text-14">{ngayDayDu(dl.homNay)}</p>
        </div>
        {/* PC: badge streak (mockup 01 PC) */}
        <span className="hidden items-center gap-2 rounded-pill bg-award-bg px-[18px] py-[9px] md:inline-flex">
          <Icon ten="an-mung" size={16} fill="currentColor" stroke="none" className="shrink-0 text-award-icon" />
          <span className="whitespace-nowrap text-13 font-bold text-award-text">
            Chuỗi {dl.streak} ngày liên tiếp
          </span>
        </span>
        {/* Mobile: chuông — lối vào Thông báo (M6a mới chỉ có route ẩn) */}
        <Link
          to="/thong-bao"
          aria-label="Thông báo"
          className="relative shrink-0 p-1 text-content-nav md:hidden"
        >
          <Icon ten="thong-bao" size={22} />
          {dl.chuaDoc > 0 && (
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-pill bg-accent ring-2 ring-surface-page" />
          )}
        </Link>
      </header>

      {/* PC: `w-fit` để dải không kéo dài hết 1000px — mockup chỉ vẽ dải này ở Mobile (390px) */}
      <div className="mb-4 rounded-16 bg-award-bg px-4 py-3.5 md:mb-7 md:w-fit">
        {/* Hàng badge chỉ ở Mobile — PC đã có badge ở header, không lặp lại */}
        <div className="mb-3 flex items-center gap-1.5 md:hidden">
          <Icon ten="an-mung" size={15} fill="currentColor" stroke="none" className="shrink-0 text-award-icon" />
          <span className="whitespace-nowrap text-12 font-bold text-award-text">
            Chuỗi {dl.streak} ngày liên tiếp
          </span>
        </div>
        <div className="flex justify-between md:gap-7">
          {dl.dai.map((o) => (
            <ONgay key={o.ngay} o={o} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-[1.4fr_1fr] md:items-start md:gap-7">
        <div className="flex flex-col gap-4 md:gap-5">
          <div className="flex gap-3 md:gap-4">
            <The nhan="Đến hạn hôm nay" so={dl.dungHan} nen="bg-accent-tint" mauNhan="text-accent" />
            <The nhan="Quá hạn" so={dl.quaHan} nen="bg-warn-bg" mauNhan="text-warn-text" />
          </div>
          {dl.coTu ? (
            <div className="flex flex-col gap-3 md:flex-row md:gap-3.5">
              <Link
                to="/on-tap"
                className="flex-1 rounded-14 bg-accent py-4 text-center text-15 font-semibold text-white"
              >
                {dl.tong > 0 ? `Bắt đầu ôn tập · ${dl.tong} từ` : 'Bắt đầu ôn tập'}
              </Link>
              <Link
                to="/on-tap/chu-de"
                className="flex-1 rounded-14 bg-secondary-tint py-4 text-center text-14 font-semibold text-secondary"
              >
                Ôn theo chủ đề
              </Link>
            </div>
          ) : (
            <div className="rounded-14 border border-border-card bg-surface-card p-5 text-center">
              <p className="text-14 text-content-muted">Chưa có từ nào — hãy import bộ từ đầu tiên.</p>
              <Link
                to="/import"
                className="mt-3 inline-block rounded-10 bg-accent px-4 py-2.5 text-14 font-semibold text-white"
              >
                Import từ vựng
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 md:gap-5">
          <section className={THE_CARD}>
            <h2 className={TIEU_DE}>Khu vườn của bạn</h2>
            <div className="flex justify-between">
              {dl.vuon.map(({ stage, so }) => (
                <div key={stage} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-[42px] w-[42px] items-center justify-center rounded-pill ${TINT[stage]}`}
                  >
                    <IconCay stage={stage} size={20} />
                  </div>
                  <span className="text-11 font-semibold text-content-nav">{so}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={THE_CARD}>
            <h2 className={TIEU_DE}>Vừa ôn gần đây</h2>
            {dl.ganDay.length === 0 ? (
              <p className="text-13 text-content-muted">Chưa có từ nào được ôn.</p>
            ) : (
              <div className="flex flex-wrap gap-3.5">
                {dl.ganDay.map((t) => (
                  <Ring
                    key={t.vocab_id}
                    total_points={t.total_points}
                    stage={t.stage}
                    size={52}
                    noiDung={
                      <span className="max-w-[40px] truncate text-center font-han text-10 font-semibold text-content-nav md:text-11">
                        {t.word}
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </KhungTrang>
  )
}
