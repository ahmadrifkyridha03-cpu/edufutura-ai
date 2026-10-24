import React from "react";
import { 
  Menu, 
  CloudCheck, 
  CloudOff, 
  Moon, 
  Sun, 
  GraduationCap, 
  ShieldCheck, 
  HelpCircle,
  Sparkles,
  Radio
} from "lucide-react";
import { Pengaturan } from "../types";

interface HeaderProps {
  activeTab: string;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onSetDarkMode: (isDark: boolean) => void;
  onToggleDarkMode?: () => void;
  isConnected: boolean;
  config: Pengaturan;
  onLogout?: () => void;
  onOpenWelcomeGuide?: () => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  siswa: "Kelola Master Data Siswa",
  kartu: "Cetak Kartu Pelajar QR Code",
  mapel: "Kelola Mata Pelajaran",
  jadwal: "Jadwal Mengajar Guru",
  absensi: "Input Absensi Harian & QR Scanner",
  penilaian: "Input Nilai Akademik Siswa",
  raport: "Cetak Rapor Kurikulum Merdeka",
  agenda: "Jurnal Agenda Mengajar",
  bimbingan: "Catatan Bimbingan Guru Wali",
  downloadperangkat: "Download Perangkat Ajar (Deep Learning)",
  perangkat_kbc: "Perangkat Ajar KBC (Kemenag & Merdeka)",
  perangkat_ai: "Generator Perangkat Ajar AI (CP, TP, ATP, Prota, Prosem, KKTP)",
  modulai: "Generator Modul Ajar AI (Deep Learning)",
  asistenai: "Asisten AI Pendamping Guru",
  lkpdai: "Generator LKPD AI (Lembar Kerja Peserta Didik)",
  ailainnya: "Generator AI Lainnya",
  laporan: "Pusat Cetak Laporan PDF",
  pengaturan: "Pengaturan & Profil Sekolah",
  resetdb: "Kosongkan & Hapus Seluruh Isi Database"
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onToggleSidebar,
  isDarkMode,
  onSetDarkMode,
  onToggleDarkMode,
  isConnected,
  config,
  onLogout,
  onOpenWelcomeGuide
}) => {
  const handleSelectDark = (dark: boolean) => {
    if (onSetDarkMode) {
      onSetDarkMode(dark);
    } else if (onToggleDarkMode) {
      onToggleDarkMode();
    }
  };

  return (
    <header className="sticky top-0 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between px-3 sm:px-4 lg:px-6 shrink-0 z-30 transition-colors shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Left: Hamburger menu + Brand Logo */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 transition-all border border-transparent dark:hover:border-white/10 flex items-center justify-center shrink-0 cursor-pointer"
          aria-label="Buka Laci Samping"
          title="Buka Navigasi (Drawer Menu)"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 min-w-0 shrink-0">
          {/* Logo with Cyber Glow */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-slate-950 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/40 shadow-inner">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 transition-transform group-hover:scale-110" />
            </div>
          </div>

          <div className="flex flex-col min-w-0 leading-tight justify-center shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-display font-extrabold text-sm sm:text-base lg:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 dark:from-white dark:via-slate-100 dark:to-cyan-200 bg-clip-text text-transparent block whitespace-nowrap">
                EduFutura AI
              </span>
              <span className="hidden min-[380px]:inline-flex items-center px-1.5 py-0.2 rounded-md bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30">
                PRO 3D
              </span>
            </div>
            {activeTab !== "dashboard" && TAB_TITLES[activeTab] ? (
              <span className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400 font-medium truncate max-w-[120px] sm:max-w-xs block">
                {TAB_TITLES[activeTab]}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden min-[480px]:block">
                Administrasi Guru Masa Depan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0 ml-1">
        {/* Real-time Firebase Radar Pulsar */}
        <div
          className={`hidden min-[520px]:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold shadow-xs transition-colors shrink-0 ${
            isConnected
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
          </span>
          <span>{isConnected ? "CLOUD_SYNCED" : "CONNECTING..."}</span>
        </div>

        {/* Teacher profile cyber-pill */}
        <div className="flex items-center space-x-1.5 bg-slate-100/80 dark:bg-slate-900/80 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span 
            className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[85px] sm:max-w-[150px] truncate" 
            title={config.Nama_Guru || "Guru"}
          >
            {config.Nama_Guru || "Drs. Yefri Haryanto, M.Pd."}
          </span>
        </div>

        {/* Welcome Guide Button */}
        {onOpenWelcomeGuide && (
          <button
            type="button"
            onClick={onOpenWelcomeGuide}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 transition-all text-xs font-bold shrink-0 cursor-pointer active:scale-95"
            title="Buka Panduan Pengguna"
            aria-label="Buka Panduan Guru"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="hidden sm:inline">Panduan</span>
          </button>
        )}

        {/* Futuristic Cyber Theme Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-white/10 space-x-0.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectDark(false)}
            className={`p-1.5 sm:p-1.5 rounded-lg transition-all flex items-center justify-center min-w-[30px] min-h-[30px] sm:min-w-[34px] sm:min-h-[34px] cursor-pointer ${
              !isDarkMode
                ? "bg-amber-400 text-slate-950 shadow-xs font-bold scale-105"
                : "text-slate-400 hover:text-amber-400 active:scale-95"
            }`}
            title="Aktifkan Tema Terang (Light Mode)"
            aria-label="Tema Terang"
          >
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSelectDark(true)}
            className={`p-1.5 sm:p-1.5 rounded-lg transition-all flex items-center justify-center min-w-[30px] min-h-[30px] sm:min-w-[34px] sm:min-h-[34px] cursor-pointer ${
              isDarkMode
                ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)] font-bold scale-105"
                : "text-slate-400 hover:text-violet-400 active:scale-95"
            }`}
            title="Aktifkan Cyber Dark Mode"
            aria-label="Tema Gelap"
          >
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
