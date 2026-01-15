const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ===== USERS (Demo) =====
const users = [
  { u: "ADMIN", p: "9999", role: "admin" },
  { u: "LSPD", p: "1234", role: "user" }
];

// ===== STATIC FRONTEND =====
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));


// ===== LOGIN API =====
app.post("/api/login", (req, res) => {
  const { u, p } = req.body || {};
  const user = users.find(x => x.u === u && x.p === p);
  if (!user) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: user.u, role: user.role });
});

// ===== SPA FALLBACK (WICHTIG) =====
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server läuft auf Port", PORT);
});

