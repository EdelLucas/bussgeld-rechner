window.Admin = {
  mount(root){
    const ROLE_KEY = "ROLES_V1";

    const loadRoles = ()=>{
      try{
        const raw = localStorage.getItem(ROLE_KEY);
        if(raw) return JSON.parse(raw);
      }catch{}
      return [
        { id: crypto.randomUUID(), name:"admin", tasks:["Systemverwaltung","Freischaltungen","Rollenpflege"] },
        { id: crypto.randomUUID(), name:"user", tasks:["Leitstelle nutzen","Strafkatalog nutzen"] }
      ];
    };

    const saveRoles = (roles)=> localStorage.setItem(ROLE_KEY, JSON.stringify(roles));

    let roles = loadRoles();

    function render(){
      root.innerHTML = `
        <div class="panel">
          <div class="title">🔐 Admin</div>
          <div class="small">Rollen hinzufügen + Aufgaben definieren (Basis)</div>

          <hr/>

          <div class="row">
            <div class="col">
              <div class="small">Neue Rolle</div>
              <input id="rName" placeholder="Rollenname (z.B. HR)"/>
              <input id="rTasks" placeholder="Aufgaben (kommagetrennt) z.B. Freischalten,Anträge"/>
              <button class="btnMini" id="rAdd" style="margin-top:12px">Rolle anlegen</button>
              <div id="msg" class="small" style="margin-top:10px"></div>
            </div>

            <div class="col">
              <div class="small">Rollenliste</div>
              <div id="rList" style="margin-top:12px"></div>
            </div>
          </div>
        </div>
      `;

      const msg = root.querySelector("#msg");
      const rList = root.querySelector("#rList");

      function setMsg(t, bad=false){
        msg.style.color = bad ? "#ff6b6b" : "var(--muted)";
        msg.textContent = t;
      }

      root.querySelector("#rAdd").onclick = ()=>{
        const name = root.querySelector("#rName").value.trim();
        const tasksRaw = root.querySelector("#rTasks").value.trim();
        if(!name){ setMsg("Rollenname fehlt.", true); return; }

        if(roles.some(r => r.name.toLowerCase() === name.toLowerCase())){
          setMsg("Rolle existiert bereits.", true);
          return;
        }

        const tasks = tasksRaw ? tasksRaw.split(",").map(x=>x.trim()).filter(Boolean) : [];
        roles.unshift({ id: crypto.randomUUID(), name, tasks });
        saveRoles(roles);
        setMsg("Rolle gespeichert.");
        render();
      };

      rList.innerHTML = roles.map(r=>`
        <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:14px; padding:12px; margin-bottom:10px">
          <div style="font-weight:900; font-size:15px">${r.name}</div>
          <div class="small" style="margin-top:6px">Aufgaben: ${r.tasks?.length ? r.tasks.map(t=>`<span class="badge" style="margin-right:6px">${t}</span>`).join("") : "-"}</div>
          <div class="row" style="margin-top:10px">
            <button class="btnMini" data-del="${r.id}">Löschen</button>
          </div>
        </div>
      `).join("");

      rList.querySelectorAll("[data-del]").forEach(b=>{
        b.onclick = ()=>{
          const id = b.getAttribute("data-del");
          roles = roles.filter(x => x.id !== id);
          saveRoles(roles);
          render();
        };
      });
    }

    render();
  }
};
