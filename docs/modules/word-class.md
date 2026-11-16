# Word class — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật. Có từ v3.5.290.

## 1. Mục đích và phạm vi

"Loại từ" (Word class / 품사) hiện loại từ viết tắt dưới mỗi từ tiếng Anh trên trang web: gạch chân màu rồi nhãn 12px (N, V, Aux V, Adj, Adv, Pron, Det, Prep, Conj, Num, Part, Interj, Sym), danh từ liền nhau dùng chung một gạch và một nhãn N. Nhãn do mô hình `jdp8/bert-english-uncased-finetuned-pos` (q8, ~110 MB, 17 nhãn UPOS) gán theo ngữ cảnh câu, không có danh sách từ cứng. Mô hình chỉ tải từ huggingface.co sau khi người dùng đồng ý, rồi chạy trên máy, không cần mạng. Chỉ web, khung trên cùng.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/word-class/core.js`](../../js/word-class/core.js) | `LHN_WORD_CLASS_CORE` | Model id/URL, bảng UPOS → viết tắt (`POS`), màu, tách từ, `analyze`/`label`, gộp danh từ (`units`), HTML xem trước (`html`, `legend`). |
| [`js/word-class/engine.js`](../../js/word-class/engine.js) | ES module `handle({op})` | Chạy Transformers.js: `status`, `download`, `tag` (≤50 đoạn), `remove`. Cache `transformers-cache`; rảnh 3 phút thì giải phóng (`WORD_CLASS_IDLE`). |
| [`pages/word-class-engine.html`](../../pages/word-class-engine.html) | offscreen document | Chrome: nơi chạy engine (lý do `WORKERS`). Firefox: background page `import()` engine trực tiếp. |
| [`js/background/background.js`](../../js/background/background.js) | `wordClassMessage` | Router `WORD_CLASS_STATUS/DOWNLOAD/TAG/REMOVE/IDLE`; TAG khi chưa có mô hình → `{needDownload:true}`. |
| [`js/word-class/page.js`](../../js/word-class/page.js) | `LHN_WORD_CLASS{enabled, pageOn, togglePage, toggleAt}` | Content script: chế độ cả trang, từng đoạn, thẻ thông báo, bọc/gỡ từ. |
| [`vendor/transformers/`](../../vendor/transformers/) | `transformers.min.js`, `ort-wasm-simd-threaded.{mjs,wasm}` | Transformers.js 3.8.1 + ONNX Runtime Web (WASM CPU); không tải code từ xa. |

## 3. Luồng chính

1. ☰ Loại từ / Alt+G → `togglePage()`; ☰ Loại từ đoạn (chạm chọn đoạn) / Alt+J (đoạn gần con trỏ) → `toggleAt(x, y)`. `content.js` phát sự kiện `lhn-word-class-command` ("page" / "block").
2. Chưa có mô hình: thẻ "Tải mô hình loại từ?" → `WORD_CLASS_DOWNLOAD`, thẻ hiện % theo `WORD_CLASS_STATUS`.
3. Cả trang: lấy đoạn từ `LHN_READER_BAR.mainBlocks()` (cùng danh sách Alt+A / Alt+R), IntersectionObserver gắn đoạn khi vào màn hình, cuộn thì quét thêm. Đoạn không phải tiếng Anh bị bỏ qua (thông báo một lần).
4. Mỗi đoạn: gom text node → `WORD_CLASS_TAG` → `[[start, end, UPOS]]` → `CORE.label/units` → tách text node, bọc từ trong `<lhn-wc>` (shadow DOM đóng chứa nhãn) và phần gạch trong `<lhn-wcu>`.
5. Tắt: gỡ mọi `lhn-wc`/`lhn-wcu`, nối lại các text node đã tách → HTML như cũ. Thẻ "Đã tắt · Hoàn tác".
6. Cài đặt → Loại từ (`settings-ui.js` `wordClass()`): trạng thái mô hình + Tải / Xóa (Hoàn tác 5 giây rồi mới xóa), Xem trước gắn nhãn câu mẫu bằng mô hình thật.

## 4. Hợp đồng và quy tắc cần giữ

- Không danh sách từ / luật cứng: nhãn chỉ từ đầu ra mô hình. Bảng viết tắt và nghĩa (`wc_<UPOS>` trong `languages.js`) là quy ước hiển thị.
- Chữ trên trang chỉ được bọc, không đổi: nhãn nằm trong shadow DOM đóng nên không thuộc text trang (không bị đọc, dịch, chọn, sao chép, ghi chú). Reader bỏ `lhn-wc`/`lhn-wcu` khỏi `isTextBlock`.
- `wordClassEnabled` (mặc định bật) tắt là tắt mọi nơi: ô ☰, phím Alt+G / Alt+J, gỡ nhãn đang hiện. Website đã tắt Keepit và YouTube: không chạy.
- Chrome cần quyền `offscreen` và CSP `'wasm-unsafe-eval'`; `scripts/build_firefox.py` bỏ `offscreen`. Firefox ≥147 chạy engine trong background page.
- Mô hình là dữ liệu tải về; JS/WASM luôn đóng gói. Đổi mô hình: sửa `core.js`, chính sách quyền riêng tư, `THIRD_PARTY_NOTICES.md`.

## 5. Kiểm tra và xác minh

- Static: `node --check js/word-class/{core,page}.js`, `node --input-type=module --check < js/word-class/engine.js`.
- Extension thật: Cài đặt → Tải → xem trước có nhãn; Alt+G gắn đoạn tiếng Anh, bỏ đoạn khác, `innerText`/vùng chọn không đổi, tắt → HTML như cũ; Alt+J chỉ một đoạn; công tắc tổng tắt → gỡ nhãn, ẩn ô ☰, phím không tác dụng.
- Độ chính xác (UD EWT test): q8 96,39% UPOS, viết tắt đúng ~95,7%; không hứa 100%.
- Firefox: thử bản `scripts/build_firefox.py` trên Firefox thật.
