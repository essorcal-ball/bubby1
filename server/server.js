import express from "express";
import fs from "fs";
import cors from "cors";

const express = require('express');
const app = express();
const path = require('path');

// Assuming your static files (CSS/JS) are in a folder named 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const DB = "./database.json";

if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, JSON.stringify({ users: [], games: [] }, null, 2));
}

function loadDB() {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
}

function saveDB(db) {
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

// SIGNUP
app.post("/api/signup", (req, res) => {
    const { email, pass } = req.body;
    const db = loadDB();

    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.json({ success: false, message: "Email already used." });
    }

    db.users.push({
        id: Date.now(),
        email,
        pass,
        admin: false,
        gamesUploaded: 0
    });

    saveDB(db);
    res.json({ success: true, message: "Account created!" });
});

// LOGIN
app.post("/api/login", (req, res) => {
    const { email, pass } = req.body;
    const db = loadDB();

    const user = db.users.find(u => u.email === email && u.pass === pass);

    if (!user) {
        return res.json({ success: false, message: "Invalid login" });
    }

    res.json({ success: true, id: user.id, admin: user.admin });
});

// SUBMIT GAME
app.post("/api/upload", (req, res) => {
    const { title, url, userId } = req.body;
    const db = loadDB();

    db.games.push({
        id: Date.now(),
        title,
        url,
        userId,
        approved: false,
        plays: 0
    });

    saveDB(db);
    res.json({ success: true, message: "Game submitted! Waiting for approval." });
});

// GET GAMES
app.get("/api/games", (req, res) => {
    const db = loadDB();
    res.json(db.games.filter(g => g.approved));
});

// GET GAME BY ID
app.get("/api/game/:id", (req, res) => {
    const db = loadDB();
    const game = db.games.find(g => g.id == req.params.id);
    res.json(game);
});

// ADMIN - ALL SUBMITTED GAMES
app.get("/api/admin/games", (req, res) => {
    const db = loadDB();
    res.json(db.games);
});

// ADMIN APPROVE / DELETE GAME
app.post("/api/admin/game-action", (req, res) => {
    const { id, action } = req.body;

    const db = loadDB();
    const game = db.games.find(g => g.id == id);

    if (!game) return res.json({ success: false });

    if (action === "approve") game.approved = true;
    if (action === "delete") db.games = db.games.filter(g => g.id != id);

    saveDB(db);
    res.json({ success: true });
});

// ADMIN - USERS LIST
app.get("/api/admin/users", (req, res) => {
    const db = loadDB();
    res.json(db.users);
});

// ADMIN - DELETE USER
app.post("/api/admin/delete-user", (req, res) => {
    const { id } = req.body;

    const db = loadDB();
    db.users = db.users.filter(u => u.id != id);
    db.games = db.games.filter(g => g.userId != id);

    saveDB(db);
    res.json({ success: true });
});

app.listen(3000, () => console.log("Server running on port 3000"));
