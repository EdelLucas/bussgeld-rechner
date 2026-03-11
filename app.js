const $ = (id) => document.getElementById(id);

const GESETZE = [
  { id: "stgb-3-1", para: "StGB §3.1", name: "Beleidigung", fine: 10000, wanted: 0, type: "STGB" },
  { id: "stgb-3-2", para: "StGB §3.2", name: "Belästigung", fine: 10000, wanted: 0, type: "STGB" },
  { id: "stgb-3-3", para: "StGB §3.3", name: "Drohung", fine: 5000, wanted: 1, type: "STGB" },
  { id: "stgb-4-1", para: "StGB §4.1", name: "Versuchter Mord / Mord", fine: 30000, wanted: 4, type: "STGB" },
  { id: "stgb-4-2", para: "StGB §4.2", name: "Körperverletzung", fine: 15000, wanted: 2, type: "STGB" },
  { id: "stgb-4-3", para: "StGB §4.3", name: "Körperverletzung mit Todesfolge", fine: 20000, wanted: 3, type: "STGB" },
  { id: "stgb-4-4", para: "StGB §4.4", name: "Gewaltsame Drohung", fine: 5000, wanted: 1, type: "STGB" },
  { id: "stgb-5", para: "StGB §5", name: "Fahrlässige Tötung", fine: 20000, wanted: 3, type: "STGB" },
  { id: "stgb-6", para: "StGB §6", name: "Sexuelle Belästigung", fine: 30000, wanted: 1, type: "STGB" },
  { id: "stgb-8", para: "StGB §8", name: "Diebstahl", fine: 5000, wanted: 0, type: "STGB" },
  { id: "stgb-9", para: "StGB §9", name: "Fahrzeugdiebstahl", fine: 10000, wanted: 2, type: "STGB" },
  { id: "stgb-10", para: "StGB §10", name: "Betrug", fine: 5000, wanted: 0, type: "STGB" },
  { id: "stgb-10-1", para: "StGB §10.1", name: "Besitz illegaler Gegenstände", fine: 10000, wanted: 2, type: "STGB" },
  { id: "stgb-11", para: "StGB §11", name: "Raub", fine: 25000, wanted: 3, type: "STGB" },
  { id: "stgb-12-1", para: "StGB §12.1", name: "Geschäftsraub / Ammu Rob", fine: 35000, wanted: 2, type: "STGB" },
  { id: "stgb-12-3", para: "StGB §12.3", name: "ATM Raub", fine: 5000, wanted: 1, type: "STGB" },
  { id: "stgb-13", para: "StGB §13", name: "Einbruch", fine: 15000, wanted: 2, type: "STGB" },
  { id: "stgb-14", para: "StGB §14", name: "Steuerhinterziehung", fine: 50000, wanted: 3, type: "STGB" },
  { id: "stgb-15-1", para: "StGB §15.1", name: "Nichtbeachten einer amtlichen Anweisung", fine: 10000, wanted: 0, type: "STGB" },
  { id: "stgb-15-2", para: "StGB §15.2", name: "Entziehung polizeilicher Maßnahmen", fine: 10000, wanted: 2, type: "STGB" },
  { id: "stgb-15-3", para: "StGB §15.3", name: "Behinderung eines Beamten bei der Arbeit", fine: 10000, wanted: 1, type: "STGB" },
  { id: "stgb-15-4", para: "StGB §15.4", name: "Bestechung von Beamten", fine: 10000, wanted: 2, type: "STGB" },
  { id: "stgb-15-5", para: "StGB §15.5", name: "Widerstand gegen Vollstreckungsbeamte", fine: 20000, wanted: 2, type: "STGB" },
  { id: "stgb-15-6", para: "StGB §15.6", name: "Behinderung des EMS bei der Arbeit", fine: 10000, wanted: 0, type: "STGB" },
  { id: "stgb-15-7", para: "StGB §15.7", name: "Nichtausweisen bei polizeilichen / medizinischen Maßnahmen", fine: 15000, wanted: 1, type: "STGB" },
  { id: "stgb-16", para: "StGB §16", name: "Befreiung von Gefangenen", fine: 30000, wanted: 3, type: "STGB" },
  { id: "stgb-17", para: "StGB §17", name: "Durchbrechen von Absperrungen", fine: 25000, wanted: 1, type: "STGB" },
  { id: "stgb-18", para: "StGB §18", name: "Unerlaubtes Betreten eines militärischen Geländes", fine: 50000, wanted: 5, type: "STGB" },
  { id: "stgb-18-1", para: "StGB §18.1", name: "Unerlaubtes Betreten von Sperrzonen", fine: 25000, wanted: 2, type: "STGB" },
  { id: "stgb-18-2", para: "StGB §18.2", name: "Unerlaubtes Befahren von Sperrzonen", fine: 25000, wanted: 2, type: "STGB" },
  { id: "stgb-19", para: "StGB §19", name: "Falsche Namensangabe", fine: 10000, wanted: 0, type: "STGB" },
  { id: "stgb-20", para: "StGB §20", name: "Sachbeschädigung", fine: 5000, wanted: 0, type: "STGB" },
  { id: "stgb-21", para: "StGB §21", name: "Unterlassene Hilfeleistung", fine: 5000, wanted: 0, type: "STGB" },
  { id: "stgb-23", para: "StGB §23", name: "Missbrauch von Notruf", fine: 30000, wanted: 0, type: "STGB" },
  { id: "stgb-24", para: "StGB §24", name: "Amtsanmaßung", fine: 25000, wanted: 2, type: "STGB" },
  { id: "stgb-25", para: "StGB §25", name: "Terrorismus", fine: 25000, wanted: 3, type: "STGB" },

  { id: "stvo-1", para: "StVO §1", name: "Rotlichtverstoß", fine: 4000, wanted: 0, type: "STVO" },
  { id: "stvo-2", para: "StVO §2", name: "Gefährdung im Straßenverkehr", fine: 8000, wanted: 1, type: "STVO" },
  { id: "stvo-3", para: "StVO §3", name: "Fahren ohne Fahrerlaubnis", fine: 12000, wanted: 1, type: "STVO" }
];

const state = {
  selected: new Set(),
  extraWantedById: {},
  search: "",
  shortMode: true,
  autoReset: false
};

const els = {
  cards: $("cards"),
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
  shortModeToggle: $("shortModeToggle"),
  autoResetToggle: $("autoResetToggle"),
  pinSidebarToggle: $("pinSidebarToggle"),
  sidebar: $("sidebar")
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

function getSelectedItems() {
  return GESETZE.filter((item) => state.selected.has(item.id));
}

function getExtraWanted(itemId) {
  return Number(state.extraWantedById[itemId] || 0);
}

function getEffectiveWanted(item) {
  return Math.max(0, Number(item.wanted || 0) + getExtraWanted(item.id));
}

function getFilteredItems() {
  const q = state.search.trim().toLowerCase();
  if (!q) return GESETZE;

  return GESETZE.filter((item) => {
    return (
      item.para.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  });
}

function renderStars(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  let html = "";

  for (let i = 0; i < safeCount; i += 1) {
    html += `<span class="star-on">★</span>`;
  }

  const empty = Math.max(0, 5 - safeCount);
  for (let i = 0; i < empty; i += 1) {
    html += `<span class="star-off">★</span>`;
  }

  return html;
}

function renderCards() {
  const items = getFilteredItems();

  if (!items.length) {
    els.cards.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; cursor: default;">
        <div class="card-name">Keine Treffer gefunden.</div>
      </div>
    `;
    return;
  }

  els.cards.innerHTML = items.map((item) => {
    const selected = state.selected.has(item.id);
    const extraWanted = getExtraWanted(item.id);
    const effectiveWanted = getEffectiveWanted(item);

    return `
      <article class="card ${selected ? "selected" : ""}" data-id="${escapeHtml(item.id)}">
        <div class="card-top">
          <div class="card-para">${escapeHtml(item.para)}</div>
          <div class="card-icon">↗</div>
        </div>

        <div class="card-name">${escapeHtml(item.name)}</div>
        <div class="card-fine">${formatMoney(item.fine)}</div>

        <div class="card-bottom">
          <div class="stars-wrap">${renderStars(effectiveWanted)}</div>

          <div class="gray-control" data-stop-click="true">
            <button class="gray-btn" type="button" data-minus="${escapeHtml(item.id)}">−</button>
            <div class="gray-count">${extraWanted}</div>
            <button class="gray-btn" type="button" data-plus="${escapeHtml(item.id)}">+</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function getHighestFine(items) {
  if (!items.length) return 0;

  const repeatStvo = !!els.repeatToggle?.checked;

  return Math.max(
    ...items.map((item) => {
      let fine = Number(item.fine || 0);

      if (repeatStvo && item.type === "STVO") {
        fine *= 2;
      }

      return fine;
    })
  );
}

function getHighestWanted(items) {
  if (!items.length) return 0;

  let highest = Math.max(...items.map((item) => getEffectiveWanted(item)));

  const systemWanted = Math.max(0, Number(els.systemWantedInput?.value || 0));
  highest += systemWanted;

  if (els.remorseToggle?.checked && highest > 0) {
    highest = Math.max(1, highest - 2);
  }

  return highest;
}

function buildCompactLine(items) {
  const now = new Date();
  const date = getDate(now);
  const time = getTime(now, false);
  const paras = items.map((item) => item.para).join(" + ");

  return `${date} | ${time} - ${paras || "—"}`;
}

function buildLongText(items, highestFine, highestWanted) {
  const now = new Date();
  const lines = [];

  const date = getDate(now);
  const time = getTime(now, true);
  const az = els.azInput?.value.trim() || "";
  const plate = els.plateInput?.value.trim() || "";
  const place = els.placeInput?.value.trim() || "";
  const rightsRead = !!els.rightsReadToggle?.checked;
  const transport = !!els.transportToggle?.checked;

  lines.push(`Datum: ${date}`);
  lines.push(`Uhrzeit: ${time}`);

  if (az) lines.push(`Aktenzeichen: ${az}`);
  if (plate) lines.push(`Kennzeichen: ${plate}`);
  if (place) lines.push(`Ort: ${place}`);

  lines.push("");
  lines.push("Straftaten:");

  if (items.length) {
    items.forEach((item) => {
      const extraWanted = getExtraWanted(item.id);
      let fineText = formatMoney(item.fine);

      if (els.repeatToggle?.checked && item.type === "STVO") {
        fineText = `${formatMoney(item.fine)} → ${formatMoney(item.fine * 2)}`;
      }

      let row = `- ${item.para} ${item.name} | ${fineText} | Wanteds: ${getEffectiveWanted(item)}`;
      if (extraWanted > 0) {
        row += ` | Graue Wanteds: +${extraWanted}`;
      }
      lines.push(row);
    });
  } else {
    lines.push("- —");
  }

  lines.push("");
  lines.push(`Höchste Geldstrafe: ${formatMoney(highestFine)}`);
  lines.push(`Höchste Wanteds: ${highestWanted || "—"}`);
  lines.push(`Rechte vorgelesen: ${rightsRead ? "Ja" : "Nein"}`);
  lines.push(`TV-Abtransport: ${transport ? "Ja" : "Nein"}`);
  lines.push(`Aktenzeile: ${buildCompactLine(items)}`);

  return lines.join("\n");
}

function updateLiveStamp() {
  els.liveStamp.textContent = `${getDate()} | ${getTime()}`;
}

function updateSummary() {
  const items = getSelectedItems();
  const highestFine = getHighestFine(items);
  const highestWanted = getHighestWanted(items);

  els.selectedCount.textContent = String(items.length);
  els.sumFine.textContent = formatMoney(highestFine);
  els.sumWanted.textContent = highestWanted ? highestWanted : "—";
  els.aktenLine.textContent = buildCompactLine(items);

  if (state.shortMode) {
    els.aktenText.value = buildCompactLine(items);
  } else {
    els.aktenText.value = buildLongText(items, highestFine, highestWanted);
  }
}

function updateUI() {
  renderCards();
  updateSummary();
}

function resetAll() {
  state.selected.clear();
  state.extraWantedById = {};
  state.search = "";

  els.searchInput.value = "";
  els.copyStatus.textContent = "Nicht kopiert";
  els.systemWantedInput.value = "0";
  els.plateInput.value = "";
  els.placeInput.value = "";
  els.azInput.value = "";
  els.rightsReadToggle.checked = false;
  els.remorseToggle.checked = false;
  els.repeatToggle.checked = false;
  els.transportToggle.checked = false;

  updateUI();
}

async function copyToClipboard(text, successText, errorText) {
  try {
    await navigator.clipboard.writeText(text);
    els.copyStatus.textContent = successText;

    if (state.autoReset) {
      setTimeout(resetAll, 250);
    }
  } catch {
    els.copyStatus.textContent = errorText;
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

function openModal(modalId) {
  const modal = $(modalId);
  if (!modal) return;

  document.body.classList.add("modal-open");
  modal.classList.remove("hidden");
}

function closeAllModals() {
  document.body.classList.remove("modal-open");
  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.classList.add("hidden");
  });
}

function setupModals() {
  document.querySelectorAll("[data-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      openModal(button.dataset.modal);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeAllModals();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });
}

function setupCardEvents() {
  els.cards.addEventListener("click", (event) => {
    const plusBtn = event.target.closest("[data-plus]");
    const minusBtn = event.target.closest("[data-minus]");
    const card = event.target.closest(".card");

    if (plusBtn) {
      const id = plusBtn.dataset.plus;
      state.extraWantedById[id] = getExtraWanted(id) + 1;
      updateUI();
      return;
    }

    if (minusBtn) {
      const id = minusBtn.dataset.minus;
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
    renderCards();
  });

  [
    els.rightsReadToggle,
    els.remorseToggle,
    els.repeatToggle,
    els.transportToggle,
    els.systemWantedInput,
    els.plateInput,
    els.placeInput,
    els.azInput
  ].forEach((element) => {
    element.addEventListener("input", updateSummary);
    element.addEventListener("change", updateSummary);
  });

  els.shortModeToggle.addEventListener("change", () => {
    state.shortMode = !!els.shortModeToggle.checked;
    updateSummary();
  });

  els.autoResetToggle.addEventListener("change", () => {
    state.autoReset = !!els.autoResetToggle.checked;
  });

  els.pinSidebarToggle.addEventListener("change", () => {
    els.sidebar.classList.toggle("is-pinned", !!els.pinSidebarToggle.checked);
  });

  els.btnReset.addEventListener("click", resetAll);
  els.btnCopy.addEventListener("click", copyAkte);
  els.btnCopyLine.addEventListener("click", copyLine);
  els.aktenLine.addEventListener("click", copyLine);
}

function boot() {
  state.shortMode = !!els.shortModeToggle.checked;
  state.autoReset = !!els.autoResetToggle.checked;

  setupModals();
  setupInputs();
  setupCardEvents();

  updateLiveStamp();
  updateUI();

  setInterval(() => {
    updateLiveStamp();
    updateSummary();
  }, 1000);
}

boot();
