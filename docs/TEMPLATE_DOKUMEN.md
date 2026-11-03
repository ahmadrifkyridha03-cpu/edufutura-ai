# Spesifikasi Template Dokumen

Dokumen sumber resmi (jangan diubah, jadikan acuan):
- `d:\ATHIRAH\015 Formulir-Modul Ajar.docx`
- `d:\ATHIRAH\017 Formulir-Lampiran Asesmen dalam MA.docx`

Implementasi: [`src/utils/athirahModulBuilder.ts`](../src/utils/athirahModulBuilder.ts), CSS cetak di [`src/index.css`](../src/index.css).

> Saran: salin kedua file `.docx` ke `docs/templates/` agar acuan ikut ter-versioning di Git.

## 1. Kop ISO (`buildAthirahIsoKopTable`)

| Atribut | Nilai |
|---|---|
| Struktur | Tabel 5 kolom × 5 baris |
| Lebar kolom | 14.5% · 39.1% · 15.5% · 16.4% · 14.5% |
| Font | Arial 8pt, hitam |
| Border | 1px solid `#000000` |
| Baris 1 | `FORMULIR` (colspan 4) |
| Baris 2 | Judul formulir: `MODUL AJAR` / `LAMPIRAN ASESMEN DALAM RPP/MA` / `LEMBAR KERJA PESERTA DIDIK (LKPD)` |
| Baris 3–5 | `NO. DOKUMEN` (rowspan 3) · nomor · `Revisi`/`Tanggal Terbit`/`Halaman` |
| Kolom kanan | Logo Sekolah Islam Athirah (rowspan 5, base64 di `athirahLogo.ts`) |
| Default | Revisi `00`, Tanggal Terbit `17/09/2025` |
| No. dokumen | Modul Ajar `015/F/KUR/00/IX/2025`, Lampiran `017/F/KUR/00/IX/2025`, LKPD `015-LKPD-{p}/F/KUR/00/IX/2025` |

## 2. Modul Ajar 015 — Format 1 (`sekolah_format1_iso`)

- Builder: `buildExactAthirahModulHtml`
- Tabel utama **14 baris × 7 kolom**, isi Times New Roman 11pt, header `#9CC2E5`.
- Baris 11–13: kode aktivitas `MH` (Memahami), `MA` (Mengaplikasi), `MR` (Merefleksi); kolom 7 berisi angka `1`, `2`, `3` **tersusun vertikal**, angka aktif ditebalkan.
- Memuat identitas, identifikasi, Program Khas **Public Speaking**, kepemimpinan, spiritualisasi (ayat otomatis per mapel lewat `getDefaultSpiritualisasi`), dimensi Deep Learning (Berkesadaran/Bermakna/Menggembirakan).
- Diikuti tanda tangan, Lampiran 017, dan LKPD per pertemuan (sesuai opsi).

## 3. Modul Ajar 015 — Format 2 (`sekolah_format2_iso`)

- Builder: `buildExactAthirahFormat2Html`
- Judul: "Format Modul Ajar 2 / Sekolah Islam Athirah / Identitas".
- Tabel identitas 4 kolom, lalu tabel utama **4 kolom × 5 baris** (1 header + 4 isi):

| Tujuan Pembelajaran (rowspan 4) | Asesmen (rowspan 4) | Aktivitas, Praktik Pedagogi | Media, Sarana, Digital, Lingkungan, Kemitraan |
|---|---|---|---|
| | | Memahami | (rowspan 3) |
| | | Mengaplikasi | |
| | | Merefleksi | |
| | | Deskripsi Integrasi Program Khas (Public Speaking) | Spiritualisasi |

## 4. Lampiran Asesmen 017

- Font tabel `.table-asesmen-017`: **Times New Roman 11pt** (sesuai `w:sz=22` di docx).
- Seksi: Asesmen Formatif Awal, Jurnal Observasi Sikap, Kisi-kisi & Soal (PG + Uraian HOTS), Kunci & Pedoman Penskoran, **Rubrik Unjuk Kerja Public Speaking**, Daftar Nilai, Remedial & Pengayaan.

## 5. LKPD per Pertemuan (`buildPerMeetingLkpdHtml`)

- Satu halaman per pertemuan (pemisah `page-break-before: always`), maks 8 pertemuan.
- Kop ISO LKPD, tabel identitas (sekolah, nama siswa/kelompok, mapel, kelas/fase/semester, materi, pertemuan, sub-fokus, Program Khas).
- Komponen: A. Tujuan & Petunjuk, B. Aktivitas 1 (Memahami), C. Aktivitas 2 (Mengaplikasi), D. Aktivitas 3 (Public Speaking), refleksi.
- Sub-fokus pertemuan berurutan (konsep → investigasi → elaborasi & public speaking → evaluasi → …).

## 6. Template Bawaan Nasional
`standar_merdeka`, `deep_learning`, `ringkas_1lembar`, `kemenag_kbc` — header sekolah generik dengan garis ganda, tetap memuat Program Khas dan LKPD per pertemuan.

## 7. Perangkat Ajar (Generator)
CP · TP · ATP · KKTP · Analisis Minggu Efektif (RME, data default `DEFAULT_RME_GANJIL`/`DEFAULT_RME_GENAP`, agenda `DEFAULT_AGENDA_SEKOLAH`) · Prota · Prosem. Varian KBC di `PerangkatAjarKBCView`.

## 8. Checklist Verifikasi Template

- [ ] Kop: 5×5, Arial 8pt, logo kanan, nomor dokumen benar
- [ ] Format 1: 14 baris × 7 kolom, angka 1/2/3 vertikal di baris 11–13
- [ ] Format 2: 4 kolom × 5 baris, ada baris Program Khas Public Speaking
- [ ] 017: tabel 11pt Times New Roman
- [ ] LKPD: jumlah halaman = jumlah pertemuan
- [ ] Program Khas = Public Speaking
- [ ] Berfungsi tanpa `GEMINI_API_KEY`
- [ ] Hasil unduhan `.doc` dibuka di Microsoft Word dan dicek manual (belum diverifikasi otomatis)

