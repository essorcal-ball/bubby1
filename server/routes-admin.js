const express = require("express");
const router = express.Router();
const { loadDB, saveDB } = require("./db");

// --- ADMIN PASSWORD ---
const ADMIN_PASS = "stego";

// --- LOGIN TO ADMIN ---
router.post("/login", (req, res) => {
    if (req.body.pass === ADMIN_PASS) {
        res.cookie("admin", "yes");
        return res.json({ success: true });
    }
    res.json({ success: false });
});

function isAdmin(req) {
    return req.cookies.admin === "yes";
}

// --- GET PENDING GAMES ---
router.get("/pending", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    res.json(db.pending);
});

// --- APPROVE GAME ---
router.post("/approve", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    const { id } = req.body;

    const game = db.pending.find(g => g.id === id);
    if (!game) return res.json({ message: "Not found" });

    db.games.push(game);
    db.pending = db.pending.filter(g => g.id !== id);

    saveDB(db);
    res.json({ message: "Game approved!" });
});

// --- DELETE GAME REQUEST ---
router.post("/deny", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    db.pending = db.pending.filter(g => g.id !== req.body.id);
    saveDB(db);
    res.json({ message: "Denied" });
});

// --- MEMBER LIST ---
router.get("/members", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    res.json(db.users);
});

// --- TOGGLE PRO ---
router.post("/togglePro", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });

    const db = loadDB();
    const user = db.users.find(u => u.id === req.body.id);
    if (!user) return res.json({ message: "User not found" });

    user.pro = !user.pro;
    saveDB(db);

    res.json({ message: "Changed user pro status." });
});

// --- KICK USER ---
router.post("/kick", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });

    const db = loadDB();
    db.users = db.users.filter(u => u.id !== req.body.id);
    saveDB(db);

    res.json({ message: "User removed." });
});

module.exports = router;
