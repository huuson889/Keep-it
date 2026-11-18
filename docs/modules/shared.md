# Shared — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Shared giữ UI/helper dùng nhiều bề mặt: selection toolbar, touch selection bridge, sheet behaviour, theme, font, search, favicon và thumbnail. Reader/Notes/AI chỉ dùng component chung, không dựng lại phiên bản riêng khi áp dụng demo vào app. Context tệp ở [documents](../documents.md).

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`selection-toolbar.js`](../../js/shared/selection-toolbar.js) | `LHN_SELECTION_TOOLBAR.build/installTouchSelectionBridge` | Một định nghĩa actions/style/logo và bridge Android selection. |
| [`selection-toolbar.css`](../../css/shared/selection-toolbar.css) | cờ layout/labels/collapsible | Kiểu toolbar dùng chung web, preview, Documents. |
| [`sheet-kit.js`](../../js/shared/sheet-kit.js) | `LHN_SHEET.attach/sync/locked/detach` | Khóa scroll, drag/grow/snap và scroll chaining trong sheet. |
| [`theme-tokens.js`](../../js/shared/theme-tokens.js) | `LHN_THEME` | Màu kính, scrollbar và CSS token chung. |
| [`custom-font.js`](../../js/shared/custom-font.js), [`icons.js`](../../js/shared/icons.js) | font setting, `LHN_ICONS` | Font web và icon. Không viết lại font file gốc. |
| [`search.js`](../../js/shared/search.js) | `LHN_INDEX_SEARCH`, `LHN_SEARCH` | Index/ranking/debounce/highlight. |
| [`site-icons.js`](../../js/shared/site-icons.js), [`site-brands.js`](../../js/shared/site-brands.js) | `LHN_SITE_ICONS`, `LHN_SITE_BRANDS` | Favicon origin/cache và icon nhãn hiệu/fallback. |
| [`thumbnails.js`](../../js/shared/thumbnails.js) | `LHN_THUMBNAILS` | Thumbnail URL an toàn, load/fallback dùng chung. |
| [`auth-popup.js`](../../js/shared/auth-popup.js) | `LHN_AUTH_POPUP` | Popup/sheet đăng nhập chuẩn. |

## 3. Luồng chính

1. Consumers nạp helper trước khi gọi. Selection toolbar có guard nạp lại; web nạp sớm cho bridge của Keepit bar, Documents nạp cùng module. Preview chỉ dựng markup, không cài bridge.
2. `build({actions,style,logoAction,t})` chỉ dựng tính năng bật, gắn `data-kp-slot`. Style là dữ liệu; CSS không đọc số dạng. Logo action tắt thì chuyển sang tool bật đầu tiên.
3. `installTouchSelectionBridge()` là implementation duy nhất, chuyển selection sau nhấc tay thành mouseup. Giữ settle 900 ms, contextmenu 60 ms, chặn lúc đang chạm, chống lặp theo text/rect. Web truyền callback bỏ qua host; Documents dùng cùng bridge, không có cử chỉ copy.
4. Consumers gắn sheet qua `LHN_SHEET.attach`. Notes setup grow/scroll nằm ở `LHN_SIDEBAR.attachTouchSheet`; AI sheet ở `LHN_AI_SHEET`. Không viết drag handler thay thế trong file viewer.
5. Site icons resolve trên origin thật và cache vào storage; thumbnails dùng nguồn đã lưu/YouTube/fallback. Search chuẩn hóa, xếp hạng và tô chỗ khớp mà không sửa dữ liệu gốc.

## 4. Hợp đồng và quy tắc cần giữ

- Script thường đăng ký global `LHN_*`; guard bảo vệ nạp lặp. Public API thêm phải giữ callers cũ và thứ tự manifest/home/Dashboard.
- Style 0 chỉ logo; 1–8 là cờ radial/bar, nhãn và hover. Giữ slot trái/dưới/phải, logo default, master filters và idSuffix. Không tạo markup chọn chữ riêng cho từng surface.
- Bridge touch không mở giữa lúc kéo selection handles, không ghi đè bridge APK hay cài hai lần trên cùng document.
- Sheet quyết định một lần khi vượt slop: caret/range/horizontal scroll giữ native, list đang cuộn trả về đầu trước; phần còn lại drag/grow. Dùng sheet CSS zoom để chuẩn hóa tọa độ. Không khóa html bằng overflow:hidden.
- `attach` cùng element chỉ cập nhật options, không nhân listener. Chỉ khi sheet mở mới khóa touch/wheel/scroll keys; `ctrl+wheel`/pinch và editor vẫn hoạt động. Đóng/removed phải nhả lock/timer.
- Favicon chỉ request chính origin, không dịch vụ favicon ngoài; thumbnail data URL ảnh được phép, nội dung tệp không gửi tới máy chủ để tạo ảnh.
- `custom-font` bỏ website disabled; theme đổi ở token chung. File original do renderer quyết định font/hình học.

## 5. Kiểm tra và xác minh

Syntax/dependency refs và guard; Chromium thật kiểm toolbar/styles, touch bridge, Notes/AI sheets, native Reader và source isolation. Sau thay đổi helper phải thử web và homepage, không chỉ Documents. Cảm ứng/UA mô phỏng không thay Firefox hoặc Edge Android thật; các QA cũ chưa xác nhận giữ trong `PROJECT.md`.
