# arvirmdn kontools v0.1

Web tools & utilities dengan tema dark modern. Backend: Node.js + Express + SQLite di Railway.

## Fitur

- **Autentikasi** — Login, daftar, lupa sandi (data tersimpan di Railway)
- **Profil** — Halaman profil pengguna (data dari server)
- **Link to APK** — Konverter URL ke APK (placeholder)
- **Status HD** — Monitoring status server (placeholder)
- **Sidebar Collapse** — Bisa sembunyikan/tampilkan menu sidebar
- **Responsive** — Support desktop & mobile

## Struktur File

```
.
├── index.html       # Frontend HTML
├── style.css        # Styling & animasi
├── script.js        # Frontend logic (panggil API backend)
├── server.js        # Backend Express + SQLite
├── package.json     # Dependensi Node.js
├── .gitignore       # Abaikan node_modules & data
└── README.md        # Dokumentasi ini
```

## Deploy ke Railway

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "deploy arvirmdn kontools"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### 2. Buat Project di Railway

1. Buka [railway.app](https://railway.app) di browser HP/PC
2. **New Project** → **Deploy from GitHub repo**
3. Pilih repo yang sudah di-push
4. Tunggu build selesai

### 3. Tambah VOLUME (WAJIB — biar data tidak hilang)

**Volume** = tempat menyimpan file database SQLite secara permanen.

1. Di dashboard Railway, klik project kamu
2. Pilih tab **Volumes**
3. Klik **New Volume**
4. Isi:
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB (cukup, bisa upgrade nanti)
5. Klik **Create**

> Tanpa Volume, database SQLite akan hilang setiap redeploy!

### 4. Tambah VARIABLES (WAJIB — keamanan)

**Variables** = environment variable untuk konfigurasi server.

1. Di dashboard Railway, klik project kamu
2. Pilih tab **Variables**
3. Tambah variable baru:

| Key | Value | Keterangan |
|-----|-------|-----------|
| `JWT_SECRET` | `arvirmdn-rahasia-2026-x7k9m2` | **WAJIB** — random string untuk enkripsi token. Ganti dengan string acak panjang! |
| `DB_PATH` | `/app/data/users.db` | **WAJIB** — lokasi file database di Volume |
| `NODE_ENV` | `production` | Opsional — mode production |

**Cara buat JWT_SECRET yang aman:**
Buka Chrome → cari "random string generator" → copy 32 karakter acak → paste ke value `JWT_SECRET`.

### 5. Redeploy

Setelah tambah Volume & Variables:
1. Klik tab **Deployments**
2. Klik **Redeploy** (atau push commit baru ke GitHub)
3. Tunggu build selesai
4. Klik link domain yang muncul

### 6. Setup Pertama Kali

Setelah web online:
1. Buka URL Railway kamu
2. Daftar akun baru → login
3. Data user tersimpan di server Railway (tidak hilang saat redeploy)

## Cara Kerja

- **Frontend** (`index.html`, `style.css`, `script.js`) → tampilan & interaksi
- **Backend** (`server.js`) → handle register, login, database
- **Database** (`/app/data/users.db`) → SQLite file di Railway Volume
- **Token** → disimpan di browser localStorage, diverifikasi oleh backend

## Troubleshooting

**"Failed to fetch" / tidak bisa konek**
- Pastikan Railway sudah selesai build (status "Healthy")
- Cek tab **Logs** di Railway, pastikan tidak ada error
- Pastikan `DB_PATH` variable sudah di-set ke `/app/data/users.db`

**"Token tidak valid"**
- Logout lalu login ulang
- Pastikan `JWT_SECRET` tidak berubah setelah user login

**Data hilang setelah redeploy**
- Pastikan **Volume** sudah dibuat dengan mount path `/app/data`
- Pastikan `DB_PATH` variable sudah benar

## Keamanan

- Password di-hash dengan bcrypt sebelum disimpan
- Token JWT expire dalam 7 hari
- Ganti `JWT_SECRET` dengan string acak yang panjang
- Jangan push folder `node_modules` atau file `.db` ke GitHub

---

Dibuat oleh arvirmdn | Backend: Node.js + SQLite di Railway
