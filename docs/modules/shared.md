# Shared — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

`shared` chứa tiện ích UI không sở hữu nghiệp vụ riêng, hiện gồm custom font, SVG icons và index search dùng lại ở nhiều trang. Các thuật toán search trong `js/translate/search.js` là module khác, không thuộc API `LHN_INDEX_SEARCH`.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/shared/custom-font.js`](../../js/shared/custom-font.js) | storage listener | Áp dụng font tùy chỉnh trên trang HTTP(S). |
| [`js/shared/icons.js`](../../js/shared/icons.js) | `LHN_ICONS.render` | Render SVG inline từ icon name và class. |
| [`js/shared/search.js`](../../js/shared/search.js) | `LHN_INDEX_SEARCH` | Normalize text, tạo index, search và debounce. |
| [`js/translate/search.js`](../../js/translate/search.js) | `LHN_SEARCH` | Search rank/highlight; chỉ dẫn ở đây để phân biệt hai API. |

## 3. Luồng chính

1. Manifest hoặc HTML entry nạp shared helper trước consumer tương ứng.
2. Custom-font đọc cài đặt và cập nhật khi storage đổi; chỉ áp dụng trên trang web phù hợp.
3. Consumer gọi `LHN_ICONS.render(name, className)` để tạo SVG, hoặc `LHN_INDEX_SEARCH.createIndex/search` để tái sử dụng dữ liệu đã normalize.
4. Index search nhận item, extractor fields và key; kết quả giữ item/key để UI render đúng record. Debounce dành cho input liên tục.
5. Mỗi consumer vẫn quyết định DOM, aria-label và trạng thái UI; shared chỉ cung cấp helper thuần.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ tên và shape các global API (`LHN_ICONS`, `LHN_INDEX_SEARCH`); manifest/HTML phải nạp file trước consumer.
- `LHN_INDEX_SEARCH` là tiện ích index/normalize/debounce; không trộn `rank`/`highlightMatches` của `LHN_SEARCH` vào đây nếu chưa rà consumer.
- Icon name có fallback theo `LHN_CONFIG.ACTION_ICON_PATHS`/icon mặc định; không trả SVG với nội dung không được kiểm soát từ input người dùng.
- Custom font cần tôn trọng theme/font settings hiện có và không áp dụng lên trang không hỗ trợ.
- Các tiện ích phải giữ độc lập khỏi Dashboard/Content DOM để có thể dùng chéo context.

## 5. Kiểm tra và xác minh

- Static: `for f in js/shared/*.js; do node --check "$f" || exit; done`; kiểm tra `manifest.json`/HTML script order và `git diff --check`.
- Search: test normalize (hoa/thường, dấu Unicode, whitespace), index key, query rỗng/không match và debounce.
- Icons/fonts: kiểm tra icon tồn tại/fallback, SVG render hợp lệ, font auto/custom và cập nhật khi storage đổi trên một trang thật.
