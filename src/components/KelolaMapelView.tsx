import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Pencil, 
  X, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  GraduationCap, 
  Compass, 
  Calculator, 
  Languages, 
  FlaskConical, 
  Palette, 
  Activity, 
  Binary,
  Layers
} from "lucide-react";
import { Mapel } from "../types";
import { saveDocument, deleteDocument, batchSaveDocuments, COLLECTIONS } from "../lib/firebase";
import { 
  notifySimpanSuccess, 
  notifySimpanError, 
  notifyEditSuccess, 
  notifyEditError, 
  notifyHapusSuccess, 
  notifyHapusError, 
  confirmDeleteAlert 
} from "../lib/swal";

interface KelolaMapelViewProps {
  mapelList: Mapel[];
}

export const KelolaMapelView: React.FC<KelolaMapelViewProps> = ({ mapelList }) => {
  const [namaMapel, setNamaMapel] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [isSeeding, setIsSeeding] = useState(false);

  // Edit Mapel State
  const [editingMapel, setEditingMapel] = useState<Mapel | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editSemester, setEditSemester] = useState("Ganjil");
  const [editTahunAjaran, setEditTahunAjaran] = useState("2026/2027");

  // Ref for light-dismiss dialog
  const editModalRef = useRef<HTMLDivElement>(null);

  // Light-dismiss dialog handlers (ESC key + click outside)
  useEffect(() => {
    if (!editingMapel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingMapel(null);
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (editModalRef.current && !editModalRef.current.contains(e.target as Node)) {
        setEditingMapel(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [editingMapel]);

  // Subject Icon & Category Helper
  const getSubjectMeta = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("matematik") || n.includes("hitung") || n.includes("kalkulus")) {
      return { 
        icon: Calculator, 
        cat: "MIPA / Kuantitatif", 
        badgeBg: "bg-blue-500/10 text-blue-600 dark:text-cyan-400 border-blue-500/20" 
      };
    }
    if (n.includes("bahasa") || n.includes("inggris") || n.includes("arab") || n.includes("literasi")) {
      return { 
        icon: Languages, 
        cat: "Bahasa & Sastra", 
        badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
      };
    }
    if (n.includes("ipa") || n.includes("fisika") || n.includes("biologi") || n.includes("kimia") || n.includes("sains")) {
      return { 
        icon: FlaskConical, 
        cat: "Sains Alamiah", 
        badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" 
      };
    }
    if (n.includes("seni") || n.includes("budaya") || n.includes("musik") || n.includes("rupa")) {
      return { 
        icon: Palette, 
        cat: "Seni & Kreasi", 
        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
      };
    }
    if (n.includes("pjok") || n.includes("olahraga") || n.includes("jasmani")) {
      return { 
        icon: Activity, 
        cat: "Kebugaran Fisik", 
        badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" 
      };
    }
    if (n.includes("informatika") || n.includes("komputer") || n.includes("coding") || n.includes("tik")) {
      return { 
        icon: Binary, 
        cat: "Komputasional", 
        badgeBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" 
      };
    }
    return { 
      icon: BookOpen, 
      cat: "Kurikulum Umum", 
      badgeBg: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20" 
    };
  };

  const handleStartEdit = (m: Mapel) => {
    setEditingMapel(m);
    setEditNama(m.namaMapel);
    setEditSemester(m.semester);
    setEditTahunAjaran(m.tahunAjaran);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapel) return;

    if (!editNama.trim() || !editTahunAjaran.trim()) {
      notifyEditError("Lengkapi Nama Mata Pelajaran dan Tahun Ajaran.");
      return;
    }

    const updated: Mapel = {
      ...editingMapel,
      namaMapel: editNama.trim(),
      semester: editSemester,
      tahunAjaran: editTahunAjaran.trim()
    };

    try {
      await saveDocument(COLLECTIONS.MAPEL, editingMapel.id, updated);
      setEditingMapel(null);
      notifyEditSuccess(`Mata pelajaran ${updated.namaMapel} berhasil diperbarui!`);
    } catch (err: any) {
      notifyEditError(err.message || "Gagal memperbarui mapel.");
    }
  };

  const handleAddMapel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMapel.trim()) {
      notifySimpanError("Mohon isi Nama Mata Pelajaran.");
      return;
    }

    const id = Date.now().toString();
    const newMapel: Mapel = {
      id,
      namaMapel: namaMapel.trim(),
      semester,
      tahunAjaran: tahunAjaran.trim()
    };

    try {
      await saveDocument(COLLECTIONS.MAPEL, id, newMapel);
      setNamaMapel("");
      notifySimpanSuccess(`Mata pelajaran ${newMapel.namaMapel} berhasil ditambahkan!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan data mapel.");
    }
  };

  // Seed sample subjects for Kurikulum Merdeka
  const handleSeedStandardMapel = async () => {
    setIsSeeding(true);
    const sampleMapel: Mapel[] = [
      { id: "mapel_01", namaMapel: "Pendidikan Agama dan Budi Pekerti", semester: "Ganjil", tahunAjaran: "2026/2027" },
      { id: "mapel_02", namaMapel: "Pendidikan Pancasila", semester: "Ganjil", tahunAjaran: "2026/2027" },
      { id: "mapel_03", namaMapel: "Bahasa Indonesia", semester: "Ganjil", tahunAjaran: "2026/2027" },
      { id: "mapel_04", namaMapel: "Matematika", semester: "Ganjil", tahunAjaran: "2026/2027" },
      { id: "mapel_05", namaMapel: "Ilmu Pengetahuan Alam (IPA)", semester: "Ganjil", tahunAjaran: "2026/2027" },
      { id: "mapel_06", namaMapel: "Ilmu Pengetahuan Sosial (IPS)", semester: "Ganjil", tahunAjaran: "2026/2027" },
      { id: "mapel_07", namaMapel: "Bahasa Inggris", semester: "Ganjil", tahunAjaran: "2026/2027" },
      { id: "mapel_08", namaMapel: "Informatika", semester: "Ganjil", tahunAjaran: "2026/2027" },
      { id: "mapel_09", namaMapel: "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)", semester: "Ganjil", tahunAjaran: "2026/2027" },
      { id: "mapel_10", namaMapel: "Seni Budaya & Prakarya", semester: "Ganjil", tahunAjaran: "2026/2027" }
    ];

    try {
      const existingNames = new Set(mapelList.map((m) => m.namaMapel.toLowerCase()));
      const toAdd = sampleMapel.filter((m) => !existingNames.has(m.namaMapel.toLowerCase()));

      if (toAdd.length === 0) {
        notifySimpanSuccess("Mata pelajaran standar nasional sudah terdaftar di sistem!");
        setIsSeeding(false);
        return;
      }

      await batchSaveDocuments(COLLECTIONS.MAPEL, toAdd);
      notifySimpanSuccess(`Berhasil memuat ${toAdd.length} mata pelajaran Kurikulum Merdeka!`);
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal memuat mata pelajaran standar.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteMapel = async (id: string, name: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Mata Pelajaran?", `Apakah Anda yakin ingin menghapus mata pelajaran ${name}?`);
    if (isConfirmed) {
      try {
        await deleteDocument(COLLECTIONS.MAPEL, id);
        notifyHapusSuccess(`Mapel ${name} berhasil dihapus.`);
      } catch (err: any) {
        notifyHapusError(err.message || "Gagal menghapus mapel.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card glass-card-hover p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-cyan-400/80 font-mono">
                // TOTAL_MAPEL_AKTIF
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-display tracking-tight flex items-baseline gap-1.5">
                {mapelList.length} 
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 font-sans">Mata Pelajaran</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-violet-400/80 font-mono">
                // SEMESTER_BERJALAN
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-display tracking-tight flex items-baseline gap-1.5">
                {semester} 
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 font-sans">Kurikulum Merdeka</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30 flex items-center justify-center shadow-xs">
              <Compass className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400/80 font-mono">
                // TAHUN_AKADEMIK
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-mono tracking-tight flex items-baseline gap-1.5">
                {tahunAjaran}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Cyber Control Deck - Form Tambah Mapel */}
      <div className="glass-card rounded-2xl p-6 shadow-sm space-y-5 border border-slate-200/80 dark:border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2.5 font-display">
              <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              Master Data Mata Pelajaran
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Definisikan kurikulum mata pelajaran yang diampu, keterkaitan semester, dan pemetaan ke modul penilaian.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedStandardMapel}
              disabled={isSeeding}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer hover:shadow-xs active:scale-95 disabled:opacity-50"
              title="Muat daftar mata pelajaran standar Kurikulum Merdeka"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isSeeding ? "Memuat..." : "Muat Mapel Standar Nasional"}</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleAddMapel}
          className="bg-slate-50/80 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-3.5"
        >
          <div className="md:col-span-2">
            <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1.5">
              NAMA_MATA_PELAJARAN *
            </label>
            <input
              type="text"
              placeholder="Contoh: Matematika / Informatika / IPA"
              value={namaMapel}
              onChange={(e) => setNamaMapel(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700/80 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1.5">
              SEMESTER
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1.5">
              TAHUN_AJARAN
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="2026/2027"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1.5 cursor-pointer shadow-sm hover:shadow-cyan-500/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modern Web Guidance: Responsive Table Region with Sticky Header */}
      <div className="glass-card rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-500" />
            <span>Koleksi Mata Pelajaran Terdaftar ({mapelList.length})</span>
          </h3>
        </div>

        <div 
          tabIndex={0} 
          role="region" 
          aria-labelledby="mapel-table-caption"
          className="table-wrapper custom-scrollbar overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <span id="mapel-table-caption" className="sr-only">Tabel Master Data Mata Pelajaran</span>
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200 border-collapse">
            <thead className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 uppercase font-mono font-bold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3">Mata Pelajaran & Bidang Keahlian</th>
                <th className="p-3 text-center w-36">Semester</th>
                <th className="p-3 text-center w-36">Tahun Ajaran</th>
                <th className="p-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {mapelList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20 shadow-xs">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm font-display">
                        Belum Ada Mata Pelajaran
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Mata pelajaran belum ditambahkan. Anda dapat menambahkan mapel secara manual lewat form di atas, atau klik tombol di bawah untuk memuat standar mata pelajaran Kurikulum Merdeka.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleSeedStandardMapel}
                          disabled={isSeeding}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-xs cursor-pointer transition-all active:scale-95"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>{isSeeding ? "Sedang Memuat..." : "Muat Standar Mapel Nasional"}</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                mapelList.map((m, idx) => {
                  const meta = getSubjectMeta(m.namaMapel);
                  const IconComp = meta.icon;
                  return (
                    <tr 
                      key={m.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white text-xs">
                              {m.namaMapel}
                            </div>
                            <div className="mt-0.5">
                              <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-md border ${meta.badgeBg}`}>
                                {meta.cat}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-[11px] font-extrabold font-mono">
                          {m.semester}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {m.tahunAjaran}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleStartEdit(m)}
                            className="p-1.5 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Mapel"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMapel(m.id, m.namaMapel)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Mapel"
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

      {/* Modal Edit Mapel - Modern Web Guidance: Light-Dismiss Dialog */}
      {editingMapel && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-mapel-title"
        >
          <div 
            ref={editModalRef}
            className="glass-card bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 dark:border-cyan-500/30 space-y-4 animate-in zoom-in-95 duration-150 relative"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 id="edit-mapel-title" className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 font-display">
                <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <span>Edit Entitas Mata Pelajaran</span>
              </h3>
              <button
                onClick={() => setEditingMapel(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1">
                  NAMA_MAPEL *
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1">
                  SEMESTER *
                </label>
                <select
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400 uppercase tracking-wider mb-1">
                  TAHUN_AJARAN *
                </label>
                <input
                  type="text"
                  value={editTahunAjaran}
                  onChange={(e) => setEditTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMapel(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
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

