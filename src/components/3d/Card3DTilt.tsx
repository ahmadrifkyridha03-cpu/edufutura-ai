import React, { useRef, useState, useCallback } from "react";

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "violet" | "amber" | "emerald" | "none";
  maxTilt?: number;
  disabled?: boolean;
  onClick?: () => void;
}

export const Card3DTilt: React.FC<Card3DTiltProps> = ({
  children,
  className = "",
  glowColor = "cyan",
  maxTilt = 7,
  disabled = false,
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = (x / rect.width) * 2 - 1;
      const normY = (y / rect.height) * 2 - 1;

      setTilt({
        x: -normY * maxTilt,
        y: normX * maxTilt
      });

      setGlare({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 0.18
      });
    },
    [disabled, maxTilt]
  );

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  const glowStyles = {
    cyan: "hover:border-cyan-500/40 hover:shadow-[0_12px_36px_-6px_rgba(6,182,212,0.25)]",
    violet: "hover:border-violet-500/40 hover:shadow-[0_12px_36px_-6px_rgba(139,92,246,0.25)]",
    amber: "hover:border-amber-500/40 hover:shadow-[0_12px_36px_-6px_rgba(245,158,11,0.25)]",
    emerald: "hover:border-emerald-500/40 hover:shadow-[0_12px_36px_-6px_rgba(16,185,129,0.25)]",
    none: ""
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.015, 1.015, 1.015)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: isHovered
          ? "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)"
          : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease"
      }}
      className={`relative rounded-2xl overflow-hidden ${glowStyles[glowColor]} ${className}`}
    >
      {/* Dynamic Specular Glare Layer */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.22) 0%, transparent 65%)`
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};
