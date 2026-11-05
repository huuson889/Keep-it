# Shared — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Shared modules cung cấp API/state được dùng qua nhiều context: messaging, storage, text safety, ChatGPT prompt/link helpers, CSS và styles. Đây là các contract nhỏ; thay đổi cần cập nhật caller và module docs liên quan.

## 2. File chính và điểm vào

| File | Export/API | Vai trò |
|---|---|---|
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Runtime request/response và listeners. |
| [`js/core/storage.js`](../../js/core/storage.js) | `LHN_STORAGE` | Storage abstraction/callback wrapping. |
| [`js/shared/chatgpt-panel.js`](../../js/shared/chatgpt-panel.js) | `LHN_CHATGPT_PANEL` | URL validation, map/prompt/route helpers. |
| [`js/shared/chatgpt-ai-toolbar.js`](../../js/shared/chatgpt-ai-toolbar.js) | `LHN_CHATGPT_AI_TOOLBAR.create` | Shadow toolbar URL nguồn, auto-send và AI tabs, đặt ở parent panel Chrome / trang AI Firefox. |
| [`pages/chatgpt-chrome-sidepanel.html`](../../pages/chatgpt-chrome-sidepanel.html) | Chrome panel shell | Shell Chrome dùng flex-column, dành 25px trước iframe ChatGPT; tabs vẫn overlay. |
| [`js/core/utils.js`](../../js/core/utils.js) | `LHN_UTILS` | Sanitization, escaping, keys, date helpers. |
| [`js/shared/highlight-state.js`](../../js/shared/highlight-state.js) | `LHN_HIGHLIGHT_STATE` | Page-local highlight state/events. |
| [`js/core/content.css.js`](../../js/core/content.css.js) | `LHN_CONTENT_CSS` | Shared content stylesheet source. |

## 3. Luồng chính

1. `LHN_MESSAGING.sendMessage` thêm request ID; receiver dispatch theo type và trả response cho đúng request.
2. `LHN_STORAGE` bọc API browser storage. Callers dùng local cho persistent settings/mapping và session cho tab/window route context.
3. `LHN_CHATGPT_PANEL` build HTTPS ChatGPT URL, validate `/c/<id>`, exact source mapping, prompt/link và sanitize route metadata.
4. `LHN_CHATGPT_PROMPT_FORMAT` tạo localized URL header + instruction cho opt-in `?q=` và send-time injection. Panel host giữ same-source/same-route fast path; explicit mapped reopen gửi `KEEPIT_CHATGPT_PANEL_FOCUS_COMPOSER`, còn đổi route mang marker một lần để content focus composer sau khi sẵn sàng. Context switch thụ động không focus. Content chỉ đọc composer text trong memory; prompt người dùng tự viết không nằm trong background message/storage. Mapping/confirmation vẫn thuộc Background.
5. Chrome side-panel shell đặt `LHN_CHATGPT_AI_TOOLBAR.create({sourceUrl})` ở parent phía trên iframe ChatGPT theo flex-column; vùng flow 25px đẩy trang xuống còn tabs vẫn overlay. Panel host đồng bộ URL nguồn. Firefox giữ toolbar trong trang sidebar top-level. Auto-send đồng bộ `lhnSettings.chatGPTAutoSend`; icon dùng `LHN_SITE_ICONS` hoặc fallback.
6. `LHN_UTILS` và `LHN_SANITIZER` xử lý dữ liệu hiển thị; `HIGHLIGHT_STATE` phát sự kiện thay đổi cho các UI.

## 4. Hợp đồng và quy tắc cần giữ

- `message.type`, payload và callback/Promise response là contract xuyên context; không đổi một phía riêng lẻ.
- Mapping key phải là exact `sourceUrl`, value là validated HTTPS `/c/<id>`. Draft text không phải mapping và không thuộc storage API.
- Route sanitizer chỉ trả origin/path ChatGPT đã kiểm tra; loại query, hash, prompt và composer text. Route session gắn với source, không fallback sang global last conversation. Panel URL dùng one-shot clear marker khi source đổi hoặc document mới để content xóa composer cũ.
- Prompt/selection của explicit Keepit action có thể lưu tạm theo request ID; manual user-written prompt không được persist, chỉ URL/request metadata tạm giữ mapping lifecycle. Clear khi hoàn tất, cancel/close, source supersession hoặc expiry. Không có per-source composer save/restore.
- Giữ prompt exact-source, escaped attributes, URL scheme validation và newline behavior; không hạ cấp HTTPS validation.
- UI-facing text dùng locale/settings hiện có; module helper không được tự thêm setting hay mapping management UI.
- Toolbar: parent side-panel Chrome dùng flex column và vùng flow 25px trước iframe; source bar phủ vùng đó, AI tabs overlay iframe. Firefox giữ toolbar trong content. Bar 25px/divider 66px; tabs 4 cột đều, tab 30px, padding 2px 10px, chữ 10px. Dark row trùng nền bar; selected tint link-blue; auto-send dùng setting hiện có.
- User text phải đi qua escaping/sanitization trước render HTML; không chuyển page body/title/clipboard thành selection prompt.

## 5. Kiểm tra và xác minh

- v3.5.100 panel layout/static assertions: parent toolbar Chrome, flex flow 25px trước iframe, tabs overlay, đồng bộ URL nguồn và không tạo toolbar trùng ở iframe — PASS; browser QA pending.
- v3.5.99 toolbar VM: +25px body padding or fixed/absolute app-root top offset, legacy spacer cleanup, idempotency and layout/provider regression assertions — PASS; browser QA pending.
- v3.5.98 toolbar VM: 25px flow spacer, overlay tab row, idempotency, source/provider behavior — PASS; browser QA pending.
- v3.5.90 toolbar VM: font stack, URL/locale, expanded/chevron, provider and icon loader/fallback — PASS; browser QA pending.
- v3.5.88 panel VM: same-route mapped reopen posts composer-focus request; changed route carries the one-shot focus marker; passive context switch does not focus — PASS.
- v3.5.86: Content VM confirms exact localized URL header, mapping/send separation and no user-prompt persistence; JS/manifest checks — PASS.
- Focused panel VM: route validation/mapping, same-route fast path, changed-source reload/clear, explicit `?q=` preserved — PASS.
- Background VM xác nhận route mapping, request supersession/expiry/close và deadline tab event — PASS.
- Chrome/Firefox browser QA chưa chạy; kiểm tra thật route change, sidebar/panel unload/reopen và UI vẫn còn cần thiết.
