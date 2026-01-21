window.Personen = {
  mount(root){
    const KEY = "PERSONS";
    const load = ()=> { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
    const save = (arr)=> localStorage.setItem(KEY, JSON.stringify(arr));
    let persons = load();

    function render(){
      root.innerHTML = `
        <div class="panel">
          <div class="title">👤 Personenakten</div>
          <div class="row">
            <div class="col">
              <div class="small">Neue Person</div>
              <input id="pName" placeholder="Name"/>
              <input id="pNote" placeholder="Notiz / Status"/>
              <button class="btnMini" id="pAdd" style="margin-top:10px">Speichern</button>
              <div class="small" style="margin-top:10px">Speichert lokal (localStorage).</div>
            </div>
            <div class="col">
              <div class="small">Liste</div>
              <div id="pList" style="margin-top:10px"></div>
            </div>
          </div>
        </div>
      `;

      root.querySelector("#pAdd").onclick = ()=>{
        const name = root.querySelector("#pName").value.trim();
        const note = root.querySelector("#pNote").value.trim();
        if(!name) return;
        persons.unshift({ id: crypto.randomUUID(), name, note, ts: Date.now() });
        save(persons);
        render();
      };

      const list = root.querySelector("#pList");
      list.innerHTML = persons.length ? persons.map(p=>`
        <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:12px; padding:10px; margin-bottom:8px">
          <div style="font-weight:900">${p.name}</div>
          <div class="small">${p.note || ""}</div>
          <div style="margin-top:8px">
            <button class="btnMini" data-del="${p.id}">Löschen</button>
          </div>
        </div>
      `).join("") : `<div class="small">Keine Personen gespeichert.</div>`;

      list.querySelectorAll("[data-del]").forEach(b=>{
        b.onclick = ()=>{
          const id = b.getAttribute("data-del");
          persons = persons.filter(x=>x.id !== id);
          save(persons);
          render();
        };
      });
    }

    render();
  }
};
