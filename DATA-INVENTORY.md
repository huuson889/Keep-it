# Keepit — Data Inventory (internal, v3.5.161)

> Internal review file for the test ZIP. **Remove from public release copies.** Lists only data type, recipient, purpose and code location — no endpoints, payloads, tokens or internal logic.

Classification: **required** = sent when the user uses the feature (Firefox `required`, shown at install) · **optional** = needs separate consent (none in v3.5.136) · **ngừng gửi** = removed in v3.5.136 · **none** = not data collection (local only, or a page/resource the user opens).

## 1. Data sent outside the browser

| # | Data type | Recipient | Purpose / trigger | Class | Firefox category | Chrome Dashboard | Code |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Selected text, note quote, Bilingual Reader / caption passages, target language | Google Translate; MyMemory; Lingva (2 public instances, independent operators) — the same text goes to these services in parallel and the first answer is used | Translation when the user selects text, creates a note with auto-translate on, uses Bilingual Reader or translated captions | required | websiteContent | Website content | `js/translate/translate.js:18`, `:20`, `:21` |
| 2 | Text sample (≤200 chars) | Google Translate | Detect language before reading aloud (user presses read) | required | websiteContent | Website content | `js/translate/translate.js:44`, `js/reader/tts-engine.js:73` |
| 3 | Looked-up word / root, language; the word's dictionary example sentences (public text from Free Dictionary, sent for translation) | Google Translate; MyMemory; Free Dictionary API; Datamuse | Dictionary popup: meaning, IPA, example sentences, synonyms, word forms, collocations | required | websiteContent | Website content | `js/translate/dictionary.js:37`, `:97`, `:103`, `:136`, `:141`, `:157`, `:185`, `:200` |
| 4 | Flashcard context sentence (from the user's saved note) | Google Translate; MyMemory | Flashcard translation in the Dashboard | required | websiteContent | Website content | `js/translate/study-translation.js:3`, `:90` |
| 5 | Text to be spoken (≤500 chars), language | Google (text-to-speech) | Read aloud with a Google voice | required | websiteContent | Website content | `js/background/background.js:81` |
| 6 | Video ID of the open YouTube video; YouTube cookies may be attached (which ones depends on the browser and sign-in state) | YouTube | Load captions/transcript for the video player and study modes | required | browsingActivity | Web history | `js/background/background.js:161`, `:172`; `js/overlay/source/video.js:874`, `:958` |
| 7 | Video ID | YouTube image server | Video thumbnail | required | browsingActivity | Web history | `js/shared/thumbnails.js:23` |
| 8 | Selected text | ChatGPT (OpenAI), Gemini (Google), Claude (Anthropic); Grok (xAI) tab hidden | Ask AI / Alt+X: text is placed in the AI composer; leaves only when the user presses Send or has opted in to auto-send | required | websiteContent | Website content | `js/ask-ai/service.js:811`, `js/ask-ai/prompt-format.js:4` |
| 9 | Source page URL (exact) + website label | Same AI providers as #8 | Added to the message at Send on an unmapped source. **Also placed in the AI page's address fragment and session storage when the AI panel opens, so the AI page can read it before Send** | required | browsingActivity | Web history | `js/ask-ai/providers.js:307`, `js/ask-ai/page/send-flow.js:47`, `js/ask-ai/panel/panel.js:108` |
| 10 | Microphone audio | The browser's speech-recognition service (Chrome: remote service per MDN; provider not named by MDN). Not available in Firefox 147 | Speaking practice transcript | required (browser API) | — (browser processes; Keepit does not transmit) | Disclose in policy | `js/overlay/study/shadowing/shadowing-activity.js:495` |
| 11 | IP address and standard request headers; referrer not verified | Google Fonts | Inter font for Keepit's UI styles — **loaded on every page where content scripts run**, plus Dashboard pages; extra fonts when custom font / Bilingual Reader is used | none (no user data payload) — disclosed | — | Disclose in policy | `css/shared/ui-tokens.css:1`, `css/dashboard/dictation-stats-popup.css:2`, `js/shared/custom-font.js:24`, `js/reader/bilingual-reader.js:35` |
| 12 | Site origin | The visited website itself | Site icon in Dashboard lists (favicon files on the same site) | none | — | — | `js/shared/site-icons.js:32` |
| 13 | Search word; text / web address typed in the Keepit bar search box | Google Search; YouTube search; the typed website (each opened as a normal tab — APK: the same view — only when the user picks that row) | Definition / video search from Dashboard study views; Keepit bar search popup (Google / YouTube / address rows). No suggestions are fetched while typing | none (user navigation) | — | — | `js/dashboard/dashboard.js:860`, `js/dashboard/study-view.js:165`, `js/content/touch-ui.js:1243`, `js/content/touch-ui.js:1262`, `js/content/touch-ui.js:1263`, `js/content/touch-ui.js:1270` |
| 14 | Page URL in icon request | Google favicon service | Dashboard icon fallback | **ngừng gửi** (removed v3.5.136) | — | — | `js/shared/site-icons.js` (line deleted) |
| 15 | Default thumbnail request | Unsplash | Web source card artwork | **ngừng gửi** (now bundled) | — | — | `js/overlay/source/web.js:499` |

## 2. Data kept only in the browser (not sent by Keepit)

Keepit bar preferences (hidden, compact, back-to-top, gesture switches, sites where page swipe is off) and up to 6 recent bar searches in `lhnBottomBar`, plus the first-run flag `touchBarIntroSeen` (`js/content/touch-ui.js:283`, `js/content/touch-ui.js:1213`); the bar search reads saved notes/highlights and dictation sessions locally only (`js/content/touch-ui.js:1227`). On touch, the page swipe asks the background for whether a previous/next tab exists in the same window and switches to it (`js/background/background.js:118`); only the tab order is read, nothing is stored or sent out. Highlights, notes, page title/URL of annotations, flashcards/study progress, settings, translation/TTS/transcript caches, URL → AI-conversation mapping (after a confirmed send), panel state, local usage counters, demo profile, diagnostic log (codes only). Favourite videos and web pages (video ID or page URL without fragment, title, channel or site name, time added; `js/overlay/view/touch-layout.js:221`, `js/dashboard/dashboard.js:1162`, `js/dashboard/dashboard.js:1172`). Short speaking recordings stay in memory for playback only (`js/overlay/study/shadowing/shadowing-activity.js:313`).

## 3. Network rules that change headers

| Rule | Effect | Scope | Assessment | Code |
| --- | --- | --- | --- | --- |
| 9001 (Chrome only) | Sets `Referer` on Google text-to-speech requests | Only that request type | phù hợp (Mozilla: setting Referer for a single request is not relaxing security headers); not active on Firefox | `js/background/background.js:227` |
| 9002 (Chrome + Firefox) | Removes `X-Frame-Options` and `Content-Security-Policy` from AI provider pages loaded as sub-frames | The 5 AI provider domains, any initiator | **xung đột** with AMO policy §4.4 ("must not relax web page security headers"); kept in v3.5.136 by user decision; CWS: chưa xác minh | `js/ask-ai/service.js:95` |

## 4. Firefox manifest declaration

`browser_specific_settings.gecko.data_collection_permissions.required = ["websiteContent", "browsingActivity"]` — no `optional` (would need new consent code). Source: rows 1–9 above.
