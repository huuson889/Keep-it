# Shared — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

`shared` cung cấp tiện ích dùng chéo context: custom font, SVG, index search, site icons, thumbnails và bootstrap ChatGPT panel. `js/translate/search.js` là API khác, không thuộc `LHN_INDEX_SEARCH`.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/shared/custom-font.js`](../../js/shared/custom-font.js) | storage listener | Áp dụng font tùy chỉnh trên HTTP(S). |
| [`js/shared/icons.js`](../../js/shared/icons.js) | `LHN_ICONS.render` | Render SVG theo icon name. |
| [`js/shared/search.js`](../../js/shared/search.js) | `LHN_INDEX_SEARCH` | Normalize, index và search. |
| [`js/shared/site-icons.js`](../../js/shared/site-icons.js) | `LHN_SITE_ICONS.load` | Favicon resolver và cache local. |
| [`js/shared/thumbnails.js`](../../js/shared/thumbnails.js) | `LHN_THUMBNAILS` | YouTube/page thumbnail và fallback. |
| [`js/shared/chatgpt-panel.js`](../../js/shared/chatgpt-panel.js) | `openPanelPage` | Restore URL conversation cho Chrome/Firefox panel. |

## 3. Luồng chính

1. Manifest/HTML nạp helper trước consumer tương ứng.
2. Consumer dùng `LHN_ICONS`, `LHN_INDEX_SEARCH`, `LHN_SITE_ICONS` hoặc `LHN_THUMBNAILS`; API giữ logic độc lập với UI cụ thể.
3. Site icon resolver chuẩn hóa về HTTP(S) origin, thử favicon site rồi fallback, chỉ cache sau khi ảnh tải thành công.
4. Thumbnail helper chuẩn hóa source URL, thử ảnh chính rồi fallback; consumer quyết định DOM state và aria.
5. Extension page gọi `chatgpt-panel.js`, đọc key conversation URL từ `browser.storage.local`, validate host/path rồi đặt iframe `src` (Chrome) hoặc `location.replace` (Firefox).
6. Panel content script lưu origin + pathname của route `/c/<id>`; bootstrap thêm marker fragment để nhận diện panel mà không gửi marker trong HTTP request.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ tên/shape các global API; manifest và HTML phải nạp helper trước consumer.
- Không trộn `LHN_SEARCH` rank/highlight với `LHN_INDEX_SEARCH` nếu chưa rà consumers.
- `LHN_SITE_ICONS` chỉ dùng origin và cache riêng; không gửi path/query của trang tới dịch vụ favicon.
- `LHN_THUMBNAILS` là nơi duy nhất tạo URL thumbnail YouTube; giữ fallback/error order.
- Chỉ restore ChatGPT URL HTTPS trên `chatgpt.com` hoặc `chat.openai.com` có segment `/c/<id>`; bỏ query/hash, title và nội dung chat.
- Route conversation chỉ lưu local để mở lại cùng chat; không lưu page text/prompt. URL được gửi tới ChatGPT chỉ khi browser tải route đã chọn.
- Giữ helper độc lập khỏi Dashboard/Content DOM và không thêm host permission mới cho shared utilities.

## 5. Kiểm tra và xác minh

- Static: `for f in js/shared/*.js; do node --check "$f" || exit; done`; kiểm tra `manifest.json`/HTML script order và `git diff --check`.
- Site icons: mock load/fail, fallback, origin-only URL, cache TTL và invalidation.
- Thumbnails: YouTube URL/ID, SVG fallback, load/error retry và consumer callbacks.
- ChatGPT panel: mock URL đúng/sai host, route `/c/<id>`, bỏ query/hash, default URL, marker fragment, iframe/redirect restore.
- SVG/font: icon fallback, render hợp lệ, font setting và storage update. Static/mock không thay thế kiểm thử trang thật.
