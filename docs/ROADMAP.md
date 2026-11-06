# Roadmap Pengembangan

Prioritas: P0 = segera, P1 = berikutnya, P2 = nanti.

## Fase 1 — Pengerasan (P0)
- [x] Perbaiki `firestore.rules` (isolasi per `uid` & allowlist superadmin) — [SECURITY.md](SECURITY.md) #1–2
- [x] Hapus kredensial default, hapus passkey klien, wajibkan Firebase Auth untuk Superadmin — #3–5
- [x] Autentikasi token + in-memory rate limit untuk `/api/ai/*` — #6
- [x] Sanitasi HTML hasil AI dengan DOMPurify di semua viewer dokumen — #7
- [ ] Uji manual unduhan `.doc` template 015/017 di Microsoft Word dan catat selisih tampilan
- [ ] Salin `015`/`017` `.docx` ke `docs/templates/` sebagai acuan ter-versioning

## Fase 2 — Kualitas & Pemeliharaan (P1)
- [x] CI GitHub Actions: `npm run lint` + `npm run build` pada setiap push & PR (`.github/workflows/ci.yml`)
- [x] Ganti nama paket `react-example` di `package.json` menjadi `edufutura-ai`
- [ ] Tambah test otomatis (Vitest): `categorizeJenisPenilaian`, `hitungNilaiAkhirSiswa`, builder Athirah (jumlah baris/kolom, font)
- [ ] Pecah file besar (`InputPenilaianView.tsx` ±140 KB, `GeneratorPerangkatAjarAIView.tsx` ±112 KB) menjadi sub-komponen & hook
- [ ] Pindahkan sinkronisasi perangkat ajar dari localStorage ke Firestore (`users/{uid}/perangkat_ajar`)
- [ ] Ekspor `.docx` asli (mis. library `docx`) agar tata letak Word 100% presisi

## Fase 3 — Fitur (P2)
- [ ] Bobot nilai (50/35/15) dapat diatur per guru/mapel
- [ ] Riwayat versi modul ajar tersimpan di cloud
- [ ] Bank soal & asesmen yang terhubung ke KKTP
- [ ] Deskripsi capaian rapor otomatis dari nilai & TP
- [ ] Mode offline (PWA) untuk input nilai/presensi
- [ ] Berbagi template antar guru dalam satu sekolah (opsional, dengan izin)

## Utang Teknis yang Diketahui
- Routing berbasis state, tanpa URL/deep link.
- Beberapa komponen masih memakai `any` (mis. `(m as any).nama` sebagai kompatibilitas data lama).
- Model Gemini kini mendukung fallback via env `GEMINI_MODEL_CANDIDATES`.
- Dokumen dihasilkan sebagai string HTML besar; pertimbangkan komponen template terstruktur.

