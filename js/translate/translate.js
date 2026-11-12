(() => {
async function bilingualFetch(url) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 2500);
  try { return await fetch(url, { signal:controller.signal }); } finally { clearTimeout(timer); }
}
const bilingualTranslationRequests = new Map();
async function translateBilingual(text, targetLang) {
  await LHN_CACHE.prepareBilingualCache();
  const key = `${targetLang}:${text}`;
  const pending = bilingualTranslationRequests.get(key);
  if (pending) return pending;
  const cached = await LHN_CACHE.getBilingualTranslation(key, { prepared:true });
  if (cached) return cached;
  const pendingAfterRead = bilingualTranslationRequests.get(key);
  if (pendingAfterRead) return pendingAfterRead;
  const request = (async () => {
    const engines = [
      async () => { const r = await bilingualFetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`); if (!r.ok) throw Error(); const d = await r.json(); const value = Array.isArray(d?.[0]) ? d[0].map(row => row?.[0] || "").join("") : ""; if (!value) throw Error(); return { translated:value, detectedLang:d?.[2] || "" }; },
      async () => { const r = await bilingualFetch(`https://translate.googleapis.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${targetLang}&q=${encodeURIComponent(text)}`); if (!r.ok) throw Error(); const d = await r.json(); const value = Array.isArray(d) ? (typeof d[0] === "string" ? d[0] : Array.isArray(d[0]) ? d[0].map(row => Array.isArray(row) ? row[0] || "" : "").join("") : "") : d?.sentences?.map(s => s.trans).join(""); if (!value) throw Error(); return { translated:value }; },
      async () => { const r = await bilingualFetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect%7C${targetLang}`); if (!r.ok) throw Error(); const d = await r.json(); if (!d?.responseData?.translatedText) throw Error(); return { translated:d.responseData.translatedText, detectedLang:d.responseData.detectedLanguage || "" }; },
      async () => { let error; for (const base of ["https://lingva.ml", "https://lingva.thedaviddelta.com"]) { try { const r = await bilingualFetch(`${base}/api/v1/auto/${targetLang}/${encodeURIComponent(text)}`); if (!r.ok) throw Error(); const d = await r.json(); if (!d?.translation) throw Error(); return { translated:d.translation, detectedLang:d.info?.detectedSource || "" }; } catch (e) { error=e; } } throw error || Error(); }
    ];
    let entry;
    try {
      entry = await Promise.any(engines.map(async engine => {
        const result = await engine();
        if (!result?.translated) throw Error("Empty translation");
        return result;
      }));
    } catch {}
    if (!entry) return { translated:`[Translation (${targetLang.toUpperCase()})]: ${text}`, fallback:true };
    const cachedAt = Date.now();
    await LHN_CACHE.saveBilingualTranslation(key, entry);
    return entry;
  })();
  bilingualTranslationRequests.set(key, request);
  try { return await request; }
  finally { if (bilingualTranslationRequests.get(key) === request) bilingualTranslationRequests.delete(key); }
}
async function detectReadLanguageRemote(text) {
  try {
    const sample = String(text || "").slice(0, 200);
    if (!/[\p{Script=Latin}]/u.test(sample)) return { detectedLang:"" };
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(sample)}`;
    const response = await bilingualFetch(url);
    if (!response.ok) return { detectedLang:"" };
    const data = await response.json();
    return { detectedLang:String(data?.[2] || "") };
  } catch { return { detectedLang:"" }; }
}

  globalThis.LHN_TRANSLATE = Object.freeze({ translateBilingual, detectReadLanguageRemote });
})();
