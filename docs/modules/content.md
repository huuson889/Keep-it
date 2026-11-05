# Content — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Content scripts cung cấp UI và hành vi trên website: selection, highlight, note, Reader và editor bridge cho AI providers. `ai-fill.js` sở hữu thao tác tìm/fill/clear/focus composer dùng chung; `chatgpt-autofill.js` giữ nguyên workflow ChatGPT-specific như mapping, route, prompt format và auto-send đã opt-in.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `content_scripts` | Match provider hosts và thứ tự document-start/document-idle. |
| [`js/content/ai-fill.js`](../../js/content/ai-fill.js) | `LHN_AI_FILL` | Selectors bốn provider (Grok có textarea fallbacks); editor operation và Firefox toolbar. |
| [`js/content/grok-google-auth.js`](../../js/content/grok-google-auth.js) | Google iframe handoff | Nhận diện Google sign-in chỉ khi iframe có extension origin trong ancestor chain; yêu cầu background mở popup. |
| [`js/content/chatgpt-autofill.js`](../../js/content/chatgpt-autofill.js) | request/route listeners | ChatGPT query/follow-up, mapping, route reporting và send workflow. |
| [`js/content/chatgpt-link-marker.js`](../../js/content/chatgpt-link-marker.js) | document-start marker capture | Giữ ChatGPT request/source marker trước app URL rewrite. |
| [`js/content/content.js`](../../js/content/content.js) | IIFE controller | Settings, selection, UI và message listeners. |
| [`js/content/sidebar.js`](../../js/content/sidebar.js) | `LHN_SIDEBAR.create` | Sidebar tabs và controls. |

## 3. Luồng chính

1. `ai-fill.js` chạy sớm trên bốn AI host để nhận diện panel marker và cung cấp `LHN_AI_FILL`; ở Chromium iframe, toolbar nằm ở extension parent. Trên Firefox, script chỉ tạo toolbar nếu URL/session/referrer marker hợp lệ và native sidebar đang mở.
2. Chromium parent gửi `KEEPIT_AI_FILL`, `KEEPIT_AI_CLEAR` hoặc `KEEPIT_AI_FOCUS` tới đúng provider origin. Content script kiểm tra parent source/origin/provider ID, thao tác trên editor tương ứng rồi trả kết quả; không gửi form.
3. Firefox toolbar chọn provider bằng top-level navigation và mang theo marker/source URL. Khi background tạo navigation request cho provider khác ChatGPT, `ai-fill.js` đọc request/pending prompt, chuyển trang nếu cần, fill editor rồi dọn request.
4. ChatGPT vẫn dùng `chatgpt-autofill.js` cho `?q=`, mapped follow-up, source mapping, focus-after-send và existing auto-send contract. Các helper editor trong file này ủy quyền cho `LHN_AI_FILL`.
5. `CHATGPT_PANEL_SOURCE_CONTEXT` và route reports đồng bộ source metadata; passive context switch không tự tạo prompt/send. Source change theo request có thể clear editor cũ trước khi provider nhận prompt mới.
6. `grok-google-auth.js` chạy riêng trên `accounts.google.com`; chỉ gửi URL hiện tại/referrer lên background khi tài liệu là iframe và `location.ancestorOrigins` có origin của extension. Nó không đọc form Google, mật khẩu hay mã xác thực; popup không được mở cho Google sign-in ở tab thường.

## 4. Hợp đồng và quy tắc cần giữ

- Selectors theo host chỉ nằm trong một shared fill module; mọi thao tác chỉ trên editor của host đã allowlist. Không truy vấn body/title/clipboard.
- Generic fill phải thay composer text, focus nếu được yêu cầu và phát input/change phù hợp; tuyệt đối không click Send, nhấn Enter hoặc submit form.
- Không lưu hoặc khôi phục unsent composer drafts. Pending prompt/selection là request action tạm, không phải nội dung composer người dùng.
- Giữ ChatGPT-specific validation, source→conversation mapping, localized prompt formatting, route watcher và auto-send opt-in chỉ trong ChatGPT workflow; không áp dụng cho Gemini, Claude hay Grok.
- Firefox ordinary AI tabs không được có Keepit toolbar; yêu cầu panel marker cộng với trạng thái sidebar đang mở. Nested frames không được nhận toolbar/editor bridge.
- Keep URL scheme/provider origin checks, request ID matching, source supersession, expiry và clear behavior khi đổi source.
- Google-auth content script chỉ chạy ở `accounts.google.com` và yêu cầu extension origin trong ancestor chain; không thay đổi editor fill rules hay thao tác sign-in form.

## 5. Kiểm tra và xác minh

- Editor VM: bốn provider find/fill/clear/focus/no-submit; Grok selector fallback; Firefox sidebar pending/lifecycle — PASS. Google auth handoff VM xác nhận top-level/non-extension frame không gửi request, extension-embedded Google iframe gửi đúng request — PASS. All-JS `node --check` — PASS.
- Chưa xác nhận selectors trên DOM hiện hành của website hay contenteditable/controlled-input behavior.
- Browser QA Chrome/Firefox chưa chạy: cần xác nhận selector/editor fill/clear/focus trên từng host, Google popup/callback, iframe session persistence, provider switching, source change và ChatGPT mapping/auto-send regressions.
