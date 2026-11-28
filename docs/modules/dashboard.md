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

- Shared header: không có pill local-data; avatar32px icon-only dùng `profileMenuToggleTitle` en/vi/ko, `renderProfileMenu` đồng bộ với sidebar. `toggleDashboardProfileMenu` dùng cùng `#profileMenu`/action handlers: header portalbody/fixed dưới avatar, clampviewport/maxheight; sidebar trả về parent/anchor cũ. Clickngoài/Escape/route/scroll/resize/blurđóng; keyboard focusaction/Escapetrảtrigger. Chỉ một menu; export/avatar đónglẫnnhau, exportAllgiữslot cũ. Nhãn thông tin DữliệuKeepit ẩn≤360px,khôngẩnnút xuất. Tên/email/gói chỉ trongmenu; Settings `PLAN.set` đồngbộ `profileMenuPlan`, không hardcodegói hayđổiauth/storage/license.
- Không khôi phục Grammar/Library dự phòng hay route Flashcards. Sidebar chỉ chứa route/action thực; pin giữ 220px/56px và không tự bung khi hover.
- Settings master tắt thì dependent `inert`; ba lựa chọn icon/popup độc quyền không bị khóa. Dịch tắt khóa Reader song ngữ. AI luôn còn một provider; auto-send mặc định tắt, user-written prompt không tự gửi.
- Nền canvas638 dùng duy nhất `--lhn-dashboard-page-bg` trong shared/ui-tokens.css (#e9edf4 sáng/#000 tối). Shell alias `--dash-page-bg`, hostroute Documents và html/body `dash-embedded` dùng cùng token. Không lấy nền tím standalone --page cho iframe nhúng; không đổi nền card/headerglass/viewer. Theme hiện có đồng bộ class dark giữa hai document.
- Footer Dictation639: khi route active, scroller flex-column có chiều cao viewport, portal flexnone, route/root/app/content grow qua các lớp minheight0; footer auto-top trong normalflow. Có rule route[hidden] explicit. Không dùng minheight100% qua chaauto hoặc fixedfooter; không tác động display các route khác. 640–643 từng dùng navclearance;644 đã bỏ,Keepitoverlaykhôngđổi layout/footer;rnnav dự phòng vẫn72px+safearea cốđịnh.
- Đáy Dashboard644 (quyết định thay640/643): thanh Keepit chỉ overlay, mọi tab KHÔNG đổi padding/chiều cao/footer theo fold/show. Đã bỏ `syncDashboardBottom` và `--keepit-dashboard-bottom`, kể cả nhánhpreserve/re-readlastTop cũ. `html.keepit-bar-on #dashboardScroller` padding-bottom0 cố định trênphone; fallbackrnnav giữ72+safearea cố định, chỉtransformkhiẩn/hiện. Footercuộntheonộidung,khôngnânglêntheoThanhKeepit. Giữbodyminwidth0/100dvh vàrootcanvas640.
- Chiều caoiframeDocuments641: resizeDashboardDocumentsFrame đoceil `body > .app` trongiframe bằnggetBoundingClientRect.height,khôngroot.scrollHeight(vốn>=viewportiframe,cannotshrink). ROtheolibraryvàgộpwritequarAF/cancelrebind,khôngobservedocumentroot/body. Vieweropen/routehiddenvẫnbỏinlineheighttheobranchcũ;libraryflowbaofooter/padding,khônggộpfixedoverlay/drop/dialog. Khôngnângsànhoặccapheighttheoviewport.
- Nhãn mới nằm ở `languages.js`, đủ en/vi/ko. Theme theo `sidebarTheme` chung.
- Reveal/counter dùng module chung, cycle guard và reduced motion; không tạo timer/observer presentation trùng ở consumer. Không animation giả số liệu.
- H&N642 list giữ workspace cân bằng `clamp(360px,calc(100dvh - 240px),560px)`; ngang hai cột, dọc list→detail queryriêng`aspect-ratio < 1/1`. Sourceempty/filteredempty dùngnhãncũ. KhôngđổisharedPHONE/RAIL/Settings.
- Notes645 detaildọc giữcuộntrang644`#dashboardScroller`,workspace/panelheightauto,notesListoverflowvisible. Nhưngphảigiữintro/stats/search/filter/sharedtopbarởtrêncùngtabnhưTrangnguồn,KHÔNGẩn/reorder/chuyểnworkspacehàng1/footerhàng2:chỉswap2panelworkspace. Mởdetailanchorworkspacedướisharedheader(chặnscrolltựnhiênởmaxvớinoteít),vuốtlênđầutabvẫnbody.rn-hn-detail;BackkhôiphụcouterSourceScroll. Headerwrap643/gridautofit240giữnguyên. Backclassicon-buttonphảicóIDscopedvisibilityguard:noneởmọimode,showchỉportrait+detail,tránhregressiondisplaysharediconthắngẩnnhư644.
- `highlights-notes.js` notesrevealobserverroot làdashboardScroller, tínhcảclippingcủanotesListtrênngang;trêndọcdetail dài,noterevealtheoviewportthật khiouterpagecuộn,khôngdùngrootlàtoànbộnotesListcaodài. Sourcesgiữobservercũ.
- Bộ lọc notes: màu và Yêu thích là lựa chọn loại trừ nhau, chỉ một chip active/aria-pressed; chọn favorite đặt `noteColor=all`, chọn màu/Tất cả tắt `favoriteNotes`. Chọn nguồn reset cả hai; `applyData`/`renderSources` cũng reset khi key nguồn thay đổi, cùng key giữ filter. Chip màu chỉ số lượng, không mẫu/tổng; tim dùng SVG `heart` cùng module và class `lucide small` có sẵn. `refreshSelectedNotes()` chỉ restart reveal notes/render detail; không đưa favorite notes vào `filteredRecords()`/`favoriteVideoPages()` hay rebuild source/stats khi bấm chip. Không khớp giữ header/URL/metadata/chip và empty cục bộ; toolbar Yêu thích vẫn lọc trang. Snapshot/CRUD giữ event bus/owner cũ.
- H&N giữ source selection khi đổi note. Rule `display:…!important` phải có `[hidden]` tương ứng. Ngang vẫn cuộn hai cột; chỉ detail dọc dùng outer page.
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

QA646:227/227 actualDashboard HTTP/API/protocol/top-frame shim,4size sáng/tối, baseline645 lỗi♥0 và646 giữ selection/source DOM/notes-localempty,37→0→37,màu∩favorite,hai nguồn/globalpagefavorite/video0notes,snapshot,Back,en/vi/ko/errors[]. Test optimistic last-unfavorite chặn bridge trước owner vì fixtureID ngoàiDB,rồi inject snapshot; không xác nhận storage. Pointer thật bật/tắt♥0 giữ trang,khôi phục37; chưaunpacked/CSP/device/crop4× hay importerJSON.

QA647:247/247 actualDashboardHTTP/API/protocol/top-frame shim,4size sáng/tối;exclusiveactive/countsonly/sharedSVG13px/resetkhiđổinguồn/snapshotcùngnguồngiữ/globalfavorite/localempty/real37/Back/en-vi-ko/errors[]. Pointer thật đỏ→favorite2notes khácmàu,Back→nguồnB vềTấtcả1. Đây thay contract giao màu∩favorite646 theo user;chưaunpacked/CSP/device/crop4×/importerJSON/storageacceptance.

QA648:709matrixheader5route×5size sángtối+25menuintegrationcuối+247NotesregressionPASSHTTP/API/protocol/topframeshim. Avatar32/viewport/headerheight/menuplacement/guest/signedinitial/image/plan/actions/export/aria/Escape/keyboard/route/resize/scroll/en-vi-ko/errors[]. Hookprofile/planchỉserverresponse,khôngauth/license/storageacceptance. Pointer390đãnhìnmenuhiệntên/email/freebêntrong;chưaunpacked/CSP/device/PNGcrop4×.
