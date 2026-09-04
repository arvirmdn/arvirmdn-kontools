<div align="center">

# ✦ arvirmdn kontools

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-7c3aed?style=flat-square" />
  <img src="https://img.shields.io/badge/stack-Node.js%20%2B%20SQLite-13131c?style=flat-square&color=7c3aed" />
  <img src="https://img.shields.io/badge/license-MIT-7c3aed?style=flat-square" />
</p>

*Kumpulan tools & utilities dalam satu dashboard dark modern.*

</div>

---

## ✦ Tentang

**arvirmdn kontools** adalah platform tools berbasis web dengan tema gelap yang elegan. Dibangun untuk kemudahan dan efisiensi — satu akun, satu perangkat, semua tools dalam genggaman.

## ✦ Fitur

| Fitur | Status |
|-------|--------|
| 🔐 Autentikasi (Daftar / Masuk / Lupa Sandi) | ✅ Aktif |
| 👤 Profil Pengguna | ✅ Aktif |
| 🔗 Link to APK | 🚧 Dalam Pengembangan |
| 📊 Status HD | 🚧 Dalam Pengembangan |
| 📱 Responsive Design | ✅ Aktif |
| 🛡️ 1 Perangkat = 1 Akun | ✅ Aktif |

## ✦ Tech Stack

```
Frontend    →  HTML5 + CSS3 + Vanilla JS
Backend     →  Node.js + Express
Database    →  SQLite
Auth        →  JWT + bcrypt
Deploy      →  Railway
```

## ✦ Struktur

```
.
├── index.html       # Tampilan
├── style.css        # Styling & Animasi
├── script.js        # Logika Frontend
├── server.js        # API Backend
└── package.json     # Dependensi
```

## ✦ Deploy

```bash
git add .
git commit -m "deploy"
git push origin main
```

> Deploy ke Railway dengan Volume mount `/app/data` dan Variables `JWT_SECRET` serta `DB_PATH`.

## ✦ Catatan

- Data pengguna tersimpan di server (SQLite).
- Satu perangkat hanya dapat mendaftar satu akun.
- Token JWT berlaku selama 7 hari.

---

<div align="center">

**arvirmdn kontools v0.1**  
*Dibuat dengan 💜 oleh arvirmdn*

</div>
