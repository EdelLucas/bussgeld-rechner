window.Rechner = {
  mount(root){
    root.innerHTML = `
      <div class="panel">
        <div class="title">⚖ Strafrechner</div>

        <div class="row">
          <div class="col" style="min-width:620px">
            <input id="search" placeholder="Suche... (Paragraph / Name)"/>
            <div id="cards" style="margin-top:12px; max-height:72vh; overflow:auto; padding-right:6px"></div>
          </div>

          <div class="col">
            <div class="panel" style="box-shadow:none">
              <div class="row">
                <div class="col">
                  <div class="small">HÖCHSTE STRAFE</div>
                  <div id="outM" style="font-size:30px; font-weight:900; margin-top:6px; color:var(--gold)">$0</div>
                </div>
                <div class="col">
                  <div class="small">WANTEDS (nur höchster)</div>
                  <div id="outW" style="font-size:30px; font-weight:900; margin-top:6px; color:#f1fa8c">0</div>
                </div>
              </div>

              <hr/>

              <div class="row" style="align-items:center">
                <div class="col small">Rechte verlesen?</div>
                <div class="col" style="text-align:right"><button id="swRights" class="btnMini">AUS</button></div>
              </div>

              <div class="row" style="align-items:center; margin-top:10px">
                <div class="col small">Reue (§35) (−2 Wanteds, min. 1)</div>
                <div class="col" style="text-align:right"><button id="sw35" class="btnMini">AUS</button></div>
              </div>

              <div class="row" style="align-items:center; margin-top:10px">
                <div class="col small">Haftbefehl/Beschluss Grund</div>
                <div class="col" style="text-align:right"><button id="swGrund" class="btnMini">AUS</button></div>
              </div>

              <input id="inGrund" placeholder="Grund / Aktenzeichen..." style="margin-top:10px; display:none"/>

              <hr/>

              <div class="small" style="color:var(--accent); font-weight:900">AKTEN-EINTRAG (klicken)</div>
              <div id="entry" style="margin-top:8px; background:#0a0c10; border:1px dashed #2a2f38; border-radius:14px; padding:12px; min-height:64px; font-size:13px; color:var(--muted); cursor:copy">
                Wähle Strafen...
              </div>

              <div class="row" style="margin-top:12px">
                <button id="btnRechte" class="btnMini">Rechte</button>
                <button id="btnBelehr" class="btnMini">Belehrungen</button>
                <button id="btnAnw" class="btnMini">Anwälte</button>
              </div>

              <div class="row" style="margin-top:12px">
                <button id="btnReset" class="btnMini danger">Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="modal" class="modalOverlay">
        <div class="modalBox">
          <div class="modalHead">
            <div id="modalTitle" class="modalTitle"></div>
            <button id="modalClose" class="btnMini">Schließen</button>
          </div>
          <div id="modalBody" class="modalBody"></div>
        </div>
      </div>
    `;

    const laws = loadLaws();

    const state = {
      selected: [],        // {id, p,n,m,w,gs}
      gsActive: {},        // id -> number
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

    const modal = $("#modal");
    const modalTitle = $("#modalTitle");
    const modalBody = $("#modalBody");
    const modalClose = $("#modalClose");

    function formatNow(){
      const d = new Date();
      const pad = (n)=> String(n).padStart(2,"0");
      return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
        style="width:100%; height:62vh; border:none; border-radius:12px"></iframe>
    `);

    $("#btnRechte").onclick = ()=> openModal("RECHTE", `
      <div style="font-size:14px; line-height:1.45">
        Sie haben das Recht zu schweigen, alles was Sie sagen kann und wird gegen Sie verwendet werden.
        Ab 3 Wanteds haben Sie das Recht auf einen staatlich anerkannten Anwalt, den Sie selbst benennen müssen.
        Wenn kein Anwalt verfügbar ist, wird Ihnen keiner gestellt. Die Judikative übernimmt der Exekutivbeamte.
        Wenn ein Anwalt hinzugezogen wird, kann es länger als 25 Minuten dauern. Haben Sie ihre Rechte verstanden?
      </div>
    `);

    $("#btnBelehr").onclick = ()=> openModal("BELEHRUNGEN", `
      <div style="font-size:14px; line-height:1.45">
        <b style="color:var(--gold)">Belehrung Haftbefehl</b><br/>
        "Die Justiz hat einen Haftbefehl gegen Sie erlassen, Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird gegen Sie verwendet werden. Sie haben das Recht gegen den Haftbefehl vor Gericht zu ziehen, falls Sie dies möchten, müssen Sie innerhalb von 48 Stunden eine Klage über einen Rechtsanwalt bei der Regierung gegen den Haftbefehl einreichen. Sollte dies nicht in der genannten Frist geschehen oder sollten Sie einen Gerichtsprozess ablehnen, wird der Haftbefehl von den ausgewählten Beamten vollstreckt. Im weiteren Verlauf erhalten Sie eine staatliche Berufssperre von X Tagen nach §19 (4) Beamten Dienst Gesetzbuch. Während dieser Zeit dürfen Sie keinem Staatsdienst nachgehen. Wenn Sie flüchten haben Sie kein Recht mehr auf einen Rechtsanwalt.” 
        <hr/>
        <b style="color:var(--gold)">Belehrung Beschluss</b><br/>
        "Die Justiz hat einen Beschluss gegen Sie erlassen, Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird gegen Sie verwendet werden. Sie haben das Recht gegen den Beschluss vor Gericht zu ziehen, falls Sie dies möchten, müssen Sie innerhalb von 48 Stunden eine Klage über einen Rechtsanwalt bei der Regierung gegen den Beschluss einreichen. Sollte dies nicht in der genannten Frist geschehen oder sollten Sie einen Gerichtsprozess ablehnen, wird der Beschluss von den ausgewählten Beamten vollstreckt. Wenn Sie flüchten haben Sie kein Recht mehr auf einen Rechtsanwalt."
        <hr/>
        <b style="color:var(--gold)">Belehrung Befragung</b><br/>
        „Sie haben das Recht zu schweigen. Alles, was Sie sagen, kann und wird vor Gericht gegen Sie verwendet werden. Sie haben das Recht, zu jeder Vernehmung einen Rechtsanwalt hinzuzuziehen. Haben Sie das verstanden?“
      </div>
    `);

    function toggleBtn(btn, on){
      btn.textContent = on ? "AN" : "AUS";
      btn.style.borderColor = on ? "rgba(255,46,126,.65)" : "#2a2f38";
      btn.style.background = on ? "rgba(255,46,126,.10)" : "#0a0c10";
    }

    function getItemWanted(itemId){
      const item = state.selected.find(x=>x.id===itemId);
      if(!item) return 0;
      const extra = state.gsActive[itemId] || 0;
      return (item.w || 0) + extra;
    }

    function update(){
      // höchste Strafe (max money)
      let maxM = 0;
      // Wanteds: NUR höchster, nicht summieren
      let maxW = 0;

      for (const l of state.selected){
        if ((l.m || 0) > maxM) maxM = l.m || 0;
        const w = getItemWanted(l.id);
        if (w > maxW) maxW = w;
      }

      // Reue: -2, min 1 (nur wenn überhaupt Wanteds >0)
      if (state.reue && maxW > 0) maxW = Math.max(1, maxW - 2);

      outM.textContent = "$" + Number(maxM).toLocaleString();
      outW.textContent = String(maxW);

      if(!state.rights && (state.selected.length || state.grundActive)){
        entry.textContent = "⚠️ RECHTE VERGESSEN!";
        entry.style.color = "#ff6b6b";
        return;
      }

      const parts = [];
      parts.push(formatNow());

      if(state.grundActive && state.grund.trim()) parts.push(`Grund: ${state.grund.trim()}`);
      if(state.selected.length) parts.push(state.selected.map(x=>x.p).join(", "));
      if(state.reue && state.selected.length) parts.push("§35");

      entry.textContent = state.selected.length || state.grundActive ? parts.join(" | ") : "Wähle Strafen...";
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
        head.style.fontSize = "14px";
        head.textContent = cat.cat;

        const table = document.createElement("table");
        table.className = "table";

        const tbody = document.createElement("tbody");

        cat.items.forEach((i, itemIdx)=>{
          const id = `${catIdx}-${itemIdx}`;
          const tr = document.createElement("tr");

          const isSel = state.selected.some(s=>s.id===id);
          tr.style.background = isSel ? "rgba(255,46,126,.08)" : "transparent";
          tr.style.cursor = "pointer";

          tr.onclick = ()=> {
            const idx = state.selected.findIndex(s=>s.id===id);
            if(idx>-1){
              state.selected.splice(idx,1);
              delete state.gsActive[id];
            } else {
              state.selected.push({ id, ...i });
            }
            render();
            update();
          };

          // Stars: base wanteds = filled; gs stars = clickable hollow that turns gold
          const baseW = i.w || 0;
          const gsMax = i.gs || 0;
          const gsOn = state.gsActive[id] || 0;

          let starsHtml = "";
          for(let s=0; s<baseW; s++){
            starsHtml += `<span style="color:var(--gold); font-weight:900">★</span>`;
          }
          for(let s=1; s<=gsMax; s++){
            const on = s <= gsOn;
            starsHtml += `<span class="gsStar" data-gs="${s}" data-id="${id}" style="cursor:pointer; color:${on ? "var(--gold)" : "rgba(255,255,255,.22)"}; font-weight:900; margin-left:2px">☆</span>`;
          }

          tr.innerHTML = `
            <td style="width:120px; color:var(--accent); font-weight:900">${i.p}</td>
            <td style="width:55%">${i.n}</td>
            <td style="width:160px">${starsHtml}</td>
            <td style="width:120px; text-align:right; color:var(--gold); font-weight:900">$${Number(i.m||0).toLocaleString()}</td>
          `;

          tbody.appendChild(tr);

          // attach GS handlers after row is in DOM
          setTimeout(()=>{
            tr.querySelectorAll(".gsStar").forEach(st=>{
              st.onclick = (ev)=>{
                ev.stopPropagation();
                const itemId = st.getAttribute("data-id");
                const val = Number(st.getAttribute("data-gs"));
                state.gsActive[itemId] = state.gsActive[itemId] === val ? val - 1 : val;
                render();
                update();
              };
            });
          }, 0);
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

    // reset
    $("#btnReset").onclick = ()=>{
      state.selected = [];
      state.gsActive = {};
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
      render();
      update();
    };

    render();
    update();
  }
};
