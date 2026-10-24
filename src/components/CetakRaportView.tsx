import React, { useState, useMemo, useRef } from "react";
import {
  Award,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  User,
  BookOpen,
  Calendar,
  Settings,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  School,
  ExternalLink
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Siswa, Mapel, LogAbsensi, DataNilai, Pengaturan } from "../types";
import { categorizeJenisPenilaian } from "./InputPenilaianView";
import { notifyCetakSuccess, notifyCetakError, showToastSuccess } from "../lib/swal";

interface CetakRaportViewProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  absensiList: LogAbsensi[];
  nilaiList: DataNilai[];
  config: Pengaturan;
}

interface MapelNilaiRaport {
  mapel: string;
  avgSumatif: number | null;
  valUts: number | null;
  valUas: number | null;
  nilaiAkhir: number | null;
  predikat: string;
  capaianTinggi: string;
  capaianRendah: string;
}

export const CetakRaportView: React.FC<CetakRaportViewProps> = ({
  siswaList,
  mapelList,
  absensiList,
  nilaiList,
  config
}) => {
  // 1. Filter States
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<"ganjil" | "genap">("ganjil");
  const [tahunAjaran, setTahunAjaran] = useState<string>("2026/2027");

  // 2. Weights & Settings
  const [bobotSumatif, setBobotSumatif] = useState<number>(50);
  const [bobotUts, setBobotUts] = useState<number>(35);
  const [bobotUas, setBobotUas] = useState<number>(15);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isCopiedWa, setIsCopiedWa] = useState<boolean>(false);

  // 3. Custom Tanggal & Catatan Wali
  const [tanggalBagiRapor, setTanggalBagiRapor] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [catatanWaliOverride, setCatatanWaliOverride] = useState<{ [siswaId: string]: string }>({});
  const [ekskulList, setEkskulList] = useState<Array<{ nama: string; predikat: string; ket: string }>>([
    { nama: "Praja Muda Karana (Pramuka)", predikat: "A", ket: "Sangat aktif dan berjiwa kepemimpinan tinggi." },
    { nama: "Palang Merah Remaja (PMR)", predikat: "B", ket: "Mampu mempraktikkan dasar pertolongan pertama dengan baik." }
  ]);

  // Available Classes
  const kelasOptions = useMemo(() => {
    const set = new Set<string>();
    siswaList.forEach((s) => {
      if (s.kelas && s.kelas.trim()) set.add(s.kelas.trim());
    });
    return Array.from(set).sort();
  }, [siswaList]);

  // Set default class if not selected
  React.useEffect(() => {
    if (!selectedKelas && kelasOptions.length > 0) {
      setSelectedKelas(kelasOptions[0]);
    }
  }, [kelasOptions, selectedKelas]);

  // Students in selected class
  const studentsInClass = useMemo(() => {
    if (!selectedKelas) return [];
    return siswaList.filter((s) => s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  // Set default selected student
  React.useEffect(() => {
    if (studentsInClass.length > 0) {
      if (!selectedSiswaId || !studentsInClass.some((s) => s.id === selectedSiswaId)) {
        setSelectedSiswaId(studentsInClass[0].id);
      }
    } else {
      setSelectedSiswaId("");
    }
  }, [studentsInClass, selectedSiswaId]);

  // Selected Student Object
  const currentStudent = useMemo(() => {
    return siswaList.find((s) => s.id === selectedSiswaId) || null;
  }, [siswaList, selectedSiswaId]);

  // Auto detect Fase Kurikulum Merdeka based on Class
  const detectFase = (kelasStr: string): string => {
    const num = parseInt(kelasStr.replace(/\D/g, ""), 10);
    if (!isNaN(num)) {
      if (num === 1 || num === 2) return "Fase A (SD Kelas 1-2)";
      if (num === 3 || num === 4) return "Fase B (SD Kelas 3-4)";
      if (num === 5 || num === 6) return "Fase C (SD Kelas 5-6)";
      if (num >= 7 && num <= 9) return "Fase D (SMP Kelas 7-9)";
      if (num === 10) return "Fase E (SMA/SMK Kelas 10)";
      if (num === 11 || num === 12) return "Fase F (SMA/SMK Kelas 11-12)";
    }
    // Default fallback
    return "Fase D (SMP)";
  };

  // Helper to filter by semester
  const filterBySemester = <T extends { tanggal?: string; waktu?: string; semester?: string }>(
    item: T
  ): boolean => {
    if (item.semester) {
      if (selectedSemester === "ganjil" && item.semester.toLowerCase().includes("ganjil")) return true;
      if (selectedSemester === "genap" && item.semester.toLowerCase().includes("genap")) return true;
    }

    const dateStr = item.waktu || item.tanggal;
    if (!dateStr) return true;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12

    if (selectedSemester === "ganjil") {
      return year === 2026 && month >= 7 && month <= 12;
    } else if (selectedSemester === "genap") {
      return year === 2027 && month >= 1 && month <= 6;
    }

    return true;
  };

  // Compute grades calculation for a student
  const calculateStudentRaporMapels = (student: Siswa): MapelNilaiRaport[] => {
    // Get all mapel names from mapelList + from grades
    const mapelNames = new Set<string>();
    mapelList.forEach((m) => {
      if (m.namaMapel && m.namaMapel.trim()) mapelNames.add(m.namaMapel.trim());
    });

    const studentGrades = nilaiList.filter(
      (n) => (n.idSiswa === student.id || n.idSiswa === student.nisn || (n.namaSiswa && n.namaSiswa.toLowerCase() === student.nama.toLowerCase())) &&
             filterBySemester(n)
    );

    studentGrades.forEach((g) => {
      if (g.mapel && g.mapel.trim()) mapelNames.add(g.mapel.trim());
    });

    const result: MapelNilaiRaport[] = [];
    const listNames = Array.from(mapelNames).sort();

    listNames.forEach((mapelName) => {
      const gradesForMapel = studentGrades.filter(
        (g) => g.mapel && g.mapel.trim().toLowerCase() === mapelName.toLowerCase()
      );

      // Sumatif
      const sumatifItems = gradesForMapel.filter(
        (g) => categorizeJenisPenilaian(g.jenis) === "sumatif" && g.nilai !== "" && g.nilai !== undefined && !isNaN(Number(g.nilai))
      );
      const avgSumatif = sumatifItems.length > 0
        ? Number((sumatifItems.reduce((a, b) => a + Number(b.nilai), 0) / sumatifItems.length).toFixed(1))
        : null;

      // UTS
      const utsItem = gradesForMapel.find(
        (g) => categorizeJenisPenilaian(g.jenis) === "uts" && g.nilai !== "" && g.nilai !== undefined && !isNaN(Number(g.nilai))
      );
      const valUts = utsItem ? Number(utsItem.nilai) : null;

      // UAS
      const uasItem = gradesForMapel.find(
        (g) => categorizeJenisPenilaian(g.jenis) === "uas" && g.nilai !== "" && g.nilai !== undefined && !isNaN(Number(g.nilai))
      );
      const valUas = uasItem ? Number(uasItem.nilai) : null;

      // Calculate NA based on custom weights
      let nilaiAkhir: number | null = null;
      if (avgSumatif !== null || valUts !== null || valUas !== null) {
        const sPart = (avgSumatif !== null ? avgSumatif : 0) * (bobotSumatif / 100);
        const uPart = (valUts !== null ? valUts : 0) * (bobotUts / 100);
        const asPart = (valUas !== null ? valUas : 0) * (bobotUas / 100);
        nilaiAkhir = Number((sPart + uPart + asPart).toFixed(1));
      }

      // Predikat & Capaian Deskripsi Kurikulum Merdeka
      let predikat = "-";
      let capaianTinggi = "Belum ada capaian asesmen yang tercatat.";
      let capaianRendah = "Perlu bimbingan dan keaktifan dalam menyelesaikan tugas.";

      if (nilaiAkhir !== null) {
        if (nilaiAkhir >= 88) {
          predikat = "A";
          capaianTinggi = `Menunjukkan penguasaan yang amat unggul dan komprehensif dalam memahami konsep materi ${mapelName} serta mampu menganalisis permasalahan kontekstual secara mandiri.`;
          capaianRendah = `Pertahankan ketelitian dan konsistensi dalam pendalaman materi tingkat lanjut.`;
        } else if (nilaiAkhir >= 78) {
          predikat = "B";
          capaianTinggi = `Menunjukkan pemahaman yang baik dalam menguasai tujuan pembelajaran ${mapelName} dan aktif menyelesaikan asesmen sumatif dengan tuntas.`;
          capaianRendah = `Perlu penguatan dalam penyelesaian soal tantangan dan latihan berbasis penalaran kritis.`;
        } else if (nilaiAkhir >= 70) {
          predikat = "C";
          capaianTinggi = `Cukup mampu menguasai capaian esensial materi ${mapelName} sesuai kriteria ketuntasan minimal.`;
          capaianRendah = `Perlu pendampingan dan latihan intensif untuk memperkuat pemahaman konsep dasar dan perbaikan nilai.`;
        } else {
          predikat = "D";
          capaianTinggi = `Mulai menunjukkan pemahaman awal pada beberapa materi pembelajaran esensial.`;
          capaianRendah = `Sangat memerlukan pendampingan remedial dan perhatian khusus dalam penguasaan materi inti serta kedisiplinan belajar.`;
        }
      }

      result.push({
        mapel: mapelName,
        avgSumatif,
        valUts,
        valUas,
        nilaiAkhir,
        predikat,
        capaianTinggi,
        capaianRendah
      });
    });

    return result;
  };

  // Compute attendance for a student
  const calculateStudentAbsensi = (student: Siswa) => {
    const studentAbsensi = absensiList.filter(
      (a) => (a.idSiswa === student.id || a.idSiswa === student.nisn || (a.namaSiswa && a.namaSiswa.toLowerCase() === student.nama.toLowerCase())) &&
             filterBySemester(a)
    );

    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let hadir = 0;

    studentAbsensi.forEach((a) => {
      if (a.status === "Sakit") sakit++;
      else if (a.status === "Izin") izin++;
      else if (a.status === "Alpa") alpa++;
      else if (a.status === "Hadir") hadir++;
    });

    return { sakit, izin, alpa, hadir, total: sakit + izin + alpa + hadir };
  };

  // Get current student computed report data
  const currentStudentMapels = useMemo(() => {
    if (!currentStudent) return [];
    return calculateStudentRaporMapels(currentStudent);
  }, [currentStudent, mapelList, nilaiList, selectedSemester, bobotSumatif, bobotUts, bobotUas]);

  const currentStudentAbsensi = useMemo(() => {
    if (!currentStudent) return { sakit: 0, izin: 0, alpa: 0, hadir: 0, total: 0 };
    return calculateStudentAbsensi(currentStudent);
  }, [currentStudent, absensiList, selectedSemester]);

  // Overall statistics for current student
  const overallStats = useMemo(() => {
    const validScores = currentStudentMapels.map((m) => m.nilaiAkhir).filter((v): v is number => v !== null);
    if (validScores.length === 0) return { avg: null, total: 0, count: 0 };
    const total = validScores.reduce((a, b) => a + b, 0);
    const avg = Number((total / validScores.length).toFixed(1));
    return { avg, total: Number(total.toFixed(1)), count: validScores.length };
  }, [currentStudentMapels]);

  // Default Catatan Wali Kelas
  const getCatatanWali = (student: Siswa, avg: number | null): string => {
    if (catatanWaliOverride[student.id]) {
      return catatanWaliOverride[student.id];
    }
    if (avg === null) {
      return "Ananda senantiasa diharapkan dapat mengikuti seluruh proses pembelajaran dan asesmen dengan penuh tanggung jawab.";
    }
    if (avg >= 88) {
      return `Selamat atas prestasi belajar yang sangat membanggakan di semester ${selectedSemester}! Ananda ${student.nama} memiliki daya serap tinggi, kedisiplinan luar biasa, dan kepemimpinan yang terpuji. Pertahankan dan terus kembangkan potensi terbaikmu!`;
    }
    if (avg >= 78) {
      return `Ananda ${student.nama} menunjukkan kemajuan belajar dan akhlak yang sangat baik di kelas. Tingkatkan terus fokus dalam pembelajaran, keaktifan berpendapat, dan konsistensi belajar di rumah untuk meraih hasil yang lebih gemilang.`;
    }
    if (avg >= 70) {
      return `Ananda ${student.nama} telah menyelesaikan target pembelajaran dengan cukup baik. Perbanyak mengulang materi pelajaran di rumah dan jangan ragu bertanya kepada bapak/ibu guru jika mengalami kendala.`;
    }
    return `Ananda ${student.nama} memerlukan perhatian dan pendampingan belajar yang lebih intensif dari pihak orang tua di rumah. Diharapkan untuk lebih disiplin dan tekun dalam menyelesaikan setiap tugas asesmen.`;
  };

  // Copy WhatsApp summary format
  const handleCopyWhatsApp = () => {
    if (!currentStudent) return;
    const catWali = getCatatanWali(currentStudent, overallStats.avg);

    let text = `*LAPORAN HASIL BELAJAR SISWA (RAPOR)*\n`;
    text += `*KURIKULUM MERDEKA - ${config.Nama_Sekolah?.toUpperCase() || "SEKOLAH"}*\n\n`;
    text += `👤 *Nama Siswa*: ${currentStudent.nama}\n`;
    text += `🆔 *NISN*: ${currentStudent.nisn || "-"}\n`;
    text += `🏫 *Kelas*: ${currentStudent.kelas} (${detectFase(currentStudent.kelas)})\n`;
    text += `📅 *Semester*: ${selectedSemester === "ganjil" ? "Ganjil (1)" : "Genap (2)"} - TA ${tahunAjaran}\n\n`;
    text += `📊 *REKAPITULASI NILAI MATA PELAJARAN:*\n`;

    currentStudentMapels.forEach((m, idx) => {
      text += `${idx + 1}. ${m.mapel}: *${m.nilaiAkhir !== null ? m.nilaiAkhir : "-"}* (Predikat: ${m.predikat})\n`;
    });

    text += `\n🎯 *Rata-rata Nilai*: *${overallStats.avg !== null ? overallStats.avg : "-"}*\n`;
    text += `📋 *Ketidakhadiran*: Sakit: ${currentStudentAbsensi.sakit} hari, Izin: ${currentStudentAbsensi.izin} hari, Alpa: ${currentStudentAbsensi.alpa} hari\n\n`;
    text += `💬 *Catatan Wali Kelas*:\n"${catWali}"\n\n`;
    text += `_Diterbitkan oleh: ${config.Nama_Guru || "Wali Kelas"} (${config.Nama_Sekolah || "Sekolah"})_`;

    navigator.clipboard.writeText(text);
    setIsCopiedWa(true);
    showToastSuccess("Format Rapor WhatsApp berhasil disalin ke clipboard!");
    setTimeout(() => setIsCopiedWa(false), 3000);
  };

  // Helper to build official PDF Page for a single student
  const generateStudentReportDoc = (
    doc: jsPDF,
    student: Siswa,
    studentMapels: MapelNilaiRaport[],
    studentAbsensi: { sakit: number; izin: number; alpa: number; hadir: number },
    isNewDoc: boolean = false
  ) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    const pemerintah = (config.Pemerintah || "PEMERINTAH PROVINSI / KABUPATEN").toUpperCase();
    const sekolah = (config.Nama_Sekolah || "SMP NEGERI 3 KERINCI").toUpperCase();
    const alamat = config.Alamat_Sekolah || "Jalan Raya Lintas Sungai Penuh";
    const logoUrl = config.Logo_Kiri || config.Logo_Kanan || "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU";

    // 1. Header Official School Kop
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, "PNG", 14, 10, 20, 20);
      } catch {
        try {
          doc.addImage(logoUrl, "JPEG", 14, 10, 20, 20);
        } catch (e) {
          console.warn("PDF Logo fallback", e);
        }
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(pemerintah, centerX, 14, { align: "center" });
    doc.text("DINAS PENDIDIKAN DAN KEBUDAYAAN", centerX, 19, { align: "center" });
    doc.setFontSize(13);
    doc.text(sekolah, centerX, 25, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(alamat, centerX, 30, { align: "center" });

    // Double Line Border
    doc.setLineWidth(0.8);
    doc.line(14, 33, pageWidth - 14, 33);
    doc.setLineWidth(0.2);
    doc.line(14, 34.2, pageWidth - 14, 34.2);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("LAPORAN HASIL BELAJAR (RAPOR)", centerX, 41, { align: "center" });
    doc.setFontSize(9);
    doc.text(`KURIKULUM MERDEKA - TAHUN AJARAN ${tahunAjaran}`, centerX, 46, { align: "center" });

    // Student Info Grid Box
    doc.setFontSize(8.5);
    const leftColX = 14;
    const rightColX = 115;
    let infoY = 53;

    doc.setFont("helvetica", "normal");
    doc.text("Nama Peserta Didik", leftColX, infoY);
    doc.text(`:  ${student.nama}`, leftColX + 35, infoY);

    doc.text("Kelas / Rombel", rightColX, infoY);
    doc.text(`:  ${student.kelas}`, rightColX + 28, infoY);

    infoY += 5;
    doc.text("NISN / NIS", leftColX, infoY);
    doc.text(`:  ${student.nisn || "-"}`, leftColX + 35, infoY);

    doc.text("Fase", rightColX, infoY);
    doc.text(`:  ${detectFase(student.kelas)}`, rightColX + 28, infoY);

    infoY += 5;
    doc.text("Nama Sekolah", leftColX, infoY);
    doc.text(`:  ${sekolah}`, leftColX + 35, infoY);

    doc.text("Semester", rightColX, infoY);
    doc.text(`:  ${selectedSemester === "ganjil" ? "1 (Ganjil)" : "2 (Genap)"}`, rightColX + 28, infoY);

    infoY += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, infoY, pageWidth - 14, infoY);

    // Table Grades Body
    const tableBody = studentMapels.map((m, idx) => {
      const naStr = m.nilaiAkhir !== null ? String(m.nilaiAkhir) : "-";
      const capaianCombine = `${m.capaianTinggi}\n${m.capaianRendah}`;
      return [
        idx + 1,
        m.mapel,
        naStr,
        m.predikat,
        capaianCombine
      ];
    });

    autoTable(doc, {
      startY: infoY + 3,
      head: [["No", "Mata Pelajaran", "Nilai Akhir", "Predikat", "Capaian Kompetensi (Kurikulum Merdeka)"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        fontSize: 8,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { fontStyle: "bold", cellWidth: 42 },
        2: { halign: "center", fontStyle: "bold", cellWidth: 20 },
        3: { halign: "center", fontStyle: "bold", cellWidth: 16 },
        4: { fontSize: 7, cellWidth: "auto" }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.15,
        valign: "middle"
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          data.cell.styles.textColor = [30, 58, 138];
        }
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 4;

    // Check if remaining space is sufficient for attendance & signatures, if not add page
    if (currentY > 215) {
      doc.addPage();
      currentY = 20;
    }

    // 2 Sub-tables side by side: Ekstrakurikuler & Ketidakhadiran
    const ekskulBody = ekskulList.map((e, i) => [
      i + 1,
      e.nama,
      e.predikat,
      e.ket
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 108 },
      head: [["No", "Ekstrakurikuler", "Predikat", "Keterangan"]],
      body: ekskulBody,
      theme: "grid",
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 7.5, halign: "center" },
      styles: { fontSize: 7, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.15 },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: 32 },
        2: { halign: "center", cellWidth: 14 }
      }
    });

    const ekskulFinalY = (doc as any).lastAutoTable.finalY;

    // Table Ketidakhadiran (Right Column)
    const absensiBody = [
      ["Sakit (S)", `${studentAbsensi.sakit} hari`],
      ["Izin (I)", `${studentAbsensi.izin} hari`],
      ["Tanpa Keterangan (A)", `${studentAbsensi.alpa} hari`]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: 110, right: 14 },
      head: [["Ketidakhadiran", "Jumlah Hari"]],
      body: absensiBody,
      theme: "grid",
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 7.5, halign: "center" },
      styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: [200, 200, 200], lineWidth: 0.15 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 48 },
        1: { halign: "center", cellWidth: 38 }
      }
    });

    const absensiFinalY = (doc as any).lastAutoTable.finalY;
    currentY = Math.max(ekskulFinalY, absensiFinalY) + 4;

    // Catatan Wali Kelas Box
    const avgValid = studentMapels
      .map((m) => m.nilaiAkhir)
      .filter((v): v is number => v !== null);
    const avgNum = avgValid.length > 0 ? Number((avgValid.reduce((a, b) => a + b, 0) / avgValid.length).toFixed(1)) : null;
    const catWali = getCatatanWali(student, avgNum);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Catatan Wali Kelas:", 14, currentY + 3);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY + 5, pageWidth - 28, 14, 2, 2, "FD");
    
    // Split text to fit inside box
    const splitCatatan = doc.splitTextToSize(`"${catWali}"`, pageWidth - 36);
    doc.text(splitCatatan, 18, currentY + 10);

    currentY += 23;

    // Check page budget for 3-party signatures
    if (currentY > 245) {
      doc.addPage();
      currentY = 25;
    }

    // 3 Signatures: Orang Tua, Wali Kelas, Kepala Sekolah
    const tempat = config.Tempat_Tanda_Tangan || "Kerinci";
    const dateFormatted = new Date(tanggalBagiRapor).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const namaGuru = config.Nama_Guru || "Wali Kelas";
    const nipGuru = config.NIP_Guru || "-";
    const kepsek = config.Nama_Kepsek || "Kepala Sekolah";
    const nipKepsek = config.NIP_Kepsek || "-";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    // 1. Orang Tua (Left)
    doc.text("Mengetahui,", 25, currentY);
    doc.text("Orang Tua / Wali Siswa", 25, currentY + 4);
    doc.text("__________________________", 25, currentY + 23);

    // 2. Wali Kelas (Right)
    const rightX = pageWidth - 45;
    doc.text(`${tempat}, ${dateFormatted}`, rightX, currentY, { align: "center" });
    doc.text("Wali Kelas / Guru Pengampu", rightX, currentY + 4, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(namaGuru, rightX, currentY + 23, { align: "center" });
    doc.setFont("helvetica", "normal");
    if (nipGuru && nipGuru !== "-") {
      doc.text(`NIP. ${nipGuru}`, rightX, currentY + 27, { align: "center" });
    }

    // 3. Kepala Sekolah (Centered Bottom)
    const centerSigY = currentY + 15;
    doc.text("Mengetahui,", centerX, centerSigY, { align: "center" });
    doc.text("Kepala Sekolah,", centerX, centerSigY + 4, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(kepsek, centerX, centerSigY + 23, { align: "center" });
    doc.setFont("helvetica", "normal");
    if (nipKepsek && nipKepsek !== "-") {
      doc.text(`NIP. ${nipKepsek}`, centerX, centerSigY + 27, { align: "center" });
    }
  };

  // Export Single Student Report PDF
  const handleExportSinglePDF = () => {
    if (!currentStudent) {
      notifyCetakError("Silakan pilih siswa terlebih dahulu!");
      return;
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");
      generateStudentReportDoc(doc, currentStudent, currentStudentMapels, currentStudentAbsensi);
      const safeName = currentStudent.nama.replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`Rapor_Merdeka_${safeName}_Kelas_${selectedKelas}_${selectedSemester}.pdf`);
      notifyCetakSuccess(`Rapor Siswa atas nama ${currentStudent.nama} berhasil dicetak!`);
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mencetak Rapor Siswa.");
    }
  };

  // Export Batch All Students in Class to a Single Multi-Page PDF
  const handleExportBatchClassPDF = () => {
    if (studentsInClass.length === 0) {
      notifyCetakError(`Tidak ada siswa di kelas ${selectedKelas}.`);
      return;
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");

      studentsInClass.forEach((student, index) => {
        if (index > 0) {
          doc.addPage();
        }
        const studentMapels = calculateStudentRaporMapels(student);
        const studentAbsensi = calculateStudentAbsensi(student);
        generateStudentReportDoc(doc, student, studentMapels, studentAbsensi);
      });

      doc.save(`Buku_Rapor_Massal_Kelas_${selectedKelas}_${selectedSemester}.pdf`);
      notifyCetakSuccess(`Buku Rapor Massal untuk seluruh siswa Kelas ${selectedKelas} (${studentsInClass.length} siswa) berhasil diunduh!`);
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mengunduh Rapor Massal.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none">
      {/* Header Banner Cyber HUD */}
      <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 text-white border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/15 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-400/30 mb-3 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>KURIKULUM MERDEKA &bull; VERSI RESMI KEMDIKBUD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3 font-display bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
              <Award className="w-8 h-8 text-amber-400 shrink-0" />
              Cetak Rapor Hasil Belajar Siswa
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Format lembar laporan hasil belajar Kurikulum Merdeka resmi lengkap dengan Deskripsi Capaian Pembelajaran,
              pembobotan nilai otomatis (Sumatif, STS, SAS), rekap kehadiran, dan catatan wali kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer font-mono shadow-xs"
            >
              <Settings className="w-4 h-4 text-cyan-300" />
              <span>Bobot Nilai ({bobotSumatif}% : {bobotUts}% : {bobotUas}%)</span>
            </button>

            <button
              onClick={handleExportBatchClassPDF}
              disabled={studentsInClass.length === 0}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 font-display"
            >
              <Users className="w-4 h-4" />
              <span>Cetak 1 Kelas ({studentsInClass.length} Siswa)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter & Selection Bar */}
      <div className="glass-card rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-white/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Pilih Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
              <School className="w-3.5 h-3.5 text-cyan-500" />
              <span>Pilih Kelas</span>
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-cyan-200 outline-none focus:border-cyan-500 cursor-pointer font-sans"
            >
              {kelasOptions.map((k) => (
                <option key={k} value={k}>
                  Kelas {k} ({siswaList.filter((s) => s.kelas === k).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Pilih Siswa */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
              <User className="w-3.5 h-3.5 text-cyan-500" />
              <span>Pilih Siswa</span>
            </label>
            <select
              value={selectedSiswaId}
              onChange={(e) => setSelectedSiswaId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-cyan-200 outline-none focus:border-cyan-500 cursor-pointer font-sans"
            >
              {studentsInClass.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  {idx + 1}. {s.nama} ({s.nisn || "No NISN"})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Semester */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              <span>Semester</span>
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-cyan-200 outline-none focus:border-cyan-500 cursor-pointer font-sans"
            >
              <option value="ganjil">Semester Ganjil 1 (Juli - Des 2026)</option>
              <option value="genap">Semester Genap 2 (Jan - Jun 2027)</option>
            </select>
          </div>

          {/* 4. Tanggal Bagi Rapor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span>Tanggal Bagi Rapor</span>
            </label>
            <input
              type="date"
              value={tanggalBagiRapor}
              onChange={(e) => setTanggalBagiRapor(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-cyan-200 outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-700 dark:text-slate-300">Fase Kurikulum:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-mono font-bold text-[11px]">
              {selectedKelas ? detectFase(selectedKelas) : "-"}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Tahun Ajaran: <strong className="text-slate-800 dark:text-slate-200">{tahunAjaran}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-mono"
              title="Salin ringkasan rapor ke WhatsApp"
            >
              {isCopiedWa ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{isCopiedWa ? "Tersalin!" : "Format Rapor WA"}</span>
            </button>

            <button
              onClick={() => window.print()}
              disabled={!currentStudent}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-mono border border-slate-300 dark:border-white/10"
              title="Cetak langsung menggunakan dialog print browser"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Cetak Cepat Browser</span>
            </button>

            <button
              onClick={handleExportSinglePDF}
              disabled={!currentStudent}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 font-display"
            >
              <Download className="w-4 h-4 text-cyan-200" />
              <span>Cetak PDF Siswa Ini</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Paper Preview - Authentic Kurikulum Merdeka Style */}
      {currentStudent ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200 dark:border-slate-800 space-y-6 print-rapor-sheet">
          {/* Watermark / Paper border style */}
          <div className="border-4 border-slate-800/10 dark:border-slate-700/30 rounded-2xl p-6 sm:p-8 bg-white dark:bg-slate-900 space-y-6">
            
            {/* Kop Surat Header */}
            <div className="flex items-center gap-5 border-b-2 border-slate-800 pb-4">
              {config.Logo_Kiri && (
                <img
                  src={config.Logo_Kiri}
                  alt="Logo Sekolah"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
                />
              )}
              <div className="flex-1 text-center">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-wider uppercase">
                  {config.Pemerintah || "PEMERINTAH PROVINSI / KABUPATEN"}
                </h4>
                <h5 className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  DINAS PENDIDIKAN DAN KEBUDAYAAN
                </h5>
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-0.5">
                  {config.Nama_Sekolah || "SMP NEGERI 3 KERINCI"}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {config.Alamat_Sekolah || "Jalan Raya Lintas Sungai Penuh"}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                LAPORAN HASIL BELAJAR (RAPOR)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                Kurikulum Merdeka • Semester {selectedSemester === "ganjil" ? "1 (Ganjil)" : "2 (Genap)"} • Tahun Ajaran {tahunAjaran}
              </p>
            </div>

            {/* Student Info Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 py-1">
                <span className="text-slate-500 dark:text-slate-400">Nama Peserta Didik</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentStudent.nama}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 py-1">
                <span className="text-slate-500 dark:text-slate-400">Kelas / Rombel</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentStudent.kelas}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 py-1">
                <span className="text-slate-500 dark:text-slate-400">NISN / NIS</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentStudent.nisn || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 py-1">
                <span className="text-slate-500 dark:text-slate-400">Fase Kurikulum</span>
                <span className="font-bold text-slate-900 dark:text-white">{detectFase(currentStudent.kelas)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Nama Sekolah</span>
                <span className="font-bold text-slate-900 dark:text-white">{config.Nama_Sekolah || "Sekolah"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Semester</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedSemester === "ganjil" ? "1 (Ganjil)" : "2 (Genap)"}
                </span>
              </div>
            </div>

            {/* Tabel Capaian Nilai Rapor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>A. Capaian Hasil Belajar Mata Pelajaran</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Bobot Nilai: Sumatif {bobotSumatif}% | UTS {bobotUts}% | UAS {bobotUas}%
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-white font-bold text-center">
                    <tr>
                      <th className="py-2.5 px-2 w-10 border-r border-slate-700">No</th>
                      <th className="py-2.5 px-3 text-left w-48 border-r border-slate-700">Mata Pelajaran</th>
                      <th className="py-2.5 px-2 w-20 border-r border-slate-700">Nilai Akhir</th>
                      <th className="py-2.5 px-2 w-16 border-r border-slate-700">Predikat</th>
                      <th className="py-2.5 px-3 text-left">Capaian Kompetensi (Kurikulum Merdeka)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {currentStudentMapels.map((m, idx) => (
                      <tr key={m.mapel} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-2 text-center font-bold text-slate-500 border-r border-slate-200 dark:border-slate-800">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                          {m.mapel}
                        </td>
                        <td className="py-2.5 px-2 text-center font-black text-blue-700 dark:text-blue-400 border-r border-slate-200 dark:border-slate-800">
                          {m.nilaiAkhir !== null ? m.nilaiAkhir : "-"}
                        </td>
                        <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-black text-[11px] ${
                            m.predikat === "A" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                            m.predikat === "B" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                            m.predikat === "C" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                            "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          }`}>
                            {m.predikat}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] leading-relaxed space-y-1">
                          <p className="text-slate-700 dark:text-slate-300">
                            • {m.capaianTinggi}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                            • {m.capaianRendah}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {overallStats.avg !== null && (
                    <tfoot className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right">
                          RATA-RATA NILAI KESELURUHAN:
                        </td>
                        <td className="py-2.5 px-2 text-center text-sm font-black text-blue-800 dark:text-blue-300">
                          {overallStats.avg}
                        </td>
                        <td colSpan={2} className="py-2.5 px-3 text-[11px] text-slate-500">
                          Dihitung dari total {overallStats.count} mata pelajaran yang terdata
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* B. Ekstrakurikuler & C. Ketidakhadiran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Ekstrakurikuler */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  B. Kegiatan Ekstrakurikuler
                </h4>
                <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-white font-bold text-center">
                      <tr>
                        <th className="py-2 px-2 w-8">No</th>
                        <th className="py-2 px-2.5 text-left">Kegiatan</th>
                        <th className="py-2 px-2 w-14">Predikat</th>
                        <th className="py-2 px-2.5 text-left">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {ekskulList.map((e, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-2 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-bold">{e.nama}</td>
                          <td className="py-2 px-2 text-center font-black text-emerald-600">{e.predikat}</td>
                          <td className="py-2 px-2.5 text-[11px] text-slate-600 dark:text-slate-400">{e.ket}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ketidakhadiran */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  C. Ketidakhadiran
                </h4>
                <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800 text-white font-bold text-center">
                      <tr>
                        <th className="py-2 px-3 text-left">Kriteria Presensi</th>
                        <th className="py-2 px-3 w-28">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Sakit (S)</td>
                        <td className="py-2 px-3 text-center font-bold">{currentStudentAbsensi.sakit} hari</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Izin (I)</td>
                        <td className="py-2 px-3 text-center font-bold">{currentStudentAbsensi.izin} hari</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Tanpa Keterangan (A)</td>
                        <td className="py-2 px-3 text-center font-bold text-rose-600">{currentStudentAbsensi.alpa} hari</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* D. Catatan Wali Kelas */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  D. Catatan Wali Kelas
                </h4>
                <span className="text-[10px] text-slate-400">Dapat diedit langsung sebelum dicetak</span>
              </div>
              <textarea
                value={getCatatanWali(currentStudent, overallStats.avg)}
                onChange={(e) => {
                  setCatatanWaliOverride((prev) => ({
                    ...prev,
                    [currentStudent.id]: e.target.value
                  }));
                }}
                rows={3}
                className="w-full p-3.5 text-xs italic bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>

            {/* Tanda Tangan Tiga Pihak */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                {/* 1. Orang Tua */}
                <div className="space-y-12">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Mengetahui,</p>
                    <p className="font-bold text-slate-800 dark:text-white">Orang Tua / Wali Siswa</p>
                  </div>
                  <div>
                    <div className="w-32 mx-auto border-b border-slate-400 dark:border-slate-600" />
                    <p className="text-[10px] text-slate-400 mt-1">Tanda Tangan & Nama Terang</p>
                  </div>
                </div>

                {/* 2. Kepala Sekolah */}
                <div className="space-y-12">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Mengetahui,</p>
                    <p className="font-bold text-slate-800 dark:text-white">Kepala Sekolah</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white underline">
                      {config.Nama_Kepsek || "Nama Kepala Sekolah"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      NIP. {config.NIP_Kepsek || "19800101 200501 1 001"}
                    </p>
                  </div>
                </div>

                {/* 3. Wali Kelas */}
                <div className="space-y-12">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {config.Tempat_Tanda_Tangan || "Kerinci"},{" "}
                      {new Date(tanggalBagiRapor).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                    <p className="font-bold text-slate-800 dark:text-white">Wali Kelas / Guru Pengampu</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white underline">
                      {config.Nama_Guru || "Nama Wali Kelas"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      NIP. {config.NIP_Guru || "19900101 201501 1 002"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center text-slate-500 border border-slate-200 dark:border-slate-800">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Belum Ada Siswa Dipilih</h3>
          <p className="text-xs text-slate-400 mt-1">Pilih kelas dan siswa pada bilah opsi di atas untuk menampilkan pratinjau rapor.</p>
        </div>
      )}

      {/* Settings Modal - Kustomisasi Bobot Nilai */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Pengaturan Pembobotan Nilai Rapor</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sesuaikan bobot persentase perhitungan Nilai Akhir (NA) sesuai ketentuan satuan pendidikan Anda. Total harus 100%.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-blue-700 dark:text-blue-400">Bobot Sumatif Materi (Tugas & UH)</span>
                  <span className="font-extrabold">{bobotSumatif}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={bobotSumatif}
                  onChange={(e) => setBobotSumatif(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-700 dark:text-amber-400">Bobot STS / UTS (Tengah Semester)</span>
                  <span className="font-extrabold">{bobotUts}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={bobotUts}
                  onChange={(e) => setBobotUts(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-purple-700 dark:text-purple-400">Bobot SAS / UAS (Akhir Semester)</span>
                  <span className="font-extrabold">{bobotUas}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={bobotUas}
                  onChange={(e) => setBobotUas(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
                bobotSumatif + bobotUts + bobotUas === 100
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border border-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 border border-rose-300"
              }`}>
                <span>Total Akumulasi Bobot:</span>
                <span className="text-sm font-extrabold">{bobotSumatif + bobotUts + bobotUas}%</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setBobotSumatif(50);
                  setBobotUts(35);
                  setBobotUas(15);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Reset Default (50:35:15)
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                Simpan & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
