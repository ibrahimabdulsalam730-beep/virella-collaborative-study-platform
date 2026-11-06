"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useIntroPhase } from "@/components/intro/IntroController";
import { ArrowRight, Star, Users, RotateCcw } from "lucide-react";

// Lazy-load Three.js Bonsai Canvas with ssr: false and minimal dark placeholder
const BonsaiHeroTree = dynamic(
  () => import("@/components/tree/BonsaiHeroTree"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-square max-h-[580px] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border border-purple-500/20 animate-pulse bg-purple-950/20" />
      </div>
    ),
  }
);

/**
 * Stagger-reveal wrapper.
 * Fades in and slides up 24px, 0.1s apart, once `revealed` is true.
 * Uses opacity and transform so layout space is strictly preserved without shift.
 */
function RevealItem({
  children,
  index = 0,
  revealed,
  className = "",
}: {
  children: React.ReactNode;
  index?: number;
  revealed: boolean;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translate3d(0, 0, 0)" : "translate3d(0, 24px, 0)",
        pointerEvents: revealed ? "auto" : "none",
        transition: revealed
          ? `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${
              index * 0.1
            }s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`
          : "none",
      }}
    >
      {children}
    </div>
  );
}

export default function HeroSection() {
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const { phase, notifyTreeProgress, replayIntro } = useIntroPhase();

  // Content reveals at Step 4 ('siteReveal' or 'done')
  const revealed = phase === "siteReveal" || phase === "done";

  // Tree is rendered and grows in Step 3 ('treeGrow'), Step 4 ('siteReveal'), and Step 5 ('done')
  const treeActive =
    phase === "treeGrow" || phase === "siteReveal" || phase === "done";

  return (
    <section className="relative overflow-hidden pt-8 pb-20 md:pt-14 md:pb-28 bg-hero-grid bg-violet-radial">
      {/* 1px top border grid line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

          {/* ─── LEFT COLUMN: Heading, Subtitle, CTA, Rating ─── */}
          <div className="lg:col-span-6 flex flex-col items-start z-10">

            {/* Bracket Label */}
            <RevealItem index={1} revealed={revealed}>
              <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/40 border border-purple-500/20 text-[#c084fc] font-mono text-xs tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b4f000]" />
                <span>[ REAL-TIME COGNITIVE PLATFORM ]</span>
              </div>
            </RevealItem>

            {/* Main Heading */}
            <RevealItem index={1} revealed={revealed}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.12] mb-6">
                Turning Focus Into <br />
                <span className="font-semibold bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                  Collective Mastery
                </span>
              </h1>
            </RevealItem>

            {/* Subtitle */}
            <RevealItem index={2} revealed={revealed}>
              <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-xl mb-8">
                Empowering students and peer study groups to collaborate, test, and master complex subjects through live synchronized rooms with 3D growth and AI pedagogy.
              </p>
            </RevealItem>

            {/* CTA Buttons & Room Code Input */}
            <RevealItem index={3} revealed={revealed} className="w-full">
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-10">
                <Link
                  href="/rooms?action=create"
                  className="btn-pill-lime text-sm px-6 py-3.5 shadow-lg group w-full sm:w-auto text-center flex items-center justify-center gap-2"
                >
                  <span>Create Study Room</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Enter Room Code (e.g. SYNC-402)"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    className="bg-white/[0.04] border border-white/10 rounded-full px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#b4f000]/60 transition-colors font-mono uppercase tracking-wider w-full sm:w-48"
                  />
                  <Link
                    href={`/rooms/${roomCodeInput ? roomCodeInput : "DEMO-101"}`}
                    className="btn-pill-dark text-xs py-3 px-4 shrink-0"
                  >
                    <span>Join</span>
                  </Link>
                </div>
              </div>
            </RevealItem>

            {/* Rating / Social Proof */}
            <RevealItem index={5} revealed={revealed} className="w-full">
              <div className="flex items-center gap-4 pt-6 border-t border-white/[0.08] w-full">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-semibold text-white tracking-tight">4.9</span>
                  <div className="flex text-[#b4f000]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-xs text-slate-400 leading-snug">
                  Trusted by 28,000+ students across top STEM cohorts &amp; medical universities.
                </div>
              </div>
            </RevealItem>

            {/* Bottom Pill Row: Technique Bracket Tags */}
            <RevealItem index={5} revealed={revealed}>
              <div className="flex flex-wrap gap-2 mt-6">
                {[
                  "Pomodoro Sync",
                  "Shared Whiteboard",
                  "Feynman Rounds",
                  "Active Recall",
                  "Proctored Exam",
                ].map((tag, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[11px] text-slate-400 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-md"
                  >
                    [ {tag} ]
                  </span>
                ))}
              </div>
            </RevealItem>

          </div>

          {/* ─── RIGHT COLUMN: Tree Column, Dashboard Mockup & Floating Stat Card ─── */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center gap-6">
            <div className="w-full max-w-[620px] aspect-square relative">
              {/* Bonsai Hero Tree Container: active during treeGrow, siteReveal, and done */}
              {treeActive && (
                <BonsaiHeroTree onProgress={notifyTreeProgress} />
              )}

              {/* Floating Stat Card (Reveals at Index 4) */}
              <RevealItem
                index={4}
                revealed={revealed}
                className="absolute top-4 right-2 sm:right-6 w-52 pointer-events-auto"
              >
                <div className="glass-panel rounded-2xl p-4 border border-white/10 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-mono uppercase tracking-wider text-purple-300">
                      [ SESSION STATE ]
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#b4f000] animate-ping" />
                  </div>

                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-3xl font-light text-white tracking-tight">
                      4,281
                    </span>
                    <span className="text-xs font-mono text-[#b4f000]">mins</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between mb-3">
                    <span>Group Deep Focus</span>
                    <span className="text-emerald-400 font-medium">98.4% Sync</span>
                  </div>

                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-[#b4f000] w-[82%]" />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/[0.07] flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>6 in room</span>
                    </div>
                    <span className="font-mono text-[#b4f000] text-[10px]">
                      POMODORO #3
                    </span>
                  </div>
                </div>
              </RevealItem>

            </div>

            {/* Dashboard Mockup Image (Reveals at Index 6) */}
            <RevealItem
              index={6}
              revealed={revealed}
              className="w-full max-w-[560px] pointer-events-auto"
            >
              <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero-dashboard-mockup.jpg"
                  alt="Virella Study platform dashboard showing shared whiteboard, Pomodoro timer, session members, and cognitive technique cards"
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  style={{ aspectRatio: "16/9" }}
                />
                {/* Subtle top gradient fade */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#05050a]/30 via-transparent to-[#05050a]/50 pointer-events-none" />
                {/* Live indicator pill */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b4f000] animate-ping" />
                  <span className="text-[10px] font-mono text-[#b4f000] uppercase tracking-wider">Live Demo</span>
                </div>
              </div>
            </RevealItem>

          </div>

        </div>
      </div>
    </section>
  );
}
