# Content — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Content scripts gắn tính năng Keepit vào trang web: highlight, khôi phục annotation, note, popup dịch/từ điển, Sidebar và shortcut. `content.js` điều phối các tiện ích; logic nền tảng dùng chung nằm ở `core`, còn dữ liệu annotation chính được xử lý qua Background.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Nạp helpers trước `content.js` ở top frame; entry sớm khác chạy `document_start`. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE content controller | Khởi tạo settings, selection, popup, Sidebar, annotation và event listeners. |
| [`js/content/web-highlighter.js`](../../js/content/web-highlighter.js) | `LHNWebHighlighter.create` | Tô/khôi phục highlight và gắn event vào mark. |
| [`js/content/annotation-restore.js`](../../js/content/annotation-restore.js) | `LHN_ANNOTATION_RESTORE.create` | Tìm lại text/range trên trang động. |
| [`js/content/note-composer.js`](../../js/content/note-composer.js) | `LHN_NOTE_COMPOSER` | Tạo record và xác định nội dung note có thay đổi không. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js), [`js/content/ui-components.js`](../../js/content/ui-components.js) | `LHN_SIDEBAR`, `LHN_UI_COMPONENTS` | Dựng Sidebar/card và component tag editor. |
| [`js/content/page-layout.js`](../../js/content/page-layout.js), [`js/content/sentence-note.js`](../../js/content/sentence-note.js) | `LHN_PAGE_LAYOUT`, `LHN_SENTENCE_NOTE` | Phục hồi layout trang và trích context cho note. |

## 3. Luồng chính

1. Manifest nạp các factory/module trước `content.js`; controller có guard chống khởi tạo lặp trên cùng trang.
2. `content.js` đọc settings từ `LHN_SETTINGS`/`browser.storage.local`, rồi nối các helper và listener cho lựa chọn chữ, phím tắt, popup và Sidebar.
3. Khi lưu/sửa/xóa annotation, controller tạo record bằng `LHN_NOTE_COMPOSER` rồi gửi message `ADD`, `UPDATE` hoặc `DELETE` qua `LHN_MESSAGING` tới Background.
4. Khi trang tải hoặc thay đổi DOM, annotation lấy từ Background; `LHN_ANNOTATION_RESTORE` tìm range và `LHNWebHighlighter` dựng mark, có observer/retry cho trang động.
5. Shortcut YouTube được phát thành custom event; module video xử lý Dual Sub/Dictation. Các action Reader và Dashboard cũng được chuyển qua event/message tương ứng.

## 4. Hợp đồng và quy tắc cần giữ

- Không đổi thứ tự nạp trong manifest: các dependency `LHN_*` phải được tạo trước khi `content.js` gọi chúng.
- Annotation record đi qua Background; giữ payload `item`, `id`, `url`, `origin` và các loại message mà Dashboard/Sidebar cùng dùng.
- `web-highlighter.js`, `annotation-restore.js`, `note-composer.js`, `page-layout.js` là các helper/factory; giữ ranh giới chức năng thay vì nhân bản logic vào controller.
- Các thao tác chọn/chữ không được chặn nhập liệu trong input/contenteditable; giữ guard shortcut và hành vi selection khi sửa listener.
- Khi thay đổi DOM trên trang, loại trừ vùng UI của extension khỏi khôi phục/selection để tránh tự bắt nội dung Keepit.
- Tên custom event nối Content với Video/Reader là API nội bộ; tìm consumer trước khi đổi.

## 5. Kiểm tra và xác minh

- Static: `for f in js/content/*.js; do node --check "$f" || exit; done`; xác nhận file trong manifest tồn tại và `git diff --check`.
- Annotation: thử lưu, sửa, xóa, reload trang, khôi phục highlight, điều hướng trang động và mở record từ Sidebar/Dashboard.
- Selection/UI: thử popup dịch/từ điển, auto note, website-disable và shortcut; lặp lại trên trang có input, iframe hoặc DOM thay đổi để phát hiện listener xung đột.
- Browser verification phải ghi rõ trình duyệt và hành vi đã chạy; static check không thay thế kiểm thử trang thật.
