# Study — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; Study gồm Dictation/Writing và Shadowing/Speaking, dùng chung cues/session shell/utilities nhưng giữ behavior riêng theo activity.

## 1. Mục đích và phạm vi

Study luyện câu từ YouTube captions hoặc Reader Web cues trong Overlay hiện có. Typing và Speaking giữ progress/statistics theo mode; SpeechRecognition/MediaRecorder chỉ chạy trong Shadowing. Bản ghi âm chỉ tồn tại tạm trong runtime, không upload hoặc lưu lâu dài.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/overlay/unified/unified-ui.js`](../../js/overlay/unified/unified-ui.js) | tab `speak` / `write` | Nói: ghi âm, nhận dạng giọng, chấm, phát lại. Chép: chấm, gợi ý, lưu `dictation:<sourceId>` (`progressByMode`, `unifiedScores`, `lessonNote`, `notes`). Panel Study cũ (`study/dictation/`, `study/shadowing/`, `createStudyUi`) đã xoá ở v3.5.196 (ẩn từ v3.5.171). |
| [`js/overlay/study/shared/study-score.js`](../../js/overlay/study/shared/study-score.js) | `LHN_DICTATION_SCORE` | Shared tokenization, score, diff và prefix progress. |
| [`js/overlay/study/shared/learning-rules.js`](../../js/overlay/study/shared/learning-rules.js) | `LHN_DICTATION_RULES` | Shared hints, eligibility và error categories. |
| [`js/overlay/study/shared/session-index.js`](../../js/overlay/study/shared/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Provider-neutral session metadata dùng bởi Dashboard Dictation. |
| [`js/overlay/overlay-controller.js`](../../js/overlay/overlay-controller.js) | `createStudyOverlayApi`, `beginStudyMode`, `LHN_STUDY` | Overlay API; mọi lối vào Study (phím tắt, Dashboard, popup) mở tab Nói/Chép. |

## 3. Luồng chính

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; YouTube dùng caption cues, Web dùng Reader sentence cues. Caption refresh đến qua `lhn-dual-captions-updated`.
2. `overlay-controller.js` (`LHN_STUDY.open`) mở overlay rồi chuyển sang tab Nói (Speaking) hoặc Chép (Typing) của `unified-ui.js`; nếu phụ đề còn đang tải thì chờ `lhn-dual-captions-updated`.
3. Typing chấm qua `LHN_DICTATION_SCORE`; chỉ 100% là pass. Enter chuyển câu sau pass; Esc reveal/reset, backtick play/pause và Ctrl replay.
4. Tab Nói (`unified-ui.js`) ghi âm và nhận dạng giọng (SpeechRecognition + getUserMedia), chấm bằng `LHN_STUDY_SCORE`.
5. `dictation:<sourceId>` lưu progress, notes, translations, title và thống kê lỗi theo mode. Session index lưu source ID/URL YouTube hoặc Web, được dùng cả bởi Dashboard Dictation. Dashboard chưa có Shadowing route; practice vẫn ở Overlay.
6. Web TTS, translation, cue cache, thumbnails và language labels tiếp tục dùng modules hiện có. Quyền microphone do browser quản lý; thiếu MediaRecorder thì recognition vẫn có thể chạy nhưng không có own-recording replay.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ YouTube English-caption gate và Web detected/page language. Web tiếp tục dùng Reader cues, URL thật và virtual media hiện có.
- Scoring, tokenization, learning rules và session metadata nằm trong `study/shared/`; không nhân bản hoặc chuyển Reader/TTS/translation/cache vào Study.
- Progress sync mặc định bật; nếu tắt, Typing/Speaking giữ snapshot riêng. Notes/translations dùng chung; wrong-word statistics tách theo mode.
- Bảo toàn Speaking one-shot/rearm, grace im lặng 1,5 giây, recording replay cutoff, unsupported-recognition fallback và retry/feedback. Bảo toàn Typing pass 100%, hints, punctuation normalization và missing-word marks.

## 5. Kiểm tra và xác minh

- v3.5.31: `node --check` đạt cho 61 JavaScript files; 44 manifest script paths tồn tại; focused VM nạp Study modules theo thứ tự và xác nhận Speaking tier/status delegation; mock DOM xác nhận Typing/Speaking/shared refs; CSS gốc được giữ trong `overlay-template.js`; `git diff --check` đạt. Browser QA chưa chạy.
- Lặp static checks với Node, kiểm tra manifest paths/order và nạp Study scripts trong cùng VM context.
- Browser QA còn cần xác nhận Web/YouTube cues, Typing keyboard flow, microphone permission/recognition, auto/manual recording, replay, progress/statistics persistence, language switching, responsive layout và cleanup trên Chromium/Firefox/Edge. Static/mock không thay thế kiểm tra browser.
