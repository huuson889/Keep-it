/* Shared, named constants used by the extension's UI and storage layers. */
(() => {
  const COLORS = Object.freeze(["yellow", "green", "purple", "red", "blue", "orange"]);
  const COLOR_YELLOW = "#fff3a6";
  const COLOR_GREEN = "#c2f0bd";
  const COLOR_PURPLE = "#d5cbff";
  const COLOR_RED = "#ffc7c7";
  const COLOR_BLUE = "#c3e4ff";
  const COLOR_ORANGE = "#ffd0a3";
  const HIGHLIGHT_COLORS = Object.freeze({ yellow: COLOR_YELLOW, green: COLOR_GREEN, purple: COLOR_PURPLE, red: COLOR_RED, blue: COLOR_BLUE, orange: COLOR_ORANGE });
  const DEFAULT_COLOR = "yellow";
  const ACTION_ICON_PATHS = Object.freeze({
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'
  });
  const COLOR_LABEL_KEYS = Object.freeze({ yellow: "colorYellow", green: "colorGreen", purple: "colorPurple", red: "colorRed", blue: "colorBlue", orange: "colorOrange" });
  const DEFAULT_SETTINGS = Object.freeze({
    showOnSelect: false,
    autoHighlight: true,
    sentenceNoteEnabled: true,
    autoTranslate: true,
    autoSpeakSelectedText: true,
    speechVoice: "google",
    speechRate: 1,
    useLanguageSpeechRate: true,
    speechRateByLanguage: Object.freeze({ en: 1.2, vi: 1.2, ko: 1.2 }),
    hasCustomSpeechRateByLanguage: Object.freeze({}),
    inheritedSpeechRateByLanguage: Object.freeze({}),
    translateIconEnabled: false,
    autoSpeakOnTranslate: true,
    translationPopupEnabled: false,
    showFullEnglishDictionary: true,
    sidebarIndicatorEnabled: true,
    sidebarIndicatorOnDisabledSites: true,
    defaultHighlightColor: DEFAULT_COLOR,
    shortcut: "Alt+S",
    sidebarShortcut: "Alt+Q",
    translateSelectedShortcut: "Alt+W",
    toggleWebsiteShortcut: "Alt+Z",
    speechPauseShortcut: "Space",
    previousReadingShortcut: "Left",
    nextReadingShortcut: "Right",
    increaseReadingSpeedShortcut: "Up",
    decreaseReadingSpeedShortcut: "Down",
    disabledWebsites: []
  });

  globalThis.LHN_CONFIG = Object.freeze({
    STORAGE_KEYS: Object.freeze({
      ANNOTATIONS: "annotations",
      SETTINGS: "lhnSettings",
      FAVORITES: "lhnFavorites",
      NOTE_FAVORITES: "lhnFavoriteNotes"
    }),
    DEFAULT_SETTINGS,
    DATABASE: Object.freeze({
      NAME: "local-highlight-notes",
      VERSION: 1,
      ANNOTATIONS_STORE: "annotations",
      LEGACY_MIGRATION_KEY: "lhnIndexedDbMigrationV1"
    }),
    LIMITS: Object.freeze({
      DATABASE_BATCH_SIZE: 500,
      RESTORE_IDLE_BATCH_SIZE: 8,
      SIDEBAR_RENDER_CHUNK_SIZE: 64,
      DASHBOARD_SOURCE_INITIAL: 48,
      DASHBOARD_SOURCE_BATCH: 32,
      DASHBOARD_NOTE_INITIAL: 36,
      DASHBOARD_NOTE_BATCH: 24,
      DASHBOARD_LIST_PREFETCH_PX: 360,
      SUPABASE_SYNC_BATCH_SIZE: 250
    }),
    COLORS,
    DEFAULT_COLOR,
    ACTION_ICON_PATHS,
    HIGHLIGHT_COLORS,
    applyHighlightColors(target = document.documentElement) {
      for (const color of COLORS) target.style.setProperty(`--lhn-highlight-${color}`, HIGHLIGHT_COLORS[color]);
    },
    TIMINGS: Object.freeze({
      DASHBOARD_SEARCH_DEBOUNCE_MS: 80,
      REMOVE_ANIMATION_MS: 150,
      TOAST_MS: 2200,
      SETTINGS_STATUS_MS: 1500
    }),
    normalizeColor(color) {
      return COLORS.includes(color) ? color : DEFAULT_COLOR;
    },
    colorLabelKey(color) {
      return COLOR_LABEL_KEYS[this.normalizeColor(color)];
    }
  });
})();

globalThis.LHN_PREPROCESS_SPEECH = function (text, lang, settings) {
  const source = String(text ?? "");
  const dictionaries = settings?.customPronunciationDictionary;
  if (!source || !dictionaries || typeof dictionaries !== "object") return source;
  const normalizedLanguage = String(lang || "").trim().replace(/_/g, "-").toLowerCase();
  const languageKey = Object.keys(dictionaries).find(key => key.toLowerCase() === normalizedLanguage)
    || Object.keys(dictionaries).find(key => key.split("-")[0].toLowerCase() === normalizedLanguage.split("-")[0]);
  const rules = Array.isArray(dictionaries[languageKey]) ? dictionaries[languageKey] : [];
  const byOriginal = new Map();
  for (const rule of rules) {
    const original = String(rule?.original || "").trim();
    const pronunciation = String(rule?.replacement || "").trim();
    if (original && pronunciation && !byOriginal.has(original.toLocaleLowerCase())) byOriginal.set(original.toLocaleLowerCase(), pronunciation);
  }
  if (!byOriginal.size) return source;
  const alternatives = [...byOriginal.keys()].sort((a, b) => b.length - a.length).map(value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(^|[^\\p{L}\\p{M}\\p{N}_])(${alternatives.join("|")})(?![\\p{L}\\p{M}\\p{N}_])`, "giu");
  return source.replace(pattern, (_match, prefix, matched) => prefix + byOriginal.get(matched.toLocaleLowerCase()));
};
