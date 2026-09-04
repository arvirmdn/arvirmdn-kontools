const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")); }
  catch { return []; }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "arvir-premium-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, status: "healthy" });
});

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ ok: false, message: "Silakan masuk terlebih dahulu." });
  next();
}

app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.json({ ok: true, loggedIn: false });
  res.json({ ok: true, loggedIn: true, user: req.session.user });
});

app.post("/api/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");

  if (name.length < 2) return res.status(400).json({ ok: false, message: "Nama minimal 2 karakter." });
  if (!validEmail(email)) return res.status(400).json({ ok: false, message: "Format email tidak valid." });
  if (password.length < 6) return res.status(400).json({ ok: false, message: "Password minimal 6 karakter." });

  const users = readUsers();
  if (users.some(u => u.email === email)) {
    return res.status(409).json({ ok: false, message: "Email sudah terdaftar." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeUsers(users);

  req.session.user = { id: user.id, name: user.name, email: user.email };
  res.json({ ok: true, user: req.session.user });
});

app.post("/api/login", async (req, res) => {
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");
  const user = readUsers().find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ ok: false, message: "Email atau password salah." });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  res.json({ ok: true, user: req.session.user });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

app.get("/dashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ARVIR Premium Web running on port ${PORT}`);
});
