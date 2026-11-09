# Keepit — Store submission notes (internal draft, v3.5.136)

> Internal. Prepared for later submission; not submitted. Re-check every store form at submission time. Data details: `DATA-INVENTORY.md`. Policy text: `PRIVACY-POLICY.md`.

## 1. Listing

| Field | Value | Limit |
| --- | --- | --- |
| Name (manifest) | Keepit - Translate, Learn, Ask AI | 33 / 75 (CWS), 33 / 50 (AMO) |
| Short description (manifest) | Translate web pages bilingually. Highlights, notes, dictionary, video player, Ask AI, speaking and listening practice, flashcards. | 130 / 132 (CWS) |
| Slogan | Keep Exploring Everything | — |
| Category | Education (CWS) / Language Support or Education (AMO) — decide at submission | — |
| Privacy policy URL | `[PUBLIC HTTPS URL]` (user task at submission) | — |
| Screenshots | 1280×800 (user task at submission) | — |

## 2. Single purpose (CWS)

**Keepit helps users understand, learn from, and retain information from web content.**

| Feature | How it serves the purpose |
| --- | --- |
| Bilingual translation, Bilingual Reader, translated captions | Understand page/video content |
| Dictionary popup, read aloud | Understand words and pronunciation |
| Highlights, notes, Dashboard library | Retain information from pages |
| Video player, dictation, speaking practice, flashcards | Learn from web content |
| AI panel / Ask AI (selection + page address) | Understand content by asking about it |

## 3. Permission justifications (CWS)

| Permission | Justification |
| --- | --- |
| Host `<all_urls>` / content scripts on all sites | Highlighting, notes, translation, dictionary and Ask AI work on any page the user chooses to read; the user decides where to use them. |
| Named translation hosts, Google Fonts hosts | Translation requests and the interface font. |
| `storage`, `unlimitedStorage` | Store highlights, notes, flashcards, settings and translation/caption caches locally; libraries can exceed the default quota. |
| `activeTab`, `tabs` | Know the current page's address and title for notes and the AI panel, open the Dashboard, switch to the correct tab, and — on touch screens — move to the previous / next tab when a back / forward swipe goes past the page history. |
| `sidePanel` | Show the AI panel in Chrome's side panel. |
| `contextMenus` | Right-click "Ask AI" on selected text. |
| `declarativeNetRequest` | (1) Set the Referer on Google text-to-speech requests so read-aloud works; (2) allow the user-chosen AI websites to display inside the AI panel by removing their frame-protection headers when framed. |
| Remote code | None. All scripts are packaged; no eval, no remote scripts. |

## 4. CWS Privacy practices — Data usage answers

| Data category | Collected? | Reason |
| --- | --- | --- |
| Personally identifiable information | No | — |
| Health information | No | — |
| Financial and payment information | No | — |
| Authentication information | No | — |
| Personal communications | No | — |
| Location | No | — |
| Web history | **Yes** | Page address sent to the chosen AI with the user's message; YouTube video ID sent to YouTube for captions |
| User activity | No | — |
| Website content | **Yes** | Selected text/passages sent to translation, dictionary, read-aloud and the chosen AI when the user uses those features |

Certifications (all three): not sold to third parties; not used or transferred for purposes unrelated to the single purpose; not used or transferred to determine creditworthiness or for lending.

## 5. Firefox (AMO)

- `gecko.id` `{d3706e53-29aa-4415-b396-c60e6903ec09}` (permanent once listed); `strict_min_version` 147.0.
- `data_collection_permissions.required`: `websiteContent`, `browsingActivity`. No `optional`.
- **Known conflict:** AMO policy §4.4 — "Add-ons must not relax web page security headers, such as the Content Security Policy." Network rule 9002 removes `X-Frame-Options` and `Content-Security-Policy` from the AI provider pages when framed (needed for the AI panel). Kept in v3.5.136 by user decision; AMO may reject on this point. Resolve before AMO submission.
- Expected linter warnings: Chromium-only keys (see `PROJECT.md` v3.5.136 entry for the actual linter run).

## 6. Compliance checklist (v3.5.136 review)

| Item | Result | Note |
| --- | --- | --- |
| `<all_urls>` | phù hợp | Core features run on any page the user chooses; justification above |
| DNR 9001 Referer (Chrome only) | phù hợp | Single request type; Mozilla Q&A: setting Referer is not relaxing security headers |
| DNR 9002 header removal | **xung đột** (AMO §4.4); CWS chưa xác minh | Kept by user decision |
| Google Fonts on every page | chưa xác minh (referrer) | Disclosed in policy; no page content sent |
| `postMessage` | phù hợp | Data messages use a specific target origin; the only `"*"` message is a ping without data |
| `sessionStorage` / address fragment (source URL) | phù hợp after disclosure | AI page can read the source URL before Send — disclosed in policy |
| Source URL to AI | phù hợp | Sent with the user's message at Send; disclosed |
| Remote code | phù hợp | No eval / `new Function` / dynamic `import()` / remote scripts / `executeScript` strings |
| Third-party image / icon services | phù hợp | Unsplash bundled; Google favicon service removed |
