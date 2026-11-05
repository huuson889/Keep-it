# Background — Hướng dẫn kỹ thuật

## 1. Mục đích và phạm vi

Background điều phối runtime messages, provider state, panel lifecycle và request storage. AI panel hiển thị ChatGPT, Gemini, Claude; Grok còn trong registry/auth handling nhưng không còn là tab chọn được. Ba provider hiển thị dùng exact source→conversation mapping và cùng opt-in setting cho Keepit actions. Source tab URL changes lẫn page-load completion đều refresh context theo provider đang chọn. Background không đọc page body/title, composer draft, clipboard hay credentials.

## 2. File chính và điểm vào

| File | Điểm vào/symbol | Vai trò |
|---|---|---|
| [`manifest.json`](../../manifest.json) | `background`, `content_scripts` | Khai báo worker/page và thứ tự nạp registry. |
| [`js/background/background.js`](../../js/background/background.js) | `LHN_MESSAGING.onMessage` | Provider state, source mapping, request validation và DNR. |
| [`js/shared/ai-providers.js`](../../js/shared/ai-providers.js) | `LHN_AI_PROVIDERS` | Provider allowlist, host checks và route normalization. |
| [`js/core/messaging.js`](../../js/core/messaging.js) | `LHN_MESSAGING` | Runtime message API dùng chung. |

## 3. Luồng chính

1. Manifest/background nạp `ai-providers.js` trước message handler; mọi provider ID được kiểm tra qua registry.
2. `AI_PANEL_PROVIDER_SELECTED` → `rememberAIProviderForWindow` lưu provider ID theo window trong `storage.session` và lựa chọn gần nhất trong `storage.local` (`LAST_SELECTED_KEY`). `getAIProviderForWindow` đọc qua `pickSelectedProvider`, cùng thứ tự với panel.
3. `OPEN_CHATGPT_LINK_PANEL` lấy exact source URL, selection tường minh và prompt settings; mapping lookup dùng key riêng theo ChatGPT, Gemini hoặc Claude.
4. Gemini/Claude draft không chứa URL khi auto-send tắt. Với mọi manual Send, kể cả nguồn đã map, `AI_PROVIDER_MANUAL_LINK_PREPARE` trả localized label và exact URL; Content chỉ gắn URL ở thời điểm gửi sau khi editor đã ổn định.
5. `AI_PROVIDER_LINK_RESULT` xác thực request/provider/source/route rồi lưu mapping chỉ sau confirmed send. Editor/source mismatch hoặc text không ổn định thì không bấm Send và request bị từ chối. Auto-send chỉ dành cho Keepit action khi setting opt-in; prompt tự gõ không auto-send.
6. Grok auth-frame handler giữ origin validation và top-level handoff legacy. DNR rule 9002 chỉ áp response headers cho subframe trên provider allowlist; Firefox dùng sidebar top-level.

## 4. Hợp đồng và quy tắc cần giữ

- Mapping key là exact source URL; passive tab update nhận cả `changeInfo.url` lẫn `status === "complete"`, và tra key của provider đang chọn. Chỉ chấp nhận HTTPS conversation route `/c/<id>`, `/app/<id>` hoặc `/chat/<id>` tương ứng provider.
- Không dùng global last-chat fallback; mapping/route không chứa prompt hoặc composer text.
- Manual-send request chỉ lưu provider/source/request/window/expiry; không lưu text user viết.
- `AI_PROVIDER_LINK_RESULT` phải khớp pending request, sender provider, source URL và window khi có; route được sanitize trước khi lưu.
- Keepit prompt/selection là request tạm, không phải composer draft. Không đọc body/title/clipboard, không thêm quyền hoặc DNR scope.

## 5. Kiểm tra và xác minh

- v3.5.108–v3.5.110 `node --test tests/` (19/19 PASS) covers provider memory after session clear,  URL-only/completed tab updates, selected Gemini mapping, context-switch route mode, stable manual editor text and confirmation-only mapping — 7/7 PASS.
- Full release checks, Firefox transform, docs structure, `git diff --check` and final ZIP integrity/version/content checks remain pending.
- Real Chromium/Firefox browser QA pending: iframe/sidebar, provider selectors, source switching, send confirmation, opt-in behavior và ChatGPT regressions. Browser QA người dùng vẫn là nguồn sự thật.
