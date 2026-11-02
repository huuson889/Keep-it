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
- Dịch UI chỉ đổi nhãn/thuộc tính overlay; caption giữ font/màu tùy chỉnh, UI Keepit dùng `--lhn-app-font-family`.
- Chỉ áp dụng gate selection cho vùng giao diện video của Keepit. Không thay đổi popup, dictionary, note composer hoặc shortcut trên trang thông thường.
- Với source Auto, ưu tiên mapping caption/audio track; không dùng English mặc định hoặc `isDefault` làm tiêu chí duy nhất.
- Bốn subtitle mode, ba video mode; Reading video/giữa S/M/L 32/35%, 26/45%, 20/60%. VI `videoMedium`: “Vừa”, `videoViewSize`: “Kích thước xem”; shortcut bỏ qua editable.
- `.te-control-play` là con trực tiếp của `.te-control-bar`; grid đối xứng giữ tâm nút chính giữa. `.te-ctrl-group` đầu vẫn là `primaryGroup` Dictation; `.te-yt-logo-box` được phép co bằng `flex`/`min-width: 0`.
- Theater + Large: `.te-sub-container` ôm nội dung, max 80vw, bo 4px; nền màu/opacity lưu ở `lhnYouTubeSettings` (mặc định đen/40%); tay cầm kéo dọc chỉ hiện khi hover.
- Đổi mode/click transcript dưới `.te-sub-en`/`.yt-dual-item` bật suppression chung; re-arm khi rời cả hai vùng. Resume pause do hover, giữ pause thủ công/reason khác; đóng overlay xóa suppression.
- Reading toggle giữ player và reset khi rời mode; brand dùng chung Dictation. Ambient switch bật Ambient 3. Settings giữ padding 4px 0, ẩn width hint, art trước hide-controls.
- `lhnYouTubeSettings` lưu cài đặt overlay; ngôn ngữ subtitle lấy từ `lhnStudyTranslationSettings`; ngôn ngữ giao diện lấy từ `lhnSettings`.
- Cache transcript tiếp tục dùng Map LRU trong trang và cache bền hiện có; giữ giới hạn, TTL, khóa và luồng `BILINGUAL_TRANSLATE`.

## 5. Kiểm tra và xác minh

- Static/mock đã chạy v3.4.966: `node --check` 56 JS, manifest JSON/version, CSS parse, mock default/migration/màu-opacity-vị trí/drag bounds-keyboard, markup 80vw/bo 4px và `git diff --check`.
- Mock/source assertions cần giữ: selection trong primary transcript được phép; dòng dịch/UI video bị loại; selection trang thường giữ luồng hiện có; storage change không reset state panel.
- Browser QA chưa chạy: Theater + Lớn trên YouTube, hover/drag, màu-opacity/reset và responsive; xác nhận mode khác/Reading không đổi. Static checks không thay browser test.
