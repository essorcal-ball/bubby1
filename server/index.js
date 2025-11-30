// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const db = require('./db');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const ADMIN_PASS = process.env.ADMIN_PASSCODE || 'stego';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const PRO_PRICE_CENTS = parseInt(process.env.PRO_PRICE_CENTS||'100', 10);

// uploads directory
const UPLOADS = path.join(__dirname, 'uploads');
if(!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS);

// serve static uploads
app.use('/uploads', express.static(UPLOADS));

/* -------------------------
   Multer for thumbnails
   ------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${file.originalname}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

/* -------------------------
   Helper functions
   ------------------------- */
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'missing token' });
  const parts = auth.split(' ');
  if(parts.length !== 2) return res.status(401).json({ error: 'bad auth' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch(err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}
function adminMiddleware(req, res, next) {
  const pass = req.headers['x-admin-pass'] || req.query.admin_pass;
  if(pass === ADMIN_PASS) return next();
  return res.status(403).json({ error: 'admin only' });
}

/* -------------------------
   Auth routes (no password for simplicity)
   - register/login by username
   ------------------------- */
app.post('/api/register-or-login', (req, res) => {
  const { username, email, name, about } = req.body || {};
  if(!username) return res.status(400).json({ error: 'username required' });
  const find = db.prepare('SELECT * FROM users WHERE LOWER(username) = ?').get(username.toLowerCase());
  if(find) {
    // login
    const token = signToken(find.id);
    return res.json({ user: find, token });
  }
  if(!email || !name) return res.status(400).json({ error: 'name and email required to create' });
  const id = uuidv4();
  db.prepare(`INSERT INTO users (id, username, email, name, about, plays, isPro) VALUES (?, ?, ?, ?, ?, 0, 0)`)
    .run(id, username, email, name, about || '');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const token = signToken(id);
  return res.json({ user, token });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if(!user) return res.status(404).json({ error: 'not found' });
  res.json({ user });
});

/* -------------------------
   Submit game (member)
   ------------------------- */
app.post('/api/submit-game', authMiddleware, upload.single('thumbnail'), (req, res) => {
  const { title, link, message } = req.body;
  if(!title || !link) return res.status(400).json({ error: 'title and link required' });
  if(!req.file) return res.status(400).json({ error: 'thumbnail required' });
  const id = uuidv4();
  const thumbnail = `/uploads/${req.file.filename}`;
  db.prepare(`INSERT INTO pending_games (id, title, link, message, thumbnail, submittedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, title, link, message || '', thumbnail, req.userId, Date.now());
  return res.json({ success: true });
});

/* -------------------------
   Admin: view pending, approve, reject
   ------------------------- */
app.get('/api/pending', adminMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM pending_games ORDER BY createdAt DESC').all();
  res.json({ pending: rows });
});

app.post('/api/pending/:id/approve', adminMiddleware, (req, res) => {
  const id = req.params.id;
  const item = db.prepare('SELECT * FROM pending_games WHERE id = ?').get(id);
  if(!item) return res.status(404).json({ error: 'not found' });
  // move to approved_games
  db.prepare(`INSERT INTO approved_games (id, title, link, thumbnail, submittedBy, approvedAt) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(item.id, item.title, item.link, item.thumbnail, item.submittedBy, Date.now());
  db.prepare('DELETE FROM pending_games WHERE id = ?').run(id);
  res.json({ success: true });
});

app.post('/api/pending/:id/reject', adminMiddleware, (req, res) => {
  const id = req.params.id;
  const item = db.prepare('SELECT * FROM pending_games WHERE id = ?').get(id);
  if(!item) return res.status(404).json({ error: 'not found' });
  // remove thumbnail file optionally (safe to leave)
  db.prepare('DELETE FROM pending_games WHERE id = ?').run(id);
  res.json({ success: true });
});

/* -------------------------
   Public approved games
   ------------------------- */
app.get('/api/approved', (req, res) => {
  const rows = db.prepare('SELECT * FROM approved_games ORDER BY approvedAt DESC').all();
  // attach avg rating
  const out = rows.map(r => {
    const votes = db.prepare('SELECT value FROM votes WHERE gameId = ?').all(r.id).map(v => v.value);
    const avg = votes.length ? (votes.reduce((a,b)=>a+b,0)/votes.length) : 0;
    return Object.assign({}, r, { avgRating: avg, votesCount: votes.length });
  });
  res.json({ games: out });
});

/* -------------------------
   Play counter
   ------------------------- */
app.post('/api/play/:gameId', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if(!user) return res.status(404).json({ error: 'user not found' });
  db.prepare('UPDATE users SET plays = plays + 1 WHERE id = ?').run(req.userId);
  res.json({ success: true });
});

/* -------------------------
   Vote
   - free users: 1 vote per game
   - pro users: up to 5 votes per game
   ------------------------- */
app.post('/api/vote/:gameId', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { value } = req.body;
  const gameId = req.params.gameId;
  if(!value || value < 1 || value > 5) return res.status(400).json({ error: 'invalid rating' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const limit = user && user.isPro ? 5 : 1;
  const used = db.prepare('SELECT COUNT(*) as c FROM votes WHERE userId = ? AND gameId = ?').get(userId, gameId).c;
  if(used >= limit) return res.status(400).json({ error: 'vote limit reached' });
  const id = uuidv4();
  db.prepare('INSERT INTO votes (id, userId, gameId, value, createdAt) VALUES (?, ?, ?, ?, ?)').run(id, userId, gameId, value, Date.now());
  res.json({ success: true });
});

/* -------------------------
   Chat (Pro users only)
   ------------------------- */
app.post('/api/chat', authMiddleware, (req, res) => {
  const { msg } = req.body || {};
  if(!msg) return res.status(400).json({ error: 'msg required' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if(!user || !user.isPro) return res.status(403).json({ error: 'Pro only' });
  const id = uuidv4();
  db.prepare('INSERT INTO chat (id, fromUser, msg, createdAt) VALUES (?, ?, ?, ?)').run(id, this.userId || req.userId, msg, Date.now());
  res.json({ success: true });
});
app.get('/api/chat', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if(!user || !user.isPro) return res.status(403).json({ error: 'Pro only' });
  const msgs = db.prepare('SELECT * FROM chat ORDER BY createdAt ASC LIMIT 500').all();
  res.json({ chat: msgs });
});

/* -------------------------
   Members & admin user actions
   ------------------------- */
app.get('/api/members', adminMiddleware, (req, res) => {
  const rows = db.prepare('SELECT id, username, email, name, about, plays, isPro FROM users ORDER BY username').all();
  res.json({ members: rows });
});
app.post('/api/members/:id/promote', adminMiddleware, (req, res) => {
  const id = req.params.id;
  db.prepare('UPDATE users SET isPro = 1 WHERE id = ?').run(id);
  res.json({ success: true });
});
app.post('/api/members/:id/demote', adminMiddleware, (req, res) => {
  const id = req.params.id;
  db.prepare('UPDATE users SET isPro = 0 WHERE id = ?').run(id);
  res.json({ success: true });
});
app.post('/api/members/:id/kick', adminMiddleware, (req, res) => {
  const id = req.params.id;
  // remove ratings
  db.prepare('DELETE FROM votes WHERE userId = ?').run(id);
  // remove pending submissions
  db.prepare('DELETE FROM pending_games WHERE submittedBy = ?').run(id);
  // remove user
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

/* -------------------------
   Stripe Checkout (create session) & webhook
   ------------------------- */
app.post('/api/create-checkout-session', authMiddleware, async (req, res) => {
  if(!stripe) return res.status(500).json({ error: 'stripe not configured' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if(!user) return res.status(404).json({ error: 'no user' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Pro membership (Bob the Stickman Games)' },
            unit_amount: PRO_PRICE_CENTS
          },
          quantity: 1
        }
      ],
      metadata: { userId: user.id },
      success_url: `${BASE_URL}/?checkout=success`,
      cancel_url: `${BASE_URL}/?checkout=cancel`
    });
    res.json({ url: session.url });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'stripe error' });
  }
});

// Stripe webhook (use raw body)
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    if(webhookSecret && stripe.webhooks) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body; // fallback (not recommended)
    }
  } catch(err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if(event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata && session.metadata.userId;
    if(userId) {
      db.prepare('UPDATE users SET isPro = 1 WHERE id = ?').run(userId);
      console.log('Marked user as Pro via webhook:', userId);
    }
  }
  res.json({ received: true });
});

/* -------------------------
   Basic static client file serving (optional)
   ------------------------- */
app.use('/', express.static(path.join(__dirname, '..', 'client')));

app.listen(PORT, () => console.log('Server running on port', PORT));
