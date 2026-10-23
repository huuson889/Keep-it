# Keepit

Keepit is a browser extension / add-on for every Chromium-based browser (Chrome, Edge, …) and Firefox base (Firefox, Zen,..). It is one codebase with one Manifest V3 `manifest.json`, so the same folder loads in both browser families.

Keepit helps you keep learning from anything you read online: highlight text and add notes, translate and look up words, listen to pages read aloud, read paragraphs side by side with their translation, and review your highlights as flashcards.

The interface is available in English, Vietnamese, and Korean, will extend more in future.

## Features

### Highlights and notes
- Select text to open a note composer (configurable), or press the shortcut for the current selection.
- Color highlights with editable notes; hover a highlight to see its note and edit or delete it.
- A page sidebar lists the page's highlights, filters them by color, and jumps to a highlight when you click it.
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

### Text to speech
- Google text-to-speech by default, with an automatic fallback to the browser's own voices.
- Select Voice offers Auto language detection, 21 Google TTS languages, and your browser's installed voices. A flag on the reading bar shows the selected language.
- Pronunciation rules and per-language speech rates are available in Settings.

### Dashboard
- Library of source pages with search, sort, website filter, and favorites; export as TXT, CSV, Markdown, or JSON; import JSON.
- Study mode: flashcards from your highlights with Again / Hard / Good / Easy grading, typed answers, custom flashcards, and definition search.
- Settings: Account, Highlights & Notes, Translate, Speech, Bilingual Reader, Appearance, Keyboard shortcuts, Disable on websites, Notifications, Backup, Upgrade & Billing, Reset, About.

## Keyboard shortcuts

Defaults are listed below. Everything marked customizable can be changed in Dashboard > Settings > Keyboard shortcuts (click the field and press the new keys; `Backspace` clears it). Some of them can also be changed in the toolbar popup.

| Shortcut | Action | Customizable |
| --- | --- | --- |
| `Alt+S` | Open the note popup for the selection | Yes |
| `Alt+Q` | Toggle the page sidebar | Yes |
| `Alt+W` | Translate selected text | Yes |
| `Alt+Z` | Toggle Keepit on this website | Yes |
| `Space` | Pause or resume speech | Yes |
| `Left` / `Right` | Previous / next paragraph while reading | Yes |
| `Up` / `Down` | Increase / decrease reading speed | Yes |
| `Alt+L` | Select voice (opens Select Voice on the reading bar) | Yes |
| `Alt+A` | Auto-translate main content while scrolling | No |
| `Alt+D` | Translate the paragraph near the pointer | No |
| `Alt+R` | Start or stop reading aloud | No |

The reading-bar keys (`Space`, arrows, `Alt+L`) work while the reader is active and can be turned off in the reader settings.

## Install for testing

Chromium-based browsers (Chrome, Edge, Brave, …):
1. Extract the ZIP to a normal folder.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the folder that contains `manifest.json`.

Chromium-based browsers (Firefox, Zen, Floorp,..) (121 or later):
1. Extract the ZIP to a normal folder.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `manifest.json`.

Firefox removes temporary add-ons when it restarts; repeat the steps to test again. Your data stays in the browser profile unless you clear extension data, so export a JSON backup from the Dashboard regularly.

## Privacy and permissions

- Highlights and notes are stored locally in the extension's IndexedDB; settings use `browser.storage.local`. There is no Keepit server, and the sign-in in the Dashboard is a local demo profile. Supabase sync is only a documented plan (`SUPABASE_SYNC.md`, `supabase-schema.sql`); nothing is connected.
- Text you translate or look up is sent to the translation services above. Google text-to-speech requests send the text being spoken to Google.
- Permissions: `storage`, `unlimitedStorage`, `activeTab`, `tabs`, and `declarativeNetRequest` (used for the Google TTS request header). Host access covers all websites for the content scripts, the translation services, and Google Fonts.
- A local error log keeps at most 200 classified entries (time, component, severity, code) without page URLs, page text, selected text, or account details. It is exported only when you choose to in Dashboard > Settings > About.
- Usage limits and the Upgrade & Billing page are a local prototype with no real payments.

## Limitations

- Content scripts cannot run on browser internal pages (`about:`, `chrome://`, `edge://`), extension stores, or some built-in PDF/document viewers.
- Keepit narrows the page layout to make room for the sidebar; some sites with fixed elements or custom minimum widths may not reflow perfectly.
- Highlights are restored from text and context, so heavily changed pages or identical repeated quotes can be restored imperfectly. Different query strings or fragments are treated as different pages.
- The Dashboard loads the whole library for search, filters, and export; a very large library needs a paginated redesign.
- Main-content detection is heuristic. Pages without a clear article (for example search results or apps) may be read differently from article pages.
- This is a development build, not signed for store distribution; the Firefox add-on ID in `manifest.json` is a placeholder.

## Project structure

- `manifest.json`: extension manifest (Chromium uses `background.service_worker`, Firefox uses `background.scripts`)
- `background.js`: IndexedDB storage, import/export, translation and TTS requests, usage limits
- `content.js` / `content.css` / `content-theme.css`: page events, note popovers, sidebar, shortcuts
- `web-highlighter.js`: highlight wrapping and restoration
- `bilingual-reader.js` / `bilingual-flags.js`: Bilingual Reader, reading bar, Select Voice
- `lib/Readability.js`, `lib/Readability-readerable.js`: main-content detection
- `tts-engine.js`: Google TTS and browser-voice playback, language detection, voice settings
- `study-translation.js` / `study-utils.js` / `study-view.js`: translation helpers and flashcard study view
- `popup.html` / `popup.js` / `popup.css`: toolbar popup
- `dashboard.html` / `dashboard.js` / `dashboard.css`: Dashboard
- `config.js`: single source of truth for storage keys, default settings, and shared values
- `i18n.js`: English, Vietnamese, and Korean strings
- `usage-limits.js`, `error-logger.js`, `custom-font.js`, `browser-polyfill.js`, `ui-tokens.css`, `ui-theme.css`
- `AGENTS.md`, `PROJECT.md`: working rules and project log for contributors and AI assistants

## Development

- There is no build step: the folder is the extension.
- Shared code uses the `browser.*` namespace through `browser-polyfill.js`.
- Keep shared defaults in `config.js`; avoid duplicating them across the popup, Dashboard, content script, and background script.
- Read `AGENTS.md` before changing anything, and record every change in `PROJECT.md`.

## Third-party components

- Mozilla Readability (Apache License 2.0; the license header is kept in `lib/`)
- webextension-polyfill (Mozilla Public License 2.0, `LICENSE-WEBEXTENSION-POLYFILL.txt`)
- Lucide icons (ISC, `LICENSE-LUCIDE.txt`)
- flag-icons (MIT, see `THIRD_PARTY_NOTICES.md`)
