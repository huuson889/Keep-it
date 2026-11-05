# Content — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Content scripts cung cấp page UI và editor bridge cho AI providers. `ai-fill.js` thao tác composer; `chatgpt-autofill.js` giữ ChatGPT flow; `ai-provider-workflow.js` xử lý Gemini/Claude Send và mapping. Grok tab bị ẩn; auth-frame detector legacy vẫn tồn tại. Không đọc page body hoặc trường đăng nhập.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Provider host matches và script order. |
| [`js/content/ai-fill.js`](../../js/content/ai-fill.js) | `LHN_AI_FILL` | Editor selectors/operations, panel context, Firefox toolbar. |
| [`js/content/ai-provider-workflow.js`](../../js/content/ai-provider-workflow.js) | `LHN_AI_PROVIDER_WORKFLOW` | Gemini/Claude Send, URL injection, opt-in submit, mapping report. |
| [`js/content/chatgpt-autofill.js`](../../js/content/chatgpt-autofill.js) | request listeners | ChatGPT prompt, mapping and send workflow. |
| [`js/content/grok-google-auth.js`](../../js/content/grok-google-auth.js) | auth-frame message | Validates embedded Google/Grok ancestor origins. |
| [`js/content/chatgpt-link-marker.js`](../../js/content/chatgpt-link-marker.js) | marker capture | Keeps ChatGPT source markers before URL rewrite. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Page settings, selection and messages. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Page sidebar controls. |

## 3. Luồng chính

1. `ai-fill.js` chạy sớm để cung cấp `LHN_AI_FILL`; Chromium toolbar ở extension parent, Firefox toolbar cần marker và sidebar mở.
2. Parent gửi fill/clear/focus/context/submit tới provider origin. Generic fill chỉ sửa editor; submit chỉ được cấp cho Keepit auto-send mode hợp lệ.
3. Gemini/Claude draft bỏ URL khi auto-send tắt. Khi user bấm Send/Enter, workflow xin localized label + exact URL, gắn vào prompt tại thời điểm gửi khi source chưa map (source đã map gửi nguyên prompt như ChatGPT), rồi chờ editor hiển thị chính xác cùng ổn định qua nhiều lần đọc trước khi click.
4. Nếu source/editor đổi, update thất bại hoặc exact prompt không còn hiện diện, workflow không gửi và từ chối pending request. Chỉ sau confirmed send—conversation URL hợp lệ và composer trống—workflow báo `AI_PROVIDER_LINK_RESULT` để Background lưu mapping.
5. Firefox dùng top-level route/marker; `ai-fill.js` điều hướng tới mapped route và chỉ submit mode opt-in.
6. ChatGPT flow ở `chatgpt-autofill.js`; Grok auth detector chỉ giữ origin validation.

## 4. Hợp đồng và quy tắc cần giữ

- Selectors theo host tập trung trong fill module; chỉ thao tác editor trên provider allowlist, không truy vấn body/title/clipboard.
- `ai-fill.js` generic fill tự nó không submit. Workflow riêng chỉ có thể auto-send Keepit action khi opt-in và composer vẫn khớp chính xác với prompt action; text người dùng sửa/tự gõ không bao giờ bị auto-send.
- Gemini/Claude giữ URL ngoài draft đến lúc user Send; manual prompt trên source chưa map, gồm prompt tự gõ, nhận localized label + exact current URL; source đã map không thêm URL. `ai-fill.js` (ChatGPT/Gemini/Claude iframe Chromium) post `KEEPIT_AI_PANEL_CONVERSATION` với route đã chuẩn hóa tới extension origin mỗi khi SPA đổi URL; Firefox dùng chung `planPanelNavigation()`. Click Send chỉ khi editor còn đúng prompt dự kiến sau thời gian ổn định; nếu không, không gửi URL-less prompt và không lưu mapping.
- Không lưu/khôi phục unsent draft. Keepit prompt/selection là request tạm, không phải user composer content.
- ChatGPT `?q=` riêng; visible tabs chỉ ChatGPT/Gemini/Claude. Grok integration còn nhưng ẩn.
- Firefox toolbar cần panel marker + sidebar-open; nested frames không nhận editor bridge.
- Giữ HTTPS/host checks, request ID, expiry và source-change clear.

## 5. Kiểm tra và xác minh

- `node --test tests/` — 15/15 PASS, gồm route reporter iframe, shared stay/reload/load, mapped source không thêm URL, unstable editor no-click/no-map, mapping only after confirmation.
- Full all-JS syntax, Firefox build transform, docs structure and final archive checks remain pending. Live Gemini/Claude editor behavior and authenticated browser QA are not yet verified.
- Browser QA Chromium/Firefox pending: provider tabs, send-time URL injection, opt-in auto-send, exact mapping/reopen, source switch, selectors, ChatGPT regression và legacy Grok auth behavior.
