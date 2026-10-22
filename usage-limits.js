// Local-only billing prototype. Replace the provider methods with server API calls
// when authentication is available; bundled keys and local storage are not secure.
(() => {
  const STORAGE_KEY = "lhnUsageLimitState";
  const TRIAL_MS = 0;
  const KEY_PLANS = Object.freeze({
    "123-456789-123-AAAA": { id: "keyA", dailyLimit: 100 },
    "123-456789-123-BBBB": { id: "keyB", dailyLimit: Infinity }
  });
  const SERVICES = Object.freeze(["translate", "googleTts"]);

  function localDay(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  function create({ browser }) {
    let queue = Promise.resolve();
    // Serializing mutations prevents simultaneous tabs from spending the same last request twice.
    function serialized(work) {
      const result = queue.then(work, work);
      queue = result.catch(() => {});
      return result;
    }
    async function readState() {
      const saved = (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};
      const state = {
        trialStartedAt: Number(saved.trialStartedAt) || Date.now(),
        planId: KEY_PLANS[saved.keyCode]?.id || null,
        keyCode: KEY_PLANS[saved.keyCode] ? saved.keyCode : null,
        usage: saved.usage && typeof saved.usage === "object" ? saved.usage : {}
      };
      if (!saved.trialStartedAt) await browser.storage.local.set({ [STORAGE_KEY]: state });
      return state;
    }
    function planFor(state) {
      if (state.keyCode && KEY_PLANS[state.keyCode]) return KEY_PLANS[state.keyCode];
      return null;
    }
    function details(state, now = Date.now()) {
      const trialActive = now - state.trialStartedAt < TRIAL_MS;
      const plan = planFor(state);
      const dailyLimit = trialActive ? Infinity : plan?.dailyLimit ?? 10;
      const day = localDay(new Date(now));
      const today = state.usage[day] || {};
      return {
        trialActive,
        trialEndsAt: state.trialStartedAt + TRIAL_MS,
        planId: plan?.id || (trialActive ? "trial" : "free"),
        dailyLimit: Number.isFinite(dailyLimit) ? dailyLimit : null,
        usage: Object.fromEntries(SERVICES.map(service => [service, Number(today[service]) || 0])),
        keyActive: Boolean(plan)
      };
    }
    async function status() {
      return serialized(async () => details(await readState()));
    }
    async function initialize() {
      return serialized(async () => details(await readState()));
    }
    async function activate(key) {
      return serialized(async () => {
        const code = String(key || "").trim();
        if (!KEY_PLANS[code]) return { activated: false, reason: "invalid" };
        const state = await readState();
        state.keyCode = code;
        state.planId = KEY_PLANS[code].id;
        await browser.storage.local.set({ [STORAGE_KEY]: state });
        return { activated: true, status: details(state) };
      });
    }
    async function consume(service) {
      if (!SERVICES.includes(service)) return { allowed: false, reason: "invalid-service" };
      return serialized(async () => {
        const state = await readState();
        const status = details(state);
        const used = status.usage[service];
        if (status.dailyLimit !== null && used >= status.dailyLimit) return { allowed: false, status };
        const day = localDay();
        state.usage = { [day]: { ...(state.usage[day] || {}), [service]: used + 1 } };
        await browser.storage.local.set({ [STORAGE_KEY]: state });
        return { allowed: true, status: details(state) };
      });
    }
    return Object.freeze({ initialize, status, activate, consume });
  }
  globalThis.LHN_USAGE_LIMITS = Object.freeze({ create });
})();
