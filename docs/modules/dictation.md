# Dictation — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Dictation v1 là chế độ luyện nghe/gõ lời thoại dùng video YouTube đang phát và caption tiếng Anh của Dual Subtitles. Nó thay đổi overlay video hiện có, không tạo overlay thứ hai. Tải caption và điều khiển player thuộc module Video; trang này mô tả consumer, scoring và persistence.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/dictation/dictation.js`](../../js/dictation/dictation.js) | `LHN_DICTATION`, `openPanel` | Panel luyện tập, đồng bộ cue/video, state, lưu tiến độ và ghi chú. |
| [`js/dictation/dictation-score.js`](../../js/dictation/dictation-score.js) | `LHN_DICTATION_SCORE` | Tokenize, score và word-level diff. |
| [`js/dictation/dictation-style.js`](../../js/dictation/dictation-style.js) | `LHN_DICTATION_CSS` | CSS được gắn vào Shadow DOM của overlay Video. |
| [`js/dictation/session-index.js`](../../js/dictation/session-index.js) | `LHN_DICTATION_SESSION_INDEX` | Hợp đồng provider-neutral dùng để chuẩn hóa/merge metadata session. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `LHN_OVERLAY_API`, events | Provider của video, caption cues và overlay controls. |
| [`js/dashboard/dashboard.js`](../../js/dashboard/dashboard.js) | session-index consumer | Đọc session summary chung cho Overview, không gắn với YouTube keys. |
| [`manifest.json`](../../manifest.json) | `content_scripts` order | Nạp scorer, style, shared session index rồi controller sau Video. |

## 3. Luồng chính

1. Dictation nhận `lhn-overlay-ready`, lấy API `LHN_OVERLAY_API` và gắn nút vào overlay; `LHN_DICTATION` công khai `open`, `close`, `toggle`, `isOpen` cho consumer.
2. Khi mở, lấy video ID và cue qua `getDictationCues()`. Cue chỉ dùng khi track language là English; nếu caption còn tải, event `lhn-dual-captions-updated` cho phép đồng bộ lại.
3. Người học gõ câu; `LHN_DICTATION_SCORE` tokenize/căn chỉnh từ để xác định đúng, sai, thừa và thiếu. Playback và seek sử dụng cùng video/cue, không tải player riêng.
4. Tiến độ, câu đã giải, ghi chú, bản dịch và thống kê lỗi tiếp tục lưu theo key hiện có `dictation:<videoId>`; tùy chọn bố cục cột lưu bằng storage key riêng.
5. Sau khi lưu record hiện hữu thành công, Dictation cập nhật thêm `dictation:session-index:v1` với metadata provider-neutral (source, title/URL, vị trí, tổng câu, số câu đã giải, thời gian cập nhật, trạng thái). Lỗi index không làm hỏng hoặc chặn lưu record hiện hữu.
6. Khi đóng hoặc video đổi, flush dữ liệu cần thiết, gỡ listener/timer và trả trạng thái overlay cho Dual Sub.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ hợp đồng `LHN_OVERLAY_API`, `lhn-overlay-ready`, `lhn-dual-captions-updated` và global `LHN_DICTATION`; thay đổi phải rà `dual-subtitles.js`, shortcut và nút overlay.
- Không tạo video element/overlay song song; Dictation phải làm việc với video thật do module Video quản lý.
- Chỉ nhận cue tiếng Anh (`captionTrackLanguage === "en"` sau normalize). Không tự đổi sang track khác khi Dictation mở.
- Scorer là logic dùng chung; giữ chuẩn hóa case/dấu câu và cấu trúc diff mà phần hiển thị phân tích lỗi tiêu thụ.
- Giữ nguyên record `dictation:<videoId>` cùng toàn bộ field hiện tại; layout có key `dictation:layout:v1`.
- Index bổ sung có key `dictation:session-index:v1`, envelope `{version:1, updatedAt, legacyMigrationComplete, sessions:[...]}`; mỗi session có `{version:1, sessionId, sourceType, sourceId, title, url, currentIndex, totalCount, solvedCount, updatedAt, status}`. `currentIndex` zero-based. Tên provider hiện tại là `youtube`; provider web tương lai có thể dùng cùng hợp đồng mà không đổi consumer Overview.
- Backfill cũ chỉ đọc `dictation:<videoId>` và thêm session metadata, không đổi/xóa record gốc. Thất bại khi ghi index phải được cô lập; dữ liệu legacy vẫn đọc được.
- Cleanup là bắt buộc khi close, đổi video hoặc panel không còn active để tránh cập nhật UI cũ.

## 5. Kiểm tra và xác minh

- Static: `for f in js/dictation/*.js; do node --check "$f" || exit; done`; kiểm tra `manifest.json` script order và `git diff --check`.
- Scoring: thử đáp án đúng, case/punctuation khác, từ sai, thiếu, thừa và nhiều dấu nháy; kiểm tra feedback khớp `score`/`diff`.
- Browser: mở từ phím tắt và overlay, chọn video có caption tiếng Anh, gõ/chấm/phát lại/chuyển câu, reload để kiểm tra tiến độ/ghi chú, đổi video và đóng để kiểm tra cleanup.
- Thử caption không phải English/loading chậm; xác nhận từ chối hoặc chờ cue đúng như flow hiện tại. Ghi riêng trình duyệt thật đã thử.
