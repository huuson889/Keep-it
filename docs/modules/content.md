# Content — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Content scripts chạy trên trang web: highlight, note, sidebar trang, selection toolbar và phục hồi annotation. Script chạy trong trang ChatGPT/Gemini/Claude đã chuyển sang [Ask AI](ask-ai.md); Content chỉ gửi yêu cầu mở AI panel và hiện toast kết quả.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Thứ tự nạp trên `<all_urls>`. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings trang, selection, sidebar, runtime messages, Hỏi AI. |
| [`js/content/web-highlighter.js`](../../js/content/web-highlighter.js) | `LHNWebHighlighter.create` | Tạo/gỡ mark trên DOM. |
| [`js/content/annotation-restore.js`](../../js/content/annotation-restore.js) | `LHN_ANNOTATION_RESTORE` | Tìm lại đoạn đã lưu khi trang đổi. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Shell sidebar trang, tab Highlight và nút mở AI panel. |
| [`js/content/note-composer.js`](../../js/content/note-composer.js) | `LHN_NOTE_COMPOSER` | Dựng record annotation từ field cho phép. |
| [`js/content/sentence-note.js`](../../js/content/sentence-note.js) | `LHN_SENTENCE_NOTE` | Lấy ngữ cảnh câu quanh selection. |
| [`js/content/page-layout.js`](../../js/content/page-layout.js) | `LHN_PAGE_LAYOUT` | Snapshot/khôi phục layout khi mở sidebar. |
| [`js/content/ui-components.js`](../../js/content/ui-components.js) | `LHN_UI_COMPONENTS` | Tag editor dùng chung. |
| [`js/shared/selection-toolbar.js`](../../js/shared/selection-toolbar.js) + [`css/shared/selection-toolbar.css`](../../css/shared/selection-toolbar.css) | `LHN_SELECTION_TOOLBAR` | Toolbar nổi khi chọn chữ (Tô sáng/Dịch/Hỏi AI + logo), dùng chung cho trang và preview Dashboard. |

## 3. Luồng chính

1. Manifest nạp core, helper content rồi `content.js`; controller chặn nạp lặp bằng cờ trên `window`.
2. Selection tạo highlight/note qua `web-highlighter.js` và `note-composer.js`, rồi gửi `ADD`/`UPDATE` tới Background.
3. Khi tải trang hoặc nhận `ANNOTATIONS_CHANGED`/`RESTORE_HIGHLIGHTS`, `annotation-restore.js` tìm lại vị trí và vẽ lại mark; record có `dictionaryOnly:true` bị bỏ qua (không có vị trí trên trang).
4. Sidebar trang hiển thị danh sách, tìm kiếm và bộ lọc; `page-layout.js` giữ layout trang khi sidebar mở.
5. Hỏi AI gửi `OPEN_AI_PANEL` với selection tường minh; `AI_PANEL_*`/`AI_LINK_PANEL_*` từ Background chỉ hiện toast, chỉnh scrollbar hoặc đổi nút cạnh trang sang chế độ AI (Chromium, khi AI panel mở và sidebar Highlight đóng; bấm gửi `TOGGLE_AI_PANEL`).

## 4. Hợp đồng và quy tắc cần giữ

- Không đọc page body/title cho AI; Hỏi AI chỉ gửi selection người dùng chọn và URL hiện tại.
- Full dict bật + 1 từ tiếng Anh: Dịch trên toolbar/logo và phím dịch (`translateSelectedShortcut`, mặc định Alt+W) đều truyền `allowDictionary:true` → mở full dict kể cả khi popup dịch trực tiếp tắt (chế độ icon); cụm từ → popup dịch thường. Không dùng `forcePopup` làm cờ (nút cụm trong full dict cũng truyền `forcePopup`).
- Record annotation chỉ chứa field trong `PERSISTED_FIELDS` của `note-composer.js`, ngoại lệ duy nhất là cờ `dictionaryOnly` do nút tim của full dict thêm.
- Full dict (`#lhn-full-english-dictionary`): nút tim gửi `ADD`/`DELETE`. Từ đang tra đúng là từ bôi trên trang → mark + record; từ/cụm khác → record `dictionaryOnly:true` (vẫn có `url` trang, hiện ở Dashboard/flashcard). Bôi trong câu ví dụ: 1 từ → tra trong dict (có Back), cụm → popup dịch thường; click trong dict chỉ đóng popup dịch đó.
- Brand full dict (`placeDictionaryBrand`/`fitDictionaryBrand`): chữ "Keepit Dictionary" vẽ bằng CSS `::before`, không có text node — code đọc `textContent` của `.lhn-dict-translation`/câu ví dụ (điền ghi chú, ghi chú của tim) không được nhận chữ brand. Lớp `#lhn-dict-effect-layer` được đưa lên cuối trang mỗi lần bấm tim để popup tạo lại sau không che hiệu ứng.
- Website bị tắt thì không restore highlight và không áp UI trang.
- Message từ Background phải kiểm tra `type` trước khi xử lý; không thực thi nội dung từ page.
- Giữ selector/class `lhn-*` để CSS content và sidebar không vỡ.
- Selection toolbar: chỉ dựng bằng `LHN_SELECTION_TOOLBAR.build()`. 8 dạng (`selectionToolbarStyleV2`, mặc định `1`) = 3 cờ `data-layout` (`radial`/`bar`), `data-labels`, `data-collapsible`: vòng 1 chữ+luôn hiện, 2 chữ+hover, 3 icon+luôn hiện, 4 icon+hover; thanh 5 chữ+mở sẵn, 6 chữ+hover, 7 icon+mở sẵn, 8 icon+hover. CSS chỉ đọc cờ, không đọc số dạng. Vòng: shell chỉ là badge logo 38px, mỗi nút là một khung Keepit riêng (Tô sáng trái, Dịch dưới, Hỏi AI phải, không bao giờ phía trên dòng chữ); dạng luôn hiện mở khi launcher có `lhn-visible`, dạng hover mở theo `:hover/:focus-within` của shell và đóng sau khoảng trễ ngắn. `positionTranslateIcon()` với dạng vòng không lật `lhn-actions-right` mà dời cả cụm vào trong để 3 nút cách mép viewport ≥8px. Logo chạy `selectionToolbarLogoAction` (mặc định Tô sáng), tooltip theo thao tác đó. `content.css` chỉ giữ định vị `#lhn-translate-icon`. Background `onInstalled` (reason `update`) xoá key cũ `selectionToolbarStyle`/`translateIconStyle` → mọi người dùng về dạng 1.

## 5. Kiểm tra và xác minh

- Đã chạy: `node --check` cho các file content trong đợt chuyển Ask AI (logic content không đổi).
- Đề xuất: tạo/sửa/xóa highlight, restore sau reload, sidebar trang, Hỏi AI và toast trên Chromium/Firefox.
