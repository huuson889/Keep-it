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
- (cập nhật khi có)