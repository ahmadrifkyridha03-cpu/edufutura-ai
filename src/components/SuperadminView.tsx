import React, { useState, useEffect } from "react";
import { 
  Crown, 
  ShieldAlert, 
  Users, 
  Building2, 
  Mail, 
  BookOpen, 
  Eye, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Sparkles, 
  Activity, 
  Database, 
  Download, 
  ExternalLink,
  Search,
  UserCheck,
  UserX,
  ArrowRight,
  Cpu
} from "lucide-react";
import Swal from "sweetalert2";
import { GuruUser, Siswa, Mapel } from "../types";
import { 
  getAllRegisteredTeachers, 
  updateTeacherRole, 
  deleteTeacherProfile,
  getSuperAdminPasskey,
  setSuperAdminPasskey,
  setActiveUserId,
  getActiveUserId
} from "../lib/firebase";

interface SuperadminViewProps {
  currentUser: GuruUser;
  onSwitchWorkspace?: (teacher: GuruUser | null) => void;
  activeInspectedTeacher?: GuruUser | null;
  onNavigateTab?: (tabId: string) => void;
}

export const SuperadminView: React.FC<SuperadminViewProps> = ({
  currentUser,
  onSwitchWorkspace,
  activeInspectedTeacher,
  onNavigateTab
}) => {
  const [teachers, setTeachers] = useState<GuruUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // State Ubah Passkey
  const [currentPasskey, setCurrentPasskey] = useState<string>("");
  const [newPasskey, setNewPasskey] = useState<string>("");
  const [confirmPasskey, setConfirmPasskey] = useState<string>("");
  const [passkeyMsg, setPasskeyMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Load registered teachers
  const loadTeachers = async () => {
    setLoading(true);
    try {
      const list = await getAllRegisteredTeachers();
      // Ensure superadmin himself is in list if not returned
      const exists = list.some(t => t.uid === currentUser.uid);
      if (!exists && currentUser.role === "superadmin") {
        list.unshift(currentUser);
      }
      setTeachers(list);
    } catch (err) {
      console.error("Error loading teachers:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeachers();
    setCurrentPasskey(getSuperAdminPasskey());
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTeachers();
  };

  // Filter teachers by search query
  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (t.displayName || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q) ||
      (t.nip || "").toLowerCase().includes(q) ||
      (t.sekolah || "").toLowerCase().includes(q) ||
      (t.mapelUtama || "").toLowerCase().includes(q)
    );
  });

  // Handle Switch Workspace
  const handleInspect = (teacher: GuruUser) => {
    if (activeInspectedTeacher?.uid === teacher.uid) {
      // Revert to master workspace
      if (onSwitchWorkspace) onSwitchWorkspace(null);
      Swal.fire({
        icon: "info",
        title: "Kembali ke Master Workspace",
        text: "Anda telah kembali ke ruang kerja utama Superadmin.",
        timer: 1800,
        showConfirmButton: false,
        background: "#0f172a",
        color: "#f8fafc"
      });
      return;
    }

    if (onSwitchWorkspace) {
      onSwitchWorkspace(teacher);
    }
    Swal.fire({
      icon: "success",
      title: "Workspace Dialihkan!",
      html: `Anda sekarang sedang menginspeksi workspace milik <b>${teacher.displayName}</b> (${teacher.sekolah || "Sekolah"}).<br/><small class="text-slate-400">Anda dapat melihat siswa, jadwal, dan modul ajar guru ini secara langsung.</small>`,
      confirmButtonText: "Buka Dashboard Guru",
      confirmButtonColor: "#06b6d4",
      showCancelButton: true,
      cancelButtonText: "Tetap di Panel",
      background: "#0f172a",
      color: "#f8fafc"
    }).then((res) => {
      if (res.isConfirmed && onNavigateTab) {
        onNavigateTab("dashboard");
      }
    });
  };

  // Handle Toggle Role
  const handleToggleRole = async (teacher: GuruUser) => {
    const targetRole = teacher.role === "superadmin" ? "guru" : "superadmin";
    const confirmText = targetRole === "superadmin" 
      ? `Jadikan ${teacher.displayName} sebagai Superadmin dengan wewenang penuh?` 
      : `Cabut status Superadmin dari ${teacher.displayName}?`;

    const result = await Swal.fire({
      title: "Ubah Hak Akses?",
      text: confirmText,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Ubah Role",
      cancelButtonText: "Batal",
      confirmButtonColor: "#f59e0b",
      background: "#0f172a",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        await updateTeacherRole(teacher.uid, targetRole);
        setTeachers(prev => prev.map(t => t.uid === teacher.uid ? { ...t, role: targetRole } : t));
        Swal.fire({
          icon: "success",
          title: "Role Diperbarui",
          text: `Status ${teacher.displayName} kini adalah: ${targetRole.toUpperCase()}`,
          timer: 2000,
          showConfirmButton: false,
          background: "#0f172a",
          color: "#f8fafc"
        });
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Gagal Mengubah Role",
          text: err?.message || "Terjadi kendala saat update ke database.",
          background: "#0f172a",
          color: "#f8fafc"
        });
      }
    }
  };

  // Handle Delete Teacher
  const handleDeleteTeacher = async (teacher: GuruUser) => {
    if (teacher.uid === currentUser.uid) {
      Swal.fire({
        icon: "warning",
        title: "Tindakan Ditolak",
        text: "Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.",
        background: "#0f172a",
        color: "#f8fafc"
      });
      return;
    }

    const result = await Swal.fire({
      title: "Hapus Akun Guru?",
      html: `Apakah Anda yakin ingin menghapus profil guru <b>${teacher.displayName}</b>?<br/><span class="text-xs text-red-400">Tindakan ini akan menghapus data pendaftaran guru dari sistem.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Ya, Hapus Akun",
      cancelButtonText: "Batal",
      background: "#0f172a",
      color: "#f8fafc"
    });

    if (result.isConfirmed) {
      try {
        await deleteTeacherProfile(teacher.uid);
        setTeachers(prev => prev.filter(t => t.uid !== teacher.uid));
        Swal.fire({
          icon: "success",
          title: "Akun Dihapus",
          text: `Profil ${teacher.displayName} berhasil dihapus dari sistem.`,
          timer: 1800,
          showConfirmButton: false,
          background: "#0f172a",
          color: "#f8fafc"
        });
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Gagal Menghapus",
          text: err?.message || "Terjadi kesalahan saat menghapus data.",
          background: "#0f172a",
          color: "#f8fafc"
        });
      }
    }
  };

  // Handle Change Passkey
  const handleChangePasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasskey.trim() || newPasskey.length < 6) {
      setPasskeyMsg({ text: "Passkey baru minimal harus 6 karakter.", type: "error" });
      return;
    }
    if (newPasskey !== confirmPasskey) {
      setPasskeyMsg({ text: "Konfirmasi passkey baru tidak cocok.", type: "error" });
      return;
    }

    setSuperAdminPasskey(newPasskey.trim());
    setCurrentPasskey(newPasskey.trim());
    setNewPasskey("");
    setConfirmPasskey("");
    setPasskeyMsg({ text: "Master Passkey Superadmin berhasil diperbarui!", type: "success" });
  };

  // Handle Export Backup
  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      superadmin: currentUser.displayName,
      teachersCount: teachers.length,
      teachers: teachers
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `edufutura_master_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* Top Banner: Active Inspected Teacher Alert */}
      {activeInspectedTeacher && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-pulse-laser">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Mode Inspeksi Workspace Aktif
              </p>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Sedang Mengakses: {activeInspectedTeacher.displayName} &bull; {activeInspectedTeacher.sekolah || "Sekolah"}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleInspect(activeInspectedTeacher)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 shrink-0"
          >
            <span>Kembali ke Master Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Superadmin Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border border-amber-500/30 p-6 sm:p-8 shadow-2xl text-white">
        {/* Glow ambient decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-wide">
              <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>SUPERADMIN ROOT AUTHORITY &bull; MASTER WORKSPACE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-white">
              Pusat Kontrol Superadmin
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Selamat datang, <span className="font-bold text-amber-400">{currentUser.displayName}</span>. 
              Sebagai Administrator Utama, Anda memiliki hak akses penuh untuk mengawasi semua guru terdaftar, 
              menginspeksi ruang kerja mereka, mengekspor backup master, serta mengatur otoritas sistem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${refreshing ? "animate-spin" : ""}`} />
              <span>Segarkan Data</span>
            </button>

            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Backup JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Guru */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Guru Terdaftar
              </p>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mt-1">
                {teachers.length} <span className="text-xs font-normal text-slate-400">Akun</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Workspace multi-tenant aktif</span>
          </div>
        </div>

        {/* Metric 2: Superadmin Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pengelola Superadmin
              </p>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mt-1">
                {teachers.filter(t => t.role === "superadmin").length || 1} <span className="text-xs font-normal text-slate-400">Otoritas</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
              <Crown className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold space-x-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Full Root Access</span>
          </div>
        </div>

        {/* Metric 3: Database Engine */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status Cloud Database
              </p>
              <h3 className="text-lg sm:text-xl font-display font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Firestore Online
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
              <Database className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Auto Long-Polling active
          </div>
        </div>

        {/* Metric 4: AI Model Engine */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-pink-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                AI Generation Engine
              </p>
              <h3 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white mt-1">
                Gemini 2.5 Flash
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-pink-600 dark:text-pink-400 font-semibold space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deep Learning Modul Merdeka</span>
          </div>
        </div>
      </div>

      {/* Main Content: Teachers Management Table & Passkey Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Registered Teachers Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>Daftar Seluruh Guru Terdaftar</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Klik <b>Inspeksi Workspace</b> untuk melihat data langsung dari sudut pandang guru bersangkutan.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari guru, NIP, sekolah..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-mono">Memuat database seluruh guru...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-500 opacity-50" />
                <p className="text-xs font-semibold">Tidak ada akun guru yang cocok dengan pencarian.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-mono text-[10.5px] uppercase">
                      <th className="py-3 px-3">Guru &amp; Akun</th>
                      <th className="py-3 px-3">Sekolah / Mapel</th>
                      <th className="py-3 px-3 text-center">Role</th>
                      <th className="py-3 px-3 text-right">Aksi Superadmin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredTeachers.map((teacher) => {
                      const isSelf = teacher.uid === currentUser.uid;
                      const isInspected = activeInspectedTeacher?.uid === teacher.uid;
                      const isSuper = teacher.role === "superadmin";

                      return (
                        <tr 
                          key={teacher.uid}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isInspected ? "bg-amber-500/10 dark:bg-amber-500/10" : ""
                          }`}
                        >
                          {/* Nama & Email */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center space-x-2.5">
                              {teacher.photoURL ? (
                                <img 
                                  src={teacher.photoURL} 
                                  alt={teacher.displayName || "Guru"} 
                                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-300 dark:ring-white/10 shrink-0" 
                                />
                              ) : (
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                                  isSuper 
                                    ? "bg-gradient-to-tr from-amber-600 to-orange-500" 
                                    : "bg-gradient-to-tr from-cyan-600 to-indigo-600"
                                }`}>
                                  {(teacher.displayName || "G").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                                    {teacher.displayName || "Guru Tanpa Nama"}
                                  </h4>
                                  {isSelf && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-mono font-bold">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[160px]">
                                  {teacher.email || "Email tidak disetel"}
                                </p>
                                {teacher.nip && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    NIP: {teacher.nip}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Sekolah & Mapel */}
                          <td className="py-3.5 px-3">
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                              {teacher.sekolah || "Sekolah Belum Diatur"}
                            </p>
                            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium truncate max-w-[170px]">
                              {teacher.mapelUtama || "Semua Mata Pelajaran"}
                            </p>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-3 text-center">
                            {isSuper ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                <Crown className="w-3 h-3 text-amber-500" />
                                <span>Superadmin</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                Guru
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Tombol Inspeksi */}
                              <button
                                type="button"
                                onClick={() => handleInspect(teacher)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                                  isInspected
                                    ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                                    : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30"
                                }`}
                                title={isInspected ? "Lepas inspeksi" : "Inspeksi workspace guru ini"}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isInspected ? "Sedang Diinspeksi" : "Inspeksi"}</span>
                              </button>

                              {/* Toggle Role */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleRole(teacher)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title={isSuper ? "Turunkan ke Guru biasa" : "Naikkan jadi Superadmin"}
                                >
                                  {isSuper ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </button>
                              )}

                              {/* Hapus Akun */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeacher(teacher)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                  title="Hapus akun guru ini"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Passkey Management & Diagnostic Tools */}
        <div className="space-y-4">
          {/* Card 1: Ganti Master Passkey */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-white/10">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Pengaturan Master Passkey
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Passkey ini digunakan untuk membuka otoritas Superadmin dari halaman login.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Passkey Aktif:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {currentPasskey || "superadmin2026"}
              </span>
            </div>

            {passkeyMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                passkeyMsg.type === "success" 
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200" 
                  : "bg-red-50 dark:bg-red-950/60 border border-red-300 text-red-800 dark:text-red-200"
              }`}>
                {passkeyMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{passkeyMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePasskey} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Passkey Baru:
                </label>
                <input
                  type="password"
                  required
                  value={newPasskey}
                  onChange={(e) => setNewPasskey(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Ulangi Passkey Baru:
                </label>
                <input
                  type="password"
                  required
                  value={confirmPasskey}
                  onChange={(e) => setConfirmPasskey(e.target.value)}
                  placeholder="Ulangi passkey baru"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
              >
                Simpan Passkey Baru
              </button>
            </form>
          </div>

          {/* Card 2: Sistem Diagnostik & Arsitektur */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-white/10">
              <Activity className="w-5 h-5 text-cyan-500" />
              <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Integritas Keamanan &amp; Data
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <b>Sub-Collection Isolation:</b> Data siswa, nilai, dan absensi diatur per `users/{`{userId}`}` sehingga privasi tiap guru terjamin 100%.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <b>Firestore Security Rules:</b> Validasi schema ketat dengan pembatasan izin penghapusan master dokumen konfigurasi.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <b>Offline-First Cache:</b> Sinkronisasi lokal tanpa jeda (*zero latency*) saat koneksi internet sekolah melambat.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminView;
