"use client";

import React, { useEffect, useState } from "react";

interface IntroLoaderProps {
  onExit: () => void;
}

/**
 * Phase 1 + 2: Centered dark loader with fixed-size logo.
 * Stays for ~1.5s then fades out over 0.5s before calling onExit.
 */
export default function IntroLoader({ onExit }: IntroLoaderProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 1.5s hold, then start 0.5s fade-out
    const holdTimer = setTimeout(() => {
      setFading(true);
    }, 1500);

    // After fade-out, unmount
    const exitTimer = setTimeout(() => {
      onExit();
    }, 2050); // 1500 + 500 + 50 buffer

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [onExit]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#060509] flex flex-col items-center justify-center"
      style={{
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 0.5s ease-out" : "none",
        pointerEvents: "all",
      }}
      aria-label="Loading Virella Study"
      role="status"
    >
      {/* Fixed-size logo — 72px, explicit SVG viewBox so it never crops */}
      <div
        style={{
          width: 72,
          height: 72,
          animation: "loaderSpin 3s linear infinite",
        }}
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {/* Outer glow ring */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="rgba(147,51,234,0.18)"
            strokeWidth="1"
          />
          {/* 8-ray starburst */}
          <path
            d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
            stroke="#b4f000"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx="12" cy="12" r="1.5" fill="#b4f000" />
        </svg>
      </div>

      {/* Wordmark */}
      <div
        className="mt-5 text-white font-bold text-lg tracking-tight"
        style={{ opacity: fading ? 0 : 1, transition: "opacity 0.3s" }}
      >
        Virella{" "}
        <span className="text-[#b4f000] font-mono text-xs tracking-widest font-normal uppercase">
          [STUDY]
        </span>
      </div>

      {/* Subtle loading dots */}
      <div
        className="mt-3 flex gap-1.5"
        style={{ opacity: fading ? 0 : 0.6, transition: "opacity 0.3s" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-1 h-1 rounded-full bg-purple-400"
            style={{
              animation: `loaderDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Keyframe styles injected inline so no Tailwind config required */}
      <style>{`
        @keyframes loaderSpin {
          0%   { transform: rotate(0deg) scale(1); }
          25%  { transform: rotate(90deg) scale(1.08); }
          50%  { transform: rotate(180deg) scale(1); }
          75%  { transform: rotate(270deg) scale(1.08); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes loaderDot {
          0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
          40%            { transform: scale(1.5); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes loaderSpin { 0%, 100% { transform: none; } }
          @keyframes loaderDot  { 0%, 100% { opacity: 0.4; } }
        }
      `}</style>
    </div>
  );
}
