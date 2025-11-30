const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(require("express-fileupload")());

// API routes
app.use("/api", require("./routes"));
app.use("/api/admin", require("./routes-admin"));

// Serve frontend
app.use(express.static(path.join(__dirname, "../client")));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
