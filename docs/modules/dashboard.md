# Dashboard — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Dashboard quản lý Overview, Dictation, Highlights & Notes, Tài liệu và các action Flashcards/Settings/Account/Backup. H&N chạy cùng document; Tài liệu hiện vẽ thư viện và bộ đọc trong iframe cục bộ; shell giữ header, route và scroll root. Hợp đồng tài liệu chi tiết ở [luồng Tài liệu](../documents.md); quy tắc giao diện chung ở [ui-layout](../ui-layout.md).

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
| [`dashboard-trash.js`](../../js/dashboard/dashboard-trash.js), [`trash.css`](../../css/dashboard/trash.css), [`icons.js`](../../js/shared/icons.js) | `KeepitTrash`, `file-kind-*` | Thùng rác dùng chung SVG file; web/note/dictation/speak theo demo v1 B, không thêm Speaking storage. |
| `ocr-controller.mjs`, `ocr-localize.mjs`, `ocr-demo.css` | `KeepitOcrDocumentHost`, `KeepitOCR` | OCR từ demo đã duyệt trên renderer/kho/công cụ app hiện hành; xem `docs/documents.md`. |
| [`backup.js`](../../js/dashboard/backup.js), [`account.js`](../../js/dashboard/account.js) | `LHN_BACKUP`, `LHN_ACCOUNT` | Backup annotations web và hồ sơ cục bộ. |

## 3. Luồng chính

1. `load()` lấy settings, favorites, annotations; cập nhật Overview và event snapshot H&N. Dữ liệu thật rỗng phải có empty state, không chèn mẫu.
2. `setDashboardView()` đổi `overview`, `dictation`, `highlights-notes`, `documents`; route không active dùng `hidden`. Flashcards vẫn là action. `listening` cũ migrate sang `dictation`; lưu last-route/scroll theo tab.
3. Overview/Dictation dùng viewport cuộn riêng; H&N dùng `#dashboardScroller`. Các route cùng giữ một shared topbar ở shell, topbar riêng trong iframe Tài liệu bị ẩn khi nhúng; khi viewer mở, bridge tin cậy phủ viewport và ẩn bottom nav. Rời route gửi suspend để dừng audio.
4. Dictation đối soát session index với record thật, khôi phục nguồn/tiêu đề/tổng câu từ cache. Continue YouTube mở thẳng Dictation khi captions đang tải; web giữ URL nguồn. Cards và continue-art dùng `LHN_THUMBNAILS`; favicon dùng `LHN_SITE_ICONS`.
5. H&N nhận snapshot protocol `1` qua `keepit:highlights-notes-*`; CRUD/favorite/export/review/jump/speak quay lại handler Dashboard. Background IndexedDB là nguồn annotations web.
6. Popup stats nhận OPEN/UPDATE/CLOSE cùng origin, theme từ parent; records schema v3 là nguồn chính, index chỉ bổ sung metadata. Chỉ reveal khi mở/đổi lọc, không khi snapshot refresh.

## 4. Hợp đồng và quy tắc cần giữ

- Không khôi phục Grammar/Library dự phòng hay route Flashcards. Sidebar chỉ chứa route/action thực; pin giữ 220px/56px và không tự bung khi hover.
- Settings master tắt thì dependent `inert`; ba lựa chọn icon/popup độc quyền không bị khóa. Dịch tắt khóa Reader song ngữ. AI luôn còn một provider; auto-send mặc định tắt, user-written prompt không tự gửi.
- Nền canvas638 dùng duy nhất `--lhn-dashboard-page-bg` trong shared/ui-tokens.css (#e9edf4 sáng/#000 tối). Shell alias `--dash-page-bg`, hostroute Documents và html/body `dash-embedded` dùng cùng token. Không lấy nền tím standalone --page cho iframe nhúng; không đổi nền card/headerglass/viewer. Theme hiện có đồng bộ class dark giữa hai document.
- Footer Dictation639: khi route active, scroller flex-column có chiều cao viewport, portal flexnone, route/root/app/content grow qua các lớp minheight0; footer auto-top trong normalflow. Có rule route[hidden] explicit. Không dùng minheight100% qua chaauto hoặc fixedfooter; không tác động display các route khác. Từ640,navreserve khi dùng Keepit lấy biến clearance do bar publish;rnnav dự phòng vẫn72px+safearea.
- Đáy Dashboard640: `keepit-bar.js/syncDashboardBottom()` gọi từ applyOff, chỉDASHBOARD, publish `--keepit-dashboard-bottom` (actualshownheight/UIzoom hoặc0khi folded/off/yield/keyboard/fullscreen/docsviewer). responsive.css chỉhtml.keepit-bar-on dùngbiến đó thay72px;rnnavfallback giữ72+safearea. Thaypadding giữbottomvàlastTop đểkhônghiểuscrollclamp làcuộnngược. Dashboardbodyminwidth0/width100%,body/scroller100dvh fallback100vh,rootcanvas tokenchung thắngdarkui-theme;khôngsửacard hoặcfooter từngtab.
- Chiều caoiframeDocuments641: resizeDashboardDocumentsFrame đoceil `body > .app` trongiframe bằnggetBoundingClientRect.height,khôngroot.scrollHeight(vốn>=viewportiframe,cannotshrink). ROtheolibraryvàgộpwritequarAF/cancelrebind,khôngobservedocumentroot/body. Vieweropen/routehiddenvẫnbỏinlineheighttheobranchcũ;libraryflowbaofooter/padding,khônggộpfixedoverlay/drop/dialog. Khôngnângsànhoặccapheighttheoviewport.
- Nhãn mới nằm ở `languages.js`, đủ en/vi/ko. Theme theo `sidebarTheme` chung.
- Reveal/counter dùng module chung, cycle guard và reduced motion; không tạo timer/observer presentation trùng ở consumer. Không animation giả số liệu.
- H&N642: workspace cao `clamp(360px,calc(100dvh - 240px),560px)`; ngang (rộng≥cao) hai cột co giãn bằng cao, dọc (cao>rộng, query Notes riêng `aspect-ratio < 1/1`) list→detail. CSS/controller cùng query; không đổi shared PHONE/RAIL hoặc Settings. Nguồn rỗng/lọc không kết quả dùng nhãn dịch hiện có; notesList rỗng ẩn để empty state cân giữa. Detail panel phải flex để danh sách cuộn nội bộ; đặt workspace hàng1/footer hàng2 ở detail, tránh footer auto-placement lên trước workspace khi ẩn các khối đầu.
- H&N giữ source selection khi đổi note; workspace có hai vùng cuộn, không thêm scroll root cấp trang. Rule `display:…!important` phải có `[hidden]` tương ứng.
- Thống kê lỗi giữ ngưỡng/lọc/critical và per-view state hiện có; metadata không được ghi đè bằng videoId hoặc mã nguồn web.
- Tệp/tiến độ có DB riêng; Notes/Flashcards và backup dùng annotations chung. Chỉ owned references được mở/jump, blob không backup. PDF adapter gom hàng bảng thẳng cột vào một block và giữ queue/TTS chung.
- Tab Cài đặt → Tài liệu đồng bộ kiểu trang, kích thước thanh trên và trạng thái thanh dưới với viewer; nút Cài đặt trên viewer mở đúng tab, kể cả sheet mobile. Iframe Documents được phép vào toàn màn hình từ nút của viewer. Với file một trang, danh sách kiểu trang hiển thị Từng trang và khóa các lựa chọn khác mà không thay đổi sở thích đã lưu.
- Documents main sheet đặt Dịch/Đọc to ở footer cố định cạnh Cài đặt qua `LHN_DOCUMENTS_MAIN_ACTIONS`; callbacks dùng chung `setPanel('translation')`/`startNativeReader()` với toolbar top. Điều khiển Ẩn/Hiện thanh không hiện trong sheet Documents.
- `OPEN_DASHBOARD_DOCUMENTS` chuyển view hiện tại sang Tài liệu; route mới `?view=documents` là fallback. PDF local bị chặn quyền hiển thị hướng dẫn ngắn; CTA mở trang Tiện ích Chrome tới Keepit nhưng giữ modal mở, polling quyền đến khi được cấp mới đóng. Nút chọn PDF là lựa chọn phụ; lỗi mở PDF thông thường vẫn giữ picker chính.

## 5. Kiểm tra và xác minh

Chạy `node --check` file sửa, parse manifest/HTML refs, đối chiếu messages và `git diff --check`. Chromium extension thật kiểm bốn route, sidebar/pin/Thêm, theme/ngôn ngữ, reload/scroll và công cụ Tài liệu. Test mock không thay xác nhận giọng thật, AI đăng nhập, Firefox hay Edge Android. Các QA cũ chưa xác nhận vẫn được giữ trong `PROJECT.md` mục 2; không coi việc cập nhật tài liệu là đã hoàn tất chúng.

QA638:123/123HTTP Chromium+API/protocol shim,1512/390 sáng-tối,5route và quay lại Documents; baseline637lệch#e9edf4/#f5f5ff đã đo,638đồng bộ. Parenterrors[];child2ResizeObserver deliverywarnings khi resize còn ghi raw. Đã nhìn browserHTTPsáng1280×813, chưa nghiệm thu ảnhpixel/crop4×/extension thật.

QA639:162/162HTTP+API/protocolshim,5size sángtối normal/short/longfixture và5route. Shortfooter xuống đáy trừpadding, longscroll theo; errors[]. Normal/longgap khôngđổi, mobile vẫn72pxnavreserve+25pxroutepad≈97px; chưa xácnhậnảnhuser hoặcextensionunpacked/CSP/pixel/device.

QA640:215/215HTTPsourceDashboard+actualbarcontroller/API/protocol/top-frame shim,710/580/398/283/994×696 sángtối,fold/show bằngscrollevents,5route,cùngcanvas/khôngroottràn/feedback. Baseline639folded72→640folded0. Realtrustedwheel283xuốngpad0/footergap30.266,upbarshownpad76;errors[]. ĐãnhìnbrowserHTTP283,khôngphảipixel/unpacked/device/safearea phầncứng acceptance.

QA641:162/162HTTPactualDashboard/library/bar+API/protocol/topframeshim,resize/theme/repeatedbottom/filter/grow-shrinkfixture/realDOCXviewerclose/5route/errors[]. Baseline283→544:app1124.906/frame1870→fixed1125. RealpointerHome→Documents544→283→544→bottom:frame1319/ceilapp1318.422,footerbottom671.422/696,errors[]. Khôngphảiunpacked/CSP/device/pixelacceptance.
