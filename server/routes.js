const express = require("express");
const router = express.Router();
const { loadDB, saveDB } = require("./db");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

// Helpers
function getUser(req) {
    const db = loadDB();
    return db.users.find(u => u.id === req.cookies.session);
}

// SIGNUP
router.post("/signup", (req, res) => {
    const db = loadDB();
    const { name, email, username, about, password } = req.body;

    if (db.users.find(u => u.email === email))
        return res.json({ success: false, message: "Email already used" });

    const id = uuid();
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    db.users.push({
        id, name, email, username, about,
        password: bcrypt.hashSync(password),
        verified: false, verificationCode,
        pro: false, plays: 0, ratings: [],
        locked: false
    });
    saveDB(db);

    transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Verify your Bob The Stickman Games account",
        text: `Your verification code is: ${verificationCode}`
    });

    res.json({ success: true });
});

// VERIFY EMAIL
router.post("/verify", (req, res) => {
    const db = loadDB();
    const { email, code } = req.body;
    const user = db.users.find(u => u.email === email);
    if (!user) return res.json({ success: false, message: "Email not found" });
    if (user.verified) return res.json({ success: false, message: "Already verified" });
    if (user.verificationCode === code) {
        user.verified = true;
        delete user.verificationCode;
        saveDB(db);
        return res.json({ success: true });
    } else return res.json({ success: false, message: "Incorrect code" });
});

// LOGIN
router.post("/login", (req, res) => {
    const db = loadDB();
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email);
    if (!user) return res.json({ success: false, message: "User not found" });
    if (user.locked) return res.json({ success: false, message: "Account locked" });
    if (!bcrypt.compareSync(password, user.password)) return res.json({ success: false, message: "Incorrect password" });

    res.cookie("session", user.id, { httpOnly: true });
    res.json({ success: true });
});

// LOGOUT
router.post("/logout", (req, res) => {
    res.clearCookie("session");
    res.json({ success: true });
});

// GET USER INFO
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
module.exports = router;
