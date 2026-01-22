const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const inEmail = document.getElementById("inEmail");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");

const who = document.getElementById("who");
const tabsEl = document.getElementById("tabs");

let SESSION = { token:null, email:null, user:null, org:null, role:null };
let WS = null;

window.SESSION = SESSION;
window.WS = null;

btnLogin.addEventListener("click", doLogin);
btnLogout.addEventListener("click", () => {
  try { localStorage.removeItem("TOKEN"); } catch {}
  location.reload();
});
[inEmail,inPass].forEach(el => el.addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
}));

function setView(v){
  document.querySelectorAll(".view").forEach(s => s.style.display = "none");
  const el = document.getElementById("view-"+v);
  if (el) el.style.display = "block";
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === v));
}

function canSeeAdmin(){
  return SESSION.role === "admin";
}
function canSeeHR(){
  return SESSION.role === "admin" || SESSION.role === "hr" || SESSION.role === "leader";
}

function buildTabs(){
  const base = [
    { id:"profil", label:"Profil" },
    { id:"rechner", label:"Strafrechner" },
    { id:"personen", label:"Personen" },
    { id:"fahrzeuge", label:"Fahrzeuge" },
    { id:"einsaetze", label:"Einsätze (Live)" },
  ];
  if (canSeeHR()) base.push({ id:"hr", label:"HR" });
  if (canSeeAdmin()) base.push({ id:"admin", label:"Admin" });

  tabsEl.innerHTML = "";
  base.forEach(t => {
    const b = document.createElement("button");
    b.className = "tab";
    b.dataset.view = t.id;
    b.textContent = t.label;
    b.onclick = () => setView(t.id);
    tabsEl.appendChild(b);
  });
  setView("profil");
}

function setLoggedInUI(){
  loginView.style.display = "none";
  appView.style.display = "block";
  who.textContent = `Angemeldet als ${SESSION.user} (${SESSION.role}) — ${SESSION.org}`;
  buildTabs();

  Profil.mount(document.getElementById("view-profil"));
  Rechner.mount(document.getElementById("view-rechner"));
  Personen.mount(document.getElementById("view-personen"));
  Fahrzeuge.mount(document.getElementById("view-fahrzeuge"));
  Einsaetze.mount(document.getElementById("view-einsaetze"));

  if (canSeeHR()) HR.mount(document.getElementById("view-hr"));
  if (canSeeAdmin()) Admin.mount(document.getElementById("view-admin"));

  connectWS();
}

async function doLogin(){
  loginMsg.textContent = "";
  const email = (inEmail.value || "").trim();
  const password = (inPass.value || "").trim();
  if (!email || !password){
    loginMsg.textContent = "Bitte E-Mail und Passwort eingeben.";
    return;
  }

  let res, data;
  try{
    res = await fetch("/api/login", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, password })
    });
    data = await res.json().catch(()=>({}));
  }catch{
    loginMsg.textContent = "Backend nicht erreichbar.";
    return;
  }

  if (!res.ok || !data.ok){
    loginMsg.textContent = "Login fehlgeschlagen.";
    return;
  }

  SESSION.token = data.token;
  SESSION.email = data.email;
  SESSION.user = data.user;
  SESSION.org = data.org;
  SESSION.role = data.role;

  window.SESSION = SESSION;
  try { localStorage.setItem("TOKEN", SESSION.token); } catch {}

  setLoggedInUI();
}

async function tryAutoLogin(){
  const token = (() => { try { return localStorage.getItem("TOKEN") || ""; } catch { return ""; } })();
  if (!token) return;

  let res, data;
  try{
    res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` }});
    data = await res.json().catch(()=>({}));
  }catch{
    return;
  }
  if (!res.ok || !data.ok) return;

  SESSION.token = token;
  SESSION.email = data.profile.email;
  SESSION.user = data.profile.name;
  SESSION.org = data.profile.org;
  SESSION.role = data.profile.role;

  window.SESSION = SESSION;
  setLoggedInUI();
}

function connectWS(){
  try{
    if (WS && (WS.readyState === 0 || WS.readyState === 1)) return;
  }catch{}

  const token = SESSION.token;
  if (!token) return;

  const proto = location.protocol === "https:" ? "wss" : "ws";
  const url = `${proto}://${location.host}/?token=${encodeURIComponent(token)}`;

  WS = new WebSocket(url);
  window.WS = WS;

  WS.onopen = () => {
    // optional
  };

  WS.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    // Dispatch to modules
    if (msg.type === "incidents:update") {
      window.__INCIDENTS = msg.payload || [];
      if (window.Einsaetze && window.Einsaetze.onIncidents) window.Einsaetze.onIncidents(window.__INCIDENTS);
    }
  };

  WS.onclose = () => {
    // reconnect
    setTimeout(() => connectWS(), 1200);
  };
}

tryAutoLogin();
