# Popup — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Popup toolbar là bảng cài đặt/action. PDF handoff là iframe overlay trong document PDF, không tạo cửa sổ/tab riêng; Background cập nhật badge.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/popup.html`](../../pages/popup.html), [`js/popup/popup.js`](../../js/popup/popup.js), [`css/popup/popup.css`](../../css/popup/popup.css) | `load` | Bảng cài đặt/action popup chuẩn; không thêm PDF card vào toolbar popup. |
| [`pages/pdf-suggestion.html`](../../pages/pdf-suggestion.html), [`js/popup/pdf-suggestion.js`](../../js/popup/pdf-suggestion.js), [`css/popup/pdf-suggestion.css`](../../css/popup/pdf-suggestion.css) | injected PDF iframe | Background mount iframe fixed trong PDF document; card mở PDF, X thu icon và icon mở lại. |
| [`js/background/background.js`](../../js/background/background.js) | `pdfTabSource`, `showPdfHint`, `removePdfHint` | Nhận diện PDF, badge và mount/remove iframe nổi bằng `scripting.executeScript`. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js), [`js/dashboard/documents.js`](../../js/dashboard/documents.js) | dashboard `openPdf`, `openPdfFromUrl` | Nhập và mở trực tiếp PDF; file URL bị chặn thì hiện hướng dẫn bật quyền và nút chọn tệp. |
| [`js/core/defaults.js`](../../js/core/defaults.js), [`js/core/config.js`](../../js/core/config.js) | `LHN_DEFAULTS`, `LHN_CONFIG` | Defaults, setting keys và cài đặt chuẩn. |
| [`js/core/settings.js`](../../js/core/settings.js), [`js/core/languages.js`](../../js/core/languages.js) | `LHN_SETTINGS`, `LHN_LANGUAGES` | Resolve/lưu settings và dịch giao diện. |
| [`js/core/messaging.js`](../../js/core/messaging.js), [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING`, `OPEN_DASHBOARD_DOCUMENTS`, PDF badge | Định tuyến Dashboard/Tài liệu và đánh dấu tab PDF nhận diện được. |

## 3. Luồng chính

1. `popup.html` nạp polyfill, config/defaults, settings/languages và shared helpers trước `popup.js`.
2. Background theo dõi navigation/activation; `pdfTabSource()` nhận diện `.pdf` trực tiếp hoặc URL nguồn trong `src`/`file`/`url` của Chrome/Firefox viewer. Badge `PDF` được đặt trên toolbar; không thêm card PDF vào action popup.
3. Khi PDF active/hoàn tất, Background dùng `scripting.executeScript` ở main frame để gắn iframe web-accessible, fixed ở góc PDF document. Không gọi `windows.create` cho gợi ý này; khi rời tab hoặc điều hướng khỏi PDF, iframe được gỡ.
4. Iframe lấy URL PDF/tên/theme, bấm card gửi `OPEN_DASHBOARD_DOCUMENTS`; X thu gọn thành icon, bấm icon mở lại. Resize/close đi qua `postMessage` được kiểm tra theo source iframe và extension origin.
5. Background mở Dashboard > Tài liệu với URL PDF đã kiểm tra; Documents fetches HTTP(S)/file URL, nhập qua pipeline tài liệu hiện có rồi mở viewer. Nếu file URL bị chặn hoặc fetch lỗi, hiện localized file-access guide và nút chọn file.
6. Thay đổi controls chuẩn hóa các giá trị rồi lưu qua `LHN_SETTINGS`; các nút Dashboard/settings/usage tiếp tục dùng message Background và báo lỗi context/tab thay vì giả định thành công.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ script order: `defaults.js` trước `config.js`, rồi settings/languages trước `popup.js`.
- Dùng `LHN_SETTINGS.resolve/save` và `LHN_CONFIG.STORAGE_KEYS`; không tạo bản sao defaults hoặc key riêng cho setting dùng chung.
- Giữ loại trừ giữa dịch popup/icon/auto-open; đồng bộ disabled state, tooltip và persistence.
- Chuẩn hóa website bỏ `www.` để so với danh sách disabled; lưu hostname, không lưu full URL.
- Popup chỉ gửi message mở Dashboard/Tài liệu; Background xử lý tab reuse/focus. Tránh tạo luồng tab thứ hai trong popup.
- PDF nhận diện theo path `.pdf`, không theo MIME; hỗ trợ trực tiếp `file:`/HTTP(S) và nguồn bọc trong URL nội bộ viewer. Badge PDF và iframe overlay là hai yếu tố riêng; action popup không chứa PDF card. File URL cần quyền “Allow access to file URLs”; nếu quyền tắt thì Chrome có thể chặn cả inject overlay lẫn fetch. Khi quyền bật nhưng import/fetch lỗi, Documents hướng dẫn bật quyền và chọn tệp thủ công.

## 5. Kiểm tra và xác minh

- Static: `node --check` cho popup/background/dashboard; kiểm tra `.pdf`, URL Chrome/Firefox viewer bọc `src`/`file`, nội dung ngôn ngữ và route `OPEN_DASHBOARD_DOCUMENTS`; `git diff --check`.
- Static/mock: syntax, ID/assets, URL resolver, i18n, event lifecycle, listener postMessage origin/source validation, duplicate iframe guard, no `windows.create`.
- Browser cần retest toàn luồng: PDF web/local → iframe overlay trong tab, không tạo cửa sổ/tab; X thu icon/mở lại; click mở đúng PDF; badge; chuyển tab/navigation gỡ overlay; local access và picker fallback. Chrome 157/v3.5.373 đã probe `scripting.executeScript`, tải iframe asset và hit-test fixed iframe ở top layer trên PDF local/online; chưa browser-test đầy đủ v3.5.374.
