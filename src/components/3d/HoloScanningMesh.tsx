import React from "react";

interface HoloScanningMeshProps {
  isScanning?: boolean;
  className?: string;
}

export const HoloScanningMesh: React.FC<HoloScanningMeshProps> = ({
  isScanning = true,
  className = ""
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-20 ${className}`}>
      {/* 4 Corner Tech Reticles */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />

      {/* Center Target Box */}
      <div className="absolute inset-x-12 inset-y-16 sm:inset-x-20 sm:inset-y-20 border border-cyan-500/30 rounded-2xl flex items-center justify-center">
        {/* Subtle crosshair in center */}
        <div className="w-6 h-6 border-t border-b border-cyan-400/50 absolute" />
        <div className="h-6 w-6 border-l border-r border-cyan-400/50 absolute" />
        <div className="w-2 h-2 rounded-full bg-cyan-400/80 animate-ping" />
      </div>

      {/* Moving Laser Beam Scanner */}
      {isScanning && (
        <div className="absolute inset-x-6 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_18px_rgba(6,182,212,0.9)] animate-pulse-laser"
          style={{
            animation: "laserScan 2.4s ease-in-out infinite alternate"
          }}
        />
      )}

      {/* Tech Telemetry Overlay */}
      <div className="absolute top-5 left-14 flex items-center space-x-2 text-[10px] font-mono font-semibold text-cyan-400/90 tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>OPTICAL_FEED: LIVE</span>
      </div>

      <div className="absolute top-5 right-14 text-[9px] font-mono text-cyan-400/70 tracking-wider">
        SYS_STATUS: 60FPS
      </div>

      <div className="absolute bottom-5 inset-x-0 text-center">
        <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-[11px] font-mono text-cyan-300 font-semibold tracking-wider shadow-lg">
          ARAHKAN KARTU PELAJAR KE DALAM KOTAK
        </span>
      </div>

      <style>{`
        @keyframes laserScan {
          0% { top: 18%; opacity: 0.4; }
          50% { opacity: 1; }
          100% { top: 80%; opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
