# Study — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; Study gồm Dictation/Writing và Shadowing/Speaking, dùng chung cues/session shell/utilities nhưng giữ behavior riêng theo activity.

## 1. Mục đích và phạm vi

Study luyện câu từ YouTube captions hoặc Reader Web cues trong Overlay hiện có. Typing và Speaking giữ progress/statistics theo mode; SpeechRecognition/MediaRecorder chỉ chạy trong Shadowing. Bản ghi âm chỉ tồn tại tạm trong runtime, không upload hoặc lưu lâu dài.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/overlay/study/dictation/dictation.js`](../../js/overlay/study/dictation/dictation.js) | `LHN_DICTATION.open` | Dictation entry, shared Study shell/session và Typing behavior. |
| [`js/overlay/study/shadowing/shadowing-activity.js`](../../js/overlay/study/shadowing/shadowing-activity.js) | `LHN_SHADOWING_ACTIVITY_FACTORY.create` | Speaking recognition, recording, replay, feedback và Escape flow. |
| [`js/overlay/study/shadowing/shadowing.js`](../../js/overlay/study/shadowing/shadowing.js) | `onShadowingControlClick` | Shadowing entry và Web TTS controls; practice ở Overlay. |
| [`js/overlay/study/shared/study-score.js`](../../js/overlay/study/shared/study-score.js) | `LHN_DICTATION_SCORE` | Shared tokenization, score, diff và prefix progress. |
| [`js/overlay/study/shared/learning-rules.js`](../../js/overlay/study/shared/learning-rules.js) | `LHN_DICTATION_RULES` | Shared hints, eligibility và error categories. |
| [`js/overlay/study/shared/session-index.js`](../../js/overlay/study/shared/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Provider-neutral session metadata dùng bởi Dashboard Dictation. |
| [`js/overlay/overlay-template.js`](../../js/overlay/overlay-template.js) | `LHN_OVERLAY_TEMPLATE.createStudyUi` | Static Study DOM structure and CSS; activity modules bind behavior. |
| [`js/overlay/overlay-controller.js`](../../js/overlay/overlay-controller.js) | `createDictationOverlayApi`, `beginDictationMode` | Overlay API, source/activity selection và bootstrap cuối. |

## 3. Luồng chính

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; YouTube dùng caption cues, Web dùng Reader sentence cues. Caption refresh đến qua `lhn-dual-captions-updated`.
2. `overlay-controller.js` mở Study panel hiện có và chọn Typing/Speaking. `LHN_OVERLAY_TEMPLATE.createStudyUi()` dựng markup; session engine gắn listeners và cập nhật nội dung động.
3. Typing chấm qua `LHN_DICTATION_SCORE`; chỉ 100% là pass. Enter chuyển câu sau pass; Esc reveal/reset, backtick play/pause và Ctrl replay.
4. Shadowing giao nhận diện và ghi/phát lại giọng người dùng cho `shadowing-activity.js`. Auto-record mặc định bật; recognition rearm sau `onend`, gộp interim/final text và chấm sau 1,5 giây im lặng. Manual mode giữ continuous recognition và full replay; pass từ 70% và không tự chuyển câu.
5. `dictation:<sourceId>` lưu progress, notes, translations, title và thống kê lỗi theo mode. Session index lưu source ID/URL YouTube hoặc Web, được dùng cả bởi Dashboard Dictation. Dashboard chưa có Shadowing route; practice vẫn ở Overlay.
6. Web TTS, translation, cue cache, thumbnails và language labels tiếp tục dùng modules hiện có. Quyền microphone do browser quản lý; thiếu MediaRecorder thì recognition vẫn có thể chạy nhưng không có own-recording replay.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ YouTube English-caption gate và Web detected/page language. Web tiếp tục dùng Reader cues, URL thật và virtual media hiện có.
- Scoring, tokenization, learning rules và session metadata nằm trong `study/shared/`; không nhân bản hoặc chuyển Reader/TTS/translation/cache vào Study.
- Giữ Overlay UI/selectors và inner Typing/Speaking switch. Shared session state/persistence/playback vẫn ở Dictation shell; tách dần mode-specific branches mà không đổi UX.
- Progress sync mặc định bật; nếu tắt, Typing/Speaking giữ snapshot riêng. Notes/translations dùng chung; wrong-word statistics tách theo mode.
- Bảo toàn Speaking one-shot/rearm, grace im lặng 1,5 giây, recording replay cutoff, unsupported-recognition fallback và retry/feedback. Bảo toàn Typing pass 100%, hints, punctuation normalization và missing-word marks.
- Giữ learning columns (25:50:25 mặc định, bounds/persistence), repeat count mỗi mode, translation preference và video/player restoration; không resize video thật.

## 5. Kiểm tra và xác minh

- v3.5.31: `node --check` đạt cho 61 JavaScript files; 44 manifest script paths tồn tại; focused VM nạp Study modules theo thứ tự và xác nhận Speaking tier/status delegation; mock DOM xác nhận Typing/Speaking/shared refs; CSS gốc được giữ trong `overlay-template.js`; `git diff --check` đạt. Browser QA chưa chạy.
- Lặp static checks với Node, kiểm tra manifest paths/order và nạp Study scripts trong cùng VM context.
- Browser QA còn cần xác nhận Web/YouTube cues, Typing keyboard flow, microphone permission/recognition, auto/manual recording, replay, progress/statistics persistence, language switching, responsive layout và cleanup trên Chromium/Firefox/Edge. Static/mock không thay thế kiểm tra browser.
