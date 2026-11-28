# Nhật ký nền giữ nguyên văn trước OCR clean rebuild

**2026-11-17 | v3.5.584 | Arena.ai Agent sửa:**

- Tóm tắt: sửa cơ chế đẩy ngang của ô tô sáng và popup note; bỏ ngoại lệ bỏ kẹp ngang trong `positionPopupAtAnchor`, dùng chung `position()` với popup dịch/Full Dictionary. Khi đủ chỗ vẫn căn giữa toàn vùng chọn; khi tràn mép, đẩy vào trong với lề 10 px. Không thay đổi tầng, lật dọc, kích thước, cách chọn, sheet, icon/tiện ích hay cơ chế Trang tối.
- File: `js/content/content.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: extension unpacked Chromium 159; ca sát hai mép 1512/390 sáng/tối cho cả ô tô sáng và popup note, ảnh + crop 4× (`qa/v584-edges.log`): ô 270 px, 1512 trái 10–280/phải 1232–1502; 390 trái 10–280/phải 110–380. Chụp/đo hai đoạn, sát đáy và cuộn ra ngoài (`qa/v584-multi.log`, `qa/v584-bottom.log`); bộ 4 kịch bản 72 ảnh + crop (`qa/v584-regression.log`); Trang tối bật/tắt vùng màu rực (`qa/v584-toggle.log`) và sheet dịch/từ điển 390 (`qa/v584-sheet.log`); console.error/pageerror rỗng. Chưa kiểm profile Chrome thật, Wikipedia thật trên máy người dùng, các website khác, PDF/Office của người dùng, cảm ứng/vận hành trên thiết bị thật.

**2026-11-17 | v3.5.583 | Arena.ai Agent sửa:**

- Tóm tắt: làm mới từ **3.5.574 (`3ab24bf`)**, không lấy mã 3.5.575–3.5.582. Các lớp nổi bám tầng stacking context của chữ và bám chữ khi cuộn ra ngoài khung nhìn; sát đáy lật lên; popup tô sáng neo toàn vùng chọn, căn giữa tuyệt đối, không kẹp ngang, không thay chiều cao/cách chọn. Popup dịch giữ đẩy ngang. Composer neo qua dấu preview vì Range bị DOM thay thế; ResizeObserver tính lại vị trí khi ô thay đổi kích thước. Hàng tiện ích vẫn ở trên chữ và bám chữ. Popup mũi tên composer theo phía và nằm giữa.
- Trang tối: giữ nguyên `page-dark.js` và các file Trang tối; chỉ khi lớp phủ thật đang hiện, các popup nổi ở trên lớp phủ (người dùng chấp nhận có thể đè header khi đó). Không dùng lọc bù màu. Touch sheet giữ nguyên tầng và cơ chế.
- File: `js/content/content.js`, `css/content/content.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: Chromium 159, extension unpacked, 1512/390 sáng/tối, 72 ảnh + crop 4× (`qa/v583-visual.log`); highlight hai đoạn (`qa/v583-multi.log`), 1512 tâm 246=246 và 390 tâm 195=195, sát đáy lật lên và cuộn 1200 px theo chữ; popup dịch và composer sát đáy cùng theo cuộn 1200 (`qa/v583-bottom.log`); header z20 che thanh trong stacking context lồng (`qa/v583-stack.log`); Trang tối bật/tắt có popup z2147482001→0, vùng màu rực giữ màu tối (`qa/v583-toggle.log`); sheet dịch và từ điển 390/coarse z2147483647 sát đáy (`qa/v583-sheet.log`); đầu mút chọn PDF (`qa/v583-selection.log`), console.error/pageerror rỗng trong các bộ kiểm. Chưa kiểm profile Chrome thật, trang web thật đa dạng, PDF/Office người dùng, hiệu năng/cảm giác dùng và mọi stacking context.

**2026-11-17 | v3.5.574 | Arena.ai Agent sửa:**
- Base: vẫn từ **v3.5.564** (`ddffbaa`, nhánh `fix-35571`) + các bản vá 3.5.571–3.5.572. Bản này **gỡ công cụ chẩn đoán** của 3.5.573 và sửa đúng nguyên nhân tìm được từ log máy thật.
- Tóm tắt: log 3.5.573 trên máy người dùng chỉ ra **đầu mút vùng chọn rơi vào nút trang trí**: 4 lần "nháy" đều có `focus` là ô chữ bên trong **neo loa** (`SPAN@0` / `SPAN@1`) hoặc ranh giới đoạn (`SPAN.para@0`), kèm `lastLine:-1` (khung tô không nằm trên dòng chữ nào) và độ dài vùng chọn nhảy từ ~660–1 000 lên **2 055–2 225 ký tự** rồi bật lại ngay. Nguyên nhân: các nút đè lên trang (`.docsReaderSpeakerAnchor` 18×18, `pointer-events:auto`, chứa chữ) để `user-select:auto`, mà chúng nằm **ngoài dòng chữ** nên Chrome lấy làm đầu mút ⇒ vùng chọn phình hết phần còn lại của trang. Ba việc:
  (1) `user-select:none` cho toàn bộ nút trang trí trong trang (lớp phủ + neo loa + ruột neo, khung tô đoạn, `lhnPdfHighlight`, `lhn-br-fill`, `lhnLineFiller` — giống cách chữ đệm đã làm từ 3.5.571) ⇒ trình duyệt bỏ qua chúng khi kéo chọn, tự lấy chữ gần nhất.
  (2) Bỏ phần **đệm đoạn cuối tới đáy trang** của 3.5.572: nó tạo một hộp rỗng cao **174 px** nằm cách xa dòng chữ — đúng loại đích caret "không có chữ" gây nhảy. (3.5.572 cũng không làm người dùng thấy khác nên bỏ không mất gì.)
  (3) Thêm **chốt hãm đầu mút vùng chọn** trong `documents.js`: theo dõi đầu mút hợp lệ gần nhất (chữ trong `.pdfTextLayer`); nếu đầu mút mới rơi vào nút trang trí, hoặc là ranh giới đoạn **và** vùng chọn phình quá 50 % + 80 ký tự, thì kéo đầu mút về chỗ cũ bằng `Selection.extend` (giữ nguyên đầu neo). Không chặn cử chỉ, không listener chạm, không đụng thao tác chuột (chuột luôn neo vào chữ nên không vào nhánh này); tự nhường nếu phải sửa ≥3 lần trong 0,9 giây.
- File: `js/dashboard/documents.js`, `css/dashboard/documents.css`, `pages/documents.html` (gỡ thẻ script chẩn đoán), xoá `js/dashboard/documents-diag.js`, `manifest.json`
- Kiểm tra: ép đầu mút vào (a) chữ trong neo loa, (b) đoạn cuối trang, (c) ranh giới đoạn gần → (a)+(b) được cứu về đúng chữ (độ dài không đổi, không nháy), (c) **không** bị can thiệp (đúng chủ ý); sau khi cứu, kéo tiếp vẫn ăn (168 → 343 ký tự). Chuột: kéo 24 bước **0** đầu mút ngoài chữ, độ dài tăng đều 0 → 1 030; chạy lại `t573focus` 0/24 bước lệch. Popup vẫn **chỉ** hiện khi thả tay (dừng 2,2 s đang chọn → không hiện). Đệm đoạn cuối nay trống (174 px → 0). 0 lỗi console.

**2026-11-17 | v3.5.573 | Arena.ai Agent sửa:**
- Base: vẫn từ **v3.5.564** (`ddffbaa`, nhánh `fix-35571`) + hai bản vá 3.5.571/3.5.572. Bản này **chỉ thêm công cụ chẩn đoán**, không đổi hành vi chọn chữ.
- Tóm tắt: Chưa tìm ra nguyên nhân lỗi "vùng chọn nháy" khi chọn bằng cảm ứng (lúc bị lúc không, kéo xuôi hay ngược đều có, hay gặp khi kéo qua **khoảng trống trong đoạn**). Đo "vùng chết" cho thấy 3.5.571 → 3.5.572 giảm 296/418 → 88/418 điểm nhưng người dùng vẫn thấy y như cũ ⇒ vùng chết không phải nguyên nhân. Hai lần thử phủ nốt dải trên/lề trái đều làm **chữ xê dịch** (78–89 px, rồi 9,5 px) nên đã hoàn lại, không phát hành. Nay thêm `js/dashboard/documents-diag.js` (chỉ nạp ở `pages/documents.html`, **sẽ gỡ** khi tìm ra lỗi): ghi vòng 800 mục vào bộ nhớ gồm chạm/kéo (toạ độ, cancelable, defaultPrevented), mỗi lần vùng chọn đổi (độ dài, số rect, dòng đầu/dòng cuối, neo/đầu kia, `caretRangeFromPoint` tại điểm chạm cuối), thay đổi DOM trong lớp chữ, cuộn `#stage`, và hộp UI `lhn-*` hiện ra. Nút "Log" ở góc dưới trái mở bảng có Copy/Làm mới/Xoá/Đóng.
- File: `js/dashboard/documents-diag.js` (mới), `pages/documents.html`, `manifest.json`
- Kiểm tra: nút Log hiện, log bắt đủ loại sự kiện (sau một lần kéo chuột + một lần kéo chạm: `start` 1, `dom` 7, `mouse` 2, `drag` 8, `sel` 7, `touch` 7), bảng mở được, ô log 4.126 ký tự, nút Copy báo "đã copy"; mục `sel` mẫu có đủ `anchor/focus/firstLine/lastLine/caret` (`caret` trỏ vào `SPAN.lhnLineFiller@43` — đáng chú ý cho việc tìm lỗi). Không lỗi console. Chọn chữ bằng chuột vẫn 0/24 bước sai, cảm ứng chọn + thả tay mới hiện icon vẫn như 3.5.572.

**2026-11-17 | v3.5.572 | Arena.ai Agent sửa:**
- Base: vẫn từ **v3.5.564** (`ddffbaa`, nhánh `fix-35571`), cộng tiếp một bản vá duy nhất cho lỗi cảm ứng còn nháy.
- Tóm tắt: đo "vùng chết" của lớp chữ (lấy mẫu 19×29 điểm trên trang, xem `document.caretRangeFromPoint` trả về chữ hay phần tử): 3.5.571 có **296/418 điểm rơi vào phần tử chứa** — đó là các chỗ trình duyệt còn cớ neo vùng chọn vào ranh giới khối, nên khi bôi đen nhiều đoạn vẫn nháy (lúc có lúc không, tuỳ ngón tay rơi vào đâu). Phần lớn nằm ở **khoảng trống phía dưới dòng cuối** (slide có nhiều chỗ trống). Nay hộp chữ của dòng cuối được đệm tới **đáy trang**: vùng chết còn **88/418** (giảm 71 % → 21 %), 330 điểm rơi vào chữ.
- File: `js/dashboard/documents.js`, `manifest.json`
- Kiểm tra: chữ không xê dịch một ly (so toạ độ toàn bộ span với 3.5.571: **0/18 khác**). Kéo dòng 3→7 trong vùng chữ: **0/24** bước sai; kéo xuống hẳn vùng trống dưới dòng cuối: vùng chọn dừng đúng ở **dòng cuối** (3.5.571 dừng sớm ở dòng 7 khi vẫn còn dòng 8); kéo trôi ra lề phải 5/24. Nhảy đúp chọn từ, Ctrl+A 1.920 ký tự, icon dịch hiện sau khi chọn, đang chọn (dừng 2,2 s) popup **không** hiện, pinch 135,6→162,4 %, 30 bước pinch trên PDF 42 dòng: khung hình xấu nhất **25 ms**, 0 long task, đóng khung xem tệp bình thường, 0 lỗi console.

**2026-11-17 | v3.5.571 | Arena.ai Agent sửa:**
- Base: làm lại **từ đúng v3.5.564** (`ddffbaa`, manifest 3.5.564, nhánh `fix-35571`) theo yêu cầu; toàn bộ 3.5.565–3.5.570 bị bỏ khỏi bản này (vẫn nằm trong lịch sử git ở nhánh `fix-35560`, không dùng nữa).
- Tóm tắt: hai việc đúng phạm vi đã chốt.
  (1) **Chọn nhiều đoạn bị nháy — chuột và cảm ứng, cùng một cách chữa**: hộp chữ PDF/PPTX chỉ cao bằng cỡ chữ trong khi nhịp dòng rộng hơn nhiều, và phía sau chữ mỗi dòng là khoảng trống; con trỏ/ngón tay rơi vào đó thì trình duyệt neo vùng chọn vào ranh giới khối nên vùng chọn nháy xuống dòng dưới (hoặc nhảy lên đầu đoạn). Nay `fillTextLayerGaps()` đệm thêm phần khe phía dưới mỗi hộp chữ, và `fillLineEnd()` thêm một đoạn "chữ đệm" trong suốt (khoảng trắng cứng, `user-select:none`, ngoài `.en`) phủ hết bề ngang còn lại của dòng. Không chặn cử chỉ chạm nào nên cảm ứng vẫn do hệ điều hành xử lý như cũ. Chỉ chạy một lần sau khi vẽ trang (hình học tính theo đơn vị trang, `.docsSource` chỉ `transform: scale()` nên zoom không đổi) ⇒ không làm zoom khựng.
  (2) **Cảm ứng: chỉ hiện icon/tiện ích khi thả tay**: bỏ hẹn giờ "vùng chọn im lặng 900 ms rồi tự bắn `mouseup`" trong `installTouchSelectionBridge` (từ v3.5.159) — trong lúc kéo tay nắm chọn Android không gửi sự kiện chạm nào nên hẹn giờ đó luôn thắng. Nay chỉ mở khi có tín hiệu thả tay thật (`touchend`, hoặc `contextmenu` phát ra khi ngón tay đã nhấc).
- File: `js/dashboard/documents.js`, `js/shared/selection-toolbar.js`, `manifest.json`
- Kiểm tra: PDF 9 dòng, kéo dòng 3→7 qua 24 bước trên **đường chọn mặc định của trình duyệt** (đường cảm ứng dùng): **0/24** bước sai — bản gốc 3.5.564 là 5/24, tức chuột và cảm ứng nay cùng đúng. Kéo trôi từ chữ ra lề phải: 5/24 (giảm từ 10/24). Chữ không bị xô (so toạ độ toàn bộ span trước/sau: không đổi), chữ đệm không lọt vào vùng chọn (`user-select:none`), Ctrl+A 1.920 ký tự, nháy đúp chọn từ ("fabrics"), icon dịch hiện sau khi chọn, chế độ Đọc vẫn chọn được. Popup: dừng 2,2 giây giữa lúc đang chọn → **không** hiện. Zoom: 30 bước pinch trên PDF 42 dòng, khung hình xấu nhất 23 ms (bản gốc 3.5.564: 18 ms), 0 long task; pinch 135,6→162,4 %, đóng khung xem tệp bình thường, 0 lỗi console.

**2026-11-17 | v3.5.564 | Arena.ai Agent sửa:**

- Sửa lại phạm vi của 3.5.563: chỉ tắt vuốt-trái-dịch-đoạn ở **chế độ Gốc** của trình xem tệp; **chế độ Đọc vẫn vuốt trái để dịch đoạn** như người dùng yêu cầu.
- Phát hiện thêm (đo được, không phải do 3.5.563): ở chế độ Đọc cử chỉ này **vốn đã không chạy** vì hai lớp chặn — (1) thanh Đọc mở (`#lhn-bilingual-reading-bar.lhn-show`) → `S.extYield = true` → `gestureAllowed()` false; (2) đoạn văn của chế độ Đọc mang lớp `lhn-bilingual-reading` nên `isOwnUi()` (khớp `[class*="lhn-"]`) coi là UI của mình → `paraOf()` trả `null`. Bản 3.5.562 cũng cho 0 thẻ dịch.
- File: `js/content/keepit-bar.js`:
  - thêm `docsOriginalMode()`; tách `gestureBase()` khỏi `gestureAllowed()`;
  - `paraGestureAllowed()` = nền hợp lệ **và** không ở chế độ Gốc **và** (`!S.extYield` **hoặc** đang ở trình xem tệp) → mở đúng cử chỉ vuốt-dịch đoạn khi thanh Đọc đang mở, không mở cử chỉ khác;
  - `paraOf()`: trong trình xem tệp chỉ cần đoạn nằm trong `#pageStack` là nội dung tệp (bỏ qua lớp `lhn-*`);
  - `coachItems()` dùng `docsOriginalMode()`.
  - `manifest.json` (3.5.563 → 3.5.564).
- Kiểm tra: extension thật, 390×844, `has_touch`, PDF 3 trang.
  - **GỐC**: vuốt trái → **0 thẻ dịch**; chọn chữ rồi vuốt → vùng chọn còn nguyên (`"Trang 1 - zoom tu "`), icon Keepit hiện.
  - **ĐỌC** (`mode=read`, thanh Đọc `lhn-show`): vuốt trái → **1 thẻ dịch** (trước 3.5.564: 0).
  - Quay lại GỐC: vuốt trái → **0 thẻ**.
  - 2 ngón chạm ở chế độ Đọc: vẫn 0 thẻ (đã vậy từ trước vì thanh Đọc chặn `gestureAllowed()`) — chưa mở, chờ quyết định.
  - `console.error` + `pageerror` = 0.
  - Chưa kiểm được: vuốt/chạm thật trên máy cảm ứng của người dùng. CRX không tạo vì sandbox thiếu khoá ký.

**2026-11-17 | v3.5.563 | Arena.ai Agent sửa:**

- Tóm tắt: trong trình xem tệp (máy cảm ứng) **bỏ vuốt trái để dịch đoạn**; “2 ngón chạm = dịch cả trang” **giữ nguyên** (theo lệnh). Nhờ vậy thao tác bôi đen không còn bị hiểu thành vuốt và không bị `getSelection().removeAllRanges()` xoá vùng chọn, nên chọn chữ xong icon Keepit hiện đúng như cài đặt. Trang web thường không đổi gì.
- Nguyên nhân gốc (đo được trên 3.5.562): `gestureAllowed()` chỉ chặn theo `siteOff/extYield/kbd/fullscreen/zoom>1,05`, không có điều kiện nào cho trình xem tệp ⇒ vuốt trái trên một đoạn trong `.docsSource` tạo ra thẻ dịch (1 `.lhn-bilingual-card`).
- File: `js/content/keepit-bar.js` (thêm `inDocsViewer()` kiểm tra `data-keepit-documents`; dùng ở nhánh `paraOf` của `onPageTouchStart` và ở `coachItems()` để không mời “vuốt đoạn” trong trình xem tệp), `manifest.json` (3.5.562 → 3.5.563).
- Kiểm tra: extension thật, 390×844, `has_touch` (pointer:coarse), tệp PDF 3 trang.
  - Đối chứng trong cùng bản: bỏ attribute `data-keepit-documents` (hành vi code cũ) → vuốt trái tạo **1 thẻ dịch**; gắn attribute (code mới) → **0 thẻ dịch**.
  - Trình xem tệp, vuốt trái trên đoạn: **0 thẻ dịch**; chọn chữ → `#lhn-translate-icon` hiện lớp `lhn-visible`; vuốt khi đang chọn chữ → **vùng chọn còn nguyên**, 0 thẻ dịch.
  - “2 ngón chạm” trong trình xem tệp: thẻ dịch **0 → 1** (vẫn chạy).
  - Trang web example.com: 0 thẻ dịch ở **cả 3.5.562 và 3.5.563** (probe không tái hiện được cử chỉ trên trang này) ⇒ không hồi quy; về mã, điều kiện mới chỉ đúng khi có attribute `data-keepit-documents` — trang web không bao giờ có.
  - `console.error` + `pageerror` = 0.
  - Chưa kiểm được: vuốt/chạm thật trên máy cảm ứng của người dùng. CRX không tạo vì sandbox thiếu khoá ký.

**2026-11-17 | v3.5.562 | Arena.ai Agent sửa:**

- Base theo lệnh: **đúng 3.5.560 (`50acddc`)** — bỏ phần lưới 10 % của 3.5.561 vì nó làm zoom chậm, không theo nhịp touchpad.
- Tóm tắt: zoom trong trình xem tệp giờ **liên tục, bám tay 1:1**: mỗi pixel lăn/pinch đổi đúng 1 % (đúng tỉ lệ khoảng cách 2 ngón), không còn cổng gom 90 px, không còn lưới 10 %. Phân biệt hai loại thiết bị theo `|deltaY|`: nhỏ (< 40 px, pinch trackpad/cảm ứng) → 1:1 không kẹp; lớn (nấc chuột rời) → mỗi nấc +16 %. Mọi event trong cùng một khung hình gộp thành một lần vẽ (rAF) nên không phụ thuộc số trang. Nút − / + và phím Ctrl+= / Ctrl+− vẫn nhảy 10 %, Ctrl+0 về “Vừa chiều rộng”.
- File: `js/dashboard/documents.js` (`ZOOM_WHEEL` thay bằng `ZOOM_GAIN=0.01`, `ZOOM_NOTCH_PX=40`, `ZOOM_NOTCH_STEP=0.15`, `ZOOM_EVENT_CAP=0.6`; thêm `zoomPulse`/`zoomPulseRAF` + `flushZoomPulse()` gộp khung hình, giữ neo dưới con trỏ), `manifest.json` (3.5.560 → 3.5.562).
- Kiểm tra: extension thật, PDF 3 trang.
  - 1512×900: `fit` = 127,7 %. Pinch nhỏ `deltaY -2` ×10 → **151,4 · 154,5 · 157,6 · 160,8 · 164,0 · 167,3 · 170,7 · 174,1 · 177,6 · 181,2** (+2,04 % mỗi event ≈ 1:1, mượt từng bước). Tổng 70 px lăn → 127,7 → **257,2 %** (lý thuyết ×2 = 255,5). Nấc chuột 100 px → **+16 %**. 5 event −20 px dồn 1 khung → ×2,72 đúng 1:1 rồi kẹp trần 400 %.
  - Neo dưới con trỏ ở 400 %: lệch **0 px**. Ctrl+0 → 127,7 → Ctrl+= → 137,7 → nút + → 147,7 (vẫn ±10 %).
  - 390×844: `fit` 62,2 %, pinch `deltaY -3` ×6 → 64,1 · 66,1 · 68,1 · 70,2 · 72,3 · 74,5 (+3 %/event).
  - `console.error` + `pageerror` = 0. Ảnh: `qa/shots/562-390-zoom.png`.
  - Chưa kiểm được: nhịp pinch thật trên touchpad máy người dùng (sandbox không có touchpad). CRX không tạo vì sandbox thiếu khoá ký.

**2026-11-17 | v3.5.560 | Arena.ai Agent sửa:**

- Tóm tắt: trình xem tệp có **zoom tự do 10–400 %** (trước chỉ 7 mức 50–200 %). Chỉ khung tệp ở giữa to/nhỏ — thanh trên, dải trang, panel dịch, thanh `.pager` đứng yên. Ctrl/⌘ + lăn chuột và pinch trackpad zoom quanh **đúng điểm dưới con trỏ**; pinch 2 ngón trên cảm ứng; phím Ctrl+= / Ctrl+− / Ctrl+0 (0 = về “Vừa chiều rộng”); nút − / + nhảy 10 %. Ô chọn zoom hiện % thực.
- File: `js/dashboard/documents.js` (thay bộ `ZOOM_STEPS`/`setZoom`/`stepZoom` bằng `ZOOM_MIN=10`, `ZOOM_MAX=400`, `ZOOM_STEP=10`, `ZOOM_WHEEL=0.0012`, `clampZoom`, `applyZoom(next, anchor)` giữ điểm neo theo toạ độ tương đối trong trang, `syncZoomSelect()` thêm option % động, listener `wheel` có `ctrlKey/metaKey`, pinch 2 ngón `touchstart/touchmove/touchend`, `keydown` Ctrl±/0), `manifest.json` (3.5.559 → 3.5.560).
- Kiểm tra: extension thật (unpacked), tệp PDF 3 trang tự tạo.
  - 1512×900: mở tệp `zoom=fit` (Fit width, khung 760 px); Ctrl+lăn 4 nấc → 400 % (kẹp trên đúng); lăn ngược → 10 % (kẹp dưới đúng, nút − bị khoá); lăn **không** Ctrl chỉ cuộn, zoom không đổi; `barH=56`, `pagerH=42` không đổi ở mọi mức zoom.
  - Neo điểm dưới con trỏ: ở 400 % (trang 2380 px rộng hơn khung) **lệch 0 px cả hai chiều**; ở mức giữa trang còn hẹp hơn khung thì lệch dọc 0–1 px, lệch ngang do trang phóng từ giữa (không có thanh cuộn ngang để neo — giống trình xem PDF của Chrome).
  - Phím: Ctrl+0 → `fit`; Ctrl+= hai lần 127,7 → 137,7 → 147,7; Ctrl+− lùi 10 %; nút +/− đúng như phím; gõ khi đang ở ô số trang **không** zoom.
  - 390×844: zoom nằm trong panel “Thêm” (đúng quy tắc màn hẹp), chọn 150 % chạy, chuyển trang, Ctrl+0 chạy; cơ chế mờ của `.pager` vẫn nguyên (rảnh → `0,24`, rê vào → `1`).
  - `console.error` + `pageerror` = 0. Ảnh: `qa/shots/560-1512-zoom.png`, `560-390-zoom.png`, `560-1512-zoom-pan.png`.
  - Chưa kiểm được: cảm giác lăn/pinch thật trên máy người dùng; trên 200 % ảnh PDF hơi mềm vì canvas không render lại ở scale cao (chưa làm, ngoài phạm vi). CRX không tạo vì sandbox thiếu khoá ký.

**2026-11-17 | v3.5.559 | Arena.ai Agent sửa:**

- Tóm tắt: nút về đầu trang (`#btop`) ở toàn app, **sau khi hiện**, dùng đúng cơ chế mờ/hiện của thanh chuyển trang `.pager` trong khung xem tệp: rảnh 1000 ms → mờ còn 24% (vẫn bấm được); rê chuột vào vùng ±28px ngang / ±24px dọc quanh nút, bấm, focus, gõ phím, cuộn trang, resize, quay lại tab → hiện 100%; chuyển động 0,14 s khi hiện và 0,55 s khi mờ. Màn xem tệp vẫn ẩn hẳn thanh + nút (3.5.555).
- Base theo lệnh: **đúng 3.5.557 (`0372474`)** — nhánh `fix-35557`; `manifest` 3.5.557; có mục “Cài đặt” ở sidebar (557); không có rule `.screen.shid .btop` của 3.5.558 (bản 558 làm sai đối tượng nên bị bỏ).
- File: `js/content/keepit-bar.js` (thêm `BTOP_IDLE_MS = 1000`, `armBtopFade()`, `wakeBtop()`, `btopRect`; `updBtop()` cập nhật rect + đánh thức; nối pointerdown/pointerenter/pointerleave/focusin/focusout/keydown, `pointermove` toàn trang với vùng ±28/±24, resize, visibilitychange), `js/content/keepit-bar-css.js` (`.btop.dimmed{opacity:.24;transition-duration:.55s}`, `.btop:focus-visible{opacity:1}`, giảm chuyển động theo `prefers-reduced-motion`), `manifest.json` (3.5.557 → 3.5.559).
- Kiểm tra: extension thật (unpacked), dựng cảnh Windows bằng class `lhn-twemoji-country-flags`.
  - Dashboard 1512×900 sáng & tối, 390×844: hiện → `opacity 1`, lớp `btop on`; rảnh 1,4 s → `opacity 0,24`, lớp `btop on dimmed`; rê chuột vào nút → `opacity 1`; để rảnh lại → đang mờ dần (đo được 0,29 / 0,40 giữa chuyển động 0,55 s); **bấm lúc đang mờ vẫn chạy** (`scrollTop` về 0).
  - Màn xem tệp: nút `display:none`.
  - Trang web example.com: hiện → 1; rảnh 1,4 s → 0,24; chuột vào → 1. (Bấm `^` trên trang giả lập này không cuộn ở **cả bản nền 3.5.557**, nên không phải do thay đổi này — ghi nhận là hạn chế của trang test.)
  - `console.error` + `pageerror` = 0.
  - Ảnh: `qa/shots/559-1512-sang-dim.png`.
  - Chưa kiểm được: cảm giác dùng trên Chrome người dùng; hành vi bấm `^` trên trang web thật. CRX không tạo vì sandbox thiếu khoá ký.

**2026-11-17 | v3.5.557 | Arena.ai Agent sửa:**

- Tóm tắt: đưa mục cài đặt ra khỏi menu hồ sơ, thành mục riêng ở sidebar dashboard **nằm ngay dưới nút đổi giao diện** (Thùng rác → Giao diện → **Cài đặt** → You), nhãn đổi thành "Cài đặt"; bấm mở đúng bảng cài đặt như mục cũ (`openDashboardSettings(lastDashboardSettingsTab)`); sheet "Thêm" trên điện thoại trỏ sang mục mới.
- File: `pages/dashboard.html` (thêm `#dashboardSidebarSettings` sau `#dashboardSidebarThemeToggle`, dùng icon bánh răng cũ, `data-i18n="settings"`; bỏ mục `data-profile-menu-action="settings"` khỏi popup hồ sơ), `js/dashboard/dashboard.js` (listener mở bảng cài đặt), `js/dashboard/responsive-nav.js` (row `settings` của sheet điện thoại bấm `#dashboardSidebarSettings`), `manifest.json` (3.5.556 → 3.5.557).
- Kiểm tra: extension thật (unpacked), vi/en/ko.
  - 1512×900 — thứ tự footer đo theo `getBoundingClientRect().top`: Thùng rác 720 → Giao diện 764 → **Cài đặt 808** → You 852; nhãn vi "Cài đặt", en "Settings", ko "설정" (cả `aria-label`), đều hiện.
  - Bấm mục mới → bảng cài đặt mở (`[data-settings-panel].is-active` = `account`, `visible: true`) ở 1512 và 390.
  - Popup hồ sơ không còn mục cài đặt (còn: Hồ sơ cá nhân · Giao diện · Phím tắt · [Đồng bộ dữ liệu · Trợ giúp & Phản hồi · Đăng xuất khi đã đăng nhập] · Đăng nhập).
  - 390×844: footer ẩn theo bố cục điện thoại (như trước); sheet "Thêm" có row "Cài đặt" và bấm vẫn mở bảng cài đặt (`visible: true`).
  - `console.error` + `pageerror` = 0.
  - Ảnh: `qa/shots/557-1512-vi-dark-sidebar.png` (footer tiếng Hàn ở ảnh dark của phiên ko), `557-390-vi-sheet.png`, `557-390-vi-settings-from-sheet.png`, `557-1512-vi-settings.png`, `557-*`.
  - Chưa kiểm được: bản chạy trên Chrome người dùng. CRX không tạo vì sandbox thiếu khoá ký.

**2026-11-17 | v3.5.556 | Arena.ai Agent sửa:**

- Tóm tắt: nhãn menu hồ sơ (avatar "You") và nút đổi giao diện ở sidebar dashboard không theo ngôn ngữ — một nửa lấy từ `t()` nên đổi theo ngôn ngữ, một nửa viết cứng tiếng Việt trong HTML/JS nên đứng im (ảnh người dùng: "My profile"/"Sign in to synchronize" tiếng Anh cạnh "Hồ sơ cá nhân"/"Phím tắt" tiếng Việt). Nay toàn bộ nhãn đi qua `t()`; nhãn theme vẫn phụ thuộc sáng/tối nên vẽ lại khi đổi ngôn ngữ.
- File: `pages/dashboard.html` (10 nhãn gắn `data-i18n`/`data-i18n-title`/`data-i18n-aria-label`), `js/dashboard/dashboard.js` (`syncDashboardTheme()` dùng `t("dashboardThemeDark|Light|ToggleLabel")`, `applyTranslations()` gọi lại `syncDashboardTheme()`), `js/core/languages.js` (+8 key × en/vi/ko: `profileItemAccount`, `profileItemSettings`, `profileItemSync`, `profileItemHelp`, `profileMenuToggleTitle`, `dashboardThemeDark`, `dashboardThemeLight`, `dashboardThemeToggleLabel`), `manifest.json` (3.5.555 → 3.5.556).
- Kiểm tra: extension thật (unpacked), đổi `lhnSettings.language` rồi reload.
  - 1512×900: en → "My profile / Extension settings / Appearance / Keyboard shortcuts / Sign in", "Sign in to synchronize", "You", "Light mode", "Settings & Account"; vi → "Hồ sơ cá nhân / Cài đặt tiện ích / Giao diện / Phím tắt / Đăng nhập", "Đăng nhập để đồng bộ", "Bạn", "Giao diện sáng", "Cài đặt & Tài khoản"; ko → "내 프로필 / 확장 프로그램 설정 / 화면 모양 / 단축키 / 로그인", "동기화하려면 로그인하세요", "나", "라이트 모드", "설정 및 계정". Bật tối: en "Dark mode", vi "Giao diện tối".
  - 390×844: en/vi/ko đổi đúng (nút theme + nhãn người dùng + trạng thái đồng bộ).
  - Quét toàn trang khi ngôn ngữ = en (1512 và 390, có mở menu): **0 chuỗi còn dấu tiếng Việt**.
  - `console.error` + `pageerror` = 0.
  - Ảnh: `qa/shots/556-<en|vi>-1512-<light|dark>-popover.png`, `556-390-en-phone-menu.png`, `556-vi-1512-dark-popover-zoom2x.png`.
  - Chưa kiểm được: bản chạy trên Chrome người dùng. CRX không tạo vì sandbox thiếu khoá ký.

**2026-11-17 | v3.5.555 | Arena.ai Agent sửa:**

- Tóm tắt: dashboard — đang mở tệp trong tab Tài liệu (`body.documents-viewer-open`) thì ẩn hoàn toàn thanh Keepit (thanh, vạch tím, nút về đầu trang); đóng tệp hiện lại; màn danh sách tệp vẫn hiện thanh. Làm trên nền `4e1ccce` (= 3.5.550 + sửa `isOwnUi`), +18/−3, không mang gì từ 551/552/553. Kèm sửa tài liệu: `OPT-ARENA.md` bước 3 phải có `--http-host-header 127.0.0.1:9222` (thiếu thì Chrome trả 500 `Host header is specified and is not an IP address or localhost`).
- File: `js/content/keepit-bar.js` (`syncExtDocs()` + MutationObserver trên class `body` + gọi trong nhịp 700 ms), `js/content/keepit-bar-css.js` (`.screen.extdocs .bbar,.hzone,.btop{display:none!important}`), `manifest.json` (3.5.554 → 3.5.555), `OPT-ARENA.md`.
- Kiểm tra: extension thật (unpacked), dựng cảnh Chrome/Windows bằng class `lhn-twemoji-country-flags`.
  - 1512×900 sáng & tối, 390×844 sáng & tối: bình thường thanh `block`; cuộn xuống `translate 0 78px` + `shid=true` + vạch tím `block`; mở tệp thanh `none`, `^` `none`, vạch tím `none`, `extdocs=true`; đóng tệp thanh `block`, `^` `grid`.
  - `console.error` + `pageerror` = 0 (cả 4 phiên).
  - Ảnh: `qa/shots/555-<1512|390>-<light|dark>-<1-normal|2-scrolled|3-file-open>.png` + bản `-zoom4x.png`.
  - Chưa kiểm được: tệp thật (thư viện sandbox trống) — phải đo trên Chrome người dùng; CRX không tạo vì sandbox thiếu khoá ký.

**2026-11-17 | v3.5.554 | Arena.ai Agent sửa (CHỈ một chỗ: `isOwnUi` — lấy đúng nền 3.5.550):**

- Lệnh: lấy **đúng 3.5.550** (`8f2b647`) làm nền, **chỉ sửa A** = lỗi ẩn thanh, không mang gì từ 551/552/553.
- Base: nhánh `base-35550`, HEAD `8f2b647`; `manifest.json` 3.5.550; `js/content/keepit-bar.js` blob `3dab106a07` khớp commit; không có `primeTop`/`noteUserWheel`/`syncExtDocs` (chứng minh không lẫn bản sau).
- Sửa (`js/content/keepit-bar.js`, +12/−2): `isOwnUi()` không tính `<html>`/`<body>`. Vì `closest('[class*="lhn-"]')` leo tới `<html>`, mà dashboard gắn `lhn-twemoji-country-flags` vào `<html>` (js/dashboard/flags.js — Chrome/Windows gắn, Chromium Linux không) → mọi phần tử bị coi là UI Keepit → `onScroll` thoát ngay → không ẩn.
- Đo (sandbox 1536×746, gắn tay class `lhn-twemoji-country-flags` để dựng cảnh Windows):
  - 3.5.550 gốc: 4 phát chậm & 2 phát nhanh → `translate=(none)`, `shid=false` (**không ẩn**) — tái hiện đúng lỗi.
  - 3.5.554: cả hai kiểu → `translate 0 78px`, `shid=true` (**ẩn**); trang web vẫn ẩn bình thường; `pageerror` = 0.
- Không làm (theo lệnh chỉ A): con trỏ đứng ở dải đáy tự bật thanh, lăn một phát tới đáy có thể không ẩn (đặc tính của 550), chuyển con lăn qua lớp phủ, ẩn hẳn thanh khi mở tệp.
- Không tạo CRX, chưa đóng ZIP (chờ lệnh).

**2026-11-17 | v3.5.550 | Arena.ai Agent sửa (thanh Keepit — LÀM LẠI TỪ ĐÚNG 3.5.546, cỡ nhãn theo cách 3.5.545, dùng chung một thanh):**

- Lệnh: "làm lại, lấy đúng 3.5.546" + trước đó "làm cách scale như 3.5.545, dùng chung cho 1 thanh keepit duy nhất, màn hình rộng vẫn 12px".
- **Base: `40b8f77` (3.5.546).** Bước 1: `git checkout 40b8f77 -- js/content/keepit-bar-css.js js/content/keepit-bar.js manifest.json` → `git diff 40b8f77` rỗng, md5 2 file trùng đúng bản gốc (`0c16e7e7…`, `99015514…`). Bước 2: sửa tay đúng 5 chỗ bằng `qa/patch_546_550.py` (ngoài repo).
- 5 chỗ sửa (giữ nguyên cách của 3.5.545, áp cho một thanh duy nhất):
  1. `.bin{padding:0 2px;gap:0}` + `.nb{padding:3px 0}` — thêm chỗ cho nhãn như 3.5.545;
  2. `.nb .lb{max-width:100%;margin:0;letter-spacing:-.45px}` — **nhốt nhãn trong nút**, bỏ lề âm `−7px` (nguyên nhân chữ tràn sang nhau); `.wide/.pland .nb .lb` giữ lề `−7px`, giãn chữ −0,3px để màn rộng không bị "…";
  3. thang cỡ nhãn: `.nb{10px}` → `.tight` 9px → `@media ≤419,98px` 8,5px; `.wide/.pland` **12px** (đúng yêu cầu "màn hình rộng vẫn 12px");
  4. `.bbar.wrap .nb .lb{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.05}` — hết nấc cỡ chữ mà vẫn chật thì **xuống 2 dòng**, không cắt chữ;
  5. `fitLabels()`: bỏ nấc cứng `.tight` 10px của 3.5.546; chỉ đo rồi bật `.tight` → `.wrap` → thu về 5 nút.
- `git diff 40b8f77` sau khi sửa: **3 file**, +20/−9 (CSS 20 dòng, JS 7 dòng, manifest đổi version). Không đụng gì khác.
- Đo thật (Chrome + extension thật, vi, sáng và tối ra cùng số; web = example.com):
  - 1512/1200/1024/820/768: **12px**, khe home/dashboard **2,7px** (web 22,9px), cao 72, không cắt, 1 dòng.
  - 600/480: **10px**, khe 29,3 / 10,9px, 1 dòng, cao 72.
  - 414/390/**384**: **8,5px**, khe 5 / 4,5 / **4px**, 1 dòng, cao 72, `cut: []`.
  - 360/320: **8,5px**, nhãn dài xuống 2 dòng (`tight wrap`), khe 2px, cao 72, `cut: []`.
  - Chrome bật **cỡ chữ tối thiểu 12px**: nhãn bị kéo về 12px → thanh tự bật `wrap`, nhãn dài xuống 2 dòng, **không chồng chữ**, `cut: []`, cao 78px.
- Ảnh: `qa/shots/550-LIGHT-{home,dash}-{1512,390,384}-4x.png`, `550-DARK-…`, `550-MINFONT12-…`. Harness: `qa/final550.py`, patch: `qa/patch_546_550.py`.
- `pageerror` + `console.error` = 0 ở cả 3 lượt chạy.
- Không tạo CRX (sandbox không có khoá ký).

**2026-11-17 | v3.5.548 | Arena.ai Agent sửa (thanh Keepit — cỡ nhãn theo cách 3.5.545, dùng chung một thanh) — ĐÃ BỊ THAY THẾ:**

- Người dùng: "từ 3.5.546, làm cách scale như 3.5.545, dùng chung cho 1 thanh keepit duy nhất, màn hình rộng vẫn 12px".
- **Sai quy trình:** bản này sửa tiếp trên HEAD 3.5.547 thay vì `git checkout 40b8f77` lấy đúng file 3.5.546; nội dung cuối tương đương nhưng trái lệnh và đẻ ra chú thích CSS sai (≤379,98/≤339,98 trong khi code là ≤419,98). Toàn bộ được làm lại từ 3.5.546 ở v3.5.550.
- Nguyên nhân gốc của ảnh bị dính: thanh đang dùng **đúng CSS của thanh web** — `.nb .lb{max-width:calc(100% + 14px);margin:0 -7px}` cho phép nhãn **tràn sang nút bên cạnh**; nhãn tiếng Việt dài nên chồng nhau. 3.5.545 không dính vì nhãn bị **nhốt trong nút** (`max-width:100%;margin:0`), chữ 10px + giãn chữ âm + khe nút 0 + đệm hẹp.
- Sửa CSS (`js/content/keepit-bar-css.js`), tất cả dùng chung, không có khối riêng cho trang nào:
  - `.nb .lb{max-width:100%;margin:0;letter-spacing:-.45px}` (nhốt nhãn trong nút);
  - `.wide .nb .lb,.pland .nb .lb{max-width:calc(100% + 14px);margin:0 -7px;letter-spacing:-.3px}` (màn rộng vẫn 12px, cho tràn nhẹ để không bị "…");
  - cỡ nhãn: `.nb{10px}`; `.wide .nb,.pland .nb{12px}`; `.bbar.tight` → 9px (chỉ khi không rộng); `@media ≤419,98px` → 8,5px; `@media ≤379,98px` → 8,5px, giãn chữ −0,45px;
  - `.bin{padding:0 2px;gap:0}` + `.nb{padding:3px 0}` (thêm chỗ cho nhãn như 3.5.545);
  - `.bbar.wrap .nb .lb{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.05}` — xuống 2 dòng thay vì cắt chữ.
- Sửa JS (`js/content/keepit-bar.js` — `fitLabels()`): bỏ cơ chế hạ 0,5px của 3.5.547; trở lại đúng 2 bước của 3.5.545 — chật thì bật `.tight` (9px), vẫn chật thì bật `.wrap` (xuống 2 dòng), vẫn chật mới thu về 5 nút.
- Đo thật (vi; web = example.com; cả 3 nơi giống nhau trừ nhãn web ngắn hơn; sáng và tối ra cùng số):
  - 1512/1200/1024/820/768: **12px**, khe home/dashboard **2,7px** (web 22,9px), cao 72, không cắt.
  - 600/480: **10px**, khe 29,3 / 10,9px, 1 dòng, cao 72.
  - 414/390/384: **8,5px**, khe 5 / 5 / 4px, 1 dòng, cao 72, `cut: []`.
  - 360/320: **8,5px**, nhãn dài xuống **2 dòng** (`tight wrap`), khe 2px, cao 72, `cut: []`.
  - Chrome bật **cỡ chữ tối thiểu 12px**: mọi cỡ chữ bị kéo về 12px → thanh tự bật `wrap`, nhãn dài xuống 2 dòng, **không còn chồng chữ**, `cut: []`, thanh cao 78px. (Trước 3.5.548: chữ 12px tràn sang nhau, khe −12px.)
- So với 3.5.547: 390 từ "8px + khe 4,5" → "8,5px + khe 5"; 384 (đúng ảnh người dùng) từ dính → **khe 4px**; 1512 giữ đúng **12px** như yêu cầu.
- Ảnh: `qa/shots/548f-LIGHT-dash-{1512,390,384}-4x.png`, `548f-DARK-…`, `548mf-{384,390}-4x.png` (Chrome cỡ chữ tối thiểu 12px). Harness: `qa/bar548.py`, `qa/chk548.py`, `qa/minfont548.py`, `qa/final548.py`.
- File: `js/content/keepit-bar-css.js`, `js/content/keepit-bar.js`, `manifest.json`, `PROJECT.md`.
- Không tạo CRX (sandbox không có khoá ký).

**2026-11-17 | v3.5.547 | Arena.ai Agent sửa (thanh Keepit — nhãn dài thì mọi nhãn tự nhỏ cùng một cỡ):**

- Người dùng: khi nhãn dài quá trên thanh thì **toàn bộ nhãn trên thanh tự nhỏ lại cùng kích thước** cho vừa. Chốt qua hỏi A/B: **đáy 8px**, **áp cho một thanh duy nhất ở mọi trang** (trang web thật + home + dashboard).
- Trước đó thanh chỉ có 2 nấc cứng: 11px (hẹp) / 12px (rộng), và `.bbar.tight` hạ **thẳng** xuống 10px; màn rộng (`isWide()`) thì `fitLabels()` thoát sớm nên không thu gì (vì thế ở 1512 khe = 0px).
- Sửa CSS (`js/content/keepit-bar-css.js`): cỡ nhãn thành biến chung — `.nb{font-size:calc(var(--lb,11px) * var(--ts,1))}`, `.wide .nb{… var(--lb,12px) …}`, `.pland .nb{… var(--lb,12px) …}`; bỏ nấc cứng `.bbar.tight .nb{font-size:10px}` (`.tight` chỉ còn giữ letter-spacing −0,2px).
- Sửa JS (`js/content/keepit-bar.js` — `fitLabels()`): bỏ thoát sớm khi màn rộng; nếu có nhãn bị "…" hoặc khe < 4px thì hạ `--lb` theo nấc **0,5px** từ 12px (rộng/tablet ngang) hoặc 11px (hẹp) xuống **đáy 8px**, dùng **một cỡ cho tất cả nhãn**, dừng ở nấc đầu tiên vừa; hết nấc vẫn chật mới chuyển Gọn thanh (như cũ). Icon 22px và chiều cao thanh 72px không đổi.
- Đo thật (Chrome + extension thật, vi, sáng; web = example.com, home, dashboard — cả 3 giống nhau ở mọi độ rộng):
  - 1512/1200/1024/820/768: web 12px (khe 20,9), home+dashboard **11,5px** (khe 4,7).
  - 600/480: 11px (khe 18,8) / home+dashboard 480 → 10,5px (khe 5,1).
  - 414: home+dashboard 8,5px (khe 5,6); 390: **8px** (khe 4,5); 360: 8px (khe **−0,5**); 320: 8px (khe **−7,2**).
  - `cut: []` ở mọi cỡ (không nhãn nào bị "…"); `fonts` luôn có đúng 1 giá trị (mọi nhãn cùng cỡ); thanh vẫn 506×72 (rộng) / 370×72 (390), bo 26px.
- Kết quả so với 3.5.546: 390 từ khe **−7px** → **+4,5px** (hết dính); 1512 từ **0px** → **+4,7px**. Còn hở ở 360/320 vì đáy 8px — người dùng chưa chốt hạ đáy.
- File: `js/content/keepit-bar-css.js`, `js/content/keepit-bar.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: ảnh thật `qa/shots/547-home-390-4x.png`, `547-dash-390-4x.png`, `547-home-1512-4x.png`, `547-dashboard-390-dark-4x.png`; harness `qa/bar547.py` (11 độ rộng × 3 nơi); `pageerror` + `console.error` = 0.
- Không tạo CRX (sandbox không có khoá ký).

**2026-11-17 | v3.5.546 | Arena.ai Agent sửa (thanh Keepit — bỏ kiểu dáng riêng, dùng đúng thanh của web):**

- Người dùng: thanh phải giống **100%** thanh trên trang web, chỉ có một thanh Keepit, không có kiểu dáng thứ hai; chốt v4 không cho tự thêm.
- Đã bỏ toàn bộ CSS riêng mình tự thêm ở 3.5.542 (`js/content/keepit-bar-css.js`: khối `.screen.ext …` — cỡ chữ 10/9/8.5px, gap 0, media query 379px/339px, nhãn xuống 2 dòng) và bỏ dấu `screen.classList.toggle("ext", EXT)`.
- Hành vi thu chữ/5 nút trả lại nguyên gốc của thanh (`fitLabels()` không còn điều kiện riêng).
- Đo lại: 1512 — web và home/dashboard **giống hệt** (rộng 506, cao 72, bo 26px, đệm 6/10px, nút 66px, chữ 12px, gap 3px). 390 — khung giống hệt (370×72, bo 26px, đệm 6/4), chữ 10px do chính thanh tự thu (`tight`).
- Hệ quả đã đo: ở 390 nhãn "Trang chủ" và "Tổng quan" chạm nhau (khe **−7px**, ảnh 4× `qa/shots/546-dashboard-390-light-4x.png`); ở 1512 khe **0px**; không nhãn nào bị cắt.
- File: `js/content/keepit-bar-css.js`, `js/content/keepit-bar.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: ảnh thật 1512 + 390, sáng + tối, phóng 4×; `pageerror` + `console.error` = 0.
- Không tạo CRX (sandbox không có khoá ký).

**2026-11-17 | v3.5.545 | Arena.ai Agent sửa (thanh Keepit — chú thích nút Trang chủ ở trang web):**

- Người dùng báo: trang web thật vẫn phải hiện "Trang chủ" ở chú thích nút Trang chủ, không được khác home/dashboard.
- Sửa: `tipFor().home` dùng `t("home")` cho **mọi trang** (bỏ điều kiện chỉ áp dụng ở home/dashboard của 3.5.544); các nút khác giữ nguyên chú thích kèm phím tắt.
- File: `js/content/keepit-bar.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: ảnh thật 1512 + 390, sáng + tối, phóng 4×; `data-tip` nút Trang chủ = "Trang chủ" ở cả example.com, home và dashboard; các nút khác không đổi (Dịch (Alt+A), Đọc (Alt+R), Học (Alt+F), Hỏi AI (Alt+X), Thêm); `pageerror` + `console.error` = 0.
- Không tạo CRX (sandbox không có khoá ký).

**2026-11-17 | v3.5.544 | Arena.ai Agent sửa (thanh Keepit — chú thích nút Trang chủ quá dài):**

- Người dùng báo: rê chuột vào nút Trang chủ trên home/dashboard hiện câu dài "Mở trang chủ Keepit trong tab này", trong khi các nút khác chỉ hiện tên nút.
- Nguyên nhân: chú thích này là `homeTip` có sẵn của thanh, không phải chữ mới thêm ở bản này.
- Sửa: trên home/dashboard, chú thích nút Trang chủ = đúng tên nút (`bar_home` → "Trang chủ"). Trang web thật giữ nguyên `homeTip` như cũ.
- File: `js/content/keepit-bar.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: ảnh thật 1512 + 390, sáng + tối, phóng 4×; `data-tip` của 7 nút ở home/dashboard: Trang chủ · Tổng quan · Chép · Tìm kiếm (Ctrl+Space) · Ghi chú · Tài liệu · Thêm; rê chuột thấy "Trang chủ"; trang web vẫn "Mở trang chủ Keepit trong tab này"; `pageerror` + `console.error` = 0.
- Không tạo CRX (sandbox không có khoá ký).

**2026-11-17 | v3.5.543 | Arena.ai Agent sửa (thanh Keepit — tooltip hiện "undefined"):**

- Người dùng báo: rê chuột vào các nút tab trên thanh ở dashboard/home thì tooltip hiện chữ **undefined** (ảnh kèm).
- Nguyên nhân: 4 nút tab + 2 mục More là nút mới, không có mục trong `tipFor()`; thanh vẫn in `data-tip` nên ra chuỗi "undefined".
- Sửa: thêm `dashOverview`, `dashDictation`, `dashNotes`, `dashDocs`, `dashFlash`, `dashTrash` vào `tipFor()` (nhãn: Tổng quan, Chép, Ghi chú, Tài liệu, Flashcards, Thùng rác); chỉ in `data-tip` khi có chú thích.
- File: `js/content/keepit-bar.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: ảnh thật 1512 + 390, sáng + tối, phóng 4×; `data-tip` của cả 7 nút đều có chữ Việt, không còn `undefined`; rê chuột thấy hộp "Tổng quan"; `pageerror` + `console.error` = 0.
- Không tạo CRX (sandbox không có khoá ký).

**2026-11-17 | v3.5.542 | Arena.ai Agent sửa (thanh Keepit trên home + dashboard — làm lại từ 3.5.540):**

- Người dùng yêu cầu: không cần CRX, **lấy đúng 3.5.540** rồi làm đúng bản chốt v4 (chỉ thêm thanh Keepit), mỗi lần làm đọc lại chốt.
- Gốc: `git checkout d31a362 -- css js pages manifest.json` (3.5.540), bản 3.5.541 sai được bỏ; dọn `docs/chot/` + `docs/INDEX.md` về nguyên trạng; bản chốt chuyển vào `OPT-ARENA.md` (mục 2026-11-17 bản chốt v4).
- Thanh trên `pages/home.html` + `pages/dashboard.html`: 6 nút + Tìm kiếm ở giữa — Trang chủ · Tổng quan · **Chép (tab Chép chính tả)** | Tìm kiếm | Ghi chú · Tài liệu · Thêm. Ở dashboard bấm là chuyển tab tại chỗ (`[data-dashboard-view]`), từ trang chủ mở dashboard đúng tab qua `keepitDashboardActiveViewV1`.
- **Icon dùng chung một nguồn:** thêm `nav-overview`, `nav-dictation`, `nav-notes`, `nav-docs`, `nav-flashcards`, `nav-trash` vào `js/shared/icons.js`; menu trái dashboard đọc qua `data-icon` + `LHN_ICONS.applyIcons()` (gọi trong `dashboard.js`, không dùng inline script vì CSP MV3 chặn), thanh Keepit cũng đọc từ đó.
- More: giữ nguyên, thêm Flashcards + Thùng rác ở đầu nhóm "Công cụ"; danh sách công cụ của 2 trang = đúng 10 công cụ như trang web.
- Điện thoại: `html.keepit-bar-on` → ẩn `.rn-tabbar` (thanh Keepit đứng thay menu đáy dashboard). Nhãn tên tab đầy đủ, không cắt (font 10px, thu 9px/8.5px khi chật, ≤339px xuống 2 dòng).
- File: `js/content/keepit-bar.js`, `js/content/keepit-bar-css.js`, `js/shared/icons.js`, `js/core/languages.js`, `js/dashboard/dashboard.js`, `pages/dashboard.html`, `pages/home.html`, `css/dashboard/responsive.css`, `manifest.json`, `OPT-ARENA.md`, `PROJECT.md`.
- Kiểm tra: ảnh thật extension unpacked — 1512 và 390, sáng + tối (dark bật bằng ☰ → Giao diện), phóng 4× thanh (`qa/shots/542-*`); nhãn không cắt (minGap 12.6px ở 1512, 2.1px ở 390); Chép → view `dictation`; Thùng rác → `trash`; Flashcards mở hộp thoại; `.rn-tabbar` = `none` ở 390; trang web thật giữ nguyên bộ nút cũ; `pageerror` + `console.error` = 0.
- Không tạo CRX (sandbox không có khoá ký).

**2026-11-17 | v3.5.541 | Arena.ai Agent sửa (thanh Keepit trên home + dashboard) — ĐÃ BỊ THAY THẾ:**

- Bản đầu của thanh Keepit; sai 2 chỗ so với chốt: nút Chép chạy công cụ chép trên trang web (đúng ra là tab Chép chính tả) và More mất 9 công cụ; icon các nút không dùng nguồn chung.
- Toàn bộ được làm lại từ 3.5.540 ở v3.5.542.

**2026-11-19 | v3.5.532 | Arena.ai Agent sửa:**

- Người dùng: phần sửa sai thì phải xoá hẳn.
- Đã xoá nốt dòng còn sót của 3.5.530: `#dashboardDictationView.dashboard-dictation-view` đáy **14 → 34 px** (trả về nguyên trạng), bỏ ghi chú sai lý do.
- Còn lại **đúng một thay đổi** cho tab Chép chính tả: `.dictation-root .footer{margin-top:38px}` (18 → 38) — sửa đúng selector ở 3.5.531.
- File: `css/dashboard/dictation.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `git diff 3.5.529 -- css/` còn đúng 1 dòng đổi. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.531 | Arena.ai Agent sửa (tab Chép chính tả — dòng footer):**

- Người dùng báo 3.5.530 không có tác dụng (đã xác nhận đang chạy đúng 3.5.530).
- **Nguyên nhân: sai selector.** Footer trong DOM là `<footer class="footer">` thuộc `.dictation-root` (xem `pages/dashboard.html`), còn 3.5.530 sửa `#dashboardDictationView .dictation-footer` — class **không tồn tại** nên trình duyệt bỏ qua hoàn toàn.
- Sửa đúng chỗ: `css/dashboard/dictation.css` → `.dictation-root .footer{…margin-top:18px…}` đổi thành **38px**. Footer hạ xuống 20 px, nên khoảng cách khung tab tới đáy cũng giảm đúng 20 px (nội dung chảy theo).
- Bỏ dòng sửa sai trong `css/dashboard/overview.css` (trả `.dictation-footer` về 18px như cũ; đây là CSS chết, không dùng).
- File: `css/dashboard/dictation.css`, `css/dashboard/overview.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: đã đối chiếu class thật trong `pages/dashboard.html`. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.530 | Arena.ai Agent sửa (tab Chép chính tả — dòng footer):**

- Người dùng yêu cầu: (1) dòng "Keepit · Dictation" cách khối phía trên thêm 20 px; (2) khung tab cách đáy giảm 20 px.
- Sửa:
  - `css/dashboard/overview.css`: `.dictation-footer` margin-top **18 → 38 px**.
  - `css/dashboard/dictation.css`: `#dashboardDictationView.dashboard-dictation-view` đáy **34 → 14 px**.
- Tổng chiều cao khối không đổi (footer hạ 20 px, đáy bớt 20 px).
- File: `css/dashboard/overview.css`, `css/dashboard/dictation.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: **chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.540 | Arena.ai Agent — lời chào ở tab Tổng quan lấy tên tài khoản:**

- Người dùng: lời chào đầu tab Tổng quan phải lấy **đúng tên tài khoản** thay cho chữ "bạn".
- Sửa:
  - `pages/dashboard.html`: thẻ lời chào có `id="overviewGreeting"`.
  - `js/core/languages.js`: thêm `ovGreetingName` — en "Welcome back, {name}!", vi "Chào mừng {name} trở lại!", ko "{name}님, 다시 오신 것을 환영합니다!".
  - `js/dashboard/dashboard.js`: hàm `renderOverviewGreeting()` (dùng `profileDisplayName`), gọi trong `applyTranslations()` và cuối `renderProfileMenu()` (đăng nhập / đổi tên / đăng xuất / đổi ngôn ngữ đều cập nhật).
  - Chưa đăng nhập thì giữ nguyên câu mặc định `ovGreeting`.
- **Đã xác minh trên extension thật** (Chromium headless + unpacked, seed profile `{username:'huson', displayName:'Huson'}`):
  - vi: "Chào mừng Huson trở lại!" · ko: "Huson님, 다시 오신 것을 환영합니다!" · en: "Welcome back, Huson!"
  - Không có tài khoản: "Welcome back!" (mặc định). `pageerror` = **0**.
- File: `pages/dashboard.html`, `js/core/languages.js`, `js/dashboard/dashboard.js`, `manifest.json`, `PROJECT.md`.
- **Chưa kiểm được:** tài khoản Google thật (harness chỉ seed profile cục bộ).

**2026-11-19 | v3.5.539 | Arena.ai Agent sửa (dòng footer chung — cùng vị trí ở mọi tab):**

- Người dùng: dòng footer ở tab Tài liệu nằm cao hơn Chép chính tả / Ghi chú → chưa "chung một cái".
- Đo được trước khi sửa (extension thật): khoảng cách **footer → đáy khung** = Tổng quan **42px**, Chép chính tả **64,8px**, Ghi chú **20px**, Tài liệu **42px**.
- Sửa:
  - `overview.css`: `#dashboardScroller > #dashboardOverviewView` đáy 42 → **20px**.
  - `overview.css`: ghim footer của Chép chính tả xuống đáy khung (`.app`/`.content` flex cột + `.footer{margin-top:auto;padding-top:30px}`) — bỏ khoảng dư 44,8px.
  - `documents.css`: `html.dash-embedded .main` đáy 42 → **20px**.
  - `.dash-footer` thêm `line-height:14px` (trước đây dòng trong iframe cao 15,9px, lệch 2px so với các tab).
- **Đã xác minh trên extension thật** (Chromium headless + extension unpacked): sau sửa cả 4 tab đều **20px**, chiều cao dòng đều **14px**, ảnh 4 tab đã chụp, `console.error`/`pageerror` = 0.
- File: `css/dashboard/overview.css`, `css/dashboard/documents.css`, `manifest.json`, `PROJECT.md`.
- **Chưa kiểm được:** cửa sổ hẹp <390px; profile Chrome thật của người dùng.

**2026-11-19 | v3.5.538 | Arena.ai Agent — dòng footer chung cho mọi tab:**

- Người dùng: tab nào cũng có **một dòng giống nhau** — trái: tên app + tên tab **tiếng Anh**; phải: **slogan app**. Chốt: tên tab luôn tiếng Anh ở mọi ngôn ngữ, áp cho 5 tab chính (Flashcards là hộp thoại, không phải tab nên không có dòng này).
- Thêm một class dùng chung `.dash-footer` (dashboard.css **và** documents.css vì trang Tài liệu là tài liệu riêng): `display:flex;justify-content:space-between;flex-wrap:wrap;margin-top:30px;color:#9da4b2;font-size:11px` + `html.dark` màu `#95959c`.
- Áp cho 4 tab có vùng hiển thị: Tổng quan (`Keepit · Overview`), Chép chính tả (`Keepit · Dictation`), Ghi chú (`Keepit · Notes`), Tài liệu (`Keepit · Documents`); bên phải dùng khoá có sẵn `dashboardSubtitle` = "Keep Exploring Everything" (đã dịch đủ 3 ngôn ngữ).
- `js/core/languages.js`: thêm 4 khoá `dashFooter*`, giá trị tiếng Anh cho cả en/vi/ko (đúng lựa chọn "luôn tiếng Anh").
- Bỏ class `ov-footer` khỏi dòng của Tổng quan để không bị cỡ chữ 9px/margin 17px cũ đè.
- **Đã xác minh trên extension thật** (harness `/home/user/qa/footer_tabs.py` + `footer_shots.py`, Chromium + Xvfb):
  - Cả 4 tab đều có `.dash-footer`, nội dung đúng, cùng cỡ (cao 14px, rộng 1225px) — Tài liệu nằm trong iframe nên đo riêng (15,9px).
  - Ảnh sáng + tối đã chụp; `console.error`/`pageerror` = **0**.
- File: `pages/dashboard.html`, `pages/documents.html`, `js/core/languages.js`, `css/dashboard/dashboard.css`, `css/dashboard/documents.css`, `manifest.json`, `PROJECT.md`.
- **Chưa kiểm được:** profile Chrome thật của người dùng; hành vi khi cửa sổ hẹp dưới 390px.

**2026-11-19 | v3.5.537 | Arena.ai Agent sửa (theo yêu cầu trực tiếp của người dùng):**

- Lấy lại **nguyên code 3.5.529** (`git checkout 3.5.529 -- css/ js/ pages/`), xác nhận `git diff` rỗng.
- Sửa đúng 2 chỗ người dùng chỉ định:
  - `css/dashboard/dictation.css`: `.dictation-root .footer` → `margin-top: 30px`.
  - `css/dashboard/overview.css`: rule thắng `#dashboardScroller > #dashboardDictationView` → `padding-bottom: 20px` (trước là 34px).
- Nguyên tắc "quay về bản gốc trước lần sửa sai" đã có trong `AGENTS.md` §3.1 (thêm từ 3.5.534, vẫn giữ).
- File: `css/dashboard/dictation.css`, `css/dashboard/overview.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra bằng harness extension thật: xem mục kết quả đo bên dưới.

**2026-11-19 | v3.5.536 | Arena.ai Agent sửa (tab Chép chính tả — khoảng cách dòng footer):**

- Người dùng: footer phải cách khối phía trên thêm 20 px, khung tab cách đáy giảm 20 px.
- **Đã xác minh bằng số đo trên extension thật** (harness `/home/user/qa/run.py`, Chromium thật + Xvfb, nạp unpacked từ repo):
  - `gapAboveFooter` (footer ↔ khối trên): **18 → 38 px** (+20).
  - `gapFooterToFrameBottom` (footer ↔ đáy khung): **90,8 → 70,8 px** (−20).
  - Ảnh: 1512 sáng/tối + 390 sáng/tối, `console.error`/`pageerror` = **0**.
  - 390 px: khoảng đáy không đổi (25 px, do media query riêng) — không hồi quy.
- Sửa đúng **một dòng**: `css/dashboard/dictation.css` → `.dictation-root .footer{…margin-top:18px…}` → **38px**.
- Vì sao 4 bản trước vô hiệu: rule thắng là `#dashboardScroller > #dashboardDictationView` (2 id) trong `overview.css`, đè mọi rule 1 id + 1 class của `dictation.css`; còn `margin-top` thì đúng rule `.dictation-root .footer` — sau khi có harness mới đo được.
- File: `css/dashboard/dictation.css`, `manifest.json`, `PROJECT.md`. Code nền vẫn là 3.5.529 + đúng 1 dòng này.
- **Chưa kiểm được:** profile Chrome thật của người dùng, dữ liệu phiên thật.

**2026-11-19 | v3.5.535 | Arena.ai Agent sửa (tab Chép chính tả — đáy):**

- Người dùng gửi DevTools: `main#dashboardDictationView` = `padding: 0px 32px **34px**` → đáy chưa giảm.
- Nguyên nhân: footer của tab **bị neo xuống đáy khung**, nên `margin-top` (bản 3.5.533) không làm footer hạ; muốn giảm đáy phải giảm **padding-bottom**.
- Làm lại từ bản gốc 3.5.529 (bỏ thay đổi của 533), sửa đúng một số: `#dashboardDictationView.dashboard-dictation-view` đáy **34 → 14 px**.
- Kết quả: footer hạ 20 px + khoảng khung tới đáy giảm 20 px.
- File: `css/dashboard/dictation.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `git diff 3.5.529 -- css/` chỉ còn 1 dòng. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.534 | Arena.ai Agent — ghi nguyên tắc vào AGENTS.md §3.1:**

- Thêm 1 dòng vào §3.1: "Làm sai thì quay về bản gốc trước lần sửa sai rồi sửa lại từ đó — không vá chồng lên bản sai, không chỉ xoá dòng sai."
- File: `AGENTS.md`, `manifest.json`, `PROJECT.md`. Không đổi code.

**2026-11-19 | v3.5.533 | Arena.ai Agent sửa (làm lại từ bản gốc):**

- Người dùng: sai thì phải **quay về bản gốc trước khi sửa sai** rồi sửa lại, không chỉ xoá dòng.
- Đã làm: `git checkout 3.5.529 -- css/ js/ pages/` → code về **đúng nguyên bản 3.5.529** (bản trước khi sửa sai ở 530), xác nhận `git diff` rỗng.
- Rồi sửa lại từ bản gốc, **đúng một dòng**: `css/dashboard/dictation.css` → `.dictation-root .footer{…margin-top:18px…}` thành **38px**.
- Toàn bộ thay đổi CSS của 3.5.530 / 3.5.531 / 3.5.532 bị **loại bỏ** (vẫn còn trong lịch sử git để tra).
- File: `css/dashboard/dictation.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `git diff 3.5.529 -- css/` chỉ còn 1 dòng đổi (18 → 38). **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.529 | Arena.ai Agent sửa (tab Chép chính tả):**

- Người dùng: tab Chép chính tả có "khung giữa" mang màu nền sai; đáng lẽ không thêm màu như các tab khác.
- Nguyên nhân: `.dictation-root` **tô thêm một lớp nền** `#f5f5ff` bên trong `#dashboardDictationView` (vùng này cũng đã tô #f5f5ff) → thành 2 lớp, nhìn như một khung màu.
- Sửa:
  - `css/dashboard/dictation.css`: `#dashboardDictationView .dictation-root` → `background:transparent` — chỉ còn vùng tab tô nền, đúng một lớp như các tab khác.
  - `css/dashboard/overview.css`: trả `#dashboardDictationView` về **nguyên trạng** (padding `0 24px 24px!important`, `background:#f5f5ff`) như trước 3.5.528 — đó là chỗ mình làm hỏng khi gom biến ở 528.
- 3.5.528 (gom biến chung) vẫn giữ nhưng **bỏ phần áp vào Chép chính tả**; Tổng quan và Tài liệu vẫn dùng `var(--dash-page-*)`.
- File: `css/dashboard/dictation.css`, `css/dashboard/overview.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: **chưa kiểm bằng ảnh** (không chạy được Chrome).

**2026-11-19 | v3.5.527 | Arena.ai Agent sửa (chỉ UI tab Tài liệu — nền theme SÁNG):**

- Người dùng: theme sáng nền tab Tài liệu vẫn khác các tab khác; hỏi tối đã dùng chung biến chưa.
- Trả lời (đúng): ở 3.5.525 bản tối **chưa dùng chung biến** — khung tài liệu dùng biến riêng `--page` của chính nó, chỉ **trùng giá trị** #000 với `var(--lhn-ui-page)` của Dashboard.
- Nguyên nhân theme sáng: vùng `#dashboardDocumentsView` để `background:transparent` → khe trên/dưới khung lộ nền `#dashboardScroller` = **#e9edf4**, trong khi các tab khác dùng **#f5f5ff**.
- Sửa trong `css/dashboard/documents-host.css`: `#dashboardDocumentsView` → `background:#f5f5ff!important` và `html.dark …{background:var(--lhn-ui-page,#000)!important}` — đúng hai giá trị của các tab khác; khung tài liệu vẫn tô `var(--page)` (sáng #f5f5ff, tối #000) nên hai lớp khớp nhau, không còn khe lệch màu.
- Không đổi bố cục, không đụng bộ xem tệp; nền code vẫn đúng 3.5.522 (+ các dòng 525/526).
- File: `css/dashboard/documents-host.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: **chưa kiểm bằng ảnh** (không chạy được Chrome).

**2026-11-19 | v3.5.526 | Arena.ai Agent sửa (chỉ UI tab Tài liệu):**

1. **Thanh trên cùng không hiện dần khi mở tab Tài liệu.** Nguyên nhân: `restoreDashboardViewAndReveal()` loại trừ thẳng tab này — `else if (view !== "documents") resetDashboardPanelEntranceEffects(view)`. Sửa: bỏ điều kiện loại trừ → tab Tài liệu cũng chạy nhịp hiện dần; `dashboardPanelRevealTargets("documents")` trả rỗng nên **chỉ thanh trên cùng** chạy, thư viện vẫn dùng hiệu ứng riêng đã có.
2. **Khoảng trống 2 bên khác các tab khác.** Đo trên ảnh: lề trái tab Tài liệu ≈ 44 px, còn tab Tổng quan dùng `clamp(16px,3vw,32px)` (≈32 px ở 1568 px). Sửa: `html.dash-embedded .main` → `padding:0 clamp(16px,3vw,32px) 42px`, đúng bằng tab Tổng quan.
- Nền code vẫn đúng 3.5.522 + 1 dòng nền của 3.5.525; không đụng bộ xem tệp.
- File: `js/dashboard/dashboard.js`, `css/dashboard/documents.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check`. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.525 | Arena.ai Agent sửa:**

- Người dùng: 523 và 524 làm hỏng; **lùi về 3.5.522**, chỉ sửa nền đen của tab Tài liệu.
- Đã lùi: `git diff 3666b87` = trống (code y nguyên 3.5.522) trước khi sửa.
- **Số đo trên ảnh người dùng gửi** (1920×1080): vùng nội dung tab Tài liệu = **#121212**, sidebar = #0d0d0f, khe nền Dashboard = #000. `#121212` chính là màu nền canvas mặc định của chế độ tối của Chrome.
- Nguyên nhân: khi nhúng, `html.dash-embedded, html.dash-embedded body` được đặt `background:transparent` → khung không có nền tường minh nên Chrome tự tô canvas bằng màu mặc định #121212, đè lên nền #000 của Dashboard.
- Sửa (đúng 1 dòng, trong `css/dashboard/documents.css`): `background:transparent` → `background:var(--page,#fff)` (tối: #000, sáng: #f5f5ff) — nền khung trùng đúng biến nền của trang/Dashboard.
- Không đổi gì khác. File: `css/dashboard/documents.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: **chưa kiểm bằng ảnh** (không chạy được Chrome).

**2026-11-19 | v3.5.522 | Arena.ai Agent sửa:**

- Người dùng: đang ở tệp → reload → bấm ← thì **mất thanh trên cùng** của Dashboard; sửa như cách đã làm trước (3.5.510).
- Sửa trong `js/dashboard/dashboard.js`, handler `KEEPIT_DOCUMENTS_VIEWER`: khi `open !== true` thì thêm `ov-revealed` và bỏ `ov-reveal` cho `#dashboardSharedTopbar` → đóng tệp là thanh chắc chắn hiện.
- Chỉ đụng nhánh đóng tệp; hiệu ứng hiện dần của thanh ở các tab khác giữ nguyên; nền code vẫn đúng 3.5.503.
- File: `js/dashboard/dashboard.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check`. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.521 | Arena.ai Agent sửa:**

- Người dùng: khi từ màn hình tệp bấm ← về, tab Tài liệu phải hiện hiệu ứng như lần đầu mở tab.
- Sửa đúng một chỗ trong `js/dashboard/documents.js`: cuối `closeViewer()` (sau `await refreshLibrary()`) gọi `revealLibrary()` — dùng lại đúng hiệu ứng chung ở `css/shared/dashboard-reveal.css`.
- Không đổi gì khác: không đụng bộ xem tệp, không đụng cách đóng tệp, nền code vẫn đúng 3.5.503.
- File: `js/dashboard/documents.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check`. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.520 | Arena.ai Agent sửa:**

- Người dùng: 3.5.519 "không hiện hiệu ứng gì nữa".
- Nguyên nhân: 519 dùng **transition** và gắn/gỡ class trong cùng một nhịp (dù có ép reflow) → trình duyệt thường bỏ qua, không chạy transition. Bản 518 dùng animation nên thấy được.
- Sửa: giữ **một định nghĩa duy nhất** ở `css/shared/dashboard-reveal.css` nhưng viết bằng `@keyframes dashboardRevealIn` với đúng số đo của Dashboard (24 px + thu 98%, 0,8 s, `.16,1,.3,1`, trễ `--ov-reveal-delay`, khối đầu 100 ms, +80 ms mỗi khối). `revealLibrary()` gỡ class → ép reflow → gắn lại.
- An toàn: không có class thì nội dung hiện bình thường (không thể ra tab trắng); `prefers-reduced-motion` thì tắt hiệu ứng.
- Không đổi gì ở Dashboard, bộ xem tệp; nền code vẫn đúng 3.5.503.
- File: `css/shared/dashboard-reveal.css`, `js/dashboard/documents.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check`. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.519 | Arena.ai Agent sửa:**

- Người dùng: hiệu ứng tab Tài liệu phải **giống hẳn** các tab khác — "dùng 1 thứ đi".
- Cách làm: **một định nghĩa duy nhất** — `css/shared/dashboard-reveal.css` chứa đúng bộ class/số đo của Dashboard (`.dashboard-reveal` → `.dashboard-revealed`: nhích 24 px + thu 98%, 0,8 s, `.16,1,.3,1`, trễ `--ov-reveal-delay` mặc định 100 ms); `pages/documents.html` nạp file này.
- `js/dashboard/documents.js`: `revealLibrary()` gắn `.dashboard-reveal`, gỡ `.dashboard-revealed`, rồi gắn lại với nhịp **100 ms khối đầu, +80 ms mỗi khối** — đúng nhịp các tab khác.
- Đã bỏ bản mô phỏng cũ: `.lib-rise` + `@keyframes vin` (3.5.518) và hệ transition tự dựng (3.5.516/517).
- Nền code vẫn đúng 3.5.503; không đụng bộ xem tệp, không đụng tab khác.
- File: `css/shared/dashboard-reveal.css` (mới), `pages/documents.html`, `css/dashboard/documents.css`, `js/dashboard/documents.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check`. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.518 | Arena.ai Agent sửa:**

- Người dùng chỉ đạo: lấy đúng 3.5.503 và **chỉ cần gọi hiệu ứng** cho đúng, không tự dựng thêm.
- Sửa: bỏ hệ transition tự dựng ở 3.5.516/3.5.517; thay bằng **gọi lại `@keyframes vin`** đã có sẵn trong `css/dashboard/documents.css` (đang dùng cho bộ xem tệp/modal) qua class `.lib-rise` — mờ dần + nhích lên 8 px trong 0,55 s, nhịp 80 ms mỗi khối do JS đặt.
- JS: `revealLibrary()` giờ chỉ gỡ rồi gắn class `.lib-rise` + đặt `animation-delay`; nếu JS không chạy thì khối vẫn hiện bình thường (an toàn hơn cách cũ).
- Vẫn chạy mỗi lần mở tab (Dashboard gửi `KEEPIT_DOCUMENTS_REVEAL` khi khung đã hiện thật) và lúc boot.
- Nền code vẫn đúng 3.5.503; không đụng bộ xem tệp.
- File: `css/dashboard/documents.css`, `js/dashboard/documents.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check`. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.517 | Arena.ai Agent sửa:**

- Người dùng: 3.5.516 "không có hiệu ứng hiện dần giống các tab khác"; bản 515 thì đúng.
- Nguyên nhân 1: selector sai — 3 khối nằm trong `main.main` nên **không phải** con trực tiếp của `.app`; CSS `html.library-reveal .app>.row…` không khớp gì. Đã sửa cả CSS và JS thành `.main>.row`, `.main>.panel.drop`, `.main>.lib`.
- Nguyên nhân 2: hiệu ứng chạy lúc boot, khi khung còn `opacity:0` (chưa có `documents-frame-ready`) → chạy xong trước khi người dùng thấy. Đã thêm: Dashboard gửi `KEEPIT_DOCUMENTS_REVEAL` ngay sau khi khung hiện thật (chậm 60 ms), vẫn gửi mỗi lần mở tab.
- Nền code vẫn là 3.5.503 như người dùng chỉ định; không đụng bộ xem tệp.
- File: `css/dashboard/documents.css`, `js/dashboard/documents.js`, `js/dashboard/dashboard.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` 2 file JS; đã đếm lại selector. **Chưa kiểm bằng ảnh.**

**2026-11-19 | v3.5.516 | Arena.ai Agent sửa:**

- Người dùng chỉ đạo: **lấy đúng 3.5.503 làm nền** (một lớp: thư viện nằm trong trang tài liệu), bỏ toàn bộ 504–515, rồi **thêm hiệu ứng hiện dần khi mở tab Tài liệu như các tab khác**. Đã xác nhận qua câu hỏi trước khi làm.
- Code nền: `git diff c09f3f9` = trống (giống hệt 3.5.503); đã xoá `js/dashboard/documents-library.js` + `css/dashboard/documents-library.css`.
- Thêm:
  - `css/dashboard/documents.css`: `html.library-reveal` → 3 khối lớn (`.row`, `.panel.drop`, `.lib`) ẩn + nhích lên 18 px rồi hiện dần 0,7 s; nhịp 80 ms mỗi khối; tôn trọng `prefers-reduced-motion`.
  - `js/dashboard/documents.js`: `revealLibrary()` — chạy lúc boot và khi nhận tin `KEEPIT_DOCUMENTS_REVEAL`.
  - `js/dashboard/dashboard.js`: mỗi lần mở tab Tài liệu gửi `KEEPIT_DOCUMENTS_REVEAL` cho khung (lần mở đầu khung còn nạp → trang tự chạy lúc boot).
- Không đụng bộ xem tệp, không đổi đường mở/đóng tệp.
- File: `css/dashboard/documents.css`, `js/dashboard/documents.js`, `js/dashboard/dashboard.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` 2 file JS. **Chưa kiểm bằng ảnh** (không có Chromium trong phiên này).

**2026-11-18 | v3.5.503 | Arena.ai Agent sửa:**

- Người dùng: "vẫn rất ngu và lỗi, mệt mỏi quá, quay tab tài liệu về v30".
- **Đưa tab Tài liệu về kiến trúc v30 (3.5.430):** thư viện, mở tệp, nhập tệp do chính `pages/documents.html` lo; Dashboard chỉ hiển thị khung.
  - Xoá `js/dashboard/documents-library.js`, `css/dashboard/documents-library.css` (lớp thư viện do Dashboard vẽ từ 3.5.431, kèm popup "Đang mở tệp", `openByReload`, `documents-opening`).
  - Xoá `js/dashboard/open-trace.js`, `js/dashboard/selection-diagnostic.js` (bảng chẩn đoán tạm).
  - `pages/dashboard.html`: bỏ 2 link/script của lớp đó + open-trace. `pages/documents.html`: bỏ script chẩn đoán.
  - `css/dashboard/documents-host.css`: trả về **đúng bản v30** (`git checkout 3e29d46 -- …`) — khung nằm trong route, Dashboard đo chiều cao nội dung; chỉ full màn hình khi đang xem tệp. Bỏ mọi rule 3.5.492/3.5.493 (gating `documents-viewer-ready`).
  - Giữ lại phần đã sửa trong **trang tài liệu**: `documents.js` của HEAD (bản sửa nhập tệp 3.5.480, khoá chọn chữ có mở khoá an toàn 3.5.494) — không revert file này để không mất bản sửa.
- Hệ quả: không còn popup do Dashboard vẽ, không còn reload khung, không còn mảng đen; mở tệp ngay trong trang như v30.
- File: `pages/dashboard.html`, `pages/documents.html`, `css/dashboard/documents-host.css`, xoá 4 file, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` dashboard.js/documents.js hợp lệ; `grep` không còn tham chiếu tới file đã xoá (chỉ còn một lời gọi `window.KeepitDocumentsLibrary?.mount?.()` có `?.` nên vô hại). **Chưa kiểm bằng ảnh/số đo.**

**2026-11-18 | v3.5.502 | Arena.ai Agent sửa:**

- Người dùng: "501 vẫn ngu… tự dưng có đen phía sau, tôi không thích".
- **Gỡ toàn bộ thay đổi hình ảnh của 3.5.500 + 3.5.501** (`git checkout 2e0a0a5 -- js/dashboard/documents-library.js css/dashboard/documents-library.css`): bỏ trạng thái `body.documents-opening`, bỏ nền đặc, bỏ việc ẩn `.dlib`, bỏ popup tự hiện khi vào bằng `?document=`.
- Giữ nguyên phần **cơ chế** đã chạy đúng: mở tệp bằng tải lại khung với `?document=` (3.5.497), nhập tệp cũng vậy (3.5.498), và các trạng thái `documents-viewer-open/ready` (3.5.493).
- Nghĩa là: quay lại đúng giao diện 3.5.499 — popup mờ nhẹ trên nền thư viện, không có mảng đen.
- File: `js/dashboard/documents-library.js`, `css/dashboard/documents-library.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: đã soát `grep documents-opening` = 0 chỗ còn lại. **Chưa kiểm bằng ảnh/số đo.**

**2026-11-18 | v3.5.501 | Arena.ai Agent sửa:**

- Người dùng: "lần này thì bị đen tab tệp ở phía sau là sao, v30 là vào thẳng luôn mà".
- Nguyên nhân: 3.5.500 ẩn `.dlib` nhưng nền popup chỉ mờ 25% → phần tab Tài liệu trống lộ ra (nền tối ở chế độ tối = mảng đen).
- Sửa: `body.documents-opening .dlib-open{background:var(--dl-soft)}` — nền popup **đặc**, theo theme (sáng `#fbfaff`, tối `#151517`); phía sau không còn mảng đen cũng không còn danh sách, chỉ popup rồi vào thẳng tệp.
- File: `css/dashboard/documents-library.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: chưa chạy được Chrome trong phiên này. **Chưa kiểm bằng ảnh/số đo.**

**2026-11-18 | v3.5.500 | Arena.ai Agent sửa:**

- Người dùng: "bản 30 mở ra hiện load xong là vào file luôn, reload lại cũng vào file luôn, còn 98 thì mở ra load là hiện vào list danh sách ở tab tài liệu rồi mới vào file".
- Nguyên nhân: trong lúc khung tải lại với `?document=`, Dashboard vẫn vẽ **thư viện** phía sau popup (popup chỉ có nền mờ 25%).
- Sửa: thêm trạng thái `body.documents-opening` — bật ngay khi bấm mở / khi bắt đầu nhập tệp / khi vào Dashboard bằng `?document=…`; tắt khi khung báo `VIEWER_READY` hoặc đóng tệp/huỷ; có failsafe 20 giây.
  - `css/dashboard/documents-library.css`: `body.documents-opening #dashboardDocumentsView .dlib{opacity:0;pointer-events:none}` → **không còn thấy danh sách** trước khi vào tệp.
  - `js/dashboard/documents-library.js`: `beginOpening()` / `endOpening()`; vào bằng `?document=` còn hiện luôn popup đúng tên tệp.
- Kết quả mong đợi: bấm mở → popup → thẳng vào tệp; reload → popup → thẳng vào tệp. Không lộ tab tài liệu.
- File: `js/dashboard/documents-library.js`, `css/dashboard/documents-library.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hợp lệ. **Chưa kiểm bằng ảnh/số đo.**

**2026-11-18 | v3.5.499 | Arena.ai Agent sửa:**

- Người dùng: "ủa sao được rồi nè" + 2 báo cáo xác nhận: `mở bằng ?document=8d178627…`, `lopChu = 3 lớp, 532 span, 532 span có kích thước, span đầu 33×22`, `probeText = OK → span.en`, vùng chọn 26 ký tự → thanh hiện. Nhập tệp cũng chạy: `IMPORTED → đổi src → VIEWER → VIEWER_READY` (≈2,1 giây cho tệp 46,9 MB).
- **Lỗi "mở tệp xong bôi đen không ăn / thanh không hiện" — ĐÓNG.** Gốc: mở bằng `postMessage` khiến lớp chữ dựng sai hình học (span 0×0); mở bằng `?document=` dựng đúng. Nay cả **bấm mở** (3.5.497) và **kéo-thả nhập** (3.5.498) đều dùng đường `?document=`.
- Tắt 2 bảng chẩn đoán (`DIAG = false` trong `selection-diagnostic.js` và `open-trace.js`); giữ file để bật lại 1 dòng nếu lỗi tái phát.
- File: `js/dashboard/selection-diagnostic.js`, `js/dashboard/open-trace.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hợp lệ. Đã kiểm chứng bằng báo cáo của người dùng (số đo ở trên).

**2026-11-18 | v3.5.498 | Arena.ai Agent sửa:**

- Báo cáo 3.5.496 người dùng gửi (08:30) cho thấy họ thử bằng **kéo-thả tệp để nhập** → vẫn `mở bằng tin nhắn`: `92 span, 0 span có kích thước`, có lần `mouseup` cho `ranges:1, text:false` (vùng chọn rỗng). Đường 3.5.497 chỉ sửa cho **bấm mở**, chưa phủ đường **nhập tệp**.
- `js/dashboard/documents.js`: tin `KEEPIT_DOCUMENTS_IMPORTED` gửi kèm `documentId` của tệp vừa mở.
- `js/dashboard/documents-library.js`: nhận `IMPORTED` → `openByReload(documentId)` — khung **tải lại với `?document=…`**, popup giữ tới `VIEWER_READY` (failsafe 8 giây). Nhập trùng (count 0) vẫn đi đường cũ.
- Kết quả mong đợi: cả **bấm mở** và **kéo-thả nhập** đều dùng chung một đường mở đã đo là đúng.
- File: `js/dashboard/documents.js`, `js/dashboard/documents-library.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hợp lệ. **Chưa kiểm bằng ảnh/số đo** — chờ báo cáo người dùng.

**2026-11-18 | v3.5.497 | Arena.ai Agent sửa:**

- Người dùng gửi 4 tệp báo cáo (trước/sau khi load, cả Dashboard + khung). Số đo **quyết định**:
  - mở bằng **tin nhắn** (lỗi): `lopChu = "3 lớp, 92 span, 0 span có kích thước, span đầu 0×0"`, `probeText = KHÔNG có span chữ nào có kích thước`, `mousedown top = div.textLayer.pdfTextLayer` → chuột **không trúng chữ**; có lần `mouseup` cho `ranges:1, text:false` = vùng chọn bị rỗng giữa lúc kéo.
  - mở bằng **`?document=`** (được): `92 span, 92 span có kích thước, span đầu 556×62`, `mousedown top = span.en`, `probeText = OK`.
  → Lỗi nằm ở **hình học lớp chữ khi mở bằng tin nhắn**, không phải thời điểm, không phải khoá chọn chữ.
- Sửa: `openDoc()` trong `js/dashboard/documents-library.js` **cho khung tải lại với `?document=<id>`** (`openByReload`) thay vì `postMessage` — đúng đường mà "load lại" vẫn chạy. Popup "Đang mở tệp" giữ tới `KEEPIT_DOCUMENTS_VIEWER_READY` (đã có từ 3.5.493) nên khung tải lại không lộ ra.
- Đóng tệp → `restoreFrameSrc()` trả khung về trang thư viện để **kéo-thả/nhập tệp vẫn đi đường cũ** (không tái phạm lỗi 3.5.488). Có cờ `viewerWasOpen` chống vòng lặp tải lại.
- Giữ nguyên bảng chẩn đoán ở 2 nơi để kiểm chứng bản này.
- File: `js/dashboard/documents-library.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hợp lệ; `git diff` chỉ 1 file JS. **Chưa kiểm bằng ảnh/số đo** — cần báo cáo của người dùng.

**2026-11-18 | v3.5.496 | Arena.ai Agent sửa:**

- Người dùng: "lỗi vẫn vậy" (sau 3.5.495). Ngừng đoán; dựng bộ ghi **toàn bộ đường mở tệp** để lấy số đo đúng khoảnh khắc lỗi.
- `js/dashboard/open-trace.js` (nạp cuối `pages/dashboard.html`): chặn `Window.prototype.postMessage` ghi mọi tin `KEEPIT_*` hai chiều, theo dõi `#dashboardDocumentsFrame` (src/class/style), `body.class`, thẻ `#docLibOpenCard`; nút **Tải báo cáo** xin báo cáo trong khung rồi **gộp 1 tệp .txt**.
- `js/dashboard/selection-diagnostic.js`: bật lại bảng chẩn đoán, thêm đo lớp chữ (**bao nhiêu span có kích thước thật** — span 0×0 là nghi phạm chính), trạng thái font, có/không thanh `#lhn-*` kèm kích thước & opacity, vùng chọn ngay/+50/+250 ms, và tự trả lời `KEEPIT_DIAG_REQUEST` của trang cha.
- Không đổi hành vi mở tệp, UI, cài đặt. Tắt bằng `const DIAG = false` ở đầu 2 file.
- File: `js/dashboard/open-trace.js` (mới), `js/dashboard/selection-diagnostic.js`, `pages/dashboard.html`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hợp lệ. **Chưa kiểm bằng ảnh/số đo** — bộ ghi này chính là để lấy số đo.

**2026-11-18 | v3.5.495 | Arena.ai Agent sửa:**

- Người dùng gửi ảnh: bôi đen trong tài liệu → thanh **Tô sáng / Dịch / Hỏi AI** hiện đúng, vùng chọn 449 ký tự. Không còn hỏi lại.
- Tắt bảng chẩn đoán (`DIAG = false` trong `js/dashboard/selection-diagnostic.js`); giữ file để bật lại bằng 1 dòng nếu lỗi tái phát.
- **Lỗi "mở tệp đầu tiên không bôi đen được" — ĐÓNG.** Nguyên nhân: `lockSelectionUntilQuiet()` (3.5.491) bị ngắt giữa lúc khoá thì thoát mà không mở khoá → `user-select:none` kẹt vĩnh viễn; sửa ở 3.5.494. Bằng chứng: `selectLocked=false`, `user-select:auto`, vùng chọn còn nguyên ở +250 ms, `reachedShowIcon`.
- File: `js/dashboard/selection-diagnostic.js`, `manifest.json`, `PROJECT.md`.

**2026-11-18 | v3.5.494 | Arena.ai Agent sửa:**

- Người dùng: "đâu được đâu, vẫn lỗi vậy mà" + xác nhận bôi đen **chết hẳn** (bấm lại lần 2, lần 3 vẫn không được) → nguyên nhân **không phải thời điểm**; dừng đoán, chuyển sang đo.
- Sửa lỗi thật tìm thấy khi đọc code: `lockSelectionUntilQuiet()` (3.5.491) khi `cycle!==viewCycle` **thoát mà không mở khoá** → `#viewer[data-select-locked="true"]{user-select:none!important}` kẹt **vĩnh viễn** = bôi đen chết hẳn. Nay mở khoá trước khi thoát.
- Thêm `js/dashboard/selection-diagnostic.js` (nạp cuối `pages/documents.html`): bảng nhỏ góc dưới trái hiện `last.stage` của content.js (`mouseup.noTextOrEditable / disconnected / outsideContext / websiteDisabled`), vùng chọn ngay/+50 ms/+250 ms, `nativeReady`, `selectLocked`, `user-select` của `#stage`, số đoạn chữ, và `elementFromPoint` trên một đoạn chữ thật (phát hiện vật lạ chặn chuột). Có nút **Chép** / **Tải .txt** / **Ẩn**.
- Bản này KHÔNG sửa gì khác về UI/luồng; tắt bảng bằng `const DIAG = false` ở đầu file (sẽ tắt sau khi có kết quả).
- File: `js/dashboard/documents.js`, `js/dashboard/selection-diagnostic.js` (mới), `pages/documents.html`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` hợp lệ. **Chưa kiểm bằng ảnh/số đo** (không có Chrome trong phiên này).

**2026-11-18 | v3.5.493 | Arena.ai Agent sửa:**

- Người dùng: "làm xong mới cho vào trang đang mở… hiện popup load đến khi xong hết là mới hiện trang tài liệu, vô cái là chọn được bình thường".
- `dashboard.js`: thêm trạng thái `documents-viewer-ready` — bật khi khung báo `KEEPIT_DOCUMENTS_VIEWER_READY`, tắt mỗi lần mở tệp; chống kẹt 10 giây.
- `documents-host.css`: `body.documents-viewer-open:not(.documents-viewer-ready) #dashboardDocumentsFrame{opacity:0;pointer-events:none}` → khung vẫn `display:block` (đo layout đúng) nhưng **vô hình và không nhận chuột** cho tới khi xong.
- `documents-library.js`: mở tệp thường cũng hiện popup "Đang mở tệp" (trước đây chỉ khi nhập tệp), ẩn khi khung báo xong, chống kẹt 10 giây.
- Kết quả: mở tệp → popup → trang chỉ hiện khi đã dựng xong → bôi đen là có thanh; không đổi UI, không đổi luồng mở/nhập tệp, kéo-thả giữ nguyên.
- File: `js/dashboard/dashboard.js`, `js/dashboard/documents-library.js`, `css/dashboard/documents-host.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `node --check` 2 file JS hợp lệ; `git diff` chỉ 4 chỗ. **Chưa kiểm bằng ảnh/số đo** (không có Chrome trong phiên này).

**2026-11-18 | v3.5.492 | Arena.ai Agent sửa:**

- Người dùng: "sao bản giờ không chạy ngầm cái frame giống như 3.5.430? như vậy là được mà" → đồng ý cho làm.
- `dashboard.js`: sau khi Dashboard khởi tạo xong, **nạp sẵn `#dashboardDocumentsFrame`** (khung vốn `display:none` nên vẫn tải và boot bình thường). Bỏ qua khi đang ở tab Tài liệu hoặc URL đã có `?document=` để không phá deep link.
- Mục đích: lần mở tệp **đầu tiên** sau khi cài lại extension không còn "khung nguội" — đúng cơ chế mà 3.5.430 vô tình có được vì mọi thứ nằm trong một trang.
- File: `js/dashboard/dashboard.js`, `manifest.json`, `PROJECT.md` (mục 1, 2, 5).
- Kiểm tra: `node --check js/dashboard/dashboard.js` hợp lệ; `git diff` chỉ 1 chỗ chèn. **Chưa kiểm bằng ảnh/số đo** (không có Chrome trong phiên này) — cần người dùng thử: remove + load lại extension, mở tệp PDF đầu tiên, bôi đen ngay; kiểm thêm kéo-thả tệp.

**2026-11-18 | v3.5.491 | Arena.ai Agent sửa (người dùng: "kéo tệp vào không mở được nữa", "sao không làm giống v30"):**

- Người dùng đúng: bản 3.5.488 của tôi cho khung **tự nạp lại bằng URL** khi mở tệp → đụng đúng lúc khung đang nhập tệp (kéo-thả) nên tệp không mở được.
- Đã **revert 3 file** (`documents.js`, `documents-context.js`, `documents-library.js`) về đúng trạng thái **3.5.485** — tức cơ chế mở tệp như 3.5.430: mở trong khung, không nạp lại khung, không đổi URL.
- Chỉ giữ lại 2 thay đổi tối thiểu: (1) `documents-context.js` không chờ `refreshSource()` (tránh treo `openViewer`); (2) `documents.js` khoá chọn chữ **cho tới khi `#stage` không đổi DOM trong 500 ms** (tối đa 8 giây), bọc `try/catch` để không bao giờ chặn việc mở tệp — đây là cách chặn đúng lỗi "bôi đen xong vùng chọn bị xoá".
- Đã bỏ: mở bằng URL (3.5.488), chia `refresh({tools})` + hoãn vẽ lại (3.5.489) — vì 3.5.485 vốn đã vẽ ghi chú ở **cuối** như 3.5.430.
- File: `js/dashboard/documents.js`, `js/dashboard/documents-context.js`, `manifest.json`. Kiểm tra: `node --check` hợp lệ; `git diff 3.5.485` chỉ còn 2 chỗ nêu trên. **Chưa chạy trong Chrome** (tunnel đã đóng).

**2026-11-18 | v3.5.490 | Arena.ai Agent sửa:**

- Người dùng: "vẫn vậy" — lỗi ở lần mở tệp đầu tiên sau khi cài lại extension.
- Đổi chính sách khoá chọn chữ: trước đây mở khoá theo `data-native-ready` hoặc hết 2,5 giây, nhưng lần mở đầu (máy nguội) trang còn dựng lại **lâu hơn** thế nên người dùng vẫn bôi đen trúng lúc DOM đang đổi → vùng chọn bị xoá ngay (`mouseup.noTextOrEditable {text:false}`).
- Nay: `watchStageIdle(cycle)` theo dõi `#stage` bằng MutationObserver, **chỉ mở khoá khi không còn thay đổi DOM trong 500 ms** (tối đa 10 giây, đổi con trỏ thành `progress` trong lúc chờ). Mở khoá ngay khi `openViewer` xong vẫn giữ.
- File: `js/dashboard/documents.js`, `css/dashboard/documents.css`, `manifest.json`. Kiểm tra: `node --check` hợp lệ. **Chưa xác nhận trong Chrome.**

**2026-11-18 | v3.5.489 | Arena.ai Agent sửa (theo dấu hiệu của người dùng: chỉ lỗi ở lần mở ĐẦU TIÊN sau khi cài lại extension):**

- Người dùng: "relic 1 lần là mở tệp mới vẫn bôi đen đúng, còn remove app cũ cài app mới thì mở file pdf đầu tiên vẫn lỗi, reload lại và mở tệp khác mới hết" → lỗi thuộc **lần chạy đầu** (máy nguội), không phải lần mở đầu trong một phiên.
- Nguyên nhân do chính bản 3.5.486 gây ra: `openViewer` gọi `refreshNativeSource()` **ngay khi engine sẵn sàng**, mà hàm này chạy `restoreAnnotations()` → **vẽ lại ghi chú/tô sáng lên trang trong lúc trang còn đang dựng**. Lần đầu tiên việc này lâu nhất (chưa cache) nên xoá sạch vùng chọn vừa bôi (đã đo trước đó: `mouseup.noTextOrEditable {text:false}` sau 20 ms, `#pageStack` bị gỡ rồi dựng lại). 3.5.430 chỉ vẽ ở **cuối**.
- Sửa: `documents-context.js` `refresh({tools})` — gọi sớm chỉ gỡ `documents-native-inactive`, **không** vẽ lại ghi chú; `documents.js` gọi `refreshNativeSource(false)` sớm và bản đầy đủ ở cuối, **hoãn nếu người dùng đang bôi đen** (thử lại tối đa 5 lần, 1,2 giây/lần).
- File: `js/dashboard/documents-context.js`, `js/dashboard/documents.js`, `manifest.json`. Kiểm tra: `node --check` hợp lệ. **Chưa xác nhận trong Chrome** (tunnel rớt kết nối khi khung tự nạp lại).

**2026-11-18 | v3.5.488 | Arena.ai Agent sửa (so mã 3.5.430 thay vì đoán):**

- Người dùng: "chỉ cần so sánh trước lúc reload và sau khi reload là biết khác chỗ nào… tại sao bản 3.5.430 không lỗi?"
- So mã `3e29d46` (3.5.430) với hiện tại: `openViewer`, `containsRange`, `isWebsiteDisabledIn`, `handleSelectionMouseUp` **giống hệt**. Khác biệt duy nhất: 3.5.430 **không có** `js/dashboard/documents-library.js` và khung **không nhận** `KEEPIT_DOCUMENTS_OPEN` — mọi lần mở đều đi qua URL `?document=…` rồi `boot()` tự mở (đúng đường "sau khi reload" mà người dùng thấy chạy tốt). Từ 3.5.431 Dashboard ra lệnh bằng `postMessage` vào khung có thể còn đang khởi tạo → tranh chấp thời điểm.
- Sửa: `documents-library.js` mở tệp **bằng URL của khung** (`documents.html?document=<id>[&mode=read]`, xoá tham số cũ trước khi đặt), chỉ dùng `postMessage` khi tệp đó **đang mở sẵn**; giữ thẻ "Đang mở tệp" (ẩn khi khung báo `KEEPIT_DOCUMENTS_VIEWER_READY`, chống kẹt 8 giây). `documents.js` `boot()` nhận thêm `mode=read`.
- File: `js/dashboard/documents-library.js`, `js/dashboard/documents.js`, `manifest.json`.
- Kiểm tra: `node --check` cả 2 hợp lệ. **Chưa chạy bản 3.5.488** — thử bằng tunnel bị rớt kết nối giữa lúc khung tự nạp lại.

**2026-11-18 | v3.5.487 | Arena.ai Agent sửa:**

- Người dùng: "ảnh là trạng thái lỗi khi mở tệp mới, reload thì lỗi đâu nữa" — ảnh cho thấy thanh nằm **tận mép trái** thay vì dưới vùng chọn.
- Đo trong Chrome người dùng: khi mở tệp, khung **gỡ `#pageStack`** (8 ms) rồi **dựng lại** (~216 ms) và tạo lại toàn bộ `span` chữ (~223 ms) → vùng chọn tạo trong khoảng đó bị xoá ngay (`mouseup.noTextOrEditable {text:false}` ngay sau 20 ms). Thanh đặt vị trí theo `range.getClientRects()` đo đúng lúc trang còn co giãn nên rơi về mép trái (`position()` kẹp ở 10 px).
- Sửa: (1) `documents.css` + `documents.js` — khoá chọn chữ trong lúc dựng trang (`#viewer[data-select-locked="true"] #stage{user-select:none}`), mở khoá khi trang dựng xong **hoặc tối đa 2,5 giây** (đo được có ca `data-native-ready` kẹt `false` 14 giây nên không khoá vô hạn); (2) `content.js` — đo lại vị trí thanh ở 80/250/600/1200 ms sau khi tạo để bám đúng vùng chọn khi trang đổi kích thước.
- File: `css/dashboard/documents.css`, `js/dashboard/documents.js`, `js/content/content.js`, `manifest.json`.
- File: `css/dashboard/documents.css`, `js/content/content.js`, `manifest.json`. Kiểm tra: `node --check` hợp lệ. **Chưa xác nhận trong Chrome** ở bản này.

**2026-11-18 | v3.5.486 | Arena.ai Agent sửa (đo trực tiếp trong Chrome của người dùng qua DevTools):**

- Đo được: lần mở đầu `KeepitDocuments.open()` mất **~7,9 giây** mới xong; `documents-native-inactive` chỉ được gỡ ở bước cuối của `openViewer`. Trong khoảng đó `content.js` vẫn có `websiteDisabled = true` → chọn chữ đúng lúc tệp vừa hiện bị chặn (`mouseup.websiteDisabled`), chờ đủ lâu mới có thanh. Người dùng thấy: "mở lần đầu không bôi đen được, reload thì được".
- Sửa 3 chỗ: (1) `documents-context.js` **không chờ** `refreshSource()` (nó chờ `loadSettings` + `restoreAnnotations`) — chờ làm `openViewer` treo thêm; (2) `documents.js` gọi `refreshNativeSource()` **ngay khi engine sẵn sàng** để gỡ class ức chế sớm; (3) `content.js` tính `pageToolsDisabled()` **tại thời điểm chọn chữ** thay vì dùng cờ `websiteDisabled` cũ (3 cổng: mouseup, loadSettings, showTranslateIcon).
- File: `js/dashboard/documents-context.js`, `js/dashboard/documents.js`, `js/content/content.js`, `manifest.json`.
- Kiểm tra: `node --check` cả 3 hợp lệ; trong Chrome thật (3.5.485) đã chứng minh: khi class còn + cờ cũ → không có thanh; gọi `refresh()` xong → bôi đen có thanh (`reachedShowIcon`, `#lhn-translate-icon` 28×28).
- **Xác nhận trên Chrome của người dùng với bản 3.5.486**: bộ ghi trong khung cho thấy thao tác kéo chọn thật → `mouseups 1` → `reachedShowIcon` → `#lhn-translate-icon` hiện; người dùng xác nhận "bôi đen được bình thường". Kéo chọn bằng DevTools thì không dùng để kết luận được (mỗi lệnh chuột qua tunnel mất vài giây nên cú kéo bị trải dài ~30 giây).

**2026-11-18 | v3.5.485 | Arena.ai Agent sửa:**

- Dữ liệu từ Chrome (`LHN_SELECTION_DEBUG`): `stage:"mouseup.outsideContext"`, `inStage:true`, **`inPara:false`**, `blockClass:"textLayer pdfTextLayer"`, `ctx.contains:"false"` → chọn chữ trong **PDF** bị loại vì `containsRange` đòi điểm chọn nằm trong `.en`.
- PDF render những đoạn chưa gom thành khối: `span` nằm thẳng dưới `.pdfTextLayer`, không có `.para`/`.en`. Vì vậy thanh Tô sáng/Dịch/AI không bao giờ hiện với loại trang này — không liên quan cài đặt.
- Nay: `containsRange` nhận vùng chọn trong `#stage` khi điểm chọn nằm trong `.en` **hoặc** trong một khối `[data-page]` (mọi loại trang của bộ xem).
- Hệ quả đã biết: ghi chú trên đoạn PDF chưa gom khối được neo ở mức **trang** (`fileLevel`, `page`) chứ chưa tô tại chỗ từng chữ như đoạn `.para`.
- File: `js/dashboard/documents.js`, `manifest.json`. Kiểm tra: `node --check` hợp lệ. **Chưa xác nhận trong Chrome.**

**2026-11-18 | v3.5.484 | Arena.ai Agent sửa:**

- Người dùng báo bản 3.5.483 **vẫn lỗi** lần mở đầu (`hasContentTools:true`, `iconExists:false`, `nativeInactive:false`): vậy không phải thời điểm mở tệp, mà là một cổng khác trong `content.js` chặn `showTranslateIcon()`.
- Bản này **ghi lại lý do** (chỉ đọc, không đổi hành vi): `globalThis.LHN_SELECTION_DEBUG.last` = `{stage, at, detail}` với các mốc `mouseup.*`, `loadSettings.*`, `reachedShowIcon`, `showTranslateIconBlocked` (kèm lý do + cờ cài đặt đang dùng). Đọc trong Console của Dashboard qua `frame.contentWindow.LHN_SELECTION_DEBUG`.
- Sửa kèm 1 chỗ: `pageContext.containsRange(range)` → chỉ chặn khi trả về **đúng `false`** (trước đây `undefined` — khi chưa gắn nguồn tài liệu — cũng bị coi là ngoài ngữ cảnh).
- File: `js/content/content.js`, `manifest.json`.
- Kiểm tra: `node --check js/content/content.js` hợp lệ. **Chưa xác nhận được trong Chrome** — cần dữ liệu `LHN_SELECTION_DEBUG` khi thanh không hiện.

**2026-11-18 | v3.5.483 | Arena.ai Agent sửa:**

- Người dùng: bôi đen văn bản ở **lần mở tệp đầu tiên** không hiện thanh Tô sáng / Dịch / AI, reload khung thì lại được (như bản 3.5.430).
- Nguyên nhân (đo trong Chrome của người dùng): lần mở đầu `iconExists:false` trong khi `nativeInactive:false` và mọi cờ cài đặt đều bật → **không phải CSS, không phải cài đặt**; khung mở tệp **khi `boot()` còn đang chạy** nên bộ công cụ chọn chữ chưa kịp gắn. Đường "reload" lại mở tệp **sau khi** boot xong (URL có `?document=` mở ở cuối `boot()`) nên có thanh.
- Nay: `openViewer()` **chờ khung khởi tạo xong** (`await bootReady`) và chờ thêm 2 khung hình sau khi `LHN_CONTENT_TOOLS` có mặt (tối đa 1,5 giây), rồi mới dựng bộ xem. Cờ được mở ngay trước khi `boot()` tự mở tệp theo `?document=` để không tự khoá nhau.
- File: `js/dashboard/documents.js`, `manifest.json`.
- Kiểm tra: `node --check js/dashboard/documents.js` hợp lệ; diff chỉ 3 chỗ. **Chưa chạy thật trong Chrome** — cần người dùng mở tệp lần đầu để xác nhận.

**2026-11-18 | v3.5.482 | Arena.ai Agent sửa:**

- Người dùng: "load xong mới vào layout tài liệu mới hợp lý" — trước đó nhập xong là popup ẩn ngay trong khi khung còn đang dựng trang đầu, nên màn hình nhảy vào layout tài liệu giữa chừng.
- Nay: nhập xong (`KEEPIT_DOCUMENTS_IMPORTED`, có tài liệu mới) → popup **giữ nguyên**, bước 2 chuyển ✓; khung chỉ báo `KEEPIT_DOCUMENTS_VIEWER_READY` **sau khi** `renderViewer()` + `ensurePage()` xong (`nativeReady=true`) → Dashboard mới ẩn popup (200ms). Tức là: popup che lúc tệp đang dựng, dọn xong mới lộ layout tài liệu.
- Chống kẹt: quá **5 giây** không thấy tín hiệu thì tự ẩn; khung mở tệp thất bại (`KEEPIT_DOCUMENTS_VIEWER {open:false}`) → ẩn ngay; nhập lỗi/trùng (count 0) → ẩn sau 320ms như cũ.
- File: `js/dashboard/documents.js`, `js/dashboard/documents-library.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; **jsdom**: (1) nhập xong, chưa vẽ xong → popup còn `true`; (2) nhận READY → ẩn `false`, thanh 100%; (3) lỗi `fileLimit` 200ms → còn; (4) 500ms → ẩn; (5) `open:false` → ẩn ngay. Đúng cả 5. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.481 | Arena.ai Agent sửa:**

- Người dùng: nhập tệp được rồi nhưng **mất popup hiệu ứng "Đang mở tệp"** như bản 3.5.430.
- Nguyên nhân: popup đó nằm trong `pages/documents.html` (`#openWrap`), mà từ 3.5.431 khung này là **iframe ẩn** khi Dashboard tự vẽ thư viện (`html.dash-embedded-library .app{display:none}` + `#dashboardDocumentsFrame{display:none;height:0}`) → modal không bao giờ hiện.
- Nay popup do **Dashboard** vẽ (`.dlib-open`), khung chỉ báo tiến trình:
  - Khung: `importNote()` gửi `KEEPIT_DOCUMENTS_IMPORT_STEP` với `phase: start|progress|save|password` (tên, dung lượng, loại tệp, %); nghe `KEEPIT_DOCUMENTS_IMPORT_CANCEL` → `++importCycle` dừng nhập.
  - Dashboard: thẻ 400px giống hệt bản cũ — icon tệp (PDF đỏ / Word xanh / PowerPoint cam / ảnh xanh lá), tên, dung lượng, 2 bước có vòng xoay → dấu ✓, thanh tiến trình gradient, chân "Đọc trên máy, không tải lên" + nút **Hủy**. Hiện ngay khi chọn/kéo tệp (thay toast "đang mở"), hiệu ứng: nền mờ .18s + thẻ phóng .96→1 .22s; xong thì giữ 320ms rồi ẩn.
  - Hủy: cờ `importCancelled` → không hiện toast lỗi khi khung trả lời.
- CSS mới trong `css/dashboard/documents-library.css` (biến `--dl-*` sáng/tối riêng vì popup gắn vào `body`, ngoài `#dashboardDocumentsView`).
- File: `js/dashboard/documents.js`, `js/dashboard/documents-library.js`, `css/dashboard/documents-library.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 181/181 ngoặc; **jsdom chạy thật `documents-library.js`**: mount thư viện → gửi `start` (pptx 17.091.788 B) → thẻ hiện đúng tên "English Vocabulary Workshop XL by Slidesgo.pptx", "16.3 MB", nhãn `PowerPoint` màu `rgb(226,112,43)`, bước `run` → gửi `progress 42` → fill 42% → `save` → `done,run` + 95% → `IMPORTED` → `done,done` + 100% → sau 380ms thẻ ẩn. **Chưa chạy UI thật.**

**2026-11-18 | v3.5.480 | Arena.ai Agent sửa — NGUYÊN NHÂN GỐC lỗi "0 tài liệu" / không nhập được tệp:**

- Toast thật: `Failed to execute 'transaction' on 'IDBDatabase': One of the specified object stores was not found` → kho IndexedDB `keepit-documents` **tồn tại nhưng không có store nào**.
- Vì sao: `js/dashboard/documents-library.js` mở kho bằng **version cứng 1** với `onupgradeneeded` **rỗng** ("kho do trang Tài liệu khởi tạo"). Nếu Dashboard mở trước (tab Tài liệu vẽ thư viện trước khi khung `documents.html` kịp chạy), kho được tạo với **0 store**; trang Tài liệu cũng mở version 1 nên **không bao giờ nâng cấp** → mọi `transaction(['meta','files'])` đều báo thiếu store. Hỏng vĩnh viễn cho tới khi sửa.
- Sửa:
  1. `documents-store.js`: `VERSION 1 → 2`, và trong `onupgradeneeded` chỉ tạo store **còn thiếu** (`objectStoreNames.contains`) → **kho rỗng v1 tự chữa lành** lần mở kế tiếp, kho lành (có tài liệu) lên v2 không mất gì.
  2. `documents-library.js`: mở **không kèm version** (không tự nâng cấp), và nếu buộc phải tạo thì tạo đủ 4 store + index — không bao giờ để lại kho rỗng.
  3. `dashboard-trash.js`: bỏ `DB_VERSION = 1` cứng, mở không version (chỉ đọc/ghi, không nâng cấp) — nếu giữ version 1 thì sau khi kho lên 2 sẽ `VersionError`.
- Kiểm tra: `node --check` 3 file hợp lệ; **test thật bằng fake-indexeddb + vm chạy chính file `documents-store.js`**: tái hiện kho v1 rỗng → module mở → `files, meta, notes, translations`, version 2, `importFile` + `all('meta')` + `get('files')` + `patch` đều chạy; và test khối `onupgradeneeded` thật của thư viện trên kho mới → tạo đủ 4 store. **Chưa chạy UI thật.**
- File: `js/dashboard/documents-store.js`, `js/dashboard/documents-library.js`, `js/dashboard/dashboard-trash.js`, `manifest.json`.

**2026-11-18 | v3.5.479 | Arena.ai Agent sửa:**

- Sau 3.5.478 người dùng thấy đúng câu "Không thêm được tệp vào thư viện." → tức là `count=0, skipped=0, error` **rỗng hoặc lạ**.
- Tìm ra lỗ hổng trong chính bản 3.5.478: hai nhánh từ chối (`!type`, quá dung lượng) **quên ghi `outcome.error`** → vẫn rơi vào câu chung. Nay ghi rõ `unsupported` / `fileLimit`.
- Thêm `kindByMime()`: có tệp sang tay khung mà **mất đuôi tên**, chỉ còn MIME → vẫn nhận đúng PDF/DOCX/PPTX/ảnh thay vì báo sai định dạng.
- Dashboard: lý do **không nằm trong danh sách quen** thì in luôn phần kỹ thuật sau dấu "·" (cắt 90 ký tự) để chốt nguyên nhân, không đoán.
- File: `js/dashboard/documents.js`, `js/dashboard/documents-library.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ. **Chưa chạy UI thật** — chờ câu toast mới để biết nguyên nhân gốc.

**2026-11-18 | v3.5.478 | Arena.ai Agent sửa:**

- Lỗi người dùng: chọn tệp ở tab Tài liệu → báo **"0 tài liệu"**, tệp **không vào** thư viện.
- Nguyên nhân hiển thị sai: khung `documents.html` đếm lại số bản ghi trước/sau và **nuốt mọi lỗi** (`try{await importFiles(...)}catch{ }`), nên mọi kiểu thất bại đều thành con số 0, không nói vì sao.
- Nay: `importFiles()` trả `{added, skipped, error}` (đếm ngay lúc nhập; lỗi đầu tiên được giữ lại, lỗi "cancel" vẫn im lặng); khung gửi `KEEPIT_DOCUMENTS_IMPORTED {count, skipped, error}`; Dashboard đổi câu báo: có lỗi → đúng lý do (`unsupported` / `fileLimit` / `documentsBusy` / `badFile` / `dbBlocked` / `storageFailed`), 0 mà trùng → "Tệp này đã có trong thư viện.", 0 mà không rõ → "Không thêm được tệp vào thư viện.". Thêm chặn "đang nhập tệp khác" thay vì `return` im lặng.
- i18n mới: `docs_importFailed`, `docs_importDuplicate`, `docs_documentsBusy` (en/vi/ko).
- File: `js/dashboard/documents.js`, `js/dashboard/documents-library.js`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ. **Chưa chạy UI thật** — bản này **chưa sửa nguyên nhân gốc**, nó làm lỗi hiện ra thành câu rõ ràng để chốt nguyên nhân.

**2026-11-18 | v3.5.477 | Arena.ai Agent sửa:**

- Nút cập nhật đổi nhãn cho gọn: `settingsCheckUpdate` = **"Cập nhật"** / `Update` / `업데이트` (trước là "Kiểm tra cập nhật"). Chỉ đổi chữ, hành vi và kích thước nút giữ nguyên.
- File: `js/core/languages.js`, `pages/dashboard.html`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; `grep` xác nhận 3 nhãn mới. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.476 | Arena.ai Agent sửa:**

- Giới thiệu → dòng **Version**:
  1. **Bỏ** câu phụ "Tô sáng và ghi chú được lưu cục bộ trong hồ sơ Firefox này." (không dùng `settingsLocalOnly` ở đây nữa).
  2. **Số phiên bản xuống dòng dưới** "Version": `#settingsVersion` đổi từ `<strong>` bên phải sang `<small>` nằm trong `<span>` (span là `display:grid; gap:4px` nên tự xuống dòng, dùng đúng kiểu chữ phụ 11px mờ sẵn có) — JS gán `v…` giữ nguyên.
  3. **Thêm nút "Kiểm tra cập nhật"** bên phải (`settings-action-button`, rộng 120px theo quy định sẵn có của `settings-backup-row`), bấm → toast chung của dashboard: "Bạn đang dùng bản mới nhất · v3.5.476". **Bản demo không có máy chủ cập nhật** nên nút chỉ xác nhận phiên bản hiện tại.
- Listener gắn **một lần** ở cấp cao nhất, không đặt trong `refreshDashboardSettings()` (hàm này chạy lại nhiều lần → chồng listener, toast hiện lặp).
- i18n: `settingsCheckUpdate` (en `Check for updates` / vi `Kiểm tra cập nhật` / ko `업데이트 확인`), `settingsUpToDate` (en `You are on the latest version` / vi `Bạn đang dùng bản mới nhất` / ko `최신 버전을 사용 중입니다`).
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; jsdom: dòng Version còn đúng 3 thành phần, `#settingsVersion` là `SMALL` trong `span`, câu "stored locally in this Firefox profile" đã mất khỏi trang, thứ tự Version → Terms & privacy → Error log. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.475 | Arena.ai Agent sửa:**

- Người dùng hỏi "muốn coi lại legal thì ở đâu?" → trước chỉ vào được từ popup đăng ký. Nay thêm đường **thường trực**: **Cài đặt → Giới thiệu** có dòng **"Điều khoản & Bảo mật"** + nút **"Xem"**.
- Dùng lại đúng khối `settings-backup-row` + `settings-action-button` sẵn có (không tạo kiểu mới), nằm giữa "Version" và "Error log".
- JS: tách `openLegalPage(doc)` dùng chung cho nút trong popup và nút ở Cài đặt → `window.open(chrome.runtime.getURL("pages/legal.html") + "#terms|#privacy", "_blank", "noopener")`, tab mới.
- i18n: `legalDocsTitle` / `legalDocsHelp` / `legalDocsOpen` (en `Terms & privacy` · vi `Điều khoản & Bảo mật` · ko `약관 및 개인정보`). Nội dung trang vẫn **chỉ tiếng Anh**.
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ (đã sửa 1 dấu phẩy thừa khi chèn i18n); jsdom: nút `#openLegalDocs` class `settings-action-button`, nằm trong panel `about`, thứ tự Version → Terms & privacy → Error log. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.474 | Arena.ai Agent sửa:**

- **(1) `pages/legal.html` theo sáng/tối của app** (trước chỉ theo hệ điều hành): thêm `js/pages/legal.js` — đọc `LHN_SETTINGS.get()` → `settings.sidebarTheme` (`light` / `dark` / `system`), gắn `data-theme` lên `<html>`, đặt luôn `color-scheme` cho thanh cuộn. "system" thì theo máy; **đổi giao diện trong app lúc tab đang mở thì trang đổi theo** qua `LHN_SETTINGS.subscribe()`. Vẽ ngay lần đầu theo hệ điều hành để không chớp trắng.
- CSS `legal.css`: `:root` = sáng, `html[data-theme="dark"]` = tối (đen `#000` / thẻ `#0d0d0f` / chữ `#eaeaea` / brand `#a5a9ff`), còn `@media (prefers-color-scheme: dark) html:not([data-theme])` làm dự phòng khi không chạy được script.
- `pages/legal.html` nạp thêm `browser-polyfill.js`, `defaults.js`, `config.js`, `settings.js`, `pages/legal.js` (đủ chuỗi để `LHN_SETTINGS` có `STORAGE_KEYS` + `DEFAULT_SETTINGS`).
- **(2) Hộp điều khoản mở/thu mượt**: bỏ `hidden` (display:none thì không chuyển động được) → `grid-template-rows: 0fr → 1fr` + `padding`/`border-width`/`opacity` .28s `cubic-bezier(.32,.72,0,1)`; `.is-open` mở, `visibility` + `aria-hidden` chặn tab/đọc màn hình khi đang đóng; nội dung bọc trong `.profile-auth-legal-inner` (`overflow:hidden`, `min-height:0`) để cắt đúng. JS: `setProfileLegalPanel(true|false)` thay 3 chỗ `hidden =`.
- File: `js/pages/legal.js` (mới), `css/pages/legal.css`, `pages/legal.html`, `css/dashboard/settings.css`, `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 926/926 và 48/48 ngoặc; jsdom chạy thật `legal.js` với 4 tổ hợp (app dark/máy sáng → `dark`; app light/máy tối → `light`; system → theo máy) ra đúng; jsdom xác nhận panel không còn `hidden`, có `.is-open`/`.profile-auth-legal-inner`, 2 nút. **Chưa chạy UI thật** → độ mượt phải xem bằng mắt.

**2026-11-18 | v3.5.473 | Arena.ai Agent sửa:**

- Yêu cầu: điều khoản dài → popup chỉ giữ 2 câu tóm tắt, **bản đầy đủ ở trang riêng**, nội dung **chỉ tiếng Anh** cho mọi ngôn ngữ.
- Thêm `pages/legal.html` + `css/pages/legal.css`: một trang gồm **2 tài liệu** (Terms of Use 9 mục / Privacy Policy 9 mục), có mục lục, neo `#terms` `#privacy`, tô nhẹ mục đang xem bằng `:target`, header dính (frosted), tự tối theo `prefers-color-scheme`, có kiểu in (`@media print`). **Không dùng JS** → đúng CSP của MV3 (`script-src 'self'`), mở bằng `pages/legal.html#terms` là nhảy đúng chỗ.
- Popup: bảng điều khoản thêm hàng 2 nút **"Đọc bản đầy đủ"** (`profileLegalFull`) + **"Đóng"**, căn giữa (`.profile-auth-legal-actions`). Bấm "Đọc bản đầy đủ" → `window.open(chrome.runtime.getURL("pages/legal.html") + "#" + tài liệu đang xem, "_blank", "noopener")` → **tab mới**, nên form đăng ký không mất chữ đã gõ.
- i18n: thêm `profileLegalFull` (en "Read the full version" / vi "Đọc bản đầy đủ" / ko "전문 보기"). Nội dung trang legal **cố ý chỉ tiếng Anh**, không đi qua `languages.js`.
- Không cần khai báo `web_accessible_resources` (trang mở bằng `window.open` từ chính tiện ích).
- File: `pages/legal.html` (mới), `css/pages/legal.css` (mới), `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: `node --check` 3 file JS hợp lệ; CSS settings 925/925, legal 47/47 ngoặc; jsdom: panel có 2 nút + đúng key i18n, trang legal có `#terms`/`#privacy`, 18 mục, `lang="en"`. **Chưa chạy UI thật**; chỗ `[contact email]` đang để trống chờ điền.

**2026-11-18 | v3.5.472 | Arena.ai Agent sửa:**

- Lỗi thứ tự: bấm tạo tài khoản khi chưa tích điều khoản thì hiện ngay "Bạn cần đồng ý Điều khoản sử dụng…" — **che mất lỗi ô nhập** (mật khẩu ngắn, nhập lại không khớp). Lỗi nhập phải hiện trước.
- Nay: chuyển khối kiểm tra điều khoản xuống **sau** `LHN_AUTH_POPUP.check()` và **trước** `finishProfileAuth()`. Thứ tự đầy đủ: Email trống → Email sai định dạng → Mật khẩu trống → (đăng nhập: email chưa có tài khoản → tự mở nhánh tạo) → mật khẩu < 8 ký tự / nhập lại không khớp / sai thông tin → **rồi mới** nhắc tích điều khoản.
- File: `js/dashboard/dashboard.js`, `manifest.json`.
- Ghi chú: 3.5.471 (căn giữa nhãn ô nhập) đã bị **revert** theo yêu cầu, nội dung = 3.5.470; số 3.5.471 không dùng lại.
- Kiểm tra: `node --check` hợp lệ; in lại toàn bộ handler xác nhận đúng thứ tự. **Chưa chạy UI thật**.

**2026-11-18 | v3.5.470 | Arena.ai Agent sửa:**

- Người dùng: câu lỗi và dòng đồng ý điều khoản phải **căn giữa** (đang bám lề trái).
- `.profile-auth-error { text-align: center }`.
- Bỏ flex ở `.profile-auth-terms` → `display: block; text-align: center`; checkbox thành `inline-block` (giữ `appearance:auto`, `vertical-align:-2px`, `margin-right:7px`) và `.profile-auth-terms-text { display:inline }` → cả cụm chữ + 2 link chảy như **một đoạn văn căn giữa**, xuống dòng vẫn căn giữa; viền đỏ `.is-invalid` của checkbox không đổi.
- File: `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: CSS 924/924 ngoặc. **Chưa chạy UI thật** — cần người dùng xem lại điểm xuống dòng của dòng điều khoản.

**2026-11-18 | v3.5.469 | Arena.ai Agent sửa:**

- Người dùng: tiêu đề popup đăng nhập làm "cho có" — phải **căn giữa**, **cùng màu/nền với popup**, và **có gạch phân cách**.
- Tìm ra nguyên nhân dải trắng ở đầu thẻ: `css/dashboard/dashboard.css` dòng 5 có rule toàn cục `header { min-height:56px; background:#fff; ... }` — thẻ tiêu đề của mình là `<header>` nên bị **tô nền trắng 56px**, tách hẳn khỏi nền kính của popup. Đổi sang `<div class="profile-auth-head">` (cả `pages/dashboard.html` và `markup()`), nên không còn dính rule chung nào.
- CSS mới: `.profile-auth-head { padding:15px 20px 13px; border-bottom:1px solid var(--au-line); background:transparent; text-align:center; }` và `.profile-auth-title { font-size:15.5px; font-weight:650; line-height:21px; color:var(--au-tx); text-align:center; letter-spacing:-.01em; }` → chữ **căn giữa**, cùng nền kính với thẻ, có **gạch phân cách** màu viền chuẩn (`.12` sáng / `.12` trắng tối). `.profile-auth-body` thêm `background:transparent`, padding `16px 20px 20px` để sát gạch.
- Sheet điện thoại: `.profile-auth-head { padding-top:10px; padding-bottom:11px }` (sát tay nắm), body `14px`.
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 924/924 ngoặc; `grep` xác nhận cả 2 markup đã dùng `div.profile-auth-head` (không còn `<header>` trong popup đăng nhập). **Chưa chạy UI thật** — vị trí/căn giữa cần người dùng xem.

**2026-11-18 | v3.5.468 | Arena.ai Agent sửa:**

- Lỗi: bỏ 2 tab thì popup **mất luôn tiêu đề**, phía trên chỉ còn nút Google.
- Nay: thêm tiêu đề trên cùng (`<header class="profile-auth-head"><h2 id="profileAuthTitle">`) và **đổi theo chế độ**: chế độ đăng nhập → **"Đăng nhập"** (`profileLogin`), chế độ tạo tài khoản → **"Đăng ký"** (`profileRegister`); đổi ngay trong `setProfileAuthMode()`.
- Kỹ thuật: header đặt **ngoài** `.profile-auth-body` (body là grid 2 cột ở màn ngang, nhét vào sẽ phải sửa `grid-template-areas`); CSS `.profile-auth-head { padding:18px 20px 0 }`, `.profile-auth-title { font-size:16px; font-weight:650; color: var(--au-tx) }`; body bớt lề trên còn `14px` (sheet điện thoại: header `12px`, body `10px`). Khi đổi ngôn ngữ, `applyTranslations()` gán lại tiêu đề đúng chế độ (không để `data-i18n` kéo về "Đăng nhập").
- Markup đồng bộ ở `pages/dashboard.html` và `markup()` của `auth-popup.js`.
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 924/924 ngoặc; jsdom: `#profileAuthTitle` là `H2` trong `.profile-auth-head`, thứ tự form = grip → header → body. **Chưa chạy UI thật** (khoảng cách, cỡ chữ).

**2026-11-18 | v3.5.467 | Arena.ai Agent sửa:**

- Thêm **dòng đồng ý điều khoản** cho đúng UX app hiện đại — chỉ hiện ở nhánh **tạo tài khoản**, **không tích sẵn** (GDPR: không được tích trước).
- Nội dung: checkbox + "Tôi đồng ý với **Điều khoản sử dụng** và **Chính sách bảo mật**". Hai chữ in đậm là **nút mở nội dung ngay trong popup** (bản demo chưa có trang web điều khoản nên không trỏ link giả ra ngoài): panel hiện tiêu đề + đoạn ngắn (điều khoản: tài khoản chỉ tạo trong tiện ích, không máy chủ nào lưu hồ sơ, xoá được trong Cài đặt → Tài khoản; bảo mật: hồ sơ/email/mật khẩu chỉ nằm trong bộ nhớ cục bộ, gỡ tiện ích là mất) + nút Đóng.
- Bắt buộc: bấm **Tạo tài khoản** mà chưa tích → `profileTermsRequired` ("Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật để tạo tài khoản."), hàng điều khoản đỏ (chữ + viền ô tích), `aria-invalid` + `aria-describedby`, focus vào ô tích. Tích xong là lỗi tự mất.
- Chi tiết kỹ thuật: link là `<button type="button">` **đặt ngoài** `<label>` để bấm link không vô tình tích ô; `setProfileAuthMode()` ẩn hàng + panel và bỏ tích khi về chế độ đăng nhập; markup đồng bộ ở `pages/dashboard.html` và `markup()` của `auth-popup.js`.
- i18n mới (en/vi/ko): `profileTermsAgree`, `profileTermsLink`, `profileTermsAnd`, `profilePrivacyLink`, `profileTermsRequired`, `profileTermsBody`, `profilePrivacyBody`, `profileLegalClose`.
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `css/dashboard/settings.css`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ (2 file JS); CSS 921/921 ngoặc; jsdom trên markup thật: đủ `#profileTermsRow` (mặc định ẩn), `#profileTerms` (không tích sẵn), `#profileLegalPanel`, 2 nút `data-legal`, thứ tự `.profile-auth-fields` = Mật khẩu → Nhập lại → lỗi → điều khoản → panel → nút gửi. **Chưa chạy UI thật.**

**2026-11-18 | v3.5.466 | Arena.ai Agent sửa:**

- Đổi nhãn thông báo khi email chưa có tài khoản:
  - vi: "Email này chưa có tài khoản trên máy này. Nhập lại mật khẩu để tạo tài khoản." → **"Email này chưa có tài khoản. Hãy tạo tài khoản."**
  - en: "This email has no account on this device yet. Retype the password to create the account." → **"This email has no account yet. Create one."**
  - ko: "이 이메일에는 아직 계정이 없습니다. 비밀번호를 다시 입력해 계정을 만드세요." → **"이 이메일에는 계정이 없습니다. 계정을 만드세요."**
- Chỉ đổi chữ, không đổi hành vi (vẫn báo rồi mở ô Nhập lại mật khẩu + nút Tạo tài khoản).
- File: `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; `grep` xác nhận đúng 3 chuỗi mới trong 3 ngôn ngữ. Chưa chạy UI thật.

**2026-11-18 | v3.5.465 | Arena.ai Agent sửa:**

- Câu hỏi: nhập sai email/mật khẩu, bấm Đăng nhập, rồi **sửa lại cho đúng** thì sao? Kiểm lại thì thấy 2 lỗ hổng.
- Lỗ hổng 1: khi email đúng định dạng nhưng **chưa có tài khoản**, máy tự chuyển sang nhánh "Tạo tài khoản"; người dùng sửa lại email cho đúng tài khoản thì popup **vẫn nằm ở nhánh tạo tài khoản** (ô Nhập lại vẫn hiện, nút vẫn "Tạo tài khoản", câu "email này chưa có tài khoản" vẫn treo).
- Lỗ hổng 2: lỗi thuộc ô Mật khẩu / Nhập lại thì sửa **ô Email** không dọn lỗi cũ.
- Nay: thêm cờ `profileAuthAutoRegister` (chỉ bật khi **máy** tự chuyển chế độ). Sửa nội dung ô Email:
  - Nếu đang bị tự chuyển → quay về chế độ **đăng nhập** (ẩn Nhập lại, nút về "Đăng nhập ngay", xoá câu thông báo) rồi để người dùng bấm lại.
  - Nếu lỗi đang nằm ở ô Email → chỉ xoá khi email đã hợp lệ (giữ kiểu "sửa sớm").
  - Nếu lỗi nằm ở ô khác → đổi email là **xoá lỗi cũ** (đổi danh tính thì lỗi cũ hết nghĩa).
- Bấm dòng chân "Chưa có tài khoản? Đăng ký" là **người dùng tự chọn** → tắt cờ, sửa email không tự quay lại; mở lại popup cũng reset cờ.
- Lỗi mật khẩu: gõ lại vào ô Mật khẩu / Nhập lại là lỗi + viền đỏ tự mất (đã có từ 3.5.463), sửa xong chỉ cần bấm lại nút.
- File: `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; đọc lại 3 nhánh mới (mở popup reset cờ, submit đặt cờ, input xử lý 3 trường hợp). **Chưa chạy UI thật.**

**2026-11-18 | v3.5.464 | Arena.ai Agent sửa:**

- Lỗi: gõ email sai rồi **Enter** vẫn nhảy xuống ô Mật khẩu.
- Nguyên nhân: `<form>` chưa có `novalidate`, các ô lại có `required` → khi Enter, trình duyệt chạy kiểm tra mặc định, thấy ô Mật khẩu trống nên **tự chuyển focus + bong bóng lỗi của Chrome**, chặn luôn sự kiện `submit` nên phần kiểm email của mình không chạy.
- Nay: thêm `novalidate` cho `#profileAuthForm` (cả `pages/dashboard.html` và `markup()` của `auth-popup.js`) và tự kiểm theo thứ tự trong submit: **email trống → báo "Nhập email của bạn."**; **email sai định dạng → báo "Email không đúng định dạng."**; **mật khẩu trống → báo "Nhập mật khẩu."** Mỗi bước đều `focus()` về đúng ô và `return`, **không** đi tiếp. Enter giờ chỉ đi tiếp khi dữ liệu thật sự hợp lệ.
- i18n mới: `profileEmailRequired`, `profilePasswordRequired` (en/vi/ko).
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; `grep` xác nhận `novalidate` có ở cả 2 bản markup; đọc lại toàn bộ nhánh submit (6 bước, mỗi bước có `return`). **Chưa chạy UI thật.**

**2026-11-18 | v3.5.463 | Arena.ai Agent sửa:**

- Bổ sung 3 chuẩn UX còn thiếu cho ô Email / mật khẩu của popup đăng nhập:
  1. **Ô sai có viền đỏ**: `showProfileAuthError(message, fieldIds)` gắn `aria-invalid="true"` + `aria-describedby="profileAuthError"` cho ô sai và class `is-invalid` lên `label`; CSS `label.is-invalid input { border-color: var(--au-err) }`, giữ đỏ cả khi focus (viền sáng đỏ `color-mix(...,18%,transparent)`), nhãn ô cũng đỏ.
  2. **Kiểm khi rời ô**: `blur` ô Email → nếu đã có nội dung mà sai định dạng thì báo ngay dưới ô; ô trống thì **không** báo.
  3. **Sửa sớm**: khi ô đang bị đánh dấu lỗi, mỗi lần gõ (Email / Mật khẩu / Nhập lại) mà giá trị đã hợp lệ thì lỗi **tự biến mất** (`hideProfileAuthError`).
- Lỗi được gắn đúng ô: `PROFILE_AUTH_FIELDS = { profileEmailInvalid:email, profileBadCredentials:password, profilePasswordShort:password, profilePasswordMismatch:retype }`; "email chưa có tài khoản" là thông báo, **không** tô đỏ ô nào.
- `setProfileAuthMode()` gọi `hideProfileAuthError()` (dọn cả viền đỏ/aria), nên mở lại popup luôn sạch.
- File: `js/dashboard/dashboard.js`, `css/dashboard/settings.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 907/907 ngoặc; đọc lại toàn bộ 5 chỗ gọi `showProfileAuthError` (kiểm email khi gửi, kiểm khi rời ô, nhánh "chưa có tài khoản", nhánh `check()` trả lỗi, và `hideProfileAuthError` trong `setProfileAuthMode`). **Chưa chạy UI thật.**

**2026-11-18 | v3.5.462 | Arena.ai Agent sửa:**

- (1) **Email phải đúng định dạng**: thêm `validEmail()` trong `auth-popup.js` — regex `^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$` (bắt buộc có tên miền + đuôi ≥ 2 chữ) và chặn thêm `..`, chấm ở đầu/cuối phần tên. `check()` trả `profileEmailInvalid` cho mọi trường hợp sai; `dashboard.js` kiểm định dạng **trước** khi xét tài khoản có sẵn, báo lỗi và đưa con trỏ về ô Email.
- (2) **Con mắt hiện/ẩn mật khẩu** cho cả ô Mật khẩu và Nhập lại mật khẩu: bọc mỗi ô trong `.profile-auth-pw` + nút `.profile-auth-eye` (`data-password-toggle="<id ô>"`, icon mắt có gạch chéo), bấm để đổi `type` password ↔ text, đổi `aria-pressed` + `aria-label`, gạch chéo ẩn khi đang hiện (`[aria-pressed="true"] .kp-eye-slash{display:none}`), nhãn dịch theo ngôn ngữ trong `setProfileAuthMode()`.
- (3) **Mật khẩu tối thiểu 8 ký tự** khi tạo tài khoản: `check("register")` trả `profilePasswordShort` nếu `< 8`; đăng nhập (tài khoản demo `123`) **không** áp luật này.
- i18n mới: `profileEmailInvalid`, `profilePasswordShort`, `profileShowPassword`, `profileHidePassword` (en/vi/ko).
- File: `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `pages/dashboard.html`, `css/dashboard/settings.css`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra (chạy thật bằng node, không cần trình duyệt): `validEmail` đúng 8/8 ca thử (`abc` ✗, `a@b` ✗, `a@b.c` ✗, `a@b.co` ✓, `huuson889@gmail.com` ✓, `a..b@x.com` ✗, `.a@x.com` ✗, `a@x-y.com` ✓); `check()`: login `huson@example.com/123` ✓, `huson/sai` → `profileBadCredentials`, email rác → `profileEmailInvalid`, register `12345678` ✓, `1234567` → `profilePasswordShort`, email rác → `profileEmailInvalid`, nhập lại lệch → `profilePasswordMismatch`. `node --check` hợp lệ 3 file JS. **Chưa chạy UI thật** (icon, vị trí con mắt) — cần người dùng xem.

**2026-11-18 | v3.5.461 | Arena.ai Agent sửa:**

- Lỗi: 3.5.460 dò email **ngay khi rời ô**, nên vừa gõ email đã nhảy ra "Nhập lại mật khẩu" + "Tạo tài khoản" — sai hành vi yêu cầu.
- Nay: **bỏ hết dò tự động** (xóa listener `input` / `blur` / `keydown` trên ô Email và cờ `profileAuthManual`). Chỉ khi bấm **Đăng nhập ngay**:
  - Email **chưa có tài khoản** → hiện thông báo *"Email này chưa có tài khoản trên máy này. Nhập lại mật khẩu để tạo tài khoản."* và mở nhánh tạo tài khoản (**Nhập lại mật khẩu** + nút **Tạo tài khoản**) bằng `AUTH_POPUP.morph`.
  - Email có tài khoản nhưng sai mật khẩu → giữ nguyên "Email hoặc mật khẩu không đúng."; đúng → vào Dashboard.
  - Bấm **Tạo tài khoản** → `check("register")` kiểm email hợp lệ / mật khẩu / nhập lại khớp như cũ.
- Thêm khoá i18n `profileAccountNotFound` (en/vi/ko).
- File: `js/dashboard/dashboard.js`, `js/core/languages.js`, `manifest.json` (markup + CSS không đổi).
- Kiểm tra: `node --check` hợp lệ; `grep` không còn `detectProfileAuthMode` / `profileAuthManual`; đọc lại thứ tự trong submit: chặn "chưa có tài khoản" → đổi chế độ → hiện lỗi → return; nhánh còn lại giữ `check()` như trước. **Chưa chạy UI thật.**

**2026-11-18 | v3.5.460 | Arena.ai Agent sửa:**

- Yêu cầu: popup đăng nhập chỉ còn **một form** (bỏ 2 tab Đăng nhập / Đăng ký) — kiểu "identifier-first" như Google, Microsoft, Slack, Notion.
- Nay: nhập Email → rời ô (blur), Enter, hoặc bấm nút gửi thì hệ thống tự dò:
  - **Email đã có** (`huson` / `huson@example.com`) → chỉ hiện **Mật khẩu** + nút **Đăng nhập ngay**.
  - **Email chưa có** → hiện thêm **Nhập lại mật khẩu** + nút **Tạo tài khoản** (ô nhập lại mở/thu mượt bằng `AUTH_POPUP.morph` sẵn có).
- Dò lại khi sửa email (sự kiện `input` đặt lại cờ); nếu người dùng **tự bấm** dòng chân "Chưa có tài khoản? Đăng ký" / "Đã có tài khoản? Đăng nhập" thì cờ `profileAuthManual = true` và hệ thống **không tự đổi ý** nữa cho tới khi email được sửa.
- Kỹ thuật: `auth-popup.js` thêm `accountExists(username)` (so khớp chữ thường với dữ liệu demo cục bộ, không gửi đi đâu) và export trong `LHN_AUTH_POPUP`; `dashboard.js` thêm `detectProfileAuthMode()`, `setProfileAuthMode()` bỏ 4 dòng tab và chuyển sang class `is-register` trên `#profileAuthForm`; submit gọi dò trước khi `check()` nếu chưa chỉnh tay.
- Dọn theo: bỏ khối tab trong `pages/dashboard.html` và trong `markup()` của `auth-popup.js` (2 bản markup luôn khớp nhau); bỏ CSS `.profile-auth-seg` (5 rule + 2 rule ở sheet dọc/ngang + tham chiếu trong `prefers-reduced-motion`); đổi 2 rule dòng chân từ `form:has(#profileRegisterTab.is-active)` sang `form.is-register`.
- Nhãn: `profileCreateAccount` → **en "Create account" / vi "Tạo tài khoản" / ko "계정 만들기"** (trước là "Sign up/Đăng ký/가입", trùng nhãn link chân trang).
- File: `pages/dashboard.html`, `js/shared/auth-popup.js`, `js/dashboard/dashboard.js`, `css/dashboard/settings.css`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ cho 3 file JS; `grep` toàn repo không còn `profile-auth-seg` / `profileRegisterTab` / `profileLoginTab`; jsdom trên markup thật: không còn tablist, còn đủ Google, Email, Mật khẩu, Nhập lại, nút gửi, 2 dòng chân, `#profileRetypePasswordLabel` mặc định `hidden`. **Chưa chạy UI thật** (sandbox không có trình duyệt).

**2026-11-18 | v3.5.459 | Arena.ai Agent sửa:**

- Yêu cầu: **cửa sổ Cài đặt cũng có hiệu ứng hiện/ẩn giống popup đăng nhập**.
- Nay (máy tính / màn ngang — `@media (orientation: landscape)`):
  - `#dashboardSettingsDialog.dashboard-settings-dialog { opacity:1; transform:none; transition: opacity .18s ease-out, transform .18s ease-out, display .3s allow-discrete, overlay .3s allow-discrete }`.
  - `:not([open]) { opacity:0; transform:scale(.97) }` + `@starting-style { [open] { opacity:0; transform:scale(.97) } }` → mở: hiện dần + phóng nhẹ 180ms; đóng: thu nhỏ + mờ đi.
  - `::backdrop { opacity:1; transition: opacity .3s, display .3s allow-discrete, overlay .3s allow-discrete }` + `:not([open])::backdrop { opacity:0 }` + `@starting-style` → nền sau mờ dần 300ms. Nền giữ nguyên (`rgba(0,0,0,.16)` máy tính, `.4` nơi khác).
  - `html.kp-embed` (Cài đặt nằm trong sheet thanh Keepit, toàn màn hình) **không** phóng: `opacity:1; transform:none; transition:none`.
- Điện thoại (dọc: `@media (orientation: portrait)`; ngang thấp: `@media (orientation: landscape) and (max-height: 499.98px)`) **giữ nguyên kiểu sheet trượt từ đáy**; thêm `opacity:1` vào rule `:not([open])` của khối ngang thấp để lúc đóng vẫn thấy sheet trượt xuống (khối ngang ở trên đặt `opacity:0`).
- File: `css/dashboard/settings.css`, `manifest.json` (không đổi JS/HTML).
- Kiểm tra: CSS 906/906 ngoặc; đọc CSSOM: khối `@media (orientation: landscape)` chứa đúng 3 rule mới (opacity/transform/transition), rule `::backdrop` gốc có `opacity:1` + transition, và rule sheet ngang-thấp có `opacity:1`. **Chưa xác minh bằng mắt** — jsdom không chạy `@media (orientation)`, nên hiệu ứng thật cần người dùng xem.

**2026-11-18 | v3.5.458 | Arena.ai Agent sửa:**

- Người dùng chốt: làm popup Ảnh hồ sơ **giống hệt** popup đăng nhập (`.profile-auth-dialog`, settings.css:866–899). Lần này copy nguyên giá trị mẫu, không tự thêm.
- (1) **Hiện/ẩn**: hộp thoại `transition: display .3s allow-discrete, overlay .3s allow-discrete`; thẻ `opacity:1; transform:none; transition: opacity .18s ease-out, transform .18s ease-out` + `[not([open])]{opacity:0; transform:scale(.97)}` + `@starting-style`; `::backdrop` `opacity:1` → `[not([open])]{opacity:0}` + `@starting-style`, `transition: opacity .3s, display .3s allow-discrete, overlay .3s allow-discrete`. Sheet điện thoại: thẻ `opacity:1; transform:none; transition:none` (trượt bằng cả hộp thoại như mẫu).
- (2) `color-scheme: light` trên hộp thoại, `html.dark` → `dark`. (3) `overscroll-behavior: contain` trên hộp thoại **và** trên vùng cuộn thật `.kp-avatar-body`. (4) `-webkit-tap-highlight-color: transparent`.
- (5) `::backdrop` về **`rgba(0,0,0,.4)`** cho cả hai chế độ (bỏ `.5` tôi tự thêm) + `@media (orientation: landscape){ background: rgba(0,0,0,.24) }` như mẫu. (6) Tay nắm sheet **36×5** (trước 38×5).
- Kỹ thuật: căn giữa bằng `translate: var(--kp-avatar-dx) var(--kp-avatar-dy)` (thuộc tính rời) để hiệu ứng phóng `transform: scale(.97)` không đè lên phép dịch.
- Không copy (không cần): `z-index` (dialog top layer), `box-sizing` cho mọi con (`*{box-sizing:border-box}` đã có ở đầu `dashboard.css`), `font-size/line-height` gốc. Giữ khác có lý do: chỉ thân thẻ cuộn (để nút Đổi ảnh / Xoá ảnh luôn thấy) và 392px / bo 16 theo thiết kế đã chốt.
- File: `css/dashboard/dashboard.css`, `manifest.json` (JS không đổi).
- Kiểm tra: CSS 1221/1221 ngoặc; jsdom → hộp thoại `fixed/grid/center`, `color-scheme:light`, `overscroll-behavior:contain`, `transition: display .3s allow-discrete, overlay .3s allow-discrete`; thẻ `392px / max-width:100% / rgba(255,255,255,.78) / blur(24px) saturate(1.6) / opacity:1 / transition: opacity .18s, transform .18s`, `translate` dùng biến căn giữa. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox).

**2026-11-18 | v3.5.457 | Arena.ai Agent sửa:**

- Người dùng báo: ở chế độ điện thoại (DevTools 455×696), sheet **Ảnh hồ sơ không kéo xuống để đóng** được — trong khi sheet Cài đặt và popup đăng nhập kéo được.
- Nguyên nhân: popup Ảnh hồ sơ là sheet mới, **chưa gắn `sheet-kit`** (`js/shared/sheet-kit.js`) như hai sheet kia.
- Nay: gắn y như popup đăng nhập — `LHN_SHEET.attach(dialog, { isOpen, close, watch, drag: SHEET.matches ? undefined : false })`, `SHEET` = đúng media query của CSS sheet (`portrait ≤699px` hoặc `landscape ≤499.98px`) nên **máy tính không kéo, điện thoại kéo được**; kéo xuống quá ngưỡng = đóng; danh sách trong thân cuộn lên trước rồi mới kéo (đúng luật sheet-kit).
- Thêm chuyển động đóng/mở của sheet (chỉ trong media query điện thoại): `transition:transform .3s cubic-bezier(.2,.8,.2,1), display .3s allow-discrete, overlay .3s allow-discrete` + `[not([open])]{transform:translateY(100%)}` + `@starting-style` — y như sheet Cài đặt, nên đóng là trượt xuống chứ không biến mất.
- File: `js/dashboard/dashboard.js`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1211/1211 ngoặc; `grep` xác nhận `sheet-kit.js` được nạp **trước** `dashboard.js` trong `pages/dashboard.html` nên `LHN_SHEET` có sẵn lúc gắn. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox).

**2026-11-18 | v3.5.456 | Arena.ai Agent sửa:**

- Lỗi (ảnh người dùng): popup nhảy xuống **góc dưới bên phải**, phần lớn ra ngoài màn hình.
- Nguyên nhân: `openAvatarDialog()` gọi `syncAvatarDialogOffset()` **trước** `showModal()`. Lúc đó hộp thoại còn `display:none` nên `getBoundingClientRect()` của thẻ = **0**; phép dịch thành `tâm Cài đặt − 0` → dịch vài trăm px xuống phải.
- Nay: gọi **sau** `showModal()` (đã có layout), và thêm chốt an toàn: nếu rect rỗng (width/height = 0) hoặc |dx|,|dy| > 240 thì **không dịch** — thẻ quay về đúng thế canh giữa của CSS (y popup đăng nhập).
- Phần CSS giữ nguyên như 3.5.455 (viết theo `.profile-auth-dialog`): hộp thoại `fixed inset:0; padding:16px; display:grid; place-items:center`; thẻ kính `.78` + `blur(24px) saturate(1.6)`, viền `.12`, bo 16, rộng 392px; điện thoại → sheet đáy.
- File: `js/dashboard/dashboard.js`, `manifest.json` (CSS không đổi).
- Kiểm tra: `node --check` hợp lệ; đọc lại thứ tự trong `openAvatarDialog()`: `showModal()` → `syncAvatarDialogOffset()` → focus. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox).

**2026-11-18 | v3.5.455 | Arena.ai Agent sửa:**

- Lỗi: popup vẫn lệch và không "giống popup đăng nhập". Đo trên ảnh người dùng: thẻ 684→1172 px ảnh (tâm 928) trùng khít ảnh trước → phép dịch của 3.5.454 **không có tác dụng** vì nó giả định thẻ đang canh theo khung nhìn.
- Nay viết lại **theo đúng khuôn `.profile-auth-dialog`** (popup đăng nhập, settings.css:866):
  - Hộp thoại: `position:fixed; inset:0; padding:16px; width:100%; height:100%; display:grid; place-items:center` — tự canh thẻ, không dựa vào `margin:auto` của trình duyệt.
  - Thẻ: kính đặt **trực tiếp trên thẻ** (bỏ lớp `::before`): `background:rgba(255,255,255,.78)` / tối `rgba(24,24,28,.78)`, `backdrop-filter:blur(24px) saturate(1.6)`, viền `rgba(0,0,0,.12)` / `rgba(255,255,255,.12)`, bo 16, `box-shadow:0 24px 64px rgba(0,0,0,.24)`.
  - `::backdrop`: `rgba(0,0,0,.4)` (tối `.5`), không blur.
  - **Responsive như popup đăng nhập**: `@media (orientation:portrait) and (max-width:699px), (orientation:landscape) and (max-height:499.98px)` → hộp thoại thành sheet đáy `inset:auto 0 0 0`, thẻ rộng 100%, bo `22px 22px 0 0`, có tay nắm (`::before` 38×5), chừa `env(safe-area-inset-bottom)`.
- Căn giữa theo Cài đặt: `syncAvatarDialogOffset()` nay **đo thật** — đặt dx/dy về 0, đọc `getBoundingClientRect()` của thẻ và của Cài đặt, dịch đúng bằng hiệu hai tâm (vừa ngang vừa dọc), không giả định khung nhìn; bỏ qua khi ở chế độ sheet điện thoại.
- `width:392px; max-width:100%` (thay `min()`) cho chắc chắn.
- Giữ nguyên: ảnh 200px, chân C (Đổi ảnh / Xoá ảnh), chữ phụ `#5f6575`.
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1207/1207 ngoặc; jsdom → hộp thoại `position:fixed; display:grid; place-items:center; padding:16px`, thẻ `width:392px; max-width:100%; background:rgba(255,255,255,.78)` (tối `rgba(24,24,28,.78)`), `backdrop-filter:blur(24px) saturate(1.6)`, viền `.12`. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox).

**2026-11-18 | v3.5.454 | Arena.ai Agent sửa:**

- Lỗi: popup vẫn xám đục và **không canh giữa theo hộp thoại Cài đặt**. Đo trên ảnh người dùng (1920×1080, DPR 1.25): Cài đặt x 356→1631 (tâm 993,5 px ảnh = 794,8 CSS), popup x 684→1171 (tâm 927,5 px ảnh = 742 CSS) → popup lệch **~53 CSS px sang trái**.
- Nguyên nhân lệch: hộp thoại Cài đặt nằm trong vùng nội dung (lệch phải sidebar 60px, tâm ở `60 + (1536-60)/2 = 798`), còn `dialog` của popup do trình duyệt canh giữa **khung nhìn** (768) → hai tâm khác nhau.
- Nay: thêm `syncAvatarDialogOffset()` — đọc `getBoundingClientRect()` của Cài đặt lúc mở popup, ghi `--kp-avatar-dx` vào `#dashboardAvatarDialog`, thẻ dịch `transform:translateX(var(--kp-avatar-dx,0px))`; tính lại khi resize nếu popup đang mở; Cài đặt không mở thì `dx = 0`.
- Nguyên nhân xám: `::backdrop` phủ `rgba(0,0,0,.4)` lên chính tấm kính Cài đặt → mọi thứ thành xám, kính `.78` trên nền xám ra `#e4e4e6`. Nay backdrop chỉ còn `rgba(0,0,0,.14)` (tối `rgba(0,0,0,.3)`), không blur → Cài đặt phía sau vẫn sáng, popup thành tấm kính sáng nổi trên đó (kính `.78` + `blur(24px) saturate(1.6)` giữ nguyên).
- Không đổi: 392px, bo 16, ảnh 200px, bố cục chân C, chữ phụ `#5f6575`.
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1204/1204 ngoặc; số đo lấy trực tiếp từ ảnh người dùng. **Chưa xác minh bằng mắt** (không có trình duyệt trong sandbox) — vị trí sau khi dịch và độ sáng của kính cần người dùng xem lại.

**2026-11-18 | v3.5.453 | Arena.ai Agent sửa:**

- Lỗi (ảnh người dùng): sau 3.5.452, **cả trang bạc màu** và thẻ popup **xám đục** — sửa càng sai.
- Nguyên nhân thật: 3.5.452 đặt `#dashboardSettingsDialog.kp-avatar-behind { opacity:.4 }`; vì hộp thoại Cài đặt là tấm kính phủ gần hết màn hình nên **giảm opacity của nó làm nhạt luôn cả trang phía sau**; cộng thêm nền `.58` → kính trắng `.78` nằm trên nền tối nên ra màu xám `#dbdbdb` (đo trên ảnh: thân thẻ 219,219,219; nền sau 76,73,93).
- Nay: **gỡ hẳn** class `kp-avatar-behind` (JS + CSS) → trang không còn bị bạc; `#dashboardAvatarDialog::backdrop` = **`rgba(0,0,0,.4)`, không blur — y hệt `#dashboardSettingsDialog::backdrop` (settings.css:225)** ở cả sáng và tối; giữ kính `::before` `.78` + `blur(24px) saturate(1.6)`.
- Chữ phụ trên nền kính được làm đậm lại cho dễ đọc: `.kp-avatar-meta` / `.kp-avatar-limit` / `.kp-avatar-close` từ `#8b91a0` → `#5f6575` (nền kính nhạt hơn nền trắng đặc nên chữ cũ chỉ còn ~2,3:1 tương phản).
- Giữ nguyên hình học thẻ (392px, bo 16, ảnh 200px, chân C).
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1203/1203 ngoặc; `grep` xác nhận không còn `kp-avatar-behind` trong cả `css` và `js`. **Chưa xác minh bằng mắt** — jsdom không tính được `::before`/`::backdrop`.

**2026-11-18 | v3.5.452 | Arena.ai Agent sửa:**

- Lỗi 1 (người dùng hỏi "tại sao có cái khung mờ phía sau?"): sau lưng popup **Ảnh hồ sơ** hiện một tấm chữ nhật mờ. Đó chính là **hộp thoại Cài đặt vẫn đang mở** phía dưới, bị `::backdrop` của popup làm mờ (`backdrop-filter: blur(6px)`) nên viền bo của nó hiện thành "khung".
- Nay: `#dashboardAvatarDialog::backdrop` chỉ **tối** như của Cài đặt (`rgba(0,0,0,.58)` sáng / `.66` tối), **bỏ `backdrop-filter`**; và khi mở popup, Cài đặt nhận class `kp-avatar-behind` (`opacity:.4`, chuyển 180ms) để lùi hẳn về sau — đóng popup thì gỡ class.
- Lỗi 2: thẻ popup nền đặc (`#fff` / `#1c1c26`). Nay là **kính mờ y hộp thoại Cài đặt**: lớp `::before` (`inset:0; z-index:-1; border-radius:inherit`) với `background: rgba(255,255,255,.78)` / `rgba(24,24,28,.78)` và `backdrop-filter: blur(24px) saturate(1.6)`; thẻ đặt `position:relative; isolation:isolate`, `background:transparent`, viền `rgba(0,0,0,.12)` / `rgba(255,255,255,.12)`; đường kẻ đầu/thân/chân đổi sang cùng màu viền `.12`.
- Giữ nguyên: kích thước 392px, bo 16px, ảnh xem trước 200px, bố cục chân C (Đổi ảnh / Xoá ảnh xếp dọc).
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra: `node --check` hợp lệ; CSS 1205 `{` / 1205 `}`; jsdom (sáng & tối) cho `.kp-avatar-card` `background:rgba(0,0,0,0)`, `position:relative`, `isolation:isolate`, viền `.12` đúng hệ màu. **Chưa xác minh bằng mắt**: jsdom không tính được style của `::before`/`::backdrop`, nên hiệu ứng kính và mức tối của nền cần người dùng xem lại.

**2026-11-18 | v3.5.451 | Arena.ai Agent sửa:**

- Lỗi: **đăng xuất ở sidebar** (menu hồ sơ) không đổi nhãn gói, trong khi đăng xuất trong Cài đặt thì đổi.
- Nguyên nhân: `applyMenuPlanBadge()` (gọi trong `renderProfileMenu`) luôn `SETTINGS_KIT.plan.apply()` — phát lại gói **đã biết cuối cùng** (ví dụ Ultra) kể cả khi đã đăng xuất. Đường đăng xuất trong Cài đặt thì tình cờ đúng vì `refreshDashboardSettings()` có sẵn `if (!demoProfile) SETTINGS_KIT.plan.set("free")`.
- Nay: `applyMenuPlanBadge()` rẽ nhánh — **chưa đăng nhập → `plan.set("free")`**, đã đăng nhập mới `apply()`; và `signOutDemoProfile()` đặt `plan.set("free")` ngay trước khi vẽ lại, nên nhãn về "Miễn phí" + kiểu xám khách lập tức, không phải chờ mở Cài đặt.
- Sửa luôn chiều ngược lại: `finishProfileAuth()` (đăng nhập) trước đây chỉ nạp `USAGE_STATUS` khi Cài đặt đang mở → đăng nhập từ sidebar sẽ hiện sai "Miễn phí". Nay luôn nạp, nên nhãn đúng gói ở mọi đường đăng nhập.
- File: `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra (tĩnh): `node --check` hợp lệ; `grep` xác nhận 3 điểm — `signOutDemoProfile` có `plan.set("free")`, `applyMenuPlanBadge` rẽ nhánh theo `demoProfile`, `finishProfileAuth` gọi `refreshUsageLimitSettings()` không điều kiện. Chưa chạy được UI (sandbox không có trình duyệt).

**2026-11-18 | v3.5.450 | Arena.ai Agent sửa:**

- **Sửa lỗi do 3.5.449 gây ra**: ở khung Cài đặt hẹp, nhãn "Ảnh hồ sơ" bị bóp còn ~40px nên chữ rơi mỗi dòng một từ, ảnh chồng lên chữ.
- Nguyên nhân: `css/dashboard/settings.css` có container query `@container kpset (max-width:520px)` đặt `.settings-account-controls { flex:1 1 100%; width:100% }`. Bản 3.5.449 chỉ đè `flex` mà **quên `width`**, nên khối ảnh rộng 100% → cột chữ co về 0.
- Nay đè đủ cả 5 thuộc tính bằng `!important` (an toàn bất kể độ ưu tiên/thứ tự file):
  - hàng: `flex-direction:row`, `align-items:center`, `justify-content:space-between`, `flex-wrap:nowrap`, `gap:12px`, `row-gap:0`
  - cột chữ: `flex:1 1 auto`, `width:auto`, `max-width:none`, `min-width:0`
  - khối ảnh: `flex:0 0 auto`, `width:auto`, `max-width:none`, `align-self:center`
- File: `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm chứng (computed style, jsdom + CSS thật): hàng ảnh `direction=row / wrap=nowrap / align=center / gap=12px`; cột chữ `flex 1/1/auto`, `width:auto`, `max-width:none`, `min-width:0`; khối ảnh `flex 0/0/auto`, `width:auto`, `max-width:none`. Ngoặc CSS cân 1202/1202, `git diff` chỉ +13/−9 dòng (không đụng phần khác).
- Vẫn **không chụp được ảnh** (sandbox thiếu `xvfb` + lib Chromium) — cần anh kiểm tra lại trên máy.

**2026-11-18 | v3.5.449 | Arena.ai Agent sửa:**

- Đổi nhãn dưới "Ảnh hồ sơ": “Bấm vào ảnh để xem, đổi hoặc xoá.” → **“Bấm vào ảnh để thay đổi.”** (en “Click the picture to change it.”, ko “사진을 클릭해 변경하세요.”); sửa cả chuỗi mặc định trong `pages/dashboard.html`.
- Responsive: ở màn hẹp, luật cũ `@media(max-width:520px) .settings-account-row{flex-direction:column}` làm **ảnh rơi xuống dưới nhãn**. Nay hàng Ảnh hồ sơ được miễn luật đó: luôn `flex-direction:row`, `align-items:center`, `flex-wrap:nowrap`, `gap:12px`; cột chữ `flex:1 1 auto; min-width:0` (nhãn phụ tự xuống dòng trong cột), ảnh `flex:0 0 auto` — ảnh luôn đứng cùng dòng bên phải. Các hàng Tài khoản khác **vẫn xếp dọc như cũ**.
- Luật đặt bằng selector có id (`#dashboardSettingsDialog …` và `#dashboardHighlightsNotesView #dashboardSettingsDialog …`) nên thắng luật `@media` cũ về độ ưu tiên, không phụ thuộc thứ tự file.
- File: `js/core/languages.js`, `pages/dashboard.html`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm chứng (computed style, jsdom, cả 2 nền): hàng ảnh `flexDirection=row`, `align=center`, `wrap=nowrap`, `gap=12px`; cột chữ `flex 1/1/auto`, `min-width:0`; ảnh `flex 0/0/auto`. `node --check languages.js` hợp lệ; ngoặc CSS cân 1200/1200.
- Vẫn **không chụp được ảnh** (sandbox thiếu `xvfb` + lib Chromium).

**2026-11-18 | v3.5.448 | Arena.ai Agent sửa:**

- Hàng **Ảnh hồ sơ** (Cài đặt → Tài khoản) giờ **chỉ còn ảnh**: bỏ nút "Thay đổi" và nút "Xoá ảnh" cũ, ảnh trở thành nút bấm (phóng nhẹ 1.04 + vòng sáng khi rê, có `aria-haspopup="dialog"`).
- Bấm ảnh mở **popup** (`<dialog id="dashboardAvatarDialog">`, class `kp-avatar-dialog`):
  - Trên: tiêu đề "Ảnh hồ sơ" + nút ✕ 38px (44px trên cảm ứng).
  - Giữa: ảnh lớn 200px tròn (160px khi màn ≤460px, 140px khi màn thấp ≤560px), dòng meta dữ liệu thật `JPG · <dung lượng> · Sửa <ngày>`, dòng "PNG hoặc JPG, tối đa 2 MB.".
  - Đáy: **kiểu C** — hai nút xếp dọc, mỗi nút rộng hết hàng, cùng cao 42px (46px cảm ứng), bo 10px, chữ 13.5px/650, icon 16px: **Đổi ảnh** (tím đặc `#7262df` / tối `#6f63e0`) ở trên, **Xoá ảnh** (nền đỏ nhạt, chữ `#c0393b` / tối `#f3a5a7`) ở dưới. Đáy cộng `env(safe-area-inset-bottom)`.
- Hành vi: **Đổi ảnh** = đóng popup rồi mở hộp chọn ảnh; chọn ảnh mới lưu kèm `avatarUpdatedAt`; **Xoá ảnh** = xoá `avatarDataUrl`, đóng popup, hiện toast **"Đã xoá ảnh hồ sơ." + Hoàn tác** (5 giây, dùng `SETTINGS_KIT.undo.show` nên bấm Hoàn tác là ảnh về nguyên). Đóng popup: ✕, `Esc`, bấm ra ngoài; đóng xong trả focus về ảnh.
- Dung lượng ảnh hiển thị được tính thật từ data URL (`avatarSizeLabel`), không phải số bịa.
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `js/core/languages.js` (thêm `accountProfilePictureChange/Limit/Empty/Updated`, sửa `accountProfilePictureHelp` cho 3 ngôn ngữ), `css/dashboard/dashboard.css` (bỏ CSS nút cũ 3.5.447, thêm CSS popup), `manifest.json`.
- Kiểm chứng (computed style, jsdom 29, nạp CSS thật + markup thật của trang):
  - Popup: bo 16px, nền `#fff` / `#1c1c26`, đệm đáy `calc(16px + env(safe-area-inset-bottom))`; ảnh 200×200 bo 50%.
  - Đáy: `display:grid`, `gap:8px`; hai nút đều cao 42px, chữ 13.5px/650; Đổi ảnh nền `#7262df` (tối `#6f63e0`) chữ trắng; Xoá ảnh nền `#fdf0f0`/`rgba(248,113,113,.12)`.
  - Hàng: ảnh trong trigger 40×40 (đúng khung Cài đặt).
  - `node --check` cả 2 file JS hợp lệ; ngoặc CSS cân 1195/1195; `grep` xác nhận không còn `settingsChangeProfilePicture` / `settingsRemoveProfilePicture` ở bất kỳ file nào.
- Vẫn **không chụp được ảnh** (sandbox thiếu `xvfb` + lib Chromium).

**2026-11-18 | v3.5.447 | Arena.ai Agent sửa:**

- Thêm cách **xoá ảnh hồ sơ** ngay trong UI: hàng "Ảnh hồ sơ" (Cài đặt → Tài khoản) có thêm nút **"Xoá ảnh"** cạnh nút "Thay đổi".
  - Chỉ hiện khi hồ sơ đang có ảnh tự chọn (`demoProfile.avatarDataUrl`); chưa có ảnh thì ẩn hẳn.
  - Kiểu nút "nhẹ": viền đỏ nhạt `#f0b4b4`, nền trắng, chữ `#c53030`; rê chuột `#fef2f2`/`#dc2626`; nền tối `#1a1a1d` / `#7f1d1d` / `#f2a3a5`. Không dùng nút đỏ đặc để tránh cảm giác nguy hiểm như "Xoá tài khoản".
  - Bấm = xoá đúng một trường `avatarDataUrl`, lưu lại hồ sơ, vẽ lại **cả** avatar trong Cài đặt và ở chân sidebar (về chữ cái đầu tên), hiện toast "Đã xoá ảnh hồ sơ." — không mất tên/email/ghi chú.
- Thêm 2 khoá dịch cho cả 3 ngôn ngữ: `accountProfilePictureRemove` (Remove picture / Xoá ảnh / 사진 삭제), `accountProfilePictureRemoved` (Profile picture removed. / Đã xoá ảnh hồ sơ. / 프로필 사진을 삭제했습니다.).
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `js/core/languages.js`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check` 2 file JS hợp lệ; ngoặc CSS cân 1149/1149; nút nằm trong template `settingsAccountSignedInTemplate` (khách không thấy) và ẩn mặc định bằng `hidden`; trình xử lý click dùng uỷ quyền trên `#settingsAccountState` nên vẫn chạy sau khi vẽ lại.

**2026-11-18 | v3.5.446 | Arena.ai Agent sửa:**

- Lỗi "badge tối sai": luật nền tối cho nhãn Free (`html.dark #dashboardSidebar .reference-footer-button > .kp-plan-badge`, độ ưu tiên 1-3-1) **đè** luật Pro/Ultra (1-3-0), nên ở nền tối Pro/Ultra vẫn ra tím nhạt của Free. Đã buộc luật Free vào `[data-plan="free"]` → Pro/Ultra giữ đúng kiểu ở cả hai nền.
- Bóng đổ của Pro/Ultra phải `!important` vì luật cũ `.dashboard-profile-free-badge` đặt `box-shadow:none!important`.
- Avatar nền tối bị `html.dark .reference-avatar-letter{color:#a5a9ff}` nhuộm chữ/viền tím → thêm luật đè `color:#fff; border-color:#fff`.
- Vòng avatar Pro/Ultra viết bằng longhand (`outline-width/style/color`) thay vì `var(--kp-plan)` để không phụ thuộc biến.
- File: `css/dashboard/dashboard.css`, `manifest.json`.
- **Kiểm chứng bằng computed style** (jsdom 29, nạp đủ 13 file CSS theo đúng thứ tự trong `pages/dashboard.html`, dựng lại đúng markup sidebar + thẻ hồ sơ Cài đặt, đo 2 nền × 4 gói):
  - Nền tối Free: badge `rgba(165,169,255,.12)` / viền `rgba(165,169,255,.6)` / chữ `#b9b3ff` — **giống Cài đặt**.
  - Nền tối Pro: `linear-gradient(135deg,#f59e0b,#b45309)`, chữ trắng, bóng `0 2px 8px rgba(180,83,9,.3)`, avatar viền `#fbbf24` — **giống Cài đặt**.
  - Nền tối Ultra: `linear-gradient(135deg,#8b5cf6,#5b21b6)`, bóng `0 2px 8px rgba(109,40,217,.35)`, avatar `outline 2px #a78bfa` + quầng `rgba(139,92,246,.38)` — **giống Cài đặt**.
  - Nền sáng Pro: `#f59e0b→#b45309`, avatar `2px #d97706`; Ultra: `#8b5cf6→#5b21b6`, avatar `2px #7c3aed`.
- Vẫn **không chụp được ảnh** (sandbox thiếu `xvfb` + lib Chromium).

**2026-11-18 | v3.5.445 | Arena.ai Agent sửa:**

- Lỗi: Cài đặt đổi gói Pro/Ultra thì nhãn ở chân sidebar không đổi kiểu (vì nhãn đó là HTML tĩnh `data-plan="free"`, chỉ `#settingsProfilePlan` được cập nhật).
- Nay `SETTINGS_KIT.plan.set(id)` vẽ **cả hai nơi** từ cùng một bảng `PLANS`: `#settingsProfilePlan` và `#profileMenuTogglePlan` (cùng `data-plan`, cùng icon shield/bolt/crown, cùng chữ `usagePlanFree/Trial/KeyA/KeyB`), đồng thời gắn `data-plan` lên `.dashboard-reference-profile-wrap` để tô vòng avatar.
- Thêm `apply()` để `renderProfileMenu()` áp lại gói đã biết sau mỗi lần vẽ lại, và nạp `USAGE_STATUS` **một lần khi mở Dashboard** (trước đây chỉ nạp khi mở Cài đặt) → chân sidebar đúng gói ngay từ đầu.
- CSS: Pro (trial/keyA) = vàng `linear-gradient(135deg,#f59e0b,#b45309)`; Ultra (keyB) = tím `linear-gradient(135deg,#8b5cf6,#5b21b6)` + bóng `0 2px 8px rgba(109,40,217,.35)`, chữ trắng; avatar Pro/Ultra có `outline:2px solid var(--kp-plan)` + `outline-offset:2px`, Ultra thêm quầng `rgba(124,58,237,.32)` (tối `rgba(139,92,246,.38)`); biến `--kp-plan`: free `#7262df`, Pro `#d97706`, Ultra `#7c3aed` (tối `#a5a9ff` / `#fbbf24` / `#a78bfa`).
- File: `js/dashboard/settings-ui.js`, `js/dashboard/dashboard.js`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check` cả 2 file JS hợp lệ; ngoặc CSS cân 1145/1145; `git diff` xác nhận `set()` không còn `return` sớm khi thiếu `#settingsProfilePlan`. **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.444 | Arena.ai Agent sửa:**

- Sửa lại avatar chân sidebar cho **đúng màu / viền / kiểu của khung Cài đặt**, chỉ giữ kích thước 28px (3.5.443 mới đổi class nên vẫn bị viền tím 1px + nền tím nhạt của `.reference-avatar-letter` đè lên):
  - Đã đăng nhập: nền **#7262df**, chữ trắng, bóng trong `inset 0 2px 5px #0002` (đúng `.profile-avatar`).
  - Khách: viền **2px solid #cbd5e1**, nền trong suốt, icon xám **#71717a**; tối: viền **#55555c**, icon **#a1a1aa**.
- Nhãn "Miễn phí" dùng đúng bảng màu `.kp-plan-badge[data-plan="free"]`: đã đăng nhập sáng `#b9b3ff`/`#f2efff`/`#6b5ce0`, tối `rgba(165,169,255,.6)`/`rgba(165,169,255,.12)`/`#b9b3ff`; khách xám `#aab4c3`/`#f1f5f9`/`#475569` (tối `rgba(255,255,255,.28)`/`rgba(255,255,255,.06)`/`#d0d0d4`), cao 21px, bo tròn 999px.
- File: `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): ngoặc `{}` cân 1134/1134; 3 khối luật mới nằm cuối file nên thắng `.reference-avatar-letter` (1 id + 3 class so với 1 id + 1 class). **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.443 | Arena.ai Agent sửa:**

- Avatar và badge ở chân sidebar Dashboard nay dùng đúng thành phần của khung **Cài đặt**: avatar là `.profile-avatar .profile-avatar-guest` (khách: viền nét đứt + icon người; đã đăng nhập: ảnh đại diện qua `profilePictureMarkup`) thay cho chữ cái "B"; badge dùng `.kp-plan-badge[data-plan]` với đúng bảng màu của Cài đặt (sáng `#b9b3ff`/`#f2efff`/`#6b5ce0`, tối `rgba(255,255,255,.14)`/`rgba(255,255,255,.06)`/`#a5a9ff`).
- `renderProfileMenu()` cập nhật avatar giống `refreshSettings()` (cùng hàm `profilePictureMarkup`, cùng SVG khách) nên hai nơi không lệch nhau nữa.
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js`, `css/dashboard/dashboard.css`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check js/dashboard/dashboard.js` hợp lệ; `grep reference-avatar-letter` còn đúng 1 chỗ dùng kèm `profile-avatar profile-avatar-guest`; badge có `kp-plan-badge` + `data-plan="free"`. **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.442 | Arena.ai Agent sửa:**

- Icon tab Ghi chú trong sidebar Dashboard: dùng **đúng icon "npen" của thanh Keepit trên trang web** (`js/content/keepit-bar.js`, `ICONS.npen` — sổ có gáy xoắn + bút), thay cho hình em tự vẽ ở 3.5.441. Thanh tab dưới ở mobile (`responsive-nav.js`) lấy icon từ sidebar nên cũng thành npen theo.
- File: `pages/dashboard.html`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `grep "M21.378 5.626"` (đoạn path đặc trưng của npen) có trong `pages/dashboard.html` và `js/content/keepit-bar.js`; không còn path của icon tự vẽ. **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.441 | Arena.ai Agent sửa:**

- Đổi nhãn tab sidebar "Ôn tập Flashcards" → **"Flashcards"** (`pages/dashboard.html` + `js/core/languages.js`: en/vi "Flashcards", ko "플래시카드").
- Đổi icon tab **Ghi chú** từ hình *bình thí nghiệm* (flask, không liên quan) sang **sổ + bút** (notebook-pen). Rà lại 6 icon còn lại: Tổng quan = lưới 4 ô, Chép chính tả = tai nghe, Flashcards = chồng thẻ, Tài liệu = tệp có dòng chữ, Thùng rác = thùng rác, Giao diện = mặt trời/mặt trăng — giữ nguyên vì đã đúng nghĩa.
- File: `pages/dashboard.html`, `js/core/languages.js`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check js/core/languages.js` hợp lệ; `grep "Ôn tập Flashcards"` trong `pages/` và `js/core/` không còn ở nhãn tab (chỉ còn chuỗi `ovActivityFlashcards` của dòng hoạt động ở Tổng quan). **Chưa chụp ảnh được** (sandbox thiếu `xvfb` + lib Chromium, không có root).

**2026-11-18 | v3.5.440 | Arena.ai Agent sửa:**

- Sửa nháy sáng viền khung khi đổi Sáng/Tối ở tab Chép chính tả và Ghi chú: các thẻ ở 2 tab này khai báo `transition:border-color .2s` (`.dictation-root .session-card`, `.search-row`, `.hl-card`…), nên lúc đổi nền, viền chạy mờ dần từ màu sáng sang màu tối và bị thấy như "nháy sáng"; tab Tổng quan và Tài liệu không khai báo transition viền nên đổi tức thì, không nháy.
- Cách sửa: thêm class `dashboard-theme-switching` trên `<html>` trong `toggleDashboardTheme()` (bỏ sau 2 khung hình + 60ms) và CSS tắt transition cho **mọi** phần tử khi class này có mặt; đồng thời mở rộng luật `dashboard-theme-pending` từ "chỉ sidebar + Tổng quan" thành toàn bộ cây DOM.
- File: `css/dashboard/dashboard.css`, `js/dashboard/dashboard.js`, `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): `node --check js/dashboard/dashboard.js` hợp lệ; `grep dashboard-theme-switching` thấy đúng 2 chỗ thêm/xoá class và 3 selector CSS. **Chưa quay lại được bằng ảnh** (sandbox mất `xvfb-run` + lib Chromium, không có root).

**2026-11-18 | v3.5.439 | Arena.ai Agent sửa:**

- Tiếp tục dọn navy: các mã **dùng chung cho cả 2 nền** (`#111827`, `#172033`, `#1e293b`, `#1f2937`, `#334155`, `#374151`, `#94a3b8`, `#64748b`, `#cbd5e1`, `#e2e8f0`, `#f1f5f9`…) trước đây bị bỏ qua nên trong rule `html.dark` vẫn còn navy — thấy rõ ở thanh lọc Highlights & Notes, khung Settings, hộp Study. Nay chỉ sửa **bên trong rule `html.dark`** (không đụng rule nền sáng): 453 chỗ.
- Thay 122 chuỗi `rgba()` ánh xanh (`rgba(15,23,42)`, `rgba(17,24,39)`, `rgba(17,26,43)`, `rgba(17,25,40)`, `rgba(31,41,55)`, `rgba(30,41,59)`, `rgba(2,6,23)`) bằng xám/đen trung tính.
- File: `css/dashboard/*.css` (8 tệp), `manifest.json`.
- Kiểm tra (tĩnh, chưa có ảnh): quét lại toàn bộ `css/dashboard/*.css` — **0** mã navy và **0** `rgba` ánh xanh còn trong rule `html.dark`; ngoặc `{`/`}` cân bằng ở cả 11 tệp. **Chưa chụp ảnh được** vì sandbox mất `xvfb-run` + lib Chromium và không có quyền root; `qa/palette436.js` chạy lại được ngay khi môi trường có xvfb.

**2026-11-18 | v3.5.438 | Arena.ai Agent sửa:**

- Sửa tiếp hệ quả của bước quét màu: icon loại tệp trong Thùng rác (tối) đã bị đổi — Word mất nền xanh `#14233f`/`#9db6ff` thành nền xám + icon tím, lệch với icon Word ở nền sáng (vẫn xanh `#e9f0fd`/`#2f6fe4`). Đã khôi phục nguyên bản: `.kind-docx` `#14233f`/`#9db6ff`, `.kind-web` `#25264a`/`#b9b3ff`.
- File: `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: `git diff 080bad8^ -- css/dashboard/trash.css | grep trash-ico` → **rỗng**, tức 7 rule màu icon trong Thùng rác đã giống hệt bản 3.5.433 trước khi sửa. **Chưa chụp ảnh được**: sandbox sau reset mất `xvfb-run` và các lib Chromium (`libnspr4.so`), không có quyền root để cài lại; `qa/trashico438.js` đã viết sẵn, chạy lại khi môi trường có xvfb.

**2026-11-18 | v3.5.437 | Arena.ai Agent sửa:**

- Sửa lỗi ở 3.5.436: bước quét màu đã đổi **cả họ tím** (hero `#5144a7/#43388e/#342a78` → `#4a3f8a/#403679/#332a66`), nên khối tím nhạt đi và lệch màu cũ. Đã khôi phục nguyên vẹn toàn bộ hex họ tím (hero Tổng quan + Chép chính tả, chip, nền tím đậm), chỉ giữ phần đổi navy → đen trung tính và xanh dương nhấn → tím.
- Quét lại có kiểm soát: 64 mã navy/xám-xanh trong rule `html.dark` (trước là 117 mã, gồm cả tím). Hero tối trở lại `linear-gradient(112deg,#5144a7 0%,#43388e 47%,#342a78 100%)`, hero sáng giữ `#a999fa/#8d7aee/#7563e4`.
- File: `css/dashboard/*.css` (10 tệp), `manifest.json`.
- Kiểm tra: `qa/palette437.js` (1512×950) — sáng nền `rgb(233,237,244)`, sidebar `rgb(255,255,255)`, thanh trên `rgba(255,255,255,.72)`+blur; tối nền `rgb(0,0,0)`, sidebar `rgb(13,13,15)`, thanh trên `rgba(13,13,15,.72)`+blur; điểm ảnh hero tối `(78,65,161)` khớp lại dải `#5144a7`; `errors []`. Ảnh `shots380/pal437-{light,dark}-1512.png`.

**2026-11-18 | v3.5.436 | Arena.ai Agent sửa:**

- Áp bảng màu của demo v13 vào Dashboard: nền sáng `#e9edf4` + mặt trắng `#ffffff`, nền tối **đen tuyệt đối** `#000000` + mặt `#0d0d0f`, viền tối `#232327`/`#2b2b30`, nhấn **tím** (`#7262df` sáng, `rgba(143,134,242,.16)` + `#a5a9ff` tối).
- Sidebar = đúng màu khung thẻ ở cả 2 nền (sáng `#ffffff`, tối `#0d0d0f`), mục đang chọn tím thay vì xanh.
- Thanh trên dùng chung thành **kính mờ** `rgba(255,255,255,.72)` / `rgba(13,13,15,.72)` + `blur(12px) saturate(1.4)` như demo v13 (trước là đặc).
- Quét màu navy khỏi toàn bộ `css/dashboard/*.css`: 606 chỗ / 117 mã màu trong rule `html.dark` (navy → đen trung tính, xanh dương nhấn → tím), thêm khối token `--lhn-ui-*` theo nền ở cuối `dashboard.css`.
- File: `css/dashboard/{dashboard,overview,dictation,dictation-stats-popup,documents,documents-library,highlights-notes-embedded,responsive,settings,trash}.css`, `manifest.json`.
- Kiểm tra: `qa/palette436.js` (1512×950) — sáng nền `rgb(233,237,244)`, sidebar `rgb(255,255,255)`, thanh trên `rgba(255,255,255,.72)` + blur; tối nền `rgb(0,0,0)`, sidebar `rgb(13,13,15)`, thanh trên `rgba(13,13,15,.72)` + blur; `errors []`. `qa/palette436m.js` (390×844, tối bật qua `lhnSettings.sidebarTheme`): đệm 16/16, màu đúng, `errors []`. Ảnh: `shots380/pal436-{light,dark}-{1512,390}.png`.
- Chưa kiểm: cảm giác dùng thật, các hộp thoại ít dùng (Study/PDF), trang Tài liệu mở tệp.

**2026-11-18 | v3.5.433 | Arena.ai Agent sửa:**

- Đệm 2 bên thống nhất: `clamp(16px,3vw,32px)` cho cả 5 route (`#dashboardOverviewView`, `#dashboardDictationView`, `#dashboardHighlightsNotesView`, `#dashboardDocumentsView .dlib`, `#dashboardTrashView`) và cho thanh tiêu đề dùng chung `#dashboardSharedTopbarPortal`; trước đây là 42/42, 42/45, 33,26/33,26, 42/42, 42/42.
- Trước đây: đệm lệch giữa các tab (Ghi chú 33,26px trong khi các tab khác 42px) và thanh tiêu đề có đệm riêng (44px cho Tài liệu) nên mép nội dung không thẳng cột.
- Nhớ vị trí cuộn: `dashboardScrollTargetForView()` giờ hỏi DOM — route nào tự cuộn được thì lấy chính nó, còn lại dùng `#dashboardScroller`; vì vậy Tổng quan/Chép chính tả hết bị lưu sai phần tử cuộn.
- Sửa lỗi tải lại trang làm mất chỗ cuộn của Tài liệu (thư viện dựng muộn): thêm `scheduleDashboardScrollRestore()` thử lại từng khung hình (tối đa ~4s) cho tới khi `scrollTop` đúng.
- Sửa lỗi mở thẳng tab Thùng rác bị trống danh sách: `dashboard-trash.js` nạp sau `dashboard.js` nên `mount()` chưa tồn tại — thêm `mountDashboardTrash()` thử lại 60 nhịp × 30ms.
- Kiểm bằng `qa/sync433.js` (1512×950 và 390×844): 5 tab đệm đúng, 4 tab cuộn 400→400 sau khi đổi tab và sau reload, `errors []`.
- Dọn tài liệu (không đổi code/giao diện): `AGENTS.md` rút 151 → 86 dòng (17.402 → 8.588 ký tự) — mục 3.3/3.4 còn 2 dòng, mục 4.2 gộp mẫu nhật ký thành 1 dòng, mục 4.4 chỉ còn cách đóng ZIP (phần CRX/khoá chuyển sang mục 5 "Không được làm"), mục 4.2.1 còn 1 dòng trỏ, bỏ mục "Đường dẫn" rồi đánh số lại 1–6.
- Tách quy tắc khỏi `AGENTS.md` thành tài liệu thật: tạo `docs/code-rules.md` (tìm file, cây thư mục, nhãn i18n, màu theme, cấm khối vá `/* v3.5.xxx */`, không `legacy`, cách tách file); quy ước viết trang module + cập nhật 2 bảng mục lục chuyển vào `docs/INDEX.md` mục «Quy ước viết trang module»; thêm dòng `code-rules.md` vào bảng mục lục.
- File: `AGENTS.md`, `PROJECT.md`, `docs/INDEX.md`, `docs/code-rules.md` (mới).
- Kiểm tra: đối chiếu từng dòng bị bỏ để không mất quy tắc (mỗi phần rút đều để lại dòng trỏ hoặc sang `docs/`); ZIP dựng lại và so SHA-256 từng tệp với repo — khớp toàn bộ. Không có thay đổi giao diện nên không có ảnh QA mới.

**2026-11-17 | v3.5.432 | Arena.ai Agent sửa:**

- Sửa theo ảnh chụp của người dùng (thư viện mới khác bản cũ ở vài chỗ): dùng **đúng bảng token của trang Tài liệu** thay vì ánh xạ sang `--lhn-ui-*`; thêm `font:14px/1.45` cho khối (Dashboard đặt 12px nên mọi chữ nhỏ hơn); bỏ kiểu nút toàn cục của Dashboard trong phạm vi thư viện (`padding:10px 13px`, chữ 13px/600 làm nút xoá/"Mở" dày và đậm hơn); bổ sung các rule đã thiếu (`.thumb.image*`, `.card .thumb .pg img`, `.card .thumb .pg .fileFallback`, `.imageMeta`, `.fileSelectButton`, `html.dark .hero`) và bỏ gradient xanh tự chế cho ảnh; chặn `html.dark p{…!important}` / `html.dark h1…` của `ui-theme.css` làm chữ trắng trong khối tím bị xám ở chế độ tối; sửa icon mũi tên 18px → 13px (rule `.dlib svg.i` đè `.go svg`).
- Kiểm lại: `qa/diff431.js` so từng phần tử giữa thư viện cũ (`documents.html`) và mới ở sáng + tối — chỉ còn khác bề rộng do Dashboard có sidebar (`.card` 525→416px), còn màu/cỡ chữ/bo góc/viền/khoảng đệm giống hệt; nút "Mở" 89×28 với icon 13px, nút xoá 30×30/icon 15px như cũ; `qa/lib431.js` 1512 và 390 vẫn `errors []`.

**2026-11-17 | v3.5.431 | Arena.ai Agent sửa:**

- Bản 1 của việc đưa Tài liệu về cùng một kiểu UI với các tab khác: **thư viện tài liệu vẽ trong Dashboard** (`js/dashboard/documents-library.js`, `css/dashboard/documents-library.css`), đọc thẳng kho `keepit-documents` như tab Thùng rác; thẻ/lưới/tìm/lọc/sắp xếp/thống kê/"Đọc tiếp"/nút xoá dùng toast chung của Dashboard. Khung iframe **ẩn khi không xem tệp** và chỉ còn nhiệm vụ xem tệp (`html.dash-embedded-library .app{display:none}`), nhận lệnh `KEEPIT_DOCUMENTS_OPEN` / `KEEPIT_DOCUMENTS_IMPORT_FILES` từ Dashboard và trả `KEEPIT_DOCUMENTS_IMPORTED`. CSS thư viện giữ nguyên giá trị gốc nhưng ánh xạ token sang `--lhn-ui-*` trong phạm vi `#dashboardDocumentsView` nên sáng/tối theo Dashboard.
- File: `js/dashboard/documents-library.js` (mới), `css/dashboard/documents-library.css` (mới), `js/dashboard/documents.js`, `js/dashboard/dashboard.js`, `pages/dashboard.html`, `css/dashboard/documents-host.css`, `css/dashboard/documents.css`, `docs/documents.md`, `docs/modules/dashboard.md`, `manifest.json`, `PROJECT.md`.
- Sửa thêm trong cùng bản: `resizeDashboardDocumentsFrame()` bỏ đo chiều cao khi khung ẩn (khung ẩn không có `documentElement` → ném `scrollHeight` null); `qa/smoke431.js` chuyển 7 lượt qua lại các tab, `errors []`.
- Kiểm tra: `qa/lib431.js`, `qa/lib431b.js` 1512×950 và 390×844 — 3 tài liệu trong kho hiện 3 thẻ, `count`/chip/thống kê đúng, thẻ `18px`, viền `#e2e8f0`/nền `#fff` (tối `#2b3a52`/`#111a2b`), nút xoá 30×30 cùng token thẻ Chép chính tả; mở tệp 68/17/21 ms và 50/16/18 ms, khung **không nạp lại** (navigation = 1), viewer phủ toàn màn hình rồi đóng sạch; xoá thẻ → toast Dashboard `<dialog>` "Đã chuyển vào Thùng rác + Hoàn tác" (13px/600, radius 10px, y=66), Ctrl+Z → thẻ trở lại; Thùng rác hiện hàng tài liệu, Khôi phục → thư viện về 3 thẻ; `errors []`. Nhập tệp hiện chuyển File cho khung xử lý (thanh tiến trình native ở Bản 2).
- Tiếp theo: Bản 2 (nhập tệp native + bỏ thư viện trong khung), rồi "Nói" trong Thùng rác.

**2026-11-17 | v3.5.430 | Arena.ai Agent sửa:**

- Toast của khung Tài liệu (xoá tài liệu, khôi phục…) dùng chung toast của Dashboard nên giống các tab khác: `documents.js` gửi `KEEPIT_DOCUMENTS_TOAST` lên trang cha khi nhúng; Dashboard hiện toast của mình và giữ Hoàn tác qua `KEEPIT_DOCUMENTS_TOAST_RUN` trả về khung (nên Ctrl+Z vẫn chạy hành động trong khung).
- File: `js/dashboard/documents.js`, `js/dashboard/dashboard.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/docstoast430.js` 1512×950 và 390×844 — xoá tài liệu trong khung → toast `<dialog>` ở đỉnh Dashboard "Đã chuyển vào Thùng rác + Hoàn tác" (13px/600, radius 10px, cùng phần tử như tab Thùng rác), toast riêng trong khung **không** hiện, thẻ biến mất; Ctrl+Z → thẻ trở lại + toast "Đã đưa lại vào thư viện"; `errors []`.
- Tiếp theo: "Nói" vào Thùng rác.

**2026-11-17 | v3.5.429 | Arena.ai Agent sửa:**

- Sửa nút xoá trên thẻ Chép chính tả cho giống thẻ Tài liệu: 30×30, đứng **trước** nút "Tiếp tục", viền/nền theo token Dashboard (`--lhn-ui-border/surface/muted`) thay cho `--line/--surface/--muted` của khung Tài liệu (biến không tồn tại ở Dashboard nên dark mode ra khung trắng), bỏ rule mobile tự tăng 34px, thêm biến thể tối/hover tối.
- File: `js/dashboard/dashboard.js`, `css/dashboard/dictation.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/dictui429.js` 1512×950 và 390×844 — nút 30×30, thứ tự `last-practiced → cardDel → resume-link`, sáng `#fff/#e2e8f0/#64748b`, tối `#111a2b/#2b3a52/#a4b3c3`; ảnh cắt footer sáng/tối đã đối chiếu; `errors []`.
- Tiếp theo: "Nói" vào Thùng rác.

**2026-11-17 | v3.5.428 | Arena.ai Agent sửa:**

- Chép chính tả vào Thùng rác: mỗi phiên trong `dictation:session-index:v1` có `deletedAt`; phiên bị xoá mềm biến mất khỏi Lịch sử Dictation (kể cả thẻ "Tiếp tục" và thống kê Overview) và hiện trong Thùng rác.
- Thẻ buổi học có nút chuyển vào Thùng rác (giống nút trên thẻ Tài liệu): xác nhận → toast "Đã chuyển vào Thùng rác" + Hoàn tác.
- Thùng rác: hàng mới cho Chép chính tả (icon tai nghe của app, tím-hồng `kind-dictation`), chip "Chép chính tả" đã nối, dòng phụ "host · đã giải / tổng câu · xoá ngày"; khôi phục bỏ `deletedAt`, xoá vĩnh viễn bỏ khỏi chỉ mục và Ctrl+Z chèn lại; dọn tự động sau 30 ngày.
- File: `js/overlay/study/session-index.js`, `js/dashboard/dashboard.js`, `js/dashboard/dashboard-trash.js`, `css/dashboard/trash.css`, `css/dashboard/dictation.css`, `docs/modules/overlay.md`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/dict428.js` 1512×950 và 390×844 — 2 thẻ → xoá 1 còn 1 thẻ + toast; Thùng rác 1 hàng `kind-dictation` "example.com · 4 / 10 câu"; chip lọc 1 hàng; Khôi phục → 0 hàng, `deletedAt 0`, 2 thẻ trở lại; xoá vĩnh viễn → 1 phiên trong chỉ mục, toast + Hoàn tác; Ctrl+Z → 2 phiên; bấm thân thẻ không xoá; `errors []`. `qa/undo424.js` không hồi quy.
- Tiếp theo: "Nói" vào Thùng rác.

**2026-11-17 | v3.5.427 | Arena.ai Agent sửa:**

- Sửa lệch trạng thái chọn trong Thùng rác khi ghi chú được gộp theo trang: `selected` chỉ lưu id bản ghi thật (id ghi chú/tài liệu), không lưu `page:<url>`.
- Ô chọn của hàng trang suy ra từ các ghi chú con: đủ → ✓, một phần → gạch ngang (`indeterminate`), không có → trống; tick/bỏ tick ở hàng trang áp cho mọi ghi chú của trang.
- Bộ đếm "Đã chọn N" và ô "Chọn tất cả" tính theo số ghi chú thật, không theo số hàng.
- Nút Khôi phục/Xoá vĩnh viễn trên hàng trang khi trang đang chọn một phần chỉ tác động các ghi chú đang tick (phương án B người dùng chọn); trang không chọn gì thì tác động cả trang.
- File: `js/dashboard/dashboard-trash.js`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/sel427.js` trên extension unpacked 1512×950 và 390×844 — tick trang → 3 con tick, "Đã chọn 3", Chọn tất cả thành một phần; bỏ tick 1 con → hàng trang gạch ngang, "Đã chọn 2"; bấm Khôi phục trên hàng trang → chỉ 2 ghi chú về Ghi chú, còn 1 trong Thùng rác, toast "Đã khôi phục 2 mục"; Chọn tất cả → ✓; `errors []`.
- Tiếp theo: "Chép chính tả" rồi "Nói" vào Thùng rác.

**2026-11-17 | v3.5.426 | Arena.ai Agent sửa:**

- Hàng gộp ghi chú theo trang dùng **icon web (quả địa cầu)** thay cho icon ghi chú, để phân biệt hàng trang với hàng ghi chú lẻ; path lấy đúng `ICONS.globe` app đang dùng ở thanh Keepit, màu mới `kind-web` (tím `#5a4bd0` / tối `#b9b3ff`).
- File: `js/dashboard/dashboard-trash.js`, `css/dashboard/trash.css`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/trash425.js` 1512×950 — `groupIsWeb true`, `sameAsNote false`, hàng lẻ `kind-note`, hàng trang `kind-web`; hiệu ứng 0→178px, khôi phục 3 mục + toast, Ctrl+Z hoàn tác 1→2 hàng, `errors []`; ảnh sáng/tối đã xem.
- Tiếp theo: "Chép chính tả" rồi "Nói" vào Thùng rác.

**2026-11-17 | v3.5.425 | Arena.ai Agent sửa:**

- Thùng rác: ghi chú của cùng một trang nguồn gộp thành một hàng (`page:<url>`), trang chỉ có 1 ghi chú vẫn là hàng riêng.
- Hàng trang: chevron nằm sau tên trang (trong cột tên, trước 2 nút), bấm vào thân hàng để mở/đóng, chỉ trừ ô chọn và 2 nút Khôi phục/Xoá vĩnh viễn; nút ghi "Khôi phục" (bỏ chữ "cả trang").
- Hiệu ứng mở/thu gọn bằng `max-height` 0,26s + mờ dần + chevron xoay; tôn trọng `prefers-reduced-motion`; `flex: none` để không bị co trong danh sách cuộn ở 390.
- Công tắc "Xem từng ghi chú" (`#trashExpandAll`, dùng `.settings-switch` sẵn có) mở/đóng tất cả hàng trang, chỉ hiện khi có hàng trang.
- Icon hàng trang lấy `kindOf()` của chính ghi chú (giống icon ghi chú trong app), không thêm icon riêng.
- Hàng trang đại diện nhiều bản ghi: Khôi phục / Xoá vĩnh viễn / chọn tất cả / hoàn tác đều mở rộng ra id ghi chú thật; "Chọn tất cả" bỏ qua hàng con.
- File: `js/dashboard/dashboard-trash.js`, `css/dashboard/trash.css`, `pages/dashboard.html`, `js/core/languages.js` (en/vi/ko: trashRestorePage, trashPageNotes, trashExpandNotes, trashCollapseNotes, trashShowAllNotes), `manifest.json`, `PROJECT.md`.
- Kiểm tra: `qa/trash425.js` trên extension unpacked 1512×950 và 390×844 — icon trùng hàng ghi chú (`sameAsNote true`), chevron `gapPx 6` / trong cột tên, mở 0→178px (1512) và 0→436px (390) rồi `maxHeight none`, đóng về 0, ô chọn không mở hàng, công tắc mở 3 ghi chú, "Khôi phục" 3 mục quay lại Ghi chú với toast, xoá vĩnh viễn cả trang + Ctrl+Z hoàn tác 1→2 hàng, `errors []`; `qa/undo424.js` vẫn đạt (không hồi quy).
- Tiếp theo: "Chép chính tả" rồi "Nói" vào Thùng rác.

**2026-11-17 | v3.5.424 | Arena.ai Agent sửa:**

- Bốn yêu cầu của người dùng: (1) **xoá vĩnh viễn cũng có Hoàn tác**, (2) **khôi phục cũng có toast**, (3) **Ctrl+Z = hoàn tác**, (4) đổi tên mục **"Tô sáng & Ghi chú" → "Ghi chú"**.
- (1) `purgeForever()` trong Thùng rác đọc trước khi xoá: Tài liệu giữ `meta` + blob trong `files` + `translations`; Ghi chú giữ nguyên bản ghi (cùng `id`, `review`, anchor). Xoá xong hiện toast "Đã xoá vĩnh viễn {count} mục" + **Hoàn tác** (6s) → ghi lại đúng bản ghi cũ vào Thùng rác (không phải về thư viện), `deletedAt` còn nguyên. Áp dụng cho xoá lẻ, xoá nhiều (đã chọn) và **Dọn sạch thùng rác**. Ghi chú được ghi lại qua message mới `TRASH_NOTES_INSERT` (`ANNOTATIONS.putMany`) để không mở IndexedDB của background từ dashboard (luật v3.5.406).
- (2) Khôi phục từ Thùng rác giờ báo toast "Đã khôi phục {count} mục" (trước đây im lặng), kèm đọc lại dung lượng trống.
- (3) Ctrl+Z (và Cmd+Z trên macOS) chạy đúng hành động Hoàn tác đang hiện trên toast: `KeepitUndo` trong `dashboard.js`, đăng ký tự động mỗi khi toast có action, hết 6s thì huỷ; bỏ qua khi con trỏ đang ở input/textarea/contenteditable, bỏ qua Ctrl+Shift+Z. Khung Tài liệu (iframe) đăng ký và tự xử lý Ctrl+Z trong frame nên phím chạy cả khi focus nằm trong Tài liệu.
- (4) `ovMenuHighlightsNotes` đổi thành **Ghi chú / Notes / 메모** (nav, breadcrumb, aria-label, tiêu đề trang H&N, ô Bắt đầu nhanh); 2 chỗ chữ tĩnh trong HTML cũng cập nhật.
- File: `js/dashboard/dashboard.js` (`KeepitUndo`, `registerUndo/runPendingUndo`, keydown Ctrl+Z, toast đăng ký undo), `js/dashboard/documents.js` (đăng ký undo với parent + Ctrl+Z trong frame), `js/dashboard/dashboard-trash.js` (`purgeForever`, `snapshotDocument`/`restoreDocument`, toast khôi phục, đọc lại quota), `js/background/annotations.js` (`putMany`), `js/background/background.js` (`TRASH_NOTES_INSERT`), `js/core/languages.js` (`trashPurgeDone`, `trashPurgeUndone`, `trashRestoreDone`, đổi tên mục), `pages/dashboard.html`, `pages/highlights-notes.html`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512×950 và 390×844 (vi) — xoá vĩnh viễn 1 Tài liệu: toast "Đã xoá vĩnh viễn 1 mục" + Hoàn tác (`hit:"toastAction"`, bấm chuột thật) → hàng về lại Thùng rác, blob 4096 byte trong `files` được ghi lại (`hasBlob:true`); xoá vĩnh viễn lần nữa rồi **Ctrl+Z** → 1 → 2 hàng; khôi phục 1 mục → toast "Đã khôi phục 1 mục"; xoá ghi chú ở màn Ghi chú rồi Ctrl+Z → 2 → 1 → 2, toast "Đã đưa lại ghi chú"; xoá tệp trong khung Tài liệu rồi Ctrl+Z trong frame → 0 → 1 thẻ; nhãn nav và aria = "Ghi chú"; 0 lỗi console. Ảnh: `undo424-1512-{trash,purge-toast,purge-undo,restore-toast,doc-ctrlz}.png`, `undo424-390-*.png`.
- Chưa làm: gộp Ghi chú trong Thùng rác theo **trang nguồn** (đang bàn, xem mục 2).
- Tiếp theo: gộp/khôi phục theo trang cho Ghi chú, rồi nối **Chép chính tả** và **Nói** vào Thùng rác.

**2026-11-17 | v3.5.423 | Arena.ai Agent sửa:**

- Phần 2 của việc "triển khai Thùng rác vào app": **Ghi chú (tô sáng/annotation) vào cùng Thùng rác**, xoá mềm 30 ngày như Tài liệu. Bản ghi thêm `deletedAt`; mọi đường đọc (`GET_ALL`, `GET_BATCH`, `GET_PAGE`) đều ẩn bản ghi đã xoá, nên H&N, Flashcards, Tổng quan, JSON backup và tô sáng trên trang web tự động không thấy mục trong Thùng rác.
- Xoá ghi chú giờ là **chuyển vào Thùng rác**: toast có nút **Hoàn tác** (bấm là khôi phục đúng bản ghi + vẽ lại tô sáng trên tab đang mở qua `RESTORE_HIGHLIGHTS`), giữ 6s. Áp dụng cho nút xoá trên card H&N, "Xoá tất cả tô sáng trên trang này", và nút xoá trong tooltip/sidebar trên trang web (cùng message `DELETE`). Bỏ tim một từ trong từ điển vẫn xoá hẳn (`hard:true`) vì đó là bật/tắt, không phải xoá.
- Thùng rác nhận thêm loại **Ghi chú**: cùng một danh sách, icon giấy bút màu hổ phách, dòng phụ `tên miền · ghi chú · thêm ngày · xoá ngày`, tìm kiếm theo cả quote/nội dung; chip "Ghi chú" hiện số thật thay vì "sắp có"; khôi phục/xoá vĩnh viễn/Chọn tất cả/Dọn sạch đều chạy đúng theo từng loại (Tài liệu đi thẳng IndexedDB, Ghi chú đi qua message tới background — đúng luật v3.5.406).
- Sweep khi mở app dọn cả ghi chú quá 30 ngày (`TRASH_NOTES_SWEEP`), không chỉ Tài liệu.
- Sửa kèm 1 lỗi thật phát hiện khi kiểm tra: toast của dashboard là `<dialog>` **non-modal** nên không nằm ở top layer — nó bị thanh topbar sticky (z-index 30) che và nút Hoàn tác **không bấm được** (elementFromPoint trả về topbar). Đã cho `dialog#toast` `z-index:2147483000` và hạ xuống dưới topbar (`top:66px`); toast cũng không còn cướp focus (dialog tự focus nút → hiện viền focus).
- Màu: light toast trắng chữ đậm + nút `#4338ca`; dark toast `#172338` chữ sáng + nút `#c7d2fe` (bản đầu để `#4338ca` trên nền tối, đo được độ tương phản ~1.6:1 — không đọc được).
- File: `js/background/annotations.js` (softDelete/softDeletePage/listTrashed/restoreMany/purgeMany/purgeExpiredTrashed + lọc `deletedAt`), `js/background/background.js` (`DELETE` xoá mềm, `DELETE_PAGE` xoá mềm, `TRASH_NOTES_LIST/RESTORE/PURGE/SWEEP`), `js/dashboard/dashboard.js` (toast có action, `restoreTrashedNotes`, broadcast `RESTORE_HIGHLIGHTS`, focus không bị cướp), `js/dashboard/dashboard-trash.js` (loại Ghi chú, phân loại khôi phục/xoá), `css/dashboard/dashboard.css` (`.toastAction`, z-index/toạ độ toast), `css/dashboard/trash.css` (icon `kind-note`), `js/core/languages.js` (`trashUndo`, `noteMovedToTrash`, `noteRestored`, `notesRestored`, `noteRestoreFailed` en/vi/ko; sửa lời xác nhận xoá thành "chuyển vào Thùng rác, khôi phục được trong 30 ngày"), `js/content/content.js` (bỏ tim từ điển = xoá hẳn), `manifest.json`.
- Kiểm tra: Playwright extension thật 1512×950 và 390×844 (vi) — bấm nút xoá thật trên card H&N: toast "Đã chuyển ghi chú vào Thùng rác" + "Hoàn tác", `pointer-events:auto`, `actionHit:"toastAction"` (bấm chuột thật vào nút → ghi chú về lại, toast "Đã đưa lại ghi chú"); H&N/tổng quan tụt 2→1 rồi về 2; Thùng rác hiện hàng `kind-note`, chip `Ghi chú 1`, tổng `1 mục · 0 KB …`; khôi phục/xoá vĩnh viễn/Chọn tất cả đều đúng; "Xoá tất cả tô sáng trên trang này" → toast "Đã xóa 1 tô sáng trên trang này" + Hoàn tác → "Đã đưa lại 1 ghi chú"; ghi chú có `deletedAt` cách 40 ngày bị sweep dọn khi mở app (`inTrashBefore:true → inTrashAfter:false`, sweep trả 1) và ẩn khỏi thư viện; light: toast trắng/chữ `rgb(51,65,85)`/nút `rgb(67,56,202)`, dark: `rgb(23,35,56)`/`rgb(237,242,251)`/`rgb(199,210,254)`; toast `top:66 > topbarBottom 55` (390: 66 > 58). Ảnh: `notes423-1512-{toast,toast-dark,undo,trash,trash-dark,trash-notes-chip}.png`, `notes423-390-{toast,trash}.png`. Lỗi console duy nhất là 404 favicon của `example.com` (dữ liệu giả trong test), không phải lỗi code.
- Chưa test: xoá/khôi phục ghi chú **trên một trang web thật** (tooltip/sidebar content script) — cùng message `DELETE`/`RESTORE_HIGHLIGHTS` đã kiểm ở phía background nhưng chưa bấm trên trang sống.
- Tiếp theo: nối **Chép chính tả** vào Thùng rác (v3.5.424), rồi **Nói**.

**2026-11-17 | v3.5.422 | Arena.ai Agent sửa:**

- Lỗi người dùng báo (2 ảnh crop): toast sau khi xoá tệp bị **chìm/nửa trong suốt, không đọc được chữ**. Nguyên nhân thật: `toast()` trong `js/dashboard/documents.js` **luôn** gán `el.style.top = 74px` bằng inline style, kể cả khi viewer đóng — inline style đè hết mọi rule responsive trong CSS (`.toast{top:118px}`, `top:148px`, `html.dash-embedded .toast{top:calc(var(--dash-vp-top) + 18px)}`), nên toast rơi vào đúng dải hero/dưới topbar và bị nền + hiệu ứng che mờ.
- Sửa: chỉ gán inline `top` khi `#viewer` đang `show` (toast phải nằm trên viewer toolbar); khi viewer đóng thì `el.style.top = ''` để CSS tự quyết theo breakpoint/theme.
- Lỗi thứ hai cùng ảnh: ở dark mode toast là **chip sáng**, nên nút "Hoàn tác" dùng màu ice-blue (`#c7d2fe`) gần như tàng hình — thêm `html.dark .toastAction{color:#4338ca}` + `:hover{color:#312e81}`.
- File: `js/dashboard/documents.js`, `css/dashboard/documents.css`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512×950 và 390×844 (vi), light + dark, mỗi lần bấm xoá thật trong màn Tài liệu rồi đo rect toast trong frame + rect topbar ở page: 1512 → `toastTop 93 / toastBottom 131 / topbarBottom 78 / overlapsTopbar false`; 390 → `toastTop 90 / toastBottom 146 / topbarBottom 82 / overlapsTopbar false`; `position:fixed`, `z-index 94`; light toast `rgb(31,36,51)` + chữ trắng + action `rgb(199,210,254)`; dark toast `rgb(232,237,246)` + chữ `rgb(17,26,43)` + action `rgb(67,56,202)`; 0 lỗi console. Ảnh: `toast422-1512-light.png`, `toast422-1512-dark.png`, `toast422-390-light.png`, `toast422-390-dark.png`.
- Lưu ý QA: harness `qa/toast422.js` ở 390 thêm class `dark` thủ công vào page nên phải gọi luôn `syncDashboardDocumentsTheme()` (như nút đổi theme thật) thì iframe Tài liệu mới nhận dark; trước khi vá, bước dark ở 390 đo nhầm theme sáng.
- Tiếp theo: nối Ghi chú vào cùng Thùng rác (v3.5.423), rồi Chép chính tả, Nói.

**2026-11-17 | v3.5.421 | Arena.ai Agent sửa:**

- Tóm tắt (phần 1 của việc "triển khai Thùng rác vào app", hoàn thiện phía Tài liệu): (1) toast sau khi xoá có nút **Hoàn tác** — bấm là `Store.restore(id)` đưa tệp lại thư viện, toast đổi thành "Đã đưa lại vào thư viện", thời gian hiện 6s thay vì 2.2s; (2) **tự dọn khi mở app**: `dashboard.js` gọi `KeepitTrash.sweep()` (tức `purgeExpired`) 1.2s sau khi dashboard load, không phải chỉ khi mở route Thùng rác; (3) dòng tổng của Thùng rác hiện **dung lượng trống thật** đo bằng `navigator.storage.estimate()`; (4) số đếm chip lấy từ cùng dữ liệu `meta` sau mỗi lần khôi phục/xoá (đã kiểm).
- File: `js/dashboard/documents.js` (toast có action + `moveToTrash`), `css/dashboard/documents.css` (`.toast.hasAction`, `.toastAction`), `js/dashboard/dashboard-trash.js` (`readQuota`, `trashFree`, export `sweep`), `js/dashboard/dashboard.js` (gọi sweep khi mở app), `js/core/languages.js` (`docs_trashUndo`, `docs_trashRestored`, `trashFree` en/vi/ko), `manifest.json`.
- Kiểm tra: Playwright extension thật 1512 + 390 (vi) — bản ghi xoá cách đây 40 ngày **bị dọn ngay khi mở app** (không mở Thùng rác): `beforeReload [u0,u1,u9]` → `afterReload [u0,u1]`; xoá tệp trong thư viện hiện toast "Đã chuyển vào Thùng rác" + nút "Hoàn tác", `pointer-events:auto`, bấm Hoàn tác → thẻ về lại thư viện (2 thẻ), toast "Đã đưa lại vào thư viện", `meta` không đổi; dòng tổng Thùng rác ra "0 mục · 0 KB — giữ 30 ngày rồi xoá vĩnh viễn · còn trống 722.4 MB" khớp `navigator.storage.estimate()`; 0 lỗi console. Ảnh: `undo421-1512-toast.png`, `undo421-390-toast.png`, `undo421-1512-trash-summary.png`, `undo421-390-trash-summary.png`.
- Tiếp theo: nối Ghi chú → Chép chính tả → Nói vào cùng Thùng rác (mỗi loại một version).

**2026-11-17 | v3.5.420 | Arena.ai Agent sửa:**

- Nhãn "Giao diện tối" ở dark mode sáng hơn/xỉn khác "Thùng rác": đo được `Thùng rác` = `rgb(156,163,175)` còn `Giao diện tối` = `rgb(71,85,105)` — nút footer dùng `.reference-footer-button{color:#475569}` mà **không có biến thể `html.dark`**, trong khi mục nav (Thùng rác) lấy màu `#9ca3af` của nav-item dark. Light mode vốn đã trùng nhau (`#475569` cả hai).
- Sửa: thêm `html.dark #dashboardSidebar .reference-footer-button { color: #9ca3af; }` trong `css/dashboard/trash.css`, để nhãn nút giao diện/tài khoản cùng màu nav-item ở dark.
- File: `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512, không hover (chuột đỗ ở 700,500) — light: cả hai `rgb(71,85,105)`, `lightSame: true`; dark: cả hai `rgb(156,163,175)`, `darkSame: true`; hover cả hai `rgb(243,244,246)`, `hoverSame: true`; icon hai mục cùng `rgb(99,102,241)`; tên "Bạn" vẫn `rgb(229,231,235)`, email `rgb(156,163,175)` (không đổi); 0 lỗi console. Ảnh: `side420-light.png`, `side420-dark.png`, `side420-dark-hover-trash.png`, `side420-dark-hover-theme.png`.

**2026-11-17 | v3.5.419 | Arena.ai Agent sửa:**

- Tóm tắt: viết lại mục 1 "Giới thiệu dự án" trong `AGENTS.md` theo bản B đã chốt — tách rõ nền tảng đang có (extension MV3 cho Chromium + Firefox, một codebase) khỏi bản APK Android đóng gói riêng và iOS dự kiến, kèm câu "code dùng chung, khác biệt nằm ở script build, không fork codebase".
- Không đổi code extension.
- File: `AGENTS.md`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: đọc lại mục 1 sau khi ghi (3 bullet, đúng bản B); ZIP v3.5.419 đóng từ HEAD có `AGENTS.md` + `PROJECT.md` mới nhất. Không có thay đổi giao diện nên không có ảnh QA mới.

**2026-11-17 | v3.5.418 | Arena.ai Agent sửa:**

- Bỏ hiệu ứng hover riêng của "Bỏ chọn" (`#4338b8`): nhãn "Chọn tất cả" và "Đã chọn N" không đổi màu khi hover, nên "Bỏ chọn" cũng không được đổi. Xoá `.trashBulk #trashClearSel:hover`, chỉ còn `cursor:pointer` như `.trash-selectall`.
- File: `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512 + 390 (vi) — `clearHoverUnchanged: true`, `selectAllHoverUnchanged: true`, `clearMatchesSelectAllAtRest: true`, `clearMatchesSelectAllWhileHovered: true`; `grep -c "trashClearSel:hover"` = 0; màu `rgb(90,75,208)` ở cả trạng thái thường và khi hover cho cả 3 phần tử; 0 lỗi console. Ảnh khi hover: `hover418-1512-clear.png`, `hover418-1512-selectall.png`, `hover418-390-clear.png`.

**2026-11-17 | v3.5.417 | Arena.ai Agent sửa:**

- Tóm tắt: người dùng chỉ ra mình đoán thay vì hỏi khi yêu cầu về hình thức mơ hồ (nút "Bỏ chọn" phải sửa 3 lần mới đúng). Thêm 3 quy tắc vào `AGENTS.md` mục 4.3: (1) yêu cầu hình thức hiểu nhiều cách thì hỏi lại kèm 2–3 phương án trước khi sửa; (2) ảnh chụp người dùng gửi là đặc tả, chỉ so với đúng phần tử có trong ảnh, không suy từ chỗ khác; (3) thay đổi nhỏ vẫn phải đúng ngay lần đầu.
- Không đổi code extension.
- File: `AGENTS.md`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: đọc lại 3 bullet trong mục 4.3 sau khi ghi; ZIP v3.5.417 đóng từ HEAD có `AGENTS.md` + `PROJECT.md` mới nhất. Không có thay đổi giao diện nên không có ảnh QA mới cho version này.

**2026-11-17 | v3.5.416 | Arena.ai Agent sửa:**

- Sửa đúng ý người dùng sau 2 lần hiểu sai: "Bỏ chọn" phải là **chữ giống "Chọn tất cả" / "Đã chọn N"** trong thanh chọn, không phải link gạch chân (v3.5.414) và cũng không phải nút khung (v3.5.415). Mình đã đọc "2 nút kia" thành 2 nút hành động thay vì nhìn ảnh chụp — lỗi đọc ảnh, không phải lỗi CSS.
- Hiện tại: `<button class="trash-clearsel" id="trashClearSel">` đứng ngay sau `#trashBulkCount`, `font:inherit`, 12.5px, weight 600, màu `#5a4bd0`, không viền/nền/gạch chân; chỉ khác ở `cursor:pointer` và hover `#4338b8`.
- File: `pages/dashboard.html`, `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: đo `getComputedStyle` trên extension thật — cả light và dark, `font-family/font-size/font-weight/color/letter-spacing/text-decoration` của "Bỏ chọn" **trùng từng thuộc tính** với nhãn "Chọn tất cả" (`lightSameAsSelectAll: true`, `darkSameAsSelectAll: true`, màu `rgb(90,75,208)` cả hai theme). Bấm: `hidden=true`, đếm rỗng, 0 dòng picked, `selectAll.checked=false`, Khôi phục disabled. 390: 3 mục vẫn 1 hàng, không tràn. 0 lỗi console. Ảnh: `text416-1512-light.png`, `text416-1512-dark.png`, `text416-390-light.png`.

**2026-11-17 | v3.5.415 | Arena.ai Agent sửa:**

- Sửa lỗi mình gây ở v3.5.414: nút "Bỏ chọn" bị làm thành link gạch chân, không giống các nút khác. Giờ dùng đúng `.trash-action` (cao 32px, bo 10px, viền 1px, chữ 12.5px/600) và nằm trong nhóm `.trash-bulk-actions` — thứ tự `Bỏ chọn · Khôi phục · Xoá vĩnh viễn`, cùng hàng ở 1512 và chia 3 cột đều ở 390.
- Bỏ hết CSS `.trash-clearsel` và biến thể dark của nó; chỉ giữ `.trash-action[hidden]` để ẩn khi chưa chọn gì.
- File: `pages/dashboard.html`, `css/dashboard/trash.css`, `manifest.json`.
- Kiểm tra: Playwright extension thật 1512 + 390 (vi) — nút có class `trash-action`, cùng `.trash-bulk-actions` với 2 nút kia, cùng `top`, kích thước/bo góc/font/padding giống nút Khôi phục (khác màu vì Khôi phục là biến thể `primary`), thứ tự trái→phải đúng; bấm xoá lựa chọn: `hidden=true`, đếm rỗng, 0 dòng picked, `selectAll.checked=false`, nút Khôi phục disabled; text "Xoá vĩnh viễn" không bị cắt ở 390; 0 lỗi console. Ảnh: `clear415-1512-bulkrow.png`, `clear415-1512-dark.png`, `clear415-390-selected.png`.

**2026-11-17 | v3.5.414 | Arena.ai Agent sửa:**

- Thêm nút **Bỏ chọn** ngay sau "Đã chọn N" trong thanh chọn (cùng hàng Chọn tất cả / Khôi phục / Xoá vĩnh viễn), kiểu link gạch chân màu tím như Gmail; chỉ hiện khi đang có mục được chọn.
- Bấm sẽ xoá toàn bộ lựa chọn và render lại: đếm về rỗng, nút Khôi phục/Xoá vĩnh viễn disable lại, ô "Chọn tất cả" bỏ tích, chính nút Bỏ chọn tự ẩn.
- File: `pages/dashboard.html`, `js/dashboard/dashboard-trash.js` (`syncBulkBar` + handler `#trashClearSel`), `js/core/languages.js` (`trashClearSel` en/vi/ko), `css/dashboard/trash.css` (light + dark).
- Kiểm tra: `node --check` hai file JS; Playwright trên extension thật 1512 + 390 (vi) — chọn 2 dòng → nút hiện, cách "Đã chọn 2" 12px, nằm trong thanh chọn; bấm → `hidden=true`, đếm rỗng, 0 dòng `is-picked`, `selectAll.checked=false`, nút Khôi phục `disabled=true`; 0 lỗi console. Ảnh: `clear414-1512-bulkrow.png`, `clear414-1512-dark.png`, `clear414-390-selected.png`.

**2026-11-17 | v3.5.413 | Arena.ai Agent sửa:**

- Tóm tắt: thêm mục **4.4** vào `AGENTS.md` buộc kiểm thử giao diện bằng ảnh chụp từ extension thật — mở extension unpacked dưới `xvfb-run` với profile mới, seed IndexedDB trong iframe của route sau khi route mở, assert bằng `getComputedStyle`/`getBoundingClientRect()`/`scrollTop`, tối thiểu 4 ảnh 1512 và 390 cho light + dark (dark bật bằng nút thật), chi tiết nhỏ phải phóng 4×, `console.error`/`pageerror` phải rỗng, báo cáo tách rõ phần đã xác minh và phần chưa kiểm được. Bổ sung 2 bullet ở mục 7 về vị trí harness `/home/user/qa/README.md` và việc sandbox không có khoá `.pem` nên chỉ đóng ZIP.
- Không đổi code extension; chỉ đổi tài liệu quy tắc.
- File: `AGENTS.md`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: đọc lại mục 4.4 và mục 7 sau khi ghi; ZIP v3.5.413 đóng từ HEAD có `AGENTS.md` + `PROJECT.md` mới nhất, `manifest.json` = 3.5.413, không kèm `.git`. Không chạy lại Playwright vì không có thay đổi giao diện nên version này không có ảnh mới — đúng phạm vi sửa quy tắc.
- Lưu ý: chưa tạo CRX vì sandbox không có khoá ký (`/home/user/Keepit-key` rỗng).

**2026-11-17 | v3.5.412 | Arena.ai Agent sửa:**

- Thu nhỏ dấu tích trong ô chọn: từ 5×10px viền 2px xuống 4×7px viền 1.6px, canh giữa bằng `translate(-50%,-52%)` trên ô 18×18 (trước đây dùng `left/top` tuyệt đối nên lệch tâm). Gạch ngang của trạng thái chọn một phần cũng thu còn 8×0, viền 1.6px, canh giữa.
- Kiểm tra ảnh chụp phóng 4× (`box412-zoom-row.png`, `box412-zoom-all.png`) và ảnh 1× (`box412-1512-selected.png`): dấu chiếm khoảng 40% chiều rộng ô ở 4×, không còn dày như v3.5.411; 0 lỗi console khi test lại 1512.

**2026-11-17 | v3.5.411 | Arena.ai Agent sửa:**

- Thanh phân trang chuyển từ đáy danh sách lên **góc phải trên**, cùng hàng với dãy chip (`1–20 trong số 47` + nút trước/sau). Đo ở 1512: nằm trong `.trash-filters`, sát phải, ngay trên danh sách; ở 390 chip xuống 2 dòng và thanh trang tự xuống dòng riêng, canh phải.
- Ô chọn thống nhất một kiểu: "Chọn tất cả" và checkbox từng dòng dùng chung `.trash-box` 18×18, bo 5px, **có dấu tích trắng** khi chọn; trạng thái chọn một phần hiện gạch ngang (indeterminate) thay vì ô vuông đặc như trước. Đo: hai ô cùng 18×18, nền khi chọn `rgb(114,98,223)`, tick `border-right 2px`.
- Sửa lỗi bố cục: `#dashboardTrashView .trash-chips { flex: 0 0 auto }` cũ chặn dãy chip wrap ở 390 (chip bị cắt), đổi sang cho `.trash-filters` giữ `flex:0 0 auto`.
- Browser-test extension thật 1512 + 390 (vi), 47 mục: 20/20/7, chọn tất cả 20 dòng, 0 lỗi console.

**2026-11-17 | v3.5.410 | Arena.ai Agent sửa:**

- Thùng rác thành layout kiểu hộp thư: tiêu đề, ô tìm, bộ lọc thời gian, chip và thanh chọn giữ cố định; chỉ vùng danh sách cuộn (`#dashboardTrashView` flex column, `.trash-list` `overflow-y:auto`), `#dashboardScroller` không cuộn khi ở route này. Đo ở 1512: cuộn danh sách 620px thì `.trash-head` vẫn ở y=75 và topbar y=0, `#dashboardScroller.scrollTop` = 0.
- Phân trang 20 dòng/trang, chỉ dựng DOM của trang hiện tại (47 mục → 20 node), thanh trang dưới danh sách: `1–20 trong số 47`, nút trước/sau tự disable ở đầu/cuối; đổi từ khoá, chip hoặc bộ lọc thời gian thì về trang 1; xoá/khôi phục tự kẹp lại số trang. "Chọn tất cả" chọn theo trang hiện tại (Gmail), không chọn xuyên trang.
- Sidebar: bỏ dải kẻ mình tự thêm (`.reference-nav-sep`) — Thùng rác nằm ngay dưới đường kẻ chung của footer, trên nút Giao diện và tài khoản.
- Browser-test extension thật 1512 + 390 (vi): 47 mục → 20/20/7, tìm "Tai lieu 4" → `1–8 trong số 8`, chọn tất cả → 20 dòng được chọn, 0 lỗi console.

**2026-11-17 | v3.5.409 | Arena.ai Agent sửa:**

- Sửa mốc của bộ lọc thời gian trong Thùng rác: lọc theo **ngày tệp được thêm vào Keepit** (`meta.imported`) thay vì ngày xoá. Ngày xoá chỉ trải 30 ngày nên không chia được mốc tháng/năm, còn ngày xoá vẫn hiện sẵn trên từng dòng.
- Preset trở lại đúng danh sách Gmail: `Mọi lúc / Hơn 1 tuần trước / Hơn 1 tháng trước / Hơn 6 tháng trước / Hơn 1 năm trước / Phạm vi tuỳ chỉnh...` (bỏ các mốc tạm 3 ngày / 2 tuần của v3.5.408). Aria của nút đổi thành "Ngày thêm tệp".
- Mỗi dòng thêm mốc `thêm <ngày>` trước `xoá <ngày>` để thấy ngay bộ lọc đang so cái gì.
- Browser-test extension thật ở 1512 và 390 (vi) với dữ liệu cố ý lệch: thêm 2/10/45/200/400/500 ngày trước, xoá 0/1/4/9/18/26 ngày trước → 1 tuần: 5 dòng, 1 tháng: 4, 6 tháng: 3, 1 năm: 2 (gồm tệp thêm 400 ngày trước nhưng mới xoá 18 ngày trước), tuỳ chỉnh 450–150 ngày: 2 dòng, `Xoá lọc` về 6 dòng; 0 lỗi console.

**2026-11-17 | v3.5.408 | Arena.ai Agent sửa:**

- Thùng rác có bộ lọc thời gian xoá dạng menu giống Gmail: `Mọi lúc / Hơn 3 ngày trước / Hơn 1 tuần trước / Hơn 2 tuần trước / Phạm vi tuỳ chỉnh...`. Preset là tuổi xoá tương đối (đúng với hạn lưu 30 ngày), không copy các mốc 6 tháng/1 năm của Gmail vì thùng rác không giữ tới mốc đó.
- `Phạm vi tuỳ chỉnh` mở hai ô `Từ ngày` / `Đến ngày` (`input type=date`, mốc ngày địa phương) + `Áp dụng` / `Xoá lọc`. Nút lọc đổi nhãn thành khoảng ngày khi áp dụng và chỉ tô màu "đang lọc" khi thật sự có tác dụng.
- Dòng tổng đổi thành `Hiển thị 2/6 mục · 11.9 MB — giữ 30 ngày rồi xoá vĩnh viễn` khi có lọc; dòng bị lọc ẩn cũng tự bỏ khỏi danh sách chọn. Menu đóng bằng click ngoài hoặc Esc.
- Browser-test extension thật ở 1512 và 390 (vi): 6 mục, preset 1 tuần còn 3 dòng, tuỳ chỉnh 06/11–16/11 còn 2 dòng, `Xoá lọc` về 6 dòng, lọc + tìm kiếm cùng lúc còn 1 dòng, chọn 1 rồi lọc 2 tuần thì bỏ chọn; 0 lỗi console.

**2026-11-17 | v3.5.407 | Arena.ai Agent sửa:**

- Thùng rác có thêm: ô **tìm kiếm** theo tên, nút **Dọn sạch thùng rác** (có xác nhận, xoá `meta`+`files`+`translations`), **chọn nhiều** (checkbox từng dòng + Chọn tất cả, thanh hành động Khôi phục / Xoá vĩnh viễn chỉ bật khi đã chọn), và **nhóm theo ngày** (Hôm nay / Hôm qua / Tuần này / Trước đó).
- Không thêm bộ lọc nâng cao kiểu Gmail (`Từ`, `Chứa tệp đính kèm`, `Chưa đọc`) và không phân trang: thùng rác chỉ giữ 30 ngày, chỉ có 4 loại tệp.
- File: `manifest.json`, `pages/dashboard.html`, `css/dashboard/trash.css`, `js/dashboard/dashboard-trash.js`, `js/core/languages.js`, `PROJECT.md`.
- Kiểm tra (Chromium thật, 1512 + 390): 5 mục chia đúng 4 nhóm ngày; tìm "minutes" → còn 1 dòng; Chọn tất cả + Khôi phục → thùng rác trống và thư viện có lại 5 card; Dọn sạch → 0 dòng, `files` trống trong IndexedDB, nút tự disable; lọc chéo giữa chip/tìm kiếm tự bỏ chọn mục không còn hiển thị; 0 lỗi console.

**2026-11-17 | v3.5.406 | Arena.ai Agent sửa:**

- Chuyển mục **Thùng rác** xuống sát đáy sidebar (ngay trên "Giao diện / Tài khoản"), tách bằng đường kẻ, thay vì nằm trong nhóm điều hướng chính.
- Sửa lỗi nặng: Thùng rác mở IndexedDB `keepit-documents` với version trước khi trang Tài liệu kịp tạo store → trên profile mới, DB bị tạo rỗng và `onupgradeneeded` của thư viện vĩnh viễn không chạy. Nay chỉ mở DB nếu đã tồn tại và có store `meta`; nếu chưa có thì coi như thùng rác trống, không tạo DB.
- Tổng dung lượng hiện `0 KB` khi thùng rác trống (trước đó làm tròn thành 1 KB).
- File: `manifest.json`, `pages/dashboard.html`, `css/dashboard/trash.css`, `js/dashboard/dashboard-trash.js`, `PROJECT.md`.
- Kiểm tra (profile mới, Chromium thật): mở Thùng rác trước → không tạo DB, hiện "0 mục · 0 KB"; sau đó mở Tài liệu → DB có đủ 4 store; xoá 1 tài liệu → hiện trong Thùng rác; mục Thùng rác ở y 797–837, nút Giao diện ở 858–898 (đúng sát đáy); 0 lỗi console.

**2026-11-17 | v3.5.405 | Arena.ai Agent sửa:**

- Thùng rác: mỗi dòng dùng icon theo loại tệp như thẻ trong thư viện — PDF đỏ, Word xanh dương, PowerPoint cam, Ảnh xanh lá (có bản dark), thay cho icon thùng rác chung.
- Dòng mô tả đổi sang nhãn loại thật (`PDF · 10 trang · 5,4 MB · xoá 18/11/2026`), sửa lỗi thiếu dấu `·`; ảnh không hiện số trang.
- File: `manifest.json`, `js/dashboard/dashboard-trash.js`, `css/dashboard/trash.css`, `PROJECT.md`.
- Kiểm tra: 4 loại tệp hiển thị đúng nhãn/icon ở light + dark, 0 lỗi console.

**2026-11-17 | v3.5.404 | Arena.ai Agent sửa (demo Thùng rác):**

- Thêm route **Thùng rác** dưới nhóm điều hướng chính (tách bằng đường kẻ), dùng chung `#dashboardSharedTopbar` và `#dashboardScroller` như 4 tab kia.
- Tài liệu: lần đầu có chức năng xoá. Nút thùng rác trên mỗi card → xoá mềm (`deletedAt` trên `meta`, byte vẫn giữ), thư viện lọc bỏ mục đã xoá. Thùng rác liệt kê tên, loại, số trang, dung lượng, ngày xoá, "còn N ngày", nút Khôi phục / Xoá vĩnh viễn; tổng số mục + dung lượng ở đầu trang.
- Xoá vĩnh viễn xoá `meta` + `files` + `translations`, **giữ `notes`**; purge lười khi mở Thùng rác (mục quá 30 ngày) thay vì hẹn giờ nền.
- Chip lọc `Tất cả / Tài liệu / Ghi chú / Chép chính tả / Nói`: chỉ Tài liệu đã nối; 3 loại còn lại hiện "sắp có" để không hứa tính năng chưa có.
- File: `manifest.json`, `pages/dashboard.html`, `css/dashboard/trash.css` (mới), `css/dashboard/documents.css`, `js/dashboard/dashboard-trash.js` (mới), `js/dashboard/dashboard.js`, `js/dashboard/documents.js`, `js/dashboard/documents-store.js`, `js/core/languages.js`, `PROJECT.md`.
- Kiểm tra (Chromium thật, dữ liệu seed vào IndexedDB chỉ trong test): xoá từ card → mục biến khỏi thư viện, xuất hiện trong Thùng rác với "còn 30 ngày"; Khôi phục → quay lại thư viện và mục biến khỏi Thùng rác; Xoá vĩnh viễn → `meta`/`files` mất, danh sách trống; mục 31 ngày tự bị purge khi mở Thùng rác (meta+file bị xoá, mục 3 ngày còn nguyên). 390px: thanh == cột nội dung (14↔373), hàng tự xuống dòng. 0 lỗi console.

**2026-11-17 | v3.5.403 | Arena.ai Agent sửa:**

- Khung kéo thả tệp (`.dz`, "Kéo thả tệp vào đây hoặc chọn tệp") là `<label>` bấm được nhưng con trỏ vẫn là mũi tên; thêm `cursor:pointer` cho khớp hành vi.
- File: `manifest.json`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra: `getComputedStyle` trong Chromium thật trả `cursor:pointer` cho `#dz`; click vẫn mở file picker như trước.

**2026-11-17 | v3.5.402 | Arena.ai Agent sửa:**

- Sửa lệch breakpoint của tab Tài liệu so với v3.5.379: v3.5.401 đặt padding 44px ở route (ngoài iframe), nên `innerWidth` bên trong iframe nhỏ hơn 88px so với bản gốc → `@media(max-width:1180px)` của `documents.css` bật sớm, `.lib` sập 1 cột và "Thống kê đọc" rơi xuống dưới ở những cửa sổ mà v3.5.379 vẫn 2 cột.
- Nay iframe phủ hết bề rộng route (không padding/cap) và padding 44px (22px ≤980, 12px ≤760) nằm lại trong `html.dash-embedded .main` — media query bên trong thấy đúng bề rộng như v3.5.379. Thanh chung vẫn inset 44/22/12px nên vẫn phủ đúng cột nội dung.
- File: `manifest.json`, `css/dashboard/documents-host.css`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra (Chromium thật, so cùng cửa sổ với bản dựng v3.5.379): `innerWidth` trong iframe trùng khít (1568→1345; 1380→1157; 1268→1045; 1200→977), `.lib` = 896+340 / 1066 / 954 / 930 giống từng con số; ảnh đối chiếu `shots380/side-by-side-documents.png`. Với nội dung cao (giả lập 1600px): grid 2 cột ở 1568, 1 cột + tìm kiếm xuống dòng ở 390. Thanh == cột nội dung ở 1568 (264↔1521) và 390 (12↔375). 0 lỗi console.

**2026-11-17 | v3.5.401 | Arena.ai Agent sửa:**

- Trả lại đúng khung nội dung của trang Tài liệu v3.5.379: route tự cấp padding 44px (22px ≤980, 12px ≤760) và bỏ giới hạn 1320px, iframe phủ hết bề rộng route; trước đó tôi nhét Tài liệu vào cột giữa của dashboard (gutter + cap 1320) nên bề rộng bên trong tụt xuống dưới mốc 1180px của `documents.css` → `.lib` sập 1 cột, "Thống kê đọc" rơi xuống dưới, khác hẳn v3.5.379.
- Thanh chung vẫn phủ đúng cột nội dung: Tài liệu dùng gutter 44/22/12px, các tab khác giữ nguyên.
- File: `manifest.json`, `css/dashboard/documents-host.css`, `css/dashboard/overview.css`, `PROJECT.md`.
- Kiểm tra (Chromium thật, so trực tiếp với bản dựng v3.5.379): cửa sổ 1568 — v3.5.379 `.lib` 896+340, `.grid` 2 cột; bản này 899+340 và 2 cột; 1512 — 840+340 / 843+340; 1300 — cả hai đều 1 cột. Thanh == iframe ở mọi route (1512: 264↔1465; 390: 12↔375). 0 lỗi console.

**2026-11-17 | v3.5.400 | Arena.ai Agent sửa:**

- Sửa lỗi layout tab Tài liệu: iframe tự giãn cao bằng nội dung nên khi thư viện có tài liệu (nội dung cao hơn bề rộng) iframe thành "portrait", và `@media (orientation:portrait)` của `documents.css` bật layout điện thoại trên desktop — lưới tài liệu 1 cột, ô tìm kiếm xuống dòng riêng, hero thu nhỏ, ẩn `.heroIcon`.
- Nay trong chế độ nhúng, layout thư viện theo **bề rộng** chứ không theo tỉ lệ khung: `html.dash-embedded` khôi phục giá trị desktop và chỉ chuyển sang giá trị mobile ở `max-width:860px` (kèm bản `max-width:1180px` cho `.aside` 2 cột như bản gốc).
- File: `manifest.json`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra (Chromium thật, ép nội dung cao 1600px để tái hiện): trước sửa — iframe 1205×2514, `.grid` = `847px` (1 cột), `search order:3`, hero padding 20px; sau sửa — `.grid` = `415.5px 415.5px` (2 cột), search cùng hàng, hero 25/30px. Cửa sổ 1200 (iframe 905): lib 1 cột, `.aside` 2 cột đúng như bản gốc. 390: vẫn layout mobile (grid 1 cột, search xuống dòng).

**2026-11-17 | v3.5.399 | Arena.ai Agent sửa:**

- Sửa nháy sáng khi mở tab Tài liệu ở dark mode: iframe tự vẽ bằng theme mặc định (sáng) và còn hiện `.topbar` riêng của nó trong khoảng trước khi Dashboard kịp gán `dash-embedded`/`dark`, nên thấy một khung trắng ~1 frame.
- Nay iframe ẩn (`opacity:0`) cho tới khi Dashboard đã gán `dash-embedded` + `dark` rồi mới hiện (fade 140ms, tắt khi `prefers-reduced-motion`); nền trang nhúng đổi thành `transparent` để không lộ màu nền sai. Đồng bộ theme sớm ở `DOMContentLoaded` của frame thay vì chờ `load`.
- File: `manifest.json`, `css/dashboard/documents-host.css`, `css/dashboard/documents.css`, `js/dashboard/dashboard.js`, `PROJECT.md`.
- Kiểm tra (Chromium thật, 1512, dark): chụp 14 frame liên tiếp khi chuyển tab — trước khi sửa frame đầu có 50% pixel sáng >200 (khung trắng), sau khi sửa 0%; nội dung hiện đủ sau ~120ms. Light mode, quay lại tab lần 2, và đổi theme khi đang mở tab đều đúng, 0 lỗi console.

**2026-11-17 | v3.5.398 | Arena.ai Agent sửa:**

- Bỏ cơ chế riêng của tab Tài liệu: đây là iframe tự cuộn trong `documents.html` với `.topbar` riêng, nên `#dashboardScroller` bị ép `overflow:hidden`, thanh header chung bị ẩn và tab có một scrollbar riêng. Nay Tài liệu là route bình thường: `#dashboardScroller` là scroll root duy nhất, `#dashboardSharedTopbar` là header duy nhất cho cả 4 tab, nội dung trượt dưới thanh khi cuộn.
- Iframe Tài liệu tự báo chiều cao (`ResizeObserver` + `scrollHeight`) để trang giữ một scrollbar; `html.dash-embedded` tắt `.topbar` nội bộ và nền cuộn riêng. `body.documents-viewer-open` vẫn đưa iframe ra toàn màn hình như trước.
- Overlay `position:fixed` trong iframe (toast, dialog, drop target) nhận `--dash-vp-top` theo vị trí viewport thật để không lệch khi trang đã cuộn.
- Thanh chung lấy đúng số đo của `.topbar` v3.5.379: cao 55px, `padding:0 20px`, bo `0 0 22px 22px`, viền trên 0; mobile cao 48px, bo `999px`, sticky `top:10px`, ẩn dấu `/` và pill. Bỏ hiệu ứng thu nhỏ `is-compact` để thanh giữ nguyên khi cuộn.
- Route gutter của thanh bám đúng padding nội dung từng tab: mặc định `clamp(16px,3vw,42px)`, Highlights & Notes `clamp(18px,2.2vw,34px)` (mobile 12/18px), Dictation 18/15/11px.
- File: `manifest.json`, `pages/dashboard.html`, `css/dashboard/overview.css`, `css/dashboard/responsive.css`, `css/dashboard/documents-host.css`, `css/dashboard/documents.css`, `js/dashboard/dashboard.js`, `js/dashboard/documents.js`, `PROJECT.md`.
- Kiểm tra (Chromium thật, extension đã nạp, 1512/1920/390, sáng + tối): thanh == cột nội dung ở cả 4 tab (1512: 262→1467; H&N 253,3→1475,8; 1920: 408,5→1728,5; H&N 254→1883; 390: 14/11/18→373/376/369 khớp từng tab); cuộn 200px thanh dừng ở `top:0` (mobile `top:10`), nội dung chui dưới thanh; chỉ còn một scrollbar/route; 0 lỗi console. Chưa test mở tài liệu thật trong viewer PDF sau thay đổi.

**2026-11-17 | v3.5.379 | Arena.ai Agent sửa:**

- Đổi điểm nhấn vàng của cảnh báo quyền PDF sang xanh lá theo token theme dùng chung; số thứ tự hướng dẫn và icon tự đổi đúng theo giao diện sáng/tối.
- File: `manifest.json`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents; manifest v3.5.379; CSS dùng `--green`/`--greenSoft` cho cả light/dark, không còn mã màu vàng trong popup; CSS brace balance và `git diff --check` — PASS. Chưa browser-test trực quan.

**2026-11-17 | v3.5.378 | Arena.ai Agent sửa:**

- Khớp cỡ chữ hai bước hướng dẫn với demo (12px); giữ nút **Chọn PDF** ở trạng thái phụ/viền, **Làm ngay** là nút tím chính.
- File: `manifest.json`, `css/dashboard/documents.css`, `js/dashboard/documents.js`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents/languages; mocked access/ordinary fallback button states; mocked permission polling; manifest v3.5.378, 12px instruction CSS, DOM/ARIA, `git diff --check` — PASS. Chrome visual/browser test chưa chạy.

**2026-11-17 | v3.5.377 | Arena.ai Agent sửa:**

- Nút **Làm ngay** mở trang Tiện ích Chrome nhưng giữ popup trên Documents; kiểm tra quyền truy cập URL tệp mỗi giây và tự đóng popup khi quyền được cấp. Theo dõi tiếp khi tab Documents được focus lại.
- File: `manifest.json`, `js/dashboard/documents.js`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents; mocked CTA opens Chrome Extensions, modal remains visible while denied and closes after grant; manifest v3.5.377, popup DOM/ARIA, `git diff --check` — PASS. Chrome UI/browser test chưa chạy.

**2026-11-17 | v3.5.376 | Arena.ai Agent sửa:**

- Áp dụng popup quyền truy cập PDF local vào Tài liệu: cảnh báo vàng, tiêu đề “Mở PDF thuận tiện bằng Keepit”, “Cách bật quyền truy cập”, hai hàng hướng dẫn chữ lớn và nút tím “Làm ngay” mở trang Tiện ích Chrome cho Keepit. Giữ picker cho lỗi mở PDF thông thường; dịch đủ en/vi/ko.
- File: `manifest.json`, `pages/documents.html`, `js/dashboard/documents.js`, `css/dashboard/documents.css`, `js/core/languages.js`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents/languages; runtime en/vi/ko labels; manifest version, popup IDs/ARIA, two-step markup, CTA destination, normal-error picker fallback, CSS hidden-state/brace balance, `git diff --check` — PASS. Chrome UI/browser test chưa chạy.

**2026-11-17 | v3.5.375 | Arena.ai Agent sửa:**

- Điều chỉnh overlay PDF xuống để thẻ cách đáy thanh viewer Chrome 20px. Khôi phục thẻ PDF gọn trong popup icon toolbar theo mẫu người dùng gửi (PDF icon, tên tệp ellipsis, nút Open PDF); giữ badge và in-page overlay, không tạo cửa sổ/tab.
- File: `manifest.json`, `js/background/background.js`, `pages/popup.html`, `js/popup/popup.js`, `css/popup/popup.css`, `docs/modules/popup.md`, `OPT-ARENA.md`, `PROJECT.md`.
- Kiểm tra: `node --check` background/toolbar popup/iframe/languages; URL resolver direct/file/viewer/invalid; toolbar markup/CSS light-dark/conditional card; localized labels, iframe top offset, no `windows.create`, mock local-permission flag/exact source URL/CTA, docs bounds, `git diff --check` — PASS. User xác nhận overlay v3.5.374 hiển thị đúng; offset mới và card toolbar v3.5.375 chưa được browser-test.

**2026-11-17 | v3.5.374 | Arena.ai Agent sửa:**

- Đúng lại thiết kế: gỡ thẻ PDF khỏi popup icon toolbar, giữ badge `PDF`; thay cửa sổ riêng bằng iframe overlay được inject vào document PDF. X thu thành icon, bấm icon mở lại; click card mở đúng tài liệu qua Documents.
- Thêm `pages/pdf-suggestion.html` vào web-accessible resources; iframe resize/close gửi postMessage, Background chỉ nhận từ frame đã mount và origin tiện ích. Rời tab/navigation khỏi PDF sẽ gỡ overlay; đóng các cửa sổ PDF riêng còn sót từ v3.5.373 khi reload.
- File: `manifest.json`, `js/background/background.js`, `pages/popup.html`, `js/popup/popup.js`, `css/popup/popup.css`, `js/popup/pdf-suggestion.js`, `js/core/languages.js`, `docs/modules/popup.md`, `OPT-ARENA.md`, `PROJECT.md`.
- Kiểm tra: syntax background/toolbar popup/iframe/languages; manifest/WAR, gỡ mọi PDF card khỏi toolbar, iframe-only/no-window, message source+origin, IDs/assets/i18n en/vi/ko, mocked URL/collapse/reopen/close, `git diff --check` — PASS. Chrome 157 đang chạy v3.5.373: main-frame injection và tải web-accessible iframe asset thành công trên PDF local + online; temporary fixed iframe hit-test ở top layer rồi được gỡ. Chưa test đầy đủ source v3.5.374 trên Chrome.

**2026-11-17 | v3.5.373 | Arena.ai Agent sửa:**

- Sửa race Chrome: tab popup có thể nhận onActivated khi URL còn rỗng/`about:blank`; listener nay chờ URL thật thay vì đóng nhầm cửa sổ. Popup PDF có X thu gọn thành icon, bấm icon mở lại và không tự hết hạn sau 18 giây.
- Giữ toolbar PDF badge/card, luồng mở đúng URL, hướng dẫn quyền file URL và picker fallback; nhãn X/icon được dịch en/vi/ko.
- File: `manifest.json`, `js/background/background.js`, `pages/pdf-suggestion.html`, `js/popup/pdf-suggestion.js`, `css/popup/pdf-suggestion.css`, `js/core/languages.js`, `docs/modules/popup.md`, `PROJECT.md`.
- Kiểm tra: `node --check` background/floating popup/languages; manifest, DOM ID/assets, en/vi/ko labels, blank-URL guard và `git diff --check`; mocked lifecycle xác nhận URL rỗng không tự đóng, X thu gọn/icon mở lại/đổi kích thước và tab khác đóng popup — PASS. Chrome đang chạy bản unpacked ngoài workspace nên browser retest trên code mới chưa chạy.

**2026-11-17 | v3.5.372 | Arena.ai Agent sửa:**

- Khôi phục popup PDF nổi tự hiện khi PDF tab active/tải xong; popup nhỏ theo demo, không có X/thu gọn, toàn card mở PDF. Giữ cả badge `PDF` và thẻ click toàn vùng trong popup toolbar; chia sẻ URL/open/fallback flow, local permission guide và manual picker.
- File: `manifest.json`, `js/background/background.js`, `pages/pdf-suggestion.html`, `js/popup/pdf-suggestion.js`, `css/popup/pdf-suggestion.css`, `js/popup/popup.js`, `js/dashboard/documents.js`, `js/core/languages.js`, `docs/INDEX.md`, `docs/modules/popup.md`, `PROJECT.md`, `OPT-ARENA.md`, `docs/changelog/v3.5.md`.
- Kiểm tra: `node --check` background/action-popup/floating-popup/dashboard/documents/languages; runtime PDF labels en/vi/ko; mocked background lifecycle (PDF complete → popup once with exact URL → closes on navigation; duplicate-event guard); manifest, DOM IDs/assets, no close/collapse, `git diff --check` — PASS. Browser QA chưa chạy.

**2026-11-17 | v3.5.371 | Arena.ai Agent sửa:**

- Popup toolbar: thay cửa sổ PDF nổi bằng thẻ PDF toàn vùng bấm; badge PDF giữ nguyên. Mở đúng URL PDF HTTP(S)/file qua Dashboard > Tài liệu và pipeline import hiện có; nếu quyền file URL tắt hoặc truy cập thất bại, hướng dẫn bật “Allow access to file URLs” và cho phép chọn tệp thủ công.
- Bỏ close/collapse/auto-dismiss của cửa sổ nổi; thêm nhãn en/vi/ko và cập nhật docs.
- File: `manifest.json`, `js/popup/popup.js`, `pages/popup.html`, `css/popup/popup.css`, `js/background/background.js`, `js/dashboard/dashboard.js`, `js/dashboard/documents.js`, `pages/documents.html`, `js/core/languages.js`, `OPT-ARENA.md`, `docs/INDEX.md`, `docs/modules/popup.md`, `PROJECT.md`, `docs/changelog/v3.5.md`; xóa `pages/pdf-suggestion.html`, `js/popup/pdf-suggestion.js`, `css/popup/pdf-suggestion.css`.
- Kiểm tra: `node --check` popup/background/dashboard/documents/languages; manifest JSON, popup/document markup/IDs, i18n runtime en/vi/ko, URL resolution for web/local/wrapped viewer and invalid schemes, bounded 50 MB response stream, removed-floating-UI assertions, `git diff --check` — PASS. Browser QA chưa chạy.

**2026-11-17 | v3.5.370 | Arena.ai Agent sửa:**

- Sửa sai vị trí gợi ý: từ CTA chỉ trong toolbar popup thành cửa sổ extension nổi góc phải trên khi tab PDF active; thêm nút đóng, dịch en/vi/ko, badge dự phòng, mở Dashboard > Tài liệu. Không tự redirect/fetch/đọc tệp.
- Nhận diện path `.pdf` trực tiếp và nguồn `src`/`file`/`url` trong URL Chrome/Firefox PDF viewer; chỉ hiện một lần cho cùng tab/tệp trong phiên.
- File: `manifest.json`, `js/background/background.js`, `js/popup/{popup,pdf-suggestion}.js`, `pages/pdf-suggestion.html`, `css/popup/pdf-suggestion.css`, `js/core/languages.js`, `OPT-ARENA.md`, `docs/INDEX.md`, `docs/documents.md`, `docs/modules/{popup,dashboard}.md`, `PROJECT.md`.
- Kiểm tra: `node --check` JS liên quan; synthetic URL cases cho file:// và viewer wrappers; translations, wiring, manifest và `git diff --check` đạt. Chưa browser-test thật.

**2026-11-17 | v3.5.369 | Arena.ai Agent sửa:**

- PDF tab trong browser: badge `PDF` và CTA trong toolbar popup, mở Dashboard > Tài liệu; không redirect, không fetch/đọc browser viewer. Gợi ý là trong popup toolbar, chưa hiện nổi trên PDF; thay bằng v3.5.370.
- File: `manifest.json`, `js/background/background.js`, `js/popup/popup.js`, `pages/popup.html`, `css/popup/popup.css`, `js/core/languages.js`, `js/dashboard/dashboard.js`, `OPT-ARENA.md`, `docs/INDEX.md`, `docs/documents.md`, `docs/modules/{popup,dashboard}.md`, `PROJECT.md`.
- Kiểm tra: `node --check` bốn file JS; URL suffix cases; `git diff --check` đạt. Chưa browser-test.

**2026-11-17 | v3.5.368 | Arena.ai Agent sửa:**

- Documents sheet: chuyển Dịch và Đọc to từ Công cụ xuống footer cố định cạnh Cài đặt ở cả hai template; giữ `LHN_DOCUMENTS_MAIN_ACTIONS` và viewer handlers hiện có, chỉ tác động Documents sheet.
- File: `manifest.json`, `js/content/keepit-bar.js`, `docs/documents.md`, `docs/modules/content.md`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` JS liên quan, parse manifest và `git diff --check`; chưa browser-test.

**2026-11-17 | v3.5.367 | Arena.ai Agent sửa:**

- `AGENTS.md`: thêm hai quy tắc chỉ áp dụng cho Arena.ai — xóa toàn bộ tệp trong `uploads` sau khi dùng xong; chỉ giữ ZIP version mới nhất trong `Keepit-Zip`, xóa bản cũ sau khi bản mới đã xác minh.
- File: `AGENTS.md`, `PROJECT.md`, `manifest.json`.
- Kiểm tra: parse manifest và `git diff --check`; không đổi mã ứng dụng, không cần browser test.

**2026-11-17 | v3.5.366 | Arena.ai Agent sửa:**

- Cập nhật `OPT-ARENA.md`: mặc định khởi động watcher ẩn; thêm `Unblock-File`, `Start-Process -WindowStyle Hidden` với `-ExecutionPolicy Bypass` chỉ cho tiến trình, và lưu ý Group Policy.
- File: `OPT-ARENA.md`, `PROJECT.md`, `manifest.json`.
- Kiểm tra: parse manifest, `git diff --check`; không đổi mã ứng dụng, không cần browser test.

**2026-11-17 | v3.5.365 | Arena.ai Agent sửa:**

- Documents main sheet: ẩn tile Ẩn thanh; thay tile Dịch/Đọc generic bằng callbacks dùng chung với nút Dịch/Đọc to trên viewer topbar. Chỉ áp dụng trong Documents; sheet web không đổi.
- File: `manifest.json`, `js/content/keepit-bar.js`, `js/dashboard/documents.js`, `docs/documents.md`, `docs/modules/content.md`, `docs/modules/dashboard.md`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file JS, parse manifest và `git diff --check` đạt; Chrome thật chưa kiểm thử.

**2026-11-17 | v3.5.362 | Arena.ai Agent sửa:**

- Reader Documents bỏ TTS cho header/footer có cấu trúc (DOCX) hoặc cùng dòng lặp ở vùng đầu/cuối trang (PDF/Office); vẫn hiện nguyên trên trang. Bộ lọc chỉ tác động `nativeBlocks`, không sửa văn bản/anchor.

**2026-11-17 | v3.5.361 | Arena.ai Agent sửa:**

- Documents only: ẩn footer `Tắt trang`. Pager sheet không bị `relayout()` đóng khi thay đổi breakpoint/viewport do lock/resize; vẫn render/re-anchor. More viewer giữ nguyên.

**2026-11-17 | v3.5.360 | Arena.ai Agent sửa:**

- Phạm vi chỉ Documents sheet: ẩn Dashboard/Bảng quản lý trên browser template; Chú thích (`wclegend`) dùng legend `#legend` của tài liệu, bật word class nếu chưa chạy; trạng thái tile theo legend Docs. Không đổi sheet web thường.

**2026-11-17 | v3.5.359 | Arena.ai Agent sửa:**

- Documents main sheet: lọc `overlay/dictation`, `block/wcblock`, `pdark/zoom/font`; giữ công cụ cần cho tài liệu. Btop dùng `#stage` để hiện/scroll-to-top; tile Loại từ gọi `toggleWordClass` và đồng bộ trạng thái đang bật.

**2026-11-17 | v3.5.358 | Arena.ai Agent sửa:**

- Sửa sheet chớp/tắt: `watchExt()` đóng sheet neo ngoài Reader khi `readerShown()` false. Tách `sheetFromReader`; chỉ sheet được gọi từ Reader mới auto-close theo Reader. Pager sheet vẫn được neo vào nút và giữ mở.

**2026-11-17 | v3.5.357 | Arena.ai Agent sửa:**

- Mở tiếp nguyên nhân v356: cho phép Documents extension frame (không chỉ top frame) và chờ Promise mount thật hoàn tất trước khi bật sheet; `requestMainSheet` await kết quả thay vì coi Promise là failure. Init reject được log rõ. Cú pháp/wiring đạt; chưa browser-test.

**2026-11-17 | v3.5.356 | Arena.ai Agent sửa:**

- Tìm ra lỗi v355 từ ảnh: `keepit-bar.js` tự thoát ngay đầu file vì chỉ cho protocol HTTP(S) hoặc trang Home của extension; Documents là extension page nên hook `openMainSheet` không bao giờ được đăng ký. Cho phép riêng trang có `data-keepit-documents`; giờ component thật khởi tạo tại Documents. Cần browser-test PDF thật.

**2026-11-17 | v3.5.355 | Arena.ai Agent sửa:**

- Sửa v354: bỏ sheet rút gọn tự dựng. Documents nạp lại component main sheet thật (`keepit-bar.js`), ẩn riêng thanh Keepit đáy của host khi chạy trong trang Documents, rồi mở sheet từ nút pager bằng tọa độ nút. Lọc video/Dictation và dashboard/history trong ngữ cảnh này; Reader dùng cùng sheet, More viewer không đổi. Cú pháp/static wiring đạt; chưa browser-test UI.

**2026-11-17 | v3.5.354 | Arena.ai Agent sửa:**

- Ảnh người dùng xác nhận relay lỗi vì main sheet không thể được gọi ổn định từ tab phía sau Documents (ví dụ PDF/viewer không có content script). Bỏ relay cho chức năng này; pager mở sheet cục bộ trực tiếp trên Documents, chứa công cụ tài liệu/đọc, không có Video/Học. Reader mở cùng sheet và focus Đọc to; More viewer vẫn giữ sheet riêng. Chưa browser-test UI thật.

**2026-11-17 | v3.5.353 | Arena.ai Agent sửa:**

- Main sheet mở từ Documents được đánh dấu ngữ cảnh; ẩn video (Overlay/Dictation) và mục Học (Dashboard/Lịch sử). Mở main sheet thông thường không bị thay đổi. Chưa browser-test.

**2026-11-17 | v3.5.352 | Arena.ai Agent sửa:**

- Sửa relay của v351: background trước chỉ lấy `active` tab của cửa sổ, bỏ qua tab owner của frame Documents trong side panel, khiến sheet thất bại và hiện yêu cầu mở website. Giờ ưu tiên `sender.tab` khi đó là webpage chứa Documents; chỉ fallback active tab nếu không có owner tab web. Lời nhắc không còn yêu cầu mở thêm trang.
- Cú pháp/static checks đạt; chưa browser-test trên side panel thật.

**2026-11-17 | v3.5.351 | Arena.ai Agent sửa:**

- Sửa hiểu nhầm ở v350: nút menu pager và ☰ Reader không mở sheet More riêng của Documents; chúng gửi lệnh qua background tới content script trên tab web đang hoạt động để mở đúng main sheet của Keepit trên web. Pager toggle mở/đóng; Reader luôn mở và cuộn tới mục Reader như Reader web. More trên viewer không đổi.
- Nếu không có tab web Keepit hoạt động, hiện hướng dẫn. Cú pháp/static checks đạt; chưa browser-test trong side panel thật.

**2026-11-17 | v3.5.350 | Arena.ai Agent sửa:**

- Thêm nút menu ở mép phải pager nổi; mở cùng sheet Điều khiển của Documents và đưa toàn bộ control vào sheet khi mở. Nút ☰ trên Reader mở cùng sheet, neo gần thanh Reader thay vì chuyển sang tab cài đặt Dashboard.
- Cú pháp/static checks và `git diff --check` đạt; chưa browser-test tương tác/định vị sheet.

**2026-11-17 | v3.5.349 | Arena.ai Agent sửa:**

- Tách lazy rendering thumbnail rail khỏi lazy rendering trang nội dung: khi một mục trang đi vào vùng nhìn thấy của rail thì render thumbnail riêng; PDF raster thu nhỏ theo trang, DOCX/PPTX vẽ text preview theo từng trang. Các trang ngoài vùng không tải sớm.
- Cú pháp/static checks đạt; chưa browser-test PDF/Office nhiều trang.

**2026-11-17 | v3.5.348 | Arena.ai Agent sửa:**

- Nạp shared UI tokens trong Documents để app font Inter và các token của popup Keepit có sẵn; dùng app font làm fallback cho UI, không ghi đè font gốc PDF/Office.
- Chuyển dịch chọn chữ và tự dịch vào ghi chú sang `translate.googleapis.com`, endpoint đã được CSP Documents cho phép (thay endpoint clients5 bị CSP chặn). Cú pháp/JSON/static checks đạt; chưa browser-test luồng mạng hoặc tài liệu thật.

**2026-11-17 | v3.5.347 | Arena.ai Agent sửa:**

- Mỗi highlight PDF nhiều dòng giờ là một group có một bộ sự kiện hover/click, hiển thị một popup ghi chú duy nhất; các dải con chỉ vẽ nền bám theo chữ, không nhận hover riêng và không tô kín khoảng trắng. Giữ màu blend PDF đã xác nhận.
- Cập nhật xóa/restore để gỡ đúng group hình học. Kiểm tra cú pháp/static và `git diff --check` đạt; chưa browser-test trên PDF thật.

**2026-11-17 | v3.5.346 | Arena.ai Agent sửa:**

- PDF highlight nối dải của các dòng kề nhau theo phần chữ được chọn, tránh khe trắng tại line wrap; không kéo tô đến cuối dòng hay thành hộp chữ nhật lớn. Giữ một annotation và một ID.
- Kiểm tra cú pháp và static checks geometry/overlay; chưa browser-test trên PDF thật.

**2026-11-17 | v3.5.345 | Arena.ai Agent sửa:**

- PDF highlights dùng overlay hình học riêng; gom các mảnh kề nhau cùng baseline thành dải theo chữ/dòng. Giữ một annotation ID, không tô kín khoảng trắng giữa các dòng; thao tác màu/xem trước/sửa/xóa dùng chung.
- Kiểm tra cú pháp và static checks overlay/style/classes; chưa browser-test trên PDF thật.

**2026-11-17 | v3.5.344 | Arena.ai Agent sửa:**

- Sửa vị trí blend PDF: áp `mix-blend-mode:multiply` lên stacking context của text span PDF có highlight, để màu tô hòa với canvas gốc thay vì thành dải che chữ.
- Kiểm tra cú pháp/CSS selector/static class, `git diff --check`; chưa browser-test trên PDF thật.

**2026-11-17 | v3.5.602 | Arena:**

- Tóm tắt: thống nhất tên đầy đủ và rút gọn của Vừa rộng trong danh sách zoom và nút chọn: vi “Vừa rộng”, en “Fit width”, ko “너비 맞춤”; không thay logic zoom.
- File: `js/core/languages.js`, `pages/documents.html`, `manifest.json`, `PROJECT.md`.
- Kiểm tra: Chromium extension unpacked PDF mẫu, 1512/390 sáng/tối, ảnh chi tiết 4×; cả hai chỗ khớp vi/en/ko, nút/danh sách tiếng Việt 90/90px desktop và 97/97px mobile; chọn Vừa rộng, console/pageerror rỗng. Chưa kiểm thiết bị thật, Windows/profile thật và Android/Firefox.

**2026-11-17 | v3.5.603 | Arena:**

- Tóm tắt: thêm công tắc Thu gọn thanh trên trong Cài đặt Tài liệu; mặc định tắt, khi bật chỉ thanh trên thu về 60%, ghi nhớ và đồng bộ trực tiếp. Không thu thanh dưới, menu hay nội dung tài liệu.
- File: `pages/dashboard.html`, `css/dashboard/documents.css`, `js/dashboard/dashboard.js`, `js/dashboard/documents.js`, `js/core/languages.js`, `manifest.json`, tài liệu.
- Kiểm tra: Chromium extension unpacked 1512/390 sáng/tối, ảnh chi tiết 4×; bật/tắt, đồng bộ iframe và reload; thanh chuột 56→33,6px, chạm giả lập 60→36px, nút chạm 44→26,4px theo yêu cầu. Tên PDF dài, co giãn 320/390/1512, menu Thêm và đổi theme; console/pageerror rỗng. Chưa kiểm thiết bị cảm ứng thật, Windows/profile thật, Android/Firefox và Office thực; 60% khiến đích chạm nhỏ.

**2026-11-17 | v3.5.604 | Arena:**

- Tóm tắt: thu gọn thanh trên còn 80% thay vì 60%; chế độ Đọc chỉ đổi cách xem, không tự mở Đọc to; `arena.ai` được thêm một lần vào Tắt website, giữ danh sách cũ và cho xóa/bật lại.
- File: `css/dashboard/documents.css`, `js/core/languages.js`, `js/dashboard/documents.js`, `js/background/background.js`, `manifest.json`, tài liệu.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh phóng 4×; thanh 56→44,8px chuột, 60→48px chạm giả lập; chọn Đọc và mở trực tiếp Đọc không bật giọng, nút Đọc to vẫn kích hoạt reader; trang HTML giả lập tại arena.ai thấy thanh ẩn, cài mới/di trú giữ sites cũ, xóa không bị thêm lại. Console/pageerror rỗng; chưa kiểm trang Arena thật/profile Windows, Android/Firefox, giọng và thiết bị thật.

**2026-11-17 | v3.5.605 | Arena:**

- Tóm tắt: Giảm một nửa khoảng trống dọc thanh trên tài liệu, giữ cỡ nút và thu gọn 80%.
- File: `css/dashboard/documents.css`, `manifest.json`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh và crop 4×; chuột 46/36,8px, cảm ứng giả lập 52/41,6px; menu Thêm và Đọc/Đọc to; console/pageerror rỗng. Chưa kiểm thiết bị thật, profile Windows, Android/Firefox và cảm giác dùng.

**2026-11-17 | v3.5.606 | Arena:**

- Tóm tắt: Thu gọn 80% cả thanh trên và dưới; dải trang kéo chỉnh rộng, ẩn/hiện, ghi nhớ và giới hạn theo màn hình; menu xổ vẫn cỡ thường.
- File: `pages/documents.html`, `css/dashboard/documents.css`, `js/dashboard/documents.js`, `js/core/languages.js`, `manifest.json`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh 4×; kéo chuột, bàn phím, ẩn/hiện và reload; giả lập cảm ứng 390; thanh dưới chuột 42/34px, cảm ứng 50/40,4px; menu bố cục, console/pageerror rỗng. Chưa kiểm thiết bị cảm ứng thật, profile Windows, Android/Firefox và PDF/Office của người dùng.

**2026-11-17 | v3.5.607 | Arena:**

- Tóm tắt: Tay kéo trái đồng kiểu panel phải; dải trang ẩn/hiện chuyển động 250ms, tôn trọng giảm chuyển động, giữ trạng thái và kéo.
- File: `css/dashboard/documents.css`, `js/dashboard/documents.js`, `manifest.json`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: Chromium unpacked 1512/390 sáng/tối, ảnh và crop 4×; nét hai tay kéo 2×32px, ẩn/hiện, đóng/mở nhanh, phím và reload đạt; chạm và kéo giả lập riêng đạt, nhưng click giả lập sau kéo CDP chưa xác minh; console/pageerror rỗng. Chưa kiểm cảm ứng thật, profile Windows, Android/Firefox và tài liệu người dùng.
