# Tài liệu cục bộ — Luồng tích hợp

## Phạm vi

Tab Tài liệu dùng giao diện demo v13 với PDF, DOCX, PPTX và ảnh JPG/PNG/WebP thật. Thư viện ban đầu trống; không có trang mẫu, bản dịch giả hay timer giả làm phát âm. Tệp gốc không bị chỉnh sửa. Luồng nối Dashboard với các công cụ Dịch, TTS, Loại từ và AI hiện có.

## Điểm vào

| File | Vai trò |
|---|---|
| [`pages/documents.html`](../pages/documents.html), [`css/dashboard/documents.css`](../css/dashboard/documents.css) | Shell v13; script cục bộ, CSP tài nguyên chặt hơn Dashboard. |
| [`js/dashboard/documents.js`](../js/dashboard/documents.js) | `KeepitDocuments`: import, viewer, công cụ và vòng đời. |
| [`js/dashboard/documents-store.js`](../js/dashboard/documents-store.js) | `KeepitDocumentsStore`: IndexedDB `keepit-documents` v1, bốn store `meta`, `files`, `notes`, `translations`. |
| [`js/dashboard/documents-renderers.js`](../js/dashboard/documents-renderers.js) | `KeepitDocumentRenderers.prepare`: PDF.js, DOCX/PPTX và ảnh; kiểm ZIP, khử nội dung chủ động. |
| [`css/dashboard/documents-host.css`](../css/dashboard/documents-host.css), [`js/dashboard/dashboard.js`](../js/dashboard/dashboard.js) | Route `documents`, iframe và bridge fullscreen. |
| [`vendor/pdfjs/`](../vendor/pdfjs/README.md), [`vendor/office/`](../vendor/office/README.md) | Bộ đọc đóng gói, không dùng CDN. |

## Luồng dữ liệu

1. Sidebar/Thêm mở route. Parent chỉ ẩn topbar chung tại Tài liệu; child có topbar Keepit riêng. Bridge mở/đóng viewer kiểm cả origin và `event.source`.
2. Chọn/kéo thả → kiểm loại/kích thước → SHA-256 → bỏ trùng → giải mã thật → ghi blob/metadata nguyên tử. PDF kiểm mật khẩu thật; không lưu mật khẩu hoặc thumbnail giải mã của PDF khóa.
3. PDF có canvas/text layer, tải lười và giải phóng canvas xa viewport. Office lấy thứ tự slide, nội dung/hình và speaker notes từ tệp. Phông/đối tượng nâng cao có thể khác; dùng PDF tĩnh khi cần phân trang chính xác.
4. Notes lưu anchor theo hash, trang, block, khoảng ký tự và quote. Dịch qua `BILINGUAL_TRANSLATE`; từ điển qua `LHN_DICTIONARY`; đọc qua `LHN_TTS`; Loại từ qua `WORD_CLASS_*`, vẽ phủ không viết lại chữ gốc. AI dùng `OPEN_AI_PANEL` với selection tường minh.
5. Tiến độ/notes phục hồi sau restart. `lhnDocumentsPrefs` giữ flow, ngôn ngữ, follow và chiều rộng riêng. Đóng/chuyển route ngừng công cụ và giải phóng renderer.

## Hợp đồng

- Không gửi tệp tới máy chủ. Chỉ text của công cụ người dùng chủ động sử dụng được gửi tới dịch vụ tương ứng.
- Giữ toolbar một hàng, chuyển control gốc vào Thêm, không clone; pager mờ sau 1 giây nhưng nhận lần bấm đầu. Sidebar resize riêng, màn dọc dùng sheet. ←/→ không chiếm phím trong editor/form/menu/modal/splitter.
- Tôn trọng các master `notesEnabled`, `translateEnabled`, `askAIEnabled` và theme chung. Không tự tải mô hình POS hoặc đoán nhãn.
- Giới hạn: tài liệu 50 MB, ảnh 30 MB, ZIP giải nén tổng 160 MB/từng entry 50 MB/12.000 entry, tối đa 2.000 trang. Không nới quyền/CSP để chạy mã trong tệp.
- DB Tài liệu tách annotations web. JSON backup hiện tại **không** gồm tệp và notes Tài liệu. Chưa có OCR, cloud sync, XFA, chỉnh sửa biểu mẫu hoặc hiệu ứng Office nâng cao.

## Xác minh

Chạy syntax/manifest/refs và diff checks. Chromium extension thật kiểm import, text/bảng/hình, notes, tiến độ, cold restart, PDF khóa/hủy, tệp hỏng/ZIP quá ngưỡng, sanitizer, theme, responsive, masters và route cũ. Bridge công cụ kiểm bằng service mock; provider dịch/từ điển và tải audio Google được thử riêng. Firefox, Edge Android thật, AI đăng nhập và Office phức tạp cần người dùng xác nhận.
