# Nhật ký ý tưởng đã chốt với Arena — OPT-ARENA.md

File này lưu **ý tưởng và thiết kế đã chốt qua thảo luận với Arena**, bản mới nhất ở trên cùng.
- Ở đây chỉ ghi ý tưởng, quyết định, phương án đã loại (kèm lý do) và câu hỏi còn mở.
- Trạng thái triển khai, việc đang mở và nhật ký thay đổi code nằm trong `PROJECT.md`. Hành vi thực tế xác nhận bằng mã nguồn.
- Mỗi bản ghi có tiêu đề `## YYYY-MM-DD | <chủ đề>` và dòng **Trạng thái** (Đã chốt, chưa triển khai / Đang triển khai / Đã triển khai ở vX.Y.Z).

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
