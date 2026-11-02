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
- Theater + Large chỉ active với `.te-sidebar-hidden.size-l:not(.te-reading-mode):not(.te-dictation-active)`. Dictation xóa geometry Theater tạm; khôi phục controls chỉ nếu Large tự ẩn, không ghi đè lựa chọn ẩn thủ công. Bar fixed đáy, nền xuyên mờ/blur.
- Subtitle rộng tối đa 80% frame/80vw, bo 16px; giữ mặc định đen/40%. Tùy chọn chỉ hiện trong mode, không heading; swatch nền 32×18px như hai swatch phụ đề, cách thẻ trên 10px. Tay cầm `grab`; double-click phụ đề về Y mặc định.
- Y lưu theo tỷ lệ frame (`frame-v1`), migrate tọa độ viewport cũ một lần. Đo frame/panel/grip/bar khi đổi mode/cỡ, resize, video/caption, reset/kéo/phím; wrapper `display: contents` ngoài mode.
- Đổi mode/click transcript dưới `.te-sub-en`/`.yt-dual-item` bật suppression chung; re-arm khi rời cả hai vùng. Resume pause do hover, giữ pause thủ công/reason khác; đóng overlay xóa suppression.
- Reading giữ player và reset khi rời mode; brand dùng chung Dictation. Ambient switch bật Ambient 3; settings giữ padding, ẩn width hint, art trước hide-controls.
- `lhnYouTubeSettings` lưu overlay; ngôn ngữ subtitle/UI lấy từ `lhnStudyTranslationSettings`/`lhnSettings`.
- Cache transcript dùng Map LRU và cache bền; giữ giới hạn, TTL, khóa, `BILINGUAL_TRANSLATE`.

## 5. Kiểm tra và xác minh

- v3.4.970 passed: overlay JS syntax; manifest/version; CSS parse/assertions (matching 32×18px swatches, scoped 10px gap); docs 691 words; `git diff --check`.
- Giữ source assertions: selection primary được phép; dòng dịch/UI bị loại; selection trang thường và storage change giữ state.
- Browser QA pending: Theater/Large glass/settings/controls, drag/reset/colors, responsive/long captions, mode switching. Static checks không thay browser test.
