const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const inEmail = document.getElementById("inEmail");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");

const who = document.getElementById("who");
const tabsEl = document.getElementById("tabs");

let SESSION = { user:null, role:null, org:null, email:null, token:null };
let CURRENT_VIEW = "profil";

btnLogin.addEventListener("click", doLogin);
btnLogout.addEventListener("click", () => {
  try { localStorage.removeItem("TOKEN"); } catch {}
  location.reload();
});
[inEmail,inPass].forEach(el => el.addEventListener("keydown", e => { if(e.key==="Enter") doLogin(); }));

function setView(v){
  CURRENT_VIEW = v;
  document.querySelectorAll(".view").forEach(s => s.style.display = "none");
  const el = document.getElementById("view-"+v);
  if(el) el.style.display = "block";
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === v));
}

function buildTabs(){
  const base = [
    { id:"profil", label:"Profil" },
    { id:"rechner", label:"Strafrechner" },
    { id:"personen", label:"Personen" },
    { id:"fahrzeuge", label:"Fahrzeuge" },
  ];
  if(SESSION.role === "admin") base.push({ id:"admin", label:"Admin" });

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

async function doLogin(){
  loginMsg.textContent = "";
  const email = (inEmail.value || "").trim();
  const password = (inPass.value || "").trim();
  if(!email || !password){
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

  if(!res.ok || !data.ok){
    loginMsg.textContent = "Login fehlgeschlagen.";
    return;
  }

  SESSION = {
    user: data.user,
    role: data.role,
    org: data.org,
    email: data.email || email,
    token: data.token
  };

  // global für Module
  window.SESSION = SESSION;

  try { localStorage.setItem("TOKEN", SESSION.token); } catch {}

  loginView.style.display = "none";
  appView.style.display = "block";
  who.textContent = `Angemeldet als ${SESSION.user} (${SESSION.role}) — ${SESSION.org}`;

  buildTabs();

  // mount modules
  Profil.mount(document.getElementById("view-profil"));
  Rechner.mount(document.getElementById("view-rechner"));
  Personen.mount(document.getElementById("view-personen"));
  Fahrzeuge.mount(document.getElementById("view-fahrzeuge"));
  if(SESSION.role === "admin") Admin.mount(document.getElementById("view-admin"));
}

// optional: auto-login mit Token (wenn du später /api/me baust)
// aktuell lassen wir es bewusst simpel (kein Auto-Login)
