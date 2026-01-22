window.Fahrzeuge = {
  async mount(root, ctx){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🚗 Fahrzeuge (Übersicht)</div>
        <div class="small">Nur Anzeige. Eintragen kommt später über Rollen/HR.</div>
        <hr/>
        <div id="list"></div>
      </div>
    `;

    const list = root.querySelector("#list");

    const { res, data } = await ctx.api("/api/vehicles");
    if(!res.ok || !data.ok){
      list.innerHTML = `<div class="small">Fehler beim Laden.</div>`;
      return;
    }

    if(!data.vehicles.length){
      list.innerHTML = `<div class="small">Keine Einträge.</div>`;
      return;
    }

    list.innerHTML = data.vehicles.map(v=>`
      <div class="cardListItem">
        <div style="font-weight:900; font-size:15px">${escapeHtml(v.plate)}</div>
        <div class="small" style="margin-top:6px">${escapeHtml(v.model || "")}</div>
        <div class="small" style="margin-top:6px">${escapeHtml(v.note || "")}</div>
      </div>
    `).join("");

    function escapeHtml(s){
      return String(s||"")
        .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
        .replaceAll('"',"&quot;").replaceAll("'","&#039;");
    }
  }
};
