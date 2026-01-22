window.Leitstelle = {
  mount(root, ctx){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🚨 Leitstelle</div>

        <div class="row">
          <div class="col">
            <div class="small">Streife eintragen</div>
            <div class="row" style="margin-top:10px">
              <div class="col">
                <label class="lbl">Callsign</label>
                <input id="inCall" placeholder="z.B. ALPHA 01"/>
              </div>
              <div class="col">
                <label class="lbl">Besatzung</label>
                <input id="inMembers" placeholder="z.B. Max / Tim"/>
              </div>
              <div class="col">
                <label class="lbl">Status</label>
                <select id="inStatus">
                  <option value="Streife">Streife</option>
                  <option value="Standby">Standby</option>
                  <option value="AFK">AFK</option>
                  <option value="Außer Dienst">Außer Dienst</option>
                </select>
              </div>
            </div>

            <div class="row" style="margin-top:12px">
              <button id="btnAdd" class="btnMini">Eintragen / Aktualisieren</button>
              <button id="btnClear" class="btnMini danger">Felder leeren</button>
            </div>

            <div class="small" style="margin-top:12px">
              Live: Änderungen werden an alle in deiner Orga synchronisiert.
            </div>
          </div>

          <div class="col">
            <div class="small">Aktive Streifen</div>
            <div id="unitList" style="margin-top:10px"></div>
          </div>
        </div>
      </div>
    `;

    const ws = ctx.getWS();
    let state = { units: [], incidents: [] };

    const $ = (sel) => root.querySelector(sel);
    const list = $("#unitList");

    function badgeFor(status){
      if(status === "Streife" || status === "Standby") return `<span class="badge b-green">${status}</span>`;
      if(status === "AFK") return `<span class="badge b-orange">${status}</span>`;
      return `<span class="badge b-red">${status}</span>`;
    }

    function render(){
      if(!state.units.length){
        list.innerHTML = `<div class="small">Keine Einträge.</div>`;
        return;
      }

      list.innerHTML = state.units
        .slice()
        .sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0))
        .map(u => `
          <div class="cardListItem">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <div style="font-weight:900; font-size:15px">${escapeHtml(u.callsign)}</div>
              <div>${badgeFor(u.status)}</div>
            </div>
            <div class="small" style="margin-top:6px">${escapeHtml(u.members || "")}</div>

            <div class="row" style="margin-top:10px">
              <button class="btnMini" data-set="${u.id}" data-status="Streife">Streife</button>
              <button class="btnMini" data-set="${u.id}" data-status="Standby">Standby</button>
              <button class="btnMini" data-set="${u.id}" data-status="AFK">AFK</button>
              <button class="btnMini danger" data-del="${u.id}">Entfernen</button>
            </div>
          </div>
        `).join("");

      list.querySelectorAll("[data-set]").forEach(btn=>{
        btn.onclick = ()=> {
          const id = btn.getAttribute("data-set");
          const status = btn.getAttribute("data-status");
          const u = state.units.find(x=>x.id===id);
          if(!u) return;
          u.status = status;
          u.updatedAt = Date.now();
          pushState();
        };
      });

      list.querySelectorAll("[data-del]").forEach(btn=>{
        btn.onclick = ()=> {
          const id = btn.getAttribute("data-del");
          state.units = state.units.filter(x=>x.id!==id);
          pushState();
        };
      });
    }

    function pushState(){
      // ws bevorzugt, fallback api
      if(ws && ws.readyState === 1){
        ws.send(JSON.stringify({ type:"dispatch:set", state }));
      }else{
        ctx.api("/api/dispatch/set", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ state })
        }).catch(()=>{});
      }
      render();
    }

    $("#btnAdd").onclick = () => {
      const callsign = $("#inCall").value.trim();
      const members = $("#inMembers").value.trim();
      const status = $("#inStatus").value;

      if(!callsign) return;

      // Eintrag pro Callsign unique
      const existing = state.units.find(u => u.callsign.toLowerCase() === callsign.toLowerCase());
      if(existing){
        existing.members = members;
        existing.status = status;
        existing.updatedAt = Date.now();
      } else {
        state.units.push({
          id: "u_" + Math.random().toString(16).slice(2),
          callsign,
          members,
          status,
          updatedAt: Date.now()
        });
      }
      pushState();
    };

    $("#btnClear").onclick = () => {
      $("#inCall").value = "";
      $("#inMembers").value = "";
      $("#inStatus").value = "Streife";
    };

    function escapeHtml(s){
      return String(s||"")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
    }

    // initial load via ws init or api
    ws?.addEventListener("message", (e)=>{
      let m; try{ m = JSON.parse(e.data);}catch{return;}
      if(m.type === "dispatch:init" && m.state){
        state = m.state; render();
      }
      if(m.type === "dispatch:update" && m.state){
        state = m.state; render();
      }
    });

    ctx.api("/api/dispatch").then(({data})=>{
      if(data?.ok && data.state){
        state = data.state;
        render();
      }
    });

    render();
  }
};
