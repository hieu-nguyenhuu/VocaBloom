import { useEffect, useReducer, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/icons.tsx'
import {
  dichLoiImport,
  dinhDangKB,
  docFileImport,
  dongCanhBao,
  GIOI_HAN_BYTES,
  giamTrangThai,
  timTuTrung,
  type KetQuaDoc,
  type KetQuaRpc,
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
 * 3 trạng thái không có mockup (lỗi file / đang import / kết quả) theo DESIGN.md §1 đã duyệt.
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
    tom_tat: { ten_topic: '', so_tu: 0, so_bai_tap: 0, so_dong_hoi_thoai: 0 },
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
  const [tienDoTts, setTienDoTts] = useState<{ da: number; tong: number } | null>(null)
  const [ketQuaTts, setKetQuaTts] = useState<KetQuaGen | null>(null)
  const daChayTts = useRef(false)

  // Import xong → sinh audio cho từ mới ngay, chạy nền, KHÔNG chặn 2 nút điều hướng.
  // Ref guard: StrictMode gọi effect 2 lần, thiếu guard sẽ gọi Google TTS gấp đôi (bài học MB-20).
  useEffect(() => {
    if (tt.buoc !== 'ket_qua_ok' || daChayTts.current) return
    daChayTts.current = true
    void (async () => {
      const kq = await genAudioChoTu((da, tong) => setTienDoTts({ da, tong }))
      setTienDoTts(null)
      setKetQuaTts(kq)
    })()
  }, [tt.buoc])

  async function chonFile(files: FileList | File[]) {
    const ds = Array.from(files)
    const file = ds[0]
    if (!file) return
    const luotNay = ++luot.current
    const thongTin = { ten_file: file.name, kich_thuoc: file.size }

    if (file.size > GIOI_HAN_BYTES) {
      dispatch({ loai: 'chon', ...thongTin, ket_qua: loiFileQuaLon(file.size) })
      return
    }
    const ket_qua = docFileImport(await file.text())
    if (luotNay !== luot.current) return
    dispatch({ loai: 'chon', ...thongTin, ket_qua })
    if (!ket_qua.hop_le) return

    // Cảnh báo trùng (§10.3) — query sau khi đã hiện preview, không chặn thao tác
    const dong: string[] = []
    if (ds.length > 1) dong.push(`Bạn thả ${ds.length} file — chỉ lấy file đầu (${file.name}).`)
    const tuFile = dsTuTrongFile(ket_qua.du_lieu)
    const [vocab, topic] = await Promise.all([
      tuFile.length > 0
        ? supabase.from('vocab').select('word').in('word', tuFile)
        : Promise.resolve({ data: [], error: null }),
      supabase.from('topics').select('id').eq('name', ket_qua.tom_tat.ten_topic),
    ])
    if (luotNay !== luot.current) return
    const khongKiemTraDuoc = Boolean(vocab.error || topic.error)
    dong.push(
      ...dongCanhBao({
        tuTrung: timTuTrung(tuFile, (vocab.data ?? []).map((r) => r.word as string)),
        topicTrung: topic.data?.length ?? 0,
        canhBaoValidator: [], // reducer đã đưa canh_bao của validator vào state
        khongKiemTraDuoc,
        tenTopic: ket_qua.tom_tat.ten_topic,
      }),
    )
    if (dong.length > 0) dispatch({ loai: 'them_canh_bao', dong })
  }

  async function chayImport(du_lieu: unknown) {
    const { data, error } = await supabase.rpc('import_topic', { du_lieu })
    if (error) dispatch({ loai: 'import_loi', loi: dichLoiImport(error) })
    else dispatch({ loai: 'import_ok', ket_qua: data as KetQuaRpc })
  }

  function xacNhan() {
    if (tt.buoc !== 'preview') return
    dispatch({ loai: 'xac_nhan' })
    void chayImport(tt.du_lieu)
  }

  function thuLai() {
    if (tt.buoc !== 'ket_qua_loi') return
    dispatch({ loai: 'thu_lai' })
    void chayImport(tt.du_lieu)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDangKeo(false)
    void chonFile(e.dataTransfer.files)
  }

  const oBuocChonFile = tt.buoc === 'chon_file'
  const coFile = 'ten_file' in tt

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
            <div className="mt-2 text-13 text-content-muted">1 file = 1 topic</div>
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
        /* ── Màn 16 / 17: 2 cột PC, xếp dọc Mobile ────────────────────────── */
        <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_1.4fr] md:gap-8">
          {coFile && (
            <div className={`${KHUNG_DASHED} gap-3 border-border-dashed p-5 md:p-8`}>
              <Icon ten="file" size={34} strokeWidth="1.6" className="text-accent" />
              <div className="text-15 font-semibold text-content-primary">{tt.ten_file}</div>
              <div className="text-13 text-content-muted">Đã tải lên · {dinhDangKB(tt.kich_thuoc)}</div>
            </div>
          )}

          <div className={`flex flex-col gap-[18px] ${coFile ? '' : 'md:col-span-2'}`}>
            {(tt.buoc === 'preview' || tt.buoc === 'dang_import' || tt.buoc === 'ket_qua_loi') && (
              <div className={CARD}>
                <div className="mb-3 text-18 font-bold text-content-primary">{tt.tom_tat.ten_topic}</div>
                <div className="flex flex-col gap-[7px] text-14 text-content-nav">
                  <div>{tt.tom_tat.so_tu} từ vựng mới</div>
                  <div>{tt.tom_tat.so_bai_tap} bài tập được tạo sẵn</div>
                  <div>{tt.tom_tat.so_dong_hoi_thoai} câu hội thoại</div>
                </div>
              </div>
            )}

            {(tt.buoc === 'preview' || tt.buoc === 'dang_import') && tt.canh_bao.length > 0 && (
              <div className="flex items-start gap-[10px] rounded-14 border border-warn bg-warn-bg p-4 text-13 leading-normal text-warn-text">
                <Icon ten="canh-bao" size={19} className="mt-[1px] shrink-0" />
                <ul className="flex flex-col gap-1">
                  {tt.canh_bao.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {tt.buoc === 'loi_file' && (
              <div
                role="alert"
                className="rounded-14 border border-danger bg-danger-bg p-4 text-13 text-danger-text"
              >
                <div className="mb-2 font-semibold">File chưa hợp lệ · {tt.loi.length} lỗi</div>
                <ul className="flex flex-col gap-1">
                  {tt.loi.slice(0, TOI_DA_LOI_HIEN).map((l) => (
                    <li key={`${l.duong_dan}${l.thong_diep}`}>
                      <span className="font-mono">{l.duong_dan}</span> — {l.thong_diep}
                    </li>
                  ))}
                  {tt.loi.length > TOI_DA_LOI_HIEN && (
                    <li>…và {tt.loi.length - TOI_DA_LOI_HIEN} lỗi khác</li>
                  )}
                </ul>
              </div>
            )}

            {tt.buoc === 'ket_qua_loi' && (
              <div
                role="alert"
                className="rounded-14 border border-danger bg-danger-bg p-4 text-13 leading-normal text-danger-text"
              >
                <div className="mb-1 font-semibold">Import thất bại</div>
                <div>{tt.loi}</div>
                <div className="mt-1 opacity-80">Không có gì được ghi (đã rollback).</div>
              </div>
            )}

            {tt.buoc === 'ket_qua_ok' && (
              <div className={CARD}>
                <div className="mb-3 text-18 font-bold text-content-primary">
                  <span className="text-success">✓</span> Đã import {tt.ten_topic}
                </div>
                <div className="flex flex-col gap-[7px] text-14 text-content-nav">
                  <div>{tt.ket_qua.so_tu} từ vựng mới</div>
                  <div>{tt.ket_qua.so_bai_tap} bài tập được tạo sẵn</div>
                  <div>{tt.ket_qua.so_dong_hoi_thoai} câu hội thoại</div>
                </div>
                <div className="mt-3 text-13 text-content-muted">
                  Từ mới nằm ở hàng đợi, cron sẽ nhỏ giọt mỗi ngày.
                </div>
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
              </div>
            )}

            {/* Hàng nút — theo bước */}
            <div className="mt-auto flex gap-3">
              {(tt.buoc === 'preview' || tt.buoc === 'dang_import') && (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch({ loai: 'huy' })}
                    disabled={tt.buoc === 'dang_import'}
                    className={NUT_PHU}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={xacNhan}
                    disabled={tt.buoc === 'dang_import'}
                    className={NUT_CHINH}
                  >
                    {tt.buoc === 'dang_import' ? 'Đang import…' : 'Xác nhận Import'}
                  </button>
                </>
              )}
              {tt.buoc === 'loi_file' && (
                <button
                  type="button"
                  onClick={() => dispatch({ loai: 'chon_file_khac' })}
                  className={NUT_PHU}
                >
                  Chọn file khác
                </button>
              )}
              {tt.buoc === 'ket_qua_loi' && (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch({ loai: 'chon_file_khac' })}
                    className={NUT_PHU}
                  >
                    Chọn file khác
                  </button>
                  <button type="button" onClick={thuLai} className={NUT_CHINH}>
                    Thử lại
                  </button>
                </>
              )}
              {tt.buoc === 'ket_qua_ok' && (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch({ loai: 'chon_file_khac' })}
                    className={NUT_PHU}
                  >
                    Import file khác
                  </button>
                  <Link to="/tu-vung" className={`${NUT_CHINH} text-center`}>
                    Xem từ vựng
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </KhungTrang>
  )
}
