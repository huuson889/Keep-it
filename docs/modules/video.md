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
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION` | Tích hợp Dictation trên YouTube. |

## 3. Luồng chính

1. Manifest nạp Reader, template, video controller rồi Dictation. Shortcut lấy từ `LHN_SETTINGS`; YouTube giữ event cũ, trang thường dùng listener của video controller.
2. Web gọi getter Reader, tạo một cue cho mỗi câu, phát qua `LHN_TTS`; ảnh metadata trang được ưu tiên trước SVG fallback.
3. Dùng chung `openOverlay()`/Shadow DOM, transcript và player controls. Chỉ Reader text; mode dịch, Dictation và ambient chưa cấu hình vẫn hiện, báo toast + console khi chọn.
4. YouTube `loadCaptions()` dùng cache, player API/timedtext, transcript panel/tracklist hoặc caption đang hiện; sau đó làm sạch và dịch theo cài đặt.
5. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; caption YouTube phát `lhn-dual-captions-updated`. Web cues không gọi tải/dịch caption YouTube.
6. Đóng overlay/đổi URL dừng TTS và dọn adapter; player thật được trả về vị trí gốc.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự `overlay-template.js` → `dual-subtitles.js` → Dictation và hợp đồng `LHN_OVERLAY_API`/events hiện có.
- Reader getter chỉ dùng `readerBlocks()`/`rawText()`; không đổi thuật toán chọn block hoặc tự tìm lại main text.
- Web-specific logic ở `dual-subtitles.js`; dùng chung overlay/player, không tạo UI song song. Cue giữ nguyên câu Reader, không tự dịch.
- Shortcut web bỏ qua YouTube/ô nhập; tôn trọng site-disabled và dọn adapter khi URL đổi.
- Giữ mọi mode/UI. Mode chưa cấu hình báo toast + console, không ẩn nút; không giả lập English để vượt Dictation gate.
- YouTube Auto vẫn ưu tiên mapping caption/audio track. Reader/TTS dùng language hint trang rồi dò theo cue.
- Giữ 4 subtitle/3 video modes, Reading S/M/L ratios 32/35%, 26/45%, 20/60%, Theater geometry, hover-pause và transcript cache LRU/TTL.
- Giữ `BILINGUAL_TRANSLATE`, `lhnYouTubeSettings`, `lhnStudyTranslationSettings`, `ctrl(title)` và selector/ID ổn định; UI dùng `--lhn-app-font-family`, caption giữ font/màu.

## 5. Kiểm tra và xác minh

- v3.5.0: helper VM mock xác nhận sentence segmentation, Arabic/declared-Cyrillic language hints, TTS cue progression và pause cancellation; 54 JS syntax, parse manifest, `git diff --check` và kiểm tra cấu trúc docs đạt. Không có test runner ở gốc repo.
- Browser QA còn pending: Alt+F web/YouTube, reader cues một câu mỗi cue, TTS nhiều ngôn ngữ/voice modes, page thumbnail và SVG fallback, close/navigation cleanup, toast/log cho mode chưa cấu hình, cùng Theater/Reading/Combined và subtitle modes.
- Các kiểm tra lịch sử ở v3.4.971: 56 JS syntax, manifest/CSS/source checks và S/M/L/view-size mocks; không thay thế browser QA.
