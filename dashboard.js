const $ = id => document.getElementById(id);
const I18N = globalThis.LHN_LANGUAGES;
const CONFIG = globalThis.LHN_CONFIG;
const STUDY_UTILS = globalThis.LHN_STUDY_UTILS;
const STUDY_TRANSLATOR = globalThis.LHN_STUDY_TRANSLATION.create({ browser });
CONFIG.applyHighlightColors();
const DASHBOARD_INSTANCE_ID = crypto.randomUUID();
let annotations = [], favorites = [], favoriteNoteIds = new Set(), editingId = null, currentLang = "en", selectedUrl = null, noteColorFilter = "all", editColor = CONFIG.DEFAULT_COLOR, favoritesOnly = false, favoriteNotesOnly = false, viewMode = "grid", dashboardSettings = {}, dashboardSettingsChangedWhileOpen = false;
const DEMO_PROFILE_KEY = "lhnDashboardDemoProfile";
const BILINGUAL_READER_SETTINGS_KEY = "lhnBilingualReaderSettings";
const DEFAULT_BILINGUAL_READER_SETTINGS = Object.freeze({ accentColor:"#9c27b0", fontFamily:"'Inter', sans-serif", webFontFamily:"", translationTextColor:"default", translationCustomColor:"#2d3748", translationTextWeight:"auto", translationFontScale:80, skipSameLang:true, autoScroll:true, enableTTS:true, speakerIconVisibility:"hover", readTranslation:false, excludeSelectors:[], readerDisabledWebsites:CONFIG.DEFAULT_READER_DISABLED_WEBSITES, readerDefaultSitesSeeded:true });
let bilingualReaderSettings = { ...DEFAULT_BILINGUAL_READER_SETTINGS };
let bilingualPreviewRequestId = 0, bilingualPreviewPendingLanguage = null;
const bilingualPreviewTranslations = new Map();
let demoProfile = null, profileDataCache = null, profileAuthMode = "login", profileChipMode = "domains", profileActivityRange = "all";
let editingDisabledWebsite = null;
let editingDisabledReaderWebsite = null;
const annotationById = new Map();
const annotationPositionById = new Map();
const annotationMetadata = new WeakMap();
let filterOptionsCache = null;
let studyQueue = [], studyQueueHead = 0, studyHistory = [], studyReviewed = 0, studyRemembered = 0, studyAutoSpeak = true, studySpeechToken = 0, studyPlayAllSources = false, studySourceKey = null, studySpeakAfterSettingsClose = false, studyTypedAnswer = "", studyTypedAnswerForId = null, studySettingsTab = "study";
let annotationsChangedDuringStudy = false;
const studyCompletedIds = new Set();
const STUDY_SHORTCUT_KEY = "lhnStudyShortcuts", STUDY_FOCUS_MODE_KEY = "lhnStudyFocusMode", STUDY_SHOW_SHORTCUTS_KEY = "lhnStudyShowShortcuts", STUDY_PREFERENCES_KEY = "lhnStudyPreferences", STUDY_TRANSLATION_SETTINGS_KEY = "lhnStudyTranslationSettings", FLASHCARD_TRANSLATE_SETTINGS_KEY = "lhnFlashcardTranslateSettings";
const STUDY_DEFINITION_TAB_KEY = "lhnStudyDefinitionTabId";
let studyDefinitionTabId = null, studyDefinitionTabQueue = Promise.resolve();
const DEFAULT_STUDY_PREFERENCES = Object.freeze({ alwaysPlayAll: false, alwaysAutoSpeak: true, alwaysFocusMode: true, showSentenceNoteFront: true, autoSpeakSentenceNoteFront: true, typeTheAnswer: true, reverseFlashcards: false, searchNoteDefinition: true, switchToDefinitionTab: true, definitionLanguage: "auto" });
const CUSTOM_FLASHCARD_PREFERENCE_KEYS = Object.freeze(["alwaysPlayAll", "alwaysAutoSpeak", "alwaysFocusMode", "showSentenceNoteFront", "autoSpeakSentenceNoteFront", "typeTheAnswer", "reverseFlashcards"]);
let studyPreferences = { ...DEFAULT_STUDY_PREFERENCES };
const DEFAULT_STUDY_TRANSLATION_SETTINGS = Object.freeze({ showFront:false, showBack:true, sourceLanguage:"auto", targetLanguage:"auto" });
let studyTranslationSettings = { ...DEFAULT_STUDY_TRANSLATION_SETTINGS };
const DEFAULT_FLASHCARD_TRANSLATE_SETTINGS = Object.freeze({ useDashboardSettings:true, useDashboardSpeechSettings:true, sourceLanguage:"auto", targetLanguage:"auto", speechVoice:"google", speechRate:1, flashcardEnglishSpeechRate:1.2, flashcardSpeechRateByLanguage:{}, hasCustomFlashcardLanguageSpeechRate:{}, hasCustomSpeechRate:false, hasCustomEnglishSpeechRate:false, highlightSpeechLanguage:"auto", noteSpeechLanguage:"auto", speechLanguageSettingsRevision:{} });
let flashcardTranslateSettings = { ...DEFAULT_FLASHCARD_TRANSLATE_SETTINGS };
let studySettingsSnapshot = null;
let studySettingsCloseToastKey = "settingsNoChanges";
const DEFAULT_STUDY_SHORTCUTS = Object.freeze({ again: "ArrowLeft", hard: "ArrowUp", good: "ArrowDown", easy: "ArrowRight", reveal: "Enter", replay: "Shift", previous: ".", searchDefinition: "/", editCard: "Alt+E" });
let studyShortcuts = { ...DEFAULT_STUDY_SHORTCUTS };
let studyFocusMode = false;
let studyShowShortcuts = true;
const STUDY_VIEW = globalThis.LHN_STUDY_VIEW.create({ $, config: CONFIG, t, siteOf, tagsOf, appendContextSentence, slightlyDarkerHighlight, utils: STUDY_UTILS, translateSentence: (text, options) => STUDY_TRANSLATOR.translate(text, options) });
const EXPORTS = [
  { id: "txt", ext: "txt", labelKey: "exportText", icon: "file-text" },
  { id: "csv", ext: "csv", labelKey: "exportCsv", icon: "file-spreadsheet" },
  { id: "md", ext: "md", labelKey: "exportMarkdown", icon: "file-code" },
  { id: "json", ext: "json", labelKey: "exportJson", icon: "file-json" }
];

const ICON_PATHS = {
  "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>',
  "file-spreadsheet": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M8 13h8M8 17h8M12 12v6"/>',
  "file-code": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M10 13l-2 2 2 2M14 13l2 2-2 2"/>',
  "file-json": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M10 12c-1 0-1 1-1 2s0 2-1 2M14 12c1 0 1 1 1 2s0 2 1 2"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  external: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  sparkles: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>',
  cursor: '<path d="m5 3 14 9-7 1-3 7L5 3Z"/><path d="m12 13 5 6"/>',
  "square-text": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h8M7 12h10M7 16h6"',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'
};
function icon(name, cls = "") { const path = CONFIG.ACTION_ICON_PATHS[name] || ICON_PATHS[name] || ICON_PATHS.sparkles; return `<svg class="lucide ${cls}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`; }
function updateViewModeButton() { const button = $("viewModeBtn"); if (!button) return; const isGrid = viewMode === "grid"; button.innerHTML = isGrid ? icon("grid") : '<svg class="lucide preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 4h7"/><path d="M14 9h7"/><path d="M14 15h7"/><path d="M14 20h7"/></svg>'; button.title = t(isGrid ? "gridViewLabel" : "listViewLabel"); button.setAttribute("aria-label", button.title); button.setAttribute("aria-pressed", String(isGrid)); $("notesList").classList.toggle("is-grid-view", isGrid); }

function playToolbarActionEffect(button, event, color, particleShape) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const rect = button.getBoundingClientRect();
  const x = Number.isFinite(event.clientX) && (event.clientX || event.clientY) ? event.clientX : rect.left + rect.width / 2;
  const y = Number.isFinite(event.clientY) && (event.clientX || event.clientY) ? event.clientY : rect.top + rect.height / 2;
  let layer = $("toolbarActionEffectLayer");
  if (!layer) { layer = document.createElement("div"); layer.id = "toolbarActionEffectLayer"; layer.setAttribute("aria-hidden", "true"); document.body.appendChild(layer); }
  button.classList.remove("toolbar-action-pulse"); void button.offsetWidth; button.classList.add("toolbar-action-pulse");
  button.addEventListener("animationend", event => { if (event.animationName === "favorite-heartbeat") button.classList.remove("toolbar-action-pulse"); }, { once:true });
  for (let index = 0; index < 2; index++) {
    const ring = document.createElement("span"); ring.className = "toolbar-action-ripple-ring"; ring.style.setProperty("--effect-color", color);
    ring.style.left = `${x}px`; ring.style.top = `${y}px`; ring.style.setProperty("--delay", `${index * 100}ms`);
    layer.appendChild(ring); ring.addEventListener("animationend", () => ring.remove(), { once:true });
  }
  for (let index = 0; index < 10; index++) {
    const particle = document.createElement("span"), angle = Math.PI * 2 * index / 10 + (Math.random() - .5) * .45, distance = 34 + Math.random() * 42;
    particle.className = `toolbar-action-ripple-particle${particleShape === "sparkle" ? " is-sparkle" : ""}`; particle.style.left = `${x}px`; particle.style.top = `${y}px`; particle.style.setProperty("--effect-color", color);
    particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`); particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--turn", `${Math.round((Math.random() - .5) * 70)}deg`);
    particle.innerHTML = particleShape === "sparkle"
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
    layer.appendChild(particle); particle.addEventListener("animationend", () => particle.remove(), { once:true });
  }
}

function t(key, vars = {}, language = currentLang) { return I18N.t(key, vars, language); }
const disabledTooltipTitles = new WeakMap();
function setDisabledTooltip(control, anchor = control, reason = "") {
  if (!control || !anchor) return;
  if (control.disabled && reason) {
    if (!disabledTooltipTitles.has(anchor)) disabledTooltipTitles.set(anchor, anchor.getAttribute("title"));
    anchor.title = reason;
  } else if (disabledTooltipTitles.has(anchor)) {
    const title = disabledTooltipTitles.get(anchor);
    if (title == null) anchor.removeAttribute("title"); else anchor.setAttribute("title", title);
    disabledTooltipTitles.delete(anchor);
  }
}
function profileUsername(profile = demoProfile) { return String(profile?.username || "huson").replace(/^@+/, "").split("@")[0]; }
function profilePictureMarkup(profile = demoProfile, fallback = "") { return profile?.avatarDataUrl ? `<img class="profile-picture-img" src="${escapeHtml(profile.avatarDataUrl)}" alt="">` : fallback; }
function syncDashboardTheme() {
  const preference = dashboardSettings.sidebarTheme;
  const dark = preference === "dark" || (preference !== "light" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  const state = $("profileAppearanceState");
  if (state) state.textContent = t(dark ? "darkMode" : "lightMode");
}
function showDashboardSettingsPanel(name) {
  document.querySelectorAll("[data-settings-panel]").forEach(panel => { const active = panel.dataset.settingsPanel === name; panel.hidden = !active; panel.classList.toggle("is-active", active); });
  document.querySelectorAll("[data-settings-tab]").forEach(button => button.classList.toggle("is-active", button.dataset.settingsTab === name));
}
function renderPronunciationDictionary() {
  const container = $("pronunciationLanguageCards");
  if (!container) return;
  const dictionary = dashboardSettings.customPronunciationDictionary && typeof dashboardSettings.customPronunciationDictionary === "object" ? dashboardSettings.customPronunciationDictionary : {};
  const supportedLanguages = I18N.LANGS.map(language => ({ ...language, speechCode:{ en:"en-US", vi:"vi-VN", ko:"ko-KR" }[language.code] }));
  const languageSelect = $("pronunciationLanguageSelect");
  if (languageSelect && !languageSelect.options.length) for (const language of supportedLanguages) { const option = document.createElement("option"); option.value = language.speechCode; option.textContent = `${language.flag} ${language.name} — ${language.native}`; languageSelect.append(option); }
  if (languageSelect) for (const option of languageSelect.options) option.disabled = Object.hasOwn(dictionary, option.value);
  container.replaceChildren();
  for (const { speechCode:language, flag, name, native } of supportedLanguages) {
    const rules = dictionary[language];
    if (!Array.isArray(rules)) continue;
    const card = document.createElement("section"); card.className = "pronunciation-language-card"; card.dataset.language = language;
    const heading = document.createElement("div"); heading.className = "pronunciation-language-heading";
    const title = document.createElement("strong"); title.textContent = `${flag} ${name} — ${native}`;
    const removeLanguage = document.createElement("button"); removeLanguage.type = "button"; removeLanguage.className = "pronunciation-delete-language"; removeLanguage.dataset.pronunciationAction = "remove-language"; removeLanguage.textContent = t("pronunciationRemoveLanguage");
    heading.append(title, removeLanguage);
    const form = document.createElement("form"); form.className = "pronunciation-rule-form"; form.dataset.language = language;
    const original = document.createElement("input"); original.name = "original"; original.type = "text"; original.placeholder = t("pronunciationSourcePlaceholder"); original.required = true;
    const pronunciation = document.createElement("input"); pronunciation.name = "replacement"; pronunciation.type = "text"; pronunciation.placeholder = t("pronunciationReadingPlaceholder"); pronunciation.required = true;
    const addRule = document.createElement("button"); addRule.type = "submit"; addRule.className = "settings-action-button"; addRule.textContent = t("pronunciationAdd");
    form.append(original, pronunciation, addRule);
    const list = document.createElement("div"); list.className = "pronunciation-rule-list";
    for (const rule of rules) {
      const row = document.createElement("div"); row.className = "pronunciation-rule-row"; row.dataset.ruleId = String(rule.id);
      const source = document.createElement("span"); source.className = "pronunciation-rule-source"; source.textContent = rule.original;
      const reading = document.createElement("span"); reading.className = "pronunciation-rule-reading"; reading.textContent = rule.replacement;
      const actions = document.createElement("span"); actions.className = "pronunciation-rule-actions";
      for (const [action, label, icon] of [["edit", t("pronunciationEdit"), '<path d="M17 3a2.83 2.83 0 1 1 4 4L7 21l-4 1 1-4Z"/><path d="m15 5 4 4"/>'], ["delete", t("pronunciationDelete"), '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>']]) { const button = document.createElement("button"); button.type = "button"; button.dataset.pronunciationAction = action; button.title = label; button.setAttribute("aria-label", label); button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`; actions.append(button); }
      row.append(source, reading, actions); list.append(row);
    }
    card.append(heading, form, list); container.append(card);
  }
}
let suppressSettingsLanguagePickerFocus = false;
function settingsLanguageLabel(language) { return `${language.flag} ${language.name} - ${language.native}`; }
function closeSettingsLanguagePicker({ restoreSelection = true, returnFocus = false } = {}) {
  const input = $("settingsLanguageSearch"), options = $("settingsLanguageOptions");
  if (!input || !options) return;
  options.classList.remove("open");
  input.setAttribute("aria-expanded", "false");
  if (restoreSelection) {
    const selected = I18N.LANGS.find(language => language.code === $("settingsLanguageSelect").value) || I18N.LANGS[0];
    input.value = settingsLanguageLabel(selected);
  }
  if (returnFocus && document.activeElement !== input) {
    suppressSettingsLanguagePickerFocus = true;
    input.focus();
    suppressSettingsLanguagePickerFocus = false;
  }
}
function chooseSettingsLanguage(language) {
  const select = $("settingsLanguageSelect");
  if (!select) return;
  const changed = select.value !== language.code;
  select.value = language.code;
  closeSettingsLanguagePicker({ restoreSelection:true, returnFocus:true });
  if (changed) select.dispatchEvent(new Event("change", { bubbles:true }));
}
function renderSettingsLanguageOptions(filter = "") {
  const select = $("settingsLanguageSelect"), options = $("settingsLanguageOptions");
  if (!select || !options) return;
  options.replaceChildren();
  const query = filter.trim().toLocaleLowerCase();
  const filtered = I18N.LANGS.filter(language => `${language.name} ${language.native} ${language.code}`.toLocaleLowerCase().includes(query));
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "language-empty settings-language-empty";
    empty.textContent = t("languageSearchNoResults");
    options.appendChild(empty);
    return;
  }
  filtered.forEach(language => {
    const option = document.createElement("div");
    option.className = "language-option settings-language-option" + (language.code === select.value ? " selected" : "");
    option.role = "option";
    option.tabIndex = 0;
    option.setAttribute("aria-selected", String(language.code === select.value));
    option.textContent = settingsLanguageLabel(language);
    option.addEventListener("click", () => chooseSettingsLanguage(language));
    option.addEventListener("keydown", event => {
      const items = [...options.querySelectorAll(".settings-language-option")];
      const index = items.indexOf(option);
      let next = -1;
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseSettingsLanguage(language); return; }
      if (event.key === "Escape") { event.preventDefault(); closeSettingsLanguagePicker({ restoreSelection:true, returnFocus:true }); return; }
      if (event.key === "ArrowDown") next = (index + 1) % items.length;
      else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      if (next >= 0) { event.preventDefault(); items[next]?.focus(); }
    });
    options.appendChild(option);
  });
}
function openSettingsLanguagePicker() {
  const input = $("settingsLanguageSearch"), options = $("settingsLanguageOptions");
  if (!input || !options || options.classList.contains("open")) return;
  input.value = "";
  renderSettingsLanguageOptions();
  options.classList.add("open");
  input.setAttribute("aria-expanded", "true");
}
function syncSettingsLanguagePicker() {
  const input = $("settingsLanguageSearch"), options = $("settingsLanguageOptions"), select = $("settingsLanguageSelect");
  if (!input || !options || !select) return;
  if (options.classList.contains("open")) renderSettingsLanguageOptions(input.value);
  else {
    const selected = I18N.LANGS.find(language => language.code === select.value) || I18N.LANGS[0];
    input.value = settingsLanguageLabel(selected);
    input.setAttribute("aria-expanded", "false");
  }
}
$("settingsLanguageSearch").addEventListener("focus", () => {
  if (suppressSettingsLanguagePickerFocus) { suppressSettingsLanguagePickerFocus = false; return; }
  openSettingsLanguagePicker();
});
$("settingsLanguageSearch").addEventListener("click", openSettingsLanguagePicker);
$("settingsLanguageSearch").addEventListener("input", event => {
  const options = $("settingsLanguageOptions");
  if (!options.classList.contains("open")) { options.classList.add("open"); event.target.setAttribute("aria-expanded", "true"); }
  renderSettingsLanguageOptions(event.target.value);
});
$("settingsLanguageSearch").addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeSettingsLanguagePicker({ restoreSelection:true }); return; }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const items = [...$("settingsLanguageOptions").querySelectorAll(".settings-language-option")];
    (event.key === "ArrowDown" ? items[0] : items.at(-1))?.focus();
  }
});
$("settingsLanguagePicker").addEventListener("focusout", event => {
  if (!event.currentTarget.contains(event.relatedTarget)) closeSettingsLanguagePicker({ restoreSelection:true });
});
document.addEventListener("pointerdown", event => {
  if (!event.target.closest?.("#settingsLanguagePicker")) closeSettingsLanguagePicker({ restoreSelection:true });
});
function refreshDashboardSettings() {
  const select = $("settingsLanguageSelect");
  if (!select.options.length) for (const language of I18N.LANGS) { const option = document.createElement("option"); option.value = language.code; option.textContent = `${language.flag} ${language.name} — ${language.native}`; select.appendChild(option); }
  select.value = currentLang;
  syncSettingsLanguagePicker();
  renderPronunciationDictionary();
  renderDisabledWebsiteList();
  renderDisabledReaderWebsiteList();
  syncBilingualReaderControls();
  $("settingsAutoPopup").checked = dashboardSettings.showOnSelect !== false;
  $("settingsAutoHighlight").checked = dashboardSettings.autoHighlight === true;
  $("settingsAutoSentence").checked = dashboardSettings.sentenceNoteEnabled !== false;
  $("settingsTranslateIconEnabled").checked = dashboardSettings.translateIconEnabled === true;
  $("settingsTranslationPopupEnabled").checked = dashboardSettings.translationPopupEnabled === true;
  $("settingsFullEnglishDictionary").checked = dashboardSettings.showFullEnglishDictionary !== false;
  $("settingsAutoTranslatePopup").checked = dashboardSettings.autoTranslate !== false;
  $("settingsAutoSpeakSelectedText").checked = dashboardSettings.autoSpeakSelectedText !== false;
  $("settingsSpeechVoice").value = (dashboardSettings.voiceMode ?? dashboardSettings.speechVoice) === "browser" ? "browser" : "google";
  const storedSpeechRate = Number(dashboardSettings.speechRate);
  const speechRate = Number.isFinite(storedSpeechRate) ? Math.min(2, Math.max(.5, storedSpeechRate)) : 1;
  const globalSpeechRateLabel = t("globalSpeechRate");
  $("settingsSpeechRate").setAttribute("aria-label", globalSpeechRateLabel);
  $("settingsSpeechRateValue").setAttribute("aria-label", globalSpeechRateLabel);
  $("settingsSpeechRate").value = String(speechRate);
  $("settingsSpeechRateValue").value = speechRate.toFixed(1);
  const useLanguageSpeechRate = dashboardSettings.useLanguageSpeechRate ?? (CONFIG.DEFAULT_SETTINGS.useLanguageSpeechRate === true);
  const speechRateByLanguage = dashboardSettings.speechRateByLanguage && typeof dashboardSettings.speechRateByLanguage === "object" ? dashboardSettings.speechRateByLanguage : {};
  const hasCustomSpeechRateByLanguage = dashboardSettings.hasCustomSpeechRateByLanguage && typeof dashboardSettings.hasCustomSpeechRateByLanguage === "object" ? dashboardSettings.hasCustomSpeechRateByLanguage : {};
  const inheritedSpeechRateByLanguage = dashboardSettings.inheritedSpeechRateByLanguage && typeof dashboardSettings.inheritedSpeechRateByLanguage === "object" ? dashboardSettings.inheritedSpeechRateByLanguage : {};
  const languageRate = Number(speechRateByLanguage[currentLang]);
  const inheritedLanguageRate = Number(inheritedSpeechRateByLanguage[currentLang]);
  const customLanguageRate = useLanguageSpeechRate
    ? hasCustomSpeechRateByLanguage[currentLang] === true && Number.isFinite(languageRate)
      ? Math.min(2, Math.max(.5, languageRate))
      : Number.isFinite(inheritedLanguageRate) ? Math.min(2, Math.max(.5, inheritedLanguageRate)) : Number(CONFIG.DEFAULT_SETTINGS.speechRateByLanguage?.[currentLang]) || speechRate
    : speechRate;
  $("settingsUseLanguageSpeechRate").checked = useLanguageSpeechRate;
  const languageRateLabel = t("yourLanguageSpeed", { language:t({ en:"languageEnglish", vi:"languageVietnamese", ko:"languageKorean" }[currentLang] || "languageEnglish") });
  $("settingsLanguageSpeechRateTitle").textContent = languageRateLabel;
  $("settingsLanguageSpeechRate").setAttribute("aria-label", languageRateLabel);
  $("settingsLanguageSpeechRateValue").setAttribute("aria-label", languageRateLabel);
  $("settingsLanguageSpeechRate").value = String(customLanguageRate);
  $("settingsLanguageSpeechRateValue").value = formatLanguageSpeechRate(customLanguageRate);
  $("settingsLanguageSpeechRateRow").hidden = !useLanguageSpeechRate;
  const notePopupEnabled = dashboardSettings.showOnSelect !== false;
  const translateIconEnabled = dashboardSettings.translateIconEnabled === true;
  const directTranslationEnabled = dashboardSettings.translationPopupEnabled === true;
  $("settingsAutoPopup").disabled = translateIconEnabled || directTranslationEnabled;
  $("settingsTranslateIconEnabled").disabled = notePopupEnabled || directTranslationEnabled;
  $("settingsTranslationPopupEnabled").disabled = notePopupEnabled || translateIconEnabled;
  const conflictingModes = (condition, keys) => condition ? t("disabledConflictSettings", { settings: keys.map(key => t(key)).join(currentLang === "vi" ? " và " : currentLang === "ko" ? " 및 " : " and ") }) : "";
  const autoPopupRow = $("settingsAutoPopup").closest(".settings-preference-row");
  autoPopupRow.classList.toggle("is-disabled", $("settingsAutoPopup").disabled);
  setDisabledTooltip($("settingsAutoPopup"), autoPopupRow, conflictingModes($("settingsAutoPopup").disabled, [translateIconEnabled && "showKeepitIcon", directTranslationEnabled && "showDirectTranslationPopup"].filter(Boolean)));
  $("settingsTranslateIconEnabledRow").classList.toggle("is-disabled", $("settingsTranslateIconEnabled").disabled);
  setDisabledTooltip($("settingsTranslateIconEnabled"), $("settingsTranslateIconEnabledRow"), conflictingModes($("settingsTranslateIconEnabled").disabled, [notePopupEnabled && "autoPopup", directTranslationEnabled && "showDirectTranslationPopup"].filter(Boolean)));
  $("settingsTranslationPopupEnabledRow").classList.toggle("is-disabled", $("settingsTranslationPopupEnabled").disabled);
  setDisabledTooltip($("settingsTranslationPopupEnabled"), $("settingsTranslationPopupEnabledRow"), conflictingModes($("settingsTranslationPopupEnabled").disabled, [notePopupEnabled && "autoPopup", translateIconEnabled && "showKeepitIcon"].filter(Boolean)));
  $("settingsPopupTranslationSource").value = studyTranslationSettings.sourceLanguage;
  $("settingsPopupTranslationTarget").value = studyTranslationSettings.targetLanguage;
  refreshFlashcardTranslateSettingsUI();
  $("settingsSidebarIndicator").checked = dashboardSettings.sidebarIndicatorEnabled !== false;
  $("settingsSidebarIndicatorDisabledSites").checked = dashboardSettings.sidebarIndicatorOnDisabledSites !== false;
  $("settingsSidebarIndicatorDisabledSites").disabled = dashboardSettings.sidebarIndicatorEnabled === false;
  $("settingsSidebarIndicatorDisabledSitesRow").classList.toggle("is-disabled", dashboardSettings.sidebarIndicatorEnabled === false);
  setDisabledTooltip($("settingsSidebarIndicatorDisabledSites"), $("settingsSidebarIndicatorDisabledSitesRow"), $("settingsSidebarIndicatorDisabledSites").disabled ? t("disabledIndicatorSetting", { setting:t("enableSidebarIndicator") }) : "");
  $("settingsProductUpdates").checked = dashboardSettings.productUpdatesEnabled !== false;
  $("settingsWeeklySummary").checked = dashboardSettings.weeklySummaryEnabled === true;
  $("settingsShortcut").value = dashboardSettings.shortcut ?? CONFIG.DEFAULT_SETTINGS.shortcut;
  $("settingsSidebarShortcut").value = dashboardSettings.sidebarShortcut ?? CONFIG.DEFAULT_SETTINGS.sidebarShortcut;
  $("settingsTranslateShortcut").value = dashboardSettings.translateSelectedShortcut ?? CONFIG.DEFAULT_SETTINGS.translateSelectedShortcut;
  $("settingsWebsiteShortcut").value = dashboardSettings.toggleWebsiteShortcut ?? CONFIG.DEFAULT_SETTINGS.toggleWebsiteShortcut;
  $("settingsSpeechPauseShortcut").value = dashboardSettings.speechPauseShortcut ?? CONFIG.DEFAULT_SETTINGS.speechPauseShortcut;
  $("settingsPreviousReadingShortcut").value = dashboardSettings.previousReadingShortcut ?? CONFIG.DEFAULT_SETTINGS.previousReadingShortcut;
  $("settingsNextReadingShortcut").value = dashboardSettings.nextReadingShortcut ?? CONFIG.DEFAULT_SETTINGS.nextReadingShortcut;
  $("settingsIncreaseReadingSpeedShortcut").value = dashboardSettings.increaseReadingSpeedShortcut ?? CONFIG.DEFAULT_SETTINGS.increaseReadingSpeedShortcut;
  $("settingsDecreaseReadingSpeedShortcut").value = dashboardSettings.decreaseReadingSpeedShortcut ?? CONFIG.DEFAULT_SETTINGS.decreaseReadingSpeedShortcut;
  $("settingsSelectVoiceShortcut").value = dashboardSettings.selectVoiceShortcut ?? CONFIG.DEFAULT_SETTINGS.selectVoiceShortcut;
  ["settingsShortcut", "settingsSidebarShortcut", "settingsTranslateShortcut", "settingsWebsiteShortcut", "settingsSpeechPauseShortcut", "settingsPreviousReadingShortcut", "settingsNextReadingShortcut", "settingsIncreaseReadingSpeedShortcut", "settingsDecreaseReadingSpeedShortcut", "settingsSelectVoiceShortcut"].forEach(id => { $(id).title = t("shortcutInputHint"); });
  $("resetDashboardShortcuts").classList.toggle("has-custom-shortcuts", ["shortcut", "sidebarShortcut", "translateSelectedShortcut", "toggleWebsiteShortcut", "speechPauseShortcut", "previousReadingShortcut", "nextReadingShortcut", "increaseReadingSpeedShortcut", "decreaseReadingSpeedShortcut", "selectVoiceShortcut"].some(key => (dashboardSettings[key] ?? CONFIG.DEFAULT_SETTINGS[key]) !== CONFIG.DEFAULT_SETTINGS[key]));
  $("settingsVersion").textContent = `v${browser.runtime.getManifest().version}`;
  const displayName = demoProfile?.displayName || t("profileGuest"), email = demoProfile ? (demoProfile.email || "huuson889@gmail.com") : t("profileLocal");
  $("settingsProfileName").textContent = displayName;
  $("settingsProfileEmail").textContent = email;
  const upgradeTab = document.querySelector('[data-settings-tab="upgrade"]');
  upgradeTab.hidden = !demoProfile;
  upgradeTab.style.display = demoProfile ? "" : "none";
  if (!demoProfile && document.querySelector('[data-settings-panel="upgrade"].is-active')) showDashboardSettingsPanel("account");
  const accountState = $("settingsAccountState"), accountMode = demoProfile ? "signed-in" : "guest";
  if (accountState.dataset.mode !== accountMode) {
    const template = $(demoProfile ? "settingsAccountSignedInTemplate" : "settingsAccountGuestTemplate");
    accountState.replaceChildren(template.content.cloneNode(true));
    accountState.dataset.mode = accountMode;
  }
  accountState.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  if (demoProfile) {
    accountState.querySelector("#settingsAccountDisplayName").value = demoProfile.displayName || "";
    accountState.querySelector("#settingsAccountUsername").value = profileUsername();
    const picturePreview = accountState.querySelector("#settingsAccountPicturePreview");
    if (picturePreview) picturePreview.innerHTML = profilePictureMarkup(demoProfile, escapeHtml(String(displayName).slice(0, 1).toLocaleUpperCase()));
    const emailField = accountState.querySelector("#settingsAccountEmail");
    emailField.value = demoProfile.email || "huuson889@gmail.com";
    emailField.disabled = emailField.dataset.editing !== "true";
    setDisabledTooltip(emailField, emailField.closest(".settings-account-controls"), emailField.disabled ? t("disabledEmail") : "");
  }
  const settingsAvatar = $("settingsProfileAvatar");
  settingsAvatar.classList.toggle("profile-avatar-guest", !demoProfile);
  settingsAvatar.innerHTML = demoProfile
    ? profilePictureMarkup(demoProfile, escapeHtml(String(displayName).slice(0, 1).toLocaleUpperCase()))
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>';
  const theme = ["light", "dark", "system"].includes(dashboardSettings.sidebarTheme) ? dashboardSettings.sidebarTheme : "system";
  document.querySelectorAll("[data-settings-theme]").forEach(button => { const active = button.dataset.settingsTheme === theme; button.classList.toggle("is-selected", active); button.setAttribute("aria-pressed", String(active)); });
  document.querySelectorAll("[data-settings-color]").forEach(button => { const color = button.dataset.settingsColor; button.style.backgroundColor = CONFIG.HIGHLIGHT_COLORS[color]; const active = CONFIG.normalizeColor(dashboardSettings.defaultHighlightColor) === color; button.classList.toggle("is-selected", active); button.setAttribute("aria-pressed", String(active)); });
}
async function refreshUsageLimitSettings() {
  try {
    const status = await browser.runtime.sendMessage({ type:"USAGE_STATUS" });
    if (!status) return;
    const planKey = ({ trial:"usagePlanTrial", free:"usagePlanFree", keyA:"usagePlanKeyA", keyB:"usagePlanKeyB" })[status.planId] || "usagePlanFree";
    const limitLabel = status.dailyLimit === null ? t("usageUnlimited") : t("usageDailyLimit", { count:status.dailyLimit });
    $("upgradePlanBadge").textContent = t(status.trialActive ? "usagePlanTrial" : planKey);
    $("usagePlanStatus").textContent = status.trialActive
      ? `${t("usageTrialUntil", { date:new Date(status.trialEndsAt).toLocaleDateString(currentLang) })}${status.keyActive ? ` · ${t("usageKeyAfterTrial", { plan:t(planKey) })}` : ""}`
      : status.keyActive ? t("usageKeyWithLimit", { plan:t(planKey), limit:limitLabel }) : t("usageFreeWithLimit", { limit:limitLabel });
    $("upgradeKeyStatus").textContent = status.keyActive ? `${t(planKey)} · ${t("usageActive")}` : status.trialActive ? t("usageTrialActive") : t("usageNoActiveKey");
    for (const [service, id, barId] of [["translate", "usageTranslateCount", "usageTranslateBar"], ["googleTts", "usageGoogleTtsCount", "usageGoogleTtsBar"]]) {
      const used = status.usage[service], percent = status.dailyLimit === null ? null : Math.min(100, Math.round(used / status.dailyLimit * 100));
      $(id).textContent = status.dailyLimit === null
        ? t("usageCountUnlimited", { count:used })
        : t("usageCountLimit", { used, limit:status.dailyLimit, percent });
      $(barId).style.width = `${percent ?? 0}%`;
    }
  } catch (error) { console.warn("Could not read local usage status", error); }
}
function normalizeDisabledWebsite(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/.test(url.protocol) || !url.hostname) return "";
    return url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch { return ""; }
}
function renderDisabledWebsiteList() {
  const host = $("settingsDisabledWebsiteList");
  if (!host) return;
  const sites = Array.isArray(dashboardSettings.disabledWebsites) ? dashboardSettings.disabledWebsites : [];
  if (!sites.length) {
    host.innerHTML = `<p class="settings-disabled-web-empty">${escapeHtml(t("noDisabledWebsites"))}</p>`;
    return;
  }
  host.replaceChildren(...sites.map(site => {
    const row = document.createElement("div"); row.className = "settings-disabled-web-item"; row.dataset.site = site;
    if (editingDisabledWebsite === site) {
      row.innerHTML = `<input class="settings-disabled-web-edit-input" type="text" value="${escapeHtml(site)}" aria-label="${escapeHtml(t("disableWeb"))}"><div class="settings-disabled-web-actions"><button type="button" class="settings-action-button" data-disabled-site-action="save" data-i18n="save">${escapeHtml(t("save"))}</button><button type="button" class="settings-action-button" data-disabled-site-action="cancel" data-i18n="cancel">${escapeHtml(t("cancel"))}</button></div>`;
    } else {
      const label = document.createElement("span"); label.className = "settings-disabled-web-domain"; label.textContent = site;
      const actions = document.createElement("div"); actions.className = "settings-disabled-web-actions";
      for (const [action, key] of [["edit", "edit"], ["remove", "removeWebsite"]]) {
        const button = document.createElement("button"); button.type = "button"; button.className = "settings-action-button"; button.dataset.disabledSiteAction = action; button.dataset.i18n = key; button.textContent = t(key); actions.appendChild(button);
      }
      row.append(label, actions);
    }
    return row;
  }));
}
async function updateDisabledWebsites(sites) {
  editingDisabledWebsite = null;
  await saveDashboardSettings({ disabledWebsites: [...new Set(sites)] });
}
function renderDisabledReaderWebsiteList() {
  const host = $("bilingualDisabledReaderWebList");
  if (!host) return;
  const sites = Array.isArray(bilingualReaderSettings.readerDisabledWebsites) ? bilingualReaderSettings.readerDisabledWebsites : [];
  if (!sites.length) { host.innerHTML = `<p class="settings-disabled-web-empty">${escapeHtml(t("noDisabledWebsites"))}</p>`; return; }
  host.replaceChildren(...sites.map(site => {
    const row = document.createElement("div"); row.className = "settings-disabled-web-item"; row.dataset.site = site;
    if (editingDisabledReaderWebsite === site) {
      row.innerHTML = `<input class="settings-disabled-web-edit-input" type="text" value="${escapeHtml(site)}" aria-label="${escapeHtml(t("bilingualDisabledReaderWeb"))}"><div class="settings-disabled-web-actions"><button type="button" class="settings-action-button" data-reader-site-action="save">${escapeHtml(t("save"))}</button><button type="button" class="settings-action-button" data-reader-site-action="cancel">${escapeHtml(t("cancel"))}</button></div>`;
    } else {
      const label = document.createElement("span"); label.className = "settings-disabled-web-domain"; label.textContent = site;
      const actions = document.createElement("div"); actions.className = "settings-disabled-web-actions";
      for (const [action, key] of [["edit", "edit"], ["remove", "removeWebsite"]]) { const button = document.createElement("button"); button.type = "button"; button.className = "settings-action-button"; button.dataset.readerSiteAction = action; button.textContent = t(key); actions.appendChild(button); }
      row.append(label, actions);
    }
    return row;
  }));
}
function syncBilingualReaderControls() {
  const enabled = $("bilingualEnableTTS")?.checked !== false;
  const dependent = $("bilingualReaderDependentSettings");
  if (!dependent) return;
  dependent.classList.toggle("is-disabled", !enabled);
  dependent.setAttribute("aria-disabled", String(!enabled));
  dependent.querySelectorAll("input,button,select,textarea").forEach(control => { control.disabled = !enabled; });
}
async function updateDisabledReaderWebsites(sites) {
  editingDisabledReaderWebsite = null;
  await saveBilingualReaderSettings({ readerDisabledWebsites:[...new Set(sites)] });
}
async function saveDashboardSettings(nextValues) {
  const previous = dashboardSettings;
  const previousToastState = dashboardSettingsChangedWhileOpen;
  const changed = Object.keys(nextValues).some(key => JSON.stringify(previous[key]) !== JSON.stringify(nextValues[key]));
  dashboardSettings = { ...dashboardSettings, ...nextValues };
  if (changed && $("dashboardSettingsDialog")?.open) dashboardSettingsChangedWhileOpen = true;
  if (Object.hasOwn(nextValues, "sidebarTheme")) syncDashboardTheme();
  refreshDashboardSettings();
  try { await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: dashboardSettings }); return true; }
  catch (error) { dashboardSettings = previous; dashboardSettingsChangedWhileOpen = previousToastState; syncDashboardTheme(); refreshDashboardSettings(); console.warn("Could not save dashboard settings", error); return false; }
}
function openDashboardSettings(panel = "account") {
  closeMenus();
  dashboardSettingsChangedWhileOpen = false;
  refreshDashboardSettings();
  showDashboardSettingsPanel(panel);
  $("dashboardSettingsDialog").classList.remove("is-maximized");
  $("dashboardSettingsDialog").showModal();
}
async function restoreAddonSettings() {
  try {
    const defaultSettings = {
      ...CONFIG.DEFAULT_SETTINGS,
      customPronunciationDictionary:{ "en-US":[
        { id:"default-en-eg", original:"e.g.", replacement:"For example" },
        { id:"default-en-ie", original:"i.e.", replacement:"That is" },
        { id:"default-en-etc", original:"etc.", replacement:"Et cetera" },
        { id:"default-en-idk", original:"IDK", replacement:"I don't know" },
        { id:"default-en-fyi", original:"FYI", replacement:"For your information" }
      ] },
      pronunciationDictionaryDefaultsInitialized:true
    };
    await browser.storage.local.set({
      [CONFIG.STORAGE_KEYS.SETTINGS]:defaultSettings,
      [STUDY_SHORTCUT_KEY]:{ ...DEFAULT_STUDY_SHORTCUTS },
      [STUDY_FOCUS_MODE_KEY]:true,
      [STUDY_SHOW_SHORTCUTS_KEY]:true,
      [STUDY_PREFERENCES_KEY]:{ ...DEFAULT_STUDY_PREFERENCES },
      [STUDY_TRANSLATION_SETTINGS_KEY]:{ ...DEFAULT_STUDY_TRANSLATION_SETTINGS },
      [FLASHCARD_TRANSLATE_SETTINGS_KEY]:JSON.parse(JSON.stringify(DEFAULT_FLASHCARD_TRANSLATE_SETTINGS)),
      [BILINGUAL_READER_SETTINGS_KEY]:{ ...DEFAULT_BILINGUAL_READER_SETTINGS }
    });
    dashboardSettingsChangedWhileOpen = true;
    await load();
    if ($("studyDialog").open) renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
    toast(t("settingsReset"));
  } catch (error) {
    console.warn("Could not restore default settings", error);
    toast(t("restoreSettingsFailed"));
  }
}
function renderProfileSidebar() {
  const profileHeader = $("profileHeaderSection"), actionHost = $("actionButtonsSection"), metaHost = $("metaInfoSection");
  const menuAvatar = $("profileMenuAvatar"), accountHost = $("profileMenuAccountHost"), menuIdentity = $("profileMenuIdentity"), signOutButton = $("profileMenuSignOut");
  const guestAvatar = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>';
  const syncTooltip = escapeHtml(t(demoProfile ? "profileLocal" : "profileNotSynced"));
  const syncIcon = demoProfile
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud preview-icon" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-off preview-icon" aria-hidden="true"><path d="M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057"/><path d="M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78"/><path d="m2 2 20 20"/></svg>';
  const syncStatusIcon = `<button type="button" class="profile-sync-status menu-item item-free" data-tooltip="${syncTooltip}" aria-label="${syncTooltip}">${syncIcon}</button>`;
  if (menuAvatar) {
    menuAvatar.classList.toggle("profile-avatar-guest", !demoProfile);
    menuAvatar.innerHTML = demoProfile ? profilePictureMarkup(demoProfile, escapeHtml(String(demoProfile.displayName || demoProfile.username || "H").slice(0, 1).toLocaleUpperCase())) : guestAvatar;
  }
  if (menuIdentity) {
    const identity = demoProfile ? escapeHtml(demoProfile.displayName || "Huson") : escapeHtml(t("profileGuest"));
    const username = demoProfile ? `@${escapeHtml(profileUsername())}` : escapeHtml(t("profileLocal"));
    const avatar = demoProfile ? profilePictureMarkup(demoProfile, escapeHtml(String(demoProfile.displayName || demoProfile.username || "H").slice(0, 1).toLocaleUpperCase())) : guestAvatar;
    menuIdentity.innerHTML = `<span class="profile-menu-identity-avatar ${demoProfile ? "" : "is-guest"}">${avatar}</span><span class="profile-menu-identity-text"><strong>${identity}</strong><span>${username}</span></span>`;
  }
  if (accountHost) {
    accountHost.hidden = Boolean(demoProfile);
    if (!demoProfile) accountHost.innerHTML = `<button id="profileMenuSignIn" class="profile-menu-item profile-menu-sign-in" type="button"><span class="profile-menu-item-label"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/></svg><span>${escapeHtml(t("profileLogin"))}</span></span></button>`;
  }
  if (signOutButton) signOutButton.hidden = !demoProfile;
  if (demoProfile) {
    const name = escapeHtml(demoProfile.displayName || "Huson"), username = escapeHtml(profileUsername());
    profileHeader.innerHTML = `<div class="profile-avatar">${profilePictureMarkup(demoProfile, name.slice(0,1).toLocaleUpperCase())}</div><div class="profile-name"><h2>${name}</h2><span>@${username}</span></div>${syncStatusIcon}`;
    actionHost.innerHTML = `<button id="profileAskAIAction" class="profile-action-primary" type="button"><svg class="lucide" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2m16 0h2M9 13h.01M15 13h.01M9 17h6"/></svg><span>${escapeHtml(t("profileAskAI"))}</span></button><button id="profileEditAction" class="profile-action-secondary" type="button">${icon("edit")}<span>${escapeHtml(t("profileEdit"))}</span></button>`;
    const joined = demoProfile.createdAt ? new Intl.DateTimeFormat(currentLang, { dateStyle:"medium" }).format(new Date(demoProfile.createdAt)) : "—";
    metaHost.innerHTML = `<div>◷ <span>${escapeHtml(t("profileJoined", { date:joined }))}</span></div><div><span><strong>0</strong> ${escapeHtml(t("profileFollowing"))}</span><span><strong>0</strong> ${escapeHtml(t("profileFollowers"))}</span></div>`;
    metaHost.hidden = false;
  } else {
    profileHeader.innerHTML = `<div class="profile-avatar profile-avatar-guest">${guestAvatar}</div><div class="profile-name"><h2>${escapeHtml(t("profileGuest"))}</h2><span>${escapeHtml(t("profileSignInToSync"))}</span></div>${syncStatusIcon}`;
    actionHost.innerHTML = `<button id="profileLoginAction" class="profile-login-action" type="button"><span class="profile-menu-item-label"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/></svg><span>${escapeHtml(t("profileLoginRegister"))}</span></span></button>`;
    metaHost.hidden = true;
  }
  if (!profileDataCache || profileDataCache.source !== annotations) {
    const pageKeys = new Set(), tagCounts = new Map(), sitePages = new Map(), dailyCounts = new Map();
    const statsNow = Date.now(); let needLearnCount = 0;
    for (const item of annotations) {
      pageKeys.add(pageKey(item));
      for (const tag of tagsOf(item)) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      const site = siteOf(item);
      if (!sitePages.has(site)) sitePages.set(site, new Set());
      sitePages.get(site).add(pageKey(item));
      const created = dateValue(item, "createdAt");
      if (created) { const date = new Date(created); date.setHours(0, 0, 0, 0); const key = date.toISOString().slice(0, 10); dailyCounts.set(key, (dailyCounts.get(key) || 0) + 1); }
      const dueAt = Number(item.review?.dueAt) || 0;
      if (!dueAt || dueAt <= statsNow) needLearnCount++;
    }
    const siteCounts = new Map([...sitePages].map(([site, pages]) => [site, pages.size]));
    profileDataCache = { source:annotations, pageCount:pageKeys.size, noteCount:annotations.length, tagCounts, siteCounts, dailyCounts, needLearnCount };
  }
  const { pageCount, noteCount, tagCounts, siteCounts, dailyCounts, needLearnCount } = profileDataCache;
  $("profilePageTotal").textContent = pageCount.toLocaleString(currentLang);
  $("profileNoteTotal").textContent = noteCount.toLocaleString(currentLang);
  $("profileNeedLearnTotal").textContent = needLearnCount.toLocaleString(currentLang);
  const heatmap = $("profileHeatmap"), today = new Date(); today.setHours(0, 0, 0, 0);
  let days = profileActivityRange === "weekly" ? 7 : profileActivityRange === "yearly" ? 364 : 84;
  if (profileActivityRange === "all" && dailyCounts.size) {
    const first = [...dailyCounts.keys()].sort()[0], firstDate = new Date(`${first}T00:00:00`);
    days = Math.min(364, Math.max(84, Math.floor((today - firstDate) / 86400000) + 1));
  }
  const start = new Date(today); start.setDate(today.getDate() - days + 1);
  const monthLabels = $("profileMonthLabels");
  const months = [];
  for (let offset = 3; offset >= 0; offset--) { const date = new Date(today.getFullYear(), today.getMonth() - offset, 1); months.push(new Intl.DateTimeFormat(currentLang, { month:"short" }).format(date)); }
  monthLabels.replaceChildren(...months.map(label => { const span = document.createElement("span"); span.textContent = label; return span; }));
  const maxDaily = Math.max(1, [...dailyCounts.values()].reduce((max, count) => Math.max(max, count), 0)); let activeDays = 0;
  const cells = [];
  for (let day = 0; day < days; day++) {
    const date = new Date(start); date.setDate(start.getDate() + day);
    const key = date.toISOString().slice(0, 10), count = dailyCounts.get(key) || 0;
    if (count) activeDays++;
    const level = count ? Math.min(4, Math.ceil(count / maxDaily * 4)) : 0;
    cells.push(`<i class="profile-heat-cell level-${level}" title="${escapeHtml(new Intl.DateTimeFormat(currentLang, { dateStyle:"medium" }).format(date))}: ${count}" aria-label="${count}"></i>`);
  }
  heatmap.innerHTML = cells.join("");
  $("profileActivityTotal").textContent = activeDays.toLocaleString(currentLang);
  const allActiveWeeks = new Set([...dailyCounts.keys()].map(key => { const date = new Date(`${key}T00:00:00`); date.setDate(date.getDate() - date.getDay()); return date.toISOString().slice(0,10); }));
  $("profileTotalDays").textContent = dailyCounts.size.toLocaleString(currentLang);
  $("profileTotalWeeks").textContent = allActiveWeeks.size.toLocaleString(currentLang);
  $("profileTagTotal").textContent = `(${tagCounts.size.toLocaleString(currentLang)})`;
  $("profileDomainTotal").textContent = `(${siteCounts.size.toLocaleString(currentLang)})`;
  const tagsTab = $("profileTagsTab"), domainsTab = $("profileDomainsTab");
  tagsTab.classList.toggle("is-active", profileChipMode === "tags"); domainsTab.classList.toggle("is-active", profileChipMode === "domains");
  const entries = [...(profileChipMode === "tags" ? tagCounts : siteCounts)].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], currentLang)).slice(0, 12);
  const chips = $("profileChips"); chips.replaceChildren(...entries.map(([name, count]) => { const chip = document.createElement("button"); chip.type = "button"; chip.className = "profile-chip"; const label = document.createElement("span"); label.className = "profile-chip-name"; label.textContent = name; const total = document.createElement("span"); total.className = "profile-chip-count"; total.textContent = `(${count.toLocaleString(currentLang)})`; chip.append(label, total); chip.title = `${name} · ${count.toLocaleString(currentLang)}`; chip.dataset.name = name; return chip; }));
  if (!entries.length) { const empty = document.createElement("span"); empty.className = "profile-chip-empty"; empty.textContent = "—"; chips.appendChild(empty); }
  document.querySelectorAll("[data-profile-range]").forEach(button => button.classList.toggle("is-active", button.dataset.profileRange === profileActivityRange));
}
function setProfileAuthMode(mode) {
  const isRegister = mode === "register";
  $("profileLoginTab").classList.toggle("is-active", !isRegister);
  $("profileRegisterTab").classList.toggle("is-active", isRegister);
  $("profileRetypePasswordLabel").hidden = !isRegister;
  $("profileRetypePassword").required = isRegister;
  if (!isRegister) $("profileRetypePassword").value = "";
  $("profilePassword").autocomplete = isRegister ? "new-password" : "current-password";
  $("profileAuthSubmit").textContent = isRegister ? t("profileCreateAccount") : t("profileLoginNow");
  $("profileAuthError").hidden = true;
  profileAuthMode = mode;
}
function openProfileAuth(mode = "login") { setProfileAuthMode(mode); $("profileAuthDialog").showModal(); $("profileUsername").focus(); }
async function finishProfileAuth(profile) {
  demoProfile = profile;
  await browser.storage.local.set({ [DEMO_PROFILE_KEY]: demoProfile });
  $("profileAuthDialog").close(); renderProfileSidebar();
  if ($("dashboardSettingsDialog").open) refreshDashboardSettings();
}
async function signOutDemoProfile() {
  await browser.storage.local.remove(DEMO_PROFILE_KEY);
  demoProfile = null;
  closeMenus();
  renderProfileSidebar();
  if ($("dashboardSettingsDialog").open) refreshDashboardSettings();
}
function setStudyQueue(items) { studyQueue = items; studyQueueHead = 0; }
function studyQueueLength() { return studyQueue.length - studyQueueHead; }
function studyQueueItems() { return studyQueue.slice(studyQueueHead); }
function currentStudyCard() { return studyQueue[studyQueueHead]; }
function takeStudyCard() {
  const item = currentStudyCard();
  if (item) {
    studyQueueHead++;
    if (studyQueueHead > 64 && studyQueueHead * 2 >= studyQueue.length) {
      studyQueue = studyQueue.slice(studyQueueHead); studyQueueHead = 0;
    }
  }
  return item;
}
function returnStudyCardToFront(item) {
  if (studyQueueHead > 0) studyQueue[--studyQueueHead] = item;
  else studyQueue.unshift(item);
}
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function appendContextSentence(host, sentence, quote) {
  host.replaceChildren(); if (!sentence) return;
  const text = String(sentence), selected = String(quote || "");
  let match = null;
  if (selected) { const pattern = selected.trim().split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"); try { match = new RegExp(pattern).exec(text); } catch { /* render plain text */ } }
  const at = match?.index ?? -1, length = match?.[0].length ?? 0;
  if (at < 0) { host.textContent = text; return; }
  host.append(document.createTextNode(text.slice(0, at)));
  const strong = document.createElement("strong"); strong.textContent = match[0]; host.append(strong);
  host.append(document.createTextNode(text.slice(at + length)));
}
function searchRank(item, query) {
  if (!query) return 0;
  const normalizedQuery = String(query).toLocaleLowerCase();
  const fieldIndex = annotationMeta(item).searchFields.findIndex(value => value.includes(normalizedQuery));
  return fieldIndex < 0 ? Number.MAX_SAFE_INTEGER : fieldIndex;
}
function highlightSearchMatches(root, query) {
  const needle = String(query || "").trim();
  if (!needle) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest(".card-actions, .lhn-search-match")) continue;
    if (node.nodeValue.toLocaleLowerCase().includes(needle.toLocaleLowerCase())) nodes.push(node);
  }
  for (const node of nodes) {
    const text = node.nodeValue, lower = text.toLocaleLowerCase(), search = needle.toLocaleLowerCase();
    const fragment = document.createDocumentFragment(); let from = 0, at;
    while ((at = lower.indexOf(search, from)) !== -1) {
      if (at > from) fragment.appendChild(document.createTextNode(text.slice(from, at)));
      const match = document.createElement("mark"); match.className = "lhn-search-match"; match.textContent = text.slice(at, at + needle.length); fragment.appendChild(match);
      from = at + needle.length;
    }
    if (from === 0) continue;
    if (from < text.length) fragment.appendChild(document.createTextNode(text.slice(from)));
    node.replaceWith(fragment);
  }
}
function slightlyDarkerHighlight(hex) {
  const match = /^#([\da-f]{6})$/i.exec(String(hex || ""));
  if (!match) return hex;
  const [r, g, b] = [0, 2, 4].map(index => parseInt(match[1].slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60; if (hue < 0) hue += 360;
  }
  const lightness = (max + min) / 2, saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return `hsl(${hue} ${saturation * 100}% ${lightness * 80}%)`;
}
let toastTimer = null, activeToastElement = null;
function toast(message) {
  clearTimeout(toastTimer);
  if (activeToastElement) {
    if (activeToastElement instanceof HTMLDialogElement) { if (activeToastElement.open) activeToastElement.close(); }
    else activeToastElement.hidden = true;
  }
  const inDashboardSettings = $("dashboardSettingsDialog")?.open;
  const inFlashcardSettings = $("studyShortcutDialog")?.open;
  const inFlashcard = $("studyDialog")?.open;
  const el = $(inDashboardSettings ? "settingsToast" : inFlashcardSettings ? "studySettingsToast" : inFlashcard ? "studyToast" : "toast");
  el.textContent = message;
  if (inDashboardSettings || inFlashcardSettings || inFlashcard) el.hidden = false;
  else { if (el.open) el.close(); el.show(); }
  activeToastElement = el;
  toastTimer = setTimeout(() => {
    if (el instanceof HTMLDialogElement) { if (el.open) el.close(); }
    else el.hidden = true;
    if (activeToastElement === el) activeToastElement = null;
  }, CONFIG.TIMINGS.TOAST_MS);
}
function displayWebsiteName(host) { const value = String(host || ""); return value ? value[0].toLocaleUpperCase() + value.slice(1) : value; }
function annotationMeta(item) {
  if (!item || typeof item !== "object") return { site:t("unknownWebsite"), tags:[], searchFields:[] };
  const cached = annotationMetadata.get(item);
  if (cached) return cached;
  let host;
  try { host = new URL(item.url).hostname; } catch { host = item.hostname || item.url || t("unknownWebsite"); }
  const raw = Array.isArray(item?.tags) ? item.tags : typeof item?.tags === "string" ? item.tags.split(",") : [];
  const seen = new Set();
  const tags = raw.map(tag => String(tag || "").trim()).filter(tag => { const key = tag.toLocaleLowerCase(); if (!key || seen.has(key)) return false; seen.add(key); return true; });
  const site = displayWebsiteName(host);
  const searchFields = [item.quote, item.note, item.contextNote, tags.join(" "), item.title, item.url, site].map(value => String(value || "").toLocaleLowerCase());
  const metadata = { site, tags, searchFields };
  annotationMetadata.set(item, metadata);
  return metadata;
}
function siteOf(item) { return annotationMeta(item).site; }
function tagsOf(item) { return annotationMeta(item).tags; }
function parseTags(value) { return tagsOf({ tags: String(value || "").split(",") }); }
function tagsEqual(a, b) { return JSON.stringify(tagsOf({ tags: a })) === JSON.stringify(tagsOf({ tags: b })); }
function setupTagEditor(host, initialTags = []) {
  const tags = tagsOf({ tags: initialTags }).map(value => ({ value }));
  let editingTag = null;
  const input = document.createElement("input"); input.type = "text"; input.placeholder = t("tagsPlaceholder"); input.setAttribute("aria-label", t("tagsLabel"));
  const normalize = values => tagsOf({ tags: values });
  const commit = value => {
    const parts = normalize(String(value || "").split(","));
    if (editingTag) {
      if (parts.length) {
        editingTag.value = parts[0];
        const index = tags.indexOf(editingTag);
        if (index >= 0 && parts.length > 1) tags.splice(index + 1, 0, ...parts.slice(1).map(tag => ({ value: tag })));
      }
      editingTag = null;
    } else if (parts.length) tags.push(...parts.map(tag => ({ value: tag })));
    input.value = ""; render(); input.focus({ preventScroll: true });
  };
  const render = () => {
    host.replaceChildren();
    tags.forEach(tag => {
      const chip = document.createElement("span"); chip.className = "tag-editor-chip"; chip.append(document.createTextNode(tag.value));
      chip.addEventListener("click", event => {
        if (event.target.closest("button")) return;
        if (editingTag && editingTag !== tag) commit(input.value);
        if (!tags.includes(tag)) return;
        editingTag = tag; input.value = tag.value; render(); input.focus({ preventScroll: true });
        input.setSelectionRange(input.value.length, input.value.length);
      });
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `${t("delete")}: ${tag.value}`);
      remove.addEventListener("click", event => {
        event.preventDefault(); event.stopPropagation();
        const index = tags.indexOf(tag);
        if (index >= 0) tags.splice(index, 1);
        if (editingTag === tag) { editingTag = null; input.value = ""; }
        render(); input.focus({ preventScroll: true });
      });
      chip.appendChild(remove); host.appendChild(chip);
    });
    host.appendChild(input);
  };
  input.addEventListener("keydown", event => {
    if (event.key === "," || event.key === "Enter") { event.preventDefault(); event.stopPropagation(); commit(input.value); }
    else if (event.key === "Escape") event.stopPropagation();
  });
  input.addEventListener("input", () => { if (input.value.includes(",")) commit(input.value); });
  host.onclick = () => input.focus({ preventScroll: true }); render();
  return { getTags: () => normalize(tags.map(tag => tag === editingTag && input.value.trim() ? input.value : tag.value).concat(editingTag === null ? [input.value] : [])) };
}
function dateFilterCutoff(range) {
  if (!range) return null;
  if (range === "today") { const start = new Date(); start.setHours(0, 0, 0, 0); return start.getTime(); }
  const days = Number(range);
  return Number.isFinite(days) ? Date.now() - days * 86400000 : NaN;
}
function matchesDate(item, cutoff) {
  if (cutoff === null) return true;
  const created = dateValue(item, "createdAt");
  return created > 0 && created >= cutoff;
}
function pageKey(item) { return String(item.url || item.hostname || item.title || "unknown"); }
function dateValue(item, field) { const n = Number(item?.[field] || 0); return Number.isFinite(n) ? n : 0; }
const incrementalListObservers = new WeakMap();
function renderIncrementalList(host, items, createNode, { initial, batch } = {}) {
  const pageSize = initial ?? CONFIG.LIMITS.DASHBOARD_SOURCE_INITIAL;
  const batchSize = batch ?? CONFIG.LIMITS.DASHBOARD_SOURCE_BATCH;
  incrementalListObservers.get(host)?.disconnect();
  host.replaceChildren();
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    const fragment = document.createDocumentFragment();
    for (const item of items) fragment.appendChild(createNode(item));
    host.appendChild(fragment);
    return;
  }
  let offset = 0, observer;
  const sentinel = document.createElement("div");
  sentinel.className = "dashboard-list-sentinel";
  sentinel.setAttribute("aria-hidden", "true");
  const appendBatch = () => {
    const fragment = document.createDocumentFragment();
    const end = Math.min(items.length, offset + (offset === 0 ? pageSize : batchSize));
    for (; offset < end; offset++) fragment.appendChild(createNode(items[offset]));
    host.insertBefore(fragment, sentinel);
    if (offset >= items.length) { observer?.disconnect(); sentinel.remove(); incrementalListObservers.delete(host); }
  };
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) appendBatch();
  }, { root: host, rootMargin: `${CONFIG.LIMITS.DASHBOARD_LIST_PREFETCH_PX}px 0px` });
  host.appendChild(sentinel);
  incrementalListObservers.set(host, observer);
  appendBatch();
  if (offset < items.length) observer.observe(sentinel);
}
function fmtDate(value) { if (!value) return t("dateUnknown"); try { return new Intl.DateTimeFormat(currentLang === "vi" ? "vi-VN" : currentLang === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value)); } catch { return t("dateUnknown"); } }
function populateStudyLanguageOptions(select, autoValue, selectedValue) {
  if (!select) return;
  const fragment = document.createDocumentFragment();
  const automatic = document.createElement("option");
  automatic.value = autoValue;
  automatic.textContent = `🌐 ${t("autoLanguage")}`;
  fragment.appendChild(automatic);
  for (const language of I18N.LANGS) {
    const option = document.createElement("option");
    option.value = language.code;
    option.textContent = `${language.flag} ${language.name} — ${language.native}`;
    fragment.appendChild(option);
  }
  select.replaceChildren(fragment);
  select.value = selectedValue;
  if (select.value !== selectedValue) select.value = autoValue;
}
function populateStudySpeechLanguageOptions(select, selectedValue) {
  const choices = [["auto", t("autoSpeechLanguage")], ["en-US", t("englishSpeechLanguage")], ["vi-VN", t("vietnameseSpeechLanguage")], ["ko-KR", t("koreanSpeechLanguage")]];
  select.replaceChildren(...choices.map(([value, label]) => { const option = document.createElement("option"); option.value = value; option.textContent = label; return option; }));
  select.value = selectedValue;
  if (select.value !== selectedValue) select.value = "auto";
}
function populateStudyLanguageSelects() {
  populateStudyLanguageOptions($("settingsPopupTranslationSource"), "auto", studyTranslationSettings.sourceLanguage);
  const flashcardSettings = getEffectiveFlashcardTranslationSettings();
  populateStudyLanguageOptions($("studyTranslationSource"), "auto", flashcardSettings.sourceLanguage);
  populateStudyLanguageOptions($("studyTranslationTarget"), "auto", flashcardSettings.targetLanguage);
  populateStudyLanguageOptions($("settingsPopupTranslationTarget"), "auto", studyTranslationSettings.targetLanguage);
  populateStudyLanguageOptions($("studyDefinitionSearchLanguage"), "auto", studyPreferences.definitionLanguage || "auto");
}
function getEffectiveFlashcardTranslationSettings() {
  const languageSettings = flashcardTranslateSettings.useDashboardSettings
    ? studyTranslationSettings
    : flashcardTranslateSettings;
  return { ...studyTranslationSettings, sourceLanguage:languageSettings.sourceLanguage, targetLanguage:languageSettings.targetLanguage };
}
function getEffectiveFlashcardSpeechSettings() {
  if (flashcardTranslateSettings.useDashboardSpeechSettings) return dashboardSettings;
  const displayLanguage = I18N.languageFor(dashboardSettings);
  const languageRates = flashcardTranslateSettings.flashcardSpeechRateByLanguage && typeof flashcardTranslateSettings.flashcardSpeechRateByLanguage === "object" ? flashcardTranslateSettings.flashcardSpeechRateByLanguage : {};
  return {
    ...flashcardTranslateSettings,
    language:displayLanguage,
    speechRate:flashcardTranslateSettings.hasCustomSpeechRate ? flashcardTranslateSettings.speechRate : dashboardSettings.speechRate,
    flashcardDashboardDisplayRate:getSpeechRate(dashboardSettings, displayLanguage),
    flashcardSpeechRateByLanguage:languageRates
  };
}
function getFlashcardDisplayLanguageRate(sharedSpeech) {
  const dashboardRate = getSpeechRate(dashboardSettings, currentLang);
  const customRates = flashcardTranslateSettings.flashcardSpeechRateByLanguage || {};
  const hasCustomRates = flashcardTranslateSettings.hasCustomFlashcardLanguageSpeechRate || {};
  if (sharedSpeech || hasCustomRates[currentLang] !== true) return dashboardRate;
  const customRate = Number(customRates[currentLang]);
  return Number.isFinite(customRate) ? Math.min(2, Math.max(.5, customRate)) : dashboardRate;
}
function refreshFlashcardTranslateSettingsUI() {
  const sharedTranslation = flashcardTranslateSettings.useDashboardSettings;
  const sharedSpeech = flashcardTranslateSettings.useDashboardSpeechSettings;
  $("studyUseDashboardTranslateSettings").checked = !sharedTranslation;
  $("studyUseDashboardSpeechSettings").checked = !sharedSpeech;
  const translation = getEffectiveFlashcardTranslationSettings();
  populateStudyLanguageOptions($("studyTranslationSource"), "auto", translation.sourceLanguage);
  populateStudyLanguageOptions($("studyTranslationTarget"), "auto", translation.targetLanguage);
  $("studyTranslationSource").value = translation.sourceLanguage;
  $("studyTranslationTarget").value = translation.targetLanguage;
  $("studySpeechVoice").value = sharedSpeech ? (dashboardSettings.speechVoice === "browser" ? "browser" : "google") : (flashcardTranslateSettings.speechVoice === "browser" ? "browser" : "google");
  $("studySpeechRateLabel").textContent = t("flashcardSpeechRate");
  populateStudySpeechLanguageOptions($("studyHighlightVoiceLanguage"), flashcardTranslateSettings.highlightSpeechLanguage);
  populateStudySpeechLanguageOptions($("studyNoteVoiceLanguage"), flashcardTranslateSettings.noteSpeechLanguage);
  const storedRate = Number(sharedSpeech || !flashcardTranslateSettings.hasCustomSpeechRate ? dashboardSettings.speechRate : flashcardTranslateSettings.speechRate);
  const rate = Number.isFinite(storedRate) ? Math.min(2, Math.max(.5, storedRate)) : 1;
  $("studySpeechRate").value = String(rate);
  $("studySpeechRateValue").value = rate.toFixed(1);
  const languageRate = getFlashcardDisplayLanguageRate(sharedSpeech);
  const displayLanguageLabel = t({ en:"languageEnglish", vi:"languageVietnamese", ko:"languageKorean" }[currentLang] || "languageEnglish");
  const flashcardLanguageRateLabel = t("flashcardLanguageSpeed", { language:displayLanguageLabel });
  $("studyFlashcardEnglishRate").setAttribute("aria-label", flashcardLanguageRateLabel);
  $("studyFlashcardEnglishRateValue").setAttribute("aria-label", flashcardLanguageRateLabel);
  $("studyFlashcardEnglishRateRow").querySelector("strong").textContent = flashcardLanguageRateLabel;
  $("studyFlashcardEnglishRate").value = String(languageRate);
  $("studyFlashcardEnglishRateValue").value = languageRate.toFixed(1);
  document.querySelectorAll(".study-translate-setting-row").forEach(row => {
    const control = row.querySelector("select,input");
    if (control) control.disabled = sharedTranslation;
    row.classList.toggle("is-disabled", sharedTranslation);
    if (control) setDisabledTooltip(control, row, sharedTranslation ? t("disabledFlashcardSettings", { setting:t("dashboardSettings") }) : "");
  });
  document.querySelectorAll(".study-speech-setting-row").forEach(row => {
    const controls = row.querySelectorAll("select,input,button");
    controls.forEach(control => {
      control.disabled = sharedSpeech;
      setDisabledTooltip(control, row, sharedSpeech ? t("disabledFlashcardSettings", { setting:t("dashboardSettings") }) : "");
    });
    row.classList.toggle("is-disabled", sharedSpeech);
  });
}
function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel)); });
  populateStudyLanguageSelects();
  updateStudyAutoSpeakButton();
  updateGradeShortcutHints();
  syncStudyScopeButton();
  document.title = `${t("appName")} — ${currentLang === "vi" ? "Bảng quản lý" : currentLang === "ko" ? "대시보드" : "Dashboard"}`;
  refreshFlashcardTranslateSettingsUI();
  renderExportMenus();
}
async function load() {
  const settingsData = await browser.storage.local.get([CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.STORAGE_KEYS.FAVORITES, CONFIG.STORAGE_KEYS.NOTE_FAVORITES, STUDY_SHORTCUT_KEY, STUDY_FOCUS_MODE_KEY, STUDY_SHOW_SHORTCUTS_KEY, STUDY_PREFERENCES_KEY, STUDY_TRANSLATION_SETTINGS_KEY, FLASHCARD_TRANSLATE_SETTINGS_KEY, DEMO_PROFILE_KEY, BILINGUAL_READER_SETTINGS_KEY]);
  const savedBilingualReaderSettings = settingsData[BILINGUAL_READER_SETTINGS_KEY] || {};
  const savedReaderSites = Array.isArray(savedBilingualReaderSettings.readerDisabledWebsites) ? savedBilingualReaderSettings.readerDisabledWebsites : [];
  const seedReaderSites = savedBilingualReaderSettings.readerDefaultSitesSeeded !== true;
  bilingualReaderSettings = { ...DEFAULT_BILINGUAL_READER_SETTINGS, ...savedBilingualReaderSettings, readerDisabledWebsites:seedReaderSites ? [...new Set([...CONFIG.DEFAULT_READER_DISABLED_WEBSITES, ...savedReaderSites])] : savedReaderSites, readerDefaultSitesSeeded:true };
  if (seedReaderSites) browser.storage.local.set({ [BILINGUAL_READER_SETTINGS_KEY]:bilingualReaderSettings }).catch(() => {});
  const webFontKeys = { "":"auto", "'Inter', sans-serif":"inter", "'Lora', Georgia, serif":"lora", "'Roboto Mono', monospace":"roboto-mono", "'Fredoka', sans-serif":"fredoka", "system-ui, -apple-system, sans-serif":"system" };
  const webFontKey = webFontKeys[bilingualReaderSettings.webFontFamily || ""] || "auto";
  browser.storage.local.set({ lhnCustomFontSettings:{ customFontEnabled:webFontKey !== "auto", fontKey:webFontKey } }).catch(() => {});
  $("bilingualTransFont").value = bilingualReaderSettings.fontFamily;
  $("bilingualWebFont").value = bilingualReaderSettings.webFontFamily || "";
  $("bilingualAccentColor").value = /^#[0-9a-f]{6}$/i.test(bilingualReaderSettings.accentColor) ? bilingualReaderSettings.accentColor : "#9c27b0";
  $("bilingualTranslationCustomColor").value = /^#[0-9a-f]{6}$/i.test(bilingualReaderSettings.translationCustomColor) ? bilingualReaderSettings.translationCustomColor : "#2d3748";
  $("bilingualTranslationWeight").value = ["auto", "100", "200", "300", "400", "500", "600", "700", "800", "900"].includes(String(bilingualReaderSettings.translationTextWeight)) ? String(bilingualReaderSettings.translationTextWeight) : "auto";
  bilingualReaderSettings.translationFontScale = Math.min(150, Math.max(50, Number(bilingualReaderSettings.translationFontScale) || 80));
  $("bilingualTranslationFontScale").value = String(bilingualReaderSettings.translationFontScale);
  $("bilingualTranslationFontScaleValue").textContent = `${bilingualReaderSettings.translationFontScale}%`;
  $("bilingualSkipSame").checked = bilingualReaderSettings.skipSameLang !== false;
  $("bilingualAutoScroll").checked = bilingualReaderSettings.autoScroll !== false; $("bilingualReadTranslation").checked = bilingualReaderSettings.readTranslation === true;
  $("bilingualEnableTTS").checked = bilingualReaderSettings.enableTTS !== false;
  $("bilingualSpeakerIconVisibility").value = ["always", "hover", "reading"].includes(bilingualReaderSettings.speakerIconVisibility) ? bilingualReaderSettings.speakerIconVisibility : "hover";
  $("bilingualExcludeSelectors").value = Array.isArray(bilingualReaderSettings.excludeSelectors) ? bilingualReaderSettings.excludeSelectors.join("\n") : String(bilingualReaderSettings.excludeSelectors || "");
  syncBilingualReaderControls();
  document.querySelectorAll("[data-bilingual-translation-color]").forEach(button => button.classList.toggle("is-selected", button.dataset.bilingualTranslationColor === (bilingualReaderSettings.translationTextColor || "default")));
  $("bilingualTranslationCustomColor").parentElement.classList.toggle("is-custom-selected", bilingualReaderSettings.translationTextColor === "custom");
  const savedStudyShortcuts = settingsData[STUDY_SHORTCUT_KEY] || {};
  studyShortcuts = { ...DEFAULT_STUDY_SHORTCUTS, ...savedStudyShortcuts };
  if (savedStudyShortcuts.previous === "Ctrl") studyShortcuts.previous = DEFAULT_STUDY_SHORTCUTS.previous;
  studyFocusMode = settingsData[STUDY_FOCUS_MODE_KEY] !== false;
  const savedStudyPreferences = settingsData[STUDY_PREFERENCES_KEY] && typeof settingsData[STUDY_PREFERENCES_KEY] === "object" ? settingsData[STUDY_PREFERENCES_KEY] : {};
  studyPreferences = { ...DEFAULT_STUDY_PREFERENCES, ...savedStudyPreferences, alwaysFocusMode: savedStudyPreferences.alwaysFocusMode ?? studyFocusMode };
  if (!["auto", "en", "vi", "ko"].includes(studyPreferences.definitionLanguage)) studyPreferences.definitionLanguage = "auto";
  const savedTranslationSettings = settingsData[STUDY_TRANSLATION_SETTINGS_KEY] && typeof settingsData[STUDY_TRANSLATION_SETTINGS_KEY] === "object" ? settingsData[STUDY_TRANSLATION_SETTINGS_KEY] : {};
  studyTranslationSettings = { ...DEFAULT_STUDY_TRANSLATION_SETTINGS, ...savedTranslationSettings };
  if (!["auto", "en", "vi", "ko"].includes(studyTranslationSettings.sourceLanguage)) studyTranslationSettings.sourceLanguage = DEFAULT_STUDY_TRANSLATION_SETTINGS.sourceLanguage;
  if (!["auto", "same", "en", "vi", "ko"].includes(studyTranslationSettings.targetLanguage)) studyTranslationSettings.targetLanguage = DEFAULT_STUDY_TRANSLATION_SETTINGS.targetLanguage;
  const savedFlashcardTranslateSettings = settingsData[FLASHCARD_TRANSLATE_SETTINGS_KEY] && typeof settingsData[FLASHCARD_TRANSLATE_SETTINGS_KEY] === "object" ? settingsData[FLASHCARD_TRANSLATE_SETTINGS_KEY] : {};
  flashcardTranslateSettings = { ...DEFAULT_FLASHCARD_TRANSLATE_SETTINGS, ...savedFlashcardTranslateSettings };
  if (typeof savedFlashcardTranslateSettings.hasCustomSpeechRate !== "boolean") flashcardTranslateSettings.hasCustomSpeechRate = Number.isFinite(Number(savedFlashcardTranslateSettings.speechRate)) && Number(savedFlashcardTranslateSettings.speechRate) !== DEFAULT_FLASHCARD_TRANSLATE_SETTINGS.speechRate;
  if (typeof savedFlashcardTranslateSettings.hasCustomEnglishSpeechRate !== "boolean") flashcardTranslateSettings.hasCustomEnglishSpeechRate = Number.isFinite(Number(savedFlashcardTranslateSettings.flashcardEnglishSpeechRate)) && Number(savedFlashcardTranslateSettings.flashcardEnglishSpeechRate) !== DEFAULT_FLASHCARD_TRANSLATE_SETTINGS.flashcardEnglishSpeechRate;
  flashcardTranslateSettings.flashcardSpeechRateByLanguage = savedFlashcardTranslateSettings.flashcardSpeechRateByLanguage && typeof savedFlashcardTranslateSettings.flashcardSpeechRateByLanguage === "object" ? { ...savedFlashcardTranslateSettings.flashcardSpeechRateByLanguage } : {};
  const savedDisplayRateFlags = savedFlashcardTranslateSettings.hasCustomFlashcardLanguageSpeechRate && typeof savedFlashcardTranslateSettings.hasCustomFlashcardLanguageSpeechRate === "object" ? savedFlashcardTranslateSettings.hasCustomFlashcardLanguageSpeechRate : {};
  flashcardTranslateSettings.hasCustomFlashcardLanguageSpeechRate = { ...savedDisplayRateFlags };
  if (flashcardTranslateSettings.hasCustomEnglishSpeechRate && !Object.hasOwn(flashcardTranslateSettings.flashcardSpeechRateByLanguage, "en")) flashcardTranslateSettings.flashcardSpeechRateByLanguage.en = Number(savedFlashcardTranslateSettings.flashcardEnglishSpeechRate);
  for (const language of ["en", "vi", "ko"]) {
    const rate = Number(flashcardTranslateSettings.flashcardSpeechRateByLanguage[language]);
    if (Object.hasOwn(flashcardTranslateSettings.flashcardSpeechRateByLanguage, language)) flashcardTranslateSettings.flashcardSpeechRateByLanguage[language] = Number.isFinite(rate) ? Math.min(2, Math.max(.5, rate)) : 1.2;
    if (typeof flashcardTranslateSettings.hasCustomFlashcardLanguageSpeechRate[language] !== "boolean") flashcardTranslateSettings.hasCustomFlashcardLanguageSpeechRate[language] = Number.isFinite(rate) && Object.hasOwn(flashcardTranslateSettings.flashcardSpeechRateByLanguage, language);
  }
  if (typeof savedFlashcardTranslateSettings.useDashboardSpeechSettings !== "boolean") flashcardTranslateSettings.useDashboardSpeechSettings = savedFlashcardTranslateSettings.useDashboardSettings !== false;
  if (!["auto", "en-US", "vi-VN", "ko-KR"].includes(flashcardTranslateSettings.highlightSpeechLanguage)) flashcardTranslateSettings.highlightSpeechLanguage = "auto";
  if (!["auto", "en-US", "vi-VN", "ko-KR"].includes(flashcardTranslateSettings.noteSpeechLanguage)) flashcardTranslateSettings.noteSpeechLanguage = "auto";
  flashcardTranslateSettings.speechLanguageSettingsRevision = flashcardTranslateSettings.speechLanguageSettingsRevision && typeof flashcardTranslateSettings.speechLanguageSettingsRevision === "object" ? flashcardTranslateSettings.speechLanguageSettingsRevision : {};
  if (!flashcardTranslateSettings.useDashboardSettings) {
    if (!["auto", "en", "vi", "ko"].includes(flashcardTranslateSettings.sourceLanguage)) flashcardTranslateSettings.sourceLanguage = "auto";
    if (!["auto", "same", "en", "vi", "ko"].includes(flashcardTranslateSettings.targetLanguage)) flashcardTranslateSettings.targetLanguage = "auto";
  }
  if (!flashcardTranslateSettings.useDashboardSpeechSettings) {
    if (!["browser", "google"].includes(flashcardTranslateSettings.speechVoice)) flashcardTranslateSettings.speechVoice = "google";
    const rate = Number(flashcardTranslateSettings.speechRate);
    flashcardTranslateSettings.speechRate = Number.isFinite(rate) ? Math.min(2, Math.max(.5, rate)) : 1;
  }
  const flashcardEnglishRate = Number(flashcardTranslateSettings.flashcardEnglishSpeechRate);
  flashcardTranslateSettings.flashcardEnglishSpeechRate = Number.isFinite(flashcardEnglishRate) ? Math.min(2, Math.max(.5, flashcardEnglishRate)) : 1.2;
  studyFocusMode = studyPreferences.alwaysFocusMode;
  studyAutoSpeak = studyPreferences.alwaysAutoSpeak;
  studyShowShortcuts = settingsData[STUDY_SHOW_SHORTCUTS_KEY] !== false;
  updateStudyFocusButton();
  dashboardSettings = settingsData[CONFIG.STORAGE_KEYS.SETTINGS] || {};
  if (dashboardSettings.pronunciationDictionaryDefaultsInitialized !== true) {
    const dictionary = dashboardSettings.customPronunciationDictionary && typeof dashboardSettings.customPronunciationDictionary === "object" ? { ...dashboardSettings.customPronunciationDictionary } : {};
    if (!Object.hasOwn(dictionary, "en-US")) dictionary["en-US"] = [
      { id:"default-en-eg", original:"e.g.", replacement:"For example" },
      { id:"default-en-ie", original:"i.e.", replacement:"That is" },
      { id:"default-en-etc", original:"etc.", replacement:"Et cetera" },
      { id:"default-en-idk", original:"IDK", replacement:"I don't know" },
      { id:"default-en-fyi", original:"FYI", replacement:"For your information" }
    ];
    dashboardSettings = { ...dashboardSettings, customPronunciationDictionary:dictionary, pronunciationDictionaryDefaultsInitialized:true };
    try { await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]:dashboardSettings }); }
    catch (error) { console.warn("Could not initialize pronunciation dictionary defaults", error); }
  }
  demoProfile = settingsData[DEMO_PROFILE_KEY] && typeof settingsData[DEMO_PROFILE_KEY] === "object" ? settingsData[DEMO_PROFILE_KEY] : null;
  syncDashboardTheme();
  currentLang = I18N.languageFor(dashboardSettings); favorites = Array.isArray(settingsData[CONFIG.STORAGE_KEYS.FAVORITES]) ? settingsData[CONFIG.STORAGE_KEYS.FAVORITES] : [];
  favoriteNoteIds = new Set(Array.isArray(settingsData[CONFIG.STORAGE_KEYS.NOTE_FAVORITES]) ? settingsData[CONFIG.STORAGE_KEYS.NOTE_FAVORITES] : []);
  syncNoteFavoriteFilters();
  applyTranslations();
  syncBilingualPreview();
  annotations = await loadAnnotationsInBatches();
  annotationById.clear();
  annotationPositionById.clear();
  annotations.forEach((item, index) => { if (item?.id) { annotationById.set(item.id, item); annotationPositionById.set(item.id, index); } });
  filterOptionsCache = null;
  render();
  if ($("dashboardSettingsDialog")?.open) refreshDashboardSettings();
}
async function loadAnnotationsInBatches() {
  const items = [];
  let after = null, batchCount = 0;
  while (true) {
    const result = await browser.runtime.sendMessage({ type:"GET_BATCH", after, limit:CONFIG.LIMITS.DATABASE_BATCH_SIZE });
    if (!result || !Array.isArray(result.items)) throw new Error("Could not load dashboard annotations");
    items.push(...result.items);
    if (result.done || !result.items.length || result.nextAfter === after) break;
    after = result.nextAfter;
    // Yield periodically so a large local library does not monopolize the dashboard task.
    if (++batchCount % 8 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
  }
  return items;
}
function applyAnnotationChange(change, renderNow = true) {
  if (!change || typeof change !== "object") return false;
  if (change.type === "upsert" && change.item?.id) {
    const item = change.item, index = annotationPositionById.get(item.id);
    if (Number.isInteger(index)) annotations[index] = item;
    else { annotationPositionById.set(item.id, annotations.length); annotations.push(item); }
    annotationById.set(item.id, item);
  } else if (change.type === "delete" && typeof change.id === "string") {
    const index = annotationPositionById.get(change.id);
    if (Number.isInteger(index)) {
      annotations.splice(index, 1); annotationById.delete(change.id); annotationPositionById.delete(change.id);
      for (let i = index; i < annotations.length; i++) annotationPositionById.set(annotations[i].id, i);
    }
  } else if (change.type === "deletePage" && typeof change.url === "string") {
    let changed = false, write = 0;
    for (let read = 0; read < annotations.length; read++) {
      const item = annotations[read];
      if (pageKey(item) === change.url) {
        annotationById.delete(item.id); annotationPositionById.delete(item.id); changed = true;
        continue;
      }
      if (write !== read) annotations[write] = item;
      annotationPositionById.set(item.id, write++);
    }
    if (changed) annotations.length = write;
  } else return false;
  profileDataCache = null;
  filterOptionsCache = null;
  if (renderNow) render();
  return true;
}
function getFilteredAnnotations() {
  const query = $("search").value.trim().toLocaleLowerCase(), site = $("siteFilter").value, color = $("colorFilter").value, tag = $("tagFilter").value, dateRange = $("dateFilter").value;
  const dateCutoff = dateFilterCutoff(dateRange), normalizedTag = tag.toLocaleLowerCase();
  const filtered = annotations.filter(a => (!site || siteOf(a) === site) && (!color || CONFIG.normalizeColor(a.color) === color) && (!tag || tagsOf(a).some(value => value.toLocaleLowerCase() === normalizedTag)) && matchesDate(a, dateCutoff) && (!favoriteNotesOnly || favoriteNoteIds.has(a.id)) && (!query || searchRank(a, query) < Number.MAX_SAFE_INTEGER));
  if (query) filtered.sort((a, b) => searchRank(a, query) - searchRank(b, query));
  return filtered;
}
function syncNoteFavoriteFilters() {
  const button = $("favoriteNotesOnly");
  if (!button) return;
  button.classList.toggle("is-active", favoriteNotesOnly);
  button.setAttribute("aria-pressed", String(favoriteNotesOnly));
}
async function toggleNoteFavorite(item, button, event) {
  const wasFavorite = favoriteNoteIds.has(item.id);
  playToolbarActionEffect(button, event, "#f43f5e", "heart");
  if (wasFavorite) favoriteNoteIds.delete(item.id);
  else favoriteNoteIds.add(item.id);
  render();
  try {
    await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.NOTE_FAVORITES]: [...favoriteNoteIds] });
  } catch (error) {
    if (wasFavorite) favoriteNoteIds.add(item.id);
    else favoriteNoteIds.delete(item.id);
    render();
    console.warn("Could not save note favorite", error);
  }
}
function dashboardFilterOptions() {
  if (filterOptionsCache?.source === annotations && filterOptionsCache.language === currentLang) return filterOptionsCache;
  const sites = new Set(), tags = new Set();
  for (const item of annotations) {
    sites.add(siteOf(item));
    for (const tag of tagsOf(item)) tags.add(tag);
  }
  filterOptionsCache = { source:annotations, language:currentLang, sites:[...sites].sort((a, b) => a.localeCompare(b)), tags:[...tags].sort((a, b) => a.localeCompare(b, currentLang)) };
  return filterOptionsCache;
}
function buildPages(items) {
  const groups = new Map();
  for (const a of items) {
    const key = pageKey(a);
    if (!groups.has(key)) groups.set(key, { key, url: a.url || "", title: a.title || siteOf(a), site: siteOf(a), thumbnailUrl: a.thumbnailUrl || "", items: [] });
    const g = groups.get(key); g.items.push(a);
    g.searchRank = Math.min(g.searchRank ?? Number.MAX_SAFE_INTEGER, searchRank(a, $("search").value.trim().toLocaleLowerCase()));
    if ((!g.title || g.title === g.site) && a.title) g.title = a.title;
    if (!g.thumbnailUrl && a.thumbnailUrl) g.thumbnailUrl = a.thumbnailUrl;
  }
  const pages = [...groups.values()].map(g => {
    // Reductions avoid spreading potentially large annotation arrays into Math.min/max.
    g.createdAt = g.items.reduce((earliest, item) => {
      const createdAt = dateValue(item, "createdAt");
      return createdAt > 0 && createdAt < earliest ? createdAt : earliest;
    }, Infinity);
    if (!Number.isFinite(g.createdAt)) g.createdAt = 0;
    g.updatedAt = g.items.reduce((latest, item) => Math.max(latest, dateValue(item, "updatedAt") || dateValue(item, "createdAt")), 0);
    g.colors = [...new Set(g.items.map(a => CONFIG.normalizeColor(a.color)))];
    g.favorite = favorites.includes(g.key);
    return g;
  });
  const sort = $("sortBy").value;
  pages.sort((a, b) => {
    const relevance = $("search").value.trim() ? a.searchRank - b.searchRank : 0;
    return relevance || (sort === "count" ? b.items.length - a.items.length || b.updatedAt - a.updatedAt : sort === "edited" ? b.updatedAt - a.updatedAt || b.createdAt - a.createdAt : b.createdAt - a.createdAt || b.updatedAt - a.updatedAt);
  });
  return pages.filter(p => !favoritesOnly || p.favorite);
}
function render({ preserveSources = false } = {}) {
  renderProfileSidebar();
  const siteValue = $("siteFilter").value, colorValue = $("colorFilter").value, tagValue = $("tagFilter").value;
  const { sites, tags } = dashboardFilterOptions();
  $("siteFilter").innerHTML = `<option value="">${escapeHtml(t("allWebsites"))}</option>` + sites.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  if (sites.includes(siteValue)) $("siteFilter").value = siteValue;
  $("colorFilter").innerHTML = `<option value="">${escapeHtml(t("allColors"))}</option>` + CONFIG.COLORS.map(color => `<option value="${color}">${escapeHtml(t(CONFIG.colorLabelKey(color)))}</option>`).join("");
  if (CONFIG.COLORS.includes(colorValue)) $("colorFilter").value = colorValue;
  $("tagFilter").innerHTML = `<option value="">${escapeHtml(t("allTags"))}</option>` + tags.map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join("");
  if (tags.some(tag => tag.toLocaleLowerCase() === tagValue.toLocaleLowerCase())) $("tagFilter").value = tagValue;
  const filtered = getFilteredAnnotations();
  const pages = buildPages(filtered);
  const selectedStillVisible = pages.some(p => p.key === selectedUrl);
  if (!selectedStillVisible) selectedUrl = pages[0]?.key || null;
  $("count").textContent = t("notesCount", { count: filtered.length });
  $("pageCount").textContent = t("pagesCount", { count: pages.length });
  if (preserveSources) {
    $("sourceList").querySelectorAll(".source-item").forEach(row => row.classList.toggle("active", row.dataset.url === selectedUrl));
  } else renderSources(pages);
  const selected = pages.find(p => p.key === selectedUrl) || null;
  renderNoteColorFilters(selected);
  renderSelectedPage(selected, filtered);
  $("empty").hidden = filtered.length > 0 || !!selectedUrl;
  $("selectPrompt").hidden = !!selected || filtered.length === 0;
}
function renderSources(pages) {
  const host = $("sourceList");
  if (!pages.length) { incrementalListObservers.get(host)?.disconnect(); host.innerHTML = `<div class="source-empty">${escapeHtml(t("noMatchingPages"))}</div>`; return; }
  renderIncrementalList(host, pages, p => {
    const row = document.createElement("article"); row.className = `source-item${p.key === selectedUrl ? " active" : ""}`; row.dataset.url = p.key; row.tabIndex = 0; row.setAttribute("role", "button"); row.setAttribute("aria-label", p.title || p.site);
    row.innerHTML = `<div class="source-thumb">${p.thumbnailUrl ? `<img src="${escapeHtml(p.thumbnailUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}<span class="thumb-fallback" aria-hidden="true">${icon("file")}</span></div><div class="source-info"><div class="source-title">${escapeHtml(p.title || p.site)}</div><div class="source-host">${escapeHtml(p.site)}</div><div class="source-meta"><span class="source-date">${escapeHtml(fmtDate(p.createdAt))}</span><span class="source-meta-count">${p.colors.map(c => `<span class="color-dot ${c}" title="${escapeHtml(t(`color${c[0].toUpperCase()}${c.slice(1)}`))}"></span>`).join("")}<span class="source-count-number">${p.items.length}</span><span class="source-count-icon">${icon("square-text")}</span></span></div></div>`;
    const sourceQuery = $("search").value.trim();
    highlightSearchMatches(row.querySelector(".source-title"), sourceQuery);
    highlightSearchMatches(row.querySelector(".source-host"), sourceQuery);
    const img = row.querySelector("img");
    if (img) {
      const fallback = row.querySelector(".thumb-fallback");
      img.addEventListener("load", () => { if (fallback) fallback.hidden = true; }, { once: true });
      img.addEventListener("error", () => { img.remove(); }, { once: true });
      if (img.complete && img.naturalWidth > 0 && fallback) fallback.hidden = true;
    }
    const choose = () => { selectedUrl = p.key; render({ preserveSources: true }); };
    row.addEventListener("click", choose); row.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } }); return row;
  }, { initial: CONFIG.LIMITS.DASHBOARD_SOURCE_INITIAL, batch: CONFIG.LIMITS.DASHBOARD_SOURCE_BATCH });
}
function refreshFavoriteDashboard() {
  const pages = buildPages(getFilteredAnnotations());
  if (!pages.some(page => page.key === selectedUrl)) { render(); return; }
  renderSources(pages);
  const page = pages.find(item => item.key === selectedUrl);
  const button = $("favoritePageBtn"), isFavorite = favorites.includes(page.key);
  button.disabled = false;
  button.classList.toggle("is-favorite", isFavorite);
  button.classList.toggle("is-active", isFavorite);
  button.title = isFavorite ? t("removeFavorite") : t("addFavorite");
  button.setAttribute("aria-label", button.title);
}
function renderNoteColorFilters(page) {
  const host = $("noteColorFilters");
  const options = [{ id: "all", label: t("all") }, ...CONFIG.COLORS.map(color => ({ id: color, label: t(CONFIG.colorLabelKey(color)) }))];
  if (!page) noteColorFilter = "all";
  const total = page?.items.length || 0;
  const counts = Object.fromEntries(CONFIG.COLORS.map(color => [color, 0]));
  for (const item of page?.items || []) counts[CONFIG.normalizeColor(item.color)]++;
  host.innerHTML = options.map(option => {
    const countLabel = option.id === "all" ? `${total}` : `${counts[option.id]}/${total}`;
    return `<button type="button" class="note-color-filter${noteColorFilter === option.id ? " is-active" : ""}" data-filter="${option.id}" aria-pressed="${noteColorFilter === option.id}">${option.id === "all" ? "" : `<span class="lhn-filter-swatch lhn-swatch-${option.id}"></span>`}<span>${escapeHtml(option.label)}</span><span class="filter-count">${countLabel}</span></button>`;
  }).join("");
  host.hidden = !page;
}

function setSelectedFavicon(pageUrl) {
  const host = $("selectedFavicon");
  let origin = "";
  try { origin = new URL(pageUrl).origin; } catch { host.innerHTML = icon("file"); return; }
  const img = document.createElement("img");
  const direct = `${origin}/favicon.ico`;
  const fallback = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(pageUrl)}&sz=64`;
  img.alt = ""; img.referrerPolicy = "no-referrer";
  img.addEventListener("error", () => {
    if (!img.dataset.fallbackUsed) { img.dataset.fallbackUsed = "1"; img.src = fallback; }
    else host.innerHTML = icon("file");
  });
  host.replaceChildren(img); img.src = direct;
}

function renderSelectedPage(page, filtered) {
  const header = $("notesHeader"), list = $("notesList"), empty = $("empty"), prompt = $("selectPrompt");
  incrementalListObservers.get(list)?.disconnect();
  list.innerHTML = "";
  updateViewModeButton();
  if (!page) {
    $("selectedTitle").textContent = t("selectSource"); $("selectedUrl").textContent = ""; $("selectedUrl").removeAttribute("href"); $("selectedMeta").textContent = ""; $("selectedFavicon").innerHTML = icon("file");
    $("favoritePageBtn").disabled = true; $("exportPageBtn").disabled = true; $("deletePageBtn").disabled = true; $("favoritePageBtn").classList.remove("is-favorite", "is-active");
    setDisabledTooltip($("favoritePageBtn"), $("favoritePageBtn"), t("disabledNoPage"));
    setDisabledTooltip($("exportPageBtn"), $("exportPageBtn"), t("disabledNoPage"));
    setDisabledTooltip($("deletePageBtn"), $("deletePageBtn"), t("disabledNoPage"));
    header.classList.add("no-selection"); empty.hidden = filtered.length > 0; prompt.hidden = filtered.length === 0; return;
  }
  header.classList.remove("no-selection"); prompt.hidden = true; empty.hidden = true;
  $("selectedTitle").textContent = page.title || page.site;
  const link = $("selectedUrl"); link.textContent = page.url; link.href = page.url;
  $("selectedMeta").textContent = `${t("createdLabel")}: ${fmtDate(page.createdAt)} · ${t("editedLabel")}: ${fmtDate(page.updatedAt)} · ${page.items.length} ${t("highlightsShort")}`;
  setSelectedFavicon(page.url);
  const fav = favorites.includes(page.key), favBtn = $("favoritePageBtn"); favBtn.disabled = false; setDisabledTooltip(favBtn, favBtn, ""); favBtn.classList.toggle("is-favorite", fav); favBtn.innerHTML = icon("heart"); favBtn.classList.toggle("is-active", fav); favBtn.title = fav ? t("removeFavorite") : t("addFavorite"); favBtn.setAttribute("aria-label", favBtn.title);
  $("exportPageBtn").disabled = false; setDisabledTooltip($("exportPageBtn"), $("exportPageBtn"), "");
  $("deletePageBtn").disabled = page.items.length === 0;
  if (!$("deletePageBtn").disabled) setDisabledTooltip($("deletePageBtn"), $("deletePageBtn"), "");
  $("deletePageBtn").title = t("deletePageButton"); $("deletePageBtn").setAttribute("aria-label", t("deletePageButton"));
  setDisabledTooltip($("deletePageBtn"), $("deletePageBtn"), $("deletePageBtn").disabled ? t("disabledEmptyPage") : "");
  // Match the on-page order used by the sidebar. Older annotations without
  // pageOrder retain a stable creation-date fallback until the page is visited.
  const query = $("search").value.trim().toLocaleLowerCase();
  const allNotes = page.items.slice().sort((a, b) => {
    if (query) { const relevance = searchRank(a, query) - searchRank(b, query); if (relevance) return relevance; }
    const orderA = Number.isFinite(a.pageOrder) ? a.pageOrder : Infinity;
    const orderB = Number.isFinite(b.pageOrder) ? b.pageOrder : Infinity;
    return orderA - orderB || (dateValue(a, "createdAt") || 0) - (dateValue(b, "createdAt") || 0);
  });
  const notes = noteColorFilter === "all" ? allNotes : allNotes.filter(a => CONFIG.normalizeColor(a.color) === noteColorFilter);
  if (!notes.length && noteColorFilter !== "all") {
    list.innerHTML = `<div class="empty color-filter-empty">${escapeHtml(t("noColorHighlights"))}</div>`;
    return;
  }
  renderIncrementalList(list, notes, a => {
    const card = document.createElement("article"); card.className = "lhn-sidebar-card card";
    const tagsHtml = tagsOf(a).map(tag => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("");
    const isNoteFavorite = favoriteNoteIds.has(a.id), favoriteLabel = t(isNoteFavorite ? "removeFavorite" : "addFavorite"), escapedId = escapeHtml(a.id);
    card.classList.toggle("has-note-favorite", isNoteFavorite);
    card.innerHTML = `${isNoteFavorite ? `<button class="note-favorite-corner" data-action="favorite-note" data-id="${escapedId}" title="${escapeHtml(favoriteLabel)}" aria-label="${escapeHtml(favoriteLabel)}">${icon("heart")}</button>` : ""}<div class="lhn-sidebar-quote-row"><span class="lhn-sidebar-swatch lhn-swatch-${escapeHtml(CONFIG.normalizeColor(a.color))}"></span><div class="lhn-sidebar-quote">${escapeHtml(a.quote)}</div></div><div class="lhn-sidebar-note">${escapeHtml(a.note || t("noNoteAdded"))}</div><div class="lhn-sidebar-context-note"></div>${tagsHtml ? `<div class="tag-list">${tagsHtml}</div>` : ""}<div class="lhn-sidebar-actions card-actions"><button class="lhn-side-btn" data-action="jump" data-id="${escapedId}" title="${escapeHtml(t("jumpToHighlight"))}" aria-label="${escapeHtml(t("jumpToHighlight"))}">${icon("external")}</button><button class="lhn-side-btn" data-action="edit" data-id="${escapedId}" title="${escapeHtml(t("edit"))}" aria-label="${escapeHtml(t("edit"))}">${icon("edit")}</button><button class="lhn-side-btn" data-action="delete" data-id="${escapedId}" title="${escapeHtml(t("delete"))}" aria-label="${escapeHtml(t("delete"))}">${icon("trash")}</button><button class="lhn-side-btn" data-action="speak" data-id="${escapedId}" title="${escapeHtml(t("speakHighlightTooltip"))}" aria-label="${escapeHtml(t("speakHighlightTooltip"))}">${icon("volume")}</button><button class="lhn-side-btn note-favorite-btn${isNoteFavorite ? " is-favorite" : ""}" data-action="favorite-note" data-id="${escapedId}" title="${escapeHtml(favoriteLabel)}" aria-label="${escapeHtml(favoriteLabel)}">${icon("heart")}</button></div>`;
    if (a.contextNote) appendContextSentence(card.querySelector(".lhn-sidebar-context-note"), a.contextNote, a.quote);
    else card.querySelector(".lhn-sidebar-context-note")?.remove();
    highlightSearchMatches(card, query);
    return card;
  }, { initial: CONFIG.LIMITS.DASHBOARD_NOTE_INITIAL, batch: CONFIG.LIMITS.DASHBOARD_NOTE_BATCH });
}

$("selectedUrl").addEventListener("click", async event => {
  const href = event.currentTarget.href;
  if (!href || href === "#") return;
  event.preventDefault();
  const normalizeUrl = value => { try { return new URL(value).href; } catch { return ""; } };
  const targetUrl = normalizeUrl(href);
  if (!targetUrl) return;
  try {
    const tabs = await browser.tabs.query({});
    const existing = tabs.find(tab => normalizeUrl(tab.url || tab.pendingUrl) === targetUrl);
    if (existing?.id != null) {
      await browser.tabs.update(existing.id, { active: true });
      if (existing.windowId != null) await browser.windows.update(existing.windowId, { focused: true });
    } else {
      await browser.tabs.create({ url: targetUrl, active: true });
    }
  } catch (error) { console.warn("Could not activate the source tab", error); }
});
function renderExportMenus() {
  for (const menuId of ["exportAllMenu", "exportPageMenu", "settingsBackupExportMenu"]) {
    const menu = $(menuId); if (!menu) continue;
    menu.innerHTML = EXPORTS.map(f => `<button class="export-option" data-export="${f.id}"><span class="file-icon ${f.id}">${icon(f.icon)}</span><span>${escapeHtml(t(f.labelKey))} <span class="export-ext">(.${f.ext})</span></span></button>`).join("");
  }
}
function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
function exportContent(format, items) {
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "json") return { text: JSON.stringify({ format: "local-highlight-notes", version: 1, exportedAt: new Date().toISOString(), annotations: items, favorites: [...new Set(items.map(pageKey).filter(key => favorites.includes(key)))], favoriteNoteIds: items.filter(item => favoriteNoteIds.has(item.id)).map(item => item.id) }, null, 2), mime: "application/json", filename: `highlight-notes-${stamp}.json` };
  if (format === "csv") {
    const cols = ["title", "url", "quote", "note", "contextNote", "tags", "color", "createdAt", "updatedAt"];
    const rows = [cols.map(csvCell).join(","), ...items.map(a => cols.map(k => csvCell(k === "tags" ? tagsOf(a).join("; ") : a[k])).join(","))];
    return { text: "\uFEFF" + rows.join("\r\n"), mime: "text/csv;charset=utf-8", filename: `highlight-notes-${stamp}.csv` };
  }
  if (format === "md") {
    const groups = new Map(); items.forEach(a => { const key = pageKey(a); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(a); });
    const sections = [`# ${t("appName")}`, "", `_${t("exportedOn")}: ${new Date().toLocaleDateString()}_`, ""];
    for (const group of groups.values()) { const first = group[0]; sections.push(`## [${(first.title || siteOf(first)).replace(/[\[\]]/g, "\\$")}](${first.url})`, ""); for (const a of group) { sections.push(`- **${String(a.quote || "").replace(/\n/g, " ")}**`, "", `  ${String(a.note || t("noNoteAdded")).replace(/\n/g, "\n  ")}`, ...(a.contextNote ? ["", `  ${String(a.contextNote).replace(/\n/g, "\n  ")}`] : []), ...(tagsOf(a).length ? ["", `  _${t("tagsLabel")}: ${tagsOf(a).join(", ")}_`] : []), "", `  _${t("highlightColor")}: ${a.color || "yellow"} · ${fmtDate(a.createdAt)}_`, ""); } }
    return { text: sections.join("\n"), mime: "text/markdown;charset=utf-8", filename: `highlight-notes-${stamp}.md` };
  }
  const groups = new Map(); items.forEach(a => { const key = pageKey(a); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(a); });
  const lines = [`${t("appName")}`, "=".repeat(t("appName").length), ""];
  for (const group of groups.values()) { const first = group[0]; lines.push(first.title || siteOf(first), first.url, "-".repeat(50), ""); for (const a of group) { lines.push(`[${(a.color || "yellow").toUpperCase()}] ${a.quote || ""}`, a.note || t("noNoteAdded"), ...(a.contextNote ? [a.contextNote] : []), ...(tagsOf(a).length ? [`${t("tagsLabel")}: ${tagsOf(a).join(", ")}`] : []), `${t("createdLabel")}: ${fmtDate(a.createdAt)}`, ""); } lines.push(""); }
  return { text: lines.join("\n"), mime: "text/plain;charset=utf-8", filename: `highlight-notes-${stamp}.txt` };
}
function downloadExport(format, items) {
  const output = exportContent(format, items); const blob = new Blob([output.text], { type: output.mime }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = output.filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1200); toast(t("exportStarted"));
}
async function downloadJsonExport(pageUrl = null) {
  const stamp = new Date().toISOString().slice(0, 10), exportedAt = new Date().toISOString();
  const parts = [`{"format":"local-highlight-notes","version":1,"exportedAt":${JSON.stringify(exportedAt)},"annotations":[`];
  const pageKeys = new Set(), exportedFavoriteNoteIds = []; let after = null, first = true;
  do {
    const batch = await browser.runtime.sendMessage({ type:"GET_BATCH", after, limit:CONFIG.LIMITS.DATABASE_BATCH_SIZE, url:pageUrl });
    if (!batch || !Array.isArray(batch.items)) throw new Error("Could not read export data");
    for (const item of batch.items) {
      if (!first) parts.push(",");
      parts.push(JSON.stringify(item)); first = false; pageKeys.add(pageKey(item));
      if (favoriteNoteIds.has(item.id)) exportedFavoriteNoteIds.push(item.id);
    }
    if (batch.done || !batch.items.length || batch.nextAfter === after) break;
    after = batch.nextAfter;
  } while (true);
  const exportedFavorites = favorites.filter(key => pageKeys.has(key));
  parts.push(`],"favorites":${JSON.stringify(exportedFavorites)},"favoriteNoteIds":${JSON.stringify(exportedFavoriteNoteIds)}}`);
  const blob = new Blob(parts, { type:"application/json" }), blobUrl = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = blobUrl; anchor.download = `highlight-notes-${stamp}.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(blobUrl), 1200); toast(t("exportStarted"));
}
function closeMenus() {
  $("exportAllMenu").hidden = true; $("exportPageMenu").hidden = true; $("settingsBackupExportMenu").hidden = true; $("profileMenu").hidden = true;
  $("profileMenuToggle").setAttribute("aria-expanded", "false"); $("exportAllBtn").setAttribute("aria-expanded", "false"); $("exportPageBtn").setAttribute("aria-expanded", "false");
  $("settingsExportButton").setAttribute("aria-expanded", "false");
}
$("sourceList").addEventListener("click", e => { if (e.target.closest("button")) return; });
$("notesList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-action]"); if (!b) return; const item = annotations.find(a => a.id === b.dataset.id); if (!item) return;
  if (b.dataset.action === "favorite-note") { await toggleNoteFavorite(item, b, e); return; }
  if (b.dataset.action === "jump") { const result = await browser.runtime.sendMessage({ type: "OPEN_HIGHLIGHT", url: item.url, id: item.id }); if (!result?.found) toast(t("highlightNotFound")); return; }
  if (b.dataset.action === "edit") { openEditDialog(item); }
  if (b.dataset.action === "delete" && confirm(t("deleteAnnotationConfirm"))) { await browser.runtime.sendMessage({ type: "DELETE", id: item.id, origin: DASHBOARD_INSTANCE_ID }); applyAnnotationChange({ type:"delete", id:item.id }); toast(t("deleted")); }
  if (b.dataset.action === "speak") { const card = b.closest(".card"); if (!item.quote || !card) return; card.classList.add("lhn-reading-text"); speakText(item.quote, detectLanguage(item.quote, item.url), () => card.classList.remove("lhn-reading-text")); }
});

function detectLanguage(text, url) {
  const s = String(text || "");
  if (/[\uAC00-\uD7AF]/.test(s)) return "ko-KR";
  if (/[\u3040-\u30FF]/.test(s)) return "ja-JP";
  if (/[\u4E00-\u9FFF]/.test(s)) return "zh-CN";
  if (/[\u0E00-\u0E7F]/.test(s)) return "th-TH";
  if (/[\u0600-\u06FF]/.test(s)) return "ar-SA";
  if (/[\u0900-\u097F]/.test(s)) return "hi-IN";
  if (/[\u0400-\u04FF]/.test(s)) return "ru-RU";
  if (/[ăâđêôơưĂÂĐÊÔƠƯ]/.test(s)) return "vi-VN";
  const lower = ` ${s.toLowerCase().replace(/[^\p{L}]+/gu, " ")} `;
  if (/\b(the|and|with|this|that|from|which|have|will)\b/.test(lower)) return "en-US";
  if (/\b(le|la|les|des|une|est|avec|pour|dans|que)\b/.test(lower)) return "fr-FR";
  if (/\b(der|die|das|und|ist|mit|für|nicht|auf)\b/.test(lower)) return "de-DE";
  if (/\b(el|la|los|las|una|que|para|con|del)\b/.test(lower)) return "es-ES";
  if (/\b(il|lo|gli|una|che|per|con|della)\b/.test(lower)) return "it-IT";
  if (/\b(o|os|uma|que|para|com|não|dos|das)\b/.test(lower)) return "pt-PT";
  // Match webpage speech detection: unrecognized Latin text defaults to English before consulting page locale.
  if (/[A-Za-z]/.test(s)) return "en-US";
  try { const base = new URL(url).hostname; if (base.endsWith(".vn")) return "vi-VN"; if (base.endsWith(".fr")) return "fr-FR"; if (base.endsWith(".de")) return "de-DE"; if (base.endsWith(".es")) return "es-ES"; } catch {}
  return "en-US";
}
const SPEECH_LANGUAGE_FLAGS = Object.freeze({ en:"🇺🇸", vi:"🇻🇳", ko:"🇰🇷", ja:"🇯🇵", zh:"🇨🇳", th:"🇹🇭", ar:"🇸🇦", hi:"🇮🇳", ru:"🇷🇺", uk:"🇺🇦", fr:"🇫🇷", de:"🇩🇪", es:"🇪🇸", it:"🇮🇹", pt:"🇵🇹", nl:"🇳🇱", el:"🇬🇷", he:"🇮🇱", bn:"🇧🇩" });
function studySourceSpeechLanguage(text, url) {
  const configured = { en:"en-US", vi:"vi-VN", ko:"ko-KR" }[getEffectiveFlashcardTranslationSettings().sourceLanguage];
  return configured || detectLanguage(text, url);
}
function studySpeechSettingKey(field) { return field === "quote" ? "highlightSpeechLanguage" : field === "note" ? "noteSpeechLanguage" : ""; }
function studySpeechSettingRevisionKey(field) { return field === "quote" ? "highlight" : field === "note" ? "note" : ""; }
function getStudySpeechChoice(item, field) {
  const cardChoice = item?.speechLanguages?.[field];
  const cardRevision = Number(item?.speechLanguageRevision?.[field]) || 0;
  const settingKey = studySpeechSettingKey(field);
  if (!settingKey) return { choice:cardChoice || "auto", revision:cardRevision, source:cardChoice ? "card" : "auto" };
  const settingRevision = Number(flashcardTranslateSettings.speechLanguageSettingsRevision?.[studySpeechSettingRevisionKey(field)]) || 0;
  if (cardRevision > settingRevision || (!settingRevision && cardChoice)) return { choice:cardChoice || "auto", revision:cardRevision, source:cardChoice ? "card" : "auto" };
  if (settingRevision) return { choice:flashcardTranslateSettings[settingKey] || "auto", revision:settingRevision, source:"settings" };
  return { choice:"auto", revision:0, source:"auto" };
}
function currentStudySpeechSelection(item, field, text) {
  const { choice, revision, source } = getStudySpeechChoice(item, field);
  const manual = ["en-US", "vi-VN", "ko-KR"].includes(choice);
  const language = manual ? choice : (field === "quote" || field === "note" ? detectLanguage(text, item?.url) : studySourceSpeechLanguage(text, item?.url));
  return { language, manual, revision, source };
}
function refreshStudySpeechLanguageControls(item) {
  if (!item) return;
  document.querySelectorAll("#studyDialog [data-study-speech-language]").forEach(select => {
    const field = select.dataset.studySpeechLanguage;
    const selection = getStudySpeechChoice(item, field);
    const manual = ["en-US", "vi-VN", "ko-KR"].includes(selection.choice) ? selection.choice : "";
    const sample = field === "quote" ? item.quote : field === "note" ? item.note : item.contextNote;
    const detected = manual || (field === "quote" || field === "note" ? detectLanguage(sample, item.url) : studySourceSpeechLanguage(sample, item.url));
    const base = detected.toLowerCase().split("-")[0];
    const flag = SPEECH_LANGUAGE_FLAGS[base] || "🌐";
    const nameKey = base === "vi" ? "languageVietnamese" : base === "ko" ? "languageKorean" : base === "en" ? "languageEnglish" : "";
    const configuredSource = field === "context" && getEffectiveFlashcardTranslationSettings().sourceLanguage !== "auto";
    const languageName = manual || configuredSource ? t(nameKey || "speechLanguage") : `${t("speechLanguageAuto")} · ${nameKey ? t(nameKey) : detected}`;
    select.value = selection.choice;
    const flagNode = select.parentElement.querySelector(".study-speech-language-flag");
    if (flagNode) flagNode.textContent = flag;
    select.title = `${t("speechLanguage")}: ${languageName}`;
    select.setAttribute("aria-label", select.title);
    select.parentElement.title = select.title;
  });
}
async function saveStudySpeechLanguage(select) {
  const item = currentStudyCard(), field = select.dataset.studySpeechLanguage;
  if (!item || !["quote", "note", "context"].includes(field)) return;
  const speechLanguages = { ...(item.speechLanguages || {}) };
  const speechLanguageRevision = { ...(item.speechLanguageRevision || {}) };
  if (select.value === "auto") delete speechLanguages[field];
  else speechLanguages[field] = select.value;
  if (select.value === "auto" && field === "context") delete speechLanguageRevision[field];
  else speechLanguageRevision[field] = Math.max(Date.now(), (Number(speechLanguageRevision[field]) || 0) + 1, (Number(flashcardTranslateSettings.speechLanguageSettingsRevision?.[studySpeechSettingRevisionKey(field)]) || 0) + 1);
  const updated = { ...item };
  if (Object.keys(speechLanguages).length) updated.speechLanguages = speechLanguages;
  else delete updated.speechLanguages;
  if (Object.keys(speechLanguageRevision).length) updated.speechLanguageRevision = speechLanguageRevision;
  else delete updated.speechLanguageRevision;
  // Apply the override locally before awaiting storage so an immediate Speak click uses it.
  applyAnnotationChange({ type:"upsert", item:updated }, false);
  studyQueue = studyQueue.map(card => card.id === updated.id ? updated : card);
  refreshStudySpeechLanguageControls(updated);
  document.querySelectorAll("#studyDialog [data-study-speech-language]").forEach(control => { control.disabled = true; setDisabledTooltip(control, control.closest(".study-speech-language-control"), t("disabledSavingLanguage")); });
  try {
    const saved = await browser.runtime.sendMessage({ type:"UPDATE", item:updated, origin:DASHBOARD_INSTANCE_ID });
    applyAnnotationChange({ type:"upsert", item:saved }, false);
    studyQueue = studyQueue.map(card => card.id === saved.id ? saved : card);
    renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
  } catch (error) {
    console.warn("Could not save flashcard speech language", error);
    applyAnnotationChange({ type:"upsert", item }, false);
    studyQueue = studyQueue.map(card => card.id === item.id ? item : card);
    renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
    toast(t("studySaveFailed"));
  } finally {
    document.querySelectorAll("#studyDialog [data-study-speech-language]").forEach(control => { control.disabled = false; setDisabledTooltip(control, control.closest(".study-speech-language-control"), ""); });
  }
}
let speechRequestId = 0;
let studySpeakAudio = null, studySpeakObjectUrl = null;
function stopStudyAudio() {
  const audio = studySpeakAudio, objectUrl = studySpeakObjectUrl;
  studySpeakAudio = null; studySpeakObjectUrl = null;
  if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.removeAttribute("src"); audio.load(); }
  if (objectUrl) URL.revokeObjectURL(objectUrl);
}
function getSpeechRate(speechSettings = dashboardSettings, spokenLanguage) {
  const displayLanguage = I18N.languageFor(speechSettings);
  const speechLanguage = String(spokenLanguage || "").trim().replace(/_/g, "-").split("-")[0].toLowerCase();
  const flashcardDisplayLanguageRate = speechSettings.useDashboardSpeechSettings === false && speechLanguage === displayLanguage
    ? (speechSettings.flashcardSpeechRateByLanguage?.[displayLanguage] ?? speechSettings.flashcardDashboardDisplayRate)
    : undefined;
  const inheritedRate = speechSettings.inheritedSpeechRateByLanguage?.[displayLanguage];
  const customRate = flashcardDisplayLanguageRate ?? (speechSettings.useLanguageSpeechRate === true && speechLanguage === displayLanguage
    ? speechSettings.hasCustomSpeechRateByLanguage?.[displayLanguage] === true ? speechSettings.speechRateByLanguage?.[displayLanguage] : inheritedRate
    : undefined);
  const rate = Number(customRate ?? speechSettings.speechRate);
  return Number.isFinite(rate) ? Math.min(2, Math.max(.5, rate)) : 1;
}
function speakSystemText(text, lang, onEnd, shouldSpeak, requestId, speechRate = getSpeechRate(dashboardSettings, lang)) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || requestId !== speechRequestId || !shouldSpeak()) { onEnd?.(); return; }
  const synth = window.speechSynthesis;
  if (synth.paused) synth.resume();
  const normalizeLanguage = value => String(value || "").trim().replace(/_/g, "-").toLowerCase();
  const target = normalizeLanguage(lang), base = target.split("-")[0];
  const findVoice = voices => voices.find(voice => normalizeLanguage(voice.lang) === target)
    || voices.find(voice => normalizeLanguage(voice.lang).split("-")[0] === base);
  const playWithVoices = voices => {
    if (requestId !== speechRequestId || !shouldSpeak()) return;
    const voice = findVoice(voices);
    if (!voice) { toast("Trình duyệt bạn không hỗ trợ ngôn ngữ này"); onEnd?.({ unsupported:true }); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice; utterance.lang = voice.lang || lang; utterance.rate = speechRate;
    if (typeof onEnd === "function") { utterance.onend = onEnd; utterance.onerror = onEnd; }
    synth.speak(utterance);
  };
  const voices = synth.getVoices();
  if (findVoice(voices) || voices.length || !synth.addEventListener) { playWithVoices(voices); return; }
  let finished = false, timeoutId;
  const finish = () => {
    if (finished) return;
    finished = true; window.clearTimeout(timeoutId); synth.removeEventListener?.("voiceschanged", onVoicesChanged);
    playWithVoices(synth.getVoices());
  };
  const onVoicesChanged = () => { if (findVoice(synth.getVoices())) finish(); };
  synth.addEventListener("voiceschanged", onVoicesChanged);
  timeoutId = window.setTimeout(finish, 900);
}
async function speakText(text, lang, onEnd, shouldSpeak = () => true, cacheVoice = "google-translate-default", speechSettings = dashboardSettings) {
  const sample = LHN_PREPROCESS_SPEECH(String(text || "").trim(), lang, speechSettings);
  if (!sample) { onEnd?.(); return; }
  const requestId = ++speechRequestId;
  window.speechSynthesis?.cancel(); stopStudyAudio();
  const speechRate = getSpeechRate(speechSettings, lang);
  if (speechSettings.speechVoice === "browser") { speakSystemText(sample, lang, onEnd, shouldSpeak, requestId, speechRate); return; }
  const language = String(lang || "en-US").replace(/_/g, "-").split("-")[0].toLowerCase() || "en";
  LHN_TTS.play({
    text: sample, lang, googleLanguage: language, voice: `${cacheVoice}:${language}`, rate: speechRate,
    isActive: () => requestId === speechRequestId && shouldSpeak(),
    setCurrent: (audio, url) => { studySpeakAudio = audio; studySpeakObjectUrl = url; },
    clearCurrent: () => { studySpeakAudio = null; studySpeakObjectUrl = null; },
    systemSpeak: (t, l, done) => speakSystemText(t, l, done, shouldSpeak, requestId, speechRate),
    onEnd
  });
}

let editTagsEditor = null;
function openEditDialog(item) {
  editingId = item.id; editColor = CONFIG.normalizeColor(item.color);
  $("editQuotePreview").textContent = item.quote || ""; $("editNote").value = item.note || ""; $("editContextNote").value = item.contextNote || ""; editTagsEditor = setupTagEditor($("editTags"), tagsOf(item));
  $("editColors").querySelectorAll(".composer-color").forEach(button => {
    const color = button.dataset.color; button.className = `composer-color composer-${color}`;
    button.title = t(`color${color[0].toUpperCase()}${color.slice(1)}`); button.setAttribute("aria-label", button.title); button.setAttribute("aria-pressed", String(color === editColor));
  });
  $("editDialog").showModal();
  resizeEditNoteFields();
  $("editNote").focus({ preventScroll: true });
}
function autoGrowEditField(field, minHeight) {
  field.style.height = `${minHeight}px`;
  field.style.height = Math.max(minHeight, field.scrollHeight) + "px";
}
function resizeEditNoteFields() {
  autoGrowEditField($("editNote"), 46);
  autoGrowEditField($("editContextNote"), 70);
}
$("editNote").addEventListener("input", () => autoGrowEditField($("editNote"), 46));
$("editContextNote").addEventListener("input", () => autoGrowEditField($("editContextNote"), 70));
$("editColors").addEventListener("click", e => { const button = e.target.closest("button[data-color]"); if (!button) return; editColor = button.dataset.color; $("editColors").querySelectorAll(".composer-color").forEach(el => el.setAttribute("aria-pressed", String(el === button))); });
$("closeEdit").addEventListener("click", () => $("editDialog").close());
let savingEdit = false;
async function saveEdit() {
  if (savingEdit) return;
  const item = annotations.find(a => a.id === editingId);
  if (!item) return;
  const note = $("editNote").value.trim(), contextNote = $("editContextNote").value.trim(), tags = editTagsEditor?.getTags() || [];
  if (note === String(item.note || "").trim() && contextNote === String(item.contextNote || "").trim() && editColor === CONFIG.normalizeColor(item.color) && tagsEqual(tags, item.tags)) { $("editDialog").close(); return; }
  savingEdit = true;
  try {
    const saved = await browser.runtime.sendMessage({ type: "UPDATE", item: { ...item, note, contextNote, color: editColor, tags }, origin: DASHBOARD_INSTANCE_ID });
    $("editDialog").close();
    applyAnnotationChange({ type:"upsert", item:saved });
    if ($("studyDialog").open) {
      const updatedCard = annotations.find(annotation => annotation.id === editingId);
      if (updatedCard && currentStudyCard()?.id === editingId) {
        studyQueue[studyQueueHead] = updatedCard;
        stopStudySpeech(); renderStudyCard({ autoSpeak: false });
      }
    }
    toast(t("savedChanges"));
  } finally { savingEdit = false; }
}
[$("editNote"), $("editContextNote")].forEach(textarea => textarea.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  event.preventDefault(); event.stopPropagation();
  if (event.ctrlKey || event.metaKey) {
    textarea.setRangeText("\n", textarea.selectionStart, textarea.selectionEnd, "end");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  } else saveEdit();
}));
$("editDialog").addEventListener("click", async e => {
  if (e.target === $("editDialog")) await saveEdit();
});
$("editDialog").addEventListener("cancel", e => { e.preventDefault(); $("editDialog").close(); });
$("editForm").addEventListener("submit", e => { e.preventDefault(); saveEdit(); });
$("noteColorFilters").addEventListener("click", e => {
  const button = e.target.closest("button[data-filter]");
  if (!button || !e.currentTarget.contains(button)) return;
  e.preventDefault(); e.stopPropagation();
  noteColorFilter = button.dataset.filter;
  render();
});
$("actionButtonsSection").addEventListener("click", event => {
  if (event.target.closest("#profileEditAction")) openDashboardSettings();
});
let dashboardSearchTimer = 0;
$("search").addEventListener("input", () => {
  clearTimeout(dashboardSearchTimer);
  dashboardSearchTimer = setTimeout(render, CONFIG.TIMINGS.DASHBOARD_SEARCH_DEBOUNCE_MS);
});
$("siteFilter").addEventListener("change", render); $("colorFilter").addEventListener("change", render); $("tagFilter").addEventListener("change", render); $("dateFilter").addEventListener("change", render); $("sortBy").addEventListener("change", render);
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
    if (document.querySelector("dialog[open]")) return;
    e.preventDefault(); e.stopPropagation();
    const search = $("search"); search.focus(); search.setSelectionRange(search.value.length, search.value.length);
    return;
  }
  if (e.key === "Escape" && !document.querySelector("dialog[open]")) {
    e.preventDefault(); e.stopPropagation(); $("clearFiltersBtn").click();
  }
}, true);
$("favoritesOnly").addEventListener("click", () => { favoritesOnly = !favoritesOnly; $("favoritesOnly").classList.toggle("is-active", favoritesOnly); $("favoritesOnly").setAttribute("aria-pressed", String(favoritesOnly)); render(); });
$("favoriteNotesOnly").addEventListener("click", () => { favoriteNotesOnly = !favoriteNotesOnly; syncNoteFavoriteFilters(); render(); });
$("clearFiltersBtn").addEventListener("click", event => { playToolbarActionEffect(event.currentTarget, event, "#3b82f6", "sparkle"); $("search").value = ""; $("siteFilter").value = ""; $("colorFilter").value = ""; $("tagFilter").value = ""; $("dateFilter").value = ""; favoritesOnly = false; favoriteNotesOnly = false; noteColorFilter = "all"; $("favoritesOnly").classList.remove("is-active"); $("favoritesOnly").setAttribute("aria-pressed", "false"); syncNoteFavoriteFilters(); render(); });
function renderStudyCard({ autoSpeak = true, showAnswer = false } = {}) {
  const item = currentStudyCard();
  if (item?.id !== studyTypedAnswerForId) { studyTypedAnswerForId = item?.id || null; studyTypedAnswer = ""; }
  const flashcardTranslation = getEffectiveFlashcardTranslationSettings();
  const targetLanguage = ["auto", "same"].includes(flashcardTranslation.targetLanguage) ? currentLang : flashcardTranslation.targetLanguage;
  STUDY_VIEW.render({
    item, queueLength: studyQueueLength(), reviewed: studyReviewed, remembered: studyRemembered,
    autoSpeak:false, autoSpeakEnabled: studyAutoSpeak,
    stopSpeech: stopStudySpeech, speakFace: speakStudyFace, settings: { ...studyPreferences, displayLanguage:currentLang },
    translationSettings: { ...studyTranslationSettings, ...flashcardTranslation, targetLanguage }, typedAnswer: studyTypedAnswer,
    showAnswer
  });
  refreshStudySpeechLanguageControls(item);
  if (autoSpeak && studyAutoSpeak && item) speakStudyFace(item);
  const nextItem = studyQueue[studyQueueHead + 1];
  if (nextItem?.contextNote && (studyTranslationSettings.showFront || studyTranslationSettings.showBack)) {
    STUDY_TRANSLATOR.prefetch(nextItem.contextNote, { sourceLanguage:flashcardTranslation.sourceLanguage, targetLanguage }).catch(() => {});
  }
}
function startStudySession() {
  stopStudySpeech();
  studySourceKey = selectedUrl; studyPlayAllSources = studyPreferences.alwaysPlayAll; studyAutoSpeak = studyPreferences.alwaysAutoSpeak; studyFocusMode = studyPreferences.alwaysFocusMode; studyCompletedIds.clear();
  const deck = getStudyCandidates({ sourceKey: studyPlayAllSources ? null : studySourceKey });
  setStudyQueue(deck); studyHistory = []; studyReviewed = 0; studyRemembered = 0; syncStudyScopeButton(); updateStudyAutoSpeakButton(); updateStudyFocusButton();
  studyTypedAnswerForId = null; studyTypedAnswer = "";
  $("studyCard").hidden = false; $("studyComplete").hidden = true; $("studyDialog").showModal(); renderStudyCard({ showAnswer:false }); focusStudyPrimaryAction();
}
function getStudyCandidates({ sourceKey = null } = {}) {
  const candidates = getFilteredAnnotations(), favoritePages = favoritesOnly ? new Set(favorites) : null, now = Date.now();
  let count = 0;
  for (const item of candidates) {
    const dueAt = Number(item.review?.dueAt) || 0;
    if ((favoritePages && !favoritePages.has(pageKey(item))) || studyCompletedIds.has(item.id) || (dueAt && dueAt > now) || (sourceKey && pageKey(item) !== sourceKey)) continue;
    candidates[count++] = item;
  }
  candidates.length = count;
  return candidates;
}
function syncStudyScopeButton() { const button = $("studyPlayAll"); if (!button) return; button.classList.toggle("is-active", studyPlayAllSources); button.setAttribute("aria-pressed", String(studyPlayAllSources)); button.title = t("playAllTooltip"); }
function setStudyScope(enabled) {
  studyPlayAllSources = !!enabled;
  if (studyPlayAllSources) {
    const candidates = getStudyCandidates(), queuedIds = new Set(studyQueueItems().map(item => item.id));
    for (const item of candidates) if (!queuedIds.has(item.id)) studyQueue.push(item);
  } else setStudyQueue(studyQueueItems().filter(item => pageKey(item) === studySourceKey));
  syncStudyScopeButton();
}
function toggleStudyPlayAll() {
  setStudyScope(!studyPlayAllSources);
  studyPreferences = { ...studyPreferences, alwaysPlayAll:studyPlayAllSources };
  persistStudyPreferences();
  renderStudyCard();
}
function shuffleStudyQueue() { if (studyQueueLength() < 2) return; setStudyQueue(STUDY_UTILS.shuffle(studyQueueItems())); renderStudyCard(); }
async function gradeStudyCard(grade) {
  if (!studyQueueLength()) return;
  stopStudySpeech();
  const current = takeStudyCard(); studyReviewed++;
  const reviewedAt = Date.now();
  const previousReview = current.review ? { ...current.review } : null;
  const previous = current.review || {}, intervals = STUDY_UTILS.intervals(current), easeFactor = Math.max(1.3, Math.min(3.5, (Number(previous.easeFactor) || 2.5) + (grade === "easy" ? .15 : grade === "hard" ? -.15 : grade === "again" ? -.2 : 0)));
  const review = grade === "again"
    ? { dueAt: reviewedAt + 60000, intervalDays: 0, easeFactor, reps: 0, lapses: (Number(previous.lapses) || 0) + 1, reviewedAt }
    : { dueAt: reviewedAt + intervals[grade] * 86400000, intervalDays: intervals[grade], easeFactor, reps: (Number(previous.reps) || 0) + 1, lapses: Number(previous.lapses) || 0, reviewedAt };
  current.review = review;
  const annotation = annotationById.get(current.id);
  if (annotation) annotation.review = review;
  try {
    const result = await browser.runtime.sendMessage({ type: "REVIEW_ANNOTATION", id: current.id, review, origin:DASHBOARD_INSTANCE_ID });
    if (!result?.updated) throw new Error("Could not save card review");
    if (result.item?.updatedAt) { current.updatedAt = result.item.updatedAt; const stored = annotationById.get(current.id); if (stored) stored.updatedAt = result.item.updatedAt; }
  } catch (error) {
    returnStudyCardToFront(current); studyReviewed--;
    if (previousReview) current.review = previousReview; else delete current.review;
    if (annotation) { if (previousReview) annotation.review = previousReview; else delete annotation.review; }
    toast(t("studySaveFailed")); renderStudyCard(); if (studyQueueLength()) focusStudyPrimaryAction(); return;
  }
  studyHistory.push({ item: current, previousReview, grade });
  if (grade === "again") studyQueue.push(current);
  else { studyRemembered++; studyCompletedIds.add(current.id); }
  profileDataCache = null;
  renderProfileSidebar();
  renderStudyCard(); if (studyQueueLength()) focusStudyPrimaryAction();
}
async function returnToPreviousStudyCard() {
  const previous = studyHistory[studyHistory.length - 1];
  if (!previous || !studyQueueLength()) return;
  stopStudySpeech();
  const restored = { ...previous.item };
  if (previous.previousReview) restored.review = previous.previousReview;
  else delete restored.review;
  let savedCard;
  try {
    savedCard = await browser.runtime.sendMessage({ type: "UPDATE", item: restored, origin:DASHBOARD_INSTANCE_ID });
    if (!savedCard?.id) throw new Error("Could not restore previous card");
  } catch (error) { toast(t("studySaveFailed")); return; }
  studyHistory.pop();
  const existingCard = annotationById.get(savedCard.id);
  if (existingCard) Object.assign(existingCard, savedCard);
  else { annotationPositionById.set(savedCard.id, annotations.length); annotations.push(savedCard); annotationById.set(savedCard.id, savedCard); }
  profileDataCache = null;
  setStudyQueue(studyQueueItems().filter(item => item.id !== savedCard.id));
  returnStudyCardToFront(existingCard || savedCard);
  if (previous.grade !== "again") studyRemembered = Math.max(0, studyRemembered - 1);
  studyReviewed = Math.max(0, studyReviewed - 1);
  studyCompletedIds.delete(savedCard.id);
  renderStudyCard({ autoSpeak: studyAutoSpeak });
  focusStudyPrimaryAction();
}
$("studyModeBtn").addEventListener("click", startStudySession);
async function openStudyDefinitionSearch(url) {
  const switchToSearchTab = studyPreferences.switchToDefinitionTab !== false;
  studyDefinitionTabQueue = studyDefinitionTabQueue.catch(() => {}).then(async () => {
    if (!studyDefinitionTabId) {
      const saved = await browser.storage.local.get(STUDY_DEFINITION_TAB_KEY);
      const savedTabId = saved[STUDY_DEFINITION_TAB_KEY];
      if (Number.isInteger(savedTabId)) {
        try {
          const tab = await browser.tabs.get(savedTabId);
          const tabUrl = new URL(tab.url || "");
          if (tabUrl.origin === "https://www.google.com" && tabUrl.pathname === "/search") studyDefinitionTabId = tab.id;
        } catch {}
      }
    }
    let updated = false;
    if (studyDefinitionTabId) {
      try {
        const tab = await browser.tabs.get(studyDefinitionTabId);
        const currentUrl = new URL(tab.url || ""), requestedUrl = new URL(url);
        const sameSearch = currentUrl.origin === "https://www.google.com" && currentUrl.pathname === "/search" && currentUrl.searchParams.get("q") === requestedUrl.searchParams.get("q");
        if (sameSearch) {
          if (switchToSearchTab) await browser.tabs.update(studyDefinitionTabId, { active:true });
        } else {
          await browser.tabs.update(studyDefinitionTabId, switchToSearchTab ? { url, active:true } : { url });
        }
        updated = true;
      }
      catch { studyDefinitionTabId = null; }
    }
    if (!updated) {
      const tab = await browser.tabs.create({ url, active:switchToSearchTab });
      studyDefinitionTabId = tab.id;
      await browser.storage.local.set({ [STUDY_DEFINITION_TAB_KEY]:studyDefinitionTabId });
    }
  }).catch(error => console.warn("Could not open flashcard definition search", error));
  return studyDefinitionTabQueue;
}
for (const link of [$("studySearchDefinitionFront"), $("studySearchDefinitionBack")]) {
  link.addEventListener("click", event => { event.preventDefault(); openStudyDefinitionSearch(link.href); });
}
$("studyPlayAll").addEventListener("click", toggleStudyPlayAll);
$("studyShuffleBtn").addEventListener("click", shuffleStudyQueue);
$("studyShortcutSettings").addEventListener("click", openStudyShortcutSettings);


function updateStudyAutoSpeakButton() {
  const button = $("studyAutoSpeak"); if (!button) return;
  const key = "autoSpeak";
  button.title = t(key); button.setAttribute("aria-label", t(key)); button.setAttribute("aria-pressed", String(studyAutoSpeak));
  button.classList.toggle("is-enabled", studyAutoSpeak);
  button.innerHTML = (studyAutoSpeak
    ? '<svg class="lucide" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>'
    : '<svg class="lucide" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6m0-6 6 6"/></svg>') + `<span id="studyAutoSpeakLabel">${escapeHtml(t(key))}</span>`;
}
function updateGradeShortcutHints() { STUDY_VIEW.updateShortcutHints(studyShortcuts, studyShowShortcuts); }
function focusStudyPrimaryAction() {
  if (!$("studyBack").hidden) $("studyRatings").querySelector("button:not(:disabled)")?.focus();
  else if (studyQueueLength() && studyPreferences.typeTheAnswer && !$("studyTypedAnswerField").hidden) $("studyTypedAnswer").focus();
  else if (studyQueueLength()) $("studyRevealBtn").focus();
  else $("closeStudy").focus();
}
function openStudyShortcutSettings() {
  const dialog = $("studyShortcutDialog");
  studySettingsCloseToastKey = "settingsNoChanges";
  studySettingsSnapshot = { preferences:{ ...studyPreferences }, translationSettings:{ ...studyTranslationSettings }, flashcardTranslateSettings:{ ...flashcardTranslateSettings }, shortcuts:{ ...studyShortcuts }, showShortcuts:studyShowShortcuts, speakAfterClose:studySpeakAfterSettingsClose };
  $("studyShowShortcuts").checked = studyShowShortcuts;
  document.querySelectorAll("[data-study-preference]").forEach(input => { input.checked = !!studyPreferences[input.dataset.studyPreference]; });
  document.querySelectorAll("[data-study-translation-setting]").forEach(input => { input.checked = !!studyTranslationSettings[input.dataset.studyTranslationSetting]; });
  refreshFlashcardTranslateSettingsUI();
  $("studyDefinitionSearchLanguage").value = studyPreferences.definitionLanguage;
  showStudySettingsTab(studySettingsTab);
  STUDY_VIEW.shortcutInputs.forEach(input => { input.value = STUDY_UTILS.formatShortcut(studyShortcuts[input.dataset.studyShortcut]); input.title = t("shortcutInputHint"); delete input.dataset.pendingKey; input.classList.remove("is-listening"); });
  updateStudyShortcutResetState(); updateCustomStudyPreferenceResetState();
  dialog.showModal();
}
function updateStudyShortcutResetState() {
  const hasCustomShortcuts = STUDY_VIEW.shortcutInputs.some(input => (Object.hasOwn(input.dataset, "pendingKey") ? input.dataset.pendingKey : studyShortcuts[input.dataset.studyShortcut]) !== DEFAULT_STUDY_SHORTCUTS[input.dataset.studyShortcut]);
  $("resetStudyShortcuts").classList.toggle("has-custom-shortcuts", hasCustomShortcuts);
}
function updateCustomStudyPreferenceResetState() {
  const hasCustomPreferences = CUSTOM_FLASHCARD_PREFERENCE_KEYS.some(key => !!studyPreferences[key] !== DEFAULT_STUDY_PREFERENCES[key]);
  $("resetCustomFlashcardSettings").classList.toggle("has-custom-preferences", hasCustomPreferences);
}
function showStudySettingsTab(name) {
  studySettingsTab = name;
  document.querySelectorAll("[data-study-settings-tab]").forEach(button => button.classList.toggle("is-active", button.dataset.studySettingsTab === name));
  document.querySelectorAll("[data-study-settings-panel]").forEach(panel => { const active = panel.dataset.studySettingsPanel === name; panel.hidden = !active; panel.classList.toggle("is-active", active); });
  $("resetStudyShortcuts").hidden = name !== "shortcut";
}
document.querySelectorAll("[data-study-settings-tab]").forEach(button => button.addEventListener("click", () => showStudySettingsTab(button.dataset.studySettingsTab)));
function updateStudyPreference(input) {
  const key = input.dataset.studyPreference, enabled = input.checked;
  if (!Object.hasOwn(DEFAULT_STUDY_PREFERENCES, key)) return;
  studyPreferences = { ...studyPreferences, [key]:enabled };
  if (key === "alwaysAutoSpeak") {
    studyAutoSpeak = enabled; updateStudyAutoSpeakButton();
    if (enabled) studySpeakAfterSettingsClose = true;
    else { studySpeakAfterSettingsClose = false; stopStudySpeech(); }
  } else if (key === "alwaysFocusMode") {
    studyFocusMode = enabled; updateStudyFocusButton();
  } else if (key === "alwaysPlayAll" && $("studyDialog").open) {
    setStudyScope(enabled);
  }
  updateCustomStudyPreferenceResetState();
  if (key !== "switchToDefinitionTab" && $("studyDialog").open) renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
}
document.querySelectorAll("[data-study-preference]").forEach(input => input.addEventListener("change", () => updateStudyPreference(input)));
function updateStudyTranslationSettings() {
  for (const input of document.querySelectorAll("[data-study-translation-setting]")) {
    const key = input.dataset.studyTranslationSetting;
    if (Object.hasOwn(DEFAULT_STUDY_TRANSLATION_SETTINGS, key)) studyTranslationSettings = { ...studyTranslationSettings, [key]:input.checked };
  }
  flashcardTranslateSettings = { ...flashcardTranslateSettings, sourceLanguage:$("studyTranslationSource").value, targetLanguage:$("studyTranslationTarget").value };
  if ($("studyDialog").open) renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
}
document.querySelectorAll("[data-study-translation-setting]").forEach(input => input.addEventListener("change", updateStudyTranslationSettings));
$("studyTranslationSource").addEventListener("change", updateStudyTranslationSettings);
$("studyTranslationTarget").addEventListener("change", updateStudyTranslationSettings);
function updateFlashcardTranslateSettingsFromUI({ rerender = true, customRate = false } = {}) {
  const rate = normalizeSpeechRate($("studySpeechRate").value);
  flashcardTranslateSettings = {
    ...flashcardTranslateSettings,
    useDashboardSettings:!$("studyUseDashboardTranslateSettings").checked,
    useDashboardSpeechSettings:!$("studyUseDashboardSpeechSettings").checked,
    sourceLanguage:$("studyTranslationSource").value,
    targetLanguage:$("studyTranslationTarget").value,
    speechVoice:$("studySpeechVoice").value === "browser" ? "browser" : "google",
    speechRate:rate,
    hasCustomSpeechRate:customRate || flashcardTranslateSettings.hasCustomSpeechRate
  };
  $("studySpeechRateValue").value = rate.toFixed(1);
  refreshFlashcardTranslateSettingsUI();
  if (rerender && $("studyDialog").open) renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
}
$("studyUseDashboardTranslateSettings").addEventListener("change", () => updateFlashcardTranslateSettingsFromUI());
function resetFlashcardLanguageRatesToDashboard() {
  const languageRates = { ...(flashcardTranslateSettings.flashcardSpeechRateByLanguage || {}) };
  const customRates = { ...(flashcardTranslateSettings.hasCustomFlashcardLanguageSpeechRate || {}) };
  for (const language of ["en", "vi", "ko"]) {
    const storedRate = Number(dashboardSettings.speechRateByLanguage?.[language]);
    const defaultRate = Number(CONFIG.DEFAULT_SETTINGS.speechRateByLanguage?.[language]) || 1.25;
    languageRates[language] = Number.isFinite(storedRate) ? Math.min(2, Math.max(.5, storedRate)) : defaultRate;
    customRates[language] = false;
  }
  flashcardTranslateSettings = { ...flashcardTranslateSettings, flashcardSpeechRateByLanguage:languageRates, hasCustomFlashcardLanguageSpeechRate:customRates };
}
$("studyUseDashboardSpeechSettings").addEventListener("change", () => {
  if ($("studyUseDashboardSpeechSettings").checked) resetFlashcardLanguageRatesToDashboard();
  updateFlashcardTranslateSettingsFromUI({ rerender:false });
});
$("studySpeechVoice").addEventListener("change", () => updateFlashcardTranslateSettingsFromUI({ rerender:false }));
function updateFlashcardSpeechLanguageSetting(field, value) {
  const key = studySpeechSettingKey(field), revisionKey = studySpeechSettingRevisionKey(field);
  if (!key || !["auto", "en-US", "vi-VN", "ko-KR"].includes(value)) return;
  const maxSavedRevision = [...annotationById.values()].reduce((max, item) => Math.max(max, Number(item.speechLanguageRevision?.[field]) || 0), 0);
  const revisions = { ...(flashcardTranslateSettings.speechLanguageSettingsRevision || {}) };
  revisions[revisionKey] = Math.max(Date.now(), (Number(revisions[revisionKey]) || 0) + 1, maxSavedRevision + 1);
  flashcardTranslateSettings = { ...flashcardTranslateSettings, [key]:value, speechLanguageSettingsRevision:revisions };
  if ($("studyDialog").open) renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
}
$("studyHighlightVoiceLanguage").addEventListener("change", event => updateFlashcardSpeechLanguageSetting("quote", event.target.value));
$("studyNoteVoiceLanguage").addEventListener("change", event => updateFlashcardSpeechLanguageSetting("note", event.target.value));
$("studySpeechRate").addEventListener("input", event => { $("studySpeechRateValue").value = normalizeSpeechRate(event.target.value).toFixed(1); });
$("studySpeechRate").addEventListener("change", () => updateFlashcardTranslateSettingsFromUI({ rerender:false, customRate:true }));
$("studySpeechRateValue").addEventListener("input", event => { if (event.target.value !== "") $("studySpeechRate").value = String(normalizeSpeechRate(event.target.value)); });
$("studySpeechRateValue").addEventListener("change", event => { const rate = normalizeSpeechRate(event.target.value); event.target.value = rate.toFixed(1); $("studySpeechRate").value = String(rate); updateFlashcardTranslateSettingsFromUI({ rerender:false, customRate:true }); });
$("resetStudySpeechRate").addEventListener("click", () => {
  const rate = DEFAULT_FLASHCARD_TRANSLATE_SETTINGS.speechRate;
  $("studySpeechRate").value = String(rate);
  $("studySpeechRateValue").value = rate.toFixed(1);
  updateFlashcardTranslateSettingsFromUI({ rerender:false, customRate:true });
});
function updateFlashcardEnglishSpeechRate(value) {
  const rate = normalizeSpeechRate(value);
  const languageRates = { ...(flashcardTranslateSettings.flashcardSpeechRateByLanguage || {}), [currentLang]:rate };
  const customRates = { ...(flashcardTranslateSettings.hasCustomFlashcardLanguageSpeechRate || {}), [currentLang]:true };
  flashcardTranslateSettings = { ...flashcardTranslateSettings, flashcardSpeechRateByLanguage:languageRates, hasCustomFlashcardLanguageSpeechRate:customRates };
  refreshFlashcardTranslateSettingsUI();
}
$("studyFlashcardEnglishRate").addEventListener("input", event => { $("studyFlashcardEnglishRateValue").value = normalizeSpeechRate(event.target.value).toFixed(1); });
$("studyFlashcardEnglishRate").addEventListener("change", event => updateFlashcardEnglishSpeechRate(event.target.value));
$("studyFlashcardEnglishRateValue").addEventListener("input", event => { if (event.target.value !== "") $("studyFlashcardEnglishRate").value = String(normalizeSpeechRate(event.target.value)); });
$("studyFlashcardEnglishRateValue").addEventListener("change", event => { const rate = normalizeSpeechRate(event.target.value); event.target.value = rate.toFixed(1); $("studyFlashcardEnglishRate").value = String(rate); updateFlashcardEnglishSpeechRate(rate); });
$("resetStudyFlashcardEnglishRate").addEventListener("click", () => {
  updateFlashcardEnglishSpeechRate(DEFAULT_FLASHCARD_TRANSLATE_SETTINGS.flashcardEnglishSpeechRate);
});
$("studyDefinitionSearchLanguage").addEventListener("change", () => {
  studyPreferences = { ...studyPreferences, definitionLanguage:$("studyDefinitionSearchLanguage").value };
  if ($("studyDialog").open) renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
});
$("resetCustomFlashcardSettings").addEventListener("click", () => {
  studyPreferences = { ...studyPreferences, ...Object.fromEntries(CUSTOM_FLASHCARD_PREFERENCE_KEYS.map(key => [key, DEFAULT_STUDY_PREFERENCES[key]])) };
  studyAutoSpeak = DEFAULT_STUDY_PREFERENCES.alwaysAutoSpeak;
  studyFocusMode = DEFAULT_STUDY_PREFERENCES.alwaysFocusMode;
  document.querySelectorAll("[data-study-preference]").forEach(input => { if (CUSTOM_FLASHCARD_PREFERENCE_KEYS.includes(input.dataset.studyPreference)) input.checked = DEFAULT_STUDY_PREFERENCES[input.dataset.studyPreference]; });
  updateCustomStudyPreferenceResetState();
  updateStudyAutoSpeakButton(); updateStudyFocusButton();
  if ($("studyDialog").open) {
    setStudyScope(DEFAULT_STUDY_PREFERENCES.alwaysPlayAll);
    renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
    studySpeakAfterSettingsClose = studyQueueLength() > 0;
  }
});
async function persistStudyPreferences() {
  try { await browser.storage.local.set({ [STUDY_PREFERENCES_KEY]:studyPreferences, [STUDY_FOCUS_MODE_KEY]:studyFocusMode }); }
  catch (error) { console.warn("Could not save flashcard preferences", error); }
}
STUDY_VIEW.shortcutInputs.forEach(input => {
  input.tabIndex = 0;
  input.addEventListener("keydown", event => {
    if (["Escape", "Tab"].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    if (event.key === "Backspace") { input.value = ""; input.dataset.pendingKey = ""; updateStudyShortcutResetState(); return; }
    if (["Enter", " "].includes(event.key)) return;
    const key = STUDY_UTILS.shortcutFromEvent(event);
    input.value = STUDY_UTILS.formatShortcut(key); input.dataset.pendingKey = key;
    updateStudyShortcutResetState();
  }, true);
});
$("studyShortcutForm").addEventListener("focusin", e => { if (e.target.matches("[data-study-shortcut]")) e.target.classList.add("is-listening"); });
$("studyShortcutForm").addEventListener("focusout", e => { if (e.target.matches("[data-study-shortcut]")) e.target.classList.remove("is-listening"); });
$("resetStudyShortcuts").addEventListener("click", () => {
  STUDY_VIEW.shortcutInputs.forEach(input => { input.value = STUDY_UTILS.formatShortcut(DEFAULT_STUDY_SHORTCUTS[input.dataset.studyShortcut]); input.dataset.pendingKey = DEFAULT_STUDY_SHORTCUTS[input.dataset.studyShortcut]; });
  updateStudyShortcutResetState();
});
function cancelStudySettings() {
  if (studySettingsSnapshot) {
    studyPreferences = { ...studySettingsSnapshot.preferences };
    studyTranslationSettings = { ...studySettingsSnapshot.translationSettings };
    flashcardTranslateSettings = { ...studySettingsSnapshot.flashcardTranslateSettings };
    studyShortcuts = { ...studySettingsSnapshot.shortcuts };
    studyShowShortcuts = studySettingsSnapshot.showShortcuts;
    studyAutoSpeak = studyPreferences.alwaysAutoSpeak;
    studyFocusMode = studyPreferences.alwaysFocusMode;
    if ($("studyDialog").open) setStudyScope(studyPreferences.alwaysPlayAll);
    $("studyShowShortcuts").checked = studyShowShortcuts;
    document.querySelectorAll("[data-study-preference]").forEach(input => { input.checked = !!studyPreferences[input.dataset.studyPreference]; });
    document.querySelectorAll("[data-study-translation-setting]").forEach(input => { input.checked = !!studyTranslationSettings[input.dataset.studyTranslationSetting]; });
    refreshFlashcardTranslateSettingsUI();
    $("studyDefinitionSearchLanguage").value = studyPreferences.definitionLanguage;
    STUDY_VIEW.shortcutInputs.forEach(input => { input.value = STUDY_UTILS.formatShortcut(studyShortcuts[input.dataset.studyShortcut]); delete input.dataset.pendingKey; });
    updateStudyShortcutResetState();
    updateStudyAutoSpeakButton(); updateStudyFocusButton(); updateGradeShortcutHints();
    if ($("studyDialog").open) renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
  }
  studySpeakAfterSettingsClose = studySettingsSnapshot?.speakAfterClose || false;
  studySettingsSnapshot = null;
  studySettingsCloseToastKey = "settingsNoChanges";
  $("studyShortcutDialog").close("cancel");
  focusStudyPrimaryAction();
}
$("closeStudyShortcuts").addEventListener("click", cancelStudySettings);
$("studySettingsWindowMaximize").addEventListener("click", () => $("studyShortcutDialog").classList.toggle("is-maximized"));
$("studyShortcutDialog").addEventListener("cancel", event => { event.preventDefault(); cancelStudySettings(); });
$("studyShortcutDialog").addEventListener("close", () => {
  const messageKey = studySettingsCloseToastKey;
  studySettingsCloseToastKey = "settingsNoChanges";
  toast(t(messageKey));
  if (!studySpeakAfterSettingsClose) return;
  studySpeakAfterSettingsClose = false;
  requestAnimationFrame(() => {
    if (studyAutoSpeak && studyQueueLength() && $("studyDialog").open && !$("studyShortcutDialog").open) speakStudyFace(currentStudyCard());
  });
});
async function saveStudyShortcutSettings() {
  const next = {};
  for (const input of STUDY_VIEW.shortcutInputs) next[input.dataset.studyShortcut] = Object.hasOwn(input.dataset, "pendingKey") ? input.dataset.pendingKey : studyShortcuts[input.dataset.studyShortcut];
  const assignedShortcuts = Object.values(next).filter(Boolean);
  if (new Set(assignedShortcuts.map(key => key.toLowerCase())).size !== assignedShortcuts.length) { toast(t("studyShortcutDuplicate")); return false; }
  studyShortcuts = next; studyShowShortcuts = $("studyShowShortcuts").checked;
  updateFlashcardTranslateSettingsFromUI({ rerender:false });
  updateStudyShortcutResetState();
  await browser.storage.local.set({ [STUDY_SHORTCUT_KEY]: studyShortcuts, [STUDY_SHOW_SHORTCUTS_KEY]: studyShowShortcuts, [STUDY_PREFERENCES_KEY]:studyPreferences, [STUDY_FOCUS_MODE_KEY]:studyFocusMode, [STUDY_TRANSLATION_SETTINGS_KEY]:studyTranslationSettings, [FLASHCARD_TRANSLATE_SETTINGS_KEY]:flashcardTranslateSettings });
  updateGradeShortcutHints();
  return true;
}
function studySettingsChangedFromSnapshot() {
  if (!studySettingsSnapshot) return false;
  const shortcuts = Object.fromEntries(STUDY_VIEW.shortcutInputs.map(input => [input.dataset.studyShortcut, Object.hasOwn(input.dataset, "pendingKey") ? input.dataset.pendingKey : studyShortcuts[input.dataset.studyShortcut]]));
  return JSON.stringify(studySettingsSnapshot.preferences) !== JSON.stringify(studyPreferences)
    || JSON.stringify(studySettingsSnapshot.translationSettings) !== JSON.stringify(studyTranslationSettings)
    || JSON.stringify(studySettingsSnapshot.flashcardTranslateSettings) !== JSON.stringify(flashcardTranslateSettings)
    || JSON.stringify(studySettingsSnapshot.shortcuts) !== JSON.stringify(shortcuts)
    || studySettingsSnapshot.showShortcuts !== $("studyShowShortcuts").checked;
}
$("studyShortcutForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    if (await saveStudyShortcutSettings()) { studySettingsCloseToastKey = studySettingsChangedFromSnapshot() ? "settingsSaved" : "settingsNoChanges"; studySettingsSnapshot = null; $("studyShortcutDialog").close(); focusStudyPrimaryAction(); }
  } catch (error) { console.warn("Could not save flashcard settings", error); toast(t("studySaveFailed")); }
});
let studyShortcutSettingsSaving = false;
$("studyShortcutDialog").addEventListener("click", async e => {
  if (e.target !== $("studyShortcutDialog") || studyShortcutSettingsSaving) return;
  studyShortcutSettingsSaving = true;
  try {
    if (await saveStudyShortcutSettings()) { studySettingsCloseToastKey = studySettingsChangedFromSnapshot() ? "settingsSaved" : "settingsNoChanges"; studySettingsSnapshot = null; $("studyShortcutDialog").close(); focusStudyPrimaryAction(); }
  } catch (error) {
    console.warn("Could not save flashcard shortcut settings", error);
    toast(t("studySaveFailed"));
  } finally {
    studyShortcutSettingsSaving = false;
  }
});
function lastStudyReviewAt(item) {
  const review = item.review || {};
  if (Number(review.reviewedAt) > 0) return Number(review.reviewedAt);
  const dueAt = Number(review.dueAt) || 0, days = Number(review.intervalDays) || 0;
  if (dueAt && days > 0) return dueAt - days * 86400000;
  if (dueAt && Number(review.reps) === 0) return dueAt - 60000;
  return 0;
}
$("resetStudyProgress").addEventListener("click", async () => {
  stopStudySpeech();
  studySpeakAfterSettingsClose = false;
  const range = $("studyResetRange").value, now = Date.now();
  const cutoff = range === "hour" ? now - 3600000 : range === "day" ? now - 86400000 : range === "week" ? now - 7 * 86400000 : 0;
  const ids = annotations.filter(item => item.review && (!cutoff || lastStudyReviewAt(item) >= cutoff)).map(item => item.id).filter(id => typeof id === "string");
  if (!ids.length) { toast(t("studyResetAlready")); return; }
  try {
    const result = await browser.runtime.sendMessage({ type: "RESET_STUDY_PROGRESS", ids, origin:DASHBOARD_INSTANCE_ID });
    if (!result?.updated) throw new Error("Could not reset study progress");
    const idSet = new Set(ids);
    annotations.forEach(item => { if (idSet.has(item.id)) delete item.review; });
    profileDataCache = null;
    studyCompletedIds.clear(); studyHistory = [];
    setStudyQueue(getStudyCandidates({ sourceKey: studyPlayAllSources ? null : studySourceKey }));
    studyReviewed = 0; studyRemembered = 0;
    renderProfileSidebar();
    renderStudyCard({ autoSpeak: false });
    toast(t("studyResetDone", { count: result.resetCount || ids.length }));
    studySpeakAfterSettingsClose = studyAutoSpeak && studyQueueLength() > 0;
  } catch { toast(t("studySaveFailed")); }
});
document.addEventListener("keydown", e => {
  if (!$("studyDialog").open || $("studyShortcutDialog").open) return;
  if (e.key === "Enter" && !$("studyComplete").hidden) { e.preventDefault(); $("closeStudyDone").click(); return; }
  const pressed = STUDY_UTILS.shortcutFromEvent(e);
  const matches = shortcut => String(shortcut || "").toLocaleLowerCase() === pressed.toLocaleLowerCase();
  if (matches(studyShortcuts.previous)) { e.preventDefault(); e.stopPropagation(); returnToPreviousStudyCard(); return; }
  if ($("studyComplete").hidden && matches(studyShortcuts.editCard)) { e.preventDefault(); e.stopPropagation(); $("studyEditCard").click(); return; }
  if (e.target === $("studyTypedAnswer") && matches(studyShortcuts.reveal)) { e.preventDefault(); $("studyRevealBtn").click(); return; }
  if (e.target?.closest?.("input, textarea, select")) return;
  if (matches(studyShortcuts.searchDefinition)) { e.preventDefault(); e.stopPropagation(); openStudyDefinitionSearch($("studySearchDefinitionFront").href); return; }
  if (matches(studyShortcuts.replay)) { e.preventDefault(); e.stopPropagation(); speakStudyFace(); return; }
  if ($("studyBack").hidden) {
    if (!matches(studyShortcuts.reveal)) return;
    e.preventDefault(); $("studyRevealBtn").click(); return;
  }
  const entry = Object.entries(studyShortcuts).filter(([grade]) => !["reveal", "replay", "previous", "searchDefinition"].includes(grade)).find(([, shortcut]) => matches(shortcut));
  if (!entry) return;
  const button = $("studyRatings").querySelector('[data-grade="' + entry[0] + '"]');
  if (!button || button.disabled) return;
  e.preventDefault(); button.click();
});
function stopStudySpeech() { studySpeechToken++; speechRequestId++; window.speechSynthesis?.cancel(); stopStudyAudio(); }
function studyFrontSpeechField() {
  const field = $("studyFront").querySelector("[data-study-speech-language]")?.dataset.studySpeechLanguage;
  return field === "note" ? "note" : "quote";
}
function speakStudyText(text, item, onEnd, field = "quote") {
  if (!text) return;
  // Speech controls may be changed immediately before Speak while an UPDATE is in
  // flight. Resolve the canonical in-memory annotation so playback uses that choice.
  const speechItem = item?.id ? (annotationById.get(item.id) || item) : item;
  // Read the visible selector at playback time so a delayed storage response or the
  // duplicate front/back selector cannot override the user's latest selection.
  const selection = currentStudySpeechSelection(speechItem, field, text);
  const token = ++studySpeechToken;
  const languageRevision = selection.revision;
  const cacheVoice = selection.manual ? `google-translate-manual-v4-${field}-${selection.language}-${languageRevision}` : "google-translate-default";
  speakText(text, selection.language, () => { if (token === studySpeechToken) onEnd?.(); }, () => token === studySpeechToken, cacheVoice, getEffectiveFlashcardSpeechSettings());
}
function speakStudyFace(item = currentStudyCard()) {
  if (!item) return;
  const showingAnswer = !$("studyBack").hidden;
  stopStudySpeech();
  const field = showingAnswer ? "quote" : studyFrontSpeechField();
  const text = field === "note" ? (item.note || "") : (item.quote || "");
  speakStudyText(text, item, () => {
    const speakContext = () => { if (item.contextNote && (showingAnswer || studyPreferences.autoSpeakSentenceNoteFront)) speakStudyText(item.contextNote, item, null, "context"); };
    if (showingAnswer && item.note) speakStudyText(item.note, item, speakContext, "note");
    else speakContext();
  }, field);
}
document.addEventListener("change", event => {
  const select = event.target.closest?.("#studyDialog [data-study-speech-language]");
  if (select) saveStudySpeechLanguage(select);
});
$("studyAutoSpeak").addEventListener("click", () => {
  studyAutoSpeak = !studyAutoSpeak; updateStudyAutoSpeakButton();
  studyPreferences = { ...studyPreferences, alwaysAutoSpeak:studyAutoSpeak };
  persistStudyPreferences();
  if (studyAutoSpeak) speakStudyFace(); else stopStudySpeech();
});
function updateStudyFocusButton() {
  const button = $("studyFocusToggle"); if (!button) return;
  $("studyDialog").classList.toggle("study-focus", studyFocusMode);
  button.setAttribute("aria-pressed", String(studyFocusMode));
  button.classList.toggle("is-active", studyFocusMode);
  button.title = t("focusMode"); button.setAttribute("aria-label", t("focusMode"));
}
$("studyFocusToggle").addEventListener("click", async () => { studyFocusMode = !studyFocusMode; studyPreferences = { ...studyPreferences, alwaysFocusMode:studyFocusMode }; updateStudyFocusButton(); await browser.storage.local.set({ [STUDY_FOCUS_MODE_KEY]:studyFocusMode, [STUDY_PREFERENCES_KEY]:studyPreferences }); });


$("studyTypedAnswer").addEventListener("input", event => { studyTypedAnswer = event.currentTarget.value; });
$("studyRevealBtn").addEventListener("click", () => { studyTypedAnswer = $("studyTypedAnswer").value; renderStudyCard({ showAnswer:true }); });
$("studyPlayFront").addEventListener("click", () => { const item = currentStudyCard(); if (item) { const field = studyFrontSpeechField(); stopStudySpeech(); speakStudyText(field === "note" ? (item.note || "") : (item.quote || ""), item, undefined, field); } });
$("studyPlayBackQuote").addEventListener("click", () => { const item = currentStudyCard(); if (item) { stopStudySpeech(); speakStudyText(item.quote || "", item, undefined, "quote"); } });
$("studyPlayNote").addEventListener("click", () => { const item = currentStudyCard(); if (item) { stopStudySpeech(); speakStudyText(item.note || "", item, undefined, "note"); } });
$("studyPlayContext").addEventListener("click", () => { const item = currentStudyCard(); if (item?.contextNote) { stopStudySpeech(); speakStudyText(item.contextNote, item, undefined, "context"); } });
$("studyPlayFrontContext").addEventListener("click", () => { const item = currentStudyCard(); if (item?.contextNote) { stopStudySpeech(); speakStudyText(item.contextNote, item, undefined, "context"); } });
$("studyRatings").addEventListener("click", e => { const button = e.target.closest("[data-grade]"); if (button) { $("studyRatings").querySelectorAll("button").forEach(el => { el.disabled = true; setDisabledTooltip(el, el, t("disabledSavingReview")); }); gradeStudyCard(button.dataset.grade).finally(() => $("studyRatings").querySelectorAll("button").forEach(el => { el.disabled = false; setDisabledTooltip(el, el, ""); })); } });
$("studyJumpHighlight").addEventListener("click", async () => {
  const card = currentStudyCard();
  if (!card) return;
  const item = annotations.find(annotation => annotation.id === card.id) || card;
  if (typeof item.url !== "string" || !item.url || typeof item.id !== "string" || !item.id) {
    toast(t("highlightNotFound"));
    return;
  }
  try {
    const result = await browser.runtime.sendMessage({ type: "OPEN_HIGHLIGHT", url: item.url, id: item.id });
    if (!result?.found) toast(t("highlightNotFound"));
  } catch {
    toast(t("highlightNotFound"));
  }
});$("studyEditCard").addEventListener("click", () => {
  const item = currentStudyCard();
  if (!item) return;
  stopStudySpeech();
  openEditDialog(item);
});
$("closeStudy").addEventListener("click", () => $("studyDialog").close());
let studyFullscreenRestoreState = null;
async function updateStudyFullscreenButton() {
  let browserFullscreen = false;
  try { browserFullscreen = (await browser.windows.getCurrent()).state === "fullscreen"; } catch {}
  const button = $("studyFullscreenToggle"), active = Boolean(document.fullscreenElement) || browserFullscreen || window.fullScreen === true;
  const label = t(active ? "exitFullscreen" : "enterFullscreen");
  button.innerHTML = active
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v5H3M16 3v5h5M8 21v-5H3m13 5v-5h5"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/></svg>';
  button.title = label; button.setAttribute("aria-label", label);
}
$("studyFullscreenToggle").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    const currentWindow = await browser.windows.getCurrent();
    if (currentWindow.state === "fullscreen" || window.fullScreen === true) {
      await browser.windows.update(currentWindow.id, { state: studyFullscreenRestoreState || "maximized", focused: true });
      studyFullscreenRestoreState = null;
    } else {
      studyFullscreenRestoreState = currentWindow.state === "maximized" ? "maximized" : "normal";
      await browser.windows.update(currentWindow.id, { state: "fullscreen" });
    }
    await updateStudyFullscreenButton();
  } catch (error) { console.warn("Could not change fullscreen mode", error); }
});
document.addEventListener("fullscreenchange", updateStudyFullscreenButton);
window.addEventListener("resize", updateStudyFullscreenButton);
updateStudyFullscreenButton();
$("closeStudyDone").addEventListener("click", () => $("studyDialog").close());
$("studyDialog").addEventListener("close", () => { stopStudySpeech(); if (annotationsChangedDuringStudy) { annotationsChangedDuringStudy = false; load(); } });
$("profileAuthDialog").addEventListener("click", event => { if (event.target === $("profileAuthDialog")) $("profileAuthDialog").close(); });
$("profileAuthClose").addEventListener("click", () => $("profileAuthDialog").close());
$("profileGoogleLogin").addEventListener("click", async () => { await finishProfileAuth({ username:"huson", email:"huuson889@gmail.com", displayName:"Huson", createdAt:Date.now() }); });
$("profileLoginTab").addEventListener("click", () => setProfileAuthMode("login"));
$("profileRegisterTab").addEventListener("click", () => setProfileAuthMode("register"));
$("profileAuthForm").addEventListener("submit", async event => {
  event.preventDefault();
  const username = $("profileUsername").value.trim(), password = $("profilePassword").value;
  if (profileAuthMode === "login") {
    if (!["huson", "huson@example.com"].includes(username.toLocaleLowerCase()) || password !== "123") {
      $("profileAuthError").textContent = t("profileBadCredentials");
      $("profileAuthError").hidden = false; return;
    }
    await finishProfileAuth({ username: username.includes("@") ? username.split("@")[0] : "huson", email: username.includes("@") ? username : "huuson889@gmail.com", displayName:"Huson", createdAt:Date.now() });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || password.length < 1) {
    $("profileAuthError").textContent = t("profileNeedFields");
    $("profileAuthError").hidden = false; return;
  }
  if (password !== $("profileRetypePassword").value) {
    $("profileAuthError").textContent = t("profilePasswordMismatch");
    $("profileAuthError").hidden = false; return;
  }
  const displayName = username.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase());
  await finishProfileAuth({ username:username.split("@")[0], email:username, displayName, createdAt:Date.now() });
});
$("actionButtonsSection").addEventListener("click", async event => {
  if (event.target.closest("#profileLoginAction")) { openProfileAuth("login"); return; }
});
$("profileTagsTab").addEventListener("click", () => { profileChipMode = "tags"; renderProfileSidebar(); });
$("profileDomainsTab").addEventListener("click", () => { profileChipMode = "domains"; renderProfileSidebar(); });
$("profileChips").addEventListener("click", event => {
  const chip = event.target.closest(".profile-chip"); if (!chip) return;
  if (profileChipMode === "tags") $("tagFilter").value = chip.dataset.name;
  else $("siteFilter").value = chip.dataset.name;
  render();
});
document.querySelectorAll("[data-profile-range]").forEach(button => button.addEventListener("click", () => { profileActivityRange = button.dataset.profileRange; renderProfileSidebar(); }));
$("viewModeBtn").addEventListener("click", () => { viewMode = viewMode === "list" ? "grid" : "list"; updateViewModeButton(); });
$("favoritePageBtn").addEventListener("click", async event => {
  if (!selectedUrl) return;
  const addingFavorite = !favorites.includes(selectedUrl);
  playToolbarActionEffect(event.currentTarget, event, "#f43f5e", "heart");
  favorites = addingFavorite ? [...favorites, selectedUrl] : favorites.filter(x => x !== selectedUrl);
  await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.FAVORITES]: favorites });
  refreshFavoriteDashboard();
});
$("exportAllBtn").addEventListener("click", e => { e.stopPropagation(); const menu = $("exportAllMenu"), open = menu.hidden; closeMenus(); $("profileMenu").hidden = false; $("profileMenuToggle").setAttribute("aria-expanded", "true"); menu.hidden = !open; $("exportAllBtn").setAttribute("aria-expanded", String(open)); });
$("exportPageBtn").addEventListener("click", e => { e.stopPropagation(); if (!selectedUrl) return; const menu = $("exportPageMenu"); const open = menu.hidden; closeMenus(); menu.hidden = !open; $("exportPageBtn").setAttribute("aria-expanded", String(open)); });
$("deletePageBtn").addEventListener("click", async () => {
  if (!selectedUrl) return;
  const pageItems = annotations.filter(a => pageKey(a) === selectedUrl);
  if (!pageItems.length) return;
  if (!confirm(t("deletePageConfirm"))) return;
  const result = await browser.runtime.sendMessage({ type: "DELETE_PAGE", url: selectedUrl, origin: DASHBOARD_INSTANCE_ID });
  // Remove visible marks from any currently open tab for this exact URL too.
  const tabs = await browser.tabs.query({});
  await Promise.all(tabs.filter(tab => tab.id != null).map(tab => browser.tabs.sendMessage(tab.id, { type: "REMOVE_HIGHLIGHT_PAGE", url:selectedUrl }).catch(() => null)));
  applyAnnotationChange({ type:"deletePage", url:selectedUrl });
  toast(t("deletePageDone", { count: result?.deletedCount ?? ids.length }));
});
document.addEventListener("click", e => { const option = e.target.closest("button[data-export]"); if (option) { const page = option.closest("#exportPageMenu"), format = option.dataset.export; if (format === "json") downloadJsonExport(page ? selectedUrl : null).catch(error => { console.error("JSON export failed", error); alert(error.message || "JSON export failed"); }); else { const items = page ? annotations.filter(a => pageKey(a) === selectedUrl) : annotations; downloadExport(format, items); } closeMenus(); return; } if (!e.target.closest(".menu-wrap, .profile-menu-wrap, .settings-backup-export-wrap")) closeMenus(); });
document.querySelector(".menu-item.item-free").addEventListener("click", event => event.preventDefault());
$("profileMenuToggle").addEventListener("click", e => { e.stopPropagation(); const open = $("profileMenu").hidden; closeMenus(); $("profileMenu").hidden = !open; $("profileMenuToggle").setAttribute("aria-expanded", String(open)); });
$("profileMenuAccountHost").addEventListener("click", e => { if (e.target.closest("#profileMenuSignIn")) { closeMenus(); openProfileAuth("login"); } });
$("profileOpenSettings").addEventListener("click", openDashboardSettings);
$("settingsAccountState").addEventListener("click", async event => {
  if (event.target.closest("#settingsAccountSignIn")) { $("dashboardSettingsDialog").close(); openProfileAuth("login"); return; }
  if (event.target.closest("#settingsAccountSignOut")) { await signOutDemoProfile(); return; }
  if (event.target.closest("#settingsChangeProfilePicture")) { $("settingsProfilePictureFile").click(); return; }
  if (event.target.closest("#settingsAccountChangeEmail")) {
    const field = $("settingsAccountState").querySelector("#settingsAccountEmail"), button = event.target.closest("#settingsAccountChangeEmail");
    if (field.disabled) { field.disabled = false; setDisabledTooltip(field, field.closest(".settings-account-controls"), ""); field.dataset.editing = "true"; button.textContent = t("save"); field.focus(); field.select(); return; }
    const email = field.value.trim();
    if (!demoProfile || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    demoProfile = { ...demoProfile, email };
    await browser.storage.local.set({ [DEMO_PROFILE_KEY]:demoProfile });
    delete field.dataset.editing; refreshDashboardSettings(); renderProfileSidebar(); toast(t("settingsSaved")); return;
  }
  if (event.target.closest("#settingsAccountSaveName")) {
    const displayName = $("settingsAccountState").querySelector("#settingsAccountDisplayName").value.trim();
    if (!demoProfile || !displayName) return;
    demoProfile = { ...demoProfile, displayName };
    await browser.storage.local.set({ [DEMO_PROFILE_KEY]:demoProfile });
    renderProfileSidebar(); refreshDashboardSettings(); toast(t("settingsSaved")); return;
  }
  if (event.target.closest("#settingsAccountSaveUsername")) {
    const username = $("settingsAccountState").querySelector("#settingsAccountUsername").value.trim().replace(/^@+/, "");
    if (!demoProfile || !username) return;
    demoProfile = { ...demoProfile, username };
    await browser.storage.local.set({ [DEMO_PROFILE_KEY]:demoProfile });
    renderProfileSidebar(); refreshDashboardSettings(); toast(t("settingsSaved")); return;
  }
  if (event.target.closest("#settingsAccountDelete")) {
    if (!demoProfile || !confirm(t("accountDeleteConfirm"))) return;
    await signOutDemoProfile(); toast(t("accountDeleteSuccess"));
  }
});
$("settingsAccountState").addEventListener("change", async event => {
  const input = event.target.closest("#settingsProfilePictureFile"), file = input?.files?.[0];
  if (!file || !file.type.startsWith("image/") || !demoProfile) return;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    demoProfile = { ...demoProfile, avatarDataUrl: canvas.toDataURL("image/jpeg", .84) };
    await browser.storage.local.set({ [DEMO_PROFILE_KEY]: demoProfile });
    renderProfileSidebar(); refreshDashboardSettings(); toast(t("settingsSaved"));
  } catch (error) { console.warn("Could not save profile picture", error); }
  input.value = "";
});
$("settingsWindowClose").addEventListener("click", () => $("dashboardSettingsDialog").close());
$("settingsWindowMaximize").addEventListener("click", () => $("dashboardSettingsDialog").classList.toggle("is-maximized"));
$("dashboardSettingsDialog").addEventListener("click", event => { if (event.target === $("dashboardSettingsDialog")) $("dashboardSettingsDialog").close(); });
$("dashboardSettingsDialog").addEventListener("close", () => {
  const shouldNotify = dashboardSettingsChangedWhileOpen;
  dashboardSettingsChangedWhileOpen = false;
  toast(t(shouldNotify ? "settingsSaved" : "settingsNoChanges"));
});
document.querySelectorAll("[data-settings-tab]").forEach(button => button.addEventListener("click", () => {
  showDashboardSettingsPanel(button.dataset.settingsTab);
  if (button.dataset.settingsTab === "upgrade") refreshUsageLimitSettings();
}));
$("openRestoreSettingsConfirm").addEventListener("click", () => {
  const dialog = $("restoreSettingsConfirmDialog");
  dialog.returnValue = "";
  dialog.showModal();
});
$("restoreSettingsConfirmDialog").addEventListener("close", () => {
  if ($("restoreSettingsConfirmDialog").returnValue === "confirm") restoreAddonSettings();
});
$("addPronunciationLanguage").addEventListener("click", () => {
  const language = $("pronunciationLanguageSelect").value;
  if (!language || dashboardSettings.customPronunciationDictionary?.[language]) return;
  saveDashboardSettings({ customPronunciationDictionary:{ ...(dashboardSettings.customPronunciationDictionary || {}), [language]:[] } });
});
$("pronunciationLanguageCards").addEventListener("submit", event => {
  const form = event.target.closest(".pronunciation-rule-form");
  if (!form) return;
  event.preventDefault();
  const language = form.dataset.language, original = form.elements.original.value.trim(), replacement = form.elements.replacement.value.trim();
  if (!original || !replacement) return;
  const dictionary = { ...(dashboardSettings.customPronunciationDictionary || {}) }, rules = [...(dictionary[language] || [])];
  if (rules.some(rule => rule.original.toLocaleLowerCase() === original.toLocaleLowerCase())) { form.elements.original.setCustomValidity("This phrase already has a pronunciation."); form.elements.original.reportValidity(); form.elements.original.setCustomValidity(""); return; }
  rules.unshift({ id:`pron-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, original, replacement });
  dictionary[language] = rules;
  saveDashboardSettings({ customPronunciationDictionary:dictionary });
});
$("pronunciationLanguageCards").addEventListener("click", event => {
  const button = event.target.closest("[data-pronunciation-action]");
  if (!button) return;
  const action = button.dataset.pronunciationAction, card = button.closest(".pronunciation-language-card"), language = card?.dataset.language;
  if (!language) return;
  const dictionary = { ...(dashboardSettings.customPronunciationDictionary || {}) };
  if (action === "remove-language") { delete dictionary[language]; saveDashboardSettings({ customPronunciationDictionary:dictionary }); return; }
  const row = button.closest(".pronunciation-rule-row"), ruleId = row?.dataset.ruleId;
  if (!row || !ruleId) return;
  if (action === "delete") { dictionary[language] = (dictionary[language] || []).filter(rule => String(rule.id) !== ruleId); saveDashboardSettings({ customPronunciationDictionary:dictionary }); return; }
  if (action === "edit") {
    const rule = dictionary[language]?.find(entry => String(entry.id) === ruleId); if (!rule) return;
    row.replaceChildren();
    for (const value of [rule.original, rule.replacement]) { const input = document.createElement("input"); input.type = "text"; input.value = value; input.required = true; row.append(input); }
    const actions = document.createElement("span"); actions.className = "pronunciation-rule-actions";
    for (const [name, label] of [["save-edit", t("pronunciationSave")], ["cancel-edit", t("pronunciationCancel")]]) { const control = document.createElement("button"); control.type = "button"; control.dataset.pronunciationAction = name; control.textContent = label; actions.append(control); }
    row.append(actions); row.classList.add("is-editing"); return;
  }
  if (action === "cancel-edit") { renderPronunciationDictionary(); return; }
  if (action === "save-edit") {
    const [sourceInput, readingInput] = row.querySelectorAll("input"), original = sourceInput.value.trim(), replacement = readingInput.value.trim();
    if (!original || !replacement) { sourceInput.reportValidity(); return; }
    const rules = [...(dictionary[language] || [])];
    if (rules.some(rule => String(rule.id) !== ruleId && rule.original.toLocaleLowerCase() === original.toLocaleLowerCase())) { sourceInput.setCustomValidity("This phrase already has a pronunciation."); sourceInput.reportValidity(); sourceInput.setCustomValidity(""); return; }
    dictionary[language] = rules.map(rule => String(rule.id) === ruleId ? { ...rule, original, replacement } : rule);
    saveDashboardSettings({ customPronunciationDictionary:dictionary });
  }
});
$("upgradeActivateCta").addEventListener("click", () => {
  $("usageKeyInput").scrollIntoView({ behavior:"smooth", block:"center" });
  $("usageKeyInput").focus({ preventScroll:true });
});
$("usageKeyForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("usageKeyActivate"), message = $("usageKeyMessage");
  button.disabled = true;
  setDisabledTooltip(button, button, t("disabledActivatingKey"));
  try {
    const result = await browser.runtime.sendMessage({ type:"USAGE_ACTIVATE_KEY", key:$("usageKeyInput").value });
    if (!result?.activated) { message.textContent = t("usageKeyInvalid"); return; }
    $("usageKeyInput").value = "";
    message.textContent = t("usageKeyActivated");
    await refreshUsageLimitSettings();
  } catch (error) {
    message.textContent = t("usageKeyActivationFailed");
    console.warn("Could not activate local test key", error);
  } finally { button.disabled = false; setDisabledTooltip(button, button, ""); }
});
$("settingsDisabledWebsiteForm").addEventListener("submit", async event => {
  event.preventDefault();
  const field = $("settingsDisabledWebsiteInput"), site = normalizeDisabledWebsite(field.value);
  if (!site) { toast(t("invalidWebsite")); field.focus(); return; }
  const sites = Array.isArray(dashboardSettings.disabledWebsites) ? dashboardSettings.disabledWebsites : [];
  if (sites.includes(site)) { toast(t("websiteAlreadyDisabled")); field.focus(); return; }
  field.value = "";
  await updateDisabledWebsites([...sites, site]);
});
$("settingsDisabledWebsiteList").addEventListener("click", async event => {
  const button = event.target.closest("[data-disabled-site-action]"), row = button?.closest(".settings-disabled-web-item");
  if (!button || !row) return;
  const site = row.dataset.site, action = button.dataset.disabledSiteAction;
  const sites = Array.isArray(dashboardSettings.disabledWebsites) ? dashboardSettings.disabledWebsites : [];
  if (action === "edit") { editingDisabledWebsite = site; renderDisabledWebsiteList(); const field = $("settingsDisabledWebsiteList").querySelector(".settings-disabled-web-edit-input"); field?.focus(); field?.select(); return; }
  if (action === "cancel") { editingDisabledWebsite = null; renderDisabledWebsiteList(); return; }
  if (action === "remove") { await updateDisabledWebsites(sites.filter(value => value !== site)); return; }
  if (action === "save") {
    const field = row.querySelector(".settings-disabled-web-edit-input"), updated = normalizeDisabledWebsite(field?.value);
    if (!updated) { toast(t("invalidWebsite")); field?.focus(); return; }
    if (updated !== site && sites.includes(updated)) { toast(t("websiteAlreadyDisabled")); field?.focus(); return; }
    await updateDisabledWebsites(sites.map(value => value === site ? updated : value));
  }
});
$("settingsLanguageSelect").addEventListener("change", async event => {
  dashboardSettingsChangedWhileOpen = true;
  currentLang = event.target.value;
  dashboardSettings = { ...dashboardSettings, language:currentLang };
  applyTranslations(); render(); renderProfileSidebar(); refreshDashboardSettings(); syncBilingualPreview();
  try { await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]:dashboardSettings }); }
  catch (error) { console.warn("Could not save dashboard language", error); }
});
function saveDashboardTranslationMode(settingKey, enabled) {
  const updates = { [settingKey]:enabled };
  if (enabled && settingKey === "showOnSelect") Object.assign(updates, { translateIconEnabled:false, translationPopupEnabled:false });
  else if (enabled && settingKey === "translateIconEnabled") Object.assign(updates, { showOnSelect:false, translationPopupEnabled:false });
  else if (enabled && settingKey === "translationPopupEnabled") Object.assign(updates, { showOnSelect:false, translateIconEnabled:false });
  return saveDashboardSettings(updates);
}
$("settingsAutoPopup").addEventListener("change", event => saveDashboardTranslationMode("showOnSelect", event.target.checked));
$("settingsAutoHighlight").addEventListener("change", event => saveDashboardSettings({ autoHighlight:event.target.checked }));
$("settingsAutoSentence").addEventListener("change", event => saveDashboardSettings({ sentenceNoteEnabled:event.target.checked }));
$("settingsTranslateIconEnabled").addEventListener("change", event => saveDashboardTranslationMode("translateIconEnabled", event.target.checked));
$("settingsTranslationPopupEnabled").addEventListener("change", event => saveDashboardTranslationMode("translationPopupEnabled", event.target.checked));
$("settingsFullEnglishDictionary").addEventListener("change", event => saveDashboardSettings({ showFullEnglishDictionary:event.target.checked }));
$("settingsAutoTranslatePopup").addEventListener("change", event => saveDashboardSettings({ autoTranslate:event.target.checked }));
$("settingsAutoSpeakSelectedText").addEventListener("change", event => saveDashboardSettings({ autoSpeakSelectedText:event.target.checked }));
$("settingsSpeechVoice").addEventListener("change", event => { const voiceMode = event.target.value === "browser" ? "browser" : "google"; saveDashboardSettings({ voiceMode, speechVoice:voiceMode }); });
function normalizeSpeechRate(value) { const rate = Number(value); return Number.isFinite(rate) ? Math.round(Math.min(2, Math.max(.5, rate)) * 10) / 10 : 1; }
function normalizeLanguageSpeechRate(value) { const rate = Number(value); return Number.isFinite(rate) ? Math.round(Math.min(2, Math.max(.5, rate)) * 20) / 20 : 1.25; }
function formatLanguageSpeechRate(value) { const rate = normalizeLanguageSpeechRate(value); return Math.abs(rate * 10 - Math.round(rate * 10)) < 1e-8 ? rate.toFixed(1) : rate.toFixed(2); }
$("settingsSpeechRate").addEventListener("input", event => { const rate = normalizeSpeechRate(event.target.value); $("settingsSpeechRateValue").value = rate.toFixed(1); if (!$("settingsUseLanguageSpeechRate").checked) { $("settingsLanguageSpeechRate").value = String(rate); $("settingsLanguageSpeechRateValue").value = rate.toFixed(1); } });
$("settingsSpeechRate").addEventListener("change", event => saveDashboardSettings({ speechRate:normalizeSpeechRate(event.target.value) }));
$("settingsSpeechRateValue").addEventListener("input", event => { if (event.target.value !== "") { const rate = normalizeSpeechRate(event.target.value); $("settingsSpeechRate").value = String(rate); if (!$("settingsUseLanguageSpeechRate").checked) { $("settingsLanguageSpeechRate").value = String(rate); $("settingsLanguageSpeechRateValue").value = rate.toFixed(1); } } });
$("settingsSpeechRateValue").addEventListener("change", event => { const rate = normalizeSpeechRate(event.target.value); event.target.value = rate.toFixed(1); $("settingsSpeechRate").value = String(rate); saveDashboardSettings({ speechRate:rate }); });
$("resetGlobalSpeechRate").addEventListener("click", () => {
  const rate = Number(CONFIG.DEFAULT_SETTINGS.speechRate) || 1;
  $("settingsSpeechRate").value = String(rate);
  $("settingsSpeechRateValue").value = rate.toFixed(1);
  saveDashboardSettings({ speechRate:rate }).then(saved => { if (saved) toast(t("settingsReset")); });
});
$("settingsUseLanguageSpeechRate").addEventListener("change", event => {
  if (event.target.checked) {
    const inheritedRate = normalizeLanguageSpeechRate($("settingsLanguageSpeechRate").value);
    const inheritedSpeechRateByLanguage = Object.fromEntries(I18N.LANGS.map(language => [language.code, inheritedRate]));
    saveDashboardSettings({ useLanguageSpeechRate:true, inheritedSpeechRateByLanguage });
  } else {
    saveDashboardSettings({ useLanguageSpeechRate:false, hasCustomSpeechRateByLanguage:{}, inheritedSpeechRateByLanguage:{} });
  }
});
function saveLanguageSpeechRate(value) {
  const rate = normalizeLanguageSpeechRate(value);
  const speechRateByLanguage = dashboardSettings.speechRateByLanguage && typeof dashboardSettings.speechRateByLanguage === "object" ? dashboardSettings.speechRateByLanguage : {};
  const hasCustomSpeechRateByLanguage = dashboardSettings.hasCustomSpeechRateByLanguage && typeof dashboardSettings.hasCustomSpeechRateByLanguage === "object" ? dashboardSettings.hasCustomSpeechRateByLanguage : {};
  const inheritedSpeechRateByLanguage = dashboardSettings.inheritedSpeechRateByLanguage && typeof dashboardSettings.inheritedSpeechRateByLanguage === "object" ? dashboardSettings.inheritedSpeechRateByLanguage : {};
  const nextInheritedSpeechRateByLanguage = { ...inheritedSpeechRateByLanguage };
  delete nextInheritedSpeechRateByLanguage[currentLang];
  return saveDashboardSettings({ speechRateByLanguage:{ ...speechRateByLanguage, [currentLang]:rate }, hasCustomSpeechRateByLanguage:{ ...hasCustomSpeechRateByLanguage, [currentLang]:true }, inheritedSpeechRateByLanguage:nextInheritedSpeechRateByLanguage });
}
$("settingsLanguageSpeechRate").addEventListener("input", event => { $("settingsLanguageSpeechRateValue").value = formatLanguageSpeechRate(event.target.value); });
$("settingsLanguageSpeechRate").addEventListener("change", event => saveLanguageSpeechRate(event.target.value));
$("settingsLanguageSpeechRateValue").addEventListener("input", event => { if (event.target.value !== "") $("settingsLanguageSpeechRate").value = String(normalizeLanguageSpeechRate(event.target.value)); });
$("settingsLanguageSpeechRateValue").addEventListener("change", event => { const rate = normalizeLanguageSpeechRate(event.target.value); event.target.value = formatLanguageSpeechRate(rate); $("settingsLanguageSpeechRate").value = String(rate); saveLanguageSpeechRate(rate); });
$("resetLanguageSpeechRate").addEventListener("click", () => {
  const rate = Number(CONFIG.DEFAULT_SETTINGS.speechRateByLanguage?.[currentLang]) || 1.25;
  $("settingsLanguageSpeechRate").value = String(rate);
  $("settingsLanguageSpeechRateValue").value = formatLanguageSpeechRate(rate);
  saveLanguageSpeechRate(rate).then(saved => { if (saved) toast(t("settingsReset")); });
});
$("settingsPopupTranslationSource").addEventListener("change", async event => {
  const previous = studyTranslationSettings;
  studyTranslationSettings = { ...studyTranslationSettings, sourceLanguage:event.target.value };
  refreshFlashcardTranslateSettingsUI();
  if ($("studyDialog").open) renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
  try { await browser.storage.local.set({ [STUDY_TRANSLATION_SETTINGS_KEY]:studyTranslationSettings }); }
  catch (error) {
    studyTranslationSettings = previous;
    $("settingsPopupTranslationSource").value = previous.sourceLanguage;
    refreshFlashcardTranslateSettingsUI();
    console.warn("Could not save popup translation source language", error);
  }
});
$("settingsPopupTranslationTarget").addEventListener("change", async event => {
  const previous = studyTranslationSettings;
  studyTranslationSettings = { ...studyTranslationSettings, targetLanguage:event.target.value };
  refreshFlashcardTranslateSettingsUI(); syncBilingualPreview();
  if ($("studyDialog").open) renderStudyCard({ autoSpeak:false, showAnswer:!$("studyBack").hidden });
  try { await browser.storage.local.set({ [STUDY_TRANSLATION_SETTINGS_KEY]:studyTranslationSettings }); }
  catch (error) {
    studyTranslationSettings = previous;
    $("settingsPopupTranslationTarget").value = previous.targetLanguage;
    refreshFlashcardTranslateSettingsUI(); syncBilingualPreview();
    console.warn("Could not save popup translation language", error);
  }
});
$("settingsSidebarIndicator").addEventListener("change", event => saveDashboardSettings({ sidebarIndicatorEnabled:event.target.checked }));
$("settingsSidebarIndicatorDisabledSites").addEventListener("change", event => saveDashboardSettings({ sidebarIndicatorOnDisabledSites:event.target.checked }));
$("settingsProductUpdates").addEventListener("change", event => saveDashboardSettings({ productUpdatesEnabled:event.target.checked }));
$("settingsWeeklySummary").addEventListener("change", event => saveDashboardSettings({ weeklySummaryEnabled:event.target.checked }));
async function saveBilingualReaderSettings(patch) {
  bilingualReaderSettings = { ...bilingualReaderSettings, ...patch };
  syncBilingualReaderControls();
  if (Object.hasOwn(patch, "readerDisabledWebsites")) { renderDisabledReaderWebsiteList(); syncBilingualReaderControls(); }
  syncBilingualPreview();
  document.querySelectorAll("[data-bilingual-translation-color]").forEach(button => button.classList.toggle("is-selected", button.dataset.bilingualTranslationColor === (bilingualReaderSettings.translationTextColor || "default")));
  $("bilingualTranslationCustomColor").parentElement.classList.toggle("is-custom-selected", bilingualReaderSettings.translationTextColor === "custom");
  try {
    const values = { [BILINGUAL_READER_SETTINGS_KEY]:bilingualReaderSettings };
    if (Object.hasOwn(patch, "webFontFamily")) {
      const fontKeys = { "":"auto", "'Inter', sans-serif":"inter", "'Lora', Georgia, serif":"lora", "'Roboto Mono', monospace":"roboto-mono", "'Fredoka', sans-serif":"fredoka", "system-ui, -apple-system, sans-serif":"system" };
      const fontKey = fontKeys[patch.webFontFamily] || "auto";
      values.lhnCustomFontSettings = { customFontEnabled:fontKey !== "auto", fontKey };
    }
    await browser.storage.local.set(values);
  }
  catch (error) { console.warn("Could not save Bilingual Reader settings", error); }
}
function syncBilingualPreview() {
  const source = $("bilingualPreviewSource"), translated = $("bilingualPreviewTranslation");
  if (!source || !translated) return;
  const sourceText = source.textContent.trim(), targetLang = ["auto", "same"].includes(studyTranslationSettings.targetLanguage) ? currentLang : studyTranslationSettings.targetLanguage;
  source.style.fontFamily = bilingualReaderSettings.webFontFamily || "";
  translated.style.fontFamily = bilingualReaderSettings.fontFamily || "'Inter', sans-serif";
  const fontScale = Math.min(150, Math.max(50, Number(bilingualReaderSettings.translationFontScale) || 80));
  translated.style.setProperty("--translation-scale", `${fontScale}%`);
  translated.style.setProperty("font-size", "max(14px, var(--translation-scale))", "important");
  const color = bilingualReaderSettings.translationTextColor;
  translated.style.color = color === "custom"
    ? (/^#[0-9a-f]{6}$/i.test(bilingualReaderSettings.translationCustomColor) ? bilingualReaderSettings.translationCustomColor : "#2d3748")
    : ["#9c27b0", "#007bff", "#dc3545"].includes(color) ? color : "#2d3748";
  translated.style.fontWeight = /^([1-9]00)$/.test(String(bilingualReaderSettings.translationTextWeight))
    ? String(bilingualReaderSettings.translationTextWeight) : getComputedStyle(source).fontWeight;
  translated.style.borderLeftColor = bilingualReaderSettings.accentColor || "#9c27b0";
  const hex = (bilingualReaderSettings.accentColor || "#9c27b0").match(/[0-9a-f]{2}/gi) || ["9c", "27", "b0"];
  translated.style.backgroundColor = `rgba(${hex.map(part => parseInt(part, 16)).join(",")},.04)`;
  if (bilingualPreviewPendingLanguage && bilingualPreviewPendingLanguage !== targetLang) {
    bilingualPreviewRequestId++; bilingualPreviewPendingLanguage = null;
  }
  if (targetLang === "en") {
    bilingualPreviewRequestId++; bilingualPreviewPendingLanguage = null; translated.textContent = sourceText; return;
  }
  if (bilingualPreviewTranslations.has(targetLang)) { translated.textContent = bilingualPreviewTranslations.get(targetLang); return; }
  if (bilingualPreviewPendingLanguage === targetLang) return;
  bilingualPreviewPendingLanguage = targetLang;
  translated.textContent = "…";
  const requestId = ++bilingualPreviewRequestId;
  browser.runtime.sendMessage({ type:"BILINGUAL_TRANSLATE", text:sourceText, targetLang }).then(result => {
    const currentTargetLang = ["auto", "same"].includes(studyTranslationSettings.targetLanguage) ? currentLang : studyTranslationSettings.targetLanguage;
    if (requestId !== bilingualPreviewRequestId || currentTargetLang !== targetLang) return;
    bilingualPreviewPendingLanguage = null;
    const value = String(result?.translated || "").trim();
    if (value) { bilingualPreviewTranslations.set(targetLang, value); translated.textContent = value; }
    else translated.textContent = t("translationUnavailable");
  }).catch(() => {
    if (requestId !== bilingualPreviewRequestId) return;
    bilingualPreviewPendingLanguage = null;
    translated.textContent = t("translationUnavailable");
  });
}
$("bilingualTransFont").addEventListener("change", event => saveBilingualReaderSettings({ fontFamily:event.target.value }));
$("bilingualWebFont").addEventListener("change", event => saveBilingualReaderSettings({ webFontFamily:event.target.value }));
$("bilingualAccentColor").addEventListener("input", event => saveBilingualReaderSettings({ accentColor:event.target.value }));
document.querySelectorAll("[data-bilingual-color]").forEach(button => button.addEventListener("click", () => { $("bilingualAccentColor").value = button.dataset.bilingualColor; saveBilingualReaderSettings({ accentColor:button.dataset.bilingualColor }); }));
document.querySelectorAll("[data-bilingual-translation-color]").forEach(button => button.addEventListener("click", () => {
  const color = button.dataset.bilingualTranslationColor;
  saveBilingualReaderSettings({ translationTextColor:color });
}));
$("bilingualTranslationCustomColor").addEventListener("input", event => saveBilingualReaderSettings({ translationTextColor:"custom", translationCustomColor:event.target.value }));
$("bilingualTranslationWeight").addEventListener("change", event => saveBilingualReaderSettings({ translationTextWeight:event.target.value }));
$("bilingualTranslationFontScale").addEventListener("input", event => {
  bilingualReaderSettings.translationFontScale = Number(event.target.value);
  $("bilingualTranslationFontScaleValue").textContent = `${event.target.value}%`;
  syncBilingualPreview();
});
$("bilingualTranslationFontScale").addEventListener("change", event => saveBilingualReaderSettings({ translationFontScale:Number(event.target.value) }));
$("resetBilingualTranslationFontScale").addEventListener("click", () => {
  $("bilingualTranslationFontScale").value = "80";
  $("bilingualTranslationFontScaleValue").textContent = "80%";
  saveBilingualReaderSettings({ translationFontScale:80 });
});
$("bilingualSkipSame").addEventListener("change", event => saveBilingualReaderSettings({ skipSameLang:event.target.checked }));
$("bilingualAutoScroll").addEventListener("change", event => saveBilingualReaderSettings({ autoScroll:event.target.checked }));
$("bilingualReadTranslation").addEventListener("change", event => saveBilingualReaderSettings({ readTranslation:event.target.checked }));
$("bilingualEnableTTS").addEventListener("change", event => saveBilingualReaderSettings({ enableTTS:event.target.checked }));
$("bilingualSpeakerIconVisibility").addEventListener("change", event => saveBilingualReaderSettings({ speakerIconVisibility:event.target.value }));
$("bilingualExcludeSelectors").addEventListener("change", event => saveBilingualReaderSettings({ excludeSelectors:event.target.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean) }));
$("bilingualDisabledReaderWebForm").addEventListener("submit", async event => {
  event.preventDefault();
  const field = $("bilingualDisabledReaderWebInput"), site = normalizeDisabledWebsite(field.value);
  if (!site) { toast(t("invalidWebsite")); field.focus(); return; }
  const sites = Array.isArray(bilingualReaderSettings.readerDisabledWebsites) ? bilingualReaderSettings.readerDisabledWebsites : [];
  if (sites.includes(site)) { toast(t("websiteAlreadyDisabled")); field.focus(); return; }
  field.value = ""; await updateDisabledReaderWebsites([...sites, site]);
});
$("bilingualDisabledReaderWebList").addEventListener("click", async event => {
  const button = event.target.closest("[data-reader-site-action]"), row = button?.closest(".settings-disabled-web-item");
  if (!button || !row) return;
  const site = row.dataset.site, action = button.dataset.readerSiteAction;
  const sites = Array.isArray(bilingualReaderSettings.readerDisabledWebsites) ? bilingualReaderSettings.readerDisabledWebsites : [];
  if (action === "edit") { editingDisabledReaderWebsite = site; renderDisabledReaderWebsiteList(); syncBilingualReaderControls(); const field = $("bilingualDisabledReaderWebList").querySelector(".settings-disabled-web-edit-input"); field?.focus(); field?.select(); return; }
  if (action === "cancel") { editingDisabledReaderWebsite = null; renderDisabledReaderWebsiteList(); syncBilingualReaderControls(); return; }
  if (action === "remove") { await updateDisabledReaderWebsites(sites.filter(value => value !== site)); return; }
  if (action === "save") {
    const field = row.querySelector(".settings-disabled-web-edit-input"), updated = normalizeDisabledWebsite(field?.value);
    if (!updated) { toast(t("invalidWebsite")); field?.focus(); return; }
    if (updated !== site && sites.includes(updated)) { toast(t("websiteAlreadyDisabled")); field?.focus(); return; }
    await updateDisabledReaderWebsites(sites.map(value => value === site ? updated : value));
  }
});
$("bilingualClearCache").addEventListener("click", async () => { await browser.runtime.sendMessage({ type:"BILINGUAL_CLEAR_CACHE" }); toast(t("bilingualCacheCleared")); });
document.querySelectorAll("[data-settings-theme]").forEach(button => button.addEventListener("click", () => saveDashboardSettings({ sidebarTheme:button.dataset.settingsTheme })));
document.querySelectorAll("[data-settings-color]").forEach(button => button.addEventListener("click", () => saveDashboardSettings({ defaultHighlightColor:button.dataset.settingsColor })));
$("settingsExportButton").addEventListener("click", event => {
  event.stopPropagation();
  const menu = $("settingsBackupExportMenu"), shouldOpen = menu.hidden;
  closeMenus(); menu.hidden = !shouldOpen; $("settingsExportButton").setAttribute("aria-expanded", String(shouldOpen));
});
$("settingsImportJson").addEventListener("click", () => $("importFile").click());
function setupDashboardShortcut(id, settingKey) {
  const field = $(id); let isCapturing = false;
  const restore = () => { isCapturing = false; field.value = dashboardSettings[settingKey] ?? CONFIG.DEFAULT_SETTINGS[settingKey]; };
  field.addEventListener("focus", () => { isCapturing = true; field.value = t("shortcutCapture"); });
  field.addEventListener("blur", () => { if (isCapturing) restore(); });
  field.addEventListener("keydown", async event => {
    if (!isCapturing) return;
    event.preventDefault(); event.stopPropagation();
    if (event.key === "Escape") { restore(); field.blur(); return; }
    if (event.key === "Backspace") { isCapturing = false; field.value = ""; await saveDashboardSettings({ [settingKey]:"" }); field.blur(); return; }
    if (["Control", "Alt", "Shift", "Meta"].includes(event.key)) return;
    const modifiers = []; if (event.ctrlKey) modifiers.push("Ctrl"); if (event.altKey) modifiers.push("Alt"); if (event.shiftKey) modifiers.push("Shift"); if (event.metaKey) modifiers.push("Meta");
    const key = event.code === "Space" ? "Space" : event.key === "ArrowLeft" ? "Left" : event.key === "ArrowRight" ? "Right" : event.key === "ArrowUp" ? "Up" : event.key === "ArrowDown" ? "Down" : event.key.length === 1 ? event.key.toLocaleUpperCase() : event.key;
    if (!modifiers.length && !["Space", "Left", "Right", "Up", "Down"].includes(key)) return;
    const value = [...modifiers, key].join("+"); isCapturing = false;
    await saveDashboardSettings({ [settingKey]:value }); field.blur();
  });
}
setupDashboardShortcut("settingsShortcut", "shortcut");
setupDashboardShortcut("settingsSidebarShortcut", "sidebarShortcut");
setupDashboardShortcut("settingsTranslateShortcut", "translateSelectedShortcut");
setupDashboardShortcut("settingsWebsiteShortcut", "toggleWebsiteShortcut");
setupDashboardShortcut("settingsSpeechPauseShortcut", "speechPauseShortcut");
setupDashboardShortcut("settingsPreviousReadingShortcut", "previousReadingShortcut");
setupDashboardShortcut("settingsNextReadingShortcut", "nextReadingShortcut");
setupDashboardShortcut("settingsIncreaseReadingSpeedShortcut", "increaseReadingSpeedShortcut");
setupDashboardShortcut("settingsDecreaseReadingSpeedShortcut", "decreaseReadingSpeedShortcut");
setupDashboardShortcut("settingsSelectVoiceShortcut", "selectVoiceShortcut");
$("resetDashboardShortcuts").addEventListener("click", () => saveDashboardSettings({
  shortcut:CONFIG.DEFAULT_SETTINGS.shortcut,
  sidebarShortcut:CONFIG.DEFAULT_SETTINGS.sidebarShortcut,
  translateSelectedShortcut:CONFIG.DEFAULT_SETTINGS.translateSelectedShortcut,
  toggleWebsiteShortcut:CONFIG.DEFAULT_SETTINGS.toggleWebsiteShortcut,
  speechPauseShortcut:CONFIG.DEFAULT_SETTINGS.speechPauseShortcut,
  previousReadingShortcut:CONFIG.DEFAULT_SETTINGS.previousReadingShortcut,
  nextReadingShortcut:CONFIG.DEFAULT_SETTINGS.nextReadingShortcut,
  increaseReadingSpeedShortcut:CONFIG.DEFAULT_SETTINGS.increaseReadingSpeedShortcut,
  decreaseReadingSpeedShortcut:CONFIG.DEFAULT_SETTINGS.decreaseReadingSpeedShortcut,
  selectVoiceShortcut:CONFIG.DEFAULT_SETTINGS.selectVoiceShortcut
}).then(saved => { if (saved) toast(t("settingsReset")); }));
$("profileMenuSignOut").addEventListener("click", signOutDemoProfile);
$("profileImportJson").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", async e => {
  const file = e.target.files?.[0]; if (!file) return;
  try {
    const parsed = JSON.parse(await file.text()), items = Array.isArray(parsed) ? parsed : parsed.annotations;
    if (!Array.isArray(items)) throw new Error(t("invalidImport"));
    const result = await browser.runtime.sendMessage({ type:"IMPORT", items, origin:DASHBOARD_INSTANCE_ID });
    if (!Array.isArray(parsed) && Array.isArray(parsed.favorites)) {
      favorites = [...new Set([...favorites, ...parsed.favorites.filter(value => typeof value === "string")])];
      await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.FAVORITES]:favorites });
    }
    if (!Array.isArray(parsed) && Array.isArray(parsed.favoriteNoteIds)) {
      favoriteNoteIds = new Set([...favoriteNoteIds, ...parsed.favoriteNoteIds.filter(value => typeof value === "string")]);
      await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.NOTE_FAVORITES]:[...favoriteNoteIds] });
    }
    await load(); toast(t("importedCount", { count:result.imported })); closeMenus();
  } catch (error) { alert(t("importFailed", { error:error.message })); }
  e.target.value = "";
});
$("profileAppearanceToggle").addEventListener("click", async () => {
  const previous = dashboardSettings, wasDark = document.documentElement.classList.contains("dark");
  dashboardSettings = { ...dashboardSettings, sidebarTheme: wasDark ? "light" : "dark" };
  syncDashboardTheme();
  try { await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.SETTINGS]: dashboardSettings }); }
  catch (error) { dashboardSettings = previous; syncDashboardTheme(); console.warn("Could not save dashboard theme", error); }
});
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.lhnUsageLimitState && $("dashboardSettingsDialog")?.open) refreshUsageLimitSettings();
  if (changes[CONFIG.STORAGE_KEYS.SETTINGS]) {
    const previousLanguage = currentLang;
    dashboardSettings = changes[CONFIG.STORAGE_KEYS.SETTINGS].newValue || {};
    currentLang = I18N.languageFor(dashboardSettings);
    syncDashboardTheme();
    if (currentLang !== previousLanguage) { applyTranslations(); render(); syncBilingualPreview(); }
    else refreshDashboardSettings();
  }
  if (changes[CONFIG.STORAGE_KEYS.FAVORITES]) {
    favorites = Array.isArray(changes[CONFIG.STORAGE_KEYS.FAVORITES].newValue) ? changes[CONFIG.STORAGE_KEYS.FAVORITES].newValue : [];
    refreshFavoriteDashboard();
  }
  if (changes[CONFIG.STORAGE_KEYS.NOTE_FAVORITES]) {
    favoriteNoteIds = new Set(Array.isArray(changes[CONFIG.STORAGE_KEYS.NOTE_FAVORITES].newValue) ? changes[CONFIG.STORAGE_KEYS.NOTE_FAVORITES].newValue : []);
    render();
  }
  if (changes[CONFIG.STORAGE_KEYS.ANNOTATIONS]) {
    if ($("studyDialog").open) { annotationsChangedDuringStudy = true; return; }
    load();
  }
});
browser.runtime.onMessage.addListener(message => {
  if (message?.type === "OPEN_DASHBOARD_SETTINGS") { openDashboardSettings(); return; }
  if (message?.type === "OPEN_DASHBOARD_ACCOUNT") { openDashboardSettings(); if (!demoProfile) openProfileAuth(); return; }
  if (message?.type === "OPEN_DASHBOARD_BILINGUAL_SETTINGS") { openDashboardSettings("bilingualReader"); return; }
  if (message?.type !== "ANNOTATIONS_CHANGED") return;
  if (message.change?.origin === DASHBOARD_INSTANCE_ID) return;
  if ($("studyDialog").open) { annotationsChangedDuringStudy = true; return; }
  if (!applyAnnotationChange(message.change)) load();
});
$("exportErrorLog")?.addEventListener("click", async () => {
  try {
    const key = "lhnDiagnosticErrorLogV1";
    const stored = await browser.storage.local.get(key);
    const entries = Array.isArray(stored[key]) ? stored[key].slice(-200).map(entry => ({
      timestamp: typeof entry?.timestamp === "string" && Number.isFinite(Date.parse(entry.timestamp)) ? new Date(entry.timestamp).toISOString() : null,
      component: ["background", "content", "dashboard", "popup"].includes(entry?.component) ? entry.component : "app",
      severity: ["error", "warning"].includes(entry?.severity) ? entry.severity : "error",
      code: typeof entry?.code === "string" && /^[a-z.]+$/.test(entry.code) ? entry.code : "app.error"
    })) : [];
    const blob = new Blob([JSON.stringify({ formatVersion:1, exportedAt:new Date().toISOString(), entries }, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url;
    link.download = `keepit-error-log-${new Date().toISOString().slice(0, 10)}.json`;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) { console.warn("Could not export diagnostic log", error); }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenus(); });
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => { if (dashboardSettings.sidebarTheme !== "dark" && dashboardSettings.sidebarTheme !== "light") syncDashboardTheme(); });
load().then(() => {
  if (new URLSearchParams(location.search).get("openSettings") === "1") { const params = new URLSearchParams(location.search); openDashboardSettings(params.get("openSettingsTab") || "account"); if (params.get("openAccount") === "1" && !demoProfile) openProfileAuth(); }
});

