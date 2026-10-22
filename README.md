# Local Highlight Notes for Firefox Windows — v1.30.0

A no-server Firefox desktop extension. Highlights and notes are stored in the extension's local IndexedDB database; no account, API key, database setup, or network connection is required.

## What's included
- Select text to open a note composer automatically (configurable).
- Yellow, red, blue, and green highlights, with editable notes.
- Note tooltip on hover, with compact pencil/trash icon buttons for edit/delete, and automatic save when clicking outside.
- `Enter` inserts a new line; `Shift+Enter` saves and closes the composer.
- `Alt+S` opens the note composer for the current selection by default.
- `Alt+Q` toggles a right-side sidebar by default. It shows the current page title and URL, filters highlights by color, and uses compact list items. Click a highlighted-text snippet in the sidebar to jump to that highlight on the page.
- Searchable language picker in Settings: 🇺🇸 English - English, 🇻🇳 Vietnamese - Tiếng Việt, 🇰🇷 Korean - 한국어.
- The selected language is applied to the toolbar popup, settings, note composer, tooltip, sidebar, and dashboard. The first-run default uses the computer's time zone as a privacy-friendly regional hint (Vietnam → Vietnamese, South Korea → Korean), then the Firefox/browser language; no geolocation permission or network request is used.
- Both shortcuts are customizable in the extension popup's Settings.
- Dashboard with search, edit, delete, JSON import, and export.
- Dashboard annotation cards follow the same stored on-page order as the page sidebar; older annotations are synchronized when the sidebar is opened.

## Install for a quick test (temporary)
1. Extract the ZIP to a normal folder.
2. Open Firefox and visit `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…**.
4. Select the `manifest.json` inside the extracted folder.
5. Open a normal website (not a Firefox `about:` page), select text, and test the popup.
6. Open the extension toolbar popup, select a language in Settings, and open the dashboard or sidebar to verify the translated UI.

Temporary add-ons are removed when Firefox restarts. To test again after restarting, repeat steps 2–4. Data usually remains in the same Firefox profile unless extension/profile data is cleared; export JSON regularly for backup.

## Limitations
- Content scripts cannot run on Firefox internal pages (`about:`), the Add-ons Manager, some built-in PDF/document viewers, or restricted browser pages.
- The extension narrows the document layout to reserve space for the sidebar. Some websites with fixed-position elements or custom minimum widths may not reflow perfectly.
- Multi-node selections may not always be restored perfectly. Restoring is based on exact text and nearby context; heavily changed pages can prevent a highlight from being restored or cause ambiguity.
- Highlights are saved per exact URL. Different query strings or fragments may be treated as different pages. On dynamic web apps, the extension now watches page-content changes and retries restoration with nearby text context; identical quotes with identical context on multiple screens can still be ambiguous.
- Annotation data is stored in IndexedDB local to the current Firefox profile and device. The first launch migrates the legacy `browser.storage.local` annotation array; it is removed only after migration succeeds. Clearing extension data/profile can remove notes. `unlimitedStorage` requests a larger quota, but does not make disk space unlimited.
- The content script fetches only the current page's records, but the dashboard currently loads the full library for global search, filters, counts, and export. A library with millions of records will need a paginated dashboard/query redesign and substantial local disk/RAM; this build is not a guarantee of smooth operation at 10 million notes per user.
- This is a temporary development build using Manifest V2; it has not been signed for permanent distribution or tested across every website.

## Code maintenance
- `config.js` is the single source of truth for storage keys, default settings, highlight colors, color labels, shared UI timings, and the shared Edit/Delete/Read SVG paths. Load it before the other JavaScript files in each extension context.
- Keep shared defaults and values in `config.js`; avoid duplicating them across the popup, dashboard, content script, and background script.

## Files
- `manifest.json`: extension manifest
- `i18n.js`: English, Vietnamese, and Korean interface strings and language detection
- `web-highlighter.js`: isolated page DOM preview, highlight wrapping/restoration, and highlight color handling
- `content.js` / `content.css`: page events, note popovers, and sidebar, connected to `web-highlighter.js`
- `background.js`: IndexedDB CRUD, legacy migration, and import/export message handling
- `popup.html` / `popup.js`: toolbar popup and settings
- `dashboard.html` / `dashboard.css` / `dashboard.js`: local dashboard

## Privacy
No network requests or geolocation permissions are used. Data remains in Firefox local extension storage (IndexedDB).


Version 1.9.0 fixes the Firefox content-script localization reference so note creation, tooltips, and the page sidebar continue working with multilingual support enabled. It also fixes color-button selection state after translating color labels.


## v1.9.0 changes
- Tooltip action icons are positioned at the top-right; tooltip width follows its content without a minimum width.
- Sidebar cards have a subtle gray hover state; clicking anywhere on a card locates its highlight.
- Sidebar annotations are ordered by their on-page vertical position.


## v1.9.0
- Tooltip actions moved to the bottom-right.
- Added three quick color controls on the bottom-left; choosing a color saves immediately and updates the page highlight.


### Dashboard updates in v1.12.0
- Two-column library: source pages on the left and selected-page highlights/notes on the right.
- Sort source pages by creation date, edit date, or highlight count; search and website filtering remain available.
- Mark source pages as favorites and filter to favorites.
- Export all annotations or the selected page as TXT, CSV, Markdown, or JSON; JSON import remains supported.
- Source rows show a site favicon thumbnail, creation date, highlight color dots, and item count.


## v1.12.0 dashboard refinements
- Standardized dashboard interface icons using embedded Lucide-style SVG paths; no CDN or external icon dependency.
- Moved website filter, sort, and favorites filter to the left side of the toolbar; search is aligned to the right.
- Made source-page and annotation columns independently scrollable on desktop.
- Source cards use page social-preview metadata (`og:image`, `twitter:image`, or `itemprop=image`) when captured while saving an annotation; missing preview images stay blank rather than showing a favicon.
- Updated dashboard annotation cards to match the sidebar card layout and retained only Edit/Delete actions, with page Favorite/Export controls in the top-right header.
- Existing annotations without a stored thumbnail remain blank until edited on a page that exposes preview-image metadata.

Dashboard icons follow the Lucide SVG visual style. Lucide is an open-source icon library, available for personal and commercial use under the ISC license. See `LICENSE-LUCIDE.txt` and https://lucide.dev/.


## v1.29.0
- Improved restoration reliability on dynamic web apps by matching normalized whitespace, supporting text split across inline nodes, preventing concurrent restore requests from being lost, and retrying temporarily unavailable text.


## v1.30.0
- Added an optional setting to save and highlight a newly selected text only when the user clicks outside the popup. Disabled by default to preserve v1.29 behavior. Existing editing, cancel, and Escape behavior remains unchanged.
