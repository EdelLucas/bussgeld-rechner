window.Rechner = {
  onLawsUpdate: null,

  async mount(root, SESSION){
    root.innerHTML = `
      <div class="panel">
        <div class="title">⚖ Strafrechner</div>

        <div class="row">
          <div class="col" style="min-width:520px">
            <input id="search" placeholder="Suche..." />
            <div id="cards" style="margin-top:12px; max-height:72vh; overflow:auto; padding-right:6px"></div>
          </div>

          <div class="col" style="min-width:360px">
            <div class="panel" style="box-shadow:none">
              <div class="row">
                <div class="col">
                  <div class="small">HÖCHSTE STRAFE</div>
                  <div id="outM" style="font-size:28px; font-weight:900; margin-top:6px; color:#d4af37">$0</div>
                </div>
                <div class="col">
                  <div class="small">WANTEDS (höchstes)</div>
                  <div id="outW" style="font-size:28px; font-weight:900; margin-top:6px; color:#f1fa8c">0</div>
                </div>
              </div>

              <div class="hr"></div>

              <div class="row" style="align-items:center">
                <div class="col small">Rechte verlesen?</div>
                <div class="col" style="text-align:right"><button id="swRights" class="btnMini">AUS</button></div>
              </div>

              <div class="row" style="align-items:center; margin-top:8px">
                <div class="col small">Reue (§35)</div>
                <div class="col" style="text-align:right"><button id="sw35" class="btnMini">AUS</button></div>
              </div>

              <div class="row" style="align-items:center; margin-top:8px">
                <div class="col small">Haftbefehl / Beschluss (Grund)</div>
                <div class="col" style="text-align:right"><button id="swGrund" class="btnMini">AUS</button></div>
              </div>

              <input id="inGrund" placeholder="Grund / Aktenzeichen..." style="margin-top:10px; display:none"/>

              <div class="hr"></div>

              <div class="small" style="color:var(--accent); font-weight:900">AKTEN-EINTRAG (klicken)</div>
              <div id="entry" style="margin-top:8px; background:#0a0c10; border:1px dashed #2a2f38; border-radius:12px; padding:10px; min-height:56px; font-size:12px; color:var(--muted); cursor:copy">
                Wähle Strafen...
              </div>

              <div class="row" style="margin-top:10px; gap:8px">
                <button id="btnRechte" class="btnMini" style="flex:1">Rechte</button>
                <button id="btnBelehr" class="btnMini" style="flex:1">Belehrungen</button>
                <button id="btnAnw" class="btnMini" style="flex:1">Anwälte</button>
              </div>

              <div class="row" style="margin-top:10px">
                <button id="btnReset" class="btnMini" style="width:100%">Reset (Eintrag löschen)</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="modal" class="modal" style="display:none">
        <div id="modalBox" class="modalBox">
          <div class="modalHead">
            <div id="modalTitle" class="modalTitle"></div>
            <button id="modalClose" class="btnMini">Schließen</button>
          </div>
          <div id="modalBody" class="modalBody"></div>
        </div>
      </div>
    `;

    const $ = (sel)=>root.querySelector(sel);
    const cards = $("#cards");
    const search = $("#search");
    const outM = $("#outM");
    const outW = $("#outW");
    const entry = $("#entry");
    const inGrund = $("#inGrund");
    const swRights = $("#swRights");
    const sw35 = $("#sw35");
    const swGrund = $("#swGrund");

    const modal = $("#modal");
    const modalBox = $("#modalBox");
    const modalTitle = $("#modalTitle");
    const modalBody = $("#modalBody");
    const modalClose = $("#modalClose");

    // Laws: org from server (fallback default)
    let laws = await loadOrgLaws(SESSION).catch(()=>null);
    if (!laws) laws = window.DEFAULT_LAWS;

    const state = {
      selected: [],
      activeGs: {},   // id -> count
      rights: false,
      reue: false,
      grundActive: false,
      grund: ""
    };

    // allow live update
    Rechner.onLawsUpdate = (newLaws)=>{
      laws = Array.isArray(newLaws) ? newLaws : laws;
      render();
      update();
    };

    function openModal(title, html, size){
      modalTitle.textContent = title;
      modalBody.innerHTML = html;
      modal.style.display = "flex";

      // size tweak: rights/belehr smaller
      if (size === "small") modalBox.style.maxWidth = "720px";
      else modalBox.style.maxWidth = "980px";
    }
    function closeModal(){ modal.style.display = "none"; }
    modalClose.onclick = closeModal;
    modal.onclick = (e)=>{ if(e.target === modal) closeModal(); };

    $("#btnAnw").onclick = ()=> openModal("ANWÄLTE", `
      <iframe
        src="https://docs.google.com/spreadsheets/d/1DufMS-4hxX75e9bJk_z3jSHqCcO6JmimoqYh6M94zP0/edit?gid=690010630#gid=690010630"
        style="width:100%; height:74vh; border:none; border-radius:12px"></iframe>
    `, "large");

    $("#btnRechte").onclick = ()=> openModal("RECHTE", `
      <div style="font-size:14px; line-height:1.45">
        Sie haben das Recht zu schweigen, alles was Sie sagen kann und wird gegen Sie verwendet werden.
        Ab 3 Wanteds haben Sie das Recht auf einen staatlich anerkannten Anwalt, den Sie selbst benennen müssen.
        Wenn kein Anwalt verfügbar ist, wird Ihnen keiner gestellt. Die Judikative übernimmt der Exekutivbeamte.
        Wenn ein Anwalt hinzugezogen wird, kann es länger als 25 Minuten dauern. Haben Sie ihre Rechte verstanden?
      </div>
    `, "small");

    $("#btnBelehr").onclick = ()=> openModal("BELEHRUNGEN", `
      <div style="font-size:14px; line-height:1.45">
        <b style="color:#d4af37">Belehrung Haftbefehl</b><br/>
        „Die Justiz hat einen Haftbefehl gegen Sie erlassen, Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird gegen Sie verwendet werden.
        Sie haben das Recht gegen den Haftbefehl vor Gericht zu ziehen, falls Sie dies möchten, müssen Sie innerhalb von 48 Stunden eine Klage über einen Rechtsanwalt
        bei der Regierung gegen den Haftbefehl einreichen. Sollte dies nicht in der genannten Frist geschehen oder sollten Sie einen Gerichtsprozess ablehnen, wird der Haftbefehl
        von den ausgewählten Beamten vollstreckt. Im weiteren Verlauf erhalten Sie eine staatliche Berufssperre von X Tagen nach §19 (4) Beamten Dienst Gesetzbuch.
        Während dieser Zeit dürfen Sie keinem Staatsdienst nachgehen. Wenn Sie flüchten haben Sie kein Recht mehr auf einen Rechtsanwalt.” 
        <div class="hr"></div>
        <b style="color:#d4af37">Belehrung Beschluss</b><br/>
        „Die Justiz hat einen Beschluss gegen Sie erlassen, Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird gegen Sie verwendet werden.
        Sie haben das Recht gegen den Beschluss vor Gericht zu ziehen, falls Sie dies möchten, müssen Sie innerhalb von 48 Stunden eine Klage über einen Rechtsanwalt
        bei der Regierung gegen den Beschluss einreichen. Sollte dies nicht in der genannten Frist geschehen oder sollten Sie einen Gerichtsprozess ablehnen, wird der Beschluss
        von den ausgewählten Beamten vollstreckt. Wenn Sie flüchten haben Sie kein Recht mehr auf einen Rechtsanwalt."
        <div class="hr"></div>
        <b style="color:#d4af37">Belehrung Befragung</b><br/>
        „Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird vor Gericht gegen Sie verwendet werden.
        Sie haben das Recht, zu jeder Vernehmung einen Rechtsanwalt hinzuzuziehen. Haben Sie das verstanden?“
      </div>
    `, "small");

    function toggleBtn(btn, on){
      btn.textContent = on ? "AN" : "AUS";
      btn.style.borderColor = on ? "rgba(255,46,126,.65)" : "#2a2f38";
    }

    function fmtNow(){
      const d = new Date();
      return d.toLocaleString("de-DE", { hour12:false });
    }

    function calcWantedMax(){
      // wanted = max over selected of (w + gs)
      let maxW = 0;
      for (const l of state.selected){
        const w = (l.w || 0) + (state.activeGs[l.id] || 0);
        if (w > maxW) maxW = w;
      }
      if (state.reue && maxW > 0) maxW = Math.max(1, maxW - 2);
      return maxW;
    }

    function update(){
      let maxM = 0;
      for (const l of state.selected) if ((l.m || 0) > maxM) maxM = l.m || 0;

      const maxW = calcWantedMax();

      outM.textContent = "$" + Number(maxM).toLocaleString();
      outW.textContent = String(maxW);

      if(!state.rights && (state.selected.length || state.grundActive)){
        entry.textContent = "⚠️ RECHTE NICHT VERLESEN!";
        entry.style.color = "#ff6b6b";
        return;
      }

      const parts = [];
      const dt = fmtNow();

      if (state.grundActive && state.grund.trim()) parts.push(`Grund: ${state.grund.trim()}`);
      if (state.selected.length) parts.push(state.selected.map(x=>x.p).join(", "));
      if (state.reue && state.selected.length) parts.push("§35");

      // add date/time always if something exists
      const core = parts.length ? parts.join(" | ") : "";
      entry.textContent = core ? `${dt} | ${core}` : "Wähle Strafen...";
      entry.style.color = "var(--muted)";
    }

    function render(){
      cards.innerHTML = "";
      laws.forEach((cat, catIdx)=>{
        const wrap = document.createElement("div");
        wrap.className = "panel";
        wrap.style.boxShadow = "none";
        wrap.style.marginBottom = "12px";

        const head = document.createElement("div");
        head.className = "title";
        head.style.color = "var(--accent)";
        head.style.fontSize = "13px";
        head.textContent = cat.cat;

        const table = document.createElement("table");
        table.className = "table";
        const tbody = document.createElement("tbody");

        cat.items.forEach((i, itemIdx)=>{
          const id = `${catIdx}-${itemIdx}`;
          const isSel = state.selected.some(s=>s.id===id);

          const tr = document.createElement("tr");
          tr.style.background = isSel ? "rgba(255,46,126,.08)" : "transparent";
          tr.style.cursor = "pointer";

          tr.onclick = ()=>{
            const idx = state.selected.findIndex(s=>s.id===id);
            if(idx>-1) state.selected.splice(idx,1);
            else state.selected.push({ id, ...i });
            render();
            update();
          };

          const baseW = i.w || 0;
          const gsCount = i.gs || 0;
          const gsActive = state.activeGs[id] || 0;

          const starsTd = document.createElement("td");
          starsTd.style.width = "150px";
          starsTd.style.color = "#d4af37";
          starsTd.style.fontWeight = "900";

          // build stars clickable for GS portion
          const starsWrap = document.createElement("div");
          starsWrap.style.display = "flex";
          starsWrap.style.gap = "6px";
          starsWrap.style.alignItems = "center";

          const full = document.createElement("span");
          full.textContent = "★".repeat(baseW);
          starsWrap.appendChild(full);

          // GS stars clickable (empty stars)
          for(let s=1; s<=gsCount; s++){
            const star = document.createElement("span");
            star.textContent = s <= gsActive ? "★" : "☆";
            star.style.cursor = "pointer";
            star.style.opacity = s <= gsActive ? "1" : ".65";
            star.onclick = (e)=>{
              e.stopPropagation();
              // toggle count
              state.activeGs[id] = (state.activeGs[id] === s) ? (s-1) : s;
              render();
              update();
            };
            starsWrap.appendChild(star);
          }

          starsTd.appendChild(starsWrap);

          const fine = Number(i.m || 0);

          tr.innerHTML = `
            <td style="width:110px; color:var(--accent); font-weight:900">${escapeHtml(i.p)}</td>
            <td style="min-width:260px">${escapeHtml(i.n)}</td>
          `;
          tr.appendChild(starsTd);
          tr.innerHTML += `
            <td style="width:110px; text-align:right; color:#d4af37; font-weight:900">$${fine.toLocaleString()}</td>
          `;

          tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        wrap.appendChild(head);
        wrap.appendChild(table);
        cards.appendChild(wrap);
      });
    }

    function escapeHtml(s){
      return String(s ?? "").replace(/[&<>"']/g, m => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
      }[m]));
    }

    // Search filter
    search.oninput = ()=>{
      const q = search.value.toLowerCase();
      cards.querySelectorAll("tr").forEach(tr=>{
        tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
      });
    };

    // switches
    toggleBtn(swRights, state.rights);
    toggleBtn(sw35, state.reue);
    toggleBtn(swGrund, state.grundActive);

    swRights.onclick = ()=>{ state.rights=!state.rights; toggleBtn(swRights,state.rights); update(); };
    sw35.onclick = ()=>{ state.reue=!state.reue; toggleBtn(sw35,state.reue); update(); };
    swGrund.onclick = ()=>{
      state.grundActive=!state.grundActive;
      toggleBtn(swGrund,state.grundActive);
      inGrund.style.display = state.grundActive ? "block" : "none";
      update();
    };
    inGrund.oninput = ()=>{ state.grund = inGrund.value; update(); };

    // Copy (blocked if rights not read)
    entry.onclick = async ()=>{
      const txt = entry.textContent || "";
      if (txt.includes("⚠️")) return;
      try{ await navigator.clipboard.writeText(txt); }catch{}
    };

    // Reset button clears everything (no reload)
    $("#btnReset").onclick = ()=>{
      state.selected = [];
      state.activeGs = {};
      state.grund = "";
      state.grundActive = false;
      inGrund.value = "";
      inGrund.style.display = "none";

      // keep switches? you wanted reset to clear entry -> do full reset:
      state.rights = false;
      state.reue = false;

      toggleBtn(swRights, state.rights);
      toggleBtn(sw35, state.reue);
      toggleBtn(swGrund, state.grundActive);

      render();
      update();
    };

    render();
    update();

    // tick time (updates date/time in entry)
    setInterval(()=>update(), 1000);

    async function loadOrgLaws(SESSION){
      // try cache first
      try{
        const cached = localStorage.getItem("LAWS_CACHE");
        if (cached) return JSON.parse(cached);
      }catch{}

      const res = await fetch("/api/laws", {
        headers: { Authorization: "Bearer " + SESSION.token }
      });
      const data = await res.json();
      if (data.ok && data.laws) {
        localStorage.setItem("LAWS_CACHE", JSON.stringify(data.laws));
        return data.laws;
      }
      return null;
    }
  }
};
