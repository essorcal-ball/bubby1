import express from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";

export default function createUserRoutes(db) {
  const router = express.Router();
  const upload = multer({ dest: "uploads/" });

  router.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    try {
      const hash = await bcrypt.hash(password, 10);

      await db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hash]
      );

      res.json({ success: true });
    } catch {
      res.json({ success: false, error: "Username already exists" });
    }
  });

  router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await db.get(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (!user) return res.json({ success: false });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false });

    res.json({
      success: true,
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      isPro: user.isPro
    });
  });

  router.post("/upload", upload.single("file"), async (req, res) => {
    const { title, description, uploaderId } = req.body;

    await db.run(
      `INSERT INTO games (title, description, filePath, uploaderId) VALUES (?, ?, ?, ?)`,
      [title, description, req.file.filename, uploaderId]
    );

    res.json({ success: true });
  });

  router.get("/games", async (req, res) => {
    const games = await db.all("SELECT * FROM games WHERE approved = 1");
    res.json(games);
  });

  router.get("/game/:id", async (req, res) => {
    const game = await db.get("SELECT * FROM games WHERE id = ?", [
      req.params.id
    ]);
    res.json(game);
  });

  return router;
}
