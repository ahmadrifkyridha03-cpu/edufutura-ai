import React from "react";
import { 
  PieChart, 
  Users, 
  IdCard, 
  BookOpen, 
  Clock, 
  ClipboardCheck, 
  Star, 
  Calendar, 
  HeartHandshake, 
  Wand2, 
  Bot, 
  Sparkles,
  Printer, 
  Settings, 
  GraduationCap,
  Trash2,
  X,
  FileCheck,
  Download,
  Globe,
  Award,
  Zap,
  Cpu
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen
}) => {
  const navItems = [
    {
      group: "COMMAND CENTER",
      items: [
        { id: "dashboard", label: "Dashboard", icon: PieChart },
        { id: "siswa", label: "Kelola Siswa", icon: Users },
        { id: "kartu", label: "Cetak Kartu QR", icon: IdCard },
        { id: "mapel", label: "Kelola Mapel", icon: BookOpen },
      ]
    },
    {
      group: "OPERASIONAL AKADEMIK",
      items: [
        { id: "jadwal", label: "Jadwal Mengajar", icon: Clock },
        { id: "absensi", label: "Input Absensi & QR", icon: ClipboardCheck },
        { id: "penilaian", label: "Input Penilaian", icon: Star },
        { id: "raport", label: "Cetak Rapor Siswa", icon: Award, highlight: true },
        { id: "agenda", label: "Agenda Mengajar", icon: Calendar },
        { id: "bimbingan", label: "Bimbingan Guru Wali", icon: HeartHandshake },
        { id: "downloadperangkat", label: "Download Perangkat Ajar", icon: Download },
      ]
    },
    {
      group: "NEURAL AI SUITE",
      items: [
        { id: "perangkat_kbc", label: "Perangkat Ajar KBC", icon: HeartHandshake, highlight: true },
        { id: "perangkat_ai", label: "Generator Perangkat AI", icon: FileCheck, highlight: true },
        { id: "modulai", label: "Modul Ajar Deep Learning", icon: Wand2, highlight: true },
        { id: "asistenai", label: "Asisten Guru AI", icon: Bot, highlight: true },
        { id: "lkpdai", label: "Generator LKPD AI", icon: Sparkles, highlight: true },
        { id: "ailainnya", label: "Generator AI Lainnya", icon: Globe, highlight: true },
      ]
    },
    {
      group: "SYSTEM CONFIG",
      items: [
        { id: "laporan", label: "Pusat Laporan PDF", icon: Printer },
        { id: "pengaturan", label: "Pengaturan & Profil", icon: Settings },
        { id: "resetdb", label: "Hapus Isi Database", icon: Trash2, dangerous: true },
      ]
    }
  ];

  return (
    <>
      {/* Drawer backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/75 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Cyber Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950/95 text-slate-100 flex flex-col shadow-2xl transition-transform duration-300 rounded-r-3xl border-r border-white/10 backdrop-blur-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Header with Cyber Shimmer */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0 bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-tr from-cyan-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display font-extrabold text-base tracking-tight text-white block leading-none">
                  EduFutura AI
                </span>
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                  v3.8
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Sistem Guru Digital</span>
            </div>
          </div>

          <button 
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar pb-safe">
          {navItems.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 mb-1.5 flex items-center justify-between">
                <p className="text-[9.5px] font-mono font-bold text-cyan-400/80 uppercase tracking-widest">
                  {group.group}
                </p>
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent ml-2" />
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.98] min-h-[42px] cursor-pointer group relative ${
                      isActive
                        ? (item as any).dangerous
                          ? "bg-red-600/90 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] font-bold border border-red-400/40"
                          : item.highlight
                          ? "bg-gradient-to-r from-violet-600/90 to-cyan-600/90 text-white shadow-[0_0_18px_rgba(139,92,246,0.4)] font-bold border border-violet-400/40"
                          : "bg-slate-800/90 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold border border-cyan-500/40"
                        : (item as any).dangerous
                        ? "text-red-400 hover:bg-red-950/40 hover:text-red-300"
                        : item.highlight
                        ? "text-slate-300 hover:bg-white/5 hover:text-violet-300 hover:border-violet-500/20 border border-transparent"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:border-white/5 border border-transparent"
                    }`}
                  >
                    {/* Active Left Neon Marker Strip */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
                    )}

                    <Icon 
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive 
                          ? "text-white" 
                          : (item as any).dangerous 
                          ? "text-red-400" 
                          : item.highlight 
                          ? "text-violet-400 group-hover:text-violet-300" 
                          : "text-slate-400 group-hover:text-slate-200"
                      }`} 
                    />
                    <span className="truncate">{item.label}</span>

                    {item.highlight && (
                      <span className="ml-auto text-[8.5px] font-mono px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 font-bold border border-violet-500/40 shrink-0 flex items-center space-x-0.5">
                        <Zap className="w-2.5 h-2.5 text-violet-400" />
                        <span>AI</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Futuristic Mission Control Footer */}
        <div className="p-3.5 border-t border-white/10 bg-slate-950/90 flex flex-col space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>CORE_ENGINE</span>
            </span>
            <span className="text-emerald-400 font-semibold">OPTIMAL</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 h-full w-[85%] rounded-full animate-pulse" />
          </div>
          <p className="text-[9px] text-slate-500 font-mono text-center pt-0.5">
            EduFutura Digital Architecture &copy; 2026
          </p>
        </div>
      </aside>
    </>
  );
};
