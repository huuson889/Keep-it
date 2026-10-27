// Chấm chính tả dictation: so theo căn chỉnh từ (LCS), bỏ qua hoa thường, dấu câu và nháy cong.
// diff(): căn chỉnh từng từ (ok / wrong / extra / missing) để hiện phần phân tích lỗi.
(() => {
  const APOS = /[’‘`´']/g;
  const normWord = (word) => String(word ?? "").toLowerCase().replace(APOS, "").replace(/[^\p{L}\p{N}]+/gu, "");
  const words = (text) => (String(text ?? "").match(/[\p{L}\p{N}’‘`´']+/gu) || [])
    .map((raw) => ({ raw: raw.replace(/^[’‘`´']+|[’‘`´']+$/g, ""), norm: normWord(raw) }))
    .filter((word) => word.norm);
  const tokenize = (text) => words(text).map((word) => word.norm);

  // Đánh dấu từ nào của câu gốc được khớp theo thứ tự (LCS)
  function align(ref, typed) {
    const n = ref.length, m = typed.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = ref[i] === typed[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const ok = new Array(n).fill(false);
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (ref[i] === typed[j]) { ok[i] = true; i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return ok;
  }

  // Edit-distance theo từ: trả về danh sách thao tác theo thứ tự câu gõ/câu gốc.
  function diff(refText, typedText) {
    const ref = words(refText), typed = words(typedText);
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
          ops.push(same
            ? { type: "ok", typed: typed[j - 1].raw, expected: ref[i - 1].raw }
            : { type: "wrong", typed: typed[j - 1].raw, expected: ref[i - 1].raw });
          i--; j--;
          continue;
        }
      }
      if (i > 0 && d[i][j] === d[i - 1][j] + 1) { ops.push({ type: "missing", expected: ref[i - 1].raw }); i--; }
      else { ops.push({ type: "extra", typed: typed[j - 1].raw }); j--; }
    }
    return ops.reverse();
  }

  // percent: số từ khớp / max(số từ gốc, số từ gõ). perfect: khớp hết và không thừa từ.
  function score(refText, typedText) {
    const ref = tokenize(refText), typed = tokenize(typedText);
    if (!ref.length) return { percent: 0, perfect: false, words: [], ops: [] };
    const ok = align(ref, typed);
    const matches = ok.filter(Boolean).length;
    const percent = Math.round((matches / Math.max(ref.length, typed.length)) * 100);
    return {
      percent,
      perfect: matches === ref.length && typed.length === ref.length,
      words: ref.map((w, k) => ({ w, ok: ok[k] })),
      ops: diff(refText, typedText),
    };
  }

  globalThis.LHN_DICTATION_SCORE = Object.freeze({ tokenize, score, diff });
})();
