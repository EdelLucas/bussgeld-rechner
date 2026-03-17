(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function formatMoney(value) {
    const amount = Math.round(Number(value) || 0);
    return `$${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function unique(list) {
    return [...new Set((list || []).filter(Boolean))];
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

  const LAW_PATCHES = {
    "stgb-20": {
      fineType: "base_plus_per_active_wanted",
      fine: 5000,
      finePerWanted: 5000,
      infoList: ["$5.000 + $5.000 pro weiteren Wanted"]
    },
    "stgb-28": {
      fineType: "base_plus_per_active_wanted",
      fine: 10000,
      finePerWanted: 10000,
      infoList: ["$10.000 + $10.000 pro weiteren Wanted"]
    },
    "stgb-41-1": {
      infoList: ["Waffenscheinentzug"]
    },
    "stgb-15-7": {
      infoList: ["Führerscheinentzug"]
    },
    "stgb-18-2": {
      infoList: ["Führerscheinentzug"]
    },
    "stgb-43": {
      infoList: [
        "0 - 3 Wanteds je nach Schwere",
        "20.000$ Mindestbußgeld + 5.000$ pro ausgestelltem Wanted"
      ]
    },
    "stgb-6-9": {
      fineType: "base_plus_per_active_wanted",
      fine: 5000,
      finePerWanted: 5000,
      infoList: ["$5.000 + $5.000 pro weiteren Wanted"]
    },
    "stvo-2": {
      infoList: ["Führerscheinentzug"]
    },
    "stvo-5": {
      infoList: ["Führerscheinentzug"]
    },
    "stvo-8-61-100": {
      infoList: ["Führerscheinentzug"]
    },
    "stvo-8-101plus": {
      infoList: ["Führerscheinentzug"]
    },
    "stvo-10-art-12": {
      infoList: ["Führerscheinentzug"]
    },
    "stvo-10-art-16": {
      infoList: ["Führerscheinentzug"]
    },
    "stvo-17-art-1-2": {
      infoList: ["Führerscheinentzug"]
    },
    "stvo-24": {
      infoList: ["Führerscheinentzug"]
    },
    "stvo-26": {
      infoList: [
        "15.000$: Roter Bordstein, Bushaltestelle, Grünflächen, Privatgrundstück, Behinderung Fußverkehr, Freeway, Highway, Behinderung Straßenverkehr, Zuparken von Einfahrten",
        "20.000$: Greenzone, staatliche Organisationen, Postamt, Tatverdächtiger, KFZ ohne Kennzeichen, Bergung aus schwer zugänglichem Gelände"
      ]
    },
    "stvo-28": {
      infoList: ["Führerscheinentzug"]
    },
    "waffg-5-1": {
      infoList: ["Waffenscheinentzug"]
    },
    "waffg-8-1": {
      fineType: "base_plus_per_active_wanted",
      fine: 5000,
      finePerWanted: 5000,
      infoList: ["Waffenscheinentzug", "$5.000 + $5.000 pro weiteren Wanted"]
    },
    "waffg-8-2": {
      infoList: ["Waffenscheinentzug"]
    },
    "waffg-11": {
      infoList: ["Waffenscheinentzug"]
    },
    "btmg-2-2": {
      infoList: ["Erst ab 20 Gramm Marihuana"]
    },
    "btmg-3-bis-20": {
      infoList: ["+ zusätzlich die verlangte Verkaufssumme"]
    },
    "btmg-3-bis-50": {
      infoList: ["+ zusätzlich die verlangte Verkaufssumme"]
    },
    "btmg-3-ab-51": {
      infoList: ["+ zusätzlich die verlangte Verkaufssumme"]
    }
  };

  const EXTRA_LAWS = [
    {
      id: "stvo-10-art-8",
      group: "Straßenverkehrsordnung (StVO)",
      section: "STVO",
      para: "StVO §10 Art. 8",
      name: "Helmpflicht",
      fineType: "fixed",
      fine: 10000,
      fixedWanted: 0,
      grayWantedMax: 0
    },
    {
      id: "stgb-40",
      group: "Wirtschaftskriminalität (StGB)",
      section: "STGB",
      para: "StGB §40",
      name: "Weitergabe von Staatseigentum",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-2",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §2",
      name: "Verhaltenskodex",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-3",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §3",
      name: "Dienstpflichten des Beamten",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-7",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §7",
      name: "Bestechlichkeit",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-8",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §8",
      name: "Vorteilsannahme & Vorteilsgewährung",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-9",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §9",
      name: "Verleitung eines Untergebenen/Kollegen zur Straftat",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-10",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §10",
      name: "Unterlassen der Diensthandlung",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-11",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §11",
      name: "Falschbeurkundung im Amt",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-13",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §13",
      name: "Hochverrat im öffentlichen Dienst",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-14",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §14",
      name: "Umgehung von Strafprozessen",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-15",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §15",
      name: "Verschwörung",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    },
    {
      id: "bdg-16",
      group: "Beamtendienstgesetzbuch (BDG)",
      section: "BDG",
      para: "BDG §16",
      name: "Schmuggel",
      fineType: "fixed",
      fine: 50000,
      fixedWanted: 5,
      grayWantedMax: 0,
      note: "max. 50.000$"
    }
  ];

  function mergeLawData(baseLawData) {
    const byId = new Map(
      (baseLawData || []).map((item) => [item.id, { ...item }])
    );

    Object.entries(LAW_PATCHES).forEach(([id, patch]) => {
      if (!byId.has(id)) return;
      const current = byId.get(id);
      byId.set(id, {
        ...current,
        ...patch,
        infoList: unique([...(current.infoList || []), ...(patch.infoList || [])])
      });
    });

    EXTRA_LAWS.forEach((item) => {
      if (!byId.has(item.id)) {
        byId.set(item.id, { ...item });
      }
    });

    return Array.from(byId.values());
  }

  window.initUI = function initUI(config) {
    const lawData = mergeLawData(config.lawData || []);
    const lawById = new Map(lawData.map((law) => [law.id, law]));

    const groupOrder = [...(config.groupOrder || [])];
    if (!groupOrder.includes("Beamtendienstgesetzbuch (BDG)")) {
      groupOrder.push("Beamtendienstgesetzbuch (BDG)");
    }

    const fibcoFieldIds = config.fibcoFieldIds || [];

    const state = {
      selected: new Set(),
      extraWantedById: {},
      search: "",
      longMode: false,
      autoReset: false,
      parkingPlate: "",
      blitzer: {
        isCalculated: false,
        plate: "",
        place: "",
        zoneValue: 50,
        zoneLabel: "Verkehrsberuhigter Bereich (50 km/h)",
        speed: "",
        lawId: "",
        resultText: ""
      }
    };

    const fibcoState = {
      search: "",
      selectedLawIds: new Set()
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
      aktenOutputLabel: $("aktenOutputLabel"),
      aktenOutput: $("aktenOutput"),
      rightsReadToggle: $("rightsReadToggle"),
      rightsWarning: $("rightsWarning"),
      remorseToggle: $("remorseToggle"),
      transportToggle: $("transportToggle"),
      transportFields: $("transportFields"),
      transportAgencySelect: $("transportAgencySelect"),
      transportNoteInput: $("transportNoteInput"),
      systemWantedInput: $("systemWantedInput"),
      azInput: $("azInput"),
      modeToggle: $("modeToggle"),
      shortLabel: $("shortLabel"),
      longLabel: $("longLabel"),
      autoResetToggle: $("autoResetToggle"),
      pinSidebarToggle: $("pinSidebarToggle"),
      sidebar: $("sidebar"),
      fibcoCopyBtn: $("fibcoCopyBtn"),
      fibcoPreview: $("fibcoPreview"),
      fibcoLawSearch: $("fibcoLawSearch"),
      fibcoLawResults: $("fibcoLawResults"),
      fibcoLawSelected: $("fibcoLawSelected"),
      fibcoAccusationExtra: $("fibcoAccusationExtra"),
      openBlitzerBtn: $("openBlitzerBtn"),
      parkingPlateInput: $("parkingPlateInput"),
      blitzerPlate: $("blitzerPlate"),
      blitzerPlace: $("blitzerPlace"),
      blitzerZone: $("blitzerZone"),
      blitzerSpeed: $("blitzerSpeed"),
      blitzerCalcBtn: $("blitzerCalcBtn"),
      blitzerResultBox: $("blitzerResultBox"),
      blitzerResultText: $("blitzerResultText"),
      blitzerSummaryBox: $("blitzerSummaryBox"),
      blitzerSummaryText: $("blitzerSummaryText"),
      reportType: $("reportType"),
      reportMessage: $("reportMessage"),
      reportSubmitBtn: $("reportSubmitBtn"),
      reportStatus: $("reportStatus")
    };

    function getFilteredLaws() {
      const q = state.search.trim().toLowerCase();
      if (!q) return lawData;

      return lawData.filter((law) => {
        return (
          String(law.group || "").toLowerCase().includes(q) ||
          String(law.section || "").toLowerCase().includes(q) ||
          String(law.para || "").toLowerCase().includes(q) ||
          String(law.name || "").toLowerCase().includes(q) ||
          String(law.note || "").toLowerCase().includes(q) ||
          String((law.infoList || []).join(" ")).toLowerCase().includes(q)
        );
      });
    }

    function getSelectedGrayWanted(item) {
      const raw = Number(state.extraWantedById[item.id] || 0);
      return Math.max(0, Math.min(raw, Number(item.grayWantedMax || 0)));
    }

    function getActiveWanted(item) {
      return Number(item.fixedWanted || 0) + getSelectedGrayWanted(item);
    }

    function getDisplayFine(item) {
      const activeWanted = getActiveWanted(item);

      if (item.fineType === "per_active_wanted") {
        return Number(item.finePerWanted || 0) * activeWanted;
      }

      if (item.fineType === "base_plus_per_active_wanted") {
        return Number(item.fine || 0) + (Number(item.finePerWanted || 0) * activeWanted);
      }

      return Number(item.fine || 0);
    }

    function getBlitzerBaseLaw() {
      if (!state.blitzer.isCalculated) return null;

      const speed = Number(state.blitzer.speed || 0);
      const zone = Number(state.blitzer.zoneValue || 0);
      const diff = speed - zone;

      if (!speed || diff < 10) return null;
      if (diff <= 40) return lawById.get("stvo-8-10-40") || null;
      if (diff <= 60) return lawById.get("stvo-8-41-60") || null;
      if (diff <= 100) return lawById.get("stvo-8-61-100") || null;
      return lawById.get("stvo-8-101plus") || null;
    }

    function getBlitzerVirtualItem() {
      const baseLaw = getBlitzerBaseLaw();
      if (!baseLaw) return null;

      const isAlreadySelected = state.selected.has(baseLaw.id);
      if (isAlreadySelected) return null;

      return {
        ...baseLaw,
        id: `__blitzer__${baseLaw.id}`,
        baseId: baseLaw.id,
        isVirtual: true,
        virtualType: "blitzer"
      };
    }

    function getReueVirtualItem() {
      if (!els.remorseToggle || !els.remorseToggle.checked) return null;

      return {
        id: "__reue__",
        baseId: "__reue__",
        isVirtual: true,
        virtualType: "reue",
        group: "Strafmodifikation",
        section: "STGB",
        para: "StGB §35",
        name: "Reue",
        fineType: "fixed",
        fine: 0,
        fixedWanted: 0,
        grayWantedMax: 0,
        infoList: ["Reue aktiv"]
      };
    }

    function isBlitzerAttachedToItem(item) {
      return !!(
        state.blitzer.isCalculated &&
        state.blitzer.lawId &&
        (item.id === state.blitzer.lawId || item.baseId === state.blitzer.lawId)
      );
    }

    function getInfoLines(item) {
      const lines = unique([
        ...(item.infoList || []),
        item.note || ""
      ]);

      if (isBlitzerAttachedToItem(item)) {
        lines.push(state.blitzer.plate ? `Kennzeichen: ${state.blitzer.plate}` : "");
        lines.push(state.blitzer.place ? `Ort: ${state.blitzer.place}` : "");
        lines.push(`Zone: ${state.blitzer.zoneLabel}`);
        lines.push(`Gemessen: ${state.blitzer.speed} km/h`);
      }

      if (!item.isVirtual && item.id === "stvo-12-1" && state.parkingPlate.trim()) {
        lines.push(`Kennzeichen: ${state.parkingPlate.trim()}`);
      }

      return unique(lines);
    }

    function getCardInfoText(item) {
      return getInfoLines(item).join(" • ");
    }

    function getSelectedItems() {
      return lawData.filter((law) => state.selected.has(law.id));
    }

    function getOutputItems() {
      const items = [...getSelectedItems()];
      const blitzerItem = getBlitzerVirtualItem();
      const reueItem = getReueVirtualItem();

      if (blitzerItem) items.push(blitzerItem);
      if (reueItem) items.push(reueItem);

      return items;
    }

    function renderWantedIcons(fixedWanted, selectedGray, grayMax) {
      let html = "";

      for (let i = 0; i < fixedWanted; i += 1) html += `<span class="star-on">★</span>`;
      for (let i = 0; i < selectedGray; i += 1) html += `<span class="star-on">★</span>`;
      for (let i = selectedGray; i < grayMax; i += 1) html += `<span class="star-off">★</span>`;

      if (!html) html = `<span class="star-off">—</span>`;
      return html;
    }

    function renderSummaryWantedIcons(count) {
      if (count <= 0) return "—";

      const capped = Math.min(count, 5);
      let icons = "";

      for (let i = 0; i < capped; i += 1) icons += `<span class="star-on">★</span>`;
      for (let i = capped; i < 5; i += 1) icons += `<span class="star-off">★</span>`;

      return `<span class="wanted-inline">${icons}<strong>${count}</strong></span>`;
    }

    function groupLaws(items) {
      const map = new Map();
      groupOrder.forEach((group) => map.set(group, []));

      items.forEach((item) => {
        if (!map.has(item.group)) map.set(item.group, []);
        map.get(item.group).push(item);
      });

      return Array.from(map.entries()).filter((entry) => entry[1].length > 0);
    }

    function renderCatalog() {
      if (!els.sections) return;

      const filtered = getFilteredLaws();

      if (!filtered.length) {
        els.sections.innerHTML = `<div class="empty-card">Keine Treffer gefunden.</div>`;
        return;
      }

      const grouped = groupLaws(filtered);

      els.sections.innerHTML = grouped.map(([groupName, items]) => {
        const cards = items.map((item) => {
          const isSelected = state.selected.has(item.id);
          const selectedGray = getSelectedGrayWanted(item);
          const grayMax = Number(item.grayWantedMax || 0);

          return `
            <article class="card ${isSelected ? "is-selected" : ""}" data-id="${escapeHtml(item.id)}">
              <div class="card-top">
                <div class="card-para">${escapeHtml(item.para)}</div>
                <div class="card-link">↗</div>
              </div>

              <div class="card-name">${escapeHtml(item.name)}</div>
              <div class="card-fine">${escapeHtml(formatMoney(getDisplayFine(item)))}</div>
              <div class="card-note">${escapeHtml(getCardInfoText(item))}</div>

              <div class="card-bottom">
                <div class="card-stars">${renderWantedIcons(item.fixedWanted, selectedGray, grayMax)}</div>

                ${
                  grayMax > 0
                    ? `
                      <div class="gray-wanted-tools" data-stop-click="true">
                        <button class="gray-btn" type="button" data-minus="${escapeHtml(item.id)}">−</button>
                        <div class="gray-count">${selectedGray}/${grayMax}</div>
                        <button class="gray-btn" type="button" data-plus="${escapeHtml(item.id)}">+</button>
                      </div>
                    `
                    : ""
                }
              </div>
            </article>
          `;
        }).join("");

        return `
          <section class="catalog-section">
            <div class="section-title">${escapeHtml(groupName)}</div>
            <div class="cards">${cards}</div>
          </section>
        `;
      }).join("");
    }

    function getHighestFine(items) {
      const realItems = items.filter((item) => item.para !== "StGB §35");
      if (!realItems.length) return 0;
      return Math.max(...realItems.map((item) => getDisplayFine(item)));
    }

    function getHighestWanted(items) {
      const realItems = items.filter((item) => item.para !== "StGB §35");
      if (!realItems.length) return 0;

      let highest = Math.max(...realItems.map((item) => getActiveWanted(item)));
      const systemWanted = Math.max(0, Number(els.systemWantedInput ? els.systemWantedInput.value : 0));

      highest += systemWanted;

      if (els.remorseToggle && els.remorseToggle.checked && highest > 0) {
        highest = Math.max(1, highest - 2);
      }

      return highest;
    }

    function getCompactItemText(item) {
      if (item.virtualType === "blitzer") {
        const parts = [];
        if (state.blitzer.plate) parts.push(state.blitzer.plate);
        if (state.blitzer.place) parts.push(state.blitzer.place);
        return `${item.para}${parts.length ? ` [${parts.join(" | ")}]` : ""}`;
      }

      if (item.virtualType === "reue") {
        return item.para;
      }

      if (isBlitzerAttachedToItem(item)) {
        const parts = [];
        if (state.blitzer.plate) parts.push(state.blitzer.plate);
        if (state.blitzer.place) parts.push(state.blitzer.place);
        return `${item.para}${parts.length ? ` [${parts.join(" | ")}]` : ""}`;
      }

      if (item.id === "stvo-12-1" && state.parkingPlate.trim()) {
        return `${item.para} [${state.parkingPlate.trim()}]`;
      }

      return item.para;
    }

    function buildCompactLine(items) {
      const date = getDate();
      const time = getTime(new Date(), false);
      const az = els.azInput ? els.azInput.value.trim() : "";
      const paras = items.map((item) => getCompactItemText(item)).join(" + ");
      const reason = paras || "—";

      return `${date} | ${time} - ${az ? `${az} - ` : ""}${reason}`;
    }

    function buildTransportText() {
      if (!els.transportToggle || !els.transportToggle.checked) return "Nein";

      const agency = els.transportAgencySelect ? els.transportAgencySelect.value.trim() : "";
      const note = els.transportNoteInput ? els.transportNoteInput.value.trim() : "";

      const parts = ["Ja"];
      if (agency) parts.push(`Behörde: ${agency}`);
      if (note) parts.push(`Hinweis: ${note}`);

      return parts.join(" | ");
    }

    function buildLongLine(item) {
      const parts = [`- ${item.para} — ${item.name}`];

      if (item.virtualType === "blitzer" || isBlitzerAttachedToItem(item)) {
        if (state.blitzer.plate) parts.push(`Kennzeichen: ${state.blitzer.plate}`);
        if (state.blitzer.place) parts.push(`Ort: ${state.blitzer.place}`);
        parts.push(`Zone: ${state.blitzer.zoneLabel}`);
        parts.push(`Gemessen: ${state.blitzer.speed} km/h`);
      }

      if (!item.isVirtual && item.id === "stvo-12-1" && state.parkingPlate.trim()) {
        parts.push(`Kennzeichen: ${state.parkingPlate.trim()}`);
      }

      return parts.join(" | ");
    }

    function buildLongText(items, highestFine, highestWanted) {
      const lines = [];
      const az = els.azInput ? els.azInput.value.trim() : "";

      lines.push(`Datum: ${getDate()}`);
      lines.push(`Uhrzeit: ${getTime()}`);

      if (az) lines.push(`Aktenzeichen: ${az}`);
      lines.push("");

      lines.push("Einträge:");

      if (!items.length) {
        lines.push("- —");
      } else {
        items.forEach((item) => {
          lines.push(buildLongLine(item));

          if (item.para !== "StGB §35") {
            lines.push(`  Geldstrafe: ${formatMoney(getDisplayFine(item))}`);
            lines.push(`  Wanteds: ${getActiveWanted(item)}`);
          }

          getInfoLines(item).forEach((info) => {
            lines.push(`  Info: ${info}`);
          });
        });
      }

      lines.push("");
      lines.push(`Höchste Geldstrafe: ${formatMoney(highestFine)}`);
      lines.push(`Höchste Wanteds: ${highestWanted || "—"}`);
      lines.push(`Rechte vorgelesen: ${els.rightsReadToggle && els.rightsReadToggle.checked ? "Ja" : "Nein"}`);
      lines.push(`TV-Abtransport: ${buildTransportText()}`);
      lines.push(`Aktenzeile: ${buildCompactLine(items)}`);

      return lines.join("\n");
    }

    function ensureSummaryInfoMount() {
      if (!els.sidebar) return null;
      const summaryPanel = els.sidebar.querySelector(".panel");
      if (!summaryPanel) return null;

      let mount = summaryPanel.querySelector("#summaryInfoMount");
      if (!mount) {
        mount = document.createElement("div");
        mount.id = "summaryInfoMount";
        mount.className = "summary-info-mount";
        summaryPanel.appendChild(mount);
      }
      return mount;
    }

    function renderSummaryInfo(items) {
      const mount = ensureSummaryInfoMount();
      if (!mount) return;

      const blocks = items
        .map((item) => {
          const info = getInfoLines(item);
          if (!info.length) return "";

          return `
            <div class="extra-info-item">
              <div class="extra-info-item-title">${escapeHtml(item.para)} — ${escapeHtml(item.name)}</div>
              <div class="extra-info-item-text">${escapeHtml(info.join("\n"))}</div>
            </div>
          `;
        })
        .filter(Boolean)
        .join("");

      mount.innerHTML = blocks
        ? `
          <div class="extra-info-title">ZUSATZINFOS</div>
          <div class="extra-info-list">${blocks}</div>
        `
        : "";
    }

    function updateModeLabels() {
      if (!els.shortLabel || !els.longLabel) return;

      if (state.longMode) {
        els.shortLabel.classList.remove("is-active");
        els.longLabel.classList.add("is-active");
      } else {
        els.shortLabel.classList.add("is-active");
        els.longLabel.classList.remove("is-active");
      }
    }

    function updateRightsWarning() {
      if (!els.rightsWarning || !els.rightsReadToggle) return;
      els.rightsWarning.classList.toggle("is-hidden", !!els.rightsReadToggle.checked);
    }

    function updateTransportFields() {
      if (!els.transportFields || !els.transportToggle) return;
      els.transportFields.classList.toggle("is-hidden", !els.transportToggle.checked);
    }

    function updateBlitzerSummaryUi() {
      if (!els.blitzerSummaryBox || !els.blitzerSummaryText) return;

      if (!state.blitzer.isCalculated) {
        els.blitzerSummaryBox.classList.add("is-hidden");
        els.blitzerSummaryText.textContent = "Noch keine Daten vorhanden.";
        return;
      }

      els.blitzerSummaryBox.classList.remove("is-hidden");
      els.blitzerSummaryText.textContent = state.blitzer.resultText || "Kein Blitzer-Eintrag.";
    }

    function updateSummary() {
      const items = getOutputItems();
      const highestFine = getHighestFine(items);
      const highestWanted = getHighestWanted(items);
      const compactLine = buildCompactLine(items);
      const longText = buildLongText(items, highestFine, highestWanted);

      if (els.selectedCount) els.selectedCount.textContent = String(items.length);
      if (els.sumFine) els.sumFine.textContent = formatMoney(highestFine);
      if (els.sumWanted) els.sumWanted.innerHTML = renderSummaryWantedIcons(highestWanted);

      if (els.aktenOutputLabel) {
        els.aktenOutputLabel.textContent = state.longMode ? "Langform" : "Kurze Aktenzeile";
      }

      if (els.aktenOutput) {
        els.aktenOutput.value = state.longMode ? longText : compactLine;
        els.aktenOutput.classList.toggle("textarea-large", state.longMode);
        els.aktenOutput.classList.toggle("textarea--compact", !state.longMode);
      }

      updateModeLabels();
      updateRightsWarning();
      updateTransportFields();
      updateBlitzerSummaryUi();
      renderSummaryInfo(items);
    }

    function updateUI() {
      renderCatalog();
      updateSummary();
    }

    function resetAll() {
      state.selected.clear();
      state.extraWantedById = {};
      state.search = "";
      state.parkingPlate = "";
      state.blitzer = {
        isCalculated: false,
        plate: "",
        place: "",
        zoneValue: 50,
        zoneLabel: "Verkehrsberuhigter Bereich (50 km/h)",
        speed: "",
        lawId: "",
        resultText: ""
      };

      if (els.searchInput) els.searchInput.value = "";
      if (els.systemWantedInput) els.systemWantedInput.value = "0";
      if (els.azInput) els.azInput.value = "";
      if (els.remorseToggle) els.remorseToggle.checked = false;
      if (els.transportToggle) els.transportToggle.checked = false;
      if (els.transportAgencySelect) els.transportAgencySelect.value = "";
      if (els.transportNoteInput) els.transportNoteInput.value = "";
      if (els.rightsReadToggle) els.rightsReadToggle.checked = false;
      if (els.copyStatus) els.copyStatus.textContent = "Nicht kopiert";
      if (els.parkingPlateInput) els.parkingPlateInput.value = "";

      if (els.blitzerPlate) els.blitzerPlate.value = "";
      if (els.blitzerPlace) els.blitzerPlace.value = "";
      if (els.blitzerZone) els.blitzerZone.value = "50";
      if (els.blitzerSpeed) els.blitzerSpeed.value = "";
      if (els.blitzerResultBox) els.blitzerResultBox.classList.add("is-hidden");
      if (els.blitzerResultText) els.blitzerResultText.textContent = "";

      updateUI();
    }

    async function copyToClipboard(text, okText, failText) {
      try {
        await navigator.clipboard.writeText(text);
        if (els.copyStatus) els.copyStatus.textContent = okText;

        if (state.autoReset) {
          setTimeout(() => resetAll(), 250);
        }
      } catch {
        if (els.copyStatus) els.copyStatus.textContent = failText;
      }
    }

    async function copyLine() {
      if (!els.rightsReadToggle || !els.rightsReadToggle.checked) {
        if (els.copyStatus) els.copyStatus.textContent = "Rechte nicht vorgelesen";
        updateRightsWarning();
        return;
      }

      await copyToClipboard(
        buildCompactLine(getOutputItems()),
        "Zeile kopiert",
        "Zeile konnte nicht kopiert werden"
      );
    }

    async function copyAkte() {
      if (!els.rightsReadToggle || !els.rightsReadToggle.checked) {
        if (els.copyStatus) els.copyStatus.textContent = "Rechte nicht vorgelesen";
        updateRightsWarning();
        return;
      }

      await copyToClipboard(
        els.aktenOutput ? els.aktenOutput.value : "",
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

      if (els.openBlitzerBtn) {
        els.openBlitzerBtn.addEventListener("click", () => openModal("blitzerModal"));
      }

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
      if (!els.sections) return;

      els.sections.addEventListener("click", (event) => {
        const plus = event.target.closest("[data-plus]");
        const minus = event.target.closest("[data-minus]");
        const card = event.target.closest(".card");

        if (plus) {
          const item = lawById.get(plus.dataset.plus);
          if (!item) return;

          const current = getSelectedGrayWanted(item);
          state.extraWantedById[item.id] = Math.min(current + 1, Number(item.grayWantedMax || 0));
          updateUI();
          return;
        }

        if (minus) {
          const item = lawById.get(minus.dataset.minus);
          if (!item) return;

          const current = getSelectedGrayWanted(item);
          state.extraWantedById[item.id] = Math.max(current - 1, 0);
          updateUI();
          return;
        }

        if (!card) return;

        const id = card.dataset.id;
        if (!id) return;

        if (state.selected.has(id)) state.selected.delete(id);
        else state.selected.add(id);

        updateUI();
      });
    }

    function getFibcoValue(id, fallback = "") {
      const el = $(id);
      return el ? el.value.trim() : fallback;
    }

    function getSelectedFibcoLawItems() {
      return lawData.filter((law) => fibcoState.selectedLawIds.has(law.id));
    }

    function buildFibcoAccusationBlock() {
      const selectedLaws = getSelectedFibcoLawItems()
        .map((law) => `- ${law.para} ${law.name}`);

      const extra = els.fibcoAccusationExtra ? els.fibcoAccusationExtra.value.trim() : "";
      const parts = [];

      if (selectedLaws.length) parts.push(selectedLaws.join("\n"));
      if (extra) parts.push(extra);

      return parts.join("\n\n").trim() || "- ABC";
    }

    function buildFibcoTemplate() {
      const name = getFibcoValue("fibcoName", "Name");
      const coId = getFibcoValue("fibcoCoId", "CO-ID-1");
      const date = getFibcoValue("fibcoDate", "Datum der Straftat");
      const codename = getFibcoValue("fibcoCodename", "[Codename]");
      const phone = getFibcoValue("fibcoPhone");
      const agency = getFibcoValue("fibcoAgency");
      const family = getFibcoValue("fibcoFamily");
      const passport = getFibcoValue("fibcoPassport");
      const badge = getFibcoValue("fibcoBadge");
      const personnel = getFibcoValue("fibcoPersonnel");
      const pdaMain = getFibcoValue("fibcoPdaMain");
      const pdaVehicles = getFibcoValue("fibcoPdaVehicles");
      const incident = getFibcoValue("fibcoIncident", "Am TT.MM.YYYY um HH:MM Uhr […]");
      const interrogation = getFibcoValue("fibcoInterrogation", "- ABC");
      const witness = getFibcoValue("fibcoWitness", "- ABC");
      const evidence = getFibcoValue("fibcoEvidence", "- ABC");
      const accusation = buildFibcoAccusationBlock();
      const conclusion = getFibcoValue("fibcoConclusion", "[Schlussbetrachtung]");

      return [
        `${name} | ${coId} | ${date}`,
        "",
        `Codename: ${codename}`,
        "",
        `Telefonnummer: ${phone}`,
        `Behörde: ${agency}`,
        `Familie: ${family}`,
        "",
        `Reisepass: ${passport}`,
        `Dienstausweis: ${badge}`,
        `Personalakte: ${personnel}`,
        `PDA Hauptseite: ${pdaMain}`,
        `PDA Fahrzeugliste: ${pdaVehicles}`,
        "",
        `[Vorfall]`,
        `${incident}`,
        "",
        `[Befragung Tatverdächtiger]`,
        `${interrogation}`,
        "",
        `[Zeugen-/Aussagen]`,
        `${witness}`,
        "",
        `[Beweissammlung]`,
        `${evidence}`,
        "",
        `[Tatvorwurf]`,
        `${accusation}`,
        "",
        `[Schlussbetrachtung]`,
        `${conclusion}`
      ].join("\n");
    }

    function updateFibcoPreview() {
      if (!els.fibcoPreview) return;
      els.fibcoPreview.value = buildFibcoTemplate();
    }

    function renderFibcoLawPicker() {
      if (!els.fibcoLawResults || !els.fibcoLawSelected) return;

      const q = fibcoState.search.trim().toLowerCase();

      const available = lawData
        .filter((law) => !fibcoState.selectedLawIds.has(law.id))
        .filter((law) => {
          if (!q) return true;
          return (
            law.para.toLowerCase().includes(q) ||
            law.name.toLowerCase().includes(q) ||
            law.group.toLowerCase().includes(q)
          );
        })
        .slice(0, 25);

      els.fibcoLawResults.innerHTML = available.length
        ? available.map((law) => `
            <button class="fibco-law-option" type="button" data-add-law="${escapeHtml(law.id)}">
              <div>
                <div class="fibco-law-option-para">${escapeHtml(law.para)}</div>
                <div class="fibco-law-option-name">${escapeHtml(law.name)}</div>
              </div>
              <strong>+</strong>
            </button>
          `).join("")
        : `<div class="empty-card">Keine passenden Gesetze gefunden.</div>`;

      const selected = getSelectedFibcoLawItems();

      els.fibcoLawSelected.innerHTML = selected.length
        ? selected.map((law) => `
            <div class="fibco-chip">
              <span>${escapeHtml(law.para)} — ${escapeHtml(law.name)}</span>
              <button type="button" data-remove-law="${escapeHtml(law.id)}">×</button>
            </div>
          `).join("")
        : `<div class="empty-card">Noch nichts ausgewählt.</div>`;
    }

    async function copyFibco() {
      try {
        await navigator.clipboard.writeText(els.fibcoPreview ? els.fibcoPreview.value : "");
      } catch {}
    }

    function updateBlitzerStateFromInputs() {
      state.blitzer.plate = els.blitzerPlate ? els.blitzerPlate.value.trim() : "";
      state.blitzer.place = els.blitzerPlace ? els.blitzerPlace.value.trim() : "";
      state.blitzer.zoneValue = els.blitzerZone ? Number(els.blitzerZone.value || 50) : 50;
      state.blitzer.zoneLabel = els.blitzerZone
        ? els.blitzerZone.options[els.blitzerZone.selectedIndex]?.text || "Zone"
        : "Zone";
      state.blitzer.speed = els.blitzerSpeed ? String(els.blitzerSpeed.value || "").trim() : "";
    }

    function calculateBlitzer() {
      updateBlitzerStateFromInputs();
      state.blitzer.isCalculated = true;

      const speed = Number(state.blitzer.speed || 0);
      const zone = Number(state.blitzer.zoneValue || 0);
      const law = getBlitzerBaseLaw();
      const diff = speed - zone;
      const lines = [];

      if (!speed || speed <= 0) {
        state.blitzer.lawId = "";
        state.blitzer.resultText = "Bitte eine gültige Geschwindigkeit eingeben.";
        if (els.blitzerResultBox) els.blitzerResultBox.classList.remove("is-hidden");
        if (els.blitzerResultText) els.blitzerResultText.textContent = state.blitzer.resultText;
        updateSummary();
        return;
      }

      if (state.blitzer.plate) lines.push(`Kennzeichen: ${state.blitzer.plate}`);
      if (state.blitzer.place) lines.push(`Ort: ${state.blitzer.place}`);
      lines.push(`Zone: ${state.blitzer.zoneLabel}`);
      lines.push(`Gemessen: ${speed} km/h`);
      lines.push(`Überschreitung: ${Math.max(0, diff)} km/h`);

      if (!law) {
        state.blitzer.lawId = "";
        lines.push("Kein passender Blitzer-Eintrag (unter 10 km/h Überschreitung).");
      } else {
        state.blitzer.lawId = law.id;
        lines.push(`Gesetz: ${law.para} — ${law.name}`);
        lines.push(`Bußgeld: ${formatMoney(getDisplayFine(law))}`);
        getInfoLines(law).forEach((info) => lines.push(`Info: ${info}`));
      }

      state.blitzer.resultText = lines.join("\n");

      if (els.blitzerResultBox) els.blitzerResultBox.classList.remove("is-hidden");
      if (els.blitzerResultText) els.blitzerResultText.textContent = state.blitzer.resultText;

      updateSummary();
    }

    function setupReport() {
      const WEBHOOK_URL = "https://discord.com/api/webhooks/1453855487937482894/dO3DP9IQw0xXnl6m62J4rqblUan0u38uya7zEJdtKgekuOXwe0oqdYiMfpGT6okIWSeg";

      if (!els.reportSubmitBtn || !els.reportType || !els.reportMessage || !els.reportStatus) return;

      els.reportSubmitBtn.addEventListener("click", async () => {
        const type = (els.reportType.value || "Bug").trim();
        const message = (els.reportMessage.value || "").trim();

        if (!message) {
          els.reportStatus.textContent = "Bitte erst eine Beschreibung eintragen.";
          return;
        }

        els.reportStatus.textContent = "Sende Report...";

        const payload = {
          username: "Strafkatalog Report",
          embeds: [
            {
              title: `${type} gemeldet`,
              description: message.slice(0, 4000),
              fields: [
                {
                  name: "Zeit",
                  value: `${getDate()} ${getTime(new Date(), false)}`,
                  inline: true
                },
                {
                  name: "Seite",
                  value: window.location.href || "unbekannt",
                  inline: false
                }
              ]
            }
          ]
        };

        try {
          const formData = new FormData();
          formData.append("payload_json", JSON.stringify(payload));

          await fetch(WEBHOOK_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors"
          });

          els.reportMessage.value = "";
          els.reportType.value = "Bug";
          els.reportStatus.textContent = "Report gesendet.";

          setTimeout(() => {
            els.reportStatus.textContent = "Noch nichts gesendet.";
          }, 3000);
        } catch {
          els.reportStatus.textContent = "Report konnte nicht gesendet werden.";
        }
      });
    }

    function setupFibco() {
      fibcoFieldIds.forEach((id) => {
        const el = $(id);
        if (!el) return;
        el.addEventListener("input", updateFibcoPreview);
        el.addEventListener("change", updateFibcoPreview);
      });

      if (els.fibcoAccusationExtra) {
        els.fibcoAccusationExtra.addEventListener("input", updateFibcoPreview);
        els.fibcoAccusationExtra.addEventListener("change", updateFibcoPreview);
      }

      if (els.fibcoLawSearch) {
        els.fibcoLawSearch.addEventListener("input", (event) => {
          fibcoState.search = event.target.value || "";
          renderFibcoLawPicker();
        });
      }

      if (els.fibcoLawResults) {
        els.fibcoLawResults.addEventListener("click", (event) => {
          const btn = event.target.closest("[data-add-law]");
          if (!btn) return;

          fibcoState.selectedLawIds.add(btn.dataset.addLaw);
          renderFibcoLawPicker();
          updateFibcoPreview();
        });
      }

      if (els.fibcoLawSelected) {
        els.fibcoLawSelected.addEventListener("click", (event) => {
          const btn = event.target.closest("[data-remove-law]");
          if (!btn) return;

          fibcoState.selectedLawIds.delete(btn.dataset.removeLaw);
          renderFibcoLawPicker();
          updateFibcoPreview();
        });
      }

      if (els.fibcoCopyBtn) {
        els.fibcoCopyBtn.addEventListener("click", copyFibco);
      }

      renderFibcoLawPicker();
      updateFibcoPreview();
    }

    function setupInputs() {
      if (els.searchInput) {
        els.searchInput.addEventListener("input", (event) => {
          state.search = event.target.value || "";
          renderCatalog();
        });
      }

      [
        els.remorseToggle,
        els.rightsReadToggle,
        els.systemWantedInput,
        els.azInput,
        els.transportToggle,
        els.transportAgencySelect,
        els.transportNoteInput
      ].forEach((el) => {
        if (!el) return;
        el.addEventListener("input", updateSummary);
        el.addEventListener("change", updateSummary);
      });

      if (els.parkingPlateInput) {
        els.parkingPlateInput.addEventListener("input", () => {
          state.parkingPlate = els.parkingPlateInput.value.trim();
          updateSummary();
        });
        els.parkingPlateInput.addEventListener("change", () => {
          state.parkingPlate = els.parkingPlateInput.value.trim();
          updateSummary();
        });
      }

      if (els.modeToggle) {
        els.modeToggle.addEventListener("change", () => {
          state.longMode = !!els.modeToggle.checked;
          updateSummary();
        });
      }

      if (els.autoResetToggle) {
        els.autoResetToggle.addEventListener("change", () => {
          state.autoReset = !!els.autoResetToggle.checked;
        });
      }

      if (els.pinSidebarToggle && els.sidebar) {
        els.pinSidebarToggle.addEventListener("change", () => {
          els.sidebar.classList.toggle("is-pinned", !!els.pinSidebarToggle.checked);
        });
      }

      if (els.btnReset) els.btnReset.addEventListener("click", resetAll);
      if (els.btnCopyLine) els.btnCopyLine.addEventListener("click", copyLine);
      if (els.btnCopy) els.btnCopy.addEventListener("click", copyAkte);

      if (els.aktenOutput) {
        els.aktenOutput.addEventListener("click", copyAkte);
      }

      if (els.blitzerCalcBtn) {
        els.blitzerCalcBtn.addEventListener("click", calculateBlitzer);
      }

      [els.blitzerPlate, els.blitzerPlace, els.blitzerZone, els.blitzerSpeed].forEach((el) => {
        if (!el) return;
        el.addEventListener("input", updateBlitzerStateFromInputs);
        el.addEventListener("change", updateBlitzerStateFromInputs);
      });
    }

    state.longMode = !!(els.modeToggle && els.modeToggle.checked);
    state.autoReset = !!(els.autoResetToggle && els.autoResetToggle.checked);
    state.parkingPlate = els.parkingPlateInput ? els.parkingPlateInput.value.trim() : "";

    setupModals();
    setupCatalogEvents();
    setupInputs();
    setupFibco();
    setupReport();
    updateBlitzerStateFromInputs();
    updateUI();
  };
})();
