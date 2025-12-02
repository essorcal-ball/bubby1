// server/routes-admin.js
const express = require("express");
const router = express.Router();
const { db } = require("./db");
const { v4: uuidv4 } = require("uuid");
const { load } = require("fs");
const path = require("path");

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

const ADMIN_PASS = process.env.ADMIN_PASS || "stego";

// admin login (sets admin cookie)
router.post("/login", (req, res) => {
  const pass = req.body.pass;
  if (pass === ADMIN_PASS) {
    res.cookie("admin", "yes", { httpOnly: true });
    return res.json({ success: true });
  } else {
    // track wrong attempts in cookie for simplicity
    let attempts = parseInt(req.cookies.admin_attempts || "0", 10) || 0;
    attempts++;
    res.cookie("admin_attempts", attempts.toString(), { httpOnly: true });
    // if second wrong attempt while logged in as user, lock that user's account
    const session = req.cookies.session;
    if (session && attempts >= 2) {
      db.run("UPDATE users SET locked = 1 WHERE id = ?", [session]);
    }
    return res.json({ success: false });
  }
});

function isAdmin(req) { return req.cookies.admin === "yes"; }

// get pending games
router.get("/pending", async (req, res) => {
  if (!isAdmin(req)) return res.json({ error: "Not admin" });
  const rows = await allAsync("SELECT * FROM games WHERE approved = 0");
  res.json(rows);
});

// approve a game
router.post("/approve", async (req, res) => {
  if (!isAdmin(req)) return res.json({ error: "Not admin" });
  await runAsync("UPDATE games SET approved = 1 WHERE id = ?", [req.body.id]);
  res.json({ success: true });
});

// deny/delete pending
router.post("/deny", async (req, res) => {
  if (!isAdmin(req)) return res.json({ error: "Not admin" });
  await runAsync("DELETE FROM games WHERE id = ?", [req.body.id]);
  res.json({ success: true });
});

// list members
router.get("/members", async (req, res) => {
  if (!isAdmin(req)) return res.json({ error: "Not admin" });
  const rows = await allAsync("SELECT id, name, email, username, pro, locked FROM users");
  res.json(rows);
});

// toggle pro
router.post("/togglePro", async (req, res) => {
  if (!isAdmin(req)) return res.json({ error: "Not admin" });
  const userId = req.body.id;
  const user = await getAsync("SELECT * FROM users WHERE id = ?", [userId]);
  if (!user) return res.json({ error: "User not found" });
  const newVal = user.pro ? 0 : 1;
  await runAsync("UPDATE users SET pro = ? WHERE id = ?", [newVal, userId]);
  res.json({ success: true });
});

// unlock user
router.post("/unlock", async (req, res) => {
  if (!isAdmin(req)) return res.json({ error: "Not admin" });
  await runAsync("UPDATE users SET locked = 0 WHERE id = ?", [req.body.id]);
  res.json({ success: true });
});

// kick (delete) user
router.post("/kick", async (req, res) => {
  if (!isAdmin(req)) return res.json({ error: "Not admin" });
  await runAsync("DELETE FROM users WHERE id = ?", [req.body.id]);
  res.json({ success: true });
});

module.exports = router;
