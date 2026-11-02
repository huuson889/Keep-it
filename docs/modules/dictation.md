# Dictation — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; trang này mô tả overlay, scoring, Speaking và lưu trữ.

## 1. Mục đích và phạm vi

Dictation luyện caption tiếng Anh YouTube trong overlay/player hiện có, với mode `Đánh máy` và `Luyện nói`. SpeechRecognition tạo transcript; MediaRecorder giữ bản ghi tạm để phát lại. Audio không được lưu lâu dài hoặc upload.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION`, `openPanel` | Panel, cue, progress, speech và notes. |
| [`js/dictation/dictation-score.js`](../../js/dictation/dictation-score.js) | `LHN_DICTATION_SCORE` | Tokenize, scoring và diff. |
| [`js/dictation/dictation-learning-rules.js`](../../js/dictation/dictation-learning-rules.js) | `LHN_DICTATION_RULES` | Hint, eligibility và phân loại lỗi. |
| [`js/dictation/dictation-style.js`](../../js/dictation/dictation-style.js) | `LHN_DICTATION_CSS` | Style panel Shadow DOM. |
| [`js/dictation/session-index.js`](../../js/dictation/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Metadata session provider-neutral. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `LHN_OVERLAY_API`, events | Player, caption và overlay. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES`, `t` | Chuỗi UI EN/VI/KO. |

## 3. Luồng chính

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; Dictation dùng English cues và player hiện có. Caption cập nhật qua `lhn-dual-captions-updated`.
2. Typing pass khi `result.perfect`; Speaking pass từ 70% nhưng không tự chuyển câu. Các tier 70–100%, 40–69%, 0–39% lần lượt xanh, vàng, đỏ.
3. Auto-record Speaking mặc định bật. Sau cue/repeat cuối, đợi 1 giây. Recognition chạy one-shot; tại `onend` mở phiên mới. Gộp transcript, reset timer khi có speech, dừng/phát bản ghi rồi chấm một lần sau 3 giây im lặng. Toast ghi âm giữ đến khi dừng.
4. Khi auto-record tắt, manual recognition giữ continuous flow. Sai thì retry; Escape phát cue/hiện đáp án rồi reset; Enter sau reveal chấm 100%, Enter tiếp chuyển câu. Speaking ẩn nút chấm và không tự chuyển Next.
5. `dictation:<videoId>` lưu progress, notes, translations, title và `wrongWordStats`; session index lưu metadata. Audio, tracks và Blob URL chỉ tạm runtime, dọn khi reset, đổi câu/mode hoặc đóng panel.
6. Quyền mic do trình duyệt quyết định. Thiếu MediaRecorder vẫn nhận diện nhưng không phát lại. Đổi `lhnSettings.language` cập nhật nhãn/aria; bản dịch mặc định bật, tuỳ chọn lưu tại `dictation:translation-visibility:v1`.

## 4. Hợp đồng và quy tắc cần giữ

- Không tạo overlay thứ hai; tái dùng player và `.te-dict-brand` duy nhất từ video overlay. UI dùng `--lhn-app-font-family`; phụ đề/transcript giữ font riêng.
- Auto-record bật: manual/automatic dùng `continuous=false`; `onend` mở lại recognition. Nối các segment, reset grace timer khi có speech và chỉ grade sau 3 giây im lặng. Tắt auto-record giữ manual continuous. Chấm sai phát cue một lần, rồi mic tự mở sau cue 1 giây.
- Popup VI dùng ring, 15 mức điểm, Spring Pop và tự ẩn sau 6 giây/Enter; EN/KO dùng card inline. Đổi ngôn ngữ giữ câu, input, progress, notes và mode.
- Progress sync mặc định bật; khi tắt, Typing/Speaking giữ snapshot riêng. Notes, translations và error stats dùng chung.
- Hint giữ proper noun và thứ tự; contraction theo allowlist. Thống kê loại missing, proper nouns, từ 1–3 ký tự và lỗi chỉ khác dấu câu.
- Grid mặc định video:khu vực học:ghi chú = 25:50:25; giữ giới hạn kéo, migration rightScale v1 sang preference v2 và repeat count riêng theo mode.
- Learning UI: auto-record cạnh translation; S/M/L ẩn 0/1/2 cột biên, giữ cỡ video. Mic Speaking một vòng tím; translation full-width dưới hint; `.te-dict-work` giữ CSS v3.4.938. `.te-dict-wg` bỏ padding, viền `#059669`; `.te-dict-speech-word` dùng chung kiểu `.te-dict-w` (14px).

## 5. Kiểm tra và xác minh

- v3.4.979 static passed: 56 JS checks, 14 CSS parses, shared typing/speech-token assertions, docs and diff.
- Browser QA chưa chạy: xác nhận token nhận diện khớp chip câu đúng ở theme sáng/tối; flow preference/toast của v3.4.977 vẫn cần test trên Chromium/Firefox/Edge.
