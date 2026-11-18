# Popup — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Popup toolbar là bảng cài đặt/action và thẻ PDF context khi tab hiện tại là PDF. Gợi ý nổi là iframe overlay trong document PDF, không tạo cửa sổ/tab riêng; Background cập nhật badge.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/popup.html`](../../pages/popup.html), [`js/popup/popup.js`](../../js/popup/popup.js), [`css/popup/popup.css`](../../css/popup/popup.css) | `load`, `pdfSourceUrl`, PDF card handler | Bảng cài đặt/action; khi active tab là PDF hiện thẻ PDF gọn, nhấn mở đúng tệp. |
| [`pages/pdf-suggestion.html`](../../pages/pdf-suggestion.html), [`js/popup/pdf-suggestion.js`](../../js/popup/pdf-suggestion.js), [`css/popup/pdf-suggestion.css`](../../css/popup/pdf-suggestion.css) | injected PDF iframe | Background mount iframe fixed trong PDF document; card mở PDF, X thu icon và icon mở lại. |
| [`js/background/background.js`](../../js/background/background.js) | `pdfTabSource`, `showPdfHint`, `removePdfHint` | Nhận diện PDF, badge và mount/remove iframe nổi bằng `scripting.executeScript`. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js), [`js/dashboard/documents.js`](../../js/dashboard/documents.js) | dashboard `openPdf`, `openPdfFromUrl` | Nhập và mở trực tiếp PDF; file URL bị chặn thì hiện hướng dẫn bật quyền và nút chọn tệp. |
| [`js/core/defaults.js`](../../js/core/defaults.js), [`js/core/config.js`](../../js/core/config.js) | `LHN_DEFAULTS`, `LHN_CONFIG` | Defaults, setting keys và cài đặt chuẩn. |
| [`js/core/settings.js`](../../js/core/settings.js), [`js/core/languages.js`](../../js/core/languages.js) | `LHN_SETTINGS`, `LHN_LANGUAGES` | Resolve/lưu settings và dịch giao diện. |
| [`js/core/messaging.js`](../../js/core/messaging.js), [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING`, `OPEN_DASHBOARD_DOCUMENTS`, PDF badge | Định tuyến Dashboard/Tài liệu và đánh dấu tab PDF nhận diện được. |

## 3. Luồng chính

1. `popup.html` nạp core scripts và shared helpers trước `popup.js`.
2. Background theo dõi navigation/activation; `pdfTabSource()` nhận diện `.pdf` trực tiếp hoặc URL nguồn trong `src`/`file`/`url` của Chrome/Firefox viewer. Badge `PDF` được đặt trên toolbar; action popup hiện thẻ PDF gọn khi active tab là PDF.
3. Khi PDF active, Background inject iframe web-accessible vào PDF document, cách đáy thanh viewer Chrome 20px; không tạo cửa sổ. Khi rời tab/đổi URL, iframe được gỡ.
4. Cả thẻ toolbar và iframe nổi lấy đúng URL PDF/tên tệp. Click gửi `OPEN_DASHBOARD_DOCUMENTS`; overlay X thu gọn thành icon, bấm icon mở lại. Resize/close đi qua `postMessage` được kiểm tra theo source iframe và extension origin.
5. Background mở Dashboard > Tài liệu với URL PDF đã kiểm tra; Documents fetches HTTP(S)/file URL, nhập qua pipeline tài liệu hiện có rồi mở viewer. Nếu file URL bị chặn hoặc fetch lỗi, hiện localized file-access guide và nút chọn file.
6. Thay đổi controls chuẩn hóa các giá trị rồi lưu qua `LHN_SETTINGS`; các nút Dashboard/settings/usage tiếp tục dùng message Background và báo lỗi context/tab thay vì giả định thành công.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ script order: `defaults.js` trước `config.js`, rồi settings/languages trước `popup.js`.
- Dùng `LHN_SETTINGS.resolve/save` và `LHN_CONFIG.STORAGE_KEYS`; không tạo bản sao defaults hoặc key riêng cho setting dùng chung.
- Giữ loại trừ giữa dịch popup/icon/auto-open; đồng bộ disabled state, tooltip và persistence.
- Chuẩn hóa website bỏ `www.` để so với danh sách disabled; lưu hostname, không lưu full URL.
- Popup chỉ gửi message mở Dashboard/Tài liệu; Background xử lý tab reuse/focus. Tránh tạo luồng tab thứ hai trong popup.
- PDF nhận diện theo path `.pdf`, không theo MIME; hỗ trợ trực tiếp `file:`/HTTP(S) và nguồn bọc trong URL nội bộ viewer. Badge, thẻ PDF action popup và iframe overlay là ba thành phần riêng. File URL cần quyền “Allow access to file URLs”; nếu quyền tắt Chrome có thể chặn inject overlay. Khi import/fetch lỗi, Documents hiện hướng dẫn bật quyền và nút chọn tệp thủ công.

## 5. Kiểm tra và xác minh

- Static: `node --check` cho popup/background/dashboard; kiểm tra `.pdf`, URL Chrome/Firefox viewer bọc `src`/`file`, nội dung ngôn ngữ và route `OPEN_DASHBOARD_DOCUMENTS`; `git diff --check`.
- Static/mock: syntax, ID/assets, URL resolver, i18n, event lifecycle, listener postMessage origin/source validation, duplicate iframe guard, no `windows.create`.
- Browser cần test toàn luồng: PDF web/local → overlay trong tab, cách viewer bar 20px, không tạo cửa sổ/tab; X thu icon/mở lại; action popup card; click mở đúng PDF; badge; chuyển tab/navigation gỡ overlay; local access/picker fallback. Chrome 157/v3.5.374 đã xác nhận overlay trong tab; v3.5.375 cần xác minh offset và toolbar card.
