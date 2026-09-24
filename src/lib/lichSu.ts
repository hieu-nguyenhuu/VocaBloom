/**
 * Logic thuần cho màn LỊCH SỬ HỌC + ruby vá chuỗi (M15). Không React, không Supabase.
 *
 * ⚠️ Công thức ruby ở đây lặp lại công thức trong `supabase/migrations/0015_ruby_va_ngay.sql`.
 * Sự lặp này là CÓ CHỦ Ý: màn Lịch sử lazy-load theo tháng nên client không bao giờ có đủ dữ liệu
 * để cộng tổng ⇒ TỔNG phải do server tính (`vi_ruby()`), còn ruby của TỪNG NGÀY thì client tự tính
 * để khỏi gọi server cho mỗi ô. Có test `X-ruby` đọc cả 2 nơi rồi so khớp — đừng sửa 1 nơi mà quên
 * nơi kia (bài học bảng phạt / test X1).
 */

/** 5 phút học = 1 ruby. */
export const PHUT_MOI_RUBY = 5
/** Trần 12 ruby/ngày = 60 phút (M15/Q1): học thêm vẫn tính streak nhưng không thêm ruby. */
export const TRAN_RUBY_NGAY = 12
/** 5 ruby vá được 1 ngày. */
export const RUBY_DE_VA = 5

export type DongNhatKy = { ngay: string; thoi_gian_ms: number | null; da_va?: boolean }

export type ViRuby = { kiem: number; tieu: number; con: number }

/**
 * Ruby của 1 ngày, tính theo SỐ PHÚT HIỂN THỊ (M15/Q8) chứ không theo mili-giây thô.
 * Dashboard làm tròn LÊN khi hiện phút; nếu ruby tính từ ms thô thì người dùng thấy "5′"
 * mà được 0 ruby — mâu thuẫn ngay trước mắt.
 */
export function rubyCuaNgay(phut: number): number {
  if (!Number.isFinite(phut) || phut <= 0) return 0
  return Math.min(Math.floor(phut / PHUT_MOI_RUBY), TRAN_RUBY_NGAY)
}

/** 1 ô trong lưới lịch. `ngay = null` là ô đệm để thứ 2 luôn nằm ở cột đầu. */
export type ONgayLich = {
  ngay: string | null
  soNgay: number
  phut: number
  daVa: boolean
  laHomNay: boolean
  laTuongLai: boolean
}

function tach(iso: string): [number, number] {
  const [y, m] = iso.split('-').map(Number)
  return [y ?? 1970, m ?? 1]
}

const hai = (n: number) => String(n).padStart(2, '0')

/** Thứ trong tuần (0 = CN) của 1 ngày ISO — tính bằng UTC để không dính múi giờ máy. */
function thuCua(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay()
}

/**
 * Lưới 7 cột cho 1 tháng ('YYYY-MM'), cột đầu là THỨ 2.
 * Chèn ô đệm ở đầu để ngày 1 rơi đúng cột của nó; không chèn đệm ở cuối (lưới CSS tự xuống hàng).
 */
export function luoiThang(
  thang: string,
  duLieu: readonly DongNhatKy[],
  homNay: string,
): ONgayLich[] {
  const [nam, mm] = tach(thang)
  // Ngày 0 của tháng SAU = ngày cuối của tháng này ⇒ đúng cho cả tháng 2 năm nhuận.
  const soNgayTrongThang = new Date(Date.UTC(nam, mm, 0)).getUTCDate()

  const theoNgay = new Map(duLieu.map((d) => [d.ngay, d]))
  // getUTCDay: 0 = CN. Cột đầu là T2 ⇒ CN phải nằm cuối hàng.
  const soODem = (thuCua(`${thang}-01`) + 6) % 7

  const o: ONgayLich[] = Array.from({ length: soODem }, () => ({
    ngay: null, soNgay: 0, phut: 0, daVa: false, laHomNay: false, laTuongLai: false,
  }))

  for (let d = 1; d <= soNgayTrongThang; d++) {
    const ngay = `${thang}-${hai(d)}`
    const dong = theoNgay.get(ngay)
    o.push({
      ngay,
      soNgay: d,
      phut: Math.ceil((dong?.thoi_gian_ms ?? 0) / 60_000),
      daVa: dong?.da_va === true,
      laHomNay: ngay === homNay,
      laTuongLai: ngay > homNay,
    })
  }
  return o
}

/**
 * Vì sao KHÔNG vá được ngày này; trả `null` nghĩa là vá được.
 * Câu chữ ở đây hiện thẳng lên UI nên viết cho người dùng đọc, không phải cho lập trình viên.
 *
 * ⚠️ Đây chỉ là lớp tiện lợi cho UI. Việc CHẶN THẬT nằm ở RPC `va_ngay` phía server —
 * ẩn nút không phải là bảo vệ.
 */
export function canTroVa(o: ONgayLich, rubyCon: number): string | null {
  if (o.ngay === null) return 'Ô trống'
  if (o.laTuongLai || o.laHomNay) return 'Chỉ vá được ngày trong quá khứ'
  if (o.daVa) return 'Ngày này đã được vá rồi'
  if (o.phut > 0) return 'Ngày này bạn đã học, không cần vá'
  if (rubyCon < RUBY_DE_VA) return `Cần ${RUBY_DE_VA} ruby, bạn còn ${rubyCon}`
  return null
}

/** '2026-09' → "Tháng 9/2026". */
export function tenThang(thang: string): string {
  const [nam, mm] = tach(thang)
  return `Tháng ${mm}/${nam}`
}

/** '2026-01' → '2025-12'. */
export function thangTruoc(thang: string): string {
  const [nam, mm] = tach(thang)
  return mm === 1 ? `${nam - 1}-12` : `${nam}-${hai(mm - 1)}`
}

/** Ngày đầu và cuối của tháng, dùng cho khoảng truy vấn `gte`/`lte`. */
export function khoangThang(thang: string): { dau: string; cuoi: string } {
  const [nam, mm] = tach(thang)
  return { dau: `${thang}-01`, cuoi: `${thang}-${hai(new Date(Date.UTC(nam, mm, 0)).getUTCDate())}` }
}
