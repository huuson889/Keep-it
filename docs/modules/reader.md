# Reader — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật cho lựa chọn văn bản, TTS và lifecycle.

## 1. Mục đích và phạm vi

Reader chọn khối văn bản chính trên trang, quản lý dịch song ngữ và đọc liên tục. `LHN_READER_MAIN_SOURCE` cung cấp main text cho Web Study; Web không thay thuật toán trích xuất của Reader.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/reader/bilingual-reader.js`](../../js/reader/bilingual-reader.js) | `readerBlocks`, `LHN_READER_MAIN_SOURCE` | Chọn/chuẩn hóa text và Reader controls. |
| [`js/reader/tts-engine.js`](../../js/reader/tts-engine.js) | `LHN_TTS` | TTS, chia chunk, voice và language detection. |
| [`vendor/readability/Readability.js`](../../vendor/readability/Readability.js) | `Readability` | Phân tích main article. |
| [`js/translate/translate.js`](../../js/translate/translate.js) | `BILINGUAL_TRANSLATE` | Dịch qua Background/cache dùng chung. |
| [`js/video/dual-subtitles.js`](../../js/video/dual-subtitles.js) | `prepareWebStudy` | Đọc Reader text để tạo Web cues. |

## 3. Luồng chính

1. Content script nạp Readability trước Reader; Reader chọn vùng bài viết, lọc block và chuẩn hóa text qua `rawText()`.
2. Reader đọc liên tục bằng `readerBlocks(true)` để tính lại block hiện hành; API `getTextBlocks()` mặc định có thể dùng cache.
3. Web Study gọi `getTextBlocks({ forceRefresh:true })` khi tạo snapshot mới. Sau khi reload hoặc URL đổi, Web lại lấy Reader text, kiểm tra persistent cue cache bằng fingerprint, rồi tạo/tái dùng câu nguồn.
4. Dịch dùng `BILINGUAL_TRANSLATE`; TTS dùng `LHN_TTS`. Lệnh `stop-reading` dừng Reader trước khi mở Web Study; event `lhn-bilingual-reader-started` đóng overlay Web trước khi Reader phát audio.
5. Thay đổi settings/language được nhận qua storage listeners và cập nhật toolbar, voice hoặc segment hiện hành.

## 4. Hợp đồng và quy tắc cần giữ

- `getTextBlocks(options={})` tương thích lời gọi không tham số; `forceRefresh` chỉ điều khiển cache ở Reader, không đổi thuật toán chọn main content.
- Web snapshot là câu nguồn theo document/URL; đóng/mở overlay không gọi lại Reader. Full reload tạo context mới; URL khác tạo snapshot mới. Cache bền vững chỉ dùng khi source fingerprint và schema khớp.
- Bảo toàn Readability và legacy fallback, `readerDisabledWebsites`, loại trừ extension UI, nội dung ẩn và metadata.
- Dùng `LHN_TTS` cho language, voice, rate và playback; không tạo TTS engine riêng cho Web/Reader.
- Translation đi qua `LHN_MESSAGING`/Background để tận dụng provider và cache hiện có.
- Giữ `stop-reading` và `lhn-bilingual-reader-started` để Reader/Web Study không phát đồng thời.
- Request ID, utterance và queue phải ngăn audio cũ tiếp tục sau stop, đổi block hoặc đổi voice; giữ speaker controls ngoài navigation/widget.

## 5. Kiểm tra và xác minh

- v3.5.24: Web adapter VM xác nhận truyền `forceRefresh` khi tạo snapshot mới, không gọi lại getter khi đóng/mở cùng document; reload mô phỏng đọc lại Reader rồi hit cache theo fingerprint.
- Static: `node --check` toàn bộ 54 JS files, kiểm tra manifest và `git diff --check`.
- Browser QA chưa chạy: bài viết dài, Readability fallback, Reader Alt+A/Alt+D/Alt+R, start/stop/pause, đổi URL và mutual exclusion với Web Study. Hai test path Reader cũ không tồn tại trong repo.
