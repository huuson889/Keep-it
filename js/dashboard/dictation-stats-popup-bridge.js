(() => {
  const trigger = document.getElementById("listenDetailedStatsBtn");
  const frame = document.getElementById("dictationStatsPopupFrame");
  if (!trigger || !frame) return;

  let openSequence = 0;
  let returnFocus = null;
  function postOpen(sequence) {
    if (frame.hidden || sequence !== openSequence) return;
    frame.contentWindow?.postMessage({ type:"KEEPIT_DICTATION_STATS_OPEN", lang:document.documentElement.lang || "vi" }, location.origin);
  }
  function openPopup() {
    returnFocus = document.activeElement;
    const sequence = ++openSequence;
    frame.hidden = false;
    frame.setAttribute("aria-hidden", "false");
    const send = () => requestAnimationFrame(() => postOpen(sequence));
    try {
      if (frame.contentDocument?.readyState === "complete") send();
      else frame.addEventListener("load", send, { once:true });
    } catch { frame.addEventListener("load", send, { once:true }); }
  }
  trigger.addEventListener("click", openPopup);
  window.addEventListener("message", event => {
    if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== "KEEPIT_DICTATION_STATS_CLOSE") return;
    openSequence++;
    frame.hidden = true;
    frame.setAttribute("aria-hidden", "true");
    returnFocus?.focus?.();
    returnFocus = null;
  });
  frame.addEventListener("load", () => {
    if (!frame.hidden) postOpen(openSequence);
  });
})();
