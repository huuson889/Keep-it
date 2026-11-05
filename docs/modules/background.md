# Background — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Background điều phối runtime messages cho annotation, usage, TTS, cache, YouTube và mở Dashboard. Toàn bộ AI panel nằm trong [Ask AI](ask-ai.md) (`js/ask-ai/service.js`); Background chỉ nạp service đó và chuyển message AI cho nó.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `background` | Chromium `service_worker`; Firefox `scripts` theo thứ tự. |
| [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING.onMessage` | Router, `onInstalled`/`onStartup`, TTS, Dashboard, highlight. |
| [`js/background/annotations.js`](../../js/background/annotations.js) | `LHN_ANNOTATIONS` | IndexedDB annotations, review, import/export, change notify. |
| [`js/background/usage-limits.js`](../../js/background/usage-limits.js) | `LHN_USAGE_LIMITS.create` | Usage trial/key. |
| [`js/ask-ai/service.js`](../../js/ask-ai/service.js) | `handleAskAIMessage` | Message AI panel (xem Ask AI). |

## 3. Luồng chính

1. Chromium `importScripts` core, translate, annotations, usage, `ask-ai/providers.js`, `chatgpt-prompt-format.js`, `ask-ai/service.js`; Firefox nạp theo `background.scripts`.
2. `onInstalled` dọn request AI hết hạn, khởi tạo usage, cấu hình DNR AI, đăng ký context menu và reset thống kê Dictation cũ; `onStartup` dọn request và cấu hình lại.
3. Router kiểm tra message theo thứ tự cố định; type trong `ASK_AI_MESSAGE_TYPES` được chuyển cho `handleAskAIMessage` tại đúng vị trí cũ, kết quả không xử lý thì đi tiếp.
4. Annotation messages (`ADD`, `UPDATE`, `DELETE`, `IMPORT`…) gọi `LHN_ANNOTATIONS` và phát `ANNOTATIONS_CHANGED`.
5. `FETCH_TTS_AUDIO` trả audio base64; Chromium thêm DNR 9001 đặt Referer cho Google TTS.

## 4. Hợp đồng và quy tắc cần giữ

- Event listener phải đăng ký đồng bộ khi worker nạp; `service.js` nạp trước `background.js` và chỉ dùng `CONFIG` lúc được gọi.
- Message AI không thêm `await` trước nhánh xử lý, để `sidePanel.open()` vẫn nằm trong user gesture.
- Không đọc page body/title, clipboard hay credentials; không thêm quyền hoặc DNR scope.
- ArrayBuffer không qua được message Chrome; giữ chuyển base64.

## 5. Kiểm tra và xác minh

- Đã chạy (ngoài repo): VM nạp background theo manifest trước/sau khi tách Ask AI — cùng 11 listener, cùng kết quả router, `sidePanel.open` gọi đồng bộ.
- Đề xuất: QA Chromium/Firefox cho highlight/annotation, TTS, mở Dashboard và AI panel sau khi worker restart.
