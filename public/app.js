const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const inEmail = document.getElementById("inEmail");
const inPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");

const who = document.getElementById("who");
const tabsEl = document.getElementById("tabs");

const pwModal = document.getElementById("pwModal");
const pwClose = document.getElementById("pwClose");
const oldPw = document.getElementById("oldPw");
const newPw = document.getElementById("newPw");
const pwSave = document.getElementById("pwSave");
const pwMsg = document.getElementById("pwMsg");

let SESSION = {
  token: null,
  user: null
};

let WS = null;

btnLogin.addEventListener("click", doLogin);
btnLogout.addEventListener("click", doLogout);

[inEmail, inPass].forEach(el => el.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
}));

pwClose.onclick = () => (pwModal.style.display = "none");
pwModal.onclick = (e) => { if (e.target === pwModal) pwModal.style.display = "none"; };
pwSave.onclick = doChangePassword;

function setView(v) {
  document.querySelectorAll(".view").forEach(s => (s.style.display = "none"));
  const el = document.getElementById("view-" + v);
  if (el) el.style.display = "block";

  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === v));
}

function buildTabs() {
  const role = SESSION.user.role;

  const base = [
    { id: "profil", label: "Profil" },
    { id: "rechner", label: "Strafrechner" },
    { id: "personen", label: "Personen" },
    { id: "fahrzeuge", label: "Fahrzeuge" },
  ];

  // Leader + Admin can see HR to manage users in org
  if (role === "leader" || role === "admin") base.push({ id: "hr", label: "HR" });

  // Admin only
  if (role === "admin") base.push({ id: "admin", label: "Admin" });

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

async function api(path, opts = {}) {
  const headers = opts.headers || {};
  if (SESSION.token) headers["Authorization"] = "Bearer " + SESSION.token;
  headers["Content-Type"] = "application/json";
  const res = await fetch(path, { ...opts, headers });
  let data = null;
  try { data = await res.json(); } catch {}
  return { res, data };
}

async function doLogin() {
  loginMsg.textContent = "";

  const email = (inEmail.value || "").trim();
  const pass = (inPass.value || "").trim();

  if (!email) {
    loginMsg.textContent = "Bitte E-Mail eingeben.";
    return;
  }

  const { res, data } = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, pass })
  }).catch(() => ({ res: null, data: null }));

  if (!res || !res.ok || !data?.ok) {
    loginMsg.textContent = "Login fehlgeschlagen.";
    return;
  }

  SESSION.token = data.token;
  SESSION.user = data.user;

  localStorage.setItem("SESSION_TOKEN", SESSION.token);

  loginView.style.display = "none";
  appView.style.display = "block";

  who.textContent = `${SESSION.user.name || SESSION.user.email} • ${SESSION.user.org} • ${SESSION.user.role}`;

  buildTabs();

  // mount modules
  Profile.mount(document.getElementById("view-profil"), SESSION);
  Rechner.mount(document.getElementById("view-rechner"), SESSION);
  Personen.mount(document.getElementById("view-personen"), SESSION);
  Fahrzeuge.mount(document.getElementById("view-fahrzeuge"), SESSION);
  if (SESSION.user.role === "leader" || SESSION.user.role === "admin") HR.mount(document.getElementById("view-hr"), SESSION);
  if (SESSION.user.role === "admin") Admin.mount(document.getElementById("view-admin"), SESSION);

  // websocket
  connectWS();

  // If generated password returned -> show it once and force change
  if (data.generatedPass) {
    pwModal.style.display = "flex";
    pwMsg.style.color = "var(--muted)";
    pwMsg.textContent = `Generiertes Passwort (einmalig): ${data.generatedPass}  —  Jetzt bitte ändern.`;
    oldPw.value = data.generatedPass;
    newPw.value = "";
  } else if (data.mustChangePass) {
    pwModal.style.display = "flex";
    pwMsg.style.color = "var(--muted)";
    pwMsg.textContent = "Bitte Passwort ändern.";
    oldPw.value = "";
    newPw.value = "";
  }
}

async function doChangePassword() {
  pwMsg.textContent = "";

  const oldPass = (oldPw.value || "").trim();
  const newPass = (newPw.value || "").trim();

  if (!newPass || newPass.length < 6) {
    pwMsg.textContent = "Neues Passwort ist zu kurz.";
    return;
  }

  const { res, data } = await api("/api/change-password", {
    method: "POST",
    body: JSON.stringify({ oldPass, newPass })
  });

  if (!res.ok || !data?.ok) {
    pwMsg.textContent = "Passwort konnte nicht geändert werden.";
    return;
  }

  pwMsg.style.color = "var(--muted)";
  pwMsg.textContent = "Passwort geändert.";
  setTimeout(() => (pwModal.style.display = "none"), 500);
}

async function doLogout() {
  try { await api("/api/logout", { method: "POST", body: "{}" }); } catch {}
  localStorage.removeItem("SESSION_TOKEN");
  location.reload();
}

// Auto-login if token exists (best-effort)
(async function bootstrap() {
  const t = localStorage.getItem("SESSION_TOKEN");
  if (!t) return;
  SESSION.token = t;

  // token is only server-memory; on restart it will fail => go back to login
  const { res, data } = await api("/api/org/overview").catch(() => ({ res: null, data: null }));
  if (!res || !res.ok || !data?.ok) {
    localStorage.removeItem("SESSION_TOKEN");
    return;
  }

  // no user info from that endpoint; re-login silently not possible.
  // Keep it simple: force login screen.
  localStorage.removeItem("SESSION_TOKEN");
})();

function connectWS() {
  try {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    WS = new WebSocket(`${proto}://${location.host}`);
  } catch {
    return;
  }

  WS.onopen = () => {
    WS.send(JSON.stringify({ type: "auth", token: SESSION.token }));
  };

  WS.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }

    if (msg.type === "laws") {
      // update local cache
      localStorage.setItem("LAWS_CACHE", JSON.stringify(msg.laws));
      Rechner.onLawsUpdate?.(msg.laws);
    }

    if (msg.type === "audit") {
      Admin.onAudit?.(msg.entry);
    }
  };

  WS.onclose = () => {
    // optional reconnect
  };
}
