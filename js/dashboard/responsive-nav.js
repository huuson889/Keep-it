// Responsive navigation for the Dashboard (phone < 600px, tablet portrait 600–899px).
// UI only: every action clicks an existing Dashboard control, so view switching, settings and study keep
// their own logic. No storage or messaging here. Layout lives in css/dashboard/responsive.css.
(() => {
  "use strict";
  const PHONE = matchMedia("(max-width: 599.98px)");
  const RAIL = matchMedia("(min-width: 600px) and (max-width: 899.98px)");
  const TEXT = {
    en:{ overview:"Overview", review:"Review", notes:"Notes", dictation:"Dictation", more:"More", settings:"Settings", account:"Account", soon:"Coming soon", soonToast:"Coming soon", back:"Back", close:"Close", gAccount:"Account", gRead:"Translate & Read", gView:"Display", gData:"Data" },
    vi:{ overview:"Tổng quan", review:"Ôn tập", notes:"Ghi chú", dictation:"Chính tả", more:"Thêm", settings:"Cài đặt", account:"Tài khoản", soon:"Sắp có", soonToast:"Tính năng sắp có", back:"Quay lại", close:"Đóng", gAccount:"Tài khoản", gRead:"Dịch & Đọc", gView:"Hiển thị", gData:"Dữ liệu" },
    ko:{ overview:"개요", review:"복습", notes:"노트", dictation:"받아쓰기", more:"더보기", settings:"설정", account:"계정", soon:"출시 예정", soonToast:"출시 예정 기능", back:"뒤로", close:"닫기", gAccount:"계정", gRead:"번역 및 읽기", gView:"표시", gData:"데이터" }
  };
  const lang = () => { const value = String(document.documentElement.lang || "vi").slice(0, 2).toLowerCase(); return TEXT[value] ? value : "en"; };
  const tr = key => TEXT[lang()][key] || TEXT.en[key] || key;
  const SVG = {
    more:'<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
    back:'<path d="m15 18-6-6 6-6"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  };
  const svg = (inner, viewBox = "0 0 24 24") => `<svg viewBox="${viewBox}" aria-hidden="true">${inner}</svg>`;
  const sidebar = document.getElementById("dashboardSidebar");
  const scroller = document.getElementById("dashboardScroller");
  if (!sidebar || !scroller) return;
  const navItem = selector => sidebar.querySelector(selector);
  const iconOf = selector => navItem(selector)?.querySelector(".reference-nav-icon svg")?.outerHTML || "";
  const click = element => element?.dispatchEvent(new MouseEvent("click", { bubbles:true, cancelable:true, view:window }));
  const TABS = [
    { id:"overview", sel:'[data-dashboard-view="overview"]' },
    { id:"review", sel:'[data-dashboard-action="flashcards"]' },
    { id:"notes", sel:'[data-dashboard-view="highlights-notes"]' },
    { id:"dictation", sel:'[data-dashboard-view="dictation"]' },
    { id:"more" }
  ];

  // ---------- bottom tab bar (phone) ----------
  const tabbar = document.createElement("nav");
  tabbar.className = "rn-tabbar"; tabbar.setAttribute("aria-label", "Keepit");
  tabbar.innerHTML = TABS.map(tab => `<button type="button" class="rn-tab" data-rn-tab="${tab.id}"><span class="rn-ico">${tab.sel ? iconOf(tab.sel) : svg(SVG.more)}${tab.id === "review" ? '<span class="rn-badge" hidden></span>' : ""}</span><span class="rn-lb"></span></button>`).join("");
  document.body.appendChild(tabbar);

  // ---------- sheet (Thêm) ----------
  const backdrop = document.createElement("div"); backdrop.className = "rn-backdrop";
  const sheet = document.createElement("div"); sheet.className = "rn-sheet"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
  const soonItems = [...sidebar.querySelectorAll(".reference-nav-item:not([data-dashboard-view]):not([data-dashboard-action])")];
  const toastEl = document.createElement("div"); toastEl.className = "rn-toast"; toastEl.setAttribute("role", "status");
  const tip = document.createElement("div"); tip.className = "rn-tip"; tip.setAttribute("aria-hidden", "true");
  document.body.append(backdrop, sheet, toastEl, tip);
  let toastTimer = 0;
  function toast(message) { toastEl.textContent = message; toastEl.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800); }
  function renderSheet() {
    const themeText = document.getElementById("dashboardSidebarThemeText")?.textContent || "";
    const themeIcon = document.querySelector("#dashboardSidebarThemeToggle .reference-nav-icon")?.innerHTML || "";
    sheet.innerHTML = `<div class="rn-grab"></div>
      <div class="rn-sh-head"><span class="rn-logo"><svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="kpLogoNav" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#kpLogoNav)" stroke="none"/><g transform="translate(32 0) scale(-1 1)"><g transform="translate(-4.187 -2.393) scale(0.299065)"><path fill="#fff" stroke="none" d="M 35 32 C 34 32 33.5 34 33.2 37 C 31.3 51 34.3 65 42 74 C 48.5 81.5 57 84.6 67 84.5 C 77.5 84.4 84.2 80.3 89.7 73.4 C 92.5 77.3 94.3 81.5 95.4 86.8 C 95.9 89.6 97.8 90.9 99.9 90.2 C 102.1 89.5 102.9 87.5 101.8 84.7 C 98.6 75.9 93.3 69.4 85.4 65.1 C 79.7 62 72.9 61.1 66.1 59.6 C 58.9 58 53.1 54.9 51.6 49.4 C 55.3 52.8 60.2 54.8 67.5 55.8 C 78.7 57.3 87.7 58.3 94.7 65 C 97.3 54.1 92 44.5 82.5 39.9 C 75.4 36.4 68 36.8 59.7 37.6 C 48.6 38.8 41.9 38.6 36.5 32.8 C 36 32.3 35.5 32 35 32 Z"/></g></g></svg></span><span>Keepit</span><button type="button" class="rn-x" data-rn="close" aria-label="${tr("close")}">×</button></div>
      <button type="button" class="rn-row" data-rn="settings">${svg(SVG.gear)}<span>${tr("settings")}</span></button>
      <button type="button" class="rn-row" data-rn="theme">${themeIcon}<span>${themeText}</span></button>
      <button type="button" class="rn-row" data-rn="account">${svg(SVG.user)}<span>${tr("account")}</span><span class="rn-sub">${document.getElementById("profileMenuToggleName")?.textContent || ""}</span></button>
      <div class="rn-sec">${tr("soon")}</div>
      <div class="rn-soon">${soonItems.map((item, index) => `<button type="button" data-rn-soon="${index}">${item.querySelector(".reference-nav-icon")?.innerHTML || ""}<span>${item.querySelector(".nav-label")?.textContent || item.getAttribute("aria-label") || ""}</span><small>${tr("soon")}</small></button>`).join("")}</div>`;
  }
  function openSheet() { renderSheet(); sheet.classList.add("open"); backdrop.classList.add("open"); }
  function closeSheet() { sheet.classList.remove("open"); backdrop.classList.remove("open"); sheet.style.transform = ""; }
  backdrop.addEventListener("click", closeSheet);
  sheet.addEventListener("click", event => {
    const action = event.target.closest("[data-rn]")?.dataset.rn;
    if (event.target.closest("[data-rn-soon]")) { toast(tr("soonToast")); return; }
    if (!action) return;
    closeSheet();
    if (action === "settings") click(document.querySelector('#profileMenu [data-profile-menu-action="settings"]'));
    else if (action === "account") { wantSettingsPanel = true; click(document.querySelector('#profileMenu [data-profile-menu-action="account"]')); }
    else if (action === "theme") click(document.getElementById("dashboardSidebarThemeToggle"));
  });
  // drag the sheet down to close
  let dragY = null;
  sheet.addEventListener("touchstart", event => { dragY = sheet.scrollTop <= 0 ? event.touches[0].clientY : null; }, { passive:true });
  sheet.addEventListener("touchmove", event => { if (dragY === null) return; const dy = event.touches[0].clientY - dragY; if (dy > 0) sheet.style.transform = `translateY(${dy}px)`; }, { passive:true });
  sheet.addEventListener("touchend", event => { if (dragY === null) return; const dy = event.changedTouches[0].clientY - dragY; dragY = null; sheet.style.transform = ""; if (dy > 90) closeSheet(); });

  tabbar.addEventListener("click", event => {
    const id = event.target.closest("[data-rn-tab]")?.dataset.rnTab;
    if (!id) return;
    if (id === "more") { openSheet(); return; }
    closeNotesDetail(false);
    click(navItem(TABS.find(tab => tab.id === id).sel));
    showTabbar();
  });

  function relabel() {
    TABS.forEach(tab => { const label = tabbar.querySelector(`[data-rn-tab="${tab.id}"] .rn-lb`); if (label) label.textContent = tr(tab.id); tabbar.querySelector(`[data-rn-tab="${tab.id}"]`)?.setAttribute("aria-label", tr(tab.id)); });
    document.querySelectorAll(".rn-back, .rn-set-back").forEach(button => button.setAttribute("aria-label", tr("back")));
    document.querySelectorAll(".rn-set-group").forEach(group => { group.textContent = tr(["gAccount", "gRead", "gView", "gData"][Number(group.dataset.g)]); });
  }
  function syncActive() {
    const view = sidebar.querySelector("[data-dashboard-view].is-active")?.dataset.dashboardView || "overview";
    const id = { overview:"overview", "highlights-notes":"notes", dictation:"dictation" }[view] || "overview";
    tabbar.querySelectorAll("[data-rn-tab]").forEach(button => button.classList.toggle("is-active", button.dataset.rnTab === id));
    if (view !== "highlights-notes") closeNotesDetail(false);
  }
  function syncBadge() {
    const due = parseInt(document.getElementById("overviewDueCount")?.textContent || "0", 10) || 0;
    const badge = tabbar.querySelector(".rn-badge");
    if (badge) { badge.hidden = due <= 0; badge.textContent = due > 99 ? "99+" : String(due); }
  }

  // ---------- hide the tab bar while scrolling down ----------
  let lastTop = 0, travel = 0;
  function showTabbar() { tabbar.classList.remove("rn-hide"); travel = 0; }
  document.addEventListener("scroll", event => {
    if (!PHONE.matches) return;
    const target = event.target === document ? document.scrollingElement : event.target;
    if (!target || target.nodeType !== 1 || !scroller.contains(target) && target !== scroller) return;
    const top = target.scrollTop, delta = top - lastTop; lastTop = top;
    if (Math.abs(delta) > 400) { travel = 0; return; }            // view switch / restore jump
    if ((delta > 0) !== (travel > 0)) travel = 0;
    travel += delta;
    if (top < 8 || target.scrollHeight - target.clientHeight - top < 4) showTabbar();
    else if (travel > 14) tabbar.classList.add("rn-hide");
    else if (travel < -14) showTabbar();
  }, { capture:true, passive:true });

  // ---------- Highlights & Notes: list → detail (phone) ----------
  const notesHeader = document.getElementById("notesHeader");
  if (notesHeader) {
    const back = document.createElement("button");
    back.type = "button"; back.className = "rn-back"; back.innerHTML = svg(SVG.back);
    back.addEventListener("click", () => closeNotesDetail(true));
    notesHeader.prepend(back);
  }
  let notesDetailState = false;
  function openNotesDetail() {
    if (!PHONE.matches || document.body.classList.contains("rn-hn-detail")) return;
    document.body.classList.add("rn-hn-detail"); scroller.scrollTop = 0; showTabbar();
    try { history.pushState({ rnDetail:true }, ""); notesDetailState = true; } catch { notesDetailState = false; }
  }
  function closeNotesDetail(viaBack) {
    if (!document.body.classList.contains("rn-hn-detail")) return;
    if (viaBack && notesDetailState) { history.back(); return; }   // popstate finishes the close
    document.body.classList.remove("rn-hn-detail"); notesDetailState = false;
  }
  document.getElementById("sourceList")?.addEventListener("click", event => { if (event.target.closest(".source-item")) openNotesDetail(); });
  document.getElementById("sourceList")?.addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && event.target.closest(".source-item")) openNotesDetail(); });

  // ---------- Settings: list → panel (phone) ----------
  const settingsDialog = document.getElementById("dashboardSettingsDialog");
  let wantSettingsPanel = /[?&]openSettingsTab=/.test(location.search) || /[?&]openAccount=1/.test(location.search);
  let settingsPanelState = false, ignorePop = false;
  if (settingsDialog) {
    const nav = settingsDialog.querySelector(".settings-window-nav");
    if (nav) [0, 1, 2, 3].forEach(g => { const group = document.createElement("div"); group.className = "rn-set-group"; group.dataset.g = String(g); group.setAttribute("aria-hidden", "true"); nav.appendChild(group); });
    const topbar = settingsDialog.querySelector(".settings-window-topbar");
    const back = document.createElement("button");
    back.type = "button"; back.className = "rn-set-back"; back.innerHTML = svg(SVG.back);
    back.addEventListener("click", () => setSettingsPanel(false, true));
    topbar?.prepend(back);
    nav?.addEventListener("click", event => { if (event.target.closest("[data-settings-tab]")) setSettingsPanel(true); });
    new MutationObserver(() => {
      if (settingsDialog.open) { setSettingsPanel(wantSettingsPanel, false, true); wantSettingsPanel = false; }
      else { settingsDialog.classList.remove("rn-set-panel"); if (settingsPanelState) { settingsPanelState = false; ignorePop = true; try { history.back(); } catch { ignorePop = false; } } }
    }).observe(settingsDialog, { attributes:true, attributeFilter:["open"] });
  }
  function setSettingsPanel(on, viaBack = false, initial = false) {
    if (!settingsDialog) return;
    if (!PHONE.matches) { settingsDialog.classList.remove("rn-set-panel"); return; }
    if (!on && viaBack && settingsPanelState) { history.back(); return; }
    settingsDialog.classList.toggle("rn-set-panel", on);
    if (on && !initial && !settingsPanelState) { try { history.pushState({ rnSettings:true }, ""); settingsPanelState = true; } catch {} }
    if (!on) settingsPanelState = false;
    const scrollBox = on ? settingsDialog.querySelector(".settings-window-layout > :not(.settings-window-sidebar)") : settingsDialog.querySelector(".settings-window-sidebar");
    if (scrollBox) scrollBox.scrollTop = 0;
  }
  window.addEventListener("popstate", () => {
    if (ignorePop) { ignorePop = false; return; }
    if (settingsPanelState || settingsDialog?.classList.contains("rn-set-panel") && settingsDialog.open) { settingsPanelState = false; settingsDialog.classList.remove("rn-set-panel"); return; }
    if (document.body.classList.contains("rn-hn-detail")) { notesDetailState = false; document.body.classList.remove("rn-hn-detail"); }
  });

  // ---------- Review: tap the card to reveal the answer (phone) ----------
  document.getElementById("studyCard")?.addEventListener("click", event => {
    if (!PHONE.matches || event.target.closest("button, a, input, textarea, select, label, [contenteditable]")) return;
    const reveal = document.getElementById("studyRevealBtn");
    if (reveal && reveal.offsetParent !== null && !reveal.disabled) click(reveal);
  });

  // ---------- tablet rail tooltips (hover + long press) ----------
  let pressTimer = 0, hideTimer = 0;
  function labelFor(element) { return element.querySelector(".nav-label")?.textContent?.trim() || element.getAttribute("aria-label") || element.title || ""; }
  function showTip(element) {
    const text = labelFor(element); if (!text) return;
    tip.textContent = text;
    const rect = element.getBoundingClientRect();
    tip.style.top = `${Math.round(rect.top + rect.height / 2 - 14)}px`;
    tip.classList.add("show");
  }
  function hideTip() { tip.classList.remove("show"); }
  sidebar.addEventListener("mouseover", event => { if (!RAIL.matches) return; const item = event.target.closest(".reference-nav-item, .reference-footer-button"); if (item) showTip(item); });
  sidebar.addEventListener("mouseout", event => { if (!RAIL.matches) return; if (!event.relatedTarget || !sidebar.contains(event.relatedTarget) || !event.relatedTarget.closest(".reference-nav-item, .reference-footer-button")) hideTip(); });
  sidebar.addEventListener("touchstart", event => {
    if (!RAIL.matches) return;
    const item = event.target.closest(".reference-nav-item, .reference-footer-button"); if (!item) return;
    clearTimeout(pressTimer); clearTimeout(hideTimer);
    pressTimer = setTimeout(() => { showTip(item); hideTimer = setTimeout(hideTip, 1500); }, 420);
  }, { passive:true });
  ["touchend", "touchmove", "touchcancel"].forEach(type => sidebar.addEventListener(type, () => clearTimeout(pressTimer), { passive:true }));

  // ---------- keep in sync ----------
  new MutationObserver(syncActive).observe(sidebar, { subtree:true, attributes:true, attributeFilter:["class"] });
  new MutationObserver(relabel).observe(document.documentElement, { attributes:true, attributeFilter:["lang"] });
  const due = document.getElementById("overviewDueCount");
  if (due) new MutationObserver(syncBadge).observe(due, { childList:true, characterData:true, subtree:true });
  const onLayoutChange = () => { hideTip(); closeSheet(); if (!PHONE.matches) { document.body.classList.remove("rn-hn-detail"); settingsDialog?.classList.remove("rn-set-panel"); showTabbar(); } };
  PHONE.addEventListener("change", onLayoutChange); RAIL.addEventListener("change", onLayoutChange);
  document.addEventListener("keydown", event => { if (event.key === "Escape" && sheet.classList.contains("open")) closeSheet(); });
  relabel(); syncActive(); syncBadge();
})();
