const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");

const DISCORD_WEBHOOK =
  process.env.DISCORD_WEBHOOK ||
  "https://discord.com/api/webhooks/1453855487937482894/dO3DP9IQw0xXnl6m62J4rqblUan0u38uya7zEJdtKgekuOXwe0oqdYiMfpGT6okIWSeg";

// --- Users (Demo) ---
const users = [
  { u: "ADMIN", p: "9999", role: "admin" },
  { u: "LSPD", p: "1234", role: "user" }
];

// --- Sessions (in-memory) ---
const SESSIONS = new Map(); // token -> { user, role, ts }
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function newToken() {
  return crypto.randomBytes(24).toString("hex");
}

function pruneSessions() {
  const now = Date.now();
  for (const [t, s] of SESSIONS.entries()) {
    if ((now - s.ts) > SESSION_TTL_MS) SESSIONS.delete(t);
  }
}
setInterval(pruneSessions, 60_000).unref();

function getSession(token) {
  if (!token) return null;
  const s = SESSIONS.get(token);
  if (!s) return null;
  if ((Date.now() - s.ts) > SESSION_TTL_MS) { SESSIONS.delete(token); return null; }
  return s;
}

// --- Audit Log ---
let DB = {
  audit: [], // {ts, actor, role, action, details}
  leitstelle: {
    dispatcher: { name: "", badge: "" },
    units: [
      { id: "ALPHA 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "ALPHA 02", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "BRAVO 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "CHARLIE 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "CHARLIE 02", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "DELTA 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "ECHO 01", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "ECHO 02", officer: "", callSign: "", status: "Standby", note: "" },
      { id: "FOXTROT 01", officer: "", callSign: "", status: "Standby", note: "" }
    ]
  },
  einsaetze: [], // {id, title, prio, status, unit, note, ts}
  funk: [] // {id, from, msg, ts}
};

function sanitizeStr(v, max = 64) {
  if (typeof v !== "string") return "";
  v = v.trim();
  if (v.length > max) v = v.slice(0, max);
  return v;
}
function validStatus(s) {
  return ["Standby", "Streife", "AFK", "Außer Dienst"].includes(s);
}
function validEinsatzStatus(s) {
  return ["OFFEN", "ZUWEISUNG", "AKTIV", "ERLEDIGT", "ABGEBROCHEN"].includes(s);
}

async function discordLog(line) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: line.slice(0, 1900) })
    });
  } catch {
    // ignore
  }
}

function audit(actor, role, action, details) {
  const entry = { ts: Date.now(), actor, role, action, details };
  DB.audit.unshift(entry);
  DB.audit = DB.audit.slice(0, 500);

  const ts = new Date(entry.ts).toLocaleString("de-DE");
  const msg = `🧾 **AUDIT** | ${ts}\n**User:** ${actor} (${role})\n**Action:** ${action}\n**Details:** ${details}`;
  discordLog(msg);
}

// --- Static Frontend ---
app.use(express.static(PUBLIC_DIR));

// Login -> Token
app.post("/api/login", (req, res) => {
  const { u, p } = req.body || {};
  const user = users.find(x => x.u === u && x.p === p);
  if (!user) return res.status(401).json({ ok: false });

  const token = newToken();
  SESSIONS.set(token, { user: user.u, role: user.role, ts: Date.now() });

  audit(user.u, user.role, "login", "Login erfolgreich");
  res.json({ ok: true, user: user.u, role: user.role, token });
});

// optional: state
app.get("/api/state", (req, res) => res.json({
  ok: true,
  leitstelle: DB.leitstelle,
  einsaetze: DB.einsaetze,
  funk: DB.funk
}));

// SPA fallback nur ohne Dateiendung
app.get("*", (req, res) => {
  if (path.extname(req.path)) return res.status(404).send("Not found");
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}
function sendState(ws) {
  ws.send(JSON.stringify({
    type: "state",
    leitstelle: DB.leitstelle,
    einsaetze: DB.einsaetze,
    funk: DB.funk
  }));
}

function wsDeny(ws, reason) {
  try { ws.send(JSON.stringify({ type: "error", reason })); } catch {}
}

wss.on("connection", (ws, req) => {
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));

  const url = new URL(req.url, "http://localhost");
  const token = url.searchParams.get("token");
  const sess = getSession(token);

  if (!sess) {
    wsDeny(ws, "unauthorized");
    ws.close();
    return;
  }

  ws.user = sess.user;
  ws.role = sess.role;

  audit(ws.user, ws.role, "ws_connect", "WebSocket verbunden");

  sendState(ws);

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return; }

    // --- Admin-only: Dispatcher + Reset ---
    if (msg.type === "set_dispatcher") {
      if (ws.role !== "admin") {
        audit(ws.user, ws.role, "deny_set_dispatcher", "Keine Rechte");
        return;
      }
      DB.leitstelle.dispatcher.name = sanitizeStr(msg.name, 64);
      DB.leitstelle.dispatcher.badge = sanitizeStr(msg.badge, 24);
      audit(ws.user, ws.role, "set_dispatcher", `${DB.leitstelle.dispatcher.name} / ${DB.leitstelle.dispatcher.badge}`);
      broadcast({ type: "state", leitstelle: DB.leitstelle, einsaetze: DB.einsaetze, funk: DB.funk });
      return;
    }

    if (msg.type === "reset_leitstelle") {
      if (ws.role !== "admin") {
        audit(ws.user, ws.role, "deny_reset_leitstelle", "Keine Rechte");
        return;
      }
      DB.leitstelle.dispatcher = { name: "", badge: "" };
      DB.leitstelle.units.forEach(u => {
        u.officer = ""; u.callSign = ""; u.note = ""; u.status = "Standby";
      });
      audit(ws.user, ws.role, "reset_leitstelle", "Leitstelle zurückgesetzt");
      broadcast({ type: "state", leitstelle: DB.leitstelle, einsaetze: DB.einsaetze, funk: DB.funk });
      return;
    }

    // --- Leitstelle Units (alle dürfen) ---
    if (msg.type === "update_unit") {
      const id = sanitizeStr(msg.id, 24);
      const unit = DB.leitstelle.units.find(u => u.id === id);
      if (!unit) return;

      if ("officer" in msg) unit.officer = sanitizeStr(msg.officer, 64);
      if ("callSign" in msg) unit.callSign = sanitizeStr(msg.callSign, 32);
      if ("note" in msg) unit.note = sanitizeStr(msg.note, 128);
      if ("status" in msg && validStatus(msg.status)) unit.status = msg.status;

      audit(ws.user, ws.role, "update_unit", `${id} -> ${unit.officer}/${unit.callSign}/${unit.status}`);
      broadcast({ type: "state", leitstelle: DB.leitstelle, einsaetze: DB.einsaetze, funk: DB.funk });
      return;
    }

    if (msg.type === "clear_unit") {
      const id = sanitizeStr(msg.id, 24);
      const unit = DB.leitstelle.units.find(u => u.id === id);
      if (!unit) return;

      unit.officer = ""; unit.callSign = ""; unit.note = ""; unit.status = "Standby";
      audit(ws.user, ws.role, "clear_unit", id);
      broadcast({ type: "state", leitstelle: DB.leitstelle, einsaetze: DB.einsaetze, funk: DB.funk });
      return;
    }

    // --- Einsätze ---
    if (msg.type === "add_einsatz") {
      const title = sanitizeStr(msg.title, 64);
      if (!title) return;
      const e = {
        id: crypto.randomUUID(),
        title,
        prio: sanitizeStr(msg.prio || "2", 2),
        status: validEinsatzStatus(msg.status) ? msg.status : "OFFEN",
        unit: sanitizeStr(msg.unit || "", 24),
        note: sanitizeStr(msg.note || "", 160),
        ts: Date.now()
      };
      DB.einsaetze.unshift(e);
      DB.einsaetze = DB.einsaetze.slice(0, 200);
      audit(ws.user, ws.role, "add_einsatz", `${e.title} (P${e.prio})`);
      broadcast({ type: "state", leitstelle: DB.leitstelle, einsaetze: DB.einsaetze, funk: DB.funk });
      return;
    }

    if (msg.type === "update_einsatz") {
      const id = sanitizeStr(msg.id, 64);
      const e = DB.einsaetze.find(x => x.id === id);
      if (!e) return;

      if ("title" in msg) e.title = sanitizeStr(msg.title, 64);
      if ("prio" in msg) e.prio = sanitizeStr(msg.prio, 2);
      if ("status" in msg && validEinsatzStatus(msg.status)) e.status = msg.status;
      if ("unit" in msg) e.unit = sanitizeStr(msg.unit, 24);
      if ("note" in msg) e.note = sanitizeStr(msg.note, 160);

      audit(ws.user, ws.role, "update_einsatz", `${e.title} -> ${e.status}/${e.unit}`);
      broadcast({ type: "state", leitstelle: DB.leitstelle, einsaetze: DB.einsaetze, funk: DB.funk });
      return;
    }

    if (msg.type === "delete_einsatz") {
      const id = sanitizeStr(msg.id, 64);
      const before = DB.einsaetze.length;
      DB.einsaetze = DB.einsaetze.filter(x => x.id !== id);
      if (DB.einsaetze.length !== before) {
        audit(ws.user, ws.role, "delete_einsatz", id);
        broadcast({ type: "state", leitstelle: DB.leitstelle, einsaetze: DB.einsaetze, funk: DB.funk });
      }
      return;
    }

    // --- Funk ---
    if (msg.type === "funk") {
      const text = sanitizeStr(msg.msg, 240);
      if (!text) return;
      const from = sanitizeStr(msg.from || ws.user, 32);

      const f = { id: crypto.randomUUID(), from, msg: text, ts: Date.now() };
      DB.funk.unshift(f);
      DB.funk = DB.funk.slice(0, 300);

      audit(ws.user, ws.role, "funk", `${from}: ${text}`);
      broadcast({ type: "state", leitstelle: DB.leitstelle, einsaetze: DB.einsaetze, funk: DB.funk });
      return;
    }
  });

  ws.on("close", () => {
    audit(ws.user || "?", ws.role || "?", "ws_disconnect", "WebSocket getrennt");
  });
});

// Heartbeat
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
