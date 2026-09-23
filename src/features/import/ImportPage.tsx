import { useEffect, useReducer, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import {
  dichLoiImport,
  dinhDangKB,
  docFileImport,
  dongCanhBao,
  GIOI_HAN_BYTES,
  demTrangThai,
  giamTrangThai,
  timTuTrung,
  tongKetMe,
  type KetQuaDoc,
  type KetQuaRpc,
  type MucFile,
  type TrangThaiImport,
} from '../../lib/importUi.ts'
import { supabase } from '../../lib/supabase.ts'
import { genAudioChoTu, type KetQuaGen } from '../../lib/tts.ts'
import KhungTrang from '../shell/KhungTrang.tsx'

/**
 * Màn Import (M2b) — mockup 15/16 PC, 16/17 Mobile. Luồng §10.4: chọn file → validate →
 * preview (cảnh báo trùng KHÔNG chặn, DEC-21) → rpc import_topic (1 transaction) → kết quả.
 * Toàn bộ chuyển trạng thái nằm ở reducer thuần `giamTrangThai`; component chỉ đọc file,
 * query trùng, gọi RPC rồi dispatch. Sau khi import xong, tự sinh audio TTS ở nền (M6c, §9).
 * 3 trạng thái không có mockup (lỗi file / đang import / kết quả) theo DESIGN.M2b.md §1 đã duyệt.
 *
 * M12: chọn được NHIỀU file 1 lúc (Q4) — mỗi file là 1 transaction riêng, file hỏng chỉ báo
 * ở dòng của nó và KHÔNG kéo đổ các file còn lại. Preview đổi từ card đơn sang bảng 1 dòng/file.
 */

const NUT = 'flex-1 rounded-12 py-[15px] text-15 font-semibold transition-opacity disabled:opacity-60'
const NUT_CHINH = `${NUT} bg-accent text-white`
const NUT_PHU = `${NUT} bg-border-card text-content-nav`
const KHUNG_DASHED =
  'flex flex-col items-center justify-center rounded-20 border-2 border-dashed bg-surface-card text-center'
const CARD = 'rounded-16 border border-border-card bg-surface-card p-[22px]'
const TOI_DA_LOI_HIEN = 10

function loiFileQuaLon(bytes: number): KetQuaDoc {
  return {
    hop_le: false,
    loi: [{ duong_dan: '(file)', thong_diep: `File ${dinhDangKB(bytes)} — lớn hơn giới hạn 5 MB.` }],
    canh_bao: [],
    tom_tat: { ten_topic: '', so_tu: 0, so_bai_tap: 0, so_dong_hoi_thoai: 0, so_ngu_phap: 0 },
    du_lieu: null,
  }
}

function dsTuTrongFile(du_lieu: unknown): string[] {
  const vocab = (du_lieu as { vocab?: { word?: unknown }[] } | null)?.vocab ?? []
  return vocab.map((v) => v.word).filter((w): w is string => typeof w === 'string' && w !== '')
}

export default function ImportPage() {
  const [tt, dispatch] = useReducer(giamTrangThai, { buoc: 'chon_file' } as TrangThaiImport)
  const [dangKeo, setDangKeo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Đếm lượt chọn file để bỏ kết quả query trùng của file đã bị Hủy
  const luot = useRef(0)
  // TTS nền sau import (M6c §9)
  const [dangLam, setDangLam] = useState<{ i: number; tong: number; ten: string } | null>(null)
  const [tienDoTts, setTienDoTts] = useState<{ da: number; tong: number } | null>(null)
  const [ketQuaTts, setKetQuaTts] = useState<KetQuaGen | null>(null)
  const daChayTts = useRef(false)

  // Import xong → sinh audio cho từ mới ngay, chạy nền, KHÔNG chặn 2 nút điều hướng.
  // Ref guard: StrictMode gọi effect 2 lần, thiếu guard sẽ gọi Google TTS gấp đôi (bài học MB-20).
  // M12: chạy MỘT lần cho cả mẻ (không phải mỗi file) để không gọi Google song song.
  // Rút gọn điều kiện ra ngoài effect để deps là 1 boolean, không phải cả mảng `ds`.
  const meCoFileXong = tt.buoc === 'ket_qua' && demTrangThai(tt.ds, 'xong') > 0
  useEffect(() => {
    if (!meCoFileXong || daChayTts.current) return
    daChayTts.current = true
    void (async () => {
      const kq = await genAudioChoTu((da, tong) => setTienDoTts({ da, tong }))
      setTienDoTts(null)
      setKetQuaTts(kq)
    })()
  }, [meCoFileXong])

  async function chonFile(files: FileList | File[]) {
    const dsFile = Array.from(files)
    if (dsFile.length === 0) return
    const luotNay = ++luot.current

    // Đọc + validate TẤT CẢ file rồi dispatch 1 lần — mỗi file có trạng thái riêng (M12/Q4).
    const daDoc = await Promise.all(
      dsFile.map(async (f) => ({
        ten_file: f.name,
        kich_thuoc: f.size,
        ket_qua: f.size > GIOI_HAN_BYTES ? loiFileQuaLon(f.size) : docFileImport(await f.text()),
      })),
    )
    if (luotNay !== luot.current) return
    dispatch({ loai: 'chon', ds: daDoc })

    // Cảnh báo trùng (§10.3) — query SAU khi đã hiện preview, không chặn thao tác.
    // Chạy song song theo file; mỗi file dispatch cảnh báo của riêng nó.
    await Promise.all(
      daDoc
        .filter((f) => f.ket_qua.hop_le)
        .map(async ({ ten_file, ket_qua }) => {
          const tuFile = dsTuTrongFile(ket_qua.du_lieu)
          const [vocab, topic] = await Promise.all([
            tuFile.length > 0
              ? supabase.from('vocab').select('word').in('word', tuFile)
              : Promise.resolve({ data: [], error: null }),
            supabase.from('topics').select('id').eq('name', ket_qua.tom_tat.ten_topic),
          ])
          if (luotNay !== luot.current) return
          const dong = dongCanhBao({
            tuTrung: timTuTrung(tuFile, (vocab.data ?? []).map((r) => r.word as string)),
            topicTrung: topic.data?.length ?? 0,
            canhBaoValidator: [], // reducer đã đưa canh_bao của validator vào state
            khongKiemTraDuoc: Boolean(vocab.error || topic.error),
            tenTopic: ket_qua.tom_tat.ten_topic,
          })
          if (dong.length > 0) dispatch({ loai: 'them_canh_bao', ten_file, dong })
        }),
    )
  }

  /**
   * Import TUẦN TỰ từng file, mỗi file 1 transaction (RPC). Lỗi 1 file thì ghi nhận rồi
   * ĐI TIẾP — cố ý không `return`, đó là điểm khác then chốt so với bản 1 file (M12/Q4).
   */
  async function chayMe(ds: MucFile[]) {
    const canChay = ds.filter((m) => m.tt === 'dang_import')
    for (let i = 0; i < canChay.length; i++) {
      const m = canChay[i]!
      if (m.tt !== 'dang_import') continue
      setDangLam({ i: i + 1, tong: canChay.length, ten: m.ten_file })
      const { data, error } = await supabase.rpc('import_topic', { du_lieu: m.du_lieu })
      if (error) dispatch({ loai: 'file_loi', ten_file: m.ten_file, loi: dichLoiImport(error) })
      else dispatch({ loai: 'file_ok', ten_file: m.ten_file, ket_qua: data as KetQuaRpc })
    }
    setDangLam(null)
    dispatch({ loai: 'xong_het' })
  }

  function xacNhan() {
    if (tt.buoc !== 'preview') return
    const ds = tt.ds.map((m): MucFile => (m.tt === 'san_sang' ? { ...m, tt: 'dang_import' } : m))
    dispatch({ loai: 'xac_nhan' })
    void chayMe(ds)
  }

  function thuLai() {
    if (tt.buoc !== 'ket_qua') return
    const ds = tt.ds.map((m): MucFile => {
      if (m.tt !== 'that_bai') return m
      const { loi: _bo, ...conLai } = m
      return { ...conLai, tt: 'dang_import' }
    })
    dispatch({ loai: 'thu_lai' })
    void chayMe(ds)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDangKeo(false)
    void chonFile(e.dataTransfer.files)
  }

  const oBuocChonFile = tt.buoc === 'chon_file'
  const dsFile: MucFile[] = tt.buoc === 'chon_file' ? [] : tt.ds
  const soHopLe = demTrangThai(dsFile, 'san_sang')
  const tong = tongKetMe(dsFile)

  return (
    <KhungTrang rong={960}>
      {/* Header: PC luôn "Import từ vựng"; Mobile ở bước sau là back + "Xem trước" (màn 17) */}
      {oBuocChonFile ? (
        <h1 className="mb-6 font-display text-22 font-bold text-content-primary md:text-24">
          Import từ vựng
        </h1>
      ) : (
        <>
          <h1 className="mb-6 hidden font-display text-24 font-bold text-content-primary md:block">
            Import từ vựng
          </h1>
          <div className="mb-4 flex items-center gap-[14px] md:hidden">
            <button
              type="button"
              aria-label="Quay lại"
              onClick={() => dispatch({ loai: 'chon_file_khac' })}
              className="text-content-primary"
            >
              <Icon ten="back" size={20} strokeWidth="2" />
            </button>
            <h1 className="font-display text-19 font-bold text-content-primary">Xem trước</h1>
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void chonFile(e.target.files)
          e.target.value = ''
        }}
      />

      {oBuocChonFile ? (
        /* ── Màn 15 / 16: khung kéo-thả ───────────────────────────────────── */
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDangKeo(true)
          }}
          onDragLeave={() => setDangKeo(false)}
          onDrop={onDrop}
          className={`${KHUNG_DASHED} min-h-[420px] gap-[18px] p-6 ${
            dangKeo ? 'border-accent bg-accent-tint' : 'border-border-dashed'
          }`}
        >
          <Icon ten="import" size={48} strokeWidth="1.6" className="text-accent" />
          <div>
            <div className="text-17 font-semibold text-content-primary">Kéo thả file JSON vào đây</div>
            <div className="mt-2 text-13 text-content-muted">
              Mỗi file = 1 chủ đề · chọn được nhiều file
            </div>
          </div>
          <div className="text-13 text-content-subtle">hoặc</div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-12 bg-accent px-7 py-[14px] text-15 font-semibold text-white"
          >
            Chọn file
          </button>
        </div>
      ) : (
        /* ── Màn 16 / 17 mở rộng: bảng 1 dòng/file (M12) ───────────────────── */
        <div className="flex flex-col gap-[18px]">
          {/* Tổng quan mẻ */}
          <div className={CARD}>
            <div className="mb-1 text-18 font-bold text-content-primary">
              {tt.buoc === 'ket_qua'
                ? `Đã import ${tong.so_file_ok}/${dsFile.length} file`
                : `${dsFile.length} file đã chọn`}
            </div>
            <div className="text-14 text-content-nav">
              {tt.buoc === 'ket_qua' ? (
                <>
                  {tong.so_tu} từ vựng · {tong.so_bai_tap} bài tập · {tong.so_ngu_phap} mục ngữ pháp ·{' '}
                  {tong.so_dong_hoi_thoai} câu hội thoại
                </>
              ) : (
                <>
                  {soHopLe} file hợp lệ
                  {dsFile.length - soHopLe > 0 &&
                    ` · ${dsFile.length - soHopLe} file chưa hợp lệ (sẽ bỏ qua)`}
                </>
              )}
            </div>
            {dangLam && (
              <div className="mt-2 text-13 text-content-muted">
                Đang import {dangLam.i}/{dangLam.tong} — {dangLam.ten}
              </div>
            )}
            {tienDoTts && (
              <div className="mt-2 text-13 text-content-muted">
                Đang tạo audio… {tienDoTts.da}/{tienDoTts.tong}
              </div>
            )}
            {ketQuaTts && (
              <div className="mt-2 text-13 text-content-muted">
                {ketQuaTts.tong === 0
                  ? 'Mọi từ đều đã có audio.'
                  : `Đã tạo audio cho ${ketQuaTts.xong}/${ketQuaTts.tong} từ.`}
                {ketQuaTts.loi.map((l) => (
                  <div key={l} className="mt-1 text-danger-text">
                    {l}
                  </div>
                ))}
              </div>
            )}
            {tt.buoc === 'ket_qua' && tong.so_file_ok > 0 && (
              <div className="mt-3 text-13 text-content-muted">
                Từ mới nằm ở hàng đợi, cron sẽ nhỏ giọt mỗi ngày.
              </div>
            )}
          </div>

          {/* 1 dòng / file */}
          <ul className="flex flex-col gap-[10px]">
            {dsFile.map((m) => (
              <li
                key={m.ten_file}
                className={`rounded-14 border p-4 ${
                  m.tt === 'loi' || m.tt === 'that_bai'
                    ? 'border-danger bg-danger-bg'
                    : 'border-border-card bg-surface-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon ten="file" size={18} strokeWidth="1.6" className="shrink-0 text-accent" />
                      <span className="truncate text-15 font-semibold text-content-primary">
                        {m.tt === 'loi' ? m.ten_file : m.tom_tat.ten_topic || m.ten_file}
                      </span>
                    </div>
                    <div className="mt-1 text-13 text-content-muted">
                      {m.ten_file} · {dinhDangKB(m.kich_thuoc)}
                      {m.tt !== 'loi' && (
                        <>
                          {' · '}
                          {m.tom_tat.so_tu} từ · {m.tom_tat.so_bai_tap} bài · {m.tom_tat.so_ngu_phap}{' '}
                          ngữ pháp · {m.tom_tat.so_dong_hoi_thoai} câu
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-13 font-semibold">
                      {m.tt === 'san_sang' && <span className="text-content-muted">Sẵn sàng</span>}
                      {m.tt === 'dang_import' && (
                        <span className="text-content-muted">Đang import…</span>
                      )}
                      {m.tt === 'xong' && <span className="text-success">✓ Xong</span>}
                      {(m.tt === 'loi' || m.tt === 'that_bai') && (
                        <span className="text-danger-text">✗ Lỗi</span>
                      )}
                    </span>
                    {tt.buoc === 'preview' && (
                      <button
                        type="button"
                        onClick={() => dispatch({ loai: 'bo_file', ten_file: m.ten_file })}
                        className="rounded-8 bg-border-card px-2.5 py-1 text-13 font-semibold text-content-nav"
                      >
                        Bỏ
                      </button>
                    )}
                  </div>
                </div>

                {m.tt === 'loi' && (
                  <ul role="alert" className="mt-2 flex flex-col gap-1 text-13 text-danger-text">
                    {m.loi.slice(0, TOI_DA_LOI_HIEN).map((l) => (
                      <li key={`${l.duong_dan}${l.thong_diep}`}>
                        <span className="font-mono">{l.duong_dan}</span> — {l.thong_diep}
                      </li>
                    ))}
                    {m.loi.length > TOI_DA_LOI_HIEN && (
                      <li>…và {m.loi.length - TOI_DA_LOI_HIEN} lỗi khác</li>
                    )}
                  </ul>
                )}

                {m.tt === 'that_bai' && (
                  <div role="alert" className="mt-2 text-13 leading-normal text-danger-text">
                    {m.loi}
                    <div className="opacity-80">Không có gì được ghi cho file này (đã rollback).</div>
                  </div>
                )}

                {(m.tt === 'san_sang' || m.tt === 'dang_import') && m.canh_bao.length > 0 && (
                  <div className="mt-2 flex items-start gap-[10px] rounded-10 border border-warn bg-warn-bg p-3 text-13 leading-normal text-warn-text">
                    <Icon ten="canh-bao" size={17} className="mt-[1px] shrink-0" />
                    <ul className="flex flex-col gap-1">
                      {m.canh_bao.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Hàng nút — theo bước */}
          <div className="mt-auto flex gap-3">
            {(tt.buoc === 'preview' || tt.buoc === 'dang_import') && (
              <>
                <button
                  type="button"
                  onClick={() => dispatch({ loai: 'chon_file_khac' })}
                  disabled={tt.buoc === 'dang_import'}
                  className={NUT_PHU}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={xacNhan}
                  disabled={tt.buoc === 'dang_import' || soHopLe === 0}
                  className={NUT_CHINH}
                >
                  {tt.buoc === 'dang_import' ? 'Đang import…' : `Import ${soHopLe} file hợp lệ`}
                </button>
              </>
            )}
            {tt.buoc === 'ket_qua' && (
              <>
                <button
                  type="button"
                  onClick={() => dispatch({ loai: 'chon_file_khac' })}
                  className={NUT_PHU}
                >
                  Import file khác
                </button>
                {demTrangThai(dsFile, 'that_bai') > 0 && (
                  <button type="button" onClick={thuLai} className={NUT_PHU}>
                    Thử lại file lỗi
                  </button>
                )}
                <Link to="/tu-vung" className={`${NUT_CHINH} text-center`}>
                  Xem từ vựng
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </KhungTrang>
  )
}
