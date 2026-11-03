# Roadmap Pengembangan

Prioritas: P0 = segera, P1 = berikutnya, P2 = nanti.

## Fase 1 — Pengerasan (P0)
- [ ] Perbaiki `firestore.rules` (isolasi per `uid`) — [SECURITY.md](SECURITY.md) #1–2
- [ ] Hapus kredensial default, pindahkan otorisasi superadmin ke custom claims — #3–5
- [ ] Autentikasi + rate limit untuk `/api/ai/*` — #6
- [ ] Sanitasi HTML hasil AI — #7
- [ ] Uji manual unduhan `.doc` template 015/017 di Microsoft Word dan catat selisih tampilan
- [ ] Salin `015`/`017` `.docx` ke `docs/templates/` sebagai acuan ter-versioning

## Fase 2 — Kualitas & Pemeliharaan (P1)
- [ ] Tambah test otomatis (Vitest): `categorizeJenisPenilaian`, `hitungNilaiAkhirSiswa`, builder Athirah (jumlah baris/kolom, font)
- [ ] Pecah file besar (`InputPenilaianView.tsx` ±140 KB, `GeneratorPerangkatAjarAIView.tsx` ±112 KB) menjadi sub-komponen & hook
- [ ] Pindahkan sinkronisasi perangkat ajar dari localStorage ke Firestore (`users/{uid}/perangkat_ajar`)
- [ ] Ekspor `.docx` asli (mis. library `docx`) agar tata letak Word 100% presisi
- [ ] CI GitHub Actions: `npm run lint` + `npm run build` pada setiap PR
- [ ] Ganti nama paket `react-example` di `package.json` menjadi `edufutura-ai`

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
- Daftar model Gemini di-hardcode di `server.ts`; sebaiknya dapat dikonfigurasi lewat env.
- Dokumen dihasilkan sebagai string HTML besar; pertimbangkan komponen template terstruktur.

