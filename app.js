import { STRAFTATEN } from "./data-straftaten.js";

const $ = (id) => document.getElementById(id);

const els = {
  cards: $("cards"),
  searchInput: $("searchInput"),
  selectedCount: $("selectedCount"),

  sumFine: $("sumFine"),
  sumWanted: $("sumWanted"),
  sumJail: $("sumJail"),
  sumCount: $("sumCount"),

  modReue: $("modReue"),
  modRepeat: $("modRepeat"),
  modSystem: $("modSystem"),
  wantedMode: $("wantedMode"),

  azInput: $("azInput"),
  aktenFormat: $("aktenFormat"),
  aktenText: $("aktenText"),
  lastUpdate: $("lastUpdate"),
  copyState: $("copyState"),

  btnReset: $("btnReset"),
  btnCopy: $("btnCopy"),
};

const state = {
  selected: new Set(),
  search: "",
};

function formatMoney(value) {
  const rounded = Math.round(value);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function formatJail(minutes) {
  return `${Math.round(minutes)} Min.`;
}

function stars(count) {
  return "★".repeat(Math.max(0, Math.min(6, count)));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFilteredItems() {
  const q = state.search.trim().toLowerCase();
  if (!q) return STRAFTATEN;

  return STRAFTATEN.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.para.toLowerCase().includes(q) ||
    item.id.toLowerCase().includes(q)
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
        </div>

        <div class="card-bottom">
          <div class="card-jail">${formatJail(item.jail)}</div>
          <div class="card-stars">${item.wanted ? stars(item.wanted) : "—"}</div>
        </div>
      </div>
    `;
  }).join("");

  els.cards.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      toggleSelection(id);
    });
  });
}

function toggleSelection(id) {
  if (state.selected.has(id)) {
    state.selected.delete(id);
  } else {
    state.selected.add(id);
  }
  updateUI();
}

function getSelectedItems() {
  return STRAFTATEN.filter(item => state.selected.has(item.id));
}

function calculateWanted(items) {
  const mode = els.wantedMode.value;
  const systemWanted = Number(els.modSystem.value || 0);

  if (!items.length) return systemWanted;

  const itemWanteds = items.map(item => item.wanted || 0);

  let baseWanted = 0;

  if (mode === "sum") {
    baseWanted = itemWanteds.reduce((sum, value) => sum + value, 0);
  } else {
    baseWanted = Math.max(...itemWanteds);
  }

  return Math.max(0, baseWanted + systemWanted);
}

function calculateTotals() {
  const items = getSelectedItems();

  let fine = items.reduce((sum, item) => sum + item.fine, 0);
  let jail = items.reduce((sum, item) => sum + item.jail, 0);
  let wanted = calculateWanted(items);

  if (els.modReue.checked) {
    fine *= 0.8;
  }

  if (els.modRepeat.checked) {
    fine *= 1.5;
    jail *= 1.25;
  }

  fine = Math.round(fine);
  jail = Math.round(jail);

  return {
    items,
    fine,
    jail,
    wanted,
    count: items.length,
  };
}

function buildAktenzeile(data) {
  const az = els.azInput.value.trim();
  const format = els.aktenFormat.value;

  const paraList = data.items.map(item => item.para.replace("StGB ", ""));
  const detailList = data.items.map(item => `${item.para.replace("StGB ", "")} ${item.name}`);

  const mods = [];
  if (els.modReue.checked) mods.push("Reue (-20% Geldstrafe)");
  if (els.modRepeat.checked) mods.push("Wiederholungstäter (+50% Geldstrafe, +25% Haftzeit)");
  if (Number(els.modSystem.value || 0) > 0) mods.push(`Systemwanteds +${els.modSystem.value}`);
  mods.push(`Wanted-Modus: ${els.wantedMode.value === "sum" ? "Addieren" : "Höchste Tat"}`);

  if (format === "kurz") {
    return [
      az ? `[${az}]` : null,
      `Straftaten: ${paraList.length ? paraList.join(", ") : "—"}`,
      `Gesamtgeldstrafe: ${formatMoney(data.fine)}`,
      `Haftzeit: ${formatJail(data.jail)}`,
      `Wanted: ${data.wanted ? `${data.wanted} (${stars(data.wanted)})` : "—"}`,
      `Modifikationen: ${mods.length ? mods.join(", ") : "—"}`
    ].filter(Boolean).join("\n");
  }

  return [
    az ? `[${az}]` : null,
    "Straftaten:",
    detailList.length ? detailList.join("\n") : "—",
    "",
    `Gesamtgeldstrafe: ${formatMoney(data.fine)}`,
    `Haftzeit: ${formatJail(data.jail)}`,
    `Wanted: ${data.wanted ? `${data.wanted} (${stars(data.wanted)})` : "—"}`,
    `Modifikationen: ${mods.length ? mods.join(", ") : "—"}`
  ].filter(Boolean).join("\n");
}

function updateSummary() {
  const totals = calculateTotals();

  els.selectedCount.textContent = String(totals.count);
  els.sumFine.textContent = formatMoney(totals.fine);
  els.sumWanted.textContent = totals.wanted ? stars(totals.wanted) : "—";
  els.sumJail.textContent = formatJail(totals.jail);
  els.sumCount.textContent = String(totals.count);
  els.aktenText.value = buildAktenzeile(totals);

  els.lastUpdate.textContent = `Zuletzt aktualisiert: ${new Date().toLocaleString("de-DE")}`;
}

function updateUI() {
  renderCards();
  updateSummary();
}

function resetAll() {
  state.selected.clear();
  state.search = "";
  els.searchInput.value = "";

  els.modReue.checked = false;
  els.modRepeat.checked = false;
  els.modSystem.value = "0";
  els.wantedMode.value = "max";
  els.aktenFormat.value = "lang";
  els.azInput.value = "";
  els.copyState.textContent = "";

  updateUI();
}

async function copyAktenzeile() {
  try {
    await navigator.clipboard.writeText(els.aktenText.value || "");
    els.copyState.textContent = "Kopiert ✓";
    setTimeout(() => {
      els.copyState.textContent = "";
    }, 1200);
  } catch {
    els.copyState.textContent = "Kopieren fehlgeschlagen";
    setTimeout(() => {
      els.copyState.textContent = "";
    }, 1500);
  }
}

els.searchInput.addEventListener("input", (e) => {
  state.search = e.target.value || "";
  renderCards();
});

[
  els.modReue,
  els.modRepeat,
  els.modSystem,
  els.wantedMode,
  els.azInput,
  els.aktenFormat,
].forEach(el => {
  el.addEventListener("change", updateSummary);
  el.addEventListener("input", updateSummary);
});

els.btnReset.addEventListener("click", resetAll);
els.btnCopy.addEventListener("click", copyAktenzeile);

updateUI();
