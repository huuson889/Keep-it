// Loại từ (Word class) — shared by the page labels (js/word-class/page.js), the engine (js/word-class/engine.js) and the
// Settings preview. Splits English text into words the way the model was trained (UD English-EWT: don't → do + n't), runs
// the token-classification model on whole sentences and maps each word's UPOS tag to its abbreviation. No word lists: every
// label comes from the model's output for that word in its sentence. Loaded as a classic script (content scripts, Settings)
// and as a module side effect (engine) → it only sets globalThis.LHN_WORD_CLASS_CORE.
(() => {
  if (globalThis.LHN_WORD_CLASS_CORE) return;
  const MODEL_ID = "jdp8/bert-english-uncased-finetuned-pos";   // ONNX of vblagoje/bert-english-uncased-finetuned-pos (UPOS tags)
  const MODEL_FILE = "onnx/model_quantized.onnx";                // q8, ~105 MB
  const MODEL_FILES = ["config.json", "tokenizer.json", "tokenizer_config.json", MODEL_FILE];
  const MODEL_URL = file => `https://huggingface.co/${MODEL_ID}/resolve/main/${file}`;

  // UPOS tag → abbreviation shown under the word (null = punctuation / other, no label). Meanings: languages.js wc_<UPOS>.
  const POS = {
    NOUN:{ abbr:"N", name:"Noun" }, PROPN:{ abbr:"N", name:"Noun" }, VERB:{ abbr:"V", name:"Verb" },
    AUX:{ abbr:"Aux V", name:"Auxiliary verb" }, ADJ:{ abbr:"Adj", name:"Adjective" }, ADV:{ abbr:"Adv", name:"Adverb" },
    PRON:{ abbr:"Pron", name:"Pronoun" }, DET:{ abbr:"Det", name:"Determiner" }, ADP:{ abbr:"Prep", name:"Preposition" },
    CCONJ:{ abbr:"Conj", name:"Conjunction" }, SCONJ:{ abbr:"Conj", name:"Conjunction" }, NUM:{ abbr:"Num", name:"Number" },
    PART:{ abbr:"Part", name:"Particle" }, INTJ:{ abbr:"Interj", name:"Interjection" }, SYM:{ abbr:"Sym", name:"Symbol" },
    PUNCT:null, X:null
  };
  // one colour per abbreviation (demo v4); second value = on a dark page / dark Settings
  const COLORS = {
    "N":["#2563eb", "#60a5fa"], "V":["#dc2626", "#f87171"], "Aux V":["#be123c", "#fb7185"], "Adj":["#16a34a", "#4ade80"],
    "Adv":["#d97706", "#fbbf24"], "Pron":["#7c3aed", "#a78bfa"], "Det":["#0d9488", "#2dd4bf"], "Prep":["#0284c7", "#38bdf8"],
    "Conj":["#ea580c", "#fb923c"], "Num":["#475569", "#94a3b8"], "Part":["#db2777", "#f472b6"], "Interj":["#c026d3", "#e879f9"],
    "Sym":["#64748b", "#94a3b8"]
  };
  const MUTED = ["#64748b", "#94a3b8"];
  const color = (abbr, dark) => (COLORS[abbr] || MUTED)[dark ? 1 : 0];

  // Tokens with character offsets. Order of alternatives matters.
  const TOKEN_RE = new RegExp([
    String.raw`(?:https?:\/\/|www\.)\S+[^\s.,;:!?)"'”’]`,                 // URL
    String.raw`[\w.+-]+@[\w-]+(?:\.[\w-]+)+`,                              // e-mail
    String.raw`(?:[A-Za-z]\.){2,}`,                                        // initialisms: U.S. e.g. D.C.
    String.raw`\d+(?:[.,:]\d+)+`,                                          // 1,000  3.5  10:30
    String.raw`['’]\d\d(?!\w)`,                                            // '90
    String.raw`[\p{L}\p{M}\p{N}_]+(?:['’][\p{L}\p{M}]+)*`,                 // word, keeps inner apostrophes for now
    String.raw`\.{2,}|-{2,}|[^\s\p{L}\p{M}\p{N}_]`                         // punctuation / symbol (… -- single char)
  ].join("|"), "gu");
  const CLITIC_RE = /^(.+?)(n['’]t|['’](?:s|m|re|ve|ll|d))$/i;            // don't → do + n't, I'm → I + 'm, John's → John + 's

  function tokenize(text) {
    const out = [];
    for (const m of String(text).matchAll(TOKEN_RE)) {
      const w = m[0], start = m.index;
      const c = /^[\p{L}\p{N}]/u.test(w) ? w.match(CLITIC_RE) : null;
      if (c && !/['’]/.test(c[1])) { out.push({ text:c[1], start, end:start + c[1].length }); out.push({ text:c[2], start:start + c[1].length, end:start + w.length }); }
      else out.push({ text:w, start, end:start + w.length });
    }
    return out;
  }

  // sentence-sized pieces (≤ maxPieces sub-word pieces each) so long paragraphs fit the model (512)
  function chunks(tokens, pieceCount, maxPieces = 500) {
    const res = []; let cur = [], n = 0, lastEnd = -1;
    tokens.forEach(t => {
      const k = pieceCount(t.text);
      if (cur.length && n + k > maxPieces) { const cut = lastEnd >= 0 ? lastEnd + 1 : cur.length; res.push(cur.slice(0, cut)); cur = cur.slice(cut); n = cur.reduce((a, x) => a + pieceCount(x.text), 0); lastEnd = -1; }
      cur.push(t); n += k;
      if (/^[.!?…]+$/.test(t.text)) lastEnd = cur.length - 1;
    });
    if (cur.length) res.push(cur);
    return res;
  }

  // tok / model / Tensor from Transformers.js (engine only)
  async function tagWords(words, tok, model, Tensor) {
    const id = t => tok.model.tokens_to_ids.get(t);
    const CLS = id(tok.cls_token ?? "[CLS]"), SEP = id(tok.sep_token ?? "[SEP]"), UNK = id(tok.unk_token ?? "[UNK]");
    const ids = [CLS], first = [];
    for (const w of words) { const p = tok.encode(w.replace(/[’‘]/g, "'"), { add_special_tokens:false }); first.push(ids.length); ids.push(...(p.length ? p : [UNK])); }
    ids.push(SEP);
    const L = ids.length, big = a => BigInt64Array.from(a, BigInt);
    const feeds = { input_ids:new Tensor("int64", big(ids), [1, L]), attention_mask:new Tensor("int64", new BigInt64Array(L).fill(1n), [1, L]) };
    if (model.sessions?.model?.inputNames?.includes("token_type_ids")) feeds.token_type_ids = new Tensor("int64", new BigInt64Array(L), [1, L]);
    const { logits } = await model(feeds); const C = logits.dims[2], d = logits.data, labels = model.config.id2label;
    return first.map(ti => { let b = 0; for (let k = 1; k < C; k++) if (d[ti * C + k] > d[ti * C + b]) b = k; return labels[b]; });
  }

  // → [[start, end, UPOS], …] for every token of the text
  async function analyze(text, tok, model, Tensor) {
    const tokens = tokenize(text), out = [];
    const pieceCount = w => Math.max(1, tok.encode(w, { add_special_tokens:false }).length);
    for (const part of chunks(tokens, pieceCount)) {
      const tags = await tagWords(part.map(t => t.text), tok, model, Tensor);
      part.forEach((t, i) => out.push([t.start, t.end, tags[i]]));
    }
    return out;
  }

  // engine output → tokens with the label to show. A token with no letter or digit is punctuation: labelled only as a symbol
  // ($ % #) or conjunction (&), as in UD English.
  function label(text, tagged) {
    return (tagged || []).map(([start, end, upos]) => {
      const word = text.slice(start, end);
      const pos = (/[\p{L}\p{N}]/u.test(word) || upos === "SYM" || upos === "CCONJ") ? POS[upos] ?? null : null;
      return { text:word, start, end, upos, pos };
    });
  }

  // Columns as in demo v4: words written together (don't, end.) form one group; nouns written next to each other (only spaces
  // between, same line) share one underline and one "N" label. v3.5.291: a particle the model tags PART written right after the
  // noun with no space (the possessive in "Ho Chi Minh City’s") belongs to that noun: one underline, one "N" (by tag + position,
  // no word list). → [{ tokens, merged }] (merged = one underline + one N for the whole unit)
  function units(text, tokens) {
    const groups = []; let prevEnd = -1;
    for (const t of tokens) { if (groups.length && t.start === prevEnd) groups[groups.length - 1].push(t); else groups.push([t]); prevEnd = t.end; }
    const isN = t => t.pos?.abbr === "N";
    const punct = t => !t.pos && !/[\p{L}\p{N}]/u.test(t.text);
    const allN = g => g.every(isN);
    const clitic = (g, k) => g[k]?.upos === "PART" && k > 0 && (isN(g[k - 1]) || clitic(g, k - 1));   // City’s: PART glued after the noun
    const nThenPunct = g => { const k = g.findIndex((t, j) => !isN(t) && !clitic(g, j)); return isN(g[0]) && (k < 0 || g.slice(k).every(punct)); };   // "river." / "City’s," can end a noun run
    const hasClitic = g => g.some((t, j) => clitic(g, j));
    const out = [];
    groups.forEach((g, i) => {
      const prev = out[out.length - 1], gap = i ? text.slice(groups[i - 1][groups[i - 1].length - 1].end, g[0].start) : "";
      if (prev && prev.noun && allN(prev.groups[prev.groups.length - 1]) && nThenPunct(g) && /^[ \t\u00a0]+$/.test(gap)) prev.groups.push(g);
      else out.push({ groups:[g], noun:nThenPunct(g) });
    });
    return out.map(u => ({ tokens:u.groups.flat(), merged:u.groups.length > 1 || (u.noun && u.groups.some(hasClitic)) }));
  }

  // Settings preview: same columns as the page, as HTML (labels are plain text here — it is not a web page)
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
  // hover text as in demo v4: one line per labelled word — "book: danh từ · noun" (the English name is left out when the UI is English)
  function tip(tokens, meaning, meaningEn) {
    return tokens.filter(t => t.pos).map(t => { const a = meaning(t.upos), b = meaningEn ? meaningEn(t.upos) : ""; return `${t.text}: ${a}${b && b !== a ? ` · ${b}` : ""}`; }).join("\n");
  }
  function html(text, tokens, dark, tipOf) {
    const title = ts => { const s = tipOf ? tipOf(ts) : ""; return s ? ` title="${esc(s)}"` : ""; };
    const lab = abbrs => abbrs.map(a => `<span style="color:${color(a, dark)}">${esc(a)}</span>`).join('<span class="kp-wc-sep">·</span>');
    return units(text, tokens).map(u => {
      const ts = u.tokens;
      if (u.merged) {
        const last = ts.findLastIndex(t => t.pos);
        return `<span class="kp-wc-p"${title(ts)}><span class="kp-wc-t"><span class="kp-wc-u" style="border-color:${color("N", dark)}">${esc(text.slice(ts[0].start, ts[last].end))}</span>${esc(text.slice(ts[last].end, ts[ts.length - 1].end))}</span><span class="kp-wc-a">${lab(["N"])}</span></span>`;
      }
      const word = ts.map((t, k) => (k && t.start > ts[k - 1].end ? esc(text.slice(ts[k - 1].end, t.start)) : "") + (t.pos ? `<span class="kp-wc-u" style="border-color:${color(t.pos.abbr, dark)}">${esc(t.text)}</span>` : esc(t.text))).join("");
      return `<span class="kp-wc-p"${title(ts)}><span class="kp-wc-t">${word}</span><span class="kp-wc-a">${lab(ts.filter(t => t.pos).map(t => t.pos.abbr))}</span></span>`;
    }).join("");
  }
  // legend of the abbreviations that appear, fixed order — "N (Noun): Danh từ / Danh từ riêng" (meaning = translate(UPOS))
  function legend(tokens, meaning, dark) {
    const used = new Set(tokens.filter(t => t.pos).map(t => t.pos.abbr)), groups = new Map();
    Object.entries(POS).filter(([, p]) => p).forEach(([upos, p]) => { if (!groups.has(p.abbr)) groups.set(p.abbr, { name:p.name, list:[] }); groups.get(p.abbr).list.push(upos); });
    const cap = s => s ? s[0].toLocaleUpperCase() + s.slice(1) : s;
    return [...groups].filter(([a]) => used.has(a)).map(([a, g]) => `<span><b style="color:${color(a, dark)}">${esc(a)} (${esc(g.name)}):</b> ${esc([...new Set(g.list.map(u => cap(meaning(u))))].join(" / "))}</span>`).join("");
  }

  globalThis.LHN_WORD_CLASS_CORE = Object.freeze({ MODEL_ID, MODEL_FILE, MODEL_FILES, MODEL_URL, POS, COLORS, MUTED, color, tokenize, chunks, tagWords, analyze, label, units, tip, html, legend });
})();
