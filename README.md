# ARVIR Premium Web

Website baru dari nol dengan:
- Halaman Masuk / Daftar premium
- Auth sungguhan memakai Express + bcrypt
- Session login
- Dashboard setelah login
- Sidebar desktop
- Sidebar mobile yang bisa dibuka dan ditutup
- Tombol menggunakan `addEventListener`, bukan inline `onclick`
- Struktur siap dikembangkan

## Jalankan di Android/Termux

```bash
npm install
cp .env.example .env
npm start
```

Buka:
`http://localhost:3000`

## Deploy Railway

1. Upload project ini ke GitHub.
2. Di Railway pilih **New Project → Deploy from GitHub Repo**.
3. Railway akan menjalankan `npm start`.
4. Tambahkan environment variable:
   - `SESSION_SECRET` = string acak panjang
   - `NODE_ENV` = `production`
5. Generate domain Railway.

## Catatan database

Versi awal ini menyimpan user di `data/users.json`. Cocok untuk tahap desain dan pengujian. Untuk production serius, tahap berikutnya sebaiknya dipindahkan ke PostgreSQL Railway agar akun tidak hilang saat filesystem/container diganti.
