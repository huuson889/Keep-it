# Background — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Background điều phối runtime messages, provider state, panel lifecycle và request storage. AI panel hiển thị ChatGPT, Gemini, Claude; Grok còn trong registry/auth handling nhưng không còn là tab chọn được. Ba provider hiển thị dùng exact source→conversation mapping và cùng opt-in setting cho Keepit actions. Background không đọc page body/title, composer draft, clipboard hay credentials.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `background`, `content_scripts` | Khai báo worker/page và thứ tự nạp registry. |
| [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING.onMessage` | Provider state, source mapping, request validation và DNR. |
| [`js/shared/ai-providers.js`](../../js/shared/ai-providers.js) | `LHN_AI_PROVIDERS` | Provider allowlist, host checks và route normalization. |
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Runtime message API dùng chung. |

## 3. Luồng chính

1. Manifest/background nạp `ai-providers.js` trước message handler; mọi provider ID được kiểm tra qua registry.
2. `AI_PANEL_PROVIDER_SELECTED` lưu provider ID theo window trong `storage.session`; panel action nhận provider hiện hành.
3. `OPEN_CHATGPT_LINK_PANEL` lấy exact source URL, selection tường minh và prompt settings; mapping lookup dùng key riêng theo ChatGPT, Gemini hoặc Claude.
4. Gemini/Claude draft không chứa URL. Khi user gửi, `AI_PROVIDER_MANUAL_LINK_PREPARE` tạo metadata ngắn hạn; Content chỉ thêm localized website label + exact URL nếu source chưa map.
5. `AI_PROVIDER_LINK_RESULT` xác thực request/provider/source/route rồi lưu mapping sau confirmed send. Auto-send chỉ dành cho Keepit action khi setting opt-in; prompt tự gõ không auto-send.
6. Grok auth-frame handler giữ origin validation và top-level handoff legacy. DNR rule 9002 chỉ áp response headers cho subframe trên provider allowlist; Firefox dùng sidebar top-level.

## 4. Hợp đồng và quy tắc cần giữ

- Mapping key là exact source URL; chỉ chấp nhận HTTPS conversation route `/c/<id>`, `/app/<id>` hoặc `/chat/<id>` tương ứng provider.
- Không dùng global last-chat fallback; mapping/route không chứa prompt hoặc composer text.
- Manual-send request chỉ lưu provider/source/request/window/expiry; không lưu text user viết.
- `AI_PROVIDER_LINK_RESULT` phải khớp pending request, sender provider, source URL và window khi có; route được sanitize trước khi lưu.
- Keepit prompt/selection là request tạm, không phải composer draft. Không đọc body/title/clipboard, không thêm quyền hoặc DNR scope.

## 5. Kiểm tra và xác minh

- v3.5.107 đã chạy all-JS syntax, manifest/script/permission/DNR assertions, provider registry/queue route VM, AI panel mapped-route VM, background mapping VM và Gemini/Claude send workflow VM — PASS.
- Firefox transform, `git diff --check` và staging ZIP integrity/version/content checks — PASS. Final release ZIP vẫn cần build và verify.
- Real Chromium/Firefox browser QA pending: iframe/sidebar, provider selectors, source switching, send confirmation, opt-in behavior và ChatGPT regressions. Browser QA người dùng vẫn là nguồn sự thật.
