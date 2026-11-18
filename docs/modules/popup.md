# Popup — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Popup là bảng điều khiển nhanh của extension: cài đặt phổ biến, trạng thái website đang mở, phím tắt, theme và liên kết tới Dashboard. Khi tab đang hoạt động mở PDF, Background tự hiện một popup nổi gọn theo demo; popup toolbar cũng giữ thẻ PDF toàn vùng bấm. Badge PDF vẫn do Background cập nhật.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/popup.html`](../../pages/popup.html), [`js/popup/popup.js`](../../js/popup/popup.js), [`css/popup/popup.css`](../../css/popup/popup.css) | `load`, PDF card handler | Thẻ PDF toolbar bấm toàn vùng, nhận URL nguồn hiện tại. |
| [`pages/pdf-suggestion.html`](../../pages/pdf-suggestion.html), [`js/popup/pdf-suggestion.js`](../../js/popup/pdf-suggestion.js), [`css/popup/pdf-suggestion.css`](../../css/popup/pdf-suggestion.css) | floating PDF card | Popup tự hiện theo tab PDF; toàn card mở PDF, X thu gọn thành icon và icon mở lại. |
| [`js/background/background.js`](../../js/background/background.js) | `pdfTabSource`, `showFloatingPdfHint` | Nhận diện PDF, badge, tự hiện/đóng popup theo tab. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js), [`js/dashboard/documents.js`](../../js/dashboard/documents.js) | dashboard `openPdf`, `openPdfFromUrl` | Nhập và mở trực tiếp PDF; file URL bị chặn thì hiện hướng dẫn bật quyền và nút chọn tệp. |
| [`js/core/defaults.js`](../../js/core/defaults.js), [`js/core/config.js`](../../js/core/config.js) | `LHN_DEFAULTS`, `LHN_CONFIG` | Defaults, setting keys và cài đặt chuẩn. |
| [`js/core/settings.js`](../../js/core/settings.js), [`js/core/languages.js`](../../js/core/languages.js) | `LHN_SETTINGS`, `LHN_LANGUAGES` | Resolve/lưu settings và dịch giao diện. |
| [`js/core/messaging.js`](../../js/core/messaging.js), [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING`, `OPEN_DASHBOARD_DOCUMENTS`, PDF badge | Định tuyến Dashboard/Tài liệu và đánh dấu tab PDF nhận diện được. |

## 3. Luồng chính

1. `popup.html` nạp polyfill, config/defaults, settings/languages và shared helpers trước `popup.js`.
2. Background theo dõi navigation/activation; `pdfTabSource()` nhận diện `.pdf` trực tiếp hoặc URL nguồn trong `src`/`file`/`url` của Chrome/Firefox viewer. Badge `PDF` vẫn được đặt trên toolbar, đồng thời popup nổi tự hiện khi PDF hoàn tất hoặc tab PDF được kích hoạt.
3. Popup nổi lấy URL PDF/tên tệp và theme, dùng cùng hành vi mở của thẻ toolbar. Bấm card để mở; X chỉ thu cửa sổ thành icon, bấm icon để mở lại. Khi tab popup vừa tạo còn URL rỗng/`about:blank`, listener chờ navigation thay vì tự đóng.
4. Background mở Dashboard > Tài liệu với URL PDF đã kiểm tra; Documents fetches HTTP(S)/file URL, nhập qua pipeline tài liệu hiện có rồi mở viewer. File URL không được phép hoặc fetch lỗi hiện localized file-access guide và nút chọn file. Không chuyển hướng tab PDF.
5. Thay đổi controls chuẩn hóa các giá trị rồi lưu qua `LHN_SETTINGS`; các nút Dashboard/settings/usage tiếp tục dùng message Background và báo lỗi context/tab thay vì giả định thành công.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ script order: `defaults.js` trước `config.js`, rồi settings/languages trước `popup.js`.
- Dùng `LHN_SETTINGS.resolve/save` và `LHN_CONFIG.STORAGE_KEYS`; không tạo bản sao defaults hoặc key riêng cho setting dùng chung.
- Giữ logic loại trừ giữa các chế độ dịch popup/icon/auto-open; cập nhật đồng bộ disabled state, tooltip và persistence khi đổi quy tắc.
- Website được chuẩn hóa bỏ `www.` để so với danh sách disabled; không lưu URL đầy đủ thay hostname nếu hợp đồng setting là domain.
- Popup chỉ gửi message mở Dashboard/Tài liệu; Background xử lý tab reuse/focus. Tránh tạo luồng tab thứ hai trong popup.
- PDF nhận diện theo path `.pdf`, không theo MIME; hỗ trợ trực tiếp `file:`/HTTP(S) và nguồn bọc trong URL nội bộ viewer. Badge `PDF`, popup nổi tự hiện và thẻ popup toolbar là ba yếu tố riêng; toàn bộ card đều là CTA. File URL cần quyền “Allow access to file URLs”; khi tắt/không truy cập được, Documents hướng dẫn bật quyền và giữ nút Choose PDF để nhập thủ công.

## 5. Kiểm tra và xác minh

- Static: `node --check` cho popup/background/dashboard; kiểm tra `.pdf`, URL Chrome/Firefox viewer bọc `src`/`file`, nội dung ngôn ngữ và route `OPEN_DASHBOARD_DOCUMENTS`; `git diff --check`.
- Browser: kiểm tra Chrome/Firefox mở PDF web/local → popup nổi tự hiện; X thu gọn và icon mở lại; click card mở đúng PDF; toolbar badge + card; local access on/off, guide/manual file-picker fallback; tab thường đóng popup; Dashboard reuse. Browser QA chưa chạy thì không coi static checks là xác nhận.
- Kiểm tra máy người dùng cần xác nhận vị trí popup, focus, và viewer nội bộ cụ thể; static test không thay browser-test.
