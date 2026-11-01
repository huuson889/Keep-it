# Dictation — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; trang này mô tả overlay, scoring, stats và persistence.

## 1. Mục đích và phạm vi

Dictation luyện caption tiếng Anh từ YouTube trong overlay/player hiện có. Có hai mode: `Đánh máy` và `Luyện nói` (SpeechRecognition của browser); tiến độ, ghi chú và dữ liệu lỗi được lưu cục bộ.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION`, `openPanel` | Panel, cue/state, progress, speech và notes. |
| [`js/dictation/dictation-score.js`](../../js/dictation/dictation-score.js) | `LHN_DICTATION_SCORE` | Tokenize, scoring, word-level diff và contraction allowlist. |
| [`js/dictation/dictation-learning-rules.js`](../../js/dictation/dictation-learning-rules.js) | `LHN_DICTATION_RULES` | Proper-noun hint, eligibility và phân loại lỗi. |
| [`js/dictation/dictation-style.js`](../../js/dictation/dictation-style.js) | `LHN_DICTATION_CSS` | CSS của panel trong Shadow DOM. |
| [`js/core/languages.js`](../../js/core/languages.js) | `MESSAGES` | Nhãn và thông báo EN/VI/KO. |
| [`js/dictation/session-index.js`](../../js/dictation/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Metadata session provider-neutral. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `LHN_OVERLAY_API`, events | Player, captions và overlay provider. |

## 3. Luồng chính

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; `LHN_DICTATION` mở/đóng panel và lấy English cues từ video.
2. Caption đến muộn đồng bộ qua `lhn-dual-captions-updated`; scorer hiện hành xử lý case, punctuation và contraction allowlist.
3. Typing chỉ đạt khi `result.perfect`. Speaking chấm transcript nhận dạng bằng cùng scorer: 70–100% đạt, ghi câu đã giải và bật Next nhưng không tự chuyển; 40–69% cảnh báo vàng, 0–39% đỏ; hai tier thấp yêu cầu thử lại.
4. Speaking hiển thị feedback theo từ; score badge, accuracy ring, speech target và result frame theo tier. Thông báo pass dưới 100% không tuyên bố “100% chính xác”.
5. Progress, solved, notes, translations, video title và `wrongWordStats` được lưu trong `dictation:<videoId>`; session index là metadata bổ sung, không thay record nguồn.
6. SpeechRecognition chỉ bắt đầu sau thao tác mic. Permission/network/no-speech/unsupported có thông báo riêng; browser không hỗ trợ nhận diện có thể chuyển về `Đánh máy`.
7. Đóng panel, đổi câu hoặc đổi mode dừng recognition và dọn listener/timer; khi close/đổi video, dữ liệu cần thiết được flush.

## 4. Hợp đồng và quy tắc cần giữ

- Không tạo overlay thứ hai; giữ cue English, `LHN_OVERLAY_API`, event hiện có và typing perfect-only.
- Speaking pass từ 70% chỉ đánh dấu solved/mở Next; không gọi điều hướng tự động. Ngưỡng warning/fail lần lượt là 40–69% và 0–39%; màu target, score badge, accuracy ring và result frame phải khớp tier.
- Thông báo pass được dịch cho EN/VI/KO; chỉ dùng câu “100% chính xác” khi điểm thực sự hoàn hảo. Privacy disclosure tiếp tục ẩn trong UI Speaking; module không ghi/lưu file audio.
- Toggle đồng bộ progress mặc định bật và lưu `dictation:progress-sync:v1`. Khi tắt, Speaking/Typing giữ snapshot riêng trong `progressByMode`; bật lại hợp các câu đã giải. Notes, translations và error stats vẫn dùng chung.
- Scoring contraction chỉ dùng allowlist; không mở rộng sang slang. Reporting bỏ missing, target 1–3 chữ cái, proper nouns và punctuation-only differences; errors/fixes đều phải đạt eligibility.
- `wrongWordStats` schema v3 ghi lỗi eligible, biến thể, ngữ cảnh và nhóm heuristic (âm vị/quy tắc/typo); đây là gợi ý, không khẳng định ý định. Migration reset schema cũ nhưng giữ notes/progress/translations.
- Proper-noun hint giữ original case/thứ tự, bỏ trùng và ẩn khi không có tên; từ đầu tiên sau ranh giới câu không bị coi là tên riêng chỉ vì viết hoa.
- Giữ layout 3 cột và split ratio đã lưu; title ưu tiên mini-title đang hiện. Session index lỗi hoặc cũ không được chặn/ghi đè record Dictation hợp lệ.

## 5. Kiểm tra và xác minh

- Static v3.4.915 từ code GitHub v3.4.914: toàn bộ JS `node --check`, manifest JSON/version, CSS brace balance, tier/typing/localization/style assertions và `git diff --check` đạt; chưa browser-test.
- Browser cần xác nhận typing/speaking (gồm các biên 70/40/39 và Next không tự chuyển), recognition/permission, progress/reload, overlay modes, notes, translations, stats và cleanup trên Chrome/Edge/Firefox. Chưa thực hiện trong lần cập nhật này.
