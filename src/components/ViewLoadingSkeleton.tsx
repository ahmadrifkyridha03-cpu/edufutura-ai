import React from "react";
import { Sparkles } from "lucide-react";

interface ViewLoadingSkeletonProps {
  title?: string;
}

export const ViewLoadingSkeleton: React.FC<ViewLoadingSkeletonProps> = ({
  title = "Memuat Modul..."
}) => {
  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 animate-pulse max-w-7xl mx-auto w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-spin" style={{ animationDuration: "3s" }} />
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-32 bg-indigo-500/20 rounded-xl" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="w-12 h-5 rounded-full bg-slate-100 dark:bg-slate-800/60" />
            </div>
            <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Workspace Panel Skeleton */}
      <div className="p-6 md:p-8 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200/40 dark:border-slate-800/60">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
          <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
          <div className="h-4 w-4/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="h-48 w-full bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
};
export default ViewLoadingSkeleton;
