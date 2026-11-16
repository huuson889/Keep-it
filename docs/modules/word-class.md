# Word class — Hướng dẫn kỹ thuật

> Tài liệu định hướng; code là nguồn sự thật. Từ v3.5.290.

## 1. Mục đích và phạm vi

"Loại từ" (Word class / 품사) hiện loại từ viết tắt dưới mỗi từ tiếng Anh trên trang web: gạch chân màu rồi nhãn 12px (N, V, Adj…), danh từ liền nhau (kèm tiểu từ PART dính sau, như "City’s") chung một cột, một gạch N; tiểu từ dính sau giữ gạch và nhãn riêng ("N · Part"). Nhãn do mô hình `jdp8/bert-english-uncased-finetuned-pos` (q8, ~110 MB) gán theo ngữ cảnh, không danh sách từ; tải từ huggingface.co khi người dùng đồng ý, rồi chạy trên máy. Chỉ web, khung trên cùng.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/word-class/core.js`](../../js/word-class/core.js) | `LHN_WORD_CLASS_CORE` | Model id/URL, bảng UPOS → viết tắt (`POS`), màu, tách từ, `analyze`/`label`, gộp danh từ (`units`), HTML xem trước (`html`, `legend`). |
| [`js/word-class/engine.js`](../../js/word-class/engine.js) | ES module `handle({op})` | Chạy Transformers.js: `status`, `download`, `tag` (≤50 đoạn), `remove`. Cache `transformers-cache`; rảnh 3 phút thì giải phóng. |
| [`pages/word-class-engine.html`](../../pages/word-class-engine.html) | offscreen document | Chrome chạy engine ở đây; Firefox `import()` trong background page. |
| [`js/background/background.js`](../../js/background/background.js) | `wordClassMessage` | Router `WORD_CLASS_*`; TAG khi chưa có mô hình → `{needDownload:true}`. |
| [`js/word-class/page.js`](../../js/word-class/page.js) | `LHN_WORD_CLASS{enabled, pageOn, togglePage, toggleAt}` | Content script: cả trang, từng đoạn, thẻ thông báo, bảng chú thích, bọc/gỡ từ. |
| [`vendor/transformers/`](../../vendor/transformers/) | `transformers.min.js`, `ort-wasm-simd-threaded.{mjs,wasm}` | Transformers.js 3.8.1 + ONNX Runtime Web (WASM CPU); không tải code từ xa. |

## 3. Luồng chính

1. ☰ Loại từ / Alt+G → `togglePage()`; ☰ Loại từ đoạn (chạm chọn đoạn) / Alt+J (đoạn gần con trỏ) → `toggleAt(x, y)`. `content.js` phát sự kiện `lhn-word-class-command` .
2. Chưa có mô hình: thẻ "Tải mô hình loại từ?" → `WORD_CLASS_DOWNLOAD`, hiện %.
3. Cả trang: lấy đoạn từ `LHN_READER_BAR.mainBlocks()` (cùng danh sách Alt+A / Alt+R), IntersectionObserver gắn đoạn khi vào màn hình, cuộn thì quét thêm. Đoạn không phải tiếng Anh bị bỏ qua (thông báo một lần).
4. Mỗi đoạn: `WORD_CLASS_TAG` → `[[start, end, UPOS]]` → `CORE.label/units` → bọc từ trong `<lhn-wc>` (shadow đóng chứa nhãn), phần gạch trong `<lhn-wcu>`.
5. Bảng chú thích kính mờ góc phải trên (chỉ các nhãn đang có trên trang) hiện mỗi lần bật; rê chuột / chạm dòng hiện định nghĩa (`wc_def_*`); ☰ Chú thích hiện / ẩn tay; × ẩn đến lần bật sau, kéo đầu bảng để dời (lưu `lhnWordClassLegend`); `wordClassLegend` tắt tự hiện. Rê chuột: "book: danh từ · noun", danh từ riêng liền nhau gom một dòng. Chú thích: "N · Noun: Danh từ / Danh từ riêng".
6. Tắt: gỡ mọi `lhn-wc`/`lhn-wcu`, nối lại các text node đã tách → HTML như cũ. Thẻ "Đã tắt · Hoàn tác".
7. Cài đặt → Loại từ (`settings-ui.js` `wordClass()`): Hiện bảng chú thích, trạng thái mô hình + Tải / Xóa (Hoàn tác 5 giây rồi mới xóa), Xem trước gắn nhãn câu mẫu bằng mô hình thật.

## 4. Hợp đồng và quy tắc cần giữ

- Nhãn chỉ từ đầu ra mô hình. Bảng viết tắt và nghĩa (`wc_<UPOS>` trong `languages.js`) là quy ước hiển thị.
- Chữ trang chỉ được bọc: nhãn trong shadow đóng nên không bị đọc, dịch, chọn, sao chép. Reader bỏ `lhn-wc`/`lhn-wcu` khỏi `isTextBlock`.
- `wordClassEnabled` tắt là tắt mọi nơi (ô ☰, Alt+G / Alt+J, gỡ nhãn). Website đã tắt Keepit, YouTube: không chạy.
- Chrome: quyền `offscreen` + CSP `'wasm-unsafe-eval'`; `build_firefox.py` bỏ `offscreen`, Firefox chạy engine trong background page.
- Mô hình là dữ liệu tải về; JS/WASM luôn đóng gói. Đổi mô hình: sửa `core.js`, privacy, notices.

## 5. Kiểm tra và xác minh

- Static: `node --check` `js/word-class/*`.
- Extension thật: Cài đặt → Tải → xem trước có nhãn; Alt+G gắn đoạn tiếng Anh, bỏ đoạn khác, `innerText`/vùng chọn không đổi, tắt → HTML như cũ; Alt+J chỉ một đoạn; công tắc tổng tắt → gỡ nhãn, ẩn ô ☰, phím không tác dụng.
- Độ chính xác ~96% (UD EWT).
- Firefox: thử bản `build_firefox.py` thật.
