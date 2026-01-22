window.Fahrzeuge = {
  async mount(root, SESSION){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🚗 Fahrzeuge (Übersicht)</div>
        <div class="small">Aktuell nur Übersicht. Eintragen kommt später.</div>
        <div class="hr"></div>
        <div id="box" class="small"></div>
      </div>
    `;

    const box = root.querySelector("#box");
    try{
      const res = await fetch("/api/org/overview", { headers: { Authorization: "Bearer " + SESSION.token }});
      const data = await res.json();
      if (data.ok) {
        box.innerHTML = `
          <div>Einträge Fahrzeuge: <b>${data.overview.vehicles}</b></div>
        `;
      } else {
        box.textContent = "Keine Daten.";
      }
    }catch{
      box.textContent = "Server nicht erreichbar.";
    }
  }
};
