window.Fahrzeuge = {
  mount(root){
    const load = ()=> {
      const raw = localStorage.getItem("VEHICLES");
      return raw ? JSON.parse(raw) : [];
    };
    const save = (arr)=> localStorage.setItem("VEHICLES", JSON.stringify(arr));

    let vehicles = load();

    function render(){
      root.innerHTML = `
        <div class="panel">
          <div class="title">🚗 Fahrzeugakten</div>
          <div class="row">
            <div class="col">
              <div class="small">Neues Fahrzeug</div>
              <input id="vPlate" placeholder="Kennzeichen"/>
              <input id="vModel" placeholder="Fahrzeug / Modell"/>
              <input id="vNote" placeholder="Notiz"/>
              <button class="btnMini" id="vAdd">Speichern</button>
              <div class="small" style="margin-top:10px">Hinweis: aktuell lokal (localStorage). Backend/DB später.</div>
            </div>
            <div class="col">
              <div class="small">Liste</div>
              <div id="vList" style="margin-top:10px"></div>
            </div>
          </div>
        </div>
      `;

      root.querySelector("#vAdd").onclick = ()=>{
        const plate = root.querySelector("#vPlate").value.trim();
        const model = root.querySelector("#vModel").value.trim();
        const note = root.querySelector("#vNote").value.trim();
        if(!plate) return;
        vehicles.unshift({ id: crypto.randomUUID(), plate, model, note, ts: Date.now() });
        save(vehicles);
        render();
      };

      const list = root.querySelector("#vList");
      list.innerHTML = vehicles.map(v=>`
        <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:12px; padding:10px; margin-bottom:8px">
          <div style="font-weight:900">${v.plate}</div>
          <div class="small">${v.model || ""}</div>
          <div class="small">${v.note || ""}</div>
          <div class="row" style="margin-top:8px">
            <button class="btnMini" data-del="${v.id}">Löschen</button>
          </div>
        </div>
      `).join("");

      list.querySelectorAll("[data-del]").forEach(b=>{
        b.onclick = ()=>{
          const id = b.getAttribute("data-del");
          vehicles = vehicles.filter(x=>x.id !== id);
          save(vehicles);
          render();
        };
      });
    }

    render();
  }
};
