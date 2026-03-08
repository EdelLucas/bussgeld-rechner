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

  return STRAFTATEN.filter((item) =>
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

  els.cards.innerHTML = items.map((item) => {
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
          <div class="card-stars
