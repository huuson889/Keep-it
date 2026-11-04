# Content — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

Content scripts gắn Keepit vào website: highlight, note, dịch, sidebar, shortcut và reader/overlay entry. `content.js` điều phối giao diện; helper giữ logic độc lập; annotation thuộc Background.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Khai báo script theo URL, frame và thứ tự nạp. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings, selection, UI và message listeners. |
| [`js/content/chatgpt-context.js`](../../js/content/chatgpt-context.js) | `LHN_CHATGPT_CONTEXT.create` | Legacy body-text/clipboard workflow; link-only flow không gọi. |
| [`js/content/chatgpt-autofill.js`](../../js/content/chatgpt-autofill.js) | link pending, panel navigation, route watcher | Chỉ gửi prompt URL-only, bảo vệ draft, báo conversation route để lưu/reopen. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Sidebar, tabs và controls. |
| [`js/content/web-highlighter.js`](../../js/content/web-highlighter.js) | `LHNWebHighlighter.create` | Tạo và khôi phục highlight marks. |
| [`js/content/annotation-restore.js`](../../js/content/annotation-restore.js) | `LHN_ANNOTATION_RESTORE.create` | Tìm lại text/range trên trang động. |
| [`js/content/note-composer.js`](../../js/content/note-composer.js) | `LHN_NOTE_COMPOSER` | Dựng form và chuẩn hóa annotation. |

## 3. Luồng chính

1. Manifest nạp factories trước `content.js`; controller chống khởi tạo lặp trên document.
2. Controller đọc settings, rồi gắn selection, sidebar và UI listeners.
3. Annotation được tạo bởi `LHN_NOTE_COMPOSER`, gửi CRUD qua `LHN_MESSAGING`; khi trang đổi, restore/highlighter dựng lại mark.
4. Reader và YouTube chuyển action qua custom events; Overlay xử lý video/Study.
5. ChatGPT launcher/`Alt+X` gửi `OPEN_CHATGPT_LINK_PANEL`; Background lấy exact URL của tab nguồn và điều hướng panel tới ChatGPT. `chatgpt-context.js` body-text/clipboard path vẫn là legacy nhưng launcher mới không gọi.
6. Panel script xác nhận request ID, chỉ chèn `Hãy tóm tắt bài sau: [URL]` vào composer rỗng rồi click Send; nếu có draft khác thì báo lỗi, giữ nguyên và chặn điều hướng. Khi route `/c/<id>` xuất hiện, Background lưu exact source URL → conversation URL; cùng URL sau đó chỉ mở route đã lưu, URL khác tạo request mới.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp manifest để mọi global `LHN_*` tồn tại trước khi controller dùng.
- Annotation CRUD tiếp tục qua Background; giữ payload `item`, `id`, `url`, `origin` và message types hiện tại.
- Shortcut không chặn nhập liệu; giữ guard cho input/contenteditable và event Reader/Overlay.
- Loại extension UI khỏi annotation restore và capture text; không biến UI thành nguồn annotation/selection.
- Luồng v3.5.61 không gọi `LHN_CHATGPT_CONTEXT`, không trích page body/title và không dùng clipboard; prompt chỉ có `Hãy tóm tắt bài sau: ` + exact current URL.
- Auto-send chỉ chạy trong ChatGPT panel có marker và pending request ID khớp; chỉ chèn prompt nếu composer rỗng, đánh dấu prompt do request tạo và xác nhận chính xác trước khi click Send. Mọi draft có sẵn—kể cả trùng chuỗi—không bị thay hoặc gửi; panel navigation được chặn nếu draft đã có trước đó.
- Exact source URL → validated HTTPS conversation `/c/<id>` mapping được lưu local. Cùng URL chỉ reopen mapping, khác URL không tái sử dụng chat; expired/stale pending không được gửi. Legacy clipboard/body path được giữ nhưng không gắn vào launcher hiện tại.
- Alt+Q/custom `sidebarShortcut` tiếp tục điều khiển Highlight; giữ label mới đồng bộ EN/VI/KO trong `LHN_LANGUAGES`.

## 5. Kiểm tra và xác minh

- Static: `for f in js/content/*.js; do node --check "$f" || exit; done`; kiểm tra manifest references và `git diff --check`.
- v3.5.61 VM đã chạy: exact URL-only prompt, single Send, no clipboard, different-link new-chat isolation, existing/identical draft protection và Firefox navigation guard — PASS.
- Browser QA Chrome/Firefox chưa chạy: xác nhận composer/send control thật, login/frame policy, route mapping và toggle.
- Xác nhận scrollbar Chromium 3px/Firefox thin chỉ khi panel mở, được restore lúc đóng; regression Alt+Q, sidebar tabs, annotation và website-disabled.
- Ghi rõ browser nào đã chạy; static/VM không thay thế browser verification.
