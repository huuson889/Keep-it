// Pure flashcard algorithms live here so scheduling and shortcut behavior can
// be maintained independently from dashboard rendering and storage.
(() => {
  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function intervals(item) {
    const review = item.review || {};
    const reps = Math.max(0, Number(review.reps) || 0);
    const previousDays = Math.max(0, Number(review.intervalDays) || 0);
    const ease = Math.max(1.3, Math.min(3.5, Number(review.easeFactor) || 2.5));
    return {
      hard: reps ? Math.max(1, previousDays * 1.2) : 1,
      good: reps ? Math.max(1, previousDays * ease) : 3,
      easy: reps ? Math.max(1, previousDays * ease * 1.3) : 4
    };
  }

  function formatDays(days) {
    const rounded = Math.round(days * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function formatShortcut(key) {
    const names = { ArrowLeft: "Left", ArrowUp: "Up", ArrowDown: "Down", ArrowRight: "Right", " ": "Space", Space: "Space", Enter: "Enter", Backspace: "Backspace", Escape: "Escape", Delete: "Delete", Tab: "Tab" };
    return String(key || "").split("+").map(part => names[part] || (part.length === 1 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())).join("+");
  }

  function shortcutFromEvent(event) {
    const modifierKeys = { Control: "Ctrl", Alt: "Alt", Shift: "Shift", Meta: "Meta" };
    if (modifierKeys[event.key]) {
      const pressed = modifierKeys[event.key], modifiers = [];
      if (event.ctrlKey && pressed !== "Ctrl") modifiers.push("Ctrl");
      if (event.altKey && pressed !== "Alt") modifiers.push("Alt");
      if (event.shiftKey && pressed !== "Shift") modifiers.push("Shift");
      if (event.metaKey && pressed !== "Meta") modifiers.push("Meta");
      return [...modifiers, pressed].join("+");
    }
    const key = event.key === " " ? "Space" : event.key.length === 1 ? event.key.toUpperCase() : event.key;
    const modifiers = [];
    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Meta");
    return [...modifiers, key].join("+");
  }

  globalThis.LHN_STUDY_UTILS = Object.freeze({ shuffle, intervals, formatDays, formatShortcut, shortcutFromEvent });
})();
