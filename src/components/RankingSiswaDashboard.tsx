import React, { useState, useMemo } from "react";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Search,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  Eye,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowUpDown,
  BookOpen,
  Users
} from "lucide-react";
import * as XLSX from "xlsx";
import { Siswa, Mapel, DataNilai } from "../types";
import { categorizeJenisPenilaian, hitungNilaiAkhirSiswa } from "./InputPenilaianView";

interface RankingSiswaDashboardProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  nilaiList: DataNilai[];
  onOpenDetailModal: (siswaId: string, mapel?: string) => void;
  onNavigateToPenilaian?: () => void;
  onNavigateToRaport?: () => void;
}

export interface StudentRankItem {
  rank: number;
  siswa: Siswa;
  avgSumatif: number | null;
  valUts: number | null;
  valUas: number | null;
  kontribusiSumatif: number;
  kontribusiUts: number;
  kontribusiUas: number;
  nilaiAkhir: number | null;
  predikat: string;
  keterangan: string;
  isLulusKkm: boolean;
  hasScore: boolean;
  mapelCount?: number;
}

export const RankingSiswaDashboard: React.FC<RankingSiswaDashboardProps> = ({
  siswaList,
  mapelList,
  nilaiList,
  onOpenDetailModal,
  onNavigateToPenilaian,
  onNavigateToRaport
}) => {
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");
  const [selectedMapel, setSelectedMapel] = useState<string>("ALL");
  const [limitTop, setLimitTop] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFormulaExpanded, setIsFormulaExpanded] = useState<boolean>(false);

  // Available classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    siswaList.forEach((s) => {
      if (s.kelas && s.kelas.trim()) set.add(s.kelas.trim());
    });
    return Array.from(set).sort();
  }, [siswaList]);

  // Available subject names
  const availableMapels = useMemo(() => {
    const list = mapelList.map((m) => m.namaMapel).filter(Boolean);
    if (list.length === 0) {
      const fromGrades = Array.from(new Set(nilaiList.map((n) => n.mapel).filter(Boolean)));
      return fromGrades.sort();
    }
    return list.sort();
  }, [mapelList, nilaiList]);

  // Filtered students by Class
  const filteredStudentsByClass = useMemo(() => {
    if (selectedKelas === "ALL") return siswaList;
    return siswaList.filter((s) => s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  // Calculate ranking for students
  const rankedStudents: StudentRankItem[] = useMemo(() => {
    if (filteredStudentsByClass.length === 0) return [];

    const computedList = filteredStudentsByClass.map((student) => {
      // Find grades belonging to this student
      const studentGrades = nilaiList.filter(
        (n) =>
          n.idSiswa === student.id ||
          (n.namaSiswa && student.nama && n.namaSiswa.trim().toLowerCase() === student.nama.trim().toLowerCase())
      );

      if (selectedMapel !== "ALL") {
        // Calculation for a single specific subject
        const mapelGrades = studentGrades.filter((g) => g.mapel === selectedMapel);
        const calc = hitungNilaiAkhirSiswa(mapelGrades);

        const avgSumatif = calc.avgSumatif;
        const valUts = calc.valUts;
        const valUas = calc.valUas;
        const kontribusiSumatif = avgSumatif !== null ? Number((avgSumatif * 0.50).toFixed(2)) : 0;
        const kontribusiUts = valUts !== null ? Number((valUts * 0.35).toFixed(2)) : 0;
        const kontribusiUas = valUas !== null ? Number((valUas * 0.15).toFixed(2)) : 0;
        const nilaiAkhir = calc.nilaiAkhir;

        const hasScore = avgSumatif !== null || valUts !== null || valUas !== null;

        return {
          rank: 0,
          siswa: student,
          avgSumatif,
          valUts,
          valUas,
          kontribusiSumatif,
          kontribusiUts,
          kontribusiUas,
          nilaiAkhir,
          predikat: calc.predikat,
          keterangan: calc.keterangan,
          isLulusKkm: nilaiAkhir !== null && nilaiAkhir >= 75,
          hasScore,
          mapelCount: 1
        };
      } else {
        // Calculation across ALL subjects (Aggregate Academic Average)
        // Group by mapel
        const mapelNames = availableMapels.length > 0 ? availableMapels : ["Umum"];
        const subjectCalculations: Array<{
          mapel: string;
          avgSumatif: number | null;
          valUts: number | null;
          valUas: number | null;
          nilaiAkhir: number | null;
        }> = [];

        mapelNames.forEach((mName) => {
          const mGrades = studentGrades.filter((g) => g.mapel === mName);
          if (mGrades.length > 0) {
            const res = hitungNilaiAkhirSiswa(mGrades);
            if (res.nilaiAkhir !== null) {
              subjectCalculations.push({
                mapel: mName,
                avgSumatif: res.avgSumatif,
                valUts: res.valUts,
                valUas: res.valUas,
                nilaiAkhir: res.nilaiAkhir
              });
            }
          }
        });

        if (subjectCalculations.length > 0) {
          const totalAkhir = subjectCalculations.reduce((acc, curr) => acc + (curr.nilaiAkhir || 0), 0);
          const avgAkhir = Number((totalAkhir / subjectCalculations.length).toFixed(1));

          // Averages for components
          const validSumatifs = subjectCalculations.map((c) => c.avgSumatif).filter((v): v is number => v !== null);
          const validUts = subjectCalculations.map((c) => c.valUts).filter((v): v is number => v !== null);
          const validUas = subjectCalculations.map((c) => c.valUas).filter((v): v is number => v !== null);

          const meanSumatif = validSumatifs.length > 0
            ? Number((validSumatifs.reduce((a, b) => a + b, 0) / validSumatifs.length).toFixed(1))
            : null;
          const meanUts = validUts.length > 0
            ? Number((validUts.reduce((a, b) => a + b, 0) / validUts.length).toFixed(1))
            : null;
          const meanUas = validUas.length > 0
            ? Number((validUas.reduce((a, b) => a + b, 0) / validUas.length).toFixed(1))
            : null;

          const kontribusiSumatif = meanSumatif !== null ? Number((meanSumatif * 0.50).toFixed(2)) : 0;
          const kontribusiUts = meanUts !== null ? Number((meanUts * 0.35).toFixed(2)) : 0;
          const kontribusiUas = meanUas !== null ? Number((meanUas * 0.15).toFixed(2)) : 0;

          // Predikat
          let predikat = "-";
          let keterangan = "Belum Ada Nilai";
          if (avgAkhir >= 88) {
            predikat = "A";
            keterangan = "Sangat Baik (Tercapai Maksimal)";
          } else if (avgAkhir >= 78) {
            predikat = "B";
            keterangan = "Baik (Tercapai)";
          } else if (avgAkhir >= 70) {
            predikat = "C";
            keterangan = "Cukup (Perlu Pemantapan)";
          } else {
            predikat = "D";
            keterangan = "Perlu Bimbingan Khusus";
          }

          return {
            rank: 0,
            siswa: student,
            avgSumatif: meanSumatif,
            valUts: meanUts,
            valUas: meanUas,
            kontribusiSumatif,
            kontribusiUts,
            kontribusiUas,
            nilaiAkhir: avgAkhir,
            predikat,
            keterangan,
            isLulusKkm: avgAkhir >= 75,
            hasScore: true,
            mapelCount: subjectCalculations.length
          };
        } else {
          // No scored subjects yet
          return {
            rank: 0,
            siswa: student,
            avgSumatif: null,
            valUts: null,
            valUas: null,
            kontribusiSumatif: 0,
            kontribusiUts: 0,
            kontribusiUas: 0,
            nilaiAkhir: null,
            predikat: "-",
            keterangan: "Belum Ada Penilaian",
            isLulusKkm: false,
            hasScore: false,
            mapelCount: 0
          };
        }
      }
    });

    // Sorting:
    // 1. Has scores first, sorted by nilaiAkhir descending
    // 2. Tie break by kontribusiSumatif (50%) descending, then UTS (35%), then UAS (15%)
    // 3. Name alphabetically
    const sorted = [...computedList].sort((a, b) => {
      if (a.hasScore && !b.hasScore) return -1;
      if (!a.hasScore && b.hasScore) return 1;
      if (!a.hasScore && !b.hasScore) return a.siswa.nama.localeCompare(b.siswa.nama);

      const scoreA = a.nilaiAkhir ?? -1;
      const scoreB = b.nilaiAkhir ?? -1;

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // Tie breaker 1: Sumatif
      const sumA = a.avgSumatif ?? -1;
      const sumB = b.avgSumatif ?? -1;
      if (sumB !== sumA) return sumB - sumA;

      // Tie breaker 2: UTS
      const utsA = a.valUts ?? -1;
      const utsB = b.valUts ?? -1;
      if (utsB !== utsA) return utsB - utsA;

      // Tie breaker 3: UAS
      const uasA = a.valUas ?? -1;
      const uasB = b.valUas ?? -1;
      if (uasB !== uasA) return uasB - uasA;

      return a.siswa.nama.localeCompare(b.siswa.nama);
    });

    // Assign ranking positions (Standard competition ranking or sequential)
    let currentRank = 1;
    return sorted.map((item, index) => {
      if (!item.hasScore) {
        return { ...item, rank: sorted.length }; // Or unranked
      }
      return { ...item, rank: index + 1 };
    });
  }, [filteredStudentsByClass, nilaiList, selectedMapel, availableMapels]);

  // Filtered by Search Query
  const displayedStudents = useMemo(() => {
    let list = rankedStudents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.siswa.nama.toLowerCase().includes(q) ||
          (item.siswa.nisn && item.siswa.nisn.toLowerCase().includes(q)) ||
          (item.siswa.kelas && item.siswa.kelas.toLowerCase().includes(q))
      );
    }
    if (limitTop !== "ALL") {
      list = list.slice(0, Number(limitTop));
    }
    return list;
  }, [rankedStudents, searchQuery, limitTop]);

  // Top 3 Podium Students (only those who have scores)
  const podiumStudents = useMemo(() => {
    return rankedStudents.filter((s) => s.hasScore && s.nilaiAkhir !== null).slice(0, 3);
  }, [rankedStudents]);

  // Overall statistics for the selected cohort
  const cohortStats = useMemo(() => {
    const scored = rankedStudents.filter((s) => s.hasScore && s.nilaiAkhir !== null);
    if (scored.length === 0) {
      return {
        totalSiswa: rankedStudents.length,
        totalDinilai: 0,
        rataRataKelas: 0,
        nilaiTertinggi: 0,
        nilaiTerendah: 0,
        persenLulusKkm: 0
      };
    }

    const scores = scored.map((s) => s.nilaiAkhir as number);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Number((sum / scores.length).toFixed(1));
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const lulus = scored.filter((s) => s.isLulusKkm).length;
    const pctLulus = Math.round((lulus / scored.length) * 100);

    return {
      totalSiswa: rankedStudents.length,
      totalDinilai: scored.length,
      rataRataKelas: avg,
      nilaiTertinggi: max,
      nilaiTerendah: min,
      persenLulusKkm: pctLulus
    };
  }, [rankedStudents]);

  // Export to Excel handler
  const handleExportExcel = () => {
    const dataToExport = displayedStudents.map((item) => ({
      "Peringkat": item.hasScore ? item.rank : "Belum Dinilai",
      "Nama Siswa": item.siswa.nama,
      "NISN": item.siswa.nisn || "-",
      "Kelas": item.siswa.kelas || "-",
      "Rata-rata Sumatif": item.avgSumatif !== null ? item.avgSumatif : "-",
      "Kontribusi Sumatif (50%)": item.hasScore ? item.kontribusiSumatif : "-",
      "UTS (35%)": item.valUts !== null ? item.valUts : "-",
      "Kontribusi UTS": item.hasScore ? item.kontribusiUts : "-",
      "UAS (15%)": item.valUas !== null ? item.valUas : "-",
      "Kontribusi UAS": item.hasScore ? item.kontribusiUas : "-",
      "Nilai Akhir": item.nilaiAkhir !== null ? item.nilaiAkhir : "-",
      "Predikat": item.predikat,
      "Status KKM (75)": item.hasScore ? (item.isLulusKkm ? "Tuntas" : "Remedial") : "Belum Ada Nilai",
      "Keterangan": item.keterangan
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    const mapelLabel = selectedMapel === "ALL" ? "Semua Mapel" : selectedMapel;
    const sheetName = `Ranking_${selectedKelas}`.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const fileName = `Ranking_Siswa_${selectedKelas}_${mapelLabel.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Print Ranking Table handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-5">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 text-white rounded-2xl shadow-md shadow-amber-500/20 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">
                Ranking Siswa (Peringkat Akademik)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Otomatis Dihitung
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Peringkat kelas dihitung transparan dari bobot resmi:{" "}
              <strong className="text-slate-700 dark:text-slate-200">Sumatif 50%</strong> +{" "}
              <strong className="text-slate-700 dark:text-slate-200">UTS 35%</strong> +{" "}
              <strong className="text-slate-700 dark:text-slate-200">UAS 15%</strong>.
            </p>
          </div>
        </div>

        {/* Action Controls: Formula toggle, Export, Print */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Penjelasan detail formula pembobotan"
          >
            <Percent className="w-3.5 h-3.5 text-blue-500" />
            <span>Formula Bobot</span>
            {isFormulaExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Download Rekap Ranking dalam format Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {onNavigateToRaport && (
            <button
              type="button"
              onClick={onNavigateToRaport}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Cetak Rapor Kurikulum Merdeka"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Cetak Rapor</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Cetak tabel peringkat atau Simpan PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Expandable Formula Explanation Banner */}
      {isFormulaExpanded && (
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-amber-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Sistem Perhitungan Nilai Akhir & Ranking Siswa
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
              Standar Kurikulum
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-blue-100 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-700 dark:text-blue-400">1. Rata-rata Sumatif (50%)</span>
                <span className="font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">0.50</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Nilai rata-rata dari seluruh ulangan harian atau sumatif lingkup materi yang telah ditempuh siswa.
              </p>
            </div>

            <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-indigo-100 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-700 dark:text-indigo-400">2. UTS / STS (35%)</span>
                <span className="font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">0.35</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Nilai ujian Penilaian/Sumatif Tengah Semester yang mengukur kompetensi pertengahan semester.
              </p>
            </div>

            <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-amber-100 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-400">3. UAS / SAS (15%)</span>
                <span className="font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">0.15</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Nilai Ujian Akhir Semester / Sumatif Akhir Semester sebagai evaluasi komprehensif penutup semester.
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
            <span>
              <strong>Rumus:</strong> Nilai Akhir = (Rata-rata Sumatif × 0.50) + (Nilai UTS × 0.35) + (Nilai UAS × 0.15)
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
              KKM Standar: 75.0
            </span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Kelas Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Kelas:</span>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">Semua Kelas ({siswaList.length} Siswa)</option>
              {availableClasses.map((cls) => {
                const count = siswaList.filter((s) => s.kelas === cls).length;
                return (
                  <option key={cls} value={cls}>
                    Kelas {cls} ({count} Siswa)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Mapel Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Mata Pelajaran:</span>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs max-w-[210px] truncate"
            >
              <option value="ALL">Semua Mapel (Akumulasi Nilai)</option>
              {availableMapels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Top Limit Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tampilkan:</span>
            <select
              value={String(limitTop)}
              onChange={(e) => setLimitTop(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
              className="text-xs font-semibold px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">Semua Siswa</option>
              <option value="3">Top 3 Besar</option>
              <option value="5">Top 5 Besar</option>
              <option value="10">Top 10 Besar</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari siswa atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Cohort Quick Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">Rata-rata Kelas</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
              {cohortStats.rataRataKelas > 0 ? cohortStats.rataRataKelas : "-"}
            </span>
            <span className="text-[10px] text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">Nilai Tertinggi (Rank #1)</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
              {cohortStats.nilaiTertinggi > 0 ? cohortStats.nilaiTertinggi : "-"}
            </span>
            <span className="text-[10px] text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">Kelulusan KKM (≥ 75)</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {cohortStats.totalDinilai > 0 ? `${cohortStats.persenLulusKkm}%` : "-"}
            </span>
            <span className="text-[10px] text-slate-400">tuntas</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500">Siswa Dinilai</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
              {cohortStats.totalDinilai}
            </span>
            <span className="text-[10px] text-slate-400">dari {cohortStats.totalSiswa} siswa</span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Visual Section */}
      {podiumStudents.length > 0 && !searchQuery && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-amber-500" />
              Podium 3 Besar Teratas
            </h3>
            <span className="text-[11px] text-slate-500">
              {selectedKelas === "ALL" ? "Peringkat Paralel" : `Peringkat Kelas ${selectedKelas}`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Rank 2 (Perak) */}
            {podiumStudents[1] && (
              <div
                onClick={() => onOpenDetailModal(podiumStudents[1].siswa.id, selectedMapel)}
                className="relative p-4 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200/80 dark:from-slate-800 dark:to-slate-800/80 border-2 border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold flex items-center justify-center text-sm shadow-inner">
                      🥈 2
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Juara 2 (Perak)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300">
                    Predikat {podiumStudents[1].predikat}
                  </span>
                </div>

                <div className="my-3 space-y-1">
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {podiumStudents[1].siswa.nama}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kelas: {podiumStudents[1].siswa.kelas || "-"} | NISN: {podiumStudents[1].siswa.nisn || "-"}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-300/60 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Nilai Akhir:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-white">
                      {podiumStudents[1].nilaiAkhir}
                    </span>
                    <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 (Emas - Center, Primary Highlight) */}
            {podiumStudents[0] && (
              <div
                onClick={() => onOpenDetailModal(podiumStudents[0].siswa.id, selectedMapel)}
                className="relative p-4 rounded-2xl bg-gradient-to-b from-amber-50 to-yellow-100/90 dark:from-amber-950/40 dark:to-yellow-950/30 border-2 border-amber-400 dark:border-amber-500 shadow-md hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between md:-translate-y-1"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold text-[10px] shadow-sm flex items-center gap-1 uppercase tracking-wider">
                  <Crown className="w-3 h-3" />
                  Bintang Kelas
                </div>

                <div className="flex items-start justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                      🥇 1
                    </span>
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      Juara 1 (Emas)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    Predikat {podiumStudents[0].predikat}
                  </span>
                </div>

                <div className="my-3 space-y-1">
                  <h4 className="font-extrabold text-amber-950 dark:text-white text-lg group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors truncate">
                    {podiumStudents[0].siswa.nama}
                  </h4>
                  <p className="text-xs text-amber-800/80 dark:text-slate-400">
                    Kelas: {podiumStudents[0].siswa.kelas || "-"} | NISN: {podiumStudents[0].siswa.nisn || "-"}
                  </p>
                </div>

                <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                  <span className="text-amber-800 dark:text-amber-400 font-medium">Nilai Akhir:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xl font-black text-amber-700 dark:text-amber-300">
                      {podiumStudents[0].nilaiAkhir}
                    </span>
                    <Eye className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </div>
            )}

            {/* Rank 3 (Perunggu) */}
            {podiumStudents[2] && (
              <div
                onClick={() => onOpenDetailModal(podiumStudents[2].siswa.id, selectedMapel)}
                className="relative p-4 rounded-2xl bg-gradient-to-b from-amber-50/50 to-orange-100/70 dark:from-slate-800 dark:to-orange-950/20 border-2 border-orange-300 dark:border-orange-800/70 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-full bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 font-extrabold flex items-center justify-center text-sm shadow-inner">
                      🥉 3
                    </span>
                    <span className="text-xs font-bold text-orange-800 dark:text-orange-300">
                      Juara 3 (Perunggu)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-orange-900 dark:text-orange-200">
                    Predikat {podiumStudents[2].predikat}
                  </span>
                </div>

                <div className="my-3 space-y-1">
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-base group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                    {podiumStudents[2].siswa.nama}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kelas: {podiumStudents[2].siswa.kelas || "-"} | NISN: {podiumStudents[2].siswa.nisn || "-"}
                  </p>
                </div>

                <div className="pt-2 border-t border-orange-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Nilai Akhir:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-lg font-black text-slate-800 dark:text-white">
                      {podiumStudents[2].nilaiAkhir}
                    </span>
                    <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Ranking Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              Tabel Urutan Peringkat Siswa
            </h3>
            <span className="text-xs text-slate-400">
              ({displayedStudents.length} siswa ditampilkan)
            </span>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Klik baris siswa untuk membuka modal rincian nilai transparan
          </span>
        </div>

        {displayedStudents.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Tidak ada data siswa yang cocok dengan filter atau kata kunci.
            </p>
            {onNavigateToPenilaian && (
              <button
                type="button"
                onClick={onNavigateToPenilaian}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Ke Menu Penilaian untuk Input Nilai
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 select-none">
                  <th className="py-3 px-3 font-extrabold text-center w-14">Rank</th>
                  <th className="py-3 px-3 font-extrabold">Nama Siswa</th>
                  <th className="py-3 px-2 font-bold text-center">Kelas</th>
                  <th className="py-3 px-2 font-bold text-right" title="Rata-rata ulangan harian siswa (bobot 50%)">
                    Sumatif (50%)
                  </th>
                  <th className="py-3 px-2 font-bold text-right" title="Penilaian Tengah Semester (bobot 35%)">
                    UTS (35%)
                  </th>
                  <th className="py-3 px-2 font-bold text-right" title="Penilaian Akhir Semester (bobot 15%)">
                    UAS (15%)
                  </th>
                  <th className="py-3 px-3 font-extrabold text-right bg-amber-50/50 dark:bg-amber-950/20">
                    Nilai Akhir
                  </th>
                  <th className="py-3 px-2 font-bold text-center">Predikat</th>
                  <th className="py-3 px-2 font-bold text-center">Status</th>
                  <th className="py-3 px-3 font-bold text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedStudents.map((item) => {
                  const isTop1 = item.rank === 1 && item.hasScore;
                  const isTop2 = item.rank === 2 && item.hasScore;
                  const isTop3 = item.rank === 3 && item.hasScore;

                  let rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-center text-xs mx-auto">
                      {item.hasScore ? item.rank : "-"}
                    </span>
                  );

                  if (isTop1) {
                    rankBadge = (
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white font-extrabold flex items-center justify-center text-xs mx-auto shadow-sm">
                        🥇 1
                      </span>
                    );
                  } else if (isTop2) {
                    rankBadge = (
                      <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-extrabold flex items-center justify-center text-xs mx-auto shadow-xs">
                        🥈 2
                      </span>
                    );
                  } else if (isTop3) {
                    rankBadge = (
                      <span className="w-7 h-7 rounded-full bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 font-extrabold flex items-center justify-center text-xs mx-auto shadow-xs">
                        🥉 3
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={item.siswa.id}
                      onClick={() => onOpenDetailModal(item.siswa.id, selectedMapel)}
                      className={`hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group ${
                        isTop1
                          ? "bg-amber-50/20 dark:bg-amber-950/10 font-semibold"
                          : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-2.5 px-3 text-center">{rankBadge}</td>

                      {/* Nama Siswa */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.siswa.nama}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>NISN: {item.siswa.nisn || "-"}</span>
                          {selectedMapel === "ALL" && item.mapelCount !== undefined && item.mapelCount > 0 && (
                            <span className="text-blue-500 font-medium">
                              • {item.mapelCount} Mapel dinilai
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kelas */}
                      <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-300">
                        {item.siswa.kelas || "-"}
                      </td>

                      {/* Sumatif */}
                      <td className="py-2.5 px-2 text-right">
                        {item.avgSumatif !== null ? (
                          <div>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {item.avgSumatif}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              +{item.kontribusiSumatif}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* UTS */}
                      <td className="py-2.5 px-2 text-right">
                        {item.valUts !== null ? (
                          <div>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {item.valUts}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              +{item.kontribusiUts}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* UAS */}
                      <td className="py-2.5 px-2 text-right">
                        {item.valUas !== null ? (
                          <div>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {item.valUas}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              +{item.kontribusiUas}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Nilai Akhir */}
                      <td className="py-2.5 px-3 text-right bg-amber-50/40 dark:bg-amber-950/20">
                        {item.nilaiAkhir !== null ? (
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {item.nilaiAkhir}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Belum ada</span>
                        )}
                      </td>

                      {/* Predikat */}
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            item.predikat === "A"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : item.predikat === "B"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : item.predikat === "C"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : item.predikat === "D"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                          }`}
                        >
                          {item.predikat}
                        </span>
                      </td>

                      {/* Status KKM */}
                      <td className="py-2.5 px-2 text-center">
                        {item.hasScore ? (
                          item.isLulusKkm ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                              Tuntas
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                              Remedial
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenDetailModal(item.siswa.id, selectedMapel)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                          title="Buka rincian transparansi nilai lengkap"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Rincian</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Insight / Notice */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Peringkat disinkronkan secara *real-time* dengan seluruh input ulangan sumatif, UTS, dan UAS.
          </span>
        </div>
        {onNavigateToPenilaian && (
          <button
            type="button"
            onClick={onNavigateToPenilaian}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer shrink-0"
          >
            Input / Koreksi Nilai di Penilaian &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
