// Shared thumbnail URL, fallback, and image-loading helpers for Keepit.
(() => {
  const VIDEO_ID = /^[A-Za-z0-9_-]{6,}$/;
  const imageLoads = new WeakMap();
  const fallbackColors = ["#9fd8c2", "#4e9b80"];

  function youtubeVideoId(value) {
    const raw = String(value || "").trim();
    if (VIDEO_ID.test(raw)) return raw;
    let url;
    try { url = new URL(raw); } catch { return ""; }
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    const isYouTube = host === "youtube.com" || host.endsWith(".youtube.com");
    let candidate = "";
    if (host === "youtu.be") candidate = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (isYouTube && url.pathname === "/watch") candidate = url.searchParams.get("v") || "";
    else if (isYouTube) candidate = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] || "";
    return VIDEO_ID.test(candidate) ? candidate : "";
  }

  function youtubeUrl(value) {
    const id = youtubeVideoId(value);
    return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : "";
  }

  function safeUrl(value, baseUrl = globalThis.location?.href || "https://keepit.invalid/") {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value.trim(), baseUrl);
      if (["http:", "https:"].includes(url.protocol)) return url.href;
      if (url.protocol === "data:" && /^data:image\//i.test(value.trim())) return value.trim();
      return "";
    } catch { return ""; }
  }

  function fromPageMetadata(documentRef = globalThis.document, pageUrl = globalThis.location?.href) {
    const value = documentRef?.querySelector?.('meta[property="og:image"], meta[name="twitter:image"], meta[property="twitter:image"], meta[itemprop="image"]')?.content?.trim();
    const url = safeUrl(value, pageUrl);
    return /^https?:/.test(url) ? url : "";
  }

  function fallbackSvgUrl(colors) {
    const palette = Array.isArray(colors) ? colors : [];
    const color = value => /^#[\da-f]{3,8}$/i.test(String(value || "")) ? String(value) : "#9fd8c2";
    const a = color(palette[0] || fallbackColors[0]), b = color(palette[1] || fallbackColors[1]);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="150" viewBox="0 0 280 150"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="280" height="150" fill="url(#g)"/><circle cx="221" cy="37" r="23" fill="#fff3cc" opacity=".9"/><path d="M0 117 64 62l49 46 54-57 113 92v7H0z" fill="#213c55" opacity=".55"/><path d="M0 134q55-28 110 0t170 0v16H0z" fill="#152c40" opacity=".55"/><rect x="24" y="25" width="64" height="72" rx="6" fill="#fff7e6" opacity=".92"/><path d="M35 43h41M35 54h35M35 65h39" stroke="#607187" stroke-width="4" stroke-linecap="round" opacity=".7"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function sourceUrl(page = {}) {
    return safeUrl(page.thumbnailUrl, page.url) || youtubeUrl(page.url) || fallbackSvgUrl(page.thumb);
  }

  function clear(image) {
    if (!image) return;
    imageLoads.delete(image);
    image.onload = null;
    image.onerror = null;
    image.removeAttribute?.("src");
  }

  function load(image, { src = "", fallbackUrl = "", onLoad = null, onError = null } = {}) {
    if (!image) return false;
    const sources = [...new Set([safeUrl(src), safeUrl(fallbackUrl)].filter(Boolean))];
    const previous = imageLoads.get(image);
    if (previous && previous.sources.join("\n") === sources.join("\n")) {
      previous.onLoad = onLoad;
      previous.onError = onError;
      if (previous.loaded) onLoad?.(image, { fallback:previous.index > 0 });
      return true;
    }
    if (!sources.length) {
      clear(image);
      onError?.(image);
      return false;
    }
    const state = { sources, index:0, loaded:false, onLoad, onError };
    imageLoads.set(image, state);
    const isCurrent = () => imageLoads.get(image) === state;
    const assign = () => {
      if (!isCurrent()) return;
      const next = sources[state.index];
      image.onload = () => {
        if (!isCurrent()) return;
        state.loaded = true;
        state.onLoad?.(image, { fallback:state.index > 0 });
      };
      image.onerror = () => {
        if (!isCurrent()) return;
        state.index++;
        if (state.index < sources.length) assign();
        else {
          clear(image);
          state.onError?.(image);
        }
      };
      if (image.getAttribute?.("src") === next && image.complete) {
        if (image.naturalWidth > 0) {
          state.loaded = true;
          state.onLoad?.(image, { fallback:state.index > 0 });
        } else image.onerror?.();
      } else image.src = next;
    };
    assign();
    return true;
  }

  function loadYouTube(image, value, options = {}) {
    return load(image, { ...options, src:youtubeUrl(value) });
  }

  function loadSource(image, page, options = {}) {
    const primary = safeUrl(page?.thumbnailUrl, page?.url) || youtubeUrl(page?.url);
    return load(image, { ...options, src:primary, fallbackUrl:fallbackSvgUrl(page?.thumb) });
  }

  globalThis.LHN_THUMBNAILS = Object.freeze({ youtubeVideoId, youtubeUrl, safeUrl, fromPageMetadata, fallbackSvgUrl, sourceUrl, clear, load, loadYouTube, loadSource });
})();
