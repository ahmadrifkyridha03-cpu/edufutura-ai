import React, { useState, useEffect, useRef } from "react";
import { IdCard, Printer, Eye, Download, ShieldCheck, Sparkles, Layers, RotateCw } from "lucide-react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import { Siswa, Pengaturan } from "../types";
import { notifyCetakSuccess, notifyCetakError } from "../lib/swal";
import { Card3DTilt } from "./3d/Card3DTilt";

interface CetakKartuQRViewProps {
  siswaList: Siswa[];
  config: Pengaturan;
}

export const CetakKartuQRView: React.FC<CetakKartuQRViewProps> = ({ siswaList, config }) => {
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("");
  const [previewSiswa, setPreviewSiswa] = useState<Siswa | null>(null);
  const [cardPerspective, setCardPerspective] = useState<"both" | "front" | "back">("both");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();

  // Filter students for selected class
  const studentsInClass = siswaList.filter((s) => s.kelas === selectedKelas);

  // Sync selected student on class change
  useEffect(() => {
    if (studentsInClass.length > 0) {
      if (!selectedSiswaId || !studentsInClass.some((s) => s.id === selectedSiswaId)) {
        setSelectedSiswaId(studentsInClass[0].id);
      }
    } else {
      setSelectedSiswaId("");
    }
  }, [selectedKelas, siswaList]);

  // Sync preview student & QR / Barcode
  useEffect(() => {
    const s = studentsInClass.find((item) => item.id === selectedSiswaId) || studentsInClass[0] || null;
    setPreviewSiswa(s);

    if (s) {
      // Generate QR
      QRCode.toDataURL(s.nisn || s.id, { margin: 1, width: 220 })
        .then((url) => setQrDataUrl(url))
        .catch(console.error);

      // Generate Barcode
      if (barcodeRef.current) {
        try {
          JsBarcode(barcodeRef.current, s.nisn || s.id, {
            format: "CODE128",
            displayValue: true,
            height: 35,
            width: 1.8,
            fontSize: 12,
            background: "#ffffff",
            lineColor: "#000000"
          });
        } catch (e) {
          console.warn(e);
        }
      }
    } else {
      setQrDataUrl("");
    }
  }, [selectedSiswaId, studentsInClass]);

  // Generate and Download PDF Kartu Pelajar (A4 Portrait - 3 Cards per Page)
  const handleExportPDF = async () => {
    if (!selectedKelas) {
      notifyCetakError("Silakan pilih kelas terlebih dahulu!");
      return;
    }

    if (studentsInClass.length === 0) {
      notifyCetakError("Belum ada data siswa di kelas ini.");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4"
      });

    const namaSekolah = (config.Nama_Sekolah || "SMA NEGERI 1 KOTA").toUpperCase();
    const alamatSekolah = (config.Alamat_Sekolah || "Jalan Pendidikan No. 1").toUpperCase();
    const kepsek = config.Nama_Kepsek || "Nama Kepala Sekolah, M.Pd.";
    const nipKepsek = config.NIP_Kepsek || "19800101 200501 1 001";
    const tempatTTD = config.Tempat_Tanda_Tangan || "Kota";

    const cardW = 153;
    const cardH = 242;
    const gapX = 20;

    const startX_Depan = 134.64;
    const startX_Belakang = startX_Depan + cardW + gapX;
    const startY = 38.5;
    const gapY = 20;

    const chunk = 3;
    for (let i = 0; i < studentsInClass.length; i += chunk) {
      const batch = studentsInClass.slice(i, i + chunk);
      if (i > 0) doc.addPage();

      for (let rowIdx = 0; rowIdx < batch.length; rowIdx++) {
        const s = batch[rowIdx];
        const currentY = startY + rowIdx * (cardH + gapY);

        const idSiswa = String(s.nisn || s.id);
        const namaSiswa = (s.nama || "-").toUpperCase();
        const kelasSiswa = s.kelas || "-";

        // --- DEPAN KARTU ---
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(startX_Depan, currentY, cardW, cardH, 4, 4, "FD");
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(startX_Depan, currentY, cardW, cardH, 4, 4, "S");

        // Header Blue Banner
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(startX_Depan, currentY, cardW, 50, 4, 4, "F");
        doc.rect(startX_Depan, currentY + 25, cardW, 25, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        const schoolLines = doc.splitTextToSize(namaSekolah, cardW - 20);
        doc.text(schoolLines, startX_Depan + cardW / 2, currentY + 16, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.5);
        const alamatLines = doc.splitTextToSize(alamatSekolah, cardW - 20);
        doc.text(alamatLines, startX_Depan + cardW / 2, currentY + 28 + (schoolLines.length > 1 ? 4 : 0), { align: "center" });

        // Kartu Pelajar Title
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.text("KARTU PELAJAR", startX_Depan + cardW / 2, currentY + 65, { align: "center" });
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1);
        doc.line(startX_Depan + 20, currentY + 70, startX_Depan + cardW - 20, currentY + 70);

        // Student Info Box
        let tableY = currentY + 78;
        const tableX = startX_Depan + 8;
        const tableW = cardW - 16;

        doc.setDrawColor(200, 210, 230);
        doc.setLineWidth(0.5);

        // Row Nama
        doc.setFillColor(245, 248, 255);
        doc.rect(tableX, tableY, tableW, 14, "F");
        doc.rect(tableX, tableY, tableW, 14, "S");
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.text("NAMA", tableX + 3, tableY + 9);
        doc.setTextColor(0, 0, 0);
        doc.text(": " + (namaSiswa.length > 20 ? namaSiswa.substring(0, 20) + "..." : namaSiswa), tableX + 30, tableY + 9);

        // Row NISN
        tableY += 14;
        doc.setFillColor(255, 255, 255);
        doc.rect(tableX, tableY, tableW, 14, "F");
        doc.rect(tableX, tableY, tableW, 14, "S");
        doc.setTextColor(30, 58, 138);
        doc.text("NISN", tableX + 3, tableY + 9);
        doc.setTextColor(0, 0, 0);
        doc.text(": " + idSiswa, tableX + 30, tableY + 9);

        // Row Kelas
        tableY += 14;
        doc.setFillColor(245, 248, 255);
        doc.rect(tableX, tableY, tableW, 14, "F");
        doc.rect(tableX, tableY, tableW, 14, "S");
        doc.setTextColor(30, 58, 138);
        doc.text("KELAS", tableX + 3, tableY + 9);
        doc.setTextColor(0, 0, 0);
        doc.text(": " + kelasSiswa, tableX + 30, tableY + 9);

        // QR Code Image
        const qrUrl = await QRCode.toDataURL(idSiswa, { margin: 1, width: 200 });
        const qrSize = 75;
        const qrX = startX_Depan + (cardW - qrSize) / 2;
        const qrY = currentY + 138;
        doc.addImage(qrUrl, "PNG", qrX, qrY, qrSize, qrSize);

        // Footer Blue Strip
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(startX_Depan, currentY + cardH - 15, cardW, 15, 4, 4, "F");
        doc.rect(startX_Depan, currentY + cardH - 15, cardW, 5, "F");

        // --- BELAKANG KARTU ---
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(startX_Belakang, currentY, cardW, cardH, 4, 4, "FD");
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(startX_Belakang, currentY, cardW, cardH, 4, 4, "S");

        // Header Blue Banner
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(startX_Belakang, currentY, cardW, 25, 4, 4, "F");
        doc.rect(startX_Belakang, currentY + 10, cardW, 15, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("SYARAT & KETENTUAN", startX_Belakang + cardW / 2, currentY + 16, { align: "center" });

        // Rules text
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        const rules = [
          "1. Kartu Pelajar ini diterbitkan resmi oleh sekolah.",
          "2. Kartu bersifat pribadi dan tidak boleh dipinjamkan.",
          "3. Wajib menjaga kebersihan & keutuhan kartu.",
          "4. Berlaku selama masa studi aktif di sekolah.",
          "5. Bila hilang/rusak, segera lapor ke Tata Usaha."
        ];

        let ry = currentY + 38;
        rules.forEach((rule) => {
          const splitR = doc.splitTextToSize(rule, cardW - 20);
          doc.text(splitR, startX_Belakang + 10, ry);
          ry += splitR.length * 9;
        });

        // Signature section
        const ttdY = currentY + 128;
        doc.setFontSize(6);
        doc.text(
          `${tempatTTD}, ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`,
          startX_Belakang + cardW - 10,
          ttdY,
          { align: "right" }
        );
        doc.text("Kepala Sekolah", startX_Belakang + cardW - 10, ttdY + 8, { align: "right" });

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(kepsek, startX_Belakang + cardW - 10, ttdY + 34, { align: "right" });

        const nameWidth = doc.getTextWidth(kepsek);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(startX_Belakang + cardW - 10 - nameWidth, ttdY + 36, startX_Belakang + cardW - 10, ttdY + 36);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        if (nipKepsek) {
          doc.text("NIP. " + nipKepsek, startX_Belakang + cardW - 10, ttdY + 44, { align: "right" });
        }

        // Barcode
        const bcCanvas = document.createElement("canvas");
        try {
          JsBarcode(bcCanvas, idSiswa, {
            format: "CODE128",
            displayValue: true,
            height: 35,
            width: 2,
            margin: 0,
            fontSize: 12,
            background: "#ffffff",
            lineColor: "#000000"
          });
          const bcWidth = 100;
          const bcX = startX_Belakang + (cardW - bcWidth) / 2;
          doc.addImage(bcCanvas.toDataURL("image/jpeg"), "JPEG", bcX, currentY + 188, bcWidth, 24);
        } catch (e) {
          console.warn(e);
        }

        // Footer Blue Strip
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(startX_Belakang, currentY + cardH - 15, cardW, 15, 4, 4, "F");
        doc.rect(startX_Belakang, currentY + cardH - 15, cardW, 5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("IDENTITAS DIGITAL", startX_Belakang + cardW / 2, currentY + cardH - 5, { align: "center" });
      }
    }

    doc.save(`Kartu_Pelajar_Kelas_${selectedKelas}.pdf`);
      notifyCetakSuccess(`Kartu Pelajar Kelas ${selectedKelas} berhasil diunduh!`);
    } catch (err: any) {
      notifyCetakError(err.message || "Gagal mengunduh Kartu Pelajar.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10 space-y-5">
        {/* Header Cyber HUD */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <IdCard className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-display">
                  Cetak Kartu Pelajar 3D & QR Code
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kartu Identitas Digital Pelajar Interaktif 3D &bull; QR Code presisi di depan & Barcode 128 di belakang (Siap Cetak PDF A4 / PVC)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Kelas */}
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-cyan-200 outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>

            {/* Selector Siswa untuk Pratinjau 3D */}
            {studentsInClass.length > 0 && (
              <select
                value={selectedSiswaId}
                onChange={(e) => setSelectedSiswaId(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-cyan-200 outline-none focus:border-cyan-500 font-mono max-w-[200px] truncate"
              >
                {studentsInClass.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.nisn || "No NISN"})
                  </option>
                ))}
              </select>
            )}

            {/* Cetak PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={!selectedKelas || studentsInClass.length === 0}
              className="bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer font-display"
            >
              <Download className="w-4 h-4 text-cyan-200" />
              <span>Cetak PDF ({studentsInClass.length} Kartu)</span>
            </button>
          </div>
        </div>

        {/* Live 3D Preview Display */}
        {previewSiswa ? (
          <div className="pt-2 space-y-4">
            {/* Perspective View Switcher */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/60 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10">
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>
                  Pratinjau Kartu: <b className="text-slate-900 dark:text-white">{previewSiswa.nama}</b> ({previewSiswa.nisn})
                </span>
              </div>

              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setCardPerspective("both")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    cardPerspective === "both"
                      ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      : "bg-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  3D Keduanya
                </button>
                <button
                  type="button"
                  onClick={() => setCardPerspective("front")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    cardPerspective === "front"
                      ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      : "bg-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  Tampak Depan
                </button>
                <button
                  type="button"
                  onClick={() => setCardPerspective("back")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    cardPerspective === "back"
                      ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      : "bg-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  Tampak Belakang
                </button>
              </div>
            </div>

            {/* 3D Tilt Interactive Showcase Stage */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 bg-slate-950/40 dark:bg-black/50 p-8 rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto min-h-[420px] relative">
              {/* Background Cyber Mesh */}
              <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

              {/* KARTU DEPAN (3D Tilt) */}
              {(cardPerspective === "both" || cardPerspective === "front") && (
                <div className="flex flex-col items-center space-y-2 relative z-10">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                    [TAMPAK_DEPAN_3D]
                  </span>
                  <Card3DTilt glowColor="cyan" maxTilt={14} className="cursor-grab active:cursor-grabbing">
                    <div className="w-[220px] h-[348px] bg-white text-slate-900 relative rounded-2xl overflow-hidden shadow-2xl border border-slate-300 shrink-0 select-none">
                      {/* Holographic Header Bar */}
                      <div className="h-[64px] bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white p-2.5 text-center flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute inset-0 cyber-shimmer opacity-30" />
                        <p className="text-[9.5px] font-extrabold uppercase leading-tight line-clamp-2 font-display relative z-10 text-cyan-100">
                          {config.Nama_Sekolah || "NAMA SEKOLAH ANDA"}
                        </p>
                        <p className="text-[7px] text-cyan-300 mt-0.5 line-clamp-2 relative z-10 font-mono">
                          {config.Alamat_Sekolah || "Alamat Satuan Pendidikan"}
                        </p>
                      </div>

                      {/* Header Badge & Hologram Seal */}
                      <div className="flex items-center justify-between px-3 mt-2">
                        <p className="font-black text-blue-950 text-xs tracking-tight font-display">
                          KARTU PELAJAR
                        </p>
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-cyan-100 border border-cyan-300 text-[6.5px] font-mono text-cyan-900 font-bold">
                          <Sparkles className="w-2 h-2 text-cyan-600" />
                          <span>SMART_ID</span>
                        </div>
                      </div>
                      <div className="w-11/12 mx-auto h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent my-1" />

                      {/* Student Info Box */}
                      <div className="mx-3 mt-2 rounded-xl border border-blue-200 text-[9px] overflow-hidden shadow-xs">
                        <div className="flex bg-blue-50/80 p-1.5 border-b border-blue-200">
                          <span className="w-12 font-bold text-blue-950">NAMA</span>
                          <span className="font-bold truncate flex-1 text-slate-800">: {previewSiswa.nama}</span>
                        </div>
                        <div className="flex bg-white p-1.5 border-b border-blue-200">
                          <span className="w-12 font-bold text-blue-950">NISN</span>
                          <span className="font-mono font-bold truncate flex-1 text-slate-800">: {previewSiswa.nisn || "-"}</span>
                        </div>
                        <div className="flex bg-blue-50/80 p-1.5">
                          <span className="w-12 font-bold text-blue-950">KELAS</span>
                          <span className="font-bold truncate flex-1 text-slate-800">: {previewSiswa.kelas}</span>
                        </div>
                      </div>

                      {/* QR Code Container with Hologram Sheen */}
                      {qrDataUrl && (
                        <div className="w-24 h-24 mx-auto mt-3 p-1.5 bg-white border border-slate-200 rounded-xl shadow-md flex items-center justify-center relative overflow-hidden group">
                          <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                        </div>
                      )}

                      {/* Footer Cyber Strip */}
                      <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-950 flex items-center justify-center">
                        <span className="text-[7px] font-mono font-bold text-cyan-200 tracking-wider">
                          OFFICIAL DIGITAL STUDENT ID
                        </span>
                      </div>
                    </div>
                  </Card3DTilt>
                </div>
              )}

              {/* KARTU BELAKANG (3D Tilt) */}
              {(cardPerspective === "both" || cardPerspective === "back") && (
                <div className="flex flex-col items-center space-y-2 relative z-10">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                    [TAMPAK_BELAKANG_3D]
                  </span>
                  <Card3DTilt glowColor="violet" maxTilt={14} className="cursor-grab active:cursor-grabbing">
                    <div className="w-[220px] h-[348px] bg-white text-slate-900 relative rounded-2xl overflow-hidden shadow-2xl border border-slate-300 shrink-0 select-none">
                      <div className="h-[32px] bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-950 text-white flex items-center justify-center">
                        <p className="text-[9.5px] font-bold uppercase tracking-wider font-display text-cyan-100">
                          KETENTUAN PENGGUNAAN
                        </p>
                      </div>

                      <div className="p-3 text-[8px] space-y-1 font-medium text-slate-700 leading-tight">
                        <p>1. Kartu Pelajar ini diterbitkan resmi oleh sekolah.</p>
                        <p>2. Kartu bersifat pribadi dan tidak boleh dipinjamkan.</p>
                        <p>3. Wajib menjaga kebersihan & keutuhan kartu.</p>
                        <p>4. Berlaku selama masa studi aktif di sekolah.</p>
                        <p>5. Bila hilang/rusak, segera lapor ke Tata Usaha.</p>
                      </div>

                      <div className="absolute right-3 top-42 text-[7.5px] text-right">
                        <p>{config.Tempat_Tanda_Tangan || "Kota"}, Tanggal</p>
                        <p className="mb-5">Kepala Sekolah</p>
                        <p className="font-bold border-b border-black pb-0.5 inline-block">
                          {config.Nama_Kepsek || "Nama Kepala Sekolah"}
                        </p>
                        <p className="text-[7px] mt-0.5 font-mono">NIP. {config.NIP_Kepsek || "-"}</p>
                      </div>

                      <div className="absolute bottom-6 inset-x-0 flex justify-center">
                        <svg ref={barcodeRef} className="max-w-[140px] h-8" />
                      </div>

                      <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-950 flex items-center justify-center">
                        <span className="text-[7px] font-mono font-bold text-cyan-200 tracking-widest">
                          TERVERIFIKASI &bull; IDENTITAS DIGITAL
                        </span>
                      </div>
                    </div>
                  </Card3DTilt>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/20 dark:bg-white/5">
            <IdCard className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">
              Belum Ada Kelas yang Dipilih
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Pilih kelas di dropdown pojok kanan atas untuk melihat pratinjau kartu 3D interaktif.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
