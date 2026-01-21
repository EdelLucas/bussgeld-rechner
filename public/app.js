const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const inUser = document.getElementById("inUser");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");
const who = document.getElementById("who");
const tabsEl = document.getElementById("tabs");

let SESSION = { user:null, role:null };

btnLogin.addEventListener("click", doLogin);
btnLogout.addEventListener("click", () => {
  sessionStorage.removeItem("SESSION");
  location.reload();
});
[inUser,inPass].forEach(el => el.addEventListener("keydown", e => { if(e.key==="Enter") doLogin(); }));

function setView(v){
  document.querySelectorAll(".view").forEach(s => s.style.display = "none");
  const target = document.getElementById("view-"+v);
  if (target) target.style.display = "block";
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === v));
}

function buildTabs(){
  const base = [
    { id:"leitstelle", label:"Leitstelle" },
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

  setView("leitstelle");
}

function mountAll(){
  Leitstelle.mount(document.getElementById("view-leitstelle"));
  Rechner.mount(document.getElementById("view-rechner"));
  Personen.mount(document.getElementById("view-personen"));
  Fahrzeuge.mount(document.getElementById("view-fahrzeuge"));
  if(SESSION.role === "admin") Admin.mount(document.getElementById("view-admin"));
}

async function doLogin(){
  loginMsg.textContent = "";
  const u = inUser.value.trim();
  const p = inPass.value.trim();
  if(!u || !p){ loginMsg.textContent = "Bitte Benutzer und Passwort eingeben."; return; }

  let res, data;
  try{
    res = await fetch("/api/login", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ u, p })
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

  SESSION.user = data.user;
  SESSION.role = data.role;
  sessionStorage.setItem("SESSION", JSON.stringify(SESSION));

  loginView.style.display = "none";
  appView.style.display = "block";
  who.textContent = `Angemeldet als ${SESSION.user} (${SESSION.role})`;

  buildTabs();
  mountAll();
}

(function boot(){
  // Auto-Resume
  try{
    const raw = sessionStorage.getItem("SESSION");
    if(raw){
      const s = JSON.parse(raw);
      if(s && s.user && s.role){
        SESSION = s;
        loginView.style.display = "none";
        appView.style.display = "block";
        who.textContent = `Angemeldet als ${SESSION.user} (${SESSION.role})`;
        buildTabs();
        mountAll();
      }
    }
  }catch{}
})();
