(function () {
  let initialized = false;

  function boot() {
    if (initialized) return;
    initialized = true;

    if (!window.LAW_DATA || !window.initUI || !window.initThemeControls) {
      console.error("Dateien fehlen oder wurden in falscher Reihenfolge geladen.");
      return;
    }

    try {
      window.initUI({
        lawData: window.LAW_DATA,
        groupOrder: window.GROUP_ORDER,
        fibcoFieldIds: window.FIBCO_FIELD_IDS
      });

      window.initThemeControls();
    } catch (error) {
      console.error("Initialisierung fehlgeschlagen:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
