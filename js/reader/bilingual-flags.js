// Map Reader voice region codes to the local Twemoji country-flag font (assets/fonts/TwemojiCountryFlags.woff2).
// The visible flags are Unicode regional-indicator emoji. v3.5.236: the table lists every flag the font has (258),
// so every Edge/Chrome voice region (ET, GE, KH, LA, LT, LV, MK, MN, MT, MM, NP, AF, LK, SK, SI, SO, AL, RS, PK, UZ…) gets its own flag.
(() => {
  const supportedRegions = `
AC AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC
CD CF CG CH CI CK CL CM CN CO CP CR CU CV CW CX CY CZ DE DG DJ DK DM DO DZ EA EC EE EG EH ER ES ET EU FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU IC ID IE IL IM IN IO IQ IR IS IT JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU
MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB
SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TA TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM UN
US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW
`.trim().split(/\s+/);
  const regionKeys = Object.freeze({
    ...Object.fromEntries(supportedRegions.map(code => [code, code])),
    CANS: "CA",
    UK: "GB"
  });

  // Region of a BCP-47 tag: first 2-letter or 3-digit subtag after the language (iu-Latn-CA → CA, zh-CN-liaoning → CN).
  function regionOfLang(lang) {
    return String(lang || "").split(/[-_]/).slice(1).find(part => /^[a-z]{2}$|^\d{3}$/i.test(part))?.toUpperCase() || "";
  }

  function emojiForRegion(region) {
    const key = String(region || "").toUpperCase();
    const code = regionKeys[key] || "US";
    return Array.from(code, character => String.fromCodePoint(0x1f1e6 + character.charCodeAt(0) - 65)).join("");
  }

  globalThis.LHN_FLAGS = Object.freeze({ regionKeys, emojiForRegion, regionOfLang });
})();
