# Dashboard — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Dashboard cung cấp Overview, Listening demo và “Tô sáng & Ghi chú”, cùng các luồng Flashcards, cài đặt, profile và backup. `dashboard.js` điều phối điều hướng và dữ liệu; iframe Highlights & Notes là giao diện duy nhất để duyệt và quản lý highlights/notes, còn parent vẫn là nơi đọc dữ liệu cục bộ và thực thi actions.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/dashboard.html`](../../pages/dashboard.html), [`pages/lr-practice-demo.html`](../../pages/lr-practice-demo.html) | `#dashboardHighlightsNotesFrame` | Ba route còn lại và UI Highlights & Notes trong iframe. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js) | `load`, `render`, `setDashboardView`, `syncHighlightsNotesFrame` | Nạp annotations cục bộ, chuyển route và làm cầu dữ liệu/actions cho Highlights & Notes. |
| [`js/dashboard/lr-practice-demo.js`](../../js/dashboard/lr-practice-demo.js) | `applyData`, `handleCardAction` | Nhóm, lọc, thống kê và hiển thị annotations; gửi actions về parent. |
| [`js/dashboard/annotation-utils.js`](../../js/dashboard/annotation-utils.js) | `LHN_ANNOTATION_UTILS.create`, `pageKey` | Chuẩn hóa site, tags và page key; API instance cũng cung cấp `pageKey` cho Overview và Highlights & Notes bridge. |
| [`js/dashboard/overview-data.js`](../../js/dashboard/overview-data.js) | `LHN_DASHBOARD_OVERVIEW_DATA` | Tổng hợp Overview từ annotations cục bộ. |
| [`js/dashboard/study-view.js`](../../js/dashboard/study-view.js), [`js/dashboard/study-utils.js`](../../js/dashboard/study-utils.js) | `LHN_STUDY_VIEW`, `LHN_STUDY_UTILS` | Render flashcards và tiện ích thuật toán. |
| [`js/dashboard/backup.js`](../../js/dashboard/backup.js), [`js/dashboard/account.js`](../../js/dashboard/account.js) | `LHN_BACKUP`, `LHN_ACCOUNT` | Import/export và profile cục bộ. |

## 3. Luồng chính

1. `dashboard.html` nạp core/helpers trước `dashboard.js`; giữ đúng thứ tự script.
2. `load()` đọc settings, favorites và annotations theo batch qua `LHN_MESSAGING`, sau đó cập nhật Overview và gửi snapshot sang iframe Highlights & Notes.
3. `setDashboardView()` chỉ chuyển Overview, Listening và `highlights-notes`; sidebar không còn mục Grammar/Library. Lối tắt Highlights & Notes trên Overview cũng mở route Highlights & Notes này.
4. iframe Highlights & Notes nhận annotations, page favorites, note favorites và ngôn ngữ qua same-origin `postMessage`; iframe dựng danh sách và tính bộ lọc/thống kê cục bộ. Favicon của trang đang chọn thử `/favicon.ico`, rồi Google S2; nếu cả hai lỗi thì hiện icon dự phòng.
5. Edit/delete/favorite/export/study/jump/speak từ Highlights & Notes quay về các handler parent hiện có; parent lưu CRUD/review qua Background và favorites qua `browser.storage.local`.
6. Overview lấy thống kê từ annotations và Dictation session index; Listening tiếp tục là demo riêng.

## 4. Hợp đồng và quy tắc cần giữ

- Ba route Dashboard còn lại là Overview, Listening và Highlights & Notes; action Flashcards trên sidebar gọi `startStudySession({ allSources:true })` và không tạo route mới.
- “Tô sáng & Ghi chú” là giao diện duy nhất để xem và quản lý highlights/notes. Không khôi phục hai route nháp, không thêm API/backend hay nguồn lưu annotation thứ hai.
- Chỉ nhận `HIGHLIGHTS_NOTES_READY`/`HIGHLIGHTS_NOTES_ACTION` từ `dashboardHighlightsNotesFrame.contentWindow` cùng `location.origin`; protocol version là `1`.
- `KEEPIT_HIGHLIGHTS_NOTES_DATA` chỉ là bản sao trong bộ nhớ iframe. IndexedDB/Background tiếp tục là nguồn annotation duy nhất; thao tác ghi phải quay lại parent handler.
- Giữ đồng bộ annotations, page favorites và note favorites sau `load()`, CRUD và storage changes để iframe không dùng snapshot cũ.
- Export toàn thư viện và import JSON, edit/delete, page/note favorite, review flashcard và thao tác mở/đọc highlight tiếp tục dùng dữ liệu cục bộ và handler hiện có.

## 5. Kiểm tra và xác minh

- Static: `for f in js/dashboard/*.js; do node --check "$f" || exit; done`; `node --test tests/*.test.cjs`; parse `manifest.json`; kiểm tra route/ID/script refs và message contract.
- Mock: kiểm tra metadata/page key, Overview cache invalidation và Highlights & Notes data/action bridge.
- Trình duyệt: kiểm tra ba route còn lại, Highlights & Notes rỗng/có dữ liệu, favorites, CRUD, export/import, study actions và responsive/theme. Mock/static không thay cho Chrome/Firefox thật; chỉ ghi nhận browser verification sau khi chạy trực tiếp.
