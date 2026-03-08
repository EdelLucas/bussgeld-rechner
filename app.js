const $ = (id) => document.getElementById(id);

const GESETZE = [
  { id: "stgb-3-1", para: "StGB §3.1", name: "Beleidigung", fine: 10000, wanted: 0, info: "" },
  { id: "stgb-3-2", para: "StGB §3.2", name: "Belästigung", fine: 10000, wanted: 0, info: "" },
  { id: "stgb-3-3", para: "StGB §3.3", name: "Drohung", fine: 5000, wanted: 1, info: "" },
  { id: "stgb-4-1", para: "StGB §4.1", name: "Versuchter Mord / Mord", fine: 30000, wanted: 5, info: "" },
  { id: "stgb-4-2", para: "StGB §4.2", name: "Körperverletzung", fine: 15000, wanted: 2, info: "" },
  { id: "stgb-4-3", para: "StGB §4.3", name: "Körperverletzung mit Todesfolge", fine: 20000, wanted: 3, info: "" },
  { id: "stgb-4-4", para: "StGB §4.4", name: "Gewaltsame Drohung", fine: 5000, wanted: 1, info: "" },
  { id: "stgb-11", para: "StGB §11", name: "Raub", fine: 25000, wanted: 3, info: "" },
  { id: "stgb-13", para: "StGB §13", name: "Einbruch", fine: 15000, wanted: 2, info: "" },
  { id: "stgb-15-5", para: "StGB §15.5", name: "Widerstand gegen Vollstreckungsbeamte", fine: 20000, wanted: 2, info: "" }
];

const els = {
  cards: $("cards"),
  searchInput: $("searchInput"),
  selectedCount: $("selectedCount"),
  sumFine: $("sumFine"),
  sumWanted: $("sumWanted"),
  plateInput: $("plateInput"),
  placeInput: $("placeInput"),
  azInput: $("azInput"),
  aktenText: $("aktenText"),
  btnReset: $("btnReset"),
  btnCopy: $("btnCopy"),
  copyStatus: $("copyStatus"),
  liveStamp: $("liveStamp"),
  themeSelect: $("themeSelect"),
  layoutSelect: $("layoutSelect"),
  rightsReadToggle: $("rightsReadToggle"),
  manualWantedInput: $("manualWantedInput"),
  manualWantedStars: $("manualWantedStars"),
  manualFineInput: $("manualFineInput"),
};

const state = {
  selected: new Set(),
  search: "",
};

function formatMoney(value) {
  const rounded = Math.round(Number(value) || 0);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function starsYellow(count) {
  return "★".repeat(Math.max(0, Number(count) || 0));
}

function starsGray(count, total = 5) {
  const active = Math.max(0, Number(count) || 0);
  const off = Math.max(0, total - active);
  return "★".repeat(active) + "☆".repeat(off);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFilteredItems() {
  const q = state.search.trim().toLowerCase();
  if (!q) return GESETZE;

  return GESETZE.filter(item =>
    item.para.toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    (item.info || "").toLowerCase().includes(q)
  );
}

function renderCards() {
  const items = getFilteredItems();

  els.cards.innerHTML = items.map(item => {
    const selected = state.selected.has(item.id);

    return `
      <div class="card ${selected ? "selected" : ""}" data-id="${escapeHtml(item.id)}">
        <div class="card-top">
          <div class="card-para">${escapeHtml(item.para)}</div>
          <div class="card-link">↗</div>
        </div>

        <div class="card-name">${escapeHtml(item.name)}</div>

        <div class="card-meta">
          <div class="card-fine">${formatMoney(item.fine)}</div>
          ${item.info ? `<div class="card-info">${escapeHtml(item.info)}</div>` : ""}
        </div>

        <div class="card-bottom">
          <div class="card-stars">${item.wanted ? starsYellow(item.wanted) : "—"}</div>
        </div>
      </div>
    `;
  }).join("");

  els.cards.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      if (state.selected.has(id)) state.selected.delete(id);
      else state.selected.add(id);
      updateUI();
    });
  });
}

function getSelectedItems() {
  return GESETZE.filter(item => state.selected.has(item.id));
}

function getHighestFine(items) {
  const highest = items.length ? Math.max(...items.map(i => Number(i.fine || 0))) : 0;
  const manual = Number(els.manualFineInput.value || 0);
  return highest + manual;
}

function getHighestWanted(items) {
  const highest = items.length ? Math.max(...items.map(i => Number(i.wanted || 0))) : 0;
  const manual = Number(els.manualWantedInput.value || 0);
  return highest + manual;
}

function buildAktenText(items, fine, wanted) {
  const now = new Date();
  const date = now.toLocaleDateString("de-DE");
  const time = now.toLocaleTimeString("de-DE");

  const az = els.azInput.value.trim();
  const plate = els.plateInput.value.trim();
  const place = els.placeInput.value.trim();

  const lines = [];
  lines.push(`Datum: ${date}`);
  lines.push(`Uhrzeit: ${time}`);

  if (az) lines.push(`Aktenzeichen: ${az}`);
  if (plate) lines.push(`Kennzeichen: ${plate}`);
  if (place) lines.push(`Ort: ${place}`);

  lines.push("");
  lines.push("Straftaten:");

  if (items.length) {
    items.forEach(item => {
      const extra = item.info ? ` | ${item.info}` : "";
      lines.push(`${item.para} ${item.name}${extra}`);
    });
  } else {
    lines.push("—");
  }

  lines.push("");
  lines.push(`Höchste Geldstrafe: ${formatMoney(fine)}`);
  lines.push(`Höchste Wanteds: ${wanted ? `${wanted} (${starsYellow(wanted)})` : "—"}`);
  lines.push(`Rechte vorgelesen: ${els.rightsReadToggle.checked ? "Ja" : "Nein"}`);

  return lines.join("\n");
}

function updateLiveStamp() {
  const now = new Date();
  els.liveStamp.textContent = `${now.toLocaleDateString("de-DE")} | ${now.toLocaleTimeString("de-DE")}`;
}

function updateManualStars() {
  const count = Number(els.manualWantedInput.value || 0);
  els.manualWantedStars.textContent = starsGray(count, 5);
}

function updateSummary() {
  const items = getSelectedItems();
  const fine = getHighestFine(items);
  const wanted = getHighestWanted(items);

  els.selectedCount.textContent = String(items.length);
  els.sumFine.textContent = formatMoney(fine);
  els.sumWanted.textContent = wanted ? starsYellow(wanted) : "—";
  els.aktenText.value = buildAktenText(items, fine, wanted);

  updateManualStars();
}

function updateUI() {
  renderCards();
  updateSummary();
}

function resetAll() {
  state.selected.clear();
  state.search = "";
  els.searchInput.value = "";
  els.plateInput.value = "";
  els.placeInput.value = "";
  els.azInput.value = "";
  els.manualWantedInput.value = "0";
  els.manualFineInput.value = "0";
  els.rightsReadToggle.checked = false;
  els.copyStatus.textContent = "Nicht kopiert";
  updateUI();
}

async function copyCurrentText() {
  if (!els.rightsReadToggle.checked) {
    els.copyStatus.textContent = "Rechte nicht vorgelesen";
    return;
  }

  try {
    await navigator.clipboard.writeText(els.aktenText.value || "");
    els.copyStatus.textContent = "Kopiert";
  } catch {
    els.copyStatus.textContent = "Fehler beim Kopieren";
  }
}

function setupTabs() {
  const buttons = document.querySelectorAll(".top-btn[data-tab]");
  const tabs = document.querySelectorAll(".tab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      tabs.forEach(tab => tab.classList.remove("active"));

      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add("active");
    });
  });
}

function setupTheme() {
  els.themeSelect.addEventListener("change", () => {
    document.body.className = els.themeSelect.value;
  });
}

function setupLayout() {
  els.layoutSelect.addEventListener("change", () => {
    els.cards.classList.toggle("list-view", els.layoutSelect.value === "list");
  });
}

function setupManualControls() {
  document.querySelectorAll("[data-wanted-adjust]").forEach(btn => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.wantedAdjust || 0);
      const current = Number(els.manualWantedInput.value || 0);
      const next = Math.max(0, current + step);
      els.manualWantedInput.value = String(next);
      updateSummary();
    });
  });
}

els.searchInput.addEventListener("input", (e) => {
  state.search = e.target.value || "";
  renderCards();
});

[
  els.plateInput,
  els.placeInput,
  els.azInput,
  els.manualWantedInput,
  els.manualFineInput,
  els.rightsReadToggle
].forEach(el => {
  el.addEventListener("input", updateSummary);
  el.addEventListener("change", updateSummary);
});

els.btnReset.addEventListener("click", resetAll);
els.btnCopy.addEventListener("click", copyCurrentText);

els.liveStamp.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(els.liveStamp.textContent || "");
    els.copyStatus.textContent = "Zeit kopiert";
  } catch {
    els.copyStatus.textContent = "Zeit nicht kopiert";
  }
});

setupTabs();
setupTheme();
setupLayout();
setupManualControls();
updateLiveStamp();

setInterval(() => {
  updateLiveStamp();
  updateSummary();
}, 1000);

updateUI();
