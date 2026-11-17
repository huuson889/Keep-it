# Tài liệu cục bộ — Luồng tích hợp

## Phạm vi

Thư viện/trình xem lấy bố cục demo v13; **công cụ phải dùng module app có sẵn**, không mang Reader, chọn chữ, Ghi chú hay AI mô phỏng vào ứng dụng. PDF/DOCX/PPTX/JPG/PNG/WebP là tệp thật, tệp gốc không bị chỉnh sửa. OCR/XFA/form editing và hiệu ứng Office nâng cao chưa có.

## Điểm vào

| File | Vai trò |
|---|---|
| [`pages/documents.html`](../pages/documents.html), [`css/dashboard/documents.css`](../css/dashboard/documents.css) | Shell tệp; không còn `#player`, `#sel`, `#dict`, Notes/AI panel riêng. |
| [`js/dashboard/documents.js`](../js/dashboard/documents.js) | Import, renderer, progress; cung cấp source blocks/anchors/geometry cho công cụ chung. |
| [`js/dashboard/documents-context.js`](../js/dashboard/documents-context.js) | `LHN_PAGE_CONTEXT` chỉ trong trang Documents sở hữu; `LHN_DOCUMENT_CONTEXT` gắn adapter, làm mới nguồn và nhận AI sheet qua parent. Không dựng UI công cụ. |
| [`js/dashboard/documents-store.js`](../js/dashboard/documents-store.js) | IndexedDB `keepit-documents`: blob/metadata; `notes`/`translations` v314 chỉ còn dữ liệu tương thích/migration. |
| [`js/dashboard/documents-renderers.js`](../js/dashboard/documents-renderers.js) | Bộ đọc PDF.js/Office/ảnh đóng gói; guard ZIP và sanitizer. |
| [`js/content/content.js`](../js/content/content.js), [`js/reader/bilingual-reader.js`](../js/reader/bilingual-reader.js) | Controller chọn chữ/popup/từ điển/Notes và Reader **gốc** của app. |

## Luồng dữ liệu

1. Sidebar/Thêm mở iframe route `documents`. Parent chỉ ẩn shared topbar tại route này; bridge kiểm origin và `event.source`. Tham chiếu tệp dùng UUID cục bộ trong URL Dashboard, không đưa hash/nội dung tệp vào URL AI.
2. Chọn/kéo thả → giới hạn → SHA-256 chống trùng → giải mã thật → ghi blob/metadata nguyên tử. Không lưu mật khẩu PDF hoặc thumbnail giải mã của PDF khóa. PDF giữ canvas/text layer định vị; projection riêng ghép các text items theo tọa độ thành dòng/đoạn, ánh xạ mọi mảnh hiển thị về đoạn mà không thay bố cục trang. Bộ đọc Office có cảnh báo sai khác phông/đối tượng; cần trang chính xác thì dùng PDF tĩnh.
3. Chọn chữ đi qua `content.js` và `LHN_SELECTION_TOOLBAR`, theo đúng style/logo/popup/master đã lưu. Full Dictionary, tim, popup ghi chú, màu/thẻ và sidebar đều là thành phần app; không có controller chọn chữ song song.
4. Notes mới lưu ở **annotations chung**, kèm `documentAnchor` (hash tệp, trang, block, khoảng ký tự, quote). v314 notes được chuyển một lần, giữ nội dung/ngày, không tái tạo ghi chú đã xóa. Notes hiện trong H&N/Flashcards/JSON backup chung; blob tệp không nằm trong backup.
5. Reader dùng `LHN_READER_API`, cùng UI giọng/tốc độ/repeat/điều khiển và cấu hình. Với PDF, Reader và panel Dịch dùng cùng một khối cho mỗi đoạn nhiều dòng; Reader đọc toàn đoạn và vẽ một viền duy nhất bao trọn đoạn đang đọc, không viền riêng từng text span. Chỉ số span riêng vẫn giữ cho chọn chữ/anchor. Adapter cung cấp chuyển trang lười và chỗ đặt native bilingual card; không đổi hình học trang gốc.
6. Hỏi AI gọi controller chung; desktop dùng panel, cảm ứng dùng **cùng** `LHN_AI_SHEET` như web. Request top-frame được Dashboard chuyển cho Documents đang active. Chỉ action tường minh gửi selection/tham chiếu nguồn, không gửi blob hoặc tự đọc thân tệp cho AI.

## Hợp đồng

- Web không có `LHN_PAGE_CONTEXT` phải giữ đường cũ. Chỉ owned Dashboard document references được chấp nhận, không mở rộng sang extension/file URL tùy ý hoặc cho web giả nguồn.
- Giữ toolbar tệp một hàng, move control vào Thêm không clone, pager mờ 1 giây và nhận lần bấm đầu. Pager nhường khi Reader gốc mở; Notes dùng layout/sheet app, không panel v13 riêng.
- Với PDF, mọi text span hiển thị phải ánh xạ được về một paragraph index; block Reader/Dịch chỉ bắt đầu một lần mỗi đoạn. Giữ `data-i` riêng cho selection/anchor; anchor tạo ở chế độ Đọc lưu offset theo đoạn và được giải lại trên các spans gốc. Không dùng dò chuỗi để bỏ rơi mảnh text.
- Dịch và Notes/AI/Reader tôn trọng cài đặt chung. Không tự tải mô hình POS. Không nới quyền hay bypass CSP trang ngoài.
- Giới hạn giữ nguyên v314: tài liệu 50 MB/ảnh 30 MB, ZIP tổng 160 MB/từng entry 50 MB/12.000 entry, tối đa 2.000 trang. Chưa có cloud sync hoặc backup blob tệp.

## Xác minh

Chromium extension thật: native selection/composer/sidebar/dictionary/tim, global notes/anchor/reopen/migration/deep link/backup, Reader native/thay trang/card, touch selection/sheet/AI và web/home regression. AI chưa đăng nhập có thể báo lỗi nhúng provider; không coi kiểm tra khung UI là đã xác nhận phiên AI đăng nhập. Firefox/Edge Android thật và giọng thực nghe cần xác nhận riêng.
