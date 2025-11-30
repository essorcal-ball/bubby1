const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve client folder
app.use(express.static(path.join(__dirname, "../client")));

// API routes
app.use("/api", require("./routes"));
app.use("/api/admin", require("./routes-admin"));

// For any non-API page, send index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on Port " + PORT));
