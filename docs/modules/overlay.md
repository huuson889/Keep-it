# Overlay — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; module này tổ chức Overlay chung Video/Web, Study activities và View settings.

## 1. Mục đích và phạm vi

Overlay cung cấp UI chung cho YouTube và Web Study. `overlay-controller.js` điều phối source/activity; `source/` giữ cues/media, `study/` giữ activities/helpers, `view/` quản lý layout/caption. Reader, TTS, translation và cache vẫn thuộc các module hiện có ngoài Overlay.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/overlay/overlay-controller.js`](../../js/overlay/overlay-controller.js) | `openOverlay`, `createDictationOverlayApi`, `LHN_WEB_TTS_RATE_ACTIVE`, `LHN_WEB_TTS_DICTATION_MODE` | Lifecycle, rate Web TTS và bootstrap cuối. |
| [`js/overlay/overlay-template.js`](../../js/overlay/overlay-template.js) | `OVERLAY_HTML`, `OVERLAY_CSS`, `LHN_OVERLAY_TEMPLATE.createStudyUi` | Shadow DOM markup/CSS và Study UI structure. |
| [`js/shared/site-icons.js`](../../js/shared/site-icons.js) | `LHN_SITE_ICONS.load` | Nạp favicon theo origin cho title bar Web/YouTube. |
| [`js/overlay/source/video.js`](../../js/overlay/source/video.js) | `loadCaptions`, `onTimeUpdate`, `parseCaptions` | YouTube captions, transcript cache và cue timing. |
| [`js/overlay/source/web.js`](../../js/overlay/source/web.js) | `prepareWebStudy`, `createWebTtsMedia`, `attachWebMedia` | Reader cues, Web virtual media và thumbnail visualizer trong frame hiện có. |
| [`js/overlay/study/dictation/dictation.js`](../../js/overlay/study/dictation/dictation.js) | `LHN_DICTATION.open` | Dictation entry, shared Study shell/session và Typing behavior. |
| [`js/overlay/study/shadowing/shadowing-activity.js`](../../js/overlay/study/shadowing/shadowing-activity.js), [`js/overlay/study/shadowing/shadowing.js`](../../js/overlay/study/shadowing/shadowing.js) | `LHN_SHADOWING_ACTIVITY_FACTORY`, `onShadowingControlClick` | Speaking recognition/recording/feedback và Shadowing entry/Web TTS controls. |
| [`js/overlay/study/shared/study-score.js`](../../js/overlay/study/shared/study-score.js), [`js/overlay/study/shared/learning-rules.js`](../../js/overlay/study/shared/learning-rules.js) | `LHN_DICTATION_SCORE`, `LHN_DICTATION_RULES` | Scoring/tokenization và learning rules dùng chung. |
| [`js/overlay/study/shared/session-index.js`](../../js/overlay/study/shared/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Session metadata dùng bởi Overlay và Dashboard Dictation. |
| [`js/overlay/view/layout-mode.js`](../../js/overlay/view/layout-mode.js), [`js/overlay/view/cc-mode.js`](../../js/overlay/view/cc-mode.js) | `applyVideoDisplayMode`, `setSubtitleDisplayMode` | Theater/Reading/Combined, CC modes và translation queue. |

## 3. Luồng chính

1. Manifest nạp template, source/view và Study modules sau Core/Reader; controller bootstrap cuối. `site-icons.js` cung cấp favicon theo origin.
2. Controller tạo launcher/overlay và chọn YouTube hoặc Web. Web gọi Reader `getTextBlocks({ forceRefresh:true })`; YouTube lấy captions từ player/transcript source hoặc live-caption fallback. Khi Web media gắn vào frame, page thumbnail (hoặc Lo-fi Room fallback) được phủ bởi visualizer UI.
3. `LHN_OVERLAY_API` cung cấp cues; controller mở activity. Dictation giữ shared shell/Typing; Shadowing nhận recognition, recording, replay và feedback.
4. Web TTS dùng `LHN_TTS` và `LHN_READER_SPEECH_RATE`; translation dùng `BILINGUAL_TRANSLATE` và cache hiện có. View quản lý layout/CC mode; không tạo engine TTS, translation hay cue cache thứ hai.
5. Đóng Overlay dọn media/listeners theo source, giữ cache hiện có và duy trì mutual exclusion giữa Reader với Web Study.

## 4. Hợp đồng và quy tắc cần giữ

- Các file là classic content scripts trong cùng isolated world; tránh trùng top-level lexical names và chỉ để controller bootstrap sau module definitions.
- Study markup/CSS thuộc `overlay-template.js`; selectors, labels, event contracts và hành vi UI phải giữ nguyên khi tách activity behavior.
- Giữ cấu trúc ngoài `js/overlay/{source,study,view}`; không tạo top-level `js/study/` hoặc `study-controller.js`.
- Dictation và Shadowing là activities riêng; `study/shared/` chỉ chứa scoring, learning rules, session metadata và behavior thật sự dùng chung. Một số lifecycle/result branches hiện vẫn nằm trong Dictation session shell; cần tách tiếp mà không đổi UX.
- Web tái sử dụng Reader/cache/TTS/translation/thumbnail. Web TTS gọi rate API của Reader (global/per-language, 0.5×–3×); YouTube playback vẫn riêng (0.5×–2×); Flashcard/Dictation rate vẫn riêng (slow replay 0,6×); TTS engine không đổi. Favicon dùng `LHN_SITE_ICONS` (22×22px, globe fallback). Visualizer giữ frame/playback; Breathing/Pan/Tilt (0,2×–3,0×; bỏ Static/Pulse; biên độ giảm 50%), bốn waveform, bảy hiệu ứng độc lập mỗi 30–180 giây, blur 0–10px, bokeh glow alpha/radius 2× và fade mượt. Transcript cache/timing thuộc Video source.
- Dashboard hiện có Dictation sessions/statistics; không có Shadowing practice route. Nếu bổ sung sau, Shadowing Dashboard chỉ dành cho sessions/statistics; practice vẫn ở Overlay.

## 5. Kiểm tra và xác minh

- v3.5.42: Reader/Web/Overlay VM checks đạt cho shared rate, cận Web 0.5×–3×, Dictation rate riêng và YouTube 0.5×–2×; syntax/manifest checks đạt. Browser QA chưa chạy.
- v3.5.41: `node --check` đạt 61 JS; 54 manifest paths; VM xác nhận pool bỏ Static, mode/tốc độ khác giữ nguyên; `git diff --check` đạt. Chưa browser QA.
- Static checks có thể lặp bằng Node, parse `manifest.json`, kiểm tra mọi script path và nạp Study scripts theo manifest order trong một VM context.
- Browser QA cần xác nhận YouTube/Web switching, cues, TTS, Typing, Shadowing recognition/record/replay, Reader mutual exclusion, shortcuts, cleanup và layout. Static/mock checks không thay thế extension/browser test.
