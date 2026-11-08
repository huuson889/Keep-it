(() => {
  const PERSISTED_FIELDS = Object.freeze(['quote', 'note', 'contextNote', 'url', 'title', 'hostname', 'thumbnailUrl', 'prefix', 'suffix', 'createdAt', 'color', 'tags']);
  function buildRecord(fields) {
    return {
      quote:fields.quote, note:fields.note, contextNote:fields.contextNote, tags:fields.tags, color:fields.color,
      url:fields.url, title:fields.title, hostname:fields.hostname, thumbnailUrl:fields.thumbnailUrl,
      prefix:fields.prefix, suffix:fields.suffix, createdAt:fields.createdAt
    };
  }
  function isUnchanged(existing, next) {
    if (!existing || !next) return false;
    return PERSISTED_FIELDS.every(key => JSON.stringify(existing[key]) === JSON.stringify(next[key]));
  }
  function createFields({ document, colors:colorNames, colorMap, colorLabelKey, selectedColor, existing, t, makeButton, onSelectColor, onSetDefaultColor, onClose, createTagEditor }) {
    const arrow = document.createElement("div"); arrow.className = "lhn-popup-arrow"; arrow.setAttribute("aria-hidden", "true");
    const colors = document.createElement("div"); colors.className = "lhn-colors";
    colorNames.forEach(color => {
      const option = document.createElement("span"); option.className = "lhn-color-option lhn-compose-color-option"; option.dataset.color = color;
      const button = document.createElement("button"); button.className = "lhn-color"; button.dataset.color = color; button.title = t(colorLabelKey(color)); button.setAttribute("aria-label", button.title); button.setAttribute("aria-pressed", String(color === selectedColor)); button.style.background = colorMap[color];
      button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); onSelectColor(color, colors, textarea); });
      const star = makeButton("", "lhn-color-default-star", event => { event.preventDefault(); event.stopPropagation(); onSetDefaultColor(color, colors, textarea); });
      star.title = `${t("setDefaultColor")}: ${t(colorLabelKey(color))}`; star.setAttribute("aria-label", star.title); star.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z"/></svg>';
      const check = document.createElement("span"); check.className = "lhn-color-default-check"; check.textContent = "✓"; check.setAttribute("aria-hidden", "true");
      option.append(button, star, check); colors.appendChild(option);
    });
    const toolbar = document.createElement("div"); toolbar.className = "lhn-composer-toolbar";
    const closeButton = makeButton("×", "lhn-close-btn", onClose); closeButton.setAttribute("aria-label", t("cancel")); closeButton.title = t("cancel"); toolbar.append(colors, closeButton);
    const inputWrap = document.createElement("div"); inputWrap.className = "lhn-input-wrap";
    const noteIcon = document.createElement("span"); noteIcon.className = "lhn-note-icon"; noteIcon.setAttribute("aria-hidden", "true"); noteIcon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 3h7l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M10 13h6M10 17h6"/></svg>';
    const textarea = document.createElement("textarea"); textarea.rows = 2; textarea.placeholder = t("notePlaceholder"); textarea.value = existing?.note || ""; textarea.setAttribute("aria-label", t("noteAria"));
    const tagField = document.createElement("label"); tagField.className = "lhn-composer-tags-field";
    const tagCaption = document.createElement("span"); tagCaption.dataset.lhnI18n = "tagsLabel"; tagCaption.textContent = t("tagsLabel");
    const tagEditor = createTagEditor(existing?.tags || [], "lhn-composer-tags", t); tagField.append(tagCaption, tagEditor.element);
    const resizeNote = () => { textarea.style.height = "54px"; textarea.style.height = Math.max(54, textarea.scrollHeight) + "px"; };
    textarea.addEventListener("input", resizeNote); inputWrap.append(noteIcon, textarea);
    return { arrow, colors, toolbar, inputWrap, textarea, tagField, tagEditor, resizeNote };
  }
  globalThis.LHN_NOTE_COMPOSER = Object.freeze({ buildRecord, isUnchanged, createFields });
})();
