# Biên bản tối ưu Keepit

## Trạng thái
- Các quyết định tối ưu và hai tính năng sắp tới đã chốt; ý tưởng siêu ứng dụng ở cuối biên bản chỉ để tham khảo, chưa chốt roadmap. Đã bắt đầu triển khai từng bước; TTS riêng cho ngôn ngữ hiển thị mặc định 1.25× đã sửa, đang chờ người dùng kiểm tra.
- Đã chốt hướng License: Keepit độc quyền/All Rights Reserved cho code và tài sản gốc; giữ nguyên license/attribution của bên thứ ba. File `LICENSE` đã có bản nháp; cần điền tên pháp lý của chủ thể quyền trước công bố.
- Đã chốt hướng Privacy Policy: một chính sách EN/VI bao quát bản hiện tại và cloud tương lai, phân biệt rõ tính năng hoạt động với kế hoạch chưa triển khai. `PRIVACY-POLICY.md` đã có bản nháp; còn placeholder, rà soát và URL công khai trước phát hành.
- Chỉ tiếp tục triển khai từng bước theo yêu cầu; sau mỗi bước báo kết quả và chờ người dùng kiểm tra.
- Giữ UI, dữ liệu, Chrome/Firefox và vanilla JS; tránh refactor ngoài phạm vi.
- Bước 1 đã được đóng gói thành ZIP kiểm thử v3.4.554 theo `AGENTS.md`; chưa phải bản duyệt phát hành vì còn chờ kiểm thử Network/font thật trên Chrome/Firefox.

## Cây module đề xuất

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

Entry point (chỉ khởi tạo/nối module): background.js, content.js,
popup.js, dashboard.js.
```

## Kế hoạch triển khai tối ưu giai đoạn hiện tại — đã chốt

### Phạm vi
- Chỉ tối ưu app đang có; giữ nguyên UI, tính năng và hành vi.
- YouTube song ngữ, Dictation, Supabase/cloud sync thật, gói thuê bao và các ý tưởng siêu app để giai đoạn sau.
- Không viết lại toàn bộ extension. Chia theo thứ tự phụ thuộc, giữ API ổn định và chỉ tách sâu module cần dùng.
- Làm từng bước; sau mỗi bước báo kết quả và dừng để người dùng kiểm tra trước khi tiếp tục.

### Định dạng bắt buộc cho từng bước triển khai
Mỗi bước và bước con (ví dụ Bước 1, Bước 1.1) phải được ghi rõ trong biên bản và báo cáo theo đúng năm mục sau; không sang bước tiếp theo trước khi người dùng kiểm tra bước hiện tại:

1. **[TÊN BƯỚC]** — viết IN HOA và bôi đậm.
2. **Mục tiêu:** mục tiêu cụ thể, phạm vi và vấn đề cần giải quyết.
3. **Giải pháp & Code thực hiện:** nêu file/đoạn code thay đổi và giải thích ngắn gọn.
4. **Kết quả đạt được:** ghi kết quả thực đo/thực kiểm tra; phân biệt rõ kết quả dự kiến và kết quả đã xác nhận.
5. **Phương án kiểm thử:** đưa lệnh/công cụ/các thao tác người dùng để xác nhận; sau khi báo xong phải dừng chờ người dùng test.

### BƯỚC 1 — ĐÁNH GIÁ VÀ TỐI ƯU TẢI GOOGLE FONTS CẤP BÁCH

1. **[BƯỚC 1 — ĐÁNH GIÁ VÀ TỐI ƯU TẢI GOOGLE FONTS CẤP BÁCH]**
2. **Mục tiêu:** bỏ request stylesheet Google Fonts không cần thiết trên các trang HTTP/HTTPS khi custom font đang tắt; chỉ tải font khi người dùng đã chọn và bật font. Đây là ưu tiên nhỏ, có thể đo rõ, đã nằm trong mục tối ưu Font của biên bản.
3. **Giải pháp & Code thực hiện:** trong `custom-font.js`, bỏ gọi `attachFontStylesheet()` khỏi `attachStyle()` để không tải Google Fonts khi khởi tạo. Chuyển lệnh gọi vào nhánh font hợp lệ đang bật trong `applyFont()`; nhánh font tắt/auto hoặc website bị tắt sẽ gỡ link stylesheet đã gắn. Cập nhật nội dung EN/VI trong `PRIVACY-POLICY.md` và `README.md` cho đúng hành vi mới.
4. **Kết quả đạt được:** xác nhận bằng mock DOM/storage: trạng thái mặc định/tắt không có link; bật font tạo một link Google Fonts; đổi font không tạo link trùng; tắt font hoặc vô hiệu hóa website gỡ link. `node --check` cho toàn bộ JS, parse `manifest.json`, `git diff --check` và kiểm tra nội dung README/policy đều đạt. Đây là test logic/mock, chưa phải đo Network hoặc kiểm tra hiển thị trên Chrome/Firefox thật. Kỳ vọng sau khi test trình duyệt: không có request Google Fonts khi tắt; font vẫn hiển thị khi bật.
5. **Phương án kiểm thử:** trong Chrome và Firefox, mở DevTools → Network, lọc `fonts.googleapis.com`/`fonts.gstatic.com`; tải trang khi custom font tắt (không kỳ vọng request), bật và chọn từng font (kỳ vọng stylesheet/font request và font hiển thị đúng), rồi tắt lại (stylesheet bị gỡ; request đã bắt đầu không thể thu hồi). Lặp lại với website bị tắt trong Keepit. Chờ người dùng hoàn tất kiểm tra này trước khi sang bước tối ưu tiếp theo.

### ĐÓNG GÓI BƯỚC 1 — BẢN KIỂM THỬ v3.4.554

1. **[ĐÓNG GÓI BƯỚC 1 — BẢN KIỂM THỬ v3.4.554]**
2. **Mục tiêu:** đóng gói phần thay đổi đã qua mock/syntax theo đúng `AGENTS.md`, không tuyên bố đã duyệt phát hành khi chưa có kiểm thử trình duyệt thật.
3. **Giải pháp & Code thực hiện:** tăng `manifest.json` lên 3.4.554; cập nhật `PROJECT.md`; commit `v3.4.554: lazy-load Google Fonts on demand`. Tạo `Keepit - Addon and Extension-v3.4.554.zip` trong workspace `/home/user` (đường dẫn đích `D:\Keepit` của Windows không được mount trong sandbox). Gói gồm `AGENTS.md`/`PROJECT.md` ở gốc; bỏ `.git`, `sync-watch.ps1`, `sync-state.txt`, `sync-watch.log`.
4. **Kết quả đạt được:** ZIP có 51 file; `manifest.json` ở gốc và version là 3.4.554; kiểm tra integrity thành công; không có `.git` hoặc file sync. ZIP cũ v3.4.553 không bị sửa. Bản này là bản kiểm thử, chưa được duyệt store/phát hành.
5. **Phương án kiểm thử:** giải nén và Load unpacked trên Chrome, thử Network và hiển thị font theo mục Bước 1; lặp lại trên Firefox. Báo lỗi/kết quả trước khi sang bước tiếp theo.

### Thứ tự

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

1. **Baseline:** kiểm tra trạng thái hiện tại trước sửa. Đã chạy `node --check` cho 17 file JS, parse Manifest V3 version 3.4.553 và `git diff --check`; cả ba đạt. Chưa kiểm tra trên Chrome/Firefox thật.
2. **Nền tảng và module dùng chung:** xác định/ổn định các dependency nền (Browser API, Settings, Languages, cache/lưu trữ, Messaging); sau đó xử lý dịch vụ dùng chung như TTS và Translate.
3. **Module phụ thuộc:** Annotations/Highlighter/SentenceNote/Note Composer, rồi Reader/Sidebar/Flashcards/Library và giao diện phụ thuộc. Giữ entry points làm nhiệm vụ khởi tạo/nối module, tránh refactor hàng loạt không cần thiết.
4. **Tối ưu trong module tương ứng:** Flags/Fonts tích hợp font cờ Twemoji đã chốt vào native select; tải font theo nhu cầu và tránh tải trùng. Reader giảm quét DOM; Translate giới hạn/hủy request và dùng cache; Highlighter tránh quét khi không cần.
5. **Kiểm tra mỗi bước:** syntax/manifest và test logic liên quan sau mỗi thay đổi; người dùng kiểm tra trên Chrome/Firefox rồi mới sang bước tiếp theo. Sau khi toàn bộ thay đổi được duyệt, làm thủ tục phát hành theo AGENTS.md.

### Languages
- Chuẩn bị cấu trúc/key giao diện để hỗ trợ 21 ngôn ngữ từ đầu; trong giai đoạn phát triển kiểm thử English, Vietnamese, Korean. Dịch 18 ngôn ngữ còn lại sau khi UI ổn định; dùng pseudo-locale dài và kiểm tra RTL sớm nếu có ngôn ngữ RTL.
- Dùng đúng tên module **Languages**.

### Flags/Fonts — font cờ cho native select
- Dùng font **Twemoji Country Flags** đã chọn cho emoji cờ trong các native language select; gói file font cùng extension, không tải CDN và không cài font lên máy.
- `Flags` quản lý cờ/mapping; `Fonts` cung cấp font; CSS chỉ áp font cho codepoint cờ, không đổi font chữ của option.
- Kiểm tra cả giá trị đang chọn và menu option đang mở trên Chrome, Firefox và Edge.

### Account
- Account là module độc lập; Dashboard chỉ gọi/mount module này.
- Auth/Identity, Entitlements/Usage và Sync là dịch vụ riêng mà Account dùng; TTS/Translate gọi Entitlements/Usage trực tiếp khi tính quota.
- Auth/Supabase/Sync thật thuộc giai đoạn sau. Prototype Account bằng mock được đề xuất để kiểm tra luồng; chưa chốt có làm trong đợt tối ưu hiện tại hay không.

## Quan hệ tương tác chính

```text
Popup ──> Translate / TTS / Flags
Reader ──> Content Detector ──> Reader ──> Translate / TTS / Flags
Flashcards ──> Settings.resolve ──> Translate / TTS; dùng Annotations,
               SentenceNote và Flags
Note Composer ──> SentenceNote / Highlighter / Translate / Dictionary / TTS
               └──> Annotations (lưu/đọc)
Sidebar ──> Annotations / Search / Highlighter / TTS / Page Layout
Library ──> Annotations / Search / Flashcards / Backup
Dashboard (dashboard.js) ──> Settings / Library / Account / Backup
Library ──> Annotations / Search / Flashcards / Backup
Các giao diện ──> UI Components / Icons / Languages / Themes khi cần

Sidebar UI ──┐
             ├──> Messaging ──> Background ──> Annotations ──> IndexedDB
Dashboard UI ┘
Messaging chỉ chuyển request/response/thông báo; Annotations là một nguồn CRUD chung.
```

Dashboard là entry point/khung hiển thị, chỉ khởi tạo và gọi module; không chứa logic nghiệp vụ Account. **Account là module độc lập**, có UI/controller/API riêng; Dashboard chỉ mount, mở hoặc gọi API của Account.

```text
Dashboard (dashboard.js)
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

Auth/Identity, Entitlements/Usage và Sync là dịch vụ riêng, dùng chung khi cần; không nằm trong Dashboard và không bị gộp vào Account UI. Chúng được bổ sung khi triển khai account/cloud; hiện không đồng nghĩa với việc xây Supabase ngay.

**Annotations dùng chung cho Sidebar và Dashboard**: một module sở hữu CRUD/IndexedDB/thông báo; mỗi giao diện có UI riêng và gọi qua API/Messaging, không truy cập database theo hai cách khác nhau. Không giả định hai browser context chia sẻ RAM.

Languages quản lý ngôn ngữ giao diện/locale và chuỗi EN/VI/KO; nhận diện ngôn ngữ văn bản thuộc TTS/Translate, ánh xạ cờ thuộc Flags. Highlighter dùng chung cho preview, tô, khôi phục và thao tác Sidebar. SentenceNote trích câu ngữ cảnh; helper Range dùng nội bộ, không tạo module Selection.

## Quy tắc triển khai module Languages cho 21 ngôn ngữ
- Chuẩn bị cấu trúc/key giao diện để hỗ trợ 21 ngôn ngữ ngay từ đầu; chưa cần dịch đủ cả 21 trong giai đoạn phát triển.
- Dùng English, Vietnamese và Korean làm ba ngôn ngữ kiểm thử ban đầu. Mọi chữ UI phải lấy qua key của module Languages, không viết cứng trong module tính năng.
- Khi giao diện và chuỗi chữ ổn định, mới dịch 18 ngôn ngữ còn lại.
- Kiểm tra tràn chữ bằng pseudo-locale có chuỗi dài hơn; nếu danh sách có Arabic/RTL, kiểm tra hướng chữ và bố cục từ sớm.

## Cấu hình đã chốt
- Dashboard là mặc định toàn app. Flashcard có override TTS và dịch độc lập; chỉ ảnh hưởng flashcard.
- TTS global mặc định **1.0×**. Tốc độ riêng cho ngôn ngữ hiển thị bật mặc định **1.25×**; nếu tắt thì mọi ngôn ngữ dùng global. TTS override của flashcard chỉ ghi đè trong flashcard.
- Auto trong Reader/TTS/Translate nhận diện ngôn ngữ văn bản; Auto ở đích dịch chọn ngôn ngữ hiển thị.

## Cache đã chốt
- **Dài hạn:** Từ điển đầy đủ, bản dịch từ, Flashcards.
- **Hết hạn sau 7 ngày không dùng:** dịch/audio của Reader và popup dịch cụm từ.
- Mục ngắn hạn được từ điển hoặc flashcard dùng lại sẽ được nâng thành dài hạn, không hạ lại.
- Ngân sách dung lượng riêng cho audio và bản dịch; đầy thì dọn mục ít dùng gần đây nhất. Giữ chức năng xóa cache; không lưu lỗi/fallback.
- Cache từ điển đầy đủ trượt thì thử cache bản dịch từ và popup dịch một từ. Chỉ tái dùng khi text/đích khớp; nguồn Auto phải được xác nhận là tiếng Anh. Nếu có bản dịch, chỉ gọi mạng lấy dữ liệu từ điển còn thiếu.
- Lưu từng mục riêng, không dùng một object cache lớn; không xóa dữ liệu người dùng để dọn cache.

## Bốn tối ưu hiệu năng
1. **Font web:** chỉ tải font khi được yêu cầu; không tải Google Fonts khi tắt; tránh tải trùng giữa Custom Font và Reader.
2. **Reader:** tránh quét nội dung khi Reader/site bị tắt hoặc không cần; giảm quét lại toàn trang do DOM thay đổi.
3. **Dịch song ngữ:** ưu tiên cache, giới hạn request đồng thời, hủy request thua cuộc/lỗi thời và tránh gọi trùng.
4. **Highlighter:** không khôi phục khi không có highlight; giảm quét DOM lặp lại nhưng giữ nguyên khớp quote/context và hành vi.

## Tính năng sắp tới đã chốt (chưa triển khai)

### 1. Học bằng video YouTube
- Hiện phụ đề song ngữ trong extension, theo dạng hai cột; bấm từ/câu để dùng Dictionary/Translate hiện có.
- MVP đọc phụ đề đang hiển thị khi người dùng bật CC và tích lũy theo thời gian; lưu câu kèm URL video và timestamp qua Annotations.
- Không dựa vào endpoint nội bộ không chính thức để lấy transcript. Nếu video không có phụ đề khả dụng, báo rõ giới hạn.
- Không cần website riêng: Content Script chèn panel trong trang YouTube; ưu tiên CSS cô lập và chỉ theo dõi player/phụ đề khi đang ở trang xem video.

```text
Trang YouTube
└── YouTubeAdapter (Content Script: video, điều hướng, caption đang hiển thị)
    └── CaptionCue / Transcript (câu, thời gian, ngôn ngữ, nguồn)
        ├── SubtitlePanel (hai cột, tua theo timestamp)
        ├── Translate / Dictionary (bấm từ hoặc câu)
        └── Annotations (lưu URL video + timestamp)
```

### 2. Dictation — tính năng độc lập
- Người dùng nghe audio và gõ lại transcript; Keepit đối chiếu, báo đúng/sai và làm rõ từ thiếu/thừa.
- Không phụ thuộc YouTube hay Flashcards. Dùng chung lõi phát audio, đối chiếu câu trả lời và lưu kết quả; các nguồn audio được nối qua adapter.
- Nguồn đầu tiên có thể là YouTube; tương lai nhận audio URL từ host riêng cùng transcript do chủ bài cung cấp. Transcript có thể chia đoạn và có timestamp để phát lại từng câu.
- Giao diện nằm trong Dashboard/cửa sổ extension; không cần website riêng. Bài tập và lượt làm thuộc Dictation; có thể tích hợp tùy chọn với Annotations/Flashcards nhưng không dùng chung mô hình dữ liệu bài tập.

```text
Dictation (feature độc lập trong extension)
├── Exercise / Transcript / Attempts
├── Audio Player + Answer Checker
└── Audio Sources (adapters)
    ├── YouTube: video + caption/timestamp
    └── Remote Audio: audio URL + transcript được cung cấp
```

### Module hỗ trợ cho cả hai
- Tách `YouTubeAdapter` khỏi Content Detector/Reader tổng quát; adapter sở hữu việc phát hiện trang video và đọc caption khả dụng.
- Dùng chung định dạng `CaptionCue`/Transcript và gọi Translate, Dictionary, Languages, Annotations, Messaging, UI Components hiện có khi phù hợp.
- Dịch caption theo cụm/câu; giới hạn và hủy request cũ. Không quét lại toàn DOM; dọn adapter khi YouTube điều hướng SPA.
- Dictation giữ bộ chấm và dữ liệu lượt làm riêng; chỉ chia sẻ tiện ích player/session nếu phù hợp, không gộp với Flashcards.
- Với audio từ host riêng, kiểm tra HTTPS, quyền host và chính sách CSP của extension; chỉ yêu cầu quyền tối thiểu.

## Tài khoản, hạn mức và đồng bộ cloud — đã chốt

- **Guest (không tài khoản):** dữ liệu cục bộ; tạo highlight miễn phí; hạn mức Translate/TTS thấp theo phút/ngày.
- **Tài khoản mới:** dùng thử Ultra 7 ngày, gồm đồng bộ cloud.
- **Free sau trial:** hạn mức Translate/TTS cao hơn Guest; không tiếp tục đồng bộ. Dữ liệu cloud đã có chuyển sang chỉ đọc; người dùng vẫn dùng dữ liệu local và có thể xem/xuất bản cloud.
- **Pro / Ultra:** Translate/TTS có hạn mức theo phút/ngày, tăng theo gói; sync tiếp tục với quota dung lượng khác nhau. Mức quota cụ thể chưa chốt.
- **Dictation:** audio và transcript bài dùng chung/được quản lý ngoài Supabase; Supabase chỉ lưu tiến độ riêng từng người dùng.
- **Quota sync:** tính dữ liệu cá nhân (highlights/notes, cài đặt, tiến độ ôn tập và Dictation); không tính cache dịch/TTS, audio hoặc transcript bài dùng chung. Khi hết quota, lưu local tiếp tục nhưng sync tạm dừng; thông báo cách giải phóng dung lượng/nâng cấp; không tự xóa dữ liệu.
- **Hết gói / thanh toán lỗi:** quyền Pro/Ultra giữ đến hết kỳ đã thanh toán; sau đó có 3 ngày gia hạn xử lý lỗi thanh toán. Khi hạ cấp, áp dụng trạng thái Free ở trên.
- **Nâng cấp lại:** đồng bộ local trở lại; nếu cùng mục có sửa đổi xung đột ở cloud và thiết bị, giữ cả hai bản để người dùng chọn, không ghi đè âm thầm.
- **Hạn mức Translate/TTS:** UI tính theo phút/ngày; TTS trừ khi tạo audio mới, phát lại cache không trừ. Phía server vẫn theo dõi ký tự/request của Translate để kiểm soát chi phí. Reset theo ngày UTC, hiển thị giờ địa phương.
- **Retention:** cloud read-only được xóa dần sau một năm không hoạt động. “Active” là có ít nhất một hoạt động có ý nghĩa trong 12 tháng: tạo/sửa highlight hoặc note, ôn flashcard, hoàn thành Dictation hoặc chủ động sync; không yêu cầu tối thiểu 10 highlight. Nhắc trước 30 ngày và 7 ngày; cho xuất dữ liệu trước khi xóa.
- **Bảo mật/vận hành:** RLS trên mọi bảng dữ liệu người dùng; xác minh gói/hạn mức phía server; không đưa service-role key vào extension. Cho phép xuất dữ liệu và yêu cầu xóa tài khoản; có backup độc lập trước khi dọn tự động.

Mức quota cụ thể theo gói sẽ chốt sau khi đo chi phí và mức dùng thực tế.

## Ý tưởng tham khảo — mở rộng Keepit thành app năng suất

**Chưa chốt phạm vi hoặc roadmap; chưa triển khai.** Hướng sản phẩm được gợi ý: biến thông tin web thành kết quả và hành động.

```text
Thu thập thông tin → Hiểu → Tổ chức theo dự án → Tạo đầu ra → Hành động → Ôn lại
```

- **Project Workspace:** gom nguồn web, highlights/notes, video, Dictation, flashcards, tasks và tài liệu đầu ra theo từng dự án.
- **Task & Action Center:** chuyển ghi chú/trích dẫn thành việc cần làm có hạn chót và liên kết nguồn; ưu tiên tích hợp lịch hiện có thay vì tự xây lịch đầy đủ.
- **Output Studio:** tạo brief, báo cáo, đề cương hoặc tài liệu ôn tập từ nguồn được chọn; luận điểm cần truy ngược được về trích dẫn và URL.
- **Meeting / Audio Notes:** từ audio hoặc transcript cuộc họp, trích quyết định, action items và nội dung tham khảo; là workflow riêng, không đồng nhất với Dictation.
- **Shared Workspaces:** chia sẻ nguồn, chú thích, bình luận và công việc theo nhóm; là hướng sau, cần đồng bộ và phân quyền.

Thứ tự gợi ý để tiếp tục thảo luận: **Project Workspace → Task & Action Center → Output Studio**; tích hợp và cộng tác nhóm để sau. Định vị tham khảo: không sao chép Notion/Trello/Docs, mà giúp biến thông tin web có nguồn dẫn thành hành động và kết quả.

## License, Privacy Policy và Diagnostics — hướng đã chốt

1. **License của Keepit:** phần code và tài sản gốc dùng license độc quyền/**All Rights Reserved**; các thành phần bên thứ ba vẫn theo license riêng. `LICENSE` đã có bản nháp có giới hạn rõ phạm vi, nhưng cần xác nhận tên pháp lý/chủ thể quyền trước khi công bố.
2. **Privacy Policy:** một chính sách EN/VI cho bản hiện tại và account/cloud tương lai; tách rõ luồng đang hoạt động với kế hoạch chưa triển khai. `PRIVACY-POLICY.md` đã có bản nháp ghi các dịch vụ/luồng hiện thấy, local storage, log lỗi và cloud dự kiến. Còn các placeholder (chủ thể, email, URL, ngày hiệu lực), xác minh nhà cung cấp/retention và rà soát pháp lý trước công bố.
3. **Nhật ký lỗi ứng dụng:** giữ cách hiện tại — tối đa 200 mục trong `browser.storage.local`, chỉ gồm thời gian, component, severity và code đã phân loại; không ghi URL trang, nội dung trang, text được chọn, thông tin tài khoản hay stack. Không tự gửi log lên server; chỉ tạo JSON khi người dùng chủ động Export trong Dashboard. Chưa thêm nút xóa log; Privacy Policy phải công bố cách lưu/export này.
4. **Thành phần bên thứ ba:** full license texts đã gom vào `licenses/`, danh mục ở `THIRD_PARTY_NOTICES.md`; thêm toàn văn Apache-2.0 cho Mozilla Readability. Cần xác minh version/source revision của các dependency và provider links trước phát hành. Twemoji Country Flags vẫn chỉ ở demo, chưa nằm trong extension.
5. **Store review:** trước phát hành, đồng bộ Privacy Policy với các trường công bố và consent trong Chrome; rà soát khai báo thu thập dữ liệu Firefox trong manifest. Sau Bước 1, stylesheet Google Fonts chỉ được gắn khi custom font được bật/chọn; Dashboard vẫn có thể gửi URL tới Google S2 Favicon khi favicon trực tiếp lỗi. Cần xác minh Network thực tế và giữ disclosure chính xác.

## Tóm tắt thay đổi đã thực hiện — tài liệu còn chờ người dùng duyệt

- **TTS:** mặc định tốc độ riêng ngôn ngữ hiển thị đổi 1.2×→1.25× cho EN/VI/KO; Dashboard hỗ trợ bước 0.05 và hiển thị 1.25 chính xác. TTS global vẫn 1.0×; mặc định flashcard độc lập vẫn 1.2×. File: `config.js`, `dashboard.js`, `dashboard.html`.
- **License:** tạo `LICENSE` nháp độc quyền/All Rights Reserved cho phần Keepit gốc; giữ riêng quyền của third-party. Chuyển toàn văn license bên thứ ba vào `licenses/`; thêm Apache-2.0 cho Mozilla Readability; cập nhật danh mục và đường dẫn README.
- **Privacy Policy:** tạo `PRIVACY-POLICY.md` bản nháp EN/VI, phân biệt hiện trạng với cloud tương lai chưa hoạt động. Mô tả lưu local, hồ sơ demo local, log lỗi, dịch/từ điển/TTS, Google Fonts (sau Bước 1 chỉ được tải khi custom font bật/chọn) và fallback favicon. `README.md` và `PROJECT.md` đã cập nhật.
- **Sơ đồ hồ sơ tài liệu:**

```text
Keep-it/
├── LICENSE                         # Keepit gốc: proprietary; còn placeholder chủ thể quyền
├── PRIVACY-POLICY.md               # Bản nháp EN/VI; cloud được ghi là chưa hoạt động
├── THIRD_PARTY_NOTICES.md          # Bảng kê, attribution và liên kết license
├── licenses/                       # Toàn văn giấy phép của thư viện/asset được đóng gói
│   ├── LICENSE-Apache-2.0-Mozilla-Readability.txt
│   ├── LICENSE-ISC-lucide.txt
│   ├── LICENSE-MIT-flag-icons.txt
│   └── LICENSE-MPL-2.0-webextension-polyfill.txt
├── README.md                       # Mô tả privacy và đường dẫn license/policy
└── PROJECT.md                      # Nhật ký thay đổi và việc còn mở
```

- **Trước khi công bố:** điền chủ thể bản quyền, email liên hệ, URL công khai và ngày hiệu lực; xác minh version/provider, rà soát pháp lý và khai báo/consent trên Chrome/Firefox. Bước 1 đã chuyển Google Fonts sang tải theo nhu cầu và đã đóng gói ZIP kiểm thử v3.4.554; cần người dùng xác nhận Network/font trên Chrome/Firefox trước khi xem là đã duyệt hoặc dùng làm bản phát hành.

## Kiểm thử
- TTS: đã chạy `node --check` cho toàn bộ JS, parse manifest, test mock giá trị/biên/format và `git diff --check`; chưa kiểm tra Chrome/Firefox thật.
- Tài liệu: kiểm tra liên kết cục bộ, nội dung license MPL/ISC giữ nguyên khi di chuyển, policy có các endpoint và placeholder đã biết; chưa kiểm tra yêu cầu store hoặc rà soát pháp lý.
- Chưa đo hiệu năng trên trang thực. Khi triển khai, đo trước/sau và kiểm tra Chrome/Firefox.
