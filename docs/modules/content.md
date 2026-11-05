# Content — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Content scripts chạy trên trang web: highlight, note, sidebar trang, selection toolbar và phục hồi annotation. Script chạy trong trang ChatGPT/Gemini/Claude đã chuyển sang [Ask AI](ask-ai.md); Content chỉ gửi yêu cầu mở AI panel và hiện toast kết quả.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Thứ tự nạp trên `<all_urls>`. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings trang, selection, sidebar, runtime messages, Hỏi AI. |
| [`js/content/web-highlighter.js`](../../js/content/web-highlighter.js) | `LHNWebHighlighter.create` | Tạo/gỡ mark trên DOM. |
| [`js/content/annotation-restore.js`](../../js/content/annotation-restore.js) | `LHN_ANNOTATION_RESTORE` | Tìm lại đoạn đã lưu khi trang đổi. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Shell sidebar trang, tab Highlight và nút mở AI panel. |
| [`js/content/note-composer.js`](../../js/content/note-composer.js) | `LHN_NOTE_COMPOSER` | Dựng record annotation từ field cho phép. |
| [`js/content/sentence-note.js`](../../js/content/sentence-note.js) | `LHN_SENTENCE_NOTE` | Lấy ngữ cảnh câu quanh selection. |
| [`js/content/page-layout.js`](../../js/content/page-layout.js) | `LHN_PAGE_LAYOUT` | Snapshot/khôi phục layout khi mở sidebar. |
| [`js/content/ui-components.js`](../../js/content/ui-components.js) | `LHN_UI_COMPONENTS` | Tag editor dùng chung. |

## 3. Luồng chính

1. Manifest nạp core, helper content rồi `content.js`; controller chặn nạp lặp bằng cờ trên `window`.
2. Selection tạo highlight/note qua `web-highlighter.js` và `note-composer.js`, rồi gửi `ADD`/`UPDATE` tới Background.
3. Khi tải trang hoặc nhận `ANNOTATIONS_CHANGED`/`RESTORE_HIGHLIGHTS`, `annotation-restore.js` tìm lại vị trí và vẽ lại mark.
4. Sidebar trang hiển thị danh sách, tìm kiếm và bộ lọc; `page-layout.js` giữ layout trang khi sidebar mở.
5. Hỏi AI gửi `OPEN_AI_PANEL` với selection tường minh; `AI_PANEL_*`/`AI_LINK_PANEL_*` từ Background chỉ hiện toast, chỉnh scrollbar hoặc đổi nút cạnh trang sang chế độ AI (Chromium, khi AI panel mở và sidebar Highlight đóng; bấm gửi `TOGGLE_AI_PANEL`).

## 4. Hợp đồng và quy tắc cần giữ

- Không đọc page body/title cho AI; Hỏi AI chỉ gửi selection người dùng chọn và URL hiện tại.
- Record annotation chỉ chứa field trong `PERSISTED_FIELDS` của `note-composer.js`.
- Website bị tắt thì không restore highlight và không áp UI trang.
- Message từ Background phải kiểm tra `type` trước khi xử lý; không thực thi nội dung từ page.
- Giữ selector/class `lhn-*` để CSS content và sidebar không vỡ.

## 5. Kiểm tra và xác minh

- Đã chạy: `node --check` cho các file content trong đợt chuyển Ask AI (logic content không đổi).
- Đề xuất: tạo/sửa/xóa highlight, restore sau reload, sidebar trang, Hỏi AI và toast trên Chromium/Firefox.
