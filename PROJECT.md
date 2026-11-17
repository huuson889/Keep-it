# Keepit - Hồ sơ dự án

## 1. Trạng thái hiện tại
- Version **3.5.365**, nhánh `Keepit-Optimize-Test`; dịch văn bản dài tự chia thành mẩu tối đa 450 ký tự rồi ghép lại, áp dụng cả BILINGUAL, dictionary text dài và Study Notes. Thanh điều khiển dưới Documents mờ mặc định, sáng khi hover/focus; giữ nguyên toàn bộ JS Documents (CSS-only để giảm rủi ro). Reader tiếp tục bỏ đọc header/footer được đánh dấu/lặp; nội dung vẫn hiện trên trang.
- Sửa tích hợp: demo chỉ chốt bố cục; Reader, chọn chữ/Full Dictionary, popup/sidebar Ghi chú và AI dùng đúng module UI/controller của app, không giữ bộ riêng trong Tài liệu.
- Ghi chú v314 chuyển vào annotations chung, giữ quote/anchor/ngày, không nhân bản; hiện ở H&N/Flashcards/JSON backup. Byte tệp vẫn ngoài backup. Tham chiếu tệp là UUID cục bộ, không phải hash gửi tới AI.
- Chromium extension thật PASS native UI/CRUD/restore/migration/deep link/backup, Reader qua trang/card, touch selection/Notes/AI sheet; web + homepage regression PASS. AI login/send/voice thật và Firefox/Edge Android thật vẫn chưa xác nhận.
- Office preview có giới hạn phông/đối tượng; OCR chưa có. Các QA cũ và giới hạn khác giữ ở mục 2, kiến trúc ở mục 4 và `docs/documents.md`.

## 2. Việc đang mở / Tiếp theo (sửa đè)
### Dịch dài, Documents Reader — v3.5.365
- Thanh pager Documents: CSS-only thay đổi; cần browser-test. Bản trước từng thử gỡ timer trong JS nhưng đã rollback phần đó để tránh ảnh hưởng mở tệp.
- Cần thử bản dịch thật >500 ký tự qua Reader, đoạn chọn dài và DOCX/PDF; xác nhận chunk được ghép tự nhiên, cache và dấu xuống dòng đúng. Unit test split/round-trip <450 ký tự PASS; chưa gọi API thật.
- Reader header/footer skip từ v3.5.362 vẫn cần browser-test trên PDF/DOCX/PPTX thật.
- Cần kiểm tra PDF nhiều trang: thumbnail hiển thị khi vào vùng nhìn thấy của rail, các trang ngoài vùng chưa render; cuộn rail xuống tải nốt; click trang và đổi flow không sai trang. Chưa browser-test.
- Cần kiểm tra trên tài liệu thật: app font áp dụng đúng cho UI, font/bố cục nguyên bản của nội dung không bị ghi đè; popup Dịch và tự dịch vào ghi chú hoạt động trong nhiều file. Chưa browser-test sau sửa.
- Cần xác nhận trên PDF thật khi Cuộn theo tệp bật: tâm đoạn PDF và tâm card gốc + dịch trùng nhau khi cuộn liên tục/trang đơn và bản dịch tải muộn. Chưa browser-test.
- Cần xác nhận double-click khi Reader đang chạy/tạm dừng nhảy và tiếp tục đúng đoạn trên web, Documents PDF (nhiều span/trang), và Read mode. Chưa browser-test.
- Cần xác nhận speaker icon PDF Original bằng Chrome thật: hover trên text và vùng paragraph, setting always/hover, click-to-read, auto-scroll, vị trí/kích thước. Chưa browser-test.
- Cần xác nhận trên Documents thật: panel Bản dịch có mặc định 1.5× theo breakpoint và giữ bề rộng đã lưu; hai dòng nguồn/bản dịch là 12px, giảm 1px so với trước. Chưa browser-test.
- Cần xác nhận PDF bảng thật: một mục dịch với newline mỗi hàng/` | ` giữa ô; Reader đọc tuần tự theo hàng, không tô hàng. Chưa browser-test; synthetic geometry test đạt.
- Cần xác nhận với tài liệu thật ở theme sáng/tối: màu bản dịch dễ đọc và cỡ chữ khớp nguồn. Chưa browser-test UI.
- Cần xác nhận trên Firefox và Edge Android thật: chọn/kéo thả tệp, worker PDF, text layer, DOCX/PPTX phức tạp, nguồn có phông đặc biệt, giọng thực tế và AI panel đã đăng nhập. Kết quả thiết bị thật là nguồn sự thật; headless không thay xác nhận này.
- OCR, XFA, chỉnh sửa biểu mẫu PDF và hiệu ứng/đối tượng Office nâng cao chưa có. Bộ đọc Office là preview; dùng PDF tĩnh khi cần trang chính xác.
- Byte tệp/thư viện chưa nằm trong JSON backup/cloud. Notes đã dùng annotations/backup chung ở v315; không đánh dấu backup blob đã hoàn tất.

### Tái cấu trúc cây thư mục (xong ở v3.5.199)
- Theo `OPT-ARENA.md`, bản ghi 2026-10-23 "Tái cấu trúc cây thư mục…". Trước mỗi bước phải đọc lại toàn bộ bản ghi đó. 5 bước, mỗi bước một phiên bản. Bước 1 (dọn tài liệu, gộp `search.js`) xong ở v3.5.192; bước 2 (`theme-tokens.js`, tách CSS thanh/Reader, đổi tên `keepit-bar.js`, nhãn thanh sang `languages.js`) xong ở v3.5.193; bước 3 (danh sách tính năng overlay cũ ↔ mới, trong bản ghi OPT) ở v3.5.194; người dùng duyệt bỏ cả 5 mục; bước 4 (CSS overlay cũ, `overlay-engine.js`, xoá `view/`) ở v3.5.195. Bước 5 chia 5a–5d vì luật "không vừa chuyển file vừa xoá code": 5a (xoá `study/dictation/`, `study/shadowing/`, `createStudyUi`, hover-pause) ở v3.5.196; 5b (markup cũ + chỗ ghi vào đó) ở v3.5.197; 5c (nhãn `unified-text.js`, `offline-page.js` sang `languages.js`) ở v3.5.198; 5d (đổi tên thư mục, gộp `dictation.md`) ở v3.5.199.

### Áp dụng nguyên tắc giao diện (`docs/ui-layout.md`)
- (1) Overlay: xong ở v3.5.171 (demo v18). Còn lại, mỗi bước 1 bản: (2) Reader + thanh Keepit; (3) Dashboard + popup dịch/từ điển dạng sheet. Ghi chú cũ: Thứ tự đề xuất, mỗi bước 1 bản: (1) Overlay — demo overlay đồng bộ v2 theo nguyên tắc (demo v1 `keepit-overlay-unified-demo-v1.html` còn 3 lớp bề rộng, chưa duyệt) + tim nhấp đúp video trên máy tính; (2) Reader + thanh Keepit; (3) Dashboard (bỏ mức tablet) + popup dịch/từ điển dạng sheet khi màn dọc trên mọi trang.

### Luyện viết / Luyện nói (ý tưởng)
- Đã chốt ý tưởng, chưa có spec và chưa code; câu hỏi còn mở ở `OPT-ARENA.md` (bản ghi 2026-11-06 §8). Bước kế tiếp: viết spec để người dùng duyệt.

### AI panel providers
- v3.5.134 browser QA chưa chạy: popup "Keepit - Keep Exploring" + slogan; Dashboard tab/Giới thiệu "Keepit - Keep Exploring", logo "Keepit" / "Keep Exploring"; sidebar Highlight "Keepit - Keep Exploring" không bị cắt. v3.5.133 browser QA chưa chạy: popup "Keepit" + "Keep Exploring Everything"; Dashboard (logo, tab, Giới thiệu) và sidebar Highlight "Keepit"; header AI panel Chrome/Firefox, tooltip nút toolbar, trang Tiện ích "Keepit - Translate, Learn, Ask AI"; mô tả mới ở trang Tiện ích. v3.5.132 browser QA chưa chạy: popup toolbar hiện "Keepit - Keep Exploring" + "Keep Explore Everything"; Dashboard (logo, tab trình duyệt, Giới thiệu), header sidebar Highlight, header AI panel Chrome/Firefox, tooltip nút toolbar, trang Tiện ích đều dùng tên mới; chữ không bị tràn. v3.5.131 browser QA chưa chạy: header AI panel Chrome và Firefox đều hiện logo Keepit + "Keepit - Translate and Highlight Notes" (không mất chữ giữa "Translate" và "Highlight"). v3.5.130: người dùng yêu cầu Chrome/Firefox đồng bộ. v3.5.129 browser QA chưa chạy: Hỏi AI/Alt+X (panel đang mở và vừa mở) → caret nhấp nháy ở cuối nháp, gõ được ngay; sau đó Ctrl+A, phím mũi tên, click giữa nháp không bị kéo về cuối; 3 AI. v3.5.128: người dùng xác nhận ghi đè nháp đúng. v3.5.128 browser QA chưa chạy: gõ nháp vào ô chat (ChatGPT/Gemini/Claude) → Alt+X đóng/mở hoặc Hỏi AI → nháp bị thay bằng prompt mới, không còn toast "Composer… đã có nội dung"; đổi tab/source bị động không tạo prompt. v3.5.127 browser QA chưa chạy: Claude chưa đăng nhập → lớp phủ gần như ngay khi banner lỗi nhúng hiện; Claude đã đăng nhập có banner cảnh báo (giới hạn dùng…) → không bị lớp phủ. v3.5.126: người dùng xác nhận đúng, Claude chậm hơn 2 AI kia. v3.5.126 browser QA chưa chạy: Claude chưa đăng nhập → lớp phủ khoảng 1 giây sau khi trang thông báo tải xong; Claude đã đăng nhập, mạng chậm → không nháy lớp phủ nhầm. v3.5.125: người dùng xác nhận hoạt động đúng, chỉ Claude chậm. v3.5.125 browser QA chưa chạy: Claude chưa đăng nhập → ~5 giây có lớp phủ "chưa hiện ô chat" + [Mở tab đăng nhập] → đăng nhập xong tự tải lại, lớp phủ tắt; 3 AI đã đăng nhập, mở trang cài đặt/dự án trong panel → không bị lớp phủ. v3.5.124: người dùng xác nhận ChatGPT/Gemini hết lớp phủ nhầm; Claude chưa đăng nhập không có lớp phủ (sửa ở v3.5.125). v3.5.123: người dùng báo lớp phủ `left-site` nhầm trên cả 3 AI đã đăng nhập (đã sửa ở v3.5.124). v3.5.123 browser QA chưa chạy: Claude chưa đăng nhập trong panel → sau ~5 giây có lớp phủ "chưa hiện ô chat" + [Mở tab đăng nhập] → đăng nhập xong panel tự tải lại; ChatGPT/Gemini đã đăng nhập hoặc khách không bị lớp phủ nhầm; trang cài đặt/dự án không bị. v3.5.122: người dùng xác nhận ChatGPT và Gemini đăng nhập đúng. v3.5.121 (người dùng: ChatGPT đúng) phần còn lại chưa chạy (Chrome + Firefox ≥147): Firefox sidebar hiển thị AI trong iframe dưới thanh 25px, đổi tab AI/đổi source/Hỏi AI như Chromium; nút Chat mới cho ChatGPT/Gemini/Claude; Send ở chat mới/chat khác thêm nhãn + URL một lần rồi lần sau mở đúng chat đó; bấm đăng nhập trong panel → tab mới + lớp phủ chờ → tự tải lại khi đăng nhập xong hoặc đóng tab; AI tự hiện trang đăng nhập → lớp phủ có nút, không tự mở tab; Google sign-in của Gemini trong tab mới.
- v3.5.113 pipeline chung: người dùng xác nhận luồng chạy đúng. Browser QA chưa chạy: v3.5.119 toolbar chọn chữ (4 dạng, logo theo "Mặc định khi bấm icon", preview hover, migrate Dạng 3→4); v3.5.118 nút cạnh trang ẩn AI panel (Chromium); v3.5.117 nút sao chép liên kết (Chromium panel + Firefox sidebar); v3.5.115 Alt+X đóng panel sau khi để yên >30 giây; v3.5.114 độ dày vạch ngang; v3.5.110 nhớ provider sau refresh/restart; v3.5.109 Firefox route, Claude embed Chromium. Kết quả trình duyệt thật của người dùng là nguồn sự thật.
- v3.5.106 Google auth-frame browser behavior vẫn chưa xác nhận; không thêm quyền, DNR scope hoặc bypass auth.

### Reader ↔ Web TTS shared speed
- Browser QA pending: đổi tốc độ ở Reader rồi mở Web TTS và đổi ngược lại; xác nhận 0.5×/3×, global/per-language và persistence sau reload; xác nhận YouTube, Dictation slow replay 0.6× và Flashcard không đổi. Static/VM checks v3.5.42 đã đạt.

### Web Overlay progress
- Browser QA pending: xác nhận thanh tiến độ chạy trong cue theo tốc độ đọc, dừng/tiếp đúng khi Pause/Play và sang cue kế tiếp; Video không đổi. Web progress VM smoke test v3.5.44 đạt.

### Study activity refactor
- Browser QA pending cho source/activity state names, selector/UI wiring, `LHN_STUDY` với alias cũ và Web shared-rate bridge; xác nhận Web 0.5×–3×, YouTube và Dictation replay giữ nguyên. Static/VM checks v3.5.43 đạt.
- Đã xong ở v3.5.196: `dictation.js` và `shadowing/` (giao diện cũ) đã xoá. Ghi chú cũ: Tiếp tục tách mode-dependent `submit`, cue/progress, keyboard và open/close branches khỏi `js/overlay/study/dictation/dictation.js` sang activity modules/shared shell phù hợp; giữ UI, selectors, behavior và public Overlay contracts. Hiện đã tách DOM/CSS và phần lớn Speaking recognition/recording/feedback; logic lifecycle chung còn trộn với mode handling. Chưa chạy browser QA.

### Kiểm thử trình duyệt
- v3.5.162: chưa chạy trên máy thật. Edge Canary Android: Cài đặt → Giới thiệu → chạm số phiên bản 5 lần → Developer options → Extension install by crx → chọn file `.crx`; tiện ích hiện tên "Keepit - Translate, Learn, Ask AI" v3.5.162, thanh Keepit chạy trên trang. Lưu ý: bản CRX có ID khác bản nạp thư mục (dữ liệu hai bản tách riêng).
- v3.5.161 (mọi thiết bị): chưa chạy trên máy thật. Điện thoại: mở ☰ → vuốt lên một hơi (sheet lên full rồi danh sách cuộn tiếp, không khựng); vuốt xuống: danh sách về đầu trước, rồi sheet theo tay, thả xa thì về half / đóng; vuốt trang ngoài sheet → trang không cuộn. Lặp lại với tìm kiếm, Ghi chú, sheet Reader, Từ điển (ô tìm kiếm → dòng Keepit Dictionary), overlay (tốc độ, chế độ phụ đề, Thêm). Chuyển qua lại vài trang: thanh không chớp/nạp lại. Trang có banner cookie ở đáy: thanh lui thành vạch ở đáy. Máy tính: ☰ có hàng Trình đọc, lăn chuột ngoài popover không cuộn trang; Reader ☰ mở popover chính có Trình đọc ở giữa; overlay tốc độ/phụ đề có ✕.
- v3.5.160 (Edge Android / DevTools cảm ứng): chưa chạy. Mở Reader: cờ và ☰ cách hai mép bằng nhau, chữ thời gian không chạm ⏮. Mở 2–3 tab, ở tab vừa mở vuốt thanh sang phải → về tab trước; ở tab đầu không lịch sử → toast "Không còn trang hay tab trước"; tab có lịch sử thì lùi trang trước rồi mới sang tab. Nút 🔍 nhỏ hơn, icon như cũ. Mở Ghi chú có nhiều mục: cuộn xuống rồi vuốt xuống giữa danh sách → danh sách cuộn lên; ở đầu danh sách vuốt xuống → sheet theo tay và đóng; kéo ít → bật về. ☰ → hàng Trình đọc, bật/tắt khớp với ☰ trong Reader. Trong Reader chạm ☰ → hiện sheet ☰ chính (cuộn tới Trình đọc), chạm vùng mờ đóng, Reader vẫn chạy. Máy tính/tablet ngang: tắt trang → không có hộp "đang tắt".
- v3.5.159 (Edge Android): người dùng xác nhận đã sửa hết. Trước đó: Cuộn lên/xuống liên tục → thanh Keepit (và thanh Reader khi đang đọc) luôn dính sát thanh của Edge, không thấy dải tối/khe hở ở đáy. Mở Thêm → kéo tay cầm lên: sheet dài ra, đáy không hở; vuốt trong sheet và trên vùng mờ: trang phía sau đứng yên. Mở Ghi chú → cuộn danh sách tới cuối và vuốt tiếp: trang phía sau đứng yên. Nhấn giữ chọn chữ rồi kéo tay nắm qua lại nhiều lần, dừng giữa chừng: icon/popup chỉ hiện một lần sau khi thả tay. Chạm icon Keepit/thanh công cụ: menu Sao chép/Chia sẻ của Android biến mất, chữ vẫn được chọn (nếu menu vẫn còn: báo lại để đổi cách). Thanh dưới và thanh Reader cao hơn, icon to hơn, không nút nào bị cắt.
- v3.5.158 (Chrome + Firefox máy tính, DevTools cảm ứng 390/820/1180, Edge Android): chưa chạy. Lần đầu: thẻ "Thanh Keepit" → Đã hiểu → (cảm ứng) Mẹo cử chỉ. Bấm từng nút thanh: Dịch trang bật/tắt + Hoàn tác; Dịch đoạn → chạm đoạn; Đọc → thanh Reader thay chỗ; Vào video/Vào học trên YouTube; Ghi chú; Hỏi AI. 🔍: gõ 1 từ tiếng Anh → Tra → Keepit Dictionary; ghi chú/tô sáng đã lưu; Google/YouTube mở tab mới; ↑↓ Enter Esc. ☰: mọi ô Khi chọn chữ đổi đúng cài đặt popup; ngôn ngữ, màu, chủ đề, Font tùy chỉnh, Bật trang → nhãn "Keepit đang tắt ở trang này" → Bật lại; Ẩn thanh → vạch (máy tính rê 0,3s hiện, rời 0,6s ẩn; cảm ứng chạm vạch). Cảm ứng: vuốt trái trên đoạn, nhấn 3 lần (trang mobile), vuốt phải/trái lùi/tới, vuốt ngang trên thanh, nhấn giữ Dịch/Đọc, kéo popup lên/xuống, cuộn xuống ẩn thanh, ô nhập của trang → thanh ẩn, video toàn màn hình → thanh ẩn. Tắt mạng → Dịch báo "Không có mạng" + Thử lại; có mạng → Dịch ngay. Trang có thanh cookie/giỏ hàng ở đáy → thanh Keepit thu thành vạch ngay trên.
- v3.5.157 (Chrome + Firefox, YouTube thật): chưa chạy. Overlay → Tốc độ: kéo thanh trượt / bấm + tới 3.00x, video phát đúng 3x và YouTube không tự đặt lại tốc độ; `>`/`<` bước 0,05 trong 0.5–3x; chế độ học (Vào học) và Web TTS cũng tới 3x.
- v3.5.150 (Chrome + Firefox + Edge Android): chưa chạy. Desktop rộng: overlay 3 chế độ như v3.5.149. Cửa sổ hẹp dọc / DevTools 360–820 cảm ứng: Alt+E trên YouTube và trang web → thẻ gọn, chạm thẻ mở rộng, ⋯ mở sheet, tốc độ/CC/Cài đặt là sheet, câu dài không đè; Ghi chú → bottom sheet, chạm nền mờ hoặc kéo xuống để đóng. Edge Android `m.youtube.com`: transcript phải có nội dung (sandbox bị YouTube chặn nên chưa xác nhận được).
- v3.5.149 (Chrome + Firefox + Edge Android): chưa chạy. Desktop dùng chuột: Dashboard, trang web, overlay giống v3.5.148, không có thanh Keepit dưới đáy. Chrome DevTools → Toggle device toolbar (bật cảm ứng) 360/390/412/768/820/1024: Dashboard tab bar/rail, thanh Keepit trên trang (Song ngữ → Cả trang/Chọn đoạn, Đọc, Overlay, Ghi chú, Thêm), nhấn giữ bôi 1 từ/cụm → icon hoặc popup/full dict; Alt+E/Alt+F trên YouTube → overlay một cột. Edge Android (cài CRX): như trên với ngón tay thật.
- v3.5.148 (Chrome + Firefox): chưa chạy. `www.youtube.com/watch`: Alt+E / Alt+F / nút Keepit trong player như v3.5.147; trình duyệt Android có extension (Kiwi, Firefox Android) mở `m.youtube.com/watch` → Alt+E (bàn phím ngoài) mở overlay, có phụ đề + bản dịch.
- v3.5.147 (Chrome + Firefox): chưa chạy. Cập nhật từ bản cũ → Cài đặt → Icon hiển thị: 8 dạng, Dạng 1 được chọn; bôi chữ (chế độ icon): logo dưới chữ cuối, 3 nút có chữ quanh logo (Tô sáng trái, Dịch dưới, Hỏi AI phải), bấm từng nút đúng thao tác; Dạng 2/4: rê vào logo mới mở, di từ logo sang nút không bị đóng, rời ra thì đóng; Dạng 3: 3 icon vuông; bôi chữ sát mép trái/phải → 3 nút vẫn nằm trong màn hình; Dạng 5–8 giống hệt Dạng 1/3/2/4 cũ; giao diện tối.
- v3.5.146 (Chrome + Firefox): chưa chạy. Chế độ icon (tắt popup dịch trực tiếp), bật full dict: bôi 1 từ tiếng Anh → Alt+W → full dict + đọc từ; bôi cụm → Alt+W → popup dịch thường; tắt full dict → Alt+W 1 từ → popup dịch thường; dict đang mở → Alt+W đọc lại từ.
- v3.5.145 (Chrome + Firefox): chưa chạy. Cài đặt → Dịch → "Bộ nhớ đệm" → "Xóa bộ nhớ đệm": toast "Đã xóa bộ nhớ đệm từ điển"; tra lại từ đã tra → gọi mạng lại (thấy request trong Network); highlight/flashcard/cài đặt còn nguyên; sáng/tối; EN/VI/KO; ô tìm "từ điển" ra hàng này.
- v3.5.144 (Chrome + Firefox): chưa chạy. Chặn `api.datamuse.com` (DevTools → Network → Block request domain), tra "stop": Syn/Ant vẫn có (từ Free Dictionary), Forms/Colloc ẩn, nghĩa/IPA/Example vẫn hiện, không lỗi; bỏ chặn, tra lại "stop" (đóng/mở dict) → đủ Syn/Ant/Forms/Colloc từ Datamuse. Từ có Syn nhưng không có Ant trên Datamuse → Ant lấy từ Free Dictionary.
- v3.5.143 (Chrome + Firefox): chưa chạy. Full dict "stop": Syn và Ant mỗi loại tối đa 4 chip; Colloc tối đa 4, đúng thứ tự ("next stop", "stop shopping"), nghĩa dịch khớp cụm; bấm chip Colloc ở lại trong dict + Back; từ có ít dữ liệu → hiện ít hơn 4, không lỗi.
- v3.5.142 (Chrome + Firefox): chưa chạy. Full dict: brand ở góc phải dòng cuối (Colloc/Forms/Syn–Ant, câu dịch Example, loại từ, chỉ nghĩa); list chip dài → chip cuối xuống hàng cùng brand, không che chip/chữ; sáng/tối; tra từ thứ 2 trên cùng trang rồi bấm tim → thấy tim bắn ra quanh nút; ghi chú tự điền/tim không dính chữ brand.
- v3.5.141 (Chrome + Firefox): chưa chạy. Tim → huỷ → tim nhiều lần trên từ bôi ở trang: lần nào cũng highlight, câu ngữ cảnh = câu trên trang; bật tự phát âm → bấm chip ≥2 từ đọc cụm, Back về cụm đọc lại; tắt → im.
- v3.5.140 (Chrome + Firefox): chưa chạy. Full dict: Example hiện/ẩn đúng, từ được tô; tim trên từ bôi ở trang → highlight + toast, bấm lại → gỡ; tim trên chip/cụm/từ trong câu ví dụ → chỉ vào flashcard (Dashboard thấy, trang không tô, reload không tô nhầm); chip ≥2 từ + Back; bôi 1 từ / cụm trong câu ví dụ; click trong dict chỉ đóng popup dịch; sáng/tối.
- v3.5.139 (Chrome + Firefox): chưa chạy. Chế độ icon, full dict bật: bôi 1 từ tiếng Anh → Dịch → full dict; cụm từ → popup dịch thường; tắt full dict → popup dịch thường; logo đặt Dịch → full dict; nút cụm từ trong full dict vẫn mở popup dịch thường. Vị trí icon v3.5.137/138 đã được người dùng xác nhận.
- v3.5.136 (Chrome + Firefox, ZIP chung): chưa chạy. Sao lưu dữ liệu Firefox trước (đổi gecko id → Firefox coi là extension mới, dữ liệu cũ không tự chuyển). Kiểm: cài được trên Firefox 147+ và hiện khai báo dữ liệu lúc cài; ảnh lofi hiện trên thẻ nguồn web khi trang không có thumbnail và khi thumbnail trang lỗi; Network không còn request Unsplash/S2; favicon Dashboard rơi về icon mặc định khi trang không có favicon; Google Fonts: ghi `Referer` từng request.
- Biểu tượng dịch và tab “Icon hiển thị” (v3.5.66, v3.5.119 thêm Dạng 4 + "Mặc định khi bấm icon"): browser QA pending — chọn lần lượt Dạng 1/2/3/4, xác nhận lưu và restore sau reload; xem preview/popup ở light, dark và system; bật/tắt “Hiện biểu tượng dịch Keepit”; so sánh ba kiểu với HTML tham chiếu (Dạng 1 nhãn, Dạng 2 icon-only, Dạng 3 hover expand), xác nhận đúng nguyên bản ba SVG, logo bên phải, màu/spacing/radius/shadow; kiểm tra action và các luồng không liên quan.
- Hỏi AI / ChatGPT (v3.5.101): browser QA chưa được xác nhận trên Chrome/Firefox. Verify only the approved auto-send setting: defaults off for new installs; preserve explicit saved preferences. Check passive source switch leaves blank composer with no prompt/send; explicit first-use sample has no URL when off; manual click/Enter adds localized label + exact URL once and maps only after confirmed send; user-written prompts remain user-sent (never auto-send); mapped Alt+X only reopens and mapped Hỏi AI is selection-only/URL-free. Check opt-in explicit `?q=` native send and duplicate prevention. Verify localized endings EN/VI/KO, Vietnamese defaults, one real newline directly after the quoted selection (no blank line) and exact source-URL mapping; mapped follow-ups remain URL-free and selection-only; Alt+X on mapped URLs only reopens and focuses the composer when ready; draft caret stays at end; opted-in sends focus the composer only after confirmation without replacing any text already typed. Confirm no composer draft is saved/restored or protected from navigation; reproduce the Tuoi Tre → different source stale-composer case and confirm a source change/recreated panel clears old text while a matching active `?q=` prompt remains; also verify legacy page-draft storage removal on update. Check manual send establishes mapping; 2-second automatic tab/source debounce (reset on further tab changes, cancel when returning to displayed source, no tab-activation prompt), mapped-chat vs blank-chat destination, explicit Alt+X/Hỏi AI/right-click bypass, close cancels pending timer/request, and reopening uses only same-source route metadata then exact mapping then blank ChatGPT. Route metadata must exclude query/hash/prompt/composer text and never fall back to global last chat. Reopen same-source/same-route must avoid navigation when its document lives; a different source forces reload even for a shared `/c/<id>`. Also check right-click on Chromium/Firefox, open/close, pinned source URL/provider tabs, ChatGPT default, q native-send/duplicate prevention, Alt+X toggle, worker restart, Alt+Q/custom `sidebarShortcut`, and two-window concurrent navigation/request isolation (shared pending storage keys remain a risk). Browser QA has not been run.
- AI toolbar v3.5.102/v3.5.107/v3.5.108 browser QA pending: verify accepted 25px bar/flow, 61px divider, 32px tabs and 30px provider controls; source link, ChatGPT/Gemini/Claude tabs, light/dark theme, auto-send toggle on each visible provider, hidden Grok, and no blank overlay.
- Overlay popup + Theater/Large subtitle (v3.5.54): browser QA pending — Cài đặt body tối đa 530px; popup Cài đặt và menu Chế độ xem đều cách mép phải control bar 4px; menu rộng hơn 20px; ở Theater + Large, mức 100% cho EN 26px/VI 20px, mức khác không đổi; hộp phụ đề wrap trong tối đa 98% chiều rộng `.te-player-frame`.
- Theater + Large subtitle reset/default (v3.5.53): browser QA pending — double-click trong nội dung và trên handle đều reset được; khi bar ẩn, mép dưới box cách frame 30 px; khi bar hiện, clamp tạm thời rồi trả lại đúng vị trí sau khi ẩn.
- Theater + Large subtitle handle/position (v3.5.52): browser QA pending — xác nhận handle 54×20 px, icon 14×14, overlap 10 px, hit area thêm 4× width mỗi bên; kéo được gần bottom↔top; double-click reset mép dưới cách 80 px; control bar hiện chỉ clamp khi chồng lấn, opacity về 0 thì vị trí đã lưu trở lại; legacy y=82 nhận default mới, custom y vẫn giữ.
- Theater + Large light subtitle (v3.5.51): browser QA pending — main mặc định vàng `#ffff00` như dark mode; bản dịch giữ màu hiện hành; light mode ở các kích cỡ khác vẫn tím app; dark mode không đổi.
- Theater + Large subtitle (v3.5.49/v3.5.54): browser QA pending — xác nhận hộp tăng tới 98% `.te-player-frame` trước khi main/bản dịch wrap; từng dòng ngắn hơn giới hạn giữ một dòng; dòng dài hơn wrap bên trong hộp; đổi kích thước cửa sổ/video không giới hạn nhầm theo viewport.
- Toast "Bạn đang ở (tên chế độ) rồi" (v3.5.47): browser QA pending — bấm Alt+1/2/3 đúng chế độ xem đang mở thì hiện toast đúng tên mode và ngôn ngữ (EN/VI/KO), tự ẩn sau ~2.4s; bấm khác mode vẫn chuyển như cũ; đang mở Study thì không toast và vẫn chuyển mode; menu chế độ xem đang mở vẫn đóng lại; không ảnh hưởng phím Alt+1–3 khi đang nhập liệu.
- Kích thước xem Normal/Theater độc lập (v3.5.46): browser QA pending — chọn S/M/L ở Normal không đổi cỡ Theater và ngược lại; chuyển Normal ↔ Theater áp ngay kích thước riêng của mode đích, không thừa hưởng cỡ mode trước và không tự ẩn controls sai; Reading/Study giữ key riêng; auto-hide controls khi chọn L ở Theater vẫn hoạt động; giá trị giữ sau reload và khi mở lại overlay.
- Ảnh người dùng v3.4.967: chuyển Rạp + Lớn → Luyện nói/Dictation làm layout Theater còn áp dụng vào grid học; đã sửa ở v3.4.968, cần chạy lại đúng luồng trên YouTube để xác nhận.
- Overlay favicon: xác nhận `.te-yt-logo-box` dùng đúng favicon trang cho Web và YouTube, giữ 22×22px/tiêu đề/bố cục, fallback globe khi không có icon; browser QA pending.
- YouTube: xác nhận `.te-sub-en`/`.yt-dual-item-en` và vùng Dictation allowlist mở đúng popup/Full Dict; các dòng dịch/control khác bị chặn; hai tùy chọn popup/đọc riêng; Theater + Large: nếu auto-hide khi trước đó tắt, mọi exit kể cả `pagehide` phải giữ hide-controls off; manual hide vẫn được giữ. Normal + Large phải giữ thanh control hiện như Small/Medium; mock v3.5.29 pass. v3.5.30: kiểm tra cursor thường và click xóa selection trên YouTube video/Web thumbnail, playback không đổi; browser QA pending.
- Web-study/video UI v3.5.25 behavior / v3.5.28 relocation / v3.5.29 control-bar UI fix / v3.5.30 frame interaction / v3.5.32 thumbnail visualizer / v3.5.33 exact waveform port: browser QA pending xác nhận Web TTS đổi tốc độ ngay giữa cue và Pause/Play tiếp đúng vị trí trên Google audio/browser voice, gồm pause giữa chunks và seek khi pause; cùng xác nhận clipping cho Web thumbnail/video thật và visualizer cover/Lo-fi fallback, motion Breathing/Pan/Tilt (0,2×–3,0×; bỏ Static/Pulse; biên độ giảm 50%), bốn waveform, năm palettes, metadata; bảy hiệu ứng random riêng mỗi 30–180s; blur 0–10px; bokeh dùng glow alpha và radius 2× theo tham chiếu, darkness/bokeh giữ giới hạn ở normal, Theater + Large, Reading và Dictation; giữ frame size/ratio/position; tiếp tục kiểm tra cho Dictation repeat phát lại đúng cue/count trên Web (không bị nhảy sang câu sau), mọi video shortcut (Alt+E/F, Alt+1–3, 1–4, Space/K, arrows/J/L, </>, Escape) trên Web; xác nhận Web view và Bilingual Reader loại trừ nhau hai chiều; giữ controls hiện trong Web view và ẩn trong learning; Ambient dùng thumbnail (công tắc, ảnh tải muộn, on/off và cleanup); Reading + Ambient cần xác nhận control bar dùng chung nền/blur/viền/bóng ở theme sáng/tối, Ambient tắt không đổi nền, geometry fixed chỉ ở Rạp + Lớn; transcript focus ở Normal/Reading tại 40vh mặc định, scroll tay giữ offset qua cue kế tiếp/mode switch, cue đầu/cuối clamp ở natural boundary như v3.5.20, cue cuộn được căn 40vh; Theater/Dictation không đổi; cùng QA các phím Typing sau khi đạt 100% (v3.5.8), shared subtitle translation trên Web (Reader text primary, BILINGUAL_TRANSLATE secondary, bilingual/translation modes, đổi target language), Reader sentence cues, đa ngôn ngữ TTS/SpeechRecognition, Typing/Speaking, session web mở đúng URL, page thumbnail/SVG fallback, navigation cleanup và toast/log lỗi dịch; xác nhận trực quan góc Web frame v3.5.5; Web cue cache trên Tuổi Trẻ/VnExpress: lần đầu lấy Reader mới, đóng/mở cùng document nhiều lần giữ nguyên cue, reload trích xuất lại, persistent cache hit khi source hash trùng, mục không dùng hết hạn sau 7 ngày và được dọn khi cache được dùng lại; CC mặc định `primary` khi cue cùng ngôn ngữ giao diện, `bilingual` khi khác/chưa rõ, và giữ lựa chọn thủ công. Chưa browser-test.
- Dashboard & Highlights/Notes (Chrome/Firefox, desktop và màn hình hẹp): xác nhận route/scroll restore, event bus, annotations/favorites/CRUD/export/study, theme/responsive, favicon, reveal/count-up/reduced-motion và nested scrolling. Các hành vi này chưa xác nhận trên trình duyệt thật.
- Dictation, Reading và YouTube overlay: kiểm tra typing colors 70/40/0 với chỉ 100% đạt, nút Hiện bản dịch on/off/tải, `te-dict-stats-host` font sizes theo ngưỡng ≤10px +2px/>10px +1px, font chữ UI overlay dùng token mặc định trong mọi mode còn phụ đề/transcript giữ font tùy chỉnh, bố cục học mặc định 25:50:25 và giữ kích thước cột tùy chỉnh khi nạp preference cũ, typing answer stack lệch -50px khi lần gõ hiện tại chưa pass; sau khi đạt 100%, Enter trong `te-dict-input` chuyển câu kế tiếp ở Web/YouTube; Esc vẫn hiện đáp án/làm lại, ` vẫn phát/tạm dừng, Ctrl vẫn nghe lại; phím nhập thường đầu tiên trở về nhập ngay (kể cả input trống với điểm lưu/hiển thị 100%), về 0px chỉ sau khi pass 100%, bật lại khi sửa/reset/chuyển câu; Typing thiếu từ trước từ kế tiếp đúng: mọi từ thiếu gạch đỏ, một space mỗi bên; Backspace/Delete trong slot hoặc Backspace từ space sau slot xóa gọn một lần; hint theo “Hiện gợi ý”, browser QA pending; vị trí trên kết quả spelling, Speaking tiers 70/40/0 và Next không tự chuyển; Thống kê từ sai: summary theo mode, dữ liệu Typing/Speaking tách riêng và giữ qua reload; recognition/MediaRecorder permission, auto-record: replay attempt khi bật bỏ 1,5 giây grace cuối; khi tắt replay đủ audio; khi bật, mic auto/manual one-shot `continuous=false`/`onend` rồi playback-before-grade; khi tắt, manual continuous Enter; cue cuối +1s start; sau `onend` khởi động lại nhận diện, gộp transcript và chấm một lần sau 1,5s im lặng (reset timer khi có speech); sau chấm sai phát cue một lần rồi auto-mic sau 1s; own-voice playback, lời nhắc idle EN/VI/KO, icon audio-lines + pulse tím theo mini-play khi phát bản ghi, nút chấm điểm ẩn toàn bộ trong Speaking và hiện bình thường trong Typing, bốn nút trước/phát lại/nghe chậm/tiếp dàn đều theo chiều ngang trong Speaking, video Dictation compact toggle hiện headphones và expanded hiện icon video; video Reading toggle trước X đổi mini-audio/video, play/pause cùng player, restore khi rời mode; ambient “Chế độ nghệ thuật” có switch trực tiếp ngay trên dòng menu (không mở modal), on Ambient 3/off tắt; control bar: play button đúng tâm, các nhóm không chồng lấn, `.te-yt-logo-box` co khi thiếu chỗ (kể cả Dictation expanded); hover ở `.te-sub-en`/`.yt-dual-item`: mode transition và transcript click dùng suppression chung, resume nếu hover gây pause, giữ manual pause khi đổi mode, rời cả hai vùng mới re-arm; Dictation learning: xác nhận auto-record nằm trái translation, màu/size/active state đồng nhất; audio card giảm height 20%, font giữ nguyên; S/M/L lần lượt đủ cột/ẩn trái/ẩn trái+phải, không resize video; Speaking `.te-dict-work` spacing/toast khớp v3.4.938, `.te-dict-translation` rộng bằng câu EN và ở dưới hint; bản dịch mặc định bật và nhớ tùy chọn; mic auto chỉ còn vòng tím trong cùng; nhãn/toast ghi âm suốt lượt; auto-record rearm qua `onend`, reset grace 1,5s theo speech và grade một lần; manual flow khi tắt; sai thì cue một lần rồi auto-mic sau 1s. Theater + Lớn: xác nhận fixed bar blur ở đáy, tùy chọn chỉ hiện đúng mode, căn theo frame, swatch màu nền khớp 2 swatch subtitle và gap 10px; migrate Y, reset, color/opacity/drag-key, controls tự ẩn/manual, responsive và mode switch; browser QA pending. Video settings padding/hint/order/label; size S/M/L label “Vừa” và ratios cột video/giữa 32/35, 26/45, 20/60; `.te-dict-brand` scale theo chiều rộng video ở Reading/Dictation expanded; xác nhận một node dùng chung; feedback Speaking pass/warn/fail: VI-only popup top-center có ring%, copy 15 mốc và màu tier hiện tại, Spring Pop, ẩn sau 6s hoặc Enter; EN/KO giữ card inline gồm câu đích và accuracy, retry, Escape reveal/reset/100%-then-next, unsupported/failure cleanup, progress, mode transitions, layout/scroll và reload trên Chromium/Firefox/Edge. Chưa browser-test.
- Reader/TTS/Settings/voice: kiểm tra cache/retry/fallback, audio dài, voice/tốc độ, Reader domains, search/menu language/keyboard, IPA, network messaging, translation latency, Firefox MV3 và Twemoji trên trang thật; một số chỉ headless-test, chưa xác nhận trong extension.

### Việc cho APK — nhắc người dùng khi bắt đầu làm APK

- **Đọc khi tắt màn hình (Reader / TTS):** extension không làm được. Khi khoá máy, Edge/Chrome Android dừng JavaScript và phần nền của tab nên không lấy được mẩu giọng tiếp theo; giọng trình duyệt (`speechSynthesis`) bị ngắt khi tab ẩn. Đã thử âm thanh im lặng chạy nền + Media Session ở v3.5.241–242: vừa rè vừa vẫn dừng, gỡ ở v3.5.243. Trong APK: dùng dịch vụ chạy nền của Android (foreground service + MediaSession, như app nghe nhạc) để đọc tiếp khi tắt màn hình và có nút trên màn hình khoá.
- **Chặn quảng cáo:** uBlock Origin không chạy được trong WebView. Hướng A (đề xuất): tự chặn trong WebView bằng danh sách bộ lọc của uBO / EasyList (thư viện adblock-rust), có công tắc trong Cài đặt. Hướng B: chuyển sang GeckoView để cài đúng uBO (APK nặng thêm ~60–90 MB, sửa rất nhiều). Lưu ý giấy phép (uBO GPLv3, giấy phép các danh sách lọc), ghi máy chủ tải danh sách lọc vào tài liệu quyền riêng tư, không chặn quảng cáo YouTube.

### Chưa triển khai / trước phát hành
- Highlight ẩn và điều hướng ↑/↓ trong danh sách xổ xuống: phạm vi đã chốt, chưa triển khai; giữ khóa bật/tắt trong code.
- Hoàn thiện `LICENSE`/`PRIVACY-POLICY.md` (điền chủ sở hữu, email, URL công khai, ngày hiệu lực, độ tuổi) trước khi phát hành.
- Trước khi nộp AMO: quyết định cách xử lý quy tắc 9002 (gỡ `X-Frame-Options`/CSP của trang AI, xung đột AMO §4.4); người dùng đã chọn giữ ở v3.5.136.
- Lúc nộp (người dùng): bản sao ZIP bỏ `DATA-INVENTORY.md`, `STORE-LISTING.md`; ảnh chụp 1280×800; tài khoản CWS/AMO; rà lại form cửa hàng theo `STORE-LISTING.md`.

## 3. Ràng buộc & quyết định
- **Áp dụng demo:** chỉ giữ bố cục/luồng đã duyệt. Reader, chọn chữ, Ghi chú, từ điển và Hỏi AI phải dùng module UI/controller/dữ liệu hiện có của app, theo cài đặt chung; không bê các công cụ mô phỏng thành bộ riêng.
- Giữ nguyên UI, layout, văn bản hiện có. Chỉ thêm mới khi được yêu cầu.
- Khi phát hiện tên file/đường dẫn sai hoặc không nhất quán, báo người dùng và nêu rõ phạm vi trước khi sửa; nếu chỉ yêu cầu đổi tên, giữ nguyên logic bên trong.
- Mọi API dùng browser.* (đã có polyfill).
- Chromium dùng `side_panel`/`sidePanel`; Firefox build qua `scripts/build_firefox.py` bỏ các key Chrome-only và dùng `sidebar_action`. Popup và Dashboard giữ entry hiện tại.
- Thư mục nguồn là nguồn duy nhất; Firefox manifest là build output bên ngoài repo; zip do Arena đóng gói vào D:\Keepit.
- AGENTS.md và PROJECT.md nằm trong zip và được commit vào Git. Trước khi nộp store, người dùng tự xóa hai file này khỏi zip.
- Thay đổi lớn nêu rõ trong commit message.
- Khoảng trắng dưới thanh trên Claude (Chromium) là header riêng của Claude; người dùng chọn không xử lý.
- Tuyệt đối không đặt ZIP, test, log, file tạm trong `Keep-it`; test chỉ chạy ngoài repo.

## 4. Cấu trúc và kiến trúc dự án

### 4.1. Bản đồ file
```text
Keepit - Test/
├── manifest.json                  # Manifest source cho Chromium
├── scripts/
│   └── build_firefox.py           # Tạo Firefox build, bỏ permission/key Chrome-only (không dùng cho phát hành từ v3.5.136: một ZIP chung)
├── pages/
│   ├── ai-panel.html               # AI panel chung (Chromium side panel + Firefox sidebar): toolbar + provider iframe + lớp phủ đăng nhập
│   ├── dashboard.html             # Giao diện Dashboard (Overview/Dictation/Highlights & Notes, sidebar và ô tìm Settings)
│   ├── highlights-notes.html      # Bản HTML độc lập của giao diện Highlights & Notes
│   ├── dictation-stats-popup.html # Popup thống kê Dictation trong iframe cục bộ
│   └── popup.html                 # Popup toolbar
├── js/
│   ├── core/                      # defaults, browser-polyfill, config, languages, messaging, settings, cache, shortcuts
│   ├── background/                # background.js (entry, router; nạp ask-ai/service.js), annotations, usage-limits
│   ├── ask-ai/                    # AI panel ChatGPT/Gemini/Claude (Grok ẩn)
│   │   ├── providers.js           # Registry + selector/URL theo AI, panelRoute/planPanelNavigation, pickSelectedProvider
│   │   ├── service.js             # Background AI: panel lifecycle, provider, mapping, link, Alt+X, DNR 9002
│   │   ├── prompt-format.js       # Nhãn + URL + prompt formatting (background + trang AI)
│   │   ├── toolbar.js             # Toolbar AI panel: source link, tabs, auto-send
│   │   ├── panel/panel.js         # Panel controller chung (iframe cả hai trình duyệt, Chat mới, lớp phủ đăng nhập)
│   │   └── page/                  # composer.js (editor bridge), send-flow.js (send/link/mapping), chatgpt-link-marker.js, grok-google-auth.js
│   ├── content/                   # Page interaction content scripts
│   │   ├── sidebar.js             # Page sidebar tabs and search tools
│   │   ├── keepit-bar.js          # Thanh Keepit + ☰ mọi thiết bị: cuộn ẩn/hiện, vuốt thanh lùi/tới/sang tab, cử chỉ trang (vuốt trái dịch đoạn, chạm 2 ngón dịch trang), nhấn giữ bôi chữ; nhãn ở languages.js (bar_<tên>)
│   │   ├── keepit-bar-css.js      # CSS thanh + ☰ (LHN_BAR_CSS), màu kính qua var(--kp-…)
│   │   └── note-composer.js       # Note form and record normalization
│   ├── reader/                    # bilingual-reader, reader-css (CSS Reader), TTS engine, reader voice flags
│   ├── translate/                 # translate (chạy nền), dictionary, study translation
│   ├── dashboard/                 # Dashboard routes, settings, account, backup, stats; responsive-nav.js = điều hướng điện thoại/tablet
│   ├── overlay/                   # Shared Video/Web overlay, Study engine/activities and View modes
│   │   ├── overlay-controller.js  # Lifecycle, source/activity routing and bootstrap
│   │   ├── ui/                    # Giao diện overlay (demo v18): overlay-ui.js, overlay-css.js (nhãn: khoá `ov_*` trong languages.js)
│   │   ├── source/                # YouTube captions/timing and Reader cues
│   │   ├── study/                 # study-score, learning-rules, session-index (chấm điểm, luật, chỉ mục cho Dashboard)
│   │   ├── overlay-engine.js      # Cài đặt, chế độ xem/phụ đề, hàng đợi dịch phụ đề, yêu thích (từ view/ cũ, v3.5.195)
│   ├── popup/                     # popup.js (entry)
│   └── shared/                    # theme-tokens (màu kính sáng/tối --kp-…), custom-font, icons, search (LHN_INDEX_SEARCH + LHN_SEARCH), sheet-kit, selection-toolbar, site-icons, thumbnails
├── css/
│   ├── content/                   # CSS của content script
│   ├── dashboard/                 # CSS Dashboard; `overview.css` cho Overview, `dictation.css` cho route Dictation, `responsive.css` cho điện thoại/tablet (nạp cuối)
│   ├── popup/                     # CSS popup toolbar
│   └── shared/                    # theme tokens, theme và flags
├── assets/
│   ├── icons/                     # Biểu tượng extension
│   ├── images/                    # Ảnh đóng gói (web-thumbnail-lofi.webp, ảnh mặc định thẻ nguồn web; khai trong web_accessible_resources)
│   └── fonts/                     # Font cục bộ
├── vendor/readability/            # Mozilla Readability cho Alt+R/Alt+A
├── licenses/                      # Văn bản giấy phép bên thứ ba
├── docs/
│   ├── INDEX.md                   # Mục lục tài liệu kỹ thuật nội bộ
│   ├── modules/                   # Hướng dẫn cho từng module first-party cấp cao nhất trong js/
│   ├── changelog/                 # Nhật ký cũ (chuyển nguyên văn từ PROJECT.md), chỉ đọc khi cần tra lịch sử
│   └── supabase/                  # SUPABASE_SYNC.md + supabase-schema.sql (cloud chưa nối)
├── DATA-INVENTORY.md, STORE-LISTING.md  # Nội bộ: bảng kê dữ liệu, nội dung cửa hàng (bỏ khỏi ZIP phát hành)
└── AGENTS.md, PROJECT.md, README.md, OPT-ARENA.md, PRIVACY-POLICY.md, THIRD_PARTY_NOTICES.md
```

`manifest.json` ở gốc repo dùng chung Chromium và Firefox (khóa của trình duyệt kia bị bỏ qua; `browser_specific_settings.gecko` giữ id, Firefox ≥147 và `data_collection_permissions`); phát hành một ZIP chung. `scripts/build_firefox.py` vẫn còn nhưng không dùng cho phát hành. Thứ tự script trong manifest và HTML là thứ tự nạp cần giữ.

Có 6 entry `content_scripts`: base `document_start`/`all_frames` nạp browser API/messaging/font; app chính chạy `document_idle` ở top frame; `grok-google-auth.js` chỉ kiểm tra frame `accounts.google.com` cùng ancestor origins; ChatGPT link marker chạy sớm; một entry `document_start` trên host ChatGPT/Gemini/Claude nạp `providers.js`, `prompt-format.js`, `toolbar.js`, `page/composer.js` (editor bridge); một entry `document_idle` nạp `page/send-flow.js` (pipeline Send/link/mapping chung: chèn URL lúc Send, chỉ submit khi Keepit auto-send được opt-in, báo mapping sau confirmed send). Firefox panel toolbar chỉ hiện khi marker hợp lệ và sidebar đang mở. Generic fill không tự submit và không lưu/restore composer draft.

### Tài liệu cục bộ

- `pages/documents.html`/`documents.css` chỉ giữ thư viện và original-file surfaces; không còn `#player`, `#sel`, `#dict`, Notes/AI pane riêng.
- `documents.js` + `documents-context.js` cung cấp source identity/blocks/page anchors/layout cho `content.js` và `bilingual-reader.js` gốc; adapter lấy queue block theo target double-click, đặt speaker trên overlay không scale theo cuối paragraph và ánh xạ hover PDF spans về icon tương ứng. Web không có host phải giữ đường cũ; Source URL chỉ owned Dashboard document UUID.
- Blob/metadata/progress ở `keepit-documents`. Notes/Flashcards mới ở annotations chung; legacy v314 migration giữ nội dung/ngày/anchor, idempotent và không tái tạo note đã xóa. JSON backup có Notes nhưng không blob; import rewrite đúng owned extension origin.
- `LHN_SELECTION_TOOLBAR.installTouchSelectionBridge` là bridge touch duy nhất. `LHN_SIDEBAR.attachTouchSheet` dùng chung setup grow/scroll/drag. `js/ask-ai/sheet.js` là AI sheet đã chuyển nguyên component từ web bar, dùng cho web và Documents; parent Dashboard chuyển message top-frame cho source active.
- `LHN_READER_API` chỉ facade của Reader gốc: không queue/UI khác; host cung cấp chữ tệp/chuyển trang/vị trí native card, pager nhường khi bar mở. AI dùng native panel/sheet và Send policy hiện có, không upload/read toàn bộ file tự động.
- Renderer/vendored licences/giới hạn v314 giữ nguyên; details ở `docs/documents.md` và trang module tương ứng.

### 4.2. Luồng tương tác giữa các module
```text
Popup ── yêu cầu mở Dashboard / gửi thao tác tab ──┐
Dashboard ── annotations, bilingual translate, usage ┤
Content ── annotations, highlight, mở Dashboard ─────┼──> core/messaging
Reader ── bilingual translate / nhận diện ngôn ngữ ──┤         │
TTS engine ── tải audio Google TTS ──────────────────┘         ▼
                                                     Background service worker
                                                       ├── Translate + cache
                                                       ├── Google TTS + audio cache
                                                       ├── Annotations + IndexedDB
                                                       ├── Usage limits
                                                       └── mở tab/đi tới highlight

Reader ── Readability ──> chọn nội dung chính của trang
Content ── Highlighter / Note Composer / Highlight Sidebar ──> giao diện trên trang
AI panel toolbar ── provider selection per window + last choice ──> Background session/local state ──> provider iframe trong pages/ai-panel.html (Chromium + Firefox)
Content/commands ── OPEN_AI_PANEL / Alt+X / context menu ──> `ask-ai/service.js` lấy exact tab URL + selection tường minh; AI đang chọn quyết định key mapping; prompt giống nhau cho mọi AI; draft không có URL tới lúc Send; `page/composer.js` điền, `page/send-flow.js` gửi/chèn URL/báo `AI_LINK_RESULT`.
Content/commands ── AI provider route workflow ──> Background exact-URL mapping lookup for ChatGPT/Gemini/Claude. Auto-send defaults off for new installs and honors saved explicit preferences. Gemini/Claude drafts keep the URL absent until send; every manual Send, including mapped-source and hand-typed prompts, adds localized label + exact current URL only after stable exact-editor verification. Failed verification sends nothing and cannot save a mapping; successful mapping requires confirmed send. URL-only and page-complete source events refresh the selected provider context; mapped context routes in Chromium/Firefox and unmapped context returns to provider start. User-written prompts are never auto-sent and their bodies are not persisted. Opt-in explicit Keepit auto-send uses `?q=` for ChatGPT; Gemini/Claude use the shared send flow. Same URL: Alt+X only reopens and focuses the composer when explicitly invoked; Ask AI on a mapped source sends only the selection + instruction (same for all three). No passive prompt/send; no page body/title/clipboard; legacy clipboard/body-text path remains unused.
Content selection ── generic page ──> popup/dictionary unchanged; video overlay ── primary transcript only ──> translation/Full Dict
Dashboard ── Overview / Dictation / Highlights & Notes (LR) / Documents / Flashcards / Settings / Account / Backup ──> giao diện quản lý
Dictation title observer ──> debounced session-index title update ──> popup bridge storage listener ──> live `context-source` refresh; popup fixed-height body scrolls at 3px
Dictation detailed-stats button ──> same-origin popup bridge ──> local Dictation schema v3 (per-attempt category + example context) ──> approved v7 global / critical / per-web views
Highlights & Notes + Dictation stats popup ──> shared/site-icons.js (LHN_SITE_ICONS) ──> origin-based browser.storage.local favicon cache
Overlay Web + YouTube title bar ──> shared/site-icons.js (LHN_SITE_ICONS) ──> same origin favicon, 22×22 toolbar slot
Dictation YouTube/Web + Dashboard Dictation + Highlights & Notes sources ──> shared/thumbnails.js (LHN_THUMBNAILS) ──> shared URL/fallback/load logic
Dashboard sidebar: mặc định mở 220px; nút pin chuyển 220px/56px trong flex layout để vùng nội dung trượt theo; nút pin hiện khi hover lúc menu thu gọn, avatar popover và hai nút theme giữ luồng hiện có
Dashboard Settings ── ô tìm (`initSettingsSearch`) ──> shared/search (`LHN_INDEX_SEARCH`, debounce 200 ms)
                      └──> chỉ bật/tắt class tạm (`is-searching`, `has-search-match`, `settings-search-hidden`)
                           trên hàng/nhóm/tab và bọc kết quả trong `mark.lhn-search-match` (cùng kiểu tô sáng Dashboard/sidebar);
                           không đổi `hidden` hay state; Esc, đổi tab, đóng hộp thoại thì gỡ mark và xóa class
Dashboard Settings (`dualSubtitlesShortcut` Alt+E / `dictationShortcut` Alt+F) ── storage ──> Content keydown ── `lhn-youtube-dual-subtitles-toggle` / `lhn-youtube-dictation-toggle` ──> `js/overlay/overlay-controller.js` ──> shared overlay cho YouTube hoặc Web
`lhnSettings.language` storage change ──> `refreshSubtitleLanguageSettings` ──> overlay labels + open Dictation labels
Reader (`LHN_READER_MAIN_SOURCE.getTextBlocks({forceRefresh:true})`) ──> `js/overlay/source/web.js` (`sourceType: web`) ──> content-hash sentence cues: same-document memory snapshot + `WEB_STUDY_CUE_CACHE_GET/SAVE/TOUCH` (7-day sliding TTL) ──> lazy `LHN_TTS`/`BILINGUAL_TRANSLATE` existing caches + `LHN_THUMBNAILS` ──> Overlay/Study Dictation UI/engine; reload/URL change refreshes Reader source, unchanged source can reuse persistent cues; YouTube cache stays separate. `view/cc-mode.js` applies cue-language default (same→primary; different/unknown→bilingual; manual choice wins). Reader stop/start exclusivity, shortcuts, controls and Ambient behavior unchanged
Web TTS (`source/web.js`) ──> `overlay-controller.js` playback controls (`startWebTtsInViewMode`, `syncReadingAudioControls`; từ `study/shadowing/shadowing.js`, v3.5.196) ──> existing `LHN_TTS` chunk callbacks + retained Audio/SpeechSynthesis handle; live speed update and same-position Pause/Play; YouTube and Reader consumers unchanged
Video source (`js/overlay/source/video.js`: `state.allCues`, `sourceLanguage`, video-specific transcript/cache) ──> `overlay-controller.js` / View
  └── `overlay-controller.js` (`LHN_OVERLAY_API`, `LHN_STUDY` activity routing; `LHN_DICTATION` compatibility alias) ──> tab Nói/Chép của `unified/unified-ui.js` (panel Study cũ đã xoá ở v3.5.196)
                                  ├── BILINGUAL_TRANSLATE → câu VI chỉ sau khi đúng
                                  └── browser.storage.local → solved / notes / bản dịch theo source+câu + thống kê từ sai theo video/từ/vị trí
Popup / Reader (chọn giọng) / Dashboard Settings (chọn ngôn ngữ, ô tìm) ── dùng chung ──> shared/search
```

Sidebar trang giữ tab Highlight; Alt+X mở/toggle browser-native AI panel; Hỏi AI mở hoặc giữ panel mở. Provider selection lưu theo window trong `storage.session` và lựa chọn gần nhất trong `storage.local`, đọc qua `pickSelectedProvider` chung; visible tabs chỉ là ChatGPT, Gemini, Claude, còn Grok hidden nhưng registry/auth code không bị xóa. Chromium giữ provider trong iframe; Firefox dùng sidebar native và chuyển provider top-level. Gemini/Claude dùng exact source→conversation mapping, localized prompt, URL injection lúc Send trên source chưa map (gồm prompt tự gõ; source đã map không thêm URL như ChatGPT) và shared opt-in auto-send cho explicit Keepit actions. ChatGPT/Gemini/Claude dùng một pipeline: iframe `page/composer.js` báo `KEEPIT_AI_PANEL_CONVERSATION`, `panel/panel.js` áp `planPanelNavigation()` stay/reload/load, route session (`AI_PANEL_ROUTE_CONTEXT`) mở lại đúng chat cho cả ba AI. User-written prompts không bao giờ auto-send; mapping chỉ sau confirmed send. Riêng ChatGPT chỉ khác ở dữ liệu `?q=` + early marker. Grok embedded sign-in legacy handler chỉ giữ origin validation; không hiện Grok tab/button. Không đọc page body/title/clipboard, không lưu/khôi phục unsent draft. Tab/source context đổi dùng debounce 2 giây; đóng panel hủy timer/request. Không dùng global last-chat URL. Toolbar geometry giữ nguyên; auto-send hiện với ChatGPT/Gemini/Claude. DNR rule 9002 chỉ nhắm subframe trên allowlist provider; không thêm Google auth vào DNR. Manifest không cấp clipboard permission.

Các mũi tên qua `core/messaging` là runtime messages. Settings giao diện được đọc/ghi trực tiếp qua `browser.storage`; không phải mọi luồng đều đi qua Background. Trong Dashboard, `dashboard.js` điều phối Overview, Dictation và Highlights & Notes dưới một `#dashboardScroller`, shared theme và topbar; mỗi route giữ content/logic riêng, vị trí cuộn được lưu độc lập theo tab và restore cùng route cuối sau reload. Highlights & Notes chạy trong cùng document qua event bus nội bộ, nhận snapshot annotations/favorites từ Dashboard; mọi ghi/xuất/review/action quay lại handler hiện có, không thêm API/backend hoặc nguồn lưu annotation thứ hai. Dictation dùng route `dictation`; phiên và tiến độ lấy từ `js/overlay/study/shared/session-index.js`, được đối soát với record thật `dictation:<sourceId>` để phục hồi mục thiếu; YouTube/Web sessions giữ source ID và URL tương ứng, thống kê lỗi đọc từ dữ liệu đã lưu, còn tab hiển thị empty state khi chưa có dữ liệu. Hai route dự phòng Grammar/Library và code riêng chỉ phục vụ chúng đã bị xóa; các route còn lại không đổi.

## 5. Nhật ký

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

**2026-11-17 | v3.5.343 | Arena.ai Agent sửa:**

- Thay alpha highlight PDF bằng màu đầy đủ + `mix-blend-mode:multiply`: nền tô đậm, glyph tối giữ màu rõ; web không đổi. Màu chữ gốc khác đen có thể bị pha tint nhẹ.
- Kiểm tra cú pháp, static checks màu/blend, `git diff --check`; chưa browser-test Chrome PDF thật.

**2026-11-17 | v3.5.342 | Arena.ai Agent sửa:**

- PDF highlight/preview dùng alpha 0.42 để giữ chữ canvas bên dưới nhìn rõ. Thêm marker class riêng cho PDF; web giữ nguyên màu đục.
- Kiểm tra cú pháp, static regression alpha/classes, `git diff --check`; chưa browser-test PDF thật.

**2026-11-17 | v3.5.341 | Arena.ai Agent sửa:**

- PDF hover dùng đúng tooltip từ `LHN_WORD_CLASS_CORE.tip` như trên web (từ + nghĩa song ngữ), bỏ con trỏ help/question.
- Kiểm tra cú pháp và diff; chưa browser-test Chrome.

**2026-11-17 | v3.5.340 | Arena.ai Agent sửa:**

- PDF: Loại từ chỉ còn gạch dưới màu; hover gạch dưới hiện tooltip có viết tắt và nghĩa đã dịch. Các định dạng khác giữ nhãn như cũ.
- Kiểm tra: `node --check js/dashboard/documents.js`, `git diff --check`; chưa browser-test tooltip trên PDF thật.

**2026-11-17 | v3.5.339 | Arena.ai Agent sửa:**

- Khôi phục chú thích Loại từ trong Documents: đồng bộ class `wcOn` mà CSS dùng để hiện legend với trạng thái công cụ. Đã xác định đây là lý do nhãn có nhưng bảng chú thích không hiện.
- Kiểm tra: `node --check js/dashboard/documents.js`, `git diff --check`; chưa browser-test Chrome.

**2026-11-17 | v3.5.338 | Arena.ai Agent sửa:**

- Sửa lỗi v3.5.337 bị sót hàng đầu khi mã ô nằm cùng một text run; gom hàng đó với phần bảng, phân cột bằng ` | `. Tăng tolerance baseline và nhận khoảng trắng nhiều trong một run. TTS đổi `|` thành dấu phẩy khi đọc và giữ pause giữa hàng; không tô nổi hàng.
- File: `manifest.json`, `js/dashboard/documents-renderers.js`, `js/reader/bilingual-reader.js`, `docs/modules/reader.md`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check` renderer/Reader, `git diff --check`, synthetic geometry cases cho hàng đầu một run, khoảng trắng trong run, lệch baseline và đoạn văn thường đạt; chưa browser-test PDF thật.

**2026-11-17 | v3.5.337 | Arena.ai Agent sửa:**

- PDF nhận dạng các hàng bảng có cột lặp/thẳng hàng và ô phụ hẹp thành một paragraph block. Dịch hiển thị mỗi hàng trên dòng mới, ô ngăn bởi ` — `; TTS đọc nội dung hàng tuần tự với pause bằng `; `, không thêm highlight hàng.
- File: `manifest.json`, `js/dashboard/documents-renderers.js`, `js/dashboard/documents.js`, `js/reader/bilingual-reader.js`, `css/dashboard/documents.css`, `docs/modules/dashboard.md`, `docs/modules/reader.md`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check` renderer/Documents/Reader, `git diff --check`, synthetic PDF geometry test (bảng 5 hàng thành một block; paragraph thường và prose hai cột không đổi) đạt; chưa browser-test PDF thật.

**2026-11-17 | v3.5.336 | Arena.ai Agent sửa:**

- Tăng bề rộng mặc định panel Bản dịch 1.5× theo các breakpoint (320/280/260px → 480/420/390px), không ghi đè bề rộng đã lưu; giảm chữ nguồn và bản dịch từ 13px xuống 12px.
- File: `manifest.json`, `css/dashboard/documents.css`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `git diff --check`, parse manifest và assertion breakpoint 1.5×, cỡ chữ 12px/inherit, fallback bề rộng đã lưu và giới hạn docs đạt; chưa browser-test Documents thật.

**2026-11-17 | v3.5.335 | Arena.ai Agent sửa:**

- Gỡ tùy chọn speaker visibility “Chỉ hiện khi đọc” khỏi cài đặt toàn app; chỉ còn `always`/`hover`. Cài đặt `reading` đã lưu từ bản cũ tự chuyển về `hover`; giữ Reader, TTS và PDF hover handler chung.
- File: `manifest.json`, `pages/dashboard.html`, `js/core/languages.js`, `js/dashboard/dashboard.js`, `js/dashboard/documents.js`, `js/reader/bilingual-reader.js`, `js/reader/reader-css.js`, `css/dashboard/documents.css`, `docs/modules/reader.md`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check` cho Dashboard/Documents/Reader/CSS/languages, parse manifest, `git diff --check`, assertions hai lựa chọn/legacy migration/no reading-only CSS-state và giới hạn docs ≤700 từ đạt; chưa browser-test thay đổi này.

**2026-11-17 | v3.5.334 | Arena.ai Agent sửa:**

- Sửa nguyên nhân icon hover PDF vẫn ẩn: JS toggle `data-source-hover` thành thuộc tính rỗng nhưng CSS yêu cầu giá trị `"true"`; CSS giờ kiểm tra sự hiện diện thuộc tính. Giữ nguyên hit-test, vị trí icon, Reader/TTS và handler chung.
- File: `manifest.json`, `css/dashboard/documents.css`, `docs/modules/reader.md`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents/Reader, parse manifest, `git diff --check` và assertion đối chiếu JS/CSS selector đạt; chưa browser-test trên Chrome/PDF thật.

**2026-11-17 | v3.5.333 | Arena.ai Agent sửa:**

- Thay hover theo event target bằng hit-test tọa độ: nếu PDF.js/canvas không target text span, kiểm tra union bounds các spans theo paragraph để bật đúng icon. `onReaderBlock` đồng bộ trực tiếp icon active; giữ setting hover/reading giống Reader web.
- File: `manifest.json`, `js/dashboard/documents.js`, `docs/modules/reader.md`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents/Reader, parse manifest, `git diff --check` và assertion coordinate hit-test/paragraph, hover/reading visibility sync đạt; chưa browser-test trên Chrome/PDF thật.

**2026-11-17 | v3.5.332 | Arena.ai Agent sửa:**

- Khớp hover semantics Reader web: rê trên bất kỳ PDF text span trong paragraph bật icon của paragraph đó; pointer chuyển giữa các span cùng đoạn không tắt icon. Setting `reading` vẫn hiện icon active và cũng hiện khi hover giống CSS web.
- File: `manifest.json`, `js/dashboard/documents.js`, `css/dashboard/documents.css`, `docs/modules/reader.md`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Documents/Reader, parse manifest, `git diff --check` và assertion hover key/paragraph, hover/reading CSS đạt; chưa browser-test hover/reading visibility trên PDF thật.

**2026-11-17 | v3.5.331 | Arena.ai Agent sửa:**

- Sửa speaker icon PDF bị rải lệch/do scale: chuyển icon vào overlay không scale của trang, tọa độ lấy từ rect ký tự cuối paragraph và kích thước 18×18px như Reader web. Dùng wrapper riêng mỗi icon để giữ hover visibility theo cài đặt chung; click/settings/TTS vẫn dùng Reader gốc.
- File: `manifest.json`, `js/reader/bilingual-reader.js`, `js/dashboard/documents.js`, `js/dashboard/documents-context.js`, `css/dashboard/documents.css`, `docs/modules/reader.md`, `docs/modules/dashboard.md`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Reader/Documents/context, parse manifest, `git diff --check` và assertion overlay không scale, tọa độ/kích thước 18px, visibility/click map đạt; chưa browser-test trực quan PDF thật.

**2026-11-17 | v3.5.330 | Arena.ai Agent sửa:**

- PDF Original bật speaker icon theo từng paragraph dùng component Reader web. Giữ nguyên TTS enable/visibility/website settings và click handler; adapter đo ký tự cuối cùng cùng union bounds paragraph nhiều span để đặt icon đúng vị trí. Read mode và web không đổi.
- File: `manifest.json`, `js/reader/bilingual-reader.js`, `js/dashboard/documents.js`, `js/dashboard/documents-context.js`, `docs/modules/reader.md`, `docs/modules/dashboard.md`, `docs/documents.md`, `README.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Reader/Documents/context, parse manifest, `git diff --check` và assertion bật icon/geometry/map handler đạt; chưa browser-test icon/TTS trên PDF thật.

**2026-11-17 | v3.5.329 | Arena.ai Agent sửa:**

- Khi Reader đang đọc hoặc tạm dừng, double-click vào paragraph sẽ hủy phát hiện tại, ánh xạ block đích về queue hiện hành và tiếp tục đọc từ block đó. Tích hợp với Reader gốc trên web và adapter Documents/PDF (kể cả span khác trong cùng paragraph/trang liên tục); bỏ qua thao tác trên thanh Reader/control/input.
- File: `manifest.json`, `js/reader/bilingual-reader.js`, `js/dashboard/documents.js`, `js/dashboard/documents-context.js`, `docs/modules/reader.md`, `docs/modules/dashboard.md`, `docs/documents.md`, `README.md`, `PROJECT.md`.
- Kiểm tra: `node --check` Reader/Documents/context, parse `manifest.json`, `git diff --check` và assertion event/target/page mapping đạt; chưa browser-test double-click trên trang/PDF thật.

**2026-11-17 | v3.5.328 | Arena.ai Agent sửa:**

- Loại hẳn đoạn nguồn đúng một ký tự khỏi Reader và danh sách Dịch của Documents. Chỉ lọc lúc render; giữ original index (`data-i`/`data-paragraph-index`/`data-trans-i`) cho các đoạn còn lại để không lệch mapping. PDF gốc/Original mode không bị sửa.
- File: `manifest.json`, `js/dashboard/documents.js`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/documents.js`, parse `manifest.json`, `git diff --check` và assertion Reader/Dịch lọc, giữ index gốc, bỏ trang chỉ có ký tự đơn đạt; chưa browser-test PDF thật.

**2026-11-17 | v3.5.327 | Arena.ai Agent sửa:**

- Không để paragraph đúng một ký tự (ví dụ dấu gạch) giành focus cuộn; chỉ lọc khỏi chọn ứng viên, không xóa text/card. Nếu không còn paragraph dài hơn một ký tự, fallback về toàn bộ ứng viên.
- File: `manifest.json`, `js/dashboard/documents.js`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/documents.js`, parse `manifest.json`, `git diff --check` và assertion lọc ký tự/fallback/căn tâm đạt; chưa browser-test đồng bộ trên PDF thật hoặc double-click Reader.

**2026-11-17 | v3.5.326 | Arena.ai Agent sửa:**

- Sửa nghĩa căn ngang theo xác nhận: tâm dọc của bounding box đoạn PDF trùng tâm dọc toàn card nguồn + bản dịch. Giữ chọn đoạn gần tâm viewport và mapping bằng `paragraphIndex`.
- File: `manifest.json`, `js/dashboard/documents.js`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/documents.js`, parse `manifest.json`, `git diff --check` và assertion tâm đoạn/tâm card đạt; chưa browser-test cuộn PDF thật.

**2026-11-17 | v3.5.325 | Arena.ai Agent sửa:**

- Theo phản hồi ảnh, chọn đoạn PDF gần tâm vùng đọc nhất thay vì đoạn gần mép trên; cuộn card gốc + dịch tương ứng để mép trên card trùng cao độ với đoạn nguồn. Ghép bằng `paragraphIndex`.
- File: `manifest.json`, `js/dashboard/documents.js`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/documents.js`, parse `manifest.json`, `git diff --check` và assertion chọn đoạn gần tâm/căn mép card đạt; chưa browser-test đồng bộ cuộn PDF thật.

**2026-11-17 | v3.5.324 | Arena.ai Agent sửa:**

- Panel Dịch khi bật Cuộn theo tệp: theo dõi đoạn PDF đang ở vị trí cuộn, tìm hàng tương ứng bằng `paragraphIndex`, tính union rect của các spans thuộc đoạn và cuộn panel để khung gốc+bản dịch ngang cao với đoạn nguồn. Không đổi dịch vụ/provider hoặc Reader queue.
- File: `manifest.json`, `js/dashboard/documents.js`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/documents.js`, parse `manifest.json`, `git diff --check` và assertion mapping/căn chỉnh đạt; chưa browser-test đồng bộ cuộn PDF thật.

**2026-11-17 | v3.5.323 | Arena.ai Agent sửa:**

- Panel Dịch Tài liệu: bỏ khoảng đệm dọc trên/dưới trong native bilingual card để bỏ hai dải trống như hình người dùng chỉ ra. Giữ padding ngang, thanh tím, margin ngoài và Reader mode.
- File: `manifest.json`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/documents.js`, parse `manifest.json`, `git diff --check`; assertion xác nhận padding dọc bằng 0 chỉ trên card trong translation panel, Reader style chung giữ nguyên — PASS. Chưa browser-test trực quan.

**2026-11-17 | v3.5.322 | Arena.ai Agent sửa:**

- PDF Reader: khung đơn bao đoạn nay dùng đúng style gốc của Reader web — outline 2px, offset 4px, nền accent 8%, bo góc 6px; bỏ padding hình học tự cộng để không làm khung lệch/dày thêm.
- File: `manifest.json`, `js/dashboard/documents.js`, `css/dashboard/documents.css`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/documents.js`, parse `manifest.json`, `git diff --check`; synthetic bounding rects produce one unpadded box and CSS values match Reader web (2px/4px/8%/6px) — PASS. Chưa xác nhận hình ảnh trên Chrome/PDF thật.

**2026-11-17 | v3.5.321 | Arena.ai Agent sửa:**

- PDF Reader: loại viền thứ hai — rule Reader gốc `.lhn-bilingual-reading` vẫn thêm outline lên span đầu. Chỉ vô hiệu outline/background gốc trong PDF text layer; overlay đơn bao toàn đoạn giữ nguyên. Overlay mới chỉ áp dụng cho PDF, DOCX/PPTX không đổi.
- File: `manifest.json`, `js/dashboard/documents.js`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/documents.js`, parse `manifest.json`, `git diff --check`; assertion xác nhận override chỉ trong `.pdfTextLayer` có độ đặc hiệu cao hơn rule Reader gốc, overlay một khung còn hoạt động và chỉ áp dụng PDF — PASS. Chưa xác nhận trên Chrome/PDF thật.

**2026-11-17 | v3.5.320 | Arena.ai Agent sửa:**

- PDF Reader: bỏ outline per-span; vẽ một overlay/viền duy nhất theo bounding box của tất cả text spans trong đoạn đang đọc. Overlay cập nhật khi Reader chuyển đoạn và được dọn khi dừng; giữ đoạn đọc, dịch và ánh xạ span như v3.5.319.
- File: `manifest.json`, `js/dashboard/documents.js`, `css/dashboard/documents.css`, `docs/documents.md`, `PROJECT.md`.
- Kiểm tra: `node --check js/dashboard/documents.js`, parse `manifest.json`, `git diff --check`; geometry helper gom nhiều rect dòng thành đúng một khung — PASS. Chưa xác nhận ảnh highlight trên trình duyệt thật.

**2026-11-17 | v3.5.319 | Arena.ai Agent sửa:**

- PDF: gom nhiều dòng thành một đoạn logic chung cho panel Dịch và Reader. Mỗi text span vẫn giữ `data-i` riêng; `paragraphIndex`/`paragraphStart` nối các span cùng đoạn. Reader nhận toàn văn đoạn, chỉ bắt đầu đọc/dịch một lần và highlight các span thuộc đoạn đang đọc; anchor ở chế độ Đọc vẫn lưu offset theo đoạn và resolve về spans gốc. Dịch vụ/provider không đổi.
- File: `manifest.json`, `js/dashboard/documents-renderers.js`, `js/dashboard/documents.js`, `docs/documents.md`, `docs/modules/reader.md`, `PROJECT.md`.
- Kiểm tra: `node --check` renderer/documents/Reader, parse manifest, `git diff --check`; synthetic PDF 3 dòng thành một đoạn, hai đoạn tách riêng, và text-layer mismatch vẫn ánh xạ đủ — PASS. Chưa browser-test PDF thật hoặc nghe Reader thật.

**2026-11-17 | v3.5.318 | Arena.ai Agent sửa:**

- Hoàn nguyên phần thay đổi tái dựng/ánh xạ đoạn PDF ở v3.5.316 về xử lý trước đó, sau báo cáo người dùng rằng PDF chỉ dịch được một phần; giữ riêng các chỉnh sửa UI màu và cỡ chữ của v3.5.317. Chưa xác định được nguyên nhân gốc bằng browser test.
- File: `manifest.json`, `js/dashboard/documents-renderers.js`, `js/dashboard/documents.js`, `docs/documents.md`, `docs/modules/reader.md`, `OPT-ARENA.md`, `PROJECT.md`; giữ nguyên `css/dashboard/documents.css` và `js/reader/bilingual-reader.js` của v3.5.317.
- Kiểm tra: `node --check` cho renderer, documents và Reader; parse manifest; `git diff --check`; assertion xác nhận đường lấy text PDF / một block mỗi text layer span quay lại như trước v3.5.316 — tất cả PASS. Chưa xác nhận dịch PDF trên trình duyệt thật.

**2026-11-17 | v3.5.317 | Arena.ai Agent sửa:**

- Tài liệu: màu chữ card dịch mặc định dùng màu mực theo theme của Documents (màu tùy chỉnh vẫn giữ nguyên). Chữ nguồn và chữ dịch trong panel cùng dùng cỡ chữ cha; card trong Reader mode cũng kế thừa cỡ chữ đoạn gốc.
- File: `manifest.json`, `js/reader/bilingual-reader.js`, `css/dashboard/documents.css`, `PROJECT.md`.
- Kiểm tra: `node --check` Reader, parse manifest và `git diff --check`; chưa browser-test giao diện sáng/tối hoặc PDF thật.

**2026-11-17 | v3.5.316 | Arena.ai Agent sửa:**

- Tài liệu PDF: tái dựng text items theo tọa độ thành dòng/đoạn, tách cột hai bên khi có gutter ổn định, ghép từ gạch nối cuối dòng. Reader và Dịch nhận một block mỗi đoạn; text spans gốc vẫn giữ index riêng cho selection/anchor, highlighting khi đọc áp lên các mảnh của đoạn. DOCX/PPTX và OCR chưa đổi.
- Cập nhật trạng thái ý tưởng và hợp đồng Reader/Tài liệu.
- File: `manifest.json`, `js/dashboard/documents-renderers.js`, `js/dashboard/documents.js`, `docs/documents.md`, `docs/modules/reader.md`, `OPT-ARENA.md`, `PROJECT.md`.
- Kiểm tra: `node --check` hai file JS; dữ liệu PDF giả lập một cột, hai cột, gạch nối PASS; `git diff --check` PASS. Chưa browser-test trên PDF thật, Firefox hoặc Edge Android.

**2026-10-23 | v3.5.315 | Arena.ai Agent sửa:**

- Sửa đúng góp ý: áp dụng demo chỉ chốt layout, công cụ phải dùng cái đã có của app. Bỏ Reader/player, toolbar chọn chữ/dictionary, Notes CRUD/sidebar và khung AI riêng trong Tài liệu. Giữ bộ mở tệp thật v314.
- Owned source adapter nối native `content.js`, `LHN_SELECTION_TOOLBAR`, `LHN_NOTE_COMPOSER`/`LHN_SIDEBAR`, Full Dictionary, Reader gốc và AI panel/sheet. Reader có nguyên voice/speed/repeat/controls; chỉ host chữ thật, tiến độ/chuyển trang và card placement khác. Notes/touch sheet và AI sheet dùng component chung, không copy UI.
- Chuyển ghi chú v314 vào annotations chung, giữ ngày/quote/page/block offsets; Source identity UUID, anchor gắn hash cục bộ. Có H&N/Flashcards/JSON backup chung, deep link/jump local và portable origin import; không đưa blob tệp vào backup hay gửi file/hash cho AI. Ghi/source async cũ không được tác động source mới.
- File: `documents*.js/html/css`, native Content/Notes/Reader/selection helpers, `ask-ai/sheet.js`/routing/toolbar/providers, Dashboard/backup/H&N/background local links, manifest/home dependencies; nhãn/README/privacy/inventory/docs và kiến trúc tương ứng.
- Kiểm tra: Chromium extension thật PASS native selector/composer/save/anchor/reopen, note migration/duplicate guard, H&N, native Reader/page continuation/speed/settings/native cards, real dictionary/tim/common store, actual panel-open API, touch bridge/Notes/AI sheet/deep link/image note/backup refs. Web selection/note/Reader + homepage regression và owned-URL rejection PASS. Mock chỉ ở một số service boundaries, không thay Reader/Notes/selector implementations.
- Chưa kiểm: AI đã đăng nhập/send/mapping thực với cả ba provider, giọng thực nghe, Firefox và Edge Android thật. Provider iframe có thể báo 404/frame-block khi chưa đăng nhập trong môi trường kiểm thử; không coi native UI mở thành công là provider login thành công.

**2026-10-23 | v3.5.314 | Arena.ai Agent sửa:**

- Áp dụng demo Tài liệu v13 vào app với tệp PDF, DOCX, PPTX, JPG/PNG/WebP thật. Thêm route/sidebar/Thêm; thư viện bắt đầu trống, hash nội dung chống trùng, lưu blob/tiến độ/notes/cached translation cục bộ và phục hồi sau restart. Không thêm các ý tưởng người dùng đã từ chối.
- Giữ UI v13: một hàng toolbar có Keepit/theme; continuous/single-page nhớ gần nhất; zoom, pager tự mờ sau 1 giây và nhận lần bấm đầu; ←/→ có guard; translation header một hàng, ngôn ngữ/follow; hai sidebar kéo riêng, portrait sheet. Notes lưu quote anchors, không ghi lại HTML tệp. POS dùng mô hình chung và lớp phủ để không viết lại bố cục gốc.
- PDF.js local/text layer/mật khẩu thật, không lưu mật khẩu hoặc thumbnail giải mã của PDF khóa; DOCX/PPTX local có sanitizer, giữ thứ tự slide và speaker notes, chặn nội dung chủ động/nguồn ngoài và ZIP quá ngưỡng. Office preview có cảnh báo phông/đối tượng nâng cao; OCR/XFA/form editing/animation chưa có. Không thêm quyền hay CSP bypass; JSON backup cũ chưa gồm thư viện tệp.
- File: `pages/dashboard.html`, `pages/documents.html`, `js/dashboard/dashboard.js`, `responsive-nav.js`, `documents*.js`, `css/dashboard/documents*.css`, `js/core/languages.js`, `manifest.json`; vendor/licences, tài liệu kiến trúc và privacy/inventory/README/notices tương ứng.
- Kiểm tra: Chromium extension thật PASS desktop/phone vi/ko, import bốn loại, text/bảng/hình, note edit/anchor, draft khi đổi theme, flow/width/progress/reload/cold restart, PDF khóa đúng/sai/hủy, tệp hỏng, ZIP vượt bound, unsafe markup, không tải tệp ra mạng, màu nguồn sáng/tối, responsive, masters, route cũ. Bridge Dịch/POS/AI/TTS kiểm bằng service mock; provider Dịch/từ điển và tải audio Google thật PASS. Syntax/refs/manifest/diff và gói cài kiểm ở bước đóng gói.
- Chưa kiểm: Firefox, Edge Android thật; AI đã đăng nhập, chất lượng giọng thực nghe và độ trung thực mọi tệp Office phức tạp. Không coi mock hoặc tải audio là đã nghe giọng.

### 2026-10-23 | v3.5.313 — Popup Phân tích lỗi sai: bài web có favicon và link
- Nguyên nhân: `safeVideoUrl` trong `dictation-stats-popup.js` chỉ giữ link youtube.com, nên từ v3.5.308 (bài web nhận đúng là web) link bài báo bị bỏ → "?" và không bấm được. Trước đó bài web hiện ▶ với link `youtube.com/watch?v=web-…` (sai).
- Nhận link http/https; bài web có favicon trang, tiêu đề mở đúng bài; chưa có link thì icon quả địa cầu. Dòng nguồn của bài web dùng 🌐 thay 📺. YouTube giữ nguyên.

### 2026-10-23 | v3.5.312 — Dashboard: bài Dictation web giống YouTube (ảnh bìa, Tiếp tục vào thẳng Chép)
- Bản ghi web lưu `thumbnailUrl` (og:image của trang); bài cũ tự có khi mở lại trang. Session index giữ `thumbnailUrl`.
- Thẻ lịch sử và khung "Tiếp tục Dictation" hiện ảnh bìa web như thumbnail YouTube.
- Tiếp tục (bài web): Dashboard ghi `lhnDictationOpenIntent {sourceId, at}`; trang có đúng `web-<hash>` tự mở Overlay ở chế độ học đã chọn, đúng câu đang làm (như `lhn_open_dictation` của YouTube). Intent hết hạn sau 2 phút.
- PRIVACY-POLICY: thêm tiêu đề, địa chỉ và địa chỉ ảnh xem trước của bài web.

### 2026-10-23 | v3.5.311 — Dashboard: tự tìm lại tổng số câu của bài Dictation cũ
- Bài cũ chưa có tổng câu: Dashboard lấy lại từ bộ nhớ đệm cục bộ của Overlay rồi ghi `totalCount` vào bản ghi:
  - web: bộ nhớ đệm câu của bài (`lhnWebStudyCueCache`) có câu đầu trùng tiêu đề bài;
  - YouTube: phụ đề đã lưu (`lhnYouTubeTranscriptCache`, bản `en`), cắt câu bằng đúng hàm của Overlay trong worker `js/dashboard/sentence-count-worker.js`.
- Thẻ đồng đều: luôn có dòng nguồn (web chưa có link: "Chưa có liên kết trang" en/vi/ko) và "x / tổng câu"; chưa biết tổng thì "x câu", thanh giữ chỗ nhưng ẩn.

### 2026-10-23 | v3.5.310 — Dashboard: bài Dictation web cũ hiện đúng
- Nhãn nguồn web chỉ là "Web" / "Web" / "웹".
- Thẻ web không bao giờ hiện mã nội bộ `web-…`: có link thì hiện tên miền, chưa có thì ẩn dòng nguồn.
- Bản ghi web lưu `totalCount`; chưa biết tổng thì hiện "7 câu" và ẩn thanh rỗng.
- Mở lại trang của một bài web cũ (bản ghi chưa có `url`) sẽ tự ghi `url`; mở Overlay trên bài đã có bản ghi sẽ ghi lại phiên (URL, tổng câu).
- Tiếp tục với bài chưa có link: chuyển tới tab đang mở trang đó, nếu không có thì báo cần mở trang một lần (en/vi/ko).

**2026-11-16 | v3.5.309 | Arena.ai Agent sửa:**

- Dashboard > Chép chính tả, theo báo lỗi sau v3.5.308: bài chép web (news.tuoitre.vn) biến mất khỏi Dashboard, dù trang vẫn còn lịch sử. Nguyên nhân gốc: `saveStudyNow` (overlay-ui.js) gọi `mergeSessions(prev.sessions, {…})` với object thay vì mảng → luôn lỗi "not iterable" (bị `catch` nuốt) nên Overlay chưa bao giờ ghi `dictation:session-index:v1` (cả YouTube lẫn web). YouTube vẫn hiện nhờ Dashboard dựng lại từ record; web chỉ hiện nhờ phiên giả `youtube:web-…`, mà v3.5.308 đã loại → mất thẻ. Sửa: truyền mảng (index được ghi thật); record web lưu thêm `url`; `session-index.js` thêm `reconcileWebRecord` (record `dictation:web-<hex>` → phiên `web:`, giữ tiêu đề / tiến độ, URL từ index → record → highlight cùng tiêu đề); Dashboard dùng nó lúc mở và khi dữ liệu đổi. Record cũ không có URL vẫn hiện thẻ; nút mở báo "không có liên kết nguồn" cho tới lần học lại trên trang.
- File: `js/overlay/ui/overlay-ui.js`, `js/overlay/study/session-index.js`, `js/dashboard/dashboard.js`, `docs/modules/dashboard.md`, `manifest.json`.
- Kiểm tra: `node --check`; tái hiện trên bài thật news.tuoitre.vn (California Fitness…) bằng Chromium + extension: bản v3.5.308 lưu record `dictation:web-f828d6` nhưng index rỗng, Dashboard 0 thẻ; log cho thấy lỗi "(group || []) is not iterable". Bản mới: (A) dữ liệu như của người dùng (record không URL + phiên giả `youtube:web-`) → thẻ Web đúng tiêu đề, lọc 2 / 1 / 1, mở → toast thiếu liên kết; (B) học tiếp trên trang thật → Overlay mở đúng câu 4/28 (giữ tiến độ), record có `url`, index `web:web-f828d6` URL tuoitre 4/28, Dashboard thẻ Web "news.tuoitre.vn", Tiếp tục mở đúng bài; (C) thẻ YouTube giữ nguyên; không lỗi trang.

**2026-11-16 | v3.5.308 | Arena.ai Agent sửa:**

- Dashboard > Chép chính tả, theo báo lỗi: bài chép trên trang web bị nhận nhầm là video YouTube. Nguyên nhân: Dashboard đối soát mọi khoá `dictation:<id>` bằng regex `[A-Za-z0-9_-]{6,}`, khớp cả `dictation:web-<hex>` của trang web → tạo thêm phiên `youtube:web-…` (thẻ YouTube thứ hai, ảnh `i.ytimg.com/vi/web-…` hỏng, bộ lọc YouTube đếm dư) và ghi phiên đó vào `dictation:session-index:v1`; popup "Xem thống kê chi tiết" cũng coi mọi bài là YouTube (nguồn trỏ `youtube.com/watch?v=web-…`, đi tìm tên trong tab YouTube). Sửa: `session-index.js` thêm `isWebSourceId` (`web-<hex>`, dạng mà mã video YouTube không có); `fromLegacyYouTubeRecord` bỏ qua mã web; `normalizeSession` loại phiên `youtube:web-…` đã lưu nhầm (index tự sạch ở lần ghi sau). `dictation-stats-popup-bridge.js`: bài web lấy tên / URL từ phiên `web:`, không gắn link YouTube, không tìm tên trong tab YouTube.
- File: `js/overlay/study/session-index.js`, `js/dashboard/dictation-stats-popup-bridge.js`, `docs/modules/dashboard.md`, `manifest.json`.
- Kiểm tra: `node --check`; Chromium + extension thật, dữ liệu 1 bài web (`dictation:web-2d096b53` + phiên `web:` và phiên `youtube:web-…` lưu nhầm) + 1 bài YouTube. Bản cũ: 3 thẻ (1 thẻ YouTube giả, ảnh hỏng), lọc 3 / 2 / 1, popup có link `watch?v=web-2d096b53` — tái hiện đúng lỗi. Bản mới: 2 thẻ (Web + YouTube), lọc 2 / 1 / 1, index lưu còn `web:web-2d096b53`, `youtube:dQw4w9WgXcQ`; popup thống kê đủ từ của cả 2 bài, chỉ bài YouTube có link; không lỗi trang.

**2026-11-16 | v3.5.307 (không phát hành) | Arena.ai Agent sửa:**

- `OPT-ARENA.md`, theo yêu cầu: xoá 8 mục đã triển khai (Tái cấu trúc cây thư mục v3.5.191–199; Thanh Reader; Thanh Bilingual Reader; 14 góp ý chạm; Overlay khớp demo v10; Overlay cảm ứng demo v10; Bản chốt v3.5.136; Tên, slogan và mô tả cửa hàng). Giữ nguyên 5 mục còn lại. Thêm 4 mục riêng cho ý tưởng chưa ghi: Loại từ B5 (độ tự tin mô hình, chờ quyết), Cài đặt / Đăng nhập dạng sheet trong trang trên máy tính, làm lại giao diện responsive, bản APK Android.
- File: `OPT-ARENA.md`, `PROJECT.md`. Không đổi code, không đổi phiên bản.

**2026-11-16 | v3.5.307 | Arena.ai Agent sửa:**

- Dashboard, theo yêu cầu: xoá 9 tab trống trên thanh bên (Luyện đề SW, Luyện viết, Luyện nói Shadowing, Từ vựng, Luyện đọc, Bảng tin, Tin nhắn, Affiliate, Dành cho giáo viên — chỉ là link `#`, không mở gì). Thanh bên còn Tổng quan, Chép chính tả, Ôn tập (Flashcards), Tô sáng & Ghi chú. Sheet "Thêm" trên điện thoại bỏ nhóm "Sắp có" (dựng từ chính các tab đó) cùng toast "Tính năng sắp có" và CSS liên quan.
- File: `pages/dashboard.html`, `js/dashboard/responsive-nav.js`, `css/dashboard/responsive.css`, `docs/modules/dashboard.md`, `manifest.json`.
- Kiểm tra: `node --check`; Chromium + extension thật: desktop 1280px thanh bên đúng 4 mục, bấm Chép chính tả / Tô sáng & Ghi chú chuyển đúng; điện thoại 390px sheet Thêm chỉ còn Cài đặt / Giao diện / Tài khoản, không còn "Sắp có"; sáng và tối; không lỗi trang.

**2026-11-16 | v3.5.306 | Arena.ai Agent sửa:**

- Overlay nhất quán, theo yêu cầu: (1) Phím chung cho Nói và Chép: bỏ (`) ở mọi tab (Xem / Nói / Chép, Space vẫn phát / dừng); Ctrl = Nghe lại / Dừng ở cả Nói và Chép; phím (→) = Câu tiếp ở Nói và Chép (Chép: khi không gõ trong ô, hoặc sau Kiểm tra khi ô đã khoá); Chép Esc vẫn = Đáp án / Làm lại. Gợi ý phím en/vi/ko cập nhật. (2) Khi Overlay mở, popup dịch, popup từ điển và sidebar Ghi chú theo theme của Overlay (đổi theme trong Overlay → đổi theo; đóng Overlay → về theme trong Cài đặt). (3) Phụ đề cùng ngôn ngữ hiển thị: Nói / Chép không hiện nút Dịch và dòng dịch (trước đây lặp lại y câu gốc). (4) Dịch các chỗ còn cố định tiếng Việt: Ẩn phụ đề, Nhanh, Tự động, Đọc / Xem, Đã sửa, Tỷ lệ sửa, Xoá ghi chú, tên ngôn ngữ phụ đề, Micro (Enter), "Từ cần luyện". (5) Dòng "Nhấn để dịch" bị mờ có tooltip "Phụ đề đã cùng ngôn ngữ hiển thị" (en/vi/ko).
- File: `js/overlay/ui/overlay-ui.js`, `js/overlay/ui/overlay-css.js`, `js/content/content.js`, `js/core/languages.js`, `docs/modules/overlay.md`, `manifest.json`.
- Kiểm tra: `node --check`; Chromium + extension thật (trang web video giả, hiển thị en và vi): Xem (`) không phát, Space phát; Nói/Chép Ctrl phát → Ctrl dừng, (`) không đổi, (→) sang câu 2; Chép (→) khi đang gõ chỉ dời con trỏ, Esc điền đáp án, Enter kiểm tra, (→) sang câu tiếp; en: không còn chữ Việt trong bảng Thêm / Cài đặt, Nói/Chép không có nút Dịch / dòng dịch; vi: vẫn có; tooltip dòng mờ đúng; Overlay tối + Cài đặt sáng → sidebar Ghi chú tối, đổi Overlay sáng → sáng, đóng Overlay → sáng; không lỗi trang. Chưa thử trực tiếp popup dịch / từ điển trong Overlay (dùng cùng hàm theme), chưa thử YouTube thật / điện thoại.

**2026-10-23 | v3.5.305 | Arena.ai Agent sửa:**

- Overlay, theo yêu cầu: (1) Overlay web (video giả): tạm dừng thì mọi hiệu ứng trên hình (hạt, sóng, ảnh chuyển động, đổi màu / hiệu ứng ngẫu nhiên) đứng yên — đồng hồ hiệu ứng chỉ chạy khi đang phát, phát lại chạy tiếp từ chỗ dừng; (2) phụ đề cùng ngôn ngữ hiển thị → mỗi lần mở Overlay luôn là chế độ Phụ đề chính (dù lần trước đã chọn khác); kiểu mặc định dùng chung cách so ngôn ngữ của v3.5.302 (trang web không chắc ngôn ngữ thì xét 12 câu đầu); thanh điều khiển cập nhật khi Overlay tự đổi chế độ; (3) Nói: Enter chỉ bấm mic (bắt đầu / dừng; ở màn kết quả = ghi âm lại), không chuyển câu; (4) Nói: Nghe mẫu / Giọng bạn / mic loại trừ nhau — Nghe mẫu khi đang ghi âm thì huỷ lần ghi âm, khi đang phát Giọng bạn thì dừng nó; (5) Nói: Esc = bỏ qua câu; (6) Nói: bỏ phím (`) Phát/tạm dừng; (7) Nói: Ctrl = Nghe lại, đang phát thì Dừng. Dòng phím tắt Nói: "(Enter) Bắt đầu/dừng · (Esc) Bỏ qua câu · (Ctrl) Nghe lại/Dừng" (en/vi/ko); chú thích nút Nghe mẫu "(Ctrl)". Xem / Chép giữ phím cũ.
- File: `js/overlay/source/web.js`, `js/overlay/overlay-engine.js`, `js/overlay/overlay-controller.js`, `js/overlay/ui/overlay-ui.js`, `js/core/languages.js`, `docs/modules/overlay.md`, `manifest.json`.
- Kiểm tra: Chromium nạp extension thật, Overlay web (Alt+F), trang tiếng Anh. Hiển thị en: mở → Phụ đề chính; bấm 1 (Song ngữ), đóng, mở lại → Phụ đề chính; hiển thị vi: Song ngữ. Canvas hình: tạm dừng 0,7–1,5s không đổi điểm ảnh, đang phát thì đổi. Nói: (`) không làm gì; Ctrl phát, Ctrl lần nữa dừng; Esc sang câu 2/2; Enter khi đang Nghe mẫu → dừng mẫu và bật mic (Chromium headless không có nhận diện giọng nói nên báo bị từ chối). Chưa thử được: Nghe mẫu khi đang ghi âm thật, Giọng bạn; YouTube thật / điện thoại. Không lỗi trang.

**2026-10-23 | v3.5.304 | Arena.ai Agent sửa:**

- Overlay, theo yêu cầu: hướng dẫn chạm tim bấm liên tục 10 cái (gấp đôi 5 cái trước), cùng nhịp 220ms, không nghỉ giữa chừng như v3.5.303; tim bay từ cái thứ 2; phần hiện vào / mờ dần giữ như cũ (tổng 3,9s). Kèm sửa: hướng dẫn mới chạy thì tắt hướng dẫn cũ đang chạy (Thường → Rạp không qua chạm, ví dụ phím tắt, trước đây có thể hiện 2 bàn tay).
- File: `js/overlay/ui/overlay-ui.js`, `docs/modules/overlay.md`, `manifest.json`.
- Kiểm tra: Chromium nạp extension thật, Overlay web (Alt+F). Mở thẳng vào Rạp: 10 vòng chạm, 9 tim cách đều ~220ms, hiện ~3,9s. Mở ở Thường rồi vào Rạp bằng lệnh (không chạm): hướng dẫn Thường dừng ngay khi hướng dẫn Rạp bắt đầu, chỉ 1 chuỗi tim. Không lỗi trang. Chưa thử YouTube thật / điện thoại.

**2026-10-23 | v3.5.303 | Arena.ai Agent sửa:**

- Overlay, theo yêu cầu: (1) hướng dẫn chạm tim hiện gấp đôi thời gian (5,6s, 2 lượt × 5 cái chạm); (2) Rạp: chạm 2 lần thả tim không hiện tim nhỏ ở góc video nữa, chỉ tim ở thanh điều khiển; (3) Overlay có theme riêng: mỗi lần mở theo giao diện của website (nền trang tối hoặc đang bật Trang tối → tối, trang sáng → sáng); nút theme trong Overlay đổi tạm đến khi tải lại trang, không ghi `lhnSettings.sidebarTheme` (thay quy tắc v3.5.300 cho Overlay); (4) khung xem trước Phụ đề giống Overlay đang hiện: Rạp + Phụ đề video = nền video, màu mặc định trắng / vàng như phụ đề trên video; còn lại = nền theme Overlay, màu theo theme; (5) dòng Nền phụ đề chỉ hiện ở chế độ Rạp.
- File: `js/overlay/ui/overlay-ui.js`, `js/overlay/ui/overlay-css.js`, `docs/ui-layout.md`, `docs/modules/overlay.md`, `manifest.json`.
- Kiểm tra: Chromium nạp extension thật, Overlay web (Alt+F), Keepit theme Sáng. Trang nền #121212 → Overlay tối; trang sáng → sáng; ☰ đổi theme → tối, cài đặt Keepit vẫn Sáng; đóng rồi mở lại → vẫn tối; tải lại trang → sáng. Phụ đề ở Thường: xem trước nền #f6f7fb, chữ tím, không có dòng Nền; ở Rạp: nền video, chữ trắng, có dòng Nền. Hướng dẫn tim ở Rạp hiện sau 0,94s, kéo dài 5,8s. Rạp chạm 2 lần: 1 tim to, tim thanh điều khiển đỏ, góc video không hiện tim. Không lỗi trang. Chưa thử YouTube thật / điện thoại.

**2026-10-23 | v3.5.302 | Arena.ai Agent sửa:**

- Overlay, theo yêu cầu: (1) ngôn ngữ phụ đề trùng ngôn ngữ hiển thị → tắt bấm dịch và chọn dịch (cả chữ ở Nói / Chép), dòng "Bấm để dịch" trong Cài đặt video mờ, không bấm được. Ngôn ngữ phụ đề lấy theo thứ tự: chọn tay → track video → trang web khi chắc chắn, hoặc 12 câu đầu nhận rõ một ngôn ngữ; không rõ thì vẫn cho dịch; (2) nút ♥ / Rạp góc video ở light mode icon trắng như dark mode (`.ov button{color:inherit}` đè màu trắng); (3) tên nguồn Web chạy chữ lại được (sau v3.5.301 hàm chạy chữ lấy nhầm span quả địa cầu); (4) hướng dẫn chạm tim chạy riêng cho Rạp (Thường và Rạp mỗi chế độ 1 lần mỗi lần mở); cảm ứng: chạy sau khi tắt gợi ý Rạp.
- File: `js/overlay/overlay-engine.js`, `js/overlay/ui/overlay-ui.js`, `js/overlay/ui/overlay-css.js`, `js/content/content.js`, `docs/modules/overlay.md`, `manifest.json`.
- Kiểm tra: Chromium nạp extension thật, Overlay web (Alt+F), trang tiếng Anh. Hiển thị vi: bấm chữ đánh dấu chữ, chọn "digital economy" → hiện "kinh tế số", dòng Bấm để dịch bình thường. Hiển thị en: bấm chữ không gì xảy ra, chọn chữ không mở dịch, dòng mờ 0.45. Nút góc video lớn: light và dark đều màu #fff trên nền đen 50%; thẻ nhỏ giữ như cũ. Tên trang dài: rê chuột → chạy chữ. Mở thẳng vào Rạp → hướng dẫn tim hiện. Không lỗi trang. Chưa thử YouTube thật / điện thoại.

**2026-10-23 | v3.5.301 | Arena.ai Agent sửa:**

- Overlay, theo yêu cầu: (1) khung "Kết quả nhận diện giọng nói" trải rộng 2 bên như câu và bản dịch (màn rộng); (2) khoá câu ở danh sách bên trái của Nói độc lập với Chép — bản ghi cũ chỉ có tiến độ chung (của Chép) không còn làm Nói mở khoá theo; (3) Lặp câu riêng từng tab: Nói mặc định tắt, Chép mặc định 3, Xem giữ tắt; chạm nút Lặp câu mở sheet Lặp câu (chú thích sheet / tooltip cập nhật en/vi/ko); (4) lỗi icon nguồn Web: thanh dưới hiện favicon của trang (như PROJECT.md mục 3 đã ghi) thay quả địa cầu; trang không có favicon vẫn là quả địa cầu.
- File: `js/overlay/ui/overlay-ui.js`, `js/overlay/ui/overlay-css.js`, `js/core/languages.js`, `docs/modules/overlay.md`, `manifest.json`.
- Kiểm tra: Chromium nạp extension thật, Overlay web (Alt+F) trên trang thử. Chép: Lặp 3 bật, chạm → sheet chọn 3; Nói: tắt, chạm → sheet chọn Tắt, chọn 2 → Nói 2, Chép vẫn 3, Xem tắt. Khung kết quả rộng 460 = câu 460 = bản dịch 460. Bản ghi cũ `{current:1, solved:[0]}`: Chép câu 1 xong + câu 2 mở; Nói câu 1 chưa làm + câu 2 khoá. Trang có `<link rel=icon>`: favicon hiện, quả địa cầu ẩn; trang không có: quả địa cầu. Không lỗi trang. Chưa thử YouTube thật / điện thoại.

**2026-10-23 | v3.5.300 | Arena.ai Agent sửa:**

- Lỗi icon tự hiện lại: đổi theme (hay bất kỳ cài đặt nào) làm icon Keepit + Ghi chú / Dịch / Hỏi AI hiện lại ở chỗ bôi đen cũ dù đã bấm ra ngoài để tắt — nay chỉ cập nhật icon đang hiện.
- Theme thống nhất: sidebar, icon chọn chữ, popup dịch, khung ghi chú không còn theo theme riêng của trang web (chế độ Theo hệ thống) mà theo máy như thanh Keepit / từ điển / Loại từ; Overlay bỏ theme riêng (mặc định Tối) → theo cài đặt chung, nút theme trong Overlay ghi vào cài đặt chung; nền trang Home theo theme Keepit.
- File: `js/content/content.js`, `js/overlay/ui/overlay-ui.js`, `js/home/home-ui.js`, `docs/ui-layout.md`, `manifest.json`.
- Kiểm tra: Chromium nạp extension thật. Bôi đen → icon hiện, bấm ra ngoài → mất, đổi Tối / Sáng → không hiện lại; icon đang hiện thì đổi màu theo theme. Theo hệ thống + máy sáng + trang `html.dark` → icon sáng. Overlay (Alt+F trên trang thử): theo cài đặt chung sáng / tối, nút theme trong ☰ Overlay ghi `sidebarTheme`. Home: Keepit Sáng + máy tối → nền sáng; Theo hệ thống → tối. Các nút theme ở thanh ☰, Bảng quản lý, popup không đổi cài đặt khác. Không lỗi trang.

**2026-10-23 | v3.5.299 | Arena.ai Agent sửa:**

- Cài đặt: thêm trang **Từ điển** (Tiện ích, ngay sau Dịch) — chuyển từ trang Dịch sang: Hiện từ điển tiếng Anh đầy đủ, Mục trong từ điển đầy đủ + xem trước, Bộ nhớ đệm từ điển. Trang mờ khi Bật dịch (trang Dịch) tắt, vì từ điển cần dịch bật. Nút Đặt lại riêng cho Dịch / Từ điển. Không đổi khóa lưu hay cách hoạt động.
- File: `pages/dashboard.html`, `js/dashboard/dashboard.js` (`DASHBOARD_SETTINGS_TAB_NAMES`), `js/core/languages.js` (`dictionaryTab`, `kpTabHelpDictionary` en/vi/ko), `css/dashboard/settings.css`, `docs/ui-layout.md`, `manifest.json`. Sửa ghi chú Kiểm tra v3.5.297 (tuoitre chưa chạy lại).
- Kiểm tra: dashboard (stub) 1300px sáng / tối, 390px cảm ứng: tab Từ điển mở, xem trước hiện; tắt Bật dịch → trang Từ điển mờ + inert; đổi Câu ví dụ → Đặt lại Từ điển tím, Dịch không; Đặt lại → về mặc định; trang Dịch chỉ còn Bộ nhớ đệm bản dịch; không lỗi trang.

**2026-10-23 | v3.5.298 | Arena.ai Agent sửa:**

- Loại từ: danh từ nối bằng gạch nối viết liền được gộp như danh từ liền kề — "Notre-Dame Cathedral Basilica" một gạch N liền qua dấu gạch, rê chuột "Notre-Dame Cathedral Basilica: danh từ riêng"; "e-mail" một N, rê chuột "e-mail: danh từ". Gạch nối với từ không phải danh từ giữ như cũ ("Anti-Draft" Adj · N, "Saigon-based" N + V); gạch ngang có khoảng trắng không gộp.
- File: `js/word-class/core.js` (`units` — `link()`, `tip`), `manifest.json`, `docs/modules/word-class.md`.
- Kiểm tra: `units`/`tip` với nhãn giả (7 câu, gồm "War.[25]", "City’s streets" như v3.5.297); Chromium nạp extension thật, trang thử: Notre-Dame Cathedral Basilica / e-mail một N, Anti-Draft "Adj · N", Saigon-based N + V; không lỗi trang.

**2026-10-23 | v3.5.297 | Arena.ai Agent sửa:**

- Loại từ, theo báo lỗi của người dùng:
  - news.tuoitre.vn tiêu đề ngắn lúc được lúc không: đa số đoạn chỉ được nhớ khi đã đủ ≥3 đoạn chắc chắn; chưa đủ (trang còn tải) thì 1,5 giây sau đếm lại. Máy thử không tái hiện được lỗi (6 lần đều gắn đủ), đây là chỗ yếu duy nhất tìm thấy.
  - Wikipedia Alt+G nhảy trang: trang có `accesskey="g"` (Wikidata) / `"j"` (What links here); trình duyệt xử lý accesskey trước khi script nhận phím nên `preventDefault` không chặn được. Giữ Alt → tạm gỡ accesskey G/J, thả Alt → trả lại.
  - Danh từ liền kề không gộp: (1) cụm danh từ tràn qua thẻ ("Vietnam War" trong liên kết + "." ngoài) trước đây tách từng từ, nay tách theo text node; (2) số chú thích dính sau ("War.[25]") được cắt ra; (3) cho phép ngoặc kép mở đầu ("baby sitters"); (4) chữ viết tắt tên (J. D. Salinger, John F. Phillips) nối tiếp được.
- Chưa làm: cụm nằm một nửa trong liên kết ("author [Marilyn Ferguson]", "[Quaker] draft counselors", "a [Democratic Society] chapter") — cần dời phần tử của trang.
- File: `js/word-class/{core,page}.js`, `manifest.json`, `docs/modules/word-class.md`.
- Kiểm tra: Chromium nạp extension thật. news.tuoitre.vn: chưa chạy lại sau khi sửa (cần thử trên máy thật). Bản lưu Mark_Satin: cặp N liền kề chưa gộp 51 → 21 (còn lại là dấu phẩy, "Ladies'" sở hữu như v3.5.292, và 4 cụm nửa liên kết); giữ Alt → accesskey g/j gỡ, thả → trả lại. "City’s / teacher's / Nam's" vẫn "N · Part"; 4 trang thử ngôn ngữ như v3.5.296; không lỗi trang. Accesskey thật không thử được trên headless.

**2026-10-23 | v3.5.296 | Arena.ai Agent sửa:**

- Loại từ cả trang: đoạn mà trình duyệt không chắc là tiếng Anh → xét đa số đoạn trên trang trước `<html lang>`.
  - `pageMajority()`: `i18n.detectLanguage` (offline) trên tối đa 80 đoạn chính ≥40 ký tự, kể cả đoạn chưa cuộn tới; chỉ đếm kết quả `isReliable`. ≥3 đoạn chắc chắn → đa số tiếng Anh thì gắn, không thì bỏ. Chưa đủ 3 → `<html lang>` / nhận diện chữ cả trang như cũ. Tính lại mỗi lần bật cả trang.
  - Loại từ đoạn không đổi (chỉ chặn chữ khác / nhiều chữ có dấu).
- Đo B5 (độ tự tin của mô hình, CHƯA đưa vào code): 70/70 tiêu đề tiếng Anh đạt, 1/72 câu không phải tiếng Anh đạt nhầm (tiếng Pháp) với luật điểm trung bình ≥0.80, mảnh/từ ≤1.5, danh từ riêng ≤70%. Chờ người dùng quyết.
- File: `js/word-class/page.js`, `manifest.json`, `docs/modules/word-class.md`.
- Kiểm tra: Chromium nạp extension thật, 4 trang thử. `lang="vi"` + 3 đoạn tiếng Anh: Alt+G gắn tiêu đề (trước bỏ qua); `lang="en"` + 3 đoạn tiếng Việt: tiêu đề tiếng Anh bỏ qua (đa số tiếng Việt); `lang="en"` / `lang="vi"` một đoạn: như v3.5.295; Alt+J trên tiêu đề luôn gắn; không lỗi trang.

**2026-10-23 | v3.5.295 | Arena.ai Agent sửa:**

- Loại từ: đoạn tiếng Anh ngắn không còn bị bỏ qua oan (ví dụ tiêu đề "Vietnam’s digital economy gains momentum with AI adoption": `chrome.i18n.detectLanguage` trả "pt 100%" nhưng `isReliable:false`, code cũ vẫn tin vì ≥60%).
  - Cả trang (Alt+G): chỉ tin bộ nhận diện của trình duyệt khi `isReliable`; không chắc → ngôn ngữ trang (`<html lang>`, rồi nhận diện chữ cả trang). Vẫn offline.
  - Loại từ đoạn (☰ / Alt+J, người dùng tự chọn đoạn): chỉ chặn đoạn rõ ràng không phải tiếng Anh (chữ khác, nhiều chữ có dấu); chữ a–z thì luôn gắn nhãn.
- File: `js/word-class/page.js`, `manifest.json`, `docs/modules/word-class.md`.
- Kiểm tra: Chromium nạp extension thật. Trang `lang="en"`: Alt+G gắn tiêu đề (7 cột) + đoạn; trang `lang="vi"`: Alt+G bỏ cả tiêu đề tiếng Anh lẫn đoạn tiếng Việt, Alt+J trên tiêu đề → gắn 7 cột, Alt+J trên đoạn tiếng Việt → không gắn; không lỗi trang.

**2026-10-23 | v3.5.294 | Arena.ai Agent sửa:**

- Loại từ: gạch chân sát chữ hơn, khoảng gạch → nhãn đều nhau ở mọi phông / cỡ chữ (trước đây gạch là `border-bottom` theo hộp chữ của phông, tiêu đề chữ to bị gạch xa chữ và dính sát nhãn).
  - Gạch = `text-decoration` 2px, cách đường chân chữ `.22em + 2px` (ngay dưới phần chữ thò xuống); nhãn cách gạch 5px nhờ `text-box-trim` cắt `.t` tại đường chân chữ. Trình duyệt chưa có `text-box-trim` (Firefox) dùng khoảng dự phòng, nhãn không đè gạch.
- File: `js/word-class/page.js`, `manifest.json`.
- Kiểm tra: Chromium nạp extension thật, trang thử có tiêu đề 46px (Noto Sans CJK, phông gây lỗi), đoạn 20px đậm và Georgia 18px: Alt+G → gạch sát chữ, nhãn cách gạch như nhau ở cả 3; không lỗi trang.

**2026-10-23 | v3.5.293 | Arena.ai Agent sửa:**

- Bảng chú thích Loại từ, người dùng yêu cầu:
  - Rộng hơn (tối đa 440px, vừa nội dung): tiếng Việt mỗi loại một dòng; màn hẹp mới xuống dòng (thụt đầu dòng treo).
  - Rê chuột vào dòng (chạm trên cảm ứng) → khung kính mờ bên cạnh bảng: định nghĩa chi tiết + ví dụ của loại từ đó (en/vi/ko, `wc_def_*`).
  - ☰ Công cụ có ô "Chú thích" (sau Loại từ đoạn): bảng đang ẩn → hiện (chưa gắn nhãn gì thì hiện đủ các loại, hiện cả khi Cài đặt tắt tự hiện), đang hiện → ẩn; ô sáng khi bảng đang hiện. Tắt Loại từ thì bảng ẩn theo.
- File: `js/word-class/{core,page}.js`, `js/content/keepit-bar.js`, `js/core/languages.js`, `manifest.json`, `docs/modules/word-class.md`, `docs/ui-layout.md`.
- Kiểm tra: Chromium nạp extension thật (tiếng Việt): ☰ Chú thích trước khi gắn nhãn → đủ 13 loại, ô sáng / tắt đúng; Alt+G → bảng một dòng mỗi loại; rê chuột dòng Prep → khung định nghĩa cạnh bảng; không lỗi trang.
- Chưa rõ: trong máy thử headless, mô hình đã tải đôi khi mất sau khi lần chạy bị ngắt giữa chừng; mở lại bình thường vẫn còn. Cần xem trên Chrome thật.

**2026-10-23 | v3.5.292 | Arena.ai Agent sửa:**

- Loại từ, người dùng yêu cầu:
  - Cụm danh từ + tiểu từ dính sau vẫn một cột nhưng hiện lại tiểu từ như trước: "Ho Chi Minh City’s" gạch N liền cho "Ho Chi Minh City", "’s" gạch riêng, nhãn "N · Part" (v3.5.291 chỉ hiện N).
  - Rê chuột: danh từ riêng liền nhau gom một dòng — "Ho Chi Minh City: danh từ riêng · proper noun".
  - Bảng chú thích và Xem trước Cài đặt: "**N · Noun:** Danh từ / Danh từ riêng" (dấu chấm giữa như khi rê chuột, thay cho "N (Noun):").
- File: `js/word-class/{core,page}.js`, `manifest.json`, `docs/modules/word-class.md`.
- Kiểm tra: node (units / nounUnit / tip / html với nhãn mẫu); Chromium nạp extension thật: "Ho Chi Minh City’s", "teacher's", "Nam's" → "N · Part", title đúng, bảng chú thích định dạng mới (tiếng Việt), không lỗi trang.

**2026-10-23 | v3.5.291 | Arena.ai Agent sửa:**

- Loại từ, theo yêu cầu người dùng:
  - Danh từ + tiểu từ dính sau (sở hữu ’s / 's, mô hình gắn PART) hiện là một từ: "Ho Chi Minh City’s" một gạch, một nhãn N (theo nhãn + vị trí, không danh sách từ).
  - Rê chuột vào từ hiện chú thích như demo ("book: danh từ · noun"), trên trang và trong Xem trước Cài đặt.
  - Bảng chú thích kính mờ nhỏ góc phải trên ("**N (Noun):** Danh từ / Danh từ riêng"…, chỉ các nhãn đang có trên trang), hiện mỗi lần bật Loại từ; × ẩn đến lần bật sau; kéo đầu bảng để dời, nhớ vị trí; Cài đặt → Loại từ → "Hiện bảng chú thích" (mặc định bật) để tắt hẳn.
- Sửa: từ gộp nằm vắt qua thẻ (link / đậm) làm tràn ngăn xếp, đoạn đó không được gắn nhãn.
- File: `js/word-class/{core,page}.js`, `js/dashboard/{dashboard,settings-ui}.js`, `pages/dashboard.html`, `js/core/{defaults,languages}.js`, `manifest.json`, `docs/modules/word-class.md`, `docs/ui-layout.md`.
- Kiểm tra: Chromium nạp extension thật: "Ho Chi Minh City’s", "teacher's", "Nam's" mỗi cụm một nhãn N; title từ đúng định dạng (vi + en, en chỉ một lần); bảng chú thích hiện, kéo → lưu vị trí, tắt trong Cài đặt → không hiện; sáng / tối, tiếng Việt xuống dòng gọn; không lỗi trang. Khi mô hình đã nạp: mỗi đoạn ~0,1–0,2 giây.

**2026-10-23 | v3.5.290 | Arena.ai Agent sửa:**

- Thêm Loại từ (Word class / 품사) như demo pos v4: mỗi từ tiếng Anh trên trang có gạch chân màu rồi nhãn viết tắt 12px (N, V, Aux V, Adj…), danh từ liền nhau chung một gạch và một nhãn N; nhãn do mô hình `jdp8/bert-english-uncased-finetuned-pos` (q8) gán, không danh sách cứng.
  - ☰ Công cụ (chỉ web, không YouTube / Overlay): Loại từ (các đoạn tiếng Anh trên trang, gắn thêm khi cuộn; đoạn khác tiếng Anh bỏ qua) và Loại từ đoạn (chạm chọn đoạn), ngay sau Dịch đoạn. Phím Alt+G / Alt+J, có trong Phím tắt (☰ và Cài đặt).
  - Lần đầu hỏi "Tải mô hình loại từ?" (~110 MB từ huggingface.co), hiện %; sau đó chạy trên máy, không cần mạng; rảnh 3 phút thì giải phóng bộ nhớ.
  - Nhãn nằm trong shadow DOM đóng: chữ trang không đổi (không bị đọc / dịch / chọn kèm); tắt → HTML trang như cũ, có Hoàn tác.
  - Cài đặt → Loại từ (Tiện ích, sau Dịch): Bật loại từ (tắt là tắt mọi nơi), Mô hình Tải / Xóa (Hoàn tác), Xem trước bằng mô hình thật, Đặt lại.
- Chrome: quyền `offscreen` + CSP `'wasm-unsafe-eval'` (người dùng đã duyệt); Firefox: engine chạy trong background page, bản Firefox bỏ `offscreen`.
- File: `js/word-class/{core,engine,page}.js` (mới), `pages/word-class-engine.html` (mới), `vendor/transformers/` (mới: Transformers.js 3.8.1 + ONNX Runtime Web WASM), `js/background/background.js`, `js/content/{content,keepit-bar}.js`, `js/reader/bilingual-reader.js` (`mainBlocks`, bỏ `lhn-wc` khỏi `isTextBlock`), `js/core/{defaults,languages}.js`, `js/dashboard/{dashboard,settings-ui}.js`, `pages/dashboard.html`, `css/dashboard/settings.css`, `manifest.json`, `scripts/build_firefox.py`, `PRIVACY-POLICY.md`, `THIRD_PARTY_NOTICES.md`, `licenses/` (Transformers.js, jinja, ONNX Runtime + notices), `docs/modules/word-class.md`, `docs/INDEX.md`, `docs/ui-layout.md`.
- Kiểm tra: Chromium nạp extension thật + trang thử http: Cài đặt → Tải → Đã tải, xem trước có nhãn (sáng / tối); Alt+G gắn 51 từ, đoạn tiếng Việt bỏ qua, `innerText` + vùng chọn không đổi, tắt → HTML như ban đầu; Alt+J / ☰ Loại từ đoạn gắn đúng một đoạn, bấm lại gỡ; ô ☰ Loại từ sáng khi bật; công tắc tổng tắt → gỡ nhãn, ẩn 2 ô, Alt+G không tác dụng.
- Chưa làm: chưa thử trên Firefox thật và điện thoại thật; mô hình không ghi giấy phép trên Hugging Face (ghi chú trong `THIRD_PARTY_NOTICES.md`).

**2026-10-23 | v3.5.289 | Arena.ai Agent sửa:**

- Người dùng chốt: tắt Dịch / Hỏi AI / Ghi chú trong Cài đặt là tắt ở mọi nơi; Trình đọc không đọc song ngữ khi Dịch tắt. Áp dụng ngay, không cần tải lại:
  - Thanh Keepit: nút của tính năng tắt biến mất khỏi thanh và ☰ Công cụ; chỗ trống lấy công cụ đầu tiên còn lại trong ☰ (vd. web 7 nút, tắt Dịch + Hỏi AI → Trang chủ·Video·Đọc 🔍 Học·Ghi chú·☰).
  - Hỏi AI tắt: Alt+X và mọi lệnh mở AI panel (`TOGGLE_AI_PANEL`) bị chặn; chỉ báo cạnh đã mở Ghi chú từ v3.5.288.
  - Dịch tắt: không dịch trang / đoạn (Alt+A, Alt+D, nút thanh, chọn đoạn), không phím dịch Alt+W; Trình đọc chỉ đọc bản gốc, ô "đọc bản dịch" ở ☰ Trình đọc ẩn, mục đó trong Cài đặt → Trình đọc mờ + khóa; tắt lúc đang dịch thì bản dịch trên trang được gỡ.
- Sửa: Nút lên đầu trang đổi từ Cài đặt chưa áp dụng ngay (v3.5.288 thiếu `updBtop()`).
- File: `js/content/{keepit-bar,content}.js`, `js/reader/bilingual-reader.js`, `js/ask-ai/service.js`, `pages/dashboard.html`, `docs/modules/{content,reader,ask-ai,dashboard}.md`.
- Kiểm tra: Chromium nạp extension thật + trang thử http: nút thanh / ☰ Công cụ / ô Trình đọc khi tắt từng tính năng (đổi trực tiếp, 7 nút); Alt+A, Alt+D tắt → không thẻ dịch, bật → có, tắt lúc đang dịch → gỡ; `TOGGLE_AI_PANEL` tắt → bị chặn, bật → mở; nút lên đầu trang bật/tắt trực tiếp; Cài đặt khóa/mở dòng đọc bản dịch; ảnh thanh điện thoại sáng + tối. Thử lại thanh tiện ích chọn chữ, chỉ báo, chọn AI: đạt.
- Chưa làm: Alt+X chỉ kiểm cờ trong service worker (headless không bấm được lệnh trình duyệt); đọc bản dịch khi đọc thật chỉ kiểm bằng code. Các ô ☰ khác liên quan dịch / ghi chú (Ghi chú dịch, Tự dịch, Từ điển đầy đủ, Popup ghi chú, Tự tô sáng) vẫn hiện.

**2026-10-23 | v3.5.288 | Arena.ai Agent sửa:**

- Người dùng báo: các cài đặt mới của v3.5.287 chỉ đổi giao diện Cài đặt, không có tác dụng thật (thanh tiện ích vẫn đủ nút, tra từ vẫn hiện đủ mục). Nay có tác dụng ngay trên trang đang mở, không cần tải lại:
  - Ghi chú / Dịch / Hỏi AI tắt → thanh tiện ích khi chọn chữ bỏ nút đó, nút còn lại xếp như xem trước (3: trái·dưới·phải, 2: trái·phải, 1: dưới), tắt cả 3 → không icon; Ghi chú tắt → không mở popup ghi chú; Dịch tắt → không popup dịch / từ điển, không cử chỉ dịch. Logo chạy tính năng bật đầu tiên nếu tính năng đã chọn đang tắt.
  - Mục trong từ điển đầy đủ: popup tra từ chỉ hiện phần đang bật, popup đang mở đổi ngay.
  - Hỏi AI: AI tắt bị ẩn khỏi tab AI panel và không được chọn; AI mặc định mở mỗi lần (hoặc AI dùng lần trước).
  - Chỉ báo cạnh: "Bấm chỉ báo để mở" = AI panel.
  - Thanh Keepit: Ẩn thanh trên website (gồm tên miền con), Gọn thanh / Nút lên đầu trang / Ẩn thanh / cử chỉ dịch đổi từ Cài đặt áp dụng ngay; ☰ "Hiện thanh" trên website trong danh sách thì bỏ website đó khỏi danh sách. Thanh không còn xóa danh sách khi lưu trạng thái của nó.
- Xem trước Từ điển đầy đủ trong Cài đặt đổi mượt: khung đổi chiều cao, phần còn lại trượt, phần mới hiện dần, phần tắt mờ dần (sửa luôn việc lưu Cài đặt vẽ lại preview cắt ngang chuyển động).
- File: `js/shared/selection-toolbar.js`, `css/shared/selection-toolbar.css` (vị trí `data-kp-slot` chuyển từ `settings.css`), `css/dashboard/settings.css`, `js/content/{content,keepit-bar}.js`, `js/ask-ai/{providers,service,toolbar}.js`, `js/ask-ai/panel/panel.js`, `js/dashboard/{settings-ui,dashboard}.js`.
- Kiểm tra: Chromium nạp extension thật + trang thử http: thanh tiện ích 3/2/1/0 nút (dạng có chữ + chỉ icon, đổi trực tiếp), popup ghi chú / dịch bật-tắt (có đối chứng), từ điển thật (mạng) ẩn đúng phần cả popup đang mở, ẩn thanh theo website (cả sau tải lại), chỉ báo → AI panel, chọn AI ở nền + AI panel (ẩn tab, đổi AI khi tắt). Xem trước: 4 chuyển động + bóng mờ, máy tính + điện thoại × sáng / tối. Kiểm thử Cài đặt v3.5.287 chạy lại đạt. Không có pageerror.
- Chưa làm: cử chỉ dịch chỉ kiểm bằng code (headless không có chạm thật). Nút Dịch / Hỏi AI trên thanh Keepit giữ nguyên như demo.

**2026-10-23 | v3.5.287 | Arena.ai Agent sửa:**

- Mang Cài đặt v43 (demo đã duyệt) vào Bảng quản lý — phần 1/3: giao diện + lưu trữ. Hiệu ứng trên trang web (ẩn nút tính năng đang tắt, website ẩn thanh, cử chỉ, AI mặc định…) làm ở v3.5.288; sheet Cài đặt + popup Đăng nhập trong trang ở v3.5.289.
- Cửa sổ Cài đặt responsive mọi thiết bị, nhóm Tài khoản · Tiện ích · Chung · Dữ liệu, thẻ hồ sơ + nhãn gói (Miễn phí / Pro / Ultra), popup Đăng nhập mới, hộp xác nhận Xóa tài khoản, nút Đặt lại từng trang + Hoàn tác, công tắc chính Ghi chú / Dịch / Hỏi AI, ẩn từng phần Từ điển đầy đủ (có xem trước), bật/tắt từng AI + AI mặc định (có xem trước Thanh Hỏi AI), trang Thanh Keepit (Gọn thanh, Nút lên đầu trang, Ẩn thanh, Xem lại hướng dẫn, danh sách website ẩn thanh), ô phím tắt mới (phím hiện dạng nút, báo trùng / phím trình duyệt), Đặt lại quy tắc phát âm, Dạng 1 "Chỉ hiện icon".
- Khóa lưu mới (giá trị cũ giữ nguyên): `notesEnabled`, `translateEnabled`, `askAIEnabled`, `fullDictionarySections`, `askAIProviders`, `askAIDefaultProvider`, `sidebarIndicatorTarget`; `lhnBottomBar`: `five`, `btop`, `hidden`, `hiddenSites`, `coachSeen`, `gest.translate`. Mặc định đổi theo demo: `translateIconEnabled` bật, `sidebarIndicatorOnDisabledSites` tắt.
- File: mới `css/dashboard/settings.css`, `js/shared/auth-popup.js`; sửa `pages/dashboard.html`, `css/dashboard/{dashboard,responsive}.css`, `css/shared/{ui-theme,selection-toolbar}.css`, `js/dashboard/{dashboard,settings-ui,responsive-nav}.js`, `js/core/{languages,defaults,config}.js`, `js/ask-ai/toolbar.js` (tách `shadowMarkup()` cho xem trước), `js/shared/selection-toolbar.js` (Dạng 0).
- Kiểm tra: so ảnh với demo v43 trên 4 thiết bị (máy tính, tablet dọc, điện thoại dọc / ngang) × sáng / tối, 12 trang — khớp, chỉ khác chỗ xuống dòng do Bảng quản lý dùng font Inter thật (demo dùng font hệ thống). 4 trạng thái tài khoản (khách / Miễn phí / Pro / Ultra) × 2 giao diện × máy tính + điện thoại. Chạy thử: công tắc chính + Đặt lại + Hoàn tác, AI mặc định khi tắt AI, phần từ điển, thêm / xóa website (luật tên miền con), phím tắt trùng, đăng nhập / xóa tài khoản, quy tắc phát âm. Không có pageerror.
- Ghi chú: với font Inter, ô Ngôn ngữ ở cột trái máy tính hẹp hơn 8px nên tên tiếng Anh ("Vietnamese") tự ẩn; trên điện thoại vẫn hiện.
