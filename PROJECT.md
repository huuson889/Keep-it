# Keepit - Hồ sơ dự án
## Nhật ký cập nhật gần nhất
- 2026-10-23 | v3.4.527: Thu hẹp nhận diện Bengali/Devanagari về dải chữ cái và kiểm tra Bengali trước Hindi. File: tts-engine.js, manifest.json, PROJECT.md. Đã chạy node --check, kiểm tra hai dải ký tự và git diff --check; chưa kiểm tra trên Chrome/Firefox. Tiếp theo: xác nhận TTS Bengali/Hindi trên trình duyệt.
- 2026-10-23 | v3.4.526: Hợp nhất voiceMode/browserVoiceURI cho chọn text và Bilingual Reader; thêm nhận dạng chữ/từ cục bộ, nhận diện Google nền cho Latin (cache hash tối đa 500), migration một lần; giữ flashcard nguyên trạng. File: tts-engine.js, background.js, content.js, bilingual-reader.js, dashboard.js, manifest.json, PROJECT.md. Đã chạy node --check, 12 câu mẫu, kiểm tra cache/fallback, manifest và diff; chưa kiểm tra Chrome/Firefox. Tiếp theo: xác nhận voiceMode và nhận diện trên hai trình duyệt.
- 2026-10-23 | v3.4.525: Thêm log lỗi cục bộ tối đa 200 mục, chỉ lưu thời gian/component/severity/code đã phân loại; thêm xuất JSON ở Dashboard Settings > About, không xuất URL/nội dung trang/văn bản chọn/tài khoản. File: error-logger.js, background.js, manifest.json, dashboard.html, dashboard.js, popup.html, i18n.js, PROJECT.md. Đã chạy node --check cho JS, parse manifest và git diff --check; chưa kiểm tra tải file qua UI trên trình duyệt. Tiếp theo: xác nhận log ghi được và nút About tải JSON trên Firefox/Chrome.
- 2026-10-23 | v3.4.525: Thêm MyMemory làm fallback cho lhn-direct-translation khi Google lỗi/timeout; nguồn Auto gửi autodetect, văn bản dài được chia dưới giới hạn API. File: study-translation.js, PROJECT.md. Đã chạy node --check study-translation.js, parse manifest.json và git diff --check; chưa thử lỗi mạng thực tế trên trình duyệt. Tiếp theo: xác nhận fallback MyMemory trên Firefox/Chrome.
- 2026-10-23 | v3.4.525: Full dict chuyển cache sang browser.storage.local (TTL 7 ngày), cache nghĩa từng từ/cụm liên quan để tái sử dụng; khi note mở, hủy yêu cầu phụ và điền ngay bản dịch chính. File: content.js, PROJECT.md. Đã chạy node --check content.js và git diff --check; chưa xác nhận trên trình duyệt. Tiếp theo: kiểm tra cache liên quan và điền note khi mạng chậm.
- 2026-10-23 | v3.4.525: Thêm Auto highlight; Auto-open note popup đóng ngoài sẽ hủy, còn Auto highlight bật sẽ lưu như trước khi popup không tự mở. File: config.js, dashboard.html, dashboard.js, content.js, i18n.js, PROJECT.md. Đã chạy node --check và git diff --check; chưa xác nhận UI/Tương tác trên trình duyệt. Tiếp theo: kiểm tra hai chế độ popup.
- 2026-10-23 | v3.4.525: Đồng bộ màu hai divider trong Settings speak popup và làm đậm hơn 10%. File: bilingual-reader.js, PROJECT.md. Đã chạy node --check và git diff --check; chưa kiểm tra UI trực tiếp. Tiếp theo: xác nhận màu trên Firefox/Chrome.
- 2026-10-23 | v3.4.525: Thêm divider màu nhạt dưới Sign in trong Settings speak popup. File: bilingual-reader.js, PROJECT.md. Đã chạy node --check và git diff --check; chưa kiểm tra UI trực tiếp. Tiếp theo: xác nhận trên Firefox/Chrome.
- 2026-10-23 | v3.4.525: Speak popup Settings khôi phục cỡ chữ 13px, bỏ divider thừa, căn link trái và thu hẹp khoảng cách tới footer. File: bilingual-reader.js, PROJECT.md. Đã chạy node --check và git diff --check; chưa kiểm tra UI trực tiếp. Tiếp theo: xác nhận trên Firefox/Chrome.
- 2026-10-23 | v3.4.525: Thêm link mở Dashboard > Bilingual Reader và công tắc Website font (Inter) trong Settings speak popup; dịch EN/VI/KO. File: bilingual-reader.js, background.js, dashboard.js, i18n.js, PROJECT.md. Đã chạy node --check và git diff --check; chưa kiểm tra giao diện trực tiếp. Tiếp theo: xác nhận hai mục trên Firefox/Chrome.
## 1. Trạng thái hiện tại (sửa đè)
- Version: v3.4.527. Firefox và Chrome, Manifest V3, một bản build chung.
- Alt+A/Alt+R: Readability khoanh vùng; lấy các block chữ nhìn thấy, giữ câu hỏi italic trong `.fck_detail`, bỏ khối phủ gần toàn màn hình, và bao gồm headline/sapo VnExpress ngoài article body. Icon speak nhận diện đoạn có chữ trong thẻ inline; hover hiện icon ở mọi chế độ. Bấm ngoài main chỉ đọc block đó; trong main tiếp tục queue.
- Google TTS trên Chrome: đã thêm rule Referer (DNR). Request translate_tts trả 200 OK; CHƯA xác nhận audio phát thật trên máy.
- tts-engine.js (dùng chung content.js, dashboard.js, bilingual-reader.js): chia đoạn ~180 ký tự, phát Google TTS nối tiếp; đoạn lỗi thì đọc bằng giọng trình duyệt. detectReadLanguage nhận diện cục bộ; detectLanguage gọi Google chỉ với tối đa 200 ký tự Latin khi chưa kết luận, timeout 2.5 giây và cache hash tối đa 500 mục.
- Chọn text và Bilingual Reader dùng voiceMode google/browser cùng browserVoiceURI; migration từ speechVoice/speechVoiceURI chạy một lần. Flashcard giữ speechVoice độc lập.
- Bilingual Reader voice Auto dùng Google TTS và chọn giọng hệ thống đặt browserVoiceURI; icon đọc mặc định hiện khi hover, chế độ Always visible luôn hiện trong vùng Alt+R và hover ngoài vùng.
- Speak popup Settings có link tới Dashboard > Bilingual Reader và công tắc Custom web font (Inter), lưu cùng thiết lập Bilingual Reader để áp dụng font trực tiếp; menu được thu gọn spacing, link căn trái, hai divider cùng màu #cbd1d8 và nhãn dịch EN/VI/KO.
- Full dict cache dùng `browser.storage.local` với TTL 7 ngày; cache bản dịch chính riêng theo từ/ngôn ngữ để tái sử dụng cho Syn/Ant, Forms và Colloc. Khi note mở, các yêu cầu phụ bị hủy và bản dịch chính được điền ngay.
- lhn-direct-translation trong study-translation.js dùng Google trước, MyMemory làm backup khi Google lỗi/timeout; nguồn Auto gửi `autodetect`, văn bản dài được chia theo giới hạn API.
- Nhật ký lỗi: browser.storage.local giữ tối đa 200 mục metadata phân loại; không lưu URL, nội dung trang, chữ chọn, email hay stack. Dashboard Settings > About cho phép xuất JSON theo thao tác người dùng.
- Dashboard Settings > Highlights & Notes: Auto-open note popup khi click ngoài đóng mà không lưu; Auto highlight mặc định bật và giữ lưu hiện tại khi popup không tự mở.
- Giới hạn dùng (usage-limits.js): gói Free không giới hạn translate/Google TTS; key A 100 lượt/ngày, key B không giới hạn. Key cứng trong code, chỉ là bản thử. TRIAL_MS = 0.
- Chưa nối Supabase (chỉ có supabase-schema.sql và SUPABASE_SYNC.md).

## 2. Việc đang mở / Tiếp theo (sửa đè)
0. [Kiểm tra] Xác nhận Auto-open note popup đóng ngoài không lưu; Auto highlight lưu khi click ngoài.

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

