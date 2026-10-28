# Keepit - Hồ sơ dự án

## 1. Trạng thái hiện tại (sửa đè)
- Version hiện tại: v3.4.709; một codebase Manifest V3 cho Chrome và Firefox. Mã nguồn được nhóm theo vai trò trong `js/` và `css/`, giao diện trong `pages/`, tài nguyên trong `assets/` và thư viện bên thứ ba trong `vendor/`. Các module gồm nền tảng, dịch, Reader, Highlighter, khôi phục annotation, Sidebar, Note Composer, Dashboard Settings, thống kê hồ sơ, Flashcards, Usage, Diagnostics, YouTube Dual Sub và Dictation. Dictation v1 đổi layout ngay trong overlay hiện có theo file mẫu `FILE_DICTATION_OK_NHẤT.html` (phân tích lỗi từng từ, âm đúng/sai, pháo giấy cục bộ, hàng Lặp 0x–3x), chỉ gõ đáp án; câu hiện tại và phía dưới bị blur/ẩn dịch đến khi chấm đúng 100%, câu phía trên không blur và hiện dịch; mở lại không tự mở khóa câu hiện tại từ tiến độ cũ; mở Dictation/chuyển câu luôn phát theo số lần lặp thêm (0 = tổng 1 lần); khi đúng, toàn bộ câu giữ trong ô “Câu đúng” với chữ xanh; nếu từ đúng nhưng thiếu dấu câu, Enter tự thêm dấu câu theo câu mẫu; khi nhập sai, ô nhập giữ vị trí và bảng lỗi nằm bên dưới; khi gõ, chỉ cập nhật danh sách nếu vừa sửa câu đã chấm đúng; trong ô Dictation, ↑/↓ được để trình duyệt xử lý như textarea Popup Note; ẩn scrollbar dọc trang YouTube khi video overlay hoặc Dictation mở và khôi phục khi đóng; trên Chrome/Edge, mọi vùng cuộn video overlay và Dictation dùng `--lhn-scrollbar-width` cho cả hai hướng; trong transcript video hover vào `.yt-dual-item` thì tạm dừng và rời row thì phát lại nếu trước đó đang phát; chỉ click `.yt-dual-timestamp` mới seek/play; click `.yt-dual-content` không gây hành động; chọn chữ để dịch và Full Dictation giữ nguyên; nút Play/Pause video đổi icon ngay khi bấm và chỉ chạy một animation nhấn mượt; Alt+F bật/tắt Dictation, mở overlay nếu cần; shortcut có thể đổi trong Dashboard > Shortcut; chỉ khi Dictation mở, ` tương đương Space để phát/tạm dừng audio/video; trong ô đáp án, Esc lần đầu điền toàn câu chưa chấm, lần hai xóa (thay Alt+X); nút thu video bên trái Tự phát chuyển sang thanh audio cùng chiều rộng, cao 1/3 với hiệu ứng; video full width; chỉ thanh audio compact inset ngang 12px theo sentence area; danh sách câu lấp phần chiều cao được giải phóng; giữ trạng thái khi chuyển câu, khôi phục khi đóng Dictation; input Dictation: khi gõ chỉ hiện chữ, không gợi ý/phân tích/gạch chân; Enter chuẩn hóa từ khớp theo transcript và giữ từ sai; tiền tố đúng thêm một dấu cách, vẫn hiện “Phân tích lỗi sai”, từ đúng xanh, từ kế tiếp vàng và phần sau được mask trên một dòng; câu sai gạch đỏ từ sai, feedback dừng ở lỗi đầu tiên rồi mask phần sau cùng dòng; mỗi mask là một phần tử riêng, chảy và xuống dòng như từng từ; ô phản hồi tự wrap thay vì cuộn ngang; không thêm dấu kết thúc nếu từ cuối transcript chưa được nhập; đúng 100% giữ nguyên; thumb sáng hơn ở dark mode; hint phím tắt chữ 12px, 4 cột đều nhau: nhãn đầu/cuối sát mép, hai nhãn giữa căn giữa, không padding ngang; video có icon Keepit - Keepit góc trên trái, audio title có tiền tố `Keepit - `; cột Ghi chú bỏ ô Từ vựng và có thống kê từ sai chạy theo kết quả chấm, lưu riêng theo video; khung 50vh cuộn nội bộ, viền ngoài bỏ, padding ngang tiêu đề/bộ lọc/danh sách bằng 0; scrollbar Chrome/Edge 3px theo app, Firefox thin; tìm/lọc hoạt động, nút xổ/thu nằm sát phải khi có biến thể ẩn (+N và chevron xuống cùng hàng, chữ +N nhỏ hơn 1px; mở chỉ chevron lên; mọi biến thể chảy liên tục và tự wrap); tiêu đề có huy hiệu tổng số từ sai; nền dark đồng bộ vùng Ghi chú; tỷ lệ là tỷ lệ sửa đúng; khi Ambient bật, hiệu ứng phủ toàn bộ ba cột Dictation; trong video overlay thường, nút tròn giữ nguyên markup/style/icon v3.4.680 và khi bấm gọi `#lhn-sidebar-edge-toggle` để mở sidebar chính Keepit; khi overlay mở, ẩn edge toggle nếu sidebar chính đang đóng và hiện lại khi sidebar chính mở; khôi phục trạng thái khi overlay đóng; lưu tiến độ/ghi chú cục bộ; chưa có chế độ Nói. Entry points vẫn điều phối state và vòng đời.
- Phần tối ưu code theo OPT đã rà/triển khai: Bước 1.1–1.3; 2.1–2.3; 3.1–3.2; 4.1–4.5; OPT 3.2 Flags và 5.3 Fonts/Reader/Translate/Highlighter. Kiểm tra v3.4.599: `node --check` 39/39 JS, script paths hợp lệ, mô phỏng thứ tự nạp core script đạt, `git diff --check` đạt; ZIP hiện hành có `manifest.json` ở gốc và `js/core/defaults.js`. Người dùng đã xác nhận trên trình duyệt: sentence note không dính bản dịch, cache Reader dùng chung `Alt+A`/`Alt+D`, tốc độ đọc theo ngôn ngữ đoạn, toggle "Read translation with source", icon loa không trùng, và Reader đọc lại bình thường sau khi sửa `importScripts`. Log watcher ghi "LỖI push GitHub" nhưng commit thực tế đã lên remote (đã kiểm bằng `git ls-remote`).
- Bản sửa tải Google Fonts theo nhu cầu trong v3.4.555 đã được người dùng xác nhận; v3.4.554 là bản kiểm tra không đạt. Trình duyệt cụ thể chưa được ghi nhận; xem các mục nhật ký v3.4.555 bên dưới để biết tóm tắt thay đổi.
- **v3.4.600 — YouTube song ngữ:** tính năng ban đầu được tích hợp từ extension tham chiếu `youtube-dual-subtitles-extension-v1.12.zip`; giao diện overlay được giữ nguyên. Nguồn phụ đề đã được thay đổi ở các phiên bản sau; cách triển khai hiện hành xem mục 24 và nhật ký v3.4.605 trở đi.
- Một số hành vi TTS/Reader **khác** còn chờ xác nhận thực tế trên trình duyệt; xem danh sách việc đang mở bên dưới. Không suy ra audio hoặc hành vi runtime đã được xác nhận chỉ từ code/mock/request HTTP.
- `LICENSE` và `PRIVACY-POLICY.md` vẫn là bản nháp có placeholder; rà soát pháp lý/store còn mở. Quyết định và chi tiết ở `OPT-ARENA.md`.
- Chưa nối Supabase/cloud sync hoặc xử lý thanh toán thật; xác nhận chi tiết tính năng hiện hành trong README và mã nguồn.

## 2. Việc đang mở / Tiếp theo (sửa đè)
29. [Chưa làm — tách đợt] Dictation v2 “Nói”: Chromium SpeechRecognition để chấm; Firefox chỉ ghi âm/phát lại. Trước khi làm cần chốt quyền/disclosure và kiểm tra riêng tư micro.
28. [Kiểm thử UI/runtime] Dictation v1 v3.4.709 trên YouTube thật (Chrome/Edge/Firefox): câu hiện tại/các câu dưới bị blur và ẩn dịch khi mở/chuyển; chỉ đúng 100% mới mở câu hiện tại và hiện dịch, tiến độ lưu cũ không mở khóa khi mở lại; câu phía trên không blur và hiện dịch; Auto-play tắt vẫn tự phát khi mở/chuyển; repeatCount là số lượt phát thêm (0 = 1 tổng, n = n+1 tổng); khi đúng giữ toàn bộ câu chữ xanh trong ô “Câu đúng”; nếu tất cả từ đúng nhưng thiếu dấu câu, Enter tự thêm dấu câu theo câu mẫu; pháo hoa khi chấm đúng không làm dịch chuyển thanh te-control-bar hoặc gây nhảy màn hình; khi sai và hiện `te-dict-error`, ô nhập phải giữ cùng vị trí và error nằm bên dưới; giữ các tiêu chí xanh/icon tick, cỡ chữ 14px, gợi ý thiếu không mũi tên, ẩn/khôi phục scrollbar YouTube ở Dictation và overlay video; mọi scrollbar trong overlay/Dictation, kể cả center-body, dọc/ngang theo biến chung 3px; dark thumb màu sáng; transcript yt-dual-item: hover row dừng video và rời row phát lại nếu trước đó đang phát; chỉ click yt-dual-timestamp seek/play; click content không có action; select-to-translate và Full Dictation vẫn hoạt động; nút Play/Pause video đổi icon tức thì khi bấm và animation chỉ chạy một nhịp mượt như Reader; Alt+F bật/tắt Dictation; nếu phụ đề đang tải thì chờ `lhn-dual-captions-updated` rồi tự mở, lần bấm nữa hủy yêu cầu chờ hoặc đóng Dictation; nếu overlay đóng thì mở overlay rồi bật Dictation; shortcut hiện trong Dashboard > Shortcut, lưu/reset đúng; chỉ khi Dictation mở, ` hoạt động như Space để phát/tạm dừng audio/video; trong ô đáp án Esc lần đầu điền toàn câu không chấm điểm, lần hai xóa (thay Alt+X); nút bên trái “Tự phát khi chuyển câu” bật/tắt thanh audio cùng width video, height 1/3; video full width như v3.4.696; thanh audio compact inset 12px hai bên theo sentence area; list câu tự dùng phần height trống; giữ compact khi chuyển câu, đóng Dictation thì khôi phục; ô nhập Dictation: trong lúc gõ chỉ hiện chữ, không gợi ý/phân tích/gạch chân; Enter trên tiền tố đúng chuẩn hóa từ, thêm đúng một dấu cách, không chấm điểm sai, vẫn hiện tiêu đề “Phân tích lỗi sai” và dòng phản hồi từ đúng xanh/từ kế tiếp vàng/phần còn lại mask theo độ dài; với đáp án sai, từ đúng được chuẩn hóa case/dấu câu, từ sai giữ nguyên và gạch đỏ dưới sau Enter; phản hồi dừng ở lỗi đầu tiên rồi mask mọi từ phía sau; mỗi mask là một phần tử riêng, nằm cùng luồng với các từ/chip và tự xuống dòng khi hết chỗ, không gom cả chuỗi mask thành một khối; không thêm dấu câu kết thúc nếu từ cuối transcript chưa được nhập; đúng 100% giữ nguyên; Ambient phủ cả ba cột Dictation; video overlay thường: nút tròn tím gốc v3.4.680 bấm mở sidebar chính Keepit qua `#lhn-sidebar-edge-toggle`, không mở sidebar phụ đề video; khi overlay mở, edge toggle ẩn lúc sidebar chính đóng, hiện lúc sidebar chính mở và ẩn lại khi đóng; khi đóng overlay khôi phục hành vi edge toggle thường; bốn nhãn phím tắt Enter/Esc/`/Ctrl cỡ chữ 12px, chia đều 4 cột; đầu/cuối sát mép, hai giữa căn giữa, không padding ngang; icon Keepit - Keepit ở góc trái trên video và audio title dạng `Keepit - Tên video`; cột Ghi chú không còn ô Từ vựng; thống kê từ sai 50vh cuộn riêng, thuật toán đếm lỗi/sửa đúng/biến thể sau mỗi lần chấm, tìm kiếm và lọc theo kết quả gần nhất; chưa kiểm thử UI trên trình duyệt thật; luồng Enter và ↑/↓ trong textarea được xử lý như Popup Note. Chưa chạy trên browser thật.
27. [Chưa làm — đã chốt] (a) Làm nổi bật ẩn: áp dụng cho ghi chú và highlight ở Dashboard và sidebar; nền vàng đổi sang chữ đen ở dark mode; có một khóa ẩn trong code để bật/tắt. (b) Điều hướng ↑/↓ chỉ áp dụng cho danh sách xổ xuống có ô tìm; có một khóa ẩn trong code để bật/tắt. Hai việc này chưa triển khai.
26. [Kiểm tra] Ô tìm Settings v3.4.656 trên Chrome/Edge/Firefox với Dashboard thật: gõ lọc hàng qua mọi tab, ẩn nhóm/tab trống, thông báo "No settings found", Esc/đổi tab/đóng hộp thoại xóa ô tìm; ô cao 40px, icon bên trái, ô dính đầu khi cuộn (cả cửa sổ rộng ≤700px và ≤520px), tô sáng `mark.lhn-search-match`; kiểm tra tiếng Việt có dấu (VI/KO) và dark mode. Đã kiểm trên Chromium headless với markup/CSS Settings thật nhưng chưa kiểm trên Dashboard chạy trong extension.
25. [Kiểm tra] Overlay video v3.4.634 trên Edge/Chrome/Firefox với video YouTube thật: (a) Ambient mode: vòng sáng lan tròn từ tâm video ra thanh điều khiển và thanh bên, mờ dần, cả theme sáng/tối; công tắc "Ambient mode" trong Cài đặt video (mặc định bật) bật/tắt ngay và được lưu; video DRM không bật; chữ phụ đề và danh sách bên vẫn dễ đọc, máy yếu không giật (độ sáng 0.5, blur 40px, vẽ mỗi 125 ms); (b) hover tiêu đề video dài ở thanh điều khiển: chạy vòng tròn nối đuôi, rời chuột về vị trí cũ; (c) logo, chữ "Keepit - Video Song Ngữ" và dấu × cùng căn giữa dọc trên Windows (font Segoe UI) và Firefox (nhánh dự phòng nhích 1,5px); (d) ẩn phụ đề/thanh điều khiển vẫn cùng màu nền sáng/tối, hover đáy thì thanh hiện lại; (e) chuyển câu active ở sidebar mượt. Chưa kiểm thử trên YouTube thật.
24. [Kiểm tra] YouTube song ngữ v3.4.622: Dual Sub đọc khóa qua `globalThis.LHN_CONFIG`; Auto đích theo ngôn ngữ giao diện. Hai bộ chọn dùng chung `lhnStudyTranslationSettings`; mỗi dòng ưu tiên track khớp, nếu thiếu dùng track gốc và dịch sang ngôn ngữ dòng đó. Khi bật Kết hợp câu, cả nội dung track dịch cũng được chia/gộp theo câu. “Hiện popup dịch trực tiếp” dùng `lhnSettings.translationPopupEnabled` với Dashboard; overlay tạm bật tùy chọn này và khôi phục trạng thái trước đó khi đóng nếu người dùng không đổi. Bộ giải mã transcript xử lý entity HTML lồng nhau; thanh điều khiển neo đáy overlay. Nút điều khiển dùng đúng hiệu ứng nhấn Bilingual Reader khi click/shortcut; click video toggle play/pause. Mục Chế độ xem nằm đầu Cài đặt video. Mặc định shortcut Dual Sub là Alt+E. Cần xác nhận hiển thị/hover pause trên Chromium/Firefox.
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
│   ├── dashboard.html             # Giao diện Dashboard (gồm ô tìm Settings `#settingsSearch`)
│   └── popup.html                 # Popup toolbar
├── js/
│   ├── core/                      # defaults, browser-polyfill, config, languages, messaging, settings, cache, shortcuts
│   ├── background/                # background.js (entry), annotations, usage-limits, error-logger
│   ├── content/                   # content.js (entry), web-highlighter, sentence-note, sidebar, note-composer, page-layout, ui-components, annotation-restore
│   │   ├── sidebar.js             # Khung, thẻ và tiện ích tìm kiếm Sidebar
│   │   ├── note-composer.js       # Dựng form và tạo/canonicalize record note
│   │   └── annotation-restore.js  # Chuẩn hóa text và tìm range để khôi phục annotation
│   ├── reader/                    # bilingual-reader, TTS engine, reader voice flags
│   ├── translate/                 # translate, dictionary, search, study translation
│   ├── dashboard/                 # dashboard.js (entry), settings-ui, study-view, study-utils, library, backup, account, profile-stats, flags
│   │   ├── settings-ui.js         # Bộ chọn ngôn ngữ, danh sách website, trạng thái Reader, ô tìm Settings (initSettingsSearch: lọc và tô sáng)
│   │   └── profile-stats.js       # Tổng hợp số liệu hồ sơ từ annotations
│   ├── video/                     # overlay-template.js (CSS/HTML overlay), dual-subtitles.js (adapter YouTube song ngữ)
│   ├── dictation/                 # dictation.js (overlay mode), dictation-score.js (căn chỉnh từ + diff từng từ), dictation-style.js (CSS cục bộ)
│   ├── popup/                     # popup.js (entry)
│   └── shared/                    # helpers như custom-font, icons và search.js (LHN_INDEX_SEARCH: normalize, createIndex, search, debounce)
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
Dashboard Settings ── ô tìm (`initSettingsSearch`) ──> shared/search (`LHN_INDEX_SEARCH`, debounce 200 ms)
                      └──> chỉ bật/tắt class tạm (`is-searching`, `has-search-match`, `settings-search-hidden`)
                           trên hàng/nhóm/tab và bọc kết quả trong `mark.lhn-search-match` (cùng kiểu tô sáng Dashboard/sidebar);
                           không đổi `hidden` hay state; Esc, đổi tab, đóng hộp thoại thì gỡ mark và xóa class
Dashboard Settings (`dictationShortcut`, mặc định Alt+F) ── storage ──> Content keydown ── `lhn-youtube-dictation-toggle`
  └──> YouTube Dual Sub mở overlay nếu đóng; chờ cue nếu đang tải ──> Dictation API open/close
YouTube Dual Sub (`state.allCues`, track language, live video)
  └── API overlay hiện có ──> Dictation v1 (3 cột trong overlay, score + phân tích lỗi + ghi chú; phát đúng một câu bằng requestAnimationFrame)
                                  ├── BILINGUAL_TRANSLATE → câu VI chỉ sau khi đúng
                                  └── browser.storage.local → solved / notes / bản dịch theo video+câu + thống kê từ sai theo video/từ/vị trí
Popup / Reader (chọn giọng) / Dashboard Settings (chọn ngôn ngữ, ô tìm) ── dùng chung ──> shared/search
```

Các mũi tên qua `core/messaging` là runtime messages. Settings giao diện được đọc/ghi trực tiếp qua `browser.storage`; không phải mọi luồng đều đi qua Background.

## 5. Nhật ký dự án (mới nhất → cũ nhất)

- **2026-10-28 | v3.4.709 | Arena sửa:**
  - Đặt padding trái/phải vùng tiêu đề, bộ lọc và danh sách thống kê về 0; để Chrome/Edge dùng `--lhn-scrollbar-width` (3px) bằng `scrollbar-width: auto`, còn Firefox dùng native `thin` như các vùng Dictation khác.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: CSS assertions cho padding ngang 0, scrollbar auto + biến 3px và Firefox-only thin, dark/light colors; `node --check` 47/47 JavaScript; parse `manifest.json`; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.708 | Arena sửa:**
  - Chỉ chỉnh khung thống kê: bỏ border ngoài, giảm lề ngang header/bộ lọc/danh sách để nội dung gần mép chứa hơn; thanh cuộn dùng chung biến chiều rộng và màu thumb/track với các vùng cuộn Dictation.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: CSS assertions cho border ngoài bằng 0, padding ngang 4px, width biến dùng chung và màu thumb light/dark; `node --check` 47/47 JavaScript; parse `manifest.json`; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.707 | Arena sửa:**
  - Chỉ sửa hàng biến thể thống kê: canh `+N` nằm ngang bên trái chevron xuống và giảm đúng 1px cỡ chữ số; khi mở chỉ hiện chevron lên. Các chip, kể cả biến thể bổ sung, dùng chung một flex-wrap list để chảy liên tục và tự xuống hàng.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: DOM/CSS assertions cho cấu trúc một list, trạng thái đóng/mở, `+N`/chevron cùng hàng, chỉ cỡ chữ `+N` 9px; `node --check` 47/47 JavaScript; parse `manifest.json`; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.706 | Arena sửa:**
  - Chỉ chỉnh khung thống kê theo ảnh mẫu: thêm huy hiệu tổng số từ sai bên phải tiêu đề; nút biến thể giữ vị trí, đóng hiển thị `+N` kèm chevron xuống, mở chỉ còn chevron lên; nút chỉ tạo khi có biến thể ẩn.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; Node DOM assertions cho badge, `+N`/icon hai trạng thái, điều kiện overflow và vùng mở rộng; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.705 | Arena sửa:**
  - Chỉ chỉnh khung thống kê: nút xổ/thu theo mẫu được đặt sát mép phải và chỉ tạo khi có biến thể ẩn; nền card, header, ô tìm và các hàng trong dark mode chuyển sang tông trung tính đồng bộ nền Ghi chú `#121212`.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; CSS/DOM assertions cho vị trí nút, điều kiện chỉ tạo khi có biến thể dư và màu nền dark; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.704 | Arena sửa:**
  - Kết nối khung thống kê Dictation với kết quả chấm thật: đếm từng lỗi/từ sai và biến thể (chuẩn hóa hoa thường/dấu câu theo scorer), ghi nhận sửa đúng một lần cho từng vị trí sau lỗi; cập nhật trạng thái gần nhất, xếp hạng, tỷ lệ sửa, tìm kiếm và bộ lọc. Lưu thống kê trong record cục bộ theo video; thay số mẫu bằng trạng thái rỗng/thông báo không có kết quả; dịch nhãn sửa đúng/tỷ lệ sửa và trạng thái trống EN/VI/KO.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `js/core/languages.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: kiểm tra Node cho lỗi lặp/biến thể, chuẩn hóa hoa thường-dấu câu, sửa đúng một lần mỗi đợt, reset chuỗi sai, đúng lần đầu, từ thiếu/trùng/thừa, lưu/khôi phục, render danh sách, xếp hạng, tìm kiếm và bộ lọc — đạt; `node --check` 47/47 JavaScript; parse `manifest.json`; assertion UI/localization/persistence EN/VI/KO; `git diff --check` — đạt. Chưa kiểm thử UI/runtime trên trình duyệt thật.

- **2026-10-28 | v3.4.703 | Arena sửa:**
  - Tích hợp UI thống kê từ sai vào cột Ghi chú Dictation theo HTML tham chiếu; bỏ trường Từ vựng khỏi giao diện, giữ ô ghi chú cá nhân. Có tìm kiếm/bộ lọc dạng tĩnh và mẫu 7 từ được gắn nhãn **Dữ liệu minh họa**; chưa kết nối thuật toán. Các dạng lỗi mở rộng bằng `<details>`; danh sách cuộn trong khung cao 50vh.
  - Giữ tương thích dữ liệu ghi chú cũ: khi lưu vẫn bảo toàn thuộc tính vocab cũ trong storage nhưng không hiển thị trường đó.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `js/core/languages.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse manifest; assertion UI (không còn vocab control, 7 mẫu, 3 nút xổ, scroll 50vh), lưu schema cũ và khóa dịch EN/VI/KO; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.702 | Arena sửa:**
  - Thêm icon Keepit, dấu gạch ngang và chữ Keepit ở góc trái trên video; thêm tiền tố `Keepit - ` trước tiêu đề trên thanh audio. Kích cỡ nhãn 13px, icon 20px, lề 12px; ẩn nhãn video khi chuyển sang compact audio.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; assertion icon/lockup, vị trí & cỡ logo, tiền tố audio, ẩn logo ở compact mode và dọn DOM; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.701 | Arena sửa:**
  - Tăng cỡ chữ hàng hint Dictation từ 11px lên 12px; giữ nguyên 4 cột đều nhau và cách căn mép.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; CSS assertion cỡ chữ 12px, 4 cột đều, không padding ngang, nhãn ngoài sát mép; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.700 | Arena sửa:**
  - Bỏ padding ngang của hàng hint Dictation; giữ 4 cột đều nhau, nhãn đầu căn trái sát mép, cuối căn phải sát mép, hai nhãn giữa căn giữa.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; CSS assertion 4 cột đều, padding ngang 0, nhãn ngoài căn trái/phải, hai nhãn giữa căn giữa; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.699 | Arena sửa:**
  - Đổi hàng hint Dictation thành bốn nhãn phím tắt chia đều một hàng: `(Enter) Chấm điểm`, `(Esc) Đáp án/Làm lại`, ``(`) Phát/Tạm dừng``, `(Ctrl) Nghe lại`; chỉ đổi chữ/bố cục hint, không đổi hành vi phím.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `js/core/languages.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; assertion bốn nhãn, `grid-template-columns: repeat(4, minmax(0, 1fr))`, nội dung EN/VI/KO và separator; `git diff --check` — đạt. Không đổi shortcut handlers; chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.698 | Arena sửa:**
  - Khôi phục video Dictation rộng toàn khung như v3.4.696; chỉ thanh audio compact được inset 12px hai bên theo sentence area.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; CSS assertions xác nhận video `width: 100%`/`margin-inline: 0`, audio compact `inset: 0 12px` và có card styling riêng, CSS cân bằng; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.697 | Arena sửa:**
  - Chỉnh lề ngang của video slot Dictation thành 12px mỗi bên, bằng `te-dict-sentence-area`; thanh audio compact phủ đúng video slot nên hai mép thẳng hàng.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; CSS assertion xác nhận video `margin-inline: 12px`, sentence area `padding: 10px 12px`, audio card phủ cùng slot, CSS cân bằng; `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.696 | Arena sửa:**
  - Thêm nút thu/khôi phục video bên trái Auto-play trong Dictation; trạng thái compact thay hình video bằng thanh audio cùng chiều rộng, cao 1/3 với hiệu ứng theo mẫu; danh sách câu mở rộng để dùng phần chiều cao dư, giữ compact khi chuyển câu và khôi phục khi đóng Dictation.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `js/core/languages.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; `git diff --check`; CSS cân bằng và xác nhận trạng thái compact, audio card, transition, sentence list flex; mock chiều cao xác nhận mở rộng → 1/3 → giữ tỉ lệ 1/3 khi resize → khôi phục khi tắt compact; kiểm tra cleanup khi đóng Dictation; xác nhận 4 nhãn EN/VI/KO — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.695 | Arena sửa:**
  - Chỉ trong Dictation: thêm ` tương đương Space để phát/tạm dừng audio/video; thay Alt+X bằng Esc hai lượt trong ô đáp án (lượt 1 điền toàn câu chưa chấm, lượt 2 xóa).
  - File: `js/dictation/dictation.js`, `js/core/languages.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; `git diff --check`; DOM/state mock xác nhận Esc lần đầu điền nguyên câu mà không chấm, lần hai gọi reset, backtick play/pause, auto-repeat không toggle liên tục, Alt+X không còn xóa, shortcut ngừng hoạt động khi Dictation đóng; hint EN/VI/KO — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.694 | Arena sửa:**
  - Dựa trên v3.4.692, chỉ tách từng mask thành phần tử riêng trong cùng luồng chip/từ để chúng wrap tự nhiên theo chiều rộng; không gom mọi mask thành một phần tử bị đẩy cả khối xuống hàng.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; parse `manifest.json`; `git diff --check`; DOM mock xác nhận mỗi từ thiếu được tạo thành phần tử mask riêng với độ dài đúng; CSS assertion xác nhận `flex-wrap: wrap`, mask là flex item độc lập và không còn cuộn ngang — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.693 | Arena sửa:**
  - Chỉ đổi hàng phản hồi Dictation để chip và mask tự xuống dòng khi không đủ chiều rộng, thay cho một hàng cuộn ngang; không đổi logic nhập, căn chỉnh, chấm điểm hay màu sắc.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/dictation/dictation-style.js`, `node --check js/dictation/dictation.js`, parse `manifest.json`, assertion CSS cân bằng và xác nhận feedback `flex-wrap: wrap`, bỏ cuộn ngang, mask được wrap, `git diff --check` — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.692 | Arena sửa:**
  - Lấy v3.4.689 làm nền, chỉ sửa Dictation input/feedback: gõ không hiện phản hồi; Enter chuẩn hóa từ khớp, giữ từ sai, xử lý tiền tố đúng và gợi ý màu; lỗi dừng gợi ý ở từ sai đầu tiên, mask phần sau trên cùng dòng; không thêm dấu câu cuối nếu từ cuối transcript chưa khớp; trạng thái đúng 100% giữ nguyên.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 47/47 JavaScript; `python3 -m json.tool manifest.json`; `git diff --check`; 11 ca Node tổng quát về case/dấu câu/từ sai-thiếu-thừa và không thêm dấu kết thúc khi từ cuối transcript chưa khớp; mock Enter/DOM xác nhận tiền tố đúng không chấm điểm, màu xanh/vàng/mask, lỗi đầu tiên + mask cùng dòng, gạch đỏ trong ô nhập và phản hồi không hiện khi đang gõ — đạt. Chưa kiểm thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.691 | Arena sửa:**
  - Dictation input/feedback: logic dùng transcript và căn chỉnh từ, không hardcode câu ví dụ. Enter trên tiền tố đúng chuẩn hóa chữ hoa, thêm dấu cách và hiện từ kế tiếp cùng các từ còn thiếu được mask theo độ dài trên cùng một dòng. Với câu có từ sai/thiếu/thừa, chuẩn hóa chữ hoa/dấu câu ở từ khớp theo transcript, giữ nguyên từ sai/thừa; gạch chân lỗi chỉ sau Enter/Check.
  - File: `js/dictation/dictation.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` Dictation JS/scorer; mô phỏng Enter `welcome` xác nhận `Welcome ` và gợi ý một dòng `Welcome to __ _______`; `welcome taa my english` xác nhận `Welcome taa my English.`; 8 ca tổng quát với transcript khác nhau bao gồm từ sai, thiếu, thừa và dấu câu — đạt; parse manifest; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-28 | v3.4.690 | Arena sửa:**
  - Dictation input: Enter khi đúng áp dụng chữ hoa và dấu câu theo transcript; tiền tố đúng nhưng chưa hết câu tự nối dấu cách khi Enter; sau khi chấm sai gạch chân đỏ đậm từ sai trong textarea; các từ thiếu được che bằng dấu gạch dưới theo độ dài và cách bằng dấu cách.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/dictation/dictation.js`, `node --check js/dictation/dictation-score.js`, `git diff --check`; source assertions; Node logic tests cho case/punctuation, prefix đúng, mask đúng độ dài/khoảng trắng và căn chỉnh từ sai — đạt. Chưa thử UI trên trình duyệt thật.

- **2026-10-28 | v3.4.689 | Arena sửa:**
  - Khắc phục race: khi Alt+F mở overlay trong lúc phụ đề chưa sẵn sàng, giữ yêu cầu và mở Dictation theo sự kiện `lhn-dual-captions-updated`; lần bấm lại hủy yêu cầu đang chờ, còn khi Dictation đã mở thì đóng.
  - File: `js/video/dual-subtitles.js`, `js/dictation/dictation.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho 6 file JavaScript; `git diff --check`; assertions tĩnh cho version, pending caption event và trạng thái Dictation; Node simulation xác nhận chờ cue, tự mở khi sẵn sàng, toggle đóng khi đang mở và hủy khi bấm lại — đạt. Chưa chạy UI trên trình duyệt thật.

- **2026-10-28 | v3.4.688 | Arena sửa:**
  - Thêm shortcut Alt+F có thể chỉnh/reset trong Dashboard > Shortcut; content script phát event theo mẫu Alt+E, YouTube handler mở overlay nếu cần rồi gọi Dictation toggle.
  - Thêm nhãn dịch en/vi/ko và nối luồng Dashboard setting → content keydown → event → Dual Sub/Dictation API.
  - File: `js/core/defaults.js`, `js/core/languages.js`, `js/content/content.js`, `js/dashboard/dashboard.js`, `pages/dashboard.html`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho 6 file JavaScript; `git diff --check`; assertions tĩnh cho manifest/default, Dashboard capture/reset, keydown/event YouTube, overlay và API toggle, nhãn en/vi/ko, script paths; Node simulation xác nhận Alt+F khi overlay đóng mở overlay rồi toggle Dictation, khi overlay mở gọi toggle trực tiếp — đạt. Chưa chạy UI trên trình duyệt thật.

- **2026-10-28 | v3.4.687 | Arena sửa:**
  - Nút Play/Pause video cập nhật icon lạc quan ngay khi bấm; sự kiện media play/pause chỉ reconcile với trạng thái thật, không khởi chạy pulse lần hai; nếu lệnh play bị từ chối, icon được đồng bộ lại.
  - File: `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/dual-subtitles.js`; manifest JSON/version; source assertions cho optimistic icon, đồng bộ lại nếu `play()` thất bại, event media chỉ reconcile và không pulse lần hai; `git diff --check` — đạt. UI Chrome/Edge thật: Chưa chạy.

- **2026-10-28 | v3.4.686 | Arena sửa:**
  - Luồng transcript: hover row `.yt-dual-item` dừng video; rời row thì resume chỉ nếu trước đó đang phát; click timestamp seek/play; click/double-click content không kích hoạt thao tác; selection-to-translate và Full Dictation giữ nguyên.
  - File: `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/dual-subtitles.js`; manifest JSON/version; source assertions xác nhận hover row pause/resume, timestamp-only seek/play, bỏ handler click/double-click trên content và giữ selection guard; `git diff --check` — đạt. UI Chrome/Edge thật: Chưa chạy.

- **2026-10-28 | v3.4.685 | Arena sửa:**
  - Trong `yt-dual-item`, chỉ click `.yt-dual-timestamp` mới gọi seek/play; `.yt-dual-content` không kích hoạt seek, còn double-click pause cũng giới hạn trong timestamp.
  - File: `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/dual-subtitles.js`; manifest JSON/version; source assertions xác nhận chỉ timestamp xử lý seek/play, content không kích hoạt click, double-click pause chỉ áp dụng timestamp; `git diff --check` — đạt. UI Chrome/Edge thật: Chưa chạy.

- **2026-10-28 | v3.4.684 | Arena sửa:**
  - Ảnh cho thấy nút mũi tên là `#lhn-sidebar-edge-toggle` của sidebar chính Keepit, nằm ngoài Shadow DOM video overlay. Trong lúc overlay mở, ẩn edge toggle khi sidebar chính đóng; khi nút tròn được bấm, gọi edge toggle hiện có để mở sidebar chính (panel phủ lên nút); edge toggle hiện khi sidebar chính mở và ẩn lại khi đóng. Giữ nguyên markup/style/icon gốc v3.4.680 của nút tròn; không đổi trạng thái sidebar phụ đề video.
  - File: `css/content/content.css`, `js/video/dual-subtitles.js`, `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` hai JS; parse Overlay CSS (241 quy tắc), Dictation CSS (190), content CSS (534), 0 lỗi; manifest JSON/version và resource paths; assertion markup/style nút tròn khớp v3.4.680, handler gọi `#lhn-sidebar-edge-toggle`, edge toggle chỉ ẩn khi overlay mở và sidebar chính đóng; `git diff --check` — đạt. UI Chrome/Edge thật: Chưa chạy.

- **2026-10-28 | v3.4.683 | Arena sửa:**
  - Khôi phục icon gốc v3.4.680 cho nút tròn tím; nút luôn hiện ở dưới lớp sidebar trong video overlay thường, sidebar phủ lên nút khi mở. Mỗi lần mở overlay sidebar ở trạng thái ẩn; nút Bố cục hiện khi sidebar mở và ẩn khi sidebar đóng.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` hai JS; parse Overlay CSS (244 quy tắc, 0 lỗi); manifest JSON/version; assertion so icon SVG v3.4.680 và logic trạng thái/sidebar/z-index; `git diff --check` — đạt. UI Chrome/Edge thật: Chưa chạy.

- **2026-10-28 | v3.4.682 | Arena sửa:**
  - Rà soát thanh cuộn trong toàn bộ Shadow DOM video/Dictation: quy tắc WebKit gắn trực tiếp với overlay root; truyền giá trị `--lhn-scrollbar-width` chung từ document lên Shadow host; bổ sung selector rõ ràng cho center body, note body và textarea Dictation bên cạnh danh sách/ô nhập.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` ba JS; parse Overlay CSS (244 quy tắc) và Dictation CSS (190 quy tắc), 0 lỗi; source assertions cho các vùng cuộn và biến chung; parse manifest; `git diff --check` — đạt. UI Chrome/Edge thật: Chưa chạy.

- **2026-10-28 | v3.4.681 | Arena sửa:**
  - Video overlay: khi sidebar mở, giữ nút `Bố cục` để đóng; khi sidebar ẩn, ẩn nút đó và hiện `te-floating-btn` cố định góc dưới phải để mở lại. Đưa nút tím ra ngoài DOM sidebar để không bị `display:none` của panel che; giữ vị trí hiển thị.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` hai JS; parse Overlay CSS (244 quy tắc, 0 lỗi); assertions cấu trúc/nút và state logic; parse manifest; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-28 | v3.4.680 | Arena sửa:**
  - Dictation: đổi thumb scrollbar dark mode sang xám sáng; giữ màu light mode. Khai báo riêng chiều rộng dọc và chiều cao ngang bằng `--lhn-scrollbar-width` cho cả ô nhập và danh sách câu.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` Dictation style; parse CSS (190 quy tắc, 0 lỗi); assertions cho màu thumb và kích thước dọc/ngang theo biến chung; parse manifest; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-28 | v3.4.679 | Arena sửa:**
  - Dictation Ambient: giữ nguyên lớp Ambient phủ grid ba cột; khi hiệu ứng bật, nền của panel giữa và ghi chú bên phải trong suốt để ánh sáng không bị che. Khi Ambient tắt, màu nền light/dark cũ giữ nguyên.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` Dictation style; parse CSS (188 quy tắc, 0 lỗi); source assertions xác nhận hai panel chỉ trong suốt khi Dictation và Ambient cùng bật; parse manifest; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-28 | v3.4.678 | Arena sửa:**
  - Dictation: hint được tách thành ba mục từ bản dịch hiện có và xếp lần lượt trái/giữa/phải bằng flex; giữ nguyên câu chữ và bản dịch.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` Dictation JS/CSS; assertions ba phần hint ở EN/VI/KO và căn lề CSS; parse CSS Dictation (187 quy tắc, 0 lỗi); parse manifest; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-28 | v3.4.677 | Arena sửa:**
  - Dictation: làm rõ scrollbar của ô nhập và `#te-dict-sentences`: giữ width từ `--lhn-scrollbar-width`, thêm thumb/track nhìn thấy được ở light/dark mode; Firefox dùng native `thin` scrollbar.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` Dictation CSS/JS; parse CSS Dictation (183 quy tắc, 0 lỗi); assertions xác nhận hai target dùng chung width và có thumb colors cho cả theme; parse manifest; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-28 | v3.4.676 | Arena sửa:**
  - Dictation: ô nhập và `#te-dict-sentences` cùng reset `scrollbar-width`/`scrollbar-color` về `auto` và đặt chiều rộng/cao WebKit bằng `var(--lhn-scrollbar-width)`; ô nhập cuộn dọc khi nội dung tràn.
  - File: `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho Dictation CSS/JS; parse CSS Dictation (179 quy tắc, 0 lỗi); source assertions xác nhận cả hai scrollbar dùng cùng biến và textarea có `overflow-y:auto`; parse manifest; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-28 | v3.4.675 | Arena sửa:**
  - YouTube: khi mở video overlay, ẩn scrollbar dọc trang bằng cách lưu/khôi phục inline `overflow-y` của `html` và `body`; khi overlay đóng sẽ khôi phục cả trạng thái trước đó. Dictation vẫn được đóng trước khi khôi phục style của overlay.
  - Dictation: scrollbar textarea dùng chung `--lhn-scrollbar-width` thay vì dựa vào mặc định trình duyệt; reset `scrollbar-width`/`scrollbar-color` để quy tắc WebKit theo biến chung có hiệu lực.
  - File: `js/video/dual-subtitles.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` JS liên quan; parse CSS Dictation (178 quy tắc, 0 lỗi); source assertions cho vòng đời ẩn/khôi phục và biến chung; parse manifest; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.674 | Arena sửa:**
  - Dictation: sửa nguyên nhân thực tế khiến ↑/↓ bị chặn. Ô nhập nằm trong Shadow DOM, vì vậy listener capture bên ngoài thấy `event.target` là host; các listener Reader/voice picker nay kiểm tra `composedPath()` để không lấy mất phím mũi tên từ textarea.
  - File: `js/content/content.js`, `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho `content.js`, `bilingual-reader.js`, `dictation.js`; mock `composedPath` xác nhận ↑/↓ từ textarea được bỏ qua, Enter và mũi tên ngoài ô nhập không đổi; kiểm tra source assertions; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.673 | Arena sửa:**
  - Dictation: ArrowUp/ArrowDown trong textarea được trả về xử lý mặc định của trình duyệt bằng cách bỏ qua `stopPropagation()` tại listener riêng; xử lý Enter và phím khác giữ nguyên.
  - File: `js/dictation/dictation.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/dictation/dictation.js`; mock handler xác nhận ArrowUp/Down không bị chặn và Enter/phím khác giữ luồng; parse manifest JSON; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.672 | Arena sửa:**
  - Dictation: lưu trạng thái đã chấm trước khi nhập; chỉ gọi `updateRows(false)` nếu người dùng bắt đầu sửa một đáp án đã chấm đúng. Gõ thông thường không còn duyệt/cập nhật lại danh sách câu theo từng phím.
  - File: `js/dictation/dictation.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/dictation/dictation.js`; mock handler xác nhận không refresh khi gõ thường và refresh đúng một lần sau đáp án đã chấm; parse manifest JSON; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.671 | Arena sửa:**
  - Khi có đáp án sai, ô nhập giữ nguyên vị trí: input và gợi ý được giữ trong cùng một flex stack, còn `te-dict-error` được đặt tuyệt đối bên dưới stack để không làm thay đổi chiều cao đang được căn giữa. Trạng thái khác giữ luồng bố cục hiện có.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` Dictation JS/CSS; CSS Dictation (177 quy tắc, 0 lỗi); assertion thứ tự DOM, error absolute bên dưới stack và gỡ trạng thái khi rời nhánh sai; parse manifest JSON; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.670 | Arena sửa:**
  - Dựa trên phần Dictation của v3.4.668; đặt pháo hoa vào lớp absolute riêng, tách khỏi các item grid của overlay để không làm thanh `.te-control-bar` dịch chuyển.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` Dictation JS/CSS; CSS parse (175 quy tắc), xác nhận lớp pháo hoa absolute/contained; mock test xác nhận 90 mảnh nằm trong một lớp và được dọn sau 1.5 giây; parse manifest JSON; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.669 | Arena sửa:**
  - Chỉ tối ưu pháo hoa Dictation để giảm khựng: giảm số mảnh từ 90 xuống 60, gom vào một `DocumentFragment` để thêm vào DOM một lần và dùng một timer để dọn cả nhóm.
  - File: `js/dictation/dictation.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/dictation/dictation.js`; mock test xác nhận 60 mảnh/1 lần append/1 timer và xóa đủ mảnh; parse manifest JSON; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.668 | Arena sửa:**
  - Dictation: sau khi chấm đúng toàn bộ từ, tự bổ sung dấu câu còn thiếu theo câu mẫu; giữ nguyên ký tự chữ người dùng đã nhập. Chỉ chạy trong nhánh trả lời đúng, không tác động câu có từ sai.
  - File: `js/dictation/dictation.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/dictation/dictation.js`; 6 trường hợp hoàn thiện dấu câu và 2 kiểm tra điều kiện chấm đúng/sai; parse manifest JSON; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.667 | Arena sửa:**
  - Dictation: trạng thái blur/khóa của câu hiện tại dựa trên lần chấm đúng trong phiên hiện tại, không dựa vào kết quả lưu cũ; câu hiện tại và phía dưới ẩn dịch/blur, các câu phía trên không blur và hiện dịch. Mở/chuyển câu luôn phát audio; repeatCount là số lượt thêm (tổng n+1). Khi đúng, giữ toàn bộ câu trong `te-dict-error-words` dưới dạng từ màu xanh.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` Dictation JS/CSS/scorer; parse manifest JSON; CSS Dictation 174 quy tắc, 0 lỗi; assertion blur/dịch, khóa khi mở lại, repeat count và câu đúng; `git diff --check` — đạt. Đã fetch branch GitHub, cây mã nguồn trùng baseline. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.666 | Arena sửa:**
  - Dictation: bắt buộc mọi chữ trong `te-dict-error-words` cỡ 14px; khi chấm đúng, câu hiện tại được mở (không blur), `te-dict-error` chuyển nền/viền xanh như success, tiêu đề `Câu đúng` có icon tick xanh; gợi ý từ thiếu không có dấu mũi tên.
  - Khi mở Dictation tự phát câu hiện tại (câu đầu hoặc câu tiếp tục từ tiến độ) theo repeat setting, kể cả Auto-play đang tắt; 0x vẫn phát một lần. Ẩn scrollbar dọc trang YouTube trong khi Dictation mở và khôi phục style cũ khi đóng.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `js/core/languages.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` các JS Dictation/localization; CSS Dictation (174 quy tắc, 0 lỗi); localization EN/VI/KO; assertion tính năng; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.665 | Arena sửa:**
  - Dựa trên mã nguồn v3.4.663; dùng `checkedCurrent` để giữ đúng luồng: gõ không đổi màu/chưa chấm, Enter mới chấm; chỉ kết quả đúng 100% mới bật hiệu ứng/lời chúc/bản dịch, lúc đó Chấm điểm mất vàng và Câu tiếp vàng. Enter tiếp theo bấm Câu tiếp; không tự chuyển câu cùng lúc chấm.
  - Bản 3.4.664 bị người dùng từ chối; giữ ZIP đó nguyên vẹn và phát hành bản sửa này ở version mới.
  - File: `js/dictation/dictation.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` ba tệp Dictation JS; CSS Dictation (170 quy tắc, 0 lỗi); `python3 -m json.tool manifest.json`; assertion trạng thái gõ/chấm/hiệu ứng/màu nút/Enter; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.663 | Arena sửa:**
  - Dictation: khi chưa có câu nào đã giải thì mở từ câu đầu; nếu đã có kết quả thì lưu/khôi phục đúng câu đang học, với các câu phía trên có thể mở và không blur. Kết quả cũ không có chỉ số hiện tại sẽ quay về câu chưa giải đầu tiên sau chuỗi đã giải.
  - `te-dict-translation` chỉ hiện sau khi câu hiện tại được chấm đúng 100%, ẩn khi sửa đáp án sai hoặc chuyển câu; ẩn `te-dict-error` khi gõ/phát sinh input. Enter sau câu đã đạt 100% bấm trực tiếp Câu tiếp.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` ba tệp Dictation JS; CSS Dictation (170 quy tắc, 0 lỗi); parse manifest; assertion các hành vi tiến độ/blur/dịch/lỗi/Enter/↑↓; `git diff --check` — đạt. UI trình duyệt thật: Chưa chạy.

- **2026-10-27 | v3.4.662 | Arena sửa:**
  - Dictation: ẩn nghĩa VI ở các câu blur/khóa trong danh sách kể cả khi bản dịch đã lưu; Enter với đáp án chưa đúng 100% kích hoạt nút Chấm điểm; khi đạt 100%, nút Chấm điểm dùng cùng kiểu màu nền với Nghe chậm và cập nhật lại khi sửa đáp án. Giữ xử lý ↑/↓ trong ô nhập/ghi chú như văn bản thông thường vốn có ở bản 3.4.661.
  - Chỉ sửa trong module Dictation ngoài việc bump version và cập nhật nhật ký/trạng thái; không thay đổi tính năng ngoài phạm vi. Kiểm thử UI trên trình duyệt thật: Chưa chạy.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` Dictation JS/scorer; CSS Dictation (169 quy tắc, 0 lỗi); assertion hành vi cho blur/bản dịch, Enter, màu nút và ↑/↓; `git diff --check` — đạt. UI runtime: Chưa chạy.

- **2026-10-27 | v3.4.661 | Claude sửa:**
  - Dictation (7): ↑/↓ trong ô nhập và ô ghi chú không còn bị chặn; con trỏ di chuyển như văn bản thường. ↑/↓ ngoài ô nhập vẫn bị chặn.
  - File: `js/dictation/dictation.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/dictation/dictation.js` — đạt. Trên trình duyệt: Chưa chạy.
  - Việc đang mở: làm rõ mục 2 (phạm vi blur câu dịch) và mục 6 (hành vi Enter sau khi đúng 100%).


- **2026-10-27 | v3.4.660 | Claude sửa:**
  - Dictation: (2) danh sách câu từ câu đang nhập trở xuống luôn blur và không bấm được; (3) ghi chú khóa khi vào mỗi câu, chỉ mở sau khi đúng 100%; (4) lỗi theo vị trí: đúng xanh, sai gạch đỏ + gợi ý vàng, dừng ở lỗi đầu tiên, từ thừa báo "thừa", bỏ chip +N; (5) lặp mặc định 3, kể cả nghe chậm; (6) Enter sau khi đúng 100% chuyển focus sang Câu tiếp (vàng), nút Chấm điểm xám, Enter tiếp theo sang câu kế; (7) ↑/↓ trong ô nhập chỉ di chuyển con trỏ; (10) ↑/↓ ngoài ô nhập bị chặn; (11) danh sách cuộn giữa câu hiện tại; (12) thông báo thành công nằm trên ô nhập.
  - Phím tốc độ overlay (8, 9): đổi ↑/↓ thành Shift+> (tăng) và Shift+< (giảm), bước 0.05; khi đang gõ trong ô nhập thì nhập ký tự bình thường.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` các file đã sửa — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-27 | v3.4.659 | Claude sửa:**
  - Dictation v1 đổi UI khu giữa theo file mẫu: tiêu đề + huy hiệu độ chính xác, thẻ âm thanh video kèm "Tự phát khi chuyển câu", ô nhập lớn viền hổ phách, phân tích lỗi từng từ (đúng/sai gạch + từ sửa/thừa; từ thiếu gộp thành chip +N, không lộ đáp án), banner thành công, thẻ dịch, hàng Lặp 0x–3x và 5 nút Câu trước/Phát lại/Chấm điểm/Nghe chậm/Câu tiếp. Hàng câu dùng chip số + icon; ghi chú có nút lưu ở tiêu đề, dòng tự lưu ở chân; thanh điều khiển có vòng độ chính xác. Giữ nguyên các điểm đã chốt: thanh điều khiển full-width, "Câu tiếp" khóa đến khi gõ đúng, `#18181b` chỉ ở dark mode, chưa làm Nói.
  - Âm thanh Web Audio đúng (4 nốt) và sai (sawtooth) như file mẫu; pháo giấy cục bộ 90 mảnh, không dùng CDN.
  - Phát đúng một câu: mở Dictation thì tạm dừng và tua về đầu câu; mọi lần phát (Ctrl, nút, click video, Space) bị giới hạn trong câu hiện tại và dừng bằng requestAnimationFrame (không dùng timeupdate vì trôi sang câu sau); không tự nhảy câu; tạm tắt vòng lặp câu của Dual Sub khi mở và khôi phục khi đóng; Nghe chậm 0.6x tự khôi phục tốc độ.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `js/dictation/dictation-score.js`, `js/core/languages.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho 3 file Dictation và `languages.js`; manifest parse được; 40 khóa `dictation*` có đủ EN/VI/KO; kịch bản Chromium headless (Playwright) trên CSS/HTML overlay thật với video giả lập có đồng hồ: 30/30 mục đạt, không lỗi trang. Chưa chạy trên YouTube thật (Chrome/Edge/Firefox).
  - Lưu ý: chưa làm dòng IPA dưới ô nhập (file mẫu có) và chế độ Nói (v2); README và OPT-ARENA.md chưa cập nhật.

- **2026-10-27 | v3.4.658 | Arena sửa:**
  - Hoàn thiện Dictation v1 ngay trong YouTube overlay Dual Sub hiện có: video YouTube thật, danh sách câu tiếng Anh nạp dần quanh câu đang phát, chấm theo căn chỉnh từ, dịch Việt sau khi giải đúng, ghi chú/tiến độ lưu cục bộ theo video và câu; tái sử dụng thanh điều khiển và giữ X/AI keepit để đóng chế độ.
  - Khóa cạnh tranh khi nạp tiến độ/dịch theo video và phiên hiện hành; chuyển câu xóa trạng thái đúng cũ; tải phụ đề thất bại phát sự kiện để không giữ nội dung cũ. Chỉ có chế độ Đánh máy trong v1, không xin quyền micro.
  - Chuỗi giao diện mới có EN/VI/KO; README, OPT-ARENA §8.1.2 và bản đồ kiến trúc được cập nhật.
  - File: `js/dictation/dictation.js`, `js/dictation/dictation-style.js`, `js/video/dual-subtitles.js`, `js/core/languages.js`, `manifest.json`, `README.md`, `OPT-ARENA.md`, `PROJECT.md`.
  - Kiểm tra: `node --check` 45/45 JS; `python3 -m json.tool manifest.json`; CSS Dictation (97 quy tắc, 0 lỗi); 44 đường dẫn cục bộ trong manifest; chuỗi EN/VI/KO đủ; 3 ca scorer (hoa thường/dấu câu/nháy cong, căn chỉnh, từ thừa); kiểm tra scope v1/load order; `git diff --check` — đạt. Kiểm thử UI trên trình duyệt thật: Chưa chạy (môi trường không có trình duyệt/Playwright).

- **2026-10-26 | v3.4.656 | Claude sửa:**
  - Chỉ sửa ô tìm Settings của Dashboard: (1) cao 40px; (2) thêm icon tìm kiếm bên trái trong ô (bộ path `search` của app); (3) ô dính ở đầu khi cuộn (`position: sticky`, nền trùng nền Settings, bù padding của vùng nội dung ở các mức ≤700px và ≤520px); (4) tô sáng kết quả bằng `mark.lhn-search-match` (nền `#fff2ad` như Dashboard/sidebar), chỉ trong nhãn, mô tả và tiêu đề của hàng/nhóm đang hiện, khớp không phân biệt hoa thường và dấu; gỡ sạch mark khi xóa ô tìm.
  - Thêm một quy tắc dark mode giới hạn trong Settings: chữ trong mark đổi sang `#111827` để đọc được trên nền vàng. Không đổi highlight ở Dashboard/sidebar.
  - Lưu ý: chuẩn hóa dùng chung chưa gộp chữ `đ` thành `d` nên gõ "toc do" chưa khớp "tốc độ" (gõ "toc" khớp); lọc và tô sáng cùng hành vi.
  - File: `pages/dashboard.html`, `css/dashboard/dashboard.css`, `js/dashboard/settings-ui.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/dashboard/settings-ui.js` và parse `manifest.json` — đạt. Chromium headless (Playwright) trên markup/CSS Settings thật: ô cao đúng 40px, icon nằm trong ô và canh giữa, mark chỉ nằm trong hàng đang hiện, khớp không dấu ("toc" → "tốc"), ô dính ở top 0 sau khi cuộn hết, sau Esc DOM giống hệt ban đầu và không còn mark, dark mode có màu mark và nền ô đúng. Trên extension chạy thật (Chrome/Edge/Firefox): Chưa chạy.

- **2026-10-26 | v3.4.655 | Claude sửa:**
  - Thêm ô tìm ở đầu Settings của Dashboard: gõ (debounce 200 ms, `LHN_INDEX_SEARCH`, không phân biệt hoa thường và dấu) để ẩn các hàng không khớp qua mọi tab, ẩn nhóm/tab trống và hiện "No settings found" khi không có kết quả; xóa ô tìm (Esc, đổi tab, đóng hộp thoại) thì về nguyên trạng. Từ khóa mỗi hàng gồm nhãn, mô tả, tiêu đề h3 gần nhất và tiêu đề tab; không làm nổi bật kết quả. Chỉ bật/tắt class tạm, không đổi `hidden`.
  - Chuỗi mới `settingsSearchPlaceholder`, `settingsSearchNoResults` (EN/VI/KO). Nút Reset của tab Shortcut được ẩn trong lúc tìm.
  - Chưa làm (đã chốt, xem Việc đang mở 27): làm nổi bật ẩn và điều hướng ↑/↓.
  - File: `pages/dashboard.html`, `js/dashboard/settings-ui.js`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `css/dashboard/dashboard.css`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` 3 file JS đã sửa và parse `manifest.json` — đạt. Chromium headless (Playwright) trên markup/CSS Settings thật + `search.js` + `settings-ui.js`: 10 ca đạt (debounce, lọc theo nhãn/mô tả/tiêu đề tab, không khớp, Esc/đổi tab/đóng hộp thoại xóa sạch class, thuộc tính `hidden` không đổi). Trên extension chạy thật (Chrome/Edge/Firefox): Chưa chạy.

- **2026-10-26 | v3.4.654 | Claude sửa:**
  - Sửa lỗi xung đột tên: `js/shared/search.js` (v3.4.652–653) ghi đè `globalThis.LHN_SEARCH` của `js/translate/search.js` (có `highlightMatches`, `rank`), làm hỏng highlight ở sidebar và Dashboard. Đổi tên module mới thành `LHN_INDEX_SEARCH` và cập nhật các nơi gọi (bilingual-reader, popup, settings-ui).
  - File: `js/shared/search.js`, `js/reader/bilingual-reader.js`, `js/popup/popup.js`, `js/dashboard/settings-ui.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` các file đã sửa — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-26 | v3.4.653 | Claude sửa:**
  - Áp dụng `LHN_SEARCH` (bỏ dấu, không phân biệt hoa thường) cho ô chọn ngôn ngữ của popup (`js/popup/popup.js`) và Settings Dashboard (`js/dashboard/settings-ui.js`); nạp `js/shared/search.js` trong `pages/popup.html` và `pages/dashboard.html`.
  - Không đổi: ô tìm Dashboard (đã có debounce riêng); `js/translate/search.js` (tìm chữ trong trang, không phải lọc danh sách).
  - File: `js/popup/popup.js`, `js/dashboard/settings-ui.js`, `pages/popup.html`, `pages/dashboard.html`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-26 | v3.4.652 | Claude sửa:**
  - Thêm module tìm kiếm dùng chung `js/shared/search.js` (`LHN_SEARCH`: normalize, createIndex, search, debounce 200 ms). Áp dụng thử cho ô tìm giọng trình duyệt: chỉ mục tính một lần và cache theo danh sách giọng; gõ được debounce 200 ms; bỏ qua khi truy vấn chuẩn hóa không đổi.
  - Chưa áp dụng cho Dashboard, sidebar, flashcard (chờ kết quả thử nghiệm ở chọn giọng).
  - File: `js/shared/search.js` (mới), `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho `search.js` và `bilingual-reader.js` — đạt. Thử nghiệm module trong Node với 600 giọng giả: 0 sai khác so với lọc thủ công trên 1000 truy vấn; tìm trung bình ~0,05 ms; 3 lần gõ nhanh chỉ gọi 1 lần. Trên Edge: Chưa chạy.


- **2026-10-26 | v3.4.651 | Claude sửa:**
  - Ô tìm kiếm giọng trình duyệt: tìm theo tên giọng, mã vùng, mã ngôn ngữ, và tên quốc gia/ngôn ngữ bằng ngôn ngữ hiển thị lẫn tiếng Anh; không phân biệt hoa thường và dấu (chuẩn hóa NFD). Chưa hỗ trợ viết tắt không chuẩn như "UAE" (chỉ mã AE).
  - File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/reader/bilingual-reader.js` — đạt. Trên Edge: Chưa chạy.


- **2026-10-26 | v3.4.650 | Claude sửa:**
  - Danh sách giọng trình duyệt (Select Voice): hiển thị 2 dòng — dòng 1 tên quốc gia, dòng 2 tên giọng ngắn · ngôn ngữ; tooltip giữ tên đầy đủ và mã ngôn ngữ. Tên lấy từ `Intl.DisplayNames` theo ngôn ngữ hiển thị. Danh sách Google TTS giữ nguyên.
  - File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/reader/bilingual-reader.js` — đạt. Trên Edge: Chưa chạy.
  - Việc đang mở: chưa thêm từ khóa tìm kiếm ẩn (đề xuất trước đó, chờ quyết định).


- **2026-10-26 | v3.4.649 | Claude sửa:**
  - Thêm cờ cho các giọng Edge còn thiếu (từ danh sách console): AE, BH, DZ, EG, IQ, JO, KW, LB, LY, MA, OM, QA, SY, TN, YE, AZ, BG, BA, KE, NG, SG, TZ, BO, CR, CU, DO, EC, GQ, GT, HN, NI, PA, PE, PR, PY, SV, UY, VE, EE, HR, IS (flag-icons 1x1, MIT). Ánh xạ thêm CANS → cờ Canada cho giọng Inuktitut.
  - File: `js/reader/bilingual-flags.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/reader/bilingual-flags.js` — đạt. Trên Edge: Chưa chạy.


- **2026-10-26 | v3.4.648 | Claude sửa:**
  - Debug: khi mở danh sách giọng đọc trình duyệt, log ra console (`console.info`) mỗi vùng chưa có cờ, kèm tên giọng và mã ngôn ngữ, để lập danh sách cờ còn thiếu. Không đổi UI.
  - File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/reader/bilingual-reader.js` — đạt. Trên Edge: Chưa chạy.


- **2026-10-26 | v3.4.647 | Claude sửa:**
  - Thêm cờ còn thiếu cho các giọng Edge không có cờ: AU, CA, IE, ZA, NZ, MX, AR, CO, CL, AT, CH, PT, NL, BE, SE, NO, DK, FI, CZ, GR, HU, MY, IL, KZ (từ flag-icons 1x1, MIT, đã rút gọn SVG). Ánh xạ vùng trong `FLAG_REGION_KEYS`.
  - File: `js/reader/bilingual-flags.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/reader/bilingual-flags.js` — đạt. Trên Edge: Chưa chạy.


- **2026-10-26 | v3.4.646 | Claude sửa:**
  - Thanh đọc `#lhn-bilingual-reading-bar` chỉ ẩn khi bấm nút đóng (`data-close`) hoặc bật/tắt bằng Alt+R. Bỏ các trường hợp tự ẩn: reader không hoạt động, website bị tắt. Hàm `closeReadingBar()` dùng cho cả hai đường đóng hợp lệ.
  - File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/reader/bilingual-reader.js` — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-26 | v3.4.645 | Claude sửa:**
  - Phím ↑/↓ tăng/giảm tốc độ video 0.05 khi overlay đang mở (bỏ gán cũ cho "Audio"); bỏ qua khi đang gõ trong ô nhập.
  - Hiện mức tốc độ hiện tại (`te-speed-label`) bên phải nút "Tốc độ", cỡ chữ 18px như giá trị trong popup (giả định, chờ xác nhận).
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-26 | v3.4.644 | Claude sửa:**
  - Popup tốc độ hiện căn giữa phía trên nút "Tốc độ" (thay cho vị trí cố định góc phải dưới). Vị trí tính từ hình chữ nhật của nút và kích thước thực của popup; sát mép thì kéo vào trong.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-26 | v3.4.643 | Claude sửa:**
  - Nút "Tốc độ" trên thanh điều khiển video mở popup tốc độ (từ speed_control_component): 8 mức (0.5, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 2.0), thanh trượt 0.5–2.0 bước 0.05, nút −/+. Hai mode sáng/tối theo theme overlay. Thay cho chuyển tốc độ tuần tự trước đây.
  - Logic: đặt `video.playbackRate`, đồng bộ mức đang dùng; bấm ra ngoài popup thì đóng.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.
  - Việc đang mở: nhãn "Bình thường" (nút 1.0) chưa dịch đủ ngôn ngữ (theo yêu cầu tạm thời).


- **2026-10-26 | v3.4.642 | Claude sửa:**
  - Full dict popup: bỏ lần vẽ sớm (chỉ có nghĩa chính). Popup giữ khung tải và chỉ vẽ một lần khi đã có đủ nghĩa, từ liên quan và IPA. Nhánh mở từ ghi chú không đổi.
  - File: `js/content/content.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/content/content.js` — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-26 | v3.4.641 | Claude sửa:**
  - Hoàn tác v3.4.640 (gom nhóm Cài đặt video): mã nguồn trở về đúng nội dung v3.4.639, theo yêu cầu. Đánh số 3.4.641 vì gói 3.4.639 đã xuất và không ghi đè được.
  - File: toàn bộ mã nguồn được khôi phục từ gói 3.4.639 (`js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `js/core/defaults.js`, `manifest.json`, `PROJECT.md`).
  - Kiểm tra: so sánh nội dung với gói 3.4.639 — khớp. Trên trình duyệt: Chưa chạy.


- **2026-10-26 | v3.4.640 | Claude sửa:**
  - Cài đặt video gom thành 4 nhóm có tiêu đề: Hiển thị (Chế độ xem, Chủ đề, Ambient mode, Ẩn thanh điều khiển); Phụ đề (Ngôn ngữ phụ đề, Tùy chọn phụ đề, Kết hợp câu, Ẩn bản dịch); Học tập và tương tác (Hiện popup dịch trực tiếp, Nhấp để phát âm, Đánh dấu từ); Dữ liệu và công cụ (Bộ dịch, Bộ sưu tập, Xuất phụ đề).
  - Công tắc có `data-setting` (popup, speak, combine, hidevi, hidectrl) và `sw(key)` thay cho chỉ số `mainSw[i]` để đổi thứ tự không làm lệch.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.
  - Việc đang mở: các tiêu đề nhóm (Hiển thị, Phụ đề, Học tập và tương tác, Dữ liệu và công cụ) chưa dịch đủ ngôn ngữ (theo yêu cầu tạm thời).


- **2026-10-26 | v3.4.639 | Claude sửa:**
  - Gỡ đề xuất Ambient 3 của v3.4.638 (sáng hơn, mờ dần): Ambient 3 trở về như v3.4.637.
  - Đổi thứ tự và nhãn: Ambient 1 = cạnh viền lan 50% (trước là 2); Ambient 2 = cạnh viền lan 100% (trước là 3); Ambient 3 = radial (trước là 1). Menu Tắt | Ambient 1 | Ambient 2 | Ambient 3.
  - Khóa lưu đổi từ `ambientMode` sang `ambientStyle`, mặc định Ambient 3 (radial). Các lựa chọn đã lưu trước đó sẽ về mặc định.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `js/core/defaults.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.
  - Việc đang mở: nhãn "Ambient 1–3" và "Tắt" chưa dịch (theo yêu cầu tạm thời).


- **2026-10-26 | v3.4.638 | Claude sửa:**
  - Ambient 3 khác Ambient 2: sáng hơn (opacity 0.85 so với 0.6) và mờ dần về phía mép khung 100% bằng mặt nạ radial (class `te-ambient-mode-3`).
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-26 | v3.4.637 | Claude sửa:**
  - Ambient 3: phạm vi lan tăng từ 80% lên 100% khoảng trống còn lại theo từng hướng.
  - File: `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/dual-subtitles.js` — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-26 | v3.4.636 | Claude sửa:**
  - Ambient 3: cùng cách hiển thị cạnh viền 16:9 như Ambient 2, nhưng ánh sáng lan tối đa 80% khoảng trống còn lại (Ambient 2 là 50%). Bỏ khóa nút Ambient 3 trong menu.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.
  - Việc đang mở: nhãn "Ambient 3" chưa dịch (theo yêu cầu tạm thời).


- **2026-10-26 | v3.4.635 | Claude sửa:**
  - Ambient mode: bỏ công tắc; hàng "Ambient mode" mở menu con (giống Tùy chọn phụ đề) với nhóm nút Tắt | Ambient 1 | Ambient 2 | Ambient 3. Ambient 1 = radial hiện tại; Ambient 2 = mới, lấy màu viền khung video, khung 16:9 lan tối đa 50% khoảng trống trên màn hình theo từng hướng; Ambient 3 làm mờ, không bấm được.
  - Lưu `ambientMode` (mặc định '1') trong `js/core/defaults.js`; `ambient` giữ đồng bộ để tương thích.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `js/core/defaults.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.
  - Việc đang mở: nhãn "Ambient mode", "Tắt", "Ambient 1–3" chưa dịch đủ ngôn ngữ hiển thị (theo yêu cầu tạm thời).


- **2026-10-26 | v3.4.634 | Claude sửa:**
  - Overlay video, theo yêu cầu của người dùng: (1) Ambient mode làm lại theo ảnh YouTube: lớp `te-ambient-layer` ở cấp overlay (z-index -1), canvas vuông 48x48 đặt tâm ở giữa `te-video-slot` (JS `placeAmbient` + `ResizeObserver`), kích thước 2,1 lần cạnh lớn nhất của video, mặt nạ `radial-gradient` tròn mờ dần, `blur(40px) saturate(1.8)`, opacity 0,5; khi bật, `te-left-section`/`te-control-bar`/`yt-dual-right-sidebar` trong suốt và nền gốc đặt ở root (#ffffff/#121212) nên màu nền sáng/tối không đổi; thêm công tắc "Ambient mode" ở Cài đặt video (công tắc thứ 6, sau "Ẩn thanh điều khiển"), mặc định bật, lưu ở `lhnYouTubeSettings.ambient` (thêm `ambient: true` vào `LHN_DEFAULTS.youtube`); gỡ các chỉnh sửa ambient cũ trong `te-left-section`; (2) tiêu đề video chạy vòng tròn nối đuôi: khi hover chữ bị cắt, JS thêm bản sao `te-title-dup` cách 32px và chạy đúng một vòng (tốc độ 40px/s, tuyến tính, lặp vô hạn), rời chuột thì gỡ bản sao; (3) header sidebar căn giữa dọc: dấu × đổi từ ký tự `&times;` sang SVG căn giữa, chữ tiêu đề canh theo chiều cao chữ hoa (`text-box: trim-both cap alphabetic`, trình duyệt chưa hỗ trợ thì nhích lên 1,5px).
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `js/core/defaults.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho 3 file JS — đạt; dựng overlay bằng Chromium 141 (Playwright) và chụp ảnh ambient bật/tắt theme sáng/tối, nền root #ffffff khi bật và 3 vùng trong suốt — đạt; đo header: tâm chiều cao chữ hoa 23,5px = tâm header 23,5px, logo và × lệch 0,5px (header 47px lẻ) — đạt; marquee: bản sao cách đúng 524px bằng một vòng, tốc độ đều, rời chuột reset, tiêu đề ngắn không chạy — đạt; mô phỏng Node 10 ca ambient (bật, không vẽ lại khi không đổi khung, seek xa, công tắc tắt, reduced-motion, lỗi đọc hình, tab ẩn, mặc định) — đạt. Trên YouTube thật, Firefox và font Segoe UI: Chưa chạy.
  - Lưu ý: toàn bộ nhãn menu Cài đặt video hiện là tiếng Việt cố định, chưa có cơ chế dịch; nhãn mới dùng "Ambient mode" (từ mượn, giữ nguyên ở mọi ngôn ngữ). Kích thước logo sidebar 26px là giá trị trong zip của người dùng, giữ nguyên. Không có git trong môi trường làm việc, chưa commit.

- **2026-10-26 | v3.4.633 | Claude sửa:**
  - Overlay video, theo yêu cầu của người dùng: (1) `te-video-title-label` thành khung cắt riêng, chữ chạy nằm trong `te-video-title-text`, icon YouTube đứng yên và chữ bị cắt ở mép icon (trước đó chữ trượt đè lên icon rồi biến mất ở mép `te-yt-logo-box`); (2) nền vùng trống khi ẩn phụ đề/thanh điều khiển nay là màu nền theo light/dark (`te-left-section` #ffffff/#121212), `te-sub-container` trong suốt; (3) hàng active ở sidebar bỏ `border-left` (gây xê dịch nội dung mỗi lần đổi câu), dùng `box-shadow: inset` kèm transition nền 0.3s, cuộn bằng `scrollTo` mượt khi gần và nhảy thẳng khi xa; (4) thêm Ambient mode kiểu YouTube: canvas 48x27 vẽ khung video mỗi 125 ms (pha 35% với khung trước), làm mờ `blur(48px) saturate(1.8)` opacity 0.45 phía sau video/phụ đề; chỉ vẽ khi tab hiện và khung đổi, tự tắt nếu video không cho đọc hình, tắt khi `prefers-reduced-motion`.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho hai file JS — đạt; kiểm tra chuỗi trên template (nền light/dark, canvas, khung tiêu đề, sidebar) — đạt; mô phỏng bằng Node: logic ambient (bật, không vẽ lại khi không đổi khung, seek xa, lỗi đọc hình thì tắt, tab ẩn, reduced-motion) và đo marquee (400px chạy 260px/8.4s, 90px không chạy) — đạt. Trên trình duyệt: Chưa chạy.
  - Lưu ý: Ambient không có công tắc vì nhãn menu "Cài đặt video" hiện chỉ có tiếng Việt, thêm công tắc phải dịch đủ ngôn ngữ; ambient làm sub-container hiển thị màu video phía sau nên cần kiểm tra độ dễ đọc. Mục (1) và (2) là cách hiểu yêu cầu của người dùng, cần xác nhận. Không có git trong môi trường làm việc, chưa commit.

- **2026-10-26 | v3.4.632 | Claude sửa:**
  - Overlay video, theo yêu cầu của người dùng: (1) thêm logo SVG Keepit bên trái chữ "Keepit - Video Song Ngữ" ở `yt-dual-sidebar-header` (SVG inline từ `icon.svg`, bỏ bộ lọc đổ bóng, 20px); (2) `te-video-title-label` chạy qua lại khi hover nếu tiêu đề bị cắt (CSS keyframes + JS đo độ dài bị cắt lúc `mouseenter`, tôn trọng `prefers-reduced-motion`); (3) sửa lỗi bật "ẩn thanh điều khiển" thì hover không hiện lại: nguyên nhân là `display:none` nên phần tử không nhận hover; đổi sang `opacity:0` và hiện lại bằng `:hover`/`:focus-within`.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho hai file JS — đạt; kiểm tra chuỗi trên template (logo, CSS ẩn thanh điều khiển, keyframes) — đạt; mô phỏng hàm đo marquee bằng Node (tiêu đề 400px: chạy, dịch 260px/8.4s; tiêu đề 90px: không chạy; rời chuột: gỡ class) — đạt. Trên trình duyệt: Chưa chạy.
  - Lưu ý: khi thanh ẩn, vùng đáy 70px vẫn nhận chuột (trong suốt) nên click vào vùng đó không còn đến video; không có git trong môi trường làm việc, chưa commit.

- **2026-10-25 | v3.4.631 | Claude sửa:**
  - Tối ưu hiệu năng overlay video (không đổi UI): (2) cache nút transcript khi còn kết nối; (3) throttle sự kiện cuộn danh sách bằng requestAnimationFrame; (5) bỏ qua cập nhật phụ đề khi dòng đang hiển thị không đổi; (6) cache tham chiếu `ui()` còn kết nối.
  - Chưa làm: (1) dựng danh sách theo cửa sổ ảo; (4) gộp hai bộ đếm thời gian; (7) chuyển inline style sang class; (8) gộp selector theme trùng. Lý do: cần kiểm thử thủ công và xác nhận hiển thị trước.
  - File: `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/dual-subtitles.js` — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-25 | v3.4.630 | Claude sửa:**
  - Xóa ảnh placeholder cứng (SVG chữ "They want a better future…") khỏi `.te-video-slot` của overlay video. Vùng trống khi video chờ tải hoặc 4:3 nay là nền `#111` ở cả dark và light mode.
  - File: `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/overlay-template.js` — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-25 | v3.4.629 | Claude sửa:**
  - Gỡ thử nghiệm bo 4 góc popup trên Chromium (v3.4.628): không đạt và giới hạn khung cửa sổ thuộc trình duyệt. Popup trở về như v3.4.627.
  - File: `js/popup/popup.js`, `css/popup/popup.css`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/popup/popup.js` — đạt. Trên Edge: Chưa chạy.


- **2026-10-25 | v3.4.628 | Claude sửa:**
  - Popup toolbar trên Chromium (Edge) không bo 4 góc như Firefox. Thêm class `is-chromium` (popup.js, chỉ khi không phải Firefox) và bo góc nội dung 14px chỉ cho class này. Firefox không đổi.
  - Giới hạn: khung cửa sổ popup của Chromium là hình chữ nhật; CSS chỉ bo nội dung, góc có thể vẫn thấy nền trình duyệt. Chưa xác nhận trên Edge.
  - File: `js/popup/popup.js`, `css/popup/popup.css`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/popup/popup.js` — đạt. Trên Edge: Chưa chạy.


- **2026-10-25 | v3.4.627 | Claude sửa:**
  - Popup toolbar (Edge/Chromium): thanh cuộn vẫn hiện kiểu mặc định dù đã có biến 3px. Đặt `scrollbar-width`/`scrollbar-color` về `auto` và áp `::-webkit-scrollbar` rõ ràng cho `html`, `body`, `.popup-main` theo `--lhn-scrollbar-width`. Chưa xác nhận nguyên nhân gốc.
  - File: `css/popup/popup.css`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: không có JS thay đổi. Trên Edge: Chưa chạy.


- **2026-10-25 | v3.4.626 | Claude sửa:**
  - Toàn app: thanh cuộn rộng/cao theo một biến duy nhất `--lhn-scrollbar-width: 3px` (`css/shared/ui-tokens.css`). Áp cho popup, dashboard, UI Keepit (`[id^="lhn-"]`), khung Cài đặt video và overlay phụ đề. Không áp cho thanh cuộn của website.
  - Các thanh cuộn dùng `scrollbar-color`/`scrollbar-width` (sidebar, popup dark, toolbar dashboard) chuyển về `auto` để quy tắc WebKit có tác dụng; màu thumb giữ như cũ.
  - Giới hạn: Firefox không đặt được độ rộng bằng px; thanh vẫn theo kiểu `thin` của trình duyệt.
  - File: `css/shared/ui-tokens.css`, `css/content/content.css`, `css/popup/popup.css`, `css/dashboard/dashboard.css`, `js/reader/bilingual-reader.js`, `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` các file JS đã sửa — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-25 | v3.4.625 | Claude sửa:**
  - Thanh cuộn Cài đặt video (`.te-modal-body`) cố định 3px, bỏ đổi kích thước khi rê chuột (bỏ hai quy tắc `:hover`).
  - File: `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/overlay-template.js` — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-25 | v3.4.624 | Claude sửa:**
  - Thanh cuộn Cài đặt video (`.te-modal-body`) vẫn hiện dày và xám dù đã có quy tắc WebKit. Giả thuyết: Chromium bỏ qua `::-webkit-scrollbar` khi `scrollbar-color`/`scrollbar-width` được kế thừa không phải `auto`. Đặt lại hai thuộc tính này về `auto` cho `.te-modal-body`, để quy tắc 2px/4px có hiệu lực.
  - File: `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/overlay-template.js` — đạt. Trên trình duyệt: Chưa chạy (giả thuyết chưa xác nhận).


- **2026-10-25 | v3.4.623 | Claude sửa:**
  - Làm lại từ v3.4.622: hoàn tác thử nghiệm trên danh sách phụ đề (v3.4.623 cũ). Thanh cuộn của khung Cài đặt video (`.te-modal-body`) nay rộng 2px khi không rê chuột, 4px khi rê vào khung. Không tạo thanh tự vẽ.
  - Giới hạn: CSS không đo được rê riêng lên thanh, nên 4px kích hoạt khi rê vào khung Cài đặt. Firefox không đổi được độ rộng thanh cuộn bằng CSS, giữ nguyên.
  - File: `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/overlay-template.js` — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-25 | v3.4.624 | Claude sửa:**
  - Sửa thử nghiệm thanh cuộn mảnh: v3.4.623 áp nhầm vùng (`.te-transcript-scroll`). Thanh cuộn của khung Cài đặt video là `.te-modal-body`; nay áp cùng kiểu mảnh/tím cho vùng này. Không đổi bố cục.
  - File: `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/overlay-template.js` — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-25 | v3.4.623 | Claude sửa:**
  - Thử nghiệm thanh cuộn mảnh trên overlay video (Dual Sub): áp CSS thuần cho `.te-transcript-scroll` (scrollbar-width thin cho Firefox; ::-webkit-scrollbar 4px cho Chromium, nở khi rê). Không thêm DOM, không đổi bố cục.
  - Giới hạn: Firefox không có hiệu ứng nở khi rê và không tự ẩn; chưa có thanh tự vẽ bằng JS như scrollbar-demo.html.
  - File: `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/overlay-template.js` — đạt. Trên trình duyệt: Chưa chạy.


**2026-10-25 | v3.4.622 | Codex sửa:**

- Đồng bộ hiệu ứng nhấn nút Dual Sub với Bilingual Reader: cùng keyframe, scale, màu và thời lượng 190 ms.
- File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` cho hai file JS và `git diff --check` đạt. Chưa kiểm thử trên trình duyệt.

**2026-10-25 | v3.4.621 | Codex sửa:**

- Thêm hiệu ứng nhấn cho các nút thanh điều khiển khi click/shortcut; click video toggle play/pause và làm nổi nút tương ứng. Chuyển “Chế độ đọc” lên đầu “Cài đặt video” và đổi nhãn thành “Chế độ xem”.
- File: `js/video/dual-subtitles.js`, `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` cho hai file JavaScript, parse manifest v3.4.621, xác nhận vị trí “Chế độ xem” và wiring click/shortcut, cùng `git diff --check` — đạt. Chưa kiểm thử tương tác trên trình duyệt.

**2026-10-25 | v3.4.620 | Codex sửa:**

- Transcript Dual Sub giải mã entity HTML lồng nhau để dấu câu hiển thị đúng như phụ đề YouTube; thanh điều khiển neo cố định dưới overlay. Khi mở overlay, “Hiện popup dịch trực tiếp” được bật tạm và trở về trạng thái cũ lúc đóng nếu người dùng không đổi. Shortcut mặc định đã là Alt+E nên giữ nguyên cấu hình và các lựa chọn tùy chỉnh.
- File: `js/video/dual-subtitles.js`, `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` cho hai file JavaScript, parse manifest v3.4.620, cấu hình mặc định Alt+E, decoder với entity quote/apostrophe lồng nhau, mô phỏng bật tạm/khôi phục và giữ thay đổi người dùng, cùng `git diff --check` — đạt. Chưa kiểm thử trình duyệt.

**2026-10-25 | v3.4.619 | Codex sửa:**

- Khi mở overlay, ưu tiên video chính của YouTube và ép video hiển thị dù đang pause/play. Nếu thời điểm phát chưa nằm trong cue nào, kích hoạt câu đầu tiên. Hover phụ đề chính dùng pointer events và pause luôn tác động lên video đang phát.
- File: `js/video/dual-subtitles.js`, `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` cho hai file JavaScript, parse `manifest.json`, `git diff --check` — đạt. Chưa kiểm thử trên trình duyệt.

**2026-10-25 | v3.4.618 | Codex sửa:**

- Khi click ngoài popup dịch/Full Dict để đóng, mouseup cùng thao tác không xử lý lại vùng chọn cũ khiến popup bật lại.
- File: `js/content/content.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: Chưa chạy.

**2026-10-25 | v3.4.617 | Codex sửa:**

- Khi tắt “Hiện popup dịch trực tiếp”, chọn từ không còn mở Full Dict trực tiếp, gồm chọn từ trong Dual Sub; luồng tra từ trong note được giữ nguyên.
- File: `js/content/content.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: Chưa chạy.

**2026-10-25 | v3.4.616 | Codex sửa:**

- Đổi nhãn “Di chuột để dịch” thành “Hiện popup dịch trực tiếp” trong Cài đặt video. Công tắc đọc/ghi khóa chung `lhnSettings.translationPopupEnabled`, đồng bộ trực tiếp với Dashboard; khi bật áp dụng quy tắc loại trừ hai chế độ dịch khác như Dashboard.
- File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: Chưa chạy.

- **2026-10-25 | v3.4.615 | Codex sửa:**
  - Khi bật **Kết hợp câu**, ghép các mảnh phụ đề của cả dòng chính và dòng dịch; giữ bản dịch track riêng tương ứng với câu được gộp.
  - File: `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: fixture Node xác nhận hai mảnh nguồn và hai mảnh dịch được ghép đồng bộ thành một câu; `node --check` cho ba file JavaScript, parse manifest/version và `git diff --check` đạt. Chưa kiểm thử trình duyệt.

- **2026-10-25 | v3.4.614 | Codex sửa:**
  - Sửa nguyên nhân Auto đích cứ thành English: `CONFIG` không có trong phạm vi `dual-subtitles.js`, nên đọc `lhnSettings.language` lỗi và rơi về dự phòng; listener thay đổi Dashboard cũng không chạy đúng. Đọc khóa qua `globalThis.LHN_CONFIG` và giữ nguyên thiết lập ngôn ngữ dùng chung.
  - File: `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho `dual-subtitles.js`, `overlay-template.js`, `dashboard.js`; parse manifest/version, không còn tham chiếu `CONFIG` ngoài phạm vi và `git diff --check` đạt. Chưa kiểm thử trình duyệt.

- **2026-10-25 | v3.4.613 | Codex sửa:**
  - Gộp xử lý chọn ngôn ngữ Dual Sub còn một hàm lưu, bỏ lỗi khai báo trùng khiến script hỏng. Chọn ngôn ngữ cập nhật phụ đề ngay và lưu vào đúng `lhnStudyTranslationSettings` đang dùng bởi Dashboard; Auto đích theo ngôn ngữ giao diện.
  - File: `js/video/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho các file JavaScript liên quan, parse manifest và `git diff --check` đạt. Chưa kiểm thử trên Chrome/Firefox.

- **2026-10-25 | v3.4.611 | Codex sửa:**
  - Sửa Auto của phụ đề dịch để lấy chính xác mã `language` đã lưu trong `lhnSettings` (có chuẩn hóa mã vùng), thay vì fallback không khớp tùy chọn ngôn ngữ Dashboard. Tăng độ tin cậy khi chọn ở Dual Sub: xử lý `input` và `change`, tuần tự hóa thao tác lưu hai trường, và cho menu lựa chọn thoát khỏi vùng bị cắt của modal.
  - File: `js/video/dual-subtitles.js`, `js/video/overlay-template.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check` ba file JavaScript, parse `manifest.json`, `git diff --check` — đạt. Chưa kiểm thử trên Chrome/Firefox.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Dual Sub giờ có thể chỉnh Ngôn ngữ phụ đề chính và dịch ngay trong menu; hai bộ chọn ghi thẳng vào thiết lập dịch dùng chung với Dashboard, đổi ở Dashboard cũng cập nhật Dual Sub. Auto đích lấy ngôn ngữ hiển thị đã chọn trong Dashboard, tránh rơi về English khi giao diện đang là tiếng Việt/Hàn. Các lựa chọn khớp Dashboard.
  - File: `js/video/dual-subtitles.js`, `js/video/overlay-template.js`, `js/dashboard/dashboard.js`, `PROJECT.md`.
  - Kiểm tra: `node --check` ba file JavaScript và `git diff --check` — đạt. Chưa kiểm thử trên Chrome/Firefox.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Sửa mapping phụ đề: dòng chính dùng Ngôn ngữ nguồn, dòng dịch dùng Ngôn ngữ đích. Tìm track riêng cho từng ngôn ngữ; nếu thiếu track thì lấy track gốc/mặc định và dịch riêng sang ngôn ngữ cần hiển thị. Cache transcript tách theo cả hai ngôn ngữ.
  - File: `js/video/dual-subtitles.js`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/dual-subtitles.js` và `git diff --check` — đạt. Chưa kiểm thử trên Chrome/Firefox.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Kết nối Ngôn ngữ phụ đề với Dashboard > Dịch > Ngôn ngữ nguồn. Cả hai dòng phụ đề dùng ngôn ngữ nguồn; ưu tiên transcript track khớp, nếu thiếu dùng track gốc/mặc định và dịch sang ngôn ngữ nguồn. Đổi thiết lập sẽ tải lại track hoặc dịch lại theo ngôn ngữ mới; cache được tách theo ngôn ngữ.
  - File: `js/video/dual-subtitles.js`, `js/video/overlay-template.js`, `PROJECT.md`.
  - Kiểm tra: `node --check` hai file JavaScript và `git diff --check` — đạt. Chưa kiểm thử trên Chrome/Firefox.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Chỉ hover pause/nền xanh nhạt trên phụ đề gốc tiếng Anh, không áp dụng câu dịch; Full Dict từ Dual Sub đọc theo thiết lập Auto speak; double-click sidebar hủy click đơn nên video không seek/đổi focus cue, đồng thời vẫn tạm dừng video.
  - File: `js/video/dual-subtitles.js`, `js/video/overlay-template.js`, `js/content/content.js`, `PROJECT.md`.
  - Kiểm tra: `node --check` cho ba file JavaScript và `git diff --check` — đạt. Chưa kiểm thử trên trình duyệt.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Dual Sub: neo Full Dict phía trên từ được chọn trong phụ đề dưới video; hover phụ đề chính hoặc chữ trong sidebar để pause/resume; hover từng từ có nền xanh nhạt; mở popup Full Dict, dịch hoặc note sẽ pause video cho đến khi đóng.
  - File: `js/video/dual-subtitles.js`, `js/video/overlay-template.js`, `js/content/content.js`, `PROJECT.md`.
  - Kiểm tra: Chưa chạy.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Chỉ trong Dual Sub: hover vùng phụ đề chính sẽ pause video và rời vùng sẽ tiếp tục; chọn từ tiếng Anh ở phụ đề dưới video sẽ mở Full Dict neo theo chữ đã chọn; double-click phụ đề bên sidebar sẽ pause video.
  - File: `js/video/dual-subtitles.js`, `js/content/content.js`, `PROJECT.md`.
  - Kiểm tra: `node --check js/video/dual-subtitles.js`, `node --check js/content/content.js`, `git diff --check` — đạt. Chưa kiểm thử trên trình duyệt.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Đổi tên thư mục module từ `js/youtube/` thành `js/video/` và CSS từ `youtube.css` thành `video.css`; cập nhật đường dẫn nạp trong manifest. Giữ nguyên tên file, nội dung và hành vi.
  - File: `js/video/overlay-template.js`, `js/video/dual-subtitles.js`, `css/content/video.css`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: Chưa chạy.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Thêm shortcut mặc định `Alt+C` để bật/tắt dual subtitles, cho phép đổi trong Dashboard > Shortcut; `Escape` đóng dual subtitles, không thêm trường cài đặt riêng.
  - File: `js/core/defaults.js`, `pages/dashboard.html`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `js/content/content.js`, `js/youtube/dual-subtitles.js`, `PROJECT.md`.
  - Kiểm tra: `node --check` năm file JavaScript, xác thực JSON `manifest.json`, `git diff --check` — đạt. Chưa kiểm thử trong trình duyệt.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Đặt mặc định phụ đề song ngữ YouTube ở giao diện tối và kích thước xem vừa; chỉ đổi giá trị mặc định, cài đặt đã lưu của người dùng vẫn được giữ.
  - File: `js/core/defaults.js`, `PROJECT.md`.
  - Kiểm tra: `node --check js/core/defaults.js` và `git diff --check` — đạt.

- **2026-10-25 | v3.4.610 | Codex sửa:**
  - Khắc phục chữ và khoảng cách full dict bị thu nhỏ trên một số trang: các đơn vị `rem` trong riêng popup phụ thuộc cỡ chữ gốc trang (YouTube có thể đặt root nhỏ hơn). Đổi sang kích thước `px` tương đương ở nền 16px. Đối chiếu CSS với v3.5.3 cho thấy stylesheet giống hệt; khác biệt là cỡ chữ root của trang nơi popup được mở.
  - File: `css/content/content.css`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `git diff --check` đạt; chưa kiểm thử trên trình duyệt.

- **2026-10-25 | v3.4.609 | Codex sửa:**
  - Sửa chọn chữ trong phụ đề YouTube song ngữ: ngoài listener trên `document`, gắn listener `mouseup` trực tiếp vào shadow root `#trancy-host` khi host xuất hiện. Dùng `WeakSet` chống xử lý trùng khi sự kiện đồng thời nổi lên `document`; popup dịch và full dict tiếp tục dùng chung luồng chọn chữ hiện có.
  - File: `js/content/content.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/content/content.js`, `node --check js/youtube/dual-subtitles.js`, `git diff --check` — đạt. Chưa kiểm thử trên trình duyệt.

- **2026-10-25 | v3.4.608 | Codex sửa:**
  - Đối chiếu nguồn phụ đề YouTube trong `dual-subtitles.js` và làm rõ `PROJECT.md`: mô tả v3.4.600 là cách triển khai ban đầu; trạng thái hiện hành là player API ANDROID + XML, DOM transcript, watch-page timedtext và live caption dự phòng. `get_transcript` trong nhật ký v3.4.605 là thay đổi lịch sử, không còn được gọi trong code hiện tại.
  - File: `PROJECT.md`.
  - Kiểm tra: đối chiếu code bằng `rg` và đọc các luồng lấy transcript; `git diff --check` chạy sau chỉnh sửa. Không sửa code.

- **2026-10-25 | v3.4.608 | Claude sửa:**
  - Sửa lỗi popup dịch và full dict không hiện khi chọn chữ trong phụ đề YouTube (overlay nằm trong shadow root `#trancy-host`). Trình nghe chọn chữ (`js/content/content.js`) nay lấy vùng chọn từ shadow root trước (`ShadowRoot.getSelection()`), nếu không có thì dùng `document` như cũ.
  - Ngoài YouTube và Firefox (không có API shadow selection) hành vi giữ nguyên.
  - File: `js/content/content.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/content/content.js` — đạt. Trên trình duyệt: Chưa chạy.
  - Tiếp theo: kiểm tra trên Chromium (bôi đen phụ đề khi bật dual sub) và kiểm tra Firefox xem `ShadowRoot.getSelection` có tồn tại không.


- **2026-10-25 | v3.4.607 | Claude sửa:**
  - Hoàn tác (5) của v3.4.606: chọn caption track luôn ưu tiên tiếng Anh (manual trước, rồi tự động), vì nguồn của phụ đề song ngữ Anh–Việt phải là tiếng Anh. Không dùng ngôn ngữ gốc của video để chọn track (video thử nghiệm đã chọn nhầm tiếng Albania).
  - Giữ (1) gate tab, (3) cache lỗi 10 phút, (7) khôi phục CC.
  - File: `js/youtube/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/youtube/dual-subtitles.js` — đạt. Trên trình duyệt: Chưa chạy.


- **2026-10-25 | v3.4.606 | Claude sửa:**
  - YouTube song ngữ: (1) chỉ prefetch khi tab đang hiển thị; (3) cache lỗi prefetch 10 phút theo videoId; (5) chọn caption track theo ngôn ngữ gốc của audio track mặc định của video, không có thì ưu tiên `en`; (7) khi dừng caption trực tiếp, đưa CC về trạng thái trước nếu Keepit là bên bật.
  - Chưa làm: (4) cache khoá theo ngôn ngữ (cần biết ngôn ngữ track trước khi fetch); (6) panel ngầm (không đổi UI, chờ quyết định).
  - File: `js/youtube/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
  - Kiểm tra: `node --check js/youtube/dual-subtitles.js` — đạt. Trên trình duyệt: Chưa chạy.
  - Lưu ý: khôi phục CC chạy khi `stopLiveCaptionCapture` được gọi; khi bắt đầu lại caption trực tiếp có thể CC tắt rồi bật lại.

**2026-10-25 | v3.4.605 | DeepSeek sửa:**

- Trả lại chất lượng dữ liệu như bản tham chiếu: thêm nguồn **`youtubei/v1/get_transcript`** (đúng endpoint panel bản ghi của YouTube dùng) trả về `transcriptCueRenderer` có `startOffsetMs`/`durationMs`/`cue` nên danh sách sạch, đủ, timestamp thật. Background thêm message `YOUTUBE_API` (POST JSON, chỉ cho youtube.com).
- Đổi thứ tự nguồn: innertube transcript → panel "Hiển thị bản ghi" trên trang → timedtext (đã bị chặn) → đọc caption trực tiếp (nguồn cuối). Nhờ vậy nguồn rối chỉ dùng khi cả ba nguồn sạch đều hỏng.
- Thêm log `[Trancy] Nguồn phụ đề đã dùng: <số cue> | <lý do>` để biết ngay đang lấy từ đâu.
- File: `js/youtube/dual-subtitles.js`, `js/background/background.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file đạt; thử endpoint từ PowerShell bên ngoài bị YouTube trả 400 (không có cookie phiên) nên **chưa xác nhận được trong trình duyệt**. Chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.604 | DeepSeek sửa:**

- Fix trùng timestamp và lặp một câu 2 lần trong danh sách bản ghi (ảnh người dùng): nguồn "đọc caption trực tiếp" đọc container của YouTube vốn **cộng dồn** chữ nên mỗi lần poll lại sinh cue mới, và khi video đứng ở 0s nhiều cue ra cùng timestamp. Nay text phải **ổn định 2 lần poll (~0.8s)** mới chốt, và nếu text mới chỉ là phần nối dài của cue trước thì **mở rộng cue đó** thay vì tạo cue mới (commitLiveCue); bỏ qua trường hợp text co lại và trùng khít cue đã chốt.
- Thêm `dedupeSentences()` trong `buildCaptions()`: bỏ cue rỗng và gộp cue liền kề trùng khít nội dung với timestamp cách nhau < 1.5s.
- File: `js/youtube/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check js/youtube/dual-subtitles.js` đạt; không còn tham chiếu `appendLiveCue`/`liveLastText`. Chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.603 | DeepSeek sửa:**

- Khung video YouTube: bỏ ép `aspect-ratio: 16 / 9` cố định, chuyển sang `aspect-ratio: var(--te-video-aspect, 16 / 9)`; thêm `syncVideoAspect()` set biến theo `video.videoWidth/videoHeight` khi gắn video, khi `loadedmetadata` và khi resize cửa sổ (chưa có metadata thì dùng 16:9). Bỏ `margin: auto` để khung bám trên, nhường chỗ dưới cho phụ đề.
- `.te-sub-container` thêm `flex: 1` và đổi `justify-content: center` → `flex-start`: phụ đề nằm ngay dưới video và tràn hết phần còn lại, không còn căn giữa khoảng trống. Giữ `min-height: 140px` và `max-height: calc(100vh - 200px)` của khung video để phụ đề + control bar luôn đủ chỗ.
- File: `js/youtube/dual-subtitles.js`, `js/youtube/overlay-template.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file đạt; sửa luôn lỗi BOM do PowerShell ghi vào `manifest.json` (đã kiểm `JSON.parse` OK). Chưa kiểm thử trên Chrome/Firefox.
- Lưu ý: bốn mục nhật ký của đợt YouTube trước đây bị ghi sai tên version (`3.5.0`–`3.5.3`), đã đổi lại theo mạch patch là `3.4.600`–`3.4.603` theo yêu cầu người dùng. Từ nay mỗi thay đổi phát hành tăng patch (`3.4.604`, `3.4.605`, …), chỉ tăng minor khi người dùng yêu cầu.

**2026-10-25 | v3.4.602 | DeepSeek sửa:**

- Fix sidebar bản ghi (`yt-dual-right-sidebar`) không đổi màu ở light mode: các class `.yt-dual-*` hardcode màu tối và không nằm trong bộ rule `.theme-light`. Thêm khối override light mode cho sidebar/header/nút đóng/hàng/empty; màu chữ đi qua biến `--te-side-en-color`/`--te-side-vi-color` nên màu người dùng tự chọn (inline style) vẫn thắng.
- Dịch chậm: bỏ hẳn batch `translate_a/single` tự viết trong `dual-subtitles.js`, chuyển sang **module translate của Keepit** (`BILINGUAL_TRANSLATE` → `LHN_TRANSLATE` + `LHN_CACHE`) và dịch **lười**: cửa sổ 2 cue trước / 8 cue sau quanh vị trí đang phát, thêm các dòng đang nhìn thấy khi cuộn (`translateVisibleRows`), và dịch ngay cue được bấm; concurrency 2, khử trùng theo text + `viCache` hai lớp.
- Khi xuất phụ đề, cue chưa kịp dịch ghi chuỗi rỗng (`viForExport`) thay vì "Đang dịch...".
- File: `js/youtube/dual-subtitles.js`, `js/youtube/overlay-template.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file đạt; rà không còn tham chiếu `translateAll`/`translateBatch`/`translateRaw`. Chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.601 | DeepSeek sửa:**

- Người dùng báo lỗi "Không thể tải phụ đề… timedtext rỗng | DOM: đã bấm nút bản ghi nhưng panel không hiện các đoạn". Kiểm tra trực tiếp ngoài extension (PowerShell, tải `watch?v=dQw4w9WgXcQ`): `timedtext` trả **HTTP 200 nhưng 0 byte** với cả `fmt=json3` và `fmt=srv3` → YouTube đã chặn bằng proof-of-origin token, nên nguồn dữ liệu của bản tham chiếu không còn dùng được.
- Thay nguồn dữ liệu trong `js/youtube/dual-subtitles.js` (UI giữ nguyên): panel bản ghi chuyển sang bộ selector mở (`ytd-transcript-segment-renderer`, `transcript-segment-view-model`, `[class*="transcript-segment"]`) và đọc segment tổng quát (tách timestamp bằng regex thay vì phụ thuộc `.segment-timestamp`); thêm nguồn **đọc caption đang hiển thị** (`.ytp-caption-segment`, tự bấm bật CC nếu đang tắt, gom cue 400ms/lần, ghép dần vào panel và dịch ngay cue mới).
- Dọn nguồn live khi đóng overlay, khi đổi video và khi rời trang.
- File: `js/youtube/dual-subtitles.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` đạt; đã xác minh nguyên nhân timedtext bằng request thật; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.600 | DeepSeek sửa:**

- Tích hợp tính năng **YouTube song ngữ** từ extension tham chiếu `youtube-dual-subtitles-extension-v1.12.zip` (người dùng cung cấp). Copy nguyên văn UI: `js/youtube/overlay-template.js` và `css/content/youtube.css` có hash SHA-256 trùng bản gốc; controller copy sang `js/youtube/dual-subtitles.js` rồi chỉ sửa các đường nối.
- Ánh xạ sang module Keepit: `fetchText` dùng `LHN_MESSAGING` với message mới `YOUTUBE_FETCH_TEXT` ở background (allowlist `youtube.com` + `translate.googleapis.com`, giữ `credentials: include` cho YouTube); cài đặt overlay chuyển từ `localStorage` sang `browser.storage.local` key `lhnYouTubeSettings`; bộ default chuyển vào `LHN_DEFAULTS.youtube`; thêm guard chỉ chạy trên `youtube.com` và tôn trọng danh sách `disabledWebsites` (Alt+Z).
- File: `js/youtube/overlay-template.js` (mới), `js/youtube/dual-subtitles.js` (mới), `css/content/youtube.css` (mới), `js/core/defaults.js`, `js/background/background.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` toàn bộ JS đạt; `manifest.json` parse hợp lệ; 45 path trong manifest đều tồn tại; default `youtube` đọc đúng. Chưa kiểm thử trên Chrome/Firefox.
- Lưu ý: overlay dùng chuỗi tiếng Việt của bản gốc (chưa qua `languages.js`) để giữ nguyên 100% UI; cần bước i18n riêng nếu muốn en/ko. Bản tham chiếu đọc `ytInitialPlayerResponse` + `timedtext` — khác điều khoản "không dùng endpoint transcript nội bộ" trong `OPT-ARENA.md` 8.1.1.

**2026-10-25 | v3.4.599 | DeepSeek sửa:**

- Người dùng xác nhận đạt trên trình duyệt các mục 20–23, nên xoá khỏi "Việc đang mở": sentence note không dính bản dịch, cache Reader dùng chung `Alt+A`/`Alt+D`, tốc độ đọc theo ngôn ngữ đoạn, toggle "Read translation with source" trên thanh đọc.
- Cập nhật snapshot mục 1 theo v3.4.599 (kiểm tra `node --check` 39/39, mô phỏng thứ tự nạp core script, ZIP có `defaults.js`), ghi nhận các mục đã được xác nhận trên trình duyệt, và sửa lại ghi chú push GitHub cho đúng thực tế (log báo lỗi nhưng commit đã lên remote).
- File: `PROJECT.md`.
- Kiểm tra: chỉ sửa tài liệu, không đổi code.

**2026-10-25 | v3.4.599 | DeepSeek sửa:**

- Nguyên nhân Reader im tiếng từ v3.4.595 (và cả cấu hình sai khi tìm lỗi): `js/background/background.js` nạp core script bằng `importScripts(...)` với **danh sách cứng**, không phải qua `manifest.json`. Khi gom default ở v3.4.595 tôi chỉ thêm `js/core/defaults.js` vào `manifest.json` và hai file HTML, **quên danh sách `importScripts`**. Chrome MV3 chỉ chạy `service_worker`, nên `config.js` được nạp trước khi có `LHN_DEFAULTS` → ném lỗi ngay khi khởi động service worker → hỏng mọi thứ phụ thuộc background: dịch, audio Google TTS, annotations, usage. Reader không phát tiếng chính vì vậy.
- Sửa: thêm `/js/core/defaults.js` ngay trước `/js/core/config.js` trong `importScripts`.
- Thêm guard trong `config.js`: nếu thiếu `LHN_DEFAULTS` thì báo rõ cần nạp `defaults.js` trước, kèm nơi cần kiểm tra.
- File: `js/background/background.js`, `js/core/config.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file đạt; mô phỏng thứ tự nạp trong Node — nạp `config.js` khi thiếu `defaults.js` thì báo đúng lỗi guard, nạp đủ theo thứ tự mới thì `LHN_CONFIG.DEFAULT_SETTINGS` có 29 khóa; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.598 | DeepSeek sửa:**

- Reader vẫn không đọc sau khi hoàn nguyên 3.4.596; thêm cảnh báo `console.warn` ở các nhánh `startReading` thoát sớm để biết nguyên nhân thật: website bị tắt, website nằm trong danh sách tắt Reader, TTS bị tắt/không hỗ trợ (kèm giá trị `enableTTS`, `synth`, `SpeechSynthesisUtterance`), và danh sách đoạn đọc rỗng.
- Chỉ thêm log, không đổi hành vi. File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` đạt; chưa kiểm thử trên Chrome/Firefox.
- Tiếp theo: đọc cảnh báo trong Console của trang để xác định nguyên nhân rồi mới sửa.

**2026-10-25 | v3.4.597 | DeepSeek sửa:**

- Hoàn nguyên toàn bộ thay đổi của v3.4.596 trong `js/reader/bilingual-reader.js` (đưa file về đúng bản v3.4.595) vì người dùng báo Reader không đọc được đoạn nào sau bản đó; bản 3.4.596 là bản duy nhất trong ba bản 3.4.594–596 đụng vào luồng đọc (thêm `ownChild`, đổi truy vấn `.lhn-bilingual-card` từ `:scope >` sang tìm trong đoạn, đổi cách tra icon).
- Giữ lại **duy nhất** phần sửa icon trùng: bỏ qua đoạn lồng trong đoạn khác khi gắn icon loa và dọn icon thừa ở đoạn lồng. Diff so với v3.4.595 chỉ có 4 dòng này.
- File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` đạt; `git diff 32ee053` xác nhận chỉ còn thay đổi ở `updateSpeakers`; chưa kiểm thử trên Chrome/Firefox.
- Tiếp theo: người dùng xác nhận Reader đọc lại được; nếu vẫn im lặng thì cần log lỗi console của trang để tìm nguyên nhân thật.

**2026-10-25 | v3.4.596 | DeepSeek sửa:**

- Fix một số đoạn hiện 2 icon loa (ảnh tiêu đề trang tin): `updateSpeakers` coi cả `<a>` kiểu block nằm trong `<h2>` là một đoạn riêng nên tạo icon cho cả hai. Nay đoạn lồng trong đoạn khác bị bỏ qua (chỉ đoạn ngoài cùng nhận icon) và icon cũ của đoạn lồng được dọn.
- Thêm `ownChild()`: nếu trang web bọc node của Keepit vào phần tử khác thì đưa nó về cấp con trực tiếp thay vì tạo bản trùng; xoá icon trùng còn sót trong cùng đoạn; các chỗ tra `.lhn-bilingual-card` đổi từ `:scope >` sang tìm trong đoạn để không bỏ sót card bị bọc.
- File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check js/reader/bilingual-reader.js` đạt; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.595 | DeepSeek sửa:**

- Gom toàn bộ giá trị mặc định về một file duy nhất `js/core/defaults.js` (`LHN_DEFAULTS`: `settings`, `reader`, `studyTranslation`, `flashcard`, `readerDisabledWebsites`); `config.js`, `bilingual-reader.js`, `dashboard.js` đọc từ đó thay vì tự khai báo. Trước đây Reader và Dashboard giữ hai bản default của cùng một bộ cài đặt và đã lệch nhau (bản Dashboard thiếu `speechSpeedStep`, `voiceMode`, `browserVoiceURI`, `readerShortcutsEnabled`, `autoDetectVoice`, `widgetDarkMode`).
- Thêm `js/core/defaults.js` vào `manifest.json` (background + content script) và `pages/dashboard.html`, `pages/popup.html`, đặt ngay trước `config.js`.
- File: `js/core/defaults.js` (mới), `js/core/config.js`, `js/reader/bilingual-reader.js`, `js/dashboard/dashboard.js`, `manifest.json`, `pages/dashboard.html`, `pages/popup.html`, `PROJECT.md`.
- Kiểm tra: `node --check` 5 file JS đạt; `manifest.json` parse hợp lệ; 38 script trong manifest và 21+9 script trong hai HTML đều tồn tại; không còn literal default lặp lại; chưa kiểm thử trên Chrome/Firefox.
- Lưu ý: chưa đổi cách lưu settings (vẫn ghi cả bộ), nên đổi default vẫn cần migration cho máy đã dùng — bước đó là giai đoạn sau.

**2026-10-25 | v3.4.594 | DeepSeek sửa:**

- "Read translation with source" chuyển sang **mặc định bật**: `DEFAULTS` của Reader và `DEFAULT_BILINGUAL_READER_SETTINGS` của Dashboard đổi `readTranslation:true`.
- Thêm migration một lần bằng cờ `readTranslationDefaultOn` ở cả Reader và Dashboard, vì các bản lưu trước đã ghi cứng `readTranslation:false` (khi lưu bất kỳ cài đặt Reader nào) nên chỉ đổi default sẽ không có tác dụng.
- Bỏ toast "Reading source and translation is on" lúc bắt đầu đọc (mặc định bật thì sẽ hiện mọi lần); vẫn hiện toast khi người dùng tự bật trong popover.
- File: `js/reader/bilingual-reader.js`, `js/dashboard/dashboard.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file đạt; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.593 | DeepSeek sửa:**

- Tắt "Read translation with source" giữa lúc đang đọc giờ có hiệu lực ngay: nếu đang đọc bản dịch của đoạn hiện tại thì `skipBilingualSegment()` cắt audio bản dịch (`cancelGoogle`), bỏ phần còn lại và sang đoạn kế; nếu đang đọc bản gốc mà `then` đã gắn sẵn từ đầu đoạn thì chặn không đọc bản dịch nữa.
- Sửa phụ: khi resume mà không còn phần đọc dở thì `speakAfterCancel(null)` để đọc đoạn kế, tránh đọc chuỗi rỗng.
- File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check js/reader/bilingual-reader.js` đạt; chưa kiểm thử trên Chrome/Firefox.
- Lưu ý: với giọng trình duyệt, bản dịch được ghép chung vào text của đoạn nên tắt giữa đoạn gốc chưa cắt được phần đã ghép; cần xử lý riêng nếu người dùng cần.

**2026-10-25 | v3.4.592 | DeepSeek sửa:**

- Sửa lỗi bật "Read translation with source" giữa lúc đang đọc: đoạn đang đọc vẫn chỉ đọc bản gốc vì danh sách đọc (`readSegmentsFor`) được chốt lúc bắt đầu đoạn. Thêm `pendingTranslationFor(block)` kiểm tra lại ngay khi đoạn gốc đọc xong, cho cả nhánh Google TTS và giọng trình duyệt: có bản dịch thì đọc liền rồi mới sang đoạn kế.
- `readSegmentsFor` fallback `lang` về ngôn ngữ hiển thị khi card thiếu `data-target-lang`, tránh đọc lặp bản dịch vô hạn.
- File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check js/reader/bilingual-reader.js` đạt; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.591 | DeepSeek sửa:**

- Đổi alias `I18N` → `LANGUAGES` trong `dashboard.js` và `popup.js` cho khớp tên module `js/core/languages.js` (chỉ đổi tên biến, không đổi hành vi). Giữ nguyên thuộc tính DOM `data-i18n`/`data-lhn-i18n` vì chúng là hợp đồng với HTML và không phải tên module.
- File: `js/dashboard/dashboard.js`, `js/popup/popup.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file đạt; rà `\bI18N\b` trong `js/` chỉ còn thuộc tính `data-i18n`; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.590 | DeepSeek sửa:**

- Thêm tuỳ chọn "Read translation with source" vào popover Settings của thanh đọc (`[data-readtranslation]`), dùng chung khóa `readTranslation` với Dashboard > Bilingual Reader; nhãn lấy từ khóa i18n có sẵn `bilingualReadTranslation` (en/vi/ko) nên không phát sinh chuỗi mới; trạng thái checkbox đồng bộ trong `syncToolbar`; bật thì hiện toast như khi bắt đầu đọc.
- File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check js/reader/bilingual-reader.js` đạt; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.589 | DeepSeek sửa:**

- Sửa tiêu chí chọn tốc độ: trước đó code phân biệt "đoạn dịch hay đoạn gốc", sai với luật thực tế là **ngôn ngữ của đoạn đang đọc**. Custom rate bật → đoạn thuộc ngôn ngữ hiển thị dùng "Your speed", đoạn ngôn ngữ khác dùng "Global speech rate"; Custom tắt → mọi đoạn dùng Global.
- Thêm `normalizeSpeechLang`, `isDisplaySpeechLang`, `activeSegmentLang`, `currentSegmentRate`; `segmentRate(lang)` nhận ngôn ngữ đoạn; `editingLanguageRate()` so ngôn ngữ thay vì cờ `translation`. Mọi đường đọc (Google audio, giọng trình duyệt, nhãn thanh đọc, preset, `↑/↓`, ước tính thời gian) dùng chung một hàm.
- File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check js/reader/bilingual-reader.js` đạt; xác nhận chỉ còn một khai báo `segmentRate`; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.588 | DeepSeek sửa:**

- Bỏ hẳn tốc độ riêng của Reader để chỉ còn một nguồn: xoá `speechSpeed` khỏi `DEFAULTS`/settings Reader, thêm `baseRate()` đọc trực tiếp `lhnSettings.speechRate`. Thanh đọc, nhãn `x.x`, `↑/↓`, preset, ước tính thời gian còn lại và `segmentRate` đều lấy từ nguồn này; sửa tốc độ chỉ ghi `speechRate` (hoặc `speechRateByLanguage[displayLang]` khi Custom rate bật và đang đọc bản dịch).
- Migration một lần: Reader còn `speechSpeed` cũ và Dashboard đang mặc định 1.0 thì chuyển sang `speechRate`, sau đó xoá khóa cũ khỏi settings Reader.
- File: `js/reader/bilingual-reader.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check js/reader/bilingual-reader.js` đạt; rà `grep speechSpeed` chỉ còn tên hàm và nhánh migration; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.587 | DeepSeek sửa:**

- Sửa luật đồng bộ tốc độ cho đúng "Custom rate for display language": khi toggle bật và đang đọc bản dịch của ngôn ngữ hiển thị, sửa tốc độ trên thanh đọc chỉ ghi `speechRateByLanguage[displayLang]` + `hasCustomSpeechRateByLanguage[displayLang]=true` và xoá inherited của ngôn ngữ đó, không đổi `speechRate`. Đọc đoạn gốc hoặc toggle tắt thì vẫn ghi `speechRate`.
- `segmentRate` chuyển sang thẩm quyền tuyệt đối của tốc độ riêng ngôn ngữ (bỏ công thức cộng dồn `base + (custom - global)`), áp cho cả giọng Google và giọng trình duyệt; thanh đọc, phím `↑/↓` và popover tốc độ lấy theo đoạn đang đọc.
- Cho phép lưu tốc độ tới 3.0 (JS clamp 2 → 3 ở global, per-language và TTS trong trang); control Dashboard vẫn giới hạn 2, không đổi HTML.
- File: `js/reader/bilingual-reader.js`, `js/dashboard/dashboard.js`, `js/content/content.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` ba file JS đạt; chưa kiểm thử trên Chrome/Firefox.

**2026-10-25 | v3.4.586 | DeepSeek sửa:**

- Đồng bộ tốc độ đọc giữa thanh đọc Reader và Dashboard Settings: Reader chỉ ghi `lhnBilingualReaderSettings.speechSpeed`, Dashboard đọc/ghi `lhnSettings.speechRate`, nên sửa bên nào cũng chỉ bên đó biết. Thêm `writeSharedSpeechRate` (ghi `speechRate` mỗi lần đổi tốc độ ở thanh đọc), `applySharedSpeechRate` (nhận `speechRate` khi storage đổi: cập nhật slider, nhãn và `playbackRate`/đọc lại đoạn), và đồng bộ lúc tải trang kèm migration một lần `speechSpeedSynced` để không ghi đè tốc độ người dùng đã đặt ở Reader.
- Dashboard hiển thị đúng giá trị dùng chung (tới 3) trong khi control vẫn giới hạn 0.5–2; không đổi HTML/UI.
- File: `js/reader/bilingual-reader.js`, `js/dashboard/dashboard.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file JS đạt; chưa kiểm thử trên Chrome/Firefox.
- Lưu ý: `speechRate` là tốc độ dùng chung nên đổi trên thanh đọc cũng đổi tốc độ đọc to của popup và Dashboard.

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
