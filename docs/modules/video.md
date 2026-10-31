# Video (YouTube Dual Subtitles) — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Mô tả overlay Dual Subtitles trên YouTube: gắn player hiện có vào overlay, tải/chọn caption track, dựng cue và dịch phụ đề. Dictation là module riêng; trang này chỉ mô tả điểm tích hợp với video, không mô tả logic luyện tập/chấm điểm của Dictation.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Nạp template trước `dual-subtitles.js`, rồi tới các file Dictation; nạp CSS video ở `document_idle`. |
| [`js/video/overlay-template.js`](../../js/video/overlay-template.js) | `OVERLAY_CSS`, `OVERLAY_HTML` | Khai báo giao diện và CSS được gắn vào Shadow DOM. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | YouTube host guard; `openOverlay`, `loadCaptions` | Điều phối overlay, video, caption, cài đặt, dịch và API cho Dictation. |
| [`css/content/video.css`](../../css/content/video.css) | `#yt-keepit-launcher` | Kiểu nút mở overlay; phần giao diện overlay chính nằm trong `OVERLAY_CSS`. |
| [`css/content/content.css`](../../css/content/content.css) | `html.lhn-video-overlay-open` | Khi overlay mở, ẩn body trang YouTube tức thì và không transition; host đặt ngoài body được nâng lên z-index cao nhất để nội dung trang không lóe qua. |
| [`js/content/content.js`](../../js/content/content.js) | handler shortcut YouTube | Phát custom event để bật/tắt Dual Sub hoặc Dictation. |
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `lhn-overlay-ready`, `LHN_DICTATION` | Consumer của API video; sở hữu logic Dictation riêng. |

## 3. Luồng chính

1. Trên `document_idle`, manifest nạp `overlay-template.js` trước `dual-subtitles.js`. `content.js` phát event shortcut; Dual Sub chỉ xử lý trên `youtube.com`.
2. `openOverlay()` dựng Shadow DOM trong host gắn trực tiếp vào `documentElement` (ngoài `body`), thêm `lhn-video-overlay-open` trước khi hiện host, rồi tìm video YouTube hiện có và gắn video vào slot. CSS ẩn `body` ngay lập tức, không fade/transition; MutationObserver bảo đảm class cách ly vẫn còn qua các cập nhật class của YouTube. Khi đóng, ngắt observer/bỏ class và `detachVideo()` đưa video về vị trí cũ.
3. `loadCaptions()` thử cache trước; nếu chưa có thì lần lượt lấy từ Player API/timedtext, panel transcript trên trang, tracklist của watch page, rồi cuối cùng thu caption đang hiển thị trên video.
4. Với source Auto, ưu tiên caption liên kết với audio track mặc định qua `audioTracks`, `defaultAudioTrackIndex`, `audioTrackId` và `captionTrackIndices`; metadata thiếu thì dùng fallback cũ. Cue được làm sạch, hiển thị theo cửa sổ quanh thời điểm phát và dịch qua `LHN_MESSAGING` (`BILINGUAL_TRANSLATE`).
5. Overlay công bố `LHN_OVERLAY_API` qua `lhn-overlay-ready`; khi caption đổi, phát `lhn-dual-captions-updated`. Dictation lấy cue từ API này; chỉ chấp nhận caption track tiếng Anh.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp trong manifest: template → Dual Sub → các script Dictation.
- Giới hạn logic overlay ở YouTube; `#yt-keepit-launcher` được tạo/ẩn theo trang watch. Khi mở, giữ host overlay ngoài `body`, ở z-index cao nhất; class `lhn-video-overlay-open` được thêm trước khi paint để ẩn body không transition. Ngắt observer và gỡ class khi đóng để trả nguyên trang.
- Video thật được chuyển tạm vào overlay; đường đóng/đổi video phải dọn listener và khôi phục video qua `detachVideo()`.
- Không dùng `isDefault` hoặc ngôn ngữ English hardcode làm tiêu chí duy nhất cho source Auto. Ưu tiên mapping audio-caption; fallback chỉ dùng khi metadata không đủ.
- Giữ hợp đồng `LHN_OVERLAY_API`, `lhn-overlay-ready`, `lhn-dual-captions-updated` và `LHN_DICTATION`; thay đổi các tên/shape này ảnh hưởng tích hợp Dictation.
- Thiết lập ngôn ngữ lấy từ `lhnStudyTranslationSettings`; cài đặt chung lấy từ `lhnSettings` trong `browser.storage.local`.

## 5. Kiểm tra và xác minh

- Static: `node --check js/video/overlay-template.js && node --check js/video/dual-subtitles.js`; `node --test tests/video-overlay-isolation.test.cjs` khóa contract ẩn giao diện YouTube phía sau và thứ tự mở/đóng; sau sửa, chạy thêm `git diff --check`.
- Trình duyệt: trên trang watch YouTube, mở/đóng overlay và xác nhận player hoạt động, được khôi phục đúng vị trí; thử Auto với nhiều audio/caption track và xác nhận source khớp audio mặc định; thử Dictation với caption tiếng Anh và kiểm tra trường hợp cue tải xong sau khi mở Dictation.
- Khi chỉnh đường tải caption, thử đường dự phòng transcript panel, watch-page tracklist và caption đang hiển thị. Kết quả trình duyệt chỉ được ghi là đã xác nhận sau khi thực sự chạy thử.
