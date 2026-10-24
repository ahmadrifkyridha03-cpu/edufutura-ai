/**
 * Perangkat Ajar Sync Helper
 * Menghubungkan Generator Perangkat Ajar AI dengan AI Modul Ajar Generator
 * Menyimpan dan mengekstrak data Bab, Capaian Pembelajaran, dan Tujuan Pembelajaran (TP).
 */

export interface PerangkatBabItem {
  id: string;
  nomor: number;
  judulBab: string;
  elemenName?: string;
  ringkasanMateri: string;
  tujuanPembelajaran: string;
  alokasiWaktu: string;
  jumlahPertemuan: string;
  semester: "1" | "2" | "Ganjil" | "Genap";
}

export interface PerangkatAjarSyncData {
  mataPelajaran: string;
  singkatanMapel?: string;
  fase: string;
  kelas: string;
  jenjang: string;
  tahunAjaran: string;
  namaSekolah: string;
  namaGuru: string;
  nipGuru: string;
  namaKepsek: string;
  nipKepsek: string;
  tempatTtd: string;
  tanggalTtd: string;
  cpRasional?: string;
  daftarBab: PerangkatBabItem[];
  terakhirDisinkronkan: string;
}

const STORAGE_KEY = "edufutura_perangkat_ajar_sync";

/**
 * Mendapatkan daftar bab default cerdas sesuai mata pelajaran jika belum ada data generasi
 */
export function getDefaultBabList(subject: string = "Matematika", level: string = "Fase D / Kelas VIII"): PerangkatBabItem[] {
  const s = (subject || "").toLowerCase();

  if (s.includes("matematika") || s.includes("mtk")) {
    return [
      {
        id: "bab-1",
        nomor: 1,
        judulBab: "Bab 1: Bilangan Bulat, Rasional, dan Operasi Hitung",
        elemenName: "Bilangan",
        ringkasanMateri: "Membaca, menulis, membandingkan bilangan bulat & rasional, serta operasi aritmetika kontekstual.",
        tujuanPembelajaran: "1. Peserta didik mampu membaca, menulis, dan membandingkan bilangan bulat serta rasional secara mandiri.\n2. Peserta didik mampu menyelesaikan masalah kontekstual menggunakan operasi hitung campuran bilangan bulat dan rasional dengan nalar kritis.",
        alokasiWaktu: "4 x 45 JP",
        jumlahPertemuan: "2",
        semester: "1"
      },
      {
        id: "bab-2",
        nomor: 2,
        judulBab: "Bab 2: Aljabar dan Sistem Persamaan Linier",
        elemenName: "Aljabar",
        ringkasanMateri: "Penyederhanaan bentuk aljabar, persamaan linier satu & dua variabel, serta pemodelan matematika.",
        tujuanPembelajaran: "1. Peserta didik mampu menyatakan situasi konkret ke dalam bentuk aljabar dan menggunakan sifat-sifat operasi untuk menghasilkan bentuk ekuivalen.\n2. Peserta didik mampu memodelkan dan menyelesaikan sistem persamaan linier dalam kehidupan sehari-hari.",
        alokasiWaktu: "6 x 45 JP",
        jumlahPertemuan: "3",
        semester: "1"
      },
      {
        id: "bab-3",
        nomor: 3,
        judulBab: "Bab 3: Teorema Pythagoras dan Transformasi Geometri",
        elemenName: "Geometri",
        ringkasanMateri: "Konsep segitiga siku-siku, pembuktian Pythagoras, refleksi, translasi, rotasi, dan dilatasi.",
        tujuanPembelajaran: "1. Peserta didik mampu membuktikan dan menerapkan teorema Pythagoras untuk menyelesaikan masalah jarak dan bangun datar.\n2. Peserta didik mampu melakukan transformasi geometri (refleksi, translasi, rotasi) pada bidang koordinat Kartesius.",
        alokasiWaktu: "6 x 45 JP",
        jumlahPertemuan: "3",
        semester: "2"
      },
      {
        id: "bab-4",
        nomor: 4,
        judulBab: "Bab 4: Analisis Data, Peluang, dan Statistika Dasar",
        elemenName: "Analisis Data & Peluang",
        ringkasanMateri: "Pengumpulan data, penyajian diagram, mean/median/modus, serta estimasi peluang empiris.",
        tujuanPembelajaran: "1. Peserta didik mampu merumuskan pertanyaan, mengumpulkan, menyajikan, dan menginterpretasikan data dalam diagram batang dan lingkaran.\n2. Peserta didik mampu menentukan dan memprediksi nilai peluang empiris serta teoretis suatu kejadian.",
        alokasiWaktu: "4 x 45 JP",
        jumlahPertemuan: "2",
        semester: "2"
      }
    ];
  }

  if (s.includes("informatika") || s.includes("komputer") || s.includes("tik")) {
    return [
      {
        id: "bab-1",
        nomor: 1,
        judulBab: "Bab 1: Berpikir Komputasional dan Algoritma Dasar",
        elemenName: "Berpikir Komputasional (BK)",
        ringkasanMateri: "Dekomposisi, pengenalan pola, abstraksi, flowchart, dan perancangan pseudocode sistematis.",
        tujuanPembelajaran: "1. Peserta didik mampu menerapkan 4 pilar berpikir komputasional (dekomposisi, abstraksi, pengenalan pola, dan algoritma) untuk menyelesaikan masalah logis.\n2. Peserta didik mampu merancang flowchart dan pseudocode untuk memecahkan persoalan komputasi sehari-hari.",
        alokasiWaktu: "4 x 45 JP",
        jumlahPertemuan: "2",
        semester: "1"
      },
      {
        id: "bab-2",
        nomor: 2,
        judulBab: "Bab 2: Teknologi Informasi dan Komunikasi (TIK) Terapan",
        elemenName: "Teknologi Informasi & Komunikasi (TIK)",
        ringkasanMateri: "Integrasi aplikasi perkantoran, manajemen file awan, kolaborasi daring, dan etika komunikasi digital.",
        tujuanPembelajaran: "1. Peserta didik mampu memanfaatkan aplikasi pengolah kata, angka, dan presentasi terintegrasi untuk menyusun dokumen karya ilmiah.\n2. Peserta didik mampu mengelola berkas digital secara aman dan berkolaborasi dalam tim di cloud storage.",
        alokasiWaktu: "4 x 45 JP",
        jumlahPertemuan: "2",
        semester: "1"
      },
      {
        id: "bab-3",
        nomor: 3,
        judulBab: "Bab 3: Sistem Komputer dan Jaringan Internet",
        elemenName: "Sistem Komputer & Jaringan (SK/JKI)",
        ringkasanMateri: "Arsitektur perangkat keras/lunak, mekanisme komunikasi data, protokol internet, dan keamanan siber dasar.",
        tujuanPembelajaran: "1. Peserta didik mampu mengidentifikasi komponen perangkat keras dan mekanisme interaksi sistem komputer.\n2. Peserta didik mampu memahami cara kerja jaringan komputer lokal dan internet serta mempraktikkan keamanan data pribadi.",
        alokasiWaktu: "6 x 45 JP",
        jumlahPertemuan: "3",
        semester: "2"
      },
      {
        id: "bab-4",
        nomor: 4,
        judulBab: "Bab 4: Algoritma Pemrograman Blok dan Dampak Sosial Informatika",
        elemenName: "Algoritma Pemrograman & DSI",
        ringkasanMateri: "Coding visual (Scratch/Blockly), logika percabangan/perulangan, etika digital, dan jejak digital.",
        tujuanPembelajaran: "1. Peserta didik mampu membuat program visual interaktif sederhana dengan memanfaatkan variabel, perulangan, dan percabangan.\n2. Peserta didik mampu mengevaluasi dampak positif dan negatif teknologi digital serta menjaga etika di ruang siber.",
        alokasiWaktu: "6 x 45 JP",
        jumlahPertemuan: "3",
        semester: "2"
      }
    ];
  }

  if (s.includes("indonesia")) {
    return [
      {
        id: "bab-1",
        nomor: 1,
        judulBab: "Bab 1: Menjelajah Nusantara Melalui Teks Deskripsi",
        elemenName: "Menyimak & Membaca",
        ringkasanMateri: "Struktur teks deskripsi, majas personifikasi, serapan kata, dan penyusunan deskripsi objek nyata.",
        tujuanPembelajaran: "1. Peserta didik mampu menganalisis gagasan pokok dan rincian informasi dalam teks deskripsi secara kritis.\n2. Peserta didik mampu memproduksi teks deskripsi tertulis dan lisan tentang keindahan alam atau budaya lokal.",
        alokasiWaktu: "6 x 45 JP",
        jumlahPertemuan: "3",
        semester: "1"
      },
      {
        id: "bab-2",
        nomor: 2,
        judulBab: "Bab 2: Berkelana di Alam Imajinasi Lewat Cerita Fantasi",
        elemenName: "Menulis & Membaca",
        ringkasanMateri: "Ciri kebahasaan fantasi, alur cerita, penokohan, dan penulisan cerita narasi imajinatif.",
        tujuanPembelajaran: "1. Peserta didik mampu mengidentifikasi unsur intrinsik dan pesan moral dalam teks cerita fantasi.\n2. Peserta didik mampu mengkreasi cerita fantasi orisinal yang memuat nilai-nilai luhur kemanusiaan.",
        alokasiWaktu: "6 x 45 JP",
        jumlahPertemuan: "3",
        semester: "1"
      },
      {
        id: "bab-3",
        nomor: 3,
        judulBab: "Bab 3: Menyampaikan Ide Positif Melalui Teks Prosedur",
        elemenName: "Membaca & Mempresentasikan",
        ringkasanMateri: "Kaidah teks prosedur, kalimat imperatif, langkah terurut, dan pembuatan panduan hidup sehat/kreatif.",
        tujuanPembelajaran: "1. Peserta didik mampu menelaah struktur dan kaidah kebahasaan teks prosedur secara teliti.\n2. Peserta didik mampu merancang dan menyajikan teks prosedur kreatif dalam bentuk panduan visual atau video.",
        alokasiWaktu: "4 x 45 JP",
        jumlahPertemuan: "2",
        semester: "2"
      },
      {
        id: "bab-4",
        nomor: 4,
        judulBab: "Bab 4: Membuka Gerbang Fakta Melalui Teks Berita dan Eksplanasi",
        elemenName: "Menyimak & Menulis",
        ringkasanMateri: "Unsur 5W+1H, fakta vs opini, etika jurnalistik remaja, dan investigasi fenomena sosial.",
        tujuanPembelajaran: "1. Peserta didik mampu membedakan fakta dan opini serta menganalisis akurasi informasi dalam teks berita.\n2. Peserta didik mampu menyusun teks berita dan eksplanasi singkat mengenai fenomena lingkungan sekitar.",
        alokasiWaktu: "6 x 45 JP",
        jumlahPertemuan: "3",
        semester: "2"
      }
    ];
  }

  // Default umum untuk Mapel IPA, IPS, PAI, dll
  return [
    {
      id: "bab-1",
      nomor: 1,
      judulBab: `Bab 1: Konsep Fundamental & Esensial ${subject}`,
      elemenName: "Elemen 1",
      ringkasanMateri: `Pengenalan dasar, struktur materi pokok, dan observasi fenomena faktual dalam bidang ${subject}.`,
      tujuanPembelajaran: `1. Peserta didik mampu menganalisis konsep dasar dan definisi kontekstual materi ${subject} secara komprehensif.\n2. Peserta didik mampu menghubungkan konsep dasar dengan fenomena nyata dalam kehidupan sehari-hari dengan nalar kritis.`,
      alokasiWaktu: "4 x 45 JP",
      jumlahPertemuan: "2",
      semester: "1"
    },
    {
      id: "bab-2",
      nomor: 2,
      judulBab: `Bab 2: Analisis Masalah, Investigasi, dan Metode Ilmiah ${subject}`,
      elemenName: "Elemen 2",
      ringkasanMateri: `Identifikasi masalah, pengumpulan data terstruktur, diskusi kolaboratif, dan pembuktian hipotesis.`,
      tujuanPembelajaran: `1. Peserta didik mampu merumuskan hipotesis dan melakukan investigasi ilmiah terbimbing dalam topik ${subject}.\n2. Peserta didik mampu mengolah data hasil eksplorasi serta menyajikan argumen berbasis bukti.`,
      alokasiWaktu: "6 x 45 JP",
      jumlahPertemuan: "3",
      semester: "1"
    },
    {
      id: "bab-3",
      nomor: 3,
      judulBab: `Bab 3: Pendalaman Konsep Lanjutan dan Studi Kasus Interdisipliner`,
      elemenName: "Elemen 3",
      ringkasanMateri: `Penerapan konsep pada tingkat lanjutan, perbandingan studi kasus nyata, dan kearifan lokal.`,
      tujuanPembelajaran: `1. Peserta didik mampu mengevaluasi berbagai alternatif solusi atas permasalahan kompleks dalam ${subject}.\n2. Peserta didik mampu mengintegrasikan nilai etika, kepedulian lingkungan, dan kolaborasi dalam pemecahan masalah.`,
      alokasiWaktu: "6 x 45 JP",
      jumlahPertemuan: "3",
      semester: "2"
    },
    {
      id: "bab-4",
      nomor: 4,
      judulBab: `Bab 4: Aksi Nyata, Kreasi Produk, dan Refleksi Akhir Bab`,
      elemenName: "Elemen 4",
      ringkasanMateri: `Pembuatan proyek atau karya terapan nyata, gelar karya siswa, dan asesmen sumatif komprehensif.`,
      tujuanPembelajaran: `1. Peserta didik mampu mengkreasi produk, karya inovatif, atau laporan proyek sebagai wujud pemahaman konsep yang bermakna.\n2. Peserta didik mampu mempresentasikan karya dan melakukan refleksi metakognitif terhadap proses belajarnya.`,
      alokasiWaktu: "4 x 45 JP",
      jumlahPertemuan: "2",
      semester: "2"
    }
  ];
}

/**
 * Ekstraksi daftar bab secara cerdas dari data form Generator Perangkat Ajar AI
 */
export function extractSyncDataFromPerangkat(formData: any): PerangkatAjarSyncData {
  const subject = formData?.subject || "Matematika";
  const singkatanMapel = formData?.singkatanMapel || "MTK";
  const level = formData?.level || "Fase D / Kelas VIII";
  const year = formData?.year || "2026/2027";
  const school = formData?.school || "SMP Islam Athirah Baruga Antang";
  const teacher = formData?.teacher || "Ahmad Rifky Ridha, M.Pd.";
  const nipTeacher = formData?.nipTeacher || "-";
  const principal = formData?.principal || "Dr. Suriana, S.Pd., M.Pd.";
  const nipPrincipal = formData?.nipPrincipal || "-";
  const cityDate = formData?.cityDate || "Makassar, 14 Juli 2026";
  const cpRasional = formData?.cpRasional || "";

  // Ekstrak jenjang, fase, dan kelas dari level string (misal: "Fase D / Kelas VIII")
  let fase = "Fase D (Kelas 7-9)";
  let kelas = "VII";
  let jenjang = "SMP";

  if (level.includes("Fase A")) { fase = "Fase A (Kelas 1-2)"; jenjang = "SD"; }
  else if (level.includes("Fase B")) { fase = "Fase B (Kelas 3-4)"; jenjang = "SD"; }
  else if (level.includes("Fase C")) { fase = "Fase C (Kelas 5-6)"; jenjang = "SD"; }
  else if (level.includes("Fase D")) { fase = "Fase D (Kelas 7-9)"; jenjang = "SMP"; }
  else if (level.includes("Fase E")) { fase = "Fase E (Kelas 10)"; jenjang = "SMA"; }
  else if (level.includes("Fase F")) { fase = "Fase F (Kelas 11-12)"; jenjang = "SMA"; }

  const matchKelas = level.match(/Kelas\s+([A-Za-z0-9]+)/i);
  if (matchKelas && matchKelas[1]) {
    kelas = matchKelas[1].toUpperCase();
  } else if (level.includes("VIII")) {
    kelas = "VIII";
  } else if (level.includes("IX")) {
    kelas = "IX";
  } else if (level.includes("X")) {
    kelas = "X";
  } else if (level.includes("XI")) {
    kelas = "XI";
  } else if (level.includes("XII")) {
    kelas = "XII";
  }

  // Parse Elemen CP
  const rawCpElemen = formData?.cpElemen || "";
  let daftarBab: PerangkatBabItem[] = [];

  if (rawCpElemen.trim()) {
    // Split by "Elemen" or double newline
    const blocks = rawCpElemen
      .split(/(?=Elemen\s+\d+|Elemen\s+[A-Za-z]+:)/i)
      .map((b: string) => b.trim())
      .filter((b: string) => b.length > 0);

    if (blocks.length > 0) {
      daftarBab = blocks.map((block: string, idx: number) => {
        const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
        const firstLine = lines[0] || `Elemen ${idx + 1}`;
        const remainingText = lines.slice(1).join(" ") || block;

        // Extract title: "Elemen 1 — Bilangan: Deskripsi..." -> "Bab 1: Bilangan"
        let judul = firstLine.replace(/^Elemen\s+\d+\s*[-—:]*\s*/i, "").trim();
        if (judul.includes(":")) {
          judul = judul.split(":")[0].trim();
        }
        if (!judul) {
          judul = `Materi Esensial ${idx + 1}`;
        }

        const babNomor = idx + 1;
        const judulBabLengkap = `Bab ${babNomor}: ${judul}`;
        const sem = babNomor <= Math.ceil(blocks.length / 2) ? "1" : "2";

        const tpRumusan = `1. Peserta didik mampu menganalisis dan memahami konsep dasar ${judul} secara mendalam (Deep Learning Mindful).\n2. Peserta didik mampu menerapkan konsep ${judul} dalam pemecahan masalah kontekstual dan karya nyata secara mandiri dan bernalar kritis.`;

        return {
          id: `bab-${babNomor}`,
          nomor: babNomor,
          judulBab: judulBabLengkap,
          elemenName: judul,
          ringkasanMateri: remainingText.slice(0, 160) + (remainingText.length > 160 ? "..." : ""),
          tujuanPembelajaran: tpRumusan,
          alokasiWaktu: "4 x 45 JP",
          jumlahPertemuan: "2",
          semester: sem as "1" | "2"
        };
      });
    }
  }

  // Jika tidak ada bab yang berhasil diparse dari cpElemen, gunakan default mapel
  if (daftarBab.length === 0) {
    daftarBab = getDefaultBabList(subject, level);
  }

  return {
    mataPelajaran: subject,
    singkatanMapel,
    fase,
    kelas,
    jenjang,
    tahunAjaran: year,
    namaSekolah: school,
    namaGuru: teacher,
    nipGuru: nipTeacher,
    namaKepsek: principal,
    nipKepsek: nipPrincipal,
    tempatTtd: cityDate.split(",")[0]?.trim() || "Kerinci",
    tanggalTtd: cityDate.split(",")[1]?.trim() || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    cpRasional,
    daftarBab,
    terakhirDisinkronkan: new Date().toISOString()
  };
}

/**
 * Menyimpan data sinkronisasi ke localStorage dan memicu custom event
 */
export function savePerangkatSyncData(data: PerangkatAjarSyncData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("edufutura_perangkat_sync_updated", { detail: data }));
  } catch (err) {
    console.warn("Gagal menyimpan data sinkronisasi perangkat ajar ke localStorage:", err);
  }
}

/**
 * Mengambil data sinkronisasi dari localStorage
 */
export function getPerangkatSyncData(): PerangkatAjarSyncData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Gagal membaca data sinkronisasi perangkat ajar dari localStorage:", err);
    return null;
  }
}
