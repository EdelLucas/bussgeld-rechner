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

const state = {
  selected: new Set(),
  search: "",
  extraWantedById: {}
};

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
  aktenLine: $("aktenLine"),
  btnReset: $("btnReset"),
  btnCopy: $("btnCopy"),
  btnCopyLine: $("btnCopyLine"),
  copyStatus: $("copyStatus"),
  liveStamp: $("liveStamp"),
  themeSelect: $("themeSelect"),
  layoutSelect: $("layoutSelect"),
  rightsReadToggle: $("rightsReadToggle"),
  manualFineInput: $("manualFineInput"),
  btnStraftaten: $("btnStraftaten")
};

function formatMoney(value) {
  const rounded = Math.round(Number(value) || 0);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function formatDate(now = new Date()) {
  return now.toLocaleDateString("de-DE");
}

function formatTime(now = new Date()) {
  return now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function stars(count) {
  return "★".repeat(Math.max(0, Number(count) || 0));
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

function getExtraWanted(id) {
  return Number(state.extraWantedById[id] || 0);
}

function getEffectiveWanted(item) {
  return Number(item.wanted || 0) + getExtraWanted(item.id);
}

function renderCards() {
  if (!els.cards) return;

  const items = getFilteredItems();

  els.cards.innerHTML = items.map(item => {
    const selected = state.selected.has(item.id);
    const extraWanted = getExtraWanted(item.id);
    const effectiveWanted = getEffectiveWanted(item);

    return `
      <div class="card ${selected ? "selected" : ""}" data-id="${escapeHtml(item.id)}">
        <div class="card-top">
          <div class="card-para">${escapeHtml(item.para)}</div>
          <div class="card-link">✨</div>
        </div>

        <div class="card-name">${escapeHtml(item.name)}</div>

        <div class="card-meta">
          <div class="card-fine">${formatMoney(item.fine)}</div>
          ${item.info ? `<div class="card-info">${escapeHtml(item.info)}</div>` : ""}
        </div>

        <div class="card-bottom">
          <div class="card-stars">${effectiveWanted ? stars(effectiveWanted) : "—"}</div>
          <div class="card-gray-tools" data-stop-click="true">
            <button class="gray-mini-btn" type="button" data-minus="${escapeHtml(item.id)}">−</button>
            <div class="gray-mini-count">${extraWanted}</div>
            <button class="gray-mini-btn" type="button" data-plus="${escapeHtml(item.id)}">+</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  els.cards.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-stop-click='true']")) return;

      const id = card.dataset.id;
      if (state.selected.has(id)) state.selected.delete(id);
      else state.selected.add(id);

      updateUI();
    });
  });

  els.cards.querySelectorAll("[data-plus]").forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = btn.dataset.plus;
      state.extraWantedById[id] = getExtraWanted(id) + 1;
      updateUI();
    });
  });

  els.cards.querySelectorAll("[data-minus]").forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = btn.dataset.minus;
      state.extraWantedById[id] = Math.max(0, getExtraWanted(id) - 1);
      updateUI();
    });
  });
}

function getSelectedItems() {
  return GESETZE.filter(item => state.selected.has(item.id));
}

function getHighestFine(items) {
  const highest = items.length ? Math.max(...items.map(i => Number(i.fine || 0))) : 0;
  const extra = Number(els.manualFineInput?.value || 0);
  return highest + extra;
}

function getHighestWanted(items) {
  return items.length ? Math.max(...items.map(i => getEffectiveWanted(i))) : 0;
}

function buildCompactLine(items) {
  const now = new Date();
  const date = now.toLocaleDateString("de-DE");
  const time = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const paras = items.map(item => item.para).join(" + ");
  return `${date} | ${time} - ${paras || "—"}`;
}

function buildAktenText(items, fine, wanted) {
  const now = new Date();
  const date = formatDate(now);
  const time = formatTime(now);

  const az = els.azInput?.value.trim() || "";
  const plate = els.plateInput?.value.trim() || "";
  const place = els.placeInput?.value.trim() || "";

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
      const plus = getExtraWanted(item.id) > 0 ? ` | Zusatz-Wanteds: ${getExtraWanted(item.id)}` : "";
      lines.push(`${item.para} ${item.name}${extra}${plus}`);
    });
  } else {
    lines.push("—");
  }

  lines.push("");
  lines.push(`Höchste Geldstrafe: ${formatMoney(fine)}`);
  lines.push(`Höchste Wanteds: ${wanted ? `${wanted} (${stars(wanted)})` : "—"}`);
  lines.push(`Kurze Aktenzeile: ${buildCompactLine(items)}`);
  lines.push(`Rechte vorgelesen: ${els.rightsReadToggle?.checked ? "Ja" : "Nein"}`);

  return lines.join("\n");
}

function updateLiveStamp() {
  if (!els.liveStamp) return;
  const now = new Date();
  els.liveStamp.textContent = `${formatDate(now)} | ${formatTime(now)}`;
}

function updateSummary() {
  const items = getSelectedItems();
  const fine = getHighestFine(items);
  const wanted = getHighestWanted(items);

  if (els.selectedCount) els.selectedCount.textContent = String(items.length);
  if (els.sumFine) els.sumFine.textContent = formatMoney(fine);
  if (els.sumWanted) els.sumWanted.textContent = wanted ? stars(wanted) : "—";
  if (els.aktenLine) els.aktenLine.textContent = buildCompactLine(items);
  if (els.aktenText) els.aktenText.value = buildAktenText(items, fine, wanted);
}

function updateUI() {
  renderCards();
  updateSummary();
}

function resetAll() {
  state.selected.clear();
  state.search = "";
  state.extraWantedById = {};

  if (els.searchInput) els.searchInput.value = "";
  if (els.plateInput) els.plateInput.value = "";
  if (els.placeInput) els.placeInput.value = "";
  if (els.azInput) els.azInput.value = "";
  if (els.manualFineInput) els.manualFineInput.value = "0";
  if (els.rightsReadToggle) els.rightsReadToggle.checked = false;
  if (els.copyStatus) els.copyStatus.textContent = "Nicht kopiert";

  updateUI();
}

async function copyText(value, okText, failText) {
  try {
    await navigator.clipboard.writeText(value || "");
    if (els.copyStatus) els.copyStatus.textContent = okText;
  } catch {
    if (els.copyStatus) els.copyStatus.textContent = failText;
  }
}

async function copyAkte() {
  if (!els.rightsReadToggle?.checked) {
    if (els.copyStatus) els.copyStatus.textContent = "Rechte nicht vorgelesen";
    return;
  }
  await copyText(els.aktenText?.value || "", "Akte kopiert", "Fehler beim Kopieren");
}

async function copyLine() {
  if (!els.rightsReadToggle?.checked) {
    if (els.copyStatus) els.copyStatus.textContent = "Rechte nicht vorgelesen";
    return;
  }
  await copyText(els.aktenLine?.textContent || "", "Zeile kopiert", "Fehler beim Kopieren");
}

function closeAllModals() {
  document.querySelectorAll(".modal-backdrop").forEach(modal => modal.classList.add("hidden"));
  document.querySelectorAll(".top-btn").forEach(btn => btn.classList.remove("active"));
  if (els.btnStraftaten) els.btnStraftaten.classList.add("active");
}

function openModal(id, button) {
  closeAllModals();
  const modal = $(id);
  if (modal) modal.classList.remove("hidden");
  if (button) button.classList.add("active");
}

function setupModals() {
  document.querySelectorAll("[data-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      openModal(btn.dataset.modal, btn);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".modal-backdrop").forEach(modal => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeAllModals();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllModals();
  });

  if (els.btnStraftaten) {
    els.btnStraftaten.addEventListener("click", closeAllModals);
  }
}

function setupTheme() {
  if (!els.themeSelect) return;
  els.themeSelect.addEventListener("change", () => {
    document.body.className = els.themeSelect.value;
  });
}

function setupLayout() {
  if (!els.layoutSelect) return;
  els.layoutSelect.addEventListener("change", () => {
    if (!els.cards) return;
    els.cards.classList.toggle("list-view", els.layoutSelect.value === "list");
  });
}

function bindInputs() {
  [
    els.plateInput,
    els.placeInput,
    els.azInput,
    els.manualFineInput,
    els.rightsReadToggle
  ].forEach(el => {
    if (!el) return;
    el.addEventListener("input", updateSummary);
    el.addEventListener("change", updateSummary);
  });

  if (els.searchInput) {
    els.searchInput.addEventListener("input", (e) => {
      state.search = e.target.value || "";
      renderCards();
    });
  }

  if (els.btnReset) els.btnReset.addEventListener("click", resetAll);
  if (els.btnCopy) els.btnCopy.addEventListener("click", copyAkte);
  if (els.btnCopyLine) els.btnCopyLine.addEventListener("click", copyLine);
  if (els.liveStamp) els.liveStamp.addEventListener("click", () => copyText(els.liveStamp.textContent, "Zeit kopiert", "Zeit nicht kopiert"));
  if (els.aktenLine) els.aktenLine.addEventListener("click", copyLine);
}

function boot() {
  setupModals();
  setupTheme();
  setupLayout();
  bindInputs();
  updateLiveStamp();
  updateUI();

  setInterval(() => {
    updateLiveStamp();
    updateSummary();
  }, 1000);
}

boot();
