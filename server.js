const express = require("express");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const WebSocket = require("ws");

const app = express();

// WICHTIG: JSON Body Parser
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");

// --- Users (Demo) ---
const users = [
  { u: "ADMIN", p: "9999", role: "admin" },
  { u: "LSPD", p: "1234", role: "user" }
];

// --- Sessions (in-memory) ---
const SESSIONS = new Map();
function newToken() {
  return crypto.randomBytes(24).toString("hex");
}

// Health
app.get("/health", (req, res) => res.json({ ok: true, where: "server.js", time: Date.now() }));

// Static Frontend
app.use(express.static(PUBLIC_DIR));

// DEBUG: zeigt was beim Login ankommt (nur zum Fixen)
app.post("/api/login", (req, res) => {
  const { u, p } = req.body || {};
  console.log("LOGIN TRY:", { u, p: p ? "***" : "" });

  const user = users.find(x => x.u === u && x.p === p);
  if (!user) {
    console.log("LOGIN FAIL for:", u);
    return res.status(401).json({ ok: false, reason: "wrong_credentials" });
  }

  const token = newToken();
  SESSIONS.set(token, { user: user.u, role: user.role, ts: Date.now() });

  console.log("LOGIN OK:", user.u, user.role);
  res.json({ ok: true, user: user.u, role: user.role, token });
});

// SPA fallback (nur ohne Dateiendung)
app.get("*", (req, res) => {
  if (path.extname(req.path)) return res.status(404).send("Not found");
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// --- WebSocket (optional) ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  ws.send(JSON.stringify({ type: "hello", ok: true }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
