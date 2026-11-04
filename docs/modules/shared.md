# Shared — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

`shared` cung cấp tiện ích dùng chéo context: custom font, SVG, index search, site icons, thumbnails, ChatGPT panel và định dạng prompt ChatGPT dùng chung cho background/content. `js/translate/search.js` là API khác, không thuộc `LHN_INDEX_SEARCH`.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/shared/custom-font.js`](../../js/shared/custom-font.js) | storage listener | Áp dụng font tùy chỉnh trên HTTP(S). |
| [`js/shared/icons.js`](../../js/shared/icons.js) | `LHN_ICONS.render` | Render SVG theo icon name. |
| [`js/shared/search.js`](../../js/shared/search.js) | `LHN_INDEX_SEARCH` | Normalize, index và search. |
| [`js/shared/site-icons.js`](../../js/shared/site-icons.js) | `LHN_SITE_ICONS.load` | Favicon resolver và cache local. |
| [`js/shared/thumbnails.js`](../../js/shared/thumbnails.js) | `LHN_THUMBNAILS` | YouTube/page thumbnail và fallback. |
| [`js/shared/chatgpt-panel.js`](../../js/shared/chatgpt-panel.js) | `openPanelPage`, navigation/close listeners | Restore/reopen validated URL, bảo vệ composer draft và fallback tự đóng Chromium panel. |
| [`js/shared/chatgpt-prompt-format.js`](../../js/shared/chatgpt-prompt-format.js) | `LHN_CHATGPT_PROMPT_FORMAT` | Tạo một chuỗi hai bullet cho `?q=` và dựng cùng chuỗi thành text/`<br>` trong composer cho draft hoặc manual-send fallback. |
| [`js/shared/chatgpt-ai-toolbar.js`](../../js/shared/chatgpt-ai-toolbar.js) | `LHN_CHATGPT_AI_TOOLBAR.create` | Thanh URL nguồn ghim và provider tabs ChatGPT/Gemini/Claude/Grok; providers chưa nối được phủ thành panel trống. |

## 3. Luồng chính

1. Manifest/HTML nạp helper trước consumer tương ứng.
2. Consumer dùng `LHN_ICONS`, `LHN_INDEX_SEARCH`, `LHN_SITE_ICONS` hoặc `LHN_THUMBNAILS`; API giữ logic độc lập với UI cụ thể.
3. Site icon resolver chuẩn hóa về HTTP(S) origin, thử favicon site rồi fallback, chỉ cache sau khi ảnh tải thành công.
4. Thumbnail helper chuẩn hóa source URL, thử ảnh chính rồi fallback; consumer quyết định DOM state và aria.
5. Extension page gọi `chatgpt-panel.js`, xử lý navigation request URL đã validate hoặc restore last conversation; Chrome đặt iframe `src`, Firefox dùng `location.replace`.
6. Navigation mới hỏi composer state, lưu draft theo source URL rồi điều hướng; cùng mapped conversation chỉ fast-path/no-reload khi source URL cũng là nguồn đang hiển thị. Source URL khác luôn reload ChatGPT kể cả khi cùng `/c/<id>`, để draft đích được restore riêng. Marker fragment nhận diện panel/request/source. Với Chromium chưa có `sidePanel.close()`, helper chỉ đóng panel cùng window khi Background gửi close request; route mới được map theo exact source URL.
7. ChatGPT content script gắn toolbar shadow DOM với liên kết trang nguồn và bốn provider tabs; lựa chọn provider ngoài ChatGPT hiển thị blank overlay, không mở mạng/provider ngoài.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ tên/shape các global API; manifest và HTML phải nạp helper trước consumer.
- Không trộn `LHN_SEARCH` rank/highlight với `LHN_INDEX_SEARCH` nếu chưa rà consumers.
- `LHN_SITE_ICONS` chỉ dùng origin và cache riêng; không gửi path/query của trang tới dịch vụ favicon.
- `LHN_THUMBNAILS` là nơi duy nhất tạo URL thumbnail YouTube; giữ fallback/error order.
- Chỉ mở HTTPS URL trên ChatGPT hosts đã allowlist; `/c/<id>` route được validate cho map, root URL dùng cho request mới hoặc empty-state mặc định. Không chấp nhận arbitrary path/host.
- Navigation request có expiry và request ID; link prompt ID gắn trong fragment, không gửi trong HTTP request. Draft được lưu local theo source URL; nếu composer state không thể xác nhận thì không điều hướng để tránh mất dữ liệu.
- Fallback close chỉ chạy trong trang Chromium side panel, đối chiếu `windowId` với `windows.getCurrent()` rồi mới gọi `window.close()`; không đóng panel ở cửa sổ khác.
- Mapping exact source URL → conversation route lưu local. Request mới không mang page body/title; helper không đọc composer DOM trực tiếp mà dùng postMessage guard, kiểm tra ChatGPT-origin và iframe source; content script chỉ trả lời yêu cầu từ extension origin.
- Giữ helper độc lập khỏi Dashboard/Content DOM và không thêm host permission mới cho shared utilities.
- Prompt URL mới phải qua `LHN_CHATGPT_PROMPT_FORMAT.formatLinkPrompt`; toolbar chỉ nhận HTTP(S) source URL, link mở tab mới, provider tabs ngoài ChatGPT không điều hướng tới website nào; draft và nhánh gửi dự phòng dùng `insertMultilineComposerText`/cùng đường `insertDraft`, giữ cùng thứ tự URL rồi instruction và một newline.

## 5. Kiểm tra và xác minh

- Static: `for f in js/shared/*.js; do node --check "$f" || exit; done`; kiểm tra `manifest.json`/HTML script order và `git diff --check`.
- Site icons: mock load/fail, fallback, origin-only URL, cache TTL và invalidation.
- Thumbnails: YouTube URL/ID, SVG fallback, load/error retry và consumer callbacks.
- v3.5.61 panel VM: root/link marker, navigation cleanup và ChatGPT-origin/source draft guard — PASS. v3.5.63 fallback mock PASS: chỉ đóng Chromium panel nếu window ID trùng; browser QA Chrome/Firefox chưa chạy.
- v3.5.83 focused regression VM: source URL khác nhưng route giống nhau buộc panel reload; same-source mapped reopen giữ iframe; Firefox thay source marker rồi reload top-level. Browser QA remains pending.
- SVG/font: icon fallback, render hợp lệ, font setting và storage update. Static/mock không thay thế kiểm thử trang thật.
