window.Rechner = {
  mount(root){
    root.innerHTML = `
      <div class="panel">
        <div class="row" style="align-items:flex-start; justify-content:space-between;">
          <div>
            <div class="title">⚖ Strafkatalog</div>
            <div class="small">Auswahl → höchste Strafe + höchste Wanteds (nicht summiert)</div>
          </div>
          <button id="btnResetAll" class="btnMini">Reset</button>
        </div>

        <div class="row" style="margin-top:12px">
          <div class="col" style="min-width:560px">
            <input id="search" placeholder="Suche..."/>
            <div id="cards" style="margin-top:12px; max-height:72vh; overflow:auto; padding-right:6px"></div>
          </div>

          <div class="col">
            <div class="panel" style="box-shadow:none">
              <div class="row">
                <div class="col">
                  <div class="small">HÖCHSTE STRAFE</div>
                  <div id="outM" style="font-size:32px; font-weight:900; margin-top:6px; color:#d4af37">$0</div>
                </div>
                <div class="col">
                  <div class="small">WANTEDS (höchster)</div>
                  <div id="outW" style="font-size:32px; font-weight:900; margin-top:6px; color:#f1fa8c">0</div>
                </div>
              </div>

              <hr/>

              <div class="row" style="align-items:center">
                <div class="col small">Rechte verlesen?</div>
                <div class="col" style="text-align:right"><button id="swRights" class="btnMini">AUS</button></div>
              </div>

              <div class="row" style="align-items:center; margin-top:10px">
                <div class="col small">Reue (§35)</div>
                <div class="col" style="text-align:right"><button id="sw35" class="btnMini">AUS</button></div>
              </div>

              <div class="row" style="align-items:center; margin-top:10px">
                <div class="col small">Haftbefehl / Beschluss (Grund)</div>
                <div class="col" style="text-align:right"><button id="swGrund" class="btnMini">AUS</button></div>
              </div>

              <input id="inGrund" placeholder="Grund / Aktenzeichen..." style="margin-top:12px; display:none"/>

              <hr/>

              <div class="small" style="color:var(--accent); font-weight:900">AKTEN-EINTRAG (klicken)</div>
              <div id="entry" style="margin-top:10px; background:#0a0c10; border:1px dashed #2a2f38; border-radius:14px; padding:12px; min-height:56px; font-size:13px; color:var(--muted); cursor:copy">
                Wähle Strafen...
              </div>

              <div class="row" style="margin-top:12px; gap:10px">
                <button id="btnRechte" class="btnMini">Rechte</button>
                <button id="btnBelehr" class="btnMini">Belehrungen</button>
                <button id="btnAnw" class="btnMini">Anwälte</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal (kleiner) -->
      <div id="modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,.72); z-index:50; align-items:center; justify-content:center; padding:18px">
        <div id="modalBox" style="width:min(760px,94vw); height:min(70vh,760px); background:var(--card); border:1px solid rgba(255,46,126,.65); border-radius:18px; box-shadow:var(--shadow); overflow:hidden">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid var(--border); background:rgba(255,46,126,.06)">
            <div id="modalTitle" style="font-weight:900; color:var(--accent); font-size:15px"></div>
            <button id="modalClose" class="btnMini">Schließen</button>
          </div>
          <div id="modalBody" style="padding:14px; height:calc(100% - 52px); overflow:auto; font-size:14px; line-height:1.45"></div>
        </div>
      </div>
    `;

    const laws = loadLaws();

    const state = {
      selected: [],
      activeGs: {},   // id -> 0..gs
      rights: false,
      reue: false,
      grundActive: false,
      grund: ""
    };

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

    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    const modalClose = document.getElementById("modalClose");

    function nowStamp(){
      const d = new Date();
      const dd = d.toLocaleDateString("de-DE");
      const tt = d.toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
      return `${dd} ${tt}`;
    }

    function openModal(title, html){
      modalTitle.textContent = title;
      modalBody.innerHTML = html;
      modal.style.display = "flex";
    }
    function closeModal(){ modal.style.display = "none"; }

    modalClose.onclick = closeModal;
    modal.onclick = (e)=>{ if(e.target === modal) closeModal(); };

    $("#btnAnw").onclick = ()=> openModal("ANWÄLTE", `
      <iframe
        src="https://docs.google.com/spreadsheets/d/1DufMS-4hxX75e9bJk_z3jSHqCcO6JmimoqYh6M94zP0/edit?gid=690010630#gid=690010630"
        style="width:100%; height:55vh; border:none; border-radius:12px"></iframe>
    `);

    $("#btnRechte").onclick = ()=> openModal("RECHTE", `
      <div>
        Sie haben das Recht zu schweigen, alles was Sie sagen kann und wird gegen Sie verwendet werden.
        Ab 3 Wanteds haben Sie das Recht auf einen staatlich anerkannten Anwalt, den Sie selbst benennen müssen.
        Wenn kein Anwalt verfügbar ist, wird Ihnen keiner gestellt. Die Judikative übernimmt der Exekutivbeamte.
        Wenn ein Anwalt hinzugezogen wird, kann es länger als 25 Minuten dauern. Haben Sie ihre Rechte verstanden?
      </div>
    `);

    $("#btnBelehr").onclick = ()=> openModal("BELEHRUNGEN", `
      <div>
        <b style="color:#d4af37">Belehrung Haftbefehl</b><br/>
        "Die Justiz hat einen Haftbefehl gegen Sie erlassen, Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird gegen Sie verwendet werden. Sie haben das Recht gegen den Haftbefehl vor Gericht zu ziehen, falls Sie dies möchten, müssen Sie innerhalb von 48 Stunden eine Klage über einen Rechtsanwalt bei der Regierung gegen den Haftbefehl einreichen. Sollte dies nicht in der genannten Frist geschehen oder sollten Sie einen Gerichtsprozess ablehnen, wird der Haftbefehl von den ausgewählten Beamten vollstreckt. Im weiteren Verlauf erhalten Sie eine staatliche Berufssperre von X Tagen nach §19 (4) Beamten Dienst Gesetzbuch. Während dieser Zeit dürfen Sie keinem Staatsdienst nachgehen. Wenn Sie flüchten haben Sie kein Recht mehr auf einen Rechtsanwalt.” 
        <hr/>
        <b style="color:#d4af37">Belehrung Beschluss</b><br/>
        "Die Justiz hat einen Beschluss gegen Sie erlassen, Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird gegen Sie verwendet werden. Sie haben das Recht gegen den Beschluss vor Gericht zu ziehen, falls Sie dies möchten, müssen Sie innerhalb von 48 Stunden eine Klage über einen Rechtsanwalt bei der Regierung gegen den Beschluss einreichen. Sollte dies nicht in der genannten Frist geschehen oder sollten Sie einen Gerichtsprozess ablehnen, wird der Beschluss von den ausgewählten Beamten vollstreckt. Wenn Sie flüchten haben Sie kein Recht mehr auf einen Rechtsanwalt."
        <hr/>
        <b style="color:#d4af37">Belehrung Befragung</b><br/>
        „Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird vor Gericht gegen Sie verwendet werden. Sie haben das Recht, zu jeder Vernehmung einen Rechtsanwalt hinzuzuziehen. Haben Sie das verstanden?“
      </div>
    `);

    function toggleBtn(btn, on){
      btn.textContent = on ? "AN" : "AUS";
      btn.style.borderColor = on ? "rgba(255,46,126,.65)" : "#2a2f38";
    }

    function wantedForLaw(lawId, lawObj){
      const base = Number(lawObj.w || 0);
      const extra = Number(state.activeGs[lawId] || 0);
      return base + extra;
    }

    function update(){
      // Höchste Strafe bleibt max
      let maxM = 0;

      // Wanteds: NICHT summieren, sondern höchster
      let maxW = 0;

      state.selected.forEach(l => {
        if(l.m > maxM) maxM = l.m;
        const w = wantedForLaw(l.id, l);
        if(w > maxW) maxW = w;
      });

      // Reue: -2 aber mind. 1 wenn >0
      if(state.reue && maxW > 0) maxW = Math.max(1, maxW - 2);

      outM.textContent = "$" + maxM.toLocaleString();
      outW.textContent = String(maxW);

      // Rechte-Block (wie vorher) + kein Copy wenn fehlend
      if(!state.rights && (state.selected.length || state.grundActive)){
        entry.textContent = "⚠️ RECHTE VERGESSEN!";
        entry.style.color = "#ff6b6b";
        return;
      }

      const parts = [];
      if(state.grundActive && state.grund.trim()) parts.push(`Grund: ${state.grund.trim()}`);
      if(state.selected.length) parts.push(state.selected.map(x=>x.p).join(", "));
      if(state.reue && state.selected.length) parts.push("§35");

      if(!parts.length){
        entry.textContent = "Wähle Strafen...";
        entry.style.color = "var(--muted)";
        return;
      }

      entry.textContent = `${nowStamp()} | ${parts.join(" | ")}`;
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
        head.style.fontSize = "15px";
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

          tr.onclick = (e)=>{
            // Klick auf Stern soll nicht Row togglen
            if(e.target && e.target.classList && e.target.classList.contains("starOpt")) return;

            const idx = state.selected.findIndex(s=>s.id===id);
            if(idx>-1){
              state.selected.splice(idx,1);
              delete state.activeGs[id];
            }else{
              state.selected.push({id, ...i});
              state.activeGs[id] = state.activeGs[id] || 0;
            }
            render(); update();
          };

          const baseW = Number(i.w || 0);
          const gsMax = Number(i.gs || 0);
          const curGs = Number(state.activeGs[id] || 0);

          let starsHtml = `<span class="starRow">` +
            `<span class="starFill">${"★".repeat(baseW)}</span>`;

          // Klickbare Zusatzsterne (gs)
          for(let s=1; s<=gsMax; s++){
            const active = curGs >= s ? "active" : "";
            starsHtml += `<span class="starOpt ${active}" data-star="${id}" data-val="${s}">★</span>`;
          }
          starsHtml += `</span>`;

          tr.innerHTML = `
            <td style="width:110px; color:var(--accent); font-weight:900">${i.p}</td>
            <td style="font-size:14px">${i.n}</td>
            <td style="width:160px">${starsHtml}</td>
            <td style="width:110px; text-align:right; color:#d4af37; font-weight:900">$${Number(i.m).toLocaleString()}</td>
          `;

          tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        wrap.appendChild(head);
        wrap.appendChild(table);
        cards.appendChild(wrap);
      });

      // Stern clicks (nach render)
      cards.querySelectorAll(".starOpt").forEach(star=>{
        star.onclick = (ev)=>{
          ev.stopPropagation();
          const id = star.getAttribute("data-star");
          const val = Number(star.getAttribute("data-val") || 0);

          // Nur wenn Law selektiert ist
          const law = state.selected.find(x=>x.id===id);
          if(!law) return;

          state.activeGs[id] = (state.activeGs[id] === val) ? (val - 1) : val;
          render(); update();
        };
      });
    }

    // Search
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
      if(!state.grundActive){ state.grund=""; inGrund.value=""; }
      update();
    };
    inGrund.oninput = ()=>{ state.grund = inGrund.value; update(); };

    // copy
    entry.onclick = async ()=>{
      const txt = entry.textContent || "";
      if(txt.includes("⚠️")) return;
      if(txt.trim() === "Wähle Strafen...") return;
      try{ await navigator.clipboard.writeText(txt); }catch{}
    };

    // Reset
    $("#btnResetAll").onclick = ()=>{
      state.selected = [];
      state.activeGs = {};
      state.rights = false;
      state.reue = false;
      state.grundActive = false;
      state.grund = "";
      search.value = "";
      inGrund.value = "";
      inGrund.style.display = "none";
      toggleBtn(swRights, state.rights);
      toggleBtn(sw35, state.reue);
      toggleBtn(swGrund, state.grundActive);
      render(); update();
    };

    // Update Zeit im Eintrag (wenn was drin steht)
    setInterval(()=>{
      if(entry.textContent && entry.textContent.includes("|") && !entry.textContent.includes("⚠️")){
        update();
      }
    }, 1000);

    render();
    update();
  }
};
