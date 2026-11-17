# Tài liệu cục bộ — Luồng tích hợp

## Phạm vi

Tài liệu dùng bố cục demo v13 nhưng phải gọi module app có sẵn cho Reader, chọn chữ, Ghi chú và AI; không mang bản mô phỏng vào ứng dụng. Hỗ trợ PDF/DOCX/PPTX/JPG/PNG/WebP, không sửa file gốc. Chưa có OCR, XFA, sửa form PDF hoặc hiệu ứng Office nâng cao.

## Điểm vào

| File | Vai trò |
|---|---|
| [`pages/documents.html`](../pages/documents.html), [`css/dashboard/documents.css`](../css/dashboard/documents.css) | Shell và giao diện viewer. |
| [`js/dashboard/documents.js`](../js/dashboard/documents.js) | Import, render, progress, source blocks/anchors/geometry. |
| [`js/dashboard/documents-context.js`](../js/dashboard/documents-context.js) | Context của tệp sở hữu, adapter Reader, cập nhật nguồn và nhận AI sheet. |
| [`js/dashboard/documents-store.js`](../js/dashboard/documents-store.js) | IndexedDB `keepit-documents`; blob và metadata. |
| [`js/dashboard/documents-renderers.js`](../js/dashboard/documents-renderers.js) | PDF.js, Office/ảnh, ZIP guard và sanitizer. |
| [`js/content/content.js`](../js/content/content.js), [`js/reader/bilingual-reader.js`](../js/reader/bilingual-reader.js) | Chọn chữ và Reader dùng chung của app. |

## Luồng dữ liệu

1. Dashboard mở iframe route `documents`; bridge kiểm origin và `event.source`. URL dùng UUID cục bộ, không đưa hash/nội dung tệp vào URL AI.
2. Import kiểm giới hạn, chống trùng SHA-256 và ghi blob/metadata nguyên tử. Không lưu mật khẩu PDF hoặc thumbnail đã giải mã của PDF khóa. PDF giữ canvas/text layer theo tọa độ; projection nhóm text thành paragraph mà không đổi bố cục. Office có thể khác phông/đối tượng so với bản gốc.
3. Chọn chữ đi qua `LHN_SELECTION_TOOLBAR` và controller app. Dictionary, popup ghi chú, màu/thẻ và sidebar không có bản triển khai song song trong Tài liệu.
4. Notes mới lưu trong annotations chung, kèm `documentAnchor` (hash tệp, trang, block, khoảng ký tự, quote). v314 notes được migrate một lần, giữ nội dung/ngày. Notes xuất hiện trong H&N/Flashcards/JSON backup; blob tệp không nằm trong backup.
5. Reader dùng `LHN_READER_API`, queue/TTS và UI chung. PDF gom nhiều text span thành một block đọc; khung active bao cả paragraph (outline 2px, offset 4px, nền accent 8%, radius 6px). Index span vẫn dùng cho selection/anchor. Adapter hỗ trợ chuyển trang lười, double-click chọn block và speaker geometry. PDF Original dùng icon chung trên overlay không scale, neo cuối paragraph, 18×18px. Hit-test paragraph bounds cho hover hiện đúng icon; visibility chỉ có `always`/`hover`, legacy `reading` migrate về `hover`. Panel Bản dịch mặc định rộng hơn 1.5×; chữ nguồn và bản dịch cùng 12px. Không tạo queue hay handler TTS riêng.
6. Hỏi AI dùng controller chung; desktop mở panel, cảm ứng dùng `LHN_AI_SHEET`. Chỉ action tường minh gửi selection/tham chiếu nguồn; không gửi blob hoặc tự đọc thân tệp cho AI.

## Hợp đồng

- Web không có `LHN_PAGE_CONTEXT` giữ đường cũ. Chỉ chấp nhận owned Dashboard document references; không mở rộng sang extension/file URL tùy ý hoặc để web giả nguồn.
- Giữ toolbar một hàng, control trong Thêm, pager mờ 1 giây nhận lần bấm đầu; pager nhường khi Reader gốc mở. Notes dùng layout/sheet app, không panel riêng.
- Mọi PDF text span hiển thị phải ánh xạ về paragraph; Reader/Dịch bắt đầu một lần mỗi đoạn. Loại nguồn đúng một ký tự khỏi Reader và Dịch nhưng giữ index gốc để anchor/selection/card không lệch. Cuộn theo tệp chọn đoạn hợp lệ gần tâm vùng đọc; tâm dọc đoạn PDF trùng tâm card gốc + dịch. `data-i` dành cho span selection; anchor Đọc lưu offset theo paragraph và giải lại trên spans gốc. Không dò chuỗi để bỏ mảnh text.
- Tôn trọng cài đặt chung; không tự tải POS model, nới quyền hoặc bypass CSP trang ngoài.
- Giới hạn: tệp 50 MB, ảnh 30 MB, ZIP tổng 160 MB, mỗi entry 50 MB/12.000 entry, tối đa 2.000 trang. Chưa có cloud sync hoặc backup blob.

## Xác minh

Chromium extension thật cần kiểm selection/composer/sidebar/dictionary, notes/anchor/reopen/migration/deep link/backup, Reader native/thay trang/card, touch selection/sheet/AI và regression web/home. AI chưa đăng nhập có thể báo lỗi nhúng; UI không chứng minh phiên AI thật. Firefox, Edge Android và giọng đọc thực cần xác nhận riêng.
