const $ = id => document.getElementById(id);
const LANGUAGES = globalThis.LHN_LANGUAGES;
const CONFIG = globalThis.LHN_CONFIG;
const STUDY_UTILS = globalThis.LHN_STUDY_UTILS;
const STUDY_TRANSLATOR = globalThis.LHN_STUDY_TRANSLATION.create({ browser });
CONFIG.applyHighlightColors();
const DASHBOARD_INSTANCE_ID = crypto.randomUUID();
let annotations = [], favorites = [], favoriteNoteIds = new Set(), editingId = null, currentLang = "en", selectedUrl = null, editColor = CONFIG.DEFAULT_COLOR, dashboardSettings = {}, dashboardSettingsChangedWhileOpen = false;
const DEMO_PROFILE_KEY = LHN_ACCOUNT.KEY;
const BILINGUAL_READER_SETTINGS_KEY = "lhnBilingualReaderSettings";
const LAST_DASHBOARD_SETTINGS_TAB_KEY = "lhnDashboardLastSettingsTab";
const DASHBOARD_SETTINGS_TAB_NAMES = new Set(["account", "notes", "translate", "speech", "bilingualReader", "disableWeb", "appearance", "shortcuts", "notifications", "backup", "upgrade", "reset", "about"]);
let lastDashboardSettingsTab = "account";
const DEFAULT_BILINGUAL_READER_SETTINGS = globalThis.LHN_DEFAULTS.reader;
let bilingualReaderSettings = { ...DEFAULT_BILINGUAL_READER_SETTINGS };
let bilingualPreviewRequestId = 0, bilingualPreviewPendingLanguage = null;
const bilingualPreviewTranslations = new Map();
let demoProfile = null, profileAuthMode = "login";
let overviewSessionsReady = false, overviewSessionsLoading = false;
let editingDisabledWebsite = null;
let editingDisabledReaderWebsite = null;
const annotationById = new Map();
const annotationPositionById = new Map();
const ANNOTATION_UTILS = globalThis.LHN_ANNOTATION_UTILS.create({ unknownSite:() => t("unknownWebsite") });
let annotationDataRevision = 0;
let studyQueue = [], studyQueueHead = 0, studyHistory = [], studyReviewed = 0, studyRemembered = 0, studyAutoSpeak = true, studySpeechToken = 0, studyPlayAllSources = false, studySourceKey = null, studySpeakAfterSettingsClose = false, studyTypedAnswer = "", studyTypedAnswerForId = null, studySettingsTab = "study";
let annotationsChangedDuringStudy = false;
const studyCompletedIds = new Set();
const STUDY_SHORTCUT_KEY = "lhnStudyShortcuts", STUDY_FOCUS_MODE_KEY = "lhnStudyFocusMode", STUDY_SHOW_SHORTCUTS_KEY = "lhnStudyShowShortcuts", STUDY_PREFERENCES_KEY = "lhnStudyPreferences", STUDY_TRANSLATION_SETTINGS_KEY = "lhnStudyTranslationSettings", FLASHCARD_TRANSLATE_SETTINGS_KEY = "lhnFlashcardTranslateSettings";
const STUDY_DEFINITION_TAB_KEY = "lhnStudyDefinitionTabId";
let studyDefinitionTabId = null, studyDefinitionTabQueue = Promise.resolve();
const DEFAULT_STUDY_PREFERENCES = Object.freeze({ alwaysPlayAll: false, alwaysAutoSpeak: true, alwaysFocusMode: true, showSentenceNoteFront: true, autoSpeakSentenceNoteFront: true, typeTheAnswer: true, reverseFlashcards: false, searchNoteDefinition: true, switchToDefinitionTab: true, definitionLanguage: "auto" });
const CUSTOM_FLASHCARD_PREFERENCE_KEYS = Object.freeze(["alwaysPlayAll", "alwaysAutoSpeak", "alwaysFocusMode", "showSentenceNoteFront", "autoSpeakSentenceNoteFront", "typeTheAnswer", "reverseFlashcards"]);
let studyPreferences = { ...DEFAULT_STUDY_PREFERENCES };
const DEFAULT_STUDY_TRANSLATION_SETTINGS = globalThis.LHN_DEFAULTS.studyTranslation;
let studyTranslationSettings = { ...DEFAULT_STUDY_TRANSLATION_SETTINGS };
const DEFAULT_FLASHCARD_TRANSLATE_SETTINGS = globalThis.LHN_DEFAULTS.flashcard;
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

function icon(name, cls = "") { return LHN_ICONS.render(name, cls); }



function t(key, vars = {}, language = currentLang) { return LANGUAGES.t(key, vars, language); }
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
function profileDisplayName(profile = demoProfile) {
  const displayName = String(profile?.displayName || "").trim();
  if (displayName) return displayName;
  const username = String(profile?.username || "").trim().replace(/^@+/, "");
  const email = String(profile?.email || "").trim();
  return (username || email).split("@")[0] || t("profileGuest");
}
function profilePictureMarkup(profile = demoProfile, fallback = "") { return profile?.avatarDataUrl ? `<img class="profile-picture-img" src="${escapeHtml(profile.avatarDataUrl)}" alt="">` : fallback; }
function syncDashboardTheme() {
  const preference = dashboardSettings.sidebarTheme;
  const dark = preference === "dark" || (preference !== "light" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  if (root.classList.contains("dashboard-theme-pending")) {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("dashboard-theme-pending")));
  }
  const state = $("profileAppearanceState");
  if (state) state.textContent = t(dark ? "darkMode" : "lightMode");
  const sidebarThemeLabel = $("dashboardSidebarThemeText"), sidebarThemeButton = $("dashboardSidebarThemeToggle");
  if (sidebarThemeLabel) sidebarThemeLabel.textContent = dark ? "Giao diện tối" : "Giao diện sáng";
  if (sidebarThemeButton) {
    const label = dark ? "Giao diện tối" : "Giao diện sáng";
    sidebarThemeButton.setAttribute("aria-pressed", String(dark));
    sidebarThemeButton.setAttribute("aria-label", label);
    sidebarThemeButton.title = "Đổi giao diện Sáng / Tối";
  }
}
function showDashboardSettingsPanel(name) {
  const requestedPanel = DASHBOARD_SETTINGS_TAB_NAMES.has(name) ? name : "account";
  const panelName = !demoProfile && requestedPanel === "upgrade" ? "account" : requestedPanel;
  lastDashboardSettingsTab = panelName;
  browser.storage.local.set({ [LAST_DASHBOARD_SETTINGS_TAB_KEY]:panelName }).catch(() => {});
  document.querySelectorAll("[data-settings-panel]").forEach(panel => { const active = panel.dataset.settingsPanel === panelName; panel.hidden = !active; panel.classList.toggle("is-active", active); });
  document.querySelectorAll("[data-settings-tab]").forEach(button => button.classList.toggle("is-active", button.dataset.settingsTab === panelName));
}
function renderPronunciationDictionary() {
  const container = $("pronunciationLanguageCards");
  if (!container) return;
  const dictionary = dashboardSettings.customPronunciationDictionary && typeof dashboardSettings.customPronunciationDictionary === "object" ? dashboardSettings.customPronunciationDictionary : {};
  const supportedLanguages = LANGUAGES.LANGS.map(language => ({ ...language, speechCode:{ en:"en-US", vi:"vi-VN", ko:"ko-KR" }[language.code] }));
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
const SETTINGS_UI = globalThis.LHN_DASHBOARD_SETTINGS_UI.create({ $, document, languages:LANGUAGES, t, escapeHtml });
SETTINGS_UI.initLanguagePicker();
SETTINGS_UI.initSettingsSearch();
function syncSettingsLanguagePicker() { SETTINGS_UI.syncLanguagePicker(); }
function refreshDashboardSettings() {
  const select = $("settingsLanguageSelect");
  if (!select.options.length) for (const language of LANGUAGES.LANGS) { const option = document.createElement("option"); option.value = language.code; option.textContent = `${language.flag} ${language.name} — ${language.native}`; select.appendChild(option); }
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
  // Giá trị dùng chung có thể tới 3 khi đặt từ thanh đọc Reader; control của Dashboard vẫn giới hạn 0.5–2.
  const speechRate = Number.isFinite(storedSpeechRate) ? Math.min(3, Math.max(.5, storedSpeechRate)) : 1;
  const globalSpeechRateLabel = t("globalSpeechRate");
  $("settingsSpeechRate").setAttribute("aria-label", globalSpeechRateLabel);
  $("settingsSpeechRateValue").setAttribute("aria-label", globalSpeechRateLabel);
  $("settingsSpeechRate").value = String(Math.min(2, speechRate));
  $("settingsSpeechRateValue").value = Number.isInteger(speechRate * 10) ? speechRate.toFixed(1) : String(Math.round(speechRate * 100) / 100);
  const useLanguageSpeechRate = dashboardSettings.useLanguageSpeechRate ?? (CONFIG.DEFAULT_SETTINGS.useLanguageSpeechRate === true);
  const speechRateByLanguage = dashboardSettings.speechRateByLanguage && typeof dashboardSettings.speechRateByLanguage === "object" ? dashboardSettings.speechRateByLanguage : {};
  const hasCustomSpeechRateByLanguage = dashboardSettings.hasCustomSpeechRateByLanguage && typeof dashboardSettings.hasCustomSpeechRateByLanguage === "object" ? dashboardSettings.hasCustomSpeechRateByLanguage : {};
  const inheritedSpeechRateByLanguage = dashboardSettings.inheritedSpeechRateByLanguage && typeof dashboardSettings.inheritedSpeechRateByLanguage === "object" ? dashboardSettings.inheritedSpeechRateByLanguage : {};
  const languageRate = Number(speechRateByLanguage[currentLang]);
  const inheritedLanguageRate = Number(inheritedSpeechRateByLanguage[currentLang]);
  const customLanguageRate = useLanguageSpeechRate
    ? hasCustomSpeechRateByLanguage[currentLang] === true && Number.isFinite(languageRate)
      ? Math.min(3, Math.max(.5, languageRate))
      : Number.isFinite(inheritedLanguageRate) ? Math.min(3, Math.max(.5, inheritedLanguageRate)) : Number(CONFIG.DEFAULT_SETTINGS.speechRateByLanguage?.[currentLang]) || speechRate
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
  $("settingsDualSubtitlesShortcut").value = dashboardSettings.dualSubtitlesShortcut ?? CONFIG.DEFAULT_SETTINGS.dualSubtitlesShortcut;
  $("settingsDictationShortcut").value = dashboardSettings.dictationShortcut ?? CONFIG.DEFAULT_SETTINGS.dictationShortcut;
  $("settingsSpeechPauseShortcut").value = dashboardSettings.speechPauseShortcut ?? CONFIG.DEFAULT_SETTINGS.speechPauseShortcut;
  $("settingsPreviousReadingShortcut").value = dashboardSettings.previousReadingShortcut ?? CONFIG.DEFAULT_SETTINGS.previousReadingShortcut;
  $("settingsNextReadingShortcut").value = dashboardSettings.nextReadingShortcut ?? CONFIG.DEFAULT_SETTINGS.nextReadingShortcut;
  $("settingsIncreaseReadingSpeedShortcut").value = dashboardSettings.increaseReadingSpeedShortcut ?? CONFIG.DEFAULT_SETTINGS.increaseReadingSpeedShortcut;
  $("settingsDecreaseReadingSpeedShortcut").value = dashboardSettings.decreaseReadingSpeedShortcut ?? CONFIG.DEFAULT_SETTINGS.decreaseReadingSpeedShortcut;
  $("settingsSelectVoiceShortcut").value = dashboardSettings.selectVoiceShortcut ?? CONFIG.DEFAULT_SETTINGS.selectVoiceShortcut;
  ["settingsShortcut", "settingsSidebarShortcut", "settingsTranslateShortcut", "settingsWebsiteShortcut", "settingsDualSubtitlesShortcut", "settingsDictationShortcut", "settingsSpeechPauseShortcut", "settingsPreviousReadingShortcut", "settingsNextReadingShortcut", "settingsIncreaseReadingSpeedShortcut", "settingsDecreaseReadingSpeedShortcut", "settingsSelectVoiceShortcut"].forEach(id => { $(id).title = t("shortcutInputHint"); });
  $("resetDashboardShortcuts").classList.toggle("has-custom-shortcuts", ["shortcut", "sidebarShortcut", "translateSelectedShortcut", "toggleWebsiteShortcut", "dualSubtitlesShortcut", "dictationShortcut", "speechPauseShortcut", "previousReadingShortcut", "nextReadingShortcut", "increaseReadingSpeedShortcut", "decreaseReadingSpeedShortcut", "selectVoiceShortcut"].some(key => (dashboardSettings[key] ?? CONFIG.DEFAULT_SETTINGS[key]) !== CONFIG.DEFAULT_SETTINGS[key]));
  $("settingsVersion").textContent = `v${browser.runtime.getManifest().version}`;
  const displayName = demoProfile ? profileDisplayName(demoProfile) : t("profileGuest"), email = demoProfile ? String(demoProfile.email || "").trim() : t("profileLocal");
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
    emailField.value = String(demoProfile.email || "").trim();
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
    const status = await LHN_MESSAGING.sendMessage({ type:"USAGE_STATUS" });
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
  const sites = Array.isArray(dashboardSettings.disabledWebsites) ? dashboardSettings.disabledWebsites : [];
  SETTINGS_UI.renderWebsiteList({ host:$("settingsDisabledWebsiteList"), sites, editing:editingDisabledWebsite, actionAttribute:"disabled-site-action", ariaLabel:"disableWeb", emptyTextKey:"noDisabledWebsites", actionKeys:[["edit", "edit"], ["remove", "removeWebsite"]] });
}
async function updateDisabledWebsites(sites) {
  editingDisabledWebsite = null;
  await saveDashboardSettings({ disabledWebsites: [...new Set(sites)] });
}
function renderDisabledReaderWebsiteList() {
  const sites = Array.isArray(bilingualReaderSettings.readerDisabledWebsites) ? bilingualReaderSettings.readerDisabledWebsites : [];
  SETTINGS_UI.renderWebsiteList({ host:$("bilingualDisabledReaderWebList"), sites, editing:editingDisabledReaderWebsite, actionAttribute:"reader-site-action", ariaLabel:"bilingualDisabledReaderWeb", emptyTextKey:"noDisabledWebsites", actionKeys:[["edit", "edit"], ["remove", "removeWebsite"]] });
}
function syncBilingualReaderControls() { SETTINGS_UI.syncReaderControls(); }
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
  try { await LHN_SETTINGS.save(dashboardSettings); return true; }
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
function renderProfileMenu() {
  const menuAvatar = $("profileMenuAvatar"), accountHost = $("profileMenuAccountHost"), menuIdentity = $("profileMenuIdentity"), signOutButton = $("profileMenuSignOut");
  const menuToggleName = $("profileMenuToggleName"), menuToggleEmail = $("profileMenuToggleEmail"), popoverName = $("profilePopoverName"), popoverEmail = $("profilePopoverEmail"), popoverStatus = $("profilePopoverStatus"), popoverSyncButton = $("profilePopoverSyncButton"), menuToggleAvatar = $("profileMenuToggleAvatar"), profileMenuPlan = $("profileMenuPlan"), syncMenuItem = $("profileMenuSyncItem"), helpMenuItem = $("profileMenuHelpItem"), logoutMenuItem = $("profileMenuLogoutAction"), guestLoginItem = $("profileMenuGuestLogin");
  const activeEmail = String(demoProfile?.email || "").trim();
  const activeName = demoProfile ? profileDisplayName(demoProfile) : t("profileGuest");
  if (menuToggleName) menuToggleName.textContent = activeName;
  if (popoverName) popoverName.textContent = activeName;
  for (const emailNode of [menuToggleEmail, popoverEmail]) {
    if (!emailNode) continue;
    emailNode.textContent = activeEmail;
    emailNode.hidden = !demoProfile || !activeEmail;
  }
  if (menuToggleAvatar) menuToggleAvatar.textContent = Array.from(activeName)[0] || "B";
  if (profileMenuPlan) profileMenuPlan.hidden = !demoProfile;
  if (popoverStatus) { popoverStatus.textContent = t("profileSignInToSync"); popoverStatus.hidden = Boolean(demoProfile); }
  for (const item of [syncMenuItem, helpMenuItem]) if (item) item.hidden = !demoProfile;
  if (logoutMenuItem) logoutMenuItem.hidden = !demoProfile;
  if (guestLoginItem) guestLoginItem.hidden = Boolean(demoProfile);
  const guestAvatar = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>';
  const syncStatusLabel = t(demoProfile ? "profileLocal" : "profileNotSynced");
  const syncIcon = demoProfile
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud preview-icon" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-off preview-icon" aria-hidden="true"><path d="M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057"/><path d="M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78"/><path d="m2 2 20 20"/></svg>';
  if (popoverSyncButton) {
    popoverSyncButton.hidden = false;
    popoverSyncButton.innerHTML = syncIcon;
    popoverSyncButton.title = syncStatusLabel;
    popoverSyncButton.setAttribute("aria-label", syncStatusLabel);
    if (demoProfile) popoverSyncButton.removeAttribute("data-profile-menu-action");
    else popoverSyncButton.dataset.profileMenuAction = "login";
  }
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
  await LHN_ACCOUNT.saveProfile(browser, demoProfile);
  $("profileAuthDialog").close(); renderProfileMenu();
  if ($("dashboardSettingsDialog").open) refreshDashboardSettings();
}
async function signOutDemoProfile() {
  await LHN_ACCOUNT.removeProfile(browser);
  demoProfile = null;
  closeMenus();
  renderProfileMenu();
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
function siteOf(item) { return ANNOTATION_UTILS.siteOf(item); }
function tagsOf(item) { return ANNOTATION_UTILS.tagsOf(item); }
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
function pageKey(item) { return ANNOTATION_UTILS.pageKey(item); }
function fmtDate(value) { if (!value) return t("dateUnknown"); try { return new Intl.DateTimeFormat(currentLang === "vi" ? "vi-VN" : currentLang === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value)); } catch { return t("dateUnknown"); } }
function populateStudyLanguageOptions(select, autoValue, selectedValue) {
  if (!select) return;
  const fragment = document.createDocumentFragment();
  const automatic = document.createElement("option");
  automatic.value = autoValue;
  automatic.textContent = `🌐 ${t("autoLanguage")}`;
  fragment.appendChild(automatic);
  for (const language of LANGUAGES.LANGS) {
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
  const displayLanguage = LANGUAGES.languageFor(dashboardSettings);
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
let listeningPreviewFilter = "all", listeningPreviewInitialized = false;
function refreshListeningPreview() {
  const input = $("listenSessionSearch");
  if (!input) return;
  const query = input.value.trim(), normalizedQuery = query.toLocaleLowerCase(currentLang);
  const cards = [...document.querySelectorAll("#dashboardListeningView .session-card")];
  let visible = 0;
  cards.forEach(card => {
    const matchesSource = listeningPreviewFilter === "all" || card.dataset.source === listeningPreviewFilter;
    const cardText = `${card.dataset.search || ""} ${card.textContent}`.toLocaleLowerCase(currentLang);
    const matchesText = !normalizedQuery || cardText.includes(normalizedQuery);
    card.hidden = !(matchesSource && matchesText);
    if (!card.hidden) visible++;
  });
  const status = $("listenSearchStatus"), actions = $("listenExternalActions"), noResults = $("listenNoResults"), count = $("listenVisibleCount");
  if (status) status.textContent = query ? t("listenSearchResults", { count:visible, query }) : t("listenSearchEmpty");
  actions?.classList.toggle("visible", Boolean(query));
  const youtubeText = $("listenYoutubeSearchText"), googleText = $("listenGoogleSearchText");
  if (youtubeText) youtubeText.textContent = query ? t("listenSearchYoutubeQuery", { query }) : t("listenSearchYoutube");
  if (googleText) googleText.textContent = query ? t("listenSearchGoogleQuery", { query }) : t("listenSearchGoogle");
  if (count) count.textContent = t("listenVisibleCount", { count:visible });
  if (noResults) { noResults.hidden = visible > 0; noResults.classList.toggle("visible", visible === 0); }
}
function initListeningPreview() {
  if (listeningPreviewInitialized) return;
  const input = $("listenSessionSearch");
  if (!input) return;
  listeningPreviewInitialized = true;
  input.addEventListener("input", refreshListeningPreview);
  document.querySelectorAll("#dashboardListeningView .filters [data-filter]").forEach(button => button.addEventListener("click", () => {
    listeningPreviewFilter = button.dataset.filter || "all";
    document.querySelectorAll("#dashboardListeningView .filters [data-filter]").forEach(filter => {
      const active = filter === button;
      filter.classList.toggle("active", active);
      filter.setAttribute("aria-pressed", String(active));
    });
    refreshListeningPreview();
  }));
  document.querySelectorAll("#dashboardListeningView [data-engine]").forEach(button => button.addEventListener("click", () => {
    const query = input.value.trim();
    if (!query) { input.focus(); toast(t("listenEnterSearch")); return; }
    toast(t("listenExternalToast", { query, engine:button.dataset.engine }));
  }));
  document.querySelectorAll("#dashboardListeningView .demo-action").forEach(button => button.addEventListener("click", () => toast(t("listenPreviewActionToast"))));
  document.querySelectorAll("#dashboardListeningView .mistake-filter button").forEach(button => button.addEventListener("click", () => {
    button.parentElement.querySelectorAll("button").forEach(filter => filter.classList.toggle("active", filter === button));
    toast(t("listenMistakeFilterToast", { filter:button.textContent.trim() }));
  }));
  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !$("dashboardListeningView").hidden) { event.preventDefault(); input.focus(); }
    if (event.key === "Escape" && document.activeElement === input) { input.value = ""; refreshListeningPreview(); input.blur(); }
  });
  refreshListeningPreview();
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
  refreshListeningPreview();
}
async function load() {
  const settingsData = await browser.storage.local.get([CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.STORAGE_KEYS.FAVORITES, CONFIG.STORAGE_KEYS.NOTE_FAVORITES, STUDY_SHORTCUT_KEY, STUDY_FOCUS_MODE_KEY, STUDY_SHOW_SHORTCUTS_KEY, STUDY_PREFERENCES_KEY, STUDY_TRANSLATION_SETTINGS_KEY, FLASHCARD_TRANSLATE_SETTINGS_KEY, DEMO_PROFILE_KEY, BILINGUAL_READER_SETTINGS_KEY, LAST_DASHBOARD_SETTINGS_TAB_KEY]);
  if (DASHBOARD_SETTINGS_TAB_NAMES.has(settingsData[LAST_DASHBOARD_SETTINGS_TAB_KEY])) lastDashboardSettingsTab = settingsData[LAST_DASHBOARD_SETTINGS_TAB_KEY];
  const savedBilingualReaderSettings = settingsData[BILINGUAL_READER_SETTINGS_KEY] || {};
  const savedReaderSites = Array.isArray(savedBilingualReaderSettings.readerDisabledWebsites) ? savedBilingualReaderSettings.readerDisabledWebsites : [];
  const seedReaderSites = savedBilingualReaderSettings.readerDefaultSitesSeeded !== true;
  bilingualReaderSettings = { ...DEFAULT_BILINGUAL_READER_SETTINGS, ...savedBilingualReaderSettings, readerDisabledWebsites:seedReaderSites ? [...new Set([...CONFIG.DEFAULT_READER_DISABLED_WEBSITES, ...savedReaderSites])] : savedReaderSites, readerDefaultSitesSeeded:true };
  // "Read translation with source" mặc định bật từ v3.4.594; bản lưu cũ đã ghi cứng false nên bật lại một lần.
  const readTranslationDefaultNeedsOn = savedBilingualReaderSettings.readTranslationDefaultOn !== true;
  if (readTranslationDefaultNeedsOn) bilingualReaderSettings = { ...bilingualReaderSettings, readTranslation:true, readTranslationDefaultOn:true };
  if (seedReaderSites || readTranslationDefaultNeedsOn) browser.storage.local.set({ [BILINGUAL_READER_SETTINGS_KEY]:bilingualReaderSettings }).catch(() => {});
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
    try { await LHN_SETTINGS.save(dashboardSettings); }
    catch (error) { console.warn("Could not initialize pronunciation dictionary defaults", error); }
  }
  demoProfile = settingsData[DEMO_PROFILE_KEY] && typeof settingsData[DEMO_PROFILE_KEY] === "object" ? settingsData[DEMO_PROFILE_KEY] : null;
  syncDashboardTheme();
  currentLang = LANGUAGES.languageFor(dashboardSettings); favorites = Array.isArray(settingsData[CONFIG.STORAGE_KEYS.FAVORITES]) ? settingsData[CONFIG.STORAGE_KEYS.FAVORITES] : [];
  favoriteNoteIds = new Set(Array.isArray(settingsData[CONFIG.STORAGE_KEYS.NOTE_FAVORITES]) ? settingsData[CONFIG.STORAGE_KEYS.NOTE_FAVORITES] : []);
  applyTranslations();
  syncBilingualPreview();
  annotations = await loadAnnotationsInBatches();
  invalidateAnnotationCaches();
  annotationById.clear();
  annotationPositionById.clear();
  annotations.forEach((item, index) => { if (item?.id) { annotationById.set(item.id, item); annotationPositionById.set(item.id, index); } });
  render();
  syncLRPracticeFrame();
  if (!overviewSessionsReady) void loadOverviewDictationSessions();
  if ($("dashboardSettingsDialog")?.open) refreshDashboardSettings();
}
async function loadAnnotationsInBatches() {
  const items = [];
  let after = null, batchCount = 0;
  while (true) {
    const result = await LHN_MESSAGING.sendMessage({ type:"GET_BATCH", after, limit:CONFIG.LIMITS.DATABASE_BATCH_SIZE });
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
  invalidateAnnotationCaches();
  if (renderNow) render();
  syncLRPracticeFrame();
  return true;
}
let lrPracticeFrameReady = false;
function syncLRPracticeFrame() {
  const frame = $("dashboardLRPracticeFrame");
  if (!frame?.contentWindow || !lrPracticeFrameReady) return;
  try { frame.contentWindow.postMessage({ type:"KEEPIT_LR_DATA", version:1, language:currentLang, items:annotations, favorites:[...favorites], favoriteNoteIds:[...favoriteNoteIds] }, location.origin); }
  catch (error) { console.warn("Could not sync local annotations to LR practice view", error); }
}
function replyToLRPractice(event, requestId, ok, message = "") {
  if (!event.source || typeof requestId !== "string") return;
  try { event.source.postMessage({ type:"KEEPIT_LR_RESULT", requestId, ok:!!ok, message }, location.origin); }
  catch (error) { console.warn("Could not reply to LR practice action", error); }
}
async function handleLRPracticeAction(event, data) {
  const requestId = typeof data.requestId === "string" ? data.requestId : "";
  const item = typeof data.itemId === "string" ? annotationById.get(data.itemId) || annotations.find(annotation => annotation.id === data.itemId) : null;
  const key = typeof data.pageKey === "string" ? data.pageKey : "";
  try {
    switch (data.action) {
      case "edit-note":
        if (!item) throw new Error("Highlight not found");
        openEditDialog(item); replyToLRPractice(event, requestId, true); return;
      case "delete-note":
        if (!item) throw new Error("Highlight not found");
        if (!confirm(t("deleteAnnotationConfirm"))) { replyToLRPractice(event, requestId, true); return; }
        await LHN_MESSAGING.sendMessage({ type:"DELETE", id:item.id, origin:DASHBOARD_INSTANCE_ID });
        applyAnnotationChange({ type:"delete", id:item.id }); toast(t("deleted"));
        replyToLRPractice(event, requestId, true); return;
      case "toggle-note-favorite": {
        if (!item) throw new Error("Highlight not found");
        const wasFavorite = favoriteNoteIds.has(item.id);
        if (wasFavorite) favoriteNoteIds.delete(item.id); else favoriteNoteIds.add(item.id);
        try { await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.NOTE_FAVORITES]:[...favoriteNoteIds] }); }
        catch (error) { if (wasFavorite) favoriteNoteIds.add(item.id); else favoriteNoteIds.delete(item.id); throw error; }
        render(); syncLRPracticeFrame(); replyToLRPractice(event, requestId, true); return;
      }
      case "toggle-page-favorite": {
        if (!key || !annotations.some(annotation => pageKey(annotation) === key)) throw new Error("Source page not found");
        const wasFavorite = favorites.includes(key);
        favorites = wasFavorite ? favorites.filter(value => value !== key) : [...favorites, key];
        try { await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.FAVORITES]:favorites }); }
        catch (error) { favorites = wasFavorite ? [...favorites, key] : favorites.filter(value => value !== key); throw error; }
        render(); syncLRPracticeFrame(); replyToLRPractice(event, requestId, true); return;
      }
      case "delete-page": {
        if (!key) throw new Error("Source page not found");
        const pageItems = annotations.filter(annotation => pageKey(annotation) === key);
        if (!pageItems.length) throw new Error("Source page not found");
        if (!confirm(t("deletePageConfirm"))) { replyToLRPractice(event, requestId, true); return; }
        const result = await LHN_MESSAGING.sendMessage({ type:"DELETE_PAGE", url:key, origin:DASHBOARD_INSTANCE_ID });
        applyAnnotationChange({ type:"deletePage", url:key });
        try {
          const tabs = await browser.tabs.query({});
          await Promise.all(tabs.filter(tab => tab.id != null).map(tab => browser.tabs.sendMessage(tab.id, { type:"REMOVE_HIGHLIGHT_PAGE", url:key }).catch(() => null)));
        } catch (error) { console.warn("Could not remove visible LR page highlights", error); }
        toast(t("deletePageDone", { count:result?.deletedCount ?? pageItems.length }));
        replyToLRPractice(event, requestId, true); return;
      }
      case "export": {
        const format = ["txt","csv","md","json"].includes(data.format) ? data.format : null;
        if (!format || !["page","all"].includes(data.scope)) throw new Error("Unsupported export request");
        const pageUrl = data.scope === "page" ? key : null;
        if (data.scope === "page" && (!pageUrl || !annotations.some(annotation => pageKey(annotation) === pageUrl))) throw new Error("Source page not found");
        const exportItems = pageUrl ? annotations.filter(annotation => pageKey(annotation) === pageUrl) : annotations;
        if (format === "json") await downloadJsonExport(pageUrl); else downloadExport(format, exportItems);
        replyToLRPractice(event, requestId, true); return;
      }
      case "study": {
        if (!key || !annotations.some(annotation => pageKey(annotation) === key)) throw new Error("Source page not found");
        const previousUrl = selectedUrl; selectedUrl = key;
        try { startStudySession(); } finally { selectedUrl = previousUrl; }
        replyToLRPractice(event, requestId, true); return;
      }
      case "jump-to-highlight": {
        if (!item) throw new Error("Highlight not found");
        const result = await LHN_MESSAGING.sendMessage({ type:"OPEN_HIGHLIGHT", url:item.url, id:item.id });
        replyToLRPractice(event, requestId, !!result?.found, result?.found ? "" : t("highlightNotFound")); return;
      }
      case "speak-highlight":
        if (!item?.quote) throw new Error("Highlight not found");
        speakText(item.quote, detectLanguage(item.quote, item.url));
        replyToLRPractice(event, requestId, true); return;
      default: throw new Error("Unsupported LR practice action");
    }
  } catch (error) {
    console.warn("LR practice action failed", data.action, error);
    syncLRPracticeFrame();
    replyToLRPractice(event, requestId, false);
  }
}
const lrPracticeFrame = $("dashboardLRPracticeFrame");
if (lrPracticeFrame) {
  lrPracticeFrame.addEventListener("load", () => { lrPracticeFrameReady = true; syncLRPracticeFrame(); });
  try { if (lrPracticeFrame.contentDocument?.readyState === "complete") lrPracticeFrameReady = true; } catch { /* same-origin load event will synchronize later */ }
}
window.addEventListener("message", event => {
  if (!lrPracticeFrame || event.source !== lrPracticeFrame.contentWindow || event.origin !== location.origin || !event.data || typeof event.data !== "object") return;
  if (event.data.type === "LR_DEMO_READY") { lrPracticeFrameReady = true; syncLRPracticeFrame(); return; }
  if (event.data.type === "LR_DEMO_ACTION" && event.data.version === 1) void handleLRPracticeAction(event, event.data);
});
const DICTATION_SESSION_INDEX = globalThis.LHN_DICTATION_SESSION_INDEX;
const OVERVIEW_DICTATION_SESSION_INDEX_KEY = DICTATION_SESSION_INDEX.STORAGE_KEY;
let overviewSessionEntries = [];
let overviewSummaryCache = null;
let overviewSummaryCacheRevision = -1;
function invalidateAnnotationCaches() { annotationDataRevision++; }

function overviewSetText(id, value) {
  const node = $(id);
  if (node) node.textContent = String(value ?? "");
}
function overviewFormatCount(value) { return Math.max(0, Number(value) || 0).toLocaleString(currentLang); }
function overviewSetMeter(id, ratio) {
  const node = $(id);
  if (!node) return;
  node.style.width = `${Math.min(100, Math.max(0, Number(ratio) || 0))}%`;
}
function renderOverviewActivityCalendar(model) {
  const heatmap = $("overviewHeatmap"), monthHost = $("overviewMonthLabels");
  if (!heatmap || !monthHost) return;
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 51 * 7);
  const windowActiveDays = new Set(), windowActiveWeeks = new Set(), cells = document.createDocumentFragment();
  const formatter = new Intl.DateTimeFormat(currentLang === "vi" ? "vi-VN" : currentLang === "ko" ? "ko-KR" : "en-US", { month:"short" });
  const months = [];
  const monthCursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  while (monthCursor <= lastMonth) {
    months.push(new Date(monthCursor));
    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }
  for (let index = 0; index < 364; index++) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = globalThis.LHN_DASHBOARD_OVERVIEW_DATA.localDayKey(day.getTime());
    const count = day <= today ? Number(model.dailyCounts.get(key) || 0) : 0;
    if (count > 0) {
      windowActiveDays.add(key);
      windowActiveWeeks.add(globalThis.LHN_DASHBOARD_OVERVIEW_DATA.localWeekKey(day.getTime()));
    }
    const cell = document.createElement("span");
    cell.className = "ov-heat-cell";
    cell.dataset.level = String(Math.min(4, count));
    cell.setAttribute("aria-hidden", "true");
    cell.title = `${formatter.format(day)} ${day.getDate()}, ${day.getFullYear()}: ${t("ovHeatActivityCount", { count })}`;
    cells.appendChild(cell);
  }
  heatmap.replaceChildren(cells);
  monthHost.replaceChildren(...months.map(date => {
    const label = document.createElement("span");
    label.textContent = formatter.format(date);
    return label;
  }));
  monthHost.style.gridTemplateColumns = `repeat(${Math.max(1, months.length)}, minmax(0, 1fr))`;
  overviewSetText("overviewActiveDays", t("ovActiveDays", { count:overviewFormatCount(windowActiveDays.size) }));
  overviewSetText("overviewTotalDays", overviewFormatCount(windowActiveDays.size));
  overviewSetText("overviewTotalWeeks", overviewFormatCount(windowActiveWeeks.size));
}
function renderOverviewTags(model) {
  const host = $("overviewTopTags");
  if (!host) return;
  host.replaceChildren();
  const tags = model.topTags.slice(0, 5);
  if (!tags.length) {
    const empty = document.createElement("div");
    empty.className = "ov-empty";
    empty.textContent = t("ovNoTags");
    host.appendChild(empty);
    return;
  }
  const maxCount = tags[0][1] || 1;
  for (const [name, count] of tags) {
    const row = document.createElement("div");
    row.className = "ov-dist-row";
    const label = document.createElement("span");
    label.className = "ov-dist-label";
    label.textContent = name;
    const track = document.createElement("span");
    track.className = "ov-dist-track";
    const fill = document.createElement("span");
    fill.style.width = `${Math.max(3, Math.round(count / maxCount * 100))}%`;
    track.appendChild(fill);
    const value = document.createElement("span");
    value.className = "ov-dist-count";
    value.textContent = overviewFormatCount(count);
    row.append(label, track, value);
    host.appendChild(row);
  }
}
function renderOverviewRecentItems(model) {
  const host = $("overviewRecentItems");
  if (!host) return;
  host.replaceChildren();
  const items = model.recentItems.slice(0, 4);
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "ov-empty";
    empty.textContent = t("ovNoRecentItems");
    host.appendChild(empty);
    return;
  }
  for (const { item, timestamp } of items) {
    const row = document.createElement("div");
    row.className = "ov-activity";
    const itemText = [item?.note, item?.quote, item?.selectedText, item?.text].find(value => typeof value === "string" && value.trim()) || "";
    const titleText = String(item?.title || item?.hostname || siteOf(item) || t("unknownWebsite"));
    const detailText = itemText.trim().replace(/\s+/g, " ").slice(0, 112) || String(item?.url || "");
    const iconNode = document.createElement("span");
    iconNode.className = "ov-activity-icon";
    iconNode.textContent = item?.note ? "🗒️" : "📚";
    const textWrap = document.createElement("span");
    const title = document.createElement("span");
    title.className = "ov-activity-title";
    title.textContent = titleText;
    const detail = document.createElement("span");
    detail.className = "ov-activity-sub";
    detail.textContent = detailText || t("ovNoNotes");
    textWrap.append(title, detail);
    const when = document.createElement("span");
    when.className = "ov-activity-time";
    when.textContent = fmtDate(timestamp);
    row.append(iconNode, textWrap, when);
    host.appendChild(row);
  }
}
function normalizeOverviewSessionIndex(value) { return DICTATION_SESSION_INDEX.normalizeIndex(value); }
function mergeOverviewSessions(...groups) { return DICTATION_SESSION_INDEX.mergeSessions(...groups); }
function migrateLegacyDictationRecords(storageData, existingSessions) {
  const known = new Set((existingSessions || []).map(session => session.sessionId));
  const titleByVideoId = new Map();
  for (const item of annotations) {
    const id = globalThis.LHN_DASHBOARD_OVERVIEW_DATA.youtubeVideoId(item?.url);
    if (id && !titleByVideoId.has(id) && item?.title) titleByVideoId.set(id, String(item.title));
  }
  const legacy = [];
  for (const [key, record] of Object.entries(storageData || {})) {
    if (!key.startsWith("dictation:")) continue;
    const sourceId = key.slice("dictation:".length);
    const sessionId = `youtube:${sourceId}`;
    if (known.has(sessionId)) continue;
    const session = DICTATION_SESSION_INDEX.fromLegacyYouTubeRecord(sourceId, record, { title:titleByVideoId.get(sourceId) || "" });
    if (session) legacy.push(session);
  }
  return legacy.filter(Boolean);
}
async function loadOverviewDictationSessions() {
  if (overviewSessionsReady || overviewSessionsLoading) return;
  overviewSessionsLoading = true;
  try {
    const saved = await browser.storage.local.get(OVERVIEW_DICTATION_SESSION_INDEX_KEY);
    let index = normalizeOverviewSessionIndex(saved?.[OVERVIEW_DICTATION_SESSION_INDEX_KEY]);
    let sessions = index.sessions;
    if (!index.legacyMigrationComplete) {
      const allData = await browser.storage.local.get(null);
      const latestIndex = normalizeOverviewSessionIndex(allData?.[OVERVIEW_DICTATION_SESSION_INDEX_KEY]);
      sessions = mergeOverviewSessions(latestIndex.sessions, migrateLegacyDictationRecords(allData, latestIndex.sessions));
      const migrated = { version:1, updatedAt:Date.now(), legacyMigrationComplete:true, sessions };
      try {
        const recheck = await browser.storage.local.get(OVERVIEW_DICTATION_SESSION_INDEX_KEY);
        const concurrent = normalizeOverviewSessionIndex(recheck?.[OVERVIEW_DICTATION_SESSION_INDEX_KEY]);
        if (concurrent.sessions.length) migrated.sessions = mergeOverviewSessions(concurrent.sessions, sessions);
        await browser.storage.local.set({ [OVERVIEW_DICTATION_SESSION_INDEX_KEY]:migrated });
      } catch (error) {
        console.warn("Could not persist Dictation session index migration", error);
      }
      index = migrated;
    }
    overviewSessionEntries = mergeOverviewSessions(sessions);
  } catch (error) {
    overviewSessionEntries = [];
    console.warn("Could not load local Dictation session index", error);
  } finally {
    overviewSessionsLoading = false;
    overviewSessionsReady = true;
  }
  renderOverviewDictationSessions();
}
function chooseOverviewDictationSession() {
  const sessions = overviewSessionEntries;
  const datedInProgress = sessions.filter(item => item.updatedAt > 0 && item.status !== "complete").sort((a, b) => b.updatedAt - a.updatedAt);
  if (datedInProgress.length) return datedInProgress[0];
  const dated = sessions.filter(item => item.updatedAt > 0).sort((a, b) => b.updatedAt - a.updatedAt);
  if (dated.length) return dated[0];
  const plausibleLegacy = sessions.filter(item => item.legacy && (item.currentIndex > 0 || item.solvedCount > 0));
  if (plausibleLegacy.length === 1) return plausibleLegacy[0];
  return null;
}
function renderOverviewDictationSessions() {
  const session = chooseOverviewDictationSession();
  const titleNode = $("overviewSessionTitle");
  const detailNode = $("overviewSessionDetail");
  const metaNode = $("overviewSessionMeta");
  const selectedTitle = session?.title || (session?.sourceType === "youtube" ? `${t("ovSourceYoutube")} · ${session.sourceId}` : session?.sourceType === "web" ? t("ovSourceWeb") : "");
  const sourceLabel = session?.sourceType === "youtube" ? "YouTube" : session?.sourceType === "web" ? t("ovSourceWeb") : session?.sourceType || "";
  if (session) {
    const current = session.currentIndex + 1;
    titleNode.textContent = selectedTitle || t("ovNoDictationSession");
    detailNode.textContent = session.totalCount > 0
      ? t("ovSessionPosition", { current:overviewFormatCount(current), total:overviewFormatCount(session.totalCount) })
      : t("ovSessionCurrentSentence", { current:overviewFormatCount(current) });
    const metaParts = [sourceLabel, t("ovSessionSolvedCount", { count:overviewFormatCount(session.solvedCount) }), session.updatedAt ? t("ovSessionSaved", { date:fmtDate(session.updatedAt) }) : t("ovSessionLegacy")];
    metaNode.replaceChildren(...metaParts.map(value => { const span=document.createElement("span"); span.textContent=value; return span; }));
    overviewSetText("overviewModeDictationProgress", session.totalCount > 0 ? `${overviewFormatCount(current)} / ${overviewFormatCount(session.totalCount)}` : overviewFormatCount(current));
    overviewSetText("overviewModeDictationSolved", t("ovSessionSolvedCount", { count:overviewFormatCount(session.solvedCount) }));
    overviewSetText("overviewModeDictationTitle", selectedTitle || session.sourceId);
    overviewSetText("overviewModeDictationSource", sourceLabel);
    const progress = session.totalCount > 0 ? session.solvedCount / session.totalCount : 0;
    overviewSetMeter("overviewDictationMeter", progress * 100);
    const modeTitle = $("overviewModeDictationTitle");
    if (modeTitle) modeTitle.title = selectedTitle || session.sourceId;
  } else {
    const legacyCount = overviewSessionEntries.filter(item => item.legacy).length;
    titleNode.textContent = legacyCount > 1 ? t("ovMultipleLegacySessions", { count:overviewFormatCount(legacyCount) }) : t("ovNoDictationSession");
    detailNode.textContent = legacyCount > 1 ? t("ovLegacySessionHelp") : t("ovNoDictationSession");
    metaNode.replaceChildren();
    overviewSetText("overviewModeDictationProgress", "—");
    overviewSetText("overviewModeDictationSolved", "");
    overviewSetText("overviewModeDictationTitle", t("ovNoSessionMode"));
    overviewSetText("overviewModeDictationSource", "");
    overviewSetMeter("overviewDictationMeter", 0);
  }
}
function renderDashboardOverview() {
  const overview = globalThis.LHN_DASHBOARD_OVERVIEW_DATA;
  if (!overview) return;
  if (overviewSummaryCacheRevision !== annotationDataRevision) {
    overviewSummaryCache = overview.build(annotations, { pageKey, siteOf, tagsOf, reviewTimestamp:lastStudyReviewAt });
    overviewSummaryCacheRevision = annotationDataRevision;
  }
  const model = overviewSummaryCache;
  overviewSetText("overviewPillPages", overviewFormatCount(model.sourcePageCount));
  overviewSetText("overviewPillHighlights", overviewFormatCount(model.highlightCount));
  overviewSetText("overviewPillNotes", overviewFormatCount(model.notesCount));
  overviewSetText("overviewSourcePageCount", overviewFormatCount(model.sourcePageCount));
  overviewSetText("overviewHighlightCount", overviewFormatCount(model.highlightCount));
  overviewSetText("overviewDueCount", overviewFormatCount(model.dueCount));
  overviewSetText("overviewNoteCount", overviewFormatCount(model.notesCount));
  overviewSetText("overviewQuickDue", t("ovDueCardsCount", { count:overviewFormatCount(model.dueCount) }));
  overviewSetText("overviewModeDue", t("ovDueCardsCount", { count:overviewFormatCount(model.dueCount) }));
  overviewSetText("overviewLibraryCardTotal", t("ovSavedAnnotationsCount", { count:overviewFormatCount(model.highlightCount) }));
  overviewSetText("overviewTodayReviewCount", t("ovTodayReviewValue", { count:overviewFormatCount(model.reviewedToday) }));
  overviewSetText("overviewModeReviewedToday", overviewFormatCount(model.reviewedToday));
  overviewSetText("overviewReviewedCards", overviewFormatCount(model.reviewedCardCount));
  overviewSetMeter("overviewTodayReviewMeter", model.highlightCount ? model.reviewedToday / model.highlightCount * 100 : 0);
  overviewSetMeter("overviewFlashcardMeter", model.highlightCount ? model.reviewedToday / model.highlightCount * 100 : 0);
  renderOverviewActivityCalendar(model);
  renderOverviewTags(model);
  renderOverviewRecentItems(model);
  renderOverviewDictationSessions();
}

function render() {
  renderProfileMenu();
  renderDashboardOverview();
}
function renderExportMenus() {
  for (const menuId of ["exportAllMenu", "settingsBackupExportMenu"]) {
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
  const parts = [LHN_BACKUP.createJsonHeader(exportedAt)];
  const pageKeys = new Set(), exportedFavoriteNoteIds = []; let after = null, first = true;
  do {
    const batch = await LHN_MESSAGING.sendMessage({ type:"GET_BATCH", after, limit:CONFIG.LIMITS.DATABASE_BATCH_SIZE, url:pageUrl });
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
  parts.push(LHN_BACKUP.createJsonFooter(exportedFavorites, exportedFavoriteNoteIds));
  const blob = new Blob(parts, { type:"application/json" }), blobUrl = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = blobUrl; anchor.download = `highlight-notes-${stamp}.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(blobUrl), 1200); toast(t("exportStarted"));
}
function closeMenus() {
  $("exportAllMenu").hidden = true; $("settingsBackupExportMenu").hidden = true; $("profileMenu").hidden = true;
  $("profileMenuToggle").setAttribute("aria-expanded", "false"); $("exportAllBtn").setAttribute("aria-expanded", "false");
  $("settingsExportButton").setAttribute("aria-expanded", "false");
}
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
    const saved = await LHN_MESSAGING.sendMessage({ type:"UPDATE", item:updated, origin:DASHBOARD_INSTANCE_ID });
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
  const displayLanguage = LANGUAGES.languageFor(speechSettings);
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
    const saved = await LHN_MESSAGING.sendMessage({ type: "UPDATE", item: { ...item, note, contextNote, color: editColor, tags }, origin: DASHBOARD_INSTANCE_ID });
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
function startStudySession({ allSources = false } = {}) {
  stopStudySpeech();
  studySourceKey = allSources ? null : selectedUrl; studyPlayAllSources = allSources || studyPreferences.alwaysPlayAll; studyAutoSpeak = studyPreferences.alwaysAutoSpeak; studyFocusMode = studyPreferences.alwaysFocusMode; studyCompletedIds.clear();
  const deck = getStudyCandidates({ sourceKey: studyPlayAllSources ? null : studySourceKey });
  setStudyQueue(deck); studyHistory = []; studyReviewed = 0; studyRemembered = 0; syncStudyScopeButton(); updateStudyAutoSpeakButton(); updateStudyFocusButton();
  studyTypedAnswerForId = null; studyTypedAnswer = "";
  $("studyCard").hidden = false; $("studyComplete").hidden = true; $("studyDialog").showModal(); renderStudyCard({ showAnswer:false }); focusStudyPrimaryAction();
}
function getStudyCandidates({ sourceKey = null } = {}) {
  const now = Date.now();
  return annotations.filter(item => {
    const dueAt = Number(item.review?.dueAt) || 0;
    return !studyCompletedIds.has(item.id) && (!dueAt || dueAt <= now) && (!sourceKey || pageKey(item) === sourceKey);
  });
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
    const result = await LHN_MESSAGING.sendMessage({ type: "REVIEW_ANNOTATION", id: current.id, review, origin:DASHBOARD_INSTANCE_ID });
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
  invalidateAnnotationCaches();
  renderDashboardOverview();
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
    savedCard = await LHN_MESSAGING.sendMessage({ type: "UPDATE", item: restored, origin:DASHBOARD_INSTANCE_ID });
    if (!savedCard?.id) throw new Error("Could not restore previous card");
  } catch (error) { toast(t("studySaveFailed")); return; }
  studyHistory.pop();
  const existingIndex = annotationPositionById.get(savedCard.id);
  if (Number.isInteger(existingIndex)) annotations[existingIndex] = savedCard;
  else { annotationPositionById.set(savedCard.id, annotations.length); annotations.push(savedCard); }
  annotationById.set(savedCard.id, savedCard);
  invalidateAnnotationCaches();
  renderDashboardOverview();
  setStudyQueue(studyQueueItems().filter(item => item.id !== savedCard.id));
  returnStudyCardToFront(savedCard);
  if (previous.grade !== "again") studyRemembered = Math.max(0, studyRemembered - 1);
  studyReviewed = Math.max(0, studyReviewed - 1);
  studyCompletedIds.delete(savedCard.id);
  renderStudyCard({ autoSpeak: studyAutoSpeak });
  focusStudyPrimaryAction();
}
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
    const result = await LHN_MESSAGING.sendMessage({ type: "RESET_STUDY_PROGRESS", ids, origin:DASHBOARD_INSTANCE_ID });
    if (!result?.updated) throw new Error("Could not reset study progress");
    const idSet = new Set(ids);
    annotations.forEach(item => { if (idSet.has(item.id)) delete item.review; });
    invalidateAnnotationCaches();
    renderDashboardOverview();
    studyCompletedIds.clear(); studyHistory = [];
    setStudyQueue(getStudyCandidates({ sourceKey: studyPlayAllSources ? null : studySourceKey }));
    studyReviewed = 0; studyRemembered = 0;
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
    const result = await LHN_MESSAGING.sendMessage({ type: "OPEN_HIGHLIGHT", url: item.url, id: item.id });
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
$("exportAllBtn").addEventListener("click", e => { e.stopPropagation(); const menu = $("exportAllMenu"), open = menu.hidden; closeMenus(); $("profileMenu").hidden = false; $("profileMenuToggle").setAttribute("aria-expanded", "true"); menu.hidden = !open; $("exportAllBtn").setAttribute("aria-expanded", String(open)); });
document.addEventListener("click", e => { const option = e.target.closest("button[data-export]"); if (option) { const format = option.dataset.export; if (format === "json") downloadJsonExport().catch(error => { console.error("JSON export failed", error); alert(error.message || "JSON export failed"); }); else downloadExport(format, annotations); closeMenus(); return; } if (!e.target.closest(".menu-wrap, .profile-menu-wrap, .settings-backup-export-wrap")) closeMenus(); });
const dashboardSidebar = $("dashboardSidebar"), dashboardSidebarPin = $("dashboardSidebarPin");
function togglePin() {
  const pinned = !dashboardSidebar.classList.contains("sidebar-pinned");
  dashboardSidebar.classList.toggle("sidebar-pinned", pinned);
  document.body.classList.toggle("dashboard-sidebar-pinned", pinned);
  dashboardSidebarPin.setAttribute("aria-pressed", String(pinned));
  dashboardSidebarPin.setAttribute("aria-expanded", String(pinned));
  const label = pinned ? "Bỏ ghim thanh bên" : "Ghim thanh bên";
  dashboardSidebarPin.title = label;
  dashboardSidebarPin.setAttribute("aria-label", label);
}
dashboardSidebarPin.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); togglePin(); });
const dashboardOverviewView = $("dashboardOverviewView"), dashboardListeningView = $("dashboardListeningView"), dashboardLRPracticeView = $("dashboardLRPracticeView");
function setDashboardView(view) {
  if (!["overview", "listening", "lr-practice"].includes(view)) view = "overview";
  const showOverview = view === "overview", showListening = view === "listening", showLRPractice = view === "lr-practice";
  dashboardOverviewView.hidden = !showOverview;
  dashboardListeningView.hidden = !showListening;
  dashboardLRPracticeView.hidden = !showLRPractice;
  document.body.classList.toggle("dashboard-overview-active", showOverview);
  dashboardSidebar.querySelectorAll("[data-dashboard-view]").forEach(link => {
    const active = link.dataset.dashboardView === view;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
}
dashboardSidebar.querySelectorAll("[data-dashboard-view]").forEach(link => link.addEventListener("click", event => { event.preventDefault(); setDashboardView(link.dataset.dashboardView); }));
document.querySelector('[data-dashboard-action="highlights-notes"]')?.addEventListener("click", event => { event.preventDefault(); setDashboardView("lr-practice"); });
dashboardSidebar.querySelector('[data-dashboard-action="flashcards"]')?.addEventListener("click", event => {
  event.preventDefault();
  startStudySession({ allSources:true });
});
setDashboardView("overview");
$("profileMenuToggle").addEventListener("click", e => { e.stopPropagation(); const open = $("profileMenu").hidden; closeMenus(); $("profileMenu").hidden = !open; $("profileMenuToggle").setAttribute("aria-expanded", String(open)); });
$("profileMenu").addEventListener("click", async event => {
  const action = event.target.closest("[data-profile-menu-action]")?.dataset.profileMenuAction;
  if (!action) return;
  event.preventDefault();
  if (action === "account") openDashboardSettings("account");
  else if (action === "settings") openDashboardSettings(lastDashboardSettingsTab);
  else if (action === "appearance") openDashboardSettings("appearance");
  else if (action === "shortcuts") openDashboardSettings("shortcuts");
  else if (action === "login") { closeMenus(); openProfileAuth("login"); }
  else if (action === "logout") await signOutDemoProfile();
});
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
    await LHN_ACCOUNT.saveProfile(browser, demoProfile);
    delete field.dataset.editing; refreshDashboardSettings(); renderProfileMenu(); toast(t("settingsSaved")); return;
  }
  if (event.target.closest("#settingsAccountSaveName")) {
    const displayName = $("settingsAccountState").querySelector("#settingsAccountDisplayName").value.trim();
    if (!demoProfile || !displayName) return;
    demoProfile = { ...demoProfile, displayName };
    await LHN_ACCOUNT.saveProfile(browser, demoProfile);
    renderProfileMenu(); refreshDashboardSettings(); toast(t("settingsSaved")); return;
  }
  if (event.target.closest("#settingsAccountSaveUsername")) {
    const username = $("settingsAccountState").querySelector("#settingsAccountUsername").value.trim().replace(/^@+/, "");
    if (!demoProfile || !username) return;
    demoProfile = { ...demoProfile, username };
    await LHN_ACCOUNT.saveProfile(browser, demoProfile);
    renderProfileMenu(); refreshDashboardSettings(); toast(t("settingsSaved")); return;
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
    await LHN_ACCOUNT.saveProfile(browser, demoProfile);
    renderProfileMenu(); refreshDashboardSettings(); toast(t("settingsSaved"));
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
    const result = await LHN_MESSAGING.sendMessage({ type:"USAGE_ACTIVATE_KEY", key:$("usageKeyInput").value });
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
  applyTranslations(); render(); refreshDashboardSettings(); syncBilingualPreview();
  try { await LHN_SETTINGS.save(dashboardSettings); }
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
function normalizeLanguageSpeechRate(value) { const rate = Number(value); return Number.isFinite(rate) ? Math.round(Math.min(3, Math.max(.5, rate)) * 20) / 20 : 1.25; }
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
    const inheritedSpeechRateByLanguage = Object.fromEntries(LANGUAGES.LANGS.map(language => [language.code, inheritedRate]));
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
  LHN_MESSAGING.sendMessage({ type:"BILINGUAL_TRANSLATE", text:sourceText, targetLang }).then(result => {
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
$("bilingualClearCache").addEventListener("click", async () => { await LHN_MESSAGING.sendMessage({ type:"BILINGUAL_CLEAR_CACHE" }); toast(t("bilingualCacheCleared")); });
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
    const value = LHN_SHORTCUTS.fromEvent(event); isCapturing = false;
    await saveDashboardSettings({ [settingKey]:value }); field.blur();
  });
}
setupDashboardShortcut("settingsShortcut", "shortcut");
setupDashboardShortcut("settingsSidebarShortcut", "sidebarShortcut");
setupDashboardShortcut("settingsTranslateShortcut", "translateSelectedShortcut");
setupDashboardShortcut("settingsWebsiteShortcut", "toggleWebsiteShortcut");
setupDashboardShortcut("settingsDualSubtitlesShortcut", "dualSubtitlesShortcut");
setupDashboardShortcut("settingsDictationShortcut", "dictationShortcut");
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
  dualSubtitlesShortcut:CONFIG.DEFAULT_SETTINGS.dualSubtitlesShortcut,
  dictationShortcut:CONFIG.DEFAULT_SETTINGS.dictationShortcut,
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
    const parsed = JSON.parse(await file.text()), payload = LHN_BACKUP.parseImportPayload(parsed);
    if (!payload) throw new Error(t("invalidImport"));
    const items = payload.items;
    const result = await LHN_MESSAGING.sendMessage({ type:"IMPORT", items, origin:DASHBOARD_INSTANCE_ID });
    if (!payload.isLegacyArray && Array.isArray(payload.favorites)) {
      favorites = [...new Set([...favorites, ...payload.favorites.filter(value => typeof value === "string")])];
      await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.FAVORITES]:favorites });
    }
    if (!payload.isLegacyArray && Array.isArray(payload.favoriteNoteIds)) {
      favoriteNoteIds = new Set([...favoriteNoteIds, ...payload.favoriteNoteIds.filter(value => typeof value === "string")]);
      await browser.storage.local.set({ [CONFIG.STORAGE_KEYS.NOTE_FAVORITES]:[...favoriteNoteIds] });
    }
    await load(); toast(t("importedCount", { count:result.imported })); closeMenus();
  } catch (error) { alert(t("importFailed", { error:error.message })); }
  e.target.value = "";
});
async function toggleDashboardTheme() {
  const previous = dashboardSettings, wasDark = document.documentElement.classList.contains("dark");
  dashboardSettings = { ...dashboardSettings, sidebarTheme:wasDark ? "light" : "dark" };
  syncDashboardTheme();
  try { await LHN_SETTINGS.save(dashboardSettings); }
  catch (error) { dashboardSettings = previous; syncDashboardTheme(); console.warn("Could not save dashboard theme", error); }
}
$("dashboardSidebarThemeToggle").addEventListener("click", toggleDashboardTheme);
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.lhnUsageLimitState && $("dashboardSettingsDialog")?.open) refreshUsageLimitSettings();
  if (changes[CONFIG.STORAGE_KEYS.SETTINGS]) {
    const previousLanguage = currentLang;
    dashboardSettings = changes[CONFIG.STORAGE_KEYS.SETTINGS].newValue || {};
    currentLang = LANGUAGES.languageFor(dashboardSettings);
    syncDashboardTheme();
    if (currentLang !== previousLanguage) { applyTranslations(); render(); syncBilingualPreview(); }
    else refreshDashboardSettings();
    syncLRPracticeFrame();
  }
  if (changes[CONFIG.STORAGE_KEYS.FAVORITES]) {
    favorites = Array.isArray(changes[CONFIG.STORAGE_KEYS.FAVORITES].newValue) ? changes[CONFIG.STORAGE_KEYS.FAVORITES].newValue : [];
    render();
    syncLRPracticeFrame();
  }
  if (changes[STUDY_TRANSLATION_SETTINGS_KEY]) {
    const saved = changes[STUDY_TRANSLATION_SETTINGS_KEY].newValue || {};
    studyTranslationSettings = { ...DEFAULT_STUDY_TRANSLATION_SETTINGS, ...saved };
    if (!['auto', 'en', 'vi', 'ko'].includes(studyTranslationSettings.sourceLanguage)) studyTranslationSettings.sourceLanguage = DEFAULT_STUDY_TRANSLATION_SETTINGS.sourceLanguage;
    if (!['auto', 'same', 'en', 'vi', 'ko'].includes(studyTranslationSettings.targetLanguage)) studyTranslationSettings.targetLanguage = DEFAULT_STUDY_TRANSLATION_SETTINGS.targetLanguage;
    populateStudyLanguageSelects();
    refreshFlashcardTranslateSettingsUI();
    syncBilingualPreview();
    if ($('dashboardSettingsDialog')?.open) refreshDashboardSettings();
  }
  if (changes[CONFIG.STORAGE_KEYS.NOTE_FAVORITES]) {
    favoriteNoteIds = new Set(Array.isArray(changes[CONFIG.STORAGE_KEYS.NOTE_FAVORITES].newValue) ? changes[CONFIG.STORAGE_KEYS.NOTE_FAVORITES].newValue : []);
    render();
    syncLRPracticeFrame();
  }
  if (changes[OVERVIEW_DICTATION_SESSION_INDEX_KEY]) {
    const index = normalizeOverviewSessionIndex(changes[OVERVIEW_DICTATION_SESSION_INDEX_KEY].newValue);
    overviewSessionEntries = mergeOverviewSessions(index.sessions);
    overviewSessionsReady = true;
    renderOverviewDictationSessions();
  }
  if (changes[CONFIG.STORAGE_KEYS.ANNOTATIONS]) {
    if ($("studyDialog").open) { annotationsChangedDuringStudy = true; return; }
    load();
  }
});
LHN_MESSAGING.onMessage.addListener(message => {
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
  initListeningPreview();
  if (new URLSearchParams(location.search).get("openSettings") === "1") { const params = new URLSearchParams(location.search); openDashboardSettings(params.get("openSettingsTab") || "account"); if (params.get("openAccount") === "1" && !demoProfile) openProfileAuth(); }
});

