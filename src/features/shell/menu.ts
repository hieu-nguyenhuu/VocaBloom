import type { TenIcon } from '../../components/icons.tsx'

/** 5 mục điều hướng — 1 nguồn cho sidebar PC, tab bar Mobile và stub. Thứ tự theo mockup. */
export const MENU = [
  { path: '/', ten: 'Dashboard', icon: 'dashboard', moc: 'M6' },
  { path: '/on-tap', ten: 'Ôn tập', icon: 'on-tap', moc: 'M4' },
  { path: '/tu-vung', ten: 'Từ vựng', icon: 'tu-vung', moc: 'M6' },
  { path: '/import', ten: 'Import', icon: 'import', moc: 'M2b' },
  { path: '/cai-dat', ten: 'Cài đặt', icon: 'cai-dat', moc: 'M6' },
] as const satisfies readonly { path: string; ten: string; icon: TenIcon; moc: string }[]
