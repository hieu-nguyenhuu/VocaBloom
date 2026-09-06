# 🚀 PREMIUM AGENTIC DEV ECOSYSTEM (Claude Code Edition)

Chào mừng bạn đến với **Studio Lập trình Tự trị** được cấu hình theo tiêu chuẩn tối tân năm 2026, chạy trên **Claude Code**.

Dự án này được thiết kế dựa trên triết lý **"Vibe Code"**:
- 🤖 Tự động hóa quy trình thực thi, có kiểm soát (không tự ý commit)
- 🔒 Bảo vệ mã nguồn nghiêm ngặt — Git do người dùng chủ động thao tác
- 🎨 Áp dụng gu thẩm mỹ cao cấp (Apple / Stripe / Linear)

---

## 🧠 I. QUY TRÌNH LÀM VIỆC TRONG CLAUDE CODE

Claude Code không có khái niệm "Plan Mode / Act Mode" như 2 persona tách biệt phải chuyển qua lại (đó là mô hình của Cline). Thay vào đó, Claude Code có **1 phiên làm việc duy nhất**, trong đó bạn dùng lệnh `/plan` để bật chế độ lập kế hoạch (Claude chỉ đề xuất, không sửa file) trước khi để Claude thực thi. Toàn bộ quy trình 4 bước chi tiết (Brainstorm → Plan → TDD → Review) đã được định nghĩa trong `CLAUDE.md` ở gốc dự án — file đó mới là "bộ não" chính, README này chỉ là bản hướng dẫn nhanh cho bạn.

---

## 🛠️ II. CẤU TRÚC HỆ THỐNG KÝ ỨC & KỸ NĂNG CỤC BỘ

Claude Code đọc skill từ `.claude/skills/` (khuyến nghị hiện tại) — **không phải** `.agents/skills/`. Cấu trúc đúng:

```
├── .claude/
│   └── skills/
│       ├── ponytail/SKILL.md          # 😴 Kỹ năng lười biếng (Ưu tiên HTML5 native, chống Over-engineering)
│       ├── agentic-guard/SKILL.md     # 🛡️ Vệ binh tự trị (Tự build, TUYỆT ĐỐI KHÔNG tự commit Git)
│       ├── taste/SKILL.md             # 🎨 Gu thẩm mỹ cao cấp (Thiết kế tinh tế, bo góc organic, mượt mà)
│       ├── db-diagnostics/SKILL.md    # 🩺 Chẩn đoán DB ngầm (Tự viết script cào data Supabase khi lỗi)
│       └── token-discipline/SKILL.md  # 💸 Kỷ luật Token (Chỉ dùng Diff Patching, tiết kiệm token)
│
└── memory-bank/
    ├── productContext.md        # 🧭 Ý thức sản phẩm (Mục đích, workflow của app)
    ├── systemPatterns.md        # 🏗️ Kiến trúc công nghệ (React, Tailwind, Supabase)
    ├── activeContext.md         # 🧠 Trí nhớ ngắn hạn (Trọng tâm phiên làm việc hiện tại)
    ├── progress.md              # 📈 Nhật ký tiến độ (Những gì đã chạy, những gì cần làm)
    └── decisionLog.md           # 📝 Nhật ký các quyết định kỹ thuật lớn
```

> Lưu ý: `.claude/commands/` (định dạng cũ) vẫn hoạt động, nhưng `.claude/skills/<tên>/SKILL.md` là định dạng được khuyến nghị vì hỗ trợ thêm nhiều tính năng (context injection động, giới hạn tool qua `allowed-tools`...).

---

## 📋 III. SLASH COMMAND TỰ ĐỊNH NGHĨA CỦA DỰ ÁN

Đây là các lệnh **riêng của dự án bạn**, được định nghĩa trong `.claude/commands/`:

| Lệnh | Chức năng |
|---|---|
| `/start` | Kích hoạt đầu phiên — đọc toàn bộ `memory-bank/` để nạp lại bối cảnh |
| `/plan [mô tả feature]` | Lên kế hoạch tính năng mới, xuất `DESIGN.md` |
| `/logic-bug [mô tả lỗi]` | Xử lý lỗi logic nặng, sửa bằng diff patch cục bộ |
| `/db-bug [mô tả lỗi]` | Xử lý lỗi cơ sở dữ liệu, đối chiếu schema/data thật |
| `/ui-bug [mô tả lỗi hoặc kèm ảnh]` | Xử lý lỗi hiển thị/layout |
| `/sync` | Đồng bộ ký ức cuối buổi vào `memory-bank/` |

⚠️ Lưu ý: dự án của bạn cũng có tên `/plan` giống hệt lệnh **có sẵn** của Claude Code (mục IV bên dưới). Vì skill tự định nghĩa sẽ ghi đè lệnh có sẵn cùng tên, khi bạn gõ `/plan` thì **skill riêng của bạn sẽ chạy**, không phải Plan Mode gốc của Claude Code. Đây không phải lỗi, chỉ cần bạn biết để không nhầm lẫn hành vi.

---

## ⚡ IV. SLASH COMMAND CÓ SẴN CỦA CLAUDE CODE (nên biết để dùng kèm)

Ngoài các lệnh riêng ở trên, Claude Code có sẵn nhiều lệnh hữu ích — không cần cài gì thêm:

### 🗂️ Quản lý context
| Lệnh | Chức năng |
|---|---|
| `/context` | Hiện biểu đồ trực quan context đang dùng bao nhiêu %, chiếm bởi phần nào |
| `/compact [ghi chú]` | Nén hội thoại cũ để giải phóng chỗ trống, giữ lại phần bạn chỉ định (VD: `/compact giữ lại schema database`) |
| `/clear` | Xóa sạch lịch sử hội thoại, bắt đầu trắng (khác `/sync` của bạn — `/clear` KHÔNG tự lưu gì trước khi xóa) |

**Dùng khi nào:** chạy `/context` trước khi bắt đầu 1 task lớn để biết còn bao nhiêu chỗ; `/compact` chủ động ở ~70-80% thay vì đợi Claude tự nén (tự nén thường mất nhiều thông tin hơn).

### 🗺️ Lên kế hoạch & review
| Lệnh | Chức năng |
|---|---|
| `/plan [việc cần làm]` | Bật Plan Mode gốc — Claude chỉ đề xuất cách làm, không sửa file, bạn duyệt xong mới chuyển sang thực thi (lưu ý: bị skill riêng của bạn ghi đè, xem mục III) |
| `/diff` | Mở trình xem diff tương tác cho các thay đổi Claude đã làm trong phiên — xem trước khi bạn tự `git commit` |
| `/rewind` | Hoàn tác cả hội thoại lẫn thay đổi file về 1 điểm trước đó — dùng khi muốn "coi như chưa từng xảy ra" |

### 💰 Chi phí & hiệu năng
| Lệnh | Chức năng |
|---|---|
| `/cost` | Xem tổng chi phí/token đã dùng trong phiên hiện tại |
| `/model [tên model]` | Đổi model đang dùng (VD: `/model sonnet`, `/model opus`) |
| `/effort [low\|medium\|high\|max]` | Chỉnh độ "suy nghĩ sâu" — dùng `low`/`medium` cho việc đơn giản để tiết kiệm, `high`/`max` cho debug phức tạp hoặc thay đổi kiến trúc |

### 🔍 Review code
| Lệnh | Chức năng |
|---|---|
| `/code-review [level]` | Review diff hiện tại tìm lỗi đúng/sai, có thể thêm `--fix` để tự áp fix |
| `/simplify` | Dọn code vừa sửa cho gọn hơn (giảm trùng lặp, tối ưu) — thuần dọn dẹp, không tìm bug như `/code-review` |
| `/security-review` | Review riêng về bảo mật cho thay đổi hiện tại |

### 💬 Hỏi ngoài lề
| Lệnh | Chức năng |
|---|---|
| `/btw [câu hỏi]` | Hỏi 1 câu phụ (VD: "quên mất RLS policy check UPDATE là gì nhỉ?") mà KHÔNG làm bẩn luồng hội thoại chính — Claude trả lời trong 1 overlay riêng rồi quay lại đúng chỗ đang làm dở |

**Gợi ý phối hợp với workflow của bạn:** dùng `/btw` bất cứ lúc nào Claude đang thực thi Bước 3 (theo `CLAUDE.md`) mà bạn có câu hỏi nhanh — không cần dừng Claude lại hay sợ làm lệch task đang chạy.

---

## 🚀 V. QUY TRÌNH KHỞI TẠO DỰ ÁN MỚI TỪ ĐẦU (DAY 1)

1. **📦 Chuẩn bị hạ tầng**
   Đảm bảo thư mục `.claude/skills/` và các file template trống trong `memory-bank/` đã được copy sẵn vào thư mục gốc của dự án.

2. **🔥 Khai hỏa dự án**
   Mở Claude Code tại thư mục dự án, ra lệnh bằng tiếng Việt:
   > "Tôi muốn bắt đầu xây dựng ứng dụng Web [Tên Ứng Dụng]. Hãy đọc toàn bộ thư mục kỹ năng `.claude/skills/`, sau đó khởi tạo nội dung cho 5 file trong thư mục `memory-bank/` bao gồm: `productContext.md`, `systemPatterns.md`, `activeContext.md`, `progress.md`, `decisionLog.md` để định hình dự án này."

3. **✅ Nghiệm thu nền móng**
   Claude sẽ tự động viết thông tin sơ khởi vào `productContext.md` và `systemPatterns.md`.

---

## 🔄 VI. QUY TRÌNH PHÁT TRIỂN & UPDATE TÍNH NĂNG HẰNG NGÀY (DAILY WORKFLOW)

### Bước 1: 🏛️ Lên kế hoạch
- Gõ `/start` để nạp lại Memory Bank.
- Gõ `/plan Tôi muốn làm thêm tính năng [Tên Tính Năng]`.
- Claude đọc Memory Bank hiện tại, thảo luận bằng tiếng Việt về giao diện và kiến trúc, xuất `DESIGN.md` chứa các task nhỏ (2-5 phút/task).
- Bạn đọc qua, nếu đồng ý gõ: **`DUYỆT PLAN`**.

### Bước 2: 🛠️ Thực thi
- Ra lệnh: "Hãy đọc file `DESIGN.md` đã được duyệt và tiến hành thực thi theo đúng quy trình trong CLAUDE.md."
- Nhờ `agentic-guard.md`, Claude sẽ:
  - ✍️ Tự viết code áp dụng gu thẩm mỹ của `taste.md`
  - 💻 Tự chạy `npm run build` để kiểm tra lỗi, tự đọc log và tự sửa nếu đỏ
  - 🔴 Dừng lại và báo cáo nếu sửa cùng 1 lỗi quá 3 lần không được, thay vì lặp vô tận
  - 🚫 **KHÔNG** tự động `git add`/`git commit` — việc này luôn do bạn chủ động làm
- Trước khi commit thủ công, chạy `/diff` để xem lại toàn bộ thay đổi, và có thể chạy `/code-review` để soát lỗi lần cuối.

### Bước 3: 📚 Đóng cửa kho ký ức (Đồng bộ cuối ngày)
- Gõ `/sync` — Claude rà soát mã nguồn đã đổi trong ngày, cập nhật `activeContext.md` và `progress.md`.
- Sau đó bạn tự `git add` + `git commit` các thay đổi bạn đã duyệt qua `/diff`.
- Có thể chạy `/clear` để dọn sạch hội thoại cho phiên sau (Memory Bank trên ổ cứng vẫn còn nguyên, không mất).

---

## ⚠️ VII. QUY TẮC PHÒNG VỆ KHI GẶP ĐẠI NẠN BUG

1. 🚫 Đừng để Claude loay hoay mất tiền API sửa mãi 1 lỗi không được.
2. Tùy loại lỗi:
   - 🗄️ **Lỗi dữ liệu (DB/API)** → `/db-bug [Mô tả hiện tượng lỗi]`
   - 🔢 **Lỗi Logic** → `/logic-bug [Mô tả hiện tượng lỗi]`
   - 🖥️ **Lỗi hiển thị (Vỡ giao diện/Responsive)** → dán ảnh chụp màn hình + `/ui-bug [Mô tả vị trí lỗi]`
3. Nếu sau 3 lần thử vẫn không ra, cân nhắc dùng `/effort high` hoặc `/effort max` để tăng độ suy luận sâu trước khi thử tiếp, theo đúng quy tắc "dừng và xem lại kiến trúc" đã định nghĩa trong `db-diagnostics.md` / `CLAUDE.md`.