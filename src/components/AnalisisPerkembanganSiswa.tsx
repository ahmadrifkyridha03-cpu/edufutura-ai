import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  Users,
  BookOpen,
  Sparkles,
  Target,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  BarChart2,
  Calendar,
  Layers,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Calculator,
  Scale,
  Eye
} from "lucide-react";
import { Siswa, Mapel, DataNilai } from "../types";
import { RincianNilaiSiswaModal } from "./RincianNilaiSiswaModal";

interface AnalisisPerkembanganSiswaProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  nilaiList: DataNilai[];
  onNavigateToPenilaian?: () => void;
}

// Preset warna kontras untuk kurva multi-siswa
const STUDENT_COLORS = [
  { stroke: "#2563eb", fill: "rgba(37, 99, 235, 0.15)", bg: "bg-blue-600", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500", name: "Biru" },
  { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.15)", bg: "bg-emerald-600", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500", name: "Zamrud" },
  { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.15)", bg: "bg-purple-600", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500", name: "Ungu" },
  { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.15)", bg: "bg-amber-600", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500", name: "Kuning" },
  { stroke: "#f43f5e", fill: "rgba(244, 63, 94, 0.15)", bg: "bg-rose-600", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500", name: "Mawar" },
  { stroke: "#06b6d4", fill: "rgba(6, 182, 212, 0.15)", bg: "bg-cyan-600", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500", name: "Sian" },
  { stroke: "#ec4899", fill: "rgba(236, 72, 153, 0.15)", bg: "bg-pink-600", text: "text-pink-600 dark:text-pink-400", border: "border-pink-500", name: "Merah Muda" },
  { stroke: "#14b8a6", fill: "rgba(20, 184, 166, 0.15)", bg: "bg-teal-600", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500", name: "Teal" }
];

export const AnalisisPerkembanganSiswa: React.FC<AnalisisPerkembanganSiswaProps> = ({
  siswaList,
  mapelList,
  nilaiList,
  onNavigateToPenilaian
}) => {
  // State Filter
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");
  const [selectedMapel, setSelectedMapel] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"single" | "multi">("single");
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [selectedMultiIds, setSelectedMultiIds] = useState<string[]>([]);
  const [showKkmLine, setShowKkmLine] = useState<boolean>(true);
  const [showClassAvgLine, setShowClassAvgLine] = useState<boolean>(true);
  const [useSampleIfEmpty, setUseSampleIfEmpty] = useState<boolean>(true);

  // Modal Rincian Nilai State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [detailModalSiswaId, setDetailModalSiswaId] = useState<string | null>(null);

  // Hover state pada chart SVG
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    studentName: string;
    stageName: string;
    score: number;
    classAvg: number;
    date: string;
    color: string;
  } | null>(null);

  // Opsi Kelas
  const kelasOptions = useMemo(() => {
    const list = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean)));
    return list.sort();
  }, [siswaList]);

  // Opsi Siswa sesuai filter kelas
  const filteredSiswaList = useMemo(() => {
    if (selectedKelas === "ALL") return siswaList;
    return siswaList.filter((s) => s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  // Set default selected student saat filtered list berubah
  useMemo(() => {
    if (filteredSiswaList.length > 0) {
      if (!selectedSiswaId || !filteredSiswaList.some((s) => s.id === selectedSiswaId)) {
        setSelectedSiswaId(filteredSiswaList[0].id);
      }
      if (selectedMultiIds.length === 0) {
        setSelectedMultiIds(filteredSiswaList.slice(0, 4).map((s) => s.id));
      }
    }
  }, [filteredSiswaList]);

  // Filter nilai berdasarkan kelas dan mapel
  const filteredNilai = useMemo(() => {
    return nilaiList.filter((n) => {
      const matchKelas = selectedKelas === "ALL" || n.kelas === selectedKelas;
      const matchMapel = selectedMapel === "ALL" || n.mapel === selectedMapel;
      const hasScore = n.nilai !== "" && n.nilai !== undefined && !isNaN(Number(n.nilai));
      return matchKelas && matchMapel && hasScore;
    });
  }, [nilaiList, selectedKelas, selectedMapel]);

  // Cek apakah data nilai riil cukup untuk tren time-series (minimal 2 asesmen)
  const hasRealData = filteredNilai.length >= 2;

  // Generate dataset asesmen / time-series points
  const assessmentStages = useMemo(() => {
    if (hasRealData) {
      // Ambil seluruh waktu/jenis unik dari nilai riil dan urutkan
      const stageMap = new Map<string, { label: string; date: string; timestamp: number }>();
      filteredNilai.forEach((n) => {
        const key = `${n.jenis}___${n.waktu || ""}`;
        if (!stageMap.has(key)) {
          let ts = 0;
          if (n.waktu) {
            ts = new Date(n.waktu).getTime() || 0;
          }
          stageMap.set(key, {
            label: n.jenis,
            date: n.waktu || "-",
            timestamp: ts
          });
        }
      });

      const arr = Array.from(stageMap.values());
      // Urutkan berdasarkan timestamp atau abjad
      arr.sort((a, b) => a.timestamp - b.timestamp);
      return arr.map((item, idx) => ({
        id: `stage_${idx}`,
        label: item.label,
        date: item.date
      }));
    }

    // Jika belum ada cukup data riil dan opsi sampel diaktifkan, sediakan tahapan simulasi kurikulum
    if (useSampleIfEmpty) {
      return [
        { id: "s1", label: "Sumatif 1 (Materi 1)", date: "Awal Bulan 1" },
        { id: "s2", label: "Sumatif 2 (Materi 2)", date: "Akhir Bulan 1" },
        { id: "uts", label: "STS / UTS Ganjil", date: "Tengah Semester" },
        { id: "s3", label: "Sumatif 3 (Materi 3)", date: "Awal Bulan 3" },
        { id: "s4", label: "Sumatif 4 (Materi 4)", date: "Akhir Bulan 3" },
        { id: "uas", label: "SAS / UAS Akhir", date: "Akhir Semester" }
      ];
    }

    return [];
  }, [filteredNilai, hasRealData, useSampleIfEmpty]);

  // Buat data perkembangan tiap siswa di setiap tahapan
  const studentTimelineData = useMemo(() => {
    if (filteredSiswaList.length === 0 || assessmentStages.length === 0) return [];

    return filteredSiswaList.map((siswa, sIdx) => {
      // Cari nilai riil untuk siswa ini
      const stagesScores = assessmentStages.map((stg, stgIdx) => {
        if (hasRealData) {
          const match = filteredNilai.find(
            (n) => n.idSiswa === siswa.id && n.jenis === stg.label
          );
          return match ? Number(match.nilai) : null;
        }

        // Nilai simulasi kurva realistis jika data riil masih kosong
        if (useSampleIfEmpty) {
          // Buat pola nilai bertumbuh yang bervariasi sesuai indeks siswa
          const baseScore = 68 + ((sIdx * 7) % 22);
          const progression = stgIdx * 3.2 + Math.sin(sIdx + stgIdx) * 4;
          const score = Math.min(98, Math.max(58, Math.round(baseScore + progression)));
          return score;
        }

        return null;
      });

      // Valid scores
      const validNums = stagesScores.filter((sc): sc is number => sc !== null);
      const firstScore = validNums.length > 0 ? validNums[0] : null;
      const lastScore = validNums.length > 0 ? validNums[validNums.length - 1] : null;
      const avgScore = validNums.length > 0 
        ? Number((validNums.reduce((a, b) => a + b, 0) / validNums.length).toFixed(1)) 
        : null;
      const delta = firstScore !== null && lastScore !== null ? Number((lastScore - firstScore).toFixed(1)) : null;
      const maxScore = validNums.length > 0 ? Math.max(...validNums) : null;
      const minScore = validNums.length > 0 ? Math.min(...validNums) : null;

      const colorObj = STUDENT_COLORS[sIdx % STUDENT_COLORS.length];

      return {
        siswa,
        scores: stagesScores,
        firstScore,
        lastScore,
        avgScore,
        delta,
        maxScore,
        minScore,
        color: colorObj
      };
    });
  }, [filteredSiswaList, assessmentStages, filteredNilai, hasRealData, useSampleIfEmpty]);

  // Rata-rata kelas di setiap tahapan
  const classAverages = useMemo(() => {
    if (assessmentStages.length === 0 || studentTimelineData.length === 0) return [];

    return assessmentStages.map((_, stgIdx) => {
      const scoresAtStage = studentTimelineData
        .map((s) => s.scores[stgIdx])
        .filter((sc): sc is number => sc !== null);

      if (scoresAtStage.length === 0) return 0;
      return Number((scoresAtStage.reduce((a, b) => a + b, 0) / scoresAtStage.length).toFixed(1));
    });
  }, [assessmentStages, studentTimelineData]);

  // Siswa aktif untuk chart
  const activeStudentsForChart = useMemo(() => {
    if (viewMode === "single") {
      const found = studentTimelineData.find((s) => s.siswa.id === selectedSiswaId);
      return found ? [found] : (studentTimelineData.length > 0 ? [studentTimelineData[0]] : []);
    } else {
      return studentTimelineData.filter((s) => selectedMultiIds.includes(s.siswa.id));
    }
  }, [viewMode, selectedSiswaId, selectedMultiIds, studentTimelineData]);

  // Insight & Analisis Cepat (Top Growth, Top Performer, Need Attention)
  const insights = useMemo(() => {
    if (studentTimelineData.length === 0) return null;

    const withDelta = studentTimelineData.filter((s) => s.delta !== null);
    const withAvg = studentTimelineData.filter((s) => s.avgScore !== null);

    // Siswa dengan perkembangan terbesar (Growth)
    const sortedByGrowth = [...withDelta].sort((a, b) => (b.delta || 0) - (a.delta || 0));
    const topGrowth = sortedByGrowth.length > 0 ? sortedByGrowth[0] : null;

    // Siswa dengan rata-rata tertinggi
    const sortedByAvg = [...withAvg].sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
    const topAvg = sortedByAvg.length > 0 ? sortedByAvg[0] : null;

    // Siswa yang memerlukan bimbingan (nilai terendah atau delta negatif)
    const needAttentionList = [...studentTimelineData].filter(
      (s) => (s.lastScore !== null && s.lastScore < 75) || (s.delta !== null && s.delta < -3)
    ).sort((a, b) => (a.avgScore || 0) - (b.avgScore || 0));

    const needAttention = needAttentionList.length > 0 ? needAttentionList[0] : null;

    // Rata-rata keseluruhan kelas saat ini
    const totalAvgSum = withAvg.reduce((acc, curr) => acc + (curr.avgScore || 0), 0);
    const overallClassAvg = withAvg.length > 0 ? Number((totalAvgSum / withAvg.length).toFixed(1)) : 0;

    return {
      topGrowth,
      topAvg,
      needAttention,
      overallClassAvg,
      totalEvaluated: withAvg.length
    };
  }, [studentTimelineData]);

  // Perhitungan Koordinat SVG Chart
  const svgWidth = 800;
  const svgHeight = 320;
  const paddingLeft = 55;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 50;

  const chartAreaWidth = svgWidth - paddingLeft - paddingRight;
  const chartAreaHeight = svgHeight - paddingTop - paddingBottom;

  const minVal = 40;
  const maxVal = 100;

  const getYCoord = (score: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, score));
    const pct = (clamped - minVal) / (maxVal - minVal);
    return paddingTop + chartAreaHeight - pct * chartAreaHeight;
  };

  const getXCoord = (stageIndex: number) => {
    if (assessmentStages.length <= 1) return paddingLeft + chartAreaWidth / 2;
    return paddingLeft + (stageIndex / (assessmentStages.length - 1)) * chartAreaWidth;
  };

  // Generate cubic bezier smooth SVG path
  const makeSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i != points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  // Garis referensi KKM (75)
  const kkmY = getYCoord(75);

  const toggleMultiStudent = (id: string) => {
    setSelectedMultiIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 6) {
          return [...prev.slice(1), id]; // batasi max 6 siswa
        }
        return [...prev, id];
      }
    });
  };

  return (
    <div className="glass-card rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <span>Analisis Perkembangan Siswa & Tren Nilai</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Time-Series
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Grafik lintasan belajar & perkembangan nilai rata-rata tiap siswa dari waktu ke waktu.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Filter Kelas */}
          <div className="relative">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="text-xs font-bold pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-slate-400" />
          </div>

          {/* Filter Mapel */}
          <div className="relative">
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="text-xs font-bold pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Mapel</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.namaMapel}>
                  {m.namaMapel}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-slate-400" />
          </div>

          {/* Mode Switch (Single vs Multi) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "single"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
              }`}
            >
              Per Siswa
            </button>
            <button
              type="button"
              onClick={() => setViewMode("multi")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "multi"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
              }`}
            >
              Komparasi Kelas
            </button>
          </div>

          {/* Button Buka Modal Rincian Nilai Transparan */}
          <button
            type="button"
            onClick={() => {
              setDetailModalSiswaId(selectedSiswaId || (filteredSiswaList[0]?.id ?? null));
              setIsDetailModalOpen(true);
            }}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center space-x-1.5"
            title="Lihat Rincian Nilai Sumatif (50%), UTS (35%), dan UAS (15%)"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-300" />
            <span>Rincian Nilai Siswa (50%:35%:15%)</span>
          </button>
        </div>
      </div>

      {/* Notice jika menggunakan simulasi kurva */}
      {!hasRealData && useSampleIfEmpty && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs">
          <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>Mode Preview Aktif:</strong> Riwayat penilaian riil masih sedikit. Menampilkan simulasi kurva perkembangan berjenjang (Sumatif 1 &rarr; UAS) untuk melihat cara kerja analisis.
            </span>
          </div>
          {onNavigateToPenilaian && (
            <button
              onClick={onNavigateToPenilaian}
              className="font-bold underline text-blue-700 dark:text-blue-300 hover:text-blue-800 text-xs shrink-0 ml-3 cursor-pointer"
            >
              Input Nilai Baru &rarr;
            </button>
          )}
        </div>
      )}

      {/* Selector Siswa */}
      {viewMode === "single" ? (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Pilih Siswa yang Ingin Dianalisis:</span>
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {filteredSiswaList.map((s, idx) => {
              const isSelected = s.id === selectedSiswaId;
              const col = STUDENT_COLORS[idx % STUDENT_COLORS.length];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSiswaId(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : col.bg}`}
                  />
                  <span>{s.nama}</span>
                  <span className="text-[10px] opacity-75 font-mono">({s.kelas})</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Pilih Siswa untuk Garis Komparasi (Maksimal 6):</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-400">
              Terpilih: {selectedMultiIds.length} Siswa
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {filteredSiswaList.map((s, idx) => {
              const isSelected = selectedMultiIds.includes(s.id);
              const col = STUDENT_COLORS[idx % STUDENT_COLORS.length];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleMultiStudent(s.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? `${col.border} ${col.text} bg-slate-100 dark:bg-slate-900 font-bold shadow-2xs`
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${col.bg} ${!isSelected && "opacity-40"}`}
                  />
                  <span>{s.nama}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Kartu Metrik Detail Siswa Terpilih (Khusus Single Mode) */}
      {viewMode === "single" && activeStudentsForChart.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Nilai Awal */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Nilai Awal
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-extrabold text-slate-800 dark:text-white">
                {activeStudentsForChart[0].firstScore ?? "-"}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">poin</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              {assessmentStages[0]?.label || "Asesmen Pertama"}
            </p>
          </div>

          {/* Nilai Terakhir */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Nilai Terakhir
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                {activeStudentsForChart[0].lastScore ?? "-"}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">poin</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              {assessmentStages[assessmentStages.length - 1]?.label || "Asesmen Terbaru"}
            </p>
          </div>

          {/* Delta Pertumbuhan */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tren Pertumbuhan
            </span>
            <div className="flex items-center space-x-1.5">
              {activeStudentsForChart[0].delta !== null && (
                <>
                  {activeStudentsForChart[0].delta >= 0 ? (
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-extrabold text-xl">
                      <ArrowUpRight className="w-5 h-5 mr-0.5" />
                      +{activeStudentsForChart[0].delta}
                    </div>
                  ) : (
                    <div className="flex items-center text-rose-600 dark:text-rose-400 font-extrabold text-xl">
                      <ArrowDownRight className="w-5 h-5 mr-0.5" />
                      {activeStudentsForChart[0].delta}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 font-semibold">poin</span>
                </>
              )}
              {activeStudentsForChart[0].delta === null && (
                <span className="text-xl font-extrabold text-slate-400">-</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              {activeStudentsForChart[0].delta !== null && activeStudentsForChart[0].delta >= 0
                ? "Kemajuan Belajar Positif 🚀"
                : "Perlu Pendampingan ⚠️"}
            </p>
          </div>

          {/* Rata-rata Kumulatif */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Rata-Rata Kumulatif
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-extrabold text-slate-800 dark:text-white">
                {activeStudentsForChart[0].avgScore ?? "-"}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {(activeStudentsForChart[0].avgScore ?? 0) >= 75 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Tercapai KKM &ge; 75</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-bold">Di Bawah KKM &lt; 75</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Banner Rincian Kontribusi Nilai Siswa Terpilih (Khusus Single Mode) */}
      {viewMode === "single" && activeStudentsForChart.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/70 dark:from-slate-800/80 dark:to-slate-900 border border-blue-200/80 dark:border-slate-700 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs shrink-0">
              <Scale className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white">
                  Transparansi Nilai {activeStudentsForChart[0].siswa.nama}
                </h5>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  Bobot Resmi: Sumatif 50% • UTS 35% • UAS 15%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Lihat rincian kontribusi masing-masing jenis ujian terhadap nilai akhir siswa ini secara transparan dan proporsional.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDetailModalSiswaId(activeStudentsForChart[0].siswa.id);
              setIsDetailModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer shrink-0 transition-transform active:scale-95"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Lihat Rincian Nilai Siswa &rarr;</span>
          </button>
        </div>
      )}

      {/* Area Visual Chart SVG */}
      <div className="space-y-3">
        {/* Toggle Garis Referensi & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showKkmLine}
                onChange={(e) => setShowKkmLine(e.target.checked)}
                className="w-3.5 h-3.5 text-amber-500 rounded-sm focus:ring-amber-500 accent-amber-500"
              />
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
                <span>Garis KKM (75)</span>
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showClassAvgLine}
                onChange={(e) => setShowClassAvgLine(e.target.checked)}
                className="w-3.5 h-3.5 text-slate-500 rounded-sm focus:ring-slate-500 accent-slate-600"
              />
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-t-2 border-dotted border-slate-400 inline-block" />
                <span>Rata-Rata Kelas</span>
              </span>
            </label>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
            <span>Sumbu Y: Skala Nilai (40 - 100)</span>
            <span>&bull;</span>
            <span>Sumbu X: Kronologi Penilaian</span>
          </div>
        </div>

        {/* The Responsive SVG Line Chart */}
        <div className="relative w-full bg-slate-50/70 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-2 sm:p-4 overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              {/* Gradients untuk setiap siswa */}
              {studentTimelineData.map((s, idx) => (
                <linearGradient
                  key={`grad_${s.siswa.id}`}
                  id={`area_grad_${s.siswa.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color.stroke} stopOpacity="0.30" />
                  <stop offset="100%" stopColor={s.color.stroke} stopOpacity="0.0" />
                </linearGradient>
              ))}

              <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Grid Garis Horizontal Y (40, 60, 75, 80, 100) */}
            {[40, 60, 80, 100].map((val) => {
              const y = getYCoord(val);
              return (
                <g key={`grid_${val}`}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    className="fill-slate-400 font-mono font-bold"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Garis KKM (75) */}
            {showKkmLine && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={kkmY}
                  x2={svgWidth - paddingRight}
                  y2={kkmY}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <rect
                  x={svgWidth - paddingRight - 65}
                  y={kkmY - 10}
                  width="65"
                  height="16"
                  rx="4"
                  fill="#f59e0b"
                  opacity="0.9"
                />
                <text
                  x={svgWidth - paddingRight - 32}
                  y={kkmY + 2}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#ffffff"
                  fontWeight="bold"
                >
                  KKM: 75
                </text>
              </g>
            )}

            {/* Garis Rata-rata Kelas */}
            {showClassAvgLine && classAverages.length > 0 && (
              <g>
                {(() => {
                  const pts = classAverages.map((avg, idx) => ({
                    x: getXCoord(idx),
                    y: getYCoord(avg)
                  }));
                  return (
                    <path
                      d={makeSmoothPath(pts)}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                  );
                })()}
              </g>
            )}

            {/* Kurva Siswa Aktif */}
            {activeStudentsForChart.map((s) => {
              // Siapkan titik koordinat yang valid
              const pts: { x: number; y: number; score: number; stageIdx: number }[] = [];
              s.scores.forEach((sc, idx) => {
                if (sc !== null) {
                  pts.push({
                    x: getXCoord(idx),
                    y: getYCoord(sc),
                    score: sc,
                    stageIdx: idx
                  });
                }
              });

              if (pts.length === 0) return null;

              const linePath = makeSmoothPath(pts);

              // Area fill path (khusus single view mode)
              const areaPath =
                viewMode === "single" && pts.length > 1
                  ? `${linePath} L ${pts[pts.length - 1].x} ${getYCoord(minVal)} L ${pts[0].x} ${getYCoord(minVal)} Z`
                  : "";

              return (
                <g key={`student_line_${s.siswa.id}`}>
                  {/* Area gradient under line */}
                  {viewMode === "single" && areaPath && (
                    <path d={areaPath} fill={`url(#area_grad_${s.siswa.id})`} />
                  )}

                  {/* Garis tren utama */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke={s.color.stroke}
                    strokeWidth={viewMode === "single" ? "3.5" : "2.5"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#shadow)"
                  />

                  {/* Titik lingkaran pada setiap asesmen */}
                  {pts.map((pt) => {
                    const stg = assessmentStages[pt.stageIdx];
                    const classAvgAtPt = classAverages[pt.stageIdx] || 0;
                    return (
                      <g
                        key={`pt_${pt.stageIdx}`}
                        className="cursor-pointer group"
                        onMouseEnter={() =>
                          setHoveredPoint({
                            x: pt.x,
                            y: pt.y,
                            studentName: s.siswa.nama,
                            stageName: stg.label,
                            score: pt.score,
                            classAvg: classAvgAtPt,
                            date: stg.date,
                            color: s.color.stroke
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Area sentuh lingkaran yang lebih besar */}
                        <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                        {/* Outer glow circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={viewMode === "single" ? "6" : "5"}
                          fill="#ffffff"
                          stroke={s.color.stroke}
                          strokeWidth="2.5"
                          className="transition-all duration-150 group-hover:scale-125"
                        />

                        {/* Label nilai di atas titik (jika single mode) */}
                        {viewMode === "single" && (
                          <text
                            x={pt.x}
                            y={pt.y - 12}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="bold"
                            fill="currentColor"
                            className="fill-slate-800 dark:fill-white font-mono"
                          >
                            {pt.score}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Label Sumbu X (Tahapan Penilaian) */}
            {assessmentStages.map((stg, idx) => {
              const x = getXCoord(idx);
              const y = svgHeight - paddingBottom + 18;
              return (
                <g key={`x_label_${stg.id}`}>
                  <line
                    x1={x}
                    y1={svgHeight - paddingBottom}
                    x2={x}
                    y2={svgHeight - paddingBottom + 5}
                    stroke="currentColor"
                    className="text-slate-300 dark:text-slate-700"
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    className="fill-slate-700 dark:fill-slate-300"
                  >
                    {stg.label.length > 15 ? `${stg.label.slice(0, 14)}...` : stg.label}
                  </text>
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fontSize="9"
                    className="fill-slate-400"
                  >
                    {stg.date}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card saat Hover */}
          {hoveredPoint && (
            <div
              className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: `${Math.min(Math.max(hoveredPoint.x - 70, 10), svgWidth - 160)}px`,
                top: `${Math.max(hoveredPoint.y - 85, 10)}px`
              }}
            >
              <div className="flex items-center space-x-1.5 border-b border-slate-700 pb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: hoveredPoint.color }}
                />
                <span className="font-extrabold truncate max-w-[140px]">
                  {hoveredPoint.studentName}
                </span>
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div className="text-slate-300 font-semibold">{hoveredPoint.stageName}</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Nilai Siswa:</span>
                  <span className="font-black text-emerald-400 font-mono text-sm">
                    {hoveredPoint.score}
                  </span>
                </div>
                {hoveredPoint.classAvg > 0 && (
                  <div className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="text-slate-400">Rata-rata Kelas:</span>
                    <span className="font-mono text-slate-300">{hoveredPoint.classAvg}</span>
                  </div>
                )}
                <div className="pt-0.5">
                  {hoveredPoint.score >= 75 ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-900/80 text-emerald-300 rounded-sm">
                      Lulus Target KKM (&ge;75)
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-900/80 text-rose-300 rounded-sm">
                      Di Bawah Target KKM (&lt;75)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insight & Sorotan Analisis Kelas */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {/* Top Growth */}
          {insights.topGrowth && (
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start space-x-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Progres Paling Pesat 🚀
                </span>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                  {insights.topGrowth.siswa.nama}
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                  <span>Lonjakan Nilai:</span>
                  <span className="font-black">+{insights.topGrowth.delta} poin</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({insights.topGrowth.firstScore} &rarr; {insights.topGrowth.lastScore})
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalSiswaId(insights.topGrowth.siswa.id);
                    setIsDetailModalOpen(true);
                  }}
                  className="mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Lihat Rincian Nilai &rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Performer */}
          {insights.topAvg && (
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start space-x-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
                  Rata-Rata Tertinggi 🏆
                </span>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                  {insights.topAvg.siswa.nama}
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
                  <span>Rata-rata:</span>
                  <span className="font-black">{insights.topAvg.avgScore}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (Puncak: {insights.topAvg.maxScore})
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalSiswaId(insights.topAvg.siswa.id);
                    setIsDetailModalOpen(true);
                  }}
                  className="mt-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Lihat Rincian Nilai &rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* Need Attention */}
          {insights.needAttention && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-3">
              <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                  Perlu Penguatan Belajar ⚠️
                </span>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                  {insights.needAttention.siswa.nama}
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                  <span>Nilai Terakhir:</span>
                  <span className="font-black">{insights.needAttention.lastScore}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (Butuh remedial/pemantapan)
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalSiswaId(insights.needAttention.siswa.id);
                    setIsDetailModalOpen(true);
                  }}
                  className="mt-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Lihat Rincian Nilai &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabel Ringkasan Tren Semua Siswa */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span>Rekapitulasi Tren Belajar Siswa ({studentTimelineData.length} Siswa)</span>
          </h4>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-3.5 py-2.5">No</th>
                <th className="px-3.5 py-2.5">Nama Siswa</th>
                <th className="px-3.5 py-2.5 text-center">Kelas</th>
                <th className="px-3.5 py-2.5 text-center">Nilai Awal</th>
                <th className="px-3.5 py-2.5 text-center">Nilai Akhir</th>
                <th className="px-3.5 py-2.5 text-center">Delta Tren</th>
                <th className="px-3.5 py-2.5 text-center">Rata-Rata</th>
                <th className="px-3.5 py-2.5 text-center">Status</th>
                <th className="px-3.5 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {studentTimelineData.map((item, idx) => {
                const isSelected = item.siswa.id === selectedSiswaId;
                return (
                  <tr
                    key={item.siswa.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                      isSelected && viewMode === "single"
                        ? "bg-blue-50/50 dark:bg-blue-950/20"
                        : ""
                    }`}
                  >
                    <td className="px-3.5 py-2.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-800 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color.stroke }}
                        />
                        <span>{item.siswa.nama}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-semibold text-slate-500">
                      {item.siswa.kelas}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.firstScore ?? "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      {item.lastScore ?? "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      {item.delta !== null ? (
                        item.delta >= 0 ? (
                          <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-extrabold font-mono text-[11px]">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />+{item.delta}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-extrabold font-mono text-[11px]">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />{item.delta}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-mono font-extrabold text-slate-800 dark:text-white">
                      {item.avgScore ?? "-"}
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      {(item.avgScore ?? 0) >= 75 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Tercapai
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          Perlu Remedial
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSiswaId(item.siswa.id);
                            setViewMode("single");
                          }}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                          title="Lihat Kurva Tren Waktu ke Waktu"
                        >
                          Kurva
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailModalSiswaId(item.siswa.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                          title="Lihat Rincian Nilai Sumatif (50%), UTS (35%), dan UAS (15%)"
                        >
                          <Calculator className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Rincian</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Rincian Nilai Siswa (Sumatif 50%, UTS 35%, UAS 15%) */}
      <RincianNilaiSiswaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        siswaId={detailModalSiswaId}
        siswaList={filteredSiswaList.length > 0 ? filteredSiswaList : siswaList}
        mapelList={mapelList}
        nilaiList={nilaiList}
        initialMapel={selectedMapel !== "ALL" ? selectedMapel : undefined}
        onNavigateToPenilaian={onNavigateToPenilaian}
        onSelectSiswaId={(newId) => setDetailModalSiswaId(newId)}
      />
    </div>
  );
};
