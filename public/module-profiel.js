window.Profil = {
  async mount(root){
    const session = window.SESSION || {};
    const token = session.token;

    // Default Demo-Daten (wenn Backend nicht alles liefert)
    const demo = {
      id: (session.email || "user").split("@")[0].toUpperCase(),
      name: session.user || "Unbekannt",
      phone: "",
      eingestellt: "",
      letzteBefoerderung: "",
      rang: "",
      funk: "",
      punkte: ""
    };

    // Hol Profil vom Backend (nur das was vorhanden ist)
    let profile = null;
    try{
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(()=>null);
      if(res.ok && data && data.ok) profile = data.profile;
    }catch{}

    // mapping
    const about = {
      id: demo.id,
      name: profile?.name || demo.name,
      phone: profile?.phone || demo.phone,
      email: profile?.email || session.email || "",
      eingestellt: demo.eingestellt,
      letzteBefoerderung: demo.letzteBefoerderung,
      rang: demo.rang,
      funk: demo.funk,
      punkte: demo.punkte,
      org: profile?.org || session.org || "",
      role: profile?.role || session.role || ""
    };

    // Schulungen: pro User in localStorage
    const key = `TRAININGS_${(about.email||about.name).toLowerCase()}`;
    const defaults = [
      { name:"Grundausbildung", status:"BESTANDEN" },
      { name:"Erste Hilfe Kurs", status:"BESTANDEN" },
      { name:"Officer Prüfung", status:"BESTANDEN" },
      { name:"Ortskunde Plus", status:"BESTANDEN" },
      { name:"Fahrtauglichkeitsprüfung", status:"BESTANDEN" },
      { name:"Fahrsicherheit", status:"BESTANDEN" },
      { name:"Tactical Shooting Training", status:"BESTANDEN" },
      { name:"Senior Officer Prüfung", status:"BESTANDEN" },
      { name:"AUB Streifen Schulung", status:"BESTANDEN" },
      { name:"Leitstellen Prüfung", status:"BESTANDEN" },
      { name:"Jura Prüfung", status:"NICHT ABSOLVIERT" },
      { name:"Verhandlungs-/Einsatzleitung Prüfung", status:"NICHT ABSOLVIERT" },
      { name:"Flugausbildung / Overwatch", status:"BESTANDEN" },
      { name:"TOW Ausbildung (Abschlepper)", status:"BESTANDEN" },
    ];

    let trainings = [];
    try{
      const raw = localStorage.getItem(key);
      trainings = raw ? JSON.parse(raw) : [];
    }catch{ trainings = []; }

    if(!Array.isArray(trainings) || trainings.length === 0){
      trainings = defaults;
      try{ localStorage.setItem(key, JSON.stringify(trainings)); }catch{}
    }

    const pill = (s)=>{
      const t = String(s||"").toUpperCase();
      if(t.includes("BESTANDEN")) return `<span class="pill ok">BESTANDEN</span>`;
      if(t.includes("NICHT")) return `<span class="pill no">NICHT ABSOLVIERT</span>`;
      return `<span class="pill na">${s||"OFFEN"}</span>`;
    };

    // Demo Titelzeile wie im Bild
    const headline = `${about.name} (ID: ${about.id})`;
    const roleLine = `${about.org || ""}${about.org && about.rang ? " · " : ""}${about.rang || ""}`.trim();

    root.innerHTML = `
      <div class="profileWrap">
        <div class="profileHeader">
          <div class="cover"></div>
          <div class="headerRow">
            <div class="avatar">
              <img src="https://i.imgur.com/1X6VJqM.png" alt="avatar" />
            </div>
            <div class="headerMeta">
              <div class="pName">${headline}</div>
              <div class="pSubLine">
                <span>${roleLine || (about.role ? about.role.toUpperCase() : "")}</span>
                ${about.email ? `<span>· ${about.email}</span>` : ""}
              </div>

              <div class="pDates">
                <span><b>${about.eingestellt || "—"}</b> <span style="color:var(--muted)">Eingestellt am</span></span>
                <span><b>${about.letzteBefoerderung || "—"}</b> <span style="color:var(--muted)">Letzte Beförderung</span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="profileCards">
          <div class="pCard">
            <div class="pCardTitle">Über Mich</div>
            <div class="small">Hier findest du alle Grund Informationen über Dich selbst!</div>

            <div class="pList">
              <div class="pRow"><div class="pIcon">🆔</div><div><b>${about.id}</b></div></div>
              <div class="pRow"><div class="pIcon">👤</div><div><b>${about.name}</b></div></div>
              <div class="pRow"><div class="pIcon">📞</div><div><b>${about.phone || "—"}</b></div></div>
              <div class="pRow"><div class="pIcon">📧</div><div><b>${about.email || "—"}</b></div></div>
              <div class="pRow"><div class="pIcon">🏢</div><div><b>${about.org || "—"}</b></div></div>
              <div class="pRow"><div class="pIcon">🎖️</div><div><b>${about.rang || "—"}</b></div></div>
              <div class="pRow"><div class="pIcon">📡</div><div><b>${about.funk || "—"}</b></div></div>
              <div class="pRow"><div class="pIcon">⭐</div><div><b>${about.punkte || "—"}</b></div></div>
            </div>
          </div>

          <div class="pCard">
            <div class="pCardTitle">Ausbildungen / Schulungen</div>
            <table class="table pTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style="text-align:right">Status</th>
                </tr>
              </thead>
              <tbody>
                ${trainings.map(t => `
                  <tr>
                    <td>${t.name}</td>
                    <td style="text-align:right">${pill(t.status)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
};
