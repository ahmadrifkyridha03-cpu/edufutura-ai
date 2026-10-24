import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HeroHologramOrbProps {
  className?: string;
  isProcessing?: boolean;
  size?: number;
}

export const HeroHologramOrb: React.FC<HeroHologramOrbProps> = ({
  className = "",
  isProcessing = false,
  size = 280
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "Interactive 3D Hologram AI Core");
    container.appendChild(renderer.domElement);

    // Group for all rotating elements
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // 1. Inner Core (Luminescent Energy Sphere)
    const coreGeo = new THREE.IcosahedronGeometry(0.9, 3);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Neon Cyan
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    orbGroup.add(coreMesh);

    // 2. Solid inner glowing orb
    const innerGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6, // Cyber Violet
      transparent: true,
      opacity: 0.4
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    orbGroup.add(innerMesh);

    // 3. Outer Polyhedral Cage (Tech Lattice)
    const cageGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7, // Radiant Violet
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    orbGroup.add(cageMesh);

    // 4. Orbital Ring 1 (Equatorial Gyroscope)
    const ring1Geo = new THREE.TorusGeometry(1.6, 0.02, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = Math.PI / 2.8;
    orbGroup.add(ring1Mesh);

    // 5. Orbital Ring 2 (Polar Orbit)
    const ring2Geo = new THREE.TorusGeometry(1.75, 0.015, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber Gold Accent
      transparent: true,
      opacity: 0.55
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.y = Math.PI / 3;
    ring2Mesh.rotation.x = Math.PI / 6;
    orbGroup.add(ring2Mesh);

    // 6. Quantum Particle Cloud
    const particleCount = 280;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const radius = THREE.MathUtils.randFloat(1.4, 2.2);

      particlePositions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.cos(theta);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particleCloud = new THREE.Points(particleGeo, particleMat);
    orbGroup.add(particleCloud);

    // Mouse / Touch Interaction Tracking
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);

      targetRotation.current.x = normY * 0.75;
      targetRotation.current.y = normX * 0.75;
    };

    const handlePointerLeave = () => {
      targetRotation.current.x = 0;
      targetRotation.current.y = 0;
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("mouseleave", handlePointerLeave);
    container.addEventListener("touchmove", handlePointerMove, { passive: true });
    container.addEventListener("touchend", handlePointerLeave);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth damping interpolation (Lerp)
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.05;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.05;

      const baseSpeed = prefersReducedMotion ? 0 : isProcessing ? 2.5 : 1.0;

      // Rotate group towards pointer with ambient floating rotation
      orbGroup.rotation.x = currentRotation.current.x + Math.sin(elapsedTime * 0.5) * 0.1;
      orbGroup.rotation.y = currentRotation.current.y + elapsedTime * 0.35 * baseSpeed;

      // Independent sub-layer rotations
      coreMesh.rotation.y -= 0.015 * baseSpeed;
      coreMesh.rotation.z += 0.01 * baseSpeed;
      cageMesh.rotation.y += 0.008 * baseSpeed;
      cageMesh.rotation.x -= 0.005 * baseSpeed;
      ring1Mesh.rotation.z += 0.02 * baseSpeed;
      ring2Mesh.rotation.z -= 0.015 * baseSpeed;
      particleCloud.rotation.y += 0.005 * baseSpeed;

      // Breathing scale effect
      const breathe = 1 + Math.sin(elapsedTime * 2) * 0.04;
      innerMesh.scale.set(breathe, breathe, breathe);

      // Color shift when processing
      if (isProcessing) {
        coreMat.color.setHex(0xf59e0b); // Pulsing Amber when AI generating
        particleMat.color.setHex(0xf43f5e);
      } else {
        coreMat.color.setHex(0x06b6d4); // Cool Cyan
        particleMat.color.setHex(0x67e8f9);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle container resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || size;
      const newH = container.clientHeight || size;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("mouseleave", handlePointerLeave);
      container.removeEventListener("touchmove", handlePointerMove);
      container.removeEventListener("touchend", handlePointerLeave);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Three.js objects
      [coreGeo, innerGeo, cageGeo, ring1Geo, ring2Geo, particleGeo].forEach(g => g.dispose());
      [coreMat, innerMat, cageMat, ring1Mat, ring2Mat, particleMat].forEach(m => m.dispose());
      renderer.dispose();
    };
  }, [size, isProcessing]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: size, height: size }}
    >
      {/* Ambient background glow effect */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isProcessing
            ? "bg-amber-500/25 scale-110"
            : isHovered
            ? "bg-violet-600/30 scale-105"
            : "bg-cyan-500/15 scale-95"
        }`} 
      />

      {/* WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" />

      {/* Holographic Status Pill */}
      <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono font-semibold tracking-wider text-cyan-400 flex items-center space-x-1.5 shadow-lg shadow-cyan-950/50 z-20 pointer-events-none">
        <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? "bg-amber-400 animate-ping" : "bg-cyan-400 animate-pulse"}`} />
        <span>{isProcessing ? "AI_PROCESSING..." : "CORE_ONLINE"}</span>
      </div>
    </div>
  );
};
