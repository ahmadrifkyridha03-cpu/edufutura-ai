import React, { useState } from "react";
import {
  Users,
  School,
  BookOpen,
  ClipboardCheck,
  Wand2,
  Calendar,
  Star,
  TrendingUp,
  QrCode,
  GraduationCap,
  BookMarked,
  HeartHandshake,
  Bot,
  FileText,
  Settings,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  Calculator,
  Compass,
  Cpu,
  Zap,
  Activity
} from "lucide-react";
import { Siswa, Mapel, LogAbsensi, DataNilai, Jadwal } from "../types";
import { AnalisisPerkembanganSiswa } from "./AnalisisPerkembanganSiswa";
import { RincianNilaiSiswaModal } from "./RincianNilaiSiswaModal";
import { RankingSiswaDashboard } from "./RankingSiswaDashboard";
import { HeroHologramOrb } from "./3d/HeroHologramOrb";
import { Card3DTilt } from "./3d/Card3DTilt";

interface DashboardViewProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  absensiList: LogAbsensi[];
  nilaiList: DataNilai[];
  jadwalList: Jadwal[];
  onNavigate: (tab: string) => void;
  onOpenWelcomeGuide?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  siswaList,
  mapelList,
  absensiList,
  nilaiList,
  jadwalList,
  onNavigate,
  onOpenWelcomeGuide
}) => {
  const [isRincianModalOpen, setIsRincianModalOpen] = useState(false);
  const [selectedRincianSiswaId, setSelectedRincianSiswaId] = useState<string | null>(null);
  const [selectedRincianMapel, setSelectedRincianMapel] = useState<string>("ALL");

  const handleOpenRincianModal = (siswaId: string, mapel?: string) => {
    setSelectedRincianSiswaId(siswaId);
    if (mapel) {
      setSelectedRincianMapel(mapel);
    }
    setIsRincianModalOpen(true);
  };

  // Stat calculations
  const totalSiswa = siswaList.length;
  const kelasSet = new Set(siswaList.map((s) => s.kelas).filter(Boolean));
  const totalKelas = kelasSet.size;
  const totalMapel = mapelList.length;

  // Today's attendance percentage
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAbsensi = absensiList.filter((a) => a.waktu === todayStr || a.tanggal === todayStr);
  let attendancePercentage = 0;
  if (todayAbsensi.length > 0) {
    const hadirCount = todayAbsensi.filter((a) => a.status === "Hadir").length;
    attendancePercentage = Math.round((hadirCount / todayAbsensi.length) * 100);
  }

  // Calculate 7-day attendance trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const attendanceTrend = last7Days.map((date) => {
    const dayRecords = absensiList.filter((a) => a.waktu === date || a.tanggal === date);
    if (dayRecords.length === 0) return { date: date.slice(5), pct: 0 };
    const hadir = dayRecords.filter((a) => a.status === "Hadir").length;
    return {
      date: date.slice(5),
      pct: Math.round((hadir / dayRecords.length) * 100)
    };
  });

  // Calculate Average Grade per Mapel
  const subjectAverages = mapelList.map((m) => {
    const grades = nilaiList.filter((n) => n.mapel === m.namaMapel && n.nilai !== "" && typeof n.nilai === "number");
    if (grades.length === 0) return { name: m.namaMapel, avg: 0, count: 0 };
    const sum = grades.reduce((acc, curr) => acc + (curr.nilai as number), 0);
    return {
      name: m.namaMapel,
      avg: Math.round(sum / grades.length),
      count: grades.length
    };
  });

  // Quick Access Menu Cards
  const menuCards = [
    {
      id: "siswa",
      title: "Kelola Master Siswa",
      desc: "Olah data seluruh siswa, NISN, import Excel, edit & hapus data.",
      icon: Users,
      badge: "Master Data",
      glowColor: "cyan" as const,
      color: "bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30"
    },
    {
      id: "kartu",
      title: "Cetak Kartu & QR Code",
      desc: "Cetak kartu pelajar resmi dengan QR Code presensi terintegrasi.",
      icon: QrCode,
      badge: "Kartu Pelajar",
      glowColor: "emerald" as const,
      color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30"
    },
    {
      id: "mapel",
      title: "Kelola Mata Pelajaran",
      desc: "Atur daftar mapel, semester, dan alokasi jam mengajar harian.",
      icon: BookOpen,
      badge: "Kurikulum",
      glowColor: "violet" as const,
      color: "bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/30"
    },
    {
      id: "jadwal",
      title: "Jadwal Mengajar",
      desc: "Kelola jadwal tatap muka kelas, jam pelajaran, dan ruang kelas.",
      icon: Calendar,
      badge: "Jadwal",
      glowColor: "cyan" as const,
      color: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/30"
    },
    {
      id: "absensi",
      title: "Scan & Input Absensi",
      desc: "Pencatatan presensi harian manual & scan QR Code kamera otomatis.",
      icon: ClipboardCheck,
      badge: "Presensi",
      glowColor: "amber" as const,
      color: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30"
    },
    {
      id: "penilaian",
      title: "Input Penilaian & Leger",
      desc: "Rekap nilai harian, UTS, UAS, kalkulasi otomatis & leger siswa.",
      icon: GraduationCap,
      badge: "Nilai & Rapor",
      glowColor: "violet" as const,
      color: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/30"
    },
    {
      id: "raport",
      title: "Cetak Rapor Merdeka",
      desc: "Cetak Laporan Hasil Belajar resmi per siswa & cetak massal 1 kelas.",
      icon: GraduationCap,
      badge: "Rapor Resmi",
      glowColor: "cyan" as const,
      color: "bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30"
    },
    {
      id: "agenda",
      title: "Agenda Mengajar Guru",
      desc: "Jurnal harian KBM, keterlaksanaan materi & catatan kehadiran.",
      icon: BookMarked,
      badge: "Jurnal KBM",
      glowColor: "cyan" as const,
      color: "bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/30"
    },
    {
      id: "bimbingan",
      title: "Bimbingan Guru Wali",
      desc: "Pencatatan konseling, apresiasi siswa & tindak lanjut orang tua.",
      icon: HeartHandshake,
      badge: "Guru Wali",
      glowColor: "violet" as const,
      color: "bg-pink-500/10 text-pink-500 dark:text-pink-400 border border-pink-500/30"
    },
    {
      id: "modulai",
      title: "Modul Ajar Deep Learning AI",
      desc: "Generator RPP Deep Learning Kurikulum Merdeka (hingga 5 pertemuan).",
      icon: Wand2,
      badge: "Neural AI",
      glowColor: "amber" as const,
      color: "bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/40"
    },
    {
      id: "asistenai",
      title: "Asisten Chatbot Guru AI",
      desc: "Konsultan pedagogi AI, pembuat soal HOTS, & draf narasi rapor.",
      icon: Bot,
      badge: "Asisten AI",
      glowColor: "violet" as const,
      color: "bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/30"
    },
    {
      id: "laporan",
      title: "Pusat Laporan PDF",
      desc: "Cetak rekapitulasi presensi, leger nilai & jurnal resmi ke PDF.",
      icon: FileText,
      badge: "Dokumen Resmi",
      glowColor: "cyan" as const,
      color: "bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30"
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-7 max-w-5xl mx-auto w-full select-none">
      {/* 3D FUTURISTIC HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 border border-cyan-500/30 dark:border-white/10 p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        {/* Ambient background energy grid */}
        <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-bold tracking-wider">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>EDUFUTURA 3D NEURAL OPERATING SYSTEM</span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
              Selamat Bertugas,{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-violet-300 to-amber-300 bg-clip-text text-transparent">
                Pendidik Masa Depan
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Kelola seluruh administrasi sekolah dalam hitungan detik. Hasilkan Modul Ajar Deep Learning, presensi QR otomatis, dan rapor Kurikulum Merdeka resmi dengan bantuan kecerdasan buatan.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
              <button
                onClick={() => onNavigate("modulai")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-display font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
              >
                <Wand2 className="w-4 h-4" />
                <span>Buat Modul Ajar AI</span>
              </button>

              <button
                onClick={() => onNavigate("absensi")}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 font-display font-bold text-xs sm:text-sm border border-cyan-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Scan QR Presensi</span>
              </button>

              {onOpenWelcomeGuide && (
                <button
                  type="button"
                  onClick={onOpenWelcomeGuide}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-sans font-semibold text-xs border border-white/10 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Panduan</span>
                </button>
              )}
            </div>
          </div>

          {/* 3D Interactive AI Hologram Core */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <HeroHologramOrb size={240} className="scale-90 sm:scale-100" />
            <p className="text-[10px] font-mono text-cyan-400/80 tracking-widest mt-1">
              ORBITAL CORE: REACTIVE 3D
            </p>
          </div>
        </div>
      </div>

      {/* 4 OVERVIEW STAT CARDS WITH 3D TILT PARALLAX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 dashboard-stats-grid">
        {/* Card 1: Total Siswa */}
        <Card3DTilt glowColor="cyan" className="glass-card p-4 sm:p-5 flex items-center space-x-4 cursor-pointer" onClick={() => onNavigate("siswa")}>
          <div className="w-13 h-13 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-mono font-semibold text-cyan-400/80 uppercase tracking-wider block">
              TOTAL SISWA
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
              {totalSiswa}
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block">
              Siswa terdaftar aktif
            </span>
          </div>
        </Card3DTilt>

        {/* Card 2: Total Kelas */}
        <Card3DTilt glowColor="violet" className="glass-card p-4 sm:p-5 flex items-center space-x-4 cursor-pointer" onClick={() => onNavigate("siswa")}>
          <div className="w-13 h-13 rounded-2xl bg-violet-500/15 text-violet-400 flex items-center justify-center border border-violet-500/30 shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
            <School className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-mono font-semibold text-violet-400/80 uppercase tracking-wider block">
              ROMBEL KELAS
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
              {totalKelas}
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block">
              Kelas aktif diampu
            </span>
          </div>
        </Card3DTilt>

        {/* Card 3: Mata Pelajaran */}
        <Card3DTilt glowColor="emerald" className="glass-card p-4 sm:p-5 flex items-center space-x-4 cursor-pointer" onClick={() => onNavigate("mapel")}>
          <div className="w-13 h-13 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-mono font-semibold text-emerald-400/80 uppercase tracking-wider block">
              MATA PELAJARAN
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
              {totalMapel}
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block">
              Kurikulum terkonfigurasi
            </span>
          </div>
        </Card3DTilt>

        {/* Card 4: Kehadiran Hari Ini */}
        <Card3DTilt glowColor="amber" className="glass-card p-4 sm:p-5 flex items-center space-x-4 cursor-pointer" onClick={() => onNavigate("absensi")}>
          <div className="w-13 h-13 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-mono font-semibold text-amber-400/80 uppercase tracking-wider block">
              HADIR HARI INI
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
              {attendancePercentage}%
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block">
              Dari total presensi harian
            </span>
          </div>
        </Card3DTilt>
      </div>

      {/* QUICK ACCESS MODUL CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
              Pusat Kendali Administrasi & AI
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
            12 MODUL UTAMA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {menuCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card3DTilt
                key={item.id}
                glowColor={item.glowColor}
                onClick={() => onNavigate(item.id)}
                className="glass-card p-4 sm:p-5 flex flex-col justify-between space-y-3.5 cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 uppercase tracking-wider">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform pt-1">
                  <span>Buka Modul</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </div>
              </Card3DTilt>
            );
          })}
        </div>
      </div>

      {/* STUDENT LEADERBOARD & RANKING SECTION */}
      <RankingSiswaDashboard
        siswaList={siswaList}
        mapelList={mapelList}
        nilaiList={nilaiList}
        onOpenDetailModal={handleOpenRincianModal}
        onNavigateToPenilaian={() => onNavigate("penilaian")}
        onNavigateToRaport={() => onNavigate("raport")}
      />

      {/* ANALISIS PERKEMBANGAN SISWA */}
      <AnalisisPerkembanganSiswa
        siswaList={siswaList}
        mapelList={mapelList}
        nilaiList={nilaiList}
        onNavigateToPenilaian={() => onNavigate("penilaian")}
      />

      {/* CHARTS: ATTENDANCE TREND & SUBJECT AVERAGES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Trend Chart */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm">
                Tren Kehadiran (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Persentase kehadiran harian siswa</p>
            </div>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-slate-200 dark:border-white/10">
            {attendanceTrend.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-cyan-300 group-hover:text-cyan-400 transition-colors">
                  {item.pct}%
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-t-lg h-28 flex items-end overflow-hidden p-0.5">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-500 group-hover:from-violet-600 group-hover:to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    style={{ height: `${Math.max(item.pct, 6)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-full">
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Average Chart */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm">
                Rata-Rata Nilai per Mapel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Akumulasi akademik kelas berjalan</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedRincianSiswaId(siswaList[0]?.id || null);
                setIsRincianModalOpen(true);
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-600 dark:text-violet-300 border border-violet-500/30 transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
              title="Buka Modal Rincian Nilai per Siswa"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Rincian Siswa</span>
            </button>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {subjectAverages.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Belum ada data nilai mata pelajaran.</p>
            ) : (
              subjectAverages.map((sub, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{sub.name}</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{sub.avg} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-violet-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      style={{ width: `${Math.min(sub.avg, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Teaching Schedule Preview */}
      <div className="glass-card p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm">
              Jadwal Mengajar Terdekat
            </h3>
          </div>
          <button
            onClick={() => onNavigate("jadwal")}
            className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer flex items-center space-x-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {jadwalList.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Belum ada jadwal mengajar yang ditambahkan.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {jadwalList.slice(0, 3).map((j) => (
              <div
                key={j.id}
                className="p-3.5 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/10 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  <span className="font-display">{j.hari}</span>
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                    {j.jam}
                  </span>
                </div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{j.mapel}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kelas: {j.kelas}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Rincian Nilai Siswa */}
      <RincianNilaiSiswaModal
        isOpen={isRincianModalOpen}
        onClose={() => setIsRincianModalOpen(false)}
        siswaId={selectedRincianSiswaId}
        siswaList={siswaList}
        mapelList={mapelList}
        nilaiList={nilaiList}
        initialMapel={selectedRincianMapel}
        onNavigateToPenilaian={() => onNavigate("penilaian")}
        onNavigateToRaport={() => onNavigate("raport")}
        onSelectSiswaId={(newId) => setSelectedRincianSiswaId(newId)}
      />
    </div>
  );
};
