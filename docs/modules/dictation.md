# Dictation — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; tài liệu này mô tả overlay, scoring, Speaking và lưu trữ.

## 1. Mục đích và phạm vi

Dictation luyện caption tiếng Anh YouTube trong overlay/player hiện có, với mode `Đánh máy` và `Luyện nói`. SpeechRecognition tạo transcript; MediaRecorder giữ bản ghi tạm để phát lại. Keepit không lưu hoặc upload audio.

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

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; Dictation lấy English cues và dùng player hiện có. Caption đến muộn qua `lhn-dual-captions-updated`.
2. Typing pass khi `result.perfect`; Speaking pass từ 70% nhưng không tự chuyển câu. Tier 70–100%, 40–69%, 0–39% lần lượt xanh, vàng, đỏ.
3. Công tắc Tự động ghi âm Speaking mặc định bật (Sparkles, EN/VI/KO). Sau cue và mọi repeat cuối, video tạm dừng; đợi 4 giây rồi bắt đầu thu/nhận diện. Speechend khởi chạy 3 giây im lặng, được đặt lại khi speechstart hoặc có kết quả mới; sau đó chạy luồng hiện có: phát bản thu tạm tại chỗ rồi chấm transcript. Tắt công tắc giữ thao tác manual Enter/mic.
4. Recognition có thể tự khởi động lại; sai thì retry. Escape phát cue/hiện đáp án rồi reset; Enter sau reveal chấm 100%, Enter tiếp chuyển câu. Speaking ẩn nút chấm và không tự chuyển Next.
5. `dictation:<videoId>` lưu progress, notes, translations, title và `wrongWordStats`; session index lưu metadata. Audio, tracks và Blob URL chỉ tạm runtime, được dọn khi reset, đổi câu/mode hoặc đóng panel.
6. Trình duyệt quyết định quyền mic; auto-record có thể xin capture sau cue. Thiếu MediaRecorder vẫn nhận diện nhưng không phát lại. Đổi `lhnSettings.language` cập nhật nhãn/aria; bản dịch mặc định ẩn.

## 4. Hợp đồng và quy tắc cần giữ

- Không tạo overlay thứ hai; chỉ dùng cue tiếng Anh. UI dùng `--lhn-app-font-family`; phụ đề/transcript giữ font riêng.
- Auto-record là runtime state, default on; chỉ bắt đầu sau cue cuối/repeat cuối và 4 giây, tự dừng sau 3 giây im lặng resettable. Off hoặc Enter giữ manual flow; Typing không đổi.
- Popup VI dùng ring, 15 mức điểm, Spring Pop, tự ẩn 6s/Enter; EN/KO inline. Đổi ngôn ngữ giữ câu, input, progress, notes và mode.
- Progress sync mặc định bật tại `dictation:progress-sync:v1`; khi tắt, Typing/Speaking giữ snapshot riêng. Notes, translations và error stats dùng chung.
- Contraction theo allowlist; loại missing, proper nouns, từ 1–3 ký tự và lỗi chỉ khác dấu câu khỏi thống kê. Hint proper noun giữ case/thứ tự và bỏ trùng; `wrongWordStats` schema v3 là heuristic.
- Grid mặc định video:khu vực học:ghi chú = 25:50:25; giữ giới hạn kéo và migration rightScale v1 sang preference v2. Repeat count riêng theo mode.

## 5. Kiểm tra và xác minh

- Static/mock: `node --check`, manifest, keys EN/VI/KO, cue-end/repeat +4s scheduling, cancel khi off/replay/Enter, silence 3s reset, playback-before-grade, cleanup, CSS braces và `git diff --check`.
- Browser QA: toggle, auto-start sau repeat cuối, silence resettable 3s/playback-grade, Enter/Escape, permission/fallback/cleanup, Typing, progress/layout và locale trên Chromium/Firefox/Edge. Static checks không thay browser test.
