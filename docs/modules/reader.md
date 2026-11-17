# Reader — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Một Reader chung chọn nội dung, dịch song ngữ và đọc liên tục cho web và Tài liệu. Web Study dùng text từ Reader, không thay thuật toán trích xuất. Tài liệu chỉ cung cấp source adapter; không tự tạo queue/player/voice sheet khác. Các hợp đồng dữ liệu tệp ở [documents](../documents.md).

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`bilingual-reader.js`](../../js/reader/bilingual-reader.js) | `readerBlocks`, `LHN_READER_API` | Controller và UI Reader gốc; start/toggle/stop/reset/source refresh, native bilingual cards. |
| [`reader-css.js`](../../js/reader/reader-css.js) | `LHN_READER_CSS` | Thanh, giọng/tốc độ/sheet; màu qua `LHN_THEME`. |
| [`tts-engine.js`](../../js/reader/tts-engine.js) | `LHN_TTS` | Chia chunk, language/voice/favorites và phát audio. |
| [`Readability.js`](../../vendor/readability/Readability.js) | `Readability` | Chọn main article trên web. |
| [`translate.js`](../../js/translate/translate.js) | `BILINGUAL_TRANSLATE` | Background/cache/provider dùng chung. |
| [`documents-context.js`](../../js/dashboard/documents-context.js) | `LHN_PAGE_CONTEXT` | Adapter owned file: blocks/text, speaker geometry, chuyển trang và vị trí card; không có UI Reader. |

## 3. Luồng chính

1. Web nạp Readability, theme tokens, flags/CSS/TTS rồi Reader. `readerBlocks()` giữ Readability + legacy fallback và cache hiện có. Có owned context thì lấy đúng blocks tệp; với PDF, mỗi đoạn nhiều dòng là một block dù các text spans định vị vẫn giữ chỉ số riêng cho chọn chữ.
2. `LHN_READER_MAIN_SOURCE.getTextBlocks({forceRefresh})` cung cấp text cho Web Study; force chỉ bỏ cache, không đổi extractor. `LHN_READER_BAR` giữ API rate/tile/blockAt/mainBlocks cho thanh Keepit/POS.
3. `LHN_READER_API` là facade gọi chính Reader: `start`, `toggle`, `stop`, `reset`, `translate`, `setTranslation`, `refreshSource`, `refreshTranslations`, `state`. Không phải engine thứ hai. Document pager chỉ nhường chỗ theo trạng thái native bar.
4. `translateBlock()` dùng cùng native card/provider/style. Trên web card nằm cạnh paragraph; file adapter có thể đặt chính card đó trong sidebar để không phá PDF. Helper `translationCard`/`translationBlock` giữ liên kết source; không dựng card/translation queue riêng.
5. Phát qua `LHN_TTS`, dùng voice/favorites/rate chung; browser voice phải khớp URI. Queue boundary có thể nhờ adapter mở trang kế/trước. Double-click khi đọc/tạm dừng tìm block trong queue (PDF theo paragraph) rồi đọc tiếp. PDF Original dùng speaker icon chung, adapter đặt icon trên overlay không scale theo ký tự cuối paragraph nhiều span. PDF Original dùng speaker icon chung; adapter đặt icon theo ký tự cuối của cả paragraph nhiều span.
6. Các command/event `lhn-bilingual-reader-*` và pause-state/start event giữ nguyên; Web Study và Reader tiếp tục loại trừ nhau. More trên file mở cài đặt Reader hiện có của Dashboard.

## 4. Hợp đồng và quy tắc cần giữ

- Không có context trên web thì extractor, metadata exclusions, source cache và hành vi UI giữ đường cũ; không đọc thêm body/title cho AI.
- Dịch master tắt → không lazy/paragraph/bilingual read; preference lưu không bị mất. Dừng/đổi nguồn phải hủy token, utterance/audio, waiters và request cũ; không phát audio muộn.
- Giữ `#lhn-bilingual-reading-bar`, `lhn-show`, spacer trên web, flags/voice/favorite/rate semantics. File dùng viewport riêng nên adapter bỏ body spacer, không tạo thanh thay thế.
- Font override/speaker insertion chỉ dùng nơi source cho phép; không viết lại font/hình học PDF/Office gốc. Text projection của mode Đọc vẫn là dữ liệu tệp thật. Mọi PDF text span phải ánh xạ về một paragraph; Reader đọc một lần và đánh dấu tất cả spans của đoạn.
- Double-click khi Reader đang chạy/tạm dừng chỉ nhảy nếu target ánh xạ được tới readable block; bar/control/input không kích hoạt. Dùng queue và luồng hủy TTS hiện có, không tạo playback engine riêng. Speaker icon trên PDF dùng chung visibility/settings/start handler của web.
- `LHN_READER_SPEECH_RATE.getRate/setRate` dùng cùng resolver; không ảnh hưởng Dictation slow replay, YouTube hoặc tốc độ Flashcard riêng.
- Sheet/popover dùng `LHN_SHEET`; More trên web vẫn gọi Keepit menu. Không ghép CSS màu mới vào Reader.

## 5. Kiểm tra và xác minh

`node --check` Reader/CSS/TTS và kiểm refs/order. Chromium với extension thật kiểm same native bar, voices/speed/repeat/pause/start/stop, double-click nhảy đoạn trên web và Documents/PDF nhiều span/trang, speaker icon PDF Original dùng cài đặt chung, file page boundary, native card mount và web main-content fallback. Service mock không thay nghe giọng/voice thật; Firefox, Edge Android và các QA cũ chưa xác nhận vẫn ở `PROJECT.md` mục 2.
