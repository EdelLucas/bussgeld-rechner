// public/module-admin.js
window.Admin = {
  async mount(root){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🔐 Admin</div>
        <div class="small">Leader pro Orga anlegen (Login über E-Mail + generiertes Passwort)</div>
        <hr/>

        <div class="row">
          <div class="col">
            <div class="panel" style="box-shadow:none">
              <div class="title" style="font-size:16px; margin-bottom:6px">Leader erstellen</div>

              <label class="lbl">Orga</label>
              <select id="orgSel" class="sel"></select>

              <label class="lbl">Name</label>
              <input id="inName" placeholder="Vorname Nachname"/>

              <label class="lbl">Telefon</label>
              <input id="inPhone" placeholder="+49 ..."/>

              <label class="lbl">E-Mail</label>
              <input id="inEmail" placeholder="leader@orga.de"/>

              <button id="btnCreate" class="btnMini" style="margin-top:12px">Leader anlegen</button>

              <div id="outPwBox" style="display:none; margin-top:12px; padding:12px; border:1px solid #2a2f38; border-radius:14px; background:#0a0c10">
                <div class="small" style="color:var(--accent); font-weight:900">Generiertes Passwort (nur jetzt sichtbar)</div>
                <div style="display:flex; gap:10px; align-items:center; margin-top:8px; flex-wrap:wrap">
                  <div id="outPw" style="font-size:18px; font-weight:900; letter-spacing:.5px"></div>
                  <button id="btnCopyPw" class="btnMini">Kopieren</button>
                </div>
                <div id="outPwMeta" class="small" style="margin-top:8px"></div>
              </div>

              <div id="msg" class="small" style="margin-top:10px"></div>
            </div>
          </div>

          <div class="col">
            <div class="panel" style="box-shadow:none">
              <div class="title" style="font-size:16px; margin-bottom:6px">Leader Übersicht</div>
              <div id="leaderList" style="margin-top:8px"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const orgSel = root.querySelector("#orgSel");
    const inName = root.querySelector("#inName");
    const inPhone = root.querySelector("#inPhone");
    const inEmail = root.querySelector("#inEmail");
    const btnCreate = root.querySelector("#btnCreate");
    const msg = root.querySelector("#msg");

    const outPwBox = root.querySelector("#outPwBox");
    const outPw = root.querySelector("#outPw");
    const outPwMeta = root.querySelector("#outPwMeta");
    const btnCopyPw = root.querySelector("#btnCopyPw");

    const leaderList = root.querySelector("#leaderList");

    function setMsg(t, bad=false){
      msg.style.color = bad ? "#ff6b6b" : "var(--muted)";
      msg.textContent = t || "";
    }

    // Load Orgs
    {
      const { res, data } = await window.apiFetch("/api/admin/orgs");
      if(!res.ok || !data?.ok){
        setMsg("Orgs konnten nicht geladen werden.", true);
        return;
      }
      orgSel.innerHTML = data.orgs.map(o=>`<option value="${o}">${o}</option>`).join("");
    }

    async function refreshLeaders(){
      leaderList.innerHTML = `<div class="small">Lade...</div>`;
      const { res, data } = await window.apiFetch("/api/admin/leaders");
      if(!res.ok || !data?.ok){
        leaderList.innerHTML = `<div class="small" style="color:#ff6b6b">Konnte Leader nicht laden.</div>`;
        return;
      }

      const leaders = data.leaders || [];
      if(!leaders.length){
        leaderList.innerHTML = `<div class="small">Noch keine Leader angelegt.</div>`;
        return;
      }

      leaderList.innerHTML = leaders
        .sort((a,b)=>String(a.org).localeCompare(String(b.org)))
        .map(l=>`
          <div style="border:1px solid #1f2430; background:#0a0c10; border-radius:14px; padding:12px; margin-bottom:10px">
            <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap">
              <div style="font-weight:900">${escapeHtml(l.name)}</div>
              <div class="badge ${l.active ? "b-green":"b-red"}">${l.active ? "Aktiv" : "Inaktiv"}</div>
            </div>
            <div class="small" style="margin-top:6px">
              <b>${escapeHtml(l.org)}</b> • ${escapeHtml(l.email)} • ${escapeHtml(l.phone || "-")}
            </div>
          </div>
        `).join("");
    }

    await refreshLeaders();

    btnCopyPw.onclick = async ()=>{
      try{
        await navigator.clipboard.writeText(outPw.textContent || "");
        setMsg("Passwort kopiert.");
      }catch{
        setMsg("Kopieren nicht möglich.", true);
      }
    };

    btnCreate.onclick = async ()=>{
      outPwBox.style.display = "none";
      setMsg("");

      const org = String(orgSel.value || "").trim();
      const name = String(inName.value || "").trim();
      const phone = String(inPhone.value || "").trim();
      const email = String(inEmail.value || "").trim().toLowerCase();

      if(!org || !name || !email){
        setMsg("Orga, Name und E-Mail sind Pflicht.", true);
        return;
      }

      const { res, data } = await window.apiFetch("/api/admin/create-leader", {
        method:"POST",
        body: JSON.stringify({ org, name, phone, email })
      });

      if(!res.ok || !data?.ok){
        const reason = data?.reason || "unbekannt";
        if(reason === "email_exists") setMsg("E-Mail existiert bereits.", true);
        else if(reason === "invalid_org") setMsg("Ungültige Orga.", true);
        else setMsg("Leader anlegen fehlgeschlagen.", true);
        return;
      }

      outPw.textContent = data.generatedPassword || "";
      outPwMeta.textContent = `Login: ${data.leader.email} • Orga: ${data.leader.org}`;
      outPwBox.style.display = "block";

      inName.value = "";
      inPhone.value = "";
      inEmail.value = "";
      setMsg("Leader erstellt.");

      await refreshLeaders();
    };
  }
};

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
