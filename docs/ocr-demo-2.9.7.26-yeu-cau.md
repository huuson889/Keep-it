# YÊU CẦU — OCR trong Tài liệu phải giống demo 2.9.7.26 (bản chốt để đối chiếu)

> Nguồn chuẩn duy nhất: `Demo/OCR-Keepit-giao-dien-v2.9.7.26.zip` → `index.html`, `style.css`, `glue.js`.
> Không dùng `Demo/ocr-ui-2.6/` (bản đó khác nhãn và còn chip `v2.7.0`).
> Mọi thứ dưới đây là **bắt buộc**; sai một dòng là sai yêu cầu.

## 0. Quy tắc chung
1. **Không tự đổi nhãn, không gộp/bỏ nhóm, không đổi thứ tự, không dựng markup/CSS mới.** Chỉ port nguyên văn + thêm tiền tố `kpOcr`/`kp` và scope `.kpOcrUi`.
2. **Nhãn đủ 3 tiếng** (en/vi/ko); riêng **tên bản ngữ** của ngôn ngữ thì giữ nguyên (`English`, `Tiếng Việt`, `한국어`).
3. **Không hiện chip version** của demo (`v2.9.7.26` / `v2.7.0`) — đó là của demo.
4. Giữ nguyên chức năng Keepit: thư viện, khung xem, phân trang, zoom, chú thích, dịch, đọc to, ghi chú, tìm kiếm.
5. **Không** port bảng “Thêm” của demo, **không** thêm mục OCR nào vào bảng “Thêm” của Keepit.

## 1. Thông báo “chưa có lớp chữ” = thẻ gợi ý + bóng đèn (KHÔNG phải thanh vàng)
| # | Yêu cầu |
|---|---|
| 1.1 | **Bỏ hẳn thanh vàng** “This page has no text layer…” của Keepit. |
| 1.2 | Trang/ảnh chưa có lớp chữ ⇒ hiện **thẻ gợi ý** ở góc trên-phải vùng xem: icon bóng đèn, câu giải thích, nút **“Nhận dạng chữ”**, ô **“Không hiện lại”**. |
| 1.3 | Thẻ tự **thu thành bóng đèn** sau 10 giây không tương tác, hoặc khi bấm ✕, hoặc khi mở popup OCR. |
| 1.4 | Bấm **bóng đèn** ⇒ luôn mở lại thẻ, **kể cả** tệp đã tick “Không hiện lại”. |
| 1.5 | Mỗi lần thẻ hiện chọn ngẫu nhiên 1 trong 2 bảng màu: **hổ phách** hoặc **tím**. |
| 1.6 | Vùng xem hẹp hơn **640px** ⇒ không bung thẻ, chỉ hiện bóng đèn. |
| 1.7 | “Không hiện lại” lưu **theo từng tệp** (khoá `keepit.ocrNoticeOff:<tên|size>`). |
| 1.8 | Rê chuột vào thẻ ⇒ hoãn tự thu; ra khỏi ⇒ đếm lại 10 giây. |
| 1.9 | Trang **đã có** lớp chữ ⇒ ẩn cả thẻ và bóng đèn. |

## 2. Popup cài đặt ở giữa — đúng demo, đủ 5 nhóm, không cắt cụt
**Đầu popup:** icon logo tím + tiêu đề **“Nhận dạng chữ (OCR)”** + phụ đề **“Trang N · chưa có lớp chữ”** (hoặc “đã có lớp chữ gốc”) + nút ✕. **Không chip version.**

| Nhóm | Nội dung bắt buộc |
|---|---|
| **Phạm vi trang** | 3 dòng radio: **Trang đang xem** · *trang N* / **Tất cả các trang** · *N trang* / **Từ trang** `[1 ▾]` **đến** `[N ▾]` **trong N trang**. Ô số + nút ▾ chỉ bật khi chọn dòng thứ 3; ▾ mở lưới số trang 1…N; mặc định **1 … N**. |
| **Ngôn ngữ tài liệu** | Ô tìm “Tìm ngôn ngữ… (Anh, Việt, Hàn)”; hộp danh sách **xếp dọc**, mỗi dòng `☑ Tên  TênBảnNgữ` (Anh/English, Việt/Tiếng Việt, Hàn/한국어), dòng đang chọn nền tím nhạt; không khớp ⇒ “Không có ngôn ngữ này”; dưới hộp: **“Đang chọn **Anh + Việt**.”** |
| **Cách nhận dạng** | 3 dòng radio: **Chữ in** · *Tesseract* / **Nhanh** · *PP-OCR* / **Viết tay** · *Fusor*; dưới đó là **câu gợi ý đổi theo cách chọn**, đúng lời demo (PP-OCR: ~32 MB, 10–30 giây, thiếu nhiều dấu tiếng Việt; Fusor: ~831 MB, phải chọn thư mục model). |
| **Kết quả trên tệp** | Kiểu đầu ra · Độ phân giải dò (1280/960/640) · 4 ô: **Bỏ vùng chữ rất nhỏ**, **Dừng khi lặp 12 lần**, **Giới hạn 90 giây**, **Hiện khung** . |
| **Tuỳ chọn engine** | **Độ phân giải PDF** (PP) · **Số luồng** (Fusor) · **Model Fusor** + nút **“Chọn thư mục model”** · **Phương pháp** · **Ưu tiên**. Nhóm không thuộc cách đang chọn thì **mờ đi** (`opacity .45`), **không ẩn**. |
| **Chân popup** | Trái: **“Chạy trên máy · tệp không rời máy”**. Phải: **Hủy** + **Nhận dạng chữ**. |

2.1 Nền mờ phía sau popup; bấm nền mờ = **đóng và lưu**, bấm ✕/Hủy = **huỷ**.
2.2 Mỗi lần mở, popup trở về trạng thái ban đầu (cuộn lên đầu, danh sách ngôn ngữ đầy đủ, phạm vi/kiểu đúng mặc định).
2.3 Không có tệp ⇒ nút “Nhận dạng chữ” khoá và báo “Mở tệp trước đã”.

## 3. Sidebar phải “Văn bản nhận dạng”
3.1 Tiêu đề **“Văn bản nhận dạng”**, hàng icon (chép, tải TXT, tải PDF, vùng, áp dụng, đóng), **kéo rộng** được, ô nhập sửa được.
3.2 **Mở ngay khi bấm OCR** (không đợi có kết quả), đúng demo.
3.3 Chỗ trống ghi “Văn bản nhận dạng của trang sẽ hiện ở đây. Sửa trực tiếp được.” khi chưa có chữ.

## 4. Hai hộp nổi dưới-phải
4.1 **Thẻ tiến độ** (đồng hồ, thanh tiến độ, nhật ký, Dừng, Buộc dừng, Nhận dạng lại, Bổ sung vùng, ✕).
4.2 **“Bổ sung vùng”** (ô chữ + Nhận dạng vùng / Áp dụng / Hủy).
4.3 Cả hai **cách đường kẻ ngang đáy khung đọc 8px**; không hiện “Bổ sung vùng” khi thẻ tiến độ đang hiện.

## 5. Chức năng phải chạy 100% như demo
5.1 Phạm vi trang + menu trang 1…N; 5.2 ô tìm ngôn ngữ + “Đang chọn …”; 5.3 ba cách nhận dạng + gợi ý theo cách; 5.4 đầu ra/độ phân giải/4 ô; 5.5 DPI–luồng–model Fusor + chọn thư mục; 5.6 **Dừng giữ model**, chỉ **✕** mới giải phóng; 5.7 Nhận dạng lại; 5.8 Buộc dừng; 5.9 Chọn vùng (kéo khung trên trang); 5.10 khung vùng đã nhận dạng; 5.11 toast; 5.12 **kết quả ghi vào lớp chữ của trang** để Dịch / Đọc to / Ghi chú / tìm kiếm dùng được ngay.

## 6. Kiểm tra trước khi giao
- [ ] 0 thẻ hở, 0 id trùng trong `pages/documents.html`; đủ mọi id gốc của khung xem.
- [ ] Trang Tài liệu render đủ, nút OCR bấm được, **không trắng trang**.
- [ ] jsdom + wiring + core xanh; CSS parse sạch; ZIP `unzip -tq` sạch, `manifest.json` ở gốc.
- [ ] Đối chiếu ảnh thật với demo: đầu popup có icon, danh sách ngôn ngữ xếp dọc, phụ đề “Trang N · …”, thẻ gợi ý + bóng đèn hoạt động.
