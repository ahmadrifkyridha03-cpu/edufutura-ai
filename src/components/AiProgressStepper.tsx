import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Loader2, Clock } from "lucide-react";

export interface StepItem {
  id: string;
  title: string;
  desc: string;
}

interface AiProgressStepperProps {
  steps?: StepItem[];
  currentStepIndex?: number;
  overallProgress?: string; // Optional custom progress text
  estimatedSeconds?: number;
}

const DEFAULT_STEPS: StepItem[] = [
  {
    id: "step-1",
    title: "Menganalisis Capaian Pembelajaran & Karakteristik",
    desc: "Mengekstrak elemen CP, fase, tingkat kesiapan siswa, dan alokasi JP kalender."
  },
  {
    id: "step-2",
    title: "Sintesis Pedagogi Deep Learning 3 Dimensi",
    desc: "Merancang pengalaman belajar Mindful (memahami), Meaningful (bermakna), & Joyful (menggembirakan)."
  },
  {
    id: "step-3",
    title: "Menyusun Skenario & Diferensiasi Pembelajaran",
    desc: "Memetakan diferensiasi konten, proses, produk, serta rancangan LKPD interaktif."
  },
  {
    id: "step-4",
    title: "Memformat Dokumen Standar Resmi & Pengesahan",
    desc: "Menyusun tata letak ISO/Kemdikbudristek, matriks asesmen, dan lembar tanda tangan."
  }
];

export const AiProgressStepper: React.FC<AiProgressStepperProps> = ({
  steps = DEFAULT_STEPS,
  overallProgress,
  estimatedSeconds = 25
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic step simulation if no explicit currentStepIndex is passed
  useEffect(() => {
    const stepDuration = Math.max(3, Math.floor(estimatedSeconds / steps.length));
    const stepIndex = Math.min(steps.length - 1, Math.floor(secondsElapsed / stepDuration));
    setActiveStep(stepIndex);
  }, [secondsElapsed, estimatedSeconds, steps.length]);

  const percentage = Math.min(95, Math.round(((secondsElapsed + 1) / estimatedSeconds) * 100));

  return (
    <div className="w-full p-5 sm:p-7 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-cyan-500/30 dark:border-cyan-500/40 shadow-[0_10px_35px_rgba(6,182,212,0.15)] backdrop-blur-xl space-y-5 transition-all">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white font-display flex items-center gap-2">
              <span>{overallProgress || "Kecerdasan Artifisial Sedang Menyusun Dokumen..."}</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-cyan-300/80 font-mono">
              Deep Learning Engine &bull; Kurikulum Merdeka v2.4
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            <span>{secondsElapsed}s</span>
          </div>
          <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Animated Gradient Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden relative shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 transition-all duration-700 ease-out rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stepper Timeline List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {steps.map((step, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;
          const isPending = idx > activeStep;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? "bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500/20 shadow-md"
                  : isDone
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-500/30 opacity-90"
                  : "bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 opacity-50"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isCurrent
                      ? "bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200"
                      : isDone
                      ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                    Tahap {idx + 1}
                  </span>

                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-cyan-500 animate-spin shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>

                <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                  {step.title}
                </h5>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-2 text-[10px] font-mono font-semibold">
                {isDone && <span className="text-emerald-600 dark:text-emerald-400">✓ Selesai Terverifikasi</span>}
                {isCurrent && <span className="text-cyan-600 dark:text-cyan-400 animate-pulse">⚡ Sedang Disusun...</span>}
                {isPending && <span className="text-slate-400 dark:text-slate-600">Menunggu antrean...</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default AiProgressStepper;
