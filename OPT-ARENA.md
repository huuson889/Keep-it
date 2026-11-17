# Nhật ký ý tưởng đã chốt với Arena — OPT-ARENA.md

File này lưu **ý tưởng và thiết kế đã chốt qua thảo luận với Arena**, bản mới nhất ở trên cùng.
- Ở đây chỉ ghi ý tưởng, quyết định, phương án đã loại (kèm lý do) và câu hỏi còn mở.
- Trạng thái triển khai, việc đang mở và nhật ký thay đổi code nằm trong `PROJECT.md`. Hành vi thực tế xác nhận bằng mã nguồn.
- Mỗi bản ghi có tiêu đề `## YYYY-MM-DD | <chủ đề>`; bản ghi là ý tưởng thì ghi `## YYYY-MM-DD | Ý TƯỞNG - <chủ đề>`, và dòng **Trạng thái** (Đã chốt, chưa triển khai / Đang triển khai / Đã triển khai ở vX.Y.Z).

---


## 2026-11-17 | Điều khiển watcher và giải nén ZIP vào Optimize Test

**Trạng thái:** Đã ghi quy trình; bản `.ps1` sửa floor version cần được chạy thử trên Windows.

### 1. Dừng watcher đang chạy ẩn
Mở PowerShell, tìm đúng tiến trình và xem lệnh trước khi dừng:
```powershell
$watchers = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -match '^(powershell|pwsh)\.exe$' -and
    $_.CommandLine -match 'sync-watch-optimize-test\.ps1'
  }
$watchers | Select-Object ProcessId, Name, CommandLine | Format-List
```
Sau khi kiểm tra đúng watcher, xác nhận rồi mới dừng:
```powershell
if ($watchers) {
  $answer = Read-Host "Dừng các tiến trình watcher vừa liệt kê? Nhập Y để xác nhận"
  if ($answer -eq 'Y') {
    $watchers | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    'Đã gửi lệnh dừng.'
  }
} else {
  'Không tìm thấy tiến trình PowerShell có tên script đó.'
}
```
Không dùng `taskkill /IM powershell.exe`. Nếu không tìm thấy tiến trình hoặc nó tự chạy lại, kiểm tra Task Scheduler/trình chạy trung gian.

### 2. Cập nhật và chạy watcher ẩn (mặc định)
Đặt file mới `sync-watch-optimize-test.ps1` vào `D:\Keepit\Keepit - Optimize Test`. Dừng watcher cũ trước khi thay/chạy bản mới. Trong PowerShell chạy:
```powershell
$scriptPath = 'D:\Keepit\Keepit - Optimize Test\sync-watch-optimize-test.ps1'
Unblock-File -LiteralPath $scriptPath
Start-Process -FilePath powershell.exe -WindowStyle Hidden -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-File', "`"$scriptPath`""
)
```
`Unblock-File` bỏ dấu tải Internet của đúng file; `-ExecutionPolicy Bypass` chỉ áp dụng cho tiến trình PowerShell watcher mới. Kiểm tra watcher bằng lệnh tìm PID ở mục 1. Nếu vẫn bị chặn, chạy `Get-ExecutionPolicy -List`; `MachinePolicy`/`UserPolicy` do Group Policy đặt có thể chặn cả Bypass. Chỉ mở PowerShell hiện cửa sổ để gỡ lỗi; nếu làm vậy, Ctrl+C dừng watcher.

### 3. Đưa ZIP vào Optimize Test
Thả ZIP vào `D:\Keepit\Keepit - Optimize Test` — **không tự giải nén**. Tên phải chính xác `Keepit - Optimize Test-v<version>.zip` (không có `(1)`); ZIP phải có `manifest.json` ở gốc. Watcher tự thay nội dung `Keepit - Test`, giữ `.git`, rồi commit/push nền. Version ZIP phải bằng hoặc cao hơn manifest repo. Xem kết quả tại `D:\Keepit\Keepit - Optimize Test\sync-watch.log`.

**Lý do ZIP v3.5.364 từng bị bỏ qua:** script cũ lấy floor v3.5.368 từ 400 commit gần nhất. Bản `.ps1` mới lấy floor từ manifest hiện tại; chưa được xác minh trên Windows.

---

## 2026-11-17 | Điều khiển Chrome thật của người dùng qua CDP

**Trạng thái:** Đã điều khiển Chrome test qua Cloudflare Tunnel; URL phiên không lưu trong repo.

### Cài đặt và chạy trên Windows
1. Cài `cloudflared` (bỏ qua nếu đã cài):
   ```powershell
   winget install --id Cloudflare.cloudflared -e
   ```
2. Đóng Chrome test cũ. Mở PowerShell, chạy Chrome bằng profile test riêng (profile này cần cài/nạp Keepit ở `chrome://extensions` → Developer mode → Load unpacked):
   ```powershell
   $chrome = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
   if (-not (Test-Path $chrome)) { $chrome = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe" }
   Start-Process $chrome -ArgumentList @('--remote-debugging-port=9222', '--user-data-dir=D:\Keepit\Chrome-CDP-Test')
   ```
3. Trong PowerShell thứ hai, mở tunnel tới cổng CDP:
   ```powershell
   cloudflared tunnel --url http://localhost:9222
   ```
   Sao chép URL `https://….trycloudflare.com` do lệnh in ra và gửi riêng trong chat. Đừng ghi URL/token vào repo. **Tunnel này trao quyền điều khiển toàn bộ Chrome cho người có URL:** chỉ dùng profile test, không mở nội dung nhạy cảm, và dừng bằng Ctrl+C ngay sau kiểm thử.
4. Agent lấy CDP WebSocket từ `https://<URL>/json/version`, kết nối Playwright `connectOverCDP`, rồi thao tác/reload tab. Ví dụ phía Agent:
   ```js
   const info = await (await fetch(`${CDP_URL}/json/version`)).json();
   const ws = new URL(info.webSocketDebuggerUrl);
   ws.protocol = 'wss:';
   ws.host = new URL(CDP_URL).host;
   const browser = await chromium.connectOverCDP(ws.href);
   const pages = browser.contexts().flatMap(c => c.pages());
   await pages[0].reload();
   ```
5. Dừng tunnel bằng Ctrl+C và đóng Chrome test sau khi xong. Không gửi API token/credential qua chat.

## 2026-11-17 | Ý TƯỞNG - Nâng cấp trình đọc Tài liệu (Độ chính xác render, Select & Reader như Web, Mục lục, Tìm kiếm, Đọc đêm, Audiobook)

**Trạng thái:** Đã chốt ý tưởng, chưa triển khai, chưa có spec chi tiết.

### 1. Bối cảnh & Mục tiêu
- Tab **Tài liệu** (`pages/documents.html`, `js/dashboard/documents.js`, `documents-renderers.js`, `documents-store.js`) hiện đã hỗ trợ đọc PDF, Word (DOCX), PowerPoint (PPTX), ảnh (JPG/PNG/WebP), có highlight, ghi chú, đọc text, từ điển, panel dịch và Ask AI.
- Mục tiêu:
  1. Giải quyết triệt để 5 vấn đề cốt lõi về **độ chính xác khi đọc và phân tích file** (lỗi phông CMap, phân mảnh câu textDiv, ngắt từ gạch nối cuối dòng, tài liệu 2 cột, đo font Word).
  2. Nâng cấp trải nghiệm **Bôi đen chữ (Select Text)** và **Trình đọc (Reader / Dịch / TTS)** mượt mà, tự nhiên giống hệt một trang web.
  3. Bổ sung trọn vẹn 9 tính năng mở rộng giao diện và học tập chuyên sâu (Mục lục TOC, Tìm kiếm Ctrl+F, Đọc đêm/Sepia, 2 trang song song, Inline song ngữ, Audiobook tự động lật trang, Xuất ghi chú & deck Flashcard, Bookmark & cuộn chính xác, Focus mode).

---

### 2. Kỹ thuật nâng cao độ chính xác khi đọc và phân tích file (5 điểm cốt lõi)

#### 1. Bổ sung CMap & Standard Fonts trong PDF.js (Khắc phục lỗi phông tiếng Việt/CJK)
- **Hiện trạng:** Trong `documents-renderers.js`, `lib.getDocument({ data })` chỉ nạp mảng byte thô mà chưa truyền đường dẫn CMap và Standard Fonts (dù repo đã có sẵn ở `vendor/pdfjs/cmaps/` và `vendor/pdfjs/standard_fonts/`).
- **Hậu quả:** File PDF tiếng Việt có dấu lạ, tài liệu tiếng Hàn/Nhật hoặc dùng font nhúng không chuẩn bị lỗi hiển thị: biến thành ô vuông (tofu), mất dấu hoặc trích xuất text sai mã ký tự.
- **Giải pháp:** Cấu hình đầy đủ khi khởi tạo document:
  ```js
  const document = await lib.getDocument({
    data: await blob.arrayBuffer(),
    cMapUrl: new URL('pdfjs/cmaps/', base).href,
    cMapPacked: true,
    standardFontDataUrl: new URL('pdfjs/standard_fonts/', base).href
  }).promise;
  ```

#### 2. Gom cụm đoạn văn PDF (Paragraph Reconstruction từ TextDivs)
- **Hiện trạng:** PDF.js phân tách chữ theo từng mảnh đồ họa (*text run*). Code hiện tại gán mỗi `textDiv` thành một `.para` riêng, làm câu văn dài bị xé nhỏ thành 4–5 mảnh cụt lủn.
- **Hậu quả:** Khi dịch hoặc nghe TTS, câu văn bị ngắt rời rạc, làm Google Dịch dịch sai ngữ pháp và TTS đọc ngắt quãng giật cục.
- **Giải pháp:** Áp dụng thuật toán gom cụm trước khi gán `.para`: gom các `textDiv` có cùng tọa độ Y (cùng dòng) hoặc khoảng cách dòng liên tục (dòng tiếp theo) thành một khối văn bản logic hoàn chỉnh (*Logical Paragraph*).

#### 3. Tự động nối từ bị ngắt gạch nối cuối dòng (De-hyphenation)
- **Hiện trạng:** Sách tiếng Anh hay ngắt từ dài ở cuối dòng bằng dấu gạch nối (ví dụ: dòng 1 là `infor-`, dòng 2 là `mation`). Keepit trích xuất nguyên văn làm từ điển tra thành hai từ vô nghĩa.
- **Giải pháp:** Trong quá trình ghép dòng (`attachBlocks` và `TextLayer`), kiểm tra nếu từ cuối dòng kết thúc bằng `-` và tiếp theo là ký tự chữ cái ở đầu dòng dưới $\rightarrow$ tự động nối lại thành `information` trong chuỗi text dùng cho Dịch/Từ điển, nhưng vẫn giữ nguyên hiển thị hình ảnh trên trang sách.

#### 4. Sắp xếp thứ tự đọc tài liệu 2 cột (Multi-column Reading Order)
- **Hiện trạng:** Giáo trình và bài báo học thuật thường chia 2 cột. Duyệt tuần tự DOM mà không kiểm tra tọa độ cột (X-coordinate) sẽ làm câu văn bị đọc vắt ngang từ cột trái sang cột phải.
- **Giải pháp:** Phân nhóm các khối văn bản theo tọa độ X (`left < width / 2` cho Cột trái, `left >= width / 2` cho Cột phải). Duyệt hết toàn bộ khối của Cột trái từ trên xuống dưới rồi mới chuyển sang Cột phải.

#### 5. Đo đạc kích thước Word (DOCX) sau khi nạp xong Font
- **Hiện trạng:** File Word render ẩn trong `holder` ở `left: -100000px` rồi đo ngay `getBoundingClientRect()` và `scrollHeight` trước khi font chữ kịp nạp xong.
- **Hậu quả:** Trình duyệt dùng font fallback để tính chiều cao, đến khi hiển thị thật chữ bị dồn trang, làm tràn hoặc phân trang sai lệch so với bản Word gốc.
- **Giải pháp:** Chèn `await document.fonts.ready;` trước khi tính toán kích thước trang; cố định kích thước khổ A4 chuẩn (`794px × 1123px` ở 96 DPI) giúp bố cục ổn định và chuẩn xác như Microsoft Word.

---

### 3. Nâng cấp trải nghiệm "Bôi đen chữ (Select Text) & Tra từ điển" chuẩn Web

#### 1. Khớp tọa độ 1:1 giữa TextLayer và Canvas
- Khóa chặt tỷ lệ `--scale-factor` trong `pdfTextLayer` bằng đúng kích thước viewport render:
  ```css
  .pdfTextLayer {
    transform-origin: 0 0;
    line-height: 1;
    user-select: text;
  }
  ```
- Thiết lập `color: transparent;` và `::selection { background: rgba(99, 102, 241, 0.3); }` để vệt màu bôi đen của chuột ôm khít từng con chữ in trên canvas, loại bỏ hoàn toàn hiện tượng lệch dòng hay kéo chuột sượng.

#### 2. Tích hợp Popup / Full Dictionary chuẩn của Keepit
- Thay thế thanh `#sel` sơ sài bằng popup tra từ điển đầy đủ của Keepit trên web:
  - Phát âm âm thanh (Audio US/UK) + Phiên âm quốc tế **IPA**.
  - Phân loại từ (*noun, verb, adj*).
  - Cụm từ hay đi kèm (*Collocations*), Từ đồng nghĩa/Trái nghĩa (*Synonyms/Antonyms*).
  - Nút **Trái tim ❤️ (Lưu vào Flashcard)** kèm chính xác câu ngữ cảnh trong trang sách.
- Hỗ trợ **nhấp đúp chuột (Double-click)** vào 1 từ là tự động mở popup tra từ điển ngay lập tức.

---

### 4. Nâng cấp trải nghiệm "Trình đọc (Reader / Dịch / TTS)" chuẩn Web

#### 1. Chế độ "Đọc" (Reflow Mode — Biến file thành bài báo HTML thuần túy)
- Khi người dùng chuyển sang chế độ **"Đọc"** (`V.mode === 'read'`):
  - Chữ được trích xuất hoàn toàn ra khỏi canvas và đưa vào `<article class="reflow">`.
  - Hỗ trợ tùy chỉnh cỡ chữ, phông chữ (Sans-serif/Serif) và căn lề như Reader View của Safari/Firefox.
  - Tích hợp trọn vẹn sức mạnh của `bilingual-reader.js`:
    - Dịch song ngữ hiện song song từng đoạn (`<p class="para"><span class="en">...</span><span class="vi">...</span></p>`).
    - Phím tắt quen thuộc: `Alt+A` (dịch tự động khi cuộn), `Alt+D` (dịch đoạn đang trỏ chuột), `Alt+R` (bật đọc to TTS).

#### 2. Trải nghiệm Song ngữ trực tiếp trên trang gốc (Overlay / Inline Callout)
- Với người muốn giữ nguyên bản gốc PDF (có hình ảnh, công thức, bảng biểu):
  - Khi click vào một đoạn văn bất kỳ: Bản dịch tiếng Việt bung ra dạng **hộp chú giải thông minh (smart callout)** đè nhẹ ngay bên dưới đoạn văn đó, tự ẩn khi click ra ngoài, giúp người đọc tập trung hoàn toàn vào trang sách mà không phải liếc mắt sang panel phụ ở sidebar.

---

### 5. Chi tiết kỹ thuật 9 tính năng mở rộng giao diện & học tập chuyên sâu

#### 1. Cây mục lục tài liệu (PDF Outline / Table of Contents / Heading Navigation)
- **Can thiệp file:** `js/dashboard/documents-renderers.js`, `js/dashboard/documents.js`, `pages/documents.html`, `css/dashboard/documents.css`.
- **Trích xuất dữ liệu mục lục:**
  - *PDF:* Trong hàm `pdf(blob, hooks)`, sau khi nạp `document`, gọi hàm có sẵn của PDF.js:
    ```js
    const outlineData = await document.getOutline(); // Trả về cây [{ title, dest, items: [...] }]
    ```
    Để ánh xạ `dest` thành số trang thực: dùng `await document.getPageIndex(destRef)` (trả về 0-based index $\rightarrow$ cộng 1 ra số trang).
  - *DOCX:* Trong hàm `office()` nhánh `docx`, quét các thẻ `h1, h2, h3` trong `section.keepitDocx` đã gán `data-page` để lấy danh sách tiêu đề + số trang.
  - *PPTX:* Lấy mảng tiêu đề slide từ `speakerNotes()` hoặc text đầu tiên của từng slide.
  - Trả về trường `outline: [...]` trong đối tượng trả về của `KeepitDocumentRenderers.prepare()`.
- **Giao diện & Tương tác:**
  - Tại thanh rail bên trái (`#rail`), thêm 2 tab chuyển đổi: `[Trang thu nhỏ (Thumbs) | Mục lục (TOC)]`.
  - Tab Mục lục dựng danh sách HTML dạng cây phân cấp (`<ul class="docOutlineTree">`), hỗ trợ thụt đầu dòng theo cấp độ (`item.items`).
  - Gắn sự kiện click vào mục: gọi `setPage(item.pageNumber)` để cuộn ngay đến trang mong muốn.

#### 2. Tìm kiếm nội dung trong file (In-Document Search / Ctrl+F nội bộ)
- **Can thiệp file:** `js/dashboard/documents.js`, `css/dashboard/documents.css`, `pages/documents.html`.
- **Dữ liệu nguồn:** Tận dụng mảng `activeEngine.pages[pageIndex].texts` đã được nạp sẵn khi mở tài liệu (chứa toàn bộ chuỗi văn bản sạch của từng block/đoạn).
- **Luồng phím tắt & Giao diện:**
  - Bắt sự kiện bàn phím: `(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f'`.
  - Hiển thị thanh tìm kiếm `#docSearchBar` nổi ở góc trên bên phải của `#stage`: gồm ô `input#docSearchQuery`, nút `Prev (▲)`, `Next (▼)`, nhãn đếm `index / total` và nút đóng `✕ (Esc)`.
- **Thuật toán tìm kiếm & Tô sáng:**
  - Khi gõ từ khóa: Quét chuỗi regex không phân biệt hoa thường (`RegExp(query, 'gi')`) trên toàn bộ các trang trong `activeEngine.pages`.
  - Tạo mảng kết quả: `matches = [{ page: 1, textIndex: 2, start: 10, end: 18 }, ...]`.
  - Nhảy kết quả: Khi bấm Next/Prev $\rightarrow$ gọi `setPage(currentMatch.page)`.
  - Khi trang render (`ensurePage` / `render`): trong `textLayer` của PDF hoặc DOM của Office, duyệt node `.para[data-i="..."] .en`, thay thế chuỗi khớp bằng thẻ `<mark class="docSearchHit">` và gán class `docSearchActive` cho kết quả đang chọn.
  - Tự động cuộn đến từ khóa: `activeMark.scrollIntoView({ block: 'center', behavior: 'smooth' })`.

#### 3. Bộ lọc màu đọc ban đêm (Dark Mode & Giấy vàng Sepia cho trang sách)
- **Can thiệp file:** `css/dashboard/documents.css`, `js/dashboard/documents.js`.
- **Vấn đề kỹ thuật:** Canvas vẽ của PDF và HTML của Word/PPTX có nền trắng cứng `#ffffff`, nếu chỉ bật Dark Theme cho app thì trang sách vẫn trắng toát, gây chói mắt ban đêm.
- **Cơ chế lưu trữ:** Lưu tùy chọn vào `lhnDocumentsPrefs`: `pageTheme: 'default' | 'sepia' | 'dark'`.
- **Thiết lập giao diện & CSS Filters:**
  - Gán thuộc tính `data-doc-theme` trực tiếp vào `.docSurface` hoặc container `#stage`.
  - **Sepia (Giấy vàng ấm dịu mắt như máy đọc sách Kindle):**
    ```css
    .docSurface[data-doc-theme="sepia"] canvas,
    .docSurface[data-doc-theme="sepia"] .docsSource {
      filter: sepia(38%) brightness(94%) contrast(92%);
      background: #fbf0d9 !important;
    }
    ```
  - **Dark Mode (Đảo màu thông minh ban đêm):**
    ```css
    .docSurface[data-doc-theme="dark"] canvas,
    .docSurface[data-doc-theme="dark"] .docsSource {
      filter: invert(90%) hue-rotate(180deg) contrast(90%);
      background: #18191a !important;
    }
    /* Đảo ngược lại 100% cho hình ảnh/sơ đồ trong tài liệu để giữ nguyên màu gốc */
    .docSurface[data-doc-theme="dark"] img,
    .docSurface[data-doc-theme="dark"] image,
    .docSurface[data-doc-theme="dark"] svg {
      filter: invert(100%) hue-rotate(180deg);
    }
    ```

#### 4. Chế độ đọc 2 trang song song (Two-Page Spread / Book View)
- **Can thiệp file:** `js/dashboard/documents.js`, `css/dashboard/documents.css`.
- **Mở rộng trạng thái luồng (`V.flow`):**
  - Hiện tại `V.flow` chỉ có `'continuous'` (cuộn dọc) và `'single'` (1 trang). Bổ sung giá trị `'spread'`.
- **Toán học phân bổ trang & Render:**
  - Trang 1 là trang bìa độc lập (căn giữa hoặc lệch phải).
  - Từ trang 2 trở đi ghép theo cặp `[Trang chẵn (Trái) | Trang lẻ (Phải)]`: Cặp 1 là `(2, 3)`, Cặp 2 là `(4, 5)`...
  - Khi `V.flow === 'spread'`, hàm `renderViewer()` tạo các container cặp trang `.spreadRow`:
    ```html
    <div class="spreadRow">
      <div class="pageFrame pageLeft" data-page="2">...</div>
      <div class="pageFrame pageRight" data-page="3">...</div>
    </div>
    ```
  - CSS Flexbox:
    ```css
    .pageStack.flowSpread .spreadRow {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    ```
  - Pager & Phím mũi tên: Bước nhảy 2 trang mỗi lần (`setPage(V.page - 2)` hoặc `setPage(V.page + 2)`). Tự động vô hiệu hóa chế độ này khi màn hình hẹp/dọc (`matchMedia('(orientation: portrait)').matches`).

#### 5. Đọc song ngữ đoạn văn trực tiếp (Inline Bilingual Paragraph)
- **Can thiệp file:** `js/dashboard/documents.js`, `js/dashboard/documents-renderers.js`, `css/dashboard/documents.css`, `js/dashboard/documents-store.js`.
- **Cấu trúc DOM hiện có:** Mỗi khối văn bản trong cả PDF và Office đều đã được bọc: `<div class="para" data-page="1" data-i="0"><span class="en">...</span></div>`.
- **Cơ chế kích hoạt & Lưu cache:**
  - Bắt phím tắt `Alt+D` hoặc click đúp vào khối `.para`.
  - Kiểm tra trong IndexedDB store `translations` (`KeepitDocumentsStore` đã có sẵn):
    ```js
    const cached = await Store.get('translations', `${V.doc.id}:${page}:${i}`);
    ```
  - Nếu chưa có: Gửi tin nhắn `BILINGUAL_TRANSLATE` tới background để dịch.
  - Khi có kết quả: Lưu vào store `translations` `{ id: `${docId}:${page}:${i}`, docId, page, i, original, translation }`.
- **Hiển thị trực tiếp trong trang:**
  - Chèn phần tử bản dịch ngay dưới `.en`:
    ```html
    <div class="para activeTrans">
      <span class="en">Original English paragraph...</span>
      <div class="docInlineTrans">Bản dịch tiếng Việt hiển thị mượt mà ở đây...</div>
    </div>
    ```
  - CSS hiển thị:
    ```css
    .docInlineTrans {
      display: block;
      margin-top: 6px;
      padding: 6px 10px;
      font-size: 0.9em;
      line-height: 1.4;
      color: var(--kp-primary, #6366f1);
      background: rgba(99, 102, 241, 0.08);
      border-left: 3px solid var(--kp-primary, #6366f1);
      border-radius: 0 4px 4px 0;
      user-select: text;
    }
    ```

---

### 3. Chi tiết kỹ thuật 4 tính năng học tập chuyên sâu

#### 6. Chế độ Audiobook tự động lật trang (Continuous Document TTS)
- **Can thiệp file:** `js/dashboard/documents.js`.
- **Luồng xử lý tuần tự (Audiobook Pipeline):**
  - Người dùng bấm nút **[Play Book / Đọc tiếp]** trên thanh công cụ.
  - Quản lý trạng thái: `audiobook = { running: true, page: V.page, paraIndex: 0 }`.
  - Lấy chuỗi văn bản của đoạn hiện tại: `const text = activeEngine.pages[page - 1].texts[paraIndex];`.
  - Tô sáng đoạn đang đọc bằng class `.para.ttsReading`.
  - Gọi `LHN_TTS` (qua pipeline Google TTS / SpeechSynthesis có sẵn).
  - **Sự kiện chuyển tiếp:** Khi đoạn hiện tại kết thúc (`onend` callback):
    - Nếu còn đoạn trong trang: Tăng `paraIndex++` và đọc đoạn tiếp theo.
    - Nếu là đoạn cuối cùng của trang: Tự động gọi `setPage(V.page + 1)`, đợi sự kiện render trang mới hoàn tất $\rightarrow$ đặt `paraIndex = 0` và tiếp tục phát âm đoạn đầu của trang mới.
    - Cho phép phím `Space` để Tạm dừng/Tiếp tục (Pause/Resume).

#### 7. Xuất toàn bộ Ghi chú của cuốn sách (Export Book Summary & Flashcard Deck)
- **Can thiệp file:** `js/dashboard/documents.js`, `js/dashboard/documents-store.js`.
- **Dữ liệu nguồn:** Đọc toàn bộ ghi chú của tài liệu từ `KeepitDocumentsStore`:
  ```js
  const notes = await Store.all('notes'); // Lọc theo note.docId === V.doc.id
  notes.sort((a, b) => a.page - b.page || a.i - b.i);
  ```
- **Xuất file Markdown (`.md`):**
  - Định dạng nội dung:
    ```markdown
    # Tóm tắt ghi chú: [Tên tài liệu]
    Ngày tạo: [Ngày] | Tổng số ghi chú: [N]

    ## Trang [X]
    > [Câu trích dẫn gốc đã highlight]
    - Ghi chú: [Nội dung ghi chú cá nhân của người học]
    ```
  - Tạo tải về qua Blob URL:
    ```js
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    // Tự động kích hoạt tải về file [Ten_tai_lieu]_notes.md
    ```
- **Tạo bộ thẻ Flashcard riêng:**
  - Lấy các highlight/từ vựng trong sách, tạo bản ghi Flashcard mới vào `browser.storage.local` với tag gắn liền với ID sách: `deck: "Tài liệu: " + V.doc.title`.

#### 8. Đánh dấu trang & Nhớ vị trí cuộn chi tiết (Bookmarks 🔖 & Precise Scroll)
- **Can thiệp file:** `js/dashboard/documents.js`, `js/dashboard/documents-store.js`.
- **Nâng cấp Store Schema (`meta`):** Bổ sung 2 trường dữ liệu:
  - `scrollPercent`: Số thực từ `0.0` đến `1.0` lưu vị trí cuộn tương đối trong trang.
  - `bookmarks`: Mảng danh sách các số trang đã được đánh dấu `[3, 15, 42]`.
- **Lưu và phục hồi vị trí cuộn chính xác:**
  - Khi cuộn `#stage`, ngoài việc tính trang hiện tại, tính thêm:
    ```js
    const currentFrame = $(`#pageStack>.pageFrame[data-page="${V.page}"]`);
    const rect = currentFrame.getBoundingClientRect();
    const stageRect = $('#stage').getBoundingClientRect();
    const scrollPercent = Math.max(0, Math.min(1, (stageRect.top - rect.top) / rect.height));
    ```
  - Khi mở lại tài liệu: Cuộn đến số trang `V.doc.at` và bù thêm khoảng `scrollPercent * frameHeight` $\rightarrow$ dừng đúng dòng đang đọc dở.
- **Nút Bookmark 🔖:** Thêm icon Bookmark trên pager; bấm vào sẽ bật/tắt số trang vào `bookmarks` và cập nhật danh sách trang yêu thích ở tab Bookmark trên thanh rail bên trái.

#### 9. Chế độ đọc tập trung không phân tâm (Distraction-Free Focus Mode)
- **Can thiệp file:** `js/dashboard/documents.js`, `css/dashboard/documents.css`.
- **Cơ chế kích hoạt:** Bấm phím tắt `F` hoặc nút phóng to trên topbar viewer.
- **Xử lý DOM & CSS:**
  - Thêm class `.docFocusMode` vào phần tử gốc `#viewer`.
  - CSS ẩn toàn bộ các thanh điều khiển gây xao nhãng:
    ```css
    #viewer.docFocusMode .vtop,
    #viewer.docFocusMode #rail,
    #viewer.docFocusMode .vside,
    #viewer.docFocusMode .vMoreWrap {
      display: none !important;
    }
    #viewer.docFocusMode .stageWrap {
      padding: 0 !important;
      background: var(--bg-focus, #111) !important;
    }
    ```
  - **Tự động ẩn chuột & Pager khi không di chuyển (Idle Auto-hide):**
    - Đặt bộ đếm thời gian idle 1.5 giây sau sự kiện `pointermove`.
    - Khi hết 1.5 giây không chạm chuột: Thêm class `.idleHide` để ẩn con trỏ chuột (`cursor: none;`) và làm mờ hoàn toàn thanh phân trang pager, đem lại không gian đọc thuần khiết. Bấm `Esc` hoặc `F` để thoát chế độ.

---

## 2026-11-17 | Ý TƯỞNG - Bốn tính năng học mở rộng (Audio Playlist, AI Quiz, New Tab, Word Graph)

**Trạng thái:** Đã chốt ý tưởng, chưa triển khai, chưa có spec chi tiết.

1. **Tạo file Audio ôn tập từ các câu Highlight (Personal Audio Playlist):**
   - Chọn các câu/đoạn văn tâm đắc đã lưu $\rightarrow$ Keepit dùng TTS tạo chuỗi phát thanh: *Đọc câu tiếng Anh $\rightarrow$ đọc bản dịch tiếng Việt $\rightarrow$ đọc lại tiếng Anh*.
   - Mục đích: Nghe thụ động rảnh tay (passive listening) khi đi xe bus, chạy bộ, nấu ăn hoặc trước khi ngủ.

2. **Bài tập trắc nghiệm từ chính bài vừa đọc (AI Contextual Quiz):**
   - Khi đọc xong một bài báo hoặc tài liệu, bấm nút "Luyện tập nhanh".
   - Tận dụng Ask AI (ChatGPT/Gemini/Claude) tạo 3–5 câu trắc nghiệm hoặc bài tập điền từ dựa trên chính ngữ cảnh bài viết và các từ người dùng vừa bôi đen.

3. **Thẻ từ vựng trên Trang Tab mới (Minimalist New Tab):**
   - Tùy chọn giao diện nhẹ nhàng khi mở New Tab: hiển thị 1 từ/câu ngẫu nhiên trong danh sách cần ôn của Flashcard kèm câu ngữ cảnh cũ, nút nghe phát âm và nút "Đã thuộc".
   - Mỗi lần mở tab làm việc là một lần chạm mắt tự nhiên với từ vựng mà không tốn công mở app.

4. **Bản đồ liên kết từ vựng (Personal Vocabulary Graph):**
   - Tự động nhóm các từ vựng đã lưu trong Dashboard theo Gia đình từ (Word Family) hoặc chủ đề (ví dụ: `sustain`, `sustainable`, `sustainability`).
   - Giúp người học ghi nhớ từ vựng học thuật theo mạng lưới logic thay vì học các từ đơn lẻ rời rạc.

---

## 2026-11-17 | Ý TƯỞNG - Đồng bộ dữ liệu qua Google Drive cá nhân (Zero-backend)

**Trạng thái:** Đã chốt ý tưởng, chưa triển khai, chưa có spec chi tiết.

### 1. Mục tiêu & Bản chất giải pháp
- **Mô hình Zero-backend (Bring Your Own Storage):** Thay vì Keepit vận hành máy chủ lưu trữ (tốn chi phí server, rủi ro bảo mật dữ liệu), tiện ích kết nối trực tiếp với tài khoản Google Drive cá nhân của người dùng để làm ổ cứng đám mây đồng bộ giữa các máy tính và thiết bị (Chrome, Edge, Firefox, APK Android).
- **Bảo mật & Riêng tư:** Nhà phát triển không giữ dữ liệu; dữ liệu đi thẳng từ trình duyệt lên Drive của người dùng.

### 2. Vị trí lưu trữ & Cấu trúc thư mục (`appDataFolder`)
- **Lưu trong thư mục ẩn của ứng dụng:** Sử dụng Google Drive `appDataFolder`. Thư mục này hoàn toàn ẩn với giao diện `drive.google.com` của người dùng (tránh bấm nhầm, xoá nhầm hoặc làm bừa bộn Drive cá nhân). Ứng dụng bên thứ ba khác cũng không thể can thiệp vào thư mục này của Keepit.
- **Cấu trúc dữ liệu trên Drive:**
  ```text
  [Keepit AppDataFolder]/
  ├── sync-meta.json             # Device ID, last_sync_at (UTC), schema_version, app_version
  ├── data/
  │   ├── annotations.json       # Highlights, Ghi chú, màu sắc, quote anchors, URL trang web
  │   ├── flashcards.json        # Thẻ từ vựng, tiến độ học, lịch sử ôn tập SRS
  │   └── settings.json          # Cài đặt giao diện, phím tắt, giọng đọc TTS
  └── documents/                 # Dành cho tab Tài liệu (PDF, Office, Ảnh)
      ├── <hash_file_1>.pdf      # Lưu theo mã băm nội dung (content_hash)
      ├── <hash_file_2>.docx
      └── documents-meta.json    # Tên gốc, số trang, tiến độ đọc dở, ghi chú riêng trong file
  ```

### 3. Cơ chế xác thực tài khoản (OAuth 2.0)
- **Đăng ký Google Cloud Console (Miễn phí 100%):**
  - Tạo một Project miễn phí trên `console.cloud.google.com`.
  - Bật thư viện **Google Drive API**.
  - Màn hình đồng ý (OAuth consent screen): Loại External, tên app `Keepit`, khai báo scope `https://www.googleapis.com/auth/drive.appdata`.
- **Phân loại quyền (Scope):** `drive.appdata` là **Non-sensitive scope** $\rightarrow$ Không bị Google bắt buộc trải qua quy trình kiểm toán bảo mật khắt khe (CASA audit), không tốn phí kiểm toán, không bị màn hình cảnh báo đỏ nguy hiểm khi người dùng đăng nhập.
- **Luồng đăng nhập trên từng nền tảng:**
  - *Chromium (Chrome, Edge):* Dùng API có sẵn `chrome.identity.getAuthToken({ interactive: true })`. Trình duyệt tự hiện popup chọn tài khoản Google của profile hiện tại, cấp token trong 1 click.
  - *Firefox & APK Android (WebView):* Dùng chuẩn `browser.identity.launchWebAuthFlow()` hoặc popup web OAuth (`https://accounts.google.com/o/oauth2/v2/auth`). Lấy `access_token` và `refresh_token`, lưu an toàn trong `browser.storage.local`. Bản APK WebView đã xác nhận đăng nhập Google bình thường, dùng chung 100% logic JavaScript như extension mà không cần cầu nối native Java/Kotlin phức tạp.

### 4. Mô hình phân tầng dữ liệu (2 tầng)
- **Tầng 1: Dữ liệu chữ & Metadata (Luôn đồng bộ - Bắt buộc):**
  - Bao gồm: Highlights, Ghi chú web, Flashcards, Cài đặt và Metadata tiến độ đọc tài liệu.
  - Dung lượng chỉ vài KB đến vài MB text JSON, đồng bộ tức thì (<1 giây), không tốn băng thông mạng.
- **Tầng 2: Tệp tài liệu gốc (PDF, DOCX, PPTX, Ảnh) (Nặng - Tùy chọn Opt-in & Tải lười):**
  - File tài liệu có dung lượng từ vài MB đến 30–50 MB. Nếu bắt buộc đồng bộ sẽ làm chậm mạng, hao pin và nhanh đầy dung lượng Drive.
  - *Giải pháp:*
    - Cung cấp công tắc trong Cài đặt: `[ ] Đồng bộ cả tệp tài liệu gốc (PDF, Office, Ảnh) lên Google Drive` (Mặc định: TẮT).
    - Khi BẬT: Áp dụng cơ chế **Tải lười (Lazy Download)**. Thiết bị mới chỉ tải file danh mục `documents-meta.json` (hiển thị đầy đủ bìa, tên sách, số trang, ghi chú). Cạnh cuốn sách hiện icon đám mây ☁️ *(Chưa tải về máy này)*. Chỉ khi người dùng bấm vào mở cuốn sách nào thì máy mới kéo file nhị phân gốc đó từ Drive về lưu vào IndexedDB cục bộ.
    - Lưu file theo mã băm SHA-256 (`<content_hash>.<ext>`) để tránh upload trùng lặp cùng một file.

### 5. Thuật toán Đồng bộ & Xử lý Xung đột (Two-Way Merge)
- **Cờ Tombstone (`deleted_at`):** Khi xoá một highlight hay ghi chú, không xoá đứt bản ghi ngay mà đánh dấu `deleted_at = "ISO_UTC_TIMESTAMP"`. Giúp các thiết bị khác khi đồng bộ biết để xoá theo, không bị tình trạng máy kia khôi phục ngược lại mục đã xoá. Sau 30 ngày các tombstone sẽ được dọn dẹp sạch.
- **Quy trình chu kỳ đồng bộ (Sync Cycle):**
  1. *Kiểm tra (Check):* Đọc file `sync-meta.json` trên Drive, so sánh timestamp với mốc của máy cục bộ.
  2. *Kéo về & Hợp nhất (Pull & Merge):* Tải dữ liệu remote về. So khớp theo `uuid`: Nếu cùng một mục được sửa ở 2 máy, mục có `updated_at` mới hơn sẽ thắng (**Last-Write-Wins trên từng item**, không bao giờ ghi đè cả file dữ liệu). Ghi kết quả hợp nhất vào IndexedDB local.
  3. *Đẩy lên (Push):* Gom các thay đổi mới tại local (được gắn cờ `dirty`), cập nhật file JSON tổng, upload đè lên Drive và cập nhật lại mốc `last_sync_at` trong `sync-meta.json`.

### 6. Thiết kế Giao diện người dùng (UI/UX)
- Đặt tại **Dashboard > Cài đặt > Đồng bộ đám mây (Cloud Sync)**:
  - Nút **[Kết nối Google Drive]**: Chạm để cấp quyền; sau khi kết nối hiển thị avatar Google, email đã đăng nhập và dung lượng Drive khả dụng.
  - Dòng trạng thái trực quan: *"Đã đồng bộ 2 phút trước"* kèm icon tích xanh (hoặc xoay tròn khi đang trong tiến trình đồng bộ).
  - Tùy chọn:
    - ☑ *Tự động đồng bộ khi mở Keepit*
    - ☐ *Đồng bộ cả tệp tài liệu gốc (PDF, Office, Ảnh)* (kèm ghi chú tốn dung lượng Drive)
    - Nút **[Đồng bộ ngay]** (để người dùng ép đồng bộ thủ công bất kỳ lúc nào).

### 7. Năm lưu ý kỹ thuật bắt buộc khi triển khai
1. **Trạng thái OAuth Consent Screen:** Ban đầu ở chế độ *Testing* (giới hạn 100 email test). Cần bấm **Publish App** để chuyển sang *In Production* cho toàn bộ người dùng. Cần chuẩn bị link `PRIVACY-POLICY.md` công khai (host qua GitHub Pages).
2. **Extension ID phải cố định:** Khi tạo OAuth Client ID cho Chrome, Google yêu cầu Extension ID. ID này sinh ra từ khoá bí mật `.pem` khi ký build (`scripts/build_release.py`). Tuyệt đối không đổi khoá `.pem` này, vì đổi khoá sẽ làm đổi ID dẫn đến lỗi từ chối kết nối (*Origin mismatch*).
3. **Cơ chế Debounce chống spam API:** Không gọi đồng bộ tức thì sau mỗi thao tác bôi đen hay gõ chữ. Cần debounce chờ 3–5 giây sau thao tác cuối cùng mới gom nhóm các thay đổi và gửi 1 request lên Drive.
4. **Bắt lỗi đầy dung lượng Drive (Quota Exceeded):** Nếu người dùng vượt quá 15GB miễn phí của Google, Drive API trả về lỗi `HTTP 403 / 507 Insufficient Storage`. Code cần bắt lỗi này và thông báo rõ ràng cho người dùng, không để ứng dụng crash hoặc thử lại vô tận.
5. **Cập nhật tài liệu minh bạch:** Khai báo trung thực trong `PRIVACY-POLICY.md` và `STORE-LISTING.md` rằng tính năng đồng bộ Drive là tuỳ chọn do người dùng chủ động bật, dữ liệu chỉ lưu trong thư mục riêng của app (`appDataFolder`) và nhà phát triển không truy cập vào dữ liệu này.

### 8. Các tính năng mở rộng có giá trị cao
1. **Tiếp tục đọc dở xuyên thiết bị (Cross-Device Session):** Lưu nhẹ URL + vị trí cuộn trang hoặc timestamp video đang học dở trên máy A. Khi mở máy B/điện thoại, Dashboard hiện thông báo 1 chạm: *"Tiếp tục đọc bài '...' từ máy tính? [Mở ngay]"*.
2. **Khôi phục phiên bản cũ (Rollback / Version History):** Tận dụng tính năng Revisions tự động của Google Drive để cung cấp nút khôi phục về bản sao lưu *"Hôm qua"*, *"3 ngày trước"*, giúp người dùng an tâm không bao giờ sợ lỡ tay xoá mất ghi chú.
3. **Tự động dọn rác bộ nhớ đệm (Smart Cache Eviction):** Với thiết bị bộ nhớ ít, Keepit tự động xoá bản lưu cục bộ của các file tài liệu quá 30 ngày không mở đọc (nhưng vẫn giữ nguyên ghi chú/tiến độ; file gốc vẫn an toàn trên Drive, khi cần đọc lại chỉ việc tải lại ☁️).
4. **Tùy chọn mã hoá đầu cuối (Client-Side Encryption):** Tùy chọn đặt mật khẩu/PIN để mã hoá toàn bộ ghi chú bằng AES-256 (Web Crypto API) trước khi tải lên Drive, đảm bảo tính riêng tư tuyệt đối ngay cả khi tài khoản Drive bị lộ.

---

## 2026-11-17 | Ý TƯỞNG - Tái ngộ từ vựng trong ngữ cảnh (Contextual Re-encounter)

**Trạng thái:** Đã chốt ý tưởng, chưa triển khai, chưa có spec chi tiết.

- **Mục tiêu:** Tự động kích hoạt phản xạ gợi nhớ từ vựng đã lưu/cần ôn ngay khi người dùng duyệt web hàng ngày, giải quyết vấn đề lười mở Flashcard để ôn tập.
- **Trải nghiệm người dùng (UX):**
  - Khi duyệt web, nếu trang xuất hiện từ nằm trong danh sách cần ôn của Flashcards/Highlights, từ đó được gạch chân chấm mờ nhẹ (dotted underline, tinh tế, không làm rối mắt bài đọc).
  - Rê chuột (hoặc chạm trên mobile) mở mini tooltip: hiển thị nghĩa tiếng Việt, IPA, **câu ngữ cảnh gốc** lúc người dùng lưu từ lần đầu, nút nghe phát âm và nút 1 chạm "Đã nhớ" để tính điểm tiến độ Flashcard.
- **Tối ưu hiệu năng:**
  - Danh sách từ cần ôn được nạp thành cấu trúc Trie/Set trong content script để tra cứu $O(L)$ siêu tốc.
  - Chỉ quét trong vùng nội dung bài đọc chính (`Readability` của Reader), kết hợp `IntersectionObserver` khi cuộn tới đoạn nào mới quét đoạn đó, không duyệt toàn bộ DOM cùng lúc.
  - Hỗ trợ Lemmatization nhẹ (nhận diện các biến thể thì/số nhiều như `struggling`, `struggled` của từ gốc `struggle`).
- **Câu hỏi còn mở:**
  1. Phạm vi hiển thị: chỉ nhắc từ có trạng thái "đang học / cần ôn" trong SRS hay toàn bộ từ đã từng lưu?
  2. Có cần danh sách loại trừ (blacklist) tự động cho các trang làm việc/code/mạng xã hội không?

---

## 2026-11-16 | Ý TƯỞNG - Loại từ cả trang: bước B5 — độ tự tin của mô hình

**Trạng thái:** Đề xuất, chờ người dùng quyết. Chưa đưa vào code.

- Bối cảnh: Loại từ cả trang (Alt+G) phải biết đoạn nào là tiếng Anh. Chuỗi hiện có: B1 kiểm tra chữ cái → B2 trình duyệt nhận diện (đoạn ≥40 ký tự, chỉ kết quả chắc chắn) → B3 đa số các đoạn chắc chắn trên trang (≥3 đoạn) → B4 `<html lang>`, rồi nhận diện chữ cả trang.
- Vấn đề B4 không giải được: trang khai `lang` sai, ví dụ tuoitrenews.vn khai `vi` nhưng nội dung tiếng Anh.
- Đề xuất B5: dùng chính mô hình Loại từ (chạy offline) để đánh giá đoạn có phải tiếng Anh không. Đạt khi cả 3 điều kiện: điểm tin cậy trung bình ≥0.80, số mảnh/từ ≤1.5, danh từ riêng ≤70%.
- Kết quả đo: 70/70 tiêu đề tiếng Anh đạt; 1/72 câu không phải tiếng Anh đạt nhầm (tiếng Pháp); 0/14 câu tiếng Việt không dấu đạt nhầm.
- Giữ nguyên ràng buộc đã chốt: nhận diện ngôn ngữ chạy offline, không gửi chữ lên Google.
- Câu hỏi mở: có thêm B5 không; nếu có thì B5 đứng trước hay sau B4.

---

## 2026-11-16 | Ý TƯỞNG - Cài đặt và Đăng nhập dạng sheet trong trang trên máy tính

**Trạng thái:** Hoãn, chưa chốt chi tiết.

- Hiện tại: thiết bị cảm ứng mở Cài đặt bằng sheet trong trang; máy tính mở Cài đặt ở tab mới (Bảng quản lý).
- Ý tưởng: máy tính cũng mở Cài đặt bằng sheet ngay trong trang, Đăng nhập bằng popup trong trang, không rời trang đang đọc.
- Cần chốt khi làm: kích thước và vị trí sheet trên màn rộng; giữ hay bỏ đường mở Bảng quản lý ở tab mới.

---

## 2026-11-16 | Ý TƯỞNG - Làm lại giao diện responsive

**Trạng thái:** Để sau, chưa có thiết kế hay demo.

- Ý tưởng: rà và làm lại bố cục cho mọi cỡ màn hình (điện thoại, tablet, máy tính).
- Phạm vi, thứ tự các trang và demo sẽ chốt khi bắt đầu.

---

## 2026-11-16 | Ý TƯỞNG - Bản APK Android (trình duyệt Keepit dùng WebView)

**Trạng thái:** Tạm dừng; chỉ làm khi người dùng yêu cầu. APK hiện ở v3.5.179-android (từ extension v3.5.174).

- Lý do cần: Chrome Android không cài được extension (Edge Android thì được).
- Quy ước: phiên bản APK `<extension>-android.<n>`.
- Lần chuyển các bản extension mới sang APK trước đây đã bị huỷ; khi làm lại phải bắt đầu từ bản APK hiện tại.
- Giới hạn đã biết: Google và Facebook chặn đăng nhập trong WebView. Gradle: Java 21 cần Gradle 8.5+, Java 25 cần 9.1.0+.
- Việc riêng của APK (đọc khi tắt màn hình, chặn quảng cáo) ghi ở mục "Việc cho APK" trong `PROJECT.md`.

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

## 2026-11-06 | Ý TƯỞNG - AI composer (gợi ý trả lời mail, viết mail)

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

## 2026-11-06 | Ý TƯỞNG - Khác (chưa chọn)

**Trạng thái:** Ghi lại để cân nhắc, chưa chốt. Kiểm tra trùng với tính năng hiện có trước khi làm.

1. **Một chạm lưu thành flashcard:** từ trong từ điển, câu đã highlight, cụm từ AI gợi ý → flashcard, kèm câu ví dụ từ chỗ đang đọc.
2. **Ôn tập mỗi ngày:** nhắc ôn flashcard theo lặp lại ngắt quãng (popup hoặc trang tab mới).
3. **Xuất sang Anki.**
4. **Đồng bộ nhiều máy:** sao lưu thư viện vào Google Drive của người dùng.
5. **Đọc to đoạn đã chọn trên mọi trang:** Keepit đã có TTS; chỉ làm nếu hiện chưa hỗ trợ, bằng cách mở rộng TTS đang có.

---

## 2026-11-06 | Ý TƯỞNG - Dịch PDF và OCR

**Trạng thái:** Handoff PDF triển khai ở v3.5.370: khi tab PDF cục bộ đang active, cửa sổ extension popup nổi góc phải trên đưa CTA sang Tài liệu; người dùng chọn file local tại đó. Không tự chuyển hướng/fetch/đọc browser viewer. Nhận diện `.pdf` trực tiếp hoặc nguồn trong query viewer `src`/`file`/`url`. Viewer dịch PDF và OCR vẫn còn giới hạn/spec riêng bên dưới.

### 1. Mục tiêu
- **Dịch PDF:** mở PDF trong Keepit, dịch song ngữ, highlight và ghi chú như trên web.
- **OCR:** khoanh một vùng trên trang, nhận dạng chữ trong ảnh, rồi dịch hoặc gửi Ask AI.
- Thứ tự: v3.5.133 đổi tên → Dịch PDF → OCR (kèm dịch PDF scan). Vị trí so với Luyện viết/nói: người dùng chưa quyết.

### 2. Dịch PDF
- Extension không chạy được trong trình xem PDF mặc định của Chrome và Firefox → Keepit có **trang xem PDF riêng**, dùng PDF.js đóng gói trong extension (không tải từ CDN).
- Khi tab PDF active, hiện cửa sổ popup extension riêng ở góc phải trên, kèm badge `PDF` dự phòng. CTA dẫn tới Dashboard > Tài liệu để người dùng chọn PDF local. Không tự chuyển hướng; không fetch URL hoặc đọc file từ browser viewer.
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
2. PDF: đã chốt gợi ý bằng popup nổi riêng ở góc phải, không tự chuyển hướng (v3.5.370).
3. PDF: hiện bản dịch kiểu nào (xen dưới đoạn, cột song song, hay bảng bên)?
4. OCR: phím tắt / nút ở thanh chọn / menu chuột phải; ngôn ngữ OCR mặc định theo ngôn ngữ nguồn?

---

## 2026-11-06 | Ý TƯỞNG - Luyện viết, Luyện nói trên Dashboard và nhận dạng giọng nói

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
