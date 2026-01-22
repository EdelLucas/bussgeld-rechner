const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const Database = require("better-sqlite3");
const http = require("http");
const WebSocket = require("ws");

// ===== Config =====
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || "data.sqlite";
const COOKIE_NAME = process.env.COOKIE_NAME || "grandlst_session";
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_SUPER_SECRET"; // für prod unbedingt env setzen
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || ""; // optional

// ===== Minimal JWT (ohne lib) =====
const crypto = require("crypto");
function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function signJWT(payload, expSeconds = 60 * 60 * 8) {
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
  const parts = (token || "").split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const sig = b64url(crypto.createHmac("sha256", JWT_SECRET).update(data).digest());
  if (sig !== s) return null;
  const payload = JSON.parse(Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) return null;
  return payload;
}

// ===== DB init =====
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
  role TEXT NOT NULL,
  passwordHash TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt INTEGER NOT NULL,
  lastLoginAt INTEGER,
  FOREIGN KEY(orgId) REFERENCES orgs(id),
  UNIQUE(orgId, email)
);
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  tokenHash TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  usedAt INTEGER,
  createdByUserId TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY(orgId) REFERENCES orgs(id)
);
CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY,
  orgId TEXT,
  actorUserId TEXT,
  action TEXT NOT NULL,
  targetType TEXT,
  targetId TEXT,
  detailJson TEXT,
  ip TEXT,
  userAgent TEXT,
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS law_catalog (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  json TEXT NOT NULL,
  updatedByUserId TEXT NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY(orgId) REFERENCES orgs(id)
);
CREATE TABLE IF NOT EXISTS dispatch_state (
  orgId TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  updatedAt INTEGER NOT NULL,
  updatedByUserId TEXT
);
`);

// Seed orgs list
const ORGS = [
  { code: "LSPD", name: "Los Santos Police Department" },
  { code: "FIB", name: "Federal Investigation Bureau" },
  { code: "NG", name: "National Guard" },
  { code: "LI", name: "Los Santos Industries" },
  { code: "EMS", name: "Emergency Medical Services" },
  { code: "GOV", name: "Government" },
  { code: "SAHP", name: "San Andreas Highway Patrol" }
];
const nowMs = () => Date.now();

const getOrgByCode = db.prepare(`SELECT * FROM orgs WHERE code = ?`);
const insOrg = db.prepare(`INSERT INTO orgs (id, code, name, isActive, createdAt) VALUES (?, ?, ?, 1, ?)`);
for (const o of ORGS) {
  const ex = getOrgByCode.get(o.code);
  if (!ex) insOrg.run("org_" + nanoid(12), o.code, o.name, nowMs());
}

// Ensure SUPER_ADMIN exists (dein Admin)
const SUPER_ADMIN_EMAIL = "grand-lst.admin@lokal.de";
const SUPER_ADMIN_PASS = "k34w6mP58Fg";

const getAnyOrg = db.prepare(`SELECT id FROM orgs WHERE code = 'GOV'`).get(); // system-admin org fallback
const getSuper = db.prepare(`SELECT * FROM users WHERE email = ? AND role = 'SUPER_ADMIN'`).get(SUPER_ADMIN_EMAIL);
if (!getSuper) {
  const hash = bcrypt.hashSync(SUPER_ADMIN_PASS, 12);
  db.prepare(`
    INSERT INTO users (id, orgId, email, name, phone, role, passwordHash, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, 'SUPER_ADMIN', ?, 1, ?)
  `).run("usr_" + nanoid(12), getAnyOrg.id, SUPER_ADMIN_EMAIL, "System Admin", "", hash, nowMs());
}

// ===== Audit + optional Discord =====
async function discordLog(line) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: line.slice(0, 1800) })
    });
  } catch {}
}
function addAudit({ orgId, actorUserId, action, targetType, targetId, detail, req }) {
  const id = "aud_" + nanoid(12);
  const detailJson = detail ? JSON.stringify(detail) : null;
  db.prepare(`
    INSERT INTO audit (id, orgId, actorUserId, action, targetType, targetId, detailJson, ip, userAgent, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    orgId || null,
    actorUserId || null,
    action,
    targetType || null,
    targetId || null,
    detailJson,
    req?.ip || null,
    req?.headers?.["user-agent"] || null,
    nowMs()
  );
  discordLog(`🧾 **${action}** org=${orgId || "-"} actor=${actorUserId || "-"} target=${targetType || "-"}:${targetId || "-"}`);
}

// ===== Express =====
const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 600 }));

// Static frontend
app.use(express.static(path.join(__dirname, "public")));

// ===== Auth middleware =====
function getUserFromReq(req) {
  const token = req.cookies[COOKIE_NAME];
  const payload = verifyJWT(token);
  if (!payload) return null;
  const user = db.prepare(`SELECT id, orgId, email, name, phone, role, isActive FROM users WHERE id = ?`).get(payload.uid);
  if (!user || !user.isActive) return null;
  return user;
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

// ===== API =====

// whoami
app.get("/api/me", requireAuth, (req, res) => res.json({ ok: true, user: req.user }));

// login
app.post("/api/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) return res.status(400).json({ ok: false });

  const user = db.prepare(`SELECT * FROM users WHERE lower(email)=? AND isActive=1`).get(email);
  if (!user || !user.passwordHash) return res.status(401).json({ ok: false });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false });

  db.prepare(`UPDATE users SET lastLoginAt=? WHERE id=?`).run(nowMs(), user.id);

  const token = signJWT({ uid: user.id });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true // Render/https -> true
  });

  addAudit({ orgId: user.orgId, actorUserId: user.id, action: "LOGIN", req });
  res.json({ ok: true });
});

// logout
app.post("/api/logout", requireAuth, (req, res) => {
  res.clearCookie(COOKIE_NAME);
  addAudit({ orgId: req.user.orgId, actorUserId: req.user.id, action: "LOGOUT", req });
  res.json({ ok: true });
});

// ===== Invites =====
// SUPER_ADMIN: Leader einladen (pro Orga)
app.post("/api/admin/invite-leader", requireAuth, requireRole("SUPER_ADMIN"), async (req, res) => {
  const orgCode = String(req.body?.orgCode || "").trim().toUpperCase();
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!orgCode || !email) return res.status(400).json({ ok: false });

  const org = db.prepare(`SELECT * FROM orgs WHERE code=? AND isActive=1`).get(orgCode);
  if (!org) return res.status(404).json({ ok: false, error: "ORG_NOT_FOUND" });

  const tokenPlain = nanoid(32);
  const tokenHash = await bcrypt.hash(tokenPlain, 12);
  const id = "inv_" + nanoid(12);
  const expiresAt = nowMs() + 24 * 60 * 60 * 1000;

  db.prepare(`
    INSERT INTO invites (id, orgId, email, role, tokenHash, expiresAt, usedAt, createdByUserId, createdAt)
    VALUES (?, ?, ?, 'ORG_LEADER', ?, ?, NULL, ?, ?)
  `).run(id, org.id, email, tokenHash, expiresAt, req.user.id, nowMs());

  addAudit({ orgId: org.id, actorUserId: req.user.id, action: "INVITE_CREATE", targetType: "invite", targetId: id, detail: { email, role: "ORG_LEADER" }, req });

  // Link: du kannst das im UI anzeigen statt per Mail
  res.json({ ok: true, inviteLink: `/invite/${tokenPlain}`, expiresAt });
});

// ORG_LEADER: Mitglieder einladen (HR)
app.post("/api/hr/invite", requireAuth, requireRole("ORG_LEADER", "SUPER_ADMIN"), async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const role = String(req.body?.role || "MEMBER").trim();
  if (!email) return res.status(400).json({ ok: false });

  // orgId: super admin darf orgId angeben, leader nicht
  let orgId = req.user.orgId;
  if (req.user.role === "SUPER_ADMIN" && req.body?.orgId) orgId = String(req.body.orgId);

  const tokenPlain = nanoid(32);
  const tokenHash = await bcrypt.hash(tokenPlain, 12);
  const id = "inv_" + nanoid(12);
  const expiresAt = nowMs() + 24 * 60 * 60 * 1000;

  db.prepare(`
    INSERT INTO invites (id, orgId, email, role, tokenHash, expiresAt, usedAt, createdByUserId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `).run(id, orgId, email, role, tokenHash, expiresAt, req.user.id, nowMs());

  addAudit({ orgId, actorUserId: req.user.id, action: "INVITE_CREATE", targetType: "invite", targetId: id, detail: { email, role }, req });
  res.json({ ok: true, inviteLink: `/invite/${tokenPlain}`, expiresAt });
});

// Invite accept (token -> account anlegen + password setzen)
app.post("/api/invite/accept", async (req, res) => {
  const token = String(req.body?.token || "");
  const name = String(req.body?.name || "").trim();
  const phone = String(req.body?.phone || "").trim();
  const password = String(req.body?.password || "");
  if (!token || !password) return res.status(400).json({ ok: false });

  const invites = db.prepare(`SELECT * FROM invites WHERE usedAt IS NULL AND expiresAt > ?`).all(nowMs());
  let found = null;
  for (const inv of invites) {
    const ok = await bcrypt.compare(token, inv.tokenHash);
    if (ok) { found = inv; break; }
  }
  if (!found) return res.status(400).json({ ok: false, error: "INVITE_INVALID" });

  const email = found.email;
  const orgId = found.orgId;
  const role = found.role;

  const exists = db.prepare(`SELECT * FROM users WHERE orgId=? AND lower(email)=lower(?)`).get(orgId, email);
  if (exists) return res.status(400).json({ ok: false, error: "USER_EXISTS" });

  const hash = await bcrypt.hash(password, 12);
  const userId = "usr_" + nanoid(12);

  db.prepare(`
    INSERT INTO users (id, orgId, email, name, phone, role, passwordHash, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(userId, orgId, email, name || null, phone || null, role, hash, nowMs());

  db.prepare(`UPDATE invites SET usedAt=? WHERE id=?`).run(nowMs(), found.id);

  addAudit({ orgId, actorUserId: userId, action: "INVITE_ACCEPT", targetType: "user", targetId: userId, detail: { email, role }, req: { ip: req.ip, headers: req.headers } });

  // auto-login
  const jwt = signJWT({ uid: userId });
  res.cookie(COOKIE_NAME, jwt, { httpOnly: true, sameSite: "lax", secure: true });
  res.json({ ok: true });
});

// ===== Org isolation example data =====

// Get own org dispatch state
app.get("/api/dispatch", requireAuth, (req, res) => {
  const row = db.prepare(`SELECT json FROM dispatch_state WHERE orgId=?`).get(req.user.orgId);
  res.json({ ok: true, state: row ? JSON.parse(row.json) : null });
});

// Update dispatch state (Leader only)
app.post("/api/dispatch", requireAuth, requireRole("ORG_LEADER", "SUPER_ADMIN"), (req, res) => {
  const orgId = req.user.role === "SUPER_ADMIN" && req.body?.orgId ? String(req.body.orgId) : req.user.orgId;
  const json = JSON.stringify(req.body?.state || {});
  db.prepare(`
    INSERT INTO dispatch_state (orgId, json, updatedAt, updatedByUserId)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(orgId) DO UPDATE SET json=excluded.json, updatedAt=excluded.updatedAt, updatedByUserId=excluded.updatedByUserId
  `).run(orgId, json, nowMs(), req.user.id);

  addAudit({ orgId, actorUserId: req.user.id, action: "DISPATCH_UPDATE", targetType: "dispatch_state", targetId: orgId, req });

  broadcastOrg(orgId, { type: "dispatch:update", state: JSON.parse(json) });
  res.json({ ok: true });
});

// ===== WS (Live Sync) =====
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

/**
 * Connection auth:
 * client sends {type:"auth"} then server reads cookie header to auth
 */
const sockets = new Map(); // ws -> { user, orgId }
function wsSend(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch {}
}
function broadcastOrg(orgId, obj) {
  for (const [ws, meta] of sockets.entries()) {
    if (meta?.orgId === orgId && ws.readyState === WebSocket.OPEN) wsSend(ws, obj);
  }
}

wss.on("connection", (ws, req) => {
  sockets.set(ws, null);

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw || "")); } catch { return; }

    if (msg.type === "auth") {
      // parse cookie from req.headers.cookie
      const cookie = String(req.headers.cookie || "");
      const token = cookie.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE_NAME + "="));
      if (!token) return wsSend(ws, { type: "auth", ok: false });
      const jwt = decodeURIComponent(token.split("=")[1] || "");
      const payload = verifyJWT(jwt);
      if (!payload) return wsSend(ws, { type: "auth", ok: false });

      const user = db.prepare(`SELECT id, orgId, email, name, phone, role, isActive FROM users WHERE id=?`).get(payload.uid);
      if (!user || !user.isActive) return wsSend(ws, { type: "auth", ok: false });

      sockets.set(ws, { userId: user.id, orgId: user.orgId, role: user.role });
      wsSend(ws, { type: "auth", ok: true, role: user.role });

      // send initial dispatch state
      const row = db.prepare(`SELECT json FROM dispatch_state WHERE orgId=?`).get(user.orgId);
      wsSend(ws, { type: "dispatch:init", state: row ? JSON.parse(row.json) : null });
      return;
    }

    // Only allow after auth
    const meta = sockets.get(ws);
    if (!meta) return;

    // Example: dispatch updates via WS (Leader only)
    if (msg.type === "dispatch:set") {
      if (!(meta.role === "ORG_LEADER" || meta.role === "SUPER_ADMIN")) {
        return wsSend(ws, { type: "err", error: "FORBIDDEN" });
      }
      const state = msg.state || {};
      const json = JSON.stringify(state);
      db.prepare(`
        INSERT INTO dispatch_state (orgId, json, updatedAt, updatedByUserId)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(orgId) DO UPDATE SET json=excluded.json, updatedAt=excluded.updatedAt, updatedByUserId=excluded.updatedByUserId
      `).run(meta.orgId, json, nowMs(), meta.userId);

      broadcastOrg(meta.orgId, { type: "dispatch:update", state });
      addAudit({ orgId: meta.orgId, actorUserId: meta.userId, action: "DISPATCH_UPDATE_WS", req: { ip: req.socket.remoteAddress, headers: req.headers } });
      return;
    }
  });

  ws.on("close", () => sockets.delete(ws));
});

// SPA fallback
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
