const express = require("express");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");

// Demo-User (später HR/DB)
const users = [
  { u: "ADMIN", p: "9999", role: "admin" },
  { u: "LSPD", p: "1234", role: "user" }
];

// Sessions (in-memory)
const SESSIONS = new Map(); // token -> { user, role, ts }
const SESSION_TTL = 1000 * 60 * 60 * 24; // 24h

function newToken() {
  return crypto.randomBytes(24).toString("hex");
}
function getSession(token) {
  if (!token) return null;
  const s = SESSIONS.get(token);
  if (!s) return null;
  if (Date.now() - s.ts > SESSION_TTL) { SESSIONS.delete(token); return null; }
  return s;
}
setInterval(() => {
  const now = Date.now();
  for (const [t, s] of SESSIONS.entries()) {
    if (now - s.ts > SESSION_TTL) SESSIONS.delete(t);
  }
}, 60_000).unref();

// Health
app.get("/health", (req, res) => res.json({ ok: true, time: Date.now() }));

// Static
app.use(express.static(PUBLIC_DIR));

// Login
app.post("/api/login", (req, res) => {
  const { u, p } = req.body || {};
  const user = users.find(x => x.u === u && x.p === p);
  if (!user) return res.status(401).json({ ok: false, reason: "wrong_credentials" });
  const token = newToken();
  SESSIONS.set(token, { user: user.u, role: user.role, ts: Date.now() });
  res.json({ ok: true, user: user.u, role: user.role, token });
});

// SPA fallback (nur ohne Dateiendung)
app.get("*", (req, res) => {
  if (path.extname(req.path)) return res.status(404).send("Not found");
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// WS (optional, später live sync)
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const token = url.searchParams.get("token");
  const sess = getSession(token);
  if (!sess) {
    ws.send(JSON.stringify({ type: "error", reason: "unauthorized" }));
    ws.close();
    return;
  }
  ws.send(JSON.stringify({ type: "hello", ok: true, user: sess.user, role: sess.role }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
