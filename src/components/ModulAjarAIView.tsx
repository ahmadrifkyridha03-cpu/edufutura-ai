import React, { useState, useEffect } from "react";
import { 
  Wand2, 
  Printer, 
  Download, 
  Sparkles, 
  FileText, 
  Loader2, 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  FileCheck, 
  Layers, 
  PenTool,
  Compass,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Terminal,
  Activity,
  Zap
} from "lucide-react";
import { ModulFormState, Pengaturan } from "../types";
import { notifySimpanSuccess, notifySimpanError, notifyCetakSuccess, notifyUnduhSuccess, notifyUnduhError } from "../lib/swal";

interface ModulAjarAIViewProps {
  config: Pengaturan;
}

export const ModulAjarAIView: React.FC<ModulAjarAIViewProps> = ({ config }) => {
  const [form, setForm] = useState<ModulFormState>({
    namaGuru: config.Nama_Guru || "",
    nipGuru: config.NIP_Guru || "",
    pemerintah: config.Pemerintah || "PEMERINTAH KABUPATEN / KOTA",
    namaSekolah: config.Nama_Sekolah || "",
    alamatSekolah: config.Alamat_Sekolah || "",
    namaKepsek: config.Nama_Kepsek || "",
    nipKepsek: config.NIP_Kepsek || "",
    tempatTtd: config.Tempat_Tanda_Tangan || "Kerinci",
    tanggalTtd: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    tahunAjaran: "2026/2027",
    jenjang: "SMP",
    fase: "Fase D (Kelas 7-9)",
    kelas: "VII",
    waktu: "2 x 45 JP",
    mataPelajaran: "Informatika",
    topik: "Berpikir Komputasional dan Algoritma Dasar",
    subTopik: "Pengenalan Flowchart dan Pseudocode",
    jumlahPertemuan: "2",
    model: "Problem Based Learning (PBL)",
    tujuan: "",
    karakteristik: "Siswa aktif, heterogen, senang dengan pemecahan masalah kontekstual dan diskusi kelompok.",
    formatOutput: "standar_merdeka",
    sertakanKop: true,
    sertakanTtd: true,
    sertakanLkpd: true,
  });

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isKopAccordionOpen, setIsKopAccordionOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [telemetryStage, setTelemetryStage] = useState(0);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const telemetryStages = [
    "ANALYZING_CURRICULUM_STRUCTURE & PEDAGOGY",
    "SYNTHESIZING_DEEP_LEARNING_DIMENSIONS (Mindful, Meaningful, Joyful)",
    "COMPOSING_DIFFERENTIATED_LKPD_AND_ASSESSMENT_RUBRICS",
    "FINALIZING_OFFICIAL_DOCUMENT_AND_SIGNATURE_BLOCKS"
  ];

  // Telemetry ticker during generation
  useEffect(() => {
    let interval: any;
    if (loading) {
      setTelemetryStage(0);
      interval = setInterval(() => {
        setTelemetryStage((prev) => (prev + 1) % telemetryStages.length);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Sync state if config updates
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      namaGuru: prev.namaGuru || config.Nama_Guru || "",
      nipGuru: prev.nipGuru || config.NIP_Guru || "",
      pemerintah: prev.pemerintah === "PEMERINTAH KABUPATEN / KOTA" && config.Pemerintah ? config.Pemerintah : prev.pemerintah,
      namaSekolah: prev.namaSekolah || config.Nama_Sekolah || "",
      alamatSekolah: prev.alamatSekolah || config.Alamat_Sekolah || "",
      namaKepsek: prev.namaKepsek || config.Nama_Kepsek || "",
      nipKepsek: prev.nipKepsek || config.NIP_Kepsek || "",
      tempatTtd: prev.tempatTtd === "Kerinci" && config.Tempat_Tanda_Tangan ? config.Tempat_Tanda_Tangan : prev.tempatTtd
    }));
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const cleanHtmlContent = (rawHtml: string): string => {
    if (!rawHtml) return "";
    return rawHtml
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .replace(/```[a-zA-Z]*\n?/g, "")
      .replace(/```/g, "")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^#+\s*(.*?)$/gm, "<h3>$1</h3>")
      .replace(/`/g, "")
      .trim();
  };

  const handleGenerate = async () => {
    if (
      !form.namaGuru ||
      !form.namaSekolah ||
      !form.tahunAjaran ||
      !form.jenjang ||
      !form.fase ||
      !form.kelas ||
      !form.mataPelajaran ||
      !form.topik ||
      !form.waktu ||
      !form.model
    ) {
      notifySimpanError("Mohon lengkapi seluruh kolom formulir bertanda bintang (*)");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/generate-modul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (data.status === "success" && data.html) {
        const cleaned = cleanHtmlContent(data.html);
        setGeneratedHtml(cleaned);
        notifySimpanSuccess("Modul Ajar AI berhasil disusun sesuai format pilihan!");
        setActiveStep(3); // Auto switch to review step
      } else {
        throw new Error(data.message || "Gagal menyusun modul ajar AI.");
      }
    } catch (err: any) {
      notifySimpanError(err.message || "Terjadi kesalahan saat memproses generator AI.");
    } finally {
      setLoading(false);
    }
  };

  // Salin isi dokumen
  const handleCopy = () => {
    if (!generatedHtml) return;
    navigator.clipboard.writeText(generatedHtml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notifySimpanSuccess("Format HTML Modul Ajar berhasil disalin!");
    });
  };

  // Export Word .doc
  const handleExportWord = () => {
    if (!generatedHtml) return;

    try {
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Modul Ajar - ${form.mataPelajaran}</title>
          <!--[if gte mso 9]>
          <xml>
          <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page { size: A4 portrait; margin: 2cm 1.5cm 2cm 1.5cm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.3; color: #000000; }
            h1 { font-size: 15pt; text-align: center; font-weight: bold; margin-bottom: 12pt; text-transform: uppercase; color: #1a3a5c; }
            h2 { font-size: 12pt; font-weight: bold; border-bottom: 1.5pt solid #1a3a5c; padding-bottom: 3pt; margin-top: 15pt; margin-bottom: 8pt; color: #1a3a5c; text-transform: uppercase; }
            h3 { font-size: 11pt; font-weight: bold; margin-top: 10pt; margin-bottom: 5pt; color: #1a3a5c; }
            h4 { font-size: 10.5pt; font-weight: bold; margin-top: 8pt; margin-bottom: 4pt; }
            p { margin-bottom: 6pt; text-align: justify; color: #000000; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; page-break-inside: auto; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            th { border: 1pt solid #1a3a5c; padding: 6pt 8pt; vertical-align: middle; text-align: center; font-size: 10pt; font-weight: bold; background-color: #1a3a5c !important; color: #ffffff !important; }
            td { border: 1pt solid #cbd5e1; padding: 6pt 8pt; vertical-align: top; text-align: left; font-size: 10pt; color: #000000 !important; background-color: #ffffff !important; }
            ul, ol { margin-bottom: 6pt; padding-left: 18pt; }
            li { margin-bottom: 3pt; color: #000000; }
          </style>
        </head>
        <body>
      `;
      const footer = "</body></html>";
      const fullSource = header + generatedHtml + footer;

      const blob = new Blob(["\ufeff", fullSource], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanTopic = form.topik ? form.topik.replace(/\s+/g, "_") : "Modul";
      link.href = url;
      link.download = `Modul_Ajar_${form.formatOutput}_${cleanTopic}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notifyUnduhSuccess("Modul Ajar (.DOC) berhasil diunduh dan siap diedit di Word!");
    } catch (err: any) {
      notifyUnduhError("Gagal mengunduh file Word.");
    }
  };

  // Print PDF
  const handlePrint = () => {
    if (!generatedHtml) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      notifyCetakSuccess("Gagal membuka jendela cetak browser.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Modul Ajar - ${form.topik}</title>
          <style>
            @page { size: A4 portrait; margin: 1.5cm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.3; color: #000000; margin: 0; padding: 0; }
            h1 { font-size: 15pt; text-align: center; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; color: #1a3a5c; }
            h2 { font-size: 12pt; font-weight: bold; border-bottom: 1.5px solid #1a3a5c; padding-bottom: 4px; margin-top: 16px; margin-bottom: 8px; color: #1a3a5c; text-transform: uppercase; }
            h3 { font-size: 11pt; font-weight: bold; margin-top: 10px; margin-bottom: 5px; color: #1a3a5c; }
            h4 { font-size: 10.5pt; font-weight: bold; margin-top: 8px; margin-bottom: 4px; }
            p { margin-bottom: 6px; text-align: justify; color: #000000; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 14px; page-break-inside: auto; }
            thead { display: table-header-group !important; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            th { border: 1px solid #1a3a5c !important; padding: 6px 8px; vertical-align: middle; text-align: center; font-size: 10pt; font-weight: bold; background-color: #1a3a5c !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            td { border: 1px solid #cbd5e1 !important; padding: 6px 8px; vertical-align: top; text-align: left; font-size: 10pt; color: #000000 !important; background-color: #ffffff !important; }
            ul, ol { margin-bottom: 6px; padding-left: 18px; }
            li { margin-bottom: 2px; color: #000000; }
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid !important; break-inside: avoid !important; }
              thead { display: table-header-group !important; }
            }
          </style>
        </head>
        <body>
          ${generatedHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      notifyCetakSuccess("Dokumen siap dicetak!");
    }, 500);
  };

  const getFormatBadgeLabel = (format?: string) => {
    switch (format) {
      case "standar_merdeka":
        return "Standar Kurikulum Merdeka (Lengkap & Resmi)";
      case "deep_learning":
        return "Deep Learning Pro (Mindful, Meaningful, Joyful)";
      case "ringkas_1lembar":
        return "Format Ringkas Esensial (1-2 Lembar)";
      case "kemenag_kbc":
        return "Integrasi Kemenag / KBC (PPRA & Karakter)";
      default:
        return "Standar Kurikulum Merdeka";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[85vh]">
      {/* Left Form Panel: Cyber HUD Stepper */}
      <div className="w-full lg:w-[460px] glass-card rounded-2xl flex flex-col shrink-0 overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl">
        {/* Header HUD */}
        <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white relative border-b border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
              </div>
              <div>
                <h2 className="font-extrabold text-base tracking-tight font-display bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
                  AI Modul Ajar Generator
                </h2>
                <p className="text-[11px] text-cyan-300/80 font-mono">
                  DEEP_LEARNING_PRO &bull; MERDEKA_v2.4
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
              STEP {activeStep}/3
            </span>
          </div>

          {/* Stepper Navigation Pills */}
          <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                activeStep === 1
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              1. Identitas & Format
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                activeStep === 2
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              2. Skenario & Model
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono transition-all text-center cursor-pointer ${
                activeStep === 3
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              3. Review & Eksekusi
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: IDENTITAS & FORMAT KURIKULUM */}
          {activeStep === 1 && (
            <div className="space-y-4">
              {/* Section: PILIHAN FORMAT OUTPUT */}
              <div className="space-y-3 p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60">
                <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <FileCheck className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                  Format Output Kurikulum *
                </label>

                <select
                  id="formatOutput"
                  value={form.formatOutput}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-cyan-200 outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                >
                  <option value="standar_merdeka">1. Standar Kurikulum Merdeka (Lengkap & Resmi)</option>
                  <option value="deep_learning">2. Deep Learning Pro (Mindful, Meaningful, Joyful)</option>
                  <option value="ringkas_1lembar">3. Format Ringkas Esensial (1-2 Lembar Praktis)</option>
                  <option value="kemenag_kbc">4. Integrasi Kemenag / KBC (PPRA & Karakter)</option>
                </select>

                <div className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-snug bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                  {form.formatOutput === "standar_merdeka" && (
                    <span>Format lengkap Kemdikbudristek: I. Informasi Umum, II. Komponen Inti (Tujuan, Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Per Pertemuan, Asesmen), III. Lampiran LKPD & Glosarium.</span>
                  )}
                  {form.formatOutput === "deep_learning" && (
                    <span>Berfokus pada 3 Dimensi Deep Learning: Mindful (Sadar/Fokus), Meaningful (Bermakna), Joyful (Menggembirakan) dalam 3 Fase: Memahami, Mengaplikasi, dan Merefleksi.</span>
                  )}
                  {form.formatOutput === "ringkas_1lembar" && (
                    <span>Format padat praktis 1-2 lembar (RPP Esensial): 3 Komponen Inti (Tujuan, Langkah-Langkah Pembelajaran, dan Asesmen) untuk supervisi kilat.</span>
                  )}
                  {form.formatOutput === "kemenag_kbc" && (
                    <span>Terintegrasi nilai Kementerian Agama: Panca Cinta dan 10 Nilai Profil Pelajar Rahmatan lil 'Alamin (PPRA: Ta'addub, Qudwah, Tawassuth).</span>
                  )}
                </div>

                {/* Checkbox Options */}
                <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.sertakanKop}
                      onChange={(e) => setForm(prev => ({ ...prev, sertakanKop: e.target.checked }))}
                      className="rounded text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                    />
                    <span>Sertakan Kop Satuan Pendidikan Resmi</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.sertakanTtd}
                      onChange={(e) => setForm(prev => ({ ...prev, sertakanTtd: e.target.checked }))}
                      className="rounded text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                    />
                    <span>Sertakan Lembar Pengesahan Tanda Tangan (Kepsek & Guru)</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.sertakanLkpd}
                      onChange={(e) => setForm(prev => ({ ...prev, sertakanLkpd: e.target.checked }))}
                      className="rounded text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                    />
                    <span>Sertakan Lembar LKPD & Rubrik Asesmen Lengkap</span>
                  </label>
                </div>
              </div>

              {/* Collapsible: Pengaturan Kop & Tanda Tangan */}
              <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsKopAccordionOpen(!isKopAccordionOpen)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-500" />
                    <span>Data Kop & Pejabat Pengesahan</span>
                  </div>
                  {isKopAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isKopAccordionOpen && (
                  <div className="p-3.5 space-y-3 bg-white dark:bg-slate-900/90 border-t border-slate-200 dark:border-white/10 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Dinas / Instansi Naungan</label>
                      <input
                        type="text"
                        id="pemerintah"
                        value={form.pemerintah || ""}
                        onChange={handleChange}
                        placeholder="Contoh: PEMERINTAH KABUPATEN / PROVINSI"
                        className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Alamat Satuan Pendidikan</label>
                      <input
                        type="text"
                        id="alamatSekolah"
                        value={form.alamatSekolah || ""}
                        onChange={handleChange}
                        placeholder="Jalan, Kelurahan, Kecamatan, Kab/Kota"
                        className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nama Kepala Sekolah</label>
                        <input
                          type="text"
                          id="namaKepsek"
                          value={form.namaKepsek || ""}
                          onChange={handleChange}
                          placeholder="Nama Kepsek"
                          className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">NIP Kepala Sekolah</label>
                        <input
                          type="text"
                          id="nipKepsek"
                          value={form.nipKepsek || ""}
                          onChange={handleChange}
                          placeholder="NIP Kepsek"
                          className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">NIP Guru Penyusun</label>
                        <input
                          type="text"
                          id="nipGuru"
                          value={form.nipGuru || ""}
                          onChange={handleChange}
                          placeholder="NIP Guru"
                          className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Kota / Titimangsa TTD</label>
                        <input
                          type="text"
                          id="tempatTtd"
                          value={form.tempatTtd || ""}
                          onChange={handleChange}
                          placeholder="Kerinci / Jakarta"
                          className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Identitas Modul */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-1 font-display">
                  Identitas Modul Ajar
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Penyusun / Guru *</label>
                    <input
                      type="text"
                      id="namaGuru"
                      value={form.namaGuru}
                      onChange={handleChange}
                      placeholder="Nama Lengkap & Gelar"
                      className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Satuan Pendidikan *</label>
                    <input
                      type="text"
                      id="namaSekolah"
                      value={form.namaSekolah}
                      onChange={handleChange}
                      placeholder="SMP / SMA Negeri ..."
                      className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jenjang Pendidikan *</label>
                    <select
                      id="jenjang"
                      value={form.jenjang}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 outline-none"
                    >
                      <option value="SD">SD / MI</option>
                      <option value="SMP">SMP / MTs</option>
                      <option value="SMA">SMA / MA</option>
                      <option value="SMK">SMK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fase Kurikulum *</label>
                    <select
                      id="fase"
                      value={form.fase}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 outline-none"
                    >
                      <option value="Fase A (Kelas 1-2)">Fase A (Kelas 1-2)</option>
                      <option value="Fase B (Kelas 3-4)">Fase B (Kelas 3-4)</option>
                      <option value="Fase C (Kelas 5-6)">Fase C (Kelas 5-6)</option>
                      <option value="Fase D (Kelas 7-9)">Fase D (Kelas 7-9)</option>
                      <option value="Fase E (Kelas 10)">Fase E (Kelas 10)</option>
                      <option value="Fase F (Kelas 11-12)">Fase F (Kelas 11-12)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelas *</label>
                    <input
                      type="text"
                      id="kelas"
                      value={form.kelas}
                      onChange={handleChange}
                      placeholder="Contoh: VII atau X"
                      className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mata Pelajaran *</label>
                    <input
                      type="text"
                      id="mataPelajaran"
                      value={form.mataPelajaran}
                      onChange={handleChange}
                      placeholder="Informatika / Matematika"
                      className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Lanjut ke Skenario & Model</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          )}

          {/* STEP 2: PEDAGOGI & SKENARIO */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-1 font-display">
                Topik & Strategi Pembelajaran
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bab / Topik Utama *</label>
                <input
                  type="text"
                  id="topik"
                  value={form.topik}
                  onChange={handleChange}
                  placeholder="Misal: Berpikir Komputasional dan Algoritma"
                  className="w-full px-3 py-2 text-xs font-bold text-cyan-900 dark:text-cyan-200 border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sub-Topik / Materi Spesifik</label>
                <input
                  type="text"
                  id="subTopik"
                  value={form.subTopik}
                  onChange={handleChange}
                  placeholder="Opsional / Misal: Pengenalan Flowchart & Pseudocode"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alokasi Waktu *</label>
                  <input
                    type="text"
                    id="waktu"
                    value={form.waktu}
                    onChange={handleChange}
                    placeholder="2 x 45 JP"
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jumlah Pertemuan *</label>
                  <select
                    id="jumlahPertemuan"
                    value={form.jumlahPertemuan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 outline-none"
                  >
                    <option value="1">1 Pertemuan</option>
                    <option value="2">2 Pertemuan</option>
                    <option value="3">3 Pertemuan</option>
                    <option value="4">4 Pertemuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Model Pembelajaran *</label>
                <select
                  id="model"
                  value={form.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 outline-none"
                >
                  <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                  <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                  <option value="Discovery Learning">Discovery Learning</option>
                  <option value="Inquiry Learning">Inquiry Learning</option>
                  <option value="Cooperative Learning">Cooperative Learning</option>
                  <option value="Teaching at the Right Level (TaRL)">Teaching at the Right Level (TaRL)</option>
                  <option value="Differentiated Instruction">Diferensiasi Terbimbing (Konten & Produk)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Karakteristik & Diferensiasi Siswa</label>
                <textarea
                  id="karakteristik"
                  rows={2}
                  value={form.karakteristik}
                  onChange={handleChange}
                  placeholder="Karakteristik murid (auditori, visual, kinestetik, heterogen)..."
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none custom-scrollbar"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tujuan Pembelajaran Khusus (Opsional)</label>
                <textarea
                  id="tujuan"
                  rows={2}
                  value={form.tujuan}
                  onChange={handleChange}
                  placeholder="Kosongkan jika ingin dirumuskan otomatis oleh AI berbasis Taksonomi Bloom / Marzano..."
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none custom-scrollbar"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="flex-1 py-2.5 px-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="flex-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <span>Review & Eksekusi</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & EKSEKUSI GENERATE */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-1 font-display">
                Konfirmasi & Matriks Parameter
              </p>

              {/* Summary Parameter HUD */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 font-mono text-[10px]">FORMAT</span>
                  <span className="font-bold text-cyan-500 dark:text-cyan-300">{form.formatOutput}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 font-mono text-[10px]">MAPEL / KELAS</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{form.mataPelajaran} ({form.kelas})</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 font-mono text-[10px]">FASE / ALOKASI</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{form.fase} / {form.waktu}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-white/5">
                  <span className="text-slate-500 font-mono text-[10px]">MODEL</span>
                  <span className="font-bold text-purple-500 dark:text-purple-300">{form.model}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-500 font-mono text-[10px] block mb-0.5">TOPIK UTAMA</span>
                  <span className="font-semibold text-slate-900 dark:text-white block">{form.topik}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="py-2.5 px-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ubah Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer font-display"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                      <span>MENYUSUN MODUL...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-cyan-200" />
                      <span>GENERATE MODUL AJAR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Preview Workspace: Cyber Glass Surface */}
      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl">
        {/* Workspace Toolbar */}
        <div className="p-4 bg-slate-50/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                  Workspace Pratinjau Dokumen
                </h3>
                {generatedHtml && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                    {getFormatBadgeLabel(form.formatOutput)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Standar cetak resmi PDF, ekspor Word (.DOC), atau salin HTML
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              disabled={!generatedHtml}
              className="flex-1 sm:flex-none bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 disabled:opacity-40 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer font-mono"
              title="Salin Kode HTML Dokumen"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "Tersalin!" : "Salin"}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!generatedHtml}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer font-mono"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF</span>
            </button>

            <button
              onClick={handleExportWord}
              disabled={!generatedHtml}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all cursor-pointer font-mono"
            >
              <Download className="w-4 h-4" />
              <span>Word (.DOC)</span>
            </button>
          </div>
        </div>

        {/* Content Display */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 dark:bg-slate-950/70 custom-scrollbar relative">
          {/* Empty State */}
          {!generatedHtml && !loading && (
            <div className="h-[540px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-slate-900/40">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 dark:text-cyan-400 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-float-slow">
                <BookOpen className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base font-display">
                Lembar Modul Ajar Siap Disusun
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
                Pilih format dokumen dan skenario pembelajaran di panel sebelah kiri, lalu tekan tombol <b>GENERATE MODUL AJAR</b>.
              </p>
              <div className="grid grid-cols-2 gap-2 text-left max-w-md w-full text-[11px]">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10">
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-0.5">✓ Standar Merdeka</span>
                  Lengkap dengan Kop, Komponen Inti, LKPD & TTD
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10">
                  <span className="font-bold text-purple-600 dark:text-purple-400 block mb-0.5">✓ Deep Learning</span>
                  3 Dimensi: Mindful, Meaningful, & Joyful
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">✓ Ringkas 1-2 Lembar</span>
                  Praktis & esensial untuk supervisi cepat
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">✓ Integrasi Kemenag</span>
                  Panca Cinta & 10 Nilai Karakter PPRA
                </div>
              </div>
            </div>
          )}

          {/* Laser Scanning Telemetry Status during Loading */}
          {loading && (
            <div className="h-[540px] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
              {/* Virtual Document Scanning Hologram */}
              <div className="w-72 h-88 rounded-xl bg-white/5 border border-cyan-500/30 relative overflow-hidden flex flex-col justify-between p-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                {/* Horizontal Laser Scanning Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse-laser top-1/2 -translate-y-1/2" />
                
                {/* Hologram Header Wireframe */}
                <div className="space-y-2 opacity-50">
                  <div className="h-3 w-1/2 bg-cyan-400/40 rounded mx-auto" />
                  <div className="h-2 w-3/4 bg-cyan-400/20 rounded mx-auto" />
                  <div className="h-0.5 w-full bg-cyan-400/30 mt-2" />
                </div>

                {/* Hologram Body Skeleton */}
                <div className="space-y-2 opacity-40">
                  <div className="h-2 w-full bg-cyan-400/20 rounded" />
                  <div className="h-2 w-5/6 bg-cyan-400/20 rounded" />
                  <div className="h-2 w-4/6 bg-cyan-400/20 rounded" />
                  <div className="h-12 w-full border border-cyan-400/30 rounded" />
                </div>

                {/* Hologram Footer */}
                <div className="flex justify-between opacity-50 pt-2 border-t border-cyan-400/20 text-[8px] font-mono text-cyan-300">
                  <span>MODUL_AJAR.HTML</span>
                  <span>SYNCING_PROMPTS...</span>
                </div>
              </div>

              {/* Console Telemetry readout */}
              <div className="mt-6 space-y-2 max-w-md w-full">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>AI_SYNTHESIS_STAGE [{telemetryStage + 1}/4]</span>
                </div>
                <p className="text-xs font-mono text-cyan-400/90 font-bold tracking-tight">
                  {telemetryStages[telemetryStage]}
                </p>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-1.5 transition-all duration-700 rounded-full"
                    style={{ width: `${((telemetryStage + 1) / telemetryStages.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Generated Document Preview */}
          {generatedHtml && !loading && (
            <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-xl border border-slate-200 text-xs leading-relaxed space-y-4 font-serif">
              <div
                dangerouslySetInnerHTML={{ __html: generatedHtml }}
                className="prose max-w-none prose-headings:font-sans prose-h1:text-xl prose-h1:font-black prose-h1:text-center prose-h1:text-blue-900 prose-h2:text-sm prose-h2:font-bold prose-h2:border-b-2 prose-h2:border-blue-900 prose-h2:pb-1 prose-h2:mt-6 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-700 prose-th:p-2.5 prose-th:bg-blue-900 prose-th:text-white prose-th:font-bold prose-th:text-center prose-td:border prose-td:border-slate-300 prose-td:p-2 prose-td:text-slate-800"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
