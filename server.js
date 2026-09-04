const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 8080;

// ===== KEAMANAN: JWT Secret WAJIB dari environment =====
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('ERROR: JWT_SECRET harus diatur dan minimal 32 karakter!');
  process.exit(1);
}

const DB_PATH = process.env.DB_PATH || '/app/data/users.db';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===== SECURITY HEADERS (Helmet) =====
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // inline style dari script.js
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // untuk compatibility
}));

// ===== CORS TERBATAS =====
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : (NODE_ENV === 'production' ? [] : ['http://localhost:8080', 'http://localhost:3000']);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) {
      // Production tanpa ALLOWED_ORIGINS = block semua
      return callback(new Error('CORS: Origin not allowed'));
    }
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS: Origin not allowed'));
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' })); // Batasi body size

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
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      device_fingerprint TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      failed_attempts INTEGER DEFAULT 0,
      locked_until DATETIME
    )`, (err) => {
      if (err) console.error('Create table error:', err);
      else console.log('Users table ready');
    });
  }
});

// ===== RATE LIMITING =====
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // maksimal 5 request per IP
  message: { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 60, // 60 request per menit
  message: { error: 'Terlalu banyak request. Coba lagi nanti.' },
});

app.use('/api/', apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forgot', authLimiter);

// ===== HELPER FUNCTIONS =====
function sanitizeUsername(username) {
  // Hanya huruf, angka, underscore, titik, strip. Min 3, max 20 karakter.
  return username.replace(/[^a-zA-Z0-9_.-]/g, '').substring(0, 20);
}

function logSecurity(event, details) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} | ${event} | ${JSON.stringify(details)}`);
}

// ===== Middleware verifikasi token =====
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logSecurity('INVALID_TOKEN', { ip: req.ip, error: err.message });
      return res.status(403).json({ error: 'Token tidak valid' });
    }
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  });
}

// ===== VALIDATION CHAINS =====
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Username 3-20 karakter')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Username hanya huruf, angka, _, ., -'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/[a-z]/).withMessage('Password harus ada huruf kecil')
    .matches(/[A-Z]/).withMessage('Password harus ada huruf besar')
    .matches(/[0-9]/).withMessage('Password harus ada angka'),
  body('device_fingerprint')
    .isLength({ min: 10, max: 128 }).withMessage('Fingerprint tidak valid'),
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
];

const forgotValidation = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi'),
];

// ===== API ROUTES =====

// Register
app.post('/api/register', registerValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { username, password, device_fingerprint } = req.body;
  const cleanUsername = sanitizeUsername(username);

  if (!cleanUsername || cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username tidak valid' });
  }

  // Cek apakah device sudah pernah daftar
  db.get('SELECT username FROM users WHERE device_fingerprint = ?', [device_fingerprint], (err, existing) => {
    if (err) {
      logSecurity('DB_ERROR', { ip: req.ip, endpoint: 'register' });
      return res.status(500).json({ error: 'Database error' });
    }
    if (existing) {
      logSecurity('DEVICE_REUSE_ATTEMPT', { ip: req.ip, device: device_fingerprint });
      return res.status(400).json({ 
        error: 'Perangkat ini sudah terdaftar dengan akun lain.' 
      });
    }

    const hash = bcrypt.hashSync(password, 12); // Cost factor 12
    const email = cleanUsername.toLowerCase() + '@arvirmdn.local';

    db.run(
      'INSERT INTO users (username, password, email, device_fingerprint) VALUES (?, ?, ?, ?)',
      [cleanUsername, hash, email, device_fingerprint],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed') && err.message.includes('users.username')) {
            return res.status(400).json({ error: 'Username sudah terdaftar' });
          }
          logSecurity('REGISTER_FAIL', { ip: req.ip, error: err.message });
          return res.status(500).json({ error: 'Gagal mendaftar' });
        }
        logSecurity('REGISTER_SUCCESS', { ip: req.ip, username: cleanUsername });
        res.json({ success: true, message: 'Akun berhasil dibuat' });
      }
    );
  });
});

// Login
app.post('/api/login', loginValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { username, password } = req.body;
  const cleanUsername = sanitizeUsername(username);

  // Cek apakah akun terkunci
  db.get('SELECT * FROM users WHERE username = ?', [cleanUsername], (err, user) => {
    if (err) {
      logSecurity('DB_ERROR', { ip: req.ip, endpoint: 'login' });
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      logSecurity('LOGIN_FAIL_USER_NOT_FOUND', { ip: req.ip, username: cleanUsername });
      return res.status(400).json({ error: 'Username atau password salah' });
    }

    // Cek lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      logSecurity('LOGIN_LOCKED', { ip: req.ip, username: cleanUsername });
      return res.status(423).json({ error: 'Akun terkunci. Coba lagi nanti.' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      // Increment failed attempts
      const newAttempts = (user.failed_attempts || 0) + 1;
      let lockUntil = null;
      if (newAttempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock 30 menit
      }
      db.run(
        'UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?',
        [newAttempts, lockUntil, user.id]
      );
      logSecurity('LOGIN_FAIL_WRONG_PASS', { ip: req.ip, username: cleanUsername, attempts: newAttempts });
      return res.status(400).json({ error: 'Username atau password salah' });
    }

    // Reset failed attempts
    db.run('UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = ? WHERE id = ?',
      [new Date().toISOString(), user.id]
    );

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1d', issuer: 'arvirmdn-kontools', audience: 'arvirmdn-users' }
    );

    logSecurity('LOGIN_SUCCESS', { ip: req.ip, username: user.username });
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

// Reset password (lupa sandi) - DIAMANKAN
// Endpoint ini sekarang HANYA mengirim notifikasi ke admin, TIDAK mengembalikan password
app.post('/api/forgot', forgotValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { username } = req.body;
  const cleanUsername = sanitizeUsername(username);

  db.get('SELECT id, email FROM users WHERE username = ?', [cleanUsername], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memproses' });
    }
    if (!user) {
      // Jangan kasih tahu kalau username tidak ada (security through obscurity)
      logSecurity('FORGOT_REQUEST', { ip: req.ip, username: cleanUsername, found: false });
      return res.json({ success: true, message: 'Jika akun ada, instruksi reset akan dikirim.' });
    }

    logSecurity('FORGOT_REQUEST', { ip: req.ip, username: cleanUsername, found: true });
    // Di produksi: kirim email reset link ke user.email
    // Untuk sekarang, beri response generik
    res.json({ success: true, message: 'Jika akun ada, instruksi reset akan dikirim.' });
  });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  logSecurity('SERVER_ERROR', { ip: req.ip, error: err.message });
  if (NODE_ENV === 'production') {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  } else {
    res.status(500).json({ error: err.message });
  }
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
  console.log('arvirmdn kontools v0.1 (SECURE) running on port', PORT);
  console.log('Database:', DB_PATH);
  console.log('Environment:', NODE_ENV);
});
