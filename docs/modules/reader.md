# Reader — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật cho lựa chọn văn bản, TTS và lifecycle.

## 1. Mục đích và phạm vi

Reader chọn khối văn bản chính trên trang, quản lý dịch song ngữ và đọc liên tục. `LHN_READER_MAIN_SOURCE` cung cấp main text cho Web Study; Web không thay thuật toán trích xuất của Reader.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/reader/reader-css.js`](../../js/reader/reader-css.js) | `LHN_READER_CSS(flagFontUrl)` → chuỗi CSS | (v3.5.193) CSS Reader (thanh, bảng Giọng/Tốc độ/☰, thẻ song ngữ). `bilingual-reader.js` ghép `LHN_THEME.css("#lhn-bilingual-reading-bar") + LHN_READER_CSS(flagFontUrl)`. Nạp trước `bilingual-reader.js`. |
| [`js/reader/bilingual-reader.js`](../../js/reader/bilingual-reader.js) | `readerBlocks`, `LHN_READER_MAIN_SOURCE`, `LHN_READER_SPEECH_RATE`, `LHN_READER_BAR` | Chọn/chuẩn hóa text, Reader controls và API rate cho Web TTS. |
| [`js/reader/tts-engine.js`](../../js/reader/tts-engine.js) | `LHN_TTS` | TTS, chia chunk, voice và language detection. |
| [`vendor/readability/Readability.js`](../../vendor/readability/Readability.js) | `Readability` | Phân tích main article. |
| [`js/translate/translate.js`](../../js/translate/translate.js) | `BILINGUAL_TRANSLATE` | Dịch qua Background/cache dùng chung. |
| [`js/overlay/source/web.js`](../../js/overlay/source/web.js) | `prepareWebStudy` | Đọc Reader text để tạo Web cues và virtual media. |

## 3. Luồng chính

1. Content script nạp Readability trước Reader; Reader chọn vùng bài viết, lọc block và chuẩn hóa text qua `rawText()`.
2. Reader đọc liên tục bằng `readerBlocks(true)` để tính lại block hiện hành; API `getTextBlocks()` mặc định có thể dùng cache.
3. Web Study gọi `getTextBlocks({ forceRefresh:true })` khi tạo snapshot mới. Sau khi reload hoặc URL đổi, Web lại lấy Reader text, kiểm tra persistent cue cache bằng fingerprint, rồi tạo/tái dùng câu nguồn.
4. Dịch dùng `BILINGUAL_TRANSLATE`; TTS dùng `LHN_TTS`. Giọng yêu thích (v3.5.232): `lhnSettings.favoriteVoices` (voiceURI hoặc `google:<mã>`, mới nhất trước, tối đa 50) qua `LHN_TTS.getFavoriteVoices`/`setFavoriteVoices`/`favoriteVoiceFor`; `LHN_TTS.play` dùng giọng yêu thích cho mọi caller khi giọng đang là Tự động/một ngôn ngữ Google — mục đầu tiên của ngôn ngữ đó còn trên máy được dùng, mục `google:` đứng trước thì đọc Google; chọn giọng cụ thể thì luôn dùng giọng đó. v3.5.233: mọi nơi đọc to (Reader, `content.js` đọc vùng chọn/nút loa từ điển, overlay Web `js/overlay/source/web.js`, Dashboard `speakText` gồm flashcard, khung thống kê chính tả qua `parent.speakText`) đều qua `LHN_TTS.play` với cùng cấu hình giọng trong `lhnSettings` (`voiceMode`, `browserVoiceURI`, `favoriteVoices`); `systemSpeak` của mọi caller phải đọc đúng `voiceURI` ở tham số thứ 4. Tốc độ vẫn do từng nơi tính (flashcard giữ tốc độ riêng). v3.5.234 (Reader): cờ trên thanh Reader đi qua giọng yêu thích theo cùng luật (`favoriteVoiceForReader`) nên Tự động + Ưu tiên Anh–Anh hiện 🇬🇧; mỗi đoạn Google/yêu thích nhớ `readingSegment.voiceKey`, danh sách yêu thích đổi (tab này hoặc tab khác) mà giọng của ngôn ngữ đang đọc khác đi thì `applyFavoriteVoiceChange` đọc lại đoạn đó ngay (đang đọc phần dịch thì chỉ đọc lại phần dịch); đổi lúc tạm dừng thì bấm tiếp tục sẽ đọc bằng giọng mới. `LHN_READER_SPEECH_RATE` cung cấp `getRate`/`setRate` cho Web Overlay, dùng cùng resolver Reader và `lhnSettings`.
5. Thanh điều khiển (v3.5.154): `#lhn-bilingual-reading-bar` là lớp phủ `pointer-events:none`, con là thanh, bảng phím tắt (chỉ máy tính), sheet/popup và toast. Rộng `(min-width:1024px)` = đảo + popup trên nút; hẹp = full-width + bottom sheet; popup Giọng đọc/Tốc độ căn mép trái thanh (v3.5.155), ☰ căn trên nút. Kéo tiến độ gọi `jumpToBlock(index, resume)`; Lặp lại đoạn làm các nhánh kết thúc gọi `advanceQueue()` đọc lại đoạn hiện tại.
6. Lệnh `stop-reading` dừng Reader trước khi mở Web Study; event `lhn-bilingual-reader-started` đóng overlay Web trước khi Reader phát audio. Settings/language được nhận qua storage listeners.

## 4. Hợp đồng và quy tắc cần giữ

- `getTextBlocks(options={})` tương thích lời gọi không tham số; `forceRefresh` chỉ điều khiển cache ở Reader, không đổi thuật toán chọn main content.
- Web snapshot là câu nguồn theo document/URL; đóng/mở overlay không gọi lại Reader. Full reload tạo context mới; URL khác tạo snapshot mới. Cache bền vững chỉ dùng khi source fingerprint và schema khớp.
- Bảo toàn Readability và legacy fallback, `readerDisabledWebsites`, loại trừ extension UI, nội dung ẩn và metadata.
- Dùng `LHN_TTS` cho language, voice và playback; không tạo TTS engine riêng. Rate Web TTS dùng `LHN_READER_SPEECH_RATE`, cùng giới hạn 0.5×–3×, `lhnSettings` và quy tắc global/per-language của Reader.
- Translation đi qua `LHN_MESSAGING`/Background để tận dụng provider và cache hiện có.
- `LHN_READER_BAR` (cho menu nhấn giữ Đọc của thanh Keepit): `rate()`, `stepRate(±0.05)` qua `setSpeechSpeed` (cùng giới hạn 0.5×–3×), `autoVoice()`, `webFont()`/`setWebFont(on)` qua `saveWebsiteFont`. v3.5.160: `tileOn(key)` / `toggleTile(key)` (trả trạng thái mới) cho `autoscroll`, `parabtn`, `autolang`, `readtranslation`, `webfont` — cùng đường lưu với ô trong ☰ của Reader (`readerTileOn` / `setReaderTile`); sheet ☰ của thanh Keepit dùng cho hàng Trình đọc. Trên cảm ứng (`!isDeskBar()`, tức không có chuột), ☰ của Reader gọi `LHN_BAR_HOOKS.openMainSheet(rect)` thay sheet Thêm riêng; máy tính có chuột giữ popover Thêm của Reader. Điện thoại/tablet dọc: nhóm trái thụt 9px (nút cờ 38px, nút tốc độ đệm 1.5px) để cờ cách mép trái bằng ☰ cách mép phải (~15px), ô thời gian giữ vị trí. Dịch khối lỗi mạng (offline hoặc `fetch/network`) gọi `LHN_BAR_HOOKS.translateOffline()` nếu có. v3.5.165: `LHN_READER_BAR.blockAt(x,y)` trả khối chữ (`isTextBlock`) dưới điểm chạm hoặc cách ±8/±16px theo chiều dọc, hay `null` — thanh Keepit dùng cho kéo trái dịch đoạn.
- Giữ `stop-reading` và `lhn-bilingual-reader-started` để Reader/Web Study không phát đồng thời.
- v3.5.161: sheet/popover của Reader (`brPanel`) gắn `LHN_SHEET` (khóa cuộn trang, kéo đóng từ bất kỳ chỗ nào, cuộn danh sách giọng về đầu trước); bỏ kéo bằng grip pointer. Nút Thêm (☰) trên mọi thiết bị (cả máy tính chuột) đóng sheet Reader và gọi `LHN_BAR_HOOKS.openMainSheet(rect)` → sheet/popover chính với hàng Trình đọc ở giữa.
- Giữ id `#lhn-bilingual-reading-bar` và class `lhn-show` (keepit-bar.js nhường khi thanh hiện); `#lhn-br-spacer` là UI của Reader, MutationObserver phải bỏ qua. Phút/giờ còn lại định dạng chuẩn tiếng Anh cho mọi ngôn ngữ (`NM`, giờ thập phân `NH`).
- Request ID, utterance và queue phải ngăn audio cũ tiếp tục sau stop, đổi block hoặc đổi voice; giữ speaker controls ngoài navigation/widget.

## 5. Kiểm tra và xác minh

- v3.5.24: Web adapter VM xác nhận `forceRefresh` khi tạo snapshot mới, không gọi lại getter khi đóng/mở cùng document; reload mô phỏng đọc lại Reader rồi hit cache theo fingerprint.
- v3.5.42: Reader/Web VM checks xác nhận rate API dùng chung, resolver global/per-language và cận 0.5×–3×; browser QA chưa chạy.
- v3.5.154: Chromium + extension thật, chạm thật ở 6 kích thước (360–1280px): bố cục thanh, hit-test, ☰, Giọng đọc, Tốc độ, Lặp lại, kéo tiến độ, bảng phím tắt/Alt+L/Alt+R — fails 0; trình duyệt thật của người dùng chưa QA.
- Static: `node --check` toàn bộ JS files, kiểm tra manifest và `git diff --check`.
- Browser QA chưa chạy: bài viết dài, Readability fallback, Reader Alt+A/Alt+D/Alt+R, start/stop/pause, đổi URL và mutual exclusion với Web Study. Hai test path Reader cũ không tồn tại trong repo.
- v3.5.177: cờ giọng đọc: chưa có font `Twemoji Country Flags` thì cờ emoji hệ thống (nếu có màu) được vẽ lên canvas, cắt sát rồi lấy phần giữa (bỏ mép gợn sóng của cờ Android); không có cờ màu thì giữ ký tự.
- v3.5.179: code về lại v3.5.174 (các mục v3.5.176–177 phía trên không còn); `sheet-kit.js` giữ `grow.mid` / `collapse` của v3.5.175, chỉ ☰ của Keepit cho Android dùng.

- v3.5.191 theme: the Reader bar, panels and kbd strip use the Keepit bar glass (light `rgba(255,255,255,.78)`, dark `rgba(24,24,28,.78)`, `blur(24px) saturate(1.6)`). Tiles, fields, flags and speed chips are translucent; secondary text is `#52525b` light and `#b4b4bc` dark. Active / accent states are unchanged (purple; the dark speed chip stays `#facc15`). Only CSS colours changed (end of the style string in `bilingual-reader.js`); no layout or behaviour changes.
