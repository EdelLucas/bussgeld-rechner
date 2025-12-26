const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// DATENSPEICHER (Wird bei Neustart auf Render zurückgesetzt, solange keine DB verbunden ist)
let DB = {
    users: [
        { user: "admin", pass: "master123", orga: "GOV", rank: "Admin", isHR: true, status: "active" }
    ],
    pending: [] 
};

// LOGIN
app.post("/login", (req, res) => {
    const { user, pass } = req.body;
    const u = DB.users.find(x => x.user === user && x.pass === pass);
    if (!u) return res.status(401).json({ msg: "Ungültige Login-Daten" });
    if (u.status !== "active") return res.status(403).json({ msg: "Account noch nicht durch HR freigeschaltet!" });
    res.json(u);
});

// REGISTRIERUNG
app.post("/register", (req, res) => {
    const { user, pass, tel, orga } = req.body;
    if (DB.users.find(x => x.user === user)) return res.status(400).json({ msg: "Name bereits vergeben" });
    
    DB.pending.push({ user, pass, tel, orga, status: "pending" });
    console.log(`Neue Registrierung für ${orga}: ${user}`);
    res.json({ ok: true });
});

// HR LISTE (Gibt nur Bewerber der eigenen Orga zurück)
app.post("/hr/list", (req, res) => {
    const { orga } = req.body;
    const list = DB.pending.filter(u => u.orga === orga);
    res.json(list);
});

// HR FREISCHALTUNG
app.post("/hr/approve", (req, res) => {
    const { username, orga } = req.body;
    const idx = DB.pending.findIndex(u => u.user === username);
    if (idx > -1) {
        const newUser = { ...DB.pending[idx], status: "active", rank: "Rekrut", isHR: false };
        DB.users.push(newUser);
        DB.pending.splice(idx, 1);
        res.json({ ok: true });
    } else {
        res.status(404).json({ msg: "User nicht gefunden" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend läuft auf Port ${PORT}`));
