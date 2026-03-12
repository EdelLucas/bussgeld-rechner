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

  window.initUI = function initUI(config) {
    const lawData = config.lawData || [];
    const groupOrder = config.groupOrder || [];
    const fibcoFieldIds = config.fibcoFieldIds || [];

    const state = {
      selected: new Set(),
      extraWantedById: {},
      search: "",
      longMode: false,
      autoReset: false
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
      fibcoCopyBtn: $("fibcoCopyBtn"),
      fibcoPreview: $("fibcoPreview"),
      fibcoLawSearch: $("fibcoLawSearch"),
      fibcoLawResults: $("fibcoLawResults"),
      fibcoLawSelected: $("fibcoLawSelected"),
      fibcoAccusationExtra: $("fibcoAccusationExtra")
    };

    function getFilteredLaws() {
      const q = state.search.trim().toLowerCase();
      if (!q) return lawData;

      return lawData.filter((law) => {
        return (
          law.group.toLowerCase().includes(q) ||
          law.section.toLowerCase().includes(q) ||
          law.para.toLowerCase().includes(q) ||
          law.name.toLowerCase().includes(q) ||
          (law.note || "").toLowerCase().includes(q)
        );
      });
    }

    function getSelectedItems() {
      return lawData.filter((law) => state.selected.has(law.id));
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

    function getEffectiveFine(item) {
      let fine = getDisplayFine(item);

      if (els.repeatToggle && els.repeatToggle.checked && item.section === "STVO") {
        fine *= 2;
      }

      return fine;
    }

    function renderWantedIcons(fixedWanted, selectedGray, grayMax) {
      let html = "";

      for (let i = 0; i < fixedWanted; i += 1) {
        html += `<span class="star-on">★</span>`;
      }

      for (let i = 0; i < selectedGray; i += 1) {
        html += `<span class="star-on">★</span>`;
      }

      for (let i = selectedGray; i < grayMax; i += 1) {
        html += `<span class="star-off">★</span>`;
      }

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

    function getFineDisplayText(item) {
      const fineText = formatMoney(getEffectiveFine(item));

      if (els.repeatToggle && els.repeatToggle.checked && item.section === "STVO") {
        return `${fineText} (x2)`;
      }

      return fineText;
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
              <div class="card-fine">${escapeHtml(getFineDisplayText(item))}</div>
              <div class="card-note">${escapeHtml(item.note || "")}</div>

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
      if (!items.length) return 0;
      return Math.max(...items.map((item) => getEffectiveFine(item)));
    }

    function getHighestWanted(items) {
      if (!items.length) return 0;

      let highest = Math.max(...items.map((item) => getActiveWanted(item)));
      const systemWanted = Math.max(0, Number(els.systemWantedInput ? els.systemWantedInput.value : 0));

      highest += systemWanted;

      if (els.remorseToggle && els.remorseToggle.checked && highest > 0) {
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
      const az = els.azInput ? els.azInput.value.trim() : "";
      const plate = els.plateInput ? els.plateInput.value.trim() : "";
      const place = els.placeInput ? els.placeInput.value.trim() : "";

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
          const activeWanted = getActiveWanted(item);
          const graySelected = getSelectedGrayWanted(item);
          let row = `- ${item.para} ${item.name} | ${formatMoney(getEffectiveFine(item))} | Wanteds: ${activeWanted}`;

          if (graySelected > 0) row += ` | Graue Wanteds aktiviert: ${graySelected}/${item.grayWantedMax}`;
          if (item.note) row += ` | Hinweis: ${item.note}`;

          lines.push(row);
        });
      }

      lines.push("");
      lines.push(`Höchste Geldstrafe: ${formatMoney(highestFine)}`);
      lines.push(`Höchste Wanteds: ${highestWanted || "—"}`);
      lines.push(`Rechte vorgelesen: ${els.rightsReadToggle && els.rightsReadToggle.checked ? "Ja" : "Nein"}`);
      lines.push(`TV-Abtransport: ${els.transportToggle && els.transportToggle.checked ? "Ja" : "Nein"}`);
      lines.push(`Aktenzeile: ${buildCompactLine(items)}`);

      return lines.join("\n");
    }

    function updateLiveStamp() {
      if (!els.liveStamp) return;
      els.liveStamp.textContent = `${getDate()} | ${getTime()}`;
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

    function updateSummary() {
      const items = getSelectedItems();
      const highestFine = getHighestFine(items);
      const highestWanted = getHighestWanted(items);

      if (els.selectedCount) els.selectedCount.textContent = String(items.length);
      if (els.sumFine) els.sumFine.textContent = formatMoney(highestFine);
      if (els.sumWanted) els.sumWanted.innerHTML = renderSummaryWantedIcons(highestWanted);
      if (els.aktenLine) els.aktenLine.textContent = buildCompactLine(items);

      if (els.aktenText) {
        els.aktenText.value = state.longMode
          ? buildLongText(items, highestFine, highestWanted)
          : buildCompactLine(items);
      }

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

      if (els.searchInput) els.searchInput.value = "";
      if (els.systemWantedInput) els.systemWantedInput.value = "0";
      if (els.plateInput) els.plateInput.value = "";
      if (els.placeInput) els.placeInput.value = "";
      if (els.azInput) els.azInput.value = "";
      if (els.remorseToggle) els.remorseToggle.checked = false;
      if (els.repeatToggle) els.repeatToggle.checked = false;
      if (els.transportToggle) els.transportToggle.checked = false;
      if (els.rightsReadToggle) els.rightsReadToggle.checked = false;
      if (els.copyStatus) els.copyStatus.textContent = "Nicht kopiert";

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
        return;
      }

      await copyToClipboard(
        els.aktenLine ? els.aktenLine.textContent : "",
        "Zeile kopiert",
        "Zeile konnte nicht kopiert werden"
      );
    }

    async function copyAkte() {
      if (!els.rightsReadToggle || !els.rightsReadToggle.checked) {
        if (els.copyStatus) els.copyStatus.textContent = "Rechte nicht vorgelesen";
        return;
      }

      await copyToClipboard(
        els.aktenText ? els.aktenText.value : "",
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
      if (!els.sections) return;

      els.sections.addEventListener("click", (event) => {
        const plus = event.target.closest("[data-plus]");
        const minus = event.target.closest("[data-minus]");
        const card = event.target.closest(".card");

        if (plus) {
          const item = lawData.find((law) => law.id === plus.dataset.plus);
          if (!item) return;

          const current = getSelectedGrayWanted(item);
          state.extraWantedById[item.id] = Math.min(current + 1, Number(item.grayWantedMax || 0));
          updateUI();
          return;
        }

        if (minus) {
          const item = lawData.find((law) => law.id === minus.dataset.minus);
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
        els.repeatToggle,
        els.transportToggle,
        els.rightsReadToggle,
        els.systemWantedInput,
        els.plateInput,
        els.placeInput,
        els.azInput
      ].forEach((el) => {
        if (!el) return;
        el.addEventListener("input", updateSummary);
        el.addEventListener("change", updateSummary);
      });

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
      if (els.aktenLine) els.aktenLine.addEventListener("click", copyLine);
    }

    state.longMode = !!(els.modeToggle && els.modeToggle.checked);
    state.autoReset = !!(els.autoResetToggle && els.autoResetToggle.checked);

    setupModals();
    setupCatalogEvents();
    setupInputs();
    setupFibco();
    updateLiveStamp();
    updateUI();

    setInterval(() => {
      updateLiveStamp();
      updateSummary();
    }, 1000);
  };
})();
