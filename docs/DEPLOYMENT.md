# Panduan Deploy & Operasional

## 1. Environment Variable

| Variabel | Wajib | Keterangan |
|---|---|---|
| `GEMINI_API_KEY` | Ya (untuk fitur AI) | Di AI Studio disuntikkan otomatis dari panel Secrets |
| `APP_URL` | Opsional | URL aplikasi (otomatis di AI Studio) |
| `AUTH_USERNAME`, `AUTH_PASSWORD` | Ya untuk login admin server | **Ganti nilai default** (lihat SECURITY.md) |
| `VITE_FIREBASE_*` | Opsional | Konfigurasi Firebase sendiri (remix/clone). Bila kosong, memakai `firebase-applet-config.json` |
| `VITE_PENGATURAN_FIREBASE_*` | Opsional | Database terpisah untuk menu Pengaturan |

Salin `.env.example` → `.env.local` untuk pengembangan lokal. Jangan commit `.env.local`.

## 2. Pengembangan Lokal

```powershell
npm install
npm run dev        # http://localhost:3000 (Express + Vite middleware)
npm run lint       # type check
npm run build      # bundle produksi
npm run start      # jalankan dist/server.cjs
```

## 3. Target Deploy

### Google AI Studio (Build) — utama
1. Hubungkan/unggah proyek ke AI Studio (`metadata.json` sudah menyatakan `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` dan izin kamera untuk QR).
2. Isi `GEMINI_API_KEY` di panel Secrets.
3. AI Studio menjalankan server di Cloud Run.

### Vercel
- `vercel.json`: build `npm run build`, output `dist`, fungsi `api/index.js` (60 detik, 1024 MB), rewrite `/api/*` → fungsi, lainnya → `index.html`.
- Isi env var di dashboard Vercel.

### Render
- `render.yaml`: service `edufutura-ai`, region Singapore, build `npm install && npm run build`, start `npm run start`.
- Isi `GEMINI_API_KEY` di dashboard Render. Ganti `AUTH_PASSWORD`.

### Firebase
- Deploy aturan: `firebase deploy --only firestore:rules` (gunakan skill `firebase-basics` bila CLI belum siap).
- Aktifkan provider Auth: Email/Password dan Google.

## 4. Alur Git

```powershell
git checkout -b feat/nama-fitur
# ... ubah kode ...
npm run lint; npm run build
git add .
git commit -m "feat: deskripsi singkat"
git push origin feat/nama-fitur
# buat Pull Request ke main
```

Konvensi commit: `feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `chore:`.

Remote: `https://github.com/ahmadrifkyridha03-cpu/edufutura-ai.git` (branch `main`).

> `aplikasiku.zip` dan folder hasil build (`dist/`) sebaiknya tidak di-commit; pastikan tercantum di `.gitignore`. Catatan: `api/index.js` saat ini ter-commit karena dibutuhkan Vercel.

## 5. Checklist Sebelum Rilis

- [ ] `npm run lint` dan `npm run build` lulus
- [ ] `GEMINI_API_KEY` terpasang di target deploy
- [ ] Kredensial default diganti
- [ ] `firestore.rules` versi aman sudah di-deploy (SECURITY.md)
- [ ] Uji login, tambah siswa, input nilai, buat modul Format 1 & 2, unduh Word
- [ ] CHANGELOG diperbarui

