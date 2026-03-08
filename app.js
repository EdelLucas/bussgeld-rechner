import { STRAFTATEN as DEFAULT_STRAFTATEN } from "./data-straftaten.js";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1DufMS-4hxX75e9bJk_z3jSHqCcO6JmimoqYh6M94zP0/export?format=csv&gid=1898147490";

const $ = (id) => document.getElementById(id);

const els = {
  cards: $("cards"),
  searchInput: $("searchInput"),
  selectedCount: $("selectedCount"),
  sumFine: $("sumFine"),
  sumWanted: $("sumWanted"),
  modReue: $("modReue"),
  modRepeat: $("modRepeat"),
  modSystem: $("modSystem"),
  wantedMode: $("wantedMode"),
  plateInput: $("plateInput"),
  placeInput: $("placeInput"),
  azInput: $("azInput"),
  aktenText: $("aktenText"),
  btnReset: $("btnReset"),
  btnCopy: $("btnCopy"),
  sheetStatus: $("sheetStatus"),
  sheetUrlInput: $("sheetUrlInput"),
  toggleThemeBtn: $("toggleThemeBtn"),
  toggleListBtn: $("toggleListBtn"),
  aktenShortToggle: $("aktenShortToggle"),
  autoResetToggle: $("autoResetToggle"),
  pinSidebarToggle: $("pinSidebarToggle"),
  sidebarMain: $("sidebarMain"),
  sidebarExtra: $("sidebarExtra"),
};

let STRAFTATEN = [...DEFAULT_STRAFTATEN];

const state = {
  selected: new Set(),
  search: "",
  lightTheme: false,
  listView: false,
};

function formatMoney(value) {
  const rounded = Math.round(Number(value) || 0);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function stars(count) {
  return "★".repeat(Math.max(0, Math.min(6, Number(count) || 0)));
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
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
  if (!q) return STRAFTATEN;

  return STRAFTATEN.filter(item =>
    item.para.toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    (item.info || "").toLowerCase().includes(q) ||
    (item.licenseAction || "").toLowerCase().includes(q) ||
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
          <div class="card-link">↗</div>
        </div>

        <div class="card-name">${escapeHtml(item.name)}</div>

        <div class="card-meta">
          <div class="card-fine">${formatMoney(item.fine)}</div>
          ${item.info ? `<div class="card-info">${escapeHtml(item.info)}</div>` : ""}
        </div>

        <div class="card-bottom">
          <div class="card-jail">${item.jail || 0} Min.</div>
          <div class="card-stars">${item.wanted ? stars(item.wanted) : "—"}</div>
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
  return STRAFTATEN.filter(item => state.selected.has(item.id));
}

function calculateWanted(items) {
  const systemWanted = Number(els.modSystem.value || 0);
  if (!items.length) return systemWanted;

  let baseWanted = 0;
  const values = items.map(item => Number(item.wanted || 0));

  if (els.wantedMode.value === "sum") {
    baseWanted = values.reduce((sum, v) => sum + v, 0);
  } else {
    baseWanted = Math.max(...values);
  }

  if (els.modReue.checked) {
    baseWanted = Math.max(1, baseWanted - 2);
  }

  return Math.max(0, baseWanted + systemWanted);
}

function calculateFine(items) {
  let fine = items.reduce((sum, item) => sum + Number(item.fine || 0), 0);
  if (els.modRepeat.checked) fine *= 2;
  return Math.round(fine);
}

function buildAktenzeile(items, fine, wanted) {
  const shortMode = els.aktenShortToggle.checked;
  const az = els.azInput.value.trim();
  const plate = els.plateInput.value.trim();
  const place = els.placeInput.value.trim();

  const paras = items.map(item => item.para);
  const details = items.map(item => {
    const extras = [item.info, item.licenseAction].filter(Boolean).join(" | ");
    return extras ? `${item.para} ${item.name} | ${extras}` : `${item.para} ${item.name}`;
  });

  const measures = items.flatMap(item => [item.info, item.licenseAction].filter(Boolean));

  if (shortMode) {
    return [
      az ? `Aktenzeichen: ${az}` : null,
      paras.length ? `Straftaten: ${paras.join(", ")}` : "Straftaten: —",
      plate ? `Kennzeichen: ${plate}` : null,
      place ? `Ort: ${place}` : null,
      `Geldstrafe: ${formatMoney(fine)}`,
      `Wanted: ${wanted ? `${wanted} (${stars(wanted)})` : "—"}`,
      `Zusatzmaßnahmen: ${measures.length ? measures.join(" ; ") : "—"}`
    ].filter(Boolean).join("\n");
  }

  return [
    az ? `Aktenzeichen: ${az}` : null,
    plate ? `Kennzeichen: ${plate}` : null,
    place ? `Ort: ${place}` : null,
    "Straftaten:",
    details.length ? details.join("\n") : "—",
    "",
    `Geldstrafe: ${formatMoney(fine)}`,
    `Wanted: ${wanted ? `${wanted} (${stars(wanted)})` : "—"}`,
    `Zusatzmaßnahmen: ${measures.length ? measures.join(" ; ") : "—"}`
  ].filter(Boolean).join("\n");
}

function updateSummary() {
  const items = getSelectedItems();
  const fine = calculateFine(items);
  const wanted = calculateWanted(items);

  els.selectedCount.textContent = String(items.length);
  els.sumFine.textContent = formatMoney(fine);
  els.sumWanted.textContent = wanted ? stars(wanted) : "—";
  els.aktenText.value = buildAktenzeile(items, fine, wanted);

  if (els.autoResetToggle.checked && items.length === 0) {
    els.aktenText.value = "";
  }
}

function updateUI() {
  document.body.classList.toggle("light-theme", state.lightTheme);

  if (els.pinSidebarToggle.checked) {
    els.sidebarMain.style.position = "sticky";
    els.sidebarExtra.style.position = "sticky";
  } else {
    els.sidebarMain.style.position = "static";
    els.sidebarExtra.style.position = "static";
  }

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
  els.plateInput.value = "";
  els.placeInput.value = "";
  els.azInput.value = "";
  els.aktenText.value = "";
  updateUI();
}

async function copyAktenzeile() {
  try {
    await navigator.clipboard.writeText(els.aktenText.value || "");
    els.btnCopy.textContent = "Kopiert";
    setTimeout(() => els.btnCopy.textContent = "Kopieren", 1000);
  } catch {
    els.btnCopy.textContent = "Fehler";
    setTimeout(() => els.btnCopy.textContent = "Kopieren", 1000);
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
    .replace(/(\d{2}\.\d{2}\s+\d{2}:\d{2}\s*-\s*§\d+\s*StPO)/g, "|||$1")
    .replace(/((?:StGB|StVO|BtMG|WaffG|BDG)\s*§\d+[^\-]*\s*-\s*)/g, "|||$1");

  return t.split("|||").map(v => v.trim()).filter(Boolean);
}

function extractWantedNumber(text) {
  const starMatches = text.match(/[⭐☆★]/g);
  return starMatches ? starMatches.length : 0;
}

function extractFine(text) {
  const maxMatch = text.match(/max\.\s*([\d.]+)\$/i);
  if (maxMatch) return parseInt(maxMatch[1].replace(/\./g, ""), 10);

  const simpleMoney = text.match(/([\d.]+)\$/);
  if (simpleMoney) return parseInt(simpleMoney[1].replace(/\./g, ""), 10);

  return 0;
}

function extractPerStarFine(text) {
  const m1 = text.match(/\+\s*\$?\s*([\d.]+)\s*pro\s*[⭐☆★]/i);
  if (m1) return parseInt(m1[1].replace(/\./g, ""), 10);

  const m2 = text.match(/([\d.]+)\$\s*pro\s*[⭐☆★]/i);
  if (m2) return parseInt(m2[1].replace(/\./g, ""), 10);

  return 0;
}

function inferJailFromWanted(wanted) {
  const map = { 0:0, 1:5, 2:15, 3:25, 4:35, 5:45, 6:60 };
  return map[Math.min(6, Math.max(0, wanted))] ?? 0;
}

function parseEntry(entryText) {
  const entry = normalizeText(entryText);

  const match = entry.match(
    /^(?:\d{2}\.\d{2}\s+\d{2}:\d{2}\s*-\s*)?((?:StGB|StVO|BtMG|WaffG|BDG)\s*§[^-]+|§\d+\s*StPO)\s*-\s*(.+)$/i
  );

  if (!match) return null;

  const para = normalizeText(match[1]);
  let rest = normalizeText(match[2]);

  let licenseAction = "";
  if (/Waffenscheinentzug/i.test(rest)) {
    licenseAction = "Waffenscheinentzug";
    rest = rest.replace(/Waffenscheinentzug/gi, "").trim();
  }
  if (/Führerscheinentzug/i.test(rest)) {
    licenseAction = licenseAction ? `${licenseAction}; Führerscheinentzug` : "Führerscheinentzug";
    rest = rest.replace(/Führerscheinentzug/gi, "").trim();
  }

  const wanted = extractWantedNumber(rest);
  const fineBase = extractFine(rest);
  const perStarFine = extractPerStarFine(rest);
  const fine = fineBase + (perStarFine * wanted);
  const jail = inferJailFromWanted(wanted);

  let name = rest
    .replace(/max\.\s*[\d.]+\$/gi, "")
    .replace(/[\d.]+\$\s*\+\s*\$?[\d.]+\s*pro\s*[⭐☆★]/gi, "")
    .replace(/[\d.]+\$\s*pro\s*[⭐☆★]/gi, "")
    .replace(/[\d.]+\$/g, "")
    .replace(/[⭐☆★]+/g, " ")
    .trim();

  name = normalizeText(name);

  if (!para || !name) return null;

  return {
    id: `${para}-${name}`.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, "-"),
    para,
    name,
    fine,
    wanted,
    jail,
    info: licenseAction ? licenseAction : "",
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

  const items = [];
  const seen = new Set();

  for (const cell of rows) {
    const parts = splitPossibleEntries(cell);

    for (const part of parts) {
      const parsed = parseEntry(part);
      if (!parsed) continue;

      const key = `${parsed.para}__${parsed.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(parsed);
    }
  }

  return items;
}

async function loadFromSheetCsv(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const csvText = await response.text();
  const parsed = parseSheetCsvToEntries(csvText);

  if (!parsed.length) {
    throw new Error("Keine gültigen Einträge erkannt");
  }

  STRAFTATEN = parsed;
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
  els.plateInput,
  els.placeInput,
  els.azInput,
  els.aktenShortToggle,
  els.autoResetToggle,
  els.pinSidebarToggle
].forEach(el => {
  el.addEventListener("change", updateSummary);
  el.addEventListener("input", updateSummary);
});

els.btnReset.addEventListener("click", resetAll);
els.btnCopy.addEventListener("click", copyAktenzeile);

els.toggleThemeBtn.addEventListener("click", () => {
  state.lightTheme = !state.lightTheme;
  updateUI();
});

els.toggleListBtn.addEventListener("click", () => {
  state.listView = !state.listView;
  renderCards();
});

async function boot() {
  els.sheetUrlInput.value = SHEET_CSV_URL;
  updateUI();

  try {
    await loadFromSheetCsv(SHEET_CSV_URL);
    els.sheetStatus.textContent = `Gesetze geladen: ${STRAFTATEN.length}`;
  } catch (error) {
    els.sheetStatus.textContent = `Sheets-Import fehlgeschlagen: ${error.message}`;
    updateUI();
  }
}

boot();
