(() => {
  const KEY = 'lhnDashboardDemoProfile';
  async function saveProfile(browserApi, profile) { await browserApi.storage.local.set({ [KEY]:profile }); return profile; }
  async function removeProfile(browserApi) { await browserApi.storage.local.remove(KEY); }
  globalThis.LHN_ACCOUNT = Object.freeze({ KEY, saveProfile, removeProfile });
})();