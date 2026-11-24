# Demo 2.9.7.26 có gì — và bản app đang có gì

Nguồn: `/tmp/d29726` (giải nén `Demo/OCR-Keepit-giao-dien-v2.9.7.26.zip`).
Cột “Bằng chứng” là chỗ đối chiếu được bằng lệnh, không phải lời nói.

| # | Demo có | App (3.5.625) | Bằng chứng |
|---|---|---|---|
| 1 | Thẻ gợi ý vàng/tím + bóng đèn thu sau 10s | có | `#kpOcrVBanner`, `#kpOcrVBulb`, `js/ocr/ui.js` |
| 2 | Popup giữa, 5 nhóm + footer “Chạy trên máy” | có | `#kpOcrOcrModal` |
| 3 | Sidebar “Văn bản nhận dạng” trong khung xem | có | `.stageWrap > .kpOcrUi`, `aside#kpOcrTrPanel` |
| 4 | **Thẻ tiến độ `position:fixed; right:12px` ⇒ đè lên sidebar** | **sửa ở 3.5.625** | `style.css:268` ↔ `.kpOcrUi .kpOcrProg` |
| 5 | Khung vùng “Bổ sung vùng” cùng vị trí đó | có | `#kpOcrRegionEditor` |
| 6 | Khung chữ đã nhận dạng + hover tô sáng | **phụ thuộc bước ghi kết quả** — 3.5.625 bọc lỗi + `setBoxesVisible(true)` | `drawBoxes`, `.kpBoxLayer`, `.kpTrHover` |
| 7 | Nhật ký tiến độ từng bước | có | `#kpOcrPLog` + `raster …` / `apply: …` / `boxes: …` |
| 8 | Dừng giữ model, ✕ mới giải phóng | có | `run.js` `onClose` → `release()` |
| 9 | Kết quả ghi vào lớp chữ trang | có | `documents.js` `apply()` |

## Chưa kiểm được (thật, không giấu)
- Chưa chạy trên Chromium thật, chưa OCR thật trên PDF 16 trang ⇒ **vị trí pixel và hover chưa được xác nhận bằng mắt**.
- Không truy cập được tunnel trycloudflare của người dùng từ sandbox (chặn TLS, chỉ mở github/npm/pypi).
