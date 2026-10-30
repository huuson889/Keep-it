# Dashboard — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; trang này tóm tắt ranh giới và contract cần giữ.

## 1. Mục đích và phạm vi

Dashboard cung cấp Overview, Dictation, Highlights & Notes và luồng settings/study/backup. Ba view dùng chung shell, nền/theme và một topbar; Overview và Dictation có khung cuộn riêng giới hạn theo viewport, còn Highlights & Notes giữ cuộn trang chung và giới hạn riêng workspace. Highlights & Notes chạy trong cùng document, không dùng iframe.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/dashboard.html`](../../pages/dashboard.html), [`pages/lr-practice-demo.html`](../../pages/lr-practice-demo.html) | `#dashboardScroller`, `#dashboardHighlightsNotesView` | Shell route và nguồn markup ban đầu của Highlights & Notes. Dashboard render H&N trong cùng document. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js) | `load`, `setDashboardView`, `syncHighlightsNotesView` | Nạp dữ liệu, chuyển route, đồng bộ H&N qua custom events; lưu route/scroll theo tab. |
| [`js/dashboard/lr-practice-demo.js`](../../js/dashboard/lr-practice-demo.js) | `applyData`, `handleCardAction` | Render danh sách; gửi/nhận actions qua same-document event bus. |
| [`css/dashboard/highlights-notes-embedded.css`](../../css/dashboard/highlights-notes-embedded.css) | `#dashboardHighlightsNotesView` | CSS H&N được scope vào route; `#dashboardScroller` là scroll root cấp trang, chỉ workspace được giới hạn chiều cao còn hai danh sách cuộn nội bộ. |
| [`js/dashboard/annotation-utils.js`](../../js/dashboard/annotation-utils.js), [`js/dashboard/overview-data.js`](../../js/dashboard/overview-data.js) | `LHN_ANNOTATION_UTILS`, `LHN_DASHBOARD_OVERVIEW_DATA` | Chuẩn hóa và tổng hợp annotations. |
| [`js/dashboard/study-view.js`](../../js/dashboard/study-view.js), [`js/dashboard/study-utils.js`](../../js/dashboard/study-utils.js) | `LHN_STUDY_VIEW`, `LHN_STUDY_UTILS` | Flashcards và helpers. |
| [`pages/dictation-stats-popup.html`](../../pages/dictation-stats-popup.html), [`js/dashboard/dictation-stats-popup.js`](../../js/dashboard/dictation-stats-popup.js) | `#dictationStatsPopupFrame` | Render thống kê Dictation cục bộ. |
| [`js/dashboard/dictation-stats-popup-bridge.js`](../../js/dashboard/dictation-stats-popup-bridge.js) | `KEEPIT_DICTATION_STATS_OPEN/UPDATE/CLOSE` | Quét stats schema v3, gồm nhóm lỗi và mảnh ngữ cảnh; index chỉ bổ sung metadata. |
| [`js/shared/site-icons.js`](../../js/shared/site-icons.js) | `LHN_SITE_ICONS.load` | Resolve favicon và cache URL dùng chung cho popup/Highlights & Notes. |
| [`js/dashboard/backup.js`](../../js/dashboard/backup.js), [`js/dashboard/account.js`](../../js/dashboard/account.js) | `LHN_BACKUP`, `LHN_ACCOUNT` | Backup và profile cục bộ. |

## 3. Luồng chính

1. `dashboard.html` nạp core/helpers trước `dashboard.js`; giữ thứ tự script.
2. `load()` lấy settings, favorites và annotations; cập nhật Overview và gửi snapshot H&N qua `keepit:highlights-notes-data`.
3. `setDashboardView()` chuyển giữa Overview, Listening và Highlights & Notes. Listening vẫn là trang demo; Flashcards là action, không phải route.
4. H&N cùng document nhận annotations, favorites và ngôn ngữ qua custom event; CRUD, favorite, export, review, jump và speak quay về handler trong `dashboard.js`.
5. Một node `#dashboardSharedTopbar` nằm cố định trong shared shell; Overview và Dictation dùng route làm scroll target để giữ sticky/compact state và phục hồi vị trí theo tab; `#dashboardScroller` tiếp tục điều khiển Highlights & Notes. Export H&N dùng action slot trên topbar.
6. Nút thống kê chi tiết mở iframe cùng origin. Parent quét `dictation:<videoId>` records trực tiếp; session index chỉ bổ sung tiêu đề/URL khi có. Khi popup mở, `storage.onChanged` gửi snapshot mới để cập nhật tại chỗ. Popup render ba góc nhìn Global, Critical và Theo web theo UI demo v14; tìm kiếm/metric bám lựa chọn hiện tại.
7. Popup stats và Highlights & Notes gọi `LHN_SITE_ICONS.load` cho favicon. Resolver ưu tiên icon của tab cùng origin, dùng cache `browser.storage.local` chung, fallback đồng nhất và không lưu path/query trang.
8. Sidebar bắt đầu mở rộng; `dashboardSidebarPin` đổi 220px/56px trong flex flow. Thu gọn không tự bung khi hover; tooltip icon vẫn hỗ trợ hover/focus.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ ba route, shared topbar và hành vi sidebar hiện có; không khôi phục Grammar/Library hoặc tạo route Flashcards mới. `sessionStorage` lưu riêng `overview`, `listening`, `highlights-notes` và route cuối; Overview và Dictation lưu scroll trên route viewport-bounded; Highlights & Notes lưu trên `#dashboardScroller`. Khi chưa có route đã lưu, mặc định Overview; sau reload, scroll đặt lại sau khi dữ liệu/layout sẵn sàng.
- Hiệu ứng Overview chỉ tác động trình bày: `IntersectionObserver` dùng `#dashboardScroller` làm root; từng khung reveal theo thứ tự DOM/đọc trực quan từ trái sang phải, trên xuống dưới, giãn 80ms và chỉ khi vào vùng nhìn. Markup gắn `ov-reveal` sẵn để không flash trước khi `load()` hoàn tất; sau khi khôi phục route/scroll và dữ liệu, `resetOverviewEntranceEffects()` chạy cùng nhịp với lần quay lại tab. Counter đặt trước bề rộng theo giá trị hoàn chỉnh để không wrap/reflow; dữ liệu vẫn lấy từ summary local và tôn trọng `prefers-reduced-motion`.
- Khi đổi tab, sau khi vị trí cuộn được phục hồi, các khung cấp cao của route đích (cùng topbar) được reset/reveal lại. Trước khi observer bật lại trạng thái revealed, tạm tắt transition và flush layout để trạng thái ẩn được commit thành một frame nền; sau đó khôi phục transition cho reveal chạy lại. Cycle guard ngăn callback của lần chuyển cũ ghi đè lần mới. Ở Dictation, hero và thẻ “Tiếp tục luyện” là hai target riêng, reveal trái-sang-phải; tiếp đến search, library bên trái và aside bên phải theo thứ tự đọc. Các khung stagger 80ms; không reveal từng session card. Highlights & Notes không reveal từng source, annotation hoặc note.
- Highlights & Notes là UI duy nhất để duyệt/quản lý annotations. IndexedDB/Background vẫn là nguồn dữ liệu; view nhận snapshot trong bộ nhớ qua `keepit:highlights-notes-*` custom events. Khi mở route, Dashboard gửi lại snapshot mới nhất; nếu chưa có source đang chọn, view tự chọn source đầu tiên đang hiển thị. Cả sources-panel lẫn notes-panel được reveal trực tiếp khi mở route để luôn hiện cạnh nhau trên desktop. Trên desktop, route giữ luồng chiều cao tự nhiên, padding và khoảng cách 10px giữa các khung; chỉ workspace bị giới hạn bằng `max(650px, calc(100vh - 472px))`, còn Sources/Notes cuộn bên trong. `overflow` của route vẫn hiển thị nên shared `#dashboardScroller` tiếp tục cuộn nội dung trang. Viewport hẹp chuyển thành một cột; mỗi panel có chiều cao giới hạn và danh sách vẫn cuộn nội bộ. Không tạo scroll root cấp trang thứ hai.
- Event bus nội bộ giữ protocol version `1`; sync sau load/CRUD/storage changes, replies trả về component H&N trong cùng document.
- Popup nhận `KEEPIT_DICTATION_STATS_OPEN`/`KEEPIT_DICTATION_STATS_UPDATE` từ parent cùng origin và gửi `KEEPIT_DICTATION_STATS_CLOSE` khi đóng. Parent refresh khi local Dictation record/index đổi; tên nguồn chọn bản mới hơn giữa record title (đã lấy từ thanh audio) và session index theo timestamp, bỏ giá trị chỉ là videoId trước khi fallback. Nếu record/index cũ thiếu title, bridge thử lấy title từ tab YouTube đang mở khớp videoId. Tên nguồn/context và tiêu đề video trong tab theo video là liên kết HTTPS tới clip YouTube; khi index thiếu URL, tạo URL từ videoId. Iframe không đọc storage trực tiếp.
- Popup thống kê khớp stylesheet demo v14. Header không subtitle/footer; toolbar compact gom tab, filter, sort và tìm kiếm; metrics nằm cột trái 146px. Smart-card có 5 cột và summary ba dòng. Tab Theo web dùng cùng card trong accordion; chỉ title là link và chevron SVG 22px. Animation dùng grid rows, tôn trọng `prefers-reduced-motion`; scrollbar WebKit là 3px.
- Favicon trong popup và Highlights & Notes phải gọi helper `LHN_SITE_ICONS` dùng chung; không tự tạo URL favicon/fallback riêng ở từng consumer. Cache chung được phân vùng theo origin, có TTL/giới hạn; không lưu full page URL.
- Global và Critical giữ state lọc nhóm lỗi và sắp xếp riêng theo tỷ lệ, số lỗi hoặc gần nhất. Theo web dùng filter Global và sắp xếp lượt lỗi giảm dần. Critical giữ ngưỡng rate ≥70% và ít nhất 3 lỗi. Search lọc từ, loại lỗi, biến thể, ngữ cảnh và nguồn; metrics phản ánh đúng tập kết quả theo view/filter/search hiện hành.
- Popup có chiều cao cố định theo `min(900px, 100vh - 40px)`; header cố định và không còn footer. Chỉ `.results-scroll` cuộn; WebKit đặt scrollbar 3px, Firefox dùng kích thước native (`scrollbar-width:auto`).
- Báo cáo chỉ gồm mục hợp lệ: bỏ `missing`, target 1–3 chữ cái, proper nouns và dấu câu; cùng điều kiện áp dụng cho errors/fixes. Rate là `errors / (errors + fixes)`.
- Font stack Inter theo demo v14; UI vẫn có fallback hệ thống. Nguồn và title thực do bridge cung cấp; popup không đọc storage trực tiếp.

## 5. Kiểm tra và xác minh

- Static: `node --test tests/*.test.cjs`, `node --check` cho JS, parse `manifest.json`, kiểm tra HTML refs/custom-event contract và `git diff --check`. Test popup xác nhận live refresh, lọc schema/short words, migration và ngưỡng rate; Overview test giữ reveal cadence, data-ready, shared scroll root/per-tab restore, counter/chart và reduced-motion.
- Mock: kiểm tra metadata/page key, Overview summary và Highlights & Notes same-document data/action bus.
- Browser cần xác nhận shared shell, per-tab scroll/reload restore, H&N CRUD/favorites/export/import, study actions, responsive/theme và popup trên Chrome/Firefox; với reveal, cuộn từng vùng, rời/quay lại tab và kiểm tra reduced-motion ở light/dark theme. Riêng H&N, kiểm tra chiều cao workspace, hai danh sách cuộn nội bộ, shared page scroll, khoảng cách giữa các khung và mobile một cột. Static/mock không thay cho kiểm tra extension thật.
