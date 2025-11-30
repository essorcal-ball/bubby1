const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// SIGNUP
router.post("/signup", (req, res) => {
    const db = loadDB();
    const { name, email, username, about, password } = req.body;
    if (db.users.find(u => u.email === email))
        return res.json({ success: false, message: "Email already used." });

    const id = uuid();
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    db.users.push({
        id,
        name,
        email,
        username,
        about,
        password: bcrypt.hashSync(password),
        verified: false,
        verificationCode,
        pro: false,
        plays: 0,
        ratings: [],
        locked: false
    });
    saveDB(db);

    transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Bob The Stickman Games - Verify your email",
        text: "Your verification code is: " + verificationCode
    });

    res.json({ success: true });
});

// VERIFY
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
        res.json({ success: true });
    } else res.json({ success: false, message: "Incorrect code" });
});
