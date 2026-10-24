import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Upload, 
  Download, 
  Plus, 
  Search, 
  Trash2, 
  Pencil, 
  X, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Database, 
  RotateCcw,
  Check,
  Copy,
  SlidersHorizontal,
  GraduationCap,
  Layers,
  ArrowUpDown
} from "lucide-react";
import * as XLSX from "xlsx";
import { Siswa } from "../types";
import { saveDocument, deleteDocument, batchSaveDocuments, COLLECTIONS } from "../lib/firebase";
import { 
  notifySimpanSuccess, 
  notifySimpanError, 
  notifyEditSuccess, 
  notifyEditError, 
  notifyHapusSuccess, 
  notifyHapusError, 
  notifyUnduhSuccess, 
  notifyUnduhError, 
  confirmDeleteAlert 
} from "../lib/swal";

interface KelolaSiswaViewProps {
  siswaList: Siswa[];
}

export const KelolaSiswaView: React.FC<KelolaSiswaViewProps> = ({ siswaList }) => {
  const [nisn, setNisn] = useState("");
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("");
  const [search, setSearch] = useState("");
  const [selectedKelasFilter, setSelectedKelasFilter] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Batch Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedNisn, setCopiedNisn] = useState<string | null>(null);

  // Edit Siswa State
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [editNisn, setEditNisn] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editKelas, setEditKelas] = useState("");

  // Modal ref for light-dismiss
  const modalRef = useRef<HTMLDivElement>(null);

  const kelasOptions = Array.from(new Set(siswaList.map((s) => s.kelas).filter(Boolean))).sort();

  // Light-dismiss and ESC keyboard trapping for Edit Modal
  useEffect(() => {
    if (!editingSiswa) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingSiswa(null);
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setEditingSiswa(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [editingSiswa]);

  // Copy to clipboard helper
  const handleCopyNisn = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedNisn(val);
    setTimeout(() => {
      setCopiedNisn(null);
    }, 2000);
  };

  // Start Editing Siswa
  const handleStartEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setEditNisn(siswa.nisn);
    setEditNama(siswa.nama);
    setEditKelas(siswa.kelas);
  };

  // Save Edit Siswa
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;

    if (!editNisn.trim() || !editNama.trim() || !editKelas.trim()) {
      notifyEditError("Mohon lengkapi NISN, Nama Lengkap, dan Kelas.");
      return;
    }

    // Check duplicate NISN (if changed to an existing NISN of another student)
    const duplicate = siswaList.find((s) => s.id !== editingSiswa.id && s.nisn === editNisn.trim());
    if (duplicate) {
      notifyEditError(`NISN ${editNisn} sudah digunakan oleh siswa ${duplicate.nama}.`);
      return;
    }

    const updatedSiswa: Siswa = {
      ...editingSiswa,
      nisn: editNisn.trim(),
      nama: editNama.trim(),
      kelas: editKelas.trim()
    };

    try {
      await saveDocument(COLLECTIONS.SISWA, editingSiswa.id, updatedSiswa);
      setEditingSiswa(null);
      notifyEditSuccess(`Data siswa ${updatedSiswa.nama} berhasil diperbarui!`);
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui data siswa.");
    }
  };

  // Handle manual submit
  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim() || !nama.trim() || !kelas.trim()) {
      notifySimpanError("Mohon isi NISN, Nama Lengkap, dan Kelas.");
      return;
    }

    const exists = siswaList.find((s) => s.nisn === nisn.trim());
    if (exists) {
      notifySimpanError(`Siswa dengan NISN ${nisn} sudah ada dalam database!`);
      return;
    }

    const id = Date.now().toString();
    const newSiswa: Siswa = {
      id,
      nisn: nisn.trim(),
      nama: nama.trim(),
      kelas: kelas.trim()
    };

    try {
      await saveDocument(COLLECTIONS.SISWA, id, newSiswa);
      setNisn("");
      setNama("");
      setKelas("");
      notifySimpanSuccess(`Siswa ${newSiswa.nama} berhasil ditambahkan!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan data siswa.");
    }
  };

  // Delete student
  const handleDelete = async (id: string, namaSiswa: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Data Siswa?", `Apakah Anda yakin ingin menghapus data siswa ${namaSiswa}?`);
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.SISWA, id);
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        notifyHapusSuccess(`Data ${namaSiswa} telah dihapus.`);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus data.");
      }
    }
  };

  // Batch delete selected students
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const isConfirmed = await confirmDeleteAlert(
      `Hapus ${selectedIds.length} Siswa Terpilih?`, 
      `Tindakan ini akan menghapus data dari Cloud Firestore dan tidak dapat dibatalkan.`
    );
    if (isConfirmed) {
      try {
        await Promise.all(selectedIds.map((id) => deleteDocument(COLLECTIONS.SISWA, id)));
        notifyHapusSuccess(`Berhasil menghapus ${selectedIds.length} siswa terpilih.`);
        setSelectedIds([]);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus sebagian data siswa.");
      }
    }
  };

  // Muat Data Siswa Contoh / Demo
  const handleLoadSampleStudents = async () => {
    setIsSeeding(true);
    const sampleSiswa: Siswa[] = [
      { id: "1001", nisn: "0012345678", nama: "Ahmad Fulan", kelas: "VII A" },
      { id: "1002", nisn: "0012345679", nama: "Siti Aminah", kelas: "VII A" },
      { id: "1003", nisn: "0012345680", nama: "Budi Pratama", kelas: "VII B" },
      { id: "1004", nisn: "0012345681", nama: "Rizky Febrian", kelas: "VII B" },
      { id: "1005", nisn: "0012345682", nama: "Dewi Lestari", kelas: "VII A" },
      { id: "1006", nisn: "0012345683", nama: "Fajar Nugraha", kelas: "VII B" }
    ];

    try {
      const existingNisns = new Set(siswaList.map((s) => s.nisn));
      const toAdd = sampleSiswa.filter((s) => !existingNisns.has(s.nisn));
      
      if (toAdd.length === 0) {
        notifySimpanSuccess("Data siswa contoh sudah ada di database!");
        setIsSeeding(false);
        return;
      }

      await batchSaveDocuments(COLLECTIONS.SISWA, toAdd);
      localStorage.removeItem("edadmin_database_cleared");
      notifySimpanSuccess(`Berhasil memuat ${toAdd.length} data siswa contoh ke Cloud Firestore!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal memuat data contoh.");
    } finally {
      setIsSeeding(false);
    }
  };

  // Download XLSX template
  const downloadTemplate = () => {
    try {
      const data = [
        { NISN: "0012345678", "Nama Siswa": "Ahmad Fulan", Kelas: "VII A" },
        { NISN: "0012345679", "Nama Siswa": "Siti Aminah", Kelas: "VII A" },
        { NISN: "0012345680", "Nama Siswa": "Budi Pratama", Kelas: "VII B" }
      ];
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Siswa");
      XLSX.writeFile(workbook, "Template_Import_Siswa.xlsx");
      notifyUnduhSuccess("Template_Import_Siswa.xlsx berhasil diunduh!");
    } catch (err: any) {
      notifyUnduhError("Gagal mengunduh template Excel.");
    }
  };

  // Upload XLSX import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        const existingNisns = new Set(siswaList.map((s) => s.nisn));
        const newItems: Siswa[] = [];

        rows.forEach((row, idx) => {
          const nisnVal = String(row["NISN"] || row["nisn"] || "").trim();
          const namaVal = String(row["Nama Siswa"] || row["Nama"] || row["nama"] || "").trim();
          const kelasVal = String(row["Kelas"] || row["kelas"] || "").trim();

          if (nisnVal && namaVal && kelasVal && !existingNisns.has(nisnVal)) {
            newItems.push({
              id: `${Date.now()}_${idx}`,
              nisn: nisnVal,
              nama: namaVal,
              kelas: kelasVal
            });
            existingNisns.add(nisnVal);
          }
        });

        if (newItems.length > 0) {
          await batchSaveDocuments(COLLECTIONS.SISWA, newItems);
          localStorage.removeItem("edadmin_database_cleared");
          notifySimpanSuccess(`Berhasil mengimpor ${newItems.length} siswa baru ke Cloud Firestore!`);
        } else {
          notifySimpanError("Tidak ada siswa baru yang dapat diimpor (mungkin duplikat atau kolom tidak sesuai).");
        }
      } catch (err: any) {
        notifySimpanError("Format file Excel tidak valid. Gunakan template yang disediakan.");
      }
      e.target.value = "";
    };
    reader.readAsBinaryString(file);
  };

  // Filtered list
  const filteredList = siswaList.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.nama.toLowerCase().includes(q) ||
      s.nisn.toLowerCase().includes(q) ||
      s.kelas.toLowerCase().includes(q);
    const matchesKelas = !selectedKelasFilter || s.kelas === selectedKelasFilter;
    return matchesSearch && matchesKelas;
  });

  // Toggle selection for all filtered
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar - Futuristic Glass HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card glass-card-hover p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-cyan-400/80 font-mono">
                // TOTAL_SISWA_TERDAFTAR
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-display tracking-tight flex items-baseline gap-1.5">
                {siswaList.length} 
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 font-sans">Siswa Aktif</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-violet-400/80 font-mono">
                // ROMBEL_TERSTRUKTUR
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-display tracking-tight flex items-baseline gap-1.5">
                {kelasOptions.length} 
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 font-sans">Rombongan Belajar</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400/80 font-mono">
                // SYNC_STATUS_CLOUD
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">FIRESTORE_ONLINE</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <Database className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Cyber Control Deck - Form Tambah & Import Excel */}
      <div className="glass-card rounded-2xl p-6 shadow-sm space-y-5 border border-slate-200/80 dark:border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2.5 font-display">
              <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
              Master Data Siswa & Akun Akademik
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola entitas data siswa, validasi NISN terpusat, dan sinkronisasi otomatis ke modul absensi & raport.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadSampleStudents}
              disabled={isSeeding}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:shadow-xs active:scale-95 disabled:opacity-50"
              title="Muat data contoh siswa (Ahmad Fulan, Siti Aminah, dll)"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isSeeding ? "Memuat..." : "Muat Contoh Siswa"}</span>
            </button>

            <button
              onClick={downloadTemplate}
              className="glass-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer border border-slate-200 dark:border-white/10 hover:shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4 text-cyan-500" />
              <span>Template Excel</span>
            </button>

            <label className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 cursor-pointer transition-all shadow-sm hover:shadow-cyan-500/25 active:scale-95">
              <Upload className="w-4 h-4" />
              <span>Import XLSX</span>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all animate-in fade-in duration-200 ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-red-500/10 text-red-800 dark:text-red-300 border border-red-500/30"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Input Panel Siswa Baru */}
        <form 
          onSubmit={handleAddSiswa} 
          className="bg-slate-50/80 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-3.5"
        >
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1.5">
              NISN_ID *
            </label>
            <input
              type="text"
              placeholder="Contoh: 0012345678"
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700/80 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1.5">
              NAMA_LENGKAP_SISWA *
            </label>
            <input
              type="text"
              placeholder="Masukkan nama lengkap siswa..."
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700/80 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1.5">
              KELAS / ROMBEL *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Contoh: VII A"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700/80 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-white outline-none transition-all uppercase placeholder:text-slate-400"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1.5 cursor-pointer shadow-sm hover:shadow-cyan-500/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Floating Batch Actions HUD (Muncul saat 1 atau lebih data dicentang) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="glass-card bg-slate-900/95 dark:bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs">
                {selectedIds.length}
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Siswa terpilih untuk tindakan massal
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const nisnList = siswaList
                    .filter((s) => selectedIds.includes(s.id))
                    .map((s) => s.nisn)
                    .join(", ");
                  navigator.clipboard.writeText(nisnList);
                  setCopiedNisn("batch");
                  setTimeout(() => setCopiedNisn(null), 2000);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
              >
                {copiedNisn === "batch" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">NISN Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Salin NISN Terpilih</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBatchDelete}
                className="px-3.5 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selectedIds.length})</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student List Table & Search Filter HUD */}
      <div className="glass-card rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-white/10 space-y-4">
        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama, NISN, atau Kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <select
                value={selectedKelasFilter}
                onChange={(e) => setSelectedKelasFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 text-blue-600 dark:text-cyan-400 outline-none cursor-pointer focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="">Semua Rombel ({siswaList.length} Siswa)</option>
                {kelasOptions.map((k) => {
                  const count = siswaList.filter((s) => s.kelas === k).length;
                  return (
                    <option key={k} value={k}>
                      Kelas {k} ({count} Siswa)
                    </option>
                  );
                })}
              </select>
            </div>

            {(search || selectedKelasFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedKelasFilter("");
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Reset Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {/* Counter status badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{filteredList.length}</span>
              <span>/ {siswaList.length} siswa</span>
            </div>
          </div>
        </div>

        {/* Modern Web Guidance: Responsive Table Region with Sticky Header */}
        <div 
          tabIndex={0} 
          role="region" 
          aria-labelledby="siswa-table-caption"
          className="table-wrapper custom-scrollbar overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <span id="siswa-table-caption" className="sr-only">Tabel Master Data Siswa</span>
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200 border-collapse">
            <thead className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 uppercase font-mono font-bold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-3 text-center w-12">
                  <input
                    type="checkbox"
                    checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500/30 cursor-pointer"
                    title="Pilih Semua Siswa"
                  />
                </th>
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3 w-40">NISN</th>
                <th className="p-3">Nama Lengkap Siswa</th>
                <th className="p-3 text-center w-28">Kelas / Rombel</th>
                <th className="p-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {siswaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-xs">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm font-display">
                        Database Siswa Belum Terisi
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Daftar siswa saat ini masih kosong. Anda dapat menambahkan siswa baru lewat form di atas, import file Excel, atau klik tombol di bawah untuk memuat data contoh (demo) siswa.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleLoadSampleStudents}
                          disabled={isSeeding}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-xs cursor-pointer transition-all active:scale-95"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>{isSeeding ? "Sedang Memuat..." : "Muat Data Siswa Contoh Sekarang"}</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <p className="font-medium">
                      Tidak ada siswa ditemukan yang cocok dengan kata kunci "{search}" {selectedKelasFilter ? `di Kelas ${selectedKelasFilter}` : ""}.
                    </p>
                    <button
                      onClick={() => {
                        setSearch("");
                        setSelectedKelasFilter("");
                      }}
                      className="mt-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      Lihat Semua Siswa ({siswaList.length})
                    </button>
                  </td>
                </tr>
              ) : (
                filteredList.map((s, idx) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <tr 
                      key={s.id} 
                      className={`transition-colors group ${
                        isSelected 
                          ? "bg-cyan-500/10 dark:bg-cyan-500/15" 
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(s.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500/30 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-cyan-400">
                        <div className="flex items-center gap-1.5">
                          <span>{s.nisn}</span>
                          <button
                            onClick={() => handleCopyNisn(s.nisn)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-500 rounded transition-all cursor-pointer"
                            title="Salin NISN"
                          >
                            {copiedNisn === s.nisn ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                            {s.nama.charAt(0).toUpperCase()}
                          </div>
                          <span>{s.nama}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold border border-slate-200 dark:border-slate-700">
                          {s.kelas}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleStartEdit(s)}
                            className="p-1.5 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Siswa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.nama)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Siswa - Modern Web Guidance: Light-Dismiss Dialog */}
      {editingSiswa && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-dialog-title"
        >
          <div 
            ref={modalRef}
            className="glass-card bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 dark:border-cyan-500/30 space-y-4 animate-in zoom-in-95 duration-150 relative"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 id="edit-dialog-title" className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 font-display">
                <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <span>Edit Entitas Siswa</span>
              </h3>
              <button
                onClick={() => setEditingSiswa(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1">
                  NISN_ID *
                </label>
                <input
                  type="text"
                  value={editNisn}
                  onChange={(e) => setEditNisn(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1">
                  NAMA_LENGKAP *
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1">
                  ROMBEL / KELAS *
                </label>
                <input
                  type="text"
                  value={editKelas}
                  onChange={(e) => setEditKelas(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white uppercase outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSiswa(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-2 text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

