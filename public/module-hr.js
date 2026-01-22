window.HR = {
  async mount(root, SESSION){
    const role = SESSION.user.role;

    root.innerHTML = `
      <div class="panel">
        <div class="title">🧩 HR</div>
        <div class="small">Hier werden Leute für die Webseite freigeschaltet (Name, Orga, Telefon, E-Mail). Passwort wird beim ersten Login durch E-Mail-only erzeugt.</div>
        <div class="hr"></div>

        <div class="row">
          <div class="col">
            <div class="panel" style="box-shadow:none">
              <div class="title" style="font-size:14px">Neuen Account freischalten</div>

              <div class="small">Name</div>
              <input id="nName" placeholder="Vorname Nachname"/>

              <div class="small" style="margin-top:10px">Telefon</div>
              <input id="nPhone" placeholder="00-00-000"/>

              <div class="small" style="margin-top:10px">E-Mail</div>
              <input id="nEmail" placeholder="name@orga.de"/>

              <div class="small" style="margin-top:10px">Orga</div>
              <select id="nOrg" style="width:100%; padding:12px; border-radius:12px; border:1px solid #2a2f38; background:#0a0c10; color:#fff; outline:none;">
                ${["LSPD","FIB","NG","LI","EMS","GOV","SAHP"].map(o=>`<option value="${o}">${o}</option>`).join("")}
              </select>

              <div class="small" style="margin-top:10px">Rolle</div>
              <select id="nRole" style="width:100%; padding:12px; border-radius:12px; border:1px solid #2a2f38; background:#0a0c10; color:#fff; outline:none;">
                <option value="user">User</option>
                <option value="leader">Leader</option>
              </select>

              <div id="hrMsg" class="msg"></div>
              <button id="btnCreate" class="btnMini" style="width:100%">Freischalten</button>

              <div class="small" style="margin-top:10px">
                Leader/Admin kann Passwort zurücksetzen → User loggt wieder nur mit E-Mail ein.
              </div>
            </div>
          </div>

          <div class="col">
            <div class="panel" style="box-shadow:none">
              <div class="title" style="font-size:14px">Orga-Accounts</div>
              <div class="small">Du siehst nur deine Orga (Admin sieht später alles im Admin-Panel).</div>
              <div class="hr"></div>
              <div id="list" class="small">Lade…</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // leaders should only create within their org:
    const orgSelect = root.querySelector("#nOrg");
    if (role !== "admin") {
      orgSelect.value = SESSION.user.org;
      orgSelect.disabled = true;
    }

    const roleSelect = root.querySelector("#nRole");
    if (role !== "admin") {
      // leader cannot create other leaders
      roleSelect.value = "user";
      roleSelect.disabled = true;
    }

    root.querySelector("#btnCreate").onclick = async ()=>{
      const msg = root.querySelector("#hrMsg");
      msg.textContent = "";

      const name = root.querySelector("#nName").value.trim();
      const phone = root.querySelector("#nPhone").value.trim();
      const email = root.querySelector("#nEmail").value.trim();
      const org = root.querySelector("#nOrg").value;
      const r = root.querySelector("#nRole").value;

      if (!email || !email.includes("@")) { msg.textContent = "E-Mail ungültig."; return; }
      if (!name) { msg.textContent = "Name fehlt."; return; }

      // Admin endpoint used for creation (simpler). Leader currently uses admin? -> not allowed.
      // So: only Admin creates users. Leader can only list + reset/disable.
      if (role !== "admin") {
        msg.textContent = "Nur Admin kann neue Accounts anlegen. (Leader nur verwalten)";
        return;
      }

      const res = await fetch("/api/admin/create-user", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":"Bearer " + SESSION.token
        },
        body: JSON.stringify({ name, phone, email, org, role: r })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || !data.ok) {
        msg.textContent = "Konnte nicht erstellt werden (E-Mail evtl. schon vorhanden).";
        return;
      }

      msg.style.color = "var(--muted)";
      msg.textContent = "Account erstellt. Nutzer loggt sich nur mit E-Mail ein → Passwort wird generiert.";
      root.querySelector("#nEmail").value = "";
      loadList();
    };

    async function loadList(){
      const list = root.querySelector("#list");
      list.textContent = "Lade…";
      const url = (role === "admin") ? "/api/admin/users" : "/api/org/users";
      const res = await fetch(url + (role === "admin" ? "" : ""), {
        headers:{ "Authorization":"Bearer " + SESSION.token }
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || !data.ok) { list.textContent = "Fehler."; return; }

      let users = data.users || [];

      // if admin: show all except admin itself
      if (role === "admin") {
        users = users.filter(u => u.role !== "admin");
      } else {
        users = users.filter(u => u.org === SESSION.user.org);
      }

      list.innerHTML = users.map(u=>`
        <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:12px; padding:10px; margin-bottom:8px">
          <div style="font-weight:900">${escapeHtml(u.name || u.email)}</div>
          <div class="small">${escapeHtml(u.email)} • ${escapeHtml(u.org)} • ${escapeHtml(u.role)}</div>
          <div class="small">Telefon: ${escapeHtml(u.phone || "-")}</div>
          <div class="small">Letzter Login: ${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("de-DE") : "-"}</div>

          <div class="row" style="margin-top:8px">
            <button class="btnMini" data-reset="${u.id}">Passwort reset</button>
            <button class="btnMini" data-disable="${u.id}">Deaktivieren</button>
          </div>
        </div>
      `).join("");

      list.querySelectorAll("[data-reset]").forEach(b=>{
        b.onclick = async ()=>{
          const id = b.getAttribute("data-reset");
          await fetch("/api/org/reset-pass", {
            method:"POST",
            headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + SESSION.token },
            body: JSON.stringify({ userId:id })
          });
          loadList();
        };
      });

      list.querySelectorAll("[data-disable]").forEach(b=>{
        b.onclick = async ()=>{
          const id = b.getAttribute("data-disable");
          await fetch("/api/org/disable-user", {
            method:"POST",
            headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + SESSION.token },
            body: JSON.stringify({ userId:id })
          });
          loadList();
        };
      });
    }

    function escapeHtml(s){
      return String(s ?? "").replace(/[&<>"']/g, m => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
      }[m]));
    }

    loadList();
  }
};
