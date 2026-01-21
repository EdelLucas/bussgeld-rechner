// public/module-leitstelle.js
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

  function isInDienst(s) { return s === "Standby" || s === "Streife"; }

  function wsUrl() {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${location.host}/ws`;
  }

  window.Leitstelle = {
    mount(root) {
      if (!root) return;

      let st = {
        dispatcher: { name: "", badge: "" },
        units: []
      };

      let socket = null;
      let live = { ok: false, text: "Verbinde..." };

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

      function send(msg) {
        try {
          if (socket && socket.readyState === 1) socket.send(JSON.stringify(msg));
        } catch { /* ignore */ }
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
                <div class="small">Streifen eintragen + Status ändern (LIVE Sync)</div>
              </div>

              <div style="display:flex; gap:10px; align-items:center;">
                <span class="badge" style="border-color:${live.ok ? "rgba(50,255,90,.35)" : "rgba(255,70,70,.35)"}; background:${live.ok ? "rgba(50,255,90,.08)" : "rgba(255,70,70,.08)"}">
                  Live: ${esc(live.text)}
                </span>
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

        // lists
        const cardMini = (u) => `
          <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:12px; padding:8px; margin-bottom:8px">
            <div style="font-weight:900; font-size:12px">${esc(u.id)}</div>
            <div class="small">${esc(u.officer || "-")} ${u.callSign ? " • " + esc(u.callSign) : ""}</div>
          </div>
        `;

        root.querySelector("#listIn").innerHTML = inDienstList.length ? inDienstList.map(cardMini).join("") : `<div class="small">-</div>`;
        root.querySelector("#listOut").innerHTML = ausserList.length ? ausserList.map(cardMini).join("") : `<div class="small">-</div>`;
        root.querySelector("#listAfk").innerHTML = afkList.length ? afkList.map(cardMini).join("") : `<div class="small">-</div>`;

        // grid
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

        // dispatcher events
        const dispName = root.querySelector("#dispName");
        const dispBadge = root.querySelector("#dispBadge");
        const onDisp = () => send({ type: "set_dispatcher", name: dispName.value, badge: dispBadge.value });
        dispName.addEventListener("input", onDisp);
        dispBadge.addEventListener("input", onDisp);

        // unit input events
        root.querySelectorAll("input[data-officer]").forEach(inp => {
          inp.addEventListener("input", () => {
            const id = inp.getAttribute("data-officer");
            send({ type: "update_unit", id, officer: inp.value });
          });
        });

        root.querySelectorAll("input[data-call]").forEach(inp => {
          inp.addEventListener("input", () => {
            const id = inp.getAttribute("data-call");
            send({ type: "update_unit", id, callSign: inp.value });
          });
        });

        root.querySelectorAll("input[data-note]").forEach(inp => {
          inp.addEventListener("input", () => {
            const id = inp.getAttribute("data-note");
            send({ type: "update_unit", id, note: inp.value });
          });
        });

        root.querySelectorAll("button[data-st]").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-st");
            const status = btn.getAttribute("data-val");
            send({ type: "update_unit", id, status });
          });
        });

        root.querySelectorAll("button[data-clear]").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-clear");
            send({ type: "clear_unit", id });
          });
        });

        root.querySelector("#btnResetLST").onclick = () => {
          send({ type: "reset_leitstelle" });
        };
      }

      // WS connect
      function connect() {
        live = { ok: false, text: "Verbinde..." };
        render();

        try {
          socket = new WebSocket(wsUrl());
        } catch {
          live = { ok: false, text: "WS Fehler" };
          render();
          return;
        }

        socket.addEventListener("open", () => {
          live = { ok: true, text: "Verbunden" };
          render();
        });

        socket.addEventListener("close", () => {
          live = { ok: false, text: "Getrennt" };
          render();
          // reconnect
          setTimeout(connect, 1500);
        });

        socket.addEventListener("error", () => {
          live = { ok: false, text: "Fehler" };
          render();
          try { socket.close(); } catch {}
        });

        socket.addEventListener("message", (ev) => {
          let msg;
          try { msg = JSON.parse(ev.data); } catch { return; }
          if (msg.type === "state" && msg.leitstelle) {
            st = msg.leitstelle;
            render();
          }
        });
      }

      connect();
    }
  };
})();
