const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const inUser = document.getElementById("inUser");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");

const loginMsg = document.getElementById("loginMsg");

const sideNav = document.getElementById("sideNav");
const crumb = document.getElementById("crumb");

const orgLine = document.getElementById("orgLine");
const whoName = document.getElementById("whoName");
const whoRole = document.getElementById("whoRole");

let SESSION = null;
let WS = null;

btnLogin.addEventListener("click", doLogin);
btnLogout.addEventListener("click", doLogout);
[inUser, inPass].forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); }));

function setView(viewId){
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  const el = document.getElementById("view-" + viewId);
  if (el) el.style.display = "block";

  document.querySelectorAll(".sideItem").forEach(b=>{
    b.classList.toggle("active", b.dataset.view === viewId);
  });

  const active = NAV_ITEMS.find(x=>x.id===viewId);
  crumb.textContent = active?.label || "Dashboard";
}

async function api(url, options){
  const res = await fetch(url, options);
  const data = await res.json().catch(()=>({}));
  return { res, data };
}

function connectWS(){
  const proto = location.protocol === "https:" ? "wss" : "ws";
  WS = new WebSocket(`${proto}://${location.host}`);
  WS.addEventListener("open", () => WS.send(JSON.stringify({ type:"auth" })));
}

let NAV_ITEMS = [];

function buildSidebar(){
  const role = SESSION?.user?.role;

  NAV_ITEMS = [
    { id:"dashboard", label:"Dashboard" },
    { id:"leitstelle", label:"Leitstelle" },
    { id:"rechner", label:"Strafrechner" },
    { id:"personen", label:"Personen" },
    { id:"fahrzeuge", label:"Fahrzeuge" }
  ];

  if (role === "ORG_LEADER" || role === "SUPER_ADMIN") NAV_ITEMS.push({ id:"hr", label:"HR" });
  if (role === "SUPER_ADMIN") NAV_ITEMS.push({ id:"admin", label:"Audit-Log" });

  sideNav.innerHTML = "";
  NAV_ITEMS.forEach(item=>{
    const btn = document.createElement("button");
    btn.className = "sideItem";
    btn.dataset.view = item.id;
    btn.textContent = item.label;
    btn.onclick = ()=> setView(item.id);
    sideNav.appendChild(btn);
  });

  setView("dashboard");
}

function renderDashboard(){
  const dash = document.getElementById("view-dashboard");
  dash.innerHTML = `
    <div class="row">
      <div class="col">
        <div class="panel">
          <div class="small">Offene Bewerbungen</div>
          <div style="font-weight:900; font-size:34px; margin-top:6px">—</div>
          <div class="small" style="margin-top:6px">Zur Überprüfung</div>
        </div>
      </div>
      <div class="col">
        <div class="panel">
          <div class="small">Aktive Fälle</div>
          <div style="font-weight:900; font-size:34px; margin-top:6px">—</div>
          <div class="small" style="margin-top:6px">Laufende Ermittlungen</div>
        </div>
      </div>
      <div class="col">
        <div class="panel">
          <div class="small">Letzte Logins</div>
          <div style="font-weight:900; font-size:34px; margin-top:6px">—</div>
          <div class="small" style="margin-top:6px">Heute angemeldet</div>
        </div>
      </div>
    </div>

    <div class="row" style="margin-top:14px">
      <div class="col" style="min-width:360px">
        <div class="panel">
          <div class="title">Schnellzugriff</div>
          <div class="row">
            <button class="btnMini" id="goLeit">Leitstelle öffnen</button>
            <button class="btnMini" id="goRech">Strafrechner öffnen</button>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="panel">
          <div class="title">Hinweis</div>
          <div class="small" style="line-height:1.55">
            Denk dran: interne Daten bleiben org-intern. Zugänge werden über HR erstellt.
          </div>
        </div>
      </div>
    </div>
  `;

  dash.querySelector("#goLeit").onclick = ()=> setView("leitstelle");
  dash.querySelector("#goRech").onclick = ()=> setView("rechner");
}

async function doLogin(){
  loginMsg.textContent = "";

  const email = inUser.value.trim();
  const password = inPass.value;

  if (!email || !password) {
    loginMsg.textContent = "Bitte E-Mail und Passwort eingeben.";
    return;
  }

  const { res, data } = await api("/api/login", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok || !data.ok) {
    loginMsg.textContent = "Login fehlgeschlagen.";
    return;
  }

  const me = await api("/api/me");
  if (!me.res.ok || !me.data.ok) {
    loginMsg.textContent = "Session konnte nicht geladen werden.";
    return;
  }

  SESSION = me.data;

  loginView.style.display = "none";
  appView.style.display = "flex";

  const u = SESSION.user;
  whoName.textContent = u.name || u.email;
  whoRole.textContent = u.role;
  orgLine.textContent = "Org: (Server-OrgId) " + (u.orgId || "—");

  connectWS();
  buildSidebar();
  renderDashboard();

  // mount modules
  Leitstelle.mount(document.getElementById("view-leitstelle"), { api, getWS:()=>WS });
  Rechner.mount(document.getElementById("view-rechner"), { api });
  Personen.mount(document.getElementById("view-personen"), { api });
  Fahrzeuge.mount(document.getElementById("view-fahrzeuge"), { api });

  if (u.role === "ORG_LEADER" || u.role === "SUPER_ADMIN") {
    HR.mount(document.getElementById("view-hr"), { api, session: SESSION });
  }
  if (u.role === "SUPER_ADMIN") {
    Admin.mount(document.getElementById("view-admin"), { api });
  }

  if (u.mustChangePw) showMustChangePassword();
}

async function doLogout(){
  await api("/api/logout", { method:"POST" }).catch(()=>{});
  location.reload();
}

function showMustChangePassword(){
  const overlay = document.createElement("div");
  overlay.className = "modalOverlay";
  overlay.style.display = "flex";

  overlay.innerHTML = `
    <div class="modalBox">
      <div class="modalHead">
        <div class="modalTitle">Passwort ändern</div>
        <button class="btnMini" id="xClose">Schließen</button>
      </div>
      <div class="modalBody">
        <div class="small" style="margin-bottom:10px;">
          Du musst dein temporäres Passwort ändern.
        </div>

        <label class="lbl">Altes Passwort</label>
        <input id="oldPw" type="password"/>

        <label class="lbl" style="margin-top:10px;">Neues Passwort (min. 6 Zeichen)</label>
        <input id="newPw" type="password"/>

        <button class="btnPrimary" id="savePw">Speichern</button>
        <div id="pwMsg" class="msg"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector("#xClose").onclick = () => overlay.remove();

  overlay.querySelector("#savePw").onclick = async () => {
    const oldPassword = overlay.querySelector("#oldPw").value;
    const newPassword = overlay.querySelector("#newPw").value;

    const { res, data } = await api("/api/change-password", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ oldPassword, newPassword })
    });

    if (!res.ok || !data.ok) {
      overlay.querySelector("#pwMsg").textContent = "Fehler beim Speichern.";
      return;
    }

    overlay.remove();
  };
}
