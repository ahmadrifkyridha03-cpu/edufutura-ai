import React, { useState } from "react";
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Sun, 
  Moon, 
  Sparkles, 
  Building2, 
  BookOpen, 
  CheckCircle2, 
  Compass, 
  HelpCircle,
  Crown,
  ShieldAlert,
  KeyRound,
  ArrowRight
} from "lucide-react";
import { 
  loginWithEmail, 
  registerTeacher, 
  loginWithGoogle, 
  loginAsGuest, 
  sendResetPassword,
  loginAsSuperAdmin,
  DEFAULT_SUPERADMIN_PASSKEY
} from "../lib/firebase";
import { GuruUser } from "../types";

interface LoginViewProps {
  onLoginSuccess: (user: GuruUser) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "superadmin">("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form State Register
  const [regNamaGuru, setRegNamaGuru] = useState("");
  const [regNip, setRegNip] = useState("");
  const [regSekolah, setRegSekolah] = useState("");
  const [regMapel, setRegMapel] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Form State Superadmin
  const [superadminName, setSuperadminName] = useState("Ahmad Rifky Ridha");
  const [superadminKey, setSuperadminKey] = useState("");
  const [showSuperadminKey, setShowSuperadminKey] = useState(false);

  // State Modal Lupa Password
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);

  // Helper untuk menerjemahkan kode error Firebase ke bahasa Indonesia ramah guru
  const parseAuthError = (err: any): string => {
    const code = err?.code || "";
    const msg = String(err?.message || "");

    if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
      return "Email atau password yang Anda masukkan tidak sesuai. Silakan periksa kembali.";
    }
    if (code === "auth/email-already-in-use") {
      return "Email ini sudah terdaftar sebagai akun guru. Silakan langsung masuk pada tab 'Masuk'.";
    }
    if (code === "auth/weak-password") {
      return "Password terlalu lemah. Mohon gunakan minimal 6 karakter.";
    }
    if (code === "auth/invalid-email") {
      return "Format alamat email tidak valid.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Jendela login Google ditutup sebelum proses selesai. Silakan coba lagi.";
    }
    if (code === "auth/unauthorized-domain") {
      return "Domain web ini belum terdaftar di Firebase Authorized Domains. Gunakan mode login Email atau Tamu.";
    }
    if (msg.includes("network") || code === "auth/network-request-failed") {
      return "Gagal terhubung ke jaringan internet. Silakan periksa koneksi Anda.";
    }
    return msg || "Terjadi kesalahan saat memproses autentikasi. Silakan coba lagi.";
  };

  // 1. Handle Login dengan Email & Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg("Mohon masukkan email dan password akun Anda.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await loginWithEmail(loginEmail, loginPassword);
      setSuccessMsg(`Selamat datang kembali, ${user.displayName || "Bapak/Ibu Guru"}!`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch (err: any) {
      console.error("Login email error:", err);
      setErrorMsg(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Pendaftaran Akun Guru Baru
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNamaGuru.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg("Nama Lengkap, Email, dan Password wajib diisi.");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg("Password minimal 6 karakter demi keamanan akun.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok dengan password yang dimasukkan.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await registerTeacher(regEmail, regPassword, {
        namaGuru: regNamaGuru.trim(),
        nipGuru: regNip.trim(),
        namaSekolah: regSekolah.trim(),
        mapelUtama: regMapel.trim()
      });

      setSuccessMsg(`Akun Guru atas nama ${user.displayName} berhasil didaftarkan! Membuka workspace privat...`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 700);
    } catch (err: any) {
      console.error("Register teacher error:", err);
      setErrorMsg(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Login Google (Akun Belajar.id / Gmail)
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await loginWithGoogle();
      setSuccessMsg(`Berhasil masuk dengan Google: ${user.displayName}`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMsg(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Login Mode Guru Tamu / Demo Cepat
  const handleGuestLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const user = await loginAsGuest(
        "Bapak/Ibu Guru Tamu",
        "SMP Negeri Contoh Digital"
      );
      setSuccessMsg("Masuk dalam Mode Guru Tamu. Ruang kerja privat Anda telah aktif.");
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } catch (err: any) {
      console.error("Guest login error:", err);
      setErrorMsg("Gagal mengaktifkan mode tamu.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Kirim Email Reset Password
  const handleSendResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus("Silakan masukkan email Anda terlebih dahulu.");
      return;
    }

    setForgotLoading(true);
    setForgotStatus(null);

    try {
      await sendResetPassword(forgotEmail);
      setForgotStatus("Tautan reset password telah dikirim ke email Anda. Silakan periksa folder Inbox atau Spam.");
    } catch (err: any) {
      setForgotStatus(parseAuthError(err));
    } finally {
      setForgotLoading(false);
    }
  };

  // 6. Handle Login Superadmin dengan Master Passkey
  const handleSuperadminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!superadminKey.trim()) {
      setErrorMsg("Mohon masukkan Master Passkey Superadmin.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await loginAsSuperAdmin(superadminKey, superadminName);
      setSuccessMsg(`Otoritas Superadmin Diterima! Selamat datang, ${user.displayName}`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch (err: any) {
      console.error("Superadmin login error:", err);
      setErrorMsg(err?.message || "Passkey Superadmin tidak valid!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-[#030712] p-4 sm:p-6 transition-colors font-sans relative overflow-hidden">
      {/* Cyber Grid & Ambient Glow Orbs */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-cyan-500/15 dark:bg-cyan-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-laser" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/15 dark:bg-violet-600/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />

      {/* Top Bar Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 sm:p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center space-x-2 text-xs font-semibold cursor-pointer active:scale-95"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="font-display">Tema Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-violet-600" />
              <span className="font-display">Tema Gelap</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-lg z-10 space-y-5 my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-block group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-cyan-400 border border-cyan-500/40 shadow-2xl">
              <GraduationCap className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                EduFutura AI
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 font-bold">
                PORTAL GURU
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
              Platform Cerdas Administrasi &amp; Asisten Pembelajaran Guru
            </p>
          </div>
        </div>

        {/* Auth Glassmorphism Card */}
        <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.4)] space-y-5">
          {/* Nav Tabs: Masuk vs Daftar Guru Baru vs Superadmin */}
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 text-xs font-bold font-display">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === "login"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-cyan-300 shadow-md scale-100"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === "register"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-cyan-300 shadow-md scale-100"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("superadmin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === "superadmin"
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-md scale-100"
                  : "text-amber-600/80 hover:text-amber-700 dark:text-amber-400/80 dark:hover:text-amber-300"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Superadmin</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl flex items-start space-x-3 text-red-700 dark:text-red-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-start space-x-3 text-emerald-800 dark:text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Google Sign-In Button (Tersedia untuk Masuk maupun Daftar) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-3 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {/* Google Multicolor 'G' Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-bold">
                {activeTab === "login" ? "Masuk dengan Google (Akun Belajar.id)" : "Daftar Cepat dengan Akun Google"}
              </span>
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-slate-200 dark:border-white/10 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 shrink-0">
                atau gunakan email guru
              </span>
              <div className="border-t border-slate-200 dark:border-white/10 w-full" />
            </div>
          </div>

          {/* TAB 1: FORM LOGIN */}
          {activeTab === "login" && (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Alamat Email Guru *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama.guru@sekolah.sch.id / belajar.id"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Kata Sandi (Password) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[10.5px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showLoginPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-cyan-500" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-violet-500 text-white font-display font-bold text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Ruang Kerja Guru</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: FORM REGISTRASI GURU BARU */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nama Lengkap &amp; Gelar Guru *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regNamaGuru}
                    onChange={(e) => setRegNamaGuru(e.target.value)}
                    placeholder="Contoh: Dra. Nurul Hidayah, M.Pd."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    NIP / NUPTK (Opsional)
                  </label>
                  <input
                    type="text"
                    value={regNip}
                    onChange={(e) => setRegNip(e.target.value)}
                    placeholder="19880101 201402 1 002"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Mata Pelajaran Utama
                  </label>
                  <input
                    type="text"
                    value={regMapel}
                    onChange={(e) => setRegMapel(e.target.value)}
                    placeholder="Informatika / IPA"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nama Satuan Pendidikan / Sekolah *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regSekolah}
                    onChange={(e) => setRegSekolah(e.target.value)}
                    placeholder="Contoh: SMP Negeri 1 Padang"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Alamat Email Akun Guru *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama.guru@gmail.com / belajar.id"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Buat Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 digit"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Ulangi Password *
                  </label>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 text-[10.5px] text-cyan-900 dark:text-cyan-200 leading-relaxed flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>
                  Database terisolasi 100%: Data siswa, nilai, dan perangkat ajar Anda terlindungi dan tidak tercampur dengan guru lain.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-display font-bold text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mendaftarkan Ruang Kerja...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar Akun &amp; Buka Ruang Kerja Privat</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORM OTORITAS SUPERADMIN */}
          {activeTab === "superadmin" && (
            <form onSubmit={handleSuperadminLogin} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 flex items-start space-x-3 text-amber-900 dark:text-amber-200 text-xs shadow-inner">
                <Crown className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span>Otoritas Superadmin &amp; Master Workspace</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold border border-amber-500/40">
                      ROOT ACCESS
                    </span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Mode ini memberikan wewenang penuh untuk memantau data seluruh guru, menginspeksi workspace antar guru, dan mengatur master database.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nama Administrator Utama *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={superadminName}
                    onChange={(e) => setSuperadminName(e.target.value)}
                    placeholder="Nama Lengkap Administrator"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-amber-500/30 dark:border-amber-500/40 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-semibold outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Master Passkey Superadmin *
                  </label>
                  <button
                    type="button"
                    onClick={() => setSuperadminKey(DEFAULT_SUPERADMIN_PASSKEY)}
                    className="text-[10.5px] text-amber-600 dark:text-amber-400 hover:underline font-mono font-bold cursor-pointer"
                    title="Gunakan passkey master bawaan"
                  >
                    ⚡ Isi Cepat: {DEFAULT_SUPERADMIN_PASSKEY}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <input
                    type={showSuperadminKey ? "text" : "password"}
                    required
                    value={superadminKey}
                    onChange={(e) => setSuperadminKey(e.target.value)}
                    placeholder={`Masukkan Master Passkey (${DEFAULT_SUPERADMIN_PASSKEY})`}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-amber-500/30 dark:border-amber-500/40 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-mono font-bold outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSuperadminKey(!showSuperadminKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-500 cursor-pointer"
                  >
                    {showSuperadminKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-500" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-display font-bold text-xs sm:text-sm rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mengautentikasi Hak Akses Root...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 text-amber-200" />
                    <span>Buka Hak Akses Penuh Superadmin</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Instant Demo / Guest Mode Divider */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
            >
              <Compass className="w-4 h-4 text-amber-500" />
              <span>Masuk sebagai Guru Tamu (Mode Cepat &amp; Demo)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Footer Credit & Security */}
        <div className="text-center text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Multi-Tenant Architecture &bull; Deep Learning OS 2026</span>
          </div>
          <p>EduFutura AI &copy; Hak Cipta Dilindungi</p>
        </div>
      </div>

      {/* MODAL LUPA PASSWORD */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-cyan-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                  Reset Password Akun Guru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Masukkan alamat email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
            </p>

            {forgotStatus && (
              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-800 dark:text-cyan-200 rounded-xl leading-relaxed">
                {forgotStatus}
              </div>
            )}

            <form onSubmit={handleSendResetPassword} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="nama.guru@sekolah.sch.id"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-xl text-xs outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              />

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? "Mengirim..." : "Kirim Tautan Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default LoginView;
