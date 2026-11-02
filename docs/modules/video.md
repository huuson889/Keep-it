# Video (YouTube Dual Subtitles) — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

Module quản lý overlay phụ đề YouTube, transcript và API cho Dictation. UI dùng Shadow DOM; logic luyện tập thuộc Dictation.

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
- Theater + Large chỉ bật với `.te-sidebar-hidden.size-l:not(.te-reading-mode)`: bar fixed đáy viewport; phụ đề giới hạn `min(80vw, frameWidth)` và vùng trống trước bar. Vị trí lưu theo tỷ lệ frame (`frame-v1`), chuyển dữ liệu viewport cũ một lần. Đo rect frame/panel/grip/bar khi đổi mode/cỡ, resize, video/caption, restore/reset và kéo/phím. Ngoài mode, wrapper dùng `display: contents`.
- Nền ôm nội dung, bo 4px; màu/opacity lưu trong `lhnYouTubeSettings` (đen/40% mặc định); tay cầm kéo dọc chỉ hiện khi hover.
- Đổi mode/click transcript dưới `.te-sub-en`/`.yt-dual-item` bật suppression chung; re-arm khi rời cả hai vùng. Resume pause do hover, giữ pause thủ công/reason khác; đóng overlay xóa suppression.
- Reading toggle giữ player và reset khi rời mode; brand dùng chung Dictation. Ambient switch bật Ambient 3. Settings giữ padding 4px 0, ẩn width hint, art trước hide-controls.
- `lhnYouTubeSettings` lưu cài đặt overlay; ngôn ngữ subtitle lấy từ `lhnStudyTranslationSettings`; ngôn ngữ giao diện lấy từ `lhnSettings`.
- Cache transcript tiếp tục dùng Map LRU trong trang và cache bền hiện có; giữ giới hạn, TTL, khóa và luồng `BILINGUAL_TRANSLATE`.

## 5. Kiểm tra và xác minh

- v3.4.967 đã chạy: `node --check` 56 JS, manifest JSON/version, geometry/bounds/migration/scope mocks, CSS block structure, `git diff --check`; docs 696 từ.
- Giữ mock/source assertions: selection trong primary transcript được phép; dòng dịch/UI bị loại; selection trang thường và storage change giữ luồng/state.
- Browser QA chưa chạy: YouTube Theater + Large, drag/reset/colors, responsive/long captions, mode switching và xác nhận Reading/learning không đổi. Static checks không thay browser test.
