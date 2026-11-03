# PRD — EduFutura AI: Aplikasi Manajemen Kelas untuk Guru

| Atribut | Nilai |
|---|---|
| Versi dokumen | 1.0 |
| Tanggal | 2026-11-04 |
| Pemilik produk | Ahmad Rifky Ridha |
| Status | Aktif (MVP sudah berjalan) |

---

## 1. Latar Belakang

Guru menghabiskan banyak waktu untuk administrasi: mencatat siswa per kelas, merekap nilai, menghitung nilai akhir, dan menyusun perangkat ajar Kurikulum Merdeka (CP, TP, ATP, KKTP, Analisis Minggu Efektif, Prota, Prosem, Modul Ajar, LKPD). Data yang sama sering diketik berulang di dokumen berbeda dan format sekolah harus diikuti persis.

EduFutura AI menyatukan semua itu dalam satu aplikasi web dengan **satu rantai data**: kelas & siswa → nilai → perangkat ajar → modul ajar & LKPD.

## 2. Tujuan

1. Mengurangi waktu administrasi guru dengan otomatisasi dokumen.
2. Menghilangkan pengetikan ganda: data kelas, siswa, dan mapel dipakai ulang di semua modul.
3. Menghasilkan dokumen yang **identik dengan format resmi sekolah** (Formulir Athirah 015 & 017) dan siap cetak/unduh.
4. Memberi gambaran perkembangan nilai siswa secara cepat.

### Non-Tujuan (saat ini)

- Bukan sistem informasi sekolah lengkap (tidak ada akun siswa/orang tua, keuangan, PPDB).
- Tidak berbagi data antar guru (setiap guru memiliki ruang data sendiri).

## 3. Persona Pengguna

| Persona | Kebutuhan utama |
|---|---|
| **Guru mata pelajaran** (pengguna utama) | Mengelola kelas yang diampu, input nilai cepat, membuat perangkat ajar dan modul ajar sesuai format sekolah |
| **Guru wali kelas** | Tambahan: catatan bimbingan wali, rekap rapor |
| **Superadmin** | Melihat daftar guru terdaftar, mengubah peran, memeriksa ruang data guru |

## 4. Asumsi & Batasan

- Target deploy: Google AI Studio (mode Build). Alternatif: Vercel atau Render.
- Stack: React (UI), Firebase Auth + Firestore (login & data), Gemini API (pembuatan dokumen).
- Satu akun per guru, data dipisah per akun (`users/{uid}/...`).
- Program Khas sekolah default: **Public Speaking**.
- Template sekolah wajib mengikuti `015 Formulir-Modul Ajar.docx` dan `017 Formulir-Lampiran Asesmen dalam MA.docx` (tabel, font, kop).

## 5. Fitur Utama (Lima Modul Inti)

### F1. Daftar Kelas & Siswa yang Diampu
- CRUD siswa (NISN, nama, kelas), impor massal (Excel/tempel), filter per kelas.
- CRUD mata pelajaran (nama, semester, tahun ajaran).
- Jadwal mengajar, kartu QR siswa, presensi (manual & pindai QR).

**Kriteria penerimaan**
- Daftar kelas otomatis diturunkan dari data siswa (tanpa input kelas terpisah).
- Data langsung tersinkron real-time ke semua menu lain.

### F2. Input Nilai
- Format Master Input: semua Sumatif, UTS, UAS dalam satu tabel.
- Input satuan per jenis penilaian, tempel dari Excel, isi massal.
- Rekap Leger (cetak PDF, ekspor `.xls`/`.xlsx`), riwayat & edit nilai, backup.
- Nilai Akhir dihitung otomatis:
  `Nilai Akhir = min(100, 0.50 × rata-rata Sumatif + 0.35 × UTS + 0.15 × UAS + Nilai Tambah)`
- Predikat: A ≥ 88, B ≥ 78, C ≥ 70, D < 70.

**Kriteria penerimaan**
- Mengosongkan nilai lalu menyimpan akan menghapus nilai lama di database.
- Nilai Akhir di semua tampilan (dashboard, leger, rapor, rincian siswa) sama.

### F3. Nilai Tambah
- Kategori: Public Speaking, Keaktifan, Tugas Tambahan (bisa ditambah).
- Poin bonus ditambahkan ke Nilai Murni, Nilai Akhir dibatasi maksimal 100.

**Kriteria penerimaan**
- Nilai Tambah **tidak pernah** ikut dihitung sebagai nilai ujian 0–100.
- Tidak ada penggandaan poin saat menyimpan dari Master Input.
- Kolom "Nilai Tambah (+)" tampil di leger dan rincian nilai siswa.

### F4. Generator Perangkat Ajar Otomatis
Dokumen yang dihasilkan: **CP, TP, ATP, KKTP, Analisis Minggu Efektif (RME), Prota, Prosem**, plus varian Kurikulum Berbasis Cinta (KBC).

**Kriteria penerimaan**
- Mapel/kelas terisi otomatis dari data guru.
- Hasil dapat dicetak dan diunduh (Word/PDF).
- Hasil (daftar bab/TP) disinkronkan ke Modul Ajar dan LKPD.
- Ada fallback deterministik bila Gemini tidak tersedia.

### F5. Pembuat Modul Ajar Lengkap + LKPD per Pertemuan
- Template sekolah: **Athirah 015 Format 1** (tabel vertikal 14 baris × 7 kolom) dan **Format 2** (tabel 4 kolom).
- Lampiran **017** (asesmen, rubrik Public Speaking, remedial/pengayaan).
- **LKPD terpisah untuk setiap pertemuan** (1 s.d. N, maks 8).
- Template bawaan nasional: Standar Merdeka, Deep Learning, Ringkas 1 Lembar, Kemenag KBC.

**Kriteria penerimaan**
- Kop, tabel, font, warna, nomor dokumen identik dengan file 015/017 (lihat [TEMPLATE_DOKUMEN.md](TEMPLATE_DOKUMEN.md)).
- Program Khas berisi "Public Speaking".
- Template Athirah tetap berfungsi tanpa `GEMINI_API_KEY`.

## 6. Fitur Pendukung

Dashboard & analisis perkembangan siswa, ranking siswa, cetak rapor Kurikulum Merdeka, agenda/jurnal mengajar, bimbingan guru wali, Asisten Guru AI (chat), Generator AI lainnya (soal, rubrik, PPT), Pusat Laporan, Pengaturan profil & kop, reset database, panel superadmin, mode gelap/terang, panduan selamat datang.

## 7. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Performa | Code-splitting per halaman (`React.lazy`); halaman utama interaktif < 3 detik di 4G |
| Ketersediaan AI | Fallback berlapis model Gemini + builder deterministik |
| Responsif | Desktop, tablet, dan Android (bottom navigation & sheet kategori) |
| Aksesibilitas | Kontras cukup, target sentuh ≥ 44px, navigasi keyboard |
| Keamanan | Data terisolasi per guru, rahasia via env var (lihat [SECURITY.md](SECURITY.md)) |
| Kualitas kode | `tsc --noEmit` dan `npm run build` lulus tanpa error |

## 8. Metrik Keberhasilan

- Waktu menyusun satu modul ajar lengkap + LKPD < 5 menit.
- 0 selisih Nilai Akhir antar tampilan.
- Dokumen template sekolah diterima kurikulum tanpa revisi format.

## 9. Pertanyaan Terbuka

- Apakah bobot 50/35/15 berlaku untuk semua mapel atau perlu dapat diatur per guru?
- Apakah batas maksimal Nilai Tambah per siswa perlu ditentukan (saat ini input dibatasi per entri, total dibatasi oleh Nilai Akhir ≤ 100)?
- Apakah dokumen perlu diekspor sebagai `.docx` asli (bukan HTML-Word)?

