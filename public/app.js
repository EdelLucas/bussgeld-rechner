const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const inUser = document.getElementById("inUser");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");
const who = document.getElementById("who");
const tabsEl = document.getElementById("tabs");

let SESSION = { user: null, role: null, token: null };

btnLogin.addEventListener("click", doLogin);
btnLogout.addEventListener("click", () => location.reload());

[inUser, inPass].forEach(el => el.addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
}));

function setView(v) {
  document.querySelectorAll(".view").forEach(s => s.style.display = "none");
  const el = document.getElementById("view-" + v);
  if (el) el.style.display = "block";
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === v));
}

function buildTabs() {
  const base = [
    { id: "leitstelle", label: "Leitstelle" },
    { id: "rechner", label: "Strafrechner" },
    { id: "personen", label: "Personen" },
    { id: "fahrzeuge", label: "Fahrzeuge" },
  ];
  if (SESSION.role === "admin") base.push({ id: "admin", label: "Admin" });

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

async function doLogin() {
  loginMsg.textContent = "";
  const u = inUser.value.trim();
  const p = inPass.value.trim();

  if (!u || !p) {
    loginMsg.textContent = "Bitte Benutzer und Passwort eingeben.";
    return;
  }

  let res, data;
  try {
    res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ u, p })
    });
    data = await res.json().catch(() => ({}));
  } catch (e) {
    loginMsg.textContent = "Backend nicht erreichbar.";
    return;
  }

  if (!res.ok || !data.ok) {
    loginMsg.textContent = "Login fehlgeschlagen: " + (data.reason || "unknown");
    return;
  }

  SESSION.user = data.user;
  SESSION.role = data.role;
  SESSION.token = data.token;

  window.SESSION_TOKEN = data.token;
  window.SESSION_ROLE = data.role;
  window.SESSION_USER = data.user;

  loginView.style.display = "none";
  appView.style.display = "block";
  who.textContent = `Angemeldet als ${SESSION.user} (${SESSION.role})`;

  buildTabs();

  // mount modules (wenn vorhanden)
  if (window.Leitstelle) window.Leitstelle.mount(document.getElementById("view-leitstelle"));
  if (window.Rechner) window.Rechner.mount(document.getElementById("view-rechner"));
  if (window.Personen) window.Personen.mount(document.getElementById("view-personen"));
  if (window.Fahrzeuge) window.Fahrzeuge.mount(document.getElementById("view-fahrzeuge"));
  if (SESSION.role === "admin" && window.Admin) window.Admin.mount(document.getElementById("view-admin"));
}
