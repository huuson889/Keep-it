// Map Reader voice region codes to the local Twemoji country-flag font.
// The visible flags are Unicode regional-indicator emoji; keep this table small and SVG-free.
(() => {
  const supportedRegions = `BR KR RU CN IT ID TH IN PL UA TR IR BD PH RO SA TW HK AU CA IE ZA NZ MX AR CO CL AT CH PT NL BE SE NO DK FI CZ GR HU MY IL KZ AE BH DZ EG IQ JO KW LB LY MA OM QA SY TN YE AZ BG BA KE NG SG TZ BO CR CU DO EC GQ GT HN NI PA PE PR PY SV UY VE EE HR IS US GB VN FR DE JP ES`.split(" ");
  const regionKeys = Object.freeze({
    ...Object.fromEntries(supportedRegions.map(code => [code, code])),
    CANS: "CA",
    UK: "GB"
  });

  function emojiForRegion(region) {
    const key = String(region || "").toUpperCase();
    const code = regionKeys[key] || "US";
    return Array.from(code, character => String.fromCodePoint(0x1f1e6 + character.charCodeAt(0) - 65)).join("");
  }

  globalThis.LHN_FLAGS = Object.freeze({ regionKeys, emojiForRegion });
})();
