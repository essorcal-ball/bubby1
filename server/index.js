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
