(() => {
  const isEnglishDictionaryWord = text => /^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(cleanText(text));
  const dictionaryCachePrefix = "lhnFullDictionary:v2:", dictionaryTranslationCachePrefix = "lhnFullDictionaryTranslation:v1:", DICTIONARY_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  const dictionaryTranslationRequests = new Map(), dictionaryTranslationRequestsBySignal = new WeakMap();
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
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLanguage)}&dt=t&dt=bd&q=${encodeURIComponent(text)}`, { signal });
        if (!response.ok) throw new Error("Google Translate unavailable");
        const data = await response.json();
        result = { translatedText:(data[0] || []).map(part => String(part[0] || "").normalize("NFC")).join("").normalize("NFC"), posDict:(data[1] || []).map(item => ({ pos:String(item[0] || "").normalize("NFC"), words:(item[1] || []).map(word => String(word).normalize("NFC")) })), engine:"Google Translate" };
      } catch (error) {
        if (signal?.aborted) throw error;
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(targetLanguage)}`, { signal });
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
  async function fetchIpaSource(url, signal, read) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (signal?.aborted) return null;
    signal?.addEventListener("abort", onAbort, { once:true });
    const timer = setTimeout(onAbort, IPA_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal:controller.signal });
      if (!response.ok) return null;
      return await read(await response.json());
    } catch { return null; }
    finally { clearTimeout(timer); signal?.removeEventListener("abort", onAbort); }
  }
  // IPA độc lập: 2 nguồn chạy song song, mỗi nguồn timeout 3s. Ưu tiên nguồn 1; nếu không có thì nguồn 2 (approx:true).
  async function fetchIpa(word, lang = "en", signal) {
    const query = encodeURIComponent(String(word || "").toLowerCase());
    const strip = value => String(value || "").trim().replace(/^\/+|\/+$/g, "").trim();
    const dictSource = fetchIpaSource(`https://api.dictionaryapi.dev/api/v2/entries/${encodeURIComponent(lang)}/${query}`, signal, data => {
      for (const entry of Array.isArray(data) ? data : []) for (const item of entry.phonetics || []) { const text = strip(item.text); if (text) return text; }
      for (const entry of Array.isArray(data) ? data : []) { const text = strip(entry.phonetic); if (text) return text; }
      return null;
    });
    const googleSource = fetchIpaSource(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(lang)}&tl=${lang === "en" ? "vi" : "en"}&dt=t&dt=rm&q=${query}`, signal, data => {
      const parts = data?.[0] || [];
      let raw = "";
      for (let i = parts.length - 1; i >= 0; i--) if (typeof parts[i]?.[3] === "string") { raw = parts[i][3]; break; }
      return raw ? strip(globalThis.LHN_IPA_UTILS.convertGoogleToIPA(raw)) : null;
    });
    const primary = await dictSource;
    if (primary) return { text:primary, approx:false };
    const secondary = await googleSource;
    return secondary ? { text:secondary, approx:true } : null;
  }
  async function dictionaryRelatedWords(word, targetLanguage, signal) {
    const escaped = encodeURIComponent(word.toLowerCase());
    const [synonyms, antonyms] = await Promise.all([
      fetch(`https://api.datamuse.com/words?rel_syn=${escaped}&max=3`, { signal }).then(response => response.ok ? response.json() : []),
      fetch(`https://api.datamuse.com/words?rel_ant=${escaped}&max=3`, { signal }).then(response => response.ok ? response.json() : [])
    ]);
    const all = [...synonyms.map(item => ({ ...item, kind:"Syn" })), ...antonyms.map(item => ({ ...item, kind:"Ant" }))];
    const translated = await Promise.all(all.map(async item => {
      try { return { ...item, meaning:(await dictionaryTranslate(item.word, targetLanguage, signal)).translatedText }; }
      catch { return { ...item, meaning:item.word }; }
    }));
    return translated;
  }
  async function dictionaryWordForms(word, targetLanguage, signal) {
    let root = word.toLowerCase();
    if (root.endsWith("ments")) root = root.slice(0, -5); else if (root.endsWith("ment")) root = root.slice(0, -4);
    else if (["ers", "ing", "ies"].some(suffix => root.endsWith(suffix))) root = root.slice(0, -3);
    else if (["ed", "er", "ly"].some(suffix => root.endsWith(suffix))) root = root.slice(0, -2); else if (root.endsWith("s")) root = root.slice(0, -1);
    try {
      const response = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(root)}*&md=p&max=15`, { signal });
      if (!response.ok) return [];
      const items = await response.json(), seen = new Set([word.toLowerCase()]), results = [];
      for (const item of items) {
        const form = String(item.word || "").toLowerCase(); if (!form || form.includes(" ") || form.length > root.length + 8 || seen.has(form)) continue;
        seen.add(form); const tag = item.tags?.includes("v") ? "(V)" : item.tags?.includes("adv") ? "(Adv)" : item.tags?.includes("adj") ? "(Adj)" : "(N)";
        results.push({ word:form, tag }); if (results.length >= 4) break;
      }
      return Promise.all(results.map(async item => { try { return { ...item, meaning:(await dictionaryTranslate(item.word, targetLanguage, signal)).translatedText }; } catch { return { ...item, meaning:item.word }; } }));
    } catch { return []; }
  }
  async function dictionaryCollocations(word, targetLanguage, signal) {
    try {
      const escaped = encodeURIComponent(word.toLowerCase());
      const [before, after] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_jja=${escaped}&max=2`, { signal }).then(response => response.ok ? response.json() : []),
        fetch(`https://api.datamuse.com/words?rel_jjb=${escaped}&max=2`, { signal }).then(response => response.ok ? response.json() : [])
      ]);
      const phrases = [...before.map(item => `${item.word} ${word}`), ...after.map(item => `${word} ${item.word}`)].slice(0, 3);
      return Promise.all(phrases.map(async phrase => { try { return { word:phrase, meaning:(await dictionaryTranslate(phrase, targetLanguage, signal)).translatedText }; } catch { return { word:phrase, meaning:phrase }; } }));
    } catch { return []; }
  }

  globalThis.LHN_DICTIONARY = Object.freeze({
    isEnglishWord:isEnglishDictionaryWord,
    getCache:getDictionaryCache,
    setCache:setDictionaryCache,
    translationCacheKey:dictionaryTranslationCacheKey,
    translate:dictionaryTranslate,
    fetchIpa,
    relatedWords:dictionaryRelatedWords,
    wordForms:dictionaryWordForms,
    collocations:dictionaryCollocations
  });
})();
