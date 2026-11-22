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

1. v3.5.431: Dashboard vẽ **thư viện tài liệu trong chính document của Dashboard** (`js/dashboard/documents-library.js`) và đọc thẳng kho `keepit-documents`; khung iframe ẩn khi không xem tệp và chỉ còn nhiệm vụ mở/xem tệp. Dashboard ra lệnh `KEEPIT_DOCUMENTS_OPEN` (mở tệp) và `KEEPIT_DOCUMENTS_IMPORT_FILES` (File được structured-clone sang khung để kiểm dung lượng, chống trùng, tách trang); khung trả `KEEPIT_DOCUMENTS_IMPORTED`. Bridge kiểm origin và `event.source`. URL dùng UUID cục bộ, không đưa hash/nội dung tệp vào URL AI.
2. Import kiểm giới hạn, chống trùng SHA-256 và ghi blob/metadata nguyên tử. Không lưu mật khẩu PDF hoặc thumbnail đã giải mã của PDF khóa. PDF giữ canvas/text layer theo tọa độ; projection nhóm text thành paragraph mà không đổi bố cục. Thumbnail từng trang của rail render lazy theo vùng nhìn thấy; PDF raster riêng ở kích thước nhỏ, DOCX/PPTX dùng text preview theo trang. Office có thể khác phông/đối tượng so với bản gốc.
3. Chọn chữ đi qua `LHN_SELECTION_TOOLBAR` và controller app. Dictionary, popup ghi chú, màu/thẻ và sidebar không có bản triển khai song song trong Tài liệu.
4. Notes mới lưu trong annotations chung, kèm `documentAnchor` (hash tệp, trang, block, khoảng ký tự, quote). v314 notes được migrate một lần, giữ nội dung/ngày. Notes xuất hiện trong H&N/Flashcards/JSON backup; blob tệp không nằm trong backup.
5. Reader dùng `LHN_READER_API`/TTS/UI chung. PDF gom span thành block đọc; khung active bao paragraph (2px, lệch 4px, nền 8%, radius 6px); index giữ cho selection/anchor. Adapter hỗ trợ chuyển trang lười, chọn block bằng double-click và speaker. PDF Original dùng icon chung neo cuối paragraph (18×18px); hover hiện icon, visibility `always`/`hover`, `reading` cũ migrate về `hover`. Bảng thẳng cột gom thành block: newline giữa hàng, ` | ` giữa ô; TTS đọc tuần tự, không tô nổi hàng. Trên PDF, mỗi highlight nhiều dòng dùng một group/hitbox và một popup ghi chú; các dải nền con bám theo chữ, giữ màu blend đã xác nhận và không tô kín khoảng trắng. Loại từ chỉ gạch dưới màu, hover hiện nghĩa. Panel Bản dịch mặc định rộng hơn 1.5×; chữ nguồn và bản dịch cùng 12px. Không tạo queue hay handler TTS riêng. Documents nạp shared UI tokens để các popup/app UI dùng app font; không ép font app lên nội dung gốc PDF/Office. Dịch chọn chữ và tự dịch note dùng endpoint `translate.googleapis.com` được CSP cho phép.
6. Hỏi AI dùng controller chung; desktop mở panel, cảm ứng dùng `LHN_AI_SHEET`. Chỉ action tường minh gửi selection/tham chiếu nguồn; không gửi blob hoặc tự đọc thân tệp cho AI.

## Hợp đồng

- Web không có `LHN_PAGE_CONTEXT` giữ đường cũ. Chỉ chấp nhận owned Dashboard document references; không mở rộng sang extension/file URL tùy ý hoặc để web giả nguồn.
- Giữ toolbar một hàng, control trong Thêm, pager mờ 1 giây nhận lần bấm đầu; pager nhường khi Reader gốc mở. Menu bên phải pager gửi lệnh tới main sheet thật của thanh Keepit trên web đang hoạt động; nút ☰ Reader gửi cùng lệnh mở (không toggle) để sheet cuộn tới mục Reader như trên web. Trong main sheet của Documents, bỏ điều khiển Ẩn/Hiện thanh; Dịch/Đọc to nằm ở footer cố định cạnh Cài đặt và gọi cùng handler với nút trên toolbar viewer qua `LHN_DOCUMENTS_MAIN_ACTIONS`. More trên thanh viewer vẫn mở sheet Điều khiển riêng với mode/flow/zoom/tools. Notes dùng layout/sheet app, không panel riêng.
- Mọi PDF text span hiển thị phải ánh xạ về paragraph; Reader/Dịch bắt đầu một lần mỗi đoạn. Loại nguồn đúng một ký tự khỏi Reader và Dịch nhưng giữ index gốc để anchor/selection/card không lệch. Cuộn theo tệp chọn đoạn hợp lệ gần tâm vùng đọc; tâm dọc đoạn PDF trùng tâm card gốc + dịch. `data-i` dành cho span selection; anchor Đọc lưu offset theo paragraph và giải lại trên spans gốc. Không dò chuỗi để bỏ mảnh text.
- Tôn trọng cài đặt chung; không tự tải POS model, nới quyền hoặc bypass CSP trang ngoài.
- Gợi ý PDF từ browser (v3.5.370): khi tab đang active là PDF, cửa sổ popup Keepit nổi riêng ở góc phải trên; CTA sang view Tài liệu, nơi người dùng chọn file local. Viewer PDF mặc định không cho extension chèn DOM hoặc tự lấy blob. Nhận diện path `.pdf` trực tiếp hoặc nguồn nằm trong query `src`/`file`/`url` của viewer; không redirect/fetch.
- Giới hạn: tệp 50 MB, ảnh 30 MB, ZIP tổng 160 MB, mỗi entry 50 MB/12.000 entry, tối đa 2.000 trang. Chưa có cloud sync hoặc backup blob.

## Xác minh

Chromium extension thật cần kiểm selection/composer/sidebar/dictionary, notes/anchor/reopen/migration/deep link/backup, Reader native/thay trang/card, touch selection/sheet/AI và regression web/home. AI chưa đăng nhập có thể báo lỗi nhúng; UI không chứng minh phiên AI thật. Firefox, Edge Android và giọng đọc thực cần xác nhận riêng.

## Bố cục và thanh điều khiển (v3.5.597)

- Cài đặt → Tài liệu và lựa chọn trên thanh dưới dùng chung `lhnDocumentsFlow`: một trang, liên tục (mặc định), hai trang, hai trang liên tục. Hai trang ghép 1–2, 3–4; trang lẻ cuối đứng riêng; màn hình hẹp vẫn giữ hai cột và cho phép zoom/cuộn ngang. Ảnh đơn không có lựa chọn ghép trang.
- `lhnDocumentsPager` lưu luôn hiện, tự làm mờ (mặc định), tự ẩn hoặc ẩn. Tự ẩn hiện lại khi chuột/chạm gần mép dưới; khi ẩn có nút Cài đặt trên thanh trên. Dashboard và viewer đồng bộ qua storage; cấu hình flow cũ được chuyển đổi. Không áp dụng bố cục trang gốc cho chế độ Đọc.

- File chỉ có một trang hiển thị Từng trang, khóa các kiểu khác trong viewer và khi mở Cài đặt từ file; không ghi đè lựa chọn đã nhớ cho file nhiều trang. Nút Cài đặt ở thanh trên và menu tài liệu đều mở thẳng tab Tài liệu.
