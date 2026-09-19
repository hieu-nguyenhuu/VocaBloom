import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import { supabase } from '../../lib/supabase.ts'
import PanelThongBao from '../notifications/PanelThongBao.tsx'
import { MENU } from './menu.ts'

/**
 * App shell theo systemPatterns.md §5: sidebar trái 220px (≥768px) / thanh tab dưới (<768px).
 * Chuyển bố cục bằng CSS (`md:`), không JS. Header Mobile thuộc từng trang, không ở đây.
 * Mục "Thông báo": PC xổ panel cạnh sidebar (mockup 18); Mobile điều hướng `/thong-bao` (M6a).
 * Mọi số liệu (220px, padding 10/14, icon 19/21, chữ 14/10) trích từ màn 01 & 17 của mockup.
 */
const ITEM_PC = 'flex items-center gap-[11px] rounded-10 px-[14px] py-[10px] text-14'
const ITEM_MOBILE = 'flex flex-col items-center gap-[3px] text-10'

export default function AppShell() {
  const [soChuaDoc, setSoChuaDoc] = useState(0)
  const [moPanel, setMoPanel] = useState(false)

  useEffect(() => {
    void (async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
      setSoChuaDoc(count ?? 0)
    })()
  }, [])

  const doiSoChuaDoc = useCallback((n: number) => setSoChuaDoc(n), [])

  return (
    <div className="flex min-h-[100dvh] bg-surface-page">
      <aside className="sticky top-0 hidden h-[100dvh] w-[220px] shrink-0 flex-col border-r border-border-card bg-surface-sidebar py-6 md:flex">
        <div className="px-6 pb-7 font-display text-20 font-bold text-content-primary">VocaBloom</div>
        <nav className="flex flex-col gap-1 px-3">
          {MENU.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              end={m.path === '/'}
              className={({ isActive }) =>
                isActive
                  ? `${ITEM_PC} bg-accent-tint font-semibold text-accent`
                  : `${ITEM_PC} font-medium text-content-nav hover:bg-surface-sunken`
              }
            >
              <Icon ten={m.icon} size={19} />
              <span>{m.ten}</span>
            </NavLink>
          ))}
        </nav>
        <div className="relative mt-auto px-3">
          <button
            type="button"
            onClick={() => setMoPanel((v) => !v)}
            className={`${ITEM_PC} w-full font-medium text-content-nav hover:bg-surface-sunken`}
          >
            <span className="relative">
              <Icon ten="thong-bao" size={19} />
              {soChuaDoc > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-pill bg-accent" />
              )}
            </span>
            <span>Thông báo</span>
          </button>
          {moPanel && (
            <PanelThongBao dang="pc" onDong={() => setMoPanel(false)} onDoiSoChuaDoc={doiSoChuaDoc} />
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <nav className="sticky bottom-0 flex justify-around border-t border-border-card bg-surface-page px-2 pt-[10px] pb-[calc(14px+env(safe-area-inset-bottom))] md:hidden">
          {MENU.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              end={m.path === '/'}
              className={({ isActive }) =>
                isActive
                  ? `${ITEM_MOBILE} font-semibold text-accent`
                  : `${ITEM_MOBILE} font-medium text-content-subtle`
              }
            >
              <Icon ten={m.icon} size={21} />
              <span>{m.ten}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
