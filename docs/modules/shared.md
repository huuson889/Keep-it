# Shared — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Shared modules cung cấp provider registry, panel control và prompt/route helpers. Tabs gồm ChatGPT, Gemini, Claude; Grok còn trong registry nhưng bị ẩn. Mapping và opt-in auto-send dùng chung; `?q=` riêng ChatGPT.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/shared/ai-providers.js`](../../js/shared/ai-providers.js) | `LHN_AI_PROVIDERS` | Provider IDs, URLs, hosts/origins và generic prompt builder. |
| [`js/shared/ai-panel.js`](../../js/shared/ai-panel.js) | `LHN_AI_PANEL` | Provider state, Chromium iframe bridge, Firefox top-level routing. |
| [`js/shared/ai-toolbar.js`](../../js/shared/ai-toolbar.js) | `LHN_AI_TOOLBAR.create` | Source link, ChatGPT/Gemini/Claude tabs, shared opt-in auto-send control. |
| [`js/shared/chatgpt-panel.js`](../../js/shared/chatgpt-panel.js) | panel navigation controller | ChatGPT mapping/route; delegates generic providers to `LHN_AI_PANEL`. |
| [`js/shared/chatgpt-prompt-format.js`](../../js/shared/chatgpt-prompt-format.js) | `LHN_CHATGPT_PROMPT_FORMAT` | ChatGPT prompt/URL and multiline composer formatting. |
| [`pages/ai-panel-chromium.html`](../../pages/ai-panel-chromium.html) | Chromium shell | Toolbar host and provider iframe. |
| [`pages/ai-panel-firefox.html`](../../pages/ai-panel-firefox.html) | Firefox shell | Top-level provider routing and toolbar host. |

## 3. Luồng chính

1. `ai-providers.js` nạp trước consumer trong extension pages, content scripts và background; mọi module dùng chung provider registry.
2. Chromium đặt `LHN_AI_TOOLBAR` trong panel shell; chọn tab đổi iframe URL và lưu provider theo window. Firefox chuyển trang top-level; toolbar chỉ hiện khi marker hợp lệ và sidebar mở.
3. `chatgpt-panel.js` giữ ChatGPT route/prompt flow, còn `LHN_AI_PANEL` điều hướng Gemini/Claude theo exact source mapping và saved conversation route; passive `context-switch` navigates to the mapped conversation or provider start route.
4. `LHN_AI_PANEL` gửi fill/clear/focus/context/submit message tới provider origin. Gemini/Claude content workflow giữ URL khỏi draft, inject khi Send, và report conversation mapping sau confirmed send.
5. Shared auto-send preference áp dụng cho explicit Keepit actions trên ChatGPT/Gemini/Claude; user-written prompts still require user Send. ChatGPT may use `?q=`; Gemini/Claude use separate workflow.
6. Legacy Grok auth-frame detection remains Chromium-only; no Grok tab/button is exposed.

## 4. Hợp đồng và quy tắc cần giữ

- Registry sở hữu ID/URL/host/origin; không nhận hostname từ page message. Bridge kiểm tra `event.source`, extension origin, provider ID và response origin.
- `ai-fill.js` generic editor fill itself does not submit. Separate Gemini/Claude workflow injects exact source URL only at Send and maps only after confirmed send.
- Mapping uses exact source URL and validated provider route; no global last-chat fallback. Same-tab source URL updates send a provider-specific context switch; mapped conversations are routed in Chromium and Firefox, otherwise the provider start route is used.
- Opt-in auto-send is limited to explicit Keepit actions. User-written prompts are never auto-sent. Manual Gemini/Claude Send appends the localized label + exact URL only at send time, including mapped sources, and sends only while the exact editor text remains stable.
- ChatGPT `?q=` and ChatGPT-specific prompt route remain separate; Grok is excluded from visible provider tabs.
- Provider state ở `storage.session` theo window, không có global last-chat. Source change giữ source link và clear composer cũ theo request.
- DNR chỉ áp dụng cho subframe trên allowlist host provider; không dùng rule toàn URL hoặc thêm Google auth. Firefox điều hướng top-level.
- Giữ toolbar geometry/palette đã duyệt: bar 25px, tabs 32px, tab 30px, source link xanh, light/dark; auto-send hiện với từng tab ChatGPT/Gemini/Claude.

## 5. Kiểm tra và xác minh

- `node --test tests/ai-panel-v3.5.108.test.js` — 7/7 PASS, covering URL-only source updates, selected-provider mapped routes and stable send guards.
- Full provider route/browser checks, Firefox build transform, docs structure, `git diff --check` and final ZIP integrity/version/content assertions remain pending.
- Browser QA pending: visible tabs/controls, source-route mapping, typed/Keepit send-time URL insertion, opt-in auto-send, source change, Firefox routing, live selectors, ChatGPT regressions and legacy Grok auth behavior.
