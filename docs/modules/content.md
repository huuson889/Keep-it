# Content — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

Content scripts gắn Keepit vào website: highlight, note, dịch, Sidebar, shortcut và reader/overlay entry. `content.js` điều phối UI; helper/factory giữ logic độc lập; annotation được sở hữu bởi Background.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Nạp dependency và content entry theo thứ tự. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings, selection, UI, annotations và event listeners. |
| [`js/content/chatgpt-context.js`](../../js/content/chatgpt-context.js) | `LHN_CHATGPT_CONTEXT.create` | Trích nội dung chính, ghép prompt và ghi clipboard. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Dựng Sidebar, tabs, cards và controls. |
| [`js/content/web-highlighter.js`](../../js/content/web-highlighter.js) | `LHNWebHighlighter.create` | Tô/khôi phục highlight và gắn event vào mark. |
| [`js/content/annotation-restore.js`](../../js/content/annotation-restore.js) | `LHN_ANNOTATION_RESTORE.create` | Tìm lại text/range trên trang động. |
| [`js/content/note-composer.js`](../../js/content/note-composer.js) | `LHN_NOTE_COMPOSER` | Dựng form và chuẩn hóa note record. |
| [`js/content/page-layout.js`](../../js/content/page-layout.js), [`js/content/sentence-note.js`](../../js/content/sentence-note.js) | `LHN_PAGE_LAYOUT`, `LHN_SENTENCE_NOTE` | Layout trang và sentence context. |

## 3. Luồng chính

1. Manifest nạp factory/module trước `content.js`; controller chống khởi tạo lặp trên cùng document.
2. Controller đọc settings từ `LHN_SETTINGS`/`browser.storage.local`, rồi kết nối selection, helper và UI listeners.
3. Annotation được tạo bởi `LHN_NOTE_COMPOSER`, gửi `ADD`/`UPDATE`/`DELETE` qua `LHN_MESSAGING`; khi trang đổi, `LHN_ANNOTATION_RESTORE` và `LHNWebHighlighter` khôi phục mark.
4. Reader/YouTube chuyển action qua custom events; overlay xử lý phần video/Study.
5. Tab ChatGPT trong page Sidebar và extension command `Alt+X` mở browser-native panel. Content trích nội dung, ghi prompt + page text vào clipboard; Background mở Chrome `sidePanel` hoặc Firefox `sidebarAction`. Người dùng tự Ctrl+V; không auto-send.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp manifest: dependency `LHN_*` phải tồn tại trước khi controller dùng.
- Annotation CRUD tiếp tục qua Background; giữ payload `item`, `id`, `url`, `origin` và các loại message.
- Giữ helper/factory theo ranh giới; không nhân bản restore, note composer hoặc layout logic vào controller.
- Shortcut không chặn nhập liệu; khi sửa key listener phải giữ guard input/contenteditable và các event Reader/overlay.
- UI của extension không được tự trở thành nguồn annotation/selection; loại vùng UI khỏi khôi phục và capture text.
- `LHN_CHATGPT_CONTEXT` dùng Readability rồi fallback cleaned body, giới hạn page text 40.000 ký tự; chỉ chép prompt `Hãy tóm tắt nội dung ngắn gọn` + text vào clipboard sau hành động người dùng. Không đưa page text qua Background/storage, không tự paste/submit.
- ChatGPT tab là launcher tới panel riêng; Alt+Q/custom `sidebarShortcut` vẫn mở Highlight. Label/hướng dẫn mới phải có EN/VI/KO trong `LHN_LANGUAGES`.

## 5. Kiểm tra và xác minh

- Static: `for f in js/content/*.js; do node --check "$f" || exit; done`; kiểm tra manifest references và `git diff --check`.
- Focused VM: Readability/fallback, prompt prefix, cap 40.000 ký tự, clipboard success/failure; xác nhận message mở panel không mang page text.
- Browser QA pending: Chrome 116+ và Firefox; Alt+X/tab mở native panel, clipboard + Ctrl+V để thành draft, không gửi; thử trang dài/trống, copy/API fail và đăng nhập ChatGPT. Chrome iframe/DNR/frame policy cần xác minh thực tế.
- Regression: Alt+Q/custom shortcut, page-sidebar tab/controls/footer, annotation CRUD/restore, selection UI và website-disabled trên DOM/input/iframe biến động.
- Ghi rõ browser nào đã chạy; static/VM check không thay thế browser verification.
