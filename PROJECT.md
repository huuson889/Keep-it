# Keepit - Hồ sơ dự án

## 1. Trạng thái hiện tại (sửa đè)
- Version hiện tại: v3.4.585; một codebase Manifest V3 cho Chrome và Firefox. Mã nguồn được nhóm theo vai trò trong `js/` và `css/`, giao diện trong `pages/`, tài nguyên trong `assets/` và thư viện bên thứ ba trong `vendor/`. Các module gồm nền tảng, dịch, Reader, Highlighter, khôi phục annotation, Sidebar, Note Composer, Dashboard Settings, thống kê hồ sơ, Flashcards, Usage và Diagnostics. Entry points vẫn điều phối state và vòng đời.
- Phần tối ưu code theo OPT đã rà/triển khai: Bước 1.1–1.3; 2.1–2.3; 3.1–3.2; 4.1–4.5; OPT 3.2 Flags và 5.3 Fonts/Reader/Translate/Highlighter. Kiểm tra v3.4.583: `node --check` 38/38 JS, script paths hợp lệ, Cache API smoke đạt, `git diff --check` đạt; ZIP hiện hành có manifest gốc. Chưa kiểm thử trên Chrome/Firefox. Push GitHub của watcher còn lỗi; xem sync-watch.log.
- Bản sửa tải Google Fonts theo nhu cầu trong v3.4.555 đã được người dùng xác nhận; v3.4.554 là bản kiểm tra không đạt. Trình duyệt cụ thể chưa được ghi nhận; xem các mục nhật ký v3.4.555 bên dưới để biết tóm tắt thay đổi.
- Một số hành vi TTS/Reader còn chờ xác nhận thực tế trên trình duyệt; xem danh sách việc đang mở bên dưới. Không suy ra audio hoặc hành vi runtime đã được xác nhận chỉ từ code/mock/request HTTP.
- `LICENSE` và `PRIVACY-POLICY.md` vẫn là bản nháp có placeholder; rà soát pháp lý/store còn mở. Quyết định và chi tiết ở `OPT-ARENA.md`.
- Chưa nối Supabase/cloud sync hoặc xử lý thanh toán thật; xác nhận chi tiết tính năng hiện hành trong README và mã nguồn.

## 2. Việc đang mở / Tiếp theo (sửa đè)
21. [Kiểm tra] Alt+A và Alt+D dùng chung cache Reader (v3.4.585): dịch một đoạn bằng Alt+D rồi Alt+A (và ngược lại) không phát sinh request dịch mới; số mục `lhnBilingualReaderTranslationCache:v2:item:` không tăng thêm cho cùng đoạn. Chưa có kết quả trên Chrome/Firefox.
20. [Kiểm tra] Auto sentence note khi Bilingual Reader mở (fix v3.4.584): chọn chữ trong đoạn gốc thì câu tự động chỉ có tiếng gốc; chọn chữ trong card bản dịch thì câu tự động trống. Chưa có kết quả trên Chrome/Firefox.
19. [Tiếp tục kiến trúc OPT] Rà soát phần điều phối còn lại trong `content.js` và `dashboard.js`; các entry points hiện vẫn giữ state/vòng đời. Chỉ tách tiếp khi ranh giới chức năng rõ, ít phụ thuộc và giúp agent mới theo luồng dễ hơn.
17. [Kiểm thử hồi quy trước phát hành] Chrome/Firefox: Bilingual Reader retry sau fallback, cache hit và Clear Cache; TTS phát lại audio cache và LRU khi vượt ngưỡng. Chưa chạy kiểm thử trình duyệt.
18. [Kiểm thử UI theo OPT 3.2] Menu Language v3.4.571 (không đổi từ v3.4.564): kiểm tra hai mép ô/menu, mở/đóng, lọc/chọn/lưu và bàn phím trên Chrome/Edge; chưa có kết quả trình duyệt.
16. [Hoàn thiện trước phát hành] `LICENSE`/`PRIVACY-POLICY.md` còn placeholders: xác nhận chủ thể quyền, privacy email, URL/ngày hiệu lực; rà phiên bản/provider; rà soát Chrome store disclosures và Firefox data-collection declaration trong manifest. Chưa công bố.
15. [Kiểm tra] Toast "Mạng chậm, đang tải âm thanh" khi Google TTS lỗi trên Chrome/Firefox (Speak popup, Bilingual Reader). Chưa nối cho flashcard Dashboard.
14. [Kiểm tra] Full dict IPA trên Chrome/Firefox: từ có IPA, từ chỉ có nguồn Google (gần đúng), từ không có IPA (không hiện dòng); đọc từ và chip Colloc dùng en.
13. [Kiểm tra] Focus ô search của Select Voice trên Edge (bản retry chưa thử trên Edge thật); Alt+L và dòng Select voice reader trong Dashboard.
12. [Kiểm tra] Cờ lhn-br-flag đổi ngay khi chọn voice lúc đang đọc/pause trên Chrome/Firefox. [Chưa làm] Pause với Google rồi đổi giọng: Play vẫn tiếp tục audio cũ.
11. [Kiểm tra] Giọng trình duyệt đã chọn phải đọc đúng giọng (Chrome: Google Bahasa Indonesia); thiếu giọng thì toast + dừng (Firefox/Android). Theo dõi giọng Google mạng dừng giữa chừng với đoạn dài.
9. [Kiểm tra] Dashboard TTS: xác nhận tốc độ riêng ngôn ngữ hiển thị mặc định 1.25×, slider/ô số/reset đều chính xác; global giữ 1.0×; giá trị riêng đã lưu không bị ghi đè; flashcard-only default vẫn 1.2×.
8. [Kiểm tra] Xác nhận 27 website Reader mặc định được seed vào cài đặt hiện có, website con cũng bị tắt, và domain người dùng đã xóa không tự xuất hiện lại.
7. [Kiểm tra] Xác nhận Reader settings gộp một mục, disabled/gray và không nhận chuột khi Enable reader tắt trên Firefox/Chrome.
10. [Kiểm tra] Đo thực tế độ trễ dịch Bilingual Reader trên Firefox/Chrome sau khi các engine được gọi đồng thời.

1. [Kiểm tra] Google TTS trên Chrome: xác nhận nghe được audio. Ví dụ request đã thấy: translate.google.com/translate_tts?ie=UTF-8&q=...&tl=en&client=tw-ob, GET, 200 OK.
2. [Kiểm tra] Đọc đoạn dài bằng chia đoạn 180 ký tự (đã có trong code, chưa xác nhận trên máy). Background vẫn giới hạn 500 ký tự mỗi request.
3. [Làm một phần] Chuỗi dự phòng TTS: Google -> giọng trình duyệt theo từng đoạn đã có; Speak popup/Bilingual Reader có toast khi Google audio lỗi, nhưng Dashboard flashcard chưa nối toast. Chờ kiểm tra trình duyệt.
4. [Kiểm tra] Firefox MV3: background có unload khi rảnh làm mất tin nhắn không.
6. [Kiểm tra] Xác nhận nhận diện ngôn ngữ, migration voiceMode/browserVoiceURI, chọn Browser voice và Google voice trên Chrome/Firefox.

## 3. Ràng buộc & quyết định
- Giữ nguyên UI, layout, văn bản hiện có. Chỉ thêm mới khi được yêu cầu.
- Mọi API dùng browser.* (đã có polyfill).
- Không có sidebar_action; popup và dashboard mở trong tab/popup.
- Thư mục nguồn là nguồn duy nhất; zip do Arena đóng gói vào D:\Keepit.
- AGENTS.md và PROJECT.md nằm trong zip và được commit vào Git. Trước khi nộp store, người dùng tự xóa hai file này khỏi zip.
- Thay đổi lớn nêu rõ trong commit message.

## 4. Cấu trúc và kiến trúc dự án

### 4.1. Bản đồ file
```text
Keepit - Test/
├── manifest.json                  # Quyền và entry points của extension
├── pages/
│   ├── dashboard.html             # Giao diện Dashboard
│   └── popup.html                 # Popup toolbar
├── js/
│   ├── core/                      # browser-polyfill, config, languages, messaging, settings, cache, shortcuts
│   ├── background/                # background.js (entry), annotations, usage-limits, error-logger
│   ├── content/                   # content.js (entry), web-highlighter, sentence-note, sidebar, note-composer, page-layout, ui-components, annotation-restore
│   │   ├── sidebar.js             # Khung, thẻ và tiện ích tìm kiếm Sidebar
│   │   ├── note-composer.js       # Dựng form và tạo/canonicalize record note
│   │   └── annotation-restore.js  # Chuẩn hóa text và tìm range để khôi phục annotation
│   ├── reader/                    # bilingual-reader, TTS engine, reader voice flags
│   ├── translate/                 # translate, dictionary, search, study translation
│   ├── dashboard/                 # dashboard.js (entry), settings-ui, study-view, study-utils, library, backup, account, profile-stats, flags
│   │   ├── settings-ui.js         # Bộ chọn ngôn ngữ, danh sách website, trạng thái Reader
│   │   └── profile-stats.js       # Tổng hợp số liệu hồ sơ từ annotations
│   ├── popup/                     # popup.js (entry)
│   └── shared/                    # helpers như custom-font và icons
├── css/
│   ├── content/                   # CSS của content script
│   ├── dashboard/                 # CSS Dashboard
│   ├── popup/                     # CSS popup toolbar
│   └── shared/                    # theme tokens, theme và flags
├── assets/
│   ├── icons/                     # Biểu tượng extension
│   └── fonts/                     # Font cục bộ
├── vendor/readability/            # Mozilla Readability cho Alt+R/Alt+A
├── licenses/                      # Văn bản giấy phép bên thứ ba
├── supabase-schema.sql            # Schema Supabase (cloud chưa nối)
└── AGENTS.md, PROJECT.md, README.md, OPT-ARENA.md, PRIVACY-POLICY.md, SUPABASE_SYNC.md, THIRD_PARTY_NOTICES.md
```

`manifest.json` luôn ở gốc; thứ tự script trong manifest và HTML là thứ tự nạp cần giữ.

Có 2 entry `content_scripts`: entry `document_start`/`all_frames` chỉ nạp browser API, messaging, error-logger và custom-font; app chính chạy `document_idle` ở top frame.

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
Content ── Highlighter / Note Composer / Sidebar ──> giao diện trên trang
Dashboard ── Settings UI / Library / Flashcards / Account / Backup ──> giao diện quản lý
```

Các mũi tên qua `core/messaging` là runtime messages. Settings giao diện được đọc/ghi trực tiếp qua `browser.storage`; không phải mọi luồng đều đi qua Background.

## 5. Nhật ký dự án (mới nhất → cũ nhất)
**2026-10-25 | v3.4.585 | DeepSeek sửa:**

- `Alt+A`/lazy và `Alt+D` trước đây lấy text khác nhau cho cùng một đoạn: `visibleReaderText` (chuẩn hóa `\s+` → khoảng trắng) so với `clone.innerText` (giữ `\n`), nên sinh 2 khóa cache khác nhau và gọi dịch 2 lần. Đổi `rawText` về một đường dùng `visibleReaderText` cho cả hai, nên hai phím dùng chung cache Reader.
- File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check js/reader/bilingual-reader.js` đạt; chưa kiểm thử trên Chrome/Firefox.
- Lưu ý: mục cache cũ do `Alt+D` tạo (khóa theo `innerText`) không còn khớp, sẽ tự hết hạn sau 7 ngày hoặc bị LRU đẩy ra.

**2026-10-25 | v3.4.584 | DeepSeek sửa:**

- Fix Auto sentence note lấy kèm bản dịch khi Bilingual Reader mở: `getContext` dùng `block.textContent` nên gồm cả `.lhn-bilingual-card` và `.lhn-bilingual-speaker` mà Reader chèn vào trong đoạn; bộ lọc cũ chỉ loại class của Immersive Translate. Đổi `isImmersiveTranslation` → `isTranslationElement`, mở rộng nhánh lọc offset cho 2 class này: câu tự động chỉ còn chữ gốc, chọn chữ trong card bản dịch trả về rỗng.
- File: `js/content/sentence-note.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check js/content/sentence-note.js` đạt; `git diff --check` đạt; chưa kiểm thử trên Chrome/Firefox.
- Tiếp theo: người dùng test `Alt+A`/`Alt+D` rồi chọn chữ trong đoạn gốc và trong card bản dịch.

**2026-10-25 | v3.4.583 | DeepSeek sửa:**

- Đồng bộ bản đồ file mục 4.1 với code thật: nêu tên module của `content/` và `dashboard/`; thêm `PRIVACY-POLICY.md`, `SUPABASE_SYNC.md`, `supabase-schema.sql`; ghi rõ 2 entry `content_scripts` (`document_start`/`all_frames` và `document_idle`/top frame).
- File: `PROJECT.md`.
- Kiểm tra: đối chiếu cây file với `manifest.json`, `pages/popup.html`, `pages/dashboard.html` bằng liệt kê file và grep danh sách script — khớp; chưa kiểm thử trên trình duyệt.

**2026-10-24 | v3.4.583 | Kiro sửa:**

- Sửa bug auto translate không chạy khi Direct translation popup tắt và Full Dict popup bật.
- Bug: `skipAutoTranslate = true` luôn được set khi chọn từ tiếng Anh, bất kể `autoTranslate` bật/tắt.
- Fix: Đổi thành `skipAutoTranslate = skipAutoTranslate || settings.autoTranslate === false;` để chỉ skip khi user TẮT auto translate.
- File: `js/content/content.js`, `PROJECT.md`.
- Kiểm tra: PowerShell sửa dòng 410, xác nhận `skipAutoTranslate = skipAutoTranslate || settings.autoTranslate === false;`.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Fix full dict kẹt loading: `content.js` còn tham chiếu biến `dictionaryCachePrefix` đã bị đóng scope trong module Dictionary, gây `ReferenceError` trước khi gọi dịch. Chuyển tạo cache key qua `LHN_DICTIONARY.cacheKey()`.
- File: `js/content/content.js`, `js/translate/dictionary.js`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file JS, `git diff --check` và Node smoke test `LHN_DICTIONARY.cacheKey("Success", "vi")` → `lhnFullDictionary:v2:vi:success` đạt; chưa kiểm tra trực tiếp trên trình duyệt.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Full dict render nghĩa chính ngay khi dịch xong, không đợi Syn/Ant, Forms, Colloc hoặc IPA; giới hạn mỗi request dịch Google/MyMemory ở 5 giây để backup hoặc trả kết quả dự phòng khi mạng treo.
- File: `js/content/content.js`, `js/translate/dictionary.js`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file JS và `git diff --check` đạt; chưa kiểm tra trực tiếp trên trình duyệt.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Khôi phục dựng giao diện `#lhn-panel` trực tiếp trong content script như trước khi tách Note Composer; giữ luồng lưu note và hỗ trợ mở sau khi settings tải xong.
- File: `js/content/content.js`, `PROJECT.md`.
- Kiểm tra: `node --check js/content/content.js` và `git diff --check` đạt; chưa kiểm tra trực tiếp trên trình duyệt.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Sửa race lúc khởi động: giữ xử lý chọn chữ và Alt+S trong khi settings đang tải; sau khi tải xong chỉ mở `#lhn-panel` nếu website không bị tắt.
- File: `js/content/content.js`, `PROJECT.md`.
- Kiểm tra: `node --check js/content/content.js` và `git diff --check` đạt; chưa kiểm tra trực tiếp trên trình duyệt.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Mở popup nhập note trước khi chạy preview highlight để lỗi preview không chặn popup; giữ cách hiển thị và vị trí hiện tại.
- File: `js/content/content.js`, `PROJECT.md`.
- Kiểm tra: `node --check js/content/content.js` và `git diff --check` đạt; chưa kiểm tra trên trình duyệt.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Khi chọn ngôn ngữ trong Dashboard Settings, đóng danh sách và bỏ focus khỏi `settingsLanguageSearch`, tương tự toolbar.
- File: `js/dashboard/settings-ui.js`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/settings-ui.js` và `git diff --check` đạt; chưa kiểm tra trực tiếp trên trình duyệt.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Tách tìm lại vùng chữ của annotation đã lưu sang `annotation-restore.js`; tách phép tổng hợp thống kê hồ sơ sang `profile-stats.js`. Giữ vòng đời khôi phục DOM và phần render hồ sơ trong entry point.
- File: `js/content/content.js`, `js/content/annotation-restore.js`, `js/dashboard/dashboard.js`, `js/dashboard/profile-stats.js`, `manifest.json`, `pages/dashboard.html`, `PROJECT.md`.
- Kiểm tra: `node --check` đạt 38/38 JavaScript; tham chiếu trong manifest và dashboard HTML hợp lệ; `git diff --check` đạt. Không có phiên Chrome/Firefox điều khiển được qua Computer Use để kiểm tra giao diện/runtime.
- Lưu ý: watcher đã commit và cập nhật ZIP v3.4.583; log watcher báo lỗi push GitHub.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Tách dựng khung và thẻ Sidebar vào `sidebar.js`, dựng form vào `note-composer.js`, và bộ chọn ngôn ngữ/danh sách website cài đặt vào `settings-ui.js`; giữ state, lưu trữ và điều phối trong entry points.
- File: `js/content/content.js`, `js/content/sidebar.js`, `js/content/note-composer.js`, `js/dashboard/dashboard.js`, `js/dashboard/settings-ui.js`, `pages/dashboard.html`, `PROJECT.md`.
- Kiểm tra: `node --check` đạt 36/36 JavaScript; tham chiếu trong manifest và dashboard HTML hợp lệ; `git diff --check` đạt. Chưa kiểm tra runtime trên Chrome/Firefox.
- Lưu ý: watcher đã commit và cập nhật ZIP v3.4.583; lần push GitHub gần nhất báo lỗi.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Đổi mục 4 thành “Cấu trúc và kiến trúc dự án”; phân chia cây thư mục và sơ đồ tương tác thành 4.1 và 4.2.
- File: PROJECT.md.
- Kiểm tra: `git diff --check`.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Thêm sơ đồ tương tác runtime giữa Popup, Dashboard, Content, Reader, TTS và Background vào PROJECT.md.
- File: PROJECT.md.
- Kiểm tra: `git diff --check`.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Đổi mục Bản đồ file trong PROJECT.md sang sơ đồ cây, ghi chú entry points và vai trò từng nhóm thư mục.
- File: PROJECT.md.
- Kiểm tra: `git diff --check`.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Gom mã nguồn theo vai trò: JavaScript vào `js/`, CSS vào `css/`, trang vào `pages/`, icon/font vào `assets/` và Readability vào `vendor/`; cập nhật đường dẫn nạp và giữ nguyên thứ tự script.
- File: manifest.json, pages/, js/, css/, assets/, vendor/readability/, README.md, THIRD_PARTY_NOTICES.md, OPT-ARENA.md, PROJECT.md.
- Kiểm tra: manifest paths 48/48 hợp lệ; HTML 2/2, CSS 7/7 paths hợp lệ; `node --check` 37/37 JS đạt; `git diff --check` đạt. Chưa kiểm thử trên trình duyệt.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Đồng bộ ô `settingsLanguageSearch` trong Dashboard Settings với ô chọn ngôn ngữ ở toolbar: kích thước, kiểu chữ, viền, danh sách, mục chọn và thao tác bàn phím.
- File: dashboard.css, dashboard.js, PROJECT.md.
- Kiểm tra: `node --check dashboard.js` đạt; `git diff --check` đạt trước commit. Chưa kiểm tra giao diện trên trình duyệt. Watcher đã commit `1e75c0f` và cập nhật ZIP v3.4.583; push GitHub thất bại.

**2026-10-24 | v3.4.583 | Codex sửa:**

- Bước Cache/LRU: chuyển IndexedDB TTS audio cache (trim, LRU touch, budget check, read/write) sang `cache.js` (`LHN_CACHE`); giữ database/store/key, 200 mục, 50 mục trim trigger và luồng TTS.
- File: cache.js, background.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 35/35 JS; manifest/HTML script paths hợp lệ; Cache API smoke đạt; `git diff --check` đạt; ZIP 72 mục, manifest gốc, version 3.4.583, cache.js và background.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: rà toàn bộ module và chạy hồi quy tĩnh cuối.

**2026-10-24 | v3.4.582 | Codex sửa:**

- Bước 3 — Note Composer: tách dựng bản ghi annotation và so sánh nội dung không đổi sang `note-composer.js` (`LHN_NOTE_COMPOSER`); giao diện, tự dịch và thao tác lưu vẫn do content script quản lý.
- File: note-composer.js, content.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 35/35 JS; script paths hợp lệ; mock tạo/so sánh bản ghi đạt; `git diff --check` đạt; ZIP 72 mục, manifest gốc, version 3.4.582 và note-composer.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: rà các module còn lại và hoàn tất hồi quy.

**2026-10-24 | v3.4.581 | Codex sửa:**

- Bước 4 — Sidebar: tách tạo nút, render câu trích dẫn, cache trường tìm kiếm và tô khớp kết quả sang `sidebar.js` (`LHN_SIDEBAR`); điều phối/mount Sidebar vẫn ở content script.
- File: sidebar.js, content.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 34/34 JS; manifest/HTML paths hợp lệ; mock helper cache/render Sidebar đạt; `git diff --check` đạt; ZIP 71 mục, manifest gốc, version 3.4.581 và sidebar.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: hoàn thiện Sidebar/Note Composer còn lại và rà các module OPT.

**2026-10-24 | v3.4.580 | Codex sửa:**

- Account: tách lưu/xóa hồ sơ demo cục bộ sang `account.js` (`LHN_ACCOUNT`); giữ nguyên storage key, trường dữ liệu và giao diện tài khoản.
- File: account.js, dashboard.js, dashboard.html, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 33/33 JS; script paths hợp lệ; mock local save/remove đạt; `git diff --check` đạt; ZIP 70 mục, manifest gốc, version 3.4.580 và account.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: Sidebar và Note Composer.

**2026-10-24 | v3.4.579 | Codex sửa:**

- Bước 4 — Library: tách cache metadata annotation và gom/sắp xếp trang nguồn sang `library.js` (`LHN_LIBRARY`); Dashboard tiếp tục điều khiển bộ lọc và hiển thị như hiện tại.
- File: library.js, dashboard.js, dashboard.html, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 32/32 JS; manifest/HTML paths hợp lệ; mock grouping, thứ tự, favorites và metadata cache đạt; `git diff --check` đạt; ZIP 69 mục, manifest gốc, version 3.4.579 và library.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: Sidebar, Account và Note Composer.

**2026-10-24 | v3.4.578 | Codex sửa:**

- Bước 4 — Backup: tách nhận dạng JSON nhập/xuất và đóng gói favorites sang `backup.js` (`LHN_BACKUP`); Dashboard giữ thao tác file và thông báo hiện có.
- File: backup.js, dashboard.js, dashboard.html, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 31/31 JS; script paths hợp lệ; mock JSON envelope/parse đạt; `git diff --check` đạt; ZIP 68 mục, manifest gốc, version 3.4.578 và backup.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: Library, Sidebar, Account và Note Composer.

**2026-10-24 | v3.4.577 | Codex sửa:**

- Bước 1 — Shortcuts: dùng chung chuẩn hóa phím sự kiện trong `shortcuts.js` (`LHN_SHORTCUTS`) giữa content và Dashboard shortcut settings; không đổi mapping, nhãn hay xử lý phím flashcard.
- File: shortcuts.js, content.js, dashboard.js, dashboard.html, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 30/30 JS; script paths hợp lệ; mock Alt+A, Space và Left đạt; `git diff --check` đạt; ZIP 67 mục, manifest gốc, version 3.4.577 và shortcuts.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: tiếp tục Sidebar, Library/Backup, Account và Note Composer.

**2026-10-24 | v3.4.576 | Codex sửa:**

- Bước 1 — Icons: chuyển bộ đường dẫn SVG dự phòng và hàm tạo markup của Dashboard sang `icons.js` (`LHN_ICONS`); giữ nguyên thứ tự ưu tiên icon và HTML trả về.
- File: icons.js, dashboard.js, dashboard.html, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 29/29 JS; đường dẫn script hợp lệ; mock markup icon đạt; `git diff --check` đạt; ZIP 66 mục có manifest gốc, version 3.4.576 và icons.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: tiếp tục Shortcuts, Sidebar, Library/Backup, Account và Note Composer.

**2026-10-24 | v3.4.575 | Codex sửa:**

- Bước 4 — Page Layout: tách lưu/khôi phục inline style và thu hẹp trang khi mở Sidebar sang `page-layout.js` (`LHN_PAGE_LAYOUT`); giữ nguyên kích thước và thuộc tính style hiện hành.
- File: page-layout.js, content.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 28/28 JS; script paths hợp lệ; mock thu hẹp/khôi phục trang đạt; `git diff --check` đạt; ZIP 65 mục có manifest gốc và page-layout.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: Icons, Shortcuts và các module Bước 4.
**2026-10-24 | v3.4.574 | Codex sửa:**

- Bước 3 — UI Components: tách trình chỉnh sửa tag dùng chung sang `ui-components.js` (`LHN_UI_COMPONENTS`) cho note composer và sidebar editor; giữ chuẩn hóa, phím tắt, nút xóa và nhãn dịch hiện tại.
- File: ui-components.js, content.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 27/27 JS; manifest/HTML paths hợp lệ; mock chuẩn hóa tag `Alpha/alpha/beta` đạt; `git diff --check` đạt; ZIP 64 mục, manifest gốc, version 3.4.574 và ui-components.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: hoàn thiện Note Composer/Highlighter rồi Bước 4.

**2026-10-24 | v3.4.573 | Codex sửa:**

- Bước 3 — SentenceNote: tách trích câu chứa vùng chọn (kể cả bỏ qua text Immersive Translate) sang `sentence-note.js` (`LHN_SENTENCE_NOTE`); content script truyền hàm chuẩn hóa text hiện có, giữ nguyên kết quả và UI.
- File: sentence-note.js, content.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 26/26 JS; đường dẫn manifest/HTML hợp lệ; smoke `getContext(null)` đạt; `git diff --check` đạt; ZIP 63 mục có manifest gốc, version 3.4.573 và sentence-note.js. Chưa kiểm thử trên Chrome/Firefox.
- Tiếp theo: tiếp tục Highlighter/Note Composer và Bước 4.

**2026-10-24 | v3.4.572 | Codex sửa:**

- Bước 3 — Annotations: tách IndexedDB, migration, CRUD, phân trang, import/export, tiến độ ôn tập và thông báo thay đổi sang `annotations.js` (`LHN_ANNOTATIONS`); giữ message type và cấu trúc dữ liệu hiện hành.
- File: annotations.js, background.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: toàn bộ `node --check` đạt; đường dẫn script manifest/HTML hợp lệ; mock API Annotations và Search rank đạt; `git diff --check` đạt; ZIP 62 mục, manifest gốc, version 3.4.572 và annotations.js. Chưa kiểm thử Chrome/Firefox.
- Tiếp theo: tiếp tục Bước 3–4.

**2026-10-24 | v3.4.571 | Codex sửa:**

- Bước 2 — Search: gom ranking và tô khớp kết quả dùng chung vào `search.js` (`LHN_SEARCH`), nối Library Dashboard và Sidebar; giữ nguyên trường tìm, thứ tự xếp hạng, selector loại trừ và kiểu mark hiện tại.
- File: search.js, dashboard.js, content.js, dashboard.html, manifest.json, README.md, PROJECT.md.
- Kiểm tra: toàn bộ `node --check` đạt; đường dẫn script hợp lệ; mock Search rank đạt; `git diff --check` đạt; ZIP 61 mục, manifest gốc, version 3.4.571 và search.js. Chưa kiểm thử trình duyệt.
- Tiếp theo: Bước 3 Annotations, Highlighter, SentenceNote và Note Composer.
**2026-10-24 | v3.4.570 | Codex sửa:**

- Bước 2 — Dictionary: tách kiểm tra từ tiếng Anh, cache/migration, dịch Google→MyMemory, IPA, synonyms/antonyms, forms và collocations sang `dictionary.js` (`LHN_DICTIONARY`); content giữ phần popup/rendering và gọi API module.
- File: dictionary.js, content.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 25/25 JS; đường dẫn script hợp lệ; mock Dictionary provider/dedupe/cache đạt; ZIP 60 mục, manifest gốc, version 3.4.570 và dictionary.js. Chưa kiểm thử trình duyệt.
- Tiếp theo: tách Search và tiếp tục Bước 3–4.
**2026-10-24 | v3.4.569 | Codex sửa:**

- Bước 2 — Translate: tách provider pipeline Bilingual Reader và nhận diện ngôn ngữ từ `background.js` sang `translate.js` (`LHN_TRANSLATE`); giữ nguyên thứ tự engine/fallback, timeout, Promise dedupe, cache API và message contract.
- File: translate.js, background.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 25/25 JS; manifest/HTML script paths tồn tại; mock Translate provider/dedupe/cache reuse đạt; `git diff --check` đạt; ZIP 59 mục có manifest gốc, translate.js và version 3.4.569. Chưa kiểm thử trình duyệt.
- Tiếp theo: tách Dictionary và Search, rồi các module nghiệp vụ theo Bước 3–4.
**2026-10-24 | v3.4.568 | Codex sửa:**

- Bước 1 — Cache/lưu trữ: tách cache bản dịch Bilingual Reader khỏi `background.js` vào `cache.js` (`LHN_CACHE`), giữ nguyên key, TTL 7 ngày, touch 6 giờ, dọn 24 giờ, giới hạn 500/LRU và không cache fallback.
- File: cache.js, background.js, manifest.json, README.md, PROJECT.md.
- Kiểm tra: `node --check` 23/23 JS; manifest/HTML script paths tồn tại; mock Cache prepare/hit/fallback miss/clear đạt; `git diff --check` đạt; ZIP 58 mục có manifest gốc, cache.js và version 3.4.568. Chưa kiểm thử trình duyệt.
- Tiếp theo: rà Settings/Cache còn lại, rồi Bước 2 Translate/Dictionary/Search.
**2026-10-24 | v3.4.567 | Codex sửa:**

- Bước 1 — Settings: nối dashboard vào `LHN_SETTINGS.save` để thống nhất lưu cài đặt nền cùng popup/content; sửa helper để giữ nguyên chính xác cấu trúc object mà caller lưu, tránh tự thêm default vào dữ liệu hiện có.
- File: settings.js, dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: `node --check` 22/22 JS; manifest/HTML script paths tồn tại; Messaging calls tập trung; mock Settings resolve/get/save/subscribe đạt và xác nhận cấu trúc lưu không đổi; `git diff --check` đạt; ZIP 57 mục có manifest gốc, ba module nền tảng và version 3.4.567. Chưa kiểm thử trình duyệt.
- Tiếp theo: tách Cache/lưu trữ trong Bước 1.
**2026-10-24 | v3.4.566 | Codex sửa:**

- Bước 1 — Settings: thêm module `LHN_SETTINGS` cho resolve defaults, đọc/ghi cấu hình chung và đăng ký lắng nghe thay đổi; nối popup và content script vào helper mà không đổi UI hay tên storage key.
- File: settings.js, manifest.json, background.js, popup.html, dashboard.html, popup.js, content.js, README.md, PROJECT.md.
- Kiểm tra: `node --check` 22/22 JS; manifest/HTML script paths tồn tại; mock Settings get/save/resolve/subscribe đạt; `git diff --check` đạt; ZIP 57 mục có manifest gốc, `settings.js` và version 3.4.566. Chưa kiểm thử trình duyệt.
- Tiếp theo: tách Cache/lưu trữ trong Bước 1, sau đó tiếp tục các dịch vụ theo thứ tự OPT.
**2026-10-24 | v3.4.565 | Codex sửa:**

- Bước 1 — Messaging: thêm lớp transport dùng chung `LHN_MESSAGING` cho gửi/nhận runtime message; nạp trước consumer ở background, content, popup và dashboard. Message type/handler và xử lý nghiệp vụ giữ nguyên.
- File: messaging.js, manifest.json, background.js, content.js, dashboard.js, popup.js, error-logger.js, tts-engine.js, study-translation.js, bilingual-reader.js, popup.html, dashboard.html, README.md, PROJECT.md.
- Kiểm tra: `node --check` 21/21 JS; manifest/HTML script paths tồn tại; Messaging được nạp trước consumer; `git diff --check` đạt; ZIP 56 mục có manifest gốc, `messaging.js` và version 3.4.565. Chưa kiểm thử trình duyệt.
- Tiếp theo: tách Settings và Cache/lưu trữ trong Bước 1.
**2026-10-24 | v3.4.564 | Codex sửa:**

- Bước 1 — Languages: đổi tên module `i18n.js` thành `languages.js`, chuyển global nội bộ sang `LHN_LANGUAGES` và cập nhật các entry point/consumer; giữ nguyên bộ EN/VI/KO và chuỗi hiển thị.
- File: languages.js (đổi tên), manifest.json, popup.html, dashboard.html, popup.js, dashboard.js, content.js, bilingual-reader.js, README.md, PROJECT.md.
- Kiểm tra: `node --check` 20/20 JS; manifest/HTML tham chiếu script tồn tại; không còn tham chiếu code cũ; `git diff --check` đạt; ZIP 55 mục có manifest gốc, `languages.js` và version 3.4.564. Chưa kiểm thử trình duyệt.
- Tiếp theo: tiếp tục tách các module nền tảng còn gắn trong entry point; đây chưa phải hoàn tất kiến trúc 27 module.

**2026-10-24 | v3.4.563 | Arena sửa:**

- Theo ảnh: ô Language hẹp hơn menu vì menu tự giãn theo option. Chỉ chỉnh width trong Dashboard Settings: control lấp phần còn lại của hàng, popover rộng 100% theo control để hai mép trùng nhau. Không đổi toolbar, flashcard, style option hay logic combobox.
- File: dashboard.css, manifest.json, PROJECT.md.
- Kiểm tra: sẽ xác minh CSS, source, cú pháp và ZIP sau đóng gói; chờ user xác nhận trực quan trên Chrome/Edge.

**2026-10-24 | v3.4.562 | Arena sửa:**

- Người dùng xác nhận menu v3.4.561 chưa giống các menu khác. Thay riêng Dashboard Settings control bằng cùng pattern của toolbar popup: input/combobox tìm kiếm và list `.language-option` căn trái, cùng trạng thái dark theme. Giữ hidden native select làm nguồn giá trị và dispatch change qua luồng lưu/ngôn ngữ hiện có. Không sửa toolbar, flashcard hay select khác.
- File: dashboard.html, dashboard.js, dashboard.css, flags.css, manifest.json, PROJECT.md.
- Kiểm tra: HTML/ID duy nhất, pattern/wiring/keyboard/dark CSS, CSS parse, node --check 20/20 và git diff --check đạt. Cần người dùng xác nhận trực quan trên Chrome/Edge; sandbox không có browser executable. ZIP v3.4.562 đóng gói và kiểm tra integrity đạt.

**2026-10-24 | v3.4.561 | Arena sửa:**

- Chrome/Edge bỏ qua `text-align:right` trên `<option>` của menu native; v3.4.560 vì vậy không xử lý được dropdown đang mở. Thay riêng language picker của Dashboard Settings bằng custom listbox căn phải, hỗ trợ click/ArrowUp/Down/Home/End/Enter/Escape/Tab, focus và đóng khi click ngoài. Native `settingsLanguageSelect` được giữ ẩn làm nguồn giá trị; custom lựa chọn dispatch `change` để giữ nguyên lưu settings và đổi ngôn ngữ. Không sửa toolbar, flashcard hay các select khác.
- File: dashboard.html, dashboard.js, dashboard.css, flags.css, manifest.json, PROJECT.md.
- Kiểm tra: HTML/ID duy nhất, keyboard/dispatch wiring, CSS parse, node --check 20/20, git diff --check và ZIP integrity đạt. Cần người dùng test thực tế giao diện, bàn phím và lưu lựa chọn trên Chrome/Edge; sandbox không có browser executable.

**2026-10-24 | v3.4.560 | Arena sửa:**

- Theo xác nhận mới: dark mode và các select khác đều đạt; option list của Dashboard Settings vẫn căn trái khi mở trên Chrome/Edge. Thêm `text-align:right` chỉ cho `.settings-language-row select option`; không đổi selected value, dark-mode colors, toolbar hay flashcard.
- File: dashboard.css, manifest.json, PROJECT.md.
- Kiểm tra: sẽ xác minh CSS/source/ZIP sau đóng gói; cần user retest menu mở trên Chrome/Edge vì sandbox không có browser executable.

**2026-10-24 | v3.4.559 | Arena sửa:**

- Theo phản hồi Firefox: cờ đã render đúng nhưng giá trị đóng của language select căn trái; menu native không theo dark mode ứng dụng. Thêm `text-align-last:right` cho selected value, bật `color-scheme:dark` và màu nền/chữ/selected cho option trong dark mode. Chỉ scope `.settings-language-row`; không sửa toolbar/flashcard đã đạt.
- File: dashboard.css, manifest.json, PROJECT.md.
- Kiểm tra: source/CSS tĩnh và ZIP sẽ được xác minh sau đóng gói; cần người dùng retest trực quan trên Firefox vì sandbox không có browser executable.

**2026-10-24 | v3.4.558 | Arena cập nhật kiểm thử:**

- Người dùng xác nhận custom flag font/fallback đúng trên Chrome và Edge cho các vị trí vừa sửa. Chưa thử các trình duyệt Chromium khác; Firefox chưa có kết quả xác nhận.
- File: manifest.json, PROJECT.md. Không đổi code chức năng; tăng patch version theo quy ước và tạo ZIP v3.4.558.
- Kiểm tra: manifest MV3 v3.4.558, ZIP 55 mục và integrity đạt; không commit hoặc phát hành.

**2026-10-24 | v3.4.557 | Arena sửa:**

- Theo ảnh kiểm tra Chrome: Dashboard Settings đã đúng; cờ ở nhãn flashcard không dùng font fallback như các option; toolbar popup là combobox tùy biến chưa nạp asset cờ. Mở rộng CSS local để áp font lên nhãn cờ flashcard và input/options của popup; nạp chung `flags.css` + detector `flags.js` trong popup. Không đổi UI, text option hay hành vi chọn.
- File: manifest.json, flags.css, popup.html, PROJECT.md.
- Kiểm tra: parse popup/dashboard HTML; xác nhận popup nạp flags.css và flags.js trước popup.js, các selector CSS bao phủ #languageSearch, #languageOptions .language-option và nhãn cờ flashcard; node --check 20/20 JS, git diff --check và ZIP 55 file MV3 v3.4.557 integrity đạt. Cần người dùng retest trực quan trên Chrome; sandbox không có trình duyệt.

**2026-10-24 | v3.4.556 | Arena sửa:**

- Tăng patch version theo quy tắc phát hành sau khi phát hiện ZIP chứa toàn bộ thay đổi nhưng vẫn mang version cũ. Khôi phục ZIP `v3.4.555` từ Git baseline ban đầu và tạo ZIP hiện hành `v3.4.556` từ source tối ưu; không thay đổi version cũ.
- File: manifest.json, PROJECT.md, ZIP v3.4.555 và ZIP v3.4.556.
- Kiểm tra: baseline v3.4.555 có 51 mục, manifest MV3 v3.4.555; ZIP v3.4.556 có 55 mục, manifest MV3 v3.4.556 và chứa PROJECT/flags mới nhất. Integrity hai ZIP đạt. Không commit hoặc phát hành.

**2026-10-24 | v3.4.555 | Arena sửa:**

- OPT 3.2 Flags: native language selects được kiểm tra bằng canvas; chỉ khi trình duyệt có color emoji nhưng thiếu flag glyph mới bật CSS cục bộ. Đóng gói `TwemojiCountryFlags.woff2` (79.5 KB), giới hạn font face vào codepoints cờ và chỉ áp lên native selects trên Dashboard; không CDN, không cài font, không sửa nội dung option. Thêm giấy phép/attribution MIT + CC BY 4.0 vào `THIRD_PARTY_NOTICES.md` và `licenses/`.
- File: dashboard.html, flags.js, flags.css, fonts/TwemojiCountryFlags.woff2, licenses/LICENSE-TWEMOJI-COUNTRY-FLAGS.md, THIRD_PARTY_NOTICES.md, PROJECT.md.
- Kiểm tra: `node --check flags.js`, parse HTML, mock detection (native flags không bật fallback; thiếu flags thì bật), xác nhận CSS trỏ local và `unicode-range` giới hạn cờ. Chưa xác nhận hình ảnh giá trị đang chọn/menu mở trên Chrome, Firefox, Edge thực tế.
- Tiếp theo: chạy kiểm tra tổng thể; không commit, tăng version, ZIP hoặc phát hành.

**2026-10-24 | v3.4.555 | Arena sửa:**

- OPT 5.3 Fonts: font stack `system-ui` là font cục bộ nhưng trước đây cả `custom-font.js` lẫn Reader vẫn gắn/tải stylesheet Google Fonts. Nay stack system vẫn áp dụng như cũ nhưng không tải stylesheet/font từ mạng; nếu chuyển từ hosted font sang system, stylesheet cũ được gỡ. Font Google được chọn vẫn tải theo nhu cầu và dùng chung link hiện có; tắt font vẫn không tải.
- File: custom-font.js, bilingual-reader.js, PROJECT.md.
- Kiểm tra: cú pháp và `git diff --check` đạt; mock xác nhận system không tải stylesheet/FontFaceSet, hosted font tạo một link, disabled không tải, Reader system áp dụng stack mà không gọi tải font. Chưa kiểm thử mạng/font rendering thực tế trên Chrome/Firefox/Edge.
- Tiếp theo: kiểm tra tổng thể sau các bước tối ưu; không commit, tăng version, ZIP hoặc phát hành.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 4.5 Backup: import lọc trực tiếp các cửa sổ tối đa 500 item từ mảng đầu vào thay vì tạo thêm mảng `incoming` toàn cục rồi cắt batch; giữ thứ tự, tiêu chí bỏ bản ghi lỗi, xử lý trùng ID và một thông báo refresh. JSON export đã stream theo batch nên giữ nguyên.
- File: background.js, PROJECT.md.
- Kiểm tra: `node --check background.js` và `git diff --check` đạt; mock 1.005 dòng xác nhận batch ≤500, 995 bản ghi hợp lệ nhập đúng thứ tự, bản ghi lỗi bỏ qua, ID trùng xử lý và chỉ một refresh. Chưa kiểm thử file lớn/runtime trên Chrome/Firefox.
- Tiếp theo: rà mục Fonts trong OPT 5.3, rồi kiểm tra tổng thể dự án.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 4.4 Library: `applyAnnotationChange(deletePage)` compact danh sách annotations còn lại trong một lượt thay vì gọi `splice` lặp lại cho từng mục bị xóa; giữ thứ tự ổn định, xóa ID đã xóa và cập nhật vị trí ID trong cùng O(n).
- File: dashboard.js, PROJECT.md.
- Kiểm tra: `node --check dashboard.js` và `git diff --check` đạt; mock xác nhận thứ tự, hai index ID/vị trí, vô hiệu cache và render giữ đúng; nhánh xóa trang không còn `splice` lặp. Chưa kiểm thử Library thực tế trên Chrome/Firefox. (Một assert harness ban đầu quá rộng vì bắt nhầm `splice` của nhánh xóa một item; harness đã thu hẹp đúng nhánh và PASS.)
- Tiếp theo: rà Backup theo OPT.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 4.3 Flashcards: chuyển kiểm tra request dịch câu đang in-flight lên trước `storage.local.get`; `renderStudyCard` có thể prefetch lại cùng câu kế tiếp khi vẽ lại, nên các lần đó nay dùng chung Promise mà không đọc storage thêm. Cache, quota, queue và giới hạn tốc độ không đổi.
- File: study-translation.js, PROJECT.md.
- Kiểm tra: `node --check study-translation.js` và `git diff --check` đạt; mock xác nhận hai caller đang chạy chia sẻ một provider/quota, chỉ một storage read, kết quả được persist một lần và lần sau dùng memory cache. Chưa kiểm thử UI/runtime trên Chrome/Firefox.
- Tiếp theo: rà Library rồi Backup theo OPT.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 4.2 Sidebar: input Search debounce theo 80 ms đã dùng chung trong cấu hình; trường tìm kiếm của mỗi object annotation được chuẩn hóa/lowercase một lần và WeakMap tái sử dụng khi lọc/xếp hạng trên các lần gõ tiếp theo. Không đổi markup/thứ tự/UI.
- File: content.js, PROJECT.md.
- Kiểm tra: `node --check content.js` và `git diff --check` đạt; mock xác nhận trường tìm kiếm được cache theo object, dùng lại cùng tham chiếu và làm mới với object annotation mới. Chưa kiểm thử tương tác thực tế trên Chrome/Firefox.
- Tiếp theo: rà Flashcards trong Bước 4, rồi Library và Backup theo OPT.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 3.2 SentenceNote/Note Composer: giữ nguyên cách trích sentence theo DOM hiện tại (chỉ chạy khi bật và mở composer; không cache DOM động). Composer bỏ qua `UPDATE` chỉ khi mọi trường được ghi (quote, note, sentence, metadata trang, context, color, tags, createdAt) trùng chính xác và chặn submit trùng trong lúc lưu.
- File: content.js, PROJECT.md.
- Kiểm tra: `node --check content.js` và `git diff --check` đạt; mock xác nhận cùng nội dung được nhận diện là no-op, thay đổi từng trường được giữ lại để lưu và guard chống submit trùng hiện diện. Chưa kiểm thử runtime trên Chrome/Firefox.
- Tiếp theo: rà Sidebar trong Bước 4, rồi Flashcards, Library và Backup theo OPT.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 4.1 Reader: `pageObserver` không còn đánh dấu cache và quét lại khung DOM khi TTS/site Reader tắt và Lazy Translate không hoạt động; giữ debounce 900 ms khi tính năng cần thiết hoạt động, đồng thời hủy lần quét đã đặt lịch nếu site bị tắt trước khi timer chạy. Khi Reader được bật lại, cache được đánh dấu dirty để lần đọc kế tiếp thấy nội dung mới. Lazy Translate vẫn độc lập với danh sách website tắt Reader.
- File: bilingual-reader.js, PROJECT.md.
- Kiểm tra: `node --check bilingual-reader.js` và `git diff --check` đạt; mock observer đạt các nhánh idle, TTS, site/global-disable, Lazy-only và timer bị hủy. Chưa kiểm thử runtime trên Chrome/Firefox.
- Tiếp theo: hoàn tất rà SentenceNote/Note Composer trong Bước 3, rồi tiếp tục Sidebar, Flashcards, Library và Backup theo OPT.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 3.1: `getBatch` dùng `IDBKeyRange.lowerBound` cho phân trang toàn cục để bắt đầu sau ID cuối thay vì quét rồi bỏ qua các trang trước; truy vấn theo URL giữ nguyên. Highlighter trả về sớm khi trang không có annotation cần khôi phục, tránh truy vấn DOM marks không cần thiết.
- File: background.js, content.js, PROJECT.md.
- Kiểm tra: mock IndexedDB xác nhận global cursor bắt đầu trực tiếp sau ID và URL pagination giữ bộ lọc/thứ tự; `node --check` background.js/content.js đạt. Chưa kiểm thử hiệu năng hoặc runtime trên Chrome/Firefox.
- Tiếp theo: hoàn tất rà SentenceNote/Note Composer trong Bước 3.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 2.3: gộp Dictionary translation đang chạy theo khóa text/đích trong cùng AbortSignal; các popup/request có signal khác nhau vẫn độc lập để giữ hành vi hủy an toàn. Rà Search: Dashboard đã debounce input và tái sử dụng metadata tìm kiếm, không cần sửa.
- File: content.js, PROJECT.md.
- Kiểm tra: `node --check content.js` đạt; mock xác nhận request trùng cùng signal chỉ gọi provider một lần, signal khác không bị gộp, kết quả cache vẫn tái sử dụng. Chưa kiểm thử trên Chrome/Firefox.
- Tiếp theo: rà Bước 3 (Annotations, Highlighter, SentenceNote, Note Composer); tiếp tục tự chủ theo chỉ đạo người dùng.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 2.2: gộp request TTS audio đang chạy theo khóa language/voice/text đã chuẩn hóa, tránh gọi Google và trừ quota lặp; voice hoặc text khác vẫn là request riêng.
- File: background.js, PROJECT.md.
- Kiểm tra: `node --check` đạt cho 19 file JavaScript; mock concurrency xác nhận hai caller cùng request chỉ tạo một fetch và một lần consume quota, request sau dùng cache, voice khác tạo fetch riêng. `git diff --check` đạt. Chưa kiểm thử audio runtime trên Chrome/Firefox.
- Tiếp theo: tiếp tục rà TTS, Dictionary và Search; không phát hành hoặc tăng version giữa các bước.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 2.1: gộp các yêu cầu dịch Bilingual Reader đang chạy có cùng ngôn ngữ/text vào một Promise; nội dung khác nhau vẫn chạy độc lập, fallback không được lưu và request được xóa khỏi Map sau khi hoàn thành.
- File: background.js, PROJECT.md.
- Kiểm tra: `node --check` đạt cho 19 file JavaScript; mock xác nhận hai yêu cầu trùng chỉ tạo một lượt provider, nội dung khác tạo lượt riêng, fallback vẫn retry và cache/LRU không bị ảnh hưởng. `git diff --check` đạt. Chưa kiểm thử trên Chrome/Firefox.
- Tiếp theo: tiếp tục rà TTS, Dictionary và Search theo Bước 2; không phát hành hoặc tăng version giữa các bước.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước 1.3: đặt ngân sách độc lập cho cache dịch (500 mục; khi vượt 550, LRU giảm về 500; TTL trượt 7 ngày) và audio TTS (200 mục; khi vượt 250, LRU giảm về 200). Cập nhật dấu dùng gần nhất tối đa mỗi 6 giờ; giữ UI không đổi.
- File: background.js, PROJECT.md.
- Kiểm tra: `node --check` đạt cho 19 file JavaScript; mock dịch xác nhận touch/TTL, dọn hết hạn, eviction LRU và Clear Cache; mock IndexedDB xác nhận TTS trim 251 mục về 200 và bỏ mục ít dùng nhất. `git diff --check` đạt. Chưa kiểm thử trên Chrome/Firefox.
- Tiếp theo: tiếp tục Bước 2; kiểm thử trình duyệt vẫn cần ở đợt hồi quy trước phát hành.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước tối ưu 1.2: chuyển cache Bilingual Reader từ một object lớn sang storage key riêng cho từng bản dịch; key băm có độ dài cố định, bản ghi xác thực khóa gốc. Xóa object cache cũ một lần (theo lựa chọn của người dùng), giữ TTL 7 ngày, dọn mục hết hạn theo chu kỳ 24 giờ và cập nhật Clear Cache để xóa cả key cũ lẫn key mới.
- File: background.js, PROJECT.md.
- Kiểm tra: `node --check` đạt cho 19 file JavaScript; mock harness đạt cho xóa cache cũ nhưng giữ settings, key độc lập/cache hit, fallback không được lưu, dọn mục hết hạn và Clear Cache; `git diff --check` đạt. Manifest vẫn MV3 v3.4.555. Chưa kiểm thử trên Chrome/Firefox.
- Tiếp theo: người dùng đã cho phép tiếp tục tự chủ; kiểm thử Chrome/Firefox vẫn chưa chạy.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bước tối ưu 1.1: Bilingual Reader vẫn trả fallback khi các engine dịch lỗi nhưng không lưu fallback mới; các fallback hợp lệ đã lưu trước đây bị bỏ qua để thử dịch lại. Bản dịch thành công vẫn cache như trước.
- File: background.js, PROJECT.md.
- Kiểm tra: `node --check background.js` đạt; mock harness xác nhận bỏ qua fallback cũ, không lưu fallback khi tất cả engine lỗi, vẫn lưu và tái sử dụng bản dịch thành công; `git diff --check` đạt. Chưa kiểm thử trên Chrome/Firefox.
- Tiếp theo: người dùng chấp thuận tiếp tục sang Bước 1.2; chưa kiểm thử trên Chrome/Firefox.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bỏ bullet trước tiêu đề các mục 5.1–5.5, khôi phục dấu chấm sau số và giữ phần nội dung thụt vào bên dưới.
- File: AGENTS.md, PROJECT.md.
- Kiểm tra: xác nhận tiêu đề không còn bullet đầu dòng, nội dung bắt đầu ở dòng kế tiếp; không đổi version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bỏ dấu chấm thừa sau số ở tiêu đề các tiểu mục 5.1–5.5 trong `AGENTS.md`.
- File: AGENTS.md, PROJECT.md.
- Kiểm tra: xác nhận cách viết số mục mới và giữ nguyên nội dung; không đổi version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Định dạng lại các mục 5.1–5.5 trong `AGENTS.md`: tiêu đề ngắn in đậm, canh hàng; nội dung xuống dòng và thụt vào bên dưới.
- File: AGENTS.md, PROJECT.md.
- Kiểm tra: xác nhận các mục thẳng hàng và giữ nguyên quy tắc watcher, đường dẫn, version/đóng gói.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Đánh số phân cấp các mục trong `AGENTS.md`: sáu mục lớn và năm tiểu mục quy trình.
- File: AGENTS.md, PROJECT.md.
- Kiểm tra: xác nhận số mục tăng đúng thứ tự và nội dung quy tắc được giữ; không đổi version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Làm rõ cách tham khảo `OPT-ARENA.md`: đọc phần liên quan khi sửa; chỉ đọc toàn bộ khi cần đối chiếu tính nhất quán, không bắt buộc đọc lại mỗi bước.
- File: AGENTS.md, PROJECT.md.
- Kiểm tra: xác nhận câu hướng dẫn mới và giữ nguyên version/lịch sử.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Đồng bộ quy tắc AGENTS với phân vai tài liệu: không bắt buộc đọc lại toàn bộ OPT mỗi bước; PROJECT giữ trạng thái và tóm tắt kiểm thử, OPT chỉ giữ thiết kế/phạm vi/quy trình.
- File: AGENTS.md, PROJECT.md.
- Kiểm tra: xác nhận quy tắc đọc file và nguồn nội dung; giữ nguyên watcher/đường dẫn Windows, không đổi version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Rút gọn phần diễn giải trong `OPT-ARENA.md`, giữ đủ ý chính và toàn bộ sơ đồ text.
- File: OPT-ARENA.md, PROJECT.md.
- Kiểm tra: 213 → 198 dòng; 7 sơ đồ giữ nguyên từng byte; 22 tiêu đề vẫn đánh số phân cấp.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Gom thiết kế tính năng đã chốt và ý tưởng tham khảo vào mục `Kế hoạch sắp tới` ở cuối `OPT-ARENA.md`; đánh số phân cấp mọi tiêu đề.
- File: OPT-ARENA.md, PROJECT.md.
- Kiểm tra: đối chiếu đủ 7 sơ đồ text, thứ tự mục và cấp số; không đổi version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Tóm lược phần diễn giải trong `OPT-ARENA.md` để dễ đọc lại; giữ nguyên toàn bộ sơ đồ text và các thiết kế, mục tiêu/phạm vi, quy trình.
- File: OPT-ARENA.md, PROJECT.md.
- Kiểm tra: 7 sơ đồ giữ nguyên từng byte; file rút từ 252 xuống 209 dòng; không còn nhật ký bước hoàn tất trong OPT.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Làm rõ định dạng năm mục là yêu cầu báo cáo trên khung chat, không yêu cầu ghi từng báo cáo bước vào biên bản `OPT-ARENA.md`.
- File: OPT-ARENA.md, PROJECT.md.
- Kiểm tra: xác nhận câu mới thay đúng câu cũ, giữ nguyên các mục nhật ký; không đổi version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Chuẩn hóa vai trò tài liệu: OPT-ARENA chỉ còn thiết kế, sơ đồ, mục tiêu/phạm vi và quy trình; bỏ trạng thái bước cùng nhật ký hoàn thành, không tạo archive mới.
- File: AGENTS.md, PROJECT.md, README.md, OPT-ARENA.md.
- Kiểm tra: xác nhận phần thiết kế/quy trình được giữ, log tiến độ chỉ ở PROJECT, README không chứa theo dõi nội bộ; kiểm tra diff/ZIP, không tăng version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Phân vai tài liệu: AGENTS quy định workflow/nguồn sự thật; PROJECT giữ handoff ngắn; README hướng người dùng; OPT-ARENA lưu chi tiết tối ưu và bằng chứng.
- File: AGENTS.md, PROJECT.md, README.md, OPT-ARENA.md.
- Kiểm tra: đối chiếu ranh giới/nội dung, giữ nguyên việc đang mở và lịch sử; kiểm tra diff/ZIP, không tăng version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Đánh số hai tiêu đề cuối trong `PROJECT.md` thành mục 4 (Bản đồ file) và mục 5 (Nhật ký dự án) để khớp thứ tự 1–5.
- File: PROJECT.md, OPT-ARENA.md.
- Kiểm tra: xác nhận thứ tự tiêu đề, bảo toàn các mục nhật ký cũ và kiểm tra ZIP; không tăng version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Sắp xếp bốn mục trạng thái, việc đang mở, ràng buộc và bản đồ file lên trước nhật ký để agents thấy thông tin hành động trước; giữ nhật ký liên tục mới nhất → cũ nhất.
- File: PROJECT.md, OPT-ARENA.md.
- Kiểm tra: so sánh nội dung bốn mục và thứ tự toàn bộ lịch sử; kiểm tra diff/ZIP, không tăng version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Làm rõ quy tắc phải ghi đúng tên tác nhân thực hiện từng thay đổi, gồm các ví dụ AI và trường hợp Huuson trực tiếp sửa.
- File: AGENTS.md, PROJECT.md.
- Kiểm tra: xác nhận câu mới, thứ tự nhật ký, diff và ZIP; không thay đổi version.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Mở rộng quy định tăng version trong `AGENTS.md` để áp dụng với thay đổi phát hành của bất kỳ tác nhân nào.
- File: AGENTS.md, PROJECT.md.
- Kiểm tra: xác nhận câu hướng dẫn mới, giữ nguyên version và lịch sử nhật ký; xác minh diff/ZIP.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Bổ sung vào `AGENTS.md` quy định dùng một mẫu nhật ký thống nhất, in đậm tiêu đề và ghi đúng AI/người thực hiện.
- File: AGENTS.md, PROJECT.md.
- Kiểm tra: rà soát mẫu bắt buộc, attribution đúng tác nhân, giữ lịch sử cũ và xác minh diff/ZIP.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Gom nhật ký về một mục duy nhất ở đầu `PROJECT.md`, xếp mới → cũ; chuyển trạng thái, việc đang mở và các mục tham khảo xuống dưới.
- File: PROJECT.md, OPT-ARENA.md.
- Kiểm tra: rà soát thứ tự thời gian, loại mục trùng và giữ nguyên tác giả lịch sử; xác minh diff và ZIP sau khi đóng gói.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Khôi phục lịch sử còn thiếu từ file PROJECT.md bạn gửi: hai mục gần đây, 30 changelog v3.4.533–v3.4.501 và mục lịch sử ZIP/trước Git; giữ nguyên tác giả lịch sử.
- File: PROJECT.md, OPT-ARENA.md.
- Kiểm tra: 301 dòng thêm, không xóa dòng; diff check và ZIP v3.4.555 integrity đạt.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Đổi tên nhật ký thành `OPT-ARENA.md`, cập nhật tham chiếu và quy tắc nhãn sửa.
- File: AGENTS.md, OPT-ARENA.md, PROJECT.md.
- Kiểm tra: xác nhận tên file/tham chiếu; ZIP v3.4.555 gồm 51 file, integrity đạt; ZIP v3.4.554 giữ nguyên.

**2026-10-24 | v3.4.555 | Arena sửa:**

- Reader chỉ tải stylesheet web font khi có font được chọn; `custom-font.js` dùng chung link và gỡ khi tắt.
- File: bilingual-reader.js, custom-font.js, manifest.json, PROJECT.md, OPT-ARENA.md.
- Kiểm tra: mock hai thứ tự khởi tạo, syntax JS, manifest, diff và ZIP integrity đạt; người dùng xác nhận v3.4.555 đúng, chưa nêu trình duyệt.

**2026-10-24 | v3.4.554 | Arena sửa:**

- Chỉ gắn Google Fonts khi custom font được bật/chọn; gỡ stylesheet khi tắt hoặc site bị disable.
- File: custom-font.js, README.md, PRIVACY-POLICY.md, OPT-ARENA.md, PROJECT.md, manifest.json.
- Kiểm tra: mock DOM/storage, syntax JS, manifest, diff; ZIP thử 51 file đã tạo. Chưa thử Chrome/Firefox thật.

**2026-10-24 | v3.4.553 | Arena sửa:**

- Soạn LICENSE độc quyền và Privacy Policy EN/VI; gom license bên thứ ba, thêm Apache-2.0 cho Readability và cập nhật README.
- File: LICENSE, PRIVACY-POLICY.md, THIRD_PARTY_NOTICES.md, licenses/*, README.md, PROJECT.md.
- Kiểm tra: link, license, coverage policy, syntax JS, manifest và diff đạt; còn placeholder, chưa rà soát store/trình duyệt.

**2026-10-24 | v3.4.553 | Arena sửa:**

- Đặt tốc độ riêng cho ngôn ngữ hiển thị mặc định 1.25×; global 1.0×, flashcard độc lập 1.2×.
- File: config.js, dashboard.js, dashboard.html, PROJECT.md.
- Kiểm tra: syntax JS, manifest, mock giá trị/biên/format và diff đạt; chưa kiểm tra trên trình duyệt.

**2026-10-23 | v3.4.553 | Claude sửa:**

- Khi dùng giọng Google, mỗi lần tải hoặc phát âm thanh lỗi (trừ lỗi hết lượt) hiện toast đen "Mạng chậm, đang tải âm thanh" (EN/VI/KO, key googleAudioSlowToast). tts-engine.js thêm hook onGoogleAudioSlow, chỉ gọi khi lượt đọc còn active; content.js (Speak popup) dùng showSidebarToast, bilingual-reader.js dùng showReaderToast. Không đổi UI/CSS, dashboard (flashcard) chưa nối.
- File: tts-engine.js, content.js, bilingual-reader.js, i18n.js, manifest.json, PROJECT.md.
- Kiểm tra: Đã chạy node --check 4 file và test mock engine 4 ca (không strict, strict 3 lần, đã dừng, hết lượt); chưa kiểm tra trên trình duyệt.
- Tiếp theo: tắt mạng/giả lập mạng chậm rồi bấm đọc để xem toast.
- Lưu ý: ở chế độ không strict, toast hiện rồi đoạn đó đọc bằng giọng trình duyệt.

**2026-10-23 | v3.4.552 | Claude sửa:**

- Full dict tách IPA thành fetchIpa(word, lang, signal) chạy song song với dịch và Datamuse (không chờ Datamuse). Nguồn 1 dictionaryapi.dev phonetics[].text; nguồn 2 Google dt=rm đổi sang IPA bằng convertGoogleToIPA (tiện ích trong content.js, globalThis.LHN_IPA_UTILS); timeout 3 giây mỗi nguồn, dùng AbortSignal của popup. Chọn nguồn 1, không có thì nguồn 2 (lưu ipaApprox, gắn data-approx, không đổi giao diện), không có thì không vẽ .lhn-dict-ipa. Bỏ audio. Ngôn ngữ nguồn full dict ép en (đọc từ, chip Colloc), không dùng auto. Cache giữ nguyên key/TTL; mục cache cũ có ipa trùng từ sẽ bị ẩn.
- File: content.js, manifest.json, PROJECT.md.
- Kiểm tra: Đã chạy node --check và test mock (đổi ký âm, 6 ca fetchIpa gồm timeout 3s và abort); chưa chạy trên trình duyệt thật, chưa gọi mạng thật.
- Tiếp theo: tra thử từ trên Chrome/Firefox, xem IPA và từ không có IPA.

**2026-10-23 | v3.4.551 | Claude sửa:**

- (1) Select Voice: ô tìm kiếm tự focus trên mọi trình duyệt Chromium (Chrome, Edge,...) và Firefox bằng cách thử focus lại tối đa 5 lần (30/100/250/500ms) cho tới khi nhận được; chưa tái hiện được lỗi Edge nên chưa biết nguyên nhân gốc. (2) Thêm phím Alt+L (selectVoiceShortcut, mặc định Alt+L, đổi được) bấm vào icon cờ để mở Select Voice trên thanh đọc, chỉ khi đang đọc và thanh hiện, tuân theo công tắc Keyboard shortcuts của Reader; thêm dòng "Select voice reader" (EN/VI/KO) dưới Decrease reading speed ở Dashboard > Settings > Keyboard shortcuts, cùng markup với các dòng cũ, có trong Reset. (3) AGENTS.md: đổi tiêu đề thành "Keepit Working Rules for all AI (Codex/Claude,..)", thêm giới thiệu dự án và quy tắc UI mới phải giống giao diện tổng thể. (4) Viết lại README.md (tiếng Anh) theo hiện trạng dự án.
- File: bilingual-reader.js, content.js, config.js, dashboard.html, dashboard.js, i18n.js, manifest.json, AGENTS.md, README.md, PROJECT.md.
- Kiểm tra: Đã chạy node --check 5 file JS, parse manifest, test mock focus (3 ca) và handler Alt+L (3 ca); chưa kiểm tra trên trình duyệt thật.
- Tiếp theo: thử focus ô search trên Edge/Chrome/Firefox; thử Alt+L và dòng cài đặt mới trên Dashboard.

**2026-10-23 | v3.4.550 | Claude sửa:**

- Select Voice của Bilingual Reader đổi cờ (lhn-br-flag) và tooltip ngay khi bấm chọn Auto, ngôn ngữ Google hoặc giọng trình duyệt, kể cả lúc pause/play, không chờ lưu xong hay đoạn kế tiếp. Nguyên nhân cũ: ngôn ngữ đoạn Google đang đọc (readingSegment) luôn thắng nên cờ đứng yên, và nhánh giọng trình duyệt không xóa nó. Thêm voiceFlagOverride (xóa sau khi lưu xong hoặc lưu lỗi), speakNext nhánh giọng trình duyệt xóa readingSegment; không động vào settings trước khi lưu nên restart khi đổi giọng giữ nguyên. Không đổi UI.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: Đã chạy node --check và test mock 6 ca đổi cờ (Google đang đọc, pause, browser sang Google, Google sang browser, Auto, lưu lỗi) cùng 6 ca speakNext; chưa kiểm tra trên trình duyệt.
- Tiếp theo: xác nhận cờ đổi ngay trên Chrome/Firefox khi đang đọc, pause và dừng.
- Lưu ý: đang pause với Google, đổi giọng rồi Play vẫn tiếp tục audio cũ (resumeGoogle), chưa xử lý.

**2026-10-23 | v3.4.549 | Claude sửa:**

- Bilingual Reader với giọng trình duyệt đã chọn luôn dùng đúng giọng đó, không còn tự đổi sang giọng US theo ngôn ngữ đoạn (kể cả khi Auto-detect bật). Khớp theo voiceURI rồi theo tên (không phân biệt hoa thường); chờ voiceschanged tối đa 1s trước khi kết luận thiếu. Không có giọng thì ghi console.error, dừng đọc, hiện toast "Giọng “{name}” không có trên trình duyệt này" (EN/VI/KO), không đổi giọng. Không đổi UI; không chia đoạn cho giọng trình duyệt.
- File: bilingual-reader.js, i18n.js, manifest.json, PROJECT.md.
- Kiểm tra: Đã chạy node --check, parse manifest và test mock 6 ca (có giọng, khớp theo tên, thiếu, xuất hiện sau voiceschanged, không chọn giọng, request cũ); chưa kiểm tra trên trình duyệt.
- Tiếp theo: chọn Google Bahasa Indonesia trên Chrome và xem có đọc được không; trên Firefox xác nhận toast khi thiếu giọng; để ý giọng Google mạng dừng giữa chừng với đoạn dài.

**2026-10-23 | v3.4.548 | Claude sửa:**

- Select Voice chia hai nhóm có tiêu đề: "Ngôn ngữ (Google TTS)" (21 ngôn ngữ) và "Giọng trình duyệt" (giọng hệ thống, tên thêm hậu tố "(Browser)"); Auto đứng đầu không thuộc nhóm; nhóm rỗng khi tìm kiếm thì ẩn tiêu đề; phím Up/Down bỏ qua tiêu đề. Thêm toast đen của app (#lhn-sidebar-toast) khi: Google voice lỗi sau 3 lần thử (dừng đọc), hết lượt Google (chuyển sang giọng trình duyệt), giọng trình duyệt lỗi phát. Toast có 3 ngôn ngữ EN/VI/KO.
- File: bilingual-reader.js, tts-engine.js, i18n.js, manifest.json, PROJECT.md.
- Kiểm tra: Đã chạy node --check, kiểm tra i18n 3 ngôn ngữ, test mock 10 ca vẽ danh sách/tìm kiếm, 5 ca strictVoice, 1 ca thông báo hết lượt một lần; chưa kiểm tra giao diện trên trình duyệt. Chưa có toast cho lỗi dịch (translateBlock chỉ console.warn).
- Tiếp theo: xác nhận giao diện nhóm và toast trên Chrome/Firefox; xem lỗi thật của giọng Google Bahasa Indonesia qua toast/console.

**2026-10-23 | v3.4.547 | Claude sửa:**

- Bilingual Reader với voice Google không còn tự chuyển sang giọng trình duyệt khi một đoạn Google TTS lỗi: thử lại Google tối đa 3 lần (chờ 0,5s rồi 1s); vẫn lỗi thì dừng đọc và ghi console.error, không đổi giọng. Chỉ chuyển sang giọng trình duyệt khi hết lượt dùng (lỗi usage limit). Cờ strictVoice chỉ bật ở Bilingual Reader; chọn text và flashcard giữ nguyên cách cũ.
- File: tts-engine.js, bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: Đã chạy node --check và test mock 5 ca (Google OK, lỗi tạm thời, lỗi kéo dài, hết lượt, nhánh không strict); chưa kiểm tra trên trình duyệt. CHƯA xác định nguyên nhân thật khiến Google TTS lỗi với tiếng Indonesia.
- Tiếp theo: chọn Indonesian khi đang đọc, nếu dừng thì xem console.error để biết lỗi (HTTP/Referer/audio); quyết định có áp dụng strict cho popup chọn text không.

**2026-10-23 | v3.4.546 | Claude sửa:**

- Select Voice của Bilingual Reader dùng bàn phím: khi popover đang mở, Up/Down di chuyển mục đang chọn trong danh sách (kẹp ở đầu/cuối, bắt đầu từ mục đang dùng), Enter chọn mục đó. Chỉ khi Select Voice mở mới chặn Up/Down, nên phím chỉnh tốc độ giữ nguyên ở lúc khác. Mục đang chọn bằng phím có nền hover và viền accent (class lhn-kb-active).
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: Đã chạy node --check và test mock logic phím (8 ca); chưa kiểm tra trên trình duyệt.
- Tiếp theo: xác nhận Up/Down/Enter trong Select Voice trên Chrome/Firefox, kể cả khi con trỏ đang ở ô tìm kiếm.

**2026-10-23 | v3.4.545 | Claude sửa:**

- AGENTS.md thêm quy tắc ghi rõ người sửa (Claude/Codex/Huuson) trong mỗi mục nhật ký. Select Voice của Bilingual Reader có đủ 21 ngôn ngữ kèm cờ (gồm Việt Nam), tìm theo tên/bản địa/mã/quốc gia, không phân biệt dấu. Chọn ngôn ngữ giữ voiceMode=google và đặt ngôn ngữ đọc (readLanguage); cờ ở thanh dưới đổi theo. Chọn Auto hoặc giọng trình duyệt thì xóa readLanguage.
- File: tts-engine.js, bilingual-reader.js, AGENTS.md, manifest.json, PROJECT.md.
- Kiểm tra: Đã chạy node --check và test mock (lưu/đọc readLanguage, 21 cờ, tìm kiếm); chưa kiểm tra UI trên trình duyệt.
- Tiếp theo: xác nhận chọn Vietnamese đọc đúng tiếng Việt và cờ VN đổi theo trên Chrome/Firefox.

**2026-10-23 | v3.4.534 | Codex sửa:**

- Bilingual Reader chạy đồng thời các engine dịch và dùng bản dịch thành công đầu tiên, tránh chờ timeout tuần tự từng engine.
- File: background.js, manifest.json, PROJECT.md.
- Kiểm tra: Đã chạy node --check và git diff --check; chưa đo trực tiếp độ trễ trên trình duyệt.
- Tiếp theo: kiểm tra thời gian Alt+A/Alt+D trên trang thực tế.

**2026-10-23 | v3.4.533 | Codex sửa:**

- Thêm Auto highlight vào Toolbar settings, dùng chung `autoHighlight` với Dashboard > Highlights & Notes; mặc định tắt ở cài đặt mới.
- File: config.js, popup.html, popup.js, dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check cho config.js, popup.js, dashboard.js và git diff --check; chưa kiểm tra UI trên trình duyệt.

**2026-10-23 | v3.4.532 | Codex sửa:**

- Giá trị khởi tạo Your speed cho Custom rate for display language là 1.2; giữ ưu tiên tốc độ riêng đã lưu.
- File: dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, git diff --check và tính toán mặc định; chưa kiểm tra UI trên trình duyệt.

**2026-10-23 | v3.4.531 | Codex sửa:**

- Đồng bộ khoảng cách mô tả Disable reader on websites với form thêm domain thành 16px.
- File: dashboard.css, manifest.json, PROJECT.md.
- Kiểm tra: git diff --check; chưa kiểm tra UI trên trình duyệt.

**2026-10-23 | v3.4.530 | Codex sửa:**

- Seed danh sách 27 website mặc định tắt Reader một lần, hợp nhất với danh sách hiện có và giữ domain người dùng đã xóa.
- File: config.js, dashboard.js, bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, git diff --check và 3 ca migration; chưa kiểm tra trên trình duyệt.

**2026-10-23 | v3.4.529 | Codex sửa:**

- Gộp Reader settings thành một mục; khi Enable reader tắt, các tùy chọn phụ bị mờ và khóa tương tác.
- File: dashboard.html, dashboard.js, dashboard.css, manifest.json, PROJECT.md.
- Kiểm tra: node --check, cấu trúc/ID UI và git diff --check; chưa kiểm tra trên trình duyệt.

**2026-10-23 | v3.4.528 | Codex sửa:**

- Thêm Enable reader và danh sách website tắt Reader có thể thêm, sửa, xóa; vô hiệu hóa các tùy chọn liên quan khi reader tắt.
- File: dashboard.html, dashboard.js, bilingual-reader.js, i18n.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check 3 JS, liên kết UI và git diff --check; chưa kiểm tra trên trình duyệt.

**2026-10-23 | v3.4.527 | Codex sửa:**

- Thu hẹp dải ký tự nhận dạng Bengali và Devanagari, ưu tiên Bengali trước Hindi.
- File: tts-engine.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, kiểm tra dải ký tự và git diff --check; chưa kiểm tra TTS trên trình duyệt.

**2026-10-23 | v3.4.526 | Codex sửa:**

- Hợp nhất voiceMode/browserVoiceURI cho chọn text và Bilingual Reader; thêm nhận dạng cục bộ và nhận diện Google nền cho Latin; giữ thiết lập giọng flashcard nguyên trạng.
- File: tts-engine.js, background.js, content.js, bilingual-reader.js, dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, 12 câu mẫu, cache/fallback, manifest và git diff --check; chưa kiểm tra Chrome/Firefox.

**2026-10-23 | v3.4.525 | Codex sửa:**

- Lớp phủ absolute có z-index và các dialog/listbox/menu/tooltip được nhận diện ngoài fixed/sticky; nền lớp phủ giữ đục theo theme để nội dung phía sau không xuyên qua.
- File: custom-font.js, PROJECT.md.
- Kiểm tra: đã chạy node --check và git diff --check; chưa kiểm tra trực quan trên Google Search.

- Sửa layer nổi fixed/sticky bị trong suốt bằng nhận diện vị trí từ computed style và gán nền theo theme; thêm Default/Dracula trong dashboard, ba ngôn ngữ.
- File: custom-font.js, dashboard.html, dashboard.js, i18n.js, PROJECT.md.
- Kiểm tra: đã chạy node --check, parse manifest JSON, git diff --check; chưa kiểm tra trực quan trên website.

- File: custom-font.js, dashboard.js, bilingual-reader.js, PROJECT.md.
- Kiểm tra: đã chạy node --check và git diff --check; chưa kiểm tra trực quan trên Google/trang web.

- File: dashboard.html, dashboard.js, i18n.js, bilingual-reader.js, PROJECT.md.
- Kiểm tra: đã chạy node --check, parse manifest JSON và git diff --check; chưa kiểm tra trực quan trên trình duyệt.

- Browser TTS không phát khi thiếu voice cùng ngôn ngữ; hiện toast “Trình duyệt bạn không hỗ trợ ngôn ngữ này”. Engine dừng phần còn lại của yêu cầu.
- File: content.js, dashboard.js, bilingual-reader.js, tts-engine.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check các script, parse manifest JSON và git diff --check đều đạt; chưa xác nhận trên trình duyệt.

**2026-10-23 | v3.4.524 | Codex sửa:**

- TTS engine đọc `lhnSettings.speechVoice`; Browser voice phát từng đoạn bằng giọng trình duyệt, không gọi Google TTS.
- File: tts-engine.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check và test mock xác nhận browser voice bỏ qua API Google; chưa thử trên trình duyệt.
- Tiếp theo: xác nhận phát âm thật trên Chrome/Firefox.

**2026-10-23 | v3.4.523 | Codex sửa:**

- Sửa nhận diện paragraph có chữ nằm trong inline element; ép câu hỏi phỏng vấn VnExpress vào main reader queue.
- Hover hiện icon cho đoạn chữ ở mọi chế độ; icon ngoài main chỉ đọc block đã bấm.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: kiểm tra DOM thật, node --check, parse manifest, git diff --check; chưa phát TTS thực tế.

**2026-10-23 | v3.4.522 | Codex sửa:**

- Thêm đoạn question trong `.fck_detail` vào queue main; semantic paragraphs có inline text vẫn nhận icon; hover hiện icon ở mọi chế độ.
- Bấm icon ngoài main đọc riêng block được chọn; trong main giữ queue hiện tại.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, parse manifest, git diff --check và markup DOM; chưa phát thử trên trình duyệt.

**2026-10-23 | v3.4.521 | Codex sửa:**

- Giữ câu hỏi phỏng vấn italic kết thúc bằng dấu hỏi; icon ngoài main hiện khi hover ở mọi chế độ và chỉ đọc block được bấm.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: chạy node --check, parse manifest JSON, git diff --check; chưa thử phát trên trình duyệt.
- Tiếp theo: xác nhận trên trang VnExpress.

**2026-10-23 | v3.4.520 | Codex sửa:**

- Alt+A/Alt+R đưa headline `.title_post` và sapo `.lead_post_detail` của VnExpress vào queue khi cùng khối bài viết.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: xác nhận selector/markup trên HTML trang; đã chạy node --check, parse manifest JSON, git diff --check; chưa thử trình duyệt.
- Tiếp theo: xác nhận Alt+R đọc đủ phần mở đầu và body.

**2026-10-23 | v3.4.519 | Codex sửa:**

- Alt+A/Alt+R loại khối đọc gần phủ toàn màn hình, tránh tô tím toàn trang.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: chạy node --check, parse manifest JSON, git diff --check; chưa thử trên trình duyệt.
- Tiếp theo: xác nhận trên trang gặp lỗi.

**2026-10-23 | v3.4.518 | Codex sửa:**

- Alt+A/Alt+R đọc các khối chữ nhìn thấy trong vùng nội dung; giữ đoạn dài, lọc rác ở đoạn ngắn, Google Search ưu tiên vùng kết quả/AI Overview.
- Debug console: xanh = đọc, đỏ = bỏ; xem lý do trong console.table.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và parse manifest JSON; chưa chạy trình duyệt.
- Tiếp theo: kiểm tra các trang thực tế qua debug mode.

**2026-10-23 | v3.4.517 | Codex sửa:**

- Watcher tự commit khi lưu file trong thư mục nguồn; cập nhật ZIP cùng version. (Watcher nằm ngoài repo.)
- File: manifest.json, PROJECT.md, D:\Keepit\sync-watch.ps1.
- Kiểm tra: watcher ghi log cho commit/ZIP; chưa xác nhận tự chạy sau khi khởi động lại Windows.

**2026-10-23 | v3.4.516 | Codex sửa:**

- Reader: mặc định Show on hover; Always visible chỉ luôn hiện trong vùng Alt+R, ngoài vùng hiện khi hover.
- File: bilingual-reader.js, dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check, parse manifest và kiểm tra selector/default; chưa chạy trên trình duyệt.
- Tiếp theo: kiểm tra trực quan các chế độ icon đọc trong trang.

**2026-10-22 | v3.4.515 | Codex sửa:**

- Thêm bước nhảy tốc độ tùy chỉnh cho phím Up/Down, mặc định 0.25; banner cập nhật theo thiết lập.
- File: bilingual-reader.js, i18n.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và test bước nhảy; chưa chạy trên trình duyệt.
- Tiếp theo: kiểm tra nhập bước nhảy và Up/Down trong Speak popup.

**2026-10-22 | v3.4.514 | Codex sửa:**

- Gói Free (không key/không đăng nhập) dùng Translate và Google TTS không giới hạn.
- File: usage-limits.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và test quota Free/key; đều đạt.
- Tiếp theo: xác nhận các provider không tự giới hạn request.

**2026-10-22 | v3.4.513 | Codex sửa:**

- Alt+R và Alt+A dùng chung một vùng nội dung chính (Readability từ bilingual-reader 1.0.1; bỏ ngày giờ, tác giả, tin liên quan, chia sẻ...). Alt+D vẫn trên toàn trang. Không tìm được nội dung chính thì dùng lại cách cũ.
- File: bilingual-reader.js (readerBlocks mới, cache), lib/Readability.js, lib/Readability-readerable.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và parse manifest JSON; chưa chạy trên trình duyệt thật.
- Tiếp theo: thử vài trang tin (VnExpress, Dân trí, BBC) để xem Alt+A/Alt+R có cùng vùng.

**2026-10-22 | v3.4.512 | Codex sửa:**

- Watcher refresh Explorer khi có file mới/đổi tên ở D:\Keepit và sau khi xử lý ZIP.
- File: D:\Keepit\sync-watch.ps1, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy PowerShell parser và gọi SHChangeNotify; chưa kiểm tra Explorer tự sắp xếp.
- Tiếp theo: xác nhận refresh/sắp xếp trong Explorer khi ZIP mới xuất hiện.

**2026-10-22 | v3.4.511 | Codex sửa:**

- Thiết lập phiên bản mới theo quy tắc AGENTS.md và PROJECT.md; không đổi chức năng addon.
- File: manifest.json, AGENTS.md, PROJECT.md.
- Kiểm tra: đã chạy parse manifest JSON; chưa chạy kiểm tra chức năng addon.
- Tiếp theo: xử lý các mục đang mở ở mục 2.

**2026-10-22 | v3.4.510 | ZIP sync — người sửa không xác định:**

- ZIP ghi nhận `bilingual-reader.js` gọi `LHN_TTS`; commit chỉ đồng bộ ZIP nên không gán thay đổi cho Codex.
- File: `bilingual-reader.js` được nêu trong snapshot ZIP; không có sửa đổi source được gán.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nguồn lịch sử.

**2026-10-22 | v3.4.509 | Codex sửa:**

- Trả audio TTS dạng Base64 qua runtime message để tương thích Chrome; dùng cho cả audio cache và audio mới.
- File: background.js, tts-engine.js, manifest.json.
- Kiểm tra: Không ghi nhận trong lịch sử gốc.

**2026-10-22 | v3.4.508 | Codex sửa:**

- Dùng chung `LHN_TTS` cho chọn text và Bilingual Reader; chuyển Bilingual Reader sang Google TTS, giữ pause/resume và đổi tốc độ khi phát.
- File: tts-engine.js, content.js, bilingual-reader.js, dashboard.js, manifest.json.
- Kiểm tra: Không ghi nhận trong lịch sử gốc.

**2026-10-22 | v3.4.506 | ZIP sync — người sửa không xác định:**

- Đồng bộ ZIP; commit cập nhật version và bỏ AGENTS.md/PROJECT.md khỏi snapshot. Không gán thay đổi này cho Codex.
- File: Không có file source được xác nhận; đây là mục đồng bộ ZIP.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nguồn lịch sử.

**2026-10-22 | v3.4.505 | Codex sửa:**

- Chia văn bản TTS dài thành đoạn ngắn để phát nối tiếp.
- File: content.js, manifest.json, PROJECT.md.
- Kiểm tra: Không ghi nhận trong lịch sử gốc.

**2026-10-22 | v3.4.504 | Codex sửa:**

- Chuyển sang Manifest V3 dùng chung cho Chromium và Firefox; sửa Google TTS trên Chrome.
- File: manifest.json, background.js, popup.html, dashboard.html, browser-polyfill.js, LICENSE-WEBEXTENSION-POLYFILL.txt.
- Kiểm tra: Không ghi nhận trong lịch sử gốc.

**2026-10-22 | v3.4.501 | Codex sửa (Git baseline):**

- ZIP Codex đã xuất ghi nhận đồng bộ shortcut trong banner và Settings với giá trị đã lưu; banner cập nhật ngay khi shortcut đổi, shortcut chưa gán hiện là Off.
- Đây là baseline đầu tiên có trong Git. Tên manifest: `Keepit - Translate & Highlight Notes`; README cũ ghi `Local Highlight Notes for Firefox Windows` (v1.30.0).
- Git không có lịch sử cho .502, .503 hoặc .507; không gán thay đổi chưa xác minh cho Codex.
- File: Không ghi cụ thể trong nguồn baseline.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nguồn lịch sử.

### Nhật ký ZIP trước baseline Git — v3.4.500 đến v3.4.398

**2026-10-22 | v3.4.500 | Codex sửa:**

- Đổi bước tăng/giảm tốc độ bằng phím ↑/↓ thành 0,15x và cho thanh Reading Speed kéo tự do.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-22 | v3.4.499 | Codex sửa:**

- nhấp đúp vào nút kéo để đưa thanh đọc về vị trí mặc định: chính giữa, cách đáy màn hình 24px.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-22 | v3.4.498 | Codex sửa:**

- icon speak ngoài vùng nội dung mà Alt+R đọc thành luôn ẩn; icon trong vùng đọc vẫn theo thiết lập hiện có.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-22 | v3.4.497 | Codex sửa:**

- Thêm margin: 0 -14px cho nút data-hide-banner.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.496 | Codex sửa:**

- Đã chặn Up/Down cuộn trang khi shortcut tốc độ đang bật; lúc đang đọc, chúng vẫn tăng/giảm tốc độ 0,25x.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.495 | Codex sửa:**

- xử lý để các popup của speak popup đóng khi bấm bên ngoài thanh `lhn-bilingual-reading-bar`.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.494 | Codex sửa:**

- Đồng bộ màu shortcut trong data-shortcut-banner với màu tím chủ đạo của lhn-bilingual-reading-bar.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.493 | Codex sửa:**

- Mỗi lần lhn-bilingual-reading-bar hiện lại, data-shortcut-banner cũng hiện theo; trạng thái bật/tắt do người dùng chọn vẫn được lưu.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.492 | Codex sửa:**

- hover: nền tím của nút Play/Pause được giữ nguyên, chỉ sáng nhẹ và nhấc lên 1px.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.491 | Codex sửa:**

- hiệu ứng nhấn cho nút Play/Pause khi bấm nút hoặc dùng Space.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.490 | Codex sửa:**

- các điểm nhấn của speak popup sang tím theo màu accent của addon: nút phát, thanh tốc độ và công tắc trong Settings.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.489 | Codex sửa:**

- Đổi gợi ý đóng thành Alt+R; thêm shortcut tăng/giảm tốc độ đọc trong Dashboard > Shortcuts.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.488 | Codex sửa:**

- `lhn-br-time` sang ước tính thời gian đọc **toàn bộ khung nội dung Reader**: số từ ÷ (220 từ/phút × tốc độ đọc). Nhãn cập nhật theo tốc độ hiện tại và ngôn ngữ hiển thị.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.487 | Codex sửa:**

- Speak popup dùng theme và font toàn addon; Left/Right tạo hiệu ứng bấm nút đoạn trước/sau.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.486 | Codex sửa:**

- Dịch speak popup; đổi nhãn account, reading icon và dark mode; đồng bộ Show reading icon với các chế độ Always visible/Show on hover của Reader.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.484 | Codex sửa:**

- Chuyển scrollbar của Select Voice sang phải và tự focus ô tìm kiếm khi mở.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.483 | Codex sửa:**

- Banner đồng bộ trạng thái cài đặt; dùng SVG cờ từ mẫu; Select Voice chỉ còn một scrollbar.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.482 | Codex sửa:**

- Settings bật/tắt shortcut banner; Account mở dashboard hoặc form đăng nhập tùy trạng thái.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.481 | Codex sửa:**

- Giữ banner trên một hàng, bỏ cuộn ngang trong speak popup và thay icon Settings bằng SVG người dùng cung cấp.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.480 | Codex sửa:**

- Bắt phím ↑/↓ ở capture phase và chặn cuộn trang để dùng chúng thay đổi tốc độ đọc.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.479 | Codex sửa:**

- **↑ để tăng** và **↓ để giảm tốc độ mỗi lần 0.25x** khi Bilingual Reader đang đọc, đồng thời cập nhật ghi chú trên `data-shortcut-banner`.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.478 | Codex sửa:**

- animation mở popup để không ghi đè transform căn giữa nữa. Lần đầu popup sẽ hiện giữa phía dưới màn hình; khi kéo, cách kéo hiện tại được giữ nguyên.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.477 | Codex sửa:**

- chế độ Auto: trước tiên chọn voice mặc định của hệ thống phù hợp với ngôn ngữ đang đọc, sau đó chọn voice khớp ngôn ngữ. Cờ toolbar theo voice được gán để phát; Auto trong menu vẫn là địa cầu.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.476 | Codex sửa:**

- Sửa cờ trên thanh đọc để lấy theo voice thực sự đang phát; lựa chọn Auto trong danh sách vẫn hiện địa cầu.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.475 | Codex sửa:**

- Sửa cờ theo voice đang đọc và bảo đảm icon cờ mở đúng popup #voice-popup.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.474 | Codex sửa:**

- Auto hiển thị cờ theo ngôn ngữ đoạn đang đọc; popup chọn voice theo mẫu và có nền đục.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.473 | Codex sửa:**

- đồng bộ Space với trạng thái đọc/tạm dừng của popup. Khi nhấn Space, âm thanh và biểu tượng play/pause được cập nhật đồng thời; chuyển đoạn cũng đồng bộ lại trạng thái.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.472 | Codex sửa:**

- nút kéo: thanh công cụ giữ đúng vị trí tương đối với điểm con trỏ đang nhấn, không còn giật về giữa; nút hiển thị cursor bàn tay khi rê và khi kéo.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.471 | Codex sửa:**

- Hoàn thiện điều khiển speak popup: giữ điểm kéo, đồng bộ Space với trạng thái Play/Pause và chuyển voice popup đúng.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.470 | Codex sửa:**

- Khôi phục phát âm; tích hợp speak popup với Settings, chọn voice, theme, speed popup và nút mở dashboard.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.469 | Codex sửa:**

- Tích hợp floating speak toolbar vào Bilingual Reader: play/pause, chuyển đoạn, chọn voice, chỉnh tốc độ, thời gian đọc, auto-scroll và kéo thả.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.468 | Codex sửa:**

- chế độ hover: icon luôn ẩn khi không hover đoạn văn; focus hoặc trạng thái đọc không làm icon hiện.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.467 | Codex sửa:**

- Gắn trạng thái icon speak với đoạn đang đọc; xóa trạng thái khi chuyển đoạn hoặc dừng đọc.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.466 | Codex sửa:**

- Gỡ focus khỏi icon loa khi đọc xong để chế độ hover ẩn icon nếu con trỏ đã rời đoạn.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.465 | Codex sửa:**

- **Show reading icon** trong **Bilingual Reader > Reader**, với ba chế độ: luôn hiện, hiện khi di chuột và chỉ hiện khi đọc. Mặc định là **luôn hiện**. Các nhãn đã được dịch sang English, Tiếng Việt và 한국어.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.464 | Codex sửa:**

- nút **Reset** bên phải thanh trượt; bấm sẽ khôi phục mức mặc định **80%**. Nhãn nút đã có bản dịch cho English, Tiếng Việt và 한국어.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.463 | Codex sửa:**

- tùy chọn **Translation font size** với thanh trượt `50–150%`, mặc định `80%`. Giá trị được lưu và áp dụng qua `--translation-scale` cho bản dịch trên trang và preview, với cỡ tối thiểu `14px`.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.462 | Codex sửa:**

- nhãn thành **Bilingual translation**, **Bản dịch song ngữ** và **이중 언어 번역**.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.461 | Codex sửa:**

- nhãn thành **Bilingual**, **Song ngữ** và **이중 언어** theo ngôn ngữ giao diện.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.460 | Codex sửa:**

- **Reading** thành **Reader**, **Trình đọc** và **리더** theo ngôn ngữ giao diện.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.459 | Codex sửa:**

- **Translate to** khỏi Bilingual Reader. Giờ Bilingual Reader dùng trực tiếp **Translate > Target language**; khi đổi ngôn ngữ, preview và các bản dịch trên trang được cập nhật theo lựa chọn đó.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.458 | Codex sửa:**

- Đổi nhãn Translation color và Translation bold, kèm bản dịch tiếng Việt và tiếng Hàn.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.457 | Codex sửa:**

- Tạo lại danh sách Translate to sau khi xác định ngôn ngữ giao diện để nhãn Auto được dịch đúng.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.456 | Codex sửa:**

- whitelist cố định `en/vi/ko` khỏi luồng dịch Bilingual Reader. **Auto** dùng mã ngôn ngữ hiển thị hiện tại và chuyển mã đó tới API dịch; preview cũng chọn ngôn ngữ đích theo cài đặt giao diện.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.455 | Codex sửa:**

- Nguyên nhân là lúc chọn ngôn ngữ hiển thị, handler cập nhật giao diện nhưng không gọi làm mới preview ngay. Tôi đã thêm bước làm mới tại sự kiện đổi ngôn ngữ; Auto sẽ tính lại ngôn ngữ đích và tải preview tương ứng.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.454 | Codex sửa:**

- Sửa điều kiện cập nhật preview khi Translate to là Auto; so sánh theo ngôn ngữ giao diện thực tế và tải lại preview khi cần.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.453 | Codex sửa:**

- **Translate to** mặc định là **Auto**. Khi chọn Auto, Bilingual Reader dịch theo ngôn ngữ hiển thị của extension và cập nhật các bản dịch khi ngôn ngữ hiển thị thay đổi.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.452 | Codex sửa:**

- danh sách **Translate to** với **Translate > Target language**: cùng lựa chọn Auto và các ngôn ngữ, cùng nhãn theo ngôn ngữ giao diện.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.451 | Codex sửa:**

- Dịch nhãn Inter (default) theo ngôn ngữ giao diện: English, Vietnamese và Korean.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.450 | Codex sửa:**

- Đổi nhãn Inter (default) thành Inter trong Website font; giữ nguyên nhãn của Translation font.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.449 | Codex sửa:**

- nhãn **Inter (default)** thành **Inter** trong dropdown **Translation font**.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.448 | Codex sửa:**

- **Skip same language** lên đầu mục **Translation** và đặt khoảng cách **16px** giữa tiêu đề với danh sách cài đặt trong các mục Bilingual Reader, gồm cả **Translation** và **Reading**.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.447 | Codex sửa:**

- riêng các dropdown trong **Dashboard settings > Bilingual Reader** để khớp kiểu dáng các dropdown settings khác, gồm cả chế độ sáng và tối.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.446 | Codex sửa:**

- nhãn thành **Website font** và chuyển lên trên **Translation font**. Các tên đã được cập nhật cho cả tiếng Việt và tiếng Hàn.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.445 | Codex sửa:**

- nguyên đoạn preview tiếng Anh làm mẫu. Khi chọn ngôn ngữ khác, preview giờ tự dịch câu đó qua dịch vụ Bilingual Reader; không còn bản dịch mẫu hardcode.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.444 | Codex sửa:**

- Bilingual Reader thêm Translation color, Translation bold và preview cập nhật theo thiết lập.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.443 | Codex sửa:**

- Đã nối Web font với trạng thái website: **Alt+Z tắt font tùy chỉnh ngay khi disable website; bật lại thì khôi phục font đã chọn.** Các popup và giao diện của addon vẫn được loại trừ khỏi font trang.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.442 | Codex sửa:**

- Chống nháy Web font: chèn style tại document_start từ storage.local trước khi đọc storage.sync; Auto không chèn CSS, system dùng system-ui; loại trừ trang extension và ghi chú Shadow DOM chưa hỗ trợ.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.441 | Codex sửa:**

- phần chờ tải font để không thể chặn việc áp dụng font tùy chỉnh vô thời hạn. Font sẽ được áp dụng sau khi tải xong; nếu tải chậm, vẫn áp dụng để trình duyệt chuyển font khi tải hoàn tất.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.440 | Codex sửa:**

- để font tùy chỉnh được tải trước khi áp dụng lên đoạn văn nguồn, giúp tránh hiện font gốc trước rồi mới đổi sang font tùy chỉnh. Tùy chọn **Auto** vẫn giữ font của trang.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.439 | Codex sửa:**

- Thêm Website font phía trên Translation font trong Bilingual Reader; mặc định Auto dùng font trang, các lựa chọn font khớp với Translation font.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.438 | Codex sửa:**

- nút quay lại: ẩn khi chưa có từ để quay lại, và khi hiện thì cùng kích thước, padding, bo góc với nút loa, dùng màu xanh của Syn.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.437 | Codex sửa:**

- Thêm nút quay lại từ vừa tra trong full dict, tự đọc từ mới khi Auto speak bật và cho phép tra nghĩa cả cụm Colloc.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.436 | Codex sửa:**

- Alt+A: card dịch hiện có không còn bị xóa rồi tạo lại mỗi lần observer chạy; nội dung bản dịch cũng được loại khỏi văn bản nguồn để tránh dịch lặp khi trang thay đổi. Đây là nguyên nhân gây nhấp nháy khi chọn từ, cuộn hoặc mở popup.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.435 | Codex sửa:**

- Đã dịch tên tab thành **Trình đọc song ngữ** (tiếng Việt) và **이중 언어 리더** (tiếng Hàn). Tiếng Anh giữ là **Bilingual Reader**.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.434 | Codex sửa:**

- Khi đang đọc, bấm icon speak ở đoạn khác sẽ dừng đoạn hiện tại ngay và chuyển sang đọc đoạn mới.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.433 | Codex sửa:**

- Space để hủy giọng đọc Bilingual Reader ngay lập tức thay vì chờ đọc hết từ; khi tiếp tục, nó đọc lại từ vị trí gần nhất. Phím này cũng tạm dừng audio/video đang phát trên trang và tiếp tục chúng khi bấm lần nữa.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.432 | Codex sửa:**

- Thêm Space pause/resume và Left/Right chuyển đoạn, có shortcut tùy chỉnh; chặn xử lý phím ngay để dừng âm thanh.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.431 | Codex sửa:**

- shortcut **Space** mặc định để tạm dừng và tiếp tục giọng đọc tại đúng vị trí đang phát. Bạn có thể đổi phím trong **Dashboard Settings > Shortcut**; khi không có giọng đọc, Space vẫn cuộn trang bình thường.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.430 | Codex sửa:**

- Alt+Z tắt mọi chức năng Reader trên website; Alt+A/Alt+R loại sidebar khỏi vùng đọc; thêm Parts not to read để lọc bằng CSS selector.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.429 | Codex sửa:**

- Ưu tiên chuyển Alt+A/Alt+D/Alt+R cho Bilingual Reader trước kiểm tra disable website và xung đột với shortcut Alt+D.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.428 | Codex sửa:**

- riêng logic Alt+A/Alt+R để chỉ lấy văn bản hiển thị; bỏ qua nội dung ẩn, mã CSS trong `<style>`, thông tin tác giả/ngày giờ và nút Google của VnExpress. Alt+D vẫn giữ phạm vi toàn trang.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.427 | Codex sửa:**

- Đưa tiêu đề và sapo của bài Tuổi Trẻ vào vùng đọc Alt+A/Alt+R dù nằm ngoài articleBody, giữ đúng thứ tự trước thân bài.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.426 | Codex sửa:**

- Đã giới hạn **Alt+A** và **Alt+R** vào vùng nội dung chính: nhận diện `article`/`main` và loại điều hướng, sidebar, nội dung liên quan, quảng cáo khỏi vùng dịch và đọc. **Alt+D** vẫn tìm khối gần con trỏ trên toàn trang.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.425 | Codex sửa:**

- shortcut Bilingual Reader sang cơ chế xử lý phím hiện có của addon: **Alt+A** dịch khi cuộn, **Alt+D** dịch khối gần con trỏ, **Alt+R** bật/tắt đọc liên tục. Đã bỏ `browser.commands`.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.424 | Codex sửa:**

- Bilingual Reader vào Dashboard Settings, gồm các tùy chọn theo mặc định trong file mẫu. Nội dung trang được dịch qua background script, lưu cache 7 ngày, và có đọc liên tục, đọc từ con trỏ và dịch khi cuộn.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.423 | Codex sửa:**

- mặc định **Toggle enable on this website** thành `Alt+Z`. Shortcut đã được tùy chỉnh trước đó sẽ không bị ghi đè.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.422 | Codex sửa:**

- khoảng cách giữa **Translate Settings** và danh sách của nó thành 16px, đồng bộ với **Voice** trong Flashcard settings > Speech.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.421 | Codex sửa:**

- điều kiện chặn shortcut khi đang phát âm. Phần còn lại được giữ: khi popup đang hiện, shortcut chỉ gọi phát âm và không thay đổi popup.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-21 | v3.4.420 | Codex sửa:**

- Khi Auto speak bật và popup dịch/full dict đang hiện, shortcut Translate selected text chỉ phát âm, không thay đổi popup.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.419 | Codex sửa:**

- Giữ nhãn từ loại của full dict bằng tiếng Anh kể cả khi đổi ngôn ngữ giao diện; hỗ trợ dạng viết tắt n, v, adj, adv.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.418 | Codex sửa:**

- Đổi nhãn từ loại trong full dict theo ngôn ngữ giao diện (English, Vietnamese hoặc Korean).
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.417 | Codex sửa:**

- đường ngăn cách thứ hai trước mục Voice trong **Flashcard settings > Speech**. Khoảng cách đến Voice giờ theo cùng chuẩn với các tab cài đặt khác; khoảng cách 16px từ Voice đến danh sách được giữ nguyên.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.416 | Codex sửa:**

- khoảng cách tiêu đề đến danh sách thành **16px** ở cả hai tab Speech đã nêu. Quy tắc áp dụng cho danh sách của mục nên vẫn giữ khoảng cách khi thêm hoặc chuyển hàng bên trong.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.415 | Codex sửa:**

- mục **Auto speak when popup** sang tab **Speech**; ID và xử lý cài đặt được giữ nguyên.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.414 | Codex sửa:**

- Để full dict tuân theo điều kiện hiện popup dịch; chế độ mở note không bật popup từ điển ngoài ý muốn, nhưng vẫn dùng bản dịch từ điển để điền note.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.413 | Codex sửa:**

- Chỉ tô nền đỏ cho từng chip Ant, không tô nền cho cả hàng.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.412 | Codex sửa:**

- riêng font của full dict popup: toàn bộ chữ, kể cả chip, IPA và nhãn engine, giờ dùng Inter sans-serif. Nguyên nhân là reset `all: initial` trên chip làm font bị trả về mặc định của trình duyệt.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.411 | Codex sửa:**

- Khi note mở, gỡ full dict popup ngay; kết quả đang tải vẫn được chuyển vào note và popup không hiện lại.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.410 | Codex sửa:**

- Ẩn full dict ngay khi mở note, tiếp tục chờ bản dịch nếu cần để điền note.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.409 | Codex sửa:**

- full dict popup dùng cùng cơ chế định vị với popup dịch cũ: bám theo đoạn chữ đã chọn khi cuộn hoặc đổi kích thước cửa sổ, đồng thời giữ hành vi đóng khi bấm ra ngoài hoặc nhấn Escape.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.408 | Codex sửa:**

- Với một từ tiếng Anh khi bật Full English Dictionary, lấy bản dịch từ lhn-dict-translation vào note và bỏ dịch cũ; từ hai từ trở lên dùng luồng cũ.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.407 | Codex sửa:**

- Đọc trực tiếp bản dịch từ lhn-dict-translation vào note kể cả khi dict popup đã mở; không ghi đè nội dung người dùng đã nhập.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.406 | Codex sửa:**

- Bỏ lượt dịch riêng cho từ tiếng Anh; lấy lhn-dict-translation đổ vào note và giữ nội dung note người dùng đang sửa.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.405 | Codex sửa:**

- Áp dụng Inter cho giao diện addon và chuẩn hóa chuỗi dịch Unicode NFC trước khi render.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.404 | Codex sửa:**

- dark mode riêng cho full dictionary popup: giao diện lấy theo cài đặt giao diện của addon hoặc theme hệ thống, và cập nhật khi theme đổi. Đã bổ sung màu tối tương ứng cho nền, chữ, nhãn, nút và các nhóm Syn/Ant/Forms/Colloc.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.403 | Codex sửa:**

- Tinh chỉnh riêng full dict theo mẫu HTML: giảm cỡ chữ/padding, dùng rem và chỉnh khoảng cách giữa các nhóm.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.401 | Codex sửa:**

- Tinh chỉnh UI full dict theo file mẫu: font, cỡ/độ đậm chữ, padding, light/dark mode và IPA; không đổi luồng tra cứu.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.400 | Codex sửa:**

- Thêm Show full English dictionary mặc định bật; chọn một từ tiếng Anh sẽ hiện full dictionary popup với nghĩa, từ loại, từ liên quan, word forms, collocations và phát âm.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.399 | Codex sửa:**

- Đổi tên mục thành Highlights & Notes và dịch nhãn sang tiếng Việt, tiếng Hàn.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

**2026-10-20 | v3.4.398 | Codex sửa:**

- Đổi tên tab thành Highlight & Notes, thêm tab Translate với icon được yêu cầu và chuyển các mục dịch/ngôn ngữ dịch sang tab mới.
- File: Không được ghi trong nhật ký ZIP gốc.
- Kiểm tra: Không ghi nhận kết quả kiểm thử trong nhật ký ZIP gốc.

- Không tìm thấy phản hồi chat có ZIP cho v3.4.402 hoặc v3.4.485; không gán thay đổi cho hai version này.

### Lịch sử trước baseline Git — các phiên bản 1.x (ngày không xác định)

**v1.45 trở đi | Có ZIP, thiếu changelog lịch sử**

- ZIP đầu tiên tìm thấy là `highlight-notes-firefox-windows-v1.45.zip`; có các snapshot tiếp theo, nhưng không có ghi chú theo phiên bản để xác định chính xác từng thay đổi hoặc tác giả.

**v1.31–v1.44 | Thiếu tư liệu**

- Không tìm thấy ZIP hoặc changelog trong `C:\Users\Huuson\Documents\Codex`; không gán thay đổi cho từng phiên bản.

**v1.30.0 | README ghi lại; người sửa chưa được xác nhận**

- Thêm tùy chọn chỉ lưu và highlight đoạn vừa chọn sau khi click ra ngoài; mặc định tắt để giữ hành vi cũ.
- README v1.30.0 mô tả sản phẩm lúc đó: highlight bốn màu, note có thể sửa/xóa, popup và sidebar, giao diện EN/VI/KO, shortcut tùy chỉnh, dashboard tìm/sửa/xóa và nhập/xuất JSON.

**v1.29.0 | README ghi lại; người sửa chưa được xác nhận**

- Tăng độ tin cậy khi khôi phục highlight trên trang động: chuẩn hóa khoảng trắng, hỗ trợ text qua nhiều node inline, chống mất yêu cầu đồng thời và thử lại khi nội dung chưa sẵn sàng.

**v1.12.0 | README ghi lại; người sửa chưa được xác nhận**

- Dashboard thư viện hai cột; sắp xếp, tìm kiếm/lọc website, đánh dấu yêu thích; xuất TXT/CSV/Markdown/JSON; thẻ trang có ảnh xem trước khi metadata sẵn có.
- Chuẩn hóa icon, căn lại thanh công cụ và cho hai cột cuộn độc lập.

**v1.9.0 | README ghi lại; người sửa chưa được xác nhận**

- Sửa tham chiếu localization trong content script và trạng thái chọn màu sau khi dịch nhãn; cải thiện tooltip, thẻ sidebar và thứ tự ghi chú theo vị trí trên trang.
- README có hai ghi chú v1.9.0 mâu thuẫn về vị trí nút tooltip; không kết luận vị trí nào là bản cuối.

**v1.0.0–v1.8.0 | Chưa khôi phục được**

- Không tìm thấy ZIP, source hoặc ghi chú changelog của các phiên bản này; chưa thể xác nhận tính năng ban đầu hay người thực hiện.
