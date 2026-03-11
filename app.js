const $ = (id) => document.getElementById(id);

const LAW_DATA = [
  { id: "stgb-3-1", section: "STGB", para: "StGB §3.1", name: "Beleidigung", fine: 10000, wanted: 0 },
  { id: "stgb-3-2", section: "STGB", para: "StGB §3.2", name: "Belästigung", fine: 10000, wanted: 0 },
  { id: "stgb-3-3", section: "STGB", para: "StGB §3.3", name: "Drohung", fine: 5000, wanted: 1 },
  { id: "stgb-4-1", section: "STGB", para: "StGB §4.1", name: "Versuchter Mord / Mord", fine: 30000, wanted: 4 },
  { id: "stgb-4-2", section: "STGB", para: "StGB §4.2", name: "Körperverletzung", fine: 15000, wanted: 2 },
  { id: "stgb-4-3", section: "STGB", para: "StGB §4.3", name: "Körperverletzung mit Todesfolge", fine: 20000, wanted: 3 },
  { id: "stgb-4-4", section: "STGB", para: "StGB §4.4", name: "Gewaltsame Drohung", fine: 5000, wanted: 1 },
  { id: "stgb-5", section: "STGB", para: "StGB §5", name: "Fahrlässige Tötung", fine: 20000, wanted: 3 },
  { id: "stgb-6", section: "STGB", para: "StGB §6", name: "Sexuelle Belästigung", fine: 30000, wanted: 1 },
  { id: "stgb-8", section: "STGB", para: "StGB §8", name: "Diebstahl", fine: 5000, wanted: 0 },
  { id: "stgb-9", section: "STGB", para: "StGB §9", name: "Fahrzeugdiebstahl", fine: 10000, wanted: 2 },
  { id: "stgb-10", section: "STGB", para: "StGB §10", name: "Betrug", fine: 5000, wanted: 0 },
  { id: "stgb-10-1", section: "STGB", para: "StGB §10.1", name: "Besitz illegaler Gegenstände", fine: 10000, wanted: 2 },
  { id: "stgb-11", section: "STGB", para: "StGB §11", name: "Raub", fine: 25000, wanted: 3 },
  { id: "stgb-12-1", section: "STGB", para: "StGB §12.1", name: "Geschäftsraub / Ammu Rob", fine: 35000, wanted: 2 },
  { id: "stgb-12-3", section: "STGB", para: "StGB §12.3", name: "ATM Raub", fine: 5000, wanted: 1 },
  { id: "stgb-13", section: "STGB", para: "StGB §13", name: "Einbruch", fine: 15000, wanted: 2 },
  { id: "stgb-14", section: "STGB", para: "StGB §14", name: "Steuerhinterziehung", fine: 50000, wanted: 3 },
  { id: "stgb-15-1", section: "STGB", para: "StGB §15.1", name: "Nichtbeachten einer amtlichen Anweisung", fine: 10000, wanted: 0 },
  { id: "stgb-15-2", section: "STGB", para: "StGB §15.2", name: "Entziehung polizeilicher Maßnahmen", fine: 10000, wanted: 2 },
  { id: "stgb-15-3", section: "STGB", para: "StGB §15.3", name: "Behinderung eines Beamten bei der Arbeit", fine: 10000, wanted: 1 },
  { id: "stgb-15-4", section: "STGB", para: "StGB §15.4", name: "Bestechung von Beamten", fine: 10000, wanted: 2 },
  { id: "stgb-15-5", section: "STGB", para: "StGB §15.5", name: "Widerstand gegen Vollstreckungsbeamte", fine: 20000, wanted: 2 },
  { id: "stgb-15-6", section: "STGB", para: "StGB §15.6", name: "Behinderung des EMS bei der Arbeit", fine: 10000, wanted: 0 },
  { id: "stgb-15-7", section: "STGB", para: "StGB §15.7", name: "Nichtausweisen bei polizeilichen / medizinischen Maßnahmen", fine: 15000, wanted: 1 },
  { id: "stgb-16", section: "STGB", para: "StGB §16", name: "Befreiung von Gefangenen", fine: 30000, wanted: 3 },
  { id: "stgb-17", section: "STGB", para: "StGB §17", name: "Durchbrechen von Absperrungen", fine: 25000, wanted: 1 },
  { id: "stgb-18", section: "STGB", para: "StGB §18", name: "Unerlaubtes Betreten eines militärischen Geländes", fine: 50000, wanted: 5 },
  { id: "stgb-18-1", section: "STGB", para: "StGB §18.1", name: "Unerlaubtes Betreten von Sperrzonen", fine: 25000, wanted: 2 },
  { id: "stgb-18-2", section: "STGB", para: "StGB §18.2", name: "Unerlaubtes Befahren von Sperrzonen", fine: 25000, wanted: 2 },
  { id: "stgb-19", section: "STGB", para: "StGB §19", name: "Falsche Namensangabe", fine: 10000, wanted: 0 },
  { id: "stgb-20", section: "STGB", para: "StGB §20", name: "Sachbeschädigung", fine: 5000, wanted: 0 },
  { id: "stgb-21", section: "STGB", para: "StGB §21", name: "Unterlassene Hilfeleistung", fine: 5000, wanted: 0 },
  { id: "stgb-23", section: "STGB", para: "StGB §23", name: "Missbrauch von Notruf", fine: 30000, wanted: 0 },
  { id: "stgb-24", section: "STGB", para: "StGB §24", name: "Amtsanmaßung", fine: 25000, wanted: 2 },
  { id: "stgb-25", section: "STGB", para: "StGB §25", name: "Terrorismus", fine: 25000, wanted: 3 },

  { id: "stvo-1", section: "STVO", para: "StVO §1", name: "Geschwindigkeitsüberschreitung", fine: 2500, wanted: 0 },
  { id: "stvo-2", section: "STVO", para: "StVO §2", name: "Gefährdung im Straßenverkehr", fine: 8000, wanted: 1 },
  { id: "stvo-3", section: "STVO", para: "StVO §3", name: "Rotlichtverstoß", fine: 4000, wanted: 0 },
  { id: "stvo-4", section: "STVO", para: "StVO §4", name: "Fahren ohne Fahrerlaubnis", fine: 12000, wanted: 1 },
  { id: "stvo-5", section: "STVO", para: "StVO §5", name: "Illegales Parken", fine: 1500, wanted: 0 },
  { id: "stvo-6", section: "STVO", para: "StVO §6", name: "Geisterfahrt", fine: 15000, wanted: 2 },
  { id: "stvo-7", section: "STVO", para: "StVO §7", name: "Fahrerflucht", fine: 20000, wanted: 2 },
  { id: "stvo-8", section: "STVO", para: "StVO §8", name: "Illegales Straßenrennen", fine: 25000, wanted: 2 }
];

const state = {
  selected: new Set(),
  extraWantedById: {},
  search: "",
  longMode: false,
  autoReset: false
};

const els = {
  body: document.body,
  sections: $("catalogSections"),
  searchInput: $("searchInput"),
  selectedCount: $("selectedCount"),
  sumFine: $("sumFine"),
  sumWanted: $("sumWanted"),
  btnReset: $("btnReset"),
  btnCopy: $("btnCopy"),
  btnCopyLine: $("btnCopyLine"),
  copyStatus: $("copyStatus"),
  aktenLine: $("aktenLine"),
  aktenText: $("aktenText"),
  liveStamp: $("liveStamp"),
  rightsReadToggle: $("rightsReadToggle"),
  remorseToggle: $("remorseToggle"),
  repeatToggle: $("repeatToggle"),
  transportToggle: $("transportToggle"),
  systemWantedInput: $("systemWantedInput"),
  plateInput: $("plateInput"),
  placeInput: $("placeInput"),
  azInput: $("azInput"),
  modeToggle: $("modeToggle"),
  shortLabel: $("shortLabel"),
  longLabel: $("longLabel"),
  autoResetToggle: $("autoResetToggle"),
  pinSidebarToggle: $("pinSidebarToggle"),
  sidebar: $("sidebar"),
  themeBtn: $("themeBtn")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  const amount = Math.round(Number(value) || 0);
  return `$${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function getDate(now = new Date()) {
  return now.toLocaleDateString("de-DE");
}

function getTime(now = new Date(), withSeconds = true) {
  return now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined
  });
}

function getFilteredLaws() {
  const q = state.search.trim().toLowerCase();
  if (!q) return LAW_DATA;

  return LAW_DATA.filter((law) => {
    return (
      law.section.toLowerCase().includes(q) ||
      law.para.toLowerCase().includes(q) ||
      law.name.toLowerCase().includes(q)
    );
  });
}

function getSelectedItems() {
  return LAW_DATA.filter((law) => state.selected.has(law.id));
}

function getExtraWanted(id) {
  return Number(state.extraWantedById[id] || 0);
}

function getEffectiveWanted(item) {
  return Math.max(0, Number(item.wanted || 0) + getExtraWanted(item.id));
}

function renderStarRow(count) {
  const safe = Math.max(0, Number(count) || 0);
  let html = "";

  for (let i = 0; i < safe; i += 1) {
    html += `<span class="star-on">★</span>`;
  }

  for (let i = safe; i < 5; i += 1) {
    html += `<span class="star-off">★</span>`;
  }

  return html;
}

function groupBySection(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});
}

function getSectionTitle(section) {
  if (section === "STGB") return "STRAFGESETZBUCH (STGB)";
  if (section === "STVO") return "STRAẞENVERKEHRSORDNUNG (STVO)";
  return section;
}

function renderCatalog() {
  const filtered = getFilteredLaws();

  if (!filtered.length) {
    els.sections.innerHTML = `<div class="empty-card">Keine Treffer gefunden.</div>`;
    return;
  }

  const groups = groupBySection(filtered);

  els.sections.innerHTML = Object.entries(groups)
    .map(([section, items]) => {
      const cards = items.map((item) => {
        const selected = state.selected.has(item.id);
        const extraWanted = getExtraWanted(item.id);
        const effectiveWanted = getEffectiveWanted(item);

        return `
          <article class="card ${selected ? "is-selected" : ""}" data-id="${escapeHtml(item.id)}">
            <div class="card-top">
              <div class="card-para">${escapeHtml(item.para)}</div>
              <div class="card-link">↗</div>
            </div>

            <div class="card-name">${escapeHtml(item.name)}</div>
            <div class="card-fine">${formatMoney(item.fine)}</div>

            <div class="card-bottom">
              <div class="card-stars">${renderStarRow(effectiveWanted)}</div>

              <div class="gray-wanted-tools" data-stop-click="true">
                <button class="gray-btn" type="button" data-minus="${escapeHtml(item.id)}">−</button>
                <div class="gray-count">${extraWanted}</div>
                <button class="gray-btn" type="button" data-plus="${escapeHtml(item.id)}">+</button>
              </div>
            </div>
          </article>
        `;
      }).join("");

      return `
        <section class="catalog-section">
          <div class="section-title">${getSectionTitle(section)}</div>
          <div class="cards">${cards}</div>
        </section>
      `;
    })
    .join("");
}

function getHighestFine(items) {
  if (!items.length) return 0;

  const repeatStvo = !!els.repeatToggle.checked;

  return Math.max(
    ...items.map((item) => {
      let fine = Number(item.fine || 0);

      if (repeatStvo && item.section === "STVO") {
        fine *= 2;
      }

      return fine;
    })
  );
}

function getHighestWanted(items) {
  if (!items.length) return 0;

  let highest = Math.max(...items.map((item) => getEffectiveWanted(item)));
  const systemWanted = Math.max(0, Number(els.systemWantedInput.value || 0));

  highest += systemWanted;

  if (els.remorseToggle.checked && highest > 0) {
    highest = Math.max(1, highest - 2);
  }

  return highest;
}

function buildCompactLine(items) {
  const date = getDate();
  const time = getTime(new Date(), false);
  const paras = items.map((item) => item.para).join(" + ");

  return `${date} | ${time} - ${paras || "—"}`;
}

function buildLongText(items, highestFine, highestWanted) {
  const lines = [];
  const az = els.azInput.value.trim();
  const plate = els.plateInput.value.trim();
  const place = els.placeInput.value.trim();

  lines.push(`Datum: ${getDate()}`);
  lines.push(`Uhrzeit: ${getTime()}`);

  if (az) lines.push(`Aktenzeichen: ${az}`);
  if (plate) lines.push(`Kennzeichen: ${plate}`);
  if (place) lines.push(`Ort: ${place}`);

  lines.push("");
  lines.push("Straftaten:");

  if (!items.length) {
    lines.push("- —");
  } else {
    items.forEach((item) => {
      let fine = Number(item.fine || 0);

      if (els.repeatToggle.checked && item.section === "STVO") {
        fine *= 2;
      }

      let row = `- ${item.para} ${item.name} | ${formatMoney(fine)} | Wanteds: ${getEffectiveWanted(item)}`;

      if (getExtraWanted(item.id) > 0) {
        row += ` | Graue Wanteds: +${getExtraWanted(item.id)}`;
      }

      lines.push(row);
    });
  }

  lines.push("");
  lines.push(`Höchste Geldstrafe: ${formatMoney(highestFine)}`);
  lines.push(`Höchste Wanteds: ${highestWanted || "—"}`);
  lines.push(`Rechte vorgelesen: ${els.rightsReadToggle.checked ? "Ja" : "Nein"}`);
  lines.push(`TV-Abtransport: ${els.transportToggle.checked ? "Ja" : "Nein"}`);
  lines.push(`Aktenzeile: ${buildCompactLine(items)}`);

  return lines.join("\n");
}

function updateLiveStamp() {
  els.liveStamp.textContent = `${getDate()} | ${getTime()}`;
}

function updateModeLabels() {
  if (state.longMode) {
    els.shortLabel.classList.remove("is-active");
    els.longLabel.classList.add("is-active");
  } else {
    els.shortLabel.classList.add("is-active");
    els.longLabel.classList.remove("is-active");
  }
}

function updateSummary() {
  const items = getSelectedItems();
  const highestFine = getHighestFine(items);
  const highestWanted = getHighestWanted(items);

  els.selectedCount.textContent = String(items.length);
  els.sumFine.textContent = formatMoney(highestFine);

  if (highestWanted > 0) {
    els.sumWanted.innerHTML = `<span class="wanted-inline">${renderStarRow(Math.min(highestWanted, 5))} <strong>${highestWanted}</strong></span>`;
  } else {
    els.sumWanted.textContent = "—";
  }

  els.aktenLine.textContent = buildCompactLine(items);
  els.aktenText.value = state.longMode
    ? buildLongText(items, highestFine, highestWanted)
    : buildCompactLine(items);

  updateModeLabels();
}

function updateUI() {
  renderCatalog();
  updateSummary();
}

function resetAll() {
  state.selected.clear();
  state.extraWantedById = {};
  state.search = "";

  els.searchInput.value = "";
  els.systemWantedInput.value = "0";
  els.plateInput.value = "";
  els.placeInput.value = "";
  els.azInput.value = "";
  els.remorseToggle.checked = false;
  els.repeatToggle.checked = false;
  els.transportToggle.checked = false;
  els.rightsReadToggle.checked = false;
  els.copyStatus.textContent = "Nicht kopiert";

  updateUI();
}

async function copyToClipboard(text, okText, failText) {
  try {
    await navigator.clipboard.writeText(text);
    els.copyStatus.textContent = okText;

    if (state.autoReset) {
      setTimeout(() => {
        resetAll();
      }, 250);
    }
  } catch {
    els.copyStatus.textContent = failText;
  }
}

async function copyLine() {
  if (!els.rightsReadToggle.checked) {
    els.copyStatus.textContent = "Rechte nicht vorgelesen";
    return;
  }

  await copyToClipboard(
    els.aktenLine.textContent,
    "Zeile kopiert",
    "Zeile konnte nicht kopiert werden"
  );
}

async function copyAkte() {
  if (!els.rightsReadToggle.checked) {
    els.copyStatus.textContent = "Rechte nicht vorgelesen";
    return;
  }

  await copyToClipboard(
    els.aktenText.value,
    "Akte kopiert",
    "Akte konnte nicht kopiert werden"
  );
}

function closeAllModals() {
  document.body.classList.remove("modal-open");
  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.classList.add("hidden");
  });
}

function openModal(id) {
  const modal = $(id);
  if (!modal) return;
  document.body.classList.add("modal-open");
  modal.classList.remove("hidden");
}

function setupModals() {
  document.querySelectorAll("[data-modal]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.modal));
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeAllModals();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllModals();
  });
}

function setupCatalogEvents() {
  els.sections.addEventListener("click", (event) => {
    const plus = event.target.closest("[data-plus]");
    const minus = event.target.closest("[data-minus]");
    const card = event.target.closest(".card");

    if (plus) {
      const id = plus.dataset.plus;
      state.extraWantedById[id] = getExtraWanted(id) + 1;
      updateUI();
      return;
    }

    if (minus) {
      const id = minus.dataset.minus;
      state.extraWantedById[id] = Math.max(0, getExtraWanted(id) - 1);
      updateUI();
      return;
    }

    if (!card) return;

    const id = card.dataset.id;
    if (!id) return;

    if (state.selected.has(id)) {
      state.selected.delete(id);
    } else {
      state.selected.add(id);
    }

    updateUI();
  });
}

function setupInputs() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value || "";
    renderCatalog();
  });

  [
    els.remorseToggle,
    els.repeatToggle,
    els.transportToggle,
    els.rightsReadToggle,
    els.systemWantedInput,
    els.plateInput,
    els.placeInput,
    els.azInput
  ].forEach((el) => {
    el.addEventListener("input", updateSummary);
    el.addEventListener("change", updateSummary);
  });

  els.modeToggle.addEventListener("change", () => {
    state.longMode = !!els.modeToggle.checked;
    updateSummary();
  });

  els.autoResetToggle.addEventListener("change", () => {
    state.autoReset = !!els.autoResetToggle.checked;
  });

  els.pinSidebarToggle.addEventListener("change", () => {
    els.sidebar.classList.toggle("is-pinned", !!els.pinSidebarToggle.checked);
  });

  els.btnReset.addEventListener("click", resetAll);
  els.btnCopyLine.addEventListener("click", copyLine);
  els.btnCopy.addEventListener("click", copyAkte);
  els.aktenLine.addEventListener("click", copyLine);

  els.themeBtn.addEventListener("click", () => {
    const current = els.body.getAttribute("data-theme") || "cyan";
    const next = current === "cyan" ? "blue" : current === "blue" ? "violet" : "cyan";
    els.body.setAttribute("data-theme", next);
  });
}

function boot() {
  state.longMode = !!els.modeToggle.checked;
  state.autoReset = !!els.autoResetToggle.checked;

  setupModals();
  setupCatalogEvents();
  setupInputs();

  updateLiveStamp();
  updateUI();

  setInterval(() => {
    updateLiveStamp();
    updateSummary();
  }, 1000);
}

boot();
