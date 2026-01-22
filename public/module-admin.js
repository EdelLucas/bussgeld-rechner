window.Admin = {
  async mount(root, ctx){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🔐 Admin</div>
        <div class="small">Systemweit (nur SUPER_ADMIN). Audit der letzten Aktionen.</div>
        <hr/>
        <div id="list"></div>
      </div>
    `;

    const list = root.querySelector("#list");
    const r = await ctx.api("/api/admin/audit");
    if(!r.data?.ok){
      list.innerHTML = `<div class="small">Fehler beim Laden.</div>`;
      return;
    }

    const items = r.data.audit || [];
    if(!items.length){
      list.innerHTML = `<div class="small">Keine Einträge.</div>`;
      return;
    }

    const fmt = (t)=>{
      const d = new Date(t);
      const pad = (n)=> String(n).padStart(2,"0");
      return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    list.innerHTML = items.map(a=>`
      <div class="cardListItem">
        <div style="font-weight:900">${escapeHtml(a.action)}</div>
        <div class="small" style="margin-top:6px">${fmt(a.createdAt)} • org=${escapeHtml(a.orgId||"-")} • actor=${escapeHtml(a.actorUserId||"-")}</div>
        <div class="small" style="margin-top:6px">${escapeHtml(a.detailJson||"")}</div>
      </div>
    `).join("");

    function escapeHtml(s){
      return String(s||"")
        .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
        .replaceAll('"',"&quot;").replaceAll("'","&#039;");
    }
  }
};
