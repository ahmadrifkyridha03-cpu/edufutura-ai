import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Calculator,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
  Printer,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  Scale,
  FileSpreadsheet
} from "lucide-react";
import { Siswa, Mapel, DataNilai } from "../types";
import { categorizeJenisPenilaian, hitungNilaiAkhirSiswa } from "./InputPenilaianView";

interface RincianNilaiSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaId: string | null;
  siswaList: Siswa[];
  mapelList: Mapel[];
  nilaiList: DataNilai[];
  initialMapel?: string;
  onNavigateToPenilaian?: () => void;
  onNavigateToRaport?: () => void;
  onSelectSiswaId?: (newId: string) => void;
}

export const RincianNilaiSiswaModal: React.FC<RincianNilaiSiswaModalProps> = ({
  isOpen,
  onClose,
  siswaId,
  siswaList,
  mapelList,
  nilaiList,
  initialMapel = "ALL",
  onNavigateToPenilaian,
  onNavigateToRaport,
  onSelectSiswaId
}) => {
  // Local current student selection so modal can cycle through students easily
  const [currentSiswaId, setCurrentSiswaId] = useState<string>("");
  const [selectedMapel, setSelectedMapel] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"rincian" | "semua_mapel">("rincian");

  useEffect(() => {
    if (siswaId) {
      setCurrentSiswaId(siswaId);
    } else if (siswaList.length > 0) {
      setCurrentSiswaId(siswaList[0].id);
    }
  }, [siswaId, siswaList]);

  useEffect(() => {
    if (initialMapel && initialMapel !== "ALL") {
      setSelectedMapel(initialMapel);
    } else if (mapelList.length > 0) {
      setSelectedMapel(mapelList[0].namaMapel);
    }
  }, [initialMapel, mapelList]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Current student object
  const currentSiswa = useMemo(() => {
    return siswaList.find((s) => s.id === currentSiswaId) || null;
  }, [siswaList, currentSiswaId]);

  // Navigation indexes for Next / Prev student
  const currentIndex = useMemo(() => {
    return siswaList.findIndex((s) => s.id === currentSiswaId);
  }, [siswaList, currentSiswaId]);

  const handlePrevStudent = () => {
    if (currentIndex > 0) {
      const prev = siswaList[currentIndex - 1];
      setCurrentSiswaId(prev.id);
      if (onSelectSiswaId) onSelectSiswaId(prev.id);
    }
  };

  const handleNextStudent = () => {
    if (currentIndex < siswaList.length - 1) {
      const next = siswaList[currentIndex + 1];
      setCurrentSiswaId(next.id);
      if (onSelectSiswaId) onSelectSiswaId(next.id);
    }
  };

  // Nilai records for this student
  const studentAllGrades = useMemo(() => {
    if (!currentSiswa) return [];
    return nilaiList.filter(
      (n) =>
        n.idSiswa === currentSiswa.id ||
        (n.namaSiswa && currentSiswa.nama && n.namaSiswa.trim().toLowerCase() === currentSiswa.nama.trim().toLowerCase())
    );
  }, [nilaiList, currentSiswa]);

  // Mapel options available in the school
  const allMapelNames = useMemo(() => {
    const names = Array.from(new Set(mapelList.map((m) => m.namaMapel).filter(Boolean)));
    if (names.length === 0) {
      // Fallback from existing grades if mapelList empty
      const fromGrades = Array.from(new Set(studentAllGrades.map((g) => g.mapel).filter(Boolean)));
      return fromGrades.length > 0 ? fromGrades : ["Umum"];
    }
    return names;
  }, [mapelList, studentAllGrades]);

  // Determine active subject name for detail view
  const activeMapelName = useMemo(() => {
    if (selectedMapel !== "ALL" && allMapelNames.includes(selectedMapel)) {
      return selectedMapel;
    }
    return allMapelNames[0] || "Semua Mapel";
  }, [selectedMapel, allMapelNames]);

  // Nilai records for the active subject
  const currentMapelGrades = useMemo(() => {
    return studentAllGrades.filter((g) => g.mapel === activeMapelName);
  }, [studentAllGrades, activeMapelName]);

  // Separate grades by category: Sumatif, UTS, UAS
  const sumatifItems = useMemo(() => {
    return currentMapelGrades
      .filter(
        (g) =>
          categorizeJenisPenilaian(g.jenis) === "sumatif" &&
          g.nilai !== "" &&
          g.nilai !== undefined &&
          !isNaN(Number(g.nilai))
      )
      .sort((a, b) => (a.waktu || "").localeCompare(b.waktu || ""));
  }, [currentMapelGrades]);

  const utsItem = useMemo(() => {
    return currentMapelGrades.find(
      (g) =>
        categorizeJenisPenilaian(g.jenis) === "uts" &&
        g.nilai !== "" &&
        g.nilai !== undefined &&
        !isNaN(Number(g.nilai))
    );
  }, [currentMapelGrades]);

  const uasItem = useMemo(() => {
    return currentMapelGrades.find(
      (g) =>
        categorizeJenisPenilaian(g.jenis) === "uas" &&
        g.nilai !== "" &&
        g.nilai !== undefined &&
        !isNaN(Number(g.nilai))
    );
  }, [currentMapelGrades]);

  // Calculate scores and contributions
  const calculations = useMemo(() => {
    const sumatifScores = sumatifItems.map((g) => Number(g.nilai));
    const avgSumatif =
      sumatifScores.length > 0
        ? Number((sumatifScores.reduce((a, b) => a + b, 0) / sumatifScores.length).toFixed(1))
        : null;

    const valUts = utsItem ? Number(utsItem.nilai) : null;
    const valUas = uasItem ? Number(uasItem.nilai) : null;

    // Mathematical contributions based on user rules:
    // Sumatif: 50%
    // UTS: 35%
    // UAS: 15%
    const kontribusiSumatif = avgSumatif !== null ? Number((avgSumatif * 0.50).toFixed(2)) : 0;
    const kontribusiUts = valUts !== null ? Number((valUts * 0.35).toFixed(2)) : 0;
    const kontribusiUas = valUas !== null ? Number((valUas * 0.15).toFixed(2)) : 0;

    let nilaiAkhir: number | null = null;
    if (avgSumatif !== null || valUts !== null || valUas !== null) {
      nilaiAkhir = Number((kontribusiSumatif + kontribusiUts + kontribusiUas).toFixed(1));
    }

    // Predikat & Keterangan
    let predikat = "-";
    let predikatLabel = "Belum Ada Nilai";
    let predikatColor = "text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300";

    if (nilaiAkhir !== null) {
      if (nilaiAkhir >= 88) {
        predikat = "A";
        predikatLabel = "Sangat Baik (Tercapai Maksimal)";
        predikatColor = "text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-300 border-blue-300";
      } else if (nilaiAkhir >= 78) {
        predikat = "B";
        predikatLabel = "Baik (Tercapai)";
        predikatColor = "text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300";
      } else if (nilaiAkhir >= 70) {
        predikat = "C";
        predikatLabel = "Cukup (Perlu Pemantapan)";
        predikatColor = "text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 border-amber-300";
      } else {
        predikat = "D";
        predikatLabel = "Perlu Bimbingan Khusus (Remedial)";
        predikatColor = "text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 border-rose-300";
      }
    }

    const isLulusKkm = nilaiAkhir !== null && nilaiAkhir >= 75;

    return {
      avgSumatif,
      valUts,
      valUas,
      kontribusiSumatif,
      kontribusiUts,
      kontribusiUas,
      nilaiAkhir,
      predikat,
      predikatLabel,
      predikatColor,
      isLulusKkm,
      sumatifCount: sumatifScores.length
    };
  }, [sumatifItems, utsItem, uasItem]);

  // Multi-subject overview table for this student
  const multiMapelSummary = useMemo(() => {
    return allMapelNames.map((mapelName) => {
      const gradesForThisMapel = studentAllGrades.filter((g) => g.mapel === mapelName);
      const res = hitungNilaiAkhirSiswa(gradesForThisMapel);
      return {
        namaMapel: mapelName,
        avgSumatif: res.avgSumatif,
        valUts: res.valUts,
        valUas: res.valUas,
        nilaiAkhir: res.nilaiAkhir,
        predikat: res.predikat,
        keterangan: res.keterangan
      };
    });
  }, [allMapelNames, studentAllGrades]);

  if (!isOpen || !currentSiswa) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rincian-nilai-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
                <Scale className="w-3 h-3 text-amber-300" />
                Transparansi Pembobotan Nilai
              </span>
              <span className="text-[11px] font-bold text-amber-300">
                Sumatif 50% • UTS 35% • UAS 15%
              </span>
            </div>
            <h2 id="rincian-nilai-title" className="text-lg sm:text-xl font-black flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-300" />
              <span>Rincian & Rekap Nilai Siswa</span>
            </h2>
          </div>

          {/* Quick Student Switcher & Close */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {/* Prev Student */}
            <button
              type="button"
              onClick={handlePrevStudent}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
              title="Siswa Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Student */}
            <button
              type="button"
              onClick={handleNextStudent}
              disabled={currentIndex >= siswaList.length - 1}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
              title="Siswa Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Cetak Rincian Nilai Siswa"
            >
              <Printer className="w-5 h-5" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Tutup Modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STUDENT INFO SUB-BAR */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              {currentSiswa.nama.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
                  {currentSiswa.nama}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  Kelas {currentSiswa.kelas}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                NISN: {currentSiswa.nisn || "-"} • No. Urut: {currentIndex + 1} dari {siswaList.length}
              </p>
            </div>
          </div>

          {/* Quick Select Student Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-500 hidden sm:inline">Ganti Siswa:</label>
            <select
              value={currentSiswaId}
              onChange={(e) => {
                setCurrentSiswaId(e.target.value);
                if (onSelectSiswaId) onSelectSiswaId(e.target.value);
              }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[200px]"
            >
              {siswaList.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  {idx + 1}. {s.nama} ({s.kelas})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NAVIGATION TABS (Detail Mapel vs Semua Mapel) */}
        <div className="px-4 sm:px-6 pt-3 pb-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab("rincian")}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === "rincian"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Transparansi Bobot Mapel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("semua_mapel")}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === "semua_mapel"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Rekap Seluruh Mapel ({multiMapelSummary.length})</span>
            </button>
          </div>

          {/* Subject Selector (If on Detail Tab) */}
          {activeTab === "rincian" && (
            <div className="flex items-center space-x-2 pb-2 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Mata Pelajaran:
              </span>
              <select
                value={activeMapelName}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {allMapelNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar grow">
          {activeTab === "rincian" ? (
            <>
              {/* HERO SCORE & TRANSPARENCY CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900 border border-blue-200/80 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Final Score Big Display */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-black tracking-wider uppercase text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Hasil Kalkulasi Nilai Akhir ({activeMapelName})
                    </span>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                        {calculations.nilaiAkhir !== null ? calculations.nilaiAkhir : "-"}
                      </span>
                      <span className="text-sm font-bold text-slate-400">/ 100</span>
                      {calculations.predikat !== "-" && (
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-xl border uppercase tracking-wider ${calculations.predikatColor}`}
                        >
                          Predikat {calculations.predikat}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {calculations.predikatLabel}
                    </p>
                  </div>

                  {/* Right: KKM status & quick stats */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-right min-w-[130px]">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Target KKM
                      </span>
                      <span className="text-sm font-black font-mono text-slate-700 dark:text-slate-200">
                        75.0 Poin
                      </span>
                      <span
                        className={`text-[10px] font-extrabold block mt-0.5 ${
                          calculations.isLulusKkm
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {calculations.nilaiAkhir === null
                          ? "Belum ada nilai"
                          : calculations.isLulusKkm
                          ? "✓ Lulus Target KKM"
                          : "⚠ Belum Capai KKM"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-right min-w-[130px]">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Total Asesmen
                      </span>
                      <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                        {currentMapelGrades.length} Kali Diinput
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                        {calculations.sumatifCount} Sumatif • {utsItem ? "1" : "0"} UTS • {uasItem ? "1" : "0"} UAS
                      </span>
                    </div>
                  </div>
                </div>

                {/* PROGRESS CONTRIBUTIONS BAR (STACKED BAR) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-blue-600" />
                      Komposisi Pembagian Kontribusi ke Nilai Akhir:
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      Total: {calculations.nilaiAkhir !== null ? calculations.nilaiAkhir : 0} Poin
                    </span>
                  </div>

                  {/* Visual Stacked Progress Bar */}
                  <div className="h-6 w-full bg-slate-200 dark:bg-slate-700/60 rounded-xl overflow-hidden flex p-1 gap-1">
                    {/* Sumatif contribution portion */}
                    <div
                      className="bg-blue-600 hover:bg-blue-500 transition-all rounded-lg flex items-center justify-center text-[10px] font-black text-white px-1 truncate relative group cursor-pointer"
                      style={{
                        width: `${Math.max(
                          (calculations.kontribusiSumatif / (calculations.nilaiAkhir || 100)) * 100,
                          calculations.kontribusiSumatif > 0 ? 15 : 0
                        )}%`
                      }}
                      title={`Sumatif (50%): ${calculations.kontribusiSumatif} poin`}
                    >
                      <span>Sumatif: +{calculations.kontribusiSumatif}</span>
                    </div>

                    {/* UTS contribution portion */}
                    <div
                      className="bg-purple-600 hover:bg-purple-500 transition-all rounded-lg flex items-center justify-center text-[10px] font-black text-white px-1 truncate relative group cursor-pointer"
                      style={{
                        width: `${Math.max(
                          (calculations.kontribusiUts / (calculations.nilaiAkhir || 100)) * 100,
                          calculations.kontribusiUts > 0 ? 15 : 0
                        )}%`
                      }}
                      title={`UTS (35%): ${calculations.kontribusiUts} poin`}
                    >
                      <span>UTS: +{calculations.kontribusiUts}</span>
                    </div>

                    {/* UAS contribution portion */}
                    <div
                      className="bg-amber-500 hover:bg-amber-400 transition-all rounded-lg flex items-center justify-center text-[10px] font-black text-slate-950 px-1 truncate relative group cursor-pointer"
                      style={{
                        width: `${Math.max(
                          (calculations.kontribusiUas / (calculations.nilaiAkhir || 100)) * 100,
                          calculations.kontribusiUas > 0 ? 15 : 0
                        )}%`
                      }}
                      title={`UAS (15%): ${calculations.kontribusiUas} poin`}
                    >
                      <span>UAS: +{calculations.kontribusiUas}</span>
                    </div>
                  </div>

                  {/* Legend underneath bar */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold text-slate-500 pt-0.5 gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                      <span>Sumatif (50% maks 50 pt): </span>
                      <strong className="text-blue-600 dark:text-blue-400 font-mono">
                        +{calculations.kontribusiSumatif} pt
                      </strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                      <span>UTS (35% maks 35 pt): </span>
                      <strong className="text-purple-600 dark:text-purple-400 font-mono">
                        +{calculations.kontribusiUts} pt
                      </strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span>UAS (15% maks 15 pt): </span>
                      <strong className="text-amber-600 dark:text-amber-400 font-mono">
                        +{calculations.kontribusiUas} pt
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* TRANSPARENT MATHEMATICAL FORMULA EXPLANATION */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-300">
                  <Info className="w-4 h-4 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Perhitungan Matematis Nilai Akhir (Transparansi Kurikulum Merdeka)
                  </h4>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900/50 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div className="text-slate-500 dark:text-slate-400 font-sans text-[11px] font-bold">
                    Rumus Resmi:
                  </div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    Nilai Akhir (NA) = (Rata-rata Sumatif × 50%) + (Nilai UTS × 35%) + (Nilai UAS × 15%)
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-sans text-[11px] font-bold pt-1">
                    Substitusi Angka Nilai Siswa:
                  </div>
                  <div className="leading-relaxed">
                    NA = ({calculations.avgSumatif ?? "0"} × 0.50) + ({calculations.valUts ?? "0"} × 0.35) + ({calculations.valUas ?? "0"} × 0.15)
                    <br />
                    NA = {calculations.kontribusiSumatif} + {calculations.kontribusiUts} + {calculations.kontribusiUas}
                    <br />
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      NA = {calculations.nilaiAkhir ?? "0"} &rarr; Predikat {calculations.predikat}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 TIERS CARDS: SUMATIF (50%), UTS (35%), UAS (15%) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. KARTU SUMATIF LINGKUP MATERI (50%) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        Bobot 50%
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {sumatifItems.length} Materi Terinput
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Sumatif Lingkup Materi</span>
                    </h4>

                    {/* Stats */}
                    <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-slate-900/50 border border-blue-100 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        Rata-Rata Nilai Sumatif:
                      </span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                          {calculations.avgSumatif ?? "-"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Kontribusi ke NA: +{calculations.kontribusiSumatif} poin
                      </div>
                    </div>

                    {/* List of individual sumatifs */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Daftar Nilai Materi:
                      </span>
                      {sumatifItems.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          Belum ada nilai sumatif materi yang diinput.
                        </p>
                      ) : (
                        <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                          {sumatifItems.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-slate-700 dark:text-slate-300 truncate">
                                  {item.jenis}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {item.waktu || "-"}
                                </span>
                              </div>
                              <span className="font-mono font-black text-blue-600 dark:text-blue-400 shrink-0 text-sm">
                                {item.nilai}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                    Nilai rata-rata dari seluruh sumatif dikalikan 50%.
                  </div>
                </div>

                {/* 2. KARTU UJIAN TENGAH SEMESTER (UTS / STS) (35%) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                        Bobot 35%
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {utsItem ? "Sudah Diinput" : "Belum Ada"}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>Ujian Tengah Semester (UTS)</span>
                    </h4>

                    {/* Stats */}
                    <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-slate-900/50 border border-purple-100 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        Nilai Mentah UTS / STS:
                      </span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                          {calculations.valUts ?? "-"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                      </div>
                      <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                        Kontribusi ke NA: +{calculations.kontribusiUts} poin
                      </div>
                    </div>

                    {/* Detail Information */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status Penilaian:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {utsItem ? "Terekam" : "Belum Dilaksanakan"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tanggal Ujian:</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {utsItem?.waktu || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Perhitungan:</span>
                        <span className="font-mono font-bold text-purple-600">
                          {calculations.valUts ?? 0} × 35%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                    Nilai UTS memberikan porsi 35% dari total nilai akhir.
                  </div>
                </div>

                {/* 3. KARTU UJIAN AKHIR SEMESTER (UAS / SAS) (15%) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        Bobot 15%
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {uasItem ? "Sudah Diinput" : "Belum Ada"}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      <span>Ujian Akhir Semester (UAS)</span>
                    </h4>

                    {/* Stats */}
                    <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-slate-900/50 border border-amber-100 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        Nilai Mentah UAS / SAS:
                      </span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                          {calculations.valUas ?? "-"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                      </div>
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        Kontribusi ke NA: +{calculations.kontribusiUas} poin
                      </div>
                    </div>

                    {/* Detail Information */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status Penilaian:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {uasItem ? "Terekam" : "Belum Dilaksanakan"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tanggal Ujian:</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {uasItem?.waktu || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Perhitungan:</span>
                        <span className="font-mono font-bold text-amber-600">
                          {calculations.valUas ?? 0} × 15%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                    Nilai UAS memberikan porsi 15% dari total nilai akhir.
                  </div>
                </div>
              </div>

              {/* EMPTY DATA NOTICE / SIMULATION HELPER */}
              {currentMapelGrades.length === 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-bold">
                      Belum ada catatan nilai yang tersimpan untuk siswa ini pada mata pelajaran {activeMapelName}.
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Anda dapat menginput nilai sumatif materi, UTS, dan UAS sekaligus melalui menu Input Penilaian & Leger.
                    </p>
                    {onNavigateToPenilaian && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToPenilaian();
                        }}
                        className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        <span>Buka Menu Input Penilaian Sekarang</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* TAB 2: OVERVIEW SEMUA MATA PELAJARAN UNTUK SISWA INI */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                    Rekapitulasi Kontribusi Nilai Seluruh Mata Pelajaran
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rincian nilai sumatif, UTS, UAS, dan nilai akhir yang dihitung secara proporsional.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {multiMapelSummary.length} Mata Pelajaran
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-3.5 py-3">No</th>
                      <th className="px-3.5 py-3">Mata Pelajaran</th>
                      <th className="px-3.5 py-3 text-center">Rata-rata Sumatif (50%)</th>
                      <th className="px-3.5 py-3 text-center">UTS (35%)</th>
                      <th className="px-3.5 py-3 text-center">UAS (15%)</th>
                      <th className="px-3.5 py-3 text-center">Nilai Akhir (100%)</th>
                      <th className="px-3.5 py-3 text-center">Predikat</th>
                      <th className="px-3.5 py-3 text-center">Keterangan</th>
                      <th className="px-3.5 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                    {multiMapelSummary.map((item, idx) => (
                      <tr
                        key={item.namaMapel}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-3.5 py-2.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-3.5 py-2.5 font-extrabold text-slate-800 dark:text-white">
                          {item.namaMapel}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.avgSumatif ?? "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                          {item.valUts ?? "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.valUAS ?? item.valUas ?? "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-black text-slate-900 dark:text-white text-sm">
                          {item.nilaiAkhir ?? "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                              item.predikat === "A"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : item.predikat === "B"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : item.predikat === "C"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : item.predikat === "D"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : "text-slate-400"
                            }`}
                          >
                            {item.predikat}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center text-[11px] text-slate-500">
                          {item.keterangan}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMapel(item.namaMapel);
                              setActiveTab("rincian");
                            }}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Rincian &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Scale className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Standar Bobot Kurikulum: <strong>Sumatif 50%</strong> + <strong>UTS 35%</strong> + <strong>UAS 15%</strong> = <strong>100%</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {onNavigateToRaport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToRaport();
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Cetak Rapor Siswa</span>
              </button>
            )}

            {onNavigateToPenilaian && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToPenilaian();
                }}
                className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Menu Penilaian</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
