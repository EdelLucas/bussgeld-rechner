// public/app.js

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const inUser = document.getElementById("inUser");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");
const who = document.getElementById("who");
const tabsEl = document.getElementById("tabs");

// Globale Session (Multi-Orga)
let SESSION = {
  user: null,
  role: null,
  token: null,
  org: null,
  orgName: null,
  ws: null
};

// Helper: Token-Request
window.apiFetch = async function apiFetch(url, opts = {}) {
  const headers = Object.assign({}, opts.headers || {});
  if (SESSION.token) headers["Authorization"] = `Bearer ${SESSION.token}`;
  if (!headers["Content-Type"] && opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { ...opts, headers });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { res, data };
};

btnLogin.addEventListener("click", doLogin);
btnLogout.addEventListener("click", () => {
  try { SESSION.ws?.close(); } catch {}
  location.reload();
});

// Enter-Handling
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
  // Tabs für alle
  const base = [
    { id: "leitstelle", label: "Leitstelle" },
    { id: "rechner", label: "Strafkatalog" },
    { id: "personen", label: "Personen" },
    { id: "fahrzeuge", label: "Fahrzeuge" },
  ];

  // Admin-only (global)
  if (SESSION.role === "admin") {
    base.push({ id: "hr", label: "HR" });
    base.push({ id: "admin", label: "Admin" });
  }

  // Leader optional: Wenn du HR auch für Leader willst, hier aktivieren:
  // if (SESSION.role === "leader") base.push({ id: "hr", label: "HR" });

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

function connectWS() {
  if (!SESSION.token) return;

  try {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${location.host}/ws?token=${encodeURIComponent(SESSION.token)}`;
    const ws = new WebSocket(wsUrl);
    SESSION.ws = ws;

    ws.onopen = () => {
      // ok
    };

    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }

      // Debug (optional)
      // console.log("WS:", msg);

      // Orga-spezifische Live Updates (wenn du Module später daran anschließt)
      if (msg.type === "units") {
        window.dispatchEvent(new CustomEvent("ws:units", { detail: msg.units }));
      }
      if (msg.type === "persons") {
        window.dispatchEvent(new CustomEvent("ws:persons", { detail: msg.persons }));
      }
      if (msg.type === "vehicles") {
        window.dispatchEvent(new CustomEvent("ws:vehicles", { detail: msg.vehicles }));
      }
    };

    ws.onclose = () => {
      // Reconnect light (optional)
      // Falls du keinen Reconnect willst: rausnehmen
      setTimeout(() => {
        if (SESSION.token) connectWS();
      }, 2000);
    };
  } catch {
    // WS optional, kein harter Fehler
  }
}

async function doLogin() {
  loginMsg.textContent = "";
  const u = (inUser.value || "").trim();
  const p = (inPass.value || "").trim();

  if (!u || !p) {
    loginMsg.textContent = "Bitte Benutzer und Passwort eingeben.";
    return;
  }

  let res, data;
  try {
    ({ res, data } = await window.apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ u, p })
    }));
  } catch {
    loginMsg.textContent = "Backend nicht erreichbar.";
    return;
  }

  if (!res.ok || !data || !data.ok) {
    loginMsg.textContent = "Login fehlgeschlagen.";
    return;
  }

  SESSION.user = data.user;
  SESSION.role = data.role;
  SESSION.token = data.token;
  SESSION.org = data.org || null;
  SESSION.orgName = data.orgName || data.org || null;

  // global verfügbar (für Module falls nötig)
  window.SESSION_USER = SESSION.user;
  window.SESSION_ROLE = SESSION.role;
  window.SESSION_TOKEN = SESSION.token;
  window.SESSION_ORG = SESSION.org;
  window.SESSION_ORG_NAME = SESSION.orgName;

  // UI wechseln
  loginView.style.display = "none";
  appView.style.display = "block";
  who.textContent = `Angemeldet als ${SESSION.user} (${SESSION.role}) • ${SESSION.orgName || SESSION.org || "-"}`;

  // Tabs & Views
  buildTabs();

  // Module mounten (nur wenn vorhanden)
  if (window.Leitstelle) window.Leitstelle.mount(document.getElementById("view-leitstelle"));
  if (window.Rechner) window.Rechner.mount(document.getElementById("view-rechner"));
  if (window.Personen) window.Personen.mount(document.getElementById("view-personen"));
  if (window.Fahrzeuge) window.Fahrzeuge.mount(document.getElementById("view-fahrzeuge"));

  if (SESSION.role === "admin") {
    if (window.HR) window.HR.mount(document.getElementById("view-hr"));
    if (window.Admin) window.Admin.mount(document.getElementById("view-admin"));
  }

  // WebSocket Live-Sync (optional)
  connectWS();
}
