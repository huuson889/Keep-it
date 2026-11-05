# Shared — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Shared modules cung cấp provider registry, panel control và prompt/route helpers cho background, extension pages và content scripts. Provider selection/fill dùng chung; ChatGPT giữ riêng mapping, route, prompt và auto-send.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/shared/ai-providers.js`](../../js/shared/ai-providers.js) | `LHN_AI_PROVIDERS` | Provider IDs, URLs, hosts/origins và generic prompt builder. |
| [`js/shared/ai-panel.js`](../../js/shared/ai-panel.js) | `LHN_AI_PANEL` | Provider state, Chromium iframe bridge, Firefox top-level routing. |
| [`js/shared/ai-toolbar.js`](../../js/shared/ai-toolbar.js) | `LHN_AI_TOOLBAR.create` | Source link, provider tabs, ChatGPT auto-send setting. |
| [`js/shared/chatgpt-panel.js`](../../js/shared/chatgpt-panel.js) | panel navigation controller | ChatGPT mapping/route; delegates generic providers to `LHN_AI_PANEL`. |
| [`js/shared/chatgpt-prompt-format.js`](../../js/shared/chatgpt-prompt-format.js) | `LHN_CHATGPT_PROMPT_FORMAT` | ChatGPT prompt/URL and multiline composer formatting. |
| [`pages/ai-panel-chromium.html`](../../pages/ai-panel-chromium.html) | Chromium shell | Toolbar host and provider iframe. |
| [`pages/ai-panel-firefox.html`](../../pages/ai-panel-firefox.html) | Firefox shell | Top-level provider routing and toolbar host. |

## 3. Luồng chính

1. `ai-providers.js` nạp trước consumer trong extension pages, content scripts và background; mọi module dùng chung provider registry.
2. Chromium đặt `LHN_AI_TOOLBAR` trong panel shell; chọn tab đổi iframe URL và lưu provider theo window. Firefox chuyển trang top-level; toolbar chỉ hiện khi marker hợp lệ và sidebar mở.
3. `chatgpt-panel.js` xác thực route/mapping ChatGPT, rồi ủy quyền request provider khác cho `LHN_AI_PANEL` để fill editor khi sẵn sàng.
4. `LHN_AI_PANEL` gửi `KEEPIT_AI_FILL/CLEAR/FOCUS` tới đúng provider origin; `ai-fill.js` trả kết quả, không gửi prompt.
5. Khi background báo `AI_PANEL_GOOGLE_AUTH_COMPLETED`, Chromium panel chỉ reload iframe nếu cùng window vẫn chọn Grok và frame vẫn trỏ tới Grok.
6. Source link/provider selection dùng chung; auto-send và mapping nguồn→conversation chỉ thuộc ChatGPT.

## 4. Hợp đồng và quy tắc cần giữ

- Registry sở hữu ID/URL/host/origin; không nhận hostname từ page message. Bridge kiểm tra `event.source`, extension origin, provider ID và response origin.
- `ai-fill.js` chỉ find/focus/fill/clear editor trên bốn host; không submit, đọc body/title/clipboard hoặc lưu/restore composer draft.
- Mapping, route, `?q=` và opt-in auto-send chỉ thuộc ChatGPT; provider khác nhận prompt tạm, không tạo mapping.
- Provider state ở `storage.session` theo window, không có global last-chat. Source change giữ source link và clear composer cũ theo request.
- DNR chỉ áp dụng cho subframe trên allowlist host provider; không dùng rule toàn URL hoặc thêm Google auth. Firefox điều hướng top-level.
- Popup reload có ràng buộc window/provider và frame URL; không đổi route/provider hiện tại, không fill hay submit prompt.
- Giữ toolbar geometry/palette đã duyệt: bar 25px, tabs 32px, tab 30px, source link xanh, light/dark; auto-send chỉ hiện với ChatGPT.

## 5. Kiểm tra và xác minh

- Đã chạy: provider/prompt registry VM; editor bridge VM cho bốn provider; Chromium panel VM kiểm tra origin-specific fill/cleanup; Firefox sidebar VM kiểm tra marker, pending fill, cleanup và lifecycle message names — PASS. All-JS `node --check`, manifest parse và `git diff --check` cũng PASS.
- AI panel callback/reload VM xác nhận chỉ reload khi window/provider/frame vẫn khớp Grok — PASS. All-JS `node --check`, manifest parse, Firefox transform và `git diff --check` — PASS.
- Browser QA chưa chạy: xác nhận Chromium popup/callback và session cookie reuse trong iframe, iframe/DNR, Firefox sidebar/provider switching, selector thật trên từng host, source switching và ChatGPT mapping/auto-send cần kiểm tra trực tiếp.
