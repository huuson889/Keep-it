(() => {
  function create({ $, document, languages, t, getCurrentLanguage, onLanguageChange, escapeHtml }) {
    const languageLabel = language => `${language.flag} ${language.name} - ${language.native}`;
    // nút đang đóng: hiện cờ + tên bản ngữ + tên tiếng Anh (mờ, chỉ khi đủ chỗ — không bao giờ cắt "…"); bấm = ô tìm như cũ
    function paintLanguage(language) {
      const view = $("settingsLanguageView"); if (!view) return;
      view.querySelector(".settings-language-flag").textContent = language.flag;
      view.querySelector(".settings-language-own").textContent = language.native;
      view.querySelector(".settings-language-en").textContent = language.name;
      fitLanguage();
    }
    function fitLanguage() {
      const view = $("settingsLanguageView"); if (!view || !view.offsetWidth) return;
      view.classList.remove("no-en"); if (view.scrollWidth > view.clientWidth + 1) view.classList.add("no-en");
    }
    function closeLanguagePicker({ restoreSelection = true } = {}) {
      const input = $("settingsLanguageSearch"), options = $("settingsLanguageOptions");
      if (!input || !options) return;
      options.classList.remove("open"); input.setAttribute("aria-expanded", "false"); $("settingsLanguagePicker")?.classList.remove("is-open");
      if (restoreSelection) {
        const selected = languages.LANGS.find(language => language.code === $("settingsLanguageSelect").value) || languages.LANGS[0];
        input.value = selected.native; paintLanguage(selected);
      }
    }
    function chooseLanguage(language) {
      const select = $("settingsLanguageSelect"), input = $("settingsLanguageSearch"); if (!select || !input) return;
      const changed = select.value !== language.code; select.value = language.code;
      closeLanguagePicker({ restoreSelection:true });
      input.blur();
      if (changed) select.dispatchEvent(new Event("change", { bubbles:true }));
    }
    function renderLanguageOptions(filter = "") {
      const select = $("settingsLanguageSelect"), options = $("settingsLanguageOptions"); if (!select || !options) return;
      options.replaceChildren();
      const filtered = LHN_INDEX_SEARCH.search(LHN_INDEX_SEARCH.createIndex(languages.LANGS, language => [language.name, language.native, language.code], language => language.code), filter);
      if (!filtered.length) { const empty = document.createElement("div"); empty.className = "language-empty settings-language-empty"; empty.textContent = t("languageSearchNoResults"); options.appendChild(empty); return; }
      filtered.forEach(language => {
        const option = document.createElement("div"); option.className = "language-option settings-language-option" + (language.code === select.value ? " selected" : "");
        option.role = "option"; option.tabIndex = 0; option.setAttribute("aria-selected", String(language.code === select.value)); option.textContent = `${language.flag} ${language.native}`; const en = document.createElement("span"); en.className = "settings-language-en"; en.textContent = language.name; option.append(" ", en);
        option.addEventListener("click", () => chooseLanguage(language));
        option.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseLanguage(language); } });
        options.appendChild(option);
      });
    }
    function openLanguagePicker() {
      const input = $("settingsLanguageSearch"), options = $("settingsLanguageOptions"); if (!input || !options || options.classList.contains("open")) return;
      input.value = ""; renderLanguageOptions(); options.classList.add("open"); $("settingsLanguagePicker")?.classList.add("is-open"); input.setAttribute("aria-expanded", "true");
    }
    function syncLanguagePicker() {
      const input = $("settingsLanguageSearch"), options = $("settingsLanguageOptions"), select = $("settingsLanguageSelect"); if (!input || !options || !select) return;
      if (options.classList.contains("open")) renderLanguageOptions(input.value);
      else { const selected = languages.LANGS.find(language => language.code === select.value) || languages.LANGS[0]; input.value = selected.native; paintLanguage(selected); input.setAttribute("aria-expanded", "false"); }
    }
    function initLanguagePicker() {
      $("settingsLanguageSearch").addEventListener("focus", openLanguagePicker);
      $("settingsLanguageSearch").addEventListener("click", openLanguagePicker);
      $("settingsLanguageSearch").addEventListener("input", event => { const options = $("settingsLanguageOptions"); if (!options.classList.contains("open")) { options.classList.add("open"); $("settingsLanguagePicker")?.classList.add("is-open"); event.target.setAttribute("aria-expanded", "true"); } renderLanguageOptions(event.target.value); });
      $("settingsLanguageSearch").addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); closeLanguagePicker({ restoreSelection:true }); return; } if (event.key === "ArrowDown") { event.preventDefault(); $("settingsLanguageOptions").querySelector(".settings-language-option")?.focus(); } });
      if (globalThis.ResizeObserver && $("settingsLanguagePicker")) new ResizeObserver(fitLanguage).observe($("settingsLanguagePicker"));
      $("settingsLanguagePicker").addEventListener("focusout", event => { if (!event.currentTarget.contains(event.relatedTarget)) closeLanguagePicker({ restoreSelection:true }); });
      document.addEventListener("pointerdown", event => { if (!event.target.closest?.("#settingsLanguagePicker")) closeLanguagePicker({ restoreSelection:true }); });
    }
    const WEB_ICONS = { edit:'<path d="M17 3a2.83 2.83 0 1 1 4 4L7 21l-4 1 1-4Z"/><path d="m15 5 4 4"/>', remove:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>' };  // như nút Sửa / Xóa của Quy tắc phát âm
    function renderWebsiteList({ host, sites, editing, actionAttribute, ariaLabel, emptyTextKey, actionKeys }) {
      if (!host) return;
      if (!sites.length) { host.innerHTML = `<p class="settings-disabled-web-empty">${escapeHtml(t(emptyTextKey))}</p>`; return; }
      host.replaceChildren(...sites.map(site => {
        const row = document.createElement("div"); row.className = "settings-disabled-web-item"; row.dataset.site = site;
        if (editing === site) {
          row.innerHTML = `<input class="settings-disabled-web-edit-input" type="text" value="${escapeHtml(site)}" aria-label="${escapeHtml(t(ariaLabel))}"><div class="settings-disabled-web-actions"><button type="button" class="settings-action-button" data-${actionAttribute}="save"${actionAttribute === "disabled-site-action" ? ' data-i18n="save"' : ""}>${escapeHtml(t("save"))}</button><button type="button" class="settings-action-button" data-${actionAttribute}="cancel"${actionAttribute === "disabled-site-action" ? ' data-i18n="cancel"' : ""}>${escapeHtml(t("cancel"))}</button></div>`;
        } else {
          const label = document.createElement("span"); label.className = "settings-disabled-web-domain"; label.textContent = site;
          const actions = document.createElement("div"); actions.className = "settings-disabled-web-actions";
          for (const [action, key] of actionKeys) { const button = document.createElement("button"); button.type = "button"; button.className = "settings-web-icon-button"; button.setAttribute(`data-${actionAttribute}`, action); button.dataset.i18nTitle = key; button.dataset.i18nAriaLabel = key; button.title = t(key); button.setAttribute("aria-label", t(key)); button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${WEB_ICONS[action] || ""}</svg>`; actions.appendChild(button); }
          row.append(label, actions);
        }
        return row;
      }));
    }
    function syncReaderControls() {
      const enabled = $("bilingualEnableTTS")?.checked !== false, dependent = $("bilingualReaderDependentSettings");
      if (!dependent) return;
      dependent.classList.toggle("is-disabled", !enabled); dependent.setAttribute("aria-disabled", String(!enabled));
      dependent.querySelectorAll("input,button,select,textarea").forEach(control => { control.disabled = !enabled; });
    }
    // Ô tìm Settings: lọc hàng/nhóm/tab bằng class tạm (không đổi hidden hay state), xóa ô tìm là về nguyên trạng.
    const SEARCH_ROWS = ".settings-preference-row,.settings-icon-display-option,.settings-shortcut-row,.settings-account-row,.settings-backup-row,.settings-speech-rate-row,.settings-danger-row,.settings-speech-voice-row,.settings-language-speech-rate-row";
    function initSettingsSearch() {
      const dialog = $("dashboardSettingsDialog"), input = $("settingsSearch"), content = dialog?.querySelector(".settings-window-content"), empty = $("settingsSearchEmpty");
      if (!input || !content) return;
      const text = (root, selector) => [...root.querySelectorAll(selector)].map(node => node.textContent).join(" ");
      const groupOf = row => row.closest(".settings-subsection"), panelOf = row => row.closest(".settings-panel-page");
      const modeOff = node => { const pane = node.closest(".kp-mode-pane"); return !!pane && getComputedStyle(pane).display === "none"; };
      // Tiêu đề h3 gần nhất phía trên hàng (một nhóm có thể chứa nhiều h3)
      const headingOf = row => { const heads = [...(groupOf(row)?.querySelectorAll("h3") || [])].filter(head => head.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING); return heads.length ? heads[heads.length - 1].textContent : ""; };
      // Tô sáng kết quả bằng mark.lhn-search-match (cùng kiểu Dashboard/sidebar); khớp không phân biệt hoa thường và dấu
      const fold = value => String(value).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
      function unmark() {
        content.querySelectorAll("mark.lhn-search-match").forEach(mark => { const parent = mark.parentNode; mark.replaceWith(document.createTextNode(mark.textContent)); parent.normalize(); });
      }
      function markMatches(query) {
        const needle = LHN_INDEX_SEARCH.normalize(query); if (!needle) return;
        content.querySelectorAll(".has-search-match :is(h2, h3, .settings-panel-heading p, strong, small)").forEach(root => {
          if (root.closest(".settings-search-hidden, [hidden]:not(.settings-panel-page), button, select, template")) return;
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
          while (walker.nextNode()) nodes.push(walker.currentNode);
          nodes.forEach(node => {
            const text = node.nodeValue, folded = [], origin = [];
            for (let i = 0; i < text.length; i++) for (const char of fold(text[i])) { folded.push(char); origin.push(i); }
            const haystack = folded.join(""), fragment = document.createDocumentFragment(); let from = 0, at, last = 0;
            while ((at = haystack.indexOf(needle, from)) !== -1) {
              const start = origin[at], end = origin[at + needle.length - 1] + 1;
              if (start > last) fragment.appendChild(document.createTextNode(text.slice(last, start)));
              const mark = document.createElement("mark"); mark.className = "lhn-search-match"; mark.textContent = text.slice(start, end); fragment.appendChild(mark);
              last = end; from = at + needle.length;
            }
            if (!last) return;
            if (last < text.length) fragment.appendChild(document.createTextNode(text.slice(last)));
            node.replaceWith(fragment);
          });
        });
      }
      function clear() {
        unmark();
        content.classList.remove("is-searching");
        content.querySelectorAll(".settings-search-hidden,.has-search-match").forEach(node => node.classList.remove("settings-search-hidden", "has-search-match"));
        if (empty) empty.hidden = true;
      }
      function apply() {
        const query = input.value;
        input.setAttribute("aria-label", t("settingsSearchPlaceholder"));
        unmark();
        if (!LHN_INDEX_SEARCH.normalize(query)) { clear(); return; }
        const rows = [...content.querySelectorAll(SEARCH_ROWS)].filter(row => !modeOff(row));
        const rowIndex = LHN_INDEX_SEARCH.createIndex(rows, row => [row.querySelector("strong")?.textContent || row.textContent, text(row, "small"), headingOf(row), panelOf(row) ? text(panelOf(row), ".settings-panel-heading") : ""], row => row);
        const matchedRows = new Set(LHN_INDEX_SEARCH.search(rowIndex, query));
        rows.forEach(row => row.classList.toggle("settings-search-hidden", !matchedRows.has(row)));
        let anyPanel = false;
        content.querySelectorAll(".settings-panel-page").forEach(panel => {
          const titleMatch = LHN_INDEX_SEARCH.search(LHN_INDEX_SEARCH.createIndex([panel], node => [text(node, ".settings-panel-heading")]), query).length > 0;
          const groups = [...panel.querySelectorAll(".settings-subsection")].filter(group => !modeOff(group));
          let visible = false;
          groups.forEach(group => {
            const groupRows = [...group.querySelectorAll(SEARCH_ROWS)].filter(row => !modeOff(row));
            const groupTitleMatch = LHN_INDEX_SEARCH.search(LHN_INDEX_SEARCH.createIndex([group], node => [text(node, "h3"), text(panel, ".settings-panel-heading")]), query).length > 0;
            const show = groupRows.some(row => matchedRows.has(row)) || groupTitleMatch;
            group.classList.toggle("settings-search-hidden", !show);
            if (show) visible = true;
          });
          if (!visible) visible = [...panel.querySelectorAll(SEARCH_ROWS)].some(row => !groupOf(row) && matchedRows.has(row)) || (!groups.length && !panel.querySelector(SEARCH_ROWS) && titleMatch);
          panel.classList.toggle("has-search-match", visible);
          if (visible) anyPanel = true;
        });
        content.classList.add("is-searching");
        markMatches(query);
        if (empty) empty.hidden = anyPanel;
      }
      const debouncedApply = LHN_INDEX_SEARCH.debounce(apply, 200);
      const reset = () => { debouncedApply.cancel(); input.value = ""; clear(); };
      input.setAttribute("aria-label", t("settingsSearchPlaceholder"));
      input.addEventListener("input", debouncedApply);
      input.addEventListener("keydown", event => { if (event.key === "Escape" && input.value) { event.preventDefault(); event.stopPropagation(); reset(); } });
      dialog.querySelectorAll("[data-settings-tab]").forEach(button => button.addEventListener("click", reset));
      dialog.addEventListener("close", reset);
    }
    return Object.freeze({ initLanguagePicker, syncLanguagePicker, closeLanguagePicker, renderLanguageOptions, renderWebsiteList, syncReaderControls, initSettingsSearch });
  }
  globalThis.LHN_DASHBOARD_SETTINGS_UI = Object.freeze({ create });
})();

// Settings kit (#dashboardSettingsDialog): motion, undo toast, master switches, per-tab scroll, plan badge, per-panel reset and custom <select> lists.
// UI only — saving stays in dashboard.js (the kit fires the same input/change/click events the user would).
(() => {
  function create({ t, escapeHtml }) {
    const $ = id => document.getElementById(id);
    const dialog = () => $("dashboardSettingsDialog");
    const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    // ---------- motion: deletions shrink away, lists slide (FLIP), selections slide, collapsible blocks open/close softly ----------
    const MOTION = (() => {
      const EASE = "cubic-bezier(.2,.8,.2,1)", easeOut = x => 1 - Math.pow(1 - x, 3);
      function leave(el, collapse = true) {
        if (!el || reduce()) return Promise.resolve();
        el.style.pointerEvents = "none";
        return el.animate([{ opacity:1, transform:"scale(1)" }, { opacity:0, transform:"scale(.94)" }], { duration:160, easing:"ease-in", fill:"forwards" }).finished.then(() => {
          if (!collapse) return;
          const cs = getComputedStyle(el), gap = parseFloat(getComputedStyle(el.parentElement).rowGap) || 0, first = !el.previousElementSibling;
          el.style.overflow = "hidden";
          const shrink = -(gap + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)) + "px";
          return el.animate([{ minHeight:"0px", height:el.offsetHeight + "px", paddingTop:cs.paddingTop, paddingBottom:cs.paddingBottom, marginTop:cs.marginTop, marginBottom:cs.marginBottom },
            { minHeight:"0px", height:"0px", paddingTop:"0px", paddingBottom:"0px", marginTop:first ? cs.marginTop : shrink, marginBottom:first ? shrink : cs.marginBottom }], { duration:200, easing:EASE, fill:"forwards" }).finished;
        });
      }
      function flip(host, key, render) {
        if (!host || reduce()) { render(); return; }
        const before = new Map([...host.querySelectorAll(`[${key}]`)].map(n => [n.getAttribute(key), n.getBoundingClientRect()]));
        render();
        host.querySelectorAll(`[${key}]`).forEach(n => {
          const r0 = before.get(n.getAttribute(key)), r1 = n.getBoundingClientRect();
          if (!r0) { if (before.size) n.animate([{ opacity:0, transform:"scale(.94)" }, { opacity:1, transform:"none" }], { duration:200, easing:EASE }); return; }
          const dx = r0.left - r1.left, dy = r0.top - r1.top;
          if (Math.abs(dx) > .5 || Math.abs(dy) > .5) n.animate([{ transform:`translate(${dx}px,${dy}px)` }, { transform:"none" }], { duration:260, easing:EASE });
        });
      }
      const scroller = el => { for (let q = el.parentElement; q; q = q.parentElement) { if (/(auto|scroll)/.test(getComputedStyle(q).overflowY) && q.scrollHeight > q.clientHeight + 1) return q; } return null; };
      function toggleDetails(d) {
        const body = d.querySelector(":scope > :not(summary)"); if (!body || d.dataset.kpAnim) return;
        const DUR = 320;
        if (!d.open) {
          d.open = true; d.classList.add("is-open");
          const sc = scroller(d), start = sc?.scrollTop || 0, end = sc ? sc.scrollHeight - sc.clientHeight : 0, h = body.offsetHeight;
          if (reduce()) { if (sc) sc.scrollTop = end; return; }
          d.dataset.kpAnim = 1;
          const pb = getComputedStyle(body).paddingBottom;
          body.animate([{ height:"0px", paddingBottom:"0px", opacity:0 }, { height:h + "px", paddingBottom:pb, opacity:1 }], { duration:DUR, easing:"cubic-bezier(.33,1,.68,1)" }).finished.then(() => delete d.dataset.kpAnim);
          if (sc && end > start) { const t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / DUR); sc.scrollTop = start + (end - start) * easeOut(k); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
        } else {
          d.classList.remove("is-open");
          if (reduce()) { d.open = false; return; }
          d.dataset.kpAnim = 1;
          const an = body.animate([{ height:body.offsetHeight + "px", paddingBottom:getComputedStyle(body).paddingBottom, opacity:1 }, { height:"0px", paddingBottom:"0px", opacity:0 }], { duration:260, easing:"cubic-bezier(.4,0,.2,1)", fill:"forwards" });
          an.finished.then(() => { d.open = false; an.cancel(); delete d.dataset.kpAnim; });
        }
      }
      // segmented tabs: the selected background slides to the new tab
      function seg(group) {
        if (group.querySelector(":scope > .kp-seg-thumb")) return;
        const thumb = document.createElement("span"); thumb.className = "kp-seg-thumb"; thumb.setAttribute("aria-hidden", "true"); group.prepend(thumb); group.classList.add("kp-seg-ready");
        let jump = true;
        const sync = () => { const on = group.querySelector(":scope > .settings-logo-action-tab.is-selected"); if (!on || !on.offsetWidth) { jump = true; return; }
          if (jump) thumb.style.transition = "none";
          Object.assign(thumb.style, { width:on.offsetWidth + "px", height:on.offsetHeight + "px", transform:`translate(${on.offsetLeft}px,${on.offsetTop}px)` });
          if (jump) { thumb.offsetWidth; thumb.style.transition = ""; jump = false; } };
        new MutationObserver(sync).observe(group, { subtree:true, attributes:true, attributeFilter:["class"] });
        new ResizeObserver(() => { jump = true; sync(); }).observe(group);
        sync();
      }
      // framed cards / buttons: the selection frame slides to the new choice (pad = ring outside the button)
      function ring(group, sel, pad = 0) {
        if (group.querySelector(":scope > .kp-ring")) return;
        const r = document.createElement("span"); r.className = "kp-ring"; r.setAttribute("aria-hidden", "true"); group.append(r);
        let jump = true;
        const sync = () => { const on = group.querySelector(`:scope > ${sel}.is-selected`); if (!on || !on.offsetWidth) { r.style.opacity = "0"; jump = true; return; }
          const cs = getComputedStyle(on); r.style.opacity = ""; r.style.borderRadius = cs.borderRadius; r.style.borderWidth = Math.max(1, parseFloat(cs.borderTopWidth) || 1) + "px";
          if (jump) r.style.transition = "none";
          Object.assign(r.style, { width:on.offsetWidth + pad * 2 + "px", height:on.offsetHeight + pad * 2 + "px", transform:`translate(${on.offsetLeft - pad}px,${on.offsetTop - pad}px)` });
          if (jump) { r.offsetWidth; r.style.transition = ""; jump = false; } };
        group.classList.add("kp-ring-ready");
        new MutationObserver(sync).observe(group, { subtree:true, attributes:true, attributeFilter:["class"] });
        new ResizeObserver(() => { jump = true; sync(); }).observe(group);
        sync();
      }
      return { leave, flip, seg, ring, toggleDetails, reduce };
    })();

    // ---------- toast: "Reset done · Undo" / "Deleted · Undo" (5 s) and plain notes at the top (2.6 s) ----------
    const UNDO = (() => {
      let el, timer, undo;
      const host = () => dialog()?.open ? dialog().querySelector(".settings-window") : document.body;
      function show(fn, key = "kpResetDone", text = "") {
        if (!el) { el = document.createElement("div"); el.className = "kp-toast"; el.setAttribute("role", "status"); el.innerHTML = '<span></span><button type="button"></button>'; el.querySelector("button").addEventListener("click", () => { const f = undo; hide(); f?.(); }); }
        if (el.parentElement !== host()) host().append(el);
        el.classList.toggle("is-page", host() === document.body); el.classList.toggle("is-note", !fn); el.classList.toggle("is-top", !fn);
        el.querySelector("span").textContent = text || t(key); el.querySelector("button").textContent = t("kpUndo"); el.querySelector("button").hidden = !fn;
        undo = fn; clearTimeout(timer); el.classList.remove("is-on"); el.offsetWidth; requestAnimationFrame(() => el.classList.add("is-on")); timer = setTimeout(hide, fn ? 5000 : 2600);
      }
      function hide() { clearTimeout(timer); undo = null; el?.classList.remove("is-on"); }
      dialog()?.addEventListener("close", () => { if (undo) hide(); });
      return { show, hide, note:text => show(null, null, text) };
    })();

    // ---------- master switches: data-kp-depends="id" (usable while on) / "!id" (locked while on); locked = dimmed + inert ----------
    const LOGO = { settingsNotesEnabled:"highlight", settingsTranslateEnabled:"translate", settingsAskAIEnabled:"ai" };
    const DEPENDS = (() => {
      // all 3 tools off = "Show Keepit icon" shows off and locked; the stored translateIconEnabled is not overwritten
      const iconLock = () => { const ic = $("settingsTranslateIconEnabled"), row = $("settingsTranslateIconEnabledRow"); if (!ic) return;
        const allOff = Object.keys(LOGO).every(id => $(id) && !$(id).checked);
        if (allOff) { if (ic.dataset.kpLock !== "1") ic.dataset.kpWas = String(ic.checked); ic.checked = false; ic.disabled = true; ic.dataset.kpLock = "1"; }
        else if (ic.dataset.kpLock === "1") { ic.disabled = false; delete ic.dataset.kpLock; if (ic.dataset.kpWas === "true" && !["settingsAutoPopup", "settingsTranslationPopupEnabled"].some(id => $(id)?.checked)) ic.checked = true; delete ic.dataset.kpWas; }
        if (row) { row.classList.toggle("is-disabled", allOff); row.classList.toggle("kp-dependent", allOff || row.classList.contains("kp-dependent")); row.inert = allOff; } };
      const sync = () => { iconLock();
        document.querySelectorAll("#dashboardSettingsDialog [data-kp-depends]").forEach(el => { const d = el.dataset.kpDepends, neg = d.startsWith("!"), src = $(d.replace("!", ""));
          if (!src) return; const on = neg ? !src.checked : src.checked; el.classList.toggle("is-disabled", !on); el.inert = !on; el.setAttribute("aria-disabled", String(!on)); });
        [["settingsNotesEnabled", "notes"], ["settingsAskAIEnabled", "ai"]].forEach(([id, v]) => { const r = document.querySelector(`#dashboardSettingsDialog input[name=sidebarIndicatorTarget][value=${v}]`); if (!r || !$(id)) return; r.disabled = !$(id).checked; r.closest(".settings-logo-action-tab")?.classList.toggle("is-off", !$(id).checked); });
        Object.entries(LOGO).forEach(([id, v]) => { const r = document.querySelector(`#dashboardSettingsDialog input[name=selectionToolbarLogoAction][value=${v}]`); if (!r || !$(id)) return; r.disabled = !$(id).checked; r.closest(".settings-logo-action-tab")?.classList.toggle("is-off", !$(id).checked); });
      };
      // a tool that is off also disappears from the Style 1–9 previews; radial styles rebalance (3 = left·bottom·right, 2 = left·right, 1 = bottom)
      const feat = () => {
        document.querySelectorAll("#dashboardSettingsDialog .lhn-sel-preview .lhn-translate-actions").forEach(box => {
          const first = !box.dataset.kpFeat; box.dataset.kpFeat = "1";
          Object.entries(LOGO).forEach(([id, v]) => { const a = box.querySelector(".lhn-action-" + v), src = $(id); if (!a || !src) return; const off = !src.checked;
            if (off === a.classList.contains("kp-feature-off")) return; clearTimeout(a._kpT);
            if (off) { a.classList.add("kp-feature-off"); a._kpT = setTimeout(() => a.classList.add("kp-feature-gone"), first || reduce() ? 0 : 220); if (first) a.classList.add("kp-feature-gone"); }
            else { a.classList.remove("kp-feature-gone"); a.offsetWidth; a.classList.remove("kp-feature-off"); } });
          const on = [...box.querySelectorAll(".lhn-translate-action")].filter(a => !a.classList.contains("kp-feature-off"));
          const SLOTS = { 3:["left", "bottom", "right"], 2:["left", "right"], 1:["bottom"] }[on.length] || [];
          on.forEach((a, i) => { a.dataset.kpSlot = SLOTS[i]; });
          let prev = null, sep = null;
          [...box.children].forEach(el => { if (el.classList.contains("lhn-translate-separator")) { el.hidden = true; if (prev && !sep) sep = el; return; }
            if (el.classList.contains("kp-feature-off")) return; if (sep) sep.hidden = false; prev = el; sep = null; });
        });
      };
      const all = () => { sync(); feat(); };
      document.addEventListener("change", all, true); document.addEventListener("input", all, true);
      return { sync:all };
    })();

    // ---------- each tab keeps its own scroll position (2 columns); closing Settings forgets them ----------
    (() => {
      const mem = {}, box = () => document.querySelector("#dashboardSettingsDialog .settings-window-content");
      const cur = () => document.querySelector("#dashboardSettingsDialog [data-settings-panel].is-active")?.dataset.settingsPanel;
      document.addEventListener("click", e => { const b = e.target.closest("#dashboardSettingsDialog [data-settings-tab]"), sc = box(); if (!b || !sc) return; const from = cur(), to = b.dataset.settingsTab; if (from === to) return;
        if (from) mem[from] = sc.scrollTop;
        requestAnimationFrame(() => { if (dialog().classList.contains("rn-set-panel")) return; sc.scrollTop = mem[to] || 0; }); }, true);
      dialog()?.addEventListener("close", () => Object.keys(mem).forEach(k => delete mem[k]));
    })();

    // ---------- plan badge on the profile card: Free (shield) · Pro (bolt) · Ultra (crown) ----------
    const PLAN = (() => {
      const shield = $("settingsProfilePlan")?.querySelector("svg")?.outerHTML || "";
      const bolt = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.2 2.3a.6.6 0 0 1 1.05.5L12.9 10h6.3a.6.6 0 0 1 .46.98l-8.86 10.7a.6.6 0 0 1-1.05-.5L11.1 14H4.8a.6.6 0 0 1-.46-.98z"/></svg>';
      const crown = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.6 7.4a.8.8 0 0 1 1.26-.83l4.3 3.3 3.15-5.3a.8.8 0 0 1 1.38 0l3.15 5.3 4.3-3.3a.8.8 0 0 1 1.26.83l-2.1 10.1a1.2 1.2 0 0 1-1.18.95H5.88a1.2 1.2 0 0 1-1.18-.95z"/></svg>';
      const PLANS = { free:["usagePlanFree", shield], trial:["usagePlanTrial", bolt], keyA:["usagePlanKeyA", bolt], keyB:["usagePlanKeyB", crown] };
      function set(id) { const b = $("settingsProfilePlan"); if (!b) return; id = PLANS[id] ? id : "free"; const [key, svg] = PLANS[id]; b.dataset.plan = id; const card = b.closest(".settings-window-profile"); if (card) card.dataset.plan = id;
        b.innerHTML = svg + `<span id="settingsProfilePlanText" data-i18n="${key}">${escapeHtml(t(key))}</span>`; }
      $("settingsProfilePlan")?.closest(".settings-window-profile")?.setAttribute("data-plan", "free");
      return { set };
    })();

    // ---------- Reset at the end of each panel: purple while any control differs from the defaults; "Reset done · Undo" ----------
    // snapshot() is called by dashboard.js while the controls show the default settings; reset re-applies that state through the normal input/change/click events.
    const RESET = (() => {
      const SKIP = ".settings-shortcut-field, .settings-disabled-web-form, .settings-disabled-web-list, .pronunciation-language-cards, .pronunciation-language-add, [type=search], [type=file], .settings-language-search, .kp-select-btn";
      const panels = {}, parts = {}; let bound = false;
      const controls = panel => [...panel.querySelectorAll("input, select, textarea")].filter(el => !el.closest(SKIP));
      const PRESS = ".settings-theme-options button, .settings-default-colors button, [data-bilingual-translation-color], [data-bilingual-color]";
      const pressables = panel => [...panel.querySelectorAll(PRESS)].filter(el => !el.closest(SKIP));
      const isSel = el => el.classList.contains("is-selected") || el.getAttribute("aria-pressed") === "true";
      const read = el => el.type === "checkbox" || el.type === "radio" ? el.checked : el.value;
      const snap = name => { const p = document.querySelector(`#dashboardSettingsDialog [data-settings-panel="${name}"]`); return { c:controls(p).map(el => [el, read(el)]), b:pressables(p).map(el => [el, isSel(el)]) }; };
      const isDefault = name => { const x = panels[name]; return !x || x.c.every(([el, v]) => el.dataset.kpLock === "1" || read(el) === v) && x.b.every(([el, sel]) => isSel(el) === sel) && (parts[name] || []).every(q => q.isDefault()); };
      const LINK = [["settingsAutoPopup", "settingsTranslateIconEnabled", "settingsTranslationPopupEnabled"]];   // the 3 selection modes are one setting shown in 3 panels
      const scope = name => { const x = panels[name], all = Object.values(panels).flatMap(q => q.c), list = x.c.slice();
        x.c.forEach(([el]) => LINK.forEach(g => { if (g.includes(el.id)) g.forEach(id => { const e = all.find(([o]) => o.id === id); if (e && !list.includes(e)) list.push(e); }); })); return list; };
      const capture = name => ({ c:scope(name).filter(([el]) => el.dataset.kpLock !== "1").map(([el]) => [el, read(el)]), b:panels[name].b.filter(([el]) => isSel(el)).map(([el]) => el), q:(parts[name] || []).map(q => q.save()) });
      // one control at a time: each change handler saves (and re-renders) before the next control is set
      const apply = async (name, st) => {
        for (const [el, v] of st.c) { if (read(el) === v) continue; if (el.type === "checkbox" || el.type === "radio") el.checked = v; else el.value = v; el.dispatchEvent(new Event("input", { bubbles:true })); el.dispatchEvent(new Event("change", { bubbles:true })); }
        st.b.forEach(el => { if (!isSel(el)) el.click(); });
        for (const [i, q] of (parts[name] || []).entries()) await q.restore(st.q[i]);
        api.sync();
      };
      const reset = name => { if (isDefault(name)) return; const before = capture(name);
        apply(name, { c:scope(name).filter(([el]) => el.dataset.kpLock !== "1").map(([el]) => [el, panels[name].c.find(([o]) => o === el)?.[1] ?? Object.values(panels).flatMap(q => q.c).find(([o]) => o === el)?.[1]]), b:panels[name].b.filter(([, sel]) => sel).map(([el]) => el), q:(parts[name] || []).map(q => q.initial()) });
        UNDO.show(() => apply(name, before)); };
      const api = {
        part(name, q) { (parts[name] ||= []).push(q); },   // q = { isDefault, save, restore, initial }
        snapshot() { document.querySelectorAll("#dashboardSettingsDialog [data-panel-reset]").forEach(b => { panels[b.dataset.panelReset] = snap(b.dataset.panelReset); }); },
        sync() { DEPENDS.sync(); document.querySelectorAll("#dashboardSettingsDialog [data-panel-reset]").forEach(b => { if (panels[b.dataset.panelReset]) b.classList.toggle("has-custom-shortcuts", !isDefault(b.dataset.panelReset)); }); },
        bind() { if (bound) return; bound = true; document.querySelectorAll("#dashboardSettingsDialog [data-panel-reset]").forEach(b => b.addEventListener("click", () => reset(b.dataset.panelReset))); ["input", "change", "click"].forEach(type => document.addEventListener(type, () => setTimeout(api.sync), true)); }
      };
      return api;
    })();

    // ---------- every <select> in Settings uses its own list like the language picker (same font size on every device) ----------
    function initSelects() {
      const dlg = dialog();
      if (!dlg || dlg.dataset.kpSelects) return;
      dlg.dataset.kpSelects = "1";
      const LANGS = globalThis.LHN_LANGUAGES?.LANGS || [];
      const AUTO_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2Q13 11 22 12Q13 13 12 22Q11 13 2 12Q11 11 12 2Z"/></svg>'; // = BR_ICON.auto (bilingual-reader.js)
      const CARET = '<svg class="kp-select-caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
      const langOf = value => LANGS.find(language => language.code === String(value || "").split("-")[0].toLowerCase());
      const isLanguageSelect = select => [...select.options].some(option => langOf(option.value));
      let openList = null;
      function face(option, languages) {
        if (!option) return "";
        const language = languages && langOf(option.value);
        if (language) return `<span class="kp-select-flag">${language.flag}</span><span class="kp-select-own">${escapeHtml(language.native)}</span><span class="kp-select-en">${escapeHtml(language.name)}</span>`;
        const text = option.textContent.replace(/^\s*🌐\s*/u, "").trim();
        if (languages) return `<span class="kp-select-icon">${AUTO_ICON}</span><span class="kp-select-own">${escapeHtml(text)}</span>`;
        return `<span class="kp-select-own">${escapeHtml(text)}</span>`;
      }
      function enhance(select) {
        if (select.closest(".kp-select")) return;
        const wrap = document.createElement("span"); wrap.className = "kp-select";
        const button = document.createElement("button"); button.type = "button"; button.className = "kp-select-btn"; button.setAttribute("aria-haspopup", "listbox"); button.setAttribute("aria-expanded", "false");
        const list = document.createElement("div"); list.className = "kp-select-list"; list.setAttribute("role", "listbox"); list.hidden = true;
        select.before(wrap); wrap.append(select, button, list);
        select.tabIndex = -1; select.setAttribute("aria-hidden", "true");
        const label = select.id && dlg.querySelector(`label[for="${select.id}"]`) || select.closest("label")?.querySelector("strong");
        if (label) button.setAttribute("aria-label", label.textContent.trim());
        const fill = () => {
          const languages = isLanguageSelect(select);
          list.innerHTML = [...select.options].map((option, index) => `<div class="kp-select-opt${option.selected ? " is-on" : ""}${option.disabled ? " is-disabled" : ""}" role="option" data-index="${index}" aria-selected="${option.selected}"${option.disabled ? ' aria-disabled="true"' : ""}>${face(option, languages)}</div>`).join("");
        };
        const paint = () => {
          const languages = isLanguageSelect(select);
          wrap.classList.toggle("is-language", languages);
          button.innerHTML = `<span class="kp-select-face">${face(select.selectedOptions[0] || select.options[0], languages)}</span>${CARET}`;
          button.disabled = select.disabled;
          if (!list.hidden) fill();
        };
        const place = () => {
          const box = (select.closest(".settings-window-content") || dlg).getBoundingClientRect(), rect = button.getBoundingClientRect();
          const need = Math.min(list.scrollHeight, 280) + 8;
          wrap.classList.toggle("is-up", box.bottom - rect.bottom < need && rect.top - box.top > box.bottom - rect.bottom);
        };
        const close = focus => { if (list.hidden) return; list.hidden = true; wrap.classList.remove("is-open", "is-up"); button.setAttribute("aria-expanded", "false"); if (openList === close) openList = null; if (focus) button.focus(); };
        const open = () => {
          if (select.disabled) return;
          openList?.(); fill(); list.hidden = false; wrap.classList.add("is-open"); button.setAttribute("aria-expanded", "true"); place(); openList = close;
          list.querySelector(".is-on")?.scrollIntoView({ block:"nearest" });
        };
        const choose = index => {
          const option = select.options[index]; if (!option || option.disabled) return;
          const changed = select.selectedIndex !== index;
          select.selectedIndex = index; close(true);
          if (changed) { select.dispatchEvent(new Event("input", { bubbles:true })); select.dispatchEvent(new Event("change", { bubbles:true })); }
        };
        button.addEventListener("click", event => { event.preventDefault(); if (list.hidden) open(); else close(); });
        list.addEventListener("click", event => { const item = event.target.closest(".kp-select-opt"); if (item) choose(Number(item.dataset.index)); });
        button.addEventListener("keydown", event => {
          const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
          if (list.hidden) { if (step || event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } return; }
          const items = [...list.querySelectorAll(".kp-select-opt:not(.is-disabled)")];
          let at = items.findIndex(item => item.classList.contains("is-hover")); if (at < 0) at = items.findIndex(item => item.classList.contains("is-on"));
          if (step) { event.preventDefault(); items.forEach(item => item.classList.remove("is-hover")); const next = items[Math.max(0, Math.min(items.length - 1, at + step))]; next?.classList.add("is-hover"); next?.scrollIntoView({ block:"nearest" }); }
          else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (items[at]) choose(Number(items[at].dataset.index)); }
          else if (event.key === "Escape" || event.key === "Tab") { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); } close(event.key === "Escape"); }
        });
        // code that sets .value / .selectedIndex, changes the options or the UI language → repaint
        for (const prop of ["value", "selectedIndex"]) {
          const base = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop);
          Object.defineProperty(select, prop, { configurable:true, get() { return base.get.call(this); }, set(value) { base.set.call(this, value); paint(); } });
        }
        select.addEventListener("change", paint);
        new MutationObserver(paint).observe(select, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:["disabled", "selected", "label"] });
        paint();
      }
      dlg.querySelectorAll("select:not(#settingsLanguageSelect)").forEach(enhance);
      // sliders: the filled part is purple (--p); code that sets .value repaints too
      dlg.querySelectorAll("input[type=range]").forEach(range => {
        const paint = () => { const min = Number(range.min) || 0, max = range.max === "" ? 100 : Number(range.max), at = (Number(range.value) - min) / ((max - min) || 1); range.style.setProperty("--p", `calc(${at} * (100% - 16px) + 8px)`); };
        const base = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        Object.defineProperty(range, "value", { configurable:true, get() { return base.get.call(this); }, set(value) { base.set.call(this, value); paint(); } });
        range.addEventListener("input", paint); range.addEventListener("change", paint); paint();
      });
      // outside tap / Esc (without closing Settings) / tab switch → close the list
      dlg.addEventListener("pointerdown", event => { if (openList && !event.target.closest(".kp-select.is-open")) openList(); }, true);
      dlg.addEventListener("keydown", event => { if (event.key === "Escape" && openList) { event.preventDefault(); event.stopPropagation(); openList(true); } }, true);
      dlg.addEventListener("cancel", event => { if (openList) { event.preventDefault(); openList(true); } });
      dlg.addEventListener("close", () => openList?.());
      dlg.querySelector(".settings-window-nav")?.addEventListener("click", () => openList?.());
    }

    // static wiring: collapsible delete zone, sliding selections
    document.addEventListener("click", e => { const sum = e.target.closest("#dashboardSettingsDialog details.settings-danger-zone > summary"); if (!sum) return; e.preventDefault(); MOTION.toggleDetails(sum.parentElement); }, true);
    new Set([...document.querySelectorAll("#dashboardSettingsDialog .settings-logo-action-tab")].map(tab => tab.parentElement)).forEach(MOTION.seg);
    document.querySelectorAll("#dashboardSettingsDialog .settings-theme-options").forEach(g => MOTION.ring(g, "button"));
    document.querySelectorAll("#dashboardSettingsDialog .settings-default-colors").forEach(g => MOTION.ring(g, "button", 4));
    document.querySelectorAll("#dashboardSettingsDialog .settings-icon-display-options").forEach(g => MOTION.ring(g, ".settings-icon-display-option"));
    return Object.freeze({ motion:MOTION, undo:UNDO, depends:DEPENDS, plan:PLAN, reset:RESET, initSelects });
  }
  globalThis.LHN_SETTINGS_KIT = Object.freeze({ create });
})();

// Settings previews: full English dictionary (Translate) and the Ask AI bar (Ask AI); markup = the real popup / bar.
(() => {
  let dictRender = null;
  function dictionary() {
  const box = document.getElementById("kpDictPreview"); if (!box) return;
  const BACK = "<button class=\"lhn-dict-back\" data-dict-action=\"back\" aria-label=\"Back\" title=\"Back\" hidden><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m9 14-5-5 5-5\"/><path d=\"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11\"/></svg></button>", HEART = "<button class=\"lhn-dict-heart\" data-dict-action=\"heart\" aria-pressed=\"false\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z\"/></svg></button>", SPEAK = "<button class=\"lhn-dict-speak\" data-dict-action=\"speak\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M11 5 6 9H3v6h3l5 4z\"/><path d=\"M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14\"/></svg></button>";
  const D = { word:"keep", ipa:"kiːp", translation:"giữ",
    pos:[["verb", "giữ, giữ lại, tiếp tục"], ["noun", "sự nuôi sống, tháp canh"]],
    examples:[["Keep the change.", "Cứ giữ lại tiền thừa."], ["Please keep quiet.", "Vui lòng giữ im lặng."]],
    syn:[["retain", "giữ lại"], ["hold", "nắm giữ"]], ant:[["lose", "mất"], ["discard", "bỏ đi"]],
    forms:[["kept", "(V)", "đã giữ"], ["keeper", "(N)", "người giữ"]], colloc:[["keep in touch", "giữ liên lạc"], ["keep going", "tiếp tục"]] };
  const parts = () => Object.fromEntries([...document.querySelectorAll("#dashboardSettingsDialog [data-dict-part]")].map(el => [el.dataset.dictPart, el.checked]));
  const chip = (cls, w, m, tag) => `<button class="lhn-dict-chip ${cls}"><b>${w}</b>${tag ? `<span>${tag}</span>` : ""}<span>(${m})</span></button>`;
  const mark = t => t.replace(/\bkeep\b/i, s => `<mark class="lhn-dict-example-word">${s}</mark>`);
  const BRAND = '<span class="lhn-dict-brand" role="img" aria-label="Keepit Dictionary"><span class="lhn-dict-brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg></span><span class="lhn-dict-brand-name" aria-hidden="true"><b></b><span></span></span></span>';
  const placeBrand = () => {   // = content.js placeDictionaryBrand
    const body = box.querySelector(".lhn-dict-body"), last = body.lastElementChild; let host = body;
    if (last?.matches(".lhn-dict-related")) host = last;
    else if (last?.matches(".lhn-dict-pos-list")) host = last.querySelector(".lhn-dict-pos:last-child") || last;
    else if (last?.matches(".lhn-dict-examples")) { const ex = last.querySelector(".lhn-dict-example:last-child"); host = ex?.querySelector(".lhn-dict-example-meaning") || ex?.querySelector(".lhn-dict-example-text") || last; }
    else if (last?.matches(".lhn-dict-translation")) host = last;
    if (host !== body && !host.matches("section, .lhn-dict-pos")) host.classList.add("lhn-dict-brand-host");
    const tailChip = host.matches(".lhn-dict-related") ? [...host.querySelectorAll(":scope > .lhn-dict-chip")].pop() : null;
    if (tailChip) { const tail = document.createElement("span"); tail.className = "lhn-dict-brand-tail"; host.insertBefore(tail, tailChip); tail.append(tailChip); tail.insertAdjacentHTML("beforeend", BRAND); }
    else host.insertAdjacentHTML("beforeend", BRAND);
  };
  const fitBrand = () => {     // = content.js fitDictionaryBrand
    if (!box.offsetParent) return;
    const meaningMark = box.querySelector(".lhn-dict-example-meaning > .lhn-dict-brand");
    if (meaningMark) { const meaning = meaningMark.parentElement, r = document.createRange(); r.selectNodeContents(meaning); r.setEndBefore(meaningMark);
      const lines = [...r.getClientRects()].filter(x => x.width > 0), lastLine = lines[lines.length - 1];
      if (lastLine && meaningMark.getBoundingClientRect().top >= lastLine.bottom - 0.5) { meaning.classList.remove("lhn-dict-brand-host"); meaning.closest(".lhn-dict-examples")?.append(meaningMark); } }
    const posMark = box.querySelector(".lhn-dict-pos > .lhn-dict-brand"), words = posMark?.parentElement.querySelector(":scope > b");
    if (posMark && words) { const r = document.createRange(); r.selectNodeContents(words);
      const tops = new Set([...r.getClientRects()].filter(x => x.width > 0).map(x => Math.round(x.top)));
      if (tops.size > 1 || words.scrollHeight > words.clientHeight + 1) posMark.closest(".lhn-dict-pos-list")?.append(posMark); }
  };
  const render = () => {
    const on = parts();
    const rel = kind => `<section class="lhn-dict-related lhn-dict-${kind.toLowerCase()}" data-kind="${kind}" data-label="${kind}:">${D[kind.toLowerCase()].map(([w, m]) => chip(`lhn-dict-${kind.toLowerCase()}`, w, m)).join("")}</section>`;
    box.innerHTML = `<div class="lhn-dict-body"><header><div><strong>${D.word}</strong>${on.ipa ? `<span class="lhn-dict-ipa">/${D.ipa}/</span>` : ""}<span class="lhn-dict-engine">Google</span></div>${BACK}${HEART}${SPEAK}</header>`
      + `<div class="lhn-dict-translation">${D.translation}</div>`
      + (on.pos ? `<section class="lhn-dict-pos-list">${D.pos.map(([p, w]) => `<div class="lhn-dict-pos"><span>${p}</span><b>${w}</b></div>`).join("")}</section>` : "")
      + (on.examples ? `<section class="lhn-dict-examples" data-kind="Example" data-label="Example:">${D.examples.map(([t, m], i) => `<div class="lhn-dict-example"><span class="lhn-dict-example-num">${i + 1}.</span><span class="lhn-dict-example-text">${mark(t)}</span><span class="lhn-dict-example-meaning">${m}</span></div>`).join("")}</section>` : "")
      + (on.syn ? rel("Syn") : "") + (on.ant ? rel("Ant") : "")
      + (on.forms ? `<section class="lhn-dict-related lhn-dict-forms" data-kind="Forms" data-label="Forms:">${D.forms.map(([w, tag, m]) => chip("lhn-dict-form", w, m, tag)).join("")}</section>` : "")
      + (on.colloc ? `<section class="lhn-dict-related lhn-dict-collocations" data-kind="Colloc" data-label="Colloc:">${D.colloc.map(([w, m]) => chip("lhn-dict-colloc", w, m)).join("")}</section>` : "")
      + `</div>`;
    placeBrand(); fitBrand();
    box.dataset.kpParts = JSON.stringify(on);
  };
  // a part switched on/off: the frame changes height softly, kept parts slide to their new place, a new part fades in, a removed part fades out where it was
  const PARTS = [".lhn-dict-ipa", ".lhn-dict-translation", ".lhn-dict-pos-list", ".lhn-dict-examples", ".lhn-dict-syn", ".lhn-dict-ant", ".lhn-dict-forms", ".lhn-dict-collocations", ".lhn-dict-brand"];
  const EASE = "cubic-bezier(.2,.8,.2,1)";
  const animatedRender = () => {
    if (!box.offsetParent || matchMedia("(prefers-reduced-motion: reduce)").matches) { render(); return; }
    box.getAnimations({ subtree:true }).forEach(a => a.finish()); box.querySelectorAll(".kp-dict-ghost").forEach(g => g.remove());
    const at = (el, base) => { const r = el.getBoundingClientRect(); return { x:r.left - base.left, y:r.top - base.top, w:r.width, h:r.height }; };
    const base0 = box.getBoundingClientRect(), h0 = box.offsetHeight;
    const old = new Map(PARTS.map(k => [k, box.querySelector(k)]).filter(([, el]) => el).map(([k, el]) => [k, { el, ...at(el, base0) }]));
    render();
    const base1 = box.getBoundingClientRect(), h1 = box.offsetHeight, body = box.querySelector(".lhn-dict-body");
    if (h0 !== h1) { const overflow = box.style.overflow; box.style.overflow = "hidden";
      box.animate([{ height:h0 + "px" }, { height:h1 + "px" }], { duration:280, easing:EASE }).finished.then(() => { box.style.overflow = overflow; }, () => { box.style.overflow = overflow; }); }
    PARTS.forEach(k => {
      const el = box.querySelector(k), was = old.get(k);
      if (el && was) { const now = at(el, base1), dx = was.x - now.x, dy = was.y - now.y;
        if (Math.abs(dx) > .5 || Math.abs(dy) > .5) el.animate([{ transform:`translate(${dx}px,${dy}px)` }, { transform:"none" }], { duration:280, easing:EASE }); }
      else if (el) el.animate([{ opacity:0, transform:"translateY(-4px)" }, { opacity:1, transform:"none" }], { duration:240, delay:60, easing:EASE, fill:"backwards" });
      else if (was && body && k !== ".lhn-dict-brand") {   // the old node, laid over the new popup where it was, fades out
        const b = body.getBoundingClientRect(), ghost = was.el;
        ghost.classList.add("kp-dict-ghost"); ghost.setAttribute("aria-hidden", "true");
        Object.assign(ghost.style, { position:"absolute", left:(base0.left + was.x - b.left) + "px", top:(base0.top + was.y - b.top) + "px", width:was.w + "px", margin:"0", pointerEvents:"none", zIndex:"1" });
        if (getComputedStyle(body).position === "static") body.style.position = "relative";
        body.append(ghost);
        ghost.animate([{ opacity:1, transform:"none" }, { opacity:0, transform:"scale(.98)" }], { duration:120, easing:"ease-out", fill:"forwards" }).finished.then(() => ghost.remove(), () => ghost.remove());
      }
    });
  };
  // Settings saved → sync(): draw again only when the parts differ from what is shown (never cut a running animation)
  dictRender = () => { if (box.dataset.kpParts !== JSON.stringify(parts())) render(); };
  document.addEventListener("change", e => { if (e.target.matches?.("#dashboardSettingsDialog [data-dict-part]")) animatedRender(); }, true);
  let w0 = -1; new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); if (w !== w0) { w0 = w; render(); } }).observe(box.parentElement);   // panel shown / device changed → place the logo again like the real popup
  render();
}
  // Ask AI bar preview: the real bar of the AI panel (js/ask-ai/toolbar.js), themed by the app instead of prefers-color-scheme
  function askAI() {
    const box = document.getElementById("kpAIPreview"), TB = globalThis.LHN_AI_TOOLBAR; if (!box || !TB?.shadowMarkup) return;
    const NAMES = { chatgpt:"ChatGPT", gemini:"Gemini", claude:"Claude" };
    const L = { source:{ en:"Source:", vi:"Nguồn:", ko:"출처:" }, auto:{ en:"Auto-send", vi:"Tự động gửi", ko:"자동 전송" } };
    const scheme = css => css.replace(/@media \(prefers-color-scheme:\s*(light|dark)\)\s*\{([\s\S]*?\})\s*\}/g, (m, mode, body) => {
      const pre = mode === "light" ? ":host(.kp-light)" : ":host(:not(.kp-light))";
      return body.replace(/(^|\})\s*([^{}]+?)\s*\{/g, (x, end, sel) => end + " " + sel.split(",").map(s => s.trim() === ":host" ? pre : pre + " " + s.trim()).join(", ") + " {");
    }).replace("@media (max-width: 520px)", "@container kpai (max-width: 520px)");
    const markup = TB.shadowMarkup(), cut = markup.indexOf("</style>");
    const CSS = scheme(markup.slice(markup.indexOf("<style>") + 7, cut)), BAR = markup.slice(cut + 8);
    const inputs = () => [...document.querySelectorAll("#dashboardSettingsDialog [data-ai-provider]")];
    const host = document.createElement("div"); box.append(host);
    const root = host.attachShadow({ mode:"open" });
    // at least one AI stays on: the last one that is on is locked
    const lock = () => { const on = inputs().filter(i => i.checked); inputs().forEach(i => { i.disabled = on.length === 1 && i.checked; }); };
    // Default AI: AIs that are off are hidden from the choice; the default turned off → "Last used"
    const radios = () => [...document.querySelectorAll("#dashboardSettingsDialog input[name=askAIDefaultProvider]")];
    const syncDefault = () => { if (!radios().length) return; const off = new Set(inputs().filter(i => !i.checked).map(i => i.dataset.aiProvider));
      radios().forEach(r => r.closest(".settings-logo-action-tab").classList.toggle("kp-ai-gone", off.has(r.value)));
      const cur = radios().find(r => r.checked); if (!cur || off.has(cur.value)) radios().find(r => r.value === "last").checked = true;
      radios().forEach(r => r.closest(".settings-logo-action-tab").classList.toggle("is-selected", r.checked)); };
    const render = () => {
      const lang = ["en", "vi", "ko"].includes(document.documentElement.lang) ? document.documentElement.lang : "en";
      const on = inputs().filter(i => i.checked).map(i => i.dataset.aiProvider);
      const def = radios().find(r => r.checked)?.value || "last";
      const selected = def !== "last" && on.includes(def) ? def : on.includes("chatgpt") ? "chatgpt" : on[0];   // "Last used": the preview shows ChatGPT (when on)
      host.classList.toggle("kp-light", !document.documentElement.classList.contains("dark"));
      root.innerHTML = `<style>${CSS}
        .kp-frame{container:kpai/inline-size;position:relative;overflow:hidden;border:1px solid var(--border);border-radius:10px;background:var(--window);}
        .kp-frame .bar{pointer-events:none;}
        .kp-page{height:48px;background:var(--window);}
      </style><div class="kp-frame">${BAR}<div class="kp-page"></div></div>`;
      root.querySelector(".tabs").innerHTML = on.map(id => `<button class="tab" type="button" role="tab" data-provider="${id}" aria-selected="${id === selected}"><span class="provider-icon-wrap" aria-hidden="true"><img class="provider-icon" alt="" src="${TB.ICONS[id]}"><span class="provider-icon-fallback" hidden>${NAMES[id][0]}</span></span><span class="tab-label">${NAMES[id]}</span></button>`).join("");
      root.querySelector(".label").textContent = L.source[lang];
      const a = root.querySelector(".source-link"); a.hidden = false; a.textContent = "example.com/this-link";
      root.querySelector(".copy-link").disabled = false;
      root.querySelector(".new-chat").hidden = false;
      const s = root.querySelector(".auto-send"); s.disabled = false; root.querySelector(".auto-send-label").textContent = L.auto[lang];
      s.classList.toggle("is-enabled", !!document.getElementById("settingsChatGPTAutoSend")?.checked);
    };
    document.addEventListener("change", e => { if (e.target.matches?.("#dashboardSettingsDialog [data-ai-provider], #settingsChatGPTAutoSend, #dashboardSettingsDialog input[name=askAIDefaultProvider]")) { lock(); syncDefault(); render(); } }, true);
    new MutationObserver(render).observe(document.documentElement, { attributes:true, attributeFilter:["class", "lang"] });
    lock(); syncDefault(); render();
    return { sync:() => { lock(); syncDefault(); render(); } };
  }
  // v3.5.290 Settings → Word class: model status with Download / Delete (“Deleted · Undo”: removed after 5 s) and a preview
  // tagged by the real model (background.js → js/word-class/engine.js), nothing hard-coded; no model → the preview offers it.
  function wordClass(kit) {
    const $ = id => document.getElementById(id), status = $("kpWcModelStatus"), btn = $("kpWcModelButton"), prog = $("kpWcModelProgress"), box = $("kpWcPreview"), CORE = globalThis.LHN_WORD_CLASS_CORE;
    if (!status || !btn || !prog || !box || !CORE) return null;
    const SAMPLE = "I can't believe she finally finished the book that her grandfather wrote in 1952.";
    const lang = () => ["en", "vi", "ko"].includes(document.documentElement.lang) ? document.documentElement.lang : "en";
    const t = (key, vars) => globalThis.LHN_LANGUAGES?.t?.(key, vars || {}, lang()) ?? key;
    const esc = text => String(text).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
    const send = (type, extra) => globalThis.LHN_MESSAGING?.sendMessage({ type, ...(extra || {}) }).catch(() => null) ?? Promise.resolve(null);
    let st = null, tags = null, tagging = false, failed = false, pollT = 0, delT = 0;
    const dark = () => document.documentElement.classList.contains("dark");
    const pct = () => st?.total ? Math.min(100, Math.round(100 * st.loaded / st.total)) : 0;
    const ready = () => !!st?.downloaded && !st.loading && !delT;
    function draw() {
      const loading = !!st?.loading && !delT;
      status.textContent = loading ? t("kpWcDownloading", { p:pct() }) : failed ? t("wc_failed") : ready() ? t("kpWcReady") : st ? t("kpWcNotDownloaded") : "";
      prog.hidden = !loading; prog.firstElementChild.style.width = pct() + "%";
      btn.textContent = ready() ? t("kpWcDelete") : t("kpWcDownload"); btn.disabled = loading || !st;
      let key, html;
      if (ready() && tags) { const tokens = CORE.label(SAMPLE, tags); key = "tags"; html = `<div class="kp-wc-line">${CORE.html(SAMPLE, tokens, dark(), ts => CORE.tip(ts, u => t("wc_" + u), u => globalThis.LHN_LANGUAGES?.t?.("wc_" + u, {}, "en") ?? u))}</div><div class="kp-wc-legend">${CORE.legend(tokens, u => t("wc_" + u), dark())}</div>`; }
      else if (ready()) { key = "busy"; html = `<p class="kp-wc-sample">${esc(SAMPLE)}</p><p class="kp-wc-note">${esc(t("kpWcPreviewBusy"))}</p>`; void tag(); }
      else if (loading) { key = "loading" + pct(); html = `<p class="kp-wc-sample">${esc(SAMPLE)}</p><p class="kp-wc-note">${esc(t("kpWcDownloading", { p:pct() }))}</p>`; }
      else { key = st ? "need" : "wait"; html = `<p class="kp-wc-sample">${esc(SAMPLE)}</p>` + (st ? `<button type="button" class="settings-action-button kp-wc-get">${esc(t("kpWcPreviewNeed"))}</button>` : ""); }
      key += "|" + lang() + "|" + dark();
      if (box.dataset.kpKey !== key) { box.dataset.kpKey = key; box.innerHTML = html; }
    }
    async function tag() {
      if (tagging) return; tagging = true;
      const r = await send("WORD_CLASS_TAG", { texts:[SAMPLE] }); tagging = false;
      if (r?.ok && Array.isArray(r.results?.[0])) tags = r.results[0]; else if (r?.needDownload && st) st = { ...st, downloaded:false };
      draw();
    }
    async function refresh() {
      clearTimeout(pollT);
      const r = await send("WORD_CLASS_STATUS"); if (r?.ok) { st = r; failed = !!r.error && !r.loading && !r.downloaded; }
      draw();
      if (st?.loading) pollT = setTimeout(refresh, 500);
    }
    async function download() {
      if (delT) { clearTimeout(delT); delT = 0; draw(); return; }
      failed = false; const r = await send("WORD_CLASS_DOWNLOAD"); if (r?.ok) st = r; draw(); refresh();
    }
    const removeNow = () => { clearTimeout(delT); delT = 0; tags = null; return send("WORD_CLASS_REMOVE").then(refresh); };
    function remove() {
      delT = setTimeout(removeNow, 5000); draw();
      kit?.undo?.show(() => { clearTimeout(delT); delT = 0; draw(); }, "kpDeleted");
    }
    btn.addEventListener("click", () => { if (ready()) remove(); else void download(); });
    box.addEventListener("click", e => { if (e.target.closest(".kp-wc-get")) void download(); });
    document.addEventListener("click", e => { if (e.target.closest?.('[data-settings-tab="wordClass"]')) void refresh(); }, true);
    addEventListener("pagehide", () => { if (delT) void removeNow(); });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void refresh(); });
    new MutationObserver(draw).observe(document.documentElement, { attributes:true, attributeFilter:["class", "lang"] });
    void refresh();
    return { sync:draw };
  }
  let ai = null, wc = null;
  globalThis.LHN_SETTINGS_PREVIEWS = Object.freeze({ init(kit) { dictionary(); ai = askAI(); wc = wordClass(kit); }, sync() { dictRender?.(); ai?.sync(); wc?.sync(); } });
})();
