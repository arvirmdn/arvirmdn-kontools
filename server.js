const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");

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
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(DATA_DIR, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const waUpload = multer({
  dest: uploadDir,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|webm))$/.test(file.mimetype);
    cb(allowed ? null : new Error("Format media tidak didukung."), allowed);
  }
});

app.use(session({
  secret: process.env.SESSION_SECRET || "arvirmdn-premium-change-this-secret",
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

function validProfilePhoto(photo) {
  return typeof photo === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo) && photo.length <= 4 * 1024 * 1024;
}

function isAdminUser(user) {
  if (!user) return false;
  const adminEmail = cleanEmail(process.env.ADMIN_EMAIL || "telokaspeanget999@gmail.com");
  return user.role === "admin" || (!!adminEmail && cleanEmail(user.email) === adminEmail);
}

function sessionUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: isAdminUser(user) ? "admin" : "member",
    profilePhoto: user.profilePhoto || ""
  };
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

  req.session.user = sessionUser(user);
  res.json({ ok: true, user: req.session.user });
});

app.post("/api/login", async (req, res) => {
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");
  const user = readUsers().find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ ok: false, message: "Email atau password salah." });
  }

  req.session.user = sessionUser(user);
  res.json({ ok: true, user: req.session.user });
});

app.post("/api/profile/photo", requireAuth, (req, res) => {
  const photo = req.body.photo;
  if (!validProfilePhoto(photo)) {
    return res.status(400).json({ ok: false, message: "Foto tidak valid atau terlalu besar." });
  }

  const users = readUsers();
  const index = users.findIndex(u => u.id === req.session.user.id);
  if (index === -1) return res.status(404).json({ ok: false, message: "Akun tidak ditemukan." });

  users[index].profilePhoto = photo;
  writeUsers(users);
  req.session.user.profilePhoto = photo;
  res.json({ ok: true, user: req.session.user });
});

app.post("/api/profile/password", requireAuth, async (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");
  if (newPassword.length < 6) return res.status(400).json({ ok: false, message: "Sandi baru minimal 6 karakter." });

  const users = readUsers();
  const index = users.findIndex(u => u.id === req.session.user.id);
  if (index === -1) return res.status(404).json({ ok: false, message: "Akun tidak ditemukan." });

  const matches = await bcrypt.compare(currentPassword, users[index].passwordHash);
  if (!matches) return res.status(401).json({ ok: false, message: "Sandi saat ini salah." });

  users[index].passwordHash = await bcrypt.hash(newPassword, 12);
  writeUsers(users);
  res.json({ ok: true, message: "Sandi berhasil diganti." });
});

function makeToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let out = "ARV-";
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

app.post("/api/wa/generate-token", requireAuth, (req, res) => {
  res.json({ ok: true, token: makeToken(), expiresIn: 15 * 60 });
});

app.post("/api/wa/token-media", requireAuth, waUpload.single("media"), async (req, res) => {
  const cleanup = () => {
    if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => {});
  };
  try {
    const token = String(req.body.token || "").trim().toUpperCase();
    if (!/^ARV-[A-Z0-9]{6}$/.test(token)) {
      cleanup();
      return res.status(400).json({ ok:false, code:"INVALID_TOKEN", message:"Token tidak valid." });
    }
    if (!req.file) {
      return res.status(400).json({ ok:false, code:"MEDIA_REQUIRED", message:"Media belum dipilih." });
    }

    const botApiUrl = String(process.env.BOT_API_URL || "").replace(/\/$/, "");
    if (!botApiUrl) {
      cleanup();
      return res.status(503).json({ ok:false, code:"BOT_NOT_CONNECTED", message:"Bot WhatsApp belum terhubung." });
    }

    const boundary = `----ARVIRMDN${Date.now().toString(16)}`;
    const safeName = req.file.originalname.replace(/["\\]/g, "_");
    const head = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="token"\r\n\r\n${token}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="media"; filename="${safeName}"\r\n` +
      `Content-Type: ${req.file.mimetype}\r\n\r\n`
    );
    const fileBuffer = await fs.promises.readFile(req.file.path);
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([head, fileBuffer, tail]);

    const botResponse = await fetch(`${botApiUrl}/token-media`, {
      method:"POST",
      headers:{ "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": String(body.length) },
      body
    });
    const data = await botResponse.json().catch(() => ({}));
    cleanup();
    if (!botResponse.ok) {
      return res.status(botResponse.status).json({ ok:false, code:data.code || "BOT_TOKEN_ERROR", message:data.message || "Bot gagal menerima media." });
    }
    return res.json({ ...data, token });
  } catch (error) {
    cleanup();
    console.error("TOKEN MEDIA ERROR:", error);
    return res.status(500).json({ ok:false, code:"TOKEN_MEDIA_FAILED", message:error.message || "Gagal mengirim media ke bot." });
  }
});

app.post("/api/wa/check-member", requireAuth, async (req, res) => {
  // Admin selalu mendapat akses tanpa perlu terdaftar sebagai member group.
  if (isAdminUser(req.session.user)) {
    return res.json({
      ok: true,
      member: true,
      admin: true,
      code: "ADMIN_BYPASS",
      message: "Akses admin diberikan tanpa pengecekan member group."
    });
  }

  const phone = String(req.body.phone || "").replace(/\D/g, "");
  if (!/^628\d{7,13}$/.test(phone)) {
    return res.status(400).json({ ok: false, code: "INVALID_PHONE", message: "Nomor WhatsApp tidak valid." });
  }

  const botApiUrl = String(process.env.BOT_API_URL || "").replace(/\/$/, "");
  const groupId = String(process.env.BOT_GROUP_ID || "");

  // Bot akan dipasang pada tahap berikutnya. Jika URL bot belum diisi,
  // jangan menganggap nomor ada/tidak ada di group secara palsu.
  if (!botApiUrl) {
    return res.status(503).json({
      ok: false,
      code: "BOT_NOT_CONNECTED",
      message: "Bot WhatsApp belum terhubung."
    });
  }

  try {
    const botResponse = await fetch(`${botApiUrl}/check-member`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, groupId })
    });
    const data = await botResponse.json().catch(() => ({}));

    if (!botResponse.ok) {
      return res.status(botResponse.status).json({
        ok: false,
        code: data.code || "BOT_ERROR",
        message: data.message || "Bot gagal memeriksa group."
      });
    }

    return res.json(data);
  } catch (error) {
    return res.status(502).json({
      ok: false,
      code: "BOT_UNREACHABLE",
      message: "Bot WhatsApp tidak dapat dihubungi."
    });
  }
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
  console.log(`ARVIRMDN Premium Web running on port ${PORT}`);
});
