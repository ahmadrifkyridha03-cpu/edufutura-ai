# Referensi API — `server.ts`

Semua endpoint didefinisikan di `createApiApp()` dan tersedia dengan dan tanpa prefix `/api` (kecuali yang ditandai). Body request berformat JSON.

| Method | Path | Fungsi | Butuh `GEMINI_API_KEY` |
|---|---|---|---|
| GET | `/api/health` | Cek status server | Tidak |
| POST | `/api/auth/login` | Login admin server-side (`username`, `password`) | Tidak |
| GET | `/api/auth/verify` | Verifikasi sesi/token login | Tidak |
| POST | `/api/ai/generate-modul` | Membuat Modul Ajar | Tidak untuk `sekolah_format1_iso` & `sekolah_format2_iso`; ya untuk format lain (ada fallback) |
| POST | `/api/ai/generate-lkpd` | Membuat LKPD per pertemuan (deterministik) | Tidak |
| POST | `/api/ai/chat-asisten` | Chat Asisten Guru AI | Ya |
| POST | `/api/ai/generate-ppt-all-slides` (hanya `/api`) | Konten seluruh slide presentasi | Ya |
| POST | `/api/ai/generate-ppt-text` | Teks satu slide | Ya |
| POST | `/api/ai/generate-ppt-image` | Gambar slide | Ya |
| POST | `/api/ai/generate-perangkat-ajar` | CP, TP, ATP, KKTP, RME, Prota, Prosem | Ya (ada fallback `buildKurikulumMerdekaDocument`) |
| POST | `/api/ai/generate-perangkat-ajar-kbc` | Perangkat ajar Kurikulum Berbasis Cinta | Ya (ada fallback `buildKbcFallbackDocument`) |
| GET | `*` | Menyajikan SPA (`index.html`) | — |

## Detail Penting

### `POST /api/ai/generate-modul`
Body: objek `ModulFormState` (lihat `src/types.ts`), field kunci:
- `formatOutput`: `sekolah_format1_iso` | `sekolah_format2_iso` | `standar_merdeka` | `deep_learning` | `ringkas_1lembar` | `kemenag_kbc`
- `mataPelajaran`, `kelas`, `fase`, `topik`, `jumlahPertemuan` (1–8), `model`, `programKhas` (default `Public Speaking`)
- `sertakanKop`, `sertakanTtd`, `sertakanLkpd`, `sertakanLampiran017`

Respons: `{ html: string, ... }` berisi dokumen HTML siap pratinjau/cetak.

### `POST /api/ai/generate-lkpd`
Body: data modul + `selectedMeeting` atau `pertemuanTarget` (nomor pertemuan; kosong = semua pertemuan).

## Penanganan Error
- Error autentikasi Gemini (401/API key invalid) tidak di-retry dan dikembalikan sebagai error.
- Error lain dicoba ulang dengan model berikutnya (`generateContentWithRetry`), lalu fallback builder deterministik.

## Menambah Endpoint Baru
1. Tambahkan di `createApiApp()` dengan pola `app.post(["/api/x", "/x"], handler)`.
2. Panggil `getAiClient()` **di dalam** cabang yang butuh AI saja.
3. Selalu sediakan fallback bila memungkinkan.
4. Dokumentasikan di file ini.

