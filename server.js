const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'arvirmdn-secret-key-2026';
const DB_PATH = process.env.DB_PATH || '/app/data/users.db';

// Middleware
app.use(cors());
app.use(express.json());

// Pastikan folder database ada
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Init SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('SQLite connected at', DB_PATH);
    // Buat tabel users kalau belum ada
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      device_fingerprint TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Create table error:', err);
      else console.log('Users table ready');
    });
  }
});

// Middleware verifikasi token
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid' });
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  });
}

// ===== API ROUTES =====

// Register
app.post('/api/register', (req, res) => {
  const { username, password, device_fingerprint } = req.body;
  if (!username || !password || !device_fingerprint) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password minimal 4 karakter' });
  }

  // Cek apakah device sudah pernah daftar
  db.get('SELECT username FROM users WHERE device_fingerprint = ?', [device_fingerprint], (err, existing) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (existing) {
      return res.status(400).json({ 
        error: 'Perangkat ini sudah terdaftar dengan akun "' + existing.username + '". Satu perangkat hanya boleh 1 akun.' 
      });
    }

    const hash = bcrypt.hashSync(password, 10);
    const email = username.toLowerCase().replace(/[^a-z0-9]/g, '') + '@arvirmdn.local';

    db.run(
      'INSERT INTO users (username, password, email, device_fingerprint) VALUES (?, ?, ?, ?)',
      [username, hash, email, device_fingerprint],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed') && err.message.includes('users.username')) {
            return res.status(400).json({ error: 'Username sudah terdaftar' });
          }
          return res.status(500).json({ error: 'Gagal mendaftar: ' + err.message });
        }
        res.json({ success: true, message: 'Akun berhasil dibuat' });
      }
    );
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(400).json({ error: 'Username tidak ditemukan' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Password salah' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  });
});

// Get current user
app.get('/api/me', authMiddleware, (req, res) => {
  db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ success: true, user });
  });
});

// Reset password (lupa sandi)
app.post('/api/forgot', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username wajib diisi' });

  const newPass = Math.random().toString(36).slice(-8);
  const hash = bcrypt.hashSync(newPass, 10);

  db.run('UPDATE users SET password = ? WHERE username = ?', [hash, username], function(err) {
    if (err) return res.status(500).json({ error: 'Gagal reset' });
    if (this.changes === 0) return res.status(404).json({ error: 'Username tidak ditemukan' });
    res.json({ success: true, newPassword: newPass });
  });
});

// ===== SERVE FRONTEND =====
app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

app.listen(PORT, () => {
  console.log('arvirmdn kontools v0.1 running on port', PORT);
  console.log('Database:', DB_PATH);
});
