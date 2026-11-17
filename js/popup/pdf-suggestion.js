const $ = id => document.getElementById(id);
const LANGUAGES = globalThis.LHN_LANGUAGES;
let currentLang = "en";
const sourceTabId = Number(new URL(location.href).searchParams.get("sourceTabId"));
function isPdfSource(value, depth = 0) {
  try {
    const url = new URL(value);
    if (["http:", "https:", "file:"].includes(url.protocol) && /\.pdf$/i.test(decodeURIComponent(url.pathname))) return true;
    if (depth >= 2 || !["chrome-extension:", "moz-extension:", "chrome:"].includes(url.protocol)) return false;
    return ["src", "file", "url", "originalUrl"].some(key => { const nested = url.searchParams.get(key); return !!nested && isPdfSource(nested, depth + 1); });
  } catch { return false; }
}
async function initializeHint() {
  try {
    const data = await browser.storage.local.get("lhnSettings"), settings = data.lhnSettings || {};
    currentLang = LANGUAGES.languageFor(settings);
    const lang = currentLang;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = LANGUAGES.t(el.dataset.i18n, {}, lang); });
    document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = LANGUAGES.t(el.dataset.i18nTitle, {}, lang); });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(el => { el.setAttribute("aria-label", LANGUAGES.t(el.dataset.i18nAriaLabel, {}, lang)); });
    const dark = settings.sidebarTheme === "dark" || (settings.sidebarTheme !== "light" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (error) { console.warn("Could not localize the PDF suggestion", error); }
}
$("closeHint").addEventListener("click", () => window.close());
$("openDocuments").addEventListener("click", async event => {
  const button = event.currentTarget; button.disabled = true;
  try { await browser.runtime.sendMessage({ type:"OPEN_DASHBOARD_DOCUMENTS", ...(Number.isInteger(sourceTabId) && sourceTabId >= 0 ? { sourceTabId } : {}) }); window.close(); }
  catch (error) { console.warn("Could not open Keepit Documents", error); $("status").textContent = LANGUAGES.t("pdfFloatingError", {}, currentLang); button.disabled = false; }
});
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === sourceTabId && !isPdfSource(changeInfo.url || tab?.url || "")) window.close();
});
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (tabId === sourceTabId) return;
  try {
    const tab = await browser.tabs.get(tabId), hintUrl = browser.runtime.getURL("pages/pdf-suggestion.html");
    if (tab.url?.split(/[?#]/, 1)[0] !== hintUrl) window.close();
  } catch { window.close(); }
});
setTimeout(() => window.close(), 18000);
void initializeHint();
