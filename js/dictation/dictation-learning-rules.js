// Local-only rules for hinting proper nouns and recording eligible Dictation errors.
(() => {
  const STATS_VERSION = 3;
  const ERROR_TYPES = Object.freeze(["phonetic", "rule", "typo"]);
  const WORD_RE = /[\p{L}\p{N}’‘`´']+/gu;
  const SENTENCE_END = /[.!?。！？]/gu;
  const PRONOUN_I = new Set(["i", "i'm", "i’ve", "i've", "i’ll", "i'll", "i’d", "i'd"]);
  const TITLES = new Set(["mr", "mrs", "ms", "miss", "dr", "prof", "professor", "president", "sir", "lady", "lord", "capt", "captain"]);
  const UPPERCASE_STYLE_THRESHOLD = 0.75;

  function getWords(text) {
    return [...String(text ?? "").matchAll(WORD_RE)].map((match, index) => ({
      raw: match[0].replace(/^[’‘`´']+|[’‘`´']+$/g, ""),
      start: match.index,
      end: match.index + match[0].length,
      index,
    })).filter(token => globalThis.LHN_DICTATION_SCORE.tokenize(token.raw)[0]);
  }
  function isCapitalized(word) { return /^\p{Lu}[\p{Ll}\p{M}]/u.test(String(word ?? "")); }
  function isUppercaseAcronym(word) { return /^[\p{Lu}]{2,6}$/u.test(String(word ?? "")); }
  function isAtSentenceStart(source, token) {
    let boundary = -1;
    SENTENCE_END.lastIndex = 0;
    for (const match of source.matchAll(SENTENCE_END)) {
      if (match.index >= token.start) break;
      boundary = match.index;
    }
    return /^[\s\p{P}\p{S}]*$/u.test(source.slice(boundary + 1, token.start));
  }
  function getProperNounIndexes(text) {
    const source = String(text ?? "");
    const tokens = getWords(source);
    const indexes = new Set();
    if (!tokens.length) return indexes;
    const letterTokens = tokens.filter((token) => /\p{L}/u.test(token.raw));
    const uppercaseCount = letterTokens.filter((token) => token.raw === token.raw.toLocaleUpperCase() && /\p{Lu}/u.test(token.raw)).length;
    const allCapsStyle = letterTokens.length >= 3 && uppercaseCount / letterTokens.length >= UPPERCASE_STYLE_THRESHOLD;

    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      const lower = token.raw.toLocaleLowerCase();
      const sentenceStart = isAtSentenceStart(source, token);
      const previous = tokens[index - 1];
      const previousIsTitle = previous && TITLES.has(previous.raw.replace(/\p{P}/gu, "").toLocaleLowerCase());
      // Capitalization alone is not enough at the first lexical word, even after subtitle punctuation such as ">>".
      if (sentenceStart && !previousIsTitle) continue;
      const next = tokens[index + 1];
      const capitalized = isCapitalized(token.raw);
      const allCapsName = !allCapsStyle && isUppercaseAcronym(token.raw);
      const partOfCapitalizedName = capitalized && (
        (previous && isCapitalized(previous.raw)) || (next && isCapitalized(next.raw))
      );
      const apostropheName = /^[\p{Lu}][\p{Ll}]*['’][\p{Lu}][\p{Ll}]+$/u.test(token.raw);
      if (previousIsTitle || allCapsName || partOfCapitalizedName || apostropheName
        || (capitalized && !PRONOUN_I.has(lower))) indexes.add(index);
    }
    return indexes;
  }
  function getProperNounHints(text) {
    const tokens = getWords(text);
    const proper = getProperNounIndexes(text);
    const result = [];
    const seen = new Set();
    for (const index of proper) {
      const value = tokens[index]?.raw;
      const key = value?.toLocaleLowerCase();
      if (value && !seen.has(key)) {
        result.push(value);
        seen.add(key);
      }
    }
    return result;
  }
  function countLetters(value) { return (String(value ?? "").match(/\p{L}/gu) || []).length; }
  function isEligibleWord(word, index, properIndexes) {
    return countLetters(word) >= 4 && !properIndexes.has(index);
  }
  function normalizedErrorWord(value) {
    return String(value ?? "").toLocaleLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z]/g, "");
  }
  function editDistance(left, right) {
    const a = normalizedErrorWord(left), b = normalizedErrorWord(right);
    const row = Array.from({ length:b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
      let diagonal = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const previous = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
        diagonal = previous;
      }
    }
    return row[b.length];
  }
  function soundsLike(left, right) {
    const code = value => {
      const word = normalizedErrorWord(value)
        .replace(/^kn/, "n").replace(/^wr/, "r").replace(/^wh/, "w")
        .replace(/ph/g, "f").replace(/ck/g, "k").replace(/qu/g, "k")
        .replace(/tch/g, "ch").replace(/gh/g, "g");
      if (!word) return "";
      const group = char => "bfpv".includes(char) ? "1" : "cgjkqsxz".includes(char) ? "2"
        : "dt".includes(char) ? "3" : char === "l" ? "4" : "mn".includes(char) ? "5"
        : char === "r" ? "6" : "";
      let result = word[0];
      let previous = group(word[0]);
      for (const char of word.slice(1)) {
        const current = group(char);
        if (current && current !== previous) result += current;
        previous = current;
      }
      return result.toLocaleLowerCase();
    };
    return code(left) === code(right);
  }
  function hasSpellingRulePattern(target, typed) {
    const a = normalizedErrorWord(target), b = normalizedErrorWord(typed);
    if (!a || !b) return false;
    const swapIeEi = value => value.replace(/ie|ei/g, pair => pair === "ie" ? "ei" : "ie");
    if (swapIeEi(a) === b || swapIeEi(b) === a) return true;
    const collapseDouble = value => value.replace(/([a-z])\1/g, "$1");
    if (collapseDouble(a) === b || collapseDouble(b) === a) return true;
    if (a.replace(/e(?=(able|ible|ing|ed|er|est)$)/, "") === b
      || b.replace(/e(?=(able|ible|ing|ed|er|est)$)/, "") === a) return true;
    return false;
  }
  function classifyError(target, typed) {
    const a = normalizedErrorWord(target), b = normalizedErrorWord(typed);
    if (!a || !b) return "typo";
    if (hasSpellingRulePattern(a, b)) return "rule";
    const distance = editDistance(a, b);
    if (distance <= 1) return "typo";
    if (soundsLike(a, b)) return "phonetic";
    return "rule";
  }
  function errorContext(referenceSentence, tokenIndex, typed) {
    const source = String(referenceSentence ?? "");
    const token = getWords(source)[tokenIndex];
    if (!token || !typed) return null;
    return { before:source.slice(0, token.start), typed:String(typed), after:source.slice(token.end) };
  }

  function recordWrongWordSubmission(stats, cueIndex, result, referenceSentence, timestamp = Date.now()) {
    const score = globalThis.LHN_DICTATION_SCORE;
    if (!stats || stats.version !== STATS_VERSION || !stats.words || !Array.isArray(result?.ops) || !score) return false;
    const referenceWords = getWords(referenceSentence);
    const properIndexes = getProperNounIndexes(referenceSentence);
    const byWord = new Map();
    for (const operation of result.ops) {
      if (!operation || operation.type === "extra" || operation.type === "missing") continue;
      const indexes = Array.isArray(operation.expectedIndices) && operation.expectedIndices.length
        ? operation.expectedIndices : Number.isInteger(operation.expectedIndex) ? [operation.expectedIndex] : [];
      for (const tokenIndex of indexes) {
        const target = referenceWords[tokenIndex]?.raw;
        if (!target || !isEligibleWord(target, tokenIndex, properIndexes)) continue;
        const normalizedTarget = score.tokenize(target)[0] || "";
        if (!normalizedTarget) continue;
        if (!byWord.has(normalizedTarget)) byWord.set(normalizedTarget, []);
        byWord.get(normalizedTarget).push({ operation, tokenIndex, target });
      }
    }

    let changed = false;
    for (const [normalizedTarget, events] of byWord) {
      const storageKey = `w:${normalizedTarget}`;
      const hasError = events.some(({ operation }) => operation.type === "wrong");
      let item = stats.words[storageKey];
      if (!item && !hasError) continue;
      if (!item) {
        item = { word: events[0].target, errors: 0, corrections: 0, variants: {}, occurrences: {}, typeCounts: {}, typeFixes: {}, errorExamples: {}, lastErrorType: "rule", errorContext: null, lastResult: "wrong", lastAt: 0 };
        stats.words[storageKey] = item;
      }
      item.variants ||= {};
      item.occurrences ||= {};
      item.typeCounts ||= {};
      item.typeFixes ||= {};
      item.errorExamples ||= {};
      let itemChanged = false;
      for (const { operation, tokenIndex, target } of events) {
        const occurrenceKey = `o:${cueIndex}:${tokenIndex}:${normalizedTarget}`;
        let occurrence = item.occurrences[occurrenceKey];
        if (operation.type === "wrong") {
          occurrence ||= { pending: false, wrongStreak: 0 };
          item.errors++;
          occurrence.pending = true;
          occurrence.wrongStreak++;
          const typed = String(operation.typed || "");
          const normalizedVariant = score.tokenize(typed)[0] || "";
          const variantKey = `v:${normalizedVariant}`;
          const variant = item.variants[variantKey] || (item.variants[variantKey] = { text: typed, count: 0 });
          variant.count++;
          const errorType = classifyError(target, typed);
          item.typeCounts[errorType] = (Number(item.typeCounts[errorType]) || 0) + 1;
          item.lastErrorType = errorType;
          occurrence.errorType = errorType;
          const context = errorContext(referenceSentence, tokenIndex, typed);
          item.errorContext = context;
          item.errorExamples[errorType] = { ...(context || { before:"", typed, after:"" }), lastAt:timestamp };
          variant.typeCounts ||= {};
          variant.typeCounts[errorType] = (Number(variant.typeCounts[errorType]) || 0) + 1;
          item.occurrences[occurrenceKey] = occurrence;
          itemChanged = true;
        } else if (operation.type === "ok" && occurrence?.pending) {
          item.corrections++;
          const correctedType = ERROR_TYPES.includes(occurrence.errorType) ? occurrence.errorType : "rule";
          item.typeFixes[correctedType] = (Number(item.typeFixes[correctedType]) || 0) + 1;
          occurrence.pending = false;
          occurrence.wrongStreak = 0;
          itemChanged = true;
        }
      }
      if (itemChanged) {
        item.lastResult = hasError ? "wrong" : "correct";
        item.lastAt = timestamp;
        changed = true;
      }
    }
    return changed;
  }

  globalThis.LHN_DICTATION_RULES = Object.freeze({
    STATS_VERSION,
    getProperNounIndexes,
    getProperNounHints,
    countLetters,
    isEligibleWord,
    classifyError,
    errorContext,
    recordWrongWordSubmission,
  });
})();
