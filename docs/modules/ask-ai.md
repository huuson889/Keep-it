# Ask AI — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Ask AI gom toàn bộ AI panel: provider registry, panel Chromium/Firefox, script chạy trong trang ChatGPT/Gemini/Claude và background service. Tabs hiển thị ChatGPT, Gemini, Claude; Grok còn trong registry/auth handling nhưng bị ẩn. Ba AI dùng **một pipeline chung theo đúng hành vi ChatGPT**; khác biệt giữa AI chỉ nằm trong dữ liệu registry (selector, URL hội thoại, `?q=` của ChatGPT). Module không đọc page body/title, clipboard hay credentials và không lưu/khôi phục unsent draft.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`js/ask-ai/providers.js`](../../js/ask-ai/providers.js) | `LHN_AI_PROVIDERS` | Registry: ID/URL/origin/host, `conversationMapKey`, selector composer/Send/new chat, `queryPrompt` (chỉ ChatGPT); `normalizeConversationUrl`, `panelRoute`, `panelTarget`, `linkTarget`, `planPanelNavigation`, `panelUrl`/`readPanelMarkers`, `pickSelectedProvider`. |
| [`js/ask-ai/prompt-format.js`](../../js/ask-ai/prompt-format.js) | `LHN_AI_PROMPT_FORMAT` | Nhãn website localized + exact URL + prompt (`formatLinkPrompt`). Nạp ở background (Chromium `importScripts`, Firefox `background.scripts`) và trang AI. |
| [`js/ask-ai/toolbar.js`](../../js/ask-ai/toolbar.js) | `LHN_AI_TOOLBAR.create` | Source link, nút sao chép liên kết (chỉ ghi URL nguồn khi bấm, toast + hiệu ứng đã chép), provider tabs, opt-in auto-send. Dùng ở panel Chromium và trang AI trong sidebar Firefox. |
| [`js/ask-ai/service.js`](../../js/ask-ai/service.js) | `handleAskAIMessage`, `ASK_AI_MESSAGE_TYPES`, `cleanupAskAIStorage` | Background: panel lifecycle, provider theo window, source context, mapping, link request, context menu, `Alt+X`, DNR 9002. |
| [`js/ask-ai/panel/panel.js`](../../js/ask-ai/panel/panel.js) | panel controller | Một hàm navigate cho mọi AI: route session → mapping → start; Chromium iframe, Firefox chuyển top-level. |
| [`js/ask-ai/page/composer.js`](../../js/ask-ai/page/composer.js) | `LHN_AI_COMPOSER` | Editor bridge (tìm/điền/xoá/focus, tìm nút Send/new chat), marker trong `sessionStorage`, route reporter `KEEPIT_AI_PANEL_CONVERSATION` (Chromium), toolbar Firefox. |
| [`js/ask-ai/page/send-flow.js`](../../js/ask-ai/page/send-flow.js) | request listeners | Send/link/mapping chung: draft, auto-send opt-in, follow-up, chèn URL lúc Send, báo kết quả, route context, điều hướng Firefox. |
| [`js/ask-ai/page/chatgpt-link-marker.js`](../../js/ask-ai/page/chatgpt-link-marker.js) | early marker | Chỉ ChatGPT: ghi request của link `?q=` trước khi trang đổi URL. |
| [`js/ask-ai/page/grok-google-auth.js`](../../js/ask-ai/page/grok-google-auth.js) | auth-frame detector | Giữ nguyên cho Grok (ẩn). |
| [`pages/ai-panel-chromium.html`](../../pages/ai-panel-chromium.html), [`pages/ai-panel-firefox.html`](../../pages/ai-panel-firefox.html) | panel shells | Chromium iframe + toolbar; Firefox sidebar top-level. |

## 3. Luồng chính

1. `service.js` nạp trước `js/background/background.js` (chung global scope); router chuyển các type trong `ASK_AI_MESSAGE_TYPES` cho `handleAskAIMessage`.
2. `Alt+X`, nút Hỏi AI (`OPEN_AI_PANEL`) và context menu gọi `openAIPanel`/`queueAILinkPanelFlow`. Lookup dùng `conversationMapKey` của AI đang chọn; prompt giống nhau cho mọi AI. Source chưa map: draft không có URL; auto-send opt-in thì prompt có nhãn + URL, ChatGPT đi bằng `?q=`, Gemini/Claude do `send-flow.js` gõ và gửi.
3. Panel mở AI theo `pickSelectedProvider`: window (`storage.session`) → lựa chọn gần nhất (`storage.local`) → ChatGPT. Đích: route session cùng source + cùng AI → mapping → trang start.
4. Request điều hướng (`keepitAiPanelNavigationRequest`) đi qua `planPanelNavigation` (stay/reload/load) cho cả ba AI; cùng route + cùng source thì đánh thức trang (`KEEPIT_AI_PANEL_FOLLOWUP_REQUEST`) thay vì tải lại.
5. Manual Send: `AI_LINK_PREPARE` → source đã map gửi nguyên văn; chưa map thì thêm nhãn localized + exact URL rồi mới gửi. Prompt tự gõ không bao giờ auto-send.
6. Sau Send xác nhận, trang gửi `AI_LINK_RESULT`; `completeAILinkRequest` kiểm tra request + AI người gửi rồi lưu vào đúng key mapping của AI đó và báo `AI_PANEL_RESULT` cho tab nguồn.
7. Đổi source thụ động (debounce 2 giây) chỉ đổi context và xoá composer cũ; không tạo prompt hay gửi. Trang báo `AI_PANEL_ROUTE_CONTEXT {providerId, sourceUrl, chatUrl}` để mở lại đúng chat.

## 4. Hợp đồng và quy tắc cần giữ

- Storage `local`: mapping `keepitChatGPTConversationBySourceUrl`, `keepitGeminiConversationBySourceUrl`, `keepitClaudeConversationBySourceUrl` (giữ tên cũ để không mất dữ liệu); `keepitAiPanelLastProvider`; request ngắn hạn `keepitAiLinkPending`, `keepitAiPanelNavigationRequest`. `session`: `keepitAiPanelProviderByWindow`, `keepitAiPanelOpenWindowIds`, `keepitAiPanelSourceUrlByWindow`, `keepitAiPanelRouteContextByWindow`.
- Khi cài/cập nhật, `cleanupAskAIStorage` xoá request cũ `keepitChatGPT*` (link/navigation/draft/last chat) và request ngắn hạn; không xoá mapping.
- Giữ tên: command `open-chatgpt-sidepanel`, settings `chatGPTAutoSend`/`chatGPTSummaryPrompt`/`chatGPTAskPrompt`, `LHN_CHATGPT_PROMPTS`, id/class sidebar `lhn-sidebar-chatgpt-panel`, key i18n.
- Message tới content: `AI_PANEL_VISIBILITY`, `AI_PANEL_OPEN_FAILED`, `AI_PANEL_TOGGLED_CLOSED`, `AI_LINK_PANEL_QUEUED`, `AI_LINK_PANEL_FAILED`, `AI_PANEL_RESULT`.
- Registry sở hữu ID/URL/origin; bridge kiểm tra `event.source`, origin và provider. Request của AI khác bị bỏ qua; kết quả từ AI khác trả `stale` và không map.
- Generic fill không submit. Gửi chỉ khi editor còn đúng prompt dự kiến sau thời gian ổn định; nếu không, không gửi và không map. Mapping chỉ sau confirmed send; không global last-chat.
- `Alt+X` dùng cửa sổ của tab mà trình duyệt gửi kèm `onCommand(command, tab)`; không dựa vào cửa sổ focus nhớ trong bộ nhớ (mất khi service worker khởi động lại) hay `WINDOW_ID_CURRENT` (không đóng được panel). `sidePanel.open()` vẫn gọi đồng bộ trong gesture.
- `service.js` chỉ đọc `CONFIG` khi được gọi; top-level không phụ thuộc biến khai báo trong `background.js`. Danh sách `importScripts` Chromium phải trùng `background.scripts` Firefox.
- DNR 9002 chỉ áp subframe trên allowlist provider; không thêm quyền, Google auth hay bypass CSP/XFO.

## 5. Kiểm tra và xác minh

- Đã chạy (ngoài repo, không commit): jsdom trang AI (auto-send, draft, Send tay có/không map, request sai AI, `?q=` ChatGPT, tab thường, điều hướng Firefox); VM service (prompt/đích theo AI, mapping đúng key, sender sai AI, route context, dọn storage); jsdom panel (route/mapping/start, follow-up tại chỗ, reload khi đổi source, Firefox); VM nạp background theo manifest so bản trước — cùng listener, `sidePanel.open` đồng bộ; Firefox build.
- Đề xuất: QA Chromium/Firefox cho mở panel, đổi tab AI, đổi source, Hỏi AI/context menu, Send/mapping cho cả ba AI.
