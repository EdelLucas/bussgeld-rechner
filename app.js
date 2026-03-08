import { STRAFTATEN as DEFAULT_STRAFTATEN } from "./data-straftaten.js";

const $ = (id) => document.getElementById(id);

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1DufMS-4hxX75e9bJk_z3jSHqCcO6JmimoqYh6M94zP0/export?format=csv&gid=1898147490";

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

  toggleThemeBtn: $("toggleThemeBtn"),
  toggleListBtn: $("toggleListBtn"),
  sheetUrlInput: $("sheetUrlInput"),
  loadSheetBtn: $("loadSheetBtn"),
  sheetStatus: $("sheetStatus"),
};

let STRAFTATEN = [...DEFAULT_STRAFTATEN];

const state = {
  selected: new Set(),
  search: "",
  lightTheme: false,
  listView: false,
};

function formatMoney(value) {
  const rounded = Math.round(value || 0);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function formatJail(minutes) {
  return `${Math.round(minutes || 0)} Min.`;
}

function stars(count) {
  return "★".repeat(Math.max(0, Math.min(6, Number(count) || 0)));
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/lllegaler/g, "illegaler")
    .replace(/\s+/g, " ")
    .trim();
}

function getFilteredItems() {
  const q = state.search.trim().toLowerCase();
  if (!q) return STRAFTATEN;

  return STRAFTATEN.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.para.toLowerCase().includes(q) ||
    item.id.toLowerCase().includes(q) ||
    (item.info || "").toLowerCase().includes(q) ||
    (item.category || "").toLowerCase().includes(q)
  );
}

function renderCards() {
  const items = getFilteredItems();

  els.cards.classList.toggle("list-view", state.listView);

  els.cards.innerHTML = items.map(item => {
    const selected = state.selected.has(item.id);

    return `
      <div class="card ${selected ? "selected" : ""}" data-id="${escapeHtml(item.id)}">
        <div class="card-top">
          <div class="card-para">${escapeHtml(item.para)}</div>
          <div class="card-link">${escapeHtml(item.category || "↗")}</div>
        </div>

        <div class="card-name">${escapeHtml(item.name)}</div>

        <div class="card-meta">
          <div class="card-fine">${formatMoney(item.fine)}</div>
          ${item.info ? `<div class="card-jail">${escapeHtml(item.info)}</div>` : ""}
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
      toggleSelection(card.dataset.id);
    });
  });
}

function toggleSelection(id) {
  if (state.selected.has(id)) state.selected.delete(id);
  else state.selected.add(id);
  updateUI();
}

function getSelectedItems() {
  return STRAFTATEN.filter(item => state.selected.has(item.id));
}

function calculateWanted(items) {
  const mode = els.wantedMode.value;
  const systemWanted = Number(els.modSystem.value || 0);

  if (!items.length) return systemWanted;

  const values = items.map(item => item.wanted || 0);
  const baseWanted = mode === "sum"
    ? values.reduce((sum, v) => sum + v, 0)
    : Math.max(...values);

  return Math.max(0, baseWanted + systemWanted);
}

function calculateTotals() {
  const items = getSelectedItems();

  let fine = items.reduce((sum, item) => sum + (item.fine || 0), 0);
  let jail = items.reduce((sum, item) => sum + (item.jail || 0), 0);
  let wanted = calculateWanted(items);

  if (els.modReue.checked) fine *= 0.8;
  if (els.modRepeat.checked) {
    fine *= 1.5;
    jail *= 1.25;
  }

  return {
    items,
    fine: Math.round(fine),
    jail: Math.round(jail),
    wanted,
    count: items.length,
  };
}

function buildAktenzeile(data) {
  const az = els.azInput.value.trim();
  const format = els.aktenFormat.value;

  const paraList = data.items.map(item => item.para);
  const detailList = data.items.map(item => {
    const extras = [];
    if (item.info) extras.push(item.info);
    if (item.licenseAction) extras.push(item.licenseAction);
    const extraText = extras.length ? ` | ${extras.join(" | ")}` : "";
    return `${item.para} ${item.name}${extraText}`;
  });

  const extraMeasures = data.items
    .flatMap(item => [item.info, item.licenseAction].filter(Boolean));

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
      `Zusatzmaßnahmen: ${extraMeasures.length ? extraMeasures.join(" ; ") : "—"}`,
      `Modifikationen: ${mods.join(", ")}`
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
    `Zusatzmaßnahmen: ${extraMeasures.length ? extraMeasures.join(" ; ") : "—"}`,
    `Modifikationen: ${mods.join(", ")}`
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
  document.body.classList.toggle("light-theme", state.lightTheme);
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
    setTimeout(() => els.copyState.textContent = "", 1200);
  } catch {
    els.copyState.textContent = "Kopieren fehlgeschlagen";
    setTimeout(() => els.copyState.textContent = "", 1500);
  }
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function splitPossibleEntries(text) {
  let t = normalizeText(text);

  t = t
    .replace(/(\d{2}\.\d{2}\s+\d{2}:\d{2}\s*-\s*(?:StGB|StVO|BtMG|WaffG|BDG|StPO))/g, "|||$1")
    .replace(/(\d{2}\.\d{2}\s+\d{2}:\d{2}\s*-\s*§\d+\s*StPO)/g, "|||$1");

  return t
    .split("|||")
    .map(s => s.trim())
    .filter(Boolean);
}

function extractWantedNumber(text) {
  const starMatches = text.match(/[⭐☆]/g);
  return starMatches ? starMatches.length : 0;
}

function extractFine(text) {
  const maxMatch = text.match(/max\.\s*([\d.]+)\$/i);
  if (maxMatch) return parseInt(maxMatch[1].replace(/\./g, ""), 10);

  const plusPerStarMatch = text.match(/([\d.]+)\$\s*\+\s*(?:pro\s*[⭐☆]|\$?[\d.]+\s*pro\s*[⭐☆])/i);
  const simpleMoney = text.match(/([\d.]+)\$/);

  if (plusPerStarMatch && simpleMoney) {
    return parseInt(simpleMoney[1].replace(/\./g, ""), 10);
  }

  if (simpleMoney) {
    return parseInt(simpleMoney[1].replace(/\./g, ""), 10);
  }

  return 0;
}

function extractPerStarFine(text) {
  const m1 = text.match(/\+\s*\$?\s*([\d.]+)\s*pro\s*[⭐☆]/i);
  if (m1) return parseInt(m1[1].replace(/\./g, ""), 10);

  const m2 = text.match(/([\d.]+)\$\s*pro\s*[⭐☆]/i);
  if (m2) return parseInt(m2[1].replace(/\./g, ""), 10);

  return 0;
}

function inferJailFromWanted(wanted) {
  const map = {
    0: 0,
    1: 8,
    2: 15,
    3: 25,
    4: 35,
    5: 45,
    6: 60
  };
  return map[Math.min(6, Math.max(0, wanted))] ?? 0;
}

function cleanName(name) {
  return normalizeText(name)
    .replace(/\s*[⭐☆]+\s*/g, " ")
    .replace(/\s+\$\s*[\d.]+.*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseEntry(entryText) {
  const entry = normalizeText(entryText);

  const mainMatch = entry.match(
    /^(?:\d{2}\.\d{2}\s+\d{2}:\d{2}\s*-\s*)?((?:StGB|StVO|BtMG|WaffG|BDG)\s*§[^\-]+|§\d+\s*StPO)\s*-\s*(.+)$/i
  );

  if (!mainMatch) return null;

  const para = normalizeText(mainMatch[1]);
  let rest = normalizeText(mainMatch[2]);

  let licenseAction = "";
  if (/Waffenscheinentzug/i.test(rest)) {
    licenseAction = "Waffenscheinentzug";
    rest = rest.replace(/Waffenscheinentzug/gi, "").trim();
  }
  if (/Führerscheinentzug/i.test(rest)) {
    licenseAction = licenseAction
      ? `${licenseAction}; Führerscheinentzug`
      : "Führerscheinentzug";
    rest = rest.replace(/Führerscheinentzug/gi, "").trim();
  }

  const wanted = extractWantedNumber(rest);
  const fineBase = extractFine(rest);
  const perStarFine = extractPerStarFine(rest);
  const fine = fineBase + (perStarFine * wanted);
  const jail = inferJailFromWanted(wanted);

  let name = rest
    .replace(/max\.\s*[\d.]+\$/gi, "")
    .replace(/[\d.]+\$\s*\+\s*\$?[\d.]+\s*pro\s*[⭐☆]/gi, "")
    .replace(/[\d.]+\$\s*pro\s*[⭐☆]/gi, "")
    .replace(/[\d.]+\$/g, "")
    .replace(/[⭐☆]+/g, " ")
    .trim();

  let info = "";
  const infoParts = [];

  if (/versuch/i.test(name) && /strafbar/i.test(entry)) {
    infoParts.push("Versuch strafbar");
  }
  if (licenseAction) {
    infoParts.push(licenseAction);
  }

  name = cleanName(name);

  if (!name || !para) return null;

  return {
    id: `${para}-${name}`.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, "-"),
    para,
    name,
    fine,
    wanted,
    jail,
    info: infoParts.join(" | "),
    licenseAction,
    category: para.split(" ")[0],
    raw: entry
  };
}

function parseSheetCsvToEntries(csvText) {
  const rows = csvText
    .split(/\r?\n/)
    .map(parseCsvLine)
    .flat()
    .map(cell => normalizeText(cell))
    .filter(Boolean);

  const collectedEntries = [];
  const seen = new Set();

  for (const cell of rows) {
    const pieces = splitPossibleEntries(cell);

    for (const piece of pieces) {
      const parsed = parseEntry(piece);
      if (!parsed) continue;

      const key = `${parsed.para}__${parsed.name}`;
      if (seen.has(key)) continue;

      seen.add(key);
      collectedEntries.push(parsed);
    }
  }

  return collectedEntries;
}

async function loadFromSheetCsv(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const csvText = await response.text();
  const items = parseSheetCsvToEntries(csvText);

  if (!items.length) {
    throw new Error("Keine gültigen Einträge erkannt");
  }

  STRAFTATEN = items;
  state.selected.clear();
  updateUI();
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

if (els.toggleThemeBtn) {
  els.toggleThemeBtn.addEventListener("click", () => {
    state.lightTheme = !state.lightTheme;
    updateUI();
  });
}

if (els.toggleListBtn) {
  els.toggleListBtn.addEventListener("click", () => {
    state.listView = !state.listView;
    renderCards();
  });
}

if (els.loadSheetBtn && els.sheetUrlInput) {
  els.loadSheetBtn.addEventListener("click", async () => {
    const url = (els.sheetUrlInput.value || "").trim();

    if (!url) {
      els.sheetStatus.textContent = "Bitte CSV-Link einfügen";
      return;
    }

    els.sheetStatus.textContent = "Lade Daten...";

    try {
      await loadFromSheetCsv(url);
      els.sheetStatus.textContent = `Gesetze geladen: ${STRAFTATEN.length}`;
    } catch (error) {
      els.sheetStatus.textContent = `Fehler: ${error.message}`;
    }
  });
}

async function boot() {
  updateUI();

  if (els.sheetUrlInput) {
    els.sheetUrlInput.value = SHEET_CSV_URL;
  }

  if (els.sheetStatus) {
    els.sheetStatus.textContent = "Lade Gesetze aus Google Sheets...";
  }

  try {
    await loadFromSheetCsv(SHEET_CSV_URL);
    if (els.sheetStatus) {
      els.sheetStatus.textContent = `Gesetze geladen: ${STRAFTATEN.length}`;
    }
  } catch (error) {
    if (els.sheetStatus) {
      els.sheetStatus.textContent = `Sheets-Import fehlgeschlagen: ${error.message}`;
    }
    updateUI();
  }
}

boot();
