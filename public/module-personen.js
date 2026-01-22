window.Personen = {
  async mount(root, ctx){
    root.innerHTML = `
      <div class="panel">
        <div class="title">👤 Personen (Übersicht)</div>
        <div class="small">Nur Anzeige. Eintragen kommt später über Rollen/HR.</div>
        <hr/>
        <div id="list"></div>
      </div>
    `;

    const list = root.querySelector("#list");

    const { res, data } = await ctx.api("/api/persons");
    if(!res.ok || !data.ok){
      list.innerHTML = `<div class="small">Fehler beim Laden.</div>`;
      return;
    }

    if(!data.persons.length){
      list.innerHTML = `<div class="small">Keine Einträge.</div>`;
      return;
    }

    list.innerHTML = data.persons.map(p=>`
      <div class="cardListItem">
        <div style="font-weight:900; font-size:15px">${escapeHtml(p.name)}</div>
        <div class="small" style="margin-top:6px">${escapeHtml(p.note || "")}</div>
      </div>
    `).join("");

    function escapeHtml(s){
      return String(s||"")
        .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
        .replaceAll('"',"&quot;").replaceAll("'","&#039;");
    }
  }
};
