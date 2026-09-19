import { useNavigate } from 'react-router'
import PanelThongBao from './PanelThongBao.tsx'

/**
 * Lối vào Thông báo trên Mobile (route ẨN `/thong-bao`, không có trong `MENU`).
 * Mockup 19 mở sheet từ chuông ở header Dashboard — Dashboard thuộc M6b, khi đó route này vẫn dùng
 * được nhưng chuông sẽ là lối vào chính.
 */
export default function TrangThongBao() {
  const navigate = useNavigate()
  return <PanelThongBao dang="mobile" onDong={() => navigate(-1)} />
}
