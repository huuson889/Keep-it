# Reader — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Reader cung cấp dịch song ngữ trên trang và thanh đọc/TTS. `bilingual-reader.js` quản lý khối văn bản, lazy translation, toolbar và hàng đợi đọc; `tts-engine.js` dùng chung cho Reader, Content và Dashboard. Nội dung trích xuất, UI tùy chỉnh và cache/provider được chia với các module khác.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/reader/bilingual-reader.js`](../../js/reader/bilingual-reader.js) | Content script controller | Tìm khối đọc, dịch, toolbar, voice/settings và đọc liên tục. |
| [`js/reader/tts-engine.js`](../../js/reader/tts-engine.js) | `LHN_TTS` | Chia chunk, phát Google audio, fallback browser speech và ngôn ngữ/voice settings. |
| [`js/reader/bilingual-flags.js`](../../js/reader/bilingual-flags.js) | `LHN_FLAGS` | Cờ vùng bổ sung; phải nạp trước `bilingual-reader.js`. |
| [`vendor/readability/Readability.js`](../../vendor/readability/Readability.js) | `Readability` | Trích nội dung chính cho các luồng đọc/lazy trên trang. |
| [`js/translate/translate.js`](../../js/translate/translate.js), [`js/core/messaging.js`](../../js/core/messaging.js) | `BILINGUAL_TRANSLATE` | Dịch block qua Background và cache. |

## 3. Luồng chính

1. Content script nạp Reader sau Readability, language/config và flags; Reader chọn vùng nội dung và tạo toolbar trên trang.
2. Translation theo nhu cầu đọc: tìm block, chuẩn hóa text và gọi `BILINGUAL_TRANSLATE`; tránh dịch lại cùng block bằng cache/state hiện có.
3. TTS lấy đoạn/segment và ngôn ngữ; `LHN_TTS` tách chunk giới hạn, ưu tiên audio provider, rồi fallback sang browser speech khi audio request lỗi.
4. Toolbar đọc liên tục hoặc từ vị trí con trỏ, đồng bộ pause/stop và cập nhật tiến độ; settings voice/rate lưu qua storage và dùng chung với Dashboard.
5. Thay đổi ngôn ngữ giao diện/Reader/TTS được nhận qua storage listener, sau đó đồng bộ toolbar, voice và segment đang đọc.

## 4. Hợp đồng và quy tắc cần giữ

- Nạp `bilingual-flags.js` trước `bilingual-reader.js`; Readability phải có trước khi Reader gọi `new Readability`.
- Dùng `LHN_TTS` cho chia chunk, normalize language, voice settings và playback; không tạo TTS riêng chỉ cho Reader.
- Translation đi qua `LHN_MESSAGING`/Background để tận dụng providers và cache chung; không bỏ qua cache nếu thêm đường dịch mới.
- Reader settings (`lhnBilingualReaderSettings`), display settings (`lhnSettings`) và translation language (`lhnStudyTranslationSettings`) có vai trò riêng; giữ migration/sync behavior.
- Queue/utterance/request ID phải ngăn audio cũ tiếp tục sau stop, đổi block hoặc thay voice.
- Khi đổi thuật toán chọn nội dung, bảo toàn fallback cho trang mà Readability không parse được và các trường hợp reader-disabled website.

## 5. Kiểm tra và xác minh

- Static: `for f in js/reader/*.js; do node --check "$f" || exit; done`; xác nhận script paths/order trong manifest và `git diff --check`.
- Browser: thử bài viết dài, trang nhiều layout, Readability fail/fallback, lazy translate, Alt+A/Alt+D/Alt+R, start/stop/pause và đổi trang khi đang đọc.
- TTS: kiểm tra chunk dài, Google/audio error sang browser voice, voice/rate theo ngôn ngữ và đồng bộ thay đổi từ Dashboard. Ghi trình duyệt và giọng thực tế đã thử.
