window.Admin = {
  mount(root){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🔐 Admin</div>
        <div class="row">
          <div class="col">
            <div class="small">Strafenkatalog bearbeiten</div>
            <textarea id="lawsJson" style="width:100%; height:380px; background:#0a0c10; color:#fff; border:1px solid #2a2f38; border-radius:12px; padding:10px; font-family:ui-monospace,Consolas; font-size:12px;"></textarea>
            <div class="row" style="margin-top:10px">
              <button class="btnMini" id="lawsLoad">Laden</button>
              <button class="btnMini" id="lawsSave">Speichern</button>
              <button class="btnMini" id="lawsReset">Reset Default</button>
            </div>
            <div id="adminMsg" class="small" style="margin-top:8px;"></div>
          </div>
          <div class="col">
            <div class="small">Hinweise</div>
            <div class="small" style="margin-top:10px; line-height:1.45">
              - Speichert aktuell im Browser (localStorage).<br/>
              - Für echte Multiuser/Backend-Daten braucht es DB + Auth-Tokens.<br/>
              - Damit machst du dir den Strafenkatalog sofort editierbar.
            </div>
          </div>
        </div>
      </div>
    `;

    const ta = root.querySelector("#lawsJson");
    const msg = root.querySelector("#adminMsg");

    function setMsg(t, bad=false){
      msg.style.color = bad ? "#ff6b6b" : "var(--muted)";
      msg.textContent = t;
    }

    root.querySelector("#lawsLoad").onclick = ()=>{
      const laws = loadLaws();
      ta.value = JSON.stringify(laws, null, 2);
      setMsg("Geladen.");
    };

    root.querySelector("#lawsSave").onclick = ()=>{
      try{
        const parsed = JSON.parse(ta.value);
        saveLaws(parsed);
        setMsg("Gespeichert. (Rechner neu öffnen, damit es sichtbar ist)");
      }catch{
        setMsg("JSON ungültig.", true);
      }
    };

    root.querySelector("#lawsReset").onclick = ()=>{
      saveLaws(DEFAULT_LAWS);
      ta.value = JSON.stringify(DEFAULT_LAWS, null, 2);
      setMsg("Auf Default zurückgesetzt.");
    };

    // initial load
    const laws = loadLaws();
    ta.value = JSON.stringify(laws, null, 2);
  }
};
