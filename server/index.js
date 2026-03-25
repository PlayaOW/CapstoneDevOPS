const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Handle music files: Redirect to CDN if configured, otherwise serve locally
const MUSIC_CDN = process.env.MUSIC_CDN_URL;
if (MUSIC_CDN) {
  app.get('/music/:file', (req, res) => {
    res.redirect(`${MUSIC_CDN}/${req.params.file}`);
  });
} else {
  app.use('/music', express.static(path.join(__dirname, 'public/music')));
}

const JWT_SECRET = process.env.JWT_SECRET;

// Helper to calculate rank based on XP
const getRank = (xp) => {
  if (xp < 100) return { title: 'Novice', badge: '🌱' };
  if (xp < 500) return { title: 'Apprentice', badge: '📜' };
  if (xp < 1500) return { title: 'Adept', badge: '🛡️' };
  if (xp < 4000) return { title: 'Master', badge: '⚔️' };
  return { title: 'Time Lord', badge: '👑' };
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, xp FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    const rank = getRank(user.xp);
    res.json({ ...user, ...rank });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/api/session', authenticateToken, async (req, res) => {
  try {
    const { duration } = req.body; // duration in minutes
    const xpGained = duration; 
    await db.query('INSERT INTO sessions (user_id, duration) VALUES (?, ?)', [req.user.id, duration]);
    await db.query('UPDATE users SET xp = xp + ? WHERE id = ?', [xpGained, req.user.id]);
    res.json({ message: 'Session saved', xpGained });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get(/.*/, (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
