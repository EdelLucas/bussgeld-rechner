document.addEventListener("DOMContentLoaded", function () {
  if (!window.LAW_DATA || !window.initUI || !window.initThemeControls) {
    console.error("Dateien fehlen oder wurden in falscher Reihenfolge geladen.");
    return;
  }

  window.initUI({
    lawData: window.LAW_DATA,
    groupOrder: window.GROUP_ORDER,
    fibcoFieldIds: window.FIBCO_FIELD_IDS
  });

  window.initThemeControls();
});
