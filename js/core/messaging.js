(() => {
  const runtime = globalThis.browser?.runtime;
  if (!runtime?.sendMessage || !runtime?.onMessage) return;

  function sendMessage(message, options) {
    return runtime.sendMessage(message, options);
  }

  globalThis.LHN_MESSAGING = Object.freeze({
    sendMessage,
    onMessage: runtime.onMessage
  });
})();