# Popup — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Popup là bảng điều khiển nhanh của extension: cài đặt phổ biến, trạng thái website đang mở, phím tắt, theme và liên kết tới Dashboard. Nó không sở hữu nguồn defaults/settings riêng; dữ liệu cài đặt dùng chung với các context khác.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/popup.html`](../../pages/popup.html) | HTML controls và script order | Markup, CSS và nạp dependency trước popup controller. |
| [`js/popup/popup.js`](../../js/popup/popup.js) | `load`, event handlers | Đọc, hiển thị và lưu controls; xử lý website hiện tại. |
| [`js/core/defaults.js`](../../js/core/defaults.js), [`js/core/config.js`](../../js/core/config.js) | `LHN_DEFAULTS`, `LHN_CONFIG` | Defaults, setting keys và cài đặt chuẩn. |
| [`js/core/settings.js`](../../js/core/settings.js), [`js/core/languages.js`](../../js/core/languages.js) | `LHN_SETTINGS`, `LHN_LANGUAGES` | Resolve/lưu settings và dịch giao diện. |
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Gửi yêu cầu mở Dashboard hoặc đọc usage status. |

## 3. Luồng chính

1. `popup.html` nạp polyfill, config/defaults, settings/languages và shared helpers trước `popup.js`.
2. `load()` lấy settings từ `browser.storage.local`, xác định hostname của tab đang active, áp dụng ngôn ngữ/theme và điền trạng thái controls.
3. Thay đổi controls chuẩn hóa các giá trị rồi lưu qua `LHN_SETTINGS`; listener storage giúp Popup phản ánh thay đổi hợp lệ từ nơi khác nếu còn mở.
4. Nút Dashboard gửi `OPEN_DASHBOARD` hoặc `OPEN_DASHBOARD_SETTINGS` qua `LHN_MESSAGING`; website disable được cấu hình theo hostname hiện tại.
5. Các phần usage/key đọc trạng thái hoặc kích hoạt qua message Background; lỗi context/tab hạn chế cần hiện feedback thay vì giả định thành công.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ script order: `defaults.js` trước `config.js`, rồi settings/languages trước `popup.js`.
- Dùng `LHN_SETTINGS.resolve/save` và `LHN_CONFIG.STORAGE_KEYS`; không tạo bản sao defaults hoặc key riêng cho setting dùng chung.
- Giữ logic loại trừ giữa các chế độ dịch popup/icon/auto-open; cập nhật đồng bộ disabled state, tooltip và persistence khi đổi quy tắc.
- Website được chuẩn hóa bỏ `www.` để so với danh sách disabled; không lưu URL đầy đủ thay hostname nếu hợp đồng setting là domain.
- Popup chỉ gửi message mở Dashboard; Background xử lý tab reuse/focus. Tránh tạo luồng tab thứ hai trong popup.

## 5. Kiểm tra và xác minh

- Static: `node --check js/popup/popup.js`; kiểm tra mọi script/style path trong `pages/popup.html` và `git diff --check`.
- Browser: mở Popup trên trang HTTP(S) và trang bị hạn chế; kiểm tra ngôn ngữ, theme, website status, toggle/shortcut save rồi mở lại để xác nhận persistence.
- Kiểm tra các setting phụ thuộc lẫn nhau, mở Dashboard/Settings, và xác nhận lỗi gửi message hiển thị đúng. Thử Chrome/Firefox nếu đổi API popup hoặc tabs.
