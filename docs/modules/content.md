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
3. Alt+X/launcher gửi `OPEN_CHATGPT_LINK_PANEL` với intent summary; icon Hỏi AI gửi đúng `range.toString()` đang chọn cùng intent riêng. Background đọc exact URL tab nguồn, lookup exact URL → conversation mapping và cấp request ID; không lấy page body/title.
4. Với URL mới, Background đặt `- Website: <URL>\n- Hãy tóm tắt bài viết này` (Alt+X) hoặc `- Website: <URL>\n- "<selected text>" có nghĩa là gì?` (icon) vào ChatGPT `?q=`. Marker `document_start` giữ panel/request ID trước fragment rewrite. ChatGPT có thể native-submit; nếu q-prefill vẫn còn trong composer, content script xác nhận exact prompt rồi bấm Send một lần.
5. Với URL đã map, Alt+X chỉ mở hội thoại, không gửi prompt. Icon Hỏi AI mở đúng `/c/<id>` rồi gửi `"<selected text>" có nghĩa là gì?` không kèm URL, chỉ sau khi xác nhận route và composer trống; request-scoped script điền đúng câu hỏi và bấm Send một lần. Draft khác luôn được giữ.
6. `/c/<id>` được map với exact source URL; URL khác tạo chat mới, không tái sử dụng hội thoại.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp manifest và payload/message types hiện hành; annotation tiếp tục lưu qua Background.
- Thanh icon dịch lấy `translateIconStyle` từ settings đã resolve (`1` compact text, `2` icon-only, `3` micro hover; mặc định `3`), áp dụng theme theo `sidebarTheme`; thay kiểu chỉ đổi UI, không đổi ba action hiện có.
- Không cho shortcut chặn nhập liệu; loại extension UI khỏi annotation restore và text capture.
- Alt+X first-use prompt là `- Website: <exact URL>\n- Hãy tóm tắt bài viết này`; icon Hỏi AI first-use prompt là `- Website: <exact URL>\n- "<selected text>" có nghĩa là gì?`. Chỉ icon Hỏi AI lấy đoạn selection hiện tại; không gọi `LHN_CHATGPT_CONTEXT`, không trích body/title và không dùng clipboard.
- Cùng URL lần sau, Alt+X chỉ reopen mapping; icon Hỏi AI gửi `"<selected text>" có nghĩa là gì?` vào exact mapped `/c/<id>` (không URL) qua request-scoped guarded composer send. Không thay draft; chỉ gửi từ composer trống và kiểm tra lại request/prompt trước click.
- Với URL mới, marker chạy `document_start`, giữ request ID và exact q trước fragment rewrite. Chỉ pending request hiện hành với prompt q khớp mới được xử lý; nhận diện q native-send để tránh gửi trùng.
- Lưu exact URL → validated HTTPS conversation `/c/<id>` local; URL khác không tái sử dụng chat. Pending hết hạn/stale không được gửi; short-lived follow-up metadata có thể chứa selected text/prompt tới khi hoàn tất/hết hạn. Giữ legacy body/clipboard code tách khỏi launcher.
- Alt+Q/`sidebarShortcut` tiếp tục điều khiển Highlight; giữ label EN/VI/KO.

## 5. Kiểm tra và xác minh

- Focused VM PASS: exact newline `?q=` prompts (summary and Ask AI); first-use/new mapping, same-URL Alt+X reopen with no prompt, same-URL selected-text follow-up; document-start marker captures a new request ID on hash-only navigation and hash/popstate retries pending processing; exact mapped-route guard; follow-up sent once; existing composer draft preserved; wrong route untouched; q native-send avoids duplicate; Ask AI keeps/opens Chrome/Firefox panel while Alt+X retains toggle.
- Static/build PASS: first-party JS syntax, manifest/version/no-debugger, `git diff --check`; Chrome/Firefox ZIPs 122 files each, v3.5.68 manifest and prompt/action checks, Firefox Chrome-only keys removed.
- Browser QA Chrome/Firefox chưa chạy: xác nhận ChatGPT thật xử lý q/newlines, composer/send và follow-up vào hội thoại hiện có, login/frame, mapping, draft guard, panel toggle/open và Alt+Q regression.
- Cũng cần xác nhận scrollbar panel, Alt+Q, sidebar tabs, annotation và website-disabled trên trình duyệt thật; static/VM không thay thế browser QA.
