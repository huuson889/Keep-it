# Keepit - Hồ sơ dự án
## Nhật ký cập nhật gần nhất
- 2026-10-23 | v3.4.546 | Claude sửa: Select Voice của Bilingual Reader dùng bàn phím: khi popover đang mở, Up/Down di chuyển mục đang chọn trong danh sách (kẹp ở đầu/cuối, bắt đầu từ mục đang dùng), Enter chọn mục đó. Chỉ khi Select Voice mở mới chặn Up/Down, nên phím chỉnh tốc độ giữ nguyên ở lúc khác. Mục đang chọn bằng phím có nền hover và viền accent (class lhn-kb-active). File: bilingual-reader.js, manifest.json, PROJECT.md. Đã chạy node --check và test mock logic phím (8 ca); chưa kiểm tra trên trình duyệt. Tiếp theo: xác nhận Up/Down/Enter trong Select Voice trên Chrome/Firefox, kể cả khi con trỏ đang ở ô tìm kiếm.
- 2026-10-23 | v3.4.545 | Claude sửa: AGENTS.md thêm quy tắc ghi rõ người sửa (Claude/Codex/Huuson) trong mỗi mục nhật ký. Select Voice của Bilingual Reader có đủ 21 ngôn ngữ kèm cờ (gồm Việt Nam), tìm theo tên/bản địa/mã/quốc gia, không phân biệt dấu. Chọn ngôn ngữ giữ voiceMode=google và đặt ngôn ngữ đọc (readLanguage); cờ ở thanh dưới đổi theo. Chọn Auto hoặc giọng trình duyệt thì xóa readLanguage. File: tts-engine.js, bilingual-reader.js, AGENTS.md, manifest.json, PROJECT.md. Đã chạy node --check và test mock (lưu/đọc readLanguage, 21 cờ, tìm kiếm); chưa kiểm tra UI trên trình duyệt. Tiếp theo: xác nhận chọn Vietnamese đọc đúng tiếng Việt và cờ VN đổi theo trên Chrome/Firefox.
- 2026-10-23 | v3.4.534: Bilingual Reader chạy đồng thời các engine dịch và dùng bản dịch thành công đầu tiên, tránh chờ timeout tuần tự từng engine. File: background.js, manifest.json, PROJECT.md. Đã chạy node --check và git diff --check; chưa đo trực tiếp độ trễ trên trình duyệt. Tiếp theo: kiểm tra thời gian Alt+A/Alt+D trên trang thực tế.
- 2026-10-23 | v3.4.533: Thêm Auto highlight vào Toolbar settings và đồng bộ với Highlights & Notes; mặc định tắt ở bản cài mới. File: config.js, popup.html, popup.js, dashboard.js, manifest.json, PROJECT.md. Đã chạy node --check và git diff --check; chưa kiểm tra UI trên trình duyệt. Tiếp theo: xác nhận hai công tắc đồng bộ trên Firefox/Chrome.
- 2026-10-23 | v3.4.532: Khi chưa lưu tùy chọn, hiển thị Custom rate for display language theo mặc định cấu hình và dùng rate mặc định theo display language (1.2) thay vì tốc độ chung 1.0. File: dashboard.js, manifest.json, PROJECT.md. Đã chạy node --check, git diff --check và kiểm tra tính toán mặc định; chưa kiểm tra UI trên trình duyệt. Tiếp theo: xác nhận Your speed là 1.2 cho cài mới EN/VI/KO.
- 2026-10-23 | v3.4.531: Chuẩn hóa khoảng cách giữa mô tả “Disable reader on websites” và form thêm domain thành 16px, đồng bộ với khoảng cách các mục cài đặt. File: dashboard.css, manifest.json, PROJECT.md. Đã chạy git diff --check; chưa kiểm tra UI trực tiếp trên trình duyệt. Tiếp theo: xác nhận khoảng cách trực quan trên Firefox/Chrome.
- 2026-10-23 | v3.4.530: Seed 27 domain mặc định vào danh sách website tắt Reader; chuẩn hóa các mục google trùng/lỗi định dạng thành google.com, gộp với danh sách riêng đã có và đánh dấu seed một lần để việc xóa domain được giữ lại. File: config.js, dashboard.js, bilingual-reader.js, manifest.json, PROJECT.md. Đã chạy node --check, git diff --check và 3 ca migration; chưa kiểm tra trực tiếp trên trình duyệt. Tiếp theo: xác nhận danh sách hiện trên Dashboard và Reader bị tắt trên các domain này.
- 2026-10-23 | v3.4.529: Gộp Enable reader, Auto-scroll, Show reading icon, danh sách website và Parts not to read vào một mục Reader; tắt reader làm mờ và chặn tương tác các thiết lập phụ. File: dashboard.html, dashboard.js, dashboard.css, manifest.json, PROJECT.md. Đã chạy node --check, kiểm tra cấu trúc/ID UI và git diff --check; chưa kiểm tra trình duyệt. Tiếp theo: xác nhận trạng thái khóa/mở và bố cục trên Firefox/Chrome.
- 2026-10-23 | v3.4.528: Đổi công tắc thành Enable reader, vô hiệu hóa thiết lập đọc liên quan khi tắt, thêm danh sách domain tắt reader có thêm/sửa/xóa. File: dashboard.html, dashboard.js, bilingual-reader.js, i18n.js, manifest.json, PROJECT.md. Đã chạy node --check cho 3 JS, kiểm tra liên kết UI và git diff --check; chưa kiểm tra trực tiếp trên trình duyệt. Tiếp theo: xác nhận bật/tắt và danh sách website trên Firefox/Chrome.
- 2026-10-23 | v3.4.527: Thu hẹp nhận diện Bengali/Devanagari về dải chữ cái và kiểm tra Bengali trước Hindi. File: tts-engine.js, manifest.json, PROJECT.md. Đã chạy node --check, kiểm tra hai dải ký tự và git diff --check; chưa kiểm tra trên Chrome/Firefox. Tiếp theo: xác nhận TTS Bengali/Hindi trên trình duyệt.
- 2026-10-23 | v3.4.526: Hợp nhất voiceMode/browserVoiceURI cho chọn text và Bilingual Reader; thêm nhận dạng chữ/từ cục bộ, nhận diện Google nền cho Latin (cache hash tối đa 500), migration một lần; giữ flashcard nguyên trạng. File: tts-engine.js, background.js, content.js, bilingual-reader.js, dashboard.js, manifest.json, PROJECT.md. Đã chạy node --check, 12 câu mẫu, kiểm tra cache/fallback, manifest và diff; chưa kiểm tra Chrome/Firefox. Tiếp theo: xác nhận voiceMode và nhận diện trên hai trình duyệt.
- 2026-10-23 | v3.4.525: Thêm log lỗi cục bộ tối đa 200 mục, chỉ lưu thời gian/component/severity/code đã phân loại; thêm xuất JSON ở Dashboard Settings > About, không xuất URL/nội dung trang/văn bản chọn/tài khoản. File: error-logger.js, background.js, manifest.json, dashboard.html, dashboard.js, popup.html, i18n.js, PROJECT.md. Đã chạy node --check cho JS, parse manifest và git diff --check; chưa kiểm tra tải file qua UI trên trình duyệt. Tiếp theo: xác nhận log ghi được và nút About tải JSON trên Firefox/Chrome.
- 2026-10-23 | v3.4.525: Thêm MyMemory làm fallback cho lhn-direct-translation khi Google lỗi/timeout; nguồn Auto gửi autodetect, văn bản dài được chia dưới giới hạn API. File: study-translation.js, PROJECT.md. Đã chạy node --check study-translation.js, parse manifest.json và git diff --check; chưa thử lỗi mạng thực tế trên trình duyệt. Tiếp theo: xác nhận fallback MyMemory trên Firefox/Chrome.
- 2026-10-23 | v3.4.525: Full dict chuyển cache sang browser.storage.local (TTL 7 ngày), cache nghĩa từng từ/cụm liên quan để tái sử dụng; khi note mở, hủy yêu cầu phụ và điền ngay bản dịch chính. File: content.js, PROJECT.md. Đã chạy node --check content.js và git diff --check; chưa xác nhận trên trình duyệt. Tiếp theo: kiểm tra cache liên quan và điền note khi mạng chậm.
## 1. Trạng thái hiện tại (sửa đè)
- Version: v3.4.546. Firefox và Chrome, Manifest V3, một bản build chung.
- Google TTS trên Chrome: đã thêm rule Referer (DNR). Request translate_tts trả 200 OK; CHƯA xác nhận audio phát thật trên máy.
- tts-engine.js (dùng chung content.js, dashboard.js, bilingual-reader.js): chia đoạn ~180 ký tự, phát Google TTS nối tiếp; đoạn lỗi thì đọc bằng giọng trình duyệt. detectReadLanguage nhận diện cục bộ; detectLanguage gọi Google chỉ với tối đa 200 ký tự Latin khi chưa kết luận, timeout 2.5 giây và cache hash tối đa 500 mục.
- Select Voice (Bilingual Reader): Auto, 21 ngôn ngữ (Google TTS, lưu lhnSettings.readLanguage) rồi các giọng trình duyệt. Chỉ Bilingual Reader dùng readLanguage; chọn text và flashcard bỏ qua. Trong Select Voice: Up/Down chọn mục, Enter xác nhận.
- Chọn text và Bilingual Reader dùng voiceMode google/browser cùng browserVoiceURI; migration từ speechVoice/speechVoiceURI chạy một lần. Flashcard giữ speechVoice độc lập.
- Bilingual Reader voice Auto dùng Google TTS và chọn giọng hệ thống đặt browserVoiceURI; icon đọc mặc định hiện khi hover, chế độ Always visible luôn hiện trong vùng Alt+R và hover ngoài vùng.
- Bilingual Reader > Reader: công tắc master và nhóm Auto-scroll, Show reading icon, Disable reader on websites, Parts not to read nằm chung một mục; tắt master thì nhóm phụ bị disabled, mờ và khóa pointer. Có 27 website mặc định bị tắt (gồm google.com; tên miền con cũng khớp), seed một lần, hợp nhất với danh sách cũ và cho phép người dùng xóa.
- Speak popup Settings có link tới Dashboard > Bilingual Reader và công tắc Custom web font (Inter), lưu cùng thiết lập Bilingual Reader để áp dụng font trực tiếp; menu được thu gọn spacing, link căn trái, hai divider cùng màu #cbd1d8 và nhãn dịch EN/VI/KO.
- Full dict cache dùng `browser.storage.local` với TTL 7 ngày; cache bản dịch chính riêng theo từ/ngôn ngữ để tái sử dụng cho Syn/Ant, Forms và Colloc. Khi note mở, các yêu cầu phụ bị hủy và bản dịch chính được điền ngay.
- Bilingual Reader dịch qua Google/MyMemory/Lingva đồng thời, hiển thị bản đầu tiên thành công và lưu cache cục bộ 7 ngày; các engine lỗi không chặn dịch thành công.
- Nhật ký lỗi: browser.storage.local giữ tối đa 200 mục metadata phân loại; không lưu URL, nội dung trang, chữ chọn, email hay stack. Dashboard Settings > About cho phép xuất JSON theo thao tác người dùng.
- Dashboard Settings > Highlights & Notes: Auto-open note popup khi click ngoài đóng mà không lưu; Auto highlight mặc định tắt và giữ lưu hiện tại khi popup không tự mở.
- Giới hạn dùng (usage-limits.js): gói Free không giới hạn translate/Google TTS; key A 100 lượt/ngày, key B không giới hạn. Key cứng trong code, chỉ là bản thử. TRIAL_MS = 0.
- Chưa nối Supabase (chỉ có supabase-schema.sql và SUPABASE_SYNC.md).

## 2. Việc đang mở / Tiếp theo (sửa đè)
9. [Kiểm tra] Xác nhận Your speed khởi tạo 1.2 và các tốc độ riêng đã lưu vẫn được ưu tiên trong UI.
8. [Kiểm tra] Xác nhận 27 website Reader mặc định được seed vào cài đặt hiện có, website con cũng bị tắt, và domain người dùng đã xóa không tự xuất hiện lại.
7. [Kiểm tra] Xác nhận Reader settings gộp một mục, disabled/gray và không nhận chuột khi Enable reader tắt trên Firefox/Chrome.
10. [Kiểm tra] Đo thực tế độ trễ dịch Bilingual Reader trên Firefox/Chrome sau khi các engine được gọi đồng thời.

1. [Kiểm tra] Google TTS trên Chrome: xác nhận nghe được audio. Ví dụ request đã thấy: translate.google.com/translate_tts?ie=UTF-8&q=...&tl=en&client=tw-ob, GET, 200 OK.
2. [Kiểm tra] Đọc đoạn dài bằng chia đoạn 180 ký tự (đã có trong code, chưa xác nhận trên máy). Background vẫn giới hạn 500 ký tự mỗi request.
3. [Làm một phần] Chuỗi dự phòng TTS: hiện là Google -> giọng trình duyệt theo từng đoạn. Chưa có bước "phát trực tiếp"; lỗi mới chỉ ghi console.warn, chưa báo rõ cho người dùng.
4. [Kiểm tra] Firefox MV3: background có unload khi rảnh làm mất tin nhắn không.
5. [Vệ sinh] README.md trong dự án đã lỗi thời (ghi v1.30.0, Firefox, MV2, "không dùng mạng"). Cần viết lại khi được yêu cầu.
6. [Kiểm tra] Xác nhận nhận diện ngôn ngữ, migration voiceMode/browserVoiceURI, chọn Browser voice và Google voice trên Chrome/Firefox.

## 3. Ràng buộc & quyết định
- Giữ nguyên UI, layout, văn bản hiện có. Chỉ thêm mới khi được yêu cầu.
- Mọi API dùng browser.* (đã có polyfill).
- Không có sidebar_action; popup và dashboard mở trong tab/popup.
- Thư mục nguồn là nguồn duy nhất; zip do Codex đóng gói vào D:\Keepit.
- AGENTS.md và PROJECT.md nằm trong zip và được commit vào Git. Trước khi nộp store, người dùng tự xóa hai file này khỏi zip.
- Thay đổi lớn nêu rõ trong commit message.

## Bản đồ file
- manifest.json: quyền, content scripts, background.
- background.js: dịch (chuỗi engine), TTS Google (cache IndexedDB), usage limit, rule DNR Referer cho Chrome, CRUD IndexedDB.
- tts-engine.js: chia đoạn và phát Google TTS, dự phòng giọng trình duyệt.
- content.js: popup chọn text, sidebar trong trang, speech.
- bilingual-reader.js: đọc song ngữ trên trang. lib/Readability*.js: tìm nội dung chính cho Alt+R/Alt+A.
- popup.html/js: popup toolbar. dashboard.html/js: quản lý, flash card, cài đặt.
- usage-limits.js: giới hạn dùng theo ngày.
- browser-polyfill.js: cho phép dùng browser.* trên Chrome.

## 4. Nhật ký nâng cấp (thêm vào ĐẦU mục này, mới nhất trên cùng)
### v3.4.525 - 2026-10-23
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

### v3.4.524 - 2026-10-23
- TTS engine đọc `lhnSettings.speechVoice`; Browser voice phát từng đoạn bằng giọng trình duyệt, không gọi Google TTS.
- File: tts-engine.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check và test mock xác nhận browser voice bỏ qua API Google; chưa thử trên trình duyệt.
- Tiếp theo: xác nhận phát âm thật trên Chrome/Firefox.

### v3.4.523 - 2026-10-23
- Sửa nhận diện paragraph có chữ nằm trong inline element; ép câu hỏi phỏng vấn VnExpress vào main reader queue.
- Hover hiện icon cho đoạn chữ ở mọi chế độ; icon ngoài main chỉ đọc block đã bấm.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: kiểm tra DOM thật, node --check, parse manifest, git diff --check; chưa phát TTS thực tế.

### v3.4.522 - 2026-10-23
- Thêm đoạn question trong `.fck_detail` vào queue main; semantic paragraphs có inline text vẫn nhận icon; hover hiện icon ở mọi chế độ.
- Bấm icon ngoài main đọc riêng block được chọn; trong main giữ queue hiện tại.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, parse manifest, git diff --check và markup DOM; chưa phát thử trên trình duyệt.

### v3.4.521 - 2026-10-23
- Giữ câu hỏi phỏng vấn italic kết thúc bằng dấu hỏi; icon ngoài main hiện khi hover ở mọi chế độ và chỉ đọc block được bấm.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: chạy node --check, parse manifest JSON, git diff --check; chưa thử phát trên trình duyệt.
- Tiếp theo: xác nhận trên trang VnExpress.

### v3.4.520 - 2026-10-23
- Alt+A/Alt+R đưa headline `.title_post` và sapo `.lead_post_detail` của VnExpress vào queue khi cùng khối bài viết.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: xác nhận selector/markup trên HTML trang; đã chạy node --check, parse manifest JSON, git diff --check; chưa thử trình duyệt.
- Tiếp theo: xác nhận Alt+R đọc đủ phần mở đầu và body.

### v3.4.519 - 2026-10-23
- Alt+A/Alt+R loại khối đọc gần phủ toàn màn hình, tránh tô tím toàn trang.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: chạy node --check, parse manifest JSON, git diff --check; chưa thử trên trình duyệt.
- Tiếp theo: xác nhận trên trang gặp lỗi.

### v3.4.518 - 2026-10-23
- Alt+A/Alt+R đọc các khối chữ nhìn thấy trong vùng nội dung; giữ đoạn dài, lọc rác ở đoạn ngắn, Google Search ưu tiên vùng kết quả/AI Overview.
- Debug console: xanh = đọc, đỏ = bỏ; xem lý do trong console.table.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và parse manifest JSON; chưa chạy trình duyệt.
- Tiếp theo: kiểm tra các trang thực tế qua debug mode.

### v3.4.516 - 2026-10-23
- Reader: mặc định Show on hover; Always visible chỉ luôn hiện trong vùng Alt+R, ngoài vùng hiện khi hover.
- File: bilingual-reader.js, dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check, parse manifest và kiểm tra selector/default; chưa chạy trên trình duyệt.
- Tiếp theo: kiểm tra trực quan các chế độ icon đọc trong trang.

### v3.4.515 - 2026-10-22
- Thêm bước nhảy tốc độ tùy chỉnh cho phím Up/Down, mặc định 0.25; banner cập nhật theo thiết lập.
- File: bilingual-reader.js, i18n.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và test bước nhảy; chưa chạy trên trình duyệt.
- Tiếp theo: kiểm tra nhập bước nhảy và Up/Down trong Speak popup.

### v3.4.514 - 2026-10-22
- Gói Free (không key/không đăng nhập) dùng Translate và Google TTS không giới hạn.
- File: usage-limits.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và test quota Free/key; đều đạt.
- Tiếp theo: xác nhận các provider không tự giới hạn request.

### v3.4.513 - 2026-10-22
- Alt+R và Alt+A dùng chung một vùng nội dung chính (Readability từ bilingual-reader 1.0.1; bỏ ngày giờ, tác giả, tin liên quan, chia sẻ...). Alt+D vẫn trên toàn trang. Không tìm được nội dung chính thì dùng lại cách cũ.
- File: bilingual-reader.js (readerBlocks mới, cache), lib/Readability.js, lib/Readability-readerable.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và parse manifest JSON; chưa chạy trên trình duyệt thật.
- Tiếp theo: thử vài trang tin (VnExpress, Dân trí, BBC) để xem Alt+A/Alt+R có cùng vùng.

### v3.4.512 - 2026-10-22
- Watcher refresh Explorer khi có file mới/đổi tên ở D:\Keepit và sau khi xử lý ZIP.
- File: D:\Keepit\sync-watch.ps1, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy PowerShell parser và gọi SHChangeNotify; chưa kiểm tra Explorer tự sắp xếp.
- Tiếp theo: xác nhận refresh/sắp xếp trong Explorer khi ZIP mới xuất hiện.

### v3.4.511 - 2026-10-22
- Thiết lập phiên bản mới theo quy tắc AGENTS.md và PROJECT.md; không đổi chức năng addon.
- File: manifest.json, AGENTS.md, PROJECT.md.
- Kiểm tra: đã chạy parse manifest JSON; chưa chạy kiểm tra chức năng addon.
- Tiếp theo: xử lý các mục đang mở ở mục 2.

### v3.4.510 - 2026-10-22
- Hiện trạng ghi nhận khi thiết lập quy trình mới: có tts-engine.js; bilingual-reader.js gọi LHN_TTS.
- Chi tiết các bản 3.4.505 đến 3.4.510 chưa được ghi lại; xem commit Git nếu cần.
- Kiểm tra: chưa chạy (chỉ đọc code).
- Tiếp theo: xem mục 2.

