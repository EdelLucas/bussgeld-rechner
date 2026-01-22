const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const { nanoid } = require("nanoid");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || "data.sqlite";
const COOKIE_NAME = process.env.COOKIE_NAME || "grandlst_session";
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_SUPER_SECRET";

const SUPER_ADMIN_EMAIL = "grand-lst.admin@lokal.de";
const SUPER_ADMIN_PASS = "k34w6mP58Fg";

// ---------------- JWT (minimal) ----------------
function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function signJWT(payload, expSeconds = 60 * 60 * 12) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expSeconds };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(body));
  const data = `${h}.${p}`;
  const sig = b64url(crypto.createHmac("sha256", JWT_SECRET).update(data).digest());
  return `${data}.${sig}`;
}
function verifyJWT(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const sig = b64url(crypto.createHmac("sha256", JWT_SECRET).update(data).digest());
  if (sig !== s) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) return null;
  return payload;
}

const nowMs = () => Date.now();

// ---------------- DB ----------------
const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT NOT NULL,            -- SUPER_ADMIN / ORG_LEADER / MEMBER
  passwordHash TEXT,
  mustChangePw INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt INTEGER NOT NULL,
  lastLoginAt INTEGER,
  UNIQUE(orgId, email)
);

CREATE TABLE IF NOT EXISTS dispatch_state (
  orgId TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  updatedAt INTEGER NOT NULL,
  updatedByUserId TEXT
);

CREATE TABLE IF NOT EXISTS persons (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL,
  plate TEXT NOT NULL,
  model TEXT,
  note TEXT,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY,
  orgId TEXT,
  actorUserId TEXT,
  action TEXT NOT NULL,
  detailJson TEXT,
  ip TEXT,
  userAgent TEXT,
  createdAt INTEGER NOT NULL
);
`);

function audit(req, orgId, actorUserId, action, detail) {
  const id = "aud_" + nanoid(12);
  db.prepare(`
    INSERT INTO audit (id, orgId, actorUserId, action, detailJson, ip, userAgent, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    orgId || null,
    actorUserId || null,
    action,
    detail ? JSON.stringify(detail) : null,
    req?.ip || null,
    req?.headers?.["user-agent"] || null,
    nowMs()
  );
}

// ---------------- Seed Orgs + Super Admin ----------------
const ORGS = [
  { code: "LSPD", name: "Los Santos Police Department" },
  { code: "FIB", name: "Federal Investigation Bureau" },
  { code: "NG", name: "National Guard" },
  { code: "LI", name: "Los Santos Industries" },
  { code: "EMS", name: "Emergency Medical Services" },
  { code: "GOV", name: "Government" },
  { code: "SAHP", name: "San Andreas Highway Patrol" }
];

const getOrgByCode = db.prepare(`SELECT * FROM orgs WHERE code=?`);
const insOrg = db.prepare(`INSERT INTO orgs (id, code, name, isActive, createdAt) VALUES (?, ?, ?, 1, ?)`);

for (const o of ORGS) {
  if (!getOrgByCode.get(o.code)) {
    insOrg.run("org_" + nanoid(12), o.code, o.name, nowMs());
  }
}

// Super Admin liegt in GOV (System)
const gov = getOrgByCode.get("GOV");
const getSuper = db.prepare(`SELECT * FROM users WHERE lower(email)=lower(?) AND role='SUPER_ADMIN'`).get(SUPER_ADMIN_EMAIL);

if (!getSuper) {
  const hash = bcrypt.hashSync(SUPER_ADMIN_PASS, 12);
  db.prepare(`
    INSERT INTO users (id, orgId, email, name, phone, role, passwordHash, mustChangePw, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, 'SUPER_ADMIN', ?, 0, 1, ?)
  `).run("usr_" + nanoid(12), gov.id, SUPER_ADMIN_EMAIL.toLowerCase(), "System Admin", "", hash, nowMs());
}

// Default Dispatch State pro Orga (wenn leer)
function ensureDispatchState(orgId) {
  const row = db.prepare(`SELECT json FROM dispatch_state WHERE orgId=?`).get(orgId);
  if (row) return;
  const initial = {
    units: [],      // {id, callsign, members, status, updatedAt, updatedBy}
    incidents: []   // optional später
  };
  db.prepare(`
    INSERT INTO dispatch_state (orgId, json, updatedAt, updatedByUserId)
    VALUES (?, ?, ?, ?)
  `).run(orgId, JSON.stringify(initial), nowMs(), null);
}
for (const o of ORGS) ensureDispatchState(getOrgByCode.get(o.code).id);

// ---------------- Express ----------------
const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 900 }));

app.use(express.static(path.join(__dirname, "public")));

// ---------------- Auth helpers ----------------
function getUserFromReq(req) {
  const token = req.cookies[COOKIE_NAME];
  const payload = verifyJWT(token);
  if (!payload?.uid) return null;
  const u = db.prepare(`SELECT id, orgId, email, name, phone, role, mustChangePw, isActive FROM users WHERE id=?`).get(payload.uid);
  if (!u || !u.isActive) return null;
  return u;
}
function requireAuth(req, res, next) {
  const u = getUserFromReq(req);
  if (!u) return res.status(401).json({ ok: false, error: "UNAUTH" });
  req.user = u;
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "UNAUTH" });
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ ok: false, error: "FORBIDDEN" });
  };
}

// ---------------- API ----------------
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Login: akzeptiert {email,password} UND {u,p}
app.post("/api/login", async (req, res) => {
  const email = String(req.body?.email || req.body?.u || "").trim().toLowerCase();
  const password = String(req.body?.password || req.body?.p || "");

  if (!email || !password) return res.status(400).json({ ok: false, error: "MISSING" });

  const user = db.prepare(`SELECT * FROM users WHERE lower(email)=? AND isActive=1`).get(email);
  if (!user || !user.passwordHash) return res.status(401).json({ ok: false, error: "BAD_LOGIN" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: "BAD_LOGIN" });

  db.prepare(`UPDATE users SET lastLoginAt=? WHERE id=?`).run(nowMs(), user.id);

  const token = signJWT({ uid: user.id });

  // secure cookie nur wenn https (Render) oder forwarded proto https
  const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: !!isHttps
  });

  audit(req, user.orgId, user.id, "LOGIN", { email });
  res.json({ ok: true });
});

app.post("/api/logout", requireAuth, (req, res) => {
  res.clearCookie(COOKIE_NAME);
  audit(req, req.user.orgId, req.user.id, "LOGOUT");
  res.json({ ok: true });
});

app.post("/api/change-password", requireAuth, async (req, res) => {
  const oldPw = String(req.body?.oldPassword || "");
  const newPw = String(req.body?.newPassword || "");
  if (newPw.length < 6) return res.status(400).json({ ok: false, error: "PW_TOO_SHORT" });

  const row = db.prepare(`SELECT * FROM users WHERE id=?`).get(req.user.id);
  if (!row?.passwordHash) return res.status(400).json({ ok: false, error: "NO_PW" });

  const ok = await bcrypt.compare(oldPw, row.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: "BAD_OLD" });

  const hash = await bcrypt.hash(newPw, 12);
  db.prepare(`UPDATE users SET passwordHash=?, mustChangePw=0 WHERE id=?`).run(hash, req.user.id);

  audit(req, req.user.orgId, req.user.id, "CHANGE_PASSWORD");
  res.json({ ok: true });
});

// ---- Dispatch (Leitstelle) ----
app.get("/api/dispatch", requireAuth, (req, res) => {
  const row = db.prepare(`SELECT json FROM dispatch_state WHERE orgId=?`).get(req.user.orgId);
  res.json({ ok: true, state: row ? JSON.parse(row.json) : null });
});

// Jeder eingeloggte darf units ändern (innerhalb ORGA).
// Reset/Globale Änderungen später nur Leader/Admin – das hier ist die Basis.
app.post("/api/dispatch/set", requireAuth, (req, res) => {
  const state = req.body?.state || { units: [], incidents: [] };
  const json = JSON.stringify(state);

  db.prepare(`
    INSERT INTO dispatch_state (orgId, json, updatedAt, updatedByUserId)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(orgId) DO UPDATE SET json=excluded.json, updatedAt=excluded.updatedAt, updatedByUserId=excluded.updatedByUserId
  `).run(req.user.orgId, json, nowMs(), req.user.id);

  audit(req, req.user.orgId, req.user.id, "DISPATCH_SET");
  broadcastOrg(req.user.orgId, { type: "dispatch:update", state: JSON.parse(json) });
  res.json({ ok: true });
});

// ---- Personen (nur Übersicht im Frontend, aber API liefert Liste) ----
app.get("/api/persons", requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT id, name, note, createdAt FROM persons WHERE orgId=? ORDER BY createdAt DESC`).all(req.user.orgId);
  res.json({ ok: true, persons: rows });
});

// ---- Fahrzeuge (nur Übersicht) ----
app.get("/api/vehicles", requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT id, plate, model, note, createdAt FROM vehicles WHERE orgId=? ORDER BY createdAt DESC`).all(req.user.orgId);
  res.json({ ok: true, vehicles: rows });
});

// ---- HR: ORG_LEADER + SUPER_ADMIN darf User erstellen (innerhalb org) ----
function generateTempPassword() {
  // gut genug als temp pw
  return nanoid(10);
}

app.get("/api/hr/users", requireAuth, requireRole("ORG_LEADER", "SUPER_ADMIN"), (req, res) => {
  let orgId = req.user.orgId;
  if (req.user.role === "SUPER_ADMIN" && req.query.orgId) orgId = String(req.query.orgId);

  const users = db.prepare(`
    SELECT id, email, name, phone, role, mustChangePw, isActive, createdAt, lastLoginAt
    FROM users WHERE orgId=? ORDER BY createdAt DESC
  `).all(orgId);

  res.json({ ok: true, users, orgId });
});

app.get("/api/hr/orgs", requireAuth, requireRole("SUPER_ADMIN", "ORG_LEADER"), (req, res) => {
  const rows = db.prepare(`SELECT id, code, name, isActive FROM orgs ORDER BY code ASC`).all();
  res.json({ ok: true, orgs: rows });
});

app.post("/api/hr/create-user", requireAuth, requireRole("ORG_LEADER", "SUPER_ADMIN"), async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const name = String(req.body?.name || "").trim();
  const phone = String(req.body?.phone || "").trim();
  const role = String(req.body?.role || "MEMBER").trim().toUpperCase();
  const orgCode = String(req.body?.orgCode || "").trim().toUpperCase();

  if (!email || !orgCode) return res.status(400).json({ ok: false, error: "MISSING" });
  if (!["MEMBER", "ORG_LEADER"].includes(role) && req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ ok: false, error: "FORBIDDEN_ROLE" });
  }

  const org = getOrgByCode.get(orgCode);
  if (!org || !org.isActive) return res.status(404).json({ ok: false, error: "ORG_NOT_FOUND" });

  // Leader darf nur in eigener Org erstellen
  if (req.user.role === "ORG_LEADER" && org.id !== req.user.orgId) {
    return res.status(403).json({ ok: false, error: "CROSS_ORG" });
  }

  const exists = db.prepare(`SELECT 1 FROM users WHERE orgId=? AND lower(email)=lower(?)`).get(org.id, email);
  if (exists) return res.status(409).json({ ok: false, error: "USER_EXISTS" });

  const tempPw = generateTempPassword();
  const hash = await bcrypt.hash(tempPw, 12);

  const id = "usr_" + nanoid(12);
  db.prepare(`
    INSERT INTO users (id, orgId, email, name, phone, role, passwordHash, mustChangePw, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
  `).run(id, org.id, email, name || null, phone || null, role, hash, nowMs());

  audit(req, org.id, req.user.id, "HR_CREATE_USER", { email, role, orgCode });
  res.json({ ok: true, tempPassword: tempPw });
});

app.post("/api/hr/set-active", requireAuth, requireRole("ORG_LEADER", "SUPER_ADMIN"), (req, res) => {
  const userId = String(req.body?.userId || "");
  const active = !!req.body?.active;

  const u = db.prepare(`SELECT id, orgId FROM users WHERE id=?`).get(userId);
  if (!u) return res.status(404).json({ ok: false });

  if (req.user.role === "ORG_LEADER" && u.orgId !== req.user.orgId) {
    return res.status(403).json({ ok: false, error: "CROSS_ORG" });
  }

  db.prepare(`UPDATE users SET isActive=? WHERE id=?`).run(active ? 1 : 0, userId);
  audit(req, u.orgId, req.user.id, "HR_SET_ACTIVE", { userId, active });
  res.json({ ok: true });
});

// SUPER_ADMIN: Orgs/alles übergreifend + Audit lesen
app.get("/api/admin/audit", requireAuth, requireRole("SUPER_ADMIN"), (req, res) => {
  const rows = db.prepare(`
    SELECT id, orgId, actorUserId, action, detailJson, createdAt
    FROM audit ORDER BY createdAt DESC LIMIT 200
  `).all();
  res.json({ ok: true, audit: rows });
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------------- WebSocket ----------------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const socketMeta = new Map(); // ws -> {orgId, userId, role}
function wsSend(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch {}
}
function broadcastOrg(orgId, obj) {
  for (const [ws, meta] of socketMeta.entries()) {
    if (meta?.orgId === orgId && ws.readyState === WebSocket.OPEN) wsSend(ws, obj);
  }
}

wss.on("connection", (ws, req) => {
  socketMeta.set(ws, null);

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw || "")); } catch { return; }

    if (msg.type === "auth") {
      // Cookie aus Header lesen
      const cookie = String(req.headers.cookie || "");
      const pair = cookie.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE_NAME + "="));
      if (!pair) return wsSend(ws, { type: "auth", ok: false });

      const token = decodeURIComponent(pair.split("=")[1] || "");
      const payload = verifyJWT(token);
      if (!payload?.uid) return wsSend(ws, { type: "auth", ok: false });

      const u = db.prepare(`SELECT id, orgId, role, isActive FROM users WHERE id=?`).get(payload.uid);
      if (!u || !u.isActive) return wsSend(ws, { type: "auth", ok: false });

      socketMeta.set(ws, { orgId: u.orgId, userId: u.id, role: u.role });

      // initial dispatch
      const row = db.prepare(`SELECT json FROM dispatch_state WHERE orgId=?`).get(u.orgId);
      wsSend(ws, { type: "auth", ok: true });
      wsSend(ws, { type: "dispatch:init", state: row ? JSON.parse(row.json) : null });
      return;
    }

    const meta = socketMeta.get(ws);
    if (!meta) return;

    // dispatch update via ws
    if (msg.type === "dispatch:set") {
      const state = msg.state || { units: [], incidents: [] };
      const json = JSON.stringify(state);

      db.prepare(`
        INSERT INTO dispatch_state (orgId, json, updatedAt, updatedByUserId)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(orgId) DO UPDATE SET json=excluded.json, updatedAt=excluded.updatedAt, updatedByUserId=excluded.updatedByUserId
      `).run(meta.orgId, json, nowMs(), meta.userId);

      broadcastOrg(meta.orgId, { type: "dispatch:update", state });
      return;
    }
  });

  ws.on("close", () => socketMeta.delete(ws));
});

server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
