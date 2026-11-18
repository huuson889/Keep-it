(() => {
async function bilingualFetch(url) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 2500);
  try { return await fetch(url, { signal:controller.signal }); } finally { clearTimeout(timer); }
}
const bilingualTranslationRequests = new Map();
const MAX_TRANSLATION_QUERY_CHARS = 450;
function splitLongTranslationText(input) {
  const source=String(input),leading=source.match(/^\s*/u)?.[0]||"",trailing=source.slice(leading.length).match(/\s*$/u)?.[0]||"";
  let rest=source.slice(leading.length,source.length-trailing.length);const chunks=[];
  while(rest.length>MAX_TRANSLATION_QUERY_CHARS){
    const window=rest.slice(0,MAX_TRANSLATION_QUERY_CHARS);let cut=0,separator="";
    const sentence=/([.!?。！？;:]+)(\s+)/gu;let match;
    while((match=sentence.exec(window))){const boundary=match.index+match[1].length;if(boundary>MAX_TRANSLATION_QUERY_CHARS*.5){cut=boundary;separator=match[2];}}
    if(!cut){const whitespace=/\s+/gu;while((match=whitespace.exec(window)))if(match.index>MAX_TRANSLATION_QUERY_CHARS*.55){cut=match.index;separator=match[0];}}
    if(!cut){cut=MAX_TRANSLATION_QUERY_CHARS;if(/[\uD800-\uDBFF]$/.test(rest.slice(0,cut)))cut--;}
    const part=rest.slice(0,cut);chunks.push({text:part.trimEnd(),separator});rest=rest.slice(cut+separator.length);
  }
  if(rest)chunks.push({text:rest.trimEnd(),separator:""});
  return {chunks,leading,trailing};
}
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
    if (text.length > MAX_TRANSLATION_QUERY_CHARS) {
      const { chunks, leading, trailing } = splitLongTranslationText(text), results=[];
      for (const chunk of chunks) if (chunk.text) results.push(await translateBilingual(chunk.text, targetLang));
      if (!results.length) return { translated:text };
      if (results.some(result => result.fallback)) return { translated:`[Translation (${targetLang.toUpperCase()})]: ${text}`, fallback:true };
      let resultIndex=0;
      const translated=chunks.map(chunk => `${chunk.text ? results[resultIndex++].translated : ""}${chunk.separator}`).join("");
      return { translated:leading+translated+trailing, detectedLang:results.find(result => result.detectedLang)?.detectedLang || "" };
    }
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
