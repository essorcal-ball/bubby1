import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const DB = "./database.json";
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({ users: [], games: [] }, null, 2));

function loadDB() {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
}
function saveDB(db) {
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

// SIGNUP FIXED
app.post("/api/signup", (req, res) => {
    const { email, pass } = req.body;
    const db = loadDB();

    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.json({ success: false, message: "Email already used." });
    }

    db.users.push({ email, pass, id: Date.now(), admin: false });
    saveDB(db);

    res.json({ success: true, message: "Account created!" });
});

// LOGIN
app.post("/api/login", (req, res) => {
    const { email, pass } = req.body;
    const db = loadDB();

    const user = db.users.find(u => u.email === email && u.pass === pass);

    if (!user) return res.json({ success: false, message: "Invalid login" });

    res.json({ success: true, admin: user.admin, id: user.id });
});

// GET GAMES
app.get("/api/games", (req, res) => {
    const db = loadDB();
    res.json(db.games);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
