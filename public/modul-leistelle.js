window.Leitstelle = {
  mount(root){
    const LS_KEY = "LST_UNITS_V1";

    const STATUSES = [
      { id:"streife", label:"Streife", cls:"b-green" },
      { id:"einsatz", label:"Einsatz", cls:"b-red" },
      { id:"standby", label:"Standby", cls:"b-blue" },
      { id:"afk", label:"AFK", cls:"b-orange" },
      { id:"off", label:"Außer Dienst", cls:"b-gray" },
    ];

    const load = () => {
      try{
        const raw = localStorage.getItem(LS_KEY);
        if(raw) return JSON.parse(raw);
      }catch{}
      // Default Units (kannst du ändern)
      return [
        { id: crypto.randomUUID(), unit:"ALPHA 01", officer1:"", officer2:"", status:"off", note:"" },
        { id: crypto.randomUUID(), unit:"ALPHA 02", officer1:"", officer2:"", status:"off", note:"" },
        { id: crypto.randomUUID(), unit:"BRAVO 01", officer1:"", officer2:"", status:"off", note:"" },
        { id: crypto.randomUUID(), unit:"CHARLIE 01", officer1:"", officer2:"", status:"off", note:"" },
      ];
    };

    const save = (units) => localStorage.setItem(LS_KEY, JSON.stringify(units));

    let units = load();

    const statusMeta = (id) => STATUSES.find(s=>s.id===id) || STATUSES[0];

    function counts(){
      let inDienst = 0, einsatz = 0, afk = 0, off = 0;
      for(const u of units){
        if(u.status === "einsatz") einsatz++;
        else if(u.status === "afk") afk++;
        else if(u.status === "off") off++;
        else inDienst++;
      }
      return { inDienst, einsatz, afk, off };
    }

    function render(){
      const c = counts();

      root.innerHTML = `
        <div class="panel">
          <div class="title">🚨 Leitstelle</div>
          <div class="small">Streifen eintragen, Status wechseln, Notizen – alles lokal gespeichert (Browser).</div>

          <div class="ls-top">
            <div class="ls-stat">
              <div class="small">IM DIENST</div>
              <div class="ls-num">${c.inDienst}</div>
            </div>
            <div class="ls-stat">
              <div class="small">EINSATZ</div>
              <div class="ls-num">${c.einsatz}</div>
            </div>
            <div class="ls-stat">
              <div class="small">AFK</div>
              <div class="ls-num">${c.afk}</div>
            </div>
            <div class="ls-stat">
              <div class="small">AUSSER DIENST</div>
              <div class="ls-num">${c.off}</div>
            </div>
          </div>

          <hr/>

          <div class="row">
            <div class="col">
              <div class="small" style="margin-bottom:8px;">Neue Streife</div>
              <div class="ls-form">
                <input id="newUnit" placeholder="Einheit z.B. ALPHA 03">
                <input id="newO1" placeholder="Officer 1">
                <input id="newO2" placeholder="Officer 2 (optional)">
                <select id="newStatus">
                  ${STATUSES.map(s=>`<option value="${s.id}">${s.label}</option>`).join("")}
                </select>
                <input id="newNote" placeholder="Notiz (optional)">
                <button class="btnMini" id="btnAddUnit">Hinzufügen</button>
              </div>
            </div>
          </div>

          <hr/>

          <div class="row" style="align-items:center;">
            <div class="col">
              <input id="lsSearch" placeholder="Suchen (Einheit/Name/Notiz)..." class="ls-search">
            </div>
            <div class="col" style="text-align:right; min-width:240px;">
              <button class="btnMini" id="btnResetLS">Reset</button>
              <button class="btnMini" id="btnExportLS">Export JSON</button>
            </div>
          </div>

          <div id="lsList" class="ls-list" style="margin-top:12px;"></div>
        </div>
      `;

      // Bindings
      const $ = (sel)=>root.querySelector(sel);

      $("#btnAddUnit").onclick = () => {
        const unit = $("#newUnit").value.trim().toUpperCase();
        const o1 = $("#newO1").value.trim();
        const o2 = $("#newO2").value.trim();
        const status = $("#newStatus").value;
        const note = $("#newNote").value.trim();

        if(!unit || !o1) return;

        units.unshift({
          id: crypto.randomUUID(),
          unit, officer1:o1, officer2:o2,
          status, note
        });

        save(units);
        render();
      };

      $("#btnResetLS").onclick = () => {
        if(!confirm("Leitstelle wirklich zurücksetzen?")) return;
        localStorage.removeItem(LS_KEY);
        units = load();
        save(units);
        render();
      };

      $("#btnExportLS").onclick = async () => {
        const text = JSON.stringify(units, null, 2);
        try{
          await navigator.clipboard.writeText(text);
          alert("Export in Zwischenablage kopiert.");
        }catch{
          alert("Konnte nicht kopieren. (Browser blockiert)");
        }
      };

      $("#lsSearch").oninput = () => {
        const q = $("#lsSearch").value.toLowerCase();
        root.querySelectorAll(".ls-card").forEach(card=>{
          const t = card.innerText.toLowerCase();
          card.style.display = t.includes(q) ? "" : "none";
        });
      };

      const list = $("#lsList");
      list.innerHTML = units.map(u=>{
        const sm = statusMeta(u.status);
        const nameLine = [u.officer1, u.officer2].filter(Boolean).join(" • ");

        return `
          <div class="ls-card" data-id="${u.id}">
            <div class="ls-left">
              <div class="ls-unit">${u.unit}</div>
              <div class="ls-names">${escapeHtml(nameLine || "—")}</div>
              <div class="ls-note">${escapeHtml(u.note || "")}</div>
            </div>

            <div class="ls-right">
              <select class="ls-status">
                ${STATUSES.map(s=>`<option value="${s.id}" ${u.status===s.id?"selected":""}>${s.label}</option>`).join("")}
              </select>

              <button class="btnMini ls-edit">Bearbeiten</button>
              <button class="btnMini ls-del">Löschen</button>
              <div class="badge ${sm.cls}">${sm.label}</div>
            </div>
          </div>
        `;
      }).join("");

      // Actions
      list.querySelectorAll(".ls-card").forEach(card=>{
        const id = card.getAttribute("data-id");
        const u = units.find(x=>x.id===id);

        card.querySelector(".ls-status").onchange = (e)=>{
          u.status = e.target.value;
          save(units);
          render();
        };

        card.querySelector(".ls-del").onclick = ()=>{
          if(!confirm(`Streife ${u.unit} löschen?`)) return;
          units = units.filter(x=>x.id!==id);
          save(units);
          render();
        };

        card.querySelector(".ls-edit").onclick = ()=>{
          const nUnit = prompt("Einheit:", u.unit) ?? u.unit;
          const nO1 = prompt("Officer 1:", u.officer1) ?? u.officer1;
          const nO2 = prompt("Officer 2 (optional):", u.officer2) ?? u.officer2;
          const nNote = prompt("Notiz:", u.note) ?? u.note;

          u.unit = String(nUnit).trim().toUpperCase();
          u.officer1 = String(nO1).trim();
          u.officer2 = String(nO2).trim();
          u.note = String(nNote).trim();

          save(units);
          render();
        };
      });
    }

    function escapeHtml(s){
      return String(s)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
    }

    render();
  }
};
