# Keepit - Hồ sơ dự án

## 1. Trạng thái hiện tại (sửa đè)
- Version: v3.4.513. Firefox và Chrome, Manifest V3, một bản build chung.
- Google TTS trên Chrome: đã thêm rule Referer (DNR). Request translate_tts trả 200 OK; CHƯA xác nhận audio phát thật trên máy.
- tts-engine.js (dùng chung content.js, dashboard.js, bilingual-reader.js): chia đoạn ~180 ký tự, phát Google TTS nối tiếp; đoạn lỗi thì đọc bằng giọng trình duyệt.
- bilingual-reader.js dùng Google TTS khi người dùng không chọn giọng riêng (speechVoiceURI trống).
- Giới hạn dùng theo ngày (usage-limits.js): free 10 lượt/ngày, key A 100, key B không giới hạn. Key cứng trong code, chỉ là bản thử. TRIAL_MS = 0.
- Chưa nối Supabase (chỉ có supabase-schema.sql và SUPABASE_SYNC.md).

## 2. Việc đang mở / Tiếp theo (sửa đè)
1. [Kiểm tra] Google TTS trên Chrome: xác nhận nghe được audio. Ví dụ request đã thấy: translate.google.com/translate_tts?ie=UTF-8&q=...&tl=en&client=tw-ob, GET, 200 OK.
2. [Kiểm tra] Đọc đoạn dài bằng chia đoạn 180 ký tự (đã có trong code, chưa xác nhận trên máy). Background vẫn giới hạn 500 ký tự mỗi request.
3. [Làm một phần] Chuỗi dự phòng TTS: hiện là Google -> giọng trình duyệt theo từng đoạn. Chưa có bước "phát trực tiếp"; lỗi mới chỉ ghi console.warn, chưa báo rõ cho người dùng.
4. [Kiểm tra] Firefox MV3: background có unload khi rảnh làm mất tin nhắn không.
5. [Vệ sinh] README.md trong dự án đã lỗi thời (ghi v1.30.0, Firefox, MV2, "không dùng mạng"). Cần viết lại khi được yêu cầu.

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
