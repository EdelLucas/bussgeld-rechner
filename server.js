const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

// DIE DATENBANK (In-Memory für dieses Beispiel)
let DB = {
    users: [
        { user: "admin", pass: "master123", orga: "GOV", rank: "Admin", isHR: true, status: "active" }
    ],
    // 7 Isolierte Datenbanken
    orgas: {
        "FIB": { files: [], logs: [] },
        "LSPD": { files: [], logs: [] },
        "SAHP": { files: [], logs: [] },
        "EMS": { files: [], logs: [] },
        "NG": { files: [], logs: [] },
        "LIFEINVADER": { files: [], logs: [] },
        "GOV": { files: [], logs: [] }
    },
    pending: [] // Warteschlange für HR
};

// LOGIN & AUTH
app.post("/login", (req, res) => {
    const { user, pass } = req.body;
    const u = DB.users.find(x => x.user === user && x.pass === pass);
    if (!u) return res.status(401).json({ msg: "Ungültige Daten" });
    if (u.status !== "active") return res.status(403).json({ msg: "Account noch nicht freigeschaltet" });
    res.json(u);
});

// REGISTRIERUNG (Landet in der Warteschlange)
app.post("/register", (req, res) => {
    const { user, pass, tel, orga } = req.body;
    DB.pending.push({ user, pass, tel, orga, status: "pending" });
    res.json({ ok: true });
});

// HR-ABFRAGE (Gibt nur User der EIGENEN Orga zurück)
app.post("/hr/list", (req, res) => {
    const { orga } = req.body;
    const list = DB.pending.filter(u => u.orga === orga);
    res.json(list);
});

app.listen(3000, () => console.log("State-System auf Port 3000 aktiv."));
