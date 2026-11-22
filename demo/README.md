# Demo OCR PP-OCR trên trình duyệt

Demo này thay thế hướng VLM (PaddleOCR-VL) bằng pipeline PP-OCR nhỏ hơn nhiều:
**detection** (DB) tìm khung chữ, rồi **recognition** (CRNN/SVTR + CTC) đọc từng khung.
Mỗi dòng có tọa độ ngay từ đầu, nên không cần Tesseract và không cần ghép chữ bằng fuzzy matching.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html`, `app.js` | Giao diện: chọn ảnh/PDF, chạy OCR, xem khung, xuất TXT và PDF có lớp chữ |
| `ocr.js` | Pipeline PP-OCR: tiền xử lý, DB detection, batch recognition, CTC decode |
| `textlayer.js` | Ghi lớp chữ ẩn (render mode 3) vào PDF, giữ nguyên trang gốc |
| `server.py` | Server tĩnh có header COOP/COEP để ONNX Runtime chạy đa luồng |
| `models/` | `det.onnx` (PP-OCRv6 small det), `rec.onnx` (PP-OCRv6 small rec), `dict.txt` (từ điển) |
| `vendor/` | ONNX Runtime Web 1.22.0, pdf.js, pdf-lib, fontkit, font Noto Sans KR, kèm file license |
| `samples/` | Ảnh mẫu tiếng Anh và tiếng Việt, một trang A4 |
| `test/` | Test Node: `npm test` (OCR + ghi PDF), `npm run bench` (đo thời gian) |

## Chạy demo

```bash
cd demo
python3 server.py 8000
```

Mở `http://127.0.0.1:8000/`, chọn ảnh hoặc PDF, bấm **Chạy OCR**.
Model khoảng 31 MB, nạp trong vài giây. Mọi thứ chạy cục bộ, không gửi tài liệu đi đâu.

## Kết quả đo được

Đo trong sandbox với **1 vCPU, 1 luồng WASM**, không phải máy của bạn:

- Ảnh mẫu tiếng Anh (2 dòng): khoảng 1 giây.
- Trang A4 có 24 dòng tiếng Việt: phát hiện khoảng 1.0 giây, nhận dạng khoảng 10.5 giây.

Nhận dạng chiếm gần như toàn bộ thời gian. Lượng tử hóa int8 không giúp trên WASM. Số đo này
là mức chậm nhất. Trên máy nhiều nhân, bật đa luồng (server.py đã bật), thời gian sẽ thấp hơn đáng kể,
nhưng **bạn cần đo lại trên máy thật**. Chưa so sánh được trực tiếp với extension hiện tại vì chưa chạy được nó.

Để đo: `cd test && npm install && npm run bench` (chạy trên `samples/a4_vi.png`).

## Giới hạn quan trọng

1. **Dấu tiếng Việt chưa đầy đủ.** Từ điển của PP-OCRv6 không có một số chữ như ệ, ộ, ế, ễ, ố, ớ, ắ, ỉ, ị.
   Model không thể xuất các chữ này nên chúng bị bỏ mất, ví dụ "Cộng hòa" → "Cng hòa", "Việt" → "Vit".
   Các chữ bị bỏ không báo lỗi, nên phải đối chiếu với bản gốc. Model Latin đầy đủ hơn
   (`latin_PP-OCRv5_rec_mobile`) có trên ModelScope, nhưng sandbox không tải được nên chưa thử.
2. **Khung thẳng, không xoay.** Chữ nghiêng hoặc xoay sẽ có khung lớn hơn chữ thật.
   Cần thêm minAreaRect nếu có tài liệu xoay.
3. **Không nhận dạng bảng hay bố cục.** Chữ được đọc theo dòng, không có cấu trúc bảng.
4. **Chưa test trong trình duyệt thật.** Sandbox không có Chromium. Đã test bằng Node: `ocr.js` cho
   kết quả giống bản Python tham chiếu, và lớp chữ PDF đã được kiểm chứng bằng `pdftotext`
   (từ và vị trí khớp với ảnh gốc). Giao diện và luồng render PDF trong trình duyệt thì
   **chưa chạy thực tế**; hãy mở demo bằng Chrome và kiểm tra trước khi dùng.
5. **Giấy phép.** Model lấy từ các gói PyPI đóng gói lại (`rapidocr`, `onnxocr`), không phải kho chính thức
   của PaddleOCR (bị chặn trong sandbox). PP-OCR thường là Apache-2.0, nhưng hãy xác minh lại trước khi phát hành.

## Thay model nhận dạng

1. Đặt file ONNX (ví dụ `latin_PP-OCRv5_rec_mobile.onnx`) và từ điển vào `models/`.
   Từ điển là file text, mỗi dòng một ký tự, không có dòng trống cuối.
2. Trong `app.js`, đổi đường dẫn `models/rec.onnx` và `models/dict.txt`.
3. Số lớp đầu ra của model (chiều cuối của tensor đầu ra) phải bằng số dòng từ điển + 2 (blank và space).
   `ocr.js` không tự kiểm tra; nếu lệch, kết quả sẽ sai mà không báo lỗi.

## Tối ưu tiếp theo (nếu cần)

- Render trang kế tiếp trong khi model đang chạy trang hiện tại (pipeline).
- Dùng WebGPU (`executionProviders: ['webgpu']`) trên máy có GPU, sau khi kiểm tra model chạy được trên GPU.
- Giảm `detLimit` cho trang chữ to, tăng lên 1280–1600 cho trang chữ nhỏ.
