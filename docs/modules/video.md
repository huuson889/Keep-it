# Video (YouTube source) — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; giao diện và điều phối dùng chung được mô tả trong [Overlay](overlay.md).

## 1. Mục đích và phạm vi

Phần Video sở hữu nguồn YouTube: tìm track, lấy transcript/caption, chuẩn hóa cue, cache theo video/ngôn ngữ và đồng bộ cue với playback. Overlay/controller sở hữu UI/lifecycle; Web Study là source riêng, không dùng YouTube transcript loader.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Thứ tự nạp; controller Overlay chạy sau Typing/Speaking engine trong Overlay/Study. |
| [`js/overlay/source/video.js`](../../js/overlay/source/video.js) | `loadCaptions`, `parseCaptions`, `onTimeUpdate` | YouTube tracks, transcript, caption cache, cue model và timing. |
| [`js/overlay/overlay-controller.js`](../../js/overlay/overlay-controller.js) | `tick`, `openOverlay`, `closeOverlay` | Lifecycle chung; chỉ phần YouTube-specific polling thuộc Video flow. |
| [`js/core/cache.js`](../../js/core/cache.js) | transcript cache APIs | Persistent cache dùng chung cho transcript YouTube. |
| [`js/background/background.js`](../../js/background/background.js) | transcript cache messages | Cầu tới cache/background khi source cần lưu hoặc đọc. |
| [`js/core/languages.js`](../../js/core/languages.js) | language helpers | Mã ngôn ngữ track và nhãn giao diện. |

## 3. Luồng chính

1. Manifest nạp `source/video.js` cùng các Overlay module; `overlay-controller.js` khởi tạo sau Dictation engine trong Overlay/Study.
2. Khi video YouTube thay đổi, controller cập nhật `videoId`, token và prefetch; source module tìm track/ transcript từ player API hoặc transcript panel.
3. Caption events/XML được giải mã, chuẩn hóa thời gian/câu và đánh dấu ngôn ngữ track. Nếu nguồn chính không khả dụng, live caption capture quan sát caption đang hiển thị.
4. Cue được cache theo video/track, nạp theo cửa sổ và chuyển thành caption model cho overlay. `onTimeUpdate` đồng bộ cue hiện hành với playback.
5. Overlay view áp dụng layout/CC modes và translation queue dùng chung; mở Web Study không truy cập transcript cache YouTube.

## 4. Hợp đồng và quy tắc cần giữ

- Trang video YouTube = `youtube.com`, `www.youtube.com` và `m.youtube.com` (`OVERLAY_YOUTUBE_HOST_RE`); URL tải phụ đề luôn là `www.youtube.com`. Nút mở Keepit trong player chỉ gắn khi có `.ytp-right-controls` (bản máy tính); bản mobile mở bằng phím tắt hoặc nút của app Android.
- Cache transcript YouTube tiếp tục tách khỏi persistent Web Study cue cache; khóa nguồn giữ video ID và track language.
- Giữ fallback giữa player API, transcript panel và live captions, cùng cleanup/cancel token khi video thay đổi.
- Cue time phải tăng hợp lệ; xử lý merge/resegment không làm nhảy vị trí transcript hoặc thay video timing.
- Track language và CC default policy được tiêu thụ bởi `view/cc-mode.js`; lựa chọn thủ công vẫn áp dụng cho video hiện tại.
- Không di chuyển UI/template vào Video source. Các selectors, events và `LHN_OVERLAY_API` thuộc shared Overlay contract.
- Khung video YouTube và thumbnail Web dùng cursor mặc định; click xóa text selection ở document/ShadowRoot rồi vẫn gọi hành vi phát/tạm dừng hiện có.

## 5. Kiểm tra và xác minh

- v3.5.30: targeted VM xác nhận click khung xóa selection ở document và ShadowRoot nhưng vẫn gọi play/pause/pulse; CSS assertions xác nhận cursor mặc định cho video/thumbnail. Browser QA chưa chạy.
- v3.5.25 VM xác nhận cùng mã ngôn ngữ cơ sở với giao diện chọn `primary`, khác/chưa rõ chọn `bilingual`, và manual override không bị ghi đè.
- v3.5.26 đã chạy: 60 JS syntax, manifest JSON/path/order, VM load theo thứ tự manifest, 310 source blocks giữ nguyên, chỉ chuẩn hóa trailing blank lines; template byte-for-byte; `git diff --check` đạt.
- Browser QA chưa chạy: xác nhận YouTube track selection, transcript fallback/cache, playback synchronization, source switching, CC/layout modes, shortcuts và Dictation.
