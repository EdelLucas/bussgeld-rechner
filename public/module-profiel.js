// public/module-profil.js
window.Profil = {
  async mount(root) {
    root.innerHTML = `
      <div class="panel">
        <div class="title">👤 Profil</div>
        <div class="small">Deine Daten (nur lesen)</div>
        <hr/>
        <div id="profBox" class="panel" style="box-shadow:none"></div>
      </div>
    `;

    const box = root.querySelector("#profBox");

    const { res, data } = await window.apiFetch("/api/profile");
    if (!res.ok || !data?.ok) {
      box.innerHTML = `<div class="small" style="color:#ff6b6b">Profil konnte nicht geladen werden.</div>`;
      return;
    }

    const p = data.profile;

    box.innerHTML = `
      <table class="table">
        <tr><th style="width:160px">Name</th><td>${escapeHtml(p.name || "")}</td></tr>
        <tr><th>E-Mail</th><td>${escapeHtml(p.email || "")}</td></tr>
        <tr><th>Telefon</th><td>${escapeHtml(p.phone || "")}</td></tr>
        <tr><th>Orga</th><td><b>${escapeHtml(p.org || "")}</b></td></tr>
        <tr><th>Rolle</th><td>${escapeHtml(p.role || "")}</td></tr>
        <tr><th>Status</th><td>${p.active ? `<span class="badge b-green">Aktiv</span>` : `<span class="badge b-red">Inaktiv</span>`}</td></tr>
      </table>
      <div class="small" style="margin-top:10px">
        Passwort wird hier nicht angezeigt.
      </div>
    `;
  }
};

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
