const express = require("express");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");

// ===== ORGS =====
const ORGS = ["LSPD", "FIB", "NG", "LI", "EMS", "GOV", "SAHP"];

// ===== USERS (in-memory) =====
// role: admin | leader | user
// login via email + password
let USERS = [
  { id: crypto.randomUUID(), name: "System Admin", phone: "", email: "admin@grand-lst.local", password: "9999", role: "admin", org: "GOV", active: true },
  // Beispiel normaler User:
  { id: crypto.randomUUID(), name: "LSPD Officer", phone: "", email: "lspd@grand-lst.local", password: "1234", role: "user", org: "LSPD", active: true },
];

// ===== SESSIONS =====
const SESSIONS = new Map(); // token -> {uid, user, role, org, ts}
const TTL = 1000 * 60 * 60 * 24; // 24h

function makeToken() { return crypto.randomBytes(24).toString("hex"); }
function genPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function getSession(req) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!t) return null;
  const s = SESSIONS.get(t);
  if (!s) return null;
  if (Date.now() - s.ts > TTL) { SESSIONS.delete(t); return null; }
  return { ...s, token: t };
}

function requireAuth(req, res, next) {
  const s = getSession(req);
  if (!s) return res.status(401).json({ ok: false, reason: "unauthorized" });
  req.session = s;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session) return res.status(401).json({ ok: false });
  if (req.session.role !== "admin") return res.status(403).json({ ok: false, reason: "forbidden" });
  next();
}

// ===== ORG DB (in-memory, getrennt pro org) =====
const DB = { org: {} };
function ensureOrg(orgId) {
  if (!DB.org[orgId]) {
    DB.org[orgId] = { units: [], persons: [], vehicles: [], laws: null, audit: [] };
  }
  return DB.org[orgId];
}
function audit(orgId, actor, action, payload) {
  const o = ensureOrg(orgId);
  o.audit.unshift({ ts: Date.now(), actor, action, payload: payload ?? null });
  o.audit = o.audit.slice(0, 2000);
}

// ===== Static Frontend =====
app.use(express.static(PUBLIC_DIR));

// ===== Health =====
app.get("/health", (req, res) => res.json({ ok: true, time: Date.now() }));

// ===== Login (Email + Passwort) =====
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  const e = String(email || "").trim().toLowerCase();
  const p = String(password || "").trim();

  if (!e || !p) return res.status(400).json({ ok: false, reason: "missing_fields" });

  const user = USERS.find(u => u.active !== false && String(u.email).toLowerCase() === e && u.password === p);
  if (!user) return res.status(401).json({ ok: false, reason: "wrong_credentials" });

  // org init
  ensureOrg(user.org);

  const token = makeToken();
  SESSIONS.set(token, { uid: user.id, user: user.name, role: user.role, org: user.org, ts: Date.now() });

  res.json({
    ok: true,
    token,
    user: user.name,
    role: user.role,
    org: user.org,
    email: user.email,
  });
});

// ===== Profile (eigene Daten) =====
app.get("/api/profile", requireAuth, (req, res) => {
  const uid = req.session.uid;
  const u = USERS.find(x => x.id === uid);
  if (!u) return res.status(404).json({ ok: false });

  res.json({
    ok: true,
    profile: {
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      org: u.org,
      role: u.role,
      active: u.active !== false
    }
  });
});

// ===== Admin: Orgs =====
app.get("/api/admin/orgs", requireAuth, requireAdmin, (req, res) => {
  res.json({ ok: true, orgs: ORGS });
});

// ===== Admin: Leader anlegen =====
app.post("/api/admin/create-leader", requireAuth, requireAdmin, (req, res) => {
  const { name, phone, email, org } = req.body || {};
  const n = String(name || "").trim();
  const ph = String(phone || "").trim();
  const e = String(email || "").trim().toLowerCase();
  const o = String(org || "").trim().toUpperCase();

  if (!n || !e || !o) return res.status(400).json({ ok: false, reason: "missing_fields" });
  if (!ORGS.includes(o)) return res.status(400).json({ ok: false, reason: "invalid_org" });

  const exists = USERS.some(u => String(u.email).toLowerCase() === e);
  if (exists) return res.status(409).json({ ok: false, reason: "email_exists" });

  const pw = genPassword(10);

  const leader = {
    id: crypto.randomUUID(),
    name: n,
    phone: ph,
    email: e,
    password: pw,
    role: "leader",
    org: o,
    active: true
  };
  USERS.push(leader);
  ensureOrg(o);
  audit(o, req.session.user, "leader:create", { leaderEmail: e, leaderName: n });

  // Passwort nur einmal zurückgeben
  res.json({ ok: true, leader: { id: leader.id, name: leader.name, email: leader.email, phone: leader.phone, org: leader.org, role: leader.role }, generatedPassword: pw });
});

// ===== Admin: Leader-Liste =====
app.get("/api/admin/leaders", requireAuth, requireAdmin, (req, res) => {
  const leaders = USERS
    .filter(u => u.role === "leader")
    .map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, org: u.org, active: u.active !== false }));
  res.json({ ok: true, leaders });
});

// ===== ORG State (nur eigene org; admin optional via ?org=) =====
app.get("/api/state", requireAuth, (req, res) => {
  const s = req.session;
  const orgId = (s.role === "admin" && req.query.org) ? String(req.query.org).toUpperCase() : s.org;

  if (s.role !== "admin" && orgId !== s.org) return res.status(403).json({ ok: false });

  const o = ensureOrg(orgId);
  res.json({ ok: true, org: orgId, db: o });
});

// ===== WebSocket (Org-Rooms) =====
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

const ORG_CLIENTS = new Map(); // orgId -> Set(ws)

function broadcastOrg(orgId, msg) {
  const set = ORG_CLIENTS.get(orgId);
  if (!set) return;
  const data = JSON.stringify(msg);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const tok = url.searchParams.get("token");
  const sess = tok ? SESSIONS.get(tok) : null;

  if (!sess) {
    ws.send(JSON.stringify({ type: "error", reason: "unauthorized" }));
    ws.close();
    return;
  }

  const orgId = sess.org;
  if (!ORG_CLIENTS.has(orgId)) ORG_CLIENTS.set(orgId, new Set());
  ORG_CLIENTS.get(orgId).add(ws);

  ws.send(JSON.stringify({ type: "hello", ok: true, user: sess.user, role: sess.role, org: sess.org }));

  ws.on("close", () => {
    ORG_CLIENTS.get(orgId)?.delete(ws);
  });
});

// ===== SPA fallback =====
app.get("*", (req, res) => {
  if (path.extname(req.path)) return res.status(404).send("Not found");
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
