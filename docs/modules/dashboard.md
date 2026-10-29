# Dashboard — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Dashboard quản lý thư viện annotation, flashcards, cài đặt và hồ sơ. `dashboard.js` điều phối state/DOM; Background sở hữu annotation CRUD/IndexedDB, còn favorites và một số preferences lưu qua `browser.storage.local`.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`pages/dashboard.html`](../../pages/dashboard.html), [`pages/lr-practice-demo.html`](../../pages/lr-practice-demo.html) | `#dashboardLRPracticeFrame` | Dashboard routes và UI LR giữ bố cục demo trong iframe. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js) | `load`, `render`, `setDashboardView`, `syncLRPracticeFrame` | Nạp local data, điều hướng, quản lý UI và cầu dữ liệu/actions cho iframe LR. |
| [`js/dashboard/lr-practice-demo.js`](../../js/dashboard/lr-practice-demo.js) | `applyData`, `handleCardAction` | Nhóm annotation để hiển thị; lọc, thống kê và gửi thao tác qua parent. |
| [`js/dashboard/lr-practice-theme-sync.js`](../../js/dashboard/lr-practice-theme-sync.js) | `syncDashboardTheme` | Đồng bộ class sáng/tối từ parent. |
| [`js/dashboard/library.js`](../../js/dashboard/library.js) | `LHN_LIBRARY` | Metadata, nhóm trang và page key annotation. |
| [`js/dashboard/overview-data.js`](../../js/dashboard/overview-data.js) | `LHN_DASHBOARD_OVERVIEW_DATA` | Tổng hợp Overview từ annotation cục bộ. |
| [`js/dashboard/study-view.js`](../../js/dashboard/study-view.js), [`js/dashboard/study-utils.js`](../../js/dashboard/study-utils.js) | `LHN_STUDY_VIEW`, `LHN_STUDY_UTILS` | Render flashcards và tiện ích thuật toán. |
| [`js/dashboard/backup.js`](../../js/dashboard/backup.js), [`js/dashboard/account.js`](../../js/dashboard/account.js) | `LHN_BACKUP`, `LHN_ACCOUNT` | Import/export và profile cục bộ. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES`, `LANGUAGES.t` | Bản dịch Dashboard en/vi/ko. |

## 3. Luồng chính

1. `dashboard.html` nạp core/helpers trước `dashboard.js`; giữ nguyên thứ tự script khi chỉnh markup.
2. `load()` đọc settings và tải annotations theo batch qua `LHN_MESSAGING`, sau đó render các view.
3. Overview tổng hợp từ annotations và Dictation session index cục bộ; dữ liệu rỗng cho số 0/trạng thái rỗng, không dựng lịch sử review.
4. `setDashboardView()` chuyển năm route: Overview, Listening, Library, Grammar và LR practice. Các view còn lại giữ route/hành vi hiện có.
5. LR practice giữ nguyên UI iframe. Parent gửi annotation records cùng favorites/language bằng `postMessage`; iframe nhóm trang từ schema hiện có, áp bộ lọc và tính thống kê cục bộ.
6. Iframe gửi edit/delete/favorite/export/study/jump/speak qua cầu cùng origin. `dashboard.js` kiểm tra source/origin, gọi handler hiện có và gửi state mới về iframe.
7. CRUD annotation đi qua Background; favorites qua `browser.storage.local`. Import/export và flashcards tiếp tục dùng helper/handler Dashboard hiện có.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ năm route hiện có; action Flashcards trên sidebar vẫn gọi `startStudySession({ allSources:true })` và không tạo route mới.
- LR demo chỉ kết nối local annotations qua parent; không gọi API/backend, không truy cập IndexedDB trực tiếp và không đổi route khác.
- Chỉ nhận `LR_DEMO_READY`/`LR_DEMO_ACTION` từ `dashboardLRPracticeFrame.contentWindow` cùng `location.origin`; protocol version hiện là `1`.
- `KEEPIT_LR_DATA` chỉ là bản sao trong bộ nhớ iframe. Background/IndexedDB vẫn là nguồn annotation duy nhất; các thao tác ghi phải quay lại handler parent.
- Giữ đồng bộ annotations, page favorites và note favorites sau `load()`, CRUD và storage changes để iframe không giữ snapshot cũ.
- Annotation CRUD/review tiếp tục dùng Background messages (`GET_BATCH`, `UPDATE`, `DELETE`, `DELETE_PAGE`, `REVIEW_ANNOTATION`, `IMPORT`).
- Settings/favorites/preferences giữ storage keys hiện có; optimistic favorite phải phục hồi state khi lưu lỗi.
- Parent labels mới dùng `data-i18n`/`data-i18n-aria-label`; chuỗi LR mới có en/vi/ko trong dictionary iframe và nhận `currentLang` qua bridge.

## 5. Kiểm tra và xác minh

- Static: `for f in js/dashboard/*.js; do node --check "$f" || exit; done`; `node --test tests/*.test.cjs`; parse `manifest.json`; audit iframe/local refs và message contract.
- Thử trên browser: chuyển năm view, theme/responsive; kiểm tra LR dữ liệu rỗng/có dữ liệu, filter/favorites, edit/delete, export từng trang/toàn bộ và refresh để xác nhận lưu bền vững.
- Mô phỏng DOM hoặc static assertion không thay thế kiểm thử Chrome/Firefox thật; chỉ ghi nhận browser verification sau khi thực hiện trực tiếp.
