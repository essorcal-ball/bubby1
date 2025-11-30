import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { initDB } from "./db.js";
import createUserRoutes from "./routes.js";
import createAdminRoutes from "./routes-admin.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.static("../client"));

const db = await initDB();

app.use("/api", createUserRoutes(db));
app.use("/api/admin", createAdminRoutes(db));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve client files
app.use(express.static(path.join(__dirname, "../client")));

// your API routes
app.use("/api", require("./routes"));
app.use("/api/admin", require("./routes-admin"));

// for any non-API route, serve index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
