"use client";

import React, { useEffect, useState, useRef } from "react";
import { IntroPhase } from "./IntroController";

interface IntroPreloaderProps {
  phase: IntroPhase;
  targetLogoRef: React.RefObject<HTMLDivElement | null>;
  onReadyToShrink: () => void;
  onLanded: () => void;
}

/**
 * 8 Petals / Rays for the Virella Asterisk Starburst (24x24 viewBox).
 * Radiates outwards from center (12, 12).
 */
const PETALS = [
  { id: 0, d: "M12 12 L12 2", angle: 0 },
  { id: 1, d: "M12 12 L19.07 4.93", angle: 45 },
  { id: 2, d: "M12 12 L22 12", angle: 90 },
  { id: 3, d: "M12 12 L19.07 19.07", angle: 135 },
  { id: 4, d: "M12 12 L12 22", angle: 180 },
  { id: 5, d: "M12 12 L4.93 19.07", angle: 225 },
  { id: 6, d: "M12 12 L2 12", angle: 270 },
  { id: 7, d: "M12 12 L4.93 4.93", angle: 315 },
];

export default function IntroPreloader({
  phase,
  targetLogoRef,
  onReadyToShrink,
  onLanded,
}: IntroPreloaderProps) {
  // Dimension state for the large centered preloader logo
  const [bigSize, setBigSize] = useState(320);
  const [petalsDrawn, setPetalsDrawn] = useState(false);
  const [shrinkTransform, setShrinkTransform] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute 45vmin size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      // 45vmin, clamped between 220px and 440px
      const calculated = Math.max(220, Math.min(440, Math.round(vmin * 0.45)));
      setBigSize(calculated);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Step 1: Animate petals in, wait minimum 1.8s, then trigger shrink
  useEffect(() => {
    // Staggered draw begins immediately
    const drawTimer = setTimeout(() => {
      setPetalsDrawn(true);
    }, 100);

    // Hold for 1.8s - 2.0s before starting shrink transition
    const holdTimer = setTimeout(() => {
      onReadyToShrink();
    }, 1900);

    return () => {
      clearTimeout(drawTimer);
      clearTimeout(holdTimer);
    };
  }, [onReadyToShrink]);

  // Step 2: Shared-element transition measurement when entering 'logoShrink'
  useEffect(() => {
    if (phase !== "logoShrink") return;

    // Find target navbar logo rect
    let targetRect = targetLogoRef.current?.getBoundingClientRect();
    if (!targetRect || targetRect.width === 0) {
      // Fallback: estimate top center navbar position
      targetRect = {
        top: 18,
        left: window.innerWidth / 2 - 20,
        width: 40,
        height: 40,
        right: window.innerWidth / 2 + 20,
        bottom: 58,
        x: window.innerWidth / 2 - 20,
        y: 18,
        toJSON: () => {},
      };
    }

    const startCenterX = window.innerWidth / 2;
    const startCenterY = window.innerHeight / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const deltaX = targetCenterX - startCenterX;
    const deltaY = targetCenterY - startCenterY;
    const scaleRatio = targetRect.width / bigSize;

    // Next frame: apply cubic-bezier transition to target coordinates
    const raf = requestAnimationFrame(() => {
      setShrinkTransform(
        `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleRatio})`
      );
    });

    // When 1000ms transition completes: swap with navbar logo and unmount
    const landTimer = setTimeout(() => {
      onLanded();
    }, 1020);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(landTimer);
    };
  }, [phase, bigSize, targetLogoRef, onLanded]);

  const isShrinking = phase === "logoShrink";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden flex items-center justify-center"
      style={{
        backgroundColor: "#05050a",
        opacity: isShrinking ? 0 : 1,
        transition: isShrinking
          ? "opacity 1000ms cubic-bezier(0.76, 0, 0.24, 1)"
          : "none",
      }}
      aria-label="Virella Study cinematic intro"
      role="status"
    >
      {/* Background Soft Purple Glow in center of stage */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.18) 0%, rgba(109, 40, 217, 0.06) 40%, transparent 70%)",
          opacity: isShrinking ? 0 : 1,
          transition: isShrinking ? "opacity 800ms ease-out" : "none",
        }}
      />

      {/* SHARED-ELEMENT LOGO WRAPPER */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: bigSize,
          height: bigSize,
          marginLeft: -bigSize / 2,
          marginTop: -bigSize / 2,
          transform: shrinkTransform || "translate3d(0, 0, 0) scale(1)",
          transition: isShrinking
            ? "transform 1000ms cubic-bezier(0.76, 0, 0.24, 1)"
            : "none",
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {/* ROTATING ASTERISK CONTAINER */}
        <div
          className="w-full h-full relative flex items-center justify-center"
          style={{
            animation: isShrinking
              ? "none"
              : "cinematicPreloadSpin 18s linear infinite",
          }}
        >
          {/* Crisp SVG with explicit viewBox: 0 0 24 24 */}
          <svg
            viewBox="0 0 24 24"
            width={bigSize}
            height={bigSize}
            className="w-full h-full overflow-visible"
            fill="none"
          >
            {/* Outer subtle violet glow ring */}
            <circle
              cx="12"
              cy="12"
              r="10.5"
              stroke="#9333ea"
              strokeWidth="0.6"
              strokeOpacity="0.25"
              className={isShrinking ? "opacity-0 transition-opacity duration-300" : ""}
            />

            {/* 8 Petals: Staggered draw & scale-in */}
            {PETALS.map((petal, index) => (
              <path
                key={petal.id}
                d={petal.d}
                stroke="#b4f000"
                strokeWidth="2.2"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 12,
                  strokeDashoffset: petalsDrawn ? 0 : 12,
                  transition: `stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${
                    index * 0.08
                  }s`,
                  filter: "drop-shadow(0 0 6px rgba(180, 240, 0, 0.6))",
                }}
              />
            ))}

            {/* Center Glowing Core */}
            <circle
              cx="12"
              cy="12"
              r="2"
              fill="#b4f000"
              style={{
                transformOrigin: "12px 12px",
                transform: petalsDrawn ? "scale(1)" : "scale(0)",
                transition: "transform 0.4s ease-out 0.2s",
                filter: "drop-shadow(0 0 8px rgba(180, 240, 0, 0.9))",
              }}
            />
          </svg>
        </div>
      </div>

      {/* Brand Wordmark & Loading Indicator (Fades out when shrink starts) */}
      <div
        className="absolute bottom-16 flex flex-col items-center gap-2 pointer-events-none"
        style={{
          opacity: isShrinking ? 0 : 1,
          transform: isShrinking ? "translateY(16px)" : "translateY(0)",
          transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
        }}
      >
        <div className="text-white font-medium text-sm tracking-widest uppercase flex items-center gap-2">
          <span>Virella</span>
          <span className="text-[#b4f000] font-mono text-xs">[STUDY]</span>
        </div>
        <div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#b4f000]/60"
              style={{
                animation: `preloaderPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes cinematicPreloadSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes preloaderPulse {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          50%      { transform: scale(1.3); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes cinematicPreloadSpin { 0%, 100% { transform: none; } }
          @keyframes preloaderPulse { 0%, 100% { opacity: 0.5; } }
        }
      `}</style>
    </div>
  );
}
