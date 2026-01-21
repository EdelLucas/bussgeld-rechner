// public/module-leitstelle.js
(function () {
  const LS_KEY = "LST_STATE_V2";

  const DEFAULT_STATE = {
    dispatcher: { name: "", badge: "" },
    units: [
      { id: "ALPHA 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "ALPHA 02", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "BRAVO 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "CHARLIE 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "CHARLIE 02", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "DELTA 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "ECHO 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "ECHO 02", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "FOXTROT 01", officer: "", callSign: "", status: "Standby", note: "" },
    ]
  };

  function deepClone(x){ return JSON.parse(JSON.stringify(x)); }

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return { ...deepClone(DEFAULT_STATE), ...JSON.parse(raw) };
    } catch {}
    return deepClone(DEFAULT_STATE);
  }

  function saveState(st) {
    localStorage.setItem(LS_KEY, JSON.stringify(st));
  }

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

  function isInDienst(s){ return s === "Standby" || s === "Streife"; }

  window.Leitstelle = {
    mount(root) {
      if (!root) return;

      let st = loadState();

      function counts() {
        let inDienst = 0, streife = 0, ausser = 0, afk = 0;
        for (const u of st.units) {
          if (u.status === "AFK") afk++;
          else if (u.status === "Außer Dienst") ausser++;
          else {
            inDienst++;
            if (u.status === "Streife") streife++;
          }
        }
        return { inDienst, streife, ausser, afk };
      }

      function render() {
        const c = counts();

        const inDienstList = st.units.filter(u => isInDienst(u.status) && (u.officer || u.callSign));
        const ausserList = st.units.filter(u => u.status === "Außer Dienst" && (u.officer || u.callSign));
        const afkList = st.units.filter(u => u.status === "AFK" && (u.officer || u.callSign));

        root.innerHTML = `
          <div class="panel">
            <div class="row" style="align-items:flex-start; justify-content:space-between; gap:12px;">
              <div>
                <div class="title">🚨 Leitstelle</div>
                <div class="small">Streifen eintragen + Status ändern (speichert aktuell lokal)</div>
              </div>

              <div style="display:flex; gap:10px; align-items:center;">
                <button class="btnMini" id="btnResetLST">Reset</button>
              </div>
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
                    <div class="small">Eingeteilt</div>
                    <div style="font-size:26px; font-weight:900; margin-top:6px">${c.inDienst}</div>
                  </div>
                  <div class="col">
                    <div class="small">Aktive Streifen</div>
                    <div style="font-size:26px; font-weight:900; margin-top:6px">${c.streife}</div>
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
              <div class="col">
                <div class="small">Verantwortlicher für die Leitstelle</div>
                <div class="row" style="margin-top:10px; gap:10px">
                  <div class="col">
                    <input id="dispName" placeholder="Name" value="${esc(st.dispatcher.name)}"/>
                  </div>
                  <div class="col">
                    <input id="dispBadge" placeholder="Dienstnummer" value="${esc(st.dispatcher.badge)}"/>
                  </div>
                </div>
              </div>

              <div class="col">
                <div class="small">Live-Listen</div>
                <div class="row" style="margin-top:10px; gap:10px">
                  <div class="col">
                    <div class="small">Im Dienst</div>
                    <div id="listIn" style="margin-top:8px"></div>
                  </div>
                  <div class="col">
                    <div class="small">Außer Dienst</div>
                    <div id="listOut" style="margin-top:8px"></div>
                  </div>
                  <div class="col">
                    <div class="small">AFK</div>
                    <div id="listAfk" style="margin-top:8px"></div>
                  </div>
                </div>
              </div>
            </div>

            <hr/>

            <div class="small">Streifen (Eintragen / Status)</div>
            <div id="unitGrid" style="
              margin-top:10px;
              display:grid;
              grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
              gap:12px;
            "></div>

            <hr/>

            <div class="small">Funkcodes (Kurz)</div>
            <table class="table" style="margin-top:10px">
              <tr><th>Code</th><th>Bedeutung</th></tr>
              <tr><td>10-01</td><td>Dienstantritt</td></tr>
              <tr><td>10-02</td><td>Dienstende</td></tr>
              <tr><td>10-04</td><td>Verstanden</td></tr>
              <tr><td>10-20</td><td>Standortabfrage</td></tr>
              <tr><td>10-30</td><td>Statusabfrage</td></tr>
              <tr><td>10-50</td><td>Verstärkung benötigt</td></tr>
              <tr><td>10-60</td><td>Nicht verfügbar</td></tr>
              <tr><td>10-70</td><td>Im Dienst / Einteilung benötigt</td></tr>
            </table>
          </div>
        `;

        // render lists
        const cardMini = (u) => `
          <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:12px; padding:8px; margin-bottom:8px">
            <div style="font-weight:900; font-size:12px">${esc(u.id)}</div>
            <div class="small">${esc(u.officer || "-")} ${u.callSign ? " • " + esc(u.callSign) : ""}</div>
          </div>
        `;

        root.querySelector("#listIn").innerHTML = inDienstList.length ? inDienstList.map(cardMini).join("") : `<div class="small">-</div>`;
        root.querySelector("#listOut").innerHTML = ausserList.length ? ausserList.map(cardMini).join("") : `<div class="small">-</div>`;
        root.querySelector("#listAfk").innerHTML = afkList.length ? afkList.map(cardMini).join("") : `<div class="small">-</div>`;

        // unit grid
        const grid = root.querySelector("#unitGrid");
        grid.innerHTML = st.units.map(u => `
          <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:14px; padding:12px">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
              <div style="font-weight:900">${esc(u.id)}</div>
              <div>${statusBadge(u.status)}</div>
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

            <div class="row" style="margin-top:10px; gap:10px">
              <div class="col">
                <div class="small">Notiz</div>
                <input data-note="${esc(u.id)}" value="${esc(u.note)}" placeholder="z.B. Verkehr / Einsatz / ..."/>
              </div>
            </div>

            <div class="row" style="margin-top:10px; gap:8px">
              <button class="btnMini" data-st="${esc(u.id)}" data-val="Standby">Standby</button>
              <button class="btnMini" data-st="${esc(u.id)}" data-val="Streife">Streife</button>
              <button class="btnMini" data-st="${esc(u.id)}" data-val="AFK">AFK</button>
              <button class="btnMini" data-st="${esc(u.id)}" data-val="Außer Dienst">Außer Dienst</button>
            </div>

            <div class="row" style="margin-top:10px">
              <button class="btnMini" data-clear="${esc(u.id)}">Leeren</button>
            </div>
          </div>
        `).join("");

        // handlers
        const updateDispatcher = () => {
          st.dispatcher.name = root.querySelector("#dispName").value;
          st.dispatcher.badge = root.querySelector("#dispBadge").value;
          saveState(st);
        };
        root.querySelector("#dispName").addEventListener("input", updateDispatcher);
        root.querySelector("#dispBadge").addEventListener("input", updateDispatcher);

        root.querySelectorAll("input[data-officer]").forEach(inp => {
          inp.addEventListener("input", () => {
            const id = inp.getAttribute("data-officer");
            const u = st.units.find(x => x.id === id);
            if (!u) return;
            u.officer = inp.value;
            saveState(st);
            // Listen aktualisieren ohne full re-render wäre möglich, aber so bleibt’s robust:
            render();
          });
        });

        root.querySelectorAll("input[data-call]").forEach(inp => {
          inp.addEventListener("input", () => {
            const id = inp.getAttribute("data-call");
            const u = st.units.find(x => x.id === id);
            if (!u) return;
            u.callSign = inp.value;
            saveState(st);
            render();
          });
        });

        root.querySelectorAll("input[data-note]").forEach(inp => {
          inp.addEventListener("input", () => {
            const id = inp.getAttribute("data-note");
            const u = st.units.find(x => x.id === id);
            if (!u) return;
            u.note = inp.value;
            saveState(st);
          });
        });

        root.querySelectorAll("button[data-st]").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-st");
            const val = btn.getAttribute("data-val");
            const u = st.units.find(x => x.id === id);
            if (!u) return;
            u.status = val;
            saveState(st);
            render();
          });
        });

        root.querySelectorAll("button[data-clear]").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-clear");
            const u = st.units.find(x => x.id === id);
            if (!u) return;
            u.officer = "";
            u.callSign = "";
            u.note = "";
            u.status = "Standby";
            saveState(st);
            render();
          });
        });

        root.querySelector("#btnResetLST").onclick = () => {
          localStorage.removeItem(LS_KEY);
          st = loadState();
          render();
        };
      }

      render();
    }
  };
})();
