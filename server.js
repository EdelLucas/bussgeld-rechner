const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");

// Static zuerst
app.use(express.static(PUBLIC_DIR));

// Login
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

// SPA-Fallback NUR für Seiten ohne Dateiendung
app.get("*", (req, res) => {
  if (path.extname(req.path)) return res.status(404).send("Not found");
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
