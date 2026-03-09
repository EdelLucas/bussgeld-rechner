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
  modals: document.querySelectorAll(".modal-backdrop")
};

const state = {
  selected: new Set(),
  search: "",
  extraWantedById: {}
};

function formatMoney(value) {
  const rounded = Math.round(Number(value) || 0);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function formatDate(now = new Date()) {
  return now.toLocaleDateString("de-DE");
}

function formatTime(now = new Date()) {
  return now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function starsYellow(count) {
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

function getItemExtraWanted(id) {
  return Number(state.extraWantedById[id] || 0);
}

function getEffectiveWanted(item) {
  return Number(item.wanted || 0) + getItemExtraWanted(item.id);
}

function renderCards() {
  const items = getFilteredItems();

  els.cards.innerHTML = items.map(item => {
    const selected = state.selected.has(item.id);
    const effectiveWanted = getEffectiveWanted(item);
    const extraWanted = getItemExtraWanted(item.id);

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
          <div class="card-stars">${effectiveWanted ? starsYellow(effectiveWanted) : "—"}</div>

          <div class="card-gray-tools" data-stop-click="true">
            <button class="gray-mini-btn" type="button" data-extra-minus="${escapeHtml(item.id)}">−</button>
            <div class="gray-mini-count" title="Graue Zusatz-Wanteds">${extraWanted}</div>
            <button class="gray-mini-btn" type="button" data-extra-plus="${escapeHtml(item.id)}">+</button>
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

  els.cards.querySelectorAll("[data-extra-plus]").forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = btn.dataset.extraPlus;
      state.extraWantedById[id] = getItemExtraWanted(id) + 1;
      updateUI();
    });
  });

  els.cards.querySelectorAll("[data-extra-minus]").forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = btn.dataset.extraMinus;
      state.extraWantedById[id] = Math.max(0, getItemExtraWanted(id) - 1);
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
  const highest = items.length ? Math.max(...items.map(i => getEffectiveWanted(i))) : 0;
  return highest;
}

function buildCompactAkteLine(items) {
  const now = new Date();
  const date = formatDate(now);
  const time = formatTime(now);
  const paras = items.map(item => item.para).join(" + ");
  return `${date} | ${time} - ${paras || "—"}`;
}

function buildAktenText(items, fine, wanted) {
  const now = new Date();
  const date = formatDate(now);
  const time = formatTime(now);

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
      const gray = getItemExtraWanted(item.id) > 0 ? ` | Zusatz-Wanteds: ${getItemExtraWanted(item.id)}` : "";
      lines.push(`${item.para} ${item.name}${extra}${gray}`);
    });
  } else {
    lines.push("—");
  }

  lines.push("");
  lines.push(`Höchste Geldstrafe: ${formatMoney(fine)}`);
  lines.push(`Höchste Wanteds: ${wanted ? `${wanted} (${starsYellow(wanted)})` : "—"}`);
  lines.push(`Kurze Aktenzeile: ${buildCompactAkteLine(items)}`);
  lines.push(`Rechte vorgelesen: ${els.rightsReadToggle.checked ? "Ja" : "Nein"}`);

  return lines.join("\n");
}

function updateLiveStamp() {
  const now = new Date();
  els.liveStamp.textContent = `${formatDate(now)} | ${now.toLocaleTimeString("de-DE")}`;
}

function updateSummary() {
  const items = getSelectedItems();
  const fine = getHighestFine(items);
  const wanted = getHighestWanted(items);

  els.selectedCount.textContent = String(items.length);
  els.sumFine.textContent = formatMoney(fine);
  els.sumWanted.textContent = wanted ? starsYellow(wanted) : "—";
  els.aktenLine.textContent = buildCompactAkteLine(items);
  els.aktenText.value = buildAktenText(items, fine, wanted);
}

function updateUI() {
  renderCards();
  updateSummary();
}

function resetAll() {
  state.selected.clear();
  state.search = "";
  state.extraWantedById = {};
  els.searchInput.value = "";
  els.plateInput.value = "";
  els.placeInput.value = "";
  els.azInput.value = "";
  els.manualFineInput.value = "0";
  els.rightsReadToggle.checked = false;
  els.copyStatus.textContent = "Nicht kopiert";
  updateUI();
}

async function copyText(value, successText, failText) {
  try {
    await navigator.clipboard.writeText(value || "");
    els.copyStatus.textContent = successText;
  } catch {
    els.copyStatus.textContent = failText;
  }
}

async function copyCurrentText() {
  if (!els.rightsReadToggle.checked) {
    els.copyStatus.textContent = "Rechte nicht vorgelesen";
    return;
  }
  await copyText(els.aktenText.value, "Akte kopiert", "Fehler beim Kopieren");
}

async function copyCurrentLine() {
  if (!els.rightsReadToggle.checked) {
    els.copyStatus.textContent = "Rechte nicht vorgelesen";
    return;
  }
  await copyText(els.aktenLine.textContent, "Zeile kopiert", "Fehler beim Kopieren");
}

function setupTopButtons() {
  const strafeBtn = $("btnStraftaten");
  if (strafeBtn) {
    strafeBtn.addEventListener("click", () => {
      closeAllModals();
    });
  }

  document.querySelectorAll("[data-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".top-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      openModal(btn.dataset.modal);
    });
  });
}

function openModal(id) {
  closeAllModals();
  const modal = $(id);
  if (modal) modal.classList.remove("hidden");
}

function closeAllModals() {
  els.modals.forEach(modal => modal.classList.add("hidden"));
  document.querySelectorAll(".top-btn").forEach(b => b.classList.remove("active"));
  const straftatenBtn = $("btnStraftaten");
  if (straftatenBtn) straftatenBtn.classList.add("active");
}

function setupModals() {
  els.modals.forEach(modal => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeAllModals();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", closeAllModals);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllModals();
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

els.searchInput.addEventListener("input", (e) => {
  state.search = e.target.value || "";
  renderCards();
});

[
  els.plateInput,
  els.placeInput,
  els.azInput,
  els.manualFineInput,
  els.rightsReadToggle
].forEach(el => {
  el.addEventListener("input", updateSummary);
  el.addEventListener("change", updateSummary);
});

els.btnReset.addEventListener("click", resetAll);
els.btnCopy.addEventListener("click", copyCurrentText);
els.btnCopyLine.addEventListener("click", copyCurrentLine);

els.liveStamp.addEventListener("click", async () => {
  await copyText(els.liveStamp.textContent, "Zeit kopiert", "Zeit nicht kopiert");
});

els.aktenLine.addEventListener("click", copyCurrentLine);

setupTopButtons();
setupModals();
setupTheme();
setupLayout();
updateLiveStamp();

setInterval(() => {
  updateLiveStamp();
  updateSummary();
}, 1000);

updateUI();
