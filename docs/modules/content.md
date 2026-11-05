# Content — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Content scripts cung cấp UI và hành vi trên website: selection, highlight, note, Reader và editor bridge cho AI providers. `ai-fill.js` sở hữu thao tác tìm/fill/clear/focus composer dùng chung; `chatgpt-autofill.js` giữ nguyên workflow ChatGPT-specific như mapping, route, prompt format và auto-send đã opt-in. Một script riêng chỉ quan sát frame Google sign-in nhúng bên trong Grok trong Chromium AI panel và gửi các origin cần xác thực cho Background; không đọc nội dung trang hoặc trường đăng nhập.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Match provider hosts và thứ tự document-start/document-idle. |
| [`js/content/ai-fill.js`](../../js/content/ai-fill.js) | `LHN_AI_FILL` | Selectors bốn provider (Grok có textarea fallbacks); editor operation và Firefox toolbar. |
| [`js/content/chatgpt-autofill.js`](../../js/content/chatgpt-autofill.js) | request/route listeners | ChatGPT query/follow-up, mapping, route reporting và send workflow. |
| [`js/content/grok-google-auth.js`](../../js/content/grok-google-auth.js) | `AI_PANEL_GROK_AUTH_FRAME_DETECTED` | Chỉ khi Google sign-in frame được nhúng trong Grok và AI panel, gửi frame/ancestor origins để Background mở Grok top-level. |
| [`js/content/chatgpt-link-marker.js`](../../js/content/chatgpt-link-marker.js) | document-start marker capture | Giữ ChatGPT request/source marker trước app URL rewrite. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings, selection, UI và message listeners. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Sidebar tabs và controls. |

## 3. Luồng chính

1. `ai-fill.js` chạy sớm trên bốn AI host để nhận diện panel marker và cung cấp `LHN_AI_FILL`; ở Chromium iframe, toolbar nằm ở extension parent. Trên Firefox, script chỉ tạo toolbar nếu URL/session/referrer marker hợp lệ và native sidebar đang mở.
2. Chromium parent gửi `KEEPIT_AI_FILL`, `KEEPIT_AI_CLEAR` hoặc `KEEPIT_AI_FOCUS` tới đúng provider origin. Content script kiểm tra parent source/origin/provider ID, thao tác trên editor tương ứng rồi trả kết quả; không gửi form.
3. Firefox toolbar chọn provider bằng top-level navigation và mang theo marker/source URL. Khi background tạo navigation request cho provider khác ChatGPT, `ai-fill.js` đọc request/pending prompt, chuyển trang nếu cần, fill editor rồi dọn request.
4. ChatGPT vẫn dùng `chatgpt-autofill.js` cho `?q=`, mapped follow-up, source mapping, focus-after-send và existing auto-send contract. Các helper editor trong file này ủy quyền cho `LHN_AI_FILL`.
5. `grok-google-auth.js` chỉ chạy hành động trên Chromium (`chrome-extension:`), tại `accounts.google.com` frame có ancestry chứa Grok và extension origin; nó gửi `AI_PANEL_GROK_AUTH_FRAME_DETECTED`. Không truyền URL auth/credentials; Firefox được thoát sớm và không thay đổi hành vi.
6. `CHATGPT_PANEL_SOURCE_CONTEXT` và route reports đồng bộ source metadata; passive context switch không tự tạo prompt/send. Source change theo request có thể clear editor cũ trước khi provider nhận prompt mới.

## 4. Hợp đồng và quy tắc cần giữ

- Selectors theo host chỉ nằm trong một shared fill module; mọi thao tác chỉ trên editor của host đã allowlist. Không truy vấn body/title/clipboard.
- Generic fill phải thay composer text, focus nếu được yêu cầu và phát input/change phù hợp; tuyệt đối không click Send, nhấn Enter hoặc submit form.
- Không lưu hoặc khôi phục unsent composer drafts. Pending prompt/selection là request action tạm, không phải nội dung composer người dùng.
- Giữ ChatGPT-specific validation, source→conversation mapping, localized prompt formatting, route watcher và auto-send opt-in chỉ trong ChatGPT workflow; không áp dụng cho Gemini, Claude hay Grok.
- Firefox ordinary AI tabs không được có Keepit toolbar; yêu cầu panel marker cộng với trạng thái sidebar đang mở. Nested frames không được nhận toolbar/editor bridge.
- Keep URL scheme/provider origin checks, request ID matching, source supersession, expiry và clear behavior khi đổi source.

## 5. Kiểm tra và xác minh

- Editor VM: bốn provider find/fill/clear/focus/no-submit; Grok selector fallback; Firefox sidebar pending/lifecycle — PASS. Grok auth detector VM: valid Chromium frame chain signals, while wrong ancestor, top-level, and `moz-extension:` no-op — PASS.
- All-JS `node --check` — PASS; live provider selectors/editor behavior remain unverified.
- Browser QA Chromium/Firefox pending: automatic Grok auth tab, manual fallback, selector/editor behavior, provider switching, source change, and ChatGPT mapping/auto-send regressions.
