# Content — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Content scripts gắn Keepit vào website: highlight, note, dịch, sidebar, shortcut, Reader và ChatGPT panel. `content.js` điều phối giao diện; annotation CRUD thuộc Background.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | URL, frame, thứ tự và thời điểm nạp. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings, selection, UI và message listeners. |
| [`js/content/chatgpt-context.js`](../../js/content/chatgpt-context.js) | `LHN_CHATGPT_CONTEXT.create` | Legacy body-text/clipboard; launcher hiện không gọi. |
| [`js/content/chatgpt-link-marker.js`](../../js/content/chatgpt-link-marker.js) | document-start marker capture | Giữ panel/request ID qua fragment rewrite. |
| [`js/content/chatgpt-autofill.js`](../../js/content/chatgpt-autofill.js) | pending link, panel navigation, route watcher | Xử lý `?q=`, draft guard và conversation mapping. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Sidebar tabs và controls. |
| [`js/content/web-highlighter.js`](../../js/content/web-highlighter.js) | `LHNWebHighlighter.create` | Tạo/khôi phục highlights. |
| [`js/content/annotation-restore.js`](../../js/content/annotation-restore.js) | `LHN_ANNOTATION_RESTORE.create` | Khôi phục text/range trên trang động. |
| [`js/content/note-composer.js`](../../js/content/note-composer.js) | `LHN_NOTE_COMPOSER` | Form và chuẩn hóa annotation. |

## 3. Luồng chính

1. Manifest nạp factories trước controller; controller đọc settings rồi gắn selection, sidebar và UI listeners.
2. Note/annotation CRUD gửi qua `LHN_MESSAGING`; khi trang đổi, restore/highlighter dựng lại marks. Reader và YouTube chuyển action qua custom events tới Overlay.
3. ChatGPT launcher/`Alt+X` gửi `OPEN_CHATGPT_LINK_PANEL`; Background lấy exact URL tab nguồn và dựng prompt URL-only trong ChatGPT `?q=`. Marker `document_start` giữ panel/request ID trước khi ChatGPT có thể xóa fragment.
4. `chatgpt-autofill.js` đối chiếu pending request với q/ID. ChatGPT có thể native-submit; nếu exact prompt vẫn trong composer, content script xác nhận rồi bấm Send một lần. Composer rỗng không bị tự điền; draft khác được giữ.
5. `/c/<id>` được map với exact source URL; URL đã map chỉ mở lại hội thoại, URL khác tạo request mới.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp manifest và payload/message types hiện hành; annotation tiếp tục lưu qua Background.
- Không cho shortcut chặn nhập liệu; loại extension UI khỏi annotation restore và text capture.
- Prompt chỉ là `Hãy tóm tắt bài sau: ` + exact current URL. Luồng này không gọi `LHN_CHATGPT_CONTEXT`, không gửi body/title và không dùng clipboard.
- Marker chạy `document_start`; lưu request ID và exact q trước fragment rewrite. Chỉ pending request hiện hành với prompt q khớp chính xác mới được xử lý.
- Nhận diện q native-send để tránh duplicate; chỉ click Send nếu composer còn exact prompt. Không gõ vào composer rỗng; draft khác không bị thay/gửi, và draft có trước navigation sẽ chặn navigation.
- Lưu exact URL → validated HTTPS conversation `/c/<id>` local; cùng URL reopen, URL khác không tái sử dụng chat. Pending hết hạn/stale không được gửi. Giữ legacy body/clipboard code tách khỏi launcher.
- Alt+Q/`sidebarShortcut` tiếp tục điều khiển Highlight; giữ label EN/VI/KO.

## 5. Kiểm tra và xác minh

- Focused VM PASS: exact `?q=` + marker capture; native-send không duplicate; composer exact gửi một lần; draft khác được giữ; q rỗng fail-safe; stale request bị bỏ qua. Background mapping PASS: URL đầu tạo q, URL trùng reopen mapping, URL khác tạo request mới.
- Static PASS: `node --check` first-party JS, Python compile, manifest/version/references, no-debugger, cấu trúc/độ dài tài liệu và `git diff --check`.
- Browser QA Chrome/Firefox chưa chạy: xác nhận ChatGPT thực tế xử lý `?q=`, composer/send, login/frame, mapping, draft guard và panel toggle.
- Cũng cần xác nhận scrollbar panel, Alt+Q, sidebar tabs, annotation và website-disabled trên trình duyệt thật; static/VM không thay thế browser QA.
