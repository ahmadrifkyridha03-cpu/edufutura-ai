# AGENTS.md — Panduan untuk AI Agent & Kontributor

File ini dibaca pertama kali oleh AI coding agent (Antigravity, Gemini, Claude, Copilot, dsb.) sebelum mengubah kode EduFutura AI. Tujuannya agar setiap agent paham konteks, aturan, dan batasan proyek tanpa harus menebak.

> Dokumen lengkap ada di folder [`docs/`](docs/README.md). Mulai dari [PRD](docs/PRD.md) lalu [ARCHITECTURE](docs/ARCHITECTURE.md).

---

## 1. Ringkasan Proyek

- **Nama**: EduFutura AI, aplikasi administrasi dan asisten guru digital
- **Pengguna**: guru mata pelajaran (SMP/SMA, khususnya Sekolah Islam Athirah), satu akun per guru, data dipisah per akun
- **Stack**: React 19 + Vite 6 + Tailwind CSS 4 (frontend), Express 4 (backend AI proxy), Firebase Auth + Firestore (data), `@google/genai` (Gemini)
- **Target deploy**: Google AI Studio (Build), Vercel (`api/index.js`), Render (`dist/server.cjs`)
- **Bahasa UI & dokumen**: Bahasa Indonesia

## 2. Perintah Wajib

| Tujuan | Perintah |
|---|---|
| Install | `npm install` |
| Dev server (Express + Vite middleware) | `npm run dev` |
| Type check (lint) | `npm run lint` (`tsc --noEmit`) |
| Build produksi | `npm run build` |
| Jalankan hasil build | `npm run start` |

**Sebelum menyatakan pekerjaan selesai, `npm run lint` dan `npm run build` wajib lulus tanpa error.**

## 3. Peta Kode Cepat

| Lokasi | Isi |
|---|---|
| `src/App.tsx` | Shell aplikasi, auth listener, subscription Firestore, routing tab (`activeTab`) |
| `src/lib/firebase.ts` | Semua akses Firebase: `COLLECTIONS`, `subscribeCollection`, `saveDocument`, `batchSaveDocuments`, `batchDeleteDocuments`, auth, superadmin |
| `src/types.ts` | Semua tipe domain (`Siswa`, `Mapel`, `DataNilai`, `Pengaturan`, `ModulFormState`, …) |
| `src/components/*View.tsx` | Satu file per halaman/menu |
| `src/components/InputPenilaianView.tsx` | Input nilai, Nilai Tambah, Leger. Mengekspor `categorizeJenisPenilaian` dan `hitungNilaiAkhirSiswa` |
| `src/utils/athirahModulBuilder.ts` | Builder HTML deterministik untuk template Athirah 015 (Format 1 & 2), 017, dan LKPD per pertemuan |
| `src/utils/perangkatSyncHelper.ts` | Sinkronisasi data Perangkat Ajar → Modul Ajar → LKPD (localStorage) |
| `src/utils/kurikulumMerdekaBuilder.ts` | Fallback builder dokumen Kurikulum Merdeka |
| `server.ts` | Express app (`createApiApp`), endpoint `/api/ai/*`, fallback model Gemini |
| `serverKbcBuilder.ts` | Fallback builder Perangkat Ajar KBC & ISO 015 |
| `graphify-out/` | Knowledge graph proyek (`GRAPH_REPORT.md`, `graph.json`, `graph.html`) |

## 4. Aturan Emas (Jangan Dilanggar)

1. **Rantai data tunggal.** Kelas, siswa, dan mapel diambil dari Firestore (`siswaList`, `mapelList`). Jangan membuat input manual ganda bila datanya sudah ada. Nama mapel ada di properti `namaMapel`, **bukan** `nama`.
2. **Nilai Tambah bukan nilai ujian.** Semua rata-rata 0–100 wajib mengecualikan `categorizeJenisPenilaian(jenis) === "nilai_tambah"`. Selalu gunakan `hitungNilaiAkhirSiswa` untuk Nilai Akhir, jangan menulis ulang rumusnya.
3. **Rumus Nilai Akhir** (jangan diubah tanpa persetujuan pemilik produk):
   `Nilai Akhir = min(100, 0.50 × rata-rata Sumatif + 0.35 × UTS + 0.15 × UAS + Nilai Tambah)`
4. **Template Athirah harus presisi.** Struktur tabel, font (Kop: Arial 8pt, isi: Times New Roman 11pt), warna header `#9CC2E5`, nomor dokumen, dan kop ISO mengikuti file sumber `015 Formulir-Modul Ajar.docx` dan `017 Formulir-Lampiran Asesmen dalam MA.docx`. Lihat [docs/TEMPLATE_DOKUMEN.md](docs/TEMPLATE_DOKUMEN.md).
5. **Program Khas = "Public Speaking"** sebagai default di semua modul ajar dan LKPD.
6. **Template Athirah deterministik.** `sekolah_format1_iso` dan `sekolah_format2_iso` dibangun tanpa Gemini, sehingga harus tetap berfungsi walaupun `GEMINI_API_KEY` kosong.
7. **Isolasi data per guru.** Semua tulis/baca lewat helper di `src/lib/firebase.ts` agar path selalu `users/{uid}/{koleksi}`. Jangan memanggil `collection(firestore, "data_siswa")` langsung.
8. **Hapus saat reset.** Bila nilai dikosongkan atau di-reset, dokumen lama di Firestore harus dihapus (`batchDeleteDocuments`), bukan diabaikan.
9. **Jangan commit rahasia.** `GEMINI_API_KEY`, password, dan kredensial lain hanya lewat environment variable.
10. **Pertahankan komentar & dokumentasi** yang tidak berkaitan dengan perubahan.

## 5. Alur Kerja yang Disarankan untuk Agent

1. Baca `graphify-out/GRAPH_REPORT.md` untuk melihat god nodes dan komunitas modul.
2. Baca dokumen `docs/` yang relevan dengan tugas.
3. Lakukan perubahan sekecil mungkin yang menyelesaikan masalah.
4. Jalankan `npm run lint` dan `npm run build`.
5. Bila struktur kode berubah signifikan, perbarui graph (`/graphify`) dan dokumen terkait di `docs/`.
6. Catat perubahan penting di [docs/CHANGELOG.md](docs/CHANGELOG.md).

## 6. Desain UI

Ikuti [docs/DESIGN.md](docs/DESIGN.md). Ringkasnya: hindari "AI slop" (gradien ungu generik, emoji berlebihan, kartu identik berulang). Gunakan token font yang sudah ada (DM Sans, Space Grotesk, JetBrains Mono), animasi singkat dan bermakna, dan dukung mode gelap/terang.

## 7. Hal yang Diketahui Berisiko

Lihat [docs/SECURITY.md](docs/SECURITY.md) sebelum deploy produksi, terutama terkait `firestore.rules` yang masih terbuka dan kredensial default.

