window.Leitstelle = {
  mount(root){
    // ===== Storage =====
    const load = () => {
      try {
        return JSON.parse(localStorage.getItem("LST_UNITS")) || [];
      } catch {
        return [];
      }
    };
    const save = (arr) => localStorage.setItem("LST_UNITS", JSON.stringify(arr));

    let units = load();

    const STATUS = ["Streife", "Standby", "AFK", "Außer Dienst"];
    const statusBadge = (s)=>{
      if(s==="Streife") return "b-green";
      if(s==="Standby") return "b-green";
      if(s==="AFK") return "b-orange";
      return "b-red";
    };

    function render(){
      root.innerHTML = `
        <div class="panel">
          <div class="title">🚨 Leitstelle</div>

          <div class="row">
            <div class="col">
              <div class="small">Neue Streife eintragen</div>
              <input id="uName" placeholder="Streifenname (z. B. ALPHA 01)"/>
              <input id="uOfficer" placeholder="Beamter / Rufname"/>
              <button class="btnMini" id="uAdd">Eintragen</button>
            </div>

            <div class="col">
              <div class="small">Aktive Einheiten</div>
              <div id="uList" style="margin-top:10px"></div>
            </div>
          </div>
        </div>
      `;

      // ===== Add =====
      root.querySelector("#uAdd").onclick = () => {
        const name = root.querySelector("#uName").value.trim();
        const officer = root.querySelector("#uOfficer").value.trim();
        if(!name) return;

        units.unshift({
          id: crypto.randomUUID(),
          name,
          officer,
          status: "Standby",
          ts: Date.now()
        });

        save(units);
        render();
      };

      // ===== List =====
      const list = root.querySelector("#uList");
      list.innerHTML = units.map(u => `
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:10px;
          border:1px solid #1f2430;
          border-radius:12px;
          background:#0a0c10;
          margin-bottom:8px;
        ">
          <div>
            <div style="font-weight:900">${u.name}</div>
            <div class="small">${u.officer || ""}</div>
          </div>

          <div style="display:flex; gap:6px; align-items:center">
            <span class="badge ${statusBadge(u.status)}">${u.status}</span>
            <button class="btnMini" data-next="${u.id}">↻</button>
            <button class="btnMini" data-del="${u.id}">✖</button>
          </div>
        </div>
      `).join("");

      // ===== Actions =====
      list.querySelectorAll("[data-next]").forEach(b=>{
        b.onclick = ()=>{
          const id = b.dataset.next;
          const u = units.find(x=>x.id===id);
          const i = STATUS.indexOf(u.status);
          u.status = STATUS[(i+1) % STATUS.length];
          save(units);
          render();
        };
      });

      list.querySelectorAll("[data-del]").forEach(b=>{
        b.onclick = ()=>{
          const id = b.dataset.del;
          units = units.filter(x=>x.id!==id);
          save(units);
          render();
        };
      });
    }

    render();
  }
};
