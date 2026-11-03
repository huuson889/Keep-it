# Dictation — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; engine, scoring, Speaking và session helpers hiện cùng nằm dưới Overlay/Study.

## 1. Mục đích và phạm vi

Dictation luyện YouTube caption hoặc Reader sentence cues trong overlay/player, với `Đánh máy` và `Luyện nói`. SpeechRecognition tạo transcript; MediaRecorder giữ audio tạm trong runtime, không upload hoặc lưu lâu dài.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/overlay/study/dictation.js`](../../js/overlay/study/dictation.js) | `LHN_DICTATION.open` | UI, speech, progress và notes của shared engine. |
| [`js/overlay/study/dictation-score.js`](../../js/overlay/study/dictation-score.js) | `LHN_DICTATION_SCORE` | Tokenize, score, diff. |
| [`js/overlay/study/dictation-learning-rules.js`](../../js/overlay/study/dictation-learning-rules.js) | `LHN_DICTATION_RULES` | Hint, eligibility và error classes. |
| [`js/overlay/study/dictation-style.js`](../../js/overlay/study/dictation-style.js) | `LHN_DICTATION_CSS` | Shadow DOM styles. |
| [`js/overlay/study/session-index.js`](../../js/overlay/study/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Provider-neutral session metadata. |
| [`js/overlay/study/shadowing.js`](../../js/overlay/study/shadowing.js) | `onShadowingControlClick` | Shadowing/Speaking entry và Web TTS controls. |
| [`js/overlay/overlay-controller.js`](../../js/overlay/overlay-controller.js) | `createDictationOverlayApi`, `beginDictationMode` | Cấp API và chọn activity/source; nạp cuối. |
| [`js/shared/thumbnails.js`](../../js/shared/thumbnails.js) | `LHN_THUMBNAILS.loadSource` | Mini-audio URL/fallback. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES`, `t` | EN/VI/KO labels. |

## 3. Luồng chính

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; YouTube dùng English caption cues, Web dùng câu Reader. Speaking Web dùng detected/page language; caption refresh qua `lhn-dual-captions-updated`.
2. Typing pass ở 100%; Enter chuyển câu sau khi pass, Esc reveal/reset, backtick play/pause, Ctrl replay. Speaking pass từ 70% nhưng không tự chuyển; tiers 70–100%, 40–69%, 0–39% lần lượt xanh/vàng/đỏ.
3. Auto-record Speaking mặc định bật: nhận diện one-shot/rearm ở `onend`, gộp interim/final transcript và chấm sau 1,5 giây im lặng reset theo speech. Cue cuối chờ 1 giây; replay attempt cắt 1,5 giây audio cuối nhưng recognition/scoring vẫn chờ đủ grace.
4. Khi auto-record tắt, manual recognition giữ continuous/full replay. Sai thì retry; Escape reveal/reset, Enter sau reveal chấm 100%, Enter tiếp chuyển câu. Speaking ẩn nút chấm và không tự Next.
5. `dictation:<sourceId>` lưu progress/notes/translations/title; session index lưu source ID/URL thật cho `youtube` hoặc `web`. Typing/Speaking stats tách mode; audio, tracks và Blob URL chỉ tồn tại runtime.
6. Mic phụ thuộc quyền trình duyệt; thiếu MediaRecorder vẫn nhận diện nhưng không replay. `lhnSettings.language` cập nhật labels; translation bật mặc định và lưu trong `dictation:translation-visibility:v1`.

## 4. Hợp đồng và quy tắc cần giữ

- Dùng chung overlay/player và `.te-dict-brand`; Web giữ detected/page language + URL thật, YouTube giữ English gate. Thumbnail dùng `LHN_THUMBNAILS.loadSource`.
- Auto-record giữ one-shot/rearm, transcript merge, grace 1,5 giây, replay cutoff; manual mode vẫn continuous/full replay. Sai thì phát cue rồi mở mic sau 1 giây.
- Đổi ngôn ngữ giữ câu, input, progress, notes và mode. Progress sync mặc định bật; khi tắt, Typing/Speaking giữ snapshot riêng. Notes/translations dùng chung, stats tách mode.
- Hint giữ proper noun, thứ tự và contraction allowlist. Typing gạch từ thiếu trước từ kế tiếp đúng, một space mỗi bên; Backspace/Delete xóa slot gọn.
- Giữ grid mặc định 25:50:25, drag bounds, migration `rightScale` v1→preference v2 và repeat count riêng theo mode.
- Learning UI không resize video: S/M/L ẩn 0/1/2 cột biên; giữ control bar cân giữa, `.te-dict-work` CSS v3.4.938, translation dưới hint và các selector styling đã dùng.

## 5. Kiểm tra và xác minh

- v3.5.28: `node --check` đạt cho 59 JS files; manifest/Dashboard paths và no-duplicate relocation checks đạt; focused Study VM xác nhận Typing entry cùng Speaking open/switch/close. Browser QA chưa chạy.
- v3.5.8/v3.5.7: VM keyboard regression xác nhận Enter, Esc, backtick, Ctrl và nhập lại; 54 JS syntax cùng `git diff --check` đạt. Browser QA chưa chạy.
- v3.4.993/v3.5.1: playback và Web Typing VM mocks/static checks; browser QA Web/YouTube vẫn cần xác nhận cues, language, session URL, mic/replay và flow hiện có.
