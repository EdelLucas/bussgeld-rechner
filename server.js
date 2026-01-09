const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static("public"));

const users = [
  { u: "ADMIN", p: "9999", r: "admin" },
  { u: "LSPD", p: "1234", r: "officer" }
];

app.post("/login", (req, res) => {
  const { u, p } = req.body;
  const user = users.find(x => x.u === u && x.p === p);
  if (!user) return res.status(401).json({ error: true });
  res.json({ user: user.u, role: user.r });
});

server.listen(3000, () =>
  console.log("MDT läuft auf http://localhost:3000")
);
