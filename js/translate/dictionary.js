(() => {
  const cleanText = value => String(value ?? "").replace(/\s+/g, " ").trim();
  const isEnglishDictionaryWord = text => /^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(cleanText(text));
  const dictionaryCachePrefix = "lhnFullDictionary:v4:", dictionaryTranslationCachePrefix = "lhnFullDictionaryTranslation:v1:", DICTIONARY_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  const dictionaryTranslationRequests = new Map(), dictionaryTranslationRequestsBySignal = new WeakMap();
  async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const controller = new AbortController(), sourceSignal = options.signal;
    const abort = () => controller.abort();
    if (sourceSignal?.aborted) abort();
    else sourceSignal?.addEventListener("abort", abort, { once:true });
    const timer = setTimeout(abort, timeoutMs);
    try { return await fetch(url, { ...options, signal:controller.signal }); }
    finally { clearTimeout(timer); sourceSignal?.removeEventListener("abort", abort); }
  }
  // Results built while a source failed (error, quota, timeout) are marked so the caller shows them but does not cache them.
  const incompleteResults = new WeakSet();
  const markIncomplete = value => { incompleteResults.add(value); return value; };
  const isIncomplete = value => !!value && typeof value === "object" && incompleteResults.has(value);
  async function datamuseJson(response) {
    if (!response.ok) throw new Error(`Datamuse unavailable (${response.status})`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
  // Free Dictionary entries for a word: [] when the word is not found (404), throws on any other failure.
  // One request per word per lookup signal, shared by Example and the Syn/Ant fallback.
  const freeDictionaryRequestsBySignal = new WeakMap();
  function freeDictionaryEntries(word, signal) {
    const key = word.toLowerCase();
    let requests = signal && typeof signal === "object" ? freeDictionaryRequestsBySignal.get(signal) : null;
    if (signal && typeof signal === "object" && !requests) { requests = new Map(); freeDictionaryRequestsBySignal.set(signal, requests); }
    if (requests?.has(key)) return requests.get(key);
    const request = fetchFreeDictionaryEntries(word, signal);
    requests?.set(key, request);
    return request;
  }
  async function fetchFreeDictionaryEntries(word, signal) {
    const response = await fetchWithTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`, { signal });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Free Dictionary unavailable (${response.status})`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
  function freeDictionaryRelated(entries, field, word) {
    const self = word.toLowerCase(), found = [];
    for (const entry of entries) for (const meaning of entry.meanings || []) {
      found.push(...(meaning[field] || []));
      for (const definition of meaning.definitions || []) found.push(...(definition[field] || []));
    }
    return [...new Set(found.map(cleanText).filter(item => item && item.toLowerCase() !== self))].slice(0, 4);
  }
  async function getDictionaryCache(key, legacyKey) {
    try {
      const entry = (await browser.storage.local.get(key))[key];
      if (entry && Date.now() - entry.timestamp < DICTIONARY_CACHE_TTL) return entry.data;
      if (entry) await browser.storage.local.remove(key);
    } catch (error) { console.warn("Could not read full dictionary cache", error); }
    // Migrate a still-valid entry from the previous website-scoped cache.
    try {
      const oldKey = `__lhn_full_english_dictionary_v1__${legacyKey}`;
      const oldEntry = JSON.parse(localStorage.getItem(oldKey) || "null");
      if (oldEntry && Date.now() - oldEntry.timestamp < DICTIONARY_CACHE_TTL) {
        await browser.storage.local.set({ [key]:oldEntry });
        localStorage.removeItem(oldKey);
        return oldEntry.data;
      }
      if (oldEntry) localStorage.removeItem(oldKey);
    } catch {}
    return null;
  }
  async function setDictionaryCache(key, data) {
    try { await browser.storage.local.set({ [key]:{ timestamp:Date.now(), data } }); }
    catch (error) { console.warn("Could not save full dictionary cache", error); }
  }
  function dictionaryTranslationCacheKey(text, targetLanguage) {
    return `${dictionaryTranslationCachePrefix}${targetLanguage}:${cleanText(text).toLocaleLowerCase()}`;
  }
  function dictionaryCacheKey(word, targetLanguage) {
    return `${dictionaryCachePrefix}${targetLanguage}:${cleanText(word).toLowerCase()}`;
  }
  async function dictionaryTranslate(text, targetLanguage, signal) {
    const cacheKey = dictionaryTranslationCacheKey(text, targetLanguage);
    let requests = dictionaryTranslationRequests;
    if (signal && typeof signal === "object") {
      requests = dictionaryTranslationRequestsBySignal.get(signal);
      if (!requests) { requests = new Map(); dictionaryTranslationRequestsBySignal.set(signal, requests); }
    }
    const pending = requests.get(cacheKey);
    if (pending) return pending;
    const request = (async () => {
      try {
        const cached = (await browser.storage.local.get(cacheKey))[cacheKey];
        if (cached && Date.now() - cached.timestamp < DICTIONARY_CACHE_TTL && cached.data?.translatedText) return cached.data;
        if (cached) await browser.storage.local.remove(cacheKey);
      } catch (error) { console.warn("Could not read related-word translation cache", error); }
      let result;
      try {
        const response = await fetchWithTimeout(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLanguage)}&dt=t&dt=bd&q=${encodeURIComponent(text)}`, { signal });
        if (!response.ok) throw new Error("Google Translate unavailable");
        const data = await response.json();
        result = { translatedText:(data[0] || []).map(part => String(part[0] || "").normalize("NFC")).join("").normalize("NFC"), posDict:(data[1] || []).map(item => ({ pos:String(item[0] || "").normalize("NFC"), words:(item[1] || []).map(word => String(word).normalize("NFC")) })), engine:"Google Translate" };
      } catch (error) {
        if (signal?.aborted) throw error;
        const response = await fetchWithTimeout(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(targetLanguage)}`, { signal });
        if (!response.ok) throw new Error("Dictionary translation unavailable");
        const data = await response.json();
        if (data.responseStatus !== 200) throw new Error("Dictionary translation unavailable");
        result = { translatedText:String(data.responseData?.translatedText || text).normalize("NFC"), posDict:[], engine:"MyMemory" };
      }
      try { await browser.storage.local.set({ [cacheKey]:{ timestamp:Date.now(), data:result } }); }
      catch (error) { console.warn("Could not save related-word translation cache", error); }
      return result;
    })();
    requests.set(cacheKey, request);
    try { return await request; }
    finally { if (requests.get(cacheKey) === request) requests.delete(cacheKey); }
  }
  const IPA_TIMEOUT_MS = 3000;
  async function fetchIpaSource(url, signal, read, state = {}) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (signal?.aborted) return null;
    signal?.addEventListener("abort", onAbort, { once:true });
    const timer = setTimeout(onAbort, IPA_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal:controller.signal });
      if (!response.ok) { if (response.status !== 404) state.failed = true; return null; }
      return await read(await response.json());
    } catch { state.failed = true; return null; }
    finally { clearTimeout(timer); signal?.removeEventListener("abort", onAbort); }
  }
  // IPA độc lập: 2 nguồn chạy song song, mỗi nguồn timeout 3s. Ưu tiên nguồn 1; nếu không có thì nguồn 2 (approx:true).
  async function fetchIpa(word, lang = "en", signal) {
    const query = encodeURIComponent(String(word || "").toLowerCase());
    const strip = value => String(value || "").trim().replace(/^\/+|\/+$/g, "").trim();
    const dictState = {}, googleState = {};
    const dictSource = fetchIpaSource(`https://api.dictionaryapi.dev/api/v2/entries/${encodeURIComponent(lang)}/${query}`, signal, data => {
      for (const entry of Array.isArray(data) ? data : []) for (const item of entry.phonetics || []) { const text = strip(item.text); if (text) return text; }
      for (const entry of Array.isArray(data) ? data : []) { const text = strip(entry.phonetic); if (text) return text; }
      return null;
    }, dictState);
    const googleSource = fetchIpaSource(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(lang)}&tl=${lang === "en" ? "vi" : "en"}&dt=t&dt=rm&q=${query}`, signal, data => {
      const parts = data?.[0] || [];
      let raw = "";
      for (let i = parts.length - 1; i >= 0; i--) if (typeof parts[i]?.[3] === "string") { raw = parts[i][3]; break; }
      return raw ? strip(globalThis.LHN_IPA_UTILS.convertGoogleToIPA(raw)) : null;
    }, googleState);
    const primary = await dictSource;
    if (primary) return { text:primary, approx:false };
    const secondary = await googleSource;
    const result = secondary ? { text:secondary, approx:true } : null;
    if (dictState.failed || (!secondary && googleState.failed)) return markIncomplete(result || { text:"", approx:false });
    return result;
  }
  async function dictionaryRelatedWords(word, targetLanguage, signal) {
    const escaped = encodeURIComponent(word.toLowerCase());
    const [synonyms, antonyms] = await Promise.allSettled([
      fetch(`https://api.datamuse.com/words?rel_syn=${escaped}&max=4`, { signal }).then(datamuseJson),
      fetch(`https://api.datamuse.com/words?rel_ant=${escaped}&max=4`, { signal }).then(datamuseJson)
    ]);
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    let incomplete = false;
    const words = settled => { if (settled.status !== "fulfilled") { incomplete = true; return []; } return settled.value.map(item => cleanText(item.word)).filter(Boolean); };
    const lists = { Syn:words(synonyms), Ant:words(antonyms) };
    // Datamuse failed or found nothing for a kind: that kind comes from Free Dictionary instead (max 4, no backfill).
    if (!lists.Syn.length || !lists.Ant.length) {
      try {
        const entries = await freeDictionaryEntries(word, signal);
        if (!lists.Syn.length) lists.Syn = freeDictionaryRelated(entries, "synonyms", word);
        if (!lists.Ant.length) lists.Ant = freeDictionaryRelated(entries, "antonyms", word);
      } catch (error) { if (signal?.aborted) throw error; incomplete = true; }
    }
    const all = [...lists.Syn.map(item => ({ word:item, kind:"Syn" })), ...lists.Ant.map(item => ({ word:item, kind:"Ant" }))];
    const translated = await Promise.all(all.map(async item => {
      try { return { ...item, meaning:(await dictionaryTranslate(item.word, targetLanguage, signal)).translatedText }; }
      catch { incomplete = true; return { ...item, meaning:item.word }; }
    }));
    return incomplete ? markIncomplete(translated) : translated;
  }
  async function dictionaryWordForms(word, targetLanguage, signal) {
    let root = word.toLowerCase();
    if (root.endsWith("ments")) root = root.slice(0, -5); else if (root.endsWith("ment")) root = root.slice(0, -4);
    else if (["ers", "ing", "ies"].some(suffix => root.endsWith(suffix))) root = root.slice(0, -3);
    else if (["ed", "er", "ly"].some(suffix => root.endsWith(suffix))) root = root.slice(0, -2); else if (root.endsWith("s")) root = root.slice(0, -1);
    try {
      const items = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(root)}*&md=p&max=15`, { signal }).then(datamuseJson), seen = new Set([word.toLowerCase()]), results = [];
      for (const item of items) {
        const form = String(item.word || "").toLowerCase(); if (!form || form.includes(" ") || form.length > root.length + 8 || seen.has(form)) continue;
        seen.add(form); const tag = item.tags?.includes("v") ? "(V)" : item.tags?.includes("adv") ? "(Adv)" : item.tags?.includes("adj") ? "(Adj)" : "(N)";
        results.push({ word:form, tag }); if (results.length >= 4) break;
      }
      let incomplete = false;
      const translated = await Promise.all(results.map(async item => { try { return { ...item, meaning:(await dictionaryTranslate(item.word, targetLanguage, signal)).translatedText }; } catch { incomplete = true; return { ...item, meaning:item.word }; } }));
      return incomplete ? markIncomplete(translated) : translated;
    } catch { return markIncomplete([]); }
  }
  async function dictionaryCollocations(word, targetLanguage, signal) {
    try {
      const escaped = encodeURIComponent(word.toLowerCase());
      const [before, after] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_jjb=${escaped}&max=2`, { signal }).then(datamuseJson),
        fetch(`https://api.datamuse.com/words?rel_jja=${escaped}&max=2`, { signal }).then(datamuseJson)
      ]);
      const phrases = [...new Set([...before.map(item => `${item.word} ${word}`), ...after.map(item => `${word} ${item.word}`)])]; // jjb adjectives before (next stop), jja nouns after (stop shopping); all shown
      let incomplete = false;
      const translated = await Promise.all(phrases.map(async phrase => { try { return { word:phrase, meaning:(await dictionaryTranslate(phrase, targetLanguage, signal)).translatedText }; } catch { incomplete = true; return { word:phrase, meaning:phrase }; } }));
      return incomplete ? markIncomplete(translated) : translated;
    } catch { return markIncomplete([]); }
  }

  // Looked-up word plus common inflections (runs, making, carries, dog's); shared by example ranking and highlighting.
  function exampleWordRegExp(word) {
    const base = String(word || "").toLowerCase().replace(/[’']/g, "'").trim();
    if (!base) return null;
    const stems = new Set([base]);
    if (/e$/.test(base)) stems.add(base.slice(0, -1));
    if (/[^aeiou]y$/.test(base)) stems.add(base.slice(0, -1) + "i");
    if (/[^aeiou][aeiou][bdgklmnprtvz]$/.test(base)) stems.add(base + base.slice(-1));
    const reEsc = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]").replace(/ /g, "\\s+");
    return new RegExp(`\\b(?:${[...stems].map(reEsc).join("|")})(?:s|es|ed|d|ing|er|ers|est|ly|['’]s)?\\b`, "gi");
  }
  // Up to 3 Free Dictionary example sentences, sentences containing the word first, each with a translation.
  async function dictionaryExamples(word, targetLanguage, signal) {
    try {
      const data = await freeDictionaryEntries(word, signal), examples = [];
      for (const entry of data) for (const meaning of entry.meanings || []) for (const definition of meaning.definitions || []) {
        const text = cleanText(definition.example); if (text) examples.push(text);
      }
      const unique = [...new Set(examples)], pattern = exampleWordRegExp(word);
      const hasWord = text => { pattern.lastIndex = 0; return pattern.test(text); };
      const ranked = [...unique.filter(hasWord), ...unique.filter(text => !hasWord(text))];
      let incomplete = false;
      const translated = await Promise.all(ranked.slice(0, 3).map(async text => {
        try { return { text, meaning:(await dictionaryTranslate(text, targetLanguage, signal)).translatedText }; }
        catch { incomplete = true; return { text, meaning:"" }; }
      }));
      return incomplete ? markIncomplete(translated) : translated;
    } catch { return markIncomplete([]); }
  }

  globalThis.LHN_DICTIONARY = Object.freeze({
    isEnglishWord:isEnglishDictionaryWord,
    getCache:getDictionaryCache,
    setCache:setDictionaryCache,
    isIncomplete,
    cacheKey:dictionaryCacheKey,
    translationCacheKey:dictionaryTranslationCacheKey,
    translate:dictionaryTranslate,
    fetchIpa,
    relatedWords:dictionaryRelatedWords,
    wordForms:dictionaryWordForms,
    collocations:dictionaryCollocations,
    examples:dictionaryExamples,
    exampleWordRegExp
  });
})();
