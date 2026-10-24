import React, { useState } from "react";
import { Bot, Send, User, Sparkles, Copy, Check, Loader2, Cpu, Zap, MessageSquare, Terminal } from "lucide-react";
import { ChatMessage, Pengaturan } from "../types";
import { HeroHologramOrb } from "./3d/HeroHologramOrb";

interface AsistenGuruAIViewProps {
  config: Pengaturan;
}

export const AsistenGuruAIView: React.FC<AsistenGuruAIViewProps> = ({ config }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "assistant",
      text: `Halo ${config.Nama_Guru ? `Bapak/Ibu ${config.Nama_Guru}` : "Bapak/Ibu Guru"}! 👋 Saya adalah EduFutura AI Assistant. Saya siap membantu menyusun instrumen asesmen HOTS, draft komunikasi orang tua, diferensiasi pedagogis Kurikulum Merdeka, hingga narasi capaian rapor siswa. Apa yang ingin kita rancang hari ini?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const quickPrompts = [
    { label: "Soal HOTS SMP", text: "Buatkan 5 contoh soal HOTS pilihan ganda + kunci jawaban untuk siswa SMP materi berpikir kritis." },
    { label: "Pesan Santun Ortu", text: "Draft pesan WhatsApp santun dan profesional ke orang tua murid tentang pemantauan kehadiran siswa." },
    { label: "Diferensiasi Kelas", text: "Beri 3 ide aktivitas pembelajaran berdiferensiasi (konten, proses, produk) yang interaktif di kelas." },
    { label: "Narasi Rapor Positif", text: "Buatkan contoh kalimat catatan wali kelas untuk rapor yang konstruktif dan memotivasi siswa." }
  ];

  const cleanAiText = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/```[a-zA-Z]*\n?/g, "")
      .replace(/```/g, "")
      .replace(/^`+|`+$/g, "")
      .trim();
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat-asisten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query.trim(),
          context: {
            guru: config.Nama_Guru,
            sekolah: config.Nama_Sekolah
          }
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error(
          res.status === 504
            ? "Waktu respons asisten AI melebihi batas (timeout). Silakan coba ajukan pertanyaan kembali."
            : "Layanan asisten AI sedang sibuk. Silakan coba sesaat lagi."
        );
      }

      const data = await res.json();
      if (data.status === "success") {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: cleanAiText(data.reply),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.message || "Gagal mendapatkan respon.");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: "Maaf, terjadi kendala saat menghubungkan ke neural core asisten AI. Silakan coba lagi.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-card rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 flex flex-col h-[82vh] overflow-hidden">
      {/* Cyber Header with 3D Holographic AI Core Orb */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-32 h-16 bg-cyan-500/10 blur-2xl pointer-events-none"></div>
        <div className="flex items-center space-x-3.5 relative z-10">
          {/* Mini 3D Three.js Hologram Orb */}
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <HeroHologramOrb size={48} isProcessing={loading} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm font-display tracking-tight text-white flex items-center gap-1.5">
                <span>EduFutura AI Copilot</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]"></span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                CORE_v3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-300 dark:text-cyan-300/80 font-mono mt-0.5">
              // PEDAGOGICAL_NEURAL_ASSISTANT &bull; LATENCY_OPTIMIZED
            </p>
          </div>
        </div>

        {/* Live Status Chip */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>{loading ? "NEURAL_SYNTHESIZING..." : "STANDBY_READY"}</span>
        </div>
      </div>

      {/* Futuristic Quick Prompts Bar */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 shrink-0 ml-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">QUICK_CHIPS:</span>
        </div>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.text)}
            disabled={loading}
            className="px-3 py-1.5 glass-card hover:bg-cyan-500/10 dark:hover:bg-cyan-500/20 border border-slate-200 dark:border-white/10 hover:border-cyan-500/40 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-medium whitespace-nowrap shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <Zap className="w-3 h-3 text-cyan-500" />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-slate-50/40 dark:bg-slate-950/60 cyber-grid">
        {messages.map((m) => {
          const isAsst = m.sender === "assistant";
          return (
            <div
              key={m.id}
              className={`flex items-start space-x-3 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                isAsst ? "mr-auto" : "ml-auto flex-row-reverse space-x-reverse"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                  isAsst 
                    ? "bg-slate-900 text-cyan-400 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]" 
                    : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border border-blue-400/30"
                }`}
              >
                {isAsst ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 relative group shadow-sm transition-all ${
                  isAsst
                    ? "glass-card bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-cyan-500/25 dark:shadow-[0_0_15px_rgba(6,182,212,0.06)]"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md shadow-blue-500/20"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <div className={`flex items-center justify-between pt-1.5 border-t text-[10px] font-mono ${
                  isAsst 
                    ? "border-slate-200/60 dark:border-white/5 text-slate-400 dark:text-slate-400" 
                    : "border-white/20 text-blue-100"
                }`}>
                  <span>{m.timestamp}</span>
                  {isAsst && (
                    <button
                      onClick={() => handleCopy(m.text, m.id)}
                      className="p-1 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 rounded transition-colors cursor-pointer"
                      title="Salin Teks Jawaban"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs w-fit font-mono animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-500 shrink-0" />
            <span>[SYNTHESIZING_PEDAGOGICAL_INSIGHT...]</span>
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-white/10 shrink-0 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Tanyakan analisis capaian siswa, rancangan modul, atau pesan orang tua..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm hover:shadow-cyan-500/30 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};

