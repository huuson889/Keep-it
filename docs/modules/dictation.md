# Dictation — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; trang này mô tả overlay, scoring, Speaking và lưu trữ.

## 1. Mục đích và phạm vi

Dictation luyện caption YouTube trong overlay/player với hai mode `Đánh máy`/`Luyện nói`. SpeechRecognition tạo transcript; MediaRecorder giữ audio tạm, không lưu lâu dài hoặc upload.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION`, `openPanel` | Panel, speech, progress, notes. |
| [`js/content/content.js`](../../js/content/content.js) | `handleSelectionMouseUp`, `translateSelectedRange` | Selection, translation/dictionary popups. |
| [`js/dictation/dictation-score.js`](../../js/dictation/dictation-score.js) | `LHN_DICTATION_SCORE` | Tokenize, score, diff. |
| [`js/dictation/dictation-learning-rules.js`](../../js/dictation/dictation-learning-rules.js) | `LHN_DICTATION_RULES` | Hint, eligibility, error classes. |
| [`js/dictation/dictation-style.js`](../../js/dictation/dictation-style.js) | `LHN_DICTATION_CSS` | Shadow DOM styles. |
| [`js/dictation/session-index.js`](../../js/dictation/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Provider-neutral session metadata. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `LHN_OVERLAY_API`, events | Player, captions, overlay. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES`, `t` | EN/VI/KO UI strings. |

## 3. Luồng chính

1. YouTube dùng `LHN_OVERLAY_API`/captions; web `Alt+F` lấy Reader main English blocks, tách câu thành cues qua shared TTS. Panel/controller dùng chung; captions phát `lhn-dual-captions-updated`.
2. Typing pass khi `result.perfect`; sau khi đạt 100%, keydown đầu tiên trong `te-dict-input` bỏ trạng thái đã chấm và mở lại nhập. Speaking pass từ 70% nhưng không tự chuyển câu. Các tier 70–100%, 40–69%, 0–39% lần lượt xanh, vàng, đỏ.
3. Auto-record Speaking mặc định bật: cue cuối chờ 1 giây; recognition one-shot/rearm tại `onend`. Interim transcript cập nhật trực tiếp; gộp segment, reset timer theo speech, rồi chấm sau 1,5 giây im lặng. Khi phát lại lượt đã ghi, chỉ ở chế độ auto-record, dừng audio trước 1,5 giây grace cuối; recognition và scoring vẫn đợi đủ grace. Toast giữ đến khi dừng.
4. Auto-record tắt thì manual recognition giữ continuous flow. Sai thì retry; Escape reveal/reset, Enter sau reveal chấm 100%, Enter tiếp chuyển câu. Speaking ẩn nút chấm và Next không tự chuyển.
5. `dictation:<videoId>` lưu progress/notes/translations/title; thống kê Typing/Speaking tách riêng, không migrate dữ liệu cũ. Session index giữ metadata; audio/tracks/Blob URL chỉ runtime, dọn khi reset, đổi câu/mode hoặc đóng panel.
6. Mic theo quyền trình duyệt; thiếu MediaRecorder vẫn nhận diện nhưng không replay. `lhnSettings.language` cập nhật nhãn/aria; translation mặc định bật và lưu tại `dictation:translation-visibility:v1`.

## 4. Hợp đồng và quy tắc cần giữ

- Dùng chung overlay/player và một `.te-dict-brand`; UI dùng app font, phụ đề/transcript giữ font riêng.
- Auto-record bật: recognition one-shot (`continuous=false`), rearm tại `onend`; gộp segment, reset grace khi có speech, chấm sau 1,5 giây im lặng. Replay lượt auto bỏ 1,5 giây cuối theo setting chụp lúc bắt đầu; recognition/scoring không đổi. Tắt auto-record giữ manual continuous và replay đầy đủ. Sai thì cue một lần, mic mở sau cue 1 giây.
- Popup VI dùng ring, 15 mức điểm, Spring Pop và tự ẩn sau 6 giây/Enter; EN/KO dùng card inline. Đổi ngôn ngữ giữ câu, input, progress, notes và mode.
- Progress sync bật mặc định; khi tắt, Typing/Speaking giữ snapshot riêng. Notes/translations dùng chung; wrong-word stats và summary tách theo mode.
- Hint giữ proper noun/thứ tự và contraction allowlist; thống kê bỏ missing, proper nouns, từ ngắn, lỗi punctuation-only. Typing gạch mọi từ thiếu trước từ kế tiếp đúng, một space mỗi bên; Backspace/Delete trong slot hoặc Backspace từ space sau xóa trọn slot; hint theo công tắc.
- Grid mặc định video:khu vực học:ghi chú = 25:50:25; giữ giới hạn kéo, migration rightScale v1 sang preference v2 và repeat count riêng theo mode.
- Learning UI: auto-record cạnh translation; S/M/L ẩn 0/1/2 cột biên, video giữ cỡ; control bar đối xứng, play ở giữa. Mic vòng tím; translation dưới hint; giữ `.te-dict-work` CSS v3.4.938. `.te-dict-wg` không padding, viền `#059669`; `.te-dict-w` 14px. Result/error token mở Full Dict; multi-select nối space; target/`enjoy` cho select.

## 5. Kiểm tra và xác minh

- v3.4.994: 56 JS syntax; web TTS/sentence VM; 468 CSS rules, manifest/docs và diff checks passed.
- Browser QA chưa chạy: xác nhận web overlay/thumbnail/TTS và video replay auto cắt, manual phát đầy đủ.
