# arvirmdn kontools v0.1

Web tools & utilities dengan tema dark modern. Dibangun dengan HTML, CSS, dan JavaScript vanilla.

## Fitur

- **Autentikasi** — Halaman login, daftar, dan lupa sandi
- **Profil** — Halaman profil pengguna
- **Link to APK** — Konverter URL ke APK (placeholder)
- **Status HD** — Monitoring status server (placeholder)
- **Sidebar Collapse** — Bisa sembunyikan/tampilkan menu sidebar
- **Responsive** — Support desktop & mobile

## Struktur File

```
.
├── index.html       # Struktur halaman (WAJIB ada)
├── style.css        # Styling & animasi (WAJIB ada)
├── script.js        # Logika & interaksi (WAJIB ada)
├── server.js        # Express server untuk Railway
├── package.json     # Dependensi Node.js
├── Procfile         # Config untuk Railway
├── railway.json     # Config Railway (opsional)
├── .gitignore       # Abaikan node_modules
└── README.md        # Dokumentasi ini
```

## Deploy ke Railway

### 1. Siapkan file

Extract ZIP, masuk ke folder. Pastikan semua file ada:
- `index.html`
- `style.css`
- `script.js`
- `server.js`
- `package.json`
- `Procfile`

### 2. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

**PENTING:** Jangan lupa include `index.html`, `style.css`, `script.js` saat commit!

### 3. Deploy di Railway

1. Buka [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Pilih repo yang sudah di-push
4. Railway akan otomatis build & deploy
5. Tunggu 1-2 menit, klik link domain yang muncul

### Troubleshooting

**Error: "index.html not found"**
- Pastikan semua file (termasuk index.html, style.css, script.js) sudah di-push ke GitHub
- Cek tab "Deployments" di Railway, pastikan build sukses

**Error: "Cannot find module 'express'"**
- Pastikan `npm install` sudah dijalankan lokal, atau
- Railway akan otomatis install dari `package.json`

## Deploy ke GitHub Pages (Static)

Kalau mau static hosting tanpa server:

1. Upload `index.html`, `style.css`, `script.js` ke repo GitHub
2. Settings → Pages → Branch: main / root
3. Selesai

---

Dibuat oleh arvirmdn
