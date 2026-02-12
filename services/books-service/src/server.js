require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { query } = require('./db');

const app = express();
const port = Number(process.env.PORT || 4002);
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: Number(payload.sub), username: payload.username };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'books' });
});

app.get('/books', authMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();

    let rows;
    if (q) {
      const pattern = `%${q}%`;
      rows = await query(
        `SELECT id, title, author, description, cover, created_at, created_by_username
         FROM books
         WHERE title LIKE ? OR author LIKE ?
         ORDER BY created_at DESC`,
        [pattern, pattern]
      );
    } else {
      rows = await query(
        `SELECT id, title, author, description, cover, created_at, created_by_username
         FROM books
         ORDER BY created_at DESC`
      );
    }

    return res.json(rows);
  } catch (error) {
    console.error('Get books error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/books', authMiddleware, async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const author = String(req.body?.author || '').trim();
    const description = String(req.body?.description || '').trim();
    const cover = String(req.body?.cover || '').trim();

    if (!title || !author || !description || !cover) {
      return res.status(400).json({ error: 'title, author, description, and cover are required' });
    }

    const result = await query(
      `INSERT INTO books (title, author, description, cover, created_by_user_id, created_by_username)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, author, description, cover, req.user.id, req.user.username]
    );

    const rows = await query(
      `SELECT id, title, author, description, cover, created_at, created_by_username
       FROM books WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create book error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/books/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid book id' });
    }

    const books = await query(
      `SELECT id, title, author, description, cover, created_at, created_by_username
       FROM books
       WHERE id = ?`,
      [id]
    );

    if (books.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const reviews = await query(
      `SELECT id, reviewer_username, rating, comment, created_at
       FROM reviews
       WHERE book_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    return res.json({
      ...books[0],
      reviews,
    });
  } catch (error) {
    console.error('Get book error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/books/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const bookId = Number(req.params.id);
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({ error: 'Invalid book id' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    if (!comment) {
      return res.status(400).json({ error: 'comment is required' });
    }

    const book = await query('SELECT id FROM books WHERE id = ? LIMIT 1', [bookId]);
    if (book.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const result = await query(
      `INSERT INTO reviews (book_id, reviewer_user_id, reviewer_username, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [bookId, req.user.id, req.user.username, rating, comment]
    );

    const rows = await query(
      `SELECT id, reviewer_username, rating, comment, created_at
       FROM reviews
       WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/books/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid book id' });
    }

    const existingRows = await query(
      'SELECT id, created_by_user_id FROM books WHERE id = ? LIMIT 1',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (existingRows[0].created_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the creator can edit this book' });
    }

    const title = req.body?.title !== undefined ? String(req.body.title).trim() : null;
    const author = req.body?.author !== undefined ? String(req.body.author).trim() : null;
    const description = req.body?.description !== undefined ? String(req.body.description).trim() : null;
    const cover = req.body?.cover !== undefined ? String(req.body.cover).trim() : null;

    const updates = [];
    const params = [];

    if (title !== null) {
      if (!title) return res.status(400).json({ error: 'title cannot be empty' });
      updates.push('title = ?');
      params.push(title);
    }

    if (author !== null) {
      if (!author) return res.status(400).json({ error: 'author cannot be empty' });
      updates.push('author = ?');
      params.push(author);
    }

    if (description !== null) {
      if (!description) return res.status(400).json({ error: 'description cannot be empty' });
      updates.push('description = ?');
      params.push(description);
    }

    if (cover !== null) {
      if (!cover) return res.status(400).json({ error: 'cover cannot be empty' });
      updates.push('cover = ?');
      params.push(cover);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    params.push(id);
    await query(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`, params);

    const rows = await query(
      `SELECT id, title, author, description, cover, created_at, created_by_username
       FROM books
       WHERE id = ?`,
      [id]
    );

    return res.json(rows[0]);
  } catch (error) {
    console.error('Update book error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/books/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid book id' });
    }

    const existingRows = await query(
      'SELECT id, created_by_user_id FROM books WHERE id = ? LIMIT 1',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (existingRows[0].created_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the creator can delete this book' });
    }

    await query('DELETE FROM books WHERE id = ?', [id]);
    return res.status(204).send();
  } catch (error) {
    console.error('Delete book error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Books service running on port ${port}`);
});
