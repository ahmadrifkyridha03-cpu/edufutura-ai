# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/).

## [Unreleased]

### Keamanan (Security Hardening)
- **Pengerasan Firestore Rules**: Mengisolasi data tiap guru ke `users/{userId}` dengan verifikasi kepemilikan ketat, allowlist superadmin ber-email terverifikasi, validasi skema profil, dan menutup seluruh koleksi root publik lama.
- **Penghapusan Kredensial Default**: Menghapus password default `123456` dan username default dari `.env.example`, `render.yaml`, dan `server.ts`.
- **Penghapusan Passkey Client-Side Superadmin**: Menghapus bypass passkey di browser; Superadmin kini wajib login melalui Firebase Auth (Google / Email) dengan verifikasi otoritas di Firestore rules.
- **Pembersihan Password Plaintext Pengaturan**: Menghapus field password dari UI Pengaturan dan membersihkannya otomatis via `deleteField()` saat sinkronisasi profil.
- **Rate Limiting & Token Interceptor API AI**: Menambahkan interceptor client yang menyematkan Firebase ID token pada pemanggilan `/api/*` serta rate limiter in-memory pada `server.ts` (30 req/menit per pemanggil).
- **Sanitasi HTML Output AI**: Mencegah kerentanan XSS dengan sanitasi DOMPurify pada seluruh penampil dokumen AI (`ModulAjar`, `Lkpd`, `PerangkatAjar`, `PerangkatKBC`).

### Peningkatan & Pemeliharaan
- Menambahkan **GitHub Actions CI Workflow** (`.github/workflows/ci.yml`) untuk verifikasi otomatis tipe data (`npm run lint`) dan build produksi (`npm run build`).
- Mengubah nama paket di `package.json` dari `react-example` menjadi `edufutura-ai` v1.0.0.
- Menambahkan dukungan konfigurasi urutan model Gemini via environment variable `GEMINI_MODEL_CANDIDATES`.
- Mode Tamu secara eksplisit diisolasi ke localStorage tanpa memicu error permission pada Cloud Firestore.

## [2026-11-04]

### Ditambahkan
- Template Modul Ajar Athirah **Format 2** (`sekolah_format2_iso`, tabel 4 kolom × 5 baris) dengan baris Deskripsi Integrasi Program Khas **Public Speaking**.
- Kolom **Nilai Tambah (+)** di cetak Leger (PDF/`.xls`), ekspor `.xlsx`, dan Rincian Nilai Siswa.
- Pengisian otomatis kelas & mapel dari Firestore di Modul Ajar, LKPD, dan Generator Perangkat Ajar.
- Tautan "Buat LKPD" dari Modul Ajar (`onNavigateToLkpd`).

### Diperbaiki
- Nama mapel dibaca dari `namaMapel` (sebelumnya `nama`, menyebabkan chip mapel kosong).
- Nilai Tambah tergandakan saat menyimpan Master Input setelah input di tab Nilai Tambah.
- Reset/kosongkan Nilai Tambah kini menghapus dokumen lama di Firestore.
- Nilai Tambah tidak lagi dihitung sebagai nilai ujian 0–100 di Dashboard, Pusat Laporan, Analisis Perkembangan, dan Ranking.
- Format 1: angka aktivitas 1/2/3 di baris 11–13 kini tersusun vertikal sesuai docx 015.
- Tabel Lampiran 017 memakai 11pt (sebelumnya 10pt).
- `/api/ai/generate-modul` tidak lagi gagal untuk template Athirah saat `GEMINI_API_KEY` kosong.

