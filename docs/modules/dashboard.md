# Dashboard — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Dashboard quản lý Overview, Dictation, Highlights & Notes, Tài liệu và các action Flashcards/Settings/Account/Backup. H&N chạy cùng document; Tài liệu có iframe cục bộ để cách ly bộ đọc và giữ giao diện v13. Hợp đồng tài liệu chi tiết ở [luồng Tài liệu](../documents.md); quy tắc giao diện chung ở [ui-layout](../ui-layout.md).

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/dashboard.html`](../../pages/dashboard.html), [`dashboard.js`](../../js/dashboard/dashboard.js) | `load`, `setDashboardView` | Shell, dữ liệu, bốn route, settings/study/CRUD. |
| [`reveal-effects.js`](../../js/dashboard/reveal-effects.js) | `KeepitDashboardReveal` | Reveal/counter, hủy cycle, reduced motion dùng chung. |
| [`highlights-notes.js`](../../js/dashboard/highlights-notes.js), [`annotation-utils.js`](../../js/dashboard/annotation-utils.js) | `applyData`, `handleCardAction` | H&N cùng document, event bus và chuẩn hóa annotations. |
| [`overview-data.js`](../../js/dashboard/overview-data.js), [`study-view.js`](../../js/dashboard/study-view.js) | `LHN_DASHBOARD_OVERVIEW_DATA`, `LHN_STUDY_VIEW` | Tổng hợp cục bộ, Flashcards. |
| [`dictation-stats-popup-bridge.js`](../../js/dashboard/dictation-stats-popup-bridge.js), [`dictation-stats-popup.js`](../../js/dashboard/dictation-stats-popup.js) | `KEEPIT_DICTATION_STATS_*` | Popup thống kê iframe, dữ liệu schema v3. |
| [`responsive-nav.js`](../../js/dashboard/responsive-nav.js), [`responsive.css`](../../css/dashboard/responsive.css) | `.rn-*` | Điều hướng gọi route/action có sẵn; Tài liệu nằm trong Thêm trên điện thoại. |
| [`settings-ui.js`](../../js/dashboard/settings-ui.js), [`settings.css`](../../css/dashboard/settings.css) | `LHN_SETTINGS_KIT`, `LHN_SETTINGS_PREVIEWS` | Cửa sổ/sheet, phụ thuộc master, reset/undo và preview. |
| [`documents.js`](../../js/dashboard/documents.js), [`documents-context.js`](../../js/dashboard/documents-context.js), [`documents-store.js`](../../js/dashboard/documents-store.js), [`documents-renderers.js`](../../js/dashboard/documents-renderers.js) | `KeepitDocuments`, Reader adapter | Tệp, viewer, IndexedDB; PDF paragraphs/table rows, Reader adapter và speaker overlay. |
| [`backup.js`](../../js/dashboard/backup.js), [`account.js`](../../js/dashboard/account.js) | `LHN_BACKUP`, `LHN_ACCOUNT` | Backup annotations web và hồ sơ cục bộ. |

## 3. Luồng chính

1. `load()` lấy settings, favorites, annotations; cập nhật Overview và event snapshot H&N. Dữ liệu thật rỗng phải có empty state, không chèn mẫu.
2. `setDashboardView()` đổi `overview`, `dictation`, `highlights-notes`, `documents`; route không active dùng `hidden`. Flashcards vẫn là action. `listening` cũ migrate sang `dictation`; lưu last-route/scroll theo tab.
3. Overview/Dictation dùng viewport cuộn riêng; H&N dùng `#dashboardScroller`. Ba route cũ giữ một shared topbar. Chỉ Tài liệu ẩn portal đó và dùng topbar riêng trong iframe; khi viewer mở, bridge tin cậy phủ viewport và ẩn bottom nav. Rời route gửi suspend để dừng audio.
4. Dictation đối soát session index với record thật, khôi phục nguồn/tiêu đề/tổng câu từ cache. Continue YouTube mở thẳng Dictation khi captions đang tải; web giữ URL nguồn. Cards và continue-art dùng `LHN_THUMBNAILS`; favicon dùng `LHN_SITE_ICONS`.
5. H&N nhận snapshot protocol `1` qua `keepit:highlights-notes-*`; CRUD/favorite/export/review/jump/speak quay lại handler Dashboard. Background IndexedDB là nguồn annotations web.
6. Popup stats nhận OPEN/UPDATE/CLOSE cùng origin, theme từ parent; records schema v3 là nguồn chính, index chỉ bổ sung metadata. Chỉ reveal khi mở/đổi lọc, không khi snapshot refresh.

## 4. Hợp đồng và quy tắc cần giữ

- Không khôi phục Grammar/Library dự phòng hay route Flashcards. Sidebar chỉ chứa route/action thực; pin giữ 220px/56px và không tự bung khi hover.
- Settings master tắt thì dependent `inert`; ba lựa chọn icon/popup độc quyền không bị khóa. Dịch tắt khóa Reader song ngữ. AI luôn còn một provider; auto-send mặc định tắt, user-written prompt không tự gửi.
- Nhãn mới nằm ở `languages.js`, đủ en/vi/ko. Theme theo `sidebarTheme` chung.
- Reveal/counter dùng module chung, cycle guard và reduced motion; không tạo timer/observer presentation trùng ở consumer. Không animation giả số liệu.
- H&N giữ source selection khi đổi note; workspace có hai vùng cuộn, không thêm scroll root cấp trang. Rule `display:…!important` phải có `[hidden]` tương ứng.
- Thống kê lỗi giữ ngưỡng/lọc/critical và per-view state hiện có; metadata không được ghi đè bằng videoId hoặc mã nguồn web.
- Tệp/tiến độ có DB riêng; Notes/Flashcards và backup dùng annotations chung. Chỉ owned references được mở/jump, blob không backup. PDF adapter gom hàng bảng thẳng cột vào một block và giữ queue/TTS chung.
- Documents main sheet cung cấp tile Dịch/Đọc qua `LHN_DOCUMENTS_MAIN_ACTIONS`; callbacks dùng chung `setPanel('translation')`/`startNativeReader()` với toolbar top. Nút Ẩn thanh không hiện trong sheet Documents.

## 5. Kiểm tra và xác minh

Chạy `node --check` file sửa, parse manifest/HTML refs, đối chiếu messages và `git diff --check`. Chromium extension thật kiểm bốn route, sidebar/pin/Thêm, theme/ngôn ngữ, reload/scroll và công cụ Tài liệu. Test mock không thay xác nhận giọng thật, AI đăng nhập, Firefox hay Edge Android. Các QA cũ chưa xác nhận vẫn được giữ trong `PROJECT.md` mục 2; không coi việc cập nhật tài liệu là đã hoàn tất chúng.
