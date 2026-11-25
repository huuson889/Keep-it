# Content — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Content là controller duy nhất cho chọn chữ, popup dịch/Full Dictionary, popup/màu/thẻ Ghi chú, sidebar và restore. Web dùng trực tiếp; Tài liệu nạp cùng module và cung cấp identity/anchor qua optional owned context. Không có bộ chọn chữ/Notes song song trong Documents. AI website composer thuộc [Ask AI](ask-ai.md).

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`content.js`](../../js/content/content.js) | IIFE, `LHN_CONTENT_TOOLS`, `LHN_BAR_ACTIONS` | Settings/selection/Notes/dictionary/AI actions/runtime; facade chỉ gọi hàm có sẵn. |
| [`web-highlighter.js`](../../js/content/web-highlighter.js) | `LHNWebHighlighter.create` | Preview/wrap/unwarp mark, màu và readable text. |
| [`note-composer.js`](../../js/content/note-composer.js) | `LHN_NOTE_COMPOSER` | Field ghi, unchanged check, form chung. |
| [`annotation-restore.js`](../../js/content/annotation-restore.js) | `LHN_ANNOTATION_RESTORE` | Tìm quote/ngữ cảnh web; file context cung cấp ranges chính xác. |
| [`sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create/attachTouchSheet` | Notes UI chung và cấu hình grow/scroll/drag sheet chung. |
| [`page-layout.js`](../../js/content/page-layout.js) | `LHN_PAGE_LAYOUT` | Snapshot/shrink/restore web; host tệp chỉ đổi geometry viewport. |
| [`selection-toolbar.js`](../../js/shared/selection-toolbar.js) | `LHN_SELECTION_TOOLBAR` | Một builder cho mọi style và touch selection bridge. |
| [`keepit-bar.js`](../../js/content/keepit-bar.js) | `LHN_BAR_HOOKS` | Thanh/menu web, dùng component sheet/selection chung. |
| [`documents-context.js`](../../js/dashboard/documents-context.js) | `LHN_PAGE_CONTEXT` | Chỉ xuất trong owned Documents; identity, ranges, layout và callbacks. |

## 3. Luồng chính

1. Manifest nạp core/helpers trước controller; cờ trên window chặn nạp lại. Source web mặc định `location.href/title`; owned context cung cấp tham chiếu tệp và root được phép chọn.
2. Mouseup hoặc touch bridge chung lấy selection. `showOnSelect`, popup/icon, style/logo-action và các master quyết định đúng UI app. Toolbar chỉ dựng bằng shared builder; web không có context giữ đường cũ.
3. Popup Ghi chú giữ quote/context/range trước khi preview thay DOM; gửi `ADD`/`UPDATE` tới annotations Background. File thêm `documentAnchor`, không gửi HTML. Lưu async của nguồn cũ không được commit preview/đóng popup mới.
4. Restore web dùng quote/prefix/suffix; file dùng page/block/character anchors. Không tìm quote trùng lên trang khác hoặc thư viện. Response nguồn cũ bị bỏ khi source đã đổi.
5. Sidebar đọc `GET_PAGE`, native card/edit/filter/tag/source actions dùng cùng kho ghi chú. `attachTouchSheet` là setup duy nhất cho Notes touch trên web và Documents; underlying behaviour vẫn là `LHN_SHEET`.
6. Hỏi AI gọi luồng chung với selection tường minh; không chọn chữ thì URL-only như app. Tài liệu không tạo chat UI riêng. Source-link/jump local chỉ cho Dashboard document URI sở hữu.

## 4. Hợp đồng và quy tắc cần giữ

- `notesEnabled`, `translateEnabled`, `askAIEnabled` tắt thì tool tương ứng không có/không chạy; cả ba tắt không tạo icon. Đừng ghi đè preference icon để thực hiện master.
- Giữ 8 style, dạng 0 chỉ logo, `data-layout/labels/collapsible/slot`, action fallback và logo default. Full dict bật + một từ English phải đi `allowDictionary:true`; cụm từ dùng popup dịch.
- Field annotation theo `PERSISTED_FIELDS`; `dictionaryOnly` và optional `documentAnchor` là cờ/ngữ cảnh rõ ràng. Web records không tự có document fields.
- Tim từ đang chọn trên source → native mark + record; từ khác → dictionary-only Flashcard. Brand dict không được lọt vào nghĩa/ghi chú vì đọc textContent.
- H&N/Flashcards/backup dùng annotations chung. Metadata tệp, blob và tiến độ vẫn thuộc DB Tài liệu; migration không được tái tạo note đã xóa.
- `LHN_CONTENT_TOOLS` không dựng UI: toggleNotes/compose/askAI/dictionary/restore/refresh/close và dismiss dùng chính controller. Chỉ source adapter có hooks; web fallback và selector `lhn-*` không đổi.
- Main sheet mở trong Documents đưa Dịch/Đọc to xuống footer cố định cạnh Cài đặt; dùng `LHN_DOCUMENTS_MAIN_ACTIONS` để gọi cùng viewer handlers, không route qua generic web `page`/`reader`. Ẩn điều khiển Ẩn/Hiện thanh chỉ trong Documents sheet.
- Giữ keyboard/editable/composition, native Android selection-dismiss, site-disabled và source isolation; không chặn Ctrl+A hay tạo thêm cử chỉ riêng.

## 5. Kiểm tra và xác minh

Syntax/manifest/dependency refs; Chromium extension thật kiểm chọn chữ/styles/masters, composer save/restore/migration, native sidebar/touch, full dict/tim, AI requests và Notes deep-link/backup. Kiểm lại web không có host và homepage sau thay đổi component chung. Các QA thiết bị/Firefox chưa xác nhận vẫn ở `PROJECT.md`, không được coi mock là provider/giọng thật.
