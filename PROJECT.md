# Keepit - Hồ sơ dự án

## 1. Trạng thái hiện tại
- **Bản test 3.5.634:** áp dụng phương án B demo Trash icon v1 đã được người dùng duyệt trên nền632; bỏ qua633 (đã gỡ theo yêu cầu, lịch sử Git còn).
- Trash dùng `LHN_ICONS.render(file-kind-*)`: PDF/Word/PPT/Ảnh giữ nguyên SVG đã duyệt; web/note/dictation/speak lấy nguyên SVG B. Icon22px trong ô34px, màu/nền tint theo demo; không đổi bố cục hàng hoặc dữ liệu/khôi phục/xoá.
- Import/open/drag/drop, Documents/OCR/store/renderers và overlay632 không đổi. Người dùng đã xác nhận632 kéo thả bình thường; báo lỗi632 trước đó do thử nhầm. Speaking chỉ có glyph dự phòng, chưa tích hợp dữ liệu Thùng rác.
- Kiểm mới: hai JS syntax + diff-check; 4 SVG cũ không đổi/4 SVG B khớp demo;22 kiểm tra Dashboard thật qua HTTP+API shim đạt (1512/390 sáng/tối, icon/màu, chọn/restore fixture). HTTP có2 pageerror ở Documents/OCR ngoài phạm vi; không gọi toàn app error-free. Chưa có unpacked/ảnh1512/390/crop4×/nghiệm thu extension634. Các thư mục QA cũ đã xoá theo yêu cầu, không còn là bằng chứng sẵn có.

## 2. Việc đang mở / Tiếp theo (sửa đè)
### OCR — chặn nghiệm thu
- Cần người dùng thử bản 3.5.634: sidebar/popup, cuộn OCR và scan/khung trên PDF gây lỗi trong extension thật; HTTP đã đo nhưng chưa có nghiệm thu bằng ảnh/video extension.
- Cần môi trường unpacked thật để kiểm CSP/worker/model/permission; Chrome công cụ hiện chặn chrome://extensions.
- Cần PNG extension634 1512/390 sáng/tối, crop 4× và so pixel/trạng thái với demo; mới có DOM/số đo HTTP. Kiểm lại hai lỗi HTTP Documents/OCR trong môi trường extension thật.
- Kiểm profile/thiết bị/tệp thực, PDF xoay/mật khẩu/lớn/hỏng, clipboard, note anchors cũ/mới, dịch/TTS/AI và fidelity Office phức tạp và picker/OS drag extension634; người dùng đã xác nhận632 kéo thả bình thường, không còn coi632 là lỗi chặn. Mẫu ảnh Việt/Hàn tổng hợp đã chạy; Hàn còn lỗi đọc giống demo trên cùng byte PNG.
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
- Floating selection anchor: Documents context.selectionRects(range) optional cung cấp glyph-only rects cho Original PDF; content positionTranslateIcon dùng hook hoặc raw Range fallback, không sửa selection source.
- Thumbnail: renderer thumbnail(page,bounds) raster PDF/text Office theo backing resolution; library mặc định960×1320, ảnh không upscale. documents.js quản lý lazy cache-version2/queue upgrade và rail theo DPR/resize/scroll, không schema migration.
- Gợi ý theo tệp/trang: OCR controller gộp officeHint/imageHint vào notice/bulb chung, không còn vBanner strip trong viewer. Body OCR chỉ hiện khi needsOcr; CTA Office là Thu gọn, CTA ảnh/PDF thiếu chữ là Nhận dạng chữ; hint/reset có gate selectedFile đúng ID.
- Nhãn loại tệp Documents dùng `fileLabel(type)` → `LHN_ICONS.render(file-kind-*)`; bốn glyph option3 demo v5 dùng chung cho thư viện/viewer/import, token màu scoped trong documents.css. Viewer gọi `fileLabel(type,true)` chỉ hiện icon với aria-label/title; supported types giữ pills chữ622.
- Trash `dashboard-trash.js` dùng chung `file-kind-pdf/docx/pptx/image`; `file-kind-web/note/dictation/speak` là SVG B từ demo v1. `trash.css` giữ ô34px và icon22px, màu scoped; note lấy `kind` thay vì annotation `type`. Không thêm Speaking store hoặc thay luồng khôi phục/xoá.
- Documents main sheet đặt Dịch/Đọc to ở footer cố định cạnh Cài đặt qua `LHN_DOCUMENTS_MAIN_ACTIONS`; callbacks chia sẻ handler với viewer topbar. Điều khiển Ẩn/Hiện thanh không hiện riêng ở sheet này. OCR là tile trong lưới Công cụ, dùng facade `ocr/ocrAvailable/ocrLabel/ocrOn` gọi nút native; chỉ có khi viewer đang mở. Sáu glyph `tool-*` chia sẻ từ `LHN_ICONS` với toolbar.
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
Documents main sheet ── `doc:translate` / `doc:read` / `doc:ocr` ──> `LHN_DOCUMENTS_MAIN_ACTIONS` ──> same `setPanel('translation')` / `startNativeReader()` / native OCR button used by viewer topbar
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

### OCR responsive — module trình bày dùng chung

`ocr-controller.mjs` giữ engine/state, nhập `ocr-controls.mjs` (mặt nhập số trên input gốc + createFlowSelect, danh sách đầu ra) và `documents-sheets.mjs` (sheet/portal/grip/scrim/cử chỉ/rail dọc). `documents.js` vẫn sở hữu docking, điều hướng, bản dịch, rail ngang và các công cụ thật. `documents-responsive.css` chỉ trình bày các mặt đã duyệt, dùng token chung `theme-tokens.js`. Không có engine, viewer hay storage giả. `drafts` trong OCR controller chỉ là Map theo trang của tài liệu đang mở, xóa khi reset/chuyển tệp; không ghi store trước Áp dụng.

### OCR clean rebuild — ranh giới module mới

`documents.js` → getter host `KeepitOcrDocumentHost` → `ocr-controller.mjs`; canvas dùng `ocrCanvas` trên renderer hiện tại, không viewer/file-store song song. `vendor/ocr` chứa Tesseract worker/core/data, preprocessing demo và PDF exporter deps. `ocr-localize.mjs` dùng catalogue `languages.js`; theme theo setting app. Store `ocr` trong DB Documents v3; purge theo index document. Lớp `.para`/`.en` quay lại controller app. CSS demo scope dưới `.keepitOcr`; chặn root ẩn bắt pointer, reset xung đột `.row`/`.vbanner`, thanh viewer dọc cao 52px theo demo. Không bê toolbar/Reader/Notes giả của demo. Tesseract retry trang lỗi một lần rồi đi tiếp; kết quả một phần đếm đúng lượt hiện tại. Đóng tài liệu đợi PDF export cleanup và chặn tải muộn; ảnh OCR tối đa 16 megapixel. Harness, bằng chứng và script tạm ngoài source. Từ 3.5.615: `.layer` chữ vẫn ở native page units; `.ocrVisualSurface` giãn kích thước và inverse-scale theo `--source-scale` để scan/word/hover/region được vẽ bằng display pixels. `.ocrWordBox` lấy rect chuẩn hóa, không outline text span đã transform; không style nested `.en`. Overlay reset padding/min-width của `.paper` app. Reverse hover khớp cụm geometry/text trước fallback offset để không sai sau vùng append. Từ 3.5.616: host `goTo` riêng OCR truyền `smooth` vào `setPage`; `scrollToPage` giữ đích tạm trong hai flow cuộn, bỏ lệnh trùng cùng đích/pixel, retarget khi resize đổi hình học. Scroll observer không đổi current về trang đi ngang qua; input người dùng nhả đích. `sizePages` không gán scrollTop đè native animation. Điều hướng khác và kiểu xem rời giữ mặc định auto.

### Office trực tiếp — ranh giới renderer630

`documents-renderers.js` sở hữu PDF/DOCX/ảnh và preflight ZIP, lazy-import `documents-pptx.mjs` cho PPTX. Module nhận ZIP đã kiểm, hooks và callback attachBlocks, trả contract pages/render/thumbnail/dispose cũ. XML→SVG/chữ do first-party tạo bằng DOM API, không nới sanitizer của HTML Office. Metadata/text order và render dùng cùng traversal; images theo relationship từng part, cache có giới hạn. `documents.js`, context, Reader, tools, annotation store và OCR không bị thay renderer/UI giả. Font Pangolin có face riêng và OFL trong licenses. Giới hạn/fidelity/anchor cũ xem docs/documents.md.

### UI vùng kéo thả632 — lấy nguồn630 trực tiếp

`watchDashboardDocumentDropUi` trong dashboard.js chỉ observe trạng thái gốc, clone nội dung sang bản sao trình bày inert/pointer-events:none và đo header/sidebar/viewport. Không adopt/move/drop target gốc và không nhận drag/drop/FileList. documents.js cùng toàn bộ renderer/store/HTML/i18n giữ nguyên byte630. CSS chỉ ẩn paint gốc khi có mirror, giữ node/event path; trong fullscreen hiển thị gốc. Không đưa pipeline xử lý tệp631 vào bản632. Baseline/audit chi tiết ngoài app: `/home/user/qa-keepit-632/baseline630.json`.

## 5. Nhật ký

Nhật ký cũ: `docs/changelog/ocr-clean-base-history.md`.

**2026-11-26 | v3.5.634 | Arena sửa:**

- Tóm tắt: áp dụng phương án B người dùng đã chọn từ demo Trash icon v1; file silhouette màu/glyph trắng cho web/note/dictation/speak. PDF/Word/PPT/Ảnh tái dùng nguyên SVG đã duyệt; icon22px trong ô34px, tint/màu demo sáng/tối. Sửa ánh xạ note theo `kind` để annotation `type:highlight` không hiện nhầm PDF. Chỉ icon UI, không thêm Speaking trash, không sửa import/open/drag/drop/layout/restore/delete.
- File: `js/shared/icons.js`, `js/dashboard/dashboard-trash.js`, `css/dashboard/trash.css`, manifest634, PROJECT và `docs/modules/dashboard.md`. Nền632 được người dùng xác nhận kéo thả bình thường (thử nhầm trước đó);633 đã gỡ khỏi cây/main theo yêu cầu. QA cũ đã xoá theo yêu cầu, không tái tạo các thư mục cũ.
- Kiểm tra: node syntax2file, git diff-check; đối chiếu4glyph file giữ nguyên byte và4glyph B đúng demo.22check Dashboard source thật trên HTTP+API shim/fixture đạt:7loại hiện hữu,22/34px, màu note/không tràn ngang1512/390 sáng/tối (bật bằng nút app), chọn/khôi phục fixture và Speaking vẫn pending. Quan sát browser HTTP sáng; không coi là ảnh nghiệm thu extension. HTTP có2pageerror `LHN_DOCUMENT_CONTEXT is not defined` ở documents.js:915 và `reading source` ở ocr-controller.mjs:12, các file này không đổi; chưa kết luận nguyên nhân. Chưa unpacked634/CSP/profile/ảnh1512/390/crop4×/console-empty/OS drag, không chứng nhận nghiệm thu extension thật.

**2026-11-26 | v3.5.632 | Arena sửa:**

- Tóm tắt: theo yêu cầu dứt khoát của người dùng, giải nén trực tiếp ZIP630 đã commit, xác minh SHA256902475970664273dc1227dab2d39dd3afb43707adf04d0fc690f5b43f84f41c6/419file; không lấy631 làm nguồn.631 người dùng xác nhận UI đúng nhưng mọi tệp không mở được.632 chỉ sửa UI bằng bản sao trình bày pointer-none/inert ở Dashboard, giữ nguyên phần tử gốc/event path630, không thêm handler drag/drop và không chuyển FileList giữa document.
- File: chỉ runtime UI `dashboard.js`, `documents-host.css`, `documents.css`; manifest632 và tài liệu. Toàn bộ `documents.js`/store/renderers/PPTX/HTML/i18n/vendor giữ nguyên byte630; bỏ CSS/portal631. Audit hash từng file và diff UI so với630 trước đóng gói. Giữ ZIP cũ trên main.
- Kiểm tra: tệp Quarterly Performance người dùng gửi có PK/ZIP DOCX thật,262475byte SHA1ed57730…; renderer630 đọc1trang có “Executive summary”. QA52 kiểm tra HTTP+API/protocol shim qua; browser.upload vào input gốc mở đúng DOCX/ảnh, original DOM identity/presentation-only,1512/900/390 sáng/tối, sidebar/scroll và drop từ context của iframe mở tệp thật ở library/viewer. Phân biệt lỗi fixture File khác realm: JSZip630 từ chối ArrayBuffer của realm khác; không thay parser để né lỗi. Log có2 ResizeObserver notification theo luồng resize630, không gọi error-free; JS syntax/tools10test/vendor220hash qua. Chưa chứng nhận OS Downloads drag/unpacked/extension screenshots/crop4×/CSP/fullscreen/live AI/notes; không tuyên bố lỗi thực đã nghiệm thu. Xem `/home/user/qa-keepit-632`.

**2026-11-26 | v3.5.631 | Arena sửa:**

- Tóm tắt: khung kéo thả Dashboard phủ toàn bộ bên phải dưới header, chừa sidebar; viewer phủ cả rail/stage/pager, chừa vBar. Portal một dropAll gốc ra body Dashboard same-origin để thoát clipping iframe/lớp công cụ nổi cha (fullscreen giữ tại document gốc), đo vùng visible thay100vh của iframe; viền12px bo24px, icon/nhãn căn giữa, label dropOpen en/vi/ko riêng. Đóng khi drop/leave/dragend/Escape/blur/ẩn trang/đổi route; không đổi importer, Office630/PDF/OCR/controller/store. Deferred iframe resize tránh feedback observer.
- File: `documents.js`, `dashboard.js`, `documents.css`, CSS dùng chung mới `documents-drop.css`, hai HTML entry, `languages.js`, manifest, PROJECT/OPT/docs.
- Kiểm tra:66 kiểm tra HTTP dashboard+viewer mã thật với shim API/protocol và synthetic DragEvents:1512/900/390 × sáng/tối, nested enter/leave, text-only bỏ qua, resize đang kéo, cuộn, sidebar pin, hit-test đáy/thanh nổi, Escape/route change và drop DOCX mở viewer. 32 nhóm Office/PDF hồi quy qua HTTP không lỗi; node syntax3file, vendor220hash, tools10tests và diff-check qua. Final console.error/pageerror rỗng. QA `/home/user/qa-keepit-631`; không phải drag từ OS/Downloads, chưa unpacked631/extension screenshot/crop4×/pixel/fullscreen acceptance. Các kiểm định Office630 giữ nguyên phạm vi đã ghi, không tuyên bố nghiệm thu extension thật.

**2026-11-26 | v3.5.630 | Arena sửa:**

- Tóm tắt: theo lựa chọn người dùng, tích hợp đọc DOCX/PPTX trực tiếp, không convert PDF/server. PPTX mới đọc OOXML slide/layout/master/theme, custom path/group/preset/raster/notes và lớp chữ DOM chọn được; metadata toàn bộ slide, dựng hình lazy, cache bounded và cancel/dispose. Giữ attachBlocks/controller Dịch/Reader/Notes, file IDs/store/UI/pager/OCR và text thumbnails628. DOCX giữ local docx-preview, thêm chờ ảnh/phông và ZIP/XML/External guard. Không thay HTML sanitizer hoặc nới CSP. Đóng gói Pangolin OFL; cập nhật gợi ý Office en/vi/ko. Không nhúng mẫu/tệp người dùng vào app.
- File: `documents-pptx.mjs` mới, `documents-renderers.js`, `documents.css`, `languages.js`, font/OFL, manifest và tài liệu. Giữ các bản ZIP trước.
- Kiểm tra:32 nhóm HTTP app+extension API/protocol shim, PPTX gốc92slide dựng đủ; độc lập2slide có ảnh/ellipse, DOCX2trang/bảng, PDF1trang gốc, malformed/DTD/External/traversal/literal markup/soft break; native viewer, original/read/paging và1512/900/390 sáng/tối. Chuột thật chọn PPTX “Worksho” và DOCX “English text: Keep your ideas…”, launcher hiện. Không gọi mạng dịch/TTS/AI hoặc xác nhận notes persistence/anchor cũ. JS syntax, vendor220hash và tools10tests; console/pageerror rỗng trong QA. Chưa unpacked630/extension screenshots/crop4×/pixel/CSP/permission/touch/profile; không chứng nhận92slide fidelity. QA ngoài source: `/home/user/qa-keepit-630`.

**2026-11-26 | v3.5.629 | Arena sửa:**

- Tóm tắt: theo ảnh43/PDF trích upload thật, sửa selection launcher lấy last raw Range rect có thể là transparent filler/parent padded paragraph: cùng câu Pam...filter., text endpoint neo759.70 nhưng parent endpoint neo1317.94 (lệch558.23px). Bổ sung owned-context selectionRects do documents.selectedPdfTextRects cung cấp: cắt range vào text nodes .pdfTextLayer .en, bỏ filler/aria-hidden/empty, lấy glyph rect sau transform. Content positionTranslateIcon ưu tiên hook/null fallback, giữ native placement/clamp/flip/styles/actions và timers. Không sửa selection/endpoint guard/filler geometry, pager/layout/scroll/navigation/OCR/glyphs/thumbnail628/store. Người dùng xác nhận thumbnail628 ổn.
- File: `js/dashboard/documents.js`, `documents-context.js`, `js/content/content.js`, manifest và tài liệu; ZIP629 riêng không đổi ZIP cũ.
- Kiểm tra: HTTP thật+API shim, dùng chính PDF1 trang trích của người dùng. Before/after controlled parent vs text endpoint trên cùng câu:before759.703 vs1317.938;after cả2 759.703 so text end759.711. Chuột thật chọn đúng 2 dòng PDF sau sửa; Word “Keepit file-label chec” và PPT “Keepit file” vẫn chọn, native overlaypointer-none.95 nhóm:72 width1512/900/390 ×sáng/tối ×fit/50/150 ×text/parent/partial/reverse; nested mark3textnodes;18 style0–8 ×2boundaries; scroll follows; bottom padded selection không đổi scroll;2 Office adapter null. Narrow radial safety clamp được tách khỏi lỗi anchor (vẫn giữ nút trên màn hình); không coi clamp hợp lệ là lỗi. Syntax3file/diff, vendor220hash, tools10/10; console.error/pageerror rỗng. Không phải95manual drags. Chưa unpacked629/extension screenshot/crop4×/pixel/CSP/permission/touch/profile/full78page PDF. Không test network translate/AI/notes-saving hoặc OCR engine lại; chỉ floating launcher anchor.

**2026-11-26 | v3.5.628 | Arena sửa:**

- Tóm tắt: theo ảnh41/42, sửa thumbnail rail/library/Continue mờ vì backing120×160 hoặc100px rồi phóng lớn. Renderer PDF/Office nhận bounds, mặc định960×1320; Office giữ text-preview logical geometry nhưng scale context trước khi vẽ text, không upscale raster120px. Ảnh downsample từ nguồn tối đa960×1320 không upscale nguồn nhỏ. Rail yêu cầu width×DPR2–3 (min240), bỏ fallback100px, kiểm backing/cycle/engine, giữ IntersectionObserver khi reentry và cập nhật visible khi rail resize/pending resize. Library cache-version2 lazy1-at-a-time với pending/failed sets, visible-only/skip viewer, mở source cũ tạo lại preview; import ghi marker; patch chỉ thumbnail/version. PDF mật khẩu không hỏi nền và không cache giải mã. Giữ layout/CSS/glyphs/selection/OCR627/store schema/import navigation.
- File: `js/dashboard/documents-renderers.js`, `js/dashboard/documents.js`, manifest và tài liệu; ZIP mới riêng, không đổi ZIP cũ.
- Kiểm tra: HTTP app thật + API shim,32 nhóm thumbnail:5 renderers tăng resolution thực,5 cache cũ tự nâng giữ bytes/progress,16 rail DOCX/PPTX/native PDF/scan ×1512/390 ×sáng/tối,2 wide-rail/scroll-last,4 cards. Raster đo PDF/Word120×160→960×1280, PPT120×68→960×544; ảnh240×180→800×600 đúng nguồn. Card332/226 CSS px dùng960px; rail333 dùng666/667+px.3 edge:import ảnh80×100 không upscale/version2, PDF khóa seed thật không hỏi password/cache/marker, cache version2 tái dùng.44 regression notice627 chạy lại sạch. Đã xem raster DOCX960px thật qua viewer; PNG QA là raster thumbnail, không phải ảnh chụp extension. Syntax2JS/diff, vendor220 hash, tools10/10; console.error/pageerror rỗng. Lượt đầu640px chưa đủ2× standalone card332px nên tăng960; test ban đầu tính cả offscreen rail nên tách visible và thêm scroll-last/reentry. Chưa unpacked/extension screenshot/crop4×/pixel/CSP/permission/device/user files/PDF lớn-xoay; không chạy OCR engine hoặc drag lại.

**2026-11-26 | v3.5.627 | Arena sửa:**

- Tóm tắt: sửa hiểu sai nút ở626 theo người dùng: DOCX/PPTX phải có nút Thu gọn tại vị trí Nhận dạng chữ, không ẩn CTA. Chọn label qua ocrText/cataloque cũ Thu gọn/Collapse/접기, click chỉ collapseNotice với Office, không gọi openOcr. Ảnh/PDF thiếu chữ giữ Nhận dạng chữ và both-open. Không đổi popup warning/timer/noAsk/bulb/labels/layout/selection/engine/store.
- File: `js/dashboard/ocr-controller.mjs`, manifest và tài liệu; ZIP mới đúng thư mục, giữ mọi ZIP cũ.
- Kiểm tra: HTTP app thật + shim,44 nhóm không cờ lỗi:36 DOCX/PPTX ×vi/en/ko ×1512/673/390 ×sáng/tối, CTA hiện/đúng chữ/nằm trong popup, bấm thu→bóng đèn/không settings/không result, mở lại;6 CTA ảnh/PDF scan ×3 ngôn ngữ vẫn mở cả2;noAsk lưu/thu và reset không rò. Chuột thật bấm nút Thu gọn trong Office popup. Node syntax/diff sạch, tools10/10, vendor220 hash; console.error/pageerror rỗng. Chưa unpacked/ảnh extension627/crop4×/pixel/CSP/permission/device/tệp người dùng; không chạy OCR engine hoặc drag selection lại vì không đổi các luồng đó.

**2026-11-26 | v3.5.626 | Arena sửa:**

- Tóm tắt: theo ảnh40, bỏ thanh vàng cố định vBanner ở Word/PPT/ảnh (DOM, CSS và applyTools), chuyển đúng officeHint/imageHint vào popup notice native. Đổi tên popup/bulb thành Gợi ý với en/vi/ko, thêm fileHint bên cạnh body OCR; chỉ hiện OCR body/action khi thật sự thiếu chữ. Giữ lifecycle/timer/noAsk/semantic glass/mở lại bằng đèn. Các nút collapse/expand/noAsk refresh trạng thái hiện tại thay ép needsOcr=true; gate selectedFile/document ID không rò hint khi đóng/đổi tệp. Không đổi glyphs/engine/store/navigation/OCR hit-test625.
- File: `pages/documents.html`, `css/dashboard/documents.css`, `js/dashboard/documents.js`, `ocr-controller.mjs`, `js/core/languages.js`, manifest và tài liệu; ZIP riêng đúng thư mục, giữ ZIP cũ.
- Kiểm tra: HTTP app thật + shim:71 nhóm notice trên DOCX/PPTX2 trang/slide, PNG, native PDF và scan PDF;1512×900/673×696/390×844 ×sáng-tối. Không còn DOM/thanh vàng/khoảng trống; đúng nội dung Office/ảnh/OCR, popup absolute không đẩy trang, bật/tắt body/CTA đúng, bounds/palette/close/bulb/noAsk/force-open và reset library; i18n3 ngôn ngữ; timeout10giây thực (đợi11s) và OCRboth-open/covered. Chuột thật kéo Word “Keepit file-label chec” và PPT “Keepit file” sau đổi; overlay native vẫn pointer-none. Syntax3 file, diff, vendor220 hash và tools10/10 kiểm lại; console.error/pageerror rỗng. Chưa unpacked/ảnh extension626/pixel/crop4×/CSP/permission/device/tệp người dùng; ảnh40 là625, không coi là nghiệm thu626; không chạy nhận dạng lại.

**2026-11-26 | v3.5.625 | Arena sửa:**

- Tóm tắt: người dùng báo Word/PPT không chọn chữ; QA623/624 chỉ mở/render/nhãn đã bỏ sót kéo chọn. Tái hiện624 với locked=false/inert=false, elementFromPoint trả div.layer trống pointer:auto. paint() return khi `_ocrResult===undefined` hoặc không có r trước khi gắn nativeText, nên lớp OCR phủ chữ thật. Truy nguồn archive614 commit6584dc4 đã có cùng thứ tự/cache và CSS pointer:auto; chưa runtime-bisect mọi phiên bản. Dời phân loại nativeText trước cache/return; CSS overlay mặc định none, chỉ nonempty + không native bắt pointer. Giữ lớp OCR scan có chữ tương tác, không phá renderer/engine/region/scan/store/UI624.
- File: `js/dashboard/ocr-controller.mjs`, `css/dashboard/ocr-demo.css`, manifest và tài liệu. ZIP mới đúng tên trong `Keepit-OCR-Zip`, giữ mọi ZIP cũ.
- Kiểm tra: HTTP app thật + shim, DOCX/PPTX2 trang/slide và PDF native2 trang tổng hợp. Chuột thật kéo Word trước rỗng/sau “Keepit file-label chec”, PPT trước rỗng/sau “Keepit file”; toolbar native hiện. 48 nhóm hit-test ở1512/900/390/320 × sáng/tối ×2 trang, nativeText/pointer-none/hit-chữ/unlocked đều đúng; đó là phép đo hit-test, không giả là48 lượt drag. Nhận dạng Tesseract thật trên PDF scan tổng hợp để kiểm lớp OCR có chữ vẫn bắt pointer/chọn được; trạng thái cụ thể ở QA report. Syntax/diff và tools10/10, vendor hash220 kiểm lại. Chưa unpacked/ảnh extension625/crop4×/pixel/permission/profile/device/tệp người dùng; không dùng QA HTTP thay nghiệm thu.

**2026-11-26 | v3.5.624 | Arena sửa:**

- Tóm tắt: theo hai ảnh extension623, trả riêng vùng kéo-thả `.types` về markup pills chữ đúng622 (PDF/DOCX/PPTX/Ảnh) và rule căn hàng gốc; bỏ hook hydrate supported-type623. Tiêu đề viewer gọi `fileLabel(type,true)` chỉ giữ icon, có aria-label/title được localize khi đổi ngôn ngữ; giữ nguyên tên tài liệu và native compact hide. Cards/Đọc tiếp/import, glyph option3 v5, engine/store/navigation/OCR/pager không đổi.
- File: `pages/documents.html`, `js/dashboard/documents.js`, `css/dashboard/documents.css`, manifest và tài liệu; ZIP mới riêng trong `Keepit-OCR-Zip`, giữ mọi ZIP cũ.
- Kiểm tra: so markup supported types trực tiếp với nguồn622, syntax/diff sạch. HTTP shim app dùng4 tệp PDF/DOCX/PPTX/PNG tổng hợp đã import thật ở623:48 nhóm (32 viewer4 loại ×4 sizes × sáng/tối;12 library6 sizes × sáng/tối;3 i18n;OCR both-open). Viewer không text node nhãn, một SVG đúng glyph, title/aria-label đúng; compact hide native, tên tài liệu/canvas còn. Pills không SVG/mark mới,4 nhãn đúng, cards/Đọc tiếp vẫn icon+chữ; library320–1512 không tràn. Không dùng ảnh extension623 của người dùng làm nghiệm thu624; chưa unpacked/ảnh extension624/crop4×/pixel/CSP/permission/device thật; không chạy nhận dạng lại.

**2026-11-26 | v3.5.623 | Arena sửa:**

- Tóm tắt: áp dụng demo nhãn loại tệp v5 option3 đã duyệt: icon đặc màu, PDF chữ thu88%, Word W, PowerPoint P, Ảnh dùng geometry ngắn của option2. Chuyển đúng4 SVG sang shared/icons, dùng `fileLabel()` cho library cards, supported types, Đọc tiếp và vType; import dùng cùng glyph, bỏ fold pseudo/text cũ. Nhãn chữ trung tính, mark28×32/icon18, nền/viền nhạt sáng-tối theo demo; backing kính trên thumbnail giữ tương phản, viewer không backing và giữ compact hide native. Giữ filters/search/navigation/engine/model/import/store và OCR/pager622.
- File: `js/shared/icons.js`, `js/dashboard/documents.js`, `css/dashboard/documents.css`, `pages/documents.html`, manifest và tài liệu; ZIP mới đúng thư mục, không sửa ZIP cũ.
- Kiểm tra: HTTP app thật với shim extension API; PDF scan3 trang, DOCX2 trang, PPTX2 slide và PNG mẫu được parser/import thật. 48 nhóm:32 viewer (4 loại ×1512/900/390/320 × sáng/tối),12 library (6 kích thước × sáng/tối), both-open OCR và3 ngôn ngữ. Geometry/attrs4 SVG bằng demo v5, màu đặc đúng, mark28×32/icon18 trong control hiện; viewer compact giữ ẩn như622, không gọi 0×0 là lỗi. Hình học tolerance0.1px do reveal animation subpixel. Library không tràn320–1512, loại/nhãn en/vi/ko đúng. Syntax/diff, vendor220 hash và test công cụ kiểm lại; không dùng HTTP thay unpacked/ảnh extension/pixel/crop4×/CSP/permission/device thật; không chạy lại nhận dạng engine.

**2026-11-26 | v3.5.622 | Arena sửa:**

- Tóm tắt: thêm một tile OCR vào đúng lưới Công cụ trong main sheet Documents, sau các tools hiện có; không thêm nhóm More riêng, không rò sang web/home/Reader. Gate viewer đang mở và OCR controller riêng với gate có chữ của Dịch/Đọc, nên ảnh/PDF scan vẫn dùng được. Reuse dispatcher doc: đóng sheet rồi gọi nút OCR thật để giữ both-open, active state và bản nháp. Chuyển5 glyph sheet và glyph OCR sang shared/icons,6 nút toolbar hydrate từ cùng nguồn, không CSS/layout/handler mới. Giữ pager621 và engine/model/renderer/navigation/store/export.
- File: `js/shared/icons.js`, `js/content/keepit-bar.js`, `js/dashboard/documents.js`, `js/core/languages.js`, `pages/documents.html`, manifest và tài liệu liên quan; gói mới đúng tên trong `Keepit-OCR-Zip`, không đổi ZIP cũ.
- Kiểm tra: HTTP app thật + shim extension API, PDF scan3 trang tổng hợp và PNG thật:54 nhóm ở1512×900/1233×696/900×600/673×696/390×844/320×640 × sáng/tối. Sáu bộ SVG paths giống nhau, một tile native trong grid, mở cả2/đóng main sheet/không tự run, active và draft giữ khi vào lại; en/vi/ko đúng label/tooltip; ảnh không có lớp chữ vẫn hiện/mở, thư viện không tile. Quan sát desktop HTTP và chuột thật bấm OCR tile mở cả2. Website HTTP riêng không OCR, glyph native vẫn có; syntax/diff và vendor220 hash kiểm lại. Chưa unpacked/ảnh extension622/crop4×/pixel/CSP/permission/profile/thiết bị; không dùng HTTP thay nghiệm thu. Không chạy lại nhận dạng vì engine không đổi.

**2026-11-26 | v3.5.621 | Arena sửa:**

- Tóm tắt: chỉ sửa UI số trang ở pager theo ảnh người dùng, phần620 khác giữ nguyên. Tái hiện pointer:coarse thật qua Chrome device toolbar: input44px + padding20px mỗi bên chỉ còn4px chữ, chevron bị min-width44px; nền wrapper rgb(21,21,23) quá đen. CSS riêng pager chia lane nhập/mũi tên24px, wrapper72px, input full-height/không chồng arrow và fill/line theo shared Settings field; OCR range không đổi. Không đổi JS/engine/navigation/storage.
- File: `css/dashboard/documents-responsive.css`, `manifest.json`, `PROJECT.md`, `README.md`, `docs/documents.md`, `THIRD_PARTY_NOTICES.md`; ZIP mới đúng thư mục `Keepit-OCR-Zip` trên main, giữ nguyên các ZIP trước.
- Kiểm tra: HTTP với shim API extension, PDF tổng hợp16 trang thật. 84 nhóm coarse (Chrome device toolbar, matchMedia xác nhận) +84 fine, mỗi nhóm viewport1233×696/1512×900/900×600/673×696/390×844/320×640 × sáng/tối: các giá trị1/5/16, text content40px > chữ2000~31.2px, input/arrow không chồng, chiều cao30/42 bên trong32/44, list lên/có16 mục, prev/next và chọnlist5 đổi native state. Dark fill rgba255,255,255,.08 thay nền đen, light .6. Chuột thật mở/cuộn list/chọn16 và quan sát đủ16/16. Không tuyên bố nhập liên tiếp nhiều chữ số đã nghiệm thu: một lượt tool gõ16 trả1, cần kiểm riêng cơ chế cập nhật có sẵn; bản này không sửa logic. Console.error/pageerror HTTP rỗng, vendor hash220/220; cú pháp/diff sạch. Chưa unpacked/ảnh extension621/pixel/crop4×/permission/thiết bị thật; không chạy lại OCR vì không đổi engine/JS.

**2026-11-26 | v3.5.620 | Arena sửa:**

- Tóm tắt: người dùng gửi sáu ảnh extension 619 và báo chưa khớp v14. Đối chiếu trực tiếp tìm wrapper .pgWrap cũ đè input mới (nền/viền kép, font700/padding lệch/height28), tổng còn dài, sáu SVG cũ, chấm OCR/CSS riêng, sheet chỉ hiện nhãn đơn vị “trang”. Thay đúng nguồn markup/CSS, xóa rule số cũ thay vì thêm lớp vá. Thêm tiêu đề Danh sách trang/tổng thật + en/vi/ko. Người dùng xác nhận hàng vùng đã giống demo nhưng yêu cầu Nhận dạng vùng giống Hủy: bỏ fill tự đổi tím/đen riêng, dùng neutral shared tile và giữ Apply tím/disabled logic; layer vùng lại trên bottom bar. Không đổi engine/model/data flow/docking/native navigation/export/schema.
- File: `pages/documents.html`, `css/dashboard/ocr-demo.css`, `documents-responsive.css`, `js/dashboard/ocr-controller.mjs`, `documents.js`, `js/core/languages.js`; manifest/tài liệu, ZIP mới `Keepit-OCR-Zip`. Không sửa demo hoặc ZIP619/618.
- Kiểm tra: đối chiếu trực tiếp HTTP app/v14 trên PDF scan16 trang:58 trạng thái ở1512×900/604×696/673×696/390×844/320×640 × sáng/tối; slot/field range và6SVG hết lệch đã nêu. Không giả đồng nhất toàn trang: font/docking theo trạng thái toolbar thật, version, summary thật và footer mô phỏng khác có chủ đích; max-height vùng còn theo giới hạn toolbar app. Kiểm sửa lỗi51 nhóm (neutral button trống/có chữ/sáng/tối, no dot, title/count3 ngôn ngữ, field widths112/94.5/59.5) không có cờ lỗi. Hồi quy UI13, lifecycle29, shared gestures/ngôn ngữ14 và OCR batch2 đều không cờ lỗi; current/all/range3 trang Tesseract thật thành công, scan dọn, có store. Chuột thật chọn vùng tiêu đề→Nhận dạng vùng trả chữ thật→Apply đóng; quan sát nút Nhận dạng vùng/Hủy cùng nền kính ở sáng/tối, Apply tím. Syntax5 file, vendor220/220, tools10/10, duplicate IDs/console.error/pageerror rỗng. Bộ QA619 đã bỏ sót lỗi hình thức; không dùng các số này thay nghiệm thu unpacked/ảnh extension620/crop4×/pixel/CSP/permission/thiết bị thật.

**2026-11-26 | v3.5.619 | Arena sửa:**

- Tóm tắt: tích hợp standalone responsive demo v14 theo xác nhận người dùng; giữ native OCR mở cả bảng văn bản/cài đặt và đóng cài đặt không đóng bảng. OCR là nút dock bình thường sau Hỏi AI; bỏ nhóm OCR dư trong Thêm. Sheet dọc chung/rail trang thật, kính Settings và gợi ý tím-vàng, numeric input + native lists, phạm vi tự chọn range, dropdown đầu ra luôn xuống, đủ phần engine nhưng PP/Fusor vẫn tắt. Giữ hai nút mở lại kết quả và bản nháp theo trang; chỉ Apply ghi store. Không đổi runtime/model/renderer/schema/export/smooth-scroll engine.
- File: `pages/documents.html`, `js/dashboard/documents.js`, `ocr-controller.mjs`, mới `ocr-controls.mjs`/`documents-sheets.mjs` và `css/dashboard/documents-responsive.css`; `ocr-demo.css`, `js/shared/theme-tokens.js`, `js/core/languages.js`, manifest/tài liệu. Gói ZIP đúng tên trong `Keepit-OCR-Zip` trên GitHub main.
- Kiểm tra: HTTP trang app thật với shim extension API: 6 kích thước × sáng/tối, mở cả hai/dismiss/focus/draft/numeric/engine/rail; kiểm sâu bản nháp khác trang, store không tự ghi, Apply thật, field/popup/notice, ba ngôn ngữ và shared gestures. Tesseract thật trên PDF scan tổng hợp: current, all3 trang và range2–3, có chữ/lưu store/dọn scan; không dùng kết quả mô phỏng. Kết quả HTTP: 13 nhóm UI, 29 nhóm lifecycle/field, 14 nhóm sheet/ngôn ngữ, 2 lượt all/range đều không có cờ lỗi; current OCR có chữ/lưu1 bản ghi. Hover chuột thật5 mặt, mỗi mặt120 frame/0 dịch hình học; Escape thật đóng list trước rồi cài đặt, giữ result. Syntax6 file và unittest công cụ10/10 sạch; vendor220/220 hash khớp. Ảnh quan sát HTTP không phải ảnh extension. Chrome công cụ vẫn từ chối chrome://extensions; chưa unpacked/CSP/permission/PNG4×/pixel/profile/tệp người dùng/thiết bị thật; không nâng trạng thái nghiệm thu bắt buộc.

**2026-11-26 | v3.5.618 | Arena sửa:**

- Tóm tắt: theo yêu cầu mới, căn popup tiến độ OCR và sửa văn bản vùng chọn sát cạnh phải (right:0), không tăng sidebar. Giữ width/height/vị trí dọc/z-index; dọc dịch popup tiến độ8px, ngang12px; popup vùng chọn giữ width cũ. Không đổi engine, flow, dữ liệu, kéo resize, modal giữa màn hình hay menu khác.
- File: `css/dashboard/ocr-demo.css`, `manifest.json`, `PROJECT.md`, `README.md`, `docs/documents.md`, `THIRD_PARTY_NOTICES.md`, `AGENTS.md` (đồng bộ quy tắc ZIP tương ứng); ZIP mới lưu `Keepit-OCR-Zip` trên GitHub main.
- Kiểm tra: HTTP app với shim extension API, 6/6 ở1512/800/390 × theme app sáng/tối: right của cả hai popup bằng viewport, width/height/y và sidebar trước/sau không đổi; ngang popup tiến độ thẳng mép sidebar mặc định. Cuộn stage để Back to top hiện thật, hit-test vẫn trúng popup tiến độ6/6. OCR Tesseract ảnh tổng hợp hoàn tất, có chữ/lưu1 bản ghi/dọn scan; console.error/pageerror HTTP rỗng; công cụ workspace10/10. Chưa QA unpacked/PNG/crop4×/pixel/CSP/permission; không đánh dấu đạt nghiệm thu UI bắt buộc.

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
