# Dictation — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; tài liệu này mô tả overlay, scoring, Speaking và lưu trữ.

## 1. Mục đích và phạm vi

Dictation luyện caption tiếng Anh YouTube trong overlay/player hiện có, gồm mode `Đánh máy` và `Luyện nói`. Speaking dùng SpeechRecognition để tạo transcript, còn MediaRecorder giữ bản ghi tạm trong memory để phát lại giọng người dùng; Keepit không lưu audio bền vững hoặc upload.

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

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; Dictation lấy English cues và dùng chung player. Caption đến muộn qua `lhn-dual-captions-updated`.
2. Typing chỉ pass khi `result.perfect`; Speaking pass từ 70%, bật Next nhưng không tự chuyển. Tier 70–100%, 40–69%, 0–39% lần lượt xanh, vàng, đỏ.
3. Speaking: mặc định không lặp bổ sung (cue đầu phát một lần), tách repeat Typing; status nhắc mic/Enter và ẩn nút chấm. Enter/mic bắt đầu nhận diện, Enter lần nữa dừng, phát bản thu tạm rồi chấm transcript; video dừng khi thu/phát. Mic dùng icon audio-lines tím và pulse khi phát. Tiers giữ ngưỡng 70/40. Riêng VI có popup kính mờ phía trên, giữa panel, có vòng điểm, copy 15 mốc % và Spring Pop; màu giữ nguyên; Slide Up ẩn sau 4s hoặc Enter, lượt chấm sau hiện nội dung mới. EN/KO tiếp tục feedback inline. Recognition có thể tự khởi động lại sau phiên tạm thời; sai thì retry. Escape phát cue và hiện đáp án, Escape tiếp reset; Enter sau reveal chấm 100%, Enter kế chuyển câu.
4. `dictation:<videoId>` lưu progress, notes, translations, title và `wrongWordStats`; session index bổ sung metadata. Không lưu audio.
5. Chỉ xin mic sau thao tác người dùng. Browser có thể xử lý audio theo cấu hình SpeechRecognition. Nếu MediaRecorder không khả dụng, vẫn thử recognition và báo không thể phát lại. Đóng panel, đổi câu/mode hoặc reset sẽ dừng tracks, dọn playback và revoke Blob URL.
6. Bản dịch mặc định ẩn; đổi `lhnSettings.language` cập nhật nhãn/placeholder/aria-label và `.te-dict-stats-word` tại chỗ, không dựng lại panel hoặc xóa state.

## 4. Hợp đồng và quy tắc cần giữ

- Không tạo overlay thứ hai; giữ API/events video và chỉ dùng cue tiếng Anh.
- UI dùng `--lhn-app-font-family`; phụ đề/transcript vẫn theo tùy chọn font riêng.
- Refresh language giữ input, câu, progress, notes và mode; video control dùng ID ổn định. Popup Speaking chỉ hiện ở VI, tự ẩn 4s/Enter; đổi language dựng lại kết quả mà không đổi tier/scoring. EN/KO dùng inline.
- Progress sync mặc định bật ở `dictation:progress-sync:v1`; khi tắt Typing/Speaking giữ snapshot riêng. Notes, translations và error stats dùng chung.
- Contraction chỉ qua allowlist. Không thống kê missing, proper nouns, target 1–3 ký tự hoặc lỗi chỉ khác dấu câu. `wrongWordStats` schema v3 là heuristic; migration giữ notes/progress/translations.
- Proper-noun hint giữ case/thứ tự, bỏ trùng; viết hoa đầu câu không tự thành tên riêng.
- Grid mặc định video:khu vực học:ghi chú = 25:50:25; giữ giới hạn kéo và migration rightScale v1 sang preference v2.
- Chunks/Blob URL chỉ tạm thời trong runtime; giải phóng khi reset, đổi câu/mode hoặc đóng panel. Repeat count có state riêng theo mode; Typing mặc định/keyboard/scoring không đổi.

## 5. Kiểm tra và xác minh

- Static/mock: `node --check` JS, parse manifest, language keys EN/VI/KO, kiểm tra flow manual start/stop/reveal/reset, cleanup audio, live labels, CSS braces và `git diff --check`.
- Browser QA cần thử Typing/Speaking, Enter start/stop/playback/retry/Next, Escape reveal/reset/100%, quyền và API không hỗ trợ, cleanup stream/Blob URL, progress/reload, notes/translations/stats, layout và đổi ngôn ngữ trên Chrome/Edge/Firefox. Static checks không thay thế browser test.
