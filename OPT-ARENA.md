# Nhật ký ý tưởng đã chốt với Arena — OPT-ARENA.md

File này lưu **ý tưởng và thiết kế đã chốt qua thảo luận với Arena**, bản mới nhất ở trên cùng.
- Ở đây chỉ ghi ý tưởng, quyết định, phương án đã loại (kèm lý do) và câu hỏi còn mở.
- Trạng thái triển khai, việc đang mở và nhật ký thay đổi code nằm trong `PROJECT.md`. Hành vi thực tế xác nhận bằng mã nguồn.
- Mỗi bản ghi có tiêu đề `## YYYY-MM-DD | <chủ đề>` và dòng **Trạng thái** (Đã chốt, chưa triển khai / Đang triển khai / Đã triển khai ở vX.Y.Z).

---

## 2026-11-08 | Overlay cảm ứng theo demo v10 (thanh, sheet ☰, rạp ngang, thả tim, yêu thích video)

**Trạng thái:** Đã triển khai ở v3.5.151.

- Đã chốt qua demo v1–v10 (`keepit-overlay-more-sheet-demo-v10.html`): thanh dọc `[CC][tốc độ] · [trước phát sau] · [lặp][☰]`; ♥ trái / Toàn màn hình phải ở góc ô phụ đề; sheet ☰ 2 thẻ Học + 6 ô; Cài đặt video cảm ứng chỉ 4 mục; Tùy chọn phụ đề cảm ứng (Nền chỉ ở rạp).
- Rạp ngang điện thoại: video tràn màn hình, thanh tự ẩn 3s, vuốt trái âm lượng / phải độ sáng, đáy = Tự động; tablet ngang giữ desktop. Âm lượng/độ sáng hệ thống chỉ làm được ở APK.
- Thả tim kiểu TikTok: double-tap video/phụ đề/transcript, mỗi lần chạm một tim, nét rõ (vẽ ở cỡ lớn nhất, scale ≤1) nhưng vẫn phóng to + glow (cân bằng v8/v9). Hiệu ứng nhịp + burst áp dụng cho mọi nút tim.
- Màu phụ đề chính mặc định vàng `#ffff00` ở mọi nền tảng; palette cảm ứng thêm Tím; light mode thay Trắng bằng Xám.
- Yêu thích video là khóa riêng `lhnFavoriteVideos` theo video ID (không cần highlight); thanh tiến trình kéo được ở mọi nền tảng.
- CC và tốc độ giữ nguyên như Keepit hiện tại; mọi thứ không nêu ở trên giữ nguyên.

---

## 2026-11-06 | Bản chốt v3.5.136: chuẩn bị gửi duyệt Chrome Web Store và Firefox Add-ons

**Trạng thái:** Đã triển khai ở v3.5.136. Điều chỉnh đã chốt sau khi ghi kế hoạch: một ZIP chung cho Chromium và Firefox; cài đặt Firefox ghi thẳng vào `manifest.json` (không dùng `build_firefox.py`); `addons-linter` chạy trên ZIP chung. Quyết định của người dùng khi triển khai: giữ quy tắc 9002 của AI panel dù xung đột chính sách AMO §4.4 (xem mục 6).

**Mục tiêu:** đáp ứng yêu cầu kỹ thuật, quyền riêng tư và chính sách của cả hai cửa hàng với ít thay đổi nhất, trong một lần phát hành duy nhất là v3.5.136. Không cam kết chắc chắn được duyệt.

### 1. Phần Arena làm

| # | Hạng mục | Công việc |
|---|---|---|
| 1 | Manifest | Đặt UUID cố định cho Firefox, phiên bản tối thiểu 147, ghi thẳng vào `browser_specific_settings.gecko` trong `manifest.json` (không sửa `build_firefox.py`). Rà soát manifest và toàn bộ quyền. |
| 2 | Dữ liệu | Kiểm tra từng luồng: dữ liệu gì, bên nhận, mục đích và mức độ cần thiết. Phân loại từng luồng thành `required` / `optional` / ngừng gửi / `none`. Không mặc định dữ liệu đang gửi là bắt buộc. **Firefox:** khai báo `data_collection_permissions` chính xác theo từng loại dữ liệu. Với dữ liệu `optional`, chỉ gửi sau khi người dùng đồng ý qua `permissions.request()` (trường `data_collection`); lời gọi này chỉ được thực hiện khi người dùng chủ động dùng tính năng tương ứng. **Chrome:** chuẩn bị nội dung khai báo chính xác trên Developer Dashboard; nếu cần cơ chế đồng ý mới phải sửa code, báo người dùng quyết định trước. |
| 3 | Chính sách quyền riêng tư | Nêu loại dữ liệu, mục đích, bên nhận, cách thu thập, sử dụng, chia sẻ và xử lý. Có tuyên bố khẳng định việc xử lý dữ liệu người dùng tuân thủ Chrome Web Store User Data Policy, bao gồm Limited Use. |
| 4 | Tuân thủ | Rà soát `<all_urls>`, DNR/CSP, `Referer`, Google Fonts, `postMessage`, `sessionStorage` và URL gửi cho AI. Kiểm tra mã thực thi từ xa trên toàn dự án. Mỗi điểm có kết luận: phù hợp / xung đột (báo người dùng quyết định) / chưa xác minh / không áp dụng. |
| 5 | Tài nguyên | Xóa dòng S2. Thay ảnh Unsplash bằng ảnh người dùng cung cấp, thêm đúng 1 dòng vào `web_accessible_resources` (đã xác minh là bắt buộc). Giữ nguyên logic dự phòng. |
| 6 | Kiểm định | Chạy `addons-linter` trên ZIP chung: không còn error; warning cho khóa chỉ dành cho Chromium là dự kiến; mỗi warning được sửa hoặc giải thích kèm căn cứ. `addons-linter` chỉ kiểm tra những vấn đề thuộc phạm vi công cụ, không thay thế việc rà soát toàn bộ chính sách AMO. |
| 7 | Nội dung cửa hàng | Chuẩn bị tên, mô tả và giải trình từng quyền cho cả hai cửa hàng. Chốt mục đích duy nhất sau khi đối chiếu toàn bộ tính năng; không nới rộng mục đích để hợp thức hóa tính năng không phù hợp. |
| 8 | Đóng gói | Nâng phiên bản lên v3.5.136, cập nhật `PROJECT.md`, commit. Tạo một ZIP chung cho Chromium và Firefox từ mã đã commit: `Keepit - Optimize Test-v3.5.136.zip`. Kiểm tra lại ZIP sau khi build. |

### 2. Phần người dùng làm
1. ~~Gửi ảnh thay Unsplash~~ — đã xong (ảnh Unsplash gốc, chuyển WebP, giấy phép Unsplash).
2. Đăng chính sách quyền riêng tư lên một URL công khai.
3. Chuẩn bị ảnh chụp màn hình cho hai cửa hàng (Chrome: 1280 × 800).
4. Hoàn tất tài khoản và thông tin liên hệ trên Chrome Web Store và AMO.
5. Kiểm thử ZIP trên cả Chrome và Firefox thật: tính năng, Console, Network, từng luồng dữ liệu, Google Fonts, ảnh mới và các trường hợp favicon.

### 3. Thứ tự thực hiện
1. Arena làm phần kỹ thuật và kiểm tra tuân thủ.
2. Hoàn tất công việc, commit và tạo một ZIP kiểm thử chung.
3. Người dùng kiểm thử ZIP trên Chrome và Firefox, ghi lại lỗi kèm bằng chứng.
4. Nếu kiểm thử đạt:
   - Giữ nguyên ZIP kiểm thử, không chỉnh sửa hoặc ghi đè.
   - Tạo bản sao từ ZIP kiểm thử để làm ZIP phát hành.
   - Xóa bảng kê khai (`DATA-INVENTORY.md`) và ghi chú nội bộ (`STORE-LISTING.md`) khỏi bản sao; không xóa khỏi repo hoặc ZIP kiểm thử.
   - Kiểm tra lại nội dung ZIP phát hành trước khi nộp.
   - Mặc định người dùng tự thực hiện bước này; nếu muốn Arena thực hiện thì nói rõ.
5. Nếu có lỗi:
   - Báo người dùng mức độ, phạm vi và bằng chứng.
   - Nếu người dùng duyệt sửa, tạo phiên bản v3.5.137.
   - Không ghi đè hoặc chỉnh sửa ZIP v3.5.136.
   - Không tự ý sửa ngoài phạm vi đã được duyệt.

### 4. Quy tắc thực hiện
- Không tái cấu trúc code, không sửa giao diện, không bỏ tính năng đang chạy nếu chưa có quyết định của người dùng.
- Mọi kết luận về tuân thủ phải có bằng chứng.
- Nếu phát hiện xung đột cần thay đổi hành vi, báo người dùng và chờ quyết định.
- Bảng kê khai dữ liệu nằm trong repo và ZIP kiểm thử, nhưng không có trong ZIP phát hành.
- Bảng kê khai chỉ ghi loại dữ liệu, bên nhận, mục đích và vị trí `file:dòng`. Không ghi endpoint, payload, token, thông tin xác thực hoặc logic nhạy cảm.
- Không nộp khi còn lỗi nghiêm trọng, còn luồng dữ liệu chưa xác định hoặc nội dung khai báo không khớp với hành vi thực tế.
- Hoàn thành phần kỹ thuật không đồng nghĩa với việc chắc chắn được cửa hàng phê duyệt.

### 5. Tiêu chí chi tiết đã thống nhất (áp dụng trong từng hạng mục)
- **Nhãn trạng thái:** đã xác minh / theo tài liệu bên thứ ba / chưa xác minh / không áp dụng / đã quyết định / dự kiến.
- **Phân loại dữ liệu:** code đang gửi không có nghĩa phải khai `required`; `optional` không phải giấy phép gửi dữ liệu không cần thiết; khai một nhóm là `required` không hợp thức hóa mọi luồng trong nhóm. URL nguồn thuộc `browsingActivity`, nội dung trang thuộc `websiteContent`.
- **Quyền tùy chọn:** manifest không có `optional_permissions` / `optional_host_permissions` (đã xác minh). `data_collection_permissions.optional` là cơ chế khác, đánh giá riêng.
- **Favicon sau khi bỏ S2:** icon tab đã lưu → `favicon.svg` → Apple Touch icon → `.ico` → `.png` → icon mặc định của Keepit (đã xác minh). Trang không có favicon hiện icon mặc định là hành vi dự kiến; không khôi phục S2.
- **Ảnh thay Unsplash:** WebP hoặc JPG, rộng khoảng 1280–1600px, dưới khoảng 200 KB, đặt trong `assets/images/`. Chỉ đổi nguồn ảnh; ảnh phải có trong ZIP; không còn chuỗi `unsplash` trong mã đóng gói (kiểm sơ bộ, bằng chứng cuối là Network).
- **Google Fonts:** tách 3 bước: CSS được chèn trên mọi trang (đã xác minh theo manifest) / trình duyệt có thật sự tải font không (chưa xác minh) / request có gửi URL trang qua `Referer` không (chưa xác minh). Kiểm từng request tới `fonts.googleapis.com` và `fonts.gstatic.com`, mỗi request ghi: URL request, giá trị `Referer`, trang thử nghiệm, font có tải hay không. Bảng kê khai có sẵn mẫu ghi.
- **Nhận dạng giọng nói (Web Speech API, dùng trong Shadowing):** Chrome: âm thanh được gửi tới dịch vụ nhận dạng từ xa (theo MDN), MDN không xác định nhà cung cấp; code không dùng `processLocally` (đã xác minh). Firefox: chưa có trong bản phát hành Firefox 147 (MDN ghi 160 ở trạng thái Preview); đánh giá lại khi Firefox phát hành chính thức. Việc cửa hàng có tính luồng này là dữ liệu do extension thu thập hay không: chưa xác minh; vẫn công khai trong chính sách.
- **Shadowing và tính năng tương lai:** Shadowing (nhận dạng giọng nói, chỉ Chrome) là tính năng hiện có, nằm trong kiểm thử. Module Luyện viết/nói (Drive/Sheet, Whisper) là tính năng tương lai.
- **Limited Use:** dùng câu cam kết chung. Câu mẫu về Google APIs của Chrome chỉ thêm khi đã xác minh đúng phạm vi; mặc định không thêm. Các luồng dịch và TTS của Google vẫn khai riêng.
- **Mục đích duy nhất:** ứng viên ưu tiên "Keepit helps users understand, learn from, and retain information from web content." Không cố đưa mọi tính năng vào câu; tính năng mới không phục vụ mục đích thì đánh giá lại tính năng.
- **Mã thực thi từ xa:** `eval`, `new Function`, `import()` động, `<script>` nguồn từ xa, module từ CDN, `executeScript` với chuỗi mã và các cơ chế nạp mã khác. Trang AI trong iframe không tính là mã của extension. WASM: chưa phát hiện trong code hiện tại, không áp dụng cho phiên bản này. `importScripts()`: đã xác minh 14 file đều có trong repo và gói, không file nào tự nạp thêm mã; kết luận chỉ giới hạn trong 14 file này.
- **Đã xác minh:** tên 33 ký tự (Chrome ≤ 75, AMO ≤ 50); mô tả 130 ký tự (≤ 132); ZIP chung giữ khóa của cả hai trình duyệt (Firefox bỏ qua `sidePanel`, `side_panel`, `service_worker`); `vendor/` là Readability không minify, không cần nộp mã nguồn cho AMO.
- **Ngoài phạm vi sửa code (vẫn đánh giá tuân thủ):** Google Fonts, `postMessage`, `sessionStorage`, luồng URL nguồn, lọc query URL, AI panel.
- **Khi upload:** các khóa chỉ dành cho Firefox trong ZIP Chrome (`sidebar_action`, `browser_specific_settings`, `background.scripts`) chỉ sửa nếu bị chặn.

### 6. Kết quả triển khai v3.5.136
- Ảnh: `assets/images/web-thumbnail-lofi.webp` + 1 dòng `web_accessible_resources`; `thumbnails.js` cho phép tải đường dẫn nội bộ của extension (trước đó bị lọc, ảnh sẽ không hiện). S2 đã xóa.
- Firefox: `data_collection_permissions.required = ["websiteContent", "browsingActivity"]`, không có `optional`.
- Bảng kê khai: `DATA-INVENTORY.md`; nội dung cửa hàng: `STORE-LISTING.md`; chính sách viết lại EN + VI, không ghi endpoint.
- **Xung đột đã báo, người dùng chọn giữ nguyên:** quy tắc 9002 gỡ `X-Frame-Options` và `Content-Security-Policy` của 5 domain AI khi tải trong khung, không giới hạn bên khởi tạo. AMO §4.4: "Add-ons must not relax web page security headers". Thu hẹp bằng `initiatorDomains` từng làm hỏng Grok (v3.5.103). Cần phương án riêng trước khi nộp AMO.
- Công khai trong chính sách: dịch song song tới Google/MyMemory/Lingva; URL nguồn vào trang AI (phần `#` và `sessionStorage`) ngay khi mở panel, trang AI đọc được trước khi Gửi; Inter từ Google Fonts tải trên mọi trang.

---

## 2026-11-06 | Nguyên tắc dữ liệu chung

**Trạng thái:** Đã chốt (áp dụng cho mọi tính năng, hiện có và sắp làm). Repo đang ở v3.5.135.

### 1. Nguyên tắc
1. **Chỉ đọc khi người dùng chủ động dùng tính năng** (bật dịch, bấm nghe, tra từ, ghi âm, bấm Hỏi AI, bấm AI composer…). Không đọc ngầm.
2. **Chỉ gửi phần cần cho việc đó.** Mỗi tính năng tự xác định phần cần gửi.
3. **Không lưu nội dung đã gửi**, trừ những gì người dùng tự lưu (highlight, ghi chú, flashcard…).
4. **Nói rõ dữ liệu đi đâu** trong `PRIVACY-POLICY.md` và trang cửa hàng.
- Tính năng tuân thủ 4 điều trên là hợp lệ; không gọi là "ngoại lệ".
- Thay cho cách hiểu cũ "không đọc nội dung trang": điều đó chỉ là cách Hỏi AI áp dụng nguyên tắc (phần cần thiết = đoạn bôi đen + URL). Quy tắc riêng của Hỏi AI vẫn giữ: không tự gom nội dung/tiêu đề trang vào prompt, không đọc clipboard.

### 2. Bảng dữ liệu gửi ra ngoài (rà theo code v3.5.134)

| Tính năng | Đọc/gửi khi nào | Gửi gì | Gửi cho ai |
|---|---|---|---|
| Dịch song ngữ | Người dùng bật dịch | Đoạn văn cần dịch | Google Dịch (`translate.googleapis.com`, `clients5.google.com`); dự phòng MyMemory, Lingva |
| TTS (đọc to) | Người dùng bấm nghe | Câu/đoạn cần đọc | Google Translate TTS (`translate.google.com/translate_tts`) hoặc giọng đọc của trình duyệt (`speechSynthesis`; có giọng chạy trên máy, có giọng gửi lên máy chủ của trình duyệt) |
| Từ điển | Người dùng tra từ | Từ cần tra | `api.dictionaryapi.dev`, `api.datamuse.com` |
| Nhận dạng giọng nói (Shadowing, Speaking) | Người dùng ghi âm | Âm thanh giọng nói | Dịch vụ nhận dạng của trình duyệt (Chrome gửi lên Google) |
| Phụ đề video | Người dùng mở video trong Keepit | ID video | YouTube (`youtubei/v1/player`, timedtext), chính nơi phát video |
| Ảnh thu nhỏ video đã lưu | Mở Dashboard | ID video | Máy chủ ảnh YouTube (`i.ytimg.com`) |
| Tìm video trên Dashboard | Người dùng bấm tìm | Từ khóa | Trang kết quả YouTube (người dùng tự mở) |
| Hỏi AI | Người dùng bấm Hỏi AI | Đoạn bôi đen + URL nguồn | AI đang chọn (ChatGPT/Gemini/Claude) |
| AI composer (dự định) | Người dùng bấm nút composer | Mail hoặc chuỗi mail đang mở | AI đang chọn |

- Khi phát hành tính năng mới gửi dữ liệu ra ngoài: thêm dòng vào bảng này và cập nhật `PRIVACY-POLICY.md`.
- Việc cần làm: đối chiếu `PRIVACY-POLICY.md` với bảng này (chậm nhất khi phát hành AI composer).

---

## 2026-11-06 | AI composer (gợi ý trả lời mail, viết mail)

**Trạng thái:** Đã chốt hướng (Cách B), chưa triển khai, chưa có spec chi tiết.

### 1. Mục tiêu
- Nút **AI composer** giúp trả lời mail hoặc viết mail mới bằng AI panel (ChatGPT/Gemini/Claude) có sẵn, không cần API key riêng.

### 2. Cách lấy nội dung
- **Cách B (đã chọn), Gmail/Outlook:** khi người dùng bấm nút composer, Keepit đọc **mail hoặc chuỗi mail đang mở** (chỉ phần đó) để AI gợi ý trả lời. Tuân thủ Nguyên tắc dữ liệu chung.
- **Cách A, mọi trang khác:** người dùng bôi đen nội dung rồi chọn AI composer (giống Hỏi AI).

### 3. Luồng
- Nút nhỏ cạnh ô soạn thư Gmail/Outlook; không chèn nút vào mọi ô nhập trên web.
- Chọn việc: **Trả lời**, **Viết mới từ ý chính**, **Viết lại đoạn đã chọn**, **Dịch sang ngôn ngữ người nhận**; giọng văn: trang trọng / thân thiện / ngắn gọn.
- Keepit soạn prompt (mail gốc + yêu cầu) → gửi AI panel theo pipeline gửi hiện có (bấm composer là hành động Keepit rõ ràng → theo quy tắc tự gửi opt-in hiện có).
- Nút **"Chèn vào mail"**: chỉ điền nội dung vào ô soạn thư, **không bao giờ tự bấm gửi mail**.

### 4. Điểm khác biệt
- "Viết xong thì học luôn": giải thích vì sao AI sửa câu, lưu cụm từ hay thành flashcard, nối với trang Luyện viết.

### 5. Rủi ro
- Nội dung mail đi qua nhà cung cấp AI → ghi rõ trong giao diện và `PRIVACY-POLICY.md`; Keepit không lưu.
- Gmail/Outlook hay đổi giao diện → nút cạnh ô soạn thư cần bảo trì.

### 6. Câu hỏi còn mở
1. Lấy câu trả lời của AI để "Chèn vào mail": đọc trực tiếp từ khung AI hay người dùng tự copy?
2. Hỗ trợ những dịch vụ mail nào ở bản đầu (Gmail, Outlook web, khác)?
3. Danh sách việc và giọng văn: cố định hay cho người dùng tự thêm prompt?
4. Thứ tự đề xuất: AI composer bản tối giản → Dịch PDF → OCR → Luyện viết/nói (người dùng chưa chốt).

---

## 2026-11-06 | Ý tưởng khác (chưa chọn)

**Trạng thái:** Ghi lại để cân nhắc, chưa chốt. Kiểm tra trùng với tính năng hiện có trước khi làm.

1. **Một chạm lưu thành flashcard:** từ trong từ điển, câu đã highlight, cụm từ AI gợi ý → flashcard, kèm câu ví dụ từ chỗ đang đọc.
2. **Ôn tập mỗi ngày:** nhắc ôn flashcard theo lặp lại ngắt quãng (popup hoặc trang tab mới).
3. **Xuất sang Anki.**
4. **Đồng bộ nhiều máy:** sao lưu thư viện vào Google Drive của người dùng.
5. **Đọc to đoạn đã chọn trên mọi trang:** Keepit đã có TTS; chỉ làm nếu hiện chưa hỗ trợ, bằng cách mở rộng TTS đang có.

---

## 2026-11-06 | Dịch PDF và OCR

**Trạng thái:** Đã chốt hướng, chưa triển khai, chưa có spec chi tiết. Repo đang ở v3.5.135. Chưa ghi vào mô tả cửa hàng cho tới khi phát hành.

### 1. Mục tiêu
- **Dịch PDF:** mở PDF trong Keepit, dịch song ngữ, highlight và ghi chú như trên web.
- **OCR:** khoanh một vùng trên trang, nhận dạng chữ trong ảnh, rồi dịch hoặc gửi Ask AI.
- Thứ tự: v3.5.133 đổi tên → Dịch PDF → OCR (kèm dịch PDF scan). Vị trí so với Luyện viết/nói: người dùng chưa quyết.

### 2. Dịch PDF
- Extension không chạy được trong trình xem PDF mặc định của Chrome và Firefox → Keepit có **trang xem PDF riêng**, dùng PDF.js đóng gói trong extension (không tải từ CDN).
- Vào trang Keepit: nút "Mở bằng Keepit" khi gặp PDF. Tự chuyển hướng sang trang Keepit: cần cân nhắc thêm, chưa chốt.
- Dùng lại bộ dịch song ngữ, highlight, ghi chú hiện có trên lớp chữ của PDF.js.
- Khó nhất: hiện bản dịch song ngữ không làm vỡ bố cục trang; lưu highlight theo file + trang + vị trí chữ.
- File trên máy (`file://`) cần người dùng bật quyền truy cập URL tệp.
- Hạn chế: PDF scan (ảnh) không có lớp chữ → chờ OCR.

### 3. OCR
- Người dùng khoanh vùng → chụp tab hiện tại (`captureVisibleTab`, quyền `activeTab` đã có) → cắt vùng → nhận dạng → bộ dịch hoặc Ask AI.
- Engine: Tesseract.js (WASM) chạy trong trình duyệt, ảnh không gửi ra ngoài. CSP cần `'wasm-unsafe-eval'`.
- Dữ liệu ngôn ngữ (Anh, Việt, Hàn…) tải khi cần, lưu IndexedDB, kiểm tra trước khi dùng, tải lại nếu mất. **Dùng chung bộ tải mô hình với Whisper** (xem bản ghi Luyện viết/nói §6.2).
- Hạn chế: chữ in rõ tốt; chữ viết tay, cách điệu, ảnh mờ kém.
- Sau khi có OCR: dịch PDF scan bằng OCR từng trang.

### 4. Câu hỏi còn mở
1. Làm PDF/OCR trước hay sau Luyện viết/nói?
2. PDF: chỉ nút "Mở bằng Keepit" hay tự chuyển hướng (có tuỳ chọn tắt)?
3. PDF: hiện bản dịch kiểu nào (xen dưới đoạn, cột song song, hay bảng bên)?
4. OCR: phím tắt / nút ở thanh chọn / menu chuột phải; ngôn ngữ OCR mặc định theo ngôn ngữ nguồn?

---

## 2026-11-06 | Tên, slogan và mô tả cửa hàng

**Trạng thái:** Đã triển khai ở v3.5.133; phần hiển thị sửa ở v3.5.134.

- **Tên extension:** "Keepit - Translate, Learn, Ask AI" (33 ký tự; Chrome tối đa 75, Firefox 50). Ba từ khóa = ba nhu cầu: dịch, học, AI. Không thêm từ khóa.
- **Slogan:** "Keep Exploring Everything" (không dấu chấm). Định vị dài hạn: khám phá và học mọi nội dung trên Internet; tên ưu tiên từ khóa tìm kiếm.
- **Hiển thị (v3.5.134):** popup = "Keepit - Keep Exploring" + slogan; Dashboard (tab, Giới thiệu), sidebar Highlight = "Keepit - Keep Exploring"; nhãn logo Dashboard 2 dòng "Keepit" / "Keep Exploring" (khung ~130px); header AI panel Chrome/Firefox, trang Tiện ích, tooltip toolbar = tên extension "Keepit - Translate, Learn, Ask AI".
- **Mô tả Chrome (manifest, tối đa 132):** "Translate web pages bilingually. Highlights, notes, dictionary, video player, Ask AI, speaking and listening practice, flashcards."
- **Tóm tắt Firefox (AMO, tối đa 250, dán tay):** "Translate web pages side by side. Highlight, take notes, look up words, turn pages into a video player, ask AI, and practice speaking, listening, dictation and flashcards."
- **Mô tả dài cửa hàng:** theo bản đồ hệ sinh thái, chỉ ghi tính năng đã có.
- **Quy tắc:** chỉ mô tả tính năng đã phát hành (PDF, DOCX, OCR, dịch ảnh thêm vào khi phát hành); không dùng "&" trong tên (Chrome nuốt ở header side panel); không ghi ChatGPT/Gemini/Claude trong tên.
- **Đã loại:** "Keepit - Keep Exploring" (không nói tính năng, khó tìm); "Language Learning" trong tên (thu hẹp thành app học ngoại ngữ).
- Nguồn giới hạn: https://extensionlaunch.com/blog/chrome-extension-manifest-json ; https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Listing

---

## 2026-11-06 | Luyện viết, Luyện nói trên Dashboard và nhận dạng giọng nói

**Trạng thái:** Đã chốt ý tưởng, chưa triển khai, chưa có spec chi tiết. Repo đang ở v3.5.120.

### 1. Mục tiêu
- Thêm 2 trang vào Dashboard: **Luyện viết** và **Luyện nói**.
  - Đề ở trên, phần làm bài ở dưới.
  - Bấm **Gửi** thì AI panel mở bên cạnh và chấm theo prompt soạn sẵn cho đề đó.
- Admin cập nhật đề cho mọi người dùng **mà không phải hardcode đề vào code** và không phải ra bản mới.
- Hai trang dùng chung một khung. Chỉ khác phần nhập bài: ô viết hoặc khung ghi âm.

### 2. Trang Luyện viết
- Bố cục: chọn đề → đề bài → ô viết (có đếm số từ) → nút **Gửi**.
- Gửi: ghép **prompt chấm + đề + bài viết** thành một tin nhắn, mở AI panel, điền vào provider đang dùng (ChatGPT / Gemini / Claude, theo provider dùng lần cuối).

### 3. Trang Luyện nói
- Bố cục: chọn đề → đề bài → đếm ngược chuẩn bị / nói (kiểu IELTS, lấy từ cột Sheet) → ghi âm → transcript → nút **Gửi**.
- **Ghi âm và nhận dạng:** dùng lại cơ chế của Shadowing (`js/overlay/study/shadowing/shadowing-activity.js`: `SpeechRecognition` + `MediaRecorder`).
  - Phần lõi ghi âm + nhận dạng được **tách thành module chung** cho Shadowing và Luyện nói gọi, không chép code.
  - Khi tách phải kiểm tra lại Shadowing để không hỏng.
- **AI chấm trên chữ (transcript), không phải trên âm thanh.**
  - AI panel chỉ điền chữ. Không tự đính kèm file âm thanh vào provider (dễ hỏng; Claude không nhận audio).
  - AI chấm được: nội dung, ý, từ vựng, ngữ pháp, độ mạch lạc.
  - AI không chấm thật được: phát âm, ngữ điệu, độ trôi chảy.
  - Keepit gửi kèm số liệu tự đo: thời lượng nói, số từ, số từ/phút.
  - Prompt chấm ghi rõ "đây là bản nhận dạng tự động, có thể đã bị sửa hoặc nghe nhầm".
- **Câu trả lời dài** (ví dụ IELTS Part 2, 2 phút): phải tự nối lại khi trình duyệt ngắt nhận dạng giữa chừng. Shadowing hiện chỉ xử lý từng câu ngắn.

### 4. Khung dùng chung cho hai trang
- Chọn đề theo cấp **Bộ đề (file) → Nhóm (tab) → Đề (dòng)**.
- **Đề của tôi:** người dùng tự thêm đề, lưu trong máy (`storage.local`), hiện chung danh sách với đề từ Sheet.
- **Nhờ AI ra đề:** mở AI panel với prompt ra đề.
  - Keepit **không đọc** câu trả lời của AI (quy tắc không đọc nội dung trang). Người dùng tự chép đề vào "Đề của tôi".
- Gửi sang AI panel theo quy tắc hiện có (xem mục 7).
- Nút **Cập nhật đề** để lấy đề mới ngay, không phải chờ lần cập nhật hằng ngày.

### 5. Nguồn đề: folder Google Drive + Mục lục tự động (Apps Script)

#### 5.1. Cấu trúc phía admin
```text
Folder đề (link cố định, "Bất kỳ ai có đường liên kết đều xem được")
├── Viet/                      ← đề Luyện viết
│   ├── IELTS Writing          (Google Sheet = Bộ đề)
│   │   ├── Task 2 – Education (tab = Nhóm; mỗi dòng = 1 đề)
│   │   ├── Task 1 – Charts
│   │   ├── Prompt             (tab đặc biệt: prompt chấm chung cho file)
│   │   └── _nhap              (tab bắt đầu bằng "_" → bỏ qua, dùng làm nháp)
│   └── TOEIC Writing
└── Noi/                       ← đề Luyện nói (cùng quy ước)

File Mục lục (Google Sheet, link cố định, nằm ngoài folder đề; nếu nằm trong thì script bỏ qua)
└── Apps Script hẹn giờ ghi lại toàn bộ file + tab
```
- Chỉ dùng **Google Sheet**, một định dạng duy nhất.
- Admin chỉ cần: upload file mới, thêm tab vào file cũ, sửa hoặc xoá dòng, xoá file. Link trong Keepit **không bao giờ đổi**.
- Folder con `Viet` / `Noi` cho biết kỹ năng (đang đề xuất, chờ chốt).

#### 5.2. Cột của mỗi tab đề
| Cột | Ý nghĩa |
|---|---|
| `id` | Mã đề, **không trùng trong toàn bộ folder**, không đổi sau khi đăng (ví dụ `ielts2-edu-001`). Dùng để giữ cuộc trò chuyện AI riêng của từng đề. Trùng thì lấy bản trong file sửa gần nhất. |
| `de_bai` | Nội dung đề. |
| `loai` | Loại đề (IELTS Task 2, Email, Part 2…). |
| `cap_do` | Cấp độ / band mục tiêu. |
| `so_tu_toi_thieu` | Luyện viết: số từ tối thiểu. |
| `thoi_gian_chuan_bi`, `thoi_gian_noi` | Luyện nói: giây chuẩn bị và giây nói. |
| `prompt_cham` | Tuỳ chọn. Prompt riêng cho đề, được ưu tiên hơn tab `Prompt`. |
| `hien` | `FALSE` = ẩn đề. Xoá dòng, tab hoặc file thì đề cũng biến mất. |

#### 5.3. Apps Script (chạy trên tài khoản Google của admin)
- Admin dán script vào file Mục lục (Tiện ích mở rộng → Apps Script) và chạy lần đầu để cấp quyền. Thông báo "ứng dụng chưa được xác minh" là bình thường với script của chính mình.
- Script tự cài **hẹn giờ** (mặc định mỗi giờ, chờ chốt) và thêm menu **Keepit → Cập nhật mục lục** để cập nhật ngay.
- Mỗi lần chạy, script quét folder (kể cả `Viet` / `Noi`) và ghi vào Mục lục mỗi tab một dòng: kỹ năng, ID file, tên file, tên tab, `gid`, thời điểm sửa cuối.
  - Bỏ qua tab `_…` và chính file Mục lục.
- Không phụ thuộc số người dùng: script chỉ chạy theo giờ, mỗi lần vài giây.

#### 5.4. Phía Keepit
- Keepit giữ cố định link Mục lục. Mỗi ngày một lần, khi người dùng mở Dashboard (không cần quyền `alarms`), Keepit:
  1. đọc Mục lục;
  2. chỉ tải lại tab có thời điểm sửa thay đổi, dạng **CSV theo `gid`** (`/export?format=csv&gid=…`).
     - Không dùng `gviz`: `gviz` tự đoán kiểu cột nên cột trộn số và chữ có thể mất ô.
  3. lưu bản sao trong máy. Mất mạng hoặc Google lỗi thì dùng bản đã lưu.
- Không cần quyền mới, vì manifest đã có `<all_urls>`.
- Tải không kèm cookie (`credentials:"omit"`). Không gửi gì của người dùng lên Google.
- Nội dung Sheet chỉ hiển thị **dạng chữ** (không render HTML, không chạy code), có giới hạn độ dài; dòng lỗi thì bỏ qua.
- Chỉ admin có quyền sửa folder và Mục lục. Ai sửa được Sheet là sửa được đề và prompt của mọi người dùng.
- `PRIVACY-POLICY.md` thêm một dòng: Keepit tải danh sách đề từ Google Sheets, nên Google thấy IP người tải.

#### 5.5. Phương án đã loại
| Phương án | Lý do loại |
|---|---|
| Xuất bản Sheet lên web dạng CSV | Không cần: file chia sẻ theo link là đọc CSV/`gviz` được rồi. |
| Google Drive API + Sheets API (API key) | Phải có dự án Google Cloud và key nằm trong code. Miễn phí trong hạn mức (Sheets 300 lượt đọc/phút/dự án; Drive 400 triệu đơn vị/ngày), nhưng Google dự kiến tính phí phần vượt hạn mức từ cuối 2026. Mục lục tự động đã đủ, nên không cần. |
| API mặc định, Mục lục làm dự phòng | Keepit không có máy chủ nên không báo được cho admin khi người dùng vượt giới hạn, Mục lục ghi tay sẽ cũ. Mục lục tự động giải quyết luôn. |
| Mục lục ghi tay | Admin phải thêm dòng mỗi khi có file hoặc tab mới. Đã thay bằng Apps Script. |
| Đọc trang HTML của folder (`embeddedfolderview`) | Không chính thức, Google đổi giao diện là hỏng. |
| Apps Script dạng web app (mỗi người dùng gọi script) | Dễ chạm giới hạn thời gian chạy của tài khoản thường khi có nhiều người dùng. Kiểu hẹn giờ thì không. |
| Keepit tự sinh đề bằng AI và tự lưu | Keepit không có API AI riêng và không đọc câu trả lời trong AI panel. Thay bằng nút "Nhờ AI ra đề" + người dùng tự chép. |

### 6. Nhận dạng giọng nói: Firefox và dự phòng cho Chrome

#### 6.1. Thứ tự nhận dạng
```text
Luôn ghi âm song song (MediaRecorder) để có thể nhận dạng lại mà không bắt người dùng nói lại

Chrome / Edge
  1. Web Speech qua mạng (mặc định, chữ hiện trong lúc nói)
        │ lỗi (mạng, dịch vụ bị chặn, không có kết quả…)
        ▼
  2. Web Speech trên máy của Chrome (processLocally; SpeechRecognition.available()/install())
     nếu có gói ngôn ngữ (do Chrome tự tải và quản lý)
        │ không có / lỗi
        ▼
  3. Whisper trên máy, chạy trên bản ghi âm (cần đã tải model, nếu chưa thì mời tải)

Firefox (không có SpeechRecognition)
  → Whisper trên máy, chạy trên bản ghi âm sau khi bấm dừng
```
- Tuỳ chọn riêng tư: người dùng Chrome có thể chọn Whisper làm mặc định để giọng nói không rời khỏi máy.

#### 6.2. Kiến trúc Whisper
```text
Keepit Extension (chứa sẵn code: transformers.js + ONNX Runtime WASM)
       │  Người dùng bấm "Tải mô hình"
       ▼
Hugging Face (ghim đúng một phiên bản model)
       │  Tải các file model ONNX → kiểm tra SHA-256 từng file
       ▼
IndexedDB của trình duyệt (Firefox/Chrome)
       │
       ▼
Whisper chạy trên thiết bị, trong Web Worker của trang Dashboard
(audio: giải mã → 16 kHz mono → nhận dạng)
```
- **Model là dữ liệu, được tải từ ngoài.** **Engine WASM là code, phải nằm trong ZIP**, vì MV3 cấm tải code từ xa.
- CSP `extension_pages` thêm `'wasm-unsafe-eval'`. Đây không phải quyền mới, trình duyệt không hỏi lại người dùng.
- Kích thước (đo thực tế từ Yap Voice Typing 1.1.0, cùng kiến trúc):
  - Engine `ort-wasm-simd-threaded.asyncify.wasm`: 26,86 MB chưa nén, 6,78 MB trong ZIP.
  - `transformers.min.js`: 0,58 MB.
  - Cả gói Yap: 7,03 MB.
- Ước tính cho Keepit: ZIP từ 1,05 MB lên khoảng 8 MB; sau khi cài từ 3,9 MB lên khoảng 31 MB. Model không nằm trong ZIP.
- Lưu trữ:
  - IndexedDB không bền tuyệt đối (người dùng xoá dữ liệu, trình duyệt thu hồi bộ nhớ, gỡ extension).
  - Keepit đã có `unlimitedStorage` nên ít bị thu hồi hơn.
  - Vẫn **kiểm tra model trước khi dùng** và cho **tải lại**.
  - Cập nhật extension không phải tải lại model nếu phiên bản model không đổi.
- Model: dự kiến bản chỉ-tiếng-Anh (`whisper-tiny.en` / `whisper-base.en`), có thể cho chọn Tiny hoặc Base.
  - Tiny nhẹ và nhanh nhưng yếu với giọng chưa chuẩn; Base nặng gấp khoảng đôi và chính xác hơn.
  - Đo kích thước thật khi làm.
- Firefox AMO: thư viện kèm theo phải là bản gốc chính thức, chưa chỉnh sửa; ghi nguồn và license (transformers.js Apache-2.0, ONNX Runtime MIT, Whisper MIT) vào `THIRD_PARTY_NOTICES.md`.

#### 6.3. Giới hạn đã biết
- Whisper không hiện chữ trong lúc nói. Nói xong phải chờ vài giây đến vài chục giây tuỳ máy và model; bản ghi dài được chia đoạn 30 giây.
- Whisper (và cả Chrome) hay "làm đẹp" lời nói: bỏ "ừm, à", sửa lỗi nhỏ, đôi khi bịa chữ ở đoạn im lặng. Bản chữ có thể tốt hơn thực tế người học nói.
- Shadowing dùng Whisper để sau.
  - Shadowing chạy trong trang web: Chrome cần trang ẩn `offscreen` (quyền mới nhưng không hiện cảnh báo); Firefox cần cách riêng.
  - iframe extension chèn trong trang không chạy đa luồng được.

### 7. Quy tắc gửi AI panel áp dụng cho hai trang (theo quy tắc hiện có)
- Bấm Gửi là thao tác Keepit tường minh, nên **theo nút "Tự động gửi"** hiện có: tắt thì chỉ điền sẵn, người dùng tự bấm gửi.
- **Không gắn URL nguồn**, vì trang Dashboard không phải trang web.
- **Mỗi đề một cuộc trò chuyện riêng** theo `id`. Chỉ lưu liên kết đề → cuộc trò chuyện sau khi đã gửi thành công.
- Không đọc câu trả lời hay điểm chấm của AI về Dashboard. Kết quả chỉ nằm trong AI panel.
- Dashboard là trang extension nên bấm Gửi được tính là thao tác trực tiếp của người dùng. Có khả năng mở được AI panel cả trên Firefox (`sidebarAction.open`), cần thử trên trình duyệt thật.

### 8. Câu hỏi còn mở
1. Prompt chấm chỉ lấy từ Sheet, hay người dùng được ghi đè trong Cài đặt (Sheet làm mặc định)?
2. Có lưu lịch sử bài viết / bài nói đã gửi không (đề, transcript hoặc bài, ngày gửi)?
3. Vị trí hai trang trong sidebar Dashboard.
4. Tần suất hẹn giờ của Apps Script (đề xuất mỗi giờ).
5. Dùng 2 folder con `Viet` / `Noi`?
6. Luyện nói: người dùng có được sửa transcript trước khi gửi không? Có nghe lại bản ghi không (chỉ giữ tạm, không lưu)?
7. Whisper: chọn Tiny / Base / cho người dùng chọn; chỉ tiếng Anh hay đa ngôn ngữ; nút "Tải mô hình" đặt trong Cài đặt hay hiện ở trang Luyện nói.
8. Thứ tự làm đề xuất: spec → Luyện viết + nguồn đề → Luyện nói (Web Speech) → Whisper → Shadowing dùng Whisper.

### 9. Tham khảo đã dùng khi chốt
- Giới hạn Sheets API: https://developers.google.com/workspace/sheets/api/limits
- Giới hạn Drive API: https://developers.google.com/workspace/drive/api/guides/limits
- Nhận dạng trên máy của Web Speech: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/available_static
- CSP `wasm-unsafe-eval` và engine ONNX trong extension MV3: https://dev.to/dannickstark/running-llms-inside-a-chrome-extension-webllm-transformersjs-and-the-mv3-traps-1d5
- Whisper trong extension (offscreen, ghim phiên bản + SHA-256): https://dev.to/wafolders/rodando-whisper-no-navegador-para-transcrever-audios-do-whatsapp-web-sem-servidor-3hao
- Gói Yap Voice Typing 1.1.0 (AMO): https://addons.mozilla.org/firefox/addon/yap-voice-typing-dictation/
