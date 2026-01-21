// public/module-einsaetze.js
(function () {
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function wsUrl() {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const token = encodeURIComponent(window.SESSION_TOKEN || "");
    return `${proto}//${location.host}/ws?token=${token}`;
  }

  function debounce(fn, ms) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  window.Einsaetze = {
    mount(root) {
      if (!root) return;

      let socket = null;
      let live = { ok: false, text: "Verbinde..." };

      let state = { einsaetze: [], funk: [], leitstelle: null };

      function send(msg) {
        try { if (socket && socket.readyState === 1) socket.send(JSON.stringify(msg)); } catch {}
      }
      const sendDebounced = debounce(send, 200);

      function render() {
        const eins = state.einsaetze || [];
        const funk = state.funk || [];
        const units = (state.leitstelle?.units || []).map(u => u.id);

        root.innerHTML = `
          <div class="panel">
            <div class="row" style="align-items:flex-start; justify-content:space-between; gap:12px;">
              <div>
                <div class="title">📟 Einsätze / Funk</div>
                <div class="small">Live-Ansicht – jeder sieht Änderungen sofort</div>
              </div>
              <span class="badge" style="border-color:${live.ok ? "rgba(50,255,90,.35)" : "rgba(255,70,70,.35)"}; background:${live.ok ? "rgba(50,255,90,.08)" : "rgba(255,70,70,.08)"}">
                Live: ${esc(live.text)}
              </span>
            </div>

            <div class="row" style="margin-top:12px">
              <div class="col">
                <div class="small">Neuer Einsatz</div>
                <div class="row" style="margin-top:10px; gap:10px">
                  <div class="col"><input id="eTitle" placeholder="Titel / Meldung"/></div>
                  <div class="col">
                    <input id="ePrio" placeholder="Prio (1-3)" value="2"/>
                  </div>
                </div>
                <div class="row" style="margin-top:10px; gap:10px">
                  <div class="col">
                    <select id="eStatus" class="sel">
                      <option>OFFEN</option>
                      <option>ZUWEISUNG</option>
                      <option>AKTIV</option>
                      <option>ERLEDIGT</option>
                      <option>ABGEBROCHEN</option>
                    </select>
                  </div>
                  <div class="col">
                    <select id="eUnit" class="sel">
                      <option value="">— Einheit —</option>
                      ${units.map(u => `<option value="${esc(u)}">${esc(u)}</option>`).join("")}
                    </select>
                  </div>
                </div>
                <div class="row" style="margin-top:10px">
                  <div class="col"><input id="eNote" placeholder="Notiz (optional)"/></div>
                </div>
                <div class="row" style="margin-top:10px">
                  <button class="btnMini" id="eAdd">Einsatz anlegen</button>
                </div>

                <hr/>

                <div class="small">Einsatzliste</div>
                <div id="eList" style="margin-top:10px"></div>
              </div>

              <div class="col">
                <div class="small">Funk (Live)</div>
                <div style="margin-top:10px; border:1px solid #1f2430; background:#0a0c10; border-radius:14px; overflow:hidden">
                  <div id="funkList" style="height:52vh; overflow:auto; padding:10px"></div>
                  <div style="border-top:1px solid #1f2430; padding:10px">
                    <div class="row" style="gap:10px">
                      <div class="col"><input id="fFrom" placeholder="Von (optional)" value="${esc(window.SESSION_USER || "")}"/></div>
                      <div class="col"><input id="fMsg" placeholder="Funktext..."/></div>
                    </div>
                    <div class="row" style="margin-top:10px">
                      <button class="btnMini" id="fSend">Senden</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        // render einsätze
        const eList = root.querySelector("#eList");
        eList.innerHTML = eins.length ? eins.map(e => `
          <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:14px; padding:12px; margin-bottom:10px">
            <div style="display:flex; justify-content:space-between; gap:10px">
              <div style="font-weight:900">${esc(e.title)} <span style="color:var(--muted); font-weight:700">• P${esc(e.prio)}</span></div>
              <div class="small">${new Date(e.ts).toLocaleString("de-DE")}</div>
            </div>

            <div class="row" style="margin-top:10px; gap:10px">
              <div class="col">
                <div class="small">Status</div>
                <select class="sel" data-estatus="${esc(e.id)}">
                  ${["OFFEN","ZUWEISUNG","AKTIV","ERLEDIGT","ABGEBROCHEN"].map(s =>
                    `<option ${e.status===s?"selected":""}>${s}</option>`
                  ).join("")}
                </select>
              </div>
              <div class="col">
                <div class="small">Einheit</div>
                <select class="sel" data-eunit="${esc(e.id)}">
                  <option value="">—</option>
                  ${units.map(u => `<option value="${esc(u)}" ${e.unit===u?"selected":""}>${esc(u)}</option>`).join("")}
                </select>
              </div>
              <div class="col">
                <div class="small">Notiz</div>
                <input data-enote="${esc(e.id)}" value="${esc(e.note||"")}" placeholder="Notiz..."/>
              </div>
            </div>

            <div class="row" style="margin-top:10px">
              <button class="btnMini" data-edel="${esc(e.id)}">Löschen</button>
            </div>
          </div>
        `).join("") : `<div class="small">Keine Einsätze.</div>`;

        // events
        root.querySelector("#eAdd").onclick = () => {
          const title = root.querySelector("#eTitle").value.trim();
          const prio = root.querySelector("#ePrio").value.trim() || "2";
          const status = root.querySelector("#eStatus").value;
          const unit = root.querySelector("#eUnit").value;
          const note = root.querySelector("#eNote").value.trim();
          if (!title) return;
          send({ type: "add_einsatz", title, prio, status, unit, note });
          root.querySelector("#eTitle").value = "";
          root.querySelector("#eNote").value = "";
        };

        root.querySelectorAll("[data-estatus]").forEach(sel => {
          sel.onchange = () => send({ type: "update_einsatz", id: sel.getAttribute("data-estatus"), status: sel.value });
        });

        root.querySelectorAll("[data-eunit]").forEach(sel => {
          sel.onchange = () => send({ type: "update_einsatz", id: sel.getAttribute("data-eunit"), unit: sel.value });
        });

        root.querySelectorAll("[data-enote]").forEach(inp => {
          inp.oninput = () => sendDebounced({ type: "update_einsatz", id: inp.getAttribute("data-enote"), note: inp.value });
        });

        root.querySelectorAll("[data-edel]").forEach(btn => {
          btn.onclick = () => send({ type: "delete_einsatz", id: btn.getAttribute("data-edel") });
        });

        // funk
        const funkList = root.querySelector("#funkList");
        funkList.innerHTML = funk.slice().reverse().map(f => `
          <div style="margin-bottom:10px">
            <div class="small" style="display:flex; justify-content:space-between">
              <span><b style="color:#fff">${esc(f.from)}</b></span>
              <span>${new Date(f.ts).toLocaleTimeString("de-DE")}</span>
            </div>
            <div style="margin-top:4px; color:var(--muted); font-size:13px; line-height:1.35">${esc(f.msg)}</div>
          </div>
        `).join("");

        // auto-scroll
        funkList.scrollTop = funkList.scrollHeight;

        root.querySelector("#fSend").onclick = () => {
          const from = root.querySelector("#fFrom").value.trim();
          const msg = root.querySelector("#fMsg").value.trim();
          if (!msg) return;
          send({ type: "funk", from, msg });
          root.querySelector("#fMsg").value = "";
        };

        root.querySelector("#fMsg").addEventListener("keydown", (e) => {
          if (e.key === "Enter") root.querySelector("#fSend").click();
        });
      }

      function connect() {
        live = { ok: false, text: "Verbinde..." };
        render();

        socket = new WebSocket(wsUrl());

        socket.addEventListener("open", () => {
          live = { ok: true, text: "Verbunden" };
          render();
        });

        socket.addEventListener("close", () => {
          live = { ok: false, text: "Getrennt" };
          render();
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
          if (msg.type === "state") {
            state.einsaetze = msg.einsaetze || [];
            state.funk = msg.funk || [];
            state.leitstelle = msg.leitstelle || null;
            render();
          }
        });
      }

      connect();
    }
  };
})();
