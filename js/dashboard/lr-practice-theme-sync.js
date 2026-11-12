(() => {
  let parentRoot;
  try {
    if (window.parent === window) return;
    parentRoot = window.parent.document.documentElement;
  } catch {
    return;
  }

  const syncDashboardTheme = () => {
    const isDark = parentRoot.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  };

  syncDashboardTheme();
  new MutationObserver(syncDashboardTheme).observe(parentRoot, {
    attributes: true,
    attributeFilter: ["class"]
  });
})();
