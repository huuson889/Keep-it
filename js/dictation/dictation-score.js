// Dictation scoring: case- and punctuation-insensitive word matching, plus standard English contractions.
(() => {
  const APOS = /[’‘`´']/g;
  const WORDS = /[\p{L}\p{N}’‘`´']+/gu;
  const normWord = (word) => String(word ?? "").toLowerCase().replace(APOS, "").replace(/[^\p{L}\p{N}]+/gu, "");
  const rawWords = (text) => [...String(text ?? "").matchAll(WORDS)]
    .map((match, index) => ({
      raw: match[0].replace(/^[’‘`´']+|[’‘`´']+$/g, ""),
      norm: normWord(match[0]),
      start: match.index,
      end: match.index + match[0].length,
      index,
    }))
    .filter((word) => word.norm);
  const tokenize = (text) => rawWords(text).map((word) => word.norm);

  // Only standard apostrophe contractions are expanded; colloquialisms such as "gonna" are not included.
  const contractionRules = [
    ["I'm", ["I am"]], ["you're", ["you are"]], ["we're", ["we are"]], ["they're", ["they are"]],
    ["he's", ["he is", "he has"]], ["she's", ["she is", "she has"]], ["it's", ["it is", "it has"]],
    ["that's", ["that is", "that has"]], ["there's", ["there is", "there has"]], ["what's", ["what is", "what has"]],
    ["who's", ["who is", "who has"]], ["where's", ["where is", "where has"]], ["when's", ["when is"]],
    ["why's", ["why is"]], ["how's", ["how is"]], ["I've", ["I have"]], ["you've", ["you have"]],
    ["we've", ["we have"]], ["they've", ["they have"]], ["could've", ["could have"]], ["would've", ["would have"]],
    ["should've", ["should have"]], ["might've", ["might have"]], ["must've", ["must have"]],
    ["I'll", ["I will"]], ["you'll", ["you will"]], ["he'll", ["he will"]], ["she'll", ["she will"]],
    ["it'll", ["it will"]], ["we'll", ["we will"]], ["they'll", ["they will"]], ["that'll", ["that will"]],
    ["there'll", ["there will"]], ["who'll", ["who will"]], ["what'll", ["what will"]],
    ["I'd", ["I would", "I had"]], ["you'd", ["you would", "you had"]], ["he'd", ["he would", "he had"]],
    ["she'd", ["she would", "she had"]], ["it'd", ["it would", "it had"]], ["we'd", ["we would", "we had"]],
    ["they'd", ["they would", "they had"]], ["that'd", ["that would", "that had"]], ["there'd", ["there would", "there had"]],
    ["don't", ["do not"]], ["doesn't", ["does not"]], ["didn't", ["did not"]], ["isn't", ["is not"]],
    ["aren't", ["are not"]], ["wasn't", ["was not"]], ["weren't", ["were not"]], ["haven't", ["have not"]],
    ["hasn't", ["has not"]], ["hadn't", ["had not"]], ["won't", ["will not"]], ["wouldn't", ["would not"]],
    ["can't", ["can not", "cannot"]], ["couldn't", ["could not"]], ["shouldn't", ["should not"]],
    ["mustn't", ["must not"]], ["needn't", ["need not"]], ["shan't", ["shall not"]], ["let's", ["let us"]],
  ].map(([form, expansions]) => ({ key: normWord(form), form, expansions: expansions.map((phrase) => tokenize(phrase)) }));
  const hasApostrophe = (word) => /[’‘']/u.test(String(word ?? ""));

  function findSequences(tokens, sequence) {
    if (!sequence.length) return [];
    const found = [];
    for (let start = 0; start <= tokens.length - sequence.length; start++) {
      let match = true;
      for (let offset = 0; offset < sequence.length; offset++) {
        if (tokens[start + offset].norm !== sequence[offset]) { match = false; break; }
      }
      if (match) found.push({ start, end: start + sequence.length - 1 });
    }
    return found;
  }

  function pairGroups(contractTokens, expansionMatches, contractGroups, expansionGroups, contractUsed, expansionUsed, key) {
    for (const contractIndex of contractTokens) {
      if (contractUsed.has(contractIndex)) continue;
      const candidates = expansionMatches.filter((span) => {
        for (let i = span.start; i <= span.end; i++) if (expansionUsed.has(i)) return false;
        return true;
      });
      if (!candidates.length) continue;
      const selected = candidates.sort((a, b) => a.start - b.start)[0];
      contractGroups.set(contractIndex, { start: contractIndex, end: contractIndex, norm: `contraction:${key}` });
      expansionGroups.set(selected.start, { start: selected.start, end: selected.end, norm: `contraction:${key}` });
      contractUsed.add(contractIndex);
      for (let i = selected.start; i <= selected.end; i++) expansionUsed.add(i);
      expansionMatches = expansionMatches.filter((span) => span.end < selected.start || span.start > selected.end);
    }
  }

  function makeUnits(text, tokens, groups) {
    const source = String(text ?? "");
    const units = [];
    for (let index = 0; index < tokens.length;) {
      const group = groups.get(index);
      const endIndex = group?.end ?? index;
      const first = tokens[index], last = tokens[endIndex];
      units.push({
        norm: group?.norm ?? first.norm,
        raw: source.slice(first.start, last.end),
        start: first.start,
        end: last.end,
        sourceIndices: Array.from({ length: endIndex - index + 1 }, (_, offset) => index + offset),
      });
      index = endIndex + 1;
    }
    return units;
  }

  function comparisonUnits(referenceText, typedText) {
    const referenceTokens = rawWords(referenceText), typedTokens = rawWords(typedText);
    const referenceGroups = new Map(), typedGroups = new Map();
    const referenceUsed = new Set(), typedUsed = new Set();
    for (const rule of contractionRules) {
      const referenceContractions = referenceTokens.flatMap((word, index) => word.norm === rule.key && hasApostrophe(word.raw) ? [index] : []);
      const typedContractions = typedTokens.flatMap((word, index) => word.norm === rule.key && hasApostrophe(word.raw) ? [index] : []);
      const typedExpansions = rule.expansions.flatMap((expansion) => findSequences(typedTokens, expansion));
      const referenceExpansions = rule.expansions.flatMap((expansion) => findSequences(referenceTokens, expansion));
      pairGroups(referenceContractions, typedExpansions, referenceGroups, typedGroups, referenceUsed, typedUsed, rule.key);
      pairGroups(typedContractions, referenceExpansions, typedGroups, referenceGroups, typedUsed, referenceUsed, rule.key);
    }
    return {
      reference: makeUnits(referenceText, referenceTokens, referenceGroups),
      typed: makeUnits(typedText, typedTokens, typedGroups),
      referenceTokens,
      typedTokens,
    };
  }

  function align(ref, typed) {
    const n = ref.length, m = typed.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = ref[i].norm === typed[j].norm ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const ok = new Array(n).fill(false);
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (ref[i].norm === typed[j].norm) { ok[i] = true; i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return ok;
  }

  function makeOperation(type, expected, typed) {
    return {
      type,
      ...(typed ? { typed: typed.raw, typedIndex: typed.sourceIndices[0], typedIndices: typed.sourceIndices.slice() } : {}),
      ...(expected ? { expected: expected.raw, expectedIndex: expected.sourceIndices[0], expectedIndices: expected.sourceIndices.slice() } : {}),
    };
  }

  function diffUnits(ref, typed) {
    const n = ref.length, m = typed.length;
    const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) d[i][0] = i;
    for (let j = 0; j <= m; j++) d[0][j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        d[i][j] = Math.min(
          d[i - 1][j - 1] + (ref[i - 1].norm === typed[j - 1].norm ? 0 : 1),
          d[i - 1][j] + 1,
          d[i][j - 1] + 1
        );
      }
    }
    const ops = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        const same = ref[i - 1].norm === typed[j - 1].norm;
        if (d[i][j] === d[i - 1][j - 1] + (same ? 0 : 1)) {
          ops.push(makeOperation(same ? "ok" : "wrong", ref[i - 1], typed[j - 1]));
          i--; j--;
          continue;
        }
      }
      if (i > 0 && d[i][j] === d[i - 1][j] + 1) { ops.push(makeOperation("missing", ref[i - 1], null)); i--; }
      else { ops.push(makeOperation("extra", null, typed[j - 1])); j--; }
    }
    return ops.reverse();
  }

  function diff(referenceText, typedText) {
    const comparison = comparisonUnits(referenceText, typedText);
    return diffUnits(comparison.reference, comparison.typed);
  }

  function positionalDiff(referenceText, typedText) {
    const comparison = comparisonUnits(referenceText, typedText);
    const ref = comparison.reference, typed = comparison.typed;
    const ops = [];
    const n = Math.max(ref.length, typed.length);
    for (let index = 0; index < n; index++) {
      const expected = ref[index], entered = typed[index];
      if (expected && entered && expected.norm === entered.norm) ops.push(makeOperation("ok", expected, entered));
      else if (expected && entered) { ops.push(makeOperation("wrong", expected, entered)); break; }
      else if (expected) { ops.push(makeOperation("missing", expected, null)); break; }
      else ops.push(makeOperation("extra", null, entered));
    }
    return ops;
  }

  function getPrefixProgress(referenceText, typedText) {
    const comparison = comparisonUnits(referenceText, typedText);
    const ref = comparison.reference, typed = comparison.typed;
    const isPrefix = typed.length > 0 && typed.length < ref.length && typed.every((word, index) => word.norm === ref[index]?.norm);
    return {
      isPrefix,
      matchedUnits: isPrefix ? typed.length : 0,
      expectedUnits: ref.map((unit) => ({ display: unit.raw, norm: unit.norm })),
    };
  }

  function isCorrectIncompletePrefix(referenceText, typedText) {
    return getPrefixProgress(referenceText, typedText).isPrefix;
  }

  // percent remains matched target units / max(target units, typed units); punctuation and case are ignored.
  function score(referenceText, typedText) {
    const comparison = comparisonUnits(referenceText, typedText);
    const ref = comparison.reference, typed = comparison.typed;
    if (!ref.length) return { percent: 0, perfect: false, words: [], ops: [] };
    const ok = align(ref, typed);
    const matches = ok.filter(Boolean).length;
    const percent = Math.round((matches / Math.max(ref.length, typed.length)) * 100);
    return {
      percent,
      perfect: matches === ref.length && typed.length === ref.length,
      words: ref.map((word, index) => ({ w: word.norm, ok: ok[index], expectedIndices: word.sourceIndices.slice() })),
      ops: diffUnits(ref, typed),
    };
  }

  globalThis.LHN_DICTATION_SCORE = Object.freeze({ tokenize, score, diff, positionalDiff, isCorrectIncompletePrefix, getPrefixProgress });
})();
