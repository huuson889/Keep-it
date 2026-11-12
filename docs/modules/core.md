# Core — Hướng dẫn kỹ thuật

> Source code là nguồn sự thật.

## 1. Mục đích và phạm vi

`core` cung cấp nền tảng dùng chung cho content script, popup, dashboard và service worker: browser polyfill, cấu hình/defaults, storage settings, messaging, ngôn ngữ, cache, shortcut và error logging. Module không sở hữu giao diện/tính năng nghiệp vụ riêng.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/core/browser-polyfill.js`](../../js/core/browser-polyfill.js) | global `browser` | Tương thích API WebExtension. |
| [`js/core/defaults.js`](../../js/core/defaults.js) | `LHN_DEFAULTS` | Nguồn mặc định duy nhất cho settings và tính năng. |
| [`js/core/config.js`](../../js/core/config.js) | `LHN_CONFIG` | Hằng số, storage/database keys, giới hạn và helpers cấu hình. |
| [`js/core/settings.js`](../../js/core/settings.js) | `LHN_SETTINGS` | Resolve defaults với dữ liệu đã lưu; get/save/subscribe. |
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Wrapper gửi/nhận runtime message. |
| [`js/core/languages.js`](../../js/core/languages.js) | `LHN_LANGUAGES` | (v3.5.193: thêm khoá `bar_<tên>` cho thanh Keepit, chuyển từ bảng `T` của `touch-ui.js`.) Ngôn ngữ giao diện, dịch label và phát hiện language. |
| [`js/core/cache.js`](../../js/core/cache.js) | `LHN_CACHE` | Cache bản dịch song ngữ, transcript YouTube, cue Web Study và TTS audio. |
| [`js/core/shortcuts.js`](../../js/core/shortcuts.js), [`js/core/error-logger.js`](../../js/core/error-logger.js) | `LHN_SHORTCUTS`, `LHN_ERROR_LOGGER` | Chuẩn hóa phím và lưu diagnostic error. |

## 3. Luồng chính

1. Mỗi context nạp polyfill và module cần dùng theo thứ tự trong `manifest.json`, `background.js` hoặc HTML entry.
2. Nạp `defaults.js` trước `config.js`; config tạo hằng số từ defaults. `settings.js` ghép defaults, giá trị lưu và override context.
3. Feature modules gọi global API `LHN_*`; request xuyên context gửi qua `LHN_MESSAGING`, không tự dựng channel riêng nếu đã có message contract.
4. Cache được Background gọi cho dịch, TTS audio, transcript YouTube và Web Study cues; cue Web có TTL 7 ngày/LRU riêng, không chia quota transcript YouTube. Language utilities cung cấp mã và label dùng chung.
5. Error logger nhận diagnostic message và ghi vào local storage theo giới hạn của module.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ `defaults.js` là nguồn duy nhất cho default; không chép default thứ hai vào feature module. `LHN_DEFAULTS.youtube` sở hữu popup/đọc video riêng, khác `LHN_DEFAULTS.settings`. Hỏi AI dùng `chatGPTAutoSend:false`, `chatGPTSummaryPrompt:"Hãy tóm tắt web này"`, `chatGPTAskPrompt:"Đoạn này trên web nghĩa là sao?"`; localized prompt endings and Website labels for EN/VI/KO are defined in `LHN_DEFAULTS.chatGPTPrompts` and resolved by `LHN_CHATGPT_PROMPTS`.
- Thứ tự nạp là hợp đồng: `defaults` → `config` → `settings`/consumer; kiểm tra cả manifest, `importScripts` và thứ tự `<script>` khi đổi.
- `CONFIG.STORAGE_KEYS` và `CONFIG.DATABASE` là tên/key dùng chung; không đổi một phía mà bỏ migration hoặc consumer cũ.
- API `LHN_*` được các context gọi trực tiếp trong content script; đổi tên/hình dạng phải rà tất cả consumer.
- Polyfill không làm API đồng nhất hoàn toàn ở mọi ngữ cảnh; kiểm tra nơi chạy và browser target trước khi dùng API mới.
- Cache schema/version/TTL và event subscription có thể ảnh hưởng dữ liệu lưu cũ; giữ migration và cleanup tương thích. Web cue cache dùng khóa băm từ URL + content fingerprint và TTL trượt 7 ngày; mục không được dùng lại trong thời hạn sẽ bị dọn. Thay đổi sentence splitting phải tăng schema key.

## 5. Kiểm tra và xác minh

- Static: `for f in js/core/*.js; do node --check "$f" || exit; done`; parse `manifest.json`; kiểm tra script order trong manifest, `pages/popup.html`, `pages/dashboard.html` và `importScripts`.
- Khi đổi defaults/settings, thử dữ liệu thiếu, giá trị đã lưu, override và storage change; khi đổi messaging, thử sender/receiver; khi đổi cache, thử hit, miss, expiry và dữ liệu legacy.
- v3.5.86: missing `chatGPTAutoSend` resolves off for new installs; saved `true`/`false` remains explicit. Dashboard checks `=== true`, and background settings VM confirms default-off plus saved-true behavior — PASS.
- v3.5.24: VM mock `browser.storage.local` xác nhận Web cue cache save/hit/touch, TTL trượt 7 ngày và xóa mục quá hạn.
- Xác nhận các mã ngôn ngữ UI hiện hỗ trợ và fallback thực tế từ `languages.js`; không suy ra danh sách hỗ trợ chỉ từ tên file.
- v3.5.79: `LHN_CHATGPT_PROMPTS` resolves localized defaults immediately by language, recognizes the prior Vietnamese Ask AI default, and preserves non-default custom sentences.
