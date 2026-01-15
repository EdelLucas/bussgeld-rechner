const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// Demo-User (später DB/Users)
const users = [
  { u: "ADMIN", p: "9999", role: "admin" },
  { u: "LSPD", p: "1234", role: "user" }
];

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/login", (req, res) => {
  const { u, p } = req.body || {};
  const user = users.find(x => x.u === String(u).trim() && x.p === String(p).trim());
  if (!user) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: user.u, role: user.role });
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server läuft auf Port", PORT));
