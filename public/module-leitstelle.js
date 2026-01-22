(function () {
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function statusBadge(status) {
    const s = status || "Standby";
    if (s === "AFK") return `<span class="badge b-orange">${esc(s)}</span>`;
    if (s === "Außer Dienst") return `<span class="badge b-red">${esc(s)}</span>`;
    return `<span class="badge b-green">${esc(s)}</span>`;
  }

  // LocalStorage als Quelle (kein Live Sync nötig, kann später WS werden)
  const KEY = "LST_UNITS_V1";

  function loadUnits(){
    try{
      const raw = localStorage.getItem(KEY);
      if(raw) return JSON.parse(raw);
    }catch{}
    return [
      { id:"ALPHA 01", officer:"", callSign:"", status:"Standby", note:"" },
      { id:"ALPHA 02", officer:"", callSign:"", status:"Standby", note:"" },
      { id:"BRAVO 01", officer:"", callSign:"", status:"Standby", note:"" },
      { id:"CHARLIE 01", officer:"", callSign:"", status:"Standby", note:"" },
      { id:"CHARLIE 02", officer:"", callSign:"", status:"Standby", note:"" },
      { id:"DELTA 01", officer:"", callSign:"", status:"Standby", note:"" },
      { id:"ECHO 01", officer:"", callSign:"", status:"Standby", note:"" },
      { id:"ECHO 02", officer:"", callSign:"", status:"Standby", note:"" },
      { id:"FOXTROT 01", officer:"", callSign:"", status:"Standby", note:"" }
    ];
  }

  function saveUnits(units){
    localStorage.setItem(KEY, JSON.stringify(units));
  }

  window.Leitstelle = {
    mount(root) {
      let units = loadUnits();

      function counts() {
        let inDienst = 0, streife = 0, ausser = 0, afk = 0;
        for (const u of units) {
          if (u.status === "AFK") afk++;
          else if (u.status === "Außer Dienst") ausser++;
          else { inDienst++; if (u.status === "Streife") streife++; }
        }
        return { inDienst, streife, ausser, afk };
      }

      function render() {
        const c = counts();

        root.innerHTML = `
          <div class="panel">
            <div class="row" style="align-items:flex-start; justify-content:space-between;">
              <div>
                <div class="title">🚨 Leitstelle</div>
                <div class="small">Streifen eintragen & Status wechseln</div>
              </div>
              <button class="btnMini" id="btnReset">Reset</button>
            </div>

            <div class="row" style="margin-top:12px">
              <div class="col">
                <div class="small">Übersicht</div>
                <div class="row" style="margin-top:10px">
                  <div class="col">
                    <div class="small">Eingeteilt</div>
                    <div style="font-size:30px; font-weight:900; margin-top:6px">${c.inDienst}</div>
                  </div>
                  <div class="col">
                    <div class="small">Aktive Streifen</div>
                    <div style="font-size:30px; font-weight:900; margin-top:6px">${c.streife}</div>
                  </div>
                  <div class="col">
                    <div class="small">AFK</div>
                    <div style="font-size:30px; font-weight:900; margin-top:6px">${c.afk}</div>
                  </div>
                </div>
              </div>

              <div class="col">
                <div class="small">Legende</div>
                <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap">
                  <span class="badge b-green">Im Dienst / Standby</span>
                  <span class="badge b-orange">AFK</span>
                  <span class="badge b-red">Außer Dienst</span>
                </div>
              </div>
            </div>

            <hr/>

            <div class="small">Streifen</div>
            <div id="grid" style="margin-top:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:14px"></div>
          </div>
        `;

        const grid = root.querySelector("#grid");
        grid.innerHTML = units.map(u => `
          <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:16px; padding:14px">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
              <div style="font-weight:900; font-size:16px">${esc(u.id)}</div>
              <div>${statusBadge(u.status)}</div>
            </div>

            <div class="row" style="margin-top:12px">
              <div class="col">
                <div class="small">Officer</div>
                <input data-off="${esc(u.id)}" value="${esc(u.officer)}" placeholder="Name"/>
              </div>
              <div class="col">
                <div class="small">Callsign</div>
                <input data-call="${esc(u.id)}" value="${esc(u.callSign)}" placeholder="z.B. 28-05-050"/>
              </div>
            </div>

            <div class="row" style="margin-top:12px">
              <div class="col">
                <div class="small">Notiz</div>
                <input data-note="${esc(u.id)}" value="${esc(u.note)}" placeholder="Einsatz / Verkehr / ..."/>
              </div>
            </div>

            <div class="row" style="margin-top:12px; gap:10px">
              <button class="btnMini" data-st="${esc(u.id)}" data-val="Standby">Standby</button>
              <button class="btnMini" data-st="${esc(u.id)}" data-val="Streife">Streife</button>
              <button class="btnMini" data-st="${esc(u.id)}" data-val="AFK">AFK</button>
              <button class="btnMini" data-st="${esc(u.id)}" data-val="Außer Dienst">Außer Dienst</button>
            </div>

            <div class="row" style="margin-top:12px">
              <button class="btnMini" data-clear="${esc(u.id)}">Leeren</button>
            </div>
          </div>
        `).join("");

        // Inputs
        root.querySelectorAll("input[data-off]").forEach(inp => {
          inp.oninput = () => {
            const id = inp.getAttribute("data-off");
            const unit = units.find(x => x.id === id);
            if (!unit) return;
            unit.officer = inp.value;
            saveUnits(units);
          };
        });

        root.querySelectorAll("input[data-call]").forEach(inp => {
          inp.oninput = () => {
            const id = inp.getAttribute("data-call");
            const unit = units.find(x => x.id === id);
            if (!unit) return;
            unit.callSign = inp.value;
            saveUnits(units);
          };
        });

        root.querySelectorAll("input[data-note]").forEach(inp => {
          inp.oninput = () => {
            const id = inp.getAttribute("data-note");
            const unit = units.find(x => x.id === id);
            if (!unit) return;
            unit.note = inp.value;
            saveUnits(units);
          };
        });

        root.querySelectorAll("button[data-st]").forEach(btn => {
          btn.onclick = () => {
            const id = btn.getAttribute("data-st");
            const st = btn.getAttribute("data-val");
            const unit = units.find(x => x.id === id);
            if (!unit) return;
            unit.status = st;
            saveUnits(units);
            render();
          };
        });

        root.querySelectorAll("button[data-clear]").forEach(btn => {
          btn.onclick = () => {
            const id = btn.getAttribute("data-clear");
            const unit = units.find(x => x.id === id);
            if (!unit) return;
            unit.officer = ""; unit.callSign = ""; unit.note = ""; unit.status = "Standby";
            saveUnits(units);
            render();
          };
        });

        root.querySelector("#btnReset").onclick = () => {
          localStorage.removeItem(KEY);
          units = loadUnits();
          render();
        };
      }

      render();
    }
  };
})();
