# Video (YouTube Dual Subtitles) — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

Module điều phối overlay YouTube và web-study trên cùng UI/player/API. Reader giữ quyền chọn main text; Dictation giữ scoring/luyện tập.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Thứ tự nạp các content modules. |
| [`js/video/overlay-template.js`](../../js/video/overlay-template.js) | `OVERLAY_HTML`, `OVERLAY_CSS` | Nội dung/style Shadow DOM. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `toggleWebStudyFromShortcut`, `openOverlay`, `attachWebMedia`, `loadCaptions` | YouTube controller và web adapter. |
| [`js/reader/bilingual-reader.js`](../../js/reader/bilingual-reader.js) | `LHN_READER_MAIN_SOURCE.getTextBlocks` | Getter các block Reader đã chọn. |
| [`js/reader/tts-engine.js`](../../js/reader/tts-engine.js) | `LHN_TTS.detectLanguage`, `play` | Dò ngôn ngữ và phát TTS. |
| [`js/shared/thumbnails.js`](../../js/shared/thumbnails.js) | `LHN_THUMBNAILS.loadSource` | Ảnh metadata và SVG fallback. |
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION` | Shared Dictation UI/engine cho YouTube và Web. |

## 3. Luồng chính

1. Manifest nạp Reader, template, video controller rồi Dictation. Shortcut lấy từ `LHN_SETTINGS`; YouTube giữ event cũ, trang thường dùng listener của video controller.
2. Web gọi getter Reader, tạo một cue cho mỗi câu, phát qua `LHN_TTS`; ảnh metadata trang được ưu tiên trước SVG fallback.
3. Dùng chung `openOverlay()`/Shadow DOM, transcript và player controls. Reader text là nguồn cue của Web subtitles; shared marking, queue/cache và `BILINGUAL_TRANSLATE` tạo secondary track theo cùng pipeline YouTube/Web learning. Dictation mở shared UI/engine với cue Reader. Translation lỗi được toast/log; ambient vẫn hiện và báo toast + console nếu chưa cấu hình.
4. YouTube `loadCaptions()` dùng cache, player API/timedtext, transcript panel/tracklist hoặc caption đang hiện; sau đó làm sạch và dịch theo cài đặt.
5. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; caption YouTube phát `lhn-dual-captions-updated`. Web cues không gọi tải/dịch caption YouTube.
6. Đóng overlay/đổi URL dừng TTS và dọn adapter; player thật được trả về vị trí gốc.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự `overlay-template.js` → `dual-subtitles.js` → Dictation và hợp đồng `LHN_OVERLAY_API`/events hiện có.
- Reader getter chỉ dùng `readerBlocks()`/`rawText()`; không đổi thuật toán chọn block hoặc tự tìm lại main text.
- Logic riêng của Web ở `dual-subtitles.js`; dùng chung overlay/player, không tạo UI song song. Reader getter và thuật toán chọn text không đổi; câu Reader vẫn là cue chính. `markWebReaderCues()` tái dùng `markSingleTrackCues()` để đánh dấu cue, còn shared lazy queue/cache/`BILINGUAL_TRANSLATE` tạo bản dịch thứ cấp như trên YouTube. Bilingual/translation mode theo cue và target-language settings; lỗi dịch giữ mode, ghi console và toast.
- Khi Web thumbnail thay video, `te-web-study-frame` bật clipping trên `.te-video-slot` (12px), rồi được gỡ khi detach; không bo riêng ảnh.
- Web-study bật class `te-web-study`; YouTube Dictation learning dùng class sẵn có `te-dictation-active`. CSS ẩn CC/subtitle-mode selector, mục `Cài đặt video > Tùy chọn phụ đề` và modal khi một trong hai class hoạt động. Khi thoát learning, class tương ứng được gỡ; YouTube xem thường giữ nguyên các điều khiển.
- Shortcut web bỏ qua YouTube/ô nhập; tôn trọng site-disabled và dọn adapter khi URL đổi.
- Giữ mọi mode/UI. Ambient chưa cấu hình báo toast + console, không ẩn nút. Web Dictation dùng cờ nguồn riêng và ngôn ngữ dò được/hint trang; không giả lập YouTube hay English.
- YouTube Auto vẫn ưu tiên mapping caption/audio track. Reader/TTS dùng language hint trang rồi dò theo cue.
- Giữ 4 subtitle/3 video modes, Reading S/M/L ratios 32/35%, 26/45%, 20/60%, Theater geometry, hover-pause và transcript cache LRU/TTL.
- Giữ `BILINGUAL_TRANSLATE`, `lhnYouTubeSettings`, `lhnStudyTranslationSettings`, `ctrl(title)` và selector/ID ổn định; UI dùng `--lhn-app-font-family`, caption giữ font/màu.

## 5. Kiểm tra và xác minh

- v3.5.10: source assertions xác nhận CSS ẩn CC/Tùy chọn phụ đề dưới `.te-web-study` và `.te-dictation-active`; 54 JS syntax, manifest/docs và `git diff --check` đạt. Browser QA chưa chạy.
- v3.5.6: VM translation-pipeline test xác nhận Reader cue vẫn là main text, Web gửi `BILINGUAL_TRANSLATE` và áp kết quả vào secondary, đổi target re-arm translation; 54 JS syntax, source assertions, manifest/docs và `git diff --check` đạt. Browser QA cho modes/target changes chưa chạy.
- v3.5.5: source assertions xác nhận clip trên `.te-video-slot` chỉ bật khi Web media attach và được gỡ khi detach; browser QA cần xác nhận góc render trên trang thật.
- v3.5.0: helper VM mock xác nhận sentence segmentation, Arabic/declared-Cyrillic hints, TTS cue progression và pause cancellation; 54 JS syntax, parse manifest, `git diff --check` và cấu trúc docs đạt. Không có test runner ở gốc repo.
- v3.5.1: Web Typing route VM mock, syntax/source checks; browser QA pending cho Alt+F web/YouTube, Reader cues, TTS/language, Typing/Speaking mic, web session URL, thumbnails/fallback, cleanup, warnings và video modes.
- Các kiểm tra lịch sử ở v3.4.971: 56 JS syntax, manifest/CSS/source checks và S/M/L/view-size mocks; không thay thế browser QA.
