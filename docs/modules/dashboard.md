# Dashboard — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Dashboard quản lý thư viện annotation, flashcards, cài đặt và hồ sơ. `dashboard.js` điều phối state/DOM; annotation CRUD thuộc Background, còn settings và một số preference lưu qua `browser.storage.local`.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/dashboard.html`](../../pages/dashboard.html) | `<script>`, view IDs, `data-dashboard-view` | Markup, stylesheets và thứ tự nạp helper/entry. |
| [`css/dashboard/overview.css`](../../css/dashboard/overview.css) | `#dashboardOverviewView`, `#dashboardListeningView` | Style scoped cho UI demo Tổng quan/Luyện nghe. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js) | `setDashboardView`, `load`, `render` | Điều hướng 4 view và điều phối thư viện/settings/study/profile. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES`, `LANGUAGES.t` | Bản dịch giao diện en/vi/ko. |
| [`js/dashboard/library.js`](../../js/dashboard/library.js) | `LHN_LIBRARY` | Metadata, nhóm trang và key annotation. |
| [`js/dashboard/study-view.js`](../../js/dashboard/study-view.js), [`js/dashboard/study-utils.js`](../../js/dashboard/study-utils.js) | `LHN_STUDY_VIEW`, `LHN_STUDY_UTILS` | Render flashcards và tiện ích thuật toán. |
| [`js/dashboard/settings-ui.js`](../../js/dashboard/settings-ui.js) | `LHN_DASHBOARD_SETTINGS_UI` | Bộ chọn ngôn ngữ, website và tìm Settings. |
| [`js/dashboard/backup.js`](../../js/dashboard/backup.js), [`js/dashboard/account.js`](../../js/dashboard/account.js) | `LHN_BACKUP`, `LHN_ACCOUNT` | Import/export và profile demo. |
| [`js/dashboard/profile-stats.js`](../../js/dashboard/profile-stats.js) | `LHN_PROFILE_STATS` | Tổng hợp số liệu hồ sơ từ annotation. |
| [`js/dashboard/flags.js`](../../js/dashboard/flags.js) | module side effect | Hỗ trợ emoji cờ cho Dashboard. |

## 3. Luồng chính

1. `dashboard.html` nạp core/helpers trước entry; giữ thứ tự script khi chỉnh markup.
2. `load()` đọc settings/preferences và lấy annotations theo batch qua `LHN_MESSAGING`; `render()` cập nhật thư viện và panel.
3. `setDashboardView()` chuyển Overview, Listening, Library (`#dashboardHomeView`) và Grammar; hai view đầu chỉ là UI tĩnh.
4. Sửa/xóa/review annotation gửi message tới Background (chủ sở hữu IndexedDB); `origin` tránh xử lý lặp sự kiện do Dashboard tạo.
5. Flashcards dùng `study-utils`/`study-view`; Translate, Reader và Background đảm nhiệm dịch, TTS, định nghĩa.
6. Import/export cập nhật annotations/favorites theo kết quả trả về.

## 4. Hợp đồng và quy tắc cần giữ

- Bốn route: Tổng quan, Luyện nghe, Thư viện (`home`) và Luyện ngữ pháp; các mục sidebar khác chưa điều hướng.
- Overview/Listening là dữ liệu minh họa tĩnh: không nối annotation, API, storage hoặc nghiệp vụ; nút mẫu không có handler.
- Chỉ `data-dashboard-view` đổi view; giữ luồng thư viện và `#profileSidebar` của Grammar.
- Chuỗi UI mới dùng `data-i18n`/`data-i18n-aria-label`, có bản dịch trong `MESSAGES` cho en, vi, ko.
- Annotation CRUD/review đi qua Background message (`GET_BATCH`, `UPDATE`, `DELETE`, `REVIEW_ANNOTATION`, `IMPORT`); không truy cập IndexedDB trực tiếp.
- Settings/favorites/study/Reader preferences có storage keys riêng; dùng `LHN_DEFAULTS`/`LHN_SETTINGS` khi cần default.
- Giữ thứ tự nạp helper và API `LHN_*`; đổi contract thì cập nhật consumer trong `dashboard.js`/HTML.
- Đồng bộ storage/message events; optimistic UI cần xử lý lỗi/rollback.
- `flags.js` nằm trong `dashboard/`; bảng file chỉ liệt kê phần phụ trợ chính.

## 5. Kiểm tra và xác minh

- Static: `for f in js/dashboard/*.js; do node --check "$f" || exit; done`; parse `manifest.json`; kiểm tra các script/style path trong `pages/dashboard.html`.
- Thử chuyển 4 view, responsive, sidebar/theme; mô phỏng DOM không thay thế browser test.
- Thử library CRUD/filter/favorites/import/export và refresh để xác nhận dữ liệu bền vững.
- Thử flashcards: queue, review, shortcuts, focus, dịch/TTS và restore settings.
