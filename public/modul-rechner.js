window.Rechner = {
  mount(root){
    root.innerHTML = `
      <div class="panel">
        <div class="title">⚖ Strafrechner</div>

        <div class="row">
          <div class="col" style="min-width:520px">
            <input id="search" placeholder="Suche..." />
            <div id="cards" style="margin-top:12px; max-height:70vh; overflow:auto; padding-right:6px"></div>
          </div>

          <div class="col">
            <div class="panel" style="box-shadow:none">
              <div class="row">
                <div class="col">
                  <div class="small">HÖCHSTE STRAFE</div>
                  <div id="outM" style="font-size:26px; font-weight:900; margin-top:6px; color:#d4af37">$0</div>
                </div>
                <div class="col">
                  <div class="small">WANTEDS</div>
                  <div id="outW" style="font-size:26px; font-weight:900; margin-top:6px; color:#f1fa8c">0</div>
                </div>
              </div>

              <hr/>

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

              <hr/>

              <div class="small" style="color:var(--accent); font-weight:900">AKTEN-EINTRAG (klicken)</div>
              <div id="entry" style="margin-top:8px; background:#0a0c10; border:1px dashed #2a2f38; border-radius:12px; padding:10px; min-height:48px; font-size:12px; color:var(--muted); cursor:copy">
                Wähle Strafen...
              </div>

              <div class="row" style="margin-top:10px">
                <button id="btnRechte" class="btnMini">Rechte</button>
                <button id="btnBelehr" class="btnMini">Belehrungen</button>
                <button id="btnAnw" class="btnMini">Anwälte</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,.72); z-index:50; align-items:center; justify-content:center; padding:18px">
        <div id="modalBox" style="width:min(1200px,96vw); height:min(88vh,980px); background:var(--card); border:1px solid rgba(255,46,126,.65); border-radius:18px; box-shadow:var(--shadow); overflow:hidden">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid var(--border); background:rgba(255,46,126,.06)">
            <div id="modalTitle" style="font-weight:900; color:var(--accent)"></div>
            <button id="modalClose" class="btnMini">Schließen</button>
          </div>
          <div id="modalBody" style="padding:14px; height:calc(100% - 52px); overflow:auto"></div>
        </div>
      </div>
    `;

    const laws = loadLaws();
    const state = {
      selected: [],
      activeGs: {},
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
        style="width:100%; height:78vh; border:none; border-radius:12px"></iframe>
    `);

    $("#btnRechte").onclick = ()=> openModal("RECHTE", `
      <div style="font-size:14px; line-height:1.55">
        Sie haben das Recht zu schweigen, alles was Sie sagen kann und wird gegen Sie verwendet werden.
        Ab 3 Wanteds haben Sie das Recht auf einen staatlich anerkannten Anwalt, den Sie selbst benennen müssen.
        Wenn kein Anwalt verfügbar ist, wird Ihnen keiner gestellt. Die Judikative übernimmt der Exekutivbeamte.
        Wenn ein Anwalt hinzugezogen wird, kann es länger als 25 Minuten dauern. Haben Sie ihre Rechte verstanden?
      </div>
    `);

    $("#btnBelehr").onclick = ()=> openModal("BELEHRUNGEN", `
      <div style="font-size:14px; line-height:1.55">
        <b style="color:#d4af37">Belehrung Haftbefehl</b><br/>
        "Die Justiz hat einen Haftbefehl gegen Sie erlassen, Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird gegen Sie verwendet werden.
        Sie haben das Recht gegen den Haftbefehl vor Gericht zu ziehen, falls Sie dies möchten, müssen Sie innerhalb von 48 Stunden eine Klage über einen Rechtsanwalt bei der Regierung gegen den Haftbefehl einreichen.
        Sollte dies nicht in der genannten Frist geschehen oder sollten Sie einen Gerichtsprozess ablehnen, wird der Haftbefehl von den ausgewählten Beamten vollstreckt.
        Im weiteren Verlauf erhalten Sie eine staatliche Berufssperre von X Tagen nach §19 (4) Beamten Dienst Gesetzbuch.
        Während dieser Zeit dürfen Sie keinem Staatsdienst nachgehen. Wenn Sie flüchten haben Sie kein Recht mehr auf einen Rechtsanwalt.”<br/><br/>

        <b style="color:#d4af37">Belehrung Beschluss</b><br/>
        "Die Justiz hat einen Beschluss gegen Sie erlassen, Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird gegen Sie verwendet werden.
        Sie haben das Recht gegen den Beschluss vor Gericht zu ziehen, falls Sie dies möchten, müssen Sie innerhalb von 48 Stunden eine Klage über einen Rechtsanwalt bei der Regierung gegen den Beschluss einreichen.
        Sollte dies nicht in der genannten Frist geschehen oder sollten Sie einen Gerichtsprozess ablehnen, wird der Beschluss von den ausgewählten Beamten vollstreckt.
        Wenn Sie flüchten haben Sie kein Recht mehr auf einen Rechtsanwalt." <br/><br/>

        <b style="color:#d4af37">Belehrung Befragung</b><br/>
        „Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird vor Gericht gegen Sie verwendet werden.
        Sie haben das Recht, zu jeder Vernehmung einen Rechtsanwalt hinzuzuziehen. Haben Sie das verstanden?“
      </div>
    `);

    function toggleBtn(btn, on){
      btn.textContent = on ? "AN" : "AUS";
      btn.style.borderColor = on ? "rgba(255,46,126,.65)" : "#2a2f38";
    }

    function starsText(item, id){
      const fixed = item.w || 0;
      const opt = item.gs || 0;
      const active = state.activeGs[id] || 0;
      return "★".repeat(fixed) + "☆".repeat(active) + "✩".repeat(Math.max(0, opt - active));
    }

    function calcFine(item, id){
      const w = (item.w || 0) + (state.activeGs[id] || 0);

      if (item.perStar) {
        return (item.perStar || 0) * w;
      }
      if (item.perStarAdd) {
        return (item.m || 0) + (item.perStarAdd || 0) * w;
      }
      return (item.m || 0);
    }

    function update(){
      let maxM = 0;
      let totalW = 0;

      state.selected.forEach(l => {
        const id = l.id;
        const w = (l.w || 0) + (state.activeGs[id] || 0);
        totalW += w;

        const fine = calcFine(l, id);
        if (fine > maxM) maxM = fine;
      });

      if(state.reue && totalW > 0) totalW = Math.max(1, totalW - 2);

      outM.textContent = "$" + maxM.toLocaleString();
      outW.textContent = String(totalW);

      if(!state.rights && (state.selected.length || state.grundActive)){
        entry.textContent = "⚠️ RECHTE VERGESSEN!";
        entry.style.color = "#ff6b6b";
        return;
      }

      const parts = [];
      if(state.grundActive && state.grund.trim()) parts.push(`Grund: ${state.grund.trim()}`);
      if(state.selected.length) parts.push(state.selected.map(x=>x.p).join(", "));
      if(state.reue && state.selected.length) parts.push("§35");

      entry.textContent = parts.length ? parts.join(" | ") : "Wähle Strafen...";
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
            if(idx>-1){
              state.selected.splice(idx,1);
              delete state.activeGs[id];
            } else {
              state.selected.push({ id, ...i });
            }
            render();
            update();
          };

          // Toggle optional stars by right-click (simple & robust)
          tr.oncontextmenu = (e)=>{
            e.preventDefault();
            const sel = state.selected.find(s=>s.id===id);
            if(!sel) return;
            const max = sel.gs || 0;
            if(max <= 0) return;
            const cur = state.activeGs[id] || 0;
            state.activeGs[id] = (cur + 1) % (max + 1);
            render();
            update();
          };

          const fine = isSel ? calcFine({id, ...i}, id) : (i.m || 0);

          tr.innerHTML = `
            <td style="width:110px; color:var(--accent); font-weight:900">${i.p}</td>
            <td>${i.n}${i.note ? `<span class="small"> — ${i.note}</span>` : ""}</td>
            <td style="width:140px; color:#d4af37; font-weight:900">${starsText(i, id)}</td>
            <td style="width:110px; text-align:right; color:#d4af37; font-weight:900">$${Number(fine).toLocaleString()}</td>
          `;
          tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        wrap.appendChild(head);
        wrap.appendChild(table);
        cards.appendChild(wrap);
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
      update();
    };
    inGrund.oninput = ()=>{ state.grund = inGrund.value; update(); };

    // copy
    entry.onclick = async ()=>{
      const txt = entry.textContent || "";
      if(txt.includes("⚠️")) return;
      try{ await navigator.clipboard.writeText(txt); }catch{}
    };

    render();
    update();
  }
};
