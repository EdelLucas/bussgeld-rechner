window.Admin = {
  mount(root){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🔐 Admin</div>
        <div class="row">
          <div class="col">
            <div class="small">Strafenkatalog bearbeiten (JSON)</div>
            <textarea id="lawsJson" style="height:420px; font-family:ui-monospace,Consolas; font-size:12px;"></textarea>
            <div class="row" style="margin-top:10px">
              <button class="btnMini" id="lawsLoad">Laden</button>
              <button class="btnMini" id="lawsSave">Speichern</button>
              <button class="btnMini" id="lawsReset">Reset Default</button>
            </div>
            <div id="adminMsg" class="small" style="margin-top:8px;"></div>
          </div>
          <div class="col">
            <div class="small">Info</div>
            <div class="small" style="margin-top:10px; line-height:1.55">
              - Speichert aktuell im Browser (localStorage).<br/>
              - Für echte Multiuser brauchst du DB + Auth-Tokens.<br/>
              - Änderungen wirken beim nächsten Öffnen des Strafrechners.
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
        setMsg("Gespeichert.");
      }catch{
        setMsg("JSON ungültig.", true);
      }
    };

    root.querySelector("#lawsReset").onclick = ()=>{
      saveLaws(DEFAULT_LAWS);
      ta.value = JSON.stringify(DEFAULT_LAWS, null, 2);
      setMsg("Auf Default zurückgesetzt.");
    };

    // initial
    ta.value = JSON.stringify(loadLaws(), null, 2);
  }
};
