# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/).

## [Unreleased]

### Ditambahkan
- Dokumentasi pengembangan lengkap di `docs/` dan `AGENTS.md`.

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

