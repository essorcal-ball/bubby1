// server/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const DB_PATH = path.join(__dirname, "data.sqlite");

const db = new sqlite3.Database(DB_PATH);

function init() {
  db.serialize(() => {
    db.run(`PRAGMA foreign_keys = ON;`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      username TEXT,
      about TEXT,
      password TEXT,
      verified INTEGER DEFAULT 0,
      verification_code TEXT,
      pro INTEGER DEFAULT 0,
      locked INTEGER DEFAULT 0
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      image_path TEXT,
      file_path TEXT,
      link TEXT,
      approved INTEGER DEFAULT 0,
      uploader_id TEXT,
      FOREIGN KEY(uploader_id) REFERENCES users(id) ON DELETE SET NULL
    );`);
  });
}

module.exports = { db, init };
