# Background — Hướng dẫn kỹ thuật

> Tài liệu định hướng; source code được dẫn là nguồn sự thật.

## 1. Mục đích và phạm vi

Background là service worker trung gian cho tác vụ cần runtime API, lưu trữ tập trung hoặc gọi dịch vụ từ các context của extension. Module này không dựng giao diện; UI nằm ở Content, Popup, Dashboard, Reader và các overlay.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `background` | Khai báo service worker cho Chromium và script fallback cho Firefox. |
| [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING.onMessage` | Nạp dependency, xử lý các message và điều phối dịch vụ. |
| [`js/background/annotations.js`](../../js/background/annotations.js) | `LHN_ANNOTATIONS` | IndexedDB, migration và CRUD/phân trang annotation. |
| [`js/background/usage-limits.js`](../../js/background/usage-limits.js) | `LHN_USAGE_LIMITS.create` | Đếm usage local cho translation và Google TTS. |
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Cầu runtime message dùng chung giữa extension contexts. |
| [`js/translate/translate.js`](../../js/translate/translate.js), [`js/core/cache.js`](../../js/core/cache.js) | `LHN_TRANSLATE`, `LHN_CACHE` | Translation, phát hiện ngôn ngữ và cache mà Background gọi. |

## 3. Luồng chính

1. Manifest nạp `background.js`; khi có `importScripts`, file này nạp polyfill và dependency theo thứ tự trước khi dùng global API.
2. UI gửi message qua `LHN_MESSAGING`; listener trong `background.js` phân nhánh theo `message.type`.
3. Annotation message được chuyển cho `LHN_ANNOTATIONS` (IndexedDB); kết quả thay đổi được phát lại để các context đồng bộ.
4. Translation và nhận diện ngôn ngữ chuyển sang `LHN_TRANSLATE`; TTS kiểm tra cache/usage rồi lấy audio Google và trả dữ liệu cho requester.
5. Các message còn lại mở Dashboard/highlight, proxy request YouTube được giới hạn URL, hoặc đọc trạng thái/tiêu thụ usage.

## 4. Hợp đồng và quy tắc cần giữ

- Giữ đồng bộ danh sách dependency và thứ tự nạp trong `manifest.json`, `importScripts` và file entry; `LHN_CONFIG`/`LHN_MESSAGING` phải sẵn sàng trước khi sử dụng.
- `message.type` là hợp đồng giữa các context. Trước khi đổi tên, payload hoặc kiểu kết quả, tìm mọi sender/receiver.
- Annotation được sở hữu bởi Background/IndexedDB; không tạo thêm nguồn lưu annotation riêng ở UI.
- `YOUTUBE_FETCH_TEXT` và `YOUTUBE_API` phải giữ allowlist host hiện tại; không biến proxy thành fetch URL tùy ý.
- Usage-limit prototype và key nằm local, không phải cơ chế thanh toán/bảo mật phía server.
- TTS request có kiểm tra đầu vào, dedupe request đang chạy và dùng `LHN_CACHE`; giữ các bước cache/usage/error khi thay provider.

## 5. Kiểm tra và xác minh

- Static: `for f in js/background/*.js; do node --check "$f" || exit; done`; kiểm tra `manifest.json` parse và `git diff --check`.
- Khi đổi message, kiểm tra sender UI và nhánh receiver; khi đổi annotation, kiểm tra schema/migration IndexedDB và notification; khi đổi TTS/translation, kiểm tra cache hit, provider error, usage bị từ chối và payload trả về.
- Integration: mở Popup/Content/Dashboard/Reader để xác nhận request đi qua service worker và UI xử lý lỗi. Không ghi nhận browser verification nếu chưa chạy thực tế.
