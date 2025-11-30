const express = require("express");
const db = require("./db");
const router = express.Router();

// simple admin session (not secure but works)
let adminLoggedIn = false;

// ADMIN LOGIN (password = "stego")
router.post("/admin/login", (req,res)=>{
    if (req.body.password === "stego") {
        adminLoggedIn = true;
        res.json({ success:true });
    } else {
        res.json({ success:false });
    }
});

// GET PENDING GAMES
router.get("/admin/pending-games", (req,res)=>{
    if (!adminLoggedIn) return res.json([]);

    db.all(`SELECT * FROM games WHERE approved=0`,[],(err,rows)=>{
        res.json(rows);
    });
});

// APPROVE
router.post("/admin/approve/:id",(req,res)=>{
    if (!adminLoggedIn) return res.send("Not admin");

    db.run(`UPDATE games SET approved=1 WHERE id=?`, [req.params.id]);
    res.send("Approved");
});

// REJECT
router.post("/admin/reject/:id",(req,res)=>{
    if (!adminLoggedIn) return res.send("Not admin");

    db.run(`DELETE FROM games WHERE id=?`, [req.params.id]);
    res.send("Rejected");
});

// GET ALL USERS
router.get("/admin/users",(req,res)=>{
    if (!adminLoggedIn) return res.json([]);

    db.all(`SELECT * FROM users`,[],(err,rows)=>{
        res.json(rows);
    });
});

// PROMOTE TO PRO
router.post("/admin/promote/:id",(req,res)=>{
    if (!adminLoggedIn) return res.send("Not admin");

    db.run(`UPDATE users SET isPro=1 WHERE id=?`,[req.params.id]);
    res.send("Promoted");
});

// REMOVE PRO
router.post("/admin/demote/:id",(req,res)=>{
    if (!adminLoggedIn) return res.send("Not admin");

    db.run(`UPDATE users SET isPro=0 WHERE id=?`,[req.params.id]);
    res.send("Demoted");
});

// KICK USER
router.delete("/admin/kick/:id",(req,res)=>{
    if (!adminLoggedIn) return res.send("Not admin");

    db.run(`DELETE FROM users WHERE id=?`,[req.params.id]);
    res.send("User deleted");
});

module.exports = router;
