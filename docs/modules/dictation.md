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

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; Dictation dùng English cues và player hiện có. Caption cập nhật qua `lhn-dual-captions-updated`.
2. Typing pass khi `result.perfect`; sau khi đạt 100%, keydown đầu tiên trong `te-dict-input` bỏ trạng thái đã chấm và mở lại nhập. Speaking pass từ 70% nhưng không tự chuyển câu. Các tier 70–100%, 40–69%, 0–39% lần lượt xanh, vàng, đỏ.
3. Auto-record Speaking mặc định bật: cue cuối chờ 1 giây; recognition one-shot/rearm tại `onend`. Interim transcript cập nhật trực tiếp; gộp segment, reset timer theo speech, rồi chấm sau 1,5 giây im lặng. Toast giữ đến khi dừng.
4. Khi auto-record tắt, manual recognition giữ continuous flow. Sai thì retry; Escape phát cue/hiện đáp án rồi reset; Enter sau reveal chấm 100%, Enter tiếp chuyển câu. Speaking ẩn nút chấm và không tự chuyển Next.
5. `dictation:<videoId>` lưu progress, notes, translations, title; `wrongWordStats` dành cho Typing, `speakingWrongWordStats` dành riêng cho Speaking. Dữ liệu Typing cũ không chuyển; session index lưu metadata. Audio, tracks và Blob URL chỉ tạm runtime, dọn khi reset, đổi câu/mode hoặc đóng panel.
6. Quyền mic do trình duyệt quyết định. Thiếu MediaRecorder vẫn nhận diện nhưng không phát lại. Đổi `lhnSettings.language` cập nhật nhãn/aria; bản dịch mặc định bật, tuỳ chọn lưu tại `dictation:translation-visibility:v1`.

## 4. Hợp đồng và quy tắc cần giữ

- Dùng chung overlay/player và một `.te-dict-brand`; UI dùng app font, phụ đề/transcript giữ font riêng.
- Auto-record bật: manual/automatic dùng `continuous=false`; `onend` mở lại recognition. Nối các segment, reset grace timer khi có speech và chỉ grade sau 1,5 giây im lặng. Tắt auto-record giữ manual continuous. Chấm sai phát cue một lần, rồi mic tự mở sau cue 1 giây.
- Popup VI dùng ring, 15 mức điểm, Spring Pop và tự ẩn sau 6 giây/Enter; EN/KO dùng card inline. Đổi ngôn ngữ giữ câu, input, progress, notes và mode.
- Progress sync mặc định bật; khi tắt, Typing/Speaking giữ snapshot riêng. Notes/translations dùng chung; thống kê từ sai tách riêng theo mode và nhãn tổng hợp đổi theo mode.
- Hint giữ proper noun/thứ tự, contraction allowlist; thống kê lọc missing, proper nouns, từ ngắn, lỗi chỉ khác dấu câu. Typing: mọi từ thiếu trước từ kế tiếp đúng có gạch đỏ, một space mỗi bên; Backspace/Delete xóa trọn slot một lần; gợi ý theo công tắc.
- Grid mặc định video:khu vực học:ghi chú = 25:50:25; giữ giới hạn kéo, migration rightScale v1 sang preference v2 và repeat count riêng theo mode.
- Learning UI: auto-record cạnh translation; S/M/L ẩn 0/1/2 cột biên, giữ cỡ video. Control bar dùng bốn track hai bên đối xứng và play/pause ở track giữa. Mic một vòng tím; translation dưới hint; `.te-dict-work` CSS v3.4.938. `.te-dict-wg` bỏ padding, viền `#059669`; speech word dùng `.te-dict-w` (14px). Click result/error token mở Full Dict; multi-select nối bằng dấu cách; target/`enjoy` cho select.

## 5. Kiểm tra và xác minh

- v3.4.991: 54 JS syntax, 466 CSS rules; mock cho khoảng trắng, nhiều từ thiếu, Backspace/Delete nguyên khối và hint on/off; manifest/docs/diff đạt.
- Browser QA chưa chạy: kiểm tra slot gạch đỏ, một lần xóa, nhiều từ thiếu, hint và mẫu lỗi khác.
