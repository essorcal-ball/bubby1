const express = require("express");
const router = express.Router();
const { loadDB, saveDB } = require("./db");
const { v4: uuid } = require("uuid");

const ADMIN_PASS = process.env.ADMIN_PASS;

function isAdmin(req) { return req.cookies.admin === "yes"; }

// LOGIN
router.post("/login", (req, res) => {
    if (req.body.pass === ADMIN_PASS) {
        res.cookie("admin", "yes");
        return res.json({ success: true });
    }
    res.json({ success: false });
});

// LIST MEMBERS
router.get("/members", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    res.json(db.users);
});

// TOGGLE PRO
router.post("/togglePro", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    const user = db.users.find(u => u.id === req.body.id);
    if (!user) return res.json({ message: "User not found" });
    user.pro = !user.pro;
    saveDB(db);
    res.json({ message: "Changed user pro status" });
});

// UNLOCK ACCOUNT
router.post("/unlock", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    const user = db.users.find(u => u.id === req.body.id);
    if (!user) return res.json({ message: "User not found" });
    user.locked = false;
    saveDB(db);
    res.json({ message: "User unlocked" });
});

// PENDING GAMES
router.get("/pending", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    res.json(db.pending);
});

// APPROVE GAME
router.post("/approve", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    const game = db.pending.find(g => g.id === req.body.id);
    if (!game) return res.json({ message: "Not found" });
    db.games.push(game);
    db.pending = db.pending.filter(g => g.id !== req.body.id);
    saveDB(db);
    res.json({ message: "Game approved!" });
});

// DENY GAME
router.post("/deny", (req, res) => {
    if (!isAdmin(req)) return res.json({ error: "Not admin" });
    const db = loadDB();
    db.pending = db.pending.filter(g => g.id !== req.body.id);
    saveDB(db);
    res.json({ message: "Denied" });
});

module.exports = router;
