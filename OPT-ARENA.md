# Biên bản tối ưu Keepit — OPT-ARENA.md

## 1. Kế hoạch triển khai tối ưu

### 1.1. Mục tiêu & phạm vi
- Tối ưu app hiện có, giữ nguyên UI/tính năng/hành vi; dùng một codebase/API ổn định cho Chrome/Firefox, tách module theo phụ thuộc và tránh rewrite/refactor ngoài phạm vi.
- YouTube song ngữ, Dictation, Supabase/cloud sync và thuê bao thuộc giai đoạn sau; thiết kế tương lai không hàm ý đã triển khai.

### 1.2. Quy trình bắt buộc cho từng bước triển khai
Mỗi bước/bước con phải được ghi rõ và báo cáo theo năm mục sau **trên khung chat**; dừng chờ người dùng kiểm tra trước khi sang bước kế tiếp:
1. **[TÊN BƯỚC]** — IN HOA, in đậm.
2. **Mục tiêu:** phạm vi và vấn đề.
3. **Giải pháp & Code thực hiện:** file/đoạn thay đổi, giải thích ngắn.
4. **Kết quả đạt được:** kết quả thực tế, phân biệt dự kiến và đã xác nhận.
5. **Phương án kiểm thử:** lệnh/công cụ/thao tác; báo xong thì chờ người dùng test.

## 2. Kiến trúc module đề xuất
```text
Keepit — 27 module chức năng
├── Dùng chung (11)
│   ├── Settings
│   ├── TTS
│   ├── Translate
│   ├── Dictionary
│   ├── Flags
│   ├── Icons
│   ├── Languages
│   ├── Shortcuts
│   ├── Themes
│   ├── Fonts
│   └── Search
├── Nghiệp vụ (10)
│   ├── Annotations
│   ├── Highlighter
│   ├── SentenceNote
│   ├── Note Composer
│   ├── Sidebar
│   ├── Content Detector
│   ├── Reader
│   ├── Flashcards
│   ├── Library
│   └── Backup
└── Hỗ trợ (6)
    ├── Messaging
    ├── UI Components
    ├── Page Layout
    ├── Account
    ├── Usage
    └── Diagnostics

Entry point (chỉ khởi tạo/nối module): js/background/background.js,
js/content/content.js, js/popup/popup.js, js/dashboard/dashboard.js.
```

### 2.1. Thứ tự triển khai
```text
Bước 0 — Baseline
   ↓
Bước 1 — Nền tảng
Browser API · Settings · Languages · Cache/lưu trữ · Messaging
   ↓
Bước 2 — Dịch vụ dùng chung
TTS · Translate · Dictionary · Search
   ↓
Bước 3 — Dữ liệu/nghiệp vụ dùng chung
Annotations · Highlighter · SentenceNote · Note Composer
   ↓
Bước 4 — Tính năng phụ thuộc
Reader · Sidebar · Flashcards · Library · Backup
   ↓
Kiểm thử hồi quy → Người dùng kiểm tra → Phát hành sau khi duyệt

Account là module độc lập; Dashboard chỉ gọi/mount Account:
Dashboard ──> Account
                 ├── Auth / Identity (giai đoạn cloud)
                 ├── Entitlements / Usage (giai đoạn cloud)
                 └── Sync (giai đoạn cloud)
TTS / Translate ──> Entitlements / Usage (khi triển khai quota thật)
```

## 3. Thiết kế module

### 3.1. Languages
- Chuẩn bị key/locale cho 21 ngôn ngữ; phát triển/test bằng English, Vietnamese, Korean, rồi dịch 18 ngôn ngữ còn lại khi UI ổn định. Dùng pseudo-locale dài và kiểm tra RTL sớm; tên module **Languages**.

### 3.2. Flags / Fonts
- Đóng gói Twemoji Country Flags cho native select; không CDN/cài máy. `Flags` sở hữu mapping, `Fonts` cung cấp font; CSS chỉ áp cho flag codepoints, không đổi font option.
- Kiểm tra giá trị đang chọn và menu mở trên Chrome, Firefox, Edge.

### 3.3. Account
- `Account` độc lập, Dashboard chỉ mount/call API; Auth/Identity, Entitlements/Usage, Sync là dịch vụ riêng (TTS/Translate dùng Entitlements khi áp quota). Auth/cloud thật thuộc giai đoạn sau; mock Account chưa chốt cho đợt hiện tại.

## 4. Quan hệ tương tác
```text
Popup ──> Translate / TTS / Flags
Reader ──> Content Detector ──> Reader ──> Translate / TTS / Flags
Flashcards ──> Settings.resolve ──> Translate / TTS; dùng Annotations,
               SentenceNote và Flags
Note Composer ──> SentenceNote / Highlighter / Translate / Dictionary / TTS
               └──> Annotations (lưu/đọc)
Sidebar ──> Annotations / Search / Highlighter / TTS / Page Layout
Library ──> Annotations / Search / Flashcards / Backup
Dashboard (js/dashboard/dashboard.js) ──> Settings / Library / Account / Backup
Library ──> Annotations / Search / Flashcards / Backup
Các giao diện ──> UI Components / Icons / Languages / Themes khi cần

Sidebar UI ──┐
             ├──> Messaging ──> Background ──> Annotations ──> IndexedDB
Dashboard UI ┘
Messaging chỉ chuyển request/response/thông báo; Annotations là một nguồn CRUD chung.
```


```text
Dashboard (js/dashboard/dashboard.js)
└── gọi/mount → Account (module độc lập)
    ├── Account UI / controller
    ├── Profile và trạng thái gói
    ├── Trạng thái/điều khiển sync
    └── Xuất / xóa dữ liệu
         ├── dùng Auth / Identity
         ├── dùng Entitlements / Usage
         └── dùng Sync

TTS / Translate ──> Entitlements / Usage
Sync ──> Auth / Identity + kho dữ liệu local + Supabase (giai đoạn cloud)
```

- Dashboard chỉ là shell; Account giữ UI/controller/API, còn Auth/Identity, Entitlements/Usage và Sync là dịch vụ riêng, nối ở giai đoạn cloud.
- `Annotations` là CRUD/IndexedDB chung qua API/Messaging; không giả định browser contexts chia sẻ RAM. `Languages` giữ locale/UI; TTS/Translate nhận diện text; Flags quản lý mapping; Highlighter dùng chung, SentenceNote trích ngữ cảnh, Range là helper.

## 5. Cấu hình, cache và hiệu năng

### 5.1. Cấu hình
- Dashboard là mặc định; Flashcards có override riêng. TTS global 1.0×, tốc độ riêng ngôn ngữ hiển thị 1.25× mặc định (tắt thì dùng global); Auto nhận diện text, Auto ở đích dịch dùng ngôn ngữ UI.

### 5.2. Cache
- Dài hạn: từ điển, bản dịch từ, Flashcards; Reader/popup hết hạn sau 7 ngày không dùng. Tái sử dụng cache ngắn hạn thì nâng thành dài hạn.
- Tách ngân sách audio/bản dịch, dọn LRU, cho phép xóa cache; không xóa dữ liệu người dùng hoặc lưu lỗi/fallback. Lưu từng mục riêng.
- Cache từ điển trượt thì dùng bản dịch một từ nếu text/đích khớp và Auto xác nhận English; chỉ gọi mạng lấy phần thiếu.

### 5.3. Tối ưu hiệu năng
1. **Fonts:** tải theo nhu cầu; không tải khi tắt hoặc tải trùng.
2. **Reader:** giảm quét DOM khi Reader/site tắt hoặc nội dung không đổi.
3. **Dịch:** ưu tiên cache, giới hạn/hủy request cũ và trùng.
4. **Highlighter:** chỉ quét khi có highlight; giữ khớp quote/context.

## 6. Tài khoản, quota và cloud
- Guest: local/quota thấp; tài khoản mới: trial Ultra 7 ngày; Free sau trial: không sync, cloud cũ read-only/export; Pro/Ultra: tiếp tục sync, quota chốt theo chi phí/sử dụng.
- Quota sync tính dữ liệu cá nhân, không tính cache/audio/transcript dùng chung. Hết quota thì dừng sync, giữ local và không tự xóa; xung đột giữ cả hai bản.
- Quyền trả phí kéo dài đến hết kỳ, lỗi thanh toán có 3 ngày gia hạn. TTS/Translate tính theo phút/ngày; cached TTS không trừ, server theo dõi request/ký tự dịch; reset UTC, hiển thị giờ địa phương.
- Cloud read-only xóa sau 1 năm không hoạt động có ý nghĩa (tạo/sửa notes, ôn tập, Dictation hoặc sync); báo trước 30/7 ngày và cho export. Bắt buộc RLS, xác minh quota phía server, không nhúng service key, hỗ trợ export/xóa và backup.

## 7. License, Privacy Policy và Diagnostics — nguyên tắc thiết kế
- Code/tài sản Keepit: All Rights Reserved; giữ license/attribution bên thứ ba. Privacy Policy EN/VI phân biệt luồng hiện tại với cloud tương lai, nêu provider và local data.
- Error log tối đa 200 metadata entries; không lưu URL/nội dung trang/text chọn/tài khoản/stack, không tự upload; export do người dùng chủ động.
- Store disclosures/consent phải khớp hành vi thực; không khai báo cloud hoặc data flow chưa triển khai.

## 8. Kế hoạch sắp tới

### 8.1. Tính năng sắp tới - đã chốt

#### 8.1.1. YouTube song ngữ
- Dùng caption CC đang hiển thị trong panel hai cột; bấm từ/câu gọi Translate/Dictionary, lưu cue với URL/timestamp. Không dùng endpoint transcript nội bộ; báo khi thiếu caption; cô lập CSS và chỉ theo dõi trang video.

```text
Trang YouTube
└── YouTubeAdapter (Content Script: video, điều hướng, caption đang hiển thị)
    └── CaptionCue / Transcript (câu, thời gian, ngôn ngữ, nguồn)
        ├── SubtitlePanel (hai cột, tua theo timestamp)
        ├── Translate / Dictionary (bấm từ hoặc câu)
        └── Annotations (lưu URL video + timestamp)
```

#### 8.1.2. Dictation — tính năng độc lập
- Nghe audio, gõ transcript; đối chiếu đúng/sai, thiếu/thừa. Dictation độc lập với YouTube/Flashcards, dùng chung lõi player/checker nhưng giữ dữ liệu bài tập/lượt làm riêng.
- Adapter hỗ trợ YouTube hoặc audio URL + transcript/timestamp; giao diện ở Dashboard/extension. Có thể nối Annotations/Flashcards nhưng không dùng chung mô hình bài tập.

```text
Dictation (feature độc lập trong extension)
├── Exercise / Transcript / Attempts
├── Audio Player + Answer Checker
└── Audio Sources (adapters)
    ├── YouTube: video + caption/timestamp
    └── Remote Audio: audio URL + transcript được cung cấp
```

#### 8.1.3. Module hỗ trợ
- Tách `YouTubeAdapter` khỏi Reader/Content Detector; dùng `CaptionCue`/Transcript chung và tái sử dụng module hiện có. Dịch theo cụm, hủy request cũ, tránh quét DOM, dọn adapter khi SPA điều hướng. Remote audio cần HTTPS, quyền host tối thiểu và đúng CSP.

### 8.2. Ý tưởng tham khảo — chưa chốt roadmap
- Ý tưởng chưa duyệt: biến thông tin web có nguồn dẫn thành đầu ra/hành động; các module và thứ tự gợi ý nằm dưới đây.

```text
Thu thập thông tin → Hiểu → Tổ chức theo dự án → Tạo đầu ra → Hành động → Ôn lại
```

- Concept: Project Workspace → Task & Action Center → Output Studio; Meeting/Audio Notes và Shared Workspaces để sau, không sao chép nguyên Notion/Trello/Docs.
