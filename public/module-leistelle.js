// public/module-leitstelle.js
(function () {
  const LS_KEY = "LST_UNITS_V1";

  function loadUnits() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    // Default Slots
    return [
      { id: "ALPHA 01", officer: "", callSign: "28-05-050", status: "Standby" },
      { id: "ALPHA 02", officer: "", callSign: "", status: "Standby" },
      { id: "BRAVO 01", officer: "", callSign: "", status: "Standby" },
      { id: "CHARLIE 01", officer: "", callSign: "", status: "Standby" },
      { id: "CHARLIE 02", officer: "", callSign: "", status: "Standby" },
      { id: "DELTA 01", officer: "", callSign: "", status: "Standby" },
      { id: "ECHO 01", officer: "", callSign: "", status: "Standby" },
      { id: "ECHO 02", officer: "", callSign: "", status: "Standby" },
      { id: "FOXTROT 01", officer: "", callSign: "", status: "Standby" },
    ];
  }

  function saveUnits(units) {
    localStorage.setItem(LS_KEY, JSON.stringify(units));
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function badge(status) {
    const s = status || "Standby";
    // grün: im dienst (Streife/Standby), orange: AFK, rot: Außer Dienst
    if (s === "AFK") return `<span class="badge b-orange">${esc(s)}</span>`;
    if (s === "Außer Dienst") return `<span class="badge b-red">${esc(s)}</span>`;
    return `<span class="badge b-green">${esc(s)}</span>`;
  }

  window.Leitstelle = {
    mount(root) {
      if (!root) return;

      let units = loadUnits();

      function counts() {
        let inDienst = 0, ausser = 0, afk = 0;
        for (const u of units) {
          if (u.status === "AFK") afk++;
          else if (u.status === "Außer Dienst") ausser++;
          else inDienst++;
        }
        return { inDienst, ausser, afk };
      }

      function render() {
        const c = counts();

        root.innerHTML = `
          <div class="panel">
            <div class="row" style="align-items:center; justify-content:space-between;">
              <div>
                <div class="title">🚨 Leitstelle</div>
                <div class="small">Eintragen + Status wechseln (speichert lokal im Browser)</div>
              </div>
              <button class="btnMini" id="btnResetUnits">Reset</button>
            </div>

            <div class="row" style="margin-top:12px">
              <div class="col">
                <div class="small">Legende</div>
                <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap">
                  <span class="badge b-green">Grün: Im Dienst / Standby</span>
                  <span class="badge b-red">Rot: Außer Dienst</span>
                  <span class="badge b-orange">Orange: AFK</span>
                </div>
              </div>
              <div class="col">
                <div class="row">
                  <div class="col">
                    <div class="small">Im Dienst</div>
                    <div style="font-size:26px; font-weight:900; margin-top:6px">${c.inDienst}</div>
                  </div>
                  <div class="col">
                    <div class="small">Außer Dienst</div>
                    <div style="font-size:26px; font-weight:900; margin-top:6px">${c.ausser}</div>
                  </div>
                  <div class="col">
                    <div class="small">AFK</div>
                    <div style="font-size:26px; font-weight:900; margin-top:6px">${c.afk}</div>
                  </div>
                </div>
              </div>
            </div>

            <hr/>

            <div class="row">
              <div class="col" style="min-width:520px">
                <div class="small">Streifenübersicht</div>
                <div id="unitGrid" style="
                  margin-top:10px;
                  display:grid;
                  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                  gap:12px;
                "></div>
              </div>

              <div class="col">
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
            </div>
          </div>
        `;

        const grid = root.querySelector("#unitGrid");

        grid.innerHTML = units.map(u => `
          <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:14px; padding:12px">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
              <div style="font-weight:900">${esc(u.id)}</div>
              <div>${badge(u.status)}</div>
            </div>

            <div class="row" style="margin-top:10px; gap:10px">
              <div class="col">
                <div class="small">Officer</div>
                <input data-officer="${esc(u.id)}" value="${esc(u.officer)}" placeholder="Name"/>
              </div>
              <div class="col">
                <div class="small">Callsign</div>
                <input data-call="${esc(u.id)}" value="${esc(u.callSign)}" placeholder="z.B. 28-05-050"/>
              </div>
            </div>

            <div class="row" style="margin-top:10px; align-items:center">
              <div class="col small">Status</div>
              <div class="col" style="text-align:right">
                <select data-status="${esc(u.id)}" style="width:100%; padding:10px; border-radius:12px; border:1px solid #2a2f38; background:#0a0c10; color:#fff; outline:none">
                  ${["Standby","Streife","AFK","Außer Dienst"].map(s => `
                    <option ${u.status===s ? "selected":""}>${s}</option>
                  `).join("")}
                </select>
              </div>
            </div>

            <div class="row" style="margin-top:10px">
              <button class="btnMini" data-clear="${esc(u.id)}">Leeren</button>
            </div>
          </div>
        `).join("");

        // events
        root.querySelectorAll("input[data-officer]").forEach(inp => {
          inp.addEventListener("input", () => {
            const id = inp.getAttribute("data-officer");
            const u = units.find(x => x.id === id);
            if (!u) return;
            u.officer = inp.value;
            saveUnits(units);
          });
        });
        root.querySelectorAll("input[data-call]").forEach(inp => {
          inp.addEventListener("input", () => {
            const id = inp.getAttribute("data-call");
            const u = units.find(x => x.id === id);
            if (!u) return;
            u.callSign = inp.value;
            saveUnits(units);
          });
        });
        root.querySelectorAll("select[data-status]").forEach(sel => {
          sel.addEventListener("change", () => {
            const id = sel.getAttribute("data-status");
            const u = units.find(x => x.id === id);
            if (!u) return;
            u.status = sel.value;
            saveUnits(units);
            render(); // refresh counts + badges
          });
        });
        root.querySelectorAll("[data-clear]").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-clear");
            const u = units.find(x => x.id === id);
            if (!u) return;
            u.officer = "";
            u.callSign = "";
            u.status = "Standby";
            saveUnits(units);
            render();
          });
        });

        root.querySelector("#btnResetUnits").onclick = () => {
          localStorage.removeItem(LS_KEY);
          units = loadUnits();
          render();
        };
      }

      render();
    }
  };
})();
