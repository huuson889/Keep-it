# Tài liệu cục bộ — Luồng tích hợp

## Phạm vi

Tài liệu dùng bố cục demo v13 nhưng phải gọi module app có sẵn cho Reader, chọn chữ, Ghi chú và AI; không mang bản mô phỏng vào ứng dụng. Hỗ trợ PDF/DOCX/PPTX/JPG/PNG/WebP, không sửa file gốc. OCR cục bộ Tesseract được mô tả bên dưới; chưa hỗ trợ XFA, sửa form PDF hoặc hiệu ứng Office nâng cao.

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
- Giữ toolbar một hàng; trong Thêm, ô chuyển trang chiếm cả hàng, ô zoom giãn giữa hai nút và không cắt nhãn khi đủ chỗ; pager mờ 1 giây nhận lần bấm đầu, giữ hiện khi Thêm hoặc sheet menu chính mở (trừ chế độ Ẩn); pager nhường khi Reader gốc mở. Thanh phím tắt căn theo tâm Reader và không vượt vùng tài liệu. Menu bên phải pager gửi lệnh tới main sheet thật của thanh Keepit trên web đang hoạt động; nút ☰ Reader gửi cùng lệnh mở (không toggle) để sheet cuộn tới mục Reader như trên web. Trong main sheet của Documents, bỏ điều khiển Ẩn/Hiện thanh; Dịch/Đọc to nằm ở footer cố định cạnh Cài đặt và gọi cùng handler với nút trên toolbar viewer qua `LHN_DOCUMENTS_MAIN_ACTIONS`. More trên thanh viewer vẫn mở sheet Điều khiển riêng với mode/flow/zoom/tools. Notes dùng layout/sheet app, không panel riêng.
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

- Danh sách kiểu trang trong viewer dùng bốn icon theo hình mẫu, cùng chữ và trạng thái khóa; điều khiển vẫn đồng bộ với select Cài đặt. Danh sách và nút tự rộng theo mục dài nhất, có bo góc giống danh sách zoom; menu zoom cuộn trong vùng thấy. Thanh không mờ/ẩn khi danh sách đang mở. Hỗ trợ chọn bằng chuột/chạm và phím mũi tên, Enter, Escape.

- Nút cạnh trái menu trên thanh dưới bật/tắt toàn màn hình của viewer; Escape thoát toàn màn hình trước khi đóng tài liệu. Dashboard cho phép iframe Documents vào toàn màn hình; khi đóng tài liệu hoặc mở Cài đặt sẽ thoát toàn màn hình trước.

- Thanh trên cao 46px với chuột, 52px khi cảm ứng; giữ kích thước nút.
- Cài đặt Tài liệu → Thu gọn thanh điều khiển (`lhnDocumentsCompactTop`) mặc định tắt; khi bật, thanh trên, thanh dưới, Reader và nút về đầu trang thu còn 80%, đồng bộ live qua storage và giữ sau reload. Reader căn giữa vùng xem tài liệu, tự vừa vùng hẹp và theo thay đổi hai bên. Menu vẫn giữ cỡ thường; thao tác chạm trên thanh có đích nhỏ theo tỉ lệ.
- Dải trang bên trái và bảng dịch ẩn/hiện trượt 260ms cùng đường cong thanh Ghi chú (tắt chuyển động khi hệ thống yêu cầu), có nút trên thanh trên và tay kéo mép phải đồng kiểu panel dịch (hỗ trợ phím mũi tên, Home/End); `lhnDocumentsRail` lưu trạng thái và chiều rộng. Mặc định hiện màn ngang, ẩn màn dọc; bề rộng bị giới hạn để chừa chỗ xem tài liệu, không áp dụng cho ảnh.

- Chuyển chế độ Gốc/Đọc hoặc mở thẳng chế độ Đọc chỉ đổi cách xem, không tự khởi động giọng; muốn đọc to dùng nút Đọc to riêng.


## OCR — dựng sạch từ nguồn 3.5.612 và demo 2.9.7.33

### Nguồn và ranh giới

Chỉ sử dụng `Keep-it` gốc 3.5.612 và demo OCR đã duyệt. Không đọc/đối chiếu/tái dùng mã từ các bản OCR bị người dùng loại. Mã nguồn riêng ở `Workspace/Keepit-OCR`; manifest 3.5.617 tiếp tục bản test với giới hạn đã công khai, bản 3.5.614 trước đó được người dùng cho phép đóng gói dù chưa đủ QA unpacked/ảnh bắt buộc; không phải xác nhận đạt 100%.

- `ocr-controller.mjs` lấy trực tiếp DOM/luồng OCR, hover, vùng và Tesseract preprocessing của demo, nhưng không nạp viewer hoặc các công cụ giả của demo. `ocr-demo.css` scope các declaration demo; đổi lớp tích hợp/stacking, fallback font thực tế và reset CSS gốc trùng tên. Vùng không nhận `margin-bottom:18px` của `.row` thư viện; notice không nhận căn giữa/font weight gốc. Thanh viewer dọc cao 52px theo demo; vẫn dùng các controller/nút app.
- `KeepitOcrDocumentHost` trong `documents.js` cung cấp state/getters và cùng renderer đang mở. Renderer thêm `ocrCanvas` dùng PDFDocument/ảnh có sẵn; không fingerprint/import/parse tệp lần hai.
- DB Documents nâng 2 → 3, thêm store `ocr`/index `document`, khóa document/page, schema 1. Soft delete/restore giữ OCR; purge scoped. Migration Node giữ bytes/metadata/notes/translations của v2.
- `sourceTexts` ưu tiên PDF text gốc; scan/ảnh fallback OCR. `.para`/`.en` trên box cấp vào Reader/selection/notes/controller app thật. Không tạo queue TTS hay popup công cụ thứ hai.
- Nhận dạng vùng giữ **đúng luồng demo**: nhận xong ghép box ngay; Áp dụng đóng/áp dụng chữ thủ công, Hủy không undo phần vùng đã nhận dạng. Không thay bằng cơ chế preview/commit của bản bị loại. Đã sửa riêng ánh xạ hover bằng geometry vì demo append box vùng ở cuối dẫn đến title nhảy sang dòng cuối; hình thức UI không thay đổi.
- Copy/TXT/PDF dùng controls demo; PDF export dùng exporter từ demo và giữ nguyên trang đã có text. Nếu tất cả trang đã có chữ gốc, demo báo không cần xuất. Không tạo kết quả giả cho engine chưa làm; PP/Fusor và tùy chọn riêng bị khóa, không đóng gói model hai engine đó.
- Sửa văn bản giữ nguyên box geometry và ghi undo history như demo; không dựng lại khung theo dòng mới. Tesseract thử lại trang lỗi một lần rồi bỏ qua trang đó/tiếp tục batch; summary một phần chỉ đếm kết quả của lượt hiện tại. Ảnh OCR giới hạn 16 megapixel như demo.
- PDF export không bật nhầm progress OCR. Khi đóng/chuyển tài liệu, đợi export cleanup và không tải kết quả muộn hoặc gắn tên tài liệu mới.
- Job token + cancellation race + worker termination chặn kết quả muộn; mở/đóng/đổi tài liệu đợi job kết thúc trước khi dispose renderer. Scan gắn đúng canvas trang job đang xử lý. Region loop dùng cùng cancellation guard.
- `ocr-localize.mjs` lấy nhãn từ `languages.js` en/vi/ko; giữ chuỗi protocol nội bộ để parse trạng thái demo và không dịch nội dung OCR của tài liệu. Theme theo setting app; không có theme riêng của OCR.

### Bằng chứng và giới hạn

3.5.616 sửa riêng điều hướng OCR: `KeepitOcrDocumentHost.goTo` yêu cầu native smooth cho continuous/facingContinuous, cùng cơ chế demo (không tự viết easing hay đổi CSS toàn app). `setPage` mặc định auto cho các caller khác. Đích cuộn tạm giữ current ổn định khi qua các trang trước; lệnh trùng không restart, resize tính lại đích mà không ghi scrollTop ngắt animation, input người dùng nhả tracking đích. Không đổi engine/storage/scan/word/region UI của 3.5.615.

QA 3.5.616: 8/8 trace điều hướng app/demo cùng PDF ở origin tách biệt, 1512/390 × sáng/tối × hai flow; trước sửa nhảy ngay100% ở frame đầu, sau có nhiều frame trung gian/đơn điệu/current không lùi/giữ pageStack. 8/8 OCR thật ba trang, bắt đầu ở trang1 cả sau resize, scan/lưu đúng từng trang và clear scan; Node24/24, static29/29, scan/khung64/64, bốn flow/hủy18/18, hồi quy15/15, range/current/native-PDF13/13; cú pháp/undefined checks sạch với shared globals khai báo, console.error/pageerror HTTP rỗng. Wheel thật trusted đã kiểm current3→2 theo cuộn thủ công. Trace rAF không phải video hay chứng nhận FPS; quãng đường/layout app và demo khác nên timing/frame count không hứa tuyệt đối trùng nhau.

3.5.615 sửa lớp vẽ UI: `.layer` chữ chọn được giữ native page units; `.ocrVisualSurface` inverse-scale và mở kích thước theo `--source-scale`, giữ scan/word/hover/region ở display pixels. Overlay bỏ padding `.paper` app; `.ocrWordBox` dùng rect chuẩn hóa thay outline span chữ/nested `.en`. Reverse hover khớp cụm chữ theo geometry trước fallback offset, giữ đúng dòng sau bổ sung vùng.

QA mới 3.5.615: fixture PDF 72×96pt thực sự OCR, 64/64 trường hợp 1512/390 × theme app sáng/tối × 4 flow × fit/50/100/800 zoom; sourceScale 0.5–10.5556, visual scale 1, scan 2px/trail120px/region2px/radius2px, đúng giữa chu kỳ và thời gian 2.8s/5.6s. Node16/16, static29/29, regression15/15; ESLint/console.error/pageerror HTTP rỗng. Scan trong lượt OCR thật beam running 2800ms, visualScale≈1, line2px/trail120px. Chuột thật kéo vùng, OCR tiêu đề, Apply, hover và chọn chữ/tool. Đây vẫn chỉ là HTTP, không phải nghiệm thu bằng ảnh extension. Kết quả 976 style cũ dưới đây **không kiểm đủ các overlay này** và đã bỏ sót lỗi người dùng báo.

Harness mới nằm ngoài source: `/home/user/qa-clean`. Có 13/13 Node, 15/15 regression, 13/13 current/range/native PDF, 14/14 export/Office tổng hợp, 9/9 retry/partial; bốn flow PDF/cancel, region/hover bằng chuột thật và pypdf đọc bản xuất. 7 DOM component khớp sau namespace/version normalization. Audit 20 trạng thái × cỡ/theme, 976 mẫu style không lệch thuộc tính đang đo; normalize nhãn số trang/version, bỏ chênh khai báo font-family vì fallback thực tế giống nhau, chờ transition xong. Đây **không phải pixel diff hay kiểm unpacked**. Cùng PNG đầu vào cho text/boxes Việt/Hàn giống hệt demo, gồm cả lỗi đọc Hàn; không hứa OCR chính xác tuyệt đối. PDF được raster trực tiếp thay vì lấy canvas đang hiển thị rồi scale lại nên kết quả/box không byte-identical với demo trên một số mẫu.

Trình duyệt công cụ từ chối `chrome://extensions/`: isolated browser context không cho mở và không nạp được unpacked. Chưa có bộ ảnh unpacked/PNG 4×, kiểm CSP/permission thực hoặc tệp/profile/thiết bị/voice/AI thật. Người dùng đã cho phép tăng version/commit/đóng ZIP bản test với giới hạn này. Không đánh dấu 100% hoặc coi là đã đạt nghiệm thu trước khi đủ điều kiện đó.

3.5.617 chỉ sửa CSS OCR: sidebar ngang mặc định cùng chiều rộng popup (380px, giới hạn viewport), giữ `--trW`/resize và portrait toàn màn hình. Popup z-index2147483001 cao hơn host thanh2147483000, thấp hơn sheet đang mở2147483647; tọa độ không đổi. HTTP đối chiếu6/6 ở1512/800/390 sáng/tối, kéo/lưu/khôi phục500px và OCR ảnh đã chạy; chưa unpacked/ảnh/pixel QA.
