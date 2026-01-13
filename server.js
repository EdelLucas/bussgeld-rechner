const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// TEST-USERS
const users = [
  { u: "ADMIN", p: "9999", role: "admin" },
  { u: "LSPD", p: "1234", role: "user" }
];

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({ status: "Backend läuft" });
});

// LOGIN
app.post("/login", (req, res) => {
  const { u, p } = req.body;
  const user = users.find(x => x.u === u && x.p === p);

  if (!user) {
    return res.status(401).json({ ok: false });
  }

  res.json({
    ok: true,
    role: user.role,
    user: user.u
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server läuft auf Port", PORT);
});
