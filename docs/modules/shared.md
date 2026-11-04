# Shared — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Shared modules cung cấp API/state được dùng qua nhiều context: messaging, storage, text safety, ChatGPT prompt/link helpers, CSS và styles. Đây là các contract nhỏ; thay đổi cần cập nhật caller và module docs liên quan.

## 2. File chính và điểm vào

| File | Export/API | Vai trò |
|---|---|---|
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Runtime request/response và listeners. |
| [`js/core/storage.js`](../../js/core/storage.js) | `LHN_STORAGE` | Storage abstraction/callback wrapping. |
| [`js/shared/chatgpt-panel.js`](../../js/shared/chatgpt-panel.js) | `LHN_CHATGPT_PANEL` | URL validation, map/prompt/route helpers. |
| [`js/core/utils.js`](../../js/core/utils.js) | `LHN_UTILS` | Sanitization, escaping, keys, date helpers. |
| [`js/shared/highlight-state.js`](../../js/shared/highlight-state.js) | `LHN_HIGHLIGHT_STATE` | Page-local highlight state/events. |
| [`js/core/content.css.js`](../../js/core/content.css.js) | `LHN_CONTENT_CSS` | Shared content stylesheet source. |

## 3. Luồng chính

1. `LHN_MESSAGING.sendMessage` thêm request ID; receiver dispatch theo type và trả response cho đúng request.
2. `LHN_STORAGE` bọc API browser storage. Callers dùng local cho persistent settings/mapping và session cho tab/window route context.
3. `LHN_CHATGPT_PANEL` build HTTPS ChatGPT URL, validate `/c/<id>`, exact source mapping, prompt/link và sanitize route metadata.
4. Link helper tạo URL prompt với selection-derived text; ChatGPT composer/submit handlers thuộc content module, không phải storage API.
5. `LHN_UTILS` và `LHN_SANITIZER` xử lý dữ liệu hiển thị; `HIGHLIGHT_STATE` phát sự kiện thay đổi cho các UI.

## 4. Hợp đồng và quy tắc cần giữ

- `message.type`, payload và callback/Promise response là contract xuyên context; không đổi một phía riêng lẻ.
- Mapping key phải là exact `sourceUrl`, value là validated HTTPS `/c/<id>`. Draft text không phải mapping và không thuộc storage API.
- Route sanitizer chỉ trả origin/path ChatGPT đã kiểm tra; loại query, hash, prompt và composer text. Route session gắn với source, không fallback sang global last conversation.
- Prompt/selection lưu tạm theo request ID chỉ phục vụ explicit action; clear khi hoàn tất, cancel/close, source supersession hoặc expiry. Không có per-source composer save/restore.
- Giữ prompt exact-source, escaped attributes, URL scheme validation và newline behavior; không hạ cấp HTTPS validation.
- UI-facing text dùng locale/settings hiện có; module helper không được tự thêm setting hay mapping management UI.
- User text phải đi qua escaping/sanitization trước render HTML; không chuyển page body/title/clipboard thành selection prompt.

## 5. Kiểm tra và xác minh

- Đã chạy JavaScript syntax cho toàn bộ first-party files, Firefox build transform, manifest validation và `git diff --check` — PASS.
- Focused panel VM: sanitize source route (bỏ query/hash), không dùng global fallback, same-source/same-route fast path, force reload khi khác source dù cùng `/c/<id>`, không prompt tự động, giữ explicit `?q=` — PASS.
- Background VM xác nhận route mapping, request supersession/expiry/close và deadline tab event — PASS.
- Chrome/Firefox browser QA chưa chạy; kiểm tra thật route change, sidebar/panel unload/reopen và UI vẫn còn cần thiết.
