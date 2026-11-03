# Sistem Desain — EduFutura AI

Disusun dengan prinsip dari skill `ui-ux-pro-max`, `emil-design-eng`, dan `impeccable`: antarmuka yang tenang, jelas, dan terasa dibuat dengan sengaja, bukan "AI slop".

## 1. Prinsip

1. **Guru sibuk, bukan pengunjung pameran.** Tugas utama (input nilai, buat modul) harus tercapai dalam ≤ 3 klik.
2. **Data dulu, dekorasi belakangan.** Tabel nilai dan pratinjau dokumen adalah pusat perhatian.
3. **Konsisten.** Satu pola untuk tombol, kartu, notifikasi (`lib/swal.ts`), dan loading (`ViewLoadingSkeleton`, `AiProgressStepper`).
4. **Dokumen cetak terpisah dari tema UI.** Area pratinjau dokumen selalu putih dengan font resmi (Times New Roman/Arial), tidak terpengaruh mode gelap.

## 2. Hindari AI Slop

| Jangan | Lakukan |
|---|---|
| Gradien ungu-biru di mana-mana | Satu warna aksen, gradien hanya untuk hero/aksen kecil |
| Emoji sebagai ikon utama | Ikon `lucide-react` dengan ukuran & stroke seragam |
| Grid kartu identik berulang tanpa hierarki | Hierarki jelas: aksi utama besar, sekunder kecil |
| Teks pemasaran ("Revolusioner!", "Supercharge") | Label lugas: "Simpan Nilai", "Buat Modul Ajar" |
| Glow/blur berlebihan, efek 3D di setiap kartu | Efek 3D (`components/3d/*`) hanya di dashboard/hero |
| Animasi panjang di setiap interaksi | Animasi singkat, hanya bila memberi makna |

## 3. Token

### Tipografi
| Token | Font | Penggunaan |
|---|---|---|
| `--font-sans` | DM Sans | Teks isi, form, tabel |
| `--font-display` | Space Grotesk (`letter-spacing: -0.025em`) | Judul `h1`–`h6` |
| `--font-mono` | JetBrains Mono | Angka nilai, kode, telemetri |
| Dokumen | Times New Roman 11pt / Arial 8pt (kop) | Pratinjau & ekspor dokumen |

Gunakan `font-variant-numeric: tabular-nums` untuk kolom nilai.

### Warna (Tailwind)
| Peran | Terang | Gelap |
|---|---|---|
| Latar | `#f8fafc` (slate-50) | `#030712` (gray-950) |
| Teks | `#0f172a` (slate-900) | `#f1f5f9` (slate-100) |
| Aksen | indigo/violet (scrollbar, fokus) | indigo `rgba(99,102,241,…)` |
| Sukses / Peringatan / Bahaya | emerald / amber / rose | sama, opasitas disesuaikan |
| Header tabel dokumen | `#9CC2E5` | `#9CC2E5` (dokumen tidak ikut tema) |

Kontras teks minimal 4.5:1 (WCAG AA).

### Spasi & Bentuk
- Skala spasi Tailwind (4px). Padding kartu `p-4`/`p-6`.
- Radius: kartu `rounded-2xl`, tombol/input `rounded-xl`, chip `rounded-full`.
- Target sentuh minimal 44×44px (mobile).

## 4. Motion

| Interaksi | Durasi | Easing |
|---|---|---|
| Hover/press tombol | 120–160ms | `ease-out` |
| Buka sheet/modal | 200–260ms | `cubic-bezier(0.32, 0.72, 0, 1)` |
| Tutup | lebih cepat dari buka (≈ 150–200ms) | `ease-in` |
| Toast | masuk 200ms, keluar 150ms | — |

- Animasikan `transform` & `opacity` saja.
- Hormati `prefers-reduced-motion`: matikan animasi dekoratif (orb hologram, mesh pemindai).
- Tombol tekan: `scale(0.97)` saat `:active`.

## 5. Pola Komponen

- **Navigasi**: Sidebar (desktop), bottom bar + sheet kategori Akademik / AI Tools / Laporan (mobile).
- **Form generator** (Modul/LKPD/Perangkat): wizard 3 langkah (Identitas → Konten → Pratinjau), chip 1-klik untuk kelas & mapel dari data guru.
- **Tabel nilai**: header sticky, input angka lebar tetap, warna sel berdasarkan predikat, badge `+X kat.` untuk Nilai Tambah kategori.
- **Status AI**: `AiProgressStepper` menampilkan tahap; selalu ada pesan error yang jelas dan tombol coba lagi.
- **Konfirmasi hapus**: `confirmDeleteAlert` sebelum menghapus data.

## 6. Responsif

| Breakpoint | Perilaku |
|---|---|
| < 768px | Bottom navigation, tabel di-scroll horizontal, form satu kolom |
| 768–1024px | Sidebar dapat dilipat |
| ≥ 1024px | Sidebar tetap, form dua kolom, pratinjau dokumen berdampingan |

## 7. Checklist Review UI

- [ ] Tidak ada gradien/emoji/teks pemasaran berlebihan
- [ ] Mode gelap & terang terbaca baik
- [ ] Fokus keyboard terlihat
- [ ] Animasi ≤ 300ms dan menghormati reduced motion
- [ ] Empty state, loading, dan error tersedia di setiap halaman
- [ ] Uji dengan data ekstrem (nama panjang, 40+ siswa, kelas kosong) — gunakan skill `break-ui`

