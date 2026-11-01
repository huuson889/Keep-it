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
| [`js/content/content.js`](../../js/content/content.js) | handler shortcut YouTube | Phát custom event để bật/tắt Dual Sub hoặc Dictation. |
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `lhn-overlay-ready`, `LHN_DICTATION` | Consumer của API video; sở hữu logic Dictation riêng. |

## 3. Luồng chính

1. Trên `document_idle`, manifest nạp `overlay-template.js` trước `dual-subtitles.js`. `content.js` phát event shortcut; Dual Sub chỉ xử lý trên `youtube.com`. Alt+E mở Chế độ xem theo lựa chọn đã lưu trong ba mode Rạp/Đọc/Kết hợp (mặc định Kết hợp); nhấn lại khi đang ở Chế độ xem sẽ về YouTube. Alt+F vào/ra thẳng Chế độ học ↔ YouTube (mặc định Đánh máy, sau đó dùng lựa chọn Đánh máy/Luyện nói đã lưu), không khôi phục hay hiển thị mode xem trung gian.
2. `openOverlay()` dựng Shadow DOM từ template, tìm video YouTube hiện có và gắn video vào slot. Khi đóng, `detachVideo()` đưa video về vị trí cũ.
3. `loadCaptions()` thử cache trước; nếu chưa có thì lần lượt lấy từ Player API/timedtext, panel transcript trên trang, tracklist của watch page, rồi cuối cùng thu caption đang hiển thị trên video.
4. Với source Auto, ưu tiên caption liên kết với audio track mặc định qua `audioTracks`, `defaultAudioTrackIndex`, `audioTrackId` và `captionTrackIndices`; metadata thiếu thì dùng fallback cũ. Cue được làm sạch, hiển thị theo cửa sổ quanh thời điểm phát và dịch qua `LHN_MESSAGING` (`BILINGUAL_TRANSLATE`).
5. Overlay công bố `LHN_OVERLAY_API` qua `lhn-overlay-ready`; khi caption đổi, phát `lhn-dual-captions-updated`. Dictation lấy cue từ API này; chỉ chấp nhận caption track tiếng Anh.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự nạp trong manifest: template → Dual Sub → các script Dictation.
- Giới hạn logic overlay ở YouTube; `#yt-keepit-launcher` được chèn ngay sau `.ytp-fullscreen-button` bên trong `.ytp-right-controls`, hiển thị toàn bộ SVG logo Keepit 24×24 trong vùng ngang 48px/cao bằng controls và ẩn/hiện cùng nhóm controls. `MutationObserver` và `tick()` gắn lại nút nếu YouTube dựng lại nhóm này. Không đổi trạng thái hiển thị launcher theo `state.open`.
- Video thật được chuyển tạm vào overlay; đường đóng/đổi video phải dọn listener và khôi phục video qua `detachVideo()`.
- Không dùng `isDefault` hoặc ngôn ngữ English hardcode làm tiêu chí duy nhất cho source Auto. Ưu tiên mapping audio-caption; fallback chỉ dùng khi metadata không đủ.
- Giữ hợp đồng `LHN_OVERLAY_API`, `lhn-overlay-ready`, `lhn-dual-captions-updated` và `LHN_DICTATION`; thay đổi các tên/shape này ảnh hưởng tích hợp Dictation.
- Thiết lập ngôn ngữ lấy từ `lhnStudyTranslationSettings`; cài đặt chung lấy từ `lhnSettings` trong `browser.storage.local`.
- Kích thước sidebar transcript: Lớn 30%, Vừa 40%, Nhỏ 50% viewport-width, không áp min-width 400px. Ngoài `te-reading-mode`, font transcript 100% theo size lần lượt 16px/18px/20px; trong learning mode video, 100% = 18px. Cỡ EN/VI cuối cùng nhân với phần trăm đã lưu riêng cho từng ngôn ngữ.
- Transcript cache dùng `transcriptCache` Map hiện có làm lớp nhớ trong trang, đồng thời lưu bền qua cache helper `js/core/cache.js`/`browser.storage.local`. LRU tính theo video ID, tối đa 20 video; TTL trượt 7 ngày và cập nhật `lastUsedAt` khi đọc. Bản dịch tiếp tục qua `BILINGUAL_TRANSLATE` và cache bền dùng chung hiện có.
- `resegmentBySentence()` loại bỏ mọi đoạn `[...]` và dấu `>>` khỏi nguồn và bản dịch đã có trước khi tách; chuẩn hóa khoảng trắng/dấu câu, bỏ cue rỗng. Sau khi tách câu, ghép các dòng dưới 5 từ với câu kế nếu tổng không quá 30 từ/12 giây; câu cuối ngắn thử ghép với câu trước. Bản dịch đang chờ vẫn được dịch sau khi ghép; timestamp dùng cách tính hiện có.
- Bốn mode của overlay loại trừ nhau: overlay video thường (mọi mode icon inactive), `Luyện nói`, `Chép chính tả`, và `Chế độ đọc`. Icon `mic` 18×18 luôn hiện ngay trước icon `graduation-cap` 18×18; hai icon này active màu tím/`aria-pressed=true`. Không còn nút toolbar riêng cho `Chế độ đọc` hoặc `Bố cục`; trạng thái view hiển thị bằng icon menu chọn chế độ. Chọn mic/cap chuyển trực tiếp sang mode đó; chọn menu Rạp/Đọc/Kết hợp áp dụng mode tương ứng. Click lại icon learning mode đang active trở về overlay video thường (không đóng overlay). Alt+F là shortcut riêng để vào/ra thẳng Chế độ học/YouTube; lựa chọn learning mode gần nhất (Đánh máy/Luyện nói) được nhớ độc lập. Các nút toolbar vẫn chọn mode tương ứng. Hai mode switch bên trong Dictation đồng bộ với icon top; toggle đồng bộ tiến độ 18×18 nằm ngay sau `Đánh máy` và không phải learning mode riêng. Mục `Chế độ đọc` trong menu chọn chế độ chuyển qua lại với Dictation; CSS thu video về cột trái, đưa transcript vào vùng giữa và giữ control bar toàn chiều rộng phía dưới. Lựa chọn view gần nhất được lưu trong `lhnYouTubeSettings.preferredVideoMode` (mặc định `combined`); lựa chọn learning gần nhất được lưu riêng trong `preferredLearningMode` (mặc định `typing`). Alt+F thoát thẳng về YouTube và không khôi phục Chế độ xem; Alt+E lần kế tiếp mới mở lại view preference. Nút Audio dùng icon Lucide `volume-2` 18×18 và nằm ngay bên trái `Lặp lại câu`; nút toolbar đổi nhãn `Mở thanh bên ghi chú` và click sẽ toggle sidebar ghi chú trang; nút tím cài đặt bên trong overlay (`.te-floating-btn`) được ẩn. Launcher trang YouTube là nút riêng, nằm trong `.ytp-right-controls` ngay sau nút fullscreen.
- Nút `Chế độ phụ đề` dùng icon Lucide `closed-caption` 18×18 và mở popup rộng 170px với bốn lựa chọn: Song ngữ (nguồn + bản dịch), Chính (chỉ nguồn), Dịch (chỉ bản dịch) và Ẩn. Cùng một mode điều khiển `.te-sub-en` / `.te-sub-vi` bên dưới video và `.yt-dual-item-en` / `.yt-dual-item-vi` trong sidebar. Ẩn gỡ các dòng transcript sidebar hoàn toàn, gồm timestamp, và ẩn khung phụ đề dưới video; header/điều khiển sidebar vẫn dùng được. Popup đánh dấu lựa chọn và hiện số 1–4; khi overlay mở, phím 1/2/3/4 chọn lần lượt Song ngữ/Chính/Dịch/Ẩn. Shortcut không chạy khi focus ở input, textarea, select hoặc phần tử editable. Menu đóng khi chọn, bấm ngoài, nhấn Escape hoặc dùng shortcut; tùy chọn không thay đổi luồng tải/dịch caption.
- Ngay bên phải nút phụ đề có nút icon 18×18 mở menu `Chế độ rạp`, `Chế độ đọc`, `Chế độ kết hợp`; nhãn selector là `Chế độ xem`. Popup Chế độ xem rộng 214px; cả hai popup căn giữa theo nút mở và dùng màu nền/viền/bóng khớp popup cài đặt video ở theme sáng/tối. Các hàng Chế độ xem hiển thị Alt+1/Alt+2/Alt+3 lần lượt chọn Rạp/Đọc/Kết hợp; shortcut không kích hoạt khi focus ở input, textarea, select hoặc phần tử editable. Rạp bật overlay với sidebar video ẩn; Đọc bật `te-reading-mode`; Kết hợp bật overlay với sidebar video hiện. Chọn mục cập nhật icon/aria trạng thái menu và áp dụng mode tương ứng; preference `lhnYouTubeSettings.preferredVideoMode` được lưu cho cả ba lựa chọn. Popup đóng khi chọn mục, bấm ngoài hoặc nhấn Escape.
- Trong menu Cài đặt video, bỏ các mục `Ẩn bản dịch`, `Đánh dấu từ` (và popup minh họa), `Bộ sưu tập`, `Bộ dịch`. Các công tắc còn lại, gồm popup dịch trực tiếp, kết hợp câu và ẩn thanh điều khiển, vẫn được nối đúng.
- Trong `Tùy chọn phụ đề`, bỏ khối preview `Chế độ rạp` và đổi nhãn `Chế độ Rạp chiếu phim` thành `Phụ đề video`. Swatch và color picker mặc định cho phụ đề video/sidebar khớp màu chữ thực tế của từng theme; màu tùy chỉnh đã lưu tiếp tục được giữ. Header `Phụ đề video` không có icon hỏi. Khi đang ở chế độ Đọc hoặc Rạp, ẩn toàn bộ nhóm `Phụ đề thanh bên`, còn `Phụ đề video` vẫn hiển thị.
- Trong Cài đặt video, tiêu đề nhóm `Chế độ xem` đổi thành `Kích cỡ xem`; không đổi các mode Rạp/Đọc/Kết hợp của toolbar.
- Nhóm `Cài đặt chung` của `Tùy chọn phụ đề` (font, preset kích cỡ, độ đậm) áp dụng cho cả phụ đề video và sidebar. Chế độ Đọc có thiết lập Phụ đề video riêng, mặc định tương đương Reading v3.4.904: EN 18px / VI 16.2px, màu theo theme sáng #111827/#4b5563 và tối #e5e7eb/#9ca3af; cỡ chữ còn scale theo preset chung. Các counter/màu Phụ đề video khi đang đọc chỉnh riêng `readingSubtitle`, không ghi đè thiết lập video thường. `Kích cỡ xem` trong Reading điều khiển riêng khung transcript giữa và luôn căn giữa màn hình: Nhỏ 35vw (left 32.5vw), Vừa 45vw (left 27.5vw), Lớn 52vw (left 24vw); mặc định Vừa, không đổi kích cỡ bố cục video ở mode khác.
- Không thêm xử lý video riêng ngoài các class/mode hiện hành.

## 5. Kiểm tra và xác minh

- Static/mock v3.4.910: `node --check` toàn bộ JS; manifest JSON/version, CSS brace balance và `git diff --check` đạt. Assertions xác nhận nút dùng nhãn mới và click kích hoạt edge-toggle sidebar ghi chú. Browser-test chưa chạy.
- Trình duyệt: trên trang watch YouTube, mở/đóng overlay và xác nhận player hoạt động, được khôi phục đúng vị trí; thử Auto với nhiều audio/caption track và xác nhận source khớp audio mặc định; thử Dictation với caption tiếng Anh và kiểm tra trường hợp cue tải xong sau khi mở Dictation.
- Khi chỉnh đường tải caption, thử đường dự phòng transcript panel, watch-page tracklist và caption đang hiển thị. Kết quả trình duyệt chỉ được ghi là đã xác nhận sau khi thực sự chạy thử.
