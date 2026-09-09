import { Link, Route, Routes } from 'react-router'
import TokenSheet from './dev/TokenSheet.tsx'

/**
 * M0 chỉ dựng khung route rỗng. Layout thật (sidebar PC / thanh tab Mobile,
 * xem systemPatterns.md §5) dựng từ M1 trở đi — M0 KHÔNG vẽ icon nào để tránh
 * chạm gate "6 icon giai đoạn cây chưa chốt" (MB-03).
 */
const MAN_HINH = [
  { path: '/', ten: 'Dashboard', moc: 'M6' },
  { path: '/on-tap', ten: 'Ôn tập', moc: 'M4' },
  { path: '/tu-vung', ten: 'Từ vựng', moc: 'M6' },
  { path: '/import', ten: 'Import', moc: 'M2' },
  { path: '/cai-dat', ten: 'Cài đặt', moc: 'M6' },
] as const

function Stub({ ten, moc }: { ten: string; moc: string }) {
  return (
    <main className="min-h-[100dvh] bg-surface-page px-6 py-10">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <h1 className="font-display text-28 font-bold text-content-primary">{ten}</h1>
        <p className="text-15 text-content-muted">
          Màn này sẽ được dựng ở mốc <span className="text-accent-text">{moc}</span>. M0 mới chỉ
          dựng nền móng: hệ token, font và kết nối Supabase.
        </p>
        <nav className="flex flex-wrap gap-2 pt-2">
          {MAN_HINH.map((m) => (
            <Link
              key={m.path}
              to={m.path}
              className="rounded-10 border border-border-card bg-surface-card px-3 py-2 text-13 text-content-nav hover:border-accent hover:text-accent"
            >
              {m.ten}
            </Link>
          ))}
          <Link
            to="/dev/tokens"
            className="rounded-10 bg-accent px-3 py-2 text-13 font-medium text-white"
          >
            Bảng token
          </Link>
        </nav>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      {MAN_HINH.map((m) => (
        <Route key={m.path} path={m.path} element={<Stub ten={m.ten} moc={m.moc} />} />
      ))}
      <Route path="/dev/tokens" element={<TokenSheet />} />
      <Route path="*" element={<Stub ten="Không tìm thấy trang" moc="—" />} />
    </Routes>
  )
}
