// Country-flag support detection adapted from country-flag-emoji-polyfill (MIT); see THIRD_PARTY_NOTICES.md.
(() => {
  const root = document.documentElement;
  if (!root) return;

  function supportsColorEmoji(text) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context?.getImageData) return true;
    context.textBaseline = "top";
    context.font = '100px "Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif';
    context.scale(0.01, 0.01);

    const color = fill => {
      context.clearRect(0, 0, 100, 100);
      context.fillStyle = fill;
      context.fillText(text, 0, 0);
      return Array.from(context.getImageData(0, 0, 1, 1).data).join(",");
    };
    try {
      const white = color("#fff"), black = color("#000");
      return black === white && !black.startsWith("0,0,0,");
    } catch {
      return true;
    }
  }

  // Load the bundled subset only when the browser draws normal color emoji but lacks flag glyphs.
  if (supportsColorEmoji("😊") && !supportsColorEmoji("🇨🇭")) {
    root.classList.add("lhn-twemoji-country-flags");
  }
})();
