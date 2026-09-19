import { useEffect, useState } from 'react'
import { Icon } from '../../components/icons.tsx'
import { supabase } from '../../lib/supabase.ts'
import { demChuaDoc, thoiGianTuongDoi, type TinDb } from '../../lib/thongBao.ts'

/**
 * Thông báo (mockup 18 PC — panel xổ cạnh sidebar; 19 Mobile — sheet phủ bên phải).
 *
 * Tự quyết ngoài mockup (DESIGN.md §1.2): trạng thái rỗng · nút "Đánh dấu đã đọc tất cả" (mockup vẽ
 * 2 trạng thái đọc/chưa nhưng không có cách chuyển) · bấm 1 tin = đánh dấu đã đọc, KHÔNG điều hướng
 * (bảng `notifications` không có cột link).
 */
type Props = {
  dang: 'pc' | 'mobile'
  onDong: () => void
  onDoiSoChuaDoc?: ((n: number) => void) | undefined
}

const MUC = 'flex w-full gap-3 border-t border-border-card p-3 text-left transition-opacity'
const O_ICON = 'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-10'

export default function PanelThongBao({ dang, onDong, onDoiSoChuaDoc }: Props) {
  const [ds, setDs] = useState<TinDb[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, message, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) {
        setLoi(error.message)
        return
      }
      const tin = (data ?? []) as TinDb[]
      setDs(tin)
      onDoiSoChuaDoc?.(demChuaDoc(tin))
    })()
  }, [onDoiSoChuaDoc])

  async function danhDauDoc(ids: string[]) {
    if (ids.length === 0) return
    const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    if (error) {
      setLoi(error.message)
      return
    }
    setDs((cu) => {
      const moi = (cu ?? []).map((t) => (ids.includes(t.id) ? { ...t, is_read: true } : t))
      onDoiSoChuaDoc?.(demChuaDoc(moi))
      return moi
    })
  }

  const bayGio = new Date()
  const chuaDoc = (ds ?? []).filter((t) => !t.is_read).map((t) => t.id)

  const noiDung = (
    <>
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <h2 className="font-display text-15 font-bold text-content-primary">Thông báo</h2>
        {chuaDoc.length > 0 && (
          <button type="button" onClick={() => void danhDauDoc(chuaDoc)} className="text-12 font-semibold text-accent">
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {loi && (
          <p role="alert" className="p-3 text-13 text-danger-text">
            Không tải được thông báo: {loi}
          </p>
        )}
        {!loi && ds === null && <div className="m-3 h-16 animate-pulse rounded-10 bg-surface-sunken" />}
        {!loi && ds?.length === 0 && <p className="p-3 text-13 text-content-muted">Chưa có thông báo nào.</p>}
        {ds?.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => void danhDauDoc([t.id])}
            className={`${MUC} ${t.is_read ? 'opacity-60' : ''}`}
          >
            <span className={`${O_ICON} ${t.is_read ? 'bg-border-card text-content-muted' : 'bg-warn-bg text-warn-text'}`}>
              <Icon ten="canh-bao" size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-13 leading-snug text-content-primary">{t.message}</span>
              <span className="mt-1 block text-11 text-content-subtle">
                {thoiGianTuongDoi(t.created_at, bayGio)}
              </span>
            </span>
            {!t.is_read && <span className="mt-1 h-[7px] w-[7px] shrink-0 rounded-pill bg-accent" />}
          </button>
        ))}
      </div>
    </>
  )

  if (dang === 'pc') {
    return (
      <>
        {/* lớp bắt click ra ngoài để đóng */}
        <div className="fixed inset-0 z-10" onClick={onDong} aria-hidden="true" />
        <div className="absolute bottom-0 left-[calc(100%+12px)] z-20 w-[360px] rounded-16 border border-border-card bg-surface-raised p-2 shadow-[0_20px_50px_-12px_rgba(36,27,58,0.28)]">
          {noiDung}
        </div>
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/25" onClick={onDong}>
      <div
        className="mt-[70px] mr-4 flex max-h-[420px] w-[78%] max-w-[300px] flex-col overflow-hidden rounded-18 bg-surface-raised shadow-[0_20px_50px_-12px_rgba(36,27,58,0.32)]"
        onClick={(e) => e.stopPropagation()}
      >
        {noiDung}
      </div>
    </div>
  )
}
