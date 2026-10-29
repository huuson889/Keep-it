# Dashboard — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Dashboard quản lý thư viện annotation, flashcards, cài đặt và hồ sơ. `dashboard.js` điều phối state/DOM; annotation CRUD thuộc Background, còn settings và một số preference lưu qua `browser.storage.local`.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/dashboard.html`](../../pages/dashboard.html) | `<script>`, view IDs, `data-dashboard-view`, `data-dashboard-action` | Markup, stylesheets, view routes và action menu. |
| [`css/dashboard/overview.css`](../../css/dashboard/overview.css) | `#dashboardOverviewView`, `#dashboardListeningView` | Style scoped cho Overview dữ liệu cục bộ/dark mode theo palette Dashboard và Listening placeholder. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js) | `setDashboardView`, `load`, `render` | Điều hướng 4 view và điều phối thư viện/settings/study/profile. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES`, `LANGUAGES.t` | Bản dịch giao diện en/vi/ko. |
| [`js/dashboard/library.js`](../../js/dashboard/library.js) | `LHN_LIBRARY` | Metadata, nhóm trang và key annotation. |
| [`js/dashboard/study-view.js`](../../js/dashboard/study-view.js), [`js/dashboard/study-utils.js`](../../js/dashboard/study-utils.js) | `LHN_STUDY_VIEW`, `LHN_STUDY_UTILS` | Render flashcards và tiện ích thuật toán. |
| [`js/dashboard/settings-ui.js`](../../js/dashboard/settings-ui.js) | `LHN_DASHBOARD_SETTINGS_UI` | Bộ chọn ngôn ngữ, website và tìm Settings. |
| [`js/dashboard/backup.js`](../../js/dashboard/backup.js), [`js/dashboard/account.js`](../../js/dashboard/account.js) | `LHN_BACKUP`, `LHN_ACCOUNT` | Import/export và profile demo. |
| [`js/dashboard/profile-stats.js`](../../js/dashboard/profile-stats.js) | `LHN_PROFILE_STATS` | Tổng hợp số liệu hồ sơ từ annotation. |
| [`js/dashboard/overview-data.js`](../../js/dashboard/overview-data.js) | `LHN_DASHBOARD_OVERVIEW_DATA` | Helper thuần tổng hợp số liệu thật từ annotations cho Overview. |
| [`js/dictation/session-index.js`](../../js/dictation/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Hợp đồng/chuẩn hóa session Dictation dùng chung giữa provider và Dashboard. |
| [`js/dashboard/flags.js`](../../js/dashboard/flags.js) | module side effect | Hỗ trợ emoji cờ cho Dashboard. |

## 3. Luồng chính

1. `dashboard.html` nạp core/helpers trước entry; giữ thứ tự script khi chỉnh markup.
2. `load()` đọc settings/preferences và lấy annotations theo batch qua `LHN_MESSAGING`; `render()` cập nhật thư viện, panel và Overview.
3. Overview dùng `LHN_DASHBOARD_OVERVIEW_DATA` trên dữ liệu annotation đã tải: số trang/tô sáng/ghi chú/thẻ đến hạn, thẻ ôn hôm nay, hoạt động tạo annotation theo ngày, tag và hoạt động gần đây. Không có dữ liệu thì hiển thị số 0/trạng thái rỗng; heatmap không giả lập lịch sử review.
4. Dictation summary đọc index cục bộ provider-neutral; migration chỉ đọc record YouTube cũ và thêm metadata vào index, không sửa/xóa `dictation:<videoId>`.
5. `setDashboardView()` chuyển Overview, Listening, Library (`#dashboardHomeView`) và Grammar; Listening vẫn là placeholder. Action menu Flashcards gọi `startStudySession({ allSources:true })` để mở review trên các nguồn.
6. Menu hồ sơ mở các tab Settings tương ứng; “Cài đặt tiện ích” dùng tab mở gần nhất và ghi nhớ qua `lhnDashboardLastSettingsTab`. Tên/email menu đọc từ hồ sơ cục bộ đang hoạt động; khi khách, phần đầu hiện “Bạn” và “Đăng nhập để đồng bộ” bên trái, nút cloud-off nhỏ bên phải; nút hồ sơ sidebar có huy hiệu “Miễn phí”. Ẩn Đồng bộ dữ liệu, Trợ giúp & Phản hồi, Đăng xuất, thay bằng nút Đăng nhập mở form. Đăng xuất khi đã đăng nhập xóa hồ sơ cục bộ qua `LHN_ACCOUNT`.
7. Sửa/xóa/review annotation gửi message tới Background (chủ sở hữu IndexedDB); `origin` tránh xử lý lặp sự kiện do Dashboard tạo.
8. Flashcards dùng `study-utils`/`study-view`; Translate, Reader và Background đảm nhiệm dịch, TTS, định nghĩa.
9. Import/export cập nhật annotations/favorites theo kết quả trả về.

## 4. Hợp đồng và quy tắc cần giữ

- Bốn route: Tổng quan, Luyện nghe, Thư viện (`home`) và Luyện ngữ pháp; mục “Ôn tập Flashcards” là action riêng (`data-dashboard-action`) gọi `startStudySession({ allSources:true })`, không tạo route mới.
- Overview dùng dữ liệu annotation và Dictation index cục bộ thật; Listening vẫn là placeholder. Nút CTA của Overview vẫn chỉ để trình bày theo phạm vi đã duyệt, không thêm handler.
- Chỉ `data-dashboard-view` đổi view; giữ luồng thư viện và `#profileSidebar` của Grammar.
- Chuỗi UI mới dùng `data-i18n`/`data-i18n-aria-label`, có bản dịch trong `MESSAGES` cho en, vi, ko.
- Annotation CRUD/review đi qua Background message (`GET_BATCH`, `UPDATE`, `DELETE`, `REVIEW_ANNOTATION`, `IMPORT`); không truy cập IndexedDB trực tiếp.
- Settings/favorites/study/Reader preferences có storage keys riêng; dùng `LHN_DEFAULTS`/`LHN_SETTINGS` khi cần default.
- Dictation index key `dictation:session-index:v1` chứa summary theo hợp đồng `{sourceType, sourceId, title, url, currentIndex, totalCount, solvedCount, updatedAt, status}`; `currentIndex` zero-based. Consumer không dựa trực tiếp vào key YouTube. Legacy backfill là additive, failure-isolated.
- Giữ thứ tự nạp helper và API `LHN_*`; đổi contract thì cập nhật consumer trong `dashboard.js`/HTML.
- Đồng bộ storage/message events; optimistic UI cần xử lý lỗi/rollback.
- `flags.js` nằm trong `dashboard/`; bảng file chỉ liệt kê phần phụ trợ chính.

## 5. Kiểm tra và xác minh

- Static: `for f in js/dashboard/*.js js/dictation/session-index.js; do node --check "$f" || exit; done`; `node --test tests/dashboard-overview-data.test.cjs`; parse `manifest.json`; kiểm tra script/style path và i18n của Overview trong `pages/dashboard.html`.
- Thử chuyển 4 view, responsive, sidebar/theme; mô phỏng DOM không thay thế browser test.
- Thử library CRUD/filter/favorites/import/export và refresh để xác nhận dữ liệu bền vững.
- Thử flashcards: queue, review, shortcuts, focus, dịch/TTS và restore settings.
