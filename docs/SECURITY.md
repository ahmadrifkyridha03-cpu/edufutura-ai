# Keamanan — Risiko yang Diketahui & Rencana Perbaikan

Hasil peninjauan kode per 2026-11-04. Tangani item **Kritis** sebelum aplikasi dipakai banyak guru dengan data siswa asli.

| # | Tingkat | Temuan | Lokasi | Rekomendasi |
|---|---|---|---|---|
| 1 | **Kritis** | Aturan `users/{userId}` dan sub-koleksinya `allow read, write: if true` — siapa pun dapat membaca/mengubah data semua guru | `firestore.rules` | Batasi ke pemilik: `request.auth != null && request.auth.uid == userId`; superadmin via custom claim. Gunakan subagent `firestore-rules-author` untuk menyusun ulang |
| 2 | **Kritis** | Koleksi root lama (`data_siswa`, `data_nilai`, dst.) `allow read: if true` | `firestore.rules` | Tutup bila tidak lagi dipakai (data sudah pindah ke `users/{uid}`) |
| 3 | Tinggi | Kredensial default `AUTH_USERNAME`/`AUTH_PASSWORD` (`123456`) tertulis di repo | `.env.example`, `render.yaml`, fallback di `server.ts` | Hapus nilai default dari kode & `render.yaml`, gunakan `sync: false`, tolak login bila env kosong |
| 4 | Tinggi | Passkey superadmin default (`DEFAULT_SUPERADMIN_PASSKEY`) dan pengecekan peran di sisi klien | `src/lib/firebase.ts` | Pindahkan otorisasi superadmin ke Firebase custom claims / Admin SDK di server |
| 5 | Sedang | `Pengaturan` memiliki field `password` yang tersimpan di Firestore dan dibaca server via REST API publik | `types.ts`, `server.ts` `/api/auth/login` | Jangan simpan password plaintext; gunakan Firebase Auth |
| 6 | Sedang | Endpoint `/api/ai/*` tanpa autentikasi & rate limit — kuota Gemini bisa disalahgunakan | `server.ts` | Verifikasi Firebase ID token di header, tambah rate limit per `uid` |
| 7 | Sedang | HTML hasil AI dirender langsung ke DOM | View generator | Sanitasi dengan DOMPurify (`purify.es` sudah ada di bundle) sebelum `dangerouslySetInnerHTML` |
| 8 | Rendah | Mode tamu menyimpan data di `localStorage` | `firebase.ts` | Beri peringatan bahwa data tamu tidak tersinkron & bisa hilang |

## Contoh Aturan Firestore yang Disarankan (draf)

```
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  match /{sub}/{docId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
match /users/{userId}/{document=**} {
  allow read: if request.auth.token.superadmin == true;
}
match /{document=**} { allow read, write: if false; }
```

> Draf ini harus diuji dengan Firebase Emulator dan diselaraskan dengan alur superadmin/tamu sebelum di-deploy.

## Pelaporan
Temukan celah keamanan? Jangan buka issue publik; hubungi pemilik repositori secara langsung.

