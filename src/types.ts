export interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  updatedAt?: number;
}

export interface Mapel {
  id: string;
  namaMapel: string;
  semester: string;
  tahunAjaran: string;
  updatedAt?: number;
}

export interface Jadwal {
  id: string;
  hari: string;
  jam: string;
  kelas: string;
  mapel: string;
  updatedAt?: number;
}

export interface LogAbsensi {
  id: string;
  waktu: string; // YYYY-MM-DD
  tanggal: string;
  kelas: string;
  mapel: string;
  idSiswa: string;
  namaSiswa: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  bulan: string;
  tahun: string;
  namaGuru: string;
  updatedAt?: number;
}

export interface DataNilai {
  id: string;
  waktu: string;
  jenis: string; // e.g. UH1, UTS, UAS, Tugas 1
  mapel: string;
  kelas: string;
  idSiswa: string;
  namaSiswa: string;
  nilai: number | '';
  namaGuru: string;
  updatedAt?: number;
}

export interface JurnalAgenda {
  id: string;
  tanggal: string;
  jam: string;
  kelas: string;
  mapel: string;
  materi: string;
  status: string; // Terlaksana / Tunda
  absenSiswa: string;
  ket?: string;
  namaGuru: string;
  updatedAt?: number;
}

export interface SiswaBimbingan {
  id: string;
  namaSiswa: string;
  kelas: string;
  updatedAt?: number;
}

export interface BimbinganWali {
  id: string;
  tanggal: string;
  namaSiswa: string;
  kelas: string;
  jenis: string; // Akademik, Pribadi, Sosial, Keterampilan
  kasus: string;
  tindakLanjut: string;
  guruWali: string;
  updatedAt?: number;
}

export interface Pengaturan {
  Nama_Guru: string;
  NIP_Guru: string;
  Pemerintah: string;
  Nama_Sekolah: string;
  Alamat_Sekolah: string;
  Nama_Kepsek: string;
  NIP_Kepsek: string;
  Tempat_Tanda_Tangan: string;
  Logo_Kiri: string;
  Logo_Kanan: string;
  username?: string;
  password?: string;
  isDatabaseCleared?: boolean;
}

export interface ModulFormState {
  namaGuru: string;
  nipGuru?: string;
  pemerintah?: string;
  namaSekolah: string;
  alamatSekolah?: string;
  namaKepsek?: string;
  nipKepsek?: string;
  tempatTtd?: string;
  tanggalTtd?: string;
  tahunAjaran: string;
  jenjang: string;
  fase: string;
  kelas: string;
  waktu: string;
  mataPelajaran: string;
  topik: string;
  subTopik?: string;
  jumlahPertemuan: string;
  model: string;
  metode?: string;
  tujuan: string;
  karakteristik: string;
  formatOutput?: "standar_merdeka" | "deep_learning" | "ringkas_1lembar" | "kemenag_kbc" | "sekolah_format1_iso";
  templateCategory?: "bawaan" | "sekolah";
  docNumberIso?: string;
  kepemimpinan?: string;
  spiritualisasi?: string;
  sertakanKop?: boolean;
  sertakanTtd?: boolean;
  sertakanLkpd?: boolean;
  sertakanLampiran017?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface RmeMonthItem {
  month: string;
  totalWeeks: number;
  nonEffective: number;
  effective: number;
  note: string;
}

export interface AgendaSekolahItem {
  id: string;
  kegiatan: string;
  waktu: string;
  semester: "Ganjil" | "Genap" | "Semua";
  kategori: "Kurikuler" | "Asesmen" | "Libur" | "Karakter/P5";
}

export interface RmeData {
  ganjil: RmeMonthItem[];
  genap: RmeMonthItem[];
  agenda: AgendaSekolahItem[];
  catatanKalender: string;
  summary?: {
    pekanGanjil: number;
    pekanGenap: number;
    totalPekan: number;
    jpGanjil: number;
    jpGenap: number;
    totalJp: number;
    jpIntrakurikuler: number;
    jpP5: number;
  };
}
