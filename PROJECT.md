# Keepit - Hồ sơ dự án

## 1. Trạng thái hiện tại
- **Bản test 3.5.617**, chỉ sửa độ rộng mặc định sidebar OCR và lớp popup tiến độ trong `Workspace/Keepit-OCR`; bản gốc không đổi. Chưa nghiệm thu 100%.
- Tesseract/eng/vie/kor cục bộ, PP/Fusor hoãn; giữ nguyên engine, dữ liệu, flow, kéo resize, vị trí popup và UI khác.
- Sidebar ngang mặc định cùng popup 380px (vẫn ưu tiên độ rộng đã lưu); chế độ dọc vẫn toàn màn hình như trước. Popup nằm trên host Back to top, dưới sheet đang mở của thanh Keepit.
- QA HTTP: đối chiếu trước/sau 6/6 ở 1512/800/390 × nút theme sáng/tối, popup không đổi rect, hit-test chuyển từ Back to top sang popup; kéo thật 380→500px và khôi phục 500px sau reload; OCR ảnh thật hoàn tất/lưu IndexedDB; console.error/pageerror rỗng. Kiểm công cụ lưu trữ 7/7.
- **Giới hạn:** trình duyệt công cụ chặn chrome://extensions, chưa unpacked/CSP/permission/PNG/crop4×/pixel/profile/tệp/thiết bị thật. Các kiểm HTTP không thay thế QA ảnh extension bắt buộc; giới hạn cuộn/scan bản trước vẫn giữ.

## 2. Việc đang mở / Tiếp theo (sửa đè)
### OCR — chặn nghiệm thu
- Cần người dùng thử bản 3.5.617: sidebar/popup, cuộn OCR và scan/khung trên PDF gây lỗi trong extension thật; HTTP đã đo nhưng chưa có nghiệm thu bằng ảnh/video extension.
- Cần môi trường unpacked thật để kiểm CSP/worker/model/permission; Chrome công cụ hiện chặn chrome://extensions.
- Cần PNG 1512/390 sáng/tối, crop 4× và so pixel/trạng thái với demo; mới có DOM/số đo HTTP.
- Kiểm profile/thiết bị/tệp thực, PDF xoay/mật khẩu/lớn/hỏng, clipboard, note anchors, dịch/TTS/AI và Office phức tạp. Mẫu ảnh Việt/Hàn tổng hợp đã chạy; Hàn còn lỗi đọc giống demo trên cùng byte PNG.
- Bản test được đóng gói theo xác nhận của người dùng; chỉ nâng trạng thái nghiệm thu sau khi kiểm đủ unpacked/ảnh, không dùng phép đo HTTP thay ảnh/pixel.
### Cần người dùng xác nhận
- Home/dashboard: giữ hay tắt popup giới thiệu thanh; Documents 3.5.503: thử lại mở/nhập/bôi đen để đóng lỗi 3.5.483–502; kéo-thả: xác nhận lại 3.5.491+.
### Tiếp theo
- Speaking vào danh sách Thùng rác sau Dictation; Documents Batch 3 bỏ VIEWPORT/đo cao, thêm OPEN_RESULT và chuyển entry sang dashboard.
### Các việc mở cũ khác
- Kiểm Documents 3.5.597–611, UI 3.5.593, popup 3.5.586 và Dictation thực; giữ toàn bộ điều kiện cũ tại `docs/pending-notes.md`.
- Highlight ẩn/điều hướng ↑↓ chưa triển khai; LICENSE/PRIVACY chưa đủ điều kiện phát hành công khai.

## 3. Ràng buộc & quyết định
- **Áp dụng demo:** chỉ giữ bố cục/luồng đã duyệt. Reader, chọn chữ, Ghi chú, từ điển và Hỏi AI phải dùng module UI/controller/dữ liệu hiện có của app, theo cài đặt chung; không bê các công cụ mô phỏng thành bộ riêng.
- Giữ nguyên UI, layout, văn bản hiện có. Chỉ thêm mới khi được yêu cầu.
- Khi phát hiện tên file/đường dẫn sai hoặc không nhất quán, báo người dùng và nêu rõ phạm vi trước khi sửa; nếu chỉ yêu cầu đổi tên, giữ nguyên logic bên trong.
- Mọi API dùng browser.* (đã có polyfill).
- Chromium dùng `side_panel`/`sidePanel`; Firefox build qua `scripts/build_firefox.py` bỏ các key Chrome-only và dùng `sidebar_action`. Popup và Dashboard giữ entry hiện tại.
- Thư mục nguồn là nguồn duy nhất; Firefox manifest là build output bên ngoài repo; zip do Arena đóng gói vào D:\Keepit.
- AGENTS.md và PROJECT.md nằm trong zip và được commit vào Git. Trước khi nộp store, người dùng tự xóa hai file này khỏi zip.
- Thay đổi lớn nêu rõ trong commit message.
- Khoảng trắng dưới thanh trên Claude (Chromium) là header riêng của Claude; người dùng chọn không xử lý.
- Tuyệt đối không đặt ZIP, test, log, file tạm trong `Keep-it`; test chỉ chạy ngoài repo.

## 4. Cấu trúc và kiến trúc dự án

### 4.1. Bản đồ file
```text
Keepit - Test/
├── manifest.json                  # Manifest source cho Chromium
├── scripts/
│   └── build_firefox.py           # Tạo Firefox build, bỏ permission/key Chrome-only (không dùng cho phát hành từ v3.5.136: một ZIP chung)
├── pages/
│   ├── ai-panel.html               # AI panel chung (Chromium side panel + Firefox sidebar): toolbar + provider iframe + lớp phủ đăng nhập
│   ├── dashboard.html             # Giao diện Dashboard (Overview/Dictation/Highlights & Notes, sidebar và ô tìm Settings)
│   ├── highlights-notes.html      # Bản HTML độc lập của giao diện Highlights & Notes
│   ├── dictation-stats-popup.html # Popup thống kê Dictation trong iframe cục bộ
│   └── popup.html                 # Popup toolbar
├── js/
│   ├── core/                      # defaults, browser-polyfill, config, languages, messaging, settings, cache, shortcuts
│   ├── background/                # background.js (entry, router; nạp ask-ai/service.js), annotations, usage-limits
│   ├── ask-ai/                    # AI panel ChatGPT/Gemini/Claude (Grok ẩn)
│   │   ├── providers.js           # Registry + selector/URL theo AI, panelRoute/planPanelNavigation, pickSelectedProvider
│   │   ├── service.js             # Background AI: panel lifecycle, provider, mapping, link, Alt+X, DNR 9002
│   │   ├── prompt-format.js       # Nhãn + URL + prompt formatting (background + trang AI)
│   │   ├── toolbar.js             # Toolbar AI panel: source link, tabs, auto-send
│   │   ├── panel/panel.js         # Panel controller chung (iframe cả hai trình duyệt, Chat mới, lớp phủ đăng nhập)
│   │   └── page/                  # composer.js (editor bridge), send-flow.js (send/link/mapping), chatgpt-link-marker.js, grok-google-auth.js
│   ├── content/                   # Page interaction content scripts
│   │   ├── sidebar.js             # Page sidebar tabs and search tools
│   │   ├── keepit-bar.js          # Thanh Keepit + ☰ mọi thiết bị: cuộn ẩn/hiện, vuốt thanh lùi/tới/sang tab, cử chỉ trang (vuốt trái dịch đoạn, chạm 2 ngón dịch trang), nhấn giữ bôi chữ; nhãn ở languages.js (bar_<tên>)
│   │   ├── keepit-bar-css.js      # CSS thanh + ☰ (LHN_BAR_CSS), màu kính qua var(--kp-…)
│   │   └── note-composer.js       # Note form and record normalization
│   ├── reader/                    # bilingual-reader, reader-css (CSS Reader), TTS engine, reader voice flags
│   ├── translate/                 # translate (chạy nền), dictionary, study translation
│   ├── dashboard/                 # Dashboard routes, settings, account, backup, stats; responsive-nav.js = điều hướng điện thoại/tablet
│   ├── overlay/                   # Shared Video/Web overlay, Study engine/activities and View modes
│   │   ├── overlay-controller.js  # Lifecycle, source/activity routing and bootstrap
│   │   ├── ui/                    # Giao diện overlay (demo v18): overlay-ui.js, overlay-css.js (nhãn: khoá `ov_*` trong languages.js)
│   │   ├── source/                # YouTube captions/timing and Reader cues
│   │   ├── study/                 # study-score, learning-rules, session-index (chấm điểm, luật, chỉ mục cho Dashboard)
│   │   ├── overlay-engine.js      # Cài đặt, chế độ xem/phụ đề, hàng đợi dịch phụ đề, yêu thích (từ view/ cũ, v3.5.195)
│   ├── popup/                     # popup.js (entry)
│   └── shared/                    # theme-tokens (màu kính sáng/tối --kp-…), custom-font, icons, search (LHN_INDEX_SEARCH + LHN_SEARCH), heart-effects (tim Overlay/Từ điển), sheet-kit, selection-toolbar, site-icons, thumbnails
├── css/
│   ├── content/                   # CSS của content script
│   ├── dashboard/                 # CSS Dashboard; `overview.css` cho Overview, `dictation.css` cho route Dictation, `responsive.css` cho điện thoại/tablet (nạp cuối)
│   ├── popup/                     # CSS popup toolbar
│   └── shared/                    # theme tokens, theme và flags
├── assets/
│   ├── icons/                     # Biểu tượng extension
│   ├── images/                    # Ảnh đóng gói (web-thumbnail-lofi.webp, ảnh mặc định thẻ nguồn web; khai trong web_accessible_resources)
│   └── fonts/                     # Font cục bộ
├── vendor/readability/            # Mozilla Readability cho Alt+R/Alt+A
├── licenses/                      # Văn bản giấy phép bên thứ ba
├── docs/
│   ├── INDEX.md                   # Mục lục tài liệu kỹ thuật nội bộ
│   ├── modules/                   # Hướng dẫn cho từng module first-party cấp cao nhất trong js/
│   ├── changelog/                 # Nhật ký cũ (chuyển nguyên văn từ PROJECT.md), chỉ đọc khi cần tra lịch sử
│   └── supabase/                  # SUPABASE_SYNC.md + supabase-schema.sql (cloud chưa nối)
├── DATA-INVENTORY.md, STORE-LISTING.md  # Nội bộ: bảng kê dữ liệu, nội dung cửa hàng (bỏ khỏi ZIP phát hành)
└── AGENTS.md, PROJECT.md, README.md, OPT-ARENA.md, PRIVACY-POLICY.md, THIRD_PARTY_NOTICES.md
```

`manifest.json` ở gốc repo dùng chung Chromium và Firefox (khóa của trình duyệt kia bị bỏ qua; `browser_specific_settings.gecko` giữ id, Firefox ≥147 và `data_collection_permissions`); phát hành một ZIP chung. `scripts/build_firefox.py` vẫn còn nhưng không dùng cho phát hành. Thứ tự script trong manifest và HTML là thứ tự nạp cần giữ.

Có 6 entry `content_scripts`: base `document_start`/`all_frames` nạp browser API/messaging/font; app chính chạy `document_idle` ở top frame; `grok-google-auth.js` chỉ kiểm tra frame `accounts.google.com` cùng ancestor origins; ChatGPT link marker chạy sớm; một entry `document_start` trên host ChatGPT/Gemini/Claude nạp `providers.js`, `prompt-format.js`, `toolbar.js`, `page/composer.js` (editor bridge); một entry `document_idle` nạp `page/send-flow.js` (pipeline Send/link/mapping chung: chèn URL lúc Send, chỉ submit khi Keepit auto-send được opt-in, báo mapping sau confirmed send). Firefox panel toolbar chỉ hiện khi marker hợp lệ và sidebar đang mở. Generic fill không tự submit và không lưu/restore composer draft.

### Tài liệu cục bộ

- `pages/documents.html`/`documents.css` chỉ giữ thư viện và original-file surfaces; không còn `#player`, `#sel`, `#dict`, Notes/AI pane riêng.
- Danh sách bố cục và zoom viewer dùng `LHN_ICONS.createFlowSelect` trên select gốc, menu tự giới hạn theo vùng hiển thị và rộng theo nội dung; iframe Dashboard cho phép viewer toàn màn hình; phím mũi tên trong điều khiển không kích hoạt phím tắt đọc. Cài đặt Tài liệu ở dashboard và viewer đồng bộ qua `lhnDocumentsFlow`/`lhnDocumentsPager`/`lhnDocumentsCompactTop`; viewer giữ grid trang gốc riêng với chế độ Đọc. Viewer gửi ngữ cảnh một trang khi mở cài đặt, không đổi giá trị flow đã lưu; icon Cài đặt dùng `LHN_ICONS`.
- `documents.js` + `documents-context.js` cung cấp source identity/blocks/page anchors/layout cho `content.js` và `bilingual-reader.js` gốc; adapter lấy queue block theo target double-click, đặt speaker trên overlay không scale theo cuối paragraph và ánh xạ hover PDF spans về icon tương ứng. Web không có host phải giữ đường cũ; Source URL chỉ owned Dashboard document UUID.
- Blob/metadata/progress ở `keepit-documents`. Notes/Flashcards mới ở annotations chung; legacy v314 migration giữ nội dung/ngày/anchor, idempotent và không tái tạo note đã xóa. JSON backup có Notes nhưng không blob; import rewrite đúng owned extension origin.
- `LHN_SELECTION_TOOLBAR.installTouchSelectionBridge` là bridge touch duy nhất. `LHN_SIDEBAR.attachTouchSheet` dùng chung setup grow/scroll/drag. `js/ask-ai/sheet.js` là AI sheet đã chuyển nguyên component từ web bar, dùng cho web và Documents; parent Dashboard chuyển message top-frame cho source active.
- `LHN_READER_API` chỉ facade của Reader gốc: không queue/UI khác; host cung cấp chữ tệp/chuyển trang/vị trí native card, pager nhường khi bar mở. AI dùng native panel/sheet và Send policy hiện có, không upload/read toàn bộ file tự động.
- Documents main sheet đặt Dịch/Đọc to ở footer cố định cạnh Cài đặt qua `LHN_DOCUMENTS_MAIN_ACTIONS`; callbacks chia sẻ handler với viewer topbar. Điều khiển Ẩn/Hiện thanh không hiện riêng ở sheet này.
- Renderer/vendored licences/giới hạn v314 giữ nguyên; details ở `docs/documents.md` và trang module tương ứng.

### 4.2. Luồng tương tác giữa các module
```text
Popup ── yêu cầu mở Dashboard / gửi thao tác tab ──┐
Dashboard ── annotations, bilingual translate, usage ┤
Content ── annotations, highlight, mở Dashboard ─────┼──> core/messaging
Reader ── bilingual translate / nhận diện ngôn ngữ ──┤         │
TTS engine ── tải audio Google TTS ──────────────────┘         ▼
                                                     Background service worker
                                                       ├── Translate + cache
                                                       ├── Google TTS + audio cache
                                                       ├── Annotations + IndexedDB
                                                       ├── Usage limits
                                                       └── mở tab/đi tới highlight

Reader ── Readability ──> chọn nội dung chính của trang
Content ── Highlighter / Note Composer / Highlight Sidebar ──> giao diện trên trang
AI panel toolbar ── provider selection per window + last choice ──> Background session/local state ──> provider iframe trong pages/ai-panel.html (Chromium + Firefox)
Content/commands ── OPEN_AI_PANEL / Alt+X / context menu ──> `ask-ai/service.js` lấy exact tab URL + selection tường minh; AI đang chọn quyết định key mapping; prompt giống nhau cho mọi AI; draft không có URL tới lúc Send; `page/composer.js` điền, `page/send-flow.js` gửi/chèn URL/báo `AI_LINK_RESULT`.
Content/commands ── AI provider route workflow ──> Background exact-URL mapping lookup for ChatGPT/Gemini/Claude. Auto-send defaults off for new installs and honors saved explicit preferences. Gemini/Claude drafts keep the URL absent until send; every manual Send, including mapped-source and hand-typed prompts, adds localized label + exact current URL only after stable exact-editor verification. Failed verification sends nothing and cannot save a mapping; successful mapping requires confirmed send. URL-only and page-complete source events refresh the selected provider context; mapped context routes in Chromium/Firefox and unmapped context returns to provider start. User-written prompts are never auto-sent and their bodies are not persisted. Opt-in explicit Keepit auto-send uses `?q=` for ChatGPT; Gemini/Claude use the shared send flow. Same URL: Alt+X only reopens and focuses the composer when explicitly invoked; Ask AI on a mapped source sends only the selection + instruction (same for all three). No passive prompt/send; no page body/title/clipboard; legacy clipboard/body-text path remains unused.
Content selection ── generic page ──> popup/dictionary unchanged; video overlay ── primary transcript only ──> translation/Full Dict
Dashboard ── Overview / Dictation / Highlights & Notes (LR) / Documents / Flashcards / Settings / Account / Backup ──> giao diện quản lý
Browser PDF tab (`file:`/HTTP(S) `.pdf`, kể cả URL nguồn bọc trong viewer) ──> Background đặt badge `PDF` + inject iframe overlay (20px dưới viewer bar) và action popup card ──> X thu icon/mở lại; cả hai CTA gửi `OPEN_DASHBOARD_DOCUMENTS` với source URL ──> Dashboard Documents fetch/import/mở PDF; local file cần Allow access to file URLs và picker fallback; không redirect tab
Documents main sheet ── `doc:translate` / `doc:read` ──> `LHN_DOCUMENTS_MAIN_ACTIONS` ──> same `setPanel('translation')` / `startNativeReader()` used by viewer topbar
Dictation title observer ──> debounced session-index title update ──> popup bridge storage listener ──> live `context-source` refresh; popup fixed-height body scrolls at 3px
Dictation detailed-stats button ──> same-origin popup bridge ──> local Dictation schema v3 (per-attempt category + example context) ──> approved v7 global / critical / per-web views
Highlights & Notes + Dictation stats popup ──> shared/site-icons.js (LHN_SITE_ICONS) ──> origin-based browser.storage.local favicon cache
Overlay Web + YouTube title bar ──> shared/site-icons.js (LHN_SITE_ICONS) ──> same origin favicon, 22×22 toolbar slot
Dictation YouTube/Web + Dashboard Dictation + Highlights & Notes sources ──> shared/thumbnails.js (LHN_THUMBNAILS) ──> shared URL/fallback/load logic
Dashboard sidebar: mặc định mở 220px; nút pin chuyển 220px/56px trong flex layout để vùng nội dung trượt theo; nút pin hiện khi hover lúc menu thu gọn, avatar popover và hai nút theme giữ luồng hiện có
Dashboard Settings ── ô tìm (`initSettingsSearch`) ──> shared/search (`LHN_INDEX_SEARCH`, debounce 200 ms)
                      └──> chỉ bật/tắt class tạm (`is-searching`, `has-search-match`, `settings-search-hidden`)
                           trên hàng/nhóm/tab và bọc kết quả trong `mark.lhn-search-match` (cùng kiểu tô sáng Dashboard/sidebar);
                           không đổi `hidden` hay state; Esc, đổi tab, đóng hộp thoại thì gỡ mark và xóa class
Dashboard Settings (`dualSubtitlesShortcut` Alt+E / `dictationShortcut` Alt+F) ── storage ──> Content keydown ── `lhn-youtube-dual-subtitles-toggle` / `lhn-youtube-dictation-toggle` ──> `js/overlay/overlay-controller.js` ──> shared overlay cho YouTube hoặc Web
`lhnSettings.language` storage change ──> `refreshSubtitleLanguageSettings` ──> overlay labels + open Dictation labels
Reader (`LHN_READER_MAIN_SOURCE.getTextBlocks({forceRefresh:true})`) ──> `js/overlay/source/web.js` (`sourceType: web`) ──> content-hash sentence cues: same-document memory snapshot + `WEB_STUDY_CUE_CACHE_GET/SAVE/TOUCH` (7-day sliding TTL) ──> lazy `LHN_TTS`/`BILINGUAL_TRANSLATE` existing caches + `LHN_THUMBNAILS` ──> Overlay/Study Dictation UI/engine; reload/URL change refreshes Reader source, unchanged source can reuse persistent cues; YouTube cache stays separate. `view/cc-mode.js` applies cue-language default (same→primary; different/unknown→bilingual; manual choice wins). Reader stop/start exclusivity, shortcuts, controls and Ambient behavior unchanged
Web TTS (`source/web.js`) ──> `overlay-controller.js` playback controls (`startWebTtsInViewMode`, `syncReadingAudioControls`; từ `study/shadowing/shadowing.js`, v3.5.196) ──> existing `LHN_TTS` chunk callbacks + retained Audio/SpeechSynthesis handle; live speed update and same-position Pause/Play; YouTube and Reader consumers unchanged
Video source (`js/overlay/source/video.js`: `state.allCues`, `sourceLanguage`, video-specific transcript/cache) ──> `overlay-controller.js` / View
  └── `overlay-controller.js` (`LHN_OVERLAY_API`, `LHN_STUDY` activity routing; `LHN_DICTATION` compatibility alias) ──> tab Nói/Chép của `unified/unified-ui.js` (panel Study cũ đã xoá ở v3.5.196)
                                  ├── BILINGUAL_TRANSLATE → câu VI chỉ sau khi đúng
                                  └── browser.storage.local → solved / notes / bản dịch theo source+câu + thống kê từ sai theo video/từ/vị trí
Popup / Reader (chọn giọng) / Dashboard Settings (chọn ngôn ngữ, ô tìm) ── dùng chung ──> shared/search
```

Sidebar trang giữ tab Highlight; Alt+X mở/toggle browser-native AI panel; Hỏi AI mở hoặc giữ panel mở. Provider selection lưu theo window trong `storage.session` và lựa chọn gần nhất trong `storage.local`, đọc qua `pickSelectedProvider` chung; visible tabs chỉ là ChatGPT, Gemini, Claude, còn Grok hidden nhưng registry/auth code không bị xóa. Chromium giữ provider trong iframe; Firefox dùng sidebar native và chuyển provider top-level. Gemini/Claude dùng exact source→conversation mapping, localized prompt, URL injection lúc Send trên source chưa map (gồm prompt tự gõ; source đã map không thêm URL như ChatGPT) và shared opt-in auto-send cho explicit Keepit actions. ChatGPT/Gemini/Claude dùng một pipeline: iframe `page/composer.js` báo `KEEPIT_AI_PANEL_CONVERSATION`, `panel/panel.js` áp `planPanelNavigation()` stay/reload/load, route session (`AI_PANEL_ROUTE_CONTEXT`) mở lại đúng chat cho cả ba AI. User-written prompts không bao giờ auto-send; mapping chỉ sau confirmed send. Riêng ChatGPT chỉ khác ở dữ liệu `?q=` + early marker. Grok embedded sign-in legacy handler chỉ giữ origin validation; không hiện Grok tab/button. Không đọc page body/title/clipboard, không lưu/khôi phục unsent draft. Tab/source context đổi dùng debounce 2 giây; đóng panel hủy timer/request. Không dùng global last-chat URL. Toolbar geometry giữ nguyên; auto-send hiện với ChatGPT/Gemini/Claude. DNR rule 9002 chỉ nhắm subframe trên allowlist provider; không thêm Google auth vào DNR. Manifest không cấp clipboard permission.

Các mũi tên qua `core/messaging` là runtime messages. Settings giao diện được đọc/ghi trực tiếp qua `browser.storage`; không phải mọi luồng đều đi qua Background. Trong Dashboard, `dashboard.js` điều phối Overview, Dictation và Highlights & Notes dưới một `#dashboardScroller`, shared theme và topbar; mỗi route giữ content/logic riêng, vị trí cuộn được lưu độc lập theo tab và restore cùng route cuối sau reload. Highlights & Notes chạy trong cùng document qua event bus nội bộ, nhận snapshot annotations/favorites từ Dashboard; mọi ghi/xuất/review/action quay lại handler hiện có, không thêm API/backend hoặc nguồn lưu annotation thứ hai. Dictation dùng route `dictation`; phiên và tiến độ lấy từ `js/overlay/study/shared/session-index.js`, được đối soát với record thật `dictation:<sourceId>` để phục hồi mục thiếu; YouTube/Web sessions giữ source ID và URL tương ứng, thống kê lỗi đọc từ dữ liệu đã lưu, còn tab hiển thị empty state khi chưa có dữ liệu. Hai route dự phòng Grammar/Library và code riêng chỉ phục vụ chúng đã bị xóa; các route còn lại không đổi.

### OCR clean rebuild — ranh giới module mới

`documents.js` → getter host `KeepitOcrDocumentHost` → `ocr-controller.mjs`; canvas dùng `ocrCanvas` trên renderer hiện tại, không viewer/file-store song song. `vendor/ocr` chứa Tesseract worker/core/data, preprocessing demo và PDF exporter deps. `ocr-localize.mjs` dùng catalogue `languages.js`; theme theo setting app. Store `ocr` trong DB Documents v3; purge theo index document. Lớp `.para`/`.en` quay lại controller app. CSS demo scope dưới `.keepitOcr`; chặn root ẩn bắt pointer, reset xung đột `.row`/`.vbanner`, thanh viewer dọc cao 52px theo demo. Không bê toolbar/Reader/Notes giả của demo. Tesseract retry trang lỗi một lần rồi đi tiếp; kết quả một phần đếm đúng lượt hiện tại. Đóng tài liệu đợi PDF export cleanup và chặn tải muộn; ảnh OCR tối đa 16 megapixel. Harness, bằng chứng và script tạm ngoài source. Từ 3.5.615: `.layer` chữ vẫn ở native page units; `.ocrVisualSurface` giãn kích thước và inverse-scale theo `--source-scale` để scan/word/hover/region được vẽ bằng display pixels. `.ocrWordBox` lấy rect chuẩn hóa, không outline text span đã transform; không style nested `.en`. Overlay reset padding/min-width của `.paper` app. Reverse hover khớp cụm geometry/text trước fallback offset để không sai sau vùng append. Từ 3.5.616: host `goTo` riêng OCR truyền `smooth` vào `setPage`; `scrollToPage` giữ đích tạm trong hai flow cuộn, bỏ lệnh trùng cùng đích/pixel, retarget khi resize đổi hình học. Scroll observer không đổi current về trang đi ngang qua; input người dùng nhả đích. `sizePages` không gán scrollTop đè native animation. Điều hướng khác và kiểu xem rời giữ mặc định auto.

## 5. Nhật ký

Nhật ký cũ: `docs/changelog/ocr-clean-base-history.md`.

**2026-11-26 | v3.5.617 | Arena sửa:**

- Tóm tắt: sidebar OCR ngang bỏ giới hạn mặc định 42vw, dùng cùng giới hạn 380px/viewport với popup; giữ ưu tiên `--trW` đã lưu và kéo resize. Popup tăng z-index trên host Back to top (Shadow DOM), dưới sheet thanh Keepit; không dịch vị trí, không đổi portrait toàn màn hình, engine, flow hay UI khác.
- File: `css/dashboard/ocr-demo.css`, `manifest.json`, `PROJECT.md`, `README.md`, `docs/documents.md`, `THIRD_PARTY_NOTICES.md`; root `AGENTS.md` bỏ version snapshot cố định để tra manifest hiện hành.
- Kiểm tra: HTTP app thật với shim extension API (không phải unpacked), 6/6 trường hợp 1512/800/390 × theme app sáng/tối: ở ngang sidebar/popup 380px (800px trước là336px), dọc giữ sidebar390px/popup374px; rect popup trước/sau không đổi. Cuộn stage thật để Back to top hiện: hit-test tại vùng chồng trước trúng host thanh, sau trúng popup cả6/6. Kéo chuột thật 380→500px, reload khôi phục500px; OCR Tesseract ảnh tổng hợp hoàn tất, có chữ và1 bản ghi OCR, scan được dọn. console.error/pageerror HTTP rỗng; công cụ storage7/7. Chưa QA ảnh/PNG/crop4×/pixel/CSP/permission hay extension thật vì chrome://extensions bị chặn; không đánh dấu đạt nghiệm thu UI bắt buộc.

**2026-11-26 | v3.5.616 | Arena sửa:**

- Tóm tắt: sửa chuyển trang giật khi OCR cuộn liên tục: thay nhảy `scrollTop` bằng native smooth riêng host OCR, cùng cơ chế cuộn mượt demo; giữ current ở trang đích trong quá trình cuộn, tránh boot/engine gọi trùng làm restart, không để resize-preserve ngắt animation hoặc giữ tọa độ cũ khi kích thước đổi. Wheel/touch/pointer/key trả lại tracking thủ công; điều hướng app khác, single/facing rời, engine, lưu trữ, scan/khung/CSS của 3.5.615 không đổi.
- File: `js/dashboard/documents.js`, `manifest.json`, `PROJECT.md`, `README.md`, `docs/documents.md`, `THIRD_PARTY_NOTICES.md`; chuyển nguyên văn hai bản ghi cũ sang `docs/changelog/ocr-clean-base-history.md` để giữ 30 mục log mới nhất.
- Kiểm tra: harness HTTP mới trace rAF/scrollTop, cùng byte PDF với demo 2.9.7.33 ở origin riêng. Trước sửa 0/8, nhảy trọn quãng ngay khung đầu, không frame trung gian; sau sửa 8/8 ở 1512/390 × nút theme sáng/tối × continuous/facingContinuous, native smooth có nhiều frame trung gian, đơn điệu, current không lùi, pageStack giữ nguyên. 8/8 lượt OCR thật 3 trang: bắt đầu ở trang1 sau resize, scan đủ 1/2/3, lưu đúng từng page, chuyển mượt và dọn scan. Node24/24, static29/29, scan/khung64/64, bốn flow/hủy18/18, hồi quy15/15, range/current/native-PDF13/13; cú pháp/undefined checks (khai báo shared globals) sạch, console.error/pageerror HTTP rỗng. Wheel thật trusted đã kiểm đổi current3→2 theo cuộn thủ công. Đây không phải bộ ảnh/video/pixel/unpacked; giới hạn môi trường vẫn còn, không đánh dấu 100% hay hứa timing/FPS tuyệt đối.

**2026-11-26 | v3.5.615 | Arena sửa:**

- Tóm tắt: sửa đúng nguyên nhân UI scan/word/region bị phóng theo native PDF: tách visual surface inverse-scale, reset padding của `.paper`, vẽ box từ rect chuẩn hóa thay outline span text/nested `.en`. Giữ lớp chữ native và công cụ app; khớp reverse-hover theo cụm chữ trước fallback để region append không làm sáng nhầm. Không đổi engine, schema, labels, theme hay renderer.
- File: `js/dashboard/ocr-controller.mjs`, `css/dashboard/ocr-demo.css`, `manifest.json`, `PROJECT.md`, `README.md`, `docs/documents.md`, `THIRD_PARTY_NOTICES.md`.
- Kiểm tra: HTTP fixture PDF 3 trang 72×96pt, OCR thật; trước sửa 0/16 ca, sourceScale 10.5556 làm scan 2→21.11px/trail 120→1266.67px/region 2→21.11px và overlay vượt trang; sau sửa 64/64 ca 1512/390 × sáng/tối (nút app) × 4 flow × fit/50/100/800 zoom, scale 0.5–10.5556; visual rect khớp trang, scan 2px/trail120px/region2px/radius2px, nested outline none, scan giữa chu kỳ khớp 50%, thời gian 2.8s/5.6s. Node 16/16, static 29/29, regression 15/15; ESLint/console.error/pageerror HTTP rỗng. Scan trong lượt OCR thật visualScale≈1, beam running 2800ms, line2px/trail120px. Chuột thật kéo vùng 360×36px, nhận đúng tiêu đề, Apply đóng/clear scan, hover thuận/ngược và chọn chữ/tool app. QA chỉ HTTP; chưa unpacked/PNG/crop4×/pixel diff/CSP/permission thật; không tuyên bố đạt 100% demo. Bản 3.5.614 có 976 mẫu style nhưng bỏ sót lỗi overlay, không dùng kết quả đó làm bằng chứng phủ nhận phản hồi người dùng.

**2026-11-26 | v3.5.614 | Arena sửa:**

- Tóm tắt: **bản test 3.5.614; người dùng đồng ý đóng gói với giới hạn QA, không tuyên bố 100%**. Bỏ toàn bộ nền OCR bị loại, sao lại nguồn gốc 3.5.612 và chỉ lấy UI/engine từ demo 2.9.7.33. Không tham khảo các bản OCR bị loại. Dùng Tesseract trước, hoãn PP/Fusor; giữ luồng vùng và khung OCR khi sửa text của demo; sửa hover sau merge bằng geometry, root ẩn chặn pointer, CSS kế thừa gây dư 18px ở hộp vùng/co thông báo/lệch 6px trên màn dọc; retry trang lỗi một lần, tiếp tục batch và đếm đúng phần đã xử lý; chặn PDF export tải muộn khi đóng/chuyển tài liệu, không bật nhầm progress OCR khi xuất.
- File: `manifest.json`, `pages/documents.html`, `css/dashboard/ocr-demo.css`, `js/dashboard/{documents.js,documents-store.js,documents-renderers.js,ocr-controller.mjs,ocr-localize.mjs}`, `js/core/languages.js`, `vendor/ocr/`, `licenses/ocr-demo/`, README/privacy/notices và docs. Không sửa `Keep-it` gốc.
- Kiểm tra: QA mới `qa-clean`, không tái dùng test/kết quả bản bị loại: 13/13 Node migration/logic/source parity, 15/15 regression, 13/13 current/range/native PDF, 14/14 export/Office tổng hợp, 9/9 retry/partial; OCR thật HTTP, bốn flow/cancel, persist/edit/hover, region bằng chuột, pypdf đọc PDF chữ ẩn. DOM 7 component khớp và 976 mẫu style/20 trạng thái ở 1512/390 sáng/tối không lệch thuộc tính đang đo; đây không phải ảnh. Cùng PNG đầu vào cho text/boxes Việt/Hàn trùng demo; mẫu Hàn vẫn sai một phần như demo. PDF raster trực tiếp khác đường resample canvas của demo nên không hứa byte-identical OCR trên PDF. **Chưa chạy unpacked và chưa có ảnh bắt buộc/crop 4×/pixel diff; bị chặn bởi isolated browser context. Chưa thể nghiệm thu 100%. Người dùng đã chọn cho phép tăng version một lần, commit và ZIP bản test với giới hạn được ghi rõ; tên ZIP `Keepit - Optimize Test-v3.5.614.zip`, thư mục `Workspace/Keepit-Check-Zip` theo quy tắc Arena. Kho nguồn mới khởi tạo Git vì bản sao gốc không có metadata Git; không dựng lại lịch sử giả.**

**2026-11-25 | v3.5.612 | dựa trên 3.5.611, không OCR:**

- Tài liệu: ẩn gợi ý quét/nhận dạng chữ; giữ gợi ý dành cho ảnh và DOCX/PPTX. Không thêm chức năng OCR.
- Kiểm tra: `node --check js/dashboard/documents.js`, xác nhận nhánh `scan` không còn trong banner nhưng `imageHint`/`officeHint` vẫn còn; ZIP không chứa tệp OCR và CRC hợp lệ. Chưa chạy UI Chromium trong lượt này.

**2026-11-17 | v3.5.611 | Arena:**

- Tóm tắt: Căn thanh phím tắt cùng tâm Reader trong vùng xem, giới hạn theo vùng và giữ nút đóng ở màn hẹp; giữ pager hiện khi menu Thêm hoặc sheet menu chính mở, sau đóng tiếp tục mờ/ẩn theo cài đặt; chế độ Ẩn hẳn vẫn giữ.
- File: `css/dashboard/documents.css`, `js/dashboard/documents.js`, `manifest.json`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked dashboard 1512/390 sáng/tối, ảnh và crop 4×, chạm giả lập; tâm khớp khi hiện/ẩn dải trang và mở dịch; Tự làm mờ/Tự ẩn sáng khi menu mở và trở về sau đóng, Ẩn vẫn ẩn; console/pageerror rỗng. Chưa kiểm profile Windows, thiết bị cảm ứng thật, Android/Firefox và tệp người dùng.

**2026-11-17 | v3.5.610 | Arena:**

- Tóm tắt: Sửa ô chọn tùy biến trong menu Thêm không giãn theo hàng khiến nhãn thu phóng bị cắt; khôi phục bố cục rộng của 3.5.595, giữ bốn kiểu trang, icon và menu mới.
- File: `css/dashboard/documents.css`, `manifest.json`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked dashboard 1512/390 sáng/tối, ảnh và crop 4×, 390 cảm ứng giả lập; ô trang 320/344px, zoom 236/260px (chuột), nhãn vi/en/ko và danh sách, chọn trang/zoom, fullscreen, bật thu gọn; console/pageerror rỗng. Chưa kiểm profile Windows, cảm ứng thật, Android/Firefox và tệp người dùng.

**2026-11-17 | v3.5.609 | Arena:**

- Tóm tắt: Reader nằm giữa vùng xem tài liệu và theo dõi các panel; thu gọn 80% thêm Reader/nút về đầu, menu Reader giữ cỡ thường, Reader tự vừa vùng hẹp.
- File: `css/dashboard/documents.css`, `js/dashboard/documents.js`, `js/content/keepit-bar-css.js`, `js/core/languages.js`, `manifest.json`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked dashboard 1512/390 sáng/tối, ảnh và crop 4×, cảm ứng giả lập; tâm Reader/vùng xem trùng khi ẩn dải trang/mở dịch, 560×64 → 448×51,2px, nút về đầu 46 → 36,8px và cuộn về 0; menu tốc độ hoạt động, console/pageerror rỗng. Chưa kiểm profile Windows, thiết bị chạm thật, giọng thật, Android/Firefox và PDF/Office người dùng.

**2026-11-17 | v3.5.608 | Arena:**

- Tóm tắt: Chuyển động trượt 0,26s cubic-bezier(.2,.8,.2,1) cùng thanh Ghi chú cho dải trang và bảng dịch Tài liệu, cùng hai cột Nói/Chép Overlay; vùng giữa co giãn đồng bộ, màn dọc bảng dịch giữ kiểu sheet; hỗ trợ giảm chuyển động.
- File: `css/dashboard/documents.css`, `js/dashboard/documents.js`, `js/overlay/ui/overlay-css.js`, `js/overlay/ui/overlay-ui.js`, `manifest.json`, `docs/documents.md`, `docs/modules/overlay.md`, `PROJECT.md`.
- Kiểm tra: extension Chromium unpacked, ảnh 1512/390 sáng/tối và crop 4×; tài liệu PDF fixture và Overlay trang web fixture, đo vị trí lúc chuyển động, ẩn/hiện và mở lại hai cột; console/pageerror rỗng. Màn dọc Overlay không có hai cột theo thiết kế. Chưa kiểm profile Windows, cảm ứng thật, video/phụ đề thực, Android/Firefox và tài liệu của người dùng.

**2026-11-17 | v3.5.607 | Arena:**

- Tóm tắt: Tay kéo trái đồng kiểu panel phải; dải trang ẩn/hiện chuyển động 250ms, tôn trọng giảm chuyển động, giữ trạng thái và kéo.
- File: `css/dashboard/documents.css`, `js/dashboard/documents.js`, `manifest.json`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh và crop 4×; nét hai tay kéo 2×32px, ẩn/hiện, đóng/mở nhanh, phím và reload đạt; chạm và kéo giả lập riêng đạt, nhưng click giả lập sau kéo CDP chưa xác minh; console/pageerror rỗng. Chưa kiểm cảm ứng thật, profile Windows, Android/Firefox và tài liệu người dùng.

**2026-11-17 | v3.5.606 | Arena:**

- Tóm tắt: Thu gọn 80% cả thanh trên và dưới; dải trang kéo chỉnh rộng, ẩn/hiện, ghi nhớ và giới hạn theo màn hình; menu xổ vẫn cỡ thường.
- File: `pages/documents.html`, `css/dashboard/documents.css`, `js/dashboard/documents.js`, `js/core/languages.js`, `manifest.json`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh 4×; kéo chuột, bàn phím, ẩn/hiện và reload; giả lập cảm ứng 390; thanh dưới chuột 42/34px, cảm ứng 50/40,4px; menu bố cục, console/pageerror rỗng. Chưa kiểm thiết bị cảm ứng thật, profile Windows, Android/Firefox và PDF/Office của người dùng.

**2026-11-17 | v3.5.605 | Arena:**

- Tóm tắt: Giảm một nửa khoảng trống dọc thanh trên tài liệu, giữ cỡ nút và thu gọn 80%.
- File: `css/dashboard/documents.css`, `manifest.json`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh và crop 4×; chuột 46/36,8px, cảm ứng giả lập 52/41,6px; menu Thêm và Đọc/Đọc to; console/pageerror rỗng. Chưa kiểm thiết bị thật, profile Windows, Android/Firefox và cảm giác dùng.

**2026-11-17 | v3.5.604 | Arena:**

- Tóm tắt: thu gọn thanh trên còn 80% thay vì 60%; chế độ Đọc chỉ đổi cách xem, không tự mở Đọc to; `arena.ai` được thêm một lần vào Tắt website, giữ danh sách cũ và cho xóa/bật lại.
- File: `css/dashboard/documents.css`, `js/core/languages.js`, `js/dashboard/documents.js`, `js/background/background.js`, `manifest.json`, tài liệu.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh phóng 4×; thanh 56→44,8px chuột, 60→48px chạm giả lập; chọn Đọc và mở trực tiếp Đọc không bật giọng, nút Đọc to vẫn kích hoạt reader; trang HTML giả lập tại arena.ai thấy thanh ẩn, cài mới/di trú giữ sites cũ, xóa không bị thêm lại. Console/pageerror rỗng; chưa kiểm trang Arena thật/profile Windows, Android/Firefox, giọng và thiết bị thật.

**2026-11-17 | v3.5.603 | Arena:**

- Tóm tắt: thêm công tắc Thu gọn thanh trên trong Cài đặt Tài liệu; mặc định tắt, khi bật chỉ thanh trên thu về 60%, ghi nhớ và đồng bộ trực tiếp. Không thu thanh dưới, menu hay nội dung tài liệu.
- File: `pages/dashboard.html`, `css/dashboard/documents.css`, `js/dashboard/dashboard.js`, `js/dashboard/documents.js`, `js/core/languages.js`, `manifest.json`, tài liệu.
- Kiểm tra: Chromium extension unpacked 1512/390 sáng/tối, ảnh chi tiết 4×; bật/tắt, đồng bộ iframe và reload; thanh chuột 56→33,6px, chạm giả lập 60→36px, nút chạm 44→26,4px theo yêu cầu. Tên PDF dài, co giãn 320/390/1512, menu Thêm và đổi theme; console/pageerror rỗng. Chưa kiểm thiết bị cảm ứng thật, Windows/profile thật, Android/Firefox và Office thực; 60% khiến đích chạm nhỏ.

**2026-11-17 | v3.5.602 | Arena:**

- Tóm tắt: thống nhất tên đầy đủ và rút gọn của Vừa rộng trong danh sách zoom và nút chọn: vi “Vừa rộng”, en “Fit width”, ko “너비 맞춤”; không thay logic zoom.
- File: `js/core/languages.js`, `pages/documents.html`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: Chromium extension unpacked PDF mẫu, 1512/390 sáng/tối, ảnh chi tiết 4×; cả hai chỗ khớp vi/en/ko, nút/danh sách tiếng Việt 90/90px desktop và 97/97px mobile; chọn Vừa rộng, console/pageerror rỗng. Chưa kiểm thiết bị thật, Windows/profile thật và Android/Firefox.

**2026-11-17 | v3.5.601 | Arena:**

- Tóm tắt: hai danh sách và nút chọn tự tính độ rộng theo mục dài nhất; thêm nút vào/thoát toàn màn hình bên trái menu. Cho phép iframe Documents toàn màn hình; Escape thoát toàn màn hình, đóng tài liệu/mở Cài đặt sẽ thoát trước.
- File: `js/shared/icons.js`, `js/dashboard/documents.js`, `js/core/languages.js`, `pages/documents.html`, `pages/dashboard.html`, `css/dashboard/documents.css`, `manifest.json`, tài liệu.
- Kiểm tra: Chromium extension unpacked 1512/390 sáng/tối và ảnh nút phóng 4×; không cắt mục vi/en/ko, danh sách và nút lần lượt 154/154px và 125/125px ở 1512 tiếng Việt, màn hình hẹp 169/169px và 137/137px; fullscreen iframe bật/tắt, Escape không đóng tài liệu, chạm giả lập 390 nút 44×44; console/pageerror rỗng. Chưa kiểm profile Windows, màn hình/thiết bị cảm ứng thật, Android/Firefox và Office thực.

**2026-11-17 | v3.5.600 | Arena:**

- Tóm tắt: danh sách bố cục rộng bằng nút, giữ thanh hiển thị khi danh sách mở; menu zoom dùng cùng kiểu bo góc và cuộn trong vùng có chỗ. Giữ điều khiển/lưu zoom và sở thích tài liệu, tiếp tục cho ảnh Vừa ảnh.
- File: `js/shared/icons.js`, `js/dashboard/documents.js`, `pages/documents.html`, `css/dashboard/documents.css`, `manifest.json`, tài liệu.
- Kiểm tra: Chromium extension unpacked 1512/390 sáng/tối, ảnh phóng 4×; danh sách/nút 144/144px desktop, 344/344px mobile; zoom desktop 114px, mobile 260px, chạm giả lập 244px với menu cuộn trong sheet. Rê và mở list 2,5s khi Tự làm mờ/Tự ẩn, đóng và rời đi mờ/ẩn lại; zoom PDF 200/6400, ảnh Vừa ảnh, file một trang khóa 3 mục, phím mũi tên/Escape, console/pageerror rỗng. Chưa kiểm profile Windows thật, cảm ứng thật, Android/Firefox và file Office thật.

**2026-11-17 | v3.5.599 | Arena:**

- Tóm tắt: vẽ lại bốn icon theo ảnh mẫu và hiển thị bên cạnh từng lựa chọn trong danh sách kiểu trang của viewer; Cài đặt giữ danh sách cũ theo trao đổi. Giữ đồng bộ, nhớ lựa chọn và khóa lựa chọn không hợp lệ cho file một trang.
- File: `js/shared/icons.js`, `js/content/content.js`, `js/dashboard/documents.js`, `pages/documents.html`, `css/dashboard/documents.css`, `manifest.json`, tài liệu.
- Kiểm tra: Chromium extension unpacked 1512/390 sáng/tối, ảnh chi tiết phóng 4×; PDF mẫu 1 và 5 trang, chọn kiểu bằng chuột và chạm giả lập 390, đồng bộ hai chiều với Cài đặt, khóa 3 mục khi một trang; bàn phím mũi tên/Enter/Escape và reload nhớ kiểu. Danh sách đo 200×154 px chuột, 200×186 px chạm; console/pageerror rỗng. Chưa kiểm profile Windows thật, cảm ứng thiết bị thật, Android/Firefox và tài liệu Office thực. Icon được dựng lại từ ảnh nhỏ, không có file vector gốc.

**2026-11-17 | v3.5.598 | Arena:**

- Tóm tắt: thay icon Cài đặt tự vẽ bằng icon chung; dùng nguồn chung ở dashboard, menu, popup và các nút cài đặt liên quan. Nút Cài đặt trên viewer và trong menu tài liệu mở thẳng tab Tài liệu. File một trang hiển thị Từng trang, khóa ba kiểu khác ở viewer và cài đặt mở từ file, không ghi đè lựa chọn cho file nhiều trang.
- File: `js/shared/icons.js`, `js/content/keepit-bar.js`, `js/dashboard/documents.js`, `js/dashboard/dashboard.js`, `js/dashboard/responsive-nav.js`, `js/popup/popup.js`, `pages/documents.html`, `pages/dashboard.html`, `pages/popup.html`, `manifest.json`, tài liệu.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối và icon phóng 4×; file PDF mẫu 1 và 5 trang, lựa chọn và các option disabled, file nhiều trang khôi phục Hai trang, nút menu và nút trên mở tab Tài liệu desktop/mobile, viewer độc lập mobile, popup có icon chung. Nút trên 40×36 px; console/pageerror rỗng. Chưa kiểm profile Windows thật, cảm ứng thật, Android/Firefox, file Office một trang và trang web thực.

**2026-11-17 | v3.5.597 | Arena:**

- Tóm tắt: thêm tab Cài đặt Tài liệu, bốn bố cục trang và bốn trạng thái thanh dưới; mặc định Liên tục/Tự làm mờ, lưu và đồng bộ viewer-dashboard; khi ẩn thanh có nút mở đúng tab cài đặt. Giữ hai trang trên màn hình hẹp, ảnh đơn không ghép. Không thêm trang bìa riêng.
- File: `js/dashboard/documents.js`, `css/dashboard/documents.css`, `pages/documents.html`, `js/dashboard/dashboard.js`, `pages/dashboard.html`, `js/core/languages.js`, `manifest.json`, tài liệu liên quan.
- Kiểm tra: Chromium extension unpacked 1512/390 sáng/tối, ảnh chi tiết 4×; PDF 5 trang bốn kiểu, cặp 1–2/3–4/trang 5, chọn chữ và lưu ghi chú trang 2 bằng chuột; DOCX/PPTX ba trang ghép và chuyển trang; nút cài đặt desktop/mobile, đồng bộ hai chiều, reload nhớ, tự ẩn với chuột và chạm giả lập. Console/pageerror rỗng ở các lượt chính; lượt ghi chú có lỗi HTTP 429 từ tài nguyên ngoài chưa xác định. Chưa xác minh ghi chú sau reload, dịch/đọc to trong bố cục mới, zoom và cuộn ngang hai trang bằng thao tác thực, ảnh đơn và cảm ứng thiết bị thật, Windows/profile thật, Android/Firefox, Office phức tạp.

**2026-11-17 | v3.5.596 | Arena:**

- Tóm tắt: mở ảnh mặc định Vừa rộng, giữ Vừa ảnh riêng với cách giới hạn theo chiều cao và kích thước ảnh cũ; hỗ trợ các mức zoom đến 6400% cho ảnh, DOCX, PPTX như PDF, nút + không nhảy nhỏ khi từ Vừa rộng. Dùng nhãn vi/en/ko đã có; không đổi khởi tạo Vừa rộng của định dạng tài liệu khác.
- File: `js/dashboard/documents.js`, `pages/documents.html`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối và ảnh chi tiết phóng 4×; ảnh người dùng, PNG dọc 120×400, DOCX/PPTX mẫu, PDF scan thật; Vừa rộng/Vừa ảnh, +, 6400%, về Vừa rộng; chọn chuột text Office, PDF zoom/cuộn; nhãn vi/en/ko; console/pageerror rỗng. Chưa kiểm Windows/profile thật, Android/Firefox, Office phức tạp và hiệu năng ảnh/tài liệu lớn ở zoom tối đa. Phóng ảnh không tăng chi tiết gốc; zoom lớn có thể chậm.

**2026-11-17 | v3.5.595 | Arena:**

- Tóm tắt: zoom PDF tối thiểu tới 6400%, mức trần tự tăng nếu Vừa rộng lớn hơn; nút + tăng từ mức thực và bước tăng theo tỉ lệ ở mức lớn; thêm các mức zoom PDF trong danh sách. Giữ canvas nền giới hạn và vẽ canvas chi tiết riêng cho phần đang nhìn khi phóng vượt độ phân giải nền, cập nhật khi cuộn/zoom; không thay text layer.
- File: `js/dashboard/documents.js`, `js/dashboard/documents-renderers.js`, `pages/documents.html`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked headless 1512/390 sáng/tối và ảnh chi tiết phóng 4×; PDF scan người dùng: Vừa rộng 760px → nút + 835px (1512), 6400% 3686px, vẽ vùng thấy, cuộn và về Vừa rộng; PDF hai trang có text và PDF lớp chữ người dùng chọn chuột, text còn sau 6400%; console/pageerror rỗng. Chưa kiểm Windows/profile thật, Android/Firefox, hiệu năng PDF nhiều trang nặng và màn hình DPR cao.

**2026-11-17 | v3.5.594 | Arena:**

- Tóm tắt: sửa PDF scan mờ do vẽ canvas theo kích thước trang PDF gốc nhỏ; vẽ theo cỡ hiển thị và DPR, cập nhật sau zoom/resize, giữ nguyên text layer; giới hạn khoảng 3,5 triệu pixel / cạnh 8192, chỉ vẽ lại trang gần vùng nhìn.
- File: `js/dashboard/documents-renderers.js`, `js/dashboard/documents.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked, PDF scan người dùng và PDF 2 trang có text; ảnh sáng/tối 1512/390, canvas 760×1014 và 370×494 cho scan; zoom PDF text lên 200% và 400%, canvas giới hạn ~3,5 triệu pixel, chọn text bằng Selection API, console/pageerror rỗng. Chưa kiểm Windows/profile thật, Android/Firefox, thao tác chọn bằng chuột, hiệu năng tài liệu lớn.

**2026-11-17 | v3.5.593 | Arena:**

- Tóm tắt: sau khi mở rồi đóng Overlay, chỉ dùng selection Shadow DOM khi anchor thật sự thuộc shadow root; nếu không dùng selection của trang, khôi phục thanh logo chọn chữ.
- File: `js/content/content.js`, `manifest.json`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh trước/sau hai lần mở đóng Overlay; chọn phụ đề trong Overlay mở từ điển và chọn bằng chuột 1512 sáng. Fixture favicon giả lập để tránh 404, console/pageerror rỗng; chưa kiểm profile, trang, thiết bị thật.


**2026-11-17 | v3.5.592 | Arena:**

- Tóm tắt: tách đường viền popup Tô sáng và chừa vị trí chân tam giác theo neo, không còn đường viền chạy qua phần giao; giữ màu kính và tương tác.
- File: `css/content/content-theme.css`, `js/content/content.js`, `manifest.json`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh/crop 4× và số đo tại giữa, hai mép, lật popup lên; chọn màu, nhập và lưu ghi chú thật trong IndexedDB; console/pageerror rỗng. Chưa kiểm thiết bị, trang và tài liệu của người dùng.


**2026-11-17 | v3.5.591 | Arena:**

- Tóm tắt: sửa tam giác ô Tô sáng bị chồng nền kính thành hình thoi, giữ màu kính chung; loại lớp đậm–mờ ở tay kéo các sheet, giữ cuộn ẩn thanh.
- File: `css/content/content-theme.css`, `css/content/content.css`, `css/content/notes.css`, `css/dashboard/settings.css`, `js/ask-ai/sheet.js`, `js/content/keepit-bar-css.js`, `js/overlay/ui/overlay-css.js`, `js/reader/reader-css.js`, `js/shared/theme-tokens.js`, `docs/ui-layout.md`, `manifest.json`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh và crop 4×, đo tam giác và màu kính popup so với thanh; sheet menu, tìm kiếm, Ghi chú, Từ điển, Cài đặt và kéo/cuộn mô phỏng; hồi quy popup và PDF fixture, console/pageerror rỗng. Chưa kiểm thiết bị, website và tệp của người dùng; không kiểm tất cả sheet trong lượt này.


**2026-11-17 | v3.5.590 | Arena:**

- Tóm tắt: áp dụng demo v18 vào ba popup và các sheet; dùng logo app cho Từ điển, hiệu ứng tim và hướng dẫn chung với Overlay, bỏ gợn trắng của hướng dẫn; giữ luồng dữ liệu/lưu hiện hữu.
- File: `css/content/content.css`, `css/content/content-theme.css`, `css/content/notes.css`, `css/dashboard/settings.css`, `js/content/content.js`, `js/content/keepit-bar-css.js`, `js/ask-ai/sheet.js`, `js/reader/reader-css.js`, `js/overlay/ui/overlay-css.js`, `js/overlay/ui/overlay-ui.js`, `js/shared/heart-effects.js`, `js/shared/theme-tokens.js`, `manifest.json`, `pages/documents.html`, `docs/ui-layout.md`, `docs/modules/shared.md`.
- Kiểm tra: Chromium 159 unpacked 1512/390 sáng/tối, ảnh/crop 4× và số đo; kiểm popup, note dài, scrollbar, logo, tim Từ điển (ba lần và toggle), Overlay với video fixture, sheet menu/tìm kiếm/Ghi chú/Từ điển/Reader/Cài đặt/Đăng nhập/AI; kéo Ghi chú/menu/Từ điển/AI, ưu tiên cuộn Ghi chú; console/pageerror rỗng trong các ca UI (AI dùng favicon fixture vì các endpoint bên ngoài trả 404/bị chặn). Chưa kiểm thiết bị thật, provider AI thực, toàn bộ sheet và dữ liệu người dùng.


**2026-11-17 | v3.5.589 | Arena:**

- Tóm tắt: gỡ giao diện và mã ghi log chọn chữ thử nghiệm; giữ nguyên dự phòng 900 ms của 3.5.588 đã được người dùng xác nhận.
- File: `pages/popup.html`, `js/popup/popup.js`, `js/core/languages.js`, `js/content/content.js`, `js/shared/selection-toolbar.js`, `manifest.json`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh popup + crop 4×, đo không còn phần log; mô phỏng chọn chữ và hồi quy sheet, console/pageerror rỗng. Chưa kiểm bản này trên Android thật.

**2026-11-17 | v3.5.588 | Arena:**

- Tóm tắt: dự phòng 900 ms sau touchcancel cho vùng chọn một từ không khoảng trắng, hủy khi vùng chọn thay đổi hoặc có chạm mới; giữ luồng nhiều chữ, có nguy cơ hiện sớm khi giữ tay bất động.
- File: `js/shared/selection-toolbar.js`, `manifest.json`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh và crop 4×; mô phỏng touchcancel, thay đổi vùng chọn, chạm mới, touchend, contextmenu; hồi quy sheet, popup và PDF fixture, console/pageerror rỗng. Chưa kiểm thiết bị Android thật.

**2026-11-17 | v3.5.587 | Arena:**

- Tóm tắt: bản thử ghi log chọn chữ chỉ khi bật, xem và sao chép trong popup; không thu chữ hoặc URL, chưa thay đổi xử lý chọn chữ.
- File: `js/shared/selection-toolbar.js`, `js/content/content.js`, `pages/popup.html`, `js/popup/popup.js`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh + crop 4×, sự kiện cảm ứng mô phỏng và sao chép log; không lỗi console/pageerror, hồi quy sheet cảm ứng mô phỏng đạt. Chưa thử thiết bị cảm ứng thật.
- **3.5.586:** tính phần dưới cùng của cả cụm chọn chữ khi xét tràn và khi lật; neo lên trên dòng đầu vùng chọn nhiều dòng. Kiểm Chromium unpacked 1512/390 sáng/tối, cụm tròn 1–4, thanh/icon, ảnh và crop 4×, đo lật lên và đủ chỗ phía dưới; hồi quy popup, Trang tối, sheet cảm ứng đạt, không ghi nhận lỗi console/pageerror trong các ca kiểm. Chưa kiểm mọi số lượng nút, trang/profile và thiết bị thật.


**2026-11-17 | v3.5.585 | Arena.ai Agent sửa:**

- Tóm tắt: tam giác `#lhn-panel` dịch theo tâm vùng chữ sau khi hộp đã được đẩy ngang; giới hạn 20 px bên trong cạnh hộp để tránh góc bo. Khi lật lên, tam giác ở cạnh dưới và vẫn trỏ về chữ. Không đổi vị trí, kích thước, cách đẩy của hộp hoặc Trang tối.
- File: `js/content/content.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: extension unpacked Chromium 159, 1512/390 sáng/tối, hai mép, ảnh + crop 4× (`qa/v585-edges.log`): tâm chữ/tam giác 60,16/60,16 px bên trái và 1451,84/1451,84 px bên phải tại 1512; chữ ngắn sát mép dừng trước góc bo (`qa/v585-short.log`). Sát đáy lật lên, tâm chữ/tam giác khớp trong 0,02 px (`qa/v585-bottom.log`); bộ 4 kịch bản 72 ảnh + crop (`qa/v585-regression.log`); Trang tối bật/tắt vùng màu rực (`qa/v585-toggle.log`); console.error/pageerror rỗng. Chưa kiểm profile Chrome thật, Wikipedia trên máy người dùng, các website khác và cảm ứng trên thiết bị thật.
