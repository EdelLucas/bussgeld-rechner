window.Admin = {
  onAudit: null,

  async mount(root, SESSION){
    root.innerHTML = `
      <div class="panel">
        <div class="title">🔐 Admin</div>
        <div class="small">Admin kann alle Orgas verwalten. Jede Orga ist strikt getrennt (User sehen nur eigene Orga).</div>
        <div class="hr"></div>

        <div class="row">
          <div class="col">
            <div class="panel" style="box-shadow:none">
              <div class="title" style="font-size:14px">Strafenkatalog pro Orga (JSON)</div>

              <div class="small">Orga auswählen</div>
              <select id="orgPick" style="width:100%; padding:12px; border-radius:12px; border:1px solid #2a2f38; background:#0a0c10; color:#fff; outline:none;">
                ${["LSPD","FIB","NG","LI","EMS","GOV","SAHP"].map(o=>`<option value="${o}">${o}</option>`).join("")}
              </select>

              <textarea id="lawsJson" style="margin-top:10px; width:100%; height:360px; background:#0a0c10; color:#fff; border:1px solid #2a2f38; border-radius:12px; padding:10px; font-family:ui-monospace,Consolas; font-size:12px;"></textarea>

              <div class="row" style="margin-top:10px">
                <button id="lawsLoad" class="btnMini">Laden</button>
                <button id="lawsSave" class="btnMini">Speichern</button>
                <button id="lawsReset" class="btnMini">Default</button>
              </div>

              <div id="adminMsg" class="small" style="margin-top:8px;"></div>
            </div>
          </div>

          <div class="col">
            <div class="panel" style="box-shadow:none">
              <div class="title" style="font-size:14px">Audit-Log (serverseitig)</div>
              <div class="small">Zeigt Änderungen & Logins für die ausgewählte Orga.</div>
              <div class="hr"></div>
              <div id="audit" class="small" style="max-height:420px; overflow:auto"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const orgPick = root.querySelector("#orgPick");
    const ta = root.querySelector("#lawsJson");
    const msg = root.querySelector("#adminMsg");
    const auditBox = root.querySelector("#audit");

    function setMsg(t, bad=false){
      msg.style.color = bad ? "#ff6b6b" : "var(--muted)";
      msg.textContent = t;
    }

    async function loadLaws(){
      const org = orgPick.value;
      const res = await fetch("/api/laws?org=" + encodeURIComponent(org), {
        headers:{ Authorization:"Bearer " + SESSION.token }
      });
      const data = await res.json().catch(()=>({}));
      const laws = data.ok && data.laws ? data.laws : window.DEFAULT_LAWS;
      ta.value = JSON.stringify(laws, null, 2);
      setMsg("Geladen.");
    }

    async function saveLaws(){
      const org = orgPick.value;
      let parsed;
      try{ parsed = JSON.parse(ta.value); }
      catch { setMsg("JSON ungültig.", true); return; }

      const res = await fetch("/api/laws", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + SESSION.token },
        body: JSON.stringify({ org, laws: parsed })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || !data.ok) { setMsg("Speichern fehlgeschlagen.", true); return; }
      setMsg("Gespeichert. (Rechner aktualisiert live)");
    }

    function resetDefault(){
      ta.value = JSON.stringify(window.DEFAULT_LAWS, null, 2);
      setMsg("Default in Textfeld geladen. Speichern drücken um zu übernehmen.");
    }

    root.querySelector("#lawsLoad").onclick = loadLaws;
    root.querySelector("#lawsSave").onclick = saveLaws;
    root.querySelector("#lawsReset").onclick = resetDefault;
    orgPick.onchange = ()=>{ loadLaws(); loadAudit(); };

    async function loadAudit(){
      auditBox.textContent = "Lade…";
      const org = orgPick.value;
      const res = await fetch("/api/audit?org=" + encodeURIComponent(org), {
        headers:{ Authorization:"Bearer " + SESSION.token }
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || !data.ok) { auditBox.textContent = "Fehler."; return; }

      const audit = data.audit || [];
      auditBox.innerHTML = audit.map(a=>`
        <div style="padding:10px; border:1px solid #1f2430; background:#0a0c10; border-radius:12px; margin-bottom:8px">
          <div style="font-weight:900">${escapeHtml(a.action)}</div>
          <div class="small">${new Date(a.ts).toLocaleString("de-DE")} • ${escapeHtml(a.actor)}</div>
          <div class="small">${escapeHtml(JSON.stringify(a.meta || {}))}</div>
        </div>
      `).join("");
    }

    // live audit push via WS
    Admin.onAudit = (entry)=>{
      // only if org matches current selection
      const org = orgPick.value;
      // server pushes only org room; admin is SYSTEM org, but WS room = SYSTEM => no audit pushes.
      // keep simple: just refresh when needed (or later implement admin-room)
    };

    function escapeHtml(s){
      return String(s ?? "").replace(/[&<>"']/g, m => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
      }[m]));
    }

    await loadLaws();
    await loadAudit();
  }
};
