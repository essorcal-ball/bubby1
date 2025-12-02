// server/index.js
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const { init } = require("./db");

init();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || "secret"));
app.use(fileUpload());

// API routes
app.use("/api", require("./routes"));
app.use("/api/admin", require("./routes-admin"));

// Serve public folder
app.use(express.static(path.join(__dirname, "../public")));

// Serve uploads publicly
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Fallback: serve index
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server listening on port", PORT));
