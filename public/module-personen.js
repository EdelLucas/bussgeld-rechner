window.Personen = {
  mount(root){
    const load = ()=> {
      const raw = localStorage.getItem("PERSONS");
      return raw ? JSON.parse(raw) : [];
    };

    let persons = load();

    root.innerHTML = `
      <div class="panel">
        <div class="title">👤 Personen</div>
        <div class="small">Nur Übersicht (keine Eintragung hier)</div>

        <div class="row" style="margin-top:12px">
          <div class="col">
            <input id="pSearch" placeholder="Suche Name / Notiz..."/>
          </div>
          <div class="col" style="text-align:right">
            <button class="btnMini" id="pReload">Neu laden</button>
          </div>
        </div>

        <div id="pList" style="margin-top:14px"></div>
      </div>
    `;

    const list = root.querySelector("#pList");
    const search = root.querySelector("#pSearch");

    function render(){
      const q = search.value.trim().toLowerCase();
      const filtered = persons.filter(p => {
        const a = (p.name || "").toLowerCase();
        const b = (p.note || "").toLowerCase();
        return (a + " " + b).includes(q);
      });

      list.innerHTML = filtered.length ? filtered.map(p=>`
        <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:14px; padding:12px; margin-bottom:10px">
          <div style="font-weight:900; font-size:15px">${p.name || "-"}</div>
          <div class="small" style="margin-top:6px">${p.note || ""}</div>
        </div>
      `).join("") : `<div class="small">Keine Daten.</div>`;
    }

    search.oninput = render;
    root.querySelector("#pReload").onclick = ()=>{
      persons = load();
      render();
    };

    render();
  }
};
