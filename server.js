const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve HTML/CSS/JS from /public folder

// In-memory storage (replace with DB in production)
let games = [];
let users = [];

// Submit a game
app.post("/api/games", (req, res) => {
  const { title, desc } = req.body;
  if (!title || !desc) return res.status(400).json({ error: "Missing data" });
  games.push({ title, desc, approved: false });
  res.json({ success: true });
});

// Get all games
app.get("/api/games", (req, res) => res.json(games));

// Approve or remove games (admin)
app.post("/api/admin/games/:index/approve", (req, res) => {
  const index = parseInt(req.params.index);
  if (games[index]) {
    games[index].approved = true;
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Game not found" });
});

app.delete("/api/admin/games/:index", (req, res) => {
  const index = parseInt(req.params.index);
  if (games[index]) {
    games.splice(index, 1);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Game not found" });
});

// Users API
app.get("/api/users", (req, res) => res.json(users));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
