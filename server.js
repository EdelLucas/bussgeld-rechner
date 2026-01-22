const express = require("express");
const path = require("path");
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const ORGS = ["LSPD", "FIB", "NG", "LI", "EMS", "GOV", "SAHP"];

// --------------------
// Simple JSON persistence
// --------------------
const DATA_FILE = path.join(__dirname, "data.json");

function safeReadJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}
function safeWriteJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("write json failed:", e);
  }
}

// --------------------
// DB (file based)
// --------------------
const DEFAULT_DB = {
  users: [
    // only admin exists initially
    {
      id: "u_admin",
      email: "grand-lst.admin@lokal.de",
      pass: "k34w6mP58Fg",
      role: "admin", // admin | leader | user
      org: "SYSTEM",
      name: "Grand LST Admin",
      phone: "",
      active: true,
      createdAt: Date.now(),
      lastLoginAt: null,
      mustChangePass: false
    }
  ],
  // org-scoped data
  orgData: ORGS.reduce((acc, o) => {
    acc[o] = {
      laws: null,      // set by default on first request
      persons: [],     // later
      vehicles: [],    // later
      audit: []        // server audit log
    };
    return acc;
  }, {}),
  sessions: {} // token -> { userId, createdAt }
};

let DB = safeReadJSON(DATA_FILE, DEFAULT_DB);

// Ensure orgData exists for all orgs (in case file older)
for (const o of ORGS) {
  DB.orgData[o] = DB.orgData[o] || { laws: null, persons: [], vehicles: [], audit: [] };
}
DB.sessions = DB.sessions || {};

// Save helper (throttled-ish)
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => safeWriteJSON(DATA_FILE, DB), 250);
}

// --------------------
// Utils
// --------------------
function rndToken(len = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function genPassword() {
  // readable
  return rndToken(10);
}
function nowISO() {
  return new Date().toISOString();
}

function pushAudit(org, actor, action, meta = {}) {
  const entry = {
    ts: Date.now(),
    iso: nowISO(),
    actor: actor || "system",
    action,
    meta
  };
  if (org && DB.orgData[org]) DB.orgData[org].audit.unshift(entry);
  // also store global audit on SYSTEM? optional
  scheduleSave();

  // websocket broadcast to org clients
  wsBroadcast(org, { type: "audit", entry });
}

function getUserByToken(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const s = DB.sessions[token];
  if (!s) return null;
  const u = DB.users.find(x => x.id === s.userId && x.active);
  return u || null;
}

function requireAuth(req, res, next) {
  const u = getUserByToken(req);
  if (!u) return res.status(401).json({ ok: false, error: "unauthorized" });
  req.user = u;
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ ok: false, error: "forbidden" });
  next();
}
function requireLeaderOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "leader")) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }
  next();
}

// --------------------
// Static frontend
// --------------------
app.use(express.static(path.join(__dirname, "public")));

// --------------------
// API: Auth
// --------------------

// Login flow:
// - email required
// - password optional:
//   - if user has no pass yet and only email is provided -> generate pass, set mustChangePass=true and return generatedPass once
//   - otherwise require pass match
app.post("/api/login", (req, res) => {
  const { email, pass } = req.body || {};
  const e = String(email || "").trim().toLowerCase();
  const p = String(pass || "").trim();

  if (!e) return res.status(400).json({ ok: false, error: "email_required" });

  const user = DB.users.find(u => (u.email || "").toLowerCase() === e && u.active);
  if (!user) return res.status(401).json({ ok: false, error: "login_failed" });

  // If password not set yet => allow email-only login to generate password (requested)
  if (!user.pass) {
    if (p) return res.status(401).json({ ok: false, error: "login_failed" });

    const newPass = genPassword();
    user.pass = newPass;
    user.mustChangePass = true;
    user.lastLoginAt = Date.now();

    const token = rndToken(48);
    DB.sessions[token] = { userId: user.id, createdAt: Date.now() };
    scheduleSave();

    pushAudit(user.org, user.email, "LOGIN_PASSWORD_GENERATED", { role: user.role });

    return res.json({
      ok: true,
      token,
      user: sanitizeUser(user),
      generatedPass: newPass,
      mustChangePass: true
    });
  }

  if (user.pass !== p) return res.status(401).json({ ok: false, error: "login_failed" });

  user.lastLoginAt = Date.now();
  const token = rndToken(48);
  DB.sessions[token] = { userId: user.id, createdAt: Date.now() };
  scheduleSave();

  pushAudit(user.org, user.email, "LOGIN", { role: user.role });

  res.json({ ok: true, token, user: sanitizeUser(user), mustChangePass: !!user.mustChangePass });
});

app.post("/api/logout", requireAuth, (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (token) delete DB.sessions[token];
  scheduleSave();
  pushAudit(req.user.org, req.user.email, "LOGOUT", {});
  res.json({ ok: true });
});

app.post("/api/change-password", requireAuth, (req, res) => {
  const { oldPass, newPass } = req.body || {};
  const o = String(oldPass || "").trim();
  const n = String(newPass || "").trim();

  if (!n || n.length < 6) return res.status(400).json({ ok: false, error: "weak_password" });

  const u = req.user;
  if (u.pass && u.pass !== o && u.mustChangePass !== true) {
    return res.status(401).json({ ok: false, error: "wrong_old_password" });
  }

  u.pass = n;
  u.mustChangePass = false;
  scheduleSave();

  pushAudit(u.org, u.email, "PASSWORD_CHANGED", {});
  res.json({ ok: true });
});

function sanitizeUser(u) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    org: u.org,
    name: u.name || "",
    phone: u.phone || "",
    active: !!u.active,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    mustChangePass: !!u.mustChangePass
  };
}

// --------------------
// API: Orga laws (org isolated)
// --------------------
app.get("/api/laws", requireAuth, (req, res) => {
  const org = req.user.role === "admin" ? (req.query.org || req.user.org) : req.user.org;
  if (req.user.role === "admin") {
    // admin can request any org, but not SYSTEM
    if (org && org !== "SYSTEM" && !DB.orgData[org]) return res.status(400).json({ ok: false, error: "bad_org" });
  }
  const o = org && org !== "SYSTEM" ? org : null;
  if (!o) return res.json({ ok: true, laws: null });

  res.json({ ok: true, laws: DB.orgData[o].laws });
});

app.post("/api/laws", requireAuth, requireLeaderOrAdmin, (req, res) => {
  const { org, laws } = req.body || {};
  const targetOrg = req.user.role === "admin" ? String(org || "").trim() : req.user.org;
  if (!ORGS.includes(targetOrg)) return res.status(400).json({ ok: false, error: "bad_org" });

  if (!Array.isArray(laws)) return res.status(400).json({ ok: false, error: "bad_laws" });

  DB.orgData[targetOrg].laws = laws;
  scheduleSave();

  pushAudit(targetOrg, req.user.email, "LAWS_UPDATED", { countCats: laws.length });
  wsBroadcast(targetOrg, { type: "laws", laws });

  res.json({ ok: true });
});

// --------------------
// API: Users / Admin + HR
// --------------------

// Admin: list all users
app.get("/api/admin/users", requireAuth, requireAdmin, (req, res) => {
  res.json({ ok: true, users: DB.users.map(sanitizeUser) });
});

// Admin: create leader (or HR user)
app.post("/api/admin/create-user", requireAuth, requireAdmin, (req, res) => {
  const { email, name, phone, org, role } = req.body || {};
  const e = String(email || "").trim().toLowerCase();
  const n = String(name || "").trim();
  const ph = String(phone || "").trim();
  const o = String(org || "").trim().toUpperCase();
  const r = String(role || "user").trim().toLowerCase();

  if (!e || !e.includes("@")) return res.status(400).json({ ok: false, error: "bad_email" });
  if (!ORGS.includes(o)) return res.status(400).json({ ok: false, error: "bad_org" });
  if (!["leader", "user"].includes(r)) return res.status(400).json({ ok: false, error: "bad_role" });

  const exists = DB.users.find(u => (u.email || "").toLowerCase() === e);
  if (exists) return res.status(409).json({ ok: false, error: "email_exists" });

  const id = "u_" + rndToken(12);
  DB.users.push({
    id,
    email: e,
    pass: null, // important: will be generated when user logs in with email only
    role: r,
    org: o,
    name: n,
    phone: ph,
    active: true,
    createdAt: Date.now(),
    lastLoginAt: null,
    mustChangePass: false
  });

  scheduleSave();
  pushAudit(o, req.user.email, "USER_CREATED", { email: e, role: r });

  res.json({ ok: true, user: sanitizeUser(DB.users.find(x => x.id === id)) });
});

// Leader: list org users
app.get("/api/org/users", requireAuth, requireLeaderOrAdmin, (req, res) => {
  const org = req.user.role === "admin" ? String(req.query.org || "").trim().toUpperCase() : req.user.org;
  if (!ORGS.includes(org)) return res.status(400).json({ ok: false, error: "bad_org" });

  const list = DB.users
    .filter(u => u.active && u.org === org && u.role !== "admin")
    .map(sanitizeUser);

  res.json({ ok: true, users: list });
});

// Leader/Admin: disable user
app.post("/api/org/disable-user", requireAuth, requireLeaderOrAdmin, (req, res) => {
  const { userId } = req.body || {};
  const id = String(userId || "").trim();
  const target = DB.users.find(u => u.id === id);
  if (!target) return res.status(404).json({ ok: false, error: "not_found" });

  const allowedOrg = req.user.role === "admin" ? true : target.org === req.user.org;
  if (!allowedOrg) return res.status(403).json({ ok: false, error: "forbidden" });
  if (target.role === "admin") return res.status(403).json({ ok: false, error: "forbidden" });

  target.active = false;
  scheduleSave();

  pushAudit(target.org, req.user.email, "USER_DISABLED", { email: target.email, role: target.role });
  res.json({ ok: true });
});

// Leader/Admin: reset password (set pass null -> user can generate by email-only login)
app.post("/api/org/reset-pass", requireAuth, requireLeaderOrAdmin, (req, res) => {
  const { userId } = req.body || {};
  const id = String(userId || "").trim();
  const target = DB.users.find(u => u.id === id);
  if (!target) return res.status(404).json({ ok: false, error: "not_found" });

  const allowedOrg = req.user.role === "admin" ? true : target.org === req.user.org;
  if (!allowedOrg) return res.status(403).json({ ok: false, error: "forbidden" });
  if (target.role === "admin") return res.status(403).json({ ok: false, error: "forbidden" });

  target.pass = null;
  target.mustChangePass = false;
  scheduleSave();

  pushAudit(target.org, req.user.email, "PASSWORD_RESET", { email: target.email });
  res.json({ ok: true });
});

// Audit log (org scoped)
app.get("/api/audit", requireAuth, (req, res) => {
  const org = req.user.role === "admin"
    ? String(req.query.org || req.user.org || "").trim().toUpperCase()
    : req.user.org;

  if (!ORGS.includes(org)) return res.status(400).json({ ok: false, error: "bad_org" });
  res.json({ ok: true, audit: DB.orgData[org].audit.slice(0, 200) });
});

// --------------------
// Minimal placeholder data endpoints for overview lists
// (you can expand later)
// --------------------
app.get("/api/org/overview", requireAuth, (req, res) => {
  const org = req.user.role === "admin"
    ? String(req.query.org || req.user.org || "").trim().toUpperCase()
    : req.user.org;

  if (!ORGS.includes(org)) return res.status(400).json({ ok: false, error: "bad_org" });

  res.json({
    ok: true,
    overview: {
      persons: DB.orgData[org].persons.length,
      vehicles: DB.orgData[org].vehicles.length,
      users: DB.users.filter(u => u.active && u.org === org).length
    }
  });
});

// --------------------
// Fallback
// --------------------
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// --------------------
// WebSocket live sync (org rooms)
// --------------------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const WS_CLIENTS = new Map(); // ws -> { userId, org }

function wsSend(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch {}
}
function wsBroadcast(org, obj) {
  for (const [ws, meta] of WS_CLIENTS.entries()) {
    if (meta && meta.org === org && ws.readyState === WebSocket.OPEN) {
      wsSend(ws, obj);
    }
  }
}

// simple auth on ws: client sends {type:"auth", token}
wss.on("connection", (ws) => {
  WS_CLIENTS.set(ws, { userId: null, org: null });

  ws.on("message", (msg) => {
    let data;
    try { data = JSON.parse(String(msg)); } catch { return; }

    if (data.type === "auth") {
      const token = String(data.token || "").trim();
      const s = DB.sessions[token];
      if (!s) return wsSend(ws, { type: "auth", ok: false });

      const user = DB.users.find(u => u.id === s.userId && u.active);
      if (!user) return wsSend(ws, { type: "auth", ok: false });

      WS_CLIENTS.set(ws, { userId: user.id, org: user.org });
      wsSend(ws, { type: "auth", ok: true, org: user.org, role: user.role });
      return;
    }

    // later: live events, calls, dispatch etc.
    // For now: ignore
  });

  ws.on("close", () => WS_CLIENTS.delete(ws));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
