import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  X,
  HardDrive,
  Download,
  Upload,
  Cloud,
  FileJson,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderOpen,
  HelpCircle,
  Clock,
  BookOpen,
  Users,
  Copy,
  Info
} from "lucide-react";
import { DataNilai, Siswa, Mapel, Pengaturan } from "../types";
import { batchSaveDocuments, COLLECTIONS } from "../lib/firebase";
import { 
  notifyUnduhSuccess, 
  notifyUnduhError, 
  showToastSuccess, 
  showToastError,
  showSuccessAlert,
  showErrorAlert
} from "../lib/swal";

interface BackupPenilaianModalProps {
  isOpen: boolean;
  onClose: () => void;
  nilaiList: DataNilai[];
  siswaList: Siswa[];
  mapelList: Mapel[];
  config: Pengaturan;
  activeKelas?: string;
  activeMapel?: string;
}

export const BackupPenilaianModal: React.FC<BackupPenilaianModalProps> = ({
  isOpen,
  onClose,
  nilaiList,
  siswaList,
  mapelList,
  config,
  activeKelas = "ALL",
  activeMapel = "ALL"
}) => {
  // Tabs: 'ekspor' (Unduh & Google Drive) vs 'impor' (Restore dari .JSON)
  const [activeTab, setActiveTab] = useState<"ekspor" | "impor">("ekspor");

  // Filter scopes for export
  const [selectedFilterKelas, setSelectedFilterKelas] = useState<string>("ALL");
  const [selectedFilterMapel, setSelectedFilterMapel] = useState<string>("ALL");

  // Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalBoxRef = useRef<HTMLDivElement>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    valid: boolean;
    totalRecords: number;
    createdAt?: string;
    sekolah?: string;
    guru?: string;
    kelasFound: string[];
    mapelFound: string[];
    records: DataNilai[];
    errorMsg?: string;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Modern Web Guidance: Light Dismiss via ESC Key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Kelas options from siswa and nilai
  const availableKelas = useMemo(() => {
    const setK = new Set<string>();
    siswaList.forEach((s) => s.kelas && setK.add(s.kelas));
    nilaiList.forEach((n) => n.kelas && setK.add(n.kelas));
    return Array.from(setK).sort();
  }, [siswaList, nilaiList]);

  // Mapel options
  const availableMapel = useMemo(() => {
    const setM = new Set<string>();
    mapelList.forEach((m) => m.namaMapel && setM.add(m.namaMapel));
    nilaiList.forEach((n) => n.mapel && setM.add(n.mapel));
    return Array.from(setM).sort();
  }, [mapelList, nilaiList]);

  // Filtered grades to be exported
  const gradesToExport = useMemo(() => {
    return nilaiList.filter((n) => {
      const matchKelas = selectedFilterKelas === "ALL" || n.kelas === selectedFilterKelas;
      const matchMapel = selectedFilterMapel === "ALL" || n.mapel === selectedFilterMapel;
      return matchKelas && matchMapel;
    });
  }, [nilaiList, selectedFilterKelas, selectedFilterMapel]);

  // Handle Export / Download .JSON
  const handleDownloadJson = (andOpenDrive: boolean = false) => {
    if (gradesToExport.length === 0) {
      showToastError("Tidak ada data penilaian yang sesuai dengan filter yang dipilih.");
      return;
    }

    try {
      const now = new Date();
      const dateIso = now.toISOString();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");

      const backupPayload = {
        app: "EdAdmin - Aplikasi Guru AI",
        format: "EDADMIN_PENILAIAN_BACKUP_V1",
        version: "1.0",
        exportedAt: dateIso,
        waktuEkspor: now.toLocaleString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        metadata: {
          namaGuru: config.Nama_Guru || "Guru Mata Pelajaran",
          sekolah: config.Nama_Sekolah || "Sekolah",
          filterKelas: selectedFilterKelas,
          filterMapel: selectedFilterMapel,
          totalPenilaian: gradesToExport.length,
          kkmTarget: 75,
          bobotResmi: {
            sumatif: "50%",
            uts: "35%",
            uas: "15%"
          }
        },
        dataNilai: gradesToExport
      };

      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const kelasPart = selectedFilterKelas !== "ALL" ? `_Kelas_${selectedFilterKelas}` : "_SemuaKelas";
      const mapelPart = selectedFilterMapel !== "ALL" ? `_${selectedFilterMapel.replace(/\s+/g, "")}` : "";
      const fileName = `Backup_Penilaian${kelasPart}${mapelPart}_${dateStr}_${timeStr}.json`.replace(/[\/\\:*?"<>|]/g, "_");

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (andOpenDrive) {
        // Buka Google Drive di tab baru
        window.open("https://drive.google.com/drive/my-drive", "_blank");
        notifyUnduhSuccess(
          `File backup "${fileName}" berhasil diunduh! Tab Google Drive telah dibuka. Silakan unggah atau seret file JSON tersebut ke Google Drive Anda.`
        );
      } else {
        notifyUnduhSuccess(`File backup "${fileName}" (${gradesToExport.length} data nilai) berhasil diunduh ke perangkat Anda!`);
      }
    } catch (err: any) {
      notifyUnduhError("Gagal mengunduh file backup: " + (err.message || err));
    }
  };

  // Handle File Input Change for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      showToastError("Silakan pilih file dengan ekstensi .json.");
      return;
    }

    setRestoreFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validasi struktur JSON
        let records: DataNilai[] = [];
        if (Array.isArray(parsed.dataNilai)) {
          records = parsed.dataNilai;
        } else if (Array.isArray(parsed)) {
          records = parsed;
        } else {
          setRestorePreview({
            valid: false,
            totalRecords: 0,
            kelasFound: [],
            mapelFound: [],
            records: [],
            errorMsg: "Format file JSON tidak dikenali. File harus memuat array penilaian 'dataNilai'."
          });
          return;
        }

        // Filter record valid yang memiliki mapel, kelas, dan nilai
        const validRecords = records.filter(
          (r) => r && typeof r === "object" && r.kelas && r.mapel && r.namaSiswa
        );

        if (validRecords.length === 0) {
          setRestorePreview({
            valid: false,
            totalRecords: 0,
            kelasFound: [],
            mapelFound: [],
            records: [],
            errorMsg: "Tidak ditemukan data penilaian siswa yang valid di dalam file ini."
          });
          return;
        }

        const kelasSet = Array.from(new Set(validRecords.map((r) => r.kelas))).sort();
        const mapelSet = Array.from(new Set(validRecords.map((r) => r.mapel))).sort();

        setRestorePreview({
          valid: true,
          totalRecords: validRecords.length,
          createdAt: parsed.waktuEkspor || parsed.exportedAt || "-",
          sekolah: parsed.metadata?.sekolah || "-",
          guru: parsed.metadata?.namaGuru || "-",
          kelasFound: kelasSet,
          mapelFound: mapelSet,
          records: validRecords
        });
      } catch (err: any) {
        setRestorePreview({
          valid: false,
          totalRecords: 0,
          kelasFound: [],
          mapelFound: [],
          records: [],
          errorMsg: "File JSON rusak atau tidak dapat dibaca: " + err.message
        });
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore to Firebase
  const handleExecuteRestore = async () => {
    if (!restorePreview || !restorePreview.valid || restorePreview.records.length === 0) {
      showToastError("Tidak ada data penilaian yang valid untuk dipulihkan.");
      return;
    }

    setIsRestoring(true);
    try {
      // Pastikan setiap record memiliki ID unik yang konsisten
      const cleanRecords: DataNilai[] = restorePreview.records.map((r) => {
        const safeJenis = (r.jenis || "Sumatif").replace(/[\s\/-]+/g, "_");
        const docId = r.id || `${r.kelas}_${r.mapel}_${safeJenis}_${r.idSiswa || r.namaSiswa.replace(/\s+/g, "_")}`;
        return {
          ...r,
          id: docId,
          nilai: r.nilai !== "" && r.nilai !== undefined ? Number(r.nilai) : ""
        };
      });

      await batchSaveDocuments(COLLECTIONS.DATA_NILAI, cleanRecords);

      await showSuccessAlert(
        "Pemulihan Data Berhasil!",
        `Sebanyak ${cleanRecords.length} data penilaian berhasil dipulihkan ke Cloud Database.`
      );

      // Reset state and close
      setRestoreFile(null);
      setRestorePreview(null);
      onClose();
    } catch (err: any) {
      showErrorAlert("Gagal Memulihkan Data", err.message || "Terjadi kesalahan saat memulihkan file cadangan.");
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalBoxRef}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-300 shadow-xs shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                  Backup & Salinan Mandiri
                </span>
                <span className="text-xs font-bold text-amber-300">File .JSON & Google Drive</span>
              </div>
              <h2 id="backup-modal-title" className="text-base sm:text-lg font-black leading-snug">
                Cadangkan & Pulihkan Data Penilaian
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-4 sm:px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("ekspor")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
              activeTab === "ekspor"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Ekspor / Cadangkan (.JSON & Google Drive)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("impor")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
              activeTab === "impor"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Pulihkan / Restore dari File .JSON</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar grow">
          {activeTab === "ekspor" ? (
            <>
              {/* FILTER CAKUPAN DATA */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Pilih Cakupan Data yang Ingin Dicadangkan</span>
                  </h4>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {gradesToExport.length} Data Siap Dicadangkan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Filter Kelas:
                    </label>
                    <select
                      value={selectedFilterKelas}
                      onChange={(e) => setSelectedFilterKelas(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-white"
                    >
                      <option value="ALL">Semua Kelas ({availableKelas.length} Kelas)</option>
                      {availableKelas.map((k) => (
                        <option key={k} value={k}>
                          Kelas {k}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Filter Mata Pelajaran:
                    </label>
                    <select
                      value={selectedFilterMapel}
                      onChange={(e) => setSelectedFilterMapel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-white"
                    >
                      <option value="ALL">Semua Mata Pelajaran ({availableMapel.length} Mapel)</option>
                      {availableMapel.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cadangan ini mencakup seluruh nilai Sumatif Materi, Ujian Tengah Semester (UTS), dan Ujian Akhir Semester (UAS) sesuai formula bobot resmi (50% : 35% : 15%).
                </p>
              </div>

              {/* DUA METODE PENYIMPANAN SALINAN */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Saluran Penyimpanan:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* OPSI 1: UNDUH FILE .JSON KE PERANGKAT */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <FileJson className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                        Simpan File .JSON Lokal
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Unduh salinan berkas mentah berformat standar <code>.json</code> langsung ke memori internal laptop, komputer, atau handphone Anda.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadJson(false)}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-transform flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh File .JSON ({gradesToExport.length} Data)</span>
                    </button>
                  </div>

                  {/* OPSI 2: SIMPAN KE GOOGLE DRIVE */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-slate-800 dark:to-slate-800/60 border border-emerald-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                        Simpan ke Google Drive
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Unduh file cadangan dan langsung buka Google Drive pribadi Anda untuk mengunggah dan mengamankan file salinan di awan Google.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadJson(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-transform flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>Unduh & Buka Google Drive &rarr;</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* PANDUAN LANGKAH MENYIMPAN KE GOOGLE DRIVE */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <h5 className="font-extrabold text-xs uppercase tracking-wider">
                    Panduan 3 Langkah Mudah Menyimpan Salinan ke Google Drive:
                  </h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-black text-blue-600 block">Langkah 1</span>
                    <p className="text-[11px] leading-snug">
                      Klik tombol hijau <strong>"Unduh & Buka Google Drive"</strong> di atas. Berkas <code>.json</code> akan tersimpan di folder Download perangkat Anda.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-black text-emerald-600 block">Langkah 2</span>
                    <p className="text-[11px] leading-snug">
                      Di tab Google Drive yang terbuka, buat atau buka folder khusus (contoh: <em>"Backup Nilai Guru 2026"</em>).
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-black text-purple-600 block">Langkah 3</span>
                    <p className="text-[11px] leading-snug">
                      Tarik (*drag & drop*) berkas <code>.json</code> tadi ke Google Drive. Salinan penilaian Anda kini aman seumur hidup di Google Drive pribadi!
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* TAB IMPOR / RESTORE DARI FILE .JSON */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-bold">
                    Fitur Pemulihan (Restore) Data Penilaian
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Gunakan fitur ini jika Anda ingin mengembalikan atau menyinkronkan data nilai dari file cadangan <code>.json</code> yang pernah Anda unduh sebelumnya.
                  </p>
                </div>
              </div>

              {/* UPLOAD FILE DROP AREA */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    Pilih File Cadangan .JSON
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Klik di sini untuk memilih berkas dari komputer/HP Anda
                  </p>
                </div>
                {restoreFile && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    File Terpilih: {restoreFile.name}
                  </span>
                )}
              </div>

              {/* HASIL PREVIEW FILE JIKA ADA */}
              {restorePreview && (
                <div className="space-y-3 pt-2">
                  {restorePreview.valid ? (
                    <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-black text-xs uppercase tracking-wider">
                          Struktur File Valid & Siap Dipulihkan
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50">
                          <span className="text-slate-400 block text-[10px] font-bold">TOTAL NILAI</span>
                          <span className="text-base font-black text-emerald-600 font-mono">
                            {restorePreview.totalRecords} Rekaman
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50">
                          <span className="text-slate-400 block text-[10px] font-bold">KELAS TERCAKUP</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block">
                            {restorePreview.kelasFound.join(", ")}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50">
                          <span className="text-slate-400 block text-[10px] font-bold">MATA PELAJARAN</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block">
                            {restorePreview.mapelFound.join(", ")}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                        <span>Waktu Pembuatan Cadangan: {restorePreview.createdAt}</span>
                        <span>Guru: {restorePreview.guru}</span>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleExecuteRestore}
                          disabled={isRestoring}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          {isRestoring ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Sedang Memulihkan Data ke Database...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Pulihkan {restorePreview.totalRecords} Data Nilai Sekarang</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start space-x-3 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black block">File Tidak Valid</span>
                        <p>{restorePreview.errorMsg}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Salinan data aman & kompatibel di semua perangkat</span>
          </div>

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
  );
};
