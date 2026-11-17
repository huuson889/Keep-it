# Popup — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Popup là bảng điều khiển nhanh của extension: cài đặt phổ biến, trạng thái website đang mở, phím tắt, theme và liên kết tới Dashboard. Với URL tab có đuôi `.pdf`, popup hiện gợi ý chuyển sang Tài liệu Keepit; gợi ý không tự chuyển hướng hay đọc tệp từ browser viewer.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/popup.html`](../../pages/popup.html) | HTML controls và script order | Markup, CSS và nạp dependency trước popup controller. |
| [`js/popup/popup.js`](../../js/popup/popup.js) | `load`, event handlers | Đọc, hiển thị và lưu controls; xử lý website hiện tại. |
| [`js/core/defaults.js`](../../js/core/defaults.js), [`js/core/config.js`](../../js/core/config.js) | `LHN_DEFAULTS`, `LHN_CONFIG` | Defaults, setting keys và cài đặt chuẩn. |
| [`js/core/settings.js`](../../js/core/settings.js), [`js/core/languages.js`](../../js/core/languages.js) | `LHN_SETTINGS`, `LHN_LANGUAGES` | Resolve/lưu settings và dịch giao diện. |
| [`js/core/messaging.js`](../../js/core/messaging.js), [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING`, `OPEN_DASHBOARD_DOCUMENTS`, PDF badge | Định tuyến Dashboard/Tài liệu và đánh dấu tab PDF nhận diện được. |

## 3. Luồng chính

1. `popup.html` nạp polyfill, config/defaults, settings/languages và shared helpers trước `popup.js`.
2. `load()` lấy settings, đọc URL tab đang active; URL HTTP(S)/`file:` có path kết thúc `.pdf` sẽ hiện gợi ý cục bộ và Background đánh dấu badge `PDF` trên icon Keepit.
3. CTA `Open with Keepit` gửi `OPEN_DASHBOARD_DOCUMENTS`; Background tái sử dụng Dashboard hiện có hoặc mở route Tài liệu. Gợi ý nhắc người dùng lưu/tải PDF trước rồi chọn bản local; không tự redirect, fetch hay đọc PDF trong viewer.
4. Thay đổi controls chuẩn hóa các giá trị rồi lưu qua `LHN_SETTINGS`; listener storage giúp Popup phản ánh thay đổi hợp lệ từ nơi khác nếu còn mở.
5. Nút Dashboard và các phần usage/key tiếp tục gửi message Background; website disable được cấu hình theo hostname hiện tại, lỗi context/tab hạn chế cần hiện feedback.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ script order: `defaults.js` trước `config.js`, rồi settings/languages trước `popup.js`.
- Dùng `LHN_SETTINGS.resolve/save` và `LHN_CONFIG.STORAGE_KEYS`; không tạo bản sao defaults hoặc key riêng cho setting dùng chung.
- Giữ logic loại trừ giữa các chế độ dịch popup/icon/auto-open; cập nhật đồng bộ disabled state, tooltip và persistence khi đổi quy tắc.
- Website được chuẩn hóa bỏ `www.` để so với danh sách disabled; không lưu URL đầy đủ thay hostname nếu hợp đồng setting là domain.
- Popup chỉ gửi message mở Dashboard/Tài liệu; Background xử lý tab reuse/focus. Tránh tạo luồng tab thứ hai trong popup.
- PDF nhận diện theo phần mở rộng `.pdf` trong URL, không theo MIME; không hứa hỗ trợ URL PDF không có đuôi này. Gợi ý là opt-in, không tự điều hướng. File cần được tải/lưu xuống rồi chọn trong Documents vì browser PDF viewer không cung cấp blob cho Keepit.

## 5. Kiểm tra và xác minh

- Static: `node --check js/popup/popup.js` và `js/background/background.js`; kiểm tra mọi script/style path trong `pages/popup.html`, route Dashboard và `git diff --check`.
- Browser: mở Popup trên URL PDF thường, `.PDF` có query, URL không phải PDF và file URL; kiểm tra badge theo tab, CTA chỉ hiện đúng ngữ cảnh và mở Dashboard > Tài liệu.
- Kiểm tra phần hướng dẫn tải/chọn file không gây hiểu nhầm; thử Chrome/Firefox riêng vì hành vi URL của viewer tích hợp có thể khác. Các bước browser chưa được xác nhận nếu chưa chạy thực tế.
