import express from "express";

export default function createAdminRoutes(db) {
  const router = express.Router();

  router.get("/users", async (req, res) => {
    const users = await db.all("SELECT * FROM users");
    res.json(users);
  });

  router.post("/promote", async (req, res) => {
    await db.run("UPDATE users SET isPro = 1 WHERE id = ?", [req.body.id]);
    res.json({ success: true });
  });

  router.post("/demote", async (req, res) => {
    await db.run("UPDATE users SET isPro = 0 WHERE id = ?", [req.body.id]);
    res.json({ success: true });
  });

  router.post("/approve", async (req, res) => {
    await db.run("UPDATE games SET approved = 1 WHERE id = ?", [req.body.id]);
    res.json({ success: true });
  });

  router.post("/delete-game", async (req, res) => {
    await db.run("DELETE FROM games WHERE id = ?", [req.body.id]);
    res.json({ success: true });
  });

  return router;
}
