import React, { useState } from "react";
import { GraduationCap, Lock, User, Eye, EyeOff, ShieldCheck, LogIn, AlertCircle, Sun, Moon, Cpu, Zap } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [username, setUsername] = useState("www.yefriharyanto.id");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Username dan Password wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        localStorage.setItem("edadmin_auth_token", data.token);
        if (data.user) {
          localStorage.setItem("edadmin_user", JSON.stringify(data.user));
        }
        onLoginSuccess();
      } else {
        setErrorMsg(data.message || "Username atau Password tidak valid.");
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      setErrorMsg("Gagal terhubung ke server autentikasi. Silakan periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-[#030712] p-4 sm:p-6 transition-colors font-sans relative overflow-hidden select-none">
      {/* Futuristic Cyber Grid & Ambient Orbs */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] bg-cyan-500/15 dark:bg-cyan-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-laser" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-violet-600/15 dark:bg-violet-600/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />

      {/* Top Bar Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center space-x-2 text-xs font-semibold cursor-pointer active:scale-95"
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

      {/* Main Login Card Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Futuristic Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-cyan-400 border border-cyan-500/40 shadow-2xl">
              <GraduationCap className="w-9 h-9 text-cyan-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                EduFutura AI
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-500 dark:text-cyan-300 border border-cyan-500/30 font-bold">
                PORTAL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
              Sistem Administrasi & Asisten Guru Digital Masa Depan
            </p>
          </div>
        </div>

        {/* Cyber-Glassmorphic Form Card */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.4)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <h2 className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-500" />
              <span>Otentikasi Server Terenkripsi</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              SECURE
            </span>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl flex items-start space-x-3 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Username / Identitas Akses
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  readOnly
                  value={username}
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-cyan-300 focus:outline-none cursor-not-allowed select-none text-sm font-mono font-bold"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Kunci Akses (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 text-sm transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-cyan-400" />}
                </button>
              </div>
            </div>

            {/* Submit Button with Cyber Glow */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-violet-500 text-white font-display font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="font-mono text-xs">VERIFIKASI_TOKEN...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Akses Dashboard Digital</span>
                </>
              )}
            </button>
          </form>

          {/* Security & Verification Notice */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Terproteksi Validasi Server Token Pro</span>
          </div>
        </div>

        {/* Footer Credit */}
        <p className="text-center text-[11px] font-mono text-slate-500 dark:text-slate-500 font-medium">
          EduFutura AI Operating System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
