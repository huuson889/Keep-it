# Dictation — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật; trang này mô tả overlay, scoring, stats và persistence.

## 1. Mục đích và phạm vi

Dictation luyện caption tiếng Anh từ YouTube qua overlay/player do module Video quản lý. Có hai mode trong cùng panel: `Đánh máy` (cũ) và `Luyện nói` (SpeechRecognition trong browser hỗ trợ).

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION`, `openPanel` | Panel, cue/state, tiến độ và ghi chú. |
| [`js/dictation/dictation-score.js`](../../js/dictation/dictation-score.js) | `LHN_DICTATION_SCORE` | Tokenize, scoring và word-level diff; allowlist contractions. |
| [`js/dictation/dictation-learning-rules.js`](../../js/dictation/dictation-learning-rules.js) | `LHN_DICTATION_RULES` | Proper-noun hint, eligibility và phân loại cục bộ từng lượt sai. |
| [`js/dictation/dictation-style.js`](../../js/dictation/dictation-style.js) | `LHN_DICTATION_CSS` | CSS gắn vào Shadow DOM của overlay. |
| [`js/background/background.js`](../../js/background/background.js) | `resetLegacyDictationWrongWordStats` | Reset stats legacy mà giữ các field khác. |
| [`js/dictation/session-index.js`](../../js/dictation/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Metadata session provider-neutral. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `LHN_OVERLAY_API`, events | Player, captions và overlay provider. |
| [`manifest.json`](../../manifest.json) | `content_scripts` order | Nạp scorer/rules/style/controller theo thứ tự. |

## 3. Luồng chính

1. `lhn-overlay-ready` cung cấp `LHN_OVERLAY_API`; `LHN_DICTATION` công khai open/close/toggle.
2. Panel đọc video ID và `getDictationCues()`. Chỉ dùng cue English; caption tải muộn được đồng bộ qua `lhn-dual-captions-updated`.
3. `LHN_DICTATION_SCORE` giữ quy tắc case/punctuation hiện hành và bổ sung các contraction chuẩn có apostrophe theo allowlist; expansion tương ứng được coi như contraction.
4. `LHN_DICTATION_RULES` dùng transcript gốc để nhận diện tên, render hint ngay phía trên ô nhập và ghi lỗi từ đủ điều kiện; mỗi lượt sai được gán nhóm âm vị, quy tắc hoặc typo bằng heuristic cục bộ, kèm biến thể gõ và mảnh ngữ cảnh.
5. Progress, solved, notes, translations, tiêu đề video hiện trên thanh audio và `wrongWordStats` schema v3 lưu trong `dictation:<videoId>`. Session index bổ sung metadata; lỗi index không chặn lưu tiêu đề trong record.
6. `Luyện nói` gọi `SpeechRecognition`/`webkitSpeechRecognition` sau thao tác nhấn mic của người dùng. Transcript nhận dạng được chấm bằng `LHN_DICTATION_SCORE.score()`; token-level feedback hiển thị trong practice view và kết quả đúng cập nhật cùng progress/translation/success flow như typing. Lỗi permission/network/no-speech/unsupported có thông báo riêng; mode unsupported có thể chuyển về `Đánh máy`.
7. Disclosure rằng speech-recognition service của browser có thể xử lý audio được ẩn khỏi UI Luyện nói nhưng vẫn giữ khoảng layout cũ để phần khác không xê dịch. Module không tự ghi/lưu file audio; chỉ transcript nhận dạng được đưa vào scorer. Đóng panel/đổi câu/chuyển về typing hủy recognition đang chạy.
8. Khi close/đổi video, flush dữ liệu cần thiết và gỡ listener/timer để không cập nhật UI cũ.

## 4. Hợp đồng và quy tắc cần giữ

- Không tạo video/overlay thứ hai; giữ cue English, `LHN_OVERLAY_API` và các event hiện có.
- Nút đồng bộ tiến độ là toggle 18×18 ngay bên phải `Đánh máy`, tím khi bật và trắng khi tắt. Mặc định bật; trạng thái lưu toàn cục bằng `dictation:progress-sync:v1` trong `browser.storage.local`. Khi bật, Speaking/Typing dùng chung `current`/`solved`; khi tắt, record từng video giữ snapshot riêng tại `progressByMode.speaking` và `progressByMode.typing`, còn notes/translations/wrong-word stats vẫn dùng chung. Bật lại lấy hợp của hai tập câu đã giải; nếu câu hiện tại của track đang hoạt động vừa được giải ở track kia thì chuyển tới câu chưa giải tiếp theo. Khi preference được bật ở video khác, record có hai track đã phân kỳ cũng được hợp nhất lúc mở.
- Keyboard shortcut trong mode `Luyện nói` dùng lưới bốn cột/căn lề giống hint của `Đánh máy`; mode control inactive theo theme (nền tối/chữ xám nhạt trong dark mode, nền sáng/chữ tối trong light mode), active dùng màu vàng. Speech target vàng khi đang tập, đỏ khi câu nhận diện sai, xanh khi đúng. Nhóm mic/hướng dẫn được ghim đáy; placeholder giữ nguyên flow cũ để vị trí target, shortcut và kết quả không đổi.
- Layout Dictation video dùng ba cột theo phần không gồm hai splitter: mặc định câu 25%, vùng Dictation 45%, ghi chú 30%. Cột câu kéo được 15–30%, ghi chú 20–35%; vùng giữa tự chiếm phần còn lại. Giữ splitter 8px và lưu lại tỉ lệ kéo trong `dictation:layout:v1`.
- Chỉ thêm allowlist contraction chuẩn có straight/curly apostrophe, ví dụ `I'm` ↔ `I am`, `don't` ↔ `do not`. Không nhận slang như `gonna`/`wanna` hoặc dạng không apostrophe; các dạng mơ hồ chỉ theo expansion đã liệt kê.
- Scoring và reporting là hai tầng: scoring chỉ đổi để hỗ trợ contraction; báo cáo bỏ `missing`, target 1–3 chữ cái, proper nouns và punctuation-only differences. Áp dụng eligibility cho cả errors và fixes; fix chỉ ghi khi sửa đúng lỗi eligible đã theo dõi.
- `wrongWordStats` dùng `version:3`, lưu `typeCounts`, nhóm lỗi cuối và ngữ cảnh cục bộ. Heuristic luôn gán một trong ba nhóm âm vị/quy tắc/typo dựa trên dạng chữ; đây là gợi ý mẫu lỗi, không khẳng định ý định của người học. Migration reset riêng stats schema cũ v1/v2 để từ các lượt sau mọi lỗi có phân loại; notes/progress/translations được giữ nguyên.
- `getCurrentVideoTitle()` ưu tiên text của `ui.miniTitle` đang hiện trên thanh audio, rồi đến heading/document title. `saveRecord()` lưu tên và `titleUpdatedAt` vào chính record lẫn session index; bridge so timestamp và dùng record title khi index thiếu/cũ. Khi Dictation mở, `MutationObserver` debounce cập nhật cả hai; observer/timer được dọn khi đóng.
- Proper-noun detector là heuristic cục bộ theo casing/context. Từ vựng đầu tiên sau mỗi ranh giới câu luôn được coi là từ thường, bất kể viết hoa; dấu câu/ký hiệu dẫn đầu như `>>` bị bỏ qua khi xác định vị trí này. Các token viết hoa phía sau vẫn dùng detector chung cho hint và báo cáo.
- Hint giữ original case, thứ tự xuất hiện, loại trùng và ẩn nếu không có tên. Toàn bộ khung dùng chữ 15px, cả nhãn và tên đều đậm; khung ẩn khi banner thành công hiện ra.
- Error rate là `errors / (errors + fixes)`; critical chỉ khi rate ≥70% và có ít nhất 3 errors eligible. Popup nhận mảnh câu chứa biến thể sai và nhãn nhóm heuristic, không nhận transcript đầy đủ hoặc dữ liệu cloud.
- Session index có key `dictation:session-index:v1`, envelope version 1 và danh sách session provider-neutral gồm source/title/URL, vị trí, tổng/đã giải, timestamp và status. `currentIndex` zero-based; lỗi index được cô lập khỏi record gốc.

## 5. Kiểm tra và xác minh

- Static v3.4.912 (từ code GitHub v3.4.910): `node --check` toàn bộ JavaScript, manifest JSON/version, CSS brace balance, assertions UI Luyện nói và `git diff --check` đạt; chưa browser-test. Không thay đổi logic mode/progress.
- Browser cần xác nhận overlay/shortcut, caption English/loading, hint, scoring/progress, replay, lưu notes/translations, stats popup và cleanup khi đổi video/đóng trên Chrome/Edge/Firefox. Thử nhận diện giọng nói/permission/result trên Chromium, và thông báo unsupported trên Firefox. Chưa chạy browser-test trong release này.
