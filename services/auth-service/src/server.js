require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('./db');

const app = express();
const port = Number(process.env.PORT || 4001);
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/health', async (req, res) => {
  res.json({ ok: true, service: 'auth' });
});

app.post('/auth/signup', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    const user = { id: result.insertId, username };
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = await query(
      'SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const safeUser = { id: user.id, username: user.username };
    const token = signToken(safeUser);

    return res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  return res.json({ id: req.user.id, username: req.user.username });
});

app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});
