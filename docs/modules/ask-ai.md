# Ask AI — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Ask AI gom toàn bộ AI panel: provider registry, panel Chromium/Firefox, script chạy trong trang ChatGPT/Gemini/Claude và background service. Tabs hiển thị ChatGPT, Gemini, Claude; Grok còn trong registry/auth handling nhưng bị ẩn. Module không đọc page body/title, clipboard hay credentials và không lưu/khôi phục unsent draft.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/ask-ai/providers.js`](../../js/ask-ai/providers.js) | `LHN_AI_PROVIDERS` | Provider IDs/URLs/origins, `panelRoute`, `planPanelNavigation`, `pickSelectedProvider`. |
| [`js/ask-ai/service.js`](../../js/ask-ai/service.js) | `handleAskAIMessage`, `ASK_AI_MESSAGE_TYPES` | Background: panel lifecycle, provider selection, mapping, link requests, context menu, `Alt+X`, DNR 9002. |
| [`js/ask-ai/panel/ai-panel.js`](../../js/ask-ai/panel/ai-panel.js) | `LHN_AI_PANEL` | Provider state, iframe bridge, `navigateRequest`, `reloadFrame`, `getSavedProvider`. |
| [`js/ask-ai/panel/chatgpt-panel.js`](../../js/ask-ai/panel/chatgpt-panel.js) | panel controller | Mở panel, ChatGPT `?q=`/marker/follow-up; provider khác giao cho `LHN_AI_PANEL`. |
| [`js/ask-ai/panel/ai-toolbar.js`](../../js/ask-ai/panel/ai-toolbar.js) | `LHN_AI_TOOLBAR.create` | Source link, tabs, opt-in auto-send. |
| [`js/ask-ai/page/ai-fill.js`](../../js/ask-ai/page/ai-fill.js) | `LHN_AI_FILL` | Editor bridge, route reporter `KEEPIT_AI_PANEL_CONVERSATION`, Firefox toolbar/navigation. |
| [`js/ask-ai/page/ai-provider-workflow.js`](../../js/ask-ai/page/ai-provider-workflow.js) | `LHN_AI_PROVIDER_WORKFLOW` | Gemini/Claude Send, URL lúc gửi, mapping report. |
| [`js/ask-ai/page/chatgpt-autofill.js`](../../js/ask-ai/page/chatgpt-autofill.js) | request listeners | ChatGPT prompt/send/mapping. |
| [`js/ask-ai/chatgpt-prompt-format.js`](../../js/ask-ai/chatgpt-prompt-format.js) | `LHN_CHATGPT_PROMPT_FORMAT` | Định dạng nhãn + URL + prompt. |
| [`pages/ai-panel-chromium.html`](../../pages/ai-panel-chromium.html), [`pages/ai-panel-firefox.html`](../../pages/ai-panel-firefox.html) | panel shells | Chromium iframe; Firefox sidebar top-level. |

## 3. Luồng chính

1. `service.js` nạp trước `js/background/background.js` (chung global scope); router background chuyển các type trong `ASK_AI_MESSAGE_TYPES` cho `handleAskAIMessage`, cùng thứ tự kiểm tra cũ.
2. `Alt+X`, nút Hỏi AI và context menu gọi `openChatGPTSidePanel`/`queueChatGPTLinkPanelFlow`; mapping lookup dùng key riêng theo provider đang chọn.
3. Panel mở provider theo `pickSelectedProvider`: window (`storage.session`) → lựa chọn gần nhất (`storage.local`) → ChatGPT.
4. Trong Chromium, `ai-fill.js` báo route sống; panel áp `planPanelNavigation` (stay/reload/load) cho cả ba provider. Firefox dùng cùng rule với URL top-level.
5. Manual Send trên source chưa map thêm nhãn localized + exact URL; source đã map gửi nguyên prompt. Mapping chỉ lưu sau confirmed send (`AI_PROVIDER_LINK_RESULT`/`CHATGPT_LINK_RESULT`).
6. Passive source change (debounce 2 giây) chỉ đổi context và clear composer cũ; không tạo prompt hay gửi.

## 4. Hợp đồng và quy tắc cần giữ

- Registry sở hữu ID/URL/origin; bridge kiểm tra `event.source`, origin và provider. Reporter chỉ post tới extension origin.
- Generic fill không submit. Auto-send chỉ cho Keepit action khi opt-in; prompt tự gõ không bao giờ auto-send.
- Gửi chỉ khi editor còn đúng prompt dự kiến sau thời gian ổn định; nếu không, không gửi và không map.
- Mapping key là exact source URL; route chỉ nhận HTTPS `/c/<id>`, `/app/<id>`, `/chat/<id>` theo provider. Không global last-chat.
- `service.js` chỉ đọc `CONFIG` khi được gọi; top-level của nó không được phụ thuộc biến khai báo trong `background.js`.
- Firefox background `scripts` hiện chưa liệt kê `chatgpt-prompt-format.js` (Chromium nạp qua `importScripts`); giữ nguyên tới khi có bản sửa riêng.
- DNR 9002 chỉ áp subframe trên allowlist provider; không thêm quyền, Google auth hay bypass CSP/XFO.

## 5. Kiểm tra và xác minh

- Đã chạy (ngoài repo, không commit): VM mock route/provider-memory/send guards; VM nạp background theo manifest so bản trước khi chuyển — cùng listener, cùng kết quả router, `sidePanel.open` vẫn gọi đồng bộ.
- Đề xuất: `node --check` mọi file, Firefox build transform, QA Chromium/Firefox cho mở panel, đổi tab AI, đổi source, Send/mapping và ChatGPT regression.
