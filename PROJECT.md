# Keepit - Hồ sơ dự án
## Nhật ký cập nhật gần nhất
- 2026-10-23 | v3.4.553 | Claude sửa: Khi dùng giọng Google, mỗi lần tải hoặc phát âm thanh lỗi (trừ lỗi hết lượt) hiện toast đen "Mạng chậm, đang tải âm thanh" (EN/VI/KO, key googleAudioSlowToast). tts-engine.js thêm hook onGoogleAudioSlow, chỉ gọi khi lượt đọc còn active; content.js (Speak popup) dùng showSidebarToast, bilingual-reader.js dùng showReaderToast. Không đổi UI/CSS, dashboard (flashcard) chưa nối. File: tts-engine.js, content.js, bilingual-reader.js, i18n.js, manifest.json, PROJECT.md. Đã chạy node --check 4 file và test mock engine 4 ca (không strict, strict 3 lần, đã dừng, hết lượt); chưa kiểm tra trên trình duyệt. Tiếp theo: tắt mạng/giả lập mạng chậm rồi bấm đọc để xem toast. Lưu ý: ở chế độ không strict, toast hiện rồi đoạn đó đọc bằng giọng trình duyệt.
- 2026-10-23 | v3.4.552 | Claude sửa: Full dict tách IPA thành fetchIpa(word, lang, signal) chạy song song với dịch và Datamuse (không chờ Datamuse). Nguồn 1 dictionaryapi.dev phonetics[].text; nguồn 2 Google dt=rm đổi sang IPA bằng convertGoogleToIPA (tiện ích trong content.js, globalThis.LHN_IPA_UTILS); timeout 3 giây mỗi nguồn, dùng AbortSignal của popup. Chọn nguồn 1, không có thì nguồn 2 (lưu ipaApprox, gắn data-approx, không đổi giao diện), không có thì không vẽ .lhn-dict-ipa. Bỏ audio. Ngôn ngữ nguồn full dict ép en (đọc từ, chip Colloc), không dùng auto. Cache giữ nguyên key/TTL; mục cache cũ có ipa trùng từ sẽ bị ẩn. File: content.js, manifest.json, PROJECT.md. Đã chạy node --check và test mock (đổi ký âm, 6 ca fetchIpa gồm timeout 3s và abort); chưa chạy trên trình duyệt thật, chưa gọi mạng thật. Tiếp theo: tra thử từ trên Chrome/Firefox, xem IPA và từ không có IPA.
- 2026-10-23 | v3.4.551 | Claude sửa: (1) Select Voice: ô tìm kiếm tự focus trên mọi trình duyệt Chromium (Chrome, Edge,...) và Firefox bằng cách thử focus lại tối đa 5 lần (30/100/250/500ms) cho tới khi nhận được; chưa tái hiện được lỗi Edge nên chưa biết nguyên nhân gốc. (2) Thêm phím Alt+L (selectVoiceShortcut, mặc định Alt+L, đổi được) bấm vào icon cờ để mở Select Voice trên thanh đọc, chỉ khi đang đọc và thanh hiện, tuân theo công tắc Keyboard shortcuts của Reader; thêm dòng "Select voice reader" (EN/VI/KO) dưới Decrease reading speed ở Dashboard > Settings > Keyboard shortcuts, cùng markup với các dòng cũ, có trong Reset. (3) AGENTS.md: đổi tiêu đề thành "Keepit Working Rules for all AI (Codex/Claude,..)", thêm giới thiệu dự án và quy tắc UI mới phải giống giao diện tổng thể. (4) Viết lại README.md (tiếng Anh) theo hiện trạng dự án. File: bilingual-reader.js, content.js, config.js, dashboard.html, dashboard.js, i18n.js, manifest.json, AGENTS.md, README.md, PROJECT.md. Đã chạy node --check 5 file JS, parse manifest, test mock focus (3 ca) và handler Alt+L (3 ca); chưa kiểm tra trên trình duyệt thật. Tiếp theo: thử focus ô search trên Edge/Chrome/Firefox; thử Alt+L và dòng cài đặt mới trên Dashboard.
- 2026-10-23 | v3.4.550 | Claude sửa: Select Voice của Bilingual Reader đổi cờ (lhn-br-flag) và tooltip ngay khi bấm chọn Auto, ngôn ngữ Google hoặc giọng trình duyệt, kể cả lúc pause/play, không chờ lưu xong hay đoạn kế tiếp. Nguyên nhân cũ: ngôn ngữ đoạn Google đang đọc (readingSegment) luôn thắng nên cờ đứng yên, và nhánh giọng trình duyệt không xóa nó. Thêm voiceFlagOverride (xóa sau khi lưu xong hoặc lưu lỗi), speakNext nhánh giọng trình duyệt xóa readingSegment; không động vào settings trước khi lưu nên restart khi đổi giọng giữ nguyên. Không đổi UI. File: bilingual-reader.js, manifest.json, PROJECT.md. Đã chạy node --check và test mock 6 ca đổi cờ (Google đang đọc, pause, browser sang Google, Google sang browser, Auto, lưu lỗi) cùng 6 ca speakNext; chưa kiểm tra trên trình duyệt. Tiếp theo: xác nhận cờ đổi ngay trên Chrome/Firefox khi đang đọc, pause và dừng. Lưu ý: đang pause với Google, đổi giọng rồi Play vẫn tiếp tục audio cũ (resumeGoogle), chưa xử lý.
- 2026-10-23 | v3.4.549 | Claude sửa: Bilingual Reader với giọng trình duyệt đã chọn luôn dùng đúng giọng đó, không còn tự đổi sang giọng US theo ngôn ngữ đoạn (kể cả khi Auto-detect bật). Khớp theo voiceURI rồi theo tên (không phân biệt hoa thường); chờ voiceschanged tối đa 1s trước khi kết luận thiếu. Không có giọng thì ghi console.error, dừng đọc, hiện toast "Giọng “{name}” không có trên trình duyệt này" (EN/VI/KO), không đổi giọng. Không đổi UI; không chia đoạn cho giọng trình duyệt. File: bilingual-reader.js, i18n.js, manifest.json, PROJECT.md. Đã chạy node --check, parse manifest và test mock 6 ca (có giọng, khớp theo tên, thiếu, xuất hiện sau voiceschanged, không chọn giọng, request cũ); chưa kiểm tra trên trình duyệt. Tiếp theo: chọn Google Bahasa Indonesia trên Chrome và xem có đọc được không; trên Firefox xác nhận toast khi thiếu giọng; để ý giọng Google mạng dừng giữa chừng với đoạn dài.
- 2026-10-23 | v3.4.548 | Claude sửa: Select Voice chia hai nhóm có tiêu đề: "Ngôn ngữ (Google TTS)" (21 ngôn ngữ) và "Giọng trình duyệt" (giọng hệ thống, tên thêm hậu tố "(Browser)"); Auto đứng đầu không thuộc nhóm; nhóm rỗng khi tìm kiếm thì ẩn tiêu đề; phím Up/Down bỏ qua tiêu đề. Thêm toast đen của app (#lhn-sidebar-toast) khi: Google voice lỗi sau 3 lần thử (dừng đọc), hết lượt Google (chuyển sang giọng trình duyệt), giọng trình duyệt lỗi phát. Toast có 3 ngôn ngữ EN/VI/KO. File: bilingual-reader.js, tts-engine.js, i18n.js, manifest.json, PROJECT.md. Đã chạy node --check, kiểm tra i18n 3 ngôn ngữ, test mock 10 ca vẽ danh sách/tìm kiếm, 5 ca strictVoice, 1 ca thông báo hết lượt một lần; chưa kiểm tra giao diện trên trình duyệt. Chưa có toast cho lỗi dịch (translateBlock chỉ console.warn). Tiếp theo: xác nhận giao diện nhóm và toast trên Chrome/Firefox; xem lỗi thật của giọng Google Bahasa Indonesia qua toast/console.
- 2026-10-23 | v3.4.547 | Claude sửa: Bilingual Reader với voice Google không còn tự chuyển sang giọng trình duyệt khi một đoạn Google TTS lỗi: thử lại Google tối đa 3 lần (chờ 0,5s rồi 1s); vẫn lỗi thì dừng đọc và ghi console.error, không đổi giọng. Chỉ chuyển sang giọng trình duyệt khi hết lượt dùng (lỗi usage limit). Cờ strictVoice chỉ bật ở Bilingual Reader; chọn text và flashcard giữ nguyên cách cũ. File: tts-engine.js, bilingual-reader.js, manifest.json, PROJECT.md. Đã chạy node --check và test mock 5 ca (Google OK, lỗi tạm thời, lỗi kéo dài, hết lượt, nhánh không strict); chưa kiểm tra trên trình duyệt. CHƯA xác định nguyên nhân thật khiến Google TTS lỗi với tiếng Indonesia. Tiếp theo: chọn Indonesian khi đang đọc, nếu dừng thì xem console.error để biết lỗi (HTTP/Referer/audio); quyết định có áp dụng strict cho popup chọn text không.
- 2026-10-23 | v3.4.546 | Claude sửa: Select Voice của Bilingual Reader dùng bàn phím: khi popover đang mở, Up/Down di chuyển mục đang chọn trong danh sách (kẹp ở đầu/cuối, bắt đầu từ mục đang dùng), Enter chọn mục đó. Chỉ khi Select Voice mở mới chặn Up/Down, nên phím chỉnh tốc độ giữ nguyên ở lúc khác. Mục đang chọn bằng phím có nền hover và viền accent (class lhn-kb-active). File: bilingual-reader.js, manifest.json, PROJECT.md. Đã chạy node --check và test mock logic phím (8 ca); chưa kiểm tra trên trình duyệt. Tiếp theo: xác nhận Up/Down/Enter trong Select Voice trên Chrome/Firefox, kể cả khi con trỏ đang ở ô tìm kiếm.
- 2026-10-23 | v3.4.545 | Claude sửa: AGENTS.md thêm quy tắc ghi rõ người sửa (Claude/Codex/Huuson) trong mỗi mục nhật ký. Select Voice của Bilingual Reader có đủ 21 ngôn ngữ kèm cờ (gồm Việt Nam), tìm theo tên/bản địa/mã/quốc gia, không phân biệt dấu. Chọn ngôn ngữ giữ voiceMode=google và đặt ngôn ngữ đọc (readLanguage); cờ ở thanh dưới đổi theo. Chọn Auto hoặc giọng trình duyệt thì xóa readLanguage. File: tts-engine.js, bilingual-reader.js, AGENTS.md, manifest.json, PROJECT.md. Đã chạy node --check và test mock (lưu/đọc readLanguage, 21 cờ, tìm kiếm); chưa kiểm tra UI trên trình duyệt. Tiếp theo: xác nhận chọn Vietnamese đọc đúng tiếng Việt và cờ VN đổi theo trên Chrome/Firefox.
- 2026-10-23 | v3.4.534 | Codex sửa: Bilingual Reader chạy đồng thời các engine dịch và dùng bản dịch thành công đầu tiên, tránh chờ timeout tuần tự từng engine. File: background.js, manifest.json, PROJECT.md. Đã chạy node --check và git diff --check; chưa đo trực tiếp độ trễ trên trình duyệt. Tiếp theo: kiểm tra thời gian Alt+A/Alt+D trên trang thực tế.
## 1. Trạng thái hiện tại (sửa đè)
- Version: v3.4.553. Firefox và Chrome, Manifest V3, một bản build chung.
- Google TTS trên Chrome: đã thêm rule Referer (DNR). Request translate_tts trả 200 OK; CHƯA xác nhận audio phát thật trên máy.
- tts-engine.js (dùng chung content.js, dashboard.js, bilingual-reader.js): chia đoạn ~180 ký tự, phát Google TTS nối tiếp; đoạn lỗi thì đọc bằng giọng trình duyệt. detectReadLanguage nhận diện cục bộ; detectLanguage gọi Google chỉ với tối đa 200 ký tự Latin khi chưa kết luận, timeout 2.5 giây và cache hash tối đa 500 mục.
- Select Voice (Bilingual Reader): Auto, nhóm "Ngôn ngữ (Google TTS)" gồm 21 ngôn ngữ (lưu lhnSettings.readLanguage), rồi nhóm "Giọng trình duyệt". Chỉ Bilingual Reader dùng readLanguage; chọn text và flashcard bỏ qua. Trong Select Voice: Up/Down chọn mục, Enter xác nhận. Cờ ở thanh dưới đổi ngay khi chọn voice (kể cả lúc pause). Alt+L (đổi được ở Dashboard > Keyboard shortcuts) mở Select Voice khi thanh đọc đang hiện; ô tìm kiếm tự focus. Khi chọn giọng trình duyệt, Reader luôn đọc bằng đúng giọng đó (không đổi theo ngôn ngữ đoạn); giọng không có thì dừng và báo toast.
- Chọn text và Bilingual Reader dùng voiceMode google/browser cùng browserVoiceURI; migration từ speechVoice/speechVoiceURI chạy một lần. Flashcard giữ speechVoice độc lập.
- Bilingual Reader voice Auto dùng Google TTS và chọn giọng hệ thống đặt browserVoiceURI; icon đọc mặc định hiện khi hover, chế độ Always visible luôn hiện trong vùng Alt+R và hover ngoài vùng.
- Bilingual Reader > Reader: công tắc master và nhóm Auto-scroll, Show reading icon, Disable reader on websites, Parts not to read nằm chung một mục; tắt master thì nhóm phụ bị disabled, mờ và khóa pointer. Có 27 website mặc định bị tắt (gồm google.com; tên miền con cũng khớp), seed một lần, hợp nhất với danh sách cũ và cho phép người dùng xóa.
- Speak popup Settings có link tới Dashboard > Bilingual Reader và công tắc Custom web font (Inter), lưu cùng thiết lập Bilingual Reader để áp dụng font trực tiếp; menu được thu gọn spacing, link căn trái, hai divider cùng màu #cbd1d8 và nhãn dịch EN/VI/KO.
- Giọng Google lỗi tải/phát âm thanh (không phải hết lượt) thì hiện toast đen "Mạng chậm, đang tải âm thanh" ở Speak popup và Bilingual Reader; flashcard Dashboard chưa có.
- Full dict IPA: fetchIpa chạy độc lập song song với dịch/Datamuse; dictionaryapi.dev (ưu tiên) rồi Google dt=rm (gần đúng), timeout 3 giây, không có thì ẩn dòng IPA. Ngôn ngữ nguồn full dict luôn en.
- Full dict cache dùng `browser.storage.local` với TTL 7 ngày; cache bản dịch chính riêng theo từ/ngôn ngữ để tái sử dụng cho Syn/Ant, Forms và Colloc. Khi note mở, các yêu cầu phụ bị hủy và bản dịch chính được điền ngay.
- Bilingual Reader dịch qua Google/MyMemory/Lingva đồng thời, hiển thị bản đầu tiên thành công và lưu cache cục bộ 7 ngày; các engine lỗi không chặn dịch thành công.
- Nhật ký lỗi: browser.storage.local giữ tối đa 200 mục metadata phân loại; không lưu URL, nội dung trang, chữ chọn, email hay stack. Dashboard Settings > About cho phép xuất JSON theo thao tác người dùng.
- Dashboard Settings > Highlights & Notes: Auto-open note popup khi click ngoài đóng mà không lưu; Auto highlight mặc định tắt và giữ lưu hiện tại khi popup không tự mở.
- Giới hạn dùng (usage-limits.js): gói Free không giới hạn translate/Google TTS; key A 100 lượt/ngày, key B không giới hạn. Key cứng trong code, chỉ là bản thử. TRIAL_MS = 0.
- Chưa nối Supabase (chỉ có supabase-schema.sql và SUPABASE_SYNC.md).

## 2. Việc đang mở / Tiếp theo (sửa đè)
15. [Kiểm tra] Toast "Mạng chậm, đang tải âm thanh" khi Google TTS lỗi trên Chrome/Firefox (Speak popup, Bilingual Reader). Chưa nối cho flashcard Dashboard.
14. [Kiểm tra] Full dict IPA trên Chrome/Firefox: từ có IPA, từ chỉ có nguồn Google (gần đúng), từ không có IPA (không hiện dòng); đọc từ và chip Colloc dùng en.
13. [Kiểm tra] Focus ô search của Select Voice trên Edge (bản retry chưa thử trên Edge thật); Alt+L và dòng Select voice reader trong Dashboard.
12. [Kiểm tra] Cờ lhn-br-flag đổi ngay khi chọn voice lúc đang đọc/pause trên Chrome/Firefox. [Chưa làm] Pause với Google rồi đổi giọng: Play vẫn tiếp tục audio cũ.
11. [Kiểm tra] Giọng trình duyệt đã chọn phải đọc đúng giọng (Chrome: Google Bahasa Indonesia); thiếu giọng thì toast + dừng (Firefox/Android). Theo dõi giọng Google mạng dừng giữa chừng với đoạn dài.
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
### v3.4.533 | Codex sửa - 2026-10-23
- Thêm Auto highlight vào Toolbar settings, dùng chung `autoHighlight` với Dashboard > Highlights & Notes; mặc định tắt ở cài đặt mới.
- File: config.js, popup.html, popup.js, dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check cho config.js, popup.js, dashboard.js và git diff --check; chưa kiểm tra UI trên trình duyệt.

### v3.4.532 | Codex sửa - 2026-10-23
- Giá trị khởi tạo Your speed cho Custom rate for display language là 1.2; giữ ưu tiên tốc độ riêng đã lưu.
- File: dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, git diff --check và tính toán mặc định; chưa kiểm tra UI trên trình duyệt.

### v3.4.531 | Codex sửa - 2026-10-23
- Đồng bộ khoảng cách mô tả Disable reader on websites với form thêm domain thành 16px.
- File: dashboard.css, manifest.json, PROJECT.md.
- Kiểm tra: git diff --check; chưa kiểm tra UI trên trình duyệt.

### v3.4.530 | Codex sửa - 2026-10-23
- Seed danh sách 27 website mặc định tắt Reader một lần, hợp nhất với danh sách hiện có và giữ domain người dùng đã xóa.
- File: config.js, dashboard.js, bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, git diff --check và 3 ca migration; chưa kiểm tra trên trình duyệt.

### v3.4.529 | Codex sửa - 2026-10-23
- Gộp Reader settings thành một mục; khi Enable reader tắt, các tùy chọn phụ bị mờ và khóa tương tác.
- File: dashboard.html, dashboard.js, dashboard.css, manifest.json, PROJECT.md.
- Kiểm tra: node --check, cấu trúc/ID UI và git diff --check; chưa kiểm tra trên trình duyệt.

### v3.4.528 | Codex sửa - 2026-10-23
- Thêm Enable reader và danh sách website tắt Reader có thể thêm, sửa, xóa; vô hiệu hóa các tùy chọn liên quan khi reader tắt.
- File: dashboard.html, dashboard.js, bilingual-reader.js, i18n.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check 3 JS, liên kết UI và git diff --check; chưa kiểm tra trên trình duyệt.

### v3.4.527 | Codex sửa - 2026-10-23
- Thu hẹp dải ký tự nhận dạng Bengali và Devanagari, ưu tiên Bengali trước Hindi.
- File: tts-engine.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, kiểm tra dải ký tự và git diff --check; chưa kiểm tra TTS trên trình duyệt.

### v3.4.526 | Codex sửa - 2026-10-23
- Hợp nhất voiceMode/browserVoiceURI cho chọn text và Bilingual Reader; thêm nhận dạng cục bộ và nhận diện Google nền cho Latin; giữ thiết lập giọng flashcard nguyên trạng.
- File: tts-engine.js, background.js, content.js, bilingual-reader.js, dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, 12 câu mẫu, cache/fallback, manifest và git diff --check; chưa kiểm tra Chrome/Firefox.

### v3.4.525 | Codex sửa - 2026-10-23
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

### v3.4.524 | Codex sửa - 2026-10-23
- TTS engine đọc `lhnSettings.speechVoice`; Browser voice phát từng đoạn bằng giọng trình duyệt, không gọi Google TTS.
- File: tts-engine.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check và test mock xác nhận browser voice bỏ qua API Google; chưa thử trên trình duyệt.
- Tiếp theo: xác nhận phát âm thật trên Chrome/Firefox.

### v3.4.523 | Codex sửa - 2026-10-23
- Sửa nhận diện paragraph có chữ nằm trong inline element; ép câu hỏi phỏng vấn VnExpress vào main reader queue.
- Hover hiện icon cho đoạn chữ ở mọi chế độ; icon ngoài main chỉ đọc block đã bấm.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: kiểm tra DOM thật, node --check, parse manifest, git diff --check; chưa phát TTS thực tế.

### v3.4.522 | Codex sửa - 2026-10-23
- Thêm đoạn question trong `.fck_detail` vào queue main; semantic paragraphs có inline text vẫn nhận icon; hover hiện icon ở mọi chế độ.
- Bấm icon ngoài main đọc riêng block được chọn; trong main giữ queue hiện tại.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: node --check, parse manifest, git diff --check và markup DOM; chưa phát thử trên trình duyệt.

### v3.4.521 | Codex sửa - 2026-10-23
- Giữ câu hỏi phỏng vấn italic kết thúc bằng dấu hỏi; icon ngoài main hiện khi hover ở mọi chế độ và chỉ đọc block được bấm.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: chạy node --check, parse manifest JSON, git diff --check; chưa thử phát trên trình duyệt.
- Tiếp theo: xác nhận trên trang VnExpress.

### v3.4.520 | Codex sửa - 2026-10-23
- Alt+A/Alt+R đưa headline `.title_post` và sapo `.lead_post_detail` của VnExpress vào queue khi cùng khối bài viết.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: xác nhận selector/markup trên HTML trang; đã chạy node --check, parse manifest JSON, git diff --check; chưa thử trình duyệt.
- Tiếp theo: xác nhận Alt+R đọc đủ phần mở đầu và body.

### v3.4.519 | Codex sửa - 2026-10-23
- Alt+A/Alt+R loại khối đọc gần phủ toàn màn hình, tránh tô tím toàn trang.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: chạy node --check, parse manifest JSON, git diff --check; chưa thử trên trình duyệt.
- Tiếp theo: xác nhận trên trang gặp lỗi.

### v3.4.518 | Codex sửa - 2026-10-23
- Alt+A/Alt+R đọc các khối chữ nhìn thấy trong vùng nội dung; giữ đoạn dài, lọc rác ở đoạn ngắn, Google Search ưu tiên vùng kết quả/AI Overview.
- Debug console: xanh = đọc, đỏ = bỏ; xem lý do trong console.table.
- File: bilingual-reader.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và parse manifest JSON; chưa chạy trình duyệt.
- Tiếp theo: kiểm tra các trang thực tế qua debug mode.

### v3.4.517 | Codex sửa - 2026-10-23
- Watcher tự commit khi lưu file trong thư mục nguồn; cập nhật ZIP cùng version. (Watcher nằm ngoài repo.)
- File ghi nhận: manifest.json, PROJECT.md, D:\Keepit\sync-watch.ps1.
- Kiểm tra: watcher ghi log cho commit/ZIP; chưa xác nhận tự chạy sau khi khởi động lại Windows.
### v3.4.516 | Codex sửa - 2026-10-23
- Reader: mặc định Show on hover; Always visible chỉ luôn hiện trong vùng Alt+R, ngoài vùng hiện khi hover.
- File: bilingual-reader.js, dashboard.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check, parse manifest và kiểm tra selector/default; chưa chạy trên trình duyệt.
- Tiếp theo: kiểm tra trực quan các chế độ icon đọc trong trang.

### v3.4.515 | Codex sửa - 2026-10-22
- Thêm bước nhảy tốc độ tùy chỉnh cho phím Up/Down, mặc định 0.25; banner cập nhật theo thiết lập.
- File: bilingual-reader.js, i18n.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và test bước nhảy; chưa chạy trên trình duyệt.
- Tiếp theo: kiểm tra nhập bước nhảy và Up/Down trong Speak popup.

### v3.4.514 | Codex sửa - 2026-10-22
- Gói Free (không key/không đăng nhập) dùng Translate và Google TTS không giới hạn.
- File: usage-limits.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và test quota Free/key; đều đạt.
- Tiếp theo: xác nhận các provider không tự giới hạn request.

### v3.4.513 | Codex sửa - 2026-10-22
- Alt+R và Alt+A dùng chung một vùng nội dung chính (Readability từ bilingual-reader 1.0.1; bỏ ngày giờ, tác giả, tin liên quan, chia sẻ...). Alt+D vẫn trên toàn trang. Không tìm được nội dung chính thì dùng lại cách cũ.
- File: bilingual-reader.js (readerBlocks mới, cache), lib/Readability.js, lib/Readability-readerable.js, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy node --check và parse manifest JSON; chưa chạy trên trình duyệt thật.
- Tiếp theo: thử vài trang tin (VnExpress, Dân trí, BBC) để xem Alt+A/Alt+R có cùng vùng.

### v3.4.512 | Codex sửa - 2026-10-22
- Watcher refresh Explorer khi có file mới/đổi tên ở D:\Keepit và sau khi xử lý ZIP.
- File: D:\Keepit\sync-watch.ps1, manifest.json, PROJECT.md.
- Kiểm tra: đã chạy PowerShell parser và gọi SHChangeNotify; chưa kiểm tra Explorer tự sắp xếp.
- Tiếp theo: xác nhận refresh/sắp xếp trong Explorer khi ZIP mới xuất hiện.

### v3.4.511 | Codex sửa - 2026-10-22
- Thiết lập phiên bản mới theo quy tắc AGENTS.md và PROJECT.md; không đổi chức năng addon.
- File: manifest.json, AGENTS.md, PROJECT.md.
- Kiểm tra: đã chạy parse manifest JSON; chưa chạy kiểm tra chức năng addon.
- Tiếp theo: xử lý các mục đang mở ở mục 2.

### v3.4.510 | ZIP sync, người sửa không xác định - 2026-10-22
- ZIP ghi nhận `bilingual-reader.js` gọi `LHN_TTS`; commit chỉ đồng bộ ZIP nên không gán thay đổi cho Codex.

### v3.4.509 | Codex sửa - 2026-10-22
- Trả audio TTS dạng Base64 qua runtime message để tương thích Chrome; dùng cho cả audio cache và audio mới.
- File: background.js, tts-engine.js, manifest.json. Kiểm tra lịch sử không ghi nhận.

### v3.4.508 | Codex sửa - 2026-10-22
- Dùng chung `LHN_TTS` cho chọn text và Bilingual Reader; chuyển Bilingual Reader sang Google TTS, giữ pause/resume và đổi tốc độ khi phát.
- File: tts-engine.js, content.js, bilingual-reader.js, dashboard.js, manifest.json. Kiểm tra lịch sử không ghi nhận.

### v3.4.506 | ZIP sync, người sửa không xác định - 2026-10-22
- Đồng bộ ZIP; commit cập nhật version và bỏ AGENTS.md/PROJECT.md khỏi snapshot. Không gán thay đổi này cho Codex.

### v3.4.505 | Codex sửa - 2026-10-22
- Chia văn bản TTS dài thành đoạn ngắn để phát nối tiếp.
- File: content.js, manifest.json, PROJECT.md. Kiểm tra lịch sử không ghi nhận.

### v3.4.504 | Codex sửa - 2026-10-22
- Chuyển sang Manifest V3 dùng chung cho Chromium và Firefox; sửa Google TTS trên Chrome.
- File: manifest.json, background.js, popup.html, dashboard.html, browser-polyfill.js, LICENSE-WEBEXTENSION-POLYFILL.txt. Kiểm tra lịch sử không ghi nhận.

### v3.4.501 | Baseline - 2026-10-22
- Bản đầu tiên có trong Git. Tên manifest: `Keepit - Translate & Highlight Notes`; tiêu đề README cũ: `Local Highlight Notes for Firefox Windows` (v1.30.0).
- Git không có lịch sử trước baseline hoặc commit .502, .503, .507; không gán thay đổi chưa xác minh cho Codex.

## 5. Lịch sử trước baseline Git (khôi phục từ tài liệu trong Codex)
### v1.0.0–v1.8.0 | Chưa khôi phục được
- Không tìm thấy ZIP, source hoặc ghi chú changelog của các phiên bản này; chưa thể xác nhận tính năng ban đầu hay người thực hiện.

### v1.9.0 | Codex sửa (theo README lưu lại)
- Sửa tham chiếu localization trong content script và trạng thái chọn màu sau khi dịch nhãn; cải thiện tooltip, thẻ sidebar và thứ tự ghi chú theo vị trí trên trang.
- README có hai ghi chú v1.9.0 mâu thuẫn về vị trí nút tooltip; không kết luận vị trí nào là bản cuối.

### v1.12.0 | Codex sửa (theo README lưu lại)
- Dashboard thư viện hai cột; sắp xếp, tìm kiếm/lọc website, đánh dấu yêu thích; xuất TXT/CSV/Markdown/JSON; thẻ trang có ảnh xem trước khi metadata sẵn có.
- Chuẩn hóa icon, căn lại thanh công cụ và cho hai cột cuộn độc lập.

### v1.29.0 | Codex sửa (theo README lưu lại)
- Tăng độ tin cậy khi khôi phục highlight trên trang động: chuẩn hóa khoảng trắng, hỗ trợ text qua nhiều node inline, chống mất yêu cầu đồng thời và thử lại khi nội dung chưa sẵn sàng.

### v1.30.0 | Codex sửa (theo README lưu lại)
- Thêm tùy chọn chỉ lưu và highlight đoạn vừa chọn sau khi click ra ngoài; mặc định tắt để giữ hành vi cũ.
- README v1.30.0 mô tả sản phẩm lúc đó: highlight bốn màu, note có thể sửa/xóa, popup và sidebar, giao diện EN/VI/KO, shortcut tùy chỉnh, dashboard tìm/sửa/xóa và nhập/xuất JSON.

### v1.31.0–v1.44.0 | Thiếu tư liệu
- Không tìm thấy ZIP hoặc changelog trong `C:\Users\Huuson\Documents\Codex`; không gán thay đổi cho từng phiên bản.

### v1.45.0 trở đi | Có ZIP, thiếu changelog lịch sử
- ZIP đầu tiên tìm thấy là `highlight-notes-firefox-windows-v1.45.zip`; có các snapshot tiếp theo, nhưng không có ghi chú theo phiên bản để xác định chính xác từng thay đổi hoặc tác giả.
