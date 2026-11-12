const $ = id => document.getElementById(id);
const LANGUAGES = globalThis.LHN_LANGUAGES;
const CONFIG = globalThis.LHN_CONFIG;
CONFIG.applyHighlightColors();
const DEFAULTS = CONFIG.DEFAULT_SETTINGS;
let settings = { ...DEFAULTS }, capturing = false, currentLang = "en", langOpen = false, currentWebsite = "";
const langLabel = item => `${item.flag} ${item.name} - ${item.native}`;
function t(key, vars = {}) { return LANGUAGES.t(key, vars, currentLang); }
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
function applyPopupTheme() {
  const dark = settings.sidebarTheme === "dark" || (settings.sidebarTheme !== "light" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  const button = $("themeToggle");
  if (!button) return;
  const label = t(dark ? "sidebarSwitchToLight" : "sidebarSwitchToDark");
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", String(dark));
}
function syncWebsiteActiveStatus() {
  const status = $("extensionStatus");
  if (!status) return;
  const active = !!currentWebsite && !(settings.disabledWebsites || []).includes(currentWebsite);
  status.classList.toggle("is-active", active);
  status.classList.toggle("is-inactive", !active);
  status.querySelector("span").textContent = t(active ? "extensionActive" : "extensionInactive");
  status.setAttribute("aria-label", t(active ? "extensionActive" : "extensionInactive"));
}
function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel)); });
  $("defaultHighlightColors").setAttribute("aria-label", t("defaultHighlightColorLabel"));
  document.querySelectorAll(".shortcut").forEach(field => { field.title = t("shortcutInputHint"); });
  applyPopupTheme();
  syncWebsiteActiveStatus();
  syncTranslationModeAvailability();
}
async function load() {
  $("versionLabel").textContent = "v" + browser.runtime.getManifest().version;
  const data = await browser.storage.local.get(CONFIG.STORAGE_KEYS.SETTINGS);
  const storedSettings = data[CONFIG.STORAGE_KEYS.SETTINGS] || {};
  settings = globalThis.LHN_SETTINGS.resolve(storedSettings);
  settings.autoSpeakSelectedText = settings.autoSpeakSelectedText === true || settings.autoSpeakOnTranslate === true;
  settings.autoSpeakOnTranslate = settings.autoSpeakSelectedText;
  if (settings.showOnSelect) { settings.translateIconEnabled = false; settings.translationPopupEnabled = false; }
  else if (settings.translateIconEnabled) settings.translationPopupEnabled = false;
  if (["autoSpeakSelectedText", "autoSpeakOnTranslate", "translateIconEnabled", "translationPopupEnabled"].some(key => storedSettings[key] !== settings[key])) await saveSettings();
  if (!["light", "dark", "system"].includes(settings.sidebarTheme)) settings.sidebarTheme = "system";
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  try {
    const activeUrl = new URL(activeTab?.url || "");
    if (activeUrl.protocol === "http:" || activeUrl.protocol === "https:") currentWebsite = activeUrl.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch { currentWebsite = ""; }
  currentLang = LANGUAGES.languageFor(settings);
  if (!settings.language) { settings.language = currentLang; await globalThis.LHN_SETTINGS.save(settings); }
  $("showOnSelect").checked = settings.showOnSelect;
  $("autoHighlight").checked = settings.autoHighlight === true;
  $("sentenceNoteEnabled").checked = settings.sentenceNoteEnabled !== false;
  $("autoTranslate").checked = settings.autoTranslate !== false;
  $("autoSpeakSelectedText").checked = settings.autoSpeakSelectedText === true;
  $("translateIconEnabled").checked = settings.translateIconEnabled === true;
  $("translationPopupEnabled").checked = settings.translationPopupEnabled === true;
  syncTranslationModeAvailability();
  settings.disabledWebsites = Array.isArray(settings.disabledWebsites) ? settings.disabledWebsites : [];
  $("disableWebsite").checked = currentWebsite ? !settings.disabledWebsites.includes(currentWebsite) : false;
  $("disableWebsite").disabled = !currentWebsite;
  $("websiteDisableRow").classList.toggle("is-unavailable", !currentWebsite);
  setDisabledTooltip($("disableWebsite"), $("websiteDisableRow"), !currentWebsite ? t("disabledWebsitePage") : "");
  settings.defaultHighlightColor = CONFIG.normalizeColor(settings.defaultHighlightColor);
  renderDefaultColors();
  $("shortcut").value = settings.shortcut;
  $("sidebarShortcut").value = settings.sidebarShortcut;
  $("translateSelectedShortcut").value = settings.translateSelectedShortcut;
  $("toggleWebsiteShortcut").value = settings.toggleWebsiteShortcut;
  applyTranslations(); renderLanguages();
  const selectedLanguage = LANGUAGES.LANGS.find(item => item.code === currentLang); if (selectedLanguage) $("languageSearch").value = langLabel(selectedLanguage);
}
async function saveSettings() {
  await globalThis.LHN_SETTINGS.save(settings);
}
function syncTranslationModeAvailability() {
  const autoOpen = $("showOnSelect").checked;
  const autoOpenOption = $("showOnSelect");
  const iconOption = $("translateIconEnabled");
  const popupOption = $("translationPopupEnabled");
  const iconEnabled = iconOption.checked;
  const popupEnabled = popupOption.checked;
  autoOpenOption.disabled = iconEnabled || popupEnabled;
  iconOption.disabled = autoOpen || popupEnabled;
  popupOption.disabled = autoOpen || iconEnabled;
  const autoOpenRow = autoOpenOption.closest(".toggle-row");
  const iconRow = iconOption.closest(".toggle-row");
  const popupRow = popupOption.closest(".toggle-row");
  autoOpenRow?.classList.toggle("is-unavailable", autoOpenOption.disabled);
  iconRow?.classList.toggle("is-unavailable", iconOption.disabled);
  popupRow?.classList.toggle("is-unavailable", popupOption.disabled);
  const explain = (disabled, keys) => disabled ? t("disabledConflictSettings", { settings: keys.map(key => t(key)).join(currentLang === "vi" ? " và " : currentLang === "ko" ? " 및 " : " and ") }) : "";
  setDisabledTooltip(autoOpenOption, autoOpenRow, explain(autoOpenOption.disabled, [iconEnabled && "showKeepitIcon", popupEnabled && "showDirectTranslationPopup"].filter(Boolean)));
  setDisabledTooltip(iconOption, iconRow, explain(iconOption.disabled, [autoOpen && "autoPopup", popupEnabled && "showDirectTranslationPopup"].filter(Boolean)));
  setDisabledTooltip(popupOption, popupRow, explain(popupOption.disabled, [autoOpen && "autoPopup", iconEnabled && "showKeepitIcon"].filter(Boolean)));
}
function renderDefaultColors() {
  document.querySelectorAll(".default-color").forEach(button => {
    const chosen = button.dataset.color === CONFIG.normalizeColor(settings.defaultHighlightColor);
    button.style.backgroundColor = CONFIG.HIGHLIGHT_COLORS[button.dataset.color];
    button.setAttribute("aria-pressed", String(chosen));
  });
}
function renderLanguages(filter = "") {
  const options = $("languageOptions"); options.replaceChildren();
  const query = filter.trim().toLocaleLowerCase();
  const filtered = LANGUAGES.LANGS.filter(item => `${item.name} ${item.native} ${item.code}`.toLocaleLowerCase().includes(query));
  if (!filtered.length) { const empty = document.createElement("div"); empty.className = "language-empty"; empty.textContent = t("languageSearchNoResults"); options.appendChild(empty); return; }
  filtered.forEach(item => {
    const option = document.createElement("div"); option.className = "language-option" + (item.code === currentLang ? " selected" : ""); option.role = "option"; option.tabIndex = 0; option.setAttribute("aria-selected", String(item.code === currentLang)); option.textContent = langLabel(item);
    const choose = async () => { currentLang = item.code; settings.language = item.code; $("languageSearch").value = langLabel(item); langOpen = false; options.classList.remove("open"); $("languageSearch").setAttribute("aria-expanded", "false"); applyTranslations(); renderLanguages(); await saveSettings(); };
    option.addEventListener("click", choose); option.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } }); options.appendChild(option);
  });
}
$("languageSearch").addEventListener("focus", () => { langOpen = true; $("languageSearch").value = ""; renderLanguages(); $("languageOptions").classList.add("open"); $("languageSearch").setAttribute("aria-expanded", "true"); });
$("languageSearch").addEventListener("input", e => { langOpen = true; renderLanguages(e.target.value); $("languageOptions").classList.add("open"); $("languageSearch").setAttribute("aria-expanded", "true"); });
$("languageSearch").addEventListener("keydown", e => { if (e.key === "Escape") { langOpen = false; $("languageOptions").classList.remove("open"); $("languageSearch").setAttribute("aria-expanded", "false"); const selected = LANGUAGES.LANGS.find(x => x.code === currentLang); $("languageSearch").value = langLabel(selected); } if (e.key === "ArrowDown") $("languageOptions").querySelector(".language-option")?.focus(); });
document.addEventListener("mousedown", e => { if (!e.target.closest(".language-wrap")) { langOpen = false; $("languageOptions").classList.remove("open"); $("languageSearch").setAttribute("aria-expanded", "false"); const selected = LANGUAGES.LANGS.find(x => x.code === currentLang); if (selected) $("languageSearch").value = langLabel(selected); } });
$("dashboard").addEventListener("click", async () => {
  try { await LHN_MESSAGING.sendMessage({ type: "OPEN_DASHBOARD" }); window.close(); }
  catch (error) { console.warn("Could not open dashboard", error); $("status").textContent = t("pageRestricted"); }
});
$("openDashboardSettings").addEventListener("click", async () => {
  try { await LHN_MESSAGING.sendMessage({ type: "OPEN_DASHBOARD_SETTINGS" }); window.close(); }
  catch (error) { console.warn("Could not open dashboard settings", error); $("status").textContent = t("pageRestricted"); }
});
$("restore").addEventListener("click", async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true }); if (!tab?.id) return;
  try { await browser.tabs.sendMessage(tab.id, { type: "RESTORE_HIGHLIGHTS" }); window.close(); }
  catch { $("status").textContent = t("pageRestricted"); }
});
$("openSidebar").addEventListener("click", async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true }); if (!tab?.id) return;
  try { await browser.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" }); window.close(); }
  catch { $("status").textContent = t("pageRestricted"); }
});
$("showOnSelect").addEventListener("change", async e => { settings.showOnSelect = e.target.checked; if (settings.showOnSelect) { settings.translateIconEnabled = false; settings.translationPopupEnabled = false; $("translateIconEnabled").checked = false; $("translationPopupEnabled").checked = false; } syncTranslationModeAvailability(); await saveSettings(); });
$("autoHighlight").addEventListener("change", async e => { settings.autoHighlight = e.target.checked; await saveSettings(); });
$("sentenceNoteEnabled").addEventListener("change", async e => { settings.sentenceNoteEnabled = e.target.checked; await saveSettings(); });
$("autoTranslate").addEventListener("change", async e => { settings.autoTranslate = e.target.checked; await saveSettings(); });
$("autoSpeakSelectedText").addEventListener("change", async e => { settings.autoSpeakSelectedText = e.target.checked; settings.autoSpeakOnTranslate = e.target.checked; await saveSettings(); });
$("translateIconEnabled").addEventListener("change", async e => { settings.translateIconEnabled = e.target.checked; if (settings.translateIconEnabled) { settings.showOnSelect = false; settings.translationPopupEnabled = false; $("showOnSelect").checked = false; $("translationPopupEnabled").checked = false; } syncTranslationModeAvailability(); await saveSettings(); });
$("translationPopupEnabled").addEventListener("change", async e => { settings.translationPopupEnabled = e.target.checked; if (settings.translationPopupEnabled) { settings.showOnSelect = false; settings.translateIconEnabled = false; $("showOnSelect").checked = false; $("translateIconEnabled").checked = false; } syncTranslationModeAvailability(); await saveSettings(); });
$("disableWebsite").addEventListener("change", async e => {
  if (!currentWebsite) { e.target.checked = false; return; }
  const disabledWebsites = new Set(settings.disabledWebsites || []);
  if (e.target.checked) disabledWebsites.delete(currentWebsite); else disabledWebsites.add(currentWebsite);
  settings.disabledWebsites = [...disabledWebsites];
  syncWebsiteActiveStatus();
  await saveSettings();
});
$("themeToggle").addEventListener("click", async () => {
  const previousTheme = settings.sidebarTheme;
  const isDark = document.documentElement.classList.contains("dark");
  settings.sidebarTheme = isDark ? "light" : "dark";
  applyPopupTheme();
  try { await globalThis.LHN_SETTINGS.save(settings); }
  catch (error) { settings.sidebarTheme = previousTheme; applyPopupTheme(); console.warn("Could not save popup theme", error); }
});
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
  if (settings.sidebarTheme !== "dark" && settings.sidebarTheme !== "light") applyPopupTheme();
});
document.querySelectorAll(".default-color").forEach(button => button.addEventListener("click", async () => { settings.defaultHighlightColor = CONFIG.normalizeColor(button.dataset.color); renderDefaultColors(); await saveSettings(); }));
function setupShortcutField(id, key) {
  $(id).addEventListener("focus", () => { capturing = id; $(id).value = t("shortcutCapture"); });
  $(id).addEventListener("keydown", async e => {
    if (capturing !== id) return; e.preventDefault(); e.stopPropagation();
    if (e.key === "Backspace") { settings[key] = ""; $(id).value = ""; capturing = false; await saveSettings(); return; }
    if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
    const parts = []; if (e.ctrlKey) parts.push("Ctrl"); if (e.altKey) parts.push("Alt"); if (e.shiftKey) parts.push("Shift"); if (e.metaKey) parts.push("Meta");
    if (e.key.length === 1) parts.push(e.key.toUpperCase()); else if (!["Escape", "Tab", "Enter", " "].includes(e.key)) parts.push(e.key);
    if (parts.length < 2 || (parts[parts.length - 1].length === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey)) { $("status").textContent = t("useModifier"); return; }
    settings[key] = parts.join("+"); $(id).value = settings[key]; capturing = false; await saveSettings();
  });
  $(id).addEventListener("blur", () => { if (capturing === id) $(id).value = settings[key] ?? DEFAULTS[key]; capturing = false; });
}
setupShortcutField("shortcut", "shortcut"); setupShortcutField("sidebarShortcut", "sidebarShortcut"); setupShortcutField("translateSelectedShortcut", "translateSelectedShortcut"); setupShortcutField("toggleWebsiteShortcut", "toggleWebsiteShortcut");
load();
