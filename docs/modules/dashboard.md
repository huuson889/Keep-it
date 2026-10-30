# Dashboard — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; trang này tóm tắt ranh giới và contract cần giữ.

## 1. Mục đích và phạm vi

Dashboard cung cấp Overview, Listening, Highlights & Notes và luồng settings/study/backup. `dashboard.js` điều phối route; parent quản lý dữ liệu và actions cho iframe Highlights & Notes.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/dashboard.html`](../../pages/dashboard.html), [`pages/lr-practice-demo.html`](../../pages/lr-practice-demo.html) | `#dashboardHighlightsNotesFrame` | Route Dashboard và giao diện Highlights & Notes. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js) | `load`, `setDashboardView`, `syncHighlightsNotesFrame` | Nạp dữ liệu, chuyển route, đồng bộ iframe. |
| [`js/dashboard/lr-practice-demo.js`](../../js/dashboard/lr-practice-demo.js) | `applyData`, `handleCardAction` | Render danh sách; gửi actions. |
| [`js/dashboard/annotation-utils.js`](../../js/dashboard/annotation-utils.js), [`js/dashboard/overview-data.js`](../../js/dashboard/overview-data.js) | `LHN_ANNOTATION_UTILS`, `LHN_DASHBOARD_OVERVIEW_DATA` | Chuẩn hóa và tổng hợp annotations. |
| [`js/dashboard/study-view.js`](../../js/dashboard/study-view.js), [`js/dashboard/study-utils.js`](../../js/dashboard/study-utils.js) | `LHN_STUDY_VIEW`, `LHN_STUDY_UTILS` | Flashcards và helpers. |
| [`pages/dictation-stats-popup.html`](../../pages/dictation-stats-popup.html), [`js/dashboard/dictation-stats-popup.js`](../../js/dashboard/dictation-stats-popup.js) | `#dictationStatsPopupFrame` | Render thống kê Dictation cục bộ. |
| [`js/dashboard/dictation-stats-popup-bridge.js`](../../js/dashboard/dictation-stats-popup-bridge.js) | `KEEPIT_DICTATION_STATS_OPEN/UPDATE/CLOSE` | Quét stats schema v3, gồm nhóm lỗi và mảnh ngữ cảnh; index chỉ bổ sung metadata. |
| [`js/shared/site-icons.js`](../../js/shared/site-icons.js) | `LHN_SITE_ICONS.load` | Resolve favicon và cache URL dùng chung cho popup/Highlights & Notes. |
| [`js/dashboard/backup.js`](../../js/dashboard/backup.js), [`js/dashboard/account.js`](../../js/dashboard/account.js) | `LHN_BACKUP`, `LHN_ACCOUNT` | Backup và profile cục bộ. |

## 3. Luồng chính

1. `dashboard.html` nạp core/helpers trước `dashboard.js`; giữ thứ tự script.
2. `load()` lấy settings, favorites và annotations; cập nhật Overview rồi gửi snapshot sang iframe.
3. `setDashboardView()` chuyển giữa Overview, Listening và Highlights & Notes. Listening vẫn là trang demo; Flashcards là action, không phải route.
4. Iframe nhận annotations, favorites và ngôn ngữ qua same-origin `postMessage`; CRUD, favorite, export, review, jump và speak quay về handler parent hiện có.
5. Một node `#dashboardSharedTopbar` chuyển giữa route; scrollport `#dashboardListeningView` điều khiển sticky/compact state. Giữ export trong iframe.
6. Nút thống kê chi tiết mở iframe cùng origin. Parent quét `dictation:<videoId>` records trực tiếp; session index chỉ bổ sung tiêu đề/URL khi có. Khi popup mở, `storage.onChanged` gửi snapshot mới để cập nhật tại chỗ. Popup render ba góc nhìn Global, Critical và Theo web theo UI demo v14; tìm kiếm/metric bám lựa chọn hiện tại.
7. Popup stats và Highlights & Notes gọi `LHN_SITE_ICONS.load` cho favicon. Resolver ưu tiên icon của tab cùng origin, dùng cache `browser.storage.local` chung, fallback đồng nhất và không lưu path/query trang.
8. Sidebar bắt đầu mở rộng; `dashboardSidebarPin` đổi 220px/56px trong flex flow. Thu gọn không tự bung khi hover; tooltip icon vẫn hỗ trợ hover/focus.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ ba route, một shared topbar và hành vi sidebar hiện có; không khôi phục Grammar/Library hoặc tạo route Flashcards mới.
- Highlights & Notes là UI duy nhất để duyệt/quản lý annotations. IndexedDB/Background vẫn là nguồn dữ liệu; iframe chỉ giữ bản sao trong bộ nhớ.
- Chỉ nhận `HIGHLIGHTS_NOTES_READY`/`HIGHLIGHTS_NOTES_ACTION` từ iframe đã biết, cùng `location.origin`, protocol version `1`; đồng bộ lại sau load, CRUD và storage changes.
- Popup nhận `KEEPIT_DICTATION_STATS_OPEN`/`KEEPIT_DICTATION_STATS_UPDATE` từ parent cùng origin và gửi `KEEPIT_DICTATION_STATS_CLOSE` khi đóng. Parent refresh khi local Dictation record/index đổi; tên nguồn chọn bản mới hơn giữa record title (đã lấy từ thanh audio) và session index theo timestamp, bỏ giá trị chỉ là videoId trước khi fallback. Nếu record/index cũ thiếu title, bridge thử lấy title từ tab YouTube đang mở khớp videoId. Tên nguồn/context và tiêu đề video trong tab theo video là liên kết HTTPS tới clip YouTube; khi index thiếu URL, tạo URL từ videoId. Iframe không đọc storage trực tiếp.
- Popup thống kê khớp stylesheet demo v14. Header không subtitle/footer; toolbar compact gom tab, filter, sort và tìm kiếm; metrics nằm cột trái 146px. Smart-card có 5 cột và summary ba dòng. Tab Theo web dùng cùng card trong accordion; chỉ title là link và chevron SVG 22px. Animation dùng grid rows, tôn trọng `prefers-reduced-motion`; scrollbar WebKit là 3px.
- Favicon trong popup và Highlights & Notes phải gọi helper `LHN_SITE_ICONS` dùng chung; không tự tạo URL favicon/fallback riêng ở từng consumer. Cache chung được phân vùng theo origin, có TTL/giới hạn; không lưu full page URL.
- Global và Critical giữ state lọc nhóm lỗi và sắp xếp riêng theo tỷ lệ, số lỗi hoặc gần nhất. Theo web dùng filter Global và sắp xếp lượt lỗi giảm dần. Critical giữ ngưỡng rate ≥70% và ít nhất 3 lỗi. Search lọc từ, loại lỗi, biến thể, ngữ cảnh và nguồn; metrics phản ánh đúng tập kết quả theo view/filter/search hiện hành.
- Popup có chiều cao cố định theo `min(900px, 100vh - 40px)`; header cố định và không còn footer. Chỉ `.results-scroll` cuộn; WebKit đặt scrollbar 3px, Firefox dùng kích thước native (`scrollbar-width:auto`).
- Báo cáo chỉ gồm mục hợp lệ: bỏ `missing`, target 1–3 chữ cái, proper nouns và dấu câu; cùng điều kiện áp dụng cho errors/fixes. Rate là `errors / (errors + fixes)`.
- Font stack Inter theo demo v14; UI vẫn có fallback hệ thống. Nguồn và title thực do bridge cung cấp; popup không đọc storage trực tiếp.

## 5. Kiểm tra và xác minh

- Static: `node --test tests/*.test.cjs`, `node --check` cho JS, parse `manifest.json`, kiểm tra HTML refs/message contract và `git diff --check`. Test popup xác nhận live refresh, lọc schema/short words, migration và ngưỡng rate.
- Mock: kiểm tra metadata/page key, Overview và Highlights & Notes data/action bridge.
- Browser cần xác nhận routes, iframe CRUD/favorites/export/import, study actions, responsive/theme và popup trên Chrome/Firefox. Static/mock không thay cho kiểm tra extension thật.
