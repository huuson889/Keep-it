# Dictation — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; trang này mô tả overlay, scoring, thống kê và persistence.

## 1. Mục đích và phạm vi

Dictation luyện caption tiếng Anh YouTube trong overlay/player hiện có, với hai mode `Đánh máy` và `Luyện nói` (SpeechRecognition của browser). Tiến độ, ghi chú và thống kê lỗi được lưu cục bộ.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION`, `openPanel` | Panel, cue, progress, speech và notes. |
| [`js/dictation/dictation-score.js`](../../js/dictation/dictation-score.js) | `LHN_DICTATION_SCORE` | Tokenize, scoring và word-level diff. |
| [`js/dictation/dictation-learning-rules.js`](../../js/dictation/dictation-learning-rules.js) | `LHN_DICTATION_RULES` | Proper-noun hint, eligibility và phân loại lỗi. |
| [`js/dictation/dictation-style.js`](../../js/dictation/dictation-style.js) | `LHN_DICTATION_CSS` | Style panel trong Shadow DOM. |
| [`js/dictation/session-index.js`](../../js/dictation/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Metadata session provider-neutral. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `LHN_OVERLAY_API`, events | Player, caption và overlay provider. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES`, `t` | UI strings EN/VI/KO. |

## 3. Luồng chính

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; Dictation lấy English cues và dùng cùng player. Caption đến muộn đồng bộ qua `lhn-dual-captions-updated`.
2. Typing chỉ hoàn thành khi `result.perfect`; Speaking đạt từ 70%, bật Next nhưng không tự chuyển. Các tier 70–100%, 40–69%, 0–39% dùng xanh, vàng, đỏ.
3. Bản dịch mặc định ẩn; nút hiện dịch giữ bản dịch câu hiện tại và yêu cầu dịch nếu chưa có.
4. Progress, notes, translations, title và `wrongWordStats` lưu trong `dictation:<videoId>`; session index chỉ bổ sung metadata.
5. Nút mic khởi động SpeechRecognition sau thao tác người dùng. Đóng panel, đổi câu/mode hoặc video dừng recognition và dọn listener/timer.
6. Đổi `lhnSettings.language` cập nhật nhãn, placeholder, trợ năng, nhãn trong các thẻ `.te-dict-stats-word` và trạng thái đang hiển thị ngay trong panel đã mở, không dựng lại panel hoặc xóa câu trả lời/tiến độ.

## 4. Hợp đồng và quy tắc cần giữ

- Không tạo overlay thứ hai; giữ API/events video và lọc cue tiếng Anh.
- UI Dictation dùng `--lhn-app-font-family`; phụ đề/transcript vẫn theo tùy chọn font riêng của video.
- Giao diện có thể đổi ngôn ngữ khi panel đang mở; refresh phải giữ nguyên input, câu hiện tại, progress, notes và mode. Các control video được tìm bằng ID ổn định, không phụ thuộc `title` đã dịch.
- Toggle đồng bộ progress mặc định bật tại `dictation:progress-sync:v1`. Khi tắt, Typing/Speaking giữ snapshot riêng; bật lại hợp các câu đã giải. Notes, translations và error stats dùng chung.
- Contraction chỉ qua allowlist. Bỏ missing, proper nouns, target 1–3 ký tự và khác biệt chỉ dấu câu khỏi thống kê lỗi.
- `wrongWordStats` schema v3 ghi lỗi đủ điều kiện, biến thể, ngữ cảnh và nhóm heuristic; đây là gợi ý, không khẳng định ý định. Migration schema cũ giữ notes/progress/translations.
- Proper-noun hint giữ nguyên case/thứ tự, bỏ trùng; từ đầu câu không thành tên riêng chỉ vì viết hoa.
- Bố cục mặc định video:khu vực học:ghi chú = 25:50:25, splitter 8px, center minimum 35%, left 15–30%, right 20–35%. Preference v1 có `rightScale` tùy chỉnh được quy đổi để giữ bề rộng; scale mặc định nhận ratio mới; preference mới dùng v2.
- Session index thiếu/cũ không được chặn hoặc ghi đè record Dictation hợp lệ; module không lưu audio file.

## 5. Kiểm tra và xác minh

- Static/mock: `node --check` JS Dictation, parse manifest, kiểm tra language keys đủ EN/VI/KO, refresh labels không tái tạo panel, `git diff --check` và CSS brace balance.
- Browser: thử Typing/Speaking, recognition/permission, progress/reload, notes, translations, stats, layout, đổi ngôn ngữ khi panel đang mở và cleanup trên Chrome/Edge/Firefox. Static checks không thay thế browser test.
