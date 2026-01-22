const express = require("express");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");

// ======= DEMO USERS =======
// role: admin | leader | user
// org: orgId
const users = [
  { u: "ADMIN", p: "9999", role: "admin", org: "GLOBAL" },

  { u: "LSPD_LEAD", p: "1111", role: "leader", org: "LSPD" },
  { u: "LSPD", p: "1234", role: "user", org: "LSPD" },

  { u: "SASP_LEAD", p: "2222", role: "leader", org: "SASP" },
  { u: "SASP", p: "2345", role: "user", org: "SASP" },
];

// ======= ORGS (demo) =======
const orgs = [
  { id: "LSPD", name: "Los Santos Police Department" },
  { id: "SASP", name: "San Andreas State Police" },
];

// ======= SESSIONS =======
const SESSIONS = new Map(); // token -> {user, role, org, ts}
const TTL = 1000 * 60 * 60 * 24;

function token() { return crypto.randomBytes(24).toString("hex"); }
function getSession(req){
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if(!t) return null;
  const s = SESSIONS.get(t);
  if(!s) return null;
  if(Date.now() - s.ts > TTL){ SESSIONS.delete(t); return null; }
  return { ...s, token: t };
}

function requireAuth(req, res, next){
  const s = getSession(req);
  if(!s) return res.status(401).json({ ok:false, reason:"unauthorized" });
  req.session = s;
  next();
}

function requireRole(...roles){
  return (req, res, next)=>{
    const s = req.session;
    if(!s) return res.status(401).json({ ok:false });
    if(s.role === "admin") return next();
    if(!roles.includes(s.role)) return res.status(403).json({ ok:false, reason:"forbidden" });
    next();
  };
}

// ======= ORG-DATEN (in-memory) =======
// Jede Orga hat ihren eigenen Bereich
const DB = {
  org: {} // orgId -> { units:[], persons:[], vehicles:[], laws:null, audit:[] }
};
function ensureOrg(orgId){
  if(!DB.org[orgId]){
    DB.org[orgId] = {
      units: [],
      persons: [],
      vehicles: [],
      laws: null,
      audit: []
    };
  }
  return DB.org[orgId];
}

function audit(orgId, actor, action, payload){
  const o = ensureOrg(orgId);
  o.audit.unshift({
    ts: Date.now(),
    actor,
    action,
    payload: payload ?? null
  });
  o.audit = o.audit.slice(0, 2000);
}

// Health
app.get("/health", (req,res)=>res.json({ ok:true, time:Date.now() }));

// Static
app.use(express.static(PUBLIC_DIR));

// Login
app.post("/api/login", (req,res)=>{
  const { u, p } = req.body || {};
  const user = users.find(x => x.u === u && x.p === p && x.active !== false);
  if(!user) return res.status(401).json({ ok:false, reason:"wrong_credentials" });

  const t = token();
  SESSIONS.set(t, { user:user.u, role:user.role, org:user.org, ts:Date.now() });

  // org init
  if(user.role !== "admin") ensureOrg(user.org);

  res.json({
    ok:true,
    user:user.u,
    role:user.role,
    org:user.org,
    orgName: orgs.find(o=>o.id===user.org)?.name || user.org,
    token:t
  });
});

// ---- API: me ----
app.get("/api/me", requireAuth, (req,res)=>{
  const s = req.session;
  res.json({ ok:true, user:s.user, role:s.role, org:s.org });
});

// ---- API: org state (nur eigene org, admin kann org param) ----
app.get("/api/state", requireAuth, (req,res)=>{
  const s = req.session;
  const orgId = (s.role === "admin" && req.query.org) ? String(req.query.org) : s.org;
  if(s.role !== "admin" && orgId !== s.org) return res.status(403).json({ ok:false });

  const o = ensureOrg(orgId);
  res.json({ ok:true, org:orgId, db:o });
});

// ---- API: update units (leader/admin) ----
app.post("/api/units", requireAuth, requireRole("leader"), (req,res)=>{
  const s = req.session;
  const orgId = s.role === "admin" ? String(req.body.org || s.org) : s.org;
  if(s.role !== "admin" && orgId !== s.org) return res.status(403).json({ ok:false });

  const { units } = req.body || {};
  if(!Array.isArray(units)) return res.status(400).json({ ok:false, reason:"units_required" });

  const o = ensureOrg(orgId);
  o.units = units;
  audit(orgId, s.user, "units:update", { count: units.length });
  broadcastOrg(orgId, { type:"units", units:o.units });
  res.json({ ok:true });
});

// ---- API: persons (leader/admin) ----
app.post("/api/person", requireAuth, requireRole("leader"), (req,res)=>{
  const s = req.session;
  const orgId = s.role === "admin" ? String(req.body.org || s.org) : s.org;
  if(s.role !== "admin" && orgId !== s.org) return res.status(403).json({ ok:false });

  const o = ensureOrg(orgId);
  const p = req.body.person;
  if(!p || !p.name) return res.status(400).json({ ok:false, reason:"person_required" });
  p.id = crypto.randomUUID();
  p.ts = Date.now();
  o.persons.unshift(p);
  audit(orgId, s.user, "person:add", { name:p.name });
  broadcastOrg(orgId, { type:"persons", persons:o.persons });
  res.json({ ok:true, id:p.id });
});

// ---- API: vehicles (leader/admin) ----
app.post("/api/vehicle", requireAuth, requireRole("leader"), (req,res)=>{
  const s = req.session;
  const orgId = s.role === "admin" ? String(req.body.org || s.org) : s.org;
  if(s.role !== "admin" && orgId !== s.org) return res.status(403).json({ ok:false });

  const o = ensureOrg(orgId);
  const v = req.body.vehicle;
  if(!v || !v.plate) return res.status(400).json({ ok:false, reason:"vehicle_required" });
  v.id = crypto.randomUUID();
  v.ts = Date.now();
  o.vehicles.unshift(v);
  audit(orgId, s.user, "vehicle:add", { plate:v.plate });
  broadcastOrg(orgId, { type:"vehicles", vehicles:o.vehicles });
  res.json({ ok:true, id:v.id });
});

// SPA fallback
app.get("*", (req, res) => {
  if (path.extname(req.path)) return res.status(404).send("Not found");
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// ===== WebSocket org rooms =====
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

const ORG_CLIENTS = new Map(); // orgId -> Set(ws)

function broadcastOrg(orgId, msg){
  const set = ORG_CLIENTS.get(orgId);
  if(!set) return;
  const data = JSON.stringify(msg);
  for(const ws of set){
    if(ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const tok = url.searchParams.get("token");
  const sess = tok ? SESSIONS.get(tok) : null;

  if(!sess){
    ws.send(JSON.stringify({ type:"error", reason:"unauthorized" }));
    ws.close();
    return;
  }

  const orgId = sess.role === "admin" ? "GLOBAL" : sess.org;

  if(!ORG_CLIENTS.has(orgId)) ORG_CLIENTS.set(orgId, new Set());
  ORG_CLIENTS.get(orgId).add(ws);

  ws.send(JSON.stringify({ type:"hello", ok:true, user:sess.user, role:sess.role, org:sess.org }));

  ws.on("close", ()=>{
    ORG_CLIENTS.get(orgId)?.delete(ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
