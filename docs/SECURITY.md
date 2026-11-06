# Keamanan — Status Penanganan Risiko

Status peninjauan dan pengerasan kode per **November 2026**. Seluruh item tingkat **Kritis** dan **Tinggi** telah dimitigasi dan diperkuat.

| # | Tingkat | Temuan Awal | Lokasi | Status & Solusi yang Telah Diterapkan |
|---|---|---|---|---|
| 1 | **Kritis** | Aturan `users/{userId}` dan sub-koleksinya `allow read, write: if true` | `firestore.rules` | **Selesai (Mitigasi Penuh)**: Aturan diperketat ke pemilik `request.auth.uid == userId` dan Superadmin terverifikasi. Mencegah eskalasi peran mandiri dan memvalidasi skema profil. |
| 2 | **Kritis** | Koleksi root lama (`data_siswa`, `data_nilai`, dst.) terbuka | `firestore.rules` | **Selesai**: Koleksi root ditutup total (`deny all`) melalui aturan default deny. |
| 3 | **Tinggi** | Kredensial default `AUTH_USERNAME`/`AUTH_PASSWORD` (`123456`) tertulis di repo | `.env.example`, `render.yaml`, `server.ts` | **Selesai**: Nilai default dihapus dari repo; `render.yaml` diubah menjadi `sync: false`; `server.ts` menolak login jika env kosong. |
| 4 | **Tinggi** | Passkey superadmin default (`DEFAULT_SUPERADMIN_PASSKEY`) dan bypass di sisi klien | `src/lib/firebase.ts`, `LoginView.tsx`, `SuperadminView.tsx` | **Selesai**: Bypass passkey klien dihapus. Superadmin wajib login via Firebase Auth (Google / Email) dengan verifikasi allowlist & role. |
| 5 | **Sedang** | `Pengaturan` menyimpan plaintext `password` di Firestore | `src/components/PengaturanView.tsx`, `src/lib/firebase.ts` | **Selesai**: Field password dihapus dari UI Pengaturan dan dibersihkan otomatis dengan `deleteField()` saat simpan. |
| 6 | **Sedang** | Endpoint `/api/ai/*` tanpa token & rate limit | `server.ts`, `src/lib/firebase.ts` | **Selesai**: Client menyisipkan Firebase ID token via interceptor; `server.ts` menerapkan rate limiter in-memory (30 req/menit per client/IP). |
| 7 | **Sedang** | HTML hasil AI dirender langsung ke DOM tanpa sanitasi | Generator View (`Lkpd`, `ModulAjar`, `PerangkatAjar`, `PerangkatKBC`) | **Selesai**: Sanitasi menggunakan DOMPurify via utilitas `sanitizeHtml` sebelum `dangerouslySetInnerHTML`. |
| 8 | **Rendah** | Mode tamu menyimpan data di `localStorage` | `src/lib/firebase.ts` | **Selesai**: Mode tamu secara eksplisit tidak menyentuh Cloud Firestore, mencegah permission error & kebocoran data. |

## Arsitektur Aturan Firestore Saat Ini

Aturan di `firestore.rules` menggunakan model kepemilikan ketat:
- **Owner**: `request.auth.uid == userId` dapat membaca & menulis data profil dan 9 sub-koleksi privatnya.
- **Superadmin**: diverifikasi melalui allowlist email (`email_verified == true`) atau role `superadmin` pada profil.
- **Validasi Skema**: mencegah injeksi properti liar pada dokumen `users/{userId}` dan mencegah guru biasa mengubah perannya menjadi superadmin.
- **Default Deny**: `match /{document=**} { allow read, write: false; }` menolak seluruh path di luar skema.

## Pelaporan
Temukan potensi celah keamanan baru? Jangan buka issue publik; hubungi pemilik repositori secara langsung.

