# Content — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

Content scripts gắn Keepit vào website: highlight, note, dịch, sidebar, shortcut và reader/overlay entry. `content.js` điều phối giao diện; helper giữ logic độc lập; annotation thuộc Background.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Khai báo script theo URL, frame và thứ tự nạp. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings, selection, UI và message listeners. |
| [`js/content/chatgpt-context.js`](../../js/content/chatgpt-context.js) | `LHN_CHATGPT_CONTEXT.create` | Dùng Reader main blocks, ghép prompt, ghi clipboard. |
| [`js/content/chatgpt-autofill.js`](../../js/content/chatgpt-autofill.js) | pending watcher, route watcher | Prefill qua q/direct fallback, bảo toàn composer và lưu origin/path hội thoại. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Sidebar, tabs và controls. |
| [`js/content/web-highlighter.js`](../../js/content/web-highlighter.js) | `LHNWebHighlighter.create` | Tạo và khôi phục highlight marks. |
| [`js/content/annotation-restore.js`](../../js/content/annotation-restore.js) | `LHN_ANNOTATION_RESTORE.create` | Tìm lại text/range trên trang động. |
| [`js/content/note-composer.js`](../../js/content/note-composer.js) | `LHN_NOTE_COMPOSER` | Dựng form và chuẩn hóa annotation. |

## 3. Luồng chính

1. Manifest nạp factories trước `content.js`; controller chống khởi tạo lặp trên document.
2. Controller đọc settings, rồi gắn selection, sidebar và UI listeners.
3. Annotation được tạo bởi `LHN_NOTE_COMPOSER`, gửi CRUD qua `LHN_MESSAGING`; khi trang đổi, restore/highlighter dựng lại mark.
4. Reader và YouTube chuyển action qua custom events; Overlay xử lý video/Study.
5. ChatGPT tab/`Alt+X` mở panel; context dùng Reader Alt+R main blocks (Readability-only fallback), cap 5.000 ký tự và ghi prompt vào clipboard.
6. Với pending metadata, panel đọc clipboard rồi đặt ChatGPT `?q=` trên cả hai browser. Storage event + poll bắt request lặp; script nhận diện q-prefill, direct-fill chỉ khi composer rỗng, giữ text có sẵn và không gửi. Chỉ conversation origin/path được lưu để restore; query/page text không lưu.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp manifest để mọi global `LHN_*` tồn tại trước khi controller dùng.
- Annotation CRUD tiếp tục qua Background; giữ payload `item`, `id`, `url`, `origin` và message types hiện tại.
- Shortcut không chặn nhập liệu; giữ guard cho input/contenteditable và event Reader/Overlay.
- Loại extension UI khỏi annotation restore và capture text; không biến UI thành nguồn annotation/selection.
- `LHN_CHATGPT_CONTEXT` ưu tiên Reader Alt+R blocks, chỉ fallback Readability; không lấy toàn trang. Cap main text 5.000 ký tự; chỉ ghi clipboard sau thao tác người dùng.
- Auto-fill chỉ chạy trong ChatGPT panel có marker và pending metadata còn hạn. Đọc draft clipboard, dùng URL `?q=` cho Chrome/Firefox; nếu composer vẫn trống thì fallback điền trực tiếp. Giữ draft có sẵn, không click Send/press Enter. Request q gửi draft đến ChatGPT khi panel tải; page text không qua Background/storage của Keepit.
- Khôi phục conversation chỉ lưu HTTPS origin + pathname `/c/<id>` đã validate; không lưu query, fragment, title hoặc chat text. Disclosure phải nêu rõ q-prefill và clipboard.
- Alt+Q/custom `sidebarShortcut` tiếp tục điều khiển Highlight; giữ label mới đồng bộ EN/VI/KO trong `LHN_LANGUAGES`.

## 5. Kiểm tra và xác minh

- Static: `for f in js/content/*.js; do node --check "$f" || exit; done`; kiểm tra manifest references và `git diff --check`.
- Focused VM: prompt prefix/cap, clipboard success/failure, marker gating, pending request, composer empty/non-empty; message/result không chứa page text và không gọi submit.
- Browser QA: Chrome/Firefox toggle, đăng nhập và frame policy; xác nhận draft chỉ điền trong panel, draft hiện có được giữ, fallback paste hoạt động và không gửi.
- Xác nhận scrollbar Chromium 3px/Firefox thin chỉ khi panel mở, được restore lúc đóng; regression Alt+Q, sidebar tabs, annotation và website-disabled.
- Ghi rõ browser nào đã chạy; static/VM không thay thế browser verification.
