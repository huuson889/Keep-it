# Dictation — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; trang này mô tả overlay, scoring, Speaking và lưu trữ.

## 1. Mục đích và phạm vi

Dictation luyện caption YouTube hoặc tiếng Anh chính Reader chọn trên trang thường, qua overlay dùng chung với mode `Đánh máy`/`Luyện nói`. Web mode dùng TTS và tái sử dụng video overlay controls; Reading chuyển transcript sang Reader sentences và ảnh thumbnail của trang.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION`, `openPanel` | Panel, speech, progress, notes. |
| [`js/content/content.js`](../../js/content/content.js) | `handleSelectionMouseUp`, `translateSelectedRange` | Selection và popup dịch/từ điển. |
| [`js/dictation/dictation-score.js`](../../js/dictation/dictation-score.js) | `LHN_DICTATION_SCORE` | Tokenize, score, diff. |
| [`js/dictation/dictation-learning-rules.js`](../../js/dictation/dictation-learning-rules.js) | `LHN_DICTATION_RULES` | Hint, eligibility, error classes. |
| [`js/dictation/dictation-style.js`](../../js/dictation/dictation-style.js) | `LHN_DICTATION_CSS` | Shadow DOM styles. |
| [`js/dictation/session-index.js`](../../js/dictation/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Session metadata. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `LHN_OVERLAY_API`, `LHN_WEB_OVERLAY_UI.bind` | Video control binding; Reader cues on web. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES`, `t` | EN/VI/KO strings. |

## 3. Luồng chính

1. YouTube dùng `LHN_OVERLAY_API`/captions; web `Alt+F` lấy Reader main English blocks, tạo TTS cues và gọi `LHN_WEB_OVERLAY_UI.bind`. CC, Reading-only, fullscreen và Settings dùng handlers hiện có; thumbnail thay video trong Reading. `close({restoreView:false})` giữ web host khi chuyển layout.
2. Typing pass ở `result.perfect`; sau 100%, keydown trong `te-dict-input` mở lại nhập. Speaking pass từ 70% nhưng không tự chuyển câu; các tier 70–100%, 40–69%, 0–39% lần lượt xanh, vàng, đỏ.
3. Auto-record Speaking mặc định bật: cue cuối chờ 1 giây, recognition chạy one-shot và rearm ở `onend`; transcript được gộp/chấm sau 1,5 giây im lặng. Replay lượt auto cắt 1,5 giây cuối; toast ghi âm giữ đến khi dừng.
4. Auto-record tắt giữ manual continuous. Sai thì retry; Escape reveal/reset, Enter sau reveal chấm 100%, Enter tiếp chuyển câu. Speaking ẩn nút chấm và Next không tự chuyển.
5. `dictation:<videoId>` lưu progress/notes/translations/title; wrong-word stats Typing/Speaking tách riêng. Session index lưu metadata; audio, tracks và Blob URL chỉ runtime, được dọn khi reset, đổi câu/mode hoặc đóng panel.
6. Mic phụ thuộc quyền trình duyệt; thiếu MediaRecorder thì vẫn nhận diện nhưng không replay. `lhnSettings.language` cập nhật nhãn/ARIA; translation mặc định bật, lưu ở `dictation:translation-visibility:v1`.

## 4. Hợp đồng và quy tắc cần giữ

- Web entry gọi `LHN_DICTATION.toggleWebStudy`; pending flag xử lý shortcut đến sớm. Web phải ẩn `.te-modal-backdrop` trước khi hiển thị panel để tránh lớp phủ chặn tương tác; audio labels/ARIA dùng nhãn TTS/trang web.
- `LHN_DICTATION_SESSION_INDEX.mergeSessions(...groups)` nhận các iterable; session đơn phải được bọc trong mảng. Giữ YouTube event/player và một `.te-dict-brand` dùng chung.
- Auto-record: one-shot (`continuous=false`), rearm tại `onend`, reset grace khi có speech, chấm sau 1,5 giây im lặng. Replay auto bỏ 1,5 giây cuối theo setting chụp lúc bắt đầu; manual replay đầy đủ. Khi sai, phát cue một lần rồi mở mic sau 1 giây.
- Popup VI dùng ring, 15 mức điểm, Spring Pop và tự ẩn sau 6 giây/Enter; EN/KO giữ card inline. Đổi ngôn ngữ không làm mất câu/input/progress/notes/mode.
- Progress sync bật mặc định; khi tắt, Typing/Speaking giữ snapshot riêng. Notes/translations dùng chung; stats và summary lỗi từ tách theo mode.
- Hint giữ proper-noun/thứ tự và contraction allowlist. Missing-word slots có một khoảng trắng mỗi bên; Backspace/Delete trong slot hoặc Backspace từ khoảng trắng sau xóa trọn slot. Hint tuân theo công tắc.
- Grid mặc định video:learning:notes = 25:50:25; giữ giới hạn kéo, migration `rightScale` v1 → preference v2 và repeat riêng theo mode. Learning UI giữ auto-record cạnh translation, S/M/L ẩn 0/1/2 cột biên nhưng không resize video, control bar đối xứng/play giữa, mic tím và translation dưới hint.
- Giữ `.te-dict-work` CSS v3.4.938, `.te-dict-wg` không padding/viền `#059669`, `.te-dict-w` 14px; result/error token mở Full Dict, multi-select nối bằng space.

## 5. Kiểm tra và xác minh

- Static/mock: `node --check` JS; kiểm tra web binding, localization EN/VI/KO, session merge contract, manifest và `git diff --check`.
- Browser QA chưa chạy: xác nhận CC, Reading transition/thumbnail/transcript, fullscreen, full Settings, TTS/progress và YouTube replay trên trình duyệt.
