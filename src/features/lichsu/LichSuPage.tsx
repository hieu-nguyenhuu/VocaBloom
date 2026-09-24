import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/icons.tsx'
import HopXacNhan from '../../components/HopXacNhan.tsx'
import { homNayVN } from '../../lib/player.ts'
import {
  canTroVa,
  khoangThang,
  luoiThang,
  RUBY_DE_VA,
  tenThang,
  thangTruoc,
  type DongNhatKy,
  type ONgayLich,
  type ViRuby,
} from '../../lib/lichSu.ts'
import { supabase } from '../../lib/supabase.ts'
import KhungTrang from '../shell/KhungTrang.tsx'

/**
 * Lịch sử học + vá chuỗi bằng ruby (M15) — route ẩn `/lich-su`, KHÔNG nằm trong `MENU`
 * (cùng cách đã làm với `/thong-bao`, MB-23/Q5; tab bar Mobile đã kín 5 mục).
 *
 * Màn này CHƯA CÓ MOCKUP — layout đã được duyệt ở DESIGN.md §6.1: ô ngày tái dùng nguyên ngôn ngữ
 * thị giác của dải 7 ngày ở Dashboard, chỉ mở rộng thêm trạng thái "đã vá".
 *
 * ⚠️ Màu: ví ruby + ô ngày dùng token HỒNG (`award-*`) vì là thành tích; NÚT phải dùng TÍM —
 * `UI_DESIGN.md` §63 cấm hồng trên phần tử bấm được.
 *
 * Lazy load: mỗi lần bấm "Tải tháng trước" chỉ truy vấn ĐÚNG 1 tháng. Vì client không bao giờ có
 * đủ dữ liệu, TỔNG ruby phải do server tính (`vi_ruby`), không cộng ở đây.
 */
const NUT_PHU =
  'rounded-12 border border-border-card px-4 py-2.5 text-14 font-semibold text-accent disabled:opacity-60'
const THU = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const

function ONgay({ o, chan, onChon }: { o: ONgayLich; chan: string | null; onChon: () => void }) {
  if (o.ngay === null) return <div />

  const nen = o.daVa
    ? 'border border-dashed border-award-icon bg-surface-card'
    : o.phut > 0
      ? 'bg-award-icon'
      : o.laHomNay
        ? 'border-2 border-award-icon bg-surface-card'
        : 'border border-award-icon/40 bg-surface-card'

  return (
    <button
      type="button"
      disabled={chan !== null}
      onClick={onChon}
      title={chan ?? 'Vá ngày này bằng ruby'}
      aria-label={`Ngày ${o.soNgay}${o.daVa ? ' — đã vá' : o.phut > 0 ? ` — học ${o.phut} phút` : ''}`}
      className={`flex flex-col items-center gap-1 rounded-10 py-1 ${
        chan === null ? 'hover:bg-surface-sunken' : 'cursor-default'
      } ${o.laTuongLai ? 'opacity-35' : ''}`}
    >
      <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-pill ${nen}`}>
        {o.daVa ? (
          <Icon ten="ruby" size={13} className="text-award-icon" />
        ) : o.phut > 0 ? (
          <Icon ten="tick" size={13} strokeWidth={2.4} className="text-white" />
        ) : null}
      </span>
      <span className={`text-10 text-award-text ${o.laHomNay ? 'font-bold' : ''}`}>{o.soNgay}</span>
      <span className="min-h-[13px] text-10 font-semibold text-award-text">
        {o.phut > 0 ? `${o.phut}′` : ''}
      </span>
    </button>
  )
}

export default function LichSuPage() {
  const homNay = homNayVN(new Date())
  const [thangs, setThangs] = useState<string[]>([homNay.slice(0, 7)])
  const [duLieu, setDuLieu] = useState<Record<string, DongNhatKy[]>>({})
  const [vi, setVi] = useState<ViRuby | null>(null)
  const [dangVa, setDangVa] = useState<ONgayLich | null>(null)
  const [dangChay, setDangChay] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  const napThang = useCallback(async (thang: string) => {
    const { dau, cuoi } = khoangThang(thang)
    const { data, error } = await supabase
      .from('nhat_ky_ngay')
      .select('ngay, thoi_gian_ms, da_va')
      .gte('ngay', dau)
      .lte('ngay', cuoi)
    if (error) return setLoi(error.message)
    setDuLieu((cu) => ({ ...cu, [thang]: (data ?? []) as DongNhatKy[] }))
  }, [])

  const napVi = useCallback(async () => {
    const { data, error } = await supabase.rpc('vi_ruby')
    if (error) return setLoi(error.message)
    setVi(data as ViRuby)
  }, [])

  useEffect(() => {
    void napThang(homNay.slice(0, 7))
    void napVi()
  }, [homNay, napThang, napVi])

  function taiThangTruoc() {
    const truoc = thangTruoc(thangs[thangs.length - 1]!)
    setThangs((t) => [...t, truoc])
    void napThang(truoc)
  }

  async function xacNhanVa() {
    if (!dangVa?.ngay) return
    setDangChay(true)
    const { error } = await supabase.rpc('va_ngay', { p_ngay: dangVa.ngay })
    setDangChay(false)
    // `raise exception` trong hàm SQL đã là tiếng Việt và đúng nguyên nhân ⇒ hiện nguyên văn
    // (cùng cách `dichLoiImport` xử lý lỗi của `import_topic`).
    if (error) return setLoi(error.message)
    setDangVa(null)
    await Promise.all([napThang(dangVa.ngay.slice(0, 7)), napVi()])
  }

  const rubyCon = vi?.con ?? 0

  return (
    <KhungTrang rong={960}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-display text-22 font-bold text-content-primary md:text-24">Lịch sử học</h1>
        {/* Ví ruby — HỒNG, cố ý KHÔNG bấm được (UI_DESIGN §63) */}
        <div className="flex items-center gap-1.5 rounded-pill bg-award-bg px-3 py-1.5">
          <Icon ten="ruby" size={16} className="text-award-icon" />
          <span className="text-14 font-bold text-award-text">{rubyCon}</span>
          <span className="text-13 text-award-text/80">ruby</span>
        </div>
      </div>

      <p className="mb-5 text-13 leading-relaxed text-content-muted">
        Mỗi 5 phút học được 1 ruby (tối đa 12 ruby/ngày). Dùng <b>{RUBY_DE_VA} ruby</b> để vá một
        ngày đã bỏ lỡ, chuỗi của bạn sẽ được nối lại.
      </p>

      {loi && (
        <div role="alert" className="mb-4 rounded-14 border border-danger bg-danger-bg p-4 text-13 text-danger-text">
          {loi}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {thangs.map((thang) => {
          const luoi = luoiThang(thang, duLieu[thang] ?? [], homNay)
          return (
            <section key={thang} className="rounded-16 border border-border-card bg-surface-card p-4 md:p-5">
              <h2 className="mb-3 text-15 font-bold text-content-primary">{tenThang(thang)}</h2>
              <div className="grid grid-cols-7 gap-1">
                {THU.map((t) => (
                  <div key={t} className="pb-1 text-center text-10 font-semibold text-content-muted">
                    {t}
                  </div>
                ))}
                {luoi.map((o, i) => (
                  <ONgay
                    key={o.ngay ?? `dem-${i}`}
                    o={o}
                    chan={canTroVa(o, rubyCon)}
                    onChon={() => setDangVa(o)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-5 flex justify-center">
        <button type="button" onClick={taiThangTruoc} className={NUT_PHU}>
          Tải {tenThang(thangTruoc(thangs[thangs.length - 1]!))}
        </button>
      </div>

      {dangVa?.ngay && (
        <HopXacNhan
          tieuDe={`Vá ngày ${dangVa.soNgay}/${Number(dangVa.ngay.slice(5, 7))}?`}
          noiDung={`Việc này tiêu ${RUBY_DE_VA} ruby và không hoàn lại được. Sau khi vá bạn còn ${rubyCon - RUBY_DE_VA} ruby.`}
          nhanXacNhan="Vá ngày này"
          dangChay={dangChay}
          onDong={() => setDangVa(null)}
          onXacNhan={() => void xacNhanVa()}
        />
      )}
    </KhungTrang>
  )
}
