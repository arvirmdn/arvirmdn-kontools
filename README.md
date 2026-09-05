# arvirmdn kontools v0.1

Website premium dengan login, daftar akun, session, dashboard, dan sidebar responsive. Project ini sudah disiapkan agar bisa langsung di-upload ke GitHub dan di-deploy ke Railway.

## Fitur
- Halaman Masuk / Daftar
- Registrasi akun dengan password yang di-hash menggunakan bcrypt
- Session login
- Dashboard setelah login
- Sidebar desktop dan mobile
- Tombol frontend menggunakan `addEventListener` (tanpa inline `onclick`)
- Endpoint health check: `/health`
- Tidak membutuhkan `dotenv` di Railway

## Jalankan di Android/Termux

```bash
npm install
cp .env.example .env
npm start
```

Buka:
`http://localhost:3000`

## Deploy ke GitHub + Railway

### 1. Upload ke GitHub
Upload seluruh isi folder project ini ke repository GitHub. Pastikan `package.json`, `server.js`, folder `public/`, dan `railway.json` ikut ter-upload.

Jangan upload `.env` atau `data/users.json`. Keduanya sudah masuk `.gitignore`.

### 2. Deploy di Railway

Pilih **New Project → Deploy from GitHub Repo**, lalu pilih repository ini. Railway akan membaca `package.json` dan menjalankan:

```bash
npm start
```

`railway.json` juga sudah menetapkan start command dan restart policy.

### 3. Environment Variables

Di Railway → **Variables**, tambahkan:

```text
NODE_ENV=production
SESSION_SECRET=buat-string-acak-panjang-di-sini
```

`PORT` tidak wajib diisi karena Railway menyediakan `PORT` secara otomatis.

### 4. Generate domain

Railway → **Settings / Networking → Generate Domain**. Setelah deployment berhasil, buka domain tersebut.

## Struktur

```text
.
├── package.json
├── railway.json
├── server.js
├── .env.example
├── .gitignore
└── public
    ├── index.html
    ├── app.js
    ├── dashboard.html
    ├── dashboard.js
    └── style.css
```

## Penyimpanan akun

Versi ini menyimpan akun di `data/users.json`. Ini cocok untuk testing/prototype. Untuk production serius, pindahkan penyimpanan user ke PostgreSQL Railway karena filesystem container dapat diganti saat deployment tertentu.


## Admin
Email admin bawaan: `telokaspeanget999@gmail.com`. Akun dengan email ini otomatis mendapat akses admin dan bypass pengecekan member group. Jika `ADMIN_EMAIL` di Railway diisi, nilainya dapat menggantikan email bawaan tersebut.
