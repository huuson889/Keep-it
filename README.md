# Keepit

Keepit is a browser extension / add-on for Chromium-based browsers (Chrome, Edge, …) and Firefox-based browsers (Firefox, Zen,..). It uses one codebase with Manifest V3; the source `manifest.json` targets Chromium, and `scripts/build_firefox.py` creates a Firefox-ready folder without Chromium-only manifest keys.

Keepit helps you keep learning from anything you read online: highlight text and add notes, translate and look up words, listen to pages read aloud, read paragraphs side by side with their translation, and review your highlights as flashcards.

The interface is available in English, Vietnamese, and Korean, will extend more in future.

## Features

### Highlights and notes
- Select text to open a note composer (configurable), or press the shortcut for the current selection.
- Color highlights with editable notes; hover a highlight to see its note and edit or delete it.
- A page sidebar lists the page's highlights, filters them by color, and jumps to a highlight when you click it.
- `Alt+X` or the ChatGPT tab opens/toggles ChatGPT in a separate browser side panel. Dashboard Settings → Ask AI controls whether prompts send immediately (default on) and lets you edit the final sentence for first-open summaries and Ask AI. On the first use of an exact page URL, the default prompt is `• Website: [URL]\n• Summarize this website` in English, `• Trang web: [URL]\n• Hãy tóm tắt web này` in Vietnamese, or the localized equivalent in Korean. Ask AI uses only the current selection and a language-matched final question; the Vietnamese default is `"[selected text]" Đoạn này trên web nghĩa là sao?`. When auto-send is off, Keepit leaves an unsent prompt in the active ChatGPT composer and saves the URL→conversation mapping only after you send it. Keepit does not save or restore composer drafts by source URL; switching source or recreating the panel may discard unsent text. Automatic tab/source changes wait 2 seconds and do not prompt; explicit Ask AI/Alt+X actions run immediately. Reopening a panel uses only that source’s mapped chat or same-source, route-only session metadata—never a global last-chat URL. Later uses reopen the mapped conversation; Ask AI omits the URL. Right-clicking selected text offers Ask AI in Chromium and Firefox. The ChatGPT panel has a pinned source-page link and tabs for ChatGPT, Gemini, Claude, and Grok; ChatGPT is the default and unintegrated providers show a blank panel. Keepit does not extract or send the full page body or title.
- Highlights are saved per page URL and restored from the exact text and its nearby context.

### Translation and dictionary
- Translate the selected text with a shortcut or a direct translation popup, with optional automatic speech.
- Full English dictionary panel with synonyms and antonyms, word forms, and collocations.
- Translation uses Google, with MyMemory and Lingva as alternatives; Bilingual Reader results are cached locally.

### Bilingual Reader
- `Alt+A`: automatically translate the main-content paragraphs as you scroll.
- `Alt+D`: translate the paragraph nearest to the pointer, anywhere on the page.
- `Alt+R`: read the main content aloud. `Alt+A` and `Alt+R` use the same main-content range; dates, bylines, navigation, ads, and related-article blocks are skipped (powered by Mozilla Readability).
- A reading bar offers play/pause, previous/next paragraph, speed, voice selection, and settings. Auto-scroll, paragraph play icons, and the speed step are configurable.
- The reader can be turned off per website, and you can list page parts it should not read. A starter list of websites where the reader is off is included.

### Video overlay and Dictation
- Video popup translation and read-aloud preferences are stored separately from general settings; both default to on.
- On a regular web page, `Alt+E` opens the Web-study view and starts Reader TTS; when leaving Dictation, it returns to the view and resumes TTS. `Alt+F` opens shared Dictation learning; pressing it again closes the overlay, matching YouTube. Both sites use the same shortcut handlers and toggle logic. Web subtitles use Reader text as the source and the shared translation pipeline for the secondary track. Web Ambient uses the page thumbnail, Web Speaking uses the detected text language or page language, and saved progress links back to the real page URL.
- With the video overlay open on YouTube or Web, shortcuts use one shared dispatcher: `Alt+1/2/3` selects view mode; `1–4` selects subtitle mode; `<`/`>` adjusts speed; `Escape` closes the overlay. `Space`/`K` and the arrow/`J`/`L` keys retain YouTube's native behavior there; in Web-study they control the virtual media and previous/next Reader cue through the shared overlay controls. Web-study and Bilingual Reader cannot run at the same time: opening Web-study stops Reader, and starting Reader closes Web-study.
- On YouTube, open **AI keepit** in the existing overlay to switch it into a three-column exercise. YouTube Dictation remains available only when the active Dual Sub transcript uses English captions.
- In the video **Reading** mode, the toggle beside **X** switches between the video and a mini audio bar; its play/pause control operates the same video.
- Typing mode: listen to the real YouTube video, type each sentence, and press Enter to check. Scoring aligns words and ignores capitalization, punctuation, and curly apostrophes. Unsolved sentences stay blurred; a Vietnamese translation appears after a correct answer.
- Speaking mode: repeat defaults to 0 extra repeats (the initial video cue still plays once). The Sparkles **Auto record** toggle defaults on: after the current cue’s final repeat ends and the video pauses, recording starts after 2 seconds. Auto-started recognition uses one utterance (`continuous = false`); the browser’s `onend` event ends the recording, then Keepit plays the temporary recording and scores the transcript. The browser decides the utterance endpoint; there is no fixed 3-second silence timer. Turn the toggle off to keep fully manual Enter/mic start-stop behavior. The idle status also offers mic/Enter controls; video audio stops while recording and during own-voice playback. During playback, the mic button shows a purple audio icon and pulse matching the mini-play button. The score button is hidden entirely in Speaking mode. The result appears in a tier-colored card with the target sentence and accuracy. Wrong answers can be retried; a pass enables **Next**. Escape replays the original video sentence exactly once and reveals its answer; Escape again resets the current attempt. After revealing, Enter marks it 100%; the next Enter advances.
- Lesson notes and solved-sentence progress are stored locally in `browser.storage.local`, keyed by YouTube video or Web source and sentence. Web session metadata includes the real page URL so you can reopen the source. The short recording is kept in memory only for playback; Keepit does not persist or upload it. The browser's speech-recognition service may process audio according to its own provider/settings. Speaking mode requires browser support for `SpeechRecognition` and `MediaRecorder`; it degrades gracefully when recording/playback is unavailable.

### Text to speech
- Google text-to-speech by default, with an automatic fallback to the browser's own voices.
- Select Voice offers Auto language detection, 21 Google TTS languages, and your browser's installed voices. A flag on the reading bar shows the selected language.
- Pronunciation rules and per-language speech rates are available in Settings.

### Dashboard
- **Highlights & Notes** is the single place to browse and manage locally saved annotations by source page, search and filter them, favorite pages or notes, edit/delete entries, and export as TXT, CSV, Markdown, or JSON; import JSON backups.
- Study mode: flashcards from your highlights with Again / Hard / Good / Easy grading, typed answers, custom flashcards, and definition search.
- Settings: Account, Highlights & Notes, Translate, Speech, Bilingual Reader, Appearance, Keyboard shortcuts, Disable on websites, Notifications, Backup, Upgrade & Billing, Reset, About.

## Keyboard shortcuts

Defaults are listed below. Everything marked customizable can be changed in Dashboard > Settings > Keyboard shortcuts (click the field and press the new keys; `Backspace` clears it). Some of them can also be changed in the toolbar popup.

| Shortcut | Action | Customizable |
| --- | --- | --- |
| `Alt+S` | Open the note popup for the selection | Yes |
| `Alt+Q` | Toggle the page sidebar | Yes |
| `Alt+X` | Toggle ChatGPT panel; first unmapped URL uses the summary prompt (auto-send setting applies), mapped URLs reopen without a prompt | Browser settings |
| `Alt+W` | Translate selected text | Yes |
| `Alt+Z` | Toggle Keepit on this website | Yes |
| `Space` | Pause or resume speech | Yes |
| `Left` / `Right` | Previous / next paragraph while reading | Yes |
| `Up` / `Down` | Increase / decrease reading speed | Yes |
| `Alt+L` | Select voice (opens Select Voice on the reading bar) | Yes |
| `Alt+A` | Auto-translate main content while scrolling | No |
| `Alt+D` | Translate the paragraph near the pointer | No |
| `Alt+R` | Start or stop reading aloud | No |

`Alt+X` can be changed in the browser's extension-shortcut settings, not in Keepit's Dashboard.

The reading-bar keys (`Space`, arrows, `Alt+L`) work while the reader is active and can be turned off in the reader settings.

In Dictation, pressing and releasing `Ctrl` by itself replays the current sentence. In Typing mode, Escape reveals/resets the answer when the answer field is focused. In Speaking mode, Escape replays the video cue and reveals the answer; a second Escape resets the current attempt.

## Install for testing

Chromium-based browsers (Chrome, Edge, Brave, …):
1. Extract the ZIP to a normal folder.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the folder that contains `manifest.json`.

Firefox-based browsers (Firefox, Zen, Floorp,..) (121 or later):
1. From the repository, run `python scripts/build_firefox.py` (or pass `--output /path/to/folder`). This creates a Firefox-ready copy outside the repository, removes Chromium-only `sidePanel` entries, and sets `sidebar_action.open_at_install` to `false`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `manifest.json` inside the generated folder.

Firefox removes temporary add-ons when it restarts; repeat the steps to test again. Your data stays in the browser profile unless you clear extension data, so export a JSON backup from the Dashboard regularly.

## Privacy and permissions

- The current build stores highlights/notes in the extension's IndexedDB and settings/state in `browser.storage.local`. Dictation stores solved-sentence progress, lesson notes, revealed Vietnamese translations, and Web session metadata (including the real source-page URL) in `browser.storage.local`, keyed by YouTube video or Web source and sentence. Speaking auto-record is enabled by default and may request microphone access after the current cue; you can turn it off for manual Enter/mic control. Recordings are temporary in-memory playback only and are not saved to extension storage or uploaded by Keepit. The browser speech-recognition service may process audio under its own provider/settings. The optional Dashboard demo profile (display name, username, email, avatar) is local only; there is no Keepit-operated account or sync server and no real payment processing. See [`PRIVACY-POLICY.md`](PRIVACY-POLICY.md), currently a draft with publication placeholders.
- When you use translation, dictionary, IPA, related-word, or Google TTS features, the relevant query text may be sent to the providers listed in the privacy draft (Google, MyMemory, Lingva, dictionaryapi.dev, or Datamuse). Dictation requests a Vietnamese translation of a sentence after a correct typing answer or an accepted speaking result; that sentence may be sent through the existing translation service. Google Fonts is requested only when a custom web font is enabled and selected; the Dashboard may send the page URL to Google S2 Favicon if the direct favicon request fails. These data flows must be reviewed before a public release.
- ChatGPT is user-invoked. Dashboard Settings → Ask AI stores the send toggle and two configurable final prompt sentences locally. Auto-send is on by default; a new URL then uses ChatGPT `?q=`. When off, the prompt stays only in the active composer and the source URL→conversation mapping is saved only after you send. Keepit does not save or restore typed composer drafts. Default endings follow the current display language (EN/VI/KO); the Vietnamese Ask AI ending is `Đoạn này trên web nghĩa là sao?`; the current selected text is the only page-derived text included in an Ask AI prompt. Repeating an exact URL reopens its mapped conversation; Ask AI omits the URL, and remains unsent when auto-send is off. Keepit does not extract or send the full page body or title, and does not use the clipboard. The exact source URL → conversation mapping and short-lived request metadata (which can include the selected snippet/prompt) are stored locally; request metadata is cleared on completion, panel close/cancel, when a different source supersedes it, or on expiry; it is not a saved composer draft. Session-only panel route metadata contains a source URL and a sanitized ChatGPT route without query, hash, prompt, or composer text. OpenAI/ChatGPT receives submitted prompts and, on first use, the source URL; its handling is governed by its own terms and privacy policy.
- A local error log keeps at most 200 classified entries (time, component, severity, code), without page URLs, page text, selected text, or account details. It is not automatically uploaded; JSON is generated only when you choose Export in Dashboard > Settings > About.
- Permissions: the Chromium manifest uses `storage`, `unlimitedStorage`, `activeTab`, `tabs`, `declarativeNetRequest`, `clipboardWrite`, `clipboardRead`, `sidePanel`, and `contextMenus` for selected-text Ask AI in the browser context menu. The Firefox build removes the Chromium-only `sidePanel` permission and `side_panel` key, then uses `sidebar_action` with `open_at_install: false`. Host access supports content scripts on websites and the named external services. Chrome removes ChatGPT's `X-Frame-Options` and full `Content-Security-Policy` only on ChatGPT subframes initiated by Keepit's side panel so the site can be embedded; this weakens those protections for that framed ChatGPT document. Firefox loads ChatGPT as the top-level browser sidebar page instead. With auto-record enabled (the default), Speaking may request browser microphone access 2 seconds after the final cue ends; turn it off to use manual Enter/mic start. Its short recording stays in memory for playback and is not persisted or uploaded by Keepit. SpeechRecognition may send audio for processing through the browser/provider service, depending on browser implementation and settings.
- The future account/cloud-sync section in the policy is explicitly marked as not active. Usage limits and Upgrade & Billing are local prototypes with no real payments.

## Limitations

- Content scripts cannot run on browser internal pages (`about:`, `chrome://`, `edge://`), extension stores, or some built-in PDF/document viewers.
- Keepit narrows the page layout to make room for the sidebar; some sites with fixed elements or custom minimum widths may not reflow perfectly.
- Highlights are restored from text and context, so heavily changed pages or identical repeated quotes can be restored imperfectly. Different query strings or fragments are treated as different pages.
- The **Highlights & Notes** surface currently loads all local annotations for search, filters, and export; a very large collection will need a paginated redesign.
- Main-content detection is heuristic for Reader features. The ChatGPT workflow does not use that extraction. ChatGPT panel URLs, login behavior, composer controls, or conversation routing may change and break automatic sending or saved-conversation reopening. Chrome's side panel requires a recent Chromium browser with the Side Panel API (Chrome 116+); toggle-close requires a newer API, and older versions may only open. Firefox uses its native extension sidebar and a thin scrollbar (the platform does not expose an exact 3px native width).
- This is a development build, not signed for store distribution; the Firefox add-on ID in `manifest.json` is a placeholder.

## Project structure

- `manifest.json`: Chromium source manifest; `scripts/build_firefox.py` emits a Firefox-ready copy with unsupported Chromium-only keys removed.
- `pages/`: `dashboard.html` and `popup.html` UI entry points, plus browser-native ChatGPT side-panel pages for Chrome and Firefox.
- `js/core/`: browser polyfill, shared configuration, languages, settings, messaging, cache, and shortcuts.
- `js/background/`: background service worker, annotation storage, usage limits, and error logging.
- `js/content/`: page content entry point, highlighting, notes, sidebar, page layout, and shared page UI.
- `js/reader/`: Bilingual Reader, TTS engine, and reader voice flags.
- `js/overlay/`: shared Video/Web overlay, organized into `source/`, `study/`, and `view/`, with the controller and template.
- `js/overlay/study/`: distinct Dictation/Writing and Shadowing/Speaking activities, with shared scoring/rules/session helpers in `shared/`; Study markup/CSS belongs to `js/overlay/overlay-template.js`. Reader, TTS, translation, and cache engines remain external shared modules.
- `js/translate/`: translation, dictionary, search, and study translation modules.
- `js/dashboard/`: Dashboard, annotation utilities, flashcard study, account, backup, and flag modules.
- `js/popup/` and `js/shared/`: toolbar popup entry point and cross-surface helpers.
- `css/content/`, `css/dashboard/`, `css/popup/`, `css/shared/`: styles grouped by surface and shared theme tokens.
- `assets/icons/` and `assets/fonts/`: local icons and fonts; `vendor/readability/`: Mozilla Readability sources.
- `licenses/`: third-party license texts; `AGENTS.md`, `PROJECT.md`, and `OPT-ARENA.md`: contributor rules, project handoff, and architecture plan.

## Development

- Chromium loads the source folder directly; generate a Firefox-ready folder with `python scripts/build_firefox.py` before loading it in Firefox.
- Shared code uses the `browser.*` namespace through `js/core/browser-polyfill.js`.
- Keep shared defaults in `js/core/config.js`; avoid duplicating them across the popup, Dashboard, content script, and background script.

## Third-party components and licenses

- Keepit's original code/assets use the proprietary notice in [`LICENSE`](LICENSE); this does not change third-party licenses.
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) indexes bundled components; full license texts are grouped in [`licenses/`](licenses/).
- Current inventory: Mozilla Readability (Apache-2.0), webextension-polyfill (MPL-2.0), Lucide icons (ISC), and flag-icons (MIT). Source revisions/versions that are not pinned in the repository must be verified before public release.
- Twemoji Country Flags is currently in an offline test demo, not in the extension package; its license and artwork attribution must be added if it is integrated.
