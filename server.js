const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// Hardcoded Login (später DB)
const users = [
  { u: "ADMIN", p: "9999", role: "admin" },
  { u: "LSPD",  p: "1234", role: "user"  }
];

// Static Frontend
app.use(express.static(path.join(__dirname, "public")));

// API: Health
app.get("/api/health", (req, res) => res.json({ ok: true, status: "Backend läuft" }));

// API: Login
app.post("/api/login", (req, res) => {
  const { u, p } = req.body || {};
  const user = users.find(x => x.u === String(u || "").trim() && x.p === String(p || "").trim());
  if (!user) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: user.u, role: user.role });
});

// SPA Fallback (wichtig: NUR für non-API)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("WEB läuft auf Port", PORT));
