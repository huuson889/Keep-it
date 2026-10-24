(() => {
  function createTagEditor(initialTags = [], className = "", t) {

    const element = document.createElement("div"); element.className = `lhn-tag-editor ${className}`.trim();
    const input = document.createElement("input"); input.type = "text"; input.placeholder = t("tagsPlaceholder"); input.setAttribute("aria-label", t("tagsLabel"));
    let tags = [], draft = "";
    const normalize = values => { const seen = new Set(); return values.map(value => String(value || "").trim()).filter(value => { const key = value.toLocaleLowerCase(); if (!key || seen.has(key)) return false; seen.add(key); return true; }); };
    const render = () => {
      element.replaceChildren();
      tags.forEach((tag, index) => { const chip = document.createElement("span"); chip.className = "lhn-tag-chip"; chip.append(document.createTextNode(tag)); chip.addEventListener("click", event => { if (event.target.closest("button")) return; tags.splice(index, 1); draft = tag; input.value = tag; render(); input.focus({ preventScroll: true }); input.setSelectionRange(0, input.value.length); }); const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `${t("delete")}: ${tag}`); remove.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); tags.splice(index, 1); render(); input.focus({ preventScroll: true }); }); chip.appendChild(remove); element.appendChild(chip); });
      element.appendChild(input);
    };
    const commit = value => { const parts = String(value || "").split(","); tags = normalize([...tags, ...parts.slice(0, -1), parts.at(-1)]); input.value = ""; draft = ""; render(); input.focus({ preventScroll: true }); };
    tags = normalize(Array.isArray(initialTags) ? initialTags : String(initialTags || "").split(","));
    input.addEventListener("keydown", event => {
      if (event.key === "," || event.key === "Enter") { event.preventDefault(); event.stopPropagation(); commit(input.value); }
      else if (event.key === "Backspace" && !input.value && tags.length) { event.preventDefault(); tags.pop(); render(); input.focus({ preventScroll: true }); }
      else if (event.key === "Escape") event.stopPropagation();
    });
    input.addEventListener("input", () => { if (input.value.includes(",")) commit(input.value); else draft = input.value; });
    element.addEventListener("click", () => input.focus({ preventScroll: true })); render();
    return { element, getTags: () => normalize([...tags, draft]) };
  }
  globalThis.LHN_UI_COMPONENTS = Object.freeze({ createTagEditor });
})();
