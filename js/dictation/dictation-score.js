// Chấm chính tả dictation: so theo căn chỉnh từ (LCS), bỏ qua hoa thường, dấu câu và nháy cong.
(() => {
  const tokenize = (text) => String(text ?? "")
    .toLowerCase()
    .replace(/[’‘`´']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

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

  // percent: số từ khớp / max(số từ gốc, số từ gõ). perfect: khớp hết và không thừa từ.
  function score(refText, typedText) {
    const ref = tokenize(refText), typed = tokenize(typedText);
    if (!ref.length) return { percent: 0, perfect: false, words: [] };
    const ok = align(ref, typed);
    const matches = ok.filter(Boolean).length;
    const percent = Math.round((matches / Math.max(ref.length, typed.length)) * 100);
    return { percent, perfect: matches === ref.length && typed.length === ref.length, words: ref.map((w, k) => ({ w, ok: ok[k] })) };
  }

  globalThis.LHN_DICTATION_SCORE = Object.freeze({ tokenize, score });
})();
