# Keepit - Hồ sơ dự án

## Sản phẩm
- Addon Keepit: highlight & note, bilingual reader, dịch song ngữ, popup dịch/từ điển khi chọn text, flash card, dashboard.
- Nền tảng: Firefox và Chrome, Manifest V3, một bản build chung.
- Không có sidebar_action; popup và dashboard mở trong tab/popup.

## Bản đồ file
- manifest.json: quyền, content scripts, background.
- background.js: dịch (chuỗi engine), TTS Google (cache IndexedDB), usage limit, rule DNR Referer cho Chrome.
- content.js: popup chọn text, sidebar trong trang, speech.
- bilingual-reader.js: đọc song ngữ trên trang (chỉ giọng trình duyệt).
- popup.html/js: popup toolbar. dashboard.html/js: quản lý, flash card, cài đặt.
- browser-polyfill.js: cho phép dùng browser.* trên Chrome.

## Ràng buộc
- Giữ nguyên UI, layout, văn bản hiện có. Chỉ thêm mới khi được yêu cầu.
- Mọi API dùng browser.* (đã có polyfill).

## Trạng thái
- v3.4.504: chạy MV3 cho cả hai trình duyệt. Google TTS trên Chrome: đã thêm rule Referer, CHƯA xác nhận trên máy.
- Đã biết: bilingual reader không dùng Google TTS.

## Quyết định
- Thư mục nguồn là nguồn duy nhất; zip do Codex đóng gói vào D:\Keepit.
- Thay đổi lớn nêu rõ trong commit message.

## Việc đang mở
1. [Kiểm tra] Google TTS trên Chrome (v3.4.504): xác nhận translate_tts trả 200 trong flashcard và popup chọn text. Nếu vẫn 404, lấy mã trạng thái từ log service worker và báo lại.
2. [Chưa làm] Đọc đoạn dài bằng Google TTS: chia văn bản thành đoạn khoảng 180–200 ký tự, phát nối tiếp. Hiện background giới hạn 500 ký tự.
3. [Chưa làm] Chuỗi dự phòng TTS: Google → phát trực tiếp → giọng trình duyệt, có báo lỗi rõ ràng.
4. [Quyết định] Bilingual reader có dùng Google TTS không? Hiện chỉ dùng giọng trình duyệt.
5. [Kiểm tra] Firefox MV3: background có unload khi rảnh làm mất tin nhắn không.
6. [Vệ sinh] Loại trừ AGENTS.md và PROJECT.md khi đóng gói zip.