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

1. Manifest nạp template/controller. `openOverlay()` tạo Shadow DOM và chuyển player vào slot; `closeOverlay()` hoặc đổi video khôi phục player bằng `detachVideo()`.
2. `loadCaptions()` lấy cue từ cache, YouTube API/timedtext, transcript panel/tracklist hoặc caption đang hiện; làm sạch rồi dịch qua `LHN_MESSAGING`.
3. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API` cho Dictation; caption mới phát `lhn-dual-captions-updated`.
4. Đổi `lhnSettings.language` làm mới nhãn overlay/Dictation; `lhnStudyTranslationSettings` vẫn quản lý ngôn ngữ subtitle.
5. Selection dịch/từ điển chỉ áp dụng cho `.te-sub-en`/`.yt-dual-item-en`; dòng dịch/UI không mở popup, selection ngoài overlay giữ nguyên.
6. Reading: toggle cạnh X đổi video/mini-audio; play/pause cùng player. Một `.te-dict-brand` dùng chung cho Reading/Dictation expanded.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp `overlay-template.js` → `dual-subtitles.js` → Dictation scripts và hợp đồng `LHN_OVERLAY_API`, `lhn-overlay-ready`, `lhn-dual-captions-updated`.
- `ctrl(title)` là API nội bộ; control cần dùng selector ổn định/ID vì `title` hiển thị được dịch theo ngôn ngữ cài đặt.
- Bộ dịch UI chỉ tác động nhãn/thuộc tính của overlay, không dịch tiêu đề video, nội dung trang hoặc caption. Caption/transcript vẫn theo font và màu phụ đề tùy chỉnh; chữ điều khiển Keepit dùng `--lhn-app-font-family`.
- Chỉ áp dụng gate selection cho vùng giao diện video của Keepit. Không thay đổi popup, dictionary, note composer hoặc shortcut trên trang thông thường.
- Với source Auto, ưu tiên mapping caption/audio track; không dùng English mặc định hoặc `isDefault` làm tiêu chí duy nhất.
- Giữ bốn subtitle mode và ba video mode; Reading S/M/L dùng video/giữa = 32/35%, 26/45%, 20/60%. Nhãn VI `videoMedium` là “Vừa”; shortcut bỏ qua input/editable.
- Reading toggle giữ player, reset khi rời mode. `.te-dict-brand` dùng chung Dictation, scale theo chiều rộng video. Ambient “Chế độ nghệ thuật” có switch trực tiếp trong menu; bật dùng Ambient 3.
- `lhnYouTubeSettings` lưu cài đặt overlay; ngôn ngữ subtitle lấy từ `lhnStudyTranslationSettings`; ngôn ngữ giao diện lấy từ `lhnSettings`.
- Cache transcript tiếp tục dùng Map LRU trong trang và cache bền hiện có; giữ giới hạn, TTL, khóa và luồng `BILINGUAL_TRANSLATE`.

## 5. Kiểm tra và xác minh

- Static/mock: `node --check` JS, parse manifest; kiểm tra EN/VI/KO, nhãn “Vừa”, Reading ratios, brand scale, ambient direct toggle/Ambient 3, toggle X/mini-play, CSS và `git diff --check`.
- Mock/source assertions: selection trong primary transcript được phép; dòng dịch/UI video bị loại; selection thông thường vẫn qua luồng hiện có. Kiểm tra storage change cập nhật nhãn video và Dictation mà không reset trạng thái panel.
- Browser QA: Reading toggle cạnh X, video/audio và play/pause, responsive/theme, reset khi rời mode; mode khác, popup selection, language changes, generic page selection. Static checks không thay browser test.
