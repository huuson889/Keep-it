/* Nguồn duy nhất cho mọi giá trị mặc định của extension.
   Khi cần giá trị mặc định, đọc từ globalThis.LHN_DEFAULTS — không khai báo lại ở nơi khác. */
(() => {
  const deepFreeze = value => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(deepFreeze);
      Object.freeze(value);
    }
    return value;
  };

  const READER_DISABLED_WEBSITES = deepFreeze(["facebook.com", "messenger.com", "zalo.me", "youtube.com", "netflix.com", "github.com", "stackoverflow.com", "discord.com", "telegram.org", "twitch.tv", "soundcloud.com", "spotify.com", "google.com", "linkedin.com", "twitter.com", "x.com", "reddit.com", "tiktok.com", "instagram.com", "dropbox.com", "paypal.com", "behance.net", "dribbble.com", "figma.com", "canva.com", "chatgpt.com", "claude.ai"]);

  const settings = deepFreeze({
    showOnSelect: false,
    autoHighlight: false,
    sentenceNoteEnabled: true,
    autoTranslate: true,
    autoSpeakSelectedText: true,
    speechVoice: "google",
    speechRate: 1,
    useLanguageSpeechRate: true,
    speechRateByLanguage: { en: 1.25, vi: 1.25, ko: 1.25 },
    hasCustomSpeechRateByLanguage: {},
    inheritedSpeechRateByLanguage: {},
    translateIconEnabled: false,
    translateIconStyle: "3",
    autoSpeakOnTranslate: true,
    translationPopupEnabled: false,
    showFullEnglishDictionary: true,
    sidebarIndicatorEnabled: true,
    sidebarIndicatorOnDisabledSites: true,
    chatGPTAutoSend: true,
    chatGPTSummaryPrompt: "Hãy tóm tắt web này",
    chatGPTAskPrompt: "Đoạn này trên web nghĩa là sao?",
    defaultHighlightColor: "yellow",
    shortcut: "Alt+S",
    sidebarShortcut: "Alt+Q",
    translateSelectedShortcut: "Alt+W",
    toggleWebsiteShortcut: "Alt+Z",
    dualSubtitlesShortcut: "Alt+E",
    dictationShortcut: "Alt+F",
    speechPauseShortcut: "Space",
    previousReadingShortcut: "Left",
    nextReadingShortcut: "Right",
    increaseReadingSpeedShortcut: "Up",
    decreaseReadingSpeedShortcut: "Down",
    selectVoiceShortcut: "Alt+L",
    disabledWebsites: []
  });

  const chatGPTPrompts = deepFreeze({
    en:{ websiteLabel:"Website", summary:"Summarize this website", ask:"What does this part of the website mean?" },
    vi:{ websiteLabel:"Trang web", summary:"Hãy tóm tắt web này", ask:"Đoạn này trên web nghĩa là sao?" },
    ko:{ websiteLabel:"웹사이트", summary:"이 웹사이트를 요약해 주세요", ask:"이 부분은 웹사이트에서 무슨 뜻인가요?" }
  });
  const legacyChatGPTAskPrompts = deepFreeze(["đoạn này trên web là sao?"]);

  const reader = deepFreeze({
    accentColor: "#9c27b0",
    fontFamily: "'Inter', sans-serif",
    webFontFamily: "",
    translationTextColor: "default",
    translationCustomColor: "#2d3748",
    translationTextWeight: "auto",
    translationFontScale: 80,
    skipSameLang: true,
    autoScroll: true,
    enableTTS: true,
    speakerIconVisibility: "hover",
    readTranslation: true,
    speechSpeedStep: 0.25,
    voiceMode: "google",
    browserVoiceURI: "",
    readerShortcutsEnabled: true,
    autoDetectVoice: true,
    widgetDarkMode: null,
    excludeSelectors: [],
    readerDisabledWebsites: READER_DISABLED_WEBSITES,
    readerDefaultSitesSeeded: true
  });

  const studyTranslation = deepFreeze({ showFront: false, showBack: true, sourceLanguage: "auto", targetLanguage: "auto" });

  const flashcard = deepFreeze({
    useDashboardSettings: true,
    useDashboardSpeechSettings: true,
    sourceLanguage: "auto",
    targetLanguage: "auto",
    speechVoice: "google",
    speechRate: 1,
    flashcardEnglishSpeechRate: 1.2,
    flashcardSpeechRateByLanguage: {},
    hasCustomFlashcardLanguageSpeechRate: {},
    hasCustomSpeechRate: false,
    hasCustomEnglishSpeechRate: false,
    highlightSpeechLanguage: "auto",
    noteSpeechLanguage: "auto",
    speechLanguageSettingsRevision: {}
  });

  // Giao diện YouTube song ngữ (giữ nguyên bộ giá trị của bản tham chiếu v1.12).
  const youtube = deepFreeze({
    theme: "dark",
    size: "M",
    theaterSize: "M",
    readingMode: false,
    preferredVideoMode: "combined",
    preferredLearningMode: "typing",
    readingViewSize: "M",
    learningViewSize: "S",
    readingSubtitle: { en: { pct: 100, color: null }, vi: { pct: 90, color: null } },
    theaterSubtitle: { backgroundColor: "#000000", opacity: 40, y: 82, positionSpace: "frame-v1", useDefaultPosition: true },
    splitSentences: true,
    videoTranslationPopupEnabled: true,
    videoClickToSpeak: true,
    hideControls: false,
    ambient: true,
    ambientStyle: '3',
    side: { en: { pct: 100, color: null }, vi: { pct: 90, color: null } },
    sub: { font: null, bold: false, en: { pct: 100, color: null }, vi: { pct: 90, color: null } }
  });

  globalThis.LHN_DEFAULTS = deepFreeze({ settings, reader, studyTranslation, flashcard, youtube, chatGPTPrompts, legacyChatGPTAskPrompts, readerDisabledWebsites: READER_DISABLED_WEBSITES });
  const promptFields = Object.freeze({ chatGPTSummaryPrompt:"summary", chatGPTAskPrompt:"ask" });
  const normalizePrompt = value => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 500);
  const isKnownDefault = (key, value) => {
    const field = promptFields[key];
    if (!field) return false;
    const normalized = normalizePrompt(value);
    const localized = Object.values(chatGPTPrompts).some(prompts => prompts[field] === normalized);
    return localized || (key === "chatGPTAskPrompt" && legacyChatGPTAskPrompts.includes(normalized));
  };
  globalThis.LHN_CHATGPT_PROMPTS = Object.freeze({
    defaultFor(language, key) {
      const field = promptFields[key];
      if (!field) return "";
      return (chatGPTPrompts[language] || chatGPTPrompts.en)[field];
    },
    resolve(language, key, value) {
      const normalized = normalizePrompt(value);
      return !normalized || isKnownDefault(key, normalized) ? this.defaultFor(language, key) : normalized;
    },
    websiteLabel(language) { return (chatGPTPrompts[language] || chatGPTPrompts.en).websiteLabel; },
    isDefault: isKnownDefault
  });
})();
