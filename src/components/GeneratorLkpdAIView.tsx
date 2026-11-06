import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ExternalLink,
  FileText,
  Printer,
  Download,
  Copy,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  Layers,
  Wand2
} from "lucide-react";
import { Pengaturan, Siswa, Mapel } from "../types";
import {
  getPerangkatSyncData,
  getDefaultBabList,
  PerangkatAjarSyncData,
  PerangkatBabItem
} from "../utils/perangkatSyncHelper";
import { buildPerMeetingLkpdHtml } from "../utils/athirahModulBuilder";
import { sanitizeHtml } from "../utils/sanitizeHtml";
import {
  notifySimpanSuccess,
  notifySimpanError,
  notifyCetakSuccess,
  notifyUnduhSuccess,
  notifyUnduhError
} from "../lib/swal";

interface GeneratorLkpdAIViewProps {
  config?: Pengaturan;
  siswaList?: Siswa[];
  mapelList?: Mapel[];
}

export const GeneratorLkpdAIView: React.FC<GeneratorLkpdAIViewProps> = ({
  config,
  siswaList = [],
  mapelList = []
}) => {
  const targetUrl = "https://gemini.google.com/share/c13c70537645?skid=13a642df-4790-4ae1-abe0-8a44e6b08b0e";

  const availableClasses = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();
  const availableMapels = Array.from(new Set(mapelList.map((m) => m.namaMapel || (m as any).nama).filter(Boolean))).sort();

  const [form, setForm] = useState({
    namaGuru: config?.Nama_Guru || "",
    nipGuru: config?.NIP_Guru || "",
    namaSekolah: config?.Nama_Sekolah || "Sekolah Islam Athirah",
    namaKepsek: config?.Nama_Kepsek || "",
    nipKepsek: config?.NIP_Kepsek || "",
    tempatTtd: config?.Tempat_Tanda_Tangan || "Makassar",
    tahunAjaran: "2026/2027",
    semester: "Ganjil",
    jenjang: "SMP",
    fase: "Fase D (Kelas 7-9)",
    kelas: availableClasses[0] || "VII",
    mataPelajaran: availableMapels[0] || "Informatika",
    topik: "Bab 1: Berpikir Komputasional dan Algoritma Dasar",
    tujuan: "",
    waktu: "2 x 45 Menit",
    jumlahPertemuan: "2",
    model: "Problem Based Learning (PBL)",
    programKhas: "Public Speaking",
    sertakanKop: true
  });

  const [daftarBab, setDaftarBab] = useState<PerangkatBabItem[]>([]);
  const [selectedBabId, setSelectedBabId] = useState<string>("bab-1");
  const [isManualBab, setIsManualBab] = useState<boolean>(false);
  const [isSyncActive, setIsSyncActive] = useState<boolean>(false);
  const [selectedMeetingFilter, setSelectedMeetingFilter] = useState<number>(0); // 0 = Semua Pertemuan
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!config) return;
    setForm((prev) => ({
      ...prev,
      namaGuru: prev.namaGuru || config.Nama_Guru || "",
      nipGuru: prev.nipGuru || config.NIP_Guru || "",
      namaSekolah: prev.namaSekolah || config.Nama_Sekolah || "Sekolah Islam Athirah",
      namaKepsek: prev.namaKepsek || config.Nama_Kepsek || "",
      nipKepsek: prev.nipKepsek || config.NIP_Kepsek || "",
      tempatTtd: prev.tempatTtd || config.Tempat_Tanda_Tangan || "Makassar"
    }));
  }, [config]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      kelas: (!prev.kelas || prev.kelas === "VII") && availableClasses.length > 0 ? availableClasses[0] : prev.kelas,
      mataPelajaran: (!prev.mataPelajaran || prev.mataPelajaran === "Informatika") && availableMapels.length > 0 && !isSyncActive ? availableMapels[0] : prev.mataPelajaran
    }));
  }, [availableClasses.join(","), availableMapels.join(","), isSyncActive]);

  const applySyncData = (data: PerangkatAjarSyncData | null, forceFirst = false) => {
    if (!data || !data.daftarBab || data.daftarBab.length === 0) {
      const defBabs = getDefaultBabList(form.mataPelajaran, form.fase);
      setDaftarBab(defBabs);
      setIsSyncActive(false);
      return;
    }

    setIsSyncActive(true);
    setDaftarBab(data.daftarBab);
    const activeBab =
      forceFirst || !form.topik
        ? data.daftarBab[0]
        : data.daftarBab.find((b) => b.id === selectedBabId) || data.daftarBab[0];

    if (activeBab) {
      setSelectedBabId(activeBab.id);
    }

    setForm((prev) => ({
      ...prev,
      mataPelajaran: data.mataPelajaran || prev.mataPelajaran,
      jenjang: data.jenjang || prev.jenjang,
      fase: data.fase || prev.fase,
      kelas: data.kelas || prev.kelas,
      tahunAjaran: data.tahunAjaran || prev.tahunAjaran,
      semester: activeBab ? (activeBab.semester === "2" || activeBab.semester === "Genap" ? "Genap" : "Ganjil") : prev.semester,
      namaSekolah: data.namaSekolah || prev.namaSekolah,
      namaGuru: data.namaGuru || prev.namaGuru,
      nipGuru: data.nipGuru || prev.nipGuru,
      namaKepsek: data.namaKepsek || prev.namaKepsek,
      nipKepsek: data.nipKepsek || prev.nipKepsek,
      tempatTtd: data.tempatTtd || prev.tempatTtd,
      topik: activeBab?.judulBab || prev.topik,
      tujuan: activeBab?.tujuanPembelajaran || prev.tujuan,
      waktu: activeBab?.alokasiWaktu || prev.waktu,
      jumlahPertemuan: activeBab?.jumlahPertemuan || prev.jumlahPertemuan
    }));
  };

  useEffect(() => {
    const data = getPerangkatSyncData();
    applySyncData(data, true);

    const handleSyncEvent = (e: any) => {
      const freshData = e.detail || getPerangkatSyncData();
      applySyncData(freshData, true);
    };

    window.addEventListener("edufutura_perangkat_sync_updated", handleSyncEvent);
    return () => window.removeEventListener("edufutura_perangkat_sync_updated", handleSyncEvent);
  }, []);

  // Re-render LKPD preview automatically whenever form or filter changes
  useEffect(() => {
    const html = buildPerMeetingLkpdHtml(
      {
        ...form,
        formatOutput: "sekolah_format1_iso",
        templateCategory: "sekolah"
      },
      {
        selectedMeeting: selectedMeetingFilter > 0 ? selectedMeetingFilter : undefined,
        standalone: true
      }
    );
    setGeneratedHtml(html);
  }, [form, selectedMeetingFilter]);

  const handleBabSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bId = e.target.value;
    setSelectedBabId(bId);
    if (bId === "custom") {
      setIsManualBab(true);
      return;
    }
    const bab = daftarBab.find((b) => b.id === bId);
    if (bab) {
      setIsManualBab(false);
      setSelectedMeetingFilter(0);
      setForm((prev) => ({
        ...prev,
        topik: bab.judulBab,
        tujuan: bab.tujuanPembelajaran,
        waktu: bab.alokasiWaktu || prev.waktu,
        jumlahPertemuan: bab.jumlahPertemuan || prev.jumlahPertemuan
      }));
      notifySimpanSuccess(`LKPD disinkronkan dengan "${bab.judulBab}" (${bab.jumlahPertemuan} Pertemuan)`);
    }
  };

  const handleOpenLink = () => {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopy = () => {
    if (!generatedHtml) return;
    navigator.clipboard.writeText(generatedHtml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notifySimpanSuccess("HTML LKPD Setiap Pertemuan berhasil disalin!");
    });
  };

  const handleExportWord = () => {
    if (!generatedHtml) return;
    try {
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>LKPD - ${form.mataPelajaran}</title>
          <style>
            @page { size: A4 portrait; margin: 1.5cm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.35; color: #000000; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; }
            th { border: 1pt solid #000000; padding: 5pt 6pt; background-color: #9CC2E5 !important; color: #000000 !important; font-family: 'Times New Roman', Times, serif !important; font-weight: bold; text-align: center; }
            td { border: 1pt solid #000000; padding: 4pt 6pt; vertical-align: top; color: #000000 !important; font-family: 'Times New Roman', Times, serif !important; }
            .iso-kop-table { width: 100% !important; border-collapse: collapse !important; border: 1pt solid #000000 !important; margin-bottom: 10pt !important; font-family: Arial, Helvetica, sans-serif !important; }
            .iso-kop-table td { border: 1pt solid #000000 !important; padding: 2pt 4pt !important; font-family: Arial, Helvetica, sans-serif !important; font-size: 8pt !important; vertical-align: middle !important; }
            .iso-kop-table img.logo-athirah-kop { width: 65px !important; height: auto !important; display: block !important; margin: 0 auto !important; }
          </style>
        </head>
        <body>
      `;
      const footer = "</body></html>";
      const blob = new Blob(["\ufeff", header + generatedHtml + footer], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanTopic = form.topik ? form.topik.replace(/\s+/g, "_") : "LKPD";
      const suffix = selectedMeetingFilter > 0 ? `Pertemuan_${selectedMeetingFilter}` : `Semua_${form.jumlahPertemuan}_Pertemuan`;
      link.href = url;
      link.download = `LKPD_${form.mataPelajaran}_${suffix}_${cleanTopic}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notifyUnduhSuccess("Dokumen LKPD (.DOC) berhasil diunduh dan siap diedit di Microsoft Word!");
    } catch (_err) {
      notifyUnduhError("Gagal mengunduh dokumen LKPD Word.");
    }
  };

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
          <title>Cetak LKPD - ${form.topik}</title>
          <style>
            @page { size: A4 portrait; margin: 1.5cm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.35; color: #000000; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; page-break-inside: auto; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            th { border: 1pt solid #000000 !important; padding: 5pt 6pt; background-color: #9CC2E5 !important; color: #000000 !important; font-family: 'Times New Roman', Times, serif !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            td { border: 1pt solid #000000 !important; padding: 4pt 6pt; vertical-align: top; color: #000000 !important; font-family: 'Times New Roman', Times, serif !important; }
            .iso-kop-table { width: 100% !important; border-collapse: collapse !important; border: 1pt solid #000000 !important; margin-bottom: 10pt !important; font-family: Arial, Helvetica, sans-serif !important; }
            .iso-kop-table td { border: 1pt solid #000000 !important; padding: 2pt 4pt !important; font-family: Arial, Helvetica, sans-serif !important; font-size: 8pt !important; vertical-align: middle !important; }
            .iso-kop-table img.logo-athirah-kop { display: inline-block !important; width: 68px !important; height: auto !important; margin: 0 auto !important; }
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
      notifyCetakSuccess("Lembar Kerja Peserta Didik (LKPD) siap dicetak!");
    }, 500);
  };

  const totalPertemuanCount = Math.min(8, Math.max(1, parseInt(String(form.jumlahPertemuan || "2"), 10) || 2));

  return (
    <div className="space-y-6">
      {/* Top Banner: In-App LKPD Builder + External Gemini Option */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-indigo-500/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold px-3 py-1 rounded-full text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generator LKPD Setiap Pertemuan &bull; Standar ISO Athirah</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white font-display">
            Pembuat LKPD Otomatis Setiap Pertemuan (Pertemuan 1 s.d. {totalPertemuanCount})
          </h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Tersinkronisasi langsung dengan rantai data <strong>Kelas, Mata Pelajaran, Perangkat Ajar (CP/TP/ATP), dan Modul Ajar</strong>. Dilengkapi KOP Resmi Sekolah Islam Athirah, aktivitas <em>Deep Learning (Mindful, Meaningful, Joyful)</em>, dan rubrik <strong>{form.programKhas || "Public Speaking"}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              const data = getPerangkatSyncData();
              applySyncData(data, true);
              notifySimpanSuccess("Data LKPD berhasil disinkronkan dari Perangkat Ajar & Modul Ajar!");
            }}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sinkronkan Rantai Data</span>
          </button>

          <button
            type="button"
            onClick={handleOpenLink}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 text-xs cursor-pointer"
            title="Buka juga Google Gemini Shared Prompt Eksternal"
          >
            <span>Gemini Shared Prompt</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Parameter Control + Right Live Document Preview */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Control Card */}
        <div className="w-full lg:w-[400px] glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xl space-y-4 shrink-0 self-start">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2.5">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                Parameter LKPD Per Pertemuan
              </h3>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              isSyncActive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30"
            }`}>
              {isSyncActive ? "✓ Rantai Data Aktif" : "Siap Pakai"}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Pilih Bab / Topik dari Perangkat Ajar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Bab / Materi Pokok *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualBab(!isManualBab)}
                  className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
                >
                  {isManualBab ? "Pilih dari Daftar Bab" : "Ketik Manual"}
                </button>
              </div>

              {!isManualBab && daftarBab.length > 0 ? (
                <select
                  value={selectedBabId}
                  onChange={handleBabSelect}
                  className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-white dark:bg-slate-900 border-cyan-500/50 text-slate-900 dark:text-cyan-100 outline-none"
                >
                  {daftarBab.map((bab) => (
                    <option key={bab.id} value={bab.id}>
                      {bab.judulBab} ({bab.jumlahPertemuan} Pertemuan)
                    </option>
                  ))}
                  <option value="custom">✏️ Ketik Judul Bab / Materi Manual...</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={form.topik}
                  onChange={(e) => setForm((prev) => ({ ...prev, topik: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-white/10 outline-none"
                  placeholder="Masukkan Bab / Topik LKPD"
                />
              )}
            </div>

            {/* Kelas & Mata Pelajaran (Terhubung Rantai Data) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelas Diampu</label>
                <input
                  type="text"
                  value={form.kelas}
                  onChange={(e) => setForm((prev) => ({ ...prev, kelas: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none"
                />
                {availableClasses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {availableClasses.slice(0, 5).map((kls) => (
                      <button
                        key={kls}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, kelas: kls }))}
                        className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                          form.kelas === kls
                            ? "bg-cyan-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {kls}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={form.mataPelajaran}
                  onChange={(e) => setForm((prev) => ({ ...prev, mataPelajaran: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none"
                />
                {availableMapels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {availableMapels.slice(0, 3).map((mpl) => (
                      <button
                        key={mpl}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, mataPelajaran: mpl }))}
                        className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold truncate max-w-[100px] cursor-pointer ${
                          form.mataPelajaran === mpl
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {mpl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Jumlah Pertemuan & Program Khas */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jumlah Pertemuan</label>
                <select
                  value={form.jumlahPertemuan}
                  onChange={(e) => {
                    setSelectedMeetingFilter(0);
                    setForm((prev) => ({ ...prev, jumlahPertemuan: e.target.value }));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 outline-none"
                >
                  <option value="1">1 Pertemuan</option>
                  <option value="2">2 Pertemuan</option>
                  <option value="3">3 Pertemuan</option>
                  <option value="4">4 Pertemuan</option>
                  <option value="5">5 Pertemuan</option>
                  <option value="6">6 Pertemuan</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1">
                  Program Khas *
                </label>
                <input
                  type="text"
                  value={form.programKhas}
                  onChange={(e) => setForm((prev) => ({ ...prev, programKhas: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border rounded-lg bg-emerald-50/60 dark:bg-slate-950 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 outline-none"
                  placeholder="Public Speaking"
                />
              </div>
            </div>

            {/* Tujuan Pembelajaran */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Tujuan Pembelajaran (Otomatis dari TP/ATP)
              </label>
              <textarea
                rows={3}
                value={form.tujuan}
                onChange={(e) => setForm((prev) => ({ ...prev, tujuan: e.target.value }))}
                placeholder="Tujuan Pembelajaran otomatis terisi dari Perangkat Ajar..."
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none custom-scrollbar"
              />
            </div>

            {/* Guru & Sekolah */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Guru</label>
                <input
                  type="text"
                  value={form.namaGuru}
                  onChange={(e) => setForm((prev) => ({ ...prev, namaGuru: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={form.namaSekolah}
                  onChange={(e) => setForm((prev) => ({ ...prev, namaSekolah: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 outline-none"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Setiap pertemuan dilengkapi <strong>KOP ISO 015-LKPD</strong>, Aktivitas 1 (Memahami), Aktivitas 2 (Mengaplikasi), Aktivitas 3 (Unjuk Kerja <strong>{form.programKhas || "Public Speaking"}</strong>), Soal Evaluasi Tertulis, dan Refleksi.
              </span>
            </div>
          </div>
        </div>

        {/* Right Preview & Export Card */}
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl">
          {/* Toolbar */}
          <div className="p-4 bg-slate-50/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedMeetingFilter(0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedMeetingFilter === 0
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                }`}
              >
                Semua ({totalPertemuanCount} Pertemuan)
              </button>
              {Array.from({ length: totalPertemuanCount }, (_, idx) => idx + 1).map((mNum) => (
                <button
                  key={mNum}
                  type="button"
                  onClick={() => setSelectedMeetingFilter(mNum)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedMeetingFilter === mNum
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                  }`}
                >
                  Pertemuan {mNum}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopy}
                className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer font-mono"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? "Tersalin!" : "Salin"}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer font-mono"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportWord}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer font-mono"
              >
                <Download className="w-4 h-4" />
                <span>Word (.DOC)</span>
              </button>
            </div>
          </div>

          {/* Document Sheet */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60 dark:bg-slate-950/70 custom-scrollbar max-h-[800px]">
            <div
              className="max-w-4xl mx-auto bg-white text-black p-6 sm:p-10 shadow-2xl rounded-xl border border-slate-300 text-[11pt] leading-snug"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(generatedHtml) }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
