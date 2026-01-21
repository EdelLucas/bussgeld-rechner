window.Leitstelle = {
  mount(root){
    const KEY = "LST_UNITS";
    const load = () => {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch { return []; }
    };
    const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));

    const STATUS = ["Streife", "Standby", "AFK", "Außer Dienst"];
    const statusBadge = (s)=>{
      if(s === "Streife" || s === "Standby") return "b-green";
      if(s === "AFK") return "b-orange";
      return "b-red";
    };

    let units = load();

    const counts = () => {
      const inDienst = units.filter(u => u.status === "Streife" || u.status === "Standby").length;
      const streifen = units.filter(u => u.status === "Streife").length;
      const abwesend = units.filter(u => u.status === "AFK" || u.status === "Außer Dienst").length;
      return { inDienst, streifen, abwesend };
    };

    function render(){
      const c = counts();

      root.innerHTML = `
        <div class="panel">
          <div class="title">🚨 Leitstelle</div>

          <div class="row" style="margin-bottom:12px">
            <div class="kpi">
              <div class="k">Eingeteilte Agents</div>
              <div class="v">${c.inDienst}</div>
            </div>
            <div class="kpi">
              <div class="k">Aktive Streifen</div>
              <div class="v">${c.streifen}</div>
            </div>
            <div class="kpi">
              <div class="k">Abwesend / Außer Dienst</div>
              <div class="v">${c.abwesend}</div>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div class="small">Streife eintragen</div>
              <input id="uCallsign" placeholder="Callsign (z. B. ALPHA 01)"/>
              <input id="uOfficer" placeholder="Beamter / Rufname"/>
              <button class="btnMini" id="uAdd" style="margin-top:10px">Eintragen</button>

              <hr/>

              <div class="small">Funkcodes (Kurz)</div>
              <table class="table" style="margin-top:10px">
                <tr><th>Code</th><th>Bedeutung</th></tr>
                <tr><td>10-01</td><td>Dienstantritt</td></tr>
                <tr><td>10-02</td><td>Dienstende</td></tr>
                <tr><td>10-20</td><td>Standortabfrage</td></tr>
                <tr><td>10-30</td><td>Statusabfrage</td></tr>
                <tr><td>10-50</td><td>Verstärkung benötigt</td></tr>
              </table>
            </div>

            <div class="col">
              <div class="small">Einheiten</div>
              <div id="uList" style="margin-top:10px"></div>
            </div>
          </div>
        </div>
      `;

      // Add
      root.querySelector("#uAdd").onclick = () => {
        const callsign = root.querySelector("#uCallsign").value.trim();
        const officer = root.querySelector("#uOfficer").value.trim();
        if(!callsign) return;

        units.unshift({
          id: crypto.randomUUID(),
          callsign,
          officer,
          status: "Standby",
          ts: Date.now()
        });

        save(units);
        render();
      };

      // List
      const list = root.querySelector("#uList");
      if(!units.length){
        list.innerHTML = `<div class="small">Keine Einheiten eingetragen.</div>`;
        return;
      }

      list.innerHTML = units.map(u => `
        <div style="
          display:flex; align-items:center; justify-content:space-between;
          padding:10px; border:1px solid #1f2430; border-radius:12px;
          background:#0a0c10; margin-bottom:8px;
        ">
          <div style="min-width:220px">
            <div style="font-weight:900">${u.callsign}</div>
            <div class="small">${u.officer || ""}</div>
          </div>

          <div style="display:flex; gap:8px; align-items:center">
            <span class="badge ${statusBadge(u.status)}">${u.status}</span>

            <select data-status="${u.id}" style="
              padding:8px 10px; border-radius:10px;
              border:1px solid #2a2f38; background:#0a0c10; color:#fff; font-weight:900;
            ">
              ${STATUS.map(s => `<option ${s===u.status ? "selected":""}>${s}</option>`).join("")}
            </select>

            <button class="btnMini" data-del="${u.id}">✖</button>
          </div>
        </div>
      `).join("");

      // Change status
      list.querySelectorAll("select[data-status]").forEach(sel => {
        sel.onchange = () => {
          const id = sel.getAttribute("data-status");
          const u = units.find(x => x.id === id);
          if(!u) return;
          u.status = sel.value;
          save(units);
          render();
        };
      });

      // Delete
      list.querySelectorAll("[data-del]").forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute("data-del");
          units = units.filter(x => x.id !== id);
          save(units);
          render();
        };
      });
    }

    render();
  }
};
