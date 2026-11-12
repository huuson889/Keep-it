// Cached flashcard DOM rendering. Session state and persistence stay in dashboard.js.
(() => {
  function createStudyView({ $, config, t, siteOf, tagsOf, appendContextSentence, slightlyDarkerHighlight, utils, translateSentence }) {
    const dom = {
      progress: $("studyProgress"), card: $("studyCard"), source: $("studyCardSource"), front: $("studyFront"), back: $("studyBack"),
      quote: $("studyQuote"), backQuote: $("studyBackQuote"), note: $("studyNote"), noteField: $("studyNoteField"),
      context: $("studyContext"), contextField: $("studyContextField"), frontContext: $("studyFrontContext"), frontContextField: $("studyFrontContextField"),
      contextTranslation: $("studyContextTranslation"), frontContextTranslation: $("studyFrontContextTranslation"),
      typedAnswerField: $("studyTypedAnswerField"), typedAnswerInput: $("studyTypedAnswer"), typedAnswerResult: $("studyTypedAnswerResult"),
      userAnswer: $("studyUserAnswer"), expectedAnswer: $("studyExpectedAnswer"), answerFeedback: $("studyAnswerFeedback"),
      definitionFront: $("studySearchDefinitionFront"), definitionBack: $("studySearchDefinitionBack"),
      definitionFrontOption: $("studySearchDefinitionFront").closest(".study-definition-shortcut-option"),
      definitionBackOption: $("studySearchDefinitionBack").closest(".study-definition-shortcut-option"),
      definitionFrontHint: $("studyDefinitionFrontShortcutHint"), definitionBackHint: $("studyDefinitionBackShortcutHint"),
      tags: $("studyTags"), ratings: $("studyRatings"),
      complete: $("studyComplete"), completeTitle: $("studyComplete").querySelector("h3"), summary: $("studySummary"),
      reveal: $("studyRevealBtn"), revealOption: $("studyRevealBtn").closest(".study-shortcut-option"), revealHint: $("studyRevealShortcutHint"), closeDone: $("closeStudyDone")
    };
    const gradeControls = Array.from(dom.ratings.querySelectorAll("[data-grade]")).map(button => ({
      button,
      label: button.querySelector(".study-grade-label"),
      hint: button.parentElement?.querySelector(".study-shortcut-hint")
    }));
    const shortcutInputs = Array.from($("studyShortcutDialog").querySelectorAll("[data-study-shortcut]"));
    const progressUI = (() => {
      const remaining = document.createElement("span"), separator = document.createElement("span"), remembered = document.createElement("span");
      remaining.className = "study-progress-stat study-progress-remaining";
      remembered.className = "study-progress-stat study-progress-remembered";
      separator.className = "study-progress-separator"; separator.textContent = "·";
      const remainingMarker = document.createElement("span"), remainingLabel = document.createElement("span");
      const rememberedMarker = document.createElement("span"), rememberedLabel = document.createElement("span");
      for (const marker of [remainingMarker, rememberedMarker]) {
        marker.className = "study-progress-marker"; marker.setAttribute("aria-hidden", "true");
      }
      remaining.append(remainingMarker, remainingLabel); remembered.append(rememberedMarker, rememberedLabel);
      dom.progress.replaceChildren(remaining, separator, remembered);
      return { remaining, separator, remembered, remainingLabel, rememberedLabel };
    })();
    const stripeByColor = Object.freeze(Object.fromEntries(
      Object.entries(config.HIGHLIGHT_COLORS).map(([name, color]) => [name, slightlyDarkerHighlight(color)])
    ));
    const translationState = new WeakMap();
    const gradeLabelKeys = { again: "studyAgainLabel", hard: "studyHardLabel", good: "studyGoodLabel", easy: "studyEasyLabel" };

    function renderTranslation(node, sourceText, options = {}, visible = true) {
      const source = String(sourceText || "").trim();
      if (!source || !visible) { node.hidden = true; node.textContent = ""; translationState.delete(node); return; }
      const sourceLanguage = options.sourceLanguage || "auto";
      const targetLanguage = options.targetLanguage || "vi";
      const identity = `${sourceLanguage}:${targetLanguage}:${source}`;
      const previous = translationState.get(node);
      if (previous?.identity === identity && (previous.status !== "error" || Date.now() < previous.retryAt)) return;
      const state = { identity, status: "loading", retryAt: 0 };
      translationState.set(node, state);
      node.hidden = false;
      node.textContent = "…";
      Promise.resolve(translateSentence(source, options)).then(translation => {
        if (translationState.get(node) !== state) return;
        if (typeof translation === "string" && translation.trim()) {
          state.status = "ready";
          node.textContent = translation.normalize("NFC");
        } else {
          translationState.delete(node);
          node.textContent = "";
          node.hidden = true;
        }
      }).catch(() => {
        if (translationState.get(node) !== state) return;
        state.status = "error";
        state.retryAt = Date.now() + 60000;
        node.textContent = "";
        node.hidden = true;
      });
    }

    function updateProgress(queueLength, rememberedCount) {
      if (!dom.progress.contains(progressUI.remaining)) {
        dom.progress.replaceChildren(progressUI.remaining, progressUI.separator, progressUI.remembered);
      }
      progressUI.remainingLabel.textContent = t("studyCardsLeft", { count: queueLength });
      progressUI.rememberedLabel.textContent = t("studyRememberedCount", { count: rememberedCount });
    }

    function updateShortcutHints(shortcuts, showShortcuts) {
      for (const { button, label, hint } of gradeControls) {
        const grade = button.dataset.grade;
        const name = button.dataset.shortLabel || t(gradeLabelKeys[grade]);
        const shortcut = utils.formatShortcut(shortcuts[grade]);
        if (label) label.textContent = name;
        if (hint) { hint.textContent = shortcut ? `(${shortcut})` : ""; hint.hidden = !showShortcuts || !shortcut; }
        button.title = showShortcuts && shortcut ? t("studyShortcutTooltip", { name, key: shortcut }) : name;
      }
      const revealShortcut = utils.formatShortcut(shortcuts.reveal);
      dom.reveal.title = showShortcuts && revealShortcut
        ? t("studyShortcutTooltip", { name: t("studyShowAnswer"), key: utils.formatShortcut(shortcuts.reveal) })
        : t("studyShowAnswer");
      if (dom.revealHint) {
        dom.revealHint.textContent = revealShortcut ? `(${revealShortcut})` : "";
        dom.revealHint.hidden = !showShortcuts || !revealShortcut;
      }
      const definitionShortcut = utils.formatShortcut(shortcuts.searchDefinition);
      const definitionName = t("searchNoteDefinition");
      for (const [link, hint] of [[dom.definitionFront, dom.definitionFrontHint], [dom.definitionBack, dom.definitionBackHint]]) {
        if (hint) { hint.textContent = definitionShortcut ? `(${definitionShortcut})` : ""; hint.hidden = !showShortcuts || !definitionShortcut; }
        if (link) link.title = showShortcuts && definitionShortcut ? t("studyShortcutTooltip", { name: definitionName, key: definitionShortcut }) : definitionName;
      }
      const closeHint = $("studyCompleteCloseHint");
      if (closeHint) { closeHint.textContent = "(Enter)"; closeHint.hidden = !showShortcuts; }
      dom.closeDone.title = showShortcuts ? t("studyShortcutTooltip", { name: t("close"), key: "Enter" }) : t("close");
    }

    function render({ item, queueLength, reviewed, remembered, autoSpeak, autoSpeakEnabled, stopSpeech, speakFace, settings = {}, translationSettings = {}, typedAnswer = "", showAnswer = false }) {
      if (!item) {
        stopSpeech();
        dom.card.hidden = true; dom.ratings.hidden = true; dom.complete.hidden = false;
        const noCardsYet = reviewed === 0;
        const title = t(noCardsYet ? "studyNoCards" : "studySessionDone");
        dom.progress.textContent = title;
        dom.completeTitle.textContent = title;
        dom.summary.textContent = noCardsYet ? t("studyPlayAllHint") : t("studySummary", { remembered, reviewed });
        return;
      }

      dom.card.hidden = false; dom.complete.hidden = true;
      dom.front.hidden = showAnswer; dom.back.hidden = !showAnswer; dom.ratings.hidden = !showAnswer;
      const site = siteOf(item), colorName = config.normalizeColor(item.color);
      dom.source.textContent = `${item.title || site} · ${site}`;
      const reverse = !!settings.reverseFlashcards;
      const frontSpeechLanguage = dom.front.querySelector("[data-study-speech-language]");
      if (frontSpeechLanguage) frontSpeechLanguage.dataset.studySpeechLanguage = reverse ? "note" : "quote";
      const expectedAnswer = reverse ? (item.quote || "") : (item.note || "");
      dom.quote.textContent = reverse ? (item.note || t("noNoteAdded")) : (item.quote || "");
      dom.backQuote.textContent = item.quote || "";
      const highlightColor = config.HIGHLIGHT_COLORS[colorName];
      const backQuoteStyle = dom.backQuote.parentElement.style;
      backQuoteStyle.setProperty("--study-quote-highlight", highlightColor);
      backQuoteStyle.setProperty("--study-quote-stripe", stripeByColor[colorName] || highlightColor);
      dom.note.textContent = item.note || t("noNoteAdded");
      dom.noteField.hidden = !item.note;
      dom.contextField.hidden = !item.contextNote;
      if (item.contextNote) appendContextSentence(dom.context, item.contextNote, item.quote);
      else dom.context.textContent = "";
      const translationOptions = { sourceLanguage: translationSettings.sourceLanguage || "auto", targetLanguage: translationSettings.targetLanguage || "vi" };
      renderTranslation(dom.contextTranslation, item.contextNote, translationOptions, translationSettings.showBack !== false);
      dom.frontContextField.hidden = !settings.showSentenceNoteFront || !item.contextNote;
      if (item.contextNote) appendContextSentence(dom.frontContext, item.contextNote, item.quote);
      else dom.frontContext.textContent = "";
      renderTranslation(dom.frontContextTranslation, item.contextNote, translationOptions, translationSettings.showFront !== false);
      dom.typedAnswerField.hidden = !settings.typeTheAnswer;
      dom.revealOption.hidden = !!settings.typeTheAnswer;
      dom.typedAnswerInput.value = typedAnswer;
      dom.typedAnswerResult.hidden = !settings.typeTheAnswer || !showAnswer;
      dom.userAnswer.textContent = typedAnswer || "—";
      dom.expectedAnswer.textContent = expectedAnswer || t("noNoteAdded");
      const normalizedUser = String(typedAnswer).trim().replace(/\s+/g, " ").toLocaleLowerCase();
      const normalizedExpected = String(expectedAnswer).trim().replace(/\s+/g, " ").toLocaleLowerCase();
      const isCorrect = !!normalizedExpected && normalizedUser === normalizedExpected;
      dom.answerFeedback.textContent = t(isCorrect ? "studyAnswerCorrect" : "studyAnswerIncorrect");
      dom.answerFeedback.classList.toggle("is-correct", isCorrect);
      dom.answerFeedback.classList.toggle("is-incorrect", !isCorrect);
      const showDefinition = !!settings.searchNoteDefinition && !!item.quote;
      const definitionLanguage = settings.definitionLanguage === "auto" ? (settings.displayLanguage || "en") : (settings.definitionLanguage || "en");
      const definitionQueries = [t("studyDefinitionQuery", { note: item.quote || "" }, definitionLanguage)];
      if (item.contextNote) definitionQueries.push(t("studyDefinitionContextQuery", { note: item.quote || "", sentence: item.contextNote }, definitionLanguage));
      const definitionUrl = new URL("https://www.google.com/search");
      definitionUrl.searchParams.set("q", definitionQueries.join("; "));
      definitionUrl.searchParams.set("hl", definitionLanguage);
      dom.definitionFrontOption.hidden = !showDefinition;
      dom.definitionBackOption.hidden = !showDefinition;
      dom.definitionFront.href = definitionUrl.href;
      dom.definitionBack.href = definitionUrl.href;

      const tags = tagsOf(item);
      dom.tags.hidden = !tags.length;
      if (tags.length) {
        const fragment = document.createDocumentFragment();
        for (const tag of tags) {
          const chip = document.createElement("span");
          chip.className = "tag-chip"; chip.textContent = tag; fragment.appendChild(chip);
        }
        dom.tags.replaceChildren(fragment);
      } else dom.tags.replaceChildren();

      const intervals = utils.intervals(item);
      for (const { button, label } of gradeControls) {
        const grade = button.dataset.grade;
        const labelKey = grade === "again" ? "studyAgainInterval" : grade === "hard" ? "studyHardInterval" : grade === "good" ? "studyGoodInterval" : "studyEasyInterval";
        const interval = grade === "again" ? `1 ${t("studyMinuteShort")}` : `${utils.formatDays(intervals[grade])} ${t("studyDayShort")}`;
        button.dataset.shortLabel = t(labelKey, { interval });
        if (label) label.textContent = button.dataset.shortLabel;
        else button.textContent = button.dataset.shortLabel;
      }
      updateProgress(queueLength, remembered);
      if (autoSpeak && autoSpeakEnabled) speakFace(item);
    }

    return Object.freeze({ render, updateProgress, updateShortcutHints, shortcutInputs });
  }

  globalThis.LHN_STUDY_VIEW = Object.freeze({ create: createStudyView });
})();
