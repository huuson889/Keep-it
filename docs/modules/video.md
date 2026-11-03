# Video (YouTube Dual Subtitles) — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code là nguồn sự thật.

## 1. Mục đích và phạm vi

Module điều phối overlay YouTube và Web-study trên cùng UI/player/API. Web lấy câu nguồn từ Reader; Dictation dùng chung UI và engine.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Thứ tự nạp content modules. |
| [`js/video/overlay-template.js`](../../js/video/overlay-template.js) | `OVERLAY_HTML`, `OVERLAY_CSS` | Shadow DOM và styles. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `handleVideoOverlayShortcut`, `runSharedVideoShortcut`, `prepareWebStudyForShortcut`, `openOverlay` | Shortcut dispatcher, YouTube controller, Web adapter. |
| [`js/reader/bilingual-reader.js`](../../js/reader/bilingual-reader.js) | `LHN_READER_MAIN_SOURCE.getTextBlocks` | Reader main-text getter. |
| [`js/reader/tts-engine.js`](../../js/reader/tts-engine.js) | `LHN_TTS.detectLanguage`, `play` | Dò ngôn ngữ và TTS. |
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION` | Dictation UI/engine dùng chung. |
| [`js/shared/thumbnails.js`](../../js/shared/thumbnails.js) | `LHN_THUMBNAILS.loadSource` | Thumbnail metadata và fallback. |

## 3. Luồng chính

1. Manifest nạp Reader, template, video controller rồi Dictation. Content dispatcher gửi Alt+E/Alt+F đến `runSharedVideoShortcut()` để mở cùng overlay trên YouTube hoặc Web.
2. `handleVideoOverlayShortcut()` điều phối phím khi overlay mở. Alt+1–3, 1–4, tốc độ và Escape dùng chung; Space/K và ←/J/→/L để YouTube xử lý native, còn Web virtual media chuyển tới overlay controls/cue navigation.
3. Web gọi Reader getter, tạo cue theo câu, phát bằng `LHN_TTS`; thumbnail trang dùng cho frame/Ambient. YouTube dùng player/caption discovery hiện có và video frame cho Ambient.
4. Web subtitles giữ Reader text làm track chính; shared marking, queue/cache và `BILINGUAL_TRANSLATE` tạo track dịch thứ cấp. Dictation dùng chung engine với cue của từng nguồn.
5. Mở Web-study gửi Reader command `stop-reading`; khi Reader bắt đầu phát, `lhn-bilingual-reader-started` đóng Web overlay trước TTS. Đóng overlay hoặc đổi URL dừng media và dọn adapter.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ thứ tự `overlay-template.js` → `dual-subtitles.js` → Dictation, cùng `LHN_OVERLAY_API` và event contracts.
- Reader text chỉ lấy qua `readerBlocks()`/`rawText()`; không thay thuật toán chọn block. Web không gọi YouTube caption loader.
- Dùng `BILINGUAL_TRANSLATE`, marking và queue/cache chung; giữ bilingual/translation modes theo cue và target-language settings. Lỗi dịch ghi console và toast, không đổi mode.
- Dùng chung overlay/player và không tạo Web keydown listener riêng. Web virtual media kiểm tra generation sau `timeupdate` trước auto-advance, để seek/pause đồng bộ của Dictation không bị stale cue ghi đè; phím native YouTube không bị chặn.
- Web-study TTS cập nhật `playbackRate` trực tiếp trên Google audio đang phát; Pause/Play giữ nguyên audio hoặc browser utterance và vị trí chunk. Đổi tốc độ với browser voice khởi động lại từ boundary gần nhất; seek/đóng overlay huỷ run cũ. Callback tiến độ chunk trong `LHN_TTS` là tuỳ chọn và không đổi các consumer khác.
- Web-study và Bilingual Reader không chạy đồng thời: Web gửi `stop-reading`; Reader phát `lhn-bilingual-reader-started` sau khi xác nhận cue hợp lệ, trước TTS. Không đổi Reader selection algorithm.
- Video thật và thumbnail Web dùng chung CSS selector căn chỉnh trong `.te-video-slot`; clipping chung nằm ở `.te-video-slot`/`.te-video-frame`, không bật theo source class. Web adapter chỉ thay video bằng thumbnail và dọn ảnh khi detach; Ambient Web lấy thumbnail tĩnh, YouTube giữ video frame. Theater + Large và Reading + Ambient dùng chung nền/blur/viền/bóng cho control bar; geometry `fixed` chỉ áp dụng cho Theater + Large.
- Transcript focus dùng chung cho Normal/Reading: active cue mặc định ở `40vh`; scroll tay lưu tỉ lệ dọc đang chọn và cue tiếp theo bám theo vị trí đó. Padding cuộn đầu/cuối đủ để cue đầu/cuối cũng tới focus line; tuỳ chỉnh chỉ tồn tại trong runtime trang. Theater và Dictation giữ hành vi cũ.
- Chỉ `.te-dictation-active` ẩn CC/subtitle controls; Web view và YouTube xem thường giữ controls. Giữ `keepitSiteDisabled` gate và settings keys hiện có.
- Giữ bốn subtitle modes, ba video modes, Reading S/M/L ratios 32/35%, 26/45%, 20/60%, Theater geometry và transcript cache LRU/TTL.

## 5. Kiểm tra và xác minh

- Regression VM đã chạy: Dictation repeat 1x/2x phát lại cùng Web cue, luồng không Dictation vẫn auto-advance, còn bản thử không có guard tái hiện việc nhảy cue; v3.5.19 kiểm tra Web Google audio đổi tốc độ tức thời, pause/resume giữ cùng audio/currentTime, browser speech pause/resume và restart theo boundary, pause giữa chunks, seek khi pause; `LHN_TTS` callbacks được kiểm tra trên Google và browser multi-chunk paths. `node --check` 54 JS, manifest JSON/version assertions, docs assertions và `git diff --check` đạt; Browser QA chưa chạy.
- v3.5.20: CSS parse/source assertions xác nhận rule nền/blur/viền/bóng dùng chung cho Reading + Ambient ở cả theme sáng/tối; geometry fixed chỉ còn ở Theater + Large. Browser QA trực quan chưa chạy.
- v3.5.21: VM focus checks xác nhận Normal/Reading căn cue ở 50vh, cue đầu/cuối tới được focus line, scroll tay giữ tỉ lệ cho cue tiếp theo; Theater/Dictation không dùng logic mới. Browser QA trực quan chưa chạy.
- v3.5.22: Default focus đổi từ 50vh thành 40vh theo yêu cầu; test chưa chạy theo yêu cầu.
- Reader test paths được tài liệu tham chiếu (`tests/reader-speaker-placement.test.cjs`, `tests/reader-country-flags.test.cjs`) không tồn tại trong repo nên `node --test` không chạy được.
- Browser QA chưa chạy: thử Alt+E/F, Alt+1–3, 1–4, Space/K, arrows/J/L, </>, Escape trên Web và YouTube; xác nhận mode/controls, Reader exclusivity, thumbnail/Ambient và cleanup.
