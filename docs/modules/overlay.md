# Overlay — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; module này tổ chức Overlay chung Video/Web, Study activities và View settings.

## 1. Mục đích và phạm vi

Overlay cung cấp một UI cho YouTube và Web Study. `overlay-controller.js` điều phối source/activity; `source/` cung cấp cues/media, `study/` tổ chức Dictation/Writing, Shadowing/Speaking và helpers chung, còn `view/` quản lý layout/caption. Reader, TTS, translation và cache vẫn dùng các module ngoài Overlay hiện có.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/overlay/overlay-controller.js`](../../js/overlay/overlay-controller.js) | `openOverlay`, `createDictationOverlayApi`, `beginDictationMode` | Lifecycle, chọn source/activity, bootstrap cuối. |
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

1. Manifest nạp template, source/view, Study shared helpers và activity modules sau Core, Reader/content helpers; controller chạy cuối để cài listeners/bootstrap. `site-icons.js` được nạp trước Overlay và cấp favicon theo origin.
2. Controller tạo launcher/overlay và chọn YouTube hoặc Web. Web gọi Reader `getTextBlocks({ forceRefresh:true })`; YouTube lấy captions từ player/transcript source hoặc live-caption fallback. Khi Web media gắn vào frame, page thumbnail (hoặc Lo-fi Room fallback) được phủ bởi visualizer UI.
3. Source cung cấp cues qua `LHN_OVERLAY_API`. Controller mở Study theo activity; Dictation giữ shared session shell và Typing, còn Shadowing activity nhận recognition, recording, replay và feedback riêng.
4. Web TTS tiếp tục dùng `LHN_TTS`; translation dùng `BILINGUAL_TRANSLATE` và cache hiện có. View quản lý layout/CC mode; không tạo engine TTS, translation hay cue cache thứ hai.
5. Đóng Overlay dọn media/listeners theo source, giữ cache hiện có và duy trì mutual exclusion giữa Reader với Web Study.

## 4. Hợp đồng và quy tắc cần giữ

- Các file là classic content scripts trong cùng isolated world; tránh trùng top-level lexical names và chỉ để controller bootstrap sau module definitions.
- Study markup/CSS thuộc `overlay-template.js`; selectors, labels, event contracts và hành vi UI phải giữ nguyên khi tách activity behavior.
- Giữ cấu trúc ngoài `js/overlay/{source,study,view}`; không tạo top-level `js/study/` hoặc `study-controller.js`.
- Dictation và Shadowing là activities riêng; `study/shared/` chỉ chứa scoring, learning rules, session metadata và behavior thật sự dùng chung. Một số lifecycle/result branches hiện vẫn nằm trong Dictation session shell; cần tách tiếp mà không đổi UX.
- Web cues tái sử dụng Reader/cache/TTS/translation/thumbnail helpers. Favicon Web/YouTube dùng `LHN_SITE_ICONS`, slot 22×22px và globe fallback. Thumbnail visualizer giữ frame/playback, dùng motion Breathing/Pan/Tilt/Static (0,2×–3,0×; không Pulse; biên độ giảm 50%), bốn waveform tham chiếu và bảy hiệu ứng random riêng mỗi 30–180 giây với transition mượt; blur ngẫu nhiên 0–10px; bokeh dùng alpha màu glow và radius 2× theo tham chiếu, fade mật độ mượt. YouTube transcript cache/timing thuộc Video source.
- Dashboard hiện có Dictation sessions/statistics; không có Shadowing practice route. Nếu bổ sung sau, Shadowing Dashboard chỉ dành cho sessions/statistics; practice vẫn ở Overlay.

## 5. Kiểm tra và xác minh

- v3.5.40: `node --check` đạt 61 JS files; 54 manifest paths tồn tại; VM xác nhận giảm nửa biên độ, giữ speed/transition; `git diff --check` đạt. Chưa browser QA.
- Static checks có thể lặp bằng Node, parse `manifest.json`, kiểm tra mọi script path và nạp Study scripts theo manifest order trong một VM context.
- Browser QA cần xác nhận YouTube/Web switching, cues, TTS, Typing, Shadowing recognition/record/replay, Reader mutual exclusion, shortcuts, cleanup và layout. Static/mock checks không thay thế extension/browser test.
