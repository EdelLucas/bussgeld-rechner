// server.js
const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");

// --- Simple Login (Demo) ---
const users = [
  { u: "ADMIN", p: "9999", role: "admin" },
  { u: "LSPD", p: "1234", role: "user" }
];

app.post("/api/login", (req, res) => {
  const { u, p } = req.body || {};
  const user = users.find(x => x.u === u && x.p === p);
  if (!user) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: user.u, role: user.role });
});

// --- In-memory DB (später DB) ---
let DB = {
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
  }
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

// --- Static Frontend ---
app.use(express.static(PUBLIC_DIR));

// SPA-Fallback nur für Seiten ohne Dateiendung
app.get("*", (req, res) => {
  if (path.extname(req.path)) return res.status(404).send("Not found");
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// --- HTTP + WS Server ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

function sendState(ws) {
  ws.send(JSON.stringify({ type: "state", leitstelle: DB.leitstelle }));
}

wss.on("connection", (ws) => {
  ws.isAlive = true;

  ws.on("pong", () => (ws.isAlive = true));

  // sofort State schicken
  sendState(ws);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    // --- Updates ---
    if (msg.type === "set_dispatcher") {
      DB.leitstelle.dispatcher.name = sanitizeStr(msg.name, 64);
      DB.leitstelle.dispatcher.badge = sanitizeStr(msg.badge, 24);
      broadcast({ type: "state", leitstelle: DB.leitstelle });
      return;
    }

    if (msg.type === "update_unit") {
      const id = sanitizeStr(msg.id, 24);
      const unit = DB.leitstelle.units.find(u => u.id === id);
      if (!unit) return;

      if ("officer" in msg) unit.officer = sanitizeStr(msg.officer, 64);
      if ("callSign" in msg) unit.callSign = sanitizeStr(msg.callSign, 32);
      if ("note" in msg) unit.note = sanitizeStr(msg.note, 128);
      if ("status" in msg && validStatus(msg.status)) unit.status = msg.status;

      broadcast({ type: "state", leitstelle: DB.leitstelle });
      return;
    }

    if (msg.type === "clear_unit") {
      const id = sanitizeStr(msg.id, 24);
      const unit = DB.leitstelle.units.find(u => u.id === id);
      if (!unit) return;

      unit.officer = "";
      unit.callSign = "";
      unit.note = "";
      unit.status = "Standby";

      broadcast({ type: "state", leitstelle: DB.leitstelle });
      return;
    }

    if (msg.type === "reset_leitstelle") {
      // optional: später nur Admin erlauben
      DB.leitstelle.dispatcher = { name: "", badge: "" };
      DB.leitstelle.units.forEach(u => {
        u.officer = "";
        u.callSign = "";
        u.note = "";
        u.status = "Standby";
      });
      broadcast({ type: "state", leitstelle: DB.leitstelle });
      return;
    }
  });
});

// Heartbeat (Client timeout erkennen)
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
