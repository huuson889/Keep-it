# Keepit - Hồ sơ dự án

## 1. Trạng thái hiện tại
- Version **3.5.376**, nhánh `Keepit-Optimize-Test`; PDF handoff keeps in-page overlay and action-popup card; v3.5.376 updates local PDF permission guide in Documents with yellow warning, two steps and Chrome Extensions CTA. Static checks run; browser validation of the new guide and v3.5.375 PDF handoff remains open. Documents Reader QA remains open. Watcher launch in `OPT-ARENA.md` uses `Unblock-File` + process-scoped Bypass. Arena cleanup/ZIP rules in `AGENTS.md`.
- Sửa tích hợp: demo chỉ chốt bố cục; Reader, chọn chữ/Full Dictionary, popup/sidebar Ghi chú và AI dùng đúng module UI/controller của app, không giữ bộ riêng trong Tài liệu.
- Ghi chú v314 chuyển vào annotations chung, giữ quote/anchor/ngày, không nhân bản; hiện ở H&N/Flashcards/JSON backup. Byte tệp vẫn ngoài backup. Tham chiếu tệp là UUID cục bộ, không phải hash gửi tới AI.
- Chromium extension thật PASS native UI/CRUD/restore/migration/deep link/backup, Reader qua trang/card, touch selection/Notes/AI sheet; web + homepage regression PASS. AI login/send/voice thật và Firefox/Edge Android thật vẫn chưa xác nhận.
- Office preview có giới hạn phông/đối tượng; OCR chưa có. Các QA cũ và giới hạn khác giữ ở mục 2, kiến trúc ở mục 4 và `docs/documents.md`.

## 2. Việc đang mở / Tiếp theo (sửa đè)
### Documents PDF permission guide — v3.5.376
- Browser-test local PDF with file URL access denied: confirm yellow guide, translated two-row instructions, and **Làm ngay** opens Chrome Extensions for Keepit. Static checks only; not browser-tested.

### Browser PDF handoff — v3.5.375
- Retest sau khi nạp v3.5.375 trên Chrome thật: overlay trên PDF nằm dưới viewer toolbar 20px; X/icon thu gọn/mở lại; không cửa sổ/tab riêng; action popup card + toolbar badge; cả hai CTA mở đúng PDF; local file permission/fallback; chuyển tab/navigation gỡ overlay. Chrome 157/v3.5.374 đã xác nhận overlay; bản v3.5.375 chưa được test.


### Documents Reader — v3.5.368
- v3.5.365/3.5.368 Documents sheet: bỏ điều khiển Ẩn/Hiện thanh; Dịch/Đọc to nằm ở footer cố định cạnh Cài đặt và gọi chung handler với viewer topbar. Static checks đạt; Chrome thật chưa test.
- Browser test Chrome thật trên v3.5.363 tái hiện: hidden Reader state gọi lại mỗi ~0.9s nên pager timeout bị clear/re-arm liên tục; fitToolbar tháo/gắn lại `flowGroup`/`zoomWrap`, làm select mất focus. Đã sửa: chỉ xử lý chuyển trạng thái Reader và hoãn fit khi `vFlow`/`vZoom` focus; cần reload v3.5.365 cùng test profile để xác minh fix.
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
- Documents main sheet đặt Dịch/Đọc to ở footer cố định cạnh Cài đặt qua `LHN_DOCUMENTS_MAIN_ACTIONS`; callbacks chia sẻ handler với viewer topbar. Điều khiển Ẩn/Hiện thanh không hiện riêng ở sheet này.
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
Browser PDF tab (`file:`/HTTP(S) `.pdf`, kể cả URL nguồn bọc trong viewer) ──> Background đặt badge `PDF` + inject iframe overlay (20px dưới viewer bar) và action popup card ──> X thu icon/mở lại; cả hai CTA gửi `OPEN_DASHBOARD_DOCUMENTS` với source URL ──> Dashboard Documents fetch/import/mở PDF; local file cần Allow access to file URLs và picker fallback; không redirect tab
Documents main sheet ── `doc:translate` / `doc:read` ──> `LHN_DOCUMENTS_MAIN_ACTIONS` ──> same `setPanel('translation')` / `startNativeReader()` used by viewer topbar
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
