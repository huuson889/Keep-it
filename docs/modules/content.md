# Content — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Content scripts cung cấp UI và hành vi trên website: selection, highlight, note, Reader và ChatGPT panel. `content.js` điều phối giao diện; annotation CRUD thuộc Background.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | URL, frame, thứ tự và thời điểm nạp. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings, selection, UI và message listeners. |
| [`js/content/chatgpt-context.js`](../../js/content/chatgpt-context.js) | `LHN_CHATGPT_CONTEXT.create` | Legacy body-text/clipboard; launcher hiện không gọi. |
| [`js/content/chatgpt-link-marker.js`](../../js/content/chatgpt-link-marker.js) | document-start `capture` | Giữ panel/request/source marker trước ChatGPT fragment rewrite. |
| [`js/content/chatgpt-autofill.js`](../../js/content/chatgpt-autofill.js) | request/route listeners | `?q=`, follow-up, mapping, route metadata và toolbar; không lưu composer draft. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Sidebar tabs và controls. |

## 3. Luồng chính

1. Manifest nạp factories trước controller; controller đọc settings rồi gắn selection, sidebar và UI listeners.
2. Alt+X gửi intent summary; Hỏi AI gửi đúng `range.toString()` hiện tại. Background tra exact URL mapping và cấp request ID; không truyền body/title.
3. URL mới tạo prompt hai bullet với URL ở dòng đầu. Auto-send dùng ChatGPT `?q=` và giữ native-submit/duplicate guard; khi tắt, prompt được chèn vào composer đang mở, không `?q=`, và chờ manual send để tạo mapping.
4. URL đã map: Alt+X chỉ mở conversation. Hỏi AI thay prompt bằng selection hiện tại + câu kết tùy chỉnh, không kèm URL; auto-send tắt thì để unsent trong composer.
5. Firefox top-level sidebar xử lý navigation request và route; Chromium iframe host chuyển source context. Pending link chỉ chạy khi source URL của request khớp source đang hiển thị. Context switch không khôi phục composer text.
6. Conversation route watcher gửi route sạch cho panel/session metadata và cập nhật toolbar nguồn. Document-start marker lưu request ID, không lưu selection/prompt vào session.

## 4. Hợp đồng và quy tắc cần giữ

- Hỏi AI là selection-only; không gọi `LHN_CHATGPT_CONTEXT`, không trích body/title và không đọc clipboard.
- Giữ prompt defaults EN/VI/KO, newline thật, settings auto-send và exact source URL → conversation mapping.
- Pending prompt/selection là dữ liệu thao tác theo request; không phải draft lưu trữ. Source khác, panel close/cancel, hoàn tất hoặc expiry phải dừng/xóa request phù hợp.
- Không lưu/restore per-source composer text, không có navigation guard bảo vệ draft và không dùng global last-conversation URL.
- Mapped follow-up chỉ thay/gửi khi exact conversation route khớp. Manual-send first-use mới tạo mapping; tab/source switch không tự prompt.
- Route metadata báo cáo về panel chỉ gồm URL nguồn và ChatGPT origin/path; query/hash/prompt/composer text bị loại khỏi route.
- Giữ `Alt+Q`/`sidebarShortcut`, right-click selection menu trên Chromium/Firefox và toolbar/provider tabs hiện có.

## 5. Kiểm tra và xác minh

- Đã chạy `node --check` cho toàn bộ first-party JavaScript; marker VM xác nhận request ID và source được giữ, q prompt không bị nhân bản vào sessionStorage, và content không còn page-draft save/restore/guard — PASS.
- Background/link focused VMs xác nhận `?q=`/manual-send, mapped selection-only route, pending source guard, debounce và close cancellation — PASS.
- Browser QA Chrome/Firefox chưa chạy. Cần xác nhận composer controls/linkification, q native-send/duplicate prevention, manual mapping, mapped follow-up, context-menu và source switch thật.
