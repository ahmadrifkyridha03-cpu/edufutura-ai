import React, { useState } from "react";
import { Printer, FileText, Download, FileSpreadsheet, Calendar, Award, Sparkles, ChevronRight } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Siswa, Mapel, LogAbsensi, DataNilai, JurnalAgenda, BimbinganWali, Pengaturan } from "../types";
import { notifyCetakSuccess, notifyCetakError } from "../lib/swal";

interface PusatLaporanViewProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  absensiList: LogAbsensi[];
  nilaiList: DataNilai[];
  agendaList: JurnalAgenda[];
  bimbinganList: BimbinganWali[];
  config: Pengaturan;
  onNavigateToRaport?: () => void;
}

export const PusatLaporanView: React.FC<PusatLaporanViewProps> = ({
  siswaList,
  mapelList,
  absensiList,
  nilaiList,
  agendaList,
  bimbinganList,
  config,
  onNavigateToRaport
}) => {
  // Global Semester Filter State
  const [selectedSemester, setSelectedSemester] = useState<"semua" | "ganjil" | "genap">("ganjil");

  const [selectedAbsensiKelas, setSelectedAbsensiKelas] = useState("");
  const [selectedAbsensiMapel, setSelectedAbsensiMapel] = useState("");

  const [selectedNilaiKelas, setSelectedNilaiKelas] = useState("");
  const [selectedNilaiMapel, setSelectedNilaiMapel] = useState("");

  // Riwayat Harian Absensi Filters
  const [riwayatAbsensiTanggal, setRiwayatAbsensiTanggal] = useState<string>("");
  const [riwayatAbsensiKelas, setRiwayatAbsensiKelas] = useState("");

  // Riwayat Input Nilai Filters
  const [riwayatNilaiKelas, setRiwayatNilaiKelas] = useState("");
  const [riwayatNilaiMapel, setRiwayatNilaiMapel] = useState("");

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();

  // Helper function to filter records by semester
  const filterBySemester = <T extends { tanggal?: string; waktu?: string; created?: string; semester?: string }>(
    item: T,
    sem: "semua" | "ganjil" | "genap"
  ): boolean => {
    if (sem === "semua") return true;

    // Check direct semester string if populated
    if (item.semester) {
      if (sem === "ganjil" && item.semester.toLowerCase().includes("ganjil")) return true;
      if (sem === "genap" && item.semester.toLowerCase().includes("genap")) return true;
    }

    // Check date range
    const dateStr = item.waktu || item.tanggal || item.created;
    if (!dateStr) return true;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12

    if (sem === "ganjil") {
      // Juli - Desember 2026
      return year === 2026 && month >= 7 && month <= 12;
    } else if (sem === "genap") {
      // Januari - Juni 2027
      return year === 2027 && month >= 1 && month <= 6;
    }

    return true;
  };

  const getSemesterLabel = (sem: "semua" | "ganjil" | "genap") => {
    if (sem === "ganjil") return "SEMESTER GANJIL TA 2026/2027 (JULI - DESEMBER 2026)";
    if (sem === "genap") return "SEMESTER GENAP TA 2026/2027 (JANUARI - JUNI 2027)";
    return "SEMUA PERIODE";
  };

  // Helper to generate official PDF Header & Footer
  const applyOfficialKop = (doc: jsPDF, title: string, isLandscape = false) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    const pemerintah = (config.Pemerintah || "PEMERINTAH PROVINSI / KABUPATEN").toUpperCase();
    const sekolah = (config.Nama_Sekolah || "SMA NEGERI 1 KOTA").toUpperCase();
    const alamat = config.Alamat_Sekolah || "Jalan Pendidikan No. 1";
    const logoUrl = config.Logo_Kiri || config.Logo_Kanan || "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU";

    // Top-Left School Logo Image (Positioned close to centered header text)
    if (logoUrl) {
      const logoWidth = 22;
      const logoHeight = 22;
      const logoX = Math.max(12, centerX - 62);
      try {
        doc.addImage(logoUrl, "PNG", logoX, 10, logoWidth, logoHeight);
      } catch {
        try {
          doc.addImage(logoUrl, "JPEG", logoX, 10, logoWidth, logoHeight);
        } catch (e) {
          console.warn("Notice: PDF logo addImage handled gracefully", e);
        }
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(pemerintah, centerX, 15, { align: "center" });
    doc.text("DINAS PENDIDIKAN DAN KEBUDAYAAN", centerX, 21, { align: "center" });

    doc.setFontSize(14);
    doc.text(sekolah, centerX, 28, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(alamat, centerX, 34, { align: "center" });

    // Double dividing line
    doc.setLineWidth(1);
    doc.line(10, 38, pageWidth - 10, 38);
    doc.setLineWidth(0.3);
    doc.line(10, 39.5, pageWidth - 10, 39.5);

    // Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), centerX, 48, { align: "center" });
  };

  const applySignatures = (doc: jsPDF, lastY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = lastY + 20;
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    const kepsek = config.Nama_Kepsek || "Nama Kepala Sekolah, M.Pd.";
    const nipKepsek = config.NIP_Kepsek || "19800101 200501 1 001";
    const namaGuru = config.Nama_Guru || "Nama Guru Pengampu";
    const nipGuru = config.NIP_Guru || "19900101 201501 1 002";
    const tempat = config.Tempat_Tanda_Tangan || "Kota";

    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Left Signature (Kepala Sekolah)
    doc.text("Mengetahui,", 20, y);
    doc.text("Kepala Sekolah", 20, y + 5);
    doc.setFont("helvetica", "bold");
    doc.text(kepsek, 20, y + 30);
    doc.setFont("helvetica", "normal");
    if (nipKepsek) doc.text("NIP. " + nipKepsek, 20, y + 36);

    // Right Signature (Guru)
    const rightX = pageWidth - 60;
    doc.text(`${tempat}, ${dateStr}`, rightX, y, { align: "center" });
    doc.text("Guru Mata Pelajaran / Wali", rightX, y + 5, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(namaGuru, rightX, y + 30, { align: "center" });
    doc.setFont("helvetica", "normal");
    if (nipGuru) doc.text("NIP. " + nipGuru, rightX, y + 36, { align: "center" });
  };

  // 1. Export Absensi Rekap PDF
  const handleExportAbsensiPDF = () => {
    if (!selectedAbsensiKelas || !selectedAbsensiMapel) {
      notifyCetakError("Pilih kelas dan mata pelajaran terlebih dahulu!");
      return;
    }

    try {
      const filteredAbsensi = absensiList.filter((a) => filterBySemester(a, selectedSemester));

      const doc = new jsPDF("p", "mm", "a4");
      const semTitle = selectedSemester === "ganjil" ? " (SEMESTER GANJIL TA 2026/2027)" : selectedSemester === "genap" ? " (SEMESTER GENAP TA 2026/2027)" : "";
      applyOfficialKop(doc, `REKAPITULASI ABSENSI SISWA - KELAS ${selectedAbsensiKelas}${semTitle}`);

      doc.setFontSize(9);
      doc.text(`Mata Pelajaran: ${selectedAbsensiMapel}`, 15, 55);

      const students = siswaList.filter((s) => s.kelas === selectedAbsensiKelas);
      const tableBody = students.map((s, idx) => {
        const records = filteredAbsensi.filter(
          (a) => a.kelas === selectedAbsensiKelas && a.mapel === selectedAbsensiMapel && (a.idSiswa === s.id || a.idSiswa === s.nisn)
        );

        let H = 0, I = 0, S = 0, A = 0;
        records.forEach((r) => {
          if (r.status === "Hadir") H++;
          else if (r.status === "Izin") I++;
          else if (r.status === "Sakit") S++;
          else if (r.status === "Alpa") A++;
        });

        const total = H + I + S + A;
        const pct = total > 0 ? Math.round((H / total) * 100) : 0;

        return [idx + 1, s.nisn, s.nama, H, I, S, A, `${pct}%`];
      });

      autoTable(doc, {
        startY: 60,
        head: [["No", "NISN", "Nama Siswa", "Hadir (H)", "Izin (I)", "Sakit (S)", "Alpa (A)", "Persentase"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 100;
      applySignatures(doc, finalY);

      doc.save(`Laporan_Absensi_${selectedAbsensiKelas}_${selectedAbsensiMapel}_${selectedSemester}.pdf`);
      notifyCetakSuccess(`Laporan Absensi Kelas ${selectedAbsensiKelas} berhasil diunduh!`);
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mencetak Laporan Absensi.");
    }
  };

  // 2. Export Leger Nilai PDF
  const handleExportLegerPDF = () => {
    if (!selectedNilaiKelas || !selectedNilaiMapel) {
      notifyCetakError("Pilih kelas dan mata pelajaran terlebih dahulu!");
      return;
    }

    try {
      const doc = new jsPDF("l", "mm", "a4");
      const semTitle = selectedSemester === "ganjil" ? " (SEMESTER GANJIL TA 2026/2027)" : selectedSemester === "genap" ? " (SEMESTER GENAP TA 2026/2027)" : "";
      applyOfficialKop(doc, `LEGER NILAI AKADEMIK - KELAS ${selectedNilaiKelas}${semTitle}`, true);

      doc.setFontSize(9);
      doc.text(`Mata Pelajaran: ${selectedNilaiMapel}`, 15, 55);

      const students = siswaList.filter((s) => s.kelas === selectedNilaiKelas);
      const rawGrades = nilaiList.filter(
        (n) => n.kelas === selectedNilaiKelas && n.mapel === selectedNilaiMapel && filterBySemester(n, selectedSemester)
      );

      const testTypes: string[] = Array.from(new Set(rawGrades.map((g) => g.jenis).filter(Boolean) as string[])).sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }));

      const isSumatif = (j: string) => {
        const l = j.toLowerCase();
        return !l.includes("uts") && !l.includes("uas") && !l.includes("sts") && !l.includes("sas");
      };
      const sumatifTypes = testTypes.filter(isSumatif);
      const displaySumatif = sumatifTypes.length > 0 ? sumatifTypes : ["Sumatif 1"];

      // Multi-Level Colored Headers persis seperti preview website
      const headRows = [
        [
          { content: "No", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" } },
          { content: "NISN", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" } },
          { content: "Nama Lengkap Siswa", rowSpan: 2, styles: { halign: "left", valign: "middle", fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" } },
          { content: "SUMATIF MATERI (BOBOT 50%)", colSpan: displaySumatif.length + 1, styles: { halign: "center", fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" } },
          { content: "UTS (35%)", colSpan: 1, styles: { halign: "center", fillColor: [180, 83, 9], textColor: 255, fontStyle: "bold" } },
          { content: "UAS (15%)", colSpan: 1, styles: { halign: "center", fillColor: [107, 33, 168], textColor: 255, fontStyle: "bold" } },
          { content: "HASIL AKHIR & CAPAIAN", colSpan: 3, styles: { halign: "center", fillColor: [6, 95, 70], textColor: 255, fontStyle: "bold" } }
        ],
        [
          ...displaySumatif.map(t => ({ content: t, styles: { halign: "center", fillColor: [239, 246, 255], textColor: [30, 64, 175], fontStyle: "bold" } })),
          { content: "Rata (50%)", styles: { halign: "center", fillColor: [219, 234, 254], textColor: [23, 37, 84], fontStyle: "bold" } },
          { content: "Nilai UTS", styles: { halign: "center", fillColor: [254, 243, 199], textColor: [120, 53, 15], fontStyle: "bold" } },
          { content: "Nilai UAS", styles: { halign: "center", fillColor: [243, 232, 255], textColor: [88, 28, 135], fontStyle: "bold" } },
          { content: "Nilai Akhir", styles: { halign: "center", fillColor: [209, 250, 229], textColor: [6, 78, 59], fontStyle: "bold" } },
          { content: "Predikat", styles: { halign: "center", fillColor: [209, 250, 229], textColor: [6, 78, 59], fontStyle: "bold" } },
          { content: "Keterangan", styles: { halign: "center", fillColor: [209, 250, 229], textColor: [6, 78, 59], fontStyle: "bold" } }
        ]
      ];

      const tableBody = students.map((s, idx) => {
        const studentGrades = rawGrades.filter((g) => g.idSiswa === s.id || g.idSiswa === s.nisn);

        const sumatifVals = displaySumatif.map((t) => {
          const found = studentGrades.find((g) => g.jenis === t);
          if (found && typeof found.nilai === "number") {
            return found.nilai;
          }
          return "-";
        });

        // Hitung bobot 50% Sumatif, 35% UTS, 15% UAS
        const sumatifItems = studentGrades.filter((g) => isSumatif(g.jenis) && typeof g.nilai === "number");
        const avgSumatif = sumatifItems.length > 0
          ? Number((sumatifItems.reduce((a, b) => a + Number(b.nilai), 0) / sumatifItems.length).toFixed(1))
          : null;

        const utsItem = studentGrades.find((g) => g.jenis.toLowerCase().includes("uts") && typeof g.nilai === "number");
        const valUts = utsItem ? Number(utsItem.nilai) : null;

        const uasItem = studentGrades.find((g) => g.jenis.toLowerCase().includes("uas") && typeof g.nilai === "number");
        const valUas = uasItem ? Number(uasItem.nilai) : null;

        let na: number | null = null;
        if (avgSumatif !== null || valUts !== null || valUas !== null) {
          const sPart = (avgSumatif || 0) * 0.50;
          const uPart = (valUts || 0) * 0.35;
          const asPart = (valUas || 0) * 0.15;
          na = Number((sPart + uPart + asPart).toFixed(1));
        }

        const predikat = na === null ? "-" : na >= 88 ? "A" : na >= 78 ? "B" : na >= 70 ? "C" : "D";
        const keterangan = na === null ? "-" : na >= 88 ? "Sangat Baik" : na >= 78 ? "Baik" : na >= 70 ? "Cukup" : "Perlu Bimbingan";

        return [
          idx + 1, 
          s.nisn || "-", 
          s.nama, 
          ...sumatifVals, 
          avgSumatif !== null ? avgSumatif : "-", 
          valUts !== null ? valUts : "-", 
          valUas !== null ? valUas : "-", 
          na !== null ? na : "-", 
          predikat,
          keterangan
        ];
      });

      autoTable(doc, {
        startY: 60,
        head: headRows as any,
        body: tableBody,
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 2, lineColor: [203, 213, 225], lineWidth: 0.2 },
        didParseCell: (data) => {
          if (data.section === "body") {
            const naColIndex = 3 + displaySumatif.length + 3; // NA index
            const predikatColIndex = naColIndex + 1;
            if (data.column.index === naColIndex) {
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.textColor = [6, 95, 70];
              data.cell.styles.fontStyle = "bold";
            } else if (data.column.index === predikatColIndex) {
              const val = String(data.cell.raw);
              if (val === "A") {
                data.cell.styles.fillColor = [220, 252, 231];
                data.cell.styles.textColor = [22, 101, 52];
              } else if (val === "B") {
                data.cell.styles.fillColor = [219, 234, 254];
                data.cell.styles.textColor = [30, 64, 175];
              } else if (val === "C") {
                data.cell.styles.fillColor = [254, 243, 199];
                data.cell.styles.textColor = [133, 77, 14];
              } else if (val === "D") {
                data.cell.styles.fillColor = [254, 226, 226];
                data.cell.styles.textColor = [153, 27, 27];
              }
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.halign = "center";
            }
          }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 100;
      applySignatures(doc, finalY);

      doc.save(`Leger_Nilai_${selectedNilaiKelas}_${selectedNilaiMapel}_${selectedSemester}.pdf`);
      notifyCetakSuccess(`Leger Nilai Kelas ${selectedNilaiKelas} berhasil diunduh!`);
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mencetak Leger Nilai.");
    }
  };

  // 3. Export Agenda Mengajar PDF
  const handleExportAgendaPDF = () => {
    try {
      const doc = new jsPDF("l", "mm", "a4");
      const semTitle = selectedSemester === "ganjil" ? " (SEMESTER GANJIL TA 2026/2027)" : selectedSemester === "genap" ? " (SEMESTER GENAP TA 2026/2027)" : "";
      applyOfficialKop(doc, `JURNAL AGENDA MENGAJAR HARIAN GURU${semTitle}`, true);

      const filteredAgenda = agendaList.filter((a) => filterBySemester(a, selectedSemester));

      const tableBody = filteredAgenda.map((a, idx) => [
        idx + 1,
        a.tanggal,
        a.jam,
        `${a.kelas} - ${a.mapel}`,
        a.materi,
        a.status,
        a.absenSiswa || "-",
        a.ket || "-"
      ]);

      autoTable(doc, {
        startY: 55,
        head: [["No", "Tanggal", "Jam", "Kelas & Mapel", "Materi Pembelajaran", "Status", "Absen Siswa", "Keterangan"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 100;
      applySignatures(doc, finalY);

      doc.save(`Jurnal_Agenda_Mengajar_${selectedSemester}.pdf`);
      notifyCetakSuccess("Jurnal Agenda Mengajar berhasil diunduh!");
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mencetak Jurnal Agenda.");
    }
  };

  // 4. Export Bimbingan Wali PDF
  const handleExportBimbinganPDF = () => {
    try {
      const doc = new jsPDF("l", "mm", "a4");
      const semTitle = selectedSemester === "ganjil" ? " (SEMESTER GANJIL TA 2026/2027)" : selectedSemester === "genap" ? " (SEMESTER GENAP TA 2026/2027)" : "";
      applyOfficialKop(doc, `LAPORAN CATATAN BIMBINGAN GURU WALI${semTitle}`, true);

      const filteredBimbingan = bimbinganList.filter((b) => filterBySemester(b, selectedSemester));

      const tableBody = filteredBimbingan.map((b, idx) => [
        idx + 1,
        b.tanggal,
        b.namaSiswa,
        b.kelas,
        b.jenis,
        b.kasus,
        b.tindakLanjut
      ]);

      autoTable(doc, {
        startY: 55,
        head: [["No", "Tanggal", "Nama Siswa", "Kelas", "Jenis Masalah", "Deskripsi Kasus", "Solusi & Tindak Lanjut"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 100;
      applySignatures(doc, finalY);

      doc.save(`Laporan_Bimbingan_Guru_Wali_${selectedSemester}.pdf`);
      notifyCetakSuccess("Laporan Bimbingan Guru Wali berhasil diunduh!");
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mencetak Laporan Bimbingan.");
    }
  };

  // 5. Export Riwayat Harian Absensi PDF
  const handleExportRiwayatAbsensiPDF = () => {
    let filtered = absensiList.filter((a) => filterBySemester(a, selectedSemester));
    if (riwayatAbsensiTanggal) {
      filtered = filtered.filter(
        (a) => a.waktu === riwayatAbsensiTanggal || a.tanggal === riwayatAbsensiTanggal
      );
    }
    if (riwayatAbsensiKelas) {
      filtered = filtered.filter((a) => a.kelas === riwayatAbsensiKelas);
    }

    if (filtered.length === 0) {
      notifyCetakError("Tidak ada data riwayat absensi untuk kriteria dan semester yang dipilih.");
      return;
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const semTitle = selectedSemester === "ganjil" ? " (SEMESTER GANJIL TA 2026/2027)" : selectedSemester === "genap" ? " (SEMESTER GENAP TA 2026/2027)" : "";
      const subTitle = `RIWAYAT HARIAN ABSENSI SISWA - ${
        riwayatAbsensiTanggal ? `TANGGAL ${riwayatAbsensiTanggal}` : "SEMUA TANGGAL"
      }${riwayatAbsensiKelas ? ` (KELAS ${riwayatAbsensiKelas})` : ""}${semTitle}`;
      applyOfficialKop(doc, subTitle);

      const tableBody = filtered.map((a, idx) => [
        idx + 1,
        a.waktu || a.tanggal || "-",
        a.kelas || "-",
        a.mapel || "-",
        a.idSiswa || "-",
        a.namaSiswa || "-",
        a.status || "Hadir"
      ]);

      autoTable(doc, {
        startY: 55,
        head: [["No", "Tanggal", "Kelas", "Mata Pelajaran", "ID/NISN", "Nama Siswa", "Status"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 100;
      applySignatures(doc, finalY);

      doc.save(`Riwayat_Absensi_${riwayatAbsensiTanggal || "All"}_${selectedSemester}.pdf`);
      notifyCetakSuccess("Laporan Riwayat Absensi berhasil diunduh!");
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mencetak Riwayat Absensi.");
    }
  };

  // 6. Export Riwayat Input Nilai Akademik PDF
  const handleExportRiwayatNilaiPDF = () => {
    let filtered = nilaiList.filter((n) => filterBySemester(n, selectedSemester));
    if (riwayatNilaiKelas) {
      filtered = filtered.filter((n) => n.kelas === riwayatNilaiKelas);
    }
    if (riwayatNilaiMapel) {
      filtered = filtered.filter((n) => n.mapel === riwayatNilaiMapel);
    }

    if (filtered.length === 0) {
      notifyCetakError("Tidak ada data riwayat input nilai untuk kriteria dan semester yang dipilih.");
      return;
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const semTitle = selectedSemester === "ganjil" ? " (SEMESTER GANJIL TA 2026/2027)" : selectedSemester === "genap" ? " (SEMESTER GENAP TA 2026/2027)" : "";
      const subTitle = `RIWAYAT INPUT NILAI AKADEMIK ${
        riwayatNilaiKelas ? `- KELAS ${riwayatNilaiKelas}` : ""
      }${riwayatNilaiMapel ? ` (${riwayatNilaiMapel})` : ""}${semTitle}`;
      applyOfficialKop(doc, subTitle);

      const tableBody = filtered.map((n, idx) => {
        const student = siswaList.find((s) => s.id === n.idSiswa || s.nisn === n.idSiswa);
        return [
          idx + 1,
          n.idSiswa || "-",
          student ? student.nama : n.namaSiswa || "-",
          n.kelas || "-",
          n.mapel || "-",
          n.jenis || "-",
          n.nilai !== undefined ? n.nilai : "-"
        ];
      });

      autoTable(doc, {
        startY: 55,
        head: [["No", "NISN/ID", "Nama Siswa", "Kelas", "Mata Pelajaran", "Jenis Evaluasi", "Nilai"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 100;
      applySignatures(doc, finalY);

      doc.save(`Riwayat_Nilai_${riwayatNilaiKelas || "All"}_${riwayatNilaiMapel || "All"}.pdf`);
      notifyCetakSuccess("Laporan Riwayat Nilai berhasil diunduh!");
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mencetak Riwayat Nilai.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            Pusat Cetak Laporan PDF Resmi
          </h2>
          <p className="text-xs text-slate-500">
            Cetak dokumen administrasi guru berformat resmi lengkap dengan Kop Surat Sekolah, Tabel, dan Tanda Tangan.
          </p>
        </div>

        {/* Filter Opsi Cetak Per Semester */}
        <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Opsi Cetak Per Semester (Tahun Ajaran 2026/2027)</span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Filter periode waktu data laporan yang akan dicetak pada seluruh dokumen PDF.
            </p>
          </div>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value as any)}
            className="w-full md:w-auto px-3.5 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 outline-none shadow-xs cursor-pointer"
          >
            <option value="ganjil">Semester Ganjil 2026/2027 (Juli - Desember 2026)</option>
            <option value="genap">Semester Genap 2026/2027 (Januari - Juni 2027)</option>
            <option value="semua">Semua Semester / Tanpa Filter Periodik</option>
          </select>
        </div>

        {/* Featured Card: Cetak Rapor Siswa Kurikulum Merdeka */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold border border-amber-400/30">
              <Sparkles className="w-3 h-3" />
              <span>Unggulan Kurikulum Merdeka</span>
            </div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Buku & Lembar Rapor Siswa Kurikulum Merdeka</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Cetak Laporan Hasil Belajar (Rapor) resmi perorangan atau massal 1 kelas. Dilengkapi Capaian Pembelajaran (TP/CP),
              pembobotan nilai otomatis (Sumatif, UTS, UAS), rekap absensi, catatan wali kelas, dan titimangsa 3 pihak.
            </p>
          </div>

          <button
            onClick={() => {
              if (onNavigateToRaport) {
                onNavigateToRaport();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg shrink-0"
          >
            <Award className="w-4 h-4 text-slate-950" />
            <span>Buka Modul Cetak Rapor</span>
            <ChevronRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Absensi */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              Laporan Rekapituasi Absensi Siswa
            </h3>
            <p className="text-xs text-slate-500">
              Menghasilkan rekap hitungan Hadir, Izin, Sakit, Alpa, dan persentase kehadiran per kelas.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <select
                value={selectedAbsensiKelas}
                onChange={(e) => setSelectedAbsensiKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>

              <select
                value={selectedAbsensiMapel}
                onChange={(e) => setSelectedAbsensiMapel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Pilih Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportAbsensiPDF}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Cetak PDF Absensi</span>
            </button>
          </div>

          {/* Card 2: Leger Nilai */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              Laporan Leger Nilai Akademik
            </h3>
            <p className="text-xs text-slate-500">
              Format matrik lanskap seluruh nilai tugas, UH, UTS, UAS beserta total dan rata-rata.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <select
                value={selectedNilaiKelas}
                onChange={(e) => setSelectedNilaiKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>

              <select
                value={selectedNilaiMapel}
                onChange={(e) => setSelectedNilaiMapel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
              >
                <option value="">Pilih Mapel</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportLegerPDF}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Cetak PDF Leger Nilai</span>
            </button>
          </div>

          {/* Card 3: Agenda Mengajar */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              Jurnal Agenda Mengajar Harian
            </h3>
            <p className="text-xs text-slate-500">
              Dokumen resmi jurnal mengajar harian guru untuk verifikasi kepala sekolah dan pengawas.
            </p>
            <button
              onClick={handleExportAgendaPDF}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors mt-4"
            >
              <Download className="w-4 h-4" />
              <span>Cetak PDF Jurnal Agenda</span>
            </button>
          </div>

          {/* Card 4: Bimbingan BK */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              Catatan Bimbingan Guru Wali
            </h3>
            <p className="text-xs text-slate-500">
              Laporan penanganan kasus dan konseling siswa perwalian untuk arsip sekolah.
            </p>
            <button
              onClick={handleExportBimbinganPDF}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors mt-4"
            >
              <Download className="w-4 h-4" />
              <span>Cetak PDF Bimbingan Guru Wali</span>
            </button>
          </div>

          {/* Card 5: Riwayat Harian Absensi */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              Laporan Riwayat Harian Absensi
            </h3>
            <p className="text-xs text-slate-500">
              Cetak laporan detail riwayat scan dan input absensi harian per tanggal dan kelas.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Tanggal</label>
                <input
                  type="date"
                  value={riwayatAbsensiTanggal}
                  onChange={(e) => setRiwayatAbsensiTanggal(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Kelas</label>
                <select
                  value={riwayatAbsensiKelas}
                  onChange={(e) => setRiwayatAbsensiKelas(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {kelasOptions.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleExportRiwayatAbsensiPDF}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Cetak PDF Riwayat Absensi</span>
            </button>
          </div>

          {/* Card 6: Riwayat Input Nilai Akademik */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              Laporan Riwayat Input Nilai Akademik
            </h3>
            <p className="text-xs text-slate-500">
              Daftar riwayat seluruh input nilai tugas, UH, UTS, dan UAS per kelas dan mata pelajaran.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Kelas</label>
                <select
                  value={riwayatNilaiKelas}
                  onChange={(e) => setRiwayatNilaiKelas(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {kelasOptions.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Mapel</label>
                <select
                  value={riwayatNilaiMapel}
                  onChange={(e) => setRiwayatNilaiMapel(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                >
                  <option value="">Semua Mapel</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.namaMapel}>
                      {m.namaMapel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleExportRiwayatNilaiPDF}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Cetak PDF Riwayat Nilai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
