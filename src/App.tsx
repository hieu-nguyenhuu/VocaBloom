import { Link, Route, Routes } from 'react-router'
import TokenSheet from './dev/TokenSheet.tsx'
import DangNhap from './features/auth/DangNhap.tsx'
import RequireAuth from './features/auth/RequireAuth.tsx'
import DashboardPage from './features/dashboard/DashboardPage.tsx'
import ImportPage from './features/import/ImportPage.tsx'
import TrangThongBao from './features/notifications/TrangThongBao.tsx'
import ChonChuDePage from './features/player/ChonChuDePage.tsx'
import NguPhapTopicPage from './features/player/NguPhapTopicPage.tsx'
import HoiThoaiKetThucPage from './features/player/HoiThoaiKetThucPage.tsx'
import PlayerPage from './features/player/PlayerPage.tsx'
import TongKetPage from './features/player/TongKetPage.tsx'
import CaiDatPage from './features/settings/CaiDatPage.tsx'
import AppShell from './features/shell/AppShell.tsx'
import TuVungPage from './features/vocab/TuVungPage.tsx'
import KhungTrang from './features/shell/KhungTrang.tsx'

/**
 * Cây route:
 *   /dang-nhap            — ngoài auth
 *   RequireAuth (MB-10)   — RLS chặn toàn bộ DB khi chưa đăng nhập
 *     /on-tap (+ ?che_do=retry|topic), /on-tap/tong-ket, /on-tap/hoi-thoai — toàn màn hình, ngoài shell
 *     AppShell            — sidebar PC / thanh tab Mobile (systemPatterns.md §5)
 *       / (M6b) · /on-tap/chu-de (M7) · /tu-vung(/:topicId) (M8) · /import (M2b) · /cai-dat (M6a)
 *       · /thong-bao (ẩn) · /dev/tokens · 404 — KHÔNG còn màn stub nào
 *
 * Icon nav trích từ mockup (components/icons.tsx); bộ icon giai đoạn cây đã chốt (MB-19).
 */

function Stub({ ten, moc }: { ten: string; moc: string }) {
  return (
    <KhungTrang>
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-28 font-bold text-content-primary">{ten}</h1>
        <p className="text-15 text-content-muted">
          Màn này sẽ được dựng ở mốc <span className="text-accent-text">{moc}</span>. Hiện mới có
          nền móng: hệ token, đăng nhập và app shell.
        </p>
        <Link
          to="/dev/tokens"
          className="self-start rounded-10 bg-accent px-3 py-2 text-13 font-medium text-white"
        >
          Bảng token
        </Link>
      </div>
    </KhungTrang>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/dang-nhap" element={<DangNhap />} />
      <Route element={<RequireAuth />}>
        {/* Player toàn màn hình — NGOÀI AppShell (mockup 02–12 không có nav) */}
        <Route path="/on-tap" element={<PlayerPage />} />
        <Route path="/on-tap/tong-ket" element={<TongKetPage />} />
        <Route path="/on-tap/hoi-thoai" element={<HoiThoaiKetThucPage />} />
        <Route path="/on-tap/ngu-phap" element={<NguPhapTopicPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/on-tap/chu-de" element={<ChonChuDePage />} />
          <Route path="/tu-vung" element={<TuVungPage />} />
          <Route path="/tu-vung/:topicId" element={<TuVungPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/cai-dat" element={<CaiDatPage />} />
          {/* Route ẩn (không có trong MENU) — Dashboard Mobile mở qua nút chuông ở header */}
          <Route path="/thong-bao" element={<TrangThongBao />} />
          <Route path="/dev/tokens" element={<TokenSheet />} />
          <Route path="*" element={<Stub ten="Không tìm thấy trang" moc="—" />} />
        </Route>
      </Route>
    </Routes>
  )
}
