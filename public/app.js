const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const inUser = document.getElementById("inUser");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");
const who = document.getElementById("who");
const tabsEl = document.getElementById("tabs");

let SESSION = null;
let WS = null;

btnLogin.addEventListener("click", doLogin);
btnLogout.addEventListener("click", doLogout);
[inUser, inPass].forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); }));

function setView(v){
  document.querySelectorAll(".view").forEach(s => s.style.display = "none");
  const el = document.getElementById("view-" + v);
  if (el) el.style.display = "block";
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === v));
}

function buildTabs(){
  const role = SESSION?.user?.role;

  const base = [
    { id:"leitstelle", label:"Leitstelle" },
    { id:"rechner", label:"Strafrechner" },
    { id:"personen", label:"Personen" },
    { id:"fahrzeuge", label:"Fahrzeuge" }
  ];

  if (role === "ORG_LEADER" || role === "SUPER_ADMIN") base.push({ id:"hr", label:"HR" });
  if (role === "SUPER_ADMIN") base.push({ id:"admin", label:"Admin" });

  tabsEl.innerHTML = "";
  base.forEach(t => {
    const b = document.createElement("button");
    b.className = "tab";
    b.dataset.view = t.id;
    b.textContent = t.label;
    b.onclick = () => setView(t.id);
    tabsEl.appendChild(b);
  });

  setView("leitstelle");
}

async function api(url, options){
  const res = await fetch(url, options);
  const data = await res.json().catch(()=>({}));
  return { res, data };
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

  // load session
  const me = await api("/api/me");
  if (!me.res.ok || !me.data.ok) {
    loginMsg.textContent = "Session konnte nicht geladen werden.";
    return;
  }

  SESSION = me.data;
  loginView.style.display = "none";
  appView.style.display = "block";

  const u = SESSION.user;
  who.textContent = `${u.email} • Rolle: ${u.role}`;

  connectWS();
  buildTabs();

  Leitstelle.mount(document.getElementById("view-leitstelle"), { api, getWS:()=>WS });
  Rechner.mount(document.getElementById("view-rechner"), { api });
  Personen.mount(document.getElementById("view-personen"), { api });
  Fahrzeuge.mount(document.getElementById("view-fahrzeuge"), { api });
  if (u.role === "ORG_LEADER" || u.role === "SUPER_ADMIN") HR.mount(document.getElementById("view-hr"), { api, session: SESSION });
  if (u.role === "SUPER_ADMIN") Admin.mount(document.getElementById("view-admin"), { api });

  // Must change password flow
  if (u.mustChangePw) {
    showMustChangePassword();
  }
}

async function doLogout(){
  await api("/api/logout", { method:"POST" }).catch(()=>{});
  location.reload();
}

function connectWS(){
  const proto = location.protocol === "https:" ? "wss" : "ws";
  WS = new WebSocket(`${proto}://${location.host}`);

  WS.addEventListener("open", () => {
    WS.send(JSON.stringify({ type:"auth" }));
  });
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

        <button class="btn" id="savePw">Speichern</button>
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

    // refresh session to clear mustChangePw
    const me = await api("/api/me");
    if (me.data?.ok) SESSION = me.data;
    who.textContent = `${SESSION.user.email} • Rolle: ${SESSION.user.role}`;
  };
}
