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
  function createFields({ document, colors:colorNames, colorMap, selectedColor, existing, t, makeButton, onSelectColor, onSetDefaultColor, onClose, createTagEditor }) {
    const arrow = document.createElement("div"); arrow.className = "lhn-popup-arrow"; arrow.setAttribute("aria-hidden", "true");
    const colors = document.createElement("div"); colors.className = "lhn-colors";
    colorNames.forEach(color => {
      const option = document.createElement("span"); option.className = "lhn-color-option lhn-compose-color-option"; option.dataset.color = color;
      const button = document.createElement("button"); button.className = "lhn-color"; button.dataset.color = color; button.title = t(`color${color[0].toUpperCase()}${color.slice(1)}`); button.setAttribute("aria-label", button.title); button.setAttribute("aria-pressed", String(color === selectedColor)); button.style.background = colorMap[color];
      button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); onSelectColor(color, colors, textarea); });
      const star = makeButton("", "lhn-color-default-star", event => { event.preventDefault(); event.stopPropagation(); onSetDefaultColor(color, colors, textarea); });
      star.title = `${t("setDefaultColor")}: ${t(`color${color[0].toUpperCase()}${color.slice(1)}`)}`; star.setAttribute("aria-label", star.title); star.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>';
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
