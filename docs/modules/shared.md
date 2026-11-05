# Shared — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Shared modules cung cấp provider registry, panel control và prompt/route helpers cho background, extension pages và content scripts. Provider selection/fill dùng chung; ChatGPT giữ riêng mapping, route, prompt và auto-send.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/shared/ai-providers.js`](../../js/shared/ai-providers.js) | `LHN_AI_PROVIDERS` | Provider IDs, URLs, hosts/origins và generic prompt builder. |
| [`js/shared/ai-panel.js`](../../js/shared/ai-panel.js) | `LHN_AI_PANEL` | Provider state, Chromium iframe bridge, Firefox top-level routing. |
| [`js/shared/ai-toolbar.js`](../../js/shared/ai-toolbar.js) | `LHN_AI_TOOLBAR.create` | Source link, provider tabs, ChatGPT auto-send, Chromium Grok tab action. |
| [`js/shared/chatgpt-panel.js`](../../js/shared/chatgpt-panel.js) | panel navigation controller | ChatGPT mapping/route; delegates generic providers to `LHN_AI_PANEL`. |
| [`js/shared/chatgpt-prompt-format.js`](../../js/shared/chatgpt-prompt-format.js) | `LHN_CHATGPT_PROMPT_FORMAT` | ChatGPT prompt/URL and multiline composer formatting. |
| [`pages/ai-panel-chromium.html`](../../pages/ai-panel-chromium.html) | Chromium shell | Toolbar host and provider iframe. |
| [`pages/ai-panel-firefox.html`](../../pages/ai-panel-firefox.html) | Firefox shell | Top-level provider routing and toolbar host. |

## 3. Luồng chính

1. `ai-providers.js` nạp trước consumer trong extension pages, content scripts và background; mọi module dùng chung provider registry.
2. Chromium đặt `LHN_AI_TOOLBAR` trong panel shell; chọn tab đổi iframe URL và lưu provider theo window. Firefox chuyển trang top-level; toolbar chỉ hiện khi marker hợp lệ và sidebar mở.
3. `chatgpt-panel.js` xác thực route/mapping ChatGPT, rồi ủy quyền request provider khác cho `LHN_AI_PANEL` để fill editor khi sẵn sàng.
4. `LHN_AI_PANEL` gửi `KEEPIT_AI_FILL/CLEAR/FOCUS` tới đúng provider origin; `ai-fill.js` trả kết quả, không gửi prompt.
5. A Chromium-only observer detects a Google sign-in frame embedded within Grok and the AI panel, then asks Background to open the standard `grok.com` start page top-level. It sends no auth URL or credentials and does not close the new tab; Firefox behavior is unchanged.
6. The Chromium Grok toolbar button remains a manual fallback and calls `tabs.create` from the user's click. Source link/provider selection are shared; auto-send and source→conversation mapping belong only to ChatGPT.

## 4. Hợp đồng và quy tắc cần giữ

- Registry sở hữu ID/URL/host/origin; không nhận hostname từ page message. Bridge kiểm tra `event.source`, extension origin, provider ID và response origin.
- `ai-fill.js` chỉ find/focus/fill/clear editor trên bốn host; không submit, đọc body/title/clipboard hoặc lưu/restore composer draft.
- Mapping, route, `?q=` và opt-in auto-send chỉ thuộc ChatGPT; provider khác nhận prompt tạm, không tạo mapping.
- Provider state ở `storage.session` theo window, không có global last-chat. Source change giữ source link và clear composer cũ theo request.
- DNR chỉ áp dụng cho subframe trên allowlist host provider; không dùng rule toàn URL hoặc thêm Google auth. Firefox điều hướng top-level.
- Nút mở tab chỉ xuất hiện khi Chromium chọn Grok và callback được cung cấp; đây là manual fallback, mở `provider.startUrl` bằng user gesture. Handoff tự động chỉ do auth-frame observer khởi chạy; cả hai cách không chuyển OAuth URL, không thay đổi iframe, không fill hay submit prompt.
- Giữ toolbar geometry/palette đã duyệt: bar 25px, tabs 32px, tab 30px, source link xanh, light/dark; auto-send chỉ hiện với ChatGPT.

## 5. Kiểm tra và xác minh

- Đã chạy: provider/prompt registry VM; editor bridge VM cho bốn provider; Chromium panel VM kiểm tra origin-specific fill/cleanup; Firefox sidebar VM kiểm tra marker, pending fill, cleanup và lifecycle message names — PASS. All-JS `node --check`, manifest parse và `git diff --check` cũng PASS.
- Grok toolbar VM: fallback chỉ được cấp ở Chromium và mở `https://grok.com/` bằng `tabs.create` — PASS. Embedded-auth detector VM: đúng frame/ancestor chain signal, top-level/wrong provider/Firefox no-op — PASS.
- All-JS `node --check`, manifest/permission assertions, Firefox transform and `git diff --check` — PASS.
- Browser QA pending: automatic sign-in handoff and manual fallback on real Chromium; verify Firefox no-op, frame/DNR behavior, provider switching, live selectors, source switching and ChatGPT mapping/auto-send. Embedded-panel session reuse after sign-in remains unverified.
