# Shared — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

`shared` chứa tiện ích không sở hữu nghiệp vụ giao diện riêng: custom font, SVG icons, index search và site-icon resolver/cache. Các thuật toán search trong `js/translate/search.js` là module khác, không thuộc API `LHN_INDEX_SEARCH`.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/shared/custom-font.js`](../../js/shared/custom-font.js) | storage listener | Áp dụng font tùy chỉnh trên trang HTTP(S). |
| [`js/shared/icons.js`](../../js/shared/icons.js) | `LHN_ICONS.render` | Render SVG inline từ icon name và class. |
| [`js/shared/search.js`](../../js/shared/search.js) | `LHN_INDEX_SEARCH` | Normalize text, tạo index, search và debounce. |
| [`js/shared/site-icons.js`](../../js/shared/site-icons.js) | `LHN_SITE_ICONS.load` | Tìm icon website, cập nhật fallback và dùng cache persistent chung. |
| [`js/translate/search.js`](../../js/translate/search.js) | `LHN_SEARCH` | Search rank/highlight; chỉ dẫn ở đây để phân biệt hai API. |

## 3. Luồng chính

1. Manifest hoặc HTML entry nạp shared helper trước consumer tương ứng.
2. Custom-font đọc cài đặt và cập nhật khi storage đổi; chỉ áp dụng trên trang web phù hợp.
3. Consumer gọi `LHN_ICONS.render(name, className)` để tạo SVG, `LHN_INDEX_SEARCH.createIndex/search` để tái sử dụng dữ liệu đã normalize, hoặc `LHN_SITE_ICONS.load(image, pageUrl, options)` để gắn favicon.
4. Site-icon resolver chuẩn hóa website về HTTP(S) origin, ưu tiên `favIconUrl` do browser cung cấp cho tab cùng origin, rồi thử favicon SVG/Apple touch icon và fallback Google S2 128px; chỉ lưu ứng viên sau khi ảnh tải thành công.
5. Resolver dùng `browser.storage.local` làm cache chung giữa extension pages, TTL 30 ngày (6 giờ nếu không tìm thấy), tối đa 256 website; cache chỉ lưu origin và URL icon, không lưu path/query của trang. `storage.onChanged` đồng bộ cache giữa các context.
6. Mỗi consumer vẫn quyết định DOM/fallback/aria; shared chỉ quản lý nguồn ảnh, fallback và cache.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ tên và shape các global API (`LHN_ICONS`, `LHN_INDEX_SEARCH`); manifest/HTML phải nạp file trước consumer.
- `LHN_INDEX_SEARCH` là tiện ích index/normalize/debounce; không trộn `rank`/`highlightMatches` của `LHN_SEARCH` vào đây nếu chưa rà consumer.
- `LHN_SITE_ICONS.load` chỉ nhận HTTP(S), chỉ tạo ứng viên từ origin đã chuẩn hóa và Google S2 với `domain_url` chỉ chứa origin. Không gửi path/query trang tới dịch vụ ngoài.
- Cache site icons dùng riêng `keepit:site-icon-cache:v1`, kiểm tra lại URL đã lưu theo danh sách ứng viên, giới hạn số origin/TTL và fallback khi icon lỗi; không mở rộng host permissions.
- Icon name có fallback theo `LHN_CONFIG.ACTION_ICON_PATHS`/icon mặc định; không trả SVG với nội dung không được kiểm soát từ input người dùng.
- Custom font cần tôn trọng theme/font settings hiện có và không áp dụng lên trang không hỗ trợ.
- Các tiện ích phải giữ độc lập khỏi Dashboard/Content DOM để có thể dùng chéo context.

## 5. Kiểm tra và xác minh

- Static: `for f in js/shared/*.js; do node --check "$f" || exit; done`; kiểm tra `manifest.json`/HTML script order và `git diff --check`.
- Search: test normalize (hoa/thường, dấu Unicode, whitespace), index key, query rỗng/không match và debounce.
- Site icons: mock load/fail, fallback, URL chỉ chứa origin, storage cache chung giữa hai context, TTL/LRU và cache invalidation; xác nhận trên trang thật khi browser-test.
- SVG/font: kiểm tra icon tồn tại/fallback, SVG render hợp lệ, font auto/custom và cập nhật khi storage đổi trên một trang thật.
