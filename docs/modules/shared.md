# Shared — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Shared chứa helper giao diện/dữ liệu dùng ở nhiều bề mặt: font tùy chỉnh trên trang, SVG icon, tìm kiếm có chỉ mục, favicon cache và thumbnail. Code AI panel đã chuyển sang module [Ask AI](ask-ai.md).

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/shared/custom-font.js`](../../js/shared/custom-font.js) | IIFE trên trang http(s) | Áp font người dùng chọn qua thẻ `style#custom-font-style`, tôn trọng website bị tắt. |
| [`js/shared/icons.js`](../../js/shared/icons.js) | `LHN_ICONS.render` | SVG Lucide path; ưu tiên `LHN_CONFIG.ACTION_ICON_PATHS`. |
| [`js/shared/search.js`](../../js/shared/search.js) | `LHN_INDEX_SEARCH` | `normalize`, `createIndex`, `search`, `debounce`. |
| [`js/shared/site-icons.js`](../../js/shared/site-icons.js) | `LHN_SITE_ICONS.load` | Favicon theo origin với cache `storage.local` và TTL. |
| [`js/shared/thumbnails.js`](../../js/shared/thumbnails.js) | `LHN_THUMBNAILS` | YouTube/source thumbnail URL, fallback SVG, image loading. |
| [`js/shared/sheet-kit.js`](../../js/shared/sheet-kit.js) | `LHN_SHEET.attach(el,o)` / `sync()` / `locked()` / `detach(el)` | (v3.5.161) Hành vi chung của mọi sheet/popover Keepit: khóa cuộn trang, kéo/vuốt đóng (kéo xuống là đóng hẳn), bước half→full chỉ khi kéo lên; v3.5.175: `grow.mid()` + `grow.collapse()` (☰) = từ mức hết kéo xuống về mức giữa, kéo tiếp mới đóng. Nạp `document_start` cùng `touch-ui.js`, dùng chung isolated world cho overlay, Reader, content.js. |

## 3. Luồng chính

1. Manifest nạp `custom-font.js` sớm cho mọi frame http(s); script đọc settings font/website và cập nhật khi storage đổi.
2. Content, Dashboard, Popup và panel shell nạp helper cần dùng qua `<script>` hoặc `content_scripts`.
3. `site-icons.js` thử candidate favicon theo origin, lưu kết quả dương/âm vào cache rồi trả URL cho UI.
4. `thumbnails.js` dựng URL thumbnail an toàn và gắn fallback khi ảnh lỗi.
5. `search.js` chuẩn hóa chữ (bỏ dấu, chữ thường), tạo chỉ mục một lần và debounce khi gõ.

## 4. Hợp đồng và quy tắc cần giữ

- Script thường, không dùng `export`; mỗi file đăng ký đúng một global `LHN_*` (custom-font không đăng ký global).
- `custom-font.js` không áp font khi website bị tắt hoặc chọn `auto`; gỡ stylesheet font khi tắt.
- Favicon cache có giới hạn số mục và TTL; không gửi dữ liệu trang ngoài URL origin cần tra icon.
- `thumbnails.js` chỉ nhận URL an toàn; ID YouTube phải khớp mẫu hợp lệ. Riêng `load` nhận thêm URL nội bộ của chính extension (ảnh đóng gói như `assets/images/web-thumbnail-lofi.webp`, cần có trong `web_accessible_resources`); `safeUrl` dùng lọc dữ liệu đã lưu thì không nhận.
- `site-icons.js` chỉ thử favicon trên chính origin của trang; không dùng dịch vụ favicon bên thứ ba.
- Thứ tự nạp: `site-icons.js`/`thumbnails.js` phải có trước consumer trong manifest và trang HTML.

- `sheet-kit.js` (v3.5.161): `attach(el, {isOpen(), close(), watch?, drag?:false, scroller?(), onDrag?(on), grow?:{isFull(), cap(), setH(px|null), release(expand), collapse(), half?()}})` — gọi lại `attach` cùng phần tử chỉ cập nhật tùy chọn. MutationObserver trên `watch` (class/hidden/style/open) gọi `sync()`; chỉ khi có sheet mở mới gắn listener cửa sổ (touch capture, wheel non-passive bỏ qua `ctrlKey`, phím cuộn ngoài ô nhập) + poll 600ms. Quyết định **một lần mỗi cử chỉ** khi đi ≥6px: ngang → native nếu trên range/ô nhập/vùng cuộn ngang còn chỗ; xuống → native nếu có vùng cuộn trong chuỗi đang `scrollTop>0`, không thì kéo sheet; lên → lớn lên (nếu chưa full) rồi cuộn nội dung liền một cử chỉ, hết chỗ thì giãn nhẹ; ngoài sheet → chặn (trang đứng yên). Thả (từ v3.5.163 mọi sheet, kể cả sheet hai bước đang full — không còn dừng ở half, `grow.collapse` không dùng): đóng khi kéo > `min(110px,30%)` hoặc vuốt nhanh (>0.6px/ms và >24px), còn lại bật về. `translate`/`transition` inline đặt `!important` (thắng animation `fill:both` của sheet content.js). Click ngay sau khi kéo bị bỏ 90ms. Không dùng `overflow:hidden` trên html (giật layout desktop).

## 5. Kiểm tra và xác minh

- Đã chạy: `node --check` cho các file shared trong đợt chuyển Ask AI (không đổi logic shared).
- Đề xuất: mở Dashboard/Popup/Sidebar xác nhận favicon, thumbnail, tìm kiếm và font tùy chỉnh trên Chromium/Firefox.
