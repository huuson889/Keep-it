# DEMO 2.9.7.26 LÀM ĐƯỢC NHỮNG GÌ — bản ghi đầy đủ

Nguồn duy nhất: `Demo/OCR-Keepit-giao-dien-v2.9.7.26.zip`, đã giải nén ở `/tmp/d29726`.

| Tệp | Dòng | Vai trò |
|---|---|---|
| `index.html` | 308 | toàn bộ markup khung xem + OCR |
| `style.css` | 503 | toàn bộ CSS (1.0 = giao diện v3.5) |
| `glue.js` | 1289 | **toàn bộ hành vi UI** (thẻ gợi ý, popup, thẻ tiến độ, sidebar, hover, vùng, phím tắt) |
| `app.js` | 193 | mở tệp, dựng trang, 3 engine thật, xuất TXT/PDF, `window.keepitHook` |
| `region-plan.mjs`, `fusor/match.mjs`, `fusor/overlay.mjs` | — | dò vùng tự động, ghép vị trí chữ Fusor, dựng lớp chữ PDF |
| `tess-v9*`, `ppocr/`, `fusor/` | — | model + worker chạy trên máy |

Số dòng ghi dạng `tệp:dòng` để đối chiếu trực tiếp.

---

## 1. Mở tệp & khung xem

1. Mở **PDF, PNG, JPG, WEBP** (`app.js:181`); tệp khác ⇒ `Chỉ hỗ trợ PDF, PNG, JPG hoặc WEBP.`
2. Ba đường mở tệp: nút **Chọn tệp** ở trạng thái rỗng, nút **Thêm → Mở tệp**, và **kéo tệp vào trang**.
3. Trạng thái rỗng: icon, tiêu đề “Chưa có tài liệu”, mô tả, nút **Chọn tệp**, gợi ý “Kéo tệp vào đây cũng được”.
4. Thanh trên (46 px): ‹ về, bật/tắt dải trang, nhãn loại tệp (`PDF`), tên tệp, chuyển **Gốc/Đọc**, 5 công cụ (**Dịch · Đọc to · Loại từ · Ghi chú · Hỏi AI**), nút **OCR**, đổi giao diện, **Thêm**.
5. Nút OCR có **chấm màu**: **đỏ = trang chưa có lớp chữ**, **xanh = đã có** (`glue.js:210`).
6. Dải trang: dựng danh sách trang (`buildRail`, `glue.js:64`), **đánh dấu trang đang xem / đang nhận dạng** (`markRail`).
7. Trang hiển thị bằng `<canvas>` trong `#paper`; bề rộng `min(vùng xem − 48 px, bề rộng ảnh)` (`app.js:59`).
8. **Hiệu ứng quét** (`#scanFx`: dầm sáng + 2 tia) **chỉ chạy khi engine thật sự busy** — không chạy lúc đang hỏi “Nhận dạng lại…?”.
9. Pager: ‹ `[số trang]` `N / tổng` ›, chọn **cách xem**, chọn **thu phóng**, − / +, **toàn màn hình**, **menu ☰**.
10. Thu phóng: 72 % · 86 % · 100 % · 125 % · 150 % · 200 %, nút ±14 %, giới hạn 0.4–2.0, đồng bộ giữa pager và menu Thêm (`setZoom`, `glue.js:1078`).
11. Bảng **Thêm**: Chế độ xem, Chuyển trang, Thu phóng, **Mở tệp**, **Nhận dạng chữ (OCR)** (ghi “trang N” / “đã có lớp chữ”), **Chọn vùng để nhận dạng**, **Hiện khung vùng nhận dạng**, **Văn bản nhận dạng**.
12. Bấm ☰ ở pager cũng mở bảng Thêm.
13. **Toast** duy nhất ở đáy giữa (`#toast`), tự ẩn; mọi lỗi JS được bắt và hiện thành toast (`index.html:296`).

---

## 2. Thẻ gợi ý “chưa có lớp chữ” + bóng đèn

Thay hoàn toàn thanh vàng cũ.

| Hành vi | Chi tiết | Nguồn |
|---|---|---|
| Nội dung thẻ | icon bóng đèn + “Nhận dạng chữ” + câu giải thích + nút **Nhận dạng chữ** + ô **Không hiện lại** + ✕ | `index.html:44-56` |
| Câu giải thích gốc | “Trang này là ảnh quét nên chưa có lớp chữ — Dịch, Đọc to và Ghi chú chưa dùng được. Chạy nhận dạng để chọn, sao chép và tìm kiếm được chữ.” | `index.html:51` |
| Vị trí | góc trên-phải vùng xem, `position:absolute; right:14px; top:12px` | `style.css:59` |
| Tự thu | **10 000 ms** không tương tác ⇒ thu thành bóng đèn | `glue.js:147` |
| Hoãn tự thu | rê chuột vào / focus vào thẻ ⇒ dừng đếm; ra khỏi ⇒ đếm lại | `glue.js:173` |
| Vùng xem hẹp | **< 640 px** ⇒ không bung thẻ, chỉ hiện bóng đèn | `glue.js:148` |
| Bóng đèn | bấm ⇒ **luôn** bung lại, **kể cả** tệp đã tick “Không hiện lại” | `glue.js:182` |
| “Không hiện lại” | lưu **theo từng tệp**: `localStorage['keepit.ocrNoticeOff:<tên>\|<size>']` | `glue.js:137-140` |
| Bảng màu | mỗi lần bung chọn **ngẫu nhiên** hổ phách hoặc tím (`data-nt`) | `glue.js:143` |
| Đang chạy | mở thẻ tiến độ ⇒ thẻ gợi ý tự thu | `glue.js:1170` |
| Trang đã có chữ | ẩn cả thẻ và bóng đèn | `glue.js:166` |
| Nút trên thẻ | “Nhận dạng chữ” ⇒ thu thẻ + mở popup OCR; ✕ ⇒ thu thành bóng đèn | `glue.js:1166-1168` |
| Đổi tệp | trạng thái thông báo tính lại theo tệp mới | `glue.js:193` |

---

## 3. Popup cài đặt OCR (giữa màn hình)

### Đầu popup
Logo tím + **“Nhận dạng chữ (OCR)”** + phụ đề **“Trang N · chưa có lớp chữ”** / **“… · đã có lớp chữ gốc”** + chip phiên bản (demo ghi `v2.7.0`) + ✕.
Phụ đề cập nhật mỗi lần mở/đổi trang (`glue.js:199-217`).

### Nhóm 1 — Phạm vi trang
- Ba dòng radio: **Trang đang xem** *(trang N)* / **Tất cả các trang** *(N trang)* / **Từ trang** `[N]` ▾ **đến** `[N]` ▾ **trong N trang**.
- Ô số + nút ▾ **chỉ bật** khi chọn dòng thứ ba.
- ▾ mở **lưới số trang 1…N** (mỗi số một nút, số hiện tại tô đậm).
- Mặc định **1 … N**.
- Ràng buộc: sửa “từ” lớn hơn “đến” ⇒ “đến” kéo lên; sửa “đến” nhỏ hơn “từ” ⇒ “từ” kéo xuống (`clampPages`, `glue.js:653`).
- Xoá trống ô rồi gõ số mới được; rời ô mà trống ⇒ khôi phục 1 / N; **Enter** thoát ô.
- Bấm vào vùng “Từ trang / đến” (ngoài ô) ⇒ tự chọn radio dòng thứ ba và focus ô.
- Bấm ra ngoài lưới số ⇒ đóng lưới.

### Nhóm 2 — Ngôn ngữ tài liệu
- Ô tìm: **“Tìm ngôn ngữ… (Anh, Việt, Hàn)”**.
- Danh sách dọc 3 dòng, mỗi dòng: `☑ Tên — TênBảnNgữ`
  **Anh / English**, **Việt / Tiếng Việt**, **Hàn / 한국어**.
- Mặc định: **Anh + Việt bật, Hàn tắt** (`glue.js:694`).
- Dòng đang bật có nền tím nhạt; gõ lọc theo cả tên và tên bản ngữ; không khớp ⇒ **“Không có ngôn ngữ này”**.
- Dưới hộp: **“Đang chọn Anh + Việt.”** — cập nhật ngay khi tick/bỏ tick.

### Nhóm 3 — Cách nhận dạng
- Ba radio: **Chữ in · Tesseract** / **Nhanh · PP-OCR** / **Viết tay · Fusor**.
- Mặc định: **Tesseract**.
- Dưới là **câu gợi ý đổi theo cách chọn** (`#methodHint`).
- Đổi cách ⇒ **giải phóng engine cũ**, hiện nhóm tuỳ chọn tương ứng, giữ kết quả đã có theo trang.
- Chọn Fusor khi chưa có model ⇒ toast **“Fusor cần chọn thư mục model (~831 MB) trước khi chạy”**.

### Nhóm 4 — Kết quả trên tệp
- **Kiểu đầu ra**: “Ảnh gốc + lớp chữ ẩn”.
- **Độ phân giải dò**: 1280 px · chính xác *(mặc định)* / 960 px / 640 px · nhanh.
- Bốn ô tick (mặc định bật cả bốn):
  1. “Bỏ vùng chữ rất nhỏ khi chữ trên trang chênh lệch rõ”
  2. “Dừng khi cùng một dòng lặp 12 lần”
  3. “Giới hạn 90 giây mỗi vùng”
  4. **“Hiện khung vùng đã nhận dạng trên trang”**
- Ba ô đầu **ánh xạ thẳng** sang engine: `regionPolicy = main/all`, `loopGuard`, `regionTimeout = 90/0` (`syncFileOpts`, `glue.js:1023`).
- Ô thứ tư bật/tắt lớp khung **ngay lập tức**, không cần chạy lại.

### Nhóm 5 — Tuỳ chọn engine
- **Độ phân giải PDF (PP)**: ~108 DPI / **~144 DPI** / ~216 DPI.
- **Số luồng (Fusor)**: 1 / 2 / **4** / 6 / 8 luồng (trên 1 luồng cần SharedArrayBuffer).
- **Model Fusor**: nút **Chọn thư mục model** + dòng trạng thái (chưa chọn / đang kiểm tra / đang tải `x/y MB` / sẵn sàng `… giây`).
- **Phương pháp (Fusor)**: **Tự động** / Từng vùng chữ / Toàn trang.
- **Ưu tiên vùng** (chỉ bật khi Phương pháp = Từng vùng): Ưu tiên chữ chính / Mọi vùng phát hiện.
- Hàng không thuộc cách đang chọn thì **mờ đi (`opacity .45`), không ẩn** — người dùng vẫn thấy có gì.

### Chân popup
- Trái: **“Chạy trên máy · tệp không rời máy”**.
- Phải: **Hủy** + **Nhận dạng chữ**.
- Nút chạy **khoá** khi: chưa có tệp, đang chạy, hoặc Fusor chưa chọn thư mục model.

### Đóng / huỷ
| Thao tác | Kết quả | Nguồn |
|---|---|---|
| ✕ hoặc **Hủy** | **Huỷ** — khôi phục đúng cấu hình lúc mở | `glue.js:545` |
| Bấm **nền mờ** | **Đóng và GIỮ** thay đổi | `glue.js:648` |
| **Nhận dạng chữ** | Đóng, lưu cấu hình, mở thẻ tiến độ | `glue.js:300-356` |
| Esc | đóng popup (như Hủy) | `glue.js:1273` |
| Mở lại | **cuộn về đầu**, danh sách ngôn ngữ đầy đủ | `glue.js:465` |

### Chặn trước khi chạy
- Tesseract mà **không tick ngôn ngữ nào** ⇒ toast “Chọn ít nhất một ngôn ngữ”, **popup không đóng**.
- Chưa có tệp ⇒ “Mở tệp trước đã”.

---

## 4. Thẻ tiến độ (dưới-phải, **đè lên sidebar**)

Vị trí đúng demo: `position:fixed; right:12px; bottom:calc(var(--sideBottom,0px) + 8px); z-index:79; width:380px` (`style.css:268`, `:489`).
Màn hẹp **< 820 px**: `left:8px; right:8px; width:auto` (`style.css:374`).
`--sideBottom` = **đo thật** khoảng cách từ đáy sidebar tới đáy cửa sổ (`glue.js:1110-1122`).

### Bốn trạng thái
| Trạng thái | Tiêu đề | Chấm | Lớp |
|---|---|---|---|
| đang chạy | **Đang nhận dạng chữ** | tím nhấp nháy | (không lớp) |
| xong | **Đã nhận dạng xong** | xanh lá | `.done` |
| dừng tay | **Đã dừng nhận dạng** | cam | `.stopped` |
| lỗi | **Nhận dạng chưa hoàn tất** | đỏ `#e0533d` | `.error` |

### Nội dung
- Góc phải tiêu đề: **“Trang N/M”**.
- Dòng trạng thái + **đồng hồ “X giây”** (tách khỏi `#status` bằng regex, `glue.js:257`).
- Thanh tiến độ (`<progress>`), gradient tím.
- **Nhật ký 3 dòng**, mới nhất lên trên, bỏ dòng trùng, **bỏ spam** “Tesseract đang nhận dạng: N%” (`glue.js:246-254`).
- Khối tổng kết khi xong/dừng/lỗi:
  - **“Hoàn tất N/N trang · X giây”**
  - **“Chưa hoàn tất N/N trang · X giây”**
  - **“Đã dừng N trang đã xử lý được”**
- Dòng cảnh báo tương ứng (lỗi / dừng) với lời khuyên “bấm Nhận dạng lại”.

### Nút
| Nút | Luôn có | Hành vi |
|---|---|---|
| **Dừng** | khi đang chạy | Dừng **mềm**: engine dừng, **model Fusor vẫn nằm trong RAM**; UI “Đã dừng” hiện ngay và **giữ 4 giây** |
| **Buộc dừng** | khi treo > 45 s | Cắt cứng, **giải phóng engine** |
| **Nhận dạng lại** | sau khi kết thúc | Mở lại popup cấu hình (giữ cấu hình cũ) |
| **Chọn vùng** | sau khi kết thúc | Vào chế độ “Bổ sung vùng” |
| **✕** | luôn (khoá khi đang chạy) | Đóng thẻ **và giải phóng engine/model khỏi RAM** |

- Dừng ở chế độ **Fusor không bao giờ** gọi `forceIdle` (tránh xoá model); lưới an toàn 1,5 s **bỏ qua** khi mode = fusor.
- Lượt chạy mới tăng `stopSeq` ⇒ mọi “buộc dừng” của lượt cũ bị vô hiệu.
- **Canh gác treo**: mỗi **900 ms** so chữ ký `status|progress|trang`; **45 s** không đổi ⇒ hiện **Buộc dừng** + toast “Engine không phản hồi — bấm “Buộc dừng” để thoát” (`glue.js:1191-1205`).
- Đang chạy ⇒ **khung xem tự nhảy tới trang đang nhận dạng** và đánh dấu ở dải trang.
- Nhận dạng **vùng** xong ⇒ **không** bật thẻ “Đã nhận dạng xong”, chỉ cập nhật bảng chữ.
- Mỗi lượt mới **xoá sạch** nhật ký + dòng tổng kết của lượt trước.
- Đóng popup xong mà engine **không chạy** (vd. trang đã có chữ) ⇒ **mở lại popup** như cũ.

---

## 5. Sidebar “Văn bản nhận dạng”

- Nằm **trong khung xem**, đẩy trang vào giữa; rộng `min(380 px, 42 vw)`, đóng thì rộng 0 (`style.css:161-162`).
- **Tự mở ngay khi bấm Nhận dạng chữ** — không đợi có kết quả.
- Header: tiêu đề + **6 nút**: sao chép · tải TXT · tải PDF có lớp chữ · chọn vùng · **áp dụng** · ✕.
- Ô chữ **sửa trực tiếp**; sửa ⇒ nút Áp dụng bật; Áp dụng ⇒ lưu vào trang + toast **“Đã lưu chữ đã sửa cho trang N”**; đang chạy ⇒ toast “Đang nhận dạng — đợi xong rồi lưu”.
- **✕ đóng = bỏ mọi sửa chưa áp dụng** (khôi phục chữ gốc của trang).
- **Kéo mép trái** đổi độ rộng: **280 px … min(760 px, 70 % màn hình)**, **nhớ theo máy** (`localStorage['keepit.trWidth']`, `glue.js:1125`).
- Chỗ trống: “Văn bản nhận dạng của trang sẽ hiện ở đây. Sửa trực tiếp được.”
- Nút chọn vùng ở sidebar và ở thẻ tiến độ **cùng một hành vi**.

---

## 6. Hover 2 chiều (trái tim của demo)

### 6.1 Trỏ trong ô chữ ⇒ tô trên trang
- Tô **khung tím đúng từng khung chữ** của dòng đó (không gộp thành khung bao).
- Đồng thời tô **nền dòng** trong ô chữ.
- Ba lớp dò, dừng ở lớp nào có kết quả:
  1. **khớp chữ** của dòng (`boxesForLine`);
  2. **khớp cụm hình học** (gom box theo hàng/cột, chọn cụm gần tỉ lệ dòng nhất — `clustersOf`, `clusterForLine`);
  3. **băng ngang theo tỉ lệ** (nửa chiều cao dòng).
- Chốt an toàn: bỏ khung có chiều cao **> 50 %** trang hoặc diện tích **> 35 %** (khung rác).
- Vị trí dòng trong `<textarea>` được đo bằng **bản sao ẩn** cùng font/padding/border rồi **tìm ký tự theo toạ độ Y** (textarea không cho biết dòng đang trỏ) — `mirrorOf`, `charAtOffsetY`.
- Trỏ xuống **khoảng trắng dưới dòng cuối** ⇒ không tô gì.

### 6.2 Trỏ trên khung chữ ⇒ sáng dòng trong bảng
- Tô đúng khung đang trỏ (không tô cả cụm).
- **Tự cuộn** ô chữ tới dòng tương ứng (giữa ô).
- Rời khung / rời trang / cuộn ⇒ tắt ngay.

### 6.3 Lớp khung xanh
- Chỉ hiện khi **sidebar mở** **và** ô “hiện khung vùng” bật (`syncLayerBoxes`, `glue.js:890`).
- Đóng sidebar ⇒ tắt khung xanh và tắt luôn tô sáng.

---

## 7. “Bổ sung vùng”

Vào bằng: nút **Chọn vùng** ở thẻ tiến độ, icon ở sidebar, hoặc menu Thêm.

Khi vào (`startRegionMode`, `glue.js:570`):
1. Thu thẻ gợi ý thành bóng đèn.
2. **Tạm ẩn thẻ tiến độ** (nhớ trạng thái để trả lại).
3. Mở sidebar để thấy chữ đã có.
4. **Bật hết khung đã nhận dạng** (nhớ trạng thái ô để trả lại).
5. Toast “Kéo trên trang để chọn vùng — chọn được nhiều vùng liền nhau”.

Trong chế độ:
- Kéo **nhiều vùng liền nhau** trên trang; có khung đỏ xem trước + lớp vết chọn.
- Hộp **Bổ sung vùng**: tiêu đề + “Chọn một hoặc nhiều vùng”, ô chữ (“mỗi dòng một hàng”), 3 nút **Nhận dạng vùng** / **Áp dụng** / **Hủy**.
- **Nhận dạng vùng**: cắt đúng phần đã chọn rồi chạy engine trên phần đó, ghép toạ độ về trang.
- **Áp dụng** chỉ bật khi ô chữ có nội dung.
- Đóng hộp ⇒ **trả lại thẻ tiến độ** nếu trước đó đang hiện; khôi phục ô “hiện khung”.
- Thẻ tiến độ hiện ⇒ **tự tắt** chế độ chọn vùng (kèm dọn sâu ở nhịp sau, không chặn vẽ thẻ).
- Đang chạy OCR ⇒ chặn vào vùng (“Đang nhận dạng — đợi xong rồi sửa vùng”); chưa có tệp ⇒ “Mở tệp trước khi sửa vùng”.

---

## 8. Ba engine thật, chạy hoàn toàn trên máy

### 8.1 Tesseract — “Chữ in”
- Gói offline `tess-v9` + `tess-v9-data`; ngôn ngữ eng / vie / kor.
- PSM 3, `preserve_interword_spaces`, DPI 300.
- Độ phân giải dò theo ô 1280/960/640 (tính theo cạnh ngắn, chặn 16 MP).
- **Với ảnh**: chạy **4 lượt** — raw (PSM 3), gray (11), mixed (3), v6 (tiền xử lý) — rồi **hợp nhất** kết quả (`tessRun`).
- Trạng thái tiến trình theo % của engine.
- **Chờ `terminate()` cũ** trước khi tạo worker mới (chống lỗi `postMessage` trên null).
- **Thử lại 1 lần** khi worker chết giữa trang.
- **1 trang lỗi không giết cả lượt**: bỏ qua trang đó, chạy tiếp, cuối lượt báo `Xong 15/16 trang · 1 trang chưa đọc được (đã bỏ qua): <lý do>`.

### 8.2 PP-OCR — “Nhanh”
- Model ONNX `det` + `rec` + `dict` cục bộ trong `ppocr/models/` (~32 MB).
- Chạy trong **worker** (`ppworker.js`); worker lỗi ⇒ **tự chạy lại ở luồng chính**.
- `detLimit` 640–1600; độ phân giải PDF ~108/144/216 DPI.
- Trả **box theo dòng**; ghi rõ “tiếng Việt có thể mất dấu”.

### 8.3 Fusor — “Viết tay”
- Model ~**831 MB** tải từ Hugging Face **vào thư mục bạn chọn** bằng `showDirectoryPicker` (có hộp xác nhận dung lượng, không gửi tài liệu đi).
- Worker `fusor/engine/engine.js`, 1–8 luồng (trên 1 luồng cần SharedArrayBuffer).
- 3 phương pháp: **Tự động** / **Từng vùng** / **Toàn trang**; “Ưu tiên chữ chính” hoặc “Mọi vùng”.
- **Timeout vùng** 60 / 90 / 180 giây / không giới hạn; quá hạn ⇒ dừng engine, **không áp kết quả**.
- **Chặn lặp** (cùng một dòng lặp 12 lần ⇒ dừng, đánh dấu `truncated`).
- **Stream token** ra dòng trạng thái.
- Sau khi có chữ ⇒ **ghép vị trí** với box Tesseract (`fusor/match.mjs`) để chữ chọn được trên trang; từ chưa ghép được thì ghi rõ là không chọn được.

### 8.4 Dò vùng tự động
`region-plan.mjs`: đếm số vùng, so cỡ chữ; ít vùng ⇒ đọc cả trang; nhiều vùng cỡ chênh lệch ⇒ **bỏ vùng rất nhỏ**; nhiều vùng đều cỡ ⇒ đọc mọi vùng. Đây là ý nghĩa ô “Bỏ vùng chữ rất nhỏ…”.

---

## 9. Kết quả & xuất

- Kết quả lưu **theo từng trang** (`results: Map`) — chuyển trang qua lại vẫn còn, đổi cách nhận dạng vẫn giữ.
- **Lớp chữ thật trên trang**: mỗi từ một `span`, định vị bằng %, cỡ chữ theo chiều cao khung, **co giãn ngang bằng `scaleX`** cho khớp bề rộng khung (`drawLayer`, `app.js:60`).
- Chọn chữ bằng chuột như chữ thật; kết quả dùng ngay cho khung xem.
- **Sao chép**: chép văn bản trang hiện tại; lỗi clipboard ⇒ chọn hết + “Nhấn Ctrl+C để sao chép.”
- **Tải TXT**: `ket-qua-ocr.txt`, chia khối `--- Trang N ---`; nếu có trang dở/thừa ⇒ **hỏi xác nhận** trước khi tải.
- **Tải PDF có lớp chữ**: dựng lại bằng `pdf-lib` + `fontkit` + `fusor/overlay.mjs`, nhúng lớp chữ **ẩn** theo box, **bỏ qua trang đã có chữ gốc**, tên `<tên>-co-lop-chu.pdf`, báo “Đã xuất PDF: N khung chữ; bỏ qua M trang đã có chữ”.
- Trạng thái luôn nói rõ kết quả **có thể thiếu** khi lượt chạy bị dừng/lỗi.

---

## 10. Phím tắt & tiện dụng

- **Esc** theo thứ tự ưu tiên: đóng lưới số trang → đóng “Bổ sung vùng” → đóng popup OCR → đóng bảng Thêm → đóng sidebar → ẩn thẻ tiến độ (khi không chạy).
- **← / →**: trang trước / sau (bỏ qua khi đang gõ trong ô nhập).
- Gõ số trang để nhảy; Enter để thoát ô số.
- Nút toàn màn hình; bật/tắt dải trang.
- Mọi lỗi JS hiện thành toast thay vì hỏng im lặng.

---

## 11. Demo **KHÔNG** làm (đừng nhầm là phải có)

| Mục | Thực tế trong demo |
|---|---|
| Dịch · Đọc to · Loại từ · Ghi chú · Hỏi AI | bấm chỉ ra toast “Bản này mới nối OCR + lớp chữ; “…” chưa nối” |
| Chế độ **Đọc** | toast “Chế độ Đọc cần lớp chữ của app — chưa nối” |
| **Cách xem** (Từng trang / Cuộn liên tục / Hai trang) | toast “Cách xem: … — chưa nối ở bản này” |
| Chế độ xem trong bảng Thêm | toast “(bản này chỉ có lớp chữ)” |
| Thư viện tệp, ghi chú, dịch, tìm kiếm toàn tệp | **không có** |
| Đa ngôn ngữ giao diện | **không có** (chỉ tiếng Việt) |

Nói cách khác: demo = **khung xem một tệp + OCR + lớp chữ + xuất**, không phải toàn bộ ứng dụng.

---

## Phụ lục A — `window.keepitHook` (hợp đồng giữa `glue.js` và `app.js`)

`glue.js` gọi **10 hàm**; số lần gọi trong ngoặc:

| Hàm | Ý nghĩa | Số lần |
|---|---|---|
| `isBusy()` | engine đang chạy | 16 |
| `getCurrent()` | trang đang xem | 8 |
| `getTotal()` | tổng số trang | 6 |
| `getResults()` | Map kết quả theo trang (`.{get,size}`) | 6 |
| `goTo(n, silent?)` | nhảy tới trang | 3 |
| `getDoc()` | tài liệu đang mở | 3 |
| `forceIdle(gen?, hard?)` | dừng mềm / cắt cứng | 2 |
| `releaseEngines()` | giải phóng model khỏi RAM | 1 |
| `getMode()` | `tess` / `pp` / `fusor` | 1 |
| `applyText(page, text)` | lưu chữ đã sửa cho trang | 1 |

Chiều ngược lại, `app.js` gọi **`window.onKeepitState({busy,current,total,has})`** mỗi khi trạng thái đổi (`app.js:50`), và ghi trạng thái chữ vào `#status` (có dạng `"… · 7.4 giây"`).

Hook phục vụ kiểm thử: `window.__keepitHover`, `window.__keepitLineForBox`, `window.__keepitLineMap`, `window.__keepitNotice`, `window.__keepitSyncRegion`, `window.__keepitStallMs`.

---

## Phụ lục B — hằng số, thời gian, khoá lưu

| Tên | Giá trị | Nguồn |
|---|---|---|
| Tự thu thẻ gợi ý | 10 000 ms | `glue.js:147` |
| Ngưỡng vùng xem hẹp | 640 px | `glue.js:148` |
| Khoá “Không hiện lại” | `keepit.ocrNoticeOff:<tên>\|<size>` | `glue.js:137` |
| Khoá độ rộng sidebar | `keepit.trWidth` | `glue.js:1125` |
| Độ rộng sidebar | 280 px … min(760 px, 70 vw) | `glue.js:1126` |
| Giữ UI “Đã dừng” | 4 000 ms | `glue.js:1253` |
| Lưới an toàn sau Dừng | 1 500 ms (bỏ qua ở Fusor) | `glue.js:1262` |
| Coi là treo | 45 000 ms không đổi trạng thái | `glue.js:1192` |
| Nhịp canh gác | 900 ms | `glue.js:1194` |
| Nhật ký thẻ tiến độ | 3 dòng | `glue.js:253` |
| Thẻ tiến độ | `fixed; right:12px; bottom: var(--sideBottom)+8px; z-index:79; width:380px` | `style.css:268`, `:489` |
| Thẻ tiến độ màn hẹp | `< 820 px`: giãn 2 mép | `style.css:374` |
| Thẻ gợi ý / bóng đèn | `absolute; right:14px; top:12px` | `style.css:59`, `:73` |
| Sidebar | rộng 0 → `min(380px, 42vw)` khi `.open` | `style.css:161-162` |
| Chờ engine rảnh trước khi chạy lại | tối đa 2 000 ms | `glue.js:325` |

---

## Phụ lục C — nhãn tiếng Việt gốc (dùng để port đúng từng chữ)

- Khung xem: `Gốc` · `Đọc` · `Dịch` · `Đọc to` · `Loại từ` · `Ghi chú` · `Hỏi AI` · `OCR` · `Thêm` · `Chưa mở tệp`
- Trạng thái rỗng: `Chưa có tài liệu` · `Chọn tệp` · `Kéo tệp vào đây cũng được`
- Thẻ gợi ý: `Nhận dạng chữ` · `Không hiện lại` · câu giải thích ở mục 2
- Popup: `Nhận dạng chữ (OCR)` · `Trang N · chưa có lớp chữ` · `Phạm vi trang` · `Trang đang xem` · `Tất cả các trang` · `Từ trang` · `đến` · `trong N trang` · `Ngôn ngữ tài liệu` · `Tìm ngôn ngữ… (Anh, Việt, Hàn)` · `Đang chọn Anh + Việt.` · `Không có ngôn ngữ này` · `Cách nhận dạng` · `Chữ in` · `Tesseract` · `Nhanh` · `PP-OCR` · `Viết tay` · `Fusor` · `Kết quả trên tệp` · `Kiểu đầu ra` · `Ảnh gốc + lớp chữ ẩn` · `Độ phân giải dò` · `1280 px · chính xác` · `960 px` · `640 px · nhanh` · `Bỏ vùng chữ rất nhỏ khi chữ trên trang chênh lệch rõ` · `Dừng khi cùng một dòng lặp 12 lần` · `Giới hạn 90 giây mỗi vùng` · `Hiện khung vùng đã nhận dạng trên trang` · `Tuỳ chọn engine` · `Độ phân giải PDF` · `Số luồng` · `Model Fusor` · `Chọn thư mục model` · `Phương pháp` · `Tự động · chọn theo từng ảnh` · `Từng vùng chữ` · `Toàn trang` · `Ưu tiên` · `Chạy trên máy · tệp không rời máy` · `Hủy` · `Nhận dạng chữ`
- Thẻ tiến độ: `Đang nhận dạng chữ` · `Đang chuẩn bị…` · `Trang N/M` · `Dừng` · `Buộc dừng` · `Nhận dạng lại` · `Chọn vùng` · `Đã nhận dạng xong` · `Nhận dạng chưa hoàn tất` · `Đã dừng nhận dạng` · `Hoàn tất N/N trang · X giây`
- Sidebar: `Văn bản nhận dạng` · `Sao chép văn bản` · `Tải tệp TXT` · `Tải PDF có lớp chữ` · `Chọn vùng để bổ sung chữ` · `Áp dụng phần chữ đã sửa` · `Đóng (không lưu thay đổi)` · `Văn bản nhận dạng của trang sẽ hiện ở đây. Sửa trực tiếp được.`
- Bổ sung vùng: `Bổ sung vùng` · `Chọn một hoặc nhiều vùng` · `Chữ trong vùng đã chọn · mỗi dòng một hàng` · `Nhận dạng vùng` · `Áp dụng` · `Hủy`
- Toast: `Đã dừng` · `Xong · kéo chuột trên trang để chọn chữ` · `Đã đóng thẻ và giải phóng engine khỏi RAM` · `Engine không phản hồi — bấm “Buộc dừng” để thoát` · `Đã buộc dừng engine — có thể chạy lại`

---

# BẢN CHỐT — quyết định thi hành (2026-11-22)

Chốt với người dùng qua thảo luận. Từ đây mọi bản giao phải đối chiếu **mục 1→11 + Phụ lục A–C** ở trên, và 4 quyết định dưới đây. Không tự thêm, không tự bớt.

## QĐ-0. Nguyên tắc gốc

1. **BASE = v3.5.611** (`4179a66`). v3.5.611 **không có OCR**: không có `js/ocr/*`, không có `css/dashboard/ocr.css`, `pages/documents.html` 128 dòng với **0** lần xuất hiện chữ “ocr”, `js/dashboard/documents.js` **0** lần. ⇒ Đây là **dựng mới tầng OCR trên nền 611**, không phải ghép vào chỗ có sẵn.
2. **Giao diện demo giữ 100%**: markup, CSS, nhãn, thứ tự, con số (10 000 ms, 640 px, 45 s, 900 ms, 3 dòng nhật ký, 280…min(760,70vw)). Đổi duy nhất phần **tên lớp** theo QĐ-2.
3. **Không sửa `glue.js` về hành vi.** Mọi khác biệt giữa demo và Keepit được xử lý **phía sau** bằng lớp cầu nối (QĐ-3). Sửa hành vi demo = sai.
4. **Mọi thứ khác ngoài OCR của Keepit không được đổi**: thư viện, Dịch, Đọc to, Loại từ, Ghi chú, Hỏi AI, ghi chú, tìm kiếm, cài đặt, dark mode theo hệ thống.
5. Chỉ báo “đạt” khi có **ảnh + số đo** từ extension thật (AGENTS.md 3.4). Không có thì ghi rõ **“chưa kiểm được”**.

## QĐ-1. Chế độ quét: **1 trang, không zoom — đúng demo**

Vì sao: demo chỉ có **một** `#paper` + `#canvas` + `#layer`, **không zoom thật**. Keepit có `#pageStack` nhiều trang + zoom. Để phần khó nhất (khung chữ, hover, khung vùng) dùng **nguyên công thức của demo**, lúc chạy OCR phải đưa khung xem về đúng điều kiện demo.

**Khi bấm “Nhận dạng chữ”:**
1. Ghi nhớ cách xem + mức thu phóng hiện tại của người dùng.
2. Chuyển khung xem sang **1 trang**, tắt zoom/`fit`, tắt cuộn liên tục, tắt hai trang.
3. Vẽ trang đang nhận dạng vào **một canvas riêng, kích thước cố định** (tương đương `#paper` của demo); `#paper` này là **cha của lớp chữ, lớp khung, lớp tô sáng, lớp chọn vùng** — giống hệt cấu trúc demo.
4. Mọi toạ độ box/hover/vùng tính **0..1 theo canvas đó** ⇒ dùng nguyên `drawLayer`, `paintHoverHighlight`, `clusterForLine`, `boxesAtRatio` của demo, **không suy ra từ zoom**.
5. Khi chạy nhiều trang: nhảy trang như demo (`followRunPage`), mỗi lần **một** trang.
6. **Kết thúc lượt (xong / dừng / lỗi):** trả lại đúng cách xem + thu phóng đã nhớ; kết quả ghi vào lớp chữ của trang theo **tỉ lệ %** nên vẫn đúng ở mọi mức zoom.
7. Người dùng đổi trang / đổi zoom **giữa lúc chạy** ⇒ thoát chế độ quét về khung xem thường, lượt chạy dừng như bấm “Dừng” (kèm toast đúng demo), không để trạng thái nửa vời.

Hệ quả được chấp nhận: trong lúc chạy, khung xem tạm khoá 1 trang — **đúng như demo**.

## QĐ-2. Đổi tên `.translation` → `.kpOcrPanel` (chỉ đổi tên, không đổi pixel)

`.translation` trong demo là **sidebar “Văn bản nhận dạng”** (`<aside class="translation" id="trPanel">`, `style.css:161-162`, `:421-422`), mượn tên panel Dịch của app. Giữ tên đó sẽ có ngày đè panel Dịch thật.

| Demo | Keepit | Vai trò |
|---|---|---|
| `.translation` | `.kpOcrPanel` | khung sidebar, `width:0` |
| `.translation.open` | `.kpOcrPanel.kpOpen` | `width:var(--trW, min(380px, 42vw))` |
| `.trBody` | `.kpOcrPanelBody` | vùng chứa ô chữ |
| `.trHover` | `.kpOcrLineHover` | tô nền dòng đang trỏ |
| `.trResize` | `.kpOcrGrip` | grip kéo rộng (280…min(760,70vw)) |
| `#trPanel` | `#kpOcrTrPanel` | id |
| `#text` | `#kpOcrText` | ô chữ sửa được |
| `#trHover` | `#kpOcrTrHover` | dòng tô |
| `#trResize` | `#kpOcrTrResize` | grip |

Điều kiện: sau khi đổi tên, **không còn** selector `.translation`/`.trBody`/`.trHover`/`.trResize`/`#trPanel`/`#text` nào do OCR sinh ra; CSS của panel Dịch trong `documents.css` **giữ nguyên không đụng**.

## QĐ-3. Tám điểm nối (cầu nối phía sau, giao diện không đổi)

Ngoài “màn hình đọc file”, đây là 8 chỗ buộc phải viết cầu — sai ở đây là nguyên nhân của mọi lỗi “có chữ mà không có khung / thẻ báo sai”.

| # | Demo | Keepit | Cách xử lý chốt |
|---|---|---|---|
| 1 | `window.keepitHook` (10 hàm: `isBusy` 16, `getCurrent` 8, `getTotal` 6, `getResults` 6, `goTo` 3, `getDoc` 3, `forceIdle` 2, `releaseEngines`, `getMode`, `applyText`) | không có | Viết adapter đúng 10 hàm, **không** sửa `glue.js` |
| 2 | Engine ghi vào `#status` / `#progress` / `#progPage` | engine phát callback `onProgress` | Dựng lại **đúng 3 phần tử** đó, callback ghi vào ⇒ `glue.js` chạy nguyên |
| 3 | `results: Map<page,{text,boxes,partial,truncated}>` | `activeEngine.pages[i].texts/paragraphs` + `.pdfTextLayer` | Đồng bộ 2 chiều: `apply` → mô hình trang; sửa tay → `applyText` |
| 4 | Một `#layer` trong `#paper` | mỗi trang một `.pdfTextLayer` trong `.docsSource` | Ở chế độ quét: 1 lớp theo canvas (QĐ-1); ở khung xem thường: định vị theo % |
| 5 | Đọc `File` → pdf.js | blob trong IndexedDB + engine riêng (`refreshRaster`, `refreshDetail`, thumbnail) | Lấy pixel qua engine Keepit, không mở lại tệp |
| 6 | Nhãn tiếng Việt cứng | bắt buộc **en/vi/ko** (`docs/code-rules.md`) | Chữ Việt **nguyên văn** Phụ lục C; en/ko là bản dịch tương ứng |
| 7 | Token màu khai trong `.kpOcrUi` | `css/shared/ui-tokens.css` + `.dark` | Map token; dark mode phải đúng |
| 8 | Không CSP | `pages/documents.html` CSP chặt (`worker-src 'self' blob:`, `script-src 'self' 'wasm-unsafe-eval'`) | Worker wasm (tess/pp-ocr) chạy dưới CSP của app; không nới CSP |

## QĐ-4. Môi trường kiểm thử (AGENTS.md 3.4) — **đang thiếu 3 file**

Đo thực tế trong sandbox này:

| Hạng mục | Kết quả |
|---|---|
| `chromium`, `google-chrome`, `playwright`, `xvfb-run` | không có |
| `~/.cache/ms-playwright` | không có |
| `registry.npmjs.org` | 200 (mở) |
| `cdn.playwright.dev` · `storage.googleapis.com` · `deb.debian.org` | **000 (chặn)** |
| Đường vòng: `@sparticuz/chromium` + `playwright-core@1.55.0` từ npm | cài được, có binary `/tmp/chromium` |
| Chạy thử binary | **exit 127** — `ldd` thiếu **đúng 3**: `libnss3.so`, `libnssutil3.so`, `libnspr4.so` |

⇒ Chỉ còn thiếu **3 file `.so`**. Có 3 cách, chờ người dùng chọn:

- **(a)** cho phép lấy 3 `.so` từ host được mở (GitHub/npm) ⇒ Chromium chạy ⇒ **làm đủ 3.4** (ảnh 1512/390, sáng/tối, phóng 4×, console rỗng);
- **(b)** người dùng chụp ảnh từ Chrome của mình theo checklist trong file này;
- **(c)** chỉ kiểm bằng jsdom + số đo tĩnh, và **mọi báo cáo ghi rõ “chưa kiểm được bằng ảnh”**.

## QĐ-5. Tiêu chí nghiệm thu (đối chiếu từng mục)

| Mục | Đạt khi |
|---|---|
| 1 | mở được PDF/PNG/JPG/WEBP; 3 đường mở tệp; chấm đỏ/xanh trên nút OCR; hiệu ứng quét chỉ khi busy |
| 2 | 10 000 ms tự thu · 640 px thu gọn · `keepit.ocrNoticeOff:<tên|size>` · 2 bảng màu ngẫu nhiên · bóng đèn luôn mở lại |
| 3 | đủ 5 nhóm + chân popup; ✕/Hủy = huỷ, nền mờ = giữ; thiếu ngôn ngữ thì không đóng popup |
| 4 | `fixed right:12px; bottom:8px; width:380px`; 4 trạng thái + 4 màu chấm; Dừng giữ model; ✕ giải phóng; 45 s/900 ms |
| 5 | mở ngay khi bấm OCR; 6 nút; kéo 280…min(760,70vw) nhớ `keepit.trWidth`; đóng = bỏ sửa |
| 6 | 3 lớp dò (chữ → cụm → băng tỉ lệ); chốt >50 %/>35 %; hover 2 chiều; khung xanh chỉ khi sidebar mở |
| 7 | nhiều vùng; 3 nút; đóng hộp trả lại thẻ tiến độ; thẻ hiện thì tắt chọn vùng |
| 8 | Tesseract (PSM 3, 4 lượt cho ảnh, thử lại 1 lần) · PP-OCR (~32 MB, worker → fallback) · Fusor (chọn thư mục, 1–8 luồng, 3 phương pháp, timeout vùng, chặn lặp, ghép vị trí) |
| 9 | sao chép · TXT `ket-qua-ocr.txt` chia `--- Trang N ---` · PDF `-co-lop-chu.pdf` bỏ qua trang đã có chữ |
| 10 | Esc 6 bước · ←/→ chuyển trang · lỗi JS ra toast |
| A–C | 10 hàm hook · mọi hằng số Phụ lục B · nhãn Việt nguyên văn Phụ lục C |

## Trạng thái hiện tại của bản chốt

- Tài liệu này **là bản chốt**; mọi bản giao sau phải dẫn chiếu số mục ở đây.
- **v3.5.626 — đã thi hành QĐ-1, QĐ-2, QĐ-3:**
  - **QĐ-2:** `.kpTranslation`→`.kpOcrPanel`, `.kpTranslation.open`→`.kpOcrPanel.kpOpen`, `.kpTrBody`→`.kpOcrPanelBody`, `.kpTrHover`→`.kpOcrLineHover`, `.kpTrResize`→`.kpOcrGrip` (30 tham chiếu trong `ocr.css`, 4 lớp trong `documents.html`, `panel()` trong `ui.js` dùng `kpOpen`). CSS panel Dịch trong `documents.css` **không đụng**.
  - **QĐ-3:** thêm `js/ocr/bridge.js` → `window.keepitHook` đủ **10 hàm** (`isBusy/getCurrent/getTotal/getResults/goTo/getDoc/getMode/applyText/forceIdle/releaseEngines`), Map `results` kiểu demo, `publish/applyText/clear`, và ghi trạng thái vào **đúng 3 phần tử** `#kpOcrStatus` / `#kpOcrProgress` / `#kpOcrProgPage`. `ui.js` (setPage/setState/progress/busy) và `run.js` (publish/busy/mode/langs) nối vào cầu; `documents.js` thêm `goTo`.
  - **QĐ-1:** `LHN_DOCUMENTS_OCR.scanMode(true)` đưa khung xem về **1 trang + fit**, gắn `html.kpOcrScan` (giấu ô thu phóng, khoá ô cách xem); `run.js` bật khi bắt đầu và **trả lại** đúng flow/zoom cũ trong `finally`.
- **Kiểm tra:** jsdom `t615` 51/51 · `619` 10/10 · `618` 14/14 · `621` 9/9 · `622` 7/7 · `626` **14/14** (cầu nối) · wiring 39/39 · core 19/19.
- **Chưa kiểm được:** ảnh chụp trên extension thật (AGENTS 3.4) — sandbox vẫn thiếu 3 `.so` (xem QĐ-4); **chờ người dùng chọn (a/b/c)**.
