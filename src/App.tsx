import React, { useState, useEffect, Suspense, lazy } from "react";
import { 
  PieChart, 
  GraduationCap, 
  Sparkles, 
  Printer, 
  Clock, 
  ClipboardCheck, 
  Star, 
  Calendar, 
  HeartHandshake, 
  Download, 
  FileCheck, 
  Wand2, 
  Bot, 
  Globe, 
  Settings,
  ChevronRight,
  X,
  SlidersHorizontal,
  Award
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { WelcomeGuideModal } from "./components/WelcomeGuideModal";
import { ViewLoadingSkeleton } from "./components/ViewLoadingSkeleton";

// Dynamic Code-Splitting for all views to reduce initial bundle size and maximize load speed
const DashboardView = lazy(() => import("./components/DashboardView").then(m => ({ default: m.DashboardView })));
const KelolaSiswaView = lazy(() => import("./components/KelolaSiswaView").then(m => ({ default: m.KelolaSiswaView })));
const CetakKartuQRView = lazy(() => import("./components/CetakKartuQRView").then(m => ({ default: m.CetakKartuQRView })));
const KelolaMapelView = lazy(() => import("./components/KelolaMapelView").then(m => ({ default: m.KelolaMapelView })));
const JadwalMengajarView = lazy(() => import("./components/JadwalMengajarView").then(m => ({ default: m.JadwalMengajarView })));
const InputAbsensiView = lazy(() => import("./components/InputAbsensiView").then(m => ({ default: m.InputAbsensiView })));
const InputPenilaianView = lazy(() => import("./components/InputPenilaianView").then(m => ({ default: m.InputPenilaianView })));
const CetakRaportView = lazy(() => import("./components/CetakRaportView").then(m => ({ default: m.CetakRaportView })));
const AgendaMengajarView = lazy(() => import("./components/AgendaMengajarView").then(m => ({ default: m.AgendaMengajarView })));
const BimbinganWaliView = lazy(() => import("./components/BimbinganWaliView").then(m => ({ default: m.BimbinganWaliView })));
const DownloadPerangkatAjarView = lazy(() => import("./components/DownloadPerangkatAjarView").then(m => ({ default: m.DownloadPerangkatAjarView })));
const PerangkatAjarKBCView = lazy(() => import("./components/PerangkatAjarKBCView").then(m => ({ default: m.PerangkatAjarKBCView })));
const GeneratorPerangkatAjarAIView = lazy(() => import("./components/GeneratorPerangkatAjarAIView").then(m => ({ default: m.GeneratorPerangkatAjarAIView })));
const ModulAjarAIView = lazy(() => import("./components/ModulAjarAIView").then(m => ({ default: m.ModulAjarAIView })));
const AsistenGuruAIView = lazy(() => import("./components/AsistenGuruAIView").then(m => ({ default: m.AsistenGuruAIView })));
const GeneratorLkpdAIView = lazy(() => import("./components/GeneratorLkpdAIView").then(m => ({ default: m.GeneratorLkpdAIView })));
const GeneratorAILainnyaView = lazy(() => import("./components/GeneratorAILainnyaView").then(m => ({ default: m.GeneratorAILainnyaView })));
const PusatLaporanView = lazy(() => import("./components/PusatLaporanView").then(m => ({ default: m.PusatLaporanView })));
const PengaturanView = lazy(() => import("./components/PengaturanView").then(m => ({ default: m.PengaturanView })));
const ResetDatabaseView = lazy(() => import("./components/ResetDatabaseView").then(m => ({ default: m.ResetDatabaseView })));


import { LoginView } from "./components/LoginView";
import Swal from "./lib/swal";

import { 
  subscribeAuthUser,
  logoutUser,
  setActiveUserId,
  getActiveUserId,
  subscribeCollection, 
  subscribePengaturan, 
  batchSaveDocuments, 
  savePengaturan,
  syncAllLocalDataToFirestore,
  COLLECTIONS 
} from "./lib/firebase";

import { 
  Siswa, 
  Mapel, 
  Jadwal, 
  LogAbsensi, 
  DataNilai, 
  JurnalAgenda, 
  SiswaBimbingan, 
  BimbinganWali, 
  Pengaturan,
  GuruUser
} from "./types";

const DEFAULT_CONFIG: Pengaturan = {
  Nama_Guru: "Drs. Yefri Haryanto, M.Pd.",
  NIP_Guru: "19850312 201001 1 008",
  Pemerintah: "PEMERINTAH PROVINSI JAMBI",
  Nama_Sekolah: "SMP NEGERI 3 KERINCI",
  Alamat_Sekolah: "Jalan Raya Lintas Sungai Penuh, Telp: (0748) 21102",
  Nama_Kepsek: "Hamdani, S.Pd., M.Si.",
  NIP_Kepsek: "19780514 200212 1 003",
  Tempat_Tanda_Tangan: "Kerinci",
  Logo_Kiri: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
  Logo_Kanan: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU"
};

// Sub-Menu Categories Definitions for Complete Android Navigation
const AKADEMIK_ITEMS = [
  { id: "jadwal", label: "Jadwal Mengajar", icon: Clock, desc: "Kelola & cetak jadwal pelajaran" },
  { id: "absensi", label: "Input Absensi", icon: ClipboardCheck, desc: "Pencatatan kehadiran harian siswa" },
  { id: "penilaian", label: "Input Penilaian", icon: Star, desc: "Rekap & input nilai formatif/sumatif" },
  { id: "raport", label: "Cetak Rapor Siswa", icon: Award, desc: "Cetak Rapor Kurikulum Merdeka resmi" },
  { id: "agenda", label: "Agenda Mengajar", icon: Calendar, desc: "Jurnal kegiatan belajar harian guru" },
  { id: "bimbingan", label: "Bimbingan Guru Wali", icon: HeartHandshake, desc: "Catatan bimbingan & konseling wali kelas" },
  { id: "downloadperangkat", label: "Download Perangkat Ajar", icon: Download, desc: "Download RPP/Modul Ajar terlengkap" },
];

const AI_TOOLS_ITEMS = [
  { id: "perangkat_kbc", label: "Perangkat Ajar KBC", icon: HeartHandshake, desc: "ACP, TP, ATP, Prota, Prosem, KKTP, Modul, LKPD & Rubrik KBC", badge: "KBC" },
  { id: "perangkat_ai", label: "Generator Perangkat Ajar AI", icon: FileCheck, desc: "Buat RPP & ATP otomatis dengan AI", badge: "AI Pro" },
  { id: "modulai", label: "Modul Ajar AI", icon: Wand2, desc: "Susun Modul Ajar Deep Learning Kurikulum Merdeka", badge: "Deep Learning" },
  { id: "asistenai", label: "Asisten Guru AI", icon: Bot, desc: "Tanya jawab & konsultasi materi mengajar", badge: "Chatbot" },
  { id: "lkpdai", label: "Generator LKPD AI", icon: Sparkles, desc: "Buat Lembar Kerja Peserta Didik interaktif", badge: "LKPD" },
  { id: "ailainnya", label: "Generator AI Lainnya", icon: Globe, desc: "Generator Soal, Silabus, Rubrik Asesmen & Media", badge: "Multi-Tool" },
];

const LAPORAN_ITEMS = [
  { id: "raport", label: "Cetak Rapor Merdeka", icon: Award, desc: "Cetak Rapor Nilai & Capaian Belajar Siswa" },
  { id: "laporan", label: "Pusat Laporan", icon: Printer, desc: "Cetak Rekap Absensi, Leger & Jurnal PDF" },
  { id: "pengaturan", label: "Pengaturan Profil & Kop", icon: Settings, desc: "Atur data guru, sekolah & kop dokumen" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategorySheet, setActiveCategorySheet] = useState<"akademik" | "ai" | "laporan" | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("edadmin_theme");
    return saved ? saved === "dark" : true; // Default to Futuristic Cyber Dark Mode
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isWelcomeGuideOpen, setIsWelcomeGuideOpen] = useState<boolean>(() => {
    return localStorage.getItem("guru_welcome_guide_seen") !== "true";
  });

  // Sync dark class on documentElement and body for Tailwind CSS theme switching
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("edadmin_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("edadmin_theme", "light");
    }
  }, [isDarkMode]);

  // Authentication & Active Teacher State
  const [currentUser, setCurrentUser] = useState<GuruUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Firestore Data Collections
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [absensiList, setAbsensiList] = useState<LogAbsensi[]>([]);
  const [nilaiList, setNilaiList] = useState<DataNilai[]>([]);
  const [agendaList, setAgendaList] = useState<JurnalAgenda[]>([]);
  const [siswaBimbinganList, setSiswaBimbinganList] = useState<SiswaBimbingan[]>([]);
  const [bimbinganList, setBimbinganList] = useState<BimbinganWali[]>([]);
  const [config, setConfig] = useState<Pengaturan>(DEFAULT_CONFIG);

  // Initial Auth Session Listener
  useEffect(() => {
    const unsubscribeAuth = subscribeAuthUser((user) => {
      setCurrentUser(user);
      if (user) {
        setActiveUserId(user.uid);
      } else {
        setActiveUserId(null);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Subscribe to Firebase real-time collections scoped to active teacher
  useEffect(() => {
    if (!currentUser) {
      setSiswaList([]);
      setMapelList([]);
      setJadwalList([]);
      setAbsensiList([]);
      setNilaiList([]);
      setAgendaList([]);
      setSiswaBimbinganList([]);
      setBimbinganList([]);
      setIsConnected(false);
      return;
    }

    setActiveUserId(currentUser.uid);
    let unsubs: Array<() => void> = [];

    unsubs.push(subscribeCollection<Siswa>(COLLECTIONS.SISWA, (data) => {
      setSiswaList(data);
      setIsConnected(true);
    }));

    unsubs.push(subscribeCollection<Mapel>(COLLECTIONS.MAPEL, (data) => {
      setMapelList(data);
    }));

    unsubs.push(subscribeCollection<Jadwal>(COLLECTIONS.JADWAL, (data) => {
      setJadwalList(data);
    }));

    unsubs.push(subscribeCollection<LogAbsensi>(COLLECTIONS.LOG_ABSENSI, (data) => {
      setAbsensiList(data);
    }));

    unsubs.push(subscribeCollection<DataNilai>(COLLECTIONS.DATA_NILAI, (data) => {
      setNilaiList(data);
    }));

    unsubs.push(subscribeCollection<JurnalAgenda>(COLLECTIONS.JURNAL_AGENDA, (data) => {
      setAgendaList(data);
    }));

    unsubs.push(subscribeCollection<SiswaBimbingan>(COLLECTIONS.SISWA_BIMBINGAN, (data) => {
      setSiswaBimbinganList(data);
    }));

    unsubs.push(subscribeCollection<BimbinganWali>(COLLECTIONS.BIMBINGAN_WALI, (data) => {
      setBimbinganList(data);
    }));

    unsubs.push(subscribePengaturan((cfg) => {
      if (cfg && Object.keys(cfg).length > 0) {
        setConfig((prev) => ({ ...prev, ...cfg }));
      } else {
        // Fallback or seed with registered teacher info
        setConfig((prev) => ({
          ...prev,
          Nama_Guru: currentUser.displayName || prev.Nama_Guru,
          NIP_Guru: currentUser.nip || prev.NIP_Guru,
          Nama_Sekolah: currentUser.sekolah || prev.Nama_Sekolah,
        }));
      }
    }));

    // Auto-sync any existing local storage data for this teacher
    syncAllLocalDataToFirestore().catch((err) => {
      console.warn("Background auto-sync notice:", err);
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [currentUser?.uid]);

  // Seed sample initial data if database is empty on first boot for this teacher
  useEffect(() => {
    if (!currentUser || !isConnected) return;

    const seedInitialData = async () => {
      // Do not re-seed sample data if database was explicitly cleared/wiped by user
      if (
        localStorage.getItem(`edadmin_database_cleared_${currentUser.uid}`) === "true" ||
        config?.isDatabaseCleared === true
      ) {
        return;
      }

      // Seed Siswa if empty
      if (siswaList.length === 0 && isConnected) {
        const sampleSiswa: Siswa[] = [
          { id: "1001", nisn: "0012345678", nama: "Ahmad Fulan", kelas: "VII A" },
          { id: "1002", nisn: "0012345679", nama: "Siti Aminah", kelas: "VII A" },
          { id: "1003", nisn: "0012345680", nama: "Budi Pratama", kelas: "VII B" },
          { id: "1004", nisn: "0012345681", nama: "Rizky Febrian", kelas: "VII B" }
        ];
        await batchSaveDocuments(COLLECTIONS.SISWA, sampleSiswa);
      }

      // Seed Mapel if empty
      if (mapelList.length === 0 && isConnected) {
        const sampleMapel: Mapel[] = [
          { id: "m1", namaMapel: currentUser.mapelUtama || "Informatika", semester: "Ganjil", tahunAjaran: "2026/2027" },
          { id: "m2", namaMapel: "Matematika", semester: "Ganjil", tahunAjaran: "2026/2027" },
          { id: "m3", namaMapel: "Bahasa Indonesia", semester: "Ganjil", tahunAjaran: "2026/2027" },
          { id: "m4", namaMapel: "IPA Terpadu", semester: "Ganjil", tahunAjaran: "2026/2027" }
        ];
        await batchSaveDocuments(COLLECTIONS.MAPEL, sampleMapel);
      }

      // Seed Jadwal if empty
      if (jadwalList.length === 0 && isConnected) {
        const sampleJadwal: Jadwal[] = [
          { id: "j1", hari: "Senin", jam: "07:30 - 09:00", kelas: "VII A", mapel: currentUser.mapelUtama || "Informatika" },
          { id: "j2", hari: "Selasa", jam: "09:15 - 10:45", kelas: "VII B", mapel: currentUser.mapelUtama || "Informatika" }
        ];
        await batchSaveDocuments(COLLECTIONS.JADWAL, sampleJadwal);
      }

      // Save initial config if empty
      if (!config.Nama_Guru && isConnected) {
        await savePengaturan({
          ...DEFAULT_CONFIG,
          Nama_Guru: currentUser.displayName || DEFAULT_CONFIG.Nama_Guru,
          NIP_Guru: currentUser.nip || DEFAULT_CONFIG.NIP_Guru,
          Nama_Sekolah: currentUser.sekolah || DEFAULT_CONFIG.Nama_Sekolah,
        });
      }
    };

    seedInitialData();
  }, [currentUser?.uid, isConnected, siswaList.length, mapelList.length, jadwalList.length, config.Nama_Guru, config.isDatabaseCleared]);

  const handleSuccessReset = () => {
    setConfig((prev) => ({ ...prev, isDatabaseCleared: true }));
    setSiswaList([]);
    setMapelList([]);
    setJadwalList([]);
    setAbsensiList([]);
    setNilaiList([]);
    setAgendaList([]);
    setSiswaBimbinganList([]);
    setBimbinganList([]);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Keluar Akun Guru?",
      text: "Sesi kerja Anda saat ini akan ditutup dengan aman.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Keluar Akun",
      cancelButtonText: "Batal",
      background: isDarkMode ? "#0f172a" : "#ffffff",
      color: isDarkMode ? "#f8fafc" : "#0f172a",
    });

    if (result.isConfirmed) {
      await logoutUser();
      setCurrentUser(null);
      setActiveUserId(null);
      Swal.fire({
        icon: "success",
        title: "Berhasil Keluar",
        text: "Sampai jumpa kembali di EduFutura AI!",
        timer: 1600,
        showConfirmButton: false,
        background: isDarkMode ? "#0f172a" : "#ffffff",
        color: isDarkMode ? "#f8fafc" : "#0f172a",
      });
    }
  };

  // Auth Loading State
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans ${isDarkMode ? "dark" : ""}`}>
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <GraduationCap className="w-9 h-9 text-cyan-200" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
              EduFutura AI
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">Memeriksa Sesi Guru Terenkripsi...</p>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated: Render Futuristic Teacher Login & Registration Portal
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveUserId(user.uid);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-100 font-sans transition-colors relative overflow-hidden ${isDarkMode ? "dark" : ""}`}>
      {/* Ambient Cybernetic Gradient Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Header
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isDarkMode={isDarkMode}
          onSetDarkMode={(isDark) => setIsDarkMode(isDark)}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isConnected={isConnected}
          config={config}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={() => setActiveTab("pengaturan")}
          onOpenWelcomeGuide={() => setIsWelcomeGuideOpen(true)}
        />

        {/* Sub-Header Pill Navigation Bar: Akademik */}
        {AKADEMIK_ITEMS.some(item => item.id === activeTab) && (
          <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-3 py-2 flex items-center space-x-2 overflow-x-auto custom-scrollbar shrink-0 select-none">
            <button 
              onClick={() => setActiveCategorySheet("akademik")}
              className="flex items-center space-x-1.5 pr-2.5 border-r border-slate-200 dark:border-white/10 shrink-0 text-cyan-600 dark:text-cyan-400 font-display font-extrabold text-xs active:scale-95 transition-transform cursor-pointer"
              title="Buka Laci Menu Akademik"
            >
              <GraduationCap className="w-4 h-4 text-cyan-500" />
              <span>Akademik:</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
            {AKADEMIK_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-400/40"
                      : "bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent dark:border-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-Header Pill Navigation Bar: AI Tools */}
        {AI_TOOLS_ITEMS.some(item => item.id === activeTab) && (
          <div className="bg-amber-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-amber-200/40 dark:border-white/10 px-3 py-2 flex items-center space-x-2 overflow-x-auto custom-scrollbar shrink-0 select-none">
            <button 
              onClick={() => setActiveCategorySheet("ai")}
              className="flex items-center space-x-1.5 pr-2.5 border-r border-amber-200 dark:border-white/10 shrink-0 text-amber-600 dark:text-amber-400 font-display font-extrabold text-xs active:scale-95 transition-transform cursor-pointer"
              title="Buka Laci Menu AI Tools"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Tools:</span>
              <SlidersHorizontal className="w-3 h-3 text-amber-400 ml-0.5" />
            </button>
            {AI_TOOLS_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_0_14px_rgba(245,158,11,0.4)] border border-amber-300"
                      : "bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-amber-100/50 dark:hover:bg-slate-800 border border-transparent dark:border-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-Header Pill Navigation Bar: Laporan */}
        {LAPORAN_ITEMS.some(item => item.id === activeTab) && (
          <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-3 py-2 flex items-center space-x-2 overflow-x-auto custom-scrollbar shrink-0 select-none">
            <button 
              onClick={() => setActiveCategorySheet("laporan")}
              className="flex items-center space-x-1.5 pr-2.5 border-r border-slate-200 dark:border-white/10 shrink-0 text-violet-600 dark:text-violet-400 font-display font-extrabold text-xs active:scale-95 transition-transform cursor-pointer"
              title="Buka Laci Menu Laporan"
            >
              <Printer className="w-4 h-4 text-violet-500" />
              <span>Laporan:</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
            {LAPORAN_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)] border border-violet-400/40"
                      : "bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent dark:border-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 custom-scrollbar pb-24 lg:pb-8">
          <Suspense fallback={<ViewLoadingSkeleton />}>
            {activeTab === "dashboard" && (
              <DashboardView
                siswaList={siswaList}
                mapelList={mapelList}
                absensiList={absensiList}
                nilaiList={nilaiList}
                jadwalList={jadwalList}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenWelcomeGuide={() => setIsWelcomeGuideOpen(true)}
              />
            )}

            {activeTab === "siswa" && <KelolaSiswaView siswaList={siswaList} />}

            {activeTab === "kartu" && <CetakKartuQRView siswaList={siswaList} config={config} />}

            {activeTab === "mapel" && <KelolaMapelView mapelList={mapelList} />}

            {activeTab === "jadwal" && (
              <JadwalMengajarView
                jadwalList={jadwalList}
                mapelList={mapelList}
                siswaList={siswaList}
              />
            )}

            {activeTab === "absensi" && (
              <InputAbsensiView
                siswaList={siswaList}
                mapelList={mapelList}
                absensiList={absensiList}
                config={config}
              />
            )}

            {activeTab === "penilaian" && (
              <InputPenilaianView
                siswaList={siswaList}
                mapelList={mapelList}
                nilaiList={nilaiList}
                config={config}
              />
            )}

            {activeTab === "raport" && (
              <CetakRaportView
                siswaList={siswaList}
                mapelList={mapelList}
                absensiList={absensiList}
                nilaiList={nilaiList}
                config={config}
              />
            )}

            {activeTab === "agenda" && (
              <AgendaMengajarView
                agendaList={agendaList}
                mapelList={mapelList}
                siswaList={siswaList}
                config={config}
              />
            )}

            {activeTab === "bimbingan" && (
              <BimbinganWaliView
                bimbinganList={bimbinganList}
                siswaBimbinganList={siswaBimbinganList}
                siswaList={siswaList}
                config={config}
              />
            )}

            {activeTab === "downloadperangkat" && <DownloadPerangkatAjarView />}

            {activeTab === "perangkat_kbc" && <PerangkatAjarKBCView config={config} />}

            {activeTab === "perangkat_ai" && (
              <GeneratorPerangkatAjarAIView 
                config={config} 
                onNavigateToModulAjar={() => setActiveTab("modulai")}
              />
            )}

            {activeTab === "modulai" && <ModulAjarAIView config={config} />}

            {activeTab === "asistenai" && <AsistenGuruAIView config={config} />}

            {activeTab === "lkpdai" && <GeneratorLkpdAIView config={config} />}

            {activeTab === "ailainnya" && <GeneratorAILainnyaView />}

            {activeTab === "laporan" && (
              <PusatLaporanView
                siswaList={siswaList}
                mapelList={mapelList}
                absensiList={absensiList}
                nilaiList={nilaiList}
                agendaList={agendaList}
                bimbinganList={bimbinganList}
                config={config}
                onNavigateToRaport={() => setActiveTab("raport")}
              />
            )}

            {activeTab === "pengaturan" && (
              <PengaturanView
                config={config}
                onNavigateToReset={() => setActiveTab("resetdb")}
                nilaiList={nilaiList}
                siswaList={siswaList}
                mapelList={mapelList}
              />
            )}

            {activeTab === "resetdb" && (
              <ResetDatabaseView onSuccessReset={handleSuccessReset} />
            )}
          </Suspense>
        </main>

        {/* Native Android Bottom Navigation Bar (4 Utama Menu: Dashboard, Akademik, AI Tools, Laporan) */}
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-30 px-2 py-1.5 pb-safe shadow-lg flex items-center justify-around transition-colors select-none"
          aria-label="Navigasi Bawah Android"
        >
          <button
            onClick={() => {
              setActiveCategorySheet(null);
              setActiveTab("dashboard");
            }}
            className={`flex flex-col items-center justify-center flex-1 min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
              activeTab === "dashboard"
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <PieChart className={`w-5 h-5 ${activeTab === "dashboard" ? "scale-110" : ""}`} />
            <span className="text-[11px] mt-0.5 tracking-tight truncate">Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveCategorySheet(activeCategorySheet === "akademik" ? null : "akademik");
              if (!AKADEMIK_ITEMS.some(i => i.id === activeTab)) {
                setActiveTab("absensi");
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
              AKADEMIK_ITEMS.some(i => i.id === activeTab)
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <GraduationCap className={`w-5 h-5 ${AKADEMIK_ITEMS.some(i => i.id === activeTab) ? "scale-110" : ""}`} />
            <span className="text-[11px] mt-0.5 tracking-tight truncate">Akademik</span>
          </button>

          <button
            onClick={() => {
              setActiveCategorySheet(activeCategorySheet === "ai" ? null : "ai");
              if (!AI_TOOLS_ITEMS.some(i => i.id === activeTab)) {
                setActiveTab("perangkat_ai");
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
              AI_TOOLS_ITEMS.some(i => i.id === activeTab)
                ? "text-amber-500 dark:text-amber-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400"
            }`}
          >
            <Sparkles className={`w-5 h-5 ${AI_TOOLS_ITEMS.some(i => i.id === activeTab) ? "scale-110 text-amber-500" : ""}`} />
            <span className="text-[11px] mt-0.5 tracking-tight truncate">AI Tools</span>
          </button>

          <button
            onClick={() => {
              setActiveCategorySheet(activeCategorySheet === "laporan" ? null : "laporan");
              if (!LAPORAN_ITEMS.some(i => i.id === activeTab)) {
                setActiveTab("laporan");
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
              LAPORAN_ITEMS.some(i => i.id === activeTab)
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Printer className={`w-5 h-5 ${LAPORAN_ITEMS.some(i => i.id === activeTab) ? "scale-110" : ""}`} />
            <span className="text-[11px] mt-0.5 tracking-tight truncate">Laporan</span>
          </button>
        </nav>

        {/* Android Native Bottom Sheet Chooser Modal */}
        {activeCategorySheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
            {/* Dark Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setActiveCategorySheet(null)}
            />

            {/* Bottom Sheet Modal Container */}
            <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl z-10 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom duration-200 pb-20">
              {/* Top Drag Handle Bar */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

              {/* Sheet Header Title */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  {activeCategorySheet === "akademik" && (
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  )}
                  {activeCategorySheet === "ai" && (
                    <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                  {activeCategorySheet === "laporan" && (
                    <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center shrink-0">
                      <Printer className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {activeCategorySheet === "akademik" && "Pilih Menu Akademik Lengkap"}
                      {activeCategorySheet === "ai" && "Pilih Tool AI Lengkap"}
                      {activeCategorySheet === "laporan" && "Pilih Laporan & Sistem"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeCategorySheet === "akademik" && "Semua modul administrasi akademik guru"}
                      {activeCategorySheet === "ai" && "Seluruh generator & kecerdasan buatan AI Pro"}
                      {activeCategorySheet === "laporan" && "Rekapitulasi cetak PDF & pengaturan"}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveCategorySheet(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Item List Options */}
              <div className="space-y-2.5">
                {activeCategorySheet === "akademik" && AKADEMIK_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setActiveCategorySheet(null);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100 font-bold"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs sm:text-sm truncate">{item.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    </button>
                  );
                })}

                {activeCategorySheet === "ai" && AI_TOOLS_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setActiveCategorySheet(null);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isActive
                          ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 font-bold"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-amber-500 text-slate-950" : "bg-white dark:bg-slate-700 text-amber-500"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-xs sm:text-sm truncate">{item.label}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-400/30">
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-500" : "text-slate-400"}`} />
                    </button>
                  );
                })}

                {activeCategorySheet === "laporan" && LAPORAN_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setActiveCategorySheet(null);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white font-bold"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs sm:text-sm truncate">{item.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 shrink-0 ${isActive ? "text-slate-800 dark:text-white" : "text-slate-400"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Welcome Guide Modal for New Teachers */}
      <WelcomeGuideModal
        isOpen={isWelcomeGuideOpen}
        onClose={() => setIsWelcomeGuideOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        teacherName={config.Nama_Guru}
      />
    </div>
  );
}
