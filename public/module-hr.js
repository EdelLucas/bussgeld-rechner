window.HR = {
  async mount(root, ctx){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🧑‍💼 HR</div>
        <div class="small">User freischalten (Temp-Passwort wird einmal angezeigt; User muss es danach ändern).</div>

        <div class="row" style="margin-top:12px">
          <div class="col">
            <div class="small">Neuen User erstellen</div>
            <label class="lbl">Orga</label>
            <select id="orgCode"></select>

            <label class="lbl" style="margin-top:10px">Rolle</label>
            <select id="role">
              <option value="MEMBER">MEMBER</option>
              <option value="ORG_LEADER">ORG_LEADER</option>
            </select>

            <label class="lbl" style="margin-top:10px">Name</label>
            <input id="name" placeholder="Vorname Nachname"/>

            <label class="lbl" style="margin-top:10px">Telefon</label>
            <input id="phone" placeholder="+49..."/>

            <label class="lbl" style="margin-top:10px">E-Mail</label>
            <input id="email" placeholder="user@orga.de"/>

            <button id="create" class="btn">User erstellen</button>
            <div id="msg" class="msg"></div>
            <div id="tempBox" class="cardListItem" style="display:none; margin-top:12px"></div>
          </div>

          <div class="col">
            <div class="small">User-Liste</div>
            <div id="list" style="margin-top:10px"></div>
          </div>
        </div>
      </div>
    `;

    const $ = (id)=>root.querySelector(id);
    const msg = $("#msg");
    const tempBox = $("#tempBox");
    const list = $("#list");
    const orgSelect = $("#orgCode");
    const roleSelect = $("#role");

    // Leaders dürfen nur MEMBER/ORG_LEADER? (server blockt sowieso)
    if (ctx.session.user.role !== "SUPER_ADMIN") {
      // Leader soll in HR nicht sich selbst Super-Rechte basteln
      // ORG_LEADER bleibt aber erlaubt (für Org-Subleader).
    }

    const orgsRes = await ctx.api("/api/hr/orgs");
    if(orgsRes.data?.ok){
      orgSelect.innerHTML = orgsRes.data.orgs.map(o=>`<option value="${o.code}">${o.code}</option>`).join("");
    }

    async function loadUsers(){
      const r = await ctx.api("/api/hr/users");
      if(!r.data?.ok){
        list.innerHTML = `<div class="small">Fehler.</div>`;
        return;
      }
      const users = r.data.users || [];
      if(!users.length){
        list.innerHTML = `<div class="small">Keine User.</div>`;
        return;
      }
      list.innerHTML = users.map(u=>`
        <div class="cardListItem">
          <div style="font-weight:900; font-size:14px">${escapeHtml(u.email)}</div>
          <div class="small" style="margin-top:6px">${escapeHtml(u.name || "")} • ${escapeHtml(u.phone || "")}</div>
          <div class="small" style="margin-top:6px">Rolle: <b>${escapeHtml(u.role)}</b> • Active: <b>${u.isActive ? "JA" : "NEIN"}</b> • PW-Wechsel: <b>${u.mustChangePw ? "JA" : "NEIN"}</b></div>
          <div class="row" style="margin-top:10px">
            <button class="btnMini" data-act="${u.id}" data-on="1">Aktiv</button>
            <button class="btnMini danger" data-act="${u.id}" data-on="0">Deaktiv</button>
          </div>
        </div>
      `).join("");

      list.querySelectorAll("[data-act]").forEach(b=>{
        b.onclick = async ()=>{
          const userId = b.getAttribute("data-act");
          const active = b.getAttribute("data-on") === "1";
          await ctx.api("/api/hr/set-active", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ userId, active })
          });
          loadUsers();
        };
      });
    }

    $("#create").onclick = async ()=>{
      msg.textContent = "";
      tempBox.style.display = "none";
      tempBox.innerHTML = "";

      const payload = {
        orgCode: orgSelect.value,
        role: roleSelect.value,
        name: $("#name").value.trim(),
        phone: $("#phone").value.trim(),
        email: $("#email").value.trim()
      };

      const r = await ctx.api("/api/hr/create-user", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });

      if(!r.res.ok || !r.data.ok){
        msg.textContent = "Fehler beim Erstellen.";
        return;
      }

      tempBox.style.display = "block";
      tempBox.innerHTML = `
        <div style="font-weight:900">Temporäres Passwort</div>
        <div class="small" style="margin-top:6px">Nur jetzt sichtbar:</div>
        <div style="margin-top:10px; font-size:18px; font-weight:900; color:var(--accent)">${escapeHtml(r.data.tempPassword)}</div>
        <div class="small" style="margin-top:10px">User muss nach Login sein Passwort ändern.</div>
      `;

      $("#name").value = "";
      $("#phone").value = "";
      $("#email").value = "";
      loadUsers();
    };

    function escapeHtml(s){
      return String(s||"")
        .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
        .replaceAll('"',"&quot;").replaceAll("'","&#039;");
    }

    loadUsers();
  }
};
