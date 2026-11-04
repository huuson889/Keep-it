# Content — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

Content scripts gắn Keepit vào website: highlight, note, dịch, sidebar, shortcut và reader/overlay entry. `content.js` điều phối giao diện; helper giữ logic độc lập; annotation thuộc Background.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Khai báo script theo URL, frame và thứ tự nạp. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings, selection, UI và message listeners. |
| [`js/content/chatgpt-context.js`](../../js/content/chatgpt-context.js) | `LHN_CHATGPT_CONTEXT.create` | Trích nội dung trang, ghép prompt, ghi clipboard. |
| [`js/content/chatgpt-autofill.js`](../../js/content/chatgpt-autofill.js) | pending storage watcher | Chỉ đọc clipboard trong ChatGPT panel được đánh dấu; điền composer rỗng. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Sidebar, tabs và controls. |
| [`js/content/web-highlighter.js`](../../js/content/web-highlighter.js) | `LHNWebHighlighter.create` | Tạo và khôi phục highlight marks. |
| [`js/content/annotation-restore.js`](../../js/content/annotation-restore.js) | `LHN_ANNOTATION_RESTORE.create` | Tìm lại text/range trên trang động. |
| [`js/content/note-composer.js`](../../js/content/note-composer.js) | `LHN_NOTE_COMPOSER` | Dựng form và chuẩn hóa annotation. |

## 3. Luồng chính

1. Manifest nạp factories trước `content.js`; controller chống khởi tạo lặp trên document.
2. Controller đọc settings, rồi gắn selection, sidebar và UI listeners.
3. Annotation được tạo bởi `LHN_NOTE_COMPOSER`, gửi CRUD qua `LHN_MESSAGING`; khi trang đổi, restore/highlighter dựng lại mark.
4. Reader và YouTube chuyển action qua custom events; Overlay xử lý video/Study.
5. Tab ChatGPT và `Alt+X` toggle browser-native panel. Khi mở, content trích main text và ghi prompt vào clipboard. Background chỉ giữ metadata pending có hạn dùng, không nhận page text. Script riêng có marker đọc clipboard cục bộ, chỉ điền composer trống, báo kết quả và không submit; nếu không hỗ trợ, người dùng có thể tự dán.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp manifest để mọi global `LHN_*` tồn tại trước khi controller dùng.
- Annotation CRUD tiếp tục qua Background; giữ payload `item`, `id`, `url`, `origin` và message types hiện tại.
- Shortcut không chặn nhập liệu; giữ guard cho input/contenteditable và event Reader/Overlay.
- Loại extension UI khỏi annotation restore và capture text; không biến UI thành nguồn annotation/selection.
- `LHN_CHATGPT_CONTEXT` dùng Readability rồi fallback cleaned body; cap page text 40.000 ký tự và chỉ ghi clipboard sau hành động người dùng.
- Auto-fill chỉ chạy ở ChatGPT URL có marker panel, khi metadata pending còn hạn và clipboard khớp prompt; không đọc clipboard thông thường, không ghi đè composer có text, tuyệt đối không click Send/press Enter. Giữ `clipboardRead` và disclosures khớp hành vi.
- Alt+Q/custom `sidebarShortcut` tiếp tục điều khiển Highlight; giữ label mới đồng bộ EN/VI/KO trong `LHN_LANGUAGES`.

## 5. Kiểm tra và xác minh

- Static: `for f in js/content/*.js; do node --check "$f" || exit; done`; kiểm tra manifest references và `git diff --check`.
- Focused VM: prompt prefix/cap, clipboard success/failure, marker gating, pending request, composer empty/non-empty; message/result không chứa page text và không gọi submit.
- Browser QA: Chrome/Firefox toggle, đăng nhập và frame policy; xác nhận draft chỉ điền trong panel, draft hiện có được giữ, fallback paste hoạt động và không gửi.
- Xác nhận scrollbar Chromium 3px/Firefox thin chỉ khi panel mở, được restore lúc đóng; regression Alt+Q, sidebar tabs, annotation và website-disabled.
- Ghi rõ browser nào đã chạy; static/VM không thay thế browser verification.
