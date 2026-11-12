# Tài liệu kỹ thuật nội bộ

> Các trang này giúp định hướng khi đọc source; code là nguồn sự thật. Chỉ mở trang liên quan tới yêu cầu.

| Tài liệu | Phạm vi | Đọc khi |
|---|---|---|
| [Nguyên tắc giao diện](ui-layout.md) | Bố cục dọc/ngang, chạm/chuột, dồn nút vào ☰, kiểu menu/popup cho mọi module | Sửa giao diện, bố cục, responsive, thanh Keepit, menu/sheet, popup dịch/từ điển, Overlay, Reader hoặc Dashboard. |
| [Ask AI](modules/ask-ai.md) | AI panel ChatGPT/Gemini/Claude: providers, panel, script trong trang AI, background service | Sửa AI panel, chọn provider, route/mapping, prompt/Send hoặc Alt+X/Hỏi AI. |
| [Background](modules/background.md) | Service worker, runtime router, IndexedDB annotations, usage, TTS | Sửa router message, annotation storage, usage hoặc TTS. |
| [Content](modules/content.md) | Tương tác trang: highlight, note, Sidebar trang, selection, restore | Sửa luồng website, DOM observer, sidebar trang hoặc annotation UI. |
| [Core](modules/core.md) | Defaults, config, settings, messaging, languages, cache | Sửa nền tảng dùng chung hoặc thứ tự nạp. |
| [Dashboard](modules/dashboard.md) | Overview, Listening, Highlights & Notes (LR), flashcards/settings | Sửa `pages/dashboard.html`, LR bridge hoặc chức năng Dashboard. |
| [Overlay](modules/overlay.md) | Shared Video/Web overlay, Study engine/activities và View modes | Sửa overlay, nguồn Video/Web, Shadowing/Dictation integration hoặc chế độ hiển thị. |
| [Study](modules/dictation.md) | Dictation/Writing, Shadowing/Speaking, scoring và session persistence | Sửa Study activities, cue sync, chấm điểm hoặc tiến độ. |
| [Popup](modules/popup.md) | Popup settings và website controls | Sửa popup, shortcut/settings controls hoặc mở Dashboard. |
| [Reader](modules/reader.md) | Bilingual Reader và TTS | Sửa dịch trên trang, đọc liên tục, voice hoặc audio fallback. |
| [Shared](modules/shared.md) | Custom font, icons, search (index + ranking/highlight), sheet, favicon cache, thumbnails | Sửa helper dùng chung giữa Content/Dashboard/Popup. |
| [Translate](modules/translate.md) | Translation, dictionary, study translation | Sửa provider, cache hoặc từ điển. |
| [Video](modules/video.md) | YouTube caption source, transcript, cache và timing | Sửa track selection, caption parsing, transcript cache hoặc cue/playback sync. |
| [Nhật ký cũ](changelog/v3.5.md) | Lịch sử thay đổi đã chuyển khỏi `PROJECT.md`: [v3.5.x](changelog/v3.5.md), [v3.4.x và cũ hơn](changelog/v3.4-va-cu-hon.md) | Chỉ khi cần tra lý do/lịch sử của một version cũ. |
| [Supabase](supabase/SUPABASE_SYNC.md) | Hợp đồng dữ liệu đồng bộ cloud + `supabase-schema.sql` (chưa nối trong addon) | Khi làm đồng bộ cloud. |

## Sửa nhanh: muốn sửa → mở file

Tên file là đường dẫn từ gốc repo. "(nền)" = chạy trong service worker; còn lại chạy trên trang hoặc trang của Keepit.

| Muốn sửa | Mở file |
|---|---|
| Thanh Keepit, ☰, cuộn ẩn/hiện, nút lên đầu trang | `js/content/keepit-bar.js`; giao diện (CSS) ở `js/content/keepit-bar-css.js` |
| Vuốt thanh lùi/tới, sang tab trái/phải | `js/content/keepit-bar.js` → `SWITCH_TAB` trong `js/background/background.js` (nền) |
| Cử chỉ trên trang: vuốt trái dịch đoạn, chạm 2 ngón dịch trang | `js/content/keepit-bar.js` |
| Dịch đoạn, chọn chữ, popup dịch, full dict | `js/content/content.js`, `js/translate/dictionary.js` |
| Gọi dịch vụ dịch, cache bản dịch | `js/translate/translate.js` (nền) |
| Icon tròn / thanh công cụ khi chọn chữ | `js/shared/selection-toolbar.js` + `css/shared/selection-toolbar.css` |
| Tô sáng, ghi chú, Sidebar trang | `js/content/web-highlighter.js`, `note-composer.js`, `sidebar.js`; lưu ở `js/background/annotations.js` (nền) |
| Sheet kéo xuống để đóng (mọi sheet) | `js/shared/sheet-kit.js` |
| Tìm kiếm, lọc danh sách, tô chỗ khớp | `js/shared/search.js` |
| Reader song ngữ (thanh, giọng, tốc độ) | `js/reader/bilingual-reader.js`; CSS ở `js/reader/reader-css.js`; giọng/âm thanh ở `js/reader/tts-engine.js` |
| Overlay: giao diện Xem · Nói · Chép · Rạp | `js/overlay/unified/unified-ui.js` + `unified-css.js` |
| Overlay: mở/đóng, phím tắt, phát/tua, xuất file | `js/overlay/overlay-controller.js` |
| Overlay: phụ đề video / bài viết web | `js/overlay/source/video.js` / `js/overlay/source/web.js` |
| Overlay: chấm điểm, luật giải câu | `js/overlay/study/shared/` |
| Overlay: cài đặt, chế độ phụ đề/xem, hàng đợi dịch phụ đề, yêu thích | `js/overlay/overlay-engine.js` |
| ⚠ Không sửa giao diện ở | `OVERLAY_HTML` trong `js/overlay/overlay-template.js` (markup cũ đang ẩn, xoá ở bước 5) |
| AI panel | `js/ask-ai/` (`service.js`, `providers.js`, `prompt-format.js` chạy nền; `toolbar.js`, `panel/`, `page/`) |
| Trang chủ Keepit / trang offline | `js/home/home-ui.js` + `pages/home.html` / `js/content/offline-page.js` |
| Dashboard / popup | `js/dashboard/` + `pages/dashboard.html` / `js/popup/popup.js` + `pages/popup.html` |
| Màu kính sáng/tối (thanh, ☰, Reader) | `js/shared/theme-tokens.js` (biến `--kp-…`) |
| Nhãn en/vi/ko | `js/core/languages.js` (nhãn thanh Keepit: khoá `bar_<tên>`). Hiện còn bảng riêng trong `offline-page.js`, `js/overlay/unified/unified-text.js` |
| Cài đặt mặc định, khoá lưu trữ | `js/core/defaults.js`, `js/core/config.js` |
| Thứ tự nạp script | `manifest.json` (`content_scripts`, `background`) |
