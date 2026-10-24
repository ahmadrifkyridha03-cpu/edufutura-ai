import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  BookOpen,
  GraduationCap,
  Bot,
  Printer,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Calendar,
  ClipboardCheck,
  Star,
  Award,
  Users,
  QrCode,
  FileText,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  HeartHandshake,
  Download,
  Database,
  School,
  Lightbulb
} from "lucide-react";

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  teacherName?: string;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  teacherName
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  // Sync state if modal is reopened
  useEffect(() => {
    if (isOpen) {
      // Keep checkbox checked by default for convenience
      setDontShowAgain(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem("guru_welcome_guide_seen", "true");
    }
    onClose();
  };

  const handleNavigateAndClose = (tabId: string) => {
    if (dontShowAgain) {
      localStorage.setItem("guru_welcome_guide_seen", "true");
    }
    onClose();
    onNavigate(tabId);
  };

  const steps = [
    {
      id: "overview",
      badge: "Langkah 1 dari 4",
      title: "Selamat Datang di Aplikasi Guru AI",
      subtitle: "Panduan Cepat Memahami 3 Menu Utama",
      icon: Compass,
      color: "from-blue-600 via-indigo-600 to-purple-600"
    },
    {
      id: "akademik",
      badge: "Langkah 2 dari 4",
      title: "Pilar 1: Menu Akademik",
      subtitle: "Pusat Pengelolaan Aktivitas & Penilaian Siswa Harian",
      icon: GraduationCap,
      color: "from-blue-600 to-cyan-600"
    },
    {
      id: "aitools",
      badge: "Langkah 3 dari 4",
      title: "Pilar 2: Menu AI Tools",
      subtitle: "Asisten Cerdas Penyusun Perangkat Ajar & Butir Soal",
      icon: Bot,
      color: "from-purple-600 to-pink-600"
    },
    {
      id: "laporan",
      badge: "Langkah 4 dari 4",
      title: "Pilar 3: Menu Laporan & Administrasi",
      subtitle: "Cetak Rapor, Leger Nilai, Rekap Absensi & Backup Data",
      icon: Printer,
      color: "from-emerald-600 to-teal-600"
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-guide-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Banner */}
        <div className={`p-5 sm:p-6 bg-gradient-to-r ${steps[currentStep].color} text-white relative transition-colors duration-300`}>
          <button
            type="button"
            onClick={handleFinish}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
            title="Tutup Panduan"
            aria-label="Tutup Panduan"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-white/80 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {steps[currentStep].badge}
            </span>
            <span>•</span>
            <span>Panduan Guru Baru</span>
          </div>

          <h2 id="welcome-guide-title" className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            {React.createElement(steps[currentStep].icon, { className: "w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-amber-300" })}
            <span>{steps[currentStep].title}</span>
          </h2>
          <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
            {steps[currentStep].subtitle}
          </p>

          {/* Stepper Tabs Bar */}
          <div className="flex items-center space-x-1.5 mt-4 pt-3 border-t border-white/15 overflow-x-auto no-scrollbar">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  currentStep === idx
                    ? "bg-white text-slate-900 shadow-md scale-102"
                    : "bg-white/15 text-white/80 hover:bg-white/25"
                }`}
              >
                <span>{idx + 1}.</span>
                <span className="hidden sm:inline">
                  {idx === 0 ? "Pengenalan" : idx === 1 ? "Akademik" : idx === 2 ? "AI Tools" : "Laporan"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar text-slate-700 dark:text-slate-200 space-y-4">
          {/* STEP 1: OVERVIEW */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  👋
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-200">
                    Halo, {teacherName || "Bapak/Ibu Guru Hebat"}!
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    Selamat datang di platform administrasi guru serba-lengkap. Aplikasi ini dirancang khusus untuk mempermudah rutinitas mengajar Anda mulai dari absensi harian, penilaian Kurikulum Merdeka, hingga pembuatan modul ajar pintar dengan bantuan AI.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2.5">
                  Tiga Pilar Utama Aplikasi:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card Akademik */}
                  <div
                    onClick={() => setCurrentStep(1)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer group hover:shadow-md"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                      <span>1. Menu Akademik</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Jadwal mengajar, absensi scan QR/manual, input nilai sumatif/UTS/UAS, dan cetak lembar Rapor Siswa.
                    </p>
                  </div>

                  {/* Card AI Tools */}
                  <div
                    onClick={() => setCurrentStep(2)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:border-purple-500 dark:hover:border-purple-400 transition-all cursor-pointer group hover:shadow-md"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <Bot className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                      <span>2. Menu AI Tools</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Generator Modul Ajar Deep Learning, Asisten konsultasi guru, pembuat soal ujian HOTS & LKPD otomatis.
                    </p>
                  </div>

                  {/* Card Laporan */}
                  <div
                    onClick={() => setCurrentStep(3)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all cursor-pointer group hover:shadow-md"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <Printer className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                      <span>3. Menu Laporan</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Cetak Leger Nilai resmi, Rekapitulasi Presensi PDF, ekspor file JSON untuk backup, dan kop surat sekolah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Tips:</strong> Data Anda tersimpan aman dan terintegrasi otomatis. Anda dapat membuka panduan ini kapan saja lewat tombol bantuan di bagian atas.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: AKADEMIK */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm text-blue-900 dark:text-blue-200">
                <strong>Menu Akademik</strong> adalah pusat pencatatan harian guru di kelas. Semua proses penilaian siswa dan absensi dikelola di sini.
              </div>

              <div className="space-y-2.5">
                {/* Feature 1: Penilaian & Rapor */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Input Penilaian & Ranking Otomatis
                      </h4>
                      <span className="text-[10px] bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full">
                        Kurikulum Merdeka
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Kelola nilai Sumatif (50%), UTS (35%), dan UAS (15%). Aplikasi menghitung Nilai Akhir otomatis, menentukan predikat, membuat ranking siswa, dan menyediakan modal rincian nilai transparan.
                    </p>
                  </div>
                </div>

                {/* Feature 2: Cetak Rapor */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Cetak Rapor Siswa Merdeka
                      </h4>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                        Format Resmi A4
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Cetak lembar laporan hasil belajar per siswa dengan deskripsi capaian kompetensi otomatis, pratinjau interaktif, cetak massal satu kelas (PDF), serta tombol praktis kirim ringkasan ke WhatsApp wali murid.
                    </p>
                  </div>
                </div>

                {/* Feature 3: Absensi & Kartu QR */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Input Absensi & Kartu Siswa QR Code
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Catat kehadiran harian secara cepat per rombel (Hadir, Sakit, Izin, Alpa) atau gunakan kamera untuk scan QR Code pada Kartu Pelajar yang bisa dicetak langsung.
                    </p>
                  </div>
                </div>

                {/* Feature 4: Jadwal & Agenda */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Jadwal & Agenda Mengajar Guru
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Susun jadwal tatap muka mingguan dan isi jurnal refleksi kegiatan pembelajaran setiap pertemuan sebagai bukti fisik kinerja guru.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Ingin langsung mencoba modul penilaian?
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigateAndClose("penilaian")}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Buka Menu Penilaian</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI TOOLS */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs sm:text-sm text-purple-900 dark:text-purple-200">
                <strong>Menu AI Tools</strong> adalah asisten cerdas pribadi Bapak/Ibu guru. Hemat waktu berjam-jam dalam merancang perangkat ajar, materi, dan evaluasi soal berstandar tinggi.
              </div>

              <div className="space-y-2.5">
                {/* Feature 1: Modul Ajar AI */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Modul Ajar AI (Deep Learning Approach)
                      </h4>
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full">
                        Otomatis & Lengkap
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Cukup masukkan topik materi dan jenjang kelas, AI akan menyusun modul ajar lengkap: Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik, Langkah Diferensiasi, hingga Asesmen.
                    </p>
                  </div>
                </div>

                {/* Feature 2: Asisten Guru AI */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950/80 text-pink-600 dark:text-pink-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Asisten Guru AI & Generator Soal HOTS
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Konsultasi metode pedagogik, buat butir soal pilihan ganda & uraian berbasis stimulus/HOTS beserta kunci jawaban dan rubrik penilaian secara instan.
                    </p>
                  </div>
                </div>

                {/* Feature 3: Generator LKPD */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Generator LKPD AI (Lembar Kerja Siswa)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Ciptakan Lembar Kerja Peserta Didik interaktif dengan studi kasus kontekstual dan panduan diskusi kelompok siap cetak untuk kegiatan kelas.
                    </p>
                  </div>
                </div>

                {/* Feature 4: Analisis CP, TP, ATP */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Generator Perangkat Ajar (CP, ATP, Prota, Prosem)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Bedah Capaian Pembelajaran (CP) menjadi Tujuan Pembelajaran (TP), Alur Tujuan Pembelajaran (ATP), dan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP).
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Ingin merancang modul ajar dengan AI?
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigateAndClose("modulai")}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Buka Modul Ajar AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: LAPORAN */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                <strong>Menu Laporan & Administrasi</strong> memastikan seluruh dokumen guru siap diarsipkan dan dicetak untuk keperluan dinas, akreditasi, maupun laporan wali murid.
              </div>

              <div className="space-y-2.5">
                {/* Feature 1: Pusat Laporan */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Pusat Laporan & Leger Nilai PDF
                      </h4>
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full">
                        Standar Resmi
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Ekspor Leger Nilai siswa satu rombel, Rekap Kehadiran bulanan/semester, dan Jurnal Guru ke dokumen PDF resmi ber-kop sekolah dalam 1 klik.
                    </p>
                  </div>
                </div>

                {/* Feature 2: Rapor Kurikulum Merdeka */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Cetak Lembar Rapor Siswa Merdeka
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Dilengkapi tanda tangan guru mata pelajaran / wali kelas dan kepala sekolah lengkap beserta NIP untuk arsip resmi kurikulum merdeka.
                    </p>
                  </div>
                </div>

                {/* Feature 3: Backup & Export */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Backup & Ekspor File .JSON
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Cadangkan seluruh data nilai, absensi, dan master siswa secara mandiri ke komputer atau Google Drive Anda untuk menjaga keamanan data jangka panjang.
                    </p>
                  </div>
                </div>

                {/* Feature 4: Profil & Kop */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Pengaturan Profil Guru & Kop Sekolah
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Sesuaikan identitas sekolah, nama kepala sekolah, NIP, alamat institusi, serta upload scan tanda tangan digital yang otomatis muncul di seluruh cetakan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Ingin melihat format laporan PDF?
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigateAndClose("laporan")}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Buka Pusat Laporan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Checkbox 'Don't show again' */}
          <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Jangan tampilkan lagi saat membuka aplikasi</span>
          </label>

          {/* Controls: Prev, Next / Finish */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <span>Lanjut</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 font-black"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Mulai Gunakan Aplikasi</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
