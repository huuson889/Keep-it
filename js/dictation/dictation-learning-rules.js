// Local-only rules for hinting proper nouns and recording eligible Dictation errors.
(() => {
  const STATS_VERSION = 2;
  const WORD_RE = /[\p{L}\p{N}’‘`´']+/gu;
  const SENTENCE_END = /[.!?。！？]/gu;
  const PRONOUN_I = new Set(["i", "i'm", "i’ve", "i've", "i’ll", "i'll", "i’d", "i'd"]);
  const TITLES = new Set(["mr", "mrs", "ms", "miss", "dr", "prof", "professor", "president", "sir", "lady", "lord", "capt", "captain"]);
  const KNOWN_SENTENCE_INITIAL_NAMES = new Set([
    "aaron", "abigail", "adam", "alex", "alice", "amelia", "amy", "andrew", "anna", "anthony", "ava",
    "ben", "benjamin", "brian", "charles", "charlotte", "chris", "daniel", "david", "emma", "ethan",
    "george", "grace", "hannah", "henry", "jake", "james", "jane", "jason", "jennifer", "john", "joseph",
    "julia", "kate", "kevin", "laura", "liam", "lily", "lucas", "luke", "maria", "mary", "matthew",
    "michael", "nancy", "nicholas", "olivia", "paul", "peter", "rachel", "richard", "robert", "sam",
    "sarah", "sophie", "steven", "susan", "thomas", "william", "zack",
    "january", "february", "march", "april", "june", "july", "august", "september", "october", "november", "december",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
  ]);
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
    return /^[\s\p{Ps}\p{Pi}"'“‘]*$/u.test(source.slice(boundary + 1, token.start));
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
      const next = tokens[index + 1];
      const capitalized = isCapitalized(token.raw);
      const allCapsName = !allCapsStyle && isUppercaseAcronym(token.raw);
      const partOfCapitalizedName = capitalized && (
        (previous && isCapitalized(previous.raw)) || (next && isCapitalized(next.raw))
      );
      const initialName = sentenceStart && KNOWN_SENTENCE_INITIAL_NAMES.has(lower);
      const apostropheName = /^[\p{Lu}][\p{Ll}]*['’][\p{Lu}][\p{Ll}]+$/u.test(token.raw);
      if (previousIsTitle || allCapsName || partOfCapitalizedName || initialName || apostropheName
        || (capitalized && !sentenceStart && !PRONOUN_I.has(lower))) indexes.add(index);
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
        item = { word: events[0].target, errors: 0, corrections: 0, variants: {}, occurrences: {}, lastResult: "wrong", lastAt: 0 };
        stats.words[storageKey] = item;
      }
      item.variants ||= {};
      item.occurrences ||= {};
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
          item.occurrences[occurrenceKey] = occurrence;
          itemChanged = true;
        } else if (operation.type === "ok" && occurrence?.pending) {
          item.corrections++;
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
    recordWrongWordSubmission,
  });
})();
