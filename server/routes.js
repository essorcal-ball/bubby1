const express = require("express");
const multer = require("multer");
const db = require("./db");
const router = express.Router();

const upload = multer({ dest: "uploads/" });

// REGISTER
router.post("/register",(req,res)=>{
    db.run(
        `INSERT INTO users(username,email,password) VALUES(?,?,?)`,
        [req.body.username, req.body.email, req.body.password],
        err => err ? res.send("Error") : res.send("Account created")
    );
});

// LOGIN
router.post("/login",(req,res)=>{
    db.get(
        `SELECT * FROM users WHERE username=? AND password=?`,
        [req.body.username, req.body.password],
        (err,row)=>{
            if(row){
                res.send("Logged in as "+row.username);
            } else {
                res.send("Invalid login");
            }
        }
    );
});

// GET APPROVED GAMES
router.get("/games",(req,res)=>{
    db.all(`SELECT * FROM games WHERE approved=1`,[],(err,rows)=>{
        res.json(rows);
    });
});

// SUBMIT GAME
router.post("/submit-game",upload.fields([
    { name:"thumbnail", maxCount:1 },
    { name:"file", maxCount:1 }
]),(req,res)=>{
    let tn = req.files.thumbnail[0].path;
    let fl = req.files.file[0].path;

    db.run(
        `INSERT INTO games(name,description,thumbnail,file) VALUES(?,?,?,?)`,
        [req.body.name, req.body.description, tn, fl],
        err => err ? res.send("Error") : res.send("Sent to admin for approval")
    );
});

module.exports = router;
