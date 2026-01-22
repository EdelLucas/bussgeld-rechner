window.HR = {
  mount(root){
    const ROLE_KEY = "ROLES_V1";
    const HR_KEY = "HR_USERS_V1";

    const loadRoles = ()=>{
      try{
        const raw = localStorage.getItem(ROLE_KEY);
        if(raw) return JSON.parse(raw);
      }catch{}
      return [];
    };

    const loadUsers = ()=>{
      try{
        const raw = localStorage.getItem(HR_KEY);
        if(raw) return JSON.parse(raw);
      }catch{}
      return [];
    };

    const saveUsers = (arr)=> localStorage.setItem(HR_KEY, JSON.stringify(arr));

    let roles = loadRoles();
    let users = loadUsers();

    function render(){
      roles = loadRoles();

      root.innerHTML = `
        <div class="panel">
          <div class="title">🧑‍💼 HR</div>
          <div class="small">Freischalten für Webseite (Name, Orga, Tel, Email, Rolle, Aktiv)</div>

          <hr/>

          <div class="row">
            <div class="col">
              <div class="small">Neue Freischaltung</div>
              <input id="hName" placeholder="Name"/>
              <input id="hOrga" placeholder="Orga"/>
              <input id="hTel" placeholder="Telefon"/>
              <input id="hMail" placeholder="Email"/>
              <select id="hRole" class="sel" style="margin-top:12px">
                <option value="">— Rolle —</option>
                ${roles.map(r=>`<option value="${r.name}">${r.name}</option>`).join("")}
              </select>
              <div class="row" style="margin-top:12px">
                <button class="btnMini" id="hAdd">Speichern</button>
                <button class="btnMini" id="hReload">Neu laden</button>
              </div>
              <div id="hMsg" class="small" style="margin-top:10px"></div>
            </div>

            <div class="col">
              <div class="small">Übersicht</div>
              <input id="hSearch" placeholder="Suche Name/Orga/Email..." style="margin-top:12px"/>
              <div id="hList" style="margin-top:12px"></div>
            </div>
          </div>
        </div>
      `;

      const msg = root.querySelector("#hMsg");
      const list = root.querySelector("#hList");
      const search = root.querySelector("#hSearch");

      function setMsg(t, bad=false){
        msg.style.color = bad ? "#ff6b6b" : "var(--muted)";
        msg.textContent = t;
      }

      root.querySelector("#hAdd").onclick = ()=>{
        const name = root.querySelector("#hName").value.trim();
        const orga = root.querySelector("#hOrga").value.trim();
        const tel = root.querySelector("#hTel").value.trim();
        const mail = root.querySelector("#hMail").value.trim();
        const role = root.querySelector("#hRole").value;

        if(!name){ setMsg("Name fehlt.", true); return; }
        users.unshift({
          id: crypto.randomUUID(),
          name, orga, tel, mail,
          role: role || "user",
          active: true,
          ts: Date.now()
        });
        saveUsers(users);
        setMsg("Gespeichert.");
        render();
      };

      root.querySelector("#hReload").onclick = ()=>{
        users = loadUsers();
        render();
      };

      function renderList(){
        const q = (search.value||"").toLowerCase().trim();
        const filtered = users.filter(u => {
          const t = `${u.name||""} ${u.orga||""} ${u.mail||""}`.toLowerCase();
          return t.includes(q);
        });

        list.innerHTML = filtered.length ? filtered.map(u=>`
          <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:14px; padding:12px; margin-bottom:10px">
            <div style="display:flex; justify-content:space-between; gap:10px">
              <div style="font-weight:900; font-size:15px">${u.name}</div>
              <span class="badge" style="background:${u.active ? "rgba(50,255,90,.10)" : "rgba(255,70,70,.10)"}">
                ${u.active ? "AKTIV" : "INAKTIV"}
              </span>
            </div>
            <div class="small" style="margin-top:6px">${u.orga || ""}</div>
            <div class="small">${u.tel || ""} ${u.mail ? "• " + u.mail : ""}</div>
            <div class="small" style="margin-top:6px">Rolle: <b>${u.role}</b></div>

            <div class="row" style="margin-top:10px">
              <button class="btnMini" data-toggle="${u.id}">${u.active ? "Deaktivieren" : "Aktivieren"}</button>
              <button class="btnMini" data-del="${u.id}">Löschen</button>
            </div>
          </div>
        `).join("") : `<div class="small">Keine Einträge.</div>`;

        list.querySelectorAll("[data-toggle]").forEach(b=>{
          b.onclick = ()=>{
            const id = b.getAttribute("data-toggle");
            const x = users.find(z => z.id === id);
            if(!x) return;
            x.active = !x.active;
            saveUsers(users);
            render();
          };
        });

        list.querySelectorAll("[data-del]").forEach(b=>{
          b.onclick = ()=>{
            const id = b.getAttribute("data-del");
            users = users.filter(z => z.id !== id);
            saveUsers(users);
            render();
          };
        });
      }

      search.oninput = renderList;
      renderList();
    }

    render();
  }
};
