window.Profile = {
  async mount(root, SESSION){
    // basic overview from server
    let overview = null;
    try{
      const res = await fetch("/api/org/overview", {
        headers: { Authorization: "Bearer " + SESSION.token }
      });
      const data = await res.json();
      if (data.ok) overview = data.overview;
    }catch{}

    const u = SESSION.user;

    root.innerHTML = `
      <div class="panel" style="padding:0; overflow:hidden">
        <div style="height:210px; background:
          radial-gradient(1200px 240px at 30% 20%, rgba(255,46,126,.35), transparent 60%),
          radial-gradient(900px 260px at 70% 0%, rgba(255,46,126,.18), transparent 60%),
          linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.25));
          border-bottom:1px solid var(--border);
        ">
          <div style="display:flex; gap:16px; align-items:flex-end; padding:18px;">
            <div style="width:92px; height:92px; border-radius:999px; background:#0a0c10; border:1px solid #2a2f38; display:flex; align-items:center; justify-content:center; font-weight:900; color:var(--accent); font-size:22px;">
              ${(u.name || u.email || "U").trim().slice(0,1).toUpperCase()}
            </div>
            <div style="flex:1; padding-bottom:6px">
              <div style="font-size:20px; font-weight:900">${escapeHtml(u.name || u.email)}</div>
              <div class="small">${escapeHtml(u.org)} • ${escapeHtml(u.role)} • ${escapeHtml(u.email)}</div>
              <div class="small" style="margin-top:6px">
                ${overview ? `User: <b>${overview.users}</b> • Personen: <b>${overview.persons}</b> • Fahrzeuge: <b>${overview.vehicles}</b>` : ""}
              </div>
            </div>
            <div style="text-align:right; padding-bottom:10px" class="small">
              Erstellt: ${fmtDate(u.createdAt)}<br/>
              Letzter Login: ${u.lastLoginAt ? fmtDate(u.lastLoginAt) : "-"}
            </div>
          </div>
        </div>

        <div style="padding:14px">
          <div class="row">
            <div class="col">
              <div class="panel" style="box-shadow:none">
                <div class="title">Über mich</div>
                <div class="small" style="line-height:1.6">
                  <div><b>ID:</b> ${escapeHtml(u.id)}</div>
                  <div><b>Name:</b> ${escapeHtml(u.name || "-")}</div>
                  <div><b>Orga:</b> ${escapeHtml(u.org)}</div>
                  <div><b>Rolle:</b> ${escapeHtml(u.role)}</div>
                  <div><b>Telefon:</b> ${escapeHtml(u.phone || "-")}</div>
                  <div><b>E-Mail:</b> ${escapeHtml(u.email)}</div>
                </div>
              </div>
            </div>

            <div class="col">
              <div class="panel" style="box-shadow:none">
                <div class="title">Ausbildungen / Schulungen</div>
                <div class="small" style="line-height:1.9">
                  <div style="display:flex; justify-content:space-between; gap:10px"><span>Grundausbildung</span><span class="badge">—</span></div>
                  <div style="display:flex; justify-content:space-between; gap:10px"><span>Erste Hilfe Kurs</span><span class="badge">—</span></div>
                  <div style="display:flex; justify-content:space-between; gap:10px"><span>Leitstellen Prüfung</span><span class="badge">—</span></div>
                  <div style="display:flex; justify-content:space-between; gap:10px"><span>Jura Prüfung</span><span class="badge">—</span></div>
                </div>
                <div class="small" style="margin-top:10px">
                  (Das füllen wir später aus HR/Profil-Edit. Jetzt erstmal Layout wie im Bild.)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    function fmtDate(ts){
      try{
        const d = new Date(ts);
        return d.toLocaleString("de-DE");
      }catch{ return "-"; }
    }
    function escapeHtml(s){
      return String(s ?? "").replace(/[&<>"']/g, m => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
      }[m]));
    }
  }
};
