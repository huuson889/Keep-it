# Core — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

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
| [`js/core/languages.js`](../../js/core/languages.js) | `LHN_LANGUAGES` | Ngôn ngữ giao diện, dịch label và phát hiện language. |
| [`js/core/cache.js`](../../js/core/cache.js) | `LHN_CACHE` | Cache bản dịch song ngữ và TTS audio. |
| [`js/core/shortcuts.js`](../../js/core/shortcuts.js), [`js/core/error-logger.js`](../../js/core/error-logger.js) | `LHN_SHORTCUTS`, `LHN_ERROR_LOGGER` | Chuẩn hóa phím và lưu diagnostic error. |

## 3. Luồng chính

1. Mỗi context nạp polyfill và module cần dùng theo thứ tự trong `manifest.json`, `background.js` hoặc HTML entry.
2. Nạp `defaults.js` trước `config.js`; config tạo hằng số từ defaults. `settings.js` ghép defaults, giá trị lưu và override context.
3. Feature modules gọi global API `LHN_*`; request xuyên context gửi qua `LHN_MESSAGING`, không tự dựng channel riêng nếu đã có message contract.
4. Cache được gọi bởi dịch/TTS; language utilities cung cấp mã và label dùng chung; storage change subscription cập nhật context đang mở.
5. Error logger nhận diagnostic message và ghi vào local storage theo giới hạn của module.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ `defaults.js` là nguồn duy nhất cho default; không chép default thứ hai vào feature module.
- Thứ tự nạp là hợp đồng: `defaults` → `config` → `settings`/consumer; kiểm tra cả manifest, `importScripts` và thứ tự `<script>` khi đổi.
- `CONFIG.STORAGE_KEYS` và `CONFIG.DATABASE` là tên/key dùng chung; không đổi một phía mà bỏ migration hoặc consumer cũ.
- API `LHN_*` được các context gọi trực tiếp trong content script; đổi tên/hình dạng phải rà tất cả consumer.
- Polyfill không làm API đồng nhất hoàn toàn ở mọi ngữ cảnh; kiểm tra nơi chạy và browser target trước khi dùng API mới.
- Cache schema/version/TTL và event subscription có thể ảnh hưởng dữ liệu lưu cũ; giữ migration và cleanup tương thích.

## 5. Kiểm tra và xác minh

- Static: `for f in js/core/*.js; do node --check "$f" || exit; done`; parse `manifest.json`; kiểm tra script order trong manifest, `pages/popup.html`, `pages/dashboard.html` và `importScripts`.
- Khi đổi defaults/settings, thử dữ liệu thiếu, giá trị đã lưu, override và storage change; khi đổi messaging, thử sender/receiver; khi đổi cache, thử hit, miss, expiry và dữ liệu legacy.
- Xác nhận các mã ngôn ngữ UI hiện hỗ trợ và fallback thực tế từ `languages.js`; không suy ra danh sách hỗ trợ chỉ từ tên file.
