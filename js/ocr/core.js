// Shared OCR helpers with no DOM, no engine and no labels: usable from the reader page,
// from a content script and from Node tests. Text for reasons/warnings lives in languages.js.
(() => {
  'use strict';
  if (globalThis.LHN_OCR_CORE) return;

  const AUTO_LIMITS = {
    fullMaxRegions: 14,   // boxes at or below this → one whole-page run
    strongHierarchy: 3,   // max box >= 3× median height → mixed sizes
    strongTinyShare: .3,  // >= 30% boxes far below the largest box
    tinyRatio: .4,        // "far below" = height < 40% of the largest box
    slowRegions: 60       // above this, per-region runs can take minutes
  };

  const clean = regions => (regions || []).filter(b => b && b.r > b.l && b.b > b.t);

  /* Skip unusually small detections only when there is a strong scale hierarchy; keep every
     box when text sizes are uniform. Horizontally adjacent parts of one line are merged. */
  function planRegions(regions, pageWidth) {
    const usable = clean(regions);
    if (!usable.length) return { regions: [], skipped: [], threshold: 0 };
    const heights = usable.map(b => b.b - b.t).sort((a, b) => a - b);
    const median = heights[Math.floor(heights.length / 2)], max = heights[heights.length - 1];
    const threshold = (heights.length >= 8 && max >= median * 3 && heights.filter(h => h >= max * .4).length >= 2) ? max * .4 : 0;
    const selected = usable.filter(b => b.b - b.t >= threshold).map(b => ({ ...b }));
    const skipped = usable.filter(b => b.b - b.t < threshold);
    selected.sort((a, b) => a.t - b.t || a.l - b.l);
    let changed = true;
    while (changed) {
      changed = false;
      outer: for (let i = 0; i < selected.length; i++) for (let j = i + 1; j < selected.length; j++) {
        const a = selected[i], b = selected[j];
        const ha = a.b - a.t, hb = b.b - b.t;
        const overlap = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        if (overlap / Math.min(ha, hb) < .58 || Math.max(ha, hb) / Math.min(ha, hb) > 2.2) continue;
        const gap = Math.max(0, Math.max(a.l, b.l) - Math.min(a.r, b.r));
        const left = Math.min(a.l, b.l), right = Math.max(a.r, b.r);
        if (gap > Math.min(ha, hb) * .35 || right - left > pageWidth * .65) continue;
        selected[i] = { l: left, t: Math.min(a.t, b.t), r: right, b: Math.max(a.b, b.b), score: Math.min(a.score ?? 1, b.score ?? 1) };
        selected.splice(j, 1); changed = true; break outer;
      }
    }
    selected.sort((a, b) => a.t - b.t || a.l - b.l);
    return { regions: selected, skipped, threshold };
  }

  function regionStats(regions, pageWidth, pageHeight) {
    const usable = clean(regions), n = usable.length;
    if (!n) return { count: 0, median: 0, max: 0, hierarchy: 0, tinyShare: 0, coverage: 0, pageWidth, pageHeight };
    const heights = usable.map(b => b.b - b.t).sort((a, b) => a - b);
    const median = heights[Math.floor(n / 2)], max = heights[n - 1];
    const tiny = heights.filter(h => h < max * AUTO_LIMITS.tinyRatio).length;
    const area = usable.reduce((sum, b) => {
      const w = Math.max(0, Math.min(pageWidth, b.r) - Math.max(0, b.l));
      const h = Math.max(0, Math.min(pageHeight, b.b) - Math.max(0, b.t));
      return sum + w * h;
    }, 0);
    return { count: n, median, max, hierarchy: median ? max / median : 0, tinyShare: tiny / n, coverage: Math.min(1, area / Math.max(1, pageWidth * pageHeight)), pageWidth, pageHeight };
  }

  /* Reason codes only (ocrReason* labels in languages.js): whole-page is one inference and keeps
     reading order; per-region survives pages that mix very different text sizes. */
  function planAuto(regions, pageWidth, pageHeight) {
    const stats = regionStats(regions, pageWidth, pageHeight), n = stats.count;
    const base = { stats, auto: true, limits: { ...AUTO_LIMITS } };
    if (!n) return { ...base, method: 'full', policy: 'all', reason: 'noRegions', reasonArgs: {}, warn: 'noRegions' };
    if (n <= AUTO_LIMITS.fullMaxRegions) return { ...base, method: 'full', policy: 'all', reason: 'fewRegions', reasonArgs: { count: n }, warn: '' };
    if (stats.hierarchy >= AUTO_LIMITS.strongHierarchy && stats.tinyShare >= AUTO_LIMITS.strongTinyShare) {
      return { ...base, method: 'regions', policy: 'main', reason: 'mixedSizes', reasonArgs: { count: n, hierarchy: stats.hierarchy.toFixed(1), share: Math.round(stats.tinyShare * 100) }, warn: 'mixedSizes' };
    }
    return { ...base, method: 'regions', policy: 'all', reason: 'dense', reasonArgs: { count: n }, warn: n > AUTO_LIMITS.slowRegions ? 'slow' : '', slow: n > AUTO_LIMITS.slowRegions };
  }

  /* Engine boxes are normalised [left, top, right, bottom] of the rendered page; group boxes that
     sit on one line, then lines into paragraphs, so injected text reads like the app's own. */
  function groupLines(boxes, tolerance = .6) {
    const list = (boxes || []).filter(b => b && b.rect && b.text && b.text.trim()).map(b => ({ text: b.text.trim(), l: b.rect[0], t: b.rect[1], r: b.rect[2], b: b.rect[3] }));
    list.sort((a, b) => a.t - b.t || a.l - b.l);
    const lines = [];
    for (const box of list) {
      const height = Math.max(.0001, box.b - box.t), mid = (box.t + box.b) / 2;
      const line = lines.find(candidate => Math.abs(((candidate.t + candidate.b) / 2) - mid) < height * tolerance && Math.abs((candidate.t + candidate.b) / 2 - mid) < (candidate.b - candidate.t) * tolerance);
      if (line) {
        line.boxes.push(box);
        line.l = Math.min(line.l, box.l); line.r = Math.max(line.r, box.r);
        line.t = Math.min(line.t, box.t); line.b = Math.max(line.b, box.b);
      } else lines.push({ boxes: [box], l: box.l, t: box.t, r: box.r, b: box.b });
    }
    return lines.map(line => {
      line.boxes.sort((a, b) => a.l - b.l);
      return {
        text: line.boxes.map(box => box.text).join(' ').replace(/\s+/g, ' ').trim(),
        rect: [clamp01(line.l), clamp01(line.t), clamp01(line.r), clamp01(line.b)],
        boxes: line.boxes.map(box => ({ text: box.text, rect: [clamp01(box.l), clamp01(box.t), clamp01(box.r), clamp01(box.b)] }))
      };
    }).filter(line => line.text).sort((a, b) => a.rect[1] - b.rect[1] || a.rect[0] - b.rect[0]);
  }

  /* Lines → paragraphs: a new paragraph starts when the vertical gap is larger than one line
     height, or when the left edge jumps in (indent), matching how a reader scans a page. */
  function groupParagraphs(lines, gapFactor = .8) {
    const out = [];
    for (const line of lines || []) {
      const previous = out[out.length - 1];
      const height = Math.max(.0001, line.rect[3] - line.rect[1]);
      const gap = previous ? line.rect[1] - previous.rect[3] : 0;
      const indent = previous ? line.rect[0] - previous.rect[0] : 0;
      if (previous && gap <= height * gapFactor && indent < 0.08) {
        previous.lines.push(line);
        previous.text = `${previous.text} ${line.text}`.trim();
        previous.rect = [Math.min(previous.rect[0], line.rect[0]), previous.rect[1], Math.max(previous.rect[2], line.rect[2]), Math.max(previous.rect[3], line.rect[3])];
      } else out.push({ text: line.text, rect: [...line.rect], lines: [line] });
    }
    return out.filter(paragraph => paragraph.text);
  }

  /* Boxes from matchText give a word rectangle per matched word; that is what a selection needs,
     so keep them per word and let the caller place one span per box. */
  function wordBoxes(matches) {
    return (matches || []).filter(m => m && m.text && Array.isArray(m.bbox)).map(m => ({
      text: m.text,
      rect: [clamp01(m.bbox[0]), clamp01(m.bbox[1]), clamp01(m.bbox[2]), clamp01(m.bbox[3])]
    })).filter(box => box.rect[2] > box.rect[0] && box.rect[3] > box.rect[1]);
  }

  const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));

  globalThis.LHN_OCR_CORE = Object.freeze({
    AUTO_LIMITS, planRegions, regionStats, planAuto, groupLines, groupParagraphs, wordBoxes, clamp01
  });
})();
