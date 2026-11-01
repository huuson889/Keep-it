# Video (YouTube Dual Subtitles) — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

Module dựng overlay Dual Subtitles trên YouTube, quản lý player/caption, dịch transcript và cung cấp API cho Dictation. Giao diện nằm trong Shadow DOM; logic luyện tập thuộc module Dictation.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Nạp template trước controller video và Dictation. |
| [`js/video/overlay-template.js`](../../js/video/overlay-template.js) | `OVERLAY_HTML`, `OVERLAY_CSS` | Khai báo nội dung và style của overlay. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `openOverlay`, `loadCaptions`, `refreshSubtitleLanguageSettings` | Điều phối player, caption, UI và API tích hợp. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES`, `t` | Bản dịch EN/VI/KO cho UI video và Dictation. |
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION` | Nhận API video và làm mới nhãn học khi đổi ngôn ngữ. |

## 3. Luồng chính

1. Manifest nạp template rồi controller. Controller chỉ khởi chạy trên YouTube; `openOverlay()` tạo Shadow DOM và tạm chuyển video hiện có vào slot. Đóng hoặc đổi video phải khôi phục player qua `detachVideo()`.
2. `loadCaptions()` thử transcript cache, Player API/timedtext, panel transcript, tracklist watch page, rồi nguồn caption đang hiển thị. Cue được làm sạch, dựng theo thời điểm phát và dịch qua `LHN_MESSAGING`.
3. `LHN_OVERLAY_API` được phát qua `lhn-overlay-ready`; caption mới phát `lhn-dual-captions-updated`. Dictation lấy cue tiếng Anh từ API này.
4. Thay đổi `lhnSettings.language` làm mới `state.displayLanguage`, nhãn/thuộc tính truy cập của overlay và nhãn Dictation đang mở; `lhnStudyTranslationSettings` tiếp tục điều khiển source/target subtitle language.
5. Content chỉ cho phép selection dịch/từ điển từ `.te-sub-en` hoặc `.yt-dual-item-en` trong giao diện video. Chọn chữ UI video hoặc dòng dịch không mở popup; selection ngoài giao diện video giữ hành vi chung.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp `overlay-template.js` → `dual-subtitles.js` → Dictation scripts và hợp đồng `LHN_OVERLAY_API`, `lhn-overlay-ready`, `lhn-dual-captions-updated`.
- `ctrl(title)` là API nội bộ; control cần dùng selector ổn định/ID vì `title` hiển thị được dịch theo ngôn ngữ cài đặt.
- Bộ dịch UI chỉ tác động nhãn/thuộc tính của overlay, không dịch tiêu đề video, nội dung trang hoặc caption. Caption/transcript vẫn theo font và màu phụ đề tùy chỉnh; chữ điều khiển Keepit dùng `--lhn-app-font-family`.
- Chỉ áp dụng gate selection cho vùng giao diện video của Keepit. Không thay đổi popup, dictionary, note composer hoặc shortcut trên trang thông thường.
- Với source Auto, ưu tiên mapping caption/audio track; không dùng English mặc định hoặc `isDefault` làm tiêu chí duy nhất.
- Bốn mode subtitle (song ngữ, nguồn, dịch, ẩn) và ba mode video (rạp, đọc, kết hợp) tiếp tục dùng trạng thái hiện có; các shortcut không chạy khi focus ở input/editable.
- `lhnYouTubeSettings` lưu cài đặt overlay; ngôn ngữ subtitle lấy từ `lhnStudyTranslationSettings`; ngôn ngữ giao diện lấy từ `lhnSettings`.
- Cache transcript tiếp tục dùng Map LRU trong trang và cache bền hiện có; giữ giới hạn, TTL, khóa và luồng `BILINGUAL_TRANSLATE`.

## 5. Kiểm tra và xác minh

- Static: `node --check` các JS liên quan; parse manifest; xác nhận bản dịch đủ EN/VI/KO, selector điều khiển ổn định, CSS cân bằng và `git diff --check`.
- Mock/source assertions: selection trong primary transcript được phép; dòng dịch/UI video bị loại; selection thông thường vẫn qua luồng hiện có. Kiểm tra storage change cập nhật nhãn video và Dictation mà không reset trạng thái panel.
- Browser: thử các mode, popup dịch/từ điển trên primary transcript, không popup trên dòng dịch/control, đổi ngôn ngữ khi overlay/Dictation đang mở và xác nhận generic page selection không đổi. Không xem static checks là browser test.
