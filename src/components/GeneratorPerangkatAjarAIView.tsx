import React, { useState } from "react";
import { 
  FileCheck, 
  Sparkles, 
  Printer, 
  Download, 
  BookOpen, 
  Loader2, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  Award,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  UserCheck
} from "lucide-react";
import { Pengaturan } from "../types";
import { notifySimpanSuccess, notifySimpanError, notifyUnduhSuccess } from "../lib/swal";

interface GeneratorPerangkatAjarAIViewProps {
  config: Pengaturan;
}

export const GeneratorPerangkatAjarAIView: React.FC<GeneratorPerangkatAjarAIViewProps> = ({ config }) => {
  const [activeDoc, setActiveDoc] = useState<"analisis_cp" | "tp" | "atp" | "prota" | "prosem" | "kktp">("analisis_cp");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState("");

  // Store generated HTML for each document type
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, string>>({
    analisis_cp: "",
    tp: "",
    atp: "",
    prota: "",
    prosem: "",
    kktp: ""
  });

  const [formData, setFormData] = useState({
    school: config.Nama_Sekolah || "SMA Negeri 5 Sungai Penuh",
    subject: "Bahasa Indonesia",
    singkatanMapel: "BI",
    level: "Fase E / Kelas X",
    year: "2026/2027",
    totalJp: "108 JP / Tahun",
    jpPerMinggu: "3 JP/Minggu",
    teacher: config.Nama_Guru || "Rini Marlina, S.Pd., Gr.",
    nipTeacher: config.NIP_Guru || "19920518 201903 2 001",
    cityDate: `${config.Tempat_Tanda_Tangan || "Sungai Penuh"}, 14 Juli 2026`,
    principal: config.Nama_Kepsek || "Drs. Hendra Gunawan, M.Pd.",
    nipPrincipal: config.NIP_Kepsek || "19680423 199512 1 003",
    cpRasional: "Pada akhir Fase E, peserta didik memiliki kemampuan berbahasa untuk berkomunikasi dan bernalar sesuai dengan tujuan, konteks sosial, akademis, dan dunia kerja. Peserta didik mampu memahami, mengolah, menginterpretasi, dan mengevaluasi berbagai tipe teks tentang topik yang beragam.",
    cpElemen: `Elemen 1 — Menyimak:
Peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan, pikiran, perasaan, pandangan, arahan atau pesan yang akurat dari menyimak berbagai tipe teks (nonfiksi dan fiksi) dalam bentuk monolog, dialog, dan gelar wicara.

Elemen 2 — Membaca dan Memirsa:
Peserta didik mampu mengevaluasi informasi berupa gagasan, pikiran, pandangan, arahan atau pesan dari teks deskripsi, laporan, narasi, rekon, eksplanasi, eksposisi dan diskusi dari teks visual dan audiovisual untuk menemukan makna yang tersurat dan tersirat.

Elemen 3 — Berbicara dan Mempresentasikan:
Peserta didik mampu mengolah dan menyajikan gagasan, pikiran, pandangan, arahan atau pesan untuk tujuan pengajuan usul, perumusan masalah, dan solusi dalam bentuk monolog, dialog, dan gelar wicara secara logis, runtut, kritis, dan kreatif.

Elemen 4 — Menulis:
Peserta didik mampu menulis gagasan, pikiran, pandangan, arahan atau pesan tertulis untuk berbagai tujuan secara logis, kritis, dan kreatif dalam bentuk teks informasional dan/atau fiksi. Peserta didik mampu menulis teks eksposisi, laporan, dan teks prosedur.`
  });

  const docTypeList = [
    { id: "analisis_cp", label: "1. Analisis CP", fullTitle: "Analisis Capaian Pembelajaran (CP)", icon: BookOpen },
    { id: "tp", label: "2. Tujuan Pembelajaran (TP)", fullTitle: "Tujuan Pembelajaran (TP)", icon: FileCheck },
    { id: "atp", label: "3. Alur TP (ATP)", fullTitle: "Alur Tujuan Pembelajaran (ATP)", icon: Layers },
    { id: "prota", label: "4. Program Tahunan", fullTitle: "Program Tahunan (Prota)", icon: Calendar },
    { id: "prosem", label: "5. Program Semester", fullTitle: "Program Semester (Prosem)", icon: FileSpreadsheet },
    { id: "kktp", label: "6. KKTP", fullTitle: "Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)", icon: Award }
  ];

  const handleFillSample = () => {
    setFormData({
      school: config.Nama_Sekolah || "SMA Negeri 5 Sungai Penuh",
      subject: "Bahasa Indonesia",
      singkatanMapel: "BI",
      level: "Fase E / Kelas X",
      year: "2026/2027",
      totalJp: "108 JP / Tahun",
      jpPerMinggu: "3 JP/Minggu",
      teacher: config.Nama_Guru || "Rini Marlina, S.Pd., Gr.",
      nipTeacher: config.NIP_Guru || "19920518 201903 2 001",
      cityDate: `${config.Tempat_Tanda_Tangan || "Sungai Penuh"}, 14 Juli 2026`,
      principal: config.Nama_Kepsek || "Drs. Hendra Gunawan, M.Pd.",
      nipPrincipal: config.NIP_Kepsek || "19680423 199512 1 003",
      cpRasional: "Pada akhir Fase E, peserta didik memiliki kemampuan berbahasa untuk berkomunikasi dan bernalar sesuai dengan tujuan, konteks sosial, akademis, dan dunia kerja. Peserta didik mampu memahami, mengolah, menginterpretasi, dan mengevaluasi berbagai tipe teks tentang topik yang beragam.",
      cpElemen: `Elemen 1 — Menyimak:
Peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan, pikiran, perasaan, pandangan, arahan atau pesan yang akurat dari menyimak berbagai tipe teks (nonfiksi dan fiksi) dalam bentuk monolog, dialog, dan gelar wicara.

Elemen 2 — Membaca dan Memirsa:
Peserta didik mampu mengevaluasi informasi berupa gagasan, pikiran, pandangan, arahan atau pesan dari teks deskripsi, laporan, narasi, rekon, eksplanasi, eksposisi dan diskusi dari teks visual dan audiovisual untuk menemukan makna yang tersurat dan tersirat.

Elemen 3 — Berbicara dan Mempresentasikan:
Peserta didik mampu mengolah dan menyajikan gagasan, pikiran, pandangan, arahan atau pesan untuk tujuan pengajuan usul, perumusan masalah, dan solusi dalam bentuk monolog, dialog, dan gelar wicara secara logis, runtut, kritis, dan kreatif.

Elemen 4 — Menulis:
Peserta didik mampu menulis gagasan, pikiran, pandangan, arahan atau pesan tertulis untuk berbagai tujuan secara logis, kritis, dan kreatif dalam bentuk teks informasional dan/atau fiksi.`
    });
    notifySimpanSuccess("Contoh data Bahasa Indonesia Kelas X berhasil dimuat!");
  };

  // Helper to sanitize HTML output and ensure school logo in top-left header
  const sanitizeHtmlForOutput = (rawHtml: string) => {
    if (!rawHtml) return "";
    let clean = rawHtml;
    const defaultLogoTag = `<img src="${config.Logo_Kiri || config.Logo_Kanan || 'https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU'}" alt="Logo Sekolah" class="logo-sekolah" style="max-height: 70px; width: auto; float: left; margin-right: 15px; object-fit: contain;" />`;
    
    // Replace logo placeholders with top-left header logo
    clean = clean.replace(/\[\s*LOGO[^\n\]]*\]/gi, defaultLogoTag);
    clean = clean.replace(/\[\s*Gambar Logo[^\n\]]*\]/gi, defaultLogoTag);
    // Remove print buttons/text like "🖨️ Cetak Dokumen"
    clean = clean.replace(/<button[^>]*>.*?cetak.*?<\/button>/gi, "");
    clean = clean.replace(/<a[^>]*>.*?cetak.*?<\/a>/gi, "");
    clean = clean.replace(/🖨️?\s*Cetak\s*Dokumen/gi, "");
    clean = clean.replace(/🖨️/g, "");
    return clean;
  };

  const handleGenerateDoc = async (targetType: string) => {
    setIsGenerating(true);
    const docMeta = docTypeList.find((d) => d.id === targetType);
    setGeneratingProgress(`Menyusun ${docMeta?.fullTitle || targetType}...`);

    try {
      const res = await fetch("/api/ai/generate-perangkat-ajar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: targetType,
          formData
        })
      });

      const data = await res.json();
      if (data.status === "success" && data.html) {
        const cleanedHtml = sanitizeHtmlForOutput(data.html);
        setGeneratedDocs((prev) => ({
          ...prev,
          [targetType]: cleanedHtml
        }));
        notifySimpanSuccess(`${docMeta?.fullTitle || "Dokumen"} berhasil dibuat!`);
      } else {
        throw new Error(data.message || "Gagal menghasilkan dokumen");
      }
    } catch (err: any) {
      console.error(err);
      notifySimpanError(`Gagal membuat ${docMeta?.fullTitle}: ` + (err?.message || "Terjadi kesalahan server."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAllDocs = async () => {
    setIsGenerating(true);
    const types = ["analisis_cp", "tp", "atp", "prota", "prosem", "kktp"];

    for (let i = 0; i < types.length; i++) {
      const t = types[i];
      const docMeta = docTypeList.find((d) => d.id === t);
      setGeneratingProgress(`[${i + 1}/${types.length}] Menyusun ${docMeta?.fullTitle}...`);

      try {
        const res = await fetch("/api/ai/generate-perangkat-ajar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docType: t,
            formData
          })
        });

        const data = await res.json();
        if (data.status === "success" && data.html) {
          const cleanedHtml = sanitizeHtmlForOutput(data.html);
          setGeneratedDocs((prev) => ({
            ...prev,
            [t]: cleanedHtml
          }));
        }
      } catch (err) {
        console.error(`Gagal pada ${t}:`, err);
      }
    }

    setIsGenerating(false);
    notifySimpanSuccess("Seluruh 6 Dokumen Administrasi Perangkat Ajar AI Berhasil Dibuat!");
  };

  // Print A4 Function
  const handlePrintA4 = () => {
    const rawHtml = generatedDocs[activeDoc];
    if (!rawHtml) {
      notifySimpanError("Belum ada dokumen yang dihasilkan untuk dicetak.");
      return;
    }

    const activeHtml = sanitizeHtmlForOutput(rawHtml);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      notifySimpanError("Gagal membuka jendela cetak. Periksa pembatas pop-up browser Anda.");
      return;
    }

    const isLandscape = activeDoc === "atp" || activeDoc === "prosem" || activeDoc === "kktp";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Perangkat Ajar AI - A4 Presisi</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 ${isLandscape ? "landscape" : "portrait"};
              margin: 1.2cm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
            }
            th, td {
              border: 1px solid #333;
              padding: 6px 8px;
              font-size: 10pt;
            }
            th {
              background-color: #1a3a5c !important;
              color: #ffffff !important;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            /* Borderless signature and header tables */
            table[style*="border:none"], table[style*="border: 0"], table.ttd-table, table.signature-table {
              border: none !important;
            }
            table[style*="border:none"] td, table[style*="border: 0"] td, table.ttd-table td, table.signature-table td {
              border: none !important;
            }
            img, .logo-sekolah, .kop-logo {
              display: inline-block !important;
              max-height: 75px;
              width: auto;
              object-fit: contain;
              vertical-align: middle;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              img, .logo-sekolah, .kop-logo {
                display: inline-block !important;
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          ${activeHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Download Word (.doc / .docx)
  const handleDownloadWord = () => {
    const rawHtml = generatedDocs[activeDoc];
    if (!rawHtml) {
      notifySimpanError("Belum ada dokumen yang dihasilkan untuk diunduh.");
      return;
    }

    const activeHtml = sanitizeHtmlForOutput(rawHtml);
    const orientation = activeDoc === "atp" || activeDoc === "prosem" || activeDoc === "kktp" ? "landscape" : "portrait";
    const docTitle = docTypeList.find((d) => d.id === activeDoc)?.fullTitle || "Perangkat_Ajar";
    const wordPageSize = orientation === "landscape" ? "841.9pt 595.3pt" : "595.3pt 841.9pt";

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForCustomXSL/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page WordSection1 {
              size: ${wordPageSize};
              mso-page-orientation: ${orientation};
              margin: 36.0pt 36.0pt 36.0pt 36.0pt;
            }
            div.WordSection1 {
              page: WordSection1;
            }
            body {
              font-family: 'Calibri', 'Arial', sans-serif;
              font-size: 11pt;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 15px;
            }
            td, th {
              border: 1px solid #1a3a5c;
              padding: 6px 8px;
              vertical-align: top;
            }
            th, td.header-cell, th.bg-header {
              background-color: #1a3a5c !important;
              background: #1a3a5c !important;
              color: #ffffff !important;
              font-weight: bold;
              text-align: center;
              mso-shading: windowtext transparent;
              mso-pattern: fill #1a3a5c;
            }
            /* Invisible signature table styling for MS Word */
            table[style*="border:none"], table[style*="border: 0"], table[style*="border:none !important"], table.ttd-table, table.signature-table {
              border: none !important;
              mso-border-alt: none !important;
            }
            table[style*="border:none"] td, table[style*="border: 0"] td, table[style*="border:none !important"] td, table.ttd-table td, table.signature-table td {
              border: none !important;
              mso-border-alt: none !important;
            }
            img {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="WordSection1">
            ${activeHtml}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", wordContent], {
      type: "application/msword;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc.toUpperCase()}_${formData.subject.replace(/\s+/g, "_")}_${formData.level.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notifyUnduhSuccess(`File Word (.doc) ${docTitle} berhasil diunduh!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Cyber HUD */}
      <div className="relative rounded-2xl p-6 md:p-8 overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 text-white border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 font-mono font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span>OTOMATISASI KURIKULUM MERDEKA AI</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
              Generator Perangkat Ajar AI
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Sintesis 6 Dokumen Lengkap Administrasi Guru (Analisis CP, TP, ATP, Prota, Prosem, dan KKTP) secara presisi, instan, siap cetak PDF A4 dan export Word (.doc).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto relative z-10">
            <button
              onClick={handleFillSample}
              className="bg-white/5 hover:bg-white/10 text-cyan-300 font-mono font-bold px-4 py-3 rounded-xl border border-cyan-500/30 text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Isi Contoh Bahasa Indonesia</span>
            </button>
            <button
              onClick={handleGenerateAllDocs}
              disabled={isGenerating}
              className="bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center space-x-2 text-xs md:text-sm cursor-pointer disabled:opacity-50 font-display"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Generate Semua 6 Dokumen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Input Data Administrasi */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-white/10 pb-3 font-display">
          <Building2 className="w-5 h-5 text-cyan-500" />
          <span>Data Identitas & Capaian Pembelajaran (CP)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Satuan Pendidikan</label>
            <input
              type="text"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mata Pelajaran</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Singkatan Mapel (Kode TP)</label>
            <input
              type="text"
              value={formData.singkatanMapel}
              onChange={(e) => setFormData({ ...formData, singkatanMapel: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fase / Kelas</label>
            <input
              type="text"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tahun Pelajaran</label>
            <input
              type="text"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Alokasi Waktu Total</label>
            <input
              type="text"
              value={formData.totalJp}
              onChange={(e) => setFormData({ ...formData, totalJp: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Guru</label>
            <input
              type="text"
              value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">NIP Guru</label>
            <input
              type="text"
              value={formData.nipTeacher}
              onChange={(e) => setFormData({ ...formData, nipTeacher: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kota / Tanggal TTD</label>
            <input
              type="text"
              value={formData.cityDate}
              onChange={(e) => setFormData({ ...formData, cityDate: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Kepala Sekolah</label>
            <input
              type="text"
              value={formData.principal}
              onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">NIP Kepala Sekolah</label>
            <input
              type="text"
              value={formData.nipPrincipal}
              onChange={(e) => setFormData({ ...formData, nipPrincipal: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">JP per Minggu</label>
            <input
              type="text"
              value={formData.jpPerMinggu}
              onChange={(e) => setFormData({ ...formData, jpPerMinggu: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-semibold outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              CP Umum / Rasional Mata Pelajaran
            </label>
            <textarea
              rows={4}
              value={formData.cpRasional}
              onChange={(e) => setFormData({ ...formData, cpRasional: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium leading-relaxed outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Capaian Pembelajaran (CP) Per Elemen
            </label>
            <textarea
              rows={4}
              value={formData.cpElemen}
              onChange={(e) => setFormData({ ...formData, cpElemen: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 font-medium leading-relaxed outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Document Tab Navigation HUD */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-cyan-500" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm md:text-base font-display">
              Pilih Dokumen Administrasi AI
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleGenerateDoc(activeDoc)}
              disabled={isGenerating}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-mono"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate {docTypeList.find((d) => d.id === activeDoc)?.label}</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {docTypeList.map((doc) => {
            const Icon = doc.icon;
            const isTabActive = activeDoc === doc.id;
            const isDone = Boolean(generatedDocs[doc.id]);

            return (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id as any)}
                className={`flex flex-col items-center text-center p-3 rounded-xl border text-xs font-bold transition-all relative cursor-pointer font-mono ${
                  isTabActive
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] scale-102"
                    : isDone
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-slate-100/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white/10"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isTabActive ? "text-slate-950" : isDone ? "text-emerald-500" : "text-slate-400"}`} />
                <span className="truncate w-full">{doc.label}</span>
                {isDone && (
                  <CheckCircle2 className="w-3.5 h-3.5 absolute top-1.5 right-1.5 text-emerald-500 dark:text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading overlay if generating */}
      {isGenerating && (
        <div className="glass-card border border-cyan-500/40 p-6 rounded-2xl flex items-center justify-center space-x-4 animate-pulse shadow-[0_0_25px_rgba(6,182,212,0.2)]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <div>
            <p className="font-extrabold text-cyan-900 dark:text-cyan-200 text-sm md:text-base font-display">
              {generatingProgress || "Sedang memproses AI Perangkat Ajar..."}
            </p>
          </div>
        </div>
      )}

      {/* Output Document Display & Action Bar */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span className="font-extrabold text-sm md:text-base text-cyan-300 font-display">
              {docTypeList.find((d) => d.id === activeDoc)?.fullTitle}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintA4}
              disabled={!generatedDocs[activeDoc]}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 disabled:opacity-40 cursor-pointer shadow-sm font-mono"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF (A4)</span>
            </button>
            <button
              onClick={handleDownloadWord}
              disabled={!generatedDocs[activeDoc]}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 disabled:opacity-40 cursor-pointer shadow-sm font-mono"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Word (.doc)</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-x-auto min-h-[500px] bg-slate-100/50 dark:bg-slate-950/70">
          {generatedDocs[activeDoc] ? (
            <div
              className="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-300 max-w-5xl mx-auto font-sans leading-relaxed text-sm"
              dangerouslySetInnerHTML={{ __html: generatedDocs[activeDoc] }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-cyan-500/10 text-cyan-500 rounded-2xl flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-float-slow">
                <Sparkles className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg font-display">
                Belum ada dokumen {docTypeList.find((d) => d.id === activeDoc)?.label}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Klik tombol "Generate {docTypeList.find((d) => d.id === activeDoc)?.label}" di atas untuk menghasilkan dokumen secara otomatis menggunakan AI.
              </p>
              <button
                onClick={() => handleGenerateDoc(activeDoc)}
                disabled={isGenerating}
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center space-x-2 cursor-pointer font-display"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Mulai Generate {docTypeList.find((d) => d.id === activeDoc)?.label}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
