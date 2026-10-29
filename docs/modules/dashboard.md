# Dashboard — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Dashboard là trang quản lý thư viện annotation, luyện flashcard và cài đặt. `dashboard.js` điều phối state và DOM; các file sibling cung cấp phần view/algorithm/helper. Annotation CRUD thuộc Background; settings và một số preference được lưu trực tiếp bằng `browser.storage.local`.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/dashboard.html`](../../pages/dashboard.html) | `<script>` order, view IDs | Markup, stylesheets và thứ tự nạp helpers trước entry. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js) | `load`, `render`, event handlers | Entry/controller cho thư viện, settings, flashcard và profile. |
| [`js/dashboard/library.js`](../../js/dashboard/library.js) | `LHN_LIBRARY` | Metadata, nhóm trang và key trang của annotation. |
| [`js/dashboard/study-view.js`](../../js/dashboard/study-view.js), [`js/dashboard/study-utils.js`](../../js/dashboard/study-utils.js) | `LHN_STUDY_VIEW`, `LHN_STUDY_UTILS` | Render flashcard và thuật toán tiện ích thuần. |
| [`js/dashboard/settings-ui.js`](../../js/dashboard/settings-ui.js) | `LHN_DASHBOARD_SETTINGS_UI` | Bộ chọn ngôn ngữ, website và tìm Settings. |
| [`js/dashboard/backup.js`](../../js/dashboard/backup.js), [`js/dashboard/account.js`](../../js/dashboard/account.js) | `LHN_BACKUP`, `LHN_ACCOUNT` | Helper import/export và dữ liệu profile demo. |
| [`js/dashboard/profile-stats.js`](../../js/dashboard/profile-stats.js) | `LHN_PROFILE_STATS` | Tổng hợp số liệu hồ sơ từ annotation. |
| [`js/dashboard/flags.js`](../../js/dashboard/flags.js) | module side effect | Phát hiện/hỗ trợ emoji cờ cho trang Dashboard. |

## 3. Luồng chính

1. `dashboard.html` nạp core và helpers trước `dashboard.js`; giữ thứ tự khi thêm hoặc chuyển script.
2. `load()` lấy settings/preferences từ storage và annotation theo batch qua `LHN_MESSAGING`; `render()` điều phối view thư viện và các panel.
3. Sửa/xóa/review annotation gửi message tới Background, nơi sở hữu IndexedDB; `origin` giúp tránh xử lý lặp sự kiện do chính Dashboard tạo.
4. Flashcard dùng `study-utils` cho thuật toán và `study-view` cho DOM; bản dịch, TTS và định nghĩa đi qua module Translate/Reader/background tương ứng.
5. Import/export có thể cập nhật annotations và favorites; phần UI cần phản ánh kết quả trả về thay vì tự giả định commit thành công.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ hai view chính và trách nhiệm hiện tại: Trang chủ/thư viện và Luyện ngữ pháp; kiểm tra `PROJECT.md` cùng DOM IDs trước khi đổi navigation.
- Annotation được lưu qua Background message (`GET_BATCH`, `UPDATE`, `DELETE`, `REVIEW_ANNOTATION`, `IMPORT`); không gọi IndexedDB trực tiếp từ Dashboard.
- Settings, favorites, study preferences và Reader preferences có các storage keys riêng; dùng `LHN_DEFAULTS`/`LHN_SETTINGS` thay vì thêm default cục bộ.
- Các helper được nạp theo thứ tự và expose API `LHN_*`; khi đổi contract phải cập nhật mọi consumer trong `dashboard.js`/HTML.
- Đồng bộ storage change và message events; cập nhật optimistic UI chỉ khi có xử lý lỗi/rollback phù hợp.
- `flags.js` nằm trong `dashboard/`; cột bảng trên trang này chỉ nêu file phụ trợ chính, không phải danh sách đầy đủ mọi script.

## 5. Kiểm tra và xác minh

- Static: `for f in js/dashboard/*.js; do node --check "$f" || exit; done`; parse `manifest.json` và kiểm tra mọi script/style path trong `pages/dashboard.html`.
- Thử library load/paging, filter/sort/favorites, sửa/xóa/import/export và refresh để xác nhận dữ liệu bền vững.
- Thử flashcard: queue, review grades, progress, shortcuts, focus mode, translation/TTS và settings restore.
- Kiểm tra responsive/views/sidebar/theme trên trình duyệt; chỉ mô phỏng JS/DOM không xác nhận bố cục thật.
