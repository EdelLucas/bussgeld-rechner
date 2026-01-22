const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ====== CONFIG ======
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1453855487937482894/dO3DP9IQw0xXnl6m62J4rqblUan0u38uya7zEJdtKgekuOXwe0oqdYiMfpGT6okIWSeg";

// Admin Zugang (nur der ist anfangs aktiv)
const BOOTSTRAP_ADMIN = {
  email: "grand-lst.admin@lokal.de",
  password: "k34w6mP58Fg",
  name: "Grand Admin",
  org: "GOV",
  role: "admin"
};

// Orgas fix
const ORGS = ["LSPD", "FIB", "NG", "LI", "EMS", "GOV", "SAHP"];

// ====== PERSISTENCE ======
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2), "utf8");
}

function nowISO() {
  return new Date().toISOString();
}

function rid() {
  return crypto.randomBytes(10).toString("hex");
}

function sha256(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

// ====== DB ======
let DB = loadData() || {
  users: [],
  persons: [],     // pro org getrennt
  vehicles: [],    // pro org getrennt
  incidents: [],   // pro org getrennt (Einsätze)
  audit: []        // serverseitig
};

// Bootstrap Admin wenn keine User existieren
if (!Array.isArray(DB.users) || DB.users.length === 0) {
  DB.users = [{
    id: rid(),
    email: BOOTSTRAP_ADMIN.email.toLowerCase(),
    passHash: sha256(BOOTSTRAP_ADMIN.password),
    name: BOOTSTRAP_ADMIN.name,
    org: BOOTSTRAP_ADMIN.org,
    role: BOOTSTRAP_ADMIN.role,
    phone: "",
    active: true,
    createdAt: nowISO(),
    mustChangePassword: false
  }];
  saveData();
}

// ====== AUTH TOKENS (in-memory sessions) ======
const SESSIONS = new Map(); // token -> { userId, createdAt }

function createToken(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  SESSIONS.set(token, { userId, createdAt: Date.now() });
  return token;
}

function getUserById(userId) {
  return DB.users.find(u => u.id === userId) || null;
}

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token || !SESSIONS.has(token)) return res.status(401).json({ ok: false, error: "unauthorized" });
  const session = SESSIONS.get(token);
  const user = getUserById(session.userId);
  if (!user || !user.active) return res.status(401).json({ ok: false, error: "unauthorized" });
  req.user = user;
  req.token = token;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const r = req.user?.role;
    if (!r || !roles.includes(r)) return res.status(403).json({ ok: false, error: "forbidden" });
    next();
  };
}

// ====== AUDIT + DISCORD ======
async function postDiscord(content) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: String(content).slice(0, 1900) })
    });
  } catch { /* ignore */ }
}

async function audit(user, action, meta = {}) {
  const entry = {
    id: rid(),
    ts: nowISO(),
    by: { id: user.id, email: user.email, name: user.name, org: user.org, role: user.role },
    action,
    meta
  };
  DB.audit.unshift(entry);
  DB.audit = DB.audit.slice(0, 5000);
  saveData();

  const msg = `🧾 **AUDIT**
**Zeit:** ${entry.ts}
**Von:** ${user.name} (${user.email}) [${user.org}/${user.role}]
**Aktion:** ${action}
**Meta:** \`${JSON.stringify(meta).slice(0, 900)}\``;
  await postDiscord(msg);
}

// ====== STATIC FRONTEND ======
app.use(express.static(path.join(__dirname, "public")));

// ====== API ======
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  const e = String(email || "").toLowerCase().trim();
  const p = String(password || "").trim();

  if (!e || !p) return res.status(400).json({ ok: false });

  const user = DB.users.find(u => u.email === e && u.active);
  if (!user) return res.status(401).json({ ok: false });

  if (user.passHash !== sha256(p)) return res.status(401).json({ ok: false });

  const token = createToken(user.id);
  res.json({
    ok: true,
    token,
    email: user.email,
    user: user.name,
    org: user.org,
    role: user.role
  });
});

app.get("/api/me", auth, (req, res) => {
  const u = req.user;
  res.json({
    ok: true,
    profile: {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone || "",
      org: u.org,
      role: u.role
    }
  });
});

app.get("/api/profile", auth, (req, res) => {
  const u = req.user;
  res.json({
    ok: true,
    profile: {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone || "",
      org: u.org,
      role: u.role
    }
  });
});

// ====== ORG DATA (read) ======
app.get("/api/persons", auth, (req, res) => {
  const org = req.user.org;
  res.json({ ok: true, persons: DB.persons.filter(p => p.org === org) });
});

app.get("/api/vehicles", auth, (req, res) => {
  const org = req.user.org;
  res.json({ ok: true, vehicles: DB.vehicles.filter(v => v.org === org) });
});

app.get("/api/incidents", auth, (req, res) => {
  const org = req.user.org;
  res.json({ ok: true, incidents: DB.incidents.filter(i => i.org === org) });
});

// ====== INCIDENTS CRUD (Admin only for now) ======
app.post("/api/incidents", auth, requireRole("admin"), async (req, res) => {
  const org = req.user.org;
  const { title, status, note } = req.body || {};
  const item = {
    id: rid(),
    org,
    title: String(title || "Einsatz").slice(0, 120),
    status: String(status || "OFFEN").slice(0, 40),
    note: String(note || "").slice(0, 1000),
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  DB.incidents.unshift(item);
  saveData();
  await audit(req.user, "INCIDENT_CREATE", { id: item.id, title: item.title, org });
  broadcastOrg(org, { type: "incidents:update", payload: DB.incidents.filter(i => i.org === org) });
  res.json({ ok: true, incident: item });
});

app.put("/api/incidents/:id", auth, requireRole("admin"), async (req, res) => {
  const org = req.user.org;
  const id = req.params.id;
  const item = DB.incidents.find(x => x.id === id && x.org === org);
  if (!item) return res.status(404).json({ ok: false });

  const { title, status, note } = req.body || {};
  if (title != null) item.title = String(title).slice(0, 120);
  if (status != null) item.status = String(status).slice(0, 40);
  if (note != null) item.note = String(note).slice(0, 1000);
  item.updatedAt = nowISO();

  saveData();
  await audit(req.user, "INCIDENT_UPDATE", { id, org });
  broadcastOrg(org, { type: "incidents:update", payload: DB.incidents.filter(i => i.org === org) });
  res.json({ ok: true });
});

app.delete("/api/incidents/:id", auth, requireRole("admin"), async (req, res) => {
  const org = req.user.org;
  const id = req.params.id;
  const before = DB.incidents.length;
  DB.incidents = DB.incidents.filter(x => !(x.id === id && x.org === org));
  if (DB.incidents.length === before) return res.status(404).json({ ok: false });
  saveData();
  await audit(req.user, "INCIDENT_DELETE", { id, org });
  broadcastOrg(org, { type: "incidents:update", payload: DB.incidents.filter(i => i.org === org) });
  res.json({ ok: true });
});

// ====== ADMIN: USERS + ROLES + HR ======
app.get("/api/admin/users", auth, requireRole("admin"), (req, res) => {
  res.json({
    ok: true,
    users: DB.users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      org: u.org,
      role: u.role,
      phone: u.phone || "",
      active: !!u.active,
      createdAt: u.createdAt
    })),
    orgs: ORGS
  });
});

app.post("/api/admin/users", auth, requireRole("admin"), async (req, res) => {
  const { email, name, org, role, phone } = req.body || {};
  const e = String(email || "").toLowerCase().trim();
  const n = String(name || "").trim();
  const o = String(org || "").trim().toUpperCase();
  const r = String(role || "user").trim().toLowerCase();
  const ph = String(phone || "").trim();

  if (!e || !n || !ORGS.includes(o)) return res.status(400).json({ ok: false, error: "invalid" });
  if (!["admin", "leader", "hr", "user"].includes(r)) return res.status(400).json({ ok: false, error: "role" });
  if (DB.users.some(u => u.email === e)) return res.status(409).json({ ok: false, error: "exists" });

  const generated = crypto.randomBytes(8).toString("base64url"); // initial PW
  const user = {
    id: rid(),
    email: e,
    passHash: sha256(generated),
    name: n,
    org: o,
    role: r,
    phone: ph,
    active: true,
    createdAt: nowISO(),
    mustChangePassword: false
  };
  DB.users.push(user);
  saveData();
  await audit(req.user, "USER_CREATE", { email: e, org: o, role: r });

  res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, org: user.org, role: user.role }, generatedPassword: generated });
});

app.put("/api/admin/users/:id", auth, requireRole("admin"), async (req, res) => {
  const id = req.params.id;
  const u = DB.users.find(x => x.id === id);
  if (!u) return res.status(404).json({ ok: false });

  const { name, org, role, phone, active } = req.body || {};
  if (name != null) u.name = String(name).trim();
  if (phone != null) u.phone = String(phone).trim();
  if (org != null) {
    const o = String(org).trim().toUpperCase();
    if (ORGS.includes(o)) u.org = o;
  }
  if (role != null) {
    const r = String(role).trim().toLowerCase();
    if (["admin", "leader", "hr", "user"].includes(r)) u.role = r;
  }
  if (active != null) u.active = !!active;

  saveData();
  await audit(req.user, "USER_UPDATE", { id, email: u.email });
  res.json({ ok: true });
});

app.post("/api/admin/reset", auth, requireRole("admin"), async (req, res) => {
  // Notfall Reset: löscht alles außer Users
  DB.persons = [];
  DB.vehicles = [];
  DB.incidents = [];
  saveData();
  await audit(req.user, "NOTFALL_RESET", {});
  broadcastAll({ type: "incidents:updateAll", payload: {} });
  res.json({ ok: true });
});

app.get("/api/admin/audit", auth, requireRole("admin"), (req, res) => {
  res.json({ ok: true, audit: DB.audit.slice(0, 200) });
});

// ====== FALLBACK ======
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== WEBSOCKET ======
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function wsSend(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch {}
}

function parseTokenFromUrl(url) {
  try {
    const u = new URL(url, "http://localhost");
    return u.searchParams.get("token") || "";
  } catch { return ""; }
}

const WS_CLIENTS = new Set();

function broadcastAll(msg) {
  for (const c of WS_CLIENTS) wsSend(c.ws, msg);
}

function broadcastOrg(org, msg) {
  for (const c of WS_CLIENTS) {
    if (c.org === org) wsSend(c.ws, msg);
  }
}

wss.on("connection", (ws, req) => {
  const token = parseTokenFromUrl(req.url || "");
  if (!token || !SESSIONS.has(token)) {
    ws.close();
    return;
  }
  const sess = SESSIONS.get(token);
  const user = getUserById(sess.userId);
  if (!user || !user.active) {
    ws.close();
    return;
  }

  const client = { ws, token, userId: user.id, org: user.org, role: user.role };
  WS_CLIENTS.add(client);

  // initial push
  wsSend(ws, { type: "hello", payload: { org: user.org, role: user.role, name: user.name } });
  wsSend(ws, { type: "incidents:update", payload: DB.incidents.filter(i => i.org === user.org) });

  ws.on("message", async (buf) => {
    let msg = null;
    try { msg = JSON.parse(buf.toString("utf8")); } catch { return; }
    if (!msg || typeof msg !== "object") return;

    // client->server (optional): ping
    if (msg.type === "ping") {
      wsSend(ws, { type: "pong", payload: Date.now() });
      return;
    }

    // Live actions: only admin for now
    if (msg.type === "incidents:create") {
      if (user.role !== "admin") return;
      const { title, status, note } = msg.payload || {};
      const item = {
        id: rid(),
        org: user.org,
        title: String(title || "Einsatz").slice(0, 120),
        status: String(status || "OFFEN").slice(0, 40),
        note: String(note || "").slice(0, 1000),
        createdAt: nowISO(),
        updatedAt: nowISO()
      };
      DB.incidents.unshift(item);
      saveData();
      await audit(user, "INCIDENT_CREATE_WS", { id: item.id });
      broadcastOrg(user.org, { type: "incidents:update", payload: DB.incidents.filter(i => i.org === user.org) });
      return;
    }

    if (msg.type === "incidents:update") {
      if (user.role !== "admin") return;
      const { id, patch } = msg.payload || {};
      const item = DB.incidents.find(x => x.id === id && x.org === user.org);
      if (!item) return;
      if (patch?.title != null) item.title = String(patch.title).slice(0, 120);
      if (patch?.status != null) item.status = String(patch.status).slice(0, 40);
      if (patch?.note != null) item.note = String(patch.note).slice(0, 1000);
      item.updatedAt = nowISO();
      saveData();
      await audit(user, "INCIDENT_UPDATE_WS", { id });
      broadcastOrg(user.org, { type: "incidents:update", payload: DB.incidents.filter(i => i.org === user.org) });
      return;
    }

    if (msg.type === "incidents:delete") {
      if (user.role !== "admin") return;
      const { id } = msg.payload || {};
      DB.incidents = DB.incidents.filter(x => !(x.id === id && x.org === user.org));
      saveData();
      await audit(user, "INCIDENT_DELETE_WS", { id });
      broadcastOrg(user.org, { type: "incidents:update", payload: DB.incidents.filter(i => i.org === user.org) });
      return;
    }
  });

  ws.on("close", () => {
    WS_CLIENTS.delete(client);
  });
});

server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
