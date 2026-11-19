# Keepit - Hồ sơ dự án

## 1. Trạng thái hiện tại
- Version **3.5.433**, nhánh `Keepit-Optimize-Test`; 5 tab Dashboard dùng chung một đệm 2 bên: 32px ở màn rộng (≥1067px), 16px ở màn hẹp; 4 tab (Tổng quan, Chép chính tả, Ghi chú, Tài liệu) nhớ đúng vị trí cuộn khi chuyển tab và sau khi tải lại trang. Đã kiểm bằng extension thật 1512×950 và 390×844, `errors []`. Thùng rác không nhớ vị trí cuộn (theo yêu cầu). Chưa thử trên profile Chrome thật của người dùng.
- Version **3.5.424**, nhánh `Keepit-Optimize-Test`; Documents is now a normal dashboard route (`#dashboardScroller` is the only scroll root, shared topbar is the only header), so all four tabs share one header and one scroll behaviour; bar geometry matches the v3.5.379 Documents topbar. Browser-verified at 1512/1920/390 light+dark; PDF viewer flow not re-tested with a real file. Previous note: PDF permission guide uses shared green theme tokens for warning icon and step markers in light/dark themes. Static checks passed; Chrome visual/browser validation remains open. Documents Reader QA remains open. Watcher launch in `OPT-ARENA.md` uses `Unblock-File` + process-scoped Bypass. Arena cleanup/ZIP rules in `AGENTS.md`.
- Sửa tích hợp: demo chỉ chốt bố cục; Reader, chọn chữ/Full Dictionary, popup/sidebar Ghi chú và AI dùng đúng module UI/controller của app, không giữ bộ riêng trong Tài liệu.
- Ghi chú v314 chuyển vào annotations chung, giữ quote/anchor/ngày, không nhân bản; hiện ở H&N/Flashcards/JSON backup. Byte tệp vẫn ngoài backup. Tham chiếu tệp là UUID cục bộ, không phải hash gửi tới AI.
- Chromium extension thật PASS native UI/CRUD/restore/migration/deep link/backup, Reader qua trang/card, touch selection/Notes/AI sheet; web + homepage regression PASS. AI login/send/voice thật và Firefox/Edge Android thật vẫn chưa xác nhận.
- Office preview có giới hạn phông/đối tượng; OCR chưa có. Các QA cũ và giới hạn khác giữ ở mục 2, kiến trúc ở mục 4 và `docs/documents.md`.

## 2. Việc đang mở / Tiếp theo (sửa đè)
### Tiếp theo (thứ tự đã chốt)
- **Nói (Speaking)** vào cùng danh sách Thùng rác (sau Chép chính tả).
- **Tài liệu — Batch 2:** nhập/xoá tệp ngay trong Dashboard (picker + kéothả, tiến trình, SHA-256 chống trùng, giới hạn 50 MB/30 MB, modal mật khẩu PDF).
- **Tài liệu — Batch 3:** dọn bridge (bỏ đo chiều cao + `KEEPIT_DOCUMENTS_VIEWPORT`, thêm `KEEPIT_DOCUMENTS_OPEN_RESULT`, chuyển `documents.html` → `dashboard.html?view=documents`).
- Nạp chậm `#dictationStatsPopupFrame` (`pages/dashboard.html:342`).

### Chưa kiểm (đã ghi nhận, chưa chạy)
- Chưa kiểm: buổi Chép chính tả thật do overlay ghi (YouTube/Web), profile Chrome thật, và trường hợp >20 mục (phân trang).
- Chưa kiểm: profile Chrome thật của người dùng, trang có hơn 20 ghi chú (phân trang + hàng trang), ghi chú không có URL, và trang trùng URL nhưng khác tiêu đề.

### Chưa triển khai / trước phát hành
- Highlight ẩn và điều hướng ↑/↓ trong danh sách xổ xuống: phạm vi đã chốt, chưa triển khai; giữ khóa bật/tắt trong code.
- Hoàn thiện `LICENSE`/`PRIVACY-POLICY.md` (điền chủ sở hữu, email, URL công khai, ngày hiệu lực, độ tuổi) trước khi phát hành.
- Trước khi nộp AMO: quyết định cách xử lý quy tắc 9002 (gỡ `X-Frame-Options`/CSP của trang AI, xung đột AMO §4.4); người dùng đã chọn giữ ở v3.5.136.
- Lúc nộp (người dùng): bản sao ZIP bỏ `DATA-INVENTORY.md`, `STORE-LISTING.md`; ảnh chụp 1280×800; tài khoản CWS/AMO; rà lại form cửa hàng theo `STORE-LISTING.md`.

### Ghi chú chi tiết
- Việc đã xong → mục 5 «Nhật ký». Ghi chú QA/ý tưởng còn mở → `docs/pending-notes.md`.

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
│   └── shared/                    # theme-tokens (màu kính sáng/tối --kp-…), custom-font, icons, search (LHN_INDEX_SEARCH + LHN_SEARCH), sheet-kit, selection-toolbar, site-icons, thumbnails
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

## 5. Nhật ký

**2026-11-18 | v3.5.486 | Arena.ai Agent sửa (đo trực tiếp trong Chrome của người dùng qua DevTools):**

- Đo được: lần mở đầu `KeepitDocuments.open()` mất **~7,9 giây** mới xong; `documents-native-inactive` chỉ được gỡ ở bước cuối của `openViewer`. Trong khoảng đó `content.js` vẫn có `websiteDisabled = true` → chọn chữ đúng lúc tệp vừa hiện bị chặn (`mouseup.websiteDisabled`), chờ đủ lâu mới có thanh. Người dùng thấy: "mở lần đầu không bôi đen được, reload thì được".
- Sửa 3 chỗ: (1) `documents-context.js` **không chờ** `refreshSource()` (nó chờ `loadSettings` + `restoreAnnotations`) — chờ làm `openViewer` treo thêm; (2) `documents.js` gọi `refreshNativeSource()` **ngay khi engine sẵn sàng** để gỡ class ức chế sớm; (3) `content.js` tính `pageToolsDisabled()` **tại thời điểm chọn chữ** thay vì dùng cờ `websiteDisabled` cũ (3 cổng: mouseup, loadSettings, showTranslateIcon).
- File: `js/dashboard/documents-context.js`, `js/dashboard/documents.js`, `js/content/content.js`, `manifest.json`.
- Kiểm tra: `node --check` cả 3 hợp lệ; trong Chrome thật (3.5.485) đã chứng minh: khi class còn + cờ cũ → không có thanh; gọi `refresh()` xong → bôi đen có thanh (`reachedShowIcon`, `#lhn-translate-icon` 28×28). **Chưa chạy bản 3.5.486** (cần người dùng thay thư mục).

**2026-11-18 | v3.5.485 | Arena.ai Agent sửa:**

- Dữ liệu từ Chrome (`LHN_SELECTION_DEBUG`): `stage:"mouseup.outsideContext"`, `inStage:true`, **`inPara:false`**, `blockClass:"textLayer pdfTextLayer"`, `ctx.contains:"false"` → chọn chữ trong **PDF** bị loại vì `containsRange` đòi điểm chọn nằm trong `.en`.
- PDF render những đoạn chưa gom thành khối: `span` nằm thẳng dưới `.pdfTextLayer`, không có `.para`/`.en`. Vì vậy thanh Tô sáng/Dịch/AI không bao giờ hiện với loại trang này — không liên quan cài đặt.
- Nay: `containsRange` nhận vùng chọn trong `#stage` khi điểm chọn nằm trong `.en` **hoặc** trong một khối `[data-page]` (mọi loại trang của bộ xem).
- Hệ quả đã biết: ghi chú trên đoạn PDF chưa gom khối được neo ở mức **trang** (`fileLevel`, `page`) chứ chưa tô tại chỗ từng chữ như đoạn `.para`.
- File: `js/dashboard/documents.js`, `manifest.json`. Kiểm tra: `node --check` hợp lệ. **Chưa xác nhận trong Chrome.**

**2026-11-18 | v3.5.484 | Arena.ai Agent sửa:**

- Người dùng báo bản 3.5.483 **vẫn lỗi** lần mở đầu (`hasContentTools:true`, `iconExists:false`, `nativeInactive:false`): vậy không phải thời điểm mở tệp, mà là một cổng khác trong `content.js` chặn `showTranslateIcon()`.
- Bản này **ghi lại lý do** (chỉ đọc, không đổi hành vi): `globalThis.LHN_SELECTION_DEBUG.last` = `{stage, at, detail}` với các mốc `mouseup.*`, `loadSettings.*`, `reachedShowIcon`, `showTranslateIconBlocked` (kèm lý do + cờ cài đặt đang dùng). Đọc trong Console của Dashboard qua `frame.contentWindow.LHN_SELECTION_DEBUG`.
- Sửa kèm 1 chỗ: `pageContext.containsRange(range)` → chỉ chặn khi trả về **đúng `false`** (trước đây `undefined` — khi chưa gắn nguồn tài liệu — cũng bị coi là ngoài ngữ cảnh).
- File: `js/content/content.js`, `manifest.json`.
- Kiểm tra: `node --check js/content/content.js` hợp lệ. **Chưa xác nhận được trong Chrome** — cần dữ liệu `LHN_SELECTION_DEBUG` khi thanh không hiện.

**2026-11-18 | v3.5.483 | Arena.ai Agent sửa:**

- Người dùng: bôi đen văn bản ở **lần mở tệp đầu tiên** không hiện thanh Tô sáng / Dịch / AI, reload khung thì lại được (như bản 3.5.430).
- Nguyên nhân (đo trong Chrome của người dùng): lần mở đầu `iconExists:false` trong khi `nativeInactive:false` và mọi cờ cài đặt đều bật → **không phải CSS, không phải cài đặt**; khung mở tệp **khi `boot()` còn đang chạy** nên bộ công cụ chọn chữ chưa kịp gắn. Đường "reload" lại mở tệp **sau khi** boot xong (URL có `?document=` mở ở cuối `boot()`) nên có thanh.
- Nay: `openViewer()` **chờ khung khởi tạo xong** (`await bootReady`) và chờ thêm 2 khung hình sau khi `LHN_CONTENT_TOOLS` có mặt (tối đa 1,5 giây), rồi mới dựng bộ xem. Cờ được mở ngay trước khi `boot()` tự mở tệp theo `?document=` để không tự khoá nhau.
- File: `js/dashboard/documents.js`, `manifest.json`.
- Kiểm tra: `node --check js/dashboard/documents.js` hợp lệ; diff chỉ 3 chỗ. **Chưa chạy thật trong Chrome** — cần người dùng mở tệp lần đầu để xác nhận.

**2026-11-18 | v3.5.482 | Arena.ai Agent sửa:**

- Người dùng: "load xong mới vào layout tài liệu mới hợp lý" — trước đó nhập xong là popup ẩn ngay trong khi khung còn đang dựng trang đầu, nên màn hình nhảy vào layout tài liệu giữa chừng.
- Nay: nhập xong (`KEEPIT_DOCUMENTS_IMPORTED`, có tài liệu mới) → popup **giữ nguyên**, bước 2 chuyển ✓; khung chỉ báo `KEEPIT_DOCUMENTS_VIEWER_READY` **sau khi** `renderViewer()` + `ensurePage()` xong (`nativeReady=true`) → Dashboard mới ẩn popup (200ms). Tức là: popup che lúc tệp đang dựng, dọn xong mới lộ layout tài liệu.
- Chống kẹt: quá **5 giây** không thấy tín hiệu thì tự ẩn; khung mở tệp thất bại (`KEEPIT_DOCUMENTS_VIEWER {open:false}`) → ẩn ngay; nhập lỗi/trùng (count 0) → ẩn sau 320ms như cũ.
- File: `js/dashboard/documents.js`, `js/dashboard/documents-library.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; **jsdom**: (1) nhập xong, chưa vẽ xong → popup còn `true`; (2) nhận READY → ẩn `false`, thanh 100%; (3) lỗi `fileLimit` 200ms → còn; (4) 500ms → ẩn; (5) `open:false` → ẩn ngay. Đúng cả 5. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.481 | Arena.ai Agent sửa:**

- Người dùng: nhập tệp được rồi nhưng **mất popup hiệu ứng "Đang mở tệp"** như bản 3.5.430.
- Nguyên nhân: popup đó nằm trong `pages/documents.html` (`#openWrap`), mà từ 3.5.431 khung này là **iframe ẩn** khi Dashboard tự vẽ thư viện (`html.dash-embedded-library .app{display:none}` + `#dashboardDocumentsFrame{display:none;height:0}`) → modal không bao giờ hiện.
- Nay popup do **Dashboard** vẽ (`.dlib-open`), khung chỉ báo tiến trình:
  - Khung: `importNote()` gửi `KEEPIT_DOCUMENTS_IMPORT_STEP` với `phase: start|progress|save|password` (tên, dung lượng, loại tệp, %); nghe `KEEPIT_DOCUMENTS_IMPORT_CANCEL` → `++importCycle` dừng nhập.
  - Dashboard: thẻ 400px giống hệt bản cũ — icon tệp (PDF đỏ / Word xanh / PowerPoint cam / ảnh xanh lá), tên, dung lượng, 2 bước có vòng xoay → dấu ✓, thanh tiến trình gradient, chân "Đọc trên máy, không tải lên" + nút **Hủy**. Hiện ngay khi chọn/kéo tệp (thay toast "đang mở"), hiệu ứng: nền mờ .18s + thẻ phóng .96→1 .22s; xong thì giữ 320ms rồi ẩn.
  - Hủy: cờ `importCancelled` → không hiện toast lỗi khi khung trả lời.
- CSS mới trong `css/dashboard/documents-library.css` (biến `--dl-*` sáng/tối riêng vì popup gắn vào `body`, ngoài `#dashboardDocumentsView`).
- File: `js/dashboard/documents.js`, `js/dashboard/documents-library.js`, `css/dashboard/documents-library.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 181/181 ngoặc; **jsdom chạy thật `documents-library.js`**: mount thư viện → gửi `start` (pptx 17.091.788 B) → thẻ hiện đúng tên "English Vocabulary Workshop XL by Slidesgo.pptx", "16.3 MB", nhãn `PowerPoint` màu `rgb(226,112,43)`, bước `run` → gửi `progress 42` → fill 42% → `save` → `done,run` + 95% → `IMPORTED` → `done,done` + 100% → sau 380ms thẻ ẩn. **Chưa chạy UI thật.**

**2026-11-18 | v3.5.480 | Arena.ai Agent sửa — NGUYÊN NHÂN GỐC lỗi "0 tài liệu" / không nhập được tệp:**

- Toast thật: `Failed to execute 'transaction' on 'IDBDatabase': One of the specified object stores was not found` → kho IndexedDB `keepit-documents` **tồn tại nhưng không có store nào**.
- Vì sao: `js/dashboard/documents-library.js` mở kho bằng **version cứng 1** với `onupgradeneeded` **rỗng** ("kho do trang Tài liệu khởi tạo"). Nếu Dashboard mở trước (tab Tài liệu vẽ thư viện trước khi khung `documents.html` kịp chạy), kho được tạo với **0 store**; trang Tài liệu cũng mở version 1 nên **không bao giờ nâng cấp** → mọi `transaction(['meta','files'])` đều báo thiếu store. Hỏng vĩnh viễn cho tới khi sửa.
- Sửa:
  1. `documents-store.js`: `VERSION 1 → 2`, và trong `onupgradeneeded` chỉ tạo store **còn thiếu** (`objectStoreNames.contains`) → **kho rỗng v1 tự chữa lành** lần mở kế tiếp, kho lành (có tài liệu) lên v2 không mất gì.
  2. `documents-library.js`: mở **không kèm version** (không tự nâng cấp), và nếu buộc phải tạo thì tạo đủ 4 store + index — không bao giờ để lại kho rỗng.
  3. `dashboard-trash.js`: bỏ `DB_VERSION = 1` cứng, mở không version (chỉ đọc/ghi, không nâng cấp) — nếu giữ version 1 thì sau khi kho lên 2 sẽ `VersionError`.
- Kiểm tra: `node --check` 3 file hợp lệ; **test thật bằng fake-indexeddb + vm chạy chính file `documents-store.js`**: tái hiện kho v1 rỗng → module mở → `files, meta, notes, translations`, version 2, `importFile` + `all('meta')` + `get('files')` + `patch` đều chạy; và test khối `onupgradeneeded` thật của thư viện trên kho mới → tạo đủ 4 store. **Chưa chạy UI thật.**
- File: `js/dashboard/documents-store.js`, `js/dashboard/documents-library.js`, `js/dashboard/dashboard-trash.js`, `manifest.json`.

**2026-11-18 | v3.5.479 | Arena.ai Agent sửa:**

- Sau 3.5.478 người dùng thấy đúng câu "Không thêm được tệp vào thư viện." → tức là `count=0, skipped=0, error` **rỗng hoặc lạ**.
- Tìm ra lỗ hổng trong chính bản 3.5.478: hai nhánh từ chối (`!type`, quá dung lượng) **quên ghi `outcome.error`** → vẫn rơi vào câu chung. Nay ghi rõ `unsupported` / `fileLimit`.
- Thêm `kindByMime()`: có tệp sang tay khung mà **mất đuôi tên**, chỉ còn MIME → vẫn nhận đúng PDF/DOCX/PPTX/ảnh thay vì báo sai định dạng.
- Dashboard: lý do **không nằm trong danh sách quen** thì in luôn phần kỹ thuật sau dấu "·" (cắt 90 ký tự) để chốt nguyên nhân, không đoán.
- File: `js/dashboard/documents.js`, `js/dashboard/documents-library.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ. **Chưa chạy UI thật** — chờ câu toast mới để biết nguyên nhân gốc.

**2026-11-18 | v3.5.478 | Arena.ai Agent sửa:**

- Lỗi người dùng: chọn tệp ở tab Tài liệu → báo **"0 tài liệu"**, tệp **không vào** thư viện.
- Nguyên nhân hiển thị sai: khung `documents.html` đếm lại số bản ghi trước/sau và **nuốt mọi lỗi** (`try{await importFiles(...)}catch{ }`), nên mọi kiểu thất bại đều thành con số 0, không nói vì sao.
- Nay: `importFiles()` trả `{added, skipped, error}` (đếm ngay lúc nhập; lỗi đầu tiên được giữ lại, lỗi "cancel" vẫn im lặng); khung gửi `KEEPIT_DOCUMENTS_IMPORTED {count, skipped, error}`; Dashboard đổi câu báo: có lỗi → đúng lý do (`unsupported` / `fileLimit` / `documentsBusy` / `badFile` / `dbBlocked` / `storageFailed`), 0 mà trùng → "Tệp này đã có trong thư viện.", 0 mà không rõ → "Không thêm được tệp vào thư viện.". Thêm chặn "đang nhập tệp khác" thay vì `return` im lặng.
- i18n mới: `docs_importFailed`, `docs_importDuplicate`, `docs_documentsBusy` (en/vi/ko).
- File: `js/dashboard/documents.js`, `js/dashboard/documents-library.js`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ. **Chưa chạy UI thật** — bản này **chưa sửa nguyên nhân gốc**, nó làm lỗi hiện ra thành câu rõ ràng để chốt nguyên nhân.

**2026-11-18 | v3.5.477 | Arena.ai Agent sửa:**

- Nút cập nhật đổi nhãn cho gọn: `settingsCheckUpdate` = **"Cập nhật"** / `Update` / `업데이트` (trước là "Kiểm tra cập nhật"). Chỉ đổi chữ, hành vi và kích thước nút giữ nguyên.
- File: `js/core/languages.js`, `pages/dashboard.html`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; `grep` xác nhận 3 nhãn mới. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.476 | Arena.ai Agent sửa:**

- Giới thiệu → dòng **Version**:
  1. **Bỏ** câu phụ "Tô sáng và ghi chú được lưu cục bộ trong hồ sơ Firefox này." (không dùng `settingsLocalOnly` ở đây nữa).
  2. **Số phiên bản xuống dòng dưới** "Version": `#settingsVersion` đổi từ `<strong>` bên phải sang `<small>` nằm trong `<span>` (span là `display:grid; gap:4px` nên tự xuống dòng, dùng đúng kiểu chữ phụ 11px mờ sẵn có) — JS gán `v…` giữ nguyên.
  3. **Thêm nút "Kiểm tra cập nhật"** bên phải (`settings-action-button`, rộng 120px theo quy định sẵn có của `settings-backup-row`), bấm → toast chung của dashboard: "Bạn đang dùng bản mới nhất · v3.5.476". **Bản demo không có máy chủ cập nhật** nên nút chỉ xác nhận phiên bản hiện tại.
- Listener gắn **một lần** ở cấp cao nhất, không đặt trong `refreshDashboardSettings()` (hàm này chạy lại nhiều lần → chồng listener, toast hiện lặp).
- i18n: `settingsCheckUpdate` (en `Check for updates` / vi `Kiểm tra cập nhật` / ko `업데이트 확인`), `settingsUpToDate` (en `You are on the latest version` / vi `Bạn đang dùng bản mới nhất` / ko `최신 버전을 사용 중입니다`).
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; jsdom: dòng Version còn đúng 3 thành phần, `#settingsVersion` là `SMALL` trong `span`, câu "stored locally in this Firefox profile" đã mất khỏi trang, thứ tự Version → Terms & privacy → Error log. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.475 | Arena.ai Agent sửa:**

- Người dùng hỏi "muốn coi lại legal thì ở đâu?" → trước chỉ vào được từ popup đăng ký. Nay thêm đường **thường trực**: **Cài đặt → Giới thiệu** có dòng **"Điều khoản & Bảo mật"** + nút **"Xem"**.
- Dùng lại đúng khối `settings-backup-row` + `settings-action-button` sẵn có (không tạo kiểu mới), nằm giữa "Version" và "Error log".
- JS: tách `openLegalPage(doc)` dùng chung cho nút trong popup và nút ở Cài đặt → `window.open(chrome.runtime.getURL("pages/legal.html") + "#terms|#privacy", "_blank", "noopener")`, tab mới.
- i18n: `legalDocsTitle` / `legalDocsHelp` / `legalDocsOpen` (en `Terms & privacy` · vi `Điều khoản & Bảo mật` · ko `약관 및 개인정보`). Nội dung trang vẫn **chỉ tiếng Anh**.
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ (đã sửa 1 dấu phẩy thừa khi chèn i18n); jsdom: nút `#openLegalDocs` class `settings-action-button`, nằm trong panel `about`, thứ tự Version → Terms & privacy → Error log. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.474 | Arena.ai Agent sửa:**

- **(1) `pages/legal.html` theo sáng/tối của app** (trước chỉ theo hệ điều hành): thêm `js/pages/legal.js` — đọc `LHN_SETTINGS.get()` → `settings.sidebarTheme` (`light` / `dark` / `system`), gắn `data-theme` lên `<html>`, đặt luôn `color-scheme` cho thanh cuộn. "system" thì theo máy; **đổi giao diện trong app lúc tab đang mở thì trang đổi theo** qua `LHN_SETTINGS.subscribe()`. Vẽ ngay lần đầu theo hệ điều hành để không chớp trắng.
- CSS `legal.css`: `:root` = sáng, `html[data-theme="dark"]` = tối (đen `#000` / thẻ `#0d0d0f` / chữ `#eaeaea` / brand `#a5a9ff`), còn `@media (prefers-color-scheme: dark) html:not([data-theme])` làm dự phòng khi không chạy được script.
- `pages/legal.html` nạp thêm `browser-polyfill.js`, `defaults.js`, `config.js`, `settings.js`, `pages/legal.js` (đủ chuỗi để `LHN_SETTINGS` có `STORAGE_KEYS` + `DEFAULT_SETTINGS`).
- **(2) Hộp điều khoản mở/thu mượt**: bỏ `hidden` (display:none thì không chuyển động được) → `grid-template-rows: 0fr → 1fr` + `padding`/`border-width`/`opacity` .28s `cubic-bezier(.32,.72,0,1)`; `.is-open` mở, `visibility` + `aria-hidden` chặn tab/đọc màn hình khi đang đóng; nội dung bọc trong `.profile-auth-legal-inner` (`overflow:hidden`, `min-height:0`) để cắt đúng. JS: `setProfileLegalPanel(true|false)` thay 3 chỗ `hidden =`.
- File: `js/pages/legal.js` (mới), `css/pages/legal.css`, `pages/legal.html`, `css/dashboard/settings.css`, `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 926/926 và 48/48 ngoặc; jsdom chạy thật `legal.js` với 4 tổ hợp (app dark/máy sáng → `dark`; app light/máy tối → `light`; system → theo máy) ra đúng; jsdom xác nhận panel không còn `hidden`, có `.is-open`/`.profile-auth-legal-inner`, 2 nút. **Chưa chạy UI thật** → độ mượt phải xem bằng mắt.

**2026-11-18 | v3.5.473 | Arena.ai Agent sửa:**

- Yêu cầu: điều khoản dài → popup chỉ giữ 2 câu tóm tắt, **bản đầy đủ ở trang riêng**, nội dung **chỉ tiếng Anh** cho mọi ngôn ngữ.
- Thêm `pages/legal.html` + `css/pages/legal.css`: một trang gồm **2 tài liệu** (Terms of Use 9 mục / Privacy Policy 9 mục), có mục lục, neo `#terms` `#privacy`, tô nhẹ mục đang xem bằng `:target`, header dính (frosted), tự tối theo `prefers-color-scheme`, có kiểu in (`@media print`). **Không dùng JS** → đúng CSP của MV3 (`script-src 'self'`), mở bằng `pages/legal.html#terms` là nhảy đúng chỗ.
- Popup: bảng điều khoản thêm hàng 2 nút **"Đọc bản đầy đủ"** (`profileLegalFull`) + **"Đóng"**, căn giữa (`.profile-auth-legal-actions`). Bấm "Đọc bản đầy đủ" → `window.open(chrome.runtime.getURL("pages/legal.html") + "#" + tài liệu đang xem, "_blank", "noopener")` → **tab mới**, nên form đăng ký không mất chữ đã gõ.
- i18n: thêm `profileLegalFull` (en "Read the full version" / vi "Đọc bản đầy đủ" / ko "전문 보기"). Nội dung trang legal **cố ý chỉ tiếng Anh**, không đi qua `languages.js`.
- Không cần khai báo `web_accessible_resources` (trang mở bằng `window.open` từ chính tiện ích).
- File: `pages/legal.html` (mới), `css/pages/legal.css` (mới), `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: `node --check` 3 file JS hợp lệ; CSS settings 925/925, legal 47/47 ngoặc; jsdom: panel có 2 nút + đúng key i18n, trang legal có `#terms`/`#privacy`, 18 mục, `lang="en"`. **Chưa chạy UI thật**; chỗ `[contact email]` đang để trống chờ điền.

**2026-11-18 | v3.5.472 | Arena.ai Agent sửa:**

- Lỗi thứ tự: bấm tạo tài khoản khi chưa tích điều khoản thì hiện ngay "Bạn cần đồng ý Điều khoản sử dụng…" — **che mất lỗi ô nhập** (mật khẩu ngắn, nhập lại không khớp). Lỗi nhập phải hiện trước.
- Nay: chuyển khối kiểm tra điều khoản xuống **sau** `LHN_AUTH_POPUP.check()` và **trước** `finishProfileAuth()`. Thứ tự đầy đủ: Email trống → Email sai định dạng → Mật khẩu trống → (đăng nhập: email chưa có tài khoản → tự mở nhánh tạo) → mật khẩu < 8 ký tự / nhập lại không khớp / sai thông tin → **rồi mới** nhắc tích điều khoản.
- File: `js/dashboard/dashboard.js`, `manifest.json`.
- Ghi chú: 3.5.471 (căn giữa nhãn ô nhập) đã bị **revert** theo yêu cầu, nội dung = 3.5.470; số 3.5.471 không dùng lại.
- Kiểm tra: `node --check` hợp lệ; in lại toàn bộ handler xác nhận đúng thứ tự. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.470 | Arena.ai Agent sửa:**

- Người dùng: câu lỗi và dòng đồng ý điều khoản phải **căn giữa** (đang bám lề trái).
- `.profile-auth-error { text-align: center }`.
- Bỏ flex ở `.profile-auth-terms` → `display: block; text-align: center`; checkbox thành `inline-block` (giữ `appearance:auto`, `vertical-align:-2px`, `margin-right:7px`) và `.profile-auth-terms-text { display:inline }` → cả cụm chữ + 2 link chảy như **một đoạn văn căn giữa**, xuống dòng vẫn căn giữa; viền đỏ `.is-invalid` của checkbox không đổi.
- File: `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: CSS 924/924 ngoặc. **Chưa chạy UI thật** — cần người dùng xem lại điểm xuống dòng của dòng điều khoản.

**2026-11-18 | v3.5.469 | Arena.ai Agent sửa:**

- Người dùng: tiêu đề popup đăng nhập làm "cho có" — phải **căn giữa**, **cùng màu/nền với popup**, và **có gạch phân cách**.
- Tìm ra nguyên nhân dải trắng ở đầu thẻ: `css/dashboard/dashboard.css` dòng 5 có rule toàn cục `header { min-height:56px; background:#fff; ... }` — thẻ tiêu đề của mình là `<header>` nên bị **tô nền trắng 56px**, tách hẳn khỏi nền kính của popup. Đổi sang `<div class="profile-auth-head">` (cả `pages/dashboard.html` và `markup()`), nên không còn dính rule chung nào.
- CSS mới: `.profile-auth-head { padding:15px 20px 13px; border-bottom:1px solid var(--au-line); background:transparent; text-align:center; }` và `.profile-auth-title { font-size:15.5px; font-weight:650; line-height:21px; color:var(--au-tx); text-align:center; letter-spacing:-.01em; }` → chữ **căn giữa**, cùng nền kính với thẻ, có **gạch phân cách** màu viền chuẩn (`.12` sáng / `.12` trắng tối). `.profile-auth-body` thêm `background:transparent`, padding `16px 20px 20px` để sát gạch.
- Sheet điện thoại: `.profile-auth-head { padding-top:10px; padding-bottom:11px }` (sát tay nắm), body `14px`.
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 924/924 ngoặc; `grep` xác nhận cả 2 markup đã dùng `div.profile-auth-head` (không còn `<header>` trong popup đăng nhập). **Chưa chạy UI thật** — vị trí/căn giữa cần người dùng xem.

**2026-11-18 | v3.5.468 | Arena.ai Agent sửa:**

- Lỗi: bỏ 2 tab thì popup **mất luôn tiêu đề**, phía trên chỉ còn nút Google.
- Nay: thêm tiêu đề trên cùng (`<header class="profile-auth-head"><h2 id="profileAuthTitle">`) và **đổi theo chế độ**: chế độ đăng nhập → **"Đăng nhập"** (`profileLogin`), chế độ tạo tài khoản → **"Đăng ký"** (`profileRegister`); đổi ngay trong `setProfileAuthMode()`.
- Kỹ thuật: header đặt **ngoài** `.profile-auth-body` (body là grid 2 cột ở màn ngang, nhét vào sẽ phải sửa `grid-template-areas`); CSS `.profile-auth-head { padding:18px 20px 0 }`, `.profile-auth-title { font-size:16px; font-weight:650; color: var(--au-tx) }`; body bớt lề trên còn `14px` (sheet điện thoại: header `12px`, body `10px`). Khi đổi ngôn ngữ, `applyTranslations()` gán lại tiêu đề đúng chế độ (không để `data-i18n` kéo về "Đăng nhập").
- Markup đồng bộ ở `pages/dashboard.html` và `markup()` của `auth-popup.js`.
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 924/924 ngoặc; jsdom: `#profileAuthTitle` là `H2` trong `.profile-auth-head`, thứ tự form = grip → header → body. **Chưa chạy UI thật** (khoảng cách, cỡ chữ).

**2026-11-18 | v3.5.467 | Arena.ai Agent sửa:**

- Thêm **dòng đồng ý điều khoản** cho đúng UX app hiện đại — chỉ hiện ở nhánh **tạo tài khoản**, **không tích sẵn** (GDPR: không được tích trước).
- Nội dung: checkbox + "Tôi đồng ý với **Điều khoản sử dụng** và **Chính sách bảo mật**". Hai chữ in đậm là **nút mở nội dung ngay trong popup** (bản demo chưa có trang web điều khoản nên không trỏ link giả ra ngoài): panel hiện tiêu đề + đoạn ngắn (điều khoản: tài khoản chỉ tạo trong tiện ích, không máy chủ nào lưu hồ sơ, xoá được trong Cài đặt → Tài khoản; bảo mật: hồ sơ/email/mật khẩu chỉ nằm trong bộ nhớ cục bộ, gỡ tiện ích là mất) + nút Đóng.
- Bắt buộc: bấm **Tạo tài khoản** mà chưa tích → `profileTermsRequired` ("Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật để tạo tài khoản."), hàng điều khoản đỏ (chữ + viền ô tích), `aria-invalid` + `aria-describedby`, focus vào ô tích. Tích xong là lỗi tự mất.
- Chi tiết kỹ thuật: link là `<button type="button">` **đặt ngoài** `<label>` để bấm link không vô tình tích ô; `setProfileAuthMode()` ẩn hàng + panel và bỏ tích khi về chế độ đăng nhập; markup đồng bộ ở `pages/dashboard.html` và `markup()` của `auth-popup.js`.
- i18n mới (en/vi/ko): `profileTermsAgree`, `profileTermsLink`, `profileTermsAnd`, `profilePrivacyLink`, `profileTermsRequired`, `profileTermsBody`, `profilePrivacyBody`, `profileLegalClose`.
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `css/dashboard/settings.css`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ (2 file JS); CSS 921/921 ngoặc; jsdom trên markup thật: đủ `#profileTermsRow` (mặc định ẩn), `#profileTerms` (không tích sẵn), `#profileLegalPanel`, 2 nút `data-legal`, thứ tự `.profile-auth-fields` = Mật khẩu → Nhập lại → lỗi → điều khoản → panel → nút gửi. **Chưa chạy UI thật.**

**2026-11-18 | v3.5.466 | Arena.ai Agent sửa:**

- Đổi nhãn thông báo khi email chưa có tài khoản:
  - vi: "Email này chưa có tài khoản trên máy này. Nhập lại mật khẩu để tạo tài khoản." → **"Email này chưa có tài khoản. Hãy tạo tài khoản."**
  - en: "This email has no account on this device yet. Retype the password to create the account." → **"This email has no account yet. Create one."**
  - ko: "이 이메일에는 아직 계정이 없습니다. 비밀번호를 다시 입력해 계정을 만드세요." → **"이 이메일에는 계정이 없습니다. 계정을 만드세요."**
- Chỉ đổi chữ, không đổi hành vi (vẫn báo rồi mở ô Nhập lại mật khẩu + nút Tạo tài khoản).
- File: `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; `grep` xác nhận đúng 3 chuỗi mới trong 3 ngôn ngữ. Chưa chạy UI thật.

**2026-11-18 | v3.5.465 | Arena.ai Agent sửa:**

- Câu hỏi: nhập sai email/mật khẩu, bấm Đăng nhập, rồi **sửa lại cho đúng** thì sao? Kiểm lại thì thấy 2 lỗ hổng.
- Lỗ hổng 1: khi email đúng định dạng nhưng **chưa có tài khoản**, máy tự chuyển sang nhánh "Tạo tài khoản"; người dùng sửa lại email cho đúng tài khoản thì popup **vẫn nằm ở nhánh tạo tài khoản** (ô Nhập lại vẫn hiện, nút vẫn "Tạo tài khoản", câu "email này chưa có tài khoản" vẫn treo).
- Lỗ hổng 2: lỗi thuộc ô Mật khẩu / Nhập lại thì sửa **ô Email** không dọn lỗi cũ.
- Nay: thêm cờ `profileAuthAutoRegister` (chỉ bật khi **máy** tự chuyển chế độ). Sửa nội dung ô Email:
  - Nếu đang bị tự chuyển → quay về chế độ **đăng nhập** (ẩn Nhập lại, nút về "Đăng nhập ngay", xoá câu thông báo) rồi để người dùng bấm lại.
  - Nếu lỗi đang nằm ở ô Email → chỉ xoá khi email đã hợp lệ (giữ kiểu "sửa sớm").
  - Nếu lỗi nằm ở ô khác → đổi email là **xoá lỗi cũ** (đổi danh tính thì lỗi cũ hết nghĩa).
- Bấm dòng chân "Chưa có tài khoản? Đăng ký" là **người dùng tự chọn** → tắt cờ, sửa email không tự quay lại; mở lại popup cũng reset cờ.
- Lỗi mật khẩu: gõ lại vào ô Mật khẩu / Nhập lại là lỗi + viền đỏ tự mất (đã có từ 3.5.463), sửa xong chỉ cần bấm lại nút.
- File: `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; đọc lại 3 nhánh mới (mở popup reset cờ, submit đặt cờ, input xử lý 3 trường hợp). **Chưa chạy UI thật.**

**2026-11-18 | v3.5.464 | Arena.ai Agent sửa:**

- Lỗi: gõ email sai rồi **Enter** vẫn nhảy xuống ô Mật khẩu.
- Nguyên nhân: `<form>` chưa có `novalidate`, các ô lại có `required` → khi Enter, trình duyệt chạy kiểm tra mặc định, thấy ô Mật khẩu trống nên **tự chuyển focus + bong bóng lỗi của Chrome**, chặn luôn sự kiện `submit` nên phần kiểm email của mình không chạy.
- Nay: thêm `novalidate` cho `#profileAuthForm` (cả `pages/dashboard.html` và `markup()` của `auth-popup.js`) và tự kiểm theo thứ tự trong submit: **email trống → báo "Nhập email của bạn."**; **email sai định dạng → báo "Email không đúng định dạng."**; **mật khẩu trống → báo "Nhập mật khẩu."** Mỗi bước đều `focus()` về đúng ô và `return`, **không** đi tiếp. Enter giờ chỉ đi tiếp khi dữ liệu thật sự hợp lệ.
- i18n mới: `profileEmailRequired`, `profilePasswordRequired` (en/vi/ko).
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; `grep` xác nhận `novalidate` có ở cả 2 bản markup; đọc lại toàn bộ nhánh submit (6 bước, mỗi bước có `return`). **Chưa chạy UI thật.**

**2026-11-18 | v3.5.463 | Arena.ai Agent sửa:**

- Bổ sung 3 chuẩn UX còn thiếu cho ô Email / mật khẩu của popup đăng nhập:
  1. **Ô sai có viền đỏ**: `showProfileAuthError(message, fieldIds)` gắn `aria-invalid="true"` + `aria-describedby="profileAuthError"` cho ô sai và class `is-invalid` lên `label`; CSS `label.is-invalid input { border-color: var(--au-err) }`, giữ đỏ cả khi focus (viền sáng đỏ `color-mix(...,18%,transparent)`), nhãn ô cũng đỏ.
  2. **Kiểm khi rời ô**: `blur` ô Email → nếu đã có nội dung mà sai định dạng thì báo ngay dưới ô; ô trống thì **không** báo.
  3. **Sửa sớm**: khi ô đang bị đánh dấu lỗi, mỗi lần gõ (Email / Mật khẩu / Nhập lại) mà giá trị đã hợp lệ thì lỗi **tự biến mất** (`hideProfileAuthError`).
- Lỗi được gắn đúng ô: `PROFILE_AUTH_FIELDS = { profileEmailInvalid:email, profileBadCredentials:password, profilePasswordShort:password, profilePasswordMismatch:retype }`; "email chưa có tài khoản" là thông báo, **không** tô đỏ ô nào.
- `setProfileAuthMode()` gọi `hideProfileAuthError()` (dọn cả viền đỏ/aria), nên mở lại popup luôn sạch.
- File: `js/dashboard/dashboard.js`, `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 907/907 ngoặc; đọc lại toàn bộ 5 chỗ gọi `showProfileAuthError` (kiểm email khi gửi, kiểm khi rời ô, nhánh "chưa có tài khoản", nhánh `check()` trả lỗi, và `hideProfileAuthError` trong `setProfileAuthMode`). **Chưa chạy UI thật.**

**2026-11-18 | v3.5.462 | Arena.ai Agent sửa:**

- (1) **Email phải đúng định dạng**: thêm `validEmail()` trong `auth-popup.js` — regex `^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$` (bắt buộc có tên miền + đuôi ≥ 2 chữ) và chặn thêm `..`, chấm ở đầu/cuối phần tên. `check()` trả `profileEmailInvalid` cho mọi trường hợp sai; `dashboard.js` kiểm định dạng **trước** khi xét tài khoản có sẵn, báo lỗi và đưa con trỏ về ô Email.
- (2) **Con mắt hiện/ẩn mật khẩu** cho cả ô Mật khẩu và Nhập lại mật khẩu: bọc mỗi ô trong `.profile-auth-pw` + nút `.profile-auth-eye` (`data-password-toggle="<id ô>"`, icon mắt có gạch chéo), bấm để đổi `type` password ↔ text, đổi `aria-pressed` + `aria-label`, gạch chéo ẩn khi đang hiện (`[aria-pressed="true"] .kp-eye-slash{display:none}`), nhãn dịch theo ngôn ngữ trong `setProfileAuthMode()`.
- (3) **Mật khẩu tối thiểu 8 ký tự** khi tạo tài khoản: `check("register")` trả `profilePasswordShort` nếu `< 8`; đăng nhập (tài khoản demo `123`) **không** áp luật này.
- i18n mới: `profileEmailInvalid`, `profilePasswordShort`, `profileShowPassword`, `profileHidePassword` (en/vi/ko).
- File: `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `pages/dashboard.html`, `css/dashboard/settings.css`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra (chạy thật bằng node, không cần trình duyệt): `validEmail` đúng 8/8 ca thử (`abc` ✗, `a@b` ✗, `a@b.c` ✗, `a@b.co` ✓, `huuson889@gmail.com` ✓, `a..b@x.com` ✗, `.a@x.com` ✗, `a@x-y.com` ✓); `check()`: login `huson@example.com/123` ✓, `huson/sai` → `profileBadCredentials`, email rác → `profileEmailInvalid`, register `12345678` ✓, `1234567` → `profilePasswordShort`, email rác → `profileEmailInvalid`, nhập lại lệch → `profilePasswordMismatch`. `node --check` hợp lệ 3 file JS. **Chưa chạy UI thật** (icon, vị trí con mắt) — cần người dùng xem.

**2026-11-18 | v3.5.461 | Arena.ai Agent sửa:**

- Lỗi: 3.5.460 dò email **ngay khi rời ô**, nên vừa gõ email đã nhảy ra "Nhập lại mật khẩu" + "Tạo tài khoản" — sai hành vi yêu cầu.
- Nay: **bỏ hết dò tự động** (xóa listener `input` / `blur` / `keydown` trên ô Email và cờ `profileAuthManual`). Chỉ khi bấm **Đăng nhập ngay**:
  - Email **chưa có tài khoản** → hiện thông báo *"Email này chưa có tài khoản trên máy này. Nhập lại mật khẩu để tạo tài khoản."* và mở nhánh tạo tài khoản (**Nhập lại mật khẩu** + nút **Tạo tài khoản**) bằng `AUTH_POPUP.morph`.
  - Email có tài khoản nhưng sai mật khẩu → giữ nguyên "Email hoặc mật khẩu không đúng."; đúng → vào Dashboard.
  - Bấm **Tạo tài khoản** → `check("register")` kiểm email hợp lệ / mật khẩu / nhập lại khớp như cũ.
- Thêm khoá i18n `profileAccountNotFound` (en/vi/ko).
- File: `js/dashboard/dashboard.js`, `js/core/languages.js`, `manifest.json` (markup + CSS không đổi).
- Kiểm tra: `node --check` hợp lệ; `grep` không còn `detectProfileAuthMode` / `profileAuthManual`; đọc lại thứ tự trong submit: chặn "chưa có tài khoản" → đổi chế độ → hiện lỗi → return; nhánh còn lại giữ `check()` như trước. **Chưa chạy UI thật.**

**2026-11-18 | v3.5.460 | Arena.ai Agent sửa:**

- Yêu cầu: popup đăng nhập chỉ còn **một form** (bỏ 2 tab Đăng nhập / Đăng ký) — kiểu "identifier-first" như Google, Microsoft, Slack, Notion.
- Nay: nhập Email → rời ô (blur), Enter, hoặc bấm nút gửi thì hệ thống tự dò:
  - **Email đã có** (`huson` / `huson@example.com`) → chỉ hiện **Mật khẩu** + nút **Đăng nhập ngay**.
  - **Email chưa có** → hiện thêm **Nhập lại mật khẩu** + nút **Tạo tài khoản** (ô nhập lại mở/thu mượt bằng `AUTH_POPUP.morph` sẵn có).
- Dò lại khi sửa email (sự kiện `input` đặt lại cờ); nếu người dùng **tự bấm** dòng chân "Chưa có tài khoản? Đăng ký" / "Đã có tài khoản? Đăng nhập" thì cờ `profileAuthManual = true` và hệ thống **không tự đổi ý** nữa cho tới khi email được sửa.
- Kỹ thuật: `auth-popup.js` thêm `accountExists(username)` (so khớp chữ thường với dữ liệu demo cục bộ, không gửi đi đâu) và export trong `LHN_AUTH_POPUP`; `dashboard.js` thêm `detectProfileAuthMode()`, `setProfileAuthMode()` bỏ 4 dòng tab và chuyển sang class `is-register` trên `#profileAuthForm`; submit gọi dò trước khi `check()` nếu chưa chỉnh tay.
- Dọn theo: bỏ khối tab trong `pages/dashboard.html` và trong `markup()` của `auth-popup.js` (2 bản markup luôn khớp nhau); bỏ CSS `.profile-auth-seg` (5 rule + 2 rule ở sheet dọc/ngang + tham chiếu trong `prefers-reduced-motion`); đổi 2 rule dòng chân từ `form:has(#profileRegisterTab.is-active)` sang `form.is-register`.
- Nhãn: `profileCreateAccount` → **en "Create account" / vi "Tạo tài khoản" / ko "계정 만들기"** (trước là "Sign up/Đăng ký/가입", trùng nhãn link chân trang).
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `css/dashboard/settings.css`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ cho 3 file JS; `grep` toàn repo không còn `profile-auth-seg` / `profileRegisterTab` / `profileLoginTab`; jsdom trên markup thật: không còn tablist, còn đủ Google, Email, Mật khẩu, Nhập lại, nút gửi, 2 dòng chân, `#profileRetypePasswordLabel` mặc định `hidden`. **Chưa chạy UI thật** (sandbox không có trình duyệt).

**2026-11-18 | v3.5.459 | Arena.ai Agent sửa:**

- Yêu cầu: **cửa sổ Cài đặt cũng có hiệu ứng hiện/ẩn giống popup đăng nhập**.
- Nay (máy tính / màn ngang — `@media (orientation: landscape)`):
  - `#dashboardSettingsDialog.dashboard-settings-dialog { opacity:1; transform:none; transition: opacity .18s ease-out, transform .18s ease-out, display .3s allow-discrete, overlay .3s allow-discrete }`.
  - `:not([open]) { opacity:0; transform:scale(.97) }` + `@starting-style { [open] { opacity:0; transform:scale(.97) } }` → mở: hiện dần + phóng nhẹ 180ms; đóng: thu nhỏ + mờ đi.
  - `::backdrop { opacity:1; transition: opacity .3s, display .3s allow-discrete, overlay .3s allow-discrete }` + `:not([open])::backdrop { opacity:0 }` + `@starting-style` → nền sau mờ dần 300ms. Nền giữ nguyên (`rgba(0,0,0,.16)` máy tính, `.4` nơi khác).
  - `html.kp-embed` (Cài đặt nằm trong sheet thanh Keepit, toàn màn hình) **không** phóng: `opacity:1; transform:none; transition:none`.
- Điện thoại (dọc: `@media (orientation: portrait)`; ngang thấp: `@media (orientation: landscape) and (max-height: 499.98px)`) **giữ nguyên kiểu sheet trượt từ đáy**; thêm `opacity:1` vào rule `:not([open])` của khối ngang thấp để lúc đóng vẫn thấy sheet trượt xuống (khối ngang ở trên đặt `opacity:0`).
- File: `css/dashboard/settings.css`, `manifest.json` (không đổi JS/HTML).
- Kiểm tra: CSS 906/906 ngoặc; đọc CSSOM: khối `@media (orientation: landscape)` chứa đúng 3 rule mới (opacity/transform/transition), rule `::backdrop` gốc có `opacity:1` + transition, và rule sheet ngang-thấp có `opacity:1`. **Chưa xác minh bằng mắt** — jsdom không chạy `@media (orientation)`, nên hiệu ứng thật cần người dùng xem.

**2026-11-18 | v3.5.458 | Arena.ai Agent sửa:**

- Người dùng chốt: làm popup Ảnh hồ sơ **giống hệt** popup đăng nhập (`.profile-auth-dialog`, settings.css:866–899). Lần này copy nguyên giá trị mẫu, không tự thêm.
- (1) **Hiện/ẩn**: hộp thoại `transition: display .3s allow-discrete, overlay .3s allow-discrete`; thẻ `opacity:1; transform:none; transition: opacity .18s ease-out, transform .18s ease-out` + `[not([open])]{opacity:0; transform:scale(.97)}` + `@starting-style`; `::backdrop` `opacity:1` → `[not([open])]{opacity:0}` + `@starting-style`, `transition: opacity .3s, display .3s allow-discrete, overlay .3s allow-discrete`. Sheet điện thoại: thẻ `opacity:1; transform:none; transition:none` (trượt bằng cả hộp thoại như mẫu).
- (2) `color-scheme: light` trên hộp thoại, `html.dark` → `dark`. (3) `overscroll-behavior: contain` trên hộp thoại **và** trên vùng cuộn thật `.kp-avatar-body`. (4) `-webkit-tap-highlight-color: transparent`.
- (5) `::backdrop` về **`rgba(0,0,0,.4)`** cho cả hai chế độ (bỏ `.5` tôi tự thêm) + `@media (orientation: landscape){ background: rgba(0,0,0,.24) }` như mẫu. (6) Tay nắm sheet **36×5** (trước 38×5).
- Kỹ thuật: căn giữa bằng `translate: var(--kp-avatar-dx) var(--kp-avatar-dy)` (thuộc tính rời) để hiệu ứng phóng `transform: scale(.97)` không đè lên phép dịch.
- Không copy (không cần): `z-index` (dialog top layer), `box-sizing` cho mọi con (`*{box-sizing:border-box}` đã có ở đầu `dashboard.css`), `font-size/line-height` gốc. Giữ khác có lý do: chỉ thân thẻ cuộn (để nút Đổi ảnh / Xoá ảnh luôn thấy) và 392px / bo 16 theo thiết kế đã chốt.
- File: `css/dashboard/dashboard.css`, `manifest.json` (JS không đổi).
- Kiểm tra: CSS 1221/1221 ngoặc; jsdom → hộp thoại `fixed/grid/center`, `color-scheme:light`, `overscroll-behavior:contain`, `transition: display .3s allow-discrete, overlay .3s allow-discrete`; thẻ `392px / max-width:100% / rgba(255,255,255,.78) / blur(24px) saturate(1.6) / opacity:1 / transition: opacity .18s, transform .18s`, `translate` dùng biến căn giữa. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox).

**2026-11-18 | v3.5.457 | Arena.ai Agent sửa:**

- Người dùng báo: ở chế độ điện thoại (DevTools 455×696), sheet **Ảnh hồ sơ không kéo xuống để đóng** được — trong khi sheet Cài đặt và popup đăng nhập kéo được.
- Nguyên nhân: popup Ảnh hồ sơ là sheet mới, **chưa gắn `sheet-kit`** (`js/shared/sheet-kit.js`) như hai sheet kia.
- Nay: gắn y như popup đăng nhập — `LHN_SHEET.attach(dialog, { isOpen, close, watch, drag: SHEET.matches ? undefined : false })`, `SHEET` = đúng media query của CSS sheet (`portrait ≤699px` hoặc `landscape ≤499.98px`) nên **máy tính không kéo, điện thoại kéo được**; kéo xuống quá ngưỡng = đóng; danh sách trong thân cuộn lên trước rồi mới kéo (đúng luật sheet-kit).
- Thêm chuyển động đóng/mở của sheet (chỉ trong media query điện thoại): `transition:transform .3s cubic-bezier(.2,.8,.2,1), display .3s allow-discrete, overlay .3s allow-discrete` + `[not([open])]{transform:translateY(100%)}` + `@starting-style` — y như sheet Cài đặt, nên đóng là trượt xuống chứ không biến mất.
- File: `js/dashboard/dashboard.js`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1211/1211 ngoặc; `grep` xác nhận `sheet-kit.js` được nạp **trước** `dashboard.js` trong `pages/dashboard.html` nên `LHN_SHEET` có sẵn lúc gắn. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox).

**2026-11-18 | v3.5.456 | Arena.ai Agent sửa:**

- Lỗi (ảnh người dùng): popup nhảy xuống **góc dưới bên phải**, phần lớn ra ngoài màn hình.
- Nguyên nhân: `openAvatarDialog()` gọi `syncAvatarDialogOffset()` **trước** `showModal()`. Lúc đó hộp thoại còn `display:none` nên `getBoundingClientRect()` của thẻ = **0**; phép dịch thành `tâm Cài đặt − 0` → dịch vài trăm px xuống phải.
- Nay: gọi **sau** `showModal()` (đã có layout), và thêm chốt an toàn: nếu rect rỗng (width/height = 0) hoặc |dx|,|dy| > 240 thì **không dịch** — thẻ quay về đúng thế canh giữa của CSS (y popup đăng nhập).
- Phần CSS giữ nguyên như 3.5.455 (viết theo `.profile-auth-dialog`): hộp thoại `fixed inset:0; padding:16px; display:grid; place-items:center`; thẻ kính `.78` + `blur(24px) saturate(1.6)`, viền `.12`, bo 16, rộng 392px; điện thoại → sheet đáy.
- File: `js/dashboard/dashboard.js`, `manifest.json` (CSS không đổi).
- Kiểm tra: `node --check` hợp lệ; đọc lại thứ tự trong `openAvatarDialog()`: `showModal()` → `syncAvatarDialogOffset()` → focus. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox).

**2026-11-18 | v3.5.455 | Arena.ai Agent sửa:**

- Lỗi: popup vẫn lệch và không "giống popup đăng nhập". Đo trên ảnh người dùng: thẻ 684→1172 px ảnh (tâm 928) trùng khít ảnh trước → phép dịch của 3.5.454 **không có tác dụng** vì nó giả định thẻ đang canh theo khung nhìn.
- Nay viết lại **theo đúng khuôn `.profile-auth-dialog`** (popup đăng nhập, settings.css:866):
  - Hộp thoại: `position:fixed; inset:0; padding:16px; width:100%; height:100%; display:grid; place-items:center` — tự canh thẻ, không dựa vào `margin:auto` của trình duyệt.
  - Thẻ: kính đặt **trực tiếp trên thẻ** (bỏ lớp `::before`): `background:rgba(255,255,255,.78)` / tối `rgba(24,24,28,.78)`, `backdrop-filter:blur(24px) saturate(1.6)`, viền `rgba(0,0,0,.12)` / `rgba(255,255,255,.12)`, bo 16, `box-shadow:0 24px 64px rgba(0,0,0,.24)`.
  - `::backdrop`: `rgba(0,0,0,.4)` (tối `.5`), không blur.
  - **Responsive như popup đăng nhập**: `@media (orientation:portrait) and (max-width:699px), (orientation:landscape) and (max-height:499.98px)` → hộp thoại thành sheet đáy `inset:auto 0 0 0`, thẻ rộng 100%, bo `22px 22px 0 0`, có tay nắm (`::before` 38×5), chừa `env(safe-area-inset-bottom)`.
- Căn giữa theo Cài đặt: `syncAvatarDialogOffset()` nay **đo thật** — đặt dx/dy về 0, đọc `getBoundingClientRect()` của thẻ và của Cài đặt, dịch đúng bằng hiệu hai tâm (vừa ngang vừa dọc), không giả định khung nhìn; bỏ qua khi ở chế độ sheet điện thoại.
- `width:392px; max-width:100%` (thay `min()`) cho chắc chắn.
- Giữ nguyên: ảnh 200px, chân C (Đổi ảnh / Xoá ảnh), chữ phụ `#5f6575`.
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1207/1207 ngoặc; jsdom → hộp thoại `position:fixed; display:grid; place-items:center; padding:16px`, thẻ `width:392px; max-width:100%; background:rgba(255,255,255,.78)` (tối `rgba(24,24,28,.78)`), `backdrop-filter:blur(24px) saturate(1.6)`, viền `.12`. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox).

**2026-11-18 | v3.5.454 | Arena.ai Agent sửa:**

- Lỗi: popup vẫn xám đục và **không canh giữa theo hộp thoại Cài đặt**. Đo trên ảnh người dùng (1920×1080, DPR 1.25): Cài đặt x 356→1631 (tâm 993,5 px ảnh = 794,8 CSS), popup x 684→1171 (tâm 927,5 px ảnh = 742 CSS) → popup lệch **~53 CSS px sang trái**.
- Nguyên nhân lệch: hộp thoại Cài đặt nằm trong vùng nội dung (lệch phải sidebar 60px, tâm ở `60 + (1536-60)/2 = 798`), còn `dialog` của popup do trình duyệt canh giữa **khung nhìn** (768) → hai tâm khác nhau.
- Nay: thêm `syncAvatarDialogOffset()` — đọc `getBoundingClientRect()` của Cài đặt lúc mở popup, ghi `--kp-avatar-dx` vào `#dashboardAvatarDialog`, thẻ dịch `transform:translateX(var(--kp-avatar-dx,0px))`; tính lại khi resize nếu popup đang mở; Cài đặt không mở thì `dx = 0`.
- Nguyên nhân xám: `::backdrop` phủ `rgba(0,0,0,.4)` lên chính tấm kính Cài đặt → mọi thứ thành xám, kính `.78` trên nền xám ra `#e4e4e6`. Nay backdrop chỉ còn `rgba(0,0,0,.14)` (tối `rgba(0,0,0,.3)`), không blur → Cài đặt phía sau vẫn sáng, popup thành tấm kính sáng nổi trên đó (kính `.78` + `blur(24px) saturate(1.6)` giữ nguyên).
- Không đổi: 392px, bo 16, ảnh 200px, bố cục chân C, chữ phụ `#5f6575`.
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1204/1204 ngoặc; số đo lấy trực tiếp từ ảnh người dùng. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox) — vị trí sau khi dịch và độ sáng của kính cần người dùng xem lại.

**2026-11-18 | v3.5.453 | Arena.ai Agent sửa:**

- Lỗi (ảnh người dùng): sau 3.5.452, **cả trang bạc màu** và thẻ popup **xám đục** — sửa càng sai.
- Nguyên nhân thật: 3.5.452 đặt `#dashboardSettingsDialog.kp-avatar-behind { opacity:.4 }`; vì hộp thoại Cài đặt là tấm kính phủ gần hết màn hình nên **giảm opacity của nó làm nhạt luôn cả trang phía sau**; cộng thêm nền `.58` → kính trắng `.78` nằm trên nền tối nên ra màu xám `#dbdbdb` (đo trên ảnh: thân thẻ 219,219,219; nền sau 76,73,93).
- Nay: **gỡ hẳn** class `kp-avatar-behind` (JS + CSS) → trang không còn bị bạc; `#dashboardAvatarDialog::backdrop` = **`rgba(0,0,0,.4)`, không blur — y hệt `#dashboardSettingsDialog::backdrop` (settings.css:225)** ở cả sáng và tối; giữ kính `::before` `.78` + `blur(24px) saturate(1.6)`.
- Chữ phụ trên nền kính được làm đậm lại cho dễ đọc: `.kp-avatar-meta` / `.kp-avatar-limit` / `.kp-avatar-close` từ `#8b91a0` → `#5f6575` (nền kính nhạt hơn nền trắng đặc nên chữ cũ chỉ còn ~2,3:1 tương phản).
- Giữ nguyên hình học thẻ (392px, bo 16, ảnh 200px, chân C).
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1203/1203 ngoặc; `grep` xác nhận không còn `kp-avatar-behind` trong cả `css` và `js`. **Chưa xác minh bằng mắt** — jsdom không tính được `::before`/`::backdrop`.

**2026-11-18 | v3.5.452 | Arena.ai Agent sửa:**

- Lỗi 1 (người dùng hỏi "tại sao có cái khung mờ phía sau?"): sau lưng popup **Ảnh hồ sơ** hiện một tấm chữ nhật mờ. Đó chính là **hộp thoại Cài đặt vẫn đang mở** phía dưới, bị `::backdrop` của popup làm mờ (`backdrop-filter: blur(6px)`) nên viền bo của nó hiện thành "khung".
- Nay: `#dashboardAvatarDialog::backdrop` chỉ **tối** như của Cài đặt (`rgba(0,0,0,.58)` sáng / `.66` tối), **bỏ `backdrop-filter`**; và khi mở popup, Cài đặt nhận class `kp-avatar-behind` (`opacity:.4`, chuyển 180ms) để lùi hẳn về sau — đóng popup thì gỡ class.
- Lỗi 2: thẻ popup nền đặc (`#fff` / `#1c1c26`). Nay là **kính mờ y hộp thoại Cài đặt**: lớp `::before` (`inset:0; z-index:-1; border-radius:inherit`) với `background: rgba(255,255,255,.78)` / `rgba(24,24,28,.78)` và `backdrop-filter: blur(24px) saturate(1.6)`; thẻ đặt `position:relative; isolation:isolate`, `background:transparent`, viền `rgba(0,0,0,.12)` / `rgba(255,255,255,.12)`; đường kẻ đầu/thân/chân đổi sang cùng màu viền `.12`.
- Giữ nguyên: kích thước 392px, bo 16px, ảnh xem trước 200px, bố cục chân C (Đổi ảnh / Xoá ảnh xếp dọc).
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1205 `{` / 1205 `}`; jsdom (sáng & tối) cho `.kp-avatar-card` `background:rgba(0,0,0,0)`, `position:relative`, `isolation:isolate`, viền `.12` đúng hệ màu. **Chưa xác minh bằng mắt**: jsdom không tính được style của `::before`/`::backdrop`, nên hiệu ứng kính và mức tối của nền cần người dùng xem lại.

**2026-11-18 | v3.5.451 | Arena.ai Agent sửa:**

- Lỗi: **đăng xuất ở sidebar** (menu hồ sơ) không đổi nhãn gói, trong khi đăng xuất trong Cài đặt thì đổi.
- Nguyên nhân: `applyMenuPlanBadge()` (gọi trong `renderProfileMenu`) luôn `SETTINGS_KIT.plan.apply()` — phát lại gói **đã biết cuối cùng** (ví dụ Ultra) kể cả khi đã đăng xuất. Đường đăng xuất trong Cài đặt thì tình cờ đúng vì `refreshDashboardSettings()` có sẵn `if (!demoProfile) SETTINGS_KIT.plan.set("free")`.
- Nay: `applyMenuPlanBadge()` rẽ nhánh — **chưa đăng nhập → `plan.set("free")`**, đã đăng nhập mới `apply()`; và `signOutDemoProfile()` đặt `plan.set("free")` ngay trước khi vẽ lại, nên nhãn về "Miễn phí" + kiểu xám khách lập tức, không phải chờ mở Cài đặt.
- Sửa luôn chiều ngược lại: `finishProfileAuth()` (đăng nhập) trước đây chỉ nạp `USAGE_STATUS` khi Cài đặt đang mở → đăng nhập từ sidebar sẽ hiện sai "Miễn phí". Nay luôn nạp, nên nhãn đúng gói ở mọi đường đăng nhập.
- File: `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra (tĩnh): `node --check` hợp lệ; `grep` xác nhận 3 điểm — `signOutDemoProfile` có `plan.set("free")`, `applyMenuPlanBadge` rẽ nhánh theo `demoProfile`, `finishProfileAuth` gọi `refreshUsageLimitSettings()` không điều kiện. Chưa chạy được UI (sandbox không có trình duyệt).

**2026-11-18 | v3.5.450 | Arena.ai Agent sửa:**

- **Sửa lỗi do 3.5.449 gây ra**: ở khung Cài đặt hẹp, nhãn "Ảnh hồ sơ" bị bóp còn ~40px nên chữ rơi mỗi dòng một từ, ảnh chồng lên chữ.
- Nguyên nhân: `css/dashboard/settings.css` có container query `@container kpset (max-width:520px)` đặt `.settings-account-controls { flex:1 1 100%; width:100% }`. Bản 3.5.449 chỉ đè `flex` mà **quên `width`**, nên khối ảnh rộng 100% → cột chữ co về 0.
- Nay đè đủ cả 5 thuộc tính bằng `!important` (an toàn bất kể độ ưu tiên/thứ tự file):
  - hàng: `flex-direction:row`, `align-items:center`, `justify-content:space-between`, `flex-wrap:nowrap`, `gap:12px`, `row-gap:0`
  - cột chữ: `flex:1 1 auto`, `width:auto`, `max-width:none`, `min-width:0`
  - khối ảnh: `flex:0 0 auto`, `width:auto`, `max-width:none`, `align-self:center`
- File: `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm chứng (computed style, jsdom + CSS thật): hàng ảnh `direction=row / wrap=nowrap / align=center / gap=12px`; cột chữ `flex 1/1/auto`, `width:auto`, `max-width:none`, `min-width:0`; khối ảnh `flex 0/0/auto`, `width:auto`, `max-width:none`. Ngoặc CSS cân 1202/1202, `git diff` chỉ +13/−9 dòng (không đụng phần khác).
- Vẫn **không chụp được ảnh** (sandbox thiếu `xvfb` + lib Chromium) — cần anh kiểm tra lại trên máy.

**2026-11-18 | v3.5.449 | Arena.ai Agent sửa:**

- Đổi nhãn dưới "Ảnh hồ sơ": “Bấm vào ảnh để xem, đổi hoặc xoá.” → **“Bấm vào ảnh để thay đổi.”** (en “Click the picture to change it.”, ko “사진을 클릭해 변경하세요.”); sửa cả chuỗi mặc định trong `pages/dashboard.html`.
- Responsive: ở màn hẹp, luật cũ `@media(max-width:520px) .settings-account-row{flex-direction:column}` làm **ảnh rơi xuống dưới nhãn**. Nay hàng Ảnh hồ sơ được miễn luật đó: luôn `flex-direction:row`, `align-items:center`, `flex-wrap:nowrap`, `gap:12px`; cột chữ `flex:1 1 auto; min-width:0` (nhãn phụ tự xuống dòng trong cột), ảnh `flex:0 0 auto` — ảnh luôn đứng cùng dòng bên phải. Các hàng Tài khoản khác **vẫn xếp dọc như cũ**.
- Luật đặt bằng selector có id (`#dashboardSettingsDialog …` và `#dashboardHighlightsNotesView #dashboardSettingsDialog …`) nên thắng luật `@media` cũ về độ ưu tiên, không phụ thuộc thứ tự file.
- File: `js/core/languages.js`, `pages/dashboard.html`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm chứng (computed style, jsdom, cả 2 nền): hàng ảnh `flexDirection=row`, `align=center`, `wrap=nowrap`, `gap=12px`; cột chữ `flex 1/1/auto`, `min-width:0`; ảnh `flex 0/0/auto`. `node --check languages.js` hợp lệ; ngoặc CSS cân 1200/1200.
- Vẫn **không chụp được ảnh** (sandbox thiếu `xvfb` + lib Chromium).

**2026-11-18 | v3.5.448 | Arena.ai Agent sửa:**

- Hàng **Ảnh hồ sơ** (Cài đặt → Tài khoản) giờ **chỉ còn ảnh**: bỏ nút "Thay đổi" và nút "Xoá ảnh" cũ, ảnh trở thành nút bấm (phóng nhẹ 1.04 + vòng sáng khi rê, có `aria-haspopup="dialog"`).
- Bấm ảnh mở **popup** (`<dialog id="dashboardAvatarDialog">`, class `kp-avatar-dialog`):
  - Trên: tiêu đề "Ảnh hồ sơ" + nút ✕ 38px (44px trên cảm ứng).
  - Giữa: ảnh lớn 200px tròn (160px khi màn ≤460px, 140px khi màn thấp ≤560px), dòng meta dữ liệu thật `JPG · <dung lượng> · Sửa <ngày>`, dòng "PNG hoặc JPG, tối đa 2 MB.".
  - Đáy: **kiểu C** — hai nút xếp dọc, mỗi nút rộng hết hàng, cùng cao 42px (46px cảm ứng), bo 10px, chữ 13.5px/650, icon 16px: **Đổi ảnh** (tím đặc `#7262df` / tối `#6f63e0`) ở trên, **Xoá ảnh** (nền đỏ nhạt, chữ `#c0393b` / tối `#f3a5a7`) ở dưới. Đáy cộng `env(safe-area-inset-bottom)`.
- Hành vi: **Đổi ảnh** = đóng popup rồi mở hộp chọn ảnh; chọn ảnh mới lưu kèm `avatarUpdatedAt`; **Xoá ảnh** = xoá `avatarDataUrl`, đóng popup, hiện toast **"Đã xoá ảnh hồ sơ." + Hoàn tác** (5 giây, dùng `SETTINGS_KIT.undo.show` nên bấm Hoàn tác là ảnh về nguyên). Đóng popup: ✕, `Esc`, bấm ra ngoài; đóng xong trả focus về ảnh.
- Dung lượng ảnh hiển thị được tính thật từ data URL (`avatarSizeLabel`), không phải số bịa.
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `js/core/languages.js` (thêm `accountProfilePictureChange/Limit/Empty/Updated`, sửa `accountProfilePictureHelp` cho 3 ngôn ngữ), `css/dashboard/dashboard.css` (bỏ CSS nút cũ 3.5.447, thêm CSS popup), `manifest.json`.
- Kiểm chứng (computed style, jsdom 29, nạp CSS thật + markup thật của trang):
  - Popup: bo 16px, nền `#fff` / `#1c1c26`, đệm đáy `calc(16px + env(safe-area-inset-bottom))`; ảnh 200×200 bo 50%.
  - Đáy: `display:grid`, `gap:8px`; hai nút đều cao 42px, chữ 13.5px/650; Đổi ảnh nền `#7262df` (tối `#6f63e0`) chữ trắng; Xoá ảnh nền `#fdf0f0`/`rgba(248,113,113,.12)`.
  - Hàng: ảnh trong trigger 40×40 (đúng khung Cài đặt).
  - `node --check` cả 2 file JS hợp lệ; ngoặc CSS cân 1195/1195; `grep` xác nhận không còn `settingsChangeProfilePicture` / `settingsRemoveProfilePicture` ở bất kỳ file nào.
- Vẫn **không chụp được ảnh** (sandbox thiếu `xvfb` + lib Chromium).

**2026-11-18 | v3.5.447 | Arena.ai Agent sửa:**

- Thêm cách **xoá ảnh hồ sơ** ngay trong UI: hàng "Ảnh hồ sơ" (Cài đặt → Tài khoản) có thêm nút **"Xoá ảnh"** cạnh nút "Thay đổi".
  - Chỉ hiện khi hồ sơ đang có ảnh tự chọn (`demoProfile.avatarDataUrl`); chưa có ảnh thì ẩn hẳn.
  - Kiểu nút "nhẹ": viền đỏ nhạt `#f0b4b4`, nền trắng, chữ `#c53030`; rê chuột `#fef2f2`/`#dc2626`; nền tối `#1a1a1d` / `#7f1d1d` / `#f2a3a5`. Không dùng nút đỏ đặc để tránh cảm giác nguy hiểm như "Xoá tài khoản".
  - Bấm = xoá đúng một trường `avatarDataUrl`, lưu lại hồ sơ, vẽ lại **cả** avatar trong Cài đặt và ở chân sidebar (về chữ cái đầu tên), hiện toast "Đã xoá ảnh hồ sơ." — không mất tên/email/ghi chú.
- Thêm 2 khoá dịch cho cả 3 ngôn ngữ: `accountProfilePictureRemove` (Remove picture / Xoá ảnh / 사진 삭제), `accountProfilePictureRemoved` (Profile picture removed. / Đã xoá ảnh hồ sơ. / 프로필 사진을 삭제했습니다.).
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check` 2 file JS hợp lệ; ngoặc CSS cân 1149/1149; nút nằm trong template `settingsAccountSignedInTemplate` (khách không thấy) và ẩn mặc định bằng `hidden`; trình xử lý click dùng uỷ quyền trên `#settingsAccountState` nên vẫn chạy sau khi vẽ lại.

**2026-11-18 | v3.5.446 | Arena.ai Agent sửa:**

- Lỗi "badge tối sai": luật nền tối cho nhãn Free (`html.dark #dashboardSidebar .reference-footer-button > .kp-plan-badge`, độ ưu tiên 1-3-1) **đè** luật Pro/Ultra (1-3-0), nên ở nền tối Pro/Ultra vẫn ra tím nhạt của Free. Đã buộc luật Free vào `[data-plan="free"]` → Pro/Ultra giữ đúng kiểu ở cả hai nền.
- Bóng đổ của Pro/Ultra phải `!important` vì luật cũ `.dashboard-profile-free-badge` đặt `box-shadow:none!important`.
- Avatar nền tối bị `html.dark .reference-avatar-letter{color:#a5a9ff}` nhuộm chữ/viền tím → thêm luật đè `color:#fff; border-color:#fff`.
- Vòng avatar Pro/Ultra viết bằng longhand (`outline-width/style/color`) thay vì `var(--kp-plan)` để không phụ thuộc biến.
- File: `css/dashboard/dashboard.css`, `manifest.json`.
- **Kiểm chứng bằng computed style** (jsdom 29, nạp đủ 13 file CSS theo đúng thứ tự trong `pages/dashboard.html`, dựng lại đúng markup sidebar + thẻ hồ sơ Cài đặt, đo 2 nền × 4 gói):
  - Nền tối Free: badge `rgba(165,169,255,.12)` / viền `rgba(165,169,255,.6)` / chữ `#b9b3ff` — **giống Cài đặt**.
  - Nền tối Pro: `linear-gradient(135deg,#f59e0b,#b45309)`, chữ trắng, bóng `0 2px 8px rgba(180,83,9,.3)`, avatar viền `#fbbf24` — **giống Cài đặt**.
  - Nền tối Ultra: `linear-gradient(135deg,#8b5cf6,#5b21b6)`, bóng `0 2px 8px rgba(109,40,217,.35)`, avatar `outline 2px #a78bfa` + quầng `rgba(139,92,246,.38)` — **giống Cài đặt**.
  - Nền sáng Pro: `#f59e0b→#b45309`, avatar `2px #d97706`; Ultra: `#8b5cf6→#5b21b6`, avatar `2px #7c3aed`.
- Vẫn **không chụp được ảnh** (sandbox thiếu `xvfb` + lib Chromium).

**2026-11-18 | v3.5.445 | Arena.ai Agent sửa:**

- Lỗi: Cài đặt đổi gói Pro/Ultra thì nhãn ở chân sidebar không đổi kiểu (vì nhãn đó là HTML tĩnh `data-plan="free"`, chỉ `#settingsProfilePlan` được cập nhật).
- Nay `SETTINGS_KIT.plan.set(id)` vẽ **cả hai nơi** từ cùng một bảng `PLANS`: `#settingsProfilePlan` và `#profileMenuTogglePlan` (cùng `data-plan`, cùng icon shield/bolt/crown, cùng chữ `usagePlanFree/Trial/KeyA/KeyB`), đồng thời gắn `data-plan` lên `.dashboard-reference-profile-wrap` để tô vòng avatar.
- Thêm `apply()` để `renderProfileMenu()` áp lại gói đã biết sau mỗi lần vẽ lại, và nạp `USAGE_STATUS` **một lần khi mở Dashboard** (trước đây chỉ nạp khi mở Cài đặt) → chân sidebar đúng gói ngay từ đầu.
- CSS: Pro (trial/keyA) = vàng `linear-gradient(135deg,#f59e0b,#b45309)`; Ultra (keyB) = tím `linear-gradient(135deg,#8b5cf6,#5b21b6)` + bóng `0 2px 8px rgba(109,40,217,.35)`, chữ trắng; avatar Pro/Ultra có `outline:2px solid var(--kp-plan)` + `outline-offset:2px`, Ultra thêm quầng `rgba(124,58,237,.32)` (tối `rgba(139,92,246,.38)`); biến `--kp-plan`: free `#7262df`, Pro `#d97706`, Ultra `#7c3aed` (tối `#a5a9ff` / `#fbbf24` / `#a78bfa`).
- File: `js/dashboard/settings-ui.js`, `js/dashboard/dashboard.js`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check` cả 2 file JS hợp lệ; ngoặc CSS cân 1145/1145; `git diff` xác nhận `set()` không còn `return` sớm khi thiếu `#settingsProfilePlan`. **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.444 | Arena.ai Agent sửa:**

- Sửa lại avatar chân sidebar cho **đúng màu / viền / kiểu của khung Cài đặt**, chỉ giữ kích thước 28px (3.5.443 mới đổi class nên vẫn bị viền tím 1px + nền tím nhạt của `.reference-avatar-letter` đè lên):
  - Đã đăng nhập: nền **#7262df**, chữ trắng, bóng trong `inset 0 2px 5px #0002` (đúng `.profile-avatar`).
  - Khách: viền **2px solid #cbd5e1**, nền trong suốt, icon xám **#71717a**; tối: viền **#55555c**, icon **#a1a1aa**.
- Nhãn "Miễn phí" dùng đúng bảng màu `.kp-plan-badge[data-plan="free"]`: đã đăng nhập sáng `#b9b3ff`/`#f2efff`/`#6b5ce0`, tối `rgba(165,169,255,.6)`/`rgba(165,169,255,.12)`/`#b9b3ff`; khách xám `#aab4c3`/`#f1f5f9`/`#475569` (tối `rgba(255,255,255,.28)`/`rgba(255,255,255,.06)`/`#d0d0d4`), cao 21px, bo tròn 999px.
- File: `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): ngoặc `{}` cân 1134/1134; 3 khối luật mới nằm cuối file nên thắng `.reference-avatar-letter` (1 id + 3 class so với 1 id + 1 class). **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.443 | Arena.ai Agent sửa:**

- Avatar và badge ở chân sidebar Dashboard nay dùng đúng thành phần của khung **Cài đặt**: avatar là `.profile-avatar .profile-avatar-guest` (khách: viền nét đứt + icon người; đã đăng nhập: ảnh đại diện qua `profilePictureMarkup`) thay cho chữ cái "B"; badge dùng `.kp-plan-badge[data-plan]` với đúng bảng màu của Cài đặt (sáng `#b9b3ff`/`#f2efff`/`#6b5ce0`, tối `rgba(255,255,255,.14)`/`rgba(255,255,255,.06)`/`#a5a9ff`).
- `renderProfileMenu()` cập nhật avatar giống `refreshSettings()` (cùng hàm `profilePictureMarkup`, cùng SVG khách) nên hai nơi không lệch nhau nữa.
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check js/dashboard/dashboard.js` hợp lệ; `grep reference-avatar-letter` còn đúng 1 chỗ dùng kèm `profile-avatar profile-avatar-guest`; badge có `kp-plan-badge` + `data-plan="free"`. **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.442 | Arena.ai Agent sửa:**

- Icon tab Ghi chú trong sidebar Dashboard: dùng **đúng icon "npen" của thanh Keepit trên trang web** (`js/content/keepit-bar.js`, `ICONS.npen` — sổ có gáy xoắn + bút), thay cho hình em tự vẽ ở 3.5.441. Thanh tab dưới ở mobile (`responsive-nav.js`) lấy icon từ sidebar nên cũng thành npen theo.
- File: `pages/dashboard.html`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `grep "M21.378 5.626"` (đoạn path đặc trưng của npen) có trong `pages/dashboard.html` và `js/content/keepit-bar.js`; không còn path của icon tự vẽ. **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.441 | Arena.ai Agent sửa:**

- Đổi nhãn tab sidebar "Ôn tập Flashcards" → **"Flashcards"** (`pages/dashboard.html` + `js/core/languages.js`: en/vi "Flashcards", ko "플래시카드").
- Đổi icon tab **Ghi chú** từ hình *bình thí nghiệm* (flask, không liên quan) sang **sổ + bút** (notebook-pen). Rà lại 6 icon còn lại: Tổng quan = lưới 4 ô, Chép chính tả = tai nghe, Flashcards = chồng thẻ, Tài liệu = tệp có dòng chữ, Thùng rác = thùng rác, Giao diện = mặt trời/mặt trăng — giữ nguyên vì đã đúng nghĩa.
- File: `pages/dashboard.html`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check js/core/languages.js` hợp lệ; `grep "Ôn tập Flashcards"` trong `pages/` và `js/core/` không còn ở nhãn tab (chỉ còn chuỗi `ovActivityFlashcards` của dòng hoạt động ở Tổng quan). **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.440 | Arena.ai Agent sửa:**

- Sửa nháy sáng viền khung khi đổi Sáng/Tối ở tab Chép chính tả và Ghi chú: các thẻ ở 2 tab này khai báo `transition:border-color .2s` (`.dictation-root .session-card`, `.search-row`, `.hl-card`…), nên lúc đổi nền, viền chạy mờ dần từ màu sáng sang màu tối và bị thấy như "nháy sáng"; tab Tổng quan và Tài liệu không khai báo transition viền nên đổi tức thì, không nháy.
- Cách sửa: thêm class `dashboard-theme-switching` trên `<html>` trong `toggleDashboardTheme()` (bỏ sau 2 khung hình + 60ms) và CSS tắt transition cho **mọi** phần tử khi class này có mặt; đồng thời mở rộng luật `dashboard-theme-pending` từ "chỉ sidebar + Tổng quan" thành toàn bộ cây DOM.
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check js/dashboard/dashboard.js` hợp lệ; `grep dashboard-theme-switching` thấy đúng 2 chỗ thêm/xoá class và 3 selector CSS. **Chưa quay lại được bằng ảnh** (sandbox mất `xvfb-run` + lib Chromium, không có root).

**2026-11-18 | v3.5.439 | Arena.ai Agent sửa:**

- Tiếp tục dọn navy: các mã **dùng chung cho cả 2 nền** (`#111827`, `#172033`, `#1e293b`, `#1f2937`, `#334155`, `#374151`, `#94a3b8`, `#64748b`, `#cbd5e1`, `#e2e8f0`, `#f1f5f9`…) trước đây bị bỏ qua nên trong rule `html.dark` vẫn còn navy — thấy rõ ở thanh lọc Highlights & Notes, khung Settings, hộp Study. Nay chỉ sửa **bên trong rule `html.dark`** (không đụng rule nền sáng): 453 chỗ.
- Thay 122 chuỗi `rgba()` ánh xanh (`rgba(15,23,42)`, `rgba(17,24,39)`, `rgba(17,26,43)`, `rgba(17,25,40)`, `rgba(31,41,55)`, `rgba(30,41,59)`, `rgba(2,6,23)`) bằng xám/đen trung tính.
- File: `css/dashboard/*.css` (8 tệp), `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): quét lại toàn bộ `css/dashboard/*.css` — **0** mã navy và **0** `rgba` ánh xanh còn trong rule `html.dark`; ngoặc `{`/`}` cân bằng ở cả 11 tệp. **Chưa chụp ảnh được** vì sandbox mất `xvfb-run` + lib Chromium và không có quyền root; `qa/palette436.js` chạy lại được ngay khi môi trường có xvfb.

**2026-11-18 | v3.5.438 | Arena.ai Agent sửa:**

- Sửa tiếp hệ quả của bước quét màu: icon loại tệp trong Thùng rác (tối) đã bị đổi — Word mất nền xanh `#14233f`/`#9db6ff` thành nền xám + icon tím, lệch với icon Word ở nền sáng (vẫn xanh `#e9f0fd`/`#2f6fe4`). Đã khôi phục nguyên bản: `.kind-docx` `#14233f`/`#9db6ff`, `.kind-web` `#25264a`/`#b9b3ff`.
- File: `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: `git diff 080bad8^ -- css/dashboard/trash.css | grep trash-ico` → **rỗng**, tức 7 rule màu icon trong Thùng rác đã giống hệt bản 3.5.433 trước khi sửa. **Chưa chụp ảnh được**: sandbox sau reset mất `xvfb-run` và các lib Chromium (`libnspr4.so`), không có quyền root để cài lại; `qa/trashico438.js` đã viết sẵn, chạy lại khi môi trường có xvfb.

**2026-11-18 | v3.5.437 | Arena.ai Agent sửa:**

- Sửa lỗi ở 3.5.436: bước quét màu đã đổi **cả họ tím** (hero `#5144a7/#43388e/#342a78` → `#4a3f8a/#403679/#332a66`), nên khối tím nhạt đi và lệch màu cũ. Đã khôi phục nguyên vẹn toàn bộ hex họ tím (hero Tổng quan + Chép chính tả, chip, nền tím đậm), chỉ giữ phần đổi navy → đen trung tính và xanh dương nhấn → tím.
- Quét lại có kiểm soát: 64 mã navy/xám-xanh trong rule `html.dark` (trước là 117 mã, gồm cả tím). Hero tối trở lại `linear-gradient(112deg,#5144a7 0%,#43388e 47%,#342a78 100%)`, hero sáng giữ `#a999fa/#8d7aee/#7563e4`.
- File: `css/dashboard/*.css` (10 tệp), `manifest.json`.
- Kiểm tra: `qa/palette437.js` (1512×950) — sáng nền `rgb(233,237,244)`, sidebar `rgb(255,255,255)`, thanh trên `rgba(255,255,255,.72)`+blur; tối nền `rgb(0,0,0)`, sidebar `rgb(13,13,15)`, thanh trên `rgba(13,13,15,.72)`+blur; điểm ảnh hero tối `(78,65,161)` khớp lại dải `#5144a7`; `errors []`. Ảnh `shots380/pal437-{light,dark}-1512.png`.

**2026-11-18 | v3.5.436 | Arena.ai Agent sửa:**

- Áp bảng màu của demo v13 vào Dashboard: nền sáng `#e9edf4` + mặt trắng `#ffffff`, nền tối **đen tuyệt đối** `#000000` + mặt `#0d0d0f`, viền tối `#232327`/`#2b2b30`, nhấn **tím** (`#7262df` sáng, `rgba(143,134,242,.16)` + `#a5a9ff` tối).
- Sidebar = đúng màu khung thẻ ở cả 2 nền (sáng `#ffffff`, tối `#0d0d0f`), mục đang chọn tím thay vì xanh.
- Thanh trên dùng chung thành **kính mờ** `rgba(255,255,255,.72)` / `rgba(13,13,15,.72)` + `blur(12px) saturate(1.4)` như demo v13 (trước là đặc).
- Quét màu navy khỏi toàn bộ `css/dashboard/*.css`: 606 chỗ / 117 mã màu trong rule `html.dark` (navy → đen trung tính, xanh dương nhấn → tím), thêm khối token `--lhn-ui-*` theo nền ở cuối `dashboard.css`.
- File: `css/dashboard/{dashboard,overview,dictation,dictation-stats-popup,documents,documents-library,highlights-notes-embedded,responsive,settings,trash}.css`, `manifest.json`.
- Kiểm tra: `qa/palette436.js` (1512×950) — sáng nền `rgb(233,237,244)`, sidebar `rgb(255,255,255)`, thanh trên `rgba(255,255,255,.72)` + blur; tối nền `rgb(0,0,0)`, sidebar `rgb(13,13,15)`, thanh trên `rgba(13,13,15,.72)` + blur; `errors []`. `qa/palette436m.js` (390×844, tối bật qua `lhnSettings.sidebarTheme`): đệm 16/16, màu đúng, `errors []`. Ảnh: `shots380/pal436-{light,dark}-{1512,390}.png`.
- Chưa kiểm: cảm giác dùng thật, các hộp thoại ít dùng (Study/PDF), trang Tài liệu mở tệp.

**2026-11-18 | v3.5.433 | Arena.ai Agent sửa:**

- Đệm 2 bên thống nhất: `clamp(16px,3vw,32px)` cho cả 5 route (`#dashboardOverviewView`, `#dashboardDictationView`, `#dashboardHighlightsNotesView`, `#dashboardDocumentsView .dlib`, `#dashboardTrashView`) và cho thanh tiêu đề dùng chung `#dashboardSharedTopbarPortal`; trước đây là 42/42, 42/45, 33,26/33,26, 42/42, 42/42.
- Trước đây: đệm lệch giữa các tab (Ghi chú 33,26px trong khi các tab khác 42px) và thanh tiêu đề có đệm riêng (44px cho Tài liệu) nên mép nội dung không thẳng cột.
- Nhớ vị trí cuộn: `dashboardScrollTargetForView()` giờ hỏi DOM — route nào tự cuộn được thì lấy chính nó, còn lại dùng `#dashboardScroller`; vì vậy Tổng quan/Chép chính tả hết bị lưu sai phần tử cuộn.
- Sửa lỗi tải lại trang làm mất chỗ cuộn của Tài liệu (thư viện dựng muộn): thêm `scheduleDashboardScrollRestore()` thử lại từng khung hình (tối đa ~4s) cho tới khi `scrollTop` đúng.
- Sửa lỗi mở thẳng tab Thùng rác bị trống danh sách: `dashboard-trash.js` nạp sau `dashboard.js` nên `mount()` chưa tồn tại — thêm `mountDashboardTrash()` thử lại 60 nhịp × 30ms.
- Kiểm bằng `qa/sync433.js` (1512×950 và 390×844): 5 tab đệm đúng, 4 tab cuộn 400→400 sau khi đổi tab và sau reload, `errors []`.
- Dọn tài liệu (không đổi code/giao diện): `AGENTS.md` rút 151 → 86 dòng (17.402 → 8.588 ký tự) — mục 3.3/3.4 còn 2 dòng, mục 4.2 gộp mẫu nhật ký thành 1 dòng, mục 4.4 chỉ còn cách đóng ZIP (phần CRX/khoá chuyển sang mục 5 "Không được làm"), mục 4.2.1 còn 1 dòng trỏ, bỏ mục "Đường dẫn" rồi đánh số lại 1–6.
- Tách quy tắc khỏi `AGENTS.md` thành tài liệu thật: tạo `docs/code-rules.md` (tìm file, cây thư mục, nhãn i18n, màu theme, cấm khối vá `/* v3.5.xxx */`, không `legacy`, cách tách file); quy ước viết trang module + cập nhật 2 bảng mục lục chuyển vào `docs/INDEX.md` mục «Quy ước viết trang module»; thêm dòng `code-rules.md` vào bảng mục lục.
- File: `AGENTS.md`, `PROJECT.md`, `docs/INDEX.md`, `docs/code-rules.md` (mới).
- Kiểm tra: đối chiếu từng dòng bị bỏ để không mất quy tắc (mỗi phần rút đều để lại dòng trỏ hoặc sang `docs/`); ZIP dựng lại và so SHA-256 từng tệp với repo — khớp toàn bộ. Không có thay đổi giao diện nên không có ảnh QA mới.

**2026-11-17 | v3.5.432 | Arena.ai Agent sửa:**

- Sửa theo ảnh chụp của người dùng (thư viện mới khác bản cũ ở vài chỗ): dùng **đúng bảng token của trang Tài liệu** thay vì ánh xạ sang `--lhn-ui-*`; thêm `font:14px/1.45` cho khối (Dashboard đặt 12px nên mọi chữ nhỏ hơn); bỏ kiểu nút toàn cục của Dashboard trong phạm vi thư viện (`padding:10px 13px`, chữ 13px/600 làm nút xoá/"Mở" dày và đậm hơn); bổ sung các rule đã thiếu (`.thumb.image*`, `.card .thumb .pg img`, `.card .thumb .pg .fileFallback`, `.imageMeta`, `.fileSelectButton`, `html.dark .hero`) và bỏ gradient xanh tự chế cho ảnh; chặn `html.dark p{…!important}` / `html.dark h1…` của `ui-theme.css` làm chữ trắng trong khối tím bị xám ở chế độ tối; sửa icon mũi tên 18px → 13px (rule `.dlib svg.i` đè `.go svg`).
- Kiểm lại: `qa/diff431.js` so từng phần tử giữa thư viện cũ (`documents.html`) và mới ở sáng + tối — chỉ còn khác bề rộng do Dashboard có sidebar (`.card` 525→416px), còn màu/cỡ chữ/bo góc/viền/khoảng đệm giống hệt; nút "Mở" 89×28 với icon 13px, nút xoá 30×30/icon 15px như cũ; `qa/lib431.js` 1512 và 390 vẫn `errors []`.

**2026-11-17 | v3.5.431 | Arena.ai Agent sửa:**

- Bản 1 của việc đưa Tài liệu về cùng một kiểu UI với các tab khác: **thư viện tài liệu vẽ trong Dashboard** (`js/dashboard/documents-library.js`, `css/dashboard/documents-library.css`), đọc thẳng kho `keepit-documents` như tab Thùng rác; thẻ/lưới/tìm/lọc/sắp xếp/thống kê/"Đọc tiếp"/nút xoá dùng toast chung của Dashboard. Khung iframe **ẩn khi không xem tệp** và chỉ còn nhiệm vụ xem tệp (`html.dash-embedded-library .app{display:none}`), nhận lệnh `KEEPIT_DOCUMENTS_OPEN` / `KEEPIT_DOCUMENTS_IMPORT_FILES` từ Dashboard và trả `KEEPIT_DOCUMENTS_IMPORTED`. CSS thư viện giữ nguyên giá trị gốc nhưng ánh xạ token sang `--lhn-ui-*` trong phạm vi `#dashboardDocumentsView` nên sáng/tối theo Dashboard.
- File: `js/dashboard/documents-library.js` (mới), `css/dashboard/documents-library.css` (mới), `js/dashboard/documents.js`, `js/dashboard/dashboard.js`, `pages/dashboard.html`, `css/dashboard/documents-host.css`, `css/dashboard/documents.css`, `docs/documents.md`, `docs/modules/dashboard.md`, `manifest.json`, `PROJECT.md`.
- Sửa thêm trong cùng bản: `resizeDashboardDocumentsFrame()` bỏ đo chiều cao khi khung ẩn (khung ẩn không có `documentElement` → ném `scrollHeight` null); `qa/smoke431.js` chuyển 7 lượt qua lại các tab, `errors []`.
- Kiểm tra: `qa/lib431.js`, `qa/lib431b.js` 1512×950 và 390×844 — 3 tài liệu trong kho hiện 3 thẻ, `count`/chip/thống kê đúng, thẻ `18px`, viền `#e2e8f0`/nền `#fff` (tối `#2b3a52`/`#111a2b`), nút xoá 30×30 cùng token thẻ Chép chính tả; mở tệp 68/17/21 ms và 50/16/18 ms, khung **không nạp lại** (navigation = 1), viewer phủ toàn màn hình rồi đóng sạch; xoá thẻ → toast Dashboard `<dialog>` "Đã chuyển vào Thùng rác + Hoàn tác" (13px/600, radius 10px, y=66), Ctrl+Z → thẻ trở lại; Thùng rác hiện hàng tài liệu, Khôi phục → thư viện về 3 thẻ; `errors []`. Nhập tệp hiện chuyển File cho khung xử lý (thanh tiến trình native ở Bản 2).
- Tiếp theo: Bản 2 (nhập tệp native + bỏ thư viện trong khung), rồi "Nói" trong Thùng rác.

**2026-11-17 | v3.5.430 | Arena.ai Agent sửa:**

- Toast của khung Tài liệu (xoá tài liệu, khôi phục…) dùng chung toast của Dashboard nên giống các tab khác: `documents.js` gửi `KEEPIT_DOCUMENTS_TOAST` lên trang cha khi nhúng; Dashboard hiện toast của mình và giữ Hoàn tác qua `KEEPIT_DOCUMENTS_TOAST_RUN` trả về khung (nên Ctrl+Z vẫn chạy hành động trong khung).
- File: `js/dashboard/documents.js`, `js/dashboard/dashboard.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/docstoast430.js` 1512×950 và 390×844 — xoá tài liệu trong khung → toast `<dialog>` ở đỉnh Dashboard "Đã chuyển vào Thùng rác + Hoàn tác" (13px/600, radius 10px, cùng phần tử như tab Thùng rác), toast riêng trong khung **không** hiện, thẻ biến mất; Ctrl+Z → thẻ trở lại + toast "Đã đưa lại vào thư viện"; `errors []`.
- Tiếp theo: "Nói" vào Thùng rác.

**2026-11-17 | v3.5.429 | Arena.ai Agent sửa:**

- Sửa nút xoá trên thẻ Chép chính tả cho giống thẻ Tài liệu: 30×30, đứng **trước** nút "Tiếp tục", viền/nền theo token Dashboard (`--lhn-ui-border/surface/muted`) thay cho `--line/--surface/--muted` của khung Tài liệu (biến không tồn tại ở Dashboard nên dark mode ra khung trắng), bỏ rule mobile tự tăng 34px, thêm biến thể tối/hover tối.
- File: `js/dashboard/dashboard.js`, `css/dashboard/dictation.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/dictui429.js` 1512×950 và 390×844 — nút 30×30, thứ tự `last-practiced → cardDel → resume-link`, sáng `#fff/#e2e8f0/#64748b`, tối `#111a2b/#2b3a52/#a4b3c3`; ảnh cắt footer sáng/tối đã đối chiếu; `errors []`.
- Tiếp theo: "Nói" vào Thùng rác.

**2026-11-17 | v3.5.428 | Arena.ai Agent sửa:**

- Chép chính tả vào Thùng rác: mỗi phiên trong `dictation:session-index:v1` có `deletedAt`; phiên bị xoá mềm biến mất khỏi Lịch sử Dictation (kể cả thẻ "Tiếp tục" và thống kê Overview) và hiện trong Thùng rác.
- Thẻ buổi học có nút chuyển vào Thùng rác (giống nút trên thẻ Tài liệu): xác nhận → toast "Đã chuyển vào Thùng rác" + Hoàn tác.
- Thùng rác: hàng mới cho Chép chính tả (icon tai nghe của app, tím-hồng `kind-dictation`), chip "Chép chính tả" đã nối, dòng phụ "host · đã giải / tổng câu · xoá ngày"; khôi phục bỏ `deletedAt`, xoá vĩnh viễn bỏ khỏi chỉ mục và Ctrl+Z chèn lại; dọn tự động sau 30 ngày.
- File: `js/overlay/study/session-index.js`, `js/dashboard/dashboard.js`, `js/dashboard/dashboard-trash.js`, `css/dashboard/trash.css`, `css/dashboard/dictation.css`, `docs/modules/overlay.md`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/dict428.js` 1512×950 và 390×844 — 2 thẻ → xoá 1 còn 1 thẻ + toast; Thùng rác 1 hàng `kind-dictation` "example.com · 4 / 10 câu"; chip lọc 1 hàng; Khôi phục → 0 hàng, `deletedAt 0`, 2 thẻ trở lại; xoá vĩnh viễn → 1 phiên trong chỉ mục, toast + Hoàn tác; Ctrl+Z → 2 phiên; bấm thân thẻ không xoá; `errors []`. `qa/undo424.js` không hồi quy.
- Tiếp theo: "Nói" vào Thùng rác.

**2026-11-17 | v3.5.427 | Arena.ai Agent sửa:**

- Sửa lệch trạng thái chọn trong Thùng rác khi ghi chú được gộp theo trang: `selected` chỉ lưu id bản ghi thật (id ghi chú/tài liệu), không lưu `page:<url>`.
- Ô chọn của hàng trang suy ra từ các ghi chú con: đủ → ✓, một phần → gạch ngang (`indeterminate`), không có → trống; tick/bỏ tick ở hàng trang áp cho mọi ghi chú của trang.
- Bộ đếm "Đã chọn N" và ô "Chọn tất cả" tính theo số ghi chú thật, không theo số hàng.
- Nút Khôi phục/Xoá vĩnh viễn trên hàng trang khi trang đang chọn một phần chỉ tác động các ghi chú đang tick (phương án B người dùng chọn); trang không chọn gì thì tác động cả trang.
- File: `js/dashboard/dashboard-trash.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/sel427.js` trên extension unpacked 1512×950 và 390×844 — tick trang → 3 con tick, "Đã chọn 3", Chọn tất cả thành một phần; bỏ tick 1 con → hàng trang gạch ngang, "Đã chọn 2"; bấm Khôi phục trên hàng trang → chỉ 2 ghi chú về Ghi chú, còn 1 trong Thùng rác, toast "Đã khôi phục 2 mục"; Chọn tất cả → ✓; `errors []`.
- Tiếp theo: "Chép chính tả" rồi "Nói" vào Thùng rác.

**2026-11-17 | v3.5.426 | Arena.ai Agent sửa:**

- Hàng gộp ghi chú theo trang dùng **icon web (quả địa cầu)** thay cho icon ghi chú, để phân biệt hàng trang với hàng ghi chú lẻ; path lấy đúng `ICONS.globe` app đang dùng ở thanh Keepit, màu mới `kind-web` (tím `#5a4bd0` / tối `#b9b3ff`).
- File: `js/dashboard/dashboard-trash.js`, `css/dashboard/trash.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/trash425.js` 1512×950 — `groupIsWeb true`, `sameAsNote false`, hàng lẻ `kind-note`, hàng trang `kind-web`; hiệu ứng 0→178px, khôi phục 3 mục + toast, Ctrl+Z hoàn tác 1→2 hàng, `errors []`; ảnh sáng/tối đã xem.
- Tiếp theo: "Chép chính tả" rồi "Nói" vào Thùng rác.

**2026-11-17 | v3.5.425 | Arena.ai Agent sửa:**

- Thùng rác: ghi chú của cùng một trang nguồn gộp thành một hàng (`page:<url>`), trang chỉ có 1 ghi chú vẫn là hàng riêng.
- Hàng trang: chevron nằm sau tên trang (trong cột tên, trước 2 nút), bấm vào thân hàng để mở/đóng, chỉ trừ ô chọn và 2 nút Khôi phục/Xoá vĩnh viễn; nút ghi "Khôi phục" (bỏ chữ "cả trang").
- Hiệu ứng mở/thu gọn bằng `max-height` 0,26s + mờ dần + chevron xoay; tôn trọng `prefers-reduced-motion`; `flex: none` để không bị co trong danh sách cuộn ở 390.
- Công tắc "Xem từng ghi chú" (`#trashExpandAll`, dùng `.settings-switch` sẵn có) mở/đóng tất cả hàng trang, chỉ hiện khi có hàng trang.
- Icon hàng trang lấy `kindOf()` của chính ghi chú (giống icon ghi chú trong app), không thêm icon riêng.
- Hàng trang đại diện nhiều bản ghi: Khôi phục / Xoá vĩnh viễn / chọn tất cả / hoàn tác đều mở rộng ra id ghi chú thật; "Chọn tất cả" bỏ qua hàng con.
- File: `js/dashboard/dashboard-trash.js`, `css/dashboard/trash.css`, `pages/dashboard.html`, `js/core/languages.js` (en/vi/ko: trashRestorePage, trashPageNotes, trashExpandNotes, trashCollapseNotes, trashShowAllNotes), `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/trash425.js` trên extension unpacked 1512×950 và 390×844 — icon trùng hàng ghi chú (`sameAsNote true`), chevron `gapPx 6` / trong cột tên, mở 0→178px (1512) và 0→436px (390) rồi `maxHeight none`, đóng về 0, ô chọn không mở hàng, công tắc mở 3 ghi chú, "Khôi phục" 3 mục quay lại Ghi chú với toast, xoá vĩnh viễn cả trang + Ctrl+Z hoàn tác 1→2 hàng, `errors []`; `qa/undo424.js` vẫn đạt (không hồi quy).
- Tiếp theo: "Chép chính tả" rồi "Nói" vào Thùng rác.

**2026-11-17 | v3.5.424 | Arena.ai Agent sửa:**

- Bốn yêu cầu của người dùng: (1) **xoá vĩnh viễn cũng có Hoàn tác**, (2) **khôi phục cũng có toast**, (3) **Ctrl+Z = hoàn tác**, (4) đổi tên mục **"Tô sáng & Ghi chú" → "Ghi chú"**.
- (1) `purgeForever()` trong Thùng rác đọc trước khi xoá: Tài liệu giữ `meta` + blob trong `files` + `translations`; Ghi chú giữ nguyên bản ghi (cùng `id`, `review`, anchor). Xoá xong hiện toast "Đã xoá vĩnh viễn {count} mục" + **Hoàn tác** (6s) → ghi lại đúng bản ghi cũ vào Thùng rác (không phải về thư viện), `deletedAt` còn nguyên. Áp dụng cho xoá lẻ, xoá nhiều (đã chọn) và **Dọn sạch thùng rác**. Ghi chú được ghi lại qua message mới `TRASH_NOTES_INSERT` (`ANNOTATIONS.putMany`) để không mở IndexedDB của background từ dashboard (luật v3.5.406).
- (2) Khôi phục từ Thùng rác giờ báo toast "Đã khôi phục {count} mục" (trước đây im lặng), kèm đọc lại dung lượng trống.
- (3) Ctrl+Z (và Cmd+Z trên macOS) chạy đúng hành động Hoàn tác đang hiện trên toast: `KeepitUndo` trong `dashboard.js`, đăng ký tự động mỗi khi toast có action, hết 6s thì huỷ; bỏ qua khi con trỏ đang ở input/textarea/contenteditable, bỏ qua Ctrl+Shift+Z. Khung Tài liệu (iframe) đăng ký và tự xử lý Ctrl+Z trong frame nên phím chạy cả khi focus nằm trong Tài liệu.
- (4) `ovMenuHighlightsNotes` đổi thành **Ghi chú / Notes / 메모** (nav, breadcrumb, aria-label, tiêu đề trang H&N, ô Bắt đầu nhanh); 2 chỗ chữ tĩnh trong HTML cũng cập nhật.
- File: `js/dashboard/dashboard.js` (`KeepitUndo`, `registerUndo/runPendingUndo`, keydown Ctrl+Z, toast đăng ký undo), `js/dashboard/documents.js` (đăng ký undo với parent + Ctrl+Z trong frame), `js/dashboard/dashboard-trash.js` (`purgeForever`, `snapshotDocument`/`restoreDocument`, toast khôi phục, đọc lại quota), `js/background/annotations.js` (`putMany`), `js/background/background.js` (`TRASH_NOTES_INSERT`), `js/core/languages.js` (`trashPurgeDone`, `trashPurgeUndone`, `trashRestoreDone`, đổi tên mục), `pages/dashboard.html`, `pages/highlights-notes.html`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512×950 và 390×844 (vi) — xoá vĩnh viễn 1 Tài liệu: toast "Đã xoá vĩnh viễn 1 mục" + Hoàn tác (`hit:"toastAction"`, bấm chuột thật) → hàng về lại Thùng rác, blob 4096 byte trong `files` được ghi lại (`hasBlob:true`); xoá vĩnh viễn lần nữa rồi **Ctrl+Z** → 1 → 2 hàng; khôi phục 1 mục → toast "Đã khôi phục 1 mục"; xoá ghi chú ở màn Ghi chú rồi Ctrl+Z → 2 → 1 → 2, toast "Đã đưa lại ghi chú"; xoá tệp trong khung Tài liệu rồi Ctrl+Z trong frame → 0 → 1 thẻ; nhãn nav và aria = "Ghi chú"; 0 lỗi console. Ảnh: `undo424-1512-{trash,purge-toast,purge-undo,restore-toast,doc-ctrlz}.png`, `undo424-390-*.png`.
- Chưa làm: gộp Ghi chú trong Thùng rác theo **trang nguồn** (đang bàn, xem mục 2).
- Tiếp theo: gộp/khôi phục theo trang cho Ghi chú, rồi nối **Chép chính tả** và **Nói** vào Thùng rác.

**2026-11-17 | v3.5.423 | Arena.ai Agent sửa:**

- Phần 2 của việc "triển khai Thùng rác vào app": **Ghi chú (tô sáng/annotation) vào cùng Thùng rác**, xoá mềm 30 ngày như Tài liệu. Bản ghi thêm `deletedAt`; mọi đường đọc (`GET_ALL`, `GET_BATCH`, `GET_PAGE`) đều ẩn bản ghi đã xoá, nên H&N, Flashcards, Tổng quan, JSON backup và tô sáng trên trang web tự động không thấy mục trong Thùng rác.
- Xoá ghi chú giờ là **chuyển vào Thùng rác**: toast có nút **Hoàn tác** (bấm là khôi phục đúng bản ghi + vẽ lại tô sáng trên tab đang mở qua `RESTORE_HIGHLIGHTS`), giữ 6s. Áp dụng cho nút xoá trên card H&N, "Xoá tất cả tô sáng trên trang này", và nút xoá trong tooltip/sidebar trên trang web (cùng message `DELETE`). Bỏ tim một từ trong từ điển vẫn xoá hẳn (`hard:true`) vì đó là bật/tắt, không phải xoá.
- Thùng rác nhận thêm loại **Ghi chú**: cùng một danh sách, icon giấy bút màu hổ phách, dòng phụ `tên miền · ghi chú · thêm ngày · xoá ngày`, tìm kiếm theo cả quote/nội dung; chip "Ghi chú" hiện số thật thay vì "sắp có"; khôi phục/xoá vĩnh viễn/Chọn tất cả/Dọn sạch đều chạy đúng theo từng loại (Tài liệu đi thẳng IndexedDB, Ghi chú đi qua message tới background — đúng luật v3.5.406).
- Sweep khi mở app dọn cả ghi chú quá 30 ngày (`TRASH_NOTES_SWEEP`), không chỉ Tài liệu.
- Sửa kèm 1 lỗi thật phát hiện khi kiểm tra: toast của dashboard là `<dialog>` **non-modal** nên không nằm ở top layer — nó bị thanh topbar sticky (z-index 30) che và nút Hoàn tác **không bấm được** (elementFromPoint trả về topbar). Đã cho `dialog#toast` `z-index:2147483000` và hạ xuống dưới topbar (`top:66px`); toast cũng không còn cướp focus (dialog tự focus nút → hiện viền focus).
- Màu: light toast trắng chữ đậm + nút `#4338ca`; dark toast `#172338` chữ sáng + nút `#c7d2fe` (bản đầu để `#4338ca` trên nền tối, đo được độ tương phản ~1.6:1 — không đọc được).
- File: `js/background/annotations.js` (softDelete/softDeletePage/listTrashed/restoreMany/purgeMany/purgeExpiredTrashed + lọc `deletedAt`), `js/background/background.js` (`DELETE` xoá mềm, `DELETE_PAGE` xoá mềm, `TRASH_NOTES_LIST/RESTORE/PURGE/SWEEP`), `js/dashboard/dashboard.js` (toast có action, `restoreTrashedNotes`, broadcast `RESTORE_HIGHLIGHTS`, focus không bị cướp), `js/dashboard/dashboard-trash.js` (loại Ghi chú, phân loại khôi phục/xoá), `css/dashboard/dashboard.css` (`.toastAction`, z-index/toạ độ toast), `css/dashboard/trash.css` (icon `kind-note`), `js/core/languages.js` (`trashUndo`, `noteMovedToTrash`, `noteRestored`, `notesRestored`, `noteRestoreFailed` en/vi/ko; sửa lời xác nhận xoá thành "chuyển vào Thùng rác, khôi phục được trong 30 ngày"), `js/content/content.js` (bỏ tim từ điển = xoá hẳn), `manifest.json`.
- Kiểm tra: Playwright extension thật 1512×950 và 390×844 (vi) — bấm nút xoá thật trên card H&N: toast "Đã chuyển ghi chú vào Thùng rác" + "Hoàn tác", `pointer-events:auto`, `actionHit:"toastAction"` (bấm chuột thật vào nút → ghi chú về lại, toast "Đã đưa lại ghi chú"); H&N/tổng quan tụt 2→1 rồi về 2; Thùng rác hiện hàng `kind-note`, chip `Ghi chú 1`, tổng `1 mục · 0 KB …`; khôi phục/xoá vĩnh viễn/Chọn tất cả đều đúng; "Xoá tất cả tô sáng trên trang này" → toast "Đã xóa 1 tô sáng trên trang này" + Hoàn tác → "Đã đưa lại 1 ghi chú"; ghi chú có `deletedAt` cách 40 ngày bị sweep dọn khi mở app (`inTrashBefore:true → inTrashAfter:false`, sweep trả 1) và ẩn khỏi thư viện; light: toast trắng/chữ `rgb(51,65,85)`/nút `rgb(67,56,202)`, dark: `rgb(23,35,56)`/`rgb(237,242,251)`/`rgb(199,210,254)`; toast `top:66 > topbarBottom 55` (390: 66 > 58). Ảnh: `notes423-1512-{toast,toast-dark,undo,trash,trash-dark,trash-notes-chip}.png`, `notes423-390-{toast,trash}.png`. Lỗi console duy nhất là 404 favicon của `example.com` (dữ liệu giả trong test), không phải lỗi code.
- Chưa test: xoá/khôi phục ghi chú **trên một trang web thật** (tooltip/sidebar content script) — cùng message `DELETE`/`RESTORE_HIGHLIGHTS` đã kiểm ở phía background nhưng chưa bấm trên trang sống.
- Tiếp theo: nối **Chép chính tả** vào Thùng rác (v3.5.424), rồi **Nói**.

**2026-11-17 | v3.5.422 | Arena.ai Agent sửa:**

- Lỗi người dùng báo (2 ảnh crop): toast sau khi xoá tệp bị **chìm/nửa trong suốt, không đọc được chữ**. Nguyên nhân thật: `toast()` trong `js/dashboard/documents.js` **luôn** gán `el.style.top = 74px` bằng inline style, kể cả khi viewer đóng — inline style đè hết mọi rule responsive trong CSS (`.toast{top:118px}`, `top:148px`, `html.dash-embedded .toast{top:calc(var(--dash-vp-top) + 18px)}`), nên toast rơi vào đúng dải hero/dưới topbar và bị nền + hiệu ứng che mờ.
- Sửa: chỉ gán inline `top` khi `#viewer` đang `show` (toast phải nằm trên viewer toolbar); khi viewer đóng thì `el.style.top = ''` để CSS tự quyết theo breakpoint/theme.
- Lỗi thứ hai cùng ảnh: ở dark mode toast là **chip sáng**, nên nút "Hoàn tác" dùng màu ice-blue (`#c7d2fe`) gần như tàng hình — thêm `html.dark .toastAction{color:#4338ca}` + `:hover{color:#312e81}`.
- File: `js/dashboard/documents.js`, `css/dashboard/documents.css`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512×950 và 390×844 (vi), light + dark, mỗi lần bấm xoá thật trong màn Tài liệu rồi đo rect toast trong frame + rect topbar ở page: 1512 → `toastTop 93 / toastBottom 131 / topbarBottom 78 / overlapsTopbar false`; 390 → `toastTop 90 / toastBottom 146 / topbarBottom 82 / overlapsTopbar false`; `position:fixed`, `z-index 94`; light toast `rgb(31,36,51)` + chữ trắng + action `rgb(199,210,254)`; dark toast `rgb(232,237,246)` + chữ `rgb(17,26,43)` + action `rgb(67,56,202)`; 0 lỗi console. Ảnh: `toast422-1512-light.png`, `toast422-1512-dark.png`, `toast422-390-light.png`, `toast422-390-dark.png`.
- Lưu ý QA: harness `qa/toast422.js` ở 390 thêm class `dark` thủ công vào page nên phải gọi luôn `syncDashboardDocumentsTheme()` (như nút đổi theme thật) thì iframe Tài liệu mới nhận dark; trước khi vá, bước dark ở 390 đo nhầm theme sáng.
- Tiếp theo: nối Ghi chú vào cùng Thùng rác (v3.5.423), rồi Chép chính tả, Nói.

**2026-11-17 | v3.5.421 | Arena.ai Agent sửa:**

- Tóm tắt (phần 1 của việc "triển khai Thùng rác vào app", hoàn thiện phía Tài liệu): (1) toast sau khi xoá có nút **Hoàn tác** — bấm là `Store.restore(id)` đưa tệp lại thư viện, toast đổi thành "Đã đưa lại vào thư viện", thời gian hiện 6s thay vì 2.2s; (2) **tự dọn khi mở app**: `dashboard.js` gọi `KeepitTrash.sweep()` (tức `purgeExpired`) 1.2s sau khi dashboard load, không phải chỉ khi mở route Thùng rác; (3) dòng tổng của Thùng rác hiện **dung lượng trống thật** đo bằng `navigator.storage.estimate()`; (4) số đếm chip lấy từ cùng dữ liệu `meta` sau mỗi lần khôi phục/xoá (đã kiểm).
- File: `js/dashboard/documents.js` (toast có action + `moveToTrash`), `css/dashboard/documents.css` (`.toast.hasAction`, `.toastAction`), `js/dashboard/dashboard-trash.js` (`readQuota`, `trashFree`, export `sweep`), `js/dashboard/dashboard.js` (gọi sweep khi mở app), `js/core/languages.js` (`docs_trashUndo`, `docs_trashRestored`, `trashFree` en/vi/ko), `manifest.json`.
- Kiểm tra: Playwright extension thật 1512 + 390 (vi) — bản ghi xoá cách đây 40 ngày **bị dọn ngay khi mở app** (không mở Thùng rác): `beforeReload [u0,u1,u9]` → `afterReload [u0,u1]`; xoá tệp trong thư viện hiện toast "Đã chuyển vào Thùng rác" + nút "Hoàn tác", `pointer-events:auto`, bấm Hoàn tác → thẻ về lại thư viện (2 thẻ), toast "Đã đưa lại vào thư viện", `meta` không đổi; dòng tổng Thùng rác ra "0 mục · 0 KB — giữ 30 ngày rồi xoá vĩnh viễn · còn trống 722.4 MB" khớp `navigator.storage.estimate()`; 0 lỗi console. Ảnh: `undo421-1512-toast.png`, `undo421-390-toast.png`, `undo421-1512-trash-summary.png`, `undo421-390-trash-summary.png`.
- Tiếp theo: nối Ghi chú → Chép chính tả → Nói vào cùng Thùng rác (mỗi loại một version).

**2026-11-17 | v3.5.420 | Arena.ai Agent sửa:**

- Nhãn "Giao diện tối" ở dark mode sáng hơn/xỉn khác "Thùng rác": đo được `Thùng rác` = `rgb(156,163,175)` còn `Giao diện tối` = `rgb(71,85,105)` — nút footer dùng `.reference-footer-button{color:#475569}` mà **không có biến thể `html.dark`**, trong khi mục nav (Thùng rác) lấy màu `#9ca3af` của nav-item dark. Light mode vốn đã trùng nhau (`#475569` cả hai).
- Sửa: thêm `html.dark #dashboardSidebar .reference-footer-button { color: #9ca3af; }` trong `css/dashboard/trash.css`, để nhãn nút giao diện/tài khoản cùng màu nav-item ở dark.
- File: `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512, không hover (chuột đỗ ở 700,500) — light: cả hai `rgb(71,85,105)`, `lightSame: true`; dark: cả hai `rgb(156,163,175)`, `darkSame: true`; hover cả hai `rgb(243,244,246)`, `hoverSame: true`; icon hai mục cùng `rgb(99,102,241)`; tên "Bạn" vẫn `rgb(229,231,235)`, email `rgb(156,163,175)` (không đổi); 0 lỗi console. Ảnh: `side420-light.png`, `side420-dark.png`, `side420-dark-hover-trash.png`, `side420-dark-hover-theme.png`.

**2026-11-17 | v3.5.419 | Arena.ai Agent sửa:**

- Tóm tắt: viết lại mục 1 "Giới thiệu dự án" trong `AGENTS.md` theo bản B đã chốt — tách rõ nền tảng đang có (extension MV3 cho Chromium + Firefox, một codebase) khỏi bản APK Android đóng gói riêng và iOS dự kiến, kèm câu "code dùng chung, khác biệt nằm ở script build, không fork codebase".
- Không đổi code extension.
- File: `AGENTS.md`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: đọc lại mục 1 sau khi ghi (3 bullet, đúng bản B); ZIP v3.5.419 đóng từ HEAD có `AGENTS.md` + `PROJECT.md` mới nhất. Không có thay đổi giao diện nên không có ảnh QA mới.

**2026-11-17 | v3.5.418 | Arena.ai Agent sửa:**

- Bỏ hiệu ứng hover riêng của "Bỏ chọn" (`#4338b8`): nhãn "Chọn tất cả" và "Đã chọn N" không đổi màu khi hover, nên "Bỏ chọn" cũng không được đổi. Xoá `.trashBulk #trashClearSel:hover`, chỉ còn `cursor:pointer` như `.trash-selectall`.
- File: `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512 + 390 (vi) — `clearHoverUnchanged: true`, `selectAllHoverUnchanged: true`, `clearMatchesSelectAllAtRest: true`, `clearMatchesSelectAllWhileHovered: true`; `grep -c "trashClearSel:hover"` = 0; màu `rgb(90,75,208)` ở cả trạng thái thường và khi hover cho cả 3 phần tử; 0 lỗi console. Ảnh khi hover: `hover418-1512-clear.png`, `hover418-1512-selectall.png`, `hover418-390-clear.png`.

**2026-11-17 | v3.5.417 | Arena.ai Agent sửa:**

- Tóm tắt: người dùng chỉ ra mình đoán thay vì hỏi khi yêu cầu về hình thức mơ hồ (nút "Bỏ chọn" phải sửa 3 lần mới đúng). Thêm 3 quy tắc vào `AGENTS.md` mục 4.3: (1) yêu cầu hình thức hiểu nhiều cách thì hỏi lại kèm 2–3 phương án trước khi sửa; (2) ảnh chụp người dùng gửi là đặc tả, chỉ so với đúng phần tử có trong ảnh, không suy từ chỗ khác; (3) thay đổi nhỏ vẫn phải đúng ngay lần đầu.
- Không đổi code extension.
- File: `AGENTS.md`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: đọc lại 3 bullet trong mục 4.3 sau khi ghi; ZIP v3.5.417 đóng từ HEAD có `AGENTS.md` + `PROJECT.md` mới nhất. Không có thay đổi giao diện nên không có ảnh QA mới cho version này.

**2026-11-17 | v3.5.416 | Arena.ai Agent sửa:**

- Sửa đúng ý người dùng sau 2 lần hiểu sai: "Bỏ chọn" phải là **chữ giống "Chọn tất cả" / "Đã chọn N"** trong thanh chọn, không phải link gạch chân (v3.5.414) và cũng không phải nút khung (v3.5.415). Mình đã đọc "2 nút kia" thành 2 nút hành động thay vì nhìn ảnh chụp — lỗi đọc ảnh, không phải lỗi CSS.
- Hiện tại: `<button class="trash-clearsel" id="trashClearSel">` đứng ngay sau `#trashBulkCount`, `font:inherit`, 12.5px, weight 600, màu `#5a4bd0`, không viền/nền/gạch chân; chỉ khác ở `cursor:pointer` và hover `#4338b8`.
- File: `pages/dashboard.html`, `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: đo `getComputedStyle` trên extension thật — cả light và dark, `font-family/font-size/font-weight/color/letter-spacing/text-decoration` của "Bỏ chọn" **trùng từng thuộc tính** với nhãn "Chọn tất cả" (`lightSameAsSelectAll: true`, `darkSameAsSelectAll: true`, màu `rgb(90,75,208)` cả hai theme). Bấm: `hidden=true`, đếm rỗng, 0 dòng picked, `selectAll.checked=false`, Khôi phục disabled. 390: 3 mục vẫn 1 hàng, không tràn. 0 lỗi console. Ảnh: `text416-1512-light.png`, `text416-1512-dark.png`, `text416-390-light.png`.

**2026-11-17 | v3.5.415 | Arena.ai Agent sửa:**

- Sửa lỗi mình gây ở v3.5.414: nút "Bỏ chọn" bị làm thành link gạch chân, không giống các nút khác. Giờ dùng đúng `.trash-action` (cao 32px, bo 10px, viền 1px, chữ 12.5px/600) và nằm trong nhóm `.trash-bulk-actions` — thứ tự `Bỏ chọn · Khôi phục · Xoá vĩnh viễn`, cùng hàng ở 1512 và chia 3 cột đều ở 390.
- Bỏ hết CSS `.trash-clearsel` và biến thể dark của nó; chỉ giữ `.trash-action[hidden]` để ẩn khi chưa chọn gì.
- File: `pages/dashboard.html`, `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512 + 390 (vi) — nút có class `trash-action`, cùng `.trash-bulk-actions` với 2 nút kia, cùng `top`, kích thước/bo góc/font/padding giống nút Khôi phục (khác màu vì Khôi phục là biến thể `primary`), thứ tự trái→phải đúng; bấm xoá lựa chọn: `hidden=true`, đếm rỗng, 0 dòng picked, `selectAll.checked=false`, nút Khôi phục disabled; text "Xoá vĩnh viễn" không bị cắt ở 390; 0 lỗi console. Ảnh: `clear415-1512-bulkrow.png`, `clear415-1512-dark.png`, `clear415-390-selected.png`.

**2026-11-17 | v3.5.414 | Arena.ai Agent sửa:**

- Thêm nút **Bỏ chọn** ngay sau "Đã chọn N" trong thanh chọn (cùng hàng Chọn tất cả / Khôi phục / Xoá vĩnh viễn), kiểu link gạch chân màu tím như Gmail; chỉ hiện khi đang có mục được chọn.
- Bấm sẽ xoá toàn bộ lựa chọn và render lại: đếm về rỗng, nút Khôi phục/Xoá vĩnh viễn disable lại, ô "Chọn tất cả" bỏ tích, chính nút Bỏ chọn tự ẩn.
- File: `pages/dashboard.html`, `js/dashboard/dashboard-trash.js` (`syncBulkBar` + handler `#trashClearSel`), `js/core/languages.js` (`trashClearSel` en/vi/ko), `css/dashboard/trash.css` (light + dark).
- Kiểm tra: `node --check` hai file JS; Playwright trên extension thật 1512 + 390 (vi) — chọn 2 dòng → nút hiện, cách "Đã chọn 2" 12px, nằm trong thanh chọn; bấm → `hidden=true`, đếm rỗng, 0 dòng `is-picked`, `selectAll.checked=false`, nút Khôi phục `disabled=true`; 0 lỗi console. Ảnh: `clear414-1512-bulkrow.png`, `clear414-1512-dark.png`, `clear414-390-selected.png`.

**2026-11-17 | v3.5.413 | Arena.ai Agent sửa:**

- Tóm tắt: thêm mục **4.4** vào `AGENTS.md` buộc kiểm thử giao diện bằng ảnh chụp từ extension thật — mở extension unpacked dưới `xvfb-run` với profile mới, seed IndexedDB trong iframe của route sau khi route mở, assert bằng `getComputedStyle`/`getBoundingClientRect()`/`scrollTop`, tối thiểu 4 ảnh 1512 và 390 cho light + dark (dark bật bằng nút thật), chi tiết nhỏ phải phóng 4×, `console.error`/`pageerror` phải rỗng, báo cáo tách rõ phần đã xác minh và phần chưa kiểm được. Bổ sung 2 bullet ở mục 7 về vị trí harness `/home/user/qa/README.md` và việc sandbox không có khoá `.pem` nên chỉ đóng ZIP.
- Không đổi code extension; chỉ đổi tài liệu quy tắc.
- File: `AGENTS.md`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: đọc lại mục 4.4 và mục 7 sau khi ghi; ZIP v3.5.413 đóng từ HEAD có `AGENTS.md` + `PROJECT.md` mới nhất, `manifest.json` = 3.5.413, không kèm `.git`. Không chạy lại Playwright vì không có thay đổi giao diện nên version này không có ảnh mới — đúng phạm vi sửa quy tắc.
- Lưu ý: chưa tạo CRX vì sandbox không có khoá ký (`/home/user/Keepit-key` rỗng).

**2026-11-17 | v3.5.412 | Arena.ai Agent sửa:**

- Thu nhỏ dấu tích trong ô chọn: từ 5×10px viền 2px xuống 4×7px viền 1.6px, canh giữa bằng `translate(-50%,-52%)` trên ô 18×18 (trước đây dùng `left/top` tuyệt đối nên lệch tâm). Gạch ngang của trạng thái chọn một phần cũng thu còn 8×0, viền 1.6px, canh giữa.
- Kiểm tra ảnh chụp phóng 4× (`box412-zoom-row.png`, `box412-zoom-all.png`) và ảnh 1× (`box412-1512-selected.png`): dấu chiếm khoảng 40% chiều rộng ô ở 4×, không còn dày như v3.5.411; 0 lỗi console khi test lại 1512.

**2026-11-17 | v3.5.411 | Arena.ai Agent sửa:**

- Thanh phân trang chuyển từ đáy danh sách lên **góc phải trên**, cùng hàng với dãy chip (`1–20 trong số 47` + nút trước/sau). Đo ở 1512: nằm trong `.trash-filters`, sát phải, ngay trên danh sách; ở 390 chip xuống 2 dòng và thanh trang tự xuống dòng riêng, canh phải.
- Ô chọn thống nhất một kiểu: "Chọn tất cả" và checkbox từng dòng dùng chung `.trash-box` 18×18, bo 5px, **có dấu tích trắng** khi chọn; trạng thái chọn một phần hiện gạch ngang (indeterminate) thay vì ô vuông đặc như trước. Đo: hai ô cùng 18×18, nền khi chọn `rgb(114,98,223)`, tick `border-right 2px`.
- Sửa lỗi bố cục: `#dashboardTrashView .trash-chips { flex: 0 0 auto }` cũ chặn dãy chip wrap ở 390 (chip bị cắt), đổi sang cho `.trash-filters` giữ `flex:0 0 auto`.
- Browser-test extension thật 1512 + 390 (vi), 47 mục: 20/20/7, chọn tất cả 20 dòng, 0 lỗi console.

**2026-11-17 | v3.5.410 | Arena.ai Agent sửa:**

- Thùng rác thành layout kiểu hộp thư: tiêu đề, ô tìm, bộ lọc thời gian, chip và thanh chọn giữ cố định; chỉ vùng danh sách cuộn (`#dashboardTrashView` flex column, `.trash-list` `overflow-y:auto`), `#dashboardScroller` không cuộn khi ở route này. Đo ở 1512: cuộn danh sách 620px thì `.trash-head` vẫn ở y=75 và topbar y=0, `#dashboardScroller.scrollTop` = 0.
- Phân trang 20 dòng/trang, chỉ dựng DOM của trang hiện tại (47 mục → 20 node), thanh trang dưới danh sách: `1–20 trong số 47`, nút trước/sau tự disable ở đầu/cuối; đổi từ khoá, chip hoặc bộ lọc thời gian thì về trang 1; xoá/khôi phục tự kẹp lại số trang. "Chọn tất cả" chọn theo trang hiện tại (Gmail), không chọn xuyên trang.
- Sidebar: bỏ dải kẻ mình tự thêm (`.reference-nav-sep`) — Thùng rác nằm ngay dưới đường kẻ chung của footer, trên nút Giao diện và tài khoản.
- Browser-test extension thật 1512 + 390 (vi): 47 mục → 20/20/7, tìm "Tai lieu 4" → `1–8 trong số 8`, chọn tất cả → 20 dòng được chọn, 0 lỗi console.

**2026-11-17 | v3.5.409 | Arena.ai Agent sửa:**

- Sửa mốc của bộ lọc thời gian trong Thùng rác: lọc theo **ngày tệp được thêm vào Keepit** (`meta.imported`) thay vì ngày xoá. Ngày xoá chỉ trải 30 ngày nên không chia được mốc tháng/năm, còn ngày xoá vẫn hiện sẵn trên từng dòng.
- Preset trở lại đúng danh sách Gmail: `Mọi lúc / Hơn 1 tuần trước / Hơn 1 tháng trước / Hơn 6 tháng trước / Hơn 1 năm trước / Phạm vi tuỳ chỉnh...` (bỏ các mốc tạm 3 ngày / 2 tuần của v3.5.408). Aria của nút đổi thành "Ngày thêm tệp".
- Mỗi dòng thêm mốc `thêm <ngày>` trước `xoá <ngày>` để thấy ngay bộ lọc đang so cái gì.
- Browser-test extension thật ở 1512 và 390 (vi) với dữ liệu cố ý lệch: thêm 2/10/45/200/400/500 ngày trước, xoá 0/1/4/9/18/26 ngày trước → 1 tuần: 5 dòng, 1 tháng: 4, 6 tháng: 3, 1 năm: 2 (gồm tệp thêm 400 ngày trước nhưng mới xoá 18 ngày trước), tuỳ chỉnh 450–150 ngày: 2 dòng, `Xoá lọc` về 6 dòng; 0 lỗi console.

**2026-11-17 | v3.5.408 | Arena.ai Agent sửa:**

- Thùng rác có bộ lọc thời gian xoá dạng menu giống Gmail: `Mọi lúc / Hơn 3 ngày trước / Hơn 1 tuần trước / Hơn 2 tuần trước / Phạm vi tuỳ chỉnh...`. Preset là tuổi xoá tương đối (đúng với hạn lưu 30 ngày), không copy các mốc 6 tháng/1 năm của Gmail vì thùng rác không giữ tới mốc đó.
- `Phạm vi tuỳ chỉnh` mở hai ô `Từ ngày` / `Đến ngày` (`input type=date`, mốc ngày địa phương) + `Áp dụng` / `Xoá lọc`. Nút lọc đổi nhãn thành khoảng ngày khi áp dụng và chỉ tô màu "đang lọc" khi thật sự có tác dụng.
- Dòng tổng đổi thành `Hiển thị 2/6 mục · 11.9 MB — giữ 30 ngày rồi xoá vĩnh viễn` khi có lọc; dòng bị lọc ẩn cũng tự bỏ khỏi danh sách chọn. Menu đóng bằng click ngoài hoặc Esc.
- Browser-test extension thật ở 1512 và 390 (vi): 6 mục, preset 1 tuần còn 3 dòng, tuỳ chỉnh 06/11–16/11 còn 2 dòng, `Xoá lọc` về 6 dòng, lọc + tìm kiếm cùng lúc còn 1 dòng, chọn 1 rồi lọc 2 tuần thì bỏ chọn; 0 lỗi console.

**2026-11-17 | v3.5.407 | Arena.ai Agent sửa:**

- Thùng rác có thêm: ô **tìm kiếm** theo tên, nút **Dọn sạch thùng rác** (có xác nhận, xoá `meta`+`files`+`translations`), **chọn nhiều** (checkbox từng dòng + Chọn tất cả, thanh hành động Khôi phục / Xoá vĩnh viễn chỉ bật khi đã chọn), và **nhóm theo ngày** (Hôm nay / Hôm qua / Tuần này / Trước đó).
- Không thêm bộ lọc nâng cao kiểu Gmail (`Từ`, `Chứa tệp đính kèm`, `Chưa đọc`) và không phân trang: thùng rác chỉ giữ 30 ngày, chỉ có 4 loại tệp.
- File: `manifest.json`, `pages/dashboard.html`, `css/dashboard/trash.css`, `js/dashboard/dashboard-trash.js`, `js/core/languages.js`, `PROJECT.md`.
- Kiểm tra (Chromium thật, 1512 + 390): 5 mục chia đúng 4 nhóm ngày; tìm "minutes" → còn 1 dòng; Chọn tất cả + Khôi phục → thùng rác trống và thư viện có lại 5 card; Dọn sạch → 0 dòng, `files` trống trong IndexedDB, nút tự disable; lọc chéo giữa chip/tìm kiếm tự bỏ chọn mục không còn hiển thị; 0 lỗi console.

**2026-11-17 | v3.5.406 | Arena.ai Agent sửa:**

- Chuyển mục **Thùng rác** xuống sát đáy sidebar (ngay trên "Giao diện / Tài khoản"), tách bằng đường kẻ, thay vì nằm trong nhóm điều hướng chính.
- Sửa lỗi nặng: Thùng rác mở IndexedDB `keepit-documents` với version trước khi trang Tài liệu kịp tạo store → trên profile mới, DB bị tạo rỗng và `onupgradeneeded` của thư viện vĩnh viễn không chạy. Nay chỉ mở DB nếu đã tồn tại và có store `meta`; nếu chưa có thì coi như thùng rác trống, không tạo DB.
- Tổng dung lượng hiện `0 KB` khi thùng rác trống (trước đó làm tròn thành 1 KB).
- File: `manifest.json`, `pages/dashboard.html`, `css/dashboard/trash.css`, `js/dashboard/dashboard-trash.js`, `PROJECT.md`.
- Kiểm tra (profile mới, Chromium thật): mở Thùng rác trước → không tạo DB, hiện "0 mục · 0 KB"; sau đó mở Tài liệu → DB có đủ 4 store; xoá 1 tài liệu → hiện trong Thùng rác; mục Thùng rác ở y 797–837, nút Giao diện ở 858–898 (đúng sát đáy); 0 lỗi console.

**2026-11-17 | v3.5.405 | Arena.ai Agent sửa:**

- Thùng rác: mỗi dòng dùng icon theo loại tệp như thẻ trong thư viện — PDF đỏ, Word xanh dương, PowerPoint cam, Ảnh xanh lá (có bản dark), thay cho icon thùng rác chung.
- Dòng mô tả đổi sang nhãn loại thật (`PDF · 10 trang · 5,4 MB · xoá 18/11/2026`), sửa lỗi thiếu dấu `·`; ảnh không hiện số trang.
- File: `manifest.json`, `js/dashboard/dashboard-trash.js`, `css/dashboard/trash.css`, `PROJECT.md`.
- Kiểm tra: 4 loại tệp hiển thị đúng nhãn/icon ở light + dark, 0 lỗi console.

**2026-11-17 | v3.5.404 | Arena.ai Agent sửa (demo Thùng rác):**

- Thêm route **Thùng rác** dưới nhóm điều hướng chính (tách bằng đường kẻ), dùng chung `#dashboardSharedTopbar` và `#dashboardScroller` như 4 tab kia.
- Tài liệu: lần đầu có chức năng xoá. Nút thùng rác trên mỗi card → xoá mềm (`deletedAt` trên `meta`, byte vẫn giữ), thư viện lọc bỏ mục đã xoá. Thùng rác liệt kê tên, loại, số trang, dung lượng, ngày xoá, "còn N ngày", nút Khôi phục / Xoá vĩnh viễn; tổng số mục + dung lượng ở đầu trang.
- Xoá vĩnh viễn xoá `meta` + `files` + `translations`, **giữ `notes`**; purge lười khi mở Thùng rác (mục quá 30 ngày) thay vì hẹn giờ nền.
- Chip lọc `Tất cả / Tài liệu / Ghi chú / Chép chính tả / Nói`: chỉ Tài liệu đã nối; 3 loại còn lại hiện "sắp có" để không hứa tính năng chưa có.
- File: `manifest.json`, `pages/dashboard.html`, `css/dashboard/trash.css` (mới), `css/dashboard/documents.css`, `js/dashboard/dashboard-trash.js` (mới), `js/dashboard/dashboard.js`, `js/dashboard/documents.js`, `js/dashboard/documents-store.js`, `js/core/languages.js`, `PROJECT.md`.
- Kiểm tra (Chromium thật, dữ liệu seed vào IndexedDB chỉ trong test): xoá từ card → mục biến khỏi thư viện, xuất hiện trong Thùng rác với "còn 30 ngày"; Khôi phục → quay lại thư viện và mục biến khỏi Thùng rác; Xoá vĩnh viễn → `meta`/`files` mất, danh sách trống; mục 31 ngày tự bị purge khi mở Thùng rác (meta+file bị xoá, mục 3 ngày còn nguyên). 390px: thanh == cột nội dung (14↔373), hàng tự xuống dòng. 0 lỗi console.

**2026-11-17 | v3.5.403 | Arena.ai Agent sửa:**

- Khung kéo thả tệp (`.dz`, "Kéo thả tệp vào đây hoặc chọn tệp") là `<label>` bấm được nhưng con trỏ vẫn là mũi tên; thêm `cursor:pointer` cho khớp hành vi.
- File: `manifest.json`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra: `getComputedStyle` trong Chromium thật trả `cursor:pointer` cho `#dz`; click vẫn mở file picker như trước.

**2026-11-17 | v3.5.402 | Arena.ai Agent sửa:**

- Sửa lệch breakpoint của tab Tài liệu so với v3.5.379: v3.5.401 đặt padding 44px ở route (ngoài iframe), nên `innerWidth` bên trong iframe nhỏ hơn 88px so với bản gốc → `@media(max-width:1180px)` của `documents.css` bật sớm, `.lib` sập 1 cột và "Thống kê đọc" rơi xuống dưới ở những cửa sổ mà v3.5.379 vẫn 2 cột.
- Nay iframe phủ hết bề rộng route (không padding/cap) và padding 44px (22px ≤980, 12px ≤760) nằm lại trong `html.dash-embedded .main` — media query bên trong thấy đúng bề rộng như v3.5.379. Thanh chung vẫn inset 44/22/12px nên vẫn phủ đúng cột nội dung.
- File: `manifest.json`, `css/dashboard/documents-host.css`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra (Chromium thật, so cùng cửa sổ với bản dựng v3.5.379): `innerWidth` trong iframe trùng khít (1568→1345; 1380→1157; 1268→1045; 1200→977), `.lib` = 896+340 / 1066 / 954 / 930 giống từng con số; ảnh đối chiếu `shots380/side-by-side-documents.png`. Với nội dung cao (giả lập 1600px): grid 2 cột ở 1568, 1 cột + tìm kiếm xuống dòng ở 390. Thanh == cột nội dung ở 1568 (264↔1521) và 390 (12↔375). 0 lỗi console.

**2026-11-17 | v3.5.401 | Arena.ai Agent sửa:**

- Trả lại đúng khung nội dung của trang Tài liệu v3.5.379: route tự cấp padding 44px (22px ≤980, 12px ≤760) và bỏ giới hạn 1320px, iframe phủ hết bề rộng route; trước đó tôi nhét Tài liệu vào cột giữa của dashboard (gutter + cap 1320) nên bề rộng bên trong tụt xuống dưới mốc 1180px của `documents.css` → `.lib` sập 1 cột, "Thống kê đọc" rơi xuống dưới, khác hẳn v3.5.379.
- Thanh chung vẫn phủ đúng cột nội dung: Tài liệu dùng gutter 44/22/12px, các tab khác giữ nguyên.
- File: `manifest.json`, `css/dashboard/documents-host.css`, `css/dashboard/overview.css`, `PROJECT.md`.
- Kiểm tra (Chromium thật, so trực tiếp với bản dựng v3.5.379): cửa sổ 1568 — v3.5.379 `.lib` 896+340, `.grid` 2 cột; bản này 899+340 và 2 cột; 1512 — 840+340 / 843+340; 1300 — cả hai đều 1 cột. Thanh == iframe ở mọi route (1512: 264↔1465; 390: 12↔375). 0 lỗi console.

**2026-11-17 | v3.5.400 | Arena.ai Agent sửa:**

- Sửa lỗi layout tab Tài liệu: iframe tự giãn cao bằng nội dung nên khi thư viện có tài liệu (nội dung cao hơn bề rộng) iframe thành "portrait", và `@media (orientation:portrait)` của `documents.css` bật layout điện thoại trên desktop — lưới tài liệu 1 cột, ô tìm kiếm xuống dòng riêng, hero thu nhỏ, ẩn `.heroIcon`.
- Nay trong chế độ nhúng, layout thư viện theo **bề rộng** chứ không theo tỉ lệ khung: `html.dash-embedded` khôi phục giá trị desktop và chỉ chuyển sang giá trị mobile ở `max-width:860px` (kèm bản `max-width:1180px` cho `.aside` 2 cột như bản gốc).
- File: `manifest.json`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra (Chromium thật, ép nội dung cao 1600px để tái hiện): trước sửa — iframe 1205×2514, `.grid` = `847px` (1 cột), `search order:3`, hero padding 20px; sau sửa — `.grid` = `415.5px 415.5px` (2 cột), search cùng hàng, hero 25/30px. Cửa sổ 1200 (iframe 905): lib 1 cột, `.aside` 2 cột đúng như bản gốc. 390: vẫn layout mobile (grid 1 cột, search xuống dòng).

**2026-11-17 | v3.5.399 | Arena.ai Agent sửa:**

- Sửa nháy sáng khi mở tab Tài liệu ở dark mode: iframe tự vẽ bằng theme mặc định (sáng) và còn hiện `.topbar` riêng của nó trong khoảng trước khi Dashboard kịp gán `dash-embedded`/`dark`, nên thấy một khung trắng ~1 frame.
- Nay iframe ẩn (`opacity:0`) cho tới khi Dashboard đã gán `dash-embedded` + `dark` rồi mới hiện (fade 140ms, tắt khi `prefers-reduced-motion`); nền trang nhúng đổi thành `transparent` để không lộ màu nền sai. Đồng bộ theme sớm ở `DOMContentLoaded` của frame thay vì chờ `load`.
- File: `manifest.json`, `css/dashboard/documents-host.css`, `css/dashboard/documents.css`, `js/dashboard/dashboard.js`, `PROJECT.md`.
- Kiểm tra (Chromium thật, 1512, dark): chụp 14 frame liên tiếp khi chuyển tab — trước khi sửa frame đầu có 50% pixel sáng >200 (khung trắng), sau khi sửa 0%; nội dung hiện đủ sau ~120ms. Light mode, quay lại tab lần 2, và đổi theme khi đang mở tab đều đúng, 0 lỗi console.

**2026-11-17 | v3.5.398 | Arena.ai Agent sửa:**

- Bỏ cơ chế riêng của tab Tài liệu: đây là iframe tự cuộn trong `documents.html` với `.topbar` riêng, nên `#dashboardScroller` bị ép `overflow:hidden`, thanh header chung bị ẩn và tab có một scrollbar riêng. Nay Tài liệu là route bình thường: `#dashboardScroller` là scroll root duy nhất, `#dashboardSharedTopbar` là header duy nhất cho cả 4 tab, nội dung trượt dưới thanh khi cuộn.
- Iframe Tài liệu tự báo chiều cao (`ResizeObserver` + `scrollHeight`) để trang giữ một scrollbar; `html.dash-embedded` tắt `.topbar` nội bộ và nền cuộn riêng. `body.documents-viewer-open` vẫn đưa iframe ra toàn màn hình như trước.
- Overlay `position:fixed` trong iframe (toast, dialog, drop target) nhận `--dash-vp-top` theo vị trí viewport thật để không lệch khi trang đã cuộn.
- Thanh chung lấy đúng số đo của `.topbar` v3.5.379: cao 55px, `padding:0 20px`, bo `0 0 22px 22px`, viền trên 0; mobile cao 48px, bo `999px`, sticky `top:10px`, ẩn dấu `/` và pill. Bỏ hiệu ứng thu nhỏ `is-compact` để thanh giữ nguyên khi cuộn.
- Route gutter của thanh bám đúng padding nội dung từng tab: mặc định `clamp(16px,3vw,42px)`, Highlights & Notes `clamp(18px,2.2vw,34px)` (mobile 12/18px), Dictation 18/15/11px.
- File: `manifest.json`, `pages/dashboard.html`, `css/dashboard/overview.css`, `css/dashboard/responsive.css`, `css/dashboard/documents-host.css`, `css/dashboard/documents.css`, `js/dashboard/dashboard.js`, `js/dashboard/documents.js`, `PROJECT.md`.
- Kiểm tra (Chromium thật, extension đã nạp, 1512/1920/390, sáng + tối): thanh == cột nội dung ở cả 4 tab (1512: 262→1467; H&N 253,3→1475,8; 1920: 408,5→1728,5; H&N 254→1883; 390: 14/11/18→373/376/369 khớp từng tab); cuộn 200px thanh dừng ở `top:0` (mobile `top:10`), nội dung chui dưới thanh; chỉ còn một scrollbar/route; 0 lỗi console. Chưa test mở tài liệu thật trong viewer PDF sau thay đổi.

**2026-11-17 | v3.5.379 | Arena.ai Agent sửa:**

- Đổi điểm nhấn vàng của cảnh báo quyền PDF sang xanh lá theo token theme dùng chung; số thứ tự hướng dẫn và icon tự đổi đúng theo giao diện sáng/tối.
- File: `manifest.json`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents; manifest v3.5.379; CSS dùng `--green`/`--greenSoft` cho cả light/dark, không còn mã màu vàng trong popup; CSS brace balance và `git diff --check` — PASS. Chưa browser-test trực quan.

**2026-11-17 | v3.5.378 | Arena.ai Agent sửa:**

- Khớp cỡ chữ hai bước hướng dẫn với demo (12px); giữ nút **Chọn PDF** ở trạng thái phụ/viền, **Làm ngay** là nút tím chính.
- File: `manifest.json`, `css/dashboard/documents.css`, `js/dashboard/documents.js`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents/languages; mocked access/ordinary fallback button states; mocked permission polling; manifest v3.5.378, 12px instruction CSS, DOM/ARIA, `git diff --check` — PASS. Chrome visual/browser test chưa chạy.

**2026-11-17 | v3.5.377 | Arena.ai Agent sửa:**

- Nút **Làm ngay** mở trang Tiện ích Chrome nhưng giữ popup trên Documents; kiểm tra quyền truy cập URL tệp mỗi giây và tự đóng popup khi quyền được cấp. Theo dõi tiếp khi tab Documents được focus lại.
- File: `manifest.json`, `js/dashboard/documents.js`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents; mocked CTA opens Chrome Extensions, modal remains visible while denied and closes after grant; manifest v3.5.377, popup DOM/ARIA, `git diff --check` — PASS. Chrome UI/browser test chưa chạy.

**2026-11-17 | v3.5.376 | Arena.ai Agent sửa:**

- Áp dụng popup quyền truy cập PDF local vào Tài liệu: cảnh báo vàng, tiêu đề “Mở PDF thuận tiện bằng Keepit”, “Cách bật quyền truy cập”, hai hàng hướng dẫn chữ lớn và nút tím “Làm ngay” mở trang Tiện ích Chrome cho Keepit. Giữ picker cho lỗi mở PDF thông thường; dịch đủ en/vi/ko.
- File: `manifest.json`, `pages/documents.html`, `js/dashboard/documents.js`, `css/dashboard/documents.css`, `js/core/languages.js`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents/languages; runtime en/vi/ko labels; manifest version, popup IDs/ARIA, two-step markup, CTA destination, normal-error picker fallback, CSS hidden-state/brace balance, `git diff --check` — PASS. Chrome UI/browser test chưa chạy.

**2026-11-17 | v3.5.375 | Arena.ai Agent sửa:**

- Điều chỉnh overlay PDF xuống để thẻ cách đáy thanh viewer Chrome 20px. Khôi phục thẻ PDF gọn trong popup icon toolbar theo mẫu người dùng gửi (PDF icon, tên tệp ellipsis, nút Open PDF); giữ badge và in-page overlay, không tạo cửa sổ/tab.
- File: `manifest.json`, `js/background/background.js`, `pages/popup.html`, `js/popup/popup.js`, `css/popup/popup.css`, `docs/modules/popup.md`, `OPT-ARENA.md`, `PROJECT.md`.
- Kiểm tra: `node --check` background/toolbar popup/iframe/languages; URL resolver direct/file/viewer/invalid; toolbar markup/CSS light-dark/conditional card; localized labels, iframe top offset, no `windows.create`, mock local-permission flag/exact source URL/CTA, docs bounds, `git diff --check` — PASS. User xác nhận overlay v3.5.374 hiển thị đúng; offset mới và card toolbar v3.5.375 chưa được browser-test.

**2026-11-17 | v3.5.374 | Arena.ai Agent sửa:**

- Đúng lại thiết kế: gỡ thẻ PDF khỏi popup icon toolbar, giữ badge `PDF`; thay cửa sổ riêng bằng iframe overlay được inject vào document PDF. X thu thành icon, bấm icon mở lại; click card mở đúng tài liệu qua Documents.
- Thêm `pages/pdf-suggestion.html` vào web-accessible resources; iframe resize/close gửi postMessage, Background chỉ nhận từ frame đã mount và origin tiện ích. Rời tab/navigation khỏi PDF sẽ gỡ overlay; đóng các cửa sổ PDF riêng còn sót từ v3.5.373 khi reload.
- File: `manifest.json`, `js/background/background.js`, `pages/popup.html`, `js/popup/popup.js`, `css/popup/popup.css`, `js/popup/pdf-suggestion.js`, `js/core/languages.js`, `docs/modules/popup.md`, `OPT-ARENA.md`, `PROJECT.md`.
- Kiểm tra: syntax background/toolbar popup/iframe/languages; manifest/WAR, gỡ mọi PDF card khỏi toolbar, iframe-only/no-window, message source+origin, IDs/assets/i18n en/vi/ko, mocked URL/collapse/reopen/close, `git diff --check` — PASS. Chrome 157 đang chạy v3.5.373: main-frame injection và tải web-accessible iframe asset thành công trên PDF local + online; temporary fixed iframe hit-test ở top layer rồi được gỡ. Chưa test đầy đủ source v3.5.374 trên Chrome.

**2026-11-17 | v3.5.373 | Arena.ai Agent sửa:**

- Sửa race Chrome: tab popup có thể nhận onActivated khi URL còn rỗng/`about:blank`; listener nay chờ URL thật thay vì đóng nhầm cửa sổ. Popup PDF có X thu gọn thành icon, bấm icon mở lại và không tự hết hạn sau 18 giây.
- Giữ toolbar PDF badge/card, luồng mở đúng URL, hướng dẫn quyền file URL và picker fallback; nhãn X/icon được dịch en/vi/ko.
- File: `manifest.json`, `js/background/background.js`, `pages/pdf-suggestion.html`, `js/popup/pdf-suggestion.js`, `css/popup/pdf-suggestion.css`, `js/core/languages.js`, `docs/modules/popup.md`, `PROJECT.md`.
- Kiểm tra: `node --check` background/floating popup/languages; manifest, DOM ID/assets, en/vi/ko labels, blank-URL guard và `git diff --check`; mocked lifecycle xác nhận URL rỗng không tự đóng, X thu gọn/icon mở lại/đổi kích thước và tab khác đóng popup — PASS. Chrome đang chạy bản unpacked ngoài workspace nên browser retest trên code mới chưa chạy.

**2026-11-17 | v3.5.372 | Arena.ai Agent sửa:**

- Khôi phục popup PDF nổi tự hiện khi PDF tab active/tải xong; popup nhỏ theo demo, không có X/thu gọn, toàn card mở PDF. Giữ cả badge `PDF` và thẻ click toàn vùng trong popup toolbar; chia sẻ URL/open/fallback flow, local permission guide và manual picker.
- File: `manifest.json`, `js/background/background.js`, `pages/pdf-suggestion.html`, `js/popup/pdf-suggestion.js`, `css/popup/pdf-suggestion.css`, `js/popup/popup.js`, `js/dashboard/documents.js`, `js/core/languages.js`, `docs/INDEX.md`, `docs/modules/popup.md`, `PROJECT.md`, `OPT-ARENA.md`, `docs/changelog/v3.5.md`.
- Kiểm tra: `node --check` background/action-popup/floating-popup/dashboard/documents/languages; runtime PDF labels en/vi/ko; mocked background lifecycle (PDF complete → popup once with exact URL → closes on navigation; duplicate-event guard); manifest, DOM IDs/assets, no close/collapse, `git diff --check` — PASS. Browser QA chưa chạy.

**2026-11-17 | v3.5.371 | Arena.ai Agent sửa:**

- Popup toolbar: thay cửa sổ PDF nổi bằng thẻ PDF toàn vùng bấm; badge PDF giữ nguyên. Mở đúng URL PDF HTTP(S)/file qua Dashboard > Tài liệu và pipeline import hiện có; nếu quyền file URL tắt hoặc truy cập thất bại, hướng dẫn bật “Allow access to file URLs” và cho phép chọn tệp thủ công.
- Bỏ close/collapse/auto-dismiss của cửa sổ nổi; thêm nhãn en/vi/ko và cập nhật docs.
- File: `manifest.json`, `js/popup/popup.js`, `pages/popup.html`, `css/popup/popup.css`, `js/background/background.js`, `js/dashboard/dashboard.js`, `js/dashboard/documents.js`, `pages/documents.html`, `js/core/languages.js`, `OPT-ARENA.md`, `docs/INDEX.md`, `docs/modules/popup.md`, `PROJECT.md`, `docs/changelog/v3.5.md`; xóa `pages/pdf-suggestion.html`, `js/popup/pdf-suggestion.js`, `css/popup/pdf-suggestion.css`.
- Kiểm tra: `node --check` popup/background/dashboard/documents/languages; manifest JSON, popup/document markup/IDs, i18n runtime en/vi/ko, URL resolution for web/local/wrapped viewer and invalid schemes, bounded 50 MB response stream, removed-floating-UI assertions, `git diff --check` — PASS. Browser QA chưa chạy.

**2026-11-17 | v3.5.370 | Arena.ai Agent sửa:**

- Sửa sai vị trí gợi ý: từ CTA chỉ trong toolbar popup thành cửa sổ extension nổi góc phải trên khi tab PDF active; thêm nút đóng, dịch en/vi/ko, badge dự phòng, mở Dashboard > Tài liệu. Không tự redirect/fetch/đọc tệp.
- Nhận diện path `.pdf` trực tiếp và nguồn `src`/`file`/`url` trong URL Chrome/Firefox PDF viewer; chỉ hiện một lần cho cùng tab/tệp trong phiên.
- File: `manifest.json`, `js/background/background.js`, `js/popup/{popup,pdf-suggestion}.js`, `pages/pdf-suggestion.html`, `css/popup/pdf-suggestion.css`, `js/core/languages.js`, `OPT-ARENA.md`, `docs/INDEX.md`, `docs/documents.md`, `docs/modules/{popup,dashboard}.md`, `PROJECT.md`.
- Kiểm tra: `node --check` JS liên quan; synthetic URL cases cho file:// và viewer wrappers; translations, wiring, manifest và `git diff --check` đạt. Chưa browser-test thật.

**2026-11-17 | v3.5.369 | Arena.ai Agent sửa:**

- PDF tab trong browser: badge `PDF` và CTA trong toolbar popup, mở Dashboard > Tài liệu; không redirect, không fetch/đọc browser viewer. Gợi ý là trong popup toolbar, chưa hiện nổi trên PDF; thay bằng v3.5.370.
- File: `manifest.json`, `js/background/background.js`, `js/popup/popup.js`, `pages/popup.html`, `css/popup/popup.css`, `js/core/languages.js`, `js/dashboard/dashboard.js`, `OPT-ARENA.md`, `docs/INDEX.md`, `docs/documents.md`, `docs/modules/{popup,dashboard}.md`, `PROJECT.md`.
- Kiểm tra: `node --check` bốn file JS; URL suffix cases; `git diff --check` đạt. Chưa browser-test.

**2026-11-17 | v3.5.368 | Arena.ai Agent sửa:**

- Documents sheet: chuyển Dịch và Đọc to từ Công cụ xuống footer cố định cạnh Cài đặt ở cả hai template; giữ `LHN_DOCUMENTS_MAIN_ACTIONS` và viewer handlers hiện có, chỉ tác động Documents sheet.
- File: `manifest.json`, `js/content/keepit-bar.js`, `docs/documents.md`, `docs/modules/content.md`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` JS liên quan, parse manifest và `git diff --check`; chưa browser-test.

**2026-11-17 | v3.5.367 | Arena.ai Agent sửa:**

- `AGENTS.md`: thêm hai quy tắc chỉ áp dụng cho Arena.ai — xóa toàn bộ tệp trong `uploads` sau khi dùng xong; chỉ giữ ZIP version mới nhất trong `Keepit-Zip`, xóa bản cũ sau khi bản mới đã xác minh.
- File: `AGENTS.md`, `PROJECT.md`, `manifest.json`.
- Kiểm tra: parse manifest và `git diff --check`; không đổi mã ứng dụng, không cần browser test.

**2026-11-17 | v3.5.366 | Arena.ai Agent sửa:**

- Cập nhật `OPT-ARENA.md`: mặc định khởi động watcher ẩn; thêm `Unblock-File`, `Start-Process -WindowStyle Hidden` với `-ExecutionPolicy Bypass` chỉ cho tiến trình, và lưu ý Group Policy.
- File: `OPT-ARENA.md`, `PROJECT.md`, `manifest.json`.
- Kiểm tra: parse manifest, `git diff --check`; không đổi mã ứng dụng, không cần browser test.

**2026-11-17 | v3.5.365 | Arena.ai Agent sửa:**

- Documents main sheet: ẩn tile Ẩn thanh; thay tile Dịch/Đọc generic bằng callbacks dùng chung với nút Dịch/Đọc to trên viewer topbar. Chỉ áp dụng trong Documents; sheet web không đổi.
- File: `manifest.json`, `js/content/keepit-bar.js`, `js/dashboard/documents.js`, `docs/documents.md`, `docs/modules/content.md`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file JS, parse manifest và `git diff --check` đạt; Chrome thật chưa kiểm thử.

**2026-11-17 | v3.5.362 | Arena.ai Agent sửa:**

- Reader Documents bỏ TTS cho header/footer có cấu trúc (DOCX) hoặc cùng dòng lặp ở vùng đầu/cuối trang (PDF/Office); vẫn hiện nguyên trên trang. Bộ lọc chỉ tác động `nativeBlocks`, không sửa văn bản/anchor.

**2026-11-17 | v3.5.361 | Arena.ai Agent sửa:**

- Documents only: ẩn footer `Tắt trang`. Pager sheet không bị `relayout()` đóng khi thay đổi breakpoint/viewport do lock/resize; vẫn render/re-anchor. More viewer giữ nguyên.

**2026-11-17 | v3.5.360 | Arena.ai Agent sửa:**

- Phạm vi chỉ Documents sheet: ẩn Dashboard/Bảng quản lý trên browser template; Chú thích (`wclegend`) dùng legend `#legend` của tài liệu, bật word class nếu chưa chạy; trạng thái tile theo legend Docs. Không đổi sheet web thường.

**2026-11-17 | v3.5.359 | Arena.ai Agent sửa:**

- Documents main sheet: lọc `overlay/dictation`, `block/wcblock`, `pdark/zoom/font`; giữ công cụ cần cho tài liệu. Btop dùng `#stage` để hiện/scroll-to-top; tile Loại từ gọi `toggleWordClass` và đồng bộ trạng thái đang bật.

**2026-11-17 | v3.5.358 | Arena.ai Agent sửa:**

- Sửa sheet chớp/tắt: `watchExt()` đóng sheet neo ngoài Reader khi `readerShown()` false. Tách `sheetFromReader`; chỉ sheet được gọi từ Reader mới auto-close theo Reader. Pager sheet vẫn được neo vào nút và giữ mở.

**2026-11-17 | v3.5.357 | Arena.ai Agent sửa:**

- Mở tiếp nguyên nhân v356: cho phép Documents extension frame (không chỉ top frame) và chờ Promise mount thật hoàn tất trước khi bật sheet; `requestMainSheet` await kết quả thay vì coi Promise là failure. Init reject được log rõ. Cú pháp/wiring đạt; chưa browser-test.

**2026-11-17 | v3.5.356 | Arena.ai Agent sửa:**

- Tìm ra lỗi v355 từ ảnh: `keepit-bar.js` tự thoát ngay đầu file vì chỉ cho protocol HTTP(S) hoặc trang Home của extension; Documents là extension page nên hook `openMainSheet` không bao giờ được đăng ký. Cho phép riêng trang có `data-keepit-documents`; giờ component thật khởi tạo tại Documents. Cần browser-test PDF thật.

**2026-11-17 | v3.5.355 | Arena.ai Agent sửa:**

- Sửa v354: bỏ sheet rút gọn tự dựng. Documents nạp lại component main sheet thật (`keepit-bar.js`), ẩn riêng thanh Keepit đáy của host khi chạy trong trang Documents, rồi mở sheet từ nút pager bằng tọa độ nút. Lọc video/Dictation và dashboard/history trong ngữ cảnh này; Reader dùng cùng sheet, More viewer không đổi. Cú pháp/static wiring đạt; chưa browser-test UI.

**2026-11-17 | v3.5.354 | Arena.ai Agent sửa:**

- Ảnh người dùng xác nhận relay lỗi vì main sheet không thể được gọi ổn định từ tab phía sau Documents (ví dụ PDF/viewer không có content script). Bỏ relay cho chức năng này; pager mở sheet cục bộ trực tiếp trên Documents, chứa công cụ tài liệu/đọc, không có Video/Học. Reader mở cùng sheet và focus Đọc to; More viewer vẫn giữ sheet riêng. Chưa browser-test UI thật.

**2026-11-17 | v3.5.353 | Arena.ai Agent sửa:**

- Main sheet mở từ Documents được đánh dấu ngữ cảnh; ẩn video (Overlay/Dictation) và mục Học (Dashboard/Lịch sử). Mở main sheet thông thường không bị thay đổi. Chưa browser-test.

**2026-11-17 | v3.5.352 | Arena.ai Agent sửa:**

- Sửa relay của v351: background trước chỉ lấy `active` tab của cửa sổ, bỏ qua tab owner của frame Documents trong side panel, khiến sheet thất bại và hiện yêu cầu mở website. Giờ ưu tiên `sender.tab` khi đó là webpage chứa Documents; chỉ fallback active tab nếu không có owner tab web. Lời nhắc không còn yêu cầu mở thêm trang.
- Cú pháp/static checks đạt; chưa browser-test trên side panel thật.

**2026-11-17 | v3.5.351 | Arena.ai Agent sửa:**

- Sửa hiểu nhầm ở v350: nút menu pager và ☰ Reader không mở sheet More riêng của Documents; chúng gửi lệnh qua background tới content script trên tab web đang hoạt động để mở đúng main sheet của Keepit trên web. Pager toggle mở/đóng; Reader luôn mở và cuộn tới mục Reader như Reader web. More trên viewer không đổi.
- Nếu không có tab web Keepit hoạt động, hiện hướng dẫn. Cú pháp/static checks đạt; chưa browser-test trong side panel thật.

**2026-11-17 | v3.5.350 | Arena.ai Agent sửa:**

- Thêm nút menu ở mép phải pager nổi; mở cùng sheet Điều khiển của Documents và đưa toàn bộ control vào sheet khi mở. Nút ☰ trên Reader mở cùng sheet, neo gần thanh Reader thay vì chuyển sang tab cài đặt Dashboard.
- Cú pháp/static checks và `git diff --check` đạt; chưa browser-test tương tác/định vị sheet.

**2026-11-17 | v3.5.349 | Arena.ai Agent sửa:**

- Tách lazy rendering thumbnail rail khỏi lazy rendering trang nội dung: khi một mục trang đi vào vùng nhìn thấy của rail thì render thumbnail riêng; PDF raster thu nhỏ theo trang, DOCX/PPTX vẽ text preview theo từng trang. Các trang ngoài vùng không tải sớm.
- Cú pháp/static checks đạt; chưa browser-test PDF/Office nhiều trang.

**2026-11-17 | v3.5.348 | Arena.ai Agent sửa:**

- Nạp shared UI tokens trong Documents để app font Inter và các token của popup Keepit có sẵn; dùng app font làm fallback cho UI, không ghi đè font gốc PDF/Office.
- Chuyển dịch chọn chữ và tự dịch vào ghi chú sang `translate.googleapis.com`, endpoint đã được CSP Documents cho phép (thay endpoint clients5 bị CSP chặn). Cú pháp/JSON/static checks đạt; chưa browser-test luồng mạng hoặc tài liệu thật.

**2026-11-17 | v3.5.347 | Arena.ai Agent sửa:**

- Mỗi highlight PDF nhiều dòng giờ là một group có một bộ sự kiện hover/click, hiển thị một popup ghi chú duy nhất; các dải con chỉ vẽ nền bám theo chữ, không nhận hover riêng và không tô kín khoảng trắng. Giữ màu blend PDF đã xác nhận.
- Cập nhật xóa/restore để gỡ đúng group hình học. Kiểm tra cú pháp/static và `git diff --check` đạt; chưa browser-test trên PDF thật.

**2026-11-17 | v3.5.346 | Arena.ai Agent sửa:**

- PDF highlight nối dải của các dòng kề nhau theo phần chữ được chọn, tránh khe trắng tại line wrap; không kéo tô đến cuối dòng hay thành hộp chữ nhật lớn. Giữ một annotation và một ID.
- Kiểm tra cú pháp và static checks geometry/overlay; chưa browser-test trên PDF thật.

**2026-11-17 | v3.5.345 | Arena.ai Agent sửa:**

- PDF highlights dùng overlay hình học riêng; gom các mảnh kề nhau cùng baseline thành dải theo chữ/dòng. Giữ một annotation ID, không tô kín khoảng trắng giữa các dòng; thao tác màu/xem trước/sửa/xóa dùng chung.
- Kiểm tra cú pháp và static checks overlay/style/classes; chưa browser-test trên PDF thật.

**2026-11-17 | v3.5.344 | Arena.ai Agent sửa:**

- Sửa vị trí blend PDF: áp `mix-blend-mode:multiply` lên stacking context của text span PDF có highlight, để màu tô hòa với canvas gốc thay vì thành dải che chữ.
- Kiểm tra cú pháp/CSS selector/static class, `git diff --check`; chưa browser-test trên PDF thật.
