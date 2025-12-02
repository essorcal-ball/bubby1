// server/routes.js
const express = require("express");
const router = express.Router();
const { db } = require("./db");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: __dirname + "/.env" });
const path = require("path");
const fs = require("fs");

// transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

// HELPERS
function runAsync(sql, params = []) {
  return new Promise((res, rej) => db.run(sql, params, function (err) {
    if (err) rej(err); else res(this);
  }));
}
function getAsync(sql, params = []) {
  return new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
}
function allAsync(sql, params = []) {
  return new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
}

function getCurrentUser(req) {
  const session = req.cookies.session;
  if (!session) return null;
  return getAsync("SELECT * FROM users WHERE id = ?", [session]);
}

// SIGNUP: create user, generate code, send email
router.post("/signup", async (req, res) => {
  try {
    const { name, email, username, about, password } = req.body;
    // email unique
    const existing = await getAsync("SELECT * FROM users WHERE email = ?", [email]);
    if (existing) return res.json({ success: false, message: "Email already used" });

    const id = uuidv4();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = bcrypt.hashSync(password, 10);

    await runAsync(`INSERT INTO users (id, name, email, username, about, password, verification_code) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, username, about, hashed, code]);

    // send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Your verification code",
      text: `Your verification code: ${code}`
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error creating account" });
  }
});

// VERIFY
router.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await getAsync("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.json({ success: false, message: "Email not found" });
    if (user.verified) return res.json({ success: false, message: "Already verified" });
    if (user.verification_code === code) {
      await runAsync("UPDATE users SET verified = 1, verification_code = NULL WHERE id = ?", [user.id]);
      return res.json({ success: true });
    } else return res.json({ success: false, message: "Incorrect code" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error verifying" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getAsync("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.json({ success: false, message: "User not found" });
    if (user.locked) return res.json({ success: false, message: "Account locked" });
    if (!bcrypt.compareSync(password, user.password)) return res.json({ success: false, message: "Incorrect password" });
    // set session cookie (user id)
    res.cookie("session", user.id, { httpOnly: true });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Login error" });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.json({ success: true });
});

// ME
router.get("/me", async (req, res) => {
  try {
    const session = req.cookies.session;
    if (!session) return res.json({ loggedIn: false });
    const user = await getAsync("SELECT id, name, email, username, about, pro, locked FROM users WHERE id = ?", [session]);
    if (!user) return res.json({ loggedIn: false });
    res.json({ loggedIn: true, ...user });
  } catch (err) { console.error(err); res.json({ loggedIn: false }); }
});

// UPLOAD GAME (file uploads allowed)
router.post("/upload", async (req, res) => {
  try {
    const session = req.cookies.session;
    if (!session) return res.json({ success: false, message: "Login required" });
    const user = await getAsync("SELECT * FROM users WHERE id = ?", [session]);
    if (!user) return res.json({ success: false, message: "Login required" });
    if (user.locked) return res.json({ success: false, message: "Account locked" });

    const { title, description, link } = req.body;
    const id = uuidv4();
    let image_path = null;
    let file_path = null;

    // handle uploaded image/file (express-fileupload)
    if (req.files) {
      if (req.files.image) {
        const img = req.files.image;
        const imgName = `${id}_img_${img.name}`;
        const dest = path.join(__dirname, "../uploads", imgName);
        await img.mv(dest);
        image_path = `/uploads/${imgName}`;
      }
      if (req.files.gamefile) {
        const gf = req.files.gamefile;
        const fName = `${id}_file_${gf.name}`;
        const dest = path.join(__dirname, "../uploads", fName);
        await gf.mv(dest);
        file_path = `/uploads/${fName}`;
      }
    }

    await runAsync(`INSERT INTO games (id, title, description, image_path, file_path, link, uploader_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description, image_path, file_path, link || null, user.id]);

    res.json({ success: true, message: "Submitted for admin approval" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Upload failed" });
  }
});

// GET APPROVED GAMES (list)
router.get("/games", async (req, res) => {
  try {
    const rows = await allAsync("SELECT * FROM games WHERE approved = 1");
    res.json({ games: rows });
  } catch (err) { console.error(err); res.json({ games: [] }); }
});

// GET SINGLE GAME
router.get("/game", async (req, res) => {
  try {
    const id = req.query.id;
    const game = await getAsync("SELECT * FROM games WHERE id = ?", [id]);
    res.json(game || {});
  } catch (err) { console.error(err); res.json({}); }
});

// Simple route to check admin failed attempts and lock logic is handled in admin route
module.exports = router;
