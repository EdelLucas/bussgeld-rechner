import { STRAFTATEN } from "./data-straftaten.js";

const $ = (id) => document.getElementById(id);

const elCards = $("cards");
const elSearch = $("searchInput");
const elSelectedCount = $("selectedCount");

const elSumFine = $("sumFine");
const elSumWanted = $("sumWanted");

const elModReue = $("modReue");
const elModRepeat = $("modRepeat");
const elModSystem = $("modSystem");

const elAz = $("azInput");
const elAkten = $("aktenText");
const elLastUpdate = $("lastUpdate");
const elCopyState = $("copyState");

const btnReset = $("btnReset");
const btnCopy = $("btnCopy");

const state = { selected: new Set(), query: "" };

function formatMoney(n){
  const s = Math.round(n).toString();
  const withDots = s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${withDots}`;
}
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function stars(n){ return "★".repeat(clamp(n,0,6)); }

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function filtered(){
  const q = state.query.trim().toLowerCase();
  if(!q) return STRAFTATEN;
  return STRAFTATEN.filter(x =>
    x.name.toLowerCase().includes(q) ||
    x.para.toLowerCase().includes(q) ||
    x.id.toLowerCase().includes(q)
  );
}

function renderCards(){
  const items = filtered();
  elCards.innerHTML = "";

  for(const x of items){
    const isSel = state.selected.has(x.id);

    const card = document.createElement("div");
    card.className = "card" + (isSel ? " selected" : "");
    card.innerHTML = `
      <div class="card-top">
        <div class="badge">${escapeHtml(x.para)}</div>
        <div style="opacity:.55">↗</div>
      </div>
      <div class="name">${escapeHtml(x.name)}</div>
      <div class="fine">${formatMoney(x.fine)}</div>
      <div class="stars" title="Wanted: ${x.wanted}">${x.wanted ? stars(x.wanted) : ""}</div>
    `;
    card.addEventListener("click", () => toggleSelect(x.id));
    elCards.appendChild(card);
  }
}

function toggleSelect(id){
  if(state.selected.has(id)) state.selected.delete(id);
  else state.selected.add(id);
  updateAll();
}

function compute(){
  const selectedItems = STRAFTATEN.filter(x => state.selected.has(x.id));

  let fine = selectedItems.reduce((a,b) => a + b.fine, 0);
  let wanted = selectedItems.reduce((a,b) => a + (b.wanted || 0), 0);

  if(elModReue.checked) fine *= 0.8;
  if(elModRepeat.checked) fine *= 1.5;
  wanted += Number(elModSystem.value || 0);

  fine = Math.round(fine);
  wanted = Math.max(0, Math.round(wanted));

  return { selectedItems, fine, wanted };
}

function buildAktenzeile(calc){
  const az = elAz.value.trim();
  const paras = calc.selectedItems.map(x => x.para.replace("StGB ", ""));
  const detail = calc.selectedItems.map(x => `${x.para.replace("StGB ","")} ${x.name}`);

  const mods = [];
  if(elModReue.checked) mods.push("Reue (-20%)");
  if(elModRepeat.checked) mods.push("Wiederholung (+50%)");
  const sys = Number(elModSystem.value || 0);
  if(sys) mods.push(`Systemwanteds (+${sys})`);

  return [
    az ? `[${az}]` : null,
    `Straftaten: ${paras.length ? paras.join(", ") : "—"}`,
    `Geldstrafe: ${formatMoney(calc.fine)}`,
    `Wanted: ${calc.wanted ? calc.wanted : "—"}`,
    `Details: ${detail.length ? detail.join(" | ") : "—"}`,
    `Mods: ${mods.length ? mods.join(", ") : "—"}`
  ].filter(Boolean).join("\n");
}

function updateSidebar(){
  const calc = compute();
  elSelectedCount.textContent = String(state.selected.size);
  elSumFine.textContent = formatMoney(calc.fine);
  elSumWanted.textContent = calc.wanted ? stars(calc.wanted) : "—";
  elAkten.value = buildAktenzeile(calc);

  const stamp = new Date().toLocaleString("de-DE");
  elLastUpdate.textContent = `Zuletzt aktualisiert: ${stamp}`;
}

function updateAll(){
  renderCards();
  updateSidebar();
}

function resetAll(){
  state.selected.clear();
  state.query = "";
  elSearch.value = "";
  elModReue.checked = false;
  elModRepeat.checked = false;
  elModSystem.value = "0";
  elCopyState.textContent = "";
  updateAll();
}

async function copyAktenzeile(){
  try{
    await navigator.clipboard.writeText(elAkten.value || "");
    elCopyState.textContent = "Kopiert ✓";
    setTimeout(() => elCopyState.textContent = "", 1200);
  }catch{
    elCopyState.textContent = "Kopieren fehlgeschlagen";
    setTimeout(() => elCopyState.textContent = "", 1600);
  }
}

elSearch.addEventListener("input", () => {
  state.query = elSearch.value;
  renderCards();
});
[elModReue, elModRepeat, elModSystem, elAz].forEach(el => {
  el.addEventListener("change", updateSidebar);
  el.addEventListener("input", updateSidebar);
});
btnReset.addEventListener("click", resetAll);
btnCopy.addEventListener("click", copyAktenzeile);

updateAll();
