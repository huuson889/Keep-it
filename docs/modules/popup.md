# Popup — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Popup là bảng điều khiển nhanh của extension: cài đặt phổ biến, trạng thái website đang mở, phím tắt, theme và liên kết tới Dashboard. Khi tab đang hoạt động mở PDF, Background hiện một cửa sổ gợi ý nhỏ ở góc phải trên; đây là cửa sổ extension riêng, không phải lớp được chèn vào viewer PDF nội bộ.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/popup.html`](../../pages/popup.html), [`js/popup/popup.js`](../../js/popup/popup.js) | `load`, event handlers | Popup settings và CTA dự phòng cho PDF. |
| [`pages/pdf-suggestion.html`](../../pages/pdf-suggestion.html), [`js/popup/pdf-suggestion.js`](../../js/popup/pdf-suggestion.js), [`css/popup/pdf-suggestion.css`](../../css/popup/pdf-suggestion.css) | `initializeHint` | Cửa sổ nổi có dịch nhãn, nút đóng và route sang Tài liệu. |
| [`js/background/background.js`](../../js/background/background.js) | `pdfTabSource`, `showFloatingPdfHint` | Nhận diện URL PDF, badge và mở một gợi ý theo tab. |
| [`js/core/defaults.js`](../../js/core/defaults.js), [`js/core/config.js`](../../js/core/config.js) | `LHN_DEFAULTS`, `LHN_CONFIG` | Defaults, setting keys và cài đặt chuẩn. |
| [`js/core/settings.js`](../../js/core/settings.js), [`js/core/languages.js`](../../js/core/languages.js) | `LHN_SETTINGS`, `LHN_LANGUAGES` | Resolve/lưu settings và dịch giao diện. |
| [`js/core/messaging.js`](../../js/core/messaging.js), [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING`, `OPEN_DASHBOARD_DOCUMENTS`, PDF badge | Định tuyến Dashboard/Tài liệu và đánh dấu tab PDF nhận diện được. |

## 3. Luồng chính

1. `popup.html` nạp polyfill, config/defaults, settings/languages và shared helpers trước `popup.js`.
2. Background theo dõi navigation/activation; `pdfTabSource()` nhận diện `.pdf` trực tiếp hoặc URL nguồn trong `src`/`file`/`url` của Chrome/Firefox viewer. Badge `PDF` hỗ trợ người dùng nếu cửa sổ gợi ý bị đóng.
3. Khi tab PDF đang active, `showFloatingPdfHint()` tạo cửa sổ popup extension ở góc phải trên, tối đa một gợi ý cho mỗi tệp/tab. Popup lấy ngôn ngữ/theme, có thể đóng, hoặc gửi `OPEN_DASHBOARD_DOCUMENTS`.
4. Background tái sử dụng Dashboard hiện có hoặc mở route Tài liệu; người dùng tự chọn file local. Không redirect tab PDF, không fetch hoặc đọc nội dung viewer.
5. Thay đổi controls chuẩn hóa các giá trị rồi lưu qua `LHN_SETTINGS`; các nút Dashboard/settings/usage tiếp tục dùng message Background và báo lỗi context/tab thay vì giả định thành công.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ script order: `defaults.js` trước `config.js`, rồi settings/languages trước `popup.js`.
- Dùng `LHN_SETTINGS.resolve/save` và `LHN_CONFIG.STORAGE_KEYS`; không tạo bản sao defaults hoặc key riêng cho setting dùng chung.
- Giữ logic loại trừ giữa các chế độ dịch popup/icon/auto-open; cập nhật đồng bộ disabled state, tooltip và persistence khi đổi quy tắc.
- Website được chuẩn hóa bỏ `www.` để so với danh sách disabled; không lưu URL đầy đủ thay hostname nếu hợp đồng setting là domain.
- Popup chỉ gửi message mở Dashboard/Tài liệu; Background xử lý tab reuse/focus. Tránh tạo luồng tab thứ hai trong popup.
- PDF nhận diện theo path `.pdf`, không theo MIME; hỗ trợ trực tiếp `file:`/HTTP(S) và nguồn bọc trong URL nội bộ viewer. Gợi ý là cửa sổ extension riêng, không thể phủ DOM của browser PDF viewer; chỉ tự hiện với tab PDF đang active, một lần theo URL/tab, có thể đóng. CTA không chuyển file tự động—người dùng phải chọn bản local trong Documents.

## 5. Kiểm tra và xác minh

- Static: `node --check` cho popup/background/dashboard; kiểm tra `.pdf`, URL Chrome/Firefox viewer bọc `src`/`file`, nội dung ngôn ngữ và route `OPEN_DASHBOARD_DOCUMENTS`; `git diff --check`.
- Browser: kiểm tra Chrome/Firefox mở PDF `file://` active → cửa sổ góc phải, đóng/auto-dismiss, switch tab, không lặp theo cùng URL, CTA sang Dashboard > Tài liệu trong cửa sổ nguồn (hoặc focus Dashboard đang mở); thử cả PDF web và URL không phải PDF.
- Kiểm tra máy người dùng cần xác nhận vị trí popup, focus, và viewer nội bộ cụ thể; static test không thay browser-test.
