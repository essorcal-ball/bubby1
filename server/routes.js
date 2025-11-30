const express = require("express");
const router = express.Router();
const { loadDB, saveDB } = require("./db");
const bcrypt = require("bcryptjs");
const fileUpload = require("express-fileupload");
const path = require("path");
const { v4: uuid } = require("uuid");

router.use(fileUpload());

// --- SESSION CHECK ---
function getUser(req) {
    const db = loadDB();
    return db.users.find(u => u.id === req.cookies.session);
}

// --- SIGNUP ---
router.post("/signup", (req, res) => {
    const db = loadDB();
    const { name, email, username, about, password } = req.body;

    if (db.users.find(u => u.email === email))
        return res.json({ success: false, message: "Email already exists" });

    const id = uuid();

    db.users.push({
        id,
        name,
        email,
        username,
        about,
        password: bcrypt.hashSync(password),
        pro: false,
        plays: 0,
        ratings: []
    });

    saveDB(db);
    res.json({ success: true });
});

// --- LOGIN ---
router.post("/login", (req, res) => {
    const db = loadDB();
    const { email, password } = req.body;

    const user = db.users.find(u => u.email === email);
    if (!user) return res.json({ success: false, message: "User not found" });

    if (!bcrypt.compareSync(password, user.password))
        return res.json({ success: false, message: "Incorrect password" });

    res.cookie("session", user.id, { httpOnly: true });
    res.json({ success: true });
});

// --- USER INFO ---
router.get("/me", (req, res) => {
    const user = getUser(req);
    if (!user) return res.json({ loggedIn: false });

    res.json({
        loggedIn: true,
        username: user.username,
        email: user.email,
        about: user.about,
        pro: user.pro
    });
});

// --- UPGRADE TO PRO ---
router.post("/upgradePro", (req, res) => {
    const db = loadDB();
    const user = getUser(req);
    if (!user) return res.json({ message: "Not logged in" });

    user.pro = true;
    saveDB(db);

    res.json({ message: "You are now a PRO member!" });
});

// --- PUBLIC GAME LIST ---
router.get("/games", (req, res) => {
    const db = loadDB();
    res.json(db.games);
});

// --- SINGLE GAME ---
router.get("/game", (req, res) => {
    const db = loadDB();
    const game = db.games.find(g => g.id === req.query.id);
    res.json(game);
});

// --- UPLOAD GAME ---
router.post("/upload", (req, res) => {
    const db = loadDB();
    const user = getUser(req);
    if (!user) return res.json({ message: "You must log in to upload games." });

    const { title, gamelink, message } = req.body;

    const id = uuid();

    let imagePath = "";
    if (req.files && req.files.image) {
        const img = req.files.image;
        imagePath = "/uploads/" + id + "_" + img.name;
        img.mv(path.join(__dirname, "../client/uploads", id + "_" + img.name));
    }

    let filePath = gamelink;
    if (req.files && req.files.gamefile) {
        const f = req.files.gamefile;
        filePath = "/uploads/" + id + "_" + f.name;
        f.mv(path.join(__dirname, "../client/uploads", id + "_" + f.name));
    }

    db.pending.push({
        id,
        title,
        image: imagePath,
        link: filePath,
        message,
        user: user.id
    });

    saveDB(db);
    res.json({ message: "Game submitted for admin approval!" });
});

module.exports = router;
